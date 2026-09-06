# Design Token 硬化 — 设计（CLI）

> 状态：待实施（2026-08-25，v2 范围收窄）
> **Superseded 考古**：本文件 v1 是"内容绑定"方案（token 有效性绑定设计文档 hash + 7 天 TTL + 映射化），经三轮会诊打磨后被用户实况否决——工程模式每轮开发都有文档缺口要补正，批次间文档必然变更，内容绑定会把"偶尔重评"变成"每批必重评"（收益反转）。v1 全文及三轮会诊记录见 git 历史。v2 只保留与文档变更无关的安全修复 + TTL 放宽。

## 0. 设计语义（2026-09-06 用户裁定——防 agent 自我发挥瞎改）

**designToken 是什么**：**流程凭证**——"你评审过了吗？评过才给 token，才能 spawn eng-coder"。它是**防 agent 跳过评审步骤**的机制，**不是防人/防仿冒的密码学安全边界**。

**三条铁律（任何实现不得违反）**：

1. **语义 = 流程凭证，非安全边界**：HMAC/加密因子/签名是 **security theater**——agent 只要看到因子就能仿冒生成，但那**无所谓**（机制目标不是密码学安全，是流程门）。任何"防仿冒"的密码学层都是**过度设计**，agent 不得自我发挥添加（2026-09-01 曾加 HMAC——用户裁定删除，见 v1 考古）。token 格式 = `uuid:expiresAt`，**只有格式校验 + TTL**，无签名。

2. **生命周期 = 内存级，随会话/模式死亡**：`_engDesignTokens` 是**进程级内存态**——**重启/工程模式切换（eng enter/exit）就丢**（resetSessionState/eng.mjs 清空是**设计意图**，不是 bug）。**不得持久化到 slot 文件**（saveSession 不写入 `_engDesignTokens`——持久化会造成**内存/文件双源不一致**（2026-09-06 实况：内存 2 个 / slot 3 个））。重启后已批准设计**必须重新评审**（不能假设 token 跨进程存在——与 R5 重启感知同族）。

3. **单一数据源 = 内存**：token 的唯一权威是**当前进程的内存 Map**——spawn 时查内存 Map，**不从 slot 恢复**（恢复逻辑删除）。slot 文件不得含 `engDesignTokens`/`engDesignToken` 字段（存量兼容：旧 slot 的字段读入即丢弃）。

**违反这三条的实现 = bug**（如持久化到 slot、加 HMAC、从 slot 恢复 token——**注：示例中"持久化到 slot/从 slot 恢复"已随 R16 铁律 2/3 修订作废（2026-09-06——见下 supersede 注 + §5）——活禁令示例仅余 HMAC/内容绑定**）。

> **Supersede 注（2026-09-06 R16 用户裁定——铁律 2/3 修订——权威见 §5）**：铁律 2/3（不得持久化/单一数据源=内存/重启·模式切换即丢）按 R16 修订——**slot 持久化 = 跨重启/跨模式恢复的有意载体**（双源验证 2026-09-06 已确认代码自洽）；**token 跨模式存活（ON→OFF 不清/OFF→ON 不重评）——仅 TTL 过期清**（三时机：恢复过滤/enter 清过期/spawn 拒删槽）；单一数据源语义 = 会话 slot 权威持久源 + 内存运行态。防误用纪律保留（不加 HMAC/内容绑定——§2 明确不做不变——铁律 1 不变）。

## 1. 改动清单（两端同构，除标注外）

