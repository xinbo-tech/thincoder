# 2026-09-25 · hygiene-ab
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 02:49「可以，先把A/B处理了。」——技术待办检查（02:47）之 A 组（文档/文本卫生 14 条）+ B 组（产品码小修 5 条）收正。
> 台账 = #229 / #230 / #232 / #234 / #237 / #238 / #239 / #243 / #245 / #246 / #247 / #270 / #280 / #281 / #283（A 组 · 文档卫生）+ #227 / #228 / #231 / #233 / #235（B 组 · 产品码小修）——共 20 条 · 归批。前情 = docs/batches/2026-09-22-hygiene-sweep.md（同族前批 · 体例参照）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
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

### 1.3 条目集收正（父侧 · 2026-09-25 03:0x）

**口径**：本批条目集 = **20 条**（19 + `#283`——父侧 02:5x 对上抛④的裁定「收正入批」，见 §1.2）⇒ **§1.1 标题与 A 组清单的「19 条」口径以本条为准**（该清单列的 14 条 A + 5 条 B 不变，`#283` 为第 15 条 A 项）；头部台账锚行已随改（含 `#283`）。

### 1.4 评审轮 2 裁定（父侧 · 全链授权内 · 2026-09-25 03:3x）

**轮 2 = changes-required（🔴 1 · 🔵 1）**——父侧逐条亲验后**全数受理**：

1. **🔴（`#234` 改靶）**：`R-6 ④` / `A13 ③` 的检查对象 = **`subagentApproval`**（非 `statusText`）。证据链（本席实读）：① 09-18 同批提取器件 `thincoder-vscode/.thincoder/tmp/emit-fwd.txt`（mtime 2026-09-18 16:51 · 53 行）`:38` = 「`subagentApproval` … `webview/chat.js:285`」· `:35` = 「`statusText` … `chat.js:248`」⇒ 原对**出生时同源于 `subagentApproval`**；② 原对出处 `docs/batches/2026-09-18-vsc-large-file-split.md:188` 以 :137/:155 发射位与「A13 必红」绑定 `subagentApproval`；③ `VSC-DEBT.md:372`「`subagentApproval` 的 host 面本面独有 ⇒ 本 🔴 的实质风险面」· `:383`「只漏 `subagentApproval` 一半 ⇒ … T-6 `wrongDisp` 红」；④ 设计轮 git 读得「:285 = `statusText`」为 **+37 行位移后状态**（同件 goal 286 / sub:* 293 / suspension 287 ↔ 现读折算预拆值逐行吻合）⇒ 误以漂移值为锚。**修正 = 改靶**：行 `WEBVIEW-PROTOCOL.md:403` + 消费位 `chat-messages.js:222`（表记）/ `:224`（现读）——两处同修（`:381` ④ + `:506` ③）。
2. **🔵（live/表记值差注）**：随修（两值同注，消 doc-check 不拦的 2 行差）。

**处置**：修正轮 **#67**（eng-designer）→ 核验 → 轮 3 复审（只验修正面）。轮 1 的 #2–#11（10 条）= 已修复，保持不动。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1（11 条）+ 轮 2（🔴1/🔵1）修正落地 + 上抛 4 项裁定落地 + 20 条处置面在档 + doc 面 8 条实施落毕（§2.14 · 机检 悬空 4 / 行宽 8 = 预期残差 · 2026-09-25））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批任务书总纲（A 组 15 + B 组 5 = 20 条 · 逐条处置）

**批次任务（覆盖）**：A 组 · 文档/文本卫生 **15 条**（`#229` `#230` `#232` `#234` `#237` `#238` `#239` `#243` `#245` `#246` `#247` `#270` `#280` `#281` `#283`——其中 `#239`+`#247` 同族并案）+ B 组 · 产品码小修 **5 条**（`#227` `#231` `#233` `#235` `#228`）= **20/20**（一条一处置行 · 一条一判据）。

**本轮性质**：设计轮（initial）——**零实施**（不写产品码 / 不改文档正文 / 不建新档）；本 §2 即实施轮的分派任务书，待 §3 评审 → §4 批准后按面分派。

**处置口径（全批统一）**：

1. **逐条收正 · 零新语义**（行为面改动以既有判据 / 现口径为准——改法全部取自本设计轮现读；不夹带新范围）。
2. **行为面改前必实读**（本设计轮已逐条实读 20 条靶位——读数见各行「现读」；实施轮落笔前**再读一次目标行**防在途漂移）。
3. **机检零新增**：`node scripts/doc-check.mjs`（开工前基线 = 悬空 8 / 行宽 13——本席 2026-09-25 实跑，日志 `.thincoder/tmp/dc-hyg-ab.log`）+ 三端套件全绿。
4. **在飞避让**：judge-fallback 批正在实施 `bench/**`（eng-coder #60）⇒ **本批受影响文件零含 `bench/**`**；`#232` 若扫出 `bench/**` 落点 ⇒ 明记避让 / 留待后续。
5. **记录面零触**：`_archive/**` · 批档正文 · 各档**变更记录段既有行** · `CHANGELOG.md` 既有段（`#243` 只**补缺段**，不改既有段）——一律零触碰；**本批新增条目行除外**（`#283` 两档各一行——`AGENT-LOOP.md` / `CONTEXT-COMPACTION.md`，见 §2.2.8 / §2.3）。

**归属（D1 写权矩阵）**：设计档面（`docs/core/design/**` · `docs/vsc/design/**` · `docs/README.md` 地图）= **eng-designer**；产品码 / 测试 / 产品文本（`thincoder-*/` 树）= **eng-coder**；台账 = **主 agent**；需求档命中项（若有）⇒ **零触碰 + 列表上抛**（主 agent 笔）。

**坐标口径**：标「现读」= 本席 2026-09-25 实读（`file:line` 均仓根完整路径形态）；标「台账 as-of」者 = 台账在册坐标，**实施轮必先复读**（本批已实测 5 组坐标漂移——见 §2.7 发现①）。

**落点说明**：本批无独立设计档——hygiene 族体例（承 `docs/batches/2026-09-22-hygiene-sweep.md` §2）：**批档 §2 即设计面**（含机制设计 / 受影响文件 / 测试面 / 验收对照 / 关键决策）。

### 2.1 总表（20 条 · 逐条：面 · 目标 file:line · 处置 · 归属 · 判据）

#### A 组 · 文档 / 文本卫生（15 条）

| id | 面 | 目标 file:line（现读 / 扫描面） | 处置 | 归属 | 判据（机检优先） |
|---|---|---|---|---|---|
| #229 | A-规范面标记族 | 扫描面 = `docs/**/design/**`（排除 `_archive/` · `prompts/`）+ 变更记录段外；N₀ 开跑复扫 | **修（全量二态复核）**：逐候选行二态判定——D8 两分（指向在位对象 = 出处注 ⇒ 照留；退役挂尸 ⇒ 删）+ 有裁定锚者转裁定语；记录面 / 变更记录段零触 | eng-designer | 候选表逐条二态闭合（无「待判」行）+ 复扫：退役挂尸类残余 = 0 + doc-check 零新增 |
| #230 | A-地图 | `docs/README.md:77-78`（现读：计数核对行「实档 55 = 本图登记 54 + 待补登 1」）· `:75`（组内含幻影档 `ENGINEERING-MODE.md`——盘上无）· `:80`（工作流档 `CORE-UNIFICATION.md` 位） | **修（增设按名对账步——评审轮 1 #7）**：① **按名对账**（实盘档集 vs 登记集——逐名比对）；② 收正幻影：`:75` 组撤 `ENGINEERING-MODE.md`（盘上无——组计数 11 → 10）；③ §4「基准测试面」组补登 `MODEL-SPECS.md`（1 → 2 档）；④ 写明工作流档 `CORE-UNIFICATION.md` **计入**实档计数的口径（登记位 = `:80` 行）；⑤ 计数核对行收正为 **实档 55 = 本图登记 55 + 待补登 0** | eng-designer | 按名对账成立（实盘档集 = 登记名集——逐名相等；幻影 / 漏登零）；待补登 = 0 按名对账后落；本席读数 = **55** |
| #232 | A-产品码注释（死指针族） | 三产品活体面——本席实扫 **288 处**（扣产品参照树 3 ⇒ **285**）· 台账口径 ≈80（差异见 §2.7 发现①） | **修（全仓引用面 sweep）**：逐处实读二态——现行 docs 树有对应节 ⇒ **改指**；无 ⇒ **改述**（去死 §号、保语义句）；`bench/**` · 产品参照树 · `_archive` · 记录面零触 + 残差披露 | eng-coder | 靶面复扫残余 = 0（处置集闭合；开跑读数记 §5）+ 三端套件绿 |
| #234 | A-设计档坐标 | `docs/vsc/design/VSC-DEBT.md:381`（现读 R-6 ④）· `:506`（A13 ③——**两处同修**）；台账 `:380` 已漂 | **修（处方重出——评审轮 1 #1 · 轮 2 改靶）**：行 = **`subagentApproval`**（现读 `docs/vsc/design/WEBVIEW-PROTOCOL.md:403`——② `panel-subagent-relay.mjs:217/:253` · ④ `活`）；消费位 = `webview/chat-messages.js:222`（表记）· `:224`（现读）——两值同注；`T-6 wrongDisp` 归属 → `thincoder-vscode/test/protocol-coverage.test.mjs:341-343`（断言行 `:343`）——重出依据 = §2.12 证据块（判别式锚定 + 09-18 提取器件 / 批档出处） | eng-designer | 两坐标同源（同一判别式 `subagentApproval`——行名锚定）+ 现读在盘（人工对读）+ doc-check 零新增 |
| #237 | A-产品码文书句 | `thincoder-core/model-specs.mjs:137-138` · `:304-307`（现读；台账 `:257-259` 已漂） | **判已消（他批已收正）+ 台账收正**：两处现文已载「2026-09-22 复测三形态全 200——`must be passed back` 400 **NOT reproduced**」⇒ 无残留句可改；台账坐标按现读收正 | 主 agent（台账收正） | 现读两处载复测句（grep `must be passed back` 命中均在「NOT reproduced」句内——本席实核） |
| #283 | A-设计档表述面 | `docs/core/design/AGENT-LOOP.md:254`（句跨 `:253-255`）· `docs/core/design/CONTEXT-COMPACTION.md:168` / `:695`（现读） | **修（按复测事实改述）**：三处「活体形状（尾 = tool）缺字段 400」句按 2026-09-22 复测事实收正（三形态全 200 · `must be passed back` 400 **NOT reproduced**）——现事实句 + 日期锚（同 #237 口径 · 改法见 §2.2.8）；历史过程承各档变更记录 | eng-designer | 三处旧断言句零命中（`must be passed back` **400** 断言形）+ 新句载日期锚（`2026-09-22`）+ doc-check 零新增 |
| #238 | A-产品文本 | `thincoder-vscode/README.md:77`（现读：`| DeepSeek | deepseek-v4-pro | …`） | **修**：默认模型按预设表单源收正为 **`deepseek-flash`**（源 = `thincoder-core/config-presets.mjs:17`） | eng-coder | 该行取值 = 预设表逐字（两处取串比对）；VSC 套件绿 |
| #239+#247 | A-门禁基线族 | **悬空 8**（现读全清单 = CONSULTATION.md:59 · MEMORY.md:47 · SESSION.md:789 · TOOLS.md:106/:114/:925/:931×2）+ **行宽 13**（BATCH-RECORD.md:358/:365 · MODEL-BENCH.md:219/:234/:279/:571/:587/:1484/:1485/:1488/:1497/:1498/:1499） | **修 + 登记**：判类第 0 步（`docs/core/design/DOC-DISCIPLINE.md` §3.8 判 A/B/C）→ A 类**修**（4 锚 + 5 行宽——逐条见 §2.2）+ B 类**零触碰 + 残差登记**（4 锚 + 8 行宽）；`#203`/`#216` 相抵裁定入 §2.7-KD3 | eng-designer | 开工前 / 落笔后复跑：A 类零复现；B 类残差逐条在册（携消解路径 + 到期条件） |
| #243 | A-产品文本 | `thincoder-cli/CHANGELOG.md`：0.12.58 缺段（插于 `## [0.12.59]`(:142) 块后、`## [0.12.57]`(:192) 前）；0.12.50 缺段（插于 `## [0.12.51]`(:306) 块后、`## [0.12.49]`(:353) 前） | **修**：补记两段最小条目（逐字 = 「维护性发布（本期无单独变更条目）」+ 日期取 registry 发布时间 **2026-08-29**（0.12.50）/ **2026-09-02**（0.12.58）——口径源 = `docs/RELEASE.md:224` 承位条目） | eng-coder | 两段标题在场（`^## \[0\.12\.(50|58)\]`）+ 序列仍单调递减；RELEASE §6.3 承位条目可指向已补记 |
| #245 | A-地图 | `docs/README.md:16`（§1 计数「cli 2 · vsc 8 = 10 档」）· `:67`（`core/requirements/` 行含已迁 `RELEASE.md`）· `:68`（`cli/` 2 档含已迁 `design/RELEASE.md`） | **修（完整盘点 + 计数链收正）**：实盘现读 = `docs/cli/` **12 档**（design 7 + requirements 5）· `docs/vsc/` **11 档**（design 8 + requirements 3）⇒ 登记表逐档重出 + §1 计数同改 | eng-designer | 登记表逐档 = 实盘档集（机检 = `git ls-files docs/cli docs/vsc` 对账）；计数 = 列表长度（D3） |
| #246 | A-产品文本（AGENTS.md） | `thincoder-cli/AGENTS.md:31`（现读：两处 `../docs/cli/design/RELEASE.md` + 节号 `§6.2` / `§3.2`） | **修**：两处改指 `../docs/RELEASE.md`；节号按 `docs/RELEASE.md` 现档节实读重指（双子句同改） | eng-coder | 该行两指针可解析（`docs/RELEASE.md` 在盘）+ 节号实存 |
| #270 | A-设计档注册表 | `docs/core/design/CORE-UNIFICATION.md` §2.8.1：子表 `:1108-1122`（现 13 行）· 计数句 `:1102` | **修**：子表补行 14 = `model-specs.mjs`（**326** · 拆点 = `MODEL_SPECS` 表块外提 · 落点 `thincoder-core/model-specs-table.mjs`（拟新增）· 消解窗口 = 越 500 硬限前或该档下次实质改动）；计数句复核收正 = 在册 **46** / 已登 **15**（口径 = `config.mjs` + 子表 14 行）/ 其余 **31**（= 46 − 15） | eng-designer | 计数 = `SOFT_LINE_REGISTRY` 实读条目数（本席实测 **46**——`thincoder-core/test/core-hygiene.test.mjs:81-94`）；登记行与盘上实测一致 |
| #280 | A-产品码/测试引旧句 | `thincoder-core/model-specs.mjs:193`（行注「D-11：能力位不跨名沿用」）· `thincoder-core/test/model-specs.test.mjs:318`（用例名同句） | **修**：按 `docs/core/design/MODEL-SPECS.md` §9.1 D-11 收窄后现口径改述两处引句（语义仍成立——只对字面收正，零行为改） | eng-coder | 两处引句 = §9.1 现文（人工对读）；核套件绿（用例名改字不破断言面） |
| #281 | A-设计档决策格 | `docs/core/design/MODEL-BENCH.md` **KD-36 行**（按行名锚定——实施轮 `grep -n 'KD-36'` 定位；现读 `:934`——`:930` = KD-32 行；台账 `:825` 已漂）——被否① 枚举「（partialMode / cacheMode / thinkApi / tempRange / noUsageStream）」 | **修**：枚举补 **`thinking`** / **`reasoningEcho`**（对读 `MODEL-SPECS.md` §13.3 实际沿用集；决策本体零改） | eng-designer | 该括注枚举 ⊇ §13.3 沿用集（机检 = 两串在场 + 人工对读表）+ doc-check 零新增 |

