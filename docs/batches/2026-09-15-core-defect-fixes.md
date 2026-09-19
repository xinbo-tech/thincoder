# 核心与 CLI 缺陷修复（CORE-DEFECT-FIXES）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「那先把那5批和零成本的处理掉吧」（2026-09-15 21:36）+ 父侧台账分类轮（同日 21:33）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮待发**（2026-09-15——§1 已落；§2 待 eng-designer；设计评审未发起）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 需求池两条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> 台账行号 = **as-of 2026-09-15**（批次档落笔时点；此后台账增删会使其漂移，指针以条目名称为准）。
> 上游：台账 `docs/TODO.md` · 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2——本档不重述）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 2026-09-15**——父侧完成台账分类（31 条未决 → 5 批 + 1 零成本项），
用户 21:36「可以」同批批准三点：① 5 批划分 + 推进方式 ② 台账 S3b 条判「已废弃」并归档 ③ 顺序 = 不排序、5 批并行（分 2 波）。
本档 = **批 1**（核与 CLI 缺陷修复面）的 §1；§2 由 eng-designer 追加。

### 用户裁定与澄清（2026-09-15）

| 时点 | 内容 |
|---|---|
| 21:33 | 父侧台账分类轮——用户「你把这些分分类，看看有哪些容易做的，先分几批出来做掉」 |
| 21:36 | 用户「可以」= 三点同批批准：① 5 批划分 + 推进方式 ② 台账 S3b 条判「已废弃」并归档 ③ 顺序 = 不排序、5 批并行（分 2 波） |

### 批次条目（本批 = 台账两条；需求点原文与证据以台账为准——本档不重述）

| # | 台账条目 | 症状 / 根因（台账所载） | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md:27`（2026-09-13 用户发现并要求挂账）peer_instances 假阳性：只按 pid 判活、不验进程身份 | 记录里的 pid 被复用后仍报「另有活动实例」；活判定只用 pid 存在性（`thincoder-core/peer-instances.mjs:185-191`）——`probeCmdlines` 能拿命令行却只用于 `end` 分类 | 活判定加**身份校验**（命令行含本产品 / cwd 匹配）+ 陈旧记录清理 + 用例（注入缝已具备） |
| 2 | `docs/TODO.md:29`（2026-09-13 CORE-UNIFICATION R5 轮报出）疑似代码缺陷两处（半核：坐标已复核，故障面未复现） | ① `thincoder-cli/src/acp/bridge.mjs:184` 事件剥离白名单**不含 `queued` / `cancelled`** ⇒ 若确有发射点将随 ACP 泄漏给客户端 ② 同档 `:196` `onWait` 仅做日志、无相位分支 ⇒ 报出的「`phase:"warn"/"quota"` 渲染成 `retry in undefineds`」应在另一消费端 | 实跑复现 + 修 + 用例 |

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **半核状态**：条目 2 的台账原文自标「坐标已复核，故障面未复现」⇒ 设计要求**先复现、再定修法**；实跑复现不出 ⇒ **停下上报**（不猜修、不静默降级为「改注释」）。
2. **条目 2 两处疑非同源**（一为白名单缺口、一为相位分支缺失）——是否同案处理由设计轮裁决。
3. **条目 1 的注入缝已在位**（测试缝 `_testImpl.aliveFn` / `_testImpl.cmdlineFn`）⇒ 用例可写，无须新造缝。
4. **分工口径**（改到哪模块 ⇒ 同步修该模块权威档）= 承 `docs/batches/2026-09-15-vsc-core-wiring.md` §1（三层分工）——本档不重述。

### 批次边界（明确不做）

1. 不开台账两条以外的新面；勘察若发现同族第三处缺陷 ⇒ **停下上报**（父侧另批），不自行扩批。
2. 不改台账 / 不改本档 §1。

---

### 父侧裁定（2026-09-16 · 前向引用悬空锚 = 非缺陷）

用户 2026-09-16 04:28 裁定「按建议」：本批设计档引用**实施轮才会创建的档**（`thincoder-core/process-probe.mjs` · `thincoder-core/test/peer-instances.test.mjs` · `thincoder-core/provider/wait-status.mjs`）产生权威域悬空锚 **10 条中的 5 条** ⇒ **不当作缺陷**——前向引用，实施轮落档后自然消失。
> **验收口径收正**：本批三机检判据 = **零新增（非前向引用类）**；父侧原写「根域悬空 0」有误（实测权威域存量 10），属父侧判据句 bug。机制缺口（锚引擎缺「拟新增」豁免族）已登记台账技术待办。
>
> **as-of 注（2026-09-16 · 收口轮后）**：上句「10 条中的 5 条」为修正轮前读数；修正轮与收口轮后权威域悬空 = **12 条**（本批新增 2 条同族前向引用，逐条见批档 §3 轮次 2）。另：§3 轮次 2 的超宽行（`:213`，608 字符）由父侧**机械折行**（仅插换行、零语义）——例外② 打标。

### 父侧裁定（2026-09-16 · 评审修正轮 · §3 第 1 条 🔴）

`docs/core/design/SESSION.md` 纳入本批**文档面第 4 档**（本批改写 `thincoder-core/session-slots.mjs` 的死主判定语义 ⇒ 须同步该模块权威档）：§6.2 死主条目清理 + D-SE3 各补句、判据单源指向 `thincoder-core/process-probe.mjs` 的 `filterDeadOwners`——修正轮已落（`:91-92` / `:299`），§2 文档修订清单已补行（`:65`）。

**记录（2026-09-16 · 评审 #1 轮次 3 的两条 🟡 处置——父侧裁定）**

- **🟡 #1 同源第三处死主清理未纳面**（`thincoder-core/session.mjs:375-386` `newSession` 内联同机制清理）⇒ 按 §1 边界 1 / §2 停止条件 1 办事：**同族第三处 —— 记一行、停下上报、不扩本批范围**（已如实上报）；归后续批次处置（触发=条件：该面下次被触碰时）。
- **🟡 #2 `filterDeadOwners` 签名与批量探测要求不一致** ⇒ **已当场收正（派单补充已发 #6）**：签名须携带批量命令行（`{ alive, cmdline }` 或等价的批量 Map 传入形态），**不得**每 pid 自探测（与 `D-MI3` / 需求 `N-MI3` 一致）。

## §2 批次任务（eng-designer）

**本批任务书（批 1 CORE-DEFECT-FIXES · eng-designer · 2026-09-16）**

> 任务书 = 本段 + 设计档**四处**修订（`docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1/§8 · `docs/cli/design/ACP-CLIENT.md` §5/§7.2 · `docs/core/design/PROVIDER.md` §6.6/§6.20 · `docs/core/design/SESSION.md` §6.2/§7——评审 #1 纳面）。
> 实现者（eng-coder）只改 §四 列出的源码 / 测试档；需求档与设计档归 eng-designer（本批已落）；批次档 §5 由实现者自写。

### 一、本批条目（三方同源：本表 = 需求档条目 = 设计档验收回指条目）

| 条目 | 需求档条目 | 一句话 | 修法形态 |
|---|---|---|---|
| **B1** | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` **F-MI6** / **N-MI6** | `peer_instances` 假阳性：活判定只认 pid 存在性——pid 复用即误报「另有活动实例」；陈旧记录永不清理 | 活判定加**身份校验**（命令行命中本产品标记）+ 身份不符的陈旧记录**保守清理** |
| **B2** | `docs/cli/requirements/ACP-CLIENT.md` **F7**（R-A3.1–R-A3.4） | ⟦ev⟧ 事件 token 剥离**白名单枚举漏 `queued` / `cancelled`**——两者发射点在位 ⇒ 随 ACP 泄漏给客户端 | 白名单枚举 → **通用形态剥离**（`⟦ev⟧<名>\x1e`） |
| **B3** | `docs/core/requirements/PROVIDER.md` **F-PV1** | `onWait` 相位值域（五相）↔ 消费端映射漂移：`warn` / `quota` 落兜底分支 ⇒ 渲染 `undefined`（TUI 状态行字面 `retry in undefineds` / headless stderr / ACP 日志） | **核内相位映射单源** + 三消费点收敛为一行调用（无相位分支） |

