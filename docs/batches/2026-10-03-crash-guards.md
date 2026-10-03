# 2026-10-03 · crash-guards · 崩溃族守卫（GitHub #16 ∥ #17）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 20:34「C 按批起跑」· 分诊批 docs/batches/2026-10-03-issue-triage.md §1（C 线批①）· 台账 #865 ∥ #866（事件 #846）。
> 台账 = #866 ∥ #865（core · 归批——分诊批 C 线批①）。前情 = docs/batches/2026-10-03-issue-triage.md §1（进行中——C 线来源）。
## §1 讨论（主 agent）
**状态行**：进行中（批①点火：设计轮已派发（崩溃族守卫 #16 ∥ #17））
- **来源/授权**：用户 2026-10-03 20:34「C 按批起跑」= 分诊批（`docs/batches/2026-10-03-issue-triage.md`）C 线**批①**点火；条目 = 台账 #866（GitHub #16）∥ #865（GitHub #17）。
- **本批条目（两条，绑定）**：
  1. **#16 · 进程杀守卫**——idle-watchdog 掐流时 `body.destroy(…)` 无兜底 `'error'` listener ⇒ 未处理 error 事件 = **进程被杀**。坐标（分诊实读）：`thincoder-core/proxy.mjs:94,99` ∥ `thincoder-core/provider/sse.mjs:175-181` ∥ `thincoder-core/provider/google.mjs:200-206`（同形）。**与事件 #846 强关联**：2026-10-03 两次桌面静默退出（均处「大下载网络窗 + LLM 流式在飞」）与该签名一致。
  2. **#17 · 退出泄漏**——win32 `killTree` 用异步 `spawn("taskkill", …)` ⇒ exit 阶段不生效，MCP stdio 子进程泄漏。坐标：`thincoder-cli/src/tui-lifecycle.mjs:98` → `thincoder-core/mcp.mjs:274→283` → `thincoder-core/mcp/transport-stdio.mjs:135`（`:4,15` 异步 spawn 无 spawnSync）。
- **关键判据**：修后「进程不可被此类未处理 error 事件杀死」为**可机检**验收面（单测：mock 掐流 ⇒ 触发 destroy 路径 ⇒ 断言进程存活/无未处理事件）；#17 判据 = 退出后无子进程残留（pid 存活面机检）。
- **范围与边界**：**只**收此两条（#16 全位点审计 + #17）；**不夹带**批②③④任何条目、不引入新机制语义——守卫类最小修（形由设计定：error listener ∥ safe-destroy 助手 ∥ 同步化 kill，但不得演化成网络层重构）。上游社区 PR（#16 附带 A/B 三态用例）可作设计输入（GitHub 经本机代理 `10.2.2.112:3128` 可达）。
- **授权口径**：设计轮 → **评审点火 = 用户权**（父侧提醒）→ 实施 = eng-coder（token 门）。
- **承前**：事件 #846（两次静默退出）证据链在分诊批 §1 补记与台账 #846；本批为其实修面。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审轮次 1 · 发现 1–4）全落 = §2 修正块；doc-check 复跑 exit 0（悬空 0 · 零净增））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03 · initial 轮）**

**本批条目（覆盖 · 台账 #866（GitHub #16）∥ #865（GitHub #17）——分诊批 C 线批①）**

