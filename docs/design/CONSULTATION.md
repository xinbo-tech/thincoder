# 会诊机制（Consultation）— 需求与设计 > **§25 R17 supersede（2026-09-06——会诊 digest 自动注入）**：consult_check 已退役（结果只经自动 digest 通道——全 settle 一次注入 + per-model 状态标注；部分 settle 不提前）；会话跨 run 存活（挂起会话消化——空闲 settle 触发消化轮）；consult_stop = 取消（弃回复——不入 digest）。本文件为**历史机制文档**（三工具生命周期/check 轮询为 as-of 快照）——现行为见 ARCHITECTURE.md「会诊/飞刀完全异步化」引用段（权威源 = CLI `AGENT-LOOP.md` §25）。
> 状态：**已实施并实战验证**（08-15 元会诊三批整改 + 真实三模型会诊回归通过；面板完整过程显示/自动折叠已随 0.1.23 发布）。历史修订见 §4 整改表。
> 一句话：可配置多模型并行会诊，主 agent 逐个读回复、自行判断与验证，觉得够了就早停其余。 --- ## 1. 需求 ### 1.1 总体需求 遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题。主 agent **逐个读取先返回的回复，自己判断、自己验证**（用它已有的工具：跑测试、读文件、推理），一旦认定某份回复足够好，立即终止其余仍在执行的会诊。工具只负责**编排与收集**，判定权完整归主 agent——不把"验证"硬编码成某一种固定形态。 ### 1.2 功能性需求（业务故事） - **作为主 agent**，我想要一个非阻塞的 `consult_start` 工具并行发起多模型会诊，以便发起后立即拿回控制权、不空等。
- **作为主 agent**，我想要 `consult_check` 拿到**下一个**先返回的回复（而非一次性全部），以便逐个阅读、逐个判断。
- **作为主 agent**，我想要 `consult_stop` 终止其余仍在执行的会诊，以便在判断已足够时省 token、省时间。
- **作为主 agent**，我想要用自己的工具（bash / verify / read / 推理）去验证和采纳会诊回复，以便适配各种问题（可执行验证的、纯论证的、权衡类的）。
- **作为会诊子 agent**，我想要一个只读工具按需查看主会话历史（失败轨迹、已试手段），以便自主判断要看哪些上下文，而非只接受二手描述。
- **作为用户**，我想要在面板里看到每个会诊模型的进展（分析中 / 已回复 / 已终止），以便知道多模型在干什么。 **范围边界（不做）**：
- 不做工具的自动验证——任何"这条回复对不对"的判定都归主 agent，工具不内置判定逻辑。
- 不做会诊模型的回复互相交叉（模型之间不通信）。
- 不做会诊子 agent 改文件（只读）。
- 不做"等所有模型回完再一次性返回"的批量收集（与"逐个读、可早停"相反）。 **关键澄清（主会话上下文的取舍）**：主会话上下文对会诊高度有意义（尤其失败轨迹），但正确粒度是**问题简报 + main_history 按需拉取**，而非全量投喂；主 agent 的提炼带自身盲区，让会诊模型自己拉取，把"看什么"的主动权还给它。 ### 1.3 非功能性需求 - **并发上限**：会诊模型 ≤ 5（配置层强制），并发全量启动。
- **成本控制**：问题简报（非全量历史）+ 早停。
- **安全**：会诊子 agent 只读（explore 级工具集）；主 agent 若要用会诊回复里的命令，走它自己的 bash（受既有权限门），会诊机制本身不代跑命令。
- **可终止性**：每个会诊子任务持独立 AbortController；`consult_stop` 或用户 Stop 都能立即终止。
- **生命周期**：会诊会话绑定发起它的 turn；turn 结束（或新一轮开始）时清理残留会诊（abort 所有未完成的）。
- **健壮性**：单个会诊模型报错/超时 → 该模型记失败，不阻断其余；`consult_check` 不会因单模型失败而卡死。
- **可观测**：每个会诊模型状态实时上屏（复用 subagent/advisor 面板通道）。 --- ## 2. 设计 ### 2.1 方案选型 | 候选 | 判定 |
|---|---|
| A. 复用 subagent 工具加 `model` 参数 | ❌ 会诊是多模型同题并行 + 逐个读取 + 早停，与 subagent（单模型、一次拿结果）语义不同 |
| B. 单工具阻塞式（内部编排、跑通即返回） | ❌ 工具内置"验证=跑命令"的判定，僵死板；且阻塞调用期间主 agent 无法中途介入判断 |
| C. 三工具两阶段（start / check / stop），判定归主 agent | ✅ **采纳**——工具只编排收集，主 agent 逐个读、自己判、自己验证、觉得够了就 stop | **为什么判定归主 agent（08-14 用户拍板）**：问题类型千差万别（可跑命令的 bug、纯论证的架构权衡、需要多视角对比的方向），任何"工具自动判定是否采纳"都会越分越细、越分越死板。主 agent 有完整上下文和全套工具，判断与验证本就是它的职责；会诊机制只负责把"多个模型的独立意见"高效地摆到它面前。 ### 2.2 架构与数据流 ```
主 agent（turn 中，非阻塞） │ consult_start(problem) → 立即返回 { id, models } ▼
consult 会话（模块级 Map<id, Session>，随 turn 结束清理） ├─ 并发启动 N 个会诊子任务（每个：独立 AbortController + 只读工具集 + main_history） ├─ 子任务回复流进会话的 reply 队列 │
主 agent 继续自己的 turn： │ consult_check(id) → await「下一个」先到的回复 → { reply, received, total, done } │ → 主 agent 读回复，用自己的工具（bash/verify/read）判断与验证 │ → 不够 → 再 consult_check（等下一个） │ → 够了 → consult_stop(id) → abort 剩余 → { stopped } ▼
主 agent 采纳，继续完成任务
``` ### 2.3 接口契约 **config（`~/.thincoder/config.json`）**：
```jsonc
"agent": { "consultModels": [ { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" }, { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "max" } // 上限 5；缺省空数组 = 会诊未启用 // effort: 思考强度，显式落盘（选模型时自动填该模型官方默认档，用户可改）； // 非思考模型为 null。见 MODEL-PICKER-UNIFY.md §3.3（2026-08-14 增补） ]
}
``` **工具**（三个，均在 `src/agent-tools/consult.mjs`）：
```
consult_start - problem (required): 问题简报——现象 + 失败轨迹概述 + 文件入口 （原始报错无需粘贴——会诊子 agent 用 main_history 自行拉取） - models (optional): 子集选择器——["provider:model" | 裸 provider | 裸 model]（大小写不敏感）， 只从 agent.consultModels 里筛出子集跑；缺省/空 = 全池。选择器匹配不到任何池成员 → 报错并列出可选值 → { id, models: ["deepseek:deepseek-v4-pro", ...] } // 非阻塞，立即返回 // 子 provider 按条目 effort 注入 reasoning_effort（MODEL-PICKER-UNIFY.md §3.3） consult_check - id (required) → 返回「下一个」先到的回复；回复耗尽且全部 settle 时 done:true → { reply: "<该模型的分析全文>", model, received, failed, terminated, total, done } → 边界：未知/已失效 id → { error: "unknown consult id" }；done 后再 check → 仍返回 { done:true }（幂等） consult_stop - id (required) → { stopped: N } // abort 剩余 N 个（以 terminated settle —— **计数但不入回复队列**），已回完的保留在会话里 → 边界：未知 id → { error }；0 剩余 → { stopped: 0 }
``` **main_history**（仅会诊子 agent 可用，readonly）：
``` - limit (optional): 返回主会话最近 N 条消息（默认 20，最大 100） → 主 agent 的 machine-line 历史尾部窗口（含失败轨迹原文） → 加固（2026-08-15 元会诊 D5）：多模态 base64 图片替换为 [image omitted]； assistant 的 tool_calls 显形（name + args 截 200 字符）；总字节预算 60KB（超出截尾注明）
``` **接线路径**：`main_history` 在 consult.mjs 里定义，**不注册进 `index.mjs`**（主 agent 工具表不暴露它），仅通过 `runAgent` 的 `opts.extraTools` 注入会诊子 agent 的工具集。 **会诊子任务系统 prompt（`src/prompts/consult-base.md`）**：只读约束 + 提示可用 `main_history` 拉主会话历史 + "你是多名独立会诊之一，给出最透彻的分析与建议，不要改文件，不要等别人"。**以独立 role `"consult"` 注入**（2026-08-15 元会诊 D8/D13）：裸 system prompt + consult.md 作 overlay——不背编码纪律块（只读会诊无关）、不与 explore.md 人格冲突；工具集按只读过滤（同 explore/plan）。 **会话状态**：**挂在主 agent 对象上**（`agent._consultSessions = Map<id, Session>`，实现评审修订——runAgent 每次调用新建 agent 对象，天然 turn 绑定，无需模块级 Map + turnId 注册表）。`Session = { id, controllers: AbortController[], replies: [], pending: number, waiters: [resolve], failed: number, terminated: number, stopped: boolean, total, received }`。 - `pending` = 尚未"settled"的会诊子任务数。每个子任务**必会 settled**：正常回复 / 报错（buildProvider 抛错、runAgent 抛错）/ abort（consult_stop 或用户 Stop）/ 撞 turn 上限（ContinueError）/ 撞墙钟看门狗。settled 时：有回复则入队，`pending--`，唤醒 waiters。
- **terminated 语义**（2026-08-15 元会诊 D1 修正）：`session.stopped` 为真后被 abort 的子任务计 `terminated++`、**不入 replies 队列**——主 agent 早停后无需 drain 假失败 note（原实现把 abort 当 failed 入队，曾由测试固化该错误行为）。
- `done = 回复队列空 AND pending == 0`——**不依赖"所有模型都回复"**，失败的模型也 settle，所以全失败时 `done` 仍能成立，`consult_check` 不会挂死（🔴 评审整改）。
- `consult_check(id)`：回复队列非空 → 弹下一个；否则 `pending == 0` → 返回 `{ done:true }`；否则挂起在 waiter 上等下一个 settle。同时监听 turn signal——用户 Stop 时 abort 全部子任务并返回 `{ done:true, stopped:true }`。**停滞检测豁免**：execute-tools 的 3× 同签名 stall 检测跳过 consult_check（连续 check 是设计用法，不是卡死）。
- **超时边界**（2026-08-15 元会诊 D2 修正，数值后经实测再调）：双保险——①turn 上限 `agent.consultTurns`（默认 **40**——初设 15 导致会诊子 agent 读文件途中撞墙，实测后调 40，§4 记录）；②**墙钟看门狗** `agent.consultTimeoutMs`（默认 **600_000 = 10 分钟**——初设 5 分钟对 high-effort 模型偏紧，用户拍板调 10 分钟）——turn 上限只数 LLM 响应次数，不管卡在慢工具/慢 provider 里的墙钟时间。
- turn 结束（runAgent finally）→ 遍历 `agent._consultSessions`，abort 所有未完成的 controller、唤醒 waiters、清空 Map。已知边界：Ctrl+I 中断恢复会终止进行中的会诊（新 turn 新 agent 对象）——元会诊 D3，修复方案（跨 resume 的 consultSlot）记录在案未实施。 **面板状态回调**：`onConsult({ id, model, status })`，`status ∈ started | answered | terminated | failed`（复用 subagent 面板通道）。 ### 2.4 受影响文件 | 文件 | 动作 |
|---|---|
| `src/agent-tools/consult.mjs` | 新增：consult_start/check/stop + main_history + 会话状态管理 + turn 清理 |
| `src/agent.mjs` | 扩展：runAgent 支持 `opts.extraTools`（注入 main_history）+ turn 结束清理钩子 |
| `src/agent-tools/index.mjs` | 注册三个 consult 工具 |
| `src/prompts/consult-base.md` | 新增：会诊子任务系统 prompt |
| `src/prompts/main.md` | 主 agent prompt 会诊条款（何时会诊由模型自由裁量，条款只描述适用场景与成本权衡） |
| `src/config-io.mjs` | consultModels 读取/校验（≤5） |
| `src/extension/panel-chat.mjs` | onConsult 回调 → webview |
| `webview/chat.js` + `ui.js` + `chat.css` | 会诊面板渲染（每模型一块） |
| `locales/en.json` + `zh.json` | consult.* 文案 |
| `test/consult.test.mjs` | 新增测试 | ### 2.5 关键决策记录 - **判定归主 agent，工具零判定**：任何"采纳与否"的判断都在主 agent 的 turn 里，用它的工具完成。工具只负责并发编排、收集、早停的机制。
- **两阶段三工具而非单阻塞工具**：主 agent 阻塞时无法中途判断；拆开后"逐个读、边判边早停"才成立。
- **只读会诊 + main_history**：会诊子 agent 不改文件；按需拉主会话历史补足上下文。
- **turn 绑定生命周期**：会诊挂在发起它的 turn 上，turn 结束清理，避免孤儿子任务泄漏。
- **问题简报归主 agent，证据由 main_history 拉取**。
- **独立 consult role**（2026-08-15 元会诊）：会诊子任务不复用 explore 身份——consult.md 作 overlay，裸 system prompt；turn 预算独立（consultTurns=40，15 曾致子任务读文件途中撞墙）。
- **成本默认最低档**：effort 未显式配置时回落到枚举最低档而非最高档（省 token 功能不应默认烧钱档）；官方默认档（reasoningEffortDefault）优先。
- **机制化触发**（2026-08-15 元会诊 D7）：stall 检测与 verify 耗尽提醒在会诊已配置时主动提及 consult_start——两个最高命中率触发点，不靠模型自觉。main.md 写明"何时不用"边界与简报质量规则。 ### 2.6 被否决的备选 - **工具内置"跑命令验证"**：把验证固化成单一形态，无法覆盖纯论证/权衡类问题；判定权错位。
- **单工具阻塞收齐所有回复**：主 agent 无法中途介入，牺牲早停。
- **全量历史投喂**：成本 × N 模型，噪声稀释问题。 --- ## 3. 测试 | 用例 | 对应需求 | 输入 | 预期 |
|---|---|---|---|
| 正常-发起即返回 | FR1 | consult_start(problem) | 立即返回 { id, models }，不阻塞 |
| 正常-逐个读取 | FR2 | 3 模型，回复先后到达 | consult_check 依次返回先到者的 reply；done 从 false→true |
| 正常-早停 | FR3 | 读到第 1 个就 consult_stop | 返回 { stopped:2 }，剩余子任务被 abort |
| 正常-主 agent 判断验证 | FR4 | 主 agent 用 bash 验证某回复 | 主 agent 的 turn 内自由执行（工具不参与判定） |
| 正常-main_history | FR5 | 会诊子 agent 调 main_history | 返回主会话最近 N 条，只读 |
| 正常-只读隔离 | 非功能-安全 | 会诊子 agent 尝试 write | write 不在其工具集，被拒 |
| 边界-模型超限 | FR1 | consultModels 配 6 个 | consult_start 报错（≤5） |
| 边界-未配置 | FR1 | consultModels 空 | consult_start 返回"先配置 agent.consultModels" |
| 边界-未知 id | FR2 | consult_check("不存在") | 返回 { error: "unknown consult id" }，不挂起 |
| 边界-全部完成 | FR2 | 所有回复已返回且 pending==0 | consult_check 返回 done:true，不挂起 |
| 边界-幂等 | FR2 | done 后再 consult_check | 仍返回 { done:true } |
| 错误-单模型崩 | 非功能-健壮 | 某模型 buildProvider 抛错 | 该模型 settle（failed），pending--，其余正常返回 |
| 错误-全失败不挂死 | 非功能-健壮 | 所有模型都失败/超时 | consult_check 返回 done:true（pending 归零），不永久挂起 |
| 错误-用户 Stop | 非功能-可终止 | 会诊中用户 Ctrl+C | 全部 abort，consult_check 返回 done |
| 错误-turn 结束清理 | 非功能-生命周期 | turn 结束但未 consult_stop | 残留会诊被 abort，Map 清空 |
| UI-状态流转 | FR6 | 4 模型（含一个报错） | 面板 4 块（**显示模型名**），status 按 started→answered(绿)/terminated(灰)/failed(红) 流转，中文文案 | ## 4. 元会诊整改记录（2026-08-15） 用会诊功能自评后修掉的缺陷（三批，DeepSeek V4 Pro + Kimi K3 交叉验证）： | 批次 | 缺陷 | 修复 |
|---|---|---|
| 1 契约 | consult_stop 后 abort 当 failed 入队（假失败回复） | terminated 计数、不入队（D1） |
| 1 契约 | 无墙钟超时（100 turn × 10min 可拖数小时） | 子任务看门狗 consultTimeoutMs=5min（D2；后按用户要求调 10min） |
| 1 契约 | 连续 consult_check 触发停滞误报 | stall 检测豁免 consult_check（D4） |
| 1 面板 | 模型名丢失、answered 显示红色、终态不清理 | 存 model、三态颜色+i18n、autoClean 纳入终态（D9） |
| 2 成本 | explore.md + consult.md 双人格冲突 | 独立 role "consult"，consult.md 作 overlay（D8） |
| 2 成本 | 复用 subagentTurns=100 | consultTurns=15（后实测撞墙，调 40） |
| 2 成本 | effort 默认回落最高档（max） | 官方默认档优先、回落最低档 |
| 2 成本 | main_history：base64 炸弹/null 渲染/无上限 | 图片省略、tool_calls 显形、60KB 预算（D5） |
| 3 引导 | 想不起来用 | stall/verify 提醒挂钩 + main.md 引导（D7；边界条款后按用户决定放开为自由裁量——何时会诊是模型的判断，成本权衡写在条款里由模型自己称量） | | 4 提示词 | 子 agent 背完整主 agent system.md（人格/工具引用冲突） | 精简 consult-base.md 底座（consult.md 删除） |
| 4 提示词 | question 工具泄漏给子 agent（会挂起提问用户） | depth>0 全排除 |
| 4 提示词 | 预算/聚焦/联网/长度无引导 | base 写明 40 turns/5min、2–5 文件预期、本地优先、~500 词 |
| 4 提示词 | consult_check 可与依赖调用并行 | 描述加"单独调用"警告 |
| 4 契约 | consultTurns/consultTimeoutMs 是死配置（agent 装配层漏传） | agent.mjs 装配补齐 + 配置传递测试 |
| 4 契约 | watchdog 超时 settle 文案是 "aborted"（误读为 provider 崩） | 区分 "timed out after Nmin" | **评审后决定不修**：D3（Ctrl+I 杀会诊——turn 绑定是刻意设计，中断后重发即可）；D6（批处理陷阱——描述警告够用，机制级序列化得不偿失）；D10（面板回复可见性——回复全文在主 agent 上下文，面板预览下批再议）。 **记录在案未实施**：D3（Ctrl+I 中断杀会诊——需跨 resume 的 consultSlot）；D6（consult_check 与依赖其结果的调用并行的理论陷阱）；D10（面板不可见回复内容——需 consultReply 消息 + 可展开预览）；D11/D12（半填行静默丢弃、子任务 usage 不上报）。
