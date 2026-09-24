# 2026-09-25 · hygiene-ab
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 02:49「可以，先把A/B处理了。」——技术待办检查（02:47）之 A 组（文档/文本卫生 14 条）+ B 组（产品码小修 5 条）收正。
> 台账 = #229 / #230 / #232 / #234 / #237 / #238 / #239 / #243 / #245 / #246 / #247 / #270 / #280 / #281（A 组 · 文档卫生）+ #227 / #228 / #231 / #233 / #235（B 组 · 产品码小修）——共 19 条 · 归批。前情 = docs/batches/2026-09-22-hygiene-sweep.md（同族前批 · 体例参照）。
## §1 讨论（主 agent）
**状态行**：进行中（19 条已入批（台账全转在途）· 设计轮 initial 在途（§2 任务书：逐条处置 + 落点 + 判据）→ 点火评审 → 批准 → 实施）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 条目清单（19 条 · 用户 02:49 令：A/B 组收正）

**来源** = 技术待办检查（02:47 · 台账全量 207 条 · 未决 37）之 A/B 组 + 用户 02:49「可以，先把A/B处理了。」；逐条证据 = 台账在册（按 id 可查）。

**A 组 · 文档/文本卫生（14 条）**：`#229` 修订式标记族二态复核（N₀=343）· `#230` `docs/README` 补登 `MODEL-SPECS.md`（54 vs 53）· `#232` §17/§19/§2.20 死指针残差（≈80 处 · 三产品活体面）· `#234` `VSC-DEBT` §12.2.3 R-6 坐标 · `#237` `model-specs.mjs` 文书句失效（复测全 200）· `#238` VSC README:77 DeepSeek 行漂移 · `#239`+`#247` doc-check 基线族核查（收束到实况）· `#243` CLI CHANGELOG 缺段（0.12.50 / 0.12.58）· `#245` `docs/README` RELEASE 死指针 + §1 计数 · `#246` CLI `AGENTS.md` 死指针 · `#270` `CORE-UNIFICATION` §2.8.1 补行 + 计数 · `#280` 产品树两处引旧句（D-11）· `#281` KD-36 被否① 枚举窄。

**B 组 · 产品码小修（5 条）**：`#233` `startLedgerSurface` async 契约（每退抛 TypeError——机制侧待收）· `#227` `.d` 孤儿目录永不清运（1,119 个 · `session gc` 后缀表缺 `.d`）· `#231` `chat-panel` 工作区转空支路未接 `releaseOldCwdClaims` · `#228` busy-extend 表外旧口径注释 3 档 · `#235` VSC `.vscodeignore` 补规则（防游离日志入包）。

**在飞避让**：judge-fallback 批正在实施 `bench/**`（#60）——本批文件域避让；doc-check 基线与 v6 跑批面零触。

### 1.0 授权（**父侧代点火 + 代批准** · 全链 · 2026-09-25 02:51）

**用户原话**：「自动跑完吧。」⇒ 本批全链——**设计评审点火权 + §4 批准权 + 修正轮 / 实施轮派发 + 收口核销提交推送**——均委托父侧自动执行，至本批完结。

**父侧自缚**：① 代签仅当「评审 pass（0🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 02:51 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 复评若再出 🔴 ⇒ 停下回报，不循环自动修；④ 实施验证不过 / 需新范围 / 需用户口径裁决 ⇒ 停下上抛。

### 1.2 父侧裁定（§2.7 上抛 4 项 · 2026-09-25 02:5x · 全链授权内）

1. **B 类残差出路 = 确认 ①**（常驻登记 + 消解路径 + 到期条件——承 `DOC-DISCIPLINE.md` §3.8 既裁；不迁迁移期引文族）。
2. **`#232` 处置口径 = 确认全量 sweep**（靶面复扫残余 0 · 口径差 285 vs ≈80 以实扫为准；判据 = 处置集闭合 + 三端套件绿）。
3. **`#227` 显式面清运腿 = 确认保留**（存量 1,119 的通路；最小形不足以下降存量）。
4. **`#237` 邻域表述面 = 收正**（`AGENT-LOOP.md:254` · `CONTEXT-COMPACTION.md:168`/`:695` 三处按 2026-09-22 复测事实改述——本批 +1 条，台账 **#283** 登记随批）。

**口径补记**：本批条目集 = 19 + 1（#283）= **20 条**；其余 19 条射程零变。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（20 条逐条处置（+ #283 · fix 轮）+ 上抛 4 项裁定落地（①②③ 确认 · ④ 收正入批）+ 受影响文件表 / 测试面 / AC 落位（零实施 · 2026-09-25））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批任务书总纲（A 组 15 + B 组 5 = 20 条 · 逐条处置）

**批次任务（覆盖）**：A 组 · 文档/文本卫生 **15 条**（`#229` `#230` `#232` `#234` `#237` `#238` `#239` `#243` `#245` `#246` `#247` `#270` `#280` `#281` `#283`——其中 `#239`+`#247` 同族并案）+ B 组 · 产品码小修 **5 条**（`#227` `#231` `#233` `#235` `#228`）= **20/20**（一条一处置行 · 一条一判据）。

**本轮性质**：设计轮（initial）——**零实施**（不写产品码 / 不改文档正文 / 不建新档）；本 §2 即实施轮的分派任务书，待 §3 评审 → §4 批准后按面分派。

**处置口径（全批统一）**：

1. **逐条收正 · 零新语义**（行为面改动以既有判据 / 现口径为准——改法全部取自本设计轮现读；不夹带新范围）。
2. **行为面改前必实读**（本设计轮已逐条实读 20 条靶位——读数见各行「现读」；实施轮落笔前**再读一次目标行**防在途漂移）。
3. **机检零新增**：`node scripts/doc-check.mjs`（开工前基线 = 悬空 8 / 行宽 13——本席 2026-09-25 实跑，日志 `.thincoder/tmp/dc-hyg-ab.log`）+ 三端套件全绿。
4. **在飞避让**：judge-fallback 批正在实施 `bench/**`（eng-coder #60）⇒ **本批受影响文件零含 `bench/**`**；`#232` 若扫出 `bench/**` 落点 ⇒ 明记避让 / 留待后续。
5. **记录面零触**：`_archive/**` · 批档正文 · 各档**变更记录段** · `CHANGELOG.md` 既有段（`#243` 只**补缺段**，不改既有段）——一律零触碰。

**归属（D1 写权矩阵）**：设计档面（`docs/core/design/**` · `docs/vsc/design/**` · `docs/README.md` 地图）= **eng-designer**；产品码 / 测试 / 产品文本（`thincoder-*/` 树）= **eng-coder**；台账 = **主 agent**；需求档命中项（若有）⇒ **零触碰 + 列表上抛**（主 agent 笔）。

**坐标口径**：标「现读」= 本席 2026-09-25 实读（`file:line` 均仓根完整路径形态）；标「台账 as-of」者 = 台账在册坐标，**实施轮必先复读**（本批已实测 5 组坐标漂移——见 §2.7 发现①）。

**落点说明**：本批无独立设计档——hygiene 族体例（承 `docs/batches/2026-09-22-hygiene-sweep.md` §2）：**批档 §2 即设计面**（含机制设计 / 受影响文件 / 测试面 / 验收对照 / 关键决策）。

### 2.1 总表（20 条 · 逐条：面 · 目标 file:line · 处置 · 归属 · 判据）

#### A 组 · 文档 / 文本卫生（15 条）

