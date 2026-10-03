# 2026-10-03 · crash-guards · 崩溃族守卫（GitHub #16 ∥ #17）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 20:34「C 按批起跑」· 分诊批 docs/batches/2026-10-03-issue-triage.md §1（C 线批①）· 台账 #865 ∥ #866（事件 #846）。
> 台账 = #866 ∥ #865（core · 归批——分诊批 C 线批①）。前情 = docs/batches/2026-10-03-issue-triage.md §1（进行中——C 线来源）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-03
- **来源/授权**：用户 2026-10-03 20:34「C 按批起跑」= 分诊批（`docs/batches/2026-10-03-issue-triage.md`）C 线**批①**点火；条目 = 台账 #866（GitHub #16）∥ #865（GitHub #17）。
- **本批条目（两条，绑定）**：
  1. **#16 · 进程杀守卫**——idle-watchdog 掐流时 `body.destroy(…)` 无兜底 `'error'` listener ⇒ 未处理 error 事件 = **进程被杀**。坐标（分诊实读）：`thincoder-core/proxy.mjs:94,99` ∥ `thincoder-core/provider/sse.mjs:175-181` ∥ `thincoder-core/provider/google.mjs:200-206`（同形）。**与事件 #846 强关联**：2026-10-03 两次桌面静默退出（均处「大下载网络窗 + LLM 流式在飞」）与该签名一致。
  2. **#17 · 退出泄漏**——win32 `killTree` 用异步 `spawn("taskkill", …)` ⇒ exit 阶段不生效，MCP stdio 子进程泄漏。坐标：`thincoder-cli/src/tui-lifecycle.mjs:98` → `thincoder-core/mcp.mjs:274→283` → `thincoder-core/mcp/transport-stdio.mjs:135`（`:4,15` 异步 spawn 无 spawnSync）。
- **关键判据**：修后「进程不可被此类未处理 error 事件杀死」为**可机检**验收面（单测：mock 掐流 ⇒ 触发 destroy 路径 ⇒ 断言进程存活/无未处理事件）；#17 判据 = 退出后无子进程残留（pid 存活面机检）。
- **范围与边界**：**只**收此两条（#16 全位点审计 + #17）；**不夹带**批②③④任何条目、不引入新机制语义——守卫类最小修（形由设计定：error listener ∥ safe-destroy 助手 ∥ 同步化 kill，但不得演化成网络层重构）。上游社区 PR（#16 附带 A/B 三态用例）可作设计输入（GitHub 经本机代理 `10.2.2.112:3128` 可达）。
- **授权口径**：设计轮 → **评审点火 = 用户权**（父侧提醒）→ 实施 = eng-coder（token 门）。
- **承前**：事件 #846（两次静默退出）证据链在分诊批 §1 补记与台账 #846；本批为其实修面。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审轮次 1 · 发现 1–4）全落 = §2 修正块；实施窗回填轮落 = §2 回填块（坐标 ∥ 态 ∥ 行数按盘收正——§5 未闭合项 1–2 消解）；doc-check 复跑 exit 0（悬空 0 · 行宽 0））
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

**§2 回填块（实施窗回填 · fix 轮 · eng-designer · 2026-10-03——承 §5 未闭合项 1–2）**

**来源** = 实施舱上报（代码评审发现 2「拟新增」态滞后 ∥ 发现 3 消费点坐标 +1 漂移——Suggestion 列 = 实施舱上报）+ 父侧 fix 轮派单（号 1–2，执行者 = 本席）。**产品码零触**；落点 = 设计档三档（PROXY.md ∥ PROVIDER.md ∥ MCP.md）+ 本档 §2。**零语义改**（契约 ∥ 判断句 ∥ 机制描述零动）。

**号 1 —— 「拟新增」态 ⇒ 按盘翻「已落」**：
- `docs/core/design/PROXY.md:32` ∥ `:95` ∥ `:101`：「拟新增」⇒「已落」（实据 = `thincoder-core/stream-destroy.mjs` 在盘 35 行、导出 `destroyBody` = `:28`；批内件 `docs/batches/2026-10-03-crash-guards.test.mjs` 在盘 257 行）。
- `docs/core/design/PROVIDER.md` ∥ `docs/core/design/MCP.md` **同族核对 = 零改**：本批面无「拟新增」态（§6.3 守卫指针句 ∥ §6.6 树杀语 + D-MC17 与实装逐字对上）；本批面零行号级坐标（无漂移面）。
- 变更记录 = `PROXY.md` +1 行（本轮回填入档）；`PROVIDER.md` ∥ `MCP.md` 零改（无变更零留痕）。

