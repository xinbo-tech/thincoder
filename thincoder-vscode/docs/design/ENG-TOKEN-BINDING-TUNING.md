# Design Token 硬化 — 设计（VS Code 扩展）

> 状态：**已实现**（v2 + R16——2026-08-25 / 2026-09-06）。
> 需求：`docs/requirements/ENG-TOKEN-BINDING.md`。
> 说明：与 CLI 端 `ENG-TOKEN-BINDING-TUNING.md` 同源——**语义两端 lockstep**（流程凭证 /
> 无签名 / 跨模式存活 / 仅 TTL 过期清 / slot 权威持久源）；VSC 端模块落点与持久化面独立
> （slot 经 `session-io`/`setSlotEngDesignTokens` 多槽写，非 CLI 单源 persistState 布局）。

## 1. designToken 是什么

**流程凭证**——"你评审过了吗？评过才给 token，才能 spawn eng-coder"。它是**防 agent 跳过
评审步骤**的机制，**不是防人/防仿冒的密码学安全边界**。

**三条铁律（现行——R16 修订后定稿）**：

1. **语义 = 流程凭证，非安全边界**。HMAC/加密因子/签名是 **security theater**——agent 只要
   看到因子就能仿冒生成，但那**无所谓**（机制目标不是密码学安全，是流程门）。token 格式 =
   `uuid:expiresAt`，**只有格式校验 + TTL，无签名**（2026-09-01 曾加 HMAC——用户裁定删除）。
2. **生命周期 = 会话级流程凭证，跨模式存活（R16 修订）**。token 绑定会话、随模式存活：
   **ON→OFF 不清、OFF→ON 不重评**（TTL 内上次评审 token 继续有效）。**仅 TTL 过期清**，
   三个时机：① 恢复过滤（重启/恢复读回前逐槽校验，过期丢弃）；② 开工程模式清过期（eng
   enter 真 off→on 转换路径，遍历 Map 删过期，有效保留）；③ spawn 门禁过期拒时顺手删该
   designId 槽（长跑不重启也清）。**会话切换（/new）仍清**——会话切换不是模式切换。
3. **单一数据源 = 会话 slot 权威持久源 + 内存运行态（R16 修订）**。slot 持久化是**跨重启/
   跨模式恢复的有意载体**，不是 bug；内存是运行态。一致性经恢复 TTL 过滤 + 键存在性写语义
   保证——不得造成内存/文件双源不一致（2026-09-06 曾实况：内存 2 个 / slot 3 个——root
   cause 是面板 key-presence merge 复活通道，已随 R16 键存在性写消除）。

**防误用纪律（违反即 bug）**：不加 HMAC/内容绑定；spawn 时从内存 Map 定位而非自行签发。
**§2 明确不做不变**。

## 2. 明确不做（v1 考古，勿重试）

- **内容绑定全套**（normalizeForHash / 头部簿记剥离 / hashDocuments / docKey 映射 / 交集作废
  / 路径归一化）——用户实况否决：批次间文档必然变更，内容绑定会把"偶尔重评"变成"每批必重评"
  （收益反转）。
- TOKEN_SECRET 随机化、eng(enter) 用户同意门仍留 TODO（2026-09-06 记）。

## 3. TTL 与 token 格式

- 默认 TTL **7 天**（`TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000`，`src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）`）。
- 配置覆盖：`agent.engTokenTtlMs`——运行期校验（`Number.isFinite(cfg) && cfg > 0`，非法回退
  默认）——照抄 advisor timeoutMs 口径（`effectiveTokenTtlMs`）。
- 格式：`${uuid}:${expiresAt}`，uuid 为 `[0-9a-f]{8}-…-{12}`，expiresAt 为数字毫秒时间戳。
- 过期判定**只对格式合法的 token**判过期：格式/畸形串不在此清理（恢复时读回由门禁格式拒、
  门禁拒时也不删槽——防误删有效槽）。
- 判定集中 `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）`：
  - `tokenExpiry（W12 已迁核——现体见批次档 §5）(token)` — 单一解析源，`parts.length !== 2` / uuid 空 / `isNaN(exp)` 全返回
    null（fail-closed；旧 3 段签名 token `uuid:expiresAt:HMAC` 现为格式错——一次性失效）。
  - `isExpiredDesignToken(token)` — 仅对格式合法者判 `Date.now() > exp`；畸形串不算 expired。
  - `validateDesignToken(token)` — `tokenExpiry（W12 已迁核——现体见批次档 §5）(token) !== null && !isExpiredDesignToken(token)`
    ——fail-closed。
  - `generateDesignToken(agent)` — 无签名 `uuid:expiresAt`（HMAC 层删除后）。
  - `makeDesignTokenRegex(token)` — 转义整 token 构造回显匹配（UUID 段单独匹配永不可能命中，
    评审通过即无法登记）。

## 4. 生命周期（现行——R16 定稿）

| 事件 | 行为 |
|---|---|
| 评审通过 | token 签发入槽——评审前生成并注入评审 prompt，advisor 仅通过时回显（echo）；回显匹配（`makeDesignTokenRegex`）才 `_engDesignTokens.set(designId, token)` + 单槽镜像，回包追加 Approved 后缀 |
| ON→OFF | **不清**——token 保留（有效 token 跨模式存活） |
| OFF→ON | **不重评**——上次评审 token 继续有效（TTL 内）；eng enter 真 off→on 转换路径清**过期** token（有效保留） |
| 重启/恢复 | **TTL 过滤**——过期不读回内存（丢弃，下次 save 自然清字段）；有效跨重启存活 |
| 开工程模式 | 清**过期** token（有效保留）——eng enter 真 off→on 转换路径 |
| spawn 门禁 | `authorizeEngCoderDesignToken` 过期拒 + **顺手删该 designId 槽**（仅过期拒删；mismatch/格式拒不删） |
| 会话切换（/new） | 清 token（resetSessionState）——会话切换不是模式切换 |
| TTL | 7 天默认（可配），fail-closed 不变 |

