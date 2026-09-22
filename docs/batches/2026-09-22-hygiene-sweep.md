# 2026-09-22 · hygiene-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-22 · 来源 = 用户 2026-09-22 09:21「1/2/3 都走」（承 09:19 台账消化：归批 46 条按处置面分桶 A–F——本批 = A+B+C 面 33 条）。
> 台账 = #107 #114 #160 #198 #200 #201 #202 #203 #206 #216 #218 #225 #152 #153 #158 #180 #187 #193 #197 #220 #58 #71 #111 #151 #164 #167 #172 #178 #209 #210 #217 #219 #221（33 条 · 多册保洁与微修 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-22 09:21「1/2/3 都走」——承 09:19 台账消化 · 归批 33 条按面分列）**

**A 文档保洁（12 条）**：#107（批档哈希裸引 sweep——涉冻结档者按「冻结不回改」改判 errata / 史实注明）· #114（需求档 §10 桥接句 / UNIX 例示）· #160（`WEBVIEW.md` 两处滞后）· #198（CLI README `:98` 折行）· #200（原 #192 簇残项——F2/F3/F4 待裁面在册）· #201（`WEBVIEW-PROTOCOL.md` §3.2 登记行 + 双 mock 二态）· #202（D8 型括注两处）· #203（doc-check 基线残 6 处）· #206（VSC 工具表计数）· #216（docs 存量卫生：超宽行 + 悬空锚）· #218（`WEBVIEW-PROTOCOL.md` §13/§12 坐标全表重出）· #225（规范面修订式标记族全扫）。

**B 产品码 / 测试注释保洁（8 条）**：#152 · #153 · #158 · #180 · #187 · #193 · #197 · #220（逐条证据 = 台账在册）。

**C 微修 + 断言 / 用例补（13 条）**：#58 · #71 · #111 · #151 · #164 · #167 · #172 · #178 · #209 · #210 · #217 · #219 · #221。

**角色分工（D1 写权）**：A-设计档 → eng-designer；A-需求档（#114）→ 主 agent；A-产品文本（#198 / #200 产品面）+ B + C → eng-coder；台账 → 主 agent。

**边界**：逐条收正、**零新语义**（行为面改动以既有判据为准——如 #151 修正则前须先实读现文本形态）；不改冻结批档（#107 涉冻结者走 errata 口径）；各档变更记录随加；机检零新增（doc-check + 各套测试）。

**链**：§2 设计（三面并案）→ §3 评审 → §4 批准 → 实施（按面分派）→ §6 收口核销。

**设计轮核验 + 7 待裁裁定（父侧 · 2026-09-22 09:2x）**

- **待裁 1（#200 F2/F3/F4）**：F3 加 `publishConfig.access` ✅ · F2 `files` 加 `CHANGELOG.md` ✅ · **F4 采「不加 + 一行指针」**（避发行耦合翻倍）——三条按推荐落。
- **待裁 2（#107）**：**冻结档零改 + errata 落本批 §2（4 哈希逐行）** ✅；备选（`DOC-DISCIPLINE` 加纪律行）**不取**（不新增纪律语，本批边界）。
- **待裁 3（#202）**：**保现状指向、删历史措辞** ✅（承 2026-09-18 裁）；从严备选不取（信息损失）。
- **待裁 4（#201①）**：**判不成立、零动作** ✅（现读驳回：行 14 在盘 + `:509` 登记行在盘）——台账已收正。
- **待裁 5（#216/#203 去重）**：**#203 保 6 条清账、#216 收余 22 条** ✅（入闸集为界，列报面不入）。
- **待裁 6（#216 枚举）**：**以实施轮开工前实跑读数为准** ✅——台账已按现读收正。
- **待裁 7（#206）**：**台账收正（父侧已落：27 → 30 + 口径注）** ✅ + 实施轮复读为准。
- **上抛裁定**：#153 扫描射程**采默认**（排除 `_archive` / `.thincoder/tmp` / 批档）✅ · **设计席交付报告发现⑩**（本批档 §2 有 19 行表行 >300 字符）**维持现状**（`docs/batches` 不在行宽射程 + 表行机检豁免——评审轮 1 发现 #5 由本改述闭合）· 发现⑤ 的 §17 改指候选（§6.7/§6.8/§6.27 三候选）**交评审轮确认**。

**台账收正（父侧笔 · 已成）**：#201（① 现读驳回）· #206（读数 30 + 口径注）· #216（去重 + 现读枚举 22 条）· #203（坐标漂移收正 + 与 #216 去重）。

**用户授权（2026-09-22 09:29「都自动跑吧」）**：本批链上——① 设计评审点火权 ② §4 用户批准权（代签）③ 修正轮 / 实施轮派发 ④ 收口核销（提交 / 推送 / 台账迁移）——均**委托父侧自动执行**，至本批收口。**父侧自缚**：① 代签仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 09:29 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需**新范围**或**用户口径裁决** ⇒ 停下（不因授权扩张射程）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（上抛处置轮已逐条落位（#225 强候选 7 处：改 5 · 判留 2 + TOOLS.md:775 重述）· 2026-09-22）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批任务书总纲（33 条三面并案 · 逐条处置）

**批次任务（覆盖）**：A 文档保洁 12 条 · B 产品码/测试注释保洁 8 条 · C 微修 + 断言/用例补 13 条 = **33/33**（一条一处置行 · 一条一机检面）。
**本轮性质**：设计轮（initial）——**零实施**（不写产品码 / 不改文档正文 / 不删档）；本 §2 即实施轮的分派任务书。
**处置口径（全批统一）**：① 逐条收正、**零新语义**；② **不改冻结批档**（涉冻结档者走 errata / 台账收正）；③ 行为面改前**必实读现况**（设计轮已读 12 条，见 §2.2；实施轮落笔前再读一次目标行防在途漂移）；④ 机检零新增（`doc-check` + 三端套件）。
**归属（D1 写权矩阵 + §1 角色分工）**：设计档 / 纪律档 = eng-designer；需求档（含 `docs/core/requirements/**` · `docs/cli/requirements/**`）= 主 agent；产品文本 / 产品码 / 测试注释 = eng-coder；台账 = 主 agent。
**坐标口径**：标「现读」= 本设计轮实读（2026-09-22）；标「台账 as-of」= 台账在册坐标，**实施轮必先复读**（本批已发现多起坐标漂移，见 §2.5）。
**坐标形态（评审轮 1 #8 收正 · D4 细则）**：档坐标一律**仓根完整路径**（纪律句 = `docs/core/design/DOC-DISCIPLINE.md:37`）；同名档必消歧 = `docs/cli/design/TUI.md` ∥ `docs/cli/requirements/TUI.md`；`thincoder-core/session-gc.mjs` ∥ `thincoder-vscode/src/extension/session-gc.mjs`；`thincoder-core/agent/run-stages.mjs` ∥ `thincoder-vscode/src/agent/run-stages.mjs`。行内同档回引（「同档 `:151`」类）不在此限。

### 2.1 总表（33 条 · 逐条：目标坐标 · 改法一句话 · 归属角色 · 机检面）

#### A 面 · 文档保洁（12 条）

| id | 面 | 目标 file:line | 处置一句话 | 归属 | 机检 / 验证 |
|---|---|---|---|---|---|
| #107 | A-记录面 | `docs/batches/2026-09-17-activebatch-repeal.md:312` · `2026-09-17-async-face-fixes.md:755` · `2026-09-17-subagent-zero-block.md:478` · `2026-09-19-ledger-lifecycle.md:694`（四哈希现读在盘） | 冻结档零改；本批落 4 行 errata（哈希不可达事实 + 指向对应批档） | eng-designer（errata 落本批 §2） | `git log` 四前缀零命中已核；冻结档 diff = 0 |
| #114 | A-提示词/需求 | `thincoder-core/prompts/common.md:113`（bullet2）· `:114`（bullet3）现读；镜像 `docs/core/design/prompts/common.md:74`/`:75` | bullet2 尾补「有专用工具时仍走工具路由表」桥接句；bullet3 补 UNIX 对位（`2>/dev/null` / `;`）；双副本逐字同改 | 主 agent（内容权）· 落笔 eng-coder | 两副本 bullet 逐字同源；双串 grep 命中；提示词镜像锚测试绿 |
| #160 | A-设计档（VSC） | `docs/vsc/design/WEBVIEW.md:32`（现读：仍述 `index.html:14-63` 起于 `#chat-container`）；六档读数行 = 台账 `:562` **已漂**（现读该档 `:577`/`:589` 两行载 as-of 09-20 读数） | `:32` 按现 `index.html` 结构重出并补 loading 屏登记；六档读数行按 `wc -l` 现读重出（标 as-of） | eng-designer | doc-check 零新增；重出读数与 `wc -l` 一致 |
| #198 | A-产品文本 | `thincoder-cli/README.md:98`（现读：单行 **1167** 字符） | 按语义折行，内容逐字零变 | eng-coder | 该档最长行 ≤300（`node` 行宽扫描）；diff 仅换行/空白 |
| #200 | A-产品文本/包配置 | `thincoder-core/package.json`（现读 v0.9.2：无 `publishConfig` ✓ 在盘、`files` 无 `CHANGELOG.md` ✓ 在盘）· `thincoder-vscode/AGENTS.md:15`/`:51`（现读：均书「13 锚」） | F7 就地收正（13 锚 → 2 锚，依据 `thincoder-vscode/src/prompt-injections.mjs:16-21` 2 键）；F2/F3/F4 = **已裁**（§1 `:25`–`:32`：F3 加 `publishConfig.access` · F2 `files` 加 `CHANGELOG.md` · F4 **不加 + 一行指针**）；F6 判**已消**；F-D 同轮实读后按现树收正或不动 | eng-coder | 产品码面 grep「13 锚」零命中；五小项逐项在 §2.3 有裁定行 |
| #201 | A-VSC 文档/测试面 | ① `docs/vsc/design/WEBVIEW-PROTOCOL.md:96`（行 14 现读在盘）+ `:509`（**登记行现读在盘**）；② `thincoder-vscode/test/fixtures/vscode-mock.mjs`（现读：全仓零引用）∥ `test/vscode-mock/index.mjs`（`package.json:135` 依赖 ⇒ 活） | ① **判不成立、零动作**（台账前提被现读驳回，见 §2.5-2）；② 死档删除（`git rm`） | eng-coder | ① 证据在档；② 删后 VSC 套件绿 + 全仓 grep `fixtures/vscode-mock` 零命中 |
| #202 | A-设计档（VSC · D8 型括注） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:73`（现读：活断言 + 「W13 已退役——端自持档已删」历史措辞）；`WEBVIEW-INPUT.md:99` = **现读空行（台账坐标已漂）** | 逐处二态：**保现状指向、删历史措辞**（裁点见 §2.3-3）；`:99` 无对象 ⇒ 零动作；同档同族实体 = `:82`/`:120` 同口径处置 | eng-designer | 改后两档该处只余可定位活对象的现状句；doc-check 零新增 |
| #203 | A-设计档（门禁残） | **行宽 3**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:2094`(345) · `docs/core/design/BATCH-RECORD.md:358`(589) · `:365`(302)；**悬空 3**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:2050`/`:2068`/`:2069`（全部现读实跑读数；**他流在途写入致行号漂移——以开工前实跑为准**） | **判类第 0 步**（菜单首步）：按 `docs/core/design/DOC-DISCIPLINE.md:310`–`:312` 判 A / B / C——B 类（已收口批叙述面 / 带时点锚）**零触碰**（残差登记 = `:344`）· C 类（需求档）**零触碰 + 列表上抛**；整表对象全过期者按 `:320` 归承接档下次实质修订（零触碰）。**余行**再走折行 / 改指 / 改述 / 删除：3 行宽按语义折行；3 悬空逐处实读——目标存在 ⇒ 改指；**不存在 ⇒ 改述（去死名坐标形态——§3.8-A 口径 `docs/core/design/DOC-DISCIPLINE.md:310`）为首选**；「迁移期引文形态」为**条件出路**：成立 = **三合一**（行内标记 + 同行史实谓词 + 该锚悬空——单源 `docs/core/design/DOC-DISCIPLINE.md:885`–`:887`），**无史实谓词打标记 = 失据照红**（`:892` 防滥用①/③） | eng-designer | 改后 doc-check 该 6 条零复现 |
| #206 | A-计数/台账 | 冻结档 `docs/batches/2026-09-20-mechanism-parity-batch.md:211`/`:724` 已自书「台账 27 ∥ 实核 **30**」并注「台账收正归主 agent」；实读位 = `thincoder-vscode/src/tools/index.mjs:172-186` | 主 agent 收正台账（#123①/#206：27 → 现读数 + 口径注）；实施轮以现读**复核**（“以实施轮读数为准”） | 主 agent（台账）+ eng-coder（复核） | 逐名计数 = 台账所记数（D3 计数与列表同改） |
| #216 | A-存量卫生（总册） | 现读（本席实跑 doc-check；**修正轮复跑读数见 §2.5-11**）：**行宽余 9**：`docs/cli/requirements/TUI.md:93`(560) · `docs/core/design/TOOLS.md:736`(554)/`:738`(303)/`:779`(356) · `docs/core/requirements/PROMPT-SYSTEM.md:43`(324)/`:109`(419)/`:212`(363)/`:213`(373) · `docs/core/requirements/TOOLS.md:197`(375)；**悬空余 13**：`docs/core/design/SESSION.md:654` · `docs/core/design/TOOLS.md:681×2`/`:770`/`:773`/`:816`/`:817`/`:819`/`:835`/`:842`/`:917`/`:923×2`（**以开工前实跑为准 · 现读数见 §2.5-11**） | **判类第 0 步**（按 `docs/core/design/DOC-DISCIPLINE.md:310`–`:312` 判 A / B / C：B 类零触碰（残差登记 = `:344`）· C 类零触碰 + 列表上抛；整表对象全过期者按 `:320` 归承接档下次实质修订）；**余行处置** = 折行 / 改指 / 改述（无承接者 ⇒ **改述优先**，口径同 #203）；**#203 的 6 条不重复施工**；台账旧枚举与现读不符者以**开工前实跑读数**为准（§2.5-4） | 设计档 = eng-designer；需求档（`docs/cli/requirements/TUI.md` · `docs/core/requirements/PROMPT-SYSTEM.md` · `docs/core/requirements/TOOLS.md`）= **主 agent** | 改后两族读数 = 0（`doc-check` 闸态阈值 0） |
| #218 | A-设计档（协议表坐标） | `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13（发面，现读 51 行——评审实核 `:433`–`:483`）/ §12（收面，**以 `--emit` 现读为准——现读 53 行**（`:363`–`:415`；2026-09-22 新增 `busyQueued` 行在 `:367`））②③ 列 | 跑 `--emit` 全表重出两表 ②③ 列 + 行内标 as-of；**§12 行数标签按现读收正** | eng-designer | `node thincoder-vscode/test/protocol-coverage.test.mjs --emit` / `node thincoder-vscode/test/protocol-coverage-reverse.test.mjs --emit`（退出口 `:320` / `:299`）全绿；表行数不增不减 |
| #225 | A-修订式标记族 | 规范面全扫（样本现读：`docs/core/design/MEMORY.md:495`/`:530`/`:543` · `docs/core/design/MULTI-INSTANCE-COLLAB.md:163`；另台账样本 `:213`/`:214` = 台账 as-of） | 全树扫描（脚本仅枚举候选，**逐处人读判定**）→ 规范面去修订式标记、保语义与锚值（有日期锚者改「裁定」语）；尸体形删除；**记录面 / 变更记录段不动**。**受影响文件行 = 扫描面依赖（实施轮开跑读数）**——枚举命令 / 基线计数口径 = §2.4.2 | 设计档 = eng-designer；需求档 = 主 agent | 候选表逐条闭合（规范面 N → 0；N = 开跑读数）；doc-check 零新增 |

#### B 面 · 产品码 / 测试注释保洁（8 条）

