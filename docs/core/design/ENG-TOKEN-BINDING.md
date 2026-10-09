# designToken 硬化与生命周期（ENG-TOKEN-BINDING）· 工程模式凭证链板块

> 板块 = **工程模式凭证链（token 生命周期 + 写权门禁）**——token 是什么 · TTL 与格式 · 跨模式存活 · 清理时机 · **写权机械门（token 门 + D5 冻结窗口 + docRoot 声明面）**。
> **v2 就地更新**（2026-09-17 退役批）：M4 模块设计语义融入（写权门禁——见 §9；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` 已归档 `_archive/modules/`——§12 映射核正：WRITE.md 为 write 工具语义档，写权门禁归本档）。
> 相邻权威 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（结算的持久化 / 回读 / 消费面——结算**判定**语义〔echo 即裁决 / 回显链判定〕= 本档 §5 辖域；两辖域互不重述，D2——2026-10-04 实核该档无回显规则重述）· `docs/core/design/CONSULTATION.md`（评审引擎）· `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md`（工程模式流程，CLI 树**未迁**）。
> 需求侧 = `docs/core/requirements/ENG-TOKEN-BINDING.md`（批 5 建档——源 = VSC 树需求档）；CLI 树需求档 `thincoder-cli/docs/requirements/ENG-TOKEN-BINDING.md` **未迁**（后续批）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/ENG-TOKEN-BINDING.md` 内容重建入基准层；旧档原地一字不改、留作参照历史；**旧档 §4/§5 口径陈旧 ⇒ 按现状收正**——见 §8.1）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. designToken 是什么

**流程凭证**——「你评审过了吗？评过才给 token，才能 spawn eng-coder」。它是**防 agent 跳过评审步骤**的机制，**不是防人 / 防仿冒的密码学安全边界**。

**三条铁律（现行）**：