**号 2 —— 消费点坐标 +1 漂移 ⇒ 按盘收正**：
- `docs/core/design/PROXY.md:95` 四坐标：`thincoder-core/proxy.mjs` `:94 ⇒ :95` ∥ `:99 ⇒ :100` · `thincoder-core/provider/sse.mjs` `:178 ⇒ :179` · `thincoder-core/provider/google.mjs` `:203 ⇒ :204`（各档 import +1 所致）。
- 同族补收（本回填轮实扫新发现——派单清单外，按盘收正）：`docs/core/design/PROXY.md:31` 管线两端坐标同受 +1 漂移——`:76 ⇒ :77`（`const body = new PassThrough()` 现址）∥ `:124 ⇒ :125`（`sock.pipe(body)` 现址）。
- 实读对位（逐处）：`thincoder-core/proxy.mjs:95` `else destroyBody(body, err)` ∥ `:100` 看门狗 `destroyBody(...)` ∥ `thincoder-core/provider/sse.mjs:179` ∥ `thincoder-core/provider/google.mjs:204`（`try { destroyBody(…) } catch` 保留）∥ `thincoder-core/mcp/transport-stdio.mjs:17` `spawnSync("taskkill", …)`。

**受影响文件表「预期」列齐平（按盘实测 · 内容行数 KD-4 口径 · as-of 2026-10-03 本回填轮；表列「预期」以本块为准）**

| # | 文件 | 实测（现行 ⇒ 实测） | 对预算 |
|---|---|---|---|
| 1 | `thincoder-core/stream-destroy.mjs` | 0 ⇒ **35**（已落） | ≈30 |
| 2 | `thincoder-core/proxy.mjs` | 274 ⇒ **275** | ≈277 |
| 3 | `thincoder-core/provider/sse.mjs` | 264 ⇒ **265** | ≈267 |
| 4 | `thincoder-core/provider/google.mjs` | 257 ⇒ **258** | ≈260 |
| 5 | `thincoder-core/mcp/transport-stdio.mjs` | 140 ⇒ **142** | ≈143 |
| 6 | `docs/core/design/PROXY.md` | 134 ⇒ **146**（原表 142 滞后——修正轮后未随盘；含本回填轮变更记录 +1） | — |
| 7 | `docs/core/design/PROVIDER.md` | 571 ⇒ **573** ✓ | — |
| 8 | `docs/core/design/MCP.md` | 223 ⇒ **227** ✓ | — |
| 9 | `docs/batches/2026-10-03-crash-guards.test.mjs` | 0 ⇒ **257**（已落） | ≈200 |
| 10 | `docs/core/design/API-CONTRACT.md` | 生成区重跑（2839 条）：`:1517` 入 `destroyBody`（坐标 `thincoder-core/stream-destroy.mjs:28`）∥ 四档行号随动 ∥ desktop `update.mjs` 他批机械漂移 | **2949** |

**机检读数**：仓根 `node scripts/doc-check.mjs` = **exit 0**（OK(锚)：0 条悬空 ∥ OK(行宽)：零超宽）；行数面差异 7 条（全 `docs/desktop/design` 面他批项——非本批面）。批内产品档 ∥ 单测件全 ≤300 建议线（最高 = `thincoder-core/proxy.mjs` **275**）。

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

**2026-10-03 21:22 · 用户一句「都批」**——崩溃族守卫批获准进入实施（与桌面 Linux 批同批批准）。

- **依据（三条件齐备）**：① 设计评审通过（0🔴 ∥ 1🟡 ∥ 3🔵——发现表 = §3 轮次 1）；② 修复轮 4/4 落地并父侧逐条核验（`docs/core/design/PROXY.md:31` ∥ `:95` ∥ `:99-102` ∥ 本档 §2 修正块；doc-check 复跑 exit 0）；③ 设计令牌已签发（**值不入档**）。
- **批准范围** = §2 全量（新档 `stream-destroy.mjs` ∥ 四消费点接线 ∥ #17 `transport-stdio.mjs` `spawnSync` 化 ∥ 批内单测 T1–T11 ∥ API-CONTRACT 重跑）；无新增范围。
- **批准态**：已批准（2026-10-03）

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-03 · 批内件 EXIT=0（10 pass ∥ 1 skip ∥ 0 fail）· 审计 1 轮 CLEAN · 代码评审 1 轮 pass（0🔴）；终态 clean）



