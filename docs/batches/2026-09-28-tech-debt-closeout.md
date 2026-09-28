# 2026-09-28 · 技术债清偿
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 19:44 直令（台账清池：「别他妈的挂着一堆了，赶紧都给我清了」）· 未决全量 triage（101 待讨论 ∕ 6 在途）+ 清偿 · 台账在册条目吸收。
> 台账 = #531（技术债清偿 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 直令与授权（2026-09-28 19:44 · 主 agent）
- 用户直令：「台账里你也查一下，别他妈的挂着一堆了，赶紧都给我清了」。
- 处置口径 = 未决全量 triage：已落地 ⇒ 核销；前提消失 ⇒ 废弃；真债 ⇒ **全部归批**（本批）——**零悬空**（每条有归宿：核销 ∕ 废弃 ∕ 归批）。
- 已结先例：`#455`（需求档 §3.5 重号）核销 ∕ `#426`（窄窗左列）废弃（左列本轮裁撤 · 并入 flow R13）。

### 1.2 吸收条目（63 条 · 按面粗分 —— 设计轮细化）
- **文档 ∕ 坐标族**（22）：`#195` `#196` `#352` `#354` `#370` `#373` `#374` `#378` `#382` `#384` `#387` `#388` `#394` `#396` `#414` `#435` `#456` `#469` `#485` `#502` `#514` `#529`
- **码 ∕ 测试族**（25）：`#251` `#298` `#351` `#356` `#361` `#363` `#364` `#365` `#386` `#400` `#402` `#404` `#429` `#441` `#448` `#450` `#451` `#471` `#499` `#503` `#506` `#510` `#512` `#513` `#515`
- **提示词 ∕ 流程族**（15）：`#255` `#369` `#417` `#420` `#421` `#422` `#423` `#424` `#425` `#430` `#431` `#434` `#439` `#470` `#481`
- **工程工具族**（1）：`#416`
- **补条收正（2026-09-28 19:5x · 承设计轮上抛 1）**：初版三族实列漏 6 条——`#251` `#255` `#298` `#369` `#416` `#481`（同 task_book 命中）；已按上表补入，**合 63 条**（22 + 25 + 15 + 1）。
- **上抛 2 裁定（`#527` 重叠面）**：`#370` ∕ `#373` = **已由父侧清（核销）**——设计轮轮 5 对应项**免实施**；`#378` ∕ `#396` = 父侧已清部分（三注释 ∕ 坐标钉）——**余随本批**；实施舱开工先读台账现态（防双执行）。

### 1.3 序
- 设计轮（eng-designer · 按面分轮结构）→ 评审 → 实施（eng-coder · 按面分轮）→ **逐条核销**（每条：改动 file:line → 核销）。

### 1.1 轮 1 回执（文档 sweep · #121）+ 需求档六处父侧直执（2026-09-28 21:4x）
- #121（轮 1 文档面清账）交付：其域全清（悬空 ∕ 行宽 0）；#352 ∕ #387 ∕ #469 落形；#374 = 命中皆码档（零改，只报）；越域上抛 = 需求档 4+2 + `composer-send` ×7（他批在途面）。
- **父侧直接执行（可 revert）**：需求档六处已修——`requirements/CHECKPOINT.md:12`（迁移期引文豁免形 = 尾随「（迁移期引文——迁移前读数 · 旧档已删）」；**注意豁免需全角括号形，〔〕形不生效**）+ `:99` 同形 + `requirements/TOOLS.md:64`（`plan.mjs:36` ⇒ `thincoder-core/agent-tools/plan.mjs:36`，实径已核）+ `desktop/requirements/PROJECT.md:248` ∕ `vsc/requirements/WEBVIEW.md:80`（行宽折行）。复跑读数：我域归 0（转列报）· 行宽全清。
- **瞬态说明**：全仓悬空 43 = `renderer/styles.css` 四拆（R13-A #100 在飞 · 设计在册：theme ∕ chrome ∕ skin，rail 建后随裁撤删）所致引用面位移 ＋ `composer-send.mjs` 退役引用——**均非本批缺陷**；消解 = 设计面轮（R11/R12/R13 文档收正 + 输入批文档同步）随 #100 ∕ #101 落定后执行。
- **父侧直落项在册**：`scripts/check-dist.mjs` 产物清单随四拆（工程工具面 · 机械清单 + 实跑 + 报「父侧直接执行」）——待 #100 ∕ #101 落定后执行。

### 1.2 轮 4 回执（核 ∕ 会话码面 5 条 · #119）（2026-09-28 22:0x）
- 交付：五项全落（#351 端档去副本单源 ✓ · #386 结论=**修**（缓存按槽文件路径失效）+ 误命中 ∕ 命中正控两用例 · #441 四子项（①diskLonger 口径 ②端拒例+核明文 ③effort 键齐 ④抛径收敛）· #499 EOF 尾段 U+FFFD 门 · #503 ts 地板六调用点 + 回归锁）；**core 810 ∕ 810 ∥ cli ∥ vsc 三套件绿**；审计 1 轮 + 评审 2 轮 pass + fix 1 轮；§5 已落。desktop 红 = R13 在飞瞬态（`info-row` 缺档 ∕ `INFO_SLOT` ∕ `cancelCloseTab` —— #100 面），证据在案，待收口复跑。
- **表外处置**：① 设计面漂移（`SESSION.md:752/753/1073` + 坐标 :52/:95 · `MULTI-INSTANCE-COLLAB.md:177`）→ 设计面轮；② `thincoder-vscode/src/extension/session-io.mjs:150` 端侧无 mtime 地板 → **VSC 迁移轮**（后果有界：多核一次后收敛）；③ `thincoder-core/test/batch.test.mjs` 542 行越 500 卫生闸红 = 他轮在飞档（mtime 21:54）→ **落定后复核归属**（无主 ⇒ 拆分项入册）；④ 三档越线登记（`session-slot-verify.mjs` 304 ∕ `session-ledger-reliability` 315）已在卫生闸册。

### 1.3 轮 5 回执（core ∕ cli 码 ∕ 测试 10 条 · #120）（2026-09-28 22:2x）
- 交付：十条全落（#361 正则扩 `source|dest` · #363①ACP 关思考生效 ∕ ②③三处零副本 · #369 递归扫描 + 混合情形用例 · #370 ∕ #373③ 免实施核验 · #402 两处收正（档绿被他批在飞阻塞，等价复算已过）· #417 零落盘计数载荷 + grep 零阈值 ∕ 零自动动作 · #421 陈旧评论 · #422 三规则 + 用例 · #439 两条覆盖腿）；**core 813 ∕ 813 ∥ cli 893 ∕ 893 ∥ vsc 1052 ∕ 1052 绿**；评审 1 轮 pass（🟡2 ∕ 🔵4 非必改）；§5 已落。desktop 红 = R13 在飞（缺档消费）——预期，待复跑。
- **表外处置**：① `batch.test.mjs` 542 越 500 ⇒ 本舱**按拆分位拆出** `batch-lifecycle-gates.test.mjs`（#119 连带的卫生闸红即此面——归属闭合）；② `batch-lifecycle.mjs` 293 ⇒ 329 越 300 已登记 + 拆分预案（`batch-scan.mjs` 外提）；③ 设计估值超差三处（`batch-lifecycle` +36 ∕ `generate-title` +16 ∕ `batch-skeleton` +18——设计表缺口，归设计轮补注）；④ #417 计数口径 advisory（去重集；同档重写不计写）在册。

### 1.7 评审 #3（剩余轮重发复核）changes-required + 修正轮派单（父侧 · 2026-09-29 00:0x）
- 评审 #3 **VERDICT: changes-required**（🔴1 ∕ 🟡3 ∕ 🔵2——报告与 §3 落档）：①🔴 剩余轮测试档靶已全被全清令删除、验收读法失判别力（原样执行 = 目标不存在 ∕ 重建已删档与用户令相抵）；②🟡 §2.6 桌面行结构性脱钩（styles.css 已不在盘等）；③🟡 #195 坐标不符 + 疑部分已落；④🟡 在飞面协调（#100 ∕ #101）；⑤🔵 #513 落点归属节；⑥🔵 #434「慢实证」词汇。
- **逐条处置**：①–⑥ **全接受**（无 Not-an-issue ∕ 无 Deferred）——修正轮 = eng-designer #17（fix · 定点 1..6 · 落 §2 测试面收正块 + 行内改）。
- 修正落地 → 重发评审（令牌）→ 剩余轮（R2 ∕ R3 ∕ R6 ∕ R7 ∕ R8）派单。

### 1.8 修正轮 #17 交付收下 + 残余补扫派单（父侧 · 2026-09-29 00:2x）
- **#17 交付**：评审 #3 六条全落——①🔴 测试面收正块（制度源 + 八行清单 + §2.6 句替换文 · `:415-441`）；② 桌面届盘重建表 13 行 + 轮 7 先行句（`:443-464`）；③ #195 坐标重锚 + 二态注（`:466-471`）；④ 在飞面复核句（`:473-478`）；⑤ #513 改锚（`:480-484`）；⑥ #434 可判形（`:486-489`）。doc-check：本笔 Δ=0（batches 域外——证据链在册：`PROJECT-MANIFEST.json:31-34` exclude）；行宽 max 217 ✓。
- **残余处置（#17 上抛已裁）**：轮 6 ∕ 7 其余行同类字样（#365 ∕ #512 等）⇒ **补扫**（= eng-designer #23 · fix · §2 全表同类逐行收正为「点名可跑命令」形；停止条件 > 20 处）。
- **下一步**：#23 落地 → 复跑 doc-check → **重发设计评审**（令牌）→ 剩余五轮（R2 ∕ R3 ∕ R6 ∕ R7 ∕ R8）派单。

### 1.9 残余补扫 #23 交付收下 + 重发复核点火（父侧 · 2026-09-29 00:3x）
- **#23 交付**：同类残余 **5 行收正**（`:67` #429 ∕ `:103` #400 ∕ `:151` #382 ∕ `:156` #512 ∕ `:167` #365——append 修正块 `:498-526`）；**记录面 10 处零改（正确）**——已执行轮（4 ∕ 5）的「全绿」字面 = 执行时点读数（先于全清令 · §5 在册），改之即与实史相抵；边界项在册（#471 二择一 ∕ #456 doc-check 活体读数 ∕ §2.6 修-1 测试族表行归 #456 · 届盘面）。停止条件未触（同类 5 ≤ 20）。
- **doc-check**：Δ = 0 ✓（全局悬空回 **171**；行宽 OK）。
- **重发复核已点火**（设计评审 · 本档）——修正轮 #17 + #23 落地后重发；过线即令牌签发 → 剩余五轮（R2 ∕ R3 ∕ R6 ∕ R7 ∕ R8）派单。

### 1.10 重发复核 pass + 全轮派单（父侧 · 2026-09-29 00:3x）
- **复核**：重发设计复核 **pass**（🔴0 · 🟡1 ∕ 🔵3 = 新残余 N1–N4——均非阻断）；令牌签发（凭据不落档）；§3 评审轮次 4 已写入。
- **新残余处置**：N1（`ipc.mjs` 现读 **308** 越 300、表行「297 · ≤300 维持」无越层裁定）→ 随轮 8 落轮 + 届盘收正；N2 ∕ N3（`settings-sections` 读数 ∕ 覆盖行位 −10 全族）→ 届盘对读机械收正；N4（修-1 测试族表行哑指针）→ 随 #456 ∕ 届盘重排（#23 已披露在册）。
- **派单（三舱）**：轮 6 → **#31** ∥ 轮 7 → **#32** ∥ 轮 8 → **#33**（按域冲突排队待跑）；#378 码注释四处并入 #31；测试件落位 = `.thincoder/tmp/…-rN.test.mjs` 暂存 → **父侧 copy 至 `docs/batches/`**（写门冲突 = 台账 #545 · 会话标题舱 #19 实测）。
- **文档面补轮**：**#34**（Doc-A · 轮 2 ∕ 3 文档项 ~13 项）∥ **#35**（Doc-B · 轮 6 ∕ 7 ∕ 8 收正行 · dependsOn #31/#32/#33）。
- **父侧自理在办**：#400②（CI Node 22 腿）· #416（`tmp/core-pkg` 清理）· #456（doc-check 行数面·脚本）· #471 的 `check-dist.mjs` 部分 · **轮 3 提示词项**（#354 ∕ #420 ∕ #423 ∕ #424——父侧内容权）。

### 1.11 轮 3 提示词项落定（父侧直接执行 · 两树镜像 · 2026-09-29 00:4x）
- **#354（`timer` 行）**：四态复核 = 两树 `common.md` 全仓零命中（缺行实锤）⇒ 补——CN `common.md:73`（工具路由句内）· EN `common.md:111`（路由表新行）。
- **#420（并行句收敛）**：真重复对实读 = `persona-engineering` ∥ `discipline-engineering` **整行逐字**（CN `:158`∥`:133` · EN `:161`∥`:140`）⇒ **单处保留**（discipline-engineering 双侧——与 discipline-normal 镜像对保持对称）；**persona 两侧改指针形**（CN `:160` · EN `:163`——沿在册先例形「——见 <档名>」）。注：`discipline-normal` 的变体句（非逐字）保留——普通模式装配自足性所需（该族从不与工程侧同装，非同装重复）。
- **#423 ∕ #424（派单纪律句）**：persona-engineering 派单结构节尾 append——CN `:137-138` · EN `:139-140`（跨舱读数依赖 ⇒ 串行 ∕ 晚取；临时产物 ⇒ `.thincoder/tmp/` ∕ 仓外）。
- **残余**：#481（`SESSION.md` §6.11 核实收正）随 Doc-A（#34）落；本单四项全落（读回核已过——两树逐项单处 ∕ 指针形 ∕ 行在位）。

### 1.12 父侧自理件（一）：#400② + #416 落（父侧直接执行 · 2026-09-29 00:5x）
- **#400②（CI Node 22 腿）**：`.github/workflows/test.yml` 新增 `core-node22` 作业（name「thincoder-core (kernel · Node 22.13 floor)」· `node-version: "22.13"` · 步骤 = checkout + setup-node + `npm test`——**既有 `core` 作业零改**）；YAML 缩进读回核已过（D6）；生效 = 下一 push。
- **#416（核副本族清理）**：四目录已清——`thincoder/.thincoder/tmp/{core-pkg,core-probe,cli-pkg}` · `thincoder-vscode/.thincoder/tmp/core-registry-copy`（引用面 grep = 仅日志 ∕ 批档记载、零活面引用；`rmdir /s /q` 四连 **exit 0**）。
- **保留登记（裁量 · 报告供审）**：`.thincoder/tmp/probe/` = npm 探针沙箱（node_modules + 40B package.json——非核副本）；`.thincoder/tmp/enge-160/` = 明标 `.before.md` 快照（比较证据类，非复制体）——两者按「登记保留理由」处置。
- **余**：#456（doc-check 行数面）· #471 的 `check-dist.mjs` 部分——在办。

### 1.13 父侧自理件（二）：#456 ∕ #471-check-dist 转出（父侧专轮 · 2026-09-29 00:4x）
- **转出两件**（明账 · 无阻塞——不在任何舱依赖链）：**#456**（doc-check 行数面）——实勘：判据语义面（doc-check 自述「判据全读 manifest checkConfig、无硬编码」⇒ 需 checkConfig 新键 + manifest 写面 + 新模块 + main 集成，非小件）；**#471 的 `check-dist.mjs` 部分**（工程工具面——`scripts/**` 入舱 files 被机械拒，已实证）。台账 **#546** ∕ **#547** 在册；解锁 = 父侧直改专轮。
- **父侧本波完成件**：#400②（CI Node 22.13 腿）· #416（核副本四清 + 两保留登记）——§1.12；轮 3 提示词四项——§1.11。
- **在跑回执**：三码舱 #31 ∕ #32 ∕ #33（按域冲突排队）+ 两设计轮 #34 ∕ #35（dependsOn）在轨。

### 1.14 Doc-A（#34）交付收下 + 两裁（父侧 · 2026-09-29 01:0x）
- **交付**（#34 · fix）：**13 ∕ 13 项落定**——#195 KD-M1-27 判据字面收正（判实现为准：无锚 ∧ 有值 ⇒ 相位行 ∕ 无锚 ∧ 无值 ⇒ 零注入——`setup-reminders.mjs:156-160` 实读）+ 变更记录；#384 脏树零回归判据（点名命令形）；#388 锚形态规范句；#394 依赖镜像纪律行；#400① 核包底线句 + 坐标收正；#414 行级形态维持 + 标记串入账（坐标实读重锚 `:291` ∕ `:838`）；#434 转档触发句；#470 发布窗两纪律；#485 §6.22 + **D-SE68** 登记；#404 ∕ #430 ∕ #431 D7 三句 + `BATCH-RECORD.md` §5.3 成文；#481 值域补 `desktop` + 注释收正（⚠️ 见裁②）。doc-check 本域 **Δ = 0**（全局 167 = 他批并行中值）∕ 行宽 0（自收 2 处超限）。§2 append（`:557-582` · 13 项 + 3 发现）。
- **裁①（发现 1 · `MANIFEST.md` §2.6 条 3 `:329` 结果格）**：**并收**（同判定面一致性——无值格 `false` ∕ 有值格 = 相位行）→ 台账 **#552**（随下一 core 设计面轮）。
- **裁②（发现 2 · `#481` 实证缺口）**：桌面进程内 `sessionEnd()` = `desktop` 而核行渲 **`cli`**（跨端身份错写）——**码面缺口 → 台账 #553**（修法二择：核行参数化 ∥ 桌面自持行——须设计轮定形）；**提示词面 `cli|vscode` ⇒ +`desktop` = 随修法定形后落（内容权在册）**。
- **发现 3**：坐标漂移两处（`:164 ⇒ :291` ∕ `:342 ⇒ :838`）已实读重锚入账 ✓。

### 1.15 轮 6 交付收下（父侧 · 2026-09-29 01:4x）
- **交付**（#31 · 终态 clean · fix 1）：9 条实改 8 条 + **`#378` 四处实读皆净**（父侧 19:5x 已清 ∕ 舱落地改写——如实报零改）；主笔 = `cmd-advisor.mjs` guard 剥写（槽单写；VSC 先例 + 盘上旧值保留=KD-3 面不动）+ `chat-chrome.mjs` 补写者 + `cli suspension-drive.mjs` 窗内 timer 容纳 + 计数 ∕ 坐标 ∕ 口径收正族（`chat-tool.mjs` ∕ `events.mjs` ∕ `README` ∕ 两 `AGENTS.md` ∕ `execute-tools.mjs` 十处现读）。**批次本地件落位**（`.thincoder/tmp` → `docs/batches/2026-09-28-tech-debt-closeout-r6.test.mjs`；档头运行命令一行父侧机械收正=advisor 🔵4）——**终位亲跑 8 ∕ 8 · 0 fail**（304 行）。`node --check` 8 档绿；§5 已落（4400 字符）+ 状态行更新。
- **裁定 ∕ 转出**：① advisor 🟡-2（timerWake 门疑点——窗内 deadline ∕ 闩面口径）→ **Doc-B（#35）** 措辞面；② 收正行 1–4（#513 二半 CLI 句 ∕ #529①② ∕ 登记语 ∕ 疑点）→ **#35**（在册）；③ 🔵3 测试件 304 行 > 300 建议线 = **免裁**（批次本地件不受产品线结构档位约束——随档登记）；④ 🔵7 `dom.mjs` 缩进随下次触碰面。
- **范围外（在册）**：VSC 同族注释旧行位残余五处（`setup.mjs:236` ∕ `panel-callbacks.mjs:205/:265/:272` ∕ `panel-subagent-relay.mjs:36`）→ 台账 **#555**。

### 1.16 #471 父侧部分处置（①②：check-dist ∕ `--smoke` 面 · 2026-09-29 01:5x）
- **清单面实读**：R1c 六项 = `docs/batches/2026-09-27-render-core-r1.md:51`（`--smoke` 无常驻用例 · check-dist 夹具无常驻回归 · guard 白名单可收紧至 URL 形 · 门①判据段界 · host 未校验 · `main.mjs` 阈值 5 可派生）。
- **处置（父侧面 = ①②）**：**成文维持（不立常驻回归）**——理由 = **现行测试制度**（常驻测试库存已随全清令整体退役；单元 = 批次本地件随档留存；check-dist 仅打包批激活、`--smoke` 为开发期工具面 ⇒ 验证随对应批次走 ∕ 需要时批次本地件——防膨胀判据「验证投入 ∝ 失败代价」）。
- **码面四下传**：③URL 形收紧 ∕ ④门①段界 ∕ ⑤host 校验 ∕ ⑥阈值派生 = 码面（轮 7 舱 **#32** 二择一逐条处置——其单已载）。
- **台账**：**#547 核销**（处置 = 维持裁定 · 依据本节）；#471 全项处置待轮 7 舱回执后合账。

