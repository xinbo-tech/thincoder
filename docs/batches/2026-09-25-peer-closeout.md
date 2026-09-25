# 2026-09-25 · peer-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 3/7：peer 收口轮（条目 #291/#302/#296/#290）。
> 台账 = #291 / #302 / #296 / #290（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准）：

| # | 条目 | 要点 | 面 |
|---|---|---|---|
| #291 | peer 软提示串双源漂移 | VSC `[peer conflict notice]` vs 核/设计档 §4.3 `[peer-collab]`——先裁「哪面为规范」再对齐 | 核 + VSC |
| #302 | `groupSlotSessions` 单源化 | 核 `peer-instances.mjs:84` 未导出 ⇒ 端侧 14 行逐字镜像——核侧导出 + 端侧去镜像 | 核 + VSC |
| #296 | 端 peer 原子写兜底 | 二次 rename 失败 ⇒ 旧记录已删、无末级兜底——对齐核原语或补兜底 | VSC |
| #290 | L3 足迹面测试背填 | `peerCollabNote` / `recordPeerWrites` / `flushPeerDomains` 全仓测试零命中——背填为项目资产 | 核 |

**边界**：多实例协作面；#291 的「规范面」裁定结论须落设计档判据（不得静默对齐任一侧）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计轮（含 #291 规范面裁定）+ 评审轮 1 修正 7/7 已落盘（台账 #291/#302/#296/#290 · 2026-09-25））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 面 | 本条处置（交付形态） |
|---|---|---|---|
| #291 | peer 软提示串双源漂移 | 核 + VSC | **裁定落档前置**：设计档 §4.3 字面 = 规范面单源（核实现 + 核用例已逐字锁 ⇒ 端为唯一漂移点）；端侧按本字面**逐 target** 出行（聚合单行形态退场）——落 §4.3「字面规范面」+ 三项判据 · §4.4.4 合成条改写 · §8 D-MI22 |
| #302 | `groupSlotSessions` 单源化 | 核 + VSC | 核 `thincoder-core/peer-instances.mjs:84` **具名导出**；端档删逐字镜像改引核——落 §3.1「聚合半段单源」条（结构 + 对拍两判据）· §8 D-MI24 |
| #296 | 端 peer 原子写兜底 | VSC | 端侧删本地 `writeRecordAtomic`，改引核 `writeSessionFile`（端壳单源转口）——末级兜底支随核原语到位；落 §4.4.1 · §8 D-MI23 |
| #290 | L3 足迹面测试背填 | 核 + VSC | 两新测试档（核 `test/peer-domains.test.mjs` · 端 `test/peer-domains.test.mjs`）+ 用例号族与覆盖清单；落 §4.3「判据（测试层 · 足迹面）」条 |

**本批不做**：需求档笔面（零改——见 2.6 合规检查）· `thincoder-core/peer-domains.mjs`（299 行贴 300 软线）与 `thincoder-core/agent/dispatch.mjs`（497 行贴 500 硬限）**零触** · 认领面功能语义（`claimNoteText` / 租约 / 节流 / 分存）零改 · 行间分隔符端差（登记项）不动。

### 2.2 设计档落点（本批笔迹 · 实读回核）

`docs/core/design/MULTI-INSTANCE-COLLAB.md`（本批前 386 行 → 本修正轮落盘后 405 行——口径 = 2.8）：

| 落点 | 内容 |
|---|---|
| §3.1 `:100-102` | **新增**「聚合半段单源」条（#302——核导出 + 端引核 + 壳形零变边界 + 两判据） |
| §3.1 `:51` / `:54` / `:56` / `:96` · §3.3 `:123` · §7 `:287` · §4.4.6 `:247` | 陈旧坐标实读重锚（见 2.7-④——一致性面修正，语义零改） |
| §4.3 `:164` / `:165-168` / `:169` | 分隔符条坐标改函数名锚 · **新增**「字面规范面」条（#291 裁定 + 三判据；判据① 扫描口径单源 = 修正轮）· **新增**「判据（测试层 · 足迹面）」条（#290） |
| §4.4.1 `:199` | 落盘原语改「**单一实现**」——核 `writeSessionFile` + 端侧引核 + 末级兜底支明写（#296） |
| §4.4.4 `:230-231` | 优先级条随裁定收正（仅足迹命中 ⇒ 出足迹行）· 端侧混合命中合成改写为「与核同形（逐 target）」（#291） |
| §8 `:319-321` | **新增 D-MI22 / D-MI23 / D-MI24**（含被否备选；D-MI24 射程句 = 修正轮补 N-MI2 读法） |
| 变更记录 `:399-401` / `:402-403` | 本批两行（设计轮 + 修正轮 · 记录面） |

### 2.3 机制设计

**#291 · 足迹软提示字面裁定与端侧对齐**

裁定（哪面为规范）三条依据：① 本档 = 设计面唯一权威（D2），§4.3 该字面自 CLI 期即载为**逐字契约**且明写「双端一致」；② 核实现 `thincoder-core/peer-domains.mjs:245` 与核用例 `thincoder-core/test/peer-claims.test.mjs:232` 已逐字锁该字面 ⇒ **端面是唯一漂移点**；③ 多实现面纪律（clause 6）默认消差——端侧聚合单行形态**无结构性不对称证据**（两端钩点同为「(tool, args) → 多目标列表」：核 `peer-domains.mjs:79` `peerWriteTargets` 多目标；端 `src/agent/execute-tools.mjs:188` `l3TouchedPaths` 多目标）。被否备选照录 D-MI22。

端侧对齐形态：`thincoder-vscode/src/extension/peer-domains.mjs` 的 `peerConflictNote`（`:211-221`——现为聚合单行 `[peer conflict notice] …`）改为**逐 target 出行**，行字面 = §4.3 逐字（`[peer-collab] ${target} — another live instance (${who}) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`）；`who` = 该 target 命中属主集，规则同 §4.3（`${end} pid=${pid}` / 无 end 则 `pid=${pid}`，", " 连接）。

合成面（§4.4.4）：`peerNotes` 足迹分支「聚合一行」→「逐 target 行」——认领命中目标照旧各出认领行（逐字锚不动）；仅足迹命中目标各出足迹行；已被认领覆盖的 target 不出足迹行（零双报）。**接口零变**：`peerNotes(agent, {claimHits, footHits})` 签名与 `{text, keys}` 返回形不动 ⇒ 调用面 `src/agent/execute-tools.mjs:256-260` 零改；数据流零新面（同一聚合扫描）。行间分隔符端差（端块内 `\n\n`）属登记项、**不入逐字锚**（§4.3 既有条零改）。

**#302 · 分组半段单源**

核 `thincoder-core/peer-instances.mjs:84` `groupSlotSessions` 加 `export`（纯函数 `(manifest) → [{sessionId, pid, slots}]`——无状态、零 IO）。端 `thincoder-vscode/src/extension/peer-instances.mjs:78-93` 本地镜像删除，改具名 import 自 `@thincoder/core/peer-instances.mjs`（该档已有 `PEER_PROBE_TTL_MS` 同源 import 面——零新依赖形态）；档头注「镜像 16 行（核 `:84-99` ⇄ 本档 `:78-93`）」句随删。**壳形零变**：端 SWR 壳（快照读 / TTL 新鲜度 / 异步对偶 / 预热）与 `computePeers` 接线不动——共享的是分组半段（纯函数），不触「端侧缓存端差」条；边界 = **共享半段 ≠ 委托整面**（端 `peerInstances` 仍自持，D-MI21 不变）。

