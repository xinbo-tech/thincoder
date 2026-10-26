# 2026-10-26 · 代码笔闸的批次归属
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 台账 #1754 + 用户 2026-10-26 01:31「要」。
> 台账 = #1754（ENGINEERING-MODE · 归批）。前情 = 2026-10-26-retire-pen-exceptions.md（已收口 2026-10-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**问题（父侧 2026-10-26 01:32 实读）**

产品代码写闸的放行条件，判的是「**有没有任何一个活凭证**」，不是「**这笔改动有没有对应的批**」。

| 坐标 | 现文 |
|---|---|
| `thincoder-core/agent/dispatch.mjs:99-102` | `if (agent.config?.agent?.engineering && depth === 0 && !anyLiveDesignSlot(agent) && FILE_MUTATORS.has(toolCall.name) && !(await lightRoundOpen(agent))) {` |
| `thincoder-core/token-ttl.mjs:221-232` | `export function anyLiveDesignSlot(agent)`——遍历 `agent._engDesignTokens` 全部条目，`tokenExpiryMs(t) !== null && !tokenExpired(t)` 即 `return true`；**不区分 designId、不区分批次** |

**这不是实现走样，是 2026-09-08 的旧裁定**：`token-ttl.mjs:217` 注释逐字「是否存在任一活槽（DESIGN-TOKEN-SETTLEMENT D3——dispatch 写门判定"任一活槽存在"；AC4）」。当初的语义假设 = 「有凭证 ⇒ 你确实在走工程流程」；实际效果 = 「**任何一个存量凭证都让整台闸长期敞开**」。

**为什么假设不成立**：凭证的生命周期是 TTL（小时~天级），而它只在**本批收尾**时被 `consume-design` 消费。批与批之间不断档，于是手上总有一两个没消费的旧槽——闸读到「有活槽」就放行，谁也不问「这笔记账了吗」。

**实证两条**

1. **2026-10-24 晚**（`eng-designer#12` 17:53 上抛）：手上握着 8 个更早批次的已批准槽，六笔提交（`6ca8032b` · `811392b0` · `6a13d11a` · `e2902dcf` · `1852af2f` · `a0cb6e24`）全部绕过了挂账。
2. **2026-10-26 今晚**（父侧自陈）：从 `#1798` 到 `#1800` 一路握着 token，中间任何一次产品码笔都会直接放行——闸在这段时间里对我等同于不存在。

**要解决的不是「加一个判断」**，是一个信息缺失：**闸在判的那一刻，不知道「这笔改动属于哪一批」**。凭证本身也不带批次归属（`token-ttl.mjs` 的槽值形 = `<designId>:<expiryMs>`，无 batch 字段）。所以设计席要回答的是：

1. 「本批」这个信息在闸的判点能否取到（批档在途集合 ∥ 台账在途行 ∥ 另行注入）？
2. 若取得到，判据句是什么——「本笔改动所属批有未消费凭证」？「在途批存在」？
3. 若取不到，是否该改凭证的载荷（加 batch 字段）——那是另一层改动，须写明代价。
4. 轻通道轮的通路（`lightRoundOpen`）与本条的关系：两者都是「绕过全链的合法通路」，面界要一次说清。

**不做的**：不改 `lights` 面 · 不改 TTL · 不改 `consume-design` 语义 · 不放宽「无凭证 ⇒ 拒」这条（`FAIL-CLOSED` 方向只能更严，不能更松）。

**父侧倾向（供设计席参考，非结论）**：闸的问题不是「判得太松」，是「判的对象错了」——它判凭证存在性，而它应该判的是**这笔笔动的出处**。

**用户裁定（2026-10-26 01:34，逐字）**

> 带批次是需要的，收口即消费其实早就有要求，只是模型不执行，改成收口自动感觉可行。

⇒ **两条都做**，且分工明确：

| # | 决定 | 性质 |
|---|---|---|
| **1** | **凭证带批次**——槽载荷标识它属于哪一批 | 契约面变更（槽值形现为 `<designId>:<expiryMs>`，无 batch） |
| **2** | **收口自动消费**——`batch close` 时自动 consume 本批的 token | 把「早有要求但模型不执行」的纪律，改成结构动作 |

**为什么这两条合起来才成立**：带批次让「消费谁」有了确定性（不是消费全部、也不是消费错批）；收口自动消费让「活槽存在」在任一时点 ≈ 「有未收口的批」。两条合起来，`dispatch.mjs:99-102` 的判据（`!anyLiveDesignSlot(agent)`）**可以不动**——它判「有没有活槽」，而现在活槽不会跨批滞留。

**因此本批不做**：不改 `dispatch.mjs` 的放行条件 · 不改 `anyLiveDesignSlot` 的判据语义 · 不改 TTL · 不放宽「无凭证 ⇒ 拒」。

**设计席要定形的四件**

1. **载荷形**：batch 放进槽值（`<designId>:<expiryMs>:<batch>`）还是槽记录挂旁列？存量槽（无 batch）怎么读——按「未知批次」放行待消费 ∥ 一次性迁移 ∥ 收口时按 designId 反查批档。
2. **自动消费的落点**：`batch close` 的哪一步（状态行改「已收口」前 ∥ 后）？失败怎么办（close 已成功而消费失败 ⇒ 留旧槽，是否阻断 close）。
3. **反查关系**：批档 → token 的关联从哪来（`batchDoc` 路径在 spawn 时已知；`design-slots` 行已有 `batch` 列可读）。
4. **验收**：怎么机判「收口后该批无活槽」与「存量无 batch 槽不误伤」。

**父侧的一条提示（供设计席参考，非结论）**：`design-slots` 列表已经在显示 `batch` 列——先查清那个值从哪来的，可能省掉一层新增载荷。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**设计档落点**：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10「凭证带批次与收口自动消费」（新增节；同步收正 §9 的被推翻表述——`:142` 签发链零改句 ∥ `:151` 批列来源 ∥ `:192` 边界 ∥ `:198` 落点表 ∥ KD-SL2 `:259`）。需求档 = 主 agent 笔，本席零触。

**本批条目（覆盖 —— 两条，来自用户 2026-10-26 01:34 逐字裁定「带批次是需要的，收口即消费其实早就有要求，只是模型不执行，改成收口自动感觉可行」）**

| # | 条目 | 目标态（设计档坐标） |
|---|---|---|
| E1 | **凭证带批次**：每个 design 槽在 settle 时记下所属批档（槽文件旁列 `engDesignTokenBatches`，值为批档绝对路径） | §10「批次标识的来源」「存储形」 |
| E2 | **收口自动消费**：`close` 与 `status §1→已收口` 两通路在写状态行之前消费本批全部槽；失败 ⇒ close 拒、档零字节变 | §10「收口自动消费（单源，两通路同调）」 |

**不在本批（不做）**：`thincoder-core/agent/dispatch.mjs:99-102` 放行条件 · `anyLiveDesignSlot` 判据语义（`thincoder-core/token-ttl.mjs:221`）· TTL · `consume-design` 语义 · 轻通道判据（`lightRoundOpen`）· 跨会话槽消费 · 槽记录的时间戳等其它字段。理由：两条合起来已让「活槽存在 ≈ 有未收口的批」，判据本身无须改（§1 `:49` 同裁）。

**机制要点**：批归属派生 = 设计评审 run 的 `docSetKey` 中 `batches/` 段档取绝对路径（复用 `thincoder-core/agent-tools/design-slots.mjs:54` `batchBasename`，settle 时刻零新输入）；token 值形 `<uuid>:<expiryMs>` 零改（三段值形会令 `tokenExpiryMs` 判 null ⇒ 全部槽失效、门永久关闭，故拒）；旧槽（无旁列）不消费、不猜归属，回执点名计数并用 `consume-design expired:true` 清，TTL 7 天兜底。

**受影响文件与测试覆盖**（现行行数本轮实读；口径 = 末行行号）