### 1.17 轮 7 交付收下（父侧 · 2026-09-29 02:1x）
- **交付**（#32 · 终态 clean · fix 1）：**三拆 + 四件**——`setup-tooltable.mjs` 333 ⇒ **102**（+ 新档 `tool-table.mjs` 250——231 行逐字搬）、`events.mjs` 482 ⇒ **246**（+ `events-blocks.mjs` 135 ∕ `events-slices.mjs` 130）、`mount-composer.mjs` 409 ⇒ **237**（+ `composer-sync.mjs` 210）、`core.css` 463 ⇒ **281**（+ `core-markdown.css` 191）；**#471 产品码 ③④⑤⑥ 落修**（`protocol.mjs` 三门：host ∕ dot-segment ∕ 段界；`window.mjs` 阈值派生 ⇒ `main.mjs:120` 判 `blocked >= NEGATIVE_PROBE_COUNT`——手抄 5 撤）；**转核销四件**（styles 四拆 ∕ mount-settings 族 ∕ settings-sections 族 ∕ **agent-host 族**）+ `store.mjs` 出名单 + 测试档越层从句撤。搬移逐字核 **18 ∕ 18** 吻合 + EXACT 重演；`node --check` 11 档绿。**批次本地件落位**（档头运行命令一行父侧机械收正）——**终位亲跑 9 ∕ 9 · 0 fail**（240 行）。§5 已落（5578 字符）+ 状态行更新。
- **范围外（在册）**：① `agent-host.mjs` 249 归属 = **转核销（turn-driver 拆）✓**；② `chrome.css` **425** 越线 → 设计面（§2.5 ∕ §4.1 对账 ∕ #551 家族）；③ 注释陈旧三处（`queue.mjs:7` ∕ `chat-pending.mjs:5/:68`）→ 随下次触碰面；④ `RENDER-CORE.md` 锚漂移（`protocol.mjs` ∕ `core.css` 面坐标）→ #551 家族；⑤ `render-core-r1.md:157` ③ 原字面与转写差 → §6 核销绑定位。
- **收正行 → #35（Doc-B）**：#365 拆后读数（102 ∕ 250）→ `MANIFEST.md:180` ∕ §2.3 `:201` + `VSC-DEBT.md:111/:135/:163`；#510 读数族 → §4.1（#551）。

### 1.18 台账追认核销扫（父侧 · 2026-09-29 02:3x）
- **依据**：用户 02:26「该核销的是不是先核销掉啊」——对「待设计」76 条全量 triage（陈年面首耕）：**43 条已落地未勾销 ⇒ 追认核销**；#353（第四端立项 · 在途）同批勾销。
- **核销清单（43 + 1）**：#195 ∕ #196 ∕ #354 ∕ #361 ∕ #364 ∕ #365 ∕ #382 ∕ #384 ∕ #388 ∕ #389 ∕ #394 ∕ #398 ∕ #400 ∕ #402 ∕ #404 ∕ #412 ∕ #414 ∕ #416 ∕ #417 ∕ #420 ∕ #423 ∕ #424 ∕ #425 ∕ #430 ∕ #431 ∕ #450 ∕ #453 ∕ #456 ∕ #471 ∕ #481 ∕ #485 ∕ #486 ∕ #502 ∕ #505 ∕ #506 ∕ #510 ∕ #512 ∕ #513 ∕ #514 ∕ #519 ∕ #520 ∕ #521 ∕ #522 **+ #353**。
- **依据面（分类）**：清债批各轮落地（#365 ∕ #382 ∕ #416 ∕ #425 ∕ #450 ∕ #471 ∕ #505 ∕ #510 ∕ #512 ∕ #513 ∕ #514 ∕ #519–#522；#417 = 在飞舱撞帽文案实测已携「零落盘轮」）；设计面落定（#195 ∕ #384 ∕ #388 ∕ #394 ∕ #398 ∕ #404 ∕ #412 ∕ #414 ∕ #430 ∕ #431 ∕ #453 ∕ #481 ∕ #485 ∕ #486）；前提随全清令消失（#196 ∕ #361 ∕ #364 ∕ #402；#450 ∕ #456 = 重复并入 #546）；R4 ∕ R9 落地（#389 ∕ #453 等）。
- **余（33 条）**：条件型（触发未到，如 #369 / #470 / #434）· 真债待轮（如 #363 / #499 / #503）· 在飞待勾（#429 / #448 / #451 / #515 = 轮 8 交付后落）。
- **结论**：待设计 **76 ⇒ 33**；未决总 **124 ⇒ 80**（42 待讨论 ＋ 33 待设计 ＋ 5 在途）。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成（initial 轮 + 修正轮 1–2（评审 #3 收正已落）· 63 条 8 轮 · 每轮 ≤10 档）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（initial 轮 · 2026-09-28 · eng-designer）**

**2.1 覆盖口径（三链一致）**
- 本批条目 = 台账实读全量：`task_book` 指向本批的 **63 条待设计** —— = §1.2 三族实列 57 条 + **6 条未列条目**（`#251` `#255` `#298` `#369` `#416` `#481`；同 task_book 命中，本设计已补入覆盖）。批本体 `#531`（在途）= 流程面，不占 63 条名额。
- 三链：台账 63 条 ↔ 本节覆盖（2.5 行动表）↔ 逐条核销（§6）。本批无需求档条目（技术债批；需求面 = 台账条目携带的消解径 ∕ 到期条件）。
- 改动形三类：**落修**（实改）· **转档登记**（条件未到 ⇒ 落设计档登记句后核销——债转档）· **裁定核销**（已裁——零码改、裁定句在册）。

**2.2 实施路由（随 face）**
- 文档面 → eng-designer（D1 笔权）· 码面 ∕ 产品文本面 → eng-coder（token）· 工程工具面 → 父侧直改 · 提示词面 → 主 agent 内容权 + 落笔。
- 轮内混合面逐条标注（2.5「面」列）；派单按面拆（禁跨面同单）。

**2.3 实施序分层**
- **立刻可做**：轮 1 ∕ 2 ∕ 3（除 #481 核实半）∕ 4（除 #503 签名定形）∕ 5 ∕ 6 ∕ 7（除 #510 重锚）。
- **先小设计（落轮先定形再实施）**：#503（签名形）· #510（拆分点按届盘重锚）· #515（三则收口定案）· #448（两裁定稿）· #196（隔离注入形）· #382（回退链实读分歧面）· #369（递归判定——本设计已裁）。
- **需端侧运行期实证**：#356（渠道探针）· #451（VSC 行为例）· #429（先在 VSC 测试树模块级复现）· #481（桌面 env-state 注入链核实）· #448 ∕ #515（行为用例闭合）。

**2.4 轮序总表（63 条分布 · 每轮 ≤15 档）**

| 轮 | 主题 | 条数 |
|---|---|---|
| 1 | 文档面 · 清账 sweep | 5 |
| 2 | 文档面 · 字面 ∕ 纪律 ∕ 登记 | 10 |
| 3 | 提示词 ∕ 流程面 | 8 |
| 4 | 核 ∕ 会话码面 | 5 |
| 5 | core ∕ cli 码 ∕ 测试 | 10 |
| 6 | 桌面 ∕ VSC ∕ 文本 | 9 |
| 7 | 拆档 ∕ 尺寸 ∕ 工具清理 | 8 |
| 8 | 处置 ∕ 实证族 | 8 |

**2.5 轮次行动表（条 → 面 → 改动形 → 落点 → 验收读法）**

**轮 1 · 文档面清账 sweep（5 条 · 路由 = 文档面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #352 | 文档面 | 迁移跟踪表右列逐行对实盘收正（「端侧接线」待迁移态 → 已接） | `docs/core/design/CORE-UNIFICATION.md:1334` 邻族（全表扫「端侧接线」逐行） | 该类表述与实盘一致（端引核实证抽读） |
| #374 | 文档面 | 另族 sweep 三族逐族复扫 + 二态处置（同 `DOC-DISCIPLINE.md` §3.12 口径）；他批面两处维持登记 | `advisor/**` §14.x ∕ §16.x（37 行 ∕ 6 档）· `tools/**` 旧号（23 行 ∕ 8 档）· VSC 面板族 §12.2.x ∕ §14.x——实施舱按 §3.12 复扫定位 | 三族读数归零 ∨ 逐条二态登记；`TUI.md` §6 ∕ `PROVIDER.md` §15 维持登记 |
| #387 | 文档面 | 端域第二档零探测表述对现态收正（探测消费已归核） | `docs/core/design/MULTI-INSTANCE-COLLAB.md:90` 邻段 | 该段实读与现态一致（端侧消费 = `peer-instances.mjs` ∕ `session-io.mjs`） |
| #435 | 文档面 | 全仓 doc-check 存量红清账（开工先取实读基线——读数历史漂移在案） | 全仓红档（读数面 `scripts/doc-check.mjs`；悬空 ∕ 行宽逐条） | `node scripts/doc-check.mjs`：悬空 0（豁免族外）· 行宽 0（表格豁免族外） |
| #469 | 文档面 | 引核行号坐标复核（随触碰档面 + 可全扫面；doc-check 不覆盖行号） | 各引核档（本批触碰面优先） | 抽检引核行号与实盘一致 ∨ 标 as-of |

**轮 2 · 文档面 · 字面 ∕ 纪律 ∕ 登记（10 条）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #195 | 文档面 | 判据字面按实况语义收正（无锚 ∧ 有值 ⇒ 相位行 + 沿用内存值）+ 变更记录一行——裁定 = 判实现为准（KD-1） | `docs/core/design/MANIFEST.md:292`（KD-M1-27）· `:495`（AC-N5）· `:541`（T13） | 三处实读含实况语义；与实施终稿对读一致 |
| #378 | 文档面×4 + 码面×4 | 镜像撤写措辞残余八处逐处收正 | 文档：`docs/core/design/TOOLS.md:81` ∕ `:122` · `docs/core/design/ENG-TOKEN-BINDING.md:100` · `docs/core/design/WEBVIEW-PROTOCOL.md:111`；码注释：`thincoder-vscode/AGENTS.md:86` · `thincoder-vscode/src/extension/settings.mjs:181` · `panel-session-write.mjs:92` · `thincoder-vscode/webview/mode-buttons.js:3-4` | 八处实读无镜像写语义残余 |
| #384 | 文档面 | 新增纪律句（脏树零回归 = 先取实测基线 + 判增量零——禁以绝对绿值冒充） | `docs/core/design/TESTING.md` §1（`:15` 邻位） | 实读含该句 + 机检形（实测基线 ∕ 逐字相等） |
| #388 | 文档面 | 锚形态规范句（裸 basename 锚依赖仓根唯一性 ⇒ 锚写自仓根完整路径）；引擎零改（KD-2） | `docs/core/design/DOC-DISCIPLINE.md` §4（D4 细则 `:35-48` 邻位） | 实读含规范句；`scripts/doc-check-anchors.mjs:166-174` 读面确认零改 |
| #394 | 文档面 | 补「依赖安装 ∕ 打包一律带 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`（或经 proxy）」句 + 命令形 | `docs/desktop/design/PROJECT.md` §5（打包 ∕ 产物校验面；`thincoder-desktop/scripts/check-dist.mjs` 头注同指） | 实读含该句 + 命令形 |
| #400 | 文档面 + 工程工具面 | ①补「core 底线由最低宿主（VSC `engines.vscode` 面 · Node 22.13）驱动 ⇒ 禁用 Node 24 专属 API」句 + 同线坐标收正；②CI core job 增 Node 22 腿 | ① `docs/core/design/ARCHITECTURE.md:21`；② `.github/workflows/test.yml` | 两句实读 + 矩阵含 22 腿（core 测试 22 下跑通） |
| #414 | 文档面 | ①豁免形态维持（行级——成文理由）；②标记串两处核对入账 | `docs/desktop/design/IPC.md:164` · `docs/desktop/design/PROJECT.md:342` + 口径句（实施舱定位） | 两处标记行有入账记录（豁免账目与实读一致） |
| #434 | 文档面 | 条件句 + 权威面句落档（触发 = #433 落地 + 慢实证；权威 = Electron） | `docs/desktop/design/E2E-TESTING.md`（不做行邻位） | 实读含条件 ∕ 权威面句 ⇒ 转档核销 |
| #470 | 文档面 | ①发布窗纪律句（先 bump+publish 核再物化）；②收敛序注（先 `npm install` 再 `npm link` 恢复 junction） | `docs/RELEASE.md` §5.3（`:100` 邻位） | 实读含收敛序 + mirror 族句 |
| #485 | 文档面 | §6.22 边界行收正（readdir 全条目面计入 O(N)）+ 布局收窄条件登记；需求档 F-SL1 判定句零改（KD-5） | `docs/core/design/SESSION.md:774`（§6.22 边界情形）+ §7 登记行 | 实读含 readdir 句；F-SL1 判定句零改动 |

**轮 3 · 提示词 ∕ 流程面（8 条 · 路由 = 提示词面 → 主 agent 内容权 + 落笔；文档项 → 文档面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #354 | 提示词面（两源） | 先四态复核（定位 ∕ 在位 ∕ 缺行 ∕ 别名）→ 缺则补 `timer` 行（台账事实待复核定案——见 §2.9 上抛 6） | `docs/core/design/prompts/common.md`（CN 正本）· `thincoder-core/prompts/common.md`（EN live）——台账坐标 as-of，实施舱重锚 | 两源实读含 timer 行 ∨ 复核结论「不列 + 理由」在案 |
| #404 | 流程面（文档 + 工具） | D7 核销清单增「修正轮落地前置」项（close 前——未 settle 修正轮不存在）；冻结档漏记处置口径既有（并入下一活档 §6） | `docs/core/design/DOC-DISCIPLINE.md:22`（D7 行）+ `docs/core/design/BATCH-RECORD.md:297-305` | D7 清单实读含该项 |
| #420 | 提示词面 | 「并行拆子项目」三档逐字重复收敛（单处保留 + 他处改指；CN 正本 + EN 两面） | `thincoder-core/prompts/discipline-normal.md:69` · `discipline-engineering.md:129` · `persona-engineering.md:153` | 全仓实读该句单处出现（他处 = 指针形） |
| #423 | 提示词面 | 派单纪律句（跨舱读数依赖 ⇒ 串行 ∕ 晚取） | `thincoder-core/prompts/persona-engineering.md` 派单结构节（`:115-132` 邻位） | 实读含该句 |
| #424 | 提示词面 | 派单纪律句（临时产物一律 `.thincoder/tmp/`（或仓外）——禁落仓库根 ∕ 产品树） | 同上节（`:115-132` 邻位） | 实读含该句 |
| #430 | 流程面（文档 + 工具） | ①D7 清单增「搁置清单回核（程序级收口——§10 类逐条核）」；②§6 收口要求成文；骨架模板加行 = 可选（父侧裁） | `docs/core/design/DOC-DISCIPLINE.md:22` + `docs/core/design/BATCH-RECORD.md` §5 邻位；可选 `thincoder-core/agent-tools/batch-skeleton.mjs:153` 邻 | D7 + §6 口径实读含「搁置清单回核」 |
| #431 | 流程面 | 收口纪律句（「收口看一张截图」——工具解决可见，「该看什么」靠程序级回核 = #430）+ #433 指针 | `docs/core/design/TESTING.md` §3.3（`:77` 邻位）或 D7 邻位 | 实读含该句；#433 触发在册 |
| #481 | 提示词面 + 码面（核实） | 核实桌面 env-state 注入链 → 值域收正（含 desktop）或维持 + 注释收正 | `docs/core/design/SESSION.md` §6.11（`:228-231` unverified 注）+ 值域模板面（实施舱定位） | §6.11 注释收正（已验 ∕ 维持 + 理由）；模板值域与三端一致 |

**轮 4 · 核 ∕ 会话码面（5 条 · 路由 = 码面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #351 | 码面 | 端 `claimsOverlap` 去副本、改引核（`pathsOverlap`） | `thincoder-vscode/src/extension/peer-claims.mjs:119` → `thincoder-core/peer-claims.mjs:74` | 端档零判据副本 + 三套件全绿 |
| #386 | 码面 | 实读 `_slotMtime` 缓存语义 + 多槽复用场景 → 成立则键扩槽维 | `thincoder-core/session-guard.mjs:42` | 结论在案（修 ∕ 维持 + 理由）+ 多槽用例（如成立） |
| #441 | 码面 + 文档面 | ①`diskLonger` 口径对齐；②`{provider:null}` 核侧不校值域 = 明文（读侧容忍——有意）+ 端侧拒例核验；③token 记录补 `effort` 键；④脏载链可抛小修 | ①`thincoder-core/session-slot-write.mjs:74` ∥ `thincoder-core/session.mjs:209`；②核档 + IPC 契约面；③`thincoder-core/token-ttl.mjs:246-266`；④`thincoder-core/session-lifecycle.mjs:172-173` | 四项逐条（①口径一致 ②端侧拒例在盘 ③键齐 ④抛错径收敛） |
| #499 | 码面 | EOF 尾段冲洗（`scan.feed(dec.decode())`——循环后 ∕ `result` 前）+ 尾段夹用例 | `thincoder-core/session-slot-verify.mjs:136` 邻（现读 ≈301 行——补例走登记路，勿强拆） | 尾段不完整 UTF-8 用例绿 + 全档绿 |
| #503 | 码面 | ts 地板 = `max(墙钟, 该档 mtime)`（沿 `session-slot-verify.mjs:99` 先例）；`slotDigest` ∕ `digestFromStore` 签名增 mtimeMs（落轮先定签名形——KD-7） | `thincoder-core/session-slots-manifest.mjs:59` · `thincoder-core/session.mjs:85`（调用点 `:177`） | `ts ≥ mtime` 回归锁 + needsVerify 不误判用例 |

**轮 5 · core ∕ cli 码 ∕ 测试（10 条 · 路由 = 码面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #361 | 码面 | INLINE 正则扩 `source|dest`（AC-2 ∕ AC-3 结构机检常驻化） | `thincoder-core/test/touch-paths.test.mjs` | 常驻扫描含该正则 + 全绿 |
| #363 | 码面 | ①ACP thinking 改引核单源；②③hardcode 两处改引核 ∕ 随动 | ①`thincoder-cli/src/acp/handlers-session.mjs:86-90`（判据行 `:88`）；②`thincoder-vscode/webview/render-frame.mjs:52`；③`thincoder-vscode/webview/generate-title.mjs:46` ∕ `:68`；核单源 = `thincoder-core/think-off.mjs` | ①effort 族关思考生效（用例）②③三处零副本 |
| #369 | 码面 | ①`findInFlightBatch` 递归扫描（混嵌套不再误定位——KD-4）；②别名撤除维持条件（触发 = §4.14 输出转空——登记） | `thincoder-core/agent-tools/batch.mjs`（findInFlightBatch 面——实施舱定位） | 混合情形（≥1 顶层 + ≥1 嵌套）用例：默认定位拒 ∕ 命中正确；条件句在册 |
| #370 | 码面（测试注释） | 档头来源补 T-DC-18 ∕ 19 指针（→ machine-check-face.md §2.4）+ 区段横幅归位（左界守卫两例） | `thincoder-cli/test/doc-check.test.mjs:5` · `:73` | 两处实读收正 |
| #373 | 码面（测试注释） | ③三重死引收正 ∨ 域外登记（①② 已由 B 批落——零触碰） | `thincoder-cli/test/advisor-chain-guards.test.mjs:5` | 三引逐条可解析 ∨ 登记在册 |
| #402 | 码面（测试） | `:67` 空行切片补兜底 + `:17-19` 剥行尾注释 | `thincoder-desktop/test/host-floor.test.mjs:67` · `:17-19` | 两处实读收正 + 档绿 |
| #417 | 码面 | 撞帽载荷加「本段零落盘轮数」（只报数——零阈值 ∕ 零自动动作） | `thincoder-core/agent-tools/checkpoint.mjs:25-27`（traceText）+ `:81`（ask 载荷）+ 计数采集点（与 `_turnSeq` 同源面） | 载荷实读含该计数；grep 零阈值常量 |
| #421 | 码面 | 陈旧评论改写（F8 实况 = 父代理检查点） | `thincoder-core/agent-tools/consult.mjs:307-312`（旧句 `:308-310`） | 与 `:325-330` F8 语义一致 |
| #422 | 码面 | ①close 前 §6 非空闸（空 ⇒ 拒 + 提示）；②append 失败句补「失败 ⇒ 勿 close」；③close 对无状态行档自建机读位（或拒句给补位路径） | `thincoder-core/agent-tools/batch-lifecycle.mjs:283-293`（close）· `:166-173`（消息）；`thincoder-core/agent-tools/batch.mjs:195-198` | 三规则用例（空 §6 拒 ∕ 消息句 ∕ 无状态行可自建）+ 全绿 |
| #439 | 码面（测试） | 两条覆盖腿（键面 spawn 腿（沙箱 config + 假 HOME）；`--test-crash` 缺省形真 spawn 腿） | `thincoder-cli/test/`（新档 ∕ 就近档——先例 `thincoder-cli/test/session-gc-cli.test.mjs:29`） | 两用例在盘 + 全绿 |

