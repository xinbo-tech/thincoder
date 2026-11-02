# TIMEOUT-DIGEST.md — 超时旋钮与投递兜底（body 空闲可配 · 首 chunk 与流中途分窗 · 子代理报告无条件落盘 · 完成门认池）

> 板 = core。本档持四个机制的当前真值：① provider 响应体空闲超时可配（GitHub #22）；② 响应体「等首 chunk」与「流中途」分窗；③ 异步子代理报告无条件落盘（Gitee IKKBF8 发现 3）；④ 完成门的 pending-task 推回认后台池（GitHub #29）。
> 基础机制（重试语义 / SSE 读侧看门狗 / digest 注入文法 / 挂起尾巴）仍住各自板：`docs/core/design/PROVIDER.md` §6.3 · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 · `docs/core/design/AGENT-LOOP.md` §9。本档只写被改写的那部分事实，不重述基础语义。

## 1. 方案与理由

**closest-precedent（最近的先例）**：头部超时已是可配项——`effectiveFetchTimeoutMs`（`thincoder-core/provider/core.mjs:73-75`）读 `provider.fetchTimeoutMs`，由 `thincoder-core/config.mjs:350-352` 从 `agent.fetchTimeoutMs` 提升而来。

- **对齐**：body 空闲超时照同一形——配置键在 `DEFAULTS.agent`，装载期提升为 `provider.*`，再经同名式 helper 解析。同一条链上的两个超时从此同构。
- **偏离**：默认值的家 = `config-defaults.mjs` 的 DEFAULTS 表，不是只住常量。理由：`settings list` 展平的是活配置对象（`thincoder-core/agent-tools/settings.mjs:269-272`），未登记进 DEFAULTS 的键在 `list` 里看不见，判据「`settings list` 能看到该键」就无法满足；`fetchTimeoutMs` 正因此至今不可见（本轮不改它，见 §7）。
- **反向先例（对照着偏离）**：`docs/core/design/AGENT-PARAMS.md:21` 记 `advisor.timeoutMs` 的默认值只住 `REVIEW_TIMEOUT_MS` 常量、不写进 `DEFAULTS.agent.advisor`——本键因「`settings list` 可见」判据必须登记 DEFAULTS，故不沿用该处置；`/config` 不新增编辑项一节仍与该档同档（§8）。

**survey-evidence（查了哪些公开源 / 有无相关内容）**：`index.publicRepos = []`（`PROJECT-MANIFEST.json`），本仓无公开源仓可查。

查了本仓四处状态档：`docs/core/design/PROVIDER.md` §6.3 记「body 阶段用读侧空闲超时」；`docs/core/design/AGENT-LOOP.md:321` 记「pending tasks 提醒最多推回一次，task 更新即重置」；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 记 digest 注入单点 = `injectAsyncResult`；`docs/core/design/AGENT-PARAMS.md:21` 记 `advisor.timeoutMs` 默认只住常量的反向先例。

四处都只记现状，与本批目标不冲突；其中两处事实被本批改写，已就地更新并指回本档。

**closest-precedent（首 chunk 分窗的最近先例）**：响应头阶段超时已按「等上游」语义取 `effectiveFetchTimeoutMs`（`thincoder-core/provider/core.mjs:73-75`），`thincoder-core/provider/core.mjs:428` 把它作为 `_headerTimeoutMs` 传入；`thincoder-core/proxy-transport.mjs:234` 已有「头阶段 ∥ body 阶段」两段计时。

- **对齐**：首 chunk 窗复用同一个 `effectiveFetchTimeoutMs` 值——两处都在等上游开口，一个值一个语义，零新配置键。
- **偏离**：不把 body 的 `idleMs` 调大（那正是要修的病：它把两种失败模式绑在一个旋钮上）；也不立 `agent.firstChunkTimeoutMs` 新键——现无「首 chunk 窗要与头阶段窗不同」的现场，多一个键多一个用户要学的旋钮。

**survey-evidence（查了哪些公开源 / 有无相关内容）**：`index.publicRepos = []`（`PROJECT-MANIFEST.json`），本仓无公开源仓可查。

查了本仓状态档三处：`docs/core/design/PROVIDER.md:112`（body 阶段用读侧空闲 `agent.bodyIdleTimeoutMs`）、`docs/core/design/PROXY.md:36`（传输层 `_bodyIdleMs` 看门狗）、本档 §2.1（消费点表）。

