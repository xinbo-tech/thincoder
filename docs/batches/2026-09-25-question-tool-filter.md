# 2026-09-25 · question-tool-filter
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 05:09「调用不了的工具有必要注入吗？」+ 05:10 裁「A」——子代面过滤 question（治本）+ 措辞随收正（承 #289 两步化 + prompt-inflight-ask 批 (E) 判定）。
> 台账 = #289（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件与判据（父侧 · 2026-09-25 05:1x · 台账 #289）

**来源**：用户 05:09 问「调用不了的工具有必要注入吗？」（承 #289：VSC `question-ui-face` 文案「Subagents (depth&gt;0) never get it」与实读相抵——实况 = 对子代**可见但不可用**）→ 05:10 裁「**A**」= 治本支：**子代面（depth&gt;0）直接过滤 `question`**。

**判据（父侧 · 用户认可的口径）**：
1. **路由指引不缺**：子代「无用户可等 / 不向最终用户提问」已写在各人格档明文（`persona-coder.md:7` / `persona-explore.md:6` / `persona-plan.md:10`）——该通道对子代零信息增益；
2. **死条目 = 纯成本**：占上下文 + 制造**假可供性**（模型可能先试一次再吃错误）；「吃个干净错误当教学」的辩护不成立——教学已由提示词承载；
3. **机械上现成**：工具表本就**已按角色裁**（只读过滤先例 `agent-tools/subagent-spawn.mjs:253-260`；子代 `tools: parent.tools` 继承 `agent-tools/subagent-actions.mjs:411`）⇒ 加一条「depth&gt;0 ⇒ 摘 `question`」是同族动作。

**射程**：① **装配过滤**（depth&gt;0 ⇒ 子代工具表不含 `question`——落点与手法由设计轮实读裁定）；② **措辞随收正**（`question-ui-face`：子代面随过滤自然失效 / headless 主会话文案保持准确——CLI 端 `thincoder-cli/src/prompt-injections.mjs:19` 已准、VSC 端 `:20` 随本批收正）；③ 双端对位（CLI + VSC 同判据）+ 测试面（既有工具表断言收正——`readonly: true` 让 `question` 现留在探 / 规子代列，该类断言随之）。

**授权**：05:05「自动跑完吧」全链授权（自缚沿用）覆盖本批。

**边界**：不新增 / 不删除工具本体（只动**子代面可见性**）；主会话 / headless 面零改（`question` 工具本体与机械门零触）；人格档文案零改（路由指引已在位）；其他工具零动。

### 1.2 设计轮上抛裁定（父侧 · 2026-09-25 05:2x）

1. **CLI `:19`「subagent children」枚举成不可达分支 = 采纳**（措辞面**并入本批**）：过滤后该枚举描述的是不复存在的路径，属本批**自身产生**的失效表达 ⇒ 同一批内收正（收正逐字 = §2.11-1 备选文本，由设计修正轮补 §2.5/§2.6 行；落地面 +1 = `thincoder-cli/src/prompt-injections.mjs`）。
2. **`common.md:109` 路由表行 = 不成立（no-fix）**：该表 = **角色无关的工具编目**；过滤后子代无此工具（其 schema 无该条目 ⇒ 无假可供性），右列「歧义 / 设计决策问用户 · 例行确认门走纯文本」经子代**报告面**（= 其"正文文本"）仍自洽——子代实际通道 = `notify_parent`（人格档已明）。改公共层 = 双端 × 全角色的射程换零缺陷修复 ⇒ 不动；若日后实测证实误导 ⇒ 再议（登记在案）。
3. **`ACP_EXCLUDED_TOOLS`（`thincoder-cli/src/acp.mjs:67`）= 不并** ✓（判据不同源：headless/ACP 面「无交互 UI」≠ depth 判据）——采纳设计轮裁定。
4. **需求侧 F12 = 已落（本回合 · 父侧笔）**：`docs/core/requirements/TOOLS.md` §4.2 **F12**（判定句逐字承 §2.10）+ 标题计数收正（F1–F12）+ 变更记录。三链（需求 F12 ↔ 设计 §6.16 ↔ 批档 §2）闭合。
5. **VSC `setup-tooltable.mjs:296-300` 行为正确（实测复核）= 知悉**（本批对其为字面归单源，非行为修复）✓。

### 1.3 评审轮 1 裁定与修正（父侧 · 2026-09-25 05:2x）

**评审 #83 = changes-required**（🔴1 · 🟡1 · 🔵4 = 6 条 · 发现表在 §3 轮次 1）。**裁定 = 6/6 全收**：

- **🔴 第 1 条（CLI 措辞收正随本批落）**：依据 = §1.2-1（采纳）——**修正轮 #85 已落**：§2.5 CLI 行 = 收正后取值逐字（batch:163 文本）· §2.1 Q2 / §2.4② 同步 · §2.6 行 9 改「±0 行内改」+ **行 12 补 CLI 测试档**（criterion 8）· §2.7 cli 预算 = 既有断言收正 1（新断言 = 值驱动形：`face.length > 0` 守卫 + `descOf("question").includes(face)`；`cli-prompt-entry.test.mjs:86` 已锁子串在收正文案保留 ⇒ 该档零改）· §2.11-1 闭口「已采纳·随本批落」· 设计档 §6.16 CLI 行同步。
- **🟡 / 🔵 2–5**：修正轮 #85 逐条落地（证据表述可复核化 · Δ 收正 ≈343 · 消费符号钉死（VSC = 排除集 `.has()`；谓词 = 核四点调用形态）· 「核六档」计数标签）。
- **第 6 条（F12 指针 + 边界句）= 父侧就地落**（本回合）；**父侧同批自理两项**：① F12 边界句「设计档 §2.5」歧义词形收正 → 「当批批档 §2.5」；② 本档（需求档）变更记录行折两行（380 → ≤300 字数 · 行宽收正 · 零语义 · 可 revert）。
- **设计档变更记录旧行（`:959-962`「CLI 取值零改」）不回改** ✓（dated 历史面，修正随新条目落）。

**复评**：轮 2 代点火（核六条落地 + 🔴 关闭）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 2026-09-25（TOOLS.md §6.16 + D-TO11 已落；评审轮 1 修正 6/6 已落盘 · 待复评）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 · 三条）

| # | 条目 | 判定句（机判面） |
|---|---|---|
| Q1 | **子代面（depth>0）工具表排除 `question`**——四个子代装配点（spawn / escalate 同步·异步 / consult）同过单源排除谓词；静态注册表 / 工具本体 / 机械门 / 主会话面零改 | 子代 `tools` 名集不含 `question` ∧ 主会话装配（`assembleBuiltinTools`）名集含 `question` |
| Q2 | **措辞面收正（`question-ui-face`）**：VSC 取值 = 新文案（锚定装配规则）；CLI 取值 = 收正文案（子代枚举随过滤收正）；逐字见 §2.5 | VSC 表值 = 新文案逐字 ∧ CLI 表值 = 收正文案逐字；零回归锚 = VSC 保留 `inline question card` 子串（既有断言 `tool-descriptions.test.mjs:71` 零改）；CLI 受影响断言 = `prompt-injections-cli.test.mjs:89` 收正 1（字面锚换值驱动形——§2.7） |
| Q3 | **双端对位**：CLI 零端改（消费核装配单源）；VSC 自持 depth>0 装配面字面归核单源（行为零变） | VSC 端 depth>0 基础集不含 `question`（既有行为——锁为用例）；核内 `"question"` 字面单源驻留 |