**轮 6 · 桌面 ∕ VSC ∕ 文本（9 条 · 路由 = 码面 ∕ 产品文本面 → eng-coder）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #382 | 码面 | CLI `persistGuard` 同口径收（去 config 镜像写——槽唯一权威；回退链实读分歧 ⇒ 改判成文保留，随轮报告——KD-3） | `thincoder-cli/src/tui/cmd-advisor.mjs:33` + 测试面随动 | 实读槽单写 ∨ 保留裁定在案 |
| #396 | 码面（注释） | ①§号位移一处 + ②条目号撞名三处（批 N 限定词）+ ③「第八词」计数两处收正（单源 = `UI.md` §1 = 8 词） | ①② align-2 §2 清单（实施舱定位）；③`thincoder-desktop/renderer/views/chat-tool.mjs:13` · `thincoder-desktop/renderer/events.mjs:332` | 四处实读口径统一（计数一致 ∕ 引用可解析） |
| #425 | 码面（测试） | 长驻两面属性集判据入机检臂（「挂载期属性集只增 = 红」通则）或明示人工走查（设计倾向机检臂——KD-8） | 两面用例档（`thincoder-desktop/test/views-chat.test.mjs` ∕ `views-activity.test.mjs`——按现盘名录） | 通则断言在盘（两长驻面覆盖）∨ 人工面成文 |
| #502 | 产品文本面 | `sessions` 协议行补 `ledger` 字段（异常才携） | `thincoder-vscode/AGENTS.md:95`（按 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §2 同拍） | 该行实读含 ledger 字段 |
| #506 | 码面（测试） | 断言稳定化（`waitForFunction` ∕ 重试语义——勿改判据值） | `thincoder-desktop/test/integration/chat-render.test.mjs:136`（`:134` 邻） | 复跑 N 次零红 |
| #512 | 码面 | 补写者（`fresh._ledgerLines = lines`——实现既有「同引用 ⇒ 零写」意图；否决删检） | `thincoder-desktop/renderer/views/chat-chrome.mjs:193-194` | 同引用二帧零写用例（node 身份不变） |
| #513 | 码面 | CLI 窗内 timer 支容纳 `AbortError`（镜像核 §6.30.10 句）+ §6.30.11 补 CLI 句 | `thincoder-cli/src/tui/suspension-drive.mjs`（窗内 timer 轮中止面）+ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11 | 容纳用例绿 + §6.30.11 实读含 CLI 句 |
| #514 | 产品文本面 | `timerWake` 注释按全端口径收正（合同单源 = §6.30.3 · `TOOLS.md` §6.7） | `thincoder-cli/README.md:152` | 该行实读全端口径 |
| #529 | 文档面×3 + 产品文本面×1 + 码面×3 | 七处逐处收正 | ①`docs/cli/design/CLI-DEBT.md:35`（A4 行刷新 + 移 §4）；②`docs/cli/design/CLI-ENTRY.md` 描述句；③`thincoder-cli/AGENTS.md:51` ∕ `:54` 模块图；④`thincoder-core/test/core-hygiene.test.mjs:118` ∕ `:121` ∕ `:126`；⑤`thincoder-core/test/process-probe.test.mjs:234`；⑥`thincoder-cli/test/session-ledger-reliability.test.mjs:101`；⑦`thincoder-vscode/src/agent/execute-tools.mjs` 注释指位 | 七处实读与现盘一致 |

**轮 7 · 拆档 ∕ 尺寸 ∕ 工具清理（8 条 · 路由 = 码面 ∕ 工程工具面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #196 | 码面（测试夹具） | 夹具隔离垫片（有主场景 = 夹具根哨兵档；无主场景 = 前置断言 ∕ 受控根；生产语义零动；落轮先定注入形） | `thincoder-core/test/manifest.test.mjs` ∕ `setup-reminders.test.mjs`（夹具面） | 家目录建档态下夹具不翻面（模拟用例绿） |
| #364 | 裁定核销 | 零码改——「不拆·登记」裁定核销（理由 + 消解窗口 = 承既有形态） | 裁定在册（批 2 §5.6-③）+ 登记位（VSC 测试面——实施舱就近） | 本批 §6 核销行在册 |
| #365 | 码面 | `setup-tooltable.mjs` 拆分执行（`buildToolTable` 段拆出邻档）+ 行数回填 | `thincoder-vscode/src/agent/setup-tooltable.mjs`（现读 344 as-of）+ 新邻档；登记形 = `docs/core/design/MANIFEST.md:168` ∕ `:176` ∕ `:182` | 拆后 ≤300 + 全绿 + 设计档回填 |
| #416 | 工程工具面 | `.thincoder/tmp/core-pkg/` 引用面确认 ⇒ 无引用即清理（父侧直改） | `.thincoder/tmp/core-pkg/`（仓内非跟踪面） | 引用面 grep 零命中 + 目录清理 ∕ 有引用则登记 |
| #450 | 码面（测试） | U95 例外面口径核对 + 收正（在册授权？） | `thincoder-desktop/test/host-floor.test.mjs:276-303`（U95 臂 ∕ 例外面） | 例外面逐条有授权来源 ∨ 移出 |
| #456 | 工程工具面 + 文档面 | doc-check 增行数面（§4.1 表逐档实读 vs 表值比对——越差即报 ∕ 生成表体；人工只留「越层登记 + 预案」） | `scripts/doc-check.mjs`（五档族）+ `docs/desktop/design/PROJECT.md` §4.1 | 一条命令输出 §4.1 差异 = 0（或列差异） |
| #471 | 码面 + 工程工具面 | 六项逐项二择一（落修 ∕ 成文维持 + 理由——不留悬空；廉价项优先：③URL 形收紧 · ⑥阈值派生 · ①②常驻用例评估） | `thincoder-desktop/scripts/check-dist.mjs` · `thincoder-desktop/src/main/main.mjs:56-58` · R1c 顾问项清单（实施舱定位） | 六项逐条处置记录在案 |
| #510 | 码面 | 桌面树 R1 ∕ R2 留守拆档（先复核重锚：styles.css 三段拆 ∕ `mount-settings.mjs` 信息行拆出 ∕ `core.css` 按面拆 ∕ `settings-sections` agent 段拆 ∕ `events.mjs`·`agent-host`·`mount-composer` 续拆 + 测试档越层 8 档） | `thincoder-desktop/renderer/{styles.css,core.css,mount-settings.mjs,views/settings-sections.mjs,events.mjs,mount-composer.mjs}` · `thincoder-desktop/src/main/agent-host.mjs` + 测试档 | 拆后逐档 ≤300（或越层登记）+ U95 ∕ §4.1 随动 + 全绿 |

**轮 8 · 处置 ∕ 实证族（8 条 · 路由 = 混：登记 = 文档面 ∕ 实证 = 码面）**

| 条 | 面 | 改动形 | 落点 | 验收读法 |
|---|---|---|---|---|
| #251 | 转档登记（文档面） | 合流候选 + 触发（统一需求出现 ∥ 两套逻辑漂移；涉 send 机制面 ⇒ 先请用户裁） | send ∕ 注入面设计档（按 `docs/batches/2026-09-24-busy-queue-visible.md` §1.13 指针定位） | 登记句在册 ⇒ 转档核销 |
| #255 | 处置（评估 ∕ 登记） | 二择一：复核模板精简（提示词面）∕ 复核位换模型——不采纳则登记已知降级 | judge ∕ bench 设计档（指针 = `docs/batches/2026-09-24-judge-reversal-fix.md` §6.3） | 处置在案（修 ∕ 登记） |
| #298 | 转档登记（文档面） | 条件句（写路径冻结再现观测 ⇒ 归批评估）+ 面记录 | VSC 设计档（`thincoder-vscode/src/agent/execute-tools.mjs:175-181` 面——实施舱定位） | 条件句在册 ⇒ 转档核销 |
| #356 | 码面（取证） | 渠道校验级探针（`disabled` ∕ `none` 载荷 → 400 判定）→ 结论入档 | 读数 → `docs/core/design/MODEL-SPECS.md`（thinkAlwaysOn 列）+ 判据表随动 | 两模型结论入档（或「未取证」登记 + 默认侧明示） |
| #429 | 码面（复现 + 修） | 先模块级复现（两模块用例）→ 成立即修（倾向「堵源」：补 VSC 侧入队判据，与 CLI 门禁同形——KD-9） | `thincoder-vscode/src/extension/queued-merge.mjs:42` · `queued-pickup.mjs:52` + VSC 测试档 | 复现结论在案；成立 ⇒ slash 不滞留（用例） |
| #448 | 码面 + 文档面（先小设计） | 两裁落地：①模态期抑制 + 关闭后补评估；②异常径重武装（`sync()` 入 `finally`——会话停 ∕ 显式撤销除外）+ §6.30 两句（KD-6） | `thincoder-cli/src/tui/suspension-drive.mjs` ∕ `timer-watch.mjs` + `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30 | 两句在档 + 两条行为用例（模态期不点火 ∕ 异常后仍可点火） |
| #451 | 码面（实证） | VSC `effort` 施加面实读（`agent-state.mjs:90+` 全文）+ 行为例；结论二择一（有面 ⇒ 用例；无面 ⇒ 端差三件齐 ∕ 补接线） | `thincoder-vscode/src/agent/agent-state.mjs:90+` + VSC 测试档；`docs/core/design/SESSION.md` §6.21 邻位随动 | 结论在案（unverified 标注卸载） |
| #515 | 码面 + 文档面（先小设计） | 三则收口（①代次洗白：回合域代次 ∕ 级联清装配二择——倾向级联清装配；②send 侧闸 + 新 reason 码；③空闲闩点火逢中止 ⇒ 中止后交付闸）+ #507 合并面（装配表清点）同收 | `thincoder-desktop/src/main/agent-host.mjs:113-123` · `thincoder-desktop/src/main/ipc.mjs`（send 径）· `suspension-drive.mjs` ∕ `timer-watch.mjs`；明细 = midturn 批档 §5 | 三则各有判据句 + 用例（陈旧回合不洗白 ∕ 跨中止不起跑 ∕ 中止后不投递） |

**2.6 受影响文件与测试面（file 级 · 行数为 as-of——实施舱按届盘重锚）**
- 文档面（约 30+ 档）：`CORE-UNIFICATION.md` · `MANIFEST.md` · `SESSION.md` · `TESTING.md` · `DOC-DISCIPLINE.md` · `MULTI-INSTANCE-COLLAB.md` · `TOOLS.md` · `ENG-TOKEN-BINDING.md` · `WEBVIEW-PROTOCOL.md` · `E2E-TESTING.md` · `RELEASE.md` · `ARCHITECTURE.md` · `docs/desktop/design/{PROJECT,IPC,UI}.md` · `CLI-DEBT.md` · `CLI-ENTRY.md` · `AGENT-LOOP-ASYNC-POOL.md` · `MODEL-SPECS.md` + 轮 1 ∕ 2 sweep 面各族档。
- 码面（约 35 档）：core——`agent-tools/{checkpoint,consult,batch,batch-lifecycle}.mjs` · `session-slot-verify.mjs`（≈301）· `session-slots-manifest.mjs`（421）· `session.mjs` · `session-guard.mjs` · `session-slot-write.mjs` · `token-ttl.mjs` · `session-lifecycle.mjs` · `peer-claims.mjs` · `test/{touch-paths,core-hygiene,process-probe}.test.mjs`；cli——`src/acp/handlers-session.mjs` · `src/tui/{cmd-advisor,suspension-drive}.mjs` · `README.md` · `AGENTS.md` · `test/{doc-check,advisor-chain-guards,session-ledger-reliability}.test.mjs` + 新测试腿；vsc——`src/extension/{peer-claims,settings,panel-session-write,queued-merge,queued-pickup,setup-tooltable}.mjs` · `src/agent/{agent-state,execute-tools}.mjs` · `webview/{mode-buttons,render-frame,generate-title}.js` · `AGENTS.md` + 测试档；desktop——`renderer/{chat-chrome,chat-tool,events}.mjs` · `renderer/views/*.mjs` ∕ `renderer/{styles.css,core.css,mount-settings,mount-composer}.mjs` · `src/main/{agent-host,ipc,main}.mjs` · `scripts/check-dist.mjs` · `test/{host-floor,chat-render.integration,views-*}.test.mjs`。
- 越层 ∕ 贴线关注（拆分预案随轮）：`session-slot-verify.mjs` ≈301（补例走登记路）· `setup-tooltable.mjs` 344（轮 7 拆）· `mount-settings.mjs` 499（在册例外——轮 7 拆信息行）· `styles.css` 466（轮 7 三段拆）· `events.mjs` ∕ `agent-host.mjs` ∕ `mount-composer.mjs`（轮 7 续拆）。
- 测试面：四套件（core ∕ cli ∕ vsc ∕ desktop `npm test`）各轮随动全绿 + `node scripts/doc-check.mjs` 读数（轮 1 清零基线）。

**2.7 关键决策记录（含被否备选）**
| KD | 裁 | 理由 ∕ 被否 |
|---|---|---|
| KD-1 #195 | 判实现为准——收正三处字面 | 实施经内审判「忠实（对 KD 意图）」+ 代码评审 pass；被否：判设计为准（重开实现轮——代价大、字面收益） |
| KD-2 #388 | 文档面规范句；引擎零改 | 引擎放宽 = 引文口径面扩大 + 假阴风险；规范句零代码 |
| KD-3 #382 | 同口径收（CLI 去镜像写） | 端差默认消除（VSC 已收）；分歧面（回退链依赖）随轮报告改判 |
| KD-4 #369 | `findInFlightBatch` 递归扫描 | create 显式嵌套为合法接受面 ⇒ 顶层限定将破坏既有面；被否：create 顶层限定 |
| KD-5 #485 | 边界行收正 + 布局收窄条件登记；F-SL1 判定句零改 | 判据量级 = 50 档夹具（T-SD18）；阈值面属需求档（笔权在外） |
| KD-6 #448 | ①模态期抑制 + 关闭后补评估；②异常径重武装（会话停 ∕ 显式撤销除外） | 用户显式交互优先于后台自动轮；唤醒面应跨异常自愈 |
| KD-7 #503 | 签名增 mtimeMs（保存面写后取 mtime） | 沿 `session-slot-verify.mjs:99` mtime 地板先例；缺省回溯墙钟 |
| KD-8 #425 | 机检臂（通则断言） | 两长驻面属性集已常量、断言成本低；被否：纯人工走查 |
| KD-9 #429 | 倾向「堵源」（入队判据） | 与 CLI 门禁同形（单源语义）；取批面放行 slash 为备选——复现结论裁决 |
| KD-10 #510 | 续拆按在册预案执行（先重锚） | 拆档窗口已到 + 例外续期历史长；重锚防按旧盘面下刀 |

**2.8 边界（本批不做）**
- 不触需求档判据本体（F-SL1 等——主 agent 域；#485 只改设计句）；不重开已冻结批档（记录面零回改）。
- 不触他批在途面（桌面族 #517–#530 ∕ #526 ∕ #527 ∕ #528——重叠项见 2.9 上抛 2）。
- 不改存储契约（#485 布局收窄只登记不执行）；发布窗物化不执行（#470 仅落纪律句）；不扩 send 机制面（#251 只登记——触 send 前先请用户裁）。
- #433（Playwright 基建）不在本批——#431① ∕ #434 以其为触发。

**2.9 上抛项**
1. **§1.2 实列 57 条 vs 派单口径 63 条**——差 6 条（`#251` `#255` `#298` `#369` `#416` `#481`，task_book 均指本批）：本设计已按台账全量 63 条覆盖；请主 agent 确认 ∕ 收正 §1.2。
2. **#527（口子收敛轮 · 在途）「父侧自理」声明**（`#370` ∕ `#396` ∕ `#373③` ∕ `#378②③`）与本批覆盖重叠——防双执行 ∕ 双核销，归属须主 agent 明示。
3. #485：F-SL1 阈值面（如需复审）——需求档域，本设计零改动处置。
4. #195 ∕ #388：判据 ∕ 规范本体收正 = 设计变更——已入本批（评审 + 用户批准门）。
5. #431① ∕ #434：触发依赖 #433（Playwright）——条件在册。
6. #354：台账事实（「两路由块以 `todo` 换代 `timer`」）与本设计勘察（两 `common.md` 路由块未见 `timer` ∕ `todo` 行）不符——实施舱先四态复核定案。
7. #356：取证需渠道环境（运行期排程须备）；#382：回退链实读若依赖镜像写 ⇒ 改判成文保留（随轮报告）。

**2.10 自检**
- 63 条逐条有轮次 + 改动形 + 落点 + 验收读法 ✓；每轮 ≤15 档 ✓（最大 10）；change-face 逐条标注 ✓；实施序分层在册 ✓（2.3）；边界 + 上抛 ✓（2.8 ∕ 2.9）。
- 三链：台账 63 ↔ §2 覆盖（2.5）↔ 逐条核销（§6）——一致（缺 6 条已补入并上抛 1）。
- 笔域：本设计只落 §2；他档 ∕ 码面零触碰 ✓。

**评审轮 1 修正（fix 轮 · 2026-09-28 · eng-designer —— 承 §3 轮次 1 八发现 + 父侧届盘补勘）**

- 形式 = append 修正块：原 §2 表内错值以本块覆盖说明（原文不改）；修正后设计 = 原 §2 + 本块。
- 行数口径 = node 内容行数（`split("\n").length − 1`；read 工具计法 +1——`styles.css` ∕ `mount-settings.mjs` 两行按 read 计法在册，差 1 行不另调）。
- 零新语义：只落 §2；不动 §1 ∕ §3–§6 ∕ 码面 ∕ 他批面；不新增条目 ∕ 新机制。

**修-1（承评审 #1 · §2.6 重建：逐档现行数 + delta；据新数重推越层）**

三处更正（原表错值）：
- `thincoder-core/session-slots-manifest.mjs`：421 ⇒ **232**（2026-09-28 拆档批已外提 `session-slot-claims.mjs`——`docs/batches/2026-09-28-split-batch.md` §2；232 ≤ 300 ⇒ **出越层面**）。
- `thincoder-desktop/renderer/styles.css`：466 ⇒ **499**（read 计法；距 500 硬限 1 行）。
- `thincoder-vscode/src/agent/setup-tooltable.mjs`：344 ⇒ **333**（轮 7 拆分目标数按 333 重锚）。

受影响面 · 文档（现行 | 预期 delta）：
| 档 | 现行 | 预期 delta |
|---|---|---|
| docs/core/design/CORE-UNIFICATION.md | 1974 | ≤±10（#352 表右列逐行收正） |
| docs/core/design/MANIFEST.md | 779 | ≤+10（#195 三处 ∕ #365 登记回填） |
| docs/core/design/SESSION.md | 1184 | ≤+15（#485 ∕ #481 ∕ #451） |
| docs/core/design/TESTING.md | 416 | ≤+10（#384 ∕ #431） |
| docs/core/design/DOC-DISCIPLINE.md | 1500 | ≤+15（#388 ∕ #404 ∕ #430） |
| docs/core/design/MULTI-INSTANCE-COLLAB.md | 430 | ≤±5（#387；兼作 #298 条件句候选落点） |
| docs/core/design/TOOLS.md | 1138 | ≤±5（#378① 两处） |
| docs/core/design/ENG-TOKEN-BINDING.md | 179 | ≤±5（#378①） |
| docs/vsc/design/WEBVIEW-PROTOCOL.md | 660 | ≤±10（#378①；#502 同拍） |
| docs/desktop/design/E2E-TESTING.md | 260 | ≤+10（#434） |
| docs/RELEASE.md | 268 | ≤+10（#470 两句） |
| docs/core/design/ARCHITECTURE.md | 233 | ≤+5（#400①） |
| docs/desktop/design/IPC.md | 333 | ≤±10（#414 ∕ #441②） |
| docs/desktop/design/PROJECT.md | 1017 | ≤+15（#394 ∕ #414 ∕ #456） |
| docs/desktop/design/UI.md | 579 | ≤±5（#396③） |
| docs/cli/design/CLI-DEBT.md | 106 | ≤+10（#529①） |
| docs/cli/design/CLI-ENTRY.md | 75 | ≤+5（#529②） |
| docs/core/design/AGENT-LOOP-ASYNC-POOL.md | 745 | ≤+15（#448 ∕ #513） |
| docs/core/design/MODEL-SPECS.md | 2077 | ≤+15（#356） |
| docs/core/design/BATCH-RECORD.md | 443 | ≤+10（#404 ∕ #430） |
| docs/core/design/prompts/{common,discipline-normal,discipline-engineering,persona-engineering}.md（CN 正本） | 123 ∕ 202 ∕ 131 ∕ 179 | 逐档 ≤±5（#354 ∕ #420–#424——#420 收敛为单处 + 他处改指） |
| thincoder-core/prompts/{common,discipline-normal,discipline-engineering,persona-engineering}.md（EN live） | 165 ∕ 206 ∕ 138 ∕ 178 | 逐档 ≤±5（同族随动） |
| docs/batches/2026-09-24-busy-queue-visible.md | 694 | ±0（#251 指针源） |
| docs/batches/2026-09-24-judge-reversal-fix.md | 386 | ±0（#255 指针源） |