| id | 面 | 目标 file:line | 处置一句话 | 归属 | 机检 / 验证 |
|---|---|---|---|---|---|
| #152 | B-产品码注释 | `thincoder-vscode/src/agent/setup.mjs:106`/`:176`/`:137`/`:335`/`:448`/`:456`/`:482`（台账 as-of 2026-09-21；**实施轮必先复读**） | 逐靶实读（活体面）→ 改指可解析节号，不可解则删 § 指称保语义句；`_archive` 引文不动 | eng-coder | 活体面 grep `§17\.\|§19\.\|11\.2\.1\|§16` 零命中（排除 `_archive` / `.thincoder/tmp`）；三端套件绿 |
| #153 | B-裸名专勘 | 机判三式（J1/J2/J3）锁外的**裸名形**（如 `(SUBAGENT-OBSERVE-SEND)`） | **以扫描方案形态交付**（不逐档全仓实读）：枚举候选 → 白名单排除 → 逐候选二态 → 候选表 + 处置表。**枚举式样单源** = `docs/core/design/PROMPT-SYSTEM.md:202`（J1 大写档名形）/ `:203`（J2 节号形）/ `:204`（J3 小写档名形）——三式为**锁内**形；本专勘 = 三式**锁外**裸名形。**已实证漏勘先例 2 处** = `thincoder-core/agent-tools/subagent-actions.mjs:247` / `:299`（`(SUBAGENT-OBSERVE-SEND)` 串面残留 · 该批 C 表漏勘 · 评审抓回已修——证据 = `docs/batches/2026-09-20-prompt-refs-zero-batch.md:541`；「实核加修 2 处」= 同档 `:569`；坐标 as-of 2026-09-20）。**受影响文件行 = 扫描面依赖（实施轮开跑读数）**——枚举命令 / 基线计数口径 = §2.4.2 | eng-coder（方案口径 = eng-designer） | 候选表无「待定」行；处置后复跑**残余 = 0** |
| #158 | B-产品码注释 | `thincoder-core/agent-tools/subagent-async.mjs:58-64`（现读：头注写 `{ explore, plan, coder, eng-coder }` + 「engineering → explore/plan/eng-coder」） | 改头注为现态角色 enum（先读 `agent/family-tools.mjs` 角色表 + `agent-tools/subagent.mjs` 模式门，**以现读为准**）；plan 不属工程面、eng-designer 须在列 | eng-coder | 注释枚举与现读角色表逐名一致；既有 enum/模式门断言全绿（零语义改） |
| #180 | B-注释/术语 | `thincoder-cli/test/model-ref.test.mjs:20`（现读：含「空闲拍」）· `thincoder-vscode/src/extension/session-gc.mjs:8`（台账：头注 `:132-138` 自述 as-of 可接受） | ① 术语收正为现口径（「启动窗外延迟拍」族）；② 可选：坐标符号化（若做则同笔） | eng-coder | 该档「空闲拍」零命中；`model-ref` 测试绿 |
| #187 | B-注释/坐标（6 小项） | ① `thincoder-vscode/src/extension/panel-session-write.mjs:133`（档位 = §2.4.1 外·144 行）② `thincoder-vscode/webview/activity.js:315`（§2.4.1 行 5）③ `docs/core/design/SESSION.md:159` ④ `docs/vsc/design/WEBVIEW.md:214` ⑤ `thincoder-vscode/test/chat-panel.test.mjs`（现读 `:128/:129/:152/:160/:175`）⑥ `docs/vsc/design/WEBVIEW.md:564` | ①②③ = 语义等价确认后加等价注（不改行为）；④⑥ = 坐标重出；⑤ = 退役符号去名或改指现判据（改前实读确认已退役） | ①②⑤ = eng-coder；③④⑥ = eng-designer | 各档测试绿；doc-check 零新增；三等价位读回 |
| #193 | B-测试注释死指针 | `thincoder-cli/test/batch-segment.test.mjs:173`（现读：引 `§2.20.2`） | 改指现档对应节（对象 = spawn 绑定路径记录 ⇒ §6.21/§6.7 候选）或删节号保语义；**同族候选面同轮实扫**（`thincoder-core/test/manifest.test.mjs:3` · `scripts/doc-check.mjs:4`——**二者入 §2.4 条件行**（实扫命中 ⇒ 改指 / 改述）：`manifest.test.mjs` 现读仍指已归档 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md` §3 ⇒ 改指目标 = `docs/core/design/MANIFEST.md` §3；`scripts/doc-check.mjs` 头注指已归档模块名 `…-MACHINE-CHECK` ⇒ 改指目标 = `docs/core/design/DOC-DISCIPLINE.md` §7（两判 = `docs/batches/2026-09-18-dead-pointer-sweep.md:117` / `:124` 同源）） | eng-coder | CLI 套件绿；活体面 grep `§2\.20` 零命中 |
| #197 | B-产品码注释（旧模型残句） | `thincoder-core/agent/write-gate.mjs:13`/`:40-41`（现读在盘）· `thincoder-cli/src/acp/handlers-slots.mjs:32`（现读：「与入口门槛两分」） | 按现模型（启动侧恒不拒；拒面 = 「翻转可否进」）改述；旧术语逐处去名或改指新术语 | eng-coder | 活体面 grep `拒进正常循环\|入口门槛\|启动期拦` 零命中；三端套件绿 |
| #220 | B-产品码注释（§17 悬空） | 现读 6 处：`thincoder-cli/src/tui/subagent-freeze.mjs:233` · `thincoder-cli/src/tui/suspension-drive.mjs:83` · `thincoder-core/agent/run-stages.mjs:230` · `thincoder-vscode/test/files.mjs:68` · `thincoder-core/agent.mjs:31`/`:167` | §17 系**全活体面零定义**（`docs/core/design/AGENT-LOOP.md` 现止于 §1–§8；`docs/core/design/AGENT-LOOP-SUBAGENT.md` = §6.7–§6.28）⇒ 改指现存小节（§6.7 / §6.8 / §6.27 三候选——**评审轮 1 实核三候选实存**）；不可解则删指称 / 改述；**不得改指不存在的小节**；**改指前先以母档 `docs/core/design/AGENT-LOOP.md` 实读复核 §6.15 存否**（KD-4；`AGENT-LOOP-SUBAGENT.md` 侧无 §6.15.3——见 §2.5-5） | eng-coder | 活体面 grep `§17` 零命中（排除 `_archive`/`.thincoder/tmp`/批档）；三端套件绿 |

#### C 面 · 微修 + 断言 / 用例补（13 条）

| id | 面 | 目标 file:line | 处置一句话 | 归属 | 机检 / 验证 |
|---|---|---|---|---|---|
| #58 | C-产品码（人读面明文） | `thincoder-cli/src/tui/cmd-mcp-form.mjs:116-125`（现读：`:118` token 走 `maskToken`；`:119-121` headers/env 明文） | headers/env 现值改走脱敏（敏感键名遮、非敏感键名保可读）；同批修 `[object Object] (object)` 渲染瑕疵 | eng-coder | 新增用例：提示输出不含明文敏感值；既有表单测试绿 |
| #71 | C-产品码（假洁净） | `thincoder-core/tools/git.mjs:149-156`（diff）· `:192-201`（log）；status 腿 `:157-191` 不带 `-- <path>`（**台账收窄成立**） | 两腿「传了 path 且输出空」时加注（如 `(no changes — pathspec '<path>' matched nothing …)`） | eng-coder | 新增用例：不存在 path ⇒ 含注记且退出 0；不传 path 逐字节同修前 |
| #111 | C-设计档 + CLI 用例 | `docs/core/design/AGENT-LOOP-SUBAGENT.md:1500`（现读 F10 行）；CLI 侧零断言（VSC 对位 = `thincoder-vscode/test/upstream-parity.test.mjs:157`/`:171`） | ① F10 行扩条（补两残余：采样窄窗 race / 谓词恒真连开——**只记残余与边界，不改判据本体**）；② CLI 补 1 条对位断言 | ① eng-designer；② eng-coder | ① 读回含两残余；② 新断言绿 + CLI 套件绿 |
| #151 | C-产品码（行为面 · 剥离规则静默失效） | `thincoder-vscode/src/agent/setup-tooltable.mjs:163`（**现读**正则）∥ 核源文 `thincoder-core/agent-tools/subagent.mjs:153`（**现读**无 `— §19.6` 段） | 正则改**形态无关**（`…freeze a digested-stuck block[^)]*\), ?`），使剥离不依赖档号字面 | eng-coder | `thincoder-vscode/test/agent-tools-registry.test.mjs` 补断言：装饰后 action 描述**不含 `panel`**；去 panel 段后与核描述逐字一致 |
| #164 | C-测试面（loading 小项） | `thincoder-cli/test/tui-stderr-capture.test.mjs:18`（`runMock` 携 `writeImpl`）∥ T6 `:61`/`:72` 未注入；T-RT `:111-144` 用 `writes[0]`/`writes[1]` 位次 | ① T6 两处改注入 `writeImpl`（消 stdout 噪音）；② T-RT 改**内容辨识**；③（可选）加 loading 行内容断言 | eng-coder | 该档单跑绿 + 输出无 loading 行噪音；T-RT 四条改形后仍绿 |
| #167 | C-产品码（写面守卫） | `thincoder-cli/src/tui/cmd-eng.mjs:93-102`（现读 `:94` 无守卫 + `:101` 写槽）· `thincoder-cli/src/tui/cmd-advisor.mjs:28-38`（现读 `:30` 无守卫 + `:34` 写槽）；先例 `thincoder-cli/src/tui/cmd-session.mjs:12`（`agent._slot ?? …`） | 两处一律改 `agent._slot ?? activeSlot(agent.cwd)`（绑定优先——不得写他槽） | eng-coder | 新增用例：`_slot` ≠ `activeSlot` 夹具下写入目标 = 绑定槽；TUI 套件绿 |
| #172 | C-产品码（字面双源） | `thincoder-cli/src/tui/agent-turn.mjs:194`/`:198`（现读硬编码）∥ 核容器 `thincoder-core/i18n.mjs:42-43`；先例 `thincoder-cli/src/tui/suspension-drive.mjs:32`+`:183/:185/:201` | 两行改 `t("digest.capAuto")` / `t("digest.capStop", { turns })`（与 VSC `thincoder-vscode/webview/chat.js:425-426` 同形） | eng-coder | 活体面字面 grep = 仅核 `thincoder-core/i18n.mjs` 一处；CLI 套件绿；输出逐字同修前 |
| #178 | C-产品码（显式面耗时） | `thincoder-core/session-gc.mjs:233` `runSessionGc`（现读：`:247` `limit: Infinity` 全量枚举 · `:249-252` 组装 · `:263` 逐条输出） | dry-run / confirm 面加**进度 / 分批 / 预估**（择最小形）；**不动判据与删除集** | eng-coder | `thincoder-cli/test/session-gc-cli.test.mjs` 补断言（大候选夹具下含进度/预估行）；既有 GC 用例全绿 |
| #209 | C-测试面（context 第三去向） | `thincoder-core/context.mjs:281`/`:285-289`/`:393`/`:403-432`（全部现读） | 补 1 条专属用例：短历史 + 单条 `"x".repeat(9000)` + `force` ⇒ `shrinkOversized` 直落（断言截断桩 + 返回 true + 非 fallback 态） | eng-coder | 新用例绿；`compress-form` / `compaction-echo` 零回归 |
| #210 | C-测试面（plan 未知 action） | `thincoder-core/agent-tools/plan.mjs:112`（现读报错串；源文零改已核） | 补 1 条断言：`{action:"nope"}` ⇒ 报错串逐字相等 | eng-coder | 新断言绿（`assert.equal` 逐字） |
| #217 | C-产品码（VSC parity 缺口） | `thincoder-vscode/src/agent/run-stages.mjs:105`（现读无 engineering 排除）∥ 核 `thincoder-core/agent/completion.mjs:75`；同族先例 = 同档 `:92` | guard 条件补 `&& !agent.config?.agent?.engineering`（端差默认 = 消） | eng-coder | `thincoder-vscode/test/advisor-guard-rounds.test.mjs` 补 1 用例（工程置位 ⇒ 不推回）；VSC 套件绿 |
| #219 | C-产品码（VSC 冷启镜像） | `thincoder-vscode/webview/panels.js:101-116`（现读 `:102` 仅由 `suspension` 置位）；host 先例 `thincoder-vscode/src/extension/panel-messages.mjs:273-290`（`:286` turnState · `:290` `pushBusyQueued`） | `webviewReady` 握手补 `_suspended` 重推（host 侧取最小形；webview 零改） | eng-coder | `thincoder-vscode/test/busy-injection-vsc.test.mjs` 补 1 用例：冷启时 `_susp` 在场 ⇒ `_suspended === true` |
| #221 | C-产品码（复位时点） | `thincoder-vscode/src/extension/panel-messages.mjs:113-176`（现读 `:116` workspace 早退 → `:156-165` 降级 await → `:170` 复位推送） | 复位推送前移至 `routeUserTurn` 入口（含 workspace 早退口前），幂等零语义风险；`:170` 保留或删（等价） | eng-coder | 补 1 用例：带图排队消息在降级 await 挂起期提交 ⇒ 镜像已在 await 前复位（postMessage 序断言） |

### 2.2 行为面实读证据（本设计轮实读 · 2026-09-22 · 供实施轮与评审对读）

**行为面 / 产品码面（改前必读位 · 本席已读 · 逐条给出所得）**

- **#151 现读（关键）**：`thincoder-vscode/src/agent/setup-tooltable.mjs:163` = `description: actionProp.description.replace(/panel \(view the live subagent panel \/ freeze a digested-stuck block — §19\.6\), /, "")`；核源文 `thincoder-core/agent-tools/subagent.mjs:153` 现文 = `panel (view the live subagent panel / freeze a digested-stuck block)` ⇒ **无 ` — §19.6` 段** ⇒ 正则恒不命中（replace 零操作），而 `:162` 已把 `panel` 从 enum 去项 ⇒ **描述残留 block 提及 + enum 无该项**（不一致面成立）。同档 `:151` 已删 `view`/`freeze` 两参。
- **#221 现读**：`thincoder-vscode/src/extension/panel-messages.mjs:116` `blockOnNoWorkspace(panel)`（workspace 早退口）→ `:124-142`（running 分支：`:128`/`:132`/`:140` 三处 `pushBusyQueued`）→ 归位路径 `:156-165`（`await downgradeNonVisionImages`）→ `:170` `pushBusyQueued(panel)`（复位点在 await **之后**，注释自述「归位受理路径同推槽内实况（幂等）」）。`pushBusyQueued`（`:101-104`）恒读 host 实况、幂等 ⇒ 前移零语义风险。
- **#219 现读**：`thincoder-vscode/webview/panels.js:102` `S._suspended = !!m.active`（仅由 `suspension` 消息置位）；host `thincoder-vscode/src/extension/panel-messages.mjs:273` `case "webviewReady"` 现推四件（`:286` turnState / `:287` i18n / `:288` agentSettings / `:289` _pushStatus）+ `:290` `pushBusyQueued`（注释明书「对位 workspaceGuard 先例」）⇒ **握手重推机制已在位，缺 `_suspended` 一项**。
- **#217 现读**：VSC `thincoder-vscode/src/agent/run-stages.mjs:105` = `if (cfgVerifyGuard && agent._touchedFiles.length > 0 && !agent._verifiedThisRun && hasCodeMutations(agent) && pb.guardPushbacks < MAX_VERIFY_PUSHBACKS)`（零 engineering 条件）；核 `thincoder-core/agent/completion.mjs:75` = `if (depth === 0 && verifyGuard === true && !agent.config?.agent?.engineering)`（`:71-72` 注释明书「Engineering mode is excluded…」）；VSC 同档 `:92` pending 分支**已带** `!agent.config?.agent?.engineering`（同族先例在位）⇒ 端差缺口成立。
- **#167 现读**：`thincoder-cli/src/tui/cmd-eng.mjs:93-102` `persistEngineering`——`:94` `const slot = activeSlot(agent.cwd)`（无守卫）→ `:96` `slotPath` → `:101` `writeSessionFile(p, data)`；`thincoder-cli/src/tui/cmd-advisor.mjs:28-38` `persistGuard`——`:30` `slotPath(agent.cwd, activeSlot(agent.cwd))`（无守卫）→ `:34` `writeSessionFile`；先例 `thincoder-cli/src/tui/cmd-session.mjs:12` = `agent._slot ?? activeSlot(agent.cwd)`（`:10-11` 注释明书「用粘性槽而非 activeSlot——后者有认领副作用」）⇒ 两处缺守卫成立。
- **#172 现读**：`thincoder-cli/src/tui/agent-turn.mjs:194` / `:198` 两行英文硬编码在盘；核容器 `thincoder-core/i18n.mjs:42-43` 逐字同值；CLI 读容器先例 `thincoder-cli/src/tui/suspension-drive.mjs:32`（`import { t } from "@thincoder/core/i18n.mjs"`）+ `:183/:185/:201` ⇒ 单源改法可行且同族先例在位。
- **#71 现读**：diff 腿 `thincoder-core/tools/git.mjs:149-156`（`:154` runGit `["diff", …flags, ref, "--", …paths]` → `:155` `out || "(no changes)"`）；log 腿 `:192-201`（`:199` 条件拼 `-- <path>` → `:201` `out || "(no commits)"`）；status 腿 `:157-191` 不带 `-- <path>`（台账「收窄两腿」**现读成立**）⇒ 加注点 = 仅两腿且 `args.path` 在场。
- **#58 现读**：`thincoder-cli/src/tui/cmd-mcp-form.mjs:116-125` `currentText()`——`:118` `if (field === "token") return v ? maskToken(v) : "none"`；`:119-121` headers/env 走 `Object.entries(v).map(([k, val]) => `${k}=${val}`)` 明文列示 ⇒ 同族未脱敏成立。
- **#178 现读**：`thincoder-core/session-gc.mjs:233` `runSessionGc`——`:247` `listStaleCwds({ …, limit: Infinity })`（全量面）+ `:249-252` 组装 candidates（逐条 reason）+ `:259-264` dry-run 逐条 `out()`（含 `files ${c.files.length}`）⇒ 无进度 / 无预估 / 无分批（42s 量级成立）。
- **#209 现读**：`thincoder-core/context.mjs:281`（`if (!extras.force && tokens <= threshold) return false`）· `:285-289`（`if (!split) { … return shrinkOversized(agent) }`）· `:393` `OVERSIZE_CONTENT_LIMIT = 8_000` · `:403-432` `shrinkOversized`（`:425-430` 命中即改 history + 基线失效 + `return shrunk`）⇒ 第三去向 = 有实现、无专属用例。
- **#210 现读**：`thincoder-core/agent-tools/plan.mjs:112` = `` return `Error: unknown action "${args.action}". Use "enter" or "exit".` ``（`:111` 条件 `args.action !== "enter"`；`:102-103` 注释自述以 VSC 为准）⇒ 断言靶串逐字在盘。
- **#164 现读**：`thincoder-cli/test/tui-stderr-capture.test.mjs:18` `runMock` = 携 `writeImpl`；T6 用例 `:57-80` 直呼 `spawnTuiWrapped`（`:61` / `:72` **未给 writeImpl**）⇒ F-A 启动加载行落 runner stdout；T-RT `:111-144` 断言用 `s.writes[0]`/`s.writes[1]`（位次形）+ `:142` 同 ⇒ 三项均在盘。
- **#111 现读**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:1500`（F10 行 = 「唤醒触发但队列已被同轮 drain 清空（多次唤醒 / 竞态）」）⇒ 两残余（窄窗 race / 谓词恒真连开）未入该行（与台账一致）。

