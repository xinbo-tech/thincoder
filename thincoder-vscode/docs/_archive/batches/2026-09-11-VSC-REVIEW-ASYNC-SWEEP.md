# 批次记录（本仓份）— VSC-REVIEW-ASYNC-SWEEP（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **15** 条目 = §2「VSC 仓」表 15 行）；源档 blob SHA = d295763ac0e2。
> 源档案内锚：§2 `:56` / `:76`（VSC 15 / CLI 6）。

## 本仓份（逐字自源档搬运）

**VSC 仓（src 10 档 + 测试 5 档）**

| 文件 | 现 | 预计 | 条目 |
|---|---|---|---|
| `src/agent-tools/async-discard.mjs` | 64 | ~99 | B1 |
| `src/agent/run-stages.mjs` | 304 | ~306 | B1 |
| `src/agent-tools/advisor-async.mjs` | 493 | ≤498（**贴线**——越 500 停下报告） | B2 + B5 |
| `src/agent/execute-tools.mjs` | 483 | ~489 | B3 |
| `src/agent-tools/batch-segment.mjs` | 185 | ~188 | B3 |
| `src/advisor/compaction.mjs` | 171 | ~174 | B4 |
| `src/agent-tools/digest-budget.mjs` | 新 | ~70 | B5 |
| `src/agent-tools/subagent-async.mjs` | 499 | ~470（净减——迁出预算块） | B5 |
| `src/agent-tools/subagent-escalate-async.mjs` | 221 | ~224 | B5 |
| `src/agent-tools/consult.mjs` | 469 | ~473 | B5 |
| `test/async-parity.test.mjs` | 397 | ~440 | B1（T-D11~13） |
| `test/advisor-guard-completion.test.mjs` | 221 | ~280 | B2 / B3（T-RS / T-FZ） |
| `test/batch-segment.test.mjs` | 221 | ~245 | B3（T-FZ3） |
| `test/advisor-context-budget.test.mjs` | 155 | ~190 | B4（T-EST） |
| `test/eng-settlement.test.mjs` | 290 | ~330 | B5（T-DG1~3） |

**本仓侧验收面（源档条目行内——本仓相关）**：

| 条目 | 面 | 设计节 | AC | 本仓实施面 |
|---|---|---|---|---|
| B3 | 冻结窗口盲区（file_ops 拦 + 记；batch_segment 记；五面登记） | VSC ADVISOR-CONVERGENCE §17.2（T-FZ1~4——→ 修正轮 :128） | AC-B3-1 | VSC：execute-tools / batch-segment |
| B4 | estimateTokens CJK 低估（**双端**） | VSC §17.3（VSC 面 / T-EST1~2） | AC-B4-1（VSC） | VSC：advisor/compaction + 测试档 |
| B5 | digest 注入预算扩面（**双端**） | VSC AGENT-LOOP §16（VSC 镜像 / T-DG1~3） | AC-B5-1~3 | VSC：digest-budget 新档 + 四族注入器 + 测试档 |

> 行数 as-of 源档交付日（2026-09-11）。
