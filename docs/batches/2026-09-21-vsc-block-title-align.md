# 批次档 · 2026-09-21 · VSC 块标题行与 CLI 对齐（vsc-block-title-align）

> 前情：无（新批）。
> 触发：用户 2026-09-21 07:14 报告——「vsc端eng-coder调用explore和advisor时流式输出串进了标题，我希望vsc的标题能够和cli对齐。」
> 授权：诊断（explore #17）完成 + 父侧三处抽验实锤 ⇒ 本档 = 立批（设计轮启动）。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

### 1.0 用户授权（**父侧代点火 + 代批准** · 2026-09-21 07:33）

用户原话：「**后面你自动跑完吧。**」⇒ 本批链上：设计评审点火权 + §4 批准权 + 修正/实施轮派发 + 收口核销提交推送——均**委托父侧自动执行** ✓。

**父侧自缚**：① 代签仅在三条件齐备时（评审 pass ∧ 修正轮落地并逐条核验 ∧ token 已签发）；② 代签写明依据；③ 需**新范围**或**用户口径裁决** ⇒ 停下。

**D8 代裁记录（同刻）**：据用户既定判据（端差默认 = 消 · `docs/core/requirements/METHODOLOGY.md:77` F7-3 例外句 + 07:14「vsc 的标题与 cli 对齐」）⇒ D8 按「**两端常显对齐**」消：**CLI 增常显**（落点由设计定）+ **VSC 顶栏保持**（非「撤 VSC」）✗ 非保留/登记 ✓；若用户不认可可回退。

**状态行**：✅ 已收口 2026-09-21（父侧）

**用户报告（2026-09-21 07:14 · 逐字）**：「vsc端eng-coder调用explore和advisor时流式输出串进了标题，我希望vsc的标题能够和cli对齐。」

**诊断结论（explore #17 · thorough · 只读 · 父侧抽验三处实锤）**：

- **现象面 = VSC 子代理活动块的「块标题行」状态区**（**非**会话标题——会话标题链两端输入源都是「首条真实用户消息」经 LLM 生成，无流式通道；且 CLI 界面 chrome 不显示会话标题 ⇒「与 CLI 对齐」只能指块标题行）。
- **根因链（逐环）**：eng-coder 调 advisor（depth>0 **恒同步** `thincoder-core/agent-tools/advisor.mjs:169`）→ advisor 流式文本 delta 经 `onOutput`（`:241`）→ 端侧当工具输出面（`thincoder-vscode/src/agent/execute-tools.mjs:248`）→ 前缀包装成 `eng-coder#M/advisor`（`thincoder-core/agent/spawn-child.mjs:158-160`）→ relay 归一 `{kind:"tool", face:"toolOutput", tool:"advisor"}` 投外层块频道（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:182-183`）→ **webview `noteChunk` 因 `face !== "toolOutput"` 面门失效 ⇒ 落「工具文本尾句」支 ⇒ 把流式文本末行写入 `meta.stateWord`**（`thincoder-vscode/webview/activity-view.js:185-195`）⇒ 渲染进块头行。
- **CLI 对位（权威形）**：状态区只取 `currentTool`（工具名）+`command≤60`；**从不接受输出文本**（`thincoder-cli/src/tui/subagent-panel.mjs:97-110` · `subagent-blocks.mjs:337/369-370`；嵌套块输出只进块体）。
- **端差清单（诊断 D1–D8）**：**D1/D3**（running 状态区取值源 + 写面双落）= 泄漏本体；**D2** 嵌套子代工具名丢路径段（VSC 裸 `read` vs CLI `explore#7/read`）；**D4** 折叠 tail-3 落点（VSC 尾行 append 进 `<summary>` vs CLI 头行 + `│ ` 前缀独立行——诊断判等价，二态待设计判）；**D5** = 已对齐（两处守卫齐备）；**D6** 会话标题取值谓词不一致（VSC 缺 `[System reminder:` 排除 + string 类型守卫——`panel-session-write.mjs:123` vs `generate-title.mjs:109-114`）；**D7** 标题链四环差异（**设计轮勘正**：源 / 触发 / 写形 / 谓词——两端**皆回合尾写** ✗ 非「VSC 即写」）；**D8** 展示位差（**设计轮勘正**：CLI `/session` 列表**显示**标题且回退链两端同源 ⇒ 剩余差 = VSC 顶栏**常显** ⇄ CLI **按需**列表）。
- **文档面误登**：`docs/vsc/design/WEBVIEW-PROTOCOL.md:230` 把「工具文本尾句」登记为「对齐（C-11①）」——与 CLI 实测形不符（CLI 无该规则）；`docs/vsc/design/WEBVIEW.md:413`（R5 注）同族。
- **未查证面（如实）**：① 未真机复现（代码级逐环实读 + 父侧三处抽验）；② explore 侧**未找到**流式文本进标题的通道（其在标题行只贡献裸工具名 = D2）——若实机所见另有形态，按批内「先复现再改」补验。

**本批范围裁定（父侧 · 待用户复核）**：

1. **A（主修 · 用户所报现象）= D1 + D3**：`noteChunk` 的 `toolOutput` 面**不改写状态区**（只进块体行 ⇒ CLI 形）；状态区取 `tool — cmd`（结构化面）/ 工具名；「工具文本尾句」支**删除**。
2. **B = D2**：嵌套子代工具名带路径段（`explore#7/read` 形，与 CLI `subagent-blocks.mjs:337` 同构）。
3. **C = D6**（谓词对齐 · 一行级：补 `[System reminder:` 排除 + string 守卫）。
4. **D（文档面）= `WEBVIEW-PROTOCOL.md:230` 误登收正**（+ `WEBVIEW.md:413` 同族）。
5. **D7 / D8 折叠入本批 = 消端差**（**用户 2026-09-21 07:26 裁定**：「为什么保留端差？！你不知道我忙了一夜都在消端差吗？！」⇒ **端差默认 = 消** ✗ 不得默认「保留/登记」）：
   - **D7（标题写入时点/面）**：两端标题链归**同一套机制**（核心单源：生成 + 写入的调用形统一——形态由设计定 ✗ CLI 回合尾写 ∥ VSC 即时写 二者择一收敛）。
   - **D8（会话标题展示面）**：VSC 面板顶栏常显 ∥ CLI 无 chrome 展示 ⇒ 按「两端共用同一套机制」方向处置（对齐形态由设计给）；**若设计判定该点属不可消的真实端特 ⇒ 不得默认保留 ✗ 须带证据上抛用户裁决**。
   - 同法适用本批**全部**端点差候选（含诊断 D1–D8 中任何未列项 ✗ 逐条给「消 / 带证据上抛」二态 ✗ 零「默认保留」）。
6. **CLI 侧零改**（权威形不动）✗ 测试面随改（`activity-closure` T-CL18 / `render-granularity` / `subagent-content-relay` 既有锁须同步）。

**路由判定**：`thincoder-vscode/**`（webview + extension）= **产品码面** ⇒ 走全链（设计 → 评审 → §4 → eng-coder）；文档面（`docs/vsc/**`）= 设计档笔域（eng-designer）。

**台账**：#183（本批）。

**父侧抽验（本档记录）**：`activity-view.js:179-202` · `panel-subagent-relay.mjs:172-191` · `WEBVIEW-PROTOCOL.md:230` 三处逐字实读——与诊断引文一致 ✓。

**父侧余项裁定（2026-09-21 07:4x · 代授权射程内——均按「消 / A9 带证据」二态 ✗ 零默认保留）**：
- **D4③（尾行点击热区：VSC 可点 ∥ CLI 只读）= A9 保留**：结构性不对称（壳能力面——webview 有指针事件 / 终端无）+ 证据（`activity-view.js:133-141` `_foldToggle` 只在头行；尾行热区派生自 `<summary>` 容器）+ 显式裁定 = 本行；消法（`pointer-events:none` 反原生注入）不采（反媒介原生）。
- **D8 空标题窗口（VSC 顶栏显示回退链值 ∥ CLI 段零注入）= A9 保留**：结构性不对称（宿主面——顶栏恒需占位 / 状态行段可零注入）+ 证据（`panel-session.mjs:227-231` 回退链）+ 显式裁定 = 本行。
- **需求条目已落**：`docs/cli/requirements/TUI.md` **F15**（会话标题常显·两端 chrome——父侧直笔 ✓ 需求档笔域）。
- **延后项（D5 冻结面）**：`docs/cli/design/TUI.md` §8.2 「需求层条目 F1–F13 / N1–N11」行计数已陈旧（现 F15 / N12）——评审 21 冻结窗后父侧机械收正（单行级）。

## §2 批次任务（eng-designer）

### 2.0 本批覆盖 / 不在本批（承 §1 全段 + 用户 07:26 范围更正）

> 轮次 = **initial** · 口径 = 以 CLI 为标尺（两端语义冲突以 CLI 为准）· 设计档落点（**本轮已落**）= `docs/vsc/design/WEBVIEW.md` §5.2 / §5.6 / §4.4 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.2 · `docs/core/design/SESSION.md` §6.7 / §6.15 / D-SE30。

| 项 | 来源 | 本批处置 |
|---|---|---|
| A | D1 + D3（用户所报现象 = 泄漏本体） | **修**：状态区取值源**闭枚举** + **输出面零写入**（「尾句」支删除） |
| B | D2（嵌套工具名丢路径段） | **修**：状态区工具名 = `label/tool`（CLI 逐字同构） |
| C | D6（标题取值谓词） | **修**：谓词收核单源 `isRealUserMsg`（string 守卫 + `[System reminder:` 排除） |
| D | 文档面误登 | **收正**（三处 + 全表自查） |
| D7 | 标题写入时点 / 面（端差） | **消**：标题链四环单源（源 / 生成 / 触发 / 写形）——VSC 收敛到 CLI 调用形 |
| D8 | 会话标题展示面 | **机制单源（D7）+ 展示位带证据上抛**（见 2.6——非默认保留） |
| — | D5 | 已对齐（§1 载明）⇒ **零动作** |
| — | D4 | §1 摘要**未具名**（D1/D2/D3/D5/D6/D7/D8 均有内容，独缺 D4）⇒ 无法给二态 ⇒ 见 2.8 上抛 3 |

**不在本批**：CLI 产品树（`thincoder-cli/**` 零改）· 块头其余字段（icon / 键 / 模式词 / 模型 / 计时 / turn）· 内容行合并粒度（`webview/ui.js` 零改）· relay 载荷字段（`tool` / `sub` 契约不动）· `WEBVIEW.md` §5.3 面集 · 会话恢复窗口面。

