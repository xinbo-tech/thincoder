# 批次档 · 2026-09-21 · 模型主动整理上下文（context-tool）

> 前情 = 无（承台账 **#18** ✗ 用户 2026-09-21 20:00–20:03 讨论定形 ✗ **20:05「立批」**✓）。
> 触发：用户 19:59 展开构想——现有「固定阈值即压」**保留**，但其缺口 = 压缩与正在进行的工作无关、结果不够专注 ⇒ 提供一组上下文工具，由**模型在它判定的时点**携带**它写的要求**、结合**将要做的工作**主动压缩 ✓；父侧 20:00 呈收敛建议（三件套 ✗ 四项风险对策 ✗ 三项推荐）✗ 用户 20:03 同意并定形「**收在一个 `context` 工具里 ✗ 用操作区分**」✓。
> 需求已落档：`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1「**模型主动整理上下文（`context` 工具 · 操作区分）**」条目 **F-CC1–F-CC5**（用户原话级 ✗ 判定句与边界在同处 ✓ 提交 `b6bce8fa` ✓）。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」+ 20:05 本条立批）**；自缚照旧：① 代签仅当「评审 pass（0🔴）∧ 落点逐条核验 ∧ token 已签发」② 代签在 §4 写明授权与依据 ③ 新范围 / 口径裁决 ⇒ 停下不代签 ④ 射程 = 本批收口。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（2026-09-21）

**模块目标（一句话）**：让模型在**它判定的时点**（工作方向转换 / 自认上下文嘈杂）✗ 按**它写的要求**✗ 结合**将要做的工作**，主动整理自己的上下文（感知 / 清理 / 压缩）——阈值自动压缩**保留为兜底** ✓。

**功能点（不复制 ✗ 单源）**：见 `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 条目 **F-CC1–F-CC5**（感知 / 主动压缩携要求 + 自动附任务目标 / 噪声清理 / 方向转换轻推 / 单工具多操作）与其**判定句 + 边界（不做）** ✓ 本档不重述（D2）✓。

**边界（本批不做）**：阈值自动压缩**语义零改**（兜底保留 ✗ 双轨并存）✗ **记录面不死**（机器线之外全量不变 ✗ `read_history` / 人读线恒全）✗ 不做自动方向检测（轻推 = 一行提示 ✗ 不得自动压）✗ 不新增用户侧命令（`/compact` 类）✗ **子代理面 = 本设计轮裁定**（其有独立压缩面 ✗ 不预设）✗ 表外档 / 新需求条目 ✗ 版本号 / 发布动作 ✓。

**背景证据（父侧实扫 · 2026-09-21 19:5x）**：① 阈值压缩在位（`agent.compactThreshold` ✗ 按模型自动解析 ✗ 压缩面板可见 ✓ 安全点语义 = 设计档 `docs/core/design/CONTEXT-COMPACTION.md` 在册 ✓）；② **agent 主动路径零**（`thincoder-core/agent-tools/` 全表无 compact 类工具 ✗ CLI 无 `/compact` 命令 ✓ 实扫 ✓）；③ 记录面不死之据 = `read_history` 工具自述「never compacted, audit-complete」✓；④ 压缩失败可见 / 面板链 = 既有（VSC `compress` 四态 ✓ F-K7 在册 ✓）。

**父侧建议（用户 20:03 采纳为定形）**：三件套（感知 ✗ 清理 ✗ 压缩）✗ 保留阈值兜底 ✗ 方向转换轻推 ✓；四项风险（内容盲 / 抖振 / focus 质量 / 回合中途压缩）各有对策——其中「**回合中途压缩复用既有安全点语义**」= 设计轮必须回答的机制点 ✓。

**与发布的关系**：无（下一代发版列车时随行 ✗ **发布动作 = 用户门** ✓）。

## §2 批次任务（eng-designer）

（待设计。）

**状态行**：🔄 设计轮完成 + 评审轮 1 收正完成（2026-09-21）——评审对象 = 设计档 `docs/core/design/CONTEXT-COMPACTION.md` §6.16（新增）+ §7 D-CC23–D-CC28 + `docs/core/design/TOOLS.md` / `CORE-UNIFICATION.md` 的工具面收正；轮 1 = 🔴0 · 🟡5 · 🔵4，9 条已逐条落位（修正轮记见本节末）。

### 2.1 本批覆盖的需求条目（单源 = 需求档 §2.1 F-CC1–F-CC5；另并入父侧裁令 A·D——用户 2026-09-21 20:11「好」批准）

| 条目 | 设计落点（§6.16 内） | 实施落点（逐文件） |
|---|---|---|
| **F-CC1 感知** | 6.16.4（stats 报面逐行定稿 + 阈值/状态行单源接线） | 新 `agent-tools/context.mjs`（三操作）+ 新 `token-window.mjs`（`contextUsage` / `historyPercent` / 合格集）；核 `agent.mjs` + VSC `run-stages.mjs` 各 +1 `_ctxBasis` 暂存 |
| **F-CC2 主动压缩（携 focus + 自动附任务/目标）** | 6.16.2（排队 + 下一安全点落 + 阈值面承接 + 失败链复用 + 回执/注记）+ 焦点块逐字 | 核 `agent-tools/context.mjs`（登记 `_pendingCompact`）+ 核 `context.mjs`（`force`/`focus` 分支 + 焦点块）+ 核 `agent/run-stages.mjs`（消费点）+ VSC `run-stages.mjs`（同构消费） |
| **F-CC3 噪声清理** | 6.16.3（合格集三合取 + 保结构换内容 + 记录面不变 + 基线失效） | 核 `context.mjs`（`pruneStaleToolOutputs` 应用面 + stub）+ `token-window.mjs`（合格集 + `PRUNE_MIN_TOKENS` 常量单源——零回指） |
| **F-CC4 方向转换轻推** | 6.16.5（触发事件 + 逐字一行 + 单活体去重 + depth-0 门 + 零调用零副作用） | `agent-tools/task.mjs`（+1）· `agent-tools/goal.mjs`（四分支 +4）· `agent-tools/context.mjs`（`pushContextNudge` 单源） |
| **F-CC5 工具形态（单工具三操作）** | 6.16.1（name/description/parameters 逐字 + 六要素核对 + 零文档指称）+ 6.16.6（双端装配单源） | `agent-tools.mjs` 登记册 +1 · `agent/family-tools.mjs` depth-0 段 +1（**VSC 端零表改动**——两端经核 `assembleFamilyTools` 同源） |
| **裁令 A 可回查锚** | 6.16.7（两分支逐字回执 + 复用 `read_history path=` 单源 + 不新建通道） | `agent-tools/context.mjs`（回执尾段 + `agent._slot` 取值/回退） |
| **裁令 D 子代理面带可回查性论证** | 6.16.6（裁定 = 不给 · depth-0 only · 四段论证） | `agent/family-tools.mjs` 落 `depthOnly` 段（结构性不可达）；子代理 fixture 行零改 |

