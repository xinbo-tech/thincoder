# 可移植性 VSC 镜像面（批次二）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 16:43「thincoder 是通用 coding agent，不要跟自身绑死的那个事儿已经处理了吧？」→ 16:45「**一起做了吧**。同时查一下 vsc 端还有哪些没做的，都一起做了」。

---

## §1 讨论（主 agent）

### 一、背景与现状（父侧实证）

- **批次一（CLI 面）= 已收口**：`batches/2026-09-11-PORTABILITY.md`——A 家族 **P1–P10（🔴 静默失效 10 项）+ P14** 全链闭环（两轮评审 → 交付 18 源 + 6 提示词 + 4 测试 → §6 → token 已消费）。
- **本批 = 批次二（VSC 镜像面）**：设计排序明载（`design/PORTABILITY.md` §1.4：「**VSC 镜像面（同源语义镜像 A 家族——两端漂移窗口越短越好）**」）；父侧实证 VSC 仓**零提及**「可移植/PORTABILITY」——未开始。
- 批次三（B/C 剩余 P11–P13、P16–P28）仍登记（技术待办组）——**不在本批**。

### 二、范围（用户「一起做了吧」）

- VSC 端 A 家族对位面：**同源语义镜像**——对 CLI 设计 §9 清单（P1–P10 + P14）在 VSC 代码/提示词中的对位点逐条勘察与设计；
- **双端镜像纪律**：各端独立实现、语义同源（不做 byte-identical、不加双端同步依赖）；禁以任一端产物回改另一端；
- **预授权**：VSC 对位设计档如需新建（`thincoder-vscode/docs/design/PORTABILITY.md`）——父侧预授权（先例：CLI 批 §1.5）。

### 三、边界

- 不含批次三（B/C 剩余）；不含其它 VSC 待办（另勘察归批——explore id=147 在跑）；
- 需求层：VSC 无 requirements 树——需求陈述并入 CLI `requirements/PORTABILITY.md`（先例：VSC-GUARD / WEBVIEW 批）。

### 四、状态

**讨论收敛 2026-09-11 16:45**（用户「一起做了吧」）。下一步 = §2 批次任务（eng-designer）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

### 批次任务（eng-designer 自写——2026-09-11）

**目标与理由**：VSC 端（批次二）A 家族对位镜像——消除 P1–P10 + P14 在 VSC 代码/提示词中的同族缺陷（判据副本四处散落 / 评审注入静默跳过 / Project Guide 注入缺失 / 索引扩展名表窄 / 提示词本仓引用）。
判据 = **双端语义同源**（各端独立实现、不做 byte-identical、禁以任一端产物回改另一端）；修复方向 = 通用化 + 声明可诉 + 降级可见。

**范围裁定（勘察三态——VSC 档 §1.2 逐条表）**：**需修 10 项**（VP-1–VP-7 · VP-9–VP-11）· **补缺口 1 项**（VP-12——Project Guide 注入，CLI §9 点名真缺口）· **已对位 2 项**（P14 本体——VSC `eng` 无门禁、无对位物；P8 索引侧——VSC `indexer.mjs:231-246` 已有非 git walk 回退——差异登记）。
**明确出批**：P11–P13 / P16–P28 的 VSC 对位（批次三）· VSC 端其它待办（另批勘察归批）· CLI 批次一产物（只读引用）。

**设计档** = `thincoder-vscode/docs/design/PORTABILITY.md`（权威正文：三态对位表 §1.2 · 条目 §1.3 · 逐条修法 §3 · 接口契约与逐字文本 §4 · 受影响文件 §5 · 用例 §6 · AC §7）。
**需求档** = CLI `docs/requirements/PORTABILITY.md` §5（批次二范围与判定句——本批已落）；**CLI 设计档 §11** = 登记回指（本批已落，不复制正文）。

**本批条目（三方一致锚——VSC 档 §1.3 同表）**：