| id | 面 | 目标 file:line（现读 / 扫描面） | 处置 | 归属 | 判据（机检优先） |
|---|---|---|---|---|---|
| #229 | A-规范面标记族 | 扫描面 = `docs/**/design/**`（排除 `_archive/` · `prompts/`）+ 变更记录段外；N₀ 开跑复扫 | **修（全量二态复核）**：逐候选行二态判定——D8 两分（指向在位对象 = 出处注 ⇒ 照留；退役挂尸 ⇒ 删）+ 有裁定锚者转裁定语；记录面 / 变更记录段零触 | eng-designer | 候选表逐条二态闭合（无「待判」行）+ 复扫：退役挂尸类残余 = 0 + doc-check 零新增 |
| #230 | A-地图 | `docs/README.md:77-78`（现读：计数核对行「实档 55 = 本图登记 54 + 待补登 1」） | **修**：§4「基准测试面」组补登 `MODEL-SPECS.md`（1 → 2 档）+ 计数核对行收正为 **55 = 55**（待补登 0） | eng-designer | `docs/core/design/*.md` 实档数 = 登记数（机检 = 逐组计数对账，本席读数 = **55**）；待补登 = 0 |
| #232 | A-产品码注释（死指针族） | 三产品活体面——本席实扫 **288 处**（扣产品参照树 3 ⇒ **285**）· 台账口径 ≈80（差异见 §2.7 发现①） | **修（全仓引用面 sweep）**：逐处实读二态——现行 docs 树有对应节 ⇒ **改指**；无 ⇒ **改述**（去死 §号、保语义句）；`bench/**` · 产品参照树 · `_archive` · 记录面零触 + 残差披露 | eng-coder | 靶面复扫残余 = 0（处置集闭合；开跑读数记 §5）+ 三端套件绿 |
| #234 | A-设计档坐标 | `docs/vsc/design/VSC-DEBT.md:381`（现读 R-6 行；台账 `:380` 已漂） | **修**：④ 处置列 `WEBVIEW-PROTOCOL.md:366` → **`:367`**；消费位 `webview/chat.js:285` → **`webview/chat-messages.js:185`** | eng-designer | 两新坐标现读在盘（人工对读）+ doc-check 零新增 |
| #237 | A-产品码文书句 | `thincoder-core/model-specs.mjs:137-138` · `:304-307`（现读；台账 `:257-259` 已漂） | **判已消（他批已收正）+ 台账收正**：两处现文已载「2026-09-22 复测三形态全 200——`must be passed back` 400 **NOT reproduced**」⇒ 无残留句可改；台账坐标按现读收正 | 主 agent（台账收正） | 现读两处载复测句（grep `must be passed back` 命中均在「NOT reproduced」句内——本席实核） |
| #283 | A-设计档表述面 | `docs/core/design/AGENT-LOOP.md:254`（句跨 `:253-255`）· `docs/core/design/CONTEXT-COMPACTION.md:168` / `:695`（现读） | **修（按复测事实改述）**：三处「活体形状（尾 = tool）缺字段 400」句按 2026-09-22 复测事实收正（三形态全 200 · `must be passed back` 400 **NOT reproduced**）——现事实句 + 日期锚（同 #237 口径 · 改法见 §2.2.8）；历史过程承各档变更记录 | eng-designer | 三处旧断言句零命中（`must be passed back` **400** 断言形）+ 新句载日期锚（`2026-09-22`）+ doc-check 零新增 |
| #238 | A-产品文本 | `thincoder-vscode/README.md:77`（现读：`| DeepSeek | deepseek-v4-pro | …`） | **修**：默认模型按预设表单源收正为 **`deepseek-flash`**（源 = `thincoder-core/config-presets.mjs:17`） | eng-coder | 该行取值 = 预设表逐字（两处取串比对）；VSC 套件绿 |
| #239+#247 | A-门禁基线族 | **悬空 8**（现读全清单 = CONSULTATION.md:59 · MEMORY.md:47 · SESSION.md:789 · TOOLS.md:106/:114/:925/:931×2）+ **行宽 13**（BATCH-RECORD.md:358/:365 · MODEL-BENCH.md:219/:234/:279/:571/:587/:1484/:1485/:1488/:1497/:1498/:1499） | **修 + 登记**：判类第 0 步（`docs/core/design/DOC-DISCIPLINE.md` §3.8 判 A/B/C）→ A 类**修**（3 锚 + 5 行宽——逐条见 §2.2）+ B 类**零触碰 + 残差登记**（5 锚 + 8 行宽）；`#203`/`#216` 相抵裁定入 §2.7-KD3 | eng-designer | 开工前 / 落笔后复跑：A 类零复现；B 类残差逐条在册（携消解路径 + 到期条件） |
| #243 | A-产品文本 | `thincoder-cli/CHANGELOG.md`：0.12.58 缺段（插于 `## [0.12.59]`(:142) 块后、`## [0.12.57]`(:192) 前）；0.12.50 缺段（插于 `## [0.12.51]`(:306) 块后、`## [0.12.49]`(:353) 前） | **修**：补记两段最小条目（逐字 = 「维护性发布（本期无单独变更条目）」+ 日期取 registry 发布时间 **2026-08-29**（0.12.50）/ **2026-09-02**（0.12.58）——口径源 = `docs/RELEASE.md:224` 承位条目） | eng-coder | 两段标题在场（`^## \[0\.12\.(50|58)\]`）+ 序列仍单调递减；RELEASE §6.3 承位条目可指向已补记 |
| #245 | A-地图 | `docs/README.md:16`（§1 计数「cli 2 · vsc 8 = 10 档」）· `:67`（`core/requirements/` 行含已迁 `RELEASE.md`）· `:68`（`cli/` 2 档含已迁 `design/RELEASE.md`） | **修（完整盘点 + 计数链收正）**：实盘现读 = `docs/cli/` **12 档**（design 7 + requirements 5）· `docs/vsc/` **11 档**（design 8 + requirements 3）⇒ 登记表逐档重出 + §1 计数同改 | eng-designer | 登记表逐档 = 实盘档集（机检 = `git ls-files docs/cli docs/vsc` 对账）；计数 = 列表长度（D3） |
| #246 | A-产品文本（AGENTS.md） | `thincoder-cli/AGENTS.md:31`（现读：两处 `../docs/cli/design/RELEASE.md` + 节号 `§6.2` / `§3.2`） | **修**：两处改指 `../docs/RELEASE.md`；节号按 `docs/RELEASE.md` 现档节实读重指（双子句同改） | eng-coder | 该行两指针可解析（`docs/RELEASE.md` 在盘）+ 节号实存 |
| #270 | A-设计档注册表 | `docs/core/design/CORE-UNIFICATION.md` §2.8.1：子表 `:1108-1122`（现 13 行）· 计数句 `:1102` | **修**：子表补行 14 = `model-specs.mjs`（**326** · 拆点 = `MODEL_SPECS` 表块外提 · 落点 `thincoder-core/model-specs-table.mjs`（拟新增）· 消解窗口 = 越 500 硬限前或该档下次实质改动）；计数句复核收正 = 在册 **46** / 已登 **14** / 其余 **32** | eng-designer | 计数 = `SOFT_LINE_REGISTRY` 实读条目数（本席实测 **46**——`thincoder-core/test/core-hygiene.test.mjs:81-94`）；登记行与盘上实测一致 |
| #280 | A-产品码/测试引旧句 | `thincoder-core/model-specs.mjs:193`（行注「D-11：能力位不跨名沿用」）· `thincoder-core/test/model-specs.test.mjs:318`（用例名同句） | **修**：按 `docs/core/design/MODEL-SPECS.md` §9.1 D-11 收窄后现口径改述两处引句（语义仍成立——只对字面收正，零行为改） | eng-coder | 两处引句 = §9.1 现文（人工对读）；核套件绿（用例名改字不破断言面） |
| #281 | A-设计档决策格 | `docs/core/design/MODEL-BENCH.md:930`（现读 KD-36 行；台账 `:825` 已漂）——被否① 枚举「（partialMode / cacheMode / thinkApi / tempRange / noUsageStream）」 | **修**：枚举补 **`thinking`** / **`reasoningEcho`**（对读 `MODEL-SPECS.md` §13.3 实际沿用集；决策本体零改） | eng-designer | 该括注枚举 ⊇ §13.3 沿用集（机检 = 两串在场 + 人工对读表）+ doc-check 零新增 |