**#296 · 端原子写引核**

端 `thincoder-vscode/src/extension/peer-claims.mjs:89-94` `writeRecordAtomic` 删除；两调用点（同档 `:178` `flushClaims` · `thincoder-vscode/src/extension/peer-domains.mjs:83` `flushDomains`）改调 `writeSessionFile`（自 `./session-slots.mjs`——端壳对核 `@thincoder/core/session-slots.mjs` 的单源转口 `:42-46` 已 re-export，零新依赖）。核原语三支形态实读（`thincoder-core/session-slots.mjs:128-143`）：首 `renameSync` → 失败则 `unlinkSync(p)`（**有守卫**）+ 二次 rename → 再失败则 **末级 `writeFileSync(p, readFileSync(tmp))`**（非原子，最后手段）。端侧原实现缺第三支，且首支 `unlinkSync` 无守卫 ⇒ 二次 rename 失败时旧记录已删、内容只存 `.tmp`（NF2 静默丢一次登记）。**诚实边界**：末级兜底支不可确定性触发（两次 rename 失败需外部占用 / 权限态；纯 Node 无 fs 注入缝）⇒ 行为判据取可达面（AC-296-2），兜底支以**单源化形态**承载（端引核 ⇒ 同一实现），不另设测试。

**#290 · 足迹面测试背填（范围与用例设计）**

现状实读：足迹面（D-L3a / D-L3b）无专面用例网——`T-L3a…` 仅存归档档 `thincoder-cli/docs/_archive/design/MULTI-INSTANCE-COLLAB.md:190-193`（现行档 §10.1 明载该测试覆盖表**不并**、无接续族）；`peerCollabNote` / `recordPeerWrites` / `flushPeerDomains` 现有命中**全部在 `thincoder-core/test/peer-claims.test.mjs`（认领面用例的脚手架路径）**——足迹面自身契约零断言。

核半（新档 `thincoder-core/test/peer-domains.test.mjs`，用例号族 `T-L3a…`；沙箱 = `_setPeersDirForTest` + `_setSessionsDirForTest` + `_setPeerDomainsTestImpl({ aliveFn, statFn })`）：

| 用例 | 输入 | 期望 |
|---|---|---|
| T-L3a | 工具带 `touchedPaths`（多变体）+ args 另携 `path` | 目标 = touchedPaths 产物（`path` 不参与） |
| T-L3b | `file_ops`{source,dest} · 其余工具 `{path}` · `{}` · `{path:42}` · 相对 / 绝对入参 | 双算 / 单算 / `[]` / `[]`（畸形跳过）/ 按 cwd resolve · 绝对原样 |
| T-L3c | `PEER_WRITE_TOOLS` 成员判定 | ⊇ FILE_MUTATORS ∪ {file_ops}；`bash` / `read` 不在 |
| T-L3d | 他实例域含 target，`updatedAt = now − HOT_WINDOW_MS` ∥ `− 1ms` | 界内命中 · 超界零命中（`conflicts(..., {now})` 参数化） |
| T-L3e | 域 = 目录 D / target = D 下文件；self 记录；他 cwd 记录 | 目录包含 ⇒ 命中；self ∧ 他 cwd ⇒ 零命中 |
| T-L3f | `aliveFn → null` ∥ 判活缺该 pid | 零命中 ∧ 文件**不删**（D-MI10）∥ 文件被惰性清理 |
| T-L3g | 同回合两次 `recordPeerWrites`（两目标）→ `flushPeerDomains` → 二次 flush | 文件 `domains` = 两目标（排序）；二次 flush 零写（内容 / mtime 不变） |
| T-L3h | 先 `markClaimNoted`，agent 无 `_peerWritten` → flush | 零写 ∧ `agent._peerNoted.size === 0`（清空先于早退——§4.4.4） |
| T-L3i | peers 目录不可建（父路径为常规文件） | `recordPeerWrites` / `flushPeerDomains` 不抛 ∧ `agent._peerWritten` 保留（可重试） |
| T-L3j | `executeToolCalls` 真 dispatch：仅足迹命中 ∥ 工具返 `Error:` ∥ 非写工具 | 附逐字足迹行 + 写照发 + 成功记账 ∥ 零附零记账 ∥ 零预检零记账 |
| T-L3k | `finalizeAgentTurn`（轻夹具） | 本回合 `domains` 落盘（收尾接线；夹具形态由实施轮定——判据 = flush 被调用） |

端半（新档 `thincoder-vscode/test/peer-domains.test.mjs`，用例号族 `T-L3v…`；沙箱 = 端 `_setPeersDirForTest` / `_setSessionsDirForTest` + 核探针缝）：

| 用例 | 输入 | 期望 |
|---|---|---|
| T-L3v1 | `registerDomains` 两目标 → `flushDomains` | 文件 `domains` = 两目标；认领 / 未知字段逐字保留（字段级合并写） |
| T-L3v2 | 他实例 hot 域（界内 / 超界）+ 目录级重叠 + 他 cwd | 命中 / 零命中（与核同判据） |
| T-L3v3 | `statFn` 计数 | 目录 mtime+size 未变 ⇒ 缓存命中零重扫；单次查询 stat ≤ 1 |
| T-L3v4 | 死 pid ∥ `aliveFn → null` | 惰性清理 ∥ 保守不删 |
| T-L3v5 | 本 cwd 无 manifest ⇒ 写工具执行 | 零预检零 peers 写（测试卫生门） |
| T-L3v6 | 足迹命中（单 / 多 target）+ 混合命中 | 逐 target 一行（§4.3 字面）· 混合 ⇒ 认领行 + 未覆盖足迹行（零双报） |

端新档须入册 `thincoder-vscode/test/files.mjs`（清单单源——**新增测试文件不登记则永不执行**）；核半由 `node test/run.mjs` 单层 glob 自动收集（无需登记）。

### 2.4 受影响文件与测试面（行数 = 设计轮实读）

| 文件 | 现行数 | 预期 Δ | 限额 / 备注 |
|---|---|---|---|
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 386→**405**（本批前 → 本修正轮落盘后） | 实施轮零改（设计轮 +15 ⇒ 401 · 修正轮 +4 ⇒ 405） | 本文档 = 设计面唯一权威；口径 = 2.8 |
| `thincoder-core/peer-instances.mjs` | 179 | **+1**（`export` 词）+ 头注 ±1 | ≤300 |
| `thincoder-vscode/src/extension/peer-instances.mjs` | 202 | **−14~−18**（镜像 + 档头注句） | ≤300 |
| `thincoder-vscode/src/extension/peer-domains.mjs` | 264 | **±3**（`peerConflictNote` 改形） | 越 300 软线 ⇒ **停手上报**（落点变更须设计裁——不自行外提） |
| `thincoder-vscode/src/extension/peer-claims.mjs` | 232 | **−5**（删 `writeRecordAtomic` 6 行 + import 1 行） | ≤300 |
| `thincoder-vscode/test/peer-claims.test.mjs` | 241 | **±3**（TV7 断言改形 + `:195` 负例串） | 测试面 |
| `thincoder-vscode/test/peer-domains.test.mjs` | 新 | **~150** | **须入册** `test/files.mjs` |
| `thincoder-vscode/test/files.mjs` | 139 | **+1** | 清单单源 |
| `thincoder-core/test/peer-domains.test.mjs` | 新 | **~220** | 核 runner 单层 glob 自动收集 |
| `thincoder-core/peer-domains.mjs` | 299 | **零改** | 贴 300 软线——本批零触 |
| `thincoder-core/agent/dispatch.mjs` | 497 | **零改** | 贴 500 硬限——本批零触（钩点接线既有，签名零变） |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 418 | **零改** | `peerNotes` 签名零变 |
| `thincoder-core/agent/run-stages.mjs` | 267 | **零改** | `flushPeerDomains` 调用点既有 |
| `thincoder-vscode/src/agent/run-stages.mjs` | 422 | **零改** | `clearPeerNoted` + `flushDomains` 调用点既有 |

