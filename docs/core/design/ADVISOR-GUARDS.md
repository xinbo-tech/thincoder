# Advisor 评审链边缘守卫（ADVISOR-GUARDS）· 设计

> 板块：advisor 评审链——**边缘守卫族**：不完整判定族 · 凭证链启动/全程守卫 · 引文解析候选链 · 预算硬墙与提示 · 冻结窗口 · 同步面记账 · 连续未完成护栏 · 预算跟随模型窗口 · 估算加权。
> 收敛协议本体（轮次 / cap / 会话隔离 / prior / citations / guard / 响应表 / 需求契合 / 行数核查）= `design/ADVISOR-CONVERGENCE.md`——本档不重述（D2 单一权威源）。
> 需求层指针 = `requirements/ADVISOR-CONVERGENCE.md`（该板块需求档——迁入基准层属后续批）。
> 判据指针：归属与命名 = `docs/core/design/DOC-SYSTEM.md` §5.1 / §6。

## 1. 不完整判定族（A 族——单谓词）

**判定信号 = 宿主尾族（截断尾 + 机械失败尾）**（宿主生成，唯一确定性来源；模型自报“未完成”属自然语言——**不纳入**，语义判据边界不动）。

**谓词（单源）**：`advisorIncompleteMarker(text) → kind | null`——**块首行**逐字前缀（六 kind）：

| kind | 行前缀（逐字） | 生成点（交付态·实测） |
|---|---|---|
| `context_limit` | `Advisor: context window limit reached (N tokens).` | `thincoder-core/advisor/loop.mjs:124` |
| `turn_cap` | `Advisor: stopped after 100 tool rounds` | `thincoder-core/advisor/loop.mjs:113` |
| `timeout` | `Advisor: review timeout after {S}s.` | `thincoder-core/advisor/loop.mjs`（另两处同判）；尾文案居 `thincoder-core/advisor/compaction.mjs` |
| `empty` | `Advisor: empty response — review was inconclusive` | `thincoder-core/advisor/loop.mjs:187` |
| `interrupted` | `Advisor: interrupted.` | `thincoder-core/advisor/loop.mjs:92`（另 :176 同判） |
| `review_failed` | `Advisor: review failed` | `thincoder-core/advisor/run.mjs:233`（catch 内字符串 resolve——不 throw） |

**匹配规则**：**块首行扫描**（按空行分块，逐块取首行 trim 后测前缀）——时间线渲染以空行连接时间线与尾 ⇒ 六条尾均以块首行形态落地（`review_failed` 为独立返回串 = 文本首行）；
**不得**只测首行（既有失败串锚只认 `^` 前缀，即漏「时间线 + 尾」形态）。
**负向精度**：引文中同串的**非块首形态**（围栏内行 / 表格行 / 引用行）**不得**判 incomplete；块首裸行引用同串的残余误报方向安全（fail-closed——多付一轮重跑，如实登记）。

**三个消费点（同谓词）**：

1. **设计结算**：`incomplete` 非空 ⇒ **一律 `passed:false`**——剥除全部凭证回显 → 追加未签发提示（逐字见下）→ 不写槽、不关实例（可重评）。
2. **代码完成守卫**：结算的失败判决改用同谓词（替代旧前缀锚）——**六 kind 全覆盖 = 旧锚六形态语义零丢**（含 `review_failed` 形态）——截断/失败评审不再置「评审已覆盖」位。
3. **报告提示**：结算输出携带提示 + 恢复指引（父侧据此决定重跑范围）。

**未签发提示（逐字——机器可 grep）**：

```text
评审未完成——token 未签发 (review incomplete — no design token issued; reason: {kind})
以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。
```

**零回归边界**：正常通过路径（无截断尾 + 凭证回显）行为零变；prior 存储规则不变（评审形态输出仍可作 round 2+ 的 prior——提示随文可见）。同步路径的 prior 镜像：未完成时覆写为**清洗后**输出（防未注册凭证进 prior）。

