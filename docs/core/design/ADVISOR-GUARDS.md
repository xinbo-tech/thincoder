# Advisor 评审链边缘守卫（ADVISOR-GUARDS）· 设计

> 板块：advisor 评审链——**边缘守卫族**：不完整判定族 · 凭证链启动/全程守卫 · 类型门（顶层 `type` 必填 + 声明一致性）· 对象标识行（文案单源）· 引文解析候选链 · 预算硬墙与提示 · 冻结窗口 · 同步面记账 · 失败结算结论 · 预算跟随模型窗口 · 估算加权。
> 收敛协议本体（轮次 / 会话隔离 / prior / citations / guard / 响应表 / 需求契合 / 行数核查）= `design/ADVISOR-CONVERGENCE.md`——本档不重述（D2 单一权威源）。
> 需求层指针 = `docs/core/requirements/ADVISOR-CONVERGENCE.md`（该板块需求档——现状绝对路径）。
> 判据指针：归属与命名 = `docs/core/design/DOC-SYSTEM.md` §5.1 / §6。

## 1. 不完整判定族（A 族——单谓词）

**判定信号 = 宿主尾族（截断尾 + 机械失败尾）**（宿主生成，唯一确定性来源；模型自报“未完成”属自然语言——**不纳入**，语义判据边界不动）。

**谓词（单源）**：`advisorIncompleteMarker(text) → kind | null`——**块首行**逐字前缀（六 kind）：

| kind | 行前缀（逐字） | 生成点（交付态 · 实测 as-of 2026-09-18） |
|---|---|---|
| `context_limit` | `Advisor: context window limit reached (N tokens).` | `thincoder-core/advisor/loop.mjs:132` |
| `turn_cap` | `Advisor: stopped after 100 tool rounds` | `thincoder-core/advisor/loop.mjs:121` |
| `timeout` | `Advisor: review timeout after {S}s.` | `thincoder-core/advisor/loop.mjs`（另两处同判）；尾文案居 `thincoder-core/advisor/compaction.mjs` |
| `empty` | `Advisor: empty response — review was inconclusive` | `thincoder-core/advisor/loop.mjs:195` |
| `interrupted` | `Advisor: interrupted.` | `thincoder-core/advisor/loop.mjs:100`（另 :184 同判） |
| `review_failed` | `Advisor: review failed` | `thincoder-core/advisor/run.mjs:185`（catch 内字符串 resolve——不 throw） |

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

**4. 类型门（F30——顶层 `type` 必填 + 声明一致性校验 · fail-closed）**：点火参数顶层 `type` **必须逐字 ∈ {`"code"`, `"design"`}**——缺失 / `null` / 空串 / 非法值 / 非字符串（`args.type ∉ {"code","design"}`）⇒ **拒绝启动 + 指引**。
**冲突分支（判定句 ② · 父侧 2026-09-18 16:3x 裁定）**：顶层 `type` 显式合法 ∧ `object.type`（调用方自述的评审类型——工具 schema `thincoder-core/agent-tools/advisor.mjs:69`）声明为**另一合法值** ⇒ **同拒**（判据名 `type-object-conflict`；指引两路：改顶层 `type` / 改 `object.type` 声明）——闭合「声明面与实际轨不一致」这最后一孔。
**撤「无 `object` 时顶层缺省 = code」旧语义**（用户 2026-09-18 16:16 逐字裁定「不带 type 就要拒，不静默降级」）；`object.type === "design"` 而顶层缺/非法的形 = 本条**自然子集**（同一判定，不另立第二条规则）。

- **判定点** = 工具层**最早**（`thincoder-core/agent-tools/advisor.mjs:110`——旧 `args.type || "code"` 缺省处改设为类型门；先于范围判定 / 实例解析；cap / 停止预检已随撤除退场）——类型诊断优先于范围诊断（真因不被次要报错掩盖）；拒发登记 = `_advisorRefusals`（不置 called / 不耗轮次 / **零实例** / **零 token** / **零 LLM**）。
- **声明面双保险**：工具 schema 同轮增 `required: ["type"]`（同档 `parameters`）——模型侧的第一道提示；**强制仍只在判定面**（provider 不保证执行 `required`，而旧缺省路径已撤——声明与判定不互相依赖）。
- **前缀（新设——与启动断言前缀分列）**：`Advisor: launch refused`。本条拒绝**与轨无关**（缺 `type` 的 code 调用同拒）⇒ **不复用**设计专用的 `ADVISOR_LAUNCH_REFUSAL_PREFIX`
  （`Advisor: design review launch refused`，`thincoder-core/advisor/run.mjs:23`——其面 = 设计评审缺 token / 缺 Approval Signal，语义仍为设计专用）。