| # | 文件 | 改动 |
|---|---|---|
| 1 | src/agent-tools/advisor.mjs | ① TTL 常量 3600000 → 7 天默认，运行期读 agent.config.agent.engTokenTtlMs（校验同 timeoutMs 先例）；② 删 :30-33 段数!=3 放行与 :39-42 isNaN 放行两个后门，改四分支 fail-closed（过期文案含 "design token expired, re-run advisor(type='design')"）；③ token 生成挪进 pass 分支（不再预嵌 prompt——pass 后在返回文本追加 token 行，签发以代码判定为准，prompt echo 要求是评审者输出纪律）；④ 作废收窄：error 回包（以 "Advisor:" 开头，现有错误回包约定）不作废，仅完整评审未通过作废；result===null 守卫保留 |
| 2 | src/agent-tools/eng.mjs（两端） | enter 幂等：已是 engineering 时 return "Engineering mode already active."（不清 token）；off→on 清空保留 |
| 3 | vscode src/extension/panel-session.mjs:73 | engDesignToken 行改键存在性判断（"engDesignToken" in extra ? extra.engDesignToken : existing.engDesignToken ?? null）——显式 null 不再被 ?? 跳过 |
| 4 | test/advisor.test.mjs（两端） | ① TTL 内 mock 过 1h+ 验证有效；② 过 7 天拒（文案）；③ 段数/NaN/错签名拒；④ ttlMs 非法回退；⑤ error 回包不作废、完整失败作废 |
| 5 | test/subagent.test.mjs（两端） | 合法过 / 过期拒（文案区分） |
| 6 | vscode test/chat-panel.test.mjs | 复活回归：eng(exit) → saveSession → loadSession → token 仍 null（现码必红，修复后绿） |

## 2. 明确不做（v1 考古，勿重试）

内容绑定全套（normalizeForHash/头部簿记剥离/hashDocuments/docKey 映射/交集作废/路径归一化）——用户实况否决（批次间文档必然变更）。TOKEN_SECRET 随机化、eng(enter) 用户同意门仍留 TODO。

## 3. 验收标准

| AC | 标准 |
|---|---|
| AC1 | mock 时钟过 1h/3 天、未过 7 天 → token 有效（原始痛点） |
| AC2 | 过 7 天 → 拒，文案含 design token expired |
| AC3 | "abc:notanumber:x"（NaN 后门）/ 4 段 / 错签名 → 拒 |
| AC4 | engTokenTtlMs 0/-1/"abc" → 回退 7 天默认 |
| AC5 | error 回包 → token 存活；完整失败评审 → 作废 |
| AC6 | engineering 已 on 再 enter → token 不清 |
| AC7 | vscode exit→save→load → token 为 null（复活回归） |
| AC8 | 两端全套测试通过 |

## 4. 双源 bug 代码同步修复（2026-09-06 · 用户实测 VS Code 端复现——交接 TODO L18 落地）

> 状态：**已关闭（2026-09-06 17:16/17:23 验证通过——重启加载最新代码后重评审（d78711ff）→ 立即 spawn 成功——失步假象确认（前台旧代码 vs 后台新逻辑，重启后一致）——双源非 bug——本段修复设计不实施——双源设计保留：slot 持久化 = 跨重启会话恢复设计意图，配合"重启后 token 失效需重评审"语义自洽——**R16（2026-09-06）修订此句：有效 token TTL 内跨重启存活（见 §5）**）**。TODO L18/L19 已由并行验证会话勾销（记录见 TODO「designToken 验证收尾」组）；§0 铁律 2/3 与实测的张力已在 TODO L19 转为观察项（防 agent 自我发挥加 HMAC/误持久化的纪律保留），留待 R10 config 原子性批或会话批统一裁决——**R16 即该裁决（2026-09-06——§0 supersede 注已落）**。
> **本段正文（F-DS/D-DS/T-DS/AC-DS——2026-09-06 17:00 前后双源修复设计——评审修正 #3 标注）**：位于文末的 F-DS/D-DS/T-DS 块属本段已关闭内容——**不实施**——勿作为任何实现依据（其"slot 不含两字段"等指令与 §5 R16 持久化语义相反）。
## 5. token 生命周期语义修订（2026-09-06 · 用户裁定——R16 需求登记）

> 状态：**已批准待实现（2026-09-06——评审 round1 1🔴+3🟡+2🔵——处置 6 项全采纳（用户"全采纳"）——修正已落（§0 原位 supersede 注/REQUIREMENTS 同步/残留块标注/§5.1 受影响文件补）——待实现（实现批同三合一收尾或独立小批——designToken 生命周期批）**。

**新裁定（用户原话）**："我认为ON->OFF不需要清，OFF->ON,上次评审过的不需要重复评审。" + "TTL到期以后的designToken…至少重新启动程序或者打开工程模式的时候应该清理"。