1. **语义 = 流程凭证，非安全边界**。HMAC / 加密因子 / 签名是 **security theater**——agent 只要看到因子就能仿冒生成，但那**无所谓**（机制目标是流程门，不是密码学安全）。token 格式 = `uuid:expiresAt`，**只有格式校验 + TTL，无签名**。
2. **生命周期 = 会话级流程凭证，跨模式存活**。token 绑定会话、随模式存活：**ON→OFF 不清、OFF→ON 不重评**（TTL 内上次评审 token 继续有效）。**仅 TTL 过期清**（三个时机见 §4）。会话切换（`/new`）仍清——会话切换不是模式切换。
3. **单一数据源 = 会话槽权威持久源 + 内存运行态**。slot 持久化是**跨重启 / 跨模式恢复的有意载体**，不是 bug；内存是运行态。一致性经恢复 TTL 过滤 + 清空语义保证——不得造成内存 / 文件双源不一致（结算面细节归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`）。

**防误用纪律（违反即 bug）**：不加 HMAC / 内容绑定；spawn 时**从内存 Map 定位**而非自行签发。

## 2. 明确不做（v1 考古，勿重试）

- **内容绑定全套**（`normalizeForHash` / 头部簿记剥离 / `hashDocuments` / `docKey` 映射 / 交集作废 / 路径归一化）——用户实况否决：批次间文档必然变更，内容绑定会把「偶尔重评」变成「每批必重评」（收益反转）。
- `TOKEN_SECRET` 随机化、`eng(enter)` 用户同意门——仍留 TODO。

## 3. TTL 与 token 格式

- 默认 TTL **7 天**：`TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000`（`thincoder-core/agent-tools/design-token.mjs:36`）。
- 配置覆盖：`agent.engTokenTtlMs`——运行期校验（`Number.isFinite(cfg) && cfg > 0`，**非法回退默认**），照抄 advisor `timeoutMs` 口径：`thincoder-core/agent-tools/design-token.mjs:39`（`effectiveTokenTtlMs`）。
- 格式：`${uuid}:${expiresAt}`——uuid 为 `[0-9a-f]{8}-…-{12}`，`expiresAt` 为数字毫秒时间戳。
- **格式 + 过期判定的单一权威** = `thincoder-core/token-ttl.mjs:42`（`tokenExpiryMs`）/ `:55`（`tokenExpired`）——由恢复过滤、开模式清理、spawn 门禁过期拒删槽共引（`thincoder-core/token-ttl.mjs:5`–`:8` 注释即此登记）。
- **过期判定只对格式合法的 token**判过期：格式 / 畸形串不在此清理（恢复时读回由门禁格式拒、门禁拒时也不删槽——防误删有效槽）。
- `validateDesignToken`（`thincoder-core/agent-tools/design-token.mjs:55`）= `tokenExpiryMs(token) !== null && expiry >= Date.now()`——**fail-closed**。

## 4. 生命周期（现行）

| 事件 | 行为 |
|---|---|
| 评审通过 | token 签发入槽（settle）——advisor 回包含 token ∧ 裁定行 pass（§5.2）即结算，pass 分支后签发 |
| ON→OFF | **不清**——有效 token 跨模式存活 |
| OFF→ON | **不重评**——上次评审 token 继续有效（TTL 内） |
| 重启 / 恢复 | **TTL 过滤**——过期不读回内存（丢弃，下次 save 自然清字段）；有效跨重启存活 |
| 开工程模式 | 清**过期** token（有效保留）——`eng` enter 真转换路径（`thincoder-core/agent-tools/eng.mjs:92`）· `/eng` ON 路径（`thincoder-cli/src/tui/cmd-eng.mjs:69`） |
| spawn 门禁 | 过期拒 + **顺手删该 designId 槽**（`thincoder-core/agent-tools/subagent-spawn.mjs:237`——**仅过期拒删**；mismatch / 格式拒**不删**） |
| 会话切换（`/new`） | 清 token（`resetSessionState`）——会话切换不是模式切换 |
| TTL | 7 天默认（可配），fail-closed 不变 |

**清理时机三处**（铁律 2）：① 恢复过滤（重启 / 恢复读回前逐槽校验，过期丢弃）；② 开工程模式清过期（遍历 Map 删过期，有效保留）；③ spawn 门禁过期拒时顺手删该 designId 槽（长跑不重启也清）。

## 5. 结算语义（echo 即裁决 · 签发 = 回显 ∧ 裁定行——§5.2）

- **token echo 即裁决**——advisor **仅在通过时**回显 token。
  - echo（全串 ∥ 截断形——§5.1）∧ 裁定行（§5.2）→ 入槽（designId 键）；非 echo → 剥离 token 文本 + **恒定未签发标记**（§5.1 ②）返回 findings，**槽不动**（失败的重评不作废任何既有槽）。
  - 实现：`thincoder-core/agent-tools/design-token.mjs:128`（`settleDesignReview`）。
- **未完成即不签发**：结算方收到「评审未完成」kind（`opts.incomplete`）⇒ 一律不签发（无论文本是否回显 token）——剥除回显 + 追加未签发提示，**不写槽、不关实例**（可重评）。
- 错误回包 / abort / 轮次耗尽**不作废**既有槽；`result === null` 守卫保留。
- 签发 / 校验 / 结算三函数的**宿主模块** = `thincoder-core/agent-tools/design-token.mjs`（自 `advisor-async.mjs` 提取，verbatim 零语义变）；`advisor-async.mjs` 仍 re-export（既有 import 面不变）。

### 5.1 回显链判定（2026-10-03 批——截断容忍 / 恒定标记 / 剥离单源）

**批** = `docs/batches/2026-10-03-design-token-echo.md`（台账 #884；缺陷 = 截断回显静默失败 + 残片未剥 + 回显指令未言明逐字面）。三条语义：

**① 截断回显 = 容忍（认 pass）**：回显判定 = 全串匹配（既有 `makeDesignTokenRegex`）**∨ 截断形**（原始评审文本含**本 token 的 uuid 值**——`uuid:expiresAt` 冒号前段；36 位随机值专属本 token 值，任何出现 = 部分回显）。截断形 ⇒ **认 pass**（回显仅通过时发生——批准意图已表达）：**槽存储恒全串**（引擎侧常量，不取回显值）；追加**截断标记**（②）；`[DESIGN-TOKEN:<uuid>]` 形与裸 uuid 残片**一并剥净**（③）。（签发仍以 §5.2 裁定行为必要合取。）

**② 恒定标记（逐字——机器可 grep；不得只在正文为空时出现）**：

- 非回显（全串与 uuid 均未见）——恒定追加：

```text
未回显有效 token——未签发 (no valid token echo — no design token was issued)
```

- 截断容忍（认 pass）——在 Approved 后缀**之前**追加：

```text
注：回显被截断（uuid 之后缺失或不符）——已按批准结算；全串 token 已签发 (note: truncated echo — the part after the uuid was missing or inexact; settled as approved; the full token was issued)
```

**标记位置不变式**：标记恒居 `approvedSuffix` **之前**——`stripApprovedSuffix`（`thincoder-core/agent-tools/design-token.mjs:31`）以「文本以 suffix 结尾」为精确截断判据（prior 清洗依赖此形）；任何在结算输出**尾部**追加文本的改动都不得破坏「suffix 恒居文末」。

**③ 剥离单源**：`stripDesignTokenEcho`（本批新增）——全串回显 + 截断形（`makeDesignTokenPrefixRegex` 前缀形）+ 裸 uuid 三剥（uuid = token 专属随机值 ⇒ 零附带）；
结算三分支 + 未完成径（`thincoder-core/agent-tools/design-token.mjs:133-140`）+ stale 径（`thincoder-core/agent-tools/advisor-settle.mjs:212-213`）+ D1 落盘失败径（`thincoder-core/agent-tools/advisor-settle.mjs:179-180`——pass 后落盘失败按原文重建，残片同须剥净）的剥离统一走该单源。

**D1 落盘失败径标记注记（有意策略）**：该径只剥净、**不追加截断标记 M2**——落盘失败 ⇒ 结算未成立、自带 D1 失败通知（非静默）；FR8① 截断标记语义（「按批准结算」）在该径不成立——免对盘误判。

**④ 回显指令加固（逐字——三档）**：

**a. Approval Signal 构建面**（`thincoder-core/advisor/messages.mjs` 句尾）：

```text
（:51——designId 在场形句尾）Copy BOTH values verbatim — every character, including the colon and the digits after the uuid inside the token brackets; a shortened echo is flagged as truncated.
（:52——token-only 降级形句尾）Copy it verbatim — every character, including the colon and the digits after the uuid; a shortened echo is flagged as truncated.
```

**b. 评审员系统提示两源**（同文口径——EN 运行期 ∥ CN 模板逐字对应）：

```text
（EN——`thincoder-core/prompts/advisor-design.md:24` 句内加固）Copy BOTH values verbatim — every character, including the colon and the digits after the uuid inside the token brackets; a shortened echo is flagged as truncated. The designId must be the LAST thing you output.
（CN——`docs/core/design/prompts/advisor-design.md:55` 句内加固）两个值逐字复制——每个字符都在内，包括冒号与 token 方括号内 uuid 之后的数字位；截断回显会被标记。designId 必须是你输出的**最后**一样东西。
```

条件句面（凭证回显条件）= `docs/core/design/ADVISOR-CONVERGENCE.md` §2.5（本档不重述）；实施序 = 配套批 `2026-10-03-advisor-convergence` 已落地——无剩余门（加固句随本批实施轮拼接）。

**依据**：需求 `docs/core/requirements/ENG-TOKEN-BINDING.md:30`（FR6——「回显匹配……以代码判定为准」）+ `docs/core/requirements/ENG-TOKEN-BINDING.md:32`（FR8——回显异常零静默 × 复制纪律，2026-10-03 批）+ `docs/core/requirements/ADVISOR-CONVERGENCE.md:86`（N7 零静默）。
**边界**：不改 token 格式 ∥ TTL ∥ 门禁恒等比对语义 ∥ 「非回显 ≠ 通过」本体。

### 5.2 裁定闸（VERDICT 机械闸——2026-10-05 批 · 台账 #940）

**批** = `docs/batches/2026-10-05-review-gate-gaps.md`（#940 自 engine-face-gaps 批转出——L7 二度拆分产物）。**问题**（对侧 N-9 实撞 2026-10-04：`changes-required`（🔴 2）回执仍附 token——父侧未用、守纪重评）：签发判据 = 纯回显；「仅无 🔴 才回显」只住提示词层 ⇒ 闸门纸做。**形** = 签发前过裁定闸——回显之外**追加必要合取**：

- **判据（机械——纯函数 `verdictGateFailure(rawResult)`；宿主 `thincoder-core/agent-tools/design-token.mjs`）**：回执文本**含 pass 裁定行 ∧ 不含 changes-required 裁定行**；两式逐字：

```text
VERDICT_PASS_LINE    = /^[ \t]*[*_`]*[ \t]*VERDICT:[ \t]*pass[ \t]*[*_`]*[ \t]*$/m
VERDICT_CHANGES_LINE = /^[ \t]*[*_`]*[ \t]*VERDICT:[ \t]*changes-required[ \t]*[*_`]*[ \t]*$/m
```

- **裁定行来源（提示词面既有逐字约定——两源同文口径；本闸零新造提示词面要求）**：`VERDICT: pass` / `VERDICT: changes-required` = 评审员提示词既有的收尾裁决行——EN 运行期 `thincoder-core/prompts/advisor-design.md:20-22` ∥ CN 模板 `docs/core/design/prompts/advisor-design.md:51-53`（同文口径）；
  补充轮族三档同形（`thincoder-core/prompts/advisor-round1.md` 等——「`## Verdict Line`」节）。
  EN 逐字锚（`:20`）= 「Close your findings with a single verdict line — `VERDICT: pass` or `VERDICT: changes-required` — as the line immediately before the token echo」。