| # | 文件 | 现行行数 | 预计 Δ | 测试面 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-slots.mjs` | 245 | +≈30 | U-BG1 / U-BG8 |
| 2 | `thincoder-core/token-ttl.mjs` | 306 | +≈45 | U-BG1（跨重启读回） |
| 3 | `thincoder-core/agent-tools/design-token.mjs` | 184 | +≈8 | U-BG1 |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | 556 | +≈45 | U-BG2–U-BG7 |
| 5 | `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | 0（未建） | 新建 ≈180 | U-BG 全组宿主（收口随批删） |

跨档位登记：`batch-lifecycle.mjs` 现 556 行**已越 500 软线**，本批后 ≈601、仍低于 800 硬限；拆分不在本批（台账登记归主 agent）。

**验收对照（每条回指设计档 §10 用例，值不在本节复制）**

| AC | 判据（设计档 §10「验收」） | 机检 | 命令 |
|---|---|---|---|
| A1 | U-BG1 + U-BG8——归属持久化、跨重启可读、无批档不猜 | 旁列条目存在 ∧ 值 = 批档绝对路径；token 值形仍两段 | `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` |
| A2 | U-BG2 + U-BG3 + U-BG6——两通路都消费本批全部槽，它批零动 | 消费后槽文件无该批条目 ∧ 它批条目在盘 | 同上 |
| A3 | U-BG4——旧槽不误伤、不猜、回执点名 | 旧槽仍在盘 ∧ 回执含「无归属」计数 | 同上 |
| A4 | U-BG5——消费失败 ⇒ close 不落 | §1 状态行字节不变 ∧ 槽回滚 | 同上 |
| A5 | U-BG9——本批边界内零改动 | `dispatch.mjs` / `anyLiveDesignSlot` 判据 / TTL 常量 diff = 0 | `git diff --stat` 复核 |

**关键决策（详见设计档 §10「关键决策记录」KD-BG1–KD-BG5）**：旁列而非值形三段 · 绝对路径而非 basename · 消费位于写状态行之前（失败拒 close，不留「已收口而凭证在」）· 旧槽不猜归属 · `consume-design` 不加按批选择器。

**上抛项**

1. **[上抛·待裁] 需求档与本批裁定冲突（语义面，需求档为主 agent 笔，本席零触）**：`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:52` 逐字「**不为恢复便利扩展机制**（用户 2026-10-17 19:22 裁定…）：槽记录**不扩字段**（不加批名 / 时间戳等持久化）」与 `:23` F-SL1 边界「批列跨重启不可得 ⇒ `—`（如实降级）」——两条直接抵触本批用户裁定（本档 §1 `:38-40`，2026-10-26 01:34「带批次是需要的」）。按指令优先级取新裁定（设计档 §10 即按此落），但需求档须由主 agent 收正：`:52` 边界句改写、`:23` F-SL1 边界改写、并新增 E1 / E2 两条需求条目（带判定句与边界）。未收正前，「§2 条目 = 设计档 AC = 需求档条目」三链缺末环。
2. **[上抛·知会] `batch-lifecycle.mjs` 已越 500 行软线**（现 556 行，本批后 ≈601，硬限 800 未触）：本批不拆分，是否登台账由主 agent 定。

**裁定落定（父侧 2026-10-26 01:39「可以」——上抛项 1 关闭：两条裁定不冲突，射程不同）**

- **射程**：`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` §5「不为恢复便利扩展机制」（现 `:54`）管的是**恢复**面——不为让凭证重启后可捞回而扩字段；旁列承载**归属**——让写门判「本笔改动属于哪一批」⇒ 不在射程内，该行零改。原读数 = 只取「槽记录不扩字段」半句、漏看主句限定。
- **需求档（父侧笔，已落）**：新增 F-D7「凭证带批归属」+ F-D8「收口自动消费」（`:23`–`:24`）；F-SL1 批列来源改「槽文件旁列优先、注册表兜底」、边界改「批列跨重启可得（F-D7）；无旁列的存量槽 ⇒ `—`」（`:25`）。三链末环补齐。
- **设计档（本席笔，已落）**：§10 加射程划界——`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:276`（承载归属、非恢复）· `:278`（旁列缺失仍如实降级 `—`，单一降级层级）。
- **本轮边界（零触）**：需求档未改 · 代码未改 · `:54` 那行未动 · `dispatch.mjs` / `anyLiveDesignSlot` / TTL / `consume-design` 语义按 §1 `:49` 不动。

**修正轮落定（评审 §3 轮次 1 · 12 条全收 · 2026-10-26）**

设计档 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（下称 D 档）；交叉档 = `docs/core/design/BATCH-RECORD.md`。

| # | 级 | 处置 → 落点 |
|---|---|---|
| 1 | 🔴 集成测试设计 | D 档 §10 新增「集成测试设计（从 `test/RTM.md` 起读）」——逐故事破行（无）∥ 冗余（无）∥ 缺失（CLI 端新故事 10，两行），每行点名交互组件 ∥ 业务可观测结果 ∥ 进入口 ∥ 回指（F-D7 / F-D8）：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:328`（两行在 `:338`–`:339`）；受影响表补 `test/RTM.md` `:353` ∥ `test/integration/batch-close-token-consume.test.mjs` `:354` |
| 2 | 🔴 U-BG9 与受影响表相抵 | U-BG9 输入改为四段判据文本（`dispatch.mjs` 放行条件句 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句），机检 = 与写死在测试里的期望串逐字比对（不靠 git）：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:377`；A5 同口径、A6 同处新增 `:380` |
| 3 | 🔴 需求档 §5 互斥 | 父侧已收正需求档 `:54`；D 档射程段改写为引收正后的那句话（旁列承载归属、非恢复；正文单源在需求档，本节不复述）：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:288` |
| 4 | 🟡 保存 / 合并路径 | 补「保存 / 合并路径（旁列必须对位的三处）」——`engTokenSlotFields` ∥ `persistEngTokens` ∥ 新 `mergeEngTokenBatchesForSave`：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:282`；受影响表补 `thincoder-core/session-slot-write.mjs`（240 行，+≈18）`:351`；新增 U-BG10「忙时保存后归属仍在」`:378` |
| 5 | 🟡 无归属槽敞口 | 点名两类（旧槽 ∥ 上线后文档集不含批档的评审铸出的槽）、谁铸出、撑开至 TTL 7 天（`design-token.mjs:36`）、观测量 = 清点面 `batch=—` 的行数；「≈」明写为近似：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:306`（近似结论 `:310`） |
| 6 | 🟡 越软线无拆分计划 | 补触发条件（下次触及即拆 ∥ ≥700 行）+ 切法（收口链 → `batch-closeout.mjs`，共享解析 → `batch-read.mjs`）+ 本批不拆理由：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:357`（切法 `:361`） |
| 7 | 🟡 两套现行读数 | §9 收成单一现行：`design-slots.mjs` = 245 行 · 清点核 `:91` · 消费核 `:123` · 并集 `:30` · 批列 `:42` · 批档 basename `:54` · 行拼装 `:111`：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:144` ∥ `:157` ∥ `:198` ∥ `:228` |
| 8 | 🟡 收口语义拥有档 | `docs/core/design/BATCH-RECORD.md` §4.13 新增反向引用（工程模式下先消费本批设计凭证、失败拒 close、口径单源指向 D 档 §10）：`docs/core/design/BATCH-RECORD.md:308` |
| 9 | 🟡 五个新名字三问 | 新增三问表五行（`engDesignTokenBatches` ∥ `_engDesignTokenBatches` ∥ `readEngTokenBatchesFromSlot` ∥ `consumeBatchDesignTokens` ∥ 回执标签 `[design tokens]`）；`consumeBatchDesignTokens` 收为复用 `executeConsumeDesignAction({designIds})` 的薄壳：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:318`（KD-BG6 / KD-BG7 `:393`–`:394`） |
| 10 | 🟡 三处分支缺出处 | 逐条补：「不含批档 ⇒ 归属 = 无」`:276`（清点面既有降级 + 复现步骤）· 匹配归一 `:299`（`normAbs` 对绝对输入原样保留 + 两种 `documents` 写法 + Windows 大小写不敏感）· 无匹配 no-op `:302`（重开通路 `batch-lifecycle.mjs:455-466`）· 普通模式 no-op `:303`（模式位执行期实读 `:405-406`；普通模式批无槽） |
| 11 | 🔵 调用点无坐标 | 两处坐标 + 与文档机检门先后：`close` = `closeBatchRecord`（`:500`）内机检门 `:512-513` 之后、写 `:515` 之前；`status` = `statusBatchRecord`（`:404`）内机检门 `:475-476` 之后、写 `:477` 之前；门在函数体内先于写盘 ⇒ 消费位 = 全部拒因之后、写盘之前：`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:296`（先后 `:297`） |
| 12 | 🔵 A5 命令不可跑 | A5 与 U-BG9 改内容判据（文本比对），`git diff --stat` 退场：`DESIGN-TOKEN-SETTLEMENT.md:377` ∥ `:380` |

**A5 判据收正（覆盖本节 `:99` 那行的命令）**：A5 的机检 = U-BG9 的四段文本比对，命令 `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs`——无 git 的树里同样可跑；`git diff --stat` 不再是任何 AC 的命令。

**本轮边界（零触）**：需求档未改（父侧已落 `:54`）· 代码未改 · `dispatch.mjs` ∥ `anyLiveDesignSlot` ∥ TTL ∥ `consume-design` 语义按 §1 `:49` 不动 · 轻通道判据未动。

**状态**：修正轮落地完成，待复评。

**修正轮落定（父侧 2026-10-26 裁定 · 实施席上抛两项 + 设计档漂移收正）**

设计档 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（下称 D 档）；本轮零代码改动（实施席后落）。

| # | 来源 | 处置 → 落点 |
|---|---|---|
| 1 | 上抛 1（`mergeEngTokenBatchesForSave` 生产零调用点） | 父侧裁定：不修代码、只如实登记 → D 档 §10「写面如实登记」：与 `mergeEngTokensForSave`（`session-slot-write.mjs:184`）同形纯函数；核侧 `session.mjs:184` 整档覆盖写、两函数核内零调用点；tokens 版端面消费者 = `thincoder-vscode/src/extension/panel-session-write.mjs:109`，旁列版端面未接线 ⇒ A6 收窄为纯函数面 |
| 2 | 上抛 2（旁列读 fail-open） | 父侧裁定：收口面改严格读 → D 档 §10「读形（收口面严格 ∥ 清点面宽容）」+「严格读的边界」：清点面保留 `catch ⇒ null` 如实降级；收口面 `unionBatches({strict:true})` 读失败（I/O 错 ∥ 解析失败）即抛 ⇒ close 拒；无槽 ∥ 无字段 = 空集合法缺省 |
| 3 | 上抛 5 ∥ 评审轮次 2 🔵1（行数漂移） | D 档受影响表按实测收正（`design-slots` 305 · `token-ttl` 345 · `design-token` 200 · `session-slot-write` 260 · `batch-lifecycle` 611；自档行 = 「本档」）+ 行数与坐标约定句 |
| 4 | 上抛 3 ∥ 评审轮次 2 🔵2（§9 坐标漂移） | D 档 §9 现行坐标收正（清点核 `:150` ∥ 消费核 `:183` ∥ 并集 `:36` ∥ 批列 `:60` ∥ basename `:81` ∥ 行拼装 `:171`）；§9 行数 245 → 305 |
| 5 | 写面单源缺一条（settle 派生为无 ⇒ 删旧旁列行） | D 档 §10「写面（settle 同拍）」：派生为无 ⇒ 删该 designId 既有旁列行 + 分支出处（同 designId 换文档集复评，继承上一轮归属会消费错批） |

**用例 / 验收面变更**：新增 U-BG11（旁列读失败 ⇒ close 拒、§1 字节不变、零消费）；A4 ← U-BG5 + U-BG11；A6 措辞收窄为纯函数面（判据值在设计档 §10，本节不复制）。

**待实施（下一实施轮）**：收口面严格读（`unionBatches` 严格开关 + `consumeBatchDesignTokens` 接入）+ U-BG11 用例；预期 `design-slots.mjs` ∥ `batch-lifecycle.mjs` 行数小幅上浮（不影响软线结论）。

**实测偏差（读数，非阻断）**：`design-slots.mjs` 本轮末行行号 = **305**（父侧给的 304 与本席实测差 1，受影响表按 305 记）。§9 六处坐标父侧给值与本席实读亦差 3–8 行（并集 `:36` 非 `:33` · 批列 `:60` 非 `:57` · basename `:81` 非 `:78` · 清点核 `:150` 非 `:142` · 消费核 `:183` 非 `:175` · 行拼装 `:171` 非 `:163`）——按本席实读落。

**本轮边界（零触）**：代码未改 · 需求档未改 · `dispatch.mjs` ∥ `anyLiveDesignSlot` ∥ TTL ∥ `consume-design` 选择器按 §1 `:49` 不动。

**修正轮落定（设计档回写实现真况 + manifest 层同判 · 父侧 2026-10-26 裁定）**

设计档 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（下称 D 档）；本轮零代码改动。

| # | 来源 | 处置 → 落点 |
|---|---|---|
| 1 | 父侧「§10 回写实现真况」① | 读形改写成两级判据（内层按 `err.code` 分判 / 外层按读形）+「没有」三输入单列 + 不用 `existsSync` 的理由：D 档 `:304`–`:306` |
| 2 | 同上 ② | U-BG11 改为两支（截断 ∥ `EISDIR`）；补 U-BG12 ∥ U-BG13；新增 U-BG14：D 档 §10「用例」表 `U-BG11`–`U-BG14`；A4 扩为 U-BG5 + U-BG11 + U-BG12 + U-BG13 + U-BG14：D 档 §10「验收」第 4 条 |
| 3 | 同上 ③ + 上抛 5（行数面） | 坐标收正（`readEngTokenBatchesFromSlot :216` · 严格抛 `:235-237`／宽容 `:238` · `consumeBatchDesignTokens :558` · `anyLiveDesignSlot :275` · `batchOf :60` · `persistEngTokens :335-340` · `[ledger reanchor] :604`）；受影响表按实测重排（token-ttl 363 · design-slots 305 · design-token 200 · batch-lifecycle 612 · session-slot-write 260 · 单测档 394 · RTM 148 · 集成 158）：D 档 `:365`–`:376`；软线段改「六档」`:380`；§9 `:229` 收成落地后读数 422（评审轮次 3 🔵14 一并收） |
| 4 | 上抛 2（manifest 层 fail-open）父侧裁定「要修」 | 选 `loadManifest(cwd, { strict })` 两形：D 档 `:307`–`:309`；KD-BG8（§10「关键决策记录」）；新面入受影响表 `:372`；用例 = U-BG14；边界（可读但 `active` 缺席 ⇒ 合法缺省）`:309` |
| 5 | 上抛 3（同拍两读形）父侧裁定「记为已知限制」 | D 档 §10「已知限制（接受的风险，非遗漏）」`:328`–`:330`（触发 ∥ 影响 ∥ 接受理由）+ KD-BG9 |
| 6 | 上抛 4（§3 三处 `doc_check`） | 父侧已修（裸档名补全、两段拆开），本席零触 |

**manifest 两条路的取舍与代价**

- **选路** = `loadManifest(cwd, { strict = false } = {})`——与 `readEngTokenBatchesFromSlot(agent, { strict })` 同一两形先例：同一读函数、同一判据（`ENOENT` ⇒ 没有；其余错 ⇒ 抛）、缺省宽容。「没有 vs 读不到」的判据因此只有一处实现。
- **被拒的另一条路** = 在 `token-ttl.mjs` 另写一个只读 `.active` 的严格读函数：判据会落到第三处（`loadManifest` 宽容形 ∥ 旁列读 ∥ manifest 严格读），manifest 形状出现第二个读者，三处必漂。
- **代价**：① `thincoder-core/session-slots-manifest.mjs` 是新面（247 行 → ≈257），已入受影响表 `:372` 并按父侧要求在此报明；② `loadManifest` 从一个读法变两形，后续调用点须自选——规则 = 展示 / 尽力面用缺省宽容形、收口门面用 strict，现行全部调用点缺省零改；③ 严格形新增一条「manifest 在盘且损坏 ⇒ 工程模式 close 被拒」的路径——有意 fail-closed，修文件后重试。

**待实施（下一实施轮）**：`loadManifest` 两形 + `currentSlotNoReadOnly` 严格形接入 + U-BG14 两支用例。判据值在 D 档 §10，本节不复制。

**本轮实测偏差（读数，非阻断）**：`session-slots-manifest.mjs` = 247 行（父侧未给读数）· `subagent.mjs` = 422 行（§9 原记 416 → 414；差值来自其后其它批次增行，非本节面，按实测落）。

**本轮边界（零触）**：代码未改 · 需求档未改 · `dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据 ∥ TTL ∥ `consume-design` 选择器零改 · 本轮已落的行为语义未改。