**产品码 / 测试注释面（现读确认在盘位）**：#158（`thincoder-core/agent-tools/subagent-async.mjs:58-64` 头注）· #193（`thincoder-cli/test/batch-segment.test.mjs:173`）· #197（`thincoder-core/agent/write-gate.mjs:13`/`:40-41` · `thincoder-cli/src/acp/handlers-slots.mjs:32`）· #220（6 处逐位命中——坐标见 §2.1 行）· #180（`thincoder-cli/test/model-ref.test.mjs:20`）· #187（`thincoder-vscode/src/extension/panel-session-write.mjs:133` · `thincoder-vscode/webview/activity.js:315` · `docs/core/design/SESSION.md:159` · `thincoder-vscode/test/chat-panel.test.mjs:128/129/152/160/175`）。

**文档面现读**：#107（四哈希四处在盘）· #114（`thincoder-core/prompts/common.md:111-116` + 镜像 `docs/core/design/prompts/common.md:74-75` + 路由表 `:86`）· #160（`docs/vsc/design/WEBVIEW.md:32` 旧结构句在盘）· #198（`thincoder-cli/README.md:98` 长行在盘）· #200（`thincoder-core/package.json` 无 `publishConfig` · `files` 无 `CHANGELOG.md` · `thincoder-vscode/AGENTS.md:15`/`:51` 双处「13 锚」）· #202（`docs/vsc/design/WEBVIEW-PROTOCOL.md:73` 在盘；`docs/vsc/design/WEBVIEW-INPUT.md:99` 为空行）· #203/#216（doc-check 实跑读数——修正轮复跑见 §2.5-11）· #206（冻结档 `docs/batches/2026-09-20-mechanism-parity-batch.md:211`/`:724` 自书不一致）· #218（`--emit` 工具两档在盘）· #225（样本位在盘）。

### 2.3 裁定项（7 项 · 逐项结论 + 落点 · **已裁**——承 §1 `:25`–`:32`）

**裁定项 1 — #200 的 F2 / F3 / F4 三小项**（**已裁**：F2/F3 加 · F4 不加 + 一行指针）

- **F3 `publishConfig.access = "public"`**：**推荐加**。理由 = 现发布依赖命令行 `--access public`（`docs/RELEASE.md:104`），一行 `publishConfig` 即消除「漏参 ⇒ 发布失败 / 误私包」面；改动 = `thincoder-core/package.json` +3 行，零行为变更风险。
- **F2 `files` 加 `"CHANGELOG.md"`**：**推荐加**。理由 = 现白名单不含该档 ⇒ 包内 / npm 页读者看不到变更记录；`npm-packlist` 恒带集只保证 `package.json` / `README` / `LICENSE`；改动 = 一行，包体 +1 档（小）。
- **F4 核 README 内嵌「Changelog 摘要」节**：**推荐不加**（改判 = 加一行指针）。理由 = `docs/RELEASE.md:92` 的「每发行同步」纪律若复制到核 README ⇒ **发行耦合翻倍**（两处随版本更新，漏一处即成假陈述）；替代 = 核 README 加一行指向 `CHANGELOG.md` / GitHub Releases，零耦合。**已裁**（涉发布纪律射程）：**不加**——改落一行指针（核 README 加一行指向 `CHANGELOG.md` / GitHub Releases）。
- 附：**F6 判已消**（`package.json` 现 v0.9.2 ⇒ 0.9.1 tarball 档差随重发自然消解）；**F-D**（VSC README `:189-190` `docs/` 行标签）= 实施轮实读后判「非客观假」则零改，仅补行内注。

**裁定项 2 — #107 冻结档处置口径**（**已裁**：冻结档零改 + errata 落本批 §2）

- **推荐**：四处裸哈希**不触碰**冻结批档；errata 落**本批档 §2**（记录面，每哈希一行：`aff5bc08` / `126c3abe` / `c8bb261d` / `0b73794d` ⇒ 注明属 `.git` 误删事故窗（2026-09-17→09-20）提交、现行历史不可达、事实链见对应批档）+ 台账 #107 结账单行（主 agent）。理由 = 「冻结不回改」+ 本仓既有先例（#191 归因「冻结批遗漏 ⇒ 新批承接」，不返改冻结档）。
- 备选（**已裁不取**——§1 `:25`–`:32`：不新增纪律语）：在 `docs/core/design/DOC-DISCIPLINE.md` 引证面纪律加一行「事故窗哈希处理口径」——长期可查，但属**新纪律语**，本批边界（不新增机制）内不推荐。

**裁定项 3 — #202「删 or 保留现状指向」**（**已裁**：保现状指向、删历史措辞）

- **推荐（两处同口径）**：保留可定位**活对象**的坐标；删除「已删 / 已退役」历史措辞句。依据 = 2026-09-18 用户裁「失效的表达必须删」（历史措辞指向的是**不存在的对象**⇒ 属失效表达；坐标指向活对象 ⇒ 保留）。
- `WEBVIEW-PROTOCOL.md:73` 现形 = 活断言（现体 = 核 `subagent-run.mjs`）+ 历史措辞（`W13 已退役——端自持档已删`）⇒ 改写为只述现体的现状句。
- `WEBVIEW-INPUT.md:99` = **现读空行（台账坐标已漂）⇒ 该处零动作**；同档同族实体 = `:82`（「行面板已撤，现行 = 流内活动块」= 现状句主导 ⇒ 保留）与 `:120`（D-I11 否决理由行内「原 `test/md.test.mjs` **已删**」⇒ 去该括注，理由句其余不动）。
- 备选（**已裁不取**——§1：信息损失面）：从严口径「凡含「已删 / 已退役」一律整句删」——信息损失（否决理由依赖「该档已删」事实）。

**裁定项 4 — #201 ① 台账前提被现读驳回**（**已裁**：判不成立、零动作）

- 现读证据：`WEBVIEW-PROTOCOL.md:96` 行 14 在盘（`digest` 增字段 `from`/`msg`）；同档 `:509` **变更记录已登记**（原文：「§3.2 **行 11 收正（tier 两档）** + **新增行 14**（`from` / `msg`——ask 携参；登记 **十三项 → 十四项**，D3 计数与列表同改）」）⇒ 台账「疑缺行 14 的登记行」**不成立**。
- **推荐 = 零动作**（不加补注——无对象动作属噪声）；台账 #201 收正由主 agent 记「① 现读驳回」。

**裁定项 5 — #216 与 #203 重叠去重口径**（**已裁**：#203 保 6 条、#216 收余 22 条——算式读数以开工前实跑为准）

- #203 的 6 条（行宽 3 + 悬空 3）已被 #216 的现读全表覆盖 ⇒ **不重复施工**：#203 = 该 6 条的清账册（独立可核销），#216 = 余下 **行宽 9 + 悬空 13 = 22 条**（**以开工前实跑为准 · 现读数见 §2.5-11**）。
- 边界：本批只处置**入闸集**（`FAIL(锚)` 16 · `FAIL(行宽)` 12——**设计轮读数，以开工前实跑为准**）；`拟新增 10` / `迁移期引文 214` / `符号·宽（报告面）341` = **列报面不入闸**，不属本批（零扩面）。

**裁定项 6 — #216 台账枚举与现读不符**（**已裁**：以开工前实跑读数为准）

- 台账列 `WEBVIEW-INPUT.md:16/19/20`（322/456/373）· `TUI.md:24`（303）· `TUI.md:92` · `TOOLS.md`「另有 18 行」等，**本轮 doc-check 未复现**（现读 `WEBVIEW-INPUT.md` / `TUI.md:24` 不在 12 行内；`TOOLS.md` 现读 3 行）。
- **推荐 = 实施轮开工前实跑 `node scripts/doc-check.mjs --root .`，以**现读列表**替换台账枚举**（台账旧项判「已由他批收正 / 口径差」，逐项不复现即销）；理由 = 避免实施轮追幽灵项（台账读数为 as-of，本轮已复现多起漂移）。

**裁定项 7 — #206 读数与归属**（**已裁**：台账收正（父侧已落）+ 实施轮复读）

- 现读：冻结档 `docs/batches/2026-09-20-mechanism-parity-batch.md:211`/`:724` **已自书**不一致（台账 #123① = 27 ∥ 实核 `src/tools/index.mjs:172-186` = 30 项）并注「台账读数收正归主 agent」⇒ 处置 = **主 agent 收正台账**（#123①/#206 读数为现测值 + 口径注「表内 30 项；装配面名集另 +2」），冻结档零改。
- 附：「以实施轮读数为准」——该登记册后续批曾计划让名（`context` → `ide`）⇒ **数值可能再变**，实施轮以复读为准（不得沿用 30 为既有事实）。

### 2.4 受影响文件表（源 / 测档逐档现况 + 预计增量；纯 .md 豁免行数义务但列改点）

**读数口径**：现况行 = `wc -l` 等值口径（`split("\n").length - 1`）· **as-of 2026-09-22（本修正轮一次性补测——承评审 #2）**；**实施轮落笔前复读为准**（在途漂移已实证：本批多起坐标已漂）。

**产品码 / 测试档（行数义务：≤300 咨询线 · ≤500 硬限）**

| 档 | 现况行 | 预计 Δ | 越线判定 / 备注（>300 档 = §2.4.1 行号） |
|---|---|---|---|
| `thincoder-vscode/src/agent/setup-tooltable.mjs` | **342** | ±1（正则改形态） | >300（存量）· ≤500 ✓ —— §2.4.1 行 1 |
| `thincoder-vscode/src/agent/setup.mjs`（#152） | **421** | ±1（注释改指七处——**结构不变 · 零增行**） | >300（存量）· ≤500 ✓ —— §2.4.1 行 2；在册「500 = 硬限在位」读数已随拆分消解（见下行注） |
| `thincoder-vscode/src/extension/panel-session-write.mjs`（#187①） | **144** | ±1（语义等价注） | <300 ✓ |
| `thincoder-vscode/webview/activity.js`（#187②） | **450** | ±1（锁面注） | >300（存量）· ≤500 ✓ —— §2.4.1 行 5 |
| `thincoder-vscode/src/extension/session-gc.mjs`（#180② · 可选） | **21** | ±1（坐标符号化，若做） | ✓ |
| `thincoder-core/tools/git.mjs` | **421** | +2~4 | >300（存量 · 在册）· <500 ✓ |
| `thincoder-vscode/src/agent/run-stages.mjs` | **420** | +1 | >300（存量）· <500 ✓ —— §2.4.1 行 4 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | **330** | ±2（复位点前移＝净零） | >300（存量）· <500 ✓ —— §2.4.1 行 6 |
| `thincoder-cli/src/tui/agent-turn.mjs` | **376** | ±0~+2 | >300（存量）· <500 ✓ —— §2.4.1 行 10 |
| `thincoder-core/agent-tools/subagent-async.mjs` | **456** | ±1（注释等长改写优先） | >300（存量 · 在册）· <500（**贴线：余 44**） |
| `thincoder-vscode/test/busy-injection-vsc.test.mjs`（#219） | **453** | +3~15 | >300（存量）· ≤500 ✓ —— §2.4.1 行 7 |
| `thincoder-cli/test/model-ref.test.mjs`（#180） | **432** | ±1 | >300 advisory（CLI 无同族机检门）· ≤500 ✓ —— §2.4.1 行 8 |
| `thincoder-core/context.mjs` | **440**（本席实测——**实施轮开工复测为准**） | ±0（用例落 test 档） | >300（存量 · 在册）· <500 ✓；**在册坐标反证在档**（`docs/core/design/AGENT-LOOP-SUBAGENT.md:2237` 载该档内部坐标 `:483` · `docs/core/design/DOC-DISCIPLINE.md:549`/`:559` 载 `:495`）⇒ 与「441」不可同真 ⇒ 真实值按 `unverified`，**勿以任一读数作既成事实** |
| `thincoder-core/agent.mjs` | **436** | ±1（#220 注释） | >300（存量 · 在册）· <500 ✓ |
| `thincoder-cli/src/tui/suspension-drive.mjs` | **334** | ±1（#220 注释） | >300（存量）· <500 ✓ —— §2.4.1 行 11 |
| `thincoder-cli/test/input-lock.test.mjs`（**#111② 断言宿主**） | **395** | +≤15（新断言与 T-CL-U1 同族——F10 对位：唤醒触发而队列已被同轮 drain 清空 ⇒ 谓词假 ⇒ 不开轮 / 无自旋） | >300 advisory · ≤500 ✓ —— §2.4.1 行 12；落笔前先实读 VSC `thincoder-vscode/test/upstream-parity.test.mjs:157`/`:171` 与本档现断言，确不重复再落（若已覆盖 ⇒ 改判零动作并回填理由） |
| `thincoder-cli/test/batch-segment.test.mjs`（#193） | **298** | ±1 | ✓（**贴线：+3 即越 300** ⇒ 越线按 CLI advisory 口径声明） |
| `thincoder-core/session-gc.mjs` | **292** | +10~20 | **可能越 300 咨询线**（292+Δ ⇒ 302–312）⇒ 处置 = §2.4.1 行 9（越线则同批登记） |
| `thincoder-core/test/core-hygiene.test.mjs`（**条件行**） | **177** | ±0~+5（仅当 `session-gc.mjs` 越线：`SOFT_LINE_REGISTRY` 登记 + 注记）；**或 ±0~1**（#1 连带注记：头注 `:61-62` 的「设计档无对应行 … 待设计侧收正」句按 §2.4.1 行 16 落位收正） | 核档位**硬门本体**（`:71-84` 登记表 · `:143-157` 断言） |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | **255** | ±1 | <300 ✓ |
| `thincoder-cli/src/tui/cmd-mcp-form.mjs` | **197** | +3~6 | <300 ✓ |
| `thincoder-cli/src/acp/handlers-slots.mjs` | **196** | ±1 | ✓ |
| `thincoder-cli/test/tui-stderr-capture.test.mjs` | **154** | +2~6 | ✓ |
| `thincoder-cli/test/session-gc-cli.test.mjs`（#178） | **137** | ±1~+10 | ✓ |
| `thincoder-vscode/test/files.mjs` | **130** | ±1（#220 注释）或 +1~2（新档登记） | ✓ |
| `thincoder-core/agent-tools/plan.mjs` | **120** | ±0（断言落 test 档） | ✓ |
| `thincoder-cli/src/tui/cmd-eng.mjs` | **104** | ±1 | ✓ |
| `thincoder-core/agent/write-gate.mjs` | **87** | ±2 | ✓ |
| `thincoder-vscode/test/agent-tools-registry.test.mjs`（#151） | **76** | +3~15 | ✓ |
| `thincoder-vscode/test/advisor-guard-rounds.test.mjs`（#217） | **54** | +3~15 | ✓ |
| `thincoder-vscode/webview/panels.js` | **142** | ±0（本批零改） | ✓ |
| `thincoder-vscode/test/chat-panel.test.mjs`（#187⑤） | **271** | ±1~+10 | ✓ |
| `thincoder-core/agent/run-stages.mjs` | **266** | ±1 | ✓ |
| `thincoder-cli/src/tui/subagent-freeze.mjs` | **246** | ±1 | ✓ |
| `thincoder-core/test/compress-form.test.mjs`（**#209 用例宿主**——压缩形态同族；回归面 = `compaction-echo.test.mjs` 231） | **285** | +8~15 | ✓ |
| `thincoder-core/test/tool-seams-agent.test.mjs`（**#210 断言宿主**——plan 工具域既有宿主：`:23` 导入 `planTool` · `:131-132` 直调 execute） | **322** | +3~8 | >300（存量 · 在册）· <500 ✓ —— §2.4.1 行 16 |
| `thincoder-core/test/manifest.test.mjs`（**#193 同族候选面 · 条件行**——`:3` 现读指已归档 `docs/core/design/modules/ENGINEERING-MODE-V2-MODULE-MANIFEST.md` §3；实扫命中 ⇒ 改指 `docs/core/design/MANIFEST.md` §3） | **480** | ±0~1（头注改指——行内；**仅当同轮实扫命中**） | >300（存量 · 在册）· <500 ✓ —— §2.4.1 行 17 |
| `scripts/doc-check.mjs`（**#193 同族候选面 · 条件行**——`:4` 现读指已归档模块名 `…-MACHINE-CHECK`；实扫命中 ⇒ 改指 / 改述） | **76** | ±0~1（头注改指——行内；**仅当同轮实扫命中**） | <300 ✓；**工程工具面**（`scripts/**` ⇒ 父侧直改口径 · 机械注改） |
| **删除档**：`thincoder-vscode/test/fixtures/vscode-mock.mjs`（零引用 · 死档） | **51** | −51（`git rm`） | 删后须核 `thincoder-vscode/test/files.mjs` 登记面（未登记则零改） |