- **判定三值（机器序 = 先 changes、后 pass）**：含 changes-required（与 pass 并存亦然——fail-closed 方向）⇒ `"changes-required"`；否则缺 pass 行 ⇒ `"no-pass-line"`（**缺行 = 拒签**——fail-closed：提示词面既有「以单行裁决收尾」义务，缺行 = 不合规回执，不得铸）；含 pass ∧ 无 changes ⇒ `null`（过闸）。实现形（新导出；逐字——供直连单测，同 `stripDesignTokenEcho` 先例）：

```js
export function verdictGateFailure(rawResult) {
  if (typeof rawResult !== "string") return "no-pass-line"
  if (VERDICT_CHANGES_LINE.test(rawResult)) return "changes-required"
  return VERDICT_PASS_LINE.test(rawResult) ? null : "no-pass-line"
}
```
- **拒签效果**（合取不成立时）= 与「未完成」径同形：剥净回显（`stripDesignTokenEcho` 单源）+ 恒定标记（下）；**不写槽 ∥ 不关实例 ∥ 零 `_engDesignReviewed`**（修后重评）。
  输出构造 = `[stripDesignTokenEcho(rawResult, designToken).trim(), 标记].filter(Boolean).join("\n\n")`（M1 径同形——现体 `thincoder-core/agent-tools/design-token.mjs:148`）。
  恒定标记逐字（机器可 grep；`reason` = 上列二值之一；实现 = 常量 `VERDICT_GATE_MARK`，`NO_VALID_ECHO_MARK` 族邻位）：

```text
裁定非通过——token 未签发 (review verdict is not pass — no design token was issued; reason: <no-pass-line|changes-required>; the echoed token was stripped)
```

- **与 #884 回显链的并存关系（显式声明）**：回显链判定（§5.1——全串 ∥ 截断容忍 ∥ 恒定标记 ∥ 剥离单源）**本体零改**；签发判定式 = **回显 ∧ 裁定 pass**——本闸 = 回显路内追加的**必要合取**；非回显径（M1）与未完成径（§5）不达本闸、原样。
- **行形容忍边界**：行首 / 行尾空白与行两侧 markdown 强调符（`*` `_` 反引号）容忍；大小写按逐字面（不折叠——`VERDICT` 大写 ∥ `pass` / `changes-required` 小写 = 提示词面既有逐字形）；行序与「裁定行紧邻回显」不校验；不区分正文 ∥ 代码块（同形行即命中——误引同形行按方向拆分：误引 `changes-required` 同形行 ⇒ 拒（fail-closed、重评可解）∥ 误引独立 `pass` 同形行（无 changes 行）⇒ 可能放行（回显在场即签发））。
- **提示面随动（产品码——`thincoder-core/advisor/messages.mjs` `buildDesignApprovalBlock`（`:49-59`））**：`echo` 串之后新增独立数组项（现体 `:53-58` 返回数组内、`echo` 与 `🟡` 段之间——designId 在场形 ∥ token-only 降级形两分支同载，单点实现；净 +1 行）；逐字：

```text
The verdict line is checked mechanically: without a `VERDICT: pass` line, or with a `VERDICT: changes-required` line, no token is issued even when the token is echoed.
```

  提示词档（`advisor-design.md` EN/CN）既有「pass ⇒ 才回显」句已言明耦合——**零改**（如需同句加固 = 主 agent 内容权）。
- **实现坐标（钉死——实施者零开放结构决定）**：`settleDesignReview`（`thincoder-core/agent-tools/design-token.mjs:128`）回显分支内——现体 `:146-149` 非回显径 return 之后 ∥ `:158` `agent._engDesignTokens ??= new Map()` 之前（闸不过 ⇒ 原地 early return 拒签）。
  两常量 + `verdictGateFailure` + 标记常量同宿主（`NO_VALID_ECHO_MARK` 族邻位——现体 `:95-96`；函数导出——直连单测面，同 `stripDesignTokenEcho` 先例）。
  同步径（`thincoder-core/agent-tools/advisor.mjs:261`）∥ 异步径（`thincoder-core/agent-tools/advisor-settle.mjs:155`）共用本单点——**零第二签发点 ∥ 零调用点改**（re-export 面 `advisor-async.mjs:45` 零触）。
