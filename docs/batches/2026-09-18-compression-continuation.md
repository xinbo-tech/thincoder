# 2026-09-18 · 压缩续写批（#39）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（提交 `58638c4a` + `747d47f8` + `c38176e0`；判定句达标 **92.86% / 93.65%**）

### 1.1 批件（用户 2026-09-18 01:47「可以」授权）

| # | 条目 | 实况（探针实证） |
|---|---|---|
| **#39** | 压缩调用零命中 | `stage:"compress"` 调用 usage = cached **256** / prompt **108590**（**0% 命中**；`thincoder-core/context.mjs:60` SUMMARIZE_PROMPT 以全新 user 消息承载——system=无、整段日志作正文）；同会话普通调用多数 100% |

**修法候选**：压缩改**会话续写形态**（复用同 system + history 前缀 + 尾部指令一条）⇒ 每次压缩 ~100–170K 全价 miss → **~1–2K**。**这是今晚省 token 最大单点**。

### 1.2 设计轮要做

1. **核实**（只读）：压缩调用现状（`context.mjs` 构建处 + 调用点）· 缓存前缀的可复用边界（system / history 各自内容）· 压缩触发面（自动 / 手动）与形态改动的交互 · 摘要质量风险（续写形态下模型看到的上下文变化）。
2. **设计**：续写形态的消息序（前缀复用最大化 + 尾部指令）· 失败/退化面 · 与「压缩生存」诸机制（情境行重推等）的交互。
3. **§2 任务书**。

### 1.3 边界

- **禁触**：`scripts/**` · 冻结批档 · `_archive/**` · 参照树 · 提示词面内容（涉及提示词时停下上报）· 压缩触发阈值/策略本体（除非设计证明必要——须在报告明示）。
- 文件面：`thincoder-core/context.mjs` 一族（设计核实后定全）。

### 1.4 台账

- **#39** → 本批；完成后核销。

## §2 批次任务与设计修订（eng-designer）

### 2.0 设计轮交付（eng-designer · 2026-09-18 · initial 轮）

设计已落 **`docs/core/design/CONTEXT-COMPACTION.md` §6.14 + §7 D-CC20 + 变更记录**（本档 266 → 358 行 · `wc -l` 口径——评审轮 1 收正后的现值）。机制条文不复制入本档（D2）——下表 = 本批**任务书**。

### 2.1 本批覆盖的需求条目

| 条目 | 来源 | 本批判定 |
|---|---|---|
| #39 压缩调用零命中 | 台账（本批 §1 批件 · 用户 2026-09-18 01:47「可以」授权） | 本批修复 |

**本批不含**（明示）：压缩触发阈值 / 策略本体（设计档 §6.2–§6.5 全不动）· 探索结果蒸馏调用（同类形态缺陷，登记后续——见 §2.7 第 3 项）· `scripts/**` · 冻结批档 / `_archive/**` / 参照树。

### 2.2 修后形态（设计定稿 · 机制条文 = 设计档 §6.14）

```
messages = [ {role:"system", content: extras.systemPrompt},   // 与回合请求同字节
             ...history.slice(0, tailStart),                  // 中段真身消息（原样引用——不拷贝/不截断）
             {role:"user", content: SUMMARIZE_PROMPT} ]       // 尾部指令（唯一新增面）
tools    = 不带   // v1——实施后修正轮收正为 v2（与回合同声明 tools + toolChoice:"none"，见 §2.10；落地前现态仍为 v1）
```

- 前缀（可复用面）= `system` + 中段；未命中面 = 指令一条（+ ≤255 块对齐残余）。
- 摘要输入域不变（修前亦只喂中段）；`tailStart` 单一真值——不新增第二处切割判据。
- 探针实证（**作废 · 2026-09-18 实施后受控实测推翻**）：R1–R4 的「不带 tools 的 R2/R4 命中了带 tools 的 R1 所建前缀（反向亦然）」为小样本假象——受控实测**命中面按 `tools` 声明分区**（同前缀带 tools 93.6% · 不带 0%）⇒ v2 取「**与回合同声明的 `tools` + `toolChoice:"none"`**」（设计档 §6.14「命中面按 `tools` 声明分区」节；落修见 §2.10）。

### 2.3 受影响文件表（as-of 2026-09-18 设计轮；**实施后实测读数见本表下方**）

| # | 文件 | 现况 | Δ | 改动性质 |
|---|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | 499 行（`wc -l` = 机检口径；read 口径 500） | 预测 ≈ +3 / −13（净 −10 ⇒ ≈ 489）；**落盘 492**（实测 · 预算 ≤495） | 压缩请求构造改**接线**：import `:15` + 调用 `:400` + 空白摘要守卫 `:414`；`serialized` 序列化段（修前 `:388-400`，13 行）退役 |
| 2 | `thincoder-core/compress-form.mjs` | 新档（实施轮已建） | 预测 ≈ +30；**落盘 20**（实测） | 纯函数 `buildCompressMessages`（零 import 依赖——指令文本实参传入，不与 `context.mjs` 成环）；先例 = `explore-distill.mjs` 抽取 |
| 3 | `thincoder-core/test/compress-form.test.mjs` | 新档（实施轮已建） | 预测 ≈ +105 → **落盘 213**（实测 · 2026-09-18 实施后修正轮收正） | 用例 1–8（形态 / 前缀性质 / 配对安全 / 无 system 退化 / 空白守卫 / 带 tool 中段 + 不带 tools）——`globalThis.fetch` 桩（先例 `thincoder-core/test/provider-merge.test.mjs:114-151`）+ 纯函数断言 |
| 4 | `docs/core/design/CONTEXT-COMPACTION.md` | 266 → 358 行（`wc -l`；**实施后修正轮后 422**） | 设计轮 + 评审轮 1 + 实施后修正轮已落 | §6.14 + D-CC20 + 变更记录 |

**行数口径**：一律 `wc -l`（= 机检口径，`thincoder-core/test/core-hygiene.test.mjs:99`——`>500 = 硬红`）——AC6 与本表 Δ 同口径（评审 #1 收正）。

**实施后落盘（as-of 2026-09-18 实施轮 · `wc -l` 实测）**：`context.mjs` **492** · `compress-form.mjs` **20** · `test/compress-form.test.mjs` **213**（≤300 软线 ⇒ 免登记）——三项均在本表预测/预算内（§5 实施记录同源）。

**零改动（逐处核实）**：`thincoder-core/agent.mjs`（429 行——`compactionOverhead` 已携带 `systemPrompt` / `tools` / `traceDepth`，`:184-190`）· `thincoder-core/agent/run-stages.mjs`（249 行——`:64,66` 透传）·
`thincoder-vscode/src/agent/run-stages.mjs`（380 行——`:185,195-197` 已传 `systemPrompt` / `toolSchemas`）· `thincoder-core/provider/**`（`chat` 签名与发送面不变）· `thincoder-cli/**`。
测试入口 `thincoder-core/test/run.mjs` 用 `test/*.test.mjs` 单层 glob ⇒ 新档免登记（对位 VSC 的显式清单不适用）。

### 2.4 验收判据（逐条回指 #39 · 机判形式）

| AC | 判据 | 机判方式 |
|---|---|---|
| AC1 形态 | 请求 = `[system(=extras.systemPrompt)] + history.slice(0, tailStart) 原样 + [指令]`；末条 `role="user"`；请求**不含 tools**（**v2 修订 ⇒ 携带回合同一声明面 tools + `tool_choice:"none"`——见 §2.10**） | 用例 1（fetch 桩捕获 body） |
| AC2 前缀性质 | 压缩请求去末条后，与 `[{system}, ...agent.history]` 的同长前缀逐元素深等 ⇒ 前缀可复用 | 用例 2（同一夹具双构造） |
| AC3 配对安全 | 中段尾部含 `assistant(tool_calls)` + 多条 `tool` 时，切点 = 配对安全边界；请求内零孤儿 tool、零合成 `[Tool result missing…]` | 用例 3 / 4 |
| AC4 退化 | `extras.systemPrompt` 缺省 ⇒ 不抛错，消息序 = 中段 + 指令（无 system 头） | 用例 5 |
| AC5 失败面 | 空白摘要 ⇒ 抛错且 `agent.history` 逐条不变；3 连败 → `compressFallback` 行为不变 | 用例 6 / 7 + 既有 `thincoder-core/test/compaction-echo.test.mjs` 仍绿 |
| AC6 零回归 | `npm test`（thincoder-core）全绿；机检读数**按档归属**不劣于基线（全局读数随他批在途波动——本批面零新增；开工基线 = 悬空 453 · 行宽 2 · 拟新增 3，收尾读数见 §2.9） | `node test/run.mjs` + `node scripts/doc-check.mjs` |
| AC7 provider 接受度 | 「带 tool 中段 + 不带 tools 声明」的请求体被 provider 接受（非 400）；离线面 = `body.tools` 缺省且中段 tool 配对完整（评审 #2 补）（**v2 修订：离线面改判 = `body.tools` 与回合同值 + `body.tool_choice === "none"`——见 §2.10**） | 用例 8（fetch 桩）+ 实施轮真机必得读数①（人工核验 · 非 CI 门禁） |

**真机读数（实施轮必得 · 人工核验 · 非 CI 门禁）**：① **首轮真机压缩成功**——请求被接受（非 400）· 摘要非空落盘（评审 #2 补）；
② 真实压缩后 compress 轨迹 `prompt_cache_hit_tokens / prompt_tokens ≥ 0.9`（修前基线 = 256 / 108590 = 0.2%）——同会话回合调用命中率 ≥0.9 时该读数才有效；
③ **摘要形状抽查**（要点式 / 含 FILES CHANGED · UNRESOLVED 清单——评审 #9 观测出口）：不达标 ⇒ 上抛，不静默通过。
取证路径 = `~/.thincoder/traces/<date>/*.jsonl` 中含 `"stage":"compress"` 的行。