#### B 组 · 产品码小修（5 条）

| id | 面 | 目标 file:line（现读） | 处置 | 归属 | 判据（机检优先） |
|---|---|---|---|---|---|
| #233 | B-产品码（契约） | `thincoder-cli/src/tui/ledger-surface.mjs:28-32`（端壳）· `thincoder-cli/src/tui/index.mjs:210-214`（调用点——现为 structure-debt 批最小修，台账 `:484-485` 已漂） | **修**：端壳 `startLedgerSurface` 改**同步句柄**——恒返回 `{ dispose() }`（内部桥接核 Promise；dispose 早于核就绪 ⇒ 就绪后补调）+ 头注写明两端契约；调用点回退原同步形 | eng-coder | 新用例（宿主 = `thincoder-cli/test/ledger-surface.test.mjs`）断言 `typeof startLedgerSurface(…).dispose === "function"`（载入成功 / 失败两态均不抛）+ `node test-startup.mjs` exit 0 无 TypeError + CLI 套件绿 |
| #227 | B-产品码（存储泄漏） | `thincoder-core/session-gc.mjs:51-59`（`classifyResidue` 后缀表——**零 `.d`**）· `:104-115`（候选处理环 = `stat` + `unlink`） | **修**：后缀表补 `.d` **目录形**（`{prefix}.{N}.d`）+ 孤儿判据（主文件 `{prefix}.{N}` 不存在 ∧ mtime 越 30 天保留期）+ 删除 = **回收**（rename 进 `sessions-trash`，D-SE36 同语义——KD-2） | eng-coder | 新用例（宿主 = `thincoder-core/test/session-gc-stale.test.mjs`）：孤儿 `.d` ⇒ 回收；主文件在 / 未过期 / 活跃槽 ⇒ 保留；实地复跑：`~/.thincoder/sessions` 孤儿 `.d` 计数（1,119 → 下降） |
| #231 | B-产品码（同族接线） | `thincoder-vscode/src/extension/chat-panel.mjs:110-124`（工作区转空支路） | **修**：转空支路按 `#168②` 同款接 `releaseOldCwdClaims`——记旧 cwd（`clearProjectOverride` 前）→ 清槽 / agent 后释放（单点 = `panel-project.mjs:35`） | eng-coder | 新用例（宿主 = `thincoder-vscode/test/session-release-shell.test.mjs`）：转空 ⇒ 旧 cwd 释放恰一次；VSC 套件绿；**该档硬限余量 5 行**（现 495/500——注入 ≤4 行，超则停下上报） |
| #228 | B-注释（旧口径 3 档） | `thincoder-vscode/src/extension/panel-chat.mjs:5-9` · `thincoder-vscode/webview/loading.js:19-21`/`:63` · `thincoder-vscode/test/files.mjs`（台账 `:57` 已漂——busy 口径行现读 `:61`，实施轮 grep 定位） | **修**：按现口径收正——busy 提交 = **入队受理（容量 8）+ 待发送标记**；满队 ⇒ 拒发 toast + 文本保留；挂起会内同面受理（源 = `send.js:27-56`） | eng-coder | 三档旧口径短语零命中（`input is disabled` / `rejects, no queue` /「与拒发同判据」措辞——以现口径句替代）+ VSC 套件绿 |
| #235 | B-配置（打包面） | `thincoder-vscode/.vscodeignore`（现读 17 行 · 零 `.log` 规则） | **修**：补 `*.log` + `**/*.log` 两行（防同类未跟踪调试日志入包——原 `m10-vsc-fresh*.log` 已由父侧移出） | eng-coder | 打包清单零 `.log`（`npx vsce ls` 实跑逐条核）；`node thincoder-vscode/scripts/check-vsix.mjs` 既有断言不红 |

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

- **锚残差 4 条**（`SESSION.md:789` · `TOOLS.md:925` · `TOOLS.md:931`×2）：住变更记录段（已收口批叙述面）。**消解路径** = 随该档下次实质修订一并处置，或按 §4.2.10 迁入迁移期引文族（**须父侧裁定射程**——先例 = DOC-DISCIPLINE §3.8「不采纳」注）；**到期条件** = `docs/core/design/` 下一次板块级 sweep。
- **行宽残差 8 行**（`BATCH-RECORD.md:358/:365` · `MODEL-BENCH.md` 变更记录段 6 行）：同上口径（B 类零触碰——折行即改他批收口面文字）。
- **收口读数预期**：A 类 4 锚 + 5 行宽全清 ⇒ 复跑 = **悬空 4 / 行宽 8**（全 B 类在册）；本批改动面零新增。

#### 2.2.2 `#233` · 台账面 async 契约与调用点收正（机制设计）

**现状（现读）**：端壳 `thincoder-cli/src/tui/ledger-surface.mjs:28-32`——`startLedgerSurface(ctx)` 返回 **Promise**（`loadCore().then(core => core.startLedgerSurface(…)).catch(() => ({ dispose() {} }))`）；调用点 `thincoder-cli/src/tui/index.mjs:210` 取回 Promise，`:214` 以 `void Promise.resolve(ledgerSurface).then(s => s?.dispose?.())` 兜（structure-debt 批最小修——已不抛）。
**核契约（现读）**：`thincoder-core/ledger-surface.mjs:60-83`——核 `startLedgerSurface` **恒同步返回 `{ dispose }`**（内部 `setImmediate` 首扫 + `setInterval` 周期）。⇒ 缺口 = 端壳与核契约形态不一（Promise vs 句柄），调用点被迫写 Promise 适配。

**修法（KD-1 · 端壳收敛为同步句柄）**：

1. **头注写明两端契约**：「恒同步返回 `{ dispose }`——核句柄异步就绪（动态 import）后桥接；载入失败 ⇒ 空句柄（`dispose` 恒可调）；`dispose()` 早于核就绪 ⇒ 置位且**跳过启动**（核侧零调用——零周期；N1 降级不崩）」。
2. **实现**：`let disposed = false, handle = null` → `loadCore().then((core) => { if (!disposed) handle = core.startLedgerSurface({ ...ctx, colors: C }) }).catch(() => {})` → `return { dispose() { disposed = true; handle?.dispose?.() } }`。
3. **调用点回退原同步形**：`process.on("exit", () => ledgerSurface.dispose())`（同步、零 TypeError；`:211-213` 最小修注释同步收正为现契约句）。
4. **核契约零改**（核本已同步返回——`thincoder-core/ledger-surface.mjs` 不在本批写域）。
5. **测试注入缝（评审轮 1 #5 补）**：本档新增模块级 setter `_setLoadCoreForTest(fn)`（`null` ⇒ 回退原生 `loadCore`——`??` 默认；用例 `afterEach` 复位）——先例 = `thincoder-cli/test/ledger-surface.test.mjs:21-24`（`_setLedgerDirForTest` 缝族 + `:35-40` afterEach 复位）；两态（LS-1 / LS-2）与挂起态（LS-3）经此缝，无需真载核。