- **R1 · #16 崩溃守卫（进程杀防线）**：`destroy(err)` 终止 response body 前挂**永久兜底 `'error'` 监听者**——单点 `destroyBody`（拟新增 `thincoder-core/stream-destroy.mjs`）全位点复用（proxy ∥ provider 共 4 处）；消费面语义零变。
- **R2 · #17 退出泄漏（MCP stdio 子进程）**：win32 `killTree` 异步 `spawn("taskkill")` → **同步 `spawnSync`**（参数与 `/T /F` 语义不变）；POSIX 分支核对并登记残面。
- **不覆盖（边界）**：不改流式语义本体（数据流 / 帧解析 / 消费者错误面——只加兜底）；不修直连 fetch 路径看门狗失效（新发现——上抛 U-CG-1）；不做 POSIX 强杀改造（force 标志 / Job Object 类——上抛 U-CG-2）；不夹带批②–④任何条目；不引入新机制语义；上游 PR #16 的合并 / 回帖动作（用户 / 父侧权）。
- **需求档合规检查**：本批两条 = 台账 #865 ∥ #866（tech_todo · `req_doc` 空）——**无需求档条目可对**（缺陷修复族）；如需需求层留痕，笔 = 主 agent（上抛 U-CG-4）。

**设计档落点（机制权威 · 本轮已落笔）**：`docs/core/design/PROXY.md`（§2 补 body 终止守卫 · §6.1 补坐标行 · §7 补 D-PX7——**机制单源**）· `docs/core/design/PROVIDER.md`（§6.3 补指针句）· `docs/core/design/MCP.md`（§6.6 stdio 行补树杀语义 · §7 补 D-MC17）。三档均 = 既有 owning 档（无新档）；各 +1 变更记录行。

**机制设计 · #16（守卫定形——单点 helper，全位点复用）**

**问题链（实读 + 本设计轮复现）**：`streamHttpResponse` 的 body = `sock.pipe(body)` 产出的 `PassThrough`（`thincoder-core/proxy.mjs:76` / `:124`）；旁观者窗的 `destroy(err)`（头后失败 `:94` ∥ body 空闲看门狗 `:99`）在**无 `'error'` 监听者的瞬间** emit 未处理 `'error'` ⇒ `uncaughtException` ⇒ 整个进程被杀（pipe 内部监听者触发即自摘 + 无他者时重发，同族）。
crash-report 三份（2026-09-22/23）签名 `Response body timeout (idle)` ← `Timeout._onTimeout`（`proxy.mjs:99`）= 此路径；与事件 #846（桌面两次静默退出）强关联。
**本设计轮实测（repro，非纸面）**：本地 net 回环 + `streamHttpResponse(…, bodyIdleMs=60)` 弃流 ⇒ **进程死亡**（`Unhandled 'error' event`，栈 `proxy.mjs:99`）；守卫四态实证 = 对照（裸 destroy）崩 ∥ 守卫 + 无消费者存活 + `errored` 保留 ∥ 在场 `for-await` 仍拒原错误 ∥ 迟到消费者仍拒原错误。

**定形**：单点 helper **`destroyBody(body, err)`**（拟新增 `thincoder-core/stream-destroy.mjs`——零 import 根模块；`files:["*.mjs"]` 自动随包）。契约四则：
① body 空 ∥ 非 destroy 形态（web `ReadableStream`）∥ 已 `destroyed` ⇒ 显式返回（no-op）；
② 首次调用挂**永久** no-op `'error'` 监听者（一次性标记防重复挂）；
③ 再 `destroy(err)`（原错误对象直传）；
④ **禁** `listenerCount('error')===0` 预检（pipe 监听者使计数失真——触发即自摘后重发）。

**全位点清单（#16 · 本批纳入 4 处）**：

| # | 位点 | 现行 | 改后 |
|---|---|---|---|
| 1 | `thincoder-core/proxy.mjs:94` | `else body.destroy(err)`（头后失败） | `else destroyBody(body, err)` |
| 2 | `thincoder-core/proxy.mjs:99` | 看门狗 `body.destroy(timeoutError(…))` | 同址换 `destroyBody(body, …)` |
| 3 | `thincoder-core/provider/sse.mjs:178` | `try { response.body?.destroy(…) } catch` | `try { destroyBody(response.body, …) } catch` |
| 4 | `thincoder-core/provider/google.mjs:203` | 同形（`google-sse-idle`） | 同形 |