### 2.5 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 期望输出 |
|---|---|---|---|
| 1 | 正常 | 中段 + ≥10 条尾部；`extras.systemPrompt` 给定 | 消息序 = §2.2；`body.tools` 缺省 |
| 2 | 正常（前缀性质） | 同 1 | `requestMessages.slice(0,-1)` 与 `[{system}, ...history]` 前缀深等 |
| 3 | 边界：尾部起于 assistant（D-CC18 并入分支） | `history[tailStart].role === "assistant"` | 切点不变（同一 `tailStart`）——请求前缀与无并入分支同构 |
| 4 | 边界：并行工具结果 | `assistant(tool_calls ×2)` + 2 条 `tool` 落在中段尾部 | 请求内配对完整、无孤儿、无合成占位 |
| 5 | 边界：无 system | `extras` 缺省（对位 `thincoder-cli/scripts/verify-compress.mjs` 直调） | 消息 = 中段 + 指令；不抛错 |
| 6 | 错误：空白摘要 | fetch 桩回 `content: ""` | 抛错；`agent.history` 逐条不变 |
| 7 | 错误：请求失败 / 中止 | fetch 桩 500 / AbortError | 既有语义：AbortError 透传；其余进失败计数（3 连败 → 确定性截断） |
| 8 | 边界：带 tool 中段 + 不带 tools 声明 | 中段尾部含 assistant(`tool_calls`) + `tool` 消息（同 3 / 4 夹具）；请求不带 tools（**v2 修订：改判带声明面——见 §2.10**） | fetch 桩捕获 body：`body.tools` 缺省；中段 `tool` / `tool_calls` 配对完整、零归一化占位（真机接受度 = §2.4 读数①） |

### 2.6 报告格式（eng-coder）

`处 → file:line`（逐处）· 用例读数（`node --test test/compress-form.test.mjs`）· `npm test` 读数 · 机检三读数（悬空 / 行宽 / 拟新增）· 真机 compress 轨迹读数（可得时）。

### 2.7 上抛项（须主 agent 处置 · 不阻断设计）

1. **提示词内容权（前置 · 落地前必须定稿）**：`SUMMARIZE_PROMPT` 须改 2 处——
   ① `thincoder-core/context.mjs:60` 首句 `Summarize the following agent work log` → 续写形态（建议 `The conversation above is our work log so far — summarize it into a compact summary`）；
   ② `thincoder-core/context.mjs:71-72` 删 `Work log:` 标签行（正文现在位于指令**之前**）。
   其余 9 条要求与末段砍价优先级**一字不动**。**候选原文由本设计给出，定稿权在主 agent**（内容权）。
   **父侧定稿（主 agent 内容权 · 2026-09-18 02:10——父侧直接执行）**：① 首句取 = `The conversation above is our work log so far — summarize it into a compact summary for use as context in the ongoing conversation.`（目的子句保留）；② `Work log:` 标签行与其后空行删除；③ 其余 9 条要求与末段砍价优先级一字不动；④ 模板尾 = 末条要求后单个换行。
   **计数口径收正（2026-09-18 实施后修正轮）**：现档 = **9 条 bullet + 末段砍价优先级**（`thincoder-core/context.mjs:63-71`）——上两处「10 条」为误计（设计档 §6.14 同批收正；实施轮代码评审 #5 同此发现）。