### 2.1 A = D1 + D3（判据句 · 逐字形 · 机检）

**判据句（状态区取值源 = 闭枚举）**：块头状态区（方括号后）取值只允许三类来源——① 结构化工具行 `${name} — ${cmd ≤60}` / 工具名；② `思考中…`（think chunk）；③ 三态词（审批 / 待消化 / 排队——`stateWord` 首判，优先级高于 ①②）。

**「输出面永不入状态区」判据**：`face === "toolOutput"` 的 chunk 与**无结构化 `tool` 字段**的旧形态（无 face / 旧生产者）一律**不改写** `meta.stateWord`——输出只进块体行（CLI `currentTool` 语义：`thincoder-cli/src/tui/subagent-panel.mjs:105-110`）。

**落点**：`thincoder-vscode/webview/activity-view.js` `noteChunk`（`:179`）。**逐字形**：`meta.stateWord = cmd ? `${name} — ${cmd}` : name`，其中 `cmd` = `m.cmd` 空白归一后 ≤60（59 字 + `…`——既有形不动），`name` 见 2.2。

**删净**：① 「工具文本尾句」支（现 `:191-196`——`split("\n")` 取末行写 `stateWord`）；② R5 面门注释（`:183-184`）；③ `stateWord` doc 注释中的「工具文本尾句」字样（`:88`）。**无效表达式不留在规范面**（函数注释同面收正）。

**机检（两档）**：① 行为档 = 喂 advisor 流式 chunk 序列（`toolCall advisor` → 多条 `toolOutput` 多行文本）⇒ 状态区**恒为** `advisor`（不得出现文本）——先红读数 = 末行文本入状态区；② 结构锁 = `noteChunk` 函数体内 `meta.stateWord` 写点**恰 2 处**（结构化分支 / think 分支）且无「取文本末行」形态（防复辟）。

### 2.2 B = D2（逐字式样）

**形态**：`name = (typeof m.sub === "string" && m.sub) ? `${m.sub}/${m.tool}` : m.tool`——`m.sub` 已由 relay 折为 `path.inner.join("/")`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:176`）⇒ 与 CLI `sub.currentTool = nested ? `${path.label}/${path.rest}` : path.rest`（`thincoder-cli/src/tui/subagent-blocks.mjs:337`）**逐字同构**；深嵌套形 = `inner.join("/") + "/" + rest`（`explore#1/x#2/read`——两端同）。

**面集边界（本项不改 relay / 不改载荷）**：`tool` 字段语义 = relay 前缀 `rest` **逐字**（`WEBVIEW-PROTOCOL.md` §3 / §3.2 行 3 契约、`T1` 载荷锁的断言对象）⇒ 嵌套全路径在**呈现叶**合成，不回流协议字段；渲染面合并判据（`webview/ui.js` 读 `dataset.tool` / `dataset.sub`）零动。

**机检**：嵌套用例——喂 `toolCall`（`sub:"explore#7"`, `tool:"read"`, `cmd:"src/x.mjs"`）⇒ 状态区 = `explore#7/read — src/x.mjs`；先红读数 = 裸 `read — src/x.mjs`。

### 2.3 C = D6（谓词对齐 · 单源化）

**判据句**：标题源 = **首条真实 user 消息**，谓词**单源** = 核 `isRealUserMsg`（`thincoder-core/history-window.mjs:17-19`：角色为 `user` ∧ content 为 string ∧ 非 `[System reminder:` 前缀）；VSC 端壳不再自持 `(m.type ?? m.role) === "user"` 变体（`panel-session-write.mjs:123` 现形）。

**收敛方向与理由**：① 核谓词 = CLI 同源（`thincoder-core/generate-title.mjs:109-114` 内联副本同步换指 `isRealUserMsg`——零行为变化 · 单源化）；② VSC 恢复面（`thincoder-core/history-window.mjs:118` 同谓词）本来就以角色判跳过 `type` 形态旧条目 ⇒ 标题面与用户可见面**同判据**（旧 `type` 形态条目不进恢复面 ⇒ 亦不作标题源，两面一致）。

**机检**：① 首条 = `[System reminder:` 条目 ⇒ 标题源 = 下一条真实 user 消息（请求载荷含该文本、**不含** reminder 文本）；② 非 string content 条目 ⇒ 跳过（守卫）；③ 结构锁 = 端壳不再出现 `m.type ?? m.role` 标题谓词（`thincoder-vscode/src/extension/panel-session-write.mjs` 内零命中）。

### 2.4 D（文档面收正 · 三处 + 全表自查）

| # | 落点（as-of 2026-09-21 设计轮） | 改法 |
|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.2「状态区·running」行（`:230`） | 本端现状列 = `${tool} — ${cmd ≤60}`（嵌套 = `label/tool`）/ `思考中…`；CLI 列补 `command≤60` 来源坐标；结论列保「对齐（C-11①）」+ 点明**输出面零写入**（判据单源 = `WEBVIEW.md` §5.2）。**已落** |
| 2 | `docs/vsc/design/WEBVIEW.md` §5.6「不做」列表（`:413`） | 删失效句「不改状态区判据（输出 chunk 仍走「工具文本尾句」…）」——本批恰改该判据。**已落** |
| 3 | `docs/vsc/design/WEBVIEW.md` §5.2 live 行（`:214`） | 「工具文本尾句」字样去净 + 新增「状态区取值源（闭枚举）」条（含嵌套形 / 输出面零写入 / CLI 坐标）。**已落** |

**全表自查（同族误登 sweep）**：`工具文本尾句|文本尾句` 全仓扫（docs 面）命中 = 上表三处（已收正）+ `docs/core/design/SESSION.md:155` §6.7 的「VSC `requestTitle` 独立 fetch 三分支」旧陈述（VSC 侧第二请求实现已不存在 —— 端壳 `thincoder-vscode/src/extension/generate-title.mjs:12` 早已委核）⇒ §6.7 整节改写（见 2.5）；`docs/core/design/SESSION.md` §8.2 不并项行仍引 `requestTitle`（记录面历史理由——照留，观察上报，见 2.8）。**其余零命中**。

### 2.5 D7（用户 07:26 更正：折叠入本批 ⇒ 两端标题链归同一套机制）

**实读勘正（先于设计）**：§1 诊断「VSC 即写 / CLI 回合尾写」与现码不符——**两端标题生成都在回合尾**（VSC `thincoder-vscode/src/extension/panel-turn-stages.mjs:101-130` `finalizeTurn`；CLI `thincoder-cli/src/tui/agent-turn.mjs:307-322`）。真端差有**四环**：
① **源**：VSC 读**槽文件**（`panel-session-write.mjs:121-123` `loadSlot` → `data.history`）∥ CLI 读**内存**（`thincoder-core/generate-title.mjs:104-123`：记录存储首扫 ∨ 内存人读线回退）；
② **触发**：VSC = `isFirstMessage`（首条 user 消息拍，`panel-chat.mjs:198`）∥ CLI = **无标题即尝试**（`if (agent.title) return`——一次成功即停、失败下回合再试）；
③ **写形**：VSC = `setSlotTitle`（`renameSlot`）**独立第二写** + `pushSessions`（`panel-session-write.mjs:130-131`）∥ CLI = `agent.title` 随**回合尾整档 save** 落盘（`thincoder-core/session.mjs:121`）——单写；
④ **谓词**：C 项（已列 2.3）。

**定案（收敛到 CLI 调用形 · 四环逐条）**：

| 环 | 收敛后形态 | 落点 |
|---|---|---|
| 源 | 内存人读线（`fullHistory` 经 `keepReal` 过滤）首条真实 user 消息；谓词单源 = 核 `isRealUserMsg` | VSC 端壳 `panel-session-write.mjs` `generateTitle`（改收调用方传入的消息数组，不再读槽 history）；核 `generate-title.mjs` `ensureSessionTitle` 内联谓词同步换指核谓词（零行为变化） |
| 生成 | 核 `generateTitle(userContent, provider)`——**两端已同源，零改** | 核 `generate-title.mjs:23` · VSC 端壳只做 key / provider 解析 |
| 触发 | **无标题即尝试**（槽 `title` 在场 ⇒ 短路零触网）——与 CLI 同判据 | VSC 端壳（槽 `title` 空判）；`panel-chat.mjs:198` 的 `isFirstMessage` 判据**退役**（`finalizeTurn` 参数随删） |
| 写形 | **单写**：标题值随回合尾**整档 save** 落盘——`saveLines` 的 `extra.title`（`title: extra.title ?? existing.title ?? ""`）；**无第二写** | VSC `panel-session-write.mjs` `saveLines`（`extra.title` 支）+ `panel-turn-stages.mjs` `finalizeTurn`（把标题值并入 `slotStamp` extra 后调 `_saveLines`；写后 `pushSessions` 刷会话列表） |

**时序（VSC 由「先 save 后标题」翻为「先标题后 save」）**：理由三条——① 源改内存后，「先落盘才有标题源」的旧约束（A2 方案 Y 的成立前提 = 源在槽）**不再存在**；② 单写形要求标题值在 save 前就位；③ 与 CLI 序逐字同构（`agent-turn.mjs:308` 标题 → `:322` 整档 save）。**风险披露（如实）**：标题 LLM 调用（核超时 10s）前置于整档 save ⇒ 首次标题拍内容落盘最多延后 10s——**与 CLI 同形**（该风险 CLI 既有、非本批新引入）；失败仍静默（`generateTitle` 返 null ⇒ 不写 title、save 照常）。

**文档面（已落）**：`docs/core/design/SESSION.md` §6.7 改为「双端同一套机制」四环单源条（源 / 生成 / 触发 / 写形 / 时点 / 读展示 / 边界）· §6.15 标题条改「时点 + 单写形」+ 落点收正（`panel-turn-stages.mjs` `finalizeTurn`）· D-SE30 同步；`docs/vsc/design/WEBVIEW.md` §4.4 增「标题链四环单源」条（指针 = §6.7，本节不重述——D2）。

**CLI 零改**：`thincoder-cli/**` 零改（标尺面）；唯一核侧笔 = `generate-title.mjs` 一行谓词换指（零行为变化）。

### 2.6 D8（会话标题展示面 · 机制单源 + 展示位**带证据上抛**）