**全仓同形面审计（实扫 · as-of 本设计轮）**：`\.destroy\(` 五树实扫——核树命中 = 上 4 处 + raw socket `destroy()`（**无 error 参数 ⇒ 不发 `'error'`**——不同形、零改：`thincoder-core/proxy.mjs:74,82,198,199,210,240,241,243` ∥ `thincoder-core/tools/ops.mjs:244`）；CLI ∥ VSC ∥ desktop ∥ render-core 四树 **零命中**。
**审计新发现（本批不修 · 上抛 U-CG-1）**：直连 fetch 路径 body = web `ReadableStream`（本设计轮实跑实证：`fetch` body 构造 = `ReadableStream`、`typeof destroy === "undefined"`）⇒ 现 `response.body?.destroy(…)` 抛 TypeError 被 try/catch 吞 ⇒ **读侧 120s 看门狗在直连路径静默失效**（proxy 路径正常；影响 = 无代理连接中途停摆时不断流）。修 = 断流 ∥ 错误传播语义变更，超「守卫类最小修」——登记上抛。

**机制设计 · #17（win32 同步化 + POSIX 分支核对）**

**问题链（实读）**：退出链 = `thincoder-cli/src/tui/tui-lifecycle.mjs:96-101`（`closeAllMcp`；闭包挂 `process.on("exit")`——仅同步合法，`:104` 注释）→ `thincoder-core/mcp.mjs:272-285`（`closeAllMcp` → `closeSession`）→ `thincoder-core/mcp/transport-stdio.mjs:135`（`close` → `killTree`）→ `:15` **异步** `spawn("taskkill", …)` ⇒ exit 阶段不落地 ⇒ 子进程树泄漏。

**定形**：`transport-stdio.mjs` win32 分支 `spawn` → **`spawnSync`**（参数逐字同：`["/pid", String(child.pid), "/T", "/F"]` + `{ stdio: "ignore", windowsHide: true }`；`try/catch` 保留）。代价 = close 同步阻塞 20–50ms（close 非热路径——每连接一次）——接受。

**POSIX 分支核对（结论）**：① `child.kill("SIGTERM")` = 同步系统调用 ⇒ 退出阶段可送达（守规子进程不泄漏）；② `2s → SIGKILL` 升级 = `setTimeout(…).unref()`——退出阶段**不触发**（忽略 SIGTERM 的子进程仍泄漏 = 既有残面，非本批引入）。本批**不修**（修 = force 标志三档穿透 ∥ 立即强杀语义变更——超守卫最小修），登记上抛 U-CG-2。

**同形审计（#17 · 退出相位杀点实扫）**：异步 spawn 杀树 = **仅** `thincoder-core/mcp/transport-stdio.mjs:15` 一处；核 `killProcessTree`（`thincoder-core/tools/process-tree.mjs:15`）= `execFileSync` **同步形**（非同形、零改）；CLI 两个 exit 处理器（`thincoder-cli/src/tui/index.mjs:125,249`）无其他子进程杀点。

**批内单测件（落点声明）**：`docs/batches/2026-10-03-crash-guards.test.mjs`（拟新增 · 随批留存 · 不进仓套件 · 实施轮由实施者编写并实跑）——用例表（T1–T11）：