- **依据**：台账 #940；对侧实撞 2026-10-04；需求 = `docs/core/requirements/ENG-TOKEN-BINDING.md` FR6 / FR8（回显以代码判定为准 + 回显异常零静默）。
- **验收（回指批档 §2.5 全表）**：红 = `VERDICT: changes-required` + 回显（pass 并现亦然）⇒ 拒签（槽零写 ∥ 实例保持 ∥ 标记逐字）∥ 无裁定行 + 回显 ⇒ 拒签；绿 = 裁定 pass + 回显（全串 ∥ 截断）⇒ 照旧签发（#884 回归零改）。
- **边界**：不改 token 格式 ∥ TTL ∥ 回显链本体 ∥ 槽 / 实例语义；行形判据以「行形容忍边界」为限（无更多宽容面）。**残余声明**：红项计数不入机械判据（表形浮动不可机判——§7 D-E10 否决备选）；「列着红项」的机检覆盖经裁定行代理；误引独立 `pass` 同形行（无 changes 行）⇒ 放行方向残余（回显在场即签发——行形判据不辨引用语境）。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| TTL 默认 + 配置覆盖 | `thincoder-core/agent-tools/design-token.mjs:36` · `:39` | 在位 |
| 签发（无签名） | `thincoder-core/agent-tools/design-token.mjs:46` | 在位 |
| 格式 + 过期单一权威 | `thincoder-core/token-ttl.mjs:42` · `:55` | 在位 |
| fail-closed 校验 | `thincoder-core/agent-tools/design-token.mjs:55` | 在位 |
| 结算（echo 即裁决） | `thincoder-core/agent-tools/design-token.mjs:128` | 在位 |
| 回显链判定面（截断容忍 ∥ 恒定标记 ∥ 剥离单源——本批新增，§5.1） | `thincoder-core/agent-tools/design-token.mjs`（`stripDesignTokenEcho` · `makeDesignTokenPrefixRegex`——结算三分支 + 未完成径消费）· `thincoder-core/agent-tools/advisor-settle.mjs:179-180`（D1 落盘失败径消费）· `:212-213`（stale 径消费） | 本批（2026-10-03） |
| 裁定闸（VERDICT 机械闸——§5.2） | `thincoder-core/agent-tools/design-token.mjs`（`verdictGateFailure`——结算回显分支消费）· `thincoder-core/advisor/messages.mjs`（`buildDesignApprovalBlock` 句尾追加） | 本批（2026-10-05 · #940） |
| 开模式清过期（工具面） | `thincoder-core/agent-tools/eng.mjs:92` | 在位 |
| 开模式清过期（TUI 面） | `thincoder-cli/src/tui/cmd-eng.mjs:69` | 在位 |
| 恢复过滤 | `thincoder-core/session-lifecycle.mjs:123`–`:124` | 在位 |
| `/new` 清 token | `thincoder-core/session-lifecycle.mjs:303`–`:304` | 在位 |
| 门禁过期拒删槽 | `thincoder-core/agent-tools/subagent-spawn.mjs:237` | 在位 |
| 槽清理原语 | `thincoder-core/token-ttl.mjs:65`（`removeDesignTokenSlot`）· `:90`（`purgeExpiredDesignTokens`） | 在位 |
| TUI OFF 不清 token | `thincoder-cli/src/tui/cmd-eng.mjs`（OFF 路径） | 在位 |

### 6.2 落地状态

R16 语义（跨模式存活 + 三清时机 + 单一权威）**已全部落地**，与本文一致——实核于上表各坐标。

### 6.3 VSC 端接线（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/_archive/design/ENG-TOKEN-BINDING-TUNING.md`（VSC 产品档——旧档一字未改、留参照历史）。**语义两端 lockstep**（流程凭证 / 无签名 / 跨模式存活 / 仅 TTL 过期清 / slot 权威持久源）；VSC 模块落点与持久化面独立
> （slot 经 `session-io` / `setSlotEngDesignTokens` 多槽写——非 CLI 单源 persistState 布局）。结算 / 持久化细节归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §6.3（本档不重述，D2）；原 VSC 镜像 `src/agent-tools/{advisor,subagent-spawn-gate,eng}.mjs` 等随 W9/W12/W13 已删（删除记录见批次档 §5）。