受影响面 · 码（现行 | 预期 delta）：
| 档 | 现行 | 预期 delta |
|---|---|---|
| thincoder-core/agent-tools/checkpoint.mjs | 117 | ≤+10（#417 计数入载荷） |
| thincoder-core/agent-tools/consult.mjs | 481 | ≤±5（#421 一行注释）· 越层（修-2） |
| thincoder-core/agent-tools/batch.mjs | 366 | ≤±10（#422 ∕ #369 消费面）· 越层（修-2） |
| thincoder-core/agent-tools/batch-lifecycle.mjs | 293 | ≤+30（#422 三规则 ∕ #369 递归判定） |
| thincoder-core/agent-tools/batch-skeleton.mjs | 156 | ≤+5（#430 可选行——父侧裁） |
| thincoder-core/session-slot-verify.mjs | 300 | ≤+15（#499——补例走登记路，勿强拆） |
| thincoder-core/session-slots-manifest.mjs | 232 | ≤+15（#503 签名增 mtimeMs） |
| thincoder-core/session.mjs | 256 | ≤+15（#503 调用点 ∕ #441① 对端） |
| thincoder-core/session-guard.mjs | 74 | ≤+15（#386——缓存键扩槽维如成立） |
| thincoder-core/session-slot-write.mjs | 222 | ≤±5（#441①） |
| thincoder-core/session-lifecycle.mjs | 382 | ≤+5（#441④ 一行守卫）· 越层（修-2 附） |
| thincoder-core/token-ttl.mjs | 288 | ≤+5（#441③） |
| thincoder-core/peer-claims.mjs | 263 | ±0（#351 单源对端；改在 VSC 侧） |
| thincoder-core/think-off.mjs | 26 | ±0（#363 核单源对端） |
| thincoder-core/generate-title.mjs | 122 | ≤+10（#363③——:46 ∕ :54 ∕ :68 三处 hardcode） |
| thincoder-cli/src/acp/handlers-session.mjs | 281 | ≤+10（#363①） |
| thincoder-cli/src/tui/cmd-advisor.mjs | 290 | ≤+10（#382） |
| thincoder-cli/src/tui/suspension-drive.mjs | 362 | ≤+30（#513 ∕ #448 行为面）· 越层（修-2） |
| thincoder-cli/src/tui/timer-watch.mjs | 90 | ≤+10（#448 ∕ #515） |
| thincoder-cli/src/tui/render-frame.mjs | 428 | ≤±5（#363②——:52 顶栏 think 徽标） |
| thincoder-cli/README.md | 536 | ≤±5（#514 一行注释；产品文本面 ⇒ 不判越层） |
| thincoder-cli/AGENTS.md | 63 | ≤+5（#529③） |
| thincoder-vscode/AGENTS.md | 128 | ≤+5（#502） |
| thincoder-vscode/src/extension/peer-claims.mjs | 224 | ≤±10（#351 引核） |
| thincoder-vscode/src/extension/settings.mjs | 409 | ≤±5（#378② 已清——余零）· 越层（修-2） |
| thincoder-vscode/src/extension/panel-session-write.mjs | 144 | ±0（#378② 已清） |
| thincoder-vscode/src/extension/queued-merge.mjs | 64 | ≤+10（#429） |
| thincoder-vscode/src/extension/queued-pickup.mjs | 57 | ≤+10（#429） |
| thincoder-vscode/src/agent/setup-tooltable.mjs | 333 | 拆 ⇒ ≤300（轮 7——拆出 `buildToolTable` 段）· 越层（在册） |
| thincoder-vscode/src/agent/execute-tools.mjs | 419 | ≤±5（#529⑦ 注释指位）· 越层（修-2 附） |
| thincoder-vscode/src/agent/agent-state.mjs | 158 | ≤+15（#451 实证 + 用例） |
| thincoder-vscode/webview/mode-buttons.js | 18 | ≤±5（#378 残余——父侧补清） |
| thincoder-desktop/renderer/events.mjs | 481 | ≤±10（#396③ 已清；轮 7 续拆）· 越层（轮 7） |
| thincoder-desktop/renderer/views/chat-chrome.mjs | 297 | ≤+10（#512） |
| thincoder-desktop/renderer/views/chat-tool.mjs | 217 | ≤±5（#396③ 已清） |
| thincoder-desktop/renderer/styles.css | 499 | 轮 7 三段拆（目标逐段 ≤300）· 硬限贴线 |
| thincoder-desktop/renderer/mount-settings.mjs | 499 | 轮 7 信息行拆出 · 硬限贴线 |
| thincoder-desktop/renderer/core.css | 345 | 轮 7 按面拆 |
| thincoder-desktop/renderer/views/settings-sections.mjs | 356 | 轮 7 agent 段拆 |
| thincoder-desktop/renderer/mount-composer.mjs | 457 | 轮 7 续拆 |
| thincoder-desktop/renderer/store.mjs | 344 | 轮 7 续拆 |
| thincoder-desktop/src/main/agent-host.mjs | 387 | ≤+40（#515 三则 ∕ #507）· 越层（轮 7 续拆） |
| thincoder-desktop/src/main/ipc.mjs | 277 | ≤+20（#515 send 径） |
| thincoder-desktop/src/main/main.mjs | 108 | ≤±5（#471⑥） |
| thincoder-desktop/scripts/check-dist.mjs | 81 | ≤+10（#471） |

受影响面 · 测试 ∕ 工程工具（现行 | 预期 delta）：
| 档 | 现行 | 预期 delta |
|---|---|---|
| thincoder-core/test/touch-paths.test.mjs | 119 | ≤+10（#361） |
| thincoder-core/test/core-hygiene.test.mjs | 225 | ≤+5（#529④） |
| thincoder-core/test/process-probe.test.mjs | 244 | ≤+5（#529⑤） |
| thincoder-core/test/manifest.test.mjs | 355 | ≤+20（#196）· 越层（修-2 附） |
| thincoder-core/test/setup-reminders.test.mjs | 368 | ≤+20（#196）· 越层（修-2 附） |
| thincoder-core/test/session-ledger-reliability.test.mjs | 297 | ≤+5（#529⑥——:101 扫描表补新档） |
| thincoder-cli/test/doc-check.test.mjs | 340 | 免实施（#370）——零改动 |
| thincoder-cli/test/advisor-chain-guards.test.mjs | 488 | 免实施（#373）——零改动 |
| thincoder-cli/test/session-gc-cli.test.mjs | 154 | 先例面（#439；新腿另档） |
| thincoder-desktop/test/host-floor.test.mjs | 366 | ≤+15（#402 ∕ #450）· 越层（修-2 附） |
| thincoder-desktop/test/integration/chat-render.test.mjs | 283 | ≤+10（#506） |
| thincoder-desktop/test/views-chat.test.mjs | 451 | ≤+30（#425）· 越层（修-2 附） |
| thincoder-desktop/test/views-activity.test.mjs | 390 | ≤+30（#425）· 越层（修-2 附） |
| thincoder-vscode/test/model-picker-fallback.test.mjs | 391 | ±0（#364 不拆·登记——§12.1 补登见修-8）· 越层（在册） |
| scripts/doc-check.mjs | 75 | ≤+50（#456 行数面） |
| scripts/doc-check-anchors.mjs | 322 | ±0（#388 读面确认零改） |
| .github/workflows/test.yml | 55 | ≤+5（#400② Node 22 腿） |

**修-2（承评审 #2 · 越层清单：四档补入 + 据新数重推）**

四档补入（点名 · 各附预案；执行时点 = 随该档结构触碰批，本批零并拆）：
- `thincoder-core/agent-tools/batch.mjs` **366**（#369 ∕ #422）：拆预案 = 段文本加工族（`segmentNumber` ∕ `allowedSegment` ∕ `sanitizeText` ∕ `roundCount` ∕ `insertIntoSection`，`:89-149` ≈61 行）外提 `batch-segments.mjs` ⇒ ≈305；#369② 撤别名落定时 `batchSegmentTool`（`:335-366`）随删 ⇒ ≈273。本批不执行（改动 = 条款级）。
- `thincoder-core/agent-tools/consult.mjs` **481**（#421——距 500 硬限 19 行）：拆预案 = 子会话运行 ∕ 结算族（`sessionSettled` ∕ `settleChild` ∕ `runConsultChild`，`:153-381` ≈229 行）外提 `consult-child.mjs` ⇒ ≈252。本批不执行（改动 = 一行注释）。
- `thincoder-vscode/src/extension/settings.mjs` **409**（#378② 已清——余零）：拆预案 = shell 检测 ∕ provider 读族（`loadAgentSettings` ∕ `commandExists` ∕ `shellCandidates` ∕ `providerStatus` + provider 命令 handlers，`:28-183` ≈156 行）外提邻档（档名落轮定）⇒ ≈253。本批不执行（零改动）。
- `thincoder-cli/src/tui/suspension-drive.mjs` **362**（#513 ∕ #448——行为改动）：拆预案 = 池 ∕ 待决查询族（`poolCounts` ∕ `consultRunningChildren` ∕ `pendingFamilyCount` ∕ `pendingFamiliesNonEmpty` ∕ `allPendingEntries` ∕ `poolLive` ∕ `sweepSettledToPending`，`:49-122` ≈74 行）外提 `suspension-pool.mjs` ⇒ ≈288。本批不执行（本批 = 行为面两则）。

据新数重推的其余触碰面（>300 · 逐档裁定）：
- 不拆 + 理由（增量 = 行级 ∕ 注释级；拆分 = 结构面，随该档结构触碰批）：`session-lifecycle.mjs` 382（#441④ 一行守卫）· `test/manifest.test.mjs` 355 ∕ `test/setup-reminders.test.mjs` 368（#196 夹具垫片）· `src/agent/execute-tools.mjs` 419（#529⑦ 注释）· `src/tui/render-frame.mjs` 428（#363② 显示面）· `test/host-floor.test.mjs` 366（#402 ∕ #450）· `test/views-chat.test.mjs` 451 ∕ `test/views-activity.test.mjs` 390（#425 判据臂）· `test/model-picker-fallback.test.mjs` 391（#364 裁定在册——§12.1 补登见修-8）。
- 轮 7 执行面（承 2.5 轮 7 行 · 先重锚后下刀）：`styles.css` 499 · `mount-settings.mjs` 499 · `core.css` 345 · `settings-sections.mjs` 356 · `events.mjs` 481 · `agent-host.mjs` 387 · `store.mjs` 344 · `mount-composer.mjs` 457 · `setup-tooltable.mjs` 333（拆 ⇒ ≤300）。
- 出越层面：`session-slots-manifest.mjs`（421 ⇒ 232——拆档批已外提，判消）。
- 贴线维持：`session-slot-verify.mjs` 300（补例走登记路——勿强拆）。

**修-3（承评审 #3 · 双执行防免 + §2.9-2 收口）**
- `#370` 行 ⇒ **免实施（父侧已清 · 已核销）**——`doc-check.test.mjs:5` ∕ `:73` 父侧已收正；本批零触碰。
- `#373` 行 ⇒ **免实施（父侧已清 · 已核销）**——三重死引处置父侧已办；本批零触碰。
- `#378` 行 ⇒ **余下清单**：① 文档面 4 处（`docs/core/design/TOOLS.md:81` ∕ `:122` · `docs/core/design/ENG-TOKEN-BINDING.md:100` · `docs/vsc/design/WEBVIEW-PROTOCOL.md:111`）；② `mode-buttons.js:3-4` = 在跑舱 #72 落定后父侧补清（不入本批）。**已清（父侧 2026-09-28 19:5x · 已核销）** = 三注释（`settings.mjs:181` ∕ `panel-session-write.mjs:92` ∕ `thincoder-vscode/AGENTS.md:86`）。
- `#396` 行 ⇒ **余下清单**：①② 两族（§ 号位移一处 + 批 N 条目号撞名三处）——届盘另扫定位（见修-8）。**已清（父侧 19:5x · 已核销）** = ③ 第八词坐标钉（对 = `renderer/events.mjs:329` ∕ `views/chat-tool.mjs:13`；单源 = `docs/desktop/design/PROJECT.md:775`；两档在舱 #73 写域 ⇒ 父侧落定后补清）。
- §2.9-2 **收口**：归属已由 §1.2 上抛 2 裁定明示（免实施 ∕ 余下清单）——本条闭合，不再求裁。

**修-4（承评审 #4 · 自陈漂移对齐）**
- §2.1 叙述更正：本批 63 条 = §1.2 四族实列 63 条（22 + 25 + 15 + 1 · 含补条 6：`#251` `#255` `#298` `#369` `#416` `#481`）——「三族实列 57 条 + 6 条未列」表述撤。
- 上抛 1 ⇒ **已决（§1.2 已收正——2026-09-28 19:5x）**。

**修-5（承评审 #5 · #441① 重锚）**
- #441① 对端重锚：`thincoder-core/session-slot-write.mjs:74`（`diskLonger` 判定）∥ `thincoder-core/session.mjs:211`（`data.history` 过 `isLegacyTransient` 过滤面——原引 `:209` ≡ 不可读分支 `return null`，撤）。执行轮按实面核两端性质（写面守卫 ∕ 读槽回放过滤）后对齐口径。

**修-6（承评审 #6 · 上限统一 + 轮 6 除外注）**
- 每轮上限统一为 **≤10**（状态行现值；= 设计实际最大）：§2.4 ∕ §2.10 的「≤15」以本块为准更正为「≤10」——全线同值。
- §2.3「立刻可做」轮 6 项补「**除 #382**」（#382 = 先小设计——同节两处并持有）。

**修-7（承评审 #7 · #416 扩面）**
- 清理面扩至 `.thincoder/tmp/**` 核副本族（判据 = 核包 ∕ 核档复制体）：已勘 4 处 = `thincoder/.thincoder/tmp/{core-pkg, core-probe, cli-pkg}` + `thincoder-vscode/.thincoder/tmp/core-registry-copy`；执行轮按判据对该目录全扫一次（命中即纳入）。
- 处置不变：逐处引用面 grep——零命中 ⇒ 清理（父侧直改 · 仓内非跟踪面）；有引用 ⇒ 登记保留理由。已勘佐证：现全仓零活引用（命中皆批档历史记载）；`core-registry-copy` 已被 `.vscodeignore` 排除出 VSIX（承 hatch-closure 批）。

**修-8（承评审 #8 · 实施舱定位 → 锚补）**
- `#369`：定义面重锚 = `thincoder-core/agent-tools/batch-lifecycle.mjs:68`（`findInFlightBatch` 定义）；调用点 = `thincoder-core/agent-tools/batch.mjs:185 ∕ :307`（原「batch.mjs 面」据此更正）。
- `#298`：设计档锚 = `docs/core/design/MULTI-INSTANCE-COLLAB.md` §4.4.4（L3 预检钩点族——端钩点记 `execute-tools.mjs:187-195`；台账原引 `:175-181`，执行轮两读并核）；读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1。
- `#364`：登记位 = `docs/vsc/design/VSC-DEBT.md` §12.1（测试档越线登记块——补一行：`model-picker-fallback.test.mjs` 391 · 不拆 + 理由；承 `docs/batches/2026-09-25-off-family-closeout.md` §5.6-③ 留档 ∕ `:262` 裁定）。
- `#374`：族坐标 = `thincoder-core/advisor/**`（§14.x ∕ §16.x 族 · 在册 37 处 ∕ 6 档）+ `thincoder-core/tools/**`（TOOLS 旧号族 · 在册 23 处 ∕ 8 档）+ VSC 面板族（`thincoder-vscode/src/extension/panel-callbacks.mjs` ∕ `panel-messages-turn.mjs` 等）；口径 = `docs/core/design/DOC-DISCIPLINE.md` §3.12；具体行 = 届盘逐族复扫（在册数字 = 2026-09-25 读数）。
- `#396①②`：届盘另扫定位（保留声明）——扫描面 = 产品码注释跨批 § 引用 ∕ 批 N 条目号；原「align-2 §2 清单」指引不可解析，撤。
- `#471`：清单面 = `docs/batches/2026-09-27-render-core-r1.md` §1.6 备记行（`:51`）· §5.6（`:157`）；面 = `thincoder-desktop/scripts/check-dist.mjs` · `thincoder-desktop/src/main/main.mjs:56-58`。
- `#481`：值域模板面 = `thincoder-core/agent/setup-reminders.mjs:41`（核端模板生产者 · `env: ${END}` ← `sessionEnd()`）· `thincoder-vscode/src/agent/setup-reminders.mjs:62`（VSC 端持 `vscode`）· 设计面 `docs/core/design/SESSION.md:231-232`；桌面端 producer = 全树零命中（探索实证——执行轮据此核注入链）。
- `#513`：面锚 = `thincoder-cli/src/tui/suspension-drive.mjs:123-161`（`waitForSettleOrWake` 窗内 timer 支）。
- `#354`：两源现读 = `docs/core/design/prompts/common.md` 123 ∕ `thincoder-core/prompts/common.md` 165——路由块位置届盘重锚（台账坐标 as-of）。
- `#510`：现读数供届盘对读 = `styles.css` 499 · `mount-settings.mjs` 499 · `core.css` 345 · `settings-sections.mjs` 356 · `events.mjs` 481 · `agent-host.mjs` 387 · `store.mjs` 344 · `mount-composer.mjs` 457。

**补（父侧补勘 · 四引路 MISSING 重锚）**
- 补-1：`docs/core/design/WEBVIEW-PROTOCOL.md` ⇒ 实存 `docs/vsc/design/WEBVIEW-PROTOCOL.md`（660）——出现处 = #378 行 + §2.6 文档面（均按实存路径读）。
- 补-2：`thincoder-vscode/webview/render-frame.mjs:52` ⇒ 实存 `thincoder-cli/src/tui/render-frame.mjs:52`（`renderHeader` 顶栏 think 徽标；现读 428；VSC webview 树无同名档——实勘）。
- 补-3：`thincoder-vscode/webview/generate-title.mjs:46 ∕ :68` ⇒ 实存 `thincoder-core/generate-title.mjs:46 ∕ :68`（另 `:54` google 支一并核；现读 122；VSC `src/extension/generate-title.mjs` 现读 25，无该行位）。
- 补-4：`thincoder-cli/test/session-ledger-reliability.test.mjs:101` ⇒ 实存 `thincoder-core/test/session-ledger-reliability.test.mjs:101`（core 树——目录更正；现读 297；:101 = 扫描表 `["session-slots.mjs", "session-slot-verify.mjs", "session-slots-manifest.mjs", "session-lifecycle.mjs"]`——「补新档」= 该表补 `session-slot-claims.mjs`）。

（本块 = fix 轮 1 交付；原 §2 正文与本块冲突时以本块为准。）

**轮 1 交付（文档面清账 sweep · 2026-09-28 · eng-designer——承 §2.4 轮 1 五行逐行照行）**

**逐条改动与读数**：

- `#435`（全仓 doc-check 存量红清账）：开工基线 `node scripts/doc-check.mjs` = 悬空 **70**（路径 69 + 符号窄 1）· 行宽 **35**（日志 `.thincoder/tmp/round1-doc-check-baseline.log`）。我域内全清：**悬空**——路径按「仓根完整路径」收正（CLI-DEBT:56 · TUI-INPUT-BOX ×10 · TUI ×3 · AGENT-LOOP:20/:66 · AGENT-LOOP-UPSTREAM:888 · CONFIG:49 · ENG-TOKEN-BINDING:98 · ENGINEERING-MODE-V2 ×3 · CORE-UNIFICATION ×8（含 §2.8.1 表三行转 `（迁移期引文——…已迁核）`）· MODEL-SPECS:323/:1372/:1465 · SESSION ×6 · RENDER-CORE:300 · WEBVIEW:52 · SETTINGS ×6 · TOOLS:135 · desktop PROJECT:1016）；已删旧档坐标 = 行级引文标记 + 史实谓词（`MULTI-INSTANCE-COLLAB.md:90` 等）。**行宽**——我域内 33 行按语义折行清零（跨 13 档；另 4 条系本轮编辑当场引入 ⇒ 当场自清）。修法口径：`./x` 会被判 / `../x` 引擎跳过（沿用）。
- `#352`（`CORE-UNIFICATION.md` §2.13.4 ④ 表逐行对实盘收正）：`#52/#64` `#53` `#56` `#57` `#61` `#63` `#66` `#68` `#84` `#91` `#96` `#170` `#174` `#185` 由「端侧接线（S2…待做）」改「**已接**」+ 端引实证（VSC `tools/shared.mjs:186/191/192/193` · `tools/index.mjs:157` · `agent/setup-tooltable.mjs:32/80/86-89` · `i18n.mjs:21,41`；CLI `tui/tool-events.mjs:372` · `prompt-injections.mjs:17`）；`#59` / `#69` 标「**未接——两树零消费者（休眠缝）**（2026-09-28 实核）」；`#109` 标「未接（核 `thincoder-core/advisor/run.mjs:143` 第 7 实参实传 `null`）」并删两处死指针（`cli/src/advisor/loop.mjs` · `vsc/src/advisor/loop.mjs` = 均不存在）改指现形（`thincoder-cli/src/tui/tool-args.mjs:18`）；§2.13.5 三处 + §2.13.6 一处文本同拍（「S2 端侧接线仍待做」→「VSC 端侧已接（2026-09-15 · W14）」）。
- `#387`（`MULTI-INSTANCE-COLLAB.md:90` 邻段端域行收正）：改写为两分——「零同步 exec 扫描域」维持（`session-slots` ∕ `peer-instances`）+「端侧探测消费面」= `thincoder-vscode/src/extension/peer-instances.mjs` · `session-io.mjs`（证据 = `thincoder-vscode/test/zero-sync-exec.test.mjs:32/:73`）。
- `#374`（另族 sweep 三族复扫）：**只报不越码面，本批零改**——advisor 旧引族现扫 **零命中**；`core/tools` 旧号族与 VSC 面板族（§12.2.x）命中皆**码档 / 活登记形**（非文档面残留）；原「37 行 ∕ 6 档」登记源未定位（如实披露，不猜）。
- `#469`（引核行号抽检 · 本批触碰面）：7 处逐读实证 = 一致——`thincoder-vscode/src/extension/session-io.mjs:186`（`switchToSlot` 定义行）· `thincoder-core/advisor/run.mjs:143`（调用第 7 实参 `null`）· `thincoder-vscode/src/tools/shared.mjs:186-193` · `thincoder-vscode/src/agent/setup-tooltable.mjs:32/80/86-89` · `thincoder-vscode/src/i18n.mjs:21,41` · `thincoder-cli/src/tui/tool-events.mjs:372` · `thincoder-vscode/src/agent/execute-tools.mjs:238-239`；未触碰档维持既有 as-of 口径（D4）。