| 用例 | 面 | 输入 | 预期输出（机检断言） |
|---|---|---|---|
| T1（对照 · 红） | #16 | 子进程：裸 `new PassThrough()` + `destroy(err)`（无监听者） | 退出码 ≠ 0（uncaughtException）——harness 自证能检出该缺陷类 |
| T2 | #16 | `destroyBody` 守卫 + 无消费者（含形态门边界锁：web `ReadableStream` ⇒ no-op 零抛） | 进程存活 ∥ `body.errored` = 原错误（消息逐字） |
| T3 | #16 | 守卫 + 在场 `for-await` 消费者 | 消费者拒 = 原错误（行为零变） |
| T4 | #16 | 守卫 + 迟到消费者（destroy 后起迭代） | 消费者拒 = 原错误（行为零变） |
| T5 | #16 · 端到端 | net 回环：头到齐即停 + `streamHttpResponse(…, bodyIdleMs=60)` 弃流 | 进程存活 ∥ `body.errored.message` 含 `Response body timeout (idle)` |
| T6 | #16 · sse 点位 | `readSSE` 假 response（`content-type: text/event-stream` + `PassThrough` body 无数据）+ mock timers 前推 120s | 进程存活 ∥ `readSSE` 拒（`sse-idle` 错误） |
| T7 | #16 · google 点位 | `chat()` 桩 `globalThis.fetch`（返回 ok + `PassThrough` body 无数据）+ mock timers 前推 120s | 进程存活 ∥ `chat` settle（google partial 保留径零变） |
| T8（对照 · 红） | #17 | 子进程：exit 处理器内**异步** `spawn("taskkill")` 杀替身 | 退出后替身存活（pid 存活面——缺陷复现） |
| T9 | #17 | 子进程：exit 处理器内 `stdioTransport.close()`（修后形；生产链 = `createExitCleanup` → `closeAllMcp` → `closeSession` → `transport.close`——叶子单测、链面零改） | 退出后子进程 + 孙进程皆死（`process.kill(pid, 0)` 抛 ESRCH） |
| T10 | #17 | 事件循环存活期 `close()`（非退出相位） | 树死（正常路径无回归） |
| T11（平台门） | #17 · POSIX | 同 T9 ∥ T10（非 win32 机位跑；本机 skip 并记录） | 守规子进程死；SIGTERM 忽略档 = 设计登记（不红） |

**受影响文件表（file:line 级 · 现行 ⇒ 预期——行数口径 = 内容行数（`countContentLines` 同口径，实读 as-of 2026-10-03 设计轮）；「预期」= 设计预算，实施轮按盘回填）**

| # | 文件 | 现行 ⇒ 预期 | 改动点 |
|---|---|---|---|
| 1 | `thincoder-core/stream-destroy.mjs` | 0 ⇒ ≈30（拟新增） | `destroyBody(body, err)` 单点（契约四则） |
| 2 | `thincoder-core/proxy.mjs` | 274 ⇒ ≈277 | import +1 ∥ `:94` ∥ `:99` 两处换 `destroyBody` |
| 3 | `thincoder-core/provider/sse.mjs` | 264 ⇒ ≈267 | import +1 ∥ `:178` 换 `destroyBody` |
| 4 | `thincoder-core/provider/google.mjs` | 257 ⇒ ≈260 | import +1 ∥ `:203` 换 `destroyBody` |
| 5 | `thincoder-core/mcp/transport-stdio.mjs` | 140 ⇒ ≈143 | import 补 `spawnSync` ∥ `:15` 同步化（注释随动） |
| 6 | `docs/core/design/PROXY.md` | 134 ⇒ **142**（已落） | §2 守卫段 +5 ∥ §6.1 +1 ∥ §7 +1 ∥ 变更记录 +1 |
| 7 | `docs/core/design/PROVIDER.md` | 571 ⇒ **573**（已落） | §6.3 指针句 +1 ∥ 变更记录 +1 |
| 8 | `docs/core/design/MCP.md` | 223 ⇒ **227**（已落） | §6.6 树杀语 +2 ∥ §7 +1 ∥ 变更记录 +1 |
| 9 | `docs/batches/2026-10-03-crash-guards.test.mjs` | 0 ⇒ ≈200（拟新增） | 批内件（T1–T11） |
| 10 | `docs/core/design/API-CONTRACT.md` | 生成区重跑（`node scripts/api-contract.mjs --write`——新导出 `destroyBody` 入区；实施轮 ∥ 父侧，沿 #841 U-6 先例） | 机制面 |

**验收对照（回指本批条目 + 可机检断言设计）**