### 2.5 验收对照（逐条回指条目 · 机检形）

| AC | 回指 | 判据（可机检） |
|---|---|---|
| AC-291-1 | #291 | 扫描面 / 排除面口径 = 设计档 §4.3「字面规范面」条判据①（**单源**——本行不另书扫描面）⇒ 字面 `[peer conflict notice]` 排除三面后 **0 命中** |
| AC-291-2 | #291 | 同（target × 属主集）输入 ⇒ 端 `peerNotes` 足迹行与核 `peerCollabNote` 足迹行**逐行字面相等**（按行拆分比较——分隔符端差不入锚）；落点 = 端 `test/peer-claims.test.mjs` TV7 改形 / 端 `T-L3v6` |
| AC-291-3 | #291 | 端多 target 足迹命中 ⇒ 恰 N 行（逐 target）——零聚合单行（`T-L3v6`） |
| AC-291-4 | #291 回归 | 核 `peer-claims.test.mjs` T8 逐字锚 ∧ 端 TV1 认领文案对拍 ∧ 端 TV7 三态 全绿 |
| AC-302-1 | #302 | 端 `src/extension/peer-instances.mjs` 零 `function groupSlotSessions` ∧ 具名 import 自核；核档该符号在 export 面（结构机检） |
| AC-302-2 | #302 | 同 manifest 四形态（多槽同 sessionId / 非数字槽 / 空 sessionId / pid 不可解析）⇒ 端分组产物 ≡ 核 `groupSlotSessions` 产物（逐字段） |
| AC-302-3 | #302 回归 | 端 peer 面既有用例全绿 + `thincoder-vscode/test/zero-sync-exec.test.mjs` 绿（扫描域含该档——N3 门禁不交） |
| AC-296-1 | #296 | 端 `peer-claims.mjs` / `peer-domains.mjs` 零 `renameSync` 直引 ∧ 零本地 tmp+rename 实现；`writeRecordAtomic` 全仓零消费（除归档面） |
| AC-296-2 | #296 | peers 目录不可建（父路径为常规文件）⇒ `registerClaims` / `flushDomains` 链路**不抛** ∧ 既有记录零损 ∧ 内存账保留（可重试） |
| AC-296-3 | #296 回归 | 端 peers 写读 / 字段级合并写 / 原子可见性（TV2–TV7 + `T-L3v1`）全绿 |
| AC-290-1 | #290 | 核新档 `thincoder-core/test/peer-domains.test.mjs` 落盘 ∧ `T-L3a`–`T-L3k` 全绿（`npm test` 收录） |
| AC-290-2 | #290 | 端新档 + `test/files.mjs` 入册 ∧ `T-L3v1`–`T-L3v6` 全绿 |
| AC-290-3 | #290 | 三包全绿（core / cli / vsc） |
| AC-共-1 | 全批 | `doc-check` 悬空锚 / 行宽零新增；设计档规范面零修订式残句（D8 自查） |

### 2.6 合规检查（需求档 · 五要素 / 判定句 / 验收）

- 需求档 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` 五要素在位（模块目标 §1 · 功能判定句 F-MI1–F-MI9 · 边界 §4 · 判定句可机检 · 依赖 = 档头「相邻面」指针行（`WORKSPACE.md` / `SESSION.md` / 本机制设计档 · `:5-6`））——**本批零改需求档**：F-MI3 判定句不锁字面（「返回 peer 冲突提示（软提示，写不被阻止）」）⇒ 字面裁定属设计面（§4.3）；N-MI2 / N-MI6 / N-MI7 与 D-MI22–D-MI24 同向（lockstep / 判据单源 / 成本与降级）——**N-MI2 射程读法**：『实现各自独立』= 行为语义面；无端差纯函数 / 落盘原语共享不属该射程（口径单源 = 设计档 §8 D-MI24）。
- **观察（已闭环 · 父侧 2026-09-25 处置）**：F-MI3 判定句坐标枚举 = 域面 / 写侧各列核 + VSC 双面（核 `thincoder-core/peer-domains.mjs` · `thincoder-core/agent/dispatch.mjs`；VSC `thincoder-vscode/src/extension/peer-domains.mjs` · `thincoder-vscode/src/agent/execute-tools.mjs`——`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:32`，本席实读回核），与 F-MI1 / F-MI2 同形、枚举对称；核面坐标由父侧补毕——本项无余。

### 2.7 上抛项 / 未决点 / 范围外发现

1. **（范围外 · 建议入册）核 / 端 L3 目标解析语义差**：端 `l3TouchedPaths`（`thincoder-vscode/src/agent/tool-gates.mjs:21-29`）对 `file_ops action:"copy"` 只取 `dest`（源仅读）；核 `peerWriteTargets`（`thincoder-core/peer-domains.mjs:79-95`）对 file_ops 一律 source/dest 双算 ⇒ copy 的**源**被核登记为「写过 + 认领」，对端在该源上会收到假「刚写过 / 意图认领」提示；且与设计档 §4.2「file_ops 取 source/dest 双算」字面相抵（端侧为窄形态）——属双源漂移**同族**（#291 邻面，未入台账条目）。本批零触；建议入册（裁定方向二择：按动作区分 copy / move，或核向端对齐并同改 §4.2 字面）。
2. **（已知边界 · 登记）** 末级兜底支不可确定性触发（无 fs 注入缝）——行为判据取可达面（AC-296-2），兜底支以单源化承载（端引核）。
3. **（实施轮提示）** 实施后 `thincoder-core/peer-instances.mjs` / 端同名档行数变动 ⇒ 设计档 §3.1 与端档头注的行锚再漂，**收正轮 re-anchor**（先例 = intent-claims 批收正轮，`docs/batches/2026-09-25-intent-claims.md` §5）。
4. **（一致性面 · 本批已修 · 逐处报告）** 设计档陈旧坐标随本批实读重锚：§3.1 `:51`（`peerInstances` `:99`→`:112`）· `:54`（`batchAlive` `:59`→`:118`）· `:56`（`probeCmdlines` `:91`→`:168`）· `:96`（注入缝 `:37/:44`→`:48/:55`）· §3.3 `:123`（`peerInstancesTool` `:152`→`:166`）· §7 `:287`（测试缝同改 + 补 `groupSlotSessions`）· §4.4.6 `:247`（dispatch 行数 496→497）。**语义零改**（D4 指针可用性）；`:59` 处原为 intent-claims 评审轮登记的域外项（`docs/batches/2026-09-25-intent-claims.md:210`），本批随面触碰一并收正。
5. **（登记不改 · 端差保留）** 行间分隔符端差（核 `\n` / 端块内 `\n\n`）**不动**——§4.3 / §4.4.4 既有条已明写「不属逐字锚」；对拍判据按行拆分比较（AC-291-2）。
6. **（已处置 · 父侧 2026-09-25）** F-MI3 判定句坐标枚举观察闭环——核面坐标已补，现文双面皆列（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:32` · 本席实读回核）；本项无余。

### 2.8 勘误（行数 / 坐标读数）