- VP-1 ← P1：文档地图声明键 + 降级句（去固定路径静默跳过） · VP-2 ← P2：标准文档声明制 + 降级句（METHODOLOGY 注入移除）
- VP-3 ← P3：指令文本去 METHODOLOGY（messages + advisor-design） · VP-4 ← P4：advisor-design 双源去本仓引用（EN 4 处 + CN 4 处）
- VP-5 ← P5：纪律层去树形状（EN 3 处 + CN 1 处） · VP-6 ← P6：纪律层去流程文件假设（EN 4 处 + CN 3 处） · VP-7 ← P7：自指脚本全删（EN 1 处 + CN 2 处）+ R24 行 EN/CN 对齐
- VP-8 ← P8：评审侧 NO_GIT_NOTICE（索引侧已对位） · VP-9 ← P9：索引扩表 / 声明并集 / 未列入可见
- VP-10 ← P10·P25：判据单一权威 + 声明面 + 全接线（新建 VSC `conventions.mjs`） · VP-11 ← P14·P15：文案去 `in docs/`（eng 工具 + 门禁 hint + 拒绝文案）
- VP-12 ← §9 缺口：Project Guide 注入补缺（review context——`advisor-round1.md:7` 锚落地）

**实现面（4 面——文件域不相交；②③ dependsOn ①（共用 `conventions.mjs`）；④ 独立）**：

- 面① 分类核心：`src/conventions.mjs`（新）+ `advisor/repos.mjs` / `agent/execute-tools.mjs` / `agent-tools/advisor.mjs` / `agent-tools/verify.mjs` / `agent/run-helpers.mjs` / `agent-tools/advisor-async.mjs` / `advisor/main.mjs`（注释）（VP-10/11）
- 面② 注入：`src/advisor/project-context.mjs`（新）+ `advisor/messages.mjs`（VP-1/2/3/8/12）
- 面③ 索引：`src/index-discover.mjs` / `indexer.mjs` / `extension/panel-index.mjs`（VP-9）
- 面④ 提示词六档：`src/prompts/*` + `docs/design/prompts/*`（三档双源——逐字 = 设计档 §4.4；VP-3–VP-7 提示词面）

**受影响文件**：源 14（含新档 2）+ 提示词 6（双源）+ 测试 3 新 + 文档面；全表（行数 / 增量）见设计档 §5。
**父侧维护面**（不入 coder `files` 声明）：VSC `docs/design/README.md`（新板块登记 + 镜像差异表 #3/#4 对照更新）· VSC `docs/TODO.md`（登记）· CLI `docs/TODO.md`（核销）· CHANGELOG。

**验收标准**：AC-V01–AC-V14（设计档 §7——逐条回指 VP / FR）；用例 T-V01–T-V19（设计档 §6——正常/边界/错误三态）。
**机器判据**：`node test/run-fast.mjs` 全绿（VSC）+ `node scripts/check-doc-width.mjs` 新增超宽 0 / 一致性新增违规 0（两仓）+ 受改文件 ≤500 / 新档 ≤300。
**回归面（零改预期）**：`prompts-mirror-anchors`（跨仓逐字锚——编辑点已逐一避让）· `prompts-async-guidance` · `doc-consistency` · `advisor-chain-guards` · `eng-settlement` · `verify-redesign` · `index-perception`。

**红线**：
① 提示词只动设计档 §4.4 编辑点，跨仓逐字锚零触碰（红线表 = 设计档 §3.6 + `test/prompts-mirror-anchors.test.mjs` 锚表）；
② 不碰他链在途档（VSC `ENGINEERING-MODE.md` / `ADVISOR-CONVERGENCE.md` §13.10/§14 / CLI 批次一已收口产物）；
③ 提示词 = 主 agent 内容权 + coder 机械落笔（逐字 = 设计档 §4.4；CN 档为中文权威）；
④ 端特有段（R14 池规则等）原地保留；⑤ 派工时以设计档为任务书主体，本段为入口与守则。

**未决面（父侧/用户）**：VSC 本仓 dogfood `.thincoder/conventions.json`（设计档 open-1）· round 提示词 CN 档对应位（open-2）· R24 行标注化（open-3）。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；零新语义；本追加与上方文本冲突处，以本追加为准）

**背景**：轮次 1 VERDICT = changes-required（🔴 1 · 🟡 3——发现表见 §3 轮次 1）。父侧裁决：4 条全部落修、零新语义；本轮只改文档（设计档 + 本档），`src/**` 零改动、未发起评审、未 commit。