**判定句 ①–⑤ 与裁令 A 的机判形** = 设计档 §6.16.10 用例表（C3 / C13+P3 / P1–P3 / N1–N3 / R1–R3 / C11–C12），逐条可跑（含 fetch 桩离线面 + 真机取证类）。

### 2.2 受影响文件表（单一权威位 = 本表 · as-of 2026-09-21 · `wc -l` 口径）

| # | 文件 | 现况 | Δ | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | 495 | ≈ −67 → **428** | **核算式：495 − 迁出 110 + 新增 ≈43 ≈ 428**；迁出三区间 = `:17-36`（20）+ `:38-59`（22）+ `:95-162`（68）；新增 = `force`/`focus` 分支 · 焦点块 · `pruneStaleToolOutputs`（stub + 回执）· `estimateTokens` 再导出（import 面保持）；不拆 ⇒ ≈603 > 500（硬限） |
| 2 | `thincoder-core/token-window.mjs` | 新 | ≈175 | = 迁入 110 + 新增族 ≈65；`contextUsage` / `collectStaleToolOutputs`（含 `PRUNE_MIN_TOKENS` 常量——门槛单一落点）/ `historyPercent`（零 import 环 / 零回指） |
| 3 | `thincoder-core/agent-tools/context.mjs` | 新 | ≈150 | 工具形态逐字 + 三操作 + 轻推助手 + 注记文案（单源） |
| 4 | `thincoder-core/agent-tools.mjs` | 27 | +1 | 登记册 export（#83 单源） |
| 5 | `thincoder-core/agent/family-tools.mjs` | 184 | +2 | 解构 + depth-0 段挂载 |
| 6 | `thincoder-core/agent/run-stages.mjs` | 244 | +12 | pending 消费 + `force`/`focus` + no-op/失败注记 |
| 7 | `thincoder-core/agent.mjs` | 430 | +2 | `_ctxBasis` 暂存（`:188-194` 处）+ `_pendingCompact` 回合起点清零（`:161` 处） |
| 8 | `thincoder-core/agent-tools/task.mjs` | 87 | +1 | 轻推调用（`ctx.depth===0` 门） |
| 9 | `thincoder-core/agent-tools/goal.mjs` | 119 | +4 | set / complete / blocked / cancel 四分支各 +1 |
| 10 | `thincoder-core/test/tool-registry.test.mjs` | 105 | ±3 | `HOST_ONLY` → `["ide","focus"]` + 行注 |
| 11 | `thincoder-core/test/context-tool.test.mjs` | 新 | ≈270 | 用例表 S1–R4 落点（≤300 软线） |
| 12 | `thincoder-vscode/src/tools/ide.mjs`（**档改名**——自 `tools/context.mjs` git rename · 旧路径删除态） | 139 | ±2 | `name: "ide"` + 档头注（行为面零改；让出 `context` 名与核新工具——D-CC26） |
| 13 | `thincoder-vscode/src/tools/index.mjs` | 186 | ±4 | import `:33` / 表内条目 `:181` / re-export / 头注随档改名改指 `./ide.mjs` |
| 14 | `thincoder-vscode/src/agent/run-stages.mjs` | 403 | +11 | pending 消费同构 + `_ctxBasis` 暂存 |
| 15 | `thincoder-vscode/src/agent/agent-state.mjs` | 158 | +1 | `_pendingCompact` 回合起点清零（与 `_compressFailures` 同点） |
| 16 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 214 | ±2 | depth-0 家族 fixture 行 +`context`（5 子代理行零改） |
| 17 | `thincoder-vscode/test/tool-descriptions.test.mjs` | 73 | ±1 | `INLINE_KEPT` 死常量随改名 |
| 18 | `thincoder-vscode/AGENTS.md` | 128 | ±2 | 模块图宿主工具名（产品文本面） |
| 19 | `thincoder-vscode/README.md` | 204 | ±1 | 同上（产品文本面） |
| 20 | `thincoder-core/tools/index.mjs` | 76 | ±1 | 头注宿主工具名单（`context`/`focus` → `ide`/`focus`） |
| 21 | `docs/core/design/CONTEXT-COMPACTION.md` | 524 | +238 → **762** | §6.16 + D-CC23–D-CC28 + 变更记录（设计轮 + 评审轮 1 收正） |
| 22 | `docs/core/design/TOOLS.md` | 548 | +3 → **551** | 元工具清单（+`context`）+ ④/映射表改名（`ide`）+ `:326` 坐标 + 变更记录（评审轮 1 补） |
| 23 | `docs/core/design/CORE-UNIFICATION.md` | 1948 | +2 → **1950** | `:367` ④ 桶名 + `:371` / `:1343` 改名同步 + 变更记录（评审轮 1 补） |

**尺寸档（逐档真实档位）**：`thincoder-core/context.mjs`（495）**本批必须拆分**（不拆则 ≈495 + 108 ≈ 603 > 500 硬限——`thincoder-core/test/core-hygiene.test.mjs:136` 硬限用例 · `:145` `>500` 断言 硬红）；新三档（≈175 / ≈150 / ≈270）均 ≤300 软线内。
其余改动档——≤300：#5 `family-tools.mjs`（184）· #6 核 `run-stages.mjs`（244）· #8 `task.mjs`（87）· #9 `goal.mjs`（119）· #15 `agent-state.mjs`（158）。
>300 软线且 ≤500 硬限两档：#7 `thincoder-core/agent.mjs`（**430**——`CORE-UNIFICATION.md` §2.8.1 行 6 在册 · 消解条件「下次实质改动时」）；本批 +2 = 纯接线（`_ctxBasis` 暂存 / `_pendingCompact` 清零各一行）⇒ **不触发**——先例 = `agent-tools/escalate-async.mjs` 300→302「纯接线 ⇒ 不改变既有拆分结论」（`AGENT-LOOP-SUBAGENT.md` §6.27.6 越线登记）。
#14 VSC `run-stages.mjs`（**403**——登记面 = `docs/vsc/design/VSC-DEBT.md` 读数块 `:274` · 逐档触线单源 = **>450**（同档 `:280`））本批 +11 ≈ 414 ⇒ **未触线**，拆分立场不变（仅同构接线，拆分不在本批范围）。
**CLI 侧零代码改动**（核装配面自动生效）；未新增 `tool-docs/` 档（24 档族计数零动）。
**不触面**：`docs/core/requirements/**`（需求档 = 主 agent 笔）· `docs/TODO.md` / 台账 · 提示词档（`prompts/**`、`tool-docs/**` 内容权 = 主 agent）· 版本号 / 发布面。

### 2.3 验收标准（逐条回指需求条目；机判形见设计档 §6.16.10）