**不覆盖（明确不做）**：工具本体（`question.mjs` 含机械门与上限校验）· 静态注册表（`thincoder-core/tools/index.mjs`）· 人格档与提示词面 · 主会话 / headless 面（含 CLI ACP 排除面）· 其他工具 · 配置开关 / 用户选项。

### 2.2 设计档落点（已落 · 本设计轮）

- `docs/core/design/TOOLS.md` **§6.16**（新增——机制面：问题 / 判据单源 / 面清单 / 单源落点 / 装配序与生效面 / 措辞面逐字 / 边界）。
- 同档 **§7 决策行 D-TO11**（含否决备选）+ **变更记录**一行。

### 2.3 机制设计（判据 / 单源 / 装配序 / 生效面）

**判据（单源）**：`question` = 交互式主会话工具——depth>0 面无用户可等（路由指引已在各人格档明文）⇒ **不入子代工具表**；排除与「只读过滤」同族（装配层按面裁表），judgment 不住各调用点各自写字面。

**单源落点**：`thincoder-core/agent/helpers.mjs`——与只读谓词 `readonlyToolNames`（`:335-338`）同址新增：

- `SUBAGENT_TOOL_EXCLUSIONS`（`Set`，单成员 `"question"`——D3：集合与成员同处一变更点）；
- `excludeSubagentTools(tools)`（谓词；**恒返回新数组**——不改父表、不别名）。

`thincoder-core/agent.mjs` 两处再导出面（`:21-32` / `:48-53`）补两名 ⇒ 四个子代装配点自 `../agent.mjs` 取用，既有 import 面零改。

**应用点（五处 · 序 = 「角色选择（只读 / 全表）→ 排除谓词」）**：

| # | 文件:行（as-of 2026-09-25） | 改法 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent-spawn.mjs:251-258` | 两分支汇合后 `tools = excludeSubagentTools(tools)`（探 / 规只读面 ∧ 其余角色全表面同滤） |
| 2 | `thincoder-core/agent-tools/subagent-actions.mjs:411` | `tools: excludeSubagentTools(parent.tools)`（同步 escalate） |
| 3 | `thincoder-core/agent-tools/escalate-async.mjs:195` | 同上（异步 escalate） |
| 4 | `thincoder-core/agent-tools/consult.mjs:270-273` | 继承面过谓词后再并 `main_history`（该工具不属继承面） |
| 5 | `thincoder-vscode/src/agent/setup-tooltable.mjs:300` | 字面 `t.name !== "question"` → 消费核单源排除集（`SUBAGENT_TOOL_EXCLUSIONS.has(t.name)`；谓词 `excludeSubagentTools(` = 核四点调用形态；**行为零变**——消第二份字面，防漂移） |

**生效面**：子代绑定值（`createAgent({tools})`）⇒ ① provider 工具 schema ∧ ② 执行面 `toolByName`
（`thincoder-core/agent/setup.mjs:163-171` 展开 = 绑定值 + 家族段 + caller 注入）⇒ **传子**（`eng-coder` / `eng-designer`
受限通道经父绑定值继承——`thincoder-core/agent/family-tools.mjs:171-172`）排除随绑定传递，**嵌套子代同判**。

**机械门保留**（第二道防线）：`thincoder-core/tools/question.mjs:20` 无 UI 抛错零改——headless 主会话（自动轮 digest 等）语义不变。

### 2.4 派单六条 → 逐条裁定（条 → 落点）

| 条 | 裁定 | 落点 |
|---|---|---|
| ① 过滤落点 + 手法 | **单源排除集 + 谓词**（住 `thincoder-core/agent/helpers.mjs`，只读谓词同址）；**四个子代装配点各自调用**（与只读过滤**同族**：同层、同序、同对象面）；静态表本体不动、主会话面零改 | 设计 `TOOLS.md` §6.16（面清单表 + 单源落点 + 装配序）；实施 = 上表五处 |
| ② 措辞面收正 | VSC `:20` 新文案（§2.5 逐字；原句 = 无锚断言，新句锚定装配规则）；CLI `:19` 收正（§1.2 第 1 条裁定——过滤后 `subagent children` 枚举成不可达分支，同批收正；§2.5 逐字） | `thincoder-vscode/src/prompt-injections.mjs:20` · `thincoder-cli/src/prompt-injections.mjs:19`（皆行内改文案） |
| ③ 双端对位 | 同判据（子代面无此工具）、各端自持：CLI 零端改（**装配面**——核装配单源已覆盖其全部子代路径；措辞面 `:19` 收正见 §2.5）；VSC 自持 depth>0 装配面（`setup-tooltable.mjs:300`，覆盖其自建子代如视觉渠道）归核单源 | 上表 #5 + §2.5；镜像面清单 = 「CLI 消费核装配 ∥ VSC 自持装配面」两处 |
| ④ 测试面 | 既有断言收正 **2 处**（VSC T2 同一引用断言 + CLI `prompt-injections-cli.test.mjs:89` 字面锚换值驱动形——均见 §2.7）；新用例 4（A30–A33，core 新档）；三包例数预算见 §2.7 | §2.7 |
| ⑤ AC + 受影响文件 + 行数预算 + 需求侧条目 | 全部落 §2.6–§2.8、§2.10 | 本档 |
| ⑥ 上抛（伤及既有契约？） | 两条观察项（不阻本批）：① CLI `:19` 的 `subagent children` 枚举成不可达分支；② 通用路由表（`thincoder-core/prompts/common.md:109`）对子代仍是 `question` 指针。均属**父侧笔面**，本批不自行扩射程 | §2.11 |

### 2.5 措辞面（逐字 · 单一权威 = 本行）

**VSC 新值**（`thincoder-vscode/src/prompt-injections.mjs:20` 整行替换；单行、无换行）：

```text
- Availability: this tool renders in the chat panel (inline question card). Subagent children (depth>0) never get it — the depth>0 tool table excludes it; put the question in your reply text instead.
```

**CLI 值**（`thincoder-cli/src/prompt-injections.mjs:19` 整行替换——**收正后取值逐字**，单一权威 = 本块）：

```text
- Availability: this tool needs an interactive UI — in contexts without one (headless runs) it returns an error instead of asking; subagent children (depth>0) never get it (excluded from their tool tables); put the question in your reply text instead.
```

