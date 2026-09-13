# 批次记录（本仓份）— SPAWN-QUEUE-DISCIPLINE（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-SPAWN-QUEUE-DISCIPLINE（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **2** 条目 = 本仓两档落点）；源档 blob SHA = 0c4e43b2f3a2。
> 源档案内锚：§2 `:40`–`:42` 三档（CLI 1 + VSC 2）。

## 本仓份（逐字自源档搬运）

**落点（3 档——纯插入，各 +1 行；本仓 2 档）**：
- `thincoder-vscode/src/prompts/discipline-engineering.md` —— 同款锚（as-of `:206`）之前；
- `thincoder-vscode/src/prompts/persona-engineering.md` —— Multi-Task 对位段：同款锚（as-of `:81`）之前（即 R14 段后）。

> 共同插入锚（对端份行内）：含 `**Keep the concurrency cap` 的行之前。

**端差登记（源档 §2 行内）**：CLI `src/prompts/persona-engineering.md` 端无 Multi-Task/调度对位段（实测零 `Multi-Task`/`Declare spawn`）；**VSC pe 的 Multi-Task 段为 VSC 端特有端段**（锚#7 断言宿主 = VSC pe）。端差零新增——不强行对称。

**本批条目（源档 §2——逐条机验回指见「机验断言」）**：
① spawn 一律带 `files`/`dependsOn` 后**直接提交**；
② 域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；
③ **不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。
