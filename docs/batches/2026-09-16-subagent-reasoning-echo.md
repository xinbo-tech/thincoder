# 子代理压缩后推理链回传断裂（SUBAGENT-REASONING-ECHO）· 批次记录（2026-09-16）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-16 · 来源 = 用户「可以，另开一批」（2026-09-16 00:33）——针对 VSC 端实测暴露的第 3 处缺陷。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮 pass，实施在飞（2026-09-16）· 执行宿主 = CLI**（设计评审轮 1 = **pass**〔0🔴 / 6🟡 / 4🔵——发现表见 §3 · 父侧裁决已随 eng-coder 任务书落〕；**VSC 宿主 spawn 虽已打通（子代理可跑 7+ 回合），但凡触发上下文压缩的子代理必死于此缺陷**；§1 已备齐决定性证据）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 需求池「子代理压缩后推理链回传断裂」条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> **同链前序缺陷**（VSC 侧，均已修并收口）= ① `agent.tools` 未装配（`docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md`）② 子代工具表重名（`docs/batches/2026-09-15-vsc-tool-table-dup.md`）。
> 上游：台账 `docs/TODO.md` · 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2——本档不重述）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 · 执行宿主 = CLI（2026-09-16）**——VSC 端实测第 3 轮：spawn 通道已打通（子代理真跑 7+ 回合、读档、调工具），
但 5 个设计轮**全部**死在同一处：`LLM API error 400: The \`reasoning_content\` in the thinking mode must be passed back to the API.`
用户 00:33 裁定：**另开一批**（本批）；修复宿主 = **CLI**（VSC 内不可自修——修它要 spawn 子代理，而子代理正死于此）。

### 用户裁定与澄清（2026-09-16）

| 时点 | 内容 |
|---|---|
| 00:29 | 父侧复测第 3 轮：池回执 4 running + 1 queued（spawn 已通）；`status id:1` = `running` · turn 7 · elapsed 27s |
| 00:29–00:31 | `#2/#3/#4` 继 `#5/#1` 全部终止，逐字同错（推理链回传 400）；5 档批次档 mtime/字节数仍为父侧 21:42 写入 ⇒ **零落笔** |
| 00:33 | 用户「**可以，另开一批**，一共发现几个缺陷？都记齐了」= 本缺陷单独建批 + 要求缺陷总账 |

### 批次条目（本批 = 台账需求池一条；原文与证据以台账为准）

| # | 台账条目 | 症状 | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md` 需求池「子代理压缩后推理链回传断裂 ⇒ 400」 | 子代理上下文触发自动压缩后，下一次请求被 provider 拒（400 逐字要求回传 `reasoning_content`）⇒ 子代理必死、零产出 | 见下「修法方向」——经设计轮裁决后单笔落地 + 反证用例 |

### 症状

| 项 | 读数 |
|---|---|
| 报错（逐字） | `LLM API error 400: {"error":{"message":"The \`reasoning_content\` in the thinking mode must be passed back to the API.","type":"invalid_request_error"}}` |
| 发生轮次 | 子代理 **turn 8**（即**压缩刚发生之后的首次续跑**；父侧曾在 turn 7 见其 `running`） |
| 覆盖面 | 5 个子代理（eng-designer）全部同错 ⇒ **确定性**，非偶发 |
| 落笔 | 零（批次档时间戳/字节数未变） |

### 根因（父侧离线解剖轨迹存档 —— 决定性证据，designer 不必重探）

**证据artifact** = `C:\Users\liwei\.thincoder\traces\2026-09-16\38478126a2c4-100.jsonl`
（`kind:"subagent"` · `depth:1` · `role:"eng-designer"` · `turn:8` · `isContinuation:false` · `error` = 逐字该 400）——记录**该次请求的完整出站 `messages`**。

**角色序列（17 条）**：

```
system, user, assistant, assistant, tool, tool, tool, tool, assistant, tool, tool, assistant, ...
              ↑ i=1   ↑ i=2        ↑ i=3
```

| 下标 | role | 事实 |
|---|---|---|
| `[1]` | user | 内容为 `"[Context was automatically compacted. Below is a summary of earlier work. …]"` + 摘要 ⇒ **压缩注入** |
| `[2]` | assistant | 内容 = `"Understood. I'll continue from these notes, re-verifying anything transient."`（76 字符）· keys = `role\|content\|ts` ⇒ **无 `reasoning_content`、无 tool_calls** |
| `[3]` | assistant | `reasoning_content`（481 字符）+ **4 个 tool_calls** ⇒ **紧贴 `[2]`** |

⇒ **两条 assistant 相连，且第一条无推理链**。DeepSeek thinking 协议要求同一 assistant 段的推理必须回传，此处无内容可回传 ⇒ 400。

### 判别面（父侧对照实测——为什么父级不报错）

| 轨迹文件 | 角色 | assistant 无 `reasoning_content` 的条数 | **assistant→assistant 相邻对** |
|---|---|---|---|
| `…-100`（子代理 · 失败） | eng-designer | 1（= `[2]`） | **1 对（i=2→3）** |
| `…-101` / `…-102` / `…-113`（父级 · 全成功） | (parent) | **12 / 12 / 12 条** | **0 对**（其相邻对 124–131 对全为 `user→user` / `tool→tool`） |

⇒ **判别面 = 相邻性，不是「有无 reasoning」**：父级那些无推理的 assistant 后面都跟 `user`（正常收尾）；子代理那条后面跟的是**另一条 assistant**。

### 机制归属（坐标已实核）