**注（`setup.mjs` 硬限读数收正——承评审 #1「硬限风险不可见」面）**：在册 `docs/core/design/AGENT-LOOP-SUBAGENT.md:2099` 记「`setup.mjs` **现量 500 = 硬限在位**，本批 ±0——该档后续净增的拆分另案」（as-of 2026-09-21）；本席现读 = **421**（`thincoder-cli/src/agent/setup.mjs` 不存在——该读数指本档）⇒ 拆分已由 `ceb03b45`（2026-09-21「VSC tool-table split」：本档 −101 / `setup-tooltable.mjs` +113）兑现 ⇒ **硬限压力面消解**；本批仍取「**结构不变 · ≤±1 注释 · 零增行**」约束。

**纯 .md（豁免行数义务 · 改点清单）**

| 档 | 改点 | 归属 |
|---|---|---|
| `docs/vsc/design/WEBVIEW.md` | `:32` 结构句重出 + loading 屏登记；六档读数行重出（现读位 `:577`/`:589`，台账 `:562` 已漂）；`#187④` `:214` 坐标、`⑥` `:564` 坐标 | eng-designer |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | `#202` `:73` 现状句改写；`#218` §12/§13 ②③ 列全表重出（§12 行数标签按现读收正）；`#201①` 零改（判不成立） | eng-designer |
| `docs/vsc/design/WEBVIEW-INPUT.md` | `#202` `:82` 保留 / `:120` 去「已删」括注；`:99` 零动作（空行） | eng-designer |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md` | `#111①` `:1500` F10 行扩条；`#203`/`#216` `:2094` 折行 + `:2050`/`:2068`/`:2069` 悬空改指 / 改述 | eng-designer |
| `docs/core/design/BATCH-RECORD.md` | `#203` `:358`（589）/`:365`（302）折行 | eng-designer |
| `docs/core/design/TOOLS.md` | `#216` 行宽 `:736`/`:738`/`:779` 折行；悬空 `:681×2`/`:770`/`:773`/`:816`/`:817`/`:819`/`:835`/`:842`/`:917`/`:923×2` 改指 / 改述 | eng-designer |
| `docs/core/design/SESSION.md` | `#187③` `:159` 措辞收正 + 等价注；`#216` `:654` 悬空 | eng-designer |
| `docs/core/design/MEMORY.md` · `docs/core/design/MULTI-INSTANCE-COLLAB.md` | `#225` 规范面修订式标记清理（样本 `:495`/`:530`/`:543` · `:163`；台账另点 `:213`/`:214`/`MEMORY:430`） | eng-designer |
| `docs/core/design/DOC-DISCIPLINE.md` | 仅当**裁定项 2 备选**被采纳时落一行口径（**已裁不取** ⇒ 本批零改） | eng-designer |
| `thincoder-core/prompts/common.md` + `docs/core/design/prompts/common.md` | `#114` bullet2 桥接句 + bullet3 UNIX 对位（双副本逐字同改） | 主 agent（内容权）· 落笔 eng-coder |
| `docs/core/requirements/PROMPT-SYSTEM.md`（行宽 `:43`/`:109`/`:212`/`:213`）· `docs/core/requirements/TOOLS.md`（`:197`）· `docs/cli/requirements/TUI.md`（`:93`） | `#216` 行宽 5 处折行 | **主 agent**（需求档笔域） |
| `thincoder-cli/README.md` | `#198` `:98` 语义折行（内容零变） | eng-coder |
| `thincoder-vscode/AGENTS.md`（`:15`/`:51` 13 锚 → 2 锚）· `thincoder-vscode/README.md`（F-D `:189-190`） | `#200` F7 收正 / F-D 实读后判 | eng-coder |
| `thincoder-core/package.json`（F2/F3）· `thincoder-core/README.md`（F4） | `#200` **已裁**（§1 `:25`–`:32`）：F2/F3 加 · F4 = 一行指针 | eng-coder |
| 台账（**主 agent 自持面**——① 本体 = SQLite · 键控项目根 · 存用户数据目录 = **工作树外**；② 仓内 md 档 `docs/TODO.md` / `docs/TODO-archive.md` = 在册档位） | #107 / #201 / #203 / #206 / #216 / #225 各条的「台账收正 / 登记 / 核销」动作 = **主 agent 笔 · 不入本表写域声明**（本表 = 仓内文档写域）；两份 md 台账档本批**零触** | 主 agent |
| 冻结档 ×4（`docs/batches/2026-09-17-activebatch-repeal.md` · `docs/batches/2026-09-17-async-face-fixes.md` · `docs/batches/2026-09-17-subagent-zero-block.md` · `docs/batches/2026-09-19-ledger-lifecycle.md`） | `#107` **零改**（errata 落本批 §2） | — |
| 冻结档 ×1（`docs/batches/2026-09-20-mechanism-parity-batch.md`） | `#206` **零改**（台账侧收正） | — |

#### 2.4.1 >300 档尺寸档块（不拆 + 理由 + 触发 + 登记 / 拆分计划——承 `docs/core/design/DOC-DISCIPLINE.md:604`–`:609` / `:639`–`:648` 先例）

**登记面（逐侧点名）**：**核侧**（`thincoder-core/**/*.mjs`，含 `test/`）= `thincoder-core/test/core-hygiene.test.mjs:71-84` 的 `SOFT_LINE_REGISTRY`——`>300 未登记 ⇒ 核套件红`（断言 `:143-157`，机检**硬门**）；设计侧拆分计划落点 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 子表（`:1106`）。在册先例 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:2164`（escalate-async 登记行）。**VSC 侧** = 无同族机检门；读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1（逐项登记 · 非全量普查；登记归父侧派单）。**CLI 侧** = 无同族机检门（全仓 `SOFT_LINE_REGISTRY` 仅核档一处）⇒ >300 = advisory：声明 + 触发式拆分计划（先例 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:1708`）。

**触发（统一）** = 越 500 硬限 ∨ 该档下次实质改动（随批先备拆）。

| # | 档 | 现况 | 本批 Δ | 不拆理由 | 登记 / 拆分计划 |
|---|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | 342 | ±1 | 本批 = 正则形态一处（行内替换）· 结构未变 | 登记 = `docs/vsc/design/VSC-DEBT.md` §12.1 |
| 2 | `thincoder-vscode/src/agent/setup.mjs`（#152） | 421 | ±1 | 注释改指七处 · **结构不变 · 零增行**（硬限压力已随 `ceb03b45` 拆分消解） | 同 #1 |
| 3 | `thincoder-core/tools/git.mjs` | 421 | +2~4 | 两腿加注（行内）· 结构未变 | **已在册**（`SOFT_LINE_REGISTRY`） |
| 4 | `thincoder-vscode/src/agent/run-stages.mjs` | 420 | +1 | guard 条件一处 · 结构未变 | 同 #1 |
| 5 | `thincoder-vscode/webview/activity.js` | 450 | ±1 | 锁面注一处 · 结构未变 | 同 #1 |
| 6 | `thincoder-vscode/src/extension/panel-messages.mjs` | 330 | ±2 | 复位点前移（净零）· 结构未变 | 同 #1 |
| 7 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` | 453 | +3~15 | 用例追加（同族夹具复用） | 同 #1 |
| 8 | `thincoder-cli/test/model-ref.test.mjs` | 432 | ±1 | 术语收正（行内） | CLI advisory（触发式） |
| 9 | `thincoder-core/session-gc.mjs` | 292 | +10~20 | **本批不拆**：改动 = 进度 / 分批 / 预估面追加（不动判据与删除集）· 现况未越线 | **越线 ⇒ 同批登记**（改 `thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY` + 注记：越线原因 / 拆分立场 / 触发）+ 设计侧拆分计划落 §2.8.1；拆分候选 = 残留面外提姊妹档（先例 = `docs/batches/2026-09-21-startup-latency.md` §2 同款预案，该批未触发） |
| 10 | `thincoder-cli/src/tui/agent-turn.mjs` | 376 | ±0~+2 | i18n 单源改形（行内） | CLI advisory（触发式） |
| 11 | `thincoder-cli/src/tui/suspension-drive.mjs` | 334 | ±1 | #220 注释（行内） | CLI advisory（触发式） |
| 12 | `thincoder-cli/test/input-lock.test.mjs` | 395 | +≤15 | 新断言与 T-CL-U1 同族、复用本档 `driveRig` 夹具（外提即改既有夹具结构——判词先例 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:1708`） | 触发 = 该档下次实质改动 / CLI 引入档位门时，把 `suspensionSession` 直驱段连 `driveRig` 一并外提 |
| 13 | `thincoder-core/agent.mjs` | 436 | ±1 | #220 注释（行内） | **已在册** |
| 14 | `thincoder-core/agent-tools/subagent-async.mjs` | 456 | ±1 | 注释等长改写（贴线：余 44）· 结构未变 | **已在册** |
| 15 | `thincoder-core/context.mjs` | 440 | ±0 | 用例落 test 档 · 结构未变 | **已在册**；读数 = 实施轮复测为准（见 §2.4 表内反证注） |
| 16 | `thincoder-core/test/tool-seams-agent.test.mjs` | 322 | +3~8 | **本批不拆**：断言追加（#210 一行 `assert.equal`）落既有 plan 工具域宿主（`:23` 导入 · `:131-132` 直调）· 结构未变；拆分方案 = 拒翻用例组随下次触碰该档的批拆出邻档（该档在册 `thincoder-core/test/core-hygiene.test.mjs:61-62` 记「设计档无对应行 · 待设计侧收正」——**本行即收正**） | **已在册**（`SOFT_LINE_REGISTRY`） |
| 17 | `thincoder-core/test/manifest.test.mjs` | 480 | ±0~1 | **条件行**（#193 同族候选面——实扫命中才落笔）：头注改指一处（行内）· 结构未变 | **已在册**（`SOFT_LINE_REGISTRY`） |
| 18 | `thincoder-core/test/compress-form.test.mjs` | **305** | +8~15 | 用例宿主（#209 压缩第三去向）· 越线在册 · 结构未变 | **已在册**（`SOFT_LINE_REGISTRY`） |
| 19 | `thincoder-core/test/tool-seams.test.mjs` | **314** | +2~4 | 用例宿主（#71 路径空输出注）· 越线在册 · 结构未变 | **已在册**（`SOFT_LINE_REGISTRY`） |

**2026-09-22 收口轮补行（父侧直接执行 · 可 revert）**：+2 行（18 = `test/compress-form.test.mjs` 305 · #209 用例宿主；19 = `test/tool-seams.test.mjs` 314 · #71 用例宿主——均为实施轮实测越线）⇒ **块内终态 = 19**；两档已在 `SOFT_LINE_REGISTRY` 在册（核套件门不红）。历次计数（15 → 17）见 §2.9 注与各修正块——**记录面不回改**。

#### 2.4.2 扫描面依赖项（#153 / #225）——受影响文件行 = 实施轮开跑读数

- **#153（裸名专勘）**：受影响文件行**天然无法在设计轮闭合**（候选集在实施轮扫描后产出）⇒ §2.4 不给档位行；**枚举** = 内置 `grep` 工具 / `rg` 全仓扫描机判三式（J1 / J2 / J3——式样 = §2.1 #153 行）+ 白名单排除（`_archive/**` · `.thincoder/tmp/**` · `docs/batches/**`——射程采默认 ✅）；**基线计数口径** = 开跑候选行数 **N₀**（记入 §5 实施记录）⇒ 核销锚 = 处置后复跑候选残余 **0**（或候选表逐条二态闭合、无「待定」行）。
- **#225（修订式标记族）**：同形——候选集实施轮产出；**枚举** = 全树扫描（脚本仅枚举候选，逐处人读判定）；射程 = 规范面（设计档 `docs/**/design/**` + 需求档——主 agent 笔）；**基线计数口径** = 候选处数 **N₀**（实施轮开跑读数；先例 = `docs/core/design/DOC-DISCIPLINE.md:217` §3.7——设计轮即给 143 行 / 88 档计数）⇒ 核销锚 = 规范面候选 **0**（记录面 / 变更记录段不动）。

### 2.5 现读发现（与台账不符 · 逐条 · 不免除报告义务）

1. **坐标漂移（doc-check 实跑 vs 台账）**：#203 台账 `:2091`/`:2047`/`:2065`/`:2066` ⇒ 现读 `docs/core/design/AGENT-LOOP-SUBAGENT.md:2094`（345 字符）/`:2050`/`:2068`/`:2069`；`docs/core/design/BATCH-RECORD.md:358`/`:365` 不变 ✓。**本表已用现读值**。
2. **#201 ① 台账前提被驳回**：`WEBVIEW-PROTOCOL.md` §3.2 行 14 在盘（`:96`）且其变更记录登记在盘（`:509`，含「十三项 → 十四项，D3 计数与列表同改」）⇒ 台账「疑缺行 14 的登记行」**不成立** ⇒ 裁定项 4（已裁：零动作）。
3. **#202 坐标漂移**：`docs/vsc/design/WEBVIEW-INPUT.md:99` 现读为**空行**；同族实体位移至 `:82` / `:120`。`docs/vsc/design/WEBVIEW-PROTOCOL.md` 侧台账 `:72` ⇒ 现读 `:73`。
4. **#216 台账枚举与现读不符**：`docs/vsc/design/WEBVIEW-INPUT.md:16/19/20`（322/456/373）· `TUI.md:24`（303）· `TUI.md:92`——**同名两档（`docs/cli/design/TUI.md` ∥ `docs/cli/requirements/TUI.md`）未消歧**（本条原样引台账；两档本轮回跑皆未复现该两条）· `docs/core/design/TOOLS.md`「另有 18 行」**本轮未复现**（现读 `TOOLS.md` 3 行；`WEBVIEW-INPUT` 零行）⇒ 判「已由他批收正 / 口径差」⇒ 裁定项 6（已裁：以开工前实跑为准）。
5. **#220 的台账建议目标不存在**：台账建议「改指 §6.8 或 **§6.15.3**」——`docs/core/design/AGENT-LOOP-SUBAGENT.md` 现小节 = §6.7–§6.28 ⇒ **本档无 §6.15.3**（不可采用）；**母档 §6.15 存否 = 实施轮改指前实读复核**（该档头注在册「母档续 §6.1–§6.6 + §6.13–§6.17」⇒ 母档或存——`unverified`）。候选口径维持 = §6.7 / §6.8 / §6.27（**评审轮 1 实核三候选实存**：`:10`（含 §6.7.2 `:32`）/ `:120` / `:1034`）。
6. **#220 与 #152 / #193 / #197 同族**（产品码/测试注释「死指针 · 死名」族）⇒ 建议**同轮一并处置**（四次开同一族的档，边际成本近零）；本表已按面分列但保留同轮合并权（实施轮可合批）。
7. **#200 F6 判已消**：`thincoder-core/package.json` 现 `version = 0.9.2` ⇒ 0.9.1 tarball 203 档 vs 现树档差项随重发自然消解（不需动作）。
8. **#71 坐标漂移**：台账 `:147-149`/`:193-195` ⇒ 现读 `thincoder-core/tools/git.mjs:149-156`/`:192-201`；同页确认 status 腿不带 `-- <path>`（台账「收窄两腿」**成立**，非缺陷）。
9. **#160 六档读数行坐标未定位到行**：台账 `:562` 现读落在 2026-09-21 变更记录条目（`docs/vsc/design/WEBVIEW.md`）；载 as-of 09-20 六档读数者 = 该档 `:577` / `:589` ⇒ **实施轮以 `grep -n` 定位该行后重出**（本表已标）。
10. **行为面实读确认无「台账前提不实」者**（#151 / #167 / #172 / #217 / #219 / #221 / #71 / #58 / #178 / #209 / #210 / #164 / #111 全部与台账语义相符，仅坐标/数值微漂）——即本批 C 面可照表施工。
11. **修正轮复跑读数（2026-09-22 09:4x · 本席实跑 `node scripts/doc-check.mjs --root .`）= 悬空 17 / 行宽 16**（设计轮 = 16 / 12）：上浮 5 条全为**他流在途写入所致，非本批引入**——新增悬空 `docs/core/design/MEMORY.md:472`（`core.mjs:213`）；新增行宽 `docs/core/design/AGENT-LOOP-SUBAGENT.md:1297`(306) · `docs/core/design/CONTEXT-COMPACTION.md:310`(450) · `docs/core/design/ENGINEERING-MODE-V2.md:379`(367) · `docs/core/design/SESSION.md:323`(470)；悬空位位移 `docs/core/design/SESSION.md:654` → `:761`。⇒ 实施轮入闸集 = **开工前实跑**的 `FAIL(锚)` + `FAIL(行宽)` 全集（裁定项 6 口径不变）。**落笔期再上浮 1**：`docs/core/requirements/SESSION.md:39`（411 字符——需求档 = 主 agent 笔域，他流在途）⇒ 修正轮终态复跑 = **悬空 17 / 行宽 17**；本席改动面 = 本批档 `docs/batches/**`（不在 doc-check 扫描域）⇒ **净增 0**。 **修正轮 2 复跑（2026-09-22 09:5x · 本席实跑同命令）= 悬空 16 / 行宽 12**（他流在途写入继续漂移：修正轮 1 期上浮的行宽条目多条已被他流收正 / 悬空位继续位移——读数系时点值，非本批引入）；修正轮 2 落笔面仍 = 本批档 ⇒ **净增 0**。

### 2.6 验收对照（AC 逐条机检面）

**本设计轮（§2 自身）**