- **消费面零改**：工具层拒发走 `_advisorRefusals` 标记（不经前缀串判定）；既有前缀消费面 `thincoder-core/agent-tools/advisor.mjs:250` · `thincoder-core/agent-tools/advisor-settle.mjs:147` 零改。
- **逐字**：

```text
Advisor: launch refused — the tool call must carry an explicit type at the top level, one of the two legal values below. [type={code|design|absent|invalid} · scope={范围摘要|none} · round=— · criterion={type-missing|type-invalid|type-object-conflict}]
Why: {第二行分叉——逐字四形态见下（三判据名分支 + 对象声明追加行）}
  • type="code"   — code review: reviews the code you changed; pass paths=[...] to scope files/directories (documents=[...] adds acceptance-criteria context).
  • type="design" — design review: reviews design / requirement documents; pass documents=[...] (the explicit list) — plus batchDoc when a batch record is in flight.
Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call.
```

   `Why:` 四形态（逐字——按判定分叉；`{received}` / `{declared}` = 实收值原样回显）：

   - `type-missing`（缺失 / `null` / 空串）：`Why: the call carried no type at the top level — an omitted type must not silently fall back to the code track (that is how a design review becomes a code review without anyone noticing).`
   - `type-invalid`（非空非法值 / 非字符串）：`Why: "{received}" is not one of the two legal values — there is no closest-match guessing and no silent fallback.`
   - `type-object-conflict`（顶层显式合法值 ≠ `object.type` 声明值——**指引两路逐字在位**：改顶层 / 改声明）：`Why: the top-level type="{received}" disagrees with the object declaration object.type="{declared}" — align them: set the top-level type to "{declared}", or change the object.type declaration to "{received}".`
   - **对象声明追加行（归位——附于未定轨两分支，仅当 `object.type === "design"` 声明在位；不是独立判据名）**：`The object declaration says type="design"; the declaration describes the review target, it does not select the review track.`

- **判定枚举（闭合——三条判据名）**：`type-missing` = 缺失 / `null` / 空串 / 纯空白串；`type-invalid` = 非空且不在枚举内的值 / 非字符串（`"Code"`、`"design "`、数字、布尔、对象、数组等）；`type-object-conflict` = 顶层显式合法值 ∧ `object.type` 声明为**另一**合法值（`object.type` 缺失 / 非字符串 / 非枚举值 / 与顶层同值 ⇒ **不触发**）。三路**同一条拒绝**（前缀 / 指引 / 登记一致），仅标识行与第二行分叉。
- **边界（勿越）**：显式 `type="code"` / `type="design"` ∧ `object.type` 未声明 / 与顶层一致 / 非枚举值 ⇒ **照常受理**（`object` 只描述评审对象，**不选轨**）；只认逐字枚举值（不做 trim / 大小写 / 近似推断）。
  **一致性校验 ≠ 让 `object` 声明块选轨**——冲突判定**不改用** `object.type` 定轨、不推断「调用方大概想要哪一轨」，只在两声明对不上时拒绝（拒因 = 声明面自相矛盾）；可比对的域 = 两个**合法轨值**，非法声明值不构成轨矛盾。
  **窄读法（2026-09-18 16:5x 裁定——需求档 §9 F30 判定句 ② 同轮收正）**：冲突域 = 两个合法轨值之间；`object.type` 为**非合法值**（`"foo"` / 数字 / 非字符串）⇒ **不构成矛盾、照常受理**（`object` 非选轨面）——本文档判定枚举与需求档括注**同射程**（无并存读法）。
  **不设内防线**（`runAdvisorReview(agent, reviewType, …)` 的位置参不属本判定面——其两条内部调用者均在工具层判定**之后**，直接调用方一律显式传值，实测零缺省；登记见 §11）。