1. 回传实现只覆盖**模型回复**这一条路径：`thincoder-core/agent.mjs:362-363`（门 = `response.reasoning && specForModel(agent.provider.model).reasoningEcho === "required"`）；
   模型声明见 `thincoder-core/model-specs.mjs:33`（`deepseek-flash` → `reasoningEcho: "required"`）。
2. 压缩后的那条 76 字符 assistant 应答**不经该路径** ⇒ 键缺失。
3. **与既有声明冲突（须设计轮处置）**：`thincoder-core/context.mjs:354` 自述「does not touch `reasoning_content`（DeepSeek/Kimi echo protocol）or tool_calls pairing structure — **no protocol 400 risk**」——
   该声明在「压缩注入后紧随一次 assistant 应答」这一形态下**不成立**。
4. 同族回传点（供设计轮一并核对，勿漏）：VSC 循环 `thincoder-vscode/src/agent.mjs:380-381` · advisor 循环 `thincoder-core/advisor/loop.mjs:199-213` · 续写尾块 `thincoder-core/provider/core.mjs:297`。

### 影响面

- **凡上下文够大、触发自动压缩的子代理** ⇒ 压缩后首次续跑即 400 死。两宿主**共用核侧该路径** ⇒ **CLI 与 VSC 同病**（非 VSC 独有）。
- 本轮 5 批设计轮全灭即此因（eng-designer 的 persona + 任务书 + 勘察输出体量大，必然触发压缩）。
- **与既有条目同族**：需求池「子 agent 需要上下文压缩机制」——该条症状已演进（子代理**已有**压缩，但压缩后**必死**）；设计要求把两条口径对齐（D2，勿两处重述）。

### 修法方向（供设计轮裁决——父侧不代裁）

