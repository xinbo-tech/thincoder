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
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
