# 会话与历史（SESSION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。
> **命名口径**（2026-09-28 用户裁定）：会话侧的 `{hash}.json.manifest`（用户目录 `~/.thincoder/sessions/`）一律称「**会话账本**」（会话级槽索引）——与项目状态档 `PROJECT-MANIFEST.json`（项目根 · 工程机制用）**两概念两文件两目录，无任何关系**；本档正文历史用词「manifest」（含 `loadManifest` / `saveManifest` 等符号名）均指会话账本。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 会话数据层 | `thincoder-core/session.mjs` · `session-store.mjs` · `session-segments.mjs` · `session-guard.mjs` · `session-migrate.mjs` · `session-rename.mjs` | `thincoder-vscode/src/extension/session-io.mjs` · `session-slot-write.mjs`（记录存储内联） |
| 槽位 | `thincoder-core/session-slots.mjs` | `thincoder-vscode/src/extension/session-slots.mjs` |
| 清理 | `thincoder-core/session-gc.mjs`（+ `session gc` 子命令） | `thincoder-vscode/src/extension/session-gc.mjs` |
| 历史读取工具 | `src/agent-tools/read-history.mjs` | 同名（同路径对） |

> **口径 / as-of（2026-09-28 补）**：本表 = 拆档时（2026-09-13）由本档行内容的路径归纳，**路径形为迁移前**（CLI 侧会话实现住 `src/**`）——**非现行全图**。
> **现行模块清单**（含拆档后新增 / 拆分产物）看 §6 各节坐标：`thincoder-core/session-lifecycle.mjs`（§6.22 / §6.24）· `session-slots-manifest.mjs`（§6.23）· `session-stale.mjs`（§6.17）· `session-index*.mjs` / `fts-text.mjs`（§6.19）· `session-slot-scan.mjs`（§6.22）· `session-slot-verify.mjs`（§6.25）。
> `read-history` 现行路径 = `thincoder-core/agent-tools/read-history.mjs`（上表第 4 行 = 迁移前形态）。

