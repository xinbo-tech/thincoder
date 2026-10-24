# TIMEOUT-DIGEST.md — 超时旋钮与投递兜底（body 空闲可配 · 子代理报告无条件落盘 · 完成门认池）

> 板 = core。本档持三个机制的当前真值：① provider 响应体空闲超时可配（GitHub #22）；② 异步子代理报告无条件落盘（Gitee IKKBF8 发现 3）；③ 完成门的 pending-task 推回认后台池（GitHub #29）。
> 基础机制（重试语义 / SSE 读侧看门狗 / digest 注入文法 / 挂起尾巴）仍住各自板：`docs/core/design/PROVIDER.md` §6.3 · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 · `docs/core/design/AGENT-LOOP.md` §9。本档只写被本批改写的那部分事实，不重述基础语义。
> 编制 = eng-designer · 2026-10-24 · 批档 = `docs/batches/2026-10-24-timeout-and-digest.md`。

## 1. 方案与理由

**closest-precedent（最近的先例）**：头部超时已是可配项——`effectiveFetchTimeoutMs`（`thincoder-core/provider/core.mjs:72-74`）读 `provider.fetchTimeoutMs`，由 `thincoder-core/config.mjs:350-352` 从 `agent.fetchTimeoutMs` 提升而来。

- **对齐**：body 空闲超时照同一形——配置键在 `DEFAULTS.agent`，装载期提升为 `provider.*`，再经同名式 helper 解析。同一条链上的两个超时从此同构。
- **偏离**：默认值的家 = `config-defaults.mjs` 的 DEFAULTS 表，不是只住常量。理由：`settings list` 展平的是活配置对象（`thincoder-core/agent-tools/settings.mjs:269-272`），未登记进 DEFAULTS 的键在 `list` 里看不见，判据「`settings list` 能看到该键」就无法满足；`fetchTimeoutMs` 正因此至今不可见（本轮不改它，见 §7）。
- **反向先例（对照着偏离）**：`docs/core/design/AGENT-PARAMS.md:21` 记 `advisor.timeoutMs` 的默认值只住 `REVIEW_TIMEOUT_MS` 常量、不写进 `DEFAULTS.agent.advisor`——本键因「`settings list` 可见」判据必须登记 DEFAULTS，故不沿用该处置；`/config` 不新增编辑项一节仍与该档同档（§8）。

**survey-evidence（查了哪些公开源 / 有无相关内容）**：`index.publicRepos = []`（`PROJECT-MANIFEST.json`），本仓无公开源仓可查。
查了本仓四处状态档：`docs/core/design/PROVIDER.md` §6.3 记「body 阶段用读侧空闲超时」；`docs/core/design/AGENT-LOOP.md:321` 记「pending tasks 提醒最多推回一次，task 更新即重置」；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 记 digest 注入单点 = `injectAsyncResult`；`docs/core/design/AGENT-PARAMS.md:21` 记 `advisor.timeoutMs` 默认只住常量的反向先例。
四处都只记现状，与本批目标不冲突；其中两处事实被本批改写，已就地更新并指回本档。

**分支依据（每个新增分支带证据）**：

| 分支 | 依据 |
|---|---|
| 超时值 `≤0` / 非有限数 ⇒ 回退默认 | 同 `effectiveFetchTimeoutMs` 的既有判式（`provider/core.mjs:73`）；手写 config.json 的非法值不得静默禁用保护（`docs/core/design/AGENT-PARAMS.md` §2 同款裁定） |
| 落盘改用 `offloadToolResult` 的 `force` 支，而不是新写一个落盘函数 | `offloadToolResult` 已是「预览 + 路径」文案单源（`thincoder-core/agent/helpers.mjs:156-172`）；同文案两处实现 = 漂移 |
| `force` 支按正文长度二分渲染：≤64K 原样一份 + 路径；>64K 双端预览 + 路径 | `buildDualEndPreview` 对 `text.length ≤ 16K` 的正文头尾各返整串（`thincoder-core/agent/helpers.mjs:57`、`:72-76`）——原样复用会注入「正文两份 + `middle omitted: 0 chars`」，A4 的 200 字符用例正是此形（评审 #1） |
| 判超记账保留、布尔改作渲染档位（超轮预算 ⇒ 只给清单行 + 路径），落盘不再看它 | `digestBudgetOver` 的 `used` 是四族共享的轮累计（`thincoder-core/agent-tools/digest-budget.mjs:51-56`）；删调用会让 consult 族的累计口径跟着变；渲染保留它，单轮 inline 正文仍受 64K 预算约束（评审 #7） |
| 完成门加 `!poolLive(agent)` | 挂起尾巴已用同判据（`thincoder-core/agent/suspension.mjs:296`）；二次立口径 = 池空判定两处漂移 |