**B2 / B3 不合并的理由**：同批交付，但根因面不同（B2 = 事件 token 剥离形态；B3 = 相位值域 ↔ 文案映射），验收判据不可互推——分列两条、各自独立机判。

### 二、实核事实（as-of 2026-09-16 实读；台账 `docs/TODO.md:27` / `:29` 的未核面本批已核）

| # | 坐标 | 现状 | 性质 |
|---|---|---|---|
| 1 | `thincoder-core/peer-instances.mjs:185-191` | 活判定 = `batchAlive(pid)` 存在性，**零身份校验** | 缺陷根因（台账实测：记录 pid 9800 现为 `SearchHost.exe`） |
| 2 | `thincoder-core/peer-instances.mjs:141-143` | `classifyEnd`：非 VSC 宿主标记的**任何** cmdline 一律判 `cli` | 同上（`probeCmdlines` 已拿命令行，却只用于 `end` 分类） |
| 3 | `thincoder-core/session-slots.mjs:199-211` | `cleanDeadOwners`：`!isProcessAlive(pid)` 即删——**pid 复用 ⇒ 陈旧记录永不清理** | 清理面同源缺陷 |
| 4 | `thincoder-core/peer-instances.mjs:37` / `:44` | 测试注入缝 `_setPeerInstancesTestImpl({aliveFn, cmdlineFn})` 在位 | **全仓零调用者**（本批首建用例——见 §三） |
| 5 | `thincoder-cli/src/acp/bridge.mjs:184` | 剥离白名单 = `turn\|approval\|done\|settled\|stopped\|async`（**不含 `queued` / `cancelled`**） | 缺陷 |
| 6 | `thincoder-core/agent-tools/subagent-scheduler.mjs:337` · `thincoder-core/agent-tools/subagent-async.mjs:262` | `⟦ev⟧queued\x1e…` / `⟦ev⟧cancelled\x1e…` **发射点在位**（均带 relay 前缀；桥 `parseRelayPath` 剥前缀后落在 payload 首） | **台账「发射面父侧未核 ✗」本批已核 ✓ ⇒ 泄漏成立** |
| 7 | `thincoder-core/provider/rate.mjs:96,110,144` · `core.mjs:235,454` · `retry.mjs:60,68` | `onWait` 相位**值域 = 五相**：`gate` / `retry` / `overloaded`（带 seconds）· `warn` / `quota`（只带 message） | 值域权威 |
| 8 | `thincoder-cli/src/tui/tool-events.mjs:406-411` | 三分支 `gate` / `overloaded` / `else` ⇒ `warn` / `quota` 落 else = `Rate-limited 429, retry in undefineds` | 缺陷（台账报出症状坐实） |
| 9 | `thincoder-cli/bin/thincoder.mjs:189-191` · `thincoder-cli/src/acp/bridge.mjs:196` | 二分支 `gate` / `else` ⇒ 同上 + `overloaded` 被误标 429；桥日志 `waiting ~undefineds` | 缺陷（同族第三、第四消费点） |
| 10 | `thincoder-core/i18n.mjs:41-44` · `thincoder-vscode/src/extension/panel-callbacks.mjs:195-202` | 核 i18n 已有 `status.{rateWait,rateLimited,overloaded,quota}` 四键；VSC 面 `statusTextPayload()` **五相完备**（`warn` → 不发射）且有用例（`thincoder-vscode/test/status-line.test.mjs:63-69`） | **可参照的既有正确形态**（B3 取它为语义同源基准） |

### 三、复现方法与判据（B2 / B3 为「半核」条目——先复现后修；复现不出 = 停下上报，不猜修）

**B1 复现（读面）**——用例：`_setPeerInstancesTestImpl({ aliveFn: () => new Set([9800]), cmdlineFn: () => new Map([[9800, "C:\\Windows\\...\\SearchHost.exe"]]) })` ⇒ 断言 `peerInstances(cwd)` **不含** pid 9800。
判据：**修前红 / 修后绿**（修前该条目会被列为活同伴——即台账实测现象）。旁证用例（同一缝）：cmdline 命中本产品标记 ⇒ 保留（`end` 分类照旧）；`cmdlineFn` 返回 `null` 或该 pid 缺行 ⇒ **保留**（探测失败 ≠ 死——既有降级语义）。

**B1 复现（清理面）**：`cleanDeadOwners` 用例（家族 = `thincoder-core/test/session-slot-write.test.mjs`）——pid 活 + cmdline 明确非本产品 ⇒ 条目被删；pid 活 + 身份符 ⇒ 保留；探测失败 / 缺行 ⇒ **不删**。

**B2 复现（实跑）**：桥级用例（家族 = `thincoder-cli/test/acp-channel.test.mjs`）——以 `⟦ev⟧queued\x1e0\x1e1\x1equeued\x1ewaiting for: x` · `⟦ev⟧cancelled\x1e…` · 嵌套形态 `coder#9/⟦ev⟧cancelled\x1e` 驱动桥 `callbacks.onToken` ⇒ 断言 **零 `agent_message_chunk` 通知**（修前泄漏 ⇒ 红）。
负向（防过剥）：正文含 `⟦ev⟧` 但无 `\x1e` ⇒ **仍转发**；既有五名（`turn` / `done` / `settled` / `stopped` / `async` / `approval`）⇒ 仍剥离。

**B3 复现（实跑）**：以 `{phase:"warn",message:"…"}` 与 `{phase:"quota",message:"…"}` 驱动三消费点，修前实际产出：TUI = `Rate-limited 429, retry in undefineds`（字面 `undefined`）· headless = `[rate-limit] 429 response, retrying in undefineds` · 桥 = `[rate-limit] warn waiting ~undefineds`。
判据（修后）：核 `waitStatusText` 对 `warn` / 未知相位 / 秒缺失相位**返回 `null`**（消费点不显示、不打印）；`gate` / `retry` / `overloaded` / `quota` 四相文案取核单源且**与核 i18n `status.*` 的 en 值逐字一致**；任一消费点输出**不含 `undefined` 子串**。

### 四、受影响文件（当前行数 + 预计增量 · R24a；行数 = as-of 2026-09-16 实读）

