# 2026-10-03 · design-token-echo
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:29「刚才碰到的这个token老不对的问题你得处理啊！代码有什么问题吗？」——承当晚三起 token 事故的根因分析（设计评审凭据门）：① 父侧复制谬误（非码因）∥ ② **settle 静默失败洞（真缺陷）**：评审员截断回显 ⇒ 未签发且零标记 ∥ ③ 复评 designId 沿用规律未在回显指引中言明（父侧误用）。
> 台账 = #884（core · 归批）。前情 = 无（独立批——token 凭据链缺陷修）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与点火**：用户 2026-10-03 23:29「刚才碰到的这个token老不对的问题你得处理啊！代码有什么问题吗？」= 代码缺陷调查令 + 开批令。

**三起事故（当晚 · 全链取证 · 槽文件实读）**：
- **起 1（首派双席被拒）**：父侧传 `74140d27-95f0-43bd-bec2-bc35811cce78:…`——**槽文件权威值** = `74140d27-5dd1-478f-9d07-877b6d2ee05f:1791644116423`（`sessions/…json.33` `engDesignTokens["7af6ef20-…"]` 实读）⇒ **父侧复制谬误**（#16 凭据之头 + #20 凭据之尾拼接——两凭据同场易混）——**非码因**；门禁按设计正确拒绝（`subagent-spawn.mjs:276` 恒等比对）。
- **起 2（复评 #24「pass 却无凭据」）**：评审员回显为**裸 uuid**（``——丢 `:expiresAt` 段）；settle 正则要求**全串**（`design-token.mjs:58-65`）⇒ `passed=false` ⇒ **未签发**；而失败出口 `stripped || "…did not pass."`（`:97-98`）在评审文本非空时**零标记**（全仓/digest 双查 "did not pass" 零命中——**静默**）。⇒ **真缺陷**（信号洞 ∥ 截断不容忍 ∥ 残片未剥——部分回显的残片留在下游文本）。
- **起 3（designId 被拒）**：父侧误以为 designId = 评审实例 id（传 #24 实例串）——**机制真值 = `prior?.designId ?? reviewId`**（`agent-tools/advisor-async.mjs:139`：**复评沿用首评 designId**）——门禁正确拒（`subagent-spawn.mjs:115`）——**非码因**。

**需求（修什么）**：
1. **信号面（必）**：settle 失败路径**恒定**出可辨信号（「未回显有效 token——未签发」类；不得只在 stripped 为空时出现）。
2. **回显鲁棒（裁点——设计轮定形）**：截断回显（裸 uuid 前缀）——候选 ① **前缀容忍** = 认 pass（槽存储仍全串）+ 标记提示；候选 ② 不容忍但剥除残片 + 明确「回显不完整，请重发」标记。**父侧倾向 ①**（截断 = 机械噪音、批准意图明确）——用户可纠。
3. **提示词加固（必）**：回显指令强化（逐字含冒号后数字——「截断的 token 无法登记」；`advisor/messages.mjs:51` 面）。

**边界（明示不做）**：不改 token 格式 ∥ TTL ∥ 门禁恒等比对语义 ∥ 不改「非回显 ≠ 通过」本体 ∥ **不动 #28 在飞写域（`advisor/messages.mjs`）——实施须待 #28 落（设计轮先行）** ∥ 他批。

**证据坐标**：`design-token.mjs:82-117`（settle）∥ `:58-65`（regex）∥ `agent-tools/advisor.mjs:184-185`（发凭据）∥ `advisor-async.mjs:139`（designId 沿革）∥ `subagent-spawn.mjs:262-279`（门禁）∥ 槽文件 `engDesignTokens`（64 槽实读）。

**验收方向**：① 截断回显不再静默（按裁定形态机检可核）；② 失败路径恒定标记（模拟非回显 ⇒ 输出含标记）；③ 提示词加固句在位；④ 零回归（全串回显 ∥ 无回显 ∥ TTL ∥ 门禁恒等比对）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（R1–R4 定形（M1/M2 逐字 ∥ 截断容忍① ∥ 加固句逐字）· 受影响 6 档 · 批内件 T1–T9 · 同族核查 6 项 · 实施序 = 待 #28（advisor-convergence，在飞）落地后 ∥ doc-check exit 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03 · initial 轮）**