2. **需求档条目（已补 · 主 agent · 2026-09-18）**：`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 已落「压缩调用复用会话前缀」条目；
   判定句 = 「同会话回合调用命中率 ≥90% 时，compress 轨迹 `cached / prompt ≥ 0.9`」；变更记录同批补 2026-09-18 行——三链（批次档 §2 / 设计档 AC / 需求档）齐。
3. **同类面发现（不在本批）**：`thincoder-core/explore-distill.mjs:105`（`EXPLORE_SUMMARY_PROMPT` 蒸馏调用）同为「单条 user + 无前缀」形态 ⇒ 命中 ≈ 0；量级远小于压缩（~10–17K prompt / 次），登记为后续候选（**v2 声明面原则对其同样适用**——该调用亦无 tools 声明；改法同 §2.10，须另立批次——本批不含）。

### 2.8 本批不做

不改触发阈值 / 切割公式 / 尾部预算 / 回注面 / 面板回调 / 双线；不碰 `scripts/**`、冻结批档、`_archive/**`、参照树；不动 VSC 端代码（核内单点改动即两端生效）。

### 2.9 评审轮 1 落修（eng-designer · 2026-09-18 · fix 轮）

> **append-only**。上方各行为**就地收正**（残留计数以现值为准）：§2.0 `:34` 行数注 · §2.3 表（行 1 口径/Δ、新档行、用例数）· §2.4（AC7 + 真机读数）· §2.5（用例 8）· §2.7-2（→ 已补）。机制条文落点 = `docs/core/design/CONTEXT-COMPACTION.md`。

**逐号落修表（处置执行人 = 本设计轮）**：

| # | 级别 | 落修（file:line） |
|---|---|---|
| 1 | 🔴 | 设计档 §6.14 新增「落地形态（模块拆分 · 行数预算）」（`docs/core/design/CONTEXT-COMPACTION.md:248-250`）——**取路 (a) 拆分**：净 Δ +6 的 (b) 路 ⇒ 落盘 ≈505（`wc -l`）越过硬限 500 且零余量，故先例（同档 `:495-497`）形态拆分；新档 `thincoder-core/compress-form.mjs`（拟新增 · ≈30 行 · 零 import 依赖）+ `context.mjs` 净 Δ ≈ −10（+3 / −13）⇒ 落盘 ≈ 489、预算 ≤495；批档 §2.3 行 1–4 同口径收正（口径声明 = `wc -l` = 机检口径，与 AC6 同源） |
| 2 | 🟡 | 设计档 §6.14 新增「取证项——provider 接受度」（`:228-233`）；批档 §2.4 新增 **AC7** + 真机读数改「实施轮必得（人工核验 · 非 CI 门禁）」并增读数①首轮真机压缩成功 · ③摘要形状抽查；批档 §2.5 新增**用例 8**（`:100`） |
| 3 | 🟡 | 设计档 §6.14 `:245` → 「摘要输入域（选中面）不变 / 表示面改变」——旧「模型所见内容面无变化」句作废（需求档半幅 = 父侧已落 §2.1） |
| 4 | 🟡 | 设计档 §6.14 尾 `:280-281`：「待定稿」句 → 定稿完成指针（2026-09-18 02:10）+ 落地解锁；批档 §2.0 `:34` / §2.3 行 4 行数注按实测收正（266 → 358 · `wc -l`）；批档 §2.7-2 `:113-114` → 已补（父侧已落） |
| 5 | 🟡 | 设计档 §6.14 退化面 1 `:265` + §7 D-CC20 否决③ `:308`：`cacheMode` 引证收正为「静态能力标注（`thincoder-core/model-specs.mjs:20`）且核内零消费 ≠ 调用期前缀可否复用 ⇒ 判据错位」——原「标注语义 = 需显式 cache_control」引证作废 |
| 6 | 🟡 | 设计档 §6.11 `:167-168` → 「提示词单源」（核 export：`SUMMARIZE_PROMPT` / `EXPLORE_SUMMARY_PROMPT`；VSC 副本随 W6/W15 退场）；§6.12 `:178` VSC 列「蒸馏本体仍住 …（改指随 W15）」→ 调用期适配器（W15 已落）；需求档半幅 = 父侧已落 |
| 7 | 🔵 | 设计档 §6.14 `:212-214`：「机制对照」加**口径注**——「53354 字符」计量对象未记 ⇒ 与 token 读数不可直接换算（≈2.5 token/字符）；该换算未实证（轨迹档不在仓内），结论不依赖它 |
| 8 | 🔵 | 设计档 §6.14 退化面 4（`:268-270`）：**轨迹体积登记**（完整落盘 `thincoder-core/traces/trace-store.mjs:22-24` · 写入面 `:240` · 清理面 `:284`）——**接受，不新增机制** |
| 9 | 🔵 | 设计档 §6.14 退化面 5（`:271-272`）：非空白非摘要输出残余 = **登记 + 观测出口**（真机摘要形状抽查；不达标 ⇒ 上抛，不静默通过） |

**机检读数（复跑 · 2026-09-18）**：本设计档**新增门禁违规 = 0**——唯一新增锚 = `compress-form.mjs`（路径/坐标 · 带「拟新增」标记 ⇒ 列报 · 不入闸；拟新增 3 → 4）；
悬空 452 → 455 与行宽 2 → 5 的**余量全部落在他批在途档**（`docs/cli/design/TUI.md` · `docs/core/design/MANIFEST.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md`——非本批文件面；AC6 的全局基线比较须按档归属读）。

**上抛（父侧面 · 不阻断落地）**：① 评审 #6 的「顺带核需求档 §4.2 N2」与 #4 的「补需求档变更记录一行」= 父侧已落（需求档 `:65` / `:91`）；② 评审 #5 的替代事实「Claude / Qwen 行标 `none` 而其服务端具备缓存」**未采纳**——仓内不可核（厂商服务端事实），改引「静态标注 vs 调用期事实」错位论证；③ 轨迹体积与输出面残余两条本批只**登记 + 接受**，未新增机制。

### 2.10 实施后修正轮（eng-designer · 2026-09-18 · fix 轮）

**依据**：§5 实施实测（真机读数 ② = 0% · 归因 = 命中面按 `tools` 声明分区）+ 父侧裁定五条；**处置执行人 = 本设计轮**。

**逐号落修表**：

| # | 处置 | 落修（file:line） |
|---|---|---|
| 1 | tool 面进设计（核心） | 设计档 §6.14 `:230-279`：新增「**命中面按 `tools` 声明分区**」（W1–X4 受控实测表 + 结论 · 推翻探针 R1–R4 结论①）+「**v2 修法 · 声明面对齐**」（形态 / 抑制 / 可行性核 / 泄漏后处理 / 观测出口 / 退化面 / 成本面 / 落地面）+ 否决备选 ①–⑤ + 预注册探针复测方案 S1–S6；`tools` 行 `:295` ·「前缀构成」`:300` · 质量风险表「输出面」行 `:315` · 退化面 1 `:319` 同批收正；§7 **D-CC20** `:365` tools 面与否决② 收正 |
| 2 | 序列化面退役收正 | 设计档 §6.4② `:80-81` · §6.5① `:100` · §6.7 D9 `:116` 三处——原「无 orphan 风险（中段序列化为文本）」「序列化 user 8000 / tool+assistant 2000 cap」「序列化格式 `[role][ called tools: …] content`」句作废，改指真身消息形态 + §6.14 |
| 3 | 坐标 + 首句读法 | 设计档 §6.11 `:168`：`thincoder-core/context.mjs:60 → :61`；定稿块 `:338-341` 补「**整句替换**」读法裁定（`You are a conversation compressor.` 角色句退役——父侧已确认）⇒ 实施轮「判断存疑 1」定论落档 |
| 4 | 计数口径 | 设计档定稿块 `:339` + 本档 §2.7-1 `:113`/`:114`/`:115`：「10 条」→「**9 条要求 + 末段砍价优先级**」（现档 = 9 条 bullet——`thincoder-core/context.mjs:63-71`） |
| 5 | 测试档行数 | 本档 §2.3 行 3 `:63`「≈ +105」→「**落盘 213**（实测）」；同表行 1/2/4 + 「实施后落盘」行 `:61`/`:62`/`:64`/`:68` 按实测同批收正（**492 / 20 / 213**；设计档本体 422 行） |

**v2 任务书（工具声明面对齐 · 待实施轮 · 另派 coder）**——机制条文 = 设计档 §6.14「v2 修法」节（不复制）：

| # | 文件 | Δ 预算 | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | +2 行（现况 492 ⇒ 落盘 **494**） | 压缩调用 `:404-406` 增 `tools: extras?.tools`（**不随 `toolChoice`**——备选②）；注释 `:388-391` 收正（v2 决策 + 实测定值 + effort 上抛指针）**〔2026-09-18 实施轮实测收正——原载 `+ toolChoice:"none"` 子句作废〕** |
| 2 | `thincoder-core/test/compress-form.test.mjs` | +N（现况 213 ⇒ ≤300 软线内） | 用例 8 修订（带 tools 声明：`body.tools` 与回合请求 JSON 深等 + `body.tool_choice === "none"`）+ 新用例 9（无 tools 退化 ⇒ 两者均缺省） |
| 3 | `thincoder-core/provider/**` | 0 | `toolChoice` 能力层已在（四 transport——设计档 §6.14 可行性核坐标），零改动 |

**AC 修订（v2 · 改后为准）**：AC1 的「请求**不含 tools**」→「请求携带与回合请求同一声明面（`body.tools` 与回合请求深等）」**〔2026-09-18 实测收正：`tool_choice` 子句取消——备选②〕**；AC7 离线面「`body.tools` 缺省」→「`body.tools` 存在且与回合同值、**`body.tool_choice` 不发**」；新增 **AC8**：`extras.tools` 缺省 ⇒ `body.tools` 不发（退化面 1）。**AC2–AC6 不变**。**本批保持 in-flight**：AC1/AC7 的判定句（`cached / prompt ≥ 0.9`）生产口径未达标（= `reasoning_effort` 上抛项，§2.10 上抛 2）。

**真机取证（实施轮必得 · 非 CI 门禁）**：按设计档 §6.14 探针方案 **S1–S6**（判定句 = compress 轨迹 `cached / prompt ≥ 0.9`）；取证 = `~/.thincoder/traces/<date>/*.jsonl` 含 `"stage":"compress"` 的行 + 响应 `tool_calls` 计数。

**上抛项（父侧笔 · 本设计只登记）**：

1. 需求档 `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1（`:27`）条目文本现载「…不带 tools…」——v2 下须改字（建议「与回合请求同声明面的 `tools` + `tool_choice:"none"`」）；**判定句不变**（`cached / prompt ≥ 0.9`）；变更记录补一行。
2. 需求档 §4.3（`:73`）坐标 `thincoder-core/context.mjs:60` → `:61`（与设计档 §6.11 同批位移）。
3. v2 未落地前，需求档判定句在现态代码下不可达（实测 0%）——三链状态句（需求档 / 设计档 / 本档）建议随实施轮同步（父侧裁）。

**机检读数（本轮回跑 · `node scripts/doc-check.mjs`）**：开工 = 悬空 **225** · 行宽 **3**（`docs/core/design/prompts/persona-engineering.md:137,139` · `docs/core/requirements/MEMORY.md:123`——均他批在途面）· 拟新增 **3**；收尾读数见交付报告（本批面**零新增**）；本档与设计档新增非表行均 ≤300 字符（首轮两行超宽已折行修正）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件体量（硬限） | 🔴 | `thincoder/thincoder-core/context.mjs` 现况 500 行（批档 §2.3 自标「500 行」＝`thincoder/docs/batches/2026-09-18-compression-continuation.md:61`；实测读全文 = 500 行），同一行自标 Δ「≈ +22 / −16」⇒ 落盘 ≈506 行，越过 ≤500 硬限；设计档 §6.14（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:199-262`）与批档 §2.3 均无拆分计划。机检硬红已存在：`thincoder/thincoder-core/test/core-hygiene.test.mjs:99`（`if (lines > 500) hard.push(...)`）·`:102`（断言 hard 空池），且该档在 `npm test` 域内（`thincoder/thincoder-core/test/run.mjs:8` 单层 glob）⇒ AC6「`npm test` 全绿」（批档 `:78`）与本表自标 Δ 互相冲突。同档先例 = `thincoder/thincoder-core/context.mjs:495-497`（「524 > 500 硬限 ⇒ module-split」）。 | 受影响文件表补拆分计划（先例形态 = 新增面抽独立核模块、原档只留 re-export / 接线），或把落盘行数压回 ≤500 并写明行数预算；同时收正 AC6 与本表 Δ 的口径冲突。 |
| 2 | 验收覆盖 / 可行性 | 🟡 | 新形态首次让压缩请求携带「真身」消息：`role:"tool"` 与 assistant `tool_calls` 随中段进入请求体，而请求不带 `tools` 声明（`thincoder/thincoder-core/provider/core.mjs:211` `if (tools?.length) body.tools = tools`）。探针 R1–R4 只覆盖 `[system, user]` 形态（设计档 §6.14 `:213-223`），AC1–AC6 / 用例 1–7（批档 `:73-78` / `:87-93`）只验消息形状与配对（fetch 桩），无一条覆盖「带 tool 消息 + 不带 tools 声明」的 provider 接受度；真机读数明标「非门禁」（批档 `:80`）⇒ 该格若被服务端拒（400）只落到 3 连败降级（信息损失面），无门禁兜住。 | 把该格纳入可判取证：加一条中段含 `tool` / `tool_calls` 且不带 tools 的探针（或同请求体真机重发），并把「首轮真机压缩成功」列为实施轮必得读数。 |
| 3 | 清晰性 / 内部一致性 | 🟡 | 设计档 §6.14「摘要输入域不变」条（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:235`）称「……⇒ **模型所见内容面无变化**」，与同节质量风险表（`:243-244`：修后 = 真身消息含 reasoning_content / 多模态 part ·**不截断**·「信息量↑——保真度预期↑」）自相矛盾；需求档 §2.1（`thincoder/docs/core/requirements/CONTEXT-COMPACTION.md:28`）沿用同句「摘要输入域与修前一致（只喂中段）」。 | 按「选中面（只喂中段）不变 / 表示面（不截断 · 真身结构）改变」收正两处措辞，使与质量风险表同口径。 |
| 4 | 文档状态 / 三链同步 | 🟡 | 设计档 §6.14 尾（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:262`）仍写「待主 agent 定稿……**定稿前不得落地**」，而批档 §2.7-1 已记「父侧定稿（2026-09-18 02:10）」（`thincoder/docs/batches/2026-09-18-compression-continuation.md:105`）；批档 §2.7-2（`:106-107`）仍称「需求档尚无『压缩调用前缀复用』条目……待补」，而需求档 §2.1 条目已落（`thincoder/docs/core/requirements/CONTEXT-COMPACTION.md:27-28`，其变更记录 `:87-90` 无 2026-09-18 行）；批档 §2.0（`:34`）/ §2.3（`:63`）「本档 266 → 334 行」与实测（≥335 行）亦有 ±1–2 漂移。 | 三处状态句按已落事实收正（设计档「待定稿」句 → 定稿完成指针；批档 §2.7-2 → 已补），补需求档变更记录一行，行数登记按实测口径收正。 |
| 5 | 决策依据一致性 | 🟡 | D-CC20 否决③（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:289`）以「`cacheMode` 标注的语义是『是否需显式 cache_control』而非『无缓存能力』（`thincoder-core/model-specs.mjs`）」为否决理由，而该档自述语义恰为 `"none"=unsupported`（`thincoder/thincoder-core/model-specs.mjs:20`）——引证与字段自述相反（核内 `cacheMode` 除定义外无消费点，grep 零命中）。判定本身不受影响（「双形态 = 双语义 / 双维护面」独立成立）。 | 收正该括注口径，或改引可核事实（Claude / Qwen 行即标 `none` 而其服务端具备缓存）。 |
| 6 | 文档状态 / 措辞滞后 | 🟡 | 设计档 §6.11（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:167`）称「`SUMMARIZE_PROMPT` **两端**措辞微差（非 byte-identical）」、需求档 §4.3（`thincoder/docs/core/requirements/CONTEXT-COMPACTION.md:72`）称「提示词……**各端原文自持**」——与 §6.12（`:177`）「旧档 `thincoder-vscode/src/compact.mjs` 已删——现体 = 核 export」及事实不符：全仓 `SUMMARIZE_PROMPT` 仅定义于 `thincoder/thincoder-core/context.mjs:60` 一处（`thincoder-vscode/**` grep 零命中）。本批恰以该提示词改写为标的，读者可能据 §6.11 / §4.3 去找 VSC 侧副本。 | 两处按 W6 迁核后事实收正（单源 = 核 export）；顺带核需求档 §4.2 N2（`:65`）「两端 prompts byte-identical、有比对测试」是否仍适用。 |
| 7 | 证据口径 | 🔵 | 设计档 §6.14「机制对照」行（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:211`）给「53354 字符」请求体 ↔ 命中「131328 / 134061」token（≈2.5 token/字符），与同节轨迹表（`:209`，压缩调用 prompt 108590 / cached 256）同源；该换算在 BPE 口径下不可达（CJK ≈ ≤1 token/字符），两读数疑似不同口径或转录误差。轨迹档不在仓内 ⇒ 本项**未实证**（仅就设计档内部数值互推）。结论面不受影响（探针表 `:215-223` 自成一致：493→256 / 747→512 与「256 整块 floor」相符）。 | 注明两处读数的口径（是否同一请求体 / 字符是否含 JSON 转义 / 是否同一会话），使 98.0% 与 0.2% 两读数可复算。 |
| 8 | 副作用面（未评估） | 🔵 | 轨迹落盘记录**全量**出站 `messages`（`thincoder/thincoder-core/traces/trace-store.mjs:240`；纪律 = 完整落盘不截断 `:22-24`）：新形态把中段真身（含每轮 reasoning_content 与多模态 base64 part）写进 `stage:"compress"` 行，单行体积从修前的序列化文本升至中段全量；§6.14 退化面（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:249-254`）未评估此副作用（清理面只按 mtime 保留期，`trace-store.mjs:284`）。 | 在 §6.14 退化面或批档 §2.7 补一行轨迹体积登记（含多模态 base64 面），并明示接受（或登记为后续候选，不进本批）。 |
| 9 | 质量风险残余 | 🔵 | 输出面守卫只有「空白摘要」（设计档 §6.14 退化面 3 `:254` / 用例 6 批档 `:92`）：新形态下模型处于「对话续写」框架，**非空白但非摘要**的输出在请求面无判据，会作为 `note` 落进 `applyCompression` 并计为成功（`thincoder/thincoder-core/context.mjs:423`）；设计已把「输出面偏移」记为风险（`thincoder/docs/core/design/CONTEXT-COMPACTION.md:246`）但无观测量。 | 明确该残余的处置口径（接受并登记 / 或加一条可判观测量，如真机读数的摘要形状抽查），使「改写不到位」风险有可观测出口。 |

计数：🔴 1 · 🟡 5 · 🔵 3（合计 9）

VERDICT: changes-required

### 轮次 2（评审子代理）

轮 2 修项核验（逐项验落位与自洽 — 对象 = 压缩续写批 #39 · fix 轮 id=48；本场只读 = 三档全文 + 批内引用坐标抽检；轨迹/探针读数属仓外，标注不可复核处）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 🔴#1 | `thincoder/docs/core/design/CONTEXT-COMPACTION.md` §6.14 `:248-250` · `thincoder/docs/batches/2026-09-18-compression-continuation.md` §2.3 `:61-66` | 🔴 | Fixed | 拆分方案落位——设计档 `:248`＝「**落地形态（模块拆分 · 行数预算 · 评审 #1）**：纯函数 `buildCompressMessages` 落**拟新增**核档 `thincoder-core/compress-form.mjs`（≈30 行——零 import 依赖：指令文本由实参传入，不与 `context.mjs` 成环）」；`:249`＝「`thincoder-core/context.mjs` 只留接线（import + 调用 + 空白摘要守卫 2 行）并**减去** `serialized` 序列化段（`thincoder-core/context.mjs:388-400`，13 行）——**行数口径 = `wc -l`**（= 机检 `thincoder-core/test/core-hygiene.test.mjs:99` 的判定口径）」；`:250`＝「现况 499 行（read 口径 500）⇒ 落盘净 Δ ≈ −10（+3 / −13）⇒ **落盘 ≈ 489 行**，预算上限 495（硬限 500 留 ≥5 行余量）；先例 = 同档 `thincoder-core/context.mjs:495-497`」。批档 §2.3 `:61-63` 受影响文件表已带新档行（`compress-form.mjs` ≈+30 / 新测试档 ≈+105 行）· `:66`＝「**行数口径**：一律 `wc -l`（= 机检口径，`thincoder-core/test/core-hygiene.test.mjs:99`——`>500 = 硬红`）——AC6 与本表 Δ 同口径（评审 #1 收正）」。抽检（本场 read）：`thincoder/thincoder-core/context.mjs:388`「const serialized = middle」…`:400`「.join("\n")」＝13 行可退役段 ✓；全档 read 末行 `:500` 为空行 ⇒ 与注记「`wc -l` 499 / read 500」双口径自洽（机检公式 = `split("\n").length - 1`，`core-hygiene.test.mjs:98` 注「wc -l semantics」）✓；499/500 − 13 + 3 = 489/490，两种起算均 ≤495 预算 / ≤500 硬限 ✓；`core-hygiene.test.mjs:99`「if (lines > 500) hard.push(...)」仍为硬红机检 ✓；glob 全核 `**/*.mjs` 无 `compress-form.mjs` / `test/compress-form.test.mjs` ⇒「拟新增」标注如实 ✓（≈30/105 行 ≤300 ⇒ 免登记 ✓）；先例坐标 `context.mjs:495-497` 实读一致（「2026-09-05 module-split：524 > 500 硬限」）✓。 |
| 2 | 🟡#2 | 设计档 §6.14 `:228-233` · 批档 §2.4 `:82`/`:84`/`:86` · §2.5 `:100` | 🟡 | Fixed | 取证项三面均落——设计档 `:228`＝「**取证项——provider 接受度（评审 #2 补 · 实施轮必得读数）**：…而请求**不带 tools 声明**（`thincoder-core/provider/core.mjs:211`——`tools?.length` 为空则不发 `body.tools`）」·`:231`＝「**离线取证** = 用例 8（…——批次档 §2.5）」·`:232`＝「**真机取证**（人工核验 · **非 CI 门禁**）：**首轮真机压缩成功**（非 400 · 摘要非空落盘）+ 该请求体真机重发被接受」·`:233` 明示未兜住面；批档 `:82`＝AC7 行（「…被 provider 接受（非 400）；离线面 = `body.tools` 缺省且中段 tool 配对完整（评审 #2 补） | 用例 8（fetch 桩）+ 实施轮真机必得读数①…」）·`:84`＝「**真机读数（实施轮必得 · 人工核验 · 非 CI 门禁）**：① **首轮真机压缩成功**…」· §2.5 `:100`＝用例 8（带 tool 中段 + 不带 tools 声明）。抽检：`thincoder/thincoder-core/provider/core.mjs:211` 实读「if (tools?.length) body.tools = tools」✓。 |
| 3 | 🟡#3 | 设计档 `:245` · `thincoder/docs/core/requirements/CONTEXT-COMPACTION.md` `:28` | 🟡 | Fixed | 设计档 `:245`＝「**摘要输入域（选中面）不变 / 表示面改变**（评审 #3 收正）：修前同样只喂中段…⇒ **选中范围不变**；中段的**表示面**改变（序列化文本 → 真身消息 · 不截断）…（旧「模型所见内容面无变化」句作废）」——与同节质量风险表 `:256-257`（「信息量↑——保真度预期↑」/「不截断」）同口径 ✓；需求档 `:28`＝「**选中面**与修前一致（仍只喂中段），**表示面**改变（真身消息、不截断——保真度预期↑）；切点须为配对安全边界」✓ 两处一致。 |
| 4 | 🟡#4 | 设计档 `:280-281` · 批档 `:34`/`:113-114` · 需求档 `:91` | 🟡 | Fixed | 设计档 `:280`＝「**`SUMMARIZE_PROMPT` 定稿（主 agent 内容权 · 2026-09-18 02:10——已完成 · 评审 #4 收正）**…」；`:281`＝「原「定稿前不得落地」句随定稿完成退役——**落地解锁**（实施轮可直接落）」（旧句 read 全档已无）✓；批档 `:113-114`＝「**需求档条目（已补 · 主 agent · 2026-09-18）**…变更记录同批补 2026-09-18 行——三链（批次档 §2 / 设计档 AC / 需求档）齐」；需求档 `:91` 已有 2026-09-18 变更记录行 ✓；批档 `:34`＝「（本档 266 → 358 行 · `wc -l` 口径——评审轮 1 收正后的现值）」✓ 行数注已收正（设计档 read 至 `:358` 止）。 |
| 5 | 🟡#5 | 设计档 `:265` / `:308` | 🟡 | Fixed | `:265`＝「**否决「按 `cacheMode` 分派回旧序列化形态」**（评审 #5 收正引证）：双形态 = 双语义 / 双维护面；且 `cacheMode` 是**静态模型能力标注**（`thincoder-core/model-specs.mjs:20`——核内除定义与测试断言外零消费），而「前缀可否复用」是**调用期事实**…⇒ 分派判据错位」；`:308`＝「…原「标注语义 = 需显式 cache_control ≠ 无缓存」引证作废——评审 #5」。抽检：`thincoder/thincoder-core/model-specs.mjs:20` 实读「cacheMode: context caching mode: "auto"=automatic / "prompt"=needs explicit / "none"=unsupported」✓；全核 grep `cacheMode` 命中仅 `model-specs.mjs`（定义/表/`DEFAULT_SPEC`）+ `test/model-specs.test.mjs:29`（断言）⇒「除定义与测试断言外零消费」如实 ✓；备选事实未采纳的处置登记于批档 `:142` ✓。 |
| 6 | 🟡#6 | 设计档 `:167-168` / `:178` · 需求档 `:65` / `:73` | 🟡 | Fixed | `:167`＝「**提示词单源（W6 / W15 迁核后收正 · 2026-09-18 · 评审 #6）**：`SUMMARIZE_PROMPT`（`thincoder-core/context.mjs:60`）与 `EXPLORE_SUMMARY_PROMPT`（`thincoder-core/explore-distill.mjs:21`）现体均为**核单源**」—旧「两端措辞微差（非 byte-identical）」句退役 ✓；`:178` VSC 列＝「…`thincoder-vscode/src/explore-distill.mjs` 现为**调用期适配器**（W15 已落——只 import 核面）」✓；需求档 `:65`（N2）＝「**2026-09-18 收正（W6 迁核后）**：压缩面已**单源**…旧「两端 prompts byte-identical + 比对测试」判据随副本退役」·`:73`＝「提示词（`SUMMARIZE_PROMPT`）**单源 = 核 export**…旧「各端原文自持」口径退役」✓。 |
| 7 | 🔵#7 | 设计档 `:212-214` | 🔵 | Fixed | `:213`＝「**口径注（评审 #7）**：档内「53354 字符」的**计量对象未记**（是否 messages-only / 是否含 JSON 转义 / 是否同一会话）——与 token 读数不可直接换算（≈2.5 token/字符，BPE 口径不可达）⇒ 疑非同口径或转录误差」；`:214`＝「该换算**未实证**（轨迹档不在仓内）；结论不依赖它——探针表自成一致，修前 0.2% 命中率另由上方轨迹表直接给出」✓（轨迹/探针读数属仓外，本场不可复核——与档内标注一致）。 |
| 8 | 🔵#8 | 设计档 `:268-270` | 🔵 | Fixed | `:268`＝「**轨迹体积副作用（登记 · 接受 · 评审 #8）**：轨迹纪律 = **完整落盘**（不截断 / 不丢行——`thincoder-core/traces/trace-store.mjs:22-24`；写入面 `:240` 落出站 `messages` 全量）」；`:270`＝「清理面不变（按 mtime 保留期 prune——`thincoder-core/traces/trace-store.mjs:284`）：**接受，不新增机制**（traces 默认 OFF · 诊断面）」。抽检：`trace-store.mjs:22-24`（「**完整落盘**（不截断、不丢行、不丢记录）」）/ `:240`（「writeValue(msgParts, "messages", opts.messages ?? [])」）/ `:284`（「export async function cleanupTraces({ dir = tracesRoot(), retentionHours = 24 } = {})」）实读均一致 ✓。 |
| 9 | 🔵#9 | 设计档 `:271-272` · 批档 `:86` | 🔵 | Fixed | `:271`＝「**非空白但非摘要的输出（残余 · 登记 + 观测口径 · 评审 #9）**…会作为 `note` 进 `applyCompression`（`thincoder-core/context.mjs:423`）并计为成功」；`:272`＝「**接受该残余**（无可离线机判的形态）；观测出口 = 实施轮真机读数增一项**摘要形状抽查**（要点式 / 含 FILES CHANGED · UNRESOLVED 清单）——不达标 ⇒ 上抛，不静默通过」；批档 `:86` 读数③同构 ✓（`context.mjs:423` 实读「applyCompression(agent, split.headEnd, split.tailStart, COMPACTION_PREFIX + summary.content)」✓）。 |
| 10 | (new) | `thincoder/docs/batches/2026-09-18-compression-continuation.md` §2.4 `:81` vs §2.9 `:139-140` | 🟡 | New | AC6 基线读数与 §2.9 复跑读数未对齐——`:81`：「\| AC6 零回归 \| `npm test`（thincoder-core）全绿；机检读数不劣于基线（悬空 453 · 行宽 2 · 拟新增 3） \| `node test/run.mjs` + `node scripts/doc-check.mjs` \|」；`:139`：「…唯一新增锚 = `compress-form.mjs`（路径/坐标 · 带「拟新增」标记 ⇒ 列报 · 不入闸；拟新增 3 → 4）；」·`:140`：「悬空 452 → 455 与行宽 2 → 5 的**余量全部落在他批在途档**（…——非本批文件面；AC6 的全局基线比较须按档归属读）。」⇒ 三数不同（453 vs 452→455 · 2 vs 2→5 · 3 vs 3→4），且「按档归属读」限定只在 §2.9、AC6 单元格未带 ⇒ 按 AC6 字面执行会判「劣于基线」红（本批自身新增门禁违规 = 0；`doc-check` 本场不可运行 ⇒ 仅档内互推）。 | 建议 AC6 内同步 §2.9 的读数与限定（按档归属 / 全局与本批两读数并列），使 AC6 自足可执行。 |

计数：已核 9 项（🔴1 / 🟡5 / 🔵3）全部落位；剩余 = 🔴0 · 🟡1（新增，非阻断）· 🔵0。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-18 01:47 用户裁定「可以」= 本批批准**（「开 #39 压缩续写」）；设计评审轮 1 = changes-required（🔴1 · 🟡5 · 🔵3）→ fix 轮（id=48）→ **轮 2 = PASS**（9 项全 Fixed · 新增 1 条 advisory 🟡（AC6 口径）——父侧已就地收正 AC6 格）⇒ 实施轮派发（eng-coder · initial）。

## §5 实施记录（eng-coder）

### 实施轮（eng-coder · 2026-09-18 · initial）

**交付摘要**：压缩调用形态按设计 §6.14 / D-CC20 落地——请求 = `[system(=extras.systemPrompt)] + history.slice(0, tailStart) 原样 + [指令]`（不带 tools · 不带序列化正文）+ 空白摘要守卫；`SUMMARIZE_PROMPT` 按父侧定稿改写（首句 + 删 `Work log:` 标签）。三档 = 新核模块 + 接线 + 新测试档；`context.mjs` 落盘 **492 行**（预算 ≤495 · 硬门 ≤500）。

**改动清单（逐处 file:line）**：

| # | 文件 | 处 → 行 | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/compress-form.mjs` | 新档 · `:12-18`（wc -l = 20） | 纯函数 `buildCompressMessages(history, tailStart, systemPrompt, instruction)`：有 system 先带；`history.slice(0, tailStart)` 原样引用（不拷贝/不截断）；尾加指令一条。零 import（指令文本实参传入 ⇒ 与 `context.mjs` 零环） |
| 2 | `thincoder-core/context.mjs` | `:15` | `import { buildCompressMessages } from "./compress-form.mjs"` |
| 3 | 同上 | `:61` | `SUMMARIZE_PROMPT` 首句 → 定稿文本（见下方§判断存疑 1） |
| 4 | 同上 | `:72` | 删 `Work log:` 标签行与其后空行 ⇒ 模板尾 = 末条要求后单个换行；其余 9 条要求与末段砍价优先级逐字不动 |
| 5 | 同上 | `:386-390` | 删 `serialized` 序列化段（原 `:388-400` · 13 行）；补形态注释（§6.14 指针 + 真机读数引脚） |
| 6 | 同上 | `:399` | 调用 = `buildCompressMessages(history, split.tailStart, extras?.systemPrompt, SUMMARIZE_PROMPT)`（切点单一真值 = 同一 `tailStart`） |
| 7 | 同上 | `:411-413` | 空白摘要守卫：`if (!summary.content?.trim()) throw new Error("compaction summary is empty")`（落点 = `applyCompression` 之前 ⇒ 抛错进失败计数链、history 零改写） |
| 8 | `thincoder-core/test/compress-form.test.mjs` | 新档（wc -l = 213） | 用例 1–8（fetch 桩 + 纯函数断言）：形态 / 前缀性质 / 并入分支切点 / 并行工具配对 / 无 system 退化 / 空白摘要 / 失败与中止 / 带 tool 中段 + 不带 tools |

