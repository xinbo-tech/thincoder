# 2026-10-09 · stale-fixes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 台账挂账「收正类」清理（轻通道轮）——用户 2026-10-09 14:02 令「该收正的先处理了」；核验清单与逐笔收正见 §1。
> 台账 = #1131（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 轮次性质与授权（父侧）

**性质** = 轻通道轮（`docs/core/design/LIGHT-CHANNEL.md`）——台账「收正类」挂账清理（注释陈旧 ∥ 坐标死指针 ∥ 死码死导入 ∥ 文案半句）：逐笔「直改 → 走查 → 定版」；收尾一次全链（设计形式化 → 独立评审 → 修复 → 批准 → 收口核销）。

**授权** = 用户 2026-10-09 14:02「该收正的先处理了」。路由 = 轻通道三样清单 ②（缺陷修复——实现与出处相抵，回出处非新增语义），逐笔交底（交底即行 ∥ 可 revert ∥ 用户一票改判）。

**面别口径**：doc 类（`*.md` 非 src 段——含 `docs/**` ∥ `thincoder-core/prompts|tool-docs/**`）= 父侧直改；code 类（`.mjs`/`.js`/`.css`）受工程模式**父侧门**（`thincoder-core/agent/dispatch.mjs:94`——无活设计槽拒 code 类写；豁免 = doc/temp/aux 类）——逐笔实试，被拒项转收尾修复面或另册。

**候选清册（核验 24 项）**：#946 ∥ #1040 ∥ #1044 ∥ #809 ∥ #1070 ∥ #1086 ∥ #1079 ∥ #1066 ∥ #1074 ∥ #1075 ∥ #1083 ∥ #1091 ∥ #1105 ∥ #1115 ∥ #1116 ∥ #1117 ∥ #1118 ∥ #1119 ∥ #1123 ∥ #1124 ∥ #1078 ∥ #931 ∥ #1099 ∥ #1110（核验三分：仍陈旧 ⇒ 收正；已修 ⇒ 追认核销；前提失 ⇒ 撤回）。

**逐笔收录形**（下各条）：交底句 ∥ 改动（`file:line`）∥ 走查读数 ∥ 台账行。

### 1.2 逐笔收录（父侧）

**闸测（面别口径实证）**：`#1118`（`thincoder-core/agent/write-gate.mjs:135` 注释收正）试笔 = **父侧门拒**——拒文「classified as product code by the default conventions (code paths: src)」⇒ code 类（`.mjs`/`.js`/`.css`）父侧直改全阻（无活设计槽）⇒ **code 类收正项统一转收尾链修复面**（§2 形式化 → 评审发槽 → 修复步落；§6 收录）。

**笔 1（#1117）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `thincoder-core/tool-docs/subagent.md:18` coder 角色行补「Normal mode: may optionally carry `batchDoc`——绑 §5 记录通道（未绑 ⇒ 主 agent 代录）；传则须可读」半句（对齐 `subagent.mjs:151` 参数描述）｜走查 = 编辑回执含改后上下文（L18）｜台账 = #1117（随收口销）。

**笔 2（#1119）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `docs/core/design/prompts/common.md:134` 补「相对路径先按会话 cwd 解析，其次候选项目根——或绝对」括注（对齐 EN 面 `thincoder-core/prompts/common.md:179`——CN 正本补正）｜走查 = 编辑回执含改后上下文（L134）｜台账 = #1119（随收口销）。

### 1.3 逐笔收录（续 · 父侧）

**笔 3（#1105）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = ① `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:40`·`:73` 写门锚 `dispatch.mjs:196` → `:95`；② `docs/core/design/TOOLS.md:920` 表行 2 `:198` → `:97`（父侧门消费点）、`:921` 行 3 `:229` → `:139`（冻结窗消费点）；③ `TOOLS.md:919` 行 1 `dispatch.mjs:126` → `dispatch-run.mjs:82`·`:136`（`noteExecutedMutation` 双调用点——随 09-28 拆档迁出，grep 实证）｜走查 = 三处编辑回执在位。旁记：a) 悬空 2 不复现（doc-check 现跑全绿——`MANIFEST.md:603` ∥ `TOOLS.md:530` 两锚实读全对）；b) 同表 4–6 行探读疑漂移 → 新行 #1132 归批复核；c) doc-check 行数面 4 条 diff（他流在编）未动。｜台账 = #1105 + #1132。

**笔 4（#1124）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `ACCOUNTS.md:45`·`:112`·`:138` 三处「拟新增」翻正（`:112` 行附行数实读 109——`thincoder-server/src/accounts/audit.mjs`，首版完备化批落地后首读）｜走查 = 三处编辑回执在位。｜台账 = #1124（随收口销）。

**笔 5（#1123）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `WEBUI.md:490-517` 十行「拟新增——结构轮」→「已落盘」+ 行数实读回填（dom 118 ∥ health 62 ∥ zh-shell 73 ∥ zh-me 68 ∥ zh-admin 137 ∥ zh-system 122 ∥ en-shell 71 ∥ en-me 69 ∥ en-admin 141 ∥ en-system 122——`readFileSync` 计数）｜走查 = 编辑批回执 10/10 命中在位。｜台账 = #1123（随收口销）。

### 1.4 逐笔收录（slot-42 接手 · 2026-10-09 16:1x）

（前情：slot-48 于 14:30 因整机内存事件中断；用户 16:12 令「把没完成的任务跑完」——本会话接手，续办清册剩余 18 项与收口链。）

**已核「已修 ⇒ 追认核销」两枚**（实读）：
- **#1075**（API-CONTRACT.md 生成区重刷）：现盘 `docs/core/design/API-CONTRACT.md:2686` = `HEALTH_POLL_MS | thincoder-server/public/health.mjs:12`（原陈旧锚 `:2626` 随他流重刷落定）⇒ 待收口追认核销。
- **#1040** 死码半（`_delKey`）：`thincoder-vscode` 源码全树零命中（仅历史 tmp 日志留痕）⇒ 已清（2026-10-08 代理批）；「仅删钥入口」半 = 归档决策在案 ⇒ 待收口追认核销。

**笔 6（#1070 ∥ #1086）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `docs/vsc/design/SETTINGS.md` §2.10/§2.11 残余坐标 15 处随正至现盘（卡 HTML 载体 `:182`/`:123`/`:132 ⇒ `:137`（`:207` ∥ `:277` ∥ `:286` ∥ `:639`）∥ 取消重建位 `:48-49 ⇒ :22-23`（`:277` ∥ `:288` ∥ `:639`）∥ 装配位两锚（`:287`）`settings.js:181 ⇒ :190` · `settings-providers.js:241 ⇒ :177`；`_confirmDelete :44 ⇒ :50`（`:181` ∥ `:187` ∥ `:657`）∥ `closeSettings :163-172 ⇒ :169-181`（调用位 `:167 ⇒ :173` ∥ 增调句 `:172 ⇒ :174`——`:259` ∥ `:488`）∥ `_confirmSecretDelete :50-57 ⇒ :56-63`（`:299`）∥ `btn` 注 `:49 ⇒ :55`（`:309`）∥ `initSettings :25 ⇒ :29`（`:311`）∥ `renderProvidersCard :237-242 ⇒ :173-178`（`:230`））+ 变更记录一行｜走查 = 编辑批回执 16/16 在位（逐枚对 `settings.js` ∥ `settings-providers.js` 两档现盘实读）｜台账 = #1070 + #1086（随收口销）。

**笔 7（#1078 ∥ #1040 时态）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `docs/vsc/requirements/WEBVIEW.md` F-W17 诸锚重锚（载体 `:185 ⇒ :137` ∥ 装配位 `:229-246 ⇒ :157-166` ∥ 取消重建位 `:48-49 ⇒ :22-23` ∥ 动作 `:67-69 ⇒ :50-52`）+ `_delKey` 时态收正（拟清 ⇒ 已清）+ 行尾「诸锚重锚待补」pending 括注删（#29 ∥ #40 已落定）+ 变更记录一行｜走查 = 编辑批回执 4/4 在位｜台账 = #1078（随收口销）。

**在飞核验（只读子代理 ×2）**：① #1079 四行坐标核（F-W13 ∥ F-W14 ∥ P2-3 ∥ P2-4——涉 permission.js ∥ permission-gate.mjs ∥ panel-messages.mjs ∥ panel-callbacks ∥ panel-turn-stages ∥ panel-session ∥ turn-model ∥ streaming.js ∥ chat-messages.js ∥ atmenu.mjs ∥ settings-agent.js ∥ settings-panel-write.mjs）；② 归批清单现况核（#946 ∥ #809 ∥ #1044 ∥ #1091 ∥ #1115 ∥ #1116 ∥ #931 ∥ #1099 ∥ #1110 ∥ #1074 ∥ #1083 ∥ #1066 抽样 ∥ DOC-DISCIPLINE:1622）。报告到后逐项三分裁决（收正 ∥ 追认核销 ∥ 撤回/留档）+ 收口链。

### 1.5 逐笔收录（续 · slot-42）

（#1079 十二项实核由只读子代理 #1 采证，2026-10-09 16:2x——6 处漂移 ∥ 8 锚一致。）

**笔 8（#1079）**：交底 = 轻通道（收敛面·缺陷修复）｜改 = `docs/vsc/requirements/WEBVIEW.md` 四行坐标复核随正——F-W13 空队径锚重锚（缺陷期 `panel-messages.mjs:315` ⇒ 现盘 `panel-messages-turn.mjs:201-213`——id 精确匹配 + 孤儿 `permissionWithdrawn` 回写，D-W15 收正后态）；F-W14 两锚随正（`panel-messages.mjs:139 ⇒ :250` ∥ `panel-session.mjs:133-136 ⇒ turn-model.mjs:19-26`）；P2-3 清/置点随正（`chat-messages.js:123 ⇒ :125` ∥ `:201 ⇒ :205`）；P2-4 两锚随正（`settings-agent.js:123-125 ⇒ :128-129` ∥ `settings-panel-write.mjs:129-138 ⇒ :155-158`）。复核一致零改 8 锚 = `permission.js:30-39` ∥ `permission-gate.mjs:102-118`（`:114` ∥ `:115-118`）∥ `panel-callbacks.mjs:238`·`:253` ∥ `panel-turn-stages.mjs:87-89` ∥ `turn-model.mjs:22` ∥ `streaming.js:118`·`:149`。｜走查 = 编辑批回执 7/7 在位（含变更记录一行）｜台账 = #1079（随收口销）。

### 1.6 三分裁决表（全清册 24 项 · 2026-10-09 16:2x · slot-42）

（依据 = 两路只读核验：子代理 #1（#1079 四行 12 项）∥ 子代理 #2（归批 13 项）；逐项对现盘实读。）

**已收正（9）**：#1117 ∥ #1119 ∥ #1105 ∥ #1124 ∥ #1123 ∥ #1070 ∥ #1086 ∥ #1078 ∥ #1079（笔 1–8，编辑回执全在位）。

**已修 ⇒ 追认核销（3）**：
- #1040（死码半已清——vsc 源码全树 `_delKey` 零命中；「仅删钥入口」半 = 归档决策在案）；
- #1075（生成区已重刷——`API-CONTRACT.md:2686` 现载 `health.mjs:12`）；
- #1099（maintain +2 行在盘 `config.mjs:72-73` 且该档工作树干净——追认：最近触及提交 = `3846c43f`（清除批）；条件「他流提交后补」已满足）。