**本批条目（覆盖 · 回指 §1 需求块与验收方向）**

- **R1 · 信号面（§1 需求 1——必）**：`settleDesignReview` 非回显失败路径**恒定**追加未签发标记 M1（逐字——不得只在正文为空时出现）。
- **R2 · 截断回显（§1 需求 2——裁点定形）**：候选 **① 前缀容忍** 采纳——评审文本含本 token 的 uuid 值（且全串未见）⇒ 认 pass（**槽存储恒全串**）+ 截断标记 M2；截断形残片（括号内仅 uuid 形 / 裸 uuid）**一并剥净**（剥离单源）。
- **R3 · 提示词加固（§1 需求 3——必）**：`thincoder-core/advisor/messages.mjs` 回显句尾加固子句（逐字——每字符含冒号与数字位；截断回显被标记）。**实施序 = 待配套批 `2026-10-03-advisor-convergence` 落地后**（同文件在飞写域交叠）。
- **R4 · 零回归 + 同族核查（§1 验收 ④ ∥ 任务书 ④）**：全串回显 / TTL / 门禁恒等比对（`thincoder-core/agent-tools/subagent-spawn.mjs:262-279` 零触）/ 未完成径零改；同族静默路径六项核查（见下——修否待裁）。
- **不覆盖**：token 格式 ∥ TTL ∥ 门禁恒等比对语义 ∥ 「非回显 ≠ 通过」本体 ∥ #28 落地前对 `advisor/messages.mjs` 的任何写 ∥ 他批 ∥ 同族发现项（未完成径 / stale 径残片——核查已报、零扩面）。

**需求档合规检查（读侧）**

- `docs/core/requirements/ENG-TOKEN-BINDING.md:30`（FR6——「回显匹配才入槽签发，**以代码判定为准**；非 echo → 剥离返回 findings，不占槽」）：截断形 = 匹配子形（判定面已授权代码）；非回显仍「剥离 + findings」+ M1，不占槽——**相符**。
- `docs/core/requirements/ADVISOR-CONVERGENCE.md:86`（N7 零静默——「每条守卫触发必有可见产出……不得静默吞凭证」）：M1 = 该条直接落地（静默洞即 N7 违规）——**相符（强化）**。
- F11（未完成即不签发）∥ F12（凭证信号必达）：未完成径与信号块在场面零改——**相符**。
- R3 在需求档**无逐条对位**（F12 覆盖信号块在场、未覆盖复制纪律）——报备（U3）。

**设计档落点（机制权威——本轮已落笔）**

- `docs/core/design/ENG-TOKEN-BINDING.md`（184 ⇒ **225**）：**新增 §5.1**「回显链判定（截断容忍 / 恒定标记 / 剥离单源）」——① 截断容忍语义 ∥ ② 标记 M1/M2 逐字 + 标记位置不变式（suffix 恒居文末）∥ ③ 剥离单源 ∥ ④ 加固句逐字 + 条件句面跨档指针；§6.1 表增一行；§7 增 D-E8 / D-E9；变更记录一行。
- **归属判定**：回显判定 / 剥离 / 标记 = **结算语义**——单源辖域 = 本档 §5（「echo 即裁决」逐句所在）；`DESIGN-TOKEN-SETTLEMENT.md` = 持久化 / 回读 / 消费面（本批零触）；`ENGINEERING-MODE-V2.md` = 迁移面且已指回本档三源（零触）。条件句面（F32/F33）= `docs/core/design/ADVISOR-CONVERGENCE.md` §2.5（#28 在飞）——本批不触，§5.1 以跨档指针衔接。

**机制设计（三件形态 + 判定流）**

（一）**判定流**（`settleDesignReview`——三分支恒出信号）：全串回显 ⇒ pass（今日形零变）；截断形 ⇒ pass + M2；两者皆无 ⇒ fail + M1。实施草图：

