# 2026-09-25 · intent-claims
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 05:01「我觉得可以把#23启动做了」——跨实例意图认领层（P1 · peers claims + TTL 租约）启动批（承 2026-09-21 LEDGER-EXECUTOR 批 P1 缓建 + 09-25 05:0x 判据讨论）。
> 台账 = #23（MULTI-INSTANCE-COLLAB · 归批）。前情 = docs/batches/2026-09-21-ledger-executor.md（已收口 2026-09-21）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件与现况（父侧 · 2026-09-25 05:0x · 台账 #23）

**来源**：用户 2026-09-21 02:46 批准「P0 马上开始，P1 记入台账」（P0 = 执行者归属 F-LX1，已交付并收口 `2026-09-21-ledger-executor.md`）→ P1 = 台账 **#23**（技术待办 · 条件触发 · 当日裁「缓建（零冲突案例，YAGNI）」）→ **用户 2026-09-25 05:01「我觉得可以把#23启动做了」**（径裁越过条件触发；实证面 = 今夜双会话同仓并行（CLI 会话 + VSC 会话）——父侧靠**人工文件域核对**才敢并行 = 该层价值实证）。

**条目原文（#23 · 逐字要点）**：跨实例意图认领层（P1 · peers claims + TTL 租约）——`peers/{sessionId}.json` 加 **claims 意图域**（TTL 30min + 进程死亡即失效），**写前 dispatch 钩子**命中他实例活认领 → **软提示升级（仍不阻止写**，D-MI6 不动）；与 D-MI5「写后登记」不冲突 = 认领与足迹**分开存**。优先变体（若触发源为长回合足迹空窗）= 先做「eng-coder 子代理收尾 flush 足迹」而非意图层。

**判据讨论（09-25 05:0x · 本会话）**：用户问「跨端互相通讯有没有意义」→ 父侧三层判断：**L1 共享状态**（同账 / 同记忆 / 同会话库——今夜两次真疼所在，修复在飞 #286）· **L2 结构化信号**（意图 / 占用登记——可机读，**非对话**）· **L3 自由互发消息**（价值低 + 绕过单一对话面决策 ⇒ 不做）。**本批 = L2**；上位边界（承 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` §4 既有裁定）= **不做跨实例消息 / 等待 / 自动合并 / 阻止写**。

**射程（待设计轮细化）**：① claims 意图域（`peers/{sessionId}.json` 扩展 · TTL 租约 + 进程死亡即失效 · 认领 / 释放时机）；② 写前 dispatch 钩子（命中他实例活认领 → 软提示升级——**零阻断**）；③ 与足迹面**分存**（D-MI5 面不动）；④ 双端对位（CLI + VSC 同判据）。

**授权**：用户 05:01 直令；全链自动（自缚沿用：评审复出 🔴 / 测试红 / 需新范围 ⇒ 停下上报）。

**边界**：零消息通道 / 零等待 / 零自动合并 / 零写阻断（MULTI-INSTANCE-COLLAB §4 裁定不动）；执行者归属（F-LX1）已交付面零改；台账库键面归 #286 批（在飞——本批零触）。

### 1.2 全链授权（父侧代点火 + 代批准 · 2026-09-25 05:05）

**用户原话**：「自动跑完吧。」⇒ **全链授权**——设计评审点火权 + §4 批准权（代签）+ 修正轮 / 实施轮派发 + 收口核销提交推送（双远端），均委托父侧自动执行，至本批完结。

**父侧自缚（同本仓先例）**：① 代签仅当「评审 pass（0🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 05:05 授权）+ 依据」；③ 复评若再出 🔴 ⇒ 停下回报，不循环自动修；④ 实施验证不过 / 测试红 / 需新范围或用户口径裁决 ⇒ 停下只摆那一条。

### 1.3 设计轮上抛裁定（父侧 · 2026-09-25 05:1x）

1. **需求侧条目 = 已落（父侧笔 · 本回合）**：`docs/core/requirements/MULTI-INSTANCE-COLLAB.md` 新增 **F-MI8 意图认领写入面** · **F-MI9 写前命中与软提示升级** · **N-MI7 认领面成本与降级**（判定句逐字承 §2.7-1）+ 档头计数收正（F-MI1–F-MI9 / N-MI1–N-MI7）+ 变更记录。三链（需求 ↔ 批档 §2.5 ↔ 设计 §4.4）闭合。
2. **⑥ 变体裁定 = 采纳「按本设计推进」**：证据成立（子代理走同一 run 收尾 ⇒ 优先变体无另做空间；认领面补的是**回合内即时性**）——不另做 flush 变体，设计档 §4.4 定位段维持。
3. **发现①（L3 足迹面零测试网）= 登记、不背填**：入册 **#290**（tech_todo · 归批）——本批用例只覆盖新面 + 关键触点；背填 = 另册（集成面为项目资产，不随单次改动扩张）。
4. **发现②（端侧串 vs 档内串漂移）= 登记、不夹带**：入册 **#291**（tech_todo · 归批）——须先裁「哪面为规范」再对齐；本批 §1.1 边界「D-MI5 面零触」维持。
5. **发现③（#23 居第二台账库）= 知悉**：收口以 #286 合并后的号为结算锚（合并迁移在飞）。

**评审**：设计评审代点火（05:05 全链授权）——对象 = 设计档 §4.4 全节 + 批档 §2 + 需求档新行。

### 1.4 派单勘误（父侧 · 2026-09-25 05:2x）

实施轮（#84）任务书内「**既有测试面：端 T2 类『同一引用』断言（`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:161`）随本批有意失效 ⇒ 收正为『coder 子表 = 父表 − 深度排除项』**」一句 = **父侧派单笔误（跨批串文——该句源自 question-tool-filter 批设计轮 §2.7）**，与本批（intent-claims）无关。

**裁定**：本批**不动** T2（该收正归 question-tool-filter 批实施轮）；本批验收②以「端新档 + 既有例零改」为准。**根因**：并行批派单时自兄弟批报告转录条目 ⇒ 教训 = 派单必须**逐条自本批设计档/批档重导**（已入记忆面）。子代理实核后按「不动 + 列报」处置 = 正确（先例：任务书冲突 ⇒ 停下上抛）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成（2026-09-25 · 评审轮 1 修正 9/9 已落盘；实施后收正轮 6/6 落盘（文档面 re-anchor + 口径同步——设计档 §4.2/§4.3/§4.4/§7 + 本档 §2.10））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **F-MI8 意图认领写入面**（需求侧**拟新增条**——建议文本见 §2.7-1）：认领对象 = 与写目标同源的绝对路径；结构化写成功即登记 + 节流落盘；租约 30 min（续约 / 过期 / 进程死亡即失效）；与足迹面**分字段分存**（字段级合并写——互不改写）。
- **F-MI9 写前命中与软提示升级**：写前目标 ∩ 他实例未过期认领 ⇒ 认领级软提示（逐字锚）；**零阻断**（写照发）；每（目标 × 属主）每 run 一次去重；仅足迹命中 ⇒ 既有文案零变。
- **N-MI7 认领面成本与降级**（拟新增）：节流窗内零 IO；单次写调用新增落盘 ≤ 1 次；双端常量等值 / 文案逐字对拍。
- **不在本批**：跨实例消息 / 等待 / 自动合并 / 写阻断（承 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` §4 既有裁定）；F-LX1 执行者面（已交付——零触）；台账库键面（#286 在飞——零触）；足迹软提示面（D-MI5 / D-MI6——零改）。

### 2.2 设计档落点

`docs/core/design/MULTI-INSTANCE-COLLAB.md`——**新增 §4.4 意图认领面（claims · TTL 租约 · P1）**（§4.4.1 存储与字段 / §4.4.2 租约语义 / §4.4.3 认领与落盘时机 / §4.4.4 写前命中与软提示升级 / §4.4.5 成本与降级 / §4.4.6 模块落点与双端对位 / §4.4.7 测试判据）+ §4 标题与档头逐字锚清单同改 + §7 坐标表增「意图认领面」行 + §8 增 D-MI17–D-MI21 + 变更记录一行。实读全文确认：该档**无 P1 缓建节** ⇒ 就地新节（非转正）。
需求档（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md`）= 父侧笔——本批只提条目建议（§2.7-1），**不动笔**。