## 2. 接口契约

### 2.1 配置键 `agent.bodyIdleTimeoutMs`

| 项 | 值 |
|---|---|
| 键 | `agent.bodyIdleTimeoutMs` |
| 单位 / 类型 | 毫秒，正整数（`Number.isFinite(v) && v > 0`） |
| 默认值 | `120000`（单源常量 `DEFAULT_BODY_IDLE_MS`，`thincoder-core/config-defaults.mjs`） |
| 非法值 | `≤0` / 非数字 / 缺省 ⇒ 回退 `DEFAULT_BODY_IDLE_MS`（不抛错、不静默禁用） |
| 读取链 | `DEFAULTS.agent.bodyIdleTimeoutMs` → `loadConfig` 提升 `merged.provider.bodyIdleTimeoutMs`（同 `fetchTimeoutMs` 形：后者 `config.mjs:361-363`，本键 `config.mjs:366-367`）→ `effectiveBodyIdleMs(provider)` 消费 |
| 写面 | `settings set agent.bodyIdleTimeoutMs <ms>`（数值叶子自动派生类型，无需形状表行）；手写 `config.json` 同效；`null` = 删键回退默认 |
| 生效时机 | 下一回合（回合边界键） |

`effectiveBodyIdleMs(provider)` 住 `thincoder-core/provider/core.mjs:79-82`，与 `effectiveFetchTimeoutMs`（`:72-74`）相邻：

```js
export function effectiveBodyIdleMs(provider) {
  return Number.isFinite(provider?.bodyIdleTimeoutMs) && provider.bodyIdleTimeoutMs > 0
    ? provider.bodyIdleTimeoutMs : DEFAULT_BODY_IDLE_MS
}
```

**八处消费点同读它（唯一解析点，无第二处取值）**：

| 消费点 | 当前形 |
|---|---|
| `provider/core.mjs:256` / `:274` `readSSE` 调用 | `idleMs: effectiveBodyIdleMs(provider)`（主路径 / 重试路径各一处） |
| `provider/core.mjs:413` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/sse.mjs:93` 读侧定时器入参 | `idleMs = DEFAULT_BODY_IDLE_MS`（缺省即单源常量；超时文案用实际值） |
| `provider/google.mjs:134` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/google.mjs:139` / `:172` Gemini 流解析器 | `:139` 传 `idleMs: effectiveBodyIdleMs(provider)`；`:172` 形参缺省 `idleMs = DEFAULT_BODY_IDLE_MS` |
| `provider/anthropic.mjs:225` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/responses.mjs:248` / `:267` / `:285` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)`（三条分支同值） |
| `proxy.mjs:52` · `proxy-transport.mjs:234` 缺省值 | `opts?._bodyIdleMs ?? DEFAULT_BODY_IDLE_MS`（未传 `_bodyIdleMs` 时的传输层缺省，与 provider 缺省同值同源）；`proxy-transport.mjs:43` 形参缺省同源 |

数据流：配置盘 → `loadConfig` 合并 + 提升 → `agent.config.provider.bodyIdleTimeoutMs` → `chat(provider)` 各 transport → 两条读侧路径（直连 fetch 的读者定时器 ∥ 代理的 `_bodyIdleMs`）读同一个值。

### 2.2 报告落盘（`thincoder-core/agent/helpers.mjs` `offloadToolResult` + `subagent-async.mjs` 注入点）

`offloadToolResult(text, callId, dir?, { force = false })` 增一个开关 `force`。**`force` 只改「是否落盘」，不改「渲染形态」**——渲染按与既有长度门同一个常量二分：