| 条目 | 验收判据（可机检） | 机检面 |
|---|---|---|
| R1 | ① 对照腿（裸 `destroy(err)`）子进程必崩（退出码 ≠ 0）∥ 修后弃流窗存活 + `errored` 保留；② 消费面零变（在场 ∥ 迟到消费者仍拒原错误）；③ 端到端 net 回环存活；④ sse ∥ google 点位各一腿 | 批内件 T1–T7 |
| R2 | ① 对照腿（exit 相位异步 taskkill）替身存活 ∥ 修后 exit 相位 close ⇒ 子 + 孙 pid 皆死；② 正常相位无回归；③ POSIX 腿平台门（本机 skip 记录） | 批内件 T8–T11 |
| 边界 | `git diff --name-only` 全数落 5 产品档 + 3 设计档 + 批内件（拟新增）；零第三方依赖 ∥ 零发布链 ∥ 流式语义零改 | 实施轮核对 |

**关键决策（KD-CG-1–4）**

- **KD-CG-1 守卫形 = 单点 helper 全位点复用**（`destroyBody`——4 位点同一调用）。被否：位点内联「先挂 listener」——同形纪律复写三份（未来同形点位无单点可依）；`listenerCount('error')===0` 预检——pipe 监听者计数失真；只 try/catch——捕不到异步 emit（现行 try/catch 已证不足）。上游 PR #16 形（proxy 内局部 helper + sse/google 内联 = 两形并存）——本批取更严单点形。
- **KD-CG-2 helper 落点 = 新核根模块**（拟新增 `thincoder-core/stream-destroy.mjs`——零 import；随 `files:["*.mjs"]` 自动随包）。被否：挂 `proxy.mjs` 提供（provider 侧消费点向代理传输件借工具——层向不合）；并入 `abort-provenance.mjs`（该模块自述域 = abort 来源标注词汇表——非同域）。
- **KD-CG-3 #17 形 = win32 无条件同步化**（不做「按 exit 相位分流 force/async 标志」）。理由：exit 相位仅同步合法 ⇒ 同步是唯一正确形；close 非热路径（每连接一次，20–50ms 可接受）；分流 = 新机制语义 + 三档穿透（`tui-lifecycle` → `mcp.mjs` → `transport`）——超守卫类最小修。被否：分流形 ∥ 维持异步（缺陷照旧）。
- **KD-CG-4 直连路径 web `ReadableStream` 看门狗失效 = 本批不修（边界）**。理由：修 = 断流 ∥ 错误传播语义变更（cancel ⇒ 静默截断；fetch 层 abort 接入 = 网络层改造——批 §1 明禁）；守卫对其为显式 no-op（形态门）。去向 = 上抛 U-CG-1。

**上抛项**

- **U-CG-1（新发现 · 请父侧裁去路）**：直连 fetch 路径读侧 120s 看门狗静默失效（web `ReadableStream` 无 `destroy`——本设计轮实跑实证）。影响 = 无代理连接停摆时不断流（proxy 路径不受影响）；候选去向 = 台账登记（另批）∥ 单独立批设计（fetch 层断流链）。
- **U-CG-2（POSIX 残面 · 请裁）**：MCP stdio POSIX 分支 `SIGKILL` 升级 timer 退出阶段不触发 ⇒ 忽略 SIGTERM 的子进程仍泄漏（上游 #17 推断；本机无 POSIX 机位实测）。候选修 = force 标志三档穿透 ∥ 立即强杀；本批未取（超最小修）。
- **U-CG-3（流程面）**：`API-CONTRACT.md` 生成区重跑归实施轮 ∥ 父侧（沿 #841 U-6 先例）；批内件落点 = `docs/batches/2026-10-03-crash-guards.test.mjs`（拟新增——随批留存）。
- **U-CG-4（需求侧）**：本批无 `req_doc` 条目；如需需求层留痕（崩溃防线 ∥ 退出清场句），笔 = 主 agent。
- **U-CG-5（上游 PR）**：GitHub PR #16（ChpaMing）与本批设计同题——本批 = 自研加强形（单点 helper + 全仓审计 + 更宽用例面）；是否回帖 / 采纳对照 = 用户 / 父侧权（本席零动作）。