| # | 方向 | 说明 | 代价 / 风险 |
|---|---|---|---|
| A | 压缩注入后**不产出**那条无推理的 assistant 应答 | 消除相邻形态 | 需改压缩后的续跑语义 |
| B | 历史装配时**合并 / 丢弃**相邻 assistant 中的无推理项 | 单点、两端受益 | 须证不丢信息、不破坏 tool_calls 配对 |
| C | 回传面扩展，覆盖该形态（补一条 reasoning 或缺省占位） | 直接对齐协议 | 占位内容可能污染上下文 |

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **决定性证据artifact 是轨迹档**（见上路径）——设计轮可直接解析该 JSONL 复现判别面，无需重跑 spawn。
2. **测试盲区（同前序批次）**：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs` 用 **mock provider**，不校验协议面 ⇒ 集成测试无法拦截本类缺陷。设计要求给出**可机判的反证面**（如：出站 messages 断言——无「无 reasoning 的 assistant 紧邻 assistant」形态）。
3. **执行宿主 = CLI**（用户裁定）；VSC 内不可自修。
4. **分工口径**（改到哪模块 ⇒ 同步修该模块权威档）= 承 `docs/batches/2026-09-15-vsc-core-wiring.md` §1（三层分工）。
5. **迁移期档性**：权威文档层 = `docs/core/**`；产品树 `docs/**` = 迁移期参照历史（保留 ≠ 维护，`docs/README.md:4`）。
6. 结构纪律：档 ≤300 行软线 / ≤500 硬限；`thincoder-core/context.mjs` 与 `agent.mjs` 均须给**行数增量与超线判断**。

### 批次边界（明确不做）

1. 不重开前序两批（`2026-09-15-vsc-agent-tools-spawn-fix` · `2026-09-15-vsc-tool-table-dup`）——本批是**同链第三处**，独立建批。
2. 不改 5 批（`docs/batches/2026-09-15-{core-defect-fixes,check-tooling-debt,eng-discipline-prompts,cli-async-discard,doc-contract-reconcile}.md`）的 §1——它们仍待设计轮启动。
3. 只修本缺陷；勘察若发现同链第四处 ⇒ **停下上报**（父侧另批），不自行扩批。
4. 不改台账 / 不改本档 §1。

---

## §2 批次任务（eng-designer）

### 状态

**设计轮完成 · 方案选定 B（占位并入尾首）· 执行宿主 = CLI**（2026-09-16）。本任务书 = 核侧单点修复（`thincoder-core/context.mjs` `applyCompression` 条件分支）：压缩注入不再产出「无 reasoning 的合成 assistant 紧邻 assistant」形态——子代理压缩后首发 400 消解；设计面已落两档权威档（见「文档收正」）。

### 独立复核（承 §1——结论全部复现；增补登记如下）

| # | 复核项 | 读数 | 结论 |
|---|---|---|---|
| R1 | 轨迹档全量复算（`…-1..-131` 全档） | 失败事件恰 5 个（`…-84/-90/-93/-98/-100`）——**全部**同形：`compaction=1` + `adj=1`（下标 `2→3`，首条无 `reasoning_content`）+ ERR；其余全部档 `adj=0`（含父级档：无 reasoning assistant 25–37 条、压缩注记在场——仍全 `adj=0`） | §1 判别面（**相邻性**）复现并扩面（失败面 = 全数非抽样） |
| R2 | 失败档 / 父级模型字段 | 同为 `deepseek` / `deepseek-flash`（`reasoningEcho:"required"`——`thincoder-core/model-specs.mjs:33`） | 判别面 = **纯结构**（同模型下仅相邻形态致败） |
| R3 | 合成占位坐标 | `thincoder-core/context.mjs:209`（keys = `role\|content\|ts`——非模型回复、不经 agent.mjs 回声门；`ts` 注见 `:202-205`） | §1 机制归属复现 ✓ |
| R4 | 同族补登 | `thincoder-core/agent/completion.mjs:60`（非工具路径 push 不带 rc——单发形态，后随 user / 收尾） | 判别面外；**不修**（登记） |
| R5 | VSC 压缩面归属 | `thincoder-vscode/src/agent/run-stages.mjs:17,195` 引核 `@thincoder/core/context.mjs`（W6 迁核） | 核单点修复 ⇒ **VSC 文件零改** |

§1 判断经独立复核**成立**（增补 R4/R5 已登记）；未触发兜底（无「判别面不成立」情形）。

### 方案选型（判据 ① 不丢信息 · ② 不破坏 tool_calls 配对 · ③ 两端同收益 · ④ 与 `context.mjs:354` 声明冲突最小处置 · ⑤ 结构纪律）

| # | 候选 | 判据逐项 | 取舍 / 结论 |
|---|---|---|---|
| A | 压缩后不产出占位应答（全量去占位） | ① 确认锚文本丢失（合成文本——边界项）· ② 不触碰 ✓ · ③ 核单点 ✓ · ④ 推翻 D9 既决形状（需重裁）· ⑤ 最小 | 超发病面（tail=user 常态形态同被改）⇒ **否决** |
| B | 占位并入尾首（仅 `tail[0].role === "assistant"` 时；copy-on-write） | ① **零丢失**（占位 + 尾首 content + `reasoning_content` + `tool_calls` + 其余字段全保留）· ② 原样保留（引用不变、其 tool 结果紧随）· ③ 核单点 ✓（CLI/VSC/子代理/降级链全走 `applyCompression`）· ④ 注入点一处分支 + `:354` 声明范围收正 · ⑤ +15–25 行 | 发病形态唯一、非触发形态逐字不变 ⇒ **选定** |
| C | 回传面扩展（占位补 `reasoning_content`） | ① 不丢但**新增伪造信息**（推理链从未存在——语义污染）· ② 不触碰 ✓ · ③ 核单点 ✓ · ④ 与推理回声语义冲突（回声 = 服务端原文）· ⑤ 小 | 真机接受度不可离线证 + 污染 ⇒ **否决** |

否决备选（变体）：B′ 丢弃占位（丢确认锚）· D tail 边界强制 user（与 D-T1 / D-T2 / 配对安全三约束互斥、不可保证）。

### 修复点精确化（选定方案 B）

**落点**：`thincoder-core/context.mjs` `applyCompression`（as-of 2026-09-16 = `:194-246`；注入段 `:206-211`；占位字面 `:209`；边界重设 `:220`）。

**改动形态**（语义定死、风格从简）：

- 注入前判 `tail[0]?.role === "assistant"`：
  - **否（常态）**：现行形态逐字不变——`[...head, { user 摘要 note }, { assistant 占位 }, ...tail]`；
  - **是**：copy-on-write 生成 `merged = { ...tail[0], content: 合并(占位, tail[0].content) }`，数组 = `[...head, { user 摘要 note }, merged, ...tail.slice(1)]`；合并规则：`content` 为 `null`/`""` ⇒ 占位文本；字符串 ⇒ `占位 + "\n\n" + 原 content`；数组（多模态）⇒ `[{ type: "text", text: 占位 }, ...原 parts]`。
- `_runStartHistoryLen`：常态 `head.length + 2`（不变）；并入分支 `head.length + 1`（点 `merged`——蒸馏覆盖与修前 tail[0] 等价）。
- 同笔：`context.mjs:354` 自述声明**范围收正**（shrinkOversized 自身不触 rc / 配对——该句仍真；补指注入点 = 本模块回声安全面）。

**零行为变化论证**：分支仅在 `tail[0].role === "assistant"` 时执行；其余全部压缩形态（含降级链 `compressFallback` 走同一 `applyCompression`）产出逐字不变；`head` / `tail` 未入并分支的对象引用零改、人读线（`_fullHistory`）零触（copy-on-write 同 `shrinkOversized` 纪律）。

### 反证面（硬项——可机判）

**断言（INV）**：任何 `applyCompression` 产物（正常 / 降级两路）零「无 `reasoning_content` 的 assistant 紧邻 assistant」形态。

**用例**（新档 `thincoder-core/test/compaction-echo.test.mjs`——核单测，`node --test` 直跑、无网络）：

| # | 用例 | 夹具 | 期望 |
|---|---|---|---|
| T0 | 检测器正控 | 轨迹档原样形态字面复刻（`[user(压缩注记), assistant(占位), assistant(rc+tool_calls), tool…]`） | 检测器**必报**违例（防恒绿空检测器） |
| T1 | 触发形态（**修前必红**） | 构造 40 条历史上的 `compressFallback`，切割面使 `tail[0]` = assistant（rc + tool_calls） | 产物零违例；merged.content 含占位文本 + 原 content；`reasoning_content` / `tool_calls` 保留 |
| T2 | 非触发回归 | 同规模夹具，`tail[0]` = user | 形状 = `[note, 占位, tail…]`（消息数 = head + 2 + tail）——逐字同修前 |
| T3 | 边界 | `tail[0]` = assistant（content = null） | merged.content = 占位文本（单独） |

**修前必红**：T1 修复前运行必 fail——违例对（下标 + 两消息摘要）**原样记录**入 §5；修复后全绿。

### 同族回传点核对（修 / 不修逐点判据）

| # | 回传点 | 坐标 | 形态可构造性 | 判据 / 结论 |
|---|---|---|---|---|
| 1 | 主 agent 工具链回声门（本体） | `thincoder-core/agent.mjs:362-363` | 压缩合成消息不经此门（非模型回复） | **零改**——门本体正确；修复落点在注入面 |
| 2 | VSC 循环 | `thincoder-vscode/src/agent.mjs:380-381` | 与主体同门（镜像）；压缩面经核单源（`run-stages.mjs:17,195`） | **零改**（经核修复同收益；VSC 文件零触） |
| 3 | advisor 循环 | `thincoder-core/advisor/loop.mjs:199-215` | 装配只增 `assistant(tc)→tool…`；其压缩 = `compactMessages`（`advisor/compaction.mjs:55-83`）只注入 user 消息——无合成 assistant | **不修**（形态不可达——不预造防护） |
| 4 | 续写尾块 | `thincoder-core/provider/core.mjs:296-301` | 基请求已过校验（否则无 length 响应）；slim 过滤只删不改序 ⇒ 可构造性分析不可达 | **不修**（不可构造） |
| 5 | 非工具路径（补登） | `thincoder-core/agent/completion.mjs:60` | 单发形态（后随 user / 收尾）——无相邻 | **不修**（登记） |

### 文档收正（本设计轮已落——实施轮零文档改动）

- `docs/core/design/CONTEXT-COMPACTION.md`：新增 **D-CC18**（并入决策 + 否决备选）· §6.10 #2 形状句修正 + 新增 **#7 回声安全契约** · §6.7 D9 注 · §6.12 符号列补 `applyCompression` · §6.13 边界重置注收正 · §9 读数随收（259 行）。
- `docs/core/design/AGENT-LOOP.md`：变更记录行 + §9 体量读数收正（506 行——**超 500 硬限 +6** 如实登记）；机制条文零改（修复不触循环面）。
- 零改面：需求档 / 台账 / §1 / 前序批次档 / VSC 产品树 / prompts。

### 验收判据（可机判——全体回指台账条目）

台账条目 = `docs/TODO.md` 需求池「子代理压缩后推理链回传断裂 ⇒ 400」（三方一致清单：本节条目 = 设计档验收回指 = 台账条目）。

| # | 判据 | 命令 / 形态 |
|---|---|---|
| V1 | 反证用例修前红（原样留档） | `cd thincoder-core && node --test test/compaction-echo.test.mjs`——修前 ≥1 fail（违例对 dump 记 §5） |
| V2 | 反证用例修后绿 | 同命令——全绿（含 T0 正控） |
| V3 | 核心全量 | `cd thincoder-core && node --test`（CI core 口径）全绿 |
| V4 | CLI 宿主面 | `cd thincoder-cli && npm run lint && npm test` 绿 |
| V5 | 非触发零回归 | 用例 T2/T3 断言（形状 + 消息数） |
| V6 | 文档三闸零新增 | 仓根 `node scripts/doc-anchors.mjs` · `node scripts/check-doc-width.mjs` · `node scripts/check-ledger.mjs`——设计轮实读：宽度 OK · 台账 OK · doc-anchors 存量 **37 悬空（thincoder-cli 域旧档——非本批引入）**；准绳 = 本批零新增 |
| V7 | R24a | `thincoder-core/context.mjs` 393 → 预计 +15–25（<500）；`agent.mjs` 429 → ±0；新测试档 ~90–120 |

### 受影响文件（实施轮写域）

| 文件 | 现值 | 预计增量 | 超线判断 |
|---|---|---|---|
| `thincoder-core/context.mjs` | 393 行 | +15–25 | 距 500 硬限余量充裕 ✓（>300 软线既成——本批增量小，不触发新拆分义务） |
| `thincoder-core/test/compaction-echo.test.mjs` | 新建 | ~90–120 | — |
| （核查零改）`thincoder-core/agent.mjs` | 429 行 | ±0 | 回声门本体零改 |

### 边界（明确不做）

承 §1 四条：① 不重开前序两批（spawn-fix / tool-table-dup）；② 不改 5 批 `2026-09-15-*` 的 §1；③ 只修本缺陷——勘察若见同链第四处 ⇒ 停下上报（父侧另批），不自行扩批；④ 不改台账 / 不改本档 §1。另：不修 VSC / advisor / 续写（判据见核对表）；不动 prompts；不动需求档。

### 执行宿主

**CLI**（用户 00:33 裁定）：§5 实施与复跑均在 CLI 侧（`thincoder-core` / `thincoder-cli`）；VSC 侧只做读数或不动。

### 补注（发送面替代面——已否决的第四候选）

**发送面通用归并**（`thincoder-core/provider/normalize.mjs` 侧对出站 messages 扫「无 rc assistant 紧邻 assistant」并归并/删除）——**否决**：发病源唯一（压缩注入·轨迹全量复算零反例），发送面归并 = 全 provider 出站热路径外扩（两端全部请求）且**掩盖未来同形来源**（诊断面劣化——静默修复不报）；本批以「源头修复（applyCompression）+ 出站断言（用例扫描即出站形态守卫）」承担防护。若评审认为需防御纵深，请连同判据一并裁——本任务书范围不含该面。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

范围与口径：4 档全读（批次档 · CONTEXT-COMPACTION 设计/需求 · AGENT-LOOP）；点检 = 受影响文件行数 + 设计所引关键坐标（criterion 8）。
无项目标准档 / 无文档地图 ⇒ 方法论合规按 AGENTS.md + 评审基准判、文档归属判据降级（已在发现中说明）。
点检实读：`thincoder-core/context.mjs` 393 行 · `applyCompression` = `:194-246` · `:209` 占位字面 · `:354` 自述 · `:212-219` 边界注释 · `:318`/`:341` 两路共用 · `agent.mjs` 429 行 + `:362-363` 回声门 · `model-specs.mjs:33` ✓ · `explore-distill.mjs:146` 蒸馏切片起点 ✓。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria | 🟡 | 并入分支的 `_runStartHistoryLen` 取值（`head.length + 1`，batch:154）无断言落点——T1 只断言 merged 内容与字段保留（batch:168）、V5/T2 只断言形状与消息数（batch:169）；该常量是核 `explore-distill.mjs:146` 蒸馏切片起点（已实核）⇒ 实现轮漏改/错值 = H1 蒸馏面静默回归（需求档 §3 N1「未涉面不得无故回归」）。 | T1 / T2 各补一断言：合并分支 `=== head.length + 1`、常态 `=== head.length + 2`（可机判、代价极低）。 |
| 2 | Clarity / doc-state | 🟡 | 并入对象的字段语义只定死 `content` 三形态（batch:153），`ts` 未定死：照字面 `{ ...tail[0], content }` 保留 tail[0] 原 ts，与 `docs/core/design/CONTEXT-COMPACTION.md:189`「assistant 占位（带压缩时刻 ts）」及源码注释 `thincoder-core/context.mjs:202-204`（D-S1：注入消息携带压缩时刻 ts）相抵；同条未覆盖 `content === undefined`，T3 只覆盖 `null`（数组 / 多模态形态无用例）。 | 显式定死 ts（建议保留 tail[0] 原 ts，并注明与 D-S1 的关系）· 补 `undefined` 与数组 content 用例 · 收正 `:189` 该行。 |
| 3 | Doc-state | 🟡 | 「文档收正」清单（batch:186）只记 §6.13 边界重置注（`:190`）；并入分支另使两处既有文本失真：`docs/core/design/CONTEXT-COMPACTION.md:80`（§6.4②「压缩后上下文 = 摘要注记 + 占位 + tail」）与源码注释 `thincoder-core/context.mjs:212-219`（「head.length + 2：note 与占位夹在 head 与 tail 之间」「boundary 指向逐字 tail 起点」——并入分支为 head+1 且指向被改写的 merged）。同轮已收正 `:354` ⇒ 同类遗漏宜一并处置。 | 由文档 / 注释层与本笔同批收正（父侧），或至少登记为同笔改动项——避免实现轮留下自相矛盾的注释。 |
| 4 | Scope coordination | 🟡 | §1 设计输入第 3 条要求「把两条口径对齐（同族台账条目『子 agent 需要上下文压缩机制』，D2 勿两处重述）」（batch:89），§2 全篇无落点（边界又声明「不改台账」）⇒ 父侧待办未显式登记。 | 在 §2 补一行「父侧待办：台账两条口径对齐（本批零改台账）」，或明确该要求已由 §1 承载。 |
| 5 | Requirements coverage | 🟡 | 需求档载有测试缺口触发：「VSC `test/` 对压缩面零专属用例……补测触发 = 该面下次被触碰」（`docs/core/requirements/CONTEXT-COMPACTION.md:67`）；本批即触碰该面（实核：`thincoder-core/test/` 无压缩面专属用例），§2 未回指该条款——新测试档只覆盖回声安全一面。 | §2 加一行回指：该触发是否已由新核测档履行；如需更宽压缩面覆盖，登记为后续项。 |
| 6 | Scope / impact | 🟡 | 影响面只覆盖「修后新产物」；修前已注入 / 已落盘的机器线（会话双字段 `history` + `contextHistory`，CONTEXT-COMPACTION.md:108）若含该形态，恢复会话后首个请求仍会 400（父级路径同病——设计自述「两宿主共用核侧该路径」）。设计未登记该残留面。 | 一行登记 + 父侧裁：读取时修复（恢复即扫描归并）或明确不处理（用户 /compact / 新会话规避）。 |
| 7 | Size annotations (R24a) | 🔵 | 点检通过：`context.mjs` 实读 393 行 ✓、`applyCompression` = `:194-246`（53 行，+15–25 ⇒ ≤~80，函数层安全）· `agent.mjs` 实读 429 行 ✓；受影响文件表缺「函数层读数」一行；`AGENT-LOOP.md` 506 行（超 500 硬限 +6）已在档内 §9 如实登记且 .md 豁免；`context.mjs` 已超 300 软线——§2 已给处置（本批增量小），不重裁（R3）。 | 受影响文件表补一行最长函数读数即闭环。 |
| 8 | Clarity / defense-in-depth | 🔵 | 补注（batch:222）称「用例扫描即出站形态守卫」——用例断言对象实为 `applyCompression` 产物，非最终出站 payload（后者还过 provider slim / normalize）⇒ 措辞高估防护面。发送面归并的否决理由（诊断面劣化 + 全 provider 热路径外扩）成立，不建议改判。 | 修一条措辞（「注入面产物守卫」）；若父侧要防御纵深，按补注邀请另行连同判据裁定，不在本批。 |
| 9 | Numeric drift（§1↔§2） | 🔵 | 同族坐标两处漂移：advisor 循环 `:199-213`（batch:83）vs `:199-215`（batch:180）；续写尾块 `:297`（batch:83）vs `:296-301`（batch:181）。条数口径未自明：§1 表父级无推理 assistant 12/12/12（batch:72）vs §2 R1「25–37 条」（batch:127）——文件集 / 计数口径未注明。 | 收正为同一坐标；读数补口径注（覆盖哪些档、按什么口径计数）。 |
| 10 | Doc-state (header) | 🔵 | 档头时点行「设计轮待发」（batch:7）与 §2「设计轮完成」（batch:121）不一致——若档头为父侧快照，转发评审时应同步为「设计轮评审中」。 | 父侧一行更新（随 §4 前流转）。 |

计数：🔴 0 · 🟡 6 · 🔵 4 · 合计 10（无 🔴 ⇒ 通过）

VERDICT: pass

（凭据值（token / designId）按 §2.7 不入档；正文本体见评审回复。）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

### 实施记录（eng-coder · 2026-09-16）

> 写域 = `thincoder-core/context.mjs` · `thincoder-core/test/compaction-echo.test.mjs`（新建）· `docs/core/design/CONTEXT-COMPACTION.md`（同轮收正）。
> 提交 = **单笔** `8653f5d2`（`fix(core): merge compaction placeholder into adjacent assistant (reasoning echo 400)`——3 档 / +202 −25；他笔未提交改动零纳入）。
> 凭证值不落档（token / designId = 运行时态——本段零真值）。

**交付摘要**

- 修复面（选型 B 逐字）：`applyCompression` 注入前判 `tail[0]?.role === "assistant"` ⇒ copy-on-write 并入
  （`merged = { ...tail[0], content: withPlaceholderPrefix(tail[0].content) }`；数组 = `[...head, 注记, merged, ...tail.slice(1)]`；
  `_runStartHistoryLen = head.length + 1`）；其余形态逐字不变（常态 `head.length + 2`）。
- 落点坐标（as-of 本笔）：并入分支 `thincoder-core/context.mjs:241-249` · 常态分支 `:250-258` · `withPlaceholderPrefix` `:196-205` ·
  占位字面抽常量 `:82`（原 `:209` 内联）· 注释收正 `:216-221`（D-S1 例外：并入保留尾首原 ts）· `:223-240`（D-CC18 根因 + 边界公式并入分支）·
  `:392-394`（shrinkOversized 自述范围收正）。
- 内容形态（裁决 #2 定死）：非空串 ⇒ 占位 + `\n\n` + 原串；数组（多模态）⇒ 前置 `{ type: "text" }` part；空串 / `null` / `undefined` / 其它 ⇒ 占位单独。
  ts = 保留 `tail[0]` 原 ts（不重写、不补写——D-S3 同守）。
- 文档收正（裁决 #3 同轮）：`docs/core/design/CONTEXT-COMPACTION.md:80`（§6.4② 形状句补并入分支）· `:189`（§6.13 摘要段形状注删「带压缩时刻 ts」）·
  变更记录 `:260` 补实施轮收正行 · §9 读数 259 → 260（口径 = 内容行，与 HEAD 254 同口径；parts 口径 = 261——±1 计数差已注）。

**⓪ 基线（开工实测——长测试先落盘，日志 `.thincoder/tmp/`）**

| 面 | 命令 | 读数（本笔实测） |
|---|---|---|
| 核全量 | `cd thincoder-core && node --test` | 191/191/0 → 修后 **195/195/0**（+4 新档）· `baseline-core.log` / `core-full-final.log` |
| 仓根·锚 | `node scripts/doc-anchors.mjs` | 域一 0 悬空 OK；全域 **37 悬空 = 存量**（CLI 参照历史档；本批零新增） |
| 仓根·宽度 | `node scripts/check-doc-width.mjs` | **1 处红（他笔）**：`docs/batches/2026-09-16-subagent-reasoning-echo.md:228`（§3 评审散文 392 字符——非本笔写域）；本笔三档零新增 |
| 仓根·台账 | `node scripts/check-ledger.mjs` | **1 处红（他笔）**：`docs/TODO.md:57` L3 缺 file:line 形态（他批在途条目） |
| VSC doc:check | `cd thincoder-vscode && npm run doc:check` | status 0 ✓ |
| CLI lint | `cd thincoder-cli && npm run lint` | `check-syntax: 181 file(s) OK` |
| CLI 快层 | `cd thincoder-cli && npm test` | 609 / 551 pass / **1 fail** = `test/ledger.test.mjs:135` 命中 `docs/TODO.md:57` 同一存量 L3 红（与直跑 check-ledger 同因——非本笔）；skip 57 |

**反证原样（修前必红——先落测试再修）**

命令（修前）：`cd thincoder-core && node --test test/compaction-echo.test.mjs` ⇒ `tests 4 / pass 2 / fail 2`：
T0 ✔（正控）· T2 ✔（常态回归）· **T1 ✖ · T3 ✖**。失败断言原样（违例对 dump）：

```
✖ T1 触发形态：tail 首条为 assistant ⇒ 占位并入该条（零违例 + 零丢失 + 边界 = head + 1）
  AssertionError [ERR_ASSERTION]: 产物零违例（INV）
  actual: [ { prevIndex: 1, index: 2,
    prevContent: "Understood. I'll continue from these notes, re-verifying anything transient.",
    content: 'draft 24' } ]
  expected: []
✖ T3 边界：content 为 null / 缺省 / 多模态数组 ⇒ 占位单独或前置 text part
  AssertionError [ERR_ASSERTION]: null
  actual: [ { prevIndex: 1, index: 2,
    prevContent: "Understood. I'll continue from these notes, re-verifying anything transient.",
    content: null } ]
  expected: []
```

⇒ 红因 = **相邻形态本身**（占位 assistant 紧邻 assistant、前条无 rc），非误红；T0 正控证明检测器非恒绿。
修后：同命令 **4/4 绿**（`green-after2.log`）；核全量 **195/195/0**。

**用例面（T0–T3 + 裁决补强）**

新档 `thincoder-core/test/compaction-echo.test.mjs`（**131 行**）：T0 检测器正控（轨迹档原样形态必报）· T1 触发（并入 + 零丢失 + 引用 + `_runStartHistoryLen === 1`）·
T2 非触发回归（形状 / 消息数 / tail 引用零改 + `=== 2`）· T3 边界（null / undefined / `""` / 多模态数组）。
裁决 #1 断言双落；裁决 #2 补 `undefined` + 数组；评审 🔵 建议再补 `""` + 引用同一断言（落地见下「审计与评审」）。

**决策透明表**

| # | 决策 | 理由 | 备选 / 否决 |
|---|---|---|---|
| 1 | 占位字面抽模块常量 `COMPACTION_PLACEHOLDER`（原 `:209` 内联） | 两分支共用同字面（常态注入 / 并入前缀）——单源防漂移 | 原地双写（漂移风险） |
| 2 | 串形态连接符 = `"\n\n"` | 设计 §2 逐字形态 | 空串直连（可读性差）；VSC 旧档 `<handoff_notes>` 标签形态（随迁核退场） |
| 3 | T1/T2 边界断言用字面 `1` / `2`（附口径注释） | KEEP_HEAD = 0 ⇒ head 恒空（headEnd = 0）；消息数断言反向钉 head = 0 ⇒ 与 `head.length + 1/2` 表达式等价 | 测试内取不到 applyCompression 的 head——表达式断言不可达 |
| 4 | 并入分支注释写全（D-S1 例外 + 边界公式 + 根因句） | 裁决 #2/#3 要求「与 D-S1 关系写明」「边界注释补并入分支」 | 精简注释——R24a 越带已如实登记（见下），不取 |
| 5 | 单笔提交含设计档（设计轮未提交改动随纳入） | 交付面 = 修复 + 测试 + 本批所属文档；并行批先例同形（其修复提交含其设计档） | 仅代码两档——设计档收正将留未提交态（不取）；已随交付报告披露 |
| 6 | 评审 🔵 #3 / #4 建议落修（`assert.equal` 引用同一 + `""` 用例） | 评审 pass 后落地 + 重跑全绿；钉「引用不变」与合并规则文本全量 | 不落（转未落项）——不取 |

**同族口径注（评审 🔵#7 / 🔵#8 / 🔵#9 落点）**

- 措辞收正（🔵#8）：新测档 = **注入面产物守卫**（断言对象 = `applyCompression` / `compressFallback` 产物），**非最终出站 payload 守卫**
  （后者还过 provider slim / normalize）——§2 补注「用例扫描即出站形态守卫」原文高估防护面，以本注为准。
- 坐标实读（🔵#9——以本笔实读为准）：同族回传点 = `thincoder-core/advisor/loop.mjs:199-215`（push 语句 `:205-215` · 回声门 `:212-214`——§2 表口径成立；
  §1 的 `:199-213` 欠 2 行）；续写尾块 = `thincoder-core/provider/core.mjs:296-301`（`buildContinuationMessages` 函数界；尾块构造 `:297` 单行——§1 的 `:297` 为单行口径）。两处**本批零改**（判据见 §2 核对表）。
- R24a 函数层读数（🔵#7 补）：`applyCompression` 53 → **77 行**（+24）· `context.mjs` 全档 393 → **432 行**（+39~40——超 §2 预计带 +15–25，主体为注释散文；< 500 硬限，余量 ≈68 行）· 新测档 **131 行**（预计 ~90–120，同超带）。
- 零行为变化（硬项）：非并入分支逐字不变（T2 守：形状 + 消息数 + tail 引用零改）· `_runStartHistoryLen` 常态值不变（`head.length + 2`）·
  **H1 蒸馏切片覆盖等价**：并入分支边界点 = `merged`（tail[0] 原位改写），`thincoder-core/explore-distill.mjs:146` 的 `history.slice(起点)` 覆盖对象与修前一致。

**残留面登记（裁决 #5 / #6——父侧项；台账零触碰）**

- 需求档回指（评审 🟡#5 回应）：`docs/core/requirements/CONTEXT-COMPACTION.md:67` 测试缺口触发（「该面下次被触碰」）= 已由本新核测档（回声安全面）履行；
  **更宽压缩面覆盖 = 未涉**（父侧登记）。
- 已落盘机器线残留（评审 🟡#6 回应）：修前已注入 / 已落盘机器线（会话双字段 `history` + `contextHistory`——`CONTEXT-COMPACTION.md:108`）若含该形态，
  **恢复会话后首个请求仍可 400**（本笔只消新产物）⇒ 父侧登记（candidate 技术待办）。附实核：遗留压缩会话**再次压缩**时并入对象本身可能无 rc（tail[0] = 旧占位）⇒ 形态仍在——同属该残留面（恢复后 /compact 或新会话规避）。

**内部审计与代码评审（本会话）**

- 审计（explore 只读 · BLOCKING）——**1 轮**：四类偏差（部分实现 / 静默简化 / 文档漂移 / 清单外改动）**全零**；12 项逐条核验全 ✅（含修前必红真伪 / 写域恰三档 / 需求档零改 / 反证非恒红）。
- 代码评审（advisor · in-child 同步）——**1 轮**：VERDICT = **pass**（0🔴 · 1🟡 · 3🔵）。裁决：🟡（文件体量 advisory——既有债务、非必改；读数落本段）·
  🔵#2（R24a 越带——如实登记）· 🔵#3/#4（测试增强——**已落**并重跑 4/4 + 195/195/0）。
- 终态：**clean**（0 🔴 在飞；修正轮 = 1 轮测试增强，落地后重跑全绿）。

**未落项 / 移交父侧**

- 本批裁决项：**零未落项**（断言补齐 / ts 语义 / 同轮收正 / 需求档回指 / 残留登记 + 反证 + 零行为变化 + 报告面两条全落）。
- 移交父侧（非本笔写域）：评审 🟡#4（§1 / §2 台账两条口径对齐登记——本笔任务书未含落点）· 批次档 §3 宽度 1 行（`:228` 评审段——建议折行，本笔不可改他段）·
  `docs/TODO.md:57` L3 形态红（他批在途条目）· doc-anchors 37 存量（CLI 参照历史档）· `docs/core/design/AGENT-LOOP.md` 未提交改动（本批 designer 行 + 并行批行——非本笔提交面）。
- 越带登记（非阻塞）：R24a 两处超预计带（见上口径注）——硬限未触、无拆分义务新增。

**复跑更新（本段落笔后实测）**

- 宽度闸 = **OK(宽度) 414 文件 / 0 违规**（`docs/batches/2026-09-16-subagent-reasoning-echo.md:228` 长行已由父侧折行）；
  台账闸 = **0 处违规**（`docs/TODO.md:57` 已补 file:line 形态）；锚闸 = 域一 0 / 全域 37 存量（不变——本批零新增）；VSC doc:check = status 0；核全量 = 195/195/0。
- ⓪ 表两行（宽度 / 台账）读数 = **开工时点原样留档**（彼时两项为他笔红；复跑时点已由父侧清理）——以本条为终态读数。

**补记（写域外语料观察 · 移交父侧）**

- `docs/core/design/SESSION.md:111`（D-S1 行）「压缩重建注入的 note /「Understood」同刻打点」——并入分支下「Understood」不再独立成条 / 独立打点
  （并入 `tail[0]`、随其原 ts）；语义例外已写明于 `thincoder-core/context.mjs:216-221` 注释与设计档变更记录，SESSION 板原文未改（非本笔写域）⇒ 父侧裁是否同轮收正或登记。

## §6 验证与收口（父代理）

### 6.1 实施与验证（父侧实核）

- 实施提交 `8653f5d2`（`git show` 实核 = 3 档 / +202/−25）：`thincoder-core/context.mjs` 并入分支（`:241-249`）+ 常态分支（`:250-258`）+ 注释收正（`:216-221` / `:223-240` / `:392-394`）；新测档 `test/compaction-echo.test.mjs`（131 行 T0–T3）；`CONTEXT-COMPACTION.md` 同轮收正（`:80` · `:189` · 变更记录 · §9）。
- **反证面（原样在案）**：修前 `node --test test/compaction-echo.test.mjs` = **4 / 2 pass / 2 fail**（T1 ✖ · T3 ✖——违例对 dump：`prevIndex 1→2` · `prevContent "Understood. …"`；T0 ✔ 证明检测器非恒绿；日志 `.thincoder/tmp/red-before.log`）⇒ 落修后 **4/4 绿**。
- 复跑链：核 **191/191/0 → 195/195/0**（+4）· 宽度 414 档 0 · 台账 0 · 锦域一 0 / 全域 37 存量零新增 · VSC `doc:check` 0 · CLI lint 181 OK + test 609/551（唯一 fail = 他笔台账存量，父侧已清）· 内部审计 1 轮（四类偏差全零）+ 内部代码评审 1 轮（pass）。

### 6.2 裁决落地与口径

- §3 六项 🟡 + 四项 🔵 逐条落地（§5）✓；口径提示（所引「§6.14 §3 `:215`」档内无对应节——已按语义全档复查：D-CC17/18 行 · `:190` 边界重置注均已是并入语义，无其他失效残留）✓。
- **同族口径对齐（评审 🟡#4）**：台账需求池「子 agent 需要上下文压缩机制」行已补 2026-09-16 更新行（压缩已落地；症状演进为回传 400 已修；残余 = 预算护栏口径）——对齐完成。

### 6.3 测试寿命处置

T0–T3 = **转 ② 长期资产（常驻快层）**——三条件全满足（业务可观察 = 出站序列零「无推理 assistant 紧邻 assistant」；集成未覆盖 = 压缩面首测；可稳定驱动 = 夹具直驱）；不适用退役。

### 6.4 收口行（核销同步清单）

- 台账：`docs/TODO.md` 需求池「子代理压缩后推理链回传断裂」条 → `docs/TODO-archive.md` §四（已核销）；需求池计数 24 → 23；技术待办 +1（机器线残留条，8 → 9）。
- 同轮收正：`docs/core/design/SESSION.md:111`（D-S1 行 ts 措辞——并入分支例外）随本收口入笔。
- 提交：实现 = `8653f5d2`（单笔）；收口 = 本记录 + 台账两档 + `SESSION.md`。
- 推送：两远端（gitee / github）；凭证：本批 designId 槽位终消费（链终）。

### 6.5 未落项（携带）

1. **修前已落盘机器线残留**（`history` + `contextHistory`——恢复旧会话仍可 400）= 已登记技术待办（触发=条件）；
2. 更宽压缩面测试覆盖 = 未涉（需求档 §4.3 触发以回声安全面履行）；
3. 本批 designer 的 `docs/core/design/AGENT-LOOP.md` 收正——已随 ④ 批收口提交（`cf2b62b`）入笔。

### 6.6 结论

批终态 = clean（选型 B 落地 · 反证闭环齐 · 全链绿 · 同族口径对齐完成）。