```js
const uuid = String(designToken).split(":")[0]          // token 专属随机段
const fullEcho = makeDesignTokenRegex(designToken).test(rawResult)
const truncatedEcho = !fullEcho && rawResult.includes(uuid)
if (!fullEcho && !truncatedEcho) {
  const stripped = stripDesignTokenEcho(rawResult, designToken)
  return { passed: false, output: [stripped, M1].filter(Boolean).join("\n\n") }   // M1 恒定（含正文为空）
}
// pass：槽写全串 designToken（既有行零改）+ run.open=false（零改）
const clean = stripDesignTokenEcho(rawResult, designToken)
run.approvedSuffix = buildApprovedSuffix(designToken, run.designId, agent._engDesignTokens.size)  // 零改
return { passed: true, output: [clean, truncatedEcho ? M2 : null, run.approvedSuffix].filter(Boolean).join("\n\n") }
```

（二）**形态一 · 标记逐字**：M1 / M2 全文与位置 = §5.1 ②（M2 恒居 suffix 之前——不变式）。
（三）**形态二 · 截断处理定形**：候选 ①——识别 = uuid 值出现（`uuid:expiresAt` 冒号前段；全 uuid、更短前缀不认——假阳面）；处置 = 认 pass + 槽全串 + M2 + 残片剥净；更畸形态（子 uuid 截断等）落 fail 径 = **可见**（M1）；其碎片残余面登记（同族核查 ②）。
（四）**形态三 · 加固句逐字**：= §5.1 ④；拼接点 = #28 落地后句的尾句替换（:51）/ 追加（:52）；忠实取代 §1 拟句「无法登记」（① 下不实——KD-5 / U2）。
（五）**剥离单源**：`stripDesignTokenEcho` = 全串 regex 剥 + 前缀形（`makeDesignTokenPrefixRegex`——同边界纪律）剥 + 裸 uuid 剥（空 uuid 防御跳过）；`stripApprovedSuffix` / `buildApprovedSuffix` / `makeDesignTokenRegex` 零改。

**受影响文件表（file:line 级 · 行数预算）**

| # | file | 现读 | 预算 | 改动面 | 实施序 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-token.mjs` | 117 | ≈145–155（≤300 软线内） | `makeDesignTokenRegex`（:59-65）邻位新增 `stripDesignTokenEcho` + `makeDesignTokenPrefixRegex`（+ uuid 取段）；`:95-98` 非回显分支 → M1 恒定 + 单源剥离；`:100-116` pass 分支 → 截断判定 + M2 + 单源清洗 | 即行（零交叠） |
| 2 | `thincoder-core/advisor/messages.mjs` | 299 | 299~301（±0 优先——句内扩展；>300 = 存量咨询线 ⇒ 无拆分义务） | `:51-52` 尾句加固（逐字 = §5.1 ④；以 #28 落地后句为基准拼接） | **待 #28 落地后**（在飞写域交叠） |
| 3 | `docs/core/design/ENG-TOKEN-BINDING.md` | 184 | **225（已落）** | §5.1 新增 + §6.1 行 + §7 D-E8/D-E9 + 变更记录 | 本轮已落 |
| 4 | `docs/core/design/API-CONTRACT.md`（生成区） | 2949 | 自动 | 两新导出入区 = `node scripts/api-contract.mjs --write`（父侧收口照跑——非手笔） | 收口轮 |
| 5 | `docs/batches/2026-10-03-design-token-echo.test.mjs`（拟新增——批内件） | 0 | ~190–230 | T1–T9（下表） | 随批（#28 后） |
| 6 | `docs/batches/2026-10-03-design-token-echo.md` | — | §2/§5/§6 | 批档三段（本设计轮落 §2） | 各作者 |

**实施序注**：整批实施 = **待配套批 `2026-10-03-advisor-convergence`（#28——在飞）落地后**（`advisor/messages.mjs` 交叠——本表第 2 行）；设计轮先行（本轮）。其余各档与 #28 零交叠。