| 情形 | 落盘 | 注入体（正文部分） |
|---|---|---|
| 正文 ≤ `TOOL_RESULT_OFFLOAD_LIMIT`（64K） | 恒写 | **正文原样一份** + `full content saved to: <path>` + 读取提示（无 `middle omitted`、无 `too large` 字样） |
| 正文 > 64K | 恒写 | 双端预览（头 16K + `middle omitted: N chars`（N>0）+ 尾）+ `output too large (N chars total), full content saved to: <path>` |
| 轮累计超预算（`over` 为真，见下） | 恒写（经 `persistOverflowReport`，现形即如此） | 只给既有清单行——`thincoder-core/agent-tools/digest-budget.mjs:73` 的单源整串 `Report saved to disk (digest inject budget exceeded — full text not inlined): <path>` + `Read it with the read tool (offset/limit).`（正文不进请求体，全量在盘；同一事件只此一处文案） |
| 写盘失败 | — | 回落同一正文形态（≤64K 原样 / >64K 双端预览）+ `offload to disk failed`；报告不吞、不抛 |

- 注入点 `thincoder-core/agent-tools/subagent-async.mjs:388` 改为两条路都落盘（不再有「不落盘」的路径）：

```js
const over = digestBudgetOver(agent, raw.length)   // 记账保留（consult 族共享轮累计）；超预算 ⇒ 清单行档
const preview = (over && await persistOverflowReport(raw, { tag: `async-subagent-${entry.id}` }))
  || await offloadToolResult(raw, `async-subagent-${entry.id}`, _digestOffloadDirForTest(), { force: true })
```

- **轮预算仍约束本族**：`over` 为真（`thincoder-core/agent-tools/digest-budget.mjs:53` 的 `round.used > 0 && round.used + size > 64K`）⇒ 只给清单行 + 路径，正文不进请求体；首条豁免照旧（`used === 0` 不判超）。单轮 inline 正文总量 ≈ ≤64K——越预算那条及其后恒走清单行，首条 >64K 也只渲染 ≤64K 预览，与现状同量级（评审 #7 / #14）。
- **测试缝**：`dir` 由注入点从既有缝取值——`digest-budget.mjs` 增 `_digestOffloadDirForTest()`（无参返回 `_digestOffloadDirOverride ?? undefined`），生产恒 `undefined` ⇒ 默认 `configDir/tool-results`。一条缝覆盖 `persistOverflowReport` 与 `offloadToolResult` 两族，不立第二条。
- `persistOverflowReport`（`digest-budget.mjs:66`）既是本注入点超预算档的落盘 + 清单行单源，也保留给其它族，语义不变。
- 覆盖族：`subagent` / `advisor` / `escalate`（同经 `injectAsyncResult`）。`bg` / `browser` 族自有注入器，不入本契约（见 §7）。

### 2.3 完成门（`thincoder-core/agent/completion.mjs:62`）

```js
if (depth === 0 && !agent.config?.agent?.engineering && !poolLive(agent)
    && agent.tasks.some((t) => t.status === "pending") && (agent._taskPushbacks ?? 0) < 1) {
```

- `poolLive` 取自 `thincoder-core/agent/suspension.mjs:64`（已导出）——与挂起尾巴 `:296` 同一判据，不立第二口径。
- `task.mjs:83` 的 `_taskPushbacks = 0` 语义**不动**：池空（`!poolLive`）时列表一更新仍获一次新提醒；池里有在飞条目时门不触发，归零不再变成「拖回合」。
- 若 `completion.mjs → suspension.mjs` 在实施时成环（`node --check` / 启动自检报 TDZ 或循环初始化），把 `poolLive` 判据体迁到叶子 `thincoder-core/agent/pool-live.mjs`，`suspension.mjs` 保留同名 re-export——消费面零改。这是模块图的机械约束，不是新语义。

## 3. 受影响文件（行数为本轮实读 2026-10-24）