**存储契约**：两端读写同一批档同一 `version`（1 / 2）——同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 89 | `agent-tools/read-history.mjs` | 同路径 | 0.3881 · 异 | ③ | 进核 | 以 CLI 为准（相对路径按 cwd 解析 + 宽松版本校验 + 磁盘全量可查） | 分叉 ＝ ① 相对路径解析 ② 版本校验口径（`version` 1/2）③ 本会话可查范围——CLI 流式迭代磁盘 `src/agent-tools/read-history.mjs:295-304` / VSC 只读内存 `:260`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 123 | `thincoder-core/session.mjs` ↔ `thincoder-vscode/src/extension/session-io.mjs` | ② | 融合：数据层取一侧 + VSC 的 `history-window` 拆面按核内结构归位 | 分叉 ＝ 目录归属（VSC 住 `extension/`）；存储契约两端自述同格式（同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`——VSC 头注 `:2-8`）⇒ 前提成立 | — | S1（建核补齐） |
| 124 | `src/session-slots.mjs` ↔ `thincoder-vscode/src/extension/session-slots.mjs` | ② | 融合：取一侧（slot / manifest / 认领 / 属主判定） | 分叉 ＝ 目录归属；头注互指「同构镜像」（CLI `src/session-slots.mjs:19` / VSC `:21`）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 125 | `thincoder-core/session-gc.mjs` ↔ `thincoder-vscode/src/extension/session-gc.mjs` | ② | 融合：取一侧；冷 cwd 手动面 = **双端同面**（2026-09-21 端差注销——VSC 补命令入口走数据面 API；判据 / 执行面单源见 §6.17） | 分叉 ＝ 目录归属（端壳档纯转口重导出核五名）；保留期 / 阈值两端同值 ⇒ 前提成立 | — | S1（建核补齐） |
| 126 | `src/session-store.mjs` ↔ `thincoder-vscode/src/extension/session-slot-write.mjs` | ② | 融合：核内单一记录存储 + 槽写入面归位 | 分叉 ＝ 切分与目录归属（VSC 记录存储内联于槽写面）；槽写语义两端同 ⇒ 前提成立 | — | S1（建核补齐） |
| 127 | `src/session-segments.mjs` · `session-guard.mjs` · `session-rename.mjs` · `session-migrate.mjs` ↔ 核内（VSC 侧内联于 `session-io` / `session-slots`） | ② | 融合：按核内结构归位（段 / 归属守卫 / 改名 / 旧短哈希迁移四面各保留） | 分叉 ＝ 拆档粒度（VSC 未拆）；能力面逐条对位（VSC `thincoder-vscode/src/extension/session-io.mjs:92-113` 迁移遍 / `:399` 改名枚举同构）⇒ 前提成立 | — | S1（建核补齐） |

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
**本批（SESSION-INDEX · 2026-09-22）落点表** = `docs/batches/2026-09-22-session-index.md` §2（唯一承载面——一次性批次材料）；本档 §6.19 承载机制判据句 / 取源与水位 / 重建面 / 查询面路由 / 边界情形 / 验收回指。
**本批（SLOT-END-PARAM · 2026-09-25）落点表** = `docs/batches/2026-09-25-slot-end-param.md` §2（唯一承载面——一次性批次材料）；本档 §6.20 承载端名参数化判据句 / 创建端字段取值链 / 端差注销 / 边界情形 / 验收回指。
**本批（桌面批 B · 2026-09-27）落点表** = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2（唯一承载面——一次性批次材料）；本档 §6.21 承载槽字段 / 写出口 / 档位归一 / 施加面 / 边界情形 / 验收回指。
**本批（SESSION-LIST-DISK · 2026-09-28）落点表** = `docs/batches/2026-09-28-session-list-disk.md` §2（唯一承载面——一次性批次材料）；本档 §6.22 承载条目来源判据 / 元数据取数链与读放大上界 / 降级阶梯 / 可达性扩展 / 消费面零改 / 边界情形 / 验收回指。
**本批（MANIFEST-WRITE-GUARD · 2026-09-28）落点表** = `docs/batches/2026-09-28-manifest-write-guard.md` §2（唯一承载面——一次性批次材料）；本档 §6.23 承载写前分类判据 / 拒写与现场保全 / loud 信号 / 自愈明裁 / 与 §6.22 零交叠 / 边界情形 / 验收回指。
**本批（桌面残余批 · D17 恢复态播种 / D19 用户块 md 深度 · 2026-09-28）落点表** = `docs/batches/2026-09-28-desktop-residuals.md` §2（唯一承载面——一次性批次材料）；本档 §6.24 承载打开态读数出口 / 同源同式三事 / 端壳转口 / 边界情形 / 验收回指。
**本批（LEDGER-RELIABILITY · 2026-09-28）落点表** = `docs/batches/2026-09-28-ledger-reliability.md` §2（唯一承载面——一次性批次材料）；本档 §6.25 承载零权威 / 可重建全自动 / 丢失自愈两落点与预算 / 失效可见 / 写安全判据句 + 边界情形 + 验收回指。
**本批（跨端消化面恢复 · 2026-09-30）落点表** = `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2（唯一承载面——一次性批次材料）；本档 §6.26 承载机制单源（记录形 ∥ 写缝 ∥ 读缝契约 ∥ 端侧重建义务 ∥ 容差登记 ∥ 读面 delta）+ 验收回指。
**本批（会话选定写回 · default-model-carryover · 2026-10-03）落点表** = `docs/batches/2026-10-03-default-model-carryover.md` §2（唯一承载面——一次性批次材料；含受影响文件行数 ∥ 增量）；本档 §6.21 承载判据句 6 / 边界情形表选定写回三行 / 验收回指 ⑤。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/SESSION.md`（866 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：已作废 / 旧结构叙述（(d) 类）· 一次性批次材料（受影响文件表 / 用例表 / AC 表 / 变更流水账）· 时点状态行与交付核销标记。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧会话实现住 `src/**`）——本节一律按**现状路径**落笔（会话数据层住 `thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 存储模型

- **按 cwd 隔离**：会话目录 `~/.thincoder/sessions/`——文件前缀 = cwd 的 **40 位完整 sha1**（非截断）。
- **Windows 盘符大写归一化**：CLI `process.cwd()` 与 VS Code `uri.fsPath` 算出的盘符大小写不同，归一化保证两端得到同一 hash。
- **槽位制、无「当前文件」**：`{hash}.json.N` = 第 N 槽位的完整会话（**清单条目集的本体**——盘面实读，§6.22）；`{hash}.json.manifest` = 槽位摘要缓存 + active 指针 + 进程认领表 `slotSessions`。
- **active = 共享当前指针**（**不是「当前会话」**）：旧版端 / ACP 的恢复依据 + 无记录端的一次性继承源 + 列表回退高亮；**本端恢复依据 = 本端 end marker**（§6.10），不再以 active 为第一依据。
- **文件无上限**：槽位按需递增（`/session` 查看 / 切换，`/new` 开新槽）。
- **旧格式迁移**（`thincoder-core/session-migrate.mjs`）：12 位短 hash（VSC 历史 16 位）文件**一次性**重命名为 40 位（幂等、首次访问时执行）；legacy `{hash}.json`（v1 单会话）读取时迁移进槽位。
- 目录形态：

```
~/.thincoder/sessions/
  {hash}.json.N                    # 槽位会话文件（N 从 1 递增）
  {hash}.json.manifest             # 槽位摘要缓存 + active 指针 + slotSessions 认领表（条目集以盘面为准——§6.22）
  {hash}.json.manifest.<端名>       # 本端记录 end marker（端名闭集 = cli / vscode / desktop——§6.10 D-1 · 各端单写者）
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
- **slot 粘性**：`saveSession` 首次认领后缓存 `agent._slot`，**永不重跑** ensureActive（触发场景：并发方在保存间翻动 manifest active ⇒ 重推 ensureActive 会让会话静默迁移 → 双副本 / 覆盖他人）；`applySession` 清空缓存；ACP 加载路径显式钉回目标槽。
- **ACP 同进程多会话**：`session/new` 立即钉独立槽；load/resume 钉槽前查 `sameProcessPinned`（同槽占用 → 显式 fork 新槽）；**绝不 `_slot = null` 等下次保存**（会落回同进程 active 槽即他人槽）；`session/delete` 删非 active 槽时立即重钉。
- **`slotOccupancy`**：目标槽是否被**另一活进程**占用——**排除本进程属主**；探测 = **入口一次有界批量束**（`probeOwnersSync`，零逐 pid exec）；**探测失败 ⇒ `{ occupied: true, unknown: true }`（保守：未知不得认领、不报空闲——D-MI10 同向）**。

- **认领释放（F-CR1 · 2026-09-21 · SESSION-CLAIM 批）**：认领**随绑定走**——绑定迁移落点执行「释放本进程残留认领」。**保留集公式** = 落点槽 ∪ 本进程其余活绑定槽（同 cwd manifest 内）⇒ 释放谓词 = `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；目标被占 ⇒ 保留集 = 空。各落点 = 公式代入（`newSession` ⇒ {新槽} · `switchToSlot` 未占 ⇒ {目标} / 被占 ⇒ 空 · `claimSlot` ⇒ {认领槽}）；活绑定集口径 per end 见 §6.16。
- 落点 = 三个核原语 + 端壳对应件（对称）：`newSession` 的 `releaseStale` 选项由**调用面 opt-in**（CLI `/new` 传、ACP 不传）· VSC 端壳 `newSlot` / `switchToSlot` / `resumeSlot` 包装同判据（§6.15）。
- **ACP 释放面（2026-09-22 · 台账 #168①）**：`session/close` ⇒ 释放该会话槽（保留集 = 本进程其余在存会话的活绑定槽 · 同 cwd）；
  其余可核调用面（`newSession` 四点 / `switchToSlot` / `claimSlot`——逐条实读零释放）= §6.16 表。
  落盘 = 释放集并入各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（**落盘判据三条**——写盘同一次 fresh 快照 / 值条件删除 / 内存认领表移除——见 §6.16）；`active` / `m.slots` / 槽文件 / 端标记一律不动（只删属主条目）。
  安全性：释放后他端可认领；本进程再切入 ⇒ `slotOccupancy` 判占 ⇒ 不认领 + 下次保存 fork ⇒ 零双写（互覆保护不依赖旧认领）。边界情形与不做面见 §6.16。

**写盘防护**：

- **原子写**：先写 `.tmp` 再 rename（跨盘失败降级 unlink+rename → 直写）——防中途崩溃产生截断 JSON。
- **`.corrupted` 兜底**：读失败的文件改名 `.corrupted` 保留现场、不覆盖；**损坏的 manifest 同样改名 `.manifest.corrupted`**（现场保全 + 解封下一写——读不可信的 manifest **拒绝写**而非覆盖，见 §6.23；列表本体住盘面（§6.22），摘要丢失的降级面 = 标题 / 计数落回退链）。
- **`.unreadable` 保留**：version / cwd / history 结构校验失败改名 `.unreadable` 保留现场（不静默返回 null）；**`version > 2` 的新版文件不动**；cwd 不匹配（别人的文件）也不动。
- **覆盖防护（`.bak` 轮转）**：写前校验目标槽 `sessionStart` 与本进程不符 → 先 rename `.bak-{ts}` 再写；**`version > 2` 的文件无论 sessionStart 一律轮转**；检查按 mtime 缓存避免每次保存全量解析。
- **`saveManifest` 条目级合并**（`{...fresh.slots, ...m.slots}`）：**删除意图经 `deletions` 参数显式表达**；**active 是单值**——只有显式翻指针的调用点（ensureActive 分支 / newSession / switchToSlot / deleteSlot 删到 active）传 `setActive`，其余调用点默认保留磁盘 fresh.active。合并仅在**可信基座**上进行（§6.23 判据句 1）：基座不可信 ⇒ 拒绝写、不整档替换。

### 6.3 会话文件内容（v2 · 双线结构）

字段集：`version`（1 = 旧单线；2 = 双线；> 2 只读不动）· `cwd` · `title` · `activeProvider` + `activeModel`（槽双字段**恒非空**——**限定 = 保存面成对写入**〔有 provider 即携带具体复合值〕；**全新空槽规范结构无此两键**）· `updatedAt` · `history`（人读线）· `contextHistory`（机读线）· `tasks`
· `planMode` · `autoApprove` · `engineering` · `engDesignToken` · `goal` · `advisor` · `pendingReminders` · `sessionStart`
· `effort`（会话级档位——值域 / 语义见 §6.21 判据句 1）· `createdBy`（创建端字段——§6.20 判据句 4；老槽可能无键 ⇒ 读数「未知」）。

- **双线写入契约**：真实消息（用户输入 / assistant 回复 / tool 结果 / 多模态图像）走 `pushReal` → 同时进 `history` 与 `contextHistory`；**机读消息**（`[System reminder:` / `[User interrupt:` / 压缩 note / task·plan 回注）只进机读线；**transient 消息**（编辑器上下文注入等）**人读线落盘时过滤**、**机读线保留**——恢复必须逐字节重建 provider 前缀缓存所见的序列。
- **`slimForDisplay`（人读线落盘瘦身）**：copy-on-write 映射（**绝不原地改**——两线共享对象引用）；assistant `tool_calls[].function.arguments` 截 300 字符；`tool` 消息 content 截 500 字符（head + 截断标记）；多模态 user content 数组保留 text part、**丢弃 image_url base64 part**；**`contextHistory` 一字不动**。
- **消息时间戳 `ts`**：每条真实消息 `pushReal` 单点打点（epoch ms）；压缩重建注入的 note 同刻打点；**「Understood」占位并入尾首 assistant 时随该条原 ts**
  （2026-09-16 并入分支——分支体（`applyCompression`）住 `thincoder-core/context.mjs`；占位常量 = `thincoder-core/context-echo.mjs`；`pushReal` 写缝 = `thincoder-core/context-push.mjs`——2026-10-01 拆分批 as-of）；**旧消息（恢复自存档）不补 ts**（补近似值误导取证）；
  `slimForDisplay` 保留 ts；ts 是**本地字段**（发送层剥离、UI 不渲染——仅 read_history 输出 / 会话 JSON 可见）。

### 6.4 保存与恢复

- **`saveSession`**：`history = (_fullHistory ?? history).filter(非 transient + 非 legacy-transient)`；`contextHistory = agent.history.filter(非 legacy-transient)`（**机读线保留 transient**）；
  写 `agent._slot` 槽（槽数据字段表含会话级偏好 `effort`——§6.21）+ 更新 manifest 摘要（`slotDigest`：messageCount / turnCount / firstMessage / activeProvider / title / `updatedAt`（**会话逻辑时**——槽数据更新时刻）+ `ts`（**摘要落盘时刻**）；
  `activeModel` / `createdBy` **有值才带**——§6.20 读面；字段单源 = `thincoder-core/session-slots-manifest.mjs:42-53`；`ts` / `updatedAt` 两时语义有别、**不可互替**——快路新鲜度判据 = `ts`（§6.22 判据句 2））；
返回轮转的 `.bak` 路径或 null。TUI 每次回合结束保存（崩溃最多丢半轮）。
- **恢复入口**：启动恢复（TUI）= `await resumeSlot(process.cwd())`（三支决策 + 认领 + 写本端 marker）→ `applySession` → `agent._slot = slot`（**首保存必落恢复槽**）；headless `thincoder chat` 不恢复。`loadSlotFile` = **无认领副作用**的槽文件读取器（version 1/2 + history 数组 + cwd 匹配）：结构不符 → `.unreadable`；解析失败 → `.tmp` 备份优先回退（回退成功则提升为正主）；
**主文件缺失时恢复孤儿 `.tmp`**。
- **`applySession`**：人读线 `_fullHistory` ← `data.history`；机读线 `agent.history` ← `data.contextHistory`（缺失/为空才回退 history 播种）；title / tasks / planMode / autoApprove / goal / pendingReminders / sessionStart / advisor / **effort**（会话级档位施加——§6.21）逐字段；`activeProvider ≠ 当前` 按名切回（找不到不回切）；
清 `_slot` / `_slotMtime` 与 `_compressFailures` / `_verifyRetries`。
- **机读线必须从 `contextHistory` 恢复**（从完整 history 重建会把已压缩的中间过程塞回上下文——实测 prompt 膨胀到 283%）。
- **v1 老文件回退播种**时剥离被 slim 截断的 `tool_calls.arguments`（以 `…` 结尾 → 置 `{}`——截断可劈断 `\uXXXX` 产生 400 毒载荷）。

### 6.5 切换与归档

- **`/new`**（`newSession` + `resetSessionState`）：分配新槽并**立即记录所有权**（防并发方认领）；**并释放本进程残留认领**（F-CR1——§6.2 公式代入：保留集 = {新槽}；`/new` 调用面传 `releaseStale`——见 §6.2 认领释放）；开头清理死主条目（连 `m.slots` 条目一并删、回收复用）；
`resetSessionState` 清 `_fullHistory` / `title` / `_sessionStart` / `_engDesignToken` / 压缩与验证计数 / `tasks` / `planMode` / `goal` / `reminders` / `_slotMtime` / `_slot` **以及进程级注入标志**（不清则新会话永不注入 OS/cwd reminder）；**不清 `autoApprove`**（用户偏好跨会话保持——有意）。
- **`/session`（`listSlots`）**：按 updatedAt 降序列出**全部槽位**（条目集 = 盘面实读——§6.22）；**只读操作不认领**（列表链零写：不认领、不写 manifest、零探测）。
- **`/session N`（`switchToSlot`）**：**直接 `loadSlotFile` 读目标槽**（不经 activeSlot——有认领副作用）；只改 manifest 指针、**无文件拷贝**；目标槽空闲则一并认领 + 释放本进程残留认领（§6.2 公式代入：保留集 = {目标槽}），被另一活进程占用则不认领且保留集 = 空（旧认领一并释放——下次保存 fork 既有语义）（`slotOccupancy` 提示）；随后 `applySession` 清空 `_slot` 缓存。
- **删除与退出**：`deleteSlot` 删文件 + 清 manifest 条目 + `deletions` 显式删除 + 删到 active 时置空 active 指针；删到本端记录槽 → marker 置 null（文件保留）；ACP `session/delete` 只删 archive，**在存会话立即 `newSession` 重钉**；`/exit` / Ctrl+C 只保存当前槽（**退出不归档**——避免「打开关掉就塞满槽位」）。

### 6.6 与 VS Code 的契约对齐点

- **基础契约**：cwd hash（40 位 sha1 + 盘符大写）· 槽位认领（slotSessions + 判活束 / `ownerState` 三态）· 双线落盘（`history` + `contextHistory`）· 旧格式回退（无 contextHistory → 从 history 播种）· transient 过滤（人读线过滤、机读线保留）· 本端记录 marker（形态 / 写者 / 置空语义双端一致）。
- **跨端共享契约增补**（2026-09-01 四模型共识）：`sessionStart` 打点（CLI `setup.mjs` 赋一次 / VSC `saveLines` 赋一次——**VSC 恒 null 则覆盖防护永不触发**）· legacy transient 过滤（读 loadSlotFile + 写 saveSession 双点）· 机读线判定（`contextHistory.length > 0`，否则 VSC 恢复空机器线）· v1 回退剥离截断 args · 同会话并发追加检测（VSC 磁盘 history 比待写快照长 → 轮转 `.bak`）· 
`activeModel` 双向 · manifest 死主清理（`deletions`）· `loadManifest` 容错（`!m.slots` → `{}`）· 读校验顺序（**cwd 先行**——「别人的文件不动」优先于结构校验）。
- **新字段双端同步条款**：CLI `saveSession` 全量覆盖写、VSC `saveLines` `...existing` 保留未知字段 ⇒ 两端字段集必须同步演进；任一端新增槽内字段须在同一变更中双端实现，否则 CLI 保存会**静默删除 VSC 侧新字段**。

### 6.7 会话标题生成

**链单源（三端同一套机制 · 2026-09-21 块标题行对齐批；2026-09-28 桌面接入）**：源 / 生成 / 触发 / 写 / 读·展示**五环**三端同源（谓词 ∈ 源、时点 ∈ 写），各端只留端壳（触发调用 + chrome）。

- **源 = 首条真实 user 消息**，谓词单源 = `isRealUserMsg`（`thincoder-core/history-window.mjs:17-19`：角色为 `user` ∧ content 为串 ∧ 非 `[System reminder:` 前缀）。
  CLI ∕ 桌面同经核件 `ensureSessionTitle`：绑定态取记录存储 `firstUserMessage()`（桌面绑定面 = `thincoder-desktop/src/main/session-io.mjs:25` 恒传槽）；
  未绑定（含桌面首回合新建态）回退内存人读线——`thincoder-core/generate-title.mjs:132-133`（新建态首条由 `pushReal` 落人读线——`thincoder-core/context-push.mjs:27-37`）；
  VSC 取内存人读线——端壳传原数组、以同一谓词取首条（`messages.find(isRealUserMsg)`，`thincoder-vscode/src/extension/panel-session-write.mjs:134`；**等价注**：端壳不按 `keepReal` 预过滤（该过滤属槽落盘面）；两路径标题源同经核谓词 `isRealUserMsg` ⇒ 今日等价）。
- **生成** = 核 `generateTitle(userContent, provider)`（`thincoder-core/generate-title.mjs:33`）：三格式分派 · **显式禁用思考**（OpenAI 兼容 body 加 `thinking:{type:"disabled"}`；anthropic / google 分支不传即不思考）· `max_tokens` 100 · 标题规范 ≤40 字符无引号 · 超时 10s · 失败静默返 null。
  三端同调该函数（CLI ∕ 桌面 = 核件直调——桌面触发 = `thincoder-desktop/src/main/turn-face.mjs` 回合尾结算；VSC 端壳 `thincoder-vscode/src/extension/generate-title.mjs` 只做 key / provider 解析——无第二请求实现）。
- **触发** = 会话**尚无标题**即尝试（一次成功即停；失败静默、下回合再试——三端同判据：CLI ∕ 桌面同经核 `ensureSessionTitle` 的 `title` 在场短路；VSC 端壳读槽 `title` 空判）。
- **写形 = 单写**：标题值随**回合尾整档 save** 落盘——CLI ∕ 桌面 `agent.title` → `saveSession(agent)`（`thincoder-core/session.mjs:125` 写 `title` 字段；桌面触发 = `thincoder-desktop/src/main/turn-face.mjs` 回合尾结算——标题先于落盘）；VSC `saveLines` 的 `extra.title`（`title: extra.title ?? existing.title ?? ""`）。三端均不为标题另开第二写。
- **时点** = 回合尾、整档 save **之前**生成（三端同序）；标题期 = busy 窗口（VSC 面另见 §6.15；桌面对位 = 在飞表未释 ⇒ 忙态受理入队——单源 = `docs/desktop/design/PROJECT.md` §2 KD-41）。
- **读 / 展示**：**列表面**（CLI `/session` / VSC `pushSessions` / 桌面 `sessions:list`）三端同读 `listSlots` 的标题（回退链 `title → firstMessage → "(empty)"`——VSC `pushSessions` 同链；桌面 = 核条目投影 `entry.title`——`thincoder-desktop/src/main/sessions.mjs:24`）；
  **常显 = 三端 chrome 常驻**（VSC 面板顶栏 / CLI 状态行段——CLI 段取值 = `agent.title` 活读 · 空值回退链（`sessionTitleFallback`——`firstMessage` ≤40 截断 ∥ `"(empty)"`；#677 I2 已落）；桌面 = 状态行 `title` 段与左列行 ∕ 标签条——三层同读 `sessions:list` 行源，
  落点 = `thincoder-desktop/renderer/views/statusline.mjs:181` ∕ `thincoder-desktop/renderer/views/sessions.mjs:257` ∕ `tabbar.mjs:92`；落点设计 = `docs/cli/design/TUI.md` §7.4；D8 消 · 2026-09-21）； （迁移期引文——档已删）
  空窗差（生成前 / 失败期）= **消（2026-09-30 · #677）**——CLI 段补同款回退链（`sessionTitleFallback`；I2 已落 · 对位 VSC `panel-session.mjs:235-243`）；三端同显回退值（VSC 顶栏 ∥ 桌面 `thincoder-desktop/renderer/views/statusline.mjs:181` ∥ CLI 段）；`/session` 列表按需面不变。
- **边界**：标题规范 / 超时 / 失败语义 / 手动重命名链（`renameSlot`）零改；机器注入消息（`[System reminder:` 前缀）永不入标题源。

### 6.8 会话恢复时 provider/model 无效 → 模型重选

触发场景：会话保存时用的 provider（或模型）已不存在，重进时 config 里已无 ⇒ 引导 UI 重选（TUI 不退出见 D-S2；headless 明确退出码见 D-S4）。

- **模型 = 显式复合 `provider:model`**：config 顶层 `defaultModel` 是**新会话起点**；会话槽 `activeProvider` + `activeModel` 双字段恒非空（**限定 = 保存面成对写入**〔有 provider 即携带具体复合值〕；**全新空槽规范结构无此两键**）——恢复 = 槽值（不看 config）。
- **D-S1 启动前校验**：`loadConfig` 对 defaultModel 缺失 / 无效**不再抛错**——运行时 provider = 统一解析（`resolveProviderPlan`）入选渠道；**不可运行 ⇒ 置空 `{}`** + `providerInvalidReason`（「无效」判据收窄为三类：空值 / 缺冒号或段残缺 / 未知 provider——**不含「候选外」**）；
  `validateProvider` 幂等（判据 = model / baseURL / name 缺失；**MODEL_SPECS 成员资格不是 allowlist**）。不抛错、不退出（统一解析 ∥ `providerState` 三值 `ok` ∥ `fallback` ∥ `invalid`——单源 = `doc:PROVIDER.md:§6.22`）。
- **TUI 路径**：仅在 `state === "invalid"`（无 provider/key）于 `startTUI` 前置 `agent.provider = null`（`fallback` 态 provider 有效——不清）。
- **D-S2 TUI 重选流程**：`startTUI` 首帧前按核统一态分流（单源 = `doc:PROVIDER.md:§6.22`）：
  **invalid 类**（`state === "invalid"` ∨ `providerInvalidReason` 非空——合成式单源 = `doc:PROVIDER.md:§6.22`）⇒ 弹模型选择 picker → 选定后继续正常启动；取消（Esc）⇒ **仍进入 TUI** + 提示行（措辞指渠道 ∕ 密钥——绝不因无 provider 拒绝进入）；
  **`fallback`**（无有效 defaultModel 但可运行）⇒ **不弹 picker**（不打断）+ 提示行明示（「尚未设置默认模型：本次使用 `<渠道>[:<模型>]`——/config → 默认模型 设置一次；/model 仅改本会话」；`model` 缺省 ⇒ 仅渠道名）；headless（D-S4）同态出 stderr 一行明示。
- **D-S3 恢复优先级**（`applySession`）：① 槽 `activeProvider` 在册**且持 key** → provider/model 按槽值设（槽 `activeModel` 缺省 = `defaultModel` 属本渠道 ⇒ 其模型段，
  否则回渠道默认单值——模型面单源 = `doc:PROVIDER.md:§6.22`）+ 重算 compactThreshold（auto 时）+ 返回 switched；**槽无 key ⇒ 跳过（落 config 链——不把不可运行渠道钉进运行态；跳过不写槽——原槽值保留）**；
  ② 槽 provider 没了 → **静默保持现状**（仅当两方都无效才弹）。
- **D-S4 headless**（`thincoder chat`）：遇 **invalid 类**（无 provider/key——不可运行）⇒ `console.error` 可读消息 + `exitSoon(1)`（不弹 UI、明确退出码）；**`fallback`（无有效 defaultModel 但可运行）⇒ stderr 一行明示 + 继续运行**（不退出——D-S2 同态同解）。
- **关键决策**：检测后置 provider = null（空对象流入下游是崩溃源）；校验点收敛到 assembleAgent 之后一处；**否决**启动即退出打印「请编辑 config」（TUI——绝不因无效态拒绝进入；headless 退出码归 D-S4）· **静默**回退首个持 key 渠道（回退可行——必带明示；静默形仍否）· 自动用 defaultModel 覆盖会话槽模型（用户上次明确选的模型不能静默丢）。
- 模型面机制权威（清单 provider 化 / 放行语义 / 渠道准入）+ **统一解析判据（回退序 / 两态分界 / 三端明示面）→ `PROVIDER.md` §6.22**（本节只承载会话恢复侧）。

### 6.9 消息时间戳与 read_history 工具

- **描述**：查本会话消息历史（`agent._fullHistory`——压缩不丢——审计完整）——回忆之前说过 / 做过的事（决策 / 工具时序 / 过去裁定）。
- **筛选**：role / keyword（content 子串）/ tool（工具消息 name）/ since / until（epoch ms）/ limit（**默认 50、上限 200**）/ direction（oldest|newest——默认 newest）。
- **时间窗**：since / until **inclusive-inclusive**；since > until → 空结果；排序按数组序（ts 仅过滤不重排）。
- **返回**：JSON 数组——`{ts, role, name?, tool_call_id?, content 截断, tool_calls}`；`tool_calls` = `[{name, arguments}]`（`arguments` = 存储串，上限 300 字符、超限加 `…`——§6.19 D-SE47；工具描述与用例同步）；内容逐条截断（~500 字符 + 标记）；无 ts 消息：不匹配时间窗 + 返回 `ts: null` 标记。
- **数据源** = `agent._fullHistory`；**readonly: true**（planMode 放行 / 免审批 / explore 只读集自动）；注册 = agent-tools 聚合 + setup——**depth-0 only**（子代理查父历史语义混淆）。

### 6.10 端分离恢复：本端 end marker

> 解决的问题：CLI 与 VSC 面板同开同一项目时，共享 manifest 的 active 指针两端互写——退出重进恢复进「另一个不是退出前」的会话。用户裁定：① 完全各记各的；② 迁移一次性继承（无本端记录时继承共享 active 的死主槽**一次**——记录写下后永久分离）。

- **D-1 记录形态**：路径 `{hash}.json.manifest.{端名}`（manifest 旁的独立小文件——**非 manifest 内嵌字段**；端名闭集 = `"cli"` / `"vscode"` / `"desktop"`）；内容 `{"slot": <number|null>, "updatedAt": <epoch ms>}`；**文件缺失 = 从未记录**（迁移窗口，可继承一次）；**`slot: null` = 显式置空**（删过本端槽）——两者必须区分；写者仅本端；
  读侧降级 = 缺失或解析失败一律按「缺失」处理（不 rename 不 unlink），`slot: null` 除外（**绝不继承**）；端名的进程级声明与 marker 家族端参数（判据单源）见 §6.20。
- **D-2 恢复决策**（`await resumeSlot(cwd) → {slot, data}`——**async**，2026-09-18 起）：① 本端记录可用（slot ≠ null 且槽文件在盘 且属主 空/死/本进程）→ 认领 + 读槽；② 记录缺失 → 一次性继承（m.active 在且文件在盘 且属主 空/死）→ 认领 + 写记录；③ 其余一切（slot:null / 槽已被删 / 属主为活外人 / 继承失败）→ 全新分配 + 写记录 + data = null。
- **D-2 存在性判据（盘面单判）**：①② 的门 = 槽文件在盘（**manifest 条目不作门**——2026-09-28 可达性扩展，§6.22 判据句 4）；属主判据不变（空 / 死 / 本进程）。
- **claim 后读槽失败**（解析失败 / `.unreadable`）→ **保持已 claim 槽 + data:null**——不回滚认领、不改 marker；下次保存原地重建该槽。
- **missing → 继承、null → 全新**的区分理由：删槽后置 null 使「删过」可辨认——用户删除自己会话后重开 = 全新起步，不继承对方遗留、不复活被删会话。
- **D-3 启动钉 `_slot`**：`await resumeSlot` → `applySession` 之后 `agent._slot = slot`——否则并发方在首回合前翻 active，首次保存会静默迁移到新槽（恢复确定性要求**首保存必落恢复槽**）。
- **D-4 marker 维护点**（每次落点原子写，失败容忍）：CLI `resumeSlot` 各步 / `saveSession` 首认领之后 / `newSession` 成功后 / `switchToSlot` 成功后 / `deleteSlot` 删到本端记录槽 → 置 null（文件保留）；
  VSC 落点（经端壳绑定核同名件 §6.20；ensureSlot·status / newSlot / 打开历史会话 / deleteSlotAndUpdate；**2026-09-18 起 `ensureSlot` 冷路径零探测**——收敛成功落 marker，维护点语义不变；**打开历史会话 = 未占目标槽才写**——端差判据见 §6.15）。
  **非维护点**：日常保存（`_slot` 粘性已定，不写 marker）。
- **D-5 listSlots 高亮按端**：`listSlots` 的 `isActive` 保持 manifest active 语义（ACP 消费面零变；**条目集自 2026-09-28 起 = 盘面实读**——§6.22）；TUI `/session` 与面板高亮以本端记录槽为准（记录槽不在列表 ⇒ 回退 `isActive`）；manifest active 保留为跨端回退高亮。
- **D-6 manifest.active 定位修订**：认领 / 新建 / 切换 / 删除的 setActive 纪律**原样保留**（旧版端互操作 + ACP + 继承读取 + 列表回退）；仅新型恢复决策不再以它为第一依据。
- **D-7 混合版本矩阵**：新版 + 新版 = 完整分离（目标态）；新版 + 旧版（任一方向）= 旧版仍翻 active / 抢死槽，数据安全但退化为现状形态（建议同步升级）；旧版 + 旧版 = 现状。升级过渡首日仅先启动端能继承共享 active 死槽——一次性继承的固有代价。
- **D-8 已知限制**：同端多活进程时 marker 为「端内最后认领者」语义——后启动者覆盖 marker；交错重启时先者会话需 `/session` 手动找回。ACP 不经 marker（显式钉槽不变）。
- **被否方案**：① manifest 内嵌 `cliLast` / `vscodeLast` 字段（双端写同一文件 + 旧版写丢未知字段）；② 恢复目标 = updatedAt 最新槽（跨端每次保存互触、语义不符）；③ 取消一次性继承（升级后第一次打开即触发原 bug）；④ 只修 CLI（VSC resolve 仍翻 active ⇒ **必须双端同批**）。

### 6.11 agent 运行环境自我感知（env-state reminder）

- **机制**：每回合注入**一条统一的「环境状态」transient reminder**（与 AUTO / 时间 reminder 同通道、同可变形态——避 prefix 缓存）——一次注入覆盖家族四项；变更在下回合自然感知。
- **行模板**：`[System reminder: env: {cli|vscode|desktop}, mode: {eng|normal}, model: {model-id}, slot: {N|null}, resumed: {yes|no}.]`
  —— 模板字面 = 提示词面（落点注 = §8.2）；**`env` 值域 = 端名闭集 `cli` / `vscode` / `desktop`**（§6.10 D-1）。
- **注入链与行值来源（2026-09-29 读码核实——台账 #481）**：三端两形——① CLI ∕ 桌面 = **核行长**（`thincoder-core/agent/setup-reminders.mjs:41`；经核 `prepareRun` depth-0 组注入——`thincoder-core/agent/setup.mjs:136`）
  ② VSC = **端侧自持行**（`thincoder-vscode/src/agent/setup-reminders.mjs:61-62`（as-of 2026-09-29）——字面 `vscode`）；**桌面端走核链 = 已验**：`thincoder-desktop/src/main/turn-face.mjs:54` 的 `run` 缺省 = 核 `runAgent`（`thincoder-desktop/src/main/agent-host.mjs:91`）。
  **核行 `env` 取值 = 核模块常量 `END`**（`thincoder-core/session-slots.mjs:105` = `cli`）——端名声明 `sessionEnd()` **未参与本行**（活体读测：桌面进程内 `sessionEnd()` = `desktop` 而核行仍渲 `cli`）⇒ **桌面端行值现为 `cli`，设计值域 `desktop` 未达成**（VSC 同类先例 = `docs/batches/2026-09-15-vsc-core-wiring.md` F4，已由端侧自持行消解；桌面自持行 ∕ 核行参数化 = 缺口登记——码面归后续轮）。
- **字段映射**：`env` = 运行身份（取值 = 核 `END` 常量——不做 cmdline 判别）· `mode` = 工程模式（`config.agent.engineering`）·
  `model` = `activeModel ?? provider.model ?? "unknown"` · `slot` = **粘性当前会话槽**（CLI `agent._slot` / VSC `_engPersist.slot`——**非 manifest active 共享指针**；无绑定窗口如实 `slot: null`，**不读 active 回退**）· 
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
- **引文映射（子标相容）**：代码注释引文「§6.12①」（迁移期旧子标——本节 bullet 无编号）实指 §6.14「生命周期联动」条——`.bak` 轮转对非本会话活动绑定面联动改名 sidecar（判据 = `agent._recordStore?.dir`）。

### 6.13 跨会话历史检索与检索族消歧

- **`read_history` 参数扩展**：新参数 `path`（可选——默认本会话）：目标会话文件路径（显式）· `cwd:` 前缀指定目录（自动发现该 cwd 的会话槽）· `all` 字面量（**跨会话检索**——D-SE47/§6.19：全部已索引会话，行携回查锚）；**本会话缺省 = 参数面零行为变化**（路由零改——既有调用全不传 path）；**输出形例外** = `tool_calls` 带参数（§6.19 D-SE47——与缺省面共用行构造 ⇒ 缺省面同受；§6.9 已同步）。
- **发现面**（path = `cwd:xxx`）：列全部槽 + 时间序——**不做死槽过滤**；每槽摘要行 = **槽号 + 完整文件路径 + title / 消息数 / updatedAt**（模型无法自行算 sha1(cwd) 拼文件名）；第二步深查 = `path = <摘要行的完整文件路径>` 重调。
- **检索护栏（双保险——射程 = 回落路径面）**：行扫第一道 `READ_HISTORY_SCAN_MAX = 200,000` 行（流式计数）+ 消息数第二道 `READ_HISTORY_MAX_MESSAGES = 50,000`；两道超限返回**同一逐字文案** `{error: "session too large — refine keyword or since/until"}`（双端同常量同文案）。
  **射程 = 回落路径**（非 sessions 树的 JSON 文件 / 索引不可用 / 库内无此会话）——索引命中路径无护栏（§6.19 D-SE47）；返回条数沿用 §6.9 的 limit 语义（> 200 → 200）。
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
- **read_history 契约**：本会话（无 path）走 `store.iterate` 流式匹配（输出构造 / 字段 / limit 默认值与上限逐字不变）；跨会话（`path=`）**索引命中 ⇒ SQL 检索**（无行扫 / 无消息数护栏——§6.19 D-SE47），**未命中 / 索引不可用 ⇒ 回落槽 JSON 全量读 + 既有护栏**（判据 / 常量 / 错误文案逐字保留）；`cwd:` 发现面与未绑定（测试 / 模式 F）回退路径零改。
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
**端壳保留 = 端差一款（已裁保留 · A9——原登记 = 2026-09-15 W11 批；台账 #185 复核 = 2026-09-25 misc-four 批；本轮复核 = 2026-09-25 SLOT-END-PARAM 批）**：
① **end marker 层 = 零副本转口**（**端差注销 · 不计入保留款数**——2026-09-25 SLOT-END-PARAM 批；判据单源 = §6.20 判据句 3）：
端壳 `session-slots.mjs` 副本（marker 三式 + `usableSlot` / `resumeSlot` 本体）改为逐行绑定转口（`(cwd) => coreX(cwd, END)` 形态）；
四个维护落点（`resumeSlot` / `newSlot` / `switchToSlot` / `deleteSlotAndUpdate`——`thincoder-vscode/src/extension/session-io.mjs`：`:88` / `:123` / `:175` / `:199`）
经端壳绑定核同名件（**调用点零改**）；端壳副本原无的裸 v1 单文件兜底差异随副本注销（端壳消费核 `resumeSlot` 后获得核兜底——§6.20 端差注销）；
`deleteSlotAndUpdate` 随槽删记录存储 sidecar（核 `deleteSlot` 同源步 `unlinkRecordStore`——`thincoder-core/session-store.mjs:376`）不变。
② **（cwd, slot）型** token 台账三式（`thincoder-vscode/src/extension/session-slot-write.mjs:48` 起——核 token 面为 agent 型）——**A9 三件**：① 结构性不对称 = 端壳载体单侧存在（端槽载体）；
② 证据 = 本段坐标；③ 显式裁定 = 2026-09-15 W11 批（端差登记本体）+ 2026-09-25 SLOT-END-PARAM 批确认。

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
**受占 ⇒ 拒绝路径不进入 `switchToSlot`**（共享指针 / 本端记录 / 解析缓存 / 认领集四不动）+ 不钉槽（`_slot = null`——**前置判据路载荷**）+ 提示 → `loadSession` 经缓存重绑本端原槽；
未占 ⇒ `switchToSlot`（读目标槽成功才翻 active；记录 / 缓存仅未占才写穿——`thincoder-vscode/src/extension/session-io.mjs:186-190`；文件缺失/损坏 → null 不产生幻影指针）+ 绑定 → `_loadSession()`。
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

- **端差登记 · 记录面写条件（2026-09-19 · init-block 批）**：目标槽被另一活进程占用时——核 = **无条件写**记录（`thincoder-core/session-lifecycle.mjs:284-285`——D-2① 不满足 ⇒ 落 D-2③ 全新分配）；端 = **条件写**（`thincoder-vscode/src/extension/session-io.mjs:186-190`——仅未占才写记录 / 缓存）——
  **重分类依据（2026-09-30 · #677——消 ∕ 非端差）**：① 结构性不对称 = 两侧各为其机制本体（端侧条件写 = F-CR2「判据前置 / 拒绝路径零写」语义；核侧无条件写 = 切换成立 + fork 语义（D-6）——非同一函数两形，写条件随各流程本体内含，无同一机制可对齐 ⇒ 不作端差登记）；
  ② 证据 = 行内两侧坐标 + §6.16 F-CR2 判据句；③ 复核链 = 2026-09-21 SESSION-CLAIM 批（F-CR2）+ 2026-09-25 misc-four 批（台账 #185）；后续同场景用户可见分歧 ⇒ 另立行为项。
- 场景：打开被另一活进程占用的历史槽 ⇒ 核落 D-2③ 并写新槽记录；端不写 + `_slot = null` → 经缓存重绑本端原槽（占槽判定 `panel-messages-session.mjs:48-55`）。

- **（2026-09-21 · SESSION-CLAIM 批 · 本节单源）**：① **F-CR2 收正**——受占目标 ⇒ 面板路径**不进入**端壳 `switchToSlot`（判据前置：占用判定前置于切换调用）；端壳函数内被占分支 = **零写**（不认领 / 不翻共享指针 / 不写本端记录 / 不写解析缓存——占用判定前置于 `m.active` 赋值）；核 `switchToSlot` 受占语义不变（CLI 切换成立——指针 / 记录按 D-6 / D-4 落点 + 保留集 = 空释放旧认领——见 §6.5 / §6.2）。
  ② **F-CR1 端壳释放**——`newSlot` / `switchToSlot` 释放本进程残留认领（§6.2 公式代入：保留集 = {落点槽}；端壳单绑定 = **假定 + 复核条件**——见 §6.16），`resumeSlot` 包装经核 `claimSlot` 同判据；释放集并入各落点既有 `saveManifest` 的 `deletions`（落盘判据见 §6.16）。

- **（2026-09-22 · pending-triage 批 · 本节单源）**：
  ① **受占返回值可区分（台账 #171）**——端壳 `switchToSlot` 被占分支 = **零写 + 可区分信号**（与成功返回 `data` 相区分；调用面可判别）。
  面板路径在前置判据之外补**第二判**（TOCTOU 窗内收到受占信号 ⇒ **保持 `_slot` 现值**（不钉他端活槽）+ 提示 + `_loadSession()` 重绑本端原槽）——**第二判路载荷 = 保持现值**，与前置判据路（`_slot = null` + 缓存重绑）分述；四不动与零写语义零改。
  ② **ACP `session/close` 释放（台账 #168①）**——关闭会话 ⇒ 释放该会话认领（§6.2 公式代入：保留集 = 本进程其余在存会话的活绑定槽（同 cwd）；落盘判据三条沿用 §6.16）。
  ③ **跨 cwd 释放（台账 #168②）**——VSC 项目切换 ⇒ 对旧 cwd manifest 补一次同语义释放（保留集 = 空；假定 + 复核条件沿用 §6.16）。
  ④ **端壳释放面机判（台账 #168③）**——`newSlot` / `switchToSlot` 的 release 传参补端壳级用例。

- **否决备选（跨端翻指针）**：删绑定槽时**收养幸存 active**（绑定点 / 缓存 / 记录任一面）——绕开 `usableSlot` / `slotOccupancy` 守卫（可能收养另一活进程的槽 ⇒ 双端双写互覆盖），且与 D-SE2 粘性同病灶（并发翻动被静默跟随）——见 §7 D-SE31。
- **字段往返完整（key-presence 写，v2 语义）**：槽位文件**全量覆盖写**，`saveLines`
（`thincoder-vscode/src/extension/panel-session-write.mjs:34`）以 `...existing` 展开式透传不认识字段、仅覆盖扩展自己拥有的字段——CLI 写入的
`activeModel` / `engineering` / `engDesignToken(s)` 等字段在 VS Code 侧往返不丢（往返透传是契约——漏一字段即永久丢失）。
`engDesignToken` / `engDesignTokens` 用 `"key" in extra ? extra.key : existing.key ?? null` 语义——显式 null
（清盘）必赢、缺席保留槽值（R16 TTL 过期后 restore 清盘、turn 尾 agentState 携显式 null 必须 pin；abort /
finally 保存无 agentState → 缺席保留槽值不误清）。
- **`setSlot*` 写面（W11 起单源 = 核 `thincoder-core/session-slot-write.mjs`；端壳转口）**：`setSlotAutoApprove`（`:140`）/
`setSlotPlanMode`（`:145`）/ `setSlotEngineering`（`:150`）/ `setSlotAdvisorGuard`（`:155`）/ `newSlotData`（`:46`）/ `resolveEffortPatch`（`:197`）/ `setSlotPrefs`（`:213`——会话级偏好，见 §6.21）；
端壳 `thincoder-vscode/src/extension/session-slot-write.mjs` = 转口 + **（cwd, slot）型 token 台账三式**（见上 W11 接线面）。
`loadSlotForWrite` 对「无文件但本进程刚 claim 的槽」返回 `newSlotData` 默认记录——否则
`setSlot*` 落在「claim 先行、首保存落盘」的新槽时 `if (!data) return false` 静默丢标志（AUTO-bug 修复）；
version>2 / 异 cwd / 损坏 / 未知槽返回 null（新版 CLI 文件不属本端覆盖——v3 interop 前保守姿态）。
- **标题触发时机与写形（2026-09-21 块标题行对齐批——链单源 = §6.7）**：标题 await 在回合尾 finally **忙态归位之前**（stream
完成即触发——`panel-turn-stages.mjs` `finalizeTurn`）；期间 `_turnState` 仍 running——标题窗口 = busy——webview Stop 显
（running 派生）+ 路由守卫 running ⇒ **队列受理（容量 8）**（判定 / 载体 / 送达 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6——新回合恒在标题调用之后开，并发回合无面）。**写形 = 单写**：
标题值喂入同一拍的整档 `saveLines`（`extra.title`）——不另开 `setSlotTitle` 直写；写后刷会话列表（`pushSessions`）。
错误路径（评审 #2）：`generateTitle` 内部全 try/catch 吞错 + 调用点兜底 try/catch——**归位恒执行**（标题抛错不卡永久 busy）。
标题期消息受理（routeUserTurn running 分支 → 队列（容量 8）——唯一拒面 = 满队（第 9 条）+ 警告；送达 = 四支——零丢失）。
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
双端异步化）：`collectGitContext` / `pushGitContext` → async + 失败冷却 30s（端 `thincoder-vscode/src/agent/setup-reminders.mjs:115`（as-of 2026-09-29） `pushGitContext` ·
核 `thincoder-core/agent/helpers.mjs:221` `collectGitContext`——采集 / 冷却随核单源）——确认序契约不变（git 仍在重放后、time 恒为最后一条）；all-or-nothing 保持。

### 6.16 会话认领释放与拒绝零副作用（2026-09-21 · SESSION-CLAIM 批）

> 需求 = `docs/core/requirements/SESSION.md` §2.3（F-CR1–F-CR3）；批档 = `docs/batches/2026-09-21-session-claim-release.md`。
> 本节承载本批的判据句 + 边界情形 + ACP 调用面清单；落点与测试面清单 = 批档 §2（一次性材料）；机制叙述就地并入 §6.2（认领释放）· §6.5（切换落点）· §6.15（端壳面）· §7（D-SE32 / D-SE33）。

**判据句（F-CR1 · 认领随绑定）**

- 释放谓词（**唯一公式**）：释放 A ⟺ `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；**保留集 = 本次落点槽 ∪ 本进程其余活绑定槽**（同 cwd manifest 内）。各落点 = 公式代入（单绑定端 ⇒ {落点槽}；目标被占 ⇒ 空）。
- 释放时机 = **绑定迁移落点**（不是定时 / 后台清扫）：CLI `/new`（`thincoder-cli/src/tui/cmd-new.mjs:11` 调用面）· CLI `/session N`（`thincoder-cli/src/tui/cmd-session.mjs:105` 调用面）·
  启动恢复（`thincoder-cli/src/command-interactive.mjs:142` 钉槽落点，经 `resumeSlot` → `claimSlot`）· VSC 端壳 `newSlot` / `switchToSlot` / `resumeSlot` 包装（`thincoder-vscode/src/extension/session-io.mjs`）。
- **落盘判据（D-SE4 同型）**：① 释放集按**写盘同一次 fresh 快照**计算 / 校验（不得以陈旧内存 manifest 直接构 `deletions`）；② 条目删除 = **值条件删除**（仅当该槽 fresh 属主仍为本进程 sessionId——防窗口内他人新认领被误删）；③ 写盘同时从**内存认领表** `m.slotSessions` 移除该条目（防后续保存经条目级合并复活回写）。
- 落盘载体 = 各落点**既有那一次** `saveManifest` 的 `deletions.slotSessions`（零新增写盘次数）。
- **活绑定集口径（per end）**：CLI TUI = 本进程唯一 agent 的 `agent._slot`；ACP = 各在存会话 `agent._slot`（多会话多认领属其设计）；**`session/close` 入释放面（2026-09-22 定裁 · 台账 #168①）**——关闭会话 ⇒ 释放该会话槽，保留集 = 其余在存会话槽（同 cwd）；VSC 见下条（含跨 cwd 释放 · #168②）。
- **VSC 单绑定（假定 + 复核条件）**：假定 = WebviewViewProvider 单实例视图 ⇒ 同宿主单绑定（依据 `thincoder-vscode/src/extension/chat-panel.mjs:107-116`）；复核条件 = 同 cwd 出现多于一个活绑定（多窗口 / 多面板）⇒ 该落点**不释放**（或按活绑定全集计算保留集）——假定失效不得释放他端活绑定认领。
- 释放面只碰 manifest 认领集（删属主条目）；共享指针 / 端标记语义与落点集（D-4 / D-6）零改。

**ACP 调用面（实读 · 2026-09-21；2026-09-22 收正——`session/close` 入释放面）**

| 释放原语 | ACP 调用点（实读） | 处置 |
|---|---|---|
| `newSession` | `thincoder-cli/src/acp/handlers-session.mjs:152`（`session/new`）· `thincoder-cli/src/acp/handlers-slots.mjs:106`（`session/load` fork）· `thincoder-cli/src/acp/handlers-slots.mjs:159`（`session/resume` fork）· `thincoder-cli/src/acp/handlers-slots.mjs:190`（`session/delete` 重钉） | 四点均不传 `releaseStale`（调用面 opt-in）⇒ 零释放 |
| `switchToSlot` | 零调用点（ACP 侧仅语义引注——`thincoder-cli/src/acp/handlers-slots.mjs:84`） | 释放不可达 |
| `claimSlot` | 零调用点——调用面 = 核 `resumeSlot`（`thincoder-core/session-slots.mjs:299`）+ VSC 端壳 `resumeSlot`（`thincoder-vscode/src/extension/session-slots.mjs:76`） | ACP 不调 `resumeSlot`（导入面无该名——`thincoder-cli/src/acp/handlers-session.mjs:13` / `thincoder-cli/src/acp/handlers-slots.mjs:16`）；ACP 认领 = 直写 `m.slotSessions`——`thincoder-cli/src/acp/handlers-slots.mjs:96-99` / `:151-154` |
| 认领释放（close） | `thincoder-cli/src/acp/handlers-session.mjs:193-206`（`session/close`——2026-09-22 补 · 台账 #168①） | 释放该会话槽（保留集 = 其余在存会话槽 · 同 cwd）；落盘判据三条沿用 |

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

**不做（边界）**：提示文案（#161①——用户 2026-09-21 01:46 裁「不改」）· 槽文件格式 / `version` / 端标记语义 / 共享 active 语义（D-SE1 / D-SE9 不动）· 不新增机械门。


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

- **组** = sessions 根下同一 40 位 cwd 哈希前缀的全文件集合（前缀族 = `thincoder-core/session-slots.mjs:92` `sessionPath` 所得 `{hash}.json` + 各后缀）。
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

- 命令 = `thincoder.sessionGc`（`thincoder-vscode/package.json` contributes.commands 注册 · 处理体挂 `thincoder-vscode/extension.mjs:163-165` 起同址簇）；流程 = `listColdCwds`（核数据面）→ 计数报告 → 模态警告确认 → 逐组 `deleteColdCwd`（内部重校验）→ 汇总；**不消费 `runSessionGc`**（console 形态属 CLI 壳——核内零消费方结构机检保持）。
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
- **F-XR2 端标记不置空（对照 `deleteSlot` 置空路径区分）**：释放原语零触碰 marker 面（不调 `writeEndMarker`、不写 null）。区分：`deleteSlot` 删到本端记录槽 → `writeEndMarker(cwd, null)`（核 `thincoder-core/session-slots.mjs` + 端壳 `thincoder-vscode/src/extension/session-io.mjs:210`）= **显式置空**——删槽 = 会话不再要（下次全新起步）；退出释放 = 会话还要回（**路标保留**——下次直达恢复）。
- 恢复直达支实证：释放后盘面 = marker 指原槽 ∧ `slotSessions[原槽]` 无属主 ⇒ `usableSlot` true（`thincoder-core/session-slots.mjs:248-253` 无属主分支先于属主判定短路——**该槽可用性判定零探测**）→ D-2 ① 支 `claimSlot` + `loadSlotFile` 直接恢复。
- 入口探测束（`resumeSlot:281`）是否零 exec 取决于 manifest 内**他进程**属主有无：单进程常态（事故锚形态）= 清单空 ⇒ `probeOwnersAsync` 入参清单空早退零 exec（`thincoder-core/process-probe.mjs:266-268`）；T2 用例沙箱 = 单进程盘面 ⇒ 机判成立。

**CLI 接线序（F-XR4 · 同步插行两点）**

- 两点同源（同一退出语义双入口，均收口 `cleanup() → setTimeout(exit, 100)` 链）：① Ctrl+C×2 空闲双确认分支——`thincoder-cli/src/tui/key-handler-ctrlc.mjs:112`：`cleanup()` 之后、`exitTimer` 注册之前插 `releaseClaimsAll(process.cwd())`（+ import）；② `/exit` 命令——`cmd-exit.mjs:6` 经 `ctx.exit`（`thincoder-cli/src/tui/index.mjs:198-204`）同型插行。
- **退出序钉定**：回合尾既有保存（数据面）→ `cleanup()`（终端恢复）→ **释放** → `exitTimer`（100ms）→ `exit(0)`。
- **100ms 窗口钉定**：释放 = 同步单文件写（loadManifest + saveManifest 同步 fs——会话面既有形态），先于 `setTimeout` 注册**同步完成** ⇒ 窗口内零竞态；`ctx.exitDelay ?? 100` 原值保留（既有测试缝 + crash-report 写窗对齐不动）。
- cwd 域 = `process.cwd()`——与启动恢复（`thincoder-cli/bin/thincoder.mjs:322`）同域同参（CLI 生命周期锚定启动 cwd）。**不引入 async**（否决 async 化退出链——同步写零改造零新竞态面，见 D-SE42）。

**VSC 接线（F-XR4 · async deactivate 前置释放）**

- `deactivate`（`thincoder-vscode/extension.mjs:189-196`）改 **async**：`releaseClaimsOnExit(_cwd(), hasWorkspace)` 前置于既有三步（stopSampler / closeAllMcp / dispose）。VS Code 宿主 await async `deactivate`（合法——宿主等待窗口）；释放 = 窗口内最有价值步**抢先执行**，宿主超时强杀时残留 = 现状形态（认领保留——恢复走探测面），数据零险。
- cwd = 面板域 `_cwd()`（`thincoder-vscode/src/extension/panel-messages.mjs:41`——workspaceFolders[0]，与认领落点同域）；`workspaceFolders` 空 ⇒ **跳过释放**（`_cwd()` 回退宿主任意 process.cwd()——不给宿主 cwd 造盘面 / 误放他项目认领）。
- 薄包装 `releaseClaimsOnExit(dir, hasWorkspace)` 住 `thincoder-vscode/src/extension/session-io.mjs`（node 可测缝——`extension.mjs` 依赖 vscode 模块不可直测）：无 workspace ⇒ false；否则转核 `releaseClaimsAll`（容忍逻辑全在核——端侧零重复）。

**端壳裁定（F-XR4 双端同源）**：释放机制核内单点；端壳对位 = **纯转口两行**（`session-slots.mjs` / `session-io.mjs` 各一——W11 转口纪律形态）。端壳镜像按端差必要性判定：marker 层 / `resumeSlot` 算法端差已注销（2026-09-25 SLOT-END-PARAM 批——§6.20 判据句 3）；本面谓词 = `getSessionId` 字符串比较（零探测零束）⇒ 无镜像必要。NF1 红线：零新增跨端共享可变字段。

**边界情形**

| 情形 | 判据 |
|---|---|
| 磁盘无 manifest（全新 cwd / 从未有过会话） | `existsSync` 早退零写——退出不造盘面 |
| 本进程无认领（已全释放 / 仅他人认领） | `staleClaims` 空 ⇒ 零写返回 false（他进程条目零动——值条件天然） |
| 本进程多认领（历史残留） | 保留集空 = 全释放（F-XR1 全量语义） |
| 释放写盘失败（IO / 权限） | try/catch 返回 false——退出恒达；盘面 = 认领残留（恢复走探测面——现状形态） |
| 崩溃路径（kill / 终端窗口关闭 / V8 fatal） | 不可达释放面（信号无 JS 钩子）⇒ 认领保留 ⇒ 恢复走 D-MI10 探测三态（F-XR3 语义零变） |
| ACP 进程退出 | 零接线（ACP 无 TUI——不经 key-handler / ctx.exit）；`session/close` 释放 = **会话级**（入 §6.16 调用面表——非本退出释放面） |
| Ctrl+C 单按 / 双按（非空闲退出分支） | 非退出不释放（中止回合 / 全停后台——需求边界原样） |
| VSC 多窗口同 cwd | B 窗退出只释 B 认领（sessionId 区分 + 值条件删除——A 窗条目 owner ≠ B 天然不动） |
| 释放后他人即时认领原槽 | fresh 属主 ≠ 本进程 ⇒ 不删（§6.16 值条件 ②）；本进程已退 ⇒ 无后续保存复活面 |
| 混合版本 | 旧版端零释放机制 ⇒ 其认领恢复走探测面（现状形态）；认领集 = 共享 manifest 既有结构（非新字段）⇒ 无跨端读冲突 |

**验收回指（需求 §2.5 T1–T6 · 判据级；用例细表 = 批档 §2）**

- T1 = 造认领 → `releaseClaimsAll` → 盘面三断言（manifest 无本进程 `slotSessions` 条目 ∧ marker 仍指原槽 ∧ 槽文件完好）——核 `thincoder-core/test/session-slot-write.test.mjs` 新组。
- T2 = T1 后 `resumeSlot` 返回 `{slot: 原槽, data 非空}` + 探测束零 exec（沙箱单进程盘面 ownerPids 空 ⇒ 早退——替身注入断言）。
- T3 = 崩溃路径负向回归（认领在 + 探测 unknown ⇒ 全新分配——现状锁）。
- T4 = CLI 退出分支 e2e（`exitDelay` 注入 + `ctx.exitTimer` 捕获——先释放后定时器注册 / 桩收 `exit(0)` / 失败容忍 = 核 D-SE41 面：`releaseClaimsAll` 失败返回 false 不抛 ⇒ 退出零阻、定时器恒注册；接线层零防护，如驱动接线层抛错形态须模块 mock 显式命名缝）——`thincoder-cli/test/tui-exit-cleanup.test.mjs` 新组。
- T5 = VSC 端壳机判（`releaseClaimsOnExit` 沙箱 + deactivate 结构机检）——`thincoder-vscode/test/session-exit-release.test.mjs` 新档。
- T6 = 三端测试全绿。

**不做（边界）**：探测三态判据（D-MI10）一字不动 · 不做时间窗猜死活启发式 · 崩溃路径不接线（F-XR3）· `deleteSlot` 既有语义（含 marker 置空）不动 · 槽文件格式 / `version` / marker 形态与维护点集不动 · NF1 零跨端共享可变字段 · 本释放面域 = **退出 cwd 单 manifest**（会话级 close 与跨 cwd 释放住 §6.15 / §6.16）· Ctrl+C 单按两按（非退出）不释放。

### 6.19 会话派生索引库：全拒洞与跨会话检索（2026-09-22 · SESSION-INDEX 批）

> 需求 = `docs/core/requirements/SESSION.md` §4.3（F-R19a 跨会话检索 · **F-R19c** · **F-R19d**）· §4.4（F-S4 记录存储面）；台账 = #205（用户 2026-09-21 20:12「上下文现在的存储方式好吗？进数据库会不会更有利？」→ 父侧评估呈「不迁主存 + 加派生索引库」→ 2026-09-22 09:25「可以，都按建议」＝ 立批）；批档 = `docs/batches/2026-09-22-session-index.md` §2。
> 本节承载机制判据句 / 取源与水位 / 重建面 / 查询面路由 / 边界情形 / 验收回指；受影响文件表与用例细表 = 批档 §2（一次性材料——本节不复制）。
> 与 §6.14 的关系：本节只**读**记录存储（sidecar）与槽 JSON——两线语义 / 追加单点 / 绑定对账 / 降级面一字不动。

**问题形态（设计轮实测 · 2026-09-22）**

- **C 洞（超大会话整档拒）**：`path=` 深查走槽 JSON 整档读，行扫 `READ_HISTORY_SCAN_MAX = 200,000` 行 + 消息数 `READ_HISTORY_MAX_MESSAGES = 50,000` 两道护栏超限即整档拒（`thincoder-core/agent-tools/read-history.mjs:50` / `:54` / `:175` / `:192`），提示 refine keyword 却绕不过。
- **行扫实测空转**：槽 JSON = 单行（`JSON.stringify` 不产换行——本机最大槽物理行数读数 = 0）⇒ 生效护栏只有消息数一道；本机最大槽 = 15,167 消息 / 22.2MB（`sessions/38478126….json.27`）——未越线，增长方向明确。
- **E 洞（跨会话检索）**：`path="cwd:<dir>"` 只列槽（`read-history.mjs:224-242`）——不知目录时零检索面。
- **存量实测**（`~/.thincoder/sessions` · 设计轮实读）：2,845 条目 · 槽文件 464 · sidecar 目录 1,181（**含段者仅 13 个**——合计 108.9MB，即语料主体）· 空 sidecar 1,168（其中 1,119 个槽文件已消失的孤儿 `.d`）· manifest 429 · `.bak-*` 344。
  ⇒ **取源必须双路**（D-SE44）：只认 sidecar ⇒ 跨会话检索的覆盖面只剩 13 个会话（VSC 端不写 sidecar、§6.14 前的老档亦无）。

**形态（D-SE43）**

- 派生索引库 = 单库 `~/.thincoder/session-index.db`（`node:sqlite`；与 `memory.db` 同区——`configDir` 单源 `thincoder-core/config-io.mjs:32`）；测试缝 `_setSessionIndexDirForTest()` / `_resetSessionIndexDirForTest()`（`_setLedgerDirForTest` 同款）。
- **零权威**：主存（槽 JSON + sidecar + manifest）= 真源；索引只读主存（整读 / 偏移 `readSync`），**绝不写回** sessions 树；索引丢 / 坏 = 重生成；查询恒可回落主存路径（回落判据 = D-SE47 路由表）。
- **零第三方依赖**：新档仅 `node:` + 仓内相对 import——三端 `package.json` 依赖面零新增（机检：diff 不含 dependencies 行）。
- **双端单源**：实现住核（`thincoder-core/session-index.mjs` / `session-index-build.mjs` / `session-index-query.mjs` / `session-index-pass.mjs` / `session-index-cmd.mjs`）——CLI 与 VSC 同取（VSC `thincoder-vscode/src/agent-tools/index.mjs` 转口面零改）。
- **拆分产物①（预案授权 = 批档 §2「跨档线拆分预案」）**：`thincoder-core/session-index-query.mjs`（102 行，面 = 查询与 FTS 检索）——`session-index.mjs` 实施读数 306 超 300 advisory 线后二分。
- **拆分产物②（预案授权 = 同上）**：`thincoder-core/session-index-pass.mjs`（95 行，面 = 有界趟 / 全量重建 / 清行 / 延迟拍）——`session-index-build.mjs` 实施读数 409 超线后二分。
- **语言单源外提**：`segmentCJK` / `buildFtsQuery` 自 `thincoder-core/memory/schema.mjs` / `thincoder-core/memory/core.mjs` 外提至叶子档 `thincoder-core/fts-text.mjs`（两档 re-export 保名面——**零行为变更**）；理由 = 会话索引不得把 memory 模块链拉进 `read_history` 的装配装载面 + 机制单源（D2）。

**schema（D-SE44——四表 + FTS；`index_meta` 元表）**

| 表 | 键与列 | 语义 |
|---|---|---|
| `sessions` | `id` PK · `cwd_key` · `slot` · `file` · `cwd` · `title` · `identity` · `src` · `updated_at` · `indexed_at` · `seg_n` · `seg_bytes` · `seg_mtime` · `tail_hash`；`UNIQUE(cwd_key, slot)` | 一行 = 一个槽会话。`file` = 槽文件绝对路径（**回查锚**）；`cwd_key` = sessions 根文件名的 40 位哈希（跨端同源）；`src` ∈ {`sidecar`,`json`}（取源面）；水位四列见 D-SE45 |
| `messages` | `rowid` PK · `sid`→`sessions` · `idx` · `seg` · `ts` · `role` · `name` · `tool_call_id` · `content`；`UNIQUE(sid, idx)`（兼作查询主索引——同列序不重复建）/ `INDEX(ts)` / `INDEX(name)` | 一行 = 一条消息。`idx` = 会话内绝对序号（与 §6.14 段 / 行算术同源）；`content` = 文本部件拼接文本（多模态取 text 部件）；`ts` 可空（legacy） |
| `tool_calls` | `id` PK · `sid` · `msg_idx` · `ord` · `call_id` · `name` · `args`；`UNIQUE(sid, msg_idx, ord)` · `INDEX(name)` | 一行 = 一次工具声明。`args` = `tc.function.arguments` 存储串（记录行内 ≤300 字符——`slimForDisplay` 截断面即精度上限） |
| `messages_fts` | FTS5 `(seg_content, seg_name)` · `tokenize='unicode61'` · `rowid = messages.rowid` | 关键词面（写面自持——无触发器：建 / 重建同径、事务内同步）；CJK 逐字间隔与查询侧同源（`fts-text.mjs`） |
| `index_meta` | `k` PK · `v` | `v`（schema 版本——不符即重建）· `built_at` · `pass_at`（**最近一次实际写入（变更）时刻**——无源变的 pass 零写、不推进）· 计数快照 |

- `cwd` / `title` / `updated_at` 取源：`cwd` = 槽 JSON 头部 4KB 前缀内的 `"cwd"` 字段（有界读——不整体 parse；取不到留 `NULL`，行仍以 `file` 锚定）；`title` / `updated_at` = `<hash>.json.manifest` 的槽摘要（每 cwd 一次读，覆盖该 cwd 全槽；manifest 缺失留空，不落错值）。
- 会话枚举面 = sessions 根 `^{40 位哈希}\.json\.\d+$` 文件名（不经 `.d` 目录枚举——孤儿 `.d` 1,119 个，实测）；裸 v1 `{hash}.json` 不入索引（本机 0 档）。
- **FTS5 可行性（同装配先例）**：`node:sqlite` 装配的 FTS5 已在用——四张 fts5 虚表建于 `thincoder-core/memory/schema.mjs:123` / `:170` / `:232` / `:274`；检索 = `thincoder-core/memory/core.mjs:98` / `:108` 的 `MATCH`；语言面单源 = `thincoder-core/fts-text.mjs`（`segmentCJK` `:19` / `buildFtsQuery` `:32` / `FTS_TOKEN_MAX` `:13`），
  两档 re-export 保名面（`thincoder-core/memory/schema.mjs:14-15` / `thincoder-core/memory/core.mjs:17-18`）⇒ 本库无新依赖、无需实施期探测。
- **FTS 同删义务（写面判据句）**：`messages_fts` 无触发器 ⇒ 每条删除路径同事务内同步删 FTS 行，逐条列明——① 区间删行（段重写 / 重扫：删 `messages` 前按 `rowid` 删 FTS 行）；② 会话级重建（`messages` / `tool_calls` / FTS 三面同清）；③ 级联清（源消失 / 槽号回收）；④ `--rebuild`（清四表）。
- **FTS 删除面实现与取舍**：删除经单点函数收口（`sid` + 可选区间一处）——漏删 ⇒ 残留 FTS 行产出指向不存在消息的命中；不取「外内容表 + 触发器」形态（触发器随行同步在批量建 / 重建面重复消耗、外内容表需 `DROP` + `rebuild` 两段）——写面单点 + 同事务已足。

**取源与水位（D-SE45）**

- **取源选择**：`<槽文件>.d/` 存在且含 `seg-*.jsonl` ⇒ `src=sidecar`（增量面）；否则 `src=json`（槽 JSON `history`——一次性整档读，mtime 键）。
- **水位** = `(seg_n, seg_bytes, seg_mtime, tail_hash)`（`tail_hash` = 末段尾 4KB 的 sha1）——三条规则：
  ① 段号 < `seg_n` ⇒ 跳过（已写段不可变——§6.14 段不变式）；
  ② 段号 = `seg_n`：`size == seg_bytes ∧ mtime == seg_mtime` ⇒ 零动作；`size > seg_bytes` ⇒ 自 `seg_bytes` 偏移读增量（**只落完整行**——末尾半行不建，水位停在最后一个换行处）；`size < seg_bytes` ⇒ 段被重写（`_materialize` / 隔离重建面）⇒ 该段起重建（删 `seg >= seg_n` 行 + 重扫）；
  ③ 同尺寸异内容（等长重写）⇒ `tail_hash` 比对不符即末段重建（只信 size / mtime 会漏检）。
- 段号 > `seg_n` ⇒ 整段建（轮转 / 跨段增量）。
- **会话级重建触发**：`meta.identity` 与库内非空且不等（槽号回收 / 轮转）· 段数缩水 · `src` 切换（sidecar ↔ json）。
- **源消失**（槽文件与 sidecar 俱不在）⇒ 级联清（`deleteSlot` / `session gc` 连带面；清运无锁、幂等）。
- **幂等**：写面 = 单事务（`BEGIN IMMEDIATE`）内「按区间删行 → 插行 → 水位推进」；无源变 ⇒ 零读零写（二次 pass 行数与水位不变）。
- **并发（多进程——CLI + VSC 同启）**：SQLite WAL + `PRAGMA busy_timeout = 3000`（`memory/schema.mjs` 同款）；事务短 + 内容派生幂等 ⇒ 竞争 = 串行等待 / 最坏重复建，零错误面；崩溃中途 = 事务回滚 ⇒ 水位不动、下趟重做。
- **触发三点**（均不触主存档）：① **懒保证**——查询前对目标会话（`path=<文件>`）/ 当前会话（`all`）`ensure`；**射程 = 有段档（`src=sidecar`）**（增量 = 单段读 / 偏移读，实读量 ≤ 1 段、加一次水位写——单事务）；
  **`src=json` 档免 ensure**（整档 JSON 读与回落路径同成本、无收益 ⇒ 其索引化只归 ② / ③ 两面）；未入索引的档查询走主存回落 + 逐字护栏（批档「大会话未索引」用例即该语义；「大会话经索引可答」用例的建索引前置 = ② / ③ 面）；
  ② **启动窗外延迟拍**——`scheduleSessionIndexPass({ delayMs = 3000 })`（`GC_PASS_DELAY_MS` 同款；单趟 ≤ `INDEX_PASS_BUDGET_MS = 2000` 且 ≤ `INDEX_PASS_MAX_SESSIONS = 40`，按源 mtime 降序、水位保证可续跑）；③ **显式命令**（D-SE46）。
- 拍挂点 = 端壳（CLI `thincoder-cli/bin/thincoder.mjs` 会话型命令白名单分支——与 `scheduleTraceCleanup` 同址；VSC `extension.mjs` activate）——核会话档零改。

**重建面（D-SE46）**

- **丢失 / 损坏检测 = 打开即验**：库文件缺失 ⇒ 建；打开 / DDL 失败（`SQLITE_NOTADB` 族 / `index_meta.v` 不符）⇒ 现场改名 `session-index.db.corrupt-<epochms>` 保留 + 新建空库（**开箱自愈**——下一次 ensure / 拍 / 命令自动重建；与 `memory.db`「丢 / 坏 = 重生成」同族）。
- **命令面**（CLI `case "session"` 分发 `gc` / `index`）：`thincoder session index --rebuild`（清四表 → 全量建 → 摘要行）/ `--status`（会话 / 消息 / 工具调用行数 + 库字节 + 水位覆盖 + 上次变更时刻（`pass_at`——无源变零写、不推进））/ 无参 = 同 `--status`。
- **VSC 对位**：命令 `thincoder.sessionIndexRebuild`（`package.json` contributes.commands + `extension.mjs` 处理体）+ 端壳档 `thincoder-vscode/src/extension/session-index-command.mjs`（`session-gc-command.mjs` 同族，消费核数据面）。
- **不做迁移**：索引可丢弃 ⇒ schema 变更 = `index_meta.v` 不符 ⇒ 重建（无版本迁移路径）。
- **库体量**：与语料同阶（FTS 面另加）——`--status` 露字节；不做自动清理 / 淘汰（见「不做」）。

**查询面改造（D-SE47——两洞 + 回查锚对位）**

| `path` 取值 | 路由 | 语义 delta |
|---|---|---|
| 省略 | 本会话：`store.iterate`（绑定）/ 内存 `_fullHistory`（未绑定）——**零改** | 无 |
| `cwd:<dir>` | 发现面 `listSlots`——**零改** | 无 |
| `<文件路径>` ∈ sessions 根 ∧ 库内有行 | **索引**（SQL 检索——无行扫 / 无消息数护栏 ⇒ 超大会话照答） | `keyword` = 子串（`LIKE`——既有契约不变） |
| `<文件路径>` 其余情形 | 既有 JSON 路径 + 两道护栏（**逐字保留**——非 sessions 树 JSON / 索引不可用 / 库内无此会话） | 无 |
| `"all"`（新增字面量） | **跨会话检索**（全部**已索引**会话——覆盖语义 / 信号见边界情形表） | `keyword` = **FTS 词 / 短语**（`buildFtsQuery` 单源：CJK 逐字 + 短语邻接；300MB 语料上子串扫描不可行——如实登记） |

- `all` 结果行 = `{session: {slot, cwd, file, title}, idx, ts, role, name?, tool_call_id?, content, tool_calls?}`——`file` = **回查锚**（与发现面同为「寻址字段必露」：第二步深查 = 复制行内路径重调 `path=`）。
- `tool_calls` 形：`[{name, arguments}]`——`arguments` = 存储串，输出上限 300 字符（与记录行同值，超限加 `…`）；取代「只回名字」形（工具描述与用例同步）。
- `all` 排序 = `ts` 升序（无 ts 行恒居末尾——`direction` 取端同义：newest 取最新端）；输出恒时间序（`formatMatches` 语义零改）。
- 过滤面全量对齐（SQL 落同义）：`role` · `tool`（结果行按名字 ∪ 声明行经 `tool_calls` 表）· `since` / `until`（无 ts 行不匹配时间窗）· `limit`（默认 50 / 上限 200）· `direction`。
- 落点 = `thincoder-core/agent-tools/read-history.mjs` 单一实现（双端同源——VSC 无自持副本）；`node:sqlite` 经**动态 import** 引入（`ledger-db.mjs` 头注 W8 契约② 同款——不在装配期静态装载）。

**边界情形（判据取值）**

| 情形 | 判据 |
|---|---|
| 会话只有 `meta.json`（段数 0） | 按 `src=json` 走槽 JSON（空目录 ≠ 有内容——段数 0 不立 sidecar 支） |
| 槽 JSON 结构非法 / 无 `history` 数组 | 该会话跳过并计入 `--status` 的未索引数；查询回落 JSON 路径（既有错误文案逐字） |
| 活会话正被写入 | 懒保证读增量（append-only ⇒ 已落盘行为准；半行不建）；查询恒新鲜到「最后一条完整行」 |
| 源文件已删（库内仍有行） | `ensure` 先清该会话行 ⇒ 走回落路径（`Error: session file not found`——既有文案） |
| 源被改写为等长新内容 | `tail_hash`（末段尾 4KB）不符 ⇒ 末段重建（水位不误判为「无变」）；**检测窗残余** = 同尺寸 ∧ 尾 4KB 相同（仅前段被改）⇒ 漏检、旧行残留——自愈 = 该段尺寸缩水（规则②）/ 会话级重建触发 / 显式 `--rebuild` |
| 双进程一建一写 | WAL + `busy_timeout`；改名 / 新建只在打开失败路径发生（持有效句柄者不受影响）；最坏 = 一方全量重建，另一方下趟增量补齐 |
| 磁盘满 / 库不可写 | 索引写失败 ⇒ 静默降级（查询回落主存路径——主存零险）；`--status` 露错误 |
| 主存被 GC 回收（`.d` 与槽文件俱删） | 行清；索引不复活数据（零权威）——`sessions-trash/` 期内的组同样按「源已删」清（回收恢复后由下趟重建） |
| 槽号回收（同槽新会话） | `meta.identity` 变更 ⇒ 整会话重建（新旧行不混） |
| `keyword` 无 FTS 词元（纯标点 / 空白） | 判据 = **无 unicode61 可用词元**（实现 = `FTS_USABLE` ⟶ `thincoder-core/session-index-query.mjs:25` / `:85`；“`buildFtsQuery` 输出空串”不作判据——纯标点可输出非空串而 FTS 零命中）⇒ 该次按 `LIKE '%原文%'` 落（单会话面与 `all` 面同形）；**元字符按字面**（`%` / `_` / `\` 转义 + `ESCAPE '\'`）⇒ keyword 恒字面匹配（形如 `%` 的 keyword 命中含 `%` 的消息，非全匹配）；全空白 ⇒ 近全匹配；**成本口径** = `messages` 全扫上界（无索引可用），`LIMIT` 取满即停——登记为退化路径，不拒答 |
| `keyword` 含非 ASCII 大小写变体 | 索引面 `LIKE` 折大小写 = **ASCII-only**（SQLite `LIKE` 语义）∥ 回落面正则 `/i`（`thincoder-core/agent-tools/read-history.mjs:375`）非 ASCII 亦折 ⇒ 同一 keyword 两路结果可不等价（非 ASCII 变体上索引面少命中——如实登记） |
| 库文件被手动删除 / 损坏 | 打开失败 ⇒ 改名保留 + 新建 ⇒ 下趟（或当次 ensure）重建——查询仍可回落主存路径（不因索引故障报错） |
| `all` 面无命中（会话未入索引） | `all` = **已索引会话面**——未入索引会话该面零命中（≠ 不存在：单会话 `path=<文件>` 面恒可探主存）；首建路径 = ① 查询前对**当前会话** `ensure`（射程 = 有段档；`src=json` 档零动作）/ ② 延迟拍 / ③ `--rebuild`；模型侧覆盖信号 = 工具描述 `path` 句（「`all` 仅已索引；未覆盖会话用 `path=<文件>` 显式查或先跑 `session index --rebuild`」）+ `--status` 覆盖计数 |
| 延迟拍（②）单趟界 | 会话枚举段受界（≤ `INDEX_PASS_MAX_SESSIONS` = 40 且 ≤ `INDEX_PASS_BUDGET_MS` = 2000——按源 mtime 降序）；拍尾清行段（源消失清运 `pruneMissingSessions`）**不受 40 界约束**——扫库内全量会话行逐条判活（如实登记） |

**验收回指（需求 §4.3 F-R19a / **F-R19c** / **F-R19d** · §4.4 F-S4；用例细表 = 批档 §2）**：
① 超大会话（> 50,000 消息夹具）经索引可答（返回 JSON 数组，非 `TOO_LARGE`）∧ 未索引同档仍逐字护栏文案（回落面零回归）——F-R19c；② `path:"all"` 跨 cwd 两会话命中 + 行内回查锚——F-R19a / F-R19d；③ 增量 = 追加 1 条 ⇒ 新增恰 1 行（其余行 `rowid` 不变）；④ 幂等 = 二次 pass 零读零写；
⑤ 重建 = 删库 / 坏库自愈（行数复原）+ `--rebuild` / `--status` 读数（F-R19d——零权威 · 可重建）；⑥ 零新依赖 + 主存零改（F-R19d / F-S4；`session-store.mjs` / `session.mjs` 零 diff + sessions 树文件「路径 / 字节 / mtime」三元组快照对拍不变）；⑦ 三端测试全绿。

**不做（边界）**：不迁主存（双线文件 = 真源——§6.14 语义零动）· 不做向量 / 语义检索（不引 embedding）· 不改默认路径与 `cwd:` 发现面 · 不改两道护栏与错误文案（回落面）· 不复刻其他消费面（`/session` 列表 / TUI 翻页 / `listSlots` 仍走主存）· 不索引裸 v1 `{hash}.json` · 不做 `.d` 孤儿目录清运（`session gc` 后缀表不含 `.d`——另案） · 不做索引自动清理 / 淘汰 · 不做库的跨端同步协议（索引 = 本机派生品）。

### 6.20 端名参数化与创建端字段（2026-09-25 · SLOT-END-PARAM 批）

> 解决的问题：① 端分离要求 marker 只由本端书写（NF1「本端记录 = 本端单写者文件」）——端名若不可在端进程内声明，非 CLI 端消费核 marker 入口即写 `.cli`（跨端互写），各端只能各自持一套行为副本（重复实现 + 端差）。② 「这个会话是哪个端建的」**数据不存在**：marker = 本端最后使用槽（端分离恢复用），槽元数据面无端名字段。

- **判据句 1（端名单源）**：端名 = **端进程内的单值声明**——模块级 `_end`（初值 = `END` = `"cli"`），`setSessionEnd(<端常量>)` 一次声明、`sessionEnd()` 读取；**缺省取值 = 进程端名 `sessionEnd()`**（`END` 仅模块级初值——CLI 进程零声明即得 `"cli"`）。核内**零端名分支**（端名是值不是分支——核不按端名走任何条件路径）。
- **判据句 2（marker 家族端参数）**：`endMarkerPath(cwd, end = sessionEnd())` / `readEndMarker(cwd, end = sessionEnd())` / `writeEndMarker(cwd, slot, end = sessionEnd())`；**显式参 > 进程端名**。
  写 marker 的核入口随动（枚举 = §6.10 D-4 维护点集）：显式端参 = `resumeSlot(cwd, { end = sessionEnd() } = {})` / `switchToSlot(cwd, slot, { end = sessionEnd() } = {})` / `deleteSlot(cwd, slot, { end = sessionEnd() } = {})`；
  进程端名 = `newSession`（D-4「成功后」写点——零改）/ `saveSession` / `persistEngTokens`；**未列写点一律走进程端名**（枚举遗漏不致跨端互写）。
- **判据句 3（零副本）**：端壳只允许**一行绑定转口**（`(cwd) => coreX(cwd, END)` 形态）——端壳内不得再有 marker 读写实现 / `usableSlot` / `resumeSlot` 本体的算法副本。
- **判据句 4（创建端字段）**：槽数据文件顶层 `createdBy`（值 = 端名）。**写**：本端**首次物化**该槽数据文件时写一次；此后每次整档重写**透传盘上键**；盘上文件无该键（老槽）⇒ **不写该键**（禁回填、禁冒充）。**读**：有键 ⇒ 端名；无键 ⇒ 「**未知**」（核只给「无值」；渲染文案归消费面）。
- **判据句 5（NF1 不动）**：marker 内容形态不变（`{slot, updatedAt}`）——**`createdBy` 不进 marker**（跨端事实不得落进本端单写者文件）。

**取值链（agent 写面 = `saveSession` / `persistEngTokens`）**：`guardForeignSlotFile` 一次磁盘解析**顺带解析创建端**并缓存 `agent._slotCreatedBy`——四分支：

| 守卫分支 | `agent._slotCreatedBy` | 依据 |
|---|---|---|
| 文件不在盘（`!existsSync`） | `sessionEnd()`（本端即首次物化者） | 盘上无记录可透传 |
| 解析通过、未轮转 | `disk.createdBy ?? null`（有键 = 端名；老槽 = `null`） | 盘 = 真值（守卫是全量解析的唯一落点） |
| 轮转（`.bak`）/ 损坏改名（`.corrupted`） | `sessionEnd()`（现场已挪走 ⇒ 本端重物化） | 活文件由本端写下 |
| mtime 命中（自上次检查/自写未变） | **不改**（沿用上次解析值） | 稳态零解析（既有 mtime 缓存契约） |

`saveSession` 在守卫调用**之后**注入 `fields.createdBy`（值为 `null` / `undefined` ⇒ 键不落盘 = 禁回填；**注入点必须先于守卫之后的写、且晚于守卫调用**）；`persistEngTokens` 既有文件分支读盘对象即自带该键，全新分支（最小记录）取 `agent._slotCreatedBy ?? sessionEnd()`。

**（cwd, slot）写面**：`newSlotData(cwd)`（首物化构造器——覆盖 `loadSlotForWrite` 全新分支 / VSC `newSlot` / `newSession` 并入）写 `createdBy: sessionEnd()`；`saveSlotData(cwd, slot, data)` 补一条——入参无 `createdBy` **且槽文件不在盘** ⇒ 落 `sessionEnd()`（本端首物化），文件在盘 ⇒ 不动（老槽禁回填）。

**读面（摘要 / 列表）**：`slotDigest(data)` / `digestFromStore(fields, counters)` 带 `createdBy`（**有值才带**——同 `activeModel` 先例）；`listSlots` 输出条目加 `createdBy`（缺键 ⇒ `""`——消费面自行渲染「未知」）。

**边界情形（读数面）**：

| 情形 | 读数 | 说明 |
|---|---|---|
| 老槽（文件在盘、无 `createdBy` 键） | 未知 | 禁回填；不得以占用端 / 本端名冒充 |
| 槽数据文件不在盘（认领先行、首保存落盘前） | 本端名 | 该文件由本端写下（本次物化） |
| 异会话现场轮转后重物化 | 本端名 | 轮转前的创建端随 `.bak` 现场保留 |
| 端名拼错（非常量） | 该端退化为「缺失」+ 孤儿 marker 文件 | 核不校验端名（端名 = 各端编译期常量）——登记为边界，不新增机制 |
| 同端多活进程 | 端名同值（端名 = 端级事实，非进程级事实） | marker 的「端内最后认领者」语义不变 |
| ACP 显式钉槽 / 模式 F（未绑定） | 与创建端字段无关 | 两套语义互不牵连 |

**验收回指**：① 三端零 marker 副本 → 判据句 3；② 端分离恢复零回归 + 三态不破 → 判据句 1 / 2（缺省 = 进程端名 `sessionEnd()`——CLI 零声明即 `"cli"` ⇒ CLI 全调用点零改；marker 路径与三态语义逐条不变）；③ 老槽缺字段 ⇒ 未知零猜测 → 判据句 4；④ 三包测试全绿 + `doc-check` 零新增闸态失败 → 落点表（批档 §2）。

**端差注销**：扩展端改消费核 `resumeSlot` 后获得核的 legacy 单文件兜底（端壳副本原无此项——端壳项登记 = §6.15 端壳款①（端差注销 · 零副本转口））——两端口径归一（D-SE38 纪律：端差默认消除）。

**不做（边界）**：不做端名校验 / 端名闭集机检 · 不改 marker 内容形态（NF1）· 不改桌面端设计档（`docs/desktop/**`）· 不迁 ACP 显式钉槽面（不经 marker）· 不回填老槽 · 不做「仅 digest 承载」（派生品重建即丢）。

### 6.21 会话级偏好槽字段（provider / model / effort）（2026-09-27 · 桌面批 B 核面小改）

> 解决的问题：桌面端「会话级模型 / provider / 推理档位」要求随会话槽持久化、与 CLI / 扩展端**同一份槽**（`docs/desktop/requirements/PROJECT.md` §3.1:47）；而核现无这三键的槽写出口（既有四钥 = `autoApprove` / `planMode` / `engineering` / `advisor.guard`），`effort` **连槽字段都不存在**（`saveSession` 字段表无之）⇒ 端侧只能落 config（全局态：切一处波及全部会话）或自建副本（跨端互写）。
> 本批取**授权核面小改**（批档 §1.2 A）：纯加法、老槽零行为变更。端侧契约（通道 / 载荷 / 回执）= `docs/desktop/design/IPC.md` §2「会话级偏好注」。

- **判据句 1（槽字段）**：`effort` = 槽数据文件顶层字段，值闭集 = `null`（未设 ⇒ 回落配置面 / 渠道默认——**老槽即此态**）∥ `"off"`（关思考**记号**，非枚举字面）∥ `specForModel(model).reasoningEffortEnum` 的成员字面。`provider` / `model` 两键入参映射既有 `activeProvider` / `activeModel`（不新增字段）。
- **判据句 2（写出口单点）**：新增 `setSlotPrefs(cwd, slot, patch)`（`thincoder-core/session-slot-write.mjs`）——沿 `setSlotAutoApprove` 同形，复用 `writeFlag`（读 → 改 → `saveSlotData`）单点；槽不可读 ⇒ `false`（写未发生）。`patch` 键闭集 = `provider` / `model` / `effort`，**至少一键**（零键 ⇒ 调用面拒）。
- **判据句 3（档位归一纯函数）**：`resolveEffortPatch(level, model)` —— `level` → 槽 `effort` 值；纯函数、不抛：`null` / `undefined` / `"auto"` ⇒ `null`；`"off"` ⇒ `thinkOffPath(specForModel(model))` 真 ⇒ `"off"`、假 ⇒ `null`（该模型无 off 路径）；其余 ⇒ 枚举含之 ⇒ 原字面、不含 / 无枚举 ⇒ `null`。
  **off 记号可达性判据单源 = `thincoder-core/think-off.mjs`**（`thinkOffPath` / `thinkOffShape`）、**档位值域单源 = `specForModel(model).reasoningEffortEnum`**（`thincoder-core/model-specs.mjs`）——核内零第二份族别表。`model` 取 `patch.model ?? 槽现值 activeModel`（同 patch 带 model ⇒ 以新值为准）。
- **判据句 4（施加面）**：`applySession` 在**模型合并支之后**应用 `data.effort`：`null` / 缺键 ⇒ 不动（沿用既有 config 链）；`"off"` ⇒ `agent.provider.thinking = thinkOffShape(spec)`（effort 族该形为 `null` ⇒ 另置 `agent.provider.reasoningEffort = "none"`——§16.4 载荷门）；
  枚举字面 ⇒ `agent.provider.reasoningEffort = <tier>`。**非活动槽只写盘**，切换时经本支生效；
  **桌面 ∥ CLI resume 同径本施加面**（桌面 `thincoder-desktop/src/main/session-io.mjs:25` · CLI resume 同径）——**VSC 侧无槽 effort 施加面（实读 2026-09-29）**：`thincoder-vscode/src/agent/agent-state.mjs:89-129`（`applySlotSessionState` 槽映射无 `effort`）；
  + `thincoder-vscode/src/agent/setup.mjs:152-155`（hydrate 只读槽 provider ∕ model）——且 VSC 全树零 `applySession` import ⇒ 槽 `effort` 在 VSC 既不读也不写（端差 = CLI ∕ 桌面写的档位在 VSC 恢复不生效）；**补接线归设计轮**（`applySlotSessionState` 增 effort 映射 + webview 初值播种）；档位归一单源 = 判据句 3。
- **判据句 5（保存携带 · 防整对象抹除）**：`saveSession` 字段表须带 `effort`（值取当前生效档位；**缺之 ⇒ 下一次回合保存把槽写面结果整对象抹除**——同族缺陷在案）；`newSlotData` 产 `effort: null`（全新槽规范结构同源）。**老槽无该键 ⇒ 读侧按 `null` 容忍——零行为变更**。
- **判据句 6（会话选定写回 · 2026-10-03 · 台账 #880）**：**用户显式选定**（会话级模型面**实变**——`provider` + `model` 两键写入 ∧ **比对单元 = 复合串 `provider:model` 是否变化**（`provider` 同值而 `model` 变——同渠道换模型——亦触发；写盘前读 ⇔ 写入值比对））⇒ 同拍写回 config `defaultModel = "<provider>:<model>"`（复合形单源 = `parseModelRef` 首冒号分割语义）；
  新会话起点随用户最后一次显式选择；**复合等值 ⇒ 零写**（防盘面抖动 ∥ 探针空转）；写成功 ⇒ 写后探一次（S3 同律）。
  **「选定」= 用户显式动作**：系统回退自动采用（`resolveProviderPlan` 回退入选——`doc:PROVIDER.md:§6.22`）**不写**；系统同步写（会话切换 ∥ 候选推送回声等**槽值未变**之写）**不写**（判据 = 槽面实变）。端侧各自实现（判据本句单源）——桌面落地面 = 2026-10-03 会话选定写回批（端侧契约 = `docs/desktop/design/IPC.md` §2「会话级偏好注」项 8）；CLI ∥ VSC 判定 = 同判据适用、落地另批（2026-10-03 设计轮起）。

**边界情形表**：

| 情形 | 行为 | 说明 |
|---|---|---|
| 老槽（无 `effort` 键） | 不设档位（回落 config / 渠道默认） | 禁回填——老槽零行为变更（同 `createdBy` 先例） |
| 表外档位串（跨端 / 手工写入） | 按 `null` 处理（不设） | 读侧容忍——核不校验端侧控件域（沿核读侧口径） |
| `"off"` 而模型不可 off（`thinkAlwaysOn` 族 / effort 族无 `none`） | 归为 `null` | 判据单源 = `thinkOffPath`——与端侧候选面同判据（两面不漂移） |
| 换模型（`patch.model` 不带 `effort`） | 槽 `effort` 原值保留、写入不做迁移 | 与新模型枚举不符 ⇒ 按表外行处理；不静默改写槽值 |
| 写非活动槽 | 只写盘 | 不碰当前内存态（`applySession` 是唯一施加面） |
| 槽不可读（`loadSlotForWrite` 返回 `null`） | 写返回 `false` | 沿四出口既有契约 |
| 选定写回：复合等值（选定串与 `defaultModel` 现值同串） | 零写（`defaultModel` 不变） | 判据句 6——防盘面抖动 ∥ 探针空转 |
| 选定写回：配置面写失败（`mtime-conflict` 等） | 不反扑会话写（回执仍 `ok:true`）；主侧 `console.error` 记错 | 判据句 6——定序槽先配置后；端侧契约 = `docs/desktop/design/IPC.md` §2「会话级偏好注」项 8 |
| 选定写回：回声（槽值未变之写——会话切换 ∥ 候选推送同值回写） | 零写（判据 = 槽面实变落空） | 判据句 6——系统同步不劫持全局默认 |

**验收回指**：① 桌面会话头三值切标签随动 + 非活动槽只写盘 → 判据句 1 / 4 / 5；② 老槽零行为变更 → 判据句 5 + 边界表首行；③ 档位候选面与写面同判据（不可 off 的模型两面一致）→ 判据句 3 + 边界表第 3 行；④ 三包测试全绿 + `doc-check` 零新增闸态失败 → 落点表（批档 §2）；⑤ 会话选定（模型面实变）⇒ `defaultModel` 实写回 ∥ 等值 ∥ 回声 ∥ 回退径零写 + **端到端 = 选定 ⇒ 新建会话 ⇒ 运行模型 = 最近一次显式选定**
（取数链 = 新槽创建（核 `newSession`，`thincoder-core/session-lifecycle.mjs:226`——空槽规范结构无会话级 provider/model）∥ 装配取数（核 `loadConfig` 归一链 `resolveProviderPlan`——`thincoder-core/config.mjs:332` ∥ `thincoder-core/model-ref.mjs:113`/:126：槽面无源 ⇒ `defaultModel` 档入选））→ 判据句 6（2026-10-03 批；用例 = 批档 §2 新会话起点条）。

**不做（边界）**：不改 CLI / VSC 端侧档位面（`/think` / `reasoning-mode.mjs` / `settings-panel-write.mjs` 各自实现沿用——「推理档位面端侧自有」既有裁定；本批只补**槽字段 + 写出口 + 保存携带 + 恢复施加**四事）· 会话级偏好自身不落 config（`settings:agent` 仍是设置面全局默认）——**例外 = 判据句 6 选定写回**（2026-10-03 起）· 不校验端侧控件域 / 不做档位闭集机检 · 不回填老槽 · 不动 marker 与槽认领语义。

### 6.22 会话清单盘面实读（2026-09-28 · SESSION-LIST-DISK 批）

> 来源 = 用户 2026-09-28 04:27 走查裁定「清单不能从 manifest 选，只能从盘面实际读，让 manifest 参与清单列表是过度设计」（症状 = 本户 50 槽文件 · 列表仅显 2 条）。需求层 = `docs/core/requirements/SESSION.md` §4.1 F5；批档 = `docs/batches/2026-09-28-session-list-disk.md`。

**判据句 1（条目来源 = 盘面实读）**：`listSlots(cwd)` 的条目集 = 本 cwd 槽文件枚举——sessions 根下匹配 `^<40 位 hash>\.json\.(\d+)$` 的**普通文件**（逐条出槽号 N）；manifest `m.slots` **不参与条目集**（既不筛也不补）。判定句：文件在盘 ⇒ 可见 · 文件删除 ⇒ 消失 · manifest 无条目 ⇒ 不隐形。

- 前缀 = `sessionPath(cwd)` 的 basename（哈希 + `.json`）——与 `slotPath` 同源；短哈希迁移已随该调用先行（先迁移、后枚举）。
- **后缀排除闭集**：`.manifest` / `.manifest.<端名>` / `.tmp` / `.corrupted` / `.unreadable` / `.bak-<ts>` / `.d`（记录存储目录，§6.14）/ `.stale-<ts>`——数字槽号正则全锚已排除非槽文件，目录由「普通文件」判排除。
- **遗留单档（v1/v2 单会话）不入列**（D-SE57）：无槽号 ⇒ 三端行键空间（核条目 `slot: number` · 桌面十进制串键 · 落点按槽号切换）不可表达；其数据面兜底照旧（§6.10 D-2 `loadLegacyFile`）。实测（2026-09-28）= 本户该形态 0 档。

**判据句 2（元数据取数链 + 读放大上界）**：每槽按级取数、**免费先行**——① 摘要快路（摘要在场且 `ts ≥ 文件 mtime` ⇒ 整条由摘要供给、**槽文件零字节读**）；② 小档全读（`size ≤ SCAN_FULL_MAX` = 256 KiB ⇒ JSON 全解析、全字段）；③ 大档早键截读（读头 `min(size, SCAN_HEAD_BYTES)` = 64 KiB）；④ stat 兜底（`updatedAt` = mtime）。字段优先级 = **盘面实读值 > 摘要值（任意新鲜度）> 缺省**（`""` / `0` / mtime）。

- **快路比较口径（单源 · §6.4 指针此条）**：比较字段 = 摘要条目 **`ts`（摘要落盘时刻）** vs 槽文件 `statSync().mtimeMs`——**`ts ≥ mtime` = 新鲜**（同值 = 新鲜 · inclusive）；**不得以 `updatedAt` 比**——`updatedAt` = **会话逻辑时**，取于写槽文件**之前** ⇒ 恒早于 mtime（实施实证 2026-09-28 · 本户 slot 48/50：mtime − `updatedAt` = +1.5 / +107.6 ms）⇒ 按它比快路生产永不命中。
  **打点时机** = `ts` 取于摘要构造时 `Date.now()`（`thincoder-core/session-slots-manifest.mjs:52` · `thincoder-core/session.mjs:95`），构造在槽文件写入**之后**（`thincoder-core/session.mjs:184-186`）⇒ **墙钟与 mtime 盖章偏差实测存在**（`mtimeMs − Date.now()` ∈ [−7.4, **+8.5**] ms · 198/300 为正 ⇒ 原「恒新于当次 mtime」不成立）
  ⇒ **核实面回写 `ts` = `max(墙钟, 该档 mtime)`（地板）**（`thincoder-core/session-slot-verify.mjs:99`；2026-09-28 L3-8 修）；端侧 `slotDigest`（`thincoder-vscode/src/extension/session-io.mjs:150`）裸墙钟 = 同族残余——**消（补做地板；#677 实施清单）**。
  他写者改写 ⇒ 该档退 ② / ③（**少命中 = 性能面，正确性零险**——永不把陈旧摘要判为新鲜）；既知窗口 = 槽文件被他写者改写于本进程摘要打点之前（同刻级）⇒ 快路可陈旧一轮（下次全读自纠）。

- **早键截读** = 结构感知扫描（非正则）：自首字节走 JSON 顶层键、**遇 `history` 即停**（其后的键不读）。供给面：`title` / `updatedAt`（键序实测两代写者皆在 `history` 前）· `firstMessage`（窗内首个真实用户消息——谓词单源 = `thincoder-core/history-window.mjs`）· `activeProvider` / `activeModel` / `createdBy`（键序靠前时可得；老代槽该三键落在 `history` 之后 ⇒ 缺席、由摘要补位）。
- **计数两类字段不在 ③ 供给面**（`messageCount` / `turnCount` 需 `history` 长度；精确计数 = 全档扫描——实测 312 MB 档需 1,844 ms 同步 ⇒ 否决）：由摘要补位（D-SE56）；盘面全读只发生在 ②（≤256 KiB）。
- **读放大上界（可机检）**：单次调用槽文件读 ≤ `SCAN_BUDGET_BYTES`（4 MiB）∧ 单档 ≤ `SCAN_FULL_MAX`（256 KiB）∧ fresh 摘要档 = 0 字节；预算按 mtime 降序耗用（最上面 = 用户最可能看的行），越预算条目退 ④。
- **实测读数**（本户 50 档 / 312 MB · 2026-09-28）：枚举 + 50 × stat = **3 ms** · ③ 50 × 64 KiB = **2.75 MB / 6 ms** · ② 6 档 / 2 KiB ≈ 1 ms；对照 = 全读 50 档 = **312 MB / 1,844 ms**。
- **实现落点**：新档 `thincoder-core/session-slot-scan.mjs`（枚举 / 早键截读 / 取数链装配三面；`SCAN_*` 常量单源住该档）；`thincoder-core/session-slots.mjs` 的 `listSlots` 收敛为组合 + 条目投影（行形态零改）。

**判据句 3（排序 / 高亮 / 降级）**：

- 排序 = `updatedAt` 降序（同值按槽号降序）；`updatedAt` = 盘面值 ?? 摘要值 ?? mtime；预算耗用序 = mtime 降序。
- `isActive` = 槽号 === `m.active`（**D-5 语义零改**）；manifest 无该槽条目不影响该判据。
- **降级阶梯（入列不筛）**：坏 JSON / 半写 / `version > 2` / 异 cwd 内容档一律入列（存在性 ≠ 可读性）——显示 = 标题回退链落 `"(empty)"`（§6.7 链不变）、计数 `0`、日期 = mtime；点开走既有失败面（读失败改名 `.corrupted` 保留现场 ⇒ 下一轮列表不含该条；残留 GC 30 天）。

**判据句 4（可达性：存在性判据改盘面）**：**盘上存在即可用**——三处存在性判据由「manifest 条目」改「盘面文件」（切换 / 删除 = 盘面 ∨ 条目；恢复可用 = 盘面单判）：

- 槽切换（`thincoder-core/session-lifecycle.mjs:317`）与槽删除（`thincoder-core/session-slots.mjs:229`）：准入改「盘面文件存在 ∨ manifest 有条目」——**旧分支逐字保留**（有条目无文件 ⇒ 同今日：切换经读槽返 null · 删除仍清条目），**新增唯一分支** = 盘上有文件且无条目 ⇒ 放行。
- 恢复可用判据（`thincoder-core/session-slots.mjs:252`）：去条目合取、改**盘面文件单判**——盘上有文件的记录槽即可恢复，条目缺失不再使其不可用。
- **认领 / active / 槽号分配逻辑本体零改**（只换「存在」这道门）；开槽 / 保存路径自然补写该槽摘要 = 允许（自愈），不新增整档写路径；ACP 会话装载本就直读槽文件（无条目门），本次扩展与之一致。

**判据句 5（消费面零改）**：三端 + 两面全经核 `listSlots` 单源消费、字段名与类型零变 ⇒ **零改**：

- CLI `/session`（`thincoder-cli/src/tui/cmd-session.mjs:44`）· CLI 启动提示（`thincoder-cli/src/tui/startup.mjs:234`——用途 = 「N sessions」提示行，非渲染列表）。
- VSC 面板下拉（`thincoder-vscode/src/extension/panel-session.mjs:230`，经 `thincoder-vscode/src/extension/session-io.mjs:57` 转口）。
- 桌面左列（`thincoder-desktop/src/main/sessions.mjs:21-31`；`provider` 取数 = 核 `activeProvider`，照旧）。
- ACP `session/list`（`thincoder-cli/src/acp/handlers-slots.mjs:44`）· `read_history` 的 `cwd:` 发现面（`thincoder-core/agent-tools/read-history.mjs:232`）。
- **可观察面登记（需求 §2.2 F12 口径）**：ACP `session/list` 与 `read_history` 的 `cwd:` 发现面 = **条目集随盘面扩大的可观察面**（外部 ACP 客户端 / 跨会话检索可见条数变化）——两面调用面代码零改；需求档 F5 列举三端之外，逐条登记于此。

**边界情形**：空目录 / 无匹配 ⇒ `[]`；sessions 根不存在 ⇒ ENOENT 吞 ⇒ `[]`；数千档 ⇒ 条目全数入列（**`readdir` 全条目面 + `stat` 计入 O(N) 成本**——本户 1781 条目 readdir ≈60 ms（实测）；元数据按预算降级）；并发写窗口 ⇒ rename 原子性（读到旧档或新档，不见半档）；摘要 mtime 判据的已知缺口 = 现场回填（`.bak` 改名不改 mtime 序）⇒ 表头可能陈旧一轮（数据面仍直读盘、影响限于表头）。

**落点与测试面（清单承载）**：file 级落点表（行数 / 预期增量 / >300 档审视）与用例表（18 条 · 序号即用例组号 1–18）= **批档 §2.3 / §2.4**（一次性批次材料——本档不复制，判据 / 边界 / 决策留本节）。
尺度结论：`thincoder-core/session-slots.mjs` 现读 **322 行**（as-of 2026-09-28）· 本批净增量 **≈ −13**（`loadSlotMeta` 退役 + `listSlots` 主体收敛）⇒ 落 **309 行**（as-of 2026-09-28 实施后实读）——**500 硬线内 · 无档位拆分需要**（>300 软线承既有形态）；新档 `thincoder-core/session-slot-scan.mjs` = **已落 · 299 行**（as-of 2026-09-28 实施后实读）。
本批另触档 `thincoder-core/session-lifecycle.mjs`（切换准入——判据句 4）：现读 **354 行**（as-of 2026-09-28 实施后实读）· 净增 **≈ +2**（切换准入判据 + 随附注释）⇒ >300 软线承既有形态（拆档审视 = §6.24 尺度结论同档条）。

**验收回指（需求档 §4.1 F5）**：① 判定句（文件在盘 ⇒ 可见 · 文件删除 ⇒ 消失 · manifest 无条目 ⇒ 不隐形）→ 判据句 1（用例组 1–3）；② 读放大上界（单次 ≤ 4 MiB ∧ 单档 ≤ 256 KiB ∧ fresh 摘要 0 字节）→ 判据句 2（用例组 4 / 5——读计数桩）；
③ 降级阶梯（坏档入列不筛 · 标题回退链 · 计数 `0`）→ 判据句 3（用例组 6–10）；④ 可达性扩展（盘在 ⇒ 可开 / 可删 / 可恢复 + 负断言）→ 判据句 4（用例组 11–16）。

**不做（边界）**：不改认领 / active 指针 / GC / 槽号分配语义；不改槽文件与 manifest 形态；列表**调用本体**零写（不认领、不写 manifest、零探测——同步路径逐字不变；**摘要自愈的懒核实面 = §6.25 判据句 3 落点 B**）；不落新存储、不建索引；manifest 摘要的其余消费面（§6.2 认领 / §6.10 恢复继承）零动。

### 6.23 manifest 降级写护栏（2026-09-28 · MANIFEST-WRITE-GUARD 批）

> 来源 = 台账 #476（会话存储面根因项：`saveManifest` 降级路径以调用方内存对象整档写回——读不可信窗口内一次保存 ⇒ manifest 永久缩水，无告警无自愈；实证 = 本户条目 50 → {48,50}）。批档 = `docs/batches/2026-09-28-manifest-write-guard.md`。
> 清单面已由 §6.22 解耦（SESSION-LIST-DISK 批在途）——本批只动写面：认领 / active / `deletions` / `release` 语义零改。

**判据句 1（写前分类 · 仅可信基座可写）**：`saveManifest(cwd, m, deletions, opts)` 落盘前先分类 fresh 状态，仅两类情形调用 `writeSessionFile`：

- **① 合法创建**：manifest 路径不存在（读取抛 `ENOENT`——首建）⇒ 以调用方对象建新档（现行为保留）。
- **② 可信合并基座**：fresh 可读 ∧ JSON 可解析 ∧ 顶层为**非 null 非数组对象** ∧（`slots` 缺席或为对象）∧（`slotSessions` 缺席或为对象）⇒ 读-合并-写——条目级合并 / `deletions` / `setActive` / `opts.release` 四判据零改（§6.2）。
  缺席字段按 `{}` 归一（与 `loadManifest` 的 `!m.slots → {}` 宽容线同向——空基座可合并、不拒写）。

**判据句 2（不可信基座 ⇒ 拒绝写 · 盘面零变更）**：文件在盘而基座不可信 ⇒ `writeSessionFile` **零调用**：

- **(a) 读失败**（非 ENOENT：EISDIR / EPERM / EBUSY 等）⇒ 拒写 · **不改名**（读不到 ≠ 损坏——现场原样保留；该窗口正是缩水损伤的实证成因窗口）。
- **(b) 解析失败**（`JSON.parse` 抛）⇒ 拒写 · 保底改名 `{manifest 路径}.corrupted`（现场保全 + 解封下一写；改名失败不阻断拒写）。
- **(c) 形态非法**（顶层非对象 / 数组 / `slots` 非对象 / `slotSessions` 非对象）⇒ 拒写 · 保底改名同 (b)。
- 判据总句（可机检）：**「文件存在 ∧ 基座不可信」⇒ 本次调用对盘面零字节写**（除 (b)(c) 的一次改名）。

**判据句 3（loud 报告 + 返回值信号）**：

- 拒写每次发一行 `console.error`：`[session] saveManifest: write refused (reason=<read-failed|parse-failed|shape-invalid>) path=<p>`——(b)(c) 附 ` preserved=<p>.corrupted`。
- 返回值：`true` = 已落盘；`false` = 拒写（新增返回面；**唯一消费点 = `releaseClaimsAll` 透传**——`return saveManifest(...) !== false`；其余调用点忽略——零行为变化）。
- 拒写不回滚调用方内存态（认领等内存变更为调用方所有；下一次保存重试——失败容忍形态与 F-XR1 同向）。

**判据句 4（相邻面零改）**：`loadManifest` 降级读**不改**（读失败仍静默返 `{slots:{}, sessionId:null}`——护栏在写面收口：读面不伤盘）；`writeSessionFile` 原子写 / 降级直写零改；
`.corrupted` 命名与槽文件面同形（§6.1 后缀族；残留 GC 保留期 30 天照旧）；认领 / active / 删除 / GC / 槽号分配语义零改。

**判据句 5（自愈明裁：不做——射程 = 权位面）**：盘面 ∪ 条目对账回填**不做**（**射程限定**：本句限 `slotSessions` / `active` 两**权位**面——其中 ② 理由所述「摘要面自然自愈」已由 **§6.25** 扩为显式两落点自动补写；用户 2026-09-28 06:05 裁「全自动 · 不设用户入口」）——三条理由：

- ① **`deletions` 语义冲突（禁复活已删意图）**：删除意图的唯一可靠表达 = `deletions` 参数（D-SE4）；删文件是 best-effort（`unlinkSync` 失败被吞——`thincoder-core/session-slots.mjs:232`），
  盘面枚举看不见「已删意图」⇒ 残留文件会被回填成条目 = 复活已删意图（要治它须为「已删意图」造持久台账——新状态面，超本批且与「manifest 退为缓存」方向相抵）。
- ② **收益已被 §6.22 消解**：清单 / 可达性改盘面实读 ⇒ manifest 丢失的残留面 = 摘要缓存 + 认领 + active；摘要面有**自然自愈**（开槽 / 保存路径自然补写该槽摘要——D-SE58；具体路径 = 每次保存回写本槽摘要，`thincoder-core/session.mjs:173-177`）。
- ③ **不可由盘面推导者不得回填**：`slotSessions`（属主）/ `active`（共享指针）无盘面证据——回填即发明（D-6：active 只由显式翻指针调用点写）。

**判据句 6（与 §6.22（SESSION-LIST-DISK 批）零交叠）**：文件面零重叠——本批改 `thincoder-core/session-slots-manifest.mjs`；该批改 `thincoder-core/session-slots.mjs` / `thincoder-core/session-lifecycle.mjs` + 新档 `thincoder-core/session-slot-scan.mjs`。
机制面 = 本批写面（拒不可信写）∥ 该批读 / 列表面（条目集与可达性）——判据互不引用（本批判据在其落地前后同真值）；方向同向（护栏只减少写、不新增写路径——不与「自然补写允许」相抵）。

**边界情形**：① 同名 `.corrupted` 已存在 ⇒ 改名覆盖（单槽位 · last-wins——改名覆盖语义本机实测通过 · 既行为）；② 首建 TOCTOU（ENOENT 检出后他进程创建 ⇒ 其新档被本次覆盖）——既有窗口、本批不改；③ 拒写期间的 `deletions` 意图延后至下一次成功保存生效；④ 锁释放 / 外部修复 ⇒ 下一次保存正常合并；⑤ 连续损坏 ⇒ 逐次拒写 + 逐次改名（现场 last-wins）。

**落点与测试面（本批承载）**：file 级落点表（行数 / 预期增量）与用例表（G1–G11 · 故障注入面） = **批档 §2.3 / §2.4**（一次性批次材料——本档不复制，判据 / 边界 / 决策留本节）。
尺度结论：`thincoder-core/session-slots-manifest.mjs` 现读 **324 行**（as-of 2026-09-28）· 本批净增量 **≈ +40** ⇒ 落 ≈364 行——**500 硬线内 · 无档位拆分需要**；**拆档审视：承既有形态（既有裁定）**。

**验收回指（台账 #476 · 本批验收标准）**：① 护栏判据（可机检）→ 判据句 1–3（用例组 G1–G8）；② 自愈边界 / 明裁不做 → 判据句 5；③ 用例面（护栏触发 + 故障注入）→ 批档 §2.4（G1–G11）；④ 行数尺度 → 上段；⑤ 与 §6.22 零交叠 → 判据句 6。

**不做（边界）**：不做自愈 / 存量损伤修复 / `.corrupted` 残留 GC（30 天 GC 属既有面）；不改 `loadManifest`（后续若要求 loud 读面 = 另议）；不改 `writeSessionFile`；不动认领 / active / `deletions` / `release` 判据；三端（CLI / VSC / 桌面）与 ACP 调用面零改（拒写对外可观察面 = stderr 一行 + 返回值）。

### 6.24 打开态读数（会话恢复的上下文读数单源）（2026-09-28 · 桌面残余批）

> 来源 = 用户 2026-09-28 04:55 走查裁定（台账 #479「D17 恢复态播种」立链——桌面端打开 / 切换既有会话后状态行读数段不亮；CLI 对位 = 恢复即水合，`thincoder-core/session-lifecycle.mjs:110` `agent.tasks = data.tasks ?? []`）。批档 = `docs/batches/2026-09-28-desktop-residuals.md`；需求层 = `docs/desktop/requirements/PROJECT.md` §4 D17 补句。

**判据句 1（出口面 · 只读纯投影）**：核新出口 `sessionReading(data, { providers, fallback })`（`thincoder-core/session-lifecycle.mjs`；`thincoder-core/session.mjs` 同名 re-export 随动）——槽数据 ⇒ 状态行上下文读数百分数（整数）。
**零副作用**：`data` / `providers` / `fallback` 皆入参（不读盘、不写盘、不改任何进程态）；`data` 非对象 ⇒ `0`（与空历史同值——「非正 ⇒ 零节点」显示门归端侧，沿 `historyPercent` 空历史口径）。

**判据句 2（与 applySession 后读数同源同式 · 三事同判）**：读数 = `historyPercent(mergeAdjacentAssistantEchoes(machineLine), mergedProvider)`——与 `applySession` 后的 `historyPercent(agent.history, agent.provider)` 同输入同公式：

- **线选**：`contextHistory` 非空 ⇒ 取之；否则 `history` 经 `stripTruncatedToolArgs` 回退（v1 老档同径——与 `applySession` 机读线选择同判）。
- **回声归并**：`mergeAdjacentAssistantEchoes`（`thincoder-core/context-echo.mjs`——经 `context.mjs` 转口可达；`applySession` 装线前同一步；干净输入同引用返回）。
- **渠道合并**：槽 `activeProvider` 在册**且持 key** ⇒ `{ ...entry, model }`——`model` 按统一模型面序取（槽 `data.activeModel` ∥ `defaultModel` 属本渠道 ⇒ 其模型段 ∥ `entry.model`；单源 = `doc:PROVIDER.md:§6.22`）；未命中（不在册 ∥ 无 key）⇒ `fallback`（支 ②「静默保持现状」的装配口径 = `loadConfig().provider`）。
- **公式**：`historyPercent`（`thincoder-core/token-window.mjs`——与 CLI 状态行 / VSC `ctxPercentForHistory` 同式；不新增第三口径）。

**判据句 3（端壳转口 · 零算法副本）**：桌面端壳 `thincoder-desktop/src/main/session-slots.mjs` 只做出参装配（`loadConfig()` → `providersList` / `provider` 传入）与有效门（数字 ∧ `> 0` ⇒ 携读数；否则键缺席）；配置不可读 / 读数计算抛 ⇒ `usage` 键缺席 + `console.error`（零静默；`history:page` 读面保持 fail-soft）。

**判据句 4（消费面 = 桌面打开态播种 —— 本批范围）**：桌面「打开 / 切换既有会话」以本读数播种状态行读数切片（载波 = `history:page` 回执 `seed`；形态 / 在场条件 / 缺席降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」）。
本出口 = **只读**面——CLI / VSC 状态行既有读数路径（活 agent 逐帧）零改；核内 `applySession` / `saveSession` / 槽字段零动。

**边界情形**：① 老槽（无 `contextHistory` / 无 `activeProvider` / 无 `activeModel`）⇒ 回退径逐条成立（线回退 / 渠道回退）——与 `applySession` 同容忍；② 渠道已删（槽 provider 不在配置）∥ **槽渠道无 key** ⇒ `fallback`
（与「静默保持现状」同向——key 门单源 = `doc:PROVIDER.md:§6.22`）；③ 空历史 / 短历史 ⇒ 读数 `0`（端侧显示门不落节点）；④ 表外档位 / 类型脏载与本读数无关（只读 `provider.model` / `provider.context` 两键——不入类型判定链）。

**落点与测试面（本批承载）**：file 级落点表与用例表 = **批档 §2**（一次性批次材料——本档不复制）。
尺度结论：`thincoder-core/session-lifecycle.mjs` 现读 **352 行**（as-of 2026-09-28）· 本批净增量 **≈ +34** ⇒ 落 ≈386 行——**500 硬线内 · 无档位拆分需要**；**拆档审视：承既有形态（既有裁定）**。
同批随动两档：`thincoder-core/session.mjs` 现读 **254 行** · 净增量 **≈ +1**（`sessionReading` 同名 re-export 随动——无结构改动）；桌面端壳 `thincoder-desktop/src/main/session-slots.mjs` 现读 **154 行** · 净增量 **≈ +41**（口径 = 该档本批总增量——批档 §2.3：`pageHistory` 出 `seed` + `openingSeed` 投影；判据句 3 的出参装配 + 有效门为其一部分）。

**验收回指（台账 #479 · D17 补句）**：① 打开 / 切换既有会话 ⇒ 读数切片以槽数据播种（`tasks` 直取 + `usage` 本出口）→ 判据句 1–3（批档 §2 用例组 D17-*）；② 恢复态与 CLI 同见 → 判据句 2（同源同式）；③ 缺席降级 / 零假造 → 判据句 1 / 3 + 播种注。

**不做（边界）**：不改 `applySession` / `saveSession` / `switchToSlot` / `resumeSlot` 语义；不新增槽字段（读数不落盘）；不改 CLI / VSC 状态行；不改 `historyPercent` / `estimateTokens` / `mergeAdjacentAssistantEchoes`（公式与归并件零改——只组合）。

### 6.25 会话账本摘要可靠化（2026-09-28 · LEDGER-RELIABILITY 批）

> 来源 = 用户 2026-09-28 06:00 走查裁定「列表计数的问题缓存可以在，但是能让他靠谱点吗？别老出问题？」+ 06:05 口径裁定「不需要公开入口让用户去操作，用户不会做这个」；需求层 = `docs/core/requirements/SESSION.md` §4.6（F-L1–F-L5）；台账 = #487 / #488；批档 = `docs/batches/2026-09-28-ledger-reliability.md`（file 级落点表 / 用例表 = 批档 §2——一次性材料，本档不复制）。
> 存续前提（有效 · 不动）：§6.22（条目集 = 盘面实读 / 取数链四级 / 读放大上界与 F-SL1 预算）· §6.23（拒写不可信基座 / `.corrupted` 现场保全 / 拒写 loud 与返回值信号）。
> 本批只动**摘要面**（写回时机 / 显示语义 / 写安全）：槽 JSON 形态 / `version` / 端标记 / 认领 / `active` / `deletions` / 释放判据 / 记录存储（sidecar）面零改。

**判据句 1（零权威）**：摘要字段闭集（`ts` / `messageCount` / `turnCount` / `firstMessage` / `activeProvider` / `activeModel` / `updatedAt` / `title` / `createdBy`）= **展示与提速面**——删档 / 清空 `m.slots` / 全缺三态下，四判据逐条由盘面供源：
清单（`thincoder-core/session-slot-scan.mjs` 盘面枚举 · §6.22 判据句 1）· 准入（§6.22 判据句 4 盘面单判）· 打开（本端 marker + 盘面存在性 `thincoder-core/session-slots.mjs` `usableSlot`）· 保存（直写槽文件 `thincoder-core/session.mjs` `saveSession`）。

- `m.slots` **键位**的既有权重面三处（**非权位**——逐条零影响）：
  ① `ensureActive` 分支 1 的 `m.slots[m.active]` 存在性（丢失 ⇒ 退分支 2/3 重新分配——多开一槽，数据零险）；
  ② `allocateFresh` 分支 2 的键集枚举（丢失 ⇒ 只少「回收文件缺失的空号」候选——现存文件由 `existsSync` 护住）；
  ③ 分支 3 取 `max(键)+1`（丢失 ⇒ 号位回退更小值——`existsSync(slotPath)` 跳过现存文件 ⇒ **零碰撞**）。
- 判定句（可机检）：删 manifest 整档 ∥ `m.slots` 清空 两态 ⇒ 列表条目集不变 ∧ 逐字段退盘面供给面（不可得者 = `null`——**不假造**）∧ 打开既有会话仍落原槽。

**判据句 2（可重建 · 单源 = 槽文件 · 全自动）**：重建函数 = 既有 `slotDigest`（`thincoder-core/session-slots-manifest.mjs:61`——与保存面**未绑定路径**同函数，字段单源；**绑定路径** = `digestFromStore`，`thincoder-core/session.mjs:88`——**同形**，§6.20 两产者并列）；**重建径全自动 · 不设用户操作入口**（CLI 命令 / 桌面按钮皆不设——用户 06:05 裁）。三路并行：

- **A 打开 / 切槽顺手补写**（判据句 3 落点 A）· **B 读面懒核实**（判据句 3 落点 B）· **C 保存面既有回写**（`thincoder-core/session.mjs:172-177`——§6.23 判据句 5 ② 已裁「自然补写允许」，零改）。
- 判定句（可机检）：清空 `m.slots` ⇒ 逐槽经 A / B / C ⇒ 条目**逐字段**等于重建函数对同档的重建值（`ts` 除外 = 写回时刻）；**等值取源随会话形态**——未绑定 = `slotDigest`（全解析）∥ 绑定（记录存储）= `digestFromStore`（同形——`thincoder-core/session.mjs:88`）。
- 老槽缺键（`createdBy` / `activeModel`）⇒ 重建亦**缺席**（未知——**禁发明**，承 §6.20 判据句 4 读面）。

**判据句 3（丢失自愈 · 懒核实）**：

- **不可信谓词（单源）**：`needsVerify(entry, mtime)` = 条目**缺失** ∨ 条目 `ts < mtime`（陈旧）∨ **计数两字段任一非数**（不可得）。**真 0 不触发**（盘面实读 0 ∥ 摘要带数值 0 = 可信）；不可得（`null`）触发——即用户 06:08「碰到 0〔不可得的 0〕或没有就核实」的设计形。
- **落点 A（打开 / 切槽顺手补写 · 零额外读 + 零额外写）**：新出口 `healDigest(m, slot, data, mtime)`（住 `thincoder-core/session-slots-manifest.mjs`）——数据已在手 ⇒ **零额外槽文件读**；置入调用方 manifest 对象 ⇒ 随 `claimSlot` / `switchToSlot` **既有那次** `saveManifest` 落盘（`thincoder-core/session-lifecycle.mjs:334`）⇒ **零额外写**。
  `resumeSlot`（`thincoder-core/session-slots.mjs`）**读序前移**：`loadSlotFile` 先于认领落盘——纯读 + 认领决策树 / 保留集 / 端标记 / `.unreadable` 与 `.corrupted` 改名语义逐条零变。
- **落点 B（读面懒核实）**：扫描在装配行时收集**不可信档清单**（`needsVerify` 为真者，按 **mtime 降序** = 用户最可能看的行先核）；`listSlots` **同步返回后**将清单交**核实面**调度（新档 `thincoder-core/session-slot-verify.mjs`——落点详下「落点与测试面」段）——**调度本身 = 纯内存登记 + 启动窗外延迟拍**（`VERIFY_TICK_DELAY_MS` = 3s；见下「启动窗关系」条）：零 I/O / 零同步阻塞 ⇒ 首答 F-SL1 50 ms 不被拖慢。
  · **启动窗关系（D-SE39 实证直导）**：`setImmediate` 点火与启动链同循环（pass 在跑时 `resumeSlot` 126 ms → 1.9 / 3.8s、无参启动拒印 2.96 / 4.16s——验收 ≤2s ✗）⇒ 核实拍 = **与 `GC_PASS_DELAY_MS` 同款延迟拍**（`setTimeout`——3s，自调度点起；`unref`——不持活）⇒ 核实起点 ≥ 调度点 + 3s = 结构落于启动窗外；**启动路径纳入 N-L1 机检**（批档 §2.5——结构 + 行为两断言）。
  · **核实 = 单档流式结构扫描**：读该档**整档**（唯一能取计数的源——③ 早键截读面不含计数，D-SE56）；分块粒度 `VERIFY_CHUNK_BYTES` = 1 MiB ∧ **逐块 `await` 让出**（宏任务让位——`setImmediate`）**⇒ 零 ≥50 ms 连续同步段**。
  · **不整档物化**（不 `JSON.parse` 整档、不建 `history` 数组）：走顶层键 → 遇 `history` 后**逐元素结构定界计数**（`messageCount`）
  + 逐元素切片解析 + `isRealUserMsg`（单源 = `thincoder-core/history-window.mjs`，判 `turnCount`）+ 取 `firstMessage`；字符串 / 转义跨块续读（结构定界，零正则）。
  · **预算（可机检 · 有界核实）**：每轮核实累计读 ≤ `SCAN_BUDGET_BYTES`（4 MiB——常量单源住 `thincoder-core/session-slot-scan.mjs`，零新增预算常量）；**超预算大档**（单档 > `SCAN_BUDGET_BYTES`——整预算 4 MiB）⇒ 整档分块读且**该轮至多一档**；未覆盖者**留待下次列表调用**（最坏场景 = 摘要全清空 ⇒ 随列表调用**逐次补齐**，非一次全扫）。
  · **不重复（三条）**：① 核完即**回写摘要**（`ts = max(Date.now(), 该档 mtime)`——**mtime 地板**：墙钟可早于文件时间戳盖章〔实测 ±8.5 ms〕⇒ 防「刚核完即判陈旧」重核；2026-09-28 L3-8 修）⇒ 该档回快路（下次列表快路命中 = 零读——可机检 `_scanStats.fastPath`）；
    ② **单飞**：同 cwd 一轮至多在飞（重复调度即返；在飞档集内不重复入队）；③ **负缓存**：核实失败（坏档 / 不可读 / 校验门不过）⇒ 记 `{slot → mtime}`（进程内），**同 mtime 不再重试**（文件变更 ⇒ 重新可核）——防每轮重读同一坏档。
  · **单源判据（用例强制）**：流式所得字段与 `slotDigest` 对同档全解析所得**逐字段相等**。
  · **回写**：该轮各档核完 ⇒ **尾部一次合并写**（多档合一；`deletions` / `setActive` / 认领面零触碰——写面仅限**摘要条目**）；槽文件坏 / 异 cwd / `version > 2` ⇒ 校验门不过 ⇒ **不写回**（不发明摘要——入负缓存）。
  · **核实面缝与生命周期（测试隔离）**：观测计数 `_verifyState`（`_scanStats` 同惯例——生产零消费）· **可等待句柄 `_verifyIdle()`**（「无 pending 拍 ∧ 无在飞轮」即决——用例等待缝，**禁时间等待**）·
    延迟拍缝 `_setVerifyDelayForTest(ms)`（同 `_setSessionGcDelayForTest` 形态：置 0 点火勿真等；还原 = 置回 `VERIFY_TICK_DELAY_MS`）· 复位 `_resetVerifyStateForTest()`（清 pending 拍 + 计数 + 负缓存）。
    **在飞轮去向**：① 目录切换（`_setSessionsDirForTest` / 复位）——轮负载捕获调度时刻 sessions 根；拍起点与写回前校验「捕获根 === 当前根」，不等 ⇒ **弃轮**（零跨根写）；② 进程退出——pending 拍 `unref` 不持活；在飞轮无拦截（跑完或随进程终止丢弃——均安全：下轮重核，预算内）。
- **落点 C（保存 · 既有）**：`saveSession` 每次保存回写本槽摘要——**零改**（本批明确其为自愈落点之一）。
- **触发面边界**：列表**调用本体**不写（§6.22 不做行收正为「调用本体零写」）；核实写面**仅限摘要条目**（不认领 / 不写 `slotSessions` / 不动 `active` / 零探测）。
- **不做后台全量扫**（用户 06:08 口径的直接导出）：懒核实覆盖面 = **凡被列表的 cwd 的每一档**（不可信行逐次全数核到）；**唯一覆盖不到的面 = 「从不列表的 cwd」**——该面下摘要无任何消费方（无展示 · 准入不依赖 · 槽号分配不依赖 ⇒ 零影响）⇒ **不保留**全量扫路径（全量扫 = 首答外的新争用面，且与预算线相抵）。
- **行级刷新（本批定形：不做推送）**：核侧**不给**端侧推送通道（消费面零改红线——`listSlots` 签名与行形不变）；可见刷新 = **端侧下一次列表渲染自见**（CLI `/session` 每次调用即重列 · VSC 下拉 / 桌面左列随其列表事件）。端侧主动刷新（推送 / 订阅通道）= **随动指针**（见批档 §2.7）。

**判据句 4（失效可见 · 不撒谎）**：

- **数据面（不可得 = `null`）**：计数不可得 ⇒ `listSlots` 行 `messageCount` / `turnCount` = **`null`**（**不是 0**——真 0 与「不知道」必须可分）。
  落点：`thincoder-core/session-slot-scan.mjs` `mergeFields` 计数两字段缺省 `0 → null`（**值替换 · 净增 0 行**）· `thincoder-core/session-slots.mjs` `listSlots` 投影 `?? 0 → ?? null`。
  存量「计数 0 与未知二义」登记（§6.22 判据句 3 / D-SE56）**随之注销**（不可得以 `null` 表达）。
- **显示面（不可得标 · 禁显示数值 0）**：形态随渲染面既有能力——**段缺席**（结构化渲染面：桌面左列行元数据族既有 `Number.isFinite` 门 = `thincoder-desktop/renderer/views/session-control.mjs:58-59` ⇒ **零改**）
  ∥ **`—` 占位**（文本行面：CLI `/session` 行 `— turns` = `thincoder-cli/src/tui/cmd-session.mjs:77` · VSC 会话栏 `—msgs` = `thincoder-vscode/webview/session-bar.js:53` · `read_history` 的 `cwd:` 发现行 `messages: —` = `thincoder-core/agent-tools/read-history.mjs:238`）。
- **账本异常 ⇒ 用户可见信号**：新出口 `ledgerHealth(cwd)`（判据单源住 `thincoder-core/session-slots-manifest.mjs`）返回 `{ refused, lastReason, lastPath, lastAt, scene }`——`refused` = 本进程累计（§6.23 拒写 + 判据句 5 读回失败）；`scene` = 该 cwd 的 `{manifest}.corrupted` 在盘（损坏现场）。
  · **本批接线（CLI · 两处）**：`/session` 列表头部行（`thincoder-cli/src/tui/cmd-session.mjs`）∧ 启动会话提示行（`thincoder-cli/src/tui/startup.mjs:234-237` 邻位）——`refused > 0 ∨ scene` ⇒ 追加一行警示（含 reason 与「打开会话即自动补回」指引；`scene` 在场附「现场档保留 30 天」）。
    **在场条件不继承 `allSlots.length > 1`**——单会话 / 零会话项目同样在场（与多会话 Tip 行彼此独立）。**「只有 stderr」不再成立**（F-L4 要求）。
  · **本批接线（VSC · 会话下拉）**：`sessions` 消息**增字段** `ledger`（`{ refused, reason, scene }`——异常才携；判据单源 = `ledgerHealth(cwd)`）⇒ 下拉首行**警示注记**（非可点条目；文案 = 键 `session.ledgerNotice`）。落点 = `docs/vsc/design/WEBVIEW.md` §4 + `docs/vsc/design/WEBVIEW-PROTOCOL.md`（§2 / §6.3 / §12）。
  · **随动指针（桌面 · 不在本批）**：桌面端壳同出口警示面 + 桌面需求档 D23 文案——桌面两档（`docs/desktop/design/*` / `docs/desktop/requirements/PROJECT.md`）处评审 **#32** 冻结窗；落定后由父侧同笔（见批档 §2 上抛）。
- **ACP `session/list` = 协议面**（外部客户端契约）：`messageCount ?? 0` **保持**（`thincoder-cli/src/acp/handlers-slots.mjs:52`——数值契约零变；不可得显示为 0 属协议面既有取舍，**登记**）。

**判据句 5（写安全）**：

- **原子写**：`writeSessionFile` tmp+rename 既有（`thincoder-core/session-slots.mjs:154`）；**账本面补强 = 独占临时名**——`saveManifest` 两路写携带 `{ tmpUnique: true }`，临时名 = `${p}.${pid}-${seq}.tmp`（进程内自增）⇒ 清掉「同路径并发写者共用 `${p}.tmp` ⇒ 互覆 / 混写」类。
  **槽文件 / 端标记面零改**（单写者纪律 + 孤儿 `.tmp` 回收面依赖 `${p}.tmp` 定名——明裁）；新名归既有 `.tmp` 后缀族（§6.22 判据句 1 排除机制零改）。
- **写后读回（新增 · 账本面）**：`writeSessionFile` 之后读回**结构校验**（`JSON.parse` 成功 ∧ 顶层非 null 非数组对象 ∧ `slots` / `slotSessions` 为对象——判据单源 = 既有 `isTrustedBase`）；不通过 ⇒ loud 一行（`readback-failed`）+ 现场改名 `.corrupted`（解封下一写）+ 返回 `false`。
  **非逐字节相等**（并发写者的合法后写会使相等判据假红——明裁）。测试缝 = `_setManifestWriteHookForTest(fn)`（写后 / 读回前注入）。
- **并发合并语义（保持）**：读-合并-写 + 条目级合并 + `deletions` / `setActive` / `release` 四判据零改（§6.2 / §6.23）；**不引入锁**（无锁为既有裁定）。
  残余 = 双写者丢更新窗口（**登记**；缓解链：摘要面丢失 ⇒ 判据句 2/3 自愈 ∥ 认领面丢失 ⇒ 探测面 + `slotOccupancy` 兜底）。

**边界情形**：① 打开 / 懒核实之间的并发删除 ⇒ 残留条目一条（无害：条目集 = 盘面；槽号回收不受阻）·
② 老槽缺键 ⇒ 重建缺席（禁发明）· ③ 摘要**值错**（非缺失）**不在本批判据面**（无盘面证据可判——新鲜度判据只保「不比盘面旧」；值级校验需全读 ⇒ 与预算线相抵）·
④ `.corrupted` 现场在盘 ⇒ 警示持续（现场随 30 天 GC / 手工清除而止）· ⑤ 同刻窗口（他写者改写于本进程读 / 摘要打点之间）⇒ 快路可陈旧一轮（§6.22 既有登记——零新增）·
⑥ 两路并发补齐同档 ⇒ 合并写 last-wins（两次均自同档读得——值同）· ⑦ 核实与槽文件写并发 ⇒ 读到旧档或新档（rename 原子性）——摘要最迟下次核实 / 下次保存自纠 ·
⑧ 核实失败（坏档 / 不可读）⇒ **负缓存**（同 mtime 不重试——防每轮重读同一坏档；文件变更 ⇒ 重新可核）· ⑨ 「从不列表的 cwd」⇒ 摘要不愈合（无消费方 ⇒ 零影响——懒核实射程内**明裁**，不做全量扫）· ⑩ 核实回写撞 §6.23 拒写窗口 ⇒ 本轮成果丢弃、下轮重核（预算内重复读——零新增争用面）；(b)(c) 改名解封 ⇒ 次轮走首建分支、一轮收敛；循环有界（`refused` 已由 `ledgerHealth(cwd)` 可见）。

**落点与测试面（本批承载）**：file 级落点表（行数 / 预期增量）与用例表（L1–L5 组）= **批档 §2**（一次性批次材料——本档不复制；判据 / 边界 / 决策留本节）。

尺度结论（行数口径 = `wc -l`〔`thincoder-core/test/core-hygiene.test.mjs:187` 同式〕；核侧落值 = 核座实读 · as-of 2026-09-28，端侧 = 待落预期）：
`thincoder-core/session-slots-manifest.mjs` 现读 **366 行** · 净增 **+55**（`healDigest` 谓词 + 写回 / 独占临时名选项 / 写后读回 / `ledgerHealth`）⇒ 落 **421 行**——**500 硬线内**；**拆档审视：承既有裁定**（§6.23 + 台账 #484 专门批）——本批不拆。
`thincoder-core/session-slot-scan.mjs` 现读 **299 行** · 净增 **0**（计数缺省值替换 + 注释改写）⇒ 落 299 行（≤300 维持——不新增登记）。
`thincoder-core/session-slots.mjs` 现读 **309 行** · 净增 **+17**（投影 `?? null` 两处 + `resumeSlot` 读序前移 + `healDigest` 调用 + `ledgerHealth` re-export）⇒ 落 **326 行**（>300 承既有形态——登记在册）。
`thincoder-core/session-lifecycle.mjs` 现读 **377 行** · 净增 **+5**（切换落点补写 + 注释）⇒ 落 **382 行**。
新档 `thincoder-core/session-slot-verify.mjs` 落 **299 行**（读面懒核实面：不可信清单调度 / 单飞 / 负缓存 / 预算 / 分块流式扫描；本批唯一新档，≤300 达成）。
端侧随动档：`thincoder-cli/src/tui/cmd-session.mjs`（129 → ≈136）· `thincoder-cli/src/tui/startup.mjs`（297 → ≈300：**≈300 线位**〔未越 300 顾问线〕——该树无机械登记面〔core-hygiene 仅扫 core 树〕，**登记一行**：拆点候选 = 启动屏族 / 后台索引族外提（`backgroundIndex` 已函数化）；触发条件 = 越 500 硬限 ∥ 该档下次实质改动）·
`thincoder-vscode/webview/session-bar.js`（138 → ≈139）· `thincoder-core/agent-tools/read-history.mjs`（落 **408 行**——核座实读；已在 `SOFT_LINE_REGISTRY`〔`thincoder-core/test/core-hygiene.test.mjs:112`〕——无新拆档案）。

**验收回指（需求档 §4.6 F-L1–F-L5）**：F-L1 → 判据句 1（用例组 L1）· F-L2 → 判据句 2（L2）· F-L3 → 判据句 3（L3）· F-L4 → 判据句 4（L4）· F-L5 → 判据句 5（L5）；用例面（L1–L5 组编号与夹具）= 批档 §2.4。

**不做（边界）**：不设用户操作入口（CLI 命令 / 桌面按钮皆不设——用户 06:05 裁）· **不做后台全量扫**（懒核实已全覆盖被列表 cwd——用户 06:08 口径）· **不做端侧推送通道**（行级刷新 = 端侧下次列表自见——随动指针）·
不改槽 JSON 形态 / `version` / VSC 兼容红线 · 不改认领 / `active` / `deletions` / 释放判据 / 槽号分配 · 不改 `loadManifest` 降级读 ·
不引入锁文件 / 不建索引 / 不落新存储 · 不改记录存储（sidecar）面 · 桌面五档（评审 **#32** 冻结窗）零写 · 不碰在途批面（#25 / #26）。

### 6.26 消化生命周期面记录（跨端单源 · 2026-09-30 · #726）

> 问题：消化生命周期两面（auto-turn 消化痕 ∥ 被消化的子 agent 块）原为**渲染期瞬态**（刷新 ∥ 重载 ∥ 重启即失——用户 2026-09-30 报）；各端以**记录条目**承接。需求 = §4.4 **F-S7**；桌面实施批 = `docs/batches/2026-09-30-digest-persistence.md`；跨端承接批 = `docs/batches/2026-09-30-cross-end-digest-recovery.md`。
> **本节点 = 记录形 ∥ 写缝 ∥ 读缝契约 ∥ 端侧重建义务 ∥ 容差登记的跨端单源**——桌面设计档（`docs/desktop/design/RENDERER.md` §1.1「留档记录」条）自本批只留桌面侧呈现细节；CLI ∥ VSC 承接细则各住其设计档（`docs/cli/design/TUI-SESSION-VIEW.md` §6 ∥ `docs/vsc/design/WEBVIEW.md` §5.7）。

- **两族记录形**（人读线条目——`history` 数组元素；追加 ∥ 落盘 ∥ 读取三面同一形）：
  - ① `digest`（三型——与 `ev:digest` 帧三形一一映射，零新语义）：`{ kind: "digest", status: "start" | "cap" | "end", n?, tier?, from?, msg?, mode?, turns?, ok?, ms?, ts }`——`start`：`n` = 起跑待消化数（可 0）· `tier` ∈ `ask` ∥ `digest`；
  `tier === "ask"` 携 `from`（提问者 `role#id`）∥ `msg`（问题摘要）；`cap`：`mode` ∈ `stop` ∥ `auto` · `turns`；`end`：`ok` · `ms`。
  - ② `subagent`（归档快照——一块一条）：`{ kind: "subagent", meta, rows, ts }`——`meta` = 归档时点**块头事实**（对象；消费面按已知字段读：`key` ∥ `role` ∥ `model?` ∥ `startedAt?` ∥ `doneAt?` ∥ `turn?` ∥ `maxTurns?` ∥ `status?` ∥ `pool?` ∥ `queued?` ∥ `note?` ∥ `error?`；未知字段原样携带）；
    `rows` = 内容行集 `Array<{ kind: string, text: string }>`（未知 `kind` 消费面按文本行——**跨端退化在册**：`kind` 为开放词表、各端自有行模型取值（VSC = `.advisor-content` 行派生），读他端写的快照时未命中本端行模型 ⇒ 按文本行呈现（零丢失；在册行为，不钉最小词表））；**有界保尾** = 显示行 ≤ **500**（超界弃最旧 ⇒ 前置省略标记行 `… [rows truncated: N lines omitted]`——N = 实弃显示行数、标记自身不占额度；单行超界保末行）。
    - **字段增补（2026-10-01 · 记录形跨端契约勘定 · 台账 #790）**：`pool?: boolean` = spawn 模式事实（`true` = async 池 spawn ∥ `false` = sync 已启动确证；
      缺省 ∥ `null` = 未知（未启动等）——重建头模式词段在场性判据 = `pool != null`）；`queued?: boolean` = 冻结时**未启动**（排队中；缺省 = 非排队）。
      命名映射：CLI 本地 `async` ⇄ 记录 `pool`（同真值；`async` 不设独立字段——双载体会破单源）。
      **零版本机**：增补可选字段 ∥ 三端读面皆字段式容缺省 ∥ 存量记录无新字段 ⇒ 回退 = 改前显示；零版本标记 ∥ 零迁移 ∥ 零回填。
    - **`key` 规范形 = `sub:<role>#<id>`**（写面归一——CLI 原无前缀形收正（含非族键 `compress#N` ⇒ `sub:compress#N`）；VSC ∥ 桌面已规范、零改）；
      读面必容**旧形**（存量无前缀记录 append-only 不可迁移）：CLI 读面剥 `sub:` 前缀（显示 ∥ 折叠键 = 本地无前缀形）∥ VSC 读面补 `sub:` 再解析。
    - **词面判据三条（`status` 读面归一——跨端单源 · 2026-10-02 · #794 ∥ #795）**：① 停止面 = `stopped` ∥ `cancelled` ∥ `terminated` ⇒ ⏹ + stopped；② 错误面 = `error` ∥ `failed` ⇒ ⏹ + error（+ 文本注记）；③ done 面 = `done` ∥ `settled` ∥ `answered` ∥ 缺省 ∥ 未知 ⇒ ✓ + done。
      **写面词表零动**（三端各写各词——CLI `stopped` ∥ VSC ∥ 桌面 `cancelled`）；读面按本三条容多写词（各端自做）；CLI error 面维持文本载（显示面差在册）。
    - **读面归一义务（字段级——沿上 `key` 读义务先例）**：他端记录读入 ⇒ 归一到本端归档块同形（产物 = 读面新对象——记录 ∥ 存储零写）：`key` 非空且无 `sub:` 前缀 ⇒ 补前缀；`label` ∥ `role` ∥ `id` 由 `key` 派生（头文载体 ∥ `dataset.subid` 门）∥ `frozen` 恒 `true`（记录 = 归档快照）∥ `status` 按上三条词面归一 ∥
      两时间戳互填（缺 `doneAt` ⇒ `startedAt` ∥ 缺 `startedAt` ⇒ `doneAt ?? 0`——冻结耗时算式）；其余字段原样携带。
    - **两形值域（互查面）**：digest `ask` 的 `from`（显示形域 = `role#id`）∥ `subagent.meta.key`（规范形域异形同轴）；读面义务 = **按键互查须前缀归一**（按 `from` 查块 ∥ 按 `key` 匹配提问者——现盘未见此类消费面，预防性在册）。
- **写缝**（单点 = 核 `thincoder-core/context-push.mjs` **`pushRecord(agent, record)`**——经 `context.mjs` 转口可达；`pushReal` 双胞）：
  `ts` 打点 ∥ 记录存储追加（`_recordStore?.append`——§6.14）∥ 尾窗驱逐三面同 `pushReal`；**机器线零触** = `history` 以一次性弃数组承接 ⇒ 记录不入 `agent.history` / `contextHistory`（不喂模型）；追加失败不阻断（尽力面 N-S6 承接）。
  未绑定（`_recordStore` 缺）⇒ 人读线追加照常 ∥ 存储腿空转（零抛——模式 F 零回归）。
- **产生面 = 各端进程内同点追加**（与用户可见帧/行**同点双动作**——`ts` 与帧/行同时序）：桌面 = 宿主发帧点三型（`cap` 帧点 = `thincoder-desktop/src/main/turn-face.mjs:142-143`）∥ 渲染面归档派生点经 `record:append` 通道（subagent 快照——含非活动键）；
  CLI = 痕行 ∥ 冻结行产生点（`pushRecord(state._agent ∥ ctx.agent, …)`）；VSC = 宿主发帧点三型（`thincoder-vscode/src/extension/suspension.mjs:190` ∥ `:214` ∥ `panel-callbacks.mjs:83` `postDigestCap`）∥ webview 归档派生点经 `recordAppend` 出站（宿主处理体落 `pushRecord`）。
  **落盘节律 = 与消息同节律**（不新造即时落盘面）：记录随本端既有保存链落槽投影（本端人读线真值 = CLI ∥ 桌面为记录存储、VSC 为槽 JSON 投影——见端侧面）。
  **入参对象 ∥ 载体对应（端侧钉定——记录须落进本端保存链所写人读线同一数组，否则随落盘丢失）**：`pushRecord(agent, record)` 人读线追加目标 = 入参对象的 `_fullHistory`——
  CLI = `state._agent ∥ ctx.agent` 活对象（绑定态另携 `_recordStore`；`_fullHistory` = 保存链同一数组）；
  VSC = **活行载体对象** `{ _fullHistory: (panel._liveLines ?? panel._susp?.lines).fullHistory, history: [] }`（`fullHistory` = `saveLines` 所写 `history` 槽字段之源——**同引用**；不绑记录存储 ⇒ `_recordStore` 缺省 ∥ `_historyWindow` 缺省 ⇒ 零窗口驱逐，本端全量人读线保持；`history` 弃数组 = 机读线零触）；
  桌面 = **写面薄壳在册**（`session-io.appendRecord` 现行 = 复用 `pushReal` 半提取载体形 `{ _fullHistory, _recordStore, _historyWindow, history: [] }`——消解路径 = 端壳下次触碰改调核 `pushRecord`，行为等价）。
  **失败面**：追加失败不阻断（尽力面——N-S6）；载体缺位（CLI = `state._agent` ∥ `ctx.agent` 双缺；VSC = `_liveLines` ∥ `_susp?.lines` 皆缺——无活跃会话）⇒ 零动作 + 日志一行（零抛）。
- **读缝**（单点 = 核 `history-window.mjs` `historyWindow(history, before, pageSize, opts)`——`opts.records === true` **opt-in**）：`digest` ∥ `subagent` 两型记录**原样入窗**（`{ ...record, idx }`——字段零改名；占条目位、游标按条目推进；不入回合 ∥ 可见性谓词）；**默认关**（缺 `opts` ∥ 非 `true`）⇒ 输出与改前逐字等价（负控——存量读面零破）。
- **读面 delta 登记（记录 = 人读线条目——检索消费面按字段面天然分化）**：记录与消息同住人读线、同用 `idx` 空间；四消费面处置如下（构造面零改；§6.13 护栏 ∥ §6.14 读面契约 ∥ §6.19 索引建模三处既有句之射程以本条界定）：
  - `read_history` 输出行形（本会话 ∥ 回落 ∥ 索引三读径同判）：输出构造 / 字段 / limit 默认值与上限**零改**——匹配集按字段面分化：`role` ∥ `keyword` ∥ `tool` 三面**零命中**（记录无 `role` / `name` / `content`）；**无滤 ∥ 仅 since-until** ⇒ 记录随集，行形 = `{ts, role:null, content:""}`（空壳如实；limit 窗口按条目取端）。
  - 会话索引面行：记录**占行**（`idx` 只数可解析行 ⇒ 连续面保持；「一行 = 一条消息」句之射程 = 消息行）：`role` / `content` 空 ∥ 无声明 ∥ FTS 零词元（零命中）；`path=<文件>` ∥ `path:"all"` 索引面与 JSON 面**逐条等价保持**（记录混入后两路同判）。
  - 两道检索护栏计数：`READ_HISTORY_SCAN_MAX`（物理行——记录不改行形态）∥ `READ_HISTORY_MAX_MESSAGES`（条目数——**含记录**，与 `messageCount` 同口径）；常量 / 文案零改。
  - `cwd:` 发现面行：`messages:` 数 = `messageCount`（**含记录**——同本节点「兼容与边界」条口径；计数不可得 ⇒ `—` 判据零改）。
  - 判据（机检腿落批档 §2）：伪存储混录 ⇒ ① `role` ∥ `keyword` ∥ `tool` 检索与消息-only 基线逐字等价；② 无滤 ∥ since-until ⇒ 记录空壳行在场（形如上）；③ JSON 面 ∥ 索引面逐条相等。
- **端侧重建义务**（各端自做——语义同源、实现各端；总则 = **记录位次复列**：记录按其全局 `idx` 位次重建为该端既有呈现形（**未结轮照现**——无 `end` 记录之轮照出其已有记录；可证面 = 轮间 ∥ 末页）、行入流 = 与内容同生态——无专门「摘 ∥ 留」处理；`digest` ⇒ 痕形 ∥ `subagent` ⇒ 归档块形（与活流归档同一形状）；记录缺 ⇒ 恢复面与改前逐字等价（负控））：
  - **CLI**（`docs/cli/design/TUI-SESSION-VIEW.md` §6）：痕行逐条复列（标签 ∥ 计数 ∥ cap ∥ 终态行——文案与活流同算式；**未结轮照现**——零截点）；终态行 `n` 页内缺席 ⇒ **存储回扫**补齐（跨页零损——容差①于本端不成立——绑定态；模式 F 未绑 ⇒ 不适用）；`subagent` 记录 ⇒ `_frozenSubTask` 合成件（渲染端零改）。
  - **VSC**（`docs/vsc/design/WEBVIEW.md` §5.7）：痕元素逐条复列（**轮锚 = 起跑记录**——起跑 ∥ `n > 0` 计数 ∥ cap 元素随轮出；终态元素需 `n`（同页起跑）；**未结轮照现**（可证面 = 轮间 ∥ 末页）；起跑未载的 `cap` ∥ `end` 记录零产——容差①）；
  归档块重建 = 活形同构（核 `subblocks` 原语直消费）∥ 落点 = **记录位次原位（零配对）**（重建径）——与 live `archiveBlock` 到达序（**当刻流末**）**两径并存**；**不绑记录存储**（记录走槽 JSON 投影——VSC 兼容红线保持：sidecar 对本端可见面零暴露；绑定的窗口 ∥ 保存面重构越本批，超批不取）。
  - **桌面**（`docs/desktop/design/RENDERER.md` §1.1）：逐轮复列（**未结轮照现**——无 `end` 记录 ⇒ 起跑行 ∥ 计数行 ∥ cap 行照出；可证面 = 轮间 ∥ 末页；起跑未载的 `cap` ∥ `end` 记录零产——容差①）∥ **位次门**（`at` 不可得 ⇒ 该轮零产——#773）∥ 留档块。
- **容差登记（跨端）**：
  - ① **跨页分裂**（起跑 ∥ 终态记录分居两页）：桌面 ∥ VSC = **不可证面零产**（起跑未载的 `cap` ∥ `end` 记录不入 ∥ 非末页尾残起跑不入——该轮终态侧字面缺失；数据零损；重开条件 = 实测走查命中 ⇒ 另批跨页承接）；CLI = **消**（逐条复列 + 存储回扫）。
  - ② **归档快照落盘晚一拍**（快照产生面在呈现层——出站异步）：桌面 = 在册（显式容忍）；VSC = 沿用（随**下一次**保存落槽——全端内容同节律）；CLI = **消**（产生面 = 进程内冻结点（先于回合落盘）∥ 读径 = 存储直读——追加即达）。
  - ③ **CLI 复活径双记录**（墓碑复活 ⇒ 同键两代冻结 ⇒ 重建面双块 ∥ 活流单块——低频异常修复径 ∥ 数据零损；重开条件 = 实测走查命中 ⇒ 另批）。
- **兼容与边界**：槽 JSON `version` / 字段形态 / `history` 全量数组零改（**VSC 兼容红线**逐字保持）；`messageCount` 口径含记录（与桌面 KD-55 ⑤ 同口径容忍——「N msgs = 人读线条目数」）；不改机器线（`contextHistory`）语义。
- **落点与行数（本批承载）**：file 级落点表 + 行数读数 + 验收腿 = 批档 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2（一次性批次材料——本档不复制）。

## 7. 关键决策记录（D-SE1–D-SE68）

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
| D-SE18 | 跨会话检索 = **`read_history` 加参数**（非新工具） | 检索族已多（5 工具选错）——单工具扩展 + 消歧总纲；本会话缺省 = **参数面**零行为变化（输出形例外 = `tool_calls` 带参数——§6.13 / §6.19 D-SE47） |
| D-SE19 | 发现面**不做死槽过滤**（v1） | 摘要必须含寻址字段（槽号 + 完整路径）；死槽过滤收益低、易误判 |
| D-SE20 | 记录存储 = **定长分段 JSONL sidecar** | 可按页读 / 无索引文件 / 已写段只读；否决槽 JSON 内窗口化 · 单文件 offset 索引 · 字节触发清单 · 全档 offset |
| D-SE21 | 内存窗口 = **200 条**（与首屏同值） | 上界可控且概念单一；否决 500/1000 · 字节窗 · 无窗（保留窗口 = 安全带 + 快路径） |
| D-SE22 | 投影 = **流式拼接段文件** | O(1) 内存、与既有形态逐字节同构；否决物化数组再序列化 · 投影降级为「窗口 + 计数」（破坏 version 2 契约） |
| D-SE23 | 追加 = **pushReal 同步**；失败 = **降级（失败即停 + 追赶 + 标记）** | 崩溃保留最大化、读路径恒新鲜；否决保存点批量 / 周期刷盘；「下次保存对账自愈」不成立（投影源 = store，两侧同缺无修复路径） |
| D-SE24 | 对账 = **计数比较**（段 vs JSON，不做逐条校验） | 成本低收益足；同长异容退化面如实登记 |
| D-SE25 | 本会话检索走存储；跨会话面 = **索引优先 + 主存回落**（2026-09-22 由 D-SE47 / §6.19 接管该面） | 边界对齐（§6.19）：索引对 sidecar **只读**——零写回、不寄生记录存储语义（追加单点 / 绑定对账 / 降级面仍单点于 §6.14）⇒「外部 slot 的 sidecar 解释权」零扩张；原「`path=` 换轨收益低」判断已由 C / E 两洞消解（D-SE43） |
| D-SE26 | **模式 F（未绑定）零回归** | `thincoder chat` / 测试 / 未覆盖路径保留全量物化行为；窗口仅在绑定态或 depth>0 子代理启用 |
| D-SE27 | VSC 运行中禁止切换 + **turnSlot 纵深防御**（保存 / 标题落回合捕获槽） | 运行中切槽 = 旧 turn 流串台 + 内容落错槽；turnSlot 使并发切换零窗口 |
| D-SE28 | VSC `setSlot*` 写面 = **Parnas 拆分** + `loadSlotForWrite` 对新槽补默认记录 | 一次性写面档（session-slot-write.mjs）避免槽写逻辑混入既有档；新槽无记录 → 静默丢标志（AUTO-bug） |
| D-SE29 | VSC 懒历史分页 = **帧容器 + 嵌套 tools[] + 全局 idx**（HISTORY_PAGE_SIZE 200） | 跨页消息永不重编号；工具卡随帧渲染防跨页双显；匹配 CLI 首屏 200 |
| D-SE30 | VSC 标题触发 = **回合尾、忙态归位之前**；写形 = 标题值随整档 `saveLines` 落盘（单写；链单源 = §6.7） | 标题期 = busy 窗口（webview Stop 显 + 路由守卫入队列（容量 8）——`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）；标题抛错不卡永久 busy；单写免「整档 save + 独立 `renameSlot`」两次落盘 |
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
| D-SE43 | 会话检索 = **加派生索引库**（`node:sqlite` · 单库 `~/.thincoder/session-index.db` · 零权威 · 可重建）；**不迁主存** | 主存 = 用户最贵资产（存量迁移风险 + 崩溃 / 身份 / 并发语义重挣）；索引 = 派生品 ⇒ 丢 / 坏零代价；否决「主存迁库」（收益不抵风险——机器线有界性已由压缩治、实测痛点已消）·「每 cwd 一库」（跨会话检索需跨 cwd）·「库住 sessions 树」（污染真源目录 + 落进 VSC 发现面） |
| D-SE44 | schema = 四表 + FTS（`sessions` / `messages` / `tool_calls` / `messages_fts` + `index_meta`）；**取源双路**（sidecar 增量 ∥ 槽 JSON 一次性） | 实测：含段 sidecar 仅 13 个（451 档无 sidecar——VSC 端不写 sidecar、§6.14 前老档）⇒ 单路取源则跨会话检索近无覆盖；`tool_calls` 独立表 = 参数面与 `tool` 过滤的廉价面；FTS 语言单源外提 `fts-text.mjs`（D2——不让会话索引拉入 memory 模块链） |
| D-SE45 | 增量 = **水位四列 + 三规则**（段号 / 字节偏移 / mtime / 尾哈希；半行不建；等长重写靠尾哈希检出）；幂等 + 单事务；触发三点（懒保证 / 启动窗外延迟拍 / 显式命令）——拍挂端壳 | 段只追加（§6.14 不变式）⇒ 偏移增量成本 = 单段读；`_materialize` / 隔离重建会重写段 ⇒ 需 size / mtime / 尾哈希三重检出（只信 size 会漏等长改写）；拍挂端壳 = 核会话档零改（边界硬线）；否决「pushReal 挂钩」（触主存档）·「每次查询全量重建」（成本） |
| D-SE46 | 重建 = **打开即验 + 自愈改名保留**（缺失建 / 失败改名 `.corrupt-<ts>` + 新建）+ 显式命令 `session index --rebuild` / `--status`（双端对位命令）；**不做迁移** | 派生品 ⇒ 迁移无意义（重建即迁移）；改名保留 = 现场可查（零静默丢弃）；命令面 = 存量首建 / 运维兜底；否决「静默删坏库」（丢现场）·「保留迁移路径」（无权威数据可迁） |
| D-SE47 | 查询面 = **索引优先 + 主存回落**；新增 `path:"all"`（跨会话）；`keyword` 语义分面（单会话 = 子串不变 ∥ `all` = FTS 词 / 短语）；`tool_calls` 带参数 | 回落 = 零回归硬线（非 sessions 树 JSON / 库不可用 / 库内无行 ⇒ 既有路径 + 逐字文案）；子串契约在单会话面成本可承受（单会话 `LIKE`），`all` 面在 300MB 语料上不可行 ⇒ 分面并如实登记；`arguments` 上限 300 = 存储面同值（不虚构超出存储的精度） |
| D-SE48 | ACP `session/close` **入释放面**：关闭会话 ⇒ 释放该会话槽（保留集 = 本进程其余在存会话的活绑定槽 · 同 cwd）；VSC 项目切换 ⇒ 对旧 cwd manifest 补一次同语义释放（保留集 = 空）；落盘判据三条沿用 §6.16 | 认领只增不减在 ACP 多会话面 = 会话关掉仍占槽（他端打不开）；释放不损互覆保护（他端认领 ⇒ 本端再切入判占 + 保存 fork）。否决：ACP 面保持零释放（挂账不清）· 由进程退出面接管（会话级 close ≠ 进程级退出——D-SE41 面不动） |
| D-SE49 | 端壳 `switchToSlot` 被占分支 = **零写 + 可区分信号**（与成功返回 `data` 相区分）；面板路径在前置判据外补**第二判**（TOCTOU 窗内收到信号 ⇒ 保持 `_slot` 现值 + 提示 + `_loadSession()` 重绑） | 现值返回与成功**不可区分** ⇒ 调用面无法判别（面板会误当成功）；第二判兜住「前置判据通过后、函数内仍被占」的窗口；零写语义零改 |
| D-SE50 | 端名 = **进程级单值声明**（`setSessionEnd` / `sessionEnd`——`END` 仅模块级初值；**缺省取值 = 进程端名**）+ marker 家族**逐函数显式端参**（显式 > 进程默认）；核内零端名分支 | 否决「逐调用点传端名」（CLI/ACP 侧 ~10 处调用点，漏一处 = 跨端互写——正是本批要消的病）；否决「端名进 marker 内容」（跨端事实落进本端单写者文件 = NF1 破）；进程默认 = 端壳/启动点一行，跨仓契约面最小（桌面端 1 行接入） |
| D-SE51 | 创建端字段 = `createdBy`，**落槽数据文件**（首次物化写一次、此后透传、老槽禁回填 ⇒ 读数「未知」） | 否决「marker 内嵌」（marker 是每端自己的文件，他端读不到 + 语义错位：marker = 最后使用端）；否决「仅 digest 承载」（派生品：槽文件重建即丢事实）；否决「回填老槽」（猜测——边界明令禁止） |
| D-SE52 | `createdBy` 透传取值 = **守卫解析缓存**（`agent._slotCreatedBy`，盘为真值；无文件 / 轮转后 ⇒ 本端名） | 守卫是磁盘全量解析的唯一落点 ⇒ 顺带解析零额外成本（mtime 缓存保稳态零解析）；否决「`applySession` 置值」（会把旧槽端名粘到 `/new` 新槽）；否决「`saveSession` 现场读盘」（每回合全量解析 ⇒ O(n²) 退化，F2 守卫的原始动因） |
| D-SE53 | 会话级偏好（provider / model / effort）= **槽字段**（`effort` 新增；写出口 `setSlotPrefs` 复用 `writeFlag` 单点；`applySession` 施加） | 需求 §3.1:47 逐字「随会话槽持久化…与 CLI / 扩展端同一份槽」⇒ 键必须落槽（跨端同源）；否决「落 config」（全局态——切一处波及全部会话，需求已判为现状缺口）；否决「端侧自建副本」（跨端互写 / 双份漂移）；off **不折为枚举字面**——type 族模型可用 `{type:"disabled"}` 关思考而枚举无 `none` ⇒ 记号 + `thinkOffShape` 展开（族别判据核内单源） |
| D-SE54 | 清单条目集 = **盘面实读**（manifest 退为摘要缓存） | 用户 2026-09-28 裁定 + 耦合放大实锤（本户 50 档显 2 条——manifest 条目丢 ⇒ 会话隐形）；否决「条目集 = manifest ∪ 盘面」（manifest 仍参与条目集——与裁定相抵）·「盘面 ∪ manifest 补位」（幽灵行：文件不在盘仍显——与「删除 ⇒ 消失」判定句相抵） |
| D-SE55 | 元数据取数 = **摘要零 IO 快路 + 盘面分级读**（小档全读 256 KiB / 大档早键截读 64 KiB / stat 兜底；单次预算 4 MiB） | 全读实测 312 MB / 1,844 ms 同步阻塞（启动路径同步阻塞 ≤50 ms 硬线 = F-SL1）⇒ 不可接受；早键截读命中 `history` 前的键（`title` / `updatedAt` 两代键序皆然）；否决全量 JSON 解析 · 仅 stat（标题全空——列表不可用）· 逐档流式全文计数（同 IO 上界、收益同） |
| D-SE56 | 计数两类字段（`messageCount` / `turnCount`）= **摘要供给、盘面不可得** | 精确计数需 `history` 长度（= 全档扫描）；摘要 = 设计内缓存（需求 F5 明列「摘要复用」为 manifest 职责）；盘面供给仅在小档面（≤256 KiB）；降级登记 = 摘要缺失 ⇒ 计数 `0`（消费面既有 `?? 0` 口径；「0」= 未知 ∨ 真为 0 的二义已登记） |
| D-SE57 | 遗留单档（v1/v2 单会话）**不入列** | 无槽号 ⇒ 三端行键空间不可表达（核条目 `slot: number` · 桌面十进制串键 · 落点按槽号切换）；数据面兜底照旧（§6.10 D-2）；否决伪槽号（自造号与真实槽号空间冲突 + 越批语义） |
| D-SE58 | **可达性扩展**：存在性判据改盘面（切换 / 删除 = 盘面 ∨ 条目；恢复可用 = 盘面单判）——认领 / active / 槽号分配本体零改 | 清单解耦后「只见不开」= 48/50 条死行（用户诉求 = 打开 / 继续）⇒「文件在盘 ⇒ 可见**且可用**」；否决仅改清单（半程）· 顺带改认领 / active（越界）；开槽 / 保存路径自然补写摘要 = 允许（自愈），不新增整档写路径 |
| D-SE59 | manifest 写面 = **不可信基座 ⇒ 拒绝写 + loud**（读失败 / 解析失败 / 形态非法 ⇒ 不调 `writeSessionFile`；解析失败 / 形态非法保底改名 `.corrupted`；stderr 一行 + 返回 `false`——唯一消费点 = `releaseClaimsAll` 透传） | 降级整档写会在「读不可信窗口」永久缩水 manifest（#476 实证：50 → {48,50}）；否决「仅 loud 照写」（数据仍丢）·「合成重读再写」（重试窗小、增第二失败面）·「维持现状」 |
| D-SE60 | **不做自愈**（盘面 ∪ 条目对账回填）——只做护栏 | ① `deletions`（D-SE4）= 删除意图唯一表达，盘面枚举看不见「已删意图」⇒ 残留文件（`unlinkSync` best-effort——`thincoder-core/session-slots.mjs:232`）回填 = 复活已删意图；② 收益已被 §6.22 解耦消解（摘要面自然自愈——D-SE58）；③ `slotSessions` / `active` 无盘面证据——回填即发明（D-6）。存量损伤（本户 50→{48,50}）不修：摘要无源可复原 |
| D-SE61 | 打开态读数 = **核只读出口 `sessionReading`**（组合既有件：线选 / 回声归并 / 渠道合并〔`applySession` 同判〕/ `historyPercent`——零新公式；端壳零算法副本） | 桌面「打开 / 切换既有会话」需以槽数据态出读数（需求 D17 补句——恢复态与 CLI 同见）；否决「端侧现算」（线选 / 渠道合并 = `applySession` 语义 ⇒ 第二口径；剥截断件核内私有、端侧不可达 ⇒ 必漂移） |
| D-SE62 | 摘要面**零权威**（展示与提速）；**不可得 = `null`**（计数 0 与未知可分） | 承 F-R19c / F-R19d 先例（派生面判据）；否决备选「保持 `0` + 附加 unknown 标志」——三端显示面各需改且 `0` 仍是谎话；ACP 协议面例外（数值契约）单列登记 |
| D-SE63 | 重建 / 回填**全自动 · 无用户入口**（落点 = 打开·切槽顺手补写 + **读面懒核实** + 保存面既有） | 用户 2026-09-28 06:05 裁「不需要公开入口让用户去操作」+ 06:08 裁「懒刷新」；否决备选「显式命令（`session repair`）/ 桌面按钮」——需用户认知与操作，与「缓存」定位不符；否决「启动全量扫」——启动面成本与 F-SL1 相抵 |
| D-SE64 | 懒核实预算 = 每轮 ≤ `SCAN_BUDGET_BYTES`（4 MiB）∨ **超预算大档该轮至多一档**；分块 1 MiB 逐块让出；调度 = 纯内存登记 + **启动窗外延迟拍**（`VERIFY_TICK_DELAY_MS` = 3s、`unref`——承 D-SE39） | 大档计数**只能全读获得**（③ 早键截读面不含计数——D-SE56）；否决「小档 only」——大档永不愈合（正是用户症状面）；否决「整档同步全读」——1,844 ms 阻塞（§6.22 实测）；否决「固定时间片」——判据不可机检；**首答 F-SL1 由「调度零 I/O + 分块让出」双保**；否决「`setImmediate` 点火」（D-SE39 实证劣化启动链）；**启动路径纳入 N-L1 机检** |
| D-SE65 | 写安全 = `writeSessionFile` tmp+rename（既有）+ **账本面独占临时名** + **写后结构读回**；合并语义与无锁保持 | 独占临时名消「共用 `${p}.tmp` 混写 / 互覆」；读回取**结构**判据（判据单源 `isTrustedBase`）——否决「逐字节相等」（并发合法后写假红）；否决「全域唯一 tmp」——触槽文件孤儿 `.tmp` 回收面（超本批射程） |
| D-SE66 | 计数不可得显示 = **段缺席**（结构化渲染面）∥ **`—` 占位**（文本行面）——**禁显示数值 0** | 桌面渲染面既有 `Number.isFinite` 门零改即达；文本行面行形稳定性优先（段缺席会改行形）；两者同语义——形态随渲染面既有能力（F-L4 原文允许「—」或缺席） |
| D-SE67 | **不做后台全量扫**（懒核实为唯一批量面）；**行级刷新不做推送**（核侧无推送通道——消费面零改；可见刷新 = 端侧下次列表自见） | 懒核实覆盖面 = 凡被列表 cwd 的每一档，唯一漏面 =「从不列表的 cwd」（该面摘要无消费方 ⇒ 零影响）；全量扫 = 首答外新争用面且与预算线相抵；推送通道 = 改 `listSlots` 签名 / 端侧订阅（破「消费面零改」——留随动指针） |
| D-SE68 | `listSlots` 枚举成本 = **`readdir` 全条目面 + `stat` 计入 O(N)**（边界行收正——§6.22；本户 1781 条目 readdir ≈60 ms 实测）；消解候选 = ① **目录布局收窄**（sessions 根分桶——需跨端迁移面）② **阈值复审**（F-SL1 判定句零改——本批）；触发 = 本户读数持续增长 ∨ 下一触碰该面的批 | 承接台账 #485（#475 实施舱 §5.1 活体观察：冷启 143.7 ms ∕ 暖 77–137 ms 越 F-SL1 50 ms 线）；两候选同列登记——择一由触发时点定形 |

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
- 2026-10-02（**记录形残项批（#794 ∥ #795）· 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-10-02-record-shape-residuals.md` §2 随动表）：§6.26 补**词面判据三条**（`status` 读面归一——停止 ∥ 错误 ∥ done 三面词集 + 写面词表零动）＋**读面归一义务（字段级）**（他端记录 ⇒ 块头字段归一：`label`/`role`/`id` 由 `key` 派生 ∥ `frozen` 恒真 ∥ 两时间戳互填）。**零机制改**（判据单源落位）。

- 2026-10-02（**文档清账轮 · 执行轮 2（core/design 后段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 1 处 R2 改指（`session-control.mjs`——左列裁撤后行元数据族现体，坐标随读）；宽面 2 行折行（970 ∥ 1000——语义零改）。**零新语义**。

- 2026-10-01（**零语义清账批 #2 · 修复轮（评审轮 1 · 发现 3）· eng-designer**——承批档 `docs/batches/2026-10-01-zero-semantic-cleanup-2.md` §3 轮次 1 · 台账 #791）：§6.26 CLI 重建句补**模式 F 限定**（容差①绑定态——未绑 ⇒ 不适用；与 `docs/cli/design/TUI-SESSION-VIEW.md` §6 同拍）。**零新语义**（限定句同拍）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化重放口径批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §1 ∥ §2 · 台账 #771 ∥ #773）：§6.26 端侧重建义务**重放口径统一**——未结轮照现（可证面 = 轮间 ∥ 末页）+ 位次门（`at` 不可得 ⇒ 零产）+ 容差① 收正（不可证面零产）；CLI ∥ VSC ∥ 桌面三行同拍。**零机制改**（口径收正）。明细 = 批档 §2。
- 2026-10-01（**跨端消化面恢复批 · VSC 舱交付随落笔轮 · eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §5 VSC 舱 ∥ §2 随落笔轮）：§6.26 VSC 发帧点坐标对盘收正（`:177/:198` ⇒ **`:190/:214`**——发射行口径 · 现盘实读）；VSC 重建落位句**无效子句删除**（「页内无本轮〔跨页〕⇒ 页段尾追加」——「零配对 + 半轮零元素」约束下无可构造路径；判由 = 本批 §2 随落笔轮块）。**零机制改**（收正 ∥ 删无效子句）。
- 2026-10-01（**跨端消化面恢复批 · 收正轮（评审轮次 3 · 发现 1 ∥ 2 ∥ 7）· eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §3 轮次 3）：§6.26 VSC 重建落位句收正（重建 = 记录位次原位 ∥ 跨页页段尾追加；live = 到达序当刻流末——两径并存）；VSC 宿主发帧点坐标对盘收正（`:167/:178 ⇒ :177/:198`——发射行口径 · 起跑/收尾）；`rows` 补**跨端退化在册**（未命中本端行模型的 `kind` ⇒ 按文本行，零丢失）。**零机制改**（收正 ∥ 登记）。
- 2026-09-30（**跨端消化面恢复批 · 修正轮（评审轮 1 · 发现 1 ∥ 2 ∥ 4 ∥ 9 ∥ 10）· eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §3 轮次 1）：§6.26 补**读面 delta 登记**条（`read_history` 行形 ∥ 索引面行 ∥ 两道护栏计数 ∥ `cwd:` 发现行 + 判据）∥ 产生面补**入参对象 ∥ 载体对应（钉定）与失败面**（VSC 载体 `fullHistory` 同引用；桌面薄壳在册）；VSC 出站字面统一 `recordAppend`（协议登记面同拍）；cap 帧点坐标对盘 `:83`（发射行）；§5 补本批指针行。**零机制改**（登记 / 收正）。

- 2026-09-30（**跨端消化面恢复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2 · 台账 #726）：新增 **§6.26 消化生命周期面记录（跨端单源）**——两族记录形 ∥ 写缝（核 `pushRecord` 单点）∥ 读缝（`historyWindow` opt-in）∥ 端侧重建义务（CLI ∥ VSC ∥ 桌面）∥ 容差登记（3 —— 跨页分裂 ∥ 快照晚一拍 ∥ CLI 复活双记录）；机制单源自桌面档 §1.1 **上提本档**（跨端承接批裁；桌面档通用句指针化）。需求 = §4.4 F-S7（node = VSC F-W1/I-7 ∥ CLI F18）。**邻面语义零改**（§6.14 记录存储 / 兼容红线逐字保持；不绑 VSC 存储——记录走槽 JSON）。

- 2026-09-30（**crossline-clearance 批 · 实施后随动轮 · eng-designer**——承 `docs/batches/2026-09-30-crossline-clearance.md` §2.13）：§6.7 读/展示环收正——CLI 段空值回退链已落（#677 I2）；空窗差「已登记端差」句退场 ⇒ 三端同显回退值。**零新语义**（实施后实况回填）。

> 分段口径：**上段 = 拆档后各批（条目自顶向下倒序累积——找「最后变更」看上段首条）** · **下段 = 建档期逐批累积（升序）**。

- 2026-09-29（**doc-sync-residuals 批 · 设计面残留收正轮 · eng-designer**——承 `docs/batches/2026-09-28-tech-debt-closeout.md` §1.19 收正行 ② · 台账 #451）：§6.21 判据句 4 收正——「VSC 侧自有施加面」句卸载，改**无槽 effort 施加面**
  （实读 2026-09-29；证据 = `agent-state.mjs:89-129` 无映射 ∕ `thincoder-vscode/src/agent/setup.mjs:152-155` 只读槽 provider ∕ model ∕ VSC 全树零 `applySession` import；补接线归设计轮）。**零新语义**（结论卸载）。

- 2026-09-28（**文档回填与卫生轮**（台账 #516 · #377 / #373 面）· eng-designer）：§6.7 空窗差 ③ 行「2026-09-25 本批」改指名（**misc-four 批**）；§6.12 补**引文映射**条（代码注释「§6.12①」⇒ §6.14「生命周期联动」——子标相容登记）。**零新语义**。

- 2026-09-28（**LEDGER-RELIABILITY 批 · L3-8 修后设计收正 · 父侧直接执行〔可 revert〕**——承核座 L3-8 修正轮 #46）：§6.22 打点时机句**「恒新于当次 mtime」判定不成立**（墙钟−文件时间戳盖章偏差实测 `mtimeMs − Date.now()` ∈ [−7.4, **+8.5**] ms · 198/300 为正 · 两次复现 `615088 !== 307694`）
  ⇒ 收正为 **mtime 地板**：「核实面回写 `ts = max(墙钟, 该档 mtime)`」（`thincoder-core/session-slot-verify.mjs:99`）；
  §6.25 判据句 3 ① 回写句同拍；三处裸墙钟（`session-slots-manifest.mjs` `slotDigest` / `session.mjs` `digestFromStore`）= 同族残余在册（有界自纠）；L3-8 补 `ts ≥ mtime` 回归锁（测试档面 · 同笔）。**零新语义**（实施修正直导）。

- 2026-09-28（**LEDGER-RELIABILITY 批 · 核座交付后设计收正轮 · eng-designer**——承 `docs/batches/2026-09-28-ledger-reliability.md` §5.4 上抛 1–2 + 父侧裁定）：
  §6.25 判据句 3 预算括注**按实现读法钉定**（超预算大档 = 单档 > `SCAN_BUDGET_BYTES`——整预算 4 MiB ⇒ 该轮至多一档）；
  §6.25 尺度结论**对盘刷新**（核侧落值 = 核座实读 · as-of 2026-09-28）：`thincoder-core/session-slots-manifest.mjs` **421** · `thincoder-core/session-slots.mjs` **326** · `thincoder-core/session-lifecycle.mjs` **382** ·
  `thincoder-core/session-slot-scan.mjs` **299** · 新档 `thincoder-core/session-slot-verify.mjs` **299** · `thincoder-core/agent-tools/read-history.mjs` **408**；
  §1 现行模块清单补 `session-slot-verify.mjs` + 全档「拟新增」标记撤除（scan / verify 两档均已落地）。**零新语义**（上抛 1–2 直导）。

- 2026-09-28（**LEDGER-RELIABILITY 批 · 设计评审轮 1 修正 · eng-designer**——承 `docs/batches/2026-09-28-ledger-reliability.md` §3 轮次 1 发现 1–10）：
  §6.25 判据句 2 括注收正（重建函数两产者：未绑定 `slotDigest` / 绑定 `digestFromStore`——同形）+ L2 等值取源注明；判据句 3 落点 B 调度改**启动窗外延迟拍**（`VERIFY_TICK_DELAY_MS` = 3s、`unref`——承 D-SE39）+ 补**核实面缝**（目录切换弃轮 / 退出弃果）+ 分块常量更名 `VERIFY_CHUNK_BYTES`；
  判据句 4 补 **VSC 接线**（`sessions` 载荷增字段 `ledger` + 会话下拉警示注记）与 CLI 启动行在场条件脱离 `allSlots.length > 1`；边界情形补 ⑩（拒写窗口弃果 / 改名解封收敛）；
  尺度结论**对盘刷新**（口径 = `wc -l`）+ startup.mjs 拆点候选 / 触发条件；D-SE64 调度句随动 · **D-SE67 归位表尾**；`docs/vsc/design/` 两档同轮登记。**零新语义**（发现 1–10 直导）。

- 2026-09-28（**LEDGER-RELIABILITY 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-ledger-reliability.md` §1 · 需求档 §4.6（F-L1–F-L5）· 用户 06:05 / 06:08 两条口径裁定）：新增 **§6.25 会话账本摘要可靠化**（零权威 / 可重建全自动 / **丢失自愈 = 读面懒核实**：
  不可信清单 → 单档流式核实 → 回写 → 回快路不重复；预算 4 MiB ∨ 该轮一档；零同步阻塞 / 失效可见〔计数不可得 = `null` + `—` 与段缺席 + `ledgerHealth()` 警示〕/ 写安全〔独占临时名 + 写后结构读回〕/ 边界情形 / 验收回指）；
  §6.22 不做行收正（列表**调用本体**零写——懒核实面指 §6.25）· §6.23 判据句 5 射程限定（权位面 ∥ 摘要面）；§7 补 **D-SE62–D-SE67**（标题随 **D-SE1–D-SE67**）；§5 加本批落点指针。**邻面语义零改**（认领 / `active` / `deletions` / 释放 / 槽 JSON 形态）。

- 2026-09-28（**桌面残余批 · 设计评审轮 1 修正**——逐号点修 · 发现 5）：§6.24 尺度结论**对盘收正**——`thincoder-desktop/src/main/session-slots.mjs` 净增量口径收为 **≈ +41**（该档本批总增量：`pageHistory` 出 `seed` + `openingSeed` 投影；判据句 3 两段为其一部分）。明细 = `docs/batches/2026-09-28-desktop-residuals.md` §3。

- 2026-09-28（**MANIFEST-WRITE-GUARD 批 · 设计评审轮 1 修正 · eng-designer**——承 `docs/batches/2026-09-28-manifest-write-guard.md` §3 轮次 1 发现 1–7）：§6.3 槽文件字段集补 `effort` / `createdBy`（§6.21 / §6.20 指针）；
  §6.4 `slotDigest` 列表补 `updatedAt` / `ts` / `activeModel` / `createdBy` + 字段单源指针；§6.22 判据句 2 ① 比较字段收正为**摘要 `ts`**（`updatedAt` 恒早于 mtime ⇒ 按它比快路永不命中）+ 新增**快路比较口径条**（打点时机 / 同值 = 新鲜 / 退级形态；含父侧实施实证回灌）；§1 补**口径 · as-of · 现行模块清单指针**；
  §6.22 尺度结论补 `thincoder-core/session-lifecycle.mjs` 档标注 · §6.24 尺度结论补 `thincoder-core/session.mjs` 与桌面端壳两档标注 + 两处拆档审视记录；§6.2 / §6.8 / §6.19 三处删修订式表达；§6.11 值域 / 来源收正（端名闭集 + `sessionEnd()`）+ §6.1 目录示意改端名形；本记录加分段口径。**零新语义**（均为评审发现直接导出项）。

- 2026-09-28（**桌面残余批（D17 恢复态播种 / D19 用户块 md 深度）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-residuals.md` §1 · 需求 §4 D17 / D19 补句）：新增 **§6.24 打开态读数（会话恢复的上下文读数单源）**（只读出口 `sessionReading` / 与 applySession 后读数同源同式三事 / 端壳转口零算法副本 / 边界情形 / 验收回指）；
  §5 加本批落点指针；§7 补 **D-SE61**（标题随 **D-SE1–D-SE61**）。**核机制语义零改**（新增只读出口一处；`applySession` / `saveSession` / 槽字段均零动；与 §6.22 / §6.23 判据零交叠）。

- 2026-09-28（**MANIFEST-WRITE-GUARD 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-manifest-write-guard.md` §1 · 台账 #476）：新增 **§6.23 manifest 降级写护栏**（写前分类 / 拒写与现场保全 / loud 信号 / 自愈明裁 / 与 §6.22 零交叠 / 边界情形 / 验收回指）；
  §6.2 `.corrupted` 兜底行与 `saveManifest` 条目级合并条两处收正（可信基座前置 + 护栏指针）；§7 补 **D-SE59 / D-SE60**（标题随 **D-SE1–D-SE60**）；§5 落点指针。**邻面语义零改**（认领 / active / `deletions` / `release`）。

- 2026-09-28（**SESSION-LIST-DISK 批 · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-28-session-list-disk.md` §3 轮次 1 发现 1–3 / 5 / 8）：§6.10 D-2 ①/② 去 `∈ m.slots` 合取、钉定**盘面单判**（与 §6.22 判据句 4 同口径）+ 新增 D-2 存在性判据行；
  §6.22 补**落点与测试面 / 尺度结论 / 验收回指**三件（形体对齐 §6.16）· 判据句 2 摘要快路字段名 `ts` ⇒ `updatedAt` · 判据句 5 补**可观察面登记**（ACP `session/list` / `read_history` `cwd:` 条目集扩大——需求 §2.2 F12 口径）。**零新语义**（发现 1–3 / 5 / 8 直导）。

- 2026-09-28（**SESSION-LIST-DISK 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-session-list-disk.md` §1 · 需求档 §4.1 F5 · 台账 #475）：新增 **§6.22 会话清单盘面实读**（条目来源判据 / 元数据取数链与读放大上界 / 降级阶梯 / 可达性扩展 / 消费面零改 / 边界情形 / 不做面）；
  §6.1 存储模型两条收正（`manifest` 改述为**摘要缓存**——条目集以盘面为准）· §6.2 `.corrupted` 兜底行的「列表变空」句收正（列表本体已与 manifest 解耦，降级面缩至表头）· §6.5 `/session` 句收正（**全部槽位** = 盘面实读；列表链零写）· §6.10 D-5 收正（`isActive` 语义零改；条目集随 §6.22）；
  §7 补 **D-SE54–D-SE58**（条目集 / 取数链 / 计数字段 / 遗留单档 / 可达性扩展），标题随 **D-SE1–D-SE58**；§5 加本批落点指针。

- 2026-09-25（**SLOT-END-PARAM 批 · 设计评审修正轮 2 · eng-designer**——承 `docs/batches/2026-09-25-slot-end-param.md` §3 轮次 2 发现 11 / 12）：端差登记行**归属口径收正**——原登记批 / 台账 #185 复核批 / 本轮复核批三角色分述（§6.15 `:280` / `:321` / `:322`）；§6.20 端差注销指针词改「§6.15 端壳款①（端差注销 · 零副本转口）」（与 §6.15 `:281` 状态词一致）。**零语义变更（发现 11 / 12 直导）**。

- 2026-09-25（**SLOT-END-PARAM 批 · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-25-slot-end-param.md` §3 轮次 1 发现 1–9）：§6.15 端壳面收正——**A9 原保留款「end marker 层」改端差注销**（端壳副本归核 ⇒ 零副本转口；四维护落点经端壳绑定核同名件、调用点零改；裸 v1 单文件兜底差异随副本注销）；端差保留余一款（token 台账三式）；
  §6.18 端壳镜像理由行随动；§6.20 判据句 1 **缺省语义钉定**（缺省取值 = 进程端名 `sessionEnd()`，`END` 仅初值）· 判据句 2 写点枚举按 §6.10 D-4 维护点集对齐（`newSession` 零改 + 未列写点走进程端名）· 验收回指 ② 同词收正 · 端差注销登记指针收正；§7 `D-SE50` 同词收正。**零新语义（发现 1–9 直导）**。

- 2026-09-25（**SLOT-END-PARAM 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-slot-end-param.md` §2 · 台账 #371 / #372）：新增 **§6.20 端名参数化与创建端字段**（判据句 5 / 取值链四分支 / 边界情形 6 / 端差注销 1 / 验收回指）；
  §6.10 D-1 路径形态与端常量行收正（端名闭集 + 判据单源指针）、D-4 「VSC 镜像」改「VSC 落点（经端壳绑定核同名件）」；§7 补 **D-SE50 / D-SE51 / D-SE52**，标题随 **D-SE1–D-SE52**；§5 加本批落点指针。**零新机制（marker 三态 / 继承 / 端分离语义逐条不变）**。

- 2026-09-25（**misc-four 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-misc-four.md` §2 · 台账 #185）：端差登记项三处二态落定——§6.7 空窗差行 ③ 裁定来源回填（2026-09-21 父侧代裁 · D8；两处同源行同批收正）；§6.15「端壳保留两款」补状态词 + A9 三件；§6.15 记录面写条件行补状态词 + A9 三件（① = 两侧机制本体；③ = 2026-09-21 SESSION-CLAIM 批）。**零新机制**。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2）：§6.7「源」条 VSC 侧措辞收正——端壳传原数组 + 同一核谓词取首条（`thincoder-vscode/src/extension/panel-session-write.mjs:134`）+ 等价注（端壳不按 `keepReal` 预过滤——该过滤属槽落盘面）。**语义零改**。


- 2026-09-22（**pending-triage 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-22-pending-triage.md` §1 裁定 · 台账 #168 / #171）：§6.15 新增 2026-09-22 条（受占返回值可区分 / ACP close 释放 / 跨 cwd 释放 / 端壳释放面机判）；§6.16 活绑定集口径与 ACP 调用面表收正（close 入释放面）；**机制条文零改**（均为既有释放语义的落点补全）。

- 2026-09-22（**pending-triage 批 · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-22-pending-triage.md` §3 轮次 1 发现 1 / 4 / 10）：
  认领释放语境四处旧句收正为现态——§6.2 `:109`（ACP 释放面 = `session/close` 释放 + 其余调用面零释放）· §6.16 `:398` 与 §6.18 `:526`（删「跨 cwd 释放 / ACP `session/close`」两项旧边界——已入释放面）· §6.18 `:511`（ACP 进程退出行改「`session/close` 释放 = 会话级」）；
  §7 补 **D-SE48**（释放覆盖面）/ **D-SE49**（受占可区分信号），标题随 **D-SE1–D-SE49**；
  §6.15 / §6.16 两处受占载荷分述（前置判据路 = `_slot = null` + 缓存重绑 ∥ 第二判路 = 保持现值 + `_loadSession()`）。**机制条文零改**。

**〔下段 · 建档期逐批累积（升序）〕**

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
  （P1–P5 判据句 + 五场景表 + 否决备选）+ §7 补 **D-SE31**；§6.15 引行收正（`session-slots.mjs` `:41→52` · `:49→60/69/82` · `thincoder-vscode/src/extension/session-io.mjs:55→89/124/166/188` · 绑定入口
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
- 2026-09-21（**EXIT-CLAIM-RELEASE 批 · eng-designer**——承 `docs/batches/2026-09-21-exit-claim-release.md` §1）：新增 **§6.18**（判据句 / 核薄函数 / CLI·VSC 接线序 / 端壳裁定 / 边界情形 / 验收回指 T1–T6）；§7 补 **D-SE41 / D-SE42**；§5 补落点指针；来源 = 需求档 §2.5（台账 #211；用户 22:28 批准）。批档 §2 已落地（纠偏复开后父侧直写）。
- 2026-09-21（**EXIT-CLAIM-RELEASE 批 · 收口前坐标收正** · 父侧直接执行 · 机械形修 · 零语义 · 可 revert）：§6.18 四处引 `file:line` 按实施后实读收正（:484 `key-handler.mjs:152-158` · `thincoder-cli/src/tui/index.mjs:444-450`；:491 `extension.mjs:176-190`；:478 `thincoder-vscode/src/extension/session-io.mjs:210`）——
  漂移源 = 本批落地所致；核验 = 父侧 2026-09-21 23:5x 键档+源码双读。
- 2026-09-22（**busy-extend 批 · 同族扩面轮 · eng-designer**——承 `docs/batches/2026-09-22-busy-extend.md` §1 裁定 · 父侧并入本批）：§6.15 标题触发条 + §7 D-SE30 两处收正——标题窗口（`_turnState` 仍 running）= **busy 单槽受理面**（路由守卫 running ⇒ 入槽；新回合恒在标题调用之后开；判定 / 载体 / 送达 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）。机制条文零改。
- 2026-09-22（**SESSION-INDEX 批 · eng-designer**——承 `docs/batches/2026-09-22-session-index.md` §1 · 用户 09:25「可以，都按建议」）：新增 **§6.19**（问题形态实测 / 形态 / schema 四表 + FTS / 取源与水位三规则 / 重建面与自愈 / 查询面路由表 / 边界情形表 / 验收回指 / 不做）；
  §6.13 参数扩展与检索护栏两条收正（新增 `path:"all"`；护栏射程 = 回落路径面）；§6.14 read_history 契约条收正（索引命中 ⇒ SQL 检索，未命中 ⇒ 回落 JSON + 既有护栏）；§5 补本批落点指针；§7 补 **D-SE43–D-SE47**；来源 = 台账 #205（需求档 §4.3 F-R19a / §4.4 F-S4）；新档引用携「拟新增」标记（实施轮创建，收口撤标记）。

- 2026-09-22（**SESSION-INDEX 批 · 设计评审轮 1 修正** · eng-designer——承 `docs/batches/2026-09-22-session-index.md` §3 轮次 1 发现 2–15）：
  §6.19 懒保证射程钉定（有段档 ensure / `src=json` 档免 ensure）· `pass_at` 语义 = 最近变更时刻（`index_meta` + `--status` 文案）· `all` 覆盖语义入边界表 + 模型侧覆盖信号 ·
  `tail_hash` 检测窗残余登记 · 退化 `LIKE` 元字符转义与成本口径 · FTS 同删义务逐路径列明 · 删冗余 `INDEX(sid, idx)` · FTS5 可行性实证（memory 面先例）；
  §6.13 缺省句射程限定（+ 输出形例外）· §6.9 返回行补 `tool_calls` 形 · §7 D-SE25 标取代 + 射程对齐 · §6.19 头部 / 验收回指补 F-R19c / F-R19d。**零新语义**（均为评审发现直接导出项）。

- 2026-09-22（**SESSION-INDEX 批 · 实施后收口轮** · eng-designer——承 `docs/batches/2026-09-22-session-index.md` §5）：源档损坏 ⇒ **查询期不清行**（清行 = 重建 / 趟面职责——查询路径零写纪律）；§6.19 补拆分产物两档行 · FTS5 指针按实读重指 · 撤新档「拟新增」标记 · 边界表登记两处 delta · `all` 首建路径按触发点①收正。**零新语义**（登记类）。

- 2026-09-24（**queue-visible 批 · 设计评审修正轮 1 · eng-designer**——承 `docs/batches/2026-09-24-busy-queue-visible.md` §3 轮次 1 发现 #1 同族扫描）：§6.15 标题触发条 + §7 D-SE30 两处收正——标题窗口 = **busy 队列受理面（容量 8）**（唯一拒面 = 满队（第 9 条）；判定 / 载体 / 送达 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6）。机制条文零改。

- 2026-09-27（**桌面批 B 对齐批 · eng-designer**——承 `docs/batches/2026-09-27-desktop-chat-panel-b.md` §1.2 A「授权核面小改 · 纯加法」）：新增 **§6.21**（槽字段 `effort` / 写出口 `setSlotPrefs` / 档位归一 `resolveEffortPatch` / `applySession` 施加面 / 保存携带 / 边界情形表 / 验收回指 / 不做）；
  §6.4 两处列表补 `effort`（保存字段表 · 恢复逐字段）；§5 补本批落点表指针；§7 补 **D-SE53**（标题计数随动）。端侧契约 = `docs/desktop/design/IPC.md` §2「会话级偏好注」。
- 2026-09-28（**命名口径收正 · 父侧直接执行〔可 revert〕**——用户 2026-09-28 05:52 裁定）：档头增「**命名口径**」行——会话侧 `{hash}.json.manifest` 定称「**会话账本**」（与项目状态档 `PROJECT-MANIFEST.json` 两概念两文件两目录，无任何关系）；正文历史用词「manifest」均指会话账本。零语义。
- 2026-09-27（**桌面批 B 收口轮**（实施后随动收正 · 数值对盘）· eng-designer——承 `docs/batches/2026-09-27-desktop-chat-panel-b.md` §1.20 + §5 实施读数）：§6.21 两处收正——`:343-344` 写面坐标按实读重指（`newSlotData :38 ⇒ :46` · 四开关 `:126/:131/:136/:141 ⇒ :140/:145/:150/:155`；补 `resolveEffortPatch :197` / `setSlotPrefs :213` 两入口）；
  判据句 4 施加面口径收正（`thincoder-desktop/src/main/session-io.mjs:25` = 桌面端同径；**VSC 侧自有施加面** = `thincoder-vscode/src/agent/agent-state.mjs:90` `applySlotSessionState`——非本支同径）。**零新语义**（坐标与口径对盘）。

- 2026-09-30（**跨线清零轮 · 设计档收正 · eng-designer**——承 `docs/batches/2026-09-30-crossline-clearance.md` §2 · 台账 #677）：§6.22 判据句 2 脚注收正——核侧地板已落（`session-slot-verify.mjs:99`）；「同族残余（在册另轮）」句改指端侧 `slotDigest`（`thincoder-vscode/src/extension/session-io.mjs:150`）= 消（补做地板——#677 实施清单）。**零机制改**。

- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 · 台账 #841）：§6.8 收正——D-S1 追加统一解析（`resolveProviderPlan` ∥ `providerState` 三值）；D-S2 重写（`invalid` ⇒ picker ∥ `fallback` ⇒ 提示行不打断 + headless 明示）；D-S3 槽面（持 key 门 + 模型面序）；关键决策行「静默回退」收口（回退可行——必带明示）；机制指针 → `doc:PROVIDER.md:§6.22`。**产品码零触（设计轮）**。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 修正轮 #9（评审轮 1 · 发现 1 ∥ 4 ∥ 5 ∥ 6 ∥ 9 ∥ 10）· eng-designer**——承批档 §3 轮次 1 · 台账 #841）：§6.8 就地收正——D-S1 正文改写（运行时 provider = 统一解析入选渠道；不可运行 ⇒ 置空 `{}`；修订式括注去净——收正史归本记录）；
  D-S2 invalid 档改 **invalid 类合成式**（`state === "invalid"` ∨ `providerInvalidReason` 非空）∥ fallback 档补 `model` 缺省词形（仅渠道名）；D-S4 触发收正为 invalid 类（无 provider/key）并明写 fallback ⇒ stderr 一行 + 继续运行（不退出）；D-S3 补「跳过不写槽——原槽值保留」；关键决策行去修订标记。
  §6.24 判据句 2 渠道合并式补 key 门 + 模型面序 ∥ 边界情形 ② 补「槽渠道无 key」径。**零新语义**（均为评审发现直接导出项——机制单源 = `doc:PROVIDER.md:§6.22`）。

- 2026-10-03（**会话选定写回批（default-model-carryover）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-default-model-carryover.md` §2 · 台账 #880）：§6.21 增**判据句 6**（用户显式选定 ⇒ `defaultModel` 同拍写回——「槽面实变」判据 ∥ 等值零写 ∥ 回退/回声不写 ∥ 写后探）+ 验收回指 ⑤ + 不做句收正（config 零写例外）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**会话选定写回批（default-model-carryover）· 修正轮（评审轮次 1 · 发现 1–7 ∥ 9 逐号 · 父侧裁定 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-03-default-model-carryover.md` §3 轮次 1 · 台账 #880）：判据句 6 实变比对单元钉定（复合串 `provider:model` 是否变化——同渠道换模型亦触发）∥ 边界表补选定写回三行 ∥ 验收回指 ⑤ 扩端到端 + 取数链点名（新槽创建 = 核 `newSession` ∥ 装配取数 = `loadConfig` 归一链 `resolveProviderPlan`）∥ §5 补本批落点指针行。**产品码 ∥ 需求卷零触**。明细 = 批档 §2 修复轮块。
- 2026-10-03（**会话选定写回批（default-model-carryover）· 复评残余修复轮（评审轮次 2 · 发现 2 · 父侧裁定 = 归 eng-designer）· eng-designer**——承批档 `docs/batches/2026-10-03-default-model-carryover.md` §3 轮次 2 · 台账 #880）：§6.3 字段集行 ∥ §6.8 模型行两处「恒非空」补范围限定（**限定 = 保存面成对写入**〔有 provider 即携带具体复合值〕；**全新空槽规范结构无此两键**——与 §6.21 验收回指 ⑤ 取数链前提消歧）；§6.3 字段集行按行宽 300 折行。**零新语义**（限定词）。明细 = 批档 §2 复评残余修复块。