#### B 组 · 产品码小修（5 条）

| id | 面 | 目标 file:line（现读） | 处置 | 归属 | 判据（机检优先） |
|---|---|---|---|---|---|
| #233 | B-产品码（契约） | `thincoder-cli/src/tui/ledger-surface.mjs:28-32`（端壳）· `thincoder-cli/src/tui/index.mjs:210-214`（调用点——现为 structure-debt 批最小修，台账 `:484-485` 已漂） | **修**：端壳 `startLedgerSurface` 改**同步句柄**——恒返回 `{ dispose() }`（内部桥接核 Promise；dispose 早于核就绪 ⇒ 就绪后补调）+ 头注写明两端契约；调用点回退原同步形 | eng-coder | 新用例（宿主 = `thincoder-cli/test/ledger-surface.test.mjs`）断言 `typeof startLedgerSurface(…).dispose === "function"`（载入成功 / 失败两态均不抛）+ `node test-startup.mjs` exit 0 无 TypeError + CLI 套件绿 |
| #227 | B-产品码（存储泄漏） | `thincoder-core/session-gc.mjs:51-59`（`classifyResidue` 后缀表——**零 `.d`**）· `:104-115`（候选处理环 = `stat` + `unlink`） | **修**：后缀表补 `.d` **目录形**（`{prefix}.{N}.d`）+ 孤儿判据（主文件 `{prefix}.{N}` 不存在 ∧ mtime 越 30 天保留期）+ 删除 = **回收**（rename 进 `sessions-trash`，D-SE36 同语义——KD-2） | eng-coder | 新用例（宿主 = `thincoder-core/test/session-gc-stale.test.mjs`）：孤儿 `.d` ⇒ 回收；主文件在 / 未过期 / 活跃槽 ⇒ 保留；实地复跑：`~/.thincoder/sessions` 孤儿 `.d` 计数（1,119 → 下降） |
| #231 | B-产品码（同族接线） | `thincoder-vscode/src/extension/chat-panel.mjs:110-124`（工作区转空支路） | **修**：转空支路按 `#168②` 同款接 `releaseOldCwdClaims`——记旧 cwd（`clearProjectOverride` 前）→ 清槽 / agent 后释放（单点 = `panel-project.mjs:35`） | eng-coder | 新用例（宿主 = `thincoder-vscode/test/session-release-shell.test.mjs`）：转空 ⇒ 旧 cwd 释放恰一次；VSC 套件绿；**该档硬限余量 5 行**（现 495/500——注入 ≤4 行，超则停下上报） |
| #228 | B-注释（旧口径 3 档） | `thincoder-vscode/src/extension/panel-chat.mjs:5-9` · `thincoder-vscode/webview/loading.js:19-21`/`:63` · `thincoder-vscode/test/files.mjs`（台账 `:57` 已漂——busy 口径行现读 `:61`，实施轮 grep 定位） | **修**：按现口径收正——busy 提交 = **入队受理（容量 8）+ 待发送标记**；满队 ⇒ 拒发 toast + 文本保留；挂起会内同面受理（源 = `send.js:27-56`） | eng-coder | 三档旧口径短语零命中（`input is disabled` / `rejects, no queue` /「与拒发同判据」措辞——以现口径句替代）+ VSC 套件绿 |
| #235 | B-配置（打包面） | `thincoder-vscode/.vscodeignore`（现读 17 行 · 零 `.log` 规则） | **修**：补 `*.log` + `**/*.log` 两行（防同类未跟踪调试日志入包——原 `m10-vsc-fresh*.log` 已由父侧移出） | eng-coder | 打包清单零 `.log`（`npx vsce ls` 实跑逐条核）；`node scripts/check-vsix.mjs` 既有断言不红 |

### 2.2 重点条目展开（判类明细 / 改法要点 / 机制设计）

#### 2.2.1 `#239`+`#247` · 门禁基线族（8 悬空 + 13 行宽 · 逐行判类）

**判类单源** = `docs/core/design/DOC-DISCIPLINE.md` §3.8（A 现态改指 / B 史实保留零触碰 / C 需求档零触碰上抛；判定单位 = 行；优先序 = 行施为优先）。**判类第 0 步**先行，余行再走折行 / 改指 / 改述 / 删除（承 hygiene-sweep 同款口径）。

**悬空 8（逐行）**

| # | 现读坐标 | 锚 | 判类 | 处置 |
|---|---|---|---|---|
| 1 | `docs/core/design/CONSULTATION.md:59` | `src/advisor/tools.mjs:29-37` | **A**（表内行施为 = 分叉记述 / 对位现态改写） | 承接实核：`thincoder-core/advisor/` 现无 `tools.mjs`（本席实核）⇒ 先 `grep -n "code_search" thincoder-core/advisor/*.mjs` 定承接档：有 ⇒ 改指；无 ⇒ **改述**（去该坐标、保「VSC 恒在 `code_search`」语义句） |
| 2 | `docs/core/design/MEMORY.md:47` | `tools/code.mjs` | **A**（§2.3 单端档映射表行） | `thincoder-vscode/src/tools/code.mjs` **在盘**（本席实核）⇒ 补全路径前缀（与 hygiene-sweep「TOOLS.md 9 处裸名改指」同款） |
| 3 | `docs/core/design/TOOLS.md:106` | `tools/code.mjs` | **A**（同表——本表 = 该映射表权威副本） | 同 #2（逐字同改，双档同源） |
| 4 | `docs/core/design/TOOLS.md:114` | `tools/code.mjs` | **A**（归属提示行 · 引两行的路径形态） | **改述**：去路径形态——以「表中 checkpoint / code 两行（VSC 侧单端档对位行）」指称（`tools/checkpoint.mjs` 同句一并去形，防下轮同类） |
| 5-8 | `docs/core/design/SESSION.md:789` · `TOOLS.md:925` · `TOOLS.md:931`×2 | `index.mjs:444-450` · `agent.mjs:169-170` · `run-stages.mjs:91-92` · `agent.mjs:418` | **B**（行住**变更记录段**——已收口批叙述面） | **零触碰**（不改字不加标记）；残差登记见本节末表 |

**行宽 13（逐行）**

| # | 现读坐标（字符数） | 判类 | 处置 |
|---|---|---|---|
| 1 | `docs/core/design/MODEL-BENCH.md:219`(333) · `:234`(408) · `:279`(324) · `:571`(480) · `:587`(557) | **A**（活体面：§2.2 字段表 10 / §2.3 报告契约 / §2.3-6 / §2.10.5 / §2.11） | **按语义折行**（内容逐字零变——插入换行；表行不折入表内续行，改以句读断行） |
| 2 | `docs/core/design/MODEL-BENCH.md:1484`(318) · `:1485`(431) · `:1488`(376) · `:1497`(353) · `:1498`(481) · `:1499`(570) | **B**（变更记录段——2026-09-24 各批条目） | **零触碰**；残差登记 |
| 3 | `docs/core/design/BATCH-RECORD.md:358`(589) · `:365`(302) | **B**（变更记录段——hygiene-sweep 已登记同集） | **零触碰**；残差登记 |