**被否候选**：① 全调用点 await（`process.on("exit")` 回调**不能 await** ⇒ 不可行）；② 仅文档化 async 契约 + 保留调用点 Promise 适配（每个新调用点重复适配、别名面（exit 钩子）不能同步 dispose ⇒ 消费面复杂化）。

**判据（机检）**：用例断言 `typeof startLedgerSurface({}).dispose === "function"`（**两态**：核可载入 / 载入失败）且不抛；`node test-startup.mjs` exit 0（**开工前实跑一次记读数（红 / 绿）**——判据按实况写「由红转绿」或「维持绿」；评审轮 1 #10）＋ CLI 套件绿。

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
| `thincoder-core/test/core-hygiene.test.mjs` | 188 | ±1（**条件性**——触发 = `session-gc-stale.test.mjs` 越 300 ⇒ `SOFT_LINE_REGISTRY` 补登 + 注记） | <300 ✓（评审轮 1 #9 补行） |
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
| `docs/README.md` | 117 | ±10 | #230（**含按名对账收正**——幻影档撤登 + `CORE-UNIFICATION.md` 口径写明）+ #245（登记 / 计数链收正） |
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
- `#232`：面 = 三产品活体面；本席实扫**档级分布（前 12）** = `thincoder-core/agent-tools/subagent-actions.mjs` 19 · `thincoder-cli/src/tui/agent-turn.mjs` 14 · `thincoder-cli/src/tui/subagent-blocks.mjs` 13 · `thincoder-core/agent-tools/subagent.mjs` 13 · `thincoder-core/agent-tools/subagent-async.mjs` 11 · `thincoder-vscode/src/agent.mjs` 11 · `thincoder-cli/src/tui/suspension-drive.mjs` 10 · `thincoder-vscode/src/extension/suspension.mjs` 10 · `thincoder-vscode/test/context-parity.test.mjs` 10 · `thincoder-core/agent-tools/subagent-run.mjs` 8 · `thincoder-cli/src/tui/tool-events.mjs` 7 · `thincoder-core/agent/dispatch.mjs` 7（余 68 档 1–7 处/档）。**开跑复扫为准**——处置集 = 复扫命中面（`bench/**` 除外）。**档位面（评审轮 1 #4 补）**：① 开跑复扫命中档集 = 受影响文件（逐档记现状 / Δ）；② 任一命中档越档位即登记（>300——`SOFT_LINE_REGISTRY` 或批 §5 明记）/ **停下上报**（越 500）——防 sweep 静默推越。

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
- **AC-8 零触面机检**：`git diff --stat` **不含** `bench/**`（在飞避让）· `_archive/**` · `CHANGELOG.md` 既有段；各档变更记录段 = **既有行零改**（**本批新增条目行除外**——`AGENT-LOOP.md` / `CONTEXT-COMPACTION.md` 各一行，见 §2.2.8 / §2.3）；台账外零触。
- **AC-9 档位面**：`thincoder-vscode/src/extension/chat-panel.mjs` ≤ **499**（硬限余量）；`thincoder-core/test/session-gc-stale.test.mjs` 若越 300 ⇒ **同批登记**（`SOFT_LINE_REGISTRY` + 注记）；`session-gc.mjs` 拆分立场（不拆 + 触发）在册；`#232` 扫描面**命中档集**同受档位约束（越 300 ⇒ 登记 · 越 500 ⇒ 停下上报——§2.3 扫描面依赖行）。
- **AC-10 台账收正（主 agent 笔）**：`#237` 判已消 · `#283` 随批销项（表述面收正后）· `#239`/`#247` 裁定（含 `#203`/`#216` 相抵口径 = KD-3）· 20 条逐项销项或残差入册。

### 2.6 用例表（正常 / 边界 / 错误 —— B 组三条）

| # | 类型 | 输入 | 期望输出 |
|---|---|---|---|
| LS-1 | 正常 | `startLedgerSurface({})`（核可载入） | 返回值具 `dispose` 函数；调用不抛 |
| LS-2 | 错误 | 核载入失败（`loadCore` 拒绝——桩注入，缝 = §2.2.2 注入缝） | 同形空句柄；`dispose()` 不抛（N1 降级不崩） |
| LS-3 | 边界 | `dispose()` 先于核就绪（载入挂起） | 置位语义：已置位 ⇒ **跳过启动**——核 `startLedgerSurface` 零调用（零周期；缝 = §2.2.2） |
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
- **KD-5 记录面零触 + B 类零触碰**：变更记录段**既有行** / `CHANGELOG` 既有段 / `_archive` / 批档正文一律零触碰（**本批新增条目行除外**——`#283` 两档各一行；承 §3.8 判据）。
- **KD-6 `#229` / `#232` 以扫描方案 + 开跑读数落**：受影响文件行 = 扫描面依赖（设计轮天然不可闭合）；核销锚 = 候选表逐条闭合 / 靶面复扫残余 0。
- **KD-7 `#228` 以现口径为源**（`thincoder-vscode/webview/send.js:27-56`）：busy 提交 = 入队受理（容量 8）+ 待发送标记；满队 ⇒ 拒发 toast + 文本保留；挂起会内同面受理（busy-extend / queue-visible）。三档注释按此收正——**行为面零改**（纯注释）。

**边界（本批不做）**

- 不实施（本设计轮零产品码 / 零文档正文 / 零新档）；实施按 §2 分派（设计档面 → eng-designer · 产品码 / 测试 / 产品文本 → eng-coder · 台账 → 主 agent）。
- 不扩 20 条以外（`#283` 已随父侧裁定入批；在途他册 `#241` `#244` `#251` `#254` `#255` `#259` `#260` `#279` `#282` 等零触）。
- 不改判据面 / 不新增纪律语 / 不返改冻结批档与已收口批叙述面。
- 不触 `bench/**`（在飞避让——`#232` 扫出者明记避让 / 留待后续）；不触产品参照树（`thincoder-{cli,vscode}/docs/**`）。
- 不代主 agent 写需求档 / 不代 coder 落产品码 / 不改台账。

**上抛项（父侧裁定已落 · 2026-09-25 02:5x · 逐项标注）**

1. **B 类残差出路**（4 锚 + 8 行宽）：① 常驻登记（本设计取此——承 §3.8 既裁）② 迁入迁移期引文族（须父侧裁定射程——会触碰他批收口面文字）。**裁定 = 确认 ①**（本设计原取零改——常驻登记 + 消解路径 + 到期条件）。
2. **`#232` 处置口径**：全量 sweep（本设计取此——靶面复扫残余 0）vs 逐靶 + 残差披露（hygiene-sweep 原口径）。**裁定 = 确认全量 sweep**（本设计原取零改——口径差 285 vs ≈80 以实扫为准；判据 = 处置集闭合 + 三端套件绿）。
3. **`#227` 显式面清运腿**（§2.2.7）：保留（存量通路）/ 裁撤（最小形）。**裁定 = 确认保留**（本设计原取零改——存量 1,119 的通路；最小形不足以下降存量）。
4. **`#237` 邻域表述面**：`docs/core/design/AGENT-LOOP.md:254` · `CONTEXT-COMPACTION.md:168`/`:695` 载「活体形状（尾 = tool）缺字段 400」句（as-of 2026-09-20 探针事实，与 2026-09-22 mimo 复测并存）——两时点事实并存的表述面。**裁定 = 收正**（按 2026-09-22 复测事实改述）：本批 **+1 条 = `#283`**（19 → 20 条——落地见 §2.1 A 组行 · §2.2.8 · §2.3 文件表 · §2.5 AC · §2.9）。

**发现（报告义务 · 逐条在案）**

① **`#232` 口径差 + 台账坐标漂移族**：实扫 **288 处 / 80 档**（扣参照树 3 ⇒ 285）vs 台账 ≈80——**本席按实扫落表**，开跑复扫为准；同轮实测 5 组坐标漂移：`#234`（`:380` → `:381`）· `#237`（`:257-259` → `:137-138`/`:304-307`，且**他批已收正**）· `#281`（`:825` → `:930`——设计轮读数；复读 `:934`，在途 +5 位移，行名锚定见 §2.1）· `#233`（`:484-485` → `:210-214`）· `#228`（`test/files.mjs:57` → busy 口径行 `:61`）。
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

### 2.12 评审轮 1 修正块（11 条逐条落地 · fix 轮 · 2026-09-25）

**对象** = 本档 §3 轮次 1（11 条 = 🔴1 / 🟡6 / 🔵4 · VERDICT `changes-required`）；**处置执行人 = 本席（eng-designer）**（父侧逐条裁定接受）；**本轮零实施**（只落 §2 设计面：处置处方 + 记录位；`docs/vsc/design/VSC-DEBT.md` 本体 / 产品码 = 实施轮面）。**射程**：20 条口径不变（零新增条目）· §1 零触 · `bench/**` 与在跑面零触。

**逐条落地（号 → 改动位 · 记录位 · 行号 as-of 本轮落笔 = `docs/batches/2026-09-25-hygiene-ab.md` §2 内）**

| 号 | 改动位 | 落地要点 |
|---|---|---|
| 1 | `:71`（§2.1 `#234` 行）+ 本节证据块 | 处方重出（轮 2 改靶重出——现行靶 = `subagentApproval`，单源见 §2.1 `#234` 行）：两处同修（VSC-DEBT `:381` ④ + `:506` ③）；T-6 归属 = `thincoder-vscode/test/protocol-coverage.test.mjs:341-343` |
| 2 | `:75`（§2.1 `#239` 行）· `:119`（§2.2.1 残差表）· `:321`（§2.7 上抛 1） | B 类锚计数 5 → **4**；同处 A 类「3 锚」→ **4**（并修——悬空 8 = 4 A + 4 B） |
| 3 | `:54`（§2.0 口径 5）· `:280`（AC-8）· `:307`（KD-5） | 记录面子句限定「**既有行**零改（本批新增条目行除外）」——三处同向收正 |
| 4 | `:219`（§2.3 `#232` 扫描面依赖行）· `:281`（AC-9） | 补两条（命中档集 = 受影响文件逐档记现状 / Δ；任一命中档越档位 ⇒ 登记（>300）/ 停下上报（越 500））+ AC-9 对读句 |
| 5 | `:130` · `:134` · `:138`（§2.2.2）· `:289` / `:290`（§2.6 LS-2 / LS-3） | 三处统一：已置位 ⇒ **跳过启动**（核侧零调用 / 零周期）；注入缝 = 模块级 setter（先例 = `thincoder-cli/test/ledger-surface.test.mjs:21-24`） |
| 6 | `:91`（§2.1 `#235` 行） | 命令统一 `node thincoder-vscode/scripts/check-vsix.mjs`（§2.4 同项已同形——零改） |
| 7 | `:69`（§2.1 `#230` 行） | 增设按名对账步；幻影 `ENGINEERING-MODE.md` 撤登；`CORE-UNIFICATION.md` **计入**口径写明（登记位 = `:80`）；「待补登 0」对账后落 |
| 8 | `:79`（§2.1 `#270` 行） | 计数按现行分解口径重出：在册 **46** / 已登 **15**（`config.mjs` + 子表 14 行）/ 其余 **31** |
| 9 | `:188`（§2.3 码 / 测档表） | 补条件性行 `thincoder-core/test/core-hygiene.test.mjs`（188 · ±1——触发 = `session-gc-stale` 越 300） |
| 10 | `:138`（§2.2.2 判据句） | 「现为前置红面」→ 开工前实跑记读数（红 / 绿），判据按实况写 |
| 11 | `:81`（§2.1 `#281` 行）· `:328`（§2.7 发现① 同言处） | 按行名锚定（`grep -n 'KD-36'`；现读 `:934`——`:930` = KD-32 行）；发现① 坐标补 as-of 标注（同源收正） |