（收正依据 = §1.2 第 1 条裁定：过滤后子代不再持有该工具 ⇒ `subagent children` 原枚举描述的调用路径不复存在，同一批内收正；headless 主会话面「returns an error instead of asking」= 机械门语义，保持准确；`- Availability: this tool needs an interactive UI` 子串保留——`thincoder-cli/test/integration/cli-prompt-entry.test.mjs:86` 既有锁零改。）

**语义对位**：两值同判据（子代面无此工具）+ 各端自持（UI 形态 / 失败形态按端）——`question-ui-face` 锚位 = `thincoder-core/tool-docs/question.md:11`；过滤后该行只对持有者（depth-0）渲染 ⇒ 子代面自然失效。

### 2.6 受影响文件与行数预算（现行 = `wc -l` 实读 2026-09-25；Δ = 预估；⇒ 实施后 ≈）

| # | 文件 | 现行 | Δ | 实施后 ≈ |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/helpers.mjs` | 421 | +10（排除集 + 谓词 + 头注） | ≈431（在册软线 ✔） |
| 2 | `thincoder-core/agent.mjs` | 440 | +2（两处再导出面各 +1 名） | ≈442（在册软线 ✔） |
| 3 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 404 | +3（一行调用 + 两行注） | ≈407（在册软线 ✔） |
| 4 | `thincoder-core/agent-tools/subagent-actions.mjs` | 495 | ±0（`:411` 行内改） | ≈495（在册；**离 500 硬限仅 5 行——该档不得新增行**） |
| 5 | `thincoder-core/agent-tools/escalate-async.mjs` | 302 | ±0（`:195` 行内改） | ≈302（在册软线 ✔） |
| 6 | `thincoder-core/agent-tools/consult.mjs` | 471 | +1 | ≈472（在册软线 ✔） |
| 7 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | 342 | +1（新增 import 行——本档现无 `@thincoder/core/agent/helpers.mjs` import）+ 行内改（±0） | ≈343（>300 软线为既有状态） |
| 8 | `thincoder-vscode/src/prompt-injections.mjs` | 21 | ±0（`:20` 行内改文案） | 21 |
| 9 | `thincoder-cli/src/prompt-injections.mjs` | 20 | ±0（`:19` 行内改文案——收正后取值见 §2.5） | 20 |
| 10 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 222 | +3 −3（T2 断言收正） | ≈222 |
| 11 | `thincoder-core/test/subagent-tool-table.test.mjs`（新档） | 0 | ≈60 | ≤300（免登记；core runner 单层 glob 自动收 ✔） |
| 12 | `thincoder-cli/test/prompt-injections-cli.test.mjs` | 98 | ±0（`:89` 断言收正——字面锚换值驱动形，见 §2.7） | 98 |

**登记面**：核六档（`helpers` / `agent` / `subagent-spawn` / `subagent-actions` / `escalate-async` / `consult`）皆在 `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY` 在册 ⇒ 零新登记；VSC 侧无通用行数门（仅 `child-permission.test.mjs:360-366` 锁 `execute-tools` / `tool-gates` 两档）⇒ 本批零触发。

### 2.7 测试面（新用例 4 + 既有断言收正 2）

**新档**：`thincoder-core/test/subagent-tool-table.test.mjs`（核包；用例编号 A30–A33——与 §6.14 的 A 系判据同族编号空间，不与 `T-*` 用例号空间混）：

| # | 类 | 场景 / 夹具 | 预期（机判） | 先红 |
|---|---|---|---|---|
| A30 | 正常（行为） | 夹具父表 = `[{name:"read",readonly:true},{name:"write"},{name:"question",readonly:true}]`；`buildSpawnChild(…, "coder")` | 子表名集不含 `question` ∧ 含 `write`（非只读过滤）∧ 子表 ≠ 父表（新数组） | ✓ |
| A31 | 边界（行为） | 同父；`buildSpawnChild(…, "explore")` | 子表不含 `question` ∧ 全只读（无 `write`） | ✓ |
| A32 | 零回归（行为） | `assembleBuiltinTools({memory:{},cwd,model})`（depth-0 面） | 名集含 `question`（主会话面零改） | ✗（既有语义锁——`tool-registry.test.mjs` 名集锚同面） |
| A33 | 结构（读源码 · 无夹具） | 四子代装配点 + VSC 装配面源码文本 | 四点各含 `excludeSubagentTools(` 命中 ∧ 四档 + VSC 装配面 `"question"` 字面零命中（单源驻留 = `thincoder-core/agent/helpers.mjs`） | ✓（先红 = 四点零命中） |

**既有断言收正（2 处）**：