**4 条落点（逐条——设计档 `thincoder-vscode/docs/design/PORTABILITY.md`；行号 as-of 落修后 2026-09-11）**：

| # | 严重度 | 落点 |
|---|---|---|
| 1 | 🔴 | §4.4(c) `:18` 行改 EN 形态（设计档 :295-296）：old `(e.g. \`docs/design/AGENT-LOOP.md:180\`)` → new `(e.g. \`path/to/file.md:42\`)`（照 CLI EN 已交付——`thincoder/src/prompts/advisor-design.md:18` 实测）；CN `:39` 行维持现写法（零改） |
| 2 | 🟡 | §4.4(a) `:213` 行新文本补「（CLI 侧）」（设计档 :273）——EN 目标与 CN 现形态（`docs/design/prompts/discipline-engineering.md:139`）逐字同文（脚本逐字符核验 123/123）；§1.4「逐字对齐」（设计档 :69）与 T-V18「两档同文」（设计档 :406）断言随之一致（选项①：保断言、不降级） |
| 3 | 🟡 | §4.3 两条落笔边界：(a) 门禁前缀 `Error: engineering design gate — ` 保留、其后段替换（设计档 :248）；(b) design 分支追加句插为第 `3.` 项、原 3./4. 顺延为 4./5.（设计档 :237；CLI 已交付口径——`thincoder/src/advisor/messages.mjs:175`） |
| 4 | 🟡 | 下方「范围裁定三态计数更正」 |

**§2 范围裁定三态计数更正（#4——本追加为准）**：VP-8 明确归入需修——**需修 11 项（VP-1–VP-11）· 补缺口 1 项（VP-12）**（父侧二选一 → 取「VP-8 归入需修」口径；合计 = 设计档 §1.3 全量 12 条，逐条 0 差异）；**「已对位 2」= 方面登记而非条目**（P8 索引侧 / P14 本体——§1.2 三态表差异登记面；其非对位部分即 VP-8 · VP-11，已含于上列 11 项）。AC-V14 三方比对按本口径引用。

**自检**：设计档回读核验 4 条落点全部在位（脚本逐字符比对通过）；VSC 仓 `check-doc-width` OK（宽度 0 超宽 · 一致性新增违规 0）；CN `:39` 行零改动；`src/**` 全域零触碰。

### 微修（2026-09-11——父侧裁定）

- **微修（CN 目标反引号对齐）**：设计档 `thincoder-vscode/docs/design/PORTABILITY.md:307` §4.4(d) `:39` 行「新」列 —— `（如 path/to/file.md:42）` → `（如 \`path/to/file.md:42\`）`；依据 = CLI CN `thincoder/docs/design/prompts/advisor-design.md:39` 实测（含内层反引号；更新修正轮 #1「CN `:39` 维持现写法」句）。零其它改动。

## §3 设计评审（评审子代理）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