**§5 批次实施记录（eng-coder · 2026-10-03 · initial 轮）**

**交付摘要（按 §2 全量实现 · 五产品档 + 批内件 + 生成区）**

| # | 文件 | 改动（file:line 级） | 行数（KD-4 内容行） |
|---|---|---|---|
| 1 | `thincoder-core/stream-destroy.mjs` | 拟新增 → **已落**：`destroyBody(body, err)` 单点（契约四则：`:29` 形态门/已 destroyed ⇒ no-op ∥ `:30-33` Symbol 一次性标记 + 永久 no-op `'error'` 监听者 ∥ `:34` `destroy(err)` 原错误直传 ∥ 全文无 `listenerCount` 预检）；零 import | **35**（预算 ≈30） |
| 2 | `thincoder-core/proxy.mjs` | `:10` import +1 ∥ `:95` 头后失败换 `destroyBody` ∥ `:100` body 看门狗换 `destroyBody` | **275**（274 ⇒ 预算 ≈277） |
| 3 | `thincoder-core/provider/sse.mjs` | `:6` import +1 ∥ `:179` 看门狗换 `destroyBody`（try/catch 保留） | **265**（264 ⇒ 预算 ≈267） |
| 4 | `thincoder-core/provider/google.mjs` | `:11` import +1 ∥ `:204` 看门狗换 `destroyBody`（try/catch 保留） | **258**（257 ⇒ 预算 ≈260） |
| 5 | `thincoder-core/mcp/transport-stdio.mjs` | `:4` import 补 `spawnSync` ∥ `:7-13` 注释随动（同步化理由）∥ `:17` `spawn("taskkill"…)` → **`spawnSync`**（参数逐字同 + `{ stdio: "ignore", windowsHide: true }` + try/catch 保留）；POSIX 分支零改 | **142**（140 ⇒ 预算 ≈143） |
| 6 | `docs/batches/2026-10-03-crash-guards.test.mjs` | 拟新增 → **已落**：T1–T11（纯 Node 内建；两条对照红腿 T1 ∥ T8 + 两处用例技术隔离，见决策表） | **257**（预算 ≈200） |
| 7 | `docs/core/design/API-CONTRACT.md` | 生成区重跑（`node scripts/api-contract.mjs --write` · 2839 条）：`:1517` 入 `destroyBody`（坐标 `thincoder-core/stream-destroy.mjs:28`）+ 四档行号随动 + 他批机械漂移（desktop `update.mjs`——本批未触该档，生成区按源全量重算的必然包含） | **2949**（机制面） |

**验收读数（四条 · 机检）**

① **批内件全绿**：仓根 `node --test docs/batches/2026-10-03-crash-guards.test.mjs` ⇒ **EXIT=0**；`tests 11 = pass 10 ∥ fail 0 ∥ skipped 1`（T11 平台门 = 本机 win32 按设计 skip 并记录）。逐腿：T1 ✔（对照红：裸 `destroy(err)` 子进程退出码 ≠ 0、stderr 含 `Unhandled 'error' event`）∥ T2–T4 ✔（守卫四态：无消费者存活 ∥ errored 保留原错误 ∥ 形态门 no-op ∥ 在场/迟到消费者仍拒原错误）∥ T5 ✔（net 回环端到端：存活 + `Response body timeout (idle)` + `proxy-body-idle`）∥ T6/T7 ✔（sse ∥ google 点位，mock timers 前推 120s）∥ T8 ✔（对照红：#17 异步形不送达 ⇒ 替身存活）∥ T9/T10 ✔（生产形：子+孙+曾孙皆死 ∥ 正常相位无回归）。