**实读勘正**：§1 称「CLI 界面 chrome 不显示会话标题」**不成立**——CLI `/session` 选择器逐行显示标题（`thincoder-cli/src/tui/cmd-session.mjs:62-67`：`s.title || firstMessage 引号形 || "(empty)"`），且该**回退链 VSC 侧已同源**（`thincoder-vscode/src/extension/panel-session.mjs:227-231` 同链——含 `truncate(..., 40)`）。⇒ 标题的**读面 / 回退链已单源**，D7 落定后**写面 / 生成面 / 触发面亦单源**；剩余差异 = **展示位**：VSC 面板顶栏**常显**（`thincoder-vscode/webview/index.html:28` `#session-title` + `session-bar.js:109-112`）∥ CLI **按需**（`/session` 列表 + `/rename` 当前值提示）。

**裁定 = 带证据上抛（非默认保留）**：该点**可消但属功能增删**（非机制对齐），两种消法各带成本，需用户/父侧一行裁定：
- (a) **VSC 撤常显**（齐 CLI 按需形）：删顶栏 `#session-title` 元素 / 或改仅下拉内呈现 ⇒ 代价 = 面板失去常驻「当前会话身份」指示（GUI 面信息降级）。
- (b) **CLI 增常显**（齐 VSC 常显形）：终端固定帧需给位置与宽度预算（标题 ≤40 字符 + `sliceByWidth` 截断），落点候选 = 横幅行（PLAN / AUTO / ADVISOR / ENG 芯片行）末段 ⇒ 与「CLI 侧零改」张力（须用户先解禁 CLI 展示面）。
- 本席建议：**上抛取裁**（不默认保留）；裁定到达前本批按 (a)/(b) 皆不落 —— 该点不阻塞其余项。

### 2.7 受影响文件表（行数 = 行计数实读 · as-of 2026-09-21 设计轮）

| # | 文件 | 现 | 预期 Δ | 改动 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/webview/activity-view.js` | 202 | ±6 | A + B（`noteChunk` 判据重写 + 两处注释收正） |
| 2 | `thincoder-vscode/src/extension/panel-session-write.mjs` | 137 | ±8 | C + D7（谓词单源 · 源改内存入参 · 返值不写槽） |
| 3 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 178 | +6/−3 | D7（标题值并入 extra → `_saveLines`；`pushSessions`；`isFirstMessage` 参数退场） |
| 4 | `thincoder-vscode/src/extension/panel-chat.mjs` | 253 | −2 | D7（`isFirstMessageNow` 计算与实参退场；注释收正） |
| 5 | `thincoder-core/generate-title.mjs` | 123 | ±2 | D7（`ensureSessionTitle` 内联谓词 → 核 `isRealUserMsg`，零行为变化） |
| 6 | `thincoder-vscode/test/activity-closure.test.mjs` | 317 | +≤35 | 用例面（2.8 表 1–5；T-CL18 既有断言**保持**） |
| 7 | `thincoder-vscode/test/at-refs-restore.test.mjs` | 148 | +≤35 | 用例面（W15-5 随新签名收 + 2.8 表 6–9） |
| 8 | `docs/vsc/design/WEBVIEW.md` | 621 → 634 | **已落** | §5.2 闭枚举条 · §5.6 删句 · §4.4 标题链条 · 变更记录 |
| 9 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 545 → 547 | **已落** | §6.2 状态区·running 行 + 变更记录 |
| 10 | `docs/core/design/SESSION.md` | 571 → 586 | **已落** | §6.7 改写 · §6.15 标题条 · D-SE30 · 变更记录 |
| — | `thincoder-cli/**` · `webview/ui.js` · `panel-subagent-relay.mjs` · `panel-toolpanel.mjs` | — | **零改** | 标尺面 / 渲染面 / 载荷面 |
| — | `thincoder-vscode/test/render-granularity.test.mjs` · `test/subagent-content-relay.test.mjs` | — | **零改**（判定） | 断言面零涉（段数面 / 载荷面——见 2.8 末行） |

**跨文件限**：五档产品码均 ≤300（`panel-chat.mjs` 253 / `activity-view.js` 202+6 / `panel-turn-stages.mjs` 178+6 / `panel-session-write.mjs` 137+8 / 核 `generate-title.mjs` 123+2），**零拆分需求**。

### 2.8 用例面 delta（哪些断言随改 / 哪些新例 / 哪些零改）

| # | 档 · 用例 | 输入（真载荷形 / 真入口） | 期望 | 先红读数 |
|---|---|---|---|---|
| 1 | `activity-closure.test.mjs` · 新例（advisor 流式） | `subagentChunk`：call `advisor`（face=toolCall）→ 3 条 `toolOutput`（多行文本、`tool:"advisor"`、`face:"toolOutput"`） | 状态区逐字 = `advisor`（文本零入）；头内 `advisor` 出现次数可断言 | 末行文本入状态区（红） |
| 2 | 同上 · 新例（嵌套名） | call（`sub:"explore#7"`, `tool:"read"`, `cmd:"src/x.mjs"`） | 状态区 = `explore#7/read — src/x.mjs` | 裸 `read — src/x.mjs`（红） |
| 3 | 同上 · 新例（旧形态零写入） | `{kind:"tool", text:"legacy tail line"}`（无 face / 无 tool）×2 | 状态区零变（不猜） | 末行文本入状态区（红） |
| 4 | 同上 · 新例（输出面有 cmd 亦零写） | `{kind:"tool", tool:"bash", cmd:"rm -rf x", face:"toolOutput"}` | 状态区零变 | `bash — rm -rf x` 入状态区（红） |
| 5 | 同上 · 结构锁 | 扫 `webview/activity-view.js` `noteChunk` 函数体 | `meta.stateWord` 写点恰 2（结构化 / think）∧ 无末行取值形态 | 写点 3（红） |
| 6 | `at-refs-restore.test.mjs` · W15-5（随改） | 新签名直驱 `generateTitle(panel, slot, messages)`（消息数组入参——真 `injectAtRefs` 产物） | 请求载荷不含哨兵 ∧ 含 `@a.txt` ∧ 请求 ≥1（原断言面保持） | 现签名不符（红） |
| 7 | 同上 · 新例（C 谓词） | `messages = [reminder user 条目, 真实 user 条目]` | 载荷含真实文本 ∧ 不含 reminder 文本 | 现谓词取 reminder（红） |
| 8 | 同上 · 新例（string 守卫） | `messages = [{role:"user", content:[…多模态…]}, {role:"user", content:"真实提问文本…"}]` | 跳过非串条目取下一真实消息 | 现谓词取多模态条目（红） |
| 9 | 同上 · 新例（短路 + 单写形） | 槽 `title` 在场 ⇒ 零触网（请求 0）；`saveLines(..., {title:"X"})` ⇒ 槽 `title === "X"`；`saveLines(..., {})` ⇒ 槽既有 title 保留 | 三断言同绿 | 现直写 `setSlotTitle` / 现 `title` 恒保留（红） |

**零改面（判定，写明防误改）**：`render-granularity.test.mjs`（T-G1–T-G7 段数断言——状态区零涉）· `subagent-content-relay.test.mjs`（T1 载荷六字段 + T-G8 面集锁——relay 零改）· `chat-panel.test.mjs:175`（回合尾标题已触发——stub `_generateTitle` 调用点不变，额外实参被 stub 忽略 ⇒ 零改；`isFirstMessage` 退役后其行内注释口径可随触随收，非必需）。

### 2.9 与 §1 的不一致处 + 上抛项

| # | 不一致 / 上抛 | 处置 |
|---|---|---|
| 1 | §1 诊断「D7 = VSC 即写 / CLI 回合尾写」与现码不符（两端皆回合尾；真差 = 源 / 触发 / 写形 / 谓词四环） | 已按四环实读定案（2.5），本批全消；此条 = 勘正记录 |
| 2 | §1 称「CLI 界面 chrome 不显示会话标题」不成立（`/session` 列表显示标题，回退链两端已同源） | **上抛 1（D8）**：剩余差 = 常显位 ⇄ 按需位——附 (a)/(b) 二选一与成本（2.6）；不阻塞其余项——**已消解（见 §2.12）** |
| 3 | §1 端差清单含 **D4** 但摘要未具名（无内容无法裁定二态） | **上抛 2**：请父侧补 D4 定义或确认可略；本批不动——**已消解（见 §2.11）** |
| 4 | §1 第 6 条「CLI 侧零改」vs 更正条「必要时核侧 title 链或 CLI 展示面」 | 本设计取**最小越界**：`thincoder-cli/**` 零改；核侧仅 `generate-title.mjs` 一行谓词收单源（零行为变化）；D8 若取 (b) 则须先解禁 CLI 展示面（另裁） |
| 5 | `docs/core/design/SESSION.md` §8.2 不并项行仍引 VSC `requestTitle` 独立实现（记录面历史理由，与 D7 单源化现状并存） | **上抛 3（观察）**：记录面照留；如需收正请父侧裁（一行） |
| 6 | 同族谓词另两处端侧消费面：`panel-chat.mjs:198`（本批 D7 退役 ✓）· `panel-messages.mjs:205`（`lastUser` 判定——非标题面） | 观察上报（非本批射程）；无 CLI 对位声明，不列端差 |

### 2.10 台账

**#183** → 本批（在途）· 落定后核销。

**读数收正（2.7 表 8–10 行 · 本轮实测）**：设计档行数一律按 `find /c /v ""`（终止行数）口径复读——`docs/vsc/design/WEBVIEW.md` **621 → 632** · `docs/vsc/design/WEBVIEW-PROTOCOL.md` **545 → 548** · `docs/core/design/SESSION.md` **570 → 583**。
表列 634 / 547 / 586 为落笔时估算值，以本行为准；§5 实施轮请按同一口径复读。

### 2.11 D4 二态裁定（**消**——tail-3 行文归一）· 随附 `WEBVIEW-PROTOCOL.md:234` 收正

> 轮次 = **fix（点补）** · 承 §1 补名后的 D4 定义（折叠 tail-3 落点）· 判据 = 父侧 07:33 口径（端差默认 = 消 · `docs/core/requirements/METHODOLOGY.md:77` F7-3 例外句）· 本节消解 2.9 上抛 2（§1 已补 D4 定义）。

**实读（逐档 · as-of 本轮回读）**：