**#1 证据（🔴 · 判别式锚定 · 证据源逐条列引 · 轮 2 重出 · 2026-09-25）**

1. **出生时原对（同源 = `subagentApproval`）**：同批提取器件 `thincoder-vscode/.thincoder/tmp/emit-fwd.txt`（mtime 2026-09-18 16:51 · 53 行）`:38` = 「`subagentApproval` | `panel-subagent-relay.mjs:161/:188` | `webview/chat.js:285` | `活`」· `:35` = 「`statusText` | … | `webview/chat.js:248` | `活`」⇒ 原对（`WEBVIEW-PROTOCOL.md:366` + 消费位 `chat.js:285`）**出生时同源**——对象 = `subagentApproval`（彼时正确）。
2. **原对出处**：`docs/batches/2026-09-18-vsc-large-file-split.md:188`——以「搬移后 `subagentApproval` 的 1-hop 提取面断裂——A13 必红」立题，并记 `WEBVIEW-PROTOCOL.md:366` 该行（host = `panel-callbacks.mjs:137`/`:155`）；`:137/:155` = 中继发射点（`VSC-DEBT.md:377` R-2：该档裸标识符位唯二）⇒ 该行 = `subagentApproval`（行锚与判别式一致）。
3. **git 读值 = +37 位移后状态（对象锚定判据）**：`git show 19c1917f~1:thincoder-vscode/webview/chat.js` 读得 `:285` = `case "statusText"` 系 09-18→09-22 区段 **+37 行位移后状态**——出生时 `:285` = `subagentApproval`（证据 1 实证）；同件 `goal`（286）/ `suspension`（287）/ `sub:*`（293）↔ 现读折算预拆值（323/324/330）逐行吻合（评审轮 2 复核）⇒ **对象锚 = 判别式**（行号仅 as-of 参考）。
4. **双半漂移 + 现读对化（本席亲读）**：行半 = `WEBVIEW-PROTOCOL.md:366`（09-18 批档所记）→ 现读 `:403` = 「`subagentApproval` | `panel-subagent-relay.mjs:217/:253` | `webview/chat-messages.js:222` | `活`」；消费半 = `chat.js:285` → 现读 `thincoder-vscode/webview/chat-messages.js:224` = `case "subagentApproval":  applySubagentApproval(m); break`（表记 `:222` · 现读 `:224`——与附带发现①「③ 列整体 −2」同款值差）。
5. **T-6 归属**：`thincoder-vscode/test/protocol-coverage.test.mjs:341` = `test("T-6 处置判定与在位形态同源…"`；断言行 `:343`（`assert.deepEqual(r.wrongDisp, [])`）——原句 `:339-341` 为漂移值，实施轮按新归属同改。
6. **两处同修**：`docs/vsc/design/VSC-DEBT.md:381`（§12.2.3 R-6 ④）+ `:506`（§12.8 A13 ③）——同对同落（实施轮）。

**附带发现（本轮实读所出 · 报告义务 · 不入本批射程）**

1. **`WEBVIEW-PROTOCOL.md` §12 表列漂移**：live emit vs 现表——③ 列整体 −2（`statusText` `:187`/`:185` · `aborted` `:104`/`:102` · `subagent` `:221`/`:219` · `digest` `:184`/`:182`…）；② 列亦多值漂移（如 `panel-turn-loop.mjs` `:154/:169` vs `:150/:165`）⇒ 全表重出（`--emit` 刷新）属该档维护面——本批零触 / 留待其维护轮。
2. **`#232` 扫描面命中档（含档位面）**：见 §2.3 扫描面依赖行——命中档集开跑复扫产出；档位约束（>300 登记 / 越 500 停下上报）已入该行与 AC-9。

**机检复跑（本席 · 落笔后 · 仓根实跑）**：`node scripts/doc-check.mjs` = **悬空 8 / 行宽 13**——同集零新增（`docs/batches/**` 不入锚列报面 ⇒ 本档改动面净增 **0**；行宽 6 行坐标 +5 位移 = 他因在途写入，计数不变）。

### 2.13 评审轮 2 修正块（🔴1 改靶 + 🔵1 · fix 轮 2 · 2026-09-25）

**对象** = 本档 §3 轮次 2（🔴1 改靶 + 🔵1 值差注；VERDICT `changes-required`）；**处置执行人 = 本席（eng-designer）**（父侧逐条受理）；**本轮零实施**——只落 §2 处方 / 记录面（`docs/vsc/design/**` 正文零触——实施轮面 = VSC-DEBT 两处同修）。**射程**：20 条口径不变 · §1 零触 · 轮 1 的 #2–#11（10 条）零动 · `bench/**` 与在跑面零触。

**#234 改靶（🔴）**：检查对象 = **`subagentApproval`**（≠ `statusText`）——R-6 ④ / A13 ③ 按**判别式**锚定重出；处方面 = §2.1 `#234` 行 + §2.12 证据块（同源重出）；实施轮面 = `docs/vsc/design/VSC-DEBT.md:381`（§12.2.3 R-6 ④）+ `:506`（§12.8 A13 ③）——两处同修不变。
**值差注（🔵）**：消费位两值同注 = `webview/chat-messages.js:222`（表记）· `:224`（现读）——随处方面同落。

**逐条落地（号 → 改动位（file:line）· 记录位 = 本档 §2 内 · 行号 as-of 本轮落笔）**

| 号 | 改动位 | 落地要点 |
|---|---|---|
| 1 | `docs/batches/2026-09-25-hygiene-ab.md:80`（§2.1 `#234` 行） | 行改靶 = `subagentApproval`（现读 `WEBVIEW-PROTOCOL.md:403`——② `panel-subagent-relay.mjs:217/:253` · ④ `活`）；消费位 = `chat-messages.js:222`（表记）· `:224`（现读）两值同注；判据行「同一判别式」`statusText` → `subagentApproval` |
| 2 | `docs/batches/2026-09-25-hygiene-ab.md:393-400`（§2.12 证据块） | 重出为判别式锚定（出生时同源 = `subagentApproval` · +37 位移读值判据 · 双半漂移 · 现读对化）；「原对从未同源」结论删除 |
| 3 | 同上（证据块 1 / 2 两条） | 证据源逐条列引：`thincoder-vscode/.thincoder/tmp/emit-fwd.txt`（mtime 2026-09-18 16:51）· `docs/batches/2026-09-18-vsc-large-file-split.md:188` |
| 4 | 本节（§2.13）+ §2 状态行（`batch` 工具刷新） | 本轮落地记录在档；状态行刷新（含评审轮 2） |

**附带（一致性面 · 零语义 · 报告项）**：① §2.12 表行 1（本档 `:381`）靶表述收正——由轮 1 靶（`statusText`）改为「现行靶 = `subagentApproval`，单源见 §2.1 `#234` 行」（防错靶残留复读为在办工单）；② 原证据块 `:506` 节标 `§12.4` 系笔误——按 VSC-DEBT 现档节标题收正为 `§12.8`（A13 行所在节）。

**机检复跑（本席 · 本轮落笔后 · 仓根实跑）**：`node scripts/doc-check.mjs` = **悬空 8 / 行宽 13**——同集零新增（本档 `docs/batches/**` 不在扫描域 ⇒ 净增 0；本节 append / 状态行同理）。

### 2.14 文档面实施记录（initial 实施轮 · eng-designer · 2026-09-25）

**性质**：doc-face 8 条落地（`#229` · `#230` · `#234` · `#239`+`#247` · `#245` · `#270` · `#281` · `#283`）。**写域** = 设计档 + 项目地图（`docs/README.md`）；**零触面**：产品树（`thincoder-*/**`）· `bench/**` · 记录面（批档正文 / `_archive/**` / 各档**既有**变更记录行）· 需求档 · 台账。逐处落笔前均先复读目标行（开工读数定位）。

**逐条落位（号 → 改动 file:line · 读回「改前 → 改后」摘要）**

| 条 | 改动位（file:line——改后现读） | 读回（改前 → 改后） |
|---|---|---|
| #230+#245 | `docs/README.md:16` · `:67` · `:68-69` · `:70` · `:75` · `:76` · `:77` · `:80` · `:94-95`（变更记录） | §1 部分档 **10 → 23 档**（`cli/` 12 = design 7 + requirements 5 · `vsc/` 11 = design 8 + requirements 3——实盘对账）；§4 **按名对账**：幻影 `ENGINEERING-MODE.md` 撤登（流程组 11 → 10）· `MODEL-SPECS.md` 补登基准测试面（1 → 2）· 工作流档 `CORE-UNIFICATION.md` 计入口径写明（登记位 = `:80`）；计数核对行 **实档 55 = 登记 55 + 待补登 0**；迁移批迁入档 `cli/` / `vsc/` 行逐档重出 （12 / 11）· `RELEASE.md` 死指针收正（`core/requirements/` 3 → 2 档） |
| #234 | `docs/vsc/design/VSC-DEBT.md:381`（R-6 ④） · `:506`（A13 ③） · 变更记录 `:611-613` | **两处同修**：改靶 = **`subagentApproval`** 行——`WEBVIEW-PROTOCOL.md:366` → **`:403`**；消费位 `webview/chat.js:285` → **`thincoder-vscode/webview/chat-messages.js:224`（表记 `:222`——两值同注）**；T-6 归属 `:339-341` → **`thincoder-vscode/test/protocol-coverage.test.mjs:343`**（断言行）。改后盘上对读 ✓（`:403` = subagentApproval 行 · ② `panel-subagent-relay.mjs:217/:253` · ④ `活`；`chat-messages.js:224` = `case "subagentApproval"…`；测试 `:341` 标题 / `:343` 断言） |
| #239+#247 | `docs/core/design/CONSULTATION.md:59` · `MEMORY.md:47` · `TOOLS.md:106` · `TOOLS.md:114`（+ 各档变更记录行） | A 类 4 锚全清：CONSULTATION 死坐标 `src/advisor/tools.mjs:29-37`（盘上无）→ **改指**核现体 `thincoder-core/advisor/loop.mjs:31`（承接实核 = `grep code_search thincoder-core/advisor/*.mjs` 命中）；MEMORY / TOOLS 两处裸名 → **补全仓根路径** `thincoder-vscode/src/tools/code.mjs`；TOOLS「归属提示」行路径形态**去形改述**（「checkpoint / code 两行（VSC 侧单端档对位行）」指称） |
| #270 | `docs/core/design/CORE-UNIFICATION.md:1102-1103`（计数句折行） · `:1106` · 子表 `:1123`（行 14 新） · 变更记录 `:1789-1790` | 子表 **补行 14** = `model-specs.mjs`（**326**——拆点 / 落点 `thincoder-core/model-specs-table.mjs`（拟新增）/ 消解窗口，逐字承 `MODEL-SPECS.md` §13.6）；计数句 **在册 34 → 46 · 已登 14 → 15 · 后 13 → 14 档 · 其余 20 → 31**（口径 = `config.mjs` + 子表 14 行；`SOFT_LINE_REGISTRY` 实读 = **46** 条——`thincoder-core/test/core-hygiene.test.mjs:81-94` 逐条清点）；子表头补「bench 参数批补 1 档」 |
| #281 | `docs/core/design/MODEL-BENCH.md:944`（KD-36 行） | 被否① 枚举 **补 `thinking` / `reasoningEcho`**（对读 `MODEL-SPECS.md` §13.3 沿用集——glm-4.5-air 行 `thinking`（族沿用）+ `reasoningEcho: optional`（族沿用）在场）；决策本体零改 |
| #283 | `docs/core/design/AGENT-LOOP.md:254` · `CONTEXT-COMPACTION.md:168` · `:695`（+ 两档变更记录行） | 三处「活体形状缺字段 **400**」证据句按 **2026-09-22 复测**改述 = **现事实句 + 日期锚**：「实测 = 三形态全 **200**（2026-09-22 复测——2026-09-20 的缺字段 400「`must be passed back`」**未复现**）」；「kimi 三形态全 200」保留 ·「mimo 不可证——无凭证」→ 已证（同复测）；机制条零改（`reasoningEcho:"required"` 决策不变） |
| #239 行宽 5 行 | `docs/core/design/MODEL-BENCH.md:219-220` · `:235-237` · `:282-283` · `:575-578` · `:594-597` | 五处超宽行（333 / 408 / 324 / 480 / 557 字符）**按语义折行**——内容逐字零变（插入换行；编号列表续行依档内 2 空格 / 4 空格承接体例） |
| #229 | `docs/core/design/CONFIG.md:113` · `DOC-DISCIPLINE.md:239` · `:240` · `:241`（+ 两档变更记录行） | 处置 4 行：CONFIG「『评审不排队』表述已废」→ **转裁定语**「排队口径 = 异 scope 入队 / 同 scope 仍拒（2026-09-16 批 8 ED-4 裁定）」；DOC-DISCIPLINE OBL 表**去修订式残句三处**（「旧记『全树 19』作废」·「旧记『= OBL-1b ② 分量（23）』作废」·「旧记『收正 7 ∥ 零改 19』的切分作废」整删——现行判据句照留） |