| 文件 | 现 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/process-probe.mjs` | 新 → **实读 154** | +≈115 | **新增**：`batchAlive` / `probeCmdlines` / `isProductProc(cmdline)`（产品标记族）/ `classifyEnd` / `filterDeadOwners(pid, { alive, cmdline }) → boolean`（身份复核删除决策）；判据单源（两消费面共用）；清理面注入缝（R6 形态）= 模块级 `_setProcessProbeTestImpl({ aliveFn, cmdlineFn })` + `??` 默认 + 测试 finally 恢复 |
| `thincoder-core/peer-instances.mjs` | 231 → **实读 164** | −≈93（→≈138） | 探测族外提新档（`batchAlive` 保持 **re-export**——既有 import 面零破）；身份过滤**不进 `batchAlive`**（保持纯存在性——`thincoder-core/peer-domains.mjs` **零改**）：落点 = `peerInstances()` 读面 × `filterDeadOwners` 清理面（详面 = 本表 `process-probe.mjs` / `session-slots.mjs` 两行） |
| `thincoder-core/session-slots.mjs` | 490 → **实读 497** | +≈4（→≈494） | `cleanDeadOwners` 改为调 `filterDeadOwners(pid, { alive, cmdline })`（**实现住新档——本档只加调用 + import；实际净增 +7（490→497），防触 500 硬限**）；本档零注入缝——测试经 `process-probe.mjs` 模块级缝注入 cmdline 三态（R6 形态） |
| `thincoder-core/provider/wait-status.mjs` | 新 → **实读 59** | +≈50 | **新增**：`waitStatusOf(event)`（相位→kind，纯映射）+ `waitStatusText(event)`（核单源文案；`null` = 不显示） |
| `thincoder-cli/bin/thincoder.mjs` | 421 → **实读 424** | +3/−3（→421） | 消费点收敛为一行调用（headless） |
| `thincoder-cli/src/tui/tool-events.mjs` | 446 → **实读 449** | +3/−6（→443） | 三分支 → 一行调用 |
| `thincoder-cli/src/acp/bridge.mjs` | 376 → **实读 383** | +3/−2（→377） | `:184` 通用形态剥离 + `:196` 一行调用 |
| `thincoder-core/test/peer-instances.test.mjs` | 新 → **实读 121** | +≈140 | B1 读面用例（注入缝首用） |
| `thincoder-core/test/session-slot-write.test.mjs` | 136（as-of 2026-09-16 实核——`\n` 计数；评审 #6 所报 137 = 尾空行口径，折算后即 136）→ **实读 179** | +≈35 | B1 清理面用例 |
| `thincoder-core/test/wait-status.test.mjs` | 新 → **实读 71** | +≈80 | B3 核判据全枚举 |
| `thincoder-cli/test/acp-channel.test.mjs` | 250 → **实读 302**（**超 300 软线**——纯测试档，一笔注记） | +≈30 | B2 用例 + B3 桥面用例 |
| `thincoder-cli/test/wait-status-callsites.test.mjs` | 新 → **实读 79** | +≈40 | B3 结构机检：三消费点均调用核单源且**零 `phase ===` 相位枚举残留**（断言对象 = 源码调用结构，非文档散文） |

**拆分计划（R24a）**：`thincoder-core/session-slots.mjs` 实施后实读 **497** 行（原 490；>300 软线，已在册 `SOFT_LINE_REGISTRY`）——本批为**最小增量**（计划 +4 / 实际 +7，身份复核实现住新档）；**触发预告**：距 500 硬限余量仅 3 行 ⇒ 该档**下次实质改动先拆分后落笔**；拆分候选 = 槽生命周期 / manifest 读写与合并 / 迁移面三段外提姊妹档；消解条件 = 该档下次实质改动时。
**R24a 口径（复审 #6）**：另三档 >300 行受影响源码 = `thincoder-cli/src/tui/tool-events.mjs` 实读 **449** · `thincoder-cli/bin/thincoder.mjs` 实读 **424** · `thincoder-cli/src/acp/bridge.mjs` 实读 **383**——三档增量近零 / 为负 ⇒ **不增厚、风险零**，不设拆分计划；**硬限判定（实读）**：本表 12 档无一超 500 硬限（最高 = `session-slots.mjs` 实读 497——余量 3 行）。

### 五、验收标准（逐条可机器验证）

| # | 条目 | 验收判据 |
|---|---|---|
| V1 | B1 | 读面：身份不符的 pid 复用记录**不再**列为同伴；身份符 / 探测失败 / 缺行 ⇒ 保留（既有降级语义零变） |
| V2 | B1 | 清理面：身份不符的陈旧条目被删；探测失败 / 缺行 ⇒ **不删**（保守——误删活实例槽 = 破坏存储隔离，属高风险方向） |
| V3 | B1 | 判据**单源**：读面与清理面调用同一实现（`process-probe.mjs`），无第二套标记正则 |
| V4 | B2 | `⟦ev⟧queued` / `⟦ev⟧cancelled`（含嵌套前缀形态）**零** `agent_message_chunk`；既有五名仍剥离；正文含 `⟦ev⟧` 无 `\x1e` 仍转发 |
| V5 | B3 | `waitStatusOf` 五相全覆盖 + `warn` / 未知相位 / 秒缺失 ⇒ `null`；`waitStatusText` 与核 i18n `status.*` en 值**逐字一致**（机检断言）；**quota 相钉死**：`{ phase: "quota", message: "quota exhausted: x" }` ⇒ 显示 `quota exhausted: x`（**不双前缀**——映射层剥发射前缀 `thincoder-core/provider/retry.mjs:60` 后经 `status.quota` 模板插值；`message` 无前缀 ⇒ 原样插值） |
| V6 | B3 | 三消费点（TUI / headless / ACP 日志）均调用核单源，**零相位枚举分支**残留 |
| V7 | 全批 | 发布门（命令相对 ThinCoder 仓根 `thincoder/` 执行）：`cd thincoder-cli && npm run lint && npm test && npm run test:integration` 全绿（脚本 = `thincoder-cli/package.json:39,37,42`）；**核面单列**：`cd thincoder-core && node --test` 全绿（`.github/workflows/test.yml:36-46` 同形——本批新增核用例所在）；本批 3 条核身份复核用例（`session-slot-write.test.mjs`）超阈（实测 1319.4 / 1545.5 / 1838.6 ms——超归册线 500ms 与拦截线 800ms）但**所在层无慢测层**（`thincoder-core/package.json` 零 `scripts`；core 树零 `slow*.mjs`；CLI 快层 glob = `test/*.test.mjs`（`thincoder-cli/test/run-fast.mjs:19`）不扫 core——机制上无硬红）⇒ 本批无归册动作；归册 / 建层归另批（机制缺口——裁定请求见 §5「归册 / 慢门实测」行（:306）） |

> **V5 附注（评审 #9 · 行为变更声明）**：headless 文案随单源改写——旧串（`thincoder-cli/bin/thincoder.mjs:190` `[rate-limit] TPM throttle waiting ~${s}s` / `[rate-limit] 429 response, retrying in ${s}s`）⇒ 收敛后 = 核 i18n en 值（与 TUI 现文同源）；**接受**——实施轮不得当回归报。实测 `thincoder-cli/test/**` 零锁定旧串断言 ⇒ 无回归风险。

### 六、明确不在本批

- B1 **不做**：跨实例消息传递 / 任务编排 / 文件锁（F-MI 范围边界不变）。
- B1 **不做** cwd 匹配（记录不含 cwd、进程 cwd 不可移植获取）——**已知局限**登记：pid 被他 cwd 的真实 thincoder 实例复用仍可能误报（消解路径见设计档 §8）。
- B2 **不做**事件语义整体过滤（内容今日已进流；语义大改需用户裁定——ACP-CLIENT 设计 §9 既有登记项不变）。
- B3 **不做**：CLI 引入 i18n 层；`warn` 相位新增文案键（裁决 = 不发射，与 VSC 面等价）。
- **不触**：台账 / 批次档 §1 / 参照历史正文（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`）/ 提示词实体；VSC 侧实现（`thincoder-vscode/src/extension/peer-instances.mjs` · `panel-callbacks.mjs`）本批零改动（语义同源，见设计档）。

### 七、停止条件 / 打回条件

1. 任一「半核」条目**复现不出**（用例修前不红）⇒ **停下上报**，不猜修、不降级为改注释。
2. 勘察撞见**子代理链同族缺陷**（第 6 处 ⟦ev⟧ / 相位消费端）⇒ 记一行、停下上报，**不扩批**。
3. 撞需求缺口 / 与实现冲突 / 归属不明 ⇒ 打回主 agent（不自行选一种解释）。
4. 触到 VSC 端同等缺陷面而本批不改 ⇒ 报告注明，不静默放过。

### 自检收口补记（2026-09-16 · eng-designer）

**① 需求档三产物已落**（本批同轮）：
- `docs/core/requirements/PROVIDER.md` §2.1 新条目 **F-PV1**（`onWait` 相位值域 + 文案映射单源在核；消费面禁各自枚举 / 禁 `undefined` 文案 / 禁兜底误标）+ 变更记录行。
- `docs/cli/requirements/ACP-CLIENT.md` **F7**（核事件 token 零进 ACP 客户端可见面）+ 判定句 + 变更记录 + 体量行。
- `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` **F-MI6 / N-MI6** + §5.2 VSC 面去向行 + 变更记录 + 体量行。

**② 设计档三档收正**：PROVIDER §6.6 五相值域行 + §6.20 单源映射（映射表 / API / 复现判据 ①–⑤ / D-PR28）· ACP-CLIENT §7.2 形态判据块（含 CLI 侧既有先例与「不得放宽为无终止符形态」约束）+ D13 · MULTI-INSTANCE-COLLAB §3.1 F-MI6 / N-MI6 判定句 + 判据单源行 + D-MI9–D-MI12。

**三方条目一致（逐条同号 · 零悬空）**：本档 §2 条目 **B1** ↔ 需求档 **F-MI6 / N-MI6** ↔ 设计档 `MULTI-INSTANCE-COLLAB.md` §3.1；**B2** ↔ **F7** ↔ `ACP-CLIENT.md` §7.2 / D13；**B3** ↔ **F-PV1** ↔ `PROVIDER.md` §6.20 / D-PR28。

**体量行 as-of 2026-09-16 实核（D3 · 已回读核实）**：`MULTI-INSTANCE-COLLAB.md` 设计 **238 行**（复审复核收正）· `ACP-CLIENT.md` 设计 **365 行**（复审复核收正）· `PROVIDER.md` 设计 **402 行**；需求档 `MULTI-INSTANCE-COLLAB.md` **96 行** · `ACP-CLIENT.md` **131 行**（复审复核收正；两档本批无再改）；三设计档均已附受影响文件 / 验收回指指针（指向本档 §四 / §五）。
**体量行补记（复审 #4 · 2026-09-16 实核）**：文档面第 4 档 `docs/core/design/SESSION.md` **389 行**（§9 旧读数 311 已刷）——补入本批体量行清单。

**同族非缺陷观察项（记录，本批不改）**：
1. `thincoder-cli/src/tui/render.mjs:245-256`——形态判据已在位（结构化剥 + 字母兜底）；其注释记载了必须避开的否决形态 `/⟦ev⟧[^\x1e\x1d]*/`（吞到行尾、吃过真实正文）⇒ 已写入设计档作为 B2 修法的形态约束。
2. `thincoder-cli/src/tui/subagent-blocks.mjs`——`:46` 枚举之外另有 `:172` 显式 `cancelled` 分支 + `:187` `startsWith("⟦ev⟧")` 兜底 ⇒ 该消费点自洽无泄漏面，本批不改。
3. `thincoder-core/agent/spawn-child.mjs:99-101`——生成侧哨兵放行判据系**枚举**（`EVENT_PHASE` × `EVENT_TYPE`——与 D13 所否「枚举 = 漏项发生器」同形）；本批不改（修法面 = ACP 消费侧形态判据；生成侧 strip 语义处置另行）。
4. `thincoder-cli/src/tui/render.mjs:256`——末行兜底 `/⟦ev⟧[A-Za-z]*/` 比形态判据（`[a-z]+` + `\x1e`）**宽**（空名 / 大写名亦命中；位于结构化剥之后）——残留风险低，登记不改。

**待核项（已收口 · 评审 #5）**：`onWait` 的 `quota` 相发射点 = **已定位**（`thincoder-core/provider/retry.mjs:60`——与本档 §2 事实行 7 互证；`:68` 同族）；设计档 §6.20「发射点未定位」登记随撤——**B3 修法对发射点位置不敏感**（该不变式保留）。

**停止条件载荷（本批）**：VSC 自持镜像面（`thincoder-vscode/src/extension/{peer-instances,session-slots}.mjs`）同源缺陷**在案不修**（面间不追赶——设计档 D-MI12；需求档 §5.2 去向行）；处置归 VSC 轮。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**批 1 CORE-DEFECT-FIXES · 设计评审（评审子代理 · 2026-09-16）**

评审对象 = 声明 Target：MULTI-INSTANCE-COLLAB（设计+需求，F-MI6/N-MI6）· ACP-CLIENT（设计+需求，F7）· PROVIDER F-PV1 + 本档 §2。行数为实读（read 工具计数比 wc 多 1 尾行，已统一折算）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 | 🔴 | `thincoder-core/session-slots.mjs` 的**死主判定语义**被改写（pid 死 **或** pid 活 + 命令明确可得 + 身份不符 ⇒ 删；设计 `MULTI-INSTANCE-COLLAB.md:63` / `:193` D-MI11），而该模块的权威档 `docs/core/design/SESSION.md` 未同步：`:91`（§6.2 死主条目清理——「删除 owner 已死的条目」「死主判定必须跑 `isProcessAlive`」）与 `:298`（D-SE3）仍只描述 pid 判定；`SESSION.md:15`（§1）明列「槽位 = `session-slots.mjs`」、「本档 = 该板块的完整设计面」。本档 §2:61 的文档修订清单只含三设计档 + 三需求档，与本档 §1:43 自定的分工口径（改到哪模块 ⇒ 同步修该模块权威档）相悖 ⇒ 实施后同一机制在两份权威档中描述不同 | 把 `SESSION.md` 列入本批文档面（§6.2 死主清理 + D-SE3 各补一句指向判据单源 `process-probe.mjs`，并把本档 §2:61 清单补一行）；若裁为留待他批，需在 §2/§8 明写去向，不留未披露的权威档漂移 |
| 2 | 需求覆盖 | 🟡 | F7 / R-A3.1 的面列表（同 R-A2.1——含 `agent_thought_chunk` / `tool_call.title` / `request_permission` 文本；需求档 `ACP-CLIENT.md:48`、`:58`）与修法落点不匹配：修法只在 onToken（`thincoder-cli/src/acp/bridge.mjs:184`），`bridge.mjs:188-194` 的 onReasoning 只剥 relay 前缀、无 ⟦ev⟧（也无 `[model]`）形态剥离；生成侧证据 = 全部发射点经 `callbacks.onToken`（`dispatch.mjs:296` / `agent.mjs:208` / `subagent-scheduler.mjs:337` / `subagent-async.mjs:262` / `async-settle.mjs:262,264` / `subagent.mjs:359` / `spawn-child.mjs:162` / `subagent-run.mjs:143` / `subagent-panel.mjs:98` / `consult.mjs:249`）⇒ 其余面只剩「模型伪造」向量，但设计未写明该面免修的理由与接受边界 | 设计 §7.2 增一句判据面注（生成侧只走 onToken；其余面仅伪造向量——明确「接受」或把形态判据同样用于 onReasoning），使 R-A3.1 逐面有交代 |
| 3 | 清晰度 | 🟡 | 身份过滤**落点**两处表述不一：设计 `:59`「`batchAlive` 的 pid 存在性之外加身份复核」vs 本档 §四:107（peer-instances 行「活判定加身份过滤」+「`batchAlive` 保持 re-export」）。若按前句做进 `batchAlive`，则第二消费者 `thincoder-core/peer-domains.mjs:22`（`import { batchAlive }` → `:132` `_testAliveFn ?? batchAlive`）的域残留清理语义随之变更（设计 `:103`「死 pid 文件 unlink」→ 变成 pid 活 + 身份不符即 unlink），而 peer-domains 不在 §四 表内、也不被 V1–V3 覆盖；另 `filterDeadOwners` 签名 / 清理面注入缝形态（R6：模块级 setter + `??` 默认 + finally 恢复）未写 | §3.1/§四 明写过滤落点（建议 `batchAlive` 保持纯存在性语义，过滤只在 `peerInstances` 与 `filterDeadOwners` 内），并补 peer-domains 零改声明（或列入 §四 + 一条回归判据）+ 写明清理面注入缝签名 |
| 4 | 验收标准 | 🟡 | V7 发布门（§五:131）不可执行且覆盖面漏核测试：`thincoder/` 下**无 `package.json`**（实读；`npm test` / `npm run test:integration` 的脚本住 `thincoder/thincoder-cli/package.json:37,42`）；两入口 glob 都只吃本包（`test/run-fast.mjs:19`、`test/run-integration.mjs:17`），核测试另跑（`.github/workflows/test.yml:36-46` = `working-directory: thincoder-core` + `node --test`）⇒ 本批新增核用例（`thincoder-core/test/{peer-instances,wait-status}.test.mjs` + `session-slot-write.test.mjs` 增量）不在 V7 执行面内（命令写错是响的，覆盖面缺口是静默的） | V7 改为可执行形态：`cd thincoder/thincoder-cli && npm test` + `npm run test:integration`，并单列一条核面 `cd thincoder-core && node --test` |
| 5 | 清晰度 / 验收 | 🟡 | B3 `quota` 相**文案合成规则未钉死**，V5（§五:129）机检不可唯一判定：核 i18n 模板 `status.quota` = `quota exhausted: ${msg}`（`i18n.mjs:44`），而发射面 `retry.mjs:60` 的 `message` **自带同前缀**（`quota exhausted: ${text.slice(0,200)}`）；PROVIDER 设计 `§6.20:299` 写「`message` 原文透传」、`:309` 判据② 期望显示 `quota exhausted: x` ⇒ 「模板插值」与「原文透传」二选一：前者双前缀，后者使 V5「与 i18n en 值逐字一致」对该相失真。另 §2:165「`quota` 相核内发射点未定位」与本档事实行 7（`:84` 已列 `retry.mjs:60,68`）自相矛盾——实测 `retry.mjs:60` 即 quota 发射点 | §五 V5 钉死一度量（quota = message 原文透传不再套模板，或先剥 `quota exhausted: ` 前缀再插值）；§2:165 待核项按事实行 7 收口为「已定位（`retry.mjs:60`）」 |
| 6 | 受影响文件标注 | 🟡 | §四:114 `thincoder-core/test/session-slot-write.test.mjs` 的「现」列写「现档」而非行数（R24a 要求当前行数 + 增量）⇒ 无法据此判层级；实测该档 **137 行**（+≈35 ⇒ ≈172，无越线风险；其余各行实测与标注一致：`peer-instances.mjs` 231+1 尾行、`session-slots.mjs` 490、`bin/thincoder.mjs` 421、`tool-events.mjs` 446、`bridge.mjs` 376、`acp-channel.test.mjs` 250） | 补为 137（as-of 2026-09-16），与其他行同格式 |
| 7 | 文档卫生（既有） | 🔵 | 设计 `:5` / `:63` / `:200` 引「`SESSION.md` §10 槽位认领 / 判活 / slotOccupancy」——当前 `docs/core/design/SESSION.md` **无 §10**，对应内容在 §6.2（`:85-95`；端分离恢复 = §6.10）。属 2026-09-15 建档带出的旧编号（非本批新增锚，不触「零新增非前向引用」判据） | 顺手改指 §6.2（本批正改该机制邻句，代价极小） |
| 8 | 引用精度 / 观察项 | 🔵 | R-A3.3（需求档 `:62-63`）称核生成侧 `spawn-child.mjs:85-90` 的「良构 / 非良构判据」与形态判据对齐——实测该处是**枚举**判据（`spawn-child.mjs:99-101` `EVENT_PHASE = "turn\|approval\|done"` × `EVENT_TYPE`），与 D13 所否的「枚举 = 漏项发生器」同形；真形态判据先例只有 VSC 面（`panel-callbacks.mjs:44` / `:85`——已逐字实核相符）。同族观察项可补：`spawn-child.mjs:99-101`（枚举）· `render.mjs:256`（`[A-Za-z]*` 兜底，比 `[a-z]+` 宽） | 先例句收正为「对齐 = VSC 面形态兜底」并注明核生成侧枚举面不在本批范围；§2:161-163 观察项补上述两行 |
| 9 | 行为变更声明 | 🔵 | headless 文案随单源改写未被显式声明：`bin/thincoder.mjs:190` 现文 `[rate-limit] TPM throttle waiting ~${s}s` / `[rate-limit] 429 response, retrying in ${s}s` ⇒ 收敛后改取核 i18n en 值（TUI 现文已与 `i18n.mjs:41-43` 逐字同）。实测 `thincoder-cli/test/**` 零锁定旧串断言 ⇒ 无回归风险 | §五 V5 或 §六 补一句「headless 文案随单源改写——接受」，免实施轮当回归报 |

**评审边界**：PROVIDER 设计 `§6.6/§6.20` + D-PR28 与需求 F-PV1 **不在** Documents to Review 清单（声明 Target 含 F-PV1）；本轮仅按声明核验 F-PV1 / §6.20 的引用一致性（已核：F-PV1 在位、§6.20 映射表与 5 条复现判据在位、D-PR28 在位、五相发射点 `rate.mjs:96,110,144`·`core.mjs:235,454`·`retry.mjs:60,68` 逐条相符）。
  VSC 面按声明排除（仅作引用核验，未评审）。无 Document Map、无项目标准档 ⇒ 文档归属判据按 SESSION.md/GUIDE 降级判定。

**计数：🔴 1 · 🟡 5 · 🔵 3**

VERDICT: changes-required

### 轮次 2（评审子代理）

**批 1 CORE-DEFECT-FIXES · 设计评审 · 复审（评审子代理 · 2026-09-16）**

对象 = 声明 Target：修正轮后复审——核验轮次 1 的 9 条发现逐条落地（重点 🔴 第 1 条：`SESSION.md` 纳入文档面 + 死主判定语义同步）＋本轮新增写入面（`SESSION.md` §6.2/D-SE3 · `PROVIDER.md` 发射点转正 + quota 剥前缀规则）。行数 / 坐标 = 本轮实读（read 工具计数比 wc 多 1 尾行，与 §四 源码面口径一致）。

**轮次 1 逐条核验（实读）**：#1 🔴 **已落**——`SESSION.md:92`（§6.2「批 1 扩」身份复核双条件 + 判据单源 `filterDeadOwners`）· `SESSION.md:299`（D-SE3 同步）· `MULTI-INSTANCE-COLLAB.md:63`（清理面同判据）——两档对同一机制表述一致，无机制级二述，🔴 消解。
#2 已落（`ACP-CLIENT.md:275-277` 面覆盖注：生成侧全走 `onToken`、其余面残余 = 模型伪造「接受」）· #3 已落（`:59` 落点澄清「不进 `batchAlive`」+ peer-domains 零改声明 + `:64` `filterDeadOwners` 签名 / R6 注入缝形态）·
#4 已落（批次档 `:135` V7 改可执行形态 + 核面单列；`thincoder-cli/package.json:37,39,42`、`.github/workflows/test.yml:36-46` 实核相符）· #5 已落（V5 quota 钉死「剥前缀不双前缀」+ `PROVIDER.md:291` 发射点转正 `retry.mjs:60`，实核该行即 quota 发射点）·
#6 已落（`session-slot-write.test.mjs` 现 136 +≈35，实读 137 ⇒ 同口径一致）· #7 已落（设计档 §10 引用全部改指 `SESSION.md` §6.2）· #8 已落（R-A3.3 收正为「对齐 VSC 面形态兜底」+ `spawn-child.mjs:99-101` 枚举面不在本批 + 观察项补行）· #9 已落（V5 附注声明 headless 文案改写；`thincoder-cli/test/**` 零旧串断言实核相符）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 / 需求一致性 | 🟡 | 需求档 `F-MI2`（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:31`）把 `peer_instances` **条目字段白名单**写作 `{pid, end, sessionId, slots, self}`，而同一档 `N-MI4`（`:44`）、设计档 §3.3（`docs/core/design/MULTI-INSTANCE-COLLAB.md:89`）与实装（`thincoder-core/peer-instances.mjs:226-228` 去 self + 去 `self` 键；VSC 面同形）一致为四键。`self` 只存在于 `peerInstances()` 条目（工具输出剔除）——两份在档权威档对同一返回面表述不同（本批已动 `F-MI2` 该句，未顺手收口） | 报而不改（R7a）：`F-MI2` 一句收口为「`peerInstances()` 条目含 `self`；`peer_instances` 工具输出白名单 `{pid, end, sessionId, slots}`（N-MI4）」 |
| 2 | 清晰度 / 可行性 | 🟡 | 清理面身份复核的**探测形态未钉**：设计 `:64` / 批次档 `:110` 的清理面 API 为 `filterDeadOwners(pid, { alive }) → boolean`，批次档 `:112` 称 `cleanDeadOwners`「只加调用 + import 两行」⇒ 逐条调用形态；但设计未写明该调用是否复用**一次批量** `probeCmdlines`（`D-MI3`（`:192`）已以成本否决「每 pid 一次 exec」，`N-MI3`（需求档 `:43`）把「不做每进程一次子进程」列为标准）——`ensureActive` 起始逐条探测的成本未被声明 | 设计 §3.1 / §四 写明清理面探测亦为单次批量（或一句明示接受逐条成本），使 R6 注入缝的 `cmdlineFn` 批量语义与实现一致 |
| 3 | 需求覆盖 / 登记缺口 | 🟡 | 清理面「**误删**」方向未登记：设计 `:65` 的已知局限只覆盖**读面误报**（他 cwd 真实实例复用 pid ⇒ 多报同伴，噪音可忍），而新删除分支（`SESSION.md:92` / `:299` D-SE3、`D-MI11`）在**标记族假阴性**（真实本产品实例命令行不含 `thincoder.cjs`/`thincoder.mjs`/`thincoder-cli` 路径段且非 extensionHost——包装器 / 新入口形态）时会删掉**活**属主的槽条目，方向正是 D-SE3 原文要防的「双进程同槽」；`D-MI10` 的不对称保守只对「探测失败 / 缺行」成立 | 报而不改裁定：补一行登记该方向（含接受边界或负向保护），与 `:65` 已知局限并列；不改 D-MI11 判据 |
| 4 | 文档卫生（体量行） | 🔵 | 体量行读数与实读有差：`SESSION.md:365`（§9）记 **311 行**，实读 **389 行**（折算 ≈388，差 ≈77——B 轮读数未随 §6.15 / D-SE27–30 并入与批 1 修订刷新）；批次档 `:165` 的体量行收口清单（3 设计档 + 2 需求档）**未含**本批文档面第 4 档 `SESSION.md`。另 `docs/cli/design/ACP-CLIENT.md:353` 记 362 vs 实读 365（折算 ≈364；其余两设计档 232 / 401 与同口径折算相符） | 收口时补 `SESSION.md` 体量读数（并刷新 §9），顺带核 `ACP-CLIENT.md` 读数 |
| 5 | 文档卫生（指针） | 🔵 | 批次档 `:59`「§2 受影响文件表已补行（`:61`）」指向偏：`:61` = §2 标题；§四 受影响文件表（`:108-121`）无 `SESSION.md` 行（`.md` 豁免行数标注，本不需行）；实际落点 = §2 `:65` 的文档修订清单「设计档**四处**修订……`SESSION.md` §6.2/§7」 | 指针收正为 `:65` 并改称「文档修订清单」（非「受影响文件表」） |
| 6 | 受影响文件标注 / 拆分规划 | 🔵 | §四 中三档 >300 行受影响源码（`thincoder-cli/src/tui/tool-events.mjs` 446 · `thincoder-cli/bin/thincoder.mjs` 421 · `thincoder-cli/src/acp/bridge.mjs` 376）无拆分规划行（本批增量 −2/+3/−6，近零或负；仅 `session-slots.mjs` 490→494 附计划（`:123`）） | 非阻塞观察：若按「>300 行须主动拆分复核」口径统一，§四 可加一行口径说明（或逐档一句「不增厚、风险零」） |

**评审边界**：声明 Exclude（VSC 自持镜像面同源缺陷 · §1/§2 裁定文本 · 前一轮已核正向面）未评审，仅作引用核验（`thincoder-vscode/src/extension/peer-instances.mjs:163,184-187` 用于判定 #1 是否真矛盾——结论：`self` 键住条目、工具输出剔除，设计档侧无误）。无 Document Map / 无项目标准档 ⇒ 文档归属判据按设计档 §1 归属行与批次档 §1 分工口径降级判定。三机检体量 / 行数为实读抽查（源码面口径 = read 计数 − 1 尾行）。

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 3

### 轮次 3（评审子代理）

**批 1 CORE-DEFECT-FIXES · 设计评审 · 全量复核（轮次 3）（评审子代理 · 2026-09-16）**

对象 = 声明 Target：修正/收口轮后全量复核（身份校验双条件（读面 + 清理面）· 单次批量探测 · 误删方向局限登记 · `SESSION.md` 文档面第 4 档 · ACP ⟦ev⟧ 形态判据 + 面覆盖注 · PROVIDER onWait 五相映射）。行数 / 坐标 = 本轮实读（read 计数 −1 尾行口径，与 §四 同口径）。

**前两轮发现逐条复核（实读）**：轮次 1 #1 🔴 ✅（`SESSION.md:92` §6.2 批 1 扩 + `:299` D-SE3；`MULTI-INSTANCE-COLLAB.md:63` 清理面同判据——两档一致）· #2 ✅（`ACP-CLIENT.md:275-277` 面覆盖注）· #3 ✅（`:59` 「不进 `batchAlive`」+ peer-domains 零改）· 
#4 ✅（批档 `:135` V7 可执行 + 核面单列；`thincoder-cli/package.json:37,39,42`、`.github/workflows/test.yml:36-46` 实核相符）· #5 ✅（V5 quota 剥前缀、`PROVIDER.md:291` 发射点转正）· #6 ✅ · #7 ✅（设计档 §10 引用全改指 §6.2）· #8 ✅ · #9 ✅。
轮次 2 三条 🟡 均落（需求档 `:31` F-MI2 收口 · 设计 `:65` 单次批量 · `:67-68` 误删方向登记）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求覆盖 / 判据单源 | 🟡 | 同源**第三处死主条目清理**未纳面：`thincoder-core/session.mjs` `newSession`（`:367`）内联同机制清理——`:375-386` 仍为 pid 存在性判定（`!pid \|\| !isProcessAlive(pid)`），`:415-421` 经 `deletions` 落盘（实读）。该档不在 §四 表、V1–V3 均不覆盖；`SESSION.md:127`（§6.5 `/new`「开头清理死主条目」）描述同一路径，亦不在 §2:65 修订清单（仅 `§6.2/§7`）⇒ 修后同一机制存在两套判据，而 `MULTI-INSTANCE-COLLAB.md:62-63` / `D-MI11`（`:197`）/ V3 均声明「判据单源」。影响部分被掩盖（`ensureActive` / `resumeSlot` 路径先清同批条目） | 按 §1 边界 1 / §2 停止条件 1 至少**登记一行**（同族第三处 ⇒ 记一行、停下上报、不扩批）；若裁为纳面须同补 §四 行（`session.mjs` 现 ≈494 行 ⇒ 须附拆分计划）+ 一条 V 判据 + `SESSION.md` §6.5 补句 |
| 2 | 清晰度 / 可行性 | 🟡 | 清理面 API 形态内部不一致：`filterDeadOwners(pid, { alive })`（设计 `:64` / 批档 `:112`）签名不携带命令行，而 `:65` 要求「单次批量 `probeCmdlines` + `filterDeadOwners` 逐条消费该批量结果、不做每 pid 一次 exec」⇒ 按签名只剩「每 pid 自探测」（已被 `:65` / `D-MI3`（`:189`）/ 需求 `N-MI3`（`:43`）否决）或未声明的第三参两条路，实现者须自行选一 | 明写批量结果入参形态（如 `filterDeadOwners(pid, { alive, cmdline })`，或一句「清理面把同一批量 Map 逐条传入」），与 R6 注入缝 `cmdlineFn` 的批量语义对齐 |
| 3 | 文档卫生（判据宽度） | 🔵 | 同一标记族两处宽度不同：需求档 F-MI6（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:35`）写「命令行含 `thincoder.cjs` / `.mjs` / `thincoder-cli` 路径段」，设计 `:60` 为 `thincoder.cjs` / `thincoder.mjs` / `thincoder-cli`——按需求字面（`.mjs` 后缀）会命中无关脚本（方向 = 误保留） | 需求档一句收正为 `thincoder.mjs`（机制权威 = 设计档） |
| 4 | 文档卫生（引用漂移） | 🔵 | 同一 VSC 用例两档读数不一：批次档 `:93` = `thincoder-vscode/test/status-line.test.mjs:63-69` · `PROVIDER.md:307` = `:62-70`（VSC 文件不在本评审清单 ⇒ **未核**，仅报两档不一致） | 收口时统一行区间 |
| 5 | 验收判据（机检形态） | 🔵 | V6 的 `thincoder-cli/test/wait-status-callsites.test.mjs`（§四 `:123`）以**源码结构**为断言对象；扫描面若宽于三消费点会假红——`thincoder-cli/test/smoke-responses.mjs:48` 合法含 `w?.phase === "warn"`（实核） | 断言范围钉死三消费点文件；并以「调用核单源」+「输出不含 `undefined` 子串」为主，少用全仓文字扫（R4 脆弱性） |
| 6 | 需求覆盖（相邻面登记） | 🔵 | L3 域面 `thincoder-core/peer-domains.mjs:132-143` 保持 `batchAlive` 纯存在性（§四 `:113` 声明零改）⇒ pid 被他进程复用的**陈旧登记文件**不被清、可能浮为「5 分钟内另有实例在写」软提示（受 `HOT_WINDOW_MS` 限时）；设计只登记了读面误报方向（`:66`） | 一句登记该方向（或明示归入 `:66` 已知局限） |
| 7 | 数字漂移 | 🔵 | §四 `:114` 行内两数不一：说明列「本档只加调用 + import **两行**」vs 增量列 `+≈4（→≈494）`——该行 = 唯净增厚者，离 500 硬限余量 ≈6 行 | 统一取一数 |

**评审边界**：声明 Exclude（提示词实体 · 前向引用悬空锚（已裁定非缺陷）· VSC 自持镜像面）未评审。`docs/core/requirements/PROVIDER.md`（F-PV1）不在 Documents to Review 清单 ⇒ 仅作引用核验（F-PV1 在位 `:23-26` · 变更记录 `:150`，与 `PROVIDER.md` §6.20 口径一致）。
无 Document Map / 无项目标准档 ⇒ 文档归属判据按设计档 §1 归属行与批次档 §1 分工口径降级判定。行数抽查（实读 −1 尾行口径）与 §四 相符：
`peer-instances.mjs` 231 · `session-slots.mjs` 490（读 491）· `bridge.mjs` 376（读 377）· `tool-events.mjs` 446（读 447）· `bin/thincoder.mjs` 421（读 422）· `session-slot-write.test.mjs` 136（读 137，同 §四 注口径）。

计数：🔴 0 · 🟡 2 · 🔵 5

VERDICT: pass

## §4 用户批准（主 agent）

2026-09-16 用户**总批准**（原话：「直接执行完，浪费了太多时间了」）——授权本波（批 1–5）在设计评审 pass 后直接推进实施与收口；本批据此进入实施（设计轮 pass 记录见 §3）。

## §5 实施记录（eng-coder）

### 实施记录（eng-coder · 2026-09-16）

**交付摘要**：B1 / B2 / B3 三条按 §2 全量落地（无降级、无 §2 外改动）。
B1 = 探测族外提单源 `thincoder-core/process-probe.mjs`（`batchAlive` / `probeCmdlines` / `isProductProc` / `classifyEnd` / `filterDeadOwners`）+ 读面 `peerInstances()` 与清理面 `cleanDeadOwners` 均加身份复核；
B2 = `bridge.mjs` 剥离由白名单枚举改通用形态 `/^⟦ev⟧[a-z]+\x1e/`（保留 RS、无终止符照转发）；
B3 = `provider/wait-status.mjs` 核内单源（`waitStatusOf` / `waitStatusText`）+ 三消费点（TUI / headless / ACP 日志）收敛为一行调用、零相位枚举残留。

**验收自证（V1–V7）**：

| # | 判据 | 落地 | 机判读数 |
|---|---|---|---|
| V1 | 读面身份不符不列为同伴；身份符 / 探测失败 / 缺行 ⇒ 保留 | `process-probe.mjs` `filterDeadOwners` + `peer-instances.mjs:110-127` | `peer-instances.test.mjs` 7 用例绿（含 pid 复用剔除 / 两族保留 / null 与缺行保守保留 / 与 `isProductProc` 同判） |
| V2 | 清理面身份不符陈旧条目被删；失败 / 缺行不删 | `session-slots.mjs:205-219`（一次批量探测 + 逐条 `filterDeadOwners`，无 per-pid 残留） | `session-slot-write.test.mjs` 三条身份复核用例绿（删 / 保留 / 保守不删） |
| V3 | 判据单源，无第二套标记正则 | 两消费面同 import 自 `process-probe.mjs` | 同档 7 用例中「判据单源」条绿 |
| V4 | `queued` / `cancelled`（含嵌套前缀）零 `agent_message_chunk`；既有名仍剥；无 RS 仍转发 | `bridge.mjs:188` 形态判据 | `acp-channel.test.mjs` B2 组绿 |
| V5 | 五相全覆盖 + `warn` / 未知 / 秒缺失 ⇒ `null`；文案与核 i18n en 逐字一致；quota 不双前缀 | `wait-status.mjs`（`QUOTA_ECHO_PREFIX` = 模块加载期由 `t("status.quota", { msg: "" })` 取模板前缀，零硬编码） | `wait-status.test.mjs` 与 CLI 面 V5①–⑤ 共 9 条绿（含 `undefind` 子串零命中） |
| V6 | 三消费点调核单源、零相位枚举 | `tool-events.mjs:406` 组 · `bin/thincoder.mjs:189` 组 · `bridge.mjs:200` 组 | `wait-status-callsites.test.mjs` 结构机检绿 |
| V7 | 发布门 | — | 见下「发布门读数」 |

**发布门读数（仓根 `thincoder/`）**：`thincoder-core && node --test` = **225 / 225 pass / 0 fail**；`thincoder-cli && npm run lint` = 0；`npm test` = 全绿；`npm run test:integration` = 全绿；
`thincoder-cli/test/run-fast.mjs` 单点复跑本批两档（`wait-status-callsites` + `acp-channel`）= tests 24 / pass 24 / fail 0、**慢门零点名**；HEAD = `b1f947ee`。

**决策透明表**：

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| 1 | 身份过滤落点 = 读面 `peerInstances()` + 清理面 `filterDeadOwners`；`batchAlive` 保持**纯存在性**语义 | 设计 §3.1 + 父侧裁定（评审 #1 🟡#2 收正）：过滤进 `batchAlive` 会连带改 `peer-domains.mjs:132` 的域残留清理语义 ⇒ 该档本批零改 | 把过滤写进 `batchAlive`（否决：越面改动 + 破设计「peer-domains 零改」） |
| 2 | 清理面注入缝 = `process-probe.mjs` 模块级 `_setProcessProbeTestImpl({ aliveFn, cmdlineFn })`（`??` 默认 + `finally` 恢复） | §四 表 R6 形态；`alive` 在清理路径仍走 `session-slots.mjs:327` 自有 `isProcessAlive`（设计未要求外提，外提 = 语义面新改动）⇒ 用例只注入 cmdline 三态 | 在 `session-slots.mjs` 再造一条缝（否决：双缝并行 = 注入面分裂） |
| 3 | B2 形态 = `/^⟦ev⟧[a-z]+\x1e/`，**保留 RS 终止符**、不放宽 | 设计 §7.2 形态判据 + 先例 `render.mjs:245-256` 记载的否决形态（无终止符正则吞正文）；生成侧（`spawn-child.mjs:99-101`）本批不改 | 改为无终止符形态（否决：设计明禁）；改为并列白名单枚举（否决：评审 #2 已证枚举 = 漏项发生器） |
| 4 | B3 `quota` 剥发射回显前缀：模块加载期用 `t("status.quota", { msg: "" })` 取模板前缀再 `startsWith` 剥一次 | 单源、零硬编码前缀串；发射面 `retry.mjs:60` 前缀 `quota exhausted: ` 与 i18n en 模板逐字同源 | 硬编码前缀常量（否决：双写 = 漂移面）；正则通配剥（否决：可能吃正文） |
| 5 | ACP 桥 `onWait` 仅日志面同样收敛为一行调用（无相位分支） | 设计 §2 事实行 9 列该面为同族消费点；日志面同样禁 `undefined` | 保留二分支（否决：V6 零枚举残留判据不允许） |

**内部审计与代码评审轮次 · 终态**：

| 环节 | 轮次 | 结果 |
|---|---|---|
| 内部 explore 分歧审计（对照设计/§2 逐条） | 1 轮 | **clean**——零 PARTIAL / 零 SILENT-SIMPLIFICATION / 零 OUT-OF-LIST |
| advisor 代码评审（kin 内同步） | R1 | **pass**——6 发现（1🟡 + 5🔵），零 🔴 |
| advisor 代码评审 | R2（核对修复声明） | **pass**——零 🔴；逐条核对结果见下 |
| fix round | 1 轮 | 注释 / jsdoc 一致性修正（零行为变更），复跑 24/24 绿 |

**fix round 明细**：R1 第 5 条（🔵 注释与实现不符）已修——`process-probe.mjs:35` 与 `peer-instances.mjs:36` 的缝语义句由「传 `{}` 只清空对应槽」改为「**未传的槽置 null**（传 `{}` = 两槽同清，等价 reset）」，与 `:38` / `:39` 的 `aliveFn: aliveFn ?? null, cmdlineFn: cmdlineFn ?? null` 实现对齐。
R1 第 6 条（🔵 悬空节号）**部分修**：新档 `process-probe.mjs:9` 已指 `SESSION.md §6.2`；`session-slots.mjs:69/428/468` 与 `peer-instances.mjs:5` 的 `§10` 引用**经实核可解析**（`thincoder-cli/docs/design/SESSION.md:288` `## 10. 端分离恢复…` / `:304` `**D-2 恢复决策**`）⇒ 判**非缺陷**（不属悬空，仅未带档名——与「D4 指针形态」的收正可另轮；旧档注释本批不在射程）。
R2 其余留档项 = ① 🟡 入口族缺裸 bin 形态（`node /usr/local/bin/thincoder`；本机 Windows 下不可达，设计已登记接受边界）② 🔵 清理面对死 pid 也发一次批量探测 
③ 🔵 `session-slots.mjs` 497 行贴 500 硬限 ④ 🔵 `filterDeadOwners` 的 `pid` 参仅作调用面标识——四条均**报告项 / 待父侧裁定**，非本批实现偏离。

**归册 / 慢门实测（§6 输入 · 需裁定）**：core 新用例 `session-slot-write.test.mjs` 三条身份复核用例实测 **1319.4ms / 1545.5ms / 1838.6ms**（同批其余 21 条 <50ms）——超归册线 500ms 与拦截线 800ms。
核面**无慢测层**：`thincoder-core/package.json` 零 `scripts`、core 树零 `slow*.mjs`（glob 零命中）、CLI 快层 glob = `test/*.test.mjs`（`thincoder-cli/test/run-fast.mjs:19`）**不扫 core** ⇒ 机制上无硬红，
但 §2 §五 V7 末句「本批无重 IO 新用例 ⇒ 无需 `slow()` 归册」与实测**不符**（重 IO 新用例 = 3 条，只是所在层无门）——设计档该句待收正。
**裁定请求**：① 接受现状（core 单层、无门）② 或另批建 core 侧 slow 层（= 新机制 / 新范围，超 §2）。本批未擅自动作。

**越档声明**：本批唯一触碰档 = §四 表内 12 档（含 4 新档）；`docs/TODO.md` 的 `M` 状态**非本批产物**——实读其 diff = 父侧台账同步（本波及批 2–5 的「在途」登记 + 技术待办 11→14 条），实现者全程未写该档（红线③ 未触）。

**移交项（父侧 / designer 面）**：① 设计档 `MULTI-INSTANCE-COLLAB.md:64` 与批档 `:117` 的 `filterDeadOwners(pid, { alive })` 签名未随父裁定（`:66`）更新为 `{ alive, cmdline }`（代码合规、规格滞后）；
② 同族第三处（`thincoder-core/session.mjs:375-386` `newSession` 内联 pid-only 死主清理 + `SESSION.md:127` §6.5）= 已按 §1 边界 1 / §2 停止条件 1 记一行、停、不扩批；
③ §四 行数预计与实读差（`session-slots.mjs` 497 vs 预计 494；`acp-channel.test.mjs` 302 vs 300 软线；无档超 500 硬限）。

**§5 更正（同轮追加 · 逐字读数）**：上方 V5 行所写「`wait-status.test.mjs` 与 CLI 面共 9 条」为笔误——逐档实读计数：`thincoder-core/test/wait-status.test.mjs` = **5 条**（V5①–⑤）· 
`thincoder-cli/test/wait-status-callsites.test.mjs` = **2 条**（V6 三消费点直连核单源 + V6 TUI 状态行行为面）· B3 桥面 = **1 条**（`acp-channel.test.mjs` 的「B3 四可显示相落日志 · warn/未知相零日志」）；
`acp-channel.test.mjs` 全档 = **22 条**（T1–T18 + AC1 / AC3 + B3）。两 CLI 档合计 24 条 = 慢门复跑读数 `tests 24 / pass 24 / fail 0` 一致。

## §6 验证与收口（父代理）

**批次状态：已收口 2026-09-16**（设计 = 轮 1–3 + 修正后复核 pass · 实施 = eng-coder 交付（12 档 · 内部审计 + 代码评审 pass）· 设计档收正轮（#15）三项全落 · 门读数见下）

| # | 核销同步清单（D7） | 收口值 |
|---|---|---|
| 1 | 角色表 | §1 父侧 / §2 eng-designer / §3 评审子代理（轮 1–3）/ §5 eng-coder / §6 父代理——零越段 |
| 2 | 状态行 | 本节「已收口 2026-09-16」 |
| 3 | 计数 | 交付 = 新档 `process-probe.mjs` + `provider/wait-status.mjs`（判据单源）+ 读面/清理面身份复核 + ACP ⟦ev⟧ 形态剥离 + onWait 五相；写集 **12 档**（4 新档）；用例 V1–V7 |
| 4 | 指针 | 三方一致 = 需求 `MULTI-INSTANCE-COLLAB.md` §2（F-MI6）/ `ACP-CLIENT.md` §2（F7） ↔ 设计 `MULTI-INSTANCE-COLLAB.md` §3.1 + `SESSION.md` §6.2 ↔ 本档 §2 |
| 5 | 变更记录 | 签名 `filterDeadOwners(pid, { alive, cmdline })` 三处同步（设计 `:64` · 本档 `:117`/`:119` ↔ 实装 `process-probe.mjs:150`）· V7 末句收正（`:143`，闭合 §5 `:306` 待收正项）· §四 12 行实读刷新（11/12 逐字吻合；`bin/thincoder.mjs` 424→425 系**快照外并发漂移**（批 5 在改该档）⇒ 归最终扫尾统一刷新） |
| 6 | 待办勾销 | 台账 `docs/TODO.md:27`（`peer_instances` 假阳性）+ `:29`（疑似代码缺陷两处——ACP ⟦ev⟧ / onWait）→ **本收口轮内父侧执行**：`已核销` → 移入 `docs/TODO-archive.md` |
| 7 | 台账可见面 | 收口行 = 台账 `--summary` 汇总面输出（组计数与列表同改——D3） |

**发布门（父侧独立实跑）**：core `node --test` **225/225** ✓ · CLI lint ✓ · 快层 **558 pass / 0 fail** ✓ · `test:integration` **26/26** ✓ · 台账机检 0 违规 ✓ · 锚：仓根域 0 悬空、本批两档零新增 ✓（37 条 = CLI 旧档树存量，§六 已声明不触）。
**存量 / 另案**：① 核侧 3 条新用例超 500ms 而 **core 树无慢测层**（机制缺口，台账在册）② 宽度闸 / `test:full` 两处全局红均为存量（归属见批 2/3/4 §6）③ 同源第三处（`thincoder-core/session.mjs` `newSession` 内联死主清理）按停止条件口径记一行、不扩批。