② **对照腿先红后绿（实跑读数）**：
- **#16 红** = 接线前实跑裸 `destroy(err)`（net 回环 + `bodyIdleMs=60` 弃流）⇒ **进程被杀**（`Unhandled 'error' event`，栈 `proxy.mjs:99`，与三份 crash-report 签名逐字一致）；**绿** = 接线后同场景 **存活** + `body.errored` = 原错误（`Response body timeout (idle)` · `abortInfo.detail = proxy-body-idle`）。
- **#17 红** = 接线前实跑生产形（`stdioTransport("node", …)` ⇒ cmd.exe 包装链 + exit 相位 `close()`）⇒ **server + 孙存活、心跳持续推进**（泄漏复现）；**绿** = `spawnSync` 化后同场景 **全死、心跳冻结**。
- **控制腿机制隔离（实跑实证 + libuv `src/win/process.c` 实读）**：Windows/Node 把非 detached 子进程挂进 libuv 全局 job（`KILL_ON_JOB_CLOSE`）⇒ 父退出即清杀直接子进程，**掩盖**「退出相位异步 taskkill 不送达」；现场泄漏形态 = cmd.exe 包装链孙进程静默逃逸 job。故 T8 用 **detached 替身**（逃逸隔离 ⇒ 异步形不动，缺陷可判别）；T9/T10 用 **生产形**（命令非 .exe ⇒ cmd.exe 包装链）。已在批内件档头 `:12-19` + 本节披露；#16 覆盖口径（T6/T7 = 接线零回归腿）在档头 `:8-9`。

③ **API-CONTRACT 生成区重跑**：`--write` 落盘（2839 条）· diff 实核 = `destroyBody` 入区 + 四档行号随动（+1~+2，import/注释所致）+ desktop `update.mjs` 他批机械漂移。

④ **行数读数**：见上表（全部 ≤300 建议线）。

**决策透明表（实施轮）**

| # | 决策 | 理由 / 披露 |
|---|---|---|
| I-1 | T8 用 detached 替身（非朴素直接子进程） | 实跑实证：非 detached 子进程被 libuv job 父死清杀，朴素替身在**任何**实现下都死 ⇒ 控制腿失去检出力；detached 是唯一能隔离「异步不送达」机制的形。属**用例技术隔离**（§2 用例语义「异步形 ⇒ 替身存活」原样成立），档头实文披露 |
| I-2 | T9/T10 夹具命令 = `"node"`（走 cmd.exe 包装链）而非 `process.execPath` | 直连 node 子进程被 job 清杀（无论修没修）⇒ 腿失判别力；cmd.exe 包装链 = 现场泄漏形态（孙进程逃逸 job），修复与否判别明确。依赖 = PATH 可解析 `node`（本机实核 `C:\Program Files\nodejs\node.exe`） |
| I-3 | T7 断言由「`result.partial === true`」收窄为「resolve（partial 保留径）+ 零内容返回形」 | 实读 `google.mjs:134-148`：`chat()` 返回面 = `{content, reasoning, usage?, toolCalls}`——内部 `partial` 标志不过 chat 边界；原断言在**任何**实现下取不到值（非本批缺陷）。收窄后仍判别：throw 径（无 partial 保留）会在此处红 |
| I-4 | §2 受影响表「预期」列回填 = 入 §5（本段），不改 §2 正文 | §2 = eng-designer 段（一段一作者）；实施轮读数落 §5，差异以盘读为准 |
| I-5 | 三设计档**零触碰**（含评审发现 2/3 的态滞后与坐标漂移） | 任务书明禁（设计档 = eng-designer 域）；漂移面已披露，去向 = 设计侧随动轮 |

**审计与代码评审（轮次与终态）**

- **独立偏离审计（explore · 只读 · 1 轮）**：四类偏差（部分实现 ∥ 静默简化 ∥ 设计漂移 ∥ 表外改动）**全未发现** ⇒ **CLEAN**；补充记录 F1（§5 空档——本段即其闭合）、F2（三设计档坐标/「拟新增」态滞后——上报）、F3（审计装配无执行工具，批内件复跑与红/绿为实施方读数）——均已处置/披露。
- **独立代码评审（advisor · code · 轮 1）**：**pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）。处置：🟡#1 §5 空档 ⇒ **本段闭合**；🟡#2 PROXY.md「拟新增」态滞后 ∥ 🔵#3 同档坐标 +1 ⇒ **立据不改**（超实施者写权）——上报设计侧随动；🔵#4（T6/T7 覆盖口径注记）⇒ **已修**（档头 `:8-9`）；🔵#5（判活助手 EPERM 面）⇒ **部分修**（`isDead` 收紧为 `e.code === "ESRCH"` 判死；T8 固定窗不改——机制上异步形永不送达、detached 无清杀，窗内读数即终态）。**修后复跑：EXIT=0 · 10 pass ∥ 1 skip ∥ 0 fail（终态）**。
- **终态 = clean**（实施 → 审计 1 轮 CLEAN → 评审 1 轮 pass → 微修 2 项 → 复跑绿）。