| 面 | VSC 落点（实核 · W16 接线面收正） |
|---|---|
| TTL 默认 + 配置覆盖 | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/design-token.mjs:36`（`TOKEN_TTL_DEFAULT_MS` = 7 天）· `:39`（`effectiveTokenTtlMs`——`Number.isFinite(cfg) && cfg > 0`，非法回退默认） |
| 签发（无签名 uuid:expiresAt） | 核 `thincoder-core/agent-tools/design-token.mjs:46`（`generateDesignToken`） |
| 格式解析单一源 | 核 `thincoder-core/token-ttl.mjs:42`（`tokenExpiryMs`——fail-closed：段数≠2 / 空 uuid / isNaN 全返 null）· `:55` |
| 过期判定 + validate + 回显匹配 | 核 `thincoder-core/agent-tools/design-token.mjs:55`（`validateDesignToken`——fail-closed）· `:61`（`makeDesignTokenRegex`——转义整 token 回显匹配） |
| 恢复过滤（逐槽 TTL 校验） | 端壳 hydrate：`thincoder-vscode/src/agent/agent-state.mjs:57-75`（`reconcileEngDesignTokens`——逐槽 TTL 校验、过期丢弃、内存项保留）· `:70-71`（legacy 单值一次性迁移读） |
| 开工程模式清过期 | **W9 已迁核**——现体 = 核 `thincoder-core/agent-tools/eng.mjs:92`（`purgeExpiredDesignTokens`——仅删过期、有效保留）；原端侧 `eng.mjs:20/:74/:79` 已删 |
| spawn 门禁族 | **W12/W13 已迁核**——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:100`（`resolveDesignSlot`——精确槽 / 单槽 / 多槽拒；内存 miss 回读槽）· `:237`（仅过期拒才删槽——`removeDesignTokenSlot`）· `thincoder-core/agent-tools/design-slots.mjs:110`（`executeConsumeDesignAction`——链终消费 + 落盘对称）；原端侧 `subagent-spawn-gate.mjs:70/:101/:124/:145` 已删 （迁移期引文） |
| 内存运行态 + 回合尾落盘 | 端壳 `thincoder-vscode/src/agent/setup.mjs:53`（`_engDesignTokens` 惰性 Map——每 run 重建 agent 后水合）· `:191`（`setSlotEngDesignTokens` 回合尾 flush） |
| 多槽持久化原语 | `setSlotEngDesignTokens` = 端侧定义（`thincoder-vscode/src/extension/session-slot-write.mjs`）；`mergeEngTokensForSave` = 端侧转口 re-export（别名 `engTokensMergeForSave`）→ 核 `thincoder-core/session-slot-write.mjs` 定义；原 `thincoder-vscode/src/extension/session-io.mjs:43` re-export 行随 W11 重排 |