### 评审发现（批次二 · VSC 镜像面——设计评审第 1 轮）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（逐字目标） | 🔴 | §4.4(c) `:18`（EN 档）旧/新文本为 CN 形态：设计 `thincoder-vscode/docs/design/PORTABILITY.md:293-294` 写 old=`` （如 `docs/design/AGENT-LOOP.md:180`） `` / new=`` （如 `path/to/file.md:42`） ``，但 EN 档实文 `thincoder-vscode/src/prompts/advisor-design.md:18` = `` (e.g. `docs/design/AGENT-LOOP.md:180`) ``，CLI 已交付 EN 文本 = `` (e.g. `path/to/file.md:42`) ``（`thincoder/src/prompts/advisor-design.md:18`）。机械落笔会：旧串在 EN 档找不到（no-op/停报），或按写定文本把全角中文形态写进 EN 档——与 §2 D6 同文口径及本档 T-V17「§4.4 逐条」冲突。 | 该行改为 EN 形态：old `(e.g. `docs/design/AGENT-LOOP.md:180`)` → new `(e.g. `path/to/file.md:42`)`（照 CLI EN 已交付文本）；CN 行 `:39` 维持现写法。 |
| 2 | Clarity（逐字目标） | 🟡 | §4.4(a) `:213` EN 目标比 CN 现形态少「（CLI 侧）」（设计 :271 vs `thincoder-vscode/docs/design/prompts/discipline-engineering.md:139`），而 §1.4（:67-69）声明「EN 逐字对齐 CN 现形态」、T-V18（:406）断言「R24 行两档同文」——三处不自洽。 | EN 目标补「（CLI 侧）」，或把 T-V18 措辞降为「引用形态一致」（二者选一），§1.4 的「逐字」口径随之一并对齐。 |
| 3 | Clarity（落笔边界） | 🟡 | §4.3 未写明落笔边界：(a) 门禁文案现值含前缀 `Error: engineering design gate — `（`thincoder-vscode/src/agent/execute-tools.mjs:110` 实测），§4.3（:245）只给后段文本、未说前缀去留（CLI 对位面 = hint 字段 + 外层 Error 包装；VSC 无外层，删前缀后该拒绝失去 error 形态）；(b) design 分支追加句给定为 `3. If the ## Project Guide …`（:236），而现列已有 `3. Do NOT run git diff …`（`thincoder-vscode/src/advisor/messages.mjs:173`）——插入位置/重编号未述（CLI 已交付 = `3.` 位 + 顺延，`thincoder/src/advisor/messages.mjs:175`）。 | §4.3 各补一句落笔说明：门禁前缀保留与否（建议保留 `Error: …` 前缀再串新句，或明确整串替换）；追加句插为第 3 项、原 3./4. 顺延为 4./5.。 |
| 4 | Requirements（三方一致/计数） | 🟡 | 批次档 §2 三态摘要与自身条目表不闭合：`thincoder/docs/batches/2026-09-11-PORTABILITY-VSC-MIRROR.md:42` 的「需修 10 项（VP-1–VP-7 · VP-9–VP-11）」未含 VP-8（评审侧 NO_GIT_NOTICE——同段 :53 明列条目）；「已对位 2 项」指 P8/P14 的方面而非条目——12 条 VP 与 10+2+1=13 口径混用（设计 §1.2 逐条表本身自洽）。 | VP-8 明确归入需修（→「需修 11 项（VP-1–VP-11）」），或注明「已对位 2 = P8/P14 的已对位面，其余部即 VP-8/VP-11」；AC-V14 三方比对据此引用。 |

**已验证（支持性证据，非发现）**：§3.6 红线避让声明实质成立——逐一核对 `test/prompts-mirror-anchors.test.mjs` 锚字面（A1–A12 / ⑥ 同文组 / ⑦ common / ⑧ RF）与 §4.4 全部编辑点，无交集；「与 CLI 已交付同文」抽查（discipline :44/:59/:73/:171/:177/:181/:213、messages :175/:267/:246、persona :13/:27、advisor-design EN :5/:9/:10/:24）逐字相符。

**未核实项（unverified——不支撑通过）**：§4.2 四降级句常量与 CLI `project-context.mjs` 逐字比对；CN `advisor-design.md:39` 新文本 vs CLI CN 已交付；AC-V04「`Read METHODOLOGY.md` 全仓零命中」可达性（src/ 非 prompts 面与 round 档未全量 grep）；P8「索引已对位」/P14「本体已对位」本体核验（`indexer.mjs:231-246` / `eng.mjs:64-80` 未读）。

**计数**：🔴 1 · 🟡 3 · 🔵 0（共 4 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**单轮校验范围**（轮次 2——5 件修正落点只读复核，锚点 ±10 行）：① 设计档 `:295-296`（EN `:18` 形态）· ② `:273`（「（CLI 侧）」）· ③ `:237`/`:248`（§4.3 落笔边界）· ④ 本档 `:79-94`（三态计数）· ⑤ `:307`（CN `:39` 反引号）。未通读、未探索范围外文件。