## 2. 凭证链启动 / 全程守卫（B 族）

1. **构建自愈**（评审消息构建）：user 消息构建改为「内层构建 + 尾包」形态——设计评审且已签发凭证、而输出不含凭证信号时，**追加批准信号块**。覆盖所有出口（含代码形态分支降级态与 legacy 收敛分支），不改任何分支的既有语义。
2. **启动断言（fail-closed）**（评审发起之前）：设计评审时校验——① 本次已签发凭证（非空）；② 凭证信号逐字在请求内。违反 ⇒ 返回拒绝报告（**不发请求**）：

```text
Advisor: design review launch refused — {reason: no design token was minted | the request does not carry the approval signal}. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.
```

   可见性与记账：拒绝报告前缀 = 稳定契约（同步工具面据此登记拒发；异步结算面据此不置「评审已覆盖」位）。**可达性如实注**：工具路径恒签发凭证 ⇒ 该拒绝为**直接调用方兜底**（防御纵深），正常链不可达。
3. **压缩定锚**：压缩触发时（首条 user 消息被丢弃的同一动作内）把 `pinned` 简报作为一条 user 消息**重新挂回**。`pinned` 由评审参数（非模型输出）构建，逐字形态：

```text
[review brief — re-attached after context compaction; the original review request is no longer in the context]
{对象声明块（若有）}
## Documents to Review
- {doc} — Read this file in full
{## Approval Signal 块（design + token 时）}
```

   边界：重复压缩允许重复挂回（幂等可读，不做存在性判定）；`pinned` 不含项目指南 / 方法论 / 文档地图（重内容可弃）；压缩触发阈值与 abort 阈值零改。

## 3. 引文解析候选链（C 族）

`verifyCitations(text, cwd, opts)`（`opts.scope` = 评审对象声明路径列表；签名向后兼容——opts 可省 ⇒ 旧行为）。

**候选根派生（纯路径，零扫描）**——对每条声明路径 `s`（cwd 相对或绝对）：

1. `cwd`（保留——绝对路径与工作区根相对路径保持不变）；
2. `segs = relative(cwd, resolve(cwd, s))` 非 `..` 开头时：**声明仓根**（`cwd/segs[0]`）与**声明文件目录 / 声明目录本身**。

**逐引文解析**：按候选顺序试 `resolve(root, file)`；命中判据三条件全中——① realpath 在 cwd 内（**围栏不变**）；② 可读；③ 该行内容包含引文内容。命中记录所用根。

**失败原因三分（报告可判，替代单一 `file unreadable`）**：无任何候选文件存在 ⇒ `file unreadable`；存在但内容不符 ⇒ `content mismatch @ {解析到的相对路径}`；越围栏 ⇒ `path traversal`（不变）。报告头行 `[host-verified] N/M citations match current file state.` 不变。

**取舍**：只按“声明范围 + 内容判据”扩充候选——**零新增假命中**（不会因同名文件而误命中：内容必须逐字包含）；残余如实报告：引用声明范围外、且其仓根不在声明范围时仍判 unreadable。

## 4. 预算硬墙 + 提示 + 结构化收尾（D 族）

1. **硬墙（per-call deadline）**：循环内每次模型调用计算 `remaining = timeoutMs - elapsed`；`remaining ≤ 0` 走既有超时尾；否则调用信号 = 复合中止信号（外层中断信号 + 剩余时间超时信号）。
   **墙判定绑信号状态（非异常名）**：每轮调用返回或抛错后——外层用户信号已中止 ⇒ 原样上抛（中断语义零变）；否则「复合信号已中止且用户信号未中止」⇒ 返回结构化超时尾——**两种运行时形态同判**：① **抛错**（接受中止类与超时类两种异常名——超时信号的 reason 是超时 DOMException）；② **不抛错而返回 partial 结果**——流已有内容时中断以 partial 透传，该形态**不得**按普通结果收尾。
2. **0.75 一次性预算提示**（同一检查点、每场评审至多一次；判定抽成纯函数便于机测）——注入一条 user 消息（逐字）：