2.2 / 2.4 两处档行数读数订正：设计档 `docs/core/design/MULTI-INSTANCE-COLLAB.md` 现读数 = **386（本批前 · `git show HEAD:` 实测）→ 401（设计轮落笔后 · `split('\n').length` 口径，含尾换行幻影 1 行 ⇒ 实体 400）**。

- 2.2 首段「399 行 → 预期 ~419」与 2.4 行「399→**401**」中的 **399 为笔误**（写稿时按插入量估算，未实读回核）；语义零改，实施轮以本块读数为准。
- 2.4 其余行数 = 实读值（`thincoder-core/peer-instances.mjs` 179 · 端同名档 202 · 端 `peer-domains.mjs` 264 · 端 `peer-claims.mjs` 232 · 端 `peer-claims.test.mjs` 241 · 端 `files.mjs` 139 · 核 `peer-domains.mjs` 299 · 核 `dispatch.mjs` 497 · 端 `execute-tools.mjs` 418 · 核 `run-stages.mjs` 267 · 端 `run-stages.mjs` 422）。

**坐标 / 表值重锚（2026-09-25 · 评审轮 1 修正 · 逐处实读）**：§2.2 表内六处落点坐标与 §2.4 行数按现文订正（现值 = 本修正轮落盘后实读）；订正关系：§4.4.1 `:195`→`:199` · §4.4.4 `:226` / `:227-228`→`:230-231` · §8 `:315-317`→`:319-321` · 变更记录 `:395-397`→`:399-401` · §7 `:277`→`:287` · `:243`→§4.4.6 `:247` · 设计档行数 401→**405**（修正轮 +4——§4.3 +2 · 变更记录 +2）· 迁移期引文 `:362`→`:364`。

**机检读数（设计轮落闸 · `node scripts/doc-check.mjs`）**：本批笔迹面零净增——`MULTI-INSTANCE-COLLAB.md` 仅 1 行列报（`:364` 迁移期引文 · 不入闸，本批前既有）；本批新写 `T-L3a…` / `T-L3v…` 用例号锚曾入闸 2 条（用例号族在写稿期无在册载体）⇒ **已就地收正**（用例号族改指本批档 §2.3——设计档正文只留覆盖面描述，与 §4.4.7 先例同形）；复核后闸态悬空 = 7 条（全部为他档既有）。

### 2.9 关键决策（七要素第 6 项 · 补落——逻辑位在 2.5/2.6 之间）

| # | 决策 | 理由 | 被否备选 |
|---|---|---|---|
| KD-1（#291 · 落 = 设计档 §8 D-MI22） | 足迹软提示**字面规范面 = 设计档 §4.3 单源**；端侧按本字面**逐 target 出行**（单一形态） | 设计档逐字锚 + 核实现 / 核测试已逐字锁 ⇒ 端为唯一漂移点；多实现面默认消差（端侧聚合无结构性不对称——两端钩点同为多目标列表）；与认领面同族（逐 target / 同 tag `[peer-collab]`）；消差后逐字锚与 N-MI2 lockstep 由**跨端逐行对拍**机检（先例 = AC-IC11 认领文案对拍） | ① **改档采端聚合形态**——核实现 + 核测试 + §4.4.4 逐 target 抑制语义 + 认领行同族形态连带迁移，收益不抵；② **只统一 tag、保留端聚合体**——双形态并存 ⇒ 逐字锚不成立、对拍不可机检（不消差 = 未裁） |
| KD-2（#296 · 落 = §8 D-MI23） | 端 L3 落盘原语 = **引核 `writeSessionFile`**（端档零本地原子写实现） | 单一实现 + **末级兜底支**随核原语到位（端侧自持版二次 rename 失败 ⇒ 旧记录已删、内容只存 `.tmp`——NF2 静默丢一次登记） | **端侧就地补末级兜底**——留第二实现、两形态继续并存（同语义实现默认归单源，本仓既有判例） |
| KD-3（#302 · 落 = §8 D-MI24） | 分组半段 `groupSlotSessions` = **核具名导出 + 端引核**（消端侧逐字镜像） | 纯函数、零端差；端壳自持的 SWR 壳形端差不受影响（**共享半段 ≠ 委托整面**） | **端侧续持镜像**——逐字复制件无守卫，核侧改则端静默漂移 |
| KD-4（#290 范围） | 背填面 = **核 / 端两新测试档**（足迹面自身契约）；认领面用例（TV1–TV8 / T1–T10）**不重写**——只随 #291 改形其足迹行断言 | 认领面已有专面网（intent-claims 批）；本项对象 = 无网面（D-L3a / D-L3b） | **并入既有认领面档**——面不同（足迹 vs 认领），且两档均已近 250 行；**扩为全板块重测**——超出「足迹面零测试网」条目射程 |
| KD-5（本批边界） | `thincoder-core/peer-domains.mjs`（299）· `thincoder-core/agent/dispatch.mjs`（497）**零触**；端 `peer-domains.mjs` 若改后越 300 软线 ⇒ 停手上报 | 前两档贴限额（300 软线 / 500 硬限）；第三档落点变更须设计裁定 | **顺带外提 / 顺手重排**——无条目依据、贴限额档的手改面扩大 |
| KD-6（本批边界） | 行间分隔符端差（核 `\n` / 端 `\n\n`）**保留**；对拍判据按行拆分比较 | §4.3 / §4.4.4 既有条已明写「不属逐字锚」（登记项，非漂移） | **顺带统一分隔符**——非 #291 对象（串漂移），改之属夹带 |

（2.9 KD-4 附注 · 读数订正：两既有认领面档行数 = 核 `thincoder-core/test/peer-claims.test.mjs` **272** · 端 `thincoder-vscode/test/peer-claims.test.mjs` **241**——KD-4 理由列「两档均已近 250 行」以本读数为准。）

### 2.10 评审轮 1 修正块（7 条逐条落地 · 2026-09-25 · eng-designer）

**对象** = 本档 §3「轮次 1」（🔴1 / 🟡3 / 🔵3 = 7 条 · VERDICT changes-required）；父侧裁定 **7/7 全收**（`Suggestion` 列 = 处置建议；处置执行 = 本席）。改动面 = 设计档 `docs/core/design/MULTI-INSTANCE-COLLAB.md`（:NN = 本修正轮落盘后实读）+ 本档 §2。**§2 表内 = 即场收正**（评审发现 4 明示「表内与勘误块单读一致」——订正关系 = §2.8 `:159` 新增块）。