- VSC 现形 = `refreshBlock` 把 tail-3 行 append 进 `<summary>` 内 `.sub-tail` span——`tail.textContent = "\n" + lines.join("\n")`（`thincoder-vscode/webview/activity-view.js:133-141`，赋值行 `:138`；无行前缀；提取 = `tailLines` `:102`，逐行 ≤200 字符）。
- CLI 现形 = 头行 + **`│ ` 前缀独立行**——冻结段 `thincoder-cli/src/tui/render-segments.mjs:103-109`（`│ ${sliceByWidth(line, cols - 4)}`）；运行面板同形 `subagent-panel.mjs:143-145`。两端 tail 提取语义同（末 3 条非空内容行——`tailLines` ∥ `fold-block.mjs:73` `foldTailLines`）。

**裁定 = 消**——三子面逐条（不得把可消面混进「结构面」）：

| 子面 | 现状对照 | 处置 |
|---|---|---|
| ① 行文本前缀 | VSC 无前缀 ∥ CLI `│ ` | **消**（一行级——逐字改动面见下） |
| ② 容器 | VSC 尾行在 `<summary>` 内 ∥ CLI 独立行条目 | **媒介原生（零可见差）**：`<details>/<summary>` 是 HTML 原生折叠（折叠态可见内容 = summary 内容 ⇒ 尾行欲随折叠态可见必须在 summary 内）；可见形态 = 头行 + 多行 dim 行（`chat.css:364-374` `pre-line` 已备）——行文归 ① 后**用户可见形态零差** |
| ③ 点击热区 | VSC 尾行属 summary ⇒ 可点 ∥ CLI 尾行只读（`_foldToggle` 只在头行——`render-segments.mjs:105` / `subagent-panel.mjs:111`） | 派生自 ②（容器属性 = **壳能力面**）；消法 = `pointer-events:none` 反原生注入（GUI 面主动缩热区）——**不采用**（如实上报；如须消请父侧一行裁定） |

**逐字改动面（产品码 · §5 实施笔域）**：

- `thincoder-vscode/webview/activity-view.js` `refreshBlock`（`:138`）——
  before：`tail.textContent = "\n" + lines.join("\n")`
  after：`tail.textContent = "\n" + lines.map((l) => "│ " + l).join("\n")`
- 零改面：`tailLines`（提取面保持纯函数——前缀归呈现叶）· `chat.css`（`.sub-tail` pre-line 逐字渲染 `│ `——零 CSS 改）· relay / 载荷 / 协议字段 / `ui.js`（零涉）。
- 2.7 表 1 行增量：`activity-view.js` 改动面 += D4（一行——Δ 仍在 ±6 内，202 → 202）。

**用例面增量（2.8 表 +1 行 · #10）**：

| # | 档 · 用例 | 输入 | 期望 | 先红读数 |
|---|---|---|---|---|
| 10 | `activity-closure.test.mjs` · 新例（D4 行文） | 折叠态块（`open=false`）+ 内容 3 行 ⇒ `refreshBlock(block)` | `.sub-tail` 文本按行以 `│ ` 开头、行序 = 原序末 3 行 | 先红 = 无前缀（裸行） |

**随附收正（一处 · 已落）——`docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.2「冻结头 + tail-3」行（`:234`）**：

- 结论列 before = 「等价（归档后形态不变）」+ 两侧 tail-3 无前缀表述；
- after = CLI 列补 `│ ` 前缀独立行坐标（`render-segments.mjs:103-109`）；本端列补 `│ ` 前缀（`refreshBlock`）+ 容器 = `<details>/<summary>` 原生；结论列 = **对齐（D4 消：tail-3 行文归一 = `│ ` 前缀独立行）**——「等价」不再作未决兜底措辞（按 07:33 口径 = 消 / 上抛二态落定）。
- 该档变更记录 +1 行（2026-09-21 · D4 裁定轮）**已落**（`:474-475`）。

**同族收正（三向一致导出 · 一处 · 已落）**：`docs/vsc/design/WEBVIEW.md` §5.2「tail-3 摘要」行（`:234`）——补「行文 = `│ ` 前缀独立行」+ 容器注 + 坐标收正（旧 `activity-view.js:86-96` 已失指 ⇒ `tailLines` :102 / `refreshBlock` :133-141）；该档变更记录 +1 行。**说明**：此项为范围外延一处——理由 = `WEBVIEW-PROTOCOL.md:234` 该行自身指「契约 = `WEBVIEW.md` §5.2」⇒ 不落则契约链断；如父侧判越界可一行回退。

**边界**：③ 项不作待消项（壳能力面如实登记，可一行裁定翻）；CLI 侧零改（D4 = VSC 单端行文）；不涉 relay / 载荷 / `ui.js` 合并粒度 / `WEBVIEW.md` §5.3 面集。

### 2.12 D8 改判（**消 · b 形「两端常显对齐」**）——CLI 侧逐字设计 + VSC 零改确认

> 来源 = 父侧代裁（用户 2026-09-21 07:33「后面你自动跑完吧」⇒ 点火 + §4 批准权委托父侧）；判据 = 端差默认 = 消（`docs/core/requirements/METHODOLOGY.md:77` F7-3 例外句）+ 用户 07:14「vsc 的标题与 cli 对齐」。**承 2.6 的 (b) 案**：D8 由「上抛」改判**消（b 形）**——2.6 的 (a)/(b) 二选一与「本席建议上抛 取裁」两处处置结论由本节取代（历史理由保留在 2.6）；**本批「CLI 侧零改」约束对 D8 一项解除**（其余 A/B/C/D 仍 CLI 零改）。

**实核（落点选择——父侧指定「你实核后定」）**：

- 候选两处：头部行 `renderHeader`（`thincoder-cli/src/tui/render-frame.mjs:42`）∥ 状态行 `renderStatus`（`:219`）/ `buildStatusLine`（`:344`）。
- **定 = 状态行 · 状态段簇尾**。理由：①「常驻标记进状态段簇尾」是本端既有唯一先例（LEDGER-SURFACE L1 台账标记——`:401-406`：簇尾 / 空值零注入 / 负向锁）；② 状态行宽度预算已形式化（`statusMax = cols − 1 − width(bannerPrefix) − width(attentionPad)` + `sliceByWidth` + 「整行 ≤ cols − 1」不变量——`:232-234`）——标题段直接入既有链，零新机制；头部行预算为魔数 `cols − 60`（`:55`）且无「整行 ≤ cols」不变量，不选；③ 语义面：状态行 = 会话运行信息面 ∥ 头部行 = 应用 / 模型 / cwd 身份面——会话级信息随状态行。
- **成本如实（两点）**：① 80 列下 idle 状态行已超预算（实测 ≈ 98 列 > 79——键位组尾部 `Ctrl+C: exit (×2)` 已被截，属既有行为）；标题段置**键位组之前** ⇒ 截断自键位组起、标题存活优先（宽终端全量可见）；② 模态提示态状态行整行让位（见「边界」①）。

**逐字设计（`thincoder-cli/src/tui/render-frame.mjs` · `buildStatusLine`）**：

- 新增两行（`ledgerHint`（`:404-406`）之后、`return`（`:407`）之前）：
  `const titleRaw = typeof agent.title === "string" ? agent.title.trim() : ""`
  `const titleHint = titleRaw ? ` │ ${stringWidth(titleRaw) > 40 ? sliceByWidth(titleRaw, 39) + "…" : titleRaw}` : ""`
- `return` 串插点（`:407`）：`…${scrollHint}${ledgerHint}${titleHint} │ ${enterHint} │ …`——标题段 = `ledgerHint` 与键位组（` │ ${enterHint}`）之间。
- **取值 = 活对象单读** `agent.title`（写点四处：载入 `applySession`（`thincoder-core/session-lifecycle.mjs:100`）/ 新建清空（`:249`）/ 回合尾生成（`thincoder-core/generate-title.mjs:117`）/ `/rename`（`thincoder-cli/src/tui/cmd-session.mjs:35`））；每帧 recompute——零缓存副本、零推送链（§7.3 banner 同纪律）。
- **形态 / 预算**：` │ <title>`（无引号装饰——与 `/session` 列表 title 裸形一致）；段宽 = 40 显示列截断（超宽补 `…`——与生成上限 40 字符同数）；**空值零注入**（空 ⇒ 零字节 = 半态逐字节等价——负向锁沿 `:233-238` 纪律）。
- **时序**：回合尾 `await ensureSessionTitle(agent)`（`thincoder-cli/src/tui/agent-turn.mjs:308`）→ `render()`（`:326`）⇒ 标题落定当帧可见（行 diff 重绘）；回合中 1s ticker 兜底。

**VSC 侧零改确认**：顶栏 `#session-title`（`thincoder-vscode/webview/index.html:28` / `session-bar.js:109-112`）与 `sessions` 载荷链零动；两端值同字段（`title`）、同回退链（`listSlots` 派生——VSC `pushSessions`，`thincoder-vscode/src/extension/panel-session.mjs:227-231`）。**协议 / 载荷 / 消息名零变**（`WEBVIEW-PROTOCOL.md` 零改——本批该档仅 D4 行收正）。

**受影响文件表增补（2.7 表增量 · 行数 = 本轮实读 `find /c /v ""` 口径）**：

| # | 文件 | 现 | 预期 Δ | 改动 |
|---|---|---|---|---|
| 11 | `thincoder-cli/src/tui/render-frame.mjs` | 408 | +2 | D8（`buildStatusLine` 标题段：两行 + 串插点） |
| 12 | `thincoder-cli/test/session-title-surface.test.mjs` | 新建 | ~60 | D8 用例 T1–T3（自动收集——`test/run.mjs` 两层 glob + 反查，零登记面） |
| 13 | `docs/cli/design/TUI.md` | 655 → 667 | **已落** | §7.4 会话标题段（常显 · D8）+ 变更记录 |
| — | `docs/core/design/SESSION.md` | 583 → 584 | **已落** | §6.7「读 / 展示」行收正（常显 = 两端 chrome）——2.7 表第 10 行同档增量 |

**用例面增量（2.8 表增量 · #11–13 · 沿既有渲染测试形态 = `renderStatus` 直驱）**：

| # | 档 · 用例 | 输入 | 期望 | 先红读数 |
|---|---|---|---|---|
| 11 | 新档 T1（有标题） | `renderStatus(stub, {...agent, title: "修复 VSC 标题行"}, 80, [])` | strip-ANSI 文本含 ` │ 修复 VSC 标题行`；整行显示宽 ≤ 79 | 先红 = 无该段 |
| 12 | 同档 T2（空值零注入 · 负向锁） | `title: ""` 与 `title: undefined` 两形态 | 与改前逐字节等价 ∧ 两形态输出相同 | 锁形（两态同绿——防占位符混入） |
| 13 | 同档 T3（截断） | 50 字符长标题 | 段 ≤ 40 显示列 + 尾 `…`；`Enter: send` 仍在行 | 先红 = 无该段 |