**发现表**：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene（引数漂移） | 🔵 | 批次档 §2 修正轮 #2 条目（`thincoder/docs/batches/2026-09-11-PORTABILITY-VSC-MIRROR.md:88`）引「T-V18『两档同文』（设计档 `:406`）」；实测 `thiencoder-vscode/docs/design/PORTABILITY.md:408` = T-V18 行（该档 `:406` = T-V16 行）——与本档 `:83`「行号 as-of 落修后」口径差 2 行（round 1 亦引 `:406`——疑为落修前口径沿用、落修后未随测）；本批其余设计档引数（`:295-296` / `:273` / `:237` / `:248` / `:307` / `:69`）实测相符。 | 复核后将 `:406` 更正为 `:408`（append-only 下可在微修条口径追加更正，或注明测量时点）；非阻断。 |

**落地核验（逐条，实测）**：① `:295-296` EN 形态 old→new 在位；② `:273` 新文本含「（CLI 侧）」在位（与 CN `:139` 逐字等式 = 父侧脚本声明 123/123——CN 侧文件未在只读范围，未复核）；
③ `:237` 插第 `3.` 项 + 原 3./4. 顺延、`:248` 保留前缀 `Error: engineering design gate — ` 在位；④ 本档 `:92` = 「需修 11 项（VP-1–VP-11）· 补缺口 1 项（VP-12）」（11+1 = 设计档 §1.3 全量 12 条）在位；
⑤ `:307`「新」列内层反引号在位。无残遗：(c) 区无 CN 形态残留；本档 `:98` 对修正轮 #1「CN `:39` 维持现写法」句为明文替换（append-only 跨条目更替，成立）。

> 〔父侧代笔：折行——§3「落地核验」行（原单行 385 字符）按空白归一逐字折行，零增删；父侧落笔打标。〕

**计数**：🔴 0 · 🟡 0 · 🔵 1（共 1 条）。

VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 17:50 父侧代签**——用户 16:40 授权窗口（「自动推进到全完成」）+ 16:45「一起做了吧」；三条件齐备：轮次 1（changes-required 🔴1🟡3）→ 修正轮 4/4 + 微修 1/1 → **轮次 2 = pass**（0🔴 · 0🟡 · 1🔵）+ **token 已签发**（值不落档）。

**勘误（🔵#1 处置）**：本档 §2 修正轮 #2 条目 `:88` 引「T-V18（设计档 `:406`）」→ **更正为 `:408`**（实测 T-V18 = 设计档 `thiencoder-vscode/docs/design/PORTABILITY.md:408`；`:406` = T-V16）——按 append-only 以本行为准。

**批准范围**：VSC 仓——VP-1–VP-11（需修 11 项）+ VP-12（补缺口 1 项）+ 用例 T-V01–T-V19；实施者 = eng-coder（设计 token 门）；文件以设计档 §5 清单为准（六档提示词双源 + `src/**` + 测试——超声明如实披露）。

**修正轮二选一决策维持**：#2 取「EN 目标补「（CLI 侧）」」· #4 取「VP-8 归入需修」。

**行权冲突裁定（2026-09-11 18:20 父侧）**：`persona-eng-designer.md` 的 **todo 归属句**（4 档）已于本日由 **POOL-LEDGER** 批落笔（归属修订：「todo 状态推进（记录 + 状态推进 + 物理落笔）= 主 agent」）；本批（批次二）设计/测试若涉该档该句 → **该行零动**（防覆盖）；其余目标行按**现读字符串键控**落笔。T95/T-20 侧：POOL-LEDGER 已同步其过期断言（其披露——`test/portability-advisor-context.test.mjs:111-112`）。

**遗留**：commit 待父侧随批提交。

**勘误（行号漂移——2026-09-11 18:00 父侧）**：VSC 两档目标行号因他链落笔漂移——`thincoder-vscode/src/prompts/discipline-engineering.md` 目标句 `:213` → **现落 `:217`**（他链 +4 行块，17:34-17:36 落笔）；同链两档行数 222→226 / 150→153。**实现按字符串键控重扫**（R24 句 / `§21 ` 模式）——语义与目标文本不变；实施者（#168）按**现读行号**落笔，勿按设计 as-of 行号。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成（2026-09-11 · 实施者 = eng-coder · 终态 = clean——内层 explore 背离审计 1 轮（5 条全处置）；advisor 代码评审未发起——任务书红线「不发起评审」，归父侧流程节点）。**