1. **AC1（F-CC1）**：`context{action:"stats"}` 回执行含 ① 总量（= `contextUsage` 单源值，实测/估算两口径可分辨）② 阈值与差额 ③ 三段占比（system/tools/history）+ 工具输出小计；第 4 行状态行百分比 = CLI 公式复算值（对拍等值）。
2. **AC2（F-CC2）**：`compact` 调用**当次零执行**（`agent.history` 逐位深等 ∧ 零 fetch 请求 ∧ `_pendingCompact` 置位）；紧接安全点 ⇒ 摘要请求末条 = `SUMMARIZE_PROMPT + 焦点块 + 任务/目标 anchor 块`，历史 = 注记 + 占位 + tail，`onCompressStart`/`onCompress` 触发。
3. **AC3（判定句 ①）**：同一夹具 × 两条相斥 focus ⇒ 两请求体互不相同且各含其 focus（离线机判）；真机摘要聚焦词差额 = 取证类（非 CI 门禁）。
4. **AC4（F-CC3 + 判定句 ③）**：prune 后 `estimateTokens(history)` 下降 ∧ 每个 `role:"tool"` 消息仍有 owner（配对守恒）∧ `_fullHistory` 深等（记录面不变）∧ `_lastPromptTokens`/`_usageAtLen` 置 null。
5. **AC5（判定句 ②）**：压缩（含强制路径）后 `_fullHistory` 深等 + 会话档字段零改；`read_history` 默认查询仍取全量。
6. **AC6（F-CC4 + 判定句 ④）**：task/goal 任一变更后该前缀行**恒恰 1 行**（再变更 = 替换）；零调用 ⇒ 零行；`ctx.depth>0` ⇒ 零行。
7. **AC7（F-CC5 + 判定句 ⑤ + 裁令 D）**：`assembleFamilyTools({depth:0})` 含 `context` 恰一次 ∧ depth>0 各角色零含；VSC `hydrateRun` 生产表含 `context` 且全表名唯一（宿主工具已名 `ide`）；schema enum = 三操作 ∧ 三 action 可达。
8. **AC8（裁令 A）**：`_slot` 在场 ⇒ 回执含槽文件路径逐字 ∧ `read_history path="…"` 调用形（该路径可被深查）；`_slot` 为空 ⇒ 含 `cwd:<cwd>` 等效取回形。
9. **AC9（零回归）**：`assembleBuiltinTools` 名集 24+8 不变 · `tool-docs` 24 档不变 · `compress-form.test.mjs` / `compaction-echo.test.mjs` / `context-percent-parity.test.mjs` 全绿（无 focus ⇒ 请求体逐字节同修前）；doc-check 触碰档零新增（实测 = 基线 3 悬空 / 3 行宽不变）。

### 2.4 本批明确不做

阈值自动压缩语义 / 触发线（0.6）/ 阈值解析**零改**；记录面（`read_history` / 人读线 / 会话档双字段）零改；不做自动压缩、不做自动方向检测；不新增用户侧命令；不新增配置键；子代理面不给（裁令 D 论证）；`read_history` 本体零改（只借其 `path=`）；`SUMMARIZE_PROMPT` 文本零改（只追加焦点块）；VSC 面板 / webview 零改；需求档 / 台账 / 表外档不写；版本号 / 发布动作 = 用户门。

### 2.5 设计轮发现与上抛（逐条）

1. **【🔴 设计期实读 · 已裁】** VSC **宿主工具 `context` 名冲突**（`thincoder-vscode/src/tools/context.mjs:22`，登记于 `src/tools/index.mjs:181`；核测试 `tool-registry.test.mjs:36/48` 钉其「不得入核」）——F-CC5 的名字来源 = 用户原话级，不可改 ⇒ 设计裁定**宿主工具改名 `ide`**（行为面零改）。若父侧不接受该让名，⑤ 判据在本端不可满足（provider 逐字 400 重名）。
2. **【🟡 端差登记】** VSC 槽位寄居 panel（`chat-panel.mjs:68` `this._slot`）不在 agent 上 ⇒ 裁令 A 的可回查锚在 VSC 端走 `cwd:` 等效面（父侧裁令明文允许）；将来绑定 `panel._slot` 即自动升级为直接路径。
3. **【🟡 存量缺口 · 本批不改】** `read-history.mjs` 默认查询尾注「full text is in the session file」**不给路径**（= 裁令 A 要修的不可行动缺口）——本批以 `context compact` 回执补此闭环，`read_history` 本体零改；其 B/C/E 项 = 台账 #204（另册）。
4. **【🔵 就手收正 · consistency surface】** `docs/core/design/TOOLS.md:172` 元工具清单存量漂移：`batch_segment` → `batch`（登记册现名 `batch`，主名单工具四 action）——同批补 `context` 时一并收正。
5. **【🔵 存量不一致 · 报告不入本批】** VSC 自持工具表计数「台账 #123① 27 项 vs 实核 30 项」（`docs/batches/2026-09-20-mechanism-parity-batch.md:211`）——非本批写域（批档 = 主 agent 面），随本批改名该口径更需收正；登记待裁。
6. **【🔵 死常量登记】** `thincoder-vscode/test/tool-descriptions.test.mjs:39` `INLINE_KEPT` 含 `"context"`/`"focus"` 为**存量孤儿**（全仓仅定义处命中）——改名随改，不改行为。
7. **【上抛 · 需求侧 —— 已消（20:11 已落）】** 裁令 A 的判定句（回执含会话档路径 ∧ 可用作 `read_history path=`）与裁令 D 的裁定结论**需求档已载**（`docs/core/requirements/CONTEXT-COMPACTION.md:33` F-CC2「回执须露可回查锚」· `:38` 子代理面「须带可回查性论证」· 变更记录 2026-09-21 两条）——设计侧承接（§6.16.7 / §6.16.6 + 用例 C11/C12）不变，无需回写。

### 2.6 发布关联

无（随下一代发版列车；**发布动作 = 用户门**）。

### 2.7 三链同源核对（自检）

批次 §2.1 条目 = 设计档 §6.16 落点 = 需求档 §2.1 F-CC1–F-CC5（+ 裁令 A/D）：逐条可对上；判定句 ①–⑤ 与 AC 编号交叉核对无缺口；用例表 S1–R4 每行标对位 ✓。

### 2.8 修正轮 1（评审 §3 轮次 1 · 🔴0 · 🟡5 · 🔵4 —— 9 条逐条落位 · 2026-09-21）