**零改动核对（与设计 §2.3 逐条一致）**：`agent.mjs` · `agent/run-stages.mjs` · `thincoder-vscode/src/agent/run-stages.mjs` · `provider/**` · `thincoder-cli/**` · `scripts/**` · 既有提示词面其余内容 · 冻结批档 / `_archive/**` / 参照树——`git status` 对本批三档之外零触碰（工作树内 `manifest.mjs` / `eng.mjs` / `tool-seams-agent.test.mjs` 的改动属他批在途，见下方读数标注）。

**读数（先红 → 修复 → 复跑）**：

| 轮 | 命令 | 读数 |
|---|---|---|
| 先红 A（实施前 · 新核档未建） | `node --test test/compress-form.test.mjs` | tests 1 · pass 0 · **fail 1**（`ERR_MODULE_NOT_FOUND: compress-form.mjs`） |
| 先红 B（新核档已建 · `context.mjs` 未接线） | 同上 | tests 8 · pass 1 · **fail 7**（用例 1–6、8 红；用例 7 绿 = 既有失败语义护栏，设计已定） |
| 修复后（接线完成） | 同上 | tests 8 · **pass 8** · fail 0 |
| core 全量 | `npm test`（thincoder-core） | tests 316 · pass 315 · **fail 1** —— 唯一失败 = `core-hygiene` 的 `manifest.mjs: 318`（>300 未登记）。**归因**：`manifest.mjs` 工作树被**他批在途**改至 318 行（HEAD = 268 行；该档不在本批文件面，本批零触碰），与本批改动无因果 |
| CLI 全量 | `npm test`（thincoder-cli） | tests 628 · **pass 628** · fail 0 |
| VSC 全量 | `npm test`（thincoder-vscode） | tests 593 · pass 592 · **fail 1** —— 唯一失败 = `test/portability-vsc-advisor-context.test.mjs:73`（T-V13 eng-enter 文案）。**归因**：实际输出为该档新文案「工程模式启动拒绝：会话锚…不是 git 仓…」，该文案仅存于**工作树** `manifest.mjs`（HEAD 零命中）⇒ 他批在途所改机制，非本批面 |
| 机检（锚 + 行宽） | `node scripts/doc-check.mjs` | 开工基线：悬空 **452** · 行宽 **2** · 拟新增 **4** ／ 收尾：悬空 **451** · 行宽 **2** · 拟新增 **3**。差集逐条复核 = 出列 2 行（本批 `compress-form.mjs` 拟新增行转正 + 他批一符号锚），**新增 0 行** ⇒ 本批面零新增（行宽 2 = `docs/core/design/prompts/persona-engineering.md:137/139` 既有他批面） |
| 落盘行数 | `wc -l` 口径 | `context.mjs` **492**（预算 ≤495 · 硬门 ≤500 余 8）· `compress-form.mjs` **20** · `test/compress-form.test.mjs` **213**（≤300 软线 ⇒ 免登记） |