**B 类残差登记表（携消解路径 + 到期条件——不得作常驻态）**

- **锚残差 5 条**（`SESSION.md:789` · `TOOLS.md:925` · `TOOLS.md:931`×2）：住变更记录段（已收口批叙述面）。**消解路径** = 随该档下次实质修订一并处置，或按 §4.2.10 迁入迁移期引文族（**须父侧裁定射程**——先例 = DOC-DISCIPLINE §3.8「不采纳」注）；**到期条件** = `docs/core/design/` 下一次板块级 sweep。
- **行宽残差 8 行**（`BATCH-RECORD.md:358/:365` · `MODEL-BENCH.md` 变更记录段 6 行）：同上口径（B 类零触碰——折行即改他批收口面文字）。
- **收口读数预期**：A 类 4 锚 + 5 行宽全清 ⇒ 复跑 = **悬空 4 / 行宽 8**（全 B 类在册）；本批改动面零新增。

#### 2.2.2 `#233` · 台账面 async 契约与调用点收正（机制设计）

**现状（现读）**：端壳 `thincoder-cli/src/tui/ledger-surface.mjs:28-32`——`startLedgerSurface(ctx)` 返回 **Promise**（`loadCore().then(core => core.startLedgerSurface(…)).catch(() => ({ dispose() {} }))`）；调用点 `thincoder-cli/src/tui/index.mjs:210` 取回 Promise，`:214` 以 `void Promise.resolve(ledgerSurface).then(s => s?.dispose?.())` 兜（structure-debt 批最小修——已不抛）。
**核契约（现读）**：`thincoder-core/ledger-surface.mjs:60-83`——核 `startLedgerSurface` **恒同步返回 `{ dispose }`**（内部 `setImmediate` 首扫 + `setInterval` 周期）。⇒ 缺口 = 端壳与核契约形态不一（Promise vs 句柄），调用点被迫写 Promise 适配。

**修法（KD-1 · 端壳收敛为同步句柄）**：

1. **头注写明两端契约**：「恒同步返回 `{ dispose }`——核句柄异步就绪（动态 import）后桥接；载入失败 ⇒ 空句柄（`dispose` 恒可调）；`dispose` 早于核就绪 ⇒ 置位、就绪后补调（N1 降级不崩）」。
2. **实现**：`let disposed = false, handle = null` → `loadCore().then((core) => { if (!disposed) handle = core.startLedgerSurface({ ...ctx, colors: C }) }).catch(() => {})` → `return { dispose() { disposed = true; handle?.dispose?.() } }`。
3. **调用点回退原同步形**：`process.on("exit", () => ledgerSurface.dispose())`（同步、零 TypeError；`:211-213` 最小修注释同步收正为现契约句）。
4. **核契约零改**（核本已同步返回——`thincoder-core/ledger-surface.mjs` 不在本批写域）。

**被否候选**：① 全调用点 await（`process.on("exit")` 回调**不能 await** ⇒ 不可行）；② 仅文档化 async 契约 + 保留调用点 Promise 适配（每个新调用点重复适配、别名面（exit 钩子）不能同步 dispose ⇒ 消费面复杂化）。

**判据（机检）**：用例断言 `typeof startLedgerSurface({}).dispose === "function"`（**两态**：核可载入 / 载入失败）且不抛；`node test-startup.mjs` exit 0（现为前置红面）＋ CLI 套件绿。

#### 2.2.3 `#227` · `.d` 侧录孤儿清运（机制设计）

**现状（现读）**：`thincoder-core/session-gc.mjs:51-59` `classifyResidue` 后缀表 = `.corrupted` / `.unreadable` / `.bak-N` / `.tmp`（**零 `.d`**）；候选处理环 `:104-115` = `stat` + `unlink`（**文件形**）。sidecar 记录目录名形 = `{槽文件}.d`（= `{hash}.json.{N}.d`；常量单源 `thincoder-core/session-segments.mjs:13` `RECORD_DIR_SUFFIX = ".d"`）⇒ 槽文件消失后目录**永不清运**（实测孤儿 1,119 个——来源 = `docs/batches/2026-09-22-session-index.md` §2 面外①）。

**修法（KD-2）**：

1. **后缀表补目录形**：name 匹配 `^{prefix}\.\d+\.d$` ⇒ `{ retention: RESIDUE_RETENTION_MS（30 天）, slot, tmp: false, dir: true }`（slot 解析沿用既有 `/^\.(\d+)\./`——`.N.d` 形态天然命中）。
2. **孤儿判据**：`dir` 形 ⇒ 主文件 `{prefix}.{N}` 不存在（同 `.tmp` 面 `existsSync` 判据反向：**主文件在 ⇒ 跳过**）；活跃槽判据不变（N1：活跃槽现场一律保留；未知属主 ⇒ 保留）。
3. **删除 = 回收**（rename 进 `sessions-trash/<批次>/`，复用 `thincoder-core/session-stale.mjs` 的 `trashRootFor` + 异步 `rename`；**不 unlink / 不同步 fs**——D-SE34 零同步扫描约束，`existsSync` 单条目探测为既有例外）；回收批自身清运沿既有回收 7 天窗（D-SE36）。
4. **保留期 = 30 天**（数据现场族口径）——**不取** `.tmp` 的 7 天（sidecar = 记录存储本体 / 语料主体，不按崩溃现场对待）。

**被否候选**：① `unlink` / `rm` 直删（目录承载记录存储本体——不可回退，破 D-SE36「删除改回收」语义）；② 短保留期（7 天）。

**判据（机检 + 实地）**：新用例四态——孤儿 `.d` ⇒ 回收；主文件在 ⇒ 保留；未过期 ⇒ 保留；活跃槽 ⇒ 保留。实地复跑：`~/.thincoder/sessions` 孤儿 `.d` 计数（1,119 → 下降，读数记 §5）。

#### 2.2.4 `#231` · 工作区转空支路接 `releaseOldCwdClaims`（接线设计）

**现状（现读）**：`thincoder-vscode/src/extension/chat-panel.mjs:110-124` 转空支路 = `clearProjectOverride()` → `this._slot = null` → `this._agent = null` → `pushWorkspaceGuard` → `blockOnNoWorkspace` → `return`；**未调 `releaseOldCwdClaims`**。同族三落点已接：`panel-project.mjs:59`（显式切换器）· `chat-panel.mjs:98`（follow 自动切换）· `chat-panel.mjs:140`（工作区兜底回落）。
**修法**：转空支路按同款接线——**清理前**记 `const oldCwd = _cwd()`，清 override / 槽解绑 / agent 销毁后调 `releaseOldCwdClaims(oldCwd)`（单点 = `panel-project.mjs:35`——同 cwd ⇒ `false` no-op；异 cwd ⇒ 旧 manifest 补一次同语义释放；失败容忍永不抛）。
**注入量硬约束**：该档现 **495 行 / 500 硬限——余量 5 行**⇒ 净增 **≤4 行**；超 ⇒ **停下上报**（不得带病越线；备用出路 = 同批登记 + 拆分计划，但优先按最小注入落地）。
**判据**：新用例（`thincoder-vscode/test/session-release-shell.test.mjs` 族）：转空 ⇒ 旧 cwd 释放恰一次（桩计数）+ 同 cwd no-op 面不变；VSC 套件绿。

#### 2.2.5 `#229` · 修订式标记族全量二态复核（口径）