```text
⏳ review budget: ~{pct}% consumed ({elapsed}s of {budget}s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as `unverified` (unverified evidence must not support a pass), and emit your verdict line.
```

3. **结构化超时尾**（前缀保持超时尾首句——判定族字面依赖；其后为新增统计与指引）：

```text
Advisor: review timeout after {S}s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.
- rounds: {R} · tool calls: {T} · review text produced: {yes|no}
- budget: {S}s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.
```

   其余五条尾文案**零改**（判定族已覆盖；改动面越小越好）。

## 5. 冻结窗口边界（E 族——D5）

> D5 规则句（“评审在途不改被审文档”）原**未定义「在途」的下界**；父侧按「子进程退出 = 安全」执行 → 踩中。本节补下界定义 + 在途写入拦截。

**归因与实证**：评审实例**点火后、报告送达前**，父侧改被审文档 → 结算判陈旧 → **整轮作废**；pass 轮 = 凭证直接丢失。

**机制复核（陈旧判定的射程与时点——现行实现）**：

1. **起点** = 点火受理：异步启动快照序号——同批中先于点火的写不计、后于点火的写计入；
2. **评估面** = 设计评审声明文档集（即 documents 声明——含批次档）；
3. **判决** = 陈旧判定：序号大于点火序号的父侧变更命中声明文档集 → stale；
4. **判决时点** = 结算记账（评审 promise 收尾时调用）；读取的是**读取时刻**的变更日志；
5. **违规后果（既有行为——保留）** = stale 分支：剥凭证回显 + 「评审目标已变更——token 未签发」前缀、不签凭证、不计评审覆盖；
6. **父侧可观察下界** = **报告送达**（结算 → 挂起移交 → digest 注入 / 回合尾收集）**或取消·中止**。

**边界澄清**：**「子进程退出」不是窗口边界**——结算记账晚于进程收尾执行，且对父侧不可观察；窗口实际射程 = **点火 → 结算读取**。父侧唯一可观察的安全边界 = 报告送达。

**规则面选型**：取「定义落本档 + D5 行与提示词镜像登记待同步」（定义即时可落；同步面不撞在途链）；否决「本批直改机制档双档 + 提示词四镜像」（撞在途文件 + 提示词非本批写域）与「只保留父侧即时纪律、不落档」（下界仍不落机制权威面）。
**机制面选型**：取「**写前拦截** × 点火回执冻结句」（唯一预防级：在途写被拒 → 档不改 → 不 stale；判据与陈旧判定**同源** → 零误杀；与既有拒绝通道同形；逃生门 = cancel → 改 → 重发）。
否决：写后提示（写已落地 = 本轮必 stale；预防为零）· 仅回执冻结句（靠父侧临场兜）· 拦截 + 自动取消/自动重发（发起权在父/用户）。
**批次档是否从快照面豁免**：**不豁免**（事故保护对象恰是批次档——父侧最常写；评审员确实读批次档 §2）。否决档级豁免与节级豁免（变更记账为文件级，节级判定需引入解析/节快照新机制——成本高、易假阳）。

**契约（逐字）**：

（a）**窗口定义（下界定义句——机制权威表述）**：

```text
在途窗口（D5 冻结窗口）= 点火 → 结算：起点 = 异步评审启动受理（启动序号快照）；
终点 = 结算记账（陈旧判定读取父侧变更日志的时点）。父侧可观察下界 = 报告送达（digest 注入 / 回合尾收集）或取消·中止。
「子进程退出」不是窗口边界。窗口内父侧对被审文件集（设计评审 = 声明文档集 + 批次档）零写入；
违规后果保留既有语义（结算 stale → 不签发 token / 不计评审覆盖）。
```

（b）**参与者义务**：