三处都只记现状，与目标不冲突；其中 PROVIDER 与本档 §2.1 就地更新为分窗形，PROXY 面本批不改（传输面不在本批，见 §4 D8）。

**分支依据（每个新增分支带证据）**：

| 分支 | 依据 |
|---|---|
| 超时值 `≤0` / 非有限数 ⇒ 回退默认 | 同 `effectiveFetchTimeoutMs` 的既有判式（`provider/core.mjs:73`）；手写 config.json 的非法值不得静默禁用保护（`docs/core/design/AGENT-PARAMS.md` §2 同款裁定） |
| 落盘改用 `offloadToolResult` 的 `force` 支，而不是新写一个落盘函数 | `offloadToolResult` 已是「预览 + 路径」文案单源（`thincoder-core/agent/offload.mjs`）；同文案两处实现 = 漂移 |
| `force` 支按正文长度二分渲染：≤64K 原样一份 + 路径；>64K 双端预览 + 路径 | `buildDualEndPreview` 对 `text.length ≤ 16K` 的正文头尾各返整串（`thincoder-core/agent/offload.mjs`）——原样复用会注入「正文两份 + `middle omitted: 0 chars`」，A4 的 200 字符用例正是此形（评审 #1） |
| 判超记账保留、布尔改作渲染档位（超轮预算 ⇒ 只给清单行 + 路径），落盘不再看它 | `digestBudgetOver` 的 `used` 是四族共享的轮累计（`thincoder-core/agent-tools/digest-budget.mjs:51-56`）；删调用会让 consult 族的累计口径跟着变；渲染保留它，单轮 inline 正文仍受 64K 预算约束（评审 #7） |
| 完成门加 `!poolLive(agent)` | 挂起尾巴已用同判据（`thincoder-core/agent/suspension.mjs:296`）；二次立口径 = 池空判定两处漂移 |
| 首 chunk 窗 = `effectiveFetchTimeoutMs`（默认 600s），不新立配置键 | 用户现场（2026-10-28 00:25 逐字）：「我们的本地 spark 集群在长上下文时首 token 一定会超过这个时间」（指 `SSE idle timeout: no data for 120s`）；头阶段超时早已用同一值等上游（`thincoder-core/provider/core.mjs:428`），语义同为「等上游开口」 |
| 首 chunk 相位的文案与相位串单列（`sse-first-chunk` ∥ `google-sse-first-chunk`），既有 `sse-idle` / `google-sse-idle` 零改 | 用户报障时拿到的 `SSE idle timeout: no data for 120s` 分不清「流断了」与「还没开始」——这正是本次报障的表述缺口；相位串进 `abortInfo.detail`（词汇表归属面 = `docs/core/design/PROVIDER.md:117` 指向的 AGENT-LOOP 板），既有串不动 ⇒ 下游分类零改 |

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

`effectiveBodyIdleMs(provider)` 住 `thincoder-core/provider/core.mjs:80-83`，与 `effectiveFetchTimeoutMs`（`:73-75`）相邻：

```js
export function effectiveBodyIdleMs(provider) {
  return Number.isFinite(provider?.bodyIdleTimeoutMs) && provider.bodyIdleTimeoutMs > 0
    ? provider.bodyIdleTimeoutMs : DEFAULT_BODY_IDLE_MS
}
```

**八处消费点同读它（唯一解析点，无第二处取值）**：