- AC-1 §2 覆盖 33/33 且每条带现读坐标 ⇒ 机检 = 总表行数 33（A 12 + B 8 + C 13）且每行具 `file:line`（仓根完整路径形态——§2.0 坐标形态段）。
- AC-2 裁定项成节且逐项给结论 ⇒ 机检 = §2.3 存在且 7 项各含结论句（推荐 / 已裁）。
- AC-3 归属角色逐条标注 ⇒ 机检 = 33 行「归属」列非空且取值 ∈ {eng-designer, eng-coder, 主 agent}（复合行逐子项标注）。
- AC-4 受影响文件表在档 ⇒ 机检 = §2.4 存在（码 / 测档**全档含现况行 + Δ**（实测口径）；.md 含改点）+ **§2.4.1 尺寸档块在档**（>300 档逐档「不拆 + 理由 + 触发 + 登记面」）+ **§2.4.2 扫描面依赖块在档**（#153 / #225 的枚举命令 / 基线计数口径）。

**实施轮（本批总门 · 交付前各跑一次）**

- AC-5 **文档门零新增 / 归零**：`node scripts/doc-check.mjs --root .` ⇒ 目标 `FAIL(行宽) → 0` 与 `FAIL(锚) → 0`；**处置菜单第 0 步 = 判类**（按 `docs/core/design/DOC-DISCIPLINE.md:310`–`:312` 判 A / B / C——B 类**零触碰**（残差登记 = `:344`）· C 类**零触碰 + 列表上抛**；整表对象全过期者按 `:320` 归承接档下次实质修订）；**余行**处置 = 折行 / 改指 / **改述（去死名坐标形态）** / 删除；**「迁移期引文形态」为条件出路**——须满足**三合一**（行内标记 + 同行史实谓词 + 该锚悬空——单源 `docs/core/design/DOC-DISCIPLINE.md:885`–`:887`）；**无史实谓词打标记 = 失据照红**（`:892` 防滥用①/③）；有承接者时不得用标记（走改指）。**基线读数以实施轮开工前一次的实跑为准**（设计轮读数 = 悬空 16 · 行宽 12；修正轮 1 复跑 = 悬空 17 · 行宽 16→17；修正轮 2 复跑 = 悬空 16 · 行宽 12——并行写入漂移，逐次读数见 §2.5-11）。
- AC-6 **三端套件全绿**：`thincoder-core` · `thincoder-cli` · `thincoder-vscode` 各 `npm test` ⇒ fail 0（本批新增用例含 #151 / #178 / #209 / #210 / #111② / #217 / #219 / #221 / #158 面断言）。
- AC-7 **逐条读回**：每条处置行 ⇒ 该 `file:line` 现读回执（改后内容摘录），33/33 无「未读回」行。
- AC-8 **零新语义 / 零规则改动**：#151 / #71 / #167 / #217 / #219 / #221 / #58 / #172 / #178 九条的行为面改动逐条附「改前 / 改后」语义等价论证（或本条已给判据）；判据面（AC / 判据行 / 阈值）零改。
- AC-9 **冻结档零改**：`git diff --stat` 不含 5 档冻结批档（§2.4 末两行）；#107 errata 仅在**本批档** §2 与台账。

### 2.7 关键决策 · 边界 · 上抛

**关键决策**

- **KD-1 单条成本 → 批成本**：33 条一次摊平、按面分派（A 12 / B 8 / C 13），**不新起机制**（零新档、零新纪律语、零新判据）。
- **KD-2 冻结档零改**：#107 / #206 走 errata + 台账收正（依据 = 项目「冻结不回改」+ 本仓先例 #191：遗漏债由**新批承接**，不返改冻结档）。
- **KD-3 归属按 D1 硬分**：需求档面（`core/requirements/**` · `cli/requirements/**`）**一律主 agent 笔**——本批 #216 的行宽 5 处、#225 的需求档命中项、#114 的需求层裁量均在主 agent 侧；设计档面归 eng-designer；产品文本 / 产品码 / 测试注释归 eng-coder。
- **KD-4 行为面改前必读**：本设计轮已实读 12 条行为面（§2.2），改法以现读为据；**实施轮落笔前再读一次目标行**（在途漂移风险实证：本批 4 处坐标已漂）。
- **KD-5 #153 以扫描方案落**：不逐档全仓实读（本批禁扩扫），方案四步（枚举 → 白名单排除 → 逐候选二态 → 候选表闭环）；受影响文件行 = **扫描面依赖**（实施轮开跑读数——枚举命令 / 基线计数口径 = §2.4.2）。
- **KD-6 参考 vs 复读**：台账坐标为**参考**；本表「现读」= 本席实读（as-of 2026-09-22）；**实施轮落笔前一律复读**（在途漂移实证：本批多处坐标已漂）。

**边界（本批不做）**

- 不实施（本设计轮零产品码 / 零文档正文 / 零删档）；实施归后续轮，按面分派。
- 不扩扫 33 条以外（#185 / #186 / #195 / #196 / #204 / #205 / #208 / #222 / #224 / #226 等他册不动）。
- 不新增机制 / 不改判据面 / 不改冻结批档 / 不改台账（台账 = 主 agent）。
- 不处置 `拟新增 10` / `迁移期引文 214` / `符号·宽（报告面）341` 等**列报不入闸**面。
- 不代主 agent 写需求档，不代 coder 落产品码。

**上抛项（已裁 / 已收口——承 §1 `:25`–`:32`；全项闭合）**

1. 裁定项 1 的 **F4**（核 README 是否内嵌 Changelog 摘要节）——**已裁**：**不加 + 一行指针**（涉发布纪律射程——不引发行耦合）。
2. 裁定项 2 的**备选**（是否把「事故窗哈希口径」升为纪律行）——**已裁不取**（新纪律语，本批边界）。
3. 裁定项 3 的**备选**（从严「含已删/已退役即整句删」）——**已裁不取**（信息损失面）；按推荐执行（保现状指向、删历史措辞）。
4. **发现 5（#220）已收口**——评审轮 1 实核三候选实存（`docs/core/design/AGENT-LOOP-SUBAGENT.md:10`（含 §6.7.2 `:32`）/ `:120` / `:1034`）⇒ 候选口径维持；**本档无 §6.15.3**；**母档 §6.15 存否 = 实施轮改指前实读复核**（见 §2.5-5）。
5. **#153 扫描方案的射程**（是否含 `_archive` 与批档面）——**已裁**：射程**采默认** = 排除 `_archive` / `.thincoder/tmp` / 批档（活体面口径）。

### 2.8 修正轮 1（评审 id=17 · changes-required 🔴1 🟡5 🔵3）逐条落位

**性质**：**点修**——逐号落位、**就地替换**（不留旧形尸体；承 2026-09-18「失效的表达必须删」裁）+ 本块留痕（号 → 落位）；**零新语义**（只收正：写域 / 读数 / 口径 / 坐标形态）。父侧已逐条裁定接受；**#5（发现⑩）不在本轮**（已由 §1 改述就地闭合）。

| # | 落位（本档 file:line） | 收正内容 |
|---|---|---|
| 1 🔴 | §2.4（`:164` 起 · 表 `:168`–`:210` · 注 `:210`） | 补 4 行写域：#152 `thincoder-vscode/src/agent/setup.mjs`（421 · Δ≤±1 注释 · 结构不变）· #187① `thincoder-vscode/src/extension/panel-session-write.mjs`（144 · ±1）· #187② `thincoder-vscode/webview/activity.js`（450 · ±1）· #180② `thincoder-vscode/src/extension/session-gc.mjs`（21 · ±1 可选）；**#111② 断言宿主点名** = `thincoder-cli/test/input-lock.test.mjs`（395 · T-CL-U1 族）；原同格「#111② CLI 断言」误归 `thincoder-core/test/**` 已撤；`setup.mjs` 行注「零增行约束」+ 在册「500 = 硬限在位」读数收正（`ceb03b45` 拆分后现读 421） |
| 2 🟡 | §2.4（同上）+ **新增 §2.4.1**（`:233`） | 全表现况行一次性 `wc -l` 补测（as-of 2026-09-22 本席实测——「实施轮取准」行清零）；>300 档逐档「不拆 + 理由 + 触发 + 登记 / 拆分计划」= §2.4.1 尺寸档块 **17 行**（15 + 修正轮 2 #1 补行 16 + #6 连带条件行 17）；登记面点名：核 = `thincoder-core/test/core-hygiene.test.mjs:71-84` `SOFT_LINE_REGISTRY`（**机检硬门**，断言 `:143-157`）+ 设计侧 `docs/core/design/CORE-UNIFICATION.md` §2.8.1；VSC = `docs/vsc/design/VSC-DEBT.md` §12.1；CLI = advisory（先例 `docs/core/design/AGENT-LOOP-SUBAGENT.md:1708`）；在册先例 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:2164`；`setup-tooltable.mjs` 行「建议同轮核实登记」→ 点名登记面；`session-gc.mjs`（292 + Δ10~20）标「**可能越 300 咨询线**」⇒ 越线即同批登记（改 `thincoder-core/test/core-hygiene.test.mjs`；该档列为 §2.4 条件行） |
| 3 🟡 | §2.4 `context.mjs` 行（`:184`） | 441 → **440（本席 2026-09-22 实测）** + 标「**实施轮开工复测为准**」+ 在册坐标反证记录在档（`docs/core/design/AGENT-LOOP-SUBAGENT.md:2237` 载内部坐标 `:483` · `docs/core/design/DOC-DISCIPLINE.md:549`/`:559` 载 `:495`）⇒ 真实值按 `unverified`，**不得以任一读数作既成事实** |
| 4 🟡 | §2.6 AC-5（`:287`）+ §2.1 #203 行（`:64`）+ #216 行（`:66`） | 补「迁移期引文形态」**三合一前提**（`docs/core/design/DOC-DISCIPLINE.md:885`–`:887`）+ **失据判据**（`:892` 防滥用①/③）+ **改述（去死名坐标形态——§3.8-A `:310`）列为首选分支**；「有承接者不得用标记」句入档 |
| 6 🟡 | §2.5-5（`:268`）+ §2.7 上抛 4（`:317`）+ §2.1 #220 行（`:81`） | 上抛 4 收口：三候选实存已核（评审轮 1 实读 §6.7 `:10`（含 §6.7.2 `:32`）· §6.8 `:120` · §6.27 `:1034`）；「§6.15.3 不可采用」改述为「**本档无 §6.15.3**；**母档 §6.15 存否 = 实施轮改指前实读复核**」；#220 行补同款复核句 |
| 7 🔵 | §2.1 #218 行（`:67`） | §12「台账 52 行」→「**以 `--emit` 现读为准——现读 53 行**（`:363`–`:415`）」；§13 保留 51 行（评审实核 `:433`–`:483`）；处置句补「§12 行数标签按现读收正」 |
| 8 🔵 | §2.0 坐标口径（`:49`）+ §2.1 / §2.2 / §2.4 / §2.5 全扫 | 新增「坐标形态」段（D4 细则 = `docs/core/design/DOC-DISCIPLINE.md:37`）：档坐标补仓根完整路径；同名消歧三组（`docs/cli/design/TUI.md` ∥ `docs/cli/requirements/TUI.md`；`thincoder-core/session-gc.mjs` ∥ `thincoder-vscode/src/extension/session-gc.mjs`；`thincoder-core/agent/run-stages.mjs` ∥ `thincoder-vscode/src/agent/run-stages.mjs`）；逐处落位 = §2.1（#203 · #216 · #218 · #225 · #153 · #187 · #220）+ **修正轮 2 补扫**（#200 `:61` 机检 · #218 `:67` 机检 · #193 `:79` · #111 `:89` · #151 `:90` 机检 · #167 `:92` · #172 `:93` · #178 `:94` 机检 · #217 `:97` 机检 · #219 `:98` · #221 `:99`——目标列 + 机检列）· §2.2（15 处首次点名）· §2.4 .md 表（`MULTI-INSTANCE-COLLAB.md` 与冻结档 ×5 路径补齐 + 台账行）· §2.5（1 / 3 / 4 / 5 / 8 / 9 / 10 条） |
| 9 🔵 | §2.1 #153（`:75`）/ #225（`:68`）行 + §2.7 KD-5 + **新增 §2.4.2**（`:257`） | 明示「**受影响文件行 = 扫描面依赖（实施轮开跑读数）**」+ 枚举命令 / 基线计数口径（N₀ → 0 核销锚；先例 = `docs/core/design/DOC-DISCIPLINE.md:217`）；AC-4 机检面同轮加两条（§2.4.1 / §2.4.2 在档） |

**同轮发现（上抛 · 报告面，非本批引入）**：① §2.5-11（修正轮复跑 = 悬空 17 / 行宽 16 → 终态 **17 / 17**；上浮条目全为他流在途写入——含需求档 `docs/core/requirements/SESSION.md:39`）⇒ 实施轮仍以**开工前实跑**为准；**修正轮 2 复跑 = 悬空 16 / 行宽 12**（同 §2.5-11——仍为时点值）；② §2.4 表后注（在册 `docs/core/design/AGENT-LOOP-SUBAGENT.md:2099` 的「`setup.mjs` 500 = 硬限在位」读数已随 `ceb03b45` 拆分消解——该在册行如需收正属该档 owning 面，本批不改）。

**边界（本轮不做）**：#5（父侧已改述闭合）· 33 条处置本体（除 1 / 2 / 3 / 7 / 8 / 9 涉及文本）· 冻结批档 / 需求档 / 产品码 / 台账**零触** · 不扩扫。机检面 = 本席改动仅落本批档（`docs/batches/**` 不在 doc-check 扫描域）⇒ **净增 0**。

### 2.9 修正轮 2（评审 id=24 · pass 🟡4 🔵4 → 8 条）逐条落位

**性质**：**点修**——逐号落位、**就地替换**（不留旧形；承 2026-09-18「失效的表达必须删」裁）+ 本块留痕（号 → 落位）；**零新语义**（只收正：裁定同态 / 菜单判类 / 枚举定义 / 计数 / 读数 / 坐标形态 / 写域声明）。父侧已逐条裁定接受。

| # | 落位（本档 · as-of 本轮落笔） | 收正内容 |
|---|---|---|
| 1 🟡 | §2.4.1 行 16 + §2.4 `tool-seams-agent` 行 + §2.4 `core-hygiene` 行 + §2.8 行 2 计数 | 补 `thincoder-core/test/tool-seams-agent.test.mjs`（322 · Δ+3~8 · 不拆理由 = 断言追加落既有 plan 工具域宿主 + 拆分方案 = 拒翻用例组随下次触碰该档的批拆出邻档 · 触发 = 越 500 硬限 ∨ 下次实质改动 · 登记面 = `SOFT_LINE_REGISTRY` 在册）；该档在册注记（`thincoder-core/test/core-hygiene.test.mjs:61-62`「设计档无对应行 … 待设计侧收正」）随本行收正（连带注记 ±0~1 已入 §2.4 条件行）；闭合计数 **15 → 17**（行 16 = #1 面 · 行 17 = #6 连带面） |
| 2 🟡 | §2.1 `:61`（#200）· §2.4 .md 表 #200 行 · §2.3（标题 + 7 项标签 + `:129` / `:135` / `:142`）· §2.5-2 / -4 · §2.6 AC-2 · §2.7（标题 + 上抛 1 / 2 / 3 / 5） | 全簇改「**已裁 / 已收口**」并回指 §1 `:25`–`:32`（F2/F3 落 · F4 = 不加 + 一行指针 · 备选不取 · #153 射程采默认 · #203/#216 去重 · #201① 零动作 · #206 台账收正）；「待裁 N」标签 → 「**裁定项 N**」⇒ **§2 侧「待裁 / 请裁」零残留** |
| 3 🟡 | §2.1 #203 行 · #216 行 · §2.6 AC-5 | 处置菜单前加**判类第 0 步**（按 `docs/core/design/DOC-DISCIPLINE.md:310`–`:312` 判 A / B / C：B 类零触碰（残差登记 = `:344`）· C 类零触碰 + 列表上抛；整表对象全过期者按 `:320` 归承接档下次实质修订）；**余行**再走折行 / 改指 / 改述 / 删除 |
| 4 🟡 | §2.1 #153 行 | 补 **J1/J2/J3 单源**（`docs/core/design/PROMPT-SYSTEM.md:202`–`:204` · §6.6）与 **2 处已实证漏勘先例坐标**（`thincoder-core/agent-tools/subagent-actions.mjs:247` / `:299` · as-of 2026-09-20；证据 = `docs/batches/2026-09-20-prompt-refs-zero-batch.md:541` / `:569`） |
| 5 🔵 | §2.6 AC-1 · §2.7 KD-6 | 删「实施轮取准」豁免子句（已无对象）；KD-6 改为「实施轮落笔前一律复读」 |
| 6 🔵 | §2.1 目标 / 机检列（#200 `:61` · #218 `:67` · #193 `:79` · #111 `:89` · #151 `:90` · #167 `:92` · #172 `:93` · #178 `:94` · #217 `:97` · #219 `:98` · #221 `:99`）+ §2.4 新增两行 + §2.8 行 8 | 坐标统一**仓根完整路径**；`manifest.test.mjs` / `doc-check.mjs` 消歧为 `thincoder-core/test/manifest.test.mjs:3` / `scripts/doc-check.mjs:4`（靶位现读实核在盘）；二者以 **§2.4 条件行**入写域（#193 同族候选面；命中即改指 / 改述——改指目标 = `docs/core/design/MANIFEST.md` §3 / `docs/core/design/DOC-DISCIPLINE.md` §7，两判 = `docs/batches/2026-09-18-dead-pointer-sweep.md:117` / `:124` 同源） |
| 7 🔵 | §2.4 .md 表新增台账行 | 明示「台账 = **主 agent 自持面** · 不入本表写域声明」（本体 = SQLite · 键控项目根 · 工作区外；`docs/TODO.md` / `docs/TODO-archive.md` = 在册档位、本批零触） |
| 8 🔵 | §2.1 #216 行 · §2.3-5（算式 + 边界）· §2.6 AC-5 · §2.5-11 · §2.8 同轮发现① | 去重算式 / 入闸集读数加「**以开工前实跑为准 · 现读数见 §2.5-11**」；§2.5-11 补**修正轮 2 实跑读数 = 悬空 16 / 行宽 12**（时点值——并行写入漂移） |

