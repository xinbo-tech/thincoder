# designToken 硬化与生命周期（ENG-TOKEN-BINDING）· 工程模式凭证链板块

> 板块 = **工程模式凭证链（token 生命周期 + 写权门禁）**——token 是什么 · TTL 与格式 · 跨模式存活 · 清理时机 · **写权机械门（token 门 + D5 冻结窗口 + docRoot 声明面）**。
> **v2 就地更新**（2026-09-17 退役批）：M4 模块设计语义融入（写权门禁——见 §9；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` 已归档 `_archive/modules/`——§12 映射核正：WRITE.md 为 write 工具语义档，写权门禁归本档）。
> 相邻权威 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（结算 / 持久化 / 回读 / 消费——本档**不重述**，D2）· `docs/core/design/CONSULTATION.md`（评审引擎）· `thincoder-cli/docs/_archive/design/ENGINEERING-MODE.md`（工程模式流程，CLI 树**未迁**）。
> 需求侧 = `docs/core/requirements/ENG-TOKEN-BINDING.md`（批 5 建档——源 = VSC 树需求档）；CLI 树需求档 `thincoder-cli/docs/requirements/ENG-TOKEN-BINDING.md` **未迁**（后续批）。
> 建档：2026-09-15（**B 式迁移轮 · 第 3 批**——`thincoder-cli/docs/design/ENG-TOKEN-BINDING.md` 内容重建入基准层；旧档原地一字不改、留作参照历史；**旧档 §4/§5 口径陈旧 ⇒ 按现状收正**——见 §8.1）。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. designToken 是什么

**流程凭证**——「你评审过了吗？评过才给 token，才能 spawn eng-coder」。它是**防 agent 跳过评审步骤**的机制，**不是防人 / 防仿冒的密码学安全边界**。

**三条铁律（现行）**：

1. **语义 = 流程凭证，非安全边界**。HMAC / 加密因子 / 签名是 **security theater**——agent 只要看到因子就能仿冒生成，但那**无所谓**（机制目标是流程门，不是密码学安全）。token 格式 = `uuid:expiresAt`，**只有格式校验 + TTL，无签名**（2026-09-01 曾加 HMAC——用户裁定删除）。
2. **生命周期 = 会话级流程凭证，跨模式存活**。token 绑定会话、随模式存活：**ON→OFF 不清、OFF→ON 不重评**（TTL 内上次评审 token 继续有效）。**仅 TTL 过期清**（三个时机见 §4）。会话切换（`/new`）仍清——会话切换不是模式切换。
3. **单一数据源 = 会话槽权威持久源 + 内存运行态**。slot 持久化是**跨重启 / 跨模式恢复的有意载体**，不是 bug；内存是运行态。一致性经恢复 TTL 过滤 + 清空语义保证——不得造成内存 / 文件双源不一致（结算面细节归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`）。

**防误用纪律（违反即 bug）**：不加 HMAC / 内容绑定；spawn 时**从内存 Map 定位**而非自行签发。

## 2. 明确不做（v1 考古，勿重试）

- **内容绑定全套**（`normalizeForHash` / 头部簿记剥离 / `hashDocuments` / `docKey` 映射 / 交集作废 / 路径归一化）——用户实况否决：批次间文档必然变更，内容绑定会把「偶尔重评」变成「每批必重评」（收益反转）。
- `TOKEN_SECRET` 随机化、`eng(enter)` 用户同意门——仍留 TODO。

## 3. TTL 与 token 格式

- 默认 TTL **7 天**：`TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000`（`thincoder-core/agent-tools/design-token.mjs:34`）。
- 配置覆盖：`agent.engTokenTtlMs`——运行期校验（`Number.isFinite(cfg) && cfg > 0`，**非法回退默认**），照抄 advisor `timeoutMs` 口径：`thincoder-core/agent-tools/design-token.mjs:37`（`effectiveTokenTtlMs`）。
- 格式：`${uuid}:${expiresAt}`——uuid 为 `[0-9a-f]{8}-…-{12}`，`expiresAt` 为数字毫秒时间戳。
- **格式 + 过期判定的单一权威** = `thincoder-core/token-ttl.mjs:42`（`tokenExpiryMs`）/ `:55`（`tokenExpired`）——由恢复过滤、开模式清理、spawn 门禁过期拒删槽共引（`thincoder-core/token-ttl.mjs:5`–`:8` 注释即此登记）。
- **过期判定只对格式合法的 token**判过期：格式 / 畸形串不在此清理（恢复时读回由门禁格式拒、门禁拒时也不删槽——防误删有效槽）。
- `validateDesignToken`（`thincoder-core/agent-tools/design-token.mjs:53`）= `tokenExpiryMs(token) !== null && expiry >= Date.now()`——**fail-closed**。