**扫描面**：`docs/**/design/**`（排除 `_archive/` · `prompts/`）+ **变更记录段外**；族 = ① 日期 / 编号式「收正 / 改判 / 修订」括注 ② `~~` ③ 尸语（作废 / 挂尸 / 墓志 / 失效表达）。
**基线口径**：N₀ = 开跑实扫（as-of 2026-09-22 = 343 行：① 274 · ② 5 · ③ 64——源 = `docs/batches/2026-09-22-hygiene-sweep.md` §2.11）；**实施轮以开工前复扫为准**（他批在途写入会漂）。
**判读口径（D8 两分）**：指向**在位对象** = 出处注 ⇒ **照留**；指向**已消失对象** = 退役挂尸 ⇒ **删**；有日期 / 裁定锚者 ⇒ **转裁定语**（先例 = hygiene-sweep §2.12 逐处表）。
**判据**：候选表**逐条二态闭合**（无「待判」行）；复扫 = 退役挂尸类残余 **0** + 出处注类照留（计数在册）；需求档命中项 ⇒ **零触碰 + 列表上抛**（主 agent 笔）；doc-check 零新增。

#### 2.2.6 `#232` · `§17/§19/§2.20` 死指针族 sweep（工艺）

**枚举命令（单源）**：`git grep -n -e "§17" -e "§19" -e "§2\.20" -- thincoder-core thincoder-cli thincoder-vscode`，排除 `_archive/**` · `.thincoder/**` · `bench/**`（在飞避让）。
**本席实扫读数 = 288 处 / 80 档**（扣产品参照树 3 ⇒ **285**）；台账口径 ≈80（差异与处置见 §2.7 发现①）。
**逐处二态**：① 现行 docs 树有对应节 ⇒ **改指**（档名 + 节号——先例 = hygiene-sweep §5 `#220`：六坐标全改指 `AGENT-LOOP-ASYNC-POOL.md` §6.8）；② 无对应节 ⇒ **改述**（去死 §号、保语义句）；③ 语义不可保 ⇒ 删指称。
**零触面**：记录面（`CHANGELOG.md` 既有段 / 各档变更记录段）· 产品参照树（`thincoder-{cli,vscode}/docs/**`——保留 ≠ 维护）· `bench/**`（在飞避让——若扫出落点则**明记避让**）· `_archive/**`。
**判据**：靶面**复扫残余 = 0**（处置集闭合）+ 处置表逐条在案（档 / 行 / 旧形 / 新形）+ 三端套件绿。

### 2.3 受影响文件表（现状 = 本席 2026-09-25 实测 · 计数尺 = `wc -l` 口径）

**码 / 测档**

| 档 | 现状 | 本批 Δ | 档位 / 触发注 |
|---|---|---|---|
| `thincoder-cli/src/tui/ledger-surface.mjs` | 32 | +6~10 | <300 ✓（#233 端壳句柄） |
| `thincoder-cli/src/tui/index.mjs` | 228 | ±2 | <300 ✓（调用点回退同步形） |
| `thincoder-cli/test/ledger-surface.test.mjs` | 347 | +10~20 | >300（CLI = advisory）⇒ 越线登记 + 触发式拆分 |
| `thincoder-core/session-gc.mjs` | 303 | +15~25 | >300（**已在册** `SOFT_LINE_REGISTRY`）⇒ **不拆**（只加后缀 / 孤儿判据 / 回收调用 · 结构未变）；触发 = 越 500 硬限或该档下次实质改动 |
| `thincoder-core/test/session-gc-stale.test.mjs` | 297 | +15~25 | **逼近 300**——越线即登记（`thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY` + 注记） |
| `thincoder-core/model-specs.mjs` | 326 | ±1 | >300（**已在册**）· #280 行注改字（±0~1） |
| `thincoder-core/test/model-specs.test.mjs` | 477 | ±1 | >300（**已在册**）· 距 500 硬限 **23** |
| `thincoder-vscode/src/extension/chat-panel.mjs` | **495** | +2~4 | **距 500 硬限 5 行**——净增 ≤4；超 ⇒ 停下上报 |
| `thincoder-vscode/src/extension/panel-chat.mjs` | 259 | ±3 | <300 ✓（#228 头注收正） |
| `thincoder-vscode/webview/loading.js` | 95 | ±3 | <300 ✓（#228 两处注句） |
| `thincoder-vscode/test/files.mjs` | 136 | ±1 | <300 ✓（#228 清单行注） |
| `thincoder-vscode/test/session-release-shell.test.mjs` | 222 | +10~20 | <300 ✓（#231 用例宿主） |
| `thincoder-vscode/.vscodeignore` | 17 | +2 | 非码档（#235 两规则行） |

**产品文本 / 文档档**

| 档 | 现状 | 本批 Δ | 注 |
|---|---|---|---|
| `thincoder-vscode/README.md` | 204 | ±1 | #238 一行取值收正 |
| `thincoder-cli/CHANGELOG.md` | 779 | +8~12 | #243 两缺段补记（既有段零触） |
| `thincoder-cli/AGENTS.md` | 63 | ±1 | #246 两指针改指 |
| `docs/README.md` | 117 | ±10 | #230 + #245（登记 / 计数链收正） |
| `docs/core/design/CORE-UNIFICATION.md` | 1951 | +2~4 | #270（§2.8.1 补行 14 + 计数句） |
| `docs/core/design/MODEL-BENCH.md` | 1550 | ±8 | #281（决策格）+ #239（5 行宽折行；变更记录段 6 行零触） |
| `docs/vsc/design/VSC-DEBT.md` | 609 | ±1 | #234（R-6 两坐标） |
| `docs/core/design/CONSULTATION.md` | 256 | ±1 | #239（`:59` 改指 / 改述） |
| `docs/core/design/MEMORY.md` | 578 | ±1 | #239（`:47` 补全前缀） |
| `docs/core/design/TOOLS.md` | 992 | ±2 | #239（`:106` 补全前缀 / `:114` 改述） |
| `docs/core/design/AGENT-LOOP.md` | 588 | ±2 | #283（`:254` 句改述 + 变更记录一行） |
| `docs/core/design/CONTEXT-COMPACTION.md` | 790 | ±2 | #283（`:168` / `:695` 句改述 + 变更记录一行） |
| `docs/core/design/SESSION.md` · `BATCH-RECORD.md` | 801 · 387 | **0** | B 类零触碰（残差在册） |

**扫描面依赖行（受影响文件 = 实施轮开跑读数——设计轮天然不可闭合）**

- `#229`：面 = `docs/**/design/**`（排除 `_archive/` · `prompts/`；变更记录段外）——候选档集实施轮产出（N₀ 复扫记 §5）。
- `#232`：面 = 三产品活体面；本席实扫**档级分布（前 12）** = `thincoder-core/agent-tools/subagent-actions.mjs` 19 · `thincoder-cli/src/tui/agent-turn.mjs` 14 · `thincoder-cli/src/tui/subagent-blocks.mjs` 13 · `thincoder-core/agent-tools/subagent.mjs` 13 · `thincoder-core/agent-tools/subagent-async.mjs` 11 · `thincoder-vscode/src/agent.mjs` 11 · `thincoder-cli/src/tui/suspension-drive.mjs` 10 · `thincoder-vscode/src/extension/suspension.mjs` 10 · `thincoder-vscode/test/context-parity.test.mjs` 10 · `thincoder-core/agent-tools/subagent-run.mjs` 8 · `thincoder-cli/src/tui/tool-events.mjs` 7 · `thincoder-core/agent/dispatch.mjs` 7（余 68 档 1–7 处/档）。**开跑复扫为准**——处置集 = 复扫命中面（`bench/**` 除外）。