**转收尾链修复面（9 · code 类——父侧门拒，逐项已带现盘落点）**：
1. #946 —— `thincoder-vscode/src/tools/index.mjs:40` 注仍引已删审批面（`agent/execute-tools.mjs`/`agent/tool-gates.mjs` 全仓零命中）+ `thincoder-vscode/src/agent/run-helpers.mjs:15` 再出口零调用点；**同族并入**：另 6 档 7 处（`index.mjs:8` ∥ `setup-tooltable.mjs:28` ∥ `tool-table.mjs:31` ∥ `extension/peer-domains.mjs:15` ∥ `extension/permission-gate.mjs:97` ∥ `memory-tool.mjs:43`）。
2. #1044 —— `thincoder-desktop/renderer/settings.css` 档头「越 300 在册」自携句回位（真值 303 行）；旁见：档头 `styles.css` 284 行句所指档已随 R13 四拆退场。
3. #1074 —— `thincoder-server/public/views-me.mjs:9` 注仍指 `app.mjs`；真值 = `public/dom.mjs:63`。
4. #1083 —— 注实在 `thincoder-desktop/src/main/providers.mjs:276`（非 :298）：目标 `proxy.mjs:191-200` 已越界（该档现 51 行），真值 = `proxy-transport.mjs:27/:39-55/:177-186`；第二处 `thincoder-vscode/webview/settings-providers.js:47` 注「卡 HTML `:123`」⇒ 现盘 `:137`；旁见：同档 `:159` 注「`settings.js:185`」待核（`buildSettings` 现盘调用位 = `:190`）。
5. #1091 —— `thincoder-core/memory/code-index.mjs:5` 死导入 `SKIP_DIRS`（档内零消费）。
6. #1115 —— `thincoder-core/agent-tools/batch.mjs:172` 拒串仍作「写 §1/§4/§6」（普通面写域 = §1/§2/§4/§5/§6）；`:167` 同族句同病。
7. #1116 —— `thincoder-core/agent-tools/batch-lifecycle.mjs:311-316` 非法 segment 仍静默视同缺省（与 append 面 :170-172 显式拒不一致）。
8. #931 —— `bench/toolcall/fixture.mjs:65-69` 仍列五旧名且无 `ledger`。
9. #1118 —— `thincoder-core/agent/write-gate.mjs:135` 注释（试笔拒在案）。

**留档（1）**：#809 —— 仍陈旧（`font-weight: 600` 现落 `chat-fixes.css:46`）但前提 = slash 启封 ∥ 用户点名**未至** ⇒ 留档不动（到期条件不变）。

**候裁（2 —— 候用户一句话）**：
- #1066 —— `docs/vsc/design/WEBVIEW.md` ≈60 处漂移（抽样 3/3 全漂：`chat.js:147 ⇒ :142` ∥ `ui.js:198 ⇒ :237`（`:199-206 ⇒ :238-245`）∥ `activity.js:108 ⇒ :65`）；+ `docs/core/design/DOC-DISCIPLINE.md:1622` 事实失效（`doc-check.test.mjs` 不在盘；现役 = 批内件 + 台账 #590）。处置二择：① 本会话起专项 sweep ② 转修复面。**父侧默认 = ②**（60 锚超轻笔体量；持 D1 作者线）；用户另裁随动。
- #1110 —— `thincoder-core/tools/repomap.mjs:118` 越界提示行旧语态（「declare index.excludePaths…or prune…」指令形）——「待用户裁定是否同拍收正」。**父侧默认 = 留档候裁**（若用户裁收正则并入修复面）。

**合计**：已收正 9 ∥ 追认核销 3 ∥ 修复面 9 ∥ 留档 1 ∥ 候裁 2 = **24 项全覆盖**。

**收口链**：§2 形式化（eng-designer）→ 独立评审（用户点火）→ 修复轮（修复面 9–11 项）→ 批准 → 收口核销（§6）+ 台账逐行销。

### 1.7 候裁落定（用户 2026-10-09 16:29）

用户「剩下两项都按你建议走」：

- **#1066 = ② 转修复面**（并入修复面，计 **10 项**——含设计档 `docs/vsc/design/WEBVIEW.md` ≈60 处坐标 sweep + `docs/core/design/DOC-DISCIPLINE.md:1622` 承接载体事实行）；
- **#1110 = 留档候裁**（不收正——`thincoder-core/tools/repomap.mjs:118` 语态不动；条件不变）。

§1.6 两候裁条随之落定。收口链按此推进（§2 形式化进行中 = eng-designer #3；其后 = 独立评审〔用户点火〕→ 修复轮〔10 项〕→ 批准 → 收口核销）。

### 1.8 补充裁定（用户 2026-10-09 16:30）

用户「1110 也收」——**#1110 改判 = 收正**，并入修复面（`thincoder-core/tools/repomap.mjs:118` 越界提示行语态收正；目标语态由 §2 定形，沿 F-S14 既有口径）。§1.7 相应条（留档）被本裁覆盖。

**修复面终计 = 11 项**（#946 ∥ #1044 ∥ #1074 ∥ #1083 ∥ #1091 ∥ #1115 ∥ #1116 ∥ #931 ∥ #1118 ∥ #1066 ∥ #1110）。
全清册终盘：已收正 9 ∥ 追认核销 3 ∥ 转修复面 11 ∥ 留档 1（#809）= **24**。

### 1.9 设计评审 + 父侧裁决（2026-10-09 16:4x）

**评审**（id 9d17f24d · 代点火——用户 16:41「自动跑完吧」授权）：**VERDICT: pass** —— 🔴 0 ∥ 🟡 3 ∥ 🔵 4（§3 轮次 1 全文在档）；token 已签发（值不落档——运行时凭证）。

**父侧裁决表**：

| # | Action | Detail |
|---|--------|--------|
| 1 | Dispatched | §2.4 补逐档行数注记（修正轮 #7） |
| 2 | Dispatched | §2.2-9 判据措辞收正（修正轮 #7） |
| 3 | Dispatched | §2.2-8 数字与名单对现盘统一（修正轮 #7）；§1.6「五旧名」= ledger 族子集读数——现盘全量以 §2.2-8 修正为准 |
| 4 | Dispatched | §2.2-11 判据限定源码树（修正轮 #7） |
| 5 | Dispatched | §2.2-2 读数基线明定（修正轮 #7） |
| 6 | Dispatched | §2.2-1 判据④指名或删（修正轮 #7） |
| 7 | Not an issue | 评审基座限制记录——无需动作 |

**修正轮**已派：`eng-designer #7`（round=fix——§2 尾追加「2.7 修正轮」块）。

### 1.10 slot-42 续录（2026-10-09 16:5x——#1066 sweep 落笔 ∥ §2.7 核验 ∥ §4 代签 ∥ 修复轮派发）

**A. #1066 sweep 执行（doc 面 · 父侧直改）**：两枚 thorough 只读枚举（1–450 ∥ 451–870——逐锚对现盘 read）产出完整映射；父侧以六批编辑批落字（`edits` 批回执 32+17+31+20+25 = 125 条目全绿；含 replace_all 组 ⇒ 实际落 ≈130 处）。面别 = 行号漂移 ∥ 归属漂移（端 shim ⇒ 核件锚）∥ 归档址指针（3 处 ⇒ `_archive/design/WEBVIEW.md`——两报告相抵一处，父侧实核归正）∥ 行数读数（chat.js 142 ∥ chat-messages 271 ∥ chat-status 163 ∥ ui 255 ∥ activity 263 ∥ settings-mcp 126 ∥ 模块 49——两报告 ±1 处一律以父侧实核为准）∥ 档头 sweep 口径注 + 变更记录行。**无法判定三项**父侧定锚：`:32` 裸 `:43` ⇒ `chat.js:41`（3 s 兜底）∥ `:52` 裸 `:48` ⇒ `:65`（出生位）∥ `:48` `stream.mjs:36` ⇒ `:88`（重排门，与 §5.5 同源）。变更记录段（705–870）历史面零改（两处旧锚 = 该批当时事实，留档）。抽检 4/4 命中（`ui.js:228-232` ∥ `:237-245` ∥ `activity.js:65` ∥ `chat.js:142`）。

**B. DOC-DISCIPLINE.md:1622 事实行收正**（现盘收正：承接 = 批内件 `scripts/doc-check.mjs` 逐批直跑；旧档不在盘——核测试树无该档）+ 该档变更记录指针行。

**C. §2.7 核验**：评审发现 1–6 逐号承接（行数注记 ∥ §2.2-9 判据 ∥ §2.2-8 名单统一 ∥ §2.2-11 射程 ∥ §2.2-2 基线 ∥ §2.2-1 判据④删）——§1.9 裁决表六条 Dispatched 收敛为 Fixed。

**D. §4 代签 + 修复轮派发**：三条件齐备（评审 pass 零 🔴 ∥ 修正核验 ∥ token 签发——槽位在册，效期至 2026-10-16）；code 10 项十七档按域五单派实施舱（eng-coder #8 vsc∥7 ∥ #9 core∥5 ∥ #10 desktop∥2 ∥ #11 server∥1 ∥ #12 bench∥1）。

### 1.11 机检首跑与夹修（2026-10-09 17:2x）

**doc-check 首跑（修复轮在飞中）= 红**：`FAIL(锚): 8 条悬空`（全在 `docs/vsc/design/WEBVIEW.md`——我 sweep 引入的裸形 `render-core/…` 锚 8 处：`:55`×2 ∥ `:68` ∥ `:84` ∥ `:96` ∥ `:97`×2 ∥ `:125`）+ `FAIL(行宽): 1 行超 300 字符`（同档 `:358` = 332 字符——我 edit 加长所致）。

**夹修（父侧直接执行 · 可 revert）**：① 核件前缀补全 = 全档 18 处裸 `render-core/` ⇒ `thincoder-render-core/`（核件仓内实址逐档实核在位——`composer/panel.mjs` ∥ `i18n.mjs` ∥ `md.mjs` ∥ `lib.mjs` ∥ `scroll.mjs` ∥ `tool-summary.mjs` ∥ `flow/tool-card.mjs` ∥ `flow/tool-card-restore.mjs`；替换为机械同形改——18/18 回执）；② `:358` 收口 = 删我 sweep 所加两处符号位（`startLiveHeartbeat` ∥ `stopLiveHeartbeat`）回 ≤300（现 295——判据保持 §2.2-10 零新语义）。

**复跑（17:2x）= 绿**：`OK(锚): 0 条悬空` ∥ `OK(行宽): 无 >300`（exit 0）；行数面新增 1 条 = `docs/desktop/design/SETTINGS.md:327`（settings.css 表 303 ⇒ 实读 304，Δ+1——#1044 落笔所致；报告态，收口随正）。

**#11（服务器面 #1074）父侧验收 = 全绿**：`:9` 命中 `dom.mjs:63` ∥ 该档 `app\.mjs` 零命中 ∥ `node --check` exit 0——§5 块在档（含范围外发现）。

**范围外发现 1 条（#11 报——父侧裁）**：`docs/server/design/webui/WEBUI.md:408` §2.5⑨「加载失败面 … `views-me.mjs:67`」疑似坐标漂移（现盘 `:67` = `await reload()`；同族错误面 = `:60` ∥ `:94` ∥ `:233/:234`）——目标位语义歧义（me 三页对应面待作者随正），**不裁修**；已挂台账 **#1141**（技术待办 · 归批 · 只报不动）。

### 1.12 派发缺口补正（2026-10-09 17:0x）

**缺口**：五单初发时 D1（vsc 面）只列 #946 七档，漏 §2.4 序号 11 `thincoder-vscode/webview/settings-providers.js`（#1083 第二/三处 = `:47` 注 ⇒ `:137` ∥ `:159` 注 ⇒ `:190`）——父侧对表 §2.4（17 档）逐行复核时发现。

**补正**：补发第六舱 eng-coder #13（initial · 单档单笔 · 设计槽同批），任务书 = §2.2-4 第二/三处；17 档 code 全数在舱（D1 7 ∥ D2 5 ∥ D3 2 ∥ D4 1 ∥ D5 1 ∥ D6 1）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-09
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（eng-designer · 2026-10-09 · 依据 = 批档 §1.1–§1.8 + 本席现盘实读。轻通道收尾链的设计形式化 = 本节——未另立设计档；台账锚 = #1131 + 修复面 11 行）

### 2.1 本批条目与任务表（24 项终盘 · 对账 §1.6 ∥ §1.8）

**收口链** = §2（本节）→ 独立评审（用户点火）→ 修复轮（修复面 11 项）→ 批准 → 收口核销（§6）+ 台账逐行销。