① **VSC（行为面有意变更的可见面）**：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:161`
——T2「非只读分支 = 父表直传（**同一引用**）」随本批**有意失效** ⇒ 收正为「coder 子表 = 父表 − 深度排除项」
（名集差恰 1 项 ∧ 仍含写面工具）；同档 T1（`:154` 只读分支 ≠ 父表）与其余 `buildSpawnChild` 夹具零波及
（父表皆空 / 极简——实读：`thincoder-core/test/spawn-system-block.test.mjs:70` · `thincoder-cli/test/subagent-scheduler.test.mjs:155` ·
`thincoder-vscode/test/sync-block-stop.test.mjs:89` · `thincoder-vscode/test/subagent-audit-summary.test.mjs:36` 等）。

② **CLI（措辞收正的可见面）**：`thincoder-cli/test/prompt-injections-cli.test.mjs:89`——原字面锚
`includes("headless runs, subagent children")` 在收正文案（§2.5 CLI 值）中不再连续出现 ⇒ 换**值驱动形**
（断言源 = 本端表值，非硬编码字面——措辞重写零波及）：

```js
const face = CLI_PROMPT_INJECTIONS["question-ui-face"]
assert.ok(face.length > 0, "CLI 表值非空（防 includes('') 恒真）")
assert.ok(descOf("question").includes(face), "question: CLI 表值逐字在场")
```

同档 `:87-88`（`Availability` 恰一份）零改；`thincoder-cli/test/integration/cli-prompt-entry.test.mjs:86` 已锁子串
`- Availability: this tool needs an interactive UI` 在收正文案中保留 ⇒ 该档零改。

**三包例数预算**：core = 新档 1 / 新例 **+4**（A30–A33）；cli = 既有断言收正 **1**（`:89` 换值驱动形——见上②；`cli-prompt-entry.test.mjs` 零改）；
vsc = 新档 **0** / 既有例改断言 **1**（T2；`files.mjs` 与 `test/integration/files.mjs` 零改——无新档）。

### 2.8 验收对照（回指 §1 功能点）

| §1 射程 | 判据 |
|---|---|
| ① 装配过滤 | A30 · A31 · A33（+ A32 主会话零改） |
| ② 措辞随收正 | VSC `:20` 逐字（§2.5）+ CLI `:19` 收正文案逐字（§2.5）；零回归锚 = VSC 保留 `inline question card` 子串（`tool-descriptions.test.mjs:71` 零改）+ CLI 受影响断言收正 1（`prompt-injections-cli.test.mjs:89` ⇒ 值驱动形；§2.7） |
| ③ 双端对位 + 测试面 | VSC T2 收正 ∧ VSC 端 depth>0 基础集断言（并入 T2 面） ∧ 三包跑绿（`npm test` × 三包） |

### 2.9 关键决策（含否决备选）

- **D-TO11（设计档 §7 已登记）**：装配层按面排除 + 单源常量；否决备选：只靠机械门兜底（保留 token 税与假可供性）· 给工具本体加声明式标记（触及工具本体——边界零改）· 人格档再写一遍（重复指引违 D2）。
- **应用点取「四个装配点各自调用」而非收敛到 `prepareRun`**：绑定值面（`child.tools`）是传子继承的载体——只在 `prepareRun` 过滤会让绑定值仍带 `question`（嵌套子代经父绑定值继承 ⇒ 留漏面），且「子代工具表不含」的表述会失真。
- **VSC 侧字面归核单源**（而非各持一份）：跨面差默认 = 消——同判据两份字面 = 漂移面；`thincoder-core/agent/helpers.mjs` 已在 VSC 静态闭包（`run-stages.mjs` / `setup-reminders.mjs` 同源引用）⇒ 无 W8 契约②风险。
- **CLI 面零端改（装配面）**：CLI 子代路径全经核装配（`buildSpawnChild` 四处同源）⇒ 核侧一处即双端生效（措辞面 `:19` 收正 = §2.5，不属本句射程）。

### 2.10 需求侧建议条目（父侧笔 · TOOLS 板块 · `docs/core/requirements/TOOLS.md` §4.2 F12）

| # | 需求 | 说明 |
|---|---|---|
| F12 | `question` 工具**子代面过滤**（台账 #289） | **depth>0 工具表一律不含 `question`**——交互工具要有活人在环，子代无用户可问（路由指引已在各人格档）；排除 = 装配层按面裁表（与只读过滤同族），**单源** = 核 `thincoder-core/agent/helpers.mjs` 的排除集 + 谓词（禁各调用点各写字面），四个子代装配点（spawn / escalate 同步·异步 / consult）同过、排除随绑定值传子。**边界**：工具本体（含机械门）/ 静态注册表 / 主会话与 headless 面的**机制**零改（**注入措辞面**不在本句射程——`question` 注入值按批档 §2.5 收正）/ 人格档文案零改；不加配置开关。**判定句**：子代工具表（四装配点）名集不含 `question` ∧ 主会话面（`assembleBuiltinTools`）含 `question`；VSC 端 depth>0 基础集同判据（端侧字面归核单源）。判据 = 设计档 `TOOLS.md` §6.16 + 批档 §2.7（A30–A33）；批 = `docs/batches/2026-09-25-question-tool-filter.md`。 |

### 2.11 上抛 / 发现（不阻本批——父侧一笔可裁；本批不自行扩射程）

1. **CLI `:19` 的 `subagent children` 枚举成不可达分支**——**已采纳 · 随本批落**（§1.2 第 1 条裁定）：过滤后子代不再持有该工具，该括号枚举描述的是不复存在的调用路径（机械门本身零改、仍然有效——headless 主会话是活路径）⇒ 措辞面同批收正，取值逐字 = §2.5 CLI 块（单一权威）；落地面 = `thincoder-cli/src/prompt-injections.mjs:19`（行内改）。
2. **通用路由表仍是子代面的 `question` 指针**（观察项）：`thincoder-core/prompts/common.md:109`（正本 = `docs/core/design/prompts/common.md` 同句）——「| `question` | ask the user …|」行由**全角色**（含子代）装载；过滤后子代面无此工具 ⇒ 该行对子代成悬空指针（子代实际通道 = `notify_parent`，其描述已自足）。
   备选收正（如需，父侧笔面）：该行加主会话限定语（如 `main session only — subagents route through notify_parent`）。
3. **第三处同类字面（判据不同——本批不并）**：`thincoder-cli/src/acp.mjs:67` `ACP_EXCLUDED_TOOLS = ["question"]`（headless/ACP 面「无交互 UI」判据，非 depth 判据）⇒ 与本节判据不同源、不构成双实现；如后续要并，属另议。
4. **实测复核**：VSC 端 `setup-tooltable.mjs:296-300` 的既有过滤为**行为正确**（depth>0 面已无 `question`）——本批对它是「字面归单源」，非行为修复；该面此前无独立用例，T2 收正后覆盖其端侧装配径（`hydrateRun(depth: 1)`）。

### 2.12 评审轮 1 修正块（6 条落地 · 2026-09-25）

| # | 严重度 | 处置（承 §3 轮次 1 `Suggestion` 列 · 父侧裁定 6/6 全收 · 执行人 = 本设计修正轮） | 落点 |
|---|---|---|---|
| 1 | 🔴 | CLI 措辞收正随本批落：§2.5 CLI 行改「收正后取值逐字」· §2.1 Q2 判定句去「CLI 取值零改」· §2.4 ② 同改 · §2.6 行 9 改「±0 行内改文案」+ 新增行 12（CLI 测试档——criterion 8）· §2.7 cli 预算改「既有断言收正 1」· §2.11-1 闭口「已采纳·随本批落」· 设计档 §6.16 CLI 行同步 | 本档 §2.1 / §2.4② / §2.5 / §2.6 / §2.7 / §2.11-1；设计档 `docs/core/design/TOOLS.md` §6.16 |
| 2 | 🟡 | 证据表述改写——删「值驱动，非字面锚」句：VSC 零回归实因 = 保留 `inline question card` 子串（`thincoder-vscode/test/tool-descriptions.test.mjs:71` 零改）；CLI 受影响断言同表列明 | 本档 §2.1 Q2 / §2.7 / §2.8② |
| 3 | 🔵 | §2.6 行 7 Δ 收正 = +1（新增 import 行——该档现无 `@thincoder/core/agent/helpers.mjs` import）+ 行内改（±0）⇒ ≈343 | 本档 §2.6 |
| 4 | 🔵 | 消费符号统一——VSC 行消费**排除集**（`SUBAGENT_TOOL_EXCLUSIONS.has(t.name)`）；谓词 `excludeSubagentTools(` = 核四点调用形态；§2.3 与设计档 §6.16 逐字一致 | 本档 §2.3 行 5；设计档 `docs/core/design/TOOLS.md` §6.16 |
| 5 | 🔵 | §2.6 登记面标数改「核六档」（括注六档名单实核正确，不变） | 本档 §2.6 |
| 6 | 🔵 | F12 判据指针 + 边界句——**父侧已落**（需求档 `docs/core/requirements/TOOLS.md` §4.2 F12 + 变更记录）；本设计轮仅读核 + §2.10 条目文本与已落文本对齐（指针 / 边界限定 / 零回归括注三处） | 需求档（父侧笔 · 本批零触）；本档 §2.10 |

**同类落位（一致性面 · 逐项已报）**：① §2.4 ④ / §2.6 行 12 / §2.7 标题与预算（被改测试档入表 + 计数同步）；② §2.9「CLI 面零端改」限定为**装配面**（措辞面收正见 §2.5）；③ 设计档 §6.16 边界行补「机制面」限定（与需求档 F12 边界句同形）。**本轮零机制语义改动**（射程 = 措辞 / 预算 / 指针面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage / AC | 🔴 | 措辞面 CLI 项未落实为「收正」：批档 §2.4②/§2.5（:97）/§2.6 行 9（:113）/§2.1 Q2 判定句（:41）均写「CLI 取值逐字零改」，而批档自身的设计轮上抛裁定（§1.2 第 1 条 · batch:26）已**采纳**「CLI `:19` 枚举收正 + 措辞面并入本批 + 落地面 +1 = `thincoder-cli/src/prompt-injections.mjs`（收正逐字 = §2.11-1 备选文本）」；§2.11-1（batch:162-163）仍以「（逐字待父侧定）⇒ 本批零改」呈现为未决——设计面与记录中已落的裁定并存、未收口。后果：① 本批将照写「不复存在的调用路径」状态收口（设计 §6.16:880 同写零改）；② 若按裁定收正，cli 侧并非零改——`thincoder-cli/test/prompt-injections-cli.test.mjs:89` 以**字面锚** `includes("headless runs, subagent children")` 锁 CLI 值，采纳文本（batch:163 逐字）不含该连续子串 ⇒ 该断言必红，§2.6 行 9「零改」+ cli 例数「0」（batch:136）+ Q2 AC 三处随之失真。 | 二选一并落笔：①（按裁定）§2.5 CLI 行与 §2.1 Q2 判定句改写为「收正后取值逐字（= batch:163 文本）」；§2.6 行 9 改「行内改文案（Δ ±0）」；§2.7 三包预算 cli = 既有断言收正 1（`prompt-injections-cli.test.mjs:89`）；§2.11-1 闭口「已采纳·随本批落」；并核 F12 边界句（需求档 :66「主会话与 headless 面零改」）是否需补「措辞面锚值不属本句射程」半句。②（若父侧改判 no-fix）§2.11-1 按 no-fix 闭口 + 写明依据——不得留「零改 + 待父侧定」与已落裁定并存。 |
| 2 | Evidence accuracy | 🟡 | 批档 :41 / :85 / :144 的措辞面判据「注入面接线测试零回归——值驱动，非字面锚」与实读不符：CLI 端存在字面锚 `thincoder-cli/test/prompt-injections-cli.test.mjs:89`（断言 CLI 值含 `headless runs, subagent children`）；VSC 端「零回归」成立的实因 = 新文案保留 `inline question card` 子串（`thincoder-vscode/test/tool-descriptions.test.mjs:71` 断言该子串），亦非「值驱动」。 | 判据改写为可复核形：VSC 零回归锚 = 保留 `inline question card`（既有断言零改）；CLI 若有值改动 ⇒ 同表列出受影响断言（见 #1）。 |
| 3 | Affected-file annotations | 🔵 | §2.6 行 7 的 Δ 记「+1 −1」＝净值 0（⇒ ≈342），但 `thincoder-vscode/src/agent/setup-tooltable.mjs` 现**无** `@thincoder/core/agent/helpers.mjs` 的 import（实读 import 块 `:15-26` 十二行，无该模块）⇒ 消费核单源须**新增一行 import**，净 +1（⇒ ≈343）。VSC 侧无通用行数门（仅 `thincoder-vscode/test/child-permission.test.mjs:360-366` 锁 `execute-tools` / `tool-gates` 两档——实核）⇒ 无结构后果，仅预算读数失真。 | Δ 改「+1（新增 import 行）+ 行内改（±0）」⇒ ≈343。 |
| 4 | Clarity | 🔵 | VSC 行消费的符号面两处表述不一：§2.3 行 70 写「消费核单源**排除集**」、设计档 §6.16:868 写「字面改消费核单源**谓词**」——同一实现点两种口径（集 `.has()` vs 谓词调用）；A33 只约束四核点含 `excludeSubagentTools(`（VSC 不在内）⇒ 实现者需自行二选一。 | 定一个符号（建议：VSC 行消费排除集 `.has()`；谓词 = 核四点调用形态），§2.3 与 §6.16 逐字一致。 |
| 5 | Doc hygiene / counting | 🔵 | 批档 :117 记「**核四档**（`helpers` / `agent` / `subagent-spawn` / `subagent-actions` / `escalate-async` / `consult`）皆在 `SOFT_LINE_REGISTRY` 在册」——括注列 **6** 档与「四档」标数不符（标签错；名单本身实核**正确**：六档皆在册，`thincoder-core/test/core-hygiene.test.mjs:88-99`）。 | 标签改「核六档」（或按「四装配点 + 两导出面」重构该句）。 |
| 6 | Clarity / pointer | 🔵 | 需求档 F12（`docs/core/requirements/TOOLS.md:66`）写「判据 = 设计档 `TOOLS.md` §6.16（A30–A33）」，但 A30–A33 用例表实际住批档 §2.7（设计档 §6.16:887 自述「判定（用例 A30–A33）… = 批档 §2（本档不重述）」）——指针把用例面记到设计档；对照 F8/F9/F10/F11 行的「判据 = 设计档 §6.x Axx」先例（其用例表确实住设计档）。 | F12 判据指针改「§6.16 + 批档 §2.7（A30–A33）」。 |

**实核记录（本轮 · 供父侧复核）**：现行行数 11 行全对（读取工具显示值 −1 = `wc -l`：helpers 421 · agent.mjs 440 · subagent-spawn 404 · subagent-actions **495** · escalate-async 302 · consult 471 · setup-tooltable 342 · VSC/CLI prompt-injections 21/20 · host-shape-spawn.test 222）；四个核装配点坐标全对（`subagent-spawn.mjs:251-258` · `subagent-actions.mjs:411` · `escalate-async.mjs:195` · `consult.mjs:268-273`）且四档皆已 import `../agent.mjs`（加点名不改行数 ⇒ Δ 声明可行）；五处之一 VSC `setup-tooltable.mjs:300` 为 VSC src 内唯一子代面 `"question"` 字面；`excludeSubagentTools(` / `SUBAGENT_TOOL_EXCLUSIONS` 全仓零命中（A33 先红成立）；`agent.mjs:21-32` / `:48-53` 再导出面、`helpers.mjs:335-338` 只读谓词、`question.mjs:20` 机械门、`tool-docs/question.md:11` 锚位、`assembleBuiltinTools` 签名（A32 夹具形态与 `context-tool.test.mjs:296` 同款）、core runner 单层 glob、T2 断言（`host-shape-spawn.test.mjs:161` 同一引用）与 `test/integration/files.mjs:17` 登记、人格档路由指引（persona-coder/explore/plan：无用户可等）——均与设计声明一致。

**计数**：🔴 1 · 🟡 1 · 🔵 4（合计 6）

VERDICT: changes-required

**域外观察（无严重度 · 供父侧参考）**：① `docs/core/design/CONSULTATION.md:179`（+ 表行 `:194`）把 consult 子代工具集描述为「`readonlyToolNames(agent.tools)` 过滤父工具集 + `main_history`」——本批落成后 consult 子代同经排除（`question` 退场），该行描述将不完整（本批不触该档）。② `TOOLS.md` §2.2 行 #52 前提校验括注仍指「VSC 子代理注册期过滤 `thincoder-vscode/src/agent/setup.mjs:196`」——实读该坐标现为 cfgBag 一带，VSC src 内子代面相关 `"question"` 字面唯一处 = `setup-tooltable.mjs:300`（迁移期引文，非本批评审面）。

### 轮次 2（评审子代理）

**复评（轮 2）结论**：轮 1 六条（🔴1 / 🟡1 / 🔵4）**6/6 已落** · 🔴 关闭；本轮新发现 **1 🔵**（不影响 pass）。核验 = 三份在评文档全读 + 定点源码复核（无 git diff；收到的 fix claims 属别批 #23，未采信——本轮不适用于本目标）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 §2.1/§2.4②/§2.5/§2.6 行 9+12/§2.7/§2.11-1 · 设计档 `TOOLS.md` §6.16 · 需求档 F12 | 🔴 | Fixed | 落点全实读：§2.5 CLI 块 = 收正后取值逐字（batch:108-111「…(headless runs) it returns an error instead of asking; subagent children (depth>0) never get it (excluded from their tool tables)…」）；§2.1 Q2（:52）「CLI 取值 = 收正文案（子代枚举随过滤收正）」；§2.4②（:94）「CLI `:19` 收正（§1.2 第 1 条裁定…）」；§2.6 行 9（:130）「±0（`:19` 行内改文案——收正后取值见 §2.5）」；§2.6 行 12 新增 CLI 测试档；§2.7②（:156-164）值驱动形（`CLI_PROMPT_INJECTIONS` = 该档 :23 实读既有 import）+ `:87-88` 与 `cli-prompt-entry.test.mjs:86` 零改判定（:86 实读锁子串 `- Availability: this tool needs an interactive UI`，收正文案保留）；§2.11-1（:195）「已采纳 · 随本批落」闭口；设计档 §6.16:880 CLI 行同步；三包预算「cli = 既有断言收正 1」。字面锚仍在 = 实施轮待改（设计面已定形） |
| 2 | 2 | 批档 §2.1 Q2 / §2.7 / §2.8② / §2.12 | 🟡 | Fixed | 「值驱动，非字面锚」句已删（全档零命中，仅修复记录转述）；VSC 零回归锚 = 保留 `inline question card`（`tool-descriptions.test.mjs:71` 实读断言该子串；§2.5 新 VSC 值含之）；CLI 受影响断言点名 `:89` |
| 3 | 3 | 批档 §2.6 行 7 | 🔵 | Fixed | Δ = 「+1（新增 import 行——本档现无 `@thincoder/core/agent/helpers.mjs` import）+ 行内改（±0）」⇒ ≈343；实读 import 块 :15-26 确无 helpers.mjs |
| 4 | 4 | 批档 §2.3 行 5 · 设计档 §6.16:868 | 🔵 | Fixed | 符号钉死且两处逐字一致：VSC 行消费排除集 `SUBAGENT_TOOL_EXCLUSIONS.has(t.name)`；谓词 `excludeSubagentTools(` = 核四点调用形态 |
| 5 | 5 | 批档 §2.6 登记面（:135） | 🔵 | Fixed | 「核四档」→「核六档」；六档在册实核（`core-hygiene.test.mjs:89-95` SOFT_LINE_REGISTRY 含 helpers / agent / subagent-spawn / subagent-actions / escalate-async / consult） |
| 6 | 6 | 需求档 §4.2 F12（:66）+ 变更记录（:202-203）· 批档 §2.10 | 🔵 | Fixed | 判据指针 = 「设计档 `TOOLS.md` §6.16 + 批档 §2.7（A30–A33）」；边界句 = 「机制零改（注入措辞面不在本句射程——按当批批档 §2.5 收正）」；标题计数 F1–F12；变更记录折两行；批档 §2.10 行与已落文本对齐 |
| 7 | (new) | 批档 §2.6 行 12 vs §2.7② | 🔵 | New | 行 12 Δ = 「±0 … 98 → 98」，但 §2.7② 规定的新断言 = 3 行（:161-163）替换现 1 行（`prompt-injections-cli.test.mjs:89` 实读 `assert.ok(descOf("question").includes("headless runs, subagent children"), "question: CLI 措辞在场")`）⇒ 净 **+2**（≈100）。文件 ≪300 无结构后果，仅预算行读数失真 |

**计数**：🔴 0 · 🟡 0 · 🔵 1（new）｜轮 1 六条 = 6/6 Fixed
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 05:5x）

**依据**：用户 05:05「自动跑完吧」全链授权（§1.4）；评审 #83 = changes-required（🔴1 / 🟡1 / 🔵4）→ 修正轮 #85 = **6/6 落地**（父侧核验：CLI 取值逐字 / 测试档行 / 新断言形态（值驱动形）/ §2.11-1 闭口 / 设计档 §6.16 同步；需求档 F12 两侧自理亦落）→ **复评 #86 = pass**（核六条 + 🔴 关闭；新发现 1 🔵：§2.6 行 12 Δ「±0」与新断言 3 行替换的净 +2 差异——非阻断，随实施轮核正）。token 已签发（设计槽在）。

**批准**：射程 ①–⑥ **批准实施**。

**实施**：eng-coder（initial · token 消费）· files = §2.6 表全行（含 CLI 两档——修正轮增行）· 红线：`thincoder-core/agent-tools/subagent-actions.mjs` **495 / 500（行内改 · Δ±0）** · 静态注册表与工具本体零改 · 主会话 / headless 面机制零改 · 人格档文案零改。

**派发时序（父侧自缚）**：**待 #286（ledger-key-normalize）收口提交落定后再发射**——两批同写 `thincoder-core/agent-tools/subagent-spawn.mjs`（#286 的批路径修正已在盘未提交），先发射会造成收口提交混提；#286 双推后即发（父侧待办在册）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 实施轮 2026-09-25 · 12 档落地（含新档 A30–A33）· 三包 625/820/961 全绿 · 内部审计 1 fix round + advisor pass · Δ 实态核正见本节 5.3）


### 5.1 交付摘要（条 → 落点）

**Q1 子代面（depth>0）工具表排除 `question`——单源 + 五应用点**

| 落点 | 改法 | 行数实读 |
|---|---|---|
| `thincoder-core/agent/helpers.mjs:340-348` | 新增 `SUBAGENT_TOOL_EXCLUSIONS`（Set，单成员 `"question"`）+ `excludeSubagentTools(tools)`（恒返新数组）——与只读谓词 `readonlyToolNames:335-338` 同址 | 421 → 431（+10，合预算） |
| `thincoder-core/agent.mjs:32` / `:54` | 两处再导出面各补两名（import 面 / `export {}` 面）——四装配点 import 面零改 | 440 → 442（+2，合预算） |
| `thincoder-core/agent-tools/subagent-spawn.mjs:261` | 两分支汇合后 `tools = excludeSubagentTools(tools)`（序 = 角色选择 → 排除，排除恒为末步） | 404 → 407（+3，合预算） |
| `thincoder-core/agent-tools/subagent-actions.mjs:411` | `tools: excludeSubagentTools(parent.tools)`（同步 escalate）——**行内改** | 495 → 495（**±0，红线达成**） |
| `thincoder-core/agent-tools/escalate-async.mjs:195` | 同上（异步 escalate）——**行内改** | 302 → 302（±0） |
| `thincoder-core/agent-tools/consult.mjs:271` | 继承面（只读过滤后）过谓词，再并 `main_history`（该工具不属继承面） | 471 → 471（±0；预算记 +1 ⇒ 472，实取行内包裹式，未用完预算） |
| `thincoder-vscode/src/agent/setup-tooltable.mjs:301`（+ `:21` 新 import 行） | 字面 `t.name !== "question"` → 消费核单源排除集 `!SUBAGENT_TOOL_EXCLUSIONS.has(t.name)`（**行为零变**——消第二份字面，防漂移） | 342 → 343（+1，合预算） |

**Q2 措辞面收正**：`thincoder-vscode/src/prompt-injections.mjs:20`（新值）· `thincoder-cli/src/prompt-injections.mjs:19`（收正值）——两值与设计 `TOOLS.md` §6.16 表 / 本档 §2.5 **程序化逐字比对 = true**；CLI 值保留 `- Availability: this tool needs an interactive UI`（`thincoder-cli/test/integration/cli-prompt-entry.test.mjs:86` **零改**）；VSC 值保留 `inline question card`（`thincoder-vscode/test/tool-descriptions.test.mjs:71` **零改**）。两档 Δ±0。

**Q3 双端对位**：CLI 面零端改（子代路径全经核装配）；VSC 自持 depth>0 装配面归核单源（行为零变）；核内 `"question"` 字面**单源驻留 `helpers.mjs`**（其余四核档 + VSC 装配面零字面 = A33 结构判）。

**边界零改核对（逐条实读）**：`thincoder-core/tools/question.mjs:20` 机械门原文在位（工具本体零改）· 静态注册表 `thincoder-core/tools/index.mjs:23` 仍含 `questionTool`（`assembleBuiltinTools:65-77` 名集含之 = A32）· `thincoder-cli/src/acp.mjs:67` 未并（判据不同源）· 人格档 / 主会话 / headless 面机制零触 · `thincoder-core/prompts/**` 零改。

### 5.2 测试面与三包读数

**新档** `thincoder-core/test/subagent-tool-table.test.mjs`（73 行 ≪300 免登记；核 runner 单层 glob 自动收）：A30（coder 子表 = 父表 − 排除项 ∧ 新数组 ∧ 父表逐项零改）· A31（explore 子表 = 只读面 ∩ 排除项，`question` 虽标 readonly 仍退场）· A32（depth-0 `assembleBuiltinTools` 名集含 `question`）· A33（四核点各含 `excludeSubagentTools(` ∧ 四档 + VSC 装配面 `"question"` 字面零命中 ∧ 单源驻留 helpers）。

**既有断言收正 2 处**：① `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` T2（`:157-166`）——「父表直传（同一引用）」随本批有意失效 ⇒ 收正为「名集差恰 1 项 = 深度排除项 ∧ 写面留存」+ **VSC 端 depth>0 基础集零含断言**（`hostShape({depth: 1, role: "coder"})`——落 §2.8③ / Q3 判定句的行为锁）；② `thincoder-cli/test/prompt-injections-cli.test.mjs:89-91`——字面锚换**值驱动形**（`face.length > 0` 守卫 + `descOf("question").includes(face)`；`:87-88` 零改）。

**三包实跑（`npm test` × 3 · 2026-09-25）**：core = **625 pass / 0 fail**（基线 621 + 新例 4——排除新档重跑 = 621/621 ⇒ 例数不减）· cli = **820 pass / 0 fail** · vsc = **961 pass / 0 fail**（cli / vsc 仅既有例内改断言 ⇒ 例数不变）。**三包全绿**。

### 5.3 行数表实态（核正 §2.6 各行 · 口径 = 行数门 `wc -l` 语义）

| §2.6 行 | 文件 | 表记 现行 → 实施后≈ | 实读 | Δ实 |
|---|---|---|---|---|
| 1 | `agent/helpers.mjs` | 421 → ≈431 | 431 | +10 ✔ |
| 2 | `agent.mjs` | 440 → ≈442 | 442 | +2 ✔ |
| 3 | `agent-tools/subagent-spawn.mjs` | 404 → ≈407 | 407 | +3 ✔ |
| 4 | `agent-tools/subagent-actions.mjs` | 495 → ≈495（红线 ±0） | 495 | **±0 ✔ 红线达成**（读取工具显示 496 = 该档无末行换行的显示差；行数门口径 495） |
| 5 | `agent-tools/escalate-async.mjs` | 302 → ≈302 | 302 | ±0 ✔ |
| 6 | `agent-tools/consult.mjs` | 471 → ≈472 | 471 | **±0（预算 +1 未用完）** |
| 7 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | 342 → ≈343 | 343 | +1 ✔（新增 import 行；`:301` 行内改） |
| 8 | `thincoder-vscode/src/prompt-injections.mjs` | 21 → 21 | 21 | ±0 ✔ |
| 9 | `thincoder-cli/src/prompt-injections.mjs` | 20 → 20 | 20 | ±0 ✔ |
| 10 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 222 → ≈222 | 227 | **+5（≠ 预算 +3 −3——见下）** |
| 11 | `thincoder-core/test/subagent-tool-table.test.mjs`（新） | 0 → ≈60 | 73 | 新档（含 A30–A33 + 注释头） |
| 12 | `thincoder-cli/test/prompt-injections-cli.test.mjs` | 98 → ±0（评审轮 2 🔵7 核正 = 净 +2 ≈100） | 100 | **+2 ✔ 与 🔵7 核正一致** |

**两处差异披露（不自辩 · 评审 🔵 项）**：① **行 10 实 +5**——T2 收正（名集差 + 写面留存 = 净 +2）之外，§2.8③ 的 VSC depth>0 基础集锁（3 行）在 §2.6 预算时未计入；两处均属**验收面要求**（§2.7① / §2.8③），未以减断言换行数。② **行 6 实 ±0**——实现取行内包裹式，比预算少 1 行。③ 除行 6 / 行 10 外全部命中（10/12 精确）。④ 批档 §2.6 原表**不回改**（§2 属 eng-designer 面，一段一作者）——实施面实态以本表为准。

### 5.4 决策透明表（设计未逐字规定处的取法）

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | 四核装配点 import 面改法 | 既有一行 import **内补名**（不新增行） | §2.6 行 4 ±0 红线与行 3「一行调用 + 两行注」预算的隐含形态；零行为差 |
| 2 | consult 谓词包裹形态 | 行内包裹（Δ0），不抽中间变量（Δ+1） | 语义等价、diff 最小；未用完预算优于超预算 |
| 3 | VSC depth>0 基础集锁的落点 | 3 行断言加入**既有 T2 用例**（不新开用例） | §2.8③「并入 T2 面」逐字 + §2.7 例数预算「vsc 新档 0 / 既有例改断言 1」 |
| 4 | 新增注释形态 | 代码注释引设计档（`TOOLS.md §6.16`），不落提示词面引用 | 同档既有注释形态；提示词面（模型读面）零引用纪律 |
| 5 | §2.6 表读数收正方式 | 只在本节记实态 | 一段一作者：§2 为设计面，执行者不越段改 |

### 5.5 审计与代码评审轮次与终态

- **内部偏离审计（explore 子代理 · 只读 · 阻塞）**：结论 = DEVIATIONS 2 条——① §5 未写（本轮即落 ⇒ 关闭）；② §2.6 行 6/10/11/12 读数待核正（本节 5.3 落 ⇒ 关闭）。机制面 = **零偏差**（单源 / 五应用点 / 装配序 / 传子继承 / 措辞逐字 / 红线逐条实读通过）。审计另出非偏差观察：「VSC 端 depth>0 基础集断言」（§2.8③ / Q3）当时只有结构覆盖 ⇒ **自修 1 轮**：T2 内补 `hostShape({depth: 1, role: "coder"})` 基础集零含断言（该档单跑 5/5 + vsc 全包复跑 961/961 绿）。**fix round = 1（自修，已复跑验证）**。
- **内部代码评审（advisor · type=code · 同步）**：**VERDICT: pass**——0 🔴；1 🟡（**可选 · 非 must-fix**：接触面 `subagent-actions.mjs` 495/500 仅 5 行余量，同族 >300 在册债——`core-hygiene.test.mjs:88-101` SOFT_LINE_REGISTRY；R3 既有债不重议）；3 🔵（行数读数记账 · A33 跨包读的守卫（按仓例接受，同族先例 `test/model-specs.test.mjs:255`）· escalate/consult 三点为结构断言——设计 §2.7 A33 规定形态）。评审项**修 0 条**（无 must-fix；🟡/🔵 三条按设计不扩射程，登记于此）。
- **终态：clean（收敛）**——审计 fix round 1（已复跑）+ 评审 pass + 无未处置 must-fix。

### 5.6 域外不处置（列报即止 · 父侧笔面）

1. `CONSULTATION.md:179` / `:194` 的 consult 子代工具集描述在本批落成后不完整（设计档笔面）——本批不触。
2. `docs/core/design/TOOLS.md` §2.2 行 #52 前提括注坐标陈旧（迁移期引文）——本批不触。
3. 评审 🔵 的可选加固（A33 跨包读守卫 / escalate·consult 行为面用例）按设计不扩射程，登记为已知覆盖面。
4. `.thincoder/tmp/cli-pkg/package/**` 为仓内打包临时副本（仍持收正前文案），非产品源——后续全仓 grep 勿误读为残留字面。

## §6 验证与收口（父代理）

### 6.1 交付与验收（父侧 · 2026-09-25 06:4x）

**交付面**（12 档 + 本档）：

| 面 | 文件（落点） |
|---|---|
| 核侧 | `agent/helpers.mjs`（排除集 `:343` + 谓词 `:346-348`——与 readonly 谓词同址）· `agent.mjs`（`:32` import / `:54` export 面补名）· `agent-tools/subagent-spawn.mjs`（`:261` 汇合后末步排除）· `subagent-actions.mjs`（`:411` 行内改 · **495/500 Δ±0 红线达标**）· `escalate-async.mjs`（`:195` 行内改 ±0）· `consult.mjs`（`:271` 继承面过谓词后并 `main_history`）· `test/subagent-tool-table.test.mjs`（新 · A30–A33 · 73 行） |
| VSC 侧 | `src/agent/setup-tooltable.mjs`（`:21` import + `:301` 消费排除集 + depth 门）· `src/prompt-injections.mjs`（`:20` 新值）· `test/integration/host-shape-spawn.test.mjs`（T2 断言收正 + depth>0 基础集零含锁） |
| CLI 侧 | `src/prompt-injections.mjs`（`:19` 收正值——保留 `- Availability: this tool needs an interactive UI` 子串 ⇒ `cli-prompt-entry.test.mjs:86` 零改）· `test/prompt-injections-cli.test.mjs`（`:89-91` 值驱动形） |

**验证读数**：core **625/0**（基线 621 + 新例 4）· cli **820/0** · vsc **961/0**（例数不变——仅既有例内改断言）；A30–A33 单跑 4/4；A33 结构断言（四点含谓词 ∧ 四档 + VSC 面 `"question"` 字面零命中 ∧ 单源驻留 `helpers.mjs`）；行数红线 `subagent-actions.mjs` **495/500 Δ±0** ✓；五处应用点 = 全量面实证（核 `createAgent(` 仅四处 + VSC 工具表单构造点）。

**父侧核验（本回合）**：`helpers.mjs:340-348` 实读 ✓ · `subagent-actions.mjs` diff = 单行替换（Δ±0）✓ · `setup-tooltable.mjs:301` 消费 + depth 门 ✓ · `prompt-injections-cli.test.mjs:89-91` 值驱动形在位 ✓。

**上抛 / 披露处置**：① 预算差异两处（行 10 实 +5 = T2 收正 + §2.8③ 基础集锁未计入；行 6 实 ±0）——接受（验收面要求，未以减断言换行数；§2.6 原表设计面零回改 ✓）；② 评审 🟡（`subagent-actions.mjs` 距 500 硬限 5 行）= 在册技术债知悉（台账 #327 族）；③ 域外两条（`CONSULTATION.md:179/:194` · `TOOLS.md` §2.2 #52 括注）= 列报即止；④ `.thincoder/tmp/cli-pkg/**`（仓内打包临时副本）= 提交面不含。

**D7 结算清单**：角色表齐（§1 / §4 / §6 父侧 · §2 designer · §3 评审 · §5 coder）✓ · 本 §6 状态行 ✅ · 计数（Q1–Q3 + AC①–⑤ · 13 档提交面）✓ · 指针（需求档 TOOLS.md ↔ 设计档 TOOLS.md §6.16 ↔ 本档 §2）闭 ✓ · 变更记录（设计档 TOOLS.md 前轮已落）✓ · 台账 **#289** 在途 → 待核销 → 已核销 · 前批遗留交叉核：前情 = 无（独立批）⇒ 无遗留 ✓ · 台账可见面 = evidence（提交 id 回填）。

**提交**：path-limited（13 档）+ 双推（origin + github）。

**状态行**：✅ 已收口（2026-09-25）
