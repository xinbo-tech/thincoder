# 批次档 · 2026-09-21 · plan 模式批准语义文本收正（plan-approval-texts）

> 前情 = **#154 深层分析**（2026-09-21 21:2x 交付 ✗ 台账 #154 ✗ 用户 21:18「那修掉吧」= 修法① 放行 ✓）。
> 触发：plan 工具三处文本**批准语义互斥** ✗ 退出句「You may now edit files and run commands」= 写前最后读到的放行文本 ✗ 且 `PLAN_EXIT_REMINDER`「Start implementing your plan … No need for … further confirmation」同向放行 ✓（loading 绕过案 #154 的**判据模糊根**之一 ✗ 铁证见 §1 证据）。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」+ 21:18「那修掉吧」）**；自缚照旧（代签三条件 ✓ 新范围/口径裁决停下不代签 ✓ 射程 = 本批收口 ✓）。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（2026-09-21）

**模块目标（一句话）**：plan 模式的**批准语义**在**普通模式**下三处文本一致——退出不再自我放行 ✗ 呈计划 ⇒ **待用户明确批准才写** ✓（工程模式已因 #155 排除 plan ✗ 本批不动工程模式机制 ✓）。

**证据（事发链第一手 ✓ 详见台账 #154）**：进入句「Present your plan to the user **for approval** before writing any code」（`plan.mjs:118` ✓）· 常驻提醒「call plan with action=&apos;exit&apos; **for user approval**」（`:18-19` ✓）· **退出句「Plan mode exited. You may now edit files and run commands.」**（`:109` ✗）＋ **退出排队提醒「Start implementing your plan — edit files, run commands. No need for … further confirmation.」**（`:21-23` ✗✗）⇒ 两处放行文本 ✗ 且退出为**模型自服**（无任何用户批准动作 ✓）。

**功能点（逐字文本 = 主 agent 笔 ✗ 已定稿）**

| # | 项 | 逐字（新文本） | 落点 |
|---|---|---|---|
| ① | 退出回执 | `Plan mode exited. Present your plan to the user and wait for their explicit approval before writing any code.` | `thincoder-core/agent-tools/plan.mjs:109`（现「You may now edit files and run commands.」✗）|
| ② | 退出排队提醒 `PLAN_EXIT_REMINDER` | `[System reminder: plan mode is now OFF. Present your plan to the user and wait for their explicit approval before implementing — no need for a task list (the plan already covered that).]` | 同上 `:21-23`（现「Start implementing…No need for…further confirmation.」✗）|
| ③ | 测试逐字断言同步 | 期望串 = ② 新文本逐字 | `thincoder-vscode/test/context-parity.test.mjs:268`（现断言旧句 ✗）|
| ④ | 文档面引用随动（**父侧收口统一处理 ✗ 非 coder**） | 需求档 `ENGINEERING-MODE-V2.md:688` / 设计档 `:341` 的引用句（引旧 `PLAN_EXIT_REMINDER` 文本 ✗）→ 收正为「文本已于 2026-09-21 收正」口径 ✓ | 父侧 ✓ |
| ⑤ | 同档自洽两处（设计轮 #63 上抛 2 并入） | `plan.mjs:4` 档头句：`After the user approves the plan, exit plan mode and start implementing.` → `Exit plan mode to present the plan for the user's approval; implement only after they approve.`；`:44` 注释引文：引旧句「Start implementing your plan …」→ 改引新②句片段（逐字：`Present your plan … wait for their explicit approval …`） | `plan.mjs:4` · `:44` |
| ⑥ | 描述面张力（设计轮 #63 上抛 3 并入 ✗ 模型面文本 ✗ 主 agent 笔） | `plan.mjs:92` 内句：`When the user approves, exit plan mode and implement.` → `Exit plan mode to present the plan for the user's approval; implement only after they approve.`（与修正后顺序一致：exit = 呈计划 ✗ 非实施许可 ✓） | `plan.mjs:92` |

> ⑤⑥ 的文本 = 主 agent 定稿（提示词内容权 ✓）✗ 落点 = coder 笔 ✓；④ 留父侧收口 ✓。

**边界（本批不做）**：不改 plan 机制 / 注册（不注册 / 报错形均已定 ✗ 零改 ✓）✗ 不改工程模式排除面（#155 已闭 ✓）✗ **不改** `:18-19` 常驻提醒与 `:118` 进入句（**已正确 ✗ 零改** ✓）✗ 不新增功能 / 参数 / 命令 ✗ 不动 `context.mjs:257`（已正确 ✓）✗ 表外档 / 需求新条目 ✗ 不改 `.thincoder/tmp/**` 陈旧副本（非产品面 ✓）。

**背景与关联**：本批 = #154 修法① 落地 ✗ 修法②（工程模式排除）= #155 已闭 ✓ ✗ 修法③（主代理直写产品码残余）= 登记接受 ✗ 本批不涉 ✓。

## §2 批次任务（eng-designer）

（待设计。）

**状态行**：✅ 设计就绪（评审发起权在父侧）

**本批覆盖条目**：台账 **#154 修法①**——plan 退出自我放行两处文本收正（用户 2026-09-21 21:18「那修掉吧」批准）= §1 功能点 ① ② ③ **⑤ ⑥**（⑤⑥ 于七 并入）；④ = 父侧收口项（标注，非本批实施面）。逐字文本 = §1 定稿（主 agent 笔，**一字不改**）；本段只落**落点 / 用例 / 判据**。