**语义变化**：token 从"工程模式内凭证"（开关即死——eng.mjs L53-54 off→on 必清 + cmd-eng OFF 清空）→ **"评审通过凭证"**（绑定会话、跨模式存活、TTL 内有效——评审贵的产物不因开关/重启重复烧）。

**新生命周期**：

| 事件 | 行为 |
|---|---|
| 评审通过 | token 签发入槽（不变） |
| ON→OFF | **不清**——token 保留（现 eng.mjs L25-26/53-54 + cmd-eng L51-52 清空逻辑删/改"仅过期清"） |
| OFF→ON | **不重评**——上次评审 token 继续有效（TTL 内——现"off→on requires fresh review"废弃） |
| 重启恢复 | **TTL 过滤**——过期不读回内存（applySession 校验——清盘闭环：丢弃后下次 save 自然清字段）；有效跨重启存活（既有持久化语义） |
| 开工程模式 | 清**过期** token（有效保留） |
| spawn 门禁 | validateDesignToken 过期拒 + **顺手删该 designId 槽**（长跑不重启也清） |
| TTL | 7 天不变（fail-closed 不变） |

**测试反转清单**（锁旧语义的断言）：session-eng-advisor "eng(exit) clears"、eng-session T-AC7（exit→save→load → token null）、eng.mjs 相关（enter 清空/幂等 AC6 语义调整）。

**§0 铁律 2/3 supersede 注**：铁律 2/3（"不得持久化/单一数据源=内存"——2026-09-06 早间裁定）按本裁定修订——**slot 持久化 = 跨重启/跨模式恢复的有意载体**（双源验证已确认代码自洽）；单一数据源语义 = 会话 slot 权威持久源 + 内存运行态（一致性经既有 mtime 门控/清空语义保证）。防误用纪律保留（不加 HMAC/内容绑定——§2 明确不做不变）。

### 5.1 设计（2026-09-06 · R16 设计层——双端）

> 状态：**已批准待实现（2026-09-06——评审 round1 1🔴+3🟡+2🔵 处置全采纳——round2 复审 0🔴 通过（token 64ec4747…/designId efbfb42b）——修正已落——待实现（designToken 生命周期批））**。

**需求（F-R16）**：
- **F-R16a（跨模式存活——用户裁定）**：ON→OFF 不清 token；OFF→ON 不重评（TTL 内上次评审 token 继续有效）——现"off→on requires fresh design review"（CLI/VS eng.mjs off→on 全清）废弃。
- **F-R16b（TTL 清理三时机——用户裁定"至少重启程序或打开工程模式时清理"）**：①**重启/恢复过滤**——恢复路径（CLI applySession L318-326 / VS setup.mjs L230-236）TTL 校验——过期 token 不读回内存（丢弃——下次 save 自然清盘）；②**开模式清过期**——eng enter（CLI agent-tools/eng.mjs + cmd-eng ON 路径 / VS eng.mjs）遍历 Map 删过期（有效保留）；③**spawn 门禁拒时删槽**——validateDesignToken 过期拒（subagent-spawn L187）→ resolveDesignSlot 顺手删该 designId（长跑不重启也清）。
- **F-R16c（既有语义不变）**：TTL 7 天 fail-closed 不变；幂等 enter（already-on 不清有效 token）不变；§2 明确不做不变（HMAC/内容绑定）。