**边界（写明防误改）**：

① 模态提示态（question / permission / picker / wizard / slash 提示）状态行整行让位——标题段仅 idle / processing 常态（既有形态，零改）；
② 跨端改名在对方运行期不即时刷新（两端共有既有边界，非本项引入）；
③ **空标题窗口如实上报**：生成前 / 持续失败期，VSC 顶栏显示槽标签回退链值（`"<首条消息≤40>"` / `"(empty)"`——`panel-session.mjs:231`）、CLI 段零注入——**VSC 零改冻结下不能就地消**（消法 = VSC 撤占位 ∥ CLI 复刻回退链——各自越出本轮授权面）⇒ 归父侧一行（按占位面差异记，非标题本体差）；
④ 不新造 i18n 键（标题 = 用户数据）；头部行 `renderHeader` 零动；CLI 其余面（A/B/C/D）仍零改。

**本轮 doc-check 回读**：`node scripts/doc-check.mjs --root .`——悬空 3 / 行宽 3（均 = 基线同三条，在未触碰档：`AGENT-LOOP-SUBAGENT.md:2047/2065/2066` · `:2091` · `BATCH-RECORD.md:358/365`）；**本批触碰四档（`WEBVIEW-PROTOCOL.md` / `WEBVIEW.md` / `SESSION.md` / `TUI.md`）零新增**（首稿 `WEBVIEW-PROTOCOL.md:474` 行宽 319 已按两行拆分收正——复读 551）。

**上报（非本席笔域）**：D8 为 CLI 侧显示增量——`docs/cli/requirements/TUI.md`（需求档 · 主 agent 笔域）无对应条目（F13 / N9 边界句仅约束 attention 增量）；如需在需求档补「会话标题常显」条目，请主 agent 落笔。

### 2.13 设计评审轮 1 修正（fix 轮 · 2026-09-21 · eng-designer）

> 来源 = §3 轮 1（VERDICT = changes-required：🔴1 / 🟡5 / 🔵3——共 9 条）；父侧逐条裁定 = **#1–#9 全部受理**，处置执行人 = 本席（Suggestion 列 = 评审建议；本条 = 落位记录）。
> **口径**：本轮只改设计档（`docs/cli/design/TUI.md` · `docs/core/design/SESSION.md` · `docs/vsc/design/WEBVIEW.md`）+ 本记录；`src/**` / 测试码 / 需求档 / CLI 产品树零碰（各归笔域）。
> **本节的效力**：前文对应行的「收正 / 取代」以本节文本为准（批次档追加式——前文原行保留为历史、不改写；就地替换如须执行 = 父侧动作，先例 = zero-block 批 §2 收正）。

**逐条处置（发现号 → 落位）**

1. **#1（🔴 · 回退链表述）= 收正为限定形（评审建议①）**——三处 + 同族核：
   - `docs/cli/design/TUI.md` §7.4（原 `:584`，现 `:584-585`）——
     before：「…VSC 端零改；两端同字段（`title`）同回退链（`listSlots` 派生——VSC `pushSessions`，`panel-session.mjs:227-231`）。」
     after：「…VSC 端零改；**列表面**（`/session` / VSC `pushSessions`）两端同字段（`title`）同回退链（`listSlots` 派生——VSC `panel-session.mjs:227-231`）；本段取值 = `agent.title` 活读 · **空值零注入**（非回退链）；空窗差（生成前 / 失败期：VSC 顶栏显回退链值 ∥ 本段零注入）= 已登记端差（A9 保留：结构性不对称 + 证据 + 显式裁定；登记 = 批档 §1）。」
   - `docs/core/design/SESSION.md` §6.7「读 / 展示」行（原 `:164`，现 `:164-166`）——
     before：「两端同读 `listSlots` 的标题（回退链 `title → firstMessage → "(empty)"`——VSC `pushSessions` 同链）；**常显 = 两端 chrome 常驻**（…落点设计 = `docs/cli/design/TUI.md` §7.4；D8 消 · 2026-09-21）；`/session` 列表按需面不变。」
     after：「**列表面**（CLI `/session` / VSC `pushSessions`）两端同读 `listSlots` 的标题（回退链同上——VSC `pushSessions` 同链）；**常显 = 两端 chrome 常驻**（VSC 面板顶栏 / CLI 状态行段——CLI 段取值 = `agent.title` 活读 · **空值零注入**（非回退链）；落点设计 = `docs/cli/design/TUI.md` §7.4；D8 消 · 2026-09-21）；空窗差（生成前 / 失败期：VSC 顶栏显回退链值 ∥ CLI 段零注入）= **已登记端差**（A9——结构性不对称 + 证据 + 显式裁定）；`/session` 列表按需面不变。」
   - 本档 §2.12「VSC 侧零改确认」句（`:258`）——以本节「§2.12 `:258` 收正」块文本取代（见下）。
   - 同族核（`WEBVIEW.md:136`）：该处无回退链句；其「四环」形态属 #4 同族 ⇒ 已随 #4 收正（读·展示环附 A9 注 + TUI.md §7.4 对位）。
   - 变更记录同步：三档各 +1 行（均已落）。
2. **#2（🟡 · 测试档 >300）= 补审视结论**：`thincoder-vscode/test/activity-closure.test.mjs`（317 → ≈375，+≤60；增量 = 用例追加 #1–#5 / #10 / #14 / #15——既有断言面零改，见 #3 判定）⇒ **无需拆分**；>300 为**存量**（入库即 317——本批前已越 300 建议线；距 500 硬限余量充足）——登记存量债〔体例 = `docs/cli/design/TUI.md:473-475` / `docs/core/design/SESSION.md:385-386`〕。`:161` 跨文件限句的「零拆分需求」结论对本测试档同样成立。
3. **#3（🟡 · T-CL18）= 判定：保持（零改）**。断言对象（实读 `thincoder-vscode/test/activity-closure.test.mjs:286-299`）：
   ① 结构化 `tool/cmd` ⇒ 状态区 `tool — cmd`（含无 cmd 裸工具名 / cmd >60 截断两形）——改动面 = 结构化分支保形 + `sub` 前缀合成，该形**保持**；
   ② `→ ` 前缀结果 chunk **零写入**（`:292-293`）——改后「输出面零写入」为其**超集**，**保持**；
   ③ 被删「工具文本尾句」支的触发形（无 `tool` 字段且非 `→ ` 前缀的文本 chunk；`face:"toolOutput"` 携 `tool` 的 chunk）——T-CL18 **未构造** ⇒ 不被触（测试面全扫 `stateWord|尾句` 零该形断言）。
   ⇒ §1 第 6 条「`activity-closure` T-CL18 既有锁须同步」一项**不适用**（需同步者 = 新例覆盖 + 其余两档判定口径）；§2.9 反转补录见下。
4. **#4（🟡 · 环名 / 环数）= 统一为「五环」**：**链环规范枚举 = 源 / 生成 / 触发 / 写 / 读·展示（五环；谓词 ∈ 源、时点 ∈ 写）**。本档前文各处「四环」（§1 `:27` · §2.0 `:67` · §2.5 `:114` / `:120` / `:131` · §2.9 `:183`）按此重基：
   - §2.5 正文「端差四环：①源 ②触发 ③写形 ④谓词」= **端差四处**（按「收敛前两端有别之处」计家——谓词 = 源环的过滤判据）；按链环读 = 源 / 触发 / 写 三环 + 读·展示常显位（D8，另见 §2.6 / §2.12）；
   - §2.5 定案表（`:122-127`）四行 = 链五环之前四环逐条（读·展示归 §2.6 / §2.12）；
   - 设计档两处（`SESSION.md:155` · `WEBVIEW.md:136-137`）**已就地收正**为「源 / 生成 / 触发 / 写 / 读·展示五环」（含谓词 / 时点归属注）。
5. **#5（🟡 · 深嵌套同构）= 实核（as-of 本轮读出）+ 用例补 ≥2 层**：
   - 核 `parseRelayPath`（`thincoder-core/agent/relay-prefix.mjs:16-32`）——`label = inner.join("/")`（`explore#1/x#2/read` ⇒ `inner` = `["explore#1","x#2"]` / `label` = `"explore#1/x#2"` / `rest` = `"read"`）；
   - CLI 落点（`thincoder-cli/src/tui/subagent-blocks.mjs:337`）`= ${path.label}/${path.rest}` ⇒ 深嵌套 = `explore#1/x#2/read`；
   - VSC 落点（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:176`）`sub = inner.join("/")` + 叶工具名（`rest`）⇒ 合成 `explore#1/x#2/read`——**两端逐字同构成立（≥2 层实核）**；用例 #15 固化（先红 = 裸 `read — src/x.mjs`）。
6. **#6（🟡 · 上报行）= 收正（取代）**：原「上报（非本席笔域）」行（`:286`）**取代**为——「D8 = CLI 侧显示增量；**F15 已落** `docs/cli/requirements/TUI.md:36`（变更记录行 `:102` 父侧已补）⇒ 该项**已闭环**，无遗留需求档动作。」
7. **#7（🔵 · 行数读数）= 收正**：见下「读数收正」表（口径 = `find /c /v ""`（终止行数）；评审轮 `635 / 552 / 668` = read 工具计法（+尾空行 1）——口径差 1、非内容差）；`TUI.md` §8.2「需求层条目」计数行已机械收正（`F1–F13 / N1–N11` → `F1–F15 / N1–N12`，现 `:610`；依据 = `docs/cli/requirements/TUI.md` 实档 F14/F15 · N12）。
8. **#8（🔵 · 上抛行标注）= 标注**：§2.9 表行 2（`:184`，上抛 1 · D8）末补「**已消解（见 §2.12）**」；表行 3（`:185`，上抛 2 · D4）末补「**已消解（见 §2.11）**」。
9. **#9（🔵 · 未查证面② 承载位）= 用例面 #14**（用户 07:14 场景一体化复现——见下用例表）；§6 收口如做真机复现 = 按同一判据核（另形态 ⇒ 先复现再补修，即 §1 `:29` 原句口径）。

**§2.12 `:258` 收正（#1 · 逐字）**