**状态**：修正轮落地完成，待复评。

**修正轮落定（设计档回写实现真况 —— manifest 两形已落 · U-BG15 补例 · 三处漂移收正 · 父侧 2026-10-26 裁定）**

设计档 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（下称 D 档）；本轮零代码改动。

| # | 来源 | 处置 → 落点 |
|---|---|---|
| 1 | 父侧裁定 一（U-BG14 补一条） | 用例表新增 U-BG15（manifest 在盘且合法、`active` 缺席 ⇒ 无槽号 ⇒ close 照常收口、零消费、回执「消费 0 枚」）：D 档 `:407`；A4 纳入 U-BG15：D 档 `:414`；U-BG14 支② 措辞对齐实施轮口径（干净会话 = manifest 不存在，从未创建）：D 档 `:406` |
| 2 | 父侧裁定 二（manifest 位非 ENOENT I/O 错不补例） | 新增「未单独设例的一类（如实登记）」：同一判别式（`err.code === "ENOENT"`）已在槽文件位有 `EISDIR` 证据（U-BG11 支二），manifest 位再取样不增加信息；manifest 位的「没有 vs 读不到」由 U-BG14 ∥ U-BG15 守：D 档 `:311` |
| 3 | 实施席上抛 2①（原 `:310` 已不成立） | 「落地状态（如实）」改写为已落地：`loadManifest(cwd, { strict })`（`thincoder-core/session-slots-manifest.mjs:113`）∥ `currentSlotNoReadOnly` 透传（`thincoder-core/token-ttl.mjs:184`），两通路被拒、档零字节变、可重试：D 档 `:310` |
| 4 | 父侧裁定 三 + 实施席上抛 2②（实测反超预估） | 受影响表按实读收正：`session-slots-manifest.mjs` 264（247 → +17，实测反超预估 ≈257）`:373`；当批单测档 440（预估 394）`:377`；`token-ttl.mjs` 370（306 → +64；严格读 +18 ∥ 槽号解析外提 +7）`:369`；集成档 158 不变 `:376`；软线段同值 `:381`；新面登记句 247 → +17 `:309` |
| 5 | 一致性面（本轮实读的坐标收正，判据零变） | `readEngTokenBatchesFromSlot` `:221`（槽号外提 `:224`）· `ENOENT` 返回 `:233` · 上抛 `:234` · 宽容 `:245` · 严格抛 `:242-243`：D 档 `:304`；`loadManifest` 的 `catch` `:121`：D 档 `:307`；`readEngTokensFromSlot` `:195-207`：D 档 `:329` |

**本轮实测读数（亲跑；行数口径 = 末行行号，逐档 node 统计 `\n` 数）**

- `thincoder-core/token-ttl.mjs` = 370 · `thincoder-core/session-slots-manifest.mjs` = 264 · `thincoder-core/agent-tools/design-slots.mjs` = 305 · `thincoder-core/agent-tools/batch-lifecycle.mjs` = 612 · `thincoder-core/agent-tools/design-token.mjs` = 200 · `thincoder-core/session-slot-write.mjs` = 260
- `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` = 440 · `test/integration/batch-close-token-consume.test.mjs` = 158 · `test/RTM.md` = 148
- 坐标核（同轮实读）：`loadManifest` 定义 `session-slots-manifest.mjs:113`、`catch` `:121`；`currentSlotNoReadOnly` `token-ttl.mjs:184`、`loadManifest` 调用 `:187`；`readEngTokenBatchesFromSlot` `:221` / 槽号外提 `:224` / `ENOENT` 返回 `:233` / 上抛 `:234` / 严格抛 `:242-243` / 宽容 `:245`；`consumeBatchDesignTokens` `batch-lifecycle.mjs:558`、`unionBatches(agent, { strict: true })` `:561`；两通路 `:483`→`:484` ∥ `:522`→`:524`；`readEngTokensFromSlot` `:195-207`；`unionBatches` `design-slots.mjs:47`

**核对结论**

- 父侧给的三处漂移读数与本席实测一致：264 ∥ 440 ∥ 370（集成档 158 亦同），无偏差需报。
- §5 记 `batch-lifecycle.mjs:561` 与本档记 `:558` 不矛盾：`:558` = 函数头，`:561` = 函数体内 `unionBatches(agent, { strict: true })` 调用行（本轮两行并读）。
- U-BG15 的「manifest 不被本通路改写」有读数支撑：`batch-lifecycle.mjs` 内 `saveManifest` 零命中（grep 实读）。

**待实施（下一实施轮）**：U-BG15 在当批单测档落一支（判据见 D 档 `:407`，本节不复制）；落完 A4 覆盖面即齐（D 档 `:414` 已含 U-BG15）。

**本轮边界（零触）**：代码未改 · 需求档未改 · U-BG1–U-BG14 既有判据未改 · 禁改面四段（`dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句）未动。

**状态**：修正轮落地完成，待复评。

**收口前小修正（父侧 2026-10-26 裁定 · 4 条）**

设计档 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（下称 D 档）；本轮零代码改动、零用例判据改动。

| # | 来源 | 处置 → 落点 |
|---|---|---|
| 1 | 父侧 一（受影响表行数） | 第 10 行现行行数 440 → **486**，Δ 格注明「440 → 486 为 U-BG15 落成后读数」：D 档 `:377` |
| 2 | 父侧 二（其余读数复核） | 逐行比对本席实测：`token-ttl.mjs` = 370（D 档 `:369` 已同值，零改）· `batch-lifecycle.mjs` = 612（`:371` 同值）· `design-slots.mjs` = 305（`:368` 同值）· 当批单测档 = 486（`:377` 本轮已收正）——受影响表无第二处漂移 |
| 3 | 父侧 三（U-BG15 探针） | U-BG15 行补一句探针反向验证（`token-ttl.mjs:188` 改成 `1` ∥ `0` ∥ `2` ∥「缺 `active` 即抛」四种错法各使本例如红，还原后绿）：D 档 `:407` |
| 4 | 父侧 四（`active: null` 不补例） | 「未单独设例的一类」补半句：`active: null`（非整数支）与「缺席」同一表达式，同列不单独设例：D 档 `:311` |

**读数（本席亲跑）**：D 档 **434** 行（三处整行替换，行数不变）· `thincoder-core/token-ttl.mjs` **370** · 当批单测档 **486** · `thincoder-core/agent-tools/design-slots.mjs` **305** · `thincoder-core/agent-tools/batch-lifecycle.mjs` **612** · 探针目标行核对 = `thincoder-core/token-ttl.mjs:188` 逐字 `return Number.isInteger(active) ? active : null`。父侧所报用例读数（当批 15/15 · 集成四档 10/10 · U-BG9 1/1）属实施面，记录归 §5，本节不复制。

**doc_check（交付门）**：`DOC-CHECK GATE: PASS`（显式点名 D 档，0 命中）。

**本轮边界（零触）**：代码未改 · U-BG1–U-BG15 判据未改 · 禁改面四段（`dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句）未动 · 需求档未改。