| # | 处置（按父侧裁定） | 落点（file:line · as-of 本轮末） |
|---|---|---|
| 1 | 宿主工具让名统一为**档改名读法**（旧路径删除态）：受影响表行 12 换新路径、行 13 补 import/表内条目坐标；`CORE-UNIFICATION.md:371` / `:1343` 同步 | 批档 §2.2 行 12/13（`:60` / `:61`）· 设计 `CONTEXT-COMPACTION.md:558-559` · `TOOLS.md:107` / `:326` · `CORE-UNIFICATION.md:371` / `:1343` |
| 2 | 行数预算改**可核算式**：迁出 = 110 行（`:17-36` 20 + `:38-59` 22 + `:95-162` 68）· 新增 ≈43 ⇒ 净 ≈ −67 ⇒ **≈428**；`token-window.mjs` ≈175 = 迁入 110 + 新增族 ≈65；「不拆」核算 = ≈603 > 500 | 设计 `:584-591` · 批档 §2.2 行 1/2（`:49` / `:50`）+ 尺寸档句 1 |
| 3 | 删「未跨软线」不实句 ⇒ 逐档真实档位；#7 `agent.mjs`（430）本批 +2 = 纯接线 ⇒ **不触发**（先例 = `escalate-async.mjs` 300→302）；#14 VSC `run-stages.mjs`（403）登记面 = `VSC-DEBT.md:274` · 触线 **>450** ⇒ +11 ≈ 414 **未触线** | 批档 §2.2 尺寸档句（`:73-76`）· 设计 `:598-599` |
| 4 | `PRUNE_MIN_TOKENS` 单一落点 = **与合格集同住 `token-window.mjs`**（该档导出、`context.mjs` 单向取用 ⇒ 零回指）；`context.mjs` 只留应用面（stub + 原位替换 + 回执） | 设计 `:509-511` / `:588` · 批档 §2.1 F-CC3 行（`:37`）+ §2.2 行 2 |
| 5 | 两档各补 2026-09-21 变更记录 + 受影响表 Δ 同步（设计 +238 → **762** · TOOLS +3 → **551** · CORE +2 → **1950**） | `TOOLS.md:550-551` · `CORE-UNIFICATION.md:1948` · 批档 §2.2 行 21/22/23（`:69-71`） |
| 6 | 载体指针改「用例 **S1–R4 · AC1–AC9**」 | 设计 `:651` |
| 7 | 上抛项 7 改标「**已消（20:11 已落）**」（需求档 `:33` F-CC2 / `:38` 子代理面 / 变更记录两条） | 批档 §2.5 项 7（`:104`） |
| 8 | 焦点块省略范围写明 = **anchor 段**（focus 正文恒保留）——代码注释 + 用例 C4 两处 | 设计 `:500` / `:619` |
| 9 | 行数口径坐标 `core-hygiene.test.mjs:99` → **`:136`（硬限用例）/ `:141`（`wc -l` 口径）/ `:145`（`>500` 断言）** | 设计 `:317` / `:598` · 批档 §2.2 尺寸档句（`:73`） |

**射程内附加扫出（一致性面 · 已收正）**：`CORE-UNIFICATION.md:1343`（§2.13.4 ④ 端特有面行——评审未列，按同一改名读法同步 `ide.mjs`）。

**机检读数（本轮实跑 · `node scripts/doc-check.mjs`）**：悬空 **3** / 行宽 **3** = 基线（零新增）✓；三处 `ide.mjs`（拟新增）行按 §4.2.9 行族口径列报（不入闸）✓。

**未决 / 上抛**：§2.5 项 5（VSC 自持工具表计数口径）仍待父侧裁；无新增未决项。

### 2.9 修正轮 2（实施后微修轮 · 承 §5 上抛 · eng-designer · 2026-09-21）

**状态行（本轮）**：🔄 实施轮完成 + 实施后微修轮完成（2026-09-21）——设计档与实施态逐条对齐，待父侧 §6 收口。

| # | 上抛项（§5.4） | 判定 | 落点（设计档 `docs/core/design/CONTEXT-COMPACTION.md` · as-of 本轮末） |
|---|---|---|---|
| 1 | 🟡 强制路第三去向（§5.4-2） | **(a) 现状语义自洽、非缺口**：`force` ∧ `!split` ∧ `shrinkOversized` 命中 ⇒ 有损收缩已处理、按「一次成功压缩」记账（不落 no-op 注记 / 不跑阈值面）；等价性 = 该形下阈值面唯一杠杆是同一 `shrinkOversized`（`split` 输入不变 ⇒ 重复调用恒 false）⇒ 跳过不改变可观察结果；与「阈值面语义零改」硬边界一致 | §6.16.2 表格行（`:488`）+ 新增「强制面第三去向」条目（`:493-496`） |
| 2 | 🔵 `historyPercent` 空历史分歧（§5.4-3） | **保留分歧 + 写明理由（不收正）**：`historyPercent([]) = 0` = 纯公式；两端 `ctxPct > 0` / `null` = 端侧显示门；收正须动端码或破坏 stats 行定值 ⇒ 零收益 | §6.16.4 新增「空历史口径（保留分歧）」条目（`:544-545`） |
| 3 | 🔵 回查锚 `cwd` 缺省分支（§5.4-3） | **写明该态取形（降级形）**：判据改合取（`_slot != null` ∧ `cwd` 在场）；`cwd` 缺省 ⇒ 未绑定分支、字面 `cwd:undefined`、工具内不抛；两端生产链不可达（建链面恒带 `cwd`） | §6.16.7 判据两行（`:584` / `:585`）+ 新增「`cwd` 缺省态」条目（`:590-591`）；§6.16.11 退化面 ③（`:655`） |
| 4 | 同轮收正（引文标记形 + 行宽） | §6.16.6 内三处引文标记形未命中机检闭枚举（「（迁移期引文」字面缺失 ⇒ 悬空误报；其中 `:559` 原无标记）+ 两条 >300 字符行宽 | `:565` / `:567-568` / `:768`（标记形——语义零改）· `:565-568`（拆行） |

**判定理由（逐条实证坐标）**：
- ① 第三去向：`thincoder-core/context.mjs:285-289`（`!split` ⇒ `shrinkOversized`）· `:393`（8000 字符上限）· `:403-432`（命中返 true + 基线失效）；两端消费同构 = 核 `thincoder-core/agent/run-stages.mjs:64-109` / VSC `thincoder-vscode/src/agent/run-stages.mjs:205-229`。
- ② 空历史：核 `thincoder-core/token-window.mjs:160-162` vs VSC `thincoder-vscode/src/specs.mjs:84-88` + CLI `thincoder-cli/src/tui/render-frame.mjs:396-397`（显示门端侧）。
- ③ `cwd` 缺省：`thincoder-core/agent-tools/context.mjs:107`（fail-soft 守卫）· `thincoder-cli/src/cli/make-agent.mjs:112-118` / `thincoder-vscode/src/agent/setup.mjs:322-324`（建链面恒带 `cwd`）。

**机检读数（本轮实跑 · `node scripts/doc-check.mjs`）**：悬空 **3** / 行宽 **3** = 父侧基线（触碰档零新增 ✓）；余 3 / 3 在 `AGENT-LOOP-SUBAGENT.md` 与 `BATCH-RECORD.md`——非本批档，未动。