### 2.4 测试面（机检门 + 用例建议）

**门 1 · 文档门（零新增）**：`node scripts/doc-check.mjs`（仓根）——**开工前基线 = 悬空 8 / 行宽 13**（本席 2026-09-25 实跑 · 日志 `.thincoder/tmp/dc-hyg-ab.log`）；**落笔后复跑**：目标 = A 类 4 锚 + 5 行宽零复现、B 类残差在册（预期读数 = **悬空 4 / 行宽 8**）、**净增 0**。
**门 2 · 三端套件**：`thincoder-core` / `thincoder-cli` / `thincoder-vscode` 各 `npm test`（= `node test/run.mjs` 单入口）⇒ **fail 0**。

**用例建议（B 组 · 可机检优先）**：

| 条目 | 宿主档（现读行数） | 用例要点 |
|---|---|---|
| `#233` | `thincoder-cli/test/ledger-surface.test.mjs`（347） | LS-1 句柄形态：`startLedgerSurface({}).dispose` 为函数（载入成功 / 载入失败**两态**）；LS-2 exit 钩子实调：`dispose()` 不抛（现 TypeError 面回归锁）；烟测 = `node test-startup.mjs` exit 0 |
| `#227` | `thincoder-core/test/session-gc-stale.test.mjs`（297） | GC-D1 孤儿 `.d`（主文件不存在 + mtime 过期）⇒ 回收（rename 落 `sessions-trash`，原地消失）；GC-D2 主文件在 ⇒ 保留；GC-D3 未过期 ⇒ 保留；GC-D4 活跃槽 ⇒ 保留；GC-D5 负控：非 `.d` 名形（如 `.tmp`）走既有路径零变 |
| `#231` | `thincoder-vscode/test/session-release-shell.test.mjs`（222） | RL-1 工作区转空 ⇒ 旧 cwd 释放恰一次（`releaseClaimsAll` 桩计数 = 1）；RL-2 同 cwd 面 = no-op（返回 false——既有断言保回归） |
| `#238` | —（机检即可） | 取串比对：`thincoder-vscode/README.md:77` 第三列 = `thincoder-core/config-presets.mjs:17` 的 `model` 值 |
| `#243` | —（机检即可） | `node -e` 行扫：`^## \[0\.12\.(50|58)\]` 两段在场、序列单调递减 |
| `#235` | —（打包面） | `npx vsce ls`（或 package 后清单）零 `.log` 条目；`node thincoder-vscode/scripts/check-vsix.mjs` 既有断言不红 |

#### 2.2.7 `#227` 补充 —— 显式命令面清运腿（存量 1,119 通路）

**为何要第二条腿（本席实读推论）**：F1 残留面（`gcResidue`）按**单前缀**工作（启动窗外延迟拍 = 当前 cwd 前缀）⇒ 只治**本前缀未来新增**；存量孤儿跨多前缀，其中「槽文件 + manifest 双缺」者不进任何组面枚举 ⇒ 单靠 ① 无法下降存量计数。
**修法（② · 显式面）**：`thincoder-core/session-gc.mjs:260-272`（dry-run 段）增「孤儿 `.d` 清运候选」报告行（=`{prefix}.{N}.d` 主文件不存在者；计数 + 逐条列名照既有体例）+ `--confirm --all` 段（`:278-301`）纳入同候选面 ⇒ 逐条回收（rename 进 `sessions-trash/<批次>/`，同 ① 语义）。
**判据**：dry-run 输出含孤儿 `.d` 计数行（大候选夹具用例）；`--confirm --all` 后原地消失 + 回收批在场；既有 GC 用例零回归（不动判据与既有删除集）。

#### 2.2.8 `#283` · `#237` 邻域表述面收正（改法要点 —— 同 `#237` 复测句族）

**现状（三处现读 · as-of 2026-09-25）**：

| # | 坐标（现读） | 现文（摘引） |
|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP.md:254`（句跨 `:253-255`——§6.4 工具轮构造行） | 「**活体形状（请求尾 = tool）**：空串 / 真值被接受 · 缺字段 **400**（`must be passed back`）；「缺字段 **200** · 服务端不再回推理」= **设计轮形状（尾 = user）**读数」（形状限定见批次档 `docs/batches/2026-09-20-reasoning-echo-gap.md` §2.11 ①） |
| 2 | `docs/core/design/CONTEXT-COMPACTION.md:168`（§6.10 #9 形状限定段） | 「**活体形状（尾 = tool · 三站点产出形状）**实测 = 空串 **200** / 缺字段 **400**（逐字 `must be passed back`）· 真值 **200** · kimi 三形态全 **200** ⇒ 空串接受面双族已证（mimo 不可证——无凭证）」 |
| 3 | `docs/core/design/CONTEXT-COMPACTION.md:695`（§7 D-CC22 行） | 「**活体形状（尾 = tool）**实测 = 空串 / 真值 **200** · 缺字段 **400**（`must be passed back`）· kimi 三形态全 **200**（mimo 不可证）」 |

**问题（两时点事实并存）**：三处均载 **2026-09-20 探针事实**（活体形状缺字段 **400**）；**2026-09-22 复测**（三形态全 **200**——`must be passed back` 400 **NOT reproduced**）已推翻该断言 ⇒ 规范面不得两时点并存（形式判据族同 `#229`）。

**改法（同 `#237` 口径）**：按复测事实改述 = **现事实句 + 日期锚**；历史过程承各档**变更记录**；机制条文零改（`reasoningEcho:"required"` 决策不变——他批原裁「回显两态均安全」，只改**证据句**）；**随句收正两处**——「kimi 三形态全 200」保留；「mimo 不可证——无凭证」随 2026-09-22 实测（三形态全 200）收正为已证。

**形态样例（改前 → 改后）**（具体字句由实施轮按此形落）：

- 改前（样 = #2）：「**活体形状（尾 = tool · 三站点产出形状）**实测 = 空串 **200** / 缺字段 **400**（逐字 `must be passed back`）· 真值 **200** · kimi 三形态全 **200** ⇒ 空串接受面双族已证（mimo 不可证——无凭证）」
- 改后（样）：「**活体形状（尾 = tool · 三站点产出形状）**实测 = 三形态全 **200**（2026-09-22 复测——2026-09-20 的缺字段 400「`must be passed back`」**未复现**）」
- **同源说明**：`#237` 已落形 = `thincoder-core/model-specs.mjs:137-138` / `:304-307` 句族（「2026-09-22 re-probe: value / missing field / empty string all 200 — the 2026-09-20 "must be passed back" 400 was NOT reproduced」——他批已收正）；本条目 = 该句族在设计档面的同款收正。

**判据**：三处旧断言句零命中（`must be passed back` **全部命中须在「未复现 / NOT reproduced」句内**）+ 新句载日期锚（`2026-09-22`）+ doc-check 零新增。
**归属**：eng-designer（设计档面）；本设计轮零实施——实施轮落三处改述 + 各档变更记录一行。

### 2.5 验收对照（AC 逐条机检面）

**本设计轮（§2 自身）**

- **AC-1** §2 覆盖 20/20 且每条带现读坐标 ⇒ 机检 = 总表 **20 条目 / 19 行**（A 组 15 条〔14 行——`#239`+`#247` 并案〕+ B 组 5 条）且每行「处置 / 归属 / 判据」列非空。
- **AC-2** 归属逐条标注且取值 ∈ {eng-designer, eng-coder, 主 agent} ⇒ 机检 = 归属列取值域。
- **AC-3** 受影响文件表 + 扫描面依赖块在档 ⇒ 机检 = §2.3 存在（码 / 测档含现状行 + Δ；.md 含改点）+ 扫描面依赖两条（`#229` / `#232`）。