| # | 号 → 改动（file:line） |
|---|---|
| 1 | 设计档 §4.3 判据① `:167-168` **重定义**——扫描口径单源：扫描面 = 核 / 端两包（`thincoder-core/**` · `thincoder-vscode/**`）+ 书写面（`docs/**/design/**` · `docs/**/requirements/**`）；三排除 = ⒜ 定义性引用行（设计档 §4.3「字面规范面」条内载该字面的判据行）· ⒝ 记录面 / 归档面（`docs/batches/**` · `**/_archive/**`）· ⒞ `.thincoder/tmp/**`。两处口径不一致消除；本档 **AC-291-1 `:123` 改引指**（不另书扫描面——单源） |
| 2 | 设计档 §8 D-MI24 `:321` 补 **N-MI2 射程读法**（『实现各自独立』射程 = 行为语义面；无端差纯函数 / 落盘原语共享不属该射程——口径单源）；本档 §2.6 `:140` 同源句落。**需求档面已上抛**（N-MI2 例外面枚举 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:44` / §5.2 登记行 `:84` 候选对齐——父侧笔） |
| 3 | 本档 §2.6 `:141` 观察**按实读重述**（F-MI3 坐标现为双面皆列 · `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:32`，本席实读回核）+ §2.7 `:150` 新第 6 项处置注记（父侧 2026-09-25 已补核面坐标） |
| 4 | 本档 §2.2 `:42` / `:43` / `:44` / `:45` / `:46` / `:47` 六处坐标 + `:37` 行数 + §2.4 `:104` + §2.7-④ `:148` 按现文重锚（现值 = 设计档实读）；订正关系并入 §2.8 `:159`（新「坐标 / 表值重锚」块） |
| 5 | 设计档 §4.3 `:148`：签名句补 `{ now }`（`conflicts(cwd, targets, { now })`——实读码 `thincoder-core/peer-domains.mjs:190`，`now` 缺省 `Date.now` 已具）⇒ `T-L3d` 双侧界参数化成立、核档零改边界维持 |
| 6 | 设计档 §4.3 `:166` 补 **F-MI9 读法**（「既有文案」= 规范面字面本体——端侧改形 = 聚合单行 → 逐 target 行形态，文案串零变） |
| 7 | 本档 §2.6 `:140` 括注收正——「依赖 §5」→ 依赖 = 档头「相邻面」指针行（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:5-6`） |

**机检读数**（本席实跑 · `node scripts/doc-check.mjs` · 轮末）：① 设计档本批面**零净增**——仅 1 条列报（`:364` 迁移期引文 · 不入闸 · 本批前既有，随修正轮 +2 位移）；修正轮新增锚候选 +6（23737→23743）全部解析、零悬空新增；行宽零新增（该档 7 条 >300 行全为表格行——表格行豁免）。② 闸态悬空 **14** / 行宽 **19** = 与轮初基线逐条同集（全部为他档既有；`MODEL-SPECS.md:409` 字符数 334→385 系并行批面变动——本席零触）。③ 本档不入扫描域（`checkConfig.anchors.exclude` 含 `batches`）——零贡献。

**零扩面确认**：7 条 = 口径 / 读法 / 坐标 / 括注面；零代码 · 零新语义（评审 7 条直接导出项）· 需求档零触 · 本档 §1 / §3–§6 零触 · 其他设计档 / 批档零触。

### 2.11 收正轮块（实施轮实测发现 · 2026-09-25 · eng-designer）

**变更记录（一行）**：T-L3v2 期望列勘误（「（与核同判据）」字样作废——期望列以端实态为准）+ 端差第三项（判据差）登记落设计档 §4.3。

**对象** = §2.3 端半 T-L3v2 行（`:92`）+ 端差登记面；来源 = 实施轮实测（2026-09-25）· 父侧裁「本批零改（D-MI5 边界）· 登记 + 批档勘误 = 本轮」。改动面 = 设计档 `docs/core/design/MULTI-INSTANCE-COLLAB.md`（坐标 = 本轮落盘后实读）+ 本档 §2。**本档表内不改**（append-only）——勘误以本块为准（先例 = §2.8「实施轮以本块读数为准」）。

| # | 号 → 改动（file:line） |
|---|---|
| 1 | 设计档 §4.3 `:169-171` **新增**「冲突判据端差」登记条（第三项——四态实测 + 本批零改 + 消解裁定待另批） |
| 2 | 本档 §2.3 `:92` T-L3v2 行勘误（表内不改——以本块 ① 为准） |
| 3 | 设计档 变更记录 `:407-408` **新增**收正轮一行 |

**① T-L3v2 行勘误（逐输入 · 端实态）**：「（与核同判据）」字样**作废**；期望列按端实态改写（实测 = 实施轮 · 本席实读回核）：

| 输入 | 端 `conflicts` 期望（端实态） | 核对照 |
|---|---|---|
| 他实例 hot 域 · 界内 / 超界 | 命中 / 零命中 | 同（hot 窗口同判） |
| 目录级重叠（域 = 目录 D · target = D 下文件） | **零命中**（归一后精确匹配） | 命中（`pathsOverlap`） |
| 他 cwd 登记 | **照常命中**（与 cwd 无关） | 零命中（同 cwd 过滤） |
| 同路径（正控） | 命中 | 命中 |

**② 端差第三项登记注（判据差）**：端 `conflicts`（`thincoder-vscode/src/extension/peer-domains.mjs:166`）= 归一后精确匹配（`:174-176`）+ 与 cwd 无关；核 `conflicts`（`thincoder-core/peer-domains.mjs:188`）= `pathsOverlap`（`:207`）+ 同 cwd 过滤（`:180`）——前表四态即本项逐条实测（端新测试档 `thincoder-vscode/test/peer-domains.test.mjs` 之 T-L3v2 写态同此 · 实读）。登记落设计档 §4.3 第三项；本批零改；消解裁定待另批（台账 #344 已立）。**不新开裁定**。

**提示（范围外 · 记录不改）**：① 核 `thincoder-core/peer-domains.mjs` 在途未提交改动（−2 行——`peerWriteTargets` 改单源谓词 `toolTouchPaths`，#327 笔迹）⇒ 设计档档载坐标对现文再漂（核 `conflicts` `:190` → `:188` · `peerDomains` `:179` → `:177`）；端档在途 +11 行（`:90-111` 区 +2）。② 设计档本轮 +5 行（登记条 +3 / 变更记录 +2）⇒ §2.2 表内设计档坐标、§2.4 行数行（405 → 410）随漂。两项一并归实施后收正轮 re-anchor（§2.7-3 射程外补）。本席零触。

**零扩面确认**：点名两处 + 变更记录；零代码 · 零测试档 · 需求档零触 · 其他节 / 他档零触。