**未测面（登记 · 非阻塞）**：第三去向现无专属用例（C5① 覆盖摘要路、C7 覆盖无收缩命中的 no-op 路）；机判护栏（短历史 + 单条 `"x".repeat(9000)`）如需，另轮 coder 补。`shrinkOversized` 不设 `_lastCompressInfo`（面板面取既有值）——与本批零改的阈值面同形，登记不改。

**零代码改动** ✓（验收 ③）。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

设计评审（context-tool 批）：🟡5 · 🔵4 · 🔴0 ⇒ **VERDICT: pass**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file table / Clarity | 🟡 | 宿主工具改名的「档面」口径四处不一：批档 §2.2 第 12 行把改动落在 `thincoder-vscode/src/tools/context.mjs`（139 · ±2 · `name: "ide"` + 档头注）⇒ 可读作「原名档就地改」；而设计 §6.16.6「宿主工具改名 `ide`（`thincoder-vscode/src/tools/ide.mjs`（拟新增））」+ `TOOLS.md:19` / `:107`（「`ide.mjs`（拟新增——自 `context.mjs` 改名）」）/ `:326` + `CORE-UNIFICATION.md:367`（④ 桶 = `ide` / `focus`）均按「档改名」写，同档 `:371` 又写「VSC `tools` 的 2 = `context.mjs` · `focus.mjs`」（与 `:367` 互斥）。判别点 = `thincoder-vscode/src/tools/index.mjs:33` 的 import 行（第 13 行 ±4 已含）。两种读法下受影响面不同：改名 ⇒ 唯一权威表缺 `ide.mjs` 新增行与旧档删除态；不改名 ⇒ `TOOLS.md` 三处 + `:367` 回改。 | 统一为一种读法并逐处对齐：若档改名 ⇒ 受影响表补 `ide.mjs` 行 + 旧档删除态、`CORE-UNIFICATION.md:371` 同改；若档名不变 ⇒ `TOOLS.md:19/:107/:326` 与 `:367` 回改。 |
| 2 | Affected-file table | 🟡 | 行数预算算不平：第 1 行 `context.mjs` 495、Δ「≈ −89 → **406**」、§6.16.8 称迁出「＝约 **131** 行」，但所引三段合计仅 ≈93 行（`:17-36` = 20 · `:47-59` = 13 · `:103-162` = 60；并入 `:38-46` 常量与注亦仅 ≈102）——差 ≈30–38 行，按 495 − 93 + 新增 反推不出 406 / 「−89」。 | 校准三数：或补全迁出行区间（现文只列三段），或改「≈131 / −89 / 406」；补一行「迁出 N + 新增 M = 净 −89」核算式，使「不拆则净增越 500 硬限」可复核。 |
| 3 | Affected-file table / Size tier | 🟡 | §2.2「尺寸档」句称「#5–#9 / #14 / #15 均在 500 内**未跨软线**」与实读相抵：#7 `thincoder-core/agent.mjs` = **430**（>300；`CORE-UNIFICATION.md` §2.8.1 行 6 在册，消解条件 =「下次实质改动时」）· #14 `thincoder-vscode/src/agent/run-stages.mjs` = **403**（>300；射程内无登记/拆分计划面——§2.8.1 表头限 `thincoder-core/` 内档）。 | 该句改为逐档真实档位（≤300 / >300 在册 / >300 本批新触），并对 #7 / #14 写明拆分立场（本批 +2 / +11 是否触发在册消解条件——先例 = `agent-tools/escalate-async.mjs` 300→302「纯接线 ⇒ 不改变既有拆分结论」）；#14 若无计划面则登记一笔。 |
| 4 | Clarity / Module split | 🟡 | `PRUNE_MIN_TOKENS` 单一落点未定：§6.16.8 把「陈旧工具输出清理（**含门槛常量**与 stub 文案）」归 `context.mjs`，而合格集函数 `collectStaleToolOutputs(history, provider)`（判据③ = 「估算 ≥ `PRUNE_MIN_TOKENS = 200`」，§6.16.3）归 `token-window.mjs`；两档为单向 import（context → token-window）⇒ 常量若住 context.mjs 则 token-window 须回指，与同段自述「**零 import 环**（只依赖 `provider/rate.mjs` 与 `config.mjs`）」相抵。 | 明确常量单一落点：常量 + 合格集同住 `token-window.mjs`（由 `context.mjs` 取用），或门槛改显式实参（`collectStaleToolOutputs(history, provider, minTokens)`）；并把该档 import 面写成「零回指」可核。 |
| 5 | Doc ownership / Doc-state | 🟡 | 本设计轮已落的两处收正未在各自「变更记录」留行：`TOOLS.md:549` 末条 = 2026-09-20 卫生族二批、`CORE-UNIFICATION.md` 末条 = 2026-09-21 end-diff-doctrine 修正轮，两者均无 context-tool 条目（`CONTEXT-COMPACTION.md:749-751` 有）；受影响表 Δ（TOOLS +1 / CORE ±1）亦未含变更记录行。 | 两档各补一条 2026-09-21 变更记录（`TOOLS.md`：元工具清单 + ④/映射表 + `:326`；`CORE-UNIFICATION.md:367`）并同步 Δ 读数，保持三档记录面同源。 |
| 6 | Cross-file lag | 🔵 | 设计 `:645`「载体指针」写「本批任务书（**用例 1–R4 · AC1–AC8**）」，批档 §2.3 实为 **AC1–AC9**（AC9 = 零回归）、§6.16.10 用例表实为 **S1–R4**。 | 改为「用例 S1–R4 · AC1–AC9」，与批档计数逐字对齐。 |
| 7 | Doc-state | 🔵 | 批档 §2.5 项 7 仍以「裁令 A 判定句与裁令 D 结论**需求档 §2.1 未载**」上抛；需求档已载（`requirements/CONTEXT-COMPACTION.md:33` F-CC2「回执须露可回查锚」· `:38` 子代理面「须带可回查性论证」· `:106` 变更记录 2026-09-21 20:11）。 | 该项改标「已消（20:11 已落 §2.1）」或删行，免引出重复回写。 |
| 8 | Clarity | 🔵 | §6.16.2 焦点块注「无 task 且无 goal ⇒ **整块省略**」所指不唯一：焦点块同时含 focus 正文与 anchor 段，若「整块」含 focus ⇒ F-CC2 的「携要求」被静默丢弃（C4 期望写的是「anchor 块省略」）。 | 写明省略范围 = anchor 段（focus 正文恒保留），与 C4 措辞一致。 |
| 9 | Citation | 🔵 | 行数口径坐标失效：`thincoder-core/test/core-hygiene.test.mjs:99` 不指向 ≤500 硬限判定（实读 `:99` = `specifiers()` 收尾；硬限用例 = `:136` 起 · `>500` 断言 `:145` · `wc -l` 口径 `:141`）；该坐标三处（设计 `:317` / `:592` · 批档 §2.2 尺寸档）。 | 坐标改 `:136` / `:141` / `:145`（或写用例名以免再漂），本批新写的两处一并校准。 |