## 4. 生命周期（现行）

| 事件 | 行为 |
|---|---|
| 评审通过 | token 签发入槽（settle）——advisor 回包含 token 即结算，pass 分支后签发 |
| ON→OFF | **不清**——有效 token 跨模式存活 |
| OFF→ON | **不重评**——上次评审 token 继续有效（TTL 内） |
| 重启 / 恢复 | **TTL 过滤**——过期不读回内存（丢弃，下次 save 自然清字段）；有效跨重启存活 |
| 开工程模式 | 清**过期** token（有效保留）——`eng` enter 真转换路径（`thincoder-core/agent-tools/eng.mjs:74`）· `/eng` ON 路径（`thincoder-cli/src/tui/cmd-eng.mjs:49`） |
| spawn 门禁 | 过期拒 + **顺手删该 designId 槽**（`thincoder-core/agent-tools/subagent-spawn.mjs:281`——**仅过期拒删**；mismatch / 格式拒**不删**） |
| 会话切换（`/new`） | 清 token（`resetSessionState`）——会话切换不是模式切换 |
| TTL | 7 天默认（可配），fail-closed 不变 |

**清理时机三处**（铁律 2）：① 恢复过滤（重启 / 恢复读回前逐槽校验，过期丢弃）；② 开工程模式清过期（遍历 Map 删过期，有效保留）；③ spawn 门禁过期拒时顺手删该 designId 槽（长跑不重启也清）。

## 5. 结算语义（echo 即裁决）

- **token echo 即裁决**——advisor **仅在通过时**回显 token。
  - echo → 入槽（designId 键；**单值镜像已退役**）；非 echo → 剥离 token 文本返回 findings，**槽不动**（失败的重评不作废任何既有槽）。
  - 实现：`thincoder-core/agent-tools/design-token.mjs:82`（`settleDesignReview`）。
- **未完成即不签发**：结算方收到「评审未完成」kind（`opts.incomplete`）⇒ 一律不签发（无论文本是否回显 token）——剥除回显 + 追加未签发提示，**不写槽、不关实例**（可重评）。
- 错误回包 / abort / 轮次耗尽**不作废**既有槽；`result === null` 守卫保留。
- 签发 / 校验 / 结算三函数的**宿主模块** = `thincoder-core/agent-tools/design-token.mjs`（自 `advisor-async.mjs` 提取，verbatim 零语义变）；`advisor-async.mjs` 仍 re-export（既有 import 面不变）。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| TTL 默认 + 配置覆盖 | `thincoder-core/agent-tools/design-token.mjs:34` · `:37` | 在位 |
| 签发（无签名） | `thincoder-core/agent-tools/design-token.mjs:44` | 在位 |
| 格式 + 过期单一权威 | `thincoder-core/token-ttl.mjs:42` · `:55` | 在位 |
| fail-closed 校验 | `thincoder-core/agent-tools/design-token.mjs:53` | 在位 |
| 结算（echo 即裁决） | `thincoder-core/agent-tools/design-token.mjs:82` | 在位 |
| 开模式清过期（工具面） | `thincoder-core/agent-tools/eng.mjs:74` | 在位 |
| 开模式清过期（TUI 面） | `thincoder-cli/src/tui/cmd-eng.mjs:49` | 在位 |
| 恢复过滤 | `thincoder-core/session.mjs:304`–`:305` | 在位 |
| `/new` 清 token | `thincoder-core/session.mjs:437`–`:438` | 在位 |
| 门禁过期拒删槽 | `thincoder-core/agent-tools/subagent-spawn.mjs:281` | 在位 |
| 槽清理原语 | `thincoder-core/token-ttl.mjs:65`（`removeDesignTokenSlot`）· `:90`（`purgeExpiredDesignTokens`） | 在位 |
| TUI OFF 不清 token | `thincoder-cli/src/tui/cmd-eng.mjs`（OFF 路径） | 在位 |

### 6.2 落地状态

R16 语义（跨模式存活 + 三清时机 + 单一权威）**已全部落地**，与本文一致——实核于上表各坐标。