**实施轮（本批总门 · 交付前各跑一次）**

- **AC-4 文档门零新增**：`node scripts/doc-check.mjs`（开工前基线 = **悬空 8 / 行宽 13**）⇒ 落笔后 A 类 **4 锚 + 5 行宽零复现**、净增 0；预期残差 = **悬空 4 / 行宽 8**（全 B 类在册——§2.2.1 残差表）。
- **AC-5 三端套件全绿**：`thincoder-core` / `thincoder-cli` / `thincoder-vscode` 各 `npm test` ⇒ fail 0（含 #233 / #227 / #231 新用例）。
- **AC-6 逐条读回**：20/20 条 ⇒ 改后 `file:line` 回执（改后内容摘录）；无「未读回」行。
- **AC-7 零语义改**：折行 = 去空白等价（A 组文档面）；`#232` 改指 / 改述逐条附「改前 → 改后」对照；`#283` 三处改述附「改前 → 改后」对照（形态样例见 §2.2.8）；`#233` / `#227` / `#231` 行为面改动附「改前 / 改后」语义等价或判据出处论证。
- **AC-8 零触面机检**：`git diff --stat` **不含** `bench/**`（在飞避让）· `_archive/**` · 各档变更记录段 · `CHANGELOG.md` 既有段；台账外零触。
- **AC-9 档位面**：`thincoder-vscode/src/extension/chat-panel.mjs` ≤ **499**（硬限余量）；`thincoder-core/test/session-gc-stale.test.mjs` 若越 300 ⇒ **同批登记**（`SOFT_LINE_REGISTRY` + 注记）；`session-gc.mjs` 拆分立场（不拆 + 触发）在册。
- **AC-10 台账收正（主 agent 笔）**：`#237` 判已消 · `#283` 随批销项（表述面收正后）· `#239`/`#247` 裁定（含 `#203`/`#216` 相抵口径 = KD-3）· 20 条逐项销项或残差入册。

### 2.6 用例表（正常 / 边界 / 错误 —— B 组三条）

| # | 类型 | 输入 | 期望输出 |
|---|---|---|---|
| LS-1 | 正常 | `startLedgerSurface({})`（核可载入） | 返回值具 `dispose` 函数；调用不抛 |
| LS-2 | 错误 | 核载入失败（`loadCore` 拒绝——桩注入） | 同形空句柄；`dispose()` 不抛（N1 降级不崩） |
| LS-3 | 边界 | `dispose()` 先于核就绪（载入挂起） | 置位语义：就绪后补调核 `dispose`（无泄漏——周期未起或已清） |
| GC-D1 | 正常 | 孤儿 `.d`（主文件不存在 + mtime 过期） | 回收（rename 进 `sessions-trash`；原地消失，可回退） |
| GC-D2 | 边界 | `.d` 主文件在（非孤儿） | 保留（零动作） |
| GC-D3 | 边界 | 孤儿 `.d` 但 mtime 未过期（< 30 天） | 保留 |
| GC-D4 | 边界 | 孤儿 `.d` 但其槽 ∈ 活跃槽集合 | 保留（N1 现场） |
| GC-D5 | 错误 | 回收目标不可写 / rename 失败 | 跳过并计数（不 unlink 兜底——原目录零删除） |
| RL-1 | 正常 | 工作区转空（`workspaceFolders` → `[]`，旧 cwd = A） | `releaseClaimsAll(A)` 恰一次；guard 态 / 槽解绑 / agent 销毁零变 |
| RL-2 | 边界 | 转空后 `_cwd()` 与旧 cwd 同（桩） | `releaseOldCwdClaims` 返回 `false`（no-op——既有语义保回归） |

### 2.7 关键决策 · 边界 · 上抛 · 发现

**关键决策**

- **KD-1 `#233` = 端壳收敛为同步句柄**（核契约零改——核本已同步返回）。**被否**：① 全调用点 await（`process.on("exit")` 不可 await）② 仅文档化 async 契约 + 保留调用点 Promise 适配（消费面复杂化、别名面不能同步 dispose）。
- **KD-2 `#227` = 回收（rename）非直删 + 保留期 30 天**。**被否**：① `unlink` / `rm` 直删（目录承载记录存储本体——不可回退，破 D-SE36）② 7 天保留期（数据现场不按崩溃现场对待）。**补充**：显式面清运腿（§2.2.7）= 存量 1,119 的通路；若父侧取最小形（只做 ①），则存量通路收窄为「该前缀下次被访问」——**显式面腿保留（上抛 3——父侧裁定：确认保留）**。
- **KD-3 `#239`/`#247` 与 `#203`/`#216` 相抵裁定**：`#203`/`#216` 核销**合法**（其闭合口径 = 逐靶处置 + B 类残差登记——**非全仓清零**，先例 = hygiene-sweep §2.11/§6）；实况仍红 ≠ 漏施。但当前 8 锚中 **4 条**（`CONSULTATION.md:59` · `MEMORY.md:47` · `TOOLS.md:106`/`:114`）**不入任何登记** ⇒ 判**本批修**（A 类）；余 4 条 = B 类承接登记。**不返改**历史核销（记录面冻结）；台账侧「基线记录滞后 / 组合不符」（`#247` 所指）由主 agent 按本批实况收正。
- **KD-4 `#230` 归属面裁定**：`MODEL-SPECS.md` 登记入「**基准测试面**」组（1 → 2 档）。判据 = 与 `MODEL-BENCH.md` 同属模型面设计档（规格表 ↔ 基准套件互引）+ 同为 model 线批次建档。**备选（不取）**：单列新组（溢出一档组面）/ 归「其余」流程面（归属错位）。
- **KD-5 记录面零触 + B 类零触碰**：变更记录段 / `CHANGELOG` 既有段 / `_archive` / 批档正文一律零触碰（承 §3.8 判据）。
- **KD-6 `#229` / `#232` 以扫描方案 + 开跑读数落**：受影响文件行 = 扫描面依赖（设计轮天然不可闭合）；核销锚 = 候选表逐条闭合 / 靶面复扫残余 0。
- **KD-7 `#228` 以现口径为源**（`thincoder-vscode/webview/send.js:27-56`）：busy 提交 = 入队受理（容量 8）+ 待发送标记；满队 ⇒ 拒发 toast + 文本保留；挂起会内同面受理（busy-extend / queue-visible）。三档注释按此收正——**行为面零改**（纯注释）。

**边界（本批不做）**

- 不实施（本设计轮零产品码 / 零文档正文 / 零新档）；实施按 §2 分派（设计档面 → eng-designer · 产品码 / 测试 / 产品文本 → eng-coder · 台账 → 主 agent）。
- 不扩 20 条以外（`#283` 已随父侧裁定入批；在途他册 `#241` `#244` `#251` `#254` `#255` `#259` `#260` `#279` `#282` 等零触）。
- 不改判据面 / 不新增纪律语 / 不返改冻结批档与已收口批叙述面。
- 不触 `bench/**`（在飞避让——`#232` 扫出者明记避让 / 留待后续）；不触产品参照树（`thincoder-{cli,vscode}/docs/**`）。
- 不代主 agent 写需求档 / 不代 coder 落产品码 / 不改台账。

**上抛项（父侧裁定已落 · 2026-09-25 02:5x · 逐项标注）**