已核验（外部读数，供复核）：`context.mjs` 495 · `agent.mjs` 430（`_compressFailures` 复位 `:161`、`compactionOverhead :188-194`、安全点 `:231-236`、threshold 出自 `:127` prepareRun ⇒ `_ctxBasis` 可落）· 核 `agent/run-stages.mjs` 244（`runCompactionCheck :63-87`）· `family-tools.mjs` 184（`depthOnly :140-141`、read_history 注 `:150-151` ⇒ 裁令 D 论据成立）· `agent-tools.mjs` 27 · `task.mjs` 87（`readonly:true`）· `tool-registry.test.mjs` 105（`HOST_ONLY :36`、名集 24+8 断言 `:45`）· VSC `tools/context.mjs` 139（`name:"context" :22`）· VSC `tools/index.mjs` 186（`contextTool, focusTool :181`）· VSC `agent/run-stages.mjs` 403（`checkAndCompact :186-250`、共享数组原位回收 `:203-207`）· VSC `agent.mjs` 局部 `history` `:106` + 载体访问器 `:137-150` ⇒ D-CC24「排队 + 安全点」理由成立 · `host-shape-spawn.test.mjs` 214（唯一性断言 `:102-110`）· `tool-descriptions.test.mjs` 73（`INLINE_KEPT :39`）· `read-history.mjs` `:172-197`（`path=` 深查）+ `:202-219`（`cwd:` 发现）· `session.mjs:141`（`_slot` 粘性）· `provider/normalize.mjs:36-80`（发送期配对重排 ⇒ 轻推中批插入无协议风险）· VSC `specs.mjs:84` 状态行公式与设计「同式」一致 · `TOOLS.md` 549 · `CONTEXT-COMPACTION.md` 752 · `CORE-UNIFICATION.md` 1948。

计数：🔴0 · 🟡5 · 🔵4。

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」授权 + 20:05「立批」✗ 三条件齐备）**：

- 依据 ① **评审链全清**：轮 1（评审 id=55）= 🔴 0 · 🟡 5 · 🔵 4 → **修正轮 1**（#56 ✗ 9/9 落）→ **父侧复验逐条过** ✓；
- 依据 ② **落点逐条核验（父侧实读）**：行数核算重算 = 20+22+68 = **110 迁出** + 新增 ≈43 ⇒ **净 −67 ⇒ ≈428**（原 406 作废 ✓）✗ 四处改名口径一致（批档 `:60-61` ✗ 设计 `:558-559` ✗ `TOOLS.md:107/:326` ✗ `CORE-UNIFICATION.md:371/:1343` ✗ 旧路径语义面残留 = **0** ✓）✗ 坐标系 `:136/:141/:145` ✓ ✗ `PRUNE_MIN_TOKENS` 单源 = `token-window.mjs`（零回指 ✓）✗ doc-check = 基线（悬空 3 / 行宽 3 ✗ 本批零新增 ✓）；
- 依据 ③ **token 已签发**（✗ 凭证值不落档）；
- **裁定表（轮 1 九条 → 全 Fixed）**：① 改名口径统一 → Fixed（唯一读法 = 档改名 ✗ 旧路径删除态）② 行数核算式 → Fixed（110/43/428 可复算）③ 尺寸档句 → Fixed（逐档真实档位 ✗ #7 +2 纯接线不触发消解条件（先例在档）✗ #14 触线 = >450 未达）④ `PRUNE_MIN_TOKENS` 单源 → Fixed（同住 `token-window.mjs` ✗ 零回指）⑤ 两档变更记录 → Fixed（`TOOLS.md:550-551` ✗ `CORE-UNIFICATION.md:1948`）⑥ 载体指针 → Fixed（S1–R4 · AC1–AC9）⑦ §2.5 项 7 → Fixed（已消标）⑧ 焦点块省略范围 → Fixed（anchor 段 ✗ focus 恒保留）⑨ 坐标三处 → Fixed ✓；
- **⚠️ 显著标注（要用户知悉 ✗ 可在发布前任意时点否决 ✗ 成本 = 3 档回改）**：**VSC 宿主工具改名 `context` → `ide`**——已发布工具名变更 ✗ 而它是**唯一**既保用户定形名 `context`、又不与核新工具撞车（重名 ⇒ provider 逐字 400）的路径 ✗ 行为面零改（改名面 = `name` + 档名（git rename）+ 引用面 ✓）；若否决 ⇒ 判定⑤「双端工具表各 +1」在 VSC 端不可满足 ✓；
- **实施派发**：eng-coder #58（§2 全表 ✗ AC1–AC9 ✗ 用例 S1–R4 ✗ 双端 ✓）。

## §5 实施记录（eng-coder）

（待批准后。）

**状态行**：✅ 实施轮完成（2026-09-21）——§2.2 全 20 行代码面落位（21–23 行 = 设计/文档面，本轮零改）+ AC1–AC9 全绿 + 用例 S1–R4 逐条落 + 双端全量套件绿（核 515 · CLI 778 · VSC 905，fail 0）+ doc-check 行宽面零新增（触碰档零新增；悬空面见「偏差」）。

### 5.1 交付摘要（逐面）

| 面 | 落点（file:line · as-of 本轮末） |
|---|---|
| 单源新档 | `thincoder-core/token-window.mjs`（188 行 = 自 `context.mjs` 逐字迁出三族 110 行 + 新增族 `contextUsage` / `historyPercent` / `collectStaleToolOutputs` + `PRUNE_MIN_TOKENS`；依赖面 = `provider/rate.mjs` + `config.mjs`，零 import 环） |
| 压缩模块 | `thincoder-core/context.mjs`（440 行；`force` 分支 `:281` · 焦点块 `:56-60` · anchor 取值 `:66-72` · prune 应用面 `:348-372` · `estimateTokens` 再导出 `:435`） |
| 工具档 | `thincoder-core/agent-tools/context.mjs`（174 行 = 工具形态逐字 + 三操作 + 轻推助手 + 注记文案单源 + 可回查锚两分支） |
| 装配 | `agent-tools.mjs:19`（登记册 +1）· `agent/family-tools.mjs:28`/:141（depth-0 段 +1，子代理面零含） |
| 消费点 | 核 `agent/run-stages.mjs:63-108`（取用即清槽 + `force`/`focus` + no-op/失败注记 + 阈值面承接）· VSC `src/agent/run-stages.mjs:197-211`/`:237-246`（同构） |
| 接线 | 核 `agent.mjs:163`（`_pendingCompact` 回合起点清零）· `:199`（`_ctxBasis` 暂存）· VSC `agent-state.mjs:34` · VSC `run-stages.mjs:200` |
| 轻推 | `agent-tools/task.mjs:84` · `goal.mjs:34/50/108/121`（四分支 + depth-0 门） |
| VSC 让名 | `src/tools/context.mjs` → `src/tools/ide.mjs`（git rename · 旧路径删除态 · `name: "ide"` `:27` · 行为面零改：`readonly` / 描述语义 / `what` 参数 / 五段采集逐字）+ `src/tools/index.mjs:33/166/181` + `AGENTS.md:54-55` |
| 测试 | `test/context-tool.test.mjs`（300 行 · S1–S4 / P1–P5 / C1–C13 / N1–N4 / R1·R3·R4）+ `test/tool-registry.test.mjs:38`（`HOST_ONLY = ["ide","focus"]`）+ VSC `host-shape-spawn.test.mjs:196-202`（R2：名唯一 + 含 `context` + 宿主已名 `ide`）+ `tool-descriptions.test.mjs:39`（`INLINE_KEPT` 改名）+ `test/family-tools.test.mjs:29`（家族段 +1 名） |