**状态**：本批最后一个设计面笔已落，待收口。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 §2 落点 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 ∥ 需求档 `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md`。范围限三档；源码行数未 spot-check（超范围，标 `unverified`）。本次评审上下文未提供 `docs/README.md` 文档地图与项目标准档 ⇒ 文档归属判定降级（仅按文件名 + AGENTS.md 指引检查）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🔴 | 无集成测试设计节。`test/RTM.md` 在仓库存在（本席 glob 实证），而 §10 测试面只有当批单测——`DESIGN-TOKEN-SETTLEMENT.md:326`「`node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs`」；唯一相关登记是同档 `:71`／`:97`「相应集成用例尚未设立（既有缺口，另账）」——「另账」不在允许的唯一豁免内。收口新增「可被拒」与「收口即清账本」两个业务可观测结果，随批测试档收口即删，该结果无验收留存 | 在 §10 增一节集成测试设计：从 `test/RTM.md` 起读，写清本改动打破／冗余／缺失的行；每行点名交互的两个组件（`batch-lifecycle.mjs` 收口通路 ↔ `token-ttl.mjs` 槽 I/O）、断言的可观测业务结果（收口后该批无活槽／消费失败时 close 被拒）、进入口（父侧经 `batch` 工具收口）与回指需求（F-D8／F-D7）。若确无可断言项，只能以「本改动不改任何既有用例断言的业务可观测结果、且产品确无需要的新场景」这一条立据 |
| 2 | Acceptance | 🔴 | 验收行与受影响文件表自相矛盾：`:322`「`dispatch.mjs` / `token-ttl.mjs` / TTL 常量」判「本批边界内零改动」，而 `:302` 给 `token-ttl.mjs` 记「旁列序列化 + restore 读入」＋≈45——按设计实施后 U-BG9 必失败；批档 A5 判据又是第三套（`2026-10-26-pen-gate-batch-scope.md:99`「`dispatch.mjs` / `anyLiveDesignSlot` 判据 / TTL 常量 diff = 0」） | 把 U-BG9 输入列与 A5／`:324` 对齐为「`dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据 ∥ TTL 常量 ∥ `consume-design` 语义」，机检改内容判据（对判据句与 TTL 常量文本比对），不以整档零改动作判据 |
| 3 | Document ownership | 🔴 | 需求档 §5 仍逐条禁止本设计新增的那个字段：`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md:54`「槽记录**不扩字段**（不加批名 / 时间戳等持久化）」并「批列跨重启不可得即如实 `—`」，而 `:23`（F-D7）与 `:25`（F-SL1「批列跨重启可得（F-D7）」）把同一机制写成相反结论；同一机制两处活描述互斥，读者无法判定何者为准（射程读数见批档 `:110`「原读数 = 只取「槽记录不扩字段」半句、漏看主句限定」，但 §5 正文仍逐字点名「批名」，批档 `:113` 亦记「`:54` 那行未动」） | 把 §5 那条边界句收到与 F-D7／F-SL1 同一口径——「批名」从禁列移除，「批列跨重启不可得」改成与 F-SL1 一致的说法，或把「不为恢复便利」的限定写进该句本身；收正后设计档 `:276` 的射程划界只指向一处文本 |
| 4 | Feasibility | 🟡 | 新增槽文件字段的写入／合并路径未落到受影响面：`:274` 把 `engDesignTokenBatches` 与 `engDesignTokens` 并列进同一槽记录，而 F-D3（`requirements:19`「保存 = union 合并（同 key 以新 mint 者胜——expiresAt 比较；槽独有项保留）」）要求保存路径对槽独有项做并集；`:301-306` 四档产品码里没有保存／并集合并面（该面在 `:93` 被点为 `thincoder-core/session-slot-write.mjs:156`（并集 + 同 key 新铸者胜））。旁列若不经该路径携带，一次忙时保存即可写丢归属 ⇒ 收口 no-op ⇒ 凭证留存，正是 §10 要消的窗口（源码本席未读，该面行为 `unverified`） | 明确一句：旁列是否随单一序列化（`engTokenSlotFields`）走全部保存路径；若不是，把合并／保存档补进受影响文件表（现行行数 + 预计 Δ），并加一条「忙时保存后归属仍在」用例 |
| 5 | Requirements | 🟡 | 无归属槽的残余敞口未划界：`:289` 只覆盖「旁列上线前的槽在 7 天 TTL 内自然过期」，同档 `:272`「不含（或路径不可解析）⇒ 归属 = 无（不猜）」——上线后每次文档集不含批档的评审同样铸出永不收口消费的槽，`:270` 的「在任一时点 ≈「有未收口的批」」仍被这类槽撑开至 TTL，与批档 `:24`「手上握着 8 个更早批次的已批准槽」同形，只是被兜底限住 | 在 §10 点名这一类（谁铸出、闸被撑开多久、如何观测——例如清点「批」列 `—` 的计数即观测量），或给出「工程模式评审必带批档」的依据；其一即可让「≈」可审 |
| 6 | Affected-file size | 🟡 | `batch-lifecycle.mjs` 556 → ≈601 已越 500 软线，设计只做事实登记而无拆分计划：`:308`「拆分不在本批（越线事实登记，台账归主 agent）」 | 补一句拆分计划（哪一刀切开——收尾链门 ∥ 各段写手——及触发条件与行数），或写明 601 行下不拆的具体理由，使越线判定在档内自足 |
| 7 | Clarity / doc-state | 🟡 | 同一档内两套「现行」读数：§9 `:198`「（271 行）」＋`:228`「（→ **245** 实读」按 271 为现行，§10 `:301`「\| 245 \| +≈30 \|」按 245 为现行（批档 `:83` 同 245）；清点核坐标亦两处不一（§9 `:198`「`executeDesignSlotsAction` `:102`」∥ §10 `:293`「（`thincoder-core/agent-tools/design-slots.mjs:91` 起）」）。实施席无法判定 Δ 从哪个基线量（正确行数本席未读，`unverified`；此处只判档内自相矛盾） | 把 §9 已落地那段收成改后态（或标明读数轮次），并给清点核一个坐标；一个文件只留一个「现行」 |
| 8 | Document ownership | 🟡 | 改动改了 `batch close` ／ `status §1→已收口` 的行为，但未点名拥有该主题的设计档：仓库内存在 `docs/core/design/BATCH-RECORD.md`（本席仅列表实证其存在，内容未读——超范围），而设计档落点（批档 `:66`）与边界表（`:338`）只提凭证结算档 | 说明收口通路语义是否已由 `docs/core/design/BATCH-RECORD.md` 反向指向本档；若没有，补一条交叉引用，避免收口语义只在一处有描述 |
| 9 | Existing-piece | 🟡 | 五个新名字缺三问答案（`existing: …` ∥ `none found: …` ∥ `existing but unusable: …`）：`:274`「`engDesignTokenBatches: { abs)`」，`:287`「单列 `[design tokens]` 一行」——回执标签与旁列载体是否有既成约定未答 | 逐名补一行三问答案，尤其回执标签与旁列载体：有则用既有（`existing: …`），无则记 `none found: …` |
| 10 | Branch provenance | 🟡 | 三处新增分支未点名场景出处：`:272` 的「不含（或路径不可解析）⇒ 归属 = 无（不猜）」、`:286` 的「非工程模式收口（普通模式批档）⇒ 直接 no-op，不报错」与「无匹配 ⇒ no-op（重开后再 close 亦如此）」、`:283` 的「分隔符归一 + Windows 盘符 / 大小写归一」——档内未给观察读数／日志行／复现路径（旧槽那条有出处：批档 `:24`） | 每条分支后加一句场景出处（真实观察引用或一条可复现命令）；拿不出出处的分支删掉 |
| 11 | Clarity | 🔵 | 两个调用点只给符号不给坐标：`:280`「与既有收口重锚 `reanchorOnClose` 同一处」＋「`closeBatchRecord` 与 `status` 的「§1 → 已收口」两路各一处」；而 `:282` 的位置判据（「全部既有拒因（身份 ∥ 冻结 ∥ 链完整性门 ∥ 文档机检门）通过**之后**」）取决于文档机检门在 `closeBatchRecord` 之内还是之外 | 补两处坐标，并注明与文档机检门的先后关系 |
| 12 | Acceptance | 🔵 | A5 的机检命令在无 git 的树里跑不了：批档 `:99`「`git diff --stat` 复核」（本次评审环境即报 No git repository detected） | 换成内容判据（对放行条件句 / `anyLiveDesignSlot` 判据 / TTL 常量做文本比对或 grep = 0 命中），使 A5 与 A1–A4 一样可跑 |

**核对通过项**：最相近先例行（`:293`，含坐标 + 对齐 + 两项偏差 + 偏差理由）· 公开源核查行（`:295`，`index.publicRepos` = `[]` 如实记录）· token 值形零改的理由（`:274`／KD-BG1 `:332`）与 §1 裁定一致 · §2 声明收正的 §9 五处（`:142` `:151` `:192` `:198` KD-SL2 `:259`）逐处已在档 · 验收不用全量套件（只跑改面单测档）。

计数：🔴 3 · 🟡 7 · 🔵 2。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象（轮次 2——修正复评）**：口径 = 只核轮次 1 的 3🔴 + 7🟡 + 2🔵 逐条落地（本轮声明限定：不捕新问题）。范围 = 批档 §2 修正轮落定段 ∥ D 档 §10 及其受影响面 ∥ 需求档 `:23`–`:25` / `:54` ∥ `docs/core/design/BATCH-RECORD.md` §4.13。

源码行数 / `test/RTM.md` 内容未 spot-check（两处均在评审文档范围之外 ⇒ `unverified`）；本次评审上下文仍无 `docs/README.md` 文档地图与项目标准档 ⇒ 文档归属判定按文件名 + AGENTS.md 指引降级。

**轮次 1 十二条落点核对（本轮实读）**

| # | 轮次 1 级 | 落点 | 结论 |
|---|---|---|---|
| 1 | 🔴 集成测试设计 | D 档 `:328` 新增「集成测试设计（从 `test/RTM.md` 起读）」：破行 = 无（故事 7 普通模式夹具 ⇒ 消费步 no-op，逐字不变）`:332` · 冗余 = 无 `:333` · 缺失 = CLI 新故事 10 两行 `:334`；两行 `10-1` / `10-2` 于 `:338`–`:339`，每行具交互组件 ∥ 业务可观测结果 ∥ 进入口（父侧经 `batch` 工具收口）∥ 回指 F-D7 ∥ F-D8；编号落点 = `test/RTM.md` + 用例档 `:341`；受影响表补 `test/RTM.md` `:353` ∥ `test/integration/batch-close-token-consume.test.mjs` `:354` | 落地 |
| 2 | 🔴 U-BG9 与受影响表相抵 | U-BG9 改四段内容判据（放行条件句 ∥ 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句），机检 = 写死期望串逐字比对、不靠 git `:377`；A5 同口径 + A6 新增 `:380`；批档侧 `:134`「A5 判据收正（覆盖本节 `:99` 那行的命令）」——`git diff --stat` 不再是任何 AC 命令 | 落地 |
| 3 | 🔴 需求档 §5 互斥 | 需求档 `:54` 已收正：逐字「**批归属的旁列（F-D7）不属本条射程**」；「不加批名」与「批列跨重启不可得」两处逐字在本档已零命中（grep 实读）；F-D7 `:23` / F-D8 `:24` / F-SL1「批列跨重启可得（F-D7）」`:25` 三链齐；D 档射程段改写为引收正后那句、正文单源归需求档 `:288` | 落地（同一机制不再有两处活描述） |
| 4 | 🟡 保存 / 合并路径 | D 档 `:282` 「保存 / 合并路径（旁列必须对位的三处）」= `engTokenSlotFields` ∥ `persistEngTokens`（`:284`）∥ 新 `mergeEngTokenBatchesForSave`（`:284`）；并集规则 + 理由 `:286`；受影响表补 `session-slot-write.mjs`（240 行，+≈18）`:351`；U-BG10 `:378` | 落地 |
| 5 | 🟡 无归属槽敞口 | D 档 `:306` 点名两类 + 谁铸出（`review-facts.mjs:56-58` 无强制面）；后果 = 撑开至 7 天 TTL（`design-token.mjs:36`）；观测量 = 清点面 `batch=—` 行数 `:308`；「≈」明写为近似 `:310` | 落地 |
| 6 | 🟡 越软线无拆分计划 | D 档 `:357` 越线登记（556 → ≈581）+ 触发条件 `:359`（下次触及即拆 ∥ ≥700）+ 切法 `:361`（收口链 → `batch-closeout.mjs`；共享解析 → `batch-read.mjs`）+ 本批不拆理由 `:363` | 落地 |
| 7 | 🟡 两套现行读数 | §9 收成单一现行：`design-slots.mjs`（245 行）`:198`、清点核 `:91` / 消费核 `:123` / 并集 `:30` / 批列 `:42` / basename `:54` / 行拼装 `:111` 在 `:144` ∥ `:157` ∥ `:198` 同值；§10 受影响表同按 245 `:347` | 落地（档内单一基线） |
| 8 | 🟡 收口语义拥有档 | `docs/core/design/BATCH-RECORD.md:308` 反向引用逐字在：「设计凭证消费（工程模式）…消费失败 ⇒ 拒 close（档零字节变）；口径单源 = …§10，本档不复述」；与同节 `:306`（机检门先于状态行）∥ `:313`（重锚在落盘之后）无冲突 | 落地 |
| 9 | 🟡 五个新名字三问 | D 档 `:318` 三问表五行（`existing:` / `existing but unusable:` / 回执标签 `existing:` 三形齐）；`consumeBatchDesignTokens` 收为薄壳——`:325`「⇒ 复用（KD-BG6）；本名只剩「按批反查 designId 集」的薄壳」，本体四步 ④ 调既有核 `:294`、受影响表记「薄壳 + 两通路调用点 + 回执段」`:350`、KD-BG6 `:393` 三处同口径（设计层收敛成立，无第二份落盘 / 回滚逻辑） | 落地 |
| 10 | 🟡 三处分支缺出处 | 不含批档 `:276`（清点面既有降级 + 复现步骤 `:278`）· 匹配归一 `:299`（`normAbs` 绝对输入原样保留 + `documents` 两写法 + Windows 大小写不敏感）· 无匹配 no-op `:302`（重开通路 `batch-lifecycle.mjs:455-466`）· 普通模式 no-op `:303`（模式位实读 `:405-406`；普通模式批无槽 `design-slots.mjs:93-95`）——四支均有出处 | 落地 |
| 11 | 🔵 调用点无坐标 | `:296` 两处坐标（`closeBatchRecord` `:500` 内机检门 `:512-513` 之后、写 `:515` 之前；`statusBatchRecord` `:404` 内 `:475-476` 之后、写 `:477` 之前）+ 与机检门先后 `:297`（且与 `reanchorOnClose` 位次相反） | 落地 |
| 12 | 🔵 A5 命令不可跑 | A5 机检 = U-BG9 四段文本比对 `:380`；D 档验收命令 = 改面单测单档 `:382`（集成用例归父侧收口，不入本批验收命令）；D 档全文 `git diff` 零命中（grep 实读） | 落地 |

**核对通过项（本轮）**：最相近先例行 `:314` ∥ 公开源核查行 `:316` 原样在位；token 值形零改的理由与 §1 裁定一致 `:280`；受影响表 9 行齐（产品码 5 行均带现行行数 + 预期 Δ `:347`–`:351`，`.md` 两行按豁免不需 Δ）；越线档带拆分计划；验收不喊全量套件；集成节每行四要素齐（组件 / 业务结果 / 进入口 / 回指）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size / citation | 🔵 | 受影响表第 6 行把本档自身记为「现行 338」，本轮实读该档为 397 行（修正轮新增 `:288` 射程段与 `:328`–`:341` 集成节后未随动）；`.md` 档按口径豁免 Δ 标注，故不构成判据缺口，仅数字滞后 | 下一轮触碰该表时把第 6 行读数改为「本节」或实读值，避免实施席按 338 量 Δ |
| 2 | Acceptance (record face lag) | 🔵 | 批档 §2 的 AC 表只有 A1–A5（`:95`–`:99`），而 D 档 `:380` 已定义 A1–A6（A6 = U-BG10 合并面）；批档 `:124` 已登记 U-BG10 但未映射到 A6——按 D > 记录的层序取 D 档为准，非缺陷 | 收口核对 A6 时按 D 档 `:380` 取判据；或下一次 §2 追加时补一行 A6 映射，使记录面自足 |

计数：🔴 0 · 🟡 0 · 🔵 2。轮次 1 的 12 条（3🔴 / 7🟡 / 2🔵）本轮逐条核对为已落地，无残留阻断项。

VERDICT: pass

### 轮次 3（评审子代理）

**评审对象（轮次 3——实施后设计变更复核 + 轮次 1 的 12 条逐条复评）**：口径 = ① 零调用点如实登记（`mergeEngTokenBatchesForSave` 与 `mergeEngTokensForSave` 同形、核内均零调用点、A6 收窄纯函数面）∥ ② 收口面 fail-closed（`unionBatches(agent,{strict:true})` 读失败即抛 ⇒ close 拒；清点面保留 `catch ⇒ null`）∥ ③ 三项漂移收正（受影响表实测行数 305/345/200/611/260 ∥ §9 六处坐标 ∥ settle 删旧旁列行分支入档）。

范围 = 三档（批档 ∥ D 档 §9/§10 ∥ 需求档 `:23`–`:25` / `:54`）

本轮修正脚本四支（`.thincoder/tmp/fix-req-ps-712.mjs` ∥ `.thincoder/tmp/fix-clp-bare.mjs` ∥ `.thincoder/tmp/fix-pgs-sec3.mjs` ∥ `.thincoder/tmp/split-pgs-189.mjs`——前两支改的是 `docs/core/requirements/PROMPT-SYSTEM.md` 与 `2026-10-26-common-layer-principles.md`，与本批 12 条无关，仅作变更集存证）。

源码行数与 `docs/core/design/BATCH-RECORD.md` 内容未读（均在评审文档范围之外 ⇒ `unverified`）；本轮上下文仍无 `docs/README.md` 文档地图 ⇒ 文档归属判定按文件名 + AGENTS.md 指引降级。

**三轮裁定落地核对（本轮实读）**：① 登记 `D 档:292`「核侧 `thincoder-core/session.mjs:184` 为整档覆盖写，两函数在核内均无调用点」+ `:294` + A6 纯函数面 `:394` ⇒ 落地。

② `D 档:304`「**收口面用严格形**…`unionBatches(agent, { strict: true })`」+ `:305` 边界段 + U-BG11 `:392` / A4 `:394` ⇒ 落地。

③ 受影响表 `:358`–`:362` = 305/345/200/611/260 实读、§9 六坐标 `:198`（清点核 `:150` ∥ 消费核 `:183` ∥ 并集 `:36` ∥ 批列 `:60` ∥ basename `:81` ∥ 行拼装 `:171`）、`:276` 删旧旁列行 + 分支出处 ⇒ 落地。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | D 档 §10 | 🔴 | Fixed | `:339`「**集成测试设计（从 `test/RTM.md` 起读）**」+ 破行/冗余/缺失 `:341`–`:345` + 两行 `10-1`/`10-2` `:347`–`:350`（交互组件 ∥ 业务可观测结果 ∥ 进入口 ∥ 回指 F-D7/F-D8 四要素齐）+ 落点 `:352` + 受影响表 `:364`–`:365`；`test/RTM.md` 存在（glob 实证）。破行=无 的论据（故事 7 夹具普通模式）以批档 `:257` 的 7-1/7-2/7-3 回归 3/3 为例证，源码/夹具未读 ⇒ 该论据 `unverified` |
| 2 | 2 | D 档 §10 | 🔴 | Fixed | `:390` U-BG9 改四段内容判据（放行条件句 ∥ 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ 选择器句）、「期望串写死在测试里；不靠 git」；A5 同口径 `:394`；批档 `:134` 明写覆盖 `:99` 那行的命令 ⇒ 与 `:359`（`token-ttl.mjs` +39）不再相抵。记录面 `:99` 仍留 `git diff --stat` 字面，以 `:134` 显式取代（D > 记录层） |
| 3 | 3 | 需求档 | 🔴 | Fixed | `:54` 现文「**批归属的旁列（F-D7）不属本条射程**」；禁列改「（时间戳 / 恢复索引等持久化）」，「不加批名」与「批列跨重启不可得」两处字面已不在；与 `:23` F-D7、`:25` F-SL1「批列跨重启可得（F-D7）」同口径 ⇒ 同一机制不再有两处活描述 |
| 4 | 4 | D 档 §10 | 🟡 | Fixed | `:284` 三处对位（`engTokenSlotFields` ∥ `persistEngTokens` ∥ `mergeEngTokenBatchesForSave`）+ `:288` 并集规则 + 受影响表 `:362`（`session-slot-write.mjs` 260 / +20）+ U-BG10 `:391`。父侧裁定收窄为纯函数面并在 `:290`–`:294` 如实登记（核内零调用点、端面未接线）⇒ 理由成立，A6 `:394` 已按此措辞。代码事实本席未读 ⇒ `unverified` |
| 5 | 5 | D 档 §10 | 🟡 | Fixed | `:317` 两类无归属槽（旧槽 ∥ 上线后文档集不含批档的评审）+ 谁铸出（`review-facts.mjs:56-58` 无强制面）+ 撑开至 TTL（7 天，`design-token.mjs:40`）+ 观测量（`batch=—` 行数）+ `:321`「「活槽 ≈ 有未收口的批」是近似」明写偏差与上限 |
| 6 | 6 | D 档 §10 | 🟡 | Fixed | `:372` 触发条件（下次触及即拆 ∥ ≥700）+ `:374` 切法（收口链 → `batch-closeout.mjs`；共享解析 → `batch-read.mjs`）+ `:376` 本批不拆理由 |
| 7 | 7 | D 档 §9/§10 | 🟡 | Fixed | 单一基线：`:198`「（305 行）」∥ `:228`「\| **305** \| ±0（§9 面；§10 本批另 +60）」∥ `:358` 305；清点核坐标 §9 `:198` `:150` ∥ §10 `:325` `:150` 同值 |
| 8 | 8 | 批档 §2 | 🟡 | Unfixed | 证据未验证：落地声明在批档 `:128`「`docs/core/design/BATCH-RECORD.md` §4.13 新增反向引用（… `docs/core/design/BATCH-RECORD.md:308`）」，而该目标档不在本轮评审范围（只读了存在性）⇒ 本轮无法核准其正文 |
| 9 | 9 | D 档 §10 | 🟡 | Fixed | `:329`–`:337` 五行三问表齐（`existing:` / `existing but unusable:` / 回执标签 `[design tokens]` 对齐 `[ledger reanchor]`），`consumeBatchDesignTokens` 收为薄壳 `:336` + KD-BG6 `:407` |
| 10 | 10 | D 档 §10 | 🟡 | Fixed | 四支均有出处：`:278`（不含批档，清点面既有降级 + `:280` 复现步骤）· `:310`（匹配归一）· `:313`（无匹配 no-op，重开通路 `batch-lifecycle.mjs:466-471`）· `:314`（普通模式，模式位实读 `:414`、普通模式批无槽 `design-slots.mjs:152-154`）· `:276`（settle 派生为无 ⇒ 删旧行 + 复评场景） |
| 11 | 11 | D 档 §10 | 🔵 | Fixed | `:307` 两处坐标（`closeBatchRecord` `:507` 内机检门 `:519-520` 之后、写 `:524` 之前；`statusBatchRecord` 内 `:480-481` 之后、写 `:484` 之前）+ `:308` 与 `reanchorOnClose` 位次相反的说明 |
| 12 | 12 | D 档 §10 / 批档 | 🔵 | Fixed | `:390` 不靠 git；`:396` 验证命令 = `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs`；批档 `:134` 宣告 `git diff --stat` 不再是任何 AC 命令 |
| 13 | (new) | D 档 §10 | 🟡 | New: 严格读的两句需锁死判据。`:304`「同一取槽 / 解析前段，只把 `catch` 段改为抛」与 `:305`「**严格读的边界**：无槽文件 ∥ 无该字段 = 空集（合法缺省」并存：若「无槽文件」也走同一个 `catch`，按 `:304` 改抛会把「没有」判成「读不到」⇒ 无槽文件的新会话首次 close 被误拒；若两者本就走不同前段，则两句相容。两读均文本可行 | 一句话写明区分判据（仅「文件不存在 / 字段缺失」⇒ 空集，其余 I/O 错 ⇒ 抛），并补一条「干净会话（无槽文件）close 照常收口」用例，使 `:304` 的机制句与 `:305` 的边界句只留一种读法 |
| 14 | (new) | D 档 §9 | 🔵 | New: 同一表内两行读数姿态不一致——`:198`「本节改动已落地——无待改项」与 `:228`「\| **305** \| ±0（§9 面…）」按落地后记，而 `:229` 仍记「\| **416** \| −2（→ **414** 实读」；若 §9 那批已落，`subagent.mjs` 现行为 414、该行「现行 416」即为改前值 | 下一轮触碰该表时把 `:229` 也收成落地后读数（或标明「改前 → 改后」列名），与 `:228` 同姿态 |

计数：🔴 0 · 🟡 1（新增 13）· 🔵 1（新增 14）· 原 12 条 = 11 Fixed + 1 Unfixed（#8，证据未验证，🟡 不阻断）。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-26（用户：「**可以，后续自动跑完**」02:11）

**批准依据**：评审 `#12`（round 3）= **pass**（🔴 0 · 🟡 1 · 🔵 1，均已处置）；实施 `#14` / `#19` / `#24` 三轮全绿；设计修正 `#10` / `#16` / `#22` / `#27` 四轮。