**用例设计（T1–T9——可机判 · 先红后绿 · 零网络 / 零真实 LLM / 零长等待）**——落点 = `docs/batches/2026-10-03-design-token-echo.test.mjs`（拟新增——批内件）；跑法 = 仓根 `node --test docs/batches/2026-10-03-design-token-echo.test.mjs`；新符号用动态 import（缺导出 ⇒ 该腿红、余腿不受牵连）。

| 用例 | 面 | 输入 / 操作 | 预期（机检断言） | 初态 |
|---|---|---|---|---|
| T1（主腿） | 截断回显 | `settleDesignReview(agent, run, token, 文含裸 uuid 截断形)` | `passed=true`；槽值 = **全串 token**；输出含 M2 英文核 `truncated echo`；零截断残片；`run.open=false` | **红** |
| T2（回归） | 全串回显 | 同形但全串回显 | `passed=true`；输出零 M2；suffix 在位；槽全串 | 绿 |
| T3（主腿） | 非回显 | 非空评审文本、零 token 痕迹 | `passed=false`；输出含 M1 核 `no valid token echo`；findings 保留；槽零写；`run.open=true` 保持 | **红**（现静默） |
| T4 | 边界 | 空文本、零回显 | 输出含 M1 核——**非静默** | **红**（现旧 fallback 串） |
| T5 | 剥离单元 | `stripDesignTokenEcho` 三形（全串 / 前缀形 / 裸 uuid） | 输出零 uuid 残留 ∥ 零 `[DESIGN-TOKEN:` 残留；无关文字保留 | **红**（函数不存在） |
| T6 | 错误 | 异 token 回显（uuid 不符） | `passed=false` + M1；异 uuid 文本零改动 | 红（M1 断言） |
| T7（回归） | 未完成径 | `{incomplete:"timeout"}` | 既有「未完成」标记在位；`passed=false`；槽零写 | 绿 |
| T8（提示词） | 加固句 | `buildDesignApprovalBlock("tok","did")` 两形输出 | 含 `including the colon and the digits after the uuid` ∥ `flagged as truncated` | **红** |
| T9（回归） | TTL / 匹配 | `validateDesignToken`（未来 / 过期）；`makeDesignTokenRegex` 全串 vs 截断形 | 未来 true / 过期 false；全串 true、截断形 false（全串 regex 零改） | 绿 |

**验收对照（回指 §1 四条验收方向）**

| # | 验收（可机判） | 回指 | 载体 |
|---|---|---|---|
| AC-1 | 截断回显不再静默、认 pass（槽全串）+ 标记 + 残片零残留 | §1 验收① / 需求 2 | T1 / T5 |
| AC-2 | 失败路径恒定标记（非空 ∥ 空文本两形） | §1 验收② / 需求 1 | T3 / T4 |
| AC-3 | 加固句在位（两形输出） | §1 验收③ / 需求 3 | T8 |
| AC-4 | 零回归：全串回显 ∥ 恰错形 fail-closed ∥ TTL ∥ 未完成径——且门禁档零触（评审 diff 核） | §1 验收④ | T2 / T6 / T7 / T9 + diff |
| AC-5 | 仓根 `node scripts/doc-check.mjs` 复跑 exit 0 | 交付标准 | 读数见末 |

**关键决策（含被否）**