**设计（D-R16）**：
- **D-R16a（跨模式存活——评审修正 #4 补 payload 枚举）**：CLI `agent-tools/eng.mjs` + `tui/cmd-eng.mjs` + VS `agent-tools/eng.mjs`：删 off→on/exit/OFF 全清逻辑（CLI eng.mjs L25-26/L53-54 + cmd-eng L51-52）——token 仅在过期时清（三时机）；**同时删/改 persistState payload 的显式 null（eng.mjs exit payload `engDesignToken: null` L37 + enter payload L62——否则 exit→persist→退出→重启丢有效 token——正好砸 OFF→重启路径）**；`_engDesignTokens` 随会话存活（跨模式——resetSessionState 的 /new 语义仍清——会话切换不是模式切换）。
- **D-R16b（TTL 纯函数）**：过期判定复用 `validateDesignToken` 语义——核对导入方向（session/setup ← advisor 若成环——抽 TTL 纯函数至共享模块（如 `src/token-ttl.mjs`——advisor/subagent-spawn/session 共引——实现批定，报告说明）。
- **D-R16c（三清理时机落点——评审修正 #5/#6 细化）**：①恢复路径读回前逐槽校验（过期跳过——Map 只装有效——仅**过期**丢弃——格式/畸形串读回后由门禁拒——不主动删）②eng enter 遍历删过期（返回文案含"清 N 个过期 token"——**过期清理跑在真实 off→on 转换分支（用户"打开工程模式时"语义）——already-on 幂等分支保持纯 no-op——T-R16c 前置条件：先 off→on**）③spawn 门禁拒分支**仅过期拒** delete designId + 单槽镜像同步（mismatch/格式拒不删——防误删有效槽——T-R16d 钉）。
- **D-R16d（测试反转——锁旧语义清单）**：CLI `session-eng-advisor.test.mjs`（eng(exit) clears 系）+ VS `eng-session.test.mjs`（T-AC7 exit→save→load token null / L299-325 pin-null 系）+ `advisor-eng.test.mjs` 相关（enter 幂等 AC6 语义核对）——反转：exit/OFF 后 token 保留、save→load 往返仍有效（TTL 内）、enter 只清过期。
- **D-R16e（新用例）**：T-R16a 有效 token 跨 OFF→ON 存活（spawn 可用）；T-R16b 过期 token 恢复时丢弃（mock 时钟/构造过期串）；T-R16c eng enter 清过期保留有效（Map 混合态）；T-R16d 门禁拒时删槽（spawn 过期 → Map 无该 designId）；T-R16e 零回归（TTL fail-closed 既有用例不变）。

**验收（AC-R16）**：AC-R16a = T-R16a 绿（跨模式存活——spawn 可用——原测试反转）；AC-R16b = T-R16b/c/d 绿（三清理时机——过期零残留）；AC-R16c = 双端全量回归绿（TTL fail-closed 语义零回归）。

**受影响文件**：CLI `src/agent-tools/eng.mjs`（清空 + payload）+ `src/tui/cmd-eng.mjs` + `src/session.mjs`（applySession 恢复过滤）+ `src/agent-tools/subagent-spawn.mjs`（门禁过期拒删槽）+ 可能新 TTL 纯函数模块 + `src/prompts/system.md`（env-state resumed 指引 token 豁免句——评审 #2）+ 测试（session-eng-advisor/advisor-eng/subagent-tool/session-endmarker）；VS Code `src/agent-tools/eng.mjs` + `src/agent/setup.mjs`（恢复过滤）+ `src/agent/run-helpers.mjs`（写面确认）+ 镜像测试；**文档同步（评审 #1——本批已落）**：本文件 §0 原位 supersede 注（已落 ✅）+ §0 L18 示例标注（已落 ✅）+ §4 残留块标注（已落 ✅）+ §5.1 状态行翻转（已落 ✅）+ `ENG-TOKEN-BINDING-REQUIREMENTS.md` 头部/FR5（已落 ✅）+ `docs/design/README.md` 地图 changelog 行（已落 ✅）；**实现批落**：SESSION.md §11.1（env-state 行 token 豁免）+ ENGINEERING-MODE.md 清理对称触点行 touch-up + 本文件 §5/§5.1 实现后状态翻转 + CHANGELOG（父侧）。

**背景**（读码实证 2026-09-06）：§0 铁律 2/3 已立（2026-09-06 用户裁定 + 文档强化），但**两端代码未同步**——持久化双源仍在：

- **CLI**：`src/session.mjs` L132-138 无条件写入 `engDesignToken`/`engDesignTokens` 两字段进 slot；L318-326 从 slot 恢复 Map——内存清空后旧 slot 值可回灌。
- **VS Code**：`src/agent/run-helpers.mjs` L228-234 写（agentState 序列化）；`src/agent/setup.mjs` L230-234 恢复；`src/extension/panel-chat.mjs` L189-190 从 sessionData 读字段喂 agent；**`src/extension/panel-session.mjs` L102-106 key-presence merge——"save 不带字段时保留 existing 值"= 幽灵复活主通道**（eng exit 清内存 → 某次 save 不带字段 → merge 留旧值 → 下次恢复复活——用户实测场景）。