**真机读数（实施轮必得 · 人工核验面；临时探针档用后已删；原始日志 `_b39_probe6.log` 留档）**：

- **① ✅ 首轮真机压缩成功**（deepseek-flash · 真实 `compressIfNeeded` 调用点）：请求被接受（非 400）· 摘要非空（trace `content` 827–1066 字符；note 全文 1211 字符）· history 正确重建（note + 占位/并入分支 + 尾部保留，`_runStartHistoryLen` 与分支一致）· `_lastCompressInfo = { mode: "summary", tokensFreed: 6485, elapsedMs: 3537 }`。
- **③ ✅ 摘要形状抽查**：要点式（11–21 条 bullet）· 含 `FILES CHANGED` 与 `UNRESOLVED ISSUES / TODOS` 清单 · 第一人称交接笔记 · 设计锚点单列 ⇒ 达标（无「非摘要输出」形）。
- **② ❌ 不达标（命中 0%）· 根因已定位**：受控真机序列（deepseek-flash · nonce 全新前缀 · 单进程 · 同模式同前缀单变量）：

  | 步 | 请求形态 | prompt / cached |
  |---|---|---|
  | W1 | 回合形态（system + 全量 194 条 + **tools** · thinking 配置） | 12941 / 0 |
  | W2 | W1 重发 | **12941 / 12800 = 98.9%**（前提「回合调用 ≥0.9」成立） |
  | W3 | 压缩形态（system + 中段 117 + 指令 · **无 tools** · 同模式） | **6092 / 0 = 0%** |
  | X1→X2 | 回合形态（非思考模式）→ 重发 | 0 → **98.9%** |
  | **X3** | 压缩形态 **+ tools**（同模式） | **8345 / 7808 = 93.6%** |
  | **X4** | 与 X3 逐字同请求 **去 tools** | **6090 / 0 = 0%** |

  **结论（实测）**：deepseek-flash 的命中面**按 `tools` 声明分区**——同模式同前缀下携带 tools 的压缩形态命中 93.6%，不携带（= 设计 §6.14 / D-CC20 ② 选定形态）命中 **0%**；与本批修前基线 256 / 108590 = 0.2% 相当 ⇒ **本批实测收益 ≈ 0**。
  **与设计冲突（上抛父侧）**：设计 §6.14 探针表 R1–R4「不带 tools 的 R2/R4 命中了带 tools 的 R1 所建前缀 ⇒ 不带 tools 是正确形态」在生产尺度**不成立**（该读数疑为 493/747 token 小样本的「256 首块」假象）。**本轮按设计落地、未偏**（无 tools 是设计决定，非实现取舍）；归**父侧裁决**——候选 = 压缩请求随带 tools（须另决 tool_call 风险处置，如 `toolChoice` 抑制），或接受零收益。