| 文件 | 当前行数 | 本层 Δ | 改动 |
|---|---|---|---|
| `thincoder-core/config-defaults.mjs` | 100 | +3 | `DEFAULT_BODY_IDLE_MS = 120000` 单源常量（`:17`）；`DEFAULTS.agent.bodyIdleTimeoutMs` 登记（`:30`） |
| `thincoder-core/config.mjs` | 453 | +4 | `:361-363` 提升 `provider.fetchTimeoutMs`；`:366-367` 提升 `provider.bodyIdleTimeoutMs` |
| `thincoder-core/provider/core.mjs` | 478 | +7 / −2 | `:79-82` `effectiveBodyIdleMs` 唯一解析点；`:256` / `:274` / `:413` 三处读它 |
| `thincoder-core/provider/sse.mjs` | 300 | +4 / −3 | `:93` `readSSE` 收 `idleMs` 入参（缺省 `DEFAULT_BODY_IDLE_MS`）；超时文案用实际值 |
| `thincoder-core/provider/google.mjs` | 292 | +4 / −3 | `:134` / `:139` 读 `effectiveBodyIdleMs`；`:172` `parseGeminiStream` 收 `idleMs` 入参（缺省单源） |
| `thincoder-core/provider/anthropic.mjs` | 362 | +1 / −1 | `:225` 代理分支 `_bodyIdleMs` |
| `thincoder-core/provider/responses.mjs` | 307 | +3 / −3 | `:248` / `:267` / `:285` 三条传输分支 `_bodyIdleMs` |
| `thincoder-core/proxy.mjs` | 54 | +2 / −1 | `:52` 缺省 `DEFAULT_BODY_IDLE_MS` |
| `thincoder-core/proxy-transport.mjs` | 300 | +3 / −2 | `:43` 形参缺省 + `:234` 读 `opts?._bodyIdleMs`，均落 `DEFAULT_BODY_IDLE_MS` |
| `thincoder-core/agent/helpers.mjs` | 500 | +5 / −3（净 +2） | `:157` `offloadToolResult` 收 `{ force }`；`:158-173` 渲染二分 + 写盘失败两形态（§2.2 表） |
| `thincoder-core/agent-tools/subagent-async.mjs` | 485 | +3 / −2 | `:388-389` 两条路都落盘 + 缝取值 |
| `thincoder-core/agent-tools/digest-budget.mjs` | 78 | +1 | `:62` `_digestOffloadDirForTest()` 无参读取面 |
| `thincoder-core/agent/completion.mjs` | 159 | +2 / −1 | `:65` 合取 `!poolLive(agent)`；`:11` import 自 `suspension.mjs` |
| `docs/batches/2026-10-24-timeout-and-digest.test.mjs`（新） | 275 | +275 | 批内单元用例 T1–T10（与批档同址，随批删除） |
| `docs/core/design/PROVIDER.md` | 1228 | 0 | §6.3 的 body 阶段超时值来源指本档 §2.1（`agent.bodyIdleTimeoutMs`） |
| `docs/core/design/AGENT-LOOP.md` | 520 | 0 | §9 第 2 条 pending tasks 提醒以 `!poolLive` 为前置判据 |
| `docs/core/design/TIMEOUT-DIGEST.md`（本档） | 195 | — | 本档自身：§1–§9 |

单文件最大 = `thincoder-core/agent/helpers.mjs` 500 行，位于 500 行咨询档上沿，不越档、不拆分。若该档继续增长越档，拆点 = 把 offload / 预览族整块外移为 `thincoder-core/agent/offload.mjs`（原档保留 re-export，消费面零改），仅此一处。

批内用例落 `docs/batches/` 而非 `thincoder-core/test/`：后者是常驻机检档目录（`advisor-project-context` / `doc-check-*` / `manifest-five-keys` / `subagent-design-token-gate` 等），混入一次性档会让「零留存」不可读（`docs/core/design/TESTING.md:92-94` 的口径 = `docs/batches/*.test.mjs`，随批删）。

## 4. 关键决策（含被拒选项）

| # | 决策 | 被拒选项与理由 |
|---|---|---|
| D1 | 配置键名 `agent.bodyIdleTimeoutMs`，默认 `120000` | `agent.fetchTimeoutMs` 扩容为总超时——与既有「头 / 体两段语义」冲突；`provider.bodyIdleMs` 放 provider 级——11 个 provider 逐一写值，用户改不动全局 |
| D2 | 默认值住 DEFAULTS 表 + 单源常量 `DEFAULT_BODY_IDLE_MS` | 只住 `provider/core.mjs` 常量（照抄 `fetchTimeoutMs`）——`settings list` 看不见该键，判据不成立；对照 `AGENT-PARAMS.md:21` 的 advisor 先例（默认只住常量）——本键因可见性判据不沿用 |
| D3 | 非法值回退默认，不抛错、不解释成「禁用」 | 「`0` = 永不超时」——无场景判据（没有出现过的现场），且静默关保护；本轮不做开关 |
| D4 | 报告落盘复用 `offloadToolResult` 的 `force` 支 | 新写 `persistReport`——与既有预览文案形成第二实现；在 settle 回调另起落盘点——四族 settle 各一处，注入点才是唯一共享面 |
| D5 | 注入体 = 正文一份（≤64K）/ 双端预览（>64K）/ 清单行（超轮预算）+ 路径；短文绝不双端预览 | 短文双端预览——`buildDualEndPreview` 对 ≤16K 正文头尾各返整串（`helpers.mjs:57`、`:72-76`）⇒ 正文两份 + `middle omitted: 0 chars`；保留「超预算才落盘」——正是报告丢失的成因；全文 `inline`——64K+ 请求体的原事故面 |
| D6 | 完成门加 `!poolLive(agent)`，判据取自 `suspension.mjs` | 在 `task.mjs` 侧改归零条件——`task` 更新与池状态无关，判据错位；新建池空判定——第二口径 |