**一、逐字文本表（照抄 §1；实现判据 = 运行时字符串逐字相等）**

| # | 项 | 逐字（新文本） | 落点（现文） |
|---|---|---|---|
| ① | 退出回执（exit 分支返回串） | `Plan mode exited. Present your plan to the user and wait for their explicit approval before writing any code.` | `thincoder-core/agent-tools/plan.mjs:109`（现「Plan mode exited. You may now edit files and run commands.」） |
| ② | `PLAN_EXIT_REMINDER` 常量 | `[System reminder: plan mode is now OFF. Present your plan to the user and wait for their explicit approval before implementing — no need for a task list (the plan already covered that).]` | `thincoder-core/agent-tools/plan.mjs:21-23`（现「Start implementing…No need for…further confirmation.」） |

**实现注**：① = `:109` 返回串整体替换；② = `:21-23` 常量运行时串整体替换（JSM 拼接形态自由——逐字判据落在**运行时串**上）。
**同批零改（实读已核）**：`:18-19` 常驻提醒（含「for user approval」✓）· `:118` 进入句（「for approval before writing」✓）· `thincoder-core/context.mjs:257` 压缩回注句（「present it for user approval」✓）· `:39` 身份比较谓词 · `:112` 未知 action 报错。
文本自检：①② 两串均不含 `edit files and run commands` ∧ 不含 `further confirmation`。

**二、可机判用例表**

| 用例 | 类型 | 驱动（file:line 实读） | 期望（机判断言） |
|---|---|---|---|
| PT-1 | 正常 | `thincoder-vscode/test/context-parity.test.mjs` T-CI-6 `:266`（exit 调用点——**捕获返回值**） | 返回串 === ①逐字（`assert.equal`） |
| PT-2 | 正常 | 同 T-CI-6 `:268`（**测试同步位**） | `_pendingReminders.at(-1)` === ②逐字（替换现旧串期望；现断言串 = 旧 `PLAN_EXIT_REMINDER` 全文） |
| PT-3 | 正常（防回流·负向） | 同 T-CI-6（① ② 两串） | `!s.includes("edit files and run commands")` ∧ `!s.includes("further confirmation")` |
| PT-4 | 边界（节律归零） | 同 T-CI-6 `:269`（既有断言保留） | `planReminderForTurn(agent, false) === null` |
| PT-5 | 边界（清零 / 恢复面零回归） | `thincoder-core/test/tool-seams-agent.test.mjs:123-147` · `thincoder-cli/test/cmd-eng.test.mjs:160` 起 · `thincoder-cli/test/session-store.test.mjs:384` 起 · `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:224-230` | 四档零改**全绿**——三条常量按**身份**入 `isPlanReminder`（`plan.mjs:39`）⇒ 文本改不破过滤；`tool-seams-agent.test.mjs:140` 的 `/plan mode/` 谓词对新②仍命中（新②含「plan mode is now OFF」） |
| PT-6 | 错误（未知 action） | `planTool.execute({ action: "nope" })`（`plan.mjs:111-113`） | 报错串零改（既有覆盖） |

**落点安排**：PT-1～PT-4 全部落在 T-CI-6 内（**退出文本**的逐字断言位 = 仓内唯一——实读：`.mjs` 面旧串命中仅 `:268`；其余调用点只驱动、不断言文本，见零改核查表）；测试档头计数行（`:2-5`）零改（T-CI-6 扩展不出新用例号）。

**三、受影响文件表（行数 = 2026-09-21 实测 · 口径 = 内容行数、不含文末空行）**

| file | 行数 | 改动面 | 增量 |
|---|---|---|---|
| `thincoder-core/agent-tools/plan.mjs` | 120 | `:21-23` 常量串替换 + `:109` 返回串替换（除文本外零改——`:39` / `:111-113` / `:114-118` 全不动） | ±0（文本替换；拼接线数不变） |
| `thincoder-vscode/test/context-parity.test.mjs` | 360 | `:266` 捕获返回值 + `:268` 期望串换新② + 负向断言（PT-1/2/3） | ≈ +3（→ ≈363；远低于 500 硬限；**300 建议档上**——本批不拆，拆点 = 按用例面分档，触发条件 = 下次实质改动时） |
| `docs/core/design/TOOLS.md` | 756 → 759 | 变更记录（未编号节）落位注一行（指向批档——见四） | 本设计轮**已落** ✓ |

**零改核查表（实读逐档确认「无逐字断言 / 非本批面」）**：