### 2.3 机制设计（详文 = 设计档 §4.4；此处一行一句）

- **存储**（§4.4.1）：同实例文件 `peers/{sessionId}.json` 扩 `claims` / `claimsUpdatedAt` 两字段；足迹面 `domains` / `updatedAt` 零改；两面**字段级合并写**（各自字段 + 各自时间戳，互不改写）；旧读者忽略新字段 / 旧记录无 `claims` 按缺失降级——双向兼容。
- **认领对象**：与写目标同源（`peerWriteTargets`——`thincoder-core/peer-domains.mjs:71`）；覆盖去冗（方向性判据 `covers`：已有认领覆盖新目标 ⇒ 只续约；新目标更宽 ⇒ 替换被覆盖项；集内无被覆盖项）。
- **租约**（§4.4.2）：`CLAIM_TTL_MS = 30 min`；同域再写续约（`claimedAt` 保持首次）；过期 = 读面过滤 + 落盘剪除（不 unlink）；进程死亡 = 既有 `batchAlive` + 死文件惰性清理（探测失败 / 未知 ⇒ 保守不删——D-MI10 零变）。
- **时机**（§4.4.3）：认领触发 = 结构化写成功（既有钩子——零新手工动作；工程模式里程碑零新增耦合）；落盘 = 新目标即刻（原子写）+ 续约节流 `CLAIM_RENEW_FLUSH_MS = 60 s`；**无显式释放面**；落盘前置「会话 manifest 在场」门（测试卫生，端侧既有 L3 门同法）。
- **命中**（§4.4.4）：钩点与 L3 预检同点（一次聚合扫描供两面）；命中 = 未过期认领 ∩ `pathsOverlap`（同 cwd · self 排除）；认领文案逐字锚 + `who` / `age` / `left` 规则；每（目标 × 属主）每 run 一次去重；认领行抑制同目标足迹行（端侧 = 过滤聚合列表——§4.4.4 逐字形态）；降级零打扰、零阻断。
- **成本**（§4.4.5）：单次写调用新增 IO ≤ 1 次合并写 + 1 次目录 stat；节流窗内零 IO。
- **落点**（§4.4.6）：核拆 `thincoder-core/peer-claims.mjs`（拟新增——peers 路径与 `pathsOverlap` 归口；`peer-domains.mjs` re-export 保 import 面）；端就地扩（越 300 软线即拆同名档）；常量 / 文案双端对拍。

### 2.4 受影响文件与测试面（行数 = as-of 2026-09-25 实读）

| 文件 | 现行 | 预期 |
|---|---|---|
| `thincoder-core/peer-claims.mjs`（拟新增） | 0 | ~160（认领存储 / 租约 / 命中 / 文案 / 合并写 / 节流 / 缝） |
| `thincoder-core/peer-domains.mjs` | 265 | −20（路径与 `pathsOverlap` 归口外移）+45（接线 / 载荷 / 组合）⇒ ≤300 |
| `thincoder-core/agent/dispatch.mjs` | 493 | +3 ⇒ ~496（在册软线档——`thincoder-core/test/core-hygiene.test.mjs:89`；硬限 500 内**余 ~4 行**，实施须控行——**触发：该档下次实质改动先拆分后落笔**） |
| `thincoder-core/test/peer-claims.test.mjs`（拟新增） | 0 | ~190（AC-IC1–AC-IC10） |
| `thincoder-vscode/src/extension/peer-domains.mjs` | 167 | +~110 ⇒ ~277（越 300 软线即拆 `thincoder-vscode/src/extension/peer-claims.mjs`（拟新增）） |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 418 | +~20 ⇒ ~438（>300 软线档；结构机检 ≤500 在册——`thincoder-vscode/test/child-permission.test.mjs:360-366`；**触发：越 500 前或该档下次实质改动先拆分后落笔**） |
| `thincoder-vscode/src/agent/run-stages.mjs` | 420 | +1 ⇒ ~421（run 收尾清去重集） |
| `thincoder-vscode/test/peer-claims.test.mjs`（拟新增） | 0 | ~170（AC-IC11–AC-IC13） |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 282 | **378（本席两轮已落盘——含评审轮 1 修正）** |

测试面四路锚（设计档 §4.4.7）：① 写入 / 续约 / 节流（落盘计数断言·零真实等待）；② 过期 / 死属主 / 崩溃残留 / 旧记录兼容；③ 命中 / 文案逐字 / 去重 / 优先级 / 降级；④ 分存回归 + 既有足迹面行为零变。

### 2.5 验收对照（三链同源：需求档（拟）F-MI8 / F-MI9 / N-MI7 ↔ 本节 ↔ 设计档 §4.4）

| AC | 判据 | 落点 |
|---|---|---|
| AC-IC1 | 结构化写成功 ⇒ 认领落盘含该目标（时钟缝下**等值**：`expiresAt − now === CLAIM_TTL_MS`）——**不等 run 收尾** | 核测试档 T1 |
| AC-IC2 | 同域再写 ⇒ 续约（`expiresAt` 刷新 / `claimedAt` 保持）；节流窗内重复写 ⇒ 零额外落盘（计数断言） | T2 |
| AC-IC3 | 过期 ⇒ 读面零命中 + 落盘剪除（注入时钟·零等待） | T3 |
| AC-IC4 | 属主死 ⇒ 零命中 + 既有惰性清理；探测失败 / 未知 ⇒ 保守不删不命中 | T4 |
| AC-IC5 | 分存：认领落盘不改 `domains` / `updatedAt`；足迹落盘不改 `claims` / `claimsUpdatedAt`；旧记录 ⇒ 零命中零炸 | T5 |
| AC-IC6 | 写前命中未过期认领 ⇒ 结果附认领软提示（逐字：`who` / `age` / `left`）；工具照常执行（零阻断） | T6 |
| AC-IC7 | 去重：同一（目标 × 属主）每 run ≤ 1 行；新属主 ⇒ 新行 | T7 |
| AC-IC8 | 优先级：认领命中 ⇒ 抑制同目标足迹行；仅足迹命中 ⇒ 既有文案逐字零变 | T8 |
| AC-IC9 | 降级：目录缺失 / 探测失败 / 记录损坏 ⇒ 零提示零抛错 | T9 |
| AC-IC10 | 成本：无新目标且续约窗内 ⇒ 零落盘；单次写新增落盘 ≤ 1；目录 stat ≤ 1（缓存命中零扫描——stat 计数断言） | T10 |
| AC-IC11 | 双端对位：`CLAIM_TTL_MS` / `CLAIM_RENEW_FLUSH_MS` 等值 + 认领文案逐字同串（跨端对拍） | 端测试档 TV1 |
| AC-IC12 | 端侧同判据镜像（写入 / 续约 / 过期 / 命中 / 去重 / 降级） | TV2–TV6 |
| AC-IC13 | 端侧混合命中合成：认领命中目标各出认领行（逐字锚）+ 足迹聚合行过滤已覆盖 target（零双报）；过滤后无余项 ⇒ 无足迹行 | TV7 |

