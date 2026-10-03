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
**状态行**：设计完成（R1–R4 定形 · fix 轮 3（评审 #47 收正——号 1–6 ∥ 8 折入：两源加固补档〔EN/CN〕+ §5.1 三处收正 · 号 7 驳回非缺陷）· 实施序门已开（#28 已落地）∥ doc-check exit 0）
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

**§2 追加 · fix 轮（eng-designer · 2026-10-03 · U1 折入 + FR8 对盘）**

**机制设计 · U1 折入（父侧裁「修」——两处坐标复核后按实况落笔）**

- ① 未完成径（`thincoder-core/agent-tools/design-token.mjs:86-94`——`opts.incomplete` 分支；父单作「非回显径」，实况名以此为准；非回显主径 `:95-98` 由 initial 轮已落单源面覆盖）：`:89` 剥离行 → 单源调用 `stripDesignTokenEcho(rawResult, designToken)`。
- ② stale 径（`thincoder-core/agent-tools/advisor-settle.mjs:214-216`）：剥离链 → `stripDesignTokenEcho(String(result), entry.designToken)`；`:24` import 同线加一符号。
- 两处现态 = 只剥全串形（`makeDesignTokenRegex` 单形）；折入后 = 全串 ∥ 前缀形 ∥ 裸 uuid 三形全剥（单源单判）。零语义外扩（除剥净面——判断 / 标记 / 槽存储 / 既有分支零改）；实施序 = 待 #28 落地后（同整批）。

**受影响表更新（现表 6 档 ⇒ 7 档——复核后按实况：U1 两处落 2 文件，`design-token.mjs` 已在第 1 档 ⇒ 更新其改动面；净增 1 档 = `advisor-settle.mjs`）**

| # | 操作 | 内容（行数预算） |
|---|---|---|
| 1 | 更新 | `thincoder-core/agent-tools/design-token.mjs`——改动面追加 `:86-94` 未完成径 → 单源剥离；预算 ≈145–155 不变（调用点替换） |
| 7 | 新增 | `thincoder-core/agent-tools/advisor-settle.mjs`——现读 **240** ⇒ ≈238–241（`:24` import 同线加符号；`:214-216` 三行 → 单源调用）；实施序 = 即行（零交叠） |

**用例补一条（T10 折入——随批内件 T1–T9 同档）**

| 用例 | 面 | 输入 / 操作 | 预期（机检断言） | 初态 |
|---|---|---|---|---|
| T10（折入） | 未完成径 ∥ stale 径剥离 | ① 未完成径：`settleDesignReview(…, { incomplete:"timeout" })`、正文含截断回显残片；② stale 径：`settleAdvisorRun` 陈旧分支同形 | 两径输出均零 uuid 残留 ∥ 零 `[DESIGN-TOKEN:` 残留（单源三形全剥）；未完成 ∥ 陈旧标记照旧在位 | **红**（现只剥全串形） |

**验收对照（补行）**

| # | 验收（可机判） | 回指 | 载体 |
|---|---|---|---|
| AC-6 | U1 折入：未完成径 ∥ stale 径残片剥净（单源三形）；标记零回归 | U1（父裁「修」）∥ 契约「剥除全部凭证回显」（`docs/core/design/ADVISOR-GUARDS.md` §1） | T10（+T5） |
| AC-7 | FR8 对位（截断容忍 ∥ 恒定标记 ∥ 逐字复制纪律三句） | FR8（`docs/core/requirements/ENG-TOKEN-BINDING.md:32`） | 设计档 §5.1 ①②④ ∥ 下游 T1 / T3 / T8 |

**FR8 对盘（父侧已落——三句复查）**：① 截断容忍 = §5.1①（R2）∥ ② 恒定标记 = §5.1②（R1）∥ ③ 逐字复制纪律 = §5.1④（R3）——**对位无缺**。

**U3 现态更新**：**已落（FR8）**——`docs/core/requirements/ENG-TOKEN-BINDING.md:32`（FR8 = 2026-10-03 批增；头注 FR1–FR8 随动）。原「需求档合规检查」区报备行随本行关闭（记录面 append-only——旧行不改，本行即现态）。