| 桶 | 台账 id | 处置 | 备注 |
|---|---|---|---|
| 已收正（9） | #1117 ∥ #1119 ∥ #1105 ∥ #1124 ∥ #1123 ∥ #1070 ∥ #1086 ∥ #1078 ∥ #1079 | 笔 1–8（doc 面，编辑回执全在位） | 落档 8 档（repo 相对）：`thincoder-core/tool-docs/subagent.md` ∥ `docs/core/design/prompts/common.md` ∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` ∥ `docs/core/design/TOOLS.md` ∥ `docs/server/design/accounts/ACCOUNTS.md` ∥ `docs/server/design/webui/WEBUI.md` ∥ `docs/vsc/design/SETTINGS.md` ∥ `docs/vsc/requirements/WEBVIEW.md` |
| 已修 ⇒ 追认核销（3） | #1040 ∥ #1075 ∥ #1099 | 收口时追认（evidence 见 §1.6） | —— |
| 转修复面（11） | #946 ∥ #1044 ∥ #1074 ∥ #1083 ∥ #1091 ∥ #1115 ∥ #1116 ∥ #931 ∥ #1118（code 9）+ #1066（doc 1）+ #1110（code 1） | §2.2 逐项设计 | #1066 / #1110 = 用户 2026-10-09 16:29 / 16:30 裁（§1.7 / §1.8 在档） |
| 留档（1） | #809 | 不动 | 前提 = slash 启封 ∥ 用户点名未至（到期条件不变） |

合计 = 9 + 3 + 11 + 1 = **24**；候裁桶清空（两枚均落定——#1066 转修复面 ∥ #1110 收正）。

### 2.2 修复面逐项设计（11 项——逐项落点）

**零新语义总判据（全项适用）**：改动类 ⊆ {注释 ∥ 文案/语态 ∥ 死码（导入/转口/引用删除）∥ 名单/坐标}；行为面仅 #1116（既有语义归位）+ #1115 / #1110（文案/语态）。
**面别**：code 10 项经评审发槽后落（父侧门——`thincoder-core/agent/dispatch.mjs:94`）；doc 1 项（#1066）父侧直改（doc 面不入门前件）。
**坐标口径**：下表坐标 = 2026-10-09 实读（本席 / §1.6）；修复轮落字前逐处 read 复核，漂移以现盘为准（记录入 §5）。

**1） #946 —— VSC 端已删审批面引注 ×6 + 史注复核 ×1 + 死转口 ×1**
- 现状：6 处注仍引已删档 `agent/execute-tools.mjs` ∥ `agent/tool-gates.mjs`（全仓零文件——本席 grep 实读）；`run-helpers.mjs:15` `hasCodeMutations` 转口零调用点（残留载体）。
- 落点：`thincoder-vscode/src/tools/index.mjs:8` · `:40` ∥ `src/agent/setup-tooltable.mjs:28` ∥ `src/agent/tool-table.mjs:31` ∥ `src/extension/peer-domains.mjs:15` ∥ `src/extension/permission-gate.mjs:97` ∥ `src/memory-tool.mjs:43` ∥ `src/agent/run-helpers.mjs:15`（+ 档头 `:4` 半句）。
- 改法：6 处注随正至核现役面（`index.mjs` 两处 ⇒ 核动作级分类消费 = `agent/dispatch-gates.mjs:130` 谓词 + `dispatch.mjs` 门禁位；`setup-tooltable.mjs:28` ⇒ 核 `agent/record-results.mjs` mutation 记账（`_touchedFiles`）同载体；`peer-domains.mjs:15` ⇒ 核 `agent/dispatch-run.mjs:67` · `:79-80` · `:130` · `:150` + `agent/run-stages.mjs:171` 调用点；`permission-gate.mjs:97` ⇒ 核 `agent/dispatch.mjs:188` / `:200` 落逐项通道；`memory-tool.mjs:43` ⇒ 核 `dispatch-gates.mjs` 读此分类——修复轮逐处 read 落字）。`tool-table.mjs:31` 已携「已删」史注 + 现役锚（核 `dispatch-gates.mjs` 两谓词 + `dispatch.mjs` 两门禁位同句在场）⇒ **复核零改候选**。`run-helpers.mjs:15` **删死转口行**（档头 `:4` 半句随删）。
- 判据：① 6 处改后 read 命中现役锚；② `execute-tools.mjs` / `tool-gates.mjs` 余存命中均呈「已删」史注形（逐处记录；预期仅 `tool-table.mjs:31` 一处）；③ `hasCodeMutations` 删后端侧 src+test 零命中（本席 grep 在案：仅 `.thincoder/tmp` 与归档件引用）；④ 两档 `node --check`。

**2） #1044 —— settings.css 档头自携句回位**
- 现状：「越 300 在册」自携句未回位（#903 回线时删 ∥ #1030 再入册后未回）；旁见：档头 `styles.css` 284 行句所指档已随 R13 四拆退场（现盘 ENOENT——本席实读）。
- 落点：`thincoder-desktop/renderer/settings.css` 档头（`:1-9` 区）。
- 改法：补回自携句（形沿家族款「该档越 300 顾问线，在册」+ 数字 **303**——口径 `split("\n").length−1`，本席实读 303 / endsWithNewline）；`styles.css` 句补退场注记（「后随 R13 四拆退场」）。
- 判据：read 回执——自携句在位且数字 = 现盘实读（303）；`styles.css` 句带退场注记。

**3） #1074 —— views-me.mjs 注随正**
- 现状：注「复制钮三路回退住 app.mjs」陈旧。
- 落点：`thincoder-server/public/views-me.mjs:9`。
- 改法：`app.mjs` ⇒ `dom.mjs:63`（`copyText` 三路回退真址——本席实读）。
- 判据：read 回执命中 `dom.mjs:63`。

**4） #1083 —— 三处坐标注随正**
- 现状：`providers.mjs:276` 注引 `thincoder-core/proxy.mjs:191-200` 已越界（该档现 51 行）；`settings-providers.js:47` 注「卡 HTML `:123`」陈旧；同档 `:159` 注「`settings.js:185`」待核。
- 落点：`thincoder-desktop/src/main/providers.mjs:276` ∥ `thincoder-vscode/webview/settings-providers.js:47` · `:159`。
- 改法：① `:276` ⇒ `thincoder-core/proxy-transport.mjs:27` ∥ `:39-55` ∥ `:177-186`（`opts.signal` 三址——本席实读）；② `:47` ⇒ `:137`；③ `:159` `settings.js:185` ⇒ `:190`（重绑调用位 `bindAddProviderForm()`——本席实读在案；修复轮 read 复核后落字）。
- 判据：三处 read 命中；`proxy.mjs:191-200` 引用零命中。

**5） #1091 —— 死导入删**
- 现状：`thincoder-core/memory/code-index.mjs:5` 导入 `SKIP_DIRS` 档内零消费。
- 落点：`thincoder-core/memory/code-index.mjs:5`。
- 改法：从导入清单删 `SKIP_DIRS`（余四符号保留）。
- 判据：档内 `SKIP_DIRS` 零命中（grep）；`node --check`。

**6） #1115 —— batch 拒串域枚失实 ×2**
- 现状：`:172` / `:167` 拒串域枚作「§1/§4/§6」（普通面写域 = §1/§2/§4/§5/§6）。
- 落点：`thincoder-core/agent-tools/batch.mjs:167` · `:172`。
- 改法：两串按模式分支域枚（工程 §1/§4/§6 ∥ 普通 §1/§2/§4/§5/§6——句式沿 `:177-182` 既有面）；拒面条件零改。
- 判据：两分支串实读或 node 直调复核；`node --check`。

**7） #1116 —— 取段面非法 segment 显式拒**
- 现状：`batch-lifecycle.mjs:311-316` 不可解析 segment ⇒ `declared=null` ⇒ 静默视同缺省（与 append 面 `:170-172` 显式拒不一致）。
- 落点：`thincoder-core/agent-tools/batch-lifecycle.mjs:311-316`。
- 改法：`declared` 计算后补显式拒——`args.segment` 传值而解析不可得 ⇒ throw（镜像 append 面「unknown segment」串形）；未传 = 缺省语义零变（普通面缺省 §1 照旧）。
- 判据：直调两态（前/后读数记录——红证 = 非法串被静默缺省；绿证 = 修复后抛错 ∧ 未传仍缺省）；`node --check`。

**8） #931 —— bench 负向名单滞后**
- 现状：`fixture.mjs:65-69` `OFF_PAYLOAD_TOOL_NAMES` 仍列 7 旧名（`memory_search` ∥ `memory_put` ∥ `ledger_query` ∥ `ledger_count` ∥ `ledger_add` ∥ `ledger_update` ∥ `ledger_close`）且无 `ledger`。
- 落点：`bench/toolcall/fixture.mjs:65-69`。
- 改法：名单按现役名对表收正——退 7 旧名、增 `ledger`（现役 = `memory` / `ledger` 单一名面；判据 = 设计 §11.10-② 族枚举 × 现役工具名面对读）。`TOOL_PROBE_VERSION` **不 bump**——§11.2 版本轴六项枚举（V1 块字面 ∥ V2 规则 ∥ 用例集 ∥ 判据与分母口径 ∥ `SYSTEM_BASE` ∥ 参数口径）零动；名单不入 `casesDigest` / `payloadDigest`，读数可比性零影响。
- 判据：`node --test bench/test/toolcall.test.mjs` 6/6 绿；名单与现役名对读记录。

**9） #1118 —— write-gate 注主语收正**
- 现状：`write-gate.mjs:135` 注主语仍作「工程角色子代理」（设计已收正 = 携绑定的子代理）。
- 落点：`thincoder-core/agent/write-gate.mjs:135`。
- 改法：主语收正为「携绑定的子代理（工程角色 ∥ 普通面 coder——`BATCH-RECORD.md` §4.16）」（对齐 `docs/core/design/AGENT-LOOP-SUBAGENT.md:780` 收正句）；门本体零改。
- 判据：read 回执命中新主语；同档 `工程角色` 零命中（本席实读：仅 `:135` 一处）。

**10） #1066 —— WEBVIEW.md 坐标 sweep + DOC-DISCIPLINE 事实行**
- 现状：`docs/vsc/design/WEBVIEW.md`（870 行）≈60 处坐标漂移（抽样 3/3 全漂——§1.6）；`docs/core/design/DOC-DISCIPLINE.md:1622` 承接载体事实行失效。
- 落点：`docs/vsc/design/WEBVIEW.md`（全档 sweep）∥ `docs/core/design/DOC-DISCIPLINE.md:1622`。
- 改法：① 逐锚对现盘 read 复核随正（坐标/时态类——漂移项新坐标落字）；② `:1622`「现行承接档 = `thincoder-cli/test/doc-check.test.mjs` 随 `npm test` 常驻」按现盘收正（该档不在盘；核测试树空——durable 覆盖以批内件承接，台账 #590）。
- 判据：① 逐锚复核记录（每锚 read 命中现盘）；② `node scripts/doc-check.mjs` 涉档零新增；③ 父侧抽样复核。

**11） #1110 —— repomap 越界提示行语态收正**
- 现状：`repomap.mjs:118` 越界提示行（两入口 `buildSummary` ∥ `buildOutline` 同文）作「`declare index.excludePaths…, or prune:`」指令形。
- 落点：`thincoder-core/tools/repomap.mjs:118`。
- 改法：语态收正沿 F-S14 ② 选项式口径（逐字见下）；零新语义（语态替换 ∥ 两选项与机制串原样 ∥ 数值插值零动）。
- 判据：旧串 grep 零命中；`node --check`；同函数零分叉（两入口同文保持）。

**#1110 目标语态（逐字——修复轮替换 `:118` 返回串）**：
- 现 = `(code index too large for an outline: > ${N} files — declare index.excludePaths in PROJECT-MANIFEST.json, or prune: thincoder memory sweep --origin <o> --path <sub>)`
- 目标 = `(code index too large for an outline: > ${N} files — Options: exclude paths from indexing (index.excludePaths in PROJECT-MANIFEST.json), or remove old rows (thincoder memory sweep --origin <o> --path <sub>))`
- 说明：`${origin ? " for this origin" : ""}` 段原样保留；形源 = F-S14 ② CAP 行同款（`docs/core/design/MEMORY.md:571`）；无断言引用（`too large for an outline` 全仓 = 源码一处 + dist 打包件——本席 grep 实读）。