### 2.6 关键决策（K-IC* = 设计档 D-MI17–D-MI21 的一行摘要）

| # | 决策 | 否决备选 |
|---|---|---|
| K-IC1 | 同实例文件**分字段**存储（`claims` / `claimsUpdatedAt` vs 足迹 `domains` / `updatedAt`——字段级合并写） | 独立第二文件（扫描 / 死清理各增一套）/ 仅内存（跨进程不可见） |
| K-IC2 | 认领时机 = **写成功即登记**；落盘 = 新目标即刻 + 续约节流 60 s；TTL 30 min | 随足迹 run 收尾 flush（长回合空窗未消）/ 每次写都落盘（无谓 IO） |
| K-IC3 | 释放 = 租约到期 / 进程死亡 / 死清理——**无显式释放面** | 批收口显式释放（非一一对应 + 新动作 + 早释）/ 轮末释放（中段失信号） |
| K-IC4 | 命中反馈 = 认领级软提示 + 每 run 每（目标 × 属主）一次去重；抑制同目标足迹行 | 第二提示通道（难辨 + 噪声翻倍） |
| K-IC5 | 双端语义同源 · 各端自持（核拆档 / 端就地扩）；常量与文案对拍 | 两端同构同拆（端侧余量足够——徒增面） |

### 2.7 上抛项

1. **需求侧建议条目（需求档 = 父侧笔——本席只提文本，不动笔）**：
   - **F-MI8 意图认领写入面**——判定句：结构化写工具成功 ⇒ 本实例登记认领并落盘（新目标即刻；同域再写续约，续约落盘节流 ≥ 60 s）；租约 = 30 min，同域再写刷新 `expiresAt`；过期 / 属主进程死亡 ⇒ 读面零命中（过期条目落盘时剪除）；认领与足迹**分字段**（各自字段级合并写、互不改写；旧记录无 `claims` ⇒ 按缺失降级）。
   - **F-MI9 写前命中与软提示升级**——判定句：结构化写工具执行前，目标 ∩ 他实例**未过期认领** ⇒ 工具结果附认领级软提示（逐字锚；含属主标识与认领时长 / 剩余租约）；**写不被阻止**；同一（目标 × 属主）每 run 至多一行；仅足迹命中 ⇒ 既有文案零变；聚合失败 / 探测失败 / 记录损坏 ⇒ 零提示零抛错。
   - **N-MI7 认领面成本与降级**——判定句：无新目标且续约窗内 ⇒ 零新增 IO；单次写调用新增落盘 ≤ 1（合并写）+ 目录 stat ≤ 1（缓存命中零扫描）；`CLAIM_TTL_MS` / `CLAIM_RENEW_FLUSH_MS` / 认领文案 = 双端等值 / 逐字同串（测试对拍）。
2. **⑥ 触发面证据（不自行换向——摆出由父侧裁）**：长回合足迹空窗**真实存在**（足迹 flush 仅落 run 收尾——`thincoder-core/agent/run-stages.mjs:154`；端更窄 = 仅 depth-0，`thincoder-vscode/src/agent/run-stages.mjs:417-419`）；但「**子代理收尾 flush 足迹**」优先变体**已在机制内**（子代理走同一 run 收尾、同点零缺）⇒ 变体无另做空间，认领面补的是**回合内即时性**（设计档 §4.4 定位段在册）。建议：按本设计推进（与用户 05:01 直令同向）；若父侧另判，须改设计档 §4.4 定位段。
3. **发现①（L3 足迹面零测试网）**：`peer-domains`（D-L3a / D-L3b）**本板块测试面零命中**（`peerCollabNote` / `recordPeerWrites` / `flushPeerDomains` 三标识扫 `**/test/**` 零命中；`T-L3` 同名用例在异批异题——`thincoder-cli/test/provider-error-surface.test.mjs:275`，不属本板块判据）⇒ **本板块 L3 足迹面**无可回归网。本批新增用例覆盖新面 + 关键触点回归（不背填全 L3 面）；是否另批背填 = 父侧裁。
4. **发现②（端侧足迹文案与档不符）**：`thincoder-vscode/src/agent/execute-tools.mjs:34-44` 的足迹软提示用 `[peer conflict notice] …`，设计档 §4.3 逐字契约 = `[peer-collab] …` ⇒ 双端不同串。本批不动（D-MI5 面——§1.1 边界）——父侧裁处置（对齐 / 改档 / 另批）。
5. **发现③（台账行位置）**：本批条目（#23 · P1）在**小写盘符键**的第二台账库（VSC 侧；status = 在途 · executor = 本会话）；默认（大写键）库 #23 为另一条（机制性指令注入位置 · 已核销）。#286（台账库键归一）在飞 ⇒ 键面**零触**（本席仅只读两侧查询）。收口时以 #286 合并后号为结算锚。

### 2.8 机检读数与自检（as-of 2026-09-25 05:1x · 本席实跑）

- `node scripts/doc-check.mjs` ⇒ **悬空 4 / 行宽 8 = 基线（零新增入闸）**；本批新档引用（`thincoder-core/peer-claims.mjs` ×4 行 + 端同名档 ×1 行）携「（拟新增」标记 ⇒ 列报 · 不入闸；本档行宽 >300 字符行 = 0（表格行除外），行数 282 → 366。
- 需求覆盖率自检：F-MI8 / F-MI9 / N-MI7 三条 ⇒ AC-IC1–AC-IC13 逐条落测试档；设计档 §4.4 + §7 + §8（D-MI17–D-MI21）+ 变更记录在档；受影响文件表 9 行全带现行行数与预期；UI / 交互面 = 认领文案（逐字锚）已落，无 open 项。
- 边界自检：零消息 / 零等待 / 零自动合并 / 零写阻断（§4 裁定）✓；F-LX1 面零触 ✓；台账键面零触 ✓；其他档零扩面 ✓（本批只碰设计档 + 本批档）。

### 2.9 评审轮 1 修正块（9 条逐条落地 · 2026-09-25 · eng-designer）