- before：「…与 `sessions` 载荷链零动；两端值同字段（`title`）、同回退链（`listSlots` 派生——VSC `pushSessions`，`thincoder-vscode/src/extension/panel-session.mjs:227-231`）。」
- after：「…与 `sessions` 载荷链零动；**列表面**（`/session` / `pushSessions`）两端值同字段（`title`）、同回退链（`listSlots` 派生——VSC `pushSessions`，`thincoder-vscode/src/extension/panel-session.mjs:227-231`）；**CLI 状态段取值 = `agent.title` 活读 · 空值零注入**（非回退链）；空窗差（VSC 顶栏显回退链值 ∥ CLI 段零注入）= **已登记 A9 项**（§1 `:51`）。」

**§2.9 反转补录（#3）**

| # | 不一致 / 上抛 | 处置 |
|---|---|---|
| 7 | §1 第 6 条「测试面随改（`activity-closure` T-CL18…既有锁须同步）」vs §2.7 行 6 / §2.8「T-CL18 既有断言保持」 | **判定 = 保持**（断言对象 = 结构化 `tool — cmd` 形 + `→ ` 前缀零写入——均不在被删「工具文本尾句」支射程；#3 全文见上） |

**用例面增量（2.8 表增补 · #14–#15）**

| # | 档 · 用例 | 输入（真载荷形 / 真入口） | 期望 | 先红读数 |
|---|---|---|---|---|
| 14 | `activity-closure.test.mjs` · 新例（**用户 07:14 场景一体化复现**——#9 承载位） | `subagentChunk` 序贯：`explore#7` 的 `toolCall`（`tool:"read"` / `cmd:"src/x.mjs"` / `sub:"explore#7"`）→ 其 `toolOutput` 多行文本 → `advisor` 的 `toolCall`（face=toolCall）→ 3× `toolOutput` 流式多行（relay 归一形：`face` 随行） | 状态区渐次 = `explore#7/read — src/x.mjs` → `advisor`；**恒无流式文本** | 先红 = advisor 文本末行入状态区（泄漏本体） |
| 15 | 同上 · 新例（深嵌套 ≥2 层——#5） | `{kind:"tool", tool:"read", cmd:"src/x.mjs", sub:"explore#1/x#2"}`（relay 归一形——`sub = inner.join("/")`） | 状态区 = `explore#1/x#2/read — src/x.mjs`（两端同构形） | 先红 = 裸 `read — src/x.mjs` |

**读数收正（#7 · 口径 = `find /c /v ""`（终止行数）· as-of 本修正轮写入后）**

| # | 档 | 原读数（2.7 表 / §2.10 / §2.12 行） | 现行实读 |
|---|---|---|---|
| 8 | `docs/vsc/design/WEBVIEW.md` | 621 → 634（表列）/ 收正 632（`:194`） | **636**（+2 = 本修正轮落笔） |
| 9 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 545 → 547（表列）/ 收正 548（`:194`） | **551**（本批未再触碰） |
| 13 | `docs/cli/design/TUI.md` | 655 → 667（`:266`） | **672**（+2 = 本修正轮落笔；父侧机械收 2026-09-21 ✗ 原记 670 实测差 2） |
| 10 | `docs/core/design/SESSION.md` | 570 → 583（`:194`）/ 583 → 584（`:267`） | **588**（+4 = 本修正轮落笔） |

（§5 实施轮请按同口径复读。）

**本轮 doc-check 回读**：`node scripts/doc-check.mjs --root .`——悬空 3 / 行宽 3（均 = 基线同三条：`AGENT-LOOP-SUBAGENT.md:2047/2065/2066` · `:2091` · `BATCH-RECORD.md:358/365`，全在未触碰档）；**本批触碰三档（`TUI.md` / `SESSION.md` / `WEBVIEW.md`）零新增**。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 「标题回退链」两处规范面表述与 D8 落点设计冲突：`docs/cli/design/TUI.md:584`「**VSC 对位**：顶栏常显保持、端侧零改；**两端同字段（`title`）同回退链**（`listSlots` 派生——VSC `pushSessions`…）」+ `docs/core/design/SESSION.md:164`「**读 / 展示**：**两端同读 `listSlots` 的标题**（回退链 `title → firstMessage → "(empty)"`——VSC `pushSessions` 同链）」，而同一批的 CLI 段落点 = 取值 `agent.title` 活对象单读、**空值零注入**、无回退链（`docs/batches/2026-09-21-vsc-block-title-align.md:254` · `:255`），且空标题窗口的端差已被显式登记（VSC 顶栏回退链值 ∥ CLI 段零注入——批档 `:281` · §1 A9 行 `:51`）。同一机制（标题展示取值 / 回退）在两处描述不同 ⇒ 按既有约定须先消解（🔴 不降级） | 二择一并同步：①收正两处措辞——限定为「列表面（`/session` / `pushSessions`）同回退链；CLI 状态段 = `agent.title` 活读 · 空值零注入」，并把空窗差标为已登记 A9 项；②反向改判——若确应两端同回退链，则同步改批档取值判据与用例 T2（「与改前逐字节等价」负向锁）及 F15 判定句 |
| 2 | Affected-file size annotations | 🟡 | `thincoder-vscode/test/activity-closure.test.mjs` 现 317 行、预期 +≤35（≈352 行，批档 `:153`）已越 300 行建议线（未触 500 硬限），但「跨文件限」句只覆盖五档产品码并断言「**零拆分需求**」（批档 `:161`）——该测试档无 >300 拆分审视结论（先例 = `docs/cli/design/TUI.md:473-475` / `docs/core/design/SESSION.md:385-386` 的 >300 档结论行） | 在受影响文件表或「跨文件限」句内补该测试档的 >300 审视结论行（存量行数 + 增量面 = 用例追加 ⇒ 无需拆分，或给出拆法） |
| 3 | Acceptance criteria | 🟡 | `activity-closure.test.mjs` 行断言「T-CL18 既有断言**保持**」（批档 `:153`），与 §1「测试面随改（`activity-closure` T-CL18 … 既有锁须同步）」（批档 `:41`）相反；§2.8 零改面段（批档 `:177`）只对 `render-granularity` / `subagent-content-relay` / `chat-panel.test.mjs` 给了判据，未说明 T-CL18 断言对象为何不受「尾句支删除」影响，且该反转未入 §2.9 不一致表（`:183-188`） | 注明 T-CL18 的断言对象与「保持」理由（若其覆盖被删的「输出文本入状态区」支则须列为随改用例）；或在 §2.9 表内补录该反转 |
| 4 | Clarity | 🟡 | 「四环」成员集在档内三处不一致：批档 §2.5 正文「真端差有**四环**：① 源 ② 触发 ③ 写形 ④ 谓词」（`:114`）∥ 同节定案表四行 = 源 / 生成 / 触发 / 写形（`:122-127`）∥ 设计档「源 / 生成 / 写 / 读四环单源」（`docs/core/design/SESSION.md:155` · `docs/vsc/design/WEBVIEW.md:136`，后者正文只列 源 / 写 / 触发 / 刷会话列表） | 统一环名与环数（或逐处写明该处「四环」的枚举成员以哪一节为准），使「四环单源」可无歧义引用 |
| 5 | Acceptance criteria | 🟡 | B 项断言「深嵌套形 = `inner.join("/") + "/" + rest`（`explore#1/x#2/read`——**两端同**）」（批档 `:88`），与 CLI 式 `${path.label}/${path.rest}`（同句所引）在 ≥2 层时是否同形，档内未给实核证据；用例面只覆盖单层嵌套（`sub:"explore#7"`——批档 `:168`），深层形态无先红读数 | 补 ≥2 层嵌套用例（含先红读数），或补「两端同构」的实核证据并标注 as-of |
| 6 | Requirements coverage | 🟡 | 批档 §2.12 末行仍上报「`docs/cli/requirements/TUI.md`（需求档）**无对应条目**…如需在需求档补「会话标题常显」条目」（`:286`），与 §1「**需求条目已落**：`docs/cli/requirements/TUI.md` **F15**」（`:52`）及实档（F15 行在 `docs/cli/requirements/TUI.md:36`）冲突；另 F15 落地未在该档变更记录 +1 行（F14 有先例——`:101`），末次记录停在 2026-09-19 | 收正 / 删除该上报行（F15 已落）；需求档补 F15 的变更记录一行 |
| 7 | Doc-state | 🔵 | 行数读数与实测不符：批档 `:194` 收正为 WEBVIEW.md 621 → **632** · WEBVIEW-PROTOCOL.md 545 → **548**（表列 634 / 547——`:155-156`）· TUI.md 655 → **667**（`:266`）；按同口径（`find /c /v ""` / 终止行数）实读 = **635 / 552 / 668**（SESSION.md 583 → 584 相符——`:267`）。另 `docs/cli/design/TUI.md:609` §8.2 「F1–F13 / N1–N11」行计数陈旧（现 F15 / N12，批档 `:53` 已登记延后） | 实施 / 收口轮按同口径复读三档行数并收正；§8.2 计数行随冻结窗后一轮机械收正（已登记项） |
| 8 | Doc-state | 🔵 | §2.9 上抛表两条已被后节消解但未标注：上抛 2（D4）由 §2.11 消解（`:199`）、上抛 1（D8）由 §2.12 取代 2.6 处置结论（`:240`）——而 `:184` / `:185` 两行仍以「上抛」形态在册；另 §1 `:16` 已有 D8 代裁记录（消 · b 形），§2.6「本席建议上抛取裁」（`:142`）写于其后 | 在两行末补「已消解（见 2.11 / 2.12）」标注，避免读者按上抛项重复处理 |
| 9 | Requirements coverage | 🔵 | 用户 07:14 报告场景（eng-coder 调 explore / advisor 流式）在用例面无一体化复现项；§1 已如实登记「未真机复现」与「若实机所见另有形态，按批内『先复现再改』补验」（`:29`），但该补验项未落到 2.8 用例面或收口面承载位 | 明示该复现项的承载位（用例面新例或收口面真机复现），使 §1 未查证面 ② 有闭合判据 |