**未闭合项（上报 · 非本席可动）**

1. 三设计档随动：`PROXY.md:95`（消费点坐标载 94/99/178/203 ⇒ 实装 95/100/179/204）∥ `:32`/`:95`/`:101`「拟新增」态 ⇒ 已建；`MCP.md` ∥ `PROVIDER.md` 行号同族核对建议。去向 = eng-designer 随动/父侧。
2. §2 受影响表「预期」↔ 盘读差异（proxy 275 vs ≈277 ∥ sse 265 vs ≈267 ∥ google 258 vs ≈260）——§2 域，零触；读数已落本段。
3. 设计已裁残面（不改）：U-CG-1 直连 fetch web `ReadableStream` ⇒ 守卫显式 no-op、读侧看门狗静默失效；U-CG-2 POSIX 退出相位仅 SIGTERM。
4. 发行链（批边界外）：VSC/桌面经 `@thincoder/core` 包消费 ⇒ 两端面待核下次发布/打包才带守卫（供 §6 对外宣称口径分档）。

## §6 验证与收口（父代理）

**批次**：crash-guards（C 线批① · #16 ∥ #17 · 2026-10-03）——§1 起全链（讨论 → 设计 → 评审 → 修复 → 批准 → 实施 → 回填 → 收口）。

**验证读数（父侧亲跑——不采信自报）**
- 批内件 `node --test docs/batches/2026-10-03-crash-guards.test.mjs` = **EXIT 0**（11 用例 = 10 pass ∥ 1 skip〔T11 POSIX 平台门〕∥ 0 fail）。
- 五产品档 `node --check` 全过；新档 `thincoder-core/stream-destroy.mjs` 通读 = 契约四则逐条对上（含禁项「无 `listenerCount` 预检」落空）。
- 全位点 grep：`thincoder-core/proxy.mjs:95` ∥ `:100` ∥ `provider/sse.mjs:179` ∥ `provider/google.mjs:204` ∥ `mcp/transport-stdio.mjs:17`（taskkill 参数逐字）。
- `docs/core/design/API-CONTRACT.md:1517` = `destroyBody` → `thincoder-core/stream-destroy.mjs:28`（与导出位逐字）。
- 仓套件（收口闸）：核包 `npm test` = **EXIT 0**（本仓 2026-09-28 全清后为批内件制度——manifest 空 ⇒ 绿；验证载体 = 批内件）。
- doc-check 复跑 = **EXIT 0**（悬空 0 ∥ 行宽 0）。
- 对照腿证据（舱内实跑 + 父侧核）：#16 先红（进程被杀 · 栈 `proxy.mjs:99` · 与 2026-09-22/23 三份 crash-report 签名逐字）→ 后绿（存活 · `errored` = 原错误对象）；#17 先红（生产形孙进程泄漏 · 心跳持续推进）→ 后绿（全死 · 心跳冻结）。

**验收对照（条目 → 读数）**：R1 ✅（单点守卫 + 四消费点全位点接线）∥ R2 ✅（win32 `killTree` `spawnSync` 同步化）∥ AC① ✅（批内件 11 用例）∥ AC② ✅（两缺陷先红后绿对）∥ AC③ ✅（`destroyBody` 入生成区）∥ AC④ ✅（行数全 ≤300——最高 `proxy.mjs` 275）。

**结算**
- 台账：**#865**（GitHub #17）∥ **#866**（GitHub #16）⇒ 在途 → 待核销 → **已核销**（依据 = 本档 §6 ∥ 提交 `0e121714`）。
- 上抛归位：**U-CG-1**（直连 fetch 看门狗失效）⇒ 台账 **#878**（归批）∥ **U-CG-2**（POSIX 残面）⇒ 台账 **#877**（归批——对外文案分档在册）。
- **U-CG-4 裁** = 不留痕（缺陷修复类——无新语义需求；如后需可随时立）。
- **U-CG-5**（上游 PR #16 回帖）= **用户权**——登记待用户。
- 前批遗留复核：无（本批独立立链）；暂缓批复核：无。

**对外口径（分档）**：win32 已修（`spawnSync`）∥ POSIX 保持 SIGTERM-only（#877）；守卫随核包消费 ⇒ 桌面 ∥ VSC 随下次发布/打包带出（本批不触两端面）。

**提交**：`0e121714`（实施）∥ 本收口轮记录提交（随后）。