**批准范围**：E1 凭证带批（旁列 `engDesignTokenBatches`）+ E2 收口自动消费（close ∥ status→已收口 两通路、写状态行之前、失败拒关批）+ fail-closed 严格读（`ENOENT` 才判「没有」）+ `loadManifest` 两形 + U-BG1–U-BG15。

**不在范围**：`dispatch.mjs` 放行条件 · `anyLiveDesignSlot` 判据 · TTL · `consume-design` 选择器 · 轻通道面。

## §5 实施记录（eng-coder）
**状态行**：实施完成



**实施结论**：E1（凭证带批次）+ E2（收口自动消费）按设计档 §10 全量落地；A1–A6 逐条有对应用例（下表）。禁改面（`dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` ∥ `consume-design` 选择器句）逐字零变，由 U-BG9 内容判据机检（不靠 git）。

**逐档改动（行数口径 = 末行行号，本轮实读；改前 = 设计档受影响表读数）**

| # | 文件 | 改了什么 | 改前 → 改后 |
|---|---|---|---|
| 1 | `thincoder-core/token-ttl.mjs` | `engTokenSlotFields` 增 `engDesignTokenBatches`；`restoreEngTokens` 同拍读入旁列；新增轻读 `readEngTokenBatchesFromSlot`；`persistEngTokens` 逐字段复制（空表 ⇒ 删字段） | 306 → 345 |
| 2 | `thincoder-core/agent-tools/design-slots.mjs` | 新增 `batchAbsPath`（docSetKey → 批档绝对路径；**多份不同批档 ⇒ 归属 = 无，不猜**）· `batchPathKey`（分隔符归一 + win32 大小写不敏感）· `unionBatches`（内存 ∪ 旁列，槽为准 D-S3 同源）；`unionSlots` 转导出（收口消费计数复用）；清点「批」列改读旁列、注册表兜底 | 245 → 304 |
| 3 | `thincoder-core/agent-tools/design-token.mjs` | `settleDesignReview` 同拍写旁列；文档集不含批档 ⇒ 删该 designId 旧行（防改范围复评继承上一轮归属） | 184 → 200 |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | `consumeBatchDesignTokens`（四步：非工程模式 no-op ∥ 反查 ∥ 空集 no-op ∥ 复用 `executeConsumeDesignAction({designIds})`）+ `unattributedSlotCount` + `designTokensReceiptLine`；`close` 与 `status §1→已收口` 两通路各一处调用点（位次 = 全部拒因之后、状态行写盘之前） | 556 → 611 |
| 5 | `thincoder-core/session-slot-write.mjs` | 新增纯函数 `mergeEngTokenBatchesForSave`（槽独有项保留 + 同 key 新写者胜） | 240 → 260 |
| 6 | `test/RTM.md` | 新增 CLI 端故事 10「收口即清账」两行（10-1 ∥ 10-2，结果 = 待执行，父侧收口跑集成） | 86 → 148（含前序未提交批次的故事 8 ∥ 9） |
| 7 | `test/integration/batch-close-token-consume.test.mjs` | 新建：集成用例 10-1 ∥ 10-2 | 新建 158 |
| 8 | `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | 新建：U-BG1–U-BG10 全组（U-BG8 扩「多份批档 ⇒ 不猜」两支） | 新建 320 |

**验收对照（A1–A6 = 设计档 §10「验收」；命令 = 当批单测档）**

| AC | 用例 | 读数 |
|---|---|---|
| A1 | U-BG1 ∥ U-BG8 | ✅ 旁列 = 批档绝对路径；token 仍两段；`restoreEngTokens` ∥ `readEngTokenBatchesFromSlot` 读回；无批档 / 多份批档 ⇒ 无条目且清点 `batch=—` |
| A2 | U-BG2 ∥ U-BG3 ∥ U-BG6 | ✅ `close` 与 `status` 两通路都消费本批全部槽；它批一枚值零动 |
| A3 | U-BG4 | ✅ 旧槽不消费、仍在盘；回执「留槽无归属 1 枚」 |
| A4 | U-BG5 | ✅ 落盘注入失败 ⇒ close 拒、§1 字节不变、内存回滚、可重试 |
| A5 | U-BG9 | ✅ 四段判据文本逐字等于改动前快照 |
| A6 | U-BG10 | ✅（限定，见下「上抛 1」）合并规则面五条断言；保存路径接线不在本批受影响文件面 |

**验证读数（本轮亲跑）**

- 当批单测：`node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` ⇒ 10/10 pass（U-BG1–U-BG10）。
- 集成用例：`node --test test/integration/batch-close-token-consume.test.mjs` ⇒ 2/2 pass（10-1 ∥ 10-2）。
- 回归（收口通路既有用例）：`node --test test/integration/batch-close-gate.test.mjs` ⇒ 3/3 pass（7-1 ∥ 7-2 ∥ 7-3 未受新增步骤影响）。
- 语法：`node --check` 七个改动 / 新建 `.mjs` 全过。

**审查轮次与终态**

| 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|
| 自查 | 逐档读回（改后全文） | — | 修 1 处自引坐标（避免行号漂移） |
| 内部审计（explore，只读对齐设计） | 批档 §2 ∥ 设计档 §10 ∥ 八个改动档 | pass（1 🟡 + 1 🔵，无 🔴） | 🟡 = 下述上抛 1；🔵 = 设计档 §9 的行号坐标随插入漂移（设计席笔，本席零触） |
| 内部代码评审（advisor `type=code`） | 同面 + `test/RTM.md` | pass（0 🔴 · 4 🟡 · 5 🔵） | 自修 1 轮：① 归属不唯一 → 改「不猜」（评审 #2）+ 用例补两支；② `batchAbsPath` 直测补上（评审 #6）；③ 环约束写进 `design-slots.mjs` 头注（评审 #8）。其余 3 🟡 为设计面 / 记录面项，列上抛不动代码（理由逐条见下） |

**终态：clean**（自修 1 轮后全绿；无 🔴 开口）。

**上抛项**

1. **[上抛·待裁] `mergeEngTokenBatchesForSave` 生产零调用点**（审计 🟡 ∥ 评审 #1）——设计与本席都只做到「同位置新增纯函数」，但 `session.mjs` 的 `saveSession` 仍是整档覆盖写（内存快照 ⇒ `engTokenSlotFields`），故 KD-BG7 要消的「忙时保存写丢归属」只有纯函数级证据。两条候选处置：①把它接进真正写槽的保存面（`session.mjs` ∥ 端面板写面——均在本批受影响文件表之外，需另行批准）；②在设计档写明「CLI 常驻单对象保存无须并集，该函数为端面 / 防御面保留」，并接受 A6 = 纯函数面。本席未自行接线的理由：越出设计档 §10 受影响文件表 = 无人批准的口径变更。
2. **[上抛·待裁] 槽文件不可读与「旁列缺席」同判**（评审 #3）——`readEngTokenBatchesFromSlot` 的 `catch ⇒ null` 让收口面在「旁列只在盘上 ∧ 盘不可读」双条件下 fail-open（close 落「已收口」而凭证仍在）。候选：收口面改严格读（抛 ⇒ close 拒）。本席未改的理由：轻读形是设计档 §10 三问表明选的 `existing but unusable` 同形兄弟，改其错误语义需设计席一句裁定。
3. **[上抛·知会] 设计档 §9 的代码坐标已随本批插入漂移**（审计 🔵）——`design-slots.mjs` 现值：清点核 `:142` ∥ 消费核 `:175` ∥ 并集 `:33` ∥ 批列 `:57` ∥ basename `:78` ∥ 行拼装 `:163`；设计档 `:206` 已声明坐标是设计读数时点、判据以内容机检为准，故不动本席笔。
4. **[上抛·知会] 三个已登记的形态事实（本批不修）**：①消费不清旁列行——已消费 designId 的旁列行留痕（`removeDesignTokenSlot` 只删槽表），旁列随评审次数单调增长但无授权面影响（designId 不复用；重开再收口落 `消费 0 枚` 幂等）；②`settleAdvisorRun` 落盘失败时只回滚槽表、不回滚旁列（`advisor-settle.mjs` 在本批受影响表外），残留行对消费面是 no-op；③`design-token.mjs` ⇄ `design-slots.mjs` 同为静态环（两侧只在函数体内互用，求值期零顶层调用 ⇒ 安全；约束已写进两档头注）。
5. **[上抛·知会] 行数面**：`batch-lifecycle.mjs` 556 → **611**（设计预计 ≈581，Δ+≈25 vs 实际 +55），仍低于拆分触发线（≥700）与硬限 800；设计档受影响表若沿用 581 量 Δ 会偏，是否收正归设计席。

**修正轮（父侧 2026-10-26 裁定 · 评审 §3 轮次 3 的 🟡13 + 🔵14）——收口面严格读**

**改动（三处代码 + 三例；坐标 = 本轮末次实读）**

| # | 坐标 | 改了什么 |
|---|---|---|
| 1 | `thincoder-core/token-ttl.mjs:216-240` | `readEngTokenBatchesFromSlot(agent, { strict = false })` 两形同源。判据 = 「没有」与「读不到」分判：无槽号 ∥ `readFileSync` 抛 `ENOENT` ∥ 无 `engDesignTokenBatches` 字段 ⇒ `null`（空集、不抛，两形同）；其余 I/O 错（`EACCES` ∥ `EISDIR` ∥ `EIO`…）∥ `JSON.parse` 失败 ⇒ 宽容形 `null` / 严格形抛（`Error` 携槽文件路径 + 底层消息）。判别用 `e?.code === "ENOENT"`；不用 `existsSync` 兜底（它把权限错吞成「不存在」）。 |
| 2 | `thincoder-core/agent-tools/design-slots.mjs:47` | `unionBatches(agent, { strict = false })`：`strict` 透传到读函数（`:51`）；缺省 = 清点面宽容，`:157` 调用点零改。注释按「净零行」改写 ⇒ §9 六坐标零漂移（见下「行数与坐标」）。 |
| 3 | `thincoder-core/agent-tools/batch-lifecycle.mjs:561` | `consumeBatchDesignTokens` 反查改 `unionBatches(agent, { strict: true })`；两调用点位次不变——`status`：机检门 `:480-481` → 消费 `:483` → 写 `:484`；`close`：机检门 `:519-520` → 消费 `:522` → 写 `:524`。无 try/catch 吞 ⇒ 读失败即两通路被拒（档零字节变、可重试）。 |

**用例（三条，均在当批单测档）**

- `U-BG11`（错误 · 两支）：截断槽文件（`JSON.parse` 失败）∥ 槽位换成目录（`EISDIR`，非 `ENOENT` 的 I/O 错）⇒ close 被拒、§1 状态行字节不变、槽文件字节不变（零消费）；槽文件恢复可读后同一 close 成功（可重试）。支二断言 = 语义判据「拒因含 `could NOT be read` ∧ 不含 `ENOENT`」，不把判据钉在宿主错误码上。
- `U-BG12`（边界 · 干净会话）：无槽文件 ⇒ close 照常收口、回执「消费 0 枚 · 留槽无归属 0 枚」、不铸槽文件。
- `U-BG13`（边界 · 旧槽形）：槽文件在盘、有槽表、无 `engDesignTokenBatches` 字段 ⇒ 空集不抛、消费 0、留槽无归属 1、旧槽零消费、不凭空铸旁列。

U-BG12 ∥ U-BG13 = 评审 🟡13 的反向守卫：把「没有」判成「读不到」时两例立刻红。

**验证读数（本轮亲跑）**

| 面 | 命令 | 结果 |
|---|---|---|
| 当批单测（本批验收） | `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | **13/13 pass**（U-BG1–U-BG13） |
| A5 禁改面（四段内容判据） | `node --test --test-name-pattern=U-BG9 docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | **1/1 pass**——放行条件句 ∥ 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ 选择器句逐字等于快照 |
| 集成回归（收口通路） | `node --test test/integration/batch-close-token-consume.test.mjs` | 2/2 pass（10-1 ∥ 10-2） |
| 集成回归（收口门） | `node --test test/integration/batch-close-gate.test.mjs` | 3/3 pass（7-1 ∥ 7-2 ∥ 7-3） |
| 语法 | `node --check` 三档 + 单测档 | 全过 |

**审查轮次与终态**

| 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|
| 内部审计（explore · 只读） | 三件要求 ∥ 禁改面 ∥ 三例 | pass（0 🔴 · 0 🟡 · 2 🔵） | 两条 🔵 均属设计档跟随项，本席零触 |
| 内部代码评审（advisor `type=code`） | 三档 + 单测档 + 设计档 / 批档 | pass（0 🔴 · 5 🟡 · 3 🔵） | 自修 1 处（U-BG11 支二的 `EISDIR` 断言改语义判据）；其余逐条列下，均非 must-fix |

**终态：clean**（0 🔴；自修 1 处后 13/13 ∥ 2/2 ∥ 3/3 全绿）。

**行数与坐标（🔵14 答复 · 本轮实读）**

- `design-slots.mjs` = **305 行**（与上一轮读数同——本轮净零行），§9 六坐标零漂移：并集 `:36` · 批列 `:60` · basename `:81` · 清点核 `:150` · 行拼装 `:171` · 消费核 `:183`（`unionBatches` `:47` 与设计档 §10 同位）。
- `token-ttl.mjs` = **363 行**（上一轮读数 345）：`engTokenSlotFields :117` · `restoreEngTokens :139` · `readEngTokensFromSlot :192` · `readEngTokenBatchesFromSlot :216`（设计档 §10 引 `:210`）· `anyLiveDesignSlot :275` · `persistEngTokens :297`。
- `batch-lifecycle.mjs` = **612 行**（上一轮读数 611）：`consumeBatchDesignTokens :558`（设计档 §10 引 `:557`）；两通路坐标见上表第 3 行。
- `thincoder-core/session-slot-write.mjs` 260 ∥ `thincoder-core/agent-tools/design-token.mjs` 200 —— 零触，与设计档一致。

**上抛项**

1. **[上抛·知会] 设计档 §10 未随本轮回写（设计席笔，本席零触）**：①用例表末行 = U-BG11、受影响表仍记「当批单测 U-BG1–U-BG11」、A4 = U-BG5 + U-BG11——而单测档头注以「用例表 U-BG1–U-BG13」为权威，U-BG12 ∥ U-BG13 在权威档无编号、无验收回指；②`:304` 机制句仍是「同一取槽 / 解析前段，只把 `catch` 段改为抛」，未记内层 `ENOENT` 短路（代码现为两级 catch）；③设计档四处代码坐标随本轮 +行漂移（见上「行数与坐标」）。
2. **[上抛·知会] 槽号解析层仍是宽容面**：`readEngTokenBatchesFromSlot` 的「无槽号 ⇒ 空集」在 `_slot` 未钉时取 `loadManifest(agent?.cwd)?.active`，而 `loadManifest` 吞错回默认值（`thincoder-core/session-slots-manifest.mjs:111`）⇒ manifest 损坏 ∥ 不可读 ⇒ 无 active ⇒ 严格形返回空集、close 照常落「已收口」。按父侧口径「无槽号 = 空集」属**声明内合法缺省**，故本席未动；口径若收紧，改动点在 `currentSlotNoReadOnly` 外层，归设计席裁定。
3. **[上抛·知会] 收口面同一拍两种读形**：旁列严格（`batch-lifecycle.mjs:561`）而 token 侧仍宽容（`unionSlots` → `readEngTokensFromSlot` 的 `token-ttl.mjs:203`）。稳态两读同源同文件、不分叉；仅当文件在两次读之间转为不可读，才可能落「消费 0 枚」而槽仍在——竞态路径，非确定性开口，本轮不改。
4. **[上抛·知会] 本档 §3 有三处文档纪律命中（非本席笔，会挡父侧 close）**：`doc_check(mode:"report", docs=本档)` 实读 = 锚 1（`:223` 裸名 `docs/core/design/PROMPT-SYSTEM.md` 只写档名 ⇒ 判档缺）∥ 段太长 2（`:223` 668 字符、`:225` 392 字符），三处全在 §3 轮次 3 内。本席写面只有 §5，无法代改；`close` 的文档机检门按整档判 ⇒ 需父侧在收口前把该处改为仓根相对全路径并拆段。

**记录面口径**：本节上方旧的验收对照与验证读数（A4 只记 U-BG5 ∥ 10/10 ∥ 测试档 320 行）是**上一实施轮**的读数，本轮以本段为准（§5 append-only，旧行不改）。

**§5 更正（同轮 · 事实收正）**：上段上抛项 4 的「会挡父侧 close」是推断，实测不成立——两句读数并列如下。

- `batch` 自带门（append 触发）对**本档** = `DOC-CHECK GATE: PASS（0 档）`——本档不在声明域、未被判；`close` 的文档机检门按同一域预期同样不判本档。
- 显式点名本档的 `doc_check(mode:"gate", docs=本档)` = `DOC-CHECK GATE: REFUSED（命中 3 条）`：锚 1（`:223` 只写档名 `docs/core/design/PROMPT-SYSTEM.md` ⇒ 判档缺）∥ 段太长 2（`:223` 668 字符、`:225` 392 字符），三处全在 §3。

⇒ 三处命中**不阻断** `close`，只阻断「显式点名本档」的交付门；修或留由父侧定（§3 非本席写面，本席零触）。

**修正轮（父侧 2026-10-26 裁定 · manifest 层同判 · 判据 = 设计档 §10 `:307`–`:309`）——`loadManifest` 两形 + 收口面接入 + U-BG14**

**改动（三处代码 + 一例；坐标 = 本轮末次实读，行数口径 = 末行行号）**

| # | 坐标 | 改了什么 |
|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs:113` | `loadManifest(cwd, { strict = false } = {})` 两形同源：`ENOENT` ⇒ 默认空账本（`:123`，两形一致）；在盘但读失败 ∥ 解析失败 ⇒ 宽容形照旧吞错回默认，严格形抛（`:125`，携 manifest 路径 + 底层消息）。判别 = `e?.code === "ENOENT"`，**不用 `existsSync`**（它把权限错也吞成「不存在」）。形状非法（可读但解析成 `null` ∥ 非对象）按「读不到」处置，登记于 `:109`。现行调用点全部缺省 ⇒ 零改。 |
| 2 | `thincoder-core/token-ttl.mjs:184` | `currentSlotNoReadOnly(agent, { strict = false } = {})`：`strict` 透传 manifest 读形（`:187`）；`active` 缺席 ∥ 非整数仍是无槽号（合法缺省——「读到了，说没有」）。 |
| 3 | `thincoder-core/token-ttl.mjs:224` | `readEngTokenBatchesFromSlot` 的槽号解析提到 `try` 之外（理由注在 `:222-223`）——manifest 层的拒绝自带 manifest 坐标，不被重包成「旁列读不到」。 |
| 4 | `thincoder-core/agent-tools/batch-lifecycle.mjs:561` | 入场零改：既有两个调用点早已传 `unionBatches(agent, { strict: true })`；本轮之后该 strict 沿 `unionBatches` → `readEngTokenBatchesFromSlot` → `currentSlotNoReadOnly` → `loadManifest` 一路到底 ⇒ manifest 在盘且损坏 ⇒ `close` ∥ `status §1→已收口` 两通路被拒、档零字节变、可重试。位次未挪（`status`：机检门 `:480-481` → 消费 `:483` → 写 `:484`；`close`：`:519-520` → `:522` → `:524`）。 |
| 5 | `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs:397`（末行 440） | U-BG14 两支：① manifest 在盘但缺尾部 `}`（`:410`）⇒ close 拒、拒因 = `session manifest could NOT be read` 且**不得**含旁列读失败串（`:417`——槽号外提的机检）、§1 字节不变、槽文件字节不变（零消费）、修回后同一次 close 成功（`消费 1 枚`）；② manifest 不存在（干净会话）⇒ 照常收口、回执 `消费 0 枚 · 留槽无归属 0 枚`、不铸 manifest。 |