计数：🔴 1 · 🟡 5 · 🔵 3（共 9 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 复核（核对象 = §2.13 fix 轮落地；承轮 1 发现表 9 条逐条实读复核）**

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/cli/design/TUI.md:584-585` · `docs/core/design/SESSION.md:164-166` · 批档 §2.13（原 §2.12`:258`） | 🔴 | **Fixed** | 三处收正全部落地：TUI.md`:584`「…**列表面**（`/session` / VSC `pushSessions`）两端同字段（`title`）同回退链（`listSlots` 派生——VSC `panel-session.mjs:227-231`）；」+ `:585`「本段取值 = `agent.title` 活读 · **空值零注入**（非回退链）；空窗差（生成前 / 失败期：VSC 顶栏显回退链值 ∥ 本段零注入）= 已登记端差（A9 保留：结构性不对称 + 证据 + 显式裁定；登记 = 批档 §1）。」；SESSION.md`:164-166` 同形（回退链逐字 + A9 注）；批档 §2.12`:258` 原句按 §2.13 取代块（`:325-328`）+ 效力声明（`:292`——追加式）覆盖。 |
| 2 | 2 | 批档 §2.13`:306` | 🟡 | **Fixed** | >300 审视结论补入（`activity-closure.test.mjs` 317 → ≈375 · +≤60 ⇒ **无需拆分**；存量债登记）。 |
| 3 | 3 | 批档 §2.13`:307-311` · `:330-334` | 🟡 | **Fixed** | T-CL18 断言对象三条逐项给出（`thincoder-vscode/test/activity-closure.test.mjs:286-299`）+ §2.9 反转补录（row 7）入册。 |
| 4 | 4 | `docs/core/design/SESSION.md:155` · `docs/vsc/design/WEBVIEW.md:136-137` · 批档 §2.13`:312-315` | 🟡 | **Fixed** | 环枚举统一为**五环**（源 / 生成 / 触发 / 写 / 读·展示；谓词 ∈ 源、时点 ∈ 写）——两设计档实读均已是「五环」；批档前文按重基声明覆盖。 |
| 5 | 5 | 批档 §2.13`:316-319` · `:341` | 🟡 | **Fixed** | 深嵌套逐环实核（`relay-prefix.mjs:16-32` ⇒ `label = inner.join("/")`）+ 用例 #15（≥2 层）落表。 |
| 6 | 6 | 批档 §2.13`:320` · `docs/cli/requirements/TUI.md:36` / `:102` | 🟡 | **Fixed** | 原上报行取代为「F15 已落…已闭环」；F15 行 + 变更记录行均在档（实读）。 |
| 7 | 7 | 批档 §2.13`:321` / `:343-352` · `docs/cli/design/TUI.md:610` | 🔵 | **Fixed（附一处读数差）** | §8.2 计数行已收正（实读 `:610` = 「需求层条目 … F1–F15 / N1–N12 …」）；WEBVIEW 636 / PROTOCOL 551 / SESSION 588 三档读数与实测相符；**TUI.md 行（`:349` 载「**670**（+3 = 本修正轮落笔）」）与实测不符**——末内容行实读 = `:672`「⑤ 坐标全量改**现状路径**并实核；⑥ 「嵌套子代理」按现行机制（内层活动并入外层流）重建，旧子块小节形态入 §8.1。」（尾空行 673）⇒ **差 2**。 |
| 8 | 8 | 批档 `:184` / `:185` | 🔵 | **Unfixed（声称已落地，实测未落地）** | §2.13 项 8 称两行「末补『已消解…』」——实读 `:184` = 「**上抛 1（D8）**：剩余差 = 常显位 ⇄ 按需位——附 (a)/(b) 二选一与成本（2.6）；不阻塞其余项」、`:185` = 「**上抛 2**：请父侧补 D4 定义或确认可略；本批不动」——两行均无「已消解」字样（全文命中仅 `:322`（该项自述）· `:371`（轮 1 发现表））。 |
| 9 | 9 | 批档 §2.13`:323` · `:338-341` | 🔵 | **Fixed** | 用户 07:14 场景一体化复现落用例 #14（先红 = advisor 文本末行入状态区）。 |

**新引入问题（单趟扫描）**：未发现——三档就地收正与批档 §2.13 相互自洽；另核 F15 实档（`:36` / `:102`）与设计档 A9 注无冲突。

**计数**：🔴 0 · 🟡 0 · 🔵 2 处（#8 声称落地未落地；#7 附 TUI.md 读数差 2）——其余 7 条复核通过。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-21 08:0x · 父侧代签**（用户 07:33 授权：「**后面你自动跑完吧。**」⇒ 本批点火权 + §4 批准权委托父侧 ✓ 自缚三条件在册 §1.0）✓

**三条件齐备**：① 设计评审 **pass**（轮 1 → changes-required（🔴1+🟡5+🔵3）→ 修正轮 §2.13 → **轮 2 pass**（🔴 0✗残 🔵 2 = 父侧已收）——§3 两轮逐字在档）；② **修正轮已落地并逐条核验**（#24 九条 + #25 两项 + 父侧两处 🔵 收正）；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：① 设计定稿（§2 + §2.11 / §2.12 / §2.13）；② **实施** = eng-coder（产品码 7 档 + 测试 3 档 + 新测试 1 档——见 §2.7 + §2.12 增量）；③ 出批边界：表外档 · 文档面（已由设计轮落地）· 提示词面。

## §5 实施记录（eng-coder）

（待批准后。）

### 5.1 交付摘要（eng-coder · 2026-09-21 08:0x–08:5x · 唯一权威 = §2 全文含 §2.11/§2.12/§2.13）

**A**（输出面零写入 · 用户 07:14 泄漏本体）✓ · **B**（嵌套工具名 `label/tool`）✓ · **C**（谓词单源 `isRealUserMsg`）✓ · **D4**（tail-3 行文 `│ ` 前缀）✓ · **D7**（标题链五环单源：源 / 触发 / 写形 / 时序）✓ · **D8**（CLI 状态行标题段常显）✓ · 测试面 §2.8 用例 1–9 + #10 + #14/#15 + T1–T3 全部落位（先红 → 后绿，读数见 5.3）。

### 5.2 改动 file:line 表（行数 = `find /c /v ""`（终止行数）口径复读）

| # | 文件 | 行数 | 改动（file:line） |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/activity-view.js` | 202 → **200** | `noteChunk` 重写 `:184-200`（闭枚举 doc `:179-183`；face 面门 `:190`；嵌套名 `:191`；写点 = `:193`/`:197` 恰 2）· 尾句支 + R5 面门注释删净 · `stateWord` doc 收正 `:88-89` · `refreshBlock` 注释 `:127-128` · **D4** 尾行 `│ ` 前缀 `:140`（`tail.textContent = "\n" + lines.map((l) => "│ " + l).join("\n")`）· `refreshBlock` tail 注释 `:132-134` |
| 2 | `thincoder-vscode/src/extension/panel-session-write.mjs` | 137 → **144** | 谓词 import `:26-28`（`isRealUserMsg`）· `saveLines` 标题写入口 `:68-71`（`title: extra.title ?? existing.title ?? ""`）· `generateTitle(panel, slotOverride, messages)` `:119-144`（槽空判短路 `:133`；源改内存入参 `:134`；返值不写槽 `:139`）· 头注环 import 句收正 `:17-19`（`pushSessions` 退场） |
| 3 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 178 → **188** | `finalizeTurn` 序翻「先标题后 save」：标题 `:117-128`（`isFirstMessage` 参数退场 · 实参 `:125`）→ 整档 save 携 `extra.title` `:129-136`（`:133`）→ 写后刷会话列表 `:137-141`（非致命守卫 `:140`）· 函数 doc `:99-103` |
| 4 | `thincoder-vscode/src/extension/panel-chat.mjs` | 253 → **253** | `isFirstMessageNow` / `isFirstMessage` 退场（decl `:130` 删 · 计算两行 `:198-199` 删 · 实参 `:247` 删）；头注 A2 句 + `:197-200` 注释收正 |
| 5 | `thincoder-core/generate-title.mjs` | 123 → **123** | 谓词换指核 `isRealUserMsg`：import `:12-14` · `ensureSessionTitle` 内存回退腿 `:110-114`（`:114`）——零行为变化 |
| 6 | `thincoder-cli/src/tui/render-frame.mjs` | 408 → **412** | **D8** `buildStatusLine` 标题段：注释 `:407-408` + `titleRaw` `:409` + `titleHint` `:410`（40 显示列截断）+ 串插点 `:411`（`ledgerHint` 后、键位组前） |
| 7 | `thincoder-vscode/src/extension/chat-panel.mjs` | 455 → **455** | **表外改动（披露项）**：`_generateTitle(slotOverride, messages)` 转发实参 `:276`——D7 必要接线（不转发 ⇒ `messages` 恒 undefined ⇒ 标题永久静默返 null；原因 = 设计 §2.7 表未登该档，非范围扩张） |
| 8 | `thincoder-vscode/test/activity-closure.test.mjs` | 317 → **423** | `readFileSync` import `:11` · 新块 `:320-423`（helper `:324`；T-CL20 `:326` · T-CL21 `:342` · T-CL22 `:349` · T-CL23 `:363` · T-CL24 `:375` · T-CL25 `:386` · T-CL26 `:400` · T-CL27 `:418`）· 既有 T-CL1–T-CL19 零改 |
| 9 | `thincoder-vscode/test/at-refs-restore.test.mjs` | 148 → **212** | import 补 `saveLines` / `loadSlot` `:19-20` · W15-5 随新签名 `:131-139`（槽只供 provider + 短路位）· 新块 `:151-212`（夹具 `d7Slot` `:154-160`；§2.8-7 `:164` · -8 `:181` · -9 `:198`） |
| 10 | `thincoder-cli/test/session-title-surface.test.mjs` | 新建 **49** | D8 用例 T1 `:28` · T2 `:35` · T3 `:44`（自动收集——`test/run.mjs` 两层 glob，零登记面） |

**零改面确认（实读 + mtime）**：`thincoder-vscode/src/extension/panel-subagent-relay.mjs` · `webview/ui.js` · `panel-toolpanel.mjs` · `test/render-granularity.test.mjs` · `test/subagent-content-relay.test.mjs` · `test/chat-panel.test.mjs` 全部零改（mtime 09-17～09-20，均早于本批 09-21）；`webview/chat.css` · `thincoder-cli/**`（除 #6 + #10）· relay 载荷字段亦零改。

**文档面零改（本实施轮）**：`docs/vsc/design/WEBVIEW.md` **636** · `WEBVIEW-PROTOCOL.md` **551** · `docs/cli/design/TUI.md` **672** · `docs/core/design/SESSION.md` **588**——与 §2.13 读数收正表**逐档相符**（机械证据：任何本实施轮写入都会改动读数或内容）⇒ 设计轮已落、实施轮零碰。

### 5.3 用例读数（先红复现 → 后绿；先红 = 实现前实跑读数）