- **父侧**：① 点火后至报告送达 / 取消前，被审文件集（含批次档）零写入；② 有改动需求 → 先 cancel → 改动落地 → 重发评审；③ 收到陈旧结果按既有提示重跑，不按已评审处置。
- **宿主**：点火回执携带冻结句（设计评审）；结算前拦截父侧对被审文件集的写；陈旧结果照既有通道可见。
- **评审员**：零新增义务——§3 写入通道不受影响（评审员侧写不落父侧变更日志；段写入工具不在文件写工具表内）。

（c）**拦截与回执文案（逐字——实现 grep / 用例断言锚）**：

拒绝（写入预闸 → 工具结果；reason = 冻结窗口标记；路径为 cwd 相对）：

```text
Error: write refused — design review #{id} is in flight over {path} (D5 freeze window).
A write now would settle it stale — no token for a pass (the round is lost).
Wait for the report, or cancel the review first (subagent action:'cancel' id:'{id}') and re-launch after the change.
```

点火回执（设计评审 ack 追加；代码评审 ack 零改）：

```text
；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)
```

（d）**实现要点（语义锚——防漂移）**：

- 拦截判据与陈旧判定**同源**（同一声明文档集 + 同一路径归一）；**仅扫 running 且未取消的设计条目标**（已结算 / 已取消条目不拦）。
- 工具面 = 文件写工具集（与变更记账同集——不记入日志的写面既不判陈旧也不拦）；目标路径经工具触碰路径提取（取不到路径不拦——同记账语义）。
- 落位 = 写入预闸（工程门后、只读/权限阶段之前）；拒绝渲染 = 既有 denied 通道。
- 保守残余（如实注）：回合中止后池清前的窗口可能拒一笔不致陈旧的写（保守方向）。

**参与者边界（写面一致性——如实注）**：拦集 = 预闸可见的父侧自身写面；判陈旧集另含预闸不可达的**子代理合入**写入——「致陈旧却没拦」只可出自不可达面；bash / 文件操作类盲区不记账不判陈旧。

## 6. 同步面记账（F16——消费同谓词）

**问题（批次前缺陷态）**：同步记账无「未完成尾」判定——以宿主截断尾收尾的同步代码评审仍置「评审已覆盖」位（计“已覆盖” → guard 不重推）。同族不一致：异步结算面已消费单谓词；同步面遗漏。

**判定点** = 工具结果记账的同步分支（拒发 / 异步 ack 两分支先行排除——零改）；**谓词** = `advisorIncompleteMarker`（单源，与 §1 三个消费点同串）。

**置位规则（与异步结算面逐条 parity）**：

| 场景 | 「评审已覆盖」位 | 依据 |
|---|---|---|
| 干净结果（无截断尾） | **置真** | 零回归（既有语义） |
| 未完成尾 ∧ 代码评审 | **不置** | 本体——guard 可重推（防静默跳过） |
| 未完成尾 ∧ 设计评审 | **置真** | parity：设计评审无代码面 |
| 未完成尾 ∧ 类型不可判（无标记 / run 缺失的 legacy 直调） | **不置** | fail-closed：截断尾不得计「已覆盖」 |
| 拒绝报告 / 异步 ack | 两分支先行排除（零改） | 既有语义 |

**零改边界**：轮次进位（含 legacy 分支）/ prior 规则 / 同步调用登记删除 / 拒发 / 异步 ack 语义——全数不动（未完成尝试耗预算，反复截断受 cap 与推回上限约束）。

## 7. 评审失败护栏：同一文档集连续未完成即停

**问题**：同一文档集反复出现「未完成结算」（判死 / 陈旧 / 空回复 / 未产出可用凭证）时无人停手——反复重跑烧预算。

**契约一：结算分类（纯函数单源）**：输入 = 一次设计结算的宿主可见事实；输出 = `{ reset, count }`（`reset=true` = 计数复位；`count` = 需加一的类名；两者皆空 = **neutral**——不动计数）。

**优先级（自上而下，首个命中）**：