- **调用面（F30 判定句 ③——盘点零残留 · 口径可复核）**：全仓 advisor 发起点盘点见 `docs/batches/2026-09-18-advisor-face.md` §2.8（口径命令 + 命中清单逐条 + 落笔级 + 零残留判据）；受影响表 / AC 收正版见同档 §2.7。实测：提示词 / 纪律档文本**零旧缺省依赖**（advisor 调用形命中 2 处，均为槽位头注自述，非调用指令）；代码内调用点与用例 / 夹具**逐处显式 `type`**（`advisorTool.execute(` 12 处零缺省）。
- **冲突分支静态面零破坏（实测）**：三树 `*.mjs` 内 advisor 调用点**零 `object` 声明**——`object` 仅见于工具 schema `thincoder-core/agent-tools/advisor.mjs:66` 与描述 `:47`（`object.type` 的消费面 = 评审消息注入 `thincoder-core/advisor/messages.mjs:34`——只描述评审对象、不选轨）；夹具 `object: null` = 池条目字段而非调用声明 ⇒ 冲突判定只可能命中运行期自造的声明对（用例收正版见批档 §2.7 / §2.9）。

**5. 对象标识行（F31——三类文案单源）**：失败结论 / 范围拒回 / 类型门拒回三类文案的**首行**载对象标识四项（承 F29）：`[type={code|design|absent|invalid} · scope={范围摘要|none} · round={N}/uncapped|— · criterion={判据名}]`。

- **统一形态**：拒回族 = **既有稳定前缀逐字 + 标识块**（前缀仍在行首——向后可搜索；F31 两句同时满足）；失败结论族 = 既有结算正文逐字下沉为块体，块首行为标识行（§7）。
- **字段**（四项）：
  - `type` = 实际评审轨（`code` / `design`）；拒回面**未定轨**记 `absent`（缺失 / `null` / 空串）或 `invalid`（非法值）；**冲突拒回**记**顶层实收值**（`code` / `design`——与 `criterion=type-object-conflict` 配对读，未定轨）；**失败结论族**记**实际评审轨**（两轨共用——§7 契约二）。
  - `scope` = 范围摘要（首路径 + `+N more`；无范围记 `none`）。
  - `round` = 拒回族记**本次发起将使用的轮次号**（**撤 cap 后恒记 `{N}/uncapped`**——机制真相；判定先于实例解析时记 `—`）；**失败结论族记本次已结算尝试号**（与尝试表 `#` 同值——§7 契约二）。
  - `criterion` = 触发判据名（拒回族：`type-missing` / `type-invalid` / `type-object-conflict` / `scope-missing` / `scope-not-doc` / `scope-in-flight`；失败族：§7 判据名表）。
- **载面（枚举闭合——四项）**：① 范围缺失（`thincoder-core/agent-tools/advisor.mjs`）② 范围非法（同档——design documents 非文档）③ 同 scope 在跑（`thincoder-core/agent-tools/advisor-async.mjs`）④ **类型门拒回**（§2.4——缺 `type` / 非法值 / 与 `object` 声明冲突）。
- **cap 文案**：随 cap 撤除**整体退场**（机制不再产生该文案）。
- **不载面（登记——本批不改，避免扩面）**：async 误用拒回（depth>0 + `async:true`）· 启动断言拒回（无 token / 无 Approval Signal——其前缀已是稳定契约面）· 池队列 ack（非拒回）。
- **边界**：不改判定语义；不把文案扩为长报告（标识行恰一行）。

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

**零改边界**：轮次进位（含 legacy 分支）/ prior 规则 / 同步调用登记删除 / 拒发 / 异步 ack 语义——全数不动（未完成尝试耗预算；反复截断的出口 = **失败结论块（两轨共用——§7 契约二）** + guard 推回上限——**无 cap**）。

## 7. 失败结算结论（原「连续未完成即停」——2026-09-18 撤除）

**原机制（已撤）**：同一 doc-set 连续 3 次未产出可用结算 ⇒ 拒发（会话级计数载体 `_designReviewStreaks` + 停止谓词 + 两级检查点）。
撤除理由 = 用户 2026-09-18 15:46 裁定「到处加机械限制是一种非常拙劣低级的做法」+ 需求 F28（失败有结论 / 零会话级计数载体 / 机制面零封禁）。