## 5. 验收（逐条指回 §2 的批次条目）

| # | 批次条目 | 判据（机判） |
|---|---|---|
| A1 | ① body 空闲超时可配 | `node -e` 读 `DEFAULTS.agent.bodyIdleTimeoutMs === 120000`；`effectiveBodyIdleMs({}) === 120000`、`effectiveBodyIdleMs({ bodyIdleTimeoutMs: 5000 }) === 5000`、`effectiveBodyIdleMs({ bodyIdleTimeoutMs: 0 }) === 120000`；`grep` 全仓 `provider/` + `proxy*.mjs` 无 `120_000` 字面量 |
| A2 | ① 设小值生效 | 起本地假 SSE 端点（每 1.5s 一帧、共 3 帧）⇒ `agent.bodyIdleTimeoutMs=800` 时按 `SSE idle timeout: no data for 0.8s` 失败；缺省（120s）时同请求 ≈5s 跑完（单元用例两条 = T3/T4，秒级窗口） |
| A3 | ① `settings list` 可见 | `settings list` 输出含 `agent.bodyIdleTimeoutMs = 120000`；`settings set agent.bodyIdleTimeoutMs 30000` 后 `get` 回 30000，`null` 后回 120000 |
| A4 | ② 报告无条件落盘 | 造一条 200 字符的子代理报告（正文不含 XML 特殊字符，段落计数可精确），走 `injectAsyncResult` ⇒ 沙箱目录出现该文件；注入文本含路径、**正文恰出现一次（切分计数 === 1）**、不含 `middle omitted`、不含 `output too large` |
| A5 | ② 大报告同形 | 70K 报告 ⇒ 落盘文件全量 = 原文；注入体 = 双端预览：`middle omitted` 恰出现一次且省略数 > 0、带路径、不含全文 |
| A6 | ② 落盘失败不吞报告 | 把落盘目录指向不可写路径（指向一个已存在的文件）⇒ 注入文本仍含正文（≤64K 原样）或双端预览（>64K），尾注 `offload to disk failed`，不抛错 |
| A7 | ③ 池在飞时门不触发 | `agent.tasks=[pending]`、`_asyncSubagents` 非空 ⇒ `handleCompletion` 返回非 `continue`（放行）；池空后同状态 ⇒ 返回 `continue` 一次 |
| A8 | ③ 归零不再拖回合 | 池在飞时连调 `task` 更新 N 次 + `handleCompletion` N 次 ⇒ `_taskPushbacks` 恒 0 且零推回 |
| A9 | 不回归 | `node thincoder-core/test/run.mjs` 全绿（单入口——`test/run.mjs:2-4` 单层收集 `test/*.test.mjs`）；本批用例 `node --test docs/batches/2026-10-24-timeout-and-digest.test.mjs` 全绿；既有 digest / 完成门用例零改 |
| A10 | ② 轮预算仍约束本族 | 同一轮第二条报告使 `digestBudgetOver` 为真 ⇒ 注入体为清单行 + 路径（正文不进请求体），落盘文件全量 = 原文 |

## 6. 用例表（单元，随批删除）