**本轮读回**：#1 计数 = **17**（§2.4.1 行 16 / 17 + §2.8 行 2）——其中 16 = #1 面、+1 = #6 连带面（见下注）；§2 侧「待裁 / 请裁」grep = **0**（残留仅 §1 裁定块与 §3 评审原文——非本席笔域）；§2.1 坐标形态 = 仓根完整路径（§2.0 `:49` 口径）。

**注（#1 与 #6 的计数关系 · 显式）**：本修正轮对 §2.4.1 的净增 = **+2**：行 16 = #1 面（父侧验收口径「计数 16」对应本行）；行 17 = #6 连带——`thincoder-core/test/manifest.test.mjs`（480 · 在册）入写域后，依「>300 档须入块」既判据须补行；**块内终态 = 17**。

**边界（本轮不做）**：33 条处置本体（除 1 / 2 / 3 / 4 / 6 / 7 / 8 涉及文本）· 设计档 / 需求档 / 源码 / 冻结批档 / 台账**零触** · 不扩扫。机检面 = 本席改动仅落本批档（`docs/batches/**` 不在 doc-check 扫描域）⇒ **净增 0**（开工前基线 = 悬空 16 / 行宽 12；落笔后复跑见交付报告）。

### 2.10 实施轮 errata（#107 · 冻结档哈希裸引——**冻结档零改**）

**errata（2026-09-22 · 实施轮落）**：四处哈希裸引**不触碰**冻结批档，逐行登记如下——四者均属 `.git` 误删事故窗（2026-09-17→09-20）提交、**现行历史不可达**（开工前 `git log` 四前缀逐查零命中；事实链 = 对应批档自证「哈希不可恢复」）：

| # | 冻结批档（零改） | 裸引哈希 | 性质 |
|---|---|---|---|
| 1 | `docs/batches/2026-09-17-activebatch-repeal.md:312` | `aff5bc08` | 事故窗提交 · 现行历史不可达 |
| 2 | `docs/batches/2026-09-17-async-face-fixes.md:755` | `126c3abe` | 同上 |
| 3 | `docs/batches/2026-09-17-subagent-zero-block.md:478` | `c8bb261d` | 同上 |
| 4 | `docs/batches/2026-09-19-ledger-lifecycle.md:694` | `0b73794d` | 同上 |

**处置口径**（承 §1 `:26` 裁定 2 = 冻结档零改 + errata 落本批 §2；备选「DOC-DISCIPLINE 加纪律行」**已裁不取**）：本批仅登 errata，**不新增纪律语、不返改冻结档**；长期可查面 = 本表（记录面）+ 台账 #107 结账单行（主 agent 笔）。冻结档 diff = **0**（本批实施轮零触）。

### 2.11 实施轮登记（#203 / #216 判类分布 · 残差登记 · #225 扫描面读数——2026-09-22 落）

**判类口径**：单源 = `docs/core/design/DOC-DISCIPLINE.md:310`–`:312`（A 现态改指 / B 史实保留 / C 需求档）；判定单位 = 行；B 之落点 = **变更记录段 + 带时点锚行**（本批实测：全部落于变更记录段）。

**A 类（已处置）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` 4 处（F10 行扩残余两项 · `setup.mjs` 裸名 ×2 改指 `thincoder-vscode/src/agent/setup.mjs` · 否定式指称改裸名 `WEBVIEW-TOOLTABLE.md`）+ A-3 机检命令软折行 1 · `docs/core/design/TOOLS.md` 9 处裸名改指（逐处补 `thincoder-core/` ∥ `thincoder-vscode/`）+ 3 处行宽折行 · `docs/vsc/design/WEBVIEW.md` 5 处（shell 结构句重出 + `headerText` / `stateWord` / `tailLines` / `refreshBlock` 四坐标）· `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 53 行 + §13 51 行 ②③ 列全表重出 + 两表头 as-of 行 + §3.1 发射端句去史实措辞 · `docs/vsc/design/WEBVIEW-INPUT.md` D-I11 去尸语 · `docs/core/design/SESSION.md` §6.7 VSC 侧措辞收正 + 等价注 · #225 规范面 5 处（`CONTEXT-COMPACTION.md` · `SETTINGS.md` · `TUI-SESSION-VIEW.md` · `DOC-DISCIPLINE.md` · `ENGINEERING-MODE-V2.md`）。

**B 类（零触碰 · 残差登记——携消解路径）**：悬空 4 锚 + 行宽 2 行，**全部住变更记录段**：
`docs/core/design/SESSION.md:784`（`index.mjs:444-450`——EXIT-CLAIM-RELEASE 批变更记录行）· `docs/core/design/TOOLS.md:923`（`agent.mjs:169-170`——tool-discipline 批变更记录行）· `docs/core/design/TOOLS.md:929`（`run-stages.mjs:91-92` · `agent.mjs:418`——同批变更记录行）· `docs/core/design/BATCH-RECORD.md:358`（589 字符）· `:365`（302 字符）（batch-lifecycle-tool 批变更记录行）。
**消解路径** = 该档下次实质修订时随笔处置，或按 `docs/core/design/DOC-DISCIPLINE.md` §4.2.10 迁入迁移期引文族（**须父侧裁定射程**）；**到期条件** = `docs/core/design/` 下一次板块级 sweep。

**C 类（需求档）**：本席射程内**零命中**（需求档 #216 行宽 5 处 · #225 需求档面 · #114 = 主 agent 笔，本席零触）。**整表对象全过期者**（`:320` 分支）：本批入闸集内**零命中**。

**机检读数（开工前 → 落笔后 · 本席实跑）**：`node scripts/doc-check.mjs --root .` ⇒ **悬空 16 → 4** · **行宽 12 → 2**（残差 = 上表 B 类 6 条；本席改动面 11 设计档 + 本批档**零新增**——批档位 `docs/batches/**` 不在扫描域）。#218 = `node thincoder-vscode/test/protocol-coverage{,-reverse}.test.mjs --emit` 双 **exit 0** + 表行数**不变**（§12 = 53 · §13 = 51）。

**#225 扫描面读数（N₀ · 开跑实测）**：射程 = `docs/**/design/**`（排除 `_archive/` · `prompts/`）+ **变更记录段外**；族 = ① 日期 / 编号式「收正 / 改判 / 修订」括注 **274 行** ② `~~` **5 行** ③ 尸语（作废 / 挂尸 / 墓志 / 失效表达）**64 行** = **N₀ = 343 行**。**判读口径** = D8 两分（`docs/core/design/DOC-DISCIPLINE.md:30`：指向在位对象 = **出处注 ⇒ 照留**；指向已消失对象 = **退役挂尸 ⇒ 删**）+ 机扫豁免族四类（`:32` ⓐ–ⓓ）。
**本轮已闭合**：尸语 / 对照语 5 处（见上 A 类末项）。**残差（上抛 · 未闭合）**：强候选 = `docs/core/design/CONTEXT-COMPACTION.md:233` / `:248` · `docs/core/design/DOC-SYSTEM.md:233` · `docs/core/design/MULTI-INSTANCE-COLLAB.md:163` · `docs/vsc/design/SETTINGS.md:158` / `:170` / `:379` · `docs/cli/design/TUI.md:607`（后者为 D8 豁免ⓐ「规则正文反例引用」⇒ 判**留**）· 需求档同款 = `docs/core/requirements/ENGINEERING-MODE-V2.md:697`（**主 agent 笔**）。
**如实声明**：N₀ = 343 的逐行二态判定超出本实施轮预算（严格族已闭合；出处注类 = 绝大多数 ⇒ 无需动作）⇒ **本轮不冒充「全清」**；全量候选清单与判读口径已交（供父侧另派或本批 §6 登记）。

### 2.12 上抛处置轮（#225 修订式标记族 · 强候选 7 处二态判定 + TOOLS.md:775 重述 · 2026-09-22）

**性质**：**点修**（承 §2.11 上抛残差；处置建议列 = 父侧裁定 · 处置执行人 = 本席）——逐处实读语境 → D8 两分（`docs/core/design/DOC-DISCIPLINE.md:30`）+ 措辞退场批口径（`docs/batches/2026-09-22-wording-retire.md:146`–`:148`：「（日期 · 收正）」式**转裁定语**；编辑史尸体形**整删**）；**只做最小形**；**零新语义**；记录面 / 变更记录段零触；需求档 / 代码 / 测试 / 台账 / 冻结档零触；不扩扫（N₀=343 全量二态另册）。

**逐条落位（号 → 改动 file:line）**：