**内部审计（explore 子代理 · 只读 · 交付面 vs 设计/任务书）**：终态 = **divergence-found**——四类偏差中 PARTIAL / SILENT-SIMPLIFICATION / OUT-OF-LIST **零命中**，AC1–AC7 逐条落位；仅 **3 条 🔵 文档漂移**（登记交父侧，非本席写域）：

| 审计发现 | 级别 | 处置 |
|---|---|---|
| `context.mjs:61` 被设计档 `:167` / 需求档 `:73` 引为 `:60`（本批 `:15` 新增 import 行所致的 +1 位移） | 🔵 | 登记 → 父侧/designer（doc-check 坐标锚不因偏移报红，已复跑核） |
| 设计档 `:250`「落盘 ≈489」vs 实测 **492**（`wc -l`；预算 ≤495 与硬限 ≤500 均成立，差 = +3 形态注释行） | 🔵 | 登记 |
| §5 前段行 3 指针「（见下方§判断存疑 1）」当时无对应小节 | 🔵 | 已由本段「判断存疑 1」承接（下文） |

**代码评审（advisor · type=code · 交付前独立评审）**：终态 = **pass**（无 🔴；🟡 3 + 🔵 3，均非阻断）。

| # | 级别 | 发现（file:line） | 本席处置 |
|---|---|---|---|
| 1 | 🟡 | `thincoder-core/test/compress-form.test.mjs:7-8` 档头沿用设计期探针结论（「探针 R2/R4：tools 的携带与否不阻断命中」），与同批另两档的实测记录矛盾（`compress-form.mjs:7-8` 93.6% vs 0% · `context.mjs:390`） | **已修**（`:7-9` 改为「前缀复用口径见 `compress-form.mjs` 档头：命中面按 `tools` 声明分区——实施轮真机读数 2026-09-18」）；修后复跑 8/8 绿 |
| 2 | 🟡 | 设计档同档三处仍按已退役序列化面描述摘要输入：`:80`「中段序列化为文本（`[assistant][ called tools: …]`）——无 orphan 风险」· `:99`「序列化 user 8000 / tool+assistant 2000 cap」· `:115`「序列化格式 `[role][ called tools: …] content`」，与 §6.14 `:245`/`:256-257`「表示面改变 · 不截断」冲突 | **本席逐行实读复核属实** → 登记交父侧/designer 收正（docs 写权不属本席），不阻断 |
| 3 | 🟡 | `context.mjs` 492 行 > 300 软线（advisory） | 已登记（`core-hygiene` SOFT_LINE_REGISTRY 含 `context.mjs`）+ 设计档 §6.14 `:248-250` 有 ≤495 预算裁决 ⇒ 登记债、不重开、非阻断 |
| 4 | 🔵 | §5 前段坐标差 1–3 行（调用声明 `:399` 实为 `:400`；守卫声明 `:411-413` 实为注释 `:412-413` + 代码 `:414`） | **本段收正**（见下） |
| 5 | 🔵 | 保留计数口径不一：设计 `:280` / 批档 §2.7-1 `:112`「10 条」vs 现档 9 条 bullet（`context.mjs:63-71`）/ §5「9 条」；原提示词文本不在仓内 ⇒「一字不动」不可机检 | 登记交父侧对齐口径；内容面零改动属实（必留项：两清单 · COMPLETED vs IN-PROGRESS · 第一人称 · honest · ≤1K 尾句 · 砍价优先级逐项在位） |
| 6 | 🔵 | `compress-form.mjs:16` falsy 判据（空串 ⇒ 不带头）而回合面恒带 system 头（`agent.mjs:230` / VSC `agent.mjs:247`）；空串可达性未实证 | **已修（注释面）**：`:16` 补「缺省（undefined）/ 空串 ⇒ 不带头（退化面 1）」；行为零变 |

**坐标收正（§5 前段两处，就地以本段为准）**：`context.mjs` 调用 = `:400`；空白摘要守卫 = 注释 `:412-413` + 代码 `:414`。落盘行数：`context.mjs` **492** · `compress-form.mjs` **20** · `test/compress-form.test.mjs` **213**（后档 ≤300 免登记）。

**收尾复跑（他批在途档陆续落定后的终读数）**：core `npm test` = **317 / 317 全绿**（前段 §5 记的 `manifest.mjs: 318` 红灯已由他批补登记转绿——该档非本批面）· CLI = **657 / 657 全绿** · VSC = **599 / 599 全绿**（用例数随他批在途增长：628→657 · 593→599，非本批新增）。

**判断存疑 1（首句整句替换 · 父侧内容权）**：`SUMMARIZE_PROMPT` 首句按「首句取 = X」判为**整句替换**——`You are a conversation compressor.` 角色句退役，`:61` = 定稿 X 逐字符相同（备选读法 = 保留角色句、仅替换指令子句 ⇒ 一处文本即可改回）。请父侧裁定；本席未自行取舍。

**决策透明表**：

| 决定 | 依据 | 可回退 |
|---|---|---|
| 首句整句替换（角色句退役） | 批档 §2.7-1「首句取 = X（目的子句保留）」（`You are a conversation compressor.` 若保留则「首句 = X」不成立） | ✅ 一行改回 |
| 形态注释 + 守卫注释落码（共 +4 行） | 承载裁决依据与真机读数引脚；预算内（492 ≤ 495） | ✅ 可删 |
| 真机读数用临时受控探针（用后即删） | 批档 §2.4「实施轮必得 · 人工核验 · 非 CI 门禁」；本环境无 live 会话 | ✅ 档已删 |
| 压缩形态（不带 tools）保持设计原样不动 | 形态 = 设计决定（§6.14 / D-CC20 ②），收益证伪属**父侧裁决**面——本席不自行改形 | n/a |

**fix rounds**：① 评审 #1 注释收正 + 评审 #6 注释补注（1 轮，零功能面改动）② §5 坐标与指针收正（本段）。**终态：clean**（功能面零偏离、范围面零越界；🔵 文档漂移已全数登记父侧）。

### v2 实施轮——声明面对齐（eng-coder · 2026-09-18 · fix 轮 · 承 §2.10 任务书）

**交付摘要**：压缩请求按设计 §6.14「v2 修法」随带**与回合请求同一数组的 `tools`**（`extras.tools` 原样透传，无第二构造点），并**不带 `tool_choice`**——该形态 = 设计 §6.14 `:262` 备选②，由同节 `:280` **预注册判定规则**（「S3 <0.9 且 S4 ≥0.9 ⇒ 采纳 v2 **减** `tool_choice`（备选②）」）在真机探针复测下触发（依据读数见本节「真机探针」）。tool_call 泄漏面由既有 content-only + 空白守卫兜底（设计 §6.14 `:251`）。`context.mjs` 落盘 **494**（`wc -l` 口径；read 口径 495 ≤ 预算 ≤495 · 硬限 500）。

**改动清单（逐处 file:line · as-of 本段）**：

| # | 文件 | 处 → 行 | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | `:404-406`（调用体） | 增 `tools: extras?.tools`（`extras.tools` 缺省 ⇒ 不发——退化面 1）；**不加 `toolChoice`**（备选② 形态） |
| 2 | 同上 | `:388-391` | 形态注释按 v2 + 实测口径收正（含备选② 启用依据与 `reasoning_effort` 上抛指针） |
| 3 | `thincoder-core/compress-form.mjs` | `:7-10` | 档头缓存口径段收正（v1 结论 → v2 实测：命中条件 / tool_choice 效应 / effort 面）——越出 §2.10 表（原因：档头原载「归父侧裁决」的 v1 结论，已随本轮定论失效；仅注释面、零行为） |
| 4 | `thincoder-core/test/compress-form.test.mjs` | `:216-238` | 用例 8 修订：`body.tools` 与回合请求出站值逐字节同值 + **不发 `tool_choice`** + 泄漏（响应同出 tool_calls）只取 content、零落点 |
| 5 | 同上 | `:240-251` | 新增用例 9：`extras.tools` 缺省 ⇒ `tools` / `tool_choice` 均不发（AC8 退化面 1） |
| 6 | 同上 | `:6-11` · `:96` · `:108` | 档头与用例 1 口径收正（声明面/退化面指针） |

**零改动核对**：`provider/**`（`toolChoice` 能力层四 transport 在位、零改动）· `agent.mjs` / `agent/run-stages.mjs` / `thincoder-vscode/src/agent/run-stages.mjs`（`extras.tools = toolSchemas` 同源，抽检一致）· 提示词面其余内容 · `docs/**` · 冻结批档 / `_archive/**` / 参照树。

**读数（先红 → 绿）**：

| 轮 | 命令 | 读数 |
|---|---|---|
| 先红（用例 8/9 先落 · 接线未改） | `node --test test/compress-form.test.mjs` | tests 9 · pass 8 · **fail 1**（用例 8：`body.tools` 缺省） |
| 修复后（接线完成） | 同上 | tests 9 · **pass 9** · fail 0 |
| core 全量 | `node test/run.mjs` | **318 / 318 全绿**（本批改动落定后首跑） |
| CLI / VSC 全量 | `npm test` | CLI **657 / 657** · VSC **599 / 599** 全绿 |
| 机检（`node scripts/doc-check.mjs`） | 收尾读数 | 悬空 **287** · 行宽 **2** · 拟新增 **2**（本批面**零新增**；本批唯一机检行 = 设计档 `:281` 报告面 `_b39_probe6`——不入闸） |
| 落盘行数（`wc -l`） | — | `context.mjs` **494**（预算 ≤495）· `compress-form.mjs` **21** · `test/compress-form.test.mjs` **251**（≤300 软线） |

> 三包全量的「本批面全绿」口径：上表为落定后首跑读数；其后他批在途档（`memory/**` · `peer-instances.mjs` · `process-probe.mjs` · `home-expansion` / `memory-index-face`）陆续改动，收尾复跑出红 8 / 4 / 2 条，**失败面全部落在他批文件**（本批三档零触碰；恒红项 `memory/core.mjs: 308` >300 未登记）——按档归属读、与 §2.9 同口径。