**对象** = 本档 §3「轮次 1」（🔴0 / 🟡6 / 🔵3 = 9 条 · VERDICT pass）；父侧裁定 **9/9 全收**（`Suggestion` 列 = 处置建议，处置执行 = 本席）。改动面 = 设计档 `docs/core/design/MULTI-INSTANCE-COLLAB.md` + 本档 §2（行号 = 落盘后实读）。

| # | 号 → 改动 |
|---|---|
| 1 | 核侧 `_peerNoted` 清空落点**明写**：设计档 `:217`（§4.4.4 去重条）+ `:234`（§4.4.6 核·接线行）——落 **`flushPeerDomains` 首步**（先于「无写入即返回」早退——去重集不随无写回合泄漏；核侧唯一调用点 = `thincoder-core/agent/run-stages.mjs:154`）⇒ 落 flush（§2.4 表内已覆盖行）⇒ **核侧零新增表行** |
| 2 | 设计档 `:219-220`（§4.4.4）补**端侧混合命中合成**——择「**过滤聚合列表**」：认领命中目标各出认领行（逐字锚 · 逐 target）；足迹聚合行剔除已覆盖 target 后照原形态拼接；余项零 ⇒ 该行不出（三态逐字形态在档）。本档 §2.5 增 **AC-IC13**（`:97`）；§2.4 端测试档行同改（`:76` → ~170 · AC-IC11–AC-IC13） |
| 3 | 设计档 `:188-189`（§4.4.1）补**落盘原语 = 原子写**（核 `writeSessionFile`（`thincoder-core/session-slots.mjs:128` · 单源）/ 端 tmp+rename（`:76-78`））+ 两侧目录 mtime 缓存理由（核 `peer-domains.mjs:160-176` / 端 `:90-95` + 头注 `:5-8`——rename 翻目录 mtime）；`:203`（§4.4.3）加原语指针 |
| 4 | 设计档 `:184-186`（§4.4.1）「覆盖去冗」改**方向性 `covers` 三分支** + 不变式「集内无被覆盖项」（续约对象唯一）；`:195`（§4.4.2）续约对象对齐；本档 §2.3（`:58`）一行摘要同源 |
| 5 | 设计档 `:137`（§4.2）记录内容句补认领字段指针（§4.4.1）；`:154`（§4.3）钩子句补**共享钩点**指针（§4.4.4 / §4.4.3） |
| 6 | 设计档 `:167-168` 术语注意**扩到需求档用法**（N-MI3「不认领**槽位**」/ F-MI7「认领路径」= 槽位面；F-MI8 / F-MI9 / N-MI7 = 本面）——需求档半边 = 父侧已落（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:45`），本席零触 |
| 7 | §2.4 两行补档位 / 触发句：`:71` `agent/dispatch.mjs`（在册软线档——`thincoder-core/test/core-hygiene.test.mjs:89`；距 500 余 ~4 行 ⇒ 下次实质改动先拆分后落笔）· `:74` 端 `execute-tools.mjs`（>300 软线；结构机检 ≤500 在册——`thincoder-vscode/test/child-permission.test.mjs:360-366`）。先例 = `docs/batches/2026-09-15-core-defect-fixes.md:130` |
| 8 | §2.5 `:85` AC-IC1 改**时钟缝下等值**断言（`expiresAt − now === CLAIM_TTL_MS`）；`:94` AC-IC10 补「目录 stat ≤ 1（缓存命中零扫描——stat 计数断言）」 |
| 9 | 措辞订正三处：§2.4 `:72`「AC-IC1–IC-IC10」→「AC-IC1–AC-IC10」；§2.7-3 `:116` 扫描结论限定「**本板块** L3 足迹面」（`T-L3` 同名用例在异批异题——`thincoder-cli/test/provider-error-surface.test.mjs:275`）；设计档 `:237`（§4.4.6 常量行）先例指针改引**跨端读取比对形态**（`thincoder-vscode/test/prompts-mirror-anchors.test.mjs:40-44`；常量 / 文案同串面 = AC-IC11） |

**一致性同步**（9 条直接导出 · 无新语义）：§2.4 `:77` 设计档行数 366 → **378**（两轮实读）· §2.8 `:123` 覆盖率条 AC-IC12 → AC-IC13 · 设计档变更记录补 2026-09-25 修正轮一行（`:375-378`）。

**机检复跑**（本席实跑 · `node scripts/doc-check.mjs`）：悬空 **4** = 基线（**零新增**）；行宽本席两档（设计档 + 本档）**零新增**——整体读数 8 → 9，+1 行 = `docs/core/requirements/TOOLS.md:202`（305 字符 · question-tool-filter 批 · **父侧补录**——域外 · 本席零触 · 列报）。

**零扩面确认**：9 条 = 精度 / 明写 / 指针 / 措辞面；实现代码零触 · 需求档零触 · §1 零触 · §3 零触 · 机制语义零扩。

### 2.10 实施后收正块（文档面 re-anchor + 口径同步 · 6/6 落盘 · 2026-09-25 · eng-designer）

**来源** = 实施轮（#84）§5.3「按纪律报告不动项」+ §5.6 上抛 2 → 父侧裁定（设计笔域 ⇒ 派本席 · fix 轮）。改动面 = 设计档 `docs/core/design/MULTI-INSTANCE-COLLAB.md`（:NN = 本轮落盘后实读）+ 本档 §2。**六条先实读复核（实现 + 消费点 + 实态行数）再定稿**——条 → 落点：

| # | 条 | 落点（设计档 file:line） |
|---|---|---|
| ① | §4.2 / §4.3 / §7 行锚随实施位移——逐锚实读重指 | `:138`（`:231`→`:258` · `:248`→`:277`）· `:140`（`:71`→`:79`）· `:145`（`:183`→`:179` · `:194`→`:190`）· `:146`（`:26`→**`:37`**——实读值）· `:149` · `:152` · `:278`（八锚 + 测试缝 `:45/:52`→`:50/:58`） |
| ② | `peerCollabNote` 签名按实现收正 | `:152`：`(cwd, tool, args)` → **`(agent, tool, args)`**（定义 = `thincoder-core/peer-domains.mjs:218`；消费点 = `thincoder-core/agent/dispatch.mjs:359`——两侧实读自证） |
| ③ | `pathsOverlap` 归口同步 | `:149` · `:185` · `:278`——指针改指 `thincoder-core/peer-claims.mjs:74`（`thincoder-core/peer-domains.mjs:34` re-export 保名面） |
| ④ | 两档「（拟新增）」标记去除 | `:235` · `:238` · `:243` · `:279` · `:308`（核 / 端 `peer-claims.mjs` 与两测试档均已落盘） |
| ⑤ | 批档 §2.4 行数预期 vs 实态 | 见下同步表（§2 表体 append-only ⇒ 实态随本块登记） |
| ⑥ | 分隔符口径明写 | `:161` + `:218`（新增句：**分隔符不属逐字锚**——端块内 `\n\n`（`thincoder-vscode/src/extension/peer-domains.mjs:259`）vs 核 `\n`（`thincoder-core/peer-domains.mjs:250`）） |

**§2.4 行数同步（预期 → 实态 · 口径 = `split("\n").length − 1`）**：

| 文件 | §2.4 预期 | 实态（本轮实读） |
|---|---|---|
| `thincoder-core/peer-claims.mjs`（新） | ~160 | **263** |
| `thincoder-core/peer-domains.mjs` | ≤300（−20/+45） | **298** |
| `thincoder-core/agent/dispatch.mjs` | ~496 | **496**（红线内） |
| `thincoder-core/test/peer-claims.test.mjs`（新） | ~190 | **271** |
| `thincoder-vscode/src/extension/peer-domains.mjs` | ~277（越线即拆） | **263**（外提落实 ⇒ 端 `peer-claims.mjs` **231**） |
| `thincoder-vscode/src/agent/execute-tools.mjs` | ~438 | **417** |
| `thincoder-vscode/src/agent/run-stages.mjs` | ~421 | **421** |
| `thincoder-vscode/test/peer-claims.test.mjs`（新） | ~170 | **240** |
| `thincoder-vscode/test/files.mjs`（表外——登记面） | — | **137**（+1 = 新端档入册 · §5.1 表外披露项） |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 378 | **385**（本轮 re-anchor 后实读） |

**§2.5 同轮核对**：AC-IC1–AC-IC13 判据行零改（本轮 = 锚 / 口径 / 实态面，不触 AC 面）；三链同源（需求档 F-MI8 / F-MI9 / N-MI7 ↔ §2.5 ↔ 设计档 §4.4）维持。

**同族锚扩面（条 ① 同类 · 逐锚实读——随本轮一并收正）**：设计档 `:171`（端 run-stages `:417-419`→`:418-419`）· `:184`（`:71`→`:79`）· `:185`（归口句）· `:189`（端原语 `peer-domains.mjs:76-78`→`peer-claims.mjs:89-94`）· `:190`（缓存坐标 `:160-176`→`:156-172`；端 `:90-95`→`:90-111` + 头注 `:5-8`→`:8-9`）· `:191`（`:108 起`→`:111-118`）· `:192`（端缝 `:34-35`→`:36-37`）· `:203`（`:420-422`→`:421-423` · `:259-262`→`:253-261`）· `:206`（`:200`→`:189`）· `:210`（端预检 `:198-203`→`:187-195`）· `:221`（端聚合行落点 `execute-tools.mjs:34-44`→`extension/peer-domains.mjs:211-221`）· `:237`（493→**496**）· `:279`（端落点补 `peer-claims.mjs` 外提档）。**零新语义**。

**机检复跑（本席实跑 · `node scripts/doc-check.mjs`）读数四拍**：① 轮初 = 悬空 **4** / 行宽 **8**（基线）；② 六条 + 同族锚落盘后 = 悬空 **5**（+1 = 本档 `:382` 缩略路径 `extension/peer-domains.mjs` 解析悬空）/ 行宽 8；③ 改全路径后 = 悬空 4 / 行宽 **9**（+1 = 本档 `:382` 303 字符超宽）；④ 当场折行后 = 悬空 **4** / 行宽 **8** = 基线。**本席两档最终零新增**——8 行宽全部落在并行批面（`BATCH-RECORD.md` ×2 + `MODEL-BENCH.md` ×6——域外）；设计档「拟新增」标记去除后，对应引用转入常规路径面（文件在盘——零悬空）。②/③ 两处 = 本档自造形态缺陷，均**当场即改**（非放行）。

**零扩面确认**：六条 + 同族锚 = 锚 / 口径 / 实态同步面；零代码 · 零新语义 · §1 / §3 / §5 零触 · 需求档零触 · 并行批面（`MODEL-BENCH.md` / `PROMPT-SYSTEM.md` / `BATCH-RECORD.md`）零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

对象 = 设计档 §4.4（§4.4.1–§4.4.7 + D-MI17–D-MI21）+ 批档 §2（受影响表 / AC-IC1–12 / 测试面）+ 需求档 F-MI8/F-MI9/N-MI7 新行。实读核对（设计档 §4.4 全文 + 批档 §2 全文 + 需求档新行 + 落点源码抽检）：9 行受影响表行数抽检相符（`peer-domains.mjs` 265 ✓ / 端 `extension/peer-domains.mjs` 167 ✓ / `agent/dispatch.mjs` 493（`wc -l` 口径 ✓，且已在 `core-hygiene.test.mjs:89` SOFT_LINE_REGISTRY 在册）/ 端 `execute-tools.mjs` 418 ✓ / 端 `run-stages.mjs` 420 ✓ / 三处拟新增档全仓零命中 ✓ / 设计档 .md 免档位）；两处钩点坐标（`dispatch.mjs:358-359` · `:420-422`；端 `execute-tools.mjs:198-203` · `:259-262` · `:200`）与 §4.4.2 的 `process-probe.mjs:118`（batchAlive 定义）、`:48` 注入缝均实核相符；三条新需求 ↔ §4.4 ↔ AC-IC1–IC12 三链同源 ✓；边界（零消息 / 零等待 / 零自动合并 / 零写阻断；F-LX1 面与台账键面零触）✓。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations | 🟡 | 核侧 `agent._peerNoted` 的「每 run 一行」清空点无落点：设计档 `:211` 要求「run 收尾清空」，而批档受影响表只列端侧 `thincoder-vscode/src/agent/run-stages.mjs`（`docs/batches/2026-09-25-intent-claims.md:75`），核侧无对应行。核侧最近的可清点在 `thincoder-core/agent/run-stages.mjs:150-154`（`finalizeAgentTurn` 首行调 `flushPeerDomains`），但设计未指明清空写在 `flushPeerDomains`（已在表内 = `peer-domains.mjs:70` 行）还是调用点（表外档）——若落调用点则受影响表缺一行 | 在设计档 §4.4.4 或 §4.4.6 明写核侧清空落点；若落调用点，批档受影响表补 `thincoder-core/agent/run-stages.mjs` 行（现行行数 + 增量） |
| 2 | Clarity | 🟡 | 端侧「混合命中」（同批既有认领命中、又有仅足迹命中）的合成形态未定：核侧文案逐 target 一行（`thincoder-core/peer-domains.mjs:214-227`），端侧足迹文案是**单条聚合行**（`thincoder-vscode/src/agent/execute-tools.mjs:34-44`）；设计档 `:212` 的「抑制同目标足迹行」+「既有文案零变」在端侧混合命中下不能同时逐字成立 | 在设计档 §4.4.4 补端侧合成规则（按 target 拆行 / 过滤聚合列表），并在批档 §2.5 增一条混合命中 AC |
| 3 | Feasibility | 🟡 | 认领落盘的**写机制**未定：设计档 `:183` / `:197` 只写「字段级合并写 / 即刻整写」，未写原子 `tmp+rename`；而两侧聚合缓存都以 peers 目录 mtime 为键（核 `peer-domains.mjs:160-176`；端 `extension/peer-domains.mjs:90-95` + 头注 `:5-8` 明写「rename 翻目录 mtime → 目录 mtime 惰性缓存生效」）⇒ 若就地写，对端缓存不失效、回合内认领对本端不可见（= 本层立项动因「回合内即时性」落空） | 明写认领落盘与足迹同法（核经 `writeSessionFile`——`thincoder-core/session-slots.mjs:128` 即 tmp+rename；端 tmp+rename），或在 §4.4.1 / §4.4.6 指名同一写入原语 |
| 4 | Clarity | 🟡 | 「覆盖去冗」判据与所述语义不符：设计档 `:182` 以 `pathsOverlap` 作「包含判据」，但该谓词是**对称**包含（`thincoder-core/peer-domains.mjs:92-103`：`prefix(pa,pb) \|\| prefix(pb,pa)`）⇒ 已有更**窄**认领（文件级）会压掉更**宽**新目标（目录级）的登记，与同句「认领集以最粗覆盖者为准」相抵；多个覆盖者并存时「续约哪一个」亦未定 | 改用方向性判据（已有认领 ⊇ 新目标 ⇒ 只续约；新目标更宽 ⇒ 替换被覆盖项），或明写多覆盖者的续约规则 |
| 5 | Document ownership（doc-state） | 🟡 | 同档 §4.2 / §4.3 未随本批补指针：记录内容枚举仍为 6 字段（设计档 `:137`）无 `claims` / `claimsUpdatedAt`；§4.3 钩子描述（`:152-159`）仍只述足迹面。**非机制级矛盾**（两面已在 §4.4.1 `:173-184` / §4.4.4 `:203` 明确分开、足迹面声明零改）——属枚举不完整 | §4.2「内容」句与 §4.3 钩子句各补一处指针（认领面字段 / 行为见 §4.4.x） |
| 6 | Document ownership（术语） | 🟡 | 需求档 N-MI3（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:45`）仍写「感知面纯只读（**不认领**…）」，而本批新增 F-MI8（`:36`）以「认领」名新面、N-MI7（`:49`）用裸词「认领面」；设计档 `:166` 术语注意只对 `SESSION.md` §6.2 槽位认领划线，未覆盖需求档自身用法（F-MI7 `:35`「认领路径」= 槽位面） | N-MI3 括注限定为「不认领（槽位面）」，或把设计档 `:166` 的术语注意扩到需求档用法（需求档笔归父侧） |
| 7 | Affected-file size annotations | 🔵 | 近硬限档无档位/触发句：`thincoder-core/agent/dispatch.mjs` 493 → ~496（距 500 硬限余 ~4 行）仅批档 `:71` 一句「实施须控行」，无拆分计划 / 触发条件；同行 `thincoder-vscode/src/agent/execute-tools.mjs` 418 → ~438（>300）亦无档位注。已核：两档在册（`thincoder-core/test/core-hygiene.test.mjs:89` registery 含 `agent/dispatch.mjs`）、本批未越 500 ⇒ 存量债不升格（R3） | 两行各补一句档位 / 触发（先例 = `docs/batches/2026-09-15-core-defect-fixes.md:130`「距硬限余 3 行 ⇒ 下次实质改动先拆分后落笔」） |
| 8 | Acceptance criteria | 🔵 | 判据精度两处：AC-IC1（批档 `:85`）用 `expiresAt − now ≈ CLAIM_TTL_MS`（有时钟缝时可精确等值）；AC-IC10（`:94`）未覆盖 N-MI7（需求档 `:49`）的「目录 stat ≤ 1 / 缓存命中零扫描」 | 时钟缝下改等值断言；AC-IC10 补 stat / 扫描计数断言 |
| 9 | Doc hygiene / citation | 🔵 | 三处精度小项：① 批档 `:72` 用例范围写「AC-IC1–**IC-IC10**」（应为 AC-IC1–AC-IC10）；② 批档 `:115` 扫面括注「`T-L3*` 零命中」不精确（`thincoder-cli/test/provider-error-surface.test.mjs:275` 有同名 `T-L3` 用例——异批异题，结论「L3 足迹面无可回归网」不变）；③ 设计档 `:229` 先例指针 `thincoder-core/test/ledger-executor.test.mjs:253` 实为**单仓常量锁值**断言，非跨端副本对拍形态 | 逐处订正措辞（①改 AC-IC1–AC-IC10；②括注限定「本板块 L3 足迹面」；③改引跨端对拍形态或注明 AC-IC11 为新形态） |