**结算语义**：token echo 即裁决——advisor 仅在通过时回显 token。echo → 入槽（designId 键 +
单值镜像 + eng-coder 门禁标志）；非 echo → 剥离 token 文本返回 findings，**槽不动**（失败的
重评不作废任何既有槽）。错误回包 / abort / 轮次耗尽不作废；`result===null` 守卫保留。通过复审
（sync 同 scope 复审 / async 续跑）沿用既有 designId——覆写同 id 槽（旧 token 门禁拒）。

## 5. 实现落点（VSC 端受影响模块）

| 模块 | 内容 |
|---|---|
| `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）` | TTL 常量 + `effectiveTokenTtlMs`（可配校验）/ `generateDesignToken` / `tokenExpiry（W12 已迁核——现体见批次档 §5）` / `isExpiredDesignToken` / `validateDesignToken` / `makeDesignTokenRegex` / `buildApprovedSuffix`+`stripApprovedSuffix` / sync 签发判定（echo 匹配 → 入槽 + 后缀） |
| `src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）` | async 评审（§9 D-24b）settle 面——launch 时登记 scope→designId、续跑现铸同 id token；通过判定 echo 匹配 → 入槽 + `buildApprovedSuffix`；非 echo 剥离返回；错误回包/取消不清槽 |
| `src/agent-tools/eng.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/eng.mjs`） | enter 幂等（already-on 纯 no-op，不清 token）；真 off→on 转换路径 `purgeExpiredDesignTokens`（核内名；原镜像名 sweepExpiredDesignTokens——仅删过期，文案含清理个数）；exit 不清 token；slot + config.json 双持久化（config 为 mirror） |
| `src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）` | 门禁族：`resolveDesignSlot`（designId 精确槽 / 单槽 / 多槽拒 / torn-state 拒）/ `dropExpiredTokenSlot`（仅过期拒删）/ `authorizeEngCoderDesignToken` / `executeConsumeDesignAction`（chain 终消费） |
| `src/agent/setup.mjs` | 恢复过滤（`isExpiredDesignToken` 逐槽校验，过期丢弃）+ 镜像同步不变量（过期镜像不落 null 而重指存活槽——防 torn-state） |
| `src/extension/panel-session.mjs` | 键存在性写：`engDesignToken`/`engDesignTokens` 字段"键在 extra → 取 extra；缺键 → 保 slot"——显式 null 不再被 `??` 跳过（复活陷阱修复）；过期槽经恢复丢弃后下一次 turn-end agentState 带显式 null 钉清 slot 字段 |
| `src/extension/session-io.mjs` + `session-slot-write.mjs` | `setSlotEngDesignTokens(cwd, slot, tokensObj, mirror)` — 会话 slot 持久面多槽 `{designId: token}` 写（null → 删字段；mirror 显式置） |
| `src/agent-tools/subagent.mjs` | spawn 时 `authorizeEngCoderDesignToken(parent, designId, designToken)` 门禁调用（执行器已抽至 subagent-spawn-gate） |
| `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）` / `messages.mjs` | 评审运行注入 designToken 到 prompt / Approved 回显块 |

## 6. 验收标准（Acceptance Criteria）

| AC | 标准 |
|---|---|
| AC1 | mock 时钟过 1h/3 天、未过 7 天 → token 有效（原始痛点） |
| AC2 | 过 7 天 → 拒（expired 判定） |
| AC3 | 畸形 token（段数≠2 / 非 uuid / 非数值 expiresAt）→ 拒 |
| AC4 | `engTokenTtlMs` 0 / -1 / "abc" → 回退 7 天默认 |
| AC5 | error 回包 → token 存活；完整失败评审 → 作废 |
| AC6 | engineering 已 on 再 enter → token 不清 |
| AC7 | R16：有效 token 跨 OFF→ON 存活（spawn 可用） |
| AC8 | R16：过期 token 恢复时丢弃（mock 时钟/构造过期串） |
| AC9 | R16：eng enter 清过期保留有效（Map 混合态） |
| AC10 | R16：门禁过期拒时删槽（spawn 过期 → Map 无该 designId） |
| AC11 | R16：TTL fail-closed 语义零回归（既有用例不变） |

## 变更记录

- 2026-08-25：v2 立项（安全修复 + TTL 放宽——四分支 fail-closed、eng exit 清空语义、
  advisor 生成挪入 pass 分支的早期措辞，后按 echo 判定落地）。v1「内容绑定」被否决
  （见 REQUIREMENTS 变更记录）。
- 2026-09-06（R16）：token 生命周期语义修订——铁律 2/3（"内存级随会话死亡 / 单一数据源=内存"
  → 按用户裁定修订为现行态 §1/§4）。双源 bug 修复设计确认非 bug（双源验证代码自洽），不实施。
  HMAC 防伪层删除（design-token 无签名）。
- 2026-09-08：本文档重写为人类可读当前态（折叠逐轮评审流水；漂移修正——旧 v2 HMAC 语义更新
  为现行 R16 无签名语义，活约束照抄，模块落点按 VSC 现状）。