**真机探针（v2 预注册 S1–S6 + 单变量补测轮 · deepseek-flash · 生产 config：`thinking {type:"enabled"}` + `reasoningEffort "max"`；原始日志 `_b39_probe_v2{,b,c,d,e,f,g,h}.log` 留档）**：

1. **S3 格（压缩形态 + tools + `tool_choice:"none"`）**——6 格**首现全 0%**：`v2 S3` 3009/0（生产路径！）· `v2b A3` 3047/0 · `v2b B4` 3047/0 · `v2c C4` 10417/0 · `v2d D4` 11059/0 · `v2e E4` 10578/0。token 证据：`v2c C4` prompt 10417 = `C5`（不带 tools）**同值** ⇒ 该参数使服务端**丢弃 tools 区**（请求实际不再携带声明面）。
2. **S4 格（压缩形态 + tools · 无 `tool_choice`）**——`v2 S4` 3739/0（params 异值，见 3）；补测轮单变量归因后：**params 同值 ⇒ 8 格 84–98%**（`v2b A4` 84.32% · `v2b B5` 84.32% · `v2c C3` 94.75% · `v2c C6` 97.95% · `v2f F3` 95.01% · `v2f F5` 98.04% · `v2g G5` 95.81% · `v2h H4` 95.69%；≥0.9 者 **6 格**）；params 异值格 = 0%（`v2d D3` 12825/0 · `v2e E3` 12264/0 · `v2f F4` 12664/0 · `v2g G3` 12424/0）。
3. **单变量归因（补测轮）**：① `tool_choice:"none"` ⇒ 0%（6/6）；② 压缩侧 `reasoning_effort` 与回合侧**异值** ⇒ 首现 0%（`v2g G3` 0% vs `G5` 95.81%，唯一变量 = 压缩侧 params）；③ `thinking` 参数**不影响**命中（`v2f F4` thinking enabled 所建项被 `F5` thinking null 命中 98.04%）。
4. **前置闸**：7 跑全部成立（回合形态重发 96.2–98.9% ≥0.9）。
5. **生产口径（当前代码 + 生产 provider）**：`v2h H3-prod` = 生产 `compressIfNeeded` 端到端——请求被接受（非 400）· 摘要非空落盘（note 2527 字符 · `mode:"summary"`）· 响应 `tool_calls` = **0**（备选② 无抑制下**零泄漏**）· 轨迹 usage prompt 9446 / cached **0 = 0%**（因 ② 的 effort 异值）⇒ 判定句 `cached / prompt ≥ 0.9` **未达标** ⇒ 按设计 §6.14 `:278`（S6 口径格预注册）**上抛父侧**。
6. **S6 格（方法面 thinking 口径）**：`v2 S6b/S6c` 各 0% · `v2h H4/H5` 同上（H5 71.77% = 命中压缩侧自建项）⇒ 该维度不达标，处置 = 上抛（父侧裁定是否随带回合 thinking / `reasoningEffort`——涉成本面）。

**备选② 启用依据（预注册判定规则逐支对照）**：S3 <0.9 ✅（6/6 = 0%）· S4 ≥0.9 ✅（params 同值 6 格 94.75–98.04%）⇒ 命中「采纳 v2 减 `tool_choice`（备选②）」支；分支 ③（S4 <0.9 ⇒ 回退 (b)）**不成立**（S4 的 0% 格已单变量归因于 params 异值，非 tools 面）。

**上抛项（父侧裁定 · 本席写域外）**：

1. **三档形态/AC 改判**：设计 §6.14 `:244` / `:255` / `:297` / `:301` · §7 D-CC20 `:368` · 需求档 §2.1 `:27` · 批档 §2.10 `:165` / `:169`（AC1/AC7 改判文本）现载「`tools` + `tool_choice:"none"`」，与落盘形态（`tools` · 无 `tool_choice`）不符 ⇒ 须按备选② 逐处改判（父侧/designer 笔——`docs/**` 属本席禁触面）。
2. **`reasoning_effort` 面**：压缩调用现以 `thinking: null, reasoningEffort: null` 覆盖（`context.mjs:403`）⇒ 与回合侧 config 值异值 ⇒ 首现 0%；裁定随带同值则读 `v2h H4` = 95.69%（代价：completion 8147 / 31.9s——成本面）。可回退成本 = 一行。
3. **注释引证**：若父侧采纳本段读数，`context.mjs:390` / `compress-form.mjs:8` / 测试档头所引「批次档 §5」即由本段成立。

**内部审计（explore 子代理 · 只读）**：终态 = **DEVIATIONS**（PARTIAL ×1 = AC1/AC7 的 `tool_choice` 子句；DOC-DRIFT ×1 = 三档文本；SILENT-SIMPLIFICATION / OUT-OF-LIST **零命中**；AC2–AC6 ✅ · AC8 ✅ · 注释与代码一致 ✅）。

**代码评审（advisor · type=code）**：终态 = **changes-required**（🔴1 · 🟡4 · 🔵1）——🔴#1 = 同「上抛项 1/3」（形态与三档/AC 两态并存）⇒ 本席处置：读数落本段 + 上抛改判（**不**补 `toolChoice`：S3 格 6/6 = 0%，补即明知无效）；🟡#2（用例 8 引 AC 文本与实现相反 / 用例 9 空断言）⇒ **已修**（标题改引「设计 §6.14 判定规则 · 备选② 形态」· 断言标注退化面非可判别）；🟡#3（注释引证不实）⇒ **已修 + 已补**（注释收窄 + 本段读数逐格落档）；🟡#4（effort 协调项）⇒ 上抛；🟡#5（`context.mjs` 494/495 > 300 软线 = 既有登记债）⇒ 不重开（预算/硬限内）；🔵#6（档态与行数读数未收正）⇒ 上抛。

**决策透明表**：

| 决定 | 依据 | 可回退 |
|---|---|---|
| 落地备选②（`tools` · 无 `tool_choice`） | 设计 §6.14 `:280` 预注册判定规则 + `:262` 备选② 保留条款；S3 6/6 = 0% · S4 params 同值 6 格 ≥0.9 | ✅ 一行（补 `toolChoice`） |
| **不**补 `toolChoice` | S3 格 6/6 首现 0% + token 证据（服务端丢弃 tools 区 ⇒ 声明面对齐反被抵消） | ✅ 同上 |
| `reasoning_effort` 面**不改**（仍 `null`） | 设计 §6.14 `:278` 明定「涉成本面，须裁定」⇒ 父侧裁定面，本席不自行取舍 | ✅ 一行 |
| `compress-form.mjs` 档头注释收正（越出 §2.10 表） | 档头原载 v1 结论（「归父侧裁决」）已随本轮定论失效——注释与实况一致纪律 | ✅ 注释面 |
| 真机探针用临时档（用后即删） | §2.10 取证要求；读数落本段 | ✅ 档已删、日志留档 |

**fix rounds**：① 评审 #2/#3 落修（用例标题/断言语义 + 注释引证与口径收正，零功能面改动）② 本节（§5 读数逐格落档 + 上抛清单）。**终态：stalled**（功能面按预注册规则落地、范围面零越界；余项 = 父侧裁定面：三档形态/AC 改判 + effort 携带 + 档态收正）。

**收尾复跑（交付终读数 · 他批在途档落定后）**：core `node test/run.mjs` = **324 / 324 全绿** · CLI `npm test` = **668 / 668 全绿** · VSC `npm test` = **599 / 599 全绿**（本段前述「落定后首跑 318/657/599」期间的 8/4/2 条红**全部由他批作者收正**，与本批三档零因果——`memory/**` · `peer-instances.mjs` · `process-probe.mjs` · `home-expansion` / `memory-index-face` 面）。机检收尾：`node scripts/doc-check.mjs` → 悬空 **287** · 行宽 **2** · 拟新增 **2**（本批面**零新增**；唯一本批相关行 = 设计档 `:281` 报告面 `_b39_probe6`，不入闸）。落盘行数（`wc -l`）：`context.mjs` **494** · `compress-form.mjs` **21** · `test/compress-form.test.mjs` **251**。探针脚本 8 档（`_b39_probe_v2{,b,c,d,e,f,g,h}.mjs`）**用后已删**；日志 8 档留档于 `thincoder-core/`（本节读数取证源）。

### v3 实施轮——effort 同源（eng-coder · 2026-09-18 · fix 轮 · 承父侧裁定）

**交付摘要**：压缩调用随带**与回合请求同源**的 `reasoningEffort`——落法 = 移除压缩调用处的 `reasoningEffort: null` 覆盖（`context.mjs:401` ⇒ `chat({ ...agent.provider, thinking: null }, …)`；回合侧 `agent.mjs:240` `chat(agent.provider, …)` 读**同一字段**）⇒ 不硬编码、无第二构造点；未配置（`provider.reasoningEffort` 缺省）⇒ 不发、退化同修前。`thinking: null`（D9）原样保留。
**任务书来源**：设计档 §6.14 `:281-283`（父侧 2026-09-18 裁定 · 用户「好」）+ 父侧 spawn 指令；**本档 §2 无独立 v3 段**（登记：文档面待补，§2 写权属 eng-designer）。

**改动清单（逐处 file:line）**：

| # | 文件 | 处 → 行 | 改动 |
|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | `:401`（调用体） | `reasoningEffort: null` 覆盖**移除**（余 `{ ...agent.provider, thinking: null }`）——effort 随带回合同源值 |
| 2 | 同上 | `:392-393` | 形态注释增 v3 段（裁定依据 / 不硬编码 / 缺省同修前 / deepseek 实证值 / 族差与窗差登记指针）；`:388` 标题 v2 → v2/v3 |
| 3 | `thincoder-core/test/compress-form.test.mjs` | `:9-11` | 档头增 v3 口径行（同源 + 用例 10/11 指针） |
| 4 | 同上 | `:254-271` | **新增用例 10**：压缩体 `reasoning_effort` = 配置值（"max"）+ 与回合出站体同值 + `thinking` 恒不发；另一档（"low"）随之改变 ⇒ 非硬编码 |
| 5 | 同上 | `:273-285` | **新增用例 11**（退化）：provider 未配置 `reasoningEffort` ⇒ 压缩 / 回合两侧均不发（缺省同修前） |

**零改动核对**：`compress-form.mjs`（21 行 · v2 期原样）· `provider/**` 四 transport · `agent.mjs` / `agent/run-stages.mjs` / VSC `run-stages.mjs` · 提示词面 · `docs/**` · 数据面 · 冻结批档 / `_archive/**` / 参照树——`git diff` 本批仅上表两档。