**机检读数**（本席实跑 · `node scripts/doc-check.mjs`）：入场基线 = 闸态悬空 **4** / 行宽 **18**；出闸 = 悬空 **4** / 行宽 **18**（逐条同集——全部为他档既有；本批面零净增：新增锚候选 4 全解析、零新列报）。设计档行内列报仍 1 条（`:367` 迁移期引文 · 不入闸 · 随 +3 位移）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审轮报告**（域 = 批档 §2 + 设计档设计面 + 需求档；代码面（`thincoder-core/**`、`thincoder-vscode/**`、`thincoder-cli/**` 与台账 evidence）未入域未读——涉代码状态断言均 `unverified`；无标准档 / 无 Document Map，归属与方法论判定降级）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria / Document ownership | 🔴 | #291 零残留机检两处口径不同、且按字面均不可满足：① 批档 AC-291-1（`docs/batches/2026-09-25-peer-closeout.md:123`）扫描面含 `docs/**/design/**`，而设计档 §4.3 判据行自身即载该字面（`docs/core/design/MULTI-INSTANCE-COLLAB.md:166`）⇒「0 命中」不可达；② 设计档判据①口径 =「全仓（除 `.thincoder/tmp/**` 与归档面）」（同 `:166`），未除记录面 ⇒ 本批档 `:13`/`:55` 即命中。同一机检（#291 结构判据）两处描述范围不一致，且各自按字面无法通过 | 把该机检范围定义归到单处（设计档判据与批档 AC 二择一为单源、另一处引指），并在口径中显式排除「定义性引用行（判据自身）」与「记录面（批档 / 归档）」——或把扫描域收为代码面 + 本批档以外的书写面 |
| 2 | Requirements（N-MI2 射程） | 🟡 | D-MI23 / D-MI24 把核单源扩到「落盘原语 / 分组纯函数」两面（`docs/core/design/MULTI-INSTANCE-COLLAB.md:318`/`:319`），而 N-MI2 例外面枚举仍为「判活 / 标记判据面除外…独立性指其余面」（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:44`），§5.2 登记行只登 F-MI6 引核面（同档 `:84`）；批档自称「本批零改需求档」并把 N-MI2 记为「同向」（`docs/batches/2026-09-25-peer-closeout.md:140`）——按 N-MI2 字面，端侧两处引核可被判「违反独立性」 | 把 N-MI2 例外枚举（及 §5.2 现役登记）与 D-MI23 / D-MI24 射程对齐，或在设计档明写一句口径（无端差纯函数 / 原语不属「实现各自独立」射程），使需求面与设计面同读 |
| 3 | Requirements（事实核对） | 🟡 | 批档 §2.6 观察称 F-MI3 判定句坐标「只列端面」（`docs/batches/2026-09-25-peer-closeout.md:141`），与需求档现文相抵——F-MI3 现列双面（域面 + 写侧各列核 / VSC，`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:32`）⇒ 该「枚举不对称」观察按现文不成立 | 先对需求档现文实读回核该观察，再决定撤下或按实读重述 |
| 4 | Clarity（落点坐标 / 读数） | 🟡 | §2.2 表头自称「实读回核」，但部分落点坐标与设计档现文不符：§4.4.1 `:195`→实为 `:197`；§4.4.4 `:227-228` 未覆盖实际端侧混合合成行 `:229`；§8 `:315-317`→实为 `:317-319`；变更记录 `:395-397`→实为 `:397-399`；§7 `:277`→实为 `:285`、`:243`→实为 `:245`（批档 `:42`/`:44`/`:45`/`:46`/`:47`/`:148` vs 设计档 `:197`/`:229`/`:317-319`/`:397-399`/`:285`/`:245`）；另 2.4 设计档行「399→401」与 2.2 首段「399 行 → 预期 ~419」虽经 2.8 勘误（386→401），表内错值仍在 | 把 2.2 / 2.7-④ 坐标按现文重锚（或改节级引用），并把该勘误并入 2.8 块（现块只覆盖行数读数），使表内与勘误块单读一致 |
| 5 | Feasibility（unverified） | 🔵 | T-L3d 以 `conflicts(..., {now})` 参数化测 hot 窗双侧界（`docs/batches/2026-09-25-peer-closeout.md:78`），但设计档 §4.3 所载签名为 `conflicts(cwd, targets)`（`docs/core/design/MULTI-INSTANCE-COLLAB.md:148`），且同批声明核 `peer-domains.mjs` 零改（批档 `:113`）——若实现无 `now` 参，零改约束下边界用例只能取 wall-clock（±1ms 对齐真时 ⇒ 非确定性）。（核实现未入评审域——`unverified`） | 先核实 `conflicts` 是否已受 `now` 参：已有则把该参补进设计档 §4.3 签名句；没有则该用例的时钟锚点须另定（不引 wall-clock 边界） |
| 6 | Requirements（F-MI9 读法） | 🔵 | F-MI9 末句「仅足迹命中 ⇒ 既有文案零变」（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:37`）与 D-MI22 的端侧足迹文案改形（`docs/core/design/MULTI-INSTANCE-COLLAB.md:317`；批档 `:55`）在字面上需一句口径——「既有」读作设计档 §4.3 规范面字面才不冲突；2.6 只核 F-MI3，该句读法未见落档 | 在一处（合规检查或设计档条）明写该句读法（「既有文案」= §4.3 规范面字面），免后续审计把端侧串变读成违反 |
| 7 | 合规检查（事实核对） | 🔵 | 2.6 列「五要素在位（…· 依赖 §5）」（`docs/batches/2026-09-25-peer-closeout.md:140`），需求档 §5 现标题为「不并项与历史沿革」（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:57`），无「依赖」节——该括注与现文不符（五要素规范原文未入评审域，仅登记差异） | 收正括注至现文（或删该括注） |

计数：🔴 1 · 🟡 3 · 🔵 3（共 7 条）

域外注（不计严重度）：
- 字面 `[peer conflict notice]` 在域外记录档亦有命中（如 `docs/batches/2026-09-25-intent-claims.md:123`、`:210`）——按设计档 `:166`「全仓」口径实扫，命中面超本批两档；此为第 1 条范围定义问题旁证，未作判据。
- 批档 §2.7-1（核 / 端 L3 目标解析语义差）与 §2.7-3（实施后 re-anchor 提示）涉代码面，未入域未核；作为上抛 / 登记项无异议。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审轮 2 报告（修正验证）**（域 = 本档 §2.10 修正块 7 条 + 需求档 N-MI2 同步行及其落点面（设计档 `:148`/`:164-169`/`:321` · 需求档 `:44`/`:84`/`:99`）；代码面未入域——涉码断言 `unverified`；无标准档 / 无 Document Map，归属与方法论判定降级）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 设计档 `:167-168` · 本档 `:123` | — | ✅ Fixed | 扫描口径单源已落：设计档判据① 重定义为「扫描面 = 核 / 端两包（`thincoder-core/**` · `thincoder-vscode/**`）+ 书写面（`docs/**/design/**` · `docs/**/requirements/**`）排除三面后零命中」，三排除 = ⒜ 定义性引用行 · ⒝ 记录面 / 归档面 · ⒞ tmp；AC-291-1 改引指（「单源——本行不另书扫描面」）。本轮实扫（grep）核验可达性：设计 / 需求树内该字面唯 `:168` 一处（= ⒜ 排除面）；包内现命中 = `thincoder-vscode/src/extension/peer-domains.mjs:220` · `thincoder-vscode/test/peer-claims.test.mjs:195`（负例串）`/`:209`——皆 §2.4 `:107`/`:109` 已列改形面 ⇒ 实施后 0 命中可达 |
| 2 | 2 | 需求档 `:44` · 设计档 `:321` · 需求档 `:99` | — | ✅ Fixed（主判据） | N-MI2 射程句已同步（「无端差纯函数 / 落盘原语共享不属该射程〔…D-MI23 / D-MI24〕，独立性指其余**行为语义面**」）+ 设计档 D-MI24「N-MI2 射程读法（射程口径单源 = 本行）」+ 需求档变更记录 `:99`（父侧直接执行 · 可 revert）。余项 → 第 8 / 10 行 |
| 3 | 3 | 本档 `:141` · `:150` | — | ✅ Fixed（按实读重述） | 观察重述为「域面 / 写侧各列核 + VSC 双面（需求档 `:32`，实读回核）」——与现文一致。余项（记录面）→ 第 9 行 |
| 4 | 4 | 本档 `:37` / `:42`–`:47` / `:104` / `:148` | — | ✅ Fixed | 六处落点坐标 + 行数按现文重锚，逐处回核通过：§3.1 `:51`/`:54`/`:56`/`:96` · §3.3 `:123` · §7 `:287` · §4.4.6 `:247` · §4.3 `:164`/`:165-168`/`:169` · §4.4.1 `:199` · §4.4.4 `:230-231` · §8 `:319-321` · 变更记录 `:399-401`/`:402-403`；行数 405 与 §2.8 口径一致；订正关系并入 §2.8 `:159` |
| 5 | 5 | 设计档 `:148` | — | ✅ Fixed（文面） | 签名补 `{ now }`（「`now` 缺省 `Date.now`，测试注入确定性时钟」）——与 T-L3d `:78`「`conflicts(..., {now})` 参数化」一致；码面断言（`thincoder-core/peer-domains.mjs:190`）仍 `unverified`（码面未入域） |
| 6 | 6 | 设计档 `:166` | — | ✅ Fixed | F-MI9 读法已落（「既有文案」= 本条规范面字面本体） |
| 7 | 7 | 本档 `:140` | — | ✅ Fixed | 「依赖 §5」→「依赖 = 档头「相邻面」指针行（… `:5-6`）」（需求档 `:5-6` 实存） |
| 8 | 2 余 | 需求档 `:84` | 🟡 | New（跨面口径滞后） | §5.2 理由列仍作「独立性指其余面」，未随 N-MI2 `:44` 的「其余**行为语义面**」收正——登记行理由列口径滞后（非机制级；report-and-fix） |
| 9 | 3 余 | 需求档 变更记录 `:88`–`:99` | 🔵 | New（待核） | 本档两处断言「核面坐标由父侧补毕 / 核面坐标已补」（`:141`/`:150`），但需求档变更记录无 F-MI3 条目（`:94` 仅记 F-MI1 / F-MI2；`:99` 为 N-MI2）——若补入确已发生，记录面缺一行；若坐标本已双面，本档两处断言待订正 |
| 10 | (new) | 本档 `:33` / `:140` | 🟡 | New（状态句相抵） | 「需求档笔面（零改——见 2.6 合规检查）」「本批零改需求档」与需求档 `:99`「peer 收口批 · 需求面同步 · 父侧直接执行 · 可 revert」相抵——N-MI2 同步已属本批需求面变动；两处状态句待随收（report-and-fix） |
| 11 | (new) | 本档 `:109` · 端测试 `:195` | 🔵 | New（提示） | 端测试 `:195` 负例串属 §2.4 改形面——改后不得再含该字面（AC-291-1 扫描面含 `thincoder-vscode/**`；负例断言内留存即自败），宜改锚新字面 / 行形态 |

计数：🔴 0 · 🟡 2 · 🔵 2（新）；轮 1 七条 = **7/7 修正验证通过**
机械注（不计严重度）：本轮《Agent Response》行所列 fresh-review 面（`docs/vsc/requirements/WEBVIEW.md` · `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`）与评审对象声明（peer-closeout 修正轮）不符——按对象声明与 Documents to Review 执行，未读该两档。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链（设计 → 评审 → 批准 → 实施 → 收口）；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass（轮 2）**——轮 1 = changes-required（🔴1 / 🟡3 / 🔵3）；修正轮 7/7 全落；**评审轮 2 = pass**（7/7 修正验证通过；新增 🟡2 / 🔵2 全非阻断）✓；
  - ② 修正落地核验 ✓ + 轮 2 报告遗留两笔已收：§5.2 理由列口径随收（需求档 `:84`）+ F-MI3 核面坐标补入补记（需求档 `:100`）✓；
  - ③ designToken **在效** ✓。
- **权限面说明（承轮 2 行 10）**：需求档 N-MI2 同步 / §5.2 收正 / F-MI3 补记 = **父侧直接执行笔**（可 revert），非设计笔；批档 §2「需求档零改」句指设计笔面——差异在此定格。轮 2 行 11（端测试负例串）已折叠进实施任务书。
- 据上：批③ 进入实施（eng-coder · 按批档 §2 + 设计档实施；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-25 · 按设计落盘 + 内部审计/评审双 pass）

**实施轮（eng-coder · 2026-09-25 · 按批档 §2 + 设计档 §3.1 / §4.3 / §4.4 落盘；父侧 T-L3v2 取向裁定按 ② 执行：端码零改 · 断言端实态）**

### 5.1 交付摘要（需求点 → 落点）

| # | 交付形态 | 落点（file:line） |
|---|---|---|
| #291 | 端足迹软提示**逐 target 出行**，行字面 = 设计档 §4.3 逐字（`[peer-collab] …`）；旧聚合单行形态与旧字面整体退场（无残句） | `thincoder-vscode/src/extension/peer-domains.mjs:212-218`（`footNoteLine`）· `:259-268`（逐 target 分组）；旧 `peerConflictNote` 删除 |
| #302 | 核 `groupSlotSessions` **具名导出**；端删本地 20 行镜像、改具名引核（壳形 / SWR / self 条 / 排序零变） | 核 `thincoder-core/peer-instances.mjs:85`；端 `thincoder-vscode/src/extension/peer-instances.mjs:31`（import）· `:93`（消费） |
| #296 | 端本地原子写删除；两调用点改引核 `writeSessionFile`（经端壳单源转口——含末级兜底支） | 端 `peer-claims.mjs:28`（引）· `:171`（`flushClaims`）；端 `peer-domains.mjs:34`（引）· `:85`（`flushDomains`）；核原语 `thincoder-core/session-slots.mjs:128-143` |
| #290 | 两端足迹面测试背填（真目录零触沙箱） | 核 `thincoder-core/test/peer-domains.test.mjs`（T-L3a…T-L3k · 11 例）；端 `thincoder-vscode/test/peer-domains.test.mjs`（T-L3v1…v6 + T-L3v7）；端 `thincoder-vscode/test/peer-instances.test.mjs`（T-PI1）；`thincoder-vscode/test/files.mjs:136-137` 入册 |

### 5.2 决策透明表（实施轮自决 + 越计划面）

| # | 决策 / 事实 | 依据与代价 |
|---|---|---|
| KD-1 | **端差第三项登记（判据差）**：端 `conflicts` = 归一后**精确匹配** + **与 cwd 无关** ∥ 核 = `pathsOverlap`（互为包含）+ 同 cwd 过滤——本批端码零改（父侧 2026-09-25 裁定 ②） | 实测四态：域为目录 D、target = D 下文件 ⇒ 端零命中 / 核命中；他 cwd 登记 ⇒ 端照常命中 / 核零命中。T-L3v2 断言端实态并在用例注释注明「与核 T-L3e 判据差 = 端差第三项」（`peer-domains.test.mjs:144-145`，无「与核同判据」字样）；设计档 / 批档补登记 = 父侧笔面 |
| KD-2 | T-L3v3 的「`statFn` 计数」**不加注入缝**：端档无 stat 缝，改经 Node 文档化面 `module.syncBuiltinESMExports()` 桥接 CJS `fs.statSync` 到 ESM 活绑定（档内明写手法 + finally 还原，零源改） | 端 `peer-domains.mjs` 保持 ≤300 软线且不动判据面；判据本体（单次查询 stat ≤1 · 目录元组未变零重扫）如实断言到（T-L3v3） |
| KD-3 | **表外新增两载体**（越 §2.3/§2.4 计划面）：端新档 `test/peer-instances.test.mjs`（T-PI1——AC-302-2 对拍唯一载体）+ 端档 T-L3v7（AC-296-2 载体） | 两条 AC 在原计划表内无载体（内部审计发现 1/2）；实施轮补建 ⇒ `test/files.mjs` 入册 **+2**（计划 +1）。父侧须在 §2.3/§2.4 补登（评审轮 2 行 3） |
| KD-4 | 端 `peer-domains.mjs` 越计划增量：264 → **274 行**（§2.4 预期 ±3） | 仍 ≤300 软线（无停手上报触发）；增量来自逐 target 分组 + `footNoteLine` doc。端 `peer-claims.mjs` 232 → **225**（预期 −5）；端 `peer-instances.mjs` 202 → **183**（预期 −14~−18）；核 `peer-instances.mjs` +1 行（如设计） |
| KD-5 | **环境动作（必披露）**：`thincoder-vscode/node_modules/@thincoder/core` 入场时 = 发布物化副本（0.9.5 · `npm install --install-links` 残留）⇒ VSC 套件入场基线 89 红（全部因物化副本早于今日并行批的核改动）；本席按 `docs/core/design/CORE-UNIFICATION.md` §2.6.1 / `docs/RELEASE.md:140`「发完可恢复开发链接」恢复为 **junction → `thincoder-core/`** | node_modules 面（git 零污染，`git status` 无 lock / node_modules 变更）；恢复后基线转绿。**发布前需再物化**（已知口径） |
| KD-6 | fix 轮（内部评审 🔵 两条 → 已修）：① 端 `footNoteLine` **删同 target 按 pid 去重**（改回与核同构的逐项 `map` + ", " 连接——消对拍发散面）；② 端 `peer-instances.mjs:33` 陈旧坐标 `peer-domains.mjs:124` 改函数名锚 | 均零行为/注释面收敛；修正后复核轮 = pass |

### 5.3 审计与评审轮次（终态）

- **内部发散审计（explore · 只读）**：轮 1 = DEVIATIONS——① ② ③ 满足；④ 部分实现：AC-302-2 对拍零机检锚 · AC-296-2 端侧零用例（均已补：T-PI1 / T-L3v7）；另 §5 未落盘（本轮补）+ T-L3v2 期望列与端实态相抵（上抛父侧，裁定 ②）。
- **内部代码评审（advisor · type=code）**：轮 1 = **pass**（🔴 0 / 🟡 3 / 🔵 4）；轮 2（修正验证）= **pass**——修正声明 ①② 均经 fresh read 证实。余项 = 父侧笔面（批档 §2.3 T-L3v2 行勘误 ① / §5 登记 ② / §2.3-§2.4 载体补登 ③ / 设计档 re-anchor ⑤ / 发版面确认 ⑦）。
- **fix 轮计数**：2（audit 轮 1 后 2 笔 + review 轮 1 后 2 笔）；终态 = **converged**。

### 5.4 验证读数（本席实跑 · cwd = `D:\teamcode\thincoder`）

| 项 | 命令 | 读数 |
|---|---|---|
| AC-290-1 | `cd thincoder-core && npm test` | tests **663 / pass 663 / fail 0**（含新档 11 例；入场基线含并行批在途 3 红） |
| AC-290-2 / AC-291 / AC-296 回指 | `cd thincoder-vscode && npm test` | tests **987 / pass 987 / fail 0**（含 T-L3v1…v7 + T-PI1；入场基线 = 环境红 89 → 恢复 dev link 后 966/966） |
| AC-290-3 组份 | `cd thincoder-cli && npm test` | tests **849 / pass 849 / fail 0** |
| AC-291-1 | 扫描面实扫（核 / 端两包 + `docs/**/design|requirements/**`，957 档；三排除面后） | 命中 **1** = `docs/core/design/MULTI-INSTANCE-COLLAB.md:168`（⒜ 定义性引用行——排除）；代码面 **0 命中** |
| AC-291-2 | 端 `peerNotes` ⇄ 核 `peerCollabNote` 同输入逐行对拍（T-L3v6 ② 在档 + 本席独立探针） | **逐行字面相等**（byte-equal） |
| AC-296-1 | 端两档 `renameSync` / `writeRecordAtomic` 直引扫描 | **0 / 0**；`writeRecordAtomic` 全仓代码面零消费 |
| AC-302-1 / 2 | 端档零本地定义 + 具名 import（结构）；T-PI1 四形态对拍（行为） | 结构 ✅ · 行为 ✅（`peer-instances.test.mjs`） |
| AC-共-1 | `node scripts/doc-check.mjs` | 悬空 **4** / 行宽 **18**（入场基线 14 / 19）⇒ **零新增红**；`MULTI-INSTANCE-COLLAB.md` 仍 1 行列报（`:364` 迁移期引文 · 不入闸） |
| 限额 | 端 peer-domains 274 · 端 peer-claims 225 · 端 peer-instances 183 · 核 peer-instances 180（read 计法） | 全部 ≤300 软线 |

### 5.5 设计档漂移（本席 diff 触及 · 不自行编辑）

- 核 `thincoder-core/peer-instances.mjs`：`groupSlotSessions` 由 `:84` 移至 **`:85`**（本批 +1 行 JSDoc）；设计档 §3.1 `:100` 现载 `:84` ⇒ 收正轮 re-anchor（批档 §2.7-3 已预登记）。
- 端 `thincoder-vscode/src/extension/peer-instances.mjs` 202 → 183 行 ⇒ 端档头注 `§3.1:102` 行锚再漂（同属 §2.7-3 预登记面）。
- 其余设计档核侧坐标漂移（§4.3 `:245` / §7 行内诸坐标 / §3.1 `:112`）经核 = 零改参照档 + 批档 §2.11 已预登记（并行批在途面）——由收正轮一并处置。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#27`（内部发散审计 = DEVIATIONS→已补/已上抛 · 顾问代码评审 **pass（轮 1 → fix → 轮 2 pass · converged）** · §5 在档 4770 字符）。
- **本席复核（读盘抽验）**：核 `peer-instances.mjs:85` 具名导出 ✓ · 端 `writeRecordAtomic` **零残留**（extension 面全扫）+ 两调用点改引核 `writeSessionFile`（`peer-claims.mjs:171` · `peer-domains.mjs:85`，经端壳 `./session-slots.mjs` 单源转口）✓ · 端逐 target 行（`footNoteLine:215` · 循环 `:261`）✓ · 端 ⇄ 核足迹行 **byte-equal**（交付对拍）✓ · T-L3v2 按父裁执行（端实态断言 · 全文无「与核同判据」字样）✓。
- 读数（交付）：核新档 **11/11** · 端新档 **7/7** · 端 `peer-claims` **8/8** · AC-291-1 代码面 **0 命中**（唯一命中 = 设计档定义性引用行——排除）· 三树 core 663/663 · vsc 987/987 · **cli 849–850**（并批未跟踪测试档在途——时点区间，fail 0）· doc-check 零新增红 ✓。

**表外与偏差登记（如实）**
- **表外新增 2 载体**（原 §2.3 / §2.4 无其载体——gap）：端 `test/peer-instances.test.mjs`（T-PI1 = AC-302-2 对拍）· 端 **T-L3v7**（AC-296-2 载体）——`files.mjs` 入册 **+2**（计划 +1）。**接受**（AC 有据、载体合理）。
- 越计划增量：端 `peer-domains.mjs` 264 → **268**（计划 ±3）——≤ 300 软线，无停手条件 ✓。
- 技术选型：T-L3v3 的 stat 计数经 `module.syncBuiltinESMExports()` 桥接（测试面 · 零源改 · finally 还原）——**接受**。
- 设计档漂移（承 §2.11 预登记 + 本批 diff）：核 `groupSlotSessions` `:84→:85` 等——**并 #345**（静默期 re-anchor）。
- **发版面注记**（交付提请 · unverified）：核新增导出（`groupSlotSessions`）随下次核包发布物化（`@thincoder/core` 版本随发布流程 +1，`^0.9.5` 区间自洽）——**发布前再物化**（junction → 发布态）时核。

**评审面**：设计评审 **pass（轮 2）** · 端差第三项登记已补（#36：设计档 `:169-171` + 批档 §2.11）· T-L3v2 行勘误已收 ✓。

**收口**：§1 置「已收口」· 记录冻结；台账 #291 / #302 / #296 / #290 → 待核销 → 已核销；designToken 消费（链终止）。