1. **B 类残差出路**（5 锚 + 8 行宽）：① 常驻登记（本设计取此——承 §3.8 既裁）② 迁入迁移期引文族（须父侧裁定射程——会触碰他批收口面文字）。**裁定 = 确认 ①**（本设计原取零改——常驻登记 + 消解路径 + 到期条件）。
2. **`#232` 处置口径**：全量 sweep（本设计取此——靶面复扫残余 0）vs 逐靶 + 残差披露（hygiene-sweep 原口径）。**裁定 = 确认全量 sweep**（本设计原取零改——口径差 285 vs ≈80 以实扫为准；判据 = 处置集闭合 + 三端套件绿）。
3. **`#227` 显式面清运腿**（§2.2.7）：保留（存量通路）/ 裁撤（最小形）。**裁定 = 确认保留**（本设计原取零改——存量 1,119 的通路；最小形不足以下降存量）。
4. **`#237` 邻域表述面**：`docs/core/design/AGENT-LOOP.md:254` · `CONTEXT-COMPACTION.md:168`/`:695` 载「活体形状（尾 = tool）缺字段 400」句（as-of 2026-09-20 探针事实，与 2026-09-22 mimo 复测并存）——两时点事实并存的表述面。**裁定 = 收正**（按 2026-09-22 复测事实改述）：本批 **+1 条 = `#283`**（19 → 20 条——落地见 §2.1 A 组行 · §2.2.8 · §2.3 文件表 · §2.5 AC · §2.9）。

**发现（报告义务 · 逐条在案）**

① **`#232` 口径差 + 台账坐标漂移族**：实扫 **288 处 / 80 档**（扣参照树 3 ⇒ 285）vs 台账 ≈80——**本席按实扫落表**，开跑复扫为准；同轮实测 5 组坐标漂移：`#234`（`:380` → `:381`）· `#237`（`:257-259` → `:137-138`/`:304-307`，且**他批已收正**）· `#281`（`:825` → `:930`）· `#233`（`:484-485` → `:210-214`）· `#228`（`test/files.mjs:57` → busy 口径行 `:61`）。
② **`#203`/`#216` 相抵** = 见 KD-3（核销合法 · 4 条新 A 类入本批 · 台账记录滞后面由主 agent 收正）。
③ **`chat-panel.mjs` 硬限压力**：现 **495 / 500**（余量 5 行）⇒ `#231` 注入 ≤4 行硬约束（超则停下上报）——该档后续另需拆分计划（本批只登记风险）。
④ **`#227` 存量规模**：孤儿 `.d` = **1,119 个**（跨前缀）——修法落地后自动面只覆盖「当前前缀」；存量通路 = §2.2.7 显式面腿（上抛 3）。
⑤ **`#229` 基线为时点值**：N₀ = 343（as-of 2026-09-22）——他批在途写入会漂 ⇒ 实施轮以开工前复扫为准（不以前值为工作量基数）。

**落笔记录（本席 · as-of 2026-09-25）**：机检基线实跑 = **悬空 8 / 行宽 13**（日志 `.thincoder/tmp/dc-hyg-ab.log`——输出面；仓内零落档）；20 条靶位逐条实读（坐标均现读）；受影响文件行数 = 本席实测（`wc -l` 口径）。**本席改动面 = 本批档 §2**（`docs/batches/**` 不在 doc-check 扫描域）⇒ **净增 0**。

### 2.8 落笔后自检（D6 读回收正 · 4 处形态瑕疵——零语义）

| # | 位置（本档 §2） | 原形 | 收正形 |
|---|---|---|---|
| 1 | §2.0「坐标口径」段（`:45`） | 「本批已实测 3 处漂移——见 §2.7 发现**②**」 | 「本批已实测 **5 组**坐标漂移——见 §2.7 发现**①**」 |
| 2 | §2.7「发现」标题行（`:285`） | `**发现（报告义务 · 逐条在案）`（加粗失配） | 「**发现（报告义务 · 逐条在案）**」 |
| 3 | §2.7 KD-2 末句（`:263`） | 「**请父侧确认 ② 保留**」（指代歧义——易读作 KD-2 被否②） | 「**请父侧确认显式面腿保留（上抛 3）**」 |
| 4 | §2.7 KD-7 首句（`:268`） | `**KD-7 \`#228\` 以**现口径\`send.js:27-56\` 为源**`（嵌套加粗失配） | 「**KD-7 `#228` 以现口径为源**（`thincoder-vscode/webview/send.js:27-56`）」 |

**自检读数（本席实跑 · 收笔时点）**：① §2 三块（2.0–2.1 / 2.2–2.4 / 2.5–2.7）逐块读回在档、无截断；② 悬空锚面 = 本档 §2 内自引坐标均为仓根完整路径或档内 `:行` 形态（`docs/batches/**` 不在 doc-check 扫描域 ⇒ 机检面零影响）；③ 行宽面 = 无 >300 字符单行；④ 机检复跑（本席 · 收笔后）= **悬空 8 / 行宽 13 同集**（本席改动仅落本批档 ⇒ **净增 0**）。

### 2.9 上抛 4 项裁定落地（父侧裁定 2026-09-25 · fix 轮）

**父侧裁定（2026-09-25 02:5x · 与 §1.2 同源）**：① B 类残差出路 = 确认 · ② `#232` 处置口径 = 确认全量 sweep · ③ `#227` 显式面腿 = 确认保留 · ④ `#237` 邻域表述面 = **收正**（按 2026-09-22 复测事实改述——本批 +1 条）。

| # | 裁定 | 落地（本档 §2） |
|---|---|---|
| ① | 确认（原取零改） | §2.2.1 残差登记表原样（常驻登记 + 消解路径 + 到期条件） |
| ② | 确认（原取零改） | §2.2.6 全量 sweep 口径原样 |
| ③ | 确认（原取零改） | §2.2.7 显式面腿原样（KD-2 补充句随裁定标注——§2.7） |
| ④ | **收正入批 = +1 条 `#283`**（19 → 20 条 · 本设计轮零实施） | §2.1 A 组表新增行 · §2.2.8（改法要点 + 形态样例 + 同源说明）· §2.3 文件表两行（`AGENT-LOOP.md` 588 / `CONTEXT-COMPACTION.md` 790）· §2.5 AC 计数收正 · §2.7 上抛面逐项标注 |

**计数链收正（条目集 19 → 20 连带 · 零语义）**：§2.0 总纲（A 15 + B 5 = 20 · 20/20）· §2.0 处置口径 2（靶位 20）· §2.1 标题（20 条）· A 组小标题（15 条）· §2.5 AC-1 / AC-6 / AC-7 / AC-10（19 → 20 · `#283` 入列）· §2.7 边界（不扩 20 条以外）· §2.7 落笔记录（靶位 20）。

**附带（一致性面 · 零语义）**：§2.8 四行收正**经本轮读回复核均未见于正文**（四行此前仍为原形）——本轮全部落正：行 1 §2.0 坐标口径（→「5 组坐标漂移——见 §2.7 发现①」）· 行 2 §2.7 发现标题（补加粗收尾）· 行 3 KD-2 末句（→「显式面腿保留（上抛 3——父侧裁定：确认保留）」）· 行 4 KD-7 首句（→「以现口径为源」+ 路径形态）。

**机检复跑（本席 · fix 轮落笔后 · 仓根实跑）**：`node scripts/doc-check.mjs` = **悬空 8 / 行宽 13**——条目同集、零新增（`AGENT-LOOP.md` / `CONTEXT-COMPACTION.md` 无新增命中）；`MODEL-BENCH.md` 变更记录段 6 行坐标较设计轮 +5 位移（他因在途写入——实施轮复读为准）。A 类修后预期读数（悬空 4 / 行宽 8）仍属实施轮面。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