**验证读数（本轮亲跑）**

| 面 | 命令 | 结果 |
|---|---|---|
| 当批单测（本批验收） | `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | **14/14 pass**（U-BG1–U-BG14） |
| U-BG9 禁改面（四段内容判据） | `node --test --test-name-pattern=U-BG9 …test.mjs` | **1/1 pass** |
| U-BG14 单例 | `node --test --test-name-pattern=U-BG14 …test.mjs` | **1/1 pass** |
| 集成 10-1 ∥ 10-2 | `node --test test/integration/batch-close-token-consume.test.mjs` | **2/2 pass** |
| 集成 7-1 ∥ 7-2 ∥ 7-3 | `node --test test/integration/batch-close-gate.test.mjs` | **3/3 pass** |
| 相邻集成（回归抽跑） | `batch-anchor-create` ∥ `unbooked-pen` | 2/2 ∥ 3/3 pass |
| 语法 | `node --check` 三档 | 全过 |
| 两形直测（临时域探针，已清） | `loadManifest` 四输入 × 两形 | ENOENT ⇒ 两形同默认；在盘损坏 ⇒ 宽容默认 / 严格抛（点名 manifest 路径）；可读而 `active` 缺席 ⇒ 默认、无槽号；正常 ⇒ 照读。旁列读：宽容 `null`、严格抛 manifest 串（未被重包成旁列串） |

**行数（本轮实读）**：`session-slots-manifest.mjs` 247 → **264**（设计档预估 ≈257）· `token-ttl.mjs` 363 → **370** · 当批单测档 **440**（设计档受影响表记 394，见上抛 2）· `batch-lifecycle.mjs` 612 ∥ `design-slots.mjs` 305 ∥ `design-token.mjs` 200 ∥ `session-slot-write.mjs` 260 零触。

**审查轮次与终态**

| 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|
| 内部审计（explore · 只读） | 三件要求 ∥ 禁改面 ∥ U-BG14 敏感度 | pass（🔴 0 · 🟡 1 · 🔵 4） | 🟡/🔵 多为设计档跟随项；补 1 处本席面 = U-BG14 加「不得被重包成旁列读失败」断言（审计指出 hoist 无守卫） |
| 内部代码评审（advisor `type=code`） | 三档 + 设计档 / 批档 | pass（🔴 0 · 🟡 2 · 🔵 5） | 自修 1 轮：① 截断构造由位置切片改为去尾 `}`（🔵5——不随夹具长度漂）；② `session-slots-manifest.mjs:109` 补「形状非法按读不到处置」登记（🔵3）。其余 2 🟡 为用例 / 记录面建议，列上抛不动代码 |

**终态：clean**（🔴 0；自修 1 轮后 14/14 ∥ 2/2 ∥ 3/3 全绿）。

**上抛项**

1. **[上抛·待裁] U-BG14 的覆盖建议（评审 🟡1——超出本轮用例定义，本席未加）**：两条在设计档判据内、但无用例守卫的输入——(a) manifest 可读且合法而 `active` 缺席 ⇒ 必须落成「无槽号」（判据见 §10 `:309`「读到了，说没有」）；(b) manifest 层的非 `ENOENT` I/O 错（`EACCES` ∥ `EISDIR`）——本档唯一非 ENOENT 证据换的是**槽文件**位（U-BG11 支二），manifest 位未走。父侧本轮用例定义 = 「U-BG14 两支」，扩例即改设计档用例表 ⇒ 归设计席裁定后在下一轮补。
2. **[上抛·知会] 设计档两处随本轮回写（设计席笔，本席零触）**：① §10 `:310`「manifest 严格形尚未落地」已不成立（代码 = `session-slots-manifest.mjs:113` ∥ `token-ttl.mjs:187`）；② 受影响表 `session-slots-manifest.mjs` 行（`:372`）实读 **264**（247 → +17，原记 +≈10），`:376` 的当批单测档记 394、实读 **440**。
3. **[上抛·知会] 设计档 `:405` 支 ② 措辞 ≠ 本轮用例定义**：判据写「manifest 删除」，父侧本轮写「干净会话（manifest 不存在）」⇒ 本席按父侧口径落「从未创建」（同为 `ENOENT` 输入类、行为等价）；「曾有 manifest + 槽在盘、随后被删」这一更严变体未走。措辞收正归设计席。
4. **[上抛·知会] 边界面零触（机检）**：`dispatch.mjs` 放行条件 ∥ `anyLiveDesignSlot` 判据体 ∥ `TOKEN_TTL_DEFAULT_MS` 行 ∥ `consume-design` 选择器句四段逐字等于快照（U-BG9 亲跑）；清点面宽容形（`design-slots.mjs` 的 `unionBatches` 缺省）∥ `mergeEngTokenBatchesForSave` ∥ `consume-design` 语义 ∥ TTL 零改。

**修正轮（父侧 2026-10-26 裁定 · U-BG15 用例本体）——manifest「读到了、说没有」的守卫**

**来源**：§2 末段「待实施」+ 设计档 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 用例表 U-BG15（同档 `:407`）∥ A4 纳入（同档 `:414`）。父侧口径 = 只补用例本体：不改产品码 · 不动 U-BG1–U-BG14 判据 · 禁改面四段照旧（U-BG9 复跑）。

**改动（一个档；坐标 = 本轮末次实读）**

| # | 坐标 | 改了什么 |
|---|---|---|
| 1 | `docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs:443-486` | 新增 U-BG15（边界 · manifest 层）：夹具 = manifest 在盘且可解析、`active` 缺席；期望 = close 照常收口（不抛）· §1 → 已收口 · 回执「消费 0 枚 · 留槽无归属 0 枚」· 槽 0/1/2 三档字节不变 · manifest 字节不变 |
| 2 | 同档 `:4` ∥ `:7` | 头注用例表范围改 U-BG1–U-BG15，并补一行 U-BG15 的判据口径（与设计档 `:377` 的用例范围一致） |

**夹具三处要点（为什么这样摆）**

- **多点位**：带同批旁列的槽同时摆在槽 0 / 1 / 2——「无 active」被错猜成这三个号之一都会消费，`消费 0 枚` 才有判别力。判别范围就是这三个号，注释已写明。
- **`active` 先钉上再删**：settle 走钉槽面（`_slot` 已给）⇒ `saveManifest` 不写该键；不先钉就等于「从未有过」而非「有过又缺」，夹具叙述与实际不符。
- **槽号只能由 manifest 解析、内存空**：`_slot: null` + 空内存 = 重启后的形态 ⇒ 零消费只能来自「无槽号」。

**敏感度（红-绿对照；探针全部还原）**

| 探针（`thincoder-core/token-ttl.mjs:188` 临时改形） | U-BG15 读数 |
|---|---|
| `: null` → `: 1` | 红：回执 `消费 1 枚` |
| `: null` → `: 0` | 红：回执 `消费 1 枚` |
| `: null` → `: 2` | 红：回执 `消费 1 枚` |
| 缺 `active` 即抛（当「读不到」） | 红：close 被拒（走不到断言） |

还原读数：`thincoder-core/token-ttl.mjs` 370 行不变 · `:188` 逐字 `return Number.isInteger(active) ? active : null` · `PROBE ONLY` 该档零命中 · 该档 `git diff` 无探针行。

**验证读数（本轮亲跑）**

| 面 | 命令 | 结果 |
|---|---|---|
| 当批单测（本批验收） | `node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` | **15/15 pass**（U-BG1–U-BG15） |
| 禁改面四段（复跑） | `node --test --test-name-pattern=U-BG9 …test.mjs` | **1/1 pass** |
| U-BG15 单例（夹具改形后复验） | `node --test --test-name-pattern=U-BG15 …test.mjs` | 正确码 1/1 pass；探针各红 |

**行数**：当批单测档 440 → **486**（+46：U-BG15 本体 +44 ∥ 头注 +2）。产品码零触：`thincoder-core/token-ttl.mjs` 370 不变（与设计档受影响表一致）。

**审查轮次与终态**

| 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|
| 内部审计（explore · 只读） | 设计档 U-BG15 期望四项 ∥ 可红性 ∥ U-BG1–U-BG14 判据 ∥ 越界改动 | pass（0 🔴 · 0 🟡 · 2 🔵） | 🔵1 = 设计档受影响表 440 滞后；🔵2 = 本节未记录（本段即闭合）；另指出判别范围只到「错默认为活槽」 |
| 内部代码评审（advisor `type=code`） | 当批单测档全文 + 设计档 / 批档 | pass（0 🔴 · 1 🟡 · 3 🔵） | 自修 2 处：① `active` 先钉再删（🔵1）；② 注释判别范围收窄为三个槽号（🔵2）。🔵3（`active: null` 支）留上抛；🟡1 = 记录面滞后（本段即闭合） |
| 复核 | 自修后重跑 | 15/15 pass + 探针复验 | 终态 clean |

**终态：clean**（0 🔴；自修 2 处后 15/15 ∥ U-BG9 1/1 全绿）。

**上抛项**

1. **[上抛·知会] 设计档受影响表 `:377` 仍记当批单测档「实测 440」**（现 486；设计档 `:379` 已声明行号随实施轮漂移、判据以内容机检为准）——设计席笔，本席零触。
2. **[上抛·知会] `active: null`（非整数支）无独立断言**：判据与「缺席」同一表达式（`thincoder-core/token-ttl.mjs:188` 的 `Number.isInteger`），按设计档对「同一判据第二处取样不增加信息」的既有口径（同档 `:311`）未加；若要求独立取样，归设计席裁定后下一轮补。
3. **[上抛·知会] 交付门读数**：`doc_check(mode:"gate", docs = 本档)` = PASS（0 命中）——前轮登记的 §3 三处命中已不在盘，本档不再阻断显式点名的交付门。

**§5 状态收正（同轮）**：上一轮上抛 1（`[上抛·待裁]` U-BG14 的覆盖建议）的 (a) 支「manifest 可读且合法而 `active` 缺席 ⇒ 必须落成无槽号」**已由本轮 U-BG15 落地**，该项只剩 (b) 支（manifest 位的非 `ENOENT` I/O 错不设例）——该支已按设计档 `:311` 登记为「未单独设例的一类」，无需用例。父侧可据此关闭该待裁项。

## §6 验证与收口（父代理）

## 收口（2026-10-26 03:00 · 父侧）

**状态行**：已收口

### 一、交付结果

| 面 | 落点 | 读数 |
|---|---|---|
| E1 凭证带批 | `token-ttl.mjs`（旁列序列化 ∥ restore 读入 ∥ `readEngTokenBatchesFromSlot` 两形）· `design-slots.mjs:47`（`unionBatches` 两形）· `design-token.mjs`（settle 同拍写旁列）· `session-slot-write.mjs:207`（并集纯函数） | token-ttl 306 → **370** · design-slots 245 → **305** · design-token 184 → **200** · session-slot-write 240 → **260** |
| E2 收口自动消费 | `batch-lifecycle.mjs`（`consumeBatchDesignTokens`；close `:519-520` 门 → `:522` 消费 → `:524` 写；status 同位次） | 556 → **612** |
| fail-closed 严格读 | `token-ttl.mjs:226`（`ENOENT` 判「没有」）∥ `:227`（其余抛）∥ `:235-238`（两形） | 清点面宽容形保留 |
| `loadManifest` 两形 | `session-slots-manifest.mjs:113` / `:123` / `:125` | 247 → **264**（实测反超预估 ≈257） |
| 用例 | U-BG1–U-BG15（当批 486 行）· 集成 `batch-close-token-consume.test.mjs`（158） | RTM 新增故事 10 两行 |

### 二、验收读数（父侧亲跑）

- **当批单测**：`node --test docs/batches/2026-10-26-pen-gate-batch-scope.test.mjs` ⇒ **15/15 pass**
- **集成**：`batch-close-gate` ∥ `batch-close-token-consume` ∥ `batch-anchor-create` ∥ `unbooked-pen` 四档 ⇒ **10/10 pass**
- **禁改面**：U-BG9 ⇒ **1/1 pass**（四段逐字等于改动前快照）
- **探针验证**（实施席做，父侧采信）：`token-ttl.mjs:188` 改成 `1` / `0` / `2` / 「缺 active 即抛」四种错法**各让 U-BG15 变红**，还原后变绿
- **`doc_check`**：设计档 ∥ 批档 ∥ 需求档 ∥ `BATCH-RECORD.md` 四档 **PASS**

### 三、这批真正改变了什么

**「手上有个旧凭证就能写产品代码」这个窗口关上了。**

改前：`dispatch.mjs:99-102` 判 `!anyLiveDesignSlot(agent)`——只要**任何**一个凭证还活着就放行，不问它属于哪一批、也不问那批收没收到。凭证 TTL 是小时到天级、只在本批收尾时手动 consume ⇒ 攒着不消费就是长期免检。

今晚之前实测：2026-10-24 握着 8 个更早批次的槽，六笔提交全部绕过挂账。

改后：**批一关，本批凭证就没了**（`close` ∥ `status→已收口` 两通路自动消费，在写状态行之前，失败即拒关批）。于是「有活槽」在任一时点**近似**「有未收口的批」。

**闸的判据没动一行**——改的是「凭证不会跨批滞留」这个事实。

### 四、四条设计判断（都由子代理提出、我采纳）

1. **不做三段值形**（`<designId>:<expiry>:<batch>`）——`tokenExpiryMs` 判「恰两段」，三段会让全部存量槽当场失效、门永久关闭。改走槽文件旁列。
2. **不另写严格读函数**——那会让「没有 vs 读不到」这条判据落到第三处，三处必漂。改成给 `loadManifest` 加 `{ strict }` 开关，同读函数同判据。
3. **槽号解析提到旁列读的 `try` 之外**——不提的话 manifest 读失败会被重包成「旁列读不到」，拒因指错地方。
4. **`mergeEngTokenBatchesForSave` 零调用点如实登记**——不是本批引入的缺陷（既有 `mergeEngTokensForSave` 同样零调用点，`session.mjs:184` 为整档覆盖写），A6 收窄为纯函数面。

### 五、遗留（三条登记，不改）

1. **收口面同拍两种读形**——旁列严格、token 侧仍宽容（`token-ttl.mjs:203`）。只有「文件在两次读之间转为不可读」这一竞态才可能消费 0 枚而槽仍在。**非确定性窗口，接受**（设计档 `:328`–`:330` 已登记）。
2. **manifest 位的非 `ENOENT` I/O 错无独立用例**——同判据在槽文件位已有 `EISDIR` 证据（U-BG11 支二），再补一支不增加信息（设计档 `:311` 已登记）。
3. **`active: null` 非整数支无独立断言**——与「缺席」同一表达式（`Number.isInteger`），同上不单独设例（`:311`）。

### 六、台账与 token

- 台账 `#1754` 在途 → 待核销 → 已核销
- `#1801`（`batch-lifecycle.mjs` 越 500 软线）保持「条件」态：本批 556 → 612，拆分触发线在 700
- designToken 在本轮收口时 consume