| # | 类别 | 输入 | 期望输出 |
|---|---|---|---|
| T1 | 正常 | `effectiveBodyIdleMs({ bodyIdleTimeoutMs: 30000 })` | `30000` |
| T2 | 边界 | 缺省 / `0` / `-1` / `"30000"` / `NaN` | 全部 `120000` |
| T3 | 正常 | 假 SSE 端点每 1.5s 一帧 ×3，`bodyIdleTimeoutMs=800` | 抛 `SSE idle timeout: no data for 0.8s`，`abortInfo.layer="provider"`；用时 ≈1s |
| T4 | 边界 | 同端点，缺省配置 | 三帧读完（≈5s），`finishReason` 正常 |
| T5 | 正常 | `injectAsyncResult` + 200 字符报告（无 XML 特殊字符），缝指向沙箱目录 | 文件在盘；注入体含路径；正文切分计数 === 1；无 `middle omitted` / `output too large` |
| T6 | 边界 | 70K 报告，同缝 | 文件全量 = 原文；注入体含 `middle omitted` 一次且 N>0 + 路径 |
| T7 | 错误 | 缝指向一个文件路径（不可写目录） | 注入体含正文 + `offload to disk failed`；不抛 |
| T8 | 边界 | 同一轮第二条报告，累计使 `digestBudgetOver` 为真 | 注入体 = 清单行 + 路径；正文不出现在注入体；文件全量 = 原文 |
| T9 | 正常 | 池在飞 + pending task + `_taskPushbacks=0` | `handleCompletion` 不进 task 推回支 |
| T10 | 边界 | 池空 + pending task + `_taskPushbacks=0` | 进推回支一次，`_taskPushbacks` → 1 |

T5–T8 均经 `_setDigestOffloadDirForTest(沙箱)` 执行、`finally` 复位。

## 7. 边界（本批不做）

- 不引入第三方依赖；不动 `requestWithRetry` 的重试语义（只替换 idle 超时的取值来源）。
- 不提供「禁用空闲超时」开关（`0` 语义未获判据）。
- 不改 `agent.fetchTimeoutMs` 的可见性（它仍不在 `settings list` 里——本批不扩围）。
- 不给 anthropic 直连读侧新增空闲定时器：该路径现状无定时器（`provider/anthropic.mjs:149-206` 无 timer，只有代理分支的 `_bodyIdleMs`），所以本键在「anthropic + 直连」这一格不生效。新增定时器 = 新机制，须单独裁定（§8 上抛项）。
- `bg` / `browser` 两族注入器不改（`subagent-async.mjs:377-379` 已分流；其摘要形态见各自板）。
- 不改 `docs/README.md` 权威地图（本批不写该档）：该档裸名锚在 doc-check 门内不跨目录解析（只认仓根 ∥ 指向档自身目录），写它会把本批的门拖红。**地图登记 = 父侧收口动作**：登记 `TIMEOUT-DIGEST.md` + 计数收正为「`core/design/` 实档 63 = 登记 62 + 待补登 1（`SESSION-OBSERVABILITY.md`）」（实读 2026-10-24），由主 agent 在收口清单里落行。
- 不改 `task.mjs:83` 的归零语义、不改 `digestBudgetOver` 的记账口径与 `persistOverflowReport` 的既有语义。

## 8. UI / 交互决策

- `/config` 菜单不新增编辑项：该键手写 `config.json` 或 `settings set` 即可，与 `advisor.timeoutMs` 同档处置（`docs/core/design/AGENT-PARAMS.md` §2）。
- 无其它交互面待定；无 `open` 项。
- **上抛（待主 agent 裁）**：anthropic 直连读侧是否补空闲定时器（现状 = 无定时器，本键不覆盖该格）。

## 9. 集成测试设计（收口口径）

| 场景 | 业务可观察入口 | 判据 | 指回 |
|---|---|---|---|
| 慢模型长生成不被腰斩 | 同一 provider，`agent.bodyIdleTimeoutMs` 设 5000 与缺省各跑一次长生成 | 小值按新值超时并报出秒数；缺省跑完 | A2 |
| 子代理跑完的报告可回溯 | `subagent` 异步派发一次 >200 字的任务，回合内投递 | 投递文本带路径，路径所指文件内容与报告全文一致 | A4 |
| 池在飞时回合正常收尾 | 一个异步子代理在飞 + 一条 pending task，父回合尝试收尾 | 回合结束不追加 pending-task 提醒 | A7 |

现存集成套件 0 例（实读 `thincoder-core/test/`：5 档 `*.test.mjs`，均为常驻机检类；≈50–100 窗口），本批不动集成面——本表是收口时由父侧执行的口径，缺口由父侧记账。