计数：🔴 0 · 🟡 6 · 🔵 3（合计 9）。VERDICT: pass

纪律声明：无 `## Project Standards` 档、无 Document Map（降级——档位/归属按 Project Guide + 三份 scope 档自述判定）；域外面注（不计严重度）：设计档 §3.1 `:54` 的 `batchAlive` 坐标 `process-probe.mjs:59` 为陈旧值（实为 `:118`，本批 §4.4.2 `:191` 引值正确）——§3.1 不在本轮目标内，登记不处置；批档 §2.7-4 端侧足迹文案漂移（`[peer conflict notice]` vs 档 §4.3 `[peer-collab]`）经实核为真、本批零触边界成立。

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 05:2x）

**依据**：用户 05:05「自动跑完吧」全链授权（§1.2）；评审 #81 = **pass**（🔴0 · 🟡6 · 🔵3 = 9 条）；修正轮 #82 = **9/9 落地**（父侧核验：设计档 §4.4.1–§4.4.4 实读——方向性 `covers` 三分支 + 不变式 · 原子写原语 + 缓存理由 · `_peerNoted` 清空落点 = `flushPeerDomains` 首步 · 端侧混合命中定形；批档 §2.4–§2.5 同步——等值断言 / stat 计数断言 / 两档位触发句 / AC-IC13；机检 = 悬空 4 基线 · 零新增）。