**需求（F-DS）**：

- **F-DS1**：两端 slot 序列化**不再写** `engDesignTokens`/`engDesignToken` 字段（§0 铁律 2——内存级随会话死亡）。
- **F-DS2**：两端恢复路径**不再读**两字段——旧 slot 存量字段读入即丢弃（不报错、不复活、不迁移）。
- **F-DS3**：VS Code panel 层字段往返与 key-presence merge 保留逻辑删除（复活通道闭环）。
- **NF-DS1**：`engineering` 布尔状态本身仍持久化（会话级设置，非 token）——只删 token 两字段。
- **NF-DS2**：重启/面板 reload 后已批准 token 随内存死亡 → 重新评审（§0 语义 + 与 R5 重启感知同族——行为变化即设计意图）。

**设计（D-DS）**：

- **D-DS1（CLI `src/session.mjs`）**：删 L132-138 写段（`engDesignToken`/`engDesignTokens` 行 + 注释）；删 L318-326 读段（恢复 + legacy 分支）——恢复后 `_engDesignTokens` 保持 reset 态（undefined/空 Map 由 agent 构造处决定——与 eng.mjs/resetSessionState 清空一致）。
- **D-DS2（VS Code `src/agent/run-helpers.mjs`）**：删 L228-234 写段；**`src/agent/setup.mjs`** 删 L230-234 恢复段（engState 字段存在时忽略）；**`src/extension/panel-chat.mjs`** 删 L189-190 字段传递；**`src/extension/panel-session.mjs`** 删 L102-106 merge 保留逻辑（两字段不再存在于 extra/existing 读写面）。
- **D-DS3（测试反转——锁双源行为的用例改写）**：CLI `test/session-eng-advisor.test.mjs:164` describe「multi-slot token serialization round-trip (audit #1)」→ 反转：save 后 slot 文件**不含**两字段；apply 恢复后 Map **不存在/空**（零持久化断言——与 §0 "重启必重评"语义一致）；VS Code `test/eng-session.test.mjs:229` 同 describe → 同反转 + key-presence pin-null 用例（L299-325）退役（字段根本不存在，pin 无对象）。
- **D-DS4（存量兼容验证）**：构造含旧字段的 slot 文件 → 加载不崩、不复活、字段被忽略——保留一条兼容用例（防恢复逻辑复活时误伤）。

**测试（T-DS）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-DS1 | N | save 含 token 的会话 → 读 slot 文件 | 不含 `engDesignTokens`/`engDesignToken` 字段（两端） |
| T-DS2 | N | apply/恢复该 slot → agent 状态 | `_engDesignTokens` 无 Map（内存级——重新评审语义） |
| T-DS3 | N | 构造含旧两字段的 legacy slot → 加载 | 不崩、字段忽略、无复活（两端） |
| T-DS4 | E | eng(exit) 清内存 → 中途 save（不带字段）→ 再恢复 | 无幽灵复活（VS Code 原复活回归用例 T-AC7 反转保留语义——token 恒 null） |
| T-DS5 | E | 双端全量回归 | 全绿零破坏（engineering 布尔持久化不受影响） |

**受影响文件**：CLI `src/session.mjs` + `test/session-eng-advisor.test.mjs`；VS Code `src/agent/run-helpers.mjs` + `src/agent/setup.mjs` + `src/extension/panel-chat.mjs` + `src/extension/panel-session.mjs` + `test/eng-session.test.mjs` + `test/chat-panel.test.mjs`（复活回归语义保留处）+ 本文件 §4 + 双端 CHANGELOG（父侧交付时）。

**验收（AC-DS）**：AC-DS1 = T-DS1/2/3 绿（零持久化 + 存量兼容）；AC-DS2 = T-DS4 绿（复活闭环——panel merge 通道删除后无复活路径）；AC-DS3 = T-DS5 绿（零回归）。