**`#229` 全量二态复核读数**

- **N₀ 复扫（开工前）** = **658 候选行**（扫描面 = `docs/**/design/**` 扣 `_archive/` · `prompts/`；扣变更记录段）——族：① 修订式括注（收正 / 改判 / 修订）= 289 行 · ② `~~` = 5 行 · ③ 尸语词面（作废 / 挂尸 / 墓志 / 裁撤 / 已废 / 废除 / 失效 / 退场 / 推翻 / 死名）= 388 行。口径较 09-22 基线（343）**放宽**（扩面 = 更保守的复核射程；实施轮以开工前复扫为准）。**全量逐行二态读毕**（A 段 133 / B 段 281 / C 段 244——三段逐行实读）。
- **二态闭合**：出处注类 · 记录面（不并项 / 历史沿革块 / 变更记录段）· 机扫豁免族（ⓐ–ⓓ）· 处置已载形（退场注记 + 来源指针 / 迁移期引文标记）= **654 行 ⇒ 照留**；**退役挂尸形 = 4 行 ⇒ 处置**（上表 `#229` 行）。**「待判」行 = 0**；`~~` 5 行全豁免族（ⓐ 规则反例 ×4（D8 块自引）× ⓑ markdown 语法描述 ×1（`docs/cli/design/TUI.md:217`））。
- **残余 = 0**（退役挂尸类无未处置者；出处注类照留）。

**机检读数（前后 · 仓根实跑 `node scripts/doc-check.mjs`）**

| 面 | 开工前（复跑） | 落笔后 | 判 |
|---|---|---|---|
| 悬空 | **8**（A 类 4：CONSULTATION:59 · MEMORY:47 · TOOLS:106/:114；B 类 4：SESSION:789 · TOOLS:925/:931×2） | **4**（全 B 类在册：`SESSION.md:789` · `TOOLS.md:927` · `TOOLS.md:933`×2——TOOLS 两行随本批 +2 位移） | A 类**零复现** ✓ · 净增 **0** ✓ |
| 行宽 | **13**（A 类 5：MODEL-BENCH :219/:234/:279/:571/:587；B 类 8：BATCH-RECORD :358/:365 · MODEL-BENCH 变更记录段 6 行） | **8**（全 B 类在册：BATCH-RECORD:358/:365 · MODEL-BENCH:1499/:1500/:1503/:1512/:1513/:1514） | A 类**零复现** ✓ · 净增 **0** ✓ |

首轮落笔后曾出新 5 行宽 + 2 悬空（本席新写行自身未达 D4 / 行宽纪律）⇒ **就地收正**（长行折行 + 变更记录行内「改前」裸名形态改中文描述——承 D4 细则「写反例请用中文描述，不写裸路径字面」）；复跑即达上表读数。

**受改动档行数（`wc -l` 口径 · 前 → 后）**：`docs/README.md` 117→**121** · `VSC-DEBT.md` 609→**613** · `CORE-UNIFICATION.md` 1952→**1957** · `MODEL-BENCH.md` 1558→**1570**（含 5 处折行 +10 行）· `AGENT-LOOP.md` 588→**590** · `CONTEXT-COMPACTION.md` 790→**792** · `CONSULTATION.md` 256→**257** · `MEMORY.md` 578→**580** · `TOOLS.md` 992→**994** · `CONFIG.md` 150→**151** · `DOC-DISCIPLINE.md` 1319→**1321**。

**零扩面确认**：本席改动面 = 上列 **11 档**（对照 `git status`——同刻在树的 `thincoder-*/**` 与 `bench/results/**` 改动 = **码面实施轮（eng-coder）在飞**，非本席）；`bench/**` · `_archive/**` · `CHANGELOG.md` · 批档正文 · 各档**既有**变更记录行 = **零触**（本批新增条目行 = AC-8 限定句唯一例外）。

**上抛 / 报告项**

1. **需求档命中项 = 空**（#229 预扫零命中——需求档零触碰）。
2. **附带发现（非阻塞 · 留待后续批）**：① `docs/core/design/`「其余 33 档」标题计数经「幻影撤登 −1 + `MODEL-SPECS.md` 补登 +1」后净 0（仍成立，无需改）；② `WEBVIEW-PROTOCOL.md` §12 表列漂移（§2.12 附带发现①在册）未在本轮落——属该档维护面。

**§2.14 补正（同轮 · 本席）**：上条 1「需求档命中项 = 空」应改为——**需求档候选命中 = 21 处**（按 #229 族面复扫 `docs/**/requirements/**`（54 档 · 扣 `_archive/`）词面 = 作废 / 裁撤 / `~~`；坐标逐条：`docs/core/requirements/` 的 `ADVISOR-CONVERGENCE.md:134`/`:151` · `AGENT-LOOP.md:214` · `CORE-UNIFICATION.md:100`/`:119`/`:130`/`:141` · `ENG-TOKEN-BINDING.md:31` · `ENGINEERING-MODE-V2-SPEC-LEDGER.md:62` · `ENGINEERING-MODE-V2-SPEC-MACHINE-CHECK.md:11` · `ENGINEERING-MODE-V2.md:466`/`:682` · `STRUCTURE-DEBT.md:59` · `TESTING.md:126`/`:132`/`:140`/`:149`/`:188`/`:198` · `VERIFY-REDESIGN.md:10` · `docs/vsc/requirements/WEBVIEW.md:34`）。逐条性质 = 机制语（如「轮作废」「不连坐作废」「check-ledger 作废」）/ 日期锚 note（TESTING 2026-09-15 改判轮族）/ 处置已载形（「已作废原型设计……需求面由现行四机制承接」）——**未见需动作的退役挂尸残余**；**需求档 = 主 agent 笔 ⇒ 本席零触碰**，清单随交付报告上抛。设计面扫描面（`docs/**/design/**`）结论不变。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审轮 · 对象 = 批档 §2（20 条逐条处置 / 受影响文件 / 测试面 / AC-1..10 / KD-1..7 / 上抛 4 项落地）** · 评审面 = 独立设计评审（对 §2 所引靶位做定点只读实读以核「现读」断言；未跑 git diff · 未改任何档）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 清晰性（目标坐标） | 🔴 | `#234` 两新坐标不同源（不可能同时对）：设计把 `docs/vsc/design/VSC-DEBT.md:381` R-6 ④ 改为「`WEBVIEW-PROTOCOL.md:367` + 消费位 `webview/chat-messages.js:185`」，但盘上 `:367` = `agentSettings` 行（消费位 `webview/chat-messages.js:149`；`:366` 现读 = `aborted` 行），而 `webview/chat-messages.js:185` 只属 `statusText` 行、该行现读 = `WEBVIEW-PROTOCOL.md:400`。R-6 ④ 的「该行 ↔ 消费位」必须同源 ⇒ 照此落笔会在同批新造一处错指，且 doc-check（只验可解析）与设计判据（只验「两坐标在盘」）均拦不住（`chat.js:285` 已死面本身成立：`chat.js` 现读 148 行） | 以消费位为锚重定行号（或反向重定消费位），落笔前把（行号 ↔ 消费位）同源对当场对读；同行的 `T-6 wrongDisp = :339-341`（未标归属档；若指 `thincoder-vscode/test/protocol-coverage.test.mjs`，现读 = `:341-343`）一并复核 |
| 2 | 清晰性（计数） | 🟡 | `#239`+`#247` B 类锚计数与自身枚举/AC 相抵：§2.1 行写「5 锚 + 8 行宽」、§2.2.1 残差表写「锚残差 **5** 条」，但其枚举（`SESSION.md:789` · `TOOLS.md:925` · `TOOLS.md:931`×2）逐条清点 = **4**——与「悬空 8 − A 类 4 = B 类 4」及 AC-4 预期「悬空 4」一致（`SESSION.md:789` / `TOOLS.md:925` / `TOOLS.md:931` 实读均住变更记录段） | 统一为 4（或按开工前 doc-check 复跑读数重出该计数），并同步 §2.1 / §2.2.1 / AC-4 三处字面 |
| 3 | 验收标准 | 🟡 | AC-8 与设计自身计划不可能同真：AC-8 判「`git diff --stat` **不含**……各档变更记录段」（同向措辞另见 §2.0 口径 5 / KD-5「零触碰」），而 §2.2.8 归属句与 §2.3 的 Δ 明写 `AGENT-LOOP.md` / `CONTEXT-COMPACTION.md` 各「+ **变更记录一行**」——落笔后 diff 必含该两档变更记录段新增行 | 把 AC-8 该子句限定为「既有变更记录**行**零改（本批新增条目行除外）」，或裁掉「变更记录一行」并删对应 Δ（二者取一） |
| 4 | 受影响文件 / 档位 | 🟡 | `#232` sweep 面（本席实扫口径 ≥80 档产品码；抽检 `thincoder-core/agent-tools/subagent-actions.mjs` 命中 19 行与设计一致）在受影响文件表**零行落位**——无现状行数 / Δ，也无「命中档越 300/500 档位 ⇒ 登记 / 停下上报」类约束；AC-9 档位面只覆盖 3 档（chat-panel · session-gc-stale · session-gc）。扫描面依赖（KD-6）可接受，但档位安全约束缺失 | 扫描面依赖块补两条：① 开跑复扫命中档集 = 受影响文件（逐档记现状/Δ）；② 任一命中档越档位即登记（>300）/ 停下上报（越 500），防 sweep 静默推越 |
| 5 | 清晰性 / 可行性（用例） | 🟡 | `#233` 契约三处不同源：头注写「dispose 早于核就绪 ⇒ 置位、**就绪后补调**」，实现句写 `if (!disposed) handle = core.startLedgerSurface(…)` = 已置位即**跳过启动**（不产生补调），LS-3 期望又是「就绪后补调核 `dispose`（无泄漏——周期未起或已清）」两可；且 LS-2/LS-3 的「桩注入」未定义机制（`loadCore` 档内私有；同族先例 = `thincoder-cli/test/ledger-surface.test.mjs:21-24` 的模块级 setter 缝） | 三处统一为一种语义（建议按实现形态：已置位 ⇒ 跳过启动 = 核侧零调用 / 无周期，并据此写 LS-3 断言），并写明注入缝形态（模块级 setter + 默认回退 + 用例后复位） |
| 6 | 清晰性（命令路径） | 🟡 | `#235` 验证命令两处路径不一：§2.1 写 `node scripts/check-vsix.mjs`（仓根 `scripts/` 下无此档——全仓实读仅存 `thincoder-vscode/scripts/check-vsix.mjs`），§2.4 写 `node thincoder-vscode/scripts/check-vsix.mjs` | 以盘上实存路径统一（`thincoder-vscode/scripts/check-vsix.mjs`） |
| 7 | 文档状态（#230 编辑面） | 🟡 | `#230` 的收官声明与登记表名级实况不符：`docs/README.md:75` 登记 `ENGINEERING-MODE.md`，该档盘上不存在（实读 ENOENT；`docs/core/design/` 55 档中仅 `ENGINEERING-MODE-V2.md`）；`CORE-UNIFICATION.md` 在盘但不在任何登记组（仅 `:80` 提及）。按「逐组计数对账」幻影 −1 与未登 +1 相抵 ⇒「55 = 55」可过，但「待补登 = 0」按名对账不成立 | `#230` 内加一步**按名**对账（实盘档集 vs 登记集），按实况收正上述两处（或把差异随批登记），再落「待补登 = 0」 |
| 8 | 数值一致性 | 🔵 | `#270` 替换计数与现行句口径不自洽：现行句「已登 14 档（`config.mjs` + …——后 13 档见下子表）」对应子表现读 13 行（`CORE-UNIFICATION.md:1108-1122` 实读；`SOFT_LINE_REGISTRY` = 46 条已实核 ✓、`:1102` 现行「在册 34」确为 stale ✓），补 `model-specs.mjs` 一行后按同口径应为 15（其余 31），设计给「已登 14 / 其余 32」 | 实施轮按同一分解口径重出（14/32 或 15/31），并在句内写明计数口径 |
| 9 | 受影响文件（缺失行） | 🔵 | `#227` 的条件性编辑未入表：`thincoder-core/test/session-gc-stale.test.mjs` 若越 300 ⇒ 同批登记 `thincoder-core/test/core-hygiene.test.mjs`（`SOFT_LINE_REGISTRY` + 注记，见 AC-9）——该档（188 行）不在受影响文件表内 | 补一行条件性 Δ（±1，触发 = session-gc-stale 越线） |
| 10 | 清晰性（现态） | 🔵 | `#233` 判据句「`node test-startup.mjs` exit 0（**现为前置红面**）」与 §2.2.2 现状句「structure-debt 批最小修——**已不抛**」并置（`test-startup.mjs` 在盘 ✓）——现态红 / 绿两说 | 开工前实跑一次并记读数，判据按实况写「由红转绿」或「维持绿」 |
| 11 | 坐标漂移 | 🔵 | `#281` 现读坐标已漂：`MODEL-BENCH.md:930` 现读 = **KD-32** 行；KD-36 行现读 = `:934`（被否① 枚举「partialMode / cacheMode / thinkApi / tempRange / noUsageStream」在该行在场 ✓）；该档总行数亦自表内 1550 漂至 ≈1559（在途写入，设计 §2.9 已声明 +5 位移） | 落笔按行名锚定（grep `KD-36`）而非行号；判据（两串在场 + 人工对读）不受影响 |

