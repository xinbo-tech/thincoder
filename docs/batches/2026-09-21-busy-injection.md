# 2026-09-21 · busy-injection
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 22:36 需求提出（busy 期截图被吞 + Ctrl+I 退役讨论）。
> 台账 = #213（TUI · 归批）。前情 = docs/batches/2026-09-21-exit-claim-release.md（在途——本批与其并行，无文件交集）。
## §1 讨论（主 agent）
**状态行**：进行中——F16 三面（A 输入路径 / B 送达链路 / C Ctrl+I 保留）+ 四项设计裁定面已落 §1（eng-designer #2 设计中）

**本批条目**（需求档 `docs/cli/requirements/TUI.md` F16 · 台账 #213 · 板块 TUI）：

| # | 面 | 一句话 |
|---|---|---|
| F16-A | busy 输入路径 | busy（processing 含 digest）Enter 提交不再吞——填 `pendingInput` 单槽 + queued 反馈 |
| F16-B | 送达链路 | 回合自然结束 → 既有回合尾 drain 续发新回合（`agent-turn.mjs`）——消息以 user 首条送达（挂起态既有语义） |
| F16-C | Ctrl+I 保留 | 打断注入与队列注入**两语义并存**（用户 2026-09-21 22:38 裁定）——本批零触碰 Ctrl+I 代码与文档 |

**起因与授权**：用户 22:28-22:31 会话中 busy 期发截图被 INPUT-LOCK 吞掉（`key-handler.mjs:283-285` busy 提交吞 + 斜杠同禁——2026-09-09 有意收窄，本批 = 有意识部分重开，形态改单槽非攒批）。用户 22:36「我觉得需要…ctrl+i inject 就不需要了」→ 父侧实勘呈卡（打断 vs 排队两语义不可互换 + 退役代价）→ **用户 22:38「那就还保留着 ctrl+i，同时把 busy 期注入做了」= 点火授权 + 保留裁定**。

**关键事实（父侧已勘 as-of 22:31）**：① 回合尾 drain 续发已存在（`agent-turn.mjs:334-341`，至多一条 R15 形）；挂起态 pendingInput 单槽交接已存在（`suspension-drive.mjs:305-308`）——**缺的只是 busy 输入路径**；② busy 门禁现值 = `key-handler.mjs:283-285`（提交吞 + 提示，文本保留输入框；斜杠同禁）+ `:413`（门禁先拦 pendingInput）；`index.mjs:367-384` submit 防御双保险（busy 拒不清输入框）；③ Ctrl+I 语义（保留面，零改）= `key-handler.mjs:176-183` interruptPrompt → `abort({interrupt:true,message})`；无 message Ctrl+C 首按 `:109-110` = 停回合不续跑（后台池保留）；④ 粘贴锁 `key-modes.mjs:151`（`_pasting` Enter 无效——与注入面正交，不在本批）。

**设计须裁**：① busy 二次提交行为（单槽满——覆盖 or 拒绝+提示，判定句设计钉死）；② queued 反馈形态（pushLine dim 行 or 状态栏——与 F13 attention 态豁免清单对齐：pendingInput 不出 attention）；③ digest 期提交与回合期提交是否同路径；④ VSC 对位面（busy submit 现状未核——若有等价面零改，若同吞则对称修 + 端差登记）。

**红线**：不引入多消息攒批（R15 撤销裁定不翻）；斜杠命令 busy 禁发不变；空闲/挂起 Enter 语义零改；不打断当前回合；R15 队列双源注释语义（`suspension-drive.mjs:244`）如实勘与单槽相容则零改。

**排除面**：截图粘贴问题（`_pasting` 锁时序嫌疑）不在本批；exit-claim-release 批并行在途（id=1 设计中）——本批与它无文件交集。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