### 2.3 验收对照（修复轮收口机检口径）

1. **面白名单**：`git diff --name-only` ⊆ §2.4 清单（19 档——含 1 档复核零改候选；本批档 §5/§6 记录面除外）——面外一档 = 红。
2. **逐项复核**：§2.2 各项判据逐条执行（每项 = 新锚 read 命中 + 旧串/旧引用 grep 判据）。
3. **语法门**：改动 `.mjs` / `.js` 逐档 `node --check`；`.css` 读回（无语法器）。
4. **零新语义**：diff 行分类核（注释 ∥ 文案 ∥ 死码 ∥ 名单——对 §2.2 判据）；行为面仅 #1116（前/后两态直调记录）。
5. **工具面回归**：`node --test bench/test/toolcall.test.mjs`（#931——6/6 绿）；batch 面两项（#1115 / #1116）直调复核记录。
6. **doc 面**：`node scripts/doc-check.mjs` 跑一次（涉档零新增）；#1066 逐锚复核记录入 §5。
7. **收口**：§5 逐项实施记录 → §6 父侧独立复核 → 台账逐行销（11 项；#809 留档不销）。修复轮改动逐档单笔、可 revert。

### 2.4 受影响文件清单（修复轮 · 19 档）

**code 17 档（16 改 + 1 复核零改候选；预期净增 = 微——±≤5 行/档，注释/文案/删行级）**：

| # | 文件 | 项 | 改动类 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/tools/index.mjs` | #946 | 注释 ×2 |
| 2 | `thincoder-vscode/src/agent/run-helpers.mjs` | #946 | 死转口删（1 行 + 档头半句） |
| 3 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | #946 | 注释 ×1 |
| 4 | `thincoder-vscode/src/agent/tool-table.mjs` | #946 | 复核零改候选 |
| 5 | `thincoder-vscode/src/extension/peer-domains.mjs` | #946 | 注释 ×1 |
| 6 | `thincoder-vscode/src/extension/permission-gate.mjs` | #946 | 注释 ×1 |
| 7 | `thincoder-vscode/src/memory-tool.mjs` | #946 | 注释 ×1 |
| 8 | `thincoder-desktop/renderer/settings.css` | #1044 | 档头注释（自携句补回 + 退场注记） |
| 9 | `thincoder-server/public/views-me.mjs` | #1074 | 注释 ×1 |
| 10 | `thincoder-desktop/src/main/providers.mjs` | #1083 | 注释 ×1 |
| 11 | `thincoder-vscode/webview/settings-providers.js` | #1083 | 注释 ×2 |
| 12 | `thincoder-core/memory/code-index.mjs` | #1091 | 死导入删 |
| 13 | `thincoder-core/agent-tools/batch.mjs` | #1115 | 拒串 ×2（模式分支） |
| 14 | `thincoder-core/agent-tools/batch-lifecycle.mjs` | #1116 | 显式拒 ×1 |
| 15 | `bench/toolcall/fixture.mjs` | #931 | 名单（7 退 1 增） |
| 16 | `thincoder-core/agent/write-gate.mjs` | #1118 | 注释 ×1 |
| 17 | `thincoder-core/tools/repomap.mjs` | #1110 | 文案语态 ×1 |

**doc 2 档（#1066 · 父侧直改面）**：`docs/vsc/design/WEBVIEW.md`（≈60 锚 sweep）∥ `docs/core/design/DOC-DISCIPLINE.md:1622`（事实行）。

### 2.5 关键决策记录

- **KD-1 面别口径**：doc 类（`*.md` 非 src 段 + `thincoder-core/prompts|tool-docs/**`）= 父侧直改；code 类（`.mjs` / `.js` / `.css`）受父侧门（`thincoder-core/agent/dispatch.mjs:94`——无活设计槽拒 code 类写）。实证 = #1118 试笔拒文（§1.2 闸测）。修复轮执行面 = doc 项父侧直改 ∥ code 项经评审发槽后落（执行者按点火口径）。否决 = 逐笔越门直改（门先于路由——写门 prevail）。
- **KD-2 code 类路由至修复面**：理由 = 逐笔实试被拒（实证在案）+ 轻笔体量判据；转收尾链一次全链（评审一次覆盖 11 项）。否决备选：① 逐笔越门（违门）② 另册挂账再起轮（挂账成本 > 一次修复轮）。
- **KD-3 候裁处置**：#1066 = 转修复面（用户 16:29「剩下两项都按你建议走」——60 锚超轻笔体量、持 D1 作者线）；#1110 = 收正（用户 16:30「1110 也收」——原留档条被覆盖，§1.8 在档）。修复面终计 = 11 项（§1.8 同源）。
- **KD-4 零新语义判据（统一）**：改动类四项闭集（§2.2 头）；#1116 = 既有语义归位（拒绝语义已存在于同工具 append 面 `:170-174`——取段面口径收正，非新判据）；#931 版本判定 = 不 bump（§11.2 六项枚举零动；名单不入 digest 面）。

### 2.6 上抛项

无——两候裁（#1066 ∥ #1110）已由用户 2026-10-09 16:29 / 16:30 落定（§1.7 / §1.8 在档）；修复面 11 项判据自足。

### 2.7 修正轮（评审发现 1–6 · 2026-10-09）

（eng-designer · 修正轮 · 依据 = §3 轮次 1 发现 1–6 + §1.9 父侧裁决〔Dispatched 六条〕+ 本席 2026-10-09 现盘实读。本块 = 六项逐号落法；受影响原文点——§2.2-1 判据④ ∥ §2.2-2 改法/判据 ∥ §2.2-8 现状/改法 ∥ §2.2-9 判据 ∥ §2.2-11 判据 ∥ §2.4 code 17 档头注（行数注记）——**以本块为准**。）

**发现 1（§2.4 逐档行数注记）→ 逐档现盘行数补全**（口径 = `split("\n").length−1`；2026-10-09 本席逐档实读；序同 §2.4 表 1–17）：

- 序 1–3：`thincoder-vscode/src/tools/index.mjs` 188 ∥ `thincoder-vscode/src/agent/run-helpers.mjs` 88 ∥ `thincoder-vscode/src/agent/setup-tooltable.mjs` 103；
- 序 4–6：`thincoder-vscode/src/agent/tool-table.mjs` 187 ∥ `thincoder-vscode/src/extension/peer-domains.mjs` 32 ∥ `thincoder-vscode/src/extension/permission-gate.mjs` 122；
- 序 7–9：`thincoder-vscode/src/memory-tool.mjs` 73 ∥ `thincoder-desktop/renderer/settings.css` 303 ∥ `thincoder-server/public/views-me.mjs` 295；
- 序 10–12：`thincoder-desktop/src/main/providers.mjs` 302 ∥ `thincoder-vscode/webview/settings-providers.js` 193 ∥ `thincoder-core/memory/code-index.mjs` 219；
- 序 13–15：`thincoder-core/agent-tools/batch.mjs` 332 ∥ `thincoder-core/agent-tools/batch-lifecycle.mjs` 371 ∥ `bench/toolcall/fixture.mjs` 149；
- 序 16–17：`thincoder-core/agent/write-gate.mjs` 172 ∥ `thincoder-core/tools/repomap.mjs` 325。
- 档位判定：全 17 档 < 500（最大 = `batch-lifecycle.mjs` 371）⇒ **无 >500 主动拆分评估 / >800 必拆触发**；本批改动 = 注释 / 文案 / 名单级，结构面零触碰（Δ 口径沿 §2.4 头注 ±≤5 行/档不变）。
- 两档 .md（`docs/vsc/design/WEBVIEW.md` ∥ `docs/core/design/DOC-DISCIPLINE.md`）：按本裁**豁免**行数注记与档位判定（文档类——代码 500 / 800 档位不适用）。

**发现 2（§2.2-9 判据）→ 判据改**：`工程角色子代理`（旧主语原句）同档 `write-gate.mjs` 零命中 ∧ `:135` read 回执命中新主语句；`工程角色` 一词入新句属预期、非零命中对象——原「同档 `工程角色` 零命中」口径随本块替换（按字面必红）。

**发现 3（§2.2-8 数字与名单对现盘统一）→ 落法**：

- 现盘实读（`bench/toolcall/fixture.mjs:65-69`）：名单 **16 名** = `memory` ∥ `memory_search` ∥ `memory_put` ∥ `code_search` ∥ `doc_search` ∥ `repo_outline` ∥ `settings`；续 = `peer_instances` ∥ `ledger_query` ∥ `ledger_count` ∥ `ledger_add` ∥ `ledger_update` ∥ `ledger_close` ∥ `subagent` ∥ `advisor` ∥ `consult`。
- 数字统一：旧名 = **7**（`memory_search` ∥ `memory_put` + ledger 旧族 5 = `ledger_query` … `ledger_close`）；§1.6「五旧名」= ledger 族子集读数（全量以本条〔= §2.2-8 修正〕为准——§1.9 在档）；`memory` **已在列**（非新增项）。
- 旧名形态核：`memory_search` / `memory_put` = 已合并退役裸工具（`docs/core/design/MEMORY.md:98`）；`ledger_*` 五名 = code 面弃用壳、不入任何装配面（`thincoder-core/ledger-tools.mjs:241-259`）——旧名分类成立。
- 收正后名单（**10 名**）= `memory` ∥ `ledger` ∥ `code_search` ∥ `doc_search` ∥ `repo_outline` ∥ `settings` ∥ `peer_instances` ∥ `subagent` ∥ `advisor` ∥ `consult`（列序随落字；名集为准）。
- 余项处置：`code_search` / `doc_search` / `repo_outline` / `settings` / `peer_instances` / `subagent` / `advisor` / `consult` = §11.10-② 实例绑定族 ∥ depth 绑定族成员 ⇒ **原样保留**；
- `ledger`（台账查询现役单一入口——`thincoder-core/ledger-tools.mjs:237-239`）补入 ⇒ 名集与现役名面对齐（§2.4 表 `fixture.mjs` 行「7 退 1 增」同源）。

**发现 4（§2.2-11 判据）→ 判据限定源码树**：旧串（`declare index.excludePaths in PROJECT-MANIFEST.json, or prune:` 原句）**源码树（代码面）零命中**——打包件（`dist*/**` ∥ `.thincoder/tmp/**`，随重建刷新）与文档引句面（批次档 / 设计档）不计，均不入判据。

- 现盘点位：源码树单点命中 = `thincoder-core/tools/repomap.mjs:118`（修复即归零）；打包件可见 4 档 app.asar 副本（`dist-r3` ∥ `dist-r4` ∥ `.thincoder/tmp` 两处）——不入判据。判据余项（`node --check` ∥ 同函数两入口同文）零变。

**发现 5（§2.2-2 读数基线）→ 基线明定 = 以写后实读为准落字**：

- 流程：补句落字（数字位先占位）→ 写后实读（口径 `split("\n").length−1`）→ 数字回填 = 写后实读值（数字位数不改变行数）。
- 判据（改）：自携句在位 ∧ 数字 = 写后实读（同口径）；**不锁 303**——现读 303 = 回位前基线读数（§2.4 行数注记引），回位句落形后重读回填。`styles.css` 句退场注记项零变。

**发现 6（§2.2-1 判据④）→ 删分句**：「两档 `node --check`」删（未指名哪两档）；本项 7 档语法覆盖由 §2.3-3 批级逐档门承接（改动 `.mjs` 逐档 `node --check`）——零覆盖缺口。

### 2.8 #1091 条内收正（修复轮 · 2026-10-09）

（eng-designer · 修复轮 · 依据 = §5 核心面 R1-🟡1／越界发现①（「余四符号保留」前提失实）+ 父侧 2026-10-09 派单〔①-a 并入本轮——#1091 条内收正，零新语义〕+ 本席 2026-10-09 现盘实读。本块 = #1091 落法收正一件；受影响原文点——§2.2-5 现文（改法句「余四符号保留」）——**以本块为准**。）