**契约一：结算判据名（纯函数单源、零状态）**：输入 = 一次结算的宿主可见事实；输出 = 判据名（`string`）或 `null`（无可报结论）。**零 LLM 输出解析**（N20）。

**优先级（自上而下，首个命中）**：

| # | 输入（结实事实现场） | 输出 | 语义依据 |
|---|---|---|---|
| 1 | 启动被拒（报告以拒绝前缀开头——未发起请求） | `null` | 无尝试发生（不产结论块） |
| 2 | 陈旧结算 | `stale` | 判据类 |
| 3 | 无报告（正常链不可达） | `no_report` | fail-closed：无报告不得计为可用 |
| 4 | 未完成尾且非 `interrupted` | 宿主尾 kind（五类） | 宿主截断尾（单谓词） |
| 5 | 未完成尾 = `interrupted` | `null` | 用户 / 系统中断——被丢弃的尝试（尾文案已可见） |
| 6 | pass 但槽落盘失败 | `no_credential` | 未产出可用凭证 |
| 7 | 其余（pass 且落盘成功 / changes-required） | `null` | 可用判决——无结论块 |

- **与原分类表逐值等价**：优先级 / 输入面 / 判定语义零改——只换**输出形态**（不再输出计数 / 复位）。
- **确定性**：全部输入为宿主状态——零 LLM 输出解析。
- **轨适用**：分类纯函数对**两轨同源**调用（设计轨 + 代码轨结算）——判据名可达面见契约二「轨」列（`no_credential` 设计专属；`stale` 两轨可判）。

**契约二：结论文案（逐字）**——判据名非空时，结算出口追加结论块（**块首行 = 对象标识行**；样式见 §2.5）：

**轨适用（两轨共用——2026-09-18 裁定）**：结论块对 **code / design** 两轨同式适用（块首行 `type` = **实际评审轨**，不再写死 `design`）；判据名可达面见下表「轨」列（`no_credential` = 设计专属）。代码轨反复截断 / 陈旧的出口 = 本结论块（不是尾文案本身）。

```text
Advisor: review failure — 本轮未产出可用结论 (no usable settlement) [type={type} · scope={范围摘要} · round={N}/uncapped · criterion={判据名}]
{既有结算正文——逐字保留（未签发提示 / 陈旧前缀 / D1 落盘失败提示）}
Failed attempts in this review instance (most recent last):
| # | outcome | meaning |
|---|---|---|
| {N} | {判据名} | {人读说明（下表逐字）} |
Options: 1. proceed as-is (no usable conclusion — design: no token, implementation stays gated; code: the code face stays unapproved) · 2. narrow or change the scope and re-run · 3. stop and report to the user
```

- **尝试表行 = 本次尝试**（`#` = 该实例的尝试序号）——**不设跨次记录的载体**（零载体）：反复性由父侧从逐次结论块读出（机制侧贡献 = 每次载 `criterion=`）。
- **`round` 值语义（与尝试表 `#` 同值）**：结论块在**结算出口**追加（此时 `thincoder-core/agent-tools/advisor-settle.mjs:136` 的 `run.round++` 已执行）⇒ `round` = 本次**已结算**尝试号（**不是**「下一轮将使用的编号」——§2.5 字段行的失败族读法即本条）；尝试表 `#` 记同值。**断言**：块首 `round=N` ∧ 尝试表 `#=N`（用例 T-AF16）。
- **选项三值**（承 F29）：继续（无可用结论——实现仍闩 / 该面仍未被评审覆盖） / 改变或缩小范围后重跑 / 停下上报——**均不自动执行**（发起权在父侧 / 用户）。
- **零凭证值**：块内零 token / designId 值（用例 UUID 形扫描零命中）。
- **零封禁**：结论块是出口，不是封禁——下一次发起照常受理（检查点已撤——见下）。

**判据名 → 人读说明（逐字——上表第三列）**：

| 判据名 | 轨 | meaning |
|---|---|---|
| `timeout` | 两轨 | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| `context_limit` | 两轨 | review exceeded the model context budget |
| `turn_cap` | 两轨 | review exceeded the tool-round limit |
| `empty` | 两轨 | the provider returned an empty response |
| `review_failed` | 两轨 | provider / transport error |
| `stale` | 两轨（设计另附「token 未签发」正文） | the reviewed target changed while the review was in flight |
| `no_credential` | **设计专属**（凭证面——代码轨不可达） | the token could not be written to the session ledger |
| `no_report` | 两轨 | the review settled without a report |