| file | 行数 | 核查结论 |
|---|---|---|
| `thincoder-core/test/tool-seams-agent.test.mjs` | 305 | `:130-131` 真调 exit/enter **产出**提示语（驱动面），但零逐字断言（`:140` 以 `/plan mode/` 谓词过滤）⇒ 零改 |
| `thincoder-cli/test/cmd-eng.test.mjs` | 196 | `:172-173` 同（`:185` 深比只含 unrelated 项）⇒ 零改 |
| `thincoder-cli/test/session-store.test.mjs` | 416 | `:388` 同（`:398` 深比同）⇒ 零改 |
| `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | 500 | `:226` 同（该档处 500 硬限上限——本批零改，亦不触碰上限） |
| `.thincoder/tmp/{core-pkg,core-probe}/**` | — | 陈旧副本、非产品面 ⇒ 零改 |

**四、设计归属落位（勘定 + 最小落位注）**

- **勘定（实读）**：现役设计档**无 plan 工具文本的专属节**——`docs/core/design/TOOLS.md` 的 plan 行（`:77` #85 · `:135` B2）是核统一裁决；`docs/core/design/AGENT-LOOP.md:205` 只列「plan-mode 提醒节流注入」为循环一步（无文本契约）；`docs/core/design/ENGINEERING-MODE-V2.md:341` 是工程模式排除的**引用命中**（父侧收口面）。
- **结论 = 工具对外文本属工具契约面 ⇒ 设计档归属 = `docs/core/design/TOOLS.md`**（工具系统档）；本批只加**最小落位注**（变更记录一行——指向批档、不重述机制 ✓ D2），**已落** `docs/core/design/TOOLS.md:712-713`。
- **备选披露（不采）**：`AGENT-LOOP.md`（提醒节流 = 循环机制，不含工具文本契约）· `ENGINEERING-MODE-V2.md` E7（父侧收口面——`:341` / `:427` 见未决项 4）· `PROMPT-SYSTEM.md`（实读该档面 = `prompts/**` + `tool-docs/*.md` ✗ 无 `plan.md` ⇒ 内联描述不属其面 ✓）。

**五、三链自检（§1 功能点 ↔ 用例 ↔ 判据）**

| §1 功能点 | 判据（可机判） | 用例 |
|---|---|---|
| ① 退出回执逐字 | 返回串 === ① | PT-1 |
| ② `PLAN_EXIT_REMINDER` 逐字 | 栈顶 pending === ② | PT-2 |
| ② 防回流（负向） | 两串不含 `edit files and run commands` / `further confirmation` | PT-3 |
| ③ 测试逐字断言同步 | `context-parity.test.mjs:268` 期望串 = ②逐字（= PT-2 落点） | PT-2 |
| ④ 文档面引用随动 | **父侧收口项**（非本批判据；本批零触需求档 `:688` / 设计档 `:341`） | 标注 |

需求侧链：本批**零新增需求条目**（禁止范围）——需求锚 = 台账 #154；需求档引用句收正 = 父侧 ④。

**六、边界（本批不做）**：不改 plan 机制 / 注册 / 工程模式面（#155 已闭）· 不改 `:18-19` / `:118` / `context.mjs:257`（三处已正确）· 不改 `.thincoder/tmp/**` · 冻结批档 · 需求档 · 不新增功能 / 参数 / 命令 / 需求条目 · 零改核查表所列档一律不触碰（**除七.2 迁入面** `thincoder-core/test/tool-seams-agent.test.mjs` 的新增断言块）。〔父侧收正注：未决项 1–3 原「不做」句 = 七.4 已裁并入本批 ⇒ 该子句作废 ✓ 可 revert〕

**未决项 / 发现（交父侧）**

1. **陈旧引文**：`plan.mjs:44`（`clearPlanMode` 上注）逐字引旧句「Start implementing your plan …」——②改后该引文失效（一行注释修正；入不入本批 = 父侧裁）。
2. **描述面张力**：`plan.mjs:91-92` 工具**描述**句「When the user approves, exit plan mode and implement.」与修正后顺序（exit ⇒ 呈计划 ⇒ 待批准 ⇒ 实施）存在时序口径张力——工具描述 = 模型面文本（提示词内容权 = 主 agent）⇒ 本批零改，登记待裁。
3. **档头同源句**：`plan.mjs:4`「After the user approves the plan, exit plan mode and start implementing.」同 2（注释面）。
4. **陈旧边界句**：`docs/core/design/ENGINEERING-MODE-V2.md:427` + `docs/core/requirements/ENGINEERING-MODE-V2.md:696`「三条 reminder 文本本体不改」——②改后对 `PLAN_EXIT_REMINDER` 失效；父侧 `:341` / `:688` 收口时一并裁定（E7 本批不动）。
5. **doc-check 基线计数不符**：派单基线「悬空 5 / 行宽 3」；实跑（`node scripts/doc-check.mjs`）与之不符——设计轮首读 = 悬空 5 / **行宽 4**（`AGENT-LOOP-SUBAGENT.md:2091` · `BATCH-RECORD.md:358` · `:365` · `requirements/TOOLS.md:193`）、复核读 = 悬空 6 / 行宽 5（并发批在飞漂移——`CONTEXT-COMPACTION.md:558/:559`）。
   **本批触碰档零新增**（`design/TOOLS.md` 仅列报面行、行号随 +3 漂移；批次档按 `checkConfig.anchors.exclude` 不在机检源域）。

**设计轮自检行**：逐字一致（§1 ↔ §2 两串**机核比对**）✓ · 负向断言含 ✓ · 测试同步位点名（`context-parity.test.mjs:268`）✓ · 受影响表 + 用例 + 三链齐 ✓ · 单行 ≤300 字符（非表格行——表格行 = 机检既有豁免 `isTableRow`）✓ · doc-check 触碰档零新增 ✓。

**七、修正轮（2026-09-21 · 微修 · 并入 §1 ⑤⑥——父侧裁定：设计轮 #63 上抛 2 / 3 并入本批 ✓）**

吸收面 = §1 已定稿 **⑤**（`plan.mjs:4` 档头句 + `:44` 注释引文）· **⑥**（`plan.mjs:92` 描述句）——**两处新文本逐字见 §1，本段一字不改**；本段只落 用例 / 落点 / 受影响面 / 零改面。**零新语义**（仅 ⑤⑥ 落位）。

**七.1 用例表增补（承 二）**

| 用例 | 类型 | 驱动（file:line 实读） | 期望（机判断言） |
|---|---|---|---|
| PT-7 | 正常（描述面·正 + 负） | `planTool.description`（`thincoder-core/agent-tools/plan.mjs:91-92`——工具描述面 = 模型面文本，运行时属性） | **含**新句 `Exit plan mode to present the plan for the user's approval; implement only after they approve.`（⑥）∧ **不含**旧句 `When the user approves, exit plan mode and implement` |
| PT-8 | 正常（档头 / 注释面·防回流） | `plan.mjs` **源文**读取（`:4` 档头句 · `:44` 注释引文——注释面非运行时 ⇒ 判据落源文面：`readFileSync(new URL("../agent-tools/plan.mjs", import.meta.url), "utf8")`；`readFileSync` 该档已导入 `:15`） | **不含**旧句 `After the user approves the plan, exit plan mode and start implementing`（⑤ 档头）∧ **不含** `Start implementing your plan`（⑤ 注释引文 + 旧②面残留）∧ 档头注行（行首 ` * `）含 ⑤ 新句 ∧ **注释块含新②引文片段 `Present your plan`**（防「删而不换」——注释行扫描，免钉行号） |

**PT-8 判据串逐字注**：旧句**含 `the plan`**（`After the user approves the plan, exit plan mode and start implementing`——与 §1 ⑤ 引文同形）；机判串须以此为准，缺 `the plan` 的串（`After the user approves, exit plan mode…`）在改前改后**恒不命中** ⇒ 断言恒真（假绿）。

**⑤⑥ 新文本同形（逐字比对 ✓）**：⑤（`:4` / `:44` 落点）与 ⑥（`:92` 落点）新文本 = **同一 94 字符句**（§1 两行引文逐字相等——实读比对）；本段引文即该句，PT-8 正句判据同用该句，未作任何改写。

**落点安排（增补，承 二）**：PT-7 / PT-8 同落 `thincoder-core/test/tool-seams-agent.test.mjs` **新用例块**（插 `:147` 后——T12 / ENG-PLAN-EXCLUSION 段之后、`#96` 段（`:149`）之前）；该档已 `import { planTool }`（`:22`），且为**核侧工具缝本位**。
**备选（不采）**：`context-parity.test.mjs` T-CI-6 内——T-CI-6 用例面 = **节律 / 端壳镜像**（描述面与源文注释面非其对象），且 VSC 侧读核源须经包解析（非相对直连）。

**三链自检增补（续 五）**：⑤ → PT-8 · ⑥ → PT-7（判据 = 上表机判断言）。

**七.2 受影响文件表增补行（承 三 · 行数 = 2026-09-21 实测 · 同口径「内容行数、不含文末空行」）**

| file | 行数 | 改动面 | 增量 |
|---|---|---|---|
| `thincoder-core/agent-tools/plan.mjs` | 120 | **⑤⑥**：`:4` 档头句替换 + `:44` 注释引文改引**新②**示义 + `:92` 描述句替换（行内替换；与 ①② 同档 ⇒ 实施轮一并落地） | ±0（逐行替换，行数不变） |
| `thincoder-core/test/tool-seams-agent.test.mjs` | 305 → ≈320 | 新用例块（PT-7 / PT-8）插 `:147` 后 + 档头记录行 1 行（该档既有惯例：日期 + 批次） | ≈ +15（远低于 500 硬限；**300 建议档上**——本批不拆，拆点 = 按用例族分档，触发条件 = 下次实质改动时） |

**表迁入说明**：`tool-seams-agent.test.mjs` 由上轮**零改表**迁入本表——上轮「零改」结论（其**既有**内容无逐字断言）不变 ✓；本批**新增**断言块 ⇒ 该档整体入受影响面。**该档既有行一律不改。**

**七.3 零改面核对表增补（承 三）**

| 面 | 核查结论 |
|---|---|
| `plan.mjs:92` **描述面其余句**（`Enter or exit plan mode.` · `In plan mode you are restricted to READ-ONLY tools: …` · `Use plan mode before complex multi-step tasks …` · `For simple single-file edits, skip plan mode and just make the change.`） | 零改——⑥ 只替换其中间一句 `When the user approves, exit plan mode and implement.` |
| `plan.mjs` 其余行（`:11-19` 两条 ON 提醒 · `:26-27` 间隔常量 · `:29-36` 拒翻文案 · `:38-39` 谓词 · `:41-49` clearPlanMode 上注除 `:44` · `:50-61` 本体 · `:89-100` 工具元数据 · `:101-119` execute 分支除 `:109`） | 零改 |

**七.4 未决项处置（续 未决项）**：1 / 2 / 3 = 已裁 **并入本批** ⇒ §1 ⑤⑥（文本已定稿）；4 = 父侧收口统一裁定（本批不动）；5 = 基线计数漂移**只报不追**（读数：写前 悬空 **4** / 行宽 **3** ⇒ 写后 悬空 **3** / 行宽 **3**——跨读漂移 = 并发批在飞，非本批）。

**七.5 修正轮记录**：2026-09-21（设计修正轮 · 微修 · eng-designer）——并入 §1 ⑤⑥（#63 上抛 2 / 3 · 父侧裁定并入本批）；增补 PT-7 / PT-8 + 受影响表两行 + 一档迁入 + 零改面两行。**零新语义**。

**修正轮自检行**：⑤⑥ 逐字机核（§2 引文 === §1 两行引文 ✓ 脚本比对）✓ · PT-7 / PT-8 机判断言齐 ✓ · 受影响表（含迁入说明）✓ · 零改面（描述面其余句 + 其余行）✓ · 单行 ≤300（非表格行——本块最长 216）✓ · doc-check 触碰档零新增 ✓（批次档 = `anchors.exclude` 域外；`docs/core/design/TOOLS.md` 门内零新增）。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

**核验结论（重点项 ㊀–㊄ · 逐条实读）**

- **㊀ 逐字文本自洽 / 无放行回流 ✓**：① ② ⑤ ⑥ 新文本实读（批档 `:20-21` · `:24-25` · `:45-46` · `:122`）与修正后顺序一致（exit = 呈计划 ⇒ 待批准 ⇒ 实施）；两串均不含 `edit files and run commands` / `further confirmation`（旧面实读 = `thincoder-core/agent-tools/plan.mjs:22-23` · `:109`）。② 的落点时机经核 = `thincoder-core/agent/post-turn.mjs:27-33`（同一回合末入 history）⇒ 与 ① 同回合读到、不跨用户批准回合，「批准后仍被要求再确认」的逆行不成立。
- **㊁ 用例可机判性 ✓**：PT-1 前提实读成立——`thincoder-vscode/test/context-parity.test.mjs:266` 现值**不捕获**返回值 ⇒ 「捕获」是真实改动且已列；PT-2/PT-4 落点 `:268` / `:269` 实读命中；PT-7 驱动面 = 运行时 `planTool.description`（`plan.mjs:91-92`，核内联描述，无第二描述面——`thincoder-core/tool-docs/` 24 档无 `plan.md`）；PT-8 前提实读成立（`thincoder-core/test/tool-seams-agent.test.mjs:15` `readFileSync` 已导入 · `:22` `planTool` 已导入 · 插入位 `:147` 与 `:149` 之间确为空档 · `../agent-tools/plan.mjs` 相对路径正确）。
- **㊂ 零回归面完备 ✓**：旧串全仓实读命中仅 `plan.mjs:22` · `:44` · `:109` + `context-parity.test.mjs:268`（余为文档面与 `.thincoder/tmp/**` 陈旧副本）；PT-5 四档逐档实核——`tool-seams-agent.test.mjs:140` 的 `/plan mode/` 谓词对含「plan mode is now OFF」的新②仍命中；`thincoder-cli/test/cmd-eng.test.mjs:185` · `thincoder-cli/test/session-store.test.mjs:398` · `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:229` 的深比期望值仅含 unrelated 项（exit 提示语经 `plan.mjs:39` **身份**过滤被摘除 ⇒ 与文本无关）。
- **㊃ 其余行零改 / 工程模式面无干涉 ✓**：改动面 = `:4` · `:21-23` · `:44` · `:92` · `:109`；清零点 = 身份比较（`plan.mjs:39`）⇒ eng 面无子串耦合；`thincoder-core/context.mjs:257` 实读为「present it for user approval」（确属已正确零改面）。
- **㊄ §1 ↔ §2 逐字一致 ✓**：① ② 两串两处引文同形；⑤⑥ = 同一句（逐字数校验 **94** 字符，与自报同）；受影响表行数实测一致（`plan.mjs` 120 · `context-parity.test.mjs` 360〔读工具显示 361 = 项目已登记的 ±1 计法差〕· `TOOLS.md` 759〔756 → 759 = 条目 2 行 + 空行 1〕）。
- **附带核验**：`thincoder-vscode/node_modules/@thincoder/core` = 指向本仓核的链接（内含 0.9.2 且带 #155 的 `clearPlanMode` / `PLAN_ENGINEERING_REFUSED`）⇒ PT-1/PT-2 在 VSC 包内可读到改写后的核源，无「装包副本不随动」阻塞。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene | 🟡 | §2 六「边界」在并入 ⑤⑥ 后未收正：`:101` 仍写「不做未决项 1–3（注释 / 描述 / 档头措辞）」与「零改核查表所列档一律不触碰」，而 `:150`（七.4）裁定 1/2/3 并入本批、`:141`（七.2 迁入说明）把 `tool-seams-agent.test.mjs` 自零改表移入受影响表；`:39`「本批覆盖条目 = ① ② ③」同为前轮口径。同一段内新旧口径并存于**边界（规范面）** | 把该两子句与 `:39` 改为并入后口径（或就地标注「以 七 为准」），前轮口径只留七.5 记录面 |
| 2 | File-size annotations | 🟡 | 受影响表两档被测档均已越 300 建议档：`context-parity.test.mjs` 360 → ≈363（`:70`）、`tool-seams-agent.test.mjs` 305 → ≈320（`:139`）——两行只给「远低于 500 硬限」口径，无 300 档拆分评审结论（拆点 / 触发条件 / 明示不拆的理由） | 两行各补一句 300 档拆分评审结论，与 500 硬限注并列（先例：拆点 + 触发条件登记形态） |
| 3 | Acceptance | 🟡 | ⑤ 含两落点（档头句 + `:44` 引文），但 PT-8（`:123`）的正向判据「注释行（行首 ` * `）含 ⑤ 新句」可由 `:4` 单独满足 ⇒ `:44` 若被执行为**删除引文**（而非「改引新②句示义」）仍全绿；且 §2 未给 `:44` 的替换文本（§1 ⑤ 只给「示义」） | 补一条正向机判（注释块内出现新②文本片段 / 引文行在场），并把 `:44` 的替换文本定稿到逐字或给出可判锚 |
| 4 | Doc-state | 🟡 | 收口面滞后件已登记（④ / 未决项 4）但未与实施同窗绑定：`docs/core/design/ENGINEERING-MODE-V2.md:427` 与 `docs/core/requirements/ENGINEERING-MODE-V2.md:696`「三条 reminder 文本本体不改」、`:341` / `:688` 的旧文本引文，在 ② 落地当刻即失真 | 把 ④ 与未决项 4 写成本批同一收口动作（列明四行坐标 + 收正口径），避免「批已收口、设计/需求档仍说不改」的窗口 |
| 5 | Clarity | 🔵 | `docs/core/design/TOOLS.md:712-713` 变更记录条目记「两处（`plan.mjs:21` · `:109`）」，与并入 ⑤⑥ 后的五点面（`:4` · `:21-23` · `:44` · `:92` · `:109`）不一致；§2 三（`:71`）「§4 变更记录」节号指称与该档实际结构不符（§4 = 对外契约影响；变更记录在 `:710` 未编号） | 该条改为五点面口径（或注明修正轮增量）；节号改「变更记录」而不引 §4 |
| 6 | Clarity | 🔵 | 七.3 零改枚举的相邻闭合行未覆盖（`:50-60` 对 clearPlanMode `:50-61`、`:101-118` 对 execute 分支 `:101-119`）——改动面命名（`:4` · `:21-23` · `:44` · `:92` · `:109`）本身无缺口，仅逐行核对易误读 | 区间写成含闭合行，或去边界精度只留「其余行零改」断言 |
| 7 | Doc ownership | 🔵 | 归属勘定（`:85-87`）披露的备选不含 `PROMPT-SYSTEM.md`，而 `TOOLS.md:21` 自述「工具描述文本的行本体住 `PROMPT-SYSTEM.md`」；实读该档面 = `prompts/**` + `tool-docs/*.md`（无 `plan.md`）⇒ 判「不属该面」正确 | 备选披露补一行 `PROMPT-SYSTEM.md`（理由 = ⑥ 为内联描述、非 md 描述档），使勘定可复核 |

**计数**：🔴 0 · 🟡 4 · 🔵 3（发现 7 条）；另 out-of-scope 注 1 条（无严重度）：`eng` 工具退出回执 `You may edit files directly`（逐字在档 `thincoder-core/test/tool-seams-agent.test.mjs:96`·`:107`·`:114`）与 plan 退出回执同形，但属工程模式面（本批边界外）——仅登记族位，不判缺陷。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」+ 21:18「那修掉吧」✗ 三条件齐备）**：

- 依据 ① **评审链全清**：轮 1（评审 id=66）= **pass**（🔴 0 · 🟡 4 · 🔵 3 ✗ 7 条发现 ✓）；
- 依据 ② **落点核验（父侧实读）**：① ② ⑤ ⑥ 逐字（§1 ↔ §2 字节比对 ✓ ⑤⑥ 同句 94 字符 ✓）✗ PT-1 前提确成立（`:266` 现值未捕获返回值 ✗ 属真改动 ✓）✗ `:268`/`:269` 命中 ✓ ✗ PT-8 前提全成立（`:15` `readFileSync` ✗ `:22` `planTool` ✗ `:147` 插入位 ✓）✗ 旧串全仓实读仅 `plan.mjs:22/:44/:109` + `context-parity.test.mjs:268` ✓ ✗ PT-5 四档深比与文本无关（身份过滤 `plan.mjs:39` ✓）✗ 受影响表行数实测一致（120 / 360 / 759 ✓）✗ ② 注入时机 = `thincoder-core/agent/post-turn.mjs:27-33`（同回合末落地 ⇒ 无「批准后逆行」✓）；
- 依据 ③ **token 已签发**（✗ 值不落档）；
- **裁定表（轮 1 七条 → 五 Fixed + 两 Deferred〔绑定本批 §6 收口〕）**：1🟡 §2 六 边界陈旧（未决项 1–3 已并入 ✗ 行仍写「不做」）→ **Fixed**（`:39` / `:101` / `:141` 收正 ✗ 标注可 revert ✓）2🟡 300 档拆分评审注缺 → **Fixed**（`:70` / `:139` 各补一行「300 建议档上 ✗ 本批不拆 + 拆点 + 触发条件」✓）3🟡 ⑤ 的 `:44` 面「删而不换」可假绿 → **Fixed**（§1 ⑤ 补逐字引文（`:24` ✓）+ PT-8 补注释块正向判据（`:123` ✓））4🟡 收口面滞后件（设计档 `:427`/`:341` ✗ 需求档 `:696`/`:688`）→ **Deferred〔收口绑定〕**（收正须在实施落地之后 ✗ 否则档述未落状态 ✓ 归 §6 同窗）5🔵 TOOLS.md 条目口径「两处」+ 节号 → **Deferred〔收口绑定〕**（随实态在 §6 一并刷新 ✓）6🔵 零改枚举闭合行 → **Fixed**（`:148` 区间收正 ✓）7🔵 归属勘定备选披露 → **Fixed**（`:87` 补 `PROMPT-SYSTEM.md` 备选 ✓）；
- **实施派发**：eng-coder #67（3 档：`thincoder-core/agent-tools/plan.mjs` ✗ `thincoder-vscode/test/context-parity.test.mjs` ✗ `thincoder-core/test/tool-seams-agent.test.mjs` ✗ PT-1–PT-8 ✓）。

## §5 实施记录（eng-coder）

（本段取代占位行 ✓ 实施终态 clean ✓）

**状态行**：✅ 实施完成（2026-09-21 · eng-coder）

**交付摘要（3 档 = §2 三/七.2 受影响面 · ① ② ⑤ ⑥ 全落）**

| # | 文件 | 落点 | 改法 |
|---|---|---|---|
| ① | `thincoder-core/agent-tools/plan.mjs` | `:109` | 退出回执返回串整体替换（逐字 = §1 ①） |
| ② | 同上 | `:21-23` | `PLAN_EXIT_REMINDER` 运行时串整体替换（拼接保持 2 行片段；运行时串逐字 = §1 ②） |
| ⑤ | 同上 | `:4` · `:44` | 档头句替换为定稿句；`:44` 注释引文改引新②片段「Present your plan … wait for their explicit approval …」 |
| ⑥ | 同上 | `:92` | 描述面中间句替换（与 ⑤ 同一 94 字符句） |
| ③ | `thincoder-vscode/test/context-parity.test.mjs` | `:266` · `:268` · `:270-271` | T-CI-6 内：捕获返回值（PT-1）+ 回执句逐字断言 + pending 期望串换新②（PT-2）+ 两串负向断言（PT-3）；`:272` 既有断言保留（PT-4） |
| ⑦ | `thincoder-core/test/tool-seams-agent.test.mjs` | `:10` · `:150-165` | 档头记录行 1 行；新用例块 PT-7（描述面 正 + 负）/ PT-8（源文面防回流 · 含注释块正向判据） |

**读数（命令 + 原文）**

- PT-1–PT-4：`cd thincoder-vscode && node --test test/context-parity.test.mjs` → `tests 13 · pass 13 · fail 0`（T-CI-6 ✔）
- PT-7 / PT-8：`cd thincoder-core && node --test test/tool-seams-agent.test.mjs` → `tests 11 · pass 11 · fail 0`（PT-7 ✔ · PT-8 ✔）
- PT-5 四档（零改）：`tool-seams-agent` 11/11 ✔ · `cmd-eng.test.mjs` + `session-store.test.mjs` 合跑 24/24 ✔ · `agent-lifecycle-singleton.test.mjs` 15/15 ✔
- 全量两包：`cd thincoder-core && node test/run.mjs` → `tests 522 · pass 522 · fail 0`；`cd thincoder-vscode && npm test` → `tests 908 · pass 908 · fail 0`
- 逐字机核（§1 引文 ↔ 运行时/源文串，脚本比对）：① ② ⑤ ⑥ 全等 ✓（⑤ = ⑥ 同一 94 字符句；U+2014 / U+2026 / ASCII 撇号实证 ✓）
- PT-6：驱动探针读数 = `Error: unknown action "nope". Use "enter" or "exit".`（与 `:112` 现状串逐字同；`:112` 不在 diff 内 ⇒ 零改成立）
- `node scripts/doc-check.mjs`：写前 悬空 3 / 行宽 3 ⇒ 写后 悬空 3 / 行宽 3（触碰档零新增 ✓）
- 行数（内容行 · 不含文末空行）：`plan.mjs` **120**（±0 ✓）· `context-parity.test.mjs` **363**（§2 ≈363 ✓）· `tool-seams-agent.test.mjs` **322**（§2 估 ≈320，+2 估值差）
- 旧串残留：产品码面 **0**（余下命中 = 负向判据串本体，属 PT-3 / PT-7 / PT-8 断言）；文档面 = 父侧收口项 ④（本批零触）；`.thincoder/tmp/**` 陈旧副本零触

**决策透明表**

| 决策 | 依据 | 处置 |
|---|---|---|
| `PLAN_EXIT_REMINDER` 拼接断点 = 「…to the user 」+「and wait…」 | §2 一「JSM 拼接形态自由 ✗ 判据落运行时串」 | 3 行形态保持 ⇒ `plan.mjs` 行数 ±0 |
| 断言消息不携 PT-x 编号 | 项目测试档惯例（中文描述式消息）；PT-x 为本批档内编号，仓内解析不到 | PT ↔ file:line 映射落本节与交付报告 |
| 新块尾部补 1 空行 | 读回发现插入吞掉 `#96` 段前分隔空行（段式排版惯例） | 自纠（+1 行 ⇒ 322）；代码语义零改 |
| PT-6 不新增断言 | §2 二 PT-6 期望栏 = 「既有覆盖」⇒ 设计面未授权新断言；派单「按 §2 逐表落」 | 以探针读数作零改证 + 前提不实上报父侧（见偏差 1） |
| 未动 `docs/core/design/TOOLS.md` 变更记录行 | 该档 = 设计轮已落 ✓ 非 coder 面（评审 5🔵 Deferred 归 §6） | 仅上报口径差（见偏差 2） |

**审计与代码评审轮次与终态**

- **explore 背离审计**（1 轮 · 只读 · 阻塞）：终态 **DEVIATIONS = 1**——PT-6「既有覆盖」设计前提不实（判据缺口）；逐字面 / 零改面 / 表外改动面 / 文档漂移面**全部符合**。
- **advisor 代码评审**（round 1 = full · 同步）：**VERDICT: pass**；发现 4 条（🟡×3 + 🔵×1），**零 🔴 · 零 must-fix**——1🟡 PT-6 前提不实（只报不阻 · 归父侧收口）· 2🟡/3🟡 两被测档越 300 建议档（批档 `:70`/`:139` 已裁「本批不拆」，不重开）· 4🔵 受影响表估值偏低 2 行。
- **fix round**：**1**（自纠 · 格式面：补 `#96` 段前分隔空行）；审计与评审**零 must-fix** ⇒ 无需语义修复轮。
- **终态**：`clean`。

**偏差 / 未决（交父侧）**

1. **PT-6 设计前提不实**：§2 二 PT-6 期望栏「报错串零改（**既有覆盖**）」——实读全仓测试零覆盖 plan 未知 action（唯一 unknown-action 覆盖属 context / batch / memory 工具；全仓 `Use "enter" or "exit"` 仅命中 `plan.mjs:112` 与 `.thincoder/tmp/**`）。代码侧零改已证（`:112` 未动 + 探针读数）；本席未擅加断言（设计面未授权）。建议 §6 二选一：口径收正为「源文逐字零改（实读核）」，或补一条未知 action 断言。
2. **TOOLS.md 口径滞后**（评审 5🔵 · §4 已 Deferred）：`docs/core/design/TOOLS.md:713` 记「两处（`:21` · `:109`）」≠ 落地五点面（`:4` · `:21-23` · `:44` · `:92` · `:109`）——归 §6 随实态刷新。
3. **受影响表估值差**（评审 🔵）：`tool-seams-agent.test.mjs` 预测 ≈320、实测 322（内容行）；`plan.mjs` 120 ✓、`context-parity.test.mjs` ≈363 ✓ 一致。
4. **④ 文档面**（设计档 `:341`/`:427` · 需求档 `:688`/`:696` 旧句引用 + 「三条 reminder 文本本体不改」）本批零触 ⇒ 父侧收口。
5. **约定脚本实位**：`thincoder-cli/AGENTS.md` 所述 `scripts/doc-impact.mjs` 实位 = `thincoder-cli/scripts/doc-impact.mjs`（非仓根）；本席补跑 `--base HEAD` 读数命中 2 档（`docs/batches/2026-09-13-TWO-REPO-MERGE.md` · `docs/design/TWO-REPO-MERGE.md`），命中符号均为泛用符号（AGENT / HEAD / `context-parity.test.mjs` / `readFileSync`）且变更面含并发批在飞的 13 档 ⇒ 对本批「零新增建议」。

**实施轮自检行**：① ② ⑤ ⑥ 逐字机核 ✓ · PT-1–PT-8 逐条读数齐 ✓ · 四档零改实跑 ✓ · `plan.mjs` 120 保持 ✓ · doc-check 零新增 ✓ · 旧串产品面 0 ✓ · 表外档零触（3 档 = 设计受影响面）✓ · 审计 1 轮 + 评审 1 轮（pass · 零 must-fix）✓

## §6 验证与收口（主代理）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 ✗ 父侧抽跑 13/13 + 11/11 绿 ✗ 台账 #154 已核销；记录冻结）

**交付核验（父侧独立复核 ✗ 非采信自报）**：
- 逐点实读（`plan.mjs`）：四处旧句**产品码全无**（`You may now edit files and run commands` ✗ `Start implementing your plan` ✗ `When the user approves, exit plan mode and implement` ✗ `After the user approves the plan, exit plan mode and start implementing` ✓）✗ 三处新句在场 ✓ ✗ `plan.mjs` 行数 = **120** 严格保持 ✓
- 用例：父侧实跑 `context-parity.test.mjs` **13/13** ✗ `tool-seams-agent.test.mjs` **11/11** ✓（子代理读数：核 **522/522** ✗ VSC **908/908** ✗ PT-5 四档 24/24 + 15/15 + 11/11 ✓）
- 机检：doc-check 写前 = 写后 **悬空 3 / 行宽 3** ✓ ✗ 旧串产品码残留 = 0 ✓（余下命中 = 两测试档负向判据串本体 ✓ 文档面 ④ ✓ `.thincoder/tmp/**` 陈旧副本 ✓）

**上抛处置（5 条 → 全闭）**：
1. **PT-6 前提不实**（设计写「既有覆盖」✗ 实读全仓零覆盖 ✓）→ **口径收正 = 源文逐字零改**（父侧实读核 ✗ `:112` 不在 diff ✓）；补覆盖 → 台账 **#210**（归批 ✓）
2. **TOOLS.md 条目「两处」** → **Fixed**（刷新为五点面 `:4` · `:21-23` · `:44` · `:92` · `:109` ✓）
3. **受影响表估值差**（`tool-seams-agent` 实测 **322** vs 估 ≈320）→ 登记 ✓（注释密度类 ✗ 零实质差 ✓）
4. **§5 占位行** → 已清 ✓
5. **评审轮 1 Deferred 两条** → **Fixed**（四处滞后引句 = 设计档 `:341`/`:427` + 需求档 `:688`/`:696` 收正 ✓ 条目口径 ✓ 本收口轮 ✓）

**核销**：台账 **#154** = 已核销 ✓（修法① 落地 ✓ 修法② #155 已闭 ✓ 修法③ 登记接受 ✓）

**提交**：见 errata 行（本收口轮提交推送 ✓）。