**机检收口读数**（`node scripts/doc-check.mjs` · 日志 `.thincoder/tmp/round1-doc-check-close.log`）：悬空 **11** · 行宽 **2** · 注记豁免 105 · 迁移期引文 236 · 拟新增 25。

**悬空 11 ∕ 行宽 2 全越域（零自修——如实披露 ∕ 上抛）**：
- 需求档 4 + 2（`docs/core/requirements/CHECKPOINT.md:12×2` ∕ `:99` · `docs/core/requirements/TOOLS.md:64` · `docs/desktop/requirements/PROJECT.md:248` · `docs/vsc/requirements/WEBVIEW.md:80`）——笔权 = 主 agent（本条按 D1 上抛）。
- `composer-send.mjs` ×7（`docs/desktop/design/PROJECT.md:208/209/243/271/272/422` · `docs/desktop/design/UI.md:456`）——**输入批在途面**（该批 §2.4 Q2 退役该档）⇒ 停并报，本批不修。

**披露（非阻断）**：工作树含他批在途未提交改动（本批编辑与其同树）；码面 / 脚本面 / 产品文本面零触。

（本块 = 轮 1 交付记录；与 §2 正文冲突时以本块为准。）

**评审轮 3 修正（fix 轮 · 2026-09-29 · eng-designer——承 §3 轮次 3 六发现）**

- 形式 = append 修正块：原 §2 表行 ∕ 修-1..8 ∕ 补-1..4 的届时错值以本块覆盖说明（原文不改）；修正后设计 = 原 §2 + 修-1..8 + 补-1..4 + 本块。
- 零新语义：只落 §2；不动 §1 ∕ §3–§6 ∕ 码面 ∕ 他批面；不新增条目 ∕ 新机制。
- 覆盖行位（as-of 2026-09-29 00:1x）：测试面句 = `:186`；轮 6 = `:148` ∕ `:150` ∕ `:154`；轮 7 = `:160` ∕ `:161` ∕ `:164` ∕ `:167`；轮 8 = `:177–180`；#195 = `:93`；#513 = `:152`；#434 = `:100`；桌面表 = `:298–:310`（修-1）· `:379`（修-8）。

**收正-①（评审 #3 · 发现 1 🔴 · 剩余轮测试面重划——八行清单 + §2.6 测试面句替换文）**

制度源（现行 · 2026-09-28 23:1x–23:33 用户连裁）：五仓测试树已随全清令归零（`docs/batches/2026-09-28-test-layer-prompts.md` §1.17）。
现行测试形（用户连裁定稿）：**单元 = 批次本地件**（住 `docs/batches/`、名随批档、一至几个、实施者自写自跑、随批留存 · 可按需复测）；**集成 = 三前端**（cli ∕ vsc ∕ desktop；核仓零集成）；**单元永不转集成**。

八行逐行（原行 → 新形）：

1. **#425**（轮 6）：机检臂 → **批次本地单测件**（`docs/batches/2026-09-28-tech-debt-closeout-<面>.test.mjs`，名随实施舱）。
   - 断言本体 = 「挂载期属性集只增 = 红」通则（两面各一臂 = `thincoder-desktop/renderer/views/chat.mjs` ∕ `activity.mjs`；原靶 `views-chat.test.mjs` ∕ `views-activity.test.mjs` 已删）。
   - 验收 = 点名复跑命令过（`node --test docs/batches/2026-09-28-tech-debt-closeout-<面>.test.mjs`；读数 = 用例名逐条 + 通过数）∨ 不可行时按原备选 = 明示人工走查 + 登记（二态其一，实施舱定）。
2. **#506**（轮 6）：**免实施 + 登记**——原靶（桌面集成面 `chat-render.test.mjs`）已随全清令删除 ⇒ 稳定化对象不存在。
   - 登记句 = 「桌面集成面按新制度重建时，`waitForFunction` ∕ 重试语义作为断言书写纪律随新建面落地——本批零改」。
3. **#529④⑤⑥**（轮 6）：**免实施 + 登记**——三靶档（`core-hygiene.test.mjs` ∕ `process-probe.test.mjs` ∕ `session-ledger-reliability.test.mjs`）已随全清令删除 ⇒ 原收正对象不存在（债面随靶消失）；①②③⑦ 四项维持原形（不涉测试树）。
4. **#196**（轮 7）：**免实施 + 登记**——两夹具靶档（`manifest.test.mjs` ∕ `setup-reminders.test.mjs`）已随全清令删除 ⇒ 「落轮先定注入形」免；登记句 = 「夹具隔离（家目录建档态不翻面）随新单元面重建时自查——本批零改」。
5. **#364**（轮 7）：**免实施 + 登记**——裁定对象档 `model-picker-fallback.test.mjs`（391 行 · 不拆裁定）已随全清令删除 ⇒ `docs/vsc/design/VSC-DEBT.md` §12.1 不再补登（原登记项随对象作废）；本批 §6 核销行说明。
6. **#450**（轮 7）：**免实施 + 登记**——靶档 `host-floor.test.mjs`（U95 臂 ∕ 例外面）已随全清令删除 ⇒ 例外面口径核对对象不存在。
7. **#510 测试档从句**（轮 7）：从句收正——「测试档越层 8 档」随全清令删除（撤）；代码档拆分面按收正-② 届盘表执行。
   - 验收读法 = 拆后逐档 ≤300（或越层登记）+ `docs/desktop/design/PROJECT.md` §4.1 随动（#456 面）；U95 随动撤（靶已删）、验收读数按点名命令形。
8. **轮 8 四行**：行为 ∕ 复现用例一律 → **批次本地件**（名随实施舱——前缀固定 `2026-09-28-tech-debt-closeout`）。
   - **#429** = 复现两臂（`queued-merge.mjs` ∕ `queued-pickup.mjs` 模块级）+ 成立后修复臂；**#448** = 两条行为用例（模态期不点火 ∕ 异常后仍可点火）。
   - **#451** = 行为例（有面 ⇒ 用例同件；无面 ⇒ 端差三件齐 ∕ 补接线——实读结论不变）；**#515** = 三用例（陈旧回合不洗白 ∕ 跨中止不起跑 ∕ 中止后不投递）。
   - 验收 = 各条点名复跑命令过（读数 = 用例名逐条 + 通过数）。

§2.6 测试面句（原 `:186`）替换文——以下两句代之：

- 「测试面（收正 · 2026-09-29）：单元 = 批次本地件（`docs/batches/2026-09-28-tech-debt-closeout*.test.mjs`——一至几个 ∕ 名随批档 ∕ 实施者自写自跑）；复跑命令 = `node --test docs/batches/2026-09-28-tech-debt-closeout-<面>.test.mjs`（点名命令形——读数 = 用例名逐条 + 通过数）。」
- 「集成 = 三前端（cli ∕ vsc ∕ desktop——本批触碰项 = 零）；核仓零集成面；四套件逐轮读法不再适用（空清单恒真——失判别力）；`node scripts/doc-check.mjs` 读数按面保留（轮 1 清零基线）。」

**收正-②（评审 #3 · 发现 2 🟡 · §2.6 桌面行届盘重建 + 轮 7 先核「对象存在性」）**

桌面行届盘重建（覆盖原 §2.6 桌面行 ∕ 修-1 表桌面行 ∕ 修-8 `#510` 读数行；行数 = read 计法 ∕ `split("\n").length`；as-of 2026-09-29 00:1x 亲测）：

| 档 | 旧读数（修-1 ∕ 修-8） | 届盘现读 | 处置 |
|---|---|---|---|
| `thincoder-desktop/renderer/events.mjs` | 481 | **483** | 仍存 ⇒ 轮 7 续拆 |
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | 297 | **289** | ≤300 维持（#512 落点） |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 217 | **218** | ≤300 维持 |
| `styles.css`（原桌面 renderer 面） | 499 | **不在盘** | 四拆已落（产物 = `theme.css` **90** ∕ `chrome.css` **425** ∕ `skin.css` **14**；`rail.css` 不在盘）⇒ 转核销 ∕ 只报 |
| `thincoder-desktop/renderer/mount-settings.mjs` | 499 | **136** | 信息行拆出已落（邻居 = `mount-info.mjs` **41**）⇒ 转核销 |
| `thincoder-desktop/renderer/core.css` | 345 | **431** | 仍存 ⇒ 轮 7 按面拆（按新数重推） |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | 356 | **264** | agent 段拆已落（邻居 = `settings-agent.mjs` **114**）⇒ 转核销 |
| `thincoder-desktop/renderer/mount-composer.mjs` | 457 | **410** | 仍存 ⇒ 轮 7 续拆 |
| `thincoder-desktop/renderer/store.mjs` | 344 | **282** | ≤300——出拆名单（轮 7 免拆） |
| `thincoder-desktop/src/main/agent-host.mjs` | 387 | **401** | 仍存 ⇒ 轮 7 续拆 |
| `thincoder-desktop/src/main/ipc.mjs` | 277 | **297** | ≤300 维持（贴线——#515 send 径增量计入） |
| `thincoder-desktop/src/main/main.mjs` | 108 | **115** | ≤300 维持 |
| `thincoder-desktop/scripts/check-dist.mjs` | 81 | **82** | ≤300 维持 |

- 四拆产物 `chrome.css`（425）越 300——其拆分归属不在本批（另有在册项），本批不并；届盘复核若需并裁 = 父侧裁。
- **轮 7 前置句（对象存在性复核——先于行号）**：轮 7 桌面项（#510 全列）开工先做「对象存在性」复核——档 ∕ 节 ∕ 符号仍在盘否（不止读行号）；**已拆 ∕ 已消失项转核销或只报；仍存项按届盘数重推拆分线**。

**收正-③（评审 #3 · 发现 3 🟡 · #195 坐标重锚 + 已落 ∕ 未落二态注）**

- 坐标重锚（原设计引 `:292` ∕ `:495` ∕ `:541` = as-of）：`docs/core/design/MANIFEST.md`——KD-M1-27 = **`:249`** · AC-N5 = **`:532`** · T13 = **`:582`**（变更记录 = **`:636`**——已载「AC-N5 ∕ T13 收正……KD-M1-27」）。
- 二态判读（2026-09-29 00:1x 实读）：
  - **已落（转核销）**：AC-N5（`:532`）与 T13（`:582`）均含「无锚（`agent.cwd` 缺失）」表列——收正本体在盘；
  - **未落（残余）**：KD-M1-27（`:249`）理由句——现读「零 I/O ∕ 零报明（沿用内存值）」仍未含目标字面「无锚 ∧ 有值 ⇒ 相位行 + 沿用内存值」；实施舱只对该残余字面动笔（判实现为准——KD-1）；不笔则登记理由。

**收正-④（评审 #3 · 发现 4 🟡 · 在飞面复核句）**

- 桌面项（轮 6 ∕ 7：#425 ∕ #506 ∕ #471 ∕ #510）开工**先核在飞面现态**，再定「执行 ∕ 转核销」（§1.1 `:28-29` 在册面）：
  - **#100（styles.css 四拆）**：产物实体届盘实读 = `theme.css` 90 ∕ `chrome.css` 425 ∕ `skin.css` 14（原 `styles.css` ∕ `rail.css` 不在盘）——与桌面子项重叠者按收正-② 表处置（转核销 ∕ 只报）；
  - **#101（R13-B 收口 ∕ check-dist 清单随动）**：开工实读 `thincoder-desktop/scripts/check-dist.mjs` 现态复核（本刻实读 = 单条 asar 断言「核包随产物」）；
  - 在飞面未落定项**零并**（本批零触）；§2.8 边界句维持。

**收正-⑤（评审 #3 · 发现 5 🔵 · #513 落点改锚）**

- 现盘归属（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）：§6.30.10 = 「阶段 2 · 核件 timer 面」（`:556`）· §6.30.11 = 「阶段 2 · 端面接线（桌面 ∕ VSC）」（`:576`）——CLI 不在 §6.30.11 射程（CLI = 阶段 1；面 = §6.30.5 跨形态行为表 CLI 行）。
- #513 第二半「补 CLI 句」改锚：默认 = **§6.30.10 邻位**（核句所在段「轮中止容纳（与消化支对称）」，`:570` 段）；**落笔前核 CLI 句归属**（§6.30.10 段内补 ∕ §6.30.5 CLI 行邻位 ∕ 另立子号——三择定一，防语义错位挂靠）。
- 同行验收读法收正：容纳用例 = **批次本地件**（同收正-① 口径）；「§6.30.11 实读含 CLI 句」→「落点句实读含 CLI 句」。

**收正-⑥（评审 #3 · 发现 6 🔵 · #434 触发句改可判形）**

- 「慢实证」撤（无定义形）——触发句改判形（义源 = 台账 #434 原条）：**触发 = ①#433 基建在位（已核销；可判引用件 = `thincoder-desktop/package.json` devDependencies 含 `playwright-core`）∧ ②桌面面「跑得慢」实测读数在案（实证对象 = 桌面套件单跑耗时；载体 = 收口亲跑日志 ∕ 报告行；现无该读数 ⇒ 条件未触）**。
- 权威面句不变（权威 = Electron；web 只做快筛）；落点不变（`docs/desktop/design/E2E-TESTING.md` 不做行邻位）。

（本块 = fix 轮 2 交付；原 §2 正文 ∕ 修-1..8 ∕ 补-1..4 与本块冲突时以本块为准。）

**评审轮 3 残余补扫（fix 轮 · eng-designer #23 · 2026-09-29——承 §3 轮次 3 发现 1 同类残余 + §1.8 残余处置）**

- 形式 = append 修正块：原 §2 表行字面不改，本块覆盖说明；修正后设计 = 原 §2 + 修-1..8 + 补-1..4 + 评审轮 3 修正 + 本块。
- 零新语义：只收验收读法 ∕ 测试面落点；不动 §1 ∕ §3–§6 ∕ 码面 ∕ 他档面；不新增条目 ∕ 新机制。
- 扫域 = §2 全表逐行实读；同类口径 = §3 轮次 3 发现 1（验收读法携「全绿」类字样 ∕ 用例未点名落点；测试面靶随全清令已清）。命中（剩余轮）**5 处**（as-of 2026-09-29 00:3x：`:67` ∕ `:103` ∕ `:151` ∕ `:156` ∕ `:167`）；另有已执行轮同字面 10 处（记录面——见下）。合计 ≤ 20，未触停止条件。
- 已执行轮（4 ∕ 5）「全绿 ∕ 用例未点名」字面（`:126` ∕ `:127` ∕ `:129` ∕ `:130` ∕ `:136` ∕ `:137` ∕ `:138` ∕ `:141` ∕ `:144` ∕ `:145` 共 10 处）= 执行时点读数（先于 2026-09-28 23:18 全清令 · §5 在册）——记录面既成读数，非剩余轮可执行面 ⇒ 本笔零改（改之即与实史相抵）。
- 边界项（零改 · 供审）：`#471` `:171`「①②常驻用例评估」（评估项——二择一处置即可执行）；`#456` `:170`「一条命令」（doc-check 面活体读数——可判）；§2.6 修-1 测试族表行仍列已删测试档（受影响文件表面，非验收读法——重排归 #456 ∕ 届盘面）。

**残-1（`#400` · 轮 2 · `:103` 验收读法收正）**

- 原行 → 新形：「两句实读 + 矩阵含 22 腿（core 测试 22 下跑通）」→「两句实读 + 矩阵含 22 腿（复核 = `.github/workflows/test.yml` 实读点名）；『core 测试 22 下跑通』标随全清令取消（核仓套件空清单恒真——失判别力）」。

**残-2（`#382` · 轮 6 · `:151` 落点句收正）**

- 原行 → 新形：「`thincoder-cli/src/tui/cmd-advisor.mjs:33` + 测试面随动」→「`thincoder-cli/src/tui/cmd-advisor.mjs:33`（『+ 测试面随动』撤——靶随全清令已清，零点名档）；行为保护用例 = 批次本地件（如设——收正-① 口径 · 点名复跑命令）」。

**残-3（`#512` · 轮 6 · `:156` 验收读法收正——用例点名）**

- 原行 → 新形：「同引用二帧零写用例（node 身份不变）」→「同引用二帧零写用例 = 批次本地件（`docs/batches/2026-09-28-tech-debt-closeout-<面>.test.mjs`——名随实施舱）；复跑 = `node --test docs/batches/2026-09-28-tech-debt-closeout-<面>.test.mjs`（点名命令形——读数 = 用例名逐条 + 通过数）」。

**残-4（`#365` · 轮 7 · `:167` 验收读法收正）**

- 原行 → 新形：「拆后 ≤300 + 全绿 + 设计档回填」→「拆后 ≤300 + 设计档回填；『全绿』标随全清令取消（四套件逐轮读法不再适用——空清单恒真，失判别力；纯结构拆不另设新用例）」。

**残-5（§2.3 · `:67` 需实证句收正——#429 从句）**

- 原行 → 新形：「#429（先在 VSC 测试树模块级复现）」→「#429（模块级复现——落批次本地件；『VSC 测试树』随全清令已清 · 收正-① 口径）」；同句 #451 ∕ #448 ∕ #515 用例面已由收正-①-8 覆盖（批次本地件）。

（本块 = fix 轮 3 交付；原 §2 正文 ∕ 修-1..8 ∕ 补-1..4 ∕ 评审轮 3 修正与本块冲突时以本块为准。）

**轮 2 ∕ 轮 3 文档项交付（#34 · Doc-A · 2026-09-29 · eng-designer——承 §2.5 轮 2 表 · 轮 3 表文档项 + 收正-①..⑥ 覆盖读）**

- 形式 = append 交付块：逐项实读重锚 + 落修；不动 §1 ∕ §3–§6 ∕ 码面 ∕ 提示词面 ∕ 需求档 ∕ `scripts/**`；零新语义（只落既定轮的文档项）。
- 读数（`node scripts/doc-check.mjs` · cwd = 仓根）：**悬空 167**（本批 authored 零新增——逐文件核；00:3x 基线读数 = 171，绝对读数随他批并行漂移）· **行宽 OK**（本批新落 2 行超限已当场折行清零）· 注记豁免 107 · 拟新增 28 · 迁移期引文 229。

**逐项（项 → 改动 file:line 前 ⇒ 后）**：