| 消费点 | 当前形 |
|---|---|
| `provider/core.mjs:265` / `:285` `readSSE` 调用 | `idleMs: effectiveBodyIdleMs(provider)`（主路径 / 重试路径各一处） |
| `provider/core.mjs:429` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/sse.mjs:93` 读侧定时器入参 | `idleMs = DEFAULT_BODY_IDLE_MS`（缺省即单源常量；超时文案用实际值） |
| `provider/google.mjs:139` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/google.mjs:144` / `:178` Gemini 流解析器 | `:144` 传 `idleMs: effectiveBodyIdleMs(provider)`；`:178` 形参缺省 `idleMs = DEFAULT_BODY_IDLE_MS` |
| `provider/anthropic.mjs:229` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)` |
| `provider/responses.mjs:252` / `:271` / `:289` 代理传输分支 | `_bodyIdleMs: effectiveBodyIdleMs(provider)`（三条分支同值） |
| `proxy.mjs:52` · `proxy-transport.mjs:234` 缺省值 | `opts?._bodyIdleMs ?? DEFAULT_BODY_IDLE_MS`（未传 `_bodyIdleMs` 时的传输层缺省，与 provider 缺省同值同源）；`proxy-transport.mjs:43` 形参缺省同源 |

数据流：配置盘 → `loadConfig` 合并 + 提升 → `agent.config.provider.bodyIdleTimeoutMs` → `chat(provider)` 各 transport → 两条读侧路径（直连 fetch 的读者定时器 ∥ 代理的 `_bodyIdleMs`）读同一个值。

### 2.2 报告落盘（`thincoder-core/agent/offload.mjs` `offloadToolResult` + `subagent-async.mjs` 注入点）

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

### 2.4 首 chunk 窗与流中途空闲窗分计

响应体阶段有两个失败模式，正常时长差两个数量级——分两个窗计时：

| 阶段 | 在等什么 | 正常时长 | 窗值 |
|---|---|---|---|
| 首 chunk 之前 | 上游排队 + prefill | 长上下文可达数分钟（本地 spark 现场） | `firstChunkMs` = `effectiveFetchTimeoutMs(provider)`（默认 `600000`，`agent.fetchTimeoutMs` 可配） |
| 首 chunk 之后 | 模型吐字 | 毫秒级 | `idleMs` = `effectiveBodyIdleMs(provider)`（默认 `120000`） |

**两态武装、一次翻转**：定时器首次挂用首 chunk 窗；第一个 body 字节到达后，此后每次重挂都用 `idleMs`，翻转不可逆（流中途不会回到「首 chunk」态）。

| 面 | 接口形 |
|---|---|
| 读侧 OpenAI 形 | `readSSE(response, { … idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs })`（`thincoder-core/provider/sse.mjs:93`）：未传 `firstChunkMs` ⇒ 首挂窗取 `idleMs`（体内 `firstChunkMs ?? idleMs` 兜住）；循环体收到 chunk 即置 `gotFirstChunk`（`:228-229`），`armIdle()`（`:207-224`）按态取窗与文案 |
| 读侧 Gemini 形 | `parseGeminiStream(response, { … idleMs = DEFAULT_BODY_IDLE_MS, firstChunkMs })`（`thincoder-core/provider/google.mjs:178`）：同形（未传 `firstChunkMs` ⇒ 首挂窗取 `idleMs`，体内 `firstChunkMs ?? idleMs` 兜住；`:230-245` 两态臂、`:249-250` 收到 chunk 即翻转） |

- **入参缺省 = 老行为**：`firstChunkMs` 缺省取 `idleMs`，未传者零变化（`thincoder-core/provider/list-models.mjs:33` 只传 `_bodyIdleMs: LIST_TIMEOUT_MS`，不吃读侧定时器）。
- **读取链**：`agent.fetchTimeoutMs` → `loadConfig` 提升 `provider.fetchTimeoutMs`（`thincoder-core/config.mjs:370-372`）→ `effectiveFetchTimeoutMs(provider)`（`thincoder-core/provider/core.mjs:73-75`）→ 两条读侧路径传 `firstChunkMs`。零新配置键。

**本机制新增的传参面（调用点与 §2.1 表同一批）**：

| 消费点 | 形 |
|---|---|
| `thincoder-core/provider/core.mjs:265` / `:285` `readSSE` | `firstChunkMs: effectiveFetchTimeoutMs(provider)`（主路径 / 重试路径） |
| `thincoder-core/provider/google.mjs:144` `parseGeminiStream` | `firstChunkMs: effectiveFetchTimeoutMs(provider)` |

**读侧面无 `≤0` 门，也不需要**：`armIdle()` 现形恒挂定时器（`thincoder-core/provider/sse.mjs:207-224` 没有 `idleMs > 0` 判式），两条读侧路径传入的值都来自 `effectiveFetchTimeoutMs` / `effectiveBodyIdleMs`——两者恒为正（非法值回退默认），没有「窗被静默关掉」的路径。代理传输面的 `bodyIdleMs > 0` 门（`thincoder-core/proxy-transport.mjs:104`）不在本批（§4 D8）。

**超时文案与相位串按相位分**（三面并列：文案 ∥ 相位串）：

| 面 | 首 chunk 相位（新） | 流中途相位（不变） |
|---|---|---|
| 读侧 OpenAI 形（`thincoder-core/provider/sse.mjs:218-220`） | `SSE first-chunk timeout: no data for Ns` ∥ `sse-first-chunk` | `SSE idle timeout: no data for Ns` ∥ `sse-idle` |
| 读侧 Gemini 形（`thincoder-core/provider/google.mjs:239-241`） | `SSE first-chunk timeout: no data for Ns` ∥ `google-sse-first-chunk` | `SSE idle timeout: no data for Ns` ∥ `google-sse-idle` |

`N` = 该相位实际生效的窗值（`firstChunkMs / 1000` ∥ `idleMs / 1000`）——与现形同口径（超时文案用实际值）。

**既有件三问（本机制新引入的名字）**：

| 新名 | 三问答复 |
|---|---|
| 相位串 `sse-first-chunk` ∥ `google-sse-first-chunk` | `existing but unusable:` `sse-idle` / `google-sse-idle`（`thincoder-core/provider/sse.mjs:218-220` ∥ `google.mjs:239-241`）· failed on: 分不出「流断了」与「还没开始」——正是本次报障的表述缺口 |
| 文案 `SSE first-chunk timeout: no data for Ns` | `existing but unusable:` `SSE idle timeout: no data for Ns`（同上两处）· failed on: 同上——用户拿到的文案看不出卡在哪一相位 |
| 入参 `firstChunkMs`（`readSSE` ∥ `parseGeminiStream`） | `none found:` 查了 `thincoder-core/**/*.mjs`（grep `firstChunkMs|first-chunk` 零命中）——无同名 ∥ 同义入参可复用 |

单词表归属：`abortInfo.detail` 的词汇表归 AGENT-LOOP 板（`docs/core/design/PROVIDER.md:117`）；该板无闭集枚举清单（grep `AGENT-LOOP.md` 的 `abortInfo` 只命中 D-AL13「一模块一词汇表」与载荷双改纪律行），故新增 `detail` 字面值不需另立登记行；既有三串零改。

**代价认账**：首 chunk 窗默认取 600s ⇒「响应头已回、此后永不出字节」的发现时间由 120s 变为 600s。与「调大 `agent.bodyIdleTimeoutMs`」那条被拒选项的代价同源（§4 D7），本设计认这笔账：换来的是长上下文 prefill 不再被腰斩。缩短的旋钮只有一个且已在：`agent.fetchTimeoutMs`。

offload / 预览族住 `thincoder-core/agent/offload.mjs`：导出面三件 = `offloadToolResult` ∥ `cleanupOldToolResults` ∥ `TMP_RETENTION_MS`；档内私有件 = 落盘门限四常量 + `buildDualEndPreview` + 两把 UTF-16 安全切片。

`thincoder-core/agent/helpers.mjs` 以具名 re-export 转口同名三件——所有既有 `import … from "…/helpers.mjs"` 逐字零改。

批内用例落 `docs/batches/` 而非 `thincoder-core/test/`：后者是常驻机检档目录（`advisor-project-context` / `doc-check-*` / `manifest-five-keys` / `subagent-design-token-gate` 等），混入一次性档会让「零留存」不可读（`docs/core/design/TESTING.md:92-94` 的口径 = `docs/batches/*.test.mjs`，随批删）。

## 4. 关键决策（含被拒选项）

| # | 决策 | 被拒选项与理由 |
|---|---|---|
| D1 | 配置键名 `agent.bodyIdleTimeoutMs`，默认 `120000` | `agent.fetchTimeoutMs` 扩容为总超时——与既有「头 / 体两段语义」冲突；`provider.bodyIdleMs` 放 provider 级——11 个 provider 逐一写值，用户改不动全局 |
| D2 | 默认值住 DEFAULTS 表 + 单源常量 `DEFAULT_BODY_IDLE_MS` | 只住 `provider/core.mjs` 常量（照抄 `fetchTimeoutMs`）——`settings list` 看不见该键，判据不成立；对照 `AGENT-PARAMS.md:21` 的 advisor 先例（默认只住常量）——本键因可见性判据不沿用 |
| D3 | 非法值回退默认，不抛错、不解释成「禁用」 | 「`0` = 永不超时」——无场景判据（没有出现过的现场），且静默关保护；本轮不做开关 |
| D4 | 报告落盘复用 `offloadToolResult` 的 `force` 支 | 新写 `persistReport`——与既有预览文案形成第二实现；在 settle 回调另起落盘点——四族 settle 各一处，注入点才是唯一共享面 |
| D5 | 注入体 = 正文一份（≤64K）/ 双端预览（>64K）/ 清单行（超轮预算）+ 路径；短文绝不双端预览 | 短文双端预览——`buildDualEndPreview` 对 ≤16K 正文头尾各返整串（`thincoder-core/agent/offload.mjs` 的 `safeSliceUTF16End` ∥ `buildDualEndPreview`）⇒ 正文两份 + `middle omitted: 0 chars`；保留「超预算才落盘」——正是报告丢失的成因；全文 `inline`——64K+ 请求体的原事故面 |
| D6 | 完成门加 `!poolLive(agent)`，判据取自 `suspension.mjs` | 在 `task.mjs` 侧改归零条件——`task` 更新与池状态无关，判据错位；新建池空判定——第二口径 |
| D7 | 首 chunk 窗复用 `effectiveFetchTimeoutMs`，不新立配置键 | 新立 `agent.firstChunkTimeoutMs`——现无「首 chunk 窗要 ≠ 头阶段窗」的现场，多一个键多一个用户要学的旋钮；调大 `bodyIdleTimeoutMs`——把两种失败模式绑在一个旋钮上，流中途停摆的发现时间同比变长 |
| D8 | 只修读侧面（`readSSE` ∥ `parseGeminiStream`），传输层看门狗另批 | 同批修传输面（`thincoder-core/proxy-transport.mjs`）——唯一的逐字现场（spark 报障）未提代理，无日志、无复现命令、无代理配置下的读数；分支要有现场才走，无现场的防御是没人走的路径 |
| D9 | 相位串按相位分，既有串零改 | 沿用 `sse-idle`——报障时无法区分「流断了」与「还没开始」（正是本次报障的表述缺口）；新串进 `abortInfo.detail`，不改既有分类判据 |
| D10 | `firstChunkMs` 缺省取 `idleMs` | 缺省取 `600000` 常量——未传的调用者（`list-models`）行为会静默变化 |

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
| A9 | 不回归 | `node thincoder-core/test/run.mjs` 全绿（单入口——`test/run.mjs:2-4` 单层收集 `test/*.test.mjs`）；既有 digest / 完成门用例零改 |
| A10 | ③ 轮预算仍约束本族 | 同一轮第二条报告使 `digestBudgetOver` 为真 ⇒ 注入体为清单行 + 路径（正文不进请求体），落盘文件全量 = 原文 |
| A11 | 条目 E1（首 chunk 与流中途分窗） | 假 SSE 端点（响应头立刻回、首帧延迟 1.5s），`agent.bodyIdleTimeoutMs=800`、`agent.fetchTimeoutMs` 缺省 ⇒ 请求跑完拿到正文；同一夹具首帧 100ms 后停摆 1.5s ⇒ 按 `SSE idle timeout: no data for 0.8s` 判死（首 chunk 之后仍按 `idleMs`） |
| A12 | 条目 E1 · E3（首 chunk 窗可配 + 相位串） | `agent.fetchTimeoutMs=2000` ⇒ `effectiveFetchTimeoutMs` 回 2000；同一夹具首帧永不发 ⇒ 按 `SSE first-chunk timeout: no data for 2s` 判死，相位串 `sse-first-chunk`，用时 ≈2s |
| A13 | 条目 E1（入参缺省零变） | `readSSE` / `parseGeminiStream` 不传该入参时首挂窗 = `idleMs`（单测断言）；`list-models` 径实测仍在 `LIST_TIMEOUT_MS` 判死 |
| A14 | 条目 E3（google 面文案与相位串） | `parseGeminiStream` 夹具：首帧永不发、`idleMs=800`、`firstChunkMs=1200` ⇒ 抛 `SSE first-chunk timeout: no data for 1.2s`，`abortInfo.detail = "google-sse-first-chunk"`；首帧后停摆 ⇒ `SSE idle timeout: no data for 0.8s` / `google-sse-idle`（既有串零改） |
| A15 | 条目 E1（默认窗的代价认账） | `effectiveFetchTimeoutMs({}) === 600000`（常量级）；两条读侧路径的首挂窗 = 传入值（以 1.2s 夹具等价验证，不实跑 600s） |
| A16 | 条目 E4（即时缓解回收后判据） | 回收后（`agent.bodyIdleTimeoutMs` 回缺省）：首帧 1.5s 的夹具请求仍跑完拿到正文（首 chunk 窗未误杀）；`idleMs=800` 下首帧后停摆 1s ⇒ 按 `SSE idle timeout: no data for 0.8s` 判死 |

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
| T11 | 正常 | 假 SSE 端点：头立刻、首帧 1.5s；`idleMs=800`、`firstChunkMs=5000` | 跑完，`content` 非空，零超时抛错 |
| T12 | 边界 | 同端点：首帧永不发；`idleMs=800`、`firstChunkMs=1200` | 抛 `SSE first-chunk timeout: no data for 1.2s`，相位串 `sse-first-chunk` |
| T13 | 边界 | 首帧 100ms 后停摆；`idleMs=800`、`firstChunkMs=5000` | 抛 `SSE idle timeout: no data for 0.8s`，相位串 `sse-idle`（首 chunk 之后按 `idleMs`） |
| T14 | 边界 | `readSSE` / `parseGeminiStream` 不传 `firstChunkMs` | 首挂窗 = `idleMs`，文案与相位串与分窗前的现形逐字一致 |
| T15 | 错误 | `parseGeminiStream` 夹具：首帧永不发；`idleMs=800`、`firstChunkMs=1200` | 抛 `SSE first-chunk timeout: no data for 1.2s`，`abortInfo.detail = "google-sse-first-chunk"` |
| T16 | 边界 | 默认窗来源：`effectiveFetchTimeoutMs({})`；以及 `readSSE` 首挂窗等于传入的 `firstChunkMs`（1.2s 夹具，不实跑 600s） | `600000`；首挂窗 = 传入值（不等 `idleMs`） |

T5–T8 均经 `_setDigestOffloadDirForTest(沙箱)` 执行、`finally` 复位。

## 7. 边界（本批不做）

- 不引入第三方依赖；不动 `requestWithRetry` 的重试语义（只替换 idle 超时的取值来源）。
- 不提供「禁用空闲超时」开关（`0` 语义未获判据）。
- 不改 `agent.fetchTimeoutMs` 的可见性：它仍不在 `settings list` 里；首 chunk 分窗只是让它多一个消费面，不扩其配置面。
- `bg` / `browser` 两族注入器不改（`subagent-async.mjs:377-379` 已分流；其摘要形态见各自板）。
- 不改 `docs/README.md` 权威地图（本批不写该档）：该档裸名锚在 doc-check 门内不跨目录解析（只认仓根 ∥ 指向档自身目录），写它会把本批的门拖红。**地图登记 = 父侧收口动作**：登记 `TIMEOUT-DIGEST.md` + 计数收正为「`core/design/` 实档 63 = 登记 62 + 待补登 1（`SESSION-OBSERVABILITY.md`）」（实读 2026-10-24），由主 agent 在收口清单里落行。
- **不改 `agent.bodyIdleTimeoutMs` 的默认值与 `≤0` 语义**：「能否禁用空闲超时」是另一个问题、无现场判据，本批不夹带（`thincoder-core/config-defaults.mjs:16` 的注释口径不动）。
- **传输层看门狗未处置**：`thincoder-core/proxy-transport.mjs` 的首 chunk 窗不在本批（无现场、无复现路径——§4 D8 ∥ §8 上抛①）；代理径在首个 body 字节之前仍只有 `bodyIdleMs` 一个窗在计时。相应不新建 `_firstChunkMs` 传参面（`thincoder-core/proxy.mjs` / `proxy-transport.mjs` / `anthropic.mjs` / `responses.mjs` 均不动）。
- **不给 anthropic 直连读侧新增空闲定时器，也不向它传首 chunk 窗**：该径现状无读侧 timer（`thincoder-core/provider/anthropic.mjs:229` 只有代理传输分支的 `_bodyIdleMs`），代理径首 chunk 窗随传输面另批——既有边界不变。
- **不做首 chunk 阶段的用户提示**（「正在等待模型输出」类文案）：那是 UI 面，本批只改计时口径。
- 不改 `task.mjs:83` 的归零语义、不改 `digestBudgetOver` 的记账口径与 `persistOverflowReport` 的既有语义。

## 8. UI / 交互决策

- `/config` 菜单不新增编辑项：该键手写 `config.json` 或 `settings set` 即可，与 `advisor.timeoutMs` 同档处置（`docs/core/design/AGENT-PARAMS.md` §2）。
- 首 chunk 分窗不新增任何交互面：无新配置键、无新菜单项、无新提示文案（§7）。
- 无 `open` 项。
- **上抛（待主 agent 裁）①：代理径（传输层看门狗）的首 chunk 窗**——事实面：`thincoder-core/proxy-transport.mjs:104` 现形是 `if (bodyIdleMs > 0)` 单窗、`:126` 头到齐即首次挂；按对称推理，代理用户同样会在首字节前被 120s 误杀，但唯一的逐字现场（spark 报障）未提代理，无日志、无复现命令、无代理配置下的读数（§4 D8 ∥ §7 传输层看门狗未处置）。另批需要：现场或可复现路径（代理配置 + 首字节延迟夹具的读数）。
- **上抛（待主 agent 裁）②**：复用 `agent.fetchTimeoutMs` 作首 chunk 窗后，用户把它调到 < 120s 会让「等首 chunk」比「流中途」更早判死。本设计判为「用户明确要求更短的等上游窗口」，不加钳制；若要求首 chunk 窗恒 ≥ `bodyIdleTimeoutMs`，那是另一条判据，请裁。
- **上抛（待主 agent 裁）③**：anthropic 直连读侧是否补空闲定时器（现状 = 无定时器，本键不覆盖该格）。

## 9. 集成测试设计（delta 口径）

**既有行被本批动到的**：无。`test/RTM.md` 故事 19 的两行（19-1 / 19-2）的「怎么算通过」不因本批改变——首 chunk 窗从 120s 变 600s 只让 19-1 更容易过，断言口径（拿到正文 ∥ 零 `SSE … timeout`）不变；19-2 断言的相位串 `sse-idle` 也仍是流中途那条。

**冗余**：无。故事 19 只置这两行，无重复场景。

**缺的**：无新增行。理由：传输面移出后（§4 D8），本批的改动全落在同一个用户入口（CLI 发一条消息）的读侧计时；首 chunk 慢与流中途停摆这两种业务结果已由 19-1 ∥ 19-2 两行覆盖，再多一行也不评估新的组件交互。相位串 / 秒数这类实现细节留在单元层（T12 / T15），集成行只断言用户可观察结果。

| 场景 | 业务可观察入口 | 判据 | 指回 |
|---|---|---|---|
| 慢模型长生成不被腰斩 | 同一 provider，`agent.bodyIdleTimeoutMs` 设 5000 与缺省各跑一次长生成 | 小值按新值超时并报出秒数；缺省跑完 | A2 |
| 子代理跑完的报告可回溯 | `subagent` 异步派发一次 >200 字的任务，回合内投递 | 投递文本带路径，路径所指文件内容与报告全文一致 | A4 |
| 池在飞时回合正常收尾 | 一个异步子代理在飞 + 一条 pending task，父回合尝试收尾 | 回合结束不追加 pending-task 提醒 | A7 |
| 首 token 慢的长上下文请求能拿到答复 | CLI 里对一个慢 prefill 的 provider 桩（首帧延迟 > `agent.bodyIdleTimeoutMs`）发一条长上下文消息 | 用户拿到正文答复，无任何 `SSE … timeout` 报错 | A11 · RTM 19-1 |
| 流中途真停摆仍被及时发现 | 同一 provider 桩吐出首帧后停摆，`agent.bodyIdleTimeoutMs=800` | 报错文案含 `no data for 0.8s`，相位串 `sse-idle`（不是首 chunk 相位） | A11 · RTM 19-2 |
| 即时缓解回收后行为回到默认 | 回收（删键 ∥ 恢复备份）后同一桩首帧 1.5s、默认配置 | 拿到正文；无需 600s 缓解值 | A16 |

用例文件 = `test/integration/sse-first-chunk-window.test.mjs`（编号 19-1 / 19-2 已在 RTM 定号），收口时由父侧执行。

集成套件的枚数与逐例状态以 `test/RTM.md` 为准（本档不自记枚数——同一事实两处写会漂）。