**本设计轮产物** = 本段 + 上列三设计档落笔（`PROXY.md` ∥ `PROVIDER.md` ∥ `MCP.md`）；评审点火 = 用户权。

**设计评审修正轮（fix · eng-designer · 2026-10-03——承 §3 轮次 1 发现 1–4）**

- **发现 4（残面去向）· 上抛 U-CG-2 跟踪补挂**：残面 = 退出相位仅 `SIGTERM` 送达、升级 timer 不触发（忽略 SIGTERM 的 MCP stdio 子进程仍泄漏）；跟踪去向 = 台账 **#877**（父侧已挂 · 2026-10-03 · trigger = 归批）；对外宣称口径按平台分档 = **win32 已修（`spawnSync` 同步化）∥ POSIX 保持 SIGTERM-only**。
- **发现 1–3 落点**：`docs/core/design/PROXY.md` 三处收正（§6.2 测试面收正 ∥ §2 body 管线两端写实 ∥ §6.1 补 provider 消费点坐标）+ 变更记录随动。**零新语义**（形态 ∥ 口径收正）。

## §3 设计评审（评审子代理）
**状态行**：评审完成（无🔴；1🟡∥3🔵）



### 轮次 1（评审子代理）

**评审对象**：crash-guards 批设计面（PROXY.md：body 终止守卫段 + D-PX7 ∥ PROVIDER.md：指针句 ∥ MCP.md：stdio 树杀语义 + D-MC17）· 触发 = #16（idle-watchdog body.destroy 进程杀）∥ #17（killTree 退出泄漏）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（跨档 lag） | 🟡 | PROXY.md:99（§6.2）断言「代理族单测在 CLI 测试树（`thincoder-cli/test/`）」；PROVIDER.md:177（§6.11）载「2026-09-28 测试树全清后，护栏随批重立于 `docs/batches/2026-09-29-provider-config-family.test.mjs`」——两档对测试资产现行落点的口径存在时点差；本批新增守卫的测试落点亦未与 §6.2 衔接 | 核对现行测试资产落点后收正 §6.2 表述（或标注 as-of 时点并指向批档测试面），使两档口径一致 |
| 2 | 清晰度 | 🔵 | PROXY.md:31 句面自指：`body = sock.pipe(body) 产出的 PassThrough`——左值与 pipe 实参同名，管线两端需读者自行推断 | 按实装把管线两端写实（源 → 目标），消除自指（措辞校对，语义零改） |
| 3 | 清晰度／坐标完整性 | 🔵 | PROXY.md:95 新增坐标行「消费点 `thincoder-core/proxy.mjs:94` ∥ `:99`」只覆盖 proxy 面；与「proxy ∥ provider 三文件共用」（PROXY.md:32 · D-PX7）不对称——provider 两消费点（PROVIDER.md:103：`readSSE` ∥ `parseGeminiStream`）在两档均无「档:行」级坐标 | 补 provider 消费点的档位级坐标，或在该行注明「消费点列仅覆盖 proxy 面、provider 面见 PROVIDER §6.3」 |
| 4 | 范围／残面登记 | 🔵 | MCP.md:106 ∥ D-MC17（MCP.md:185）已登记 POSIX 退出阶段残面（仅 SIGTERM 送达、升级 timer 不触发）且双向指；未挂跟踪去向——与 PROXY 侧「本批外发现 → 批档 §2 上抛」的处置形态不对齐 | 如需长尾跟踪，为残面补跟踪号或批档去向；对外宣称口径按平台分档（win32 已修 ∥ POSIX 保持 SIGTERM-only） |

**计数**：🔴 0 · 🟡 1 · 🔵 3（范围外注记——批档侧落账面 ∕ 文档地图缺失 ⇒ ownership 判据降级——见评审报告）

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