1. **#195**（`docs/core/design/MANIFEST.md`）：KD-M1-27 = `:249` 判据字面「零 I/O / 零报明（沿用内存值）」⇒「零 I/O / 零报明；**无锚 ∧ 有值（`agent.manifest` 在）⇒ 相位行 + 沿用内存值**；无锚 ∧ 无值 ⇒ 零注入（`false`）」（判实现为准 = `thincoder-core/agent/setup-reminders.mjs:156-160`）；§4 变更记录 = `:640` 新增 2026-09-29 一行。AC-N5（`:532`）∕ T13（`:582`）按收正-③ 已落转核销——零触碰（见发现 1）。
2. **#384**（`docs/core/design/TESTING.md`）：§1.1 = `:27` 新增「脏树零回归判据」行（点名命令 + 实测基线 + 逐字相等——禁绝对绿值冒充）。
3. **#388**（`docs/core/design/DOC-DISCIPLINE.md`）：§1 D4 细则 = `:49-50` 新增「锚形态规范句」（裸 basename 依赖仓根唯一性 ⇒ 锚写自仓根完整路径）；引擎零改（KD-2——`scripts/doc-check-anchors.mjs:166-174` 零触碰）。
4. **#394**（`docs/desktop/design/PROJECT.md`）：§5 = `:514` 新增「依赖镜像纪律」行（`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` + 命令形两条：install ∕ package）。
5. **#400①**（`docs/core/design/ARCHITECTURE.md`）：`:21` 行 3 = 补「核包底线由最低宿主驱动（VSC `engines.vscode` 面 · Node 22.13）⇒ 核内禁用 Node 24 专属 API」+ 同线坐标收正（核包 `:8` ⇒ `:29`；补 `thincoder-vscode/package.json:29`）；② CI = 父侧 §1.12 已落（本舱零触）。
6. **#414**（`docs/core/design/DOC-DISCIPLINE.md`）：§4.2.3 = `:863` 新增「行级形态维持与标记串入账」行（① 行级形态维持 + 成文理由；② 两处标记串核对入账——现盘坐标 = `docs/desktop/design/IPC.md:291` ∕ `docs/desktop/design/PROJECT.md:838`；原引 `:164` ∕ `:342` = as-of 漂移，实读重锚）。
7. **#434**（`docs/desktop/design/E2E-TESTING.md`）：§7-1 = `:202` 补「转档触发（可判形）」句（① #433 基建在位 ∧ ②「跑得慢」实测读数在案——现未触）；权威面句（Electron）在位。
8. **#470**（`docs/RELEASE.md`）：§5.3 = `:113-116` 新增「发布窗两条纪律」（先 bump+publish 核再物化 ∕ 先 `npm install` 再 `npm link` 收敛序）。
9. **#485**（`docs/core/design/SESSION.md`）：§6.22 边界 = `:784` 收正（`readdir` 全条目面 + `stat` 计入 O(N)——本户 1781 条目 ≈60 ms 实测）；§7 = `:960` 标题随 D-SE68 + `:1031` 新增 D-SE68 登记行（消解候选 = 布局收窄 ∥ 阈值复审；F-SL1 判定句零改）。
10. **#404**（`docs/core/design/DOC-DISCIPLINE.md` ∕ `docs/core/design/BATCH-RECORD.md`）：D7 行 = `:22` 增「修正轮落地前置（close 前）」项；`docs/core/design/BATCH-RECORD.md` = `:306` 邻 新增 §5.3（§6 收口要求 + 两前置成文）。
11. **#430**（同上两档）：D7 行 = `:22` 增「搁置清单回核（程序级收口——§10 类逐条核）」项；§5.3 同笔成文（骨架模板加行 = 父侧裁「不加」——零触）。
12. **#431**（`docs/core/design/TESTING.md`）：§3.3 = `:100` 新增「收口走查纪律」行（收口看一张截图 + 程序级回核 = #430 + #433 基建指针）。
13. **#481**（`docs/core/design/SESSION.md`）：§6.11 = `:234` 行模板值域补 `desktop` + `:236-238` 注释收正（**已验**：桌面端走核链——`thincoder-desktop/src/main/turn-face.mjs:91` → 核 `runAgent` → 核 `prepareRun`；核行 `env` 取值 = 核常量 `END`（`cli`）——端名声明 `sessionEnd()` 未参与本行 ⇒ 桌面行值现为 `cli`、设计值域 `desktop` 未达成——缺口登记）。

**发现（报告 —— 非本舱笔面 ∕ 未改）**：

- 发现 1（#195 邻面）：`docs/core/design/MANIFEST.md` §2.6 条 3 表 `:329` 行 ③「`false`（零 I/O——沿用内存值）」与 AC-N5 ∕ T13 结果格「`false`，零注入」——按实现仅覆盖无值格（有值格 = 相位行）；收正-③ 限「只对该残余字面动笔」⇒ 零触、登记待裁。
- 发现 2（#481 实证）：桌面进程内 `sessionEnd()` = `desktop` 而核行仍渲 `cli`（活体读测复现）——跨端身份错写缺口（VSC 同类先例 = `docs/batches/2026-09-15-vsc-core-wiring.md` F4，已由端侧自持行消解；桌面自持行 ∕ 核行参数化 = 码面归后续轮）；提示词面 `cli|vscode` 值域是否加 `desktop` 取决于该缺口落法（内容权 = 主 agent）。
- 发现 3（#414 坐标漂移）：原引 `docs/desktop/design/IPC.md:164` ∕ `docs/desktop/design/PROJECT.md:342` 现盘已漂至 `:291` ∕ `:838`（实读重锚已在项 6 落）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：本批 §2（63 条 → 8 轮全量设计）· 状态 = 设计就绪待评审 · 范围 = 只核本批自有设计（§5 未启）· 抽检方式 = 对 §2 引用的实盘档做定点核对（行数 ∕ 符号 ∕ 落点），非评审对象扩张。

**评审结论**：changes-required（🔴 2 ∕ 🟡 3 ∕ 🔵 3）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Affected-file size（criterion 8） | 🔴 | 2.6（:163-167）仅给 5 个码面档行数、**零 delta 列**（其余约 30 档码 ∕ 测试档无行数）；抽检 5 个注释行数中 3 个与实盘不符：`thincoder-core/session-slots-manifest.mjs` 实读 233 vs「421」（:165——已被 2026-09-28 拆分批外提，见该档头注 :14）、`thincoder-desktop/renderer/styles.css` 实读 499 vs「466」（:166——距 500 硬限仅 1 行）、`thincoder-vscode/src/agent/setup-tooltable.mjs` 实读 333 vs「344」（:143 ∕ :166）；（对照：`mount-settings.mjs` 499 ✓、`session-slot-verify.mjs` 301 ✓） | 按届盘重建受影响文件表：逐档现行数 + 预期 delta（`≤±N` ∕ 结构不变），并据新数重推越层判定 |
| 2 | Affected-file size（拆分预案） | 🔴 | 4 个被本批改动的档越 300 线而未入 2.6 越层清单（:166）：`thincoder-core/agent-tools/batch.mjs`（实读 367；#369 :114 ∕ #422 :120）、`thincoder-core/agent-tools/consult.mjs`（实读 482；#421 :121）、`thincoder-vscode/src/extension/settings.mjs`（实读 410；#378 :75）、`thincoder-cli/src/tui/suspension-drive.mjs`（实读 363；#513 :133 ∕ #448 :159——后两者为行为改动，非纯注释）。函数级抽检（声明行间距估算）未见 300+ 行单函数 | 四档补入越层清单并各给拆分预案 ∕「不拆 + 理由」裁定 |
| 3 | Doc-state ∕ coordination（R5） | 🟡 | §1.2 上抛 2 裁定（:20）已判 #370 ∕ #373 免实施、#378 ∕ #396 余随本批，但 §2.5 仍给四条完整实施行（:75 :115 :116 :128）、§2.9-2（:191）仍求归属——对已清条目存双执行 ∕ 双核销风险 | 四条按 §1.2 裁定对齐（免实施 ∕ 余下清单），§2.9-2 收口 |
| 4 | Doc-state（自陈上抛已决） | 🟡 | §2.9-1（:190）尚请收正 §1.2「57 条」，而 §1.2 已载补条收正（承上抛 1、合 63 条、:19）；§2.1（:32）仍称「§1.2 三族实列 57 条」 | §2.1 ∕ §2.9-1 与 §1.2 现态（63 条）对齐收口 |
| 5 | Clarity ∕ 落点精度 | 🟡 | #441①（:104）落点 `thincoder-core/session.mjs:209` 不可解：该档实读 257 行、全文无 `disk` ∕ `longer` 字样（忽略大小写零命中），:209 = 不可读历史分支的 `return null`；配对点 `session-slot-write.mjs:74`（`diskLonger`）实存 | #441① 重锚 ∕ 重划口径，明确对端 |
| 6 | Doc-state（数值漂移） | 🔵 | 每轮上限两说：状态行「每轮 ≤10 档」（:26）vs 2.4 ∕ 2.10「每轮 ≤15 档」（:45 ∕ :199）；2.3「立刻可做」（:41）含轮 6，同节先小设计又列 #382（轮 6，:127） | 统一上限值；轮 6 条目补 #382 除外 |
| 7 | Scope（#416） | 🔵 | #416 清理面仅 `.thincoder/tmp/core-pkg/`（:144），同族尚存其它核副本（`thincoder/.thincoder/tmp/core-probe/…`、`thincoder-vscode/.thincoder/tmp/core-registry-copy/…`、`thincoder/.thincoder/tmp/cli-pkg/…`） | 引用面 grep ∕ 清理裁量扩至 `.thincoder/tmp/*` 核副本族，或登记其保留理由 |
| 8 | Clarity（落点待定位） | 🔵 | 若干行落点含「实施舱定位」子项且无档 ∕ 节锚（#298 :156 未指名设计档；#396①②、#471、#481 部分子项） | 各行开工前补档 ∕ 节 ∕ file:line 锚 |

**计数**：🔴 2 · 🟡 3 · 🔵 3 = 8

**VERDICT: changes-required**

（旁证：§3 无可写「## 标题」——来源戳由工具打。文档面无 doc map——Document ownership 依 Project Guide 降级核对：本批评改动均落在既有属主档 ∕ 既有邻档外提形，未发现新建档分片。）

### 轮次 2（评审子代理）

**复审轮 2 · 新实例重跑 — 核验（面 = §2「评审轮 1 修正」块 :203-368；12 项 claims = 修-1..修-8 + 补-1..4；盘面抽核 12 档 + 探针）**

**核验结论**：12 ∕ 12 项载荷断言全部落正（零假 claim）——前轮 host 未解析引用 `batch-lifecycle.mjs:68` 已以全路径复核落正（`export function findInFlightBatch(cwd, bases) {`）。残留（均非阻断）如下。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| R1 | 修-8 ∕ §2.6 | §2.6 重建表（:216-312） | 🟡 | 报告修（非阻断） | 修-8 点名族 ∕ 档在表无行：`thincoder-core/advisor/**`（11 档 · glob）· `thincoder-core/tools/**`（24 档）· VSC `panel-*` 族（16 档，含 `panel-callbacks.mjs` ∕ `panel-messages-turn.mjs`）· `docs/vsc/design/VSC-DEBT.md`（#364 ∕ #298 登记位）· `thincoder-core/agent/setup-reminders.mjs` ∕ `thincoder-vscode/src/agent/setup-reminders.mjs`（#481 值域模板面）——无现行数 ∕ delta ∕ 越层判定；原 §2.6「+ 轮 1 ∕ 2 sweep 面各族档」兜底句未承 |
| R2 | 修-2 自洽 | 修正块表行 :266 | 🔵 | 报告修 | `thincoder-cli/src/tui/render-frame.mjs` 行未携「· 越层（修-2 附）」标记（:323 不拆清单已列；同族行均携——:276 等） |
| R3 | 修-3 余下清单 | ENG-TB ∕ WEBVIEW ∕ TOOLS | 🔵 | 开工复核 | `docs/core/design/ENG-TOKEN-BINDING.md:100` ∕ `docs/vsc/design/WEBVIEW-PROTOCOL.md:111` 现盘显已收正（他档 changelog 自载：2026-09-28 ∕ 2026-09-25）；`docs/core/design/TOOLS.md:122` 现读无「镜像」字样——防双执行 |
| R4 | 修-8 #471 清单面 | `docs/batches/2026-09-27-render-core-r1.md` | 🔵 | 报告修 | 「§5.6（`:157`）」与现盘不符（§5.6 两段标题在 `:116` ∕ `:162`；`:157` 无 `5.6` 字样）；主锚 §1.6 备记行（`:51`）已落正 |
| R5 | 修-7 佐证 | `thincoder-core/test/process-probe.test.mjs` | 🔵 | 判读注 | 「命中皆批档历史记载」措辞略窄：码面另见同名词 hits（`:170: before(() => { dir = mkdtempSync(join(tmpdir(), "core-probe-")) })` = tmpdir 前缀，非目录引用 ＋ `.thincoder/tmp/core-probe/…:170` 副本自载）；「零活引用」结论成立——执行轮 grep 判读勿误判 |

**计数**：🔴 0 · 🟡 1 · 🔵 4（均非阻断）

**VERDICT: pass**

### 轮次 3（评审子代理）

**评审对象**：本批 §2 任务书 · 剩余轮重发复核（待跑 = 轮 2 ∕ 3 ∕ 6 ∕ 7 ∕ 8；轮 1 ∕ 4 ∕ 5 已交 · §5 在册）· 对象态 = 已批准 · 触发 = 进程崩溃后设计令牌重签发。范围 = §2 剩余轮可执行性；抽检方式 = 对 §2 引用的实盘档定点核对（存在性 ∕ 行数 ∕ 锚），非评审对象扩张。无 doc map ∕ 无项目标准档声明——Document ownership 依 Project Guide 降级核对（未见新建档分片）。

**核过（非发现）**：43 条待跑条目逐条携面 ∕ 改动形 ∕ 落点 ∕ 验收读法（轮 2=10 ∕ 3=8 ∕ 6=9 ∕ 7=8 ∕ 8=8，与 §2.4 表一致）；每轮 ≤10 与状态行一致（修-6）；笔域（只落 §2）✓。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Requirements ∕ Feasibility ∕ Acceptance（criteria 1/2/5） | 🔴 | 剩余轮十行以上以测试档为落点，而四仓测试树已在盘上消失、验收读法失判别力：轮 6——#425（`:143` `thincoder-desktop/test/views-chat.test.mjs` ∕ `views-activity.test.mjs`）· #506（`:145` `thincoder-desktop/test/integration/chat-render.test.mjs:136`）· #529④⑤⑥（`:149` `thincoder-core/test/core-hygiene.test.mjs` ∕ `process-probe.test.mjs` ∕ `session-ledger-reliability.test.mjs`）；轮 7——#196（`:155` `thincoder-core/test/manifest.test.mjs` ∕ `setup-reminders.test.mjs`）· #450（`:159` `thincoder-desktop/test/host-floor.test.mjs:276-303`）· #364（`:156` 登记源 `model-picker-fallback.test.mjs`）· #510 测试档从句（`:162`）；轮 8——#429 ∕ #448 ∕ #451 ∕ #515（`:172-175`「VSC 测试档 ∕ 行为用例」）。实盘：`thincoder-core/test/` 仅 run.mjs ∕ slow.mjs（run.mjs:41-45 = 空清单守卫「zero tests = green（2026-09-28 全清重置）」）；`thincoder-desktop/test/` ∕ `thincoder-vscode/test/` ∕ `thincoder-cli/test/` 均无 `*.test.mjs`（integration/ 亦空）；全仓 `*.test.mjs` 仅存 `.thincoder/tmp/core-probe/test/` 与 `bench/test/`。制度源 = `docs/batches/2026-09-28-test-layer-prompts.md:112-117`（用户 23:18 全清令 · 五仓测试树全量删除 · runner 空清单守卫）+ `:100-104`（单元 = 批次本地件，住 `docs/batches/`）+ `:120-124`（集成 = 三前端；核仓零集成）。§2.6 验收面（`:181`「四套件（core ∕ cli ∕ vsc ∕ desktop `npm test`）各轮随动全绿」）现恒真（空套件即绿）⇒ 不可判 | 剩余轮测试面按现行制度重划：点名档改批次本地单测形（住 `docs/batches/`，名随批档）或转登记 ∕ 免实施；§2.6 测试面句（`:181`）与逐行读法改「点名可跑命令」形（禁「全绿」式）；重划落定前上述行不宜按原形执行 |
| 2 | Affected-file size（criterion 8） | 🟡 | §2.6 修-1 ∕ 修-2 ∕ 修-8 的桌面行与现盘结构性脱钩：`renderer/styles.css`（修-1 `:296` = 499）**已不在盘**（现为 `theme.css` ∕ `chrome.css` ∕ `skin.css`——§1.1 `:28` 自载 #100「styles.css 四拆」在飞，实已落）；`renderer/mount-settings.mjs`（修-1 `:297` = 499）现读 **≈136**（该档 `:104` 注「出档 `mount-info.mjs`」）；`renderer/core.css`（修-1 `:298` = 345）现读 **429**；`renderer/events.mjs`（修-1 `:293` = 481）现读 **483**；`src/main/agent-host.mjs`（修-1 `:302` = 387）现读 **≈401**；`src/main/ipc.mjs`（修-1 `:303` = 277）现读 **≈297**；`renderer/views/settings-sections.mjs`（修-1 `:299` = 356）已有 `views/settings-agent.mjs` 邻档（#510 子项「agent 段拆」疑已落） | 轮 7 桌面项（#510 · `:162` · 修-8 `:374`）先做「对象存在性」复核（不止行号）：已拆 ∕ 已消失项转核销或只报；仍存项按新数重推拆分线；§2.6 桌面行按届盘重建（先例 = 修-1 形） |
| 3 | Clarity ∕ 双执行（R5） | 🟡 | #195（`:88`）三处坐标与现盘不符且疑部分已落：设计引 `docs/core/design/MANIFEST.md:292`（KD-M1-27）现读 **:249**；`AC-N5` 现读 **:532** 且已含「无锚（`agent.cwd` 缺失）」语义；`T13` 现读 **:582** 亦已含「无锚」；`:636` 变更记录已载「AC-N5 ∕ T13 收正（…KD-M1-27）」；残余（是否仍缺「无锚 ∧ 有值 ⇒ 相位行 + 沿用内存值」句）= unverified | 开工前对三处做「已落 ∕ 未落」二态复核：已落处转核销；只对仍未落的字面（如 KD-M1-27 理由句）动笔 |
| 4 | Coordination（R5） | 🟡 | 桌面树在飞面与剩余轮同片：§1.1 `:28-29` 自载 #100 ∕ #101 在飞（styles.css 四拆 ∕ check-dist 清单待其落定），§2.8（`:199`）又申「不触他批在途面」；轮 6 ∕ 7 桌面项（#425 ∕ #506 ∕ #471 ∕ #510）的「先复核重锚」须扩到在飞面现态 | 桌面项开工先核在飞面现态（#100 产物实体 ∕ #101 收口状态），再定「执行 ∕ 转核销」；与 #2 同轮定形 |
| 5 | Clarity（锚） | 🔵 | #513（`:147`）文档落点写「§6.30.11 补 CLI 句」，而现盘 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:576` = 「### 6.30.11 阶段 2 · 端面接线（桌面 ∕ VSC）」——CLI 非该节既有射程（CLI = 阶段 1，§6.30.5 行） | 落笔前核 CLI 句归属节（§6.30.10 ∕ §6.30.5 或另立子号），避免语义错位挂靠 |
| 6 | Clarity（词汇） | 🔵 | #434（`:95`）触发条件「#433 落地 + 慢实证」——「慢实证」全仓唯一出现即本行（docs 面 grep 零他处），无定义形，与已退役「快层 ∕ 慢层」词汇同族（`docs/batches/2026-09-28-test-layer-prompts.md:53`） | 触发条件改可判形（点名实证对象 ∕ 命令或结论载体） |

**计数**：🔴 1 · 🟡 3 · 🔵 2 = 6

**VERDICT: changes-required**

### 轮次 4（评审子代理）

**评审对象**：本批 §2 任务书 · 修正轮 #17（收正-①..⑥ `:419-499`）+ 残余补扫 #23（残-1..5 `:503-529`）落地后重发复核（待跑 = 轮 2 ∕ 3 ∕ 6 ∕ 7 ∕ 8）。核验 = §3 轮次 3 六发现逐条对现盘实读（测试树 ∕ 桌面树 ∕ MANIFEST ∕ AGENT-LOOP ∕ package.json ∕ 批次档修正块），非对象扩张。