**检查点撤除说明**：原两点式（工具层预检 + 评审执行体内防线）**随撤除退场**（迁移期引文）——不设任何按计数拒发的预检；失败路径的出口 = 结论块（§7 契约二）+ 父侧纪律（`design/ADVISOR-CONVERGENCE.md` §3.3）。

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
| A-AG9 | 失败结算结论：判据名优先级七行（纯函数）；判据名非空 ⇒ 结论块在位（标识行 + 含义 + 选项）；零凭证值 | 失败结论 |
| A-AG10 | 预算派生两档：五组输入 → 五组输出与表逐值相等；回退链不抛错 | 预算跟随 |
| A-AG11 | 估算加权：纯 ASCII 逐值相等（零回归）；CJK 与混合用例逐值相等 | 加权 |
| A-AG12 | 零计数载体 + 零封禁：无计数 Map 载体 / 无停止谓词 / 无两级检查点；同 doc-set 第 4 次及以后发起照常受理 | 失败结论 |
| A-AG13 | 类型门（F30）：`args.type ∉ {code,design}`（缺失 / `null` / 空串 / 非法值 / 非字符串）⇒ 拒发串（前缀 + 两合法值各一行用途 + 标识行）+ `_advisorRefusals` 登记，零实例 / 零 token；显式 `code` / `design` ∧ `object.type` 未声明 / 一致 / 非枚举值 ⇒ 照常；**冲突对**（顶层显式合法值 ≠ `object.type` 的另一合法值）⇒ 同拒（`criterion=type-object-conflict` + 两路指引） | 类型门 |
| A-AG14 | 对象标识行（F31）：三类文案首行载四项（type / scope / round / criterion）；既有稳定前缀逐字在位；类型门拒回 `type=absent\|invalid`（冲突拒回记顶层实收值 `code\|design`）；失败结论块 `type` = 实际评审轨（两轨共用） | 对象标识行 |
| A-AG15 | 调用面零残留（F30 判定句 ③）：`advisor.mjs` 源内 `args.type \|\| "code"` 零命中 + 声明面三处 type `(default)` 旧句零命中；三树 `advisorTool.execute(` / `runAdvisorReview(` / `prepareAdvisorMessages(` 调用点逐处显式；**声明一致零残留**——三树 `*.mjs` 调用点 `object` 声明零命中（静态面；结构断言 + 口径命令可重跑） | 类型门 |

## 11. 边界

- 不改评审轮次语义（**无机械上限**——轮次衰减 / 会话隔离 / prior 注入 / 响应表按 `design/ADVISOR-CONVERGENCE.md` 权威）。
- **不设会话级计数载体、不按计数拒发**（N20 / F28）；不改异步池上限（资源保护归调度域）。
- 不改陈旧判定 / 变更记账 / 结算语义本体；不引入节级快照、自动取消 / 自动重发。
- 不拦截代码评审的在途写（仅设计评审）；不覆盖 bash / 文件操作类写入面（登记）。
- 不碰在途链文件；不改判定族 / 六条尾文案 / 压缩阈值。
- **零 UI 面**（拒绝文案落工具结果、冻结句落工具返回——无渲染面改动）。
- **类型门登记（非发起点——零改，判据见 §2.4 / §10 A-AG13）**：VSC 记账面 `thincoder-vscode/src/agent/execute-tools.mjs:363`（`args.type !== "design"` 分支——判定后恒为枚举值，语义等价）· CLI 显示面 `thincoder-cli/src/tui/tool-args.mjs:51`（`a.type ?? "review"` 渲染兜底——不参与发轨判定，被拒调用照原样渲染）。
  **对象声明面** `thincoder-core/agent-tools/advisor.mjs:66`（`object` schema——自述为调用方声明的评审类型，只描述评审对象、**不选轨**；一致性校验 = §2.4 冲突分支）。
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

## 变更记录

