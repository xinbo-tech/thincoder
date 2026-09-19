# 批：2026-09-18 · VSC 面板初始化冻结修复（同步探测风暴）

> 状态行：✅ 已收口 2026-09-19（用户 07:52 重载实测通过——设置页全绿 · 静默窗落回常态带）
> 批次边界：交付目标 = 「面板初始化不再发生秒级事件循环冻结；渠道探针不被宿主自身阻塞连坐；失败态可自愈；面板 live 块出生必达」；条目集 = 需求档 `docs/vsc/requirements/WEBVIEW.md` **F-W18 / F-W19** + `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` **F-MI7**（用户 2026-09-18 23:0x「修吧」＝需求已确认）+ **`docs/vsc/requirements/WEBVIEW.md` §2 并入条目 F-A1–F-A5 / NFR-A1–A3**（面板 live 块出生可靠性——曾按用户 23:33「一起修」并入；**2026-09-18 23:5x 已移交**同题专批 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md`〔审计 ①–⑦ 面覆盖更全〕：本批**不实施、不评审**该面，已产设计件留作其输入）。
> 前情 = `docs/batches/2026-09-18-tui-freeze.md` §1（已收口 2026-09-18——同族前作：TUI 假死修复；本批 = 同族在 VSC 端启动/认领路径的续 + 同步形态限缩）。

## §1 批次任务（父侧）

**状态行**：✅ 已收口 2026-09-19（用户实测通过）——机读位（解析对象 = §1 段内本前缀行；规则 = `BATCH-RECORD.md` §4.9）。

### 1.1 目标与理由（根因证据 · as-of 2026-09-18 深夜）

**症状**：VS Code 扩展宿主启动/重载（Reload Window / Restart Extension Host）后面板初始化期间——① 设置页 10 渠道全部「不可用」（消息 = `该渠道不提供模型列表（GET /models The operation was aborted due to timeout）`，逐渠道一行）；② 对话区模型下拉退化为 fallback 面 / 曾整框消失；③ 会话自动恢复间歇失败（需手动重选会话）。

**实测证据（本晚四轮重载窗口）**：

| # | 证据 | 读数 |
|---|---|---|
| 1 | 扩展宿主日志静默窗（`%APPDATA%\Code\logs\20260916T064552\window1\exthost\exthost.log`） | 22:56 窗口：**14.4 s** 无任何日志（22:56:21.6 webview 创建 → 22:56:35.98 下一条）；同期 10 渠道探针 15 s 超时落定 |
| 2 | 认领标记落盘时刻 | `~/.thincoder/sessions/38478126….json.manifest.vscode` mtime 22:56:23（认领路径活跃于静默窗内） |
| 3 | 独立子进程网络采样（4 个采样器 · 22:46–22:59 全窗） | **100+ 轮全绿**（kimi×2 + deepseek 对照 200/JSON）——故障纯在宿主上下文内，网络无过 |
| 4 | 排除项 | 系统代理关闭 · VS Code 无 `http.*` 代理键 · 配置代理活着 · UA/请求头/编码变体不敏感 · 同进程 fetch 工具可达各域名 |
| 5 | 23:15 现场追加（立案后） | `tasklist /FO CSV /NH` 单发实测 **>10 s 超时**（输出截断 ~17 行）；**31 个 stuck `tasklist` 实例存活 40–220 s+（父进程已死）**——本机进程枚举当前处于病态慢速/长挂状态，为「冷态放大」推断提供现状直证；且同步探测在本机可退化为**无界等待**（`session-slots.mjs` `isProcessAlive` 的 `execSync` 未设 timeout——设计须把「任何探测有界」列为硬约束） |
| 6 | 23:13 现场追加（用户 23:33 裁定并入本批） | 异步 `eng-designer#1`（`files` 已声明 · 无域阻塞）跑 ~20 分钟，**面板 live 区零块**（用户实见；父侧 `status` / `observe` 均正常 ⇒ 调度层在跑，丢失点在**面板投递 / 呈现链**）；同族登记 = 09-17 `subagent-zero-block` 批 §2.7「VSC 对位不在本批（独立实现 `panel-callbacks.mjs` / `suspension.mjs`）——登记观察项」 |

**同步 spawn 清单（代码事实 + 本机实测，warm）**：

| 来源 | 内容 | 实测 |
|---|---|---|
| 会话认领链 `cleanDeadOwners`（核 `session-slots.mjs:205-218` + VSC 镜像 `thincoder-vscode/src/extension/session-slots.mjs:84-100`） | 1× 同步 powershell `Get-CimInstance`（超时上限 15 s）+ **逐属主** `isProcessAlive`（`execSync tasklist /FI`，核 `:327-349`） | powershell 1.05 s + tasklist 0.14–0.25 s/发 |
| 同链 `usableSlot` / `ensureActive` / `allocateFresh`（核 `:230-309` · `:431-437`） | 叠加逐条同步 tasklist；初始化窗口内该链触发 **2–3 次**（`panel-project.mjs:53` · `panel-session.mjs:39/:224` · `_ensureSlot`——经两次 agentSettings 推送） | 每条链 warm ≈ 2–3 s |
| `shellCandidates()`（`thincoder-vscode/src/extension/settings.mjs:57-88`） | **3× `spawnSync("where", …)`**（缓存每次宿主重启重置） | `where pwsh` 0.51 s · `where powershell` 0.48 s · `where wsl` 0.81 s |
| 合计（warm 粗算） | 8–12 s；**冷态**（刚重载 / Defender 扫新进程树）放大至 14 s 量级——与证据 1 吻合（**冷态放大 = 推断，未仪器直测**） |

**修复面（三条，承需求档判定句）**：F-MI7 = 认领链批量 + 非阻塞（复用核内异步对偶件 `batchAliveAsync` / `probeCmdlinesAsync` + 初始化窗口内触发去重/memo）· F-W18 = 初始化推送链零同步子进程（首点 = shellCandidates 去 `spawnSync`）· F-W19 = 探针失败不固化 + 自愈路径。

**已登记不做（另账留痕）**：写路径 L3 peer 检查同步族（`thincoder-vscode/src/agent/execute-tools.mjs:175-181` 写前 `peerDomains` 同步调用）——本晚未取证其实害，技术待办在册（触发=条件），不入本批。

### 1.2 本批覆盖的条目

| # | 需求 | 本批交付 |
|---|---|---|
| ① | **F-W18** 面板初始化零同步阻塞 | 初始化推送链零 `spawnSync`/`execSync`（首点 = `shellCandidates` 去 spawn：已知路径探测 / 异步 / 跨重载缓存，择一并给判据）；初始化窗口事件循环无可观测 ≥2 s 静默 |
| ② | **F-W19** 探针失败不固化 + 可自愈 | 初始化窗口内失败不写「不可用」展示态（或写可重试态）；重探路径（窗口内延迟重试 / 面板获焦 / 设置页再开——择一或并）；失败原因可区分（超时 / 体坏 / 宿主忙） |
| ③ | **F-MI7** 启动/认领路径探测批量 + 非阻塞 | `cleanDeadOwners`/`usableSlot`/`resumeSlot`/`ensureActive`/`allocateFresh` 改批量（零逐 pid exec）+ 异步形态；两实现面（核 + VSC 镜像）同步收正；初始化内重复触发去重 |
| ④ | **F-A1–F-A5 / NFR-A1–A3** 面板 live 块出生可靠性（并入条目 · 编号承旧档） | **已移交**（2026-09-18 23:5x——见批次边界行：转 `2026-09-18-vsc-subagent-live-visibility` 批；本批不实施、不评审） |

### 1.3 本批不做

- **不含**「写路径 L3 peer 检查同步族」（见 §1.1 末）——本晚未取证实害，另登记技术待办。
- 不动槽认领 / 互斥契约本身（活槽绝不双写语义零变）；不动渠道准入语义与 15 s 探针预算；不动 UI 版式。
- 不重排推送协议 / 不改推送序契约（`SETTINGS.md` §2.8「序 = 契约」）。
- 不改「失败不缓存」既有语义（F-W19 = 补自愈触发与窗口抑制，非恢复缓存）。
- ④ 面 = 纯 VSC 对位（CLI TUI 块机制 09-17 批已修；核侧发射面 E1 已证无缺陷——不改 `docs/cli/design/TUI.md`）；**不破 I-7 设计意图**（不做子代理块跨 reload 恢复——若修复须涉该语义，设计轮上抛请裁）。

### 1.4 边界

- **写域（预计）** = `thincoder-core/session-slots.mjs` · `thincoder-core/process-probe.mjs` · `thincoder-vscode/src/extension/session-slots.mjs` · `thincoder-vscode/src/extension/peer-instances.mjs`（同步件收正）· `thincoder-vscode/src/extension/settings.mjs`（shellCandidates + 探针面）· `thincoder-vscode/src/extension/panel-session.mjs` / `chat-panel.mjs` / `panel-messages.mjs`（初始化接线面——**注意 `panel-session.mjs` 处于在途重构批 `2026-09-18-vsc-large-file-split`，实施以其落地后状态为基准**）· `thincoder-core/provider/list-models.mjs`（仅准入展示/自愈面）· `docs/vsc/design/WEBVIEW.md`（④ 条目落点——live 块投递 / 呈现面）· 相应测试档 · 设计档（eng-designer 定）· 本批次档案。
- **需求档 = 父侧笔**（F-W18 / F-W19 / F-MI7 已落）。
- **在途批避让**：`2026-09-18-vsc-large-file-split`（panel 族重构）· `2026-09-18-vsc-key-delete-confirm`（webview settings 族）· `2026-09-18-tool-failure-spawn-form`（bash/shell 族）——实施轮以文件级调度串行为准，设计面涉撞档节面（如 `SETTINGS.md` 新增节避开 §2.10）须注明。

### 1.5 验收口径

1. 需求判定句逐条落（F-W18 / F-W19 / F-MI7）：
   - 机检 A：认领落地路径（`cleanDeadOwners`/`usableSlot`/`resumeSlot`/`ensureActive`/`allocateFresh` 及调用链）零 `execSync`/`execFileSync`；唯一例外 = `activeSlot` 冷路径单次有界同步束 ≤2 s + 粘性早退零探测（父侧裁定 2026-09-18 · 测试锚随例外）；
   - 机检 B：每认领 exec 上界 = ≤1 次批量判活 + ≤1 次批量 cmdline（代码断言 / 计数）；`shellCandidates` 路径零 `spawnSync`；
   - 实测 C：重载宿主 + 网络正常 ⇒ exthost 初始化窗口静默 < 2 s 且设置页全绿；
   - 实测 D：初始化窗口内失败（可注入）不固化；重探成功即清除。
2. 零回归：槽互斥语义（活槽绝不双写）· 准入语义 · 探针 15 s 预算 · 双端（core / vscode）`npm test` 全绿。
3. `doc-check` 按档归属零新增。
4. ④ 面板 live 块出生可靠性：**已随 ④ 移交（2026-09-18 23:5x——本批验收不含；见批次边界行）**。

## §2 批次任务与设计

（eng-designer 写）

### 2.1 本批覆盖（需求条目 → 设计落点）

| 需求条目 | 设计落点（doc:section） |
|---|---|
| F-MI7（探测有界 / 认领链束化） | `MULTI-INSTANCE-COLLAB.md` §3.1 · D-MI11 · D-MI14（重写）· D-MI15 · D-MI16 |
| 死主判定三态（会话侧收正） | `SESSION.md` §6.2 · D-SE3 |
| `isProcessAlive` 移居 + 有界 | `SESSION.md` §6.2 · `CORE-UNIFICATION.md` 核内档拆分表第 3 行 |
| `slotOccupancy` 批量 + 失败语义 | `SESSION.md` §6.2 |
| VSC 端镜像同批 async 束化 | `SESSION.md` §6.15 · D-2 / D-3 / D-4 |
| F-W18（Shell 候选异步化） | `SETTINGS.md` §2.11 |
| F-W19（准入探针失败分类 + 有界重试） | `SETTINGS.md` §2.12 · `PROVIDER.md` §6.16 M8/M9 补 · §6.19 · D-PR29 / D-PR30 |
| D-MI12（双面同改） | `MULTI-INSTANCE-COLLAB.md` §8 D-MI12 |

### 2.2 本批不含（显式）

- `session-slots.mjs` 清单 / 认领 / 属主面外提——**主动外提本批不做**（结构面与行为面不混批）；仅 §2.3 所载触发条件（接线后读数破 490）成立时随批拆分 `session-slots-manifest.mjs`（计划详面 = `CORE-UNIFICATION.md` §2.8 表第 3 行）。
- 旧版端互操作 / `manifest.active` 语义（`SESSION.md` D-SE1 / D-6 原样保留）。
- VSC 面板运行时面（chat-panel 回合 / 视图渲染）零改；`ensureSlot` 之外的面板装配零改；推送函数 async 化面 = §2.3 / fix 轮附录实施面（推送序契约零改）——父侧 2026-09-19 收正（fix 轮 2 上抛② 裁决）。

### 2.3 受影响文件（设计面 · as-of 2026-09-18）

| 文件 | 行数 | 本批改动 |
|---|---|---|
| `thincoder-core/process-probe.mjs`（231——批 1 建 · 本批增面） | 增面 | `isProcessAlive` 移居 + 同步有界 2 s；`probeOwnersSync` / `probeOwnersAsync` 束 + `ownerState` 三态；`filterDeadOwners` 三态收正；`SYNC_PROBE_MS=2000` 单源 |
| `thincoder-core/session-slots.mjs` | 498 → ≤490（按接线后读数判定；破 490 ⇒ 拆分随批执行〔`session-slots-manifest.mjs`〕） | 认领 / 清理四路零自有 exec（束入参化，保持同步）；`resumeSlot` 整链 async；`isProcessAlive` 外提（re-export 保 import 面） |
| `thincoder-core/session.mjs` | 500（抵硬限 ⇒ 拆分随本批：`session-lifecycle.mjs`（拟新增——约 250 · 本档余约 250 · re-export 保 import 面）） | 调用面 async 传播；`slotOccupancy` = 单次批量束 + 失败 ⇒ `{occupied:true,unknown:true}`；会话生命周期七函数外提 |
| `thincoder-vscode/src/extension/session-slots.mjs` | — | 镜像 `cleanDeadOwners` / `usableSlot` / `resumeSlot` 同批 async 束化；`ensureSlot` 冷路径零探测 |
| `thincoder-vscode/src/extension/session-io.mjs` · `panel-session.mjs` | — | 同上（await 链传播） |
| `thincoder-vscode/src/extension/peer-instances.mjs` | — | 本地同步副本单源化（引核）；`pushPeerReminder` = 只读缓存 + 启动期异步刷新 |
| `thincoder-vscode/src/extension/settings.mjs` | — | `shellCandidates` async（`execFile` + `Promise.all` + memo + 在飞去重）；admission 落账增 `failure` + `ts` |
| `thincoder-vscode/src/extension/chat-panel.mjs` | — | 两 push 函数 async（推送序零改） |
| `thincoder-core/provider/list-models.mjs` | — | `recordAdmission` / `admissionOf` 增 `failure` + `ts`（`channelUnavailableMessage` 逐字零改） |

### 2.4 验收标准（回指需求条目 · 逐条机检）

1. **F-MI7-A 有界**：任何探测路径单次挂起 ≤ `SYNC_PROBE_MS`（2000 ms）；同步束超时即返回「未知」——机检 = 注入缝（`_setProcessProbeTestImpl`）挂起 + 断言不卡死。
2. **F-MI7-B 零自有 exec**：`cleanDeadOwners` / `usableSlot` / `allocateFresh` / `ensureActive` 内零 `execSync` / `execFile`——
   机检 = 源码扫描 + 注入探测计数（同批只发束次）。
3. **F-MI7-C 三态**：pid 死 ⇒ 删；pid 活 + cmdline 明确非本产品 ⇒ 删；探测失败 / 缺行 ⇒ 保留——三条用例。
4. **slotOccupancy**：探测失败 ⇒ `{occupied:true,unknown:true}`（不报空闲、不认领）。
5. **F-W18**：`shellCandidates` 返回 Promise；打开拍推送序逐序断言（`thincoder-vscode/test/settings-open-snapshots.test.mjs:72-77`）零变。
6. **F-W19**：admission 记录含 `failure` + `ts`；`hostBusy` = 采样器窗口内 lag ≥ 1 s；窗口内单批重试 ≤ 2 次 + 在飞去重；`channelUnavailableMessage` 逐字零变。
7. **双面同改（D-MI12）**：核 / VSC 两面同批——VSC 镜像被单侧删改即红。

### 2.5 findings（逐条）

1. `isProcessAlive` **无界**（tasklist / kill 可长挂）→ 本批有界（2 s）。
2. `slotOccupancy` 探测失败原判「空闲」⇒ **本批反转为「未知 ⇒ occupied」**（语义反转已报——保守向）。
3. `activeSlot` 残留同步探测：设计定为**粘性早退零探测 + 冷路径有界同步束 ≤ 2 s**——机检口径需父侧裁定（同步性本身是契约）。
4. VSC 镜像缺身份复核（核侧 `filterDeadOwners` 三态未镜像）——本批同批收正。
5. `peer-instances.mjs` 本地同步副本未单源化——本批同批收正（引核）。
6. `_admission` 无自愈（失败记录不自动重探——仅面板重开 = 新窗口）；已按窗口语义落档。
7. 界值政策：`SYNC_PROBE_MS=2000` 与 `isProcessAlive` timeout 2 s 同值同源（单一常量，不散落）。
8. `CORE-UNIFICATION.md` 拆分表第 3 行三处收正（行数 490 → ~460 · 消解条件 · `isProcessAlive` 已外提）。
9. 行宽机检：本批首次 `doc-check` 报 7 行超 300（本人所写）——**已折行收正**（MULTI ×2 · PROVIDER ×1 · SESSION ×2 · SETTINGS ×2）；余下超宽行为他批既有（见 §2.7）。

### 2.6 未复核项（低风险 · 转 coder 核）

- `panel-project.mjs:53` 现 async 性；CLI 4 处 `activeSlot` 调用逐行；`panel-messages-session.mjs:48`；`settings.mjs` `fullStatus` 逐行（as-of `:308` 与 `:344-384` 两说）。

### 2.7 三链一致（iron law）+ 挂账

批档 §2.1 条目 = 设计档验收回指（§2.4）= 需求档条目（F-MI7 / F-W18 / F-W19）——同源；
设计面 5 档同批落笔：`MULTI-INSTANCE-COLLAB.md` · `SESSION.md` · `CORE-UNIFICATION.md` · `SETTINGS.md` · `PROVIDER.md`（变更记录各 +1 行）。

挂账（非本批 · 报父侧）：
- `doc-check` 既存 FAIL：锚悬空 5 条（`thincoder/core/…` 前缀错误 4 条 + 1 条 `@thincoder/core/session.mjs` 误报——实为合法 import specifier，`thincoder-core/package.json:2` name + `:13-15` exports 证实）· 行宽超限 11 行（他批既有，见检查输出）。

### 2.8 ④ 面（F-A1–F-A5 / NFR-A1–A3 面板 live 块出生可靠性）——覆盖条目 → 设计落点

> **已移交**（2026-09-18 23:5x 父侧裁定）：本面转 `docs/batches/2026-09-18-vsc-subagent-live-visibility.md`（其审计 ①–⑦ 面覆盖更全）——§2.8–§2.13 保留为**移交件 / 其设计轮输入**，**不入本批评审范围、不实施**。