- **收正句**：「余四符号保留」⇒ 余两枚 = `BIG_FILE_LINES` ∥ `segmentCJK`——档内实消费（`BIG_FILE_LINES` `:71` ∥ `segmentCJK` `:166`·`:212`）。
- **增删面**：`CODE_EXTS` ∥ `DOC_EXTS` 一并删（落点同 §2.2-5 = `thincoder-core/memory/code-index.mjs:5`；档内零消费——两枚除 `:5` 外全档零出现；档内无再出口〔导出面 = 9 函数〕；全仓消费 = `thincoder-core/memory/file-list.mjs:7`（直连 `schema.mjs`）+ `:21-22` 使用——不经 `code-index.mjs`）。
- **判据（补 · 沿 §2.2-5 同款）**：档内 `CODE_EXTS` ∥ `DOC_EXTS` 零命中（grep）；`node --check`。

### 2.9 同族收正 ×2（修复轮 · 2026-10-09）

（eng-designer · 修复轮 · 依据 = §5〔#1083 第二/三处〕范围外发现 1–2 + 父侧 2026-10-09 派单（同族小形收正 ×2——先读后落）+ 本席现盘实读核验（两枚均实、零相抵）。受影响面注——两项改动随本块入册（落笔 = 同批修复轮 eng-coder 承接）；文件面随动——`model-menu.js` 系 §2.4 清单外（随本块入列），`settings-providers.js` 已列（序 11）。）

**① `settings-providers.js:103` 注引名随正**：
- 现状：注引 `rebuildSettings`——陈旧符号名（源码树仅本注一处；实际函数 = `buildSettings`——`settings.js:185` 定义）。
- 落点：`thincoder-vscode/webview/settings-providers.js:103`。
- 改法：注内 `rebuildSettings` ⇒ `buildSettings`（逐字）。
- 判据：read 命中 `buildSettings`；`rebuildSettings` 源码树零命中（修后）；`node --check`。