**范围**：VP-1–VP-11（需修 11 项）+ VP-12（补缺口）+ 用例 T-V01–T-V19（3 新档）+ AC-V01–AC-V14 逐条机验。设计权威 = VSC `docs/design/PORTABILITY.md` §3–§7（逐字落笔依据 = §4.4）。

### 一、落地清单（实际行数 as-of 交付）

| 面 | 文件 | 行数变化 | 改动要点 |
|---|---|---|---|
| ① | `src/conventions.mjs` | 新增 226（≤300） | 唯一裁判（段匹配非锚定 / 大小写不敏感 / temp·doc 先行）+ 声明面（损坏→默认+warn+logEvent） |
| ① | `src/advisor/repos.mjs` | 156→131 | 谓词迁出（无 re-export）；`isDocOnlyChange` 换源 |
| ① | `src/agent/execute-tools.mjs` | 483→491 | 门禁 `isCodePath(p, conv)`；非字符串保守拦截保持；hint 新句 + 未声明追加句 |
| ① | `src/agent-tools/advisor.mjs` | 325→325 | 文档校验 `isDocPath`（`docs/` 前缀退役）；拒绝文案逐字 |
| ① | `src/agent-tools/verify.mjs` | 335→310 | 本地副本 + `findProjectRoot`/`isUnderSrc` 死代码全删；`isDocOnlyChange(files, cwd)` 换源 |
| ① | `src/agent/run-helpers.mjs` | 297→296 | import 换源 + **声明接入 guard**（审计修正 #1） |
| ① | `src/agent-tools/advisor-async.mjs` | 493→493 | import 换源 + 注释更正 + **stale 判定接声明**（审计修正 #2） |
| ① | `src/advisor/main.mjs` · `src/agent-tools/eng.mjs` | 319→320 · 106→105 | 头注指涉更正；eng enter 文案逐字 |
| ② | `src/advisor/project-context.mjs` | 新增 198（≤300） | 四降级句 + findProjectRoot / injectProjectGuide / injectDocumentMap / injectProjectStandards |
| ② | `src/advisor/messages.mjs` | 296→292 | guide 注入在 design 早退前（两路径共用）；design：NO_GIT + standards + map + 指令 1–5；code：requirement-fit + 指令 2 分支 |
| ③ | `src/index-discover.mjs` | 88→173 | CODE_EXTS +25 新项（§4.5 清单全覆盖）/ DOC_EXTS +4；声明并集（归一 `.ext`）；unlisted 收集（cap 20） |
| ③ | `src/indexer.mjs` | 445→456 | `buildIndex` 返回 `unlistedExts` + `logEvent("index:unlisted")`；conv 贯通 needsRebuild/kindFor/chunkFile |
| ③ | `src/extension/panel-index.mjs` | 178→182 | 提示行追加（§4.3 逐字；零未列入→原文案不变） |
| ④ | 六档提示词（双源） | EN 226→225 / CN 153→152 · 42→41 / 70→69 · 57→55 / 54→53 | §4.4(a)–(f) 编辑点逐条落地（含 R24 行 EN 对齐 CN） |
| 测试 | `test/portability-vsc-classification.test.mjs` | 新增 209 | T-V01–T-V06 + AC-V01/V02/V03 |
| 测试 | `test/portability-vsc-advisor-context.test.mjs` | 新增 192 | T-V07–T-V13 + AC-V04/V05/V09/V11 |
| 测试 | `test/portability-vsc-index.test.mjs` | 新增 226 | T-V14–T-V19 + AC-V06/V07/V08 |
| 测试 | `test/files.mjs` | +4 | 三新档入册（**超设计 §5 声明面**——清单式登记，不入册则不跑；如实披露） |

### 二、实测（真跑——日志落盘后读；不 commit、未发起评审）