**VSC 侧差异**（有意——源码注释逐字登记）：① slot 持久化 = **会话槽单点**（现体 = `thincoder-vscode/src/agent/setup-tooltable.mjs:85-94`）；② spawn 门禁 `resolveDesignSlot` 读当前 run 内存 Map、**miss 时回读槽文件权威台账**（结算面——`DESIGN-TOKEN-SETTLEMENT.md` §6.3）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-E1 | token = **无签名流程凭证**（`uuid:expiresAt`） | agent 能看到因子即可仿冒——签名只是 security theater；否决 HMAC / 内容绑定 |
| D-E2 | 内容绑定**整套否决** | 文档每批必变 ⇒ 内容绑定把「偶尔重评」变「每批必重评」（收益反转） |
| D-E3 | 生命周期 = **跨模式存活**（ON↔OFF 不清不重评） | 模式切换不是评审失效的理由；否决「exit 清空」的旧语义 |
| D-E4 | slot 持久化 = **有意载体**（不是 bug） | 跨重启恢复是刚需；否决「内存单源」（重启即丢） |
| D-E5 | 过期判定**只对格式合法 token**生效；门禁拒时**仅过期拒才删槽** | 畸形串无从判定——删了会误删有效槽；否决「一律删」 |
| D-E6 | 清过期只在**三个时机**（恢复 / 开模式 / 门禁过期拒） | 长跑不重启也要清；否决「只在恢复时清」 |
| D-E7 | 结算三函数**拆出独立模块**（design-token.mjs）+ re-export 保 import 面 | 否决「挤在原文件」 |
| D-E8 | **截断回显 = 容忍**（uuid 形 ⇒ 认 pass + 截断标记；槽存全串） | 截断 = 机械噪音（回显仅通过时发生；uuid = token 专属随机值、零附带；凭证 = 流程门非安全边界）；否决：不容忍重审（批准意图明确仍费整轮）；否决：更宽前缀容错（短 uuid 段假阳面） |
| D-E9 | 非回显结算**恒定标记**（逐字——含正文为空形） | N7 零静默（需求 `docs/core/requirements/ADVISOR-CONVERGENCE.md:86`）；否决：仅空文本 fallback（静默洞本体——批前形） |
| D-E10 | 签发前**裁定闸**（回执须含 `VERDICT: pass` 且无 `VERDICT: changes-required`——回显之外的必要合取） | #940 对侧实撞（🔴 回执带 echo 直铸 token）；「仅无 🔴 才回显」只住提示词层 = 纸闸。**否决备选**：◎只加固提示词（已加固仍实撞——提示词非机械面）◎解析发现表 🔴 计数（表形浮动不可机判）◎仅拦 changes-required（缺裁定行仍放行——漏网） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/ENG-TOKEN-BINDING.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实现 v2 + R16」+ 现码核对注） | 时点状态行 / 一次性核对注 | 批次语境——现行态已入 §3–§6 |
| **旧档 §4 结算语义括注「入槽（designId 键 + 单值镜像 + eng-coder 门禁标志）」** | 含**已退役**的单值镜像 | **已废结构**——单值镜像随结算批 D3 退役（现状见 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §4）；照抄即把已废结构写进权威层 |
| **旧档 §5 实现落点表**（签发/校验/结算挂 `advisor-async.mjs`；`token-ttl.mjs` 标「（新）`」） | 迁移前宿主模块划分 | 现状 = 三函数住 `agent-tools/design-token.mjs`（`token-ttl.mjs` 仅留 TTL 纯函数 + 槽 I/O）——见 §6.1 |
| 旧档 §4 表下的「双源 bug 修复设计（旧 F-DS / D-DS / T-DS / AC-DS 块）」与「已确认非 bug」注 | 一次性双源排查流水 | 审计材料——结论已入铁律 3（结算面细节归相邻档） |
| 旧档 §6 验收行 AC1–AC11 | 一次性验收清单 | 批次材料——现行约束已入 §3–§5 |
| 旧档变更记录（三条逐批流水） | v2 / R16 / 重写流水（含旧 `src/**` 坐标） | 历史叙述——本档自有变更记录；坐标按现状收正 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 工程模式流程本体 | `ENGINEERING-MODE.md` 的流程 / 判据 | CLI 树档**未迁**（后续批）——本档只留凭证链机制 |
| `TOKEN_SECRET` / `eng(enter)` 同意门 TODO | 未做项的待办指针 | 项目技术待办面（台账 = 父侧）——本档只在 §2 登记「明确不做」 |
| 需求侧正文 | CLI 树需求档 | 需求档未迁——后续批并入既有档 |
| VSC 旧档 §1–§3（语义 lockstep 重述） · §4 生命周期表 · §6 AC1–AC11 · 变更记录 | 重复面 / 批次材料 / 流水 | **不并**——语义已由本档 §3–§5 承载（lockstep 表述只在 §6.3 头注保留共存锚）；AC 与变更流水 = 一次性材料（(d) 类） |

## 9. 写权门禁（v2——M4 增量）

**定位**：把写权矩阵从「靠提示词自觉」落成**机械门禁**——没有 token 写不了产品代码（token 门）、评审在途改不了被审文档（D5 冻结窗口）。v2 增量 = 评审对象 / 被审文件路径来源改读 manifest `docRoot`（去硬编码 `docs/`，可迁移 N2）。

**F1 token 门（继承 v1）**：eng-coder 写产品代码需活 designToken（§4 spawn 门禁同源——无活槽 → 拒，fail-closed）。

**F2 D5 冻结窗口（继承 v1 判据 + 来源改读）**：设计评审在途，被审文件集（设计档 + 批次档）零写入——写入即拒 / 本轮结算为陈旧（不发 token）。「在途」窗口下界 = 报告送达或取消·中止（**不是**子进程退出）；不读 M6 槽文件（槽签发于批准后，无法表达「在途」）。

**F3 评审目标来源（v2 核心增量）**：`resolveReviewTargetPaths(agent)`——读 manifest `docRoot`（缺 `docRoot` 键 → 默认值 fallback，与架构 §2.3 E2 同源），产出评审对象 / 被审文件绝对路径集合。
**按用点解析增量**（2026-10-02 · #828）：同单点新导出 `resolveReviewRootsFor(dir)`（判定本体 = `thincoder-core/agent-tools/review-facts.mjs`；`thincoder-core/agent/write-gate.mjs` 同名再出口）——按目标目录（其所属项目根——最近带档祖先）解析同一根集；M6 `thincoder-core/agent-tools/advisor.mjs` 逐文档所属项目腿消费（消费点 = `resolveReviewDocPaths`）；无主档回退会话根集判定（原行为零变）。
**路径归一增量**（2026-10-04 · #921 设计轮 · 批档 `docs/batches/2026-10-04-tool-path-baseline.md` §2）：documents 解析单源新导出 `resolveReviewDocPaths(documents, cwd)`（宿主 = `thincoder-core/agent-tools/review-facts.mjs`；零新模块边），逐文档四腿试探：
① 会话根集 ② 所属项目根集——两腿既有行为零变封装；③ 候选项目根试探（`projectRootView(cwd)` 候选）④ 歧义可读唯一化——裸仓相对形（cwd 基面落空）按候选项目归一受理；多候选可读命中 ≥2 ⇒ fail-closed 拒（`scope-doc-ambiguous`）；冻结窗 `docAbs` 产出面（advisor-async）同源。实施 = eng-coder 轮。
**锚祖先链增量**（2026-10-05 · #945 · 批档 `docs/batches/2026-10-05-review-face-gaps.md` §2.3）：腿③候选底座并入 **cwd 祖先链全量目录**（现行集在前 ∥ 祖先链随尾、去重保序）——容器相对形在子仓锚下受理；受理判据（目标解析位最近 manifest 声明面）∥ 围栏 ∥ 可读唯一化 ∥ fail-closed 歧义零改。实施 = eng-coder 轮。
**落点 = 新文件 `thincoder-core/agent/write-gate.mjs`**（不是 `dispatch.mjs`——落 dispatch 会让 M6 `advisor.mjs` 反向 import 门禁簇成回边；write-gate 无上游依赖，三向消费不成环）：`dispatch.mjs` / VSC `tool-gates.mjs` / M6 `advisor.mjs` 三向 import 消费（单一权威源，不重复实现）。
token 门与冻结窗口判据复用 v1 现有导出（`anyLiveDesignSlot` / `inflightDesignReviewConflict` / `validateDesignToken`——不改签名），「改读 docRoot」只落在评审目标来源一处。

**F4 写命令装配承接**：台账写命令落 M2（ledger 命令装配）、manifest 写命令落 M1（manifest 读写装配）——装配点非主 agent → 拒；本档只记录承接关系。

**AC-M4-5（修 ≠ 绕）**：继承 v1 单一权威分类（`loadProjectDeclaration`/`isCodePath` + 拒绝文案 hint/convNote）——分类与分流不一致时 token 门照拒（fail-closed），模型侧「停下上报」由该文案触发；**不新增独立谓词、零新增编辑点**（继承零改原则）。

**验收（回指 M4 规格 AC）**：

| # | 判据 |
|---|---|
| AC-M4-1 | 无活 token 写产品代码 → 拒 |
| AC-M4-2 | 冻结窗口内写被审文档 → 拒 / 结算为陈旧 |
| AC-M4-3 | 评审对象 / 被审文件路径读 `docRoot`（grep 硬编码 `docs/` → 零命中——范围 = 评审目标解析函数及其消费点） |
| AC-M4-4 | 台账 / manifest 写命令非主 agent → 拒（落点 M1/M2） |
| AC-M4-5 | 修 ≠ 绕：分流（变更面）与门禁不一致 → 停下上报（继承 v1 分类 + 拒绝文案触发） |

**边界（本增量不做）**：不做 token 签发（M6）；不做评审判据（advisor）；不重写 v1 门禁本体（继承 + 声明面微调）；不做语义写权判断（「谁写需求谁写设计」不可机判——落提示词层 + 互锁兜底）。

## 变更记录

**2026-10-0x 批次落点指针**（本档涉批——落点表 = 各批档 §2 · 一次性材料承载面）：
**本批（会话锚解析修复（多档并存支持） · 2026-10-02）落点表** = `docs/batches/2026-10-02-manifest-resolution-fix.md` §2（唯一承载面——一次性批次材料）。
**本批（design-token 回显链修复 · 2026-10-03）落点表** = `docs/batches/2026-10-03-design-token-echo.md` §2（唯一承载面——一次性批次材料）。
**本批（评审闸缺口 · 2026-10-05）落点表** = `docs/batches/2026-10-05-review-gate-gaps.md` §2（唯一承载面——一次性批次材料；#940 自 engine-face-gaps 批转出——L7 二度拆分产物）。

- 2026-10-07（**批 ledger-tool · 收口前指针重锚轮 · eng-designer**——父裁修正：消费核迁出随迁）：门禁过期拒删槽坐标 `:277` ⇒ `:237`（§4 ∥ §6.1 ∥ §6.3 三处——删段在前所致漂移）；§6.3 消费核 `:140` ⇒ `thincoder-core/agent-tools/design-slots.mjs:110`。**零语义改**。

- 2026-10-07（**文档清账批 · fix 轮 · eng-designer**——承批档 `docs/batches/2026-10-07-doc-cleanup.md` §2 · 台账 #953）：F3「路径归一增量」行删「write-gate 同名再出口保指针面」子句（现盘核：`write-gate.mjs` 对 `resolveReviewDocPaths` 零再出口——单源 = `review-facts.mjs`）；`:295` 同句随正。**零语义**。

- 2026-10-05（**批 review-gate-gaps · 收口随动末笔〔#37 上抛三项〕· eng-designer**——父裁：本轮内结清）：引用形收正〔明细 = 批档 §2.13〕——§9 两处（`resolveReviewRootsFor` 引用 → 判定本体 = `thincoder-core/agent-tools/review-facts.mjs` + write-gate 同名再出口；advisor.mjs 消费点 → `resolveReviewDocPaths`）∥ §6.3 恢复过滤边界 `:56-72` → `:57-75` ∥ §6.3 多槽原语行按符号拆分（`setSlotEngDesignTokens` 端侧定义 ∥ `mergeEngTokensForSave` 端侧转口 + 核定义）。**纯引用形收正，零语义改**。
- 2026-10-05（**批 review-gate-gaps · 收口随动轮〔#35 披露①〕· eng-designer**——父裁：属本轮随动面，落）：坐标收正〔明细 = 批档 §2.12〕——−2 族八处（§3 ∥ §5.1 ∥ §6.1）+ 复扫扩面（§6.3 五处同族 ∥ §4/§6.1 的 eng·cmd-eng·spawn ∥ §6.1 session 面迁 `session-lifecycle.mjs` ∥ §6.3 符号名面 `tokenExpiryMs`）。**纯坐标随动，零语义改**。
- 2026-10-05（**批 review-gate-gaps · 实施后坐标随动轮〔#31 披露项〕· eng-designer**——父裁：采纳 #31 披露项）：§5 / §5.1 / §5.2 / §6.1 实施后坐标随动（settleDesignReview `:115`⇒`:128` ∥ 未完成径 `:120-127`⇒`:133-140` ∥ 截断段 `:130-132`⇒`:143-145` ∥ 非回显径 return `:133-136`⇒`:146-149` ∥ 入槽 `:138`⇒`:158`）。**纯坐标随动，零语义改**。
- 2026-10-05（**评审闸缺口批（review-gate-gaps）· fix 轮 #27〔评审 #25 轮 2 收正〕· eng-designer**——父裁：发现 1、3、4、5、6、7 采纳；2 = 父侧收口协调项）：§5.2「行形容忍边界」按方向拆分（误引 changes-required ⇒ 拒 ∥ 误引独立 pass ⇒ 可能放行——残余声明随补）；§5.1① 补签发合取指针；**零机制语义改**（形式面：方向拆分 ∥ 指针 ∥ 残余登记）。
- 2026-10-05（**评审闸缺口批（review-gate-gaps）· fix 轮 #23〔评审 #21 收正〕· eng-designer**——父裁号 1–6 采纳 ∥ 7 归实施轮 ∥ 8 父侧笔）：§5 题名 / echo 行 / 生命周期表「评审通过」行收正为合取口径（补 §5.2 指针）；§5.2 边界补残余声明（红项计数不入机械判据——以裁定行代理）；规范面 corpse 标记三处清为现态正面陈述（HMAC 括注 · echo 行「单值镜像」句 · §6.3 差异①——史实留 §8.1 / 变更记录）。**零机制语义改**（收正 / 补句 / 清理）。
- 2026-10-05（**批 review-gate-gaps · 设计轮 · eng-designer**——承 `docs/batches/2026-10-05-review-gate-gaps.md`（L7 二度拆分产物——#940 自 engine-face-gaps 批转出）· 台账 #940）：新增 §5.2「裁定闸」（VERDICT 机械闸——裁定行两源钉字 ∥ 判据两式 + 实现形逐字 ∥ 判定三值〔changes 优先；缺行拒〕∥ 拒签三效果 ∥ 恒定标记逐字 ∥ 与 #884 并存声明 ∥ `buildDesignApprovalBlock` 随句）；§5.2 批指针 = review-gate-gaps（随转后 owner）；§6.1 补行；§7 补 D-E10。实施 = 该批实施轮；② 串台面裁 = 缓（批档 §2.6）。
- 2026-10-04（**design-token 回显链缺陷修批 · 收口轮 · 父侧直接执行**——#53 实施后行随动）：§5/§6.1 实施后坐标收正（settleDesignReview `:82`⇒`:115` ∥ 未完成径 `:86-94`⇒`:120-127` ∥ D1 径 `:179-181`⇒`:179-180` ∥ stale 径 `:214-216`⇒`:212-213`）。**纯坐标随动，零语义改**；标记 = 父侧直接执行（可 revert）。

- 2026-10-04（**design-token 回显链缺陷修批 · fix 轮 3〔评审 #47 收正〕· eng-designer**——父裁号 1–6 ∥ 8 折入）：§5.1④ 枚举扩至三档（messages.mjs + 评审员系统提示两源〔EN `thincoder-core/prompts/advisor-design.md:24` ∥ CN `docs/core/design/prompts/advisor-design.md:55`——同文口径〕）；§5.1③ 补 D1 落盘失败径标记注记（只剥净、不追 M2）；§5.1④ 实施序注收正为现态（#28 已落地）；头注辖域分工收正（结算判定语义 = §5）+ 相邻档已核（2026-10-04——无回显规则重述）。

- 2026-10-03（**design-token 回显链缺陷修批 · fix 轮 · eng-designer**——同族第三处折入〔父裁「修」〕）：§5.1 ③ 剥离单源枚举补 D1 落盘失败径（`thincoder-core/agent-tools/advisor-settle.mjs:179-181`——pass 后落盘失败按原文重建，残片同须剥净）；§6.1 行随动。**边界**：零语义外扩（判断 / 标记 / 槽存储 / 既有分支零改）。

- 2026-10-03（**design-token 回显链缺陷修批 · fix 轮 · eng-designer**——U1 折入）：§5.1 ③ 剥离单源扩至未完成径（`design-token.mjs:86-94`）∥ stale 径（`advisor-settle.mjs:214-216`）；§6.1 行随动；§5.1 依据补指 FR8（需求档 `docs/core/requirements/ENG-TOKEN-BINDING.md:32`）。**边界**：零语义外扩（除剥净面）；实施待 #28。

- 2026-10-03（**design-token 回显链缺陷修批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-03-design-token-echo.md` §1 · 台账 #884）：§5 扩展 + 新增 §5.1「回显链判定」（截断回显容忍——uuid 形认 pass、槽存全串；恒定标记二则逐字〔未签发 ∥ 截断〕；剥离单源 `stripDesignTokenEcho` + `makeDesignTokenPrefixRegex`；标记位置不变式〔suffix 恒居文末〕；回显指令加固句逐字）；§6.1 表增一行；§7 增 D-E8 / D-E9。**边界**：token 格式 ∥ TTL ∥ 门禁恒等比对语义 ∥ 「非回显 ≠ 通过」本体零改。

- 2026-10-04（**工具路径基面根治批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-tool-path-baseline.md` §2 · 台账 #921）：§9 F3 加「路径归一增量」——documents 解析单源 `resolveReviewDocPaths`（宿主 `review-facts.mjs`）+ 冻结窗 docAbs 同源。实施 = eng-coder 轮。

- 2026-10-02（**会话锚解析修复批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-manifest-resolution-fix.md` §1 · 台账 #828 · 轮七回执③）：§9 F3 文面加同单点新导出 `resolveReviewRootsFor`（按用点解析增量——`write-gate.mjs:59` ∥ 消费腿 `thincoder-core/agent-tools/advisor.mjs:125` → `:129`）。**判据语义零改**（登记面 / 文面对账）。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 · 台账 #378）：§6.3 VSC 侧差异 ① 行坐标微漂收正（现体 = `thincoder-vscode/src/agent/setup-tooltable.mjs:85-94`——该档头注净增一行后重锚）。**零新语义**。

- 2026-09-28（**文档回填与卫生轮**（台账 #516 · #378 面）· eng-designer）：§6.3 VSC 侧差异 ① 行按现盘收正——「会话槽 + config.json mirror」⇒「**会话槽单点**（镜像双写已退役）」（现体 = `thincoder-vscode/src/agent/setup-tooltable.mjs:88-97`）。**零新语义**。

- 2026-09-27（**conventions.json 退役批 · 扫尾** · eng-designer——承 `docs/batches/2026-09-27-conventions-retire.md` §3 轮次 2 发现 1）：§9 AC-M4-5 符号名随本批改名收正（`loadConventions` ⇒ `loadProjectDeclaration`）；零语义。

- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M4 模块设计语义融合——新增 §9 写权门禁（token 门继承 + D5 冻结窗口 + `resolveReviewTargetPaths` 读 `docRoot` 落 `write-gate.mjs` + F4 承接 + AC-M4 验收）；§12 映射核正（WRITE.md 为 write 工具语义档，写权门禁归本档）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` 归档 `_archive/modules/`。

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/ENG-TOKEN-BINDING.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；**旧档 §4 结算语义 / §5 实现落点两处口径按现状收正**（单值镜像已退役 → 见 `DESIGN-TOKEN-SETTLEMENT.md`；签发/校验/结算宿主 = `agent-tools/design-token.mjs`；`src/**` 迁移前坐标 → 现状路径），旧句逐条登记入 §8.1；坐标全量实核；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §6.3 VSC 端接线——自 `thincoder-vscode/docs/_archive/design/ENG-TOKEN-BINDING-TUNING.md` 并入（TTL / 解析 / 过期判定 / 门禁族 / 持久化逐项实核；结算面指回 `DESIGN-TOKEN-SETTLEMENT.md` §6.3——D2）；VSC 旧档重复面与批次材料登 §8.2 不并（(d) 类）；需求侧头注随批 5 建档收正。
- 2026-09-15（**W16 实施轮 · eng-coder · 接线面收正**）：§6.3 表换「实核 · W16 接线面收正」版——TTL/签发/解析/validate/回显匹配/门禁族全部收为核面坐标
  （`thincoder-core/agent-tools/design-token.mjs` · `thincoder-core/token-ttl.mjs` · `thincoder-core/agent-tools/subagent-spawn.mjs` · `thincoder-core/agent-tools/eng.mjs`）；
  恢复过滤/内存运行态/多槽原语 = 端壳存活档行号重核（`thincoder-vscode/src/agent/agent-state.mjs:56-72` · `thincoder-vscode/src/agent/setup.mjs:304` / `:491` · `thincoder-vscode/src/extension/session-slot-write.mjs:23`）；
  侧差异① mirror 行改指现体 `configureEngMirror`；§9 行数重核。