| KD | 决策 | 依据 / 被否项 |
|---|---|---|
| KD-1 | 截断容忍（候选 ①）采纳：uuid 值出现 ∧ 全串未见 ⇒ 认 pass（槽全串）+ M2 | §1 父侧倾向 ①；截断 = 机械噪音（回显仅通过时发生；uuid = token 专属随机值、零附带；凭证 = 流程门非安全边界）；**被否**：候选 ② 不容忍重审（批准意图明确仍费整轮）；**被否**：更宽前缀容错（短段假阳） |
| KD-2 | M1 恒定（含正文为空） | N7 零静默；**被否**：仅空文本 fallback（静默洞本体） |
| KD-3 | M2 居 suffix 前（prior 随文可见） | `stripApprovedSuffix` 依赖「suffix 恒居文末」（三调用点）；`ADVISOR-GUARDS.md` §1 先例「提示随文可见」；**被否**：suffix 后追加（prior 清洗失效 ⇒ token 进 prior——不可接受） |
| KD-4 | 剥离单源（全串 / 前缀形 / 裸 uuid）——结算主径两支消费 | 「残片未剥」= §1 点名缺陷组件；uuid 零附带；**被否**：宽正则通配剥（非精确——违 exact-truncation 面风格） |
| KD-5 | 加固句替换「无法登记」拟句 → 「逐字含冒号与数字 + 截断回显被标记」 | ① 语义下「无法登记」不实（容忍 = 可登记）；加固要件（逐字含冒号后数字）保留；**备选**：维持原话术 ⇒ 须改选 ②（U2） |
| KD-6 | 设计档落点 = ENG-TOKEN-BINDING §5（非 DESIGN-TOKEN-SETTLEMENT / ENGINEERING-MODE-V2） | 回显判定 / 剥离 / 标记 = 结算语义辖域（§5 逐句所在）；**被否**：持久化面档（DESIGN-TOKEN-SETTLEMENT）/ 迁移面档（V2） |

**同族核查（任务书 ④——只核查、零扩面；修否待裁）**

1. `stripApprovedSuffix`（`thincoder-core/agent-tools/design-token.mjs:29-32`）：精确后缀截断——三调用点（`thincoder-core/agent-tools/advisor.mjs:266` / `advisor-settle.mjs:224` / `agent/record-results.mjs:134`）恒传 settle 产物、endsWith 由构造成立（含新增 M2 形）⇒ **无静默洞、零改**。
2. 未完成径（`design-token.mjs:86-94`）：恒出未签发标记 ✓；**但残片只剥全串形**——「宿主尾截断切中回显」（超时 / 截断尾 + 部分回显）边角下残片可存活（契约「剥除全部凭证回显」= `ADVISOR-GUARDS.md` §1 点名全剥义）。**建议 = 折入本批（一行 `stripDesignTokenEcho` 替换 + T7 扩容）∥ 或登记台账——待父侧裁**。
3. stale 径（`advisor-settle.mjs:214-216`）：同款（仅全串剥）——同 ② 建议；本批未落笔（零扩面）。
4. `settleDesignReview` 守卫（`design-token.mjs:83-85`）：产品链不可达（两调用点先 guard `designToken && result`——`advisor.mjs:260` / `advisor-settle.mjs:149-155`）；直调方可达的静默空串 = 防御纵深面。**零改**（标记会混淆「结算不可能」与「评审未通过」两态——登记）。
5. 指引句同族两档：`thincoder-core/prompts/advisor-design.md:23`（EN 运行期）+ `docs/core/design/prompts/advisor-design.md:54`（CN 模板）同载「Copy BOTH values verbatim / 两个值逐字复制」——未随批加固（③ 面 = messages.mjs 单点；两档 = #28 写域）。**报备**（如需折入须待 #28 后）。
6. `docs/core/design/ENGINEERING-MODE-V2.md:70` M6 行「design-token.mjs……零改（继承）」= v2 迁移史实（非现状句）——本批零触。**登记（零动作）**。

**上抛 / 报备（待父侧裁）**

- **U1**（同族 ②③ 修否）：未完成径 / stale 径残片剥离——折入本批（各一行）∥ 登记台账。倾向前者：同缺陷类、同函数系、契约已点名「剥除全部凭证回显」。
- **U2**（加固句措辞 · 报备）：§1 拟句「截断的 token 无法登记」按 ① 语义不实——已按 KD-5 替换；如须保留原话术 ⇒ 改选候选 ②（本设计列被否乙案）。
- **U3**（需求档缺行 · 非阻断）：R3 加固句无需求档逐条对位（F12 覆盖面）——建议主 agent 视需要补一行或明书归 §1。

**自检读数（设计轮 · 复跑）**：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空` ∥ `OK(行宽): 无 >300 字符单行`；行数面差异 5 条 = 先行存在（报告态，非本批面）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