- `node test/run-fast.mjs`（VSC）：**tests 511 / pass 502 / fail 0 / skipped 9 / exit 0**（slow-gate 零 offender）。
- 三新档单跑：classification **7/7**；advisor-context **8/8**；index **6/6**（full 层含 slow 两例：T-V16 283ms / T-V19 749ms）。
- 提示词回归：`prompts-mirror-anchors` + `prompts-async-guidance` + `doc-consistency` = **61/61**（红线锚零损）。
- `node scripts/check-doc-width.mjs`（VSC）：宽度 **0 超宽**（69 文件）· 一致性 V1/V2/V3 **新增违规 0**（存量 26）。
- AC 逐条：AC-V01 ✓（静态扫描 + 全仓 grep 判据副本 0）· AC-V02 ✓ T-V01–T-V04 · AC-V03 ✓ T-V05–T-V06 ·
  AC-V04 ✓ T-V07–T-V09 + `Read METHODOLOGY.md` src/ 零命中 · AC-V05 ✓ T-V10 · AC-V06 ✓ T-V14–T-V16（T-V16 full 层绿）·
  AC-V07 ✓ T-V17/T-V18 · AC-V08 ✓ 61/61 · AC-V09 ✓ T-V11–T-V13 + `in docs/` grep 0 ·
  AC-V10 ✓ T-V13 + eng-settlement 快层绿 · AC-V11 ✓（project-context 在位；messages 292 ≤500 且较 296 净减）·
  AC-V12 ✓ 上方四行 · AC-V13 ✓ CLI `requirements/PORTABILITY.md` §5 在位 ·
  AC-V14 ✓ 三方清单（设计 §1.3 = 批次档 §2 = AC 回指）脚本比对 0 差异。

### 三、偏差与 as-of 漂移披露（透明表）

| # | 项 | 设计 as-of | 实际落地 | 理由 / 处置 |
|---|---|---|---|---|
| 1 | persona-eng-designer 第二条编辑点（EN `:27` / CN `:25`） | 旧串 `advance docs/TODO.md status…` / `并入需求时同步推进 docs/TODO.md` | 旧串已不存在（他链「2026-09-11 归属修订」改写为归主 agent 句）；按 **CLI 已交付同源口径**落笔：`不触碰项目台账档` / `不触碰台账档` | 设计 §4.4(e)/(f) 与变更记录未随之修正（设计档写权不在 coder）——**呈父侧**决定是否回修设计档 |
| 2 | `messages.mjs` 行数 | 296 →「净减 ~30」 | 296→292（净减 4） | 新增注入点/降级分支/指令改写 ~26 行超出估算；AC-V11 硬判据（≤500 且 <296）满足 |
| 3 | 受影响文件增量标注 | `index-discover ≤+30` · `repos 净减 ~45` · `messages 净减 ~30` | index-discover +85 · repos −25 · messages −4（余档 ±≤8；最大 execute-tools 491 / advisor-async 493） | 标注为「预计增量」；硬限全满足（受改 ≤500、新档 226/198 ≤300）；实际数留痕于本表 |
| 4 | T-V16 / T-V19 归册 | 设计未标注慢档 | 标 `slow(` | 真 fs/git 子进程超快层 800ms 拦截阈值（D-T6 惯例）；快层 skip、full 层绿（283ms / 749ms） |
| 5 | CN `discipline-engineering` Pool routing 行 | 单行新串（>300 字符） | 折两行（同 CLI CN 形态） | 宽度硬约束（check-doc-width 扫描 docs/design）——语义逐字不变 |
| 6 | VSC `docs/design/ENGINEERING-MODE.md:152-155` · `ADVISOR-CONVERGENCE.md:42` 旧 `isDocFile`+旧门禁文案 | 设计 §9 明列「不触碰他链在途档」 | 未改 | 文档漂移如实上报——呈父侧决定是否另批同步 |
| 7 | run-helpers / advisor-async 接线 | §3.2 仅写「import 换源」 | 补足声明面接入（`loadConventions` 传入） | VP-10「全接线」+ CLI 同源口径（CLI `hasCodeMutations` 传 conv/cwd）——审计发现 #1/#2 处置 |
| 8 | `discoverFiles(…, {collectUnlisted})` 返回形状 | 设计未定 | collect 时 `{files, unlisted}`，否则数组 | 向后兼容（needsRebuild / 记忆自检 / 既有测试零改） |

### 四、审计与修正轮（终态 = clean）