**随批准裁定**：设计轮 4 条上抛已在 §1.3 落定（⑥ 采纳按本设计推进 · L3 测试网与端差串 → #290 / #291 · 台账锚 = #286 合并后号）。

**需求面**：F-MI8 / F-MI9 / N-MI7 已落（05:1x · 父侧笔）；N-MI3 限定句已收正。

**批准**：射程 ①–⑥ **批准实施**。

**实施**：eng-coder（initial · token 消费）· files = §2.4 表八档（core 四 + vsc 四；设计档行不入 files）· 红线：`agent/dispatch.mjs` 493 → ~496（+3 控行 · 硬限 500）· `execute-tools.mjs` +~20（>300 软线）· 端 `extension/peer-domains.mjs` 越 300 即拆 · 测试四路锚 · **既有足迹面（D-MI5）行为零变**。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-25 · initial 轮 · 自修 1 + 内部审计 1 + 独立代码评审 1（pass · 0🔴））



### 5.1 交付摘要（eng-coder · initial 轮 · 2026-09-25）

**射程**：设计档 §4.4.1–§4.4.7（D-MI17–D-MI21）+ 本档 §2.5 AC-IC1–AC-IC13 逐条落地；双端（核 + VSC）语义同源、各端自持。

**落点（9 档 = §2.4 表八档 + 表外 1 档登记面）**：