**② `model-menu.js:7` 注指位随正**：
- 现状：注指「`settings-providers.js:9`」——现盘 `:9` = settings-widgets 导入行；`openModelMenu` 导入 = `:10`（对称锚 = `settings-models.js:6`——同名导入在位）。
- 落点：`thincoder-vscode/webview/model-menu.js:7`。
- 改法：注内 `settings-providers.js:9` ⇒ `settings-providers.js:10`（逐字）。
- 判据：read 命中 `settings-providers.js:10` 形；两锚（`settings-models.js:6` ∕ `settings-providers.js:10`）对现盘实读成立；`node --check`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审轮 · 发现表（stale-fixes §2：24 项任务表 ∥ 修复面 11 项设计 ∥ 验收 7 条 ∥ 19 档清单）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响档注记 | 🟡 | §2.4 仅给整批差额口径「预期净增 = 微——±≤5 行/档」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:213`），17 档 code 未逐档注现行行数 ⇒ 行数档位判定（>500 主动拆分评估 / >800 必拆）无从执行；盘上数字本次未复核（unverified）。 | 逐档补「现盘 N 行 + ≤±M 行」注记；触及 >500 / >800 档位者另附拆分评估或拆分方案（两档 .md 豁免）。 |
| 2 | 验收判据 | 🟡 | §2.2-9 改法要求新注文含「工程角色」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:181`「携绑定的子代理（工程角色 ∥ 普通面 coder」），判据却要求「同档 `工程角色` 零命中」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:182`）——按字面执行，改法完成即判据必红。 | 判据改为对旧主语原句（如 `工程角色子代理`）零命中，或明示「除 :135 新句外」的排除口径。 |
| 3 | 文档状态相抵 | 🟡 | #931 同一事实两读数不一：`:76`「仍列五旧名」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:76`） vs `:173`「仍列 7 旧名」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:173`，并列七名）、`:231`「名单（7 退 1 增）」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:231`）；且「退 7 增 1」仅在 `memory` 已预列时才得 {memory, ledger} 现役名面（前设未言明）。 | 以设计面为准对现盘 read 统一数字，并在该条明示收正前后名单（含 `memory` 是否已在列）。 |
| 4 | 验收判据口径 | 🔵 | §2.2-11 判据「旧串 grep 零命中」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:194`）与同条说明「`too large for an outline` 全仓 = 源码一处 + dist 打包件」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:199`）相抵——全仓口径下判据不可达。 | 判据限定为源码树零命中（打包件随重建刷新），避免面外误改。 |
| 5 | 澄清（读数基线） | 🔵 | §2.2-2 落字值 303 = 写前实读（`thincoder/docs/batches/2026-10-09-stale-fixes.md:139`「本席实读 303」）；判据要求「数字 = 现盘实读（303）」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:140`）——回位动作自身若改变行数，写后实读即非 303，基线未定。 | 明定读数基线（如以写后实读为准落字，或声明行数中立写法）。 |
| 6 | 澄清（判据指向） | 🔵 | §2.2-1 判据④「两档 `node --check`」（`thincoder/docs/batches/2026-10-09-stale-fixes.md:134`）未指名哪两档（该项涉 7 档；§2.3-3 已逐档覆盖）。 | 指名所涉两档，或删该分句。 |
| 7 | 评审基座限制 | 🔵 | 无文档地图 / 项目标准档可依：文档归属与规程合规仅按批档自述结构（`thincoder/docs/batches/2026-10-09-stale-fixes.md:2`「六段 append-only，一段一作者」）判定；§2.2 引用的盘上读数（303 / 51 / 870 行等）受评审范围限定未复核（unverified）。 | 无需改动；作为评审覆盖度限制记录（后续有文档地图可补核）。 |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 4。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 代签（父侧代签——用户 2026-10-09 16:41「自动跑完吧」全链授权内）

**三条件核（父侧自缚）**：① 设计评审 pass 零 🔴 ✓——§3 轮次 1 = `VERDICT: pass`（🔴 0 ∥ 🟡 3 ∥ 🔵 4）；② 修正轮落地并逐条核验 ✓——评审发现 1–6 全数由 §2.7 承接并逐号核读（§1.9 裁决表六条 Dispatched 收敛为 Fixed——行数注记 ∥ §2.2-9 判据 ∥ §2.2-8 名单统一 ∥ §2.2-11 射程 ∥ §2.2-2 基线 ∥ §2.2-1 判据④）；③ token 签发 ✓——设计槽在册（效期至 2026-10-16；凭证值不落档）。

**授权范围**（§1.1 ∥ §1.9）：代点火 ∥ 代签 ∥ 修复轮派发 ∥ 收口核销/提交/推送。守则 = 新范围 ∥ 口径裁决 ∥ 破坏性动作 ⇒ 停下只报。

**签** = 修复轮 code 10 项（§2.4 十七档）派实施舱（eng-coder，五单按域分派）；doc 2 项（#1066：`docs/vsc/design/WEBVIEW.md` 坐标 sweep ∥ `docs/core/design/DOC-DISCIPLINE.md:1622` 事实行）已由父侧落笔，两档变更记录行在档；复核记录入 §6。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-09（服务器面 #1074 块已落——五单并行，余面见各自块）



### 服务器面（#1074 · views-me 注随正）· eng-coder · 2026-10-09

**交底**：轻通道（收敛面·缺陷修复——§2.2-3）。**改动** = `thincoder-server/public/views-me.mjs:9` 注 `app.mjs` ⇒ `dom.mjs:63`（单档单行·注释级；git diff = 1 档 1 行）。

**走查读数**：① read `:9` 命中「复制钮三路回退住 dom.mjs:63」；② 该档 `app\.mjs` 零命中——全目录其余 8 处（7 档）均为对现存 `app.mjs` 的合法引用（不入本笔）；③ `node --check thincoder-server/public/views-me.mjs` 直跑 = exit 0（零输出）；④ 真址复核 = `dom.mjs:63` `async function copyText`（三路实装 `:66` ∥ `:76` ∥ `:79`）。

**决策透明**：零自选口径——落字逐字沿 §2.2-3；无旁改。

**审计与评审轮次与终态**：divergence 审计（只读子代理）= 轮 1 → `no divergence`；独立代码评审（advisor · code）= 轮 1 → `pass`（🔴 0 ∥ 🟡 0 ∥ 🔵 1〔审查基座限制——node --check ∥ git diff 读数由实施侧直跑，见上〕）。**fix round = 0**；**终态 = clean**。

**范围外发现（只报不动）**：`docs/server/design/webui/WEBUI.md:408` §2.5⑨ 错误面清单载 `views-me.mjs:67`；现盘 `:67` = `await reload()`——疑似同族坐标漂移（现盘 `.hint error` 面 = `:60` ∥ `:94` ∥ `:233` ∥ `:234`）。是否挂账待父侧裁。

**台账**：#1074（随收口销）。**套件注**：未跑仓库级套件——父侧收口面一次跑（本项注释级·零行为面）。

### #931 —— bench 负向名单收正（修复面 8 · bench 域单 · eng-coder · 2026-10-09）

**交付摘要**：`bench/toolcall/fixture.mjs:65-68` —— `OFF_PAYLOAD_TOOL_NAMES` 由 16 名收正为 10 名：退 7 旧名（`memory_search` ∥ `memory_put` ∥ `ledger_query` ∥ `ledger_count` ∥ `ledger_add` ∥ `ledger_update` ∥ `ledger_close`）、增 `ledger`（`memory` 原在列、非新增）；收正后名集 = `memory` ∥ `ledger` ∥ `code_search` ∥ `doc_search` ∥ `repo_outline` ∥ `settings` ∥ `peer_instances` ∥ `subagent` ∥ `advisor` ∥ `consult`（逐名合 §2.7-③ 定名集；列序随落字）。`TOOL_PROBE_VERSION` 未动（仍 = 1）；名单不入 `casesDigest` / `payloadDigest`。`git diff` 证：仅名单块（−3 行 ∥ +2 行，净 −1；档 149 → 148 行，口径 `split("\n").length−1`）——名单外零行、他档零动。

**现役名对读（10 名逐名 · 盘上证据）**：

| 名 | 现役证据 |
|---|---|
| `memory` | `docs/core/design/MEMORY.md:98`「单一 agent 工具面：`memory` 单工具」；`thincoder-core/tool-docs/memory.md` 在盘 |
| `ledger` | `thincoder-core/ledger-tools.mjs:237-239`（统一入口两变体同名 `ledger`） |
| `code_search` ∥ `doc_search` ∥ `repo_outline` ∥ `settings` ∥ `peer_instances` | `docs/core/design/MODEL-BENCH.md:2020` §11.10-② 实例绑定族枚举在档；`tool-docs/` 各档在盘 |
| `subagent` ∥ `advisor` | 同上 §11.10-② depth 绑定族枚举；`tool-docs/` 在盘 |
| `consult` | `thincoder-core/agent-tools.mjs:27`（`consultStartTool` / `consultStopTool` 再出口）；族名——子串式兜 `consult_start`（`agent-tools/consult.mjs:399`）∥ `consult_stop`（`:451`） |

退面证据：`ledger_*` 五名 = 弃用壳「不入任何装配面」（`ledger-tools.mjs:241-259`）；`memory_search` / `memory_put` = 已合并退役裸工具（`MEMORY.md:98`）。

**验证读数**：

- `node --check bench/toolcall/fixture.mjs` → 退出 0（Syntax OK）。
- `node --test bench/test/toolcall.test.mjs` → tests 6 ∥ pass 6 ∥ fail 0（≈586ms · 零网络）。
- 运行面读回（import 实读）：count 10 ∥ unique 10 ∥ set-equal true ∥ `TOOL_PROBE_VERSION` = 1。
- 消费面核：全仓 `OFF_PAYLOAD_TOOL_NAMES` 仅 `bench/test/toolcall.test.mjs:20`（导入）·`:151`（§11.11 结构腿）消费；冻结副本（`bench/test/toolcall-fixtures.frozen.mjs`）不含该面 ⇒ 单档改动结构正确。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| 列序 | 沿 §2.7-③ 提及序 | 「列序随落字；名集为准」 |
| `:64` 注释行零动 | 未动 | 禁动名单外任何行；原注（两族）对 10 名仍准 |
| 版本轴不 bump | `TOOL_PROBE_VERSION` = 1 保持 | §2.2-8：§11.2 六项枚举零动；名单不入 digest |
| 7 旧名全退 | 零残留在盘 | §2.7-③ 旧名分类（退役裸工具 ∥ 弃用壳） |

**审计与代码评审轮次与终态**：

- 内部 explore 偏差审计 ×1：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 面外改动）均未发现 ⇒ 无 fix。
- 内部 advisor 代码评审 ×1：**VERDICT: pass**（🔴 0 ∥ 🟡 1〔报文·非必改〕∥ 🔵 3〔报文/无需动作〕）。
- **fix round = 0**；**终态 = clean**。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🟡1 | `consult` 为族标签（现役 = `consult_start` / `consult_stop` / `main_history`）；`main_history`（`consult.mjs:89`）无名单项 ⇒ 子串式判据下该枚零告警 | 🟡 报文·非必改 | 实现与 §2.7-③ 逐字相符、名集由批档钉死 ⇒ 本批零改；越界发现附尾注（见下） |
| R1-🔵2 | 测试对名单无结构自锚（名数 / 去重 / 现役对读断言） | 🔵 报文 | 未来批次项（本批 §2.3-1 面白名单禁改测试档） |
| R1-🔵3 | §2.2-8 留修复前读数（已由 §2.7 取代，无相抵） | 🔵 无需动作 | append-only 批档 + 优先级在档（§2.7 头注） |
| R1-🔵4 | 评审基座限制（评审舱只读无 shell ⇒ 测试绿 unverified） | 🔵 无需动作 | 本笔已实跑 6/6 在案；父侧 §6 复跑闭合 |

**越界发现（尾注 · 不行动 · 候父侧/后续批次裁）**：`main_history`（consult 族现役名 —— `thincoder-core/agent-tools/consult.mjs:89`）未入名单；判据腿（`toolcall.test.mjs:152` 子串式 `block.includes`）对「V1 块点名 `main_history`」不告警。属名单口径余量（非功能缺陷）；如需收严 ⇒ 置换 / 追加 consult 族三枚 + 回写 §2.7-③ 与 §11.10-② 族枚举，另批评估版本轴。

**面外动作**：零 —— 本单仅 1 档 1 名单块。

### #946 —— VSC 端已删审批面引注 ×6 + 死转口 ×1（修复面 1 · vsc 域单 · eng-coder · 2026-10-09）

**交付摘要**：6 档 8 处落字（逐处先 read 复核——基准坐标全数命中、无漂移）。改动类 = 注释 ∥ 死导出删除（零新语义；行为面零触碰）。`tool-table.mjs:31` 复核零改候选证实（现盘已携「已删」史注 + 现役锚同句 ⇒ 按 §2.2-1 零改）。

**逐处改动（file:line；路径 = `thincoder-vscode/` 下相对）**：

| # | file:line | 改动 |
|---|---|---|
| 1 | `src/tools/index.mjs:8-9` | 注随正 ⇒ 核动作级分类消费（`agent/dispatch-gates.mjs:130` 谓词 + `dispatch.mjs` 两门禁位：权限短路 ∕ planMode） |
| 2 | `src/tools/index.mjs:40-41` | 同上（gitTool JSDoc 面） |
| 3 | `src/agent/setup-tooltable.mjs:28` | 注随正 ⇒ 核 `agent/record-results.mjs` 的 `_touchedFiles` mutation 记账同一载体 |
| 4 | `src/agent/tool-table.mjs:31-32` | **复核零改**（「已删 `execute-tools` ∕ `tool-gates`」史注 + 核两谓词 ∥ 两门禁位现役锚在盘） |
| 5 | `src/extension/peer-domains.mjs:15-18` | 注随正 ⇒ 核 `agent/dispatch-run.mjs:67` · `:79-80` · `:130` · `:150` + `agent/run-stages.mjs:171` 调用点 |
| 6 | `src/extension/permission-gate.mjs:97-98` | 注随正 ⇒ 核 dispatch 落逐项通道（`agent/dispatch.mjs:188` ∕ `:200`） |
| 7 | `src/memory-tool.mjs:43` | 注随正 ⇒ 核 `dispatch-gates.mjs` 读此分类 |
| 8 | `src/agent/run-helpers.mjs:4` · `:15` | 删死转口行（原 `export { hasCodeMutations } …`）+ 档头半句随删 |

**走查读数**：

① 六处改后 read 回执逐处命中现役锚；锚目标逐条实读核验 = `dispatch-gates.mjs:130`（`readonlyActionOf` 谓词）∥ `dispatch.mjs:59`（planMode 门）· `:170`（权限短路门）· `:188` ∕ `:200`（逐项通道）∥ `record-results.mjs:161`（`_touchedFiles` 入账）∥ `dispatch-run.mjs:67` · `:79-80` · `:130` · `:150` ∥ `run-stages.mjs:171`（`flushPeerDomains(agent)`）∥ 核 `peer-domains.mjs:274`（去重集清空 = flush 首步——旁证）。
② `grep -rn "execute-tools\|tool-gates" thincoder-vscode/src` = 恰 1 命中 `tool-table.mjs:31`「已删」史注形（§2.2-1 预期一致）；全树余存 = `.thincoder/tmp` 垃圾 ∥ vsix 打包件 ∥ `docs/_archive/**` ∥ `AGENTS.md:43`「已删」形——均设计明示不入判据。
③ `grep -rn "hasCodeMutations" thincoder-vscode/src` = 0 命中（全树余存仅 `docs/_archive/**` 归档件）。
④ 改动六档 `node --check` 全绿（×6 = `Syntax OK`）；`run-helpers.mjs` 模块加载冒烟 = import 成功、导出面 8 名、`hasCodeMutations` 不在。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| `tool-table.mjs` 零改 | 未动 | §2.2-1「复核零改候选」判据命中（史注 + 现役锚同句在盘） |
| 加跑模块加载冒烟 | 跑 | 死导出删除的针对性反馈环（引用零命中之外补链接面实证） |
| 不跑 vsc repo 套件 | 未跑 | vsc 套件现况空清单（`AGENTS.md:128-131`：2026-09-28 重置后零测试 = 绿）+ 套件归收口父侧（§2.3） |

**审计与代码评审轮次与终态**：

- 内部 explore 偏差审计 ×1：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 面外改动）均未发现 ⇒ **clean**（两观察均记录面：O-1 §5 块滞后——本块落地即消除；O-2 tmp/归档残留——设计在案）。
- 内部 advisor 代码评审 ×1：**VERDICT: pass**（🔴 0 ∥ 🟡 1〔记录面·非必改〕∥ 🔵 2〔可选/基座〕）。
- **fix round = 0**；**终态 = clean**。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🟡1 | 批档 §5 缺 vsc #946 块（记录滞后） | 🟡 协调·非必改 | 本块落地即消除；余面见各自块（状态行在案） |
| R1-🔵2 | `permission-gate.mjs:97` 锚 = dispatch 说明注释行（实装体 `:202-206`） | 🔵 可选精化 | 沿 §2.2-1 指定坐标落字 ⇒ 本批零改；后续触该档可随带精化 |
| R1-🔵3 | 评审基座限制（只读面未复跑 node --check ∥ 面白名单） | 🔵 无需动作 | §6 收口按 §2.3 逐档复跑闭合 |

**面外动作**：零——本单 6 档 + 1 档复核零改；档案面仅本 §5 块。
**台账**：#946（随收口销）。

### #1044 ∥ #1083① —— desktop 面两档（修复面 2 ∥ 4① · desktop 域单 · eng-coder · 2026-10-09）

**交付摘要**：2 档 3 处落字（逐处先 read 复核——基准坐标全数命中、零漂移；改动类 = 注释级，零新语义、零行为面）。`git diff` 证：仅上列 2 档（settings.css 注释 2 处 ∥ providers.mjs 注释 1 行）。

**改动（file:line）**：

| # | file:line | 改动 |
|---|---|---|
| 1 | `thincoder-desktop/renderer/settings.css:3` | `styles.css` 284 行句补退场注记——「（`styles.css` 后随 R13 四拆退场）」（该档现盘 ENOENT 佐证） |
| 2 | `thincoder-desktop/renderer/settings.css:10` | 自携句回位——「**该档越 300 顾问线，在册**（实读 **304** 行——口径 `split("\n").length−1`）。」 |
| 3 | `thincoder-desktop/src/main/providers.mjs:276` | 注随正——旧锚 `thincoder-core/proxy.mjs:191-200` ⇒ `thincoder-core/proxy-transport.mjs:27` ∥ `:39-55` ∥ `:177-186`（`opts.signal` 三址） |

**数字流程（§2.7-⑤ 逐字）**：回位前实读 **303**（口径 `split("\n").length−1`，endsWithNewline = true）→ 占位落句（数字位 `N`）→ 写后实读 **304** → 数字回填 = 写后实读值 304 → 复读 **304** 持稳（数字位数不改变行数——回填前后同读数）。两读数 = 303 → 304。

**走查读数**：

① settings.css 读回：`:3` 退场注记在位 ∥ `:10` 自携句在位、数字 = 写后实读 304；复读 = 304、endsWithNewline = true ⇒ 口径成立。
② 家族款对读：`thincoder-desktop/renderer/core-markdown.css:2`「该档越 300 顾问线，在册预案「核类名映射按面拆第二档」落形）」——本档句前缀同形。
③ providers.mjs `:276` 读回命中新锚；三锚逐处实读 = `proxy-transport.mjs:27`（opts.signal 注句）∥ `:39`（`const signal = opts.signal`）…`:55`（removeEventListener）∥ `:177`（`const signal = opts?.signal`）…`:186`（addEventListener）；`proxyFetch` 以 opts 下传实证 = `thincoder-core/proxy.mjs:44`。
④ `grep "proxy.mjs:191-200" thincoder-desktop/src/main/providers.mjs` = 0 命中（旧引零残留）。
⑤ `node --check thincoder-desktop/src/main/providers.mjs` = exit 0（零输出）；.css 无语法器——以读回为证（§2.3-3 口径）。
⑥ providers.mjs 改动 = 行内文本替换——该档 302 行（口径同）零变。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| 数字 = 304（不锁 303） | 写后实读回填 | §2.7-⑤「不锁 303——以写后实读为准」 |
| 自携句成文 | 「该档越 300 顾问线，在册」+ 数字 + 口径注 | §2.2-2 定形（形沿家族款）；§2.7-⑤ 数字流程 |
| 退场注记逐字 | 「后随 R13 四拆退场」 | §2.2-2 逐字 |
| 占位 → 实读 → 回填分两步 | 照办 | §2.7-⑤ 流程（防写前数字混入） |

**审计与代码评审轮次与终态**：

- 内部 explore 偏差审计 ×1：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 面外改动）均未发现 ⇒ 无 fix。（核证边界记：审计舱无 git/shell——diff 级终检留父侧 §6；304 ∥ 302 两读数经其同口径互证；O-1 §5 本块滞后——落块即消除。）
- 内部 advisor 代码评审 ×1：**VERDICT: pass**（🔴 0 ∥ 🟡 0 ∥ 🔵 2〔报文·无需动作〕；宿主引文机核 2/4——未过 2 处为报文推理旁引、非结论引文）。
- **fix round = 0**；**终态 = clean**。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🔵1 | 家族款（`core-markdown.css:2`）自携句携「在册预案」指针，本档句止于「在册」 | 🔵 报文·非必改 | §2.2-2 定形即「该档越 300 顾问线，在册」⇒ 实现逐字相符；预案指针若需增补属设计面增写 ⇒ 本批零改、候父侧/后续批裁 |
| R1-🔵2 | 评审基座限制（评审舱只读——无 git diff/shell） | 🔵 无需动作 | 实施侧读回 ∥ `node --check` ∥ grep 读数在案；父侧 §6 复跑闭合 |

**范围外发现（只报不动）**：`docs/desktop/design/SETTINGS.md:327` 行数表仍载 settings.css **303**（实读 2026-10-07）——现盘 **304**（Δ+1，本笔落句所致）；批档 §1.11 已登记「报告态，收口随正」⇒ 父侧收口项（`docs/desktop/design/PROJECT.md` §4.1 行数面同值同步纪律见 `docs/desktop/design/SETTINGS.md:329`——随父侧收口核）。

**套件注**：未跑仓库级套件——父侧收口面一次跑（本笔注释级·零行为面）。**台账**：#1044 ∥ #1083（① 面——余面见他舱块；随收口销）。

### 核心面（#1091 ∥ #1115 ∥ #1116 ∥ #1118 ∥ #1110）· eng-coder · 2026-10-09

**交底**：轻通道修复轮 · core 面五单项（§2.2-5/6/7/9/11 + §2.7 修正块）。五档六处逐处 read 复核后落字；`git diff` = 5 档 6 处（死导入删 ×1 ∥ 拒串 ×2 ∥ 显式拒 ×1 ∥ 注释 ×1 ∥ 文案 ×1），净增 +8 行。

**改动清单（file:line · 现盘）**：

| # | 落点 | 改动 |
|---|---|---|
| #1091 | `thincoder-core/memory/code-index.mjs:5` | 导入清单删 `SKIP_DIRS`（余四符号保留）——死导入删 |
| #1115 | `thincoder-core/agent-tools/batch.mjs:167-169` ∥ `:174-176` | 两拒串按模式分支域枚（工程 §1/§4/§6 ∥ 普通 §1/§2/§4/§5/§6；句式沿同档 `:183-185` 既有面）；拒面条件零改 |
| #1116 | `thincoder-core/agent-tools/batch-lifecycle.mjs:312-314` | `declared` 计算后补显式拒（传值而解析不可得 ⇒ throw；串形镜像 append 面）；未传 = 缺省语义零变 |
| #1118 | `thincoder-core/agent/write-gate.mjs:135` | 注主语收正为「携绑定的子代理（…工程角色 ∥ 普通面 coder，`BATCH-RECORD.md` §4.16）」——逐字对齐 `AGENT-LOOP-SUBAGENT.md:780`；门本体零改 |
| #1110 | `thincoder-core/tools/repomap.mjs:118` | 返回串语态逐字替换（`— Options: …` 目标串）；`${origin ? " for this origin" : ""}` 段原样；两入口同函数同文 |

**验证读数（机检 · 全绿）**：

- 语法门：五档 `node --check` 全 = Syntax OK（改后逐档实跑回执）。
- #1091：`grep SKIP_DIRS`（`thincoder-core/memory/code-index.mjs`）= 零命中。
- #1115 直调四读（探针 `.thincoder/tmp/stale-fixes/1115-append-domain-probe.mjs`）：工程面两串 = §1/§4/§6；普通面两串 = §1/§2/§4/§5/§6（红读 = 修复前普通面两串均失实作「§1/§4/§6」；绿读 = 修复后两模式各命中对应域枚）。四例全走拒面（写盘前 throw）⇒ 零副作用。
- #1116 直调两态（探针 `.thincoder/tmp/stale-fixes/1116-status-segment-probe.mjs`）——**红读（修复前）**：`segment: "banana"` ⇒ 静默视同缺省，§1 状态行被写为「进行中（probe-1116-a）」，无抛；**绿读（修复后）**：同参 ⇒ `THROW: batch: unknown segment "banana" — pass the section number you write (e.g. "§1"), or omit it. Nothing was written.` ∧ 档零写（状态行仍 = 骨架占位）；**未传** ⇒ 缺省 §1 照旧（状态行 = 「进行中（probe-1116-b）」）。
- #1118：`grep 工程角色子代理`（源码树 `.mjs`/`.js`，排除 `dist*/**` ∥ `.thincoder/**`）= 零命中；`:135` read 回执 = 新主语句（含 `工程角色 ∥ 普通面 coder`）。
- #1110：旧串（`declare index.excludePaths … or prune`）源码树零命中（余存 = `thincoder-desktop/dist-r3|r4/**/app.asar` ∥ `.thincoder/tmp/**`——§2.7-4 豁免区）；两入口 `:197` ∥ `:273` 同函数。
- 定向回归锁：`node --test docs/batches/2026-10-09-normal-work-management.test.mjs` = **9/9 绿**（T1–T8+T4b：普通面新串逐字 ∥ 缺省 §1 ∥ 工程面零变）；`node --test docs/batches/2026-09-29-batch-mechanics.test.mjs` = **5/5 绿**（写门判据直调 + 端到端）。
- 注：仓库级套件未跑——父侧收口面一次跑（沿兄弟面口径）。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| #1116 串形落法 | `batch: unknown segment <JSON> — pass the section number you write (e.g. "§<seg>"), or omit it. Nothing was written.` | 镜像 append 面 unknown-segment 串形（前缀 ∥ 破折号结构）；「or omit it」= 取段面缺省语义（append 面 segment 必填、status 面可省）；尾句沿 status 面既有惯例 |
| #1116 守卫序 | `declared` 计算后、既有两个分支之前 | §2.2-7「declared 计算后补显式拒」；既有两个分支零改 |
| #1115 句式取形 | 全串 `engineering ? … : …` 孪生（两分支各一全串，工程面逐字 = 原串） | 句式沿同档 `:183-185` 既有面 |
| #1118 收正句取形 | 含 `depth > 0` ∧ `agent._batchDoc` 在场 子句 + 「，」接 §4.16 引注 | 逐字对齐 `AGENT-LOOP-SUBAGENT.md:780`（该条自陈「对齐 :780」= 归一源）；§2.2-9 引句为其缩写形 |
| 零旁改 | 五档内非落点行零动（档头注释 ∥ 门本体 ∥ 参数描述 ∥ 两入口调用点均未动） | 落点逐字纪律 |

**审计与代码评审轮次与终态**：

- 内部 explore 偏差审计 ×1（只读子代理）：五项实现 5/5 一致（域枚对单源表 ∥ 串形镜像 ∥ 收正句逐字 ∥ 豁免区核对）；唯一发现 = §5 本面块未落（时序件）⇒ 随本块落档闭合。
- 内部 advisor 代码评审 ×1：**VERDICT: pass**（🔴 0 ∥ 🟡 1〔报告项·处置权父侧〕∥ 🔵 4）。
- **fix round = 0**；**终态 = clean**（唯一 🟡 = 设计面余量，处置权父侧——见尾注 ①）。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🟡1 | `code-index.mjs:5` 余四符号中 `CODE_EXTS` ∥ `DOC_EXTS` 同为档内零消费死导入（本席复核：两枚除 `:5` 外零出现；`BIG_FILE_LINES` `:71` ∥ `segmentCJK` `:166`/`:212` 有消费） | 🟡 报告·非必改 | 落字与 §2.2-5 逐字相符（「余四符号保留」）⇒ 不越设计面直改；尾注 ① 候父侧二择（建议并入本轮 ∥ 或挂账） |
| R1-🔵2 | `write-gate.mjs:138` 豁免行「非工程绑定族」括注窄于门射程（普通面 coder 亦可携绑定） | 🔵 报告 | 零改（落点仅 `:135`）；下次触碰本档时收「未携绑定」 |
| R1-🔵3 | #1118 落字与 §2.2-9 引句形态差（归一源 = `AGENT-LOOP-SUBAGENT.md:780`） | 🔵 报告 | 零改；§6 逐字对读基准 = `:780`（判据 §2.7-2 两项已核过） |
| R1-🔵4 | #1115/#1116 无仓库级常驻断言（`thincoder-cli/test/**` 零命中） | 🔵 报告 | 零改（本批 §2.3-5 明定直调复核口径）；未来触碰 batch 面时补（或挂账） |
| R1-🔵5 | 评审基座限制（探针无法由评审舱复跑） | 🔵 无需动作 | §6 复跑两探针闭合（同兄弟面处置） |

**越界发现（尾注 · 不行动 · 候父侧裁）**：

① `CODE_EXTS` ∥ `DOC_EXTS` 死导入余量（#1091 同族——见 R1-🟡1；本席 grep 复核在案）。建议二择：优先 ①-a 并入本轮（§2.7 类修正块 + 删两枚，闭集内零风险）；或 ①-b 挂台账另轮。
② `thincoder-core/agent-tools.mjs:23` ∥ `thincoder-core/agent/family-tools.mjs:166-167`：注释仍以模式无关形列 depth-0 域枚（「append §1/§4/§6 + status §1」）——与 #1115 同类残留，两档不在本面落点 ⇒ 建议挂账另轮。

**面外动作**：零 —— 本单 = 五档六处 + 两枚探针（`.thincoder/tmp/stale-fixes/`，temp 区，非源码面）。

**台账**：#1091 ∥ #1115 ∥ #1116 ∥ #1118 ∥ #1110（随收口销）。**套件注**：仓库级套件未跑（父侧收口面一次跑）；定向回归锁两枚已跑全绿（读数见上）。

### #1083 第二/三处 —— settings-providers.js 两处坐标注随正（修复面 4 · vsc 域单 · eng-coder · 2026-10-09）

**交底**：轻通道（收敛面·缺陷修复——批档 §2.2-4 ②③）。**改动** = `thincoder-vscode/webview/settings-providers.js` 单档两处（注释级行内坐标替换·行数中立·零新语义）：
① `:47` 注「卡 HTML `:123`」⇒ `:137`——目标 = `providersCardHtml()` 内 `data-name` ✕ 载体钮现盘行（read 复核命中）；
② `:159` 注「`settings.js:185`」⇒ `:190`——重绑调用位 = `settings.js` `buildSettings()`（`:185` 起）内 `bindAddProviderForm()` 调用（read 复核命中，与设计无相抵 ⇒ 无需上抛）。

**走查读数（验收四条）**：① read `:47` 命中 `:137`（编辑回执 ∥ 复读双在位）；② read `:159` 命中 `:190`；③ 该档 `settings.js:185` grep 零命中——全仓余命中 2 族均合法不入本笔：`docs/batches/2026-10-08-residue-sweep.md:145`（`settings.js:185-199` 函数区间——现盘 `buildSettings()` 仍 185–199，准 ∥ 记录面）+ 本批档自身三行（`:72` ∥ `:195` ∥ `:197`——as-found 引述·append-only）；④ `node --check thincoder-vscode/webview/settings-providers.js` = exit 0（零输出）。旁证：`git diff` = 单档两行（±1 ×2·纯注释·余行零动）；该档 `:123` 零残留；`SETTINGS.md:207`（入口册 #4 载 `:137`）∥ `:287`（装配位 `settings.js:190` · `settings-providers.js:177`）同锚逐字一致（本席直读）；行数面现盘 = 193（`split("\n").length−1` 口径 ∥ HEAD 同读——零行数变动）。

**决策透明**：零自选口径——两处落字逐字沿 §2.2-4；无旁改（他档零动；`providers.mjs:276` 第一处未触——另舱承接）。

**审计与评审轮次与终态**：内部 explore 偏差审计（只读子代理）= 轮 1 → `CLEAN / no divergence`（四类偏差零发现；其报行数面 193/194 疑点经本席 git+口径直读落定 = 读法口径差〔read 计 split 长度未减一〕，零实际差异）。独立代码评审（advisor · code）= 轮 1 → **VERDICT: pass**（🔴 0 ∥ 🟡 1 ∥ 🔵 2）。**fix round = 0**；**终态 = clean**。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🟡1 | 本舱 §5 块缺位（记录滞后） | 🟡 协调·非必改 | 本块落地即消 |
| R1-🔵2 | `settings-providers.js:103` 注引 `rebuildSettings`——全仓零命中（实为 `buildSettings()`——`settings.js:185`） | 🔵 范围外 | 本批零改（§2.2-4 钉死两处）；范围外尾注（候后续 sweep） |
| R1-🔵3 | 评审基座限制（只读无 git/shell——diff ∥ `node --check` 由实施侧直跑） | 🔵 无需动作 | 读数在案（本块走查段）；父侧 §6 复跑闭合 |

**范围外发现（只报不动）**：
1. `webview/model-menu.js:7` 注「`settings-providers.js:9`——默认模型菜单」：现盘 `:9` = settings-widgets 导入行，`openModelMenu` 导入实为 `:10`（消费 `:83`）；对称锚 `settings-models.js:6` = 该档 model-menu 导入行 ⇒ 指位差一（陈旧形）。更正载体 = `model-menu.js`（本单范围外）。候父侧裁/后续坐标 sweep。
2. 同 R1-🔵2（`settings-providers.js:103` `rebuildSettings` 陈旧符号名）。

**台账**：#1083（随收口销——本单 = 第二/三处；第一处 `providers.mjs:276` 归另舱）。**套件注**：未跑仓库级套件——父侧收口面一次跑（本项注释级·零行为面）。

### 修正轮 · 三处点修（§2.8 ∥ §2.9 · 父侧派单）· eng-coder · 2026-10-09

**交付摘要**：3 档 3 处逐字级落字（逐处先读后落——基准坐标全数命中、零相抵）；改动类 = 注释 ×2 + 死导入删 ×1（零新语义、零行为面）。号面外零动（`code-index.mjs` 余行与 `SKIP_DIRS` 已删状态保持 ∥ `settings-models.js` 未触 ∥ core/vsc 余档未触）。工作树本单 = 3 档 3 行（逐档 `git diff` 核；`settings-providers.js` 该档另两行与 `code-index.mjs:5` 的 `SKIP_DIRS` 删除 = 同批兄弟块在录面，非本单面）。

**逐处改动（file:line）**：

| # | file:line | 改动 |
|---|---|---|
| ①（§2.8） | `thincoder-core/memory/code-index.mjs:5` | 导入清单删 `CODE_EXTS` ∥ `DOC_EXTS`——余 `segmentCJK` ∥ `BIG_FILE_LINES`（`:71` ∥ `:166`·`:212` 档内实消费） |
| ②（§2.9-①） | `thincoder-vscode/webview/settings-providers.js:103` | 注内 `rebuildSettings` ⇒ `buildSettings`（逐字；真值 = `settings.js:185`） |
| ③（§2.9-②） | `thincoder-vscode/webview/model-menu.js:7` | 注内 `settings-providers.js:9` ⇒ `:10`（逐字；两锚 = `settings-models.js:6` ∥ `settings-providers.js:10` 均 `openModelMenu` 导入行） |

**验证读数（机检 · 全绿）**：① 档内两符号零命中 ∥ `node --check` exit 0 ∥ 模块加载冒烟 = import OK、导出 9 名（合 §2.8「导出面 = 9 函数」）；消费面核 = `file-list.mjs:7` 直连 `schema.mjs`、`memory.mjs:7/15` 未动 ⇒ 零断裂。② `:103` read 命中 `buildSettings` ∥ vsc 树 `rebuildSettings` 零命中 ∥ `node --check` exit 0。③ `:7` read 命中 `:10` ∥ 两锚对盘实读成立 ∥ `node --check` exit 0。仓库套件 = 父侧收口面一次跑（沿兄弟面口径）。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| 三处逐字替换 | 照办（零自选口径） | §2.8 ∥ §2.9 改法 |
| 加跑模块加载冒烟 | 跑 `import()` | 死导入删除的针对性反馈环（§2.8 判据项） |
| 号面外不触 | 守住 | 父侧「本轮不做」三条 |

**审计与评审轮次与终态**：
- 内部 explore 偏差审计 ×1（只读子代理）= 轮 1 → 3/3 一致、四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 面外改动）零发现 ⇒ **CLEAN**。
- 内部 advisor 代码评审 ×1 = 轮 1 → **VERDICT: pass**（🔴 0 ∥ 🟡 1〔非必改〕∥ 🔵 2）。
- **fix round = 0**；**终态 = clean**。

**评审响应表**：

| 轮次 | 发现 | 级别 | 处置 |
|---|---|---|---|
| R1-🟡1 | `model-menu.js:5` 注块「消费面三处」枚举缺 `settings-consult-dialog.js`（`:17` 导入 ∥ `:80`·`:127` 调用） | 🟡 非必改（号面外） | 本批零改（父侧「本轮不做」）；尾注 ① 候父侧裁 |
| R1-🔵2 | 批档 §2.3-1 面白名单「19 档」未随 §2.9 增档（有效 = 20 档） | 🔵 报文 | 收口按 §2.4 ∪ §2.9 取并；父侧 §6 执行 |
| R1-🔵3 | 评审基座限制（只读席无法复跑机检） | 🔵 无需动作 | 实施侧读数在案；父侧 §6 复跑闭合 |

**越界发现（尾注 · 不行动 · 候父侧裁）**：

① `thincoder-render-core/composer/model-menu.mjs:10` 载同事实第二活体载体（仍作 `settings-providers.js:9`——与 `model-menu.js:7` 修正后态相抵）；该档非本轮号面（§2.9 只列 `model-menu.js`）。父侧若判并入：按 §1.12 补正先例另派/随带；否则随 sweep/挂账。
② `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 抽样 4 处对现盘不命中：`:514` `webview/settings-providers.js:68` ⇒ 现 `:51` ∥ `:520` `:39` ⇒ 现 `:37` ∥ `:517` `:89` ⇒ 现 `:58` ∥ `:532` `:62` ⇒ 现 `:45`（对应发射点实读）。该档自陈「本表坐标 = 唯一读值」（历轮 sweep 刷新）⇒ 疑 sweep 待办、非冻结记录；无定级，建议归 sweep/台账复核。
③ 打包件（`.thincoder/tmp/desktop-dist-*` asar）内仍载修前注文——§2.7-④ 豁免（随重建刷新），不入判据。
④ `thincoder-core/index-discover.mjs:20`·`:27` 另携同名 `CODE_EXTS`/`DOC_EXTS` 局部常量（非本档导入面；与 `schema.mjs` 两处表并存）——仅登记事实，无动作。

**面外动作**：零（3 档 3 处 + 记录面）。**台账**：#1091 ∥ #1083（随收口销）。

## §6 验证与收口（父代理）

### 6.1 修复面逐项验收（父侧 · code 10 项 + doc 1 项）

| 项 | 落点 | 父侧读数 | 判定 |
|---|---|---|---|
| #946 | vsc 6 档 8 处注随正 + `run-helpers` 死转口删 | 旧档名余存恰 1 = `tool-table.mjs:31` 史注形（设计预期）；`hasCodeMutations` 零命中；6/6 `node --check` + 模块加载冒烟 | ✅ |
| #1044 | `settings.css` 档头自携句回位（写后实读 304）+ `styles.css` 句退场注记 | 两读数 303→304；`.css` 读回在位；`docs/desktop/design/SETTINGS.md:327` 父侧随正（304 + 前读链） | ✅ |
| #1074 | `views-me.mjs:9` ⇒ `dom.mjs:63` | read 命中 ∥ 该档 `app\.mjs` 零命中 ∥ `node --check` exit 0 | ✅ |
| #1083 | `providers.mjs:276` ⇒ 三址；`settings-providers.js:47/159` ⇒ `:137`/`settings.js:190` | 逐处 read 命中；`proxy.mjs:191-200` 与 `settings.js:185` 零残留 | ✅ |
| #1091 | `code-index.mjs:5` 死导入删（`SKIP_DIRS` + §2.8 追加 `CODE_EXTS`/`DOC_EXTS`） | 三枚档内零命中；`node --check`；模块加载冒烟（`import()` 成功） | ✅ |
| #1115 | `batch.mjs` 拒串模式分支 ×2 | 直调四读：工程 §1/§4/§6 ∥ 普通 §1/§2/§4/§5/§6（先红后绿在 §5） | ✅ |
| #1116 | `batch-lifecycle.mjs` 非法 segment 显式拒（镜 append 面串形） | 直调两态：修复前静默视同缺省 → 修复后 THROW + 档零写；未传 = 缺省零变（§5 实录） | ✅ |
| #931 | `fixture.mjs` 名单 16→10（退 7 增 `ledger`；`memory` 原在列） | 父侧复跑 `node --test bench/test/toolcall.test.mjs` = 6/6；`TOOL_PROBE_VERSION` = 1；档 149→148（Δ−1，预算内） | ✅ |
| #1118 | `write-gate.mjs:135` 注主语收正 | 旧句（`工程角色子代理`）零命中 ∧ 新句 read 命中；门本体零改 | ✅ |
| #1110 | `repomap.mjs:118` 语态逐字（`${origin…}` 段原样） | 旧串源码树零命中（`dist*/`·tmp 豁免区不入判据）；两入口同文 | ✅ |
| #1066 | doc 面：`WEBVIEW.md` sweep（≈130 处）+ `DOC-DISCIPLINE.md:1622` 事实行 | 逐锚记录 = §1.10 ∥ §1.11（枚举 → 六批编辑批回执全绿 → 抽检 4/4 → 两红夹修 → 复跑全绿）；两档变更记录行在档 | ✅ |

### 6.2 机检七条（§2.3）读数

- **① 面白名单**：本批改动集 = **30 档**（code 18〔17 改 + 1 复核零改〕∥ doc 11 ∥ 批档 1）——逐档 `git diff --stat` 在位（17 档 code 有 diff；`tool-table.mjs` 零 diff = 复核零改按设计）；他流在编档（80+）一律不入本批提交面（scoped 比对 + 路径限提交）。
- **② 逐项复核** = §6.1 表（11/11 ✅）。
- **③ 语法门**：17 档 `.mjs`/`.js` `node --check` = **17/17 pass**；`.css` 读回为证。
- **④ 零新语义 diff 分类**：全 17 档 = +37/−30 行——五类（注释 ∥ 文案串 ∥ 死导入 ∥ 名单 ∥ 坐标）；行为面仅 #1116（既有语义归位——直调两态实证）；结构 / 导出面零变（`run-helpers` 导出 9→8 = 死名退场）。
- **⑤ 工具面回归**：bench 6/6 绿（父侧收口复跑）；#1115/#1116 直调两态记录在 §5；仓库级套件（收口一次跑）= **manifest 空 ⇒ 零测试 = 绿**（2026-09-28 重置后现况——本批实际回归面 = bench + 直调 + 定向两档：`node --test docs/batches/2026-10-09-normal-work-management.test.mjs` 9/9 ∥ `2026-09-29-batch-mechanics.test.mjs` 5/5——§5 在案）。
- **⑥ doc-check**：复跑**全绿**（exit 0——`OK(锚) 0 条悬空` ∥ `OK(行宽) 无 >300` ∥ `行数面 差异 0 条`）。首轮红项（我 sweep 引入的 8 悬空 ∥ 1 超宽）+ 桌面行数面 1 条 = 全部夹修归零（§1.11；桌面 `SETTINGS.md:327` 随正 = 父侧直接执行·机械计数·可 revert）。
- **⑦ 收口** = 本节 + 台账销行 24 行 + 记录冻结 + 提交推送 + 槽耗。

### 6.3 收口记录

- **#1066 逐锚复核记录**（§2.2-10 约定入 §5——工程模式父侧无 §5 写权，实落 §1.10 ∥ §1.11）。
- **旁见复核**（§2.7 束报：`§2.2-10` 载「870 行」vs 设计师读 869）：现盘 `split("\n").length−1` = **870** = §2.2-10 在册值（869 = sweep 中途读数）——零改。
- **笔期新增挂账**（归批 · 不动）：#1132 ∥ #1141 ∥ #1142 ∥ #1143 ∥ #1144 ∥ #1145。
- **提交** = 路径限两笔：`fix: stale comment/string/dead-import sweep — vsc/core/desktop/server/bench (#1131)` ∥ `docs: stale-fixes round — #1066 sweep + pens + batch record (#1131)`（档面逐档 = 本节①清单；读数入台账 evidence）。
- **推送** = origin（gitee）∥ github 双推，推送核验读数入报。
- **凭证槽** = consume-design（收口链终端；读数入报）。
- **冻结** = §1 状态行「已收口」（batch close）。