- **内层 explore 背离审计：1 轮**（BLOCKING；只读）——发现 5 条（🟡3 / 🔵2）。处置：
  - #1 🟡 `hasCodeMutations` 未接声明（guard 可被绕过）→ **Fixed**（`run-helpers.mjs:70-73`）+ 回归断言（T-V03）。
  - #2 🟡 `advisorStale` code 面未接声明（在途评审陈旧判定失守）→ **Fixed**（`advisor-async.mjs:121-125`）+ 回归断言（T-V03）。
  - #3 🟡 设计档 §4.4(e)/(f) as-of 未随他链修正（文档漂移）→ **Deferred/呈父侧**（设计档写权不在 coder；本表 #1 已披露）。
  - #4 🔵 §5 增量标注偏差 → 本表 #3 披露。
  - #5 🔵 交付副产物 `_final-vsc-fast.log`（仓根）→ **Fixed**（已删除；同批其余 `_*.log` 为他批残留，未动）。
- **advisor 代码评审：未发起**——任务书红线「不发起评审」；父侧流程节点自行决定是否追评。本交付相对审计发现已收敛，故终态记 `clean`（以「无未处置审计发现」为准，非「已过 advisor 评审」）。
- **红线遵守**：真跑 ✓（全部证据为实测落盘日志）· 不 commit ✓ · 不发起评审 ✓ · 提示词只动 §4.4 编辑点（跨仓逐字锚零触碰——61/61 回归）· 端特有段原地保留 ✓ · 未碰 VSC `ENGINEERING-MODE.md` / `ADVISOR-CONVERGENCE.md` 本体 ✓ · 未碰 CLI 批次一产物（只读引用）✓。
- **§5 自写声明**：本段由 eng-coder 经 `batch_segment({segment:"§5"})` 写入（一段一作者；无父侧代笔）。

## §6 验证与收口（父代理自写）

**2026-09-11 19:30 · 父侧收口**

- **交付核验**（父侧抽核）：VSC 快层 **511/502/0/9 skip**（coder 实测——真跑日志落盘）；三新档 7/7 + 8/8 + 6/6；提示词回归 61/61（跨仓锚零损）；`check-doc-width`（VSC）零超宽（69 档）· 一致性新增 0；面：VP-1–VP-11 + VP-12 全落（新档 2 + 受改 12 + 提示词六档 + 测试 3 + `files.mjs` 入册（超声明——披露接受））。
- **AC 核销**：AC-V01–AC-V14 按 §5 逐条过（AC-V11 硬判据满足——`messages.mjs` 净减 -4；AC-V13/V14 ✓）。
- **审计残留处置**：① 设计档 §4.4(e)/(f) as-of 回修——**#185 发车**（父侧裁定：回修）；② §3 残宽：非表格仅 `:133` 一行（385）——**父侧折行打标**（表格行 4 条 `isTableRow` 机械豁免）；③ VSC `ENGINEERING-MODE.md:152-155` / `ADVISOR-CONVERGENCE.md:42` 旧文案——他链在途档，**登记另批同步**；④ `_final-vsc-fast.log` 已清 ✓（其余 `_*.log` 他批残留未动）。
- **核销同步清单**（D7）：状态行——需求池「评审注入路径硬编码项目约定」条目 → **已核销并移入归档档**（批次一 CLI + 批次二 VSC 双半交付）；计数——T-V01–V19 / AC-V01–14 与 §2 一致；指针——设计档 §1.3/§3–§7 可达；变更记录——设计档在档（#185 回修后）。
- **令牌**：链终——consume-design 已消费（本批**全链路闭环 ✓**）。
- **补记（2026-09-11 19:40）**：#185 回修落成——§4.4(e)/(f) 按实际交付口径成文（4 处内联修订 + 变更记录 `:457`）；字节核验与两档实文逐字节相等；doc 面回归 95/0/2（含 T-V17 逐字断言）。**本批终态 = 全闭环 + 回修落地。**
- **遗留**：① 提示词六档随 reload 生效；② commit 随「扫」批；③ CLI 侧同源残句（`thincoder/docs/design/PORTABILITY.md:311`/`:328`）——**#186 微修在飞**。