**AC1–AC9 对位（命令 + 读数原文）**：AC1/AC2/AC3/AC4/AC5/AC6/AC7/AC8 = `node --test test/context-tool.test.mjs`（9/9 pass）逐条对应用例（S1–S4 / C1+C2+C5+C6 / C3 / P1–P5 / C13 / N1–N4 / R1+R3+`host-shape-spawn` / C11+C12）✓；AC9 = `node --test test/compress-form.test.mjs test/compaction-echo.test.mjs`（19/19）+ VSC `node --test test/context-percent-parity.test.mjs`（6/6）+ 名集/tool-docs 断言（R4，`context-tool.test.mjs:295-299`）✓。

### 5.2 决策透明表（实施侧自决项 · 逐条给理由）

| # | 决策 | 理由 / 与设计的关系 |
|---|---|---|
| 1 | 轻推去重 = **原位 `splice`**（非 `filter` 换数组） | 设计写「同前缀旧行先滤（`filter` 手法）」；可观察面（恒恰一行）逐条满足，但 `agent.history = <新数组>` 会让 VSC 端局部引用失效（D-CC24 同一顾虑）⇒ 取等价且保引用的形。 |
| 2 | 注记前缀 = `[System reminder: context compact`（机器行族） | 设计只给注记**正文**片段，未定前缀。取 `[System reminder:` 族 ⇒ 既有 `isRealUserMsg` / plan 节律等机器行谓词自动同判（先例 = 压缩注记 `[Context was automatically compacted…`；`[System note:` 会被当「真实用户消息」）。代码评审 🔵 建议项，已落。 |
| 3 | 饱和值 `toGo = max(0, threshold − total)` | 设计模板占位 `{toGo}` 未定越阈行为；取 0（「无余量」）免负数字面。 |
| 4 | 「无可压」判据落地为 `!compacted && pending` | `compressIfNeeded` 的 `!split` 分支先走 `shrinkOversized`（短历史 + 超大单条消息时返回 true）⇒ 该形下不落 no-op 注记、不跑阈值面（与「同点至多一次成功压缩」自洽）。设计 §6.16.2 只写了两种去向 ⇒ **已登记上抛**（见 5.4）。 |
| 5 | 核 `run-stages.mjs` 的失败注记取 `errText()` / VSC 同 | 错误文本单源（`log.mjs`）——零自造格式。 |
| 6 | 测试夹具口径：`pairedHistory()` = 60 条（默认窗口 131072 ⇒ keepTail 24 / tailStart 36） | 让「12 条 ≥200 tok 的 tool 结果全在保护尾外」与「tail 首条 = assistant（D-CC18 并入分支）」两形可确定复现（不依赖真机）。 |

### 5.3 审计与代码评审（轮次 + 终态）

| 轮 | 面 | 发现 | 处置 |
|---|---|---|---|
| 审计（内部 explore · 只读偏差审计） | 交付物 vs 设计 §6.16 / 批档 §2 | 🟡2 · 🔵2（无 🔴、无机制缺失、无未申报表外改动） | 🟡 = ①设计档 `:558`/`:757` 旧路径悬空（父侧收口笔域，见 5.4）②行数实测 Δ（见 5.5，登记报告）；🔵 = ③用例 C2/C8/C13 三子句无断言（`onCompressStart`/`onCompress` 触发面 / `history` 未变 / 会话档零改）④VSC 登记册测试头注计数量名（15→16）⇒ 两条 🔵 **已修**（fix round 1）。 |
| 代码评审（advisor · code review） | 上述 12 档 + 三份文档 | 🟡2（非 must-fix）· 🔵4（0 🔴）⇒ **VERDICT: pass** | 🟡 = ①强制压缩的「无可压」第三去向（= 决策 #4，设计侧裁定）②`context.mjs` 440 > 300 软线（在册债 · 本批已拆 · ≤500 ✓）：两条均**非 must-fix**，不改语义；🔵 = 注记前缀族（**已修**，= 决策 #2）/ `historyPercent` 空历史返 0 vs 端侧返 null（**已登记**，见 5.4）/ 可回查锚 `cwd` 缺省形（**已登记**）/ 行数实测 Δ 未记录（本表 5.5）。⇒ 终态 = **clean**（无未处置 must-fix；两条设计侧项 + 两条文档侧项留父侧收口）。 |

**fix round（本会话内）**：① 测试档超 300 软线两次收敛（460 → 370 → 309 → **300**）；② 审计 🔵 两条落修（C2/C8/C13 三子句断言 + VSC 头注计数）；③ 评审 🔵 一条落修（注记前缀归机器行族）；④ `retrievabilityAnchor` 增 `cwd` 前置（工具内不抛——`_slot` 在场但缺 `cwd` 时退未绑定分支）。每轮后 `npm test`（核）复跑全绿。

### 5.4 未决 / 偏差 / 上抛（逐条）