**计数**：🔴 1 · 🟡 6 · 🔵 4（共 11）。
**抽检已核通过面**（只读实读，非全量）：ledger-surface 端壳/核契约（`thincoder-cli/src/tui/ledger-surface.mjs:28-32` Promise 形 · 核 `thincoder-core/ledger-surface.mjs:60-83` 同步句柄）· `chat-panel.mjs` 三落点（`:98` / `:110-124` / `:140`）+ 495 行口径 · `panel-project.mjs:35`/`:59`（`releaseOldCwdClaims` 同 cwd false no-op）· `session-gc.mjs` 后缀表 `:51-59` / 候选环 `:104-115` / dry-run `:260-272` / confirm `:278-302` · `session-stale.mjs:51` `trashRootFor` · `session-segments.mjs:13` `.d` · `SESSION.md` D-SE34 `:417` / D-SE36 `:446` · 锚位（`CONSULTATION.md:59` · `MEMORY.md:47` · `TOOLS.md:106`/`:114`/`:925`/`:931` · `SESSION.md:789`）· `docs/README.md:16`/`:67`/`:68`/`:77` + `docs/cli` 12 档 / `docs/vsc` 11 档 / `docs/core/design` 55 档实读 · `CORE-UNIFICATION.md:1102`/`:1108-1122` + registry 46 条 · `MODEL-SPECS.md` §9.1 D-11 收窄（`:436`/`:1312`）与 §13.3 沿用集 · `VSC-DEBT.md:381` · CHANGELOG 两缺段（`:142`/`:192`/`:306`/`:353`）+ `RELEASE.md:224` §6.3 承位条目 · `AGENTS.md:31` · `README.md:77` ↔ `config-presets.mjs:17`（deepseek-flash）· `.vscodeignore` 17 行 · `send.js:27-44` 现口径 + `panel-chat.mjs:5-9` / `loading.js:19-21` 旧句在场 · `model-specs.mjs:137-138`/`:193`/`:304-307` · `model-specs.test.mjs:318` · `session-release-shell.test.mjs`（`:212` false no-op 既有断言）。
**未核**（工具面所限，标 unverified）：doc-check 基线读数（悬空 8 / 行宽 13——本席无脚本执行面）· `#229` N₀ = 343（时点值；设计已声明以开工前复扫为准）。
**口径声明**：无 document map ⇒ 文档归属判据降级（按 AGENTS.md + hygiene 族体例判：批档 §2 = 设计面，无新建档碎片化、未见与既有档机制级相抵）；无标准档申报，方法合规按 Project Guide + 判定规则评估。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 复审 · 对象 = §2.12 修正块（11 条）+ 显眼新增**（评审面 = 本档 §2 现文 + 对 §2.12 新处方与旧 🔴 的定点实读；未跑 git——git 史断言按仓内证据件间接核；`bench/**` / 在飞批面按声明排除）

**11 条核验结论**：第 2–11 条**全部落地**（逐条实读已核，见文末证据摘要）；**第 1 条（原 🔴）未修复——修正轮改靶**。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-09-25-hygiene-ab.md`（§2.12 / `:71`）· `docs/vsc/design/VSC-DEBT.md`（`:381` ④ / `:506` ③） | 🔴 | **Unfixed（改靶）** | 处方把 R-6 ④ / A13 ③ 重锚到 `statusText` 行（`WEBVIEW-PROTOCOL.md:400`）+ 其消费位（`chat-messages.js:187`）；但该检查的对象 = **`subagentApproval`** 行：① `VSC-DEBT.md:372`「**`subagentApproval` 的 host 面本面独有 ⇒ 本 🔴 的实质风险面**」· `:383` 失败形态「只漏 `subagentApproval` 一半 ⇒ 该判别式退出 host 提取集 ⇒ T-6 `wrongDisp` 红（表记 `活` ∕ 实得 `删`）」；② 原对出处 `docs/batches/2026-09-18-vsc-large-file-split.md:188` 把该行描述为「host = `panel-callbacks.mjs:137/:155`」（= 中继发射点，见 `VSC-DEBT.md:377` R-2；`statusText` 行 host = `panel-callbacks.mjs:169/panel-index.mjs:29`，`:400` 实读）；③ 同批 2026-09-18 16:51（mtime）提取器件 `thincoder-vscode/.thincoder/tmp/emit-fwd.txt:38` = 「`subagentApproval` … `webview/chat.js:285` `活`」、其 `:35` = 「`statusText` … `webview/chat.js:248` `活`」⇒ 原对**出生时同源**（`subagentApproval`：row :366 + 消费位 chat.js:285，彼时正确）；`:285` 在拆分前夜变成 `statusText` 行是 09-18→09-22 间该区段 **+37 行位移**（同件 `goal` 286 / `suspension` 287 / `sub:*` 293 ↔ 现读折算预拆值 323/324/330 逐行吻合；`statusText` 248→285 同移）⇒ 设计轮把「漂移后的值」当成「对象本来的指称」，以消费位为锚即失靶。**落笔后果**：改后 ④ 断言的 `statusText` 行处置与本迁移无因果（该行在迁移中不可能变 `删`）——检查失去它存在的保护面（`subagentApproval` 退出提取集时 ④ 仍会「成立」） | 以**判别式**为锚重出：两处（`:381` ④ + `:506` ③）改指 `subagentApproval` 行现读 `WEBVIEW-PROTOCOL.md:403`（② `panel-subagent-relay.mjs:217/:253` · ④ `活` ✓）+ 消费位现读 `webview/chat-messages.js:224`（表记 `:222`）；并复核 §2.12 证据块 3 的「原对非同源」结论 |
| 2 | (new) | 同 `#234` 落笔面（`docs/vsc/design/VSC-DEBT.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md`） | 🔵 | New | 处方取**现读值**（`:187`）而所指行的 ③ 列仍为拆分时值（`:185`）；§2.12 附带发现①（`:394`）已载「③ 列整体 −2 …属该档维护面——本批零触 / 留待其维护轮」⇒ 改后引注与所指行自有值差 2（doc-check 不拦） | 落笔注内标差（如「`:222`（表记；现读 `:224`）」）或同步该单行 ③ 值 |

**计数**：🔴 1 · 🟡 0 · 🔵 1（旧 11 条：10 修复 · 1 未修复）。

**第 2–11 条核验证据（摘要）**：
- #2：`:75`「A 类**修**（4 锚 + 5 行宽——逐条见 §2.2）+ B 类**零触碰 + 残差登记**（4 锚 + 8 行宽）」· `:119`「**锚残差 4 条**」· `:321`「（4 锚 + 8 行宽）」——与 AC-4「悬空 4 / 行宽 8」自洽 ✓
- #3：`:54`（口径 5）/ `:280`（AC-8）/ `:307`（KD-5）三处同向限定「**既有行**零改（**本批新增条目行除外**）」✓
- #4：`:219` 档位面两条（命中档集 = 受影响文件逐档记现状/Δ；越档位 ⇒ 登记 / 停下上报）+ `:281` AC-9 对读句 ✓
- #5：`:130`「置位且**跳过启动**（核侧零调用——零周期；N1 降级不崩）」· `:131` 实现句 · `:290` LS-3 三处统一；`:134` 注入缝 `_setLoadCoreForTest`（先例 `thincoder-cli/test/ledger-surface.test.mjs:21-24` 缝族 / `:35-40` afterEach 复位——实读吻合）✓
- #6：`:91` = `node thincoder-vscode/scripts/check-vsix.mjs`（全仓实读该档在盘）✓
- #7：`:69` 五步（按名对账 + 幻影撤登 + `MODEL-SPECS.md` 补登 + `CORE-UNIFICATION.md` 计入口径 + 「实档 55 = 本图登记 55 + 待补登 0」）；盘上实核：`ENGINEERING-MODE.md` 无（glob 仅 `ENGINEERING-MODE-V2.md`）· `docs/README.md:75` 仍列幻影 · `:77` 计数行 · `:80` 工作流档 ✓（54 − 1 + 1 + 1 = 55 = 实档 55）
- #8：`:79`「在册 **46** / 已登 **15**（口径 = `config.mjs` + 子表 14 行）/ 其余 **31**（= 46 − 15）」✓
- #9：`:188` 条件性行（`thincoder-core/test/core-hygiene.test.mjs` 188 · ±1 · 触发 = `session-gc-stale.test.mjs` 越 300）✓
- #10：`:138`「**开工前实跑一次记读数（红 / 绿）**——判据按实况写」✓
- #11：`:81` 行名锚定（`grep -n 'KD-36'`；现读 `:934`）+ `:328` 同源收正；fresh grep `KD-36` = `MODEL-BENCH.md:934` ✓