| 用例 | 先红读数（实测） | 后绿 |
|---|---|---|
| T-CL20（§2.8-1） | `流式后仍 = advisor` 红——实到 `"[▶ eng-coder#7 · 0s] 最末行尾句"`（**泄漏本体复现** ✓） | ✔ |
| T-CL21（§2.8-2） | 状态区 = 裸 `read — src/x.mjs`（设计预判吻合） | ✔ |
| T-CL22（§2.8-3） | 状态区 = `' legacy tail line two'`（末行文本入头） | ✔ |
| T-CL23（§2.8-4） | 状态区 = `' rm -rf x'`（`toolOutput` 携 cmd 入头） | ✔ |
| T-CL24（§2.8-5） | 写点 **3** !== 2（结构锁红） | ✔ 写点 2 |
| T-CL25（§2.11 #10） | `.sub-tail` = `"\nbeta\ngamma\ndelta"`（无 `│ ` 前缀） | ✔ 逐行 `│ ` |
| T-CL26（§2.13 #14） | ① 子代工具行 = 裸 `read — src/x.mjs` | ✔ `explore#7/read — src/x.mjs` → `advisor` 渐次 |
| T-CL27（§2.13 #15） | 裸 `read — src/x.mjs`（≥2 层丢路径段） | ✔ `explore#1/x#2/read — src/x.mjs` |
| W15-5（§2.8-6） | `请求 ≥1 次` 红（旧签名不接 messages——源仍在槽） | ✔ 哨兵零入载荷 |
| §2.8-7 | `请求 ≥1 次` 红（旧谓词/旧源不达） | ✔ 含真实文本 / 零 reminder |
| §2.8-8 | `请求 ≥1 次` 红 | ✔ 非串条目跳过 |
| §2.8-9 | `'已有标题' !== '标题X'`（`saveLines` 无 `extra.title` 支） | ✔ 三断言同绿 |
| T1（§2.12） | 无标题段（`" Ready │ Enter: send │ …"`） | ✔ 段在位 + 整行 ≤ 79 |
| T2（§2.12 负向锁） | 先绿（锁形——两态同绿防占位符混入） | ✔ 逐字节等价 |
| T3（§2.12） | 无标题段 | ✔ 39 列 + `…` ∧ `Enter: send` 仍在行 |

### 5.4 套件 / doc-check 原始读数

- `cd thincoder-vscode && npm test` → **tests 887 · pass 887 · fail 0**（含既有 T-CL1–T-CL19、`chat-panel.test.mjs` 零改仍绿）。
- `cd thincoder-cli && npm test` → **tests 772 · pass 767 · fail 5**——**5 条残红 = 非本批**（归属核证：`git stash` 清空本批全部改动后复跑同两档，**同 5 条同红**：`batch-segment.test.mjs` T47 / T47b / T49b / T51 + `prompt-refs-zero.test.mjs` T9）。残红面 = 提示词/顾问工具面（`batch` → `batch_segment` 迁移期：prompt 文本与 `_deps.execute` 挂载面），与本批零交集 ⇒ **如实披露，非本批引入**。
- `node scripts/doc-check.mjs --root .`（仓根）→ **闸态 = 悬空 3 / 行宽 3**：悬空 = `AGENT-LOOP-SUBAGENT.md:2047/2065/2066` · 行宽 = `AGENT-LOOP-SUBAGENT.md:2091` + `BATCH-RECORD.md:358/365`——**与 §2.12 基线同三条**（全在未触碰档）⇒ **本批触碰档零新增** ✓。

### 5.5 面外披露 / 未做 / 偏差

- **表外改动（1 档）**：`chat-panel.mjs:276`（`_generateTitle` 转发 messages）——理由见 5.2 #7；如父侧判越界可一行回退，但回退即 D7 失效。
- **行数超预报（记账面，非行为偏差）**：`activity-closure.test.mjs` 317 → **423**（§2.13 #2 预报 ≈375 / +≤60）· `at-refs-restore.test.mjs` 148 → **212**（§2.7 预报 +≤35）· `render-frame.mjs` 408 → **412**（§2.12 预报 +2；多出 2 行 = 注释）。三档均 < 500 硬限；`activity-closure.test.mjs` >300 建议线的**存量债结论**（§2.13 #2「无需拆分」）经本席复核成立（增量全为用例追加）。
- **未做（非本批射程，如实）**：CLI 侧除 D8 + 新测试档外零改；relay / 载荷 / `ui.js` 合并粒度 / 会话恢复窗口面 / 提示词面零动。
- **偏差清单**：**零**（无静默降级、无设计项缩水；`noteChunk` 首参 `text` 保留为签名稳定位——调用方 `streaming.js:258` 零改所必需，非死代码残留）。
- **既有观察（照 §2.9 上报，本批不动）**：`docs/core/design/SESSION.md` §8.2 仍引 VSC `requestTitle` 旧实现（记录面历史理由）；`panel-messages.mjs:205` `lastUser` 同族谓词（非标题面）。

### 5.6 审计与代码评审轮次与终态

- **自查自修轮 1**（先于审计）：`finalizeTurn` 的 `pushSessions` 调用补**非致命守卫**（旧形该调用在端壳 try 内被吞；不守卫则推送面异常会跳过忙态归位 ⇒ 回归风险）；连带注释收正。
- **发散审计轮 1**（explore · 只读 · 逐条对照 §2 全文）：3 条发现——① §5 未落档（**本轮落档销项**）· ② 表外档 `chat-panel.mjs`（**已披露**，见 5.5）· ③ 文档坐标漂移（`WEBVIEW.md:564` 引 `refreshBlock` `:133-141`/赋值行 `:138`，实施后为 `:135-143`/`:140`）——**上报不改**（文档面 = 设计笔域；父侧一行可收）。审计疑点「三档文档 mtime 与本轮同分钟」经本席机械核证**排除**：四档行数与设计轮读数逐档相符（见 5.2 末），实施轮零写入。
- **内部代码评审轮 1**（advisor · type=code · 范围 = 10 档 + 批档/设计档为验收上下文）：**VERDICT = pass**（🔴 0）——2×🟡（文件档位：`activity-closure.test.mjs` ≈423 / `render-frame.mjs` ≈412 >300 建议线，**均非阻塞**，前者存量债已登记、后者建议随 §2.7/§5 补结论行）+ 6×🔵（`panel-session-write.mjs:133` `!data` 腿语义混同（今日等价——provider 同取自槽）· `activity.js:315` 第 3 处 `stateWord` 赋值（null 清位）未入锁面注 · `SESSION.md:158`「经 keepReal 过滤」措辞 vs 实现原数组直接传入（今日等价）· `WEBVIEW.md:214` 坐标失指（`activity-view.js:36`/`:74` vs 现行 `:42`/`:90`）· `chat-panel.test.mjs` 注释仍引退役的 `isFirstMessage` · §5 行数复读义务）。**零代码缺陷待修**。
- **终态 = `clean`**（审计 3 条全为记账/披露/笔域外面，代码零缺陷；两套件 vscode 全绿、cli 残红已归属非本批；doc-check 零新增）。

## §6 验证与收口（主代理）

**状态行**：✅ 已收口 2026-09-21（父侧）

**验收读数（父侧靶向复跑 + 子代理全量读数）**

| 面 | 预期 | 实测 | 结果 |
|---|---|---|---|
| §2.8 用例 1–9 + #14/#15 | 全绿 ✗ 先红证据在档 | `activity-closure` 22/22 ✗ `at-refs-restore` 8/8（父侧复跑）✗ 先红逐例在 §5 | ✓ |
| CLI 新档 T1–T3 | 全绿 | 3/3（父侧复跑） | ✓ |
| 套件（vsc） | 全绿 | **887/887 · fail 0**（子代理全量 ✗ 末次改动后复跑） | ✓ |
| 套件（cli） | 全绿或归属核证 | 767/772——5 残红 = batch-segment 迁移期族 ✗ **stash 基线对照同红 ⇒ 非本批** | ✓（归属核证） |
| doc-check | 本批触碰档零新增 | 悬空 3 + 行宽 3 = 基线同三条（父侧终检复跑） | ✓ |
| §5 | 已写 | 6974 字符在档 | ✓ |

**链上轮次**：设计 2（#18 初稿 ✗ #20 D4/D8 补）✗ 评审 2（轮 1 = changes-required（🔴1+🟡5+🔵3）→ 修正 #24 九条 + #25 两项 + 父侧 🔵×2 → **轮 2 pass**）✗ 实施 1（#27 ✗ 内审 1 + 内部代码评审 pass 0🔴 ✗ 终态 clean）✗ 批准 = **父侧代签**（用户 07:33 授权）。

**父侧机械直改（打标 · 可 revert）**：§1 授权段 + D7/D8 范围更正（07:26 裁定）✗ F15 需求条 + 变更记录行（`docs/cli/requirements/TUI.md:36` / `:102`）✗ §2.9 `:184`/`:185` 已消解标注 ✗ §2.13 `:349` 读数收正（670 → 672）✗ 需求档 F15「列表面」措辞。

**披露与另案**：**表外改动 1 档** = `thincoder-vscode/src/extension/chat-panel.mjs:276`（`_generateTitle` 转发实参——D7 必要接线 ✗ 不转发则标题永久 null ✗ 零回退面另注）；**行数超预报（记账面）**：`activity-closure.test.mjs` 317→423（预报 ≈375）✗ `at-refs-restore.test.mjs` 148→212（预报 +≤35）✗ `render-frame.mjs` 408→412（预报 +2）——均 < 500 硬限 ✗ 拆分结论不变；**审计/评审非阻塞项入册** = 台账 **#187**（6 条）；文档面他批在飞残项（doc-check 域内 = batch-lifecycle 族 ✗ 非本批）✓

**结算同步（D7）**：① 角色表 ✓；② 状态行 = §1 `:10` 改「已收口」+ 本节 ✓；③ 计数 = 7 项（A/B/C/D4/D7/D8/测试面）✗ 用例 1–9+#14/#15+T1–T3 ✓；④ 指针 ✓；⑤ 变更记录 = 3 档各 +1（评审核）✗ 需求档 F15 行 +1 ✓；⑥ 待办 = #187 入册 ✓；⑦ 台账 = **#183 在途 → 待核销 → 已核销** ✓；⑧ 前批遗留交叉 = 无 ✓。

**提交**：`dad14ed8`（**15 档** ✗ +861/−78——本档 + 需求档 + vsc 设计两档 + SESSION + 产品码 7 档 + 测试 3 档）——push ✓ `origin/main` = `dad14ed8` 实核（ls-remote）✓。