| # | 输入（结实事实现场） | 输出 | 语义依据 |
|---|---|---|---|
| 1 | 启动被拒（报告以拒绝前缀开头——未发起请求） | neutral | 无尝试发生 |
| 2 | 陈旧结算 | `count: "stale"` | 计数类 |
| 3 | 无报告（正常链不可达） | `count: "no_report"` | fail-closed：无报告不得计为可用 |
| 4 | 未完成尾且非 `interrupted` | `count: "{kind}"`（五 kind） | 宿主截断尾（单谓词） |
| 5 | 未完成尾 = `interrupted` | neutral | 用户 / 系统中断类——被丢弃的尝试 |
| 6 | pass 但槽落盘失败 | `count: "no_credential"` | 未产出可用凭证 |
| 7 | 其余（pass 且落盘成功 / changes-required） | `reset` | 可用判决——连续链断点 |

- **确定性**：全部输入为宿主状态——**零 LLM 输出解析**。
- **neutral 与 reset 的分工**：neutral = 无信息事件（取消 / 中断 / 拒发）——**不打断连续计数**（防「取消夹在两次失败之间即洗白」）。

**契约二：计数、停止与结论**

- `reset` ⇒ 删除该键记录；`count` ⇒ 记录 `{count: prev+1, log: […, kind].slice(-上限)}`；neutral ⇒ 不动。
- 键 = 声明文档集的归一键（单源）；**空清单键不适用**：不计数也不停止。
- 载体 = 会话内 Map（懒初始化；模式切换不清护栏）。
- **常量**：`MAX_DESIGN_REVIEW_STREAK = 3`（评审轮次上限常量零改动）。
- **停止判定**：计数 ≥ 3；空清单键恒 false。**不可自解除**：被拒后记录保留（复位仅经「可用判决」）；会话结束随载体清零。
- **结论串**（逐字；表行 = 记录逐条）：

```text
Advisor: design review stopped — 3 consecutive attempts on this document set produced no design token (repeated failed settlements; no further reviews will start for this set in this session).
Document set (1 design instance — no token issued):
- <doc1>
- <doc2>
Attempts (most recent last):
| # | outcome | meaning |
|---|---|---|
| 1 | timeout | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| 2 | stale | the reviewed documents changed while the review was in flight |
| 3 | empty | the provider returned an empty response |
Options:
1. Accept the current state and proceed — implementation for this document set stays gated (no design token).
2. Narrow or change the scope: a different document set starts a fresh budget — fix the cause first (agent.advisor.timeoutMs / advisor model / provider).
3. Start a new session (/new) to reset the guard.
```

- **kind → meaning 映射（逐字——上表第三列）**：

| kind | meaning |
|---|---|
| `timeout` | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| `context_limit` | review exceeded the model context budget |
| `turn_cap` | review exceeded the tool-round limit |
| `empty` | the provider returned an empty response |
| `review_failed` | provider / transport error |
| `stale` | the reviewed documents changed while the review was in flight |
| `no_credential` | the token could not be written to the session ledger |
| `no_report` | the review settled without a report |
- **稳定前缀**：`Advisor: design review stopped`（导出常量——实现 grep / 用例断言锚）。**凭证卫生**：串内零凭证值。
- **检查点（两点式，与 cap 同形）**：① 工具层预检（与 cap 预检邻位）② 评审执行体内防线。

## 8. 预算跟随模型窗口（120K 硬编码退场）

**契约（预算派生——纯函数语义）**：上下文预算常量族内：旧的固定上限**退场**，新增常量与纯函数（模型规格与 provider 级上下文覆盖同源）：

```js
// 上下文预算：预算跟随评审模型窗口（模型规格表 × provider 级 context 覆盖）。
// 头寸用途 = chars/4 估算误差 + 响应/协议开销（内存不构成约束）；判死线仍是宿主机自限线，服务端窗口约束不变。
export const CONTEXT_LIMIT_RATIO = 0.8   // 判死线 = 窗口 × 0.8
const COMPACT_TRIGGER_RATIO = 0.8        // 压缩触发 = 判死线 × 0.8（既有关系零改）

export function advisorContextBudget(provider) {
  const limit = Math.floor(providerSpec(provider).context * CONTEXT_LIMIT_RATIO)
  return { limit, compactAt: Math.floor(limit * COMPACT_TRIGGER_RATIO) }
}
```