**复核所得 · 报备（未落笔——待裁）**：同族第三处——`thincoder-core/agent-tools/advisor-settle.mjs:179-181`（D1 落盘失败径）同款只剥全串形；在本设计截断容忍语义下该径可达截断形（pass + 落盘失败 ⇒ 报告按原文重建）⇒ 残片同可存活。本单未列（非 U1 两处）——建议随 U1 同折入 ∥ 登记台账，待父侧裁。

**自检读数（fix 轮 · 设计档落笔后复跑）**：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空` ∥ `OK(行宽): 无 >300 字符单行`（行数面差异 5 条 = thincoder-desktop 先行存量 · 报告态）。

**§2 追加 · fix 轮 2（eng-designer · 2026-10-03 · 同族第三处折入〔D1 落盘失败径〕）**

**口径**：㈠ U1 折入已完成（上一轮——设计面）；本单 = 同族第三处（D1 落盘失败径）。㈡ 执行 = 折入设计（本轮）。㈢ 本轮不做 = 不动实现码 ∥ 需求档 ∥ #28 写域（注：#28 已落地——实施序门已开：#28 §5 = 实施完成、双席落齐〔`docs/batches/2026-10-03-advisor-convergence.md:214` 实读〕）。

**机制设计 · D1 落盘失败径折入（同 U1 形——单源替换、零语义外扩；该径实读复核讫）**

- ③ D1 落盘失败径（`thincoder-core/agent-tools/advisor-settle.mjs:179-181`——`:156` `settled.passed` 为真后落盘失败，报告按 `String(result)` 原文重建）：剥离链 → 单源调用 `stripDesignTokenEcho(String(result), entry.designToken)`。现态 = 只剥全串形；本设计截断容忍语义下该径可达截断形（pass + 落盘失败）⇒ 残片同可存活——折入后三形全剥。零语义外扩（D1 通知 ∥ 槽回滚 ∥ `persistFailed` 判定零改）；实施序 = 随整批（门已开——上）。

**受影响表更新（delta——第 7 档改动面扩展；旧行 append-only 不打改，本行即现态）**

| # | 操作 | 内容（行数预算） |
|---|---|---|
| 7 | 更新 | `thincoder-core/agent-tools/advisor-settle.mjs`——现读 **240** ⇒ ≈235–238（`:24` import 行随动〔`stripDesignTokenEcho` 置入；`makeDesignTokenRegex` 余用归零 ⇒ 除名〕；`:179-181` ∥ `:214-216` 各三行 → 单源调用）；实施序 = 即行（零交叠） |

**T10 行更新（δ = 增 ③ D1 径——补断言；旧行 append-only 不打改，本行即现态）**

| 用例 | 面 | 输入 / 操作 | 预期（机检断言） | 初态 |
|---|---|---|---|---|
| T10（折入） | 未完成径 ∥ stale 径 ∥ D1 落盘失败径剥离 | ① 未完成径：`settleDesignReview(…, { incomplete:"timeout" })`、正文含截断回显残片；② stale 径：`settleAdvisorRun` 陈旧分支同形；③ D1 径：`settleAdvisorRun`（截断回显 ⇒ pass + 落盘失败注入） | 三径输出均零 uuid 残留 ∥ 零 `[DESIGN-TOKEN:` 残留（单源三形全剥）；未完成 ∥ 陈旧 ∥ D1 标记在位 | **红**（现只剥全串形） |

**T10-③ 落盘失败注入注（可执行性——实施轮按此构造）**：临时 cwd + 槽文件不可解析 + `agent._slotMtime` 缓存命中（守卫 `thincoder-core/session-guard.mjs:46-47` 跳过解析 ⇒ `thincoder-core/token-ttl.mjs:241` `JSON.parse` 复读抛 ⇒ `thincoder-core/agent-tools/advisor-settle.mjs:167-169` catch ⇒ `durable=false`）；注入只造「落盘失败」态，不改产品码。

**设计档现态（第 3 档）**：`docs/core/design/ENG-TOKEN-BINDING.md` §5.1 ③ 枚举补该径 ∥ §6.1 行随动 ∥ 变更记录一行（本轮已落）——表 3 行 225 = initial 轮值（本轮前实读 228），本轮 +3 ⇒ 231。

**报备现态更新**：上一轮「复核所得 · 报备（未落笔——待裁）」行（同族第三处）——父裁「修、随 U1 同折入、台账不另挂」⇒ 本轮已折入（见上；旧行 append-only 不改，本行即现态）。

**报备（未落笔——待裁 · 非阻断）**：§5.1 ④ 末句「（在飞）」注（`docs/core/design/ENG-TOKEN-BINDING.md:92`）随 #28 落地已成过去态（现 = 实施完成）——本单未列该落点，未动；如需收正请另裁。

**自检读数（fix 轮 2 · 设计档落笔后复跑）**：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空` ∥ `OK(行宽): 无 >300 字符单行`；行数面差异 5 条 = thincoder-desktop 先行存量（报告态；比对 162 ∕ 跳过 184）。

**§2 追加 · fix 轮 3（eng-designer · 2026-10-04 · 评审 #47〔§3 轮次 1〕收正——号 1–6 ∥ 8 折入）**

**口径**：㈠ 判决表 = 批档 §3 轮次 1（🔴 0 ∥ 🟡 4 ∥ 🔵 4 · VERDICT pass）；父侧裁定 = 号 1–6 ∥ 8 折入修、**号 7 = 非缺陷（驳回，不动）**。㈡ 全部为文档面收正（零语义外扩；两源逐字纪律照守）。㈢ 本轮不做 = 实现码 ∥ 需求档 ∥ 已收口 advisor-convergence 批档 ∥ #28 写域档（`advisor/messages.mjs` 零触——加固句留本批实施轮）。

**号 → 落点（逐条）**

- **号 1（两档回显指令未加固——折入）**：设计档 §5.1④ 枚举扩至三档——补 b 档「评审员系统提示两源」（EN 运行期 ∥ CN 模板——同文口径逐字对应；加固形 = 与 messages.mjs 同款语义：逐字含冒号与 uuid 后数字位、截断回显被标记）。**坐标随动注**：同族核查 5 原引 `:23`/`:54` = #28 落地前读数（EN 43 行 ∥ CN 73 行）；#28 +1 行后实读 = **`:24` ∥ `:55`**（EN 44 行 ∥ CN 74 行）——设计档按现坐标落。受影响表增两行（见下现态全表第 8/9 档）。
- **号 2（「（在飞）」收正）**：设计档实施序注收正为现态——配套批 `2026-10-03-advisor-convergence` 已落地、无剩余门（加固句随本批实施轮拼接）。（评审批档所引 `ENG-TOKEN-BINDING.md:92` 即该点。）
- **号 3（标记位置不变式入机检面）**：T1 行更新（见下——`endsWith(suffix)` ∥ M2 起点 < suffix 起点）；AC-1 载体随动。
- **号 4（归属口径）**：实读 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 全档——**无回显规则重述**（辖域 = 持久化 / 回读 / 消费；`:95` 迁移表坐标行仅提「echo 即裁决」名，无规则重述）。设计档头注 `:5` 收正 = 辖域分工明写（结算判定语义〔echo 即裁决 / 回显链判定〕= 本档 §5）+「2026-10-04 实核该档无回显规则重述」。需求档 `:6`「结算机制——同层」为关联指针，与收正后分工无矛盾——不改（需求档 = 主 agent 笔）。
- **号 5（已知代价登记）**：截断判定 = 「uuid 值出现 ∧ 全串未见 ⇒ 认 pass」——reviewer 在非批准语境引用该 uuid 同认 pass（无负例用例）。**登记 · 本轮不改**（uuid = token 专属随机值、零附带；如需收窄到 `[DESIGN-TOKEN:` 语境形 = 另裁）。
- **号 6（T10-③ 注入链核验义务）**：实施轮先核 T10-③ 注入链（`agent._slotMtime` 缓存命中 → 槽文件复读抛 → `durable=false`——耦合私有缓存语义，实现挪动即失效）；必要时改用可控 seam（模块级 setter / 参数覆写 + `??` 默认回退，默认行为不变，finally 还原）。**登记 · 实施轮履行**。
- **号 7（批内件随批档——驳回）**：父裁 = **非缺陷，不动**——批内件随批档 = 项目现行纪律（单测件不占 `test/` 树、重跑 = 直跑该件）；长期回归承载即该纪律本身。
- **号 8（D1 径标记策略注记）**：设计档 §5.1③ 补注 + 本档登记——D1 落盘失败径只剥净、**不追 M2**（有意：落盘失败 ⇒ 结算未成立、自带失败通知非静默；FR8① 截断标记语义〔按批准结算〕在该径不成立）——免与 FR8① 对盘误判。

**受影响表现态（全表 9 档——旧轮次表 append-only 不打改，本表即现态；第 2 行实施序 ∥ 新增第 8/9 档加粗）**

| # | file | 现读（内容行） | 预算 | 改动面 | 实施序 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/design-token.mjs` | 117 | ≈145–155 | 单源剥离 + M1/M2（§5.1①–③） | 即行（零交叠） |
| 2 | `thincoder-core/advisor/messages.mjs` | 299 | 299~301 | `:51-52` 句尾加固（§5.1④ a） | **即行——门已开（#28 已落地）** |
| 3 | `docs/core/design/ENG-TOKEN-BINDING.md` | 243 | 本轮 +13（230⇒243） | §5.1③④ 收正 + 头注 + 变更记录 | 本轮已落 |
| 4 | `docs/core/design/API-CONTRACT.md`（生成区） | 2949 | 自动 | 两新导出入区（`node scripts/api-contract.mjs --write`） | 收口轮 |
| 5 | `docs/batches/2026-10-03-design-token-echo.test.mjs`（拟新增——批内件） | 0 | ~190–230 | T1–T10 | 随批（门已开） |
| 6 | `docs/batches/2026-10-03-design-token-echo.md` | — | §2/§5/§6 | 批档三段 | 各作者 |
| 7 | `thincoder-core/agent-tools/advisor-settle.mjs` | 240 | ≈235–238 | `:179-181` ∥ `:214-216` 单源剥离 | 即行（零交叠） |
| 8 | `thincoder-core/prompts/advisor-design.md` | 44 | ±0（句内加固） | `:24` 句内加固（§5.1④ b〔EN〕——逐字） | 即行（门已开） |
| 9 | `docs/core/design/prompts/advisor-design.md` | 74 | ±0（句内加固） | `:55` 句内加固（§5.1④ b〔CN〕——同文口径） | 即行（门已开） |

**T1 行更新（δ = 增断言——标记位置不变式入机检面；旧行 append-only 不打改，本行即现态）**

| 用例 | 面 | 输入 / 操作 | 预期（机检断言） | 初态 |
|---|---|---|---|---|
| T1（主腿） | 截断回显 | `settleDesignReview(agent, run, token, 文含裸 uuid 截断形)` | `passed=true`；槽值 = 全串 token；输出含 M2 英文核 `truncated echo`；**输出以 `run.approvedSuffix` 结尾（`endsWith` 真）**；**M2 起点 < suffix 起点（标记位置不变式——机器可判）**；零截断残片；`run.open=false` | 红 |

**AC-1 载体随动**：T1（+ 本轮增断言：suffix 结尾 ∥ M2 居前）/ T5——「标记位置不变式」（设计档 §5.1②）自此入机检面。

**同族核查 5 收口（号 1 折入——旧行 append-only 不打改，本行即现态）**：两档已**裁定折入本批**（父侧——#28 门已开）；设计档 §5.1④ b 档 + 受影响表第 8/9 档落笔；实施随本批实施轮。

**设计档现态**：`docs/core/design/ENG-TOKEN-BINDING.md` = 243 内容行（fix 轮 3 已落：§5.1③ D1 注记 ∥ §5.1④ 三档 ∥ 实施序注收正 ∥ 头注辖域分工；变更记录一行）。**读数口径**：本表「现读」= 内容行（末行换行不计）——全表同口径。

**自检读数（fix 轮 3 · 复跑）**：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空（闸态——阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行（区带豁免在效——变更记录 ∥ 历史沿革）`；行数面差异 5 条 = thincoder-desktop 先行存量（报告态：SHELL/SESSIONS/SETTINGS/COMPOSER/E2E-TESTING）。

## §3 设计评审（评审子代理）
**状态行**：评审完成（#884 设计面 · 🔴 0 · 🟡 4 · 🔵 4 · VERDICT pass）



### 轮次 1（评审子代理）

目标 = 设计面（#884）：`thincoder/docs/core/design/ENG-TOKEN-BINDING.md`（§5.1 ∥ §6.1 ∥ 变更记录）∥ 需求档 FR8 ∥ 批档 §2。核读三项：① 截断容忍语义下残片全枚举剥净 = 设计档 `:82-83`（结算三分支 + 未完成径 + stale 径 + D1 径）——批档 U1/fix 轮 2 折入记录一致 ✅；② 单源 `stripDesignTokenEcho` 四处消费 = 设计档 `:82-83` ↔ `:108`（§6.1）↔ 批档受影响/用例面一致 ✅；③ T10 断言面对位 = 三径（未完成 / stale / D1）零 uuid ∥ 零 `[DESIGN-TOKEN:` 残留 + 标记在位（批档 `:195`）✅。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Coordination | 🟡 | ③ 逐字复制加固只落 `thincoder-core/advisor/messages.mjs` 单点；批档同族核查 5（批档 `:130`）自报两处同载回显指令（`thincoder-core/prompts/advisor-design.md:23` ∥ `docs/core/design/prompts/advisor-design.md:54`）未随批加固——其解除条件「待 #28 后」现已满足（批档 `:179` 自述 #28 已落地），该项仍处未决报备。 | 裁定两档折入或登记台账（#28 门已开），并据此收口批档报备行。 |
| 2 | Doc-state | 🟡 | 设计档 `thincoder/docs/core/design/ENG-TOKEN-BINDING.md:92` 规范面括注「（在飞）」已成过去态（配套批已落地，批档 `:179` 同批自述）。 | 收正该括注（或移入变更记录），规范面只留现态。 |
| 3 | Acceptance | 🟡 | 「标记位置不变式」（M2 恒居 `approvedSuffix` 之前 / suffix 恒居文末——设计档 `:80`）无直接机检载体：T1（批档 `:93`）未断言 suffix 位置/结尾；AC-1 只覆盖「M2 在位 + 残片零残留」；KD-3（批档 `:119`）以该不变式为承重理由。 | T1 增断言（输出以 suffix 结尾 / M2 居 suffix 前），把不变式纳入机检面。 |
| 4 | Ownership | 🟡 | 归属口径不齐：设计档 `:5` ∥ 需求档 `:6` 均把「结算（机制）」列为相邻档 `DESIGN-TOKEN-SETTLEMENT.md` 辖域，本批新语义却落 ENG-TOKEN-BINDING §5.1，批档 KD-6（`:122`）把相邻档描述为「持久化 / 回读 / 消费面」；相邻档不在本次范围，是否重述回显规则未核。 | 核实相邻档无同题重述（有则同步 / 加跨档指针），对齐两处口径；必要时在设计档头注记辖域分工。 |
| 5 | Semantics note | 🔵 | 截断判定 = uuid 值出现 ∧ 全串未见 ⇒ 认 pass（设计档 `:64`）；token 于评审前注入 prompt（需求档 `:30` FR6）——reviewer 在非批准语境引用该 uuid 同样认 pass（无负例用例）。 | 登记该已知代价（如需可收窄到 `[DESIGN-TOKEN:` 语境形）——本轮不改。 |
| 6 | Test seam | 🔵 | T10-③ 注入链（批档 `:197`）依赖内部细节（`agent._slotMtime` 缓存命中 → 槽文件复读 `JSON.parse` 抛 ⇒ `durable=false`）——耦合私有缓存语义，实现挪动即失效。 | 实施轮先核验注入链；必要时改用可控 seam（模块级 setter / 参数覆盖 + `??` 默认回退，默认行为不变，finally 还原）。 |
| 7 | Verification carrier | 🔵 | 新测试落 `docs/batches/2026-10-03-design-token-echo.test.mjs`（批档 `:84` ∥ `:89`），不在主测试树 / `npm test` runner 路径内——长期回归承载未明（批内件惯例本次范围不可核）。 | 明确持续回归载体（或收口时登记是否并入主测试树）。 |
| 8 | Signal face | 🔵 | D1 落盘失败径折入的是「剥净」；该径报告按原文重建（无 M2 截断标记）——与 FR8①「截断 ⇒ 截断标记」的对照关系未明示（该径自带失败通知，不构成静默）。 | 一行注记说明该径标记策略（有意不追加 M2），免与 FR8① 对盘误判。 |

限制：无文档地图 / 标准档（ownership 判据降级）；源码与相邻档不在本次范围——行数面仅可核设计档 231 行（= 批档 `:199` 现值），其余（117 / 299 / 240 / 2949）未核。

**VERDICT: pass**

计数：🔴 0 · 🟡 4 · 🔵 4

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