### 6.3 VSC 端接线（B 式并入 · 实核 as-of 2026-09-15）

> 来源 = `thincoder-vscode/docs/_archive/design/ENG-TOKEN-BINDING-TUNING.md`（VSC 产品档——旧档一字未改、留参照历史）。**语义两端 lockstep**（流程凭证 / 无签名 / 跨模式存活 / 仅 TTL 过期清 / slot 权威持久源）；VSC 模块落点与持久化面独立
> （slot 经 `session-io` / `setSlotEngDesignTokens` 多槽写——非 CLI 单源 persistState 布局）。结算 / 持久化细节归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §6.3（本档不重述，D2）；原 VSC 镜像 `src/agent-tools/{advisor,subagent-spawn-gate,eng}.mjs` 等随 W9/W12/W13 已删（删除记录见批次档 §5）。

| 面 | VSC 落点（实核 · W16 接线面收正） |
|---|---|
| TTL 默认 + 配置覆盖 | **W12 已迁核**——现体 = 核 `thincoder-core/agent-tools/design-token.mjs:34`（`TOKEN_TTL_DEFAULT_MS` = 7 天）· `:37`（`effectiveTokenTtlMs`——`Number.isFinite(cfg) && cfg > 0`，非法回退默认） |
| 签发（无签名 uuid:expiresAt） | 核 `thincoder-core/agent-tools/design-token.mjs:44`（`generateDesignToken`） |
| 格式解析单一源 | 核 `thincoder-core/token-ttl.mjs:42`（`tokenExpiry`——fail-closed：段数≠2 / 空 uuid / isNaN 全返 null）· `:55` |
| 过期判定 + validate + 回显匹配 | 核 `thincoder-core/agent-tools/design-token.mjs:53`（`validateDesignToken`——fail-closed）· `:59`（`makeDesignTokenRegex`——转义整 token 回显匹配） |
| 恢复过滤（逐槽 TTL 校验） | 端壳 hydrate：`thincoder-vscode/src/agent/agent-state.mjs:56-72`（`reconcileEngDesignTokens`——逐槽 TTL 校验、过期丢弃、内存项保留）· `:70-71`（legacy 单值一次性迁移读） |
| 开工程模式清过期 | **W9 已迁核**——现体 = 核 `thincoder-core/agent-tools/eng.mjs:74`（`purgeExpiredDesignTokens`——仅删过期、有效保留）；原端侧 `eng.mjs:20/:74/:79` 已删 |
| spawn 门禁族 | **W12/W13 已迁核**——现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:112`（`resolveDesignSlot`——精确槽 / 单槽 / 多槽拒；内存 miss 回读槽）· `:158-169`（仅过期拒才删槽——`removeDesignTokenSlot`）· `:152`（`executeConsumeDesignAction`——链终消费 + 落盘对称）；原端侧 `subagent-spawn-gate.mjs:70/:101/:124/:145` 已删 （迁移期引文） |
| 内存运行态 + 回合尾落盘 | 端壳 `thincoder-vscode/src/agent/setup.mjs:304`（`_engDesignTokens` 惰性 Map——每 run 重建 agent 后水合）· `:491`（`setSlotEngDesignTokens` 回合尾 flush） |
| 多槽持久化原语 | 端壳 `thincoder-vscode/src/extension/session-slot-write.mjs:23`（`setSlotEngDesignTokens` / `mergeEngTokensForSave` 核转口 re-export）→ 核 `thincoder-core/session-slot-write.mjs:156`；原 `session-io.mjs:43` re-export 行随 W11 重排 |

**VSC 侧差异**（有意——源码注释逐字登记）：① slot 持久化 = 会话槽 + config.json mirror（端壳 `thincoder-vscode/src/agent/setup.mjs` `configureEngMirror` onToggle——冲突时槽优先）；② spawn 门禁 `resolveDesignSlot` 读当前 run 内存 Map、**miss 时回读槽文件权威台账**（结算面——`DESIGN-TOKEN-SETTLEMENT.md` §6.3）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-E1 | token = **无签名流程凭证**（`uuid:expiresAt`） | agent 能看到因子即可仿冒——签名只是 security theater；否决 HMAC / 内容绑定 |
| D-E2 | 内容绑定**整套否决** | 文档每批必变 ⇒ 内容绑定把「偶尔重评」变「每批必重评」（收益反转） |
| D-E3 | 生命周期 = **跨模式存活**（ON↔OFF 不清不重评） | 模式切换不是评审失效的理由；否决「exit 清空」的旧语义 |
| D-E4 | slot 持久化 = **有意载体**（不是 bug） | 跨重启恢复是刚需；否决「内存单源」（重启即丢） |
| D-E5 | 过期判定**只对格式合法 token**生效；门禁拒时**仅过期拒才删槽** | 畸形串无从判定——删了会误删有效槽；否决「一律删」 |
| D-E6 | 清过期只在**三个时机**（恢复 / 开模式 / 门禁过期拒） | 长跑不重启也要清；否决「只在恢复时清」 |
| D-E7 | 结算三函数**拆出独立模块**（design-token.mjs）+ re-export 保 import 面 | 宿主模块超 500 行硬限；否决「挤在原文件」（越线） |

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
**落点 = 新文件 `thincoder-core/agent/write-gate.mjs`**（不是 `dispatch.mjs`——落 dispatch 会让 M6 `advisor.mjs` 反向 import 门禁簇成回边；write-gate 无上游依赖，三向消费不成环）：`dispatch.mjs` / VSC `tool-gates.mjs` / M6 `advisor.mjs` 三向 import 消费（单一权威源，不重复实现）。
token 门与冻结窗口判据复用 v1 现有导出（`anyLiveDesignSlot` / `inflightDesignReviewConflict` / `validateDesignToken`——不改签名），「改读 docRoot」只落在评审目标来源一处。

**F4 写命令装配承接**：台账写命令落 M2（ledger 命令装配）、manifest 写命令落 M1（manifest 读写装配）——装配点非主 agent → 拒；本档只记录承接关系。

**AC-M4-5（修 ≠ 绕）**：继承 v1 单一权威分类（`loadConventions`/`isCodePath` + 拒绝文案 hint/convNote）——分类与分流不一致时 token 门照拒（fail-closed），模型侧「停下上报」由该文案触发；**不新增独立谓词、零新增编辑点**（继承零改原则）。

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

- 2026-09-17（**v2 就地更新 · 退役批** · 主 agent）：M4 模块设计语义融合——新增 §9 写权门禁（token 门继承 + D5 冻结窗口 + `resolveReviewTargetPaths` 读 `docRoot` 落 `write-gate.mjs` + F4 承接 + AC-M4 验收）；§12 映射核正（WRITE.md 为 write 工具语义档，写权门禁归本档）；原旁路档 `_archive/modules/ENGINEERING-MODE-V2-MODULE-WRITE-GATE.md` 归档 `_archive/modules/`。

- 2026-09-15（**B 式迁移轮 · 第 3 批**）：建档——`thincoder-cli/docs/design/ENG-TOKEN-BINDING.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；**旧档 §4 结算语义 / §5 实现落点两处口径按现状收正**（单值镜像已退役 → 见 `DESIGN-TOKEN-SETTLEMENT.md`；签发/校验/结算宿主 = `agent-tools/design-token.mjs`；`src/**` 迁移前坐标 → 现状路径），旧句逐条登记入 §8.1；坐标全量实核；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §6.3 VSC 端接线——自 `thincoder-vscode/docs/_archive/design/ENG-TOKEN-BINDING-TUNING.md` 并入（TTL / 解析 / 过期判定 / 门禁族 / 持久化逐项实核；结算面指回 `DESIGN-TOKEN-SETTLEMENT.md` §6.3——D2）；VSC 旧档重复面与批次材料登 §8.2 不并（(d) 类）；需求侧头注随批 5 建档收正。
- 2026-09-15（**W16 实施轮 · eng-coder · 接线面收正**）：§6.3 表换「实核 · W16 接线面收正」版——TTL/签发/解析/validate/回显匹配/门禁族全部收为核面坐标
  （`thincoder-core/agent-tools/design-token.mjs` · `thincoder-core/token-ttl.mjs` · `thincoder-core/agent-tools/subagent-spawn.mjs` · `thincoder-core/agent-tools/eng.mjs`）；
  恢复过滤/内存运行态/多槽原语 = 端壳存活档行号重核（`thincoder-vscode/src/agent/agent-state.mjs:56-72` · `thincoder-vscode/src/agent/setup.mjs:304` / `:491` · `thincoder-vscode/src/extension/session-slot-write.mjs:23`）；
  侧差异① mirror 行改指现体 `configureEngMirror`；§9 行数重核。