| 输入（provider） | 窗口 | 判死线 `limit` | 压缩触发 `compactAt` |
|---|---|---|---|
| 大窗口模型（1M） | 1_000_000 | **800_000** | **640_000** |
| 常规模型（128K） | 128_000 | **102_400** | **81_920** |
| 未知模型名（回退默认规格 128K） | 128_000 | **102_400** | **81_920** |
| provider 级 K 覆盖（64K） | 65_536 | **52_428** | **41_942** |
| `null` / 缺 model（总函数） | 128_000 | **102_400** | **81_920** |

- **回退链**：未知模型 → 一次性告警 + 默认规格；`provider` 为 `null` 时退化默认——派生不抛错。
- **量纲**：窗口为 tokens；provider 级 context 的 K 单位换算只发生在规格解析内（零重复转换）。
- **两档语义**：`compactAt` = 触发本地裁剪；`limit` = 压缩后仍超即判死（`context_limit`）。两者关系（×0.8）与现状**逐字同源**——只换「上限从哪来」，不换「如何比较」；守卫分支结构零改。
- **循环侧消费（两处）**：循环体外一次性取预算（provider 全场不变）；两处比较点改读 `compactAt` / `limit`，其余逐字不动。

**OOM 论证（正面回应原注释「Reserve headroom to avoid OOM」）**：

1. **内存量级不构成约束**：预算 1M tokens ↔ 估算口径约 4M 字符 ↔ JS 字符串约 8MB；单次请求 JSON 序列化为同量级瞬时副本 ⇒ 峰值远低于 Node 默认堆量级两个数量级。
2. **真正的内存边界已由他处承担**：单结果截断常量（字符级）；压缩后消息集 = system + 压缩注记 + 定锚简报 + 最近若干条——**与窗口无关的有界集**。
3. **大窗的真实代价是延迟与 token 额度**，不是 OOM：由墙钟预算与用户的模型选择承担——20% 头寸**不**为内存而留。
4. **头寸的真实用途**：① 扁平估算（chars/4）对 CJK 内容低估 3–4×；② 响应与协议开销；③ 压缩触发与判死线之间的安全带。

## 9. 估算加权（CJK）

**问题**：token 估算为扁平式（字符数 / 4），对 CJK 低估 3–4×——预算判死线与压缩触发因此偏松。消费点 = 两个守卫 + 判死尾计数 + 显示统计。

**选型**：取「**复用主循环的加权估算函数**」（叶子模块，仅依赖中止溯源档）——单源加权公式（与主循环同口径）；纯 ASCII 逐值相等；零新配置面。
否决：本档内联加权式（公式双源，漂移风险）· 全对齐上下文 walker（面大于需求）。

**契约**：

1. 估算函数的**内容项**改用加权估算——walker（content / tool_calls 两源）零改、计数口径零改；
2. **纯 ASCII 输入与旧式逐值相等**；CJK 字 = 1（旧式 1/4）；
3. 消费点零改（只随新估值自然生效）；比例系数零改；
4. 判定族 / 六条尾文案 / prior 形态判定阈值谓词零碰。

**用例**：纯 ASCII 400 字符 → 100（与旧式逐值相等——零回归）；CJK 字 ×400 → 400（旧式 100）；混合 200 ASCII + 200 CJK → 250。