| # | 坐标 | 二态判定 | 改动（改后句要害） |
|---|---|---|---|
| 1 | `docs/core/design/CONTEXT-COMPACTION.md:233` | 活面 · 有日期锚 ⇒ 转裁定语 | 「（**作废 · 2026-09-18 实施轮受控实测推翻**）」→「（2026-09-18 裁定）」 |
| 2 | `docs/core/design/CONTEXT-COMPACTION.md:248` | 活面 · 无裁定锚 ⇒ 整删 | 删「；v1 的 `tools = 不带` 决定随之作废（下节收正）」 |
| 3 | `docs/core/design/DOC-SYSTEM.md:233` | **判留（零动作）** | 记录面——2026-09-18 失效表达清理批已裁定「§8.2 v1 方案块保留（记录面 · 沿革载体）」（本档 `:380`/`:384` 在案）；父侧边界「记录面不动」 |
| 4 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:163` | **判留（零动作）** | 记录面——2026-09-18 判据面收正批「§5 整节收正为历史条；历史归本记录与 §5 历史条」（本档 `:254` 在案） |
| 5 | `docs/vsc/design/SETTINGS.md:158` | 活面 · 有裁定锚 ⇒ 转裁定语 | 去「原『受裁例外』条随…作废」；改「provider 行 − **随用户 08:11 裁定 A 判入本门**」 |
| 6 | `docs/vsc/design/SETTINGS.md:170` | 活面 · 转裁定语 | 「（需求档同笔已作废）」→「（需求档同笔已收正）」（「随 08:11 裁定退场」保留） |
| 7 | `docs/vsc/design/SETTINGS.md:379` | 活面 · 对照语删 | 「（例外条作废 → §2.10 类判据句）」→「（判据句 = §2.10）」 |
| 8 | `docs/core/design/TOOLS.md:775` | **重述现态**（#217 已并入本批 C 面） | 「= **另册**（台账 #217）——本批零触碰」→「= **台账 #217——已并入本批 C 面（hygiene-sweep），随本批落**」 |

**预判留（零动作）**：`docs/cli/design/TUI.md:607` = D8 豁免ⓐ（规则正文自身反例引用）⇒ 判留（父侧指派）。

**变更留痕（D7）**：三档变更记录各 +1 行（`docs/core/design/CONTEXT-COMPACTION.md:731` · `docs/vsc/design/SETTINGS.md:441` · `docs/core/design/TOOLS.md:919`）；判留两档零动作 ⇒ 零留痕。

**机检（本席实跑 `node scripts/doc-check.mjs --root .`）**：开工前 = **悬空 4 / 行宽 2**（全为 B 类变更记录段残差）→ 落笔后 = **悬空 4 / 行宽 3**；悬空 = **同集**（TOOLS 两项随 +2 变更记录行位移 `:923`→`:925` / `:929`→`:931`）；行宽 +1 = `docs/core/requirements/AGENT-LOOP.md:294`（311 字符——**需求档 · 他流 2026-09-22 在途写入 · 非本席写域**，本席零触）。**本席改动面 = 3 设计档 ⇒ 零新增**。

**边界（本轮不做）**：记录面 / 变更记录段（含 B 类 6 条残差）零触 · 需求档零触 · 代码 / 测试 / 台账 / 冻结档零触 · N₀=343 其余候选不判（另册登记）· 不重开已闭合 5 处 · 未越权改判 `:380`/`:384` 与 `:254` 的「保留」先裁（如需翻转 ⇒ 父侧裁定）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements/Clarity — affected-file coverage | 🔴 | §2.4 受影响文件表（本批写域声明）未覆盖任务表点名要改的源档：`docs/batches/2026-09-22-hygiene-sweep.md:73`（#152）要求改 `thincoder-vscode/src/agent/setup.mjs` 七处注释，而 §2.4（`:169`–`:190`）无该档行；`:77`（#187 ①②）要求改 `thincoder-vscode/src/extension/panel-session-write.mjs:133` 与 `thincoder-vscode/webview/activity.js:315`，两档均无行；`:76`（#180②）涉 `thincoder-vscode/src/extension/session-gc.mjs:8` 亦无行。另 `:189` 把「#111② CLI 断言」归入 `thincoder-core/test/**`，与 `:88` 的「CLI 补 1 条对位断言」相抵——断言宿主档未点名。射程内在册证据显示其中一档处于硬限：`docs/core/design/AGENT-LOOP-SUBAGENT.md:2099` 记 `setup.mjs` 现量 500 = 硬限在位 ⇒ 漏登记使硬限风险不可见。 | 将上述 3~4 档补入 §2.4（现况行 + 预计 Δ；注释类改写标「结构不变 / ≤±1」），并点名 #111② 断言的宿主档；`setup.mjs` 行注明硬限在位与零增行约束。 |
| 2 | Affected-file size annotations / AC 一致性 | 🟡 | §2.4 有 12+ 行现况行数延后取准（`:181`「≥284（grep 末位…）」· `:182`「≈121」· `:183`–`:189`「实施轮取准」），与本批自订 AC-4（`:233`「码 / 测档含现况行 + Δ」）不相容；这些行也无法在设计轮做档位核查——`thincoder-core/session-gc.mjs`（`:181`，`≥284` + 本批 Δ+10~20）可能因本批自身增量越过 300 咨询线而无拆分审视。已实测的 >300 档（`:169`–`:174`：343 / 422 / 421 / 331 / 377 / 457）只标「>300、<500 ✓」，未附不拆理由 / 触发 / 拆分或软线登记（项目先例 = `docs/core/design/DOC-DISCIPLINE.md:604`–`:609` §3.9 尺寸档块、`:639`–`:648` §3.10；软线登记面在册见 `docs/core/design/AGENT-LOOP-SUBAGENT.md:2164`）。 | 设计轮补齐现况行数（一次性 `wc -l` 即可）或明示档位状态；>300 各行补「不拆 + 理由 + 触发 +（登记 / 拆分计划）」；`setup-tooltable.mjs` 行的「建议同轮核实登记」点名登记面。 |
| 3 | Affected-file numbers（抽检） | 🟡 | `thincoder-core/context.mjs` 标 441 行 /「<500 ✓」（`:179`），但在册文档载有该档内部坐标 `:483`（`docs/core/design/AGENT-LOOP-SUBAGENT.md:2235`——「逐处实核未漂移」）与 `:495`（`docs/core/design/DOC-DISCIPLINE.md:549`、`:559`——A-DD19 ⑤「逐处在目标档实存」，as-of 2026-09-18）。两读数不可同真（除非四日内删除 ≥54 行）。 | 实施轮开工先复测该档行数再定档位（若 ≥500 即触硬限口径）；该档本体属评审射程外，其真实值按 `unverified` 记，勿以 441 作既成事实。 |
| 4 | Methodology（判据引用） | 🟡 | AC-5 处置菜单「或按迁移期引文形态列报」（`:237`）与 #203 的「不存在 ⇒ 删指称或按迁移期引文形态列报」（`:63`）未带该族成立条件：`docs/core/design/DOC-DISCIPLINE.md:885`–`:887` 判据 = **三合一**（标记 + 史实谓词 + 悬空），`:892` 防滥用①/③ = 无史实谓词打标记即「失据」照红；§3.8-A（`:310`）对「无承接者」的既有口径是**改述（去死名坐标形态）**——比「删指称」更保语义（如 `:2069` 的 `WEBVIEW-TOOLTABLE.md` 否定式指称）。 | 在 AC-5 / #203 写明「三合一」前提与失据判据（或删去该出路），并把「改述（裸名 / 去坐标形态）」列为无对象目标的首选分支。 |
| 5 | Doc-state consistency | 🟡 | §1 裁定块引「发现⑩（§2 表行 >300 字符）」（`:32`），但 §2.5 第 10 条（`:224`）为「行为面实读确认无『台账前提不实』者」，全表无「§2 表行 >300 字符」条 ⇒ 该裁定对象在设计发现表内不可定位（发现⑤ 与 `:219` 可对，发现⑩ 不可对）。 | 核对该引用与 §2.5 现列条目的对应（改述引用或回填该发现），使裁定对象可定位。 |
| 6 | Verification（上抛 4 确认） | 🟡 | 评审确认请求（`:267` 上抛 4 / `:219`）：三候选在本档实存已核——§6.7（`docs/core/design/AGENT-LOOP-SUBAGENT.md:10`，含 §6.7.2 `:32`）· §6.8（`:120`）· §6.27（`:1034`）；但「『§6.15.3』不可采用」只据本档小节范围，而本档头注在册（`:5`「母档续 §6.1–§6.6 + §6.13–§6.17」）⇒ §6.15 可能住在 `docs/core/design/AGENT-LOOP.md`（评审射程外 → `unverified`）。 | 改指前先以母档实读复核 §6.15 存否（KD-4 已要求复读靶行）；候选口径本身（§6.7 / §6.8 / §6.27）可维持。 |
| 7 | Acceptance criteria / 数字漂移 | 🔵 | #218 标「§13（发面，台账 51 行）/ §12（收面，台账 52 行）」（`:66`）；射程内实核：`docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 现为 51 行（`:433`–`:483`）✓，§12 现为 **53** 行（`:363`–`:415`；2026-09-22 新增 `busyQueued` 行在 `:367`）⇒ §12 标签差 1；#218 判据「表行数不增不减」不挂该标签，捕捉不到此差。 | 实施轮以 `--emit` 现读重出时一并收正该标签（重出已为设计所要求，此处只须勿沿用旧数）。 |
| 8 | Clarity（坐标消歧） | 🔵 | §2.5-4（`:218`）以裸名回引台账坐标（`TUI.md:24` · `TUI.md:92`），而仓内同名两档（`docs/cli/design/TUI.md`＝评审射程内、`docs/cli/requirements/TUI.md`）；`:65` 等处亦用省 `docs/` 根段的形态（`design/TOOLS.md` · `core/requirements/PROMPT-SYSTEM.md`）。同名消歧与 V5 唯一定位均要求仓根完整路径（形态纪律见 `docs/core/design/DOC-DISCIPLINE.md:37`）。 | 同批统一为仓根完整路径形态（或逐处消歧），免实施轮指向歧义。 |
| 9 | Scope / write-domain | 🔵 | #153（`:74`）与 #225（`:67`）以「扫描方案 / 全树扫描」形态交付：候选集在实施轮才产出 ⇒ 这两项的受影响文件行天然无法闭合，且 #225 的验收「候选表逐条闭合（规范面 N → 0）」无设计轮基线 N（对照 `docs/core/design/DOC-DISCIPLINE.md:217` 的 §3.7 先例 = 设计轮即给 143 行 / 88 档计数）。 | 明示这两项文件行 = 「扫描面依赖（实施轮开跑读数）」并给枚举命令 / 基线计数口径，使后续核销有锚。 |

判定限制：文档地图缺失 ⇒ Document ownership 维度降级判定（按 Project Guide + 射程内文档自身约定）；未声明项目标准档 ⇒ 方法学合规以 AGENTS.md + `docs/core/design/DOC-DISCIPLINE.md` 为标尺。射程外未核项（unverified，无严重级）：台账本体 `docs/TODO.md` · `docs/vsc/design/WEBVIEW.md`（#160）· `docs/core/design/BATCH-RECORD.md:358/:365`（#203）· `thincoder-vscode/src/tools/index.mjs:172-186`（#206）· `--emit` 工具两档（#218）· `docs/core/design/MEMORY.md` / `MULTI-INSTANCE-COLLAB.md`（#225 样本）· `thincoder-core/package.json` / VSC `AGENTS.md:15`/`:51`（#200）· 各 B/C 条产品码靶档。

已实核通过项（供父侧对读）：#201①（`docs/vsc/design/WEBVIEW-PROTOCOL.md:96` 行 14 在盘 + `:509` 登记行逐字在盘）· #202 靶行 `:73` 现文与设计转述一致 · #203 该档唯一非表行 >300 行 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:2094`（字符数 345 未复测）· §6.7/§6.8/§6.27 标题实存 · §3.2 = 17 行 / §6.3 = 20 键 / §13 = 51 行（计数自洽）。

VERDICT: changes-required

计数：🔴 1 · 🟡 5 · 🔵 3（共 9 条；射程外未核项与限制见上）。

### 轮次 2（评审子代理）

（轮次 2 · 修正轮 1 后复评 · 射程 = `docs/batches/2026-09-22-hygiene-sweep.md` + `docs/core/design/DOC-DISCIPLINE.md`）

判定限制：文档地图缺失 ⇒ Document ownership 维度降级判定（对照 Project Guide 与射程内文档自身约定：未发现分片建档、未发现与 `DOC-DISCIPLINE` 相抵的机制表述）；未声明项目标准档 ⇒ 方法学合规以 AGENTS.md + 射程内 `DOC-DISCIPLINE` 为标尺。射程外未核项（`unverified`，无严重级）：§2.4 逐档现况行数、§2.2 代码实读、§2.5 文档实读、#218 的 `--emit` 计数、§6.x 小节存在性等一切指向射程外档的读数——本轮未抽检（受声明射程所限）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | `:207` 把 `thincoder-core/test/tool-seams-agent.test.mjs`（322 · Δ+3~8 · #210 断言宿主）标为「>300（存量 · 在册）」，但 §2.4.1（`:239`–`:255`）行 1–15 无该档条目——同为「已在册」的核侧档均入块（行 3 `tools/git.mjs` · 行 13 `agent.mjs` · 行 14 `subagent-async.mjs` · 行 15 `context.mjs`）⇒ 该 >300 档级的「不拆 + 理由 + 触发 + 登记」缺位；`:327` 的闭合计数「15 行」随之不全。 | 给该档补一行尺寸档条目（现况 322 · Δ+3~8 · 不拆理由 · 触发 · 登记面 = `SOFT_LINE_REGISTRY` 在册），并把 `:327` 的闭合计数同步（15 → 16）。 |
| 2 | Doc-state consistency（裁定状态双载） | 🟡 | `:25`–`:32` 已落 7 待裁裁定（F2/F3「按推荐落」· F4「不加 + 一行指针」· 待裁 2/3「备选不取」· #153「射程采默认」），而 §2 侧仍按未决呈现：`:61`「F2/F3/F4 = **待裁**（§2.3）」· `:229`「`#200` 待裁 1 通过后落」· `:129`/`:135`/`:142`「最需用户裁 / 需用户裁」· `:314`–`:316` 上抛 1/2/3「建议**用户裁**」· `:318` 上抛 5「如需全含请裁」⇒ 同一批件的裁定状态两处相抵，实施轮按 `:61`/`:229` 可把 F2/F3 读作未裁而漏落。 | 把 `:61` / `:229` / §2.3 待裁 1–3 的「待裁」句 / §2.7 上抛 1、2、3、5 改指或就地写明 `:25`–`:32` 已落裁定（F2/F3 落 · F4 = 不加 + 一行指针 · 备选不取 · #153 射程采默认），使任务书与裁定块同态。 |
| 3 | Methodology（判据承接） | 🟡 | 悬空项处置菜单只引 §3.8-**A**（`:64`），未带同表 B/C：`docs/core/design/DOC-DISCIPLINE.md:310`–`:312`（A 改指/改述 · B 已收口批叙述面 = **零触碰** · C 需求档 = **零触碰 · 列表上抛**）+ `:320`（整表已无对象分支）+ `:344`（B 类 39 锚 + C 类 7 锚 保留为悬空读数）；而 `:64` / `:66` / `:287`（AC-5）的菜单仅「折行 / 改指 / 改述 / 删除」，入闸集口径 = 「开工前实跑」（`:287` · `:154`）⇒ 若入闸行含 B/C 类行，菜单与既有 ×3 分判据直接相抵。 | 在 #203 / #216 / AC-5 菜单前加一步判类：先按 `DOC-DISCIPLINE.md:310`–`:312` 判 A/B/C；B 类零触碰（残差登记）、C 类零触碰并列表上抛，余行再走折行 / 改指 / 改述 / 删除。 |
| 4 | Clarity（枚举定义悬空） | 🟡 | `:259` 明示 #153 枚举式样「= §2.1 #153 行」，但 `:75` 仅「机判三式（J1 / J2 / J3）锁外的裸名形」一语，既未定义三式、也未指向定义处；同行「含 2 处已实证漏勘先例」无坐标 ⇒ 该条交付物（候选表 / 处置表）的判据输入在外查不可得时无法复跑（`:154` 待裁 6 只解决坐标漂移面）。 | 就地补 J1/J2/J3 三式定义（或指向其单源坐标）与「2 处已实证漏勘先例」的坐标，使枚举在实施轮可无外查复跑。 |
| 5 | Acceptance criteria（判据残留） | 🔵 | `:280`（AC-1）保留「标『实施轮取准』者为台账 as-of 明示项，不作为缺坐标计」；但 `:327` 已宣布该标记清零，`:170`–`:208` 现无任何该标记行 ⇒ 该判据子句已无对象（该词仅作为 `:48` / `:302` 的口径定义存活）。 | 删该子句或改为对 §2.4 现口径的实际豁免对象，免核验方按不存在的标记类别判缺。 |
| 6 | Clarity（坐标形态未扫净） | 🔵 | `:332` 记「§2.1 / §2.2 / §2.4 / §2.5 全扫」，但 §2.1 多行仍用省仓根段的形态：`:89`（`design/AGENT-LOOP-SUBAGENT.md:1500` · `upstream-parity.test.mjs:157`/`:171`）· `:92`（`cli/src/tui/cmd-eng.mjs` / `cmd-advisor.mjs` / `cmd-session.mjs`）· `:93`（`cli/src/tui/agent-turn.mjs` · `suspension-drive.mjs:32`）· `:98`（`vscode/webview/panels.js` · `src/extension/panel-messages.mjs`）· `:99`（`src/extension/panel-messages.mjs`）· `:61`（`src/prompt-injections.mjs:16-21`）· `:79`（`manifest.test.mjs:3` / `doc-check.mjs:3`——此二档若实扫命中即成写入目标，§2.4 亦无对应行）——与 `:49` 自订「档坐标一律仓根完整路径」相抵。 | 同批统一为仓根完整路径（并为 `manifest.test.mjs` / `doc-check.mjs` 消歧；若为写入目标则入 §2.4），或在 `:332` 明示全扫不含这些行。 |
| 7 | Write-domain declaration | 🔵 | §2.4 的 .md 改点表（`:212`–`:231`）无台账档行，而 `:57`（#107）· `:62`（#201）· `:65`（#206）· `:147`/`:157`/`:161` 与 `:291`（AC-9）多处把「台账收正」列为动作或收口证据（`docs/TODO.md` / `TODO-archive.md` 属文档档）。 | 在 §2.4 .md 表补台账行，或明示「台账 = 主 agent 自持面、不入本表写域声明」，使写域声明与动作清单同集。 |
| 8 | Numbers（口径漂移） | 🔵 | 去重算式仍是设计轮读数：`:151`「#216 = 余下 行宽 9 + 悬空 13 = 22 条」· `:66`「行宽余 9 / 悬空余 13」，而 `:274`（§2.5-11）/ `:287`（AC-5）的修正轮复跑 = 行宽 16 / 悬空 17（同去重法下 #216 份额 = 13 / 14 = 27）⇒ 两套数字并置，仅靠「以开工前实跑为准」兜底。 | 在 `:151` / `:66` 算式后加「（以开工前实跑为准 · 现读数见 §2.5-11）」或按 §2.5-11 重出算式，免实施轮以 22 为工作量基数。 |

已实核通过（供父侧对读）：33/33 覆盖（A 12 `:57`–`:68` · B 8 `:74`–`:81` · C 13 `:87`–`:99`，与 `:4` / `:44` 一致）· 评审轮 1 🔴 已闭合（补入 `:173` `:174` `:175` `:176` 四行 + `:187` 断言宿主点名 + `:210`/`:242` 硬限注）· 修正轮 1 各条就地可核（§2.4.1 `:239`–`:255` · §2.4.2 `:257`–`:260` · `:287` 三合一 + 失据 + 改述优先 · `:268`/`:317` 上抛 4 收口 · `:67` §12 标签 · `:184` 读数反证）· 引用均在盘可解析（`DOC-DISCIPLINE.md:37` · `:310` · `:604`–`:609` · `:639`–`:648` · `:217` · `:885`–`:887` · `:892`）· 标记字面单源（`DOC-DISCIPLINE.md:898`）遵守（本批档 grep 全角标记前缀零命中）· 记录面零触（`DOC-DISCIPLINE.md:31`）与 #225 口径（`:68`）同态 · 冻结档零改口径与 `:229`/`:268`/`:311` 一致。

VERDICT: pass

计数：🔴 0 · 🟡 4 · 🔵 4（共 8 条；射程外未核项与限制见上）。

## §4 用户批准（主 agent）

**批准（代签 · 2026-09-22 · 主 agent）**

- **授权依据** = 用户 2026-09-22 09:29「都自动跑吧」（四批 = 点火 + 代签 + 派发 + 收口全自动）；**自缚三项齐备**：① 评审 pass ✅（轮 2 · 0🔴 / 4🟡 / 4🔵）② 修正落地核验 ✅（轮 2 的 8 条 = 修正轮 id=26 逐条落位 + **父侧抽核**：`§2.4.1` 行 16/17 + `§2.9` 块 + `裁定项 N` 改述 + `判类第 0 步`（`:64`/`:66`）+ AC-1 豁免子句已删 + `§2.5-11` 时点读数）③ token 已签发 ✅。
- **修正轮 id=26 报告项 F1–F8 裁定**：F1（§2.4.1 终态 17 = 16 + #6 连带行）= **接受**（`manifest.test.mjs` 480 入写域 ⇒ 依「>300 入块」判据须补行）；F2（`PROMPT-SYSTEM.md:202-204`）/ F3（`scripts/doc-check.mjs:4`）= **接受**（按现读）；F4（`scripts/**` 归属）= **裁定：工程工具面 ⇒ 父侧直改**（不归 eng-coder——父侧落笔 + 单笔可 revert）；F5（`core-hygiene.test.mjs:61-62` 旧注记连带）= **接受**（Δ 已入条件行）；F6（`TODO.md` 与 #27 口径张力）= **记录接受**（低影响 · 登记在 §2.9 即可，不新开）；F7（复跑读数漂移）= **接受**（时点值 + 开工前实跑为闸）；F8（`§2.8` 记录面历史措辞保留）= **接受**（记录面留史，不回改）。
- **实施面分派（三面）**：① **eng-designer**（设计档面——按 §2.1 / §2.4 归属列 = 设计档者）；② **eng-coder**（产品码 / 测试 / 产品文本面）；③ **父侧**（需求档行 + `scripts/**` + 台账收正面）。
- **实施后收口**：§5/§6 + 台账逐项处置（#107/#114/#160/#198/#200/#201/#202/#203/#206/#216/#218/#225 + B/C 面各行）+ doc-check 两族归零（或按判类残差登记）+ 提交推送。

## §5 实施记录（eng-coder）

### 5.1 交付摘要（B 面 8 · C 面 13 · A 面 4，逐条在盘）

**收口读数（本席实跑）**：三端套件全绿 = core `node test/run.mjs` 566 pass / 0 fail · cli 805 pass / 0 fail · vsc 942 pass / 0 fail；`node scripts/doc-check.mjs --root .` = 悬空 4 / 行宽 2（开跑基线 = 悬空 4 / 行宽 3）⇒ **零新增**，残差全为他人面 B 类（`docs/core/design/BATCH-RECORD.md:358` = 589 字符 / `:365` = 302 字符）。

**B 面**
- **#152** `thincoder-vscode/src/agent/setup.mjs` 7 靶改指/删指称（档内 `§17.|§19.|11.2.1|§16` 现读零命中；新指 = `TOOLS.md §6.7` / `SESSION.md §6.15` / `AGENT-LOOP-ASYNC-POOL.md §6.8`）。
- **#158** `thincoder-core/agent-tools/subagent-async.mjs:58-64` 头注角色枚举收正（explore/plan/coder/eng-coder/eng-designer + 工程门两格），与 `agent-tools/subagent.mjs:238` ROLES 逐名一致。
- **#180①** `thincoder-cli/test/model-ref.test.mjs:20` 术语改「启动窗外延迟拍」（活体面「空闲拍」零命中）；**②** `thincoder-vscode/src/extension/session-gc.mjs:7-8` 坐标符号化（以函数名定位不落行号）。
- **#187①** `thincoder-vscode/src/extension/panel-session-write.mjs:133` 两腿同判等价注；**②** `thincoder-vscode/webview/activity.js:315` 写点锁定面注；**⑤** `thincoder-vscode/test/chat-panel.test.mjs:160` 退役符号尸体形整删（原括注名删、留现判据句）。
- **#193** 条件行 `thincoder-core/test/manifest.test.mjs:3` 改指 `MANIFEST.md` §3；`thincoder-cli/test/batch-segment.test.mjs` 现读无 `§2.20`。
- **#197** `thincoder-core/agent/write-gate.mjs:15`/`:41` 按现模型改述（启动侧恒不拒 KD-M1-25 · 判 + 报明 / 建档不抛 · 拒面 = 翻转可否进）；`拒进正常循环|入口门槛|启动期拦` 三产品树零命中。
- **#220** 六坐标全改：`thincoder-core/agent.mjs:31`/`:167` · `thincoder-core/agent/run-stages.mjs:230` · `thincoder-cli/src/tui/subagent-freeze.mjs:233` · `thincoder-cli/src/tui/suspension-drive.mjs:83` · `thincoder-vscode/test/files.mjs:68`。**改指目标档 = `AGENT-LOOP-ASYNC-POOL.md §6.8`**（与 §2.5-5 候选口径的 `AGENT-LOOP-SUBAGENT.md §6.7/§6.8/§6.27` 不同档名——实核该小节存于 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:12`「## 6.8 挂起回合与 digest（会话级后台双通道）」⇒ 满足「不得改指不存在小节」；§6.x 分散三档，归属留痕 = 本条）。
- **#153** 扫描方案交付 + 读数见 5.3。

**C 面**
- **#151** `thincoder-vscode/src/agent/setup-tooltable.mjs:163` 剥离正则改形态无关 `/panel \([^)]*\), ?/`；用例 `thincoder-vscode/test/agent-tools-registry.test.mjs:80-106`（含携档号旧形反证 ⇒ 新旧两形都剥）。
- **#164** `thincoder-cli/test/tui-stderr-capture.test.mjs:61`/`:72` 注入 `writeImpl`（消 loading 噪）· T-RT 改内容辨识（`:111` LOADING_MARK / `:112` isRecovery）· 补 loading 行内容断言（`:120`）。
- **#167** `thincoder-cli/src/tui/cmd-eng.mjs:95` / `cmd-advisor.mjs:30` = `agent._slot ?? activeSlot(agent.cwd)`（绑定优先；先例 `cmd-session.mjs:12`）；用例 `thincoder-cli/test/cmd-eng.test.mjs:198-214`。
- **#172** `thincoder-cli/src/tui/agent-turn.mjs:195`/`:199` 改读核键 `t("digest.capAuto")` / `t("digest.capStop", { turns: error.turn })`；字面仅存 `thincoder-core/i18n.mjs:42-43`（同值单源）。
- **#219** `thincoder-vscode/src/extension/panel-messages.mjs:294-297`（webviewReady + `_susp` 在场 ⇒ 重推 `suspension{active:true,…}`）；用例 `test/busy-injection-vsc.test.mjs` T-V19 段（含负控）；**webview 零改**（`webview/panels.js` 无 diff 实核）。
- **#221** `thincoder-vscode/src/extension/panel-messages.mjs:119` 复位推送前移至 `routeUserTurn` 入口（含 workspace 早退口 / 降级 await 之前），原后置推删除（`:172-173` 自述）；用例 `test/chat-panel-messages.test.mjs:75`。
- **#58** `thincoder-cli/src/tui/cmd-mcp-form.mjs:119` 敏感键值位遮（谓词 = 核同源 `thincoder-core/agent-tools/settings.mjs:22` `isSensitiveKey`，该函数本批加 `export`）；同条点名瑕疵 `settings.mjs:189` `formatLine` 对象值 JSON 化；新用例 `thincoder-cli/test/mcp-form-current.test.mjs`（CLI runner = glob + 漏收集自检 ⇒ 必被收集，无静默不跑面）。
- **#71** `thincoder-core/tools/git.mjs:157`（diff「pathspec 'x' matched nothing in HEAD」）/ `:205`（log 同形）两腿注记；不传 path 两腿逐字零变；status 腿零改；用例 `thincoder-core/test/tool-seams.test.mjs:142-153`。
- **#178** `thincoder-core/session-gc.mjs:236-238`（常量域）/`:270`（dry-run 预估行）/`:287`/`:290`（逐组进度行）——**只增显示行、判据与删除集零变**；单候选 / 单组面输出逐字零变（`GC_PROGRESS_MIN = 2`）；用例 `thincoder-cli/test/session-gc-cli.test.mjs:139-153`；越线登记见 5.2-5。
- **#209** `thincoder-core/test/compress-form.test.mjs:98-116`（单条 9000 字符 + `force` ⇒ `shrinkOversized` 直落：零 LLM 调用 + 截断桩 + 非 fallback 态 + 正控）。
- **#210** `thincoder-core/test/tool-seams-agent.test.mjs:168-173`（`{action:"nope"}` ⇒ 报错串逐字 + 零副作用）。
- **#111②** **判已覆盖 ⇒ 零代码动作**：CLI 侧对位断言已由 SIGNAL-LINES 批落于 `thincoder-cli/test/input-lock.test.mjs:255`（T-CL-U1：未 drain 的 ask ⇒ 恰开一轮 + 桩第 4 参 `upstreamTurn === true`）与 `:280`（T-CL-U2 按因分流），与 VSC 对位（`thincoder-vscode/test/upstream-parity.test.mjs:157`/`:171` T-VS-U3）同判面 ⇒ 不重复落笔（本档零 diff 实证）。
- **#217** `thincoder-vscode/src/agent/run-stages.mjs:105` 补 `&& !agent.config?.agent?.engineering`（核 `thincoder-core/agent/completion.mjs` 已有 ⇒ 端差默认 = 消）；用例 `thincoder-vscode/test/advisor-guard-rounds.test.mjs:59-73`（工程置位零推回 + 普通模式正控）。

**A 面（产品文本）**
- **#198** `thincoder-cli/README.md` 折行：该档 >300 字符行 **42 行**（设计点名 `:98` = 1167 字符）全折为 ≤300（现读最长 = 300）；折法 = 纯换行插入（**全档 `去空白+去引用前缀` 归一后与 `git show HEAD:thincoder-cli/README.md` 逐字等价**，本席 node 实证）；唯一例外 = 块引用行 `:102` 续行补 `> ` 前缀 1 处（Markdown 引用续行规范形，披露）。
- **#200** F2 `thincoder-core/package.json:39` += `"CHANGELOG.md"`；F3 `:34-36` += `publishConfig.access = "public"`（`JSON.parse` 实证可解析）；F4 `thincoder-core/README.md:77-78` += 一行指针（`CHANGELOG.md` + GitHub Releases）；F7 `thincoder-vscode/AGENTS.md:15`/`:51` 「13 锚」→「2 锚」（与 `src/prompt-injections.mjs:16-21` 两键逐数一致）；F-D `thincoder-vscode/README.md:188` docs/ 行标签补「迁移期归档」注（实核 `docs/design/` 下仅 `_archive/` 17 档 ⇒ 非客观假，按裁定补注不动）。
- **#201②** `git rm thincoder-vscode/test/fixtures/vscode-mock.mjs`（全仓 `fixtures/vscode-mock` 零引用实证：仅 `docs/batches/**` 记录面命中；活档 = `test/vscode-mock` 系列）。
- **#114** 双副本逐字同改：`thincoder-core/prompts/common.md:113`（bullet2 尾补「有专用工具时仍走工具路由表」桥接句）+ `:114`（bullet3 补 UNIX 对位 `2>/dev/null` / `;`）↔ 镜像 `docs/core/design/prompts/common.md:74-75` 同笔。

### 5.2 决策透明表（含披露与上抛项）

| # | 决策 / 发现 | 依据与实证 | 处置 |
|---|---|---|---|
| 1 | **DOC-DRIFT（上抛 · 非本席笔域）**：`docs/core/design/SETTINGS-TOOL.md:49` 现文「非敏感父对象沿用 `[object Object] (object)` 既有渲染（本批不动）」在本批后**成假陈述**（`thincoder-core/agent-tools/settings.mjs:189` 已 JSON 化）；同节 `:48` 的四处调用坐标随该编辑漂移 | §2.1 #58 处置句点名「同批修 `[object Object] (object)` 渲染瑕疵」；`thincoder-core/agent-tools/settings.mjs:189` = `const shown = isSensitiveKey(path) ? MASKED : !Array.isArray(value) && value !== null && typeof value === "object" ? JSON.stringify(value) : value` | 代码按设计落笔（#58 处置句已点名该修复）；**设计档未改**（非本席笔域）⇒ 报父侧：需 eng-designer 同笔收正该句 + `:48` 坐标 |
| 2 | **#198 折行范围扩至全档 42 行**（设计点名 `:98`） | §2.1 #198 机检列 = 「**该档**最长行 ≤300」——只折 `:98` 后该档最长仍 = 697 字符（`:24`）⇒ 机检字面不可达；折法零语义（见 5.1 #198 实证） | 按机检列全折（内容等价实证在档）；父侧若采窄读（只折 `:98`）可 `git restore` 该档后重折单行 |
| 3 | **§17 族残差 = 声明排除面（不扩扫）**，但 §2.1 #220 / #193 / #152 机检列写「活体面 grep 零命中」⇒ **口径相抵**，按字面不可判达成 | 台账枚举坐标 6/6 闭合（5.1 #220）；同族残差仍在活体面且住本批改动档内部（例：`thincoder-core/agent.mjs:107` = `// §17 D-S3: suspension-settled async results inject before EVERY run's prepareRun`；`thincoder-core/agent/run-stages.mjs:220`；`thincoder-cli/src/tui/suspension-drive.mjs:2`；`thincoder-vscode/src/agent/setup-tooltable.mjs:140` = `§19.6`） | 按**目标列**（点名坐标）交付 + 残差在此披露；**请父侧裁口径**（机检列非本席笔域）——本席不扩扫（§2.5「不扩扫」+ 传单硬约束） |
| 4 | **§2.4 表外新用例宿主 4 档**（条目 AC 要求的新用例载体，表遗漏非扩面） | `thincoder-cli/test/mcp-form-current.test.mjs`（新档 · #58）· `thincoder-cli/test/cmd-eng.test.mjs`（#167）· `thincoder-vscode/test/chat-panel-messages.test.mjs`（#221）· `thincoder-core/test/tool-seams.test.mjs`（#71） | 落笔并登记于此（表外改动全量披露） |
| 5 | **越线登记 3 档**（>300 咨询线）：`session-gc.mjs`（303 · #178）· `test/compress-form.test.mjs`（305 · #209）· `test/tool-seams.test.mjs`（314 · #71） | `thincoder-core/test/core-hygiene.test.mjs:154` 门法 = `split("\n").length - 1`；`SOFT_LINE_REGISTRY` 已含三档（同档 `:86`/`:87`）⇒ 核套件不红 | 已登记 + 注记（含「拆分方案 = 随下次触碰该档的批拆出邻档」）；**§2.4.1 无该两用例档行、闭合计数 17 未同步 ⇒ 设计侧收正项（上抛）**；登记注读数收正 1 处（compress-form 309→305，实测口径） |
| 6 | **评审请求清单路径 errata（本席自陈）**：advisor 调用清单中 9 条路径缺 `thincoder/` 根段且误归端（例 `thincoder-cli/src/tui/panel-messages.mjs` 实 = `thincoder-vscode/src/extension/panel-messages.mjs`；`thincoder-cli/src/tui/activity.js` 实 = `thincoder-vscode/webview/activity.js`） | 实读 glob 复核（该 9 条按字面不存在；真实档另在） | 评审覆盖以真实路径实读替代；**交付文件本身零影响**；本 errata 记此供父侧复勘 |
| 7 | #59 **冻结批档 / 台账 / 需求档 / 设计档零触**（本席写域 = 产品码 + 测试 + 产品文本 + `docs/core/design/prompts/common.md` 镜像 + 本段） | `git status` 实核（本席改动档集合见 5.1） | 如实声明；`docs/core/design/prompts/common.md` 的触碰 = §2.4 表明列（#114 双副本逐字同改） |

### 5.3 #153 裸名专勘（扫描方案 + 读数）

- **枚举** = 三式锁外**裸名形**（`（NAME-LIKE）` 大写连字符名）：**N₀ = 75 处 / 28 词**（域 = 三产品树 `.mjs` / `.js`；开跑读数）。
- **白名单排除** = `_archive/**` · `.thincoder/tmp/**` · `docs/batches/**`（射程采默认）。
- **逐候选二态**：**doc-name 形裸名 = 0**；其余 75 处全为决策号 / 测试号 / 批次名形（`(D-S3)` / `(T-C8)` / `(VSC-CONTEXT-PARITY)` 族）⇒ **全部判留**（可解析至其 owning 档）。
- **复跑残余 = 0**：先例形实扫（`\([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\)`，三产品树）未见 `(SUBAGENT-OBSERVE-SEND)` 族残留；候选表无「待定」行（核销锚满足）。

### 5.4 审计与代码评审轮次 · 终态

| 轮 | 类型 | 结论 | 响应 |
|---|---|---|---|
| 1 | 内部 explore **散度审计**（对照 §2 任务书） | **DEVIATIONS**：doc-drift ×1 · partial ×4 · out-of-list ×2 组 · 无 🔴 | 逐条见 5.5 |
| 1 | **advisor code 评审**（独立只读） | **VERDICT pass**：🔴 0 · 🟡 4（全为记录/声明面）· 🔵 2 | 逐条见 5.5 |
| fix r1 | 审计 + 评审响应（3 项） | ① #187⑤ 尸体形整删（`thincoder-vscode/test/chat-panel.test.mjs:160`）② `thincoder-core/test/core-hygiene.test.mjs:67` 读数收正（309→305；`test/tool-seams.test.mjs` 314 实测一致）③ 交付报告补 DOC-DRIFT + 口径相抵披露 | 已落 |
| — | **终态** | **clean（converged）**：无未决 🔴 / must-fix 🟡；余 🟡 四条全为记录面 / 声明面 / 设计侧收正项，处置路径 = 本段（记录）+ §5.2 上抛（设计席 / 父侧裁） | — |

**验证限制（如实）**：#164（`thincoder-cli/test/tui-stderr-capture.test.mjs`）· #111② 宿主（`thincoder-cli/test/input-lock.test.mjs`）· #219 断言宿主（`thincoder-vscode/test/busy-injection-vsc.test.mjs`）· #167 新用例宿主 —— 分档单跑未在本席射程内（套件级全绿已含）；#187⑤ 改前形态不可重建（现读无尸体形，非对比实证）；#187③④⑥ 与 A 面文档条目（`#225` 等）= 他笔域。

### 5.5 审计 / 评审响应表

| 发现（审计 / 评审） | 判定 | 响应 |
|---|---|---|
| DOC-DRIFT：`SETTINGS-TOOL.md:49` 与 `settings.mjs:189` 相抵 | **认** | 设计档非笔域 ⇒ 不改；已在 5.2-1 与交付报告披露，请 eng-designer 同笔收正（代码侧按 #58 处置句保留） |
| #220 / #152 / #193 机检列「活体面零命中」按字面不可判 | **认（口径相抵）** | 按目标列交付 + 残差披露（5.2-3）；请父侧裁口径（不扩扫） |
| §5 空段 ⇒ #153 候选表 / N₀ / AC-7 读回无载体；`core-hygiene.test.mjs:66-68` 指向空 §5 | **认** | **本段即载体**：5.1 逐条读回 + 5.3 N₀ / 候选表 + 5.4 轮次；指针现解析 |
| §2.4.1 缺两条用例档行、计数 17 未同步 | **认** | 设计侧收正项（5.2-5，上抛）；机制面已满足（登记在册 ⇒ 门不红） |
| 数值漂移（登记注 309/314 vs 实测 305/314） | **认** | 已修（fix r1-②） |
| #187⑤ 尸体形残留（审计） | **认** | 已删（fix r1-①） |
| out-of-list：`settings.mjs` 谓词 export + 对象值 JSON 化；#198 额外 40 行折行 | **认（均已披露）** | `settings.mjs` = #58 谓词单源 + 同条点名瑕疵（同族面收正，5.2-1 连带上抛）；折行 = 机检列字面要求（5.2-2） |
| out-of-list：`thincoder-vscode/webview/panels.js` 在 touched 并集内 | **不认（反证）** | `git diff --stat` 该档**零 diff**（本批未触；§2.4「webview 零改」成立）——审计误归因于并集口径，非交付偏差 |
| out-of-list：4 个新用例宿主 + `settings.mjs` 表外 | **认（表遗漏）** | 5.2-4 登记 |

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent · 2026-09-22——三面合并）**

**核验**：① 三面交付 = 设计档面（id=32 + id=36 上抛处置轮）· 产品码面（id=31 · 25/25 条 · 45 档）· 父侧面（本席：需求档 5 折行 · `scripts/doc-check.mjs:4` 改指 · `ENGINEERING-MODE-V2.md:697` 失效表达收正 · §2.4.1 补行 18/19 · `SETTINGS-TOOL.md:48/:49` 收正）。② 抽核：死档 `thincoder-vscode/test/fixtures/vscode-mock.mjs` 已 `git rm`（全仓零引用）✓；`panels.js` 零 diff（#219声明）✓；`doc-check` 实测 = 悬空 **4** / 行宽 **2**（B 类变更记录段残差 · 全为记录面）✓。③ 三包套件 **566 / 805 / 942 pass**（交付报告实跑 · 内部审计 0🔴 · 代码评审 pass 0🔴 ⇒ 采信）。

**裁定（上抛 5 项）**：① `SETTINGS-TOOL.md:48/:49` DOC-DRIFT = **父侧已收正**（坐标 `formatLine:184→:187` · `set 回显 :255-256→:260-261` · `_shownValue:85→:88` + 渲染句现态化）✓；② 机检列口径相抵 = **裁定：按目标列核销 + 残差披露**（本批 = 逐靶处置，非全仓清零；≈80 处同族残差入册 **#232**）✓；③ §2.4.1 补两行（18 `compress-form.test.mjs` 305 · 19 `tool-seams.test.mjs` 314）+ 计数 **17 → 19** = **父侧已落** ✓；④ #198 折行范围（42 行 vs 窄读）= **接受现态**（机检列字面要求；去空白等价实证在案）✓；⑤ 评审清单 errata（9 条路径误归端/缺根段）= 记录（内部协议面 · 交付零影响）✓。

**三面覆盖对照**：A 面 12（设计档 8 = id=32 / id=36 · 需求档 4 = 本席）· B 面 8 + C 面 13 = id=31 —— **33 条全闭合**（#111② 改判零动作 = 已被 T-CL-U1/U2 覆盖 · 回填理由 ✓）；#153 候选 **N₀ = 75** / doc-name 形 0 / 残余 **0** ✓；#225 = 严格族 5 闭合 + 强候选 7 处置 + 判留 3（记录面 2 + D8 豁免ⓐ 1）+ **N₀=343 抽检口径入册 #229** ✓；#206 台账收正（27 → 30 现读）✓。

**收口同步**：状态行 = **收口待提交**（提交随四批联合收口）；冻结档 ×5 零改（errata 落 §2.10）✓；台账销项随联合收口；design 槽（`41f0f63d`）随联合收口消费。