| 档 | 实态（行） | 内容 |
|---|---|---|
| `thincoder-core/peer-claims.mjs`（新） | 263 | 认领存储 / 租约（TTL + 续约三分支）/ 字段级合并写 / 节流 / 命中判据 / 文案（who / age / left）/ 去重集 / peers 路径与路径谓词汇口 / 两缝（peersDir + 时钟） |
| `thincoder-core/peer-domains.mjs` | 298 | 接线：`peerCollabNote(agent, …)` 组合认领行（认领命中 ⇒ 抑制同目标足迹行）/ `recordPeerWrites` 调认领登记 / `flushPeerDomains` 首步清去重集 + 字段级合并写 / 聚合载荷增 `claims` / re-export 路径与谓词 |
| `thincoder-core/agent/dispatch.mjs` | 496（≤496 红线） | 写前预检调用点换参（agent）+ 提示真正附加时落去重键（+3 行内） |
| `thincoder-core/test/peer-claims.test.mjs`（新） | 271 | T1–T10（AC-IC1–AC-IC10） |
| `thincoder-vscode/src/extension/peer-claims.mjs`（新，越 300 软线按 §4.4.6 外提） | 231 | 端侧认领复本（常量 / 登记 / 落盘 / 命中判据 / 文案 / 去重集 / 目录缝 / 时钟缝） |
| `thincoder-vscode/src/extension/peer-domains.mjs` | 263 | 聚合（载荷增 `claims`）+ `peerDomains(cwd)` 一次聚合快照供两查（`conflicts` / `claimConflicts`）+ `peerNotes` 合成（认领行逐 target + 足迹聚合行过滤已覆盖 target） |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 417 | 钩点：预检查认领命中（同一聚合）+ 成功后认领登记 / 提示合成 / 去重落键 |
| `thincoder-vscode/src/agent/run-stages.mjs` | 421 | depth-0 收尾首步清去重集 |
| `thincoder-vscode/test/peer-claims.test.mjs`（新） | 240 | TV1–TV8（AC-IC11–AC-IC13 + 钩点端到端） |
| `thincoder-vscode/test/files.mjs`（**表外改动**——登记面） | 137 | 新测试档入册（VSC runner 清单 fail-closed：未登记档永不执行） |

### 5.2 决策透明表（设计未定 / 多解处的落定 —— 逐条可核）

| # | 项 | 设计口径 | 本席处置 | 理由 |
|---|---|---|---|---|
| 1 | 去重标记时点 | §4.4.4 只定 `agent._peerNoted` Set + 清空落点 | 预检只算提示与键，**标记落在提示真正附加的成功路径**（核 dispatch 两路 / 端 execute-tools 成功块） | 写失败路径不得消耗「每 run 一行」额度（写照发失败仍应提示）；核 +2 行（496 红线内） |
| 2 | multi-owner 的 `age` / `left` 取样 | §4.4.4 只给单认领公式 | 同目标多属主时**代表 = 集内最早认领**（`claimedAt` 最小者），`age` / `left` 同取该条 | 确定性 + 单次提示锚定最早意图；双端同式 |
| 3 | 端侧命中范围 | §4.4.4「同 cwd · self 排除」 | 端 `claimConflicts` 加同 cwd 判据（核 `normalizeCwd` 同款）；端**足迹面**保持既有 cwd 无关形态 | 认领面新落点按设计判据；足迹面 = D-MI5 零触，不夹带 |
| 4 | 端两查的 stat 次数 | §4.4.5「目录 stat 一次（缓存命中零扫描）」 | `peerDomains(cwd)` 返回**一次聚合快照**（`conflicts` / `claimConflicts` 共用；惰性取一次） | 消审计项 1（原两次 `aggregate()` ⇒ stat×2）；同时满足 §4.4.4「一次聚合扫描供两面」 |
| 5 | 端去重键 | §4.4.4「（目标 × 认领属主）」 | 端抽 `claimNoteKey(target, owner)` 单源（与核同形），`\|\|`（非 `??`）兜底 | 端聚合允许空串 `sessionId`；空串与缺值共键会误判「已提示」（审计/评审项） |
| 6 | 端足迹文案函数落点 | §4.4.6「端就地扩」 | `peerConflictNote` 自 `execute-tools.mjs` 迁 `peer-domains.mjs` | 认领行与足迹聚合行须同点合成（过滤后拼接）；文案逐字零变 |
| 7 | 核 stat 计数缝 | §4.4.7 缝清单未列 stat 槽 | `_setPeerDomainsTestImpl` 增可选 `statFn` 槽（既有缝扩槽，非新缝） | AC-IC10 要求「stat 计数断言」——无计数面则该判据不可机判 |
| 8 | 核聚合缓存键 | 未提 | 缓存键增目录路径（`{dir, mtimeMs, peers}`） | 测试沙箱换目录天然失效 ⇒ `_setPeersDirForTest` 自足（免跨模块清缓存耦合） |
| 9 | 核时钟缝共享 | §4.4.7「时钟缝 `_setPeerClaimsTestImpl({ nowFn })`」 | 命中判据与落盘**同一时钟**（`claimsNow()`）；足迹面 hot 窗口仍 `Date.now()` | 认领面两侧确定一致；足迹面 D-MI5 语义零变 |
| 10 | 端 300 软线 | §4.4.6「越 300 即拆」 | 端档达 423 行 ⇒ 认领块外提 `src/extension/peer-claims.mjs`（端 peer-domains 回落 263） | 按预裁路径执行；re-export 保既有名面（execute-tools / run-stages 零改 import 目标） |

### 5.3 审计 / 代码评审轮次与终态

**内部差异审计（read-only explore · 1 轮）**：判定 = 0 漏实现 · 0 静默简化 · 0 越界改动；5 条低危分歧 → **自修 3 条**（① 端两查 stat×2 ⇒ 一次聚合快照；② 端认领面补同 cwd 判据；③ TV7「过滤后余项零」分支直构）+ 1 条口径澄清（dispatch 行数：同口径 `split("\n").length-1` 基线 493 → 现 496 = 恰 +3，审计的 497 系尾空行计数差）+ 1 条记录面提示（§5 = 本段）。

**独立代码评审（advisor · code · 1 轮）**：**VERDICT pass（🔴 0 · 🟡 2 · 🔵 6）**；自修 3 条：
- 核 `peer-domains.mjs` 由恰 300 行压至 **298**（软线内留余量——避免下批 +1 行触发未登记红）；
- 去重键单源（双方 `claimNoteKey`，`\|\|` 兜底空串）；
- 端补**钩点端到端用例 TV8**（真 `executeToolBatches`：写成功 ⇒ 结果末附认领行 + 落键 + 认领落盘；`Error` 结果 ⇒ 零附加零落键）——对齐核 T6 真 dispatch 对照。

