# 自动推进开关（AUTO-PROGRESS-SWITCH）

> 板块：工程模式服从性机制（双端提示词——engineering.md）。权威源：engineering.md 全文通读（L1-88——自动推进点实证：L16 step4 尾句 "token issued automatically + digest echoes designId" / L42 消息分派 "Explicit approval → spawn" / L44 交付分派自动 fix round / L32-40 Work Loop 无 manual 语义）。
> 状态：**设计待评审**——2026-09-09 落档（用户连续叫停失败实证——经多轮澄清定稿方向：**自动推进开关**——不自动推进 ≠ 停摆——当前动作完成呈现后——跨步决策权交还用户——等明确点头才下一步——语义理解叫停非词表——非新状态格不丢原状态）。需求：TODO 自动推进开关（用户反馈——2026-09-09）。

---

## 需求

- **总体目标**：给工程模式主会话一个**推进档位**——用户表达叫停/把关意图时，从 auto 切到 manual——每完成一个动作就呈现结果等用户明确点头，不再自动跨下一步。解决"评审 pass digest 一到就自动 spawn / 修完自动往下推"的连续失败。
- **功能性**：
  - F-1（顶层档位规则）engineering.md（双端）Work Loop 前插规则：推进分 auto/manual 两档——默认 auto（每步完成 → 呈现 → 继续）——用户表达叫停/把关意图（语义判断——非词表——"停/先别/别急/等下/别自动"是常见形式但以意图为准）→ 切 manual：当前动作完成并呈现后，每个后续动作（spawn / 评审发起 / 落档推进 / digest 处理后下一步）停住等明确点头——用户下个明确指令 = 恢复 auto
  - F-2（自动信号不越过手动档）step 4 尾句补：评审 pass + token 入槽 = 评审完成的机器信号——不构成"开始下一步"授权——manual 档下呈现结果等点头才动
  - F-3（分派表 manual 语义）"Then handle the message" 加一条：用户表达叫停/把关（语义）→ 切 manual——本消息回答/呈现后不自动推进——等明确指示
  - **范围边界**：只加提示词句（engineering.md 双端）——不加新状态格（Work Loop 状态表不动——开关是状态之上的推进档位非新状态——design ready 等状态照常流转）；不改子代理提示词（engineering-sub L7 "execute immediately" 保留——子代理内无用户可等）；机制代码零动（本轮是纯提示词层——机制层如 runAgent turn 间用户消息感知属另一问题——登记后批）。

## 设计（提示词落点——照做勿自行解释）

### 1. F-1 顶层档位规则（engineering.md Work Loop 节标题前插——双端）
逐字文本（字节源——双端照抄——语义锚——fail-when-unchanged）：

> ## Progress mode（推进档位——先于 Work Loop 判定）
> Progress has two modes: **auto**（默认——each step completed → present → proceed to the next）and **manual**
> （用户叫停/把关时切入——each step completed → present → WAIT for explicit go before the next）。叫停与把关
> 是**意图**不是词表：你的话表达"停下 / 先别 / 别急 / 等下 / 别自动 / 我要看看再定"即切 manual——无需特定措辞。
> manual 下你**继续回答与讨论、呈现当前结果**——只是不自动跨出下一步（spawn / 评审发起 / 推进落档 / digest
> 处理后的后续动作都停住等点头）。你下一条明确指示（"可以 / 继续 / 开始"或具体下一步指令）恢复 auto——原状态
> 不丢——推进档位只是每步间的闸，不是新状态。

### 2. F-2 step 4 尾句补（engineering.md flow step 4 digest 描述尾——"for the eng-coder spawn"后追加）

> — this digest is a MACHINE SIGNAL that the review finished; it is NOT authorization to spawn or proceed. Under manual mode the result is presented and progress waits for the user's explicit go.

### 3. F-3 分派表加 manual 语义（engineering.md "Then handle the message" 列表——**放最前**——优先于 New requirement 等）

> - **User stop / hold-back**（你说"停 / 先别 / 别急 / 等下 / 别自动"或表达"我要把关再定"——意图为准非词表）→ 推进切 manual：本消息仅回答/呈现，不落文档推进、不 spawn、不发起评审——你明确指示后恢复。

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/prompts/engineering.md | 双端 | 88（各） | ≤+15 | F-1 顶层规则 + F-2 step4 尾 + F-3 分派条 |
| test/prompts-async-guidance.test.mjs | 双端 | CLI 165 / VSC 160 | +15 | F-1/F-2/F-3 锚驻留断言 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| auto 默认 | 你无叫停——评审 pass digest 到 | 自动呈现并推进（现行为保持）——F-1 |
| manual 切入 | 你说"先别急/停/等下" | 切 manual——本步完成呈现——不自动 spawn/落档——F-1/F-3 |
| manual 下回答 | manual 中你问问题 | 正常回答——不推进——F-1 |
| manual 恢复 | 你说"可以/继续" | 恢复 auto——原状态继续——F-1 |
| digest 在 manual | manual 中评审 digest 到 | 呈现结果——不越过档位自动 spawn——F-2 |

## 验收

- AC-1 engineering.md 双端含 F-1 档位规则（fail-when-unchanged——含"意图不是词表"句）
- AC-2 step 4 尾句含 manual 不越过句（digest = 机器信号非授权）
- AC-3 分派表含 User stop / hold-back 条（放最前）
- AC-4 双端 npm test 快层零回归（既有 A1-A4 等锚断言不破）
- 红线：Work Loop 状态表零动（无新状态格）；engineering-sub.md 零动；机制代码零动；不加关键词词表（叫停 = 语义理解）

## 变更记录
- 2026-09-09：落档（用户叫停失败——经多轮澄清：非挂起非新状态——**自动推进开关**——auto/manual 档——manual
  下完成即呈现等点头——意图理解叫停非词表——原状态不丢——机制层 runAgent turn 间用户感知另记后批——纯提示词
  层本轮）。