**未核（工具面所限）**：doc-check 基线读数与修正轮复跑读数（悬空 8 / 行宽 13 等——本席无脚本执行面）· `git show` 原样输出（无 git；设计轮「`:285` = `case "statusText"`」的观察经间接核算**成立**，但对象归属结论不成立——见上）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**轮 3 复审 · 对象 = §2.13 修正面（#234 改靶至 `subagentApproval` + 两值同注 + 证据块重出）** · 评审面 = §2.13 / §2.1 `#234` 行 / §2.12 证据块重出的定点实读（靶位对读 = `WEBVIEW-PROTOCOL.md:403` · `chat-messages.js:224` · `VSC-DEBT.md:381`/`:506`/`:499` · `emit-fwd.txt:12`/`:35`/`:38` + mtime）；`bench/**` / 在飞批面按声明排除 · 未跑 git（git 断言按仓内证据件间接核）。

**核验表（轮 2 遗留 2 条 · 全修复 → 遗留 0）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/batches/2026-09-25-hygiene-ab.md`（§2.13 `:413` · §2.1 `:80` · §2.12 `:393-400`） | 🔴 | **Fixed** | 改靶落地 = `subagentApproval`；盘上同源对读 ✓（`WEBVIEW-PROTOCOL.md:403` = subagentApproval 行：② `panel-subagent-relay.mjs:217/:253` · ③ `webview/chat-messages.js:222` · ④ `活`；现读消费位 `chat-messages.js:224` = `case "subagentApproval":  applySubagentApproval(m); break`）；证据块重出（`emit-fwd.txt` `:38` = subagentApproval ↔ `chat.js:285` · `:35` = statusText ↔ `:248` · mtime 2026-09-18 16:51 实核 · `goal` 286 / `suspension` 287 / `sub:*` 293 ↔ 折算 323/324/330 逐行吻合）；「原对从未同源」结论已删；两修点 `VSC-DEBT.md:381` ④ / `:506` ③ 在场（`:506` 节标 `§12.8` 实核 ✓） |
| 2 | 2 | 同上（§2.1 `:80` · §2.13 `:414` · §2.12 证据块 4） | 🔵 | **Fixed** | 两值同注 = `webview/chat-messages.js:222`（表记）· `:224`（现读）——与附带发现①「③ 列整体 −2」同款值差在册 |

**计数**：🔴 0 · 🟡 0 · 🔵 0（轮 2 遗留 2/2 修复 · 本轮零新出）

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-25 03:3x · 父侧代签**（用户 02:51「自动跑完吧」全链授权 · 自缚三条件在册 §1.0）✓

**三条件核验**：① 评审 **pass**（轮 3 · 🔴 0 · 2/2 Fixed；轮 1（11 条）+ 轮 2（2 条）全链在 §3 / §2.12 / §2.13）；② **修正轮已落地并逐条核验**（#61 设计 → #62 上抛 → #65 修正 → #67 改靶重出——均已父侧实读核验）；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围** = 本批全量：20 条处置面（§2.1 表 + §2.2 机制 + §2.12/§2.13 修正块）——doc-face 8 条（`#229`/`#230`/`#234`/`#239`+`#247`/`#245`/`#270`/`#281`/`#283`）+ code-face 10 条（`#232`/`#233`/`#227`/`#231`/`#228`/`#235`/`#238`/`#243`/`#246`/`#280`）+ 主 agent 面（`#237` 台账收正）。

**下一步**：实施轮派发（doc 面 eng-designer · 码面 eng-coder · 并行）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-25 · 9 条 code-face 全落地 · 三端套件绿（588/818/953）· 审计 1 轮 + 评审 1 轮（pass）· 终态 clean）



### 实施记录（eng-coder · 2026-09-25 · code-face 9 条）

**范围**：任务书 = §2（含 §2.12 / §2.13 修正块）；本轮落地 code-face 9 条（`#232` `#233` `#227` `#231` `#228` `#235` `#238` `#246` `#280`）。
`#243` 不在本单（父侧面）；`docs/**`（除本段）/ `bench/**` / `_archive/**` / 产品参照树 `thincoder-{cli,vscode}/docs/**` / 任何 `CHANGELOG.md` **零触**。

**交付摘要（逐条 · 关键落点）**

| 条 | 处置 | 落点 |
|---|---|---|
| `#232` | 死指针三族（旧 `AGENT-LOOP.md §17` / `§19` · `ENGINEERING-MODE.md §2.20` 族）全仓改指 / 改述 | 命中档集 60+ 档：core `agent-tools/**`（13）· `agent/**`（6）+ `agent.mjs` · `advisor/**`（2）· `tools/**`（3）；cli `src/tui/**`（15）· `src/cli/permission.mjs`；vscode `src/**`（11）· `webview/**`（8）；测试 12 档；`thincoder-cli/AGENTS.md` |
| `#233` | 端壳恒同步返回 `{ dispose }`（置位 ⇒ 跳过核启动 / 零周期） | `thincoder-cli/src/tui/ledger-surface.mjs`（缝 `_setLoadCoreForTest`）+ 调用点 `tui/index.mjs:210-213` 回退同步 `.dispose()`；核 `thincoder-core/ledger-surface.mjs` **零改** |
| `#227` | `.d` 孤儿清运（① 自动面 + ② 显式面） | `thincoder-core/session-gc.mjs`：后缀表 `:63` · 孤儿反向判据 `:114` · 回收（非 unlink）`:120-126` · ① 保留期 30 天；② `sweepOrphanRecordDirs` `:138-166` + dry-run 行 `:317-320` + `--confirm --all` 腿 `:336` / `:358-361`；常量单源 `session-segments.mjs:13` |
| `#231` | 转空支路接 `releaseOldCwdClaims`（同族第三落点） | `thincoder-vscode/src/extension/chat-panel.mjs:117`（清理前记旧 cwd）→ `:122`（销毁后释放）；净 +2 行；该档 **498 行 ≤ 499** ✓ |
| `#228` | 忙态口径三档收正 | `src/extension/panel-chat.mjs:5-13` · `webview/loading.js:19-21` / `:61-63` / `:81` · `test/files.mjs:61` |
| `#235` | 打包忽略补杀 `.log` | `thincoder-vscode/.vscodeignore:18-19`（`*.log` / `**/*.log`） |
| `#238` | README 第三列取值收正 | `thincoder-vscode/README.md:77` → `deepseek-flash`（= `thincoder-core/config-presets.mjs:17` 取值） |
| `#246` | CLI 档两指针收正 | `thincoder-cli/AGENTS.md:31` → `../docs/RELEASE.md`（节号 `§5.5` / `§4.1–§4.3` 实存） |
| `#280` | 能力位「无族据」口径 | `thincoder-core/model-specs.mjs:193` 行注 + `test/model-specs.test.mjs:318` 用例名 |

**用例（新增 · 与 §2.6 表对位）**

| 用例 | 档（行数） | 覆盖 |
|---|---|---|
| LS-1 / LS-2 / LS-3 | `thincoder-cli/test/ledger-surface.test.mjs`（379） | 正常句柄 / 载入失败空句柄不抛 / 先 dispose 后就绪 ⇒ 跳过启动（核零调用） |
| GC-D1–D6 | `thincoder-core/test/session-gc-stale.test.mjs`（395） | 正常回收可回退 / 主文件在保留 / 未过期保留 / 活跃槽保留 / 回收失败跳过并计数 / 显式面存量腿（dry-run 计数 + `--confirm --all` 实回收） |
| RL-1 / RL-2 | `thincoder-vscode/test/session-release-shell.test.mjs`（325） | 转空 ⇒ 释放恰一次 + 守卫态 / 槽解绑 / agent 零变 · 同 cwd ⇒ no-op（零释放 + 返回 false） |

**决策透明表**

| # | 决策 | 依据 / 备选 | 影响 / 回改路径 |
|---|---|---|---|
| 1 | `#227` ② 面**不设保留期**（候选 = 主文件不存在 ∧ 槽非活跃） | §2.2.7 字面候选定义 =「`{prefix}.{N}.d` 主文件不存在者」+ 本腿目的 = 存量通路（父侧裁「最小形不足以下降存量」）；备选 = 与 ① 同加 30 天滤除——实地读数下该腿今日零候选（存量 595 全在 30 天内），目的落空 ⇒ 未取 | 若父侧按「含保留期」读法 ⇒ 回改一处滤除（`sweepOrphanRecordDirs` 内 `stat` 后加 `if (st.mtimeMs >= now - RESIDUE_RETENTION_MS) continue`） |
| 2 | `#227` `.d` 删除走 **`recycleGroup` 回收**（非 unlink） | 目录承载记录存储本体（D-SE36 同语义）+ 设计判据「可回退」 | 失败即跳过并计数（候选 − 已回收），**不 unlink 兜底** |
| 3 | `#232` 无对应节的旧号 ⇒ **改述去号**（不改挂他节） | §2.2.6 定案口径；旧号在现行档无节 ⇒ 挂他节 = 新死指针 | 涉及 VSC 上下文注入 `§17.x` /「群 B 批 §17.2」/「advisor §17.5」三处 |
| 4 | `#233` `_setLoadCoreForTest` **同时**作用于 `runLedgerScan` | §2.12 #5 统一语义（置位 ⇒ 跳过启动）已入设计；缝面更宽但语义同源 | 无（测试专用） |
| 5 | `#231` RL-2 构造 = `workspaceFolders=[] ∧ override=null ⇒ _cwd()=process.cwd()`（桩） | §2.6 RL-2 行「转空后 `_cwd()` 与旧 cwd 同（桩）」 | 断言零释放 + 返回 false |
| 6 | `#232` 处置表粒度 = 族级映射 + 档集 + 抽检行号 | 全量 288 处逐行清单在 20k 字符段内不可载；逐行可由 `git diff` 复得 | 见下「处置表」段 |
| 7 | `#227` 实地 `--confirm --all` **不执行** | 动用户全库（595 孤儿 + 99 组候选）；不可逆操作的门在本单元之外 | 只做只读计数 + dry-run 实证；清运留父侧 / 用户面 |

**表外改动披露（报告制）**

| 档 | 改动 | 理由 | 判定状态 |
|---|---|---|---|
| `thincoder-core/session-slots-manifest.mjs` | `:292-294` 新增导出 `_releaseStats = { calls: 0 }`；`releaseClaimsAll` 首行自增（`:306`） | `#231` RL-1 的「恰一次」判据需桩计数（核侧原无计数缝）；先例 = `_storeStats` / `_staleHooks` | §2.3 受影响文件表**无本行**（内部审计 + 代码评审均标记）；生产零消费 |
| `thincoder-core/test/core-hygiene.test.mjs` | `:80-82` 登记注记 + `:93` `SOFT_LINE_REGISTRY` 补登 `test/session-gc-stale.test.mjs` | §2.3 该行 = 条件性（触发 = 越 300 ⇒ 补登 + 注记），实测 395 > 300 ⇒ 触发成立 | 条件性行，非表外 |