**核验结论**：6 ∕ 6 修复落正（零假 claim）；新增残余 4 条（🟡1 ∕ 🔵3——均非阻断）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | §2 收正-①（`:425-451`）+ #23 块（`:503-529`） | 🔴 | Fixed | 八行重划落正：#425 → 批次本地件 + 点名复跑命令；#506 ∕ #529④⑤⑥ ∕ #196 ∕ #364 ∕ #450 → 免实施 + 登记；#510 测试档从句撤；轮 8 四行 → 批次本地件；§2.6 测试面句两句替换（`:450-451`）。前置实核：`thincoder-core/test/` 仅 run.mjs ∕ slow.mjs（`run.mjs:42-44` 空清单守卫「zero tests = green」）；`thincoder-desktop/test/integration/` 空；全仓 `*.test.mjs` 仅存 `.thincoder/tmp/core-probe/` 与 `bench/test/`；制度源 `docs/batches/2026-09-28-test-layer-prompts.md:112-117` ✓；已执行轮「全绿」10 处零改（记录面实史）= 正确 |
| 2 | 2 | §2 收正-②（`:453-474`） | 🟡 | Fixed（残余 2 行见 N1 ∕ N2） | 抽核 10 行吻合：events **483** ✓ · core.css **431** ✓ · chat-chrome **289** ✓ · mount-settings **136** ✓ · settings-agent **114** ✓ · mount-composer **410** ✓ · store **282** ✓ · agent-host **401** ✓；styles.css ∕ rail.css 不在盘、四拆产物在盘 ✓；轮 7 前置句（对象存在性）在册 ✓ |
| 3 | 3 | §2 收正-③（`:476-481`） | 🟡 | Fixed | `MANIFEST.md:249`（KD-M1-27）✓ ∕ `:532`（AC-N5 含「无锚」）✓ ∕ `:582`（T13 含「无锚」）✓ ∕ `:636`（变更记录载「AC-N5 ∕ T13 收正」）✓；残余（KD-M1-27 理由句未含目标字面）实读确认——二态判读成立 |
| 4 | 4 | §2 收正-④（`:483-488`） | 🟡 | Fixed | 在飞面复核句在册；#100 产物实体在盘（theme ∕ chrome ∕ skin）；「未落定项零并」+ §2.8 维持 |
| 5 | 5 | §2 收正-⑤（`:490-494`） | 🔵 | Fixed | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:556` ∕ `:570` ∕ `:576` 逐处落正（§6.30.10 = 核件 timer 面；§6.30.11 = 端面接线，CLI 不在射程） |
| 6 | 6 | §2 收正-⑥（`:496-499`） | 🔵 | Fixed | 「慢实证」撤；可判引用件落正 = `thincoder-desktop/package.json:20` `"playwright-core": "^1.63.0"` ✓ |
| N1 | (new) | §2 收正-② `:469` 表行 | 🟡 | 新：`thincoder-desktop/src/main/ipc.mjs` 现读 **308**（read 工具总行数；mtime 16:14 早于 as-of ⇒ 非漂移）vs 表行「297 · ≤300 维持」——已越 300 而表内无越层裁定 ∕ 拆分预案；#515 增量 ≤+20 将进一步越线（该档 = 剩余轮将被修改档） | 届盘对读收正该行 + 补越层裁定（登记 ∕ 预案之一） |
| N2 | (new) | §2 收正-② `:465` 表行 | 🔵 | 新：`renderer/views/settings-sections.mjs` 现读 **267** vs 表行「264」（差 3；mtime 16:14 ⇒ 非漂移） | 随 N1 同笔收正读数 |
| N3 | (new) | §2 `:423` 覆盖行位行 | 🔵 | 新：覆盖行位全族较现盘 −10（测试面句标 `:186` 现读 `:196`；#195 标 `:93` 现读 `:103`；修-1 桌面表标 `:298–:310` 现读 `:308–:320`）——条号键仍可定位，无执行阻 | 随修正一并校准（或标 as-of 口径） |
| N4 | (new) | §2.6 修-1 测试族表行（`:325-341`） | 🔵 | 新（#23 已披露 · 供审）：仍列已删测试档（如 `:326` core-hygiene.test.mjs「225」——档已不在盘）= 哑指针；随届盘重排 ∕ #456 面收正 | 勿留哑指针；非阻断 |

**计数**：🔴 0 · 🟡 1 · 🔵 3 = 4（另 §3 轮次 3 六项全 fixed）

**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 21:2x）
- **三条件齐备**：① 设计评审 **pass**（§3 轮次 2——12 ∕ 12 项核过，残留 🟡1 ∕ 🔵4 均非阻断）；② 修正轮落地并核验（§2 修正块 + §3 轮次 2 逐号复核在册）；③ 凭据已签发（**值为运行态、不落档**）。
- 授权 = 用户 21:13「继续做吧」（承 21:1x 所摆处置项）。
- **残留裁定**：R1（§2.6 族行缺口）⇒ 执行轮按届盘复扫携带，不另修；R2 ∕ R4（文档小形态）⇒ 随触面 ∕ 批末文档同步收正；R3 ∕ R5（防双执行 ∕ grep 判读）⇒ 执行轮判读纪律（在册）。均非 must-fix。
- **实施序**：§2.3 分层执行——轮 4 ∕ 轮 5（码面）与轮 1（文档 sweep）即起；轮 2 ∕ 3 ∕ 6–8 随派（先小设计项按轮定形）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（轮 7（拆档 ∕ 尺寸 ∕ 工具清理 · 8 条）——审计 1 轮 clean ∕ 代码评审 1 轮 pass（🔴0）；批次本地件 9 ∕ 9 绿；终态 clean）



### 5.1 实施摘要（轮 4 · 核 ∕ 会话码面 · 5 条 · initial 轮 · 2026-09-28 · eng-coder）

**逐条落点（皆终稿实读）**

| 条 | 改动 | 落点 |
|---|---|---|
| #351 | 端档零判据副本、改引核单源 | `thincoder-vscode/src/extension/peer-claims.mjs:31`（`import { covers, pathsOverlap } from "@thincoder/core/peer-claims.mjs"`）· `:109`（`export const claimsOverlap = pathsOverlap`）· `:123/:126`（直调核 `covers`）；本地 `normPath` ∕ `coversClaim` ∕ `claimsOverlap` 实现全删（含 `covers`/`normPath` 同族一并单源化——「端档零判据副本」验收读法）；`peer-domains.mjs` re-export 名面不动 |
| #386 | 复核结论 = **成立（结构性缺陷）** ⇒ 修：缓存按槽文件路径失效 | `thincoder-core/session-guard.mjs:47`（命中判据携 `hit.p === p`）· `:62/:66`（写入 `{p, mtimeMs}`）；同形三处 `session.mjs:179` · `token-ttl.mjs:284`；多槽用例 `test/session-guard.test.mjs`（G-1 换槽误命中面 + G-2 命中正控） |
| #441① | `diskLonger` 盘面侧同滤（对齐读槽回放口径） | `thincoder-core/session-slot-write.mjs:78`（`disk.history.filter((m) => !isLegacyTransient(m)).length > data.history.length`）；用例 = `test/session-slot-write.test.mjs`「轮转判据④口径对齐」（既存真并发追加例仍守） |
| #441② | 核档明文（核侧不校值域 = 有意）+ 端侧拒例核验 | 明文 = `session-slot-write.mjs:219-224`；端侧拒例在盘 = `thincoder-desktop/src/main/agent-host.mjs:76-86`（`prefsPatchFailure`）+ `:303` 消费；机检读数（探针 `.thincoder/tmp/r4-prefs-probe.mjs`）：`{provider:null}` ∕ `{model:null}` ∕ `{model:""}` ⇒ `invalid-patch`；`{effort:null}` 过 patch 门（⇒ 仅 effort 允许 null）。IPC 契约面 `docs/desktop/design/IPC.md:93` 已在册（无需改档） |
| #441③ | token 最小记录补 `effort` 键（键齐） | `thincoder-core/token-ttl.mjs:263`（`effort: agent._slotEffort ?? null`——与 `newSlotData` 规范结构 ∕ `saveSession` 携带面同源）；用例 = `test/token-ttl.test.mjs`「persistEngTokens 最小记录」 |
| #441④ | 脏载链抛点收敛 | `thincoder-core/session-lifecycle.mjs:179`（非串 model 不重算阈值；`resolveCompactThreshold → providerSpec → specForModel` 链 `.toLowerCase` 抛点拦断）；用例 = `test/session-reading.test.mjs` R4（含串 model 正控） |
| #499 | EOF 尾段冲洗（循环后 ∕ `result` 前） | `thincoder-core/session-slot-verify.mjs:140`（`scan.feed(dec.decode())`）；用例 = `test/session-ledger-reliability.test.mjs` L3-10（残缺三字节尾 ⇒ 门不过 + 完整多字节尾正控 + 负缓存零重读） |
| #503 | 摘要 `ts` 地板（签名 + 写后取 mtime） | 打点单源 `session-slots-manifest.mjs:74`（`digestTs`）；`slotDigest(data, mtimeMs)` `:61`；`digestFromStore(fields, counters, mtimeMs)` `session.mjs:88/100`；调用点六面齐：`session.mjs:176-186` · `session-slot-write.mjs:112-116` · `token-ttl.mjs:279-290` · `session-rename.mjs:34-38` · `session-lifecycle.mjs:256-257` · `healDigest` `session-slots-manifest.mjs:92`；用例 = `test/session-end-param.test.mjs` T13（①单元地板 + 缺省裸墙钟 ②两保存面 `ts ≥ mtime` ∧ `needsVerify` 零误判 ③healDigest 未来 mtime 补写带地板） |

**表外 ∕ 同族随动（披露）**：①#503 六调用点中四档在表外（session-rename ∕ session-lifecycle ∕ session-slot-write ∕ token-ttl——mtime 均写后在手；不随动则「保存面摘要」债面半修）；②`thincoder-vscode/src/extension/session-io.mjs:150` 端侧调用点**未随动**（VSC 树零改约束）——端侧同族残余登记（有界自纠）；③`test/core-hygiene.test.mjs` 两档越线登记（session-slot-verify.mjs **304** ∕ test/session-ledger-reliability.test.mjs **315**——设计预裁「补例走登记路」）。

**测试面**：新增 1 档（`test/session-guard.test.mjs`，73 行）+ 6 档随动（session-slot-write ∕ session-reading ∕ token-ttl ∕ session-end-param ∕ session-ledger-reliability ∕ core-hygiene）。

### 5.2 决策透明表

| 项 | 决策 | 依据 |
|---|---|---|
| #386 判「成立」并修（非维持） | 缓存正确性依赖「换槽即清缓存」隐式约定；现役 ACP `session/delete`（`handlers-slots.mjs:190`）直钉新槽不满足 ⇒ 按槽失效（路径键） | 设计预授权「成立则键扩槽维」；修后单调更保守（多解析、零漏轮转 ∕ 零漏 createdBy 透传） |
| #441① 修在盘侧（非快照侧） | 快照 data 源自 `loadSlotFile`（已滤 legacy transient）；盘侧为 raw ⇒ 对齐 = 盘侧同滤 | 修-5 重锚「写面守卫 ∕ 读槽回放过滤」两读并核 |
| #503 调用点扩至同族保存面（表外四档） | 六面齐动（只核侧；VSC 零改约束内） | KD-7「保存面写后取 mtime」；否则债面半修 |
| #441② 零行为改（只明文 + 核验） | 核侧不校值域 = 设计有意（读侧容忍）；端侧已拒（机检读数在案） | 收口轮裁 |
| #351 同族去副本（`covers`/`normPath` 一并单源） | 验收读法 =「端档零判据副本」；两谓词本归口核 `peer-claims.mjs` | D-MI24（无端差纯函数共享）；机检 = VSC 全树零 `normPath`/`coversClaim` |
| #499 用例落 ledger-reliability 档（越线登记） | 就近惯例（§6.25 核实面同档同夹具） | 设计「补例走登记路，勿强拆」 |

### 5.3 审计与代码评审轮次与终态

- **内部分歧审计**（explore · 只读）：1 轮——8/8 条次「完全实现」；四类偏差（部分实现 ∕ 静默简化 ∕ 未披露表外改动 ∕ 测试档与声明不符）**零**；表外改动集合与披露一致；测试档非空转核过（含正控在盘）。
- **顾问代码评审**（type=code）：轮 1 **pass**（0🔴 · 🟡2 ∕ 🔵2，均非 must-fix）；轮 2（修复核验 · 窄面）**pass**——🔵4（G-1 缺命中正控）修毕并实核（两侧可判：同路径 ∧ 同 mtime ⇒ 零解析早退；mtime 前进 ⇒ 重解析照转）。
- **fix round**：自修 1 轮（顾问 🔵4 → 新增 G-2 + 档头手法句随动）；未超 5 轮上限。
- **终态**：**clean**（轮 2 pass 后仅档头注释随动——事实性补全、行为零改，核心套件复跑核讫）。
- **残留（待父侧处置 · 非本舱写作域）**：①`docs/core/design/SESSION.md:752/:753/:1073` 仍述「两产者裸墙钟 = 同族残余（在册另轮）」——#503 已闭合（核侧六调用点带地板），坐标 `:52`/`:95` 亦漂 ⇒ 设计面收正；②`docs/core/design/MULTI-INSTANCE-COLLAB.md:177` 端谓词坐标 `:119`（实读 `:109`）+ 措辞仍读作端自持判据 ⇒ 随轮收正；③`thincoder-vscode/src/extension/session-io.mjs:150` 端侧无地板（同族残余，VSC 轮随动）；④`thincoder-core/test/batch.test.mjs`（他轮在飞档）542 行 > 500 硬限 ⇒ 卫生闸现红（非本舱）。

### 5.4 机检读数（亲跑）

| 套件 | 读数 | 备注 |
|---|---|---|
| core | **810/810 绿**（本舱全量落地态 · `.thincoder/tmp/r4-core-3.log`）；末次复跑 812/813——唯一红 = 卫生闸对 `test/batch.test.mjs`（**542 行 > 500 硬限** · 他轮在飞 · mtime 21:54 本舱零触） | 本舱 16 档均在限内（>300 者皆在册） |
| cli | 绿（`.thincoder/tmp/r4-cli.log`） | |
| vsc | 绿（`.thincoder/tmp/r4-vsc.log`） | 含 `engine-floor-guard` 静态闭包契约②（新增 core `peer-claims.mjs` 依 import 图核：仅增两已入闭包传递依赖、零 node:sqlite 可达） |
| desktop | **红（在飞面所致 · 非本舱）** | 失败形 = 端内模块解析 ∕ 导出不符（`renderer/views/info-row.mjs` 缺档 ∕ `mount-settings` 无 `INFO_SLOT` ∕ `store.mjs` 无 `cancelCloseTab`）+ Electron 冒烟超时；证据 = 他执行面 21:40 `r8-desktop-suite-4.log` 同集合 31 红 ∕ 21:26 `r8-desktop-suite-3.log` 276/276 绿；桌面核消费面（session-contract ∕ agent-host ∕ session-prefs）本次绿 |

`git status` 自证：本舱落笔 = 9 源档（8 core + 1 VSC）+ 7 core 测试档 + 1 探针（`.thincoder/tmp/r4-prefs-probe.mjs` · 非交付物）；桌面树 ∕ 文档树零触。

### 轮 5 · 实施记录（core ∕ cli 码 ∕ 测试 · 10 条 · initial 轮 · 2026-09-28 · eng-coder）

**逐条落点（皆终稿实读）**

| 条 | 改动 | 落点 |
|---|---|---|
| #361 | INLINE 正则扩 `source\|dest`（AC-2/AC-3 常驻化） | `thincoder-core/test/touch-paths.test.mjs:115`（`/\[\s*args\??\.(?:path\|source\|dest)\b/`——宽松收尾命中历史违例形 `[args?.source, args?.dest]`；`\b` 挡 `paths`/`sources` 前缀）；档头 + 扫描区横幅收正 |
| #363① | ACP thinking 开关引核单源 | `thincoder-cli/src/acp/handlers-session.mjs:22/:95-99`（off ⇒ `thinkOffShape(spec)`；off 清 `reasoningEffort`——载荷门前提；on 侧引 `spec.thinkEnabledValue`）；用例 `thincoder-cli/test/acp-contract.test.mjs:464-489` |
| #363② | 顶栏徽标 off 判据引核 | `thincoder-cli/src/tui/render-frame.mjs:13-14/:57-58`（off ⇔ `thinkOffPath(spec)` ∧ 现形 = `thinkOffShape(spec).type`；thinkAlwaysOn 族残留标记不再误报） |
| #363③ | 标题链禁思考形引核（三格式支） | `thincoder-core/generate-title.mjs:17-18/:41-42/:56/:67/:84`（`thinkOffPath` 门 + `thinkOffShape` 取形；无有效 off 路径 ∕ effort 族 ⇒ 零发）；用例 `thincoder-core/test/provider-merge.test.mjs:168-197`（effort/alwaysOn 零发 + type 族正控 + google 支；既有三格式断言零改） |
| #369 | `findInFlightBatch` 递归扫描（KD-4） | `thincoder-core/agent-tools/batch-lifecycle.mjs:62-71`（`collectMarkdownFiles`——只认真目录、symlink 不入）+ `:82-99`；用例 `thincoder-core/test/batch-lifecycle-gates.test.mjs:108-127`（仅嵌套 ⇒ 命中 ∕ 混合 ⇒ 复数拒并列候选 ∕ 拒面零写）；② 别名撤除条件维持（触发 = BATCH-RECORD §4.14 输出转空——`batch.mjs:20-21/:327-331` 在册，本轮未触发） |
| #370 ∕ #373 | 免实施核验（零触碰） | `thincoder-cli/test/doc-check.test.mjs:5`（T-DC-18/19 指针）/`:73`（左界守卫横幅）· `thincoder-cli/test/advisor-chain-guards.test.mjs:5`（三引可解析：`docs/core/design/ADVISOR-GUARDS.md` 实存）——两档行数与设计 as-of 逐字吻合（340 ∕ 488 内容行）⇒ 零触碰 |
| #402 | 两处测试鲁棒性 | `thincoder-desktop/test/host-floor.test.mjs:29-33`（`stripComments` 扩行尾注释剥除——`[^:]` 守 `://`）· `:84-85`（U4 空行切片兜底：无空行退 20 行窗）；⚠「档绿」现态不可证（见披露） |
| #417 | 撞帽载荷「本段零落盘轮数」 | `thincoder-core/agent-tools/checkpoint.mjs:24-30/:85`（traceText 第三元——缺 `_zeroWriteTurns` 的执行面不渲染）· `thincoder-core/agent.mjs:149/:220/:235/:450`（段起点复位 + 回合环采集：轮顶结上一轮 + 撞帽收尾轮环外单结；只报数——零阈值 ∕ 零自动动作）；用例 `thincoder-core/test/turn-cap-checkpoint.test.mjs:158-159/:173/:363-383` |
| #421 | 陈旧评论改写 | `thincoder-core/agent-tools/consult.mjs:307-312`（F8 实况 = 父代理检查点；旧「同 y/n 面板」句已除；与 `:325-330` 同义） |
| #422 | 三规则 | ① close 前 §6 非空闸 `batch-lifecycle.mjs:177-186/:190-192/:322-323`；② 拒句补「失败 ⇒ 勿 close」`batch.mjs:198/:207` + `batch-lifecycle.mjs:202`；③ 无状态行档自建机读位 `batch-lifecycle.mjs:319-321` + `batch-skeleton.mjs:136-144`（`sectionHasStatusLine`——「有行不可解析」仍 fail-closed）；用例三规则 + 正控/负控 `test/batch-lifecycle-gates.test.mjs:62-104` |
| #439 | 两覆盖腿 | ① 键面腿 `thincoder-cli/test/entry-diagnostics-keys.test.mjs`（沙箱 config + 假 HOME 真 spawn + `--import` 探针：`heapWatch:false` ⇒ setInterval 0 ∕ 缺省 ⇒ 1；+ 两键「读键 → 形参」结构腿）；② 缺省形真 spawn 腿 `thincoder-cli/test/tui-stderr-capture.test.mjs:100-110`（零参 ⇒ 包装触发 + 子 stderr tee + 同码 1——崩溃旗标占命令位不可共存，档内 `:97-99` 在册） |

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| 1 | #422② 拒句面 = 「状态行不可解析」线与骨架保护线；「已收口」线不加 | 「已收口」态 close 本不可行——「失败 ⇒ 勿 close」在该态无语义；两线为「append 被拒而档仍可 close」的实际风险面（事故原句 = 骨架保护） |
| 2 | #422③ 自建机读位（非拒句给路径） | 行文首择「可自建」；「有行不可解析」维持 fail-closed（防误冻结）——两态可分辨 |
| 3 | #363③ effort 族零发（不补 `reasoning_effort:"none"`） | 本档无载荷门（`null` 形是核门约定）；补发会复制门的五 guard ⇒ 违「零副本」；评审判不偏离 |
| 4 | #417 计数口径 = `_touchedFiles` 去重集长度增量 | 设计落点「与 `_turnSeq` 同源面」的最近可得信号；仅报数（零阈值）⇒ 口径精度列为顾问 advisory 在册（同档重写 ∕ 续段重触不计写） |
| 5 | #417 端侧（VSC 自有回合环）未随动 | 设计落点 = core-only；缺省不渲染——不冒充 0 |
| 6 | #402 只改两处（含 U4 切片兜底） | 行文两处逐处收正；缺口档 import（info-row.mjs）属他批在飞面——零触 |

**审计与代码评审轮次与终态**

| 轮 | 类型 | 对象 | 结论 | 处置 |
|---|---|---|---|---|
| 1 | 内部 explore 发散审计（只读） | §2.5 轮 5 表 + 修正块 ↔ 19 档实改 | 无 🔴；低严重度 4（行数预算超差 ×3 + 登记自述 ±1） | 收 1（core-hygiene 登记读数收正）；余如实登记 |
| 2 | advisor 代码评审 · 轮 1 | 同（19 档） | **pass**（0🔴 / 2🟡 / 4🔵） | 🟡① = desktop 协调项（他批在飞，非本舱）· 🟡② = #417 口径 advisory（非 must-fix）；🔵 = 读数漂移 ∕ 脆弱判据 ∕ 交付形与设计字面差异登记 |

**终态 = clean**：0 🔴 / 0 must-fix；修正轮 = 0。

**机检读数（亲跑 · 收口时点）**

| 套件 | 读数 | 备注 |
|---|---|---|
| core | **813/813 绿** | 含新档 `batch-lifecycle-gates.test.mjs`（2 例）与卫生登记收正 |
| cli | **893/893 绿** | 含 #363① 用例 + #439 两腿 |
| vsc | **1052/1052 绿** | |
| desktop | **230/256（26 红 + 档级 1）＝ 红（他批在飞面 · 非本舱）** | 失败形 = 端内模块解析（`renderer/views/{sessions,info-row}.mjs` 已删而消费点未随迁）+ 迁移面断言；桌面核消费面（agent-host* ∕ queued-input ∕ timer-wake 等）本次绿 |

`node scripts/doc-check.mjs` ⇒ **悬空 56 · 行宽 0**（本舱零 .md 改动——与 B 批收口同数）。
`git status` 自证：本舱落笔 = 9 源档（core 7 + cli 2）+ 9 测试档（core 6 含 2 新档 + cli 2 含 1 新档 + desktop 1）+ 3 探针（`.thincoder/tmp/{exp-default-form,exp-keys,probe-close422}.mjs`——非交付物）；文档树零触。

**越声明 ∕ 表外披露**：
- 新档两枚（表外）：`thincoder-core/test/batch-lifecycle-gates.test.mjs`（#422/#369 用例组——`batch.test.mjs` 542 行越 500 硬限，按拆分位拆出，先例 = batch-placeholder-gate）· `thincoder-cli/test/entry-diagnostics-keys.test.mjs`（#439①）。
- `thincoder-core/test/core-hygiene.test.mjs` 登记表随动：`agent-tools/batch-lifecycle.mjs` 293 → **329**（净 +36）越 300 ⇒ 新增登记 + 拆分预案（在飞扫描族外提 `batch-scan.mjs`）；`test/batch.test.mjs` 拆分后 477（≤500 在册）。
- 设计估值超差（如实登记）：`batch-lifecycle.mjs` ≤+30 实 +36 · `generate-title.mjs` ≤+10 实 +16 · `batch-skeleton.mjs` ≤+5 实 +18（#422③ 的 `sectionHasStatusLine` 出口未预列——设计表缺口）。
- #402「档绿」不可证：该档 `:19` 引 `renderer/views/info-row.mjs`（他批在飞迁移已删）⇒ 装载期失败；本轮两处编辑以等价复算验证（main.mjs 锚点 ∕ 分支窗断言全真）。

**勘误（同轮补记 · 2026-09-28）**：上文「`git status` 自证」行测试档计数笔误——实为 **10** 档（core 6 含新档 `batch-lifecycle-gates.test.mjs` + cli 3 含新档 `entry-diagnostics-keys.test.mjs` + desktop 1）；源档 9 档（core 7 + cli 2）无误。同句「3 探针」已随收尾清理（`delete` 三档 × 不再留档）——非交付物，不碍自证。

**轮 6 实施记录（桌面 ∕ VSC ∕ 文本 · 9 条 · eng-coder · 2026-09-29 · #31）**

**交付摘要（逐条 → file:line）**

- `#382`（槽单写）：`thincoder-cli/src/tui/cmd-advisor.mjs:21-49` —— `persistGuard` 去 config 镜像写（仅槽写）；`persist()` 写面剥 `guard`（:28-31 `delete scoped.guard`），盘上旧值原样保留（回退面不动）。
- `#396①`：`thincoder-desktop/src/main/host-floor.mjs:2` —— 引「批档 §2.6 D-2」补齐记录点名（`docs/batches/2026-09-25-desktop-impl-1.md`）；实读核：impl-1 §2.6 D-2（:190）在位、:4 同族引可解析。
- `#396②`：`thincoder-desktop/renderer/dom.mjs:4` —— 「E-6」补「批 1」限定词；三处靶中两处（`test/guard-closure.test.mjs:2` ∕ `test/host-floor.test.mjs:2`）随全清令删档 ⇒ 对象不存在（随靶消失，供 §6 一行）。
- `#396③`：`thincoder-desktop/renderer/views/chat-tool.mjs:13`（「闭枚举 8 词中本表七键」）· `thincoder-desktop/renderer/events.mjs:304`（「7 ⇒ 8 词」）——与单源 `docs/desktop/design/UI.md` §1 口径统一。
- `#425`：批次本地件（`.thincoder/tmp/2026-09-28-tech-debt-closeout-r6.test.mjs`——父侧 copy 至 `docs/batches/`）：两面零增臂（chat ∕ activity）+ 反证臂。
- `#502`：`thincoder-vscode/AGENTS.md:95` —— `sessions` 行增 `ledger?`（`{ refused, reason, scene }`、异常才携），与 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §2 同拍。
- `#506`：免实施 + 登记句（见下「登记」第 1 行）。
- `#512`：`thincoder-desktop/renderer/views/chat-chrome.mjs:196` —— 补写者 `fresh._ledgerLines = lines`（实现既有同引用零写意图；否决删检）+ 两用例。
- `#513`：`thincoder-cli/src/tui/suspension-drive.mjs:301-315` —— 窗内 timer 支 try/catch 容纳（`AbortError ∧ 会话未停 ⇒ continue`；否则上抛）+ 两用例；§6.30.10 邻位补 CLI 句 = 设计面收正行（见下「上抛」第 3 行，Doc-B 承接）。
- `#514`：`thincoder-cli/README.md:152` —— `timerWake` 全端口径（支持面 = CLI / VSC / 桌面前台；headless chat / ACP 仅边界投递）。
- `#529③`：`thincoder-cli/AGENTS.md:51-53` ∕ `:56` —— 模块图补 `src/command-table.mjs` ∕ `src/command-interactive.mjs`（bin 行改写 + `src/cli/` 分发 import 改指）。
- `#529⑦`：`thincoder-vscode/src/agent/execute-tools.mjs` —— 十处注释指位收正（`agent/dispatch.mjs:151/207` ∕ `agent/dispatch-run.mjs:30-31 ∕ :93 ∕ :139 ∕ :153` ∕ `agent-tools/advisor.mjs:112` ∕ `agent-tools/subagent-spawn.mjs:304 ∕ :318 ∕ :308` ∕ `agent-tools/subagent-async.mjs:407`）。
- `#529①②④⑤⑥`：免实施 + 登记（①② 文档面 = Doc-B；④⑤⑥ 三靶档随全清令删档）。
- `#378 转来`：四处逐读——`thincoder-vscode/AGENTS.md:86` ∕ `src/extension/settings.mjs:181` ∕ `src/extension/panel-session-write.mjs:92` 四处措辞已净（前两处+AGENTS 由父侧 19:5x 清零改；`webview/mode-buttons.js` 经在跑舱落地改写为核化档头——worktree 实读旧「mirror config.json」句已替换）⇒ 本轮零改。

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | `#382` 除 `persistGuard` 外并收 `persist()` 写面剥 guard（一步超出设计点名行 :33） | 单点闭合「guard 不入 config 写面」；VSC 先例 = `settings-panel-write.mjs:141-143`「`guard` is NOT a payload field on this face」；盘上旧值保留 = KD-3 回退面不动（随轮报告） |
| 2 | `#396①` 收正形 = 记录点名（保留 §2.6 字面） | 三记录对读：impl-1 §2.6 D-2 在位（:190）、§2.7 = 边界；host-node24 §2.7 D-2 = 另一判据；impl-2 §2.6 D-2 ⇒「D-2 现居 §2.7」于目标记录不复现 ⇒ 以「引用可解析化」为收正（改判随轮报告） |
| 3 | `#425` 取「机检臂」态（备选人工走查不取） | 判据对象 = 纯构树（`RENDERER.md:59`「纯构树零 DOM ⇒ 平 node 直测」）⇒ node 直测可行，非「不可行 ⇒ 登记」支 |
| 4 | `#513` 窗内 timer 支只落容纳句；`timerWake` 门疑点零改 | 防未授权语义扩面——阶段 1 设计字面「关 ⇒ 不武装闩」只述闩面，阶段 2 句「关 ⇒ `deadline()` 恒 null」在端面 ⇒ 二择一收口归设计措辞面（见「上抛」第 4 行） |

**上抛 ∕ 登记（随轮报告）**

1. `#506` 登记句：「桌面集成面按新制度重建时，`waitForFunction` ∕ 重试语义作为断言书写纪律随新建面落地——本批零改」。
2. `#529①②（文档面）` ⇒ Doc-B（`CLI-DEBT.md:35` A4 行刷新 + 移 §4；`CLI-ENTRY.md` 描述句）；`#529④⑤⑥` ∕ `#396②` 随靶消失登记（三+二档随全清令删档——对象不存在）。
3. `#513` 二半：`AGENT-LOOP-ASYNC-POOL.md` §6.30.10 邻位补 CLI 句（收正-⑤ 改锚）——建议句形「同句适用 CLI 窗内 timer 支（镜像落点 = `thincoder-cli/src/tui/suspension-drive.mjs:301-315`）」；落笔 = Doc-B。
4. 疑点（advisor 🟡-2）：窗内 deadline 未过 `timerWakeEnabled`（`suspension-drive.mjs:298`）∥ 闩面过（`timer-watch.mjs:67`）—— `agent.timerWake: false` 时挂起窗仍开 timer 轮；二择一（包判据 ∥ 设计明示只关闩面）归设计措辞面，本舱零改。
5. 表外连带收正（已披露）：`host-floor.mjs:39` 注释「自检调用面」与 `main.mjs` 分调实况不符（台账 #396 同档注释族）⇒ 注释收正为实况（`engineFloorMet` 导出零消费者）。
6. 范围外残余（只报）：VSC 同族注释旧行位 `src/agent/setup.mjs:236` ∕ `src/extension/panel-callbacks.mjs:205 ∕ :265 ∕ :272` ∕ `panel-subagent-relay.mjs:36`（未在本轮射程）。

**审计与代码评审轮次与终态**：内部背离审计（explore · 只读）1 轮 = **clean**（0 🔴 / 0 🟡 · 4 🔵 注记，其中 2 条已随本记录处置）；advisor 代码评审（type=code）1 轮 = **pass**（🔴0 ∕ 🟡2 ∕ 🔵6——🟡-1 `host-floor.mjs:39` 现场收正、🟡-2 转「上抛」第 4 行；🔵 各项按接受/登记入本记录与交付报告）；fix round = 1（注释收正，零语义）。**终态 = clean**。

**读数**：批次本地件点名复跑 `node --test .thincoder/tmp/2026-09-28-tech-debt-closeout-r6.test.mjs`（仓根）＝ **8 ∕ 8 pass**；全触碰 `.mjs` 档 `node --check` 全绿。**not repo-suite verified — the parent-side closeout run is the only repo-suite run.**

**披露**：① 测试件暂存于 `.thincoder/tmp/`，待父侧 copy 至 `docs/batches/`（写门实测拒——台账 #545）；② 本舱零触设计档 ∕ 需求档 ∕ 其他批档（`thincoder-core/**` 只读）；③ `#382` 的 `persist()` 剥 guard 为同口径收的连带面（决策透明表第 1 行）。

### 轮 7 · 实施记录（拆档 ∕ 尺寸 ∕ 工具清理 · 8 条 · eng-coder #32 · 2026-09-29 · initial 轮）

**逐条落点（条 → 处置 → file:line · 终稿实读）**

| 条 | 处置 | 落点 / 证据 |
|---|---|---|
| #196 | 免实施 + 登记（报告列 · 零码） | 两夹具靶档（`thincoder-core/test/manifest.test.mjs` ∕ `setup-reminders.test.mjs`）随全清令删除 ⇒ 对象不存在；登记句 =「夹具隔离（家目录建档态不翻面）随新单元面重建时自查——本批零改」；`thincoder-core/**` 零触 |
| #364 | 免实施 + 登记（报告列 · 零码） | 裁定对象 `thincoder-vscode/test/model-picker-fallback.test.mjs` 已删 ⇒ `docs/vsc/design/VSC-DEBT.md` §12.1 不再补登（登记项随对象作废） |
| #365 | **落：拆档** | 新档 `thincoder-vscode/src/agent/tool-table.mjs`（**250** 内容行）+ `setup-tooltable.mjs` **333 → 102**；缝 = re-export（`:102` `export { buildToolTable, modeRoleField, vscSubagentFace, withPool } from "./tool-table.mjs"`）；搬移核：原档 `:103-333`（231 行）逐字同（仅 buildToolTable 档头注 2 行级差异 = 1 行改写 + 1 行补注）；静态边集合两档并集 = 原档 11 边（W8 契约②不破）；五条动态 import 原样；`thincoder-vscode/AGENTS.md:43` 模块图随动（表外披露） |
| #416 | 父侧自理 | 零触（父侧 §1.12 已落） |
| #450 | 免实施 + 登记（报告列 · 零码） | 靶档 `thincoder-desktop/test/host-floor.test.mjs` 已删 ⇒ 例外面口径核对对象不存在 |
| #456 | 父侧自理 | 零触（父侧 §1.13 转出 #546） |
| #471 | **落：产品码 ③④⑤⑥**（①② = 父侧成文维持） | ③ `thincoder-desktop/src/main/protocol.mjs:59` 门①′ URL 形收紧（`hasDotSegment` 拒 `.` ∕ `..` 段）；④ `:58` 门①判据改**段界**（`isEscape` —— `..foo` 类不误拒）；⑤ `:53` 门⓪ host 校验；⑥ `thincoder-desktop/src/main/window.mjs:46` `NEGATIVE_PROBE_COUNT` 派生自 `PROBES`（表实读 6）+ `src/main/main.mjs:120` 消费（旧手抄 `>= 5` 撤） |
| #510 | **落：桌面留守拆档**（三档续拆 + 已在盘项转核销） | ① `renderer/events.mjs` **482 → 246** + 新档 `events-blocks.mjs` **135** ∕ `events-slices.mjs` **130**；② `renderer/mount-composer.mjs` **409 → 237** + 新档 `composer-sync.mjs` **210**；③ `renderer/core.css` **463 → 281** + 新档 `core-markdown.css` **191**（链序 `renderer/index.html:18-19` —— 表外披露）；**转核销** = `styles.css` 四拆产物（`theme.css` 89 ∕ `chrome.css` 444 ∕ `skin.css` 13，`styles.css` ∕ `rail.css` 不在盘）· `mount-settings.mjs` 151（+ `mount-info.mjs` 40）· `views/settings-sections.mjs` 223（+ `settings-agent.mjs` 120）· `src/main/agent-host.mjs` 249（+ `turn-driver.mjs` 213）；`store.mjs` 298 ≤300 出拆名单；测试档越层 8 档随全清令撤；U95 随动撤（靶已删）；§4.1 随动 = 设计面收正行（Doc-B #35 ∕ 专轮 #551） |

**搬移逐字性证据**：events 三档 —— 18 个搬移区段对 git HEAD 逐字连续核 **18 ∕ 18** 吻合（`export ` 前缀外零差异）；本体用「HEAD + 本轮删除集 + 替换集」机械重演 **EXACT**。core.css —— 183 行区段逐字 **EXACT**，本体机械重演 **EXACT**（面 1–17 出档；面 20 覆盖对同选择器「后落者胜」序保持）。VSC —— 231 行区段逐字（2 行档头注差异如上）。`mount-composer.mjs` 改前 ≠ git HEAD（含他批未提交改动）⇒ 字节级重演不适用，以「迁出面 ∕ 留存面互补核 + 双向接线逐点核 + 批测行为」替代（如实披露：该档字节级未证）。

**行为保护（批次本地件）**：`.thincoder/tmp/2026-09-28-tech-debt-closeout-r7.test.mjs`（9 例 · 待父侧 copy 至 `docs/batches/`）——覆盖：尺寸闸（9 档 ≤300）· CSS 链序 · events 归约三径 ∕ 键门 ∕ 中止扇扫 ∕ 读数与切片 · composer-sync 工厂行为 + attachComposer 装配冒烟 · protocol 四门（含 ④ `..foo` 段界反证 ∕ 门归属行）· 探针表全向量实驱 + `blocked ≥ NEGATIVE_PROBE_COUNT` · `probesSatisfied` 三向。
**亲跑（仓根）**：`node --import ./thincoder-desktop/test/rc-resolve.mjs --test ./.thincoder/tmp/2026-09-28-tech-debt-closeout-r7.test.mjs` ⇒ **9 ∕ 9 pass · 0 fail · exit 0**。`node --check`：触碰 11 档全绿。
**not repo-suite verified — the parent-side closeout run is the only repo-suite run.**

**决策透明表**

| # | 决策 | 依据 |
|---|---|---|
| 1 | #365 出档面 = 池装配装饰 + 装配段整面（`withPool` ∕ `vscSubagentFace` ∕ 终态回显族 ∕ `modeRoleField` ∕ `buildToolTable`） | `buildToolTable` 体消费前三者 —— 只搬它必生反向边（环）；整面出档 + 同名 re-export 保消费档（`setup.mjs`）零改（KD-6 缝形） |
| 2 | events 拆两档：blocks（块面 + 键门 ∕ 游标 ∕ 工具块定位 ∕ 中止扇扫四原语）· slices（读数槽族 + 目标 ∕ 队列 ∕ 台账） | 482 ⇒ ≤300 需移 ≥182 行；两档 135 ∕ 130、零反向 import（无环）；原语随其消费面（块面）走 |
| 3 | composer 出档 = 随动派生面（`state` 读面 ∕ 忙态派生 ∕ 模式位推送 ∕ 候选面 ∕ 两挂件锚窄刷）工厂 `createComposerSync(deps)` | 原为单闭包；沿同档既有 `createComposerWire(deps)` 先例做 deps 注入（两宿主锚 ∕ `panel` = 装配期后置位 ⇒ 访问器注入）；`effortOf` ∕ `reasoningOf` + `REASONING_NONE` 随迁单源（写面 deps 注入 ∕ `prefsOf` 同表） |
| 4 | core.css 出档面 ①（核 Markdown 产出，面 1–17 / 183 行） | 最大内聚面；载入序 = `index.html` core-markdown 先于 core ⇒ 面 20 覆盖（同选择器）「后落者胜」序与拆前等价 |
| 5 | #471 门位选择：③ 落**门①′**（判据序：门 ⓪ → ① → ①′ → ② → ③） | 既有负探针仍走门①（stderr 归属行 ∕ `blocked` 计数不吞）；③ 只收紧 URL 形 dot 段（假阴面收紧）；④ 段界消除 `..foo` 误拒 |
| 6 | 表外两处（披露）：`thincoder-vscode/AGENTS.md:43` 模块图 + `renderer/index.html:18` 链序行 | 新档入图 ∕ 入链 = 交付完整必需；逐处报告 |
| 7 | 连带收正（零语义）：`mount-composer.mjs:33` 「本档」→ 派生面档 · `:35` 全清令死指针标记 · `isComposing` 消费者注（核卡 P2 已随核卡内建） | 拆档 ∕ 实读使本档注释与实况相抵（内部审计 + 代码评审均列；零语义） |

**上抛 ∕ 登记（随轮报告）**

1. 三条免实施登记句已在表内（#196 ∕ #364 ∕ #450）——§6 核销时逐条引用。
2. `#365` 设计档回填（报告列 · 未写设计档）：`docs/core/design/MANIFEST.md` 行 29 表行（现 `:180`）与 §2.3 拆分注（现 `:201`）触发成立 ⇒ 已执行；**拆后实读 = `setup-tooltable.mjs` 102 ∕ 新档 `tool-table.mjs` 250**；`docs/vsc/design/VSC-DEBT.md:111/:135/:163` 三处旧「已落 · 实读 333」同笔收正 ⇒ **Doc-B（#35）∕ 届盘**。
3. `#510` §4.1 随动（报告列 · 未写设计档）：三档实读 + 四转核销项读数 + `store.mjs` 出拆名单 + 测试档从句撤 + U95 撤 ⇒ **Doc-B（#35）∕ 专轮 #551**（用户令：§4.1 全表重锚另轮）。
4. 范围外只报：`renderer/queue.mjs:7` ∕ `renderer/views/chat-pending.mjs:5` ∕ `:68` 三处仍把 `paintNotices` 记作 `mount-composer.mjs` 面（随拆档陈旧，他档面未并）；`docs/render-core/design/RENDER-CORE.md` 若干行锚因本轮门插入 ∕ 拆档漂移；`docs/batches/2026-09-27-render-core-r1.md:157`（③ 原始字面「guard 前缀白名单可收紧」）与 §1.16 转写「③URL 形收紧」非逐字同指 —— 供 §6 核销绑定目标。
5. R1 顾问项 ⑥ 完成读数：探针表自 R9 起为 3 正 6 负 ⇒ `NEGATIVE_PROBE_COUNT` 实读 **6**（旧手抄 5 已撤；smoke 判据随之收紧）。

**审计与代码评审轮次与终态**：内部 explore 背离审计（只读 · 1 轮）= **clean**（四类偏差零；附 2 项记录面：§5 未写 = 本笔补、`isComposing` 注释漂移 = 随轮收正）；advisor 代码评审（type=code · 1 轮）= **pass**（🔴0 ∕ 🟡1【编排项：设计档回填待 Doc-B #35 ∕ #551 —— 非 must-fix】∕ 🔵3【`mount-composer` 档头陈旧注释 ×2 ∕ 批测时序等待】）；**fix round = 1**（三项逐处收正：`:33` 归属改指派生面档 · `:35` 死指针标记 · 批测改确定性轮询；复跑 9 ∕ 9 保持）。**终态 = clean**。

**披露**：① 测试件暂存 `.thincoder/tmp/` 待父侧 copy（写门实测拒 —— 台账 #545）；② 本舱零触设计档 ∕ 需求档 ∕ 其他批档（`thincoder-core/**` 只读）；③ 表外两处见决策表 #6；④ 工作树含他批未提交改动（`mount-composer.mjs` 改前非 HEAD 基线——字节级重演不适用，如上述）。

## §6 验证与收口（父代理）