## 10. 验收标准（逐条回指需求）

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-AG1 | 六 kind 判定族全覆盖（含 `review_failed`）；块首行扫描；引文同串非块首不误判 | 不完整判定族 |
| A-AG2 | 三个消费点共用同谓词；未签发提示逐字可 grep；正常通过路径零回归 | 同上 |
| A-AG3 | 凭证链守卫：启动断言违反 ⇒ 拒绝报告且**不发请求**；拒绝前缀为稳定契约 | 凭证链 |
| A-AG4 | 压缩定锚：压缩触发时 `pinned` 重新挂回；重复压缩幂等 | 凭证链 |
| A-AG5 | 引文候选链：候选根序派生；失败原因三分；围栏不变 | 引文解析 |
| A-AG6 | 预算硬墙：墙判定绑信号状态；两种运行时形态（抛错 / partial 不抛错）同判；0.75 提示每场至多一次 | 预算 |
| A-AG7 | 冻结窗口：拦截判据与陈旧判定同源；被拒写入零落地；逃生门指引含 cancel；回执冻结句逐字 | 冻结窗口 |
| A-AG8 | 同步面记账 parity 四行；拒绝 / 异步 ack 两分支零改 | 同步面 |
| A-AG9 | 连续未完成护栏：结算分类优先级七行；neutral 不打断计数；计数 ≥3 停止且不可自解除 | 护栏 |
| A-AG10 | 预算派生两档：五组输入 → 五组输出与表逐值相等；回退链不抛错 | 预算跟随 |
| A-AG11 | 估算加权：纯 ASCII 逐值相等（零回归）；CJK 与混合用例逐值相等 | 加权 |

## 11. 边界

- 不改评审轮次语义 / cap / 会话隔离 / prior 注入 / 响应表（= `design/ADVISOR-CONVERGENCE.md` 权威）。
- 不改陈旧判定 / 变更记账 / 结算语义本体；不引入节级快照、自动取消 / 自动重发。
- 不拦截代码评审的在途写（仅设计评审）；不覆盖 bash / 文件操作类写入面（登记）。
- 不碰在途链文件；不改判定族 / 六条尾文案 / 压缩阈值。
- **零 UI 面**（拒绝文案落工具结果、冻结句落工具返回——无渲染面改动）。
- 不写实现代码（工具 / 守卫 / 检查点 = eng-coder 写域）。

## 12. 不并项与历史沿革

| 面 | 内容 | 何故不并 |
|---|---|---|
| 逐批设计记录（原 §14–§18 的批次小节） | 逐批问题陈述 / 选型 / 决策表 / 修正轮注记 | 一次性批次材料——契约已提炼入本档；流水归 `docs/batches/` + git 历史 |
| 逐批用例与 AC 编号集（T-CG* / T-SG* / T-EST* / AC-CG* / AC-B4-*） | 批次验收明细 | 批次材料 |
| 受影响文件清单（行数 as-of） | 逐文件行数与增量、档位结论 | 快照（as-of 数字不作契约） |
| 状态行与落笔流水 | 「实现未启动 / 待 coder / 已落」类状态句 | 运行时状态 |
| 拆分 / 迁出的实现流水 | 逐文件「拆出 loop / compaction」类结构变更流水 | 一次性实施材料（结构现状以代码为准） |
| 对端差异登记（本端零改项） | 三条对位登记（异步结算面 / 冻结窗口盲区 / 池中止） | 登记项；判决（本端语义自洽）已并入 §11 |

## 13. 体量与拆分规划（R24a）

**实测行数**：本档 **≈360 行**——超 300 软线。
**拆分规划（登记——触发 = 再度增厚至 >450）**：候选切面 = ①**判定与凭证**（§1–§3）②**预算与护栏**（§4–§9）；切点零交叉（§6 引 §1 谓词，以节名互挂）。**当前不拆**（≤500）。
**本次迁移的切分理由**：原 1570 行超硬限；按「收敛协议本体 ⇄ 边缘守卫」切为两档——本档 = 边界不失守的守卫族。

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md`（1570 行）切出并重建——落点判据 = `design/DOC-SYSTEM.md` §5.1 P1；
  承载原 §14（A–E 五契约：判定族 / 凭证链 / 引文候选链 / 预算硬墙 / 冻结窗口）+ §15（同步面）+ §16（预算跟随窗口）+ §17（连续未完成护栏）+ §18（CJK 加权）；坐标全量改现状路径；逐批快照与编号集入「不并项与历史沿革」。