1. **🟡 设计档旧路径悬空（父侧收口）**：`docs/core/design/CONTEXT-COMPACTION.md:558`（活体面「现档 = `thincoder-vscode/src/tools/context.mjs`」）与 `:757`（变更记录面同路径）在改名后指不到文件 ⇒ `node scripts/doc-check.mjs` 悬空由基线 **3 → 5**（行宽仍 3，零新增）。本轮禁改设计档 ⇒ 收口请按「档改名读法」回指 `thincoder-vscode/src/tools/ide.mjs`（`:559` 的「拟新增」标记同批翻为实测）。
2. **🟡 强制执行路第三去向（设计侧裁定）**：`force` + `!split` + `shrinkOversized` 命中 ⇒ 不落 no-op 注记、不跑阈值面（决策 #4）。请在设计 §6.16.2 补一句或明确「视为成功压缩」；如需机判，加一条用例（短历史 + `"x".repeat(9000)` 单条 + `compact`）。
3. **🔵 已登记未改（父侧裁定即可）**：`historyPercent` 空历史返 `0`（端侧 VSC `ctxPercentForHistory` 返 `null` / CLI `ctxPct > 0` 门）⇒ 「与状态行同式」有一处分歧，代码注释已自述、设计档未记；可回查锚 `_slot` 在场而 `cwd` 缺省时落未绑定分支（字面 `cwd:undefined`）⇒ 建议补中性句或进退化面。
4. **表外改动 3 处（必披露）**：`thincoder-core/test/family-tools.test.mjs:29`（家族段 fixture +`context`）· `thincoder-vscode/test/agent-tools-registry.test.mjs:26-35`（登记册名集 15 → **16** + 头注/测试名同步；表外 = 受影响表未列）· `thincoder-vscode/node_modules/@thincoder/core` **环境动作**：原为发布物化副本（`npm install --install-links` 残留 ⇒ VSC 套件跑的是旧核、`context` 不可见），已按 `docs/RELEASE.md:140`「发完可恢复开发链接」恢复为 **junction → `thincoder-core/`**（= `CORE-UNIFICATION.md` §2.6.1 开发期单源态；`git status` 零污染；发布前需再物化）。
5. **取证类未跑**（非 CI 门禁）：真机摘要聚焦词差额（判定句①）· 前缀复用命中率面（本批零改，沿用 §6.14 判定）。

### 5.5 行数实测对照（单一权威位 = 批档 §2.2；口径 = `readFileSync(...).split("\n").length − 1`）

**实测 / 设计预算**：`context.mjs` **440** / ≈428 · `token-window.mjs` **188** / ≈175 · `agent-tools/context.mjs` **174** / ≈150 · `test/context-tool.test.mjs` **300** / ≈270（≤300 软线内）· `agent-tools.mjs` **30** / 28 · `agent/family-tools.mjs` **184** / 186（增量以行内方式落 ⇒ 实测 +0）· 核 `agent/run-stages.mjs` **266** / 256 · 核 `agent.mjs` **435** / 432 · `task.mjs` **91** / 88 · `goal.mjs` **126** / 123 · `tools/index.mjs` **78** / 77 · VSC `ide.mjs` **144** / 141 · VSC `tools/index.mjs` **186** / 186–190 ✓ · VSC `agent/run-stages.mjs` **420** / 414（`VSC-DEBT` 触线 >450 未达 ✓）· VSC `agent-state.mjs` **159** / 159 ✓ · `host-shape-spawn.test.mjs` **220** / 214–218 · `tool-descriptions.test.mjs` **73** ✓ · VSC `AGENTS.md` **128** ✓ · VSC `README.md` **204** ✓。
**尺寸线**：`context.mjs` ≤500 硬限 ✓（440）· 三个新档 ≤300 软线 ✓ · 无档越硬限。**偏差归因** = 注释/说明行密度（设计预算未计入逐条注：`force` 语义 · 焦点块省略范围 · 可回查锚两分支 · 失败链复用），功能面零增减 ⇒ 按 AC③「Δ 实测对照」列报，未自行改口径。

### 5.6 全量套件（本轮实跑 · 冻结态）

核 `cd thincoder-core && npm test` → **tests 515 · pass 515 · fail 0**；CLI `cd thincoder-cli && npm test` → **tests 778 · pass 778 · fail 0**；VSC `cd thincoder-vscode && npm test` → **tests 905 · pass 905 · fail 0**；核具名复跑 `compress-form + compaction-echo` = 19/19；VSC `context-percent-parity` = 6/6；`node scripts/doc-check.mjs` = 悬空 5 / 行宽 3（见 5.4-1）。

## §6 验证与收口（主代理）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · 评审 pass · 落点逐条复核 ✓ ✗ 台账 #18 已核销；记录冻结）

**交付核验（父侧独立复核 ✗ 非采信自报）**：
- 落点：体量逐档对齐（`token-window.mjs` **188** ✗ `agent-tools/context.mjs` **174** ✗ `context.mjs` **440** ✗ VSC `ide.mjs` **144** ✗ 旧路径 `tools/context.mjs` 已删 ✓）✗ `HOST_ONLY = ["ide","focus"]` ✓ ✗ 家族段 `family-tools.mjs:141` 装配 ✓ ✗ `PRUNE_MIN_TOKENS` 住 `token-window.mjs` ✓ ✗ 回查锚 `_slot` 分支在 ✓ ✗ VSC `index.mjs` 已改指 ✓ ✗ `node_modules/@thincoder/core` junction 生效（新档可见 ✓）✗ 批档 §5 已写入 ✓
- 套件读数（子代理报 ✗ 父侧抽跑）：「核 **515/515** ✗ CLI **778/778** ✗ VSC **905/905** ✗ context-tool **9/9**（父侧复跑 ✓）✗ compress-form+compaction-echo **19/19** ✗ percent-parity **6/6**」全绿 ✓
- Δ 对照：逐档在表内/近限（注释密度偏差已披露 ✗ 功能面零增减 ✓）✗ 尺寸线全绿（≤500 / ≤300 无越 ✓）

**上抛处置（3 条 → 全闭）**：
1. 🟡 设计档旧路径悬空 → **已闭**（父侧 + 设计微修轮 #64：`:558/:559/:757` 真话化 ✗ 引文标记按闸闭枚举重收正 ✗ 现机检 = 基线 **悬空 3 / 行宽 3** ✓ 父侧复跑 ✓）
2. 🟡 强制路第三去向 → **已闭**（#64 判定 (a) 非缺口（等价性论证在档 `:488`/`:493-496` ✓）；机判护栏 = 台账 **#209**（归批 ✓））
3. 🔵 空历史 `0`/`null` 分歧 ✗ 回查锚 `cwd` 缺省态 → **已闭**（#64 取形在档 `:544-545` / `:584-591` / `:655` ✓）

**收口面**：「拟新增」→「已落」翻转 = 设计档 **7** 处 + `TOOLS.md` **2** 处 + `CORE-UNIFICATION.md` **1** 处（父侧机械收正 ✗ 可 revert ✓）✗ 三链同源（F-CC1–F-CC5 ↔ §6.16 ↔ §5 ✓）

**核销**：台账 **#18** = 已核销 ✓（六态走满：待设计 → 在途 → 待核销 → 已核销 ✓）

**提交**：`cbbb7354`（26 档 +1101/−168 ✗ 本收口轮）已推 `origin/main` ✓；errata：`docs/core/design/TOOLS.md` 两处「拟新增→已落」翻转（与 plan 批共用档 ⇒ 随其提交）与本节提交行 = 后补小提交 ✓。