**读数（先红 → 复跑）**：

| 轮 | 命令 | 读数 |
|---|---|---|
| 先红（用例 10/11 先落 · `context.mjs` 暂存为改前态） | `node --test test/compress-form.test.mjs` | tests 11 · pass 10 · **fail 1**（用例 10：`reasoning_effort` undefined ≠ "max"；用例 11 两侧兼容为退化护栏） |
| 修复后 | 同上 | tests 11 · **pass 11** · fail 0（既有 9 例全在） |
| core 全量 | `node test/run.mjs` | **326 / 326 全绿** |
| CLI 全量 | `npm test`（thincoder-cli） | **669 / 669 全绿** |
| VSC 全量 | `npm test`（thincoder-vscode） | **599 / 599 全绿** |
| 评审 #2 注释收正后 | `node --test test/compress-form.test.mjs` | tests 11 · **pass 11** · fail 0（零行为面） |

**真机探针（生产口径 · deepseek-flash · 生产 config：`thinking {type:"enabled"}` + `reasoningEffort "max"` · proxyUri 无 · 临时探针档用后已删）**：

判定句 = **生产口径首现命中 `cached / prompt ≥ 0.9`**——两次独立运行（nonce 全新前缀 · 单进程 · 单变量）：

| 步 | 请求形态 | 运行 1（prompt/cached/hit） | 运行 2 |
|---|---|---|---|
| A | 回合形态（system + 60 条历史 + tools · 生产参数） | 13718 / 0 = 0% | 13598 / 0 = 0% |
| B | 回合重发（**前置闸**：会话命中面可用） | 13718 / 13568 = **98.91%** | 13598 / 13440 = **98.84%** |
| **D** | **生产 `compressIfNeeded`（判定格）** | 8546 / 7936 = **92.86%** ✅ | 8474 / 7936 = **93.65%** ✅ |
| E | **单变量对照**：同一请求体**去** `reasoning_effort`（= 修前形态） | 8546 / 0 = **0%** | 8474 / 0 = **0%** |

- **命中率对照：修前 0%（v2 `v2h H3-prod`：9446 / 0）→ 本批 92.86% / 93.65%**（两样本均 ≥0.9；对照格同请求体去 effort ⇒ 0%，单变量归因成立）。
- **D 请求参数**（两次一致）：`reasoning_effort=max` · `thinking` 不发 · `tool_choice` 不发 · `tools=2` · `msgs=38`（1 system + 36 中段 + 1 指令）· `max_tokens=393216`。
- **成本读数（D 格）**：completion **971**（含 reasoning 454）· **4.49 s** ／ **1071**（含 reasoning 631）· **5.88 s**；`httpCalls=1`（无重试）· `compacted=true` · 摘要非空（note 2499 / 2227 字符）· 响应 `tool_calls` = **0**（备选② 无抑制下零泄漏）· `finish=stop`。父侧预期「8147 tok / 31.9 s」系 ~100K 量级口径，本探针 prompt ≈8.5K ⇒ 成本读数不同量、不可直接对比。
- **摘要形状观察**（设计 §6.14 退化面 5 观测出口）：要点式交接笔记（11–13 条 bullet）· 运行 1 含 `UNRESOLVED` 清单、运行 2 含 Context/current-task 结构；`FILES CHANGED` 清单未出现 = **夹具无文件改动**（模型按需省略），非形态缺陷。
- **取证**：`~/.thincoder/traces/2026-09-18/3f9ef1f14f24-3534.jsonl` · `…-3538.jsonl`（`"stage":"compress"` 行 · usage 全量：`prompt_tokens_details.cached_tokens` = 7936 两跑同值——256 整块对齐面）。

**行数落盘（`wc -l` 口径 = `split("\n").length - 1`）**：`context.mjs` **495**（设计预算 ≤495 · 硬限 500 余 5）· `compress-form.mjs` **21**（未改）· `test/compress-form.test.mjs` **285**（≤300 软线 ⇒ 免登记）。

**机检（`node scripts/doc-check.mjs`）**：悬空 **286** · 行宽 **3** · 拟新增 **2**。行宽 +1 = `docs/core/requirements/CONTEXT-COMPACTION.md:27`（326 字符——父侧本轮笔，非本席写域）；**本批代码面机检零新增**（三档均不含文档锚面）。

**内部审计（explore 子代理 · 只读）**：终态 = **DEVIATIONS**——PARTIAL ×1（= 本节尚未写入的 v3 读数，即本段补齐）· DOC-DRIFT ×2（批档 §5 无 v3 段/行数读数滞后 → 本段消化；设计档 `:303` 状态句滞后 → 上抛）· SILENT-SIMPLIFICATION / OUT-OF-LIST **零命中**；AC①–⑤ 逐条落位，注释↔代码一致，探针档已删、无调试残留。

**代码评审（advisor · type=code）**：终态 = **pass**（🔴 0 · 🟡 2 · 🔵 3，均非阻断）。

| # | 级别 | 发现（file:line） | 本席处置 |
|---|---|---|---|
| 1 | 🟡 | 百炼 qwen 族派生字段仍异值：压缩侧 `thinking: null` 首判命中 `config.mjs:137` ⇒ `enable_thinking:false`（`core.mjs:210`），回合侧走 `config.mjs:138` ⇒ `true` ⇒ 该族判定句可能仍不可达（服务端分区**未实证**）；且该组合被仓内标为 contradictory payload（`thincoder-vscode/src/extension/reasoning-mode.mjs:30-31`），修前压缩体无 `reasoning_effort` ⇒ v3 新引入组合 | **登记 + 上抛**（修法涉需求档 N1「摘要调用 `thinking:null`」与 provider 发送面 ⇒ 父侧裁；本席不自行扩面） |
| 2 | 🟡 | 注释「同字段 ⇒ 同值」在 autoThink 路径为假：`agent.mjs:224` 压缩检查先于 `:234-237` 分类改写（`auto-think.mjs:113` 写 `agent.provider.reasoningEffort`）⇒ turn 0 存在改写窗口（默认 `autoThink=false`） | **已修（注释面）**：`:393` 改「同字段 + 族差/窗差登记指针」，零行为变；窗口本身登记上抛 |
| 3 | 🔵 | 用例 10 的「同源」对照为测试自造回合请求 ⇒ 锁字段透传、非生产同值 | 登记（用例语义边界入档头 `:9-11` 口径） |
| 4 | 🔵 | 压缩调用现继承 provider enum 校验（`core.mjs:198-202` 抛错面）——越 enum 配置下压缩先走失败链（`run-stages.mjs:75-85`）；回合同因亦失败 | 登记（同参数面 = v3 本意；接受） |
| 5 | 🔵 | `context.mjs` 495 行已贴设计预算（>300 软线 = 既有登记债，R3 不重开） | 不重开；下次触碰该档时优先归档注释 |

**fix rounds**：① 评审 #2 注释口径收正（1 轮，零功能面改动）② 本节落档（读数 + 上抛清单）。**终态：clean**（判定句达标：生产口径 92.86% / 93.65% ≥ 0.9；功能面零偏离、范围面零越界；两条 🟡 为族差/窗差登记项，属父侧裁定面）。

**上抛项（父侧裁定 / 写域外）**：

1. **百炼 qwen 族 `enable_thinking` 派生差**（评审 #1）——若要该族也吃命中，需在**发送面**对齐该字段；与需求档 §4.2 N1「摘要调用 `thinking:null`」相冲 ⇒ 父侧裁（或明写本批裁定证据面 = deepseek-flash）。
2. **autoThink 改写窗口**（评审 #2）——`turn 0` 压缩检查先于分类改写；对齐顺序（压缩检查落点）属父侧裁，本席未自行动。
3. **docs 三处收正（父侧/designer 笔）**：设计档 §6.14 `:303` 状态句（仍载「残留 0% 根因…上抛父侧裁定」）· 需求档 §2.1 条目 + 变更记录（v3 行）· 本档 §2 补 v3 段（现无）。
4. **同类面（不在本批）**：`explore-distill.mjs:104` 仍以 `reasoningEffort: null` 覆盖（§2.7-3 已登记为后续候选）。

**决策透明表**：

| 决定 | 依据 | 可回退 |
|---|---|---|
| 落法 = 删 `reasoningEffort: null` 覆盖（不新增显式传参） | 设计 §6.14 `:282`「同源 `/` 不得硬编码」；回合 = `chat(agent.provider, …)` 同字段 ⇒ 最小接线 | ✅ 一行 |
| `thinking: null` 保持不动 | D9 + 探针 F4/F5（该参数不影响命中）；父侧裁定只涉 effort | ✅ 一行 |
| 族差/窗差**不改**（只登记上抛） | 越出父侧裁定面（涉 provider 发送面 / 需求 N1 / 循环顺序）——不自行取舍 | n/a |
| 真机探针用临时档（用后即删）+ 生产 config 直连 | §2.4/§2.10 取证要求（人工核验 · 非 CI 门禁）；读数落本节 | ✅ 档已删 · 轨迹留档 |

## §6 验证与收口（父代理）

**收口（2026-09-18）**：

- **验收**：v1（消息序 / 切点单源）· v2（声明面对齐——备选②）· v3（effort 同源）逐版落位；**判定句达标**——生产口径首现命中 **92.86% / 93.65%**（两次独立运行；对照改前 0%）；单变量归因链完整（tools 分区 93.6% → `tool_choice` 丢弃 tools 区 0% → effort 异值 0% → 同源 92.9/93.7%）。
- **提交**：`58638c4a`（v1）· `747d47f8`（v2）· `c38176e0`（v3）。
- **成本读数**（v3 · D 格）：completion 971–1071（含 reasoning 454–631）· 4.49–5.88 s/次；`httpCalls=1` · 零泄漏（响应 `tool_calls` = 0）· 摘要形状 = 要点式交接笔记 11–13 条（含 `UNRESOLVED`）。
- **残留（登记）**：① 派生差两则（百炼 qwen 族 `enable_thinking` 首判差 / autoThink 窗口）⇒ **台账 #56** ② `explore-distill.mjs:104` 同类覆盖 ⇒ **#47 批**（id=8 在跑）③ 批档 §2 无独立 v3 段（v3 任务书来源 = 设计 §6.14 裁定段 + 父侧 spawn 指令——记此）。
- **三账**：台账 **#39** 可核销；批档冻结；收口日期 2026-09-18。