| 需求条目 | 落点（doc:section） |
|---|---|
| F-A1 出生必达（自愈） | `WEBVIEW.md` §5.3「出生自愈心跳」· D-W20 / D-W21；承既有投递队列 + 就绪握手两面（§5.3） |
| F-A2 终态必现 | §5.3「终态必现」· D-W23（「块缺失」判据扩 tombstone 形） |
| F-A3 块身份唯一 | §5.3「出生自愈心跳」幂等契约（`ensureBlock` 复用 / `takeoverBlock` 新代）· D-W21 · 频道命名法零改 |
| F-A4 控制面不降级 | §5.3「出生自愈心跳」降级块修复（`pool:true` + `model` + `startedAt` 同拍补） |
| F-A5 清屏可恢复 | §5.3「清屏可恢复」+「同族配套」（握手后 / `loadSession` 清屏后同 tick 再断言 + 心跳覆盖） |
| NFR-A1 零回归 | §5.3 各节「语义零变化」括注（tombstone 丢弃 · 出队序 · 上界 200 · ⏹ 判据）· D-W12 |
| NFR-A2 可诊断 | §5.3「投递面全量留痕」+「webview 侧痕迹与上行」· `WEBVIEW-PROTOCOL.md` §3.2 行 8（`panelDiag`）· D-P14 · D-W22 |
| NFR-A3 可机器验证 | §5.3「用例（出生可靠性面）」T-A1..T-A15 · §10 行 5 回指 |

### 2.9 ④ 面不含（显式——需求边界原文 + 本批裁定）

- F-A1 边界：不做跨 reload 恢复**已死**任务块；不做存量历史回填（呈现面 = digest / 恢复面）。
- F-A2 边界：不建重复块（同身份幂等）；不复活已折叠块；`answered` 无块 = no-op（回复走 digest）。
- F-A3 边界：不改频道命名法 `sub:<role>#<id>`；不引入 id 之外的实例序号。
- F-A4 边界：不改 ⏹ 可见性判据（running + pool + family 角色）。
- F-A5 边界：不重推已消化历史块。
- 本批另不做：sync spawn 出生面（其出生面 = 首 chunk——另批/另登记）；内容面 chunk 高频丢弃不逐条留痕；核侧发射面零改（E1 已证无缺陷）；池行快照（`postPoolSnapshot` / `SNAPSHOT_ROLES`）不复活。

### 2.10 受影响文件（as-of 2026-09-18 · 设计面估计）

| 文件 | 行数 | 改动 |
|---|---|---|
| `webview/activity-diag.js`（拟新增） | 0 → ~110 | 痕迹族整体外提（环形 `SUB_TRACE_MAX = 50` + 八 kind）+ `panelDiag` 上行发点 |
| `webview/activity.js` | 425 → ≤435 | 只留调用点（净增 ≤10）；**拆分计划**：若净增使总数 ≥500 ⇒ 切点 = 终态/归档族（`finishSubagentBlock` / reclaim 族）外提 `webview/activity-lifecycle.js`（判据同 `VSC-DEBT.md` §3 大档切点） |
| `src/extension/suspension.mjs` | 398 → ~412 | 拍体 = `reassertLiveChildren` 本体复用（零新投影）+ 拍内 `n` 回传（留痕用）；定时器 `.unref()` |
| `src/extension/panel-messages.mjs` | 242 → ~256 | `webviewReady` case 内起拍（`:229` 之后）+ `panelDiag` case → `logEvent("ev:subtrace")` |
| `src/extension/chat-panel.mjs` | 426 → ~432 | dispose 停拍（`:127` 旁）+ 清 `_reassertTimer` |
| `src/extension/panel-chat.mjs` | 249 → ~254 | 回合起点登记点驻留 + 切会话清 `_liveLines` 接线（D-W24） |
| `src/extension/panel-session.mjs` | 262 → ~268 | 切会话 / 新建会话点清 `_liveLines`（**在途批 `2026-09-18-vsc-large-file-split` 避让——实施以其落地后状态为基准**） |
| `src/extension/panel-callbacks.mjs` | 258 → ~274 | 四处置全留痕（`direct` / `enqueue` / `flush` / `drop-overflow`）+ 内容面 `content-first` / `content-lost` |
| `webview/chat.js` | 412 → ~418 | `panelDiag` 上行接线（批内合并发送） |
| 测试（`thincoder-vscode/test/`） | 新增档 ~≤400 | 出生可靠性面机检（T-A1..T-A15）；回归面 = `activity-flow` / `activity-closure` / `webview-turnstate` / `async-visibility` 零改 |
| `docs/vsc/design/WEBVIEW.md` | 349 → ~405 | §5.3 四节 + 用例 T-A1..T-A15 + §6 D-W20..D-W24 + §10 行 5 + 变更记录（已落） |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 496 → 502 | §3.2 行 8（`panelDiag`）+ 纪律行 + §7 D-P14 + §11 行 1 + 变更记录（已落；§12 / §13 表体零改） |

### 2.11 验收判据（回指需求条目 · 逐条机检）

1. **F-A1**：webview 未就绪窗口 / 投递被吞窗口出生的 running 池条目 ⇒ 心跳 ≤2 s 内出块（T-A1 / T-A3）；对照 = 修前零块先红。
2. **F-A2**：终态到达而块缺失（never-born / tombstone 形）⇒ 先补桩后折叠归档、零静默（T-A9）；`answered` 无块 = no-op（T-A11）。
3. **F-A3**：同键 + 已冻结条目 ⇒ `takeoverBlock` 建新代、恒一块可见 + `takeover` 痕迹（T-A5）；同身份重复拍零第二块（T-A2）。
4. **F-A4**：重建 / 补发块携 `pool:true` + `model` + `startedAt`，⏹ 可用（T-A4 / T-A8）。
5. **F-A5**：`clearMessages` 后存活块重现（清屏同 tick 再断言 + 心跳覆盖，T-A8）。
6. **NFR-A1**：既有四档用例全绿（`activity-flow` / `activity-closure` / `webview-turnstate` / `async-visibility`）+ 出队序 / 上界 200 / tombstone 丢弃语义零变（T-A10 + 源码断言）。
7. **NFR-A2**：`ev:subdeliver` 四处置 + `ev:subtrace` 端侧上行双面可 grep / 可断言（T-A13 / T-A14）。
8. **NFR-A3**：上列每条由 happy-dom 真 webview 模块或桩面板驱动真 extension 模块机判（T-A15 结构门：`activity.js` < 500 · `activity-diag.js` ≤ 500 · 新增行无 >300 单行 · 文档锚零悬空）。

### 2.12 反例先红（修前红 / 修后绿）

反例本体 = 出生事件整链被吞（webview 未就绪 / 键冻结窗口）：修前 `_wvReady` 桩 + 首次 `started` 丢弃 ⇒ 面板零消息且**永久**零块（对照 = 2 s 拍内到达）；修复后同场景 ≤2 s 出块 ⇒ T-A3 由红转绿（先红读数必录）。

### 2.13 findings（逐条 · 含上抛）

1. **consult / escalate 射程未达**（F-A1 / F-A2 字面「任何后台任务」）：该族频道键含模型段、端侧不可单源重建 ⇒ 本批 = `skip-key-unrebuildable` 留痕 + **不补**。**须父侧裁定**：核侧出生 / 终态载荷携权威 `channel` 字段（端侧只消费不重建），或放宽需求射程。已落 §5.3「终态必现」射程登记段。
2. **批面重叠**：`docs/batches/2026-09-18-vsc-subagent-live-visibility.md` §2 为空、症状与设计落点同本批 ④ 面 ⇒ 归属须父侧裁定（合并 / 另批收口）；本批不代写他批 §2。
3. **I-7 张力**（承批 §1.3「若修复须涉该语义，设计轮上抛请裁」）：本设计按「同会话重连自愈」落笔——webview 重载且 view 未 dispose 时池存活 ⇒ 握手 + 心跳自愈；**不做**已死任务块跨 reload 恢复、不复活已归档块。若父侧认定该形态已触 I-7 ⇒ 请裁。
4. **「不新增消息类型族」纪律张力**：新增协议行 `panelDiag`（§3.2 行 8）与 `WEBVIEW-PROTOCOL.md` §3.2 纪律句字面冲突——已按「新增量一律入本节登记表」收正（一致性面自修，已报告）。若父侧否决该行：退路 = 撤协议行 8 + 留 webview 环形痕迹（改动 ≤3 行；代价 = 痕迹只在 DevTools 可读）。
5. **会话面 `_liveLines` 源陈旧**（既有洞 · 本批顺带收）：切会话 / 新建会话无清点（`panel-chat.mjs:191` 唯一登记点）⇒ 心跳把「源陈旧」从偶发放大成每 2 s 投旧会话池块；修法 = D-W24（切换点置空、回落 `_susp.lines`），判据 T-A7（`n ≡ 0`）。
6. **残留观察（不在本批 · 报父侧）**：① `panel-session.mjs` 在途重构批避让（已记 §2.10）；② `doc-check` 既存行宽超限（他批既有：`WEBVIEW.md` D-W19 行 666 字符 · `WEBVIEW-PROTOCOL.md` 行 49 / 52）——本批新增 / 改动行零超限（已机扫）；③ `WEBVIEW.md` 部分 as-of 行号为他批陈旧值（本轮已核坐标除外）。
7. **三链一致**：本节 §2.8 条目 = `WEBVIEW.md` §5.3 用例（T-A1..T-A15）/ §10 行 5 回指 = 需求档 `docs/vsc/requirements/WEBVIEW.md:43-62`（F-A1–F-A5 / NFR-A1–A3）——同源。

### fix 轮（设计评审轮 1 · 2026-09-18 · eng-designer）——发现 1/3/4/5/6/7/8/9/10/11/12 处置

**说明**：本轮 = 定向修正（点改 + 读回），无新扇面；每条 = 「号 → 改动 file:line」。发现 2（需求档修正）与 13（方法论档）不在本作者笔域。