**`#232` 处置表（族级 · 旧形 → 新形 → 命中面）**

| 族 | 旧形 | 新形 | 命中面（示例档） |
|---|---|---|---|
| 异步池 / 暂停语义 | `AGENT-LOOP.md §17.x`（`§17.2`–`§17.5` …） | `AGENT-LOOP-ASYNC-POOL.md §6.8`（依语义对位 `§6.10` / `§6.11` / `§6.20`） | core `agent-tools/{subagent-async,subagent-panel,panel-blocks,async-settle,subagent-scheduler}.mjs` · cli `src/tui/{subagent-blocks,subagent-panel,suspension-drive,mouse,tool-events}.mjs` · vscode `src/**` |
| 子代理动作 / 控制面 | `AGENT-LOOP.md §19.x`（`§19.2` 动作面 · `§19.5` check 删除 · `§19.6`） | `AGENT-LOOP-SUBAGENT.md §6.7`（`.2` / `.5` 依对位） | core `agent-tools/{subagent,subagent-actions,subagent-run,subagent-spawn}.mjs` · cli `src/tui/agent-turn.mjs` |
| 工具面 | `TOOLS.md §17` | `TOOLS.md §6.7` | core `tools/{glob-dialect,search,shared}.mjs` · vscode `src/agent/**` |
| 轮次上限 / 续跑 | `TURN-CAP-CONTINUE.md §19.x` | 同档 `§3–§5`（`§4` 依对位） | core `agent/{run-stages,suspension,helpers}.mjs` · cli `src/tui/tui-state.mjs` |
| 渠道面 | `PROVIDER.md §19.2` | `PROVIDER.md §6.11` | core `provider/**` 引用面 · vscode `src/**` |
| 批档机制 | `ENGINEERING-MODE.md §2.20.x` | `BATCH-RECORD.md §2` / `§4.1` / `§4.2` / `§4.3` / `§4.7` | core `agent-tools/batch.mjs` · cli `AGENTS.md` · vscode `src/**` |
| 无对应节（改述） | VSC 上下文注入 `§17.x` ·「群 B 批 §17.2」·「advisor §17.5」 | 去号改述（语义保留、指称去除） | vscode `src/agent/context-injections.mjs` 等 |
| P2 批出处注 | `P2 批 §2.20`（旧形无档名） | `docs/batches/2026-09-20-mechanism-parity-batch.md §2.20`（显式档名） | cli `src/cli/permission.mjs:1` · `src/tui/interaction.mjs:71` · vscode `src/extension/permission-gate.mjs:18` / `:55` 等 |

**靶面复扫读数（枚举命令同设计）**：`git grep -n -e "§17" -e "§19" -e "§2\.20" -- thincoder-core thincoder-cli thincoder-vscode`（排除 `_archive/**` · `.thincoder/**`）
= core **0 命中**；cli + vscode **19 行** = `CHANGELOG.md` 5（设计零触）· 参照树 `thincoder-cli/docs/**` 3（设计零触）· **7 在位居指针** · **4 非指针夹具**。

**残差（11 行 · 全属二态「照留」类 · 无死指针）**

| 类 | 行 | 说明 |
|---|---|---|
| 在位居指针 7 | cli `src/cli/permission.mjs:1` · `src/tui/interaction.mjs:71` · `test/permission-transit.test.mjs:2`；vscode `src/extension/permission-gate.mjs:18` / `:55` · `test/files.mjs:120` · `test/permission-gate-seam.test.mjs:3` | 均指在位节 `docs/batches/2026-09-20-mechanism-parity-batch.md:473`（`### 2.20`）；`§2.20` 是该批**真实节号**，非死指针 ⇒ 照留 |
| 故意夹具 4 | cli `test/prompt-refs-zero.test.mjs:141` / `:154`；vscode `test/agent-tools-registry.test.mjs:96` / `:101` | 剥离规则测试需要 § 形 token 在场（任务书明示「勿改」）；VSC 两处为「旧形托词」注入 |

**实测读数**

| 项 | 读数 | 命令 / 备注 |
|---|---|---|
| 三端套件 | core **588/588** · cli **818/818** · vscode **953/953**（fail 0 · cancelled 0） | `npm test`（各端 cwd） |
| 启动烟测 | **exit 0**，启动屏正常（台账行在场 = 同步句柄实跑） | `node test-startup.mjs`（cwd = `thincoder-cli`） |
| doc-check | 悬空 **4** / 行宽 **8** | `node scripts/doc-check.mjs`（开工基线 8/13；差量 = doc 面轮所消，本轮码面在 doc-check 域外 ⇒ 净 0） |
| 打包面 | `vsce ls` **143** 条 · `.log` **0** 条；`check-vsix` 断言 B+D 全过 | `npx --no-install vsce ls` · `node thincoder-vscode/scripts/check-vsix.mjs` |
| `#227` 实地（只读） | `.d` 目录 **693** · 孤儿（主文件不存在）**595** · 越 30 天保留期 **0** | node 只读枚举 `~/.thincoder/sessions` |
| `#227` 通路实证 | dry-run 行「Orphan record-dir (.d) candidates … **595**」（② 腿可达） | `node bin/thincoder.cjs session gc --dry-run`（只读；`--confirm --all` **未执行**） |
| 行数（node `split` 口径） | `ledger-surface.mjs` 54 · `tui/index.mjs` 228 · `ledger-surface.test.mjs` **379**（CLI advisory）· `session-gc.mjs` 365 · `session-gc-stale.test.mjs` **395**（已登记）· `session-slots-manifest.mjs` **322**（已登记）· `core-hygiene.test.mjs` 191 · `model-specs.mjs` 327 · `test/model-specs.test.mjs` 478 · **`chat-panel.mjs` 498（≤499 ✓）** · `session-release-shell.test.mjs` 325（VSC advisory） | 核档 >300 均在 `SOFT_LINE_REGISTRY`；CLI / VSC = advisory（无登记机制）⇒ 越线登记落本段 |

**审计与评审轮次 / 终态**

| 轮 | 类型 | 结果 | 处置 |
|---|---|---|---|
| 1 | 内部偏离审计（explore · 只读） | 4 条偏差（`loading.js:81` 旧口径残余 · 表外改动未披露 · §5 待写 · `#243` 归属） | 前两条**当轮修 / 披露**；后两条 = 记录面与父侧面（见「留父侧」） |
| 2 | 内部代码评审（advisor · type=code） | **VERDICT: pass**（🔴 0 · 🟡 2 · 🔵 5） | 当轮修 3（单源注释句 · 登记读数 390→395 · 补 RL-2）；🟡 两条 = 记录 / 协调面 |

**修正轮记录（2 轮 · 上限 5 内）**：修正轮 1（审计驱动）= `loading.js:81` 旧措辞改述 · `tui/index.mjs:211-212` 追述句收正 · 表外改动进披露；修正轮 2（评审驱动）= `session-gc.mjs:40-41` 单源注释收正 · `core-hygiene` 登记读数改 395 · `session-release-shell.test.mjs` 补 RL-2。**终态 = clean**（无未修 must-fix / 🔴）。

**留父侧（未决 / 未执行）**

1. `#227` 实地清运未执行（`--confirm --all` 动用户全库：595 孤儿 + 99 组候选）——门在父侧 / 用户面。
2. `#227` ② 面判据解释（不设保留期）待父侧确认（决策表 #1）。
3. 表外改动 `session-slots-manifest.mjs`（`_releaseStats`）待父侧裁：向 §2.3 表补行，或回退缝面（回退 ⇒ RL-1 的「恰一次」判据降为效果面断言，须同改）。
4. `#243`（`thincoder-cli/CHANGELOG.md` 两段）不在本轮 9 条内、实况未落——归属待父侧（§4 批准面含之）。
5. `#233`「始载点零耦合」长程判据（8-13 批口径）本轮仍未覆盖 ⇒ 同段断言（父侧话术）。
6. `#232` 其他族死指针（`AGENT-LOOP.md §9` / `§12` / `§15` 等）不在本批射程——后续批候选。

## §6 验证与收口（父代理）

**状态：20 条全交付 · 收口 2026-09-25**（父侧 · 用户 02:51 全链授权内）。

### 6.1 交付面（两轮 + 父侧直落一笔）

- **doc 面**（eng-designer · 11 档）：`#229` / `#230` / `#234` / `#239`+`#247` / `#245` / `#270` / `#281` / `#283`——提交 `2bf30c08` → 双推。
- **码面**（eng-coder · 86 档）：`#232`（三族 sweep 60+ 档）/ `#233` / `#227` / `#231` / `#228` / `#235` / `#238` / `#246` / `#280`。
- **父侧直落**：`#243`（CHANGELOG 承位段 ×2——`CHANGELOG.md` 系父侧维护档，闸裁出派发面）。

### 6.2 验证读数（父侧实跑）

| 门 | 读数 |
|---|---|
| core 套件 | `npm test`（thincoder-core）⇒ **588/588 · fail 0** |
| cli 套件 | ⇒ **818/818 · fail 0** |
| vscode 套件 | ⇒ **953/953 · fail 0** |
| 干跑烟测 | `node test-startup.mjs` exit 0（无 TypeError——同步句柄实跑） |
| doc-check | 悬空 **4** / 行宽 **8**（A 类零复现 · 净增 0——B 类残差全在册） |
| 档位面 | `chat-panel.mjs` ≤499 ✓ · `session-gc-stale.test.mjs` 越 300 已登记 · 核内 >300 档均在 `SOFT_LINE_REGISTRY` |
| 打包面 | `vsce ls` 143 条 / `.log` **0** 条 · `check-vsix.mjs` 断言过 |

### 6.3 父侧裁定（#70 三项披露）

1. **`#227` ② 面不设保留期 = 确认**（显式面 = 用户 `--confirm` 确认后清存量；① 自动面仍 30 天）——实读 `session-gc.mjs:319-320`「explicit face — no retention」✓。
2. **表外缝面 `thincoder-core/session-slots-manifest.mjs:292-294`（`_releaseStats` 计数）= 接受补行**（不降判据；先例 `_storeStats` / `_staleHooks`；生产零消费）。
3. **实地清运未执行 = 确认**（用户全库 693 `.d` / 孤儿 595 / 越 30 天 0 · `--confirm --all` 属用户面，不代跑）· 设计载「1,119」与今读 595 系口径差（在案）。

### 6.4 结算面（D7）

- 角色表 / 状态行 / 计数 / 指针：§1–§5 全在档（§2 含 §2.12–§2.14 修正块 · §3 轮 1–3）✓。
- 变更记录：doc 面 11 档 + 产品面文本档变更记录行随改（既有行零改）✓。
- 台账：**20 条 → 已核销**；`#237` 台账收正随核销落地；新债入册 `#284`（WEBVIEW-PROTOCOL 表列）· `#285`（另族死指针）。
- 前批遗留交叉检查：hygiene-sweep 批已收口 ✓；无遗留。
- 上抛项：需求档候选 21 处（零触碰 · 性质 = 机制语 / 日期锚 / 处置已载形 · 无需动作）——在案不动作。
- 设计槽消费：consume-design 随收口。
- 备注：`bench/results/2026-09-25-roster-29-v6-rejudged.pdf`（7.5MB · 03:51 生成 · 非本批/非本链产物）= 用户侧产物，未提交（仅登记）。

**收口**：本档冻结（后续不得回改）。