- 2026-09-18（**顾问面治理批 · 实现后收正**——实现轮 id=91 终态 clean；落地批 = `docs/batches/2026-09-18-advisor-face.md`）：
  实现后坐标回填（as-of 2026-09-18）：§1 判定族生成点五处（`loop.mjs` ×4 = 前批漂移·同轮核过；`run.mjs` :233 → :185）· §2.4 判定点 `advisor.mjs` :98 → :110 并撤「cap / 停止预检」在场表述 · §2.4 启动拒绝前缀锚 `run.mjs` :33 → :23 · §2.4 前缀消费面两锚（`advisor.mjs` :247 → :250 · `advisor-settle.mjs` :144 → :147）· §7 `run.round++` 锚 :133 → :136。

- 2026-09-18（**顾问面治理批 · 修正轮**——评审 id=84 的 12 条发现（🔴2 / 🟡5 / 🔵5）；落地批 = `docs/batches/2026-09-18-advisor-face.md` §2.10）：
  §7 增**轨适用（两轨共用）**——结论块模板 `type` 改 `{type}`、判据名表增「轨」列（`no_credential` = 设计专属）、补 `round` 值语义（= 已结算尝试号，与尝试表 `#` 同值）+ 断言；
  §6 零改边界的「失败结论」措辞与之一致；§2.5 `type` / `round` 字段行补失败族读法；§2.4 边界句写明**窄读法**（`object.type` 非合法值 ⇒ 不触发）；
  §10 A-AG 编号按号重排（A-AG10/11/12/13/14/15 单调）；需求层指针改现状绝对路径。

- 2026-09-18（**顾问面治理批 · 小返工轮**——父侧裁定上抛 9「拒」；落地批 = `docs/batches/2026-09-18-advisor-face.md` §2.9）：
  §2.4 增**冲突分支**（顶层显式合法值 ≠ `object.type` 声明的另一合法值 ⇒ 拒——判据名 `type-object-conflict` + 两路指引）、`Why:` 由三形态增四形态（既有对象声明追加行归位至未定轨两分支）、判定枚举闭三条判据名、拒发串标识行值域同步、边界句补「一致性校验 ≠ 让 `object` 选轨」；
  §2.5 标识行 `type` 值域与 `criterion` 集同步；§10 A-AG13 / A-AG14 / A-AG15 同步；§11 登记补对象声明面；板块行同步。

- 2026-09-18（**顾问面治理批 · 返工轮**——用户 16:16 补裁「不带 type 就要拒，不静默降级」；落地批 = `docs/batches/2026-09-18-advisor-face.md` §2.6）：
  **§2.4 重写**——「误配断言（object 声明不一致）」→「**类型门（顶层 `type` 必填）**」：判定扩为 `args.type ∉ {code,design}` 全形态、
  拒发串改「两个合法值 + 各一行用途」、前缀新设 `Advisor: launch refused`（与设计专用启动断言前缀分列，附否决理由）、判据名 `type-missing` / `type-invalid`（`type-mismatch` 退场）、
  边界撤「无 `object` 时顶层缺省 = code」旧语义 + 增调用面盘点口径 + 声明面双保险（schema `required: ["type"]`）；
  §2.5 标识行 `type` 值域扩 `absent|invalid`、`round` 记 `{N}/uncapped`；§10 增 A-AG15（调用面零残留）· A-AG13 / A-AG14 收正；§11 增类型门登记两项；板块行同步。

- 2026-09-18（**顾问面治理批 · 用户裁定**——台账 #84 / #85 / #86；落地批 = `docs/batches/2026-09-18-advisor-face.md`）：§7 重写（原「连续未完成即停」→「失败结算结论」：计数载体 / 停止谓词 / 两级检查点撤除；
  分类改纯函数输出判据名；结论块逐字模板 + 判据名表）· §2 增 **4. 误配断言（F30）** 与 **5. 对象标识行（F31）**（三类文案首行四字段；载面枚举四项）· §4 / §6 零改边界句的 cap 引用收正 · §10 增 A-AG12/A-AG13/A-AG14 · §11 边界同步。

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md`（1570 行）切出并重建——落点判据 = `design/DOC-SYSTEM.md` §5.1 P1；
  承载原 §14（A–E 五契约：判定族 / 凭证链 / 引文候选链 / 预算硬墙 / 冻结窗口）+ §15（同步面）+ §16（预算跟随窗口）+ §17（连续未完成护栏）+ §18（CJK 加权）；坐标全量改现状路径；逐批快照与编号集入「不并项与历史沿革」。