**按纪律报告不动的评审项**：文档面 re-anchor（设计档 §4.2/§4.3/§7 行锚、`peerCollabNote` 签名由 `(cwd, …)` 改 `(agent, …)`、`pathsOverlap` 已迁 `peer-claims.mjs`、两档「（拟新增）」标记过期；批档 §2.4 端 execute-tools 预期 ~438 vs 实态 417 / 核新档预期 ~160 vs 实态 263）= **设计/父侧收口笔**；`execute-tools` 417 / `run-stages` 421 >300 软线 = 在册存量债（≤500 机检达标，批档 §2.4 已带触发句）；端 `writeRecordAtomic` 末级兜底弱于核 `writeSessionFile` = **既有搬移代码**（D-MI5 零触面，本批不改）；端块内多行分隔符 `\n\n` vs 核 `\n`（单行文案逐字锚不受影响）= 登记。

### 5.4 verify 读数（实跑）

- `cd thincoder-core && npm test` ⇒ **621 / 621 通过**（含新档 10 例）
- `cd thincoder-vscode && npm test` ⇒ **961 / 961 通过**（含新档 8 例；既有 953 例零改/零红）
- `cd thincoder-cli && npm test` ⇒ **820 / 820 通过**（零改面零回归）
- 行数红线：核心新档 263 · 核 peer-domains 298 · `agent/dispatch.mjs` **496（≤496 红线）** · 端新档 231 · 端 peer-domains 263 · execute-tools 417 · run-stages 421 · 两端测试档 271 / 240 —— **全仓无 >500**
- `node scripts/doc-check.mjs` ⇒ 轮初 **悬空 4 / 行宽 8**；轮末 **悬空 16 / 行宽 13**——**新增项全部落在 `docs/core/design/MODEL-BENCH.md` 与 `BATCH-RECORD.md`（并行批的文档改动，非本批触碰面）**；本批触碰面（代码 + 本档）零新增（新档引用 `peer-claims.mjs` 两处仍在「拟新增 · 列报 · 不入闸」类，机检不升格）

### 5.5 AC → 用例对照（AC-IC1–AC-IC13 逐条有测）

| AC | 核用例 | 端用例 |
|---|---|---|
| IC1 写成功即落盘（时钟缝等值） | T1 | TV2 |
| IC2 续约 / 节流 | T2 | TV3 |
| IC3 过期：读面零命中 + 落盘剪除 | T3 | TV4 |
| IC4 属主死 / 探测失败 | T4 | TV6 |
| IC5 分存（字段级合并写 · 旧记录兼容） | T5 | TV5（同 cwd 判据同用例） |
| IC6 命中逐字 + 零阻断 | T6（含真 dispatch） | TV5 + TV8（真 executeToolBatches） |
| IC7 去重（每（目标 × 属主）每 run 一行 / 新属主新行） | T7 | TV5 |
| IC8 优先级（认领抑制足迹 / 仅足迹零变） | T8 | TV7 |
| IC9 降级（目录缺失 / 探测失败 / 记录损坏） | T9 | TV5 + TV6 |
| IC10 成本（零落盘 / ≤1 / 目录 stat ≤1 且缓存命中零扫描） | T10（statFn 计数） | TV3（节流零落盘面） |
| IC11 双端对位（两常量等值 + 文案逐字同串） | — | TV1（跨端 import 核档对拍） |
| IC12 端侧同判据镜像 | — | TV2–TV6 + TV8 |
| IC13 端侧混合命中合成 | — | TV7 |

### 5.6 上抛 / 待父侧处置

1. **T2 收正 = 非本批射程**（派单勘误，父侧已落 §1.4）：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs` 本批零触；收正归 question-tool-filter 批实施轮。
2. **文档面 re-anchor**（§5.3 所列）= 设计/父侧收口笔（行锚 / 签名 / 「拟新增」标记 / 行数预期）。
3. 端原子写末级兜底与核原语不对称（既有代码 · 登记）；端块内多行分隔符端差（登记）。
4. **机检读数归因**（§5.4）：轮末 悬空 16 / 行宽 13 全部来自并行批的 `MODEL-BENCH.md` 改动，本批零新增——收口判读时勿计入本批。

## §6 验证与收口（父代理）

### 6.1 交付与验收（父侧 · 2026-09-25 06:0x）

**交付面**（实施 #84 + 文档收正 #93 两轮）：

| 面 | 文件（实态行数） |
|---|---|
| 核侧 | `peer-claims.mjs`（新 263）· `peer-domains.mjs` 298 · `agent/dispatch.mjs` 496 · `test/peer-claims.test.mjs`（新 271） |
| 端侧 | `src/extension/peer-claims.mjs`（新 231）· `src/extension/peer-domains.mjs` 263 · `src/agent/execute-tools.mjs` 417 · `src/agent/run-stages.mjs` 421 · `test/peer-claims.test.mjs`（新 240）· `test/files.mjs` 137（表外披露——新端档入册，VSC runner fail-closed 必需） |
| 文档 | 设计档 `MULTI-INSTANCE-COLLAB.md` 385（§4.4 + 锚 / 口径收正）· 需求档 F-MI8 / F-MI9 / N-MI7 + 变更记录（父侧笔）· 本档 §2.10 |

**父侧独立验证（as-of 05:56）**：三包复跑 **core 621/621 · vsc 961/961 · cli 820/820**（零 fail · 与交付声称逐数相符）；关键落点抽读（认领存储头注逐条对位 · 核 `peer-domains.mjs:231/242` 去重键 · 端 `execute-tools.mjs:256` 合成钩点 · 端原子写 / 去重集 / 对拍键）；AC-IC1–IC13 逐例有测（对照表 §5）；行数红线全达（dispatch 496 ≤ 496 · 新档 ≤ 300 · 全仓无 >500）。

**文档收正轮**：#93 六条 + 同族锚逐锚实读重指（父侧抽验 `:146` 锚 `:37`（实读修正父侧例值）· `:149` · `:152` · `:161` · `:218` ✓）· 机检回基线（悬空 4 / 行宽 8）。

**上抛处置**：#84 四项（① 文档 re-anchor → #93 ✓ ② 端原子写兜底弱于核 → 入册 #296 ✓ ③ 分隔符口径 → 设计档 §4.3/§4.4.3 明写 ✓ ④ 机检归因 → 确认 = 并行批在飞）· #93 两项（`batchAlive` 陈旧坐标 登记不处置 · §7 表头 as-of 沿先例不动）。

**D7 结算清单**：角色表（§1/§4 主 agent · §2 designer · §3 评审 · §5 coder · §6 父侧）齐 ✓ · 本 §6 状态行 ✅ · 计数（AC-IC1–IC13 · 行数表 10 行）✓ · 三链指针（需求档 ↔ 本档 ↔ 设计档 §4.4）闭 ✓ · 变更记录（设计档 + 需求档）✓ · 台账 **#319** 在途 → 待核销 → 已核销（**结算锚 = 合并后号 #319**——原第二库 #23 → 主库，迁移 idMap `23→319`，2026-09-25 06:04 合并）· 前批遗留交叉核：前情 `2026-09-21-ledger-executor.md`（已收口 09-21）P1 = 本批本体 ⇒ 无遗留 ✓ · 台账可见面 = #319 evidence（提交 id 回填）。

**提交**：本回合 path-limited 提交 + 双推（origin + github）。

**状态行**：✅ 已收口（2026-09-25）