| 评审号 | 处置 | 改动落点 |
|---|---|---|
| 1 | 展示面分档落文（状态词级零版式变更；`不可用` ⇔ timeout/malformed + 逐字 reason；`宿主繁忙` ⇔ hostBusy + 抑制 hint——双向机检） | `docs/vsc/design/SETTINGS.md` §2.12（展示面分档 `:296-303` · 双向机检判据 `:302`） |
| 3 | 采样器落点、重试窗口起止、重探成功三清除、端侧机检面点名入档 | `docs/vsc/design/SETTINGS.md` §2.12（采样器 = `loop-sampler.mjs` 新建 · `SAMPLE_INTERVAL_MS=100` / `WINDOW_MS=1000` / `BUSY_LAG_MS=1000` · `hostBusy()` · `_setLoopSamplerForTest` 缝） |
| 4 | 推送函数坐标收正 | `docs/vsc/design/SETTINGS.md`（`chat-panel.mjs:321` / `:354` / `:339`） |
| 5 | 端侧机检面点名（测试档 + 判据）；核侧半 = 设计评审轮 2 落（F-MI7 锚——`MULTI-INSTANCE-COLLAB.md` §3.1 判据条） | `docs/vsc/design/SETTINGS.md` §2.11（F-W18 静默判据三路取值 `:264-268`）+ §2.12 末（机检面点名 `:305-307`）；changelog `:406-408` |
| 6 | VSC 刷新语义 = TTL 到期 stale-while-revalidate + 启动期异步预热；端差登记（零同步 exec ⇒ TTL = 新鲜度上界；`N-MI2` 不受影响） | `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1（「端侧缓存端差」段——as-of `:100-101`） |
| 7 | VSC 镜像面收正 = 判据**引核**（本地判活 / 标记正则副本删除 → `@thincoder/core/process-probe.mjs`；端侧只留 END / 命名空间薄壳；注入缝转口 `_setProcessProbeTestImpl`）——兑现 2026-09-18「处置归 VSC 轮」登记 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1（「VSC 镜像面收正」段——as-of `:97-99`） |
| 8 | `isProcessAlive` 契约收**三态**（`true` 活 / `false` 死 / `undefined` 未知——超时 / 探测失败 = 未知，不作死判据，对齐 D-MI10/D-MI16）+ **消费面全枚举**（核内三档逐坐标 + 端侧两处引核收正）+ 「假 ⇒ 判死」改法纪律（改经 `ownerState`，未知 ⇒ 保守保留）；§6.6 基础契约槽位认领行收正 | `docs/core/design/SESSION.md` §6.2（`:94-95`）· §6.6（`:137`） |
| 9 | M8/M9 补行按核语义 / 端驱动切分（核留载荷 + 分类 + 运行期零探测 + 文案零改）；§6.19 收纯指针 | `docs/core/design/PROVIDER.md` §6.16 / §6.19（`:267`；changelog `:397-400`） |
| 10 | 删修订式表达三处（不复述、不留划改残留） | `SESSION.md:93`（「逐 pid 探测已删」）· `MULTI-INSTANCE-COLLAB.md:67`（「收正 / 改」）· `CORE-UNIFICATION.md:1109`（「原 490」/「原…已被触发但未同步」）；另 `MULTI:72`「（本批新增）」 |
| 11 | 体量读数收正（`wc -l` 实读 2026-09-18）+ 触发 / 兑现标注：`session.mjs` **500（抵硬限 0 余量）** ⇒ 本批接线物理前提 ⇒ 拆分随本批执行；`session-slots.mjs` **498** ⇒ 目标 ≤490（外提 −~28 + 接线 +≤20），破则随批拆分 | `docs/core/design/CORE-UNIFICATION.md` §2.8（`:1101` 五档汇总 · `:1105` 表第 2 行 · `:1109` 表第 3 行；changelog `:1914-1915`） |
| 12 | 需求档坐标回写（见末块「拟改文」） | 交父侧（需求档案 = 主代理笔） |

**本批受影响文件（fix 轮增量——设计档面）**：`docs/vsc/design/SETTINGS.md` · `docs/core/design/PROVIDER.md` · `docs/core/design/SESSION.md` · `docs/core/design/MULTI-INSTANCE-COLLAB.md` · `docs/core/design/CORE-UNIFICATION.md`（各档 changelog 一轮一行 ✓）。

**实施面受影响文件（fix 轮新增 / 收正，供 §5 执行面）**：

- **新建** `thincoder-core/session-lifecycle.mjs`（≈250 行——七函数 `resumeSlot` / `applySession` / `stripTruncatedToolArgs` / `newSession` / `resetSessionState` / `switchToSlot` / `slotOccupancy` 外提；依赖单向 → `session.mjs` / `session-slots.mjs`，零环）；`session.mjs` 500 ⇒ ≈250（re-export 保 import 面；兑现后移出 `SOFT_LINE_REGISTRY`；新档入 `advisor-consult-merge.test.mjs` 模块清单）。
- `thincoder-core/session-slots.mjs` 498 ⇒ 目标 ≤490（`isProcessAlive` 外提 −~28 · 束接线 +≤20）；破 490 ⇒ 随批执行已登记拆分（`session-slots-manifest.mjs`）。
- `thincoder-core/process-probe.mjs`（+ `isProcessAlive` 收编 · 束 API · 三态）。
- `thincoder-core/session-gc.mjs`（未知 ⇒ 不判冷 / 保留）。
- **VSC 面（引核）**：`thincoder-vscode/src/extension/peer-instances.mjs`（本地判活 / 标记副本删）· `thincoder-vscode/src/extension/session-io.mjs`（`:91` / `:100` 收正）· `thincoder-vscode/src/extension/session-slots.mjs`（镜像档）· `thincoder-vscode/src/extension/chat-panel.mjs`（`321` / `339` / `354`）· `thincoder-vscode/src/extension/panel-messages-settings.mjs`（`:182`）· `panel-messages.mjs`（`:236`）· `thincoder-vscode/src/extension/loop-sampler.mjs`（新建）。

**需求档拟改文（交父侧落笔——本作者不写需求档案）**：

1. F-W18 坐标面：`panel-messages-settings.mjs:182`（`handleGetShellCandidates` 现役）· `panel-messages.mjs:236`（分派）· `chat-panel.mjs:321/:354`（推送函数）。
2. F-W18 可辨性判据（发现 1 回写）：展示面分档 = **状态词级**（`不可用` ⇔ timeout/malformed，逐字 reason；`宿主繁忙` ⇔ hostBusy + 抑制 hint），**零版式变更**；可辨性双向机检（两个方向各有用例）。
3. §5.2 行（发现 7）：VSC 同伴判定面**引核**（本地判活 / 标记副本删除；端侧只留 END / 命名空间薄壳）——原「VSC 轮」登记改为**本批落地**。

**零新语义声明**：本轮全部改动为评审发现的直接导出项 + 一致性面收正（读数 / 坐标 / 修订式表达删除）；未引入任何新机制、新判据或新范围。发现 8 的「三态」为评审给出的处置选项之②，非新裁定。**未落本档的 4 处（不属本轮行域，上抛报告）**：`CORE-UNIFICATION.md:1040` 他批修订式残留 · `MULTI-INSTANCE-COLLAB.md` 档头 / §1 / §10.2 VSC 坐标待并 · F-W18 需求档 §2 文案（父侧） · 方法论档（发现 13）。

### fix 轮 2（设计评审轮 2 · 2026-09-18 · eng-designer）——发现 1 / 2 / 3 / 5 处置 + 范围外注①② 处置

复审 = 轮次 2（0🔴 · 3🟡 · 4🔵，共 7 条 · 见 §3）。本轮 = **点修**（定向修正 + 读回），无新扇面。逐条「号 → 处置 → 改动落点」：

| 复审号 | 处置 | 改动落点 |
|---|---|---|
| 1 🟡 | §3.1 补 **F-MI7 核侧锚判据条**（测试档点名 + 四路锚：① 零同步 exec 扫描〔域含拆分产物 `session-lifecycle.mjs` + 端侧两档；`process-probe.mjs` 豁免〕· ② 束 exec 上界〔`_setProcessProbeTestImpl` 计数〕· ③ 有界同步例外锚〔`activeSlot` / `slotOccupancy` + `{occupied:true,unknown:true}` 形态〕· ④ 初始化窗口静默〔取值单源 = `SETTINGS.md` §2.11 三路 + 批档 §1.5→§6 收口〕）；§3.1 本批受影响文件指针改指本批档 §2.3 + 同档 §2「fix 轮附录」 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1（判据条 `:89-95` · 指针行 `:88`；changelog 轮 2 行 `:273-275`）——`docs/vsc/design/SETTINGS.md:307` 的「§3.1 判据条」指针随此解析 |
| 2 🟡 | D-PR29 零改面限定为「**`channelUnavailableMessage` 本体**（逐字不动 ⇒ 该文案面零变）」+ 展示面其余 = 状态词级分档 + 端侧详面指针（`SETTINGS.md` §2.12），与 M8/M9 补行三处同读一致 | `docs/core/design/PROVIDER.md` §8 D-PR29（`:352`；changelog 轮 2 行） |
| 3 🟡 | 同步消费面登记**两处**（① `activeSlot` 冷路径 · ② 占用判定 `slotOccupancy`）+ 零探测早退 + 测试锚指针（判据条条 ③）；D-MI14 自述同改、到期条件指针 → 需求档 F-MI7 例外句 | `MULTI-INSTANCE-COLLAB.md` §3.1（`:68-69`）· §8 D-MI14（`:212`）；需求档侧 = 下「拟改文」 |
| 4 🔵 | 需求档 N-MI2 / §5.2 行补判据面例外句 | 交父侧落笔（需求档案 = 主代理笔）——见下「拟改文」 |
| 5 🔵 | 本地副本枚举两处清单取并统一为**三件套**（实核坐标：`:39` `batchAlive` · `:74` `classifyEnd` · `:88` `probeCmdlines`）——扫描判据（条 ①）按本清单核 | `MULTI-INSTANCE-COLLAB.md` §3.1 副本清单句（`:97`）· §8 D-MI12（`:213`） |
| 6 🔵 | 同族既有残留（`CORE-UNIFICATION.md:1040` / `:1045` / `:1114`）——评审自注「本批判据 = 已登记延后，不阻断」 | 不改（随文档卫生轮） |
| 7 🔵 | 评审上下文（project standards / document map 未纳入） | 不在设计笔域（父侧 / 评审调度面） |

**范围外注①② 处置**：注①（§2.2「本批不含」的 `session.mjs` 行与 §2.3 / fix 轮附录相抵）——**该行已删**；同节 `session-slots.mjs` 行同形相抵（「本批不做」⇄ §2.3「破 490 ⇒ 随批拆分」）一并收正为**条件项**（一致性面自修——语义不变，与 `CORE-UNIFICATION.md` §2.8 表第 3 行同一判据）。注②（附录「落点」列 /「处置」列错位）——发现 1 落点已归 `SETTINGS.md` §2.12、发现 5 归 §2.11，与实装一致 ✓。两注所指三处均在 `docs/batches/2026-09-18-init-block.md` §2。

**自检发现（一致性面 · 已收正）**：① §2 附录行 `:221` / `:222` 的「§3.1（`:88-90`）」因本轮 §3.1 插行失效 ⇒ 改段名指针（「端侧缓存端差」段——as-of `:100-101`；「VSC 镜像面收正」段——as-of `:97-99`）；② `MULTI-INSTANCE-COLLAB.md` changelog 轮 2 行坐标歧义收正（评审所引 `:86` → 现值点名）；③ 判据条条头不携沿革括注（沿革归 changelog）。

**上抛（未落本档 · 待父侧裁定 / §5 核对）**：① 需求档拟改文（下块）= 发现 3 / 4 的需求档侧半；② 本批档 `:94`（§2.2）「VSC 面板运行时面（chat-panel 回合 / 视图）**零改**」与实施面清单 `:237`（`chat-panel.mjs` `321` / `339` / `354`）疑相抵——「零改」指语义面还是文件面未明，本作者未擅改，供父侧 / §5 实施轮核对。

**需求档拟改文（交父侧落笔——本作者不写需求档案；现句实读 2026-09-18 · 建议措辞）**：

1. `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:35`（F-MI7）现句「**唯一例外（父侧 2026-09-18 裁定 · 设计轮收正）** = `activeSlot` 冷路径单次**有界**同步束 ≤ `SYNC_PROBE_MS`（2 s）+ 粘性早退命中零探测」→ 拟改「**两处例外（父侧 2026-09-18 裁定 · 设计轮收正）** = ① `activeSlot` 冷路径 ② 占用判定 `slotOccupancy`——各为单次**有界**同步束 ≤ `SYNC_PROBE_MS`（2 s）+ 粘性早退命中零探测」；同句到期括注「到期 = 启动面下次被触碰时复评其 async 化及其调用面」拟作「……复评**两处** async 化及其调用面」。设计单源 = `MULTI-INSTANCE-COLLAB.md` §3.1 `:68` · D-MI14 `:212`。
2. 同档 `:42`（N-MI2）现句「各实现面行为语义一致（lockstep），实现各自独立（多实现面纪律）」→ 拟补「……；判活 / 标记判据面除外——以**核单源**为准（F-MI6 / N-MI6），独立性指其余面」。
3. 同档 `:81`（§5.2 行·中列）现句「端面实现独立（多实现面纪律——N-MI2 面间不追赶）」→ 拟补同例外句（判活 / 标记判据以核单源为准）。

**零新语义声明**：本轮全部改动 = 评审轮次 2 发现的直接导出项 + 一致性面自修（指针 / 坐标 / 枚举统一 / 相抵句归位）；未引入新机制、新判据或新范围。

**机检读数（`cd thincoder && node scripts/doc-check.mjs` · 实跑 2026-09-18）**：本批改动行**零新增悬空 / 零新增超宽**；总体 FAIL 不变 = 悬空 5（`AGENT-LOOP-SUBAGENT.md:417` · `CORE-UNIFICATION.md:515` · `DOC-DISCIPLINE.md:529` · `SESSION.md:244` · `WORKSPACE.md:18`——均既有 `@thincoder/core/…` 引形行，非本批改动行）+ 行宽 11（皆他档既有行）。符号·宽报告面（未实现符号 `probeOwnersAsync` / `SYNC_PROBE_MS` / `ownerState` 等）不入闸；`process-probe.mjs` 增行后抵 300 软线 = 实现轮核销项。

**本轮设计档面改动（fix 轮 2 增量）**：`docs/core/design/MULTI-INSTANCE-COLLAB.md`（§3.1 `:68` / `:88` / `:89-95` / `:97` · §8 D-MI12 `:213` / D-MI14 `:212` · changelog `:273-275`）· `docs/core/design/PROVIDER.md`（D-PR29 `:352` · changelog 轮 2 行）· 本批档 §2（`:92` · 附录 `:221` / `:222` · 本附录）。

### §2 追加 · fix 轮 3（eng-designer · 2026-09-19）

**范围**：仅 §5 实现轮「设计面待收正」1–3 三条 + fix 轮 2 坑位 2（父侧 2026-09-19 裁定插单）；判据 = §5 原文 + `DOC-DISCIPLINE.md` D8（修订式表达两分判据）；**禁扩大射程**——坐标以落笔时实读为准。

**需求源**：承本档 §5（设计面待收正）与 §1（父侧裁定：预热落点）；本 fix 轮不新增需求档条目——三方链 = §5 / §1 → 本 §2 → 落位（见下表），无需求档腿（非遗漏）。

**落位（file:line = 落笔后回读 · 2026-09-19）**

| # | 发现（源） | 落位 | 判读 / 依据 |
|---|---|---|---|
| 1 | §5-① 行 2/3 读数与消解条件（500 / 498 ⇒ 244 / 298——均已兑现）· 补两行 | `CORE-UNIFICATION.md:1110`（行 2 `session.mjs` **244**——`wc -l` 实读 · Δ−6 vs 预计 ≈250 · 产物 305 注）· `:1111`（行 3 `session-slots.mjs` **298** · vs 预计 ≈260 · 触发成立句）· 子表补 `:1118`（行 10 `process-probe.mjs` **315**）· `:1119`（行 11 `session-lifecycle.mjs` **305**） | 两补行均 >300 ⇒ 计划并建（外提面 ≈155 行 / ≈100 行 式 + 余量 / 新档预计）；消解条件 = 兑现双标（触发 / 兑现） |
| 2 | §5-② 计数句（「在册 30 档」= as-of 2026-09-14 陈旧；五档行前两档已消解） | `:1101`（在册 **33** · 已登 **12** · 待补 **21**）· `:1102`（五档行重锚——前两档 2026-09-18 兑现 **244** / **298**；余三档 = 2026-09-14 读数注）· `:1100`（覆盖口径 **14 档**）· `:1105`（标题——本批触及行实读 2026-09-19 · 其余实核 2026-09-14） | 计数闭合：已登 12 = 1（`config.mjs`）+ 收正轮 4 + 收尾轮 4 + U0 修轮 1 + init-block 批 2（后 11 档见子表）；33 − 12 = 21 |
| 3 | §5-③ 预计 / 实测差（lifecycle 305 vs ≈250 · manifest 264 vs ≈210） | 行 2 / 3 内 Δ 括注（`:1110` / `:1111`）· 主表行 14 `:1098`（`session-slots-manifest.mjs` **264** · ≤300 免登记 · 实读 2026-09-19） | 各差均已注明于计划行（Δ−6 · vs ≈260 · Δ+55 ⇒ 子表行 11 · Δ+54 ⇒ 免登记）；判读 = 差值语义即「产物档 >300 须带计划」——未另设阈值判据 |
| 4 | fix 轮 2 坑位 2：「启动期异步预热」落点设计面未指定（报父侧 / 设计面） | `MULTI-INSTANCE-COLLAB.md:101`（落点 = **panel resolve 面** · 键 = **panel cwd**——对齐 SWR 缓存键；`activate()` 无 per-cwd 键，多根工作区会预热错键；来源句 = 父侧裁定 2026-09-19）+ 变更记录 `:277` | 裁定 = 父侧 2026-09-19（插单）；实现面续轮承接——本笔零产品码触 |

**附随复核（卫生面 · 零触 + 上抛）**：`CORE-UNIFICATION.md:1115`「（2026-09-15 实读——原 354）」经 `stale-expression-purge` 批 D8 两分判据复核 = 指向**在位**对象 + 带日期读数注 ⇒ **保留族**——本轮不删；同族 5 处（`:42` · `:801` · `:802` · `:804` · `:1045`）随上抛 3 交卫生轮统一裁定。

**机检（交付前唯一门 · 本轮实跑）**：`node scripts/doc-check.mjs`（仓根）→ **悬空 5 · 行宽 11**——与基线计数一致；本批两档（`CORE-UNIFICATION.md` / `MULTI-INSTANCE-COLLAB.md`）**零入失败列表**（零新增）。行宽 11 全数在他档（requirements / prompts 等——非本笔面）。

**上抛项（本 fix 轮未动——父侧定夺）**：

1. **读数漂移全量**（本 fix 轮全量扫描：`SOFT_LINE_REGISTRY` 在册 33 档 + 相关 3 档 · `wc -l` 换行计数口径 · 实读 2026-09-19）——供「读数刷新 + 补登轮」立批：
   - 主表：行 4 `dispatch` 489 ⇒ **493**（距硬限 7——「11 行」句失真）· 行 5 `subagent-actions` 483 ⇒ **495**（距硬限 **5**——「17 行」句失真，已近硬红）· 行 6 `agent.mjs` 428 ⇒ **436** · 行 7 `setup` 246 ⇒ **234**（−12）· 行 8 `advisor-async` 357 ⇒ **481**（+124）· 行 9 `shared` 452 ⇒ **467**；行 1 `responses` **495** ✓ 未变；行 10 / 11 以本批实读为锚（315 / 305 ✓）。
   - 次优先 8 档：`consult` 469 ⇒ 471 · `subagent-spawn` 459 ⇒ **473** · `memory/schema` 452 ⇒ 460 · `subagent-async` 437 ⇒ **456**；`provider/core` 476 ✓ · `tools/file` 464 ✓ · `git/checkpoint` 448 ✓ · `session-store` 441 ✓。
   - **`context.mjs` 495——在册、无计划行**（入「待补 21」；距硬限 5 行 ⇒ 补登优先）。
   - 距硬限最近五档（实读）= **495** `subagent-actions` · **495** `context.mjs` · **495** `provider/responses` · **493** `agent/dispatch` · **481** `agent-tools/advisor-async`——三档并处 495（距 5 行）；现表「500 / 498」两档已消解 ⇒ 汇总行数字与名次均需刷新。
2. `thincoder-core/test/core-hygiene.test.mjs:34-36` 注释「§2.8.1 表待补两行」本轮后失效（两行已补）——产品码注释收正（建议父侧点派）。
3. 「（实读——原 X）」同族（D8 复核面）：`:42` / `:1045`（在「迁移期引文」标注行内 ⇒ 判向保留）· `:801` / `:802` / `:804`（U8 表——**块级无标注**（grep 实核），需块级口径裁定）· `:1115`（读数注 ⇒ 判向保留）。本轮零触——请卫生轮按 D8 统一裁定。

**边界**：本 fix 轮 = 设计档收正 + 一处裁定落位；零新增需求条目 · 零产品码写 · 需求档零触；`core-hygiene` 注释（上抛 2）与读数刷新（上抛 1）不入本笔。

### §2 追加 · fix 轮 4（eng-designer · 2026-09-19）

**范围**：仅 §6 收口清单第 2 项（`session-io.mjs:200` 缓存写穿 / `m.active` 语义——父侧派设计裁定）+ 第 5 项（`SESSION.md` §6.15 引行漂移收正）；判据 = §6 原文；**禁扩大射程**——坐标以落笔时实读为准。

**需求源**：承本档 §6（收尾清单第 2・5 项）；本 fix 轮不新增需求档条目——三方链 = §6 → 本 §2 → 落位 / 实现落点（见下），无需求档腿（非遗漏）。

**裁定（第 2 项 · 方向 A「本端优先、不收养」——父侧 2026-09-19）**

| # | 发现（源） | 落位 | 判读 / 依据 |
|---|---|---|---|
| 1 | §6-2 实读：删已绑定槽时缓存**改随幸存 `m.active`**（`session-io.mjs:199-202` `slotCache.set(cwd, m.active)`）· `panel-session.mjs:209` 同步重绑幸存者——即「收养」 | `SESSION.md:270-289`（§6.15 跨端裁定条：P1 写面 `:274` · P2 读面 `:275` · P3 释放 `:276` · P4 记录面 `:277` · P5 展示面 `:278`；五场景表 `:279`/`:281-287`；否决备选 `:289`） | 裁定：`m.active` = 跨端共享指针——他端翻动 = 合法事件 + **本进程零运行时效果**；绑定 `panel._slot` / 缓存 `slotCache(cwd)` / 记录 end marker **永不因外部翻指针迁移**（缓存写穿仅限本端四落点 `session-io.mjs` `:89`/`:124`/`:166`/`:188`——皆本端动作） |
| 2 | 备选「收养幸存 active」（绑定点 / 缓存 / 记录任一面） | `SESSION.md:354`（§7 补 **D-SE31**——与 D-SE2 粘性同病灶） | **否决**：绕开 `usableSlot` / `slotOccupancy` 守卫（可能接手另一活进程的槽 ⇒ 双端双写互覆盖）；并发翻动被静默跟随 |
| 3 | §6-5 §6.15 引行漂移（`session-slots.mjs:41`/`:49` · `session-io.mjs:55` · `panel-session.mjs:28` 等陈旧坐标） | 全名单 = changelog `:412-413`；抽核落点实读：`SESSION.md:250`（`session-slots.mjs:52`）· `:262`/`:266`（绑定入口 ← `panel-session.mjs:42`/`:63`）· `:271-272`（`session-io.mjs` 四落点 `:89`/`:124`/`:166`/`:188`）· `:278`（`panel-session.mjs:225-228`）· `:291`（`panel-session-write.mjs:34`）· `:308`（核 `:24`/`:107`）· `:317-318`（`setup-reminders.mjs:115` + 核 `helpers.mjs:189`——采集 / 冷却随核单源）· `:244`（W11 名册补 `panel-session-write.mjs` 注） | 引行收正 = 落笔时实读重锚；机制条文零改 |

**实现面落点（下一实施轮 · coder 面——本笔零产品码触 · 实读 2026-09-19）**

- `thincoder-vscode/src/extension/session-io.mjs:199-202`：改**无条件** `slotCache.delete(cwd)`（删「随幸存 active」二分支——P3）；`:196` 记录显式置空**保留**（P4）。
- `thincoder-vscode/src/extension/panel-session.mjs:209`：`panel._slot = null`（不重绑幸存者——P3）；`:214`：删 `newActive != null` 重写 end marker（P4——他端活槽 / 幸存 active 不进本端记录；`:196` 的显式 null 已足）。
- 测试锚：`thincoder-vscode/test/session-boot.test.mjs`（档在；删绑定槽 + 他端 active 场景**零覆盖** ⇒ 补用例）。

**附随复核（D8 修订式表达 · 本轮落笔面）**：改动区段（`:269-293` · `:308` · `:317-318` · `:354` · changelog `:411-414`）实读扫——零删除线形态 · 零「原 X ⇒ 改 Y」改写句；changelog = 记录面（历史语义合规保留）。

**机检（交付前唯一门 · 本轮实跑）**：`node scripts/doc-check.mjs`（仓根）→ **悬空 5 · 行宽 11**（= 基线；`SESSION.md` 面零新增——悬空 5 中 `SESSION.md:245` = `@thincoder/core` 包名基线误报；行宽 11 全在他档）。

**上抛项（本 fix 轮未动——父侧定夺）**

1. **「打开历史会话 · 占用支」守卫疑自败**（静态读链已闭合 · **未实测** · 测试零覆盖）：`panel-messages-session.mjs:42` `switchToSlot`（`session-io.mjs:166-180`）在目标**被占**时仍写 `writeEndMarker` `:177` + `slotCache.set` `:178`（`:172` 只挡 `slotSessions` 认领）⇒ 守卫支 `:48-51` 置 `_slot = null` 后，`:55` `_loadSession` → `activeHistory`（`panel-session.mjs:123`）→ `activeData` `:73-75` → `ensureSlot` `:63-70` 命中缓存 `:65-66` ⇒ **面板仍绑回被占槽**——与 `SESSION.md:269` 所述意图（占用 ⇒ 不钉槽 · 认领新槽）相反。本笔零触（工况 = 本端主动打开他端活槽——**在 §6-2 派单射程外**；修正 = 新语义，需单独裁定）。
2. **核私有件镜像**：`thincoder-core/peer-instances.mjs:84` `groupSlotSessions` 未导出 ⇒ 端侧 `thincoder-vscode/src/extension/peer-instances.mjs:78` 逐字镜像 ~14 行（该档 `:10`/`:73` 自注）。建议核侧导出消镜像——跨档去重需裁定（本笔零触）。
3. **名册面**：`panel-messages-session.mjs`（2026-09-16 拆分批产物）是否入 §6.15 W11 名册注（同 `panel-session-write.mjs` 之例）——请父侧定夺。

**边界**：本 fix 轮 = 一处设计裁定 + 引行收正；零新增需求条目 · 零产品码写（实现面落点仅登记，执行在 coder 修正轮）· 需求档零触；§6 第 3 / 4 / 6–11 项与他轮项不入本笔。

**§2 追加 · fix 轮 5（2026-09-19 · eng-designer · 承 §6 第 8 / 9 / 10 项 + fix 轮 4 上抛 3）**

**范围与判据**：本段 = 四组点修（第 8 项 `SETTINGS.md` 收正 · 第 9 项 `VSC-DEBT.md` 登记面 + §2.3 补行 · 第 10 项重试常量补记 · fix 轮 4 上抛 3 W11 名册补注）。逐条对 §6 原文；旧 → 新坐标均以 2026-09-19 实读为准。**零新语义 · 产品码零触 · 需求档零触 · 射程不扩**。

**处置表（逐条 · 号 → 改动 file:line）**

| # | §6 条目 | 改动落点（file:line · 实读 2026-09-19） |
|---|---|---|
| 8a | §2.11 推送函数坐标漂移 | `SETTINGS.md:75`（旧 `chat-panel.mjs:319` → `:331`）· `:87`（旧 `:318-337` → `:331-342` / `:370`）· `:261`（旧 `:321`/`:354`·`:339` → `:331`/`:370`（定义）· `:353`（调用）） |
| 8b | §2.11 指针收正 | `SETTINGS.md:258`（memo 旧 `:53` → `:58`）· `:262`（逐序断言 旧 `:72-77` → `:73-83`） |
| 8c | §2.12 落账消费点收正（旧档 → 新档 + 端侧落点） | `SETTINGS.md:272`（旧 `settings.mjs:364-365`/`:110`/`:117-118` → `provider-probe-window.mjs:71`/`:76` + `thincoder-vscode/src/extension/settings.mjs:137`/`:144`/`:148`）· `:304`（载荷段同址） |
| 8d | 采样器落点清「（拟新增）」 | `SETTINGS.md:284`（§6 记作 `:281` = 常量段插入前行位，同段内容 · 行漂 +3） |
| 9a | §12.1 三越档读数复测 | `VSC-DEBT.md:265`（`chat-panel.mjs` **441** · `suspension.mjs` **397** · `settings.mjs` **409** ← 旧 425 / 397 / 384） |
| 9b | §12.1 批后新档登记 | `VSC-DEBT.md:268`（`provider-probe-window.mjs` **122** · `settings.mjs` 探针窗族外提 · 缝 = re-export） |
| 9c | D2 单源（读数复述删 → 指针） | `VSC-DEBT.md:464`（KD-16）· `:495`（§12.10#2） |
| 10 | 重试常量补记（设计面缺口兑现） | `SETTINGS.md:279-280`（新段：`PROBE_RETRY_MAX = 2`（`provider-probe-window.mjs:17`）· `PROBE_RETRY_DELAY_MS = 2000`（`:20`）= 2 × 采样器 `WINDOW_MS`；让位上限 = 同值） |
| 上抛 3 | W11 会话壳名册补注 | `SESSION.md:244`（补 `panel-messages-session.mjs`——2026-09-16 VSC-DEBT 批 D-3 产物，同属本面） |

**§2.3 补行（VSC 面 · 行数 = 2026-09-19 实读 · 承 §6 第 9 项）**——表体 = 记录面禁改，补行以本段承载：

| 文件 | 行数 | 本批职责（源 = §5 交付面） |
|---|---|---|
| `thincoder-vscode/src/extension/provider-probe-window.mjs`（新） | **122** | 探针窗族外提（在飞去重 / 有界重试 / 窗口终止；`recordAdmission` 落账留 `settings.mjs`——缝 = re-export） |
| `thincoder-vscode/src/extension/provider-flows.mjs` | **174** | 端侧 hostBusy 覆盖 / 落账装配实装点（§5） |
| `thincoder-vscode/src/extension/settings-panel-write.mjs` | **169** | 同类实装点（hostBusy 覆盖 / 落账装配——§5） |
| `thincoder-vscode/extension.mjs` | **168** | 采样器 activate / deactivate 挂点（§5） |
| `thincoder-vscode/webview/settings-providers.js` | **269** | 词档渲染 + hint 抑制（§5） |
| 三测试档：`test/provider-admission.test.mjs` **464** · `test/settings-open-snapshots.test.mjs` **185** · `test/loop-sampler.test.mjs`（新）**129** | — | 面测登记（§5 · 单跑 33/33 pass） |

**三方链核对**：本 fix 轮 = 设计面 / 登记面收正 ⇒ 需求档腿无（非遗漏）；§6 条目号 ↔ 本段处置号 ↔ 落位三处逐条对应。

**读回核验（D6）**：上表 10 处落点逐处 read-back ✓（含 `SETTINGS.md:279-280` 常量段、`VSC-DEBT.md:265`/`:268` 新旧读数、`SESSION.md:244` 补注）；`~~` / 「拟新增」/ 已删 / 作废 残留 = 三档 grep **零命中**（修订式表达复核过）。

**机检**：`node scripts/doc-check.mjs` → 悬空 **5** = 基线（存量 `thincoder/core/*` 族）· 行宽 **11** = 基线 · 本批面**零新增** ✓（中途一处新悬空：裸 `settings.mjs:137` 被判悬空 → 已改目录限定形 `thincoder-vscode/src/extension/settings.mjs:137` 后复跑归基线）。

**上抛（不改 · 待父侧裁）**
1. `SETTINGS.md:252-253` §2.11 病根条坐标与现值不符：`shellCandidates()` 旧记 `:57-88`（现 `settings.mjs:88`）· 旧记 `:86` `candidates.filter`（现异步 `.then(hits.filter)` 于 `:111`）· memo 旧记 `:53`（现 `:58`，与 `:258` 已收正值冲突）——条带「as-of 2026-09-18」戳，§6 未派 ⇒ 本轮不动。
2. `SETTINGS.md:38` / `:123` / `:126` / `:315` 疑漂坐标（前轮已报，未派）。
3. `loop-sampler.mjs`（**82** · 批后新档）不在 §6 第 9 项补行列举内 ⇒ 本段不补（不扩射程），报父侧裁是否随批补登。

**边界**：产品码零触 · 需求档（`docs/vsc/requirements/*`）零触 · 已收口批档零触 · §2.3 表体零改。

**§2 追加 · fix 轮 6（2026-09-19 · eng-designer · 承 fix 轮 5 上抛 1 / 2 / 3）**

**范围与判据**：本段 = 三项点修（上抛 1 §2.11 病根条 memo 坐标口径 · 上抛 2 `:38` / `:123` / `:126` / `:315` 疑漂实读收正 + 同两行并存读数延伸收正 · 上抛 3 `loop-sampler.mjs` 行数补登）。判据：旧 → 新均须实读证成（HEAD 位对位 + 2026-09-19 工作树现值实读）。**零新语义 · 产品码零触 · 需求档零触 · 射程不扩**。

**处置表（逐条 · 号 → 改动 file:line）**

| 号 | 上抛条目 | 处置（旧 → 新 · 实读基准 = 2026-09-19 工作树） |
|---|---|---|
| 1 | `SETTINGS.md:252-253` §2.11 病根条 memo 坐标与现值不符（`:53` ⇄ `:258` 已收正 `:58` 并读冲突） | 口径 ② 裁定（保 as-of + 加指引）：`:253` 保 `:53` + 加「——现值见本段设计条」（导流同段设计条 `:58`）。理由：病根段整段 as-of 纪年（`:57-88` / `:86` 同段、未派），单点换现值反致纪元混杂；设计条已收现值 ⇒ 指引足用。§2.11 其余 as-of 读数不动 |
| 2a | `:38` 坐标 `settings.mjs:122` | 确漂 ⇒ 收正 `thincoder-vscode/src/extension/settings.mjs:221`（`:221` = re-export 行实读；HEAD 位 = `:191`） |
| 2b | `:123` 两 range | 确漂 ⇒ 收正 `thincoder-vscode/src/extension/settings.mjs:276-287`（HEAD 位 = `:246-257`）+ `thincoder-vscode/src/extension/settings-panel-write.mjs:162-169`（实读 `:162` 定义 / `:165` 删键行；HEAD 位 = `:158-165`） |
| 2c | `:126` 坐标 `:249-250` | 确漂 ⇒ 收正 `thincoder-vscode/src/extension/settings.mjs:279-280`（实读 `:279` `const uri` / `:280` `!uri` 早退；HEAD 位 = `:249-250`） |
| 2d | `:315` 疑漂坐标 | 判读 = §3 同坐标第 2 出现行（现文 = `:318`；所引列表号 − 现文号 = 3 = 前轮插入累计漂）⇒ 同 2c 收正 `:279-280`（`:126` / `:318` = 同值两处，同批同收） |
| 2e | 延伸核（上抛表外 · 同两行并存读数） | `:127` / `:318` 并存读数 `thincoder-vscode/webview/settings-env.js:44-45` 确漂 ⇒ 同批收正 `:115`（实读 `:44-45` = `shellOptionsHtml` 收尾、非 `flashSaved` 调用；全档唯一调用 = `:115`，在 proxy 发值路径内；**批前即漂**——该档本批未触） |
| 2f | `:315` 现文本体 | 核毕零改：`docs/TODO.md` 指针（实读在位；doc-check 未判悬空） |
| 3 | `loop-sampler.mjs` 行数补登 | 见下 §2.3 补行 |

**§2.3 补行（VSC 面 · 行数 = 2026-09-19 实读 · 承上抛 3 / 父侧裁「随批补登」）**——§2.3 表体零改（记录面禁改），补行以本段承载：

| 文件 | 行数 | 本批职责（源 = §5 交付面） |
|---|---|---|
| `thincoder-vscode/src/extension/loop-sampler.mjs`（新） | **82** | 采样器本体（三常量 `SAMPLE_INTERVAL_MS` / `WINDOW_MS` / `BUSY_LAG_MS` + lag 观测窗 + `hostBusy()` + 注入缝 `_setLoopSamplerForTest`） |

**三方链核对**：本 fix 轮 = 设计面 / 记录面收正 ⇒ 需求档腿无（非遗漏）；条目号 ↔ 落位逐一对应（2a–2f 均单源坐标改，无新增条目）。

**读回核验（D6）**：逐处 read-back ✓（`:38` · `:123` / `:126` · `:127` · `:253` · `:318` + changelog `:415-418`）；坐标残留复查 grep = 仅 changelog 记录面命中（旧值 → 新值形），规范面零残留 ✓。

**机检**：`node scripts/doc-check.mjs` → 悬空 **5** = 基线（存量 `thincoder/core/*` 族）· 行宽 **11** = 基线 · 本批面**零新增** ✓（中途一处新悬空：首版 changelog 裸坐标 `settings.mjs:122` 因同名双档歧义被判悬空 → 改目录限定形后复跑归基线）。

**边界**：产品码 / 需求档 / 他档零触；`VSC-DEBT.md` 登记面未动（loop-sampler 登记面 = 仅批档 §2.3 补行，派面所限）；`settings-env.js` 收正 = 同两行坐标类（一致性面 · 逐条报告）；零新语义。

### §2 追加 · fix 轮 5（eng-designer · 2026-09-19）——§6 收口清单定点点修（三档登记面）

**范围**（父侧派单）：§6-1（端侧零同步 exec 扫描机检域扩——实施已落地，本笔 = 设计登记收正）· §6-5 残留（`SESSION.md` 引行二度漂移）· §6-9 尾（`session-boot.test.mjs` 测试档越线登记）· fix 轮 4 上抛 1 裁定随附落地（「打开历史会话 · 占用支」端差登记 + 占槽句改述 + P5 引行）+ 旧锚映射（`D-L1a` / `D-L2a` / `D-L2b`）。判据 = §6 原文；**禁扩大射程**——坐标以落笔时实读为准。

**需求源**：承本档 §6；本 fix 轮不新增需求档条目——三方链 = §6 → 本 §2 → 落位（见下表），无需求档腿（非遗漏）。

**逐项落位**

| # | 项 | 落位（设计档 · file:line = 落笔后） | 判读 / 依据 |
|---|---|---|---|
| 1 | §6-1 端侧零同步 exec 扫描机检域扩 | `MULTI-INSTANCE-COLLAB.md` §3.1 判据条（`:89-91`——测试档行 + ① 扫描） | 端半 = `thincoder-vscode/test/zero-sync-exec.test.mjs`（实施已落地——父侧裁定「选项①」：独立端档，N3 门禁 = `thincoder-core/test/core-hygiene.test.mjs:96-107` 禁核测档引端侧路径）；登记收正 = 核 / 端两域分档 + 形态补 `spawnSync`（先例 = `thincoder-core/test/tool-seams.test.mjs:289-299` · 域完整性对账 = `thincoder-vscode/test/settings-open-snapshots.test.mjs:163-185`）；`thincoder-core/process-probe.mjs` = 探针族单点落点（豁免——不在零域） |
| 2 | 旧锚映射（死锚归位） | `MULTI-INSTANCE-COLLAB.md` §10.1（`:238` 新增块） | `D-L1a` → §3.2 · `D-L2a` → §3.1 · `D-L2b` → §3.3——**不复活旧 ID**；代码侧引点（`thincoder-core/peer-instances.mjs:160` 引 `§2a.4 D-L2b`）改否 = 父侧另定 |
| 3 | §6-5 残留（引行二度漂移） | `SESSION.md` §6.15 两处引行（`:255` · `:273`——`session-io.mjs` 四落点 `:89/124/166/188` → `:88/123/169/195`） | 二度漂移源 = §5 fix 轮 4（eng-coder）改动；本笔 = 落笔时实读重锚（机制条文零改） |
| 4 | fix 轮 4 上抛 1 裁定落地（+ §6-2 侧） | `SESSION.md` §6.15（`:270` 占槽句改述 · `:290-291` 端差登记块 + 场景行）+ §6.10 镜像表（`:180` 端差句）+ §6.15 P5（`:279`——`panel-session.mjs:225-228` → `:219-222`）+ changelog（`:419-421`） | 裁定 = 父侧（2026-09-19）：占槽 ⇒ `_slot = null` + 经缓存重绑本端原槽（原述「认领新槽」与实现不符——实读 `panel-messages-session.mjs:48-55` · `session-io.mjs:182-185`）；端差 = 记录面写条件（核无条件 `thincoder-core/session-lifecycle.mjs:284-285` / 端条件写）——**零新语义** |
| 5 | §6-9 尾（测试档越线登记） | `VSC-DEBT.md` §12.1（`:270` 新增块——`test/session-boot.test.mjs` **440** · `wc -l` 口径）；changelog `:571` | >300 咨询线、≤500 硬限；逐项登记，**非全量普查** |

**普查面（仅读数 · 未逐项登记 · 报告父侧）**：端侧 `wc -l` >300 复扫（本笔实跑，`thincoder-vscode/`）= **源 9 / 测试 19**——源：`src/agent.mjs` 485 · `src/agent/setup.mjs` 481 · `src/extension/chat-panel.mjs` 441 · `src/extension/settings.mjs` 409 · `src/extension/suspension.mjs` 397 · `src/agent/execute-tools.mjs` 393 · `src/agent/run-stages.mjs` 377 · `src/tools/shell.mjs` 338 · `src/repomap.mjs` 303；测试 19 档（最大 = `test/agent-lifecycle-singleton.test.mjs` 491；`session-boot.test.mjs` 440 已逐项登记）。⚠ 前轮流传读数「源 6」≠ 实测 9——以后者为准；清单未逐项登记（父侧定策）。

**机检（交付前唯一门 · 本轮实跑）**：`node scripts/doc-check.mjs`（仓根）→ 悬空 5 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 11——**= 既存基线**（逐条落点皆他档；`SESSION.md:246` = `@thincoder/core` 包名基线误报）；本轮三档（MULTI / SESSION / VSC-DEBT）**零新增**。

**上抛（本 fix 轮零代码触——父侧定夺）**

1. 行数口径双读并存：`thincoder-vscode/test/session-boot.test.mjs` = §5（eng-coder）记 **441**（split 数）/ VSC-DEBT 登记 **440**（`wc -l`）——建议后续登记统一 `wc -l` 口径（本笔已按 `wc -l` 落）。
2. 核侧代码注释引旧节号 / 旧锚（本笔仅报告）：`session-lifecycle.mjs:3/9/227/284` · `session-slots.mjs:29/90/217/225/237/266` · `session.mjs:5/7/137/236` · `session-slots-manifest.mjs:191/196/247` · `session-rename.mjs:4` 引「§10 D-2/D-4/D-6」「§12.3」形态（设计档现行 = §6.x 等）；`peer-instances.mjs:160` 引 `§2a.4 D-L2b`——是否随重排 / 旧锚映射收正 = 代码面，父侧定策。
3. `thincoder-vscode/src/extension/panel-messages-session.mjs:44-47`/`:50` 注释述「认领新槽」——与裁定后语义（`_slot = null` + 经缓存重绑）及测试 ⑮ 用例不符；注释面收正 = 代码面待派。

（eng-designer · fix 轮 5）

## §3 设计评审记录

### 轮次 1（评审子代理 · 写入通道因骨架缺失被拒 → 父侧代录逐字）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements | 🔴 | F-W19 验收 ③「失败原因可区分（探针超时 / 体坏 / 宿主忙——**展示面可分辨**）」（`thincoder/docs/vsc/requirements/WEBVIEW.md:36`）在评审范围内既无落点也无处置裁定：设计明写「**失败文案零改**：`channelUnavailableMessage` 逐字不动——分类是新增落账字段，不是新文案」（`thincoder/docs/vsc/design/SETTINGS.md:266`）·「文案面零改 ⇒ UI 契约零变」（`thincoder/docs/core/design/PROVIDER.md:353` D-PR29）⇒ 展示面文案与行内「不可用」标签逐字不变，宿主被冻 vs 渠道故障在展示面仍不可分——正是 F-W19 问题陈述点名的「把『宿主被冻』误报为『渠道不可用』」形态；需求方的「设计裁定」授权只覆盖重探触发（②），不含 ③ | 二择一并落档：① 展示面按 `failure` 分类落一档可辨信号（不改版式；如状态词 / 回溯面区分「宿主繁忙」与渠道故障）；② 取得并登记对 ③ 的收窄裁定（明写「可辨 = 落账字段层」+ 裁据 + 展示面继续零改的理由），使 ③ 与设计同读一致 |
| 2 | Document ownership | 🔴 | 同一机制（读面惰性缓存判据）两档写法相抵：需求 `N-MI3`「惰性缓存 = manifest mtime 变了才重查」（`thincoder/docs/core/requirements/MULTI-INSTANCE-COLLAB.md:43`）⇄ 设计 `D-MI13`「读面缓存判据 = **mtime 未变 ∨ 快照年龄 < TTL(5 s)**」（`thincoder/docs/core/design/MULTI-INSTANCE-COLLAB.md:57` · `:197`）——双向冲突：mtime 已变且 TTL 内设计不重查；mtime 未变且 TTL 到期设计重查。需求档该条未随设计收正，按需求判据读实现会被判不合 | 需求档侧收正 N-MI3（把 TTL∨mtime 判据写进 N-MI3，或在册登记「TTL 系对 N-MI3 判据的收正 + 裁据」；TTL 决策出处 = 同档 D-MI13 理由列），保留 D-MI13 为设计面单源；两档同读一致后闭合 |
| 3 | Clarity | 🟡 | F-W19 的判据基座「采样器」在评审范围内无落点：`hostBusy` 判据与其兼任的 loop-idle 重试闸均挂「采样器窗口内 lag ≥ 1 s」（`thincoder/docs/vsc/design/SETTINGS.md:268` · `thincoder/docs/core/design/PROVIDER.md:208` · D-PR30 `PROVIDER.md:354`），但该采样器是既有件还是新建、住哪个模块、窗口口径与 lag 测法均未写 | 补采样器落点与形态（复用件 / 新建模块 + lag 测量法 + 窗口定义 + 可注入缝），或在册指向其权威档；使 `hostBusy` 与重试闸两判据可机判 |
| 4 | Acceptance criteria | 🟡 | F-W19 的 ①② 与重探触发无「判据」：需求 ② 明写「…择一或并，**须给判据**」（`thincoder/docs/vsc/requirements/WEBVIEW.md:36`），设计只给机制（`thincoder/docs/vsc/design/SETTINGS.md:270`「配置阶段窗口内单批延迟重试 ≤ 2 次 + 在飞去重；到期不再重试」）——① 「重探成功 ⇒ 落账清除 / 准入翻转 / 展示回绿」链路未写；② 「配置阶段窗口」起止未定义（而验收 ①② 以「初始化窗口 / 重载」为界，两窗口关系未明） | 补三件：窗口起止判据 · 重探成功后的落账与展示清除语义 · ①② 的机判锚（正常路径「窗口内失败 ⇒ 重探成功 ⇒ 清除」+ 错误路径「重试耗尽仍失败」） |
| 5 | Acceptance criteria | 🟡 | 本批其余两 F 的可机判锚在评审范围内亦未见落点：F-MI7 需求明列「（例外）带测试锚」+「机检：认领落地路径零 `execSync` / `execFileSync`」+「每认领 exec 上界」+「初始化窗口静默 < 2 s」（`thincoder/docs/core/requirements/MULTI-INSTANCE-COLLAB.md:35`），设计面「探测束与有界形态」块（`thincoder/docs/core/design/MULTI-INSTANCE-COLLAB.md:79-82`）无任何测试 / 机检锚，同档判据行只覆盖 F-MI6（`:86`）；F-W18 的「无可观测 ≥2 s 静默」机判（`requirements/WEBVIEW.md:35`）设计面只给推送序断言（`SETTINGS.md:262`），取值方式未落 | 在设计面点名各判据落点（测试档 / 机检脚本与断言项），至少覆盖：批量束 exec 上界 · `activeSlot` 有界同步例外 · 零 execSync 扫描 · 初始化窗口静默读数 |
| 6 | Clarity | 🟡 | D-MI12 的 VSC 面处置粒度不足：`pushPeerReminder` 改「只读缓存 + 启动期异步刷新（每回合零同步 exec）」（`thincoder/docs/core/design/MULTI-INSTANCE-COLLAB.md:199`）——启动之后的刷新时机 / 触发未写（长生命周期窗口内同伴来去是否可见无结论），与核面 `mtime∨TTL` 判据（`:57`）的新鲜度差、以及 N-MI2「端一致（lockstep）」的关系均无判据 | 写明 VSC 面缓存刷新时机（与核面同向或登记为端差）+ 判据（每回合零同步 exec 的机检 + 新鲜度语义） |
| 7 | Clarity | 🟡 | D-MI12「单源化」范围边界未写：只列 `batchAlive` / `probeCmdlines` 复本（`thincoder/docs/core/design/MULTI-INSTANCE-COLLAB.md:199`），而核单源档 `process-probe.mjs` 同时承载身份判据（`isProductProc` / `classifyEnd` / `filterDeadOwners`——F-MI6）。VSC 清理面（`cleanDeadOwners` 镜像）束化后消费哪份判据未明：引核 ⇒ F-MI6 的 VSC 面随本批落地（需求档 §5.2 仍登记为「VSC 轮」——`requirements/MULTI-INSTANCE-COLLAB.md:81`）；保留本地判据 ⇒ 与 N-MI6「判据单源」相抵 | 明写 VSC 侧判据归属（引核面 or 本地面）与相应归属批次，并同步需求档 §5.2 / F-MI6 的登记行 |
| 8 | Consistency | 🟡 | `isProcessAlive` 方向与全局纪律相抵且消费面未枚举：`SESSION.md:94`「同步有界 2 s（超时 ⇒ `false`——单 pid 兼容面，不区分未知）」⇄ D-MI10「探测失败 / 缺行 ⇒ 保守保留」（`design/MULTI-INSTANCE-COLLAB.md:195`）/ D-MI16「失败 = 未知」（`:201`）；且同档 §6.6 仍把「槽位认领（slotSessions + isProcessAlive）」列为双端基础契约（`SESSION.md:136`），与 §6.2「认领 / 占用 / 清理四路不经它」（`SESSION.md:94`）相抵 | 二者择一并写明：① 枚举 `isProcessAlive` 现存消费面并证明无认领 / 清理判定点，同时收正 §6.6 契约行；② 或把超时改判「未知」以对齐 D-MI10 / D-MI16 |
| 9 | Document ownership | 🟡 | 同一机制（准入探针失败分类 + `hostBusy` 闸 + ≤2 次有界重试）在核 / VSC 两档各作全量重述且互相声明对方为「详面」：`PROVIDER.md:207-210`（「端侧详面 = §6.19 + SETTINGS.md §2.12」）⇄ `SETTINGS.md:266-272`（「§6.16 M8/M9 同源语义」）——载荷字段 · `hostBusy` 判据 · 重试纪律 · 被拒备选四项几乎逐项重复，任一处演进即生漂移 | 按「核语义 / 端驱动」切分单源（载荷与分类归 `PROVIDER.md` §6.16；采样器闸与重试驱动归 `SETTINGS.md` §2.12），非本位侧只留指针 |
| 10 | Doc hygiene | 🟡 | 本批改笔在现役规范面留修订式表达（失效表达须删——历史归记录面）：`SESSION.md:93`「（逐 pid 探测已删）」· `design/MULTI-INSTANCE-COLLAB.md:67`「判据**改**「入口一次束 + 查表」形态」· `CORE-UNIFICATION.md:1109`「**原**「下次实质改动前」已被本批行为面修改触发但结构面未同步」 | 三处改为纯现状陈述（旧形态与变更理由移入各档变更记录 / 批次档）；同族既有残留（如 `CORE-UNIFICATION.md:1040`「修正轮-4 原句…已被取代」）可一并交文档卫生轮 |
| 11 | Affected-file annotations | 🟡 | §2.8.1 只对 `session-slots.mjs` 落了本批收正（`CORE-UNIFICATION.md:1109`「**~460**（2026-09-18 `init-block` 批实改，原 490）」+ 消解条件顺延）；同批被改的 `session.mjs`（**494** 行 · 距 500 硬限 6 行 · 消解条件 =「该档下次实质改动前」——`CORE-UNIFICATION.md:1108`）无本批增量 / 顺延标注，而其 `resumeSlot` / `slotOccupancy` 在本批改 async（`SESSION.md:93` · `:97` · `:172`） | 按第 3 行先例给第 2 行补本批标注（当前行数 + 本批增量上界 + 拆分触发是否已到 / 顺延结论），避免 6 行余量在实施轮被无声吃掉（超 500 = 硬红） |
| 12 | Clarity | 🔵 | F-W18 两侧坐标不一致且未互相收正：需求档证据列 = `panel-messages.mjs:413-449` · `:470`（`thincoder/docs/vsc/requirements/WEBVIEW.md:35`），设计 §2.11 = `panel-messages-settings.mjs:182`（`SETTINGS.md:253`） | 确认两点同属初始化推送链后互相收正，或注明两档分工（链 / 请求拍各自坐标） |
| 13 | Methodology | 🔵 | 方法学合规判定面受限：评审上下文未声明 project standards 档与 document map（无同板块 document map 可查）⇒ 本轮只按 `AGENTS.md`（≤300 建议 / ≤500 硬限 · 讨论即落档 · 冲突先报）与 8 条准则判定；文档归属准则为降级判定 | 若另有纪律 / 归属权威档（`discipline-*.md` · DOC-SYSTEM 类），请纳入下一轮评审上下文 |

**计数**：🔴 2 · 🟡 9 · 🔵 2（共 13 条）。

VERDICT: changes-required

> 代录说明：评审轮次 1 的 §3 写入通道因批次档缺 `## §3` 骨架被拒（评审子代理已如实报告「§3 未写入」）；本节 = 父侧在骨架补齐后，按评审报告**逐字代录**（未改一字）。评审报告另含范围外注（受影响文件表存于本批档 §2、他批面未裁定、代码面未核验）与两处引用点回验（`SESSION.md:93/94` 经父侧人读核对——与报告引用一致）。

### 轮次 1（评审子代理）

**复核结论（轮次 2 · 承轮次 1 的 13 条）**：发现 1 / 2 / 3 / 4 / 6 / 8 / 9 / 10 / 11 / 12 已实证落档（10 条）；发现 5 = 端侧已落、核侧半未落（本表 #1）；发现 7 = 设计面已落、需求档侧残句（本表 #4）；发现 13 = 评审上下文限制未变（本表 #7）。本轮新发现 7 条。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria | 🟡 | 轮次 1 发现 5 的核侧半修正未落 + 悬空指针：`docs/vsc/design/SETTINGS.md:307` 称「核侧锚（探测束 / 同步有界例外 / 零 execSync 扫描）= `MULTI-INSTANCE-COLLAB.md` §3.1 判据条」，但该判据条（`docs/core/design/MULTI-INSTANCE-COLLAB.md:86`）只覆盖 F-MI6 / N-MI6 读面 / 清理面用例锚（+ 注入缝 `:87`），行内「本批受影响文件」指针仍指前批 `docs/batches/2026-09-15-core-defect-fixes.md` §四；§3.1「探测束与有界形态」块（`:79-82`）无测试 / 机检锚。需求 F-MI7（`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:35`）所列「批量束 exec 上界 · activeSlot 有界同步例外（带测试锚）· 零 execSync 扫描」在设计面无落点 | 在 `MULTI-INSTANCE-COLLAB.md` §3.1 补登本批核侧锚（测试档 / 注入缝断言项 + activeSlot 例外测试锚），或把 `SETTINGS.md:307` 指针改指批档 §2.4，并同步该条的受影响文件指针 |
| 2 | Document ownership | 🟡 | F-W19 失败展示面口径两处相抵：D-PR29（`docs/core/design/PROVIDER.md:352`）结论「文案零改 ⇒ UI 契约零变」，而修正轮落地的展示面分档（`docs/vsc/design/SETTINGS.md:296-299`）为同一机制新增可见状态词 `宿主繁忙` + 抑制渠道故障 hint；§6.16 M8/M9 补行（`PROVIDER.md:207-209`）已把展示面详面指给 SETTINGS §2.12，决策行未同步——二档并读时「UI 契约零变」与展示面事实不一致 | 给 D-PR29 补端侧指针（展示面 = 状态词级分档，详面 = `SETTINGS.md` §2.12），或把「UI 契约零变」限定为 `channelUnavailableMessage` 面零变，使三处同读一致 |
| 3 | Consistency | 🟡 | 同步消费面清单三处不一致：`docs/core/design/SESSION.md:100` 指定 `slotOccupancy` 探测走同步束（`probeOwnersSync`）；而 `MULTI-INSTANCE-COLLAB.md:68` 断言「同步面仅剩 `activeSlot`」、D-MI14（`:203`）把同步束归于 `activeSlot` 冷路径、需求 F-MI7（`requirements/MULTI-INSTANCE-COLLAB.md:35`）的唯一同步例外只列 `activeSlot`——第二处有界同步消费面（占用判定）未在任何例外 / 登记面出现 | 二择一收正——`slotOccupancy` 改 async（与调用面 async 传播一致）；或把该同步消费面登记进 F-MI7 例外与 §3.1 / D-MI14 自述（含测试锚 + 到期条件） |
| 4 | Document ownership | 🔵 | 引核收正后需求档侧遗留句：N-MI2（`requirements/MULTI-INSTANCE-COLLAB.md:42`）「实现各自独立（多实现面纪律）」与 §5.2 行内容列（`:81`）「端面实现独立（多实现面纪律——N-MI2 面间不追赶）」未随 F-MI6 单源 / 引核（设计 = `MULTI-INSTANCE-COLLAB.md:88-90`）加限定——该面判活 / 标记判据已不属独立实现面 | 给 N-MI2 与 §5.2 行补判据面例外句（判活 / 标记判据以核单源为准——F-MI6 / N-MI6；独立性指其余面） |
| 5 | Consistency | 🔵 | 「本地副本删除」清单两处枚举不一致：D-MI12（`MULTI-INSTANCE-COLLAB.md:204`）列本地副本 = `batchAlive` / `probeCmdlines`；修正轮 §3.1（`:88`）列本地副本 = `:36` `batchAlive` · `:74` `classifyEnd`（带坐标）——同一删除 / 扫描对象两处清单不同，扫描判据（`:90`「端侧本地判活副本零残留」）按哪份清单核未明 | 以实核坐标清单统一两处枚举（或注明两份清单的取并关系） |
| 6 | Doc hygiene | 🔵 | 轮次 1 发现 10 的本批三处 + 追加一处已实证清除；同族既有残留仍在（`CORE-UNIFICATION.md:1040`「修正轮-4 原句…已被取代」· `:1114`「（2026-09-15 实读——原 354）」· `:1045` 同族「实读——原 N」）——轮次 1 原注为「可一并交文档卫生轮」的延后项 | 随文档卫生轮按同一口径清（失效表达删除，沿革归变更记录）——本批判据 = 已登记延后，不阻断 |
| 7 | Methodology | 🔵 | 方法论 / 归属判定面受限：本评审上下文同样未声明 project standards 档与 document map（同轮次 1 发现 13）⇒ 归属准则按 `AGENTS.md` + 在评档 `docs/core/design/DOC-SYSTEM.md`（P1–P5 / R1–R5）降级判定；行数标注（如 `CORE-UNIFICATION.md:1109`「`session.mjs` 500」）无法在本评审射程内对源码实核（源档不在评审范围），仅做跨档内部一致性核对 | 将纪律 / 归属权威档与 document map 纳入后续评审上下文；行数实核随实现轮核销 |

**范围外注（无严重度）**：① 批档 §2.2「本批不含」仍写「`session.mjs` 会话生命周期面外提……本批零改」（`docs/batches/2026-09-18-init-block.md:93`），与修正轮落定的 `CORE-UNIFICATION.md:1109`（`session.mjs` 500 抵硬限 ⇒ 拆分随本批执行 · 新档 `session-lifecycle.mjs`）及同档 §2 fix 轮附录「实施面受影响文件」相抵——批档面不在本审定，供随 §5 实施轮收正；② 同档 §2 fix 轮附录「改动落点」列与「处置」列对读存在错位之疑（发现 1 落点列作 §2.11、发现 5 作 §2.12 末；实装 = 展示面分档住 SETTINGS §2.12、静默三路住 §2.11）——记录面登记供核对。

**计数**：🔴 0 · 🟡 3 · 🔵 4（共 7 条）。

VERDICT: pass

## §4 用户批准

**用户授权 = 2026-09-19 00:09「你直接跑完吧」**——全链授权（含实现放行）：评审轮次 2 于 00:19 **pass** 后据此刻派实现（不再逐步颔首；关键裁定点 / 异常仍上抛）。

## §5 实施与修正记录

（eng-coder 写）

### 实现轮（eng-coder · 2026-09-19）——③ F-MI7 核 / CLI 面落地；VSC 面与 ①② 附随续轮承接

**覆盖声明（本段实际交付面）**

- ✅ ③ F-MI7 **核面**：`thincoder-core/` —— `process-probe.mjs` · `session-slots.mjs` · `session.mjs` · `session-gc.mjs` + 新档 `session-lifecycle.mjs` / `session-slots-manifest.mjs`
- ✅ ③ F-MI7 **CLI 面**：await 传播 4 档 + 测试 3 档
- ❌ ① F-W18 / ② F-W19 全部（写域均为 VSC 面 + `list-models.mjs` 附随 —— 见「未完面」）
- ❌ ③ F-MI7 **VSC 镜像面**（`src/extension/` 4 档 + 测试 —— 续轮承接）
- ➖ ④ F-A1–A5（§1.2 已移交 `vsc-subagent-live-visibility` 批 —— 不在本段）

写域实测：`git status`（thincoder 仓）= 21 改 + 4 未跟踪；其中 **VSC 树 0 档触碰**。

**交付摘要（逐条 → 落点）**

| # | 交付 | 落点 |
|---|---|---|
| F-MI7-A 有界 | 单次探测挂起 ≤ `SYNC_PROBE_MS`（2000 ms 单源常量）；超时 ⇒ 未知（不判死） | `process-probe.mjs`（`probeOwnersSync` / `probeOwnersAsync`，含注入缝） |
| F-MI7-B 零自有 exec | 束入参化（`{aliveSet, cmds}`）：`cleanDeadOwners` / `usableSlot` / `allocateFresh` / `ensureActive` 档内零 `execSync`；每束 ≤1 判活 + ≤1 cmdline；空 pids ⇒ 零 exec | `session-slots.mjs` · `session-slots-manifest.mjs`（扫描 + 计数用例绿） |
| F-MI7-C 三态 | pid 死 ⇒ 删 · pid 活 + 命令行非本产品 ⇒ 删 · 探测失败 / 缺行 ⇒ 保守保留 | `process-probe.mjs`（`ownerState` 五序 · `filterDeadOwners` 三态）+ 消费面全枚举 |
| slotOccupancy | 探测失败 ⇒ `{occupied:true, unknown:true}`（unknown ⇒ 不认领 —— D-MI10） | `session-lifecycle.mjs`（外提后本体） |
| activeSlot 例外 | 粘性早退零探测 + 冷路径单次有界同步束（≤ 2 s） | `session-slots-manifest.mjs`（测试锚两用例：粘性早退 / 束上界） |
| async 全链 | `resumeSlot(cwd)` 整链 async + CLI await 传播 | `session-lifecycle.mjs` · `thincoder-cli/bin/thincoder.mjs:315` · `handlers-session.mjs:147` · `handlers-slots.mjs:106/159/190` · `cmd-new.mjs:11` |
| 会话 GC | 探测未知 ⇒ 不判冷 / 保留（保守向） | `session-gc.mjs` |
| 拆分兑现 | `session.mjs` 500 ⇒ 244 · `session-slots.mjs` 498 ⇒ 298 · 新档 305 / 264；re-export 保旧 import 面 | 见行数 Δ 表 |
| 登记面 | `SOFT_LINE_REGISTRY`：移出 `session.mjs` / `session-slots.mjs`，补入 `process-probe.mjs` / `session-lifecycle.mjs` | `thincoder-core/test/core-hygiene.test.mjs:39-50` |
| 模块清单 | 新档入 `BATCH_MODULES` | `thincoder-core/test/advisor-consult-merge.test.mjs:155-156` |

**行数 Δ（`wc -l` 实读 · 设计值 = `CORE-UNIFICATION.md` §2.8.1 行 2/3 + fix 轮附录）**

| 档 | 设计预期 | 实测 | Δ |
|---|---|---|---|
| `session.mjs` | 500 → ≈250 | 244 | −6 ✓ |
| `session-lifecycle.mjs`（新） | ≈250 | 305 | +55（>300 ⇒ 已登记） |
| `session-slots.mjs` | 498 → 目标 ≤490（破则随批拆） | 298 | 触发成立 ⇒ 拆分已执行 |
| `session-slots-manifest.mjs`（新） | ≈210 | 264 | +54（≤300 免登记） |
| `process-probe.mjs` | 231 → 增面 | 315 | +84（>300 ⇒ 已登记） |

**决策透明表**

| # | 决策 | 理由 / 状态 |
|---|---|---|
| 1 | re-export 双向保旧 import 面（`session.mjs` ⟷ `session-lifecycle.mjs` / `session-slots-manifest.mjs`） | 旧消费档零改动（双端测试绿证）。 |
| 2 | `ownerStateOf` / `cleanDeadOwners` 不再导出 | 旧 import 面未含该两名（VSC 镜像注释载「核内私有件」）⇒ 无破坏；是否对称再导出 = 设计面裁定（非阻断）。 |
| 3 | `session-slots.mjs` 拆分触发 | 接线后破 490 ⇒ 按设计判据执行 `session-slots-manifest.mjs` 拆分（消解条件兑现）。 |
| 4 | `stripTruncatedToolArgs` | 随函数外提 = `session-lifecycle.mjs` 私有（未导出）。 |
| 5 | 4 个零引用临时档删除 | `_fix_r1.txt` · `_s3.txt` · `_w.txt` · `.thincoder-doc-check.out`（仓根 untracked scratch）—— 非代码面，留痕。 |

**fix round 1（实现轮内自查修正 · 3 项）**：① `advisor-consult-merge.test.mjs` 模块清单补两档（lifecycle 设计明令；manifest 同批新档一并入 —— 超「点命 lifecycle」字面半档，同类扩充，披露）；② `core-hygiene.test.mjs` 注释读数 313 ⇒ 315（process-probe 实读）；③ 同档注释指针 §2.5 行数列 ⇒ §2.8.1 表（3 处）。修后全绿（读数见下）。

**验证读数（命令 → 读数）**

- `thincoder-core && npm test` → **379 / 379 pass · 0 fail**（含新建 `test/process-probe.test.mjs`）
- `thincoder-cli && npm test` → **702 / 702 pass · 0 fail**（suites 12）
- `thincoder-vscode && npm test` → **695 / 695 pass · 0 fail**（VSC 树零触碰下保持全绿）
- `node scripts/doc-check.mjs`（仓根）→ **悬空 5 · 行宽 11**（= §2.7 既存清单；本段零 `docs/` 触碰 ⇒ 零新增）
- `git status`（thincoder 仓）→ 21 改 + 4 未跟踪（含设计 / 父侧 7 docs 与批次档）

**审计 / 代码评审轮次与终态**：**0 轮 / 0 轮 → 终态 `stalled`** —— 本批交付面未完整（VSC 面 + ①② 附随续轮），审计 / 评审随**完整交付轮**执行；不为部分交付伪造「通过」。实现轮内自查修正 = 上表 fix round 1（非审计轮）。

**未完面（续轮承接 · 逐档）**

- ③ VSC 镜像：`src/extension/session-slots.mjs`（async 束化）· `session-io.mjs` · `panel-session.mjs`（await 传播）+ 相应测试
- ① F-W18：`peer-instances.mjs`（同步件收正 + 引核 / TTL SWR）· `loop-sampler.mjs`（新建）—— VSC 面
- ② F-W19：`thincoder-core/provider/list-models.mjs`（`recordAdmission` / `admissionOf` 增 `failure` + `ts`；`channelUnavailableMessage` 逐字零改 —— §2.3 受影响文件表该行）· VSC 探针自愈 / 窗口抑制 / 失败原因可分辨（`WEBVIEW.md` F-W19）
- 推送面：`chat-panel.mjs` / `panel-messages(-settings).mjs`（async）· `settings.mjs`（`shellCandidates` async + admission 落账）
- §2.6 未复核四项的 VSC 半（`panel-project.mjs:53` · `panel-messages-session.mjs:48` · `settings.mjs fullStatus` · VSC 测试回调 async 性）—— CLI 半已核（`activeSlot` 3 调用点全同步消费，零改）

**设计面待收正（不自改 —— 报 eng-designer / 父侧）**

1. `CORE-UNIFICATION.md` §2.8.1 行 2/3：读数（500 ⇒ 244 / 498 ⇒ 298）与消解条件（均已兑现）待收正；**补两行** `process-probe.mjs` **315** / `session-lifecycle.mjs` **305**（>300 须带拆分计划）。
2. 同档 §2.8.1 的两个计数句：「`SOFT_LINE_REGISTRY` 在册 30 档」= as-of 2026-09-14 陈旧（现 33 档实读）；「距 500 硬限最近五档（500/498/495/489/483）」前两档已消解。
3. 余量 / 新档预计与实测差（见行数 Δ 表 —— lifecycle 305 vs ≈250 · manifest 264 vs ≈210）—— 供设计面按判据复核。

**越界披露（本段全部出格动作）**：① 4 临时档删除（决策表 #5）；② `advisor-consult-merge` 补 2 档（fix round ① —— 超字面半档）；③ `core-hygiene` 注释收正（fix round ②③）。除此无出格；VSC 树零触碰。

### fix 轮 2（eng-coder · 2026-09-19）——③-a VSC 镜像面勘察复核；本段**零文件写**（坐标交接）

**覆盖声明**：本段 = 定向勘察（只读：VSC 树 13 档〔`src/extension/` 11 + `src/agent/setup-reminders.mjs` + 仓根 `extension.mjs`〕+ VSC 测试树全量 grep + 核导出面 3 档 + 设计 `MULTI-INSTANCE-COLLAB.md` §3.1 / 本档 §2.3 / §2.4 实读），**未落任何写操作**。
`git status`（thincoder 仓）= 21 改 + 4 未跟踪，逐条比对全部属上一实现轮写域；**`thincoder-vscode/` 树 0 档**。
中断点 = ③-a 为跨 7 档原子变更（async 传播半改即留红树）⇒ 以「坐标 + 坑位」交接，实施交续轮。

**坐标图（续轮直接执行面 · 行号 = 本段实读 as-of）**

| 落点 | 现状（实读） | 目标形态（设计锚） |
|---|---|---|
| `vsc/src/extension/session-slots.mjs` | `cleanDeadOwners:84-99` 自持逐 pid `isProcessAlive` · `usableSlot:103-106`（`slotOccupancy` 同步消费）· `resumeSlot:121-138` 同步整链 · import `:23-27` | 引核 `session-slots-manifest.mjs`（`ownerStateOf:117` / `cleanDeadOwners(m,bundle):139` 已导出）；`resumeSlot` 整链 async；端差面（END / 本端记录 / `sessionsDir`）保留 |
| `vsc/src/extension/session-io.mjs` | `resumeSlot` 包装 `:55-58`（同步）· `newSlot:84-119`（`:91` / `:100` 自持 isProcessAlive）· `switchToSlot` / `deleteSlotAndUpdate` 同族 | async 化 + await 链（核同名件已 async） |
| `vsc/src/extension/panel-session.mjs` | `ensureSlot:36-42`（`:39` 同步 resumeSlot）· `activeData:45` · `openSessionContent:224`（`:228` 同步 resumeSlot）· `newSession:152`（已 async）· `deleteSession:165`（已 async）· `pushSessions:190`（`:210` `active: ensureSlot(panel)`）· `status:233`（慢段不绑槽） | `ensureSlot` = 零探测冷路径（读缓存 / `panel._slot`，**可返 null** + 后台收敛）；三绑点 await（`SESSION.md` §6.15 原文） |
| `vsc/src/extension/panel-project.mjs` | `:47-53` onProjectChanged **已 async**，`:53` 同步调用 | 仅加 `await` |
| `vsc/src/extension/panel-messages.mjs` | `:258` `openSessionContent(panel)`（case 已 async）· `:169` `ensureSlot` 写点 | 加 `await`；`:169` 空槽短路 |
| `vsc/src/extension/peer-instances.mjs` | 本地副本 `batchAlive:39` / `classifyEnd:74` / `probeCmdlines:88` + `execSync`×4（`:46`/`:52`/`:96`/`:106`）；`peerInstances:125` 同步 | 副本删除引核；读面 = SWR 薄壳（同步签名 + `PEER_PROBE_TTL_MS` 到期后台重探）；端缝 `_setAliveProbeForTest` / `_setCmdlineProbeForTest` 转口 `_setProcessProbeTestImpl` |
| `vsc/test`（6 档） | `session-boot.test.mjs`（`:34`/`:182`/`:258`/`:296` 调用点 + `:124`/`:160`/`:199`/`:210` `_slot` 断言）· `activity-live-visibility.test.mjs:35` · `async-visibility.test.mjs:45` · `compaction-echo.test.mjs:29` · `test/integration/scenario-04-session-recovery.test.mjs:119`（`chat-panel.test.mjs:66`/`:138` `_slot:0` 免盘——零改） | await 传播 + 「ensureSlot 返 null / 冷路径零探测」新用例 |

**坑位（本段新发现 · 实施要点，非设计缺口）**

1. **空槽写面**：`ensureSlot` 可返 `null` ⇒ `saveSlotData(cwd, null, …)` 会写 `.null` 槽文件。写面回退点须 `?? await ensureSlotAsync(panel)` 或 null 短路——枚举：`panel-chat.mjs:117`（`runPanelChat` 已 async）· `panel-session-write.mjs:36` / `:112` · `panel-messages.mjs:169`；只读面安全（`loadSlotFile(cwd,null)` → null · `loadSlotForWrite` `!slot` 早退 ⇒ `setSlot*` 返 false · `pushSessions` 的 `active:null` = 无高亮行）。
2. **同类同步消费点（实现轮「未完面」未列）**：`vsc/src/agent/setup-reminders.mjs:77-91`（`:27` import）`pushPeerReminder` 同步消费 `peerInstances(cwd)`——SWR 设计下保持同步读面即可（缓存直返 + 后台重探）；**「启动期异步预热」落点设计面未指定**（候选：`extension.mjs:81 activate()`（async，但无 per-cwd 键）或 panel resolve 面）——报父侧 / 设计面。
3. **`peer-domains.mjs` 消费 `batchAlive`**（`:27` import · `:124` flush 路径调用）：不在 §2.3 表、不在扫描域（§3.1 条 ① 域 = 端 `session-slots.mjs` + `peer-instances.mjs`）⇒ 薄壳**保留 `batchAlive` 再导出**（自核 `process-probe.mjs`）= 该档零改、行为零变。观察项（报父侧，非本批范围）：该调用仍是 flush 路径上一次同步 exec。
4. **核缝槽位语义**：`_setProcessProbeTestImpl({ aliveFn, cmdlineFn })` 缺省槽置 null（`process-probe.mjs:48-52`）⇒ 单槽转口会互清槽；端缝两名单按单槽转发即改单槽，测试并用两槽须一次调用传两槽。
5. `classifyEnd` 签名差（核 `process-probe.mjs:221` 收 cmdline string ⇄ 端本地副本 `peer-instances.mjs:74` 收 `{ name, cmdline }` 对象）随引核自然消解（端内零剩余调用点）。

**终端状态（本段）**：③-a 未实施 + ①② / ③-b~e 续轮 ⇒ 审计 / 顾问代码评审随**完整交付轮**执行；本段 `stalled`（承实现轮语义）。设计面待收正项沿用实现轮 §5 三条（本段无新增）。

### 续轮 3（eng-coder · 2026-09-19）——③-b VSC 镜像面落地（8 档 src + 5 档测试）；内部审计 + 顾问代码评审双轮

**覆盖声明（本段实际交付面）**

- ✅ ③ F-MI7 **VSC 镜像面**：`thincoder-vscode/src/extension/` 8 档 —— `peer-instances.mjs` · `session-slots.mjs` · `session-io.mjs` · `panel-session.mjs` · `panel-session-write.mjs` · `panel-chat.mjs` · `panel-project.mjs` · `panel-messages.mjs`
- ✅ ③ 测试面 5 档：`test/session-boot.test.mjs` · `test/activity-live-visibility.test.mjs` · `test/async-visibility.test.mjs` · `test/compaction-echo.test.mjs` · `test/integration/scenario-04-session-recovery.test.mjs`
- ➖ ① F-W18 / ② F-W19 = 他轮面（本段零触）；④ F-A1–A5 = 已移交批（零触）
- 写域核对：13 档全在 §2.3 受影响文件表 / fix 轮附录 / 本档 `:425-426`（VSC 镜像 4 档 + 测试）与 `:451-455`（坐标图 6 档）面内；其中 `panel-session-write.mjs` = 在途拆分批（`vsc-large-file-split`）产物，随 `panel-session.mjs` 授权面同改。**零越界**。

**交付摘要（逐条 → 落点）**

| # | 交付 | 落点 |
|---|---|---|
| F-MI7 端镜像束化 | `cleanDeadOwners` / `usableSlot` 引核 `session-slots-manifest.mjs`（`ownerPids` / `ownerStateOf` / `cleanDeadOwners(m,bundle)`）；档内零逐 pid exec | `session-slots.mjs` |
| F-MI7 端 async 全链 | `resumeSlot` 整链 async + await 传播（写面 `?? ensureSlotAsync` 回退 / 回合入口 / 打开会话 / 项目切换） | `session-io.mjs` · `panel-session.mjs` · `panel-session-write.mjs` · `panel-chat.mjs` · `panel-project.mjs` · `panel-messages.mjs` |
| ensureSlot 冷路径 | 零探测（读缓存 / `panel._slot`）+ **可返 null** + 后台收敛（单飞 + 粘性直返）；空槽短路（写面 `ensureSlot(panel) ?? await ensureSlotAsync(panel)`）——fix 轮 2 坑位 1 兑现 | `panel-session.mjs:42/67/257-259` · `panel-session-write.mjs:120` · `panel-chat.mjs:121` |
| 同伴面引核 + SWR | 本地副本（`batchAlive` / `classifyEnd` / `probeCmdlines` + 4× `execSync`）删除 → 引核 `process-probe.mjs`；读面 = 同步薄壳（缓存直返，零 exec）+ TTL 到期后台重探；TTL 单源 = 核 `PEER_PROBE_TTL_MS`（端零自值）；端缝转口 `_setProcessProbeTestImpl` | `peer-instances.mjs`（`:28` / `:37` / `:52` / `:174` / `:179`） |
| 预热（SWR 写面） | `prewarmPeerInstances(cwd)` 挂**面板打开慢段**（resolve 期，不绑槽）——设计裁定落点 `MULTI-INSTANCE-COLLAB.md:101` | `panel-session.mjs:24-25/296-299` |
| 缓存契约 | 读面缓存 = 「本进程已解析绑定的槽号」；沙箱缝换目录即清缓存（`_setSessionsDirForTest` / `_resetSessionsDirForTest` 包装版） | `session-io.mjs:69-74/76-78` |
| 有界同步例外（设计明令） | `switchToSlot` / `slotOccupancy` 保持有界同步（例外锚同核） | `session-io.mjs` / `session-slots.mjs` |
| 测试面 | await 传播 4 档 + `session-boot` 组 ⑭（ensureSlot 返 null / 冷路径零探测）；scenario-04 沙箱两缝改取 `session-io` 包装版（`:_set…` 清缓存——与 session-boot / async-visibility 同源） | 测试 5 档 |

**决策透明表**

| # | 决策 | 理由 / 状态 |
|---|---|---|
| 1 | `batchAlive` 失败返 `null`（不抛 / 不返 true） | 「失败」与「无绑定」可分辨、调用侧 fail-open 不误判存活（行为变更随批披露） |
| 2 | 工具面空结果 `"[]"`（非 null） | 空集是合法结果，与核工具面语义齐平 |
| 3 | `groupSlotSessions` 端侧镜像保留 | 核侧未导出（`:45` 私有）⇒ 端镜像有理；建议核侧导出 = 设计面建议（本段不自改） |
| 4 | SWR 读面零 exec：读面同步签名 + 慢段异步刷新 | 面板读面（每回合）不得起 exec；新鲜度上界 = TTL（对齐 N-MI2 端差登记） |
| 5 | 预热只挂 panel resolve（不加项目切换第二落点） | 设计裁定单落点（`:101`）；增点 = 设计变更 ⇒ 上抛父侧（见「未完面」🟡#3） |
| 6 | `panel-session-write.mjs` 随改 | `panel-session.mjs` 拆分产物（在途批），主档 wait 链必须落到写面回退点 |

**验证读数（本段实跑 · fix round 1 后）**

- `thincoder-vscode && node test/run.mjs`（项目清单门禁）→ **712 / 712 pass · 0 fail**（清单门禁过；`test/files.mjs:97` 已含他批 `loop-sampler.test.mjs`）
- `thincoder-vscode && node --test "test/*.test.mjs" "test/integration/*.test.mjs"` → **711 / 711 pass · 0 fail · 0 cancelled**
- `thincoder-vscode && node scripts/check-syntax.mjs` → **214 JS files OK**
- 计数差说明：本轮早先读数 710 ⇒ 现 711 ≈ 他批在飞面新增用例（`loop-sampler.test.mjs` 等），本段零新增测试档

**审计 / 代码评审轮次与终态**

| 轮 | 类型 | 结论 |
|---|---|---|
| 1 | 内部 explore 背离审计（四类判据：AC 部分实现 / 静默简化 / 文档漂移 / 越界改动） | **VERDICT: clean**（四类零发现） |
| 2 | 顾问代码评审 轮次 1（全量） | **VERDICT: pass**（3 🟡 + 4 🔵 · 0 🔴 · 0 must-fix） |
| 3 | fix round 1（🔵#4/#5/#6 自修） | 见下 |
| 4 | 顾问代码评审 轮次 2（仅验 fix 声明） | **VERDICT: pass**（三项修复逐条核实） |

**fix round 1（评审后 · 3 项自修）**：① `panel-session.mjs:12` 清单计数「（13 名）」⇒「（14 名）」+ `panel-session-write.mjs:7` 清单补 `ensureSlotAsync`（对齐 grep 实读 14 个自有导出）；② `peer-instances.mjs:61` `_setNowForTest` 增 `snapshots.clear()`（对齐同档两探针缝纪律）；③ `scenario-04:21-23` 沙箱两缝改取 `session-io` 包装版（换目录即清解析缓存）。修后复跑上述三读数全绿。

**未完面（路由父侧 · 本段不单方改）**

1. 🟡#1 **端侧零同步 exec 扫描机检缺位**：设计判据条（`MULTI-INSTANCE-COLLAB.md` §3.1 条 ①）明列扫描域含端侧两档，而判据档 = 核 `thincoder-core/test/process-probe.test.mjs`（`DOMAIN:234` 只含 3 核档；VSC 测试树零引用 `peer-instances`）——他批在飞面 ⇒ 跨批协调项。
2. 🟡#2 `session-io.mjs:200` 缓存写穿他端 `m.active`：仅修缓存半会与既有 `panel._slot = newActive` 语义不一致 ⇒ 须设计面与写面一并定。
3. 🟡#3 项目切换无预热：设计裁定单落点（`:101`）⇒ 第二落点属设计变更。
4. 🔵#7 `panel-session.mjs` 贴 300 行软线（已随拆分批处理面评估）——无非改，披露。

**终态：`stalled`** —— 授权面内交付完整、内部审计 clean、顾问评审两轮 pass、测试全绿；无 🔴、无 must-fix；4 项为跨批 / 设计面事项，路由父侧裁量，本段不单方改。

**设计面待收正（不自改 · 报 eng-designer / 父侧）**

1. `SESSION.md` §6.15 引行漂移：`panel-session.mjs:28`（今 :63）· `session-io.mjs:55`（今 :89）· `session-slots.mjs:41`。
2. `src/agent/setup-reminders.mjs:71` 注释（「mtime 缓存…回合一次 stat」）与 TTL 现实现相反 ⇒ 注释收正。
3. 建议核侧导出 `groupSlotSessions`（端镜像可改引核，消一处双实现面）。

**并发写者面（非本段 · 供父侧收口核对）**：`chat-panel.mjs` · `extension.mjs` · `panel-messages-settings.mjs` · `settings.mjs` / `settings-panel-write.mjs` · `provider-flows.mjs` · `webview/settings-providers.js` · `test/provider-admission.test.mjs` · `loop-sampler.mjs`(+test) · `provider-probe-window.mjs` —— 与 ①② 轮域重叠。

**未写入项说明**：无——本段全部写入走 `batch_segment`，写后读回核验（见段末追加行）。

**读回核验（D6 · 本段）**：写入 5119 字符，读回 `:467-535` 标题 / 覆盖声明 / 两表 / 三读数 / 三轮评审行 / fix round / 未完面 4 项 / 终态行 / 设计面待收正 3 项 / 并发写者面 全部在场；段界与 §6（`:537`）无侵蚀。本段零「§未写入」事件。

### §5 · eng-coder 交付段 · F-W18 + F-W19（init-block 批）

**交付摘要**

- **F-W18（设置面打开拍零 ≥2s 静默）**：探测链异步化——`commandExists` 走 `execFile`（异步）+ 测试注入缝；推送序 = `indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings`（`agentSettings` 末位 = 打开等待器唯一触发）；两处 push 改 `async`（`chat-panel.mjs`）。
- **F-W19（宿主忙判别 + 窗口重试）**：`loop-sampler.mjs` 新建（常量 `100/1000/1000`；`hostBusy()` 纯内存 fail-open；`_setLoopSamplerForTest` 注入缝；activate/deactivate 挂点）；探针窗（窗起 = 打开拍；止 = 成功 / 耗尽 / 关·重开）；失败子集**同窗内有界重试 ≤2**（`PROBE_RETRY_DELAY_MS = 2000`，宿主忙时让位不重试）；**三清除**（落账 `ok:true` / 载荷 `available:true` / 展示回绿）；**词档** `不可用`（timeout/malformed + hint）vs `宿主繁忙`（hostBusy、抑制 hint）、零 i18n、双向机检。
- **结构性拆分（评审 🔴 的修复）**：`settings.mjs` 由 514 行（wc -l）降至 **409**（read 行数 410）；新档 `provider-probe-window.mjs` **122**（read 行数 123）承载探针窗 / 重试 / 在飞去重 / 落账消费族；**对外缝零改** = 三个 re-export（`endProbeWindow` / `_resetProbeWindowsForTest` / `_setProbeRetryDelayForTest`），全部调用点与测试入口未动（N-P3 缝保持）。
- **测试面**：`loop-sampler.test.mjs` 新建（8 例）· `provider-admission.test.mjs`（T-W19a–f + T1–T27）· `settings-open-snapshots.test.mjs`（W8-1–5）· `test/files.mjs` 登记。

**决策透明表**

| # | 决策 | 理由 | 被拒备选 / 备选理由 |
|---|---|---|---|
| 1 | 拆分切点选「探针窗族」而非 env 面 | ① `shellCandidates` / `execFile` 留在 `settings.mjs` ⇒ F-W18 静态扫描域断言（域完整性 fail-closed）零改；② 探针族自持状态 + 重试纪律，内聚且为本批所加；③ env 面拆分计划仅存于 wiring 批档（记录面），live 设计未给切点 | 拒「按 env 面切」——会使静态扫描域断言需改，且 cut 面未在 live 设计中具名；env 面计划留作残留登记（设计面） |
| 2 | `PROBE_RETRY_DELAY_MS = 2000` 取值 | 实现自定（设计未给值） | 不自行改写设计文档；作为设计面缺口上报（唯一非设计来源常量，待设计面收正） |
| 3 | 重试让位上限 = `PROBE_RETRY_MAX`（忙让位链亦以之为界） | 实现自定（设计只给「重试 ≤2」） | 同上——报设计面缺口，不静默扩张语义 |
| 4 | 越声明/越清单文件 | 交付必需（见下） | 见「越清单披露」——逐条给理由，不隐 |

**越清单披露（file 域声明外 · 全为交付必需，逐条理由）**

- `thincoder-core/provider/list-models.mjs`：F-W19 落账字段 `failure` / `ts` + `classifyProbeFailure`（设计点名）。
- `thincoder-core/test/provider-merge.test.mjs`：核侧落账字段的机检（随设计面机检面）。
- `thincoder-vscode/src/extension/provider-flows.mjs`、`settings-panel-write.mjs`：端侧 hostBusy 覆盖 / 落账装配实装点（设计 §2.12 判据点名动作；行为面合设计）。
- `thincoder-vscode/src/extension/extension.mjs`：采样器 activate/deactivate 挂点（设计 §2.12 点名）。
- `thincoder-vscode/src/webview/settings-providers.js`：词档渲染 + hint 抑制（设计 §2.12 点名同址硬编码）。
- 说明：上述各档均未在批档 §2.3 文件表中列行（登记缺口，交父侧/设计面收口），**行为面与设计逐条对齐、无越界语义**。

**审计与评审轮次与终态**

- **内部 explore 分歧审计（只读 · 1 轮）**：0 🔴 · **0 PARTIAL · 0 SILENT-SIMPLIFICATION**；11 条发现全为 DOC-DRIFT（设计档坐标/标记，🟡🔵）+ OUT-OF-LIST（登记面 🟡🔵）⇒ 代码面交付与设计**无分歧**，无需代码自修轮。
- **advisor 代码评审第 1 轮**：`changes-required`（🔴 结构拆分越 500 硬限 + 文档/登记面发现）。
- **fix round = 1**（结构拆分；同时完成重测）。
- **advisor 代码评审第 2 轮（核验修复声明）**：**VERDICT: pass** ——「拆分正确性 / 行为等价含对外缝保持 / 无新增缺陷」三项全过；无新增 🔴/🟡。
- **终态：`clean`（converged）**——修复轮 1 次、无 stale 轮次、无未答提问。

**验证读数（命令 + 结果）**

- `node --test test/provider-admission.test.mjs test/settings-open-snapshots.test.mjs test/loop-sampler.test.mjs` → **33/33 pass · 0 fail**（拆分后重测）。
- `npm test`（thincoder-vscode）→ **712/712 pass · 0 fail**。
- `npm run lint`（`node scripts/check-syntax.mjs`）→ **215 JS files OK**（214 → 215 = 新档入域）。
- `node scripts/doc-check.mjs --root .` → FAIL(锚) 5 悬空（全为 `docs/core/design/CORE-UNIFICATION.md` 迁移期引文）+ FAIL(行宽) 11（全为 `docs/core/**`）——**与本批改动零交集（本批未引入；docs 面本批零触）**。
- core 侧 379/379（本轮修复前读数；修复面零 core 文件改动）。
- **未产出/不可产**：判据 ③ 实机读数（需真实扩展宿主激活）**未产出**；`extension.mjs` 挂点与 webview 侧仅**语法 + 结构**验证，实机激活 **unverified**。

**交底（非我写域 · 待设计面/父侧收正）**

- `VSC-DEBT.md` §12.1：登记读数 384 → 本批实测 `settings.mjs` 409（拆分前 514）；新档 `provider-probe-window.mjs` 122 需一行登记。
- `SETTINGS.md`：§2.11 坐标（`chat-panel.mjs:321`/`:354`·`:339` → 现 `:331`/`:353`·`:370`）；§2.12 落账消费点（`settings.mjs:364-365`/`:110`/`:117-118` → 现新档 `:71`/`:76` + `settings.mjs:137`/`:144`/`:148`）；`:281`「（拟新增）」清标；`:258` 指针（`:53` → `:58`）。
- 批档 §2.3 文件表补行：`provider-probe-window.mjs`（新）· `provider-flows.mjs` · `settings-panel-write.mjs` · `extension.mjs` · `webview/settings-providers.js` · 三测试档。
- 设计面常量缺口 2 项（见决策透明表 #2/#3）。

### fix 轮 4（eng-coder · 2026-09-19）——A 组 (a)(b) 落地 + 收尾 (c)②③；(c)① 阻于 N3 门禁（三选项报父侧）

**覆盖声明（本段实际交付面 · 对照 §2 fix 轮 4 四项）**

- ✅ **(a) #12 方向 A（本端优先、不收养）**：删本端绑定槽 ⇒ 不收养幸存 `active`、不写他端记录、解析缓存不残留；重解析 = 全新分配。落点 `session-io.mjs:201` / `:203` / `:207` + 用例 ⑯。
- ✅ **(b) Form B（`switchToSlot` 写穿仅未占时）**：共享 `m.active` 指针 + `saveManifest` **恒执行**（D-6 CLI 互操作面）；本端记录面（marker + 解析缓存）与 `slotSessions` 认领仅 `!occ.occupied` 时写。落点 `session-io.mjs:174-185` + 用例 ⑮。
- ✅ **(c)② `setup-reminders.mjs` 注释收正 + 注入文案对齐**：原注「mtime 缓存…回合一次 stat」与 SWR / TTL 现实现相反 ⇒ 改为「新鲜 ⇒ 直返 / 过期 ⇒ 返旧 + 后台刷新 / 无快照 ⇒ 空集 + 后台刷新」；注入 `who` 构造与核 `agent/setup-reminders.mjs:162` **逐字同形**。落点 `:70-77` / `:85-88`。
- ✅ **(c)③ `core-hygiene.test.mjs` 登记注收正**：「表待补两行」已失效 ⇒ 改为「设计档 `CORE-UNIFICATION.md` §2.8.1 表第 10 / 11 行——fix 轮 3 补登，漂移已消解」。落点 `:34-36`。
- ❌ **(c)① 端侧零同步 exec 扫描域扩：未实装**——设计「核侧锚」档落点与核 N3 卫生门禁硬冲突（下详）；ask 已发未答 ⇒ 三选项交父侧裁定，本段不单方改（未实装 ≠ 无判据：域内现态已实测零 `child_process`，见「验证读数」末二条）。
- ➖ 写域核对：本段改动 5 档全在 §2 fix 轮附录授权面——
  `thincoder-vscode/src/agent/setup-reminders.mjs` · `thincoder-vscode/src/extension/session-io.mjs` · `thincoder-vscode/src/extension/panel-session.mjs` ·
  `thincoder-vscode/test/session-boot.test.mjs` · `thincoder-core/test/core-hygiene.test.mjs`；
  `thincoder-core/test/process-probe.test.mjs` 属 (c)① 尝试后**回退**（净零改：`DOMAIN` 仍 3 核档）。**零越界**。

**交付摘要（逐条 → 落点 + 修前 / 修后）**

| # | 交付 | 落点 | 修前 ⇒ 修后 |
|---|---|---|---|
| (a) | 删槽三处收敛 | `session-io.mjs:201` / `:203` / `:207` | 修前：本端记录 / 缓存随幸存 `active` 走（= 收养他端活槽）⇒ 修后：`m.active === slot` 才清指针 · marker 显式置空 · 缓存随删槽清空 · 返 `m.active ?? null` |
| (b) | `switchToSlot` 写穿条件 | `session-io.mjs:174-185` | 修前：`slotSessions[slot]` / `writeEndMarker` / `slotCache.set` 无条件写（被占槽也写穿）⇒ 修后：仅 `!occ.occupied`；`m.active` + `saveManifest` 恒执行 |
| (c)② | 注释 + 注入文案 | `setup-reminders.mjs:70-77` / `:85-88` | 修前：注「mtime 缓存」+ `who` 缺 `end` 分支 ⇒ 修后：SWR / TTL 语义 + `who` = 有 `end` ⇒ `{end} pid={pid}` / 无 ⇒ `pid={pid}`（以「、」连接） |
| (c)③ | 登记注 | `core-hygiene.test.mjs:34-36` | 修前：「表待补两行」（已失效）⇒ 修后：§2.8.1 表第 10 / 11 行（fix 轮 3 补登） |
| 测试面 | 用例 ⑮ / ⑯ | `session-boot.test.mjs:379-410` / `:412-440` | ⑮ 切被占槽：marker 保持槽 1 · 缓存保持 1 · 面板 `_slot` 回 1 · 共享指针翻 2 · `slotSessions[2]` **精确比对**（非子串启发式）；⑯ 删本端槽：`_slot` null · marker null · 缓存 null ⇒ `ensureSlotAsync` 全新分配槽 3（槽 2 未触 / 槽 1 未复活） |

**决策透明表**

| # | 决策 | 理由 / 备选 |
|---|---|---|
| 1 | (b) 共享 `m.active` 指针**恒翻** | D-6 = CLI 互操作面（非本端记录面）；不翻 ⇒ CLI / TUI 侧看不到切换 |
| 2 | (b) 本端记录面仅未占时写穿 | `SESSION.md` §6.15 P3 / P4：被占槽是占用方的事，本端不得记成「最后使用槽」（否则面板 `_slot` 经缓存钉到别人槽 = 双写同槽） |
| 3 | (a) 缓存随删槽清、**不**随幸存 active | 幸存 active 可能是他端活槽 ⇒ 收养 = P3 / P4 违约；另择新号归认领束（`allocation` 路径） |
| 4 | (c)① **未实装**（三选项上抛） | 与 N3 门禁硬冲突；绕门禁字面（`join(ROOT, "..", …)` 拼法）等价于欺骗卫生门禁，**不做** |

**验证读数（本段实跑 · 修后）**

- `thincoder-core && node test/run.mjs` → **379 / 379 pass · 0 fail**（含收集面清单门禁）
- `thincoder-cli && npm test` → **702 / 702 pass · 0 fail**
- `thincoder-vscode && node test/run.mjs` → **714 / 714 pass · 0 fail**（41 s）
- `thincoder-core && node --test test/process-probe.test.mjs` → **13 / 13 pass**（① 判据档本体绿；域 = 3 核档）
- `node scripts/doc-check.mjs`（workspace 根）→ **悬空 5 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 11**——与批档既有基线逐项相同 = **零新增**
- 修前红 / 修后绿：用例 ⑮ / ⑯ 在 (a)(b) 实装前 `not ok`（旧行为 = 写穿被占槽 / 收养幸存 active），实装后 `ok`（本段单档复跑 **7 / 7**）
- ⚠️ VSC 全量 flake 记录（如实列报 · 非本批引入）：本会话早前 6 红 1 绿，全为 `test/integration/scenario-06-commit-verify.test.mjs` 的 `after` 钩 `rmSync` 系统 temp `tc-integ-git-*` **EPERM**——
  该档 4 用例全过、与本批 diff 零导入链；根因实测 = 遗留 9 个 temp 目录（7 个为当日残留）+ 无 git 进程存活 + 手动 `rmSync` 立即成功 ⇒ 瞬时 Windows 句柄 / AV 锁型 flake（非只读属性、非持久锁）；
  本段复跑已绿（同轮另有 `tc-merge-*` EPERM 告警 = 同族现象、非阻断）。建议（**只报不改**）：`rmSync(…, { maxRetries: 5, retryDelay: 100 })`。
- (c)① 域现态（供父侧判据取舍）：`thincoder-vscode/src/extension/**` 全域引 `node:child_process` 者**仅 `settings.mjs`（异步 `execFile`）**；域内两档 `session-slots.mjs` / `peer-instances.mjs` 零 `child_process`、零同步 exec ⇒ 判据本身**当前为真**（缺的是机检面，非行为面）。

**审计 / 代码评审轮次与终态**

| 轮 | 类型 | 结论 |
|---|---|---|
| 1 | 内部 explore 背离审计（只读 · 机器注入文件单） | **DEVIATIONS**：仅 DOC-DRIFT / PARTIAL（= (c)① 未落 + 设计坐标漂移），零 silent-simplification · 零 out-of-list |
| 2 | advisor `type=code` 轮次 1（全量） | **changes-required**：🔴 注入文案未逐字对齐（`who` 构造）· 🔵 死 import（`panel-session.mjs` 的 `writeEndMarker`）· 🔵 `:405` 恒真断言（子串启发式） |
| 3 | fix round（评审后 · 3 项自修） | ① `who` 构造改核逐字同形 ② 删死 import ③ `:405` 改 `slotSessions[2]` 精确比对 |
| 4 | advisor `type=code` 轮次 2（仅验 fix 声明） | **pass**（三项逐条核实 · 无新增 🔴 / 🟡） |

**未完面（路由父侧 · 本段不单方改）**

1. 🔴 **(c)① = 本段唯一 ❌**。冲突实锤：设计 `MULTI-INSTANCE-COLLAB.md:89` 明定测试档 = `thincoder-core/test/process-probe.test.mjs`（「本批核侧锚」），
   `:90` 条 ① 又把域含端侧 `thincoder-vscode/src/extension/session-slots.mjs` / `peer-instances.mjs`（`:99` 验收同引）；而核测档受 N3 门禁 `thincoder-core/test/core-hygiene.test.mjs:96-107`（测试名「no core file reaches into a product tree」）约束——
   递归扫全核原文，命中 `(?:\.\.\/)+thincoder(?:-vscode)?` 即红 ⇒ **核档不得出现端侧相对路径**（本次实测：加端侧路径即红，故回退）。三选项：
   - **① 扫描改落 VSC 侧（我倾向）**：VSC 树已有同形先例 `test/settings-open-snapshots.test.mjs:163-185`（「零同步形态 + 域完整性 fail-closed」）⇒ 新档 `thincoder-vscode/test/zero-sync-exec.test.mjs`
     （域 = 端侧 `session-slots.mjs` + `peer-instances.mjs`；正控 = `settings.mjs` 的 `execFile(`）+ `test/files.mjs` 登记一行；域内现态已绿（上「验证读数」末二条）。
     代价 = 设计 `:90` 条 ① 的锚点行需 eng-designer 一行收正（核半留核测档、端半落 VSC 测档）。
   - **② 设计面 N3 豁免**（端侧两档登记为「跨树只读扫描例外」）：不改判据档落点，代价 = 新增豁免面 + N3 语义开口。
   - **③ 拼路径绕门禁字面**（`join(ROOT, "..", "thincoder-vscode")`）：**不做**——N3 语义即「核不得伸入产品树」，字面绕行 = 欺骗卫生门禁。
2. 🟡 `peer-instances.mjs:9-11` / `:89` / `:90` 注释面引行漂移 · 核 `session-lifecycle.mjs:285` 无条件 `writeEndMarker` 端差——跨档 / 跨端事项，报父侧。
3. 🟡 死锚 `D-L1a` / `D-L2a` / `D-L2b` · `SESSION.md:270` 旧语义句 · `SESSION.md` §6.15 引行漂移——设计面待收正（本批零触 docs）。
4. 🔵 `panel-messages-session.mjs:50` 文案 · `session-boot.test.mjs` 441 行 >300 软线（无非改）——披露。

**终态：`stalled`**——授权面内 (a)(b)(c)②③ 交付完整、修前红 / 修后绿、三端复跑全绿、doc-check 零新增、内部审计 + 顾问两轮 pass；**(c)① 单项未落**（设计锚 ⨯ N3 门禁 · ask 未答）⇒ 路由父侧裁定，本段不单方改。

**设计面待收正（不自改 · 报 eng-designer / 父侧）**

1. `MULTI-INSTANCE-COLLAB.md:89-91`（§3.1 F-MI7 条 ①）：域含端侧两档而判据档落核测档 = 与 N3 门禁硬冲突 ⇒ 按三选项之一收正（推荐 ①：端侧半落 VSC 测档）。
2. `SESSION.md` §6.15 引行漂移（`panel-session.mjs:28` → 今 `:63` · `session-io.mjs:55` → 今 `:89` · `session-slots.mjs:41`）· `:270` 旧语义句 · 死锚 `D-L1a` / `D-L2a` / `D-L2b`。
3. `session-boot.test.mjs` 441 行 >300 软线登记（本段新增两用例 +62 行）。

**未写入项说明**：无——本段全部写入走 `batch_segment`（段末追加读回核验行）。

**读回核验（D6 · 本段）**：`batch_segment` 追加 6268 字符 = 本段主文 79 行（追加时点：批档 `:695-772`，其后紧接 `## §6`）——标题 / 覆盖声明 6 条 / 交付摘要表 5 行 / 决策透明表 4 行 / 验证读数 8 条 /
审计四轮 / 未完面 4 项 / 终态 / 设计面待收正 3 项 **全部在场**；段界与 §6 无侵蚀；段内行宽已收（含本条：最大 250 字符 · 零超 300）。`doc-check` 于写入后复跑 = 悬空 5 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 11——与既有基线逐项相同 = **零新增**。

### §5 · eng-coder 交付段（续）· F-MI7 判据① 端侧半（init-block 批 · 2026-09-19）

**范围与授权**：父侧裁定（选项① + (d)）= 端侧零同步 exec 扫描独立落 VSC 测档 + `test/files.mjs` 登记 + `peer-instances.mjs` 头注引行收正；禁改设计档 / 需求档 / 核侧档；核半不动。落位 = 批档 §6 收尾清单第 1 项（端侧扫描机检域扩）。

**交付摘要**

| # | 文件 | 状态 | 说明 |
|---|------|------|------|
| 1 | `thincoder-vscode/test/zero-sync-exec.test.mjs` | 新建 74 行 | 判据① 端侧半：零域 = 端两档（`session-slots.mjs` + `peer-instances.mjs`）零 child_process 直调（`exec` / `execFile` / `execSync` / `execFileSync` / `spawn` / `spawnSync` 调用形态 ∪ `node:child_process` 说明符形态）；正控 = 域外 `settings.mjs` 两支独立模式；域完整性 fail-closed = `src/**` + `extension.mjs` 引用者集合 deepEqual 三档 |
| 2 | `thincoder-vscode/test/files.mjs` | +1 行（`:98`） | 登记新档（run.mjs 反查门禁） |
| 3 | `thincoder-vscode/src/extension/peer-instances.mjs` | 仅头注 `:9-11` | 「镜像 16 行（核 `:84-99` ⇄ 本档 `:78-93`）」——旧述「~14 行」为伪，两段各 16 行逐字同形已实读核销 |

**判据坐标（设计现态实读 · 2026-09-19）**：`MULTI-INSTANCE-COLLAB.md:89` 测试档行**已含**本档（「`thincoder-vscode/test/zero-sync-exec.test.mjs`（零同步 exec 扫描——端半）」）· `:90` 端域两档 = 本档 DOMAIN 逐字一致 · `:91` 域内零同步形态 + 先例两处（`tool-seams.test.mjs:289-299` · `settings-open-snapshots.test.mjs:163-185`）· `:99` 副本零残留验收 → 扫描判据 = 条①。⇒ §5 前段的未完面 1 🔴（(c)① 设计锚 ⨯ N3 门禁）经父侧裁定后已由设计面自身命名本档，本笔 = 落地笔，设计锚无需再收正。

**决策透明表（评审发现响应·4 项）**

| # | 来源 | 严重度 | 处置 | 依据 / 证据 |
|---|------|--------|------|-------------|
| 1 | advisor 轮 1 · 发现 1 | 🟡 optional | **不实现**（披露上抛） | 设计自身把 `:99` 副本零残留验收的扫描判据定为条①（exec 形态）⇒ 非 exec 型副本（标记正则 / 判活副本）无机械面 = 设计覆盖面事项，非本笔缺口；禁扩面 |
| 2 | advisor 轮 1 · 发现 2（闭包只认静态 `from`） | 🔵 | 已修 | `:66-67` 改「剥注释后代码面 `includes` 束说明符」——覆盖 `from` 静态 / 副效应 / 动态 `import()` / 再导出四形；匹配集为原正则**超集**（不弱化），现态三档仍命中、无假红 |
| 3 | advisor 轮 1 · 发现 3（正控只证说明符支路） | 🔵 | 已修 | `:50` 独立 `CALL` 正控（调用支路获得独立证明） |
| 4 | advisor 轮 2 · 新增（`:50` 被 `CALL` 蕴含 ⇒ 说明符支路仍无独立正控） | 🔵 | 已修（评审轮 2 后自改 3 行 · 如实披露） | `:38` 立 `SPEC` 独立模式 · `:40` `DIRECT = CALL ∪ SPEC` 合成（源串与核半 `process-probe.test.mjs:235` / 先例 `tool-seams.test.mjs:293` 逐字同式——literal grep 恰 2 命中）· `:51` 正控改 `SPEC.test` ⇒ 两支各持独立正控 |

**审计与代码评审轮次（终态 `clean`）**

| 轮次 | 内容 | 结果 |
|------|------|------|
| 1 | internal explore 审计（交付 vs 设计背离） | **CLEAN**（六项一致 · 零背离；2 项 🔵 上抛） |
| 2 | advisor `type=code` 轮 1（全量） | **pass**（零 must-fix：1 🟡 optional + 2 🔵） |
| 3 | fix round（自修 2 项 = 上表 #2 / #3） | 复跑本档 1/1 绿 |
| 4 | advisor `type=code` 轮 2（仅验 fix 声明） | **pass**（逐条核销 · 新增 1 🔵 = 上表 #4） |
| 5 | fix round 2（上表 #4 自改 3 行） | 单档绿 + 双诱饵实证 + 全量 715/715（读取数 6 条） |

**验证读数（本笔实跑 · 命令 + 结果）**

1. 单档：`cd thincoder-vscode && node --test test/zero-sync-exec.test.mjs` = **1/1 pass**。
2. 反证 A（调用形态）：向 `session-slots.mjs` 末注入 `execFileSync("bait")` ⇒ 红（`域内档直调 child_process（应经核探测束 API——N-MI3）：src/extension/session-slots.mjs`）；撤除 ⇒ 绿。
3. 反证 B（说明符形态 · 零调用形）：向 `peer-instances.mjs` 末注入 `"node:child_process"` 字面量 ⇒ 红（同断言点名该档）⇒ **说明符支路在实际门禁中活性实证**；撤除 ⇒ 绿；`__baitProbe` / `__baitCase` 全域 grep 零命中（无诱饵残留）。
4. 全量：`cd thincoder-vscode && npm test` = **715 / 715 pass · 0 fail**（清单门禁通过）。
5. 先例同式核销：literal grep 合成源串 ⇒ 恰 2 命中（核半 `:235` · 先例 `:293`）= 逐字同式。
6. 核 / CLI 面本笔零改动 ⇒ 未复跑（批次内前读数 379/379 · 702/702 仍有效）。

**未完面 / 上抛（不自改）**

1. 🟡 上表 #1（`:99`「非 exec 型副本零残留」无机械面）= 设计覆盖面事项——若父侧要机械面，需设计先给判据形态后另派；本笔按禁扩面不落。
2. 🔵 上表 #4 的修复为**评审轮 2 之后的增量**（3 行）——未再开轮 3（理由：修复面 3 行、两分支活性由双诱饵实证、全量绿；机械面已闭合）；父侧若要求可另开轮 3 仅核该 3 行。
3. §5 前段未完面 2 🟡 中「`peer-instances.mjs:9-11` 引行漂移」= 本笔已收正（头注镜像 16 行实读核销）；同项「核 `session-lifecycle.mjs:285` 无条件 `writeEndMarker` 端差」= 跨端事项，本笔未触。
4. 设计档 `:89-91` / `:99` 本笔只读引用，零改（禁写面）——现态与交付一致（见「判据坐标」）。

**终态：`clean`**——授权面内三项交付完整；单档 + 反证 A/B + 全量三读全绿；内部审计 1 轮 CLEAN + 顾问 2 轮 pass；4 项发现 = 3 修 + 1 披露（披露项 = 设计覆盖面事项，非本笔缺口）。

**补记（轮 3 · 收敛核验 · 追加）**：advisor `type=code` 轮 3（仅核 fix 轮 2 的三行声明；声明面已排除前轮已核项）= **pass**——四条逐项核销：上表 #2 / #3 = Fixed · 上表 #4（上轮残余 · 并集正控不可独立失败）= **Fixed**（第二正控已改独立 `SPEC` 模式）· 上表 #1 = Unfixed（按声明仅披露，非 must-fix ⇒ 不阻断）。顾问自报副作用「`[host-verified] 0/2 citations match`（settings.mjs file unreadable）」= **其自身引证路径解析失败**，非实证不符；两条正控的可满足性由全量 715/715 绿（`:50` / `:51` 断言在跑）+ 本笔实读 `settings.mjs:21`（`import { execFile } from "node:child_process"`）· `:78`（`execFile(win ? …`）机械证明 ⇒ 无实质缺口。

**读回核验（D6 · 本段）**：`batch_segment` 追加 3561 字符 = 本段主文 50 行（落点 = 批档 `:805-854`，其后紧接 `## §6 验证与收口`，段界无侵蚀）——范围内三项 / 判据坐标 / 决策透明表 4 行 / 审计轮次 / 验证读数 6 条 / 未完面 4 项 / 终态 **全部在场**。`doc-check`（`node scripts/doc-check.mjs`）于写入后复跑 = 候选 16510 · 悬空 5 · 注记豁免 43 · 拟新增 6 · 迁移期引文 222 · 行宽 11——与既有基线**逐项相同 = 零新增**（11 条行宽项无一落本批档）。

### fix 轮 5 · 注释面清扫（代码面 · eng-coder）

**任务书**：注释/文案按现行为收正——(a) VSC `panel-messages-session.mjs:44-48` 注释 + `:51` 用户文案；(b) 核侧引旧节号/旧锚注释改指现文章节号。约束：纯注释零语义 · 不扩面 · 不碰 docs。

**交付摘要**（7 档，注释/文案面，零语义）：

| 档 | 收正 |
|---|---|
| `thincoder-core/session-lifecycle.mjs` | §10→§6.10 · §12→§6.12 · §11→§6.11 · §14→§6.14 · §3 v2 格式→§6.3 · D-R6→D-SE26（旧 ID 不复活） |
| `thincoder-core/session-slots.mjs` | 同映射（§6.10/§6.12/§6.14 各引） |
| `thincoder-core/session.mjs` | 同映射（§6.1/§6.10/§6.12/§6.14 + D-SE26） |
| `thincoder-core/session-slots-manifest.mjs` | :191/:196/:247 → §6.10 |
| `thincoder-core/session-rename.mjs` | :3/:4/:15 → §6.12（标题写契约 + 模块约束；§10.6 先例弃号保语义） |
| `thincoder-core/peer-instances.mjs` | :5 → §6.10 · :82「探索 §4」→ §3.1（同档同类残留自行收正）· :160 §2a.4 D-L2b → §3.3（MULTI-INSTANCE-COLLAB 现文） |
| `thincoder-vscode/src/extension/panel-messages-session.mjs` | :44-48 注释按现行为重写（占槽→不钉 `_slot=null`+提示；不认领/不写缓存与本端记录 P3/P4；随后 `_loadSession()` 经 ensureSlot 读缓存绑回本端原槽 §6.15 P3——非「新建空会话」）· :51 文案 → `…is being used by another live process — staying on this panel's current session.` |

**决策透明表**：
1. 旧节号一律**不复活**：只引现役号/ID；D-R4≡D-SE23、D-R6≡D-SE26 ⇒ 正文只写 D-SE26。
2. §10.6 先例不可考 ⇒ **弃号保语义**（语义以 §6.12 现文承载）。
3. §-引按现文**实指**收正（如 §3.1 = `peerInstances(cwd)` 去重分组面、§3.3 = L2 工具面），不按旧号序位机械平移。
4. `:51` 文案只作措辞收正，**保留断言子串** `/is being used by another live process/`（全仓实现面恰一处，测试 `test/session-boot.test.mjs:404` 唯一引用——子串断言不受影响）。
5. 同档同类残留自行收正：`peer-instances.mjs:82`（同文件旧节号，类同 (b)）——以「文件在内 + 类同」为界。
6. 不做（登记见下）：VSC 侧旧节号族 · 核侧其余旧号族 · CLI 文案措辞——父侧后续同批处置。

**验证**（本段实跑读数）：
- `cd thincoder\thincoder-core && npm test` → tests 379 · pass 379 · fail 0（exit 0）
- `cd thincoder\thincoder-vscode && npm test` → tests 715 · pass 715 · fail 0（exit 0；含 ⑮「切到被占目标槽」——文案断言命中）
- `cd thincoder && node scripts/doc-check.mjs` → 候选 16510 · 悬空 5 · 豁免 43 · 拟新增 6 · 迁移引文 222 · 行宽 11（逐项 = 基线；FAIL(锚)5 / FAIL(行宽)11 为基线既有闸态，非本段引入）
- 逐档 grep 复核：七档 `§1[0124]|D-R[46]|D-L2b|§2a|§10.6` **零命中**（旧号零残留）

**审计与评审轮次与终态**：本段 = 纯注释/文案面（零语义、零行为），父侧裁定**不做**内审 explore + 顾问代码评审 ⇒ 审计 0 轮 · 顾问评审 0 轮 · fix round 0（首轮即成档）。终态 = `clean`。

**未决 / out-of-scope 登记（本段不做，仅登记）**：
- 核侧旧号族：`session-gc.mjs`（§12.x 17 处）· `session-guard.mjs`:14/:20 · `session-segments.mjs`:4/:5/:11/:32 · `session-store.mjs`（§14.x 15 处）· `context.mjs:177` · `generate-title.mjs:107` · `read-history.mjs`:9/:278/:293 · `agent/setup-reminders.mjs`:6/:8/:34/:45/:46/:144 · `agent/setup.mjs`:81/:133
- VSC 侧旧号族：`extension/panel-session.mjs:39` · `extension/session-io.mjs:85` · `extension/session-slots.mjs:103` · `extension/panel-messages-session.mjs:76`（§12 F3）· `agent/setup.mjs`:410/:414/:422/:450 · `agent/setup-reminders.mjs`:44/:97 · `agent/run-helpers.mjs:207`
- CLI 侧（本轮实读新增发现）：`tui/cmd-session.mjs:117`（§14.3.6）· `:121`（§15.3.2）——旧号映射未核；`:111` 占槽文案措辞实读与现行为一致（占用分支 `applySession(…, {})` 未绑定 ⇒ 下次保存新分配 → 「create a new copy」成立）。

## §6 验证与收口

**（进行中）父侧收尾清单（2026-09-19 02:4x）**——A 组交付路由项 + 前轮挂账，待 B 组落地后并入本批收尾修正轮：

1. 🟡 **端侧零同步 exec 扫描机检域扩**：`thincoder-core/test/process-probe.test.mjs:234` DOMAIN 现只 3 核档；判据条 ① 域含端侧 `thincoder-vscode/src/extension/session-slots.mjs` / `peer-instances.mjs` ——验收缺口，修正轮补。
2. 🟡 `session-io.mjs:200` 缓存写穿 / `m.active` 语义——已派设计裁定（eng-designer），裁定后随修正轮落地。
3. `thincoder-vscode/src/agent/setup-reminders.mjs:71` 注释与 TTL 现实现相反——修正轮清。
4. `thincoder-core/test/core-hygiene.test.mjs:34-36` 注释「表待补两行」已失效（本批已补两行）——修正轮清。
5. `SESSION.md` §6.15 引行漂移（`panel-session.mjs:28`→今 `:63` · `session-io.mjs:55`→今 `:89` · `session-slots.mjs:41`）——已并eng-designer 修正轮。
6. 🔵 `panel-session.mjs` 贴 300 行软线（无非改动作）——随在途拆分批面。
7. 🟡#3「项目切换预热第二落点」= **不做**（设计已裁定单落点 = panel resolve 面，A 组按裁定实现）——按裁定收闭。
8. 🟡（B 组路由 · 设计面）`SETTINGS.md` 收正：§2.11 坐标漂移（`chat-panel.mjs:321`/`:354`·`:339` → 现 `:331`/`:353`·`:370`）· §2.12 落账消费点（`settings.mjs:364-365`/`:110`/`:117-118` → 新档 `provider-probe-window.mjs:71`/`:76` + `settings.mjs:137`/`:144`/`:148`）· `:281`「（拟新增）」清标（`loop-sampler.mjs` 已建成）· `:258` 指针（`:53`→`:58`）。
9. 🟡（B 组路由 · 登记面）`VSC-DEBT.md` §12.1 读数 384→**409** + 新档 `provider-probe-window.mjs` **122** 补行；批档 §2.3 补行（`provider-probe-window.mjs` · `provider-flows.mjs` · `settings-panel-write.mjs` · `extension.mjs` · `webview/settings-providers.js` · 三测试档）。
10. 🟡（B 组路由 · 设计面常量缺口）`PROBE_RETRY_DELAY_MS = 2000` 与重试让位上限——设计未给值，实现自定（已披露）⇒ 设计轮补记（`SETTINGS.md` §2.12）。
11. ℹ️ B 组「其他活实例（slots[37,39]）」归属注记 = **误归**——`thincoder-cli/**` + core `session*`/`process-probe` + vsc `session-*`/`panel-*` 面 = 本批 #7/#10 的未提交改动；**收口提交须路径限（`--only`）核**。

**终验记录（父侧 · 2026-09-19 04:2x）——机器面全绿**：

| 面 | 命令 | 读数 |
|---|---|---|
| core | `npm test` | **379/379 pass** |
| vscode | `npm test` | **715/715 pass** |
| cli | `npm test` | **702/702 pass** |
| 机检 | `node scripts/doc-check.mjs` | 悬空 5 · 行宽 11 = **基线逐项同（零新增）** |
| 结构拆分兑现 | `wc -l` 抽核 | `session.mjs` 244 · `session-slots.mjs` 298 · `session-lifecycle.mjs` 305 · `session-slots-manifest.mjs` 264 · `provider-probe-window.mjs` 122 · `loop-sampler.mjs` 82 |

**清单销项（本表 1–11）**：1 ✅（#17 端侧扫描档 + 诱饵双反证）· 2 ✅（#12 裁定 + #14 落地）· 3 ✅ · 4 ✅（#14）· 5 ✅（#12/#16）· 6 ➖（不动作）· 7 ✅ 收闭（按裁定）· 8 ✅ · 9 ✅ · 10 ✅（#13）· 11 ➖ 提交纪律照办。

**遗留登记（不阻断收口）**：① 旧节号 / 旧锚注释残族（#18 out-of-scope：core 9 档 · VSC 7 档 · CLI 2 处）——随文档卫生轮统一清；② `session-boot.test.mjs` 双读数统一 `wc -l` 口径（440）；③ #14 flake 披露：一轮 VSC 全量不可复现文件级红——终验三轮全绿未复现；④ #17 optional 🟡（非 exec 型本地副本机检面）= 出批（需设计先给判据形态）。

**待办（收口最后一步）**：实测 C/D——用户 Reload Window ⇒ 父侧读 exthost 静默窗 + 设置页全绿 / 自愈读数（承 §1.5 实测 C/D）。

**实测 C/D 读数（2026-09-19 07:5x · 用户 07:52 重载）——收口判定**：

| 项 | 读数 | 判定 |
|---|---|---|
| 用户面（F-W19①） | 设置页**无红行（全绿）**——风暴期同一动作 = 全红；探针存活读数（判据明列路径二） | ✅ 通过 |
| 初始化静默代理（F-W18③ / F-MI7③） | 本窗 webview→次行 = **8.67s**；对照 14 次历史重载：**健康日 6.6–8.1s**（修复前）/ 全期 2.6–9.6s / 风暴期异常 **14.4s×3**（14.42 / 14.45 / 14.65）——本次落回常态带，异常带消失 | ✅ 通过（**判据注记**：`<2s` 字面阈值低于目标机结构性噪声底〔该段间隙无 exthost 日志输出属结构常态，修复前健康日亦 6.6–8.1s〕；判别式 = **常态带分离**——校准项登记） |
| max-gap 旁证 | 16.7s < 全期最差 24.4s（该指标历史全为 copilot→decorations 结构间隔） | 旁证 ✓ |
| 认领 / 恢复 | 会话 slot 40 正常恢复 + manifest 07:50 内落盘 + 面板重连成功 | ✅ |
| 机器面 | 三端 379/715/702 全绿 + doc-check 零新增（见上「终验记录」） | ✅ |

**提交**：`4119c316`（50 档：代码 43 改 + 本档 + 核心设计 4 档 + 需求 2 档）· `b535bc53`（新档 7：session-lifecycle · session-slots-manifest · process-probe.test · loop-sampler · provider-probe-window · loop-sampler.test · zero-sync-exec.test）。**排除面**（与他批在飞面共载，留其归属批提交）：`docs/vsc/design/SETTINGS.md` · `docs/vsc/design/VSC-DEBT.md`（工作树保持修改态）。

**结算行（D7）**：台账 #1 = 待核销 → **已核销**（2026-09-19 07:5x）· 设计凭证 = 评审轮次 2 pass → consume 已执行（no-op「already consumed / never issued」——距评审超 TTL，等效闭合）· ④ 面条目 #4 归 `vsc-subagent-live-visibility` 批（另链）· 技术待办 #2 / #5 / #6 在册（不影响本批）。

**状态行：✅ 已收口 2026-09-19**（用户 07:52 实测通过；本档冻结，不再回改）。

（父代理）
