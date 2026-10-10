# 2026-10-10 · gemini-model-specs
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 08:39「我希望thincoder客户端能够识别3.8/3.7的模型规格」+ 08:40「点火」。
> 台账 = #1198（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与点火

- 用户 2026-10-10 08:35「联网查一下gemini的模型规格」⇒ 父侧完成官方双源核查（回报在会话，未落文件）；08:39 用户原话「我希望thincoder客户端能够识别3.8/3.7的模型规格」；08:40「点火」。
- 本批 = 台账 **#1198**（core 板 · 需求）；批档由父侧建立。

### 1.2 现状与范围（父侧实读 · 2026-10-10）

- 规格单源 = `thincoder-core/model-specs.mjs`（前缀匹配、长名先；字段口径注释 :10-26）；gemini 现盘行 :201-207（`gemini-3-pro` ∥ `gemini-2.5-pro` ∥ `gemini-2.5-flash` ∥ `gemini-3.1-pro`——末行 = 2026-09-25 批「尺寸行」先例）。
- `gemini-3.8-flash` ∥ `gemini-3.7-flash` **无行 ⇒ 客户端现落兜底**（不识别 1M 上下文 / 64K 输出等）。
- 预设面 `config-presets.mjs:30/:34`（`gemini` ∥ `gemini-openai`）已在——本批不动预设。
- **范围钉死** = 两行入表 + `docs/core/design/MODEL-SPECS.md` 回笔；旁档（3.6 / 3.5 族）不入。
- 证据面（官方 as-of 2026-10-10——逐档规格页 ∥ 价目页实核）：context **1,048,576** ∥ maxOutput **65,536** ∥ 入 = 文/图/音/视、出 = 文 ∥ thinking_level = LOW/MEDIUM(默认)/HIGH（无 MINIMAL）∥ GA 2026-09-02 / 08-13 ∥ 3.7 退役 2027-01-28。

### 1.3 授权

- 无代签预授权（用户仅「点火」）——设计评审点火权、§4 批准权均候用户。

### 1.4 用户授权（自动跑 · 2026-10-10 09:50）

用户原话：「自动跑」⇒ 本批**设计评审点火权** ∥ **§4 用户批准权（代签）** ∥ **修正/实施轮派发** ∥ **收口核销与提交**——均委托父侧自动执行，直至本批收口。

**父侧自缚三条（本仓惯例·先例同形）**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发），每次代签在 §4 写明「父侧代签（用户 09:50 授权）+ 依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆 ⇒ 先停。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（eng-designer · 2026-10-10）**

**本批条目（覆盖 · 台账 #1198；用户 2026-10-10 08:39 点名两档 + 08:40「点火」）：**

- ① `gemini-3.8-flash` 入表（`thincoder-core/model-specs.mjs` · Gemini 族段 `:207` 后 · 含行注）；
- ② `gemini-3.7-flash` 入表（同上 · 两行同形）；
- ③ 设计档回笔：`docs/core/design/MODEL-SPECS.md` §18 + 变更记录 1 行。

**本批不做（显式）：** 不动预设面（`thincoder-core/config-presets.mjs`）∥ 不动他族 / 他行（含存量 gemini 四行，其中三行 `thinking: false`——第四行 `gemini-3.1-pro` 尺寸行无该键）∥ 旁档（gemini 3.6 / 3.5 族）不入 ∥ 传输面机制零改（`thincoder-core/provider/**`）∥ 三端代码零改 ∥ 服务器手工同步快照零触（既定「核表更新后由后续版本手工同步」机制）。

**行值表（逐字段 + 证据级 · 两行同形）：**

| 字段 | 值 | 证据级 | 说明 |
|---|---|---|---|
| `context` | `1_048_576` | 官方口径 | 逐档规格页实核（as-of 2026-10-10）；非实测（本机无该渠道密钥） |
| `maxOutput` | `65_536` | 官方口径 | 同上 |
| `multimodal` | `true` | 官方口径 + 族据 | 官方入模态含图像（本表语义 = 图像面）；族据 = 同族在册三行（点名来源行） |
| `thinking` | `true` | 官方口径 | thinking_level 受理 LOW/MEDIUM/HIGH（默认 MEDIUM）⇒ 思考在场 |
| `thinkAlwaysOn` | `true` | 官方口径 | 受理枚举无关闭档；显式 MINIMAL ⇒ API 校验错 ⇒ 无 off 路径（`doc:MODEL-SPECS.md:§16.3` 语义） |
| 机制位其余（`thinkApi` / `reasoningEffortEnum` / `tempRange` / `noUsageStream` / `format`） | 不声明 | —— | google 传输面零可达 / 零消费（实读坐标 = `doc:MODEL-SPECS.md:§18.4` 表）——不落键 |

**落点（file:line 级）：**

- 表行：`thincoder-core/model-specs.mjs:207` 后插入 2 行 + 行注（行文逐字 = `doc:MODEL-SPECS.md:§18.2` 草案）；
- 设计档：`docs/core/design/MODEL-SPECS.md:1989-2102`（§18 · as-of 本设计轮）∥ `:2317`（变更记录条 +1）。

**影响面（消费方 + 行为变化）：**

- `context` → 压缩阈值重算（`thincoder-core/config.mjs:139-146`）：预设渠 ≈ 71 884 ⇒ **624 230** ∥ 无显式 `maxTokens` 渠 **589 824**；上下文占比显示 ∥ advisor 预算随动；
- `maxOutput` → `outputReserve`（`thincoder-core/config.mjs:117-121`）：无显式 `maxTokens` 时预留 32 000 ⇒ 65 536；预设渠（`maxTokens: 8192`）主导、零变化；发送面不达 google 请求（实读 `thincoder-core/provider/google.mjs:86`）；
- `multimodal` → 图像门族（清单单源 = `doc:MODEL-SPECS.md:§2.7`）：「非多模态」⇒「多模态」（`read_image` 注册 / 贴图 / 注入门放行）；
- `thinking` → VSC `effortEnumForModel`（`thincoder-vscode/src/specs.mjs:72`）：该两档落 `["enabled"]` 单档（既有形）；
- `thinkAlwaysOn` → `thinkOffPath` false（`thincoder-core/think-off.mjs:23`）：CLI `/think` 无开关项 + `/think off` 拒绝 ∥ `/advisor` Disabled 不渲染 ∥ 标题路径零发禁用形（`thincoder-core/generate-title.mjs:46` / `:74`）∥ 桌面 `thinkOff: false`。

**验收对照**：AC-1..AC-4 → `doc:MODEL-SPECS.md:§18.6` 回指表（两行逐字段在场 / 零改既存面 / 机制位缺位断言 / 影响面读数）；用例 G-1..G-7 落点 = 批内件 `docs/batches/2026-10-10-gemini-model-specs.test.mjs`（拟新增；复跑 = 仓根 `node --test docs/batches/2026-10-10-gemini-model-specs.test.mjs`）。

**关键决策：** KD-1 两行按官方证据独立裁、不照抄存量行——`thinking: true` + `thinkAlwaysOn: true`（被否：沿存量 `thinking: false` = 与官方事实相抵 + 存量成因系 S1 建仓导入无单批理由 ∥ 不声明思考面 = 有证据不落）；KD-2 机制位其余全不声明（被否：声明 `["low","medium","high"]` 枚举 = 假控制面——google 路径零可达）；KD-3 存量 gemini 行零改 + 差异认账（`thinking: false` 并存差异入 `doc:MODEL-SPECS.md:§18.4` 认账行）。

**上抛/披露：** 无待裁项；披露（报告尾注 · 本批零触）= ①google 传输面 chat 载荷无思考 / effort 通路（`thincoder-core/provider/google.mjs` 无 `thinkingConfig`；`thincoder-core/provider/core.mjs:205` 排除 google 的 `reasoning_effort` 发送）——两新档与存量 gemini 行的思考控制不达 chat 载荷；②存量三行无据字段面（`thinking: false` / `noUsageStream` / `format` = S1 建仓导入，与官方恒思考事实相抵）；③服务器手工同步快照未含两新档（既定机制）；④`doc:MODEL-SPECS.md` §2.7 消费点清单与坐标疑滞（`thincoder-core/attachments.mjs:54` 未在清单；`setup-tooltable.mjs:305` 现无 `multimodal` 读点、现读 = `tool-table.mjs:177`；`image-handler.mjs:110` 现读 `:43`）。

**本设计轮产品码零触**（实施 = 另轮 eng-coder；`model-specs.mjs` 两行入表 + 批内件为其交付面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-10-10-gemini-model-specs.md`（§2 设计轮 · 台账 #1198）∥ `docs/core/design/MODEL-SPECS.md` §18（含 `:2317` 变更记录条）。
**范围与限制**：按评审清单只读上述两档（未读产品码 ⇒ 文内代码侧坐标 / 行数类断言一律 unverified，只作内部一致性核）；无文档地图、无项目标准档 ⇒ Document ownership 按「§18 = MODEL-SPECS 本主题归档 + 变更记录同拍」判，methodology 按 AGENTS.md + 本档既有体例（§10/§11/§13 先例）判。
**计数：🔴 0 · 🟡 4 · 🔵 8 —— VERDICT: pass**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（消费点坐标） | 🟡 | `spec.thinking` 读点坐标三处互指：§18.4 称「本批实读：`spec.thinking` 直接读点 = 此一处」并指 `thincoder-vscode/src/specs.mjs:72`（`MODEL-SPECS.md:2050`），而 §2.5 称「全仓 `spec.thinking` 仅 1 处消费 = 上面 VSC 那行（`thincoder-vscode/src/extension/provider-probe-window.mjs:66`）」（`:182`）、§16.6-⑴ 亦引 `provider-probe-window.mjs:66` 的 `spec.reasoningEffortEnum \|\| (spec.thinking ? ["enabled"] : [])` 读形（`:1776`）——两处均自称唯一读点 | 一并落「本批实读（as-of 2026-10-10，取代 §2.5 旧读）」注，或补双坐标（直接读 + 消费面）；§2.5 / §16.6-⑴ 侧标 as-of，免实施方据旧坐标判影响面 |
| 2 | Clarity（机制位零消费凭据） | 🟡 | §18.3（`:2040`）与批档 §2（`:55`）以「（§18.4 表逐键标）」/「实读坐标 = `doc:MODEL-SPECS.md:§18.4` 表」承载「机制位其余」的零可达 / 零消费判据，但 §18.4 表（`:2045-2051`）只有已声明五字段行，无逐键行；`format` 在本档另有在册消费记录（§15.2 记 gemini 族行「`format:"google"` 走原生 transport」，`:1503`） | 补逐键坐标，或把该判据改挂具体实读；点名 `format` 的取值依据（同族先例 = 存量 `gemini-3.1-pro` 尺寸行无 `format`，G-5 期望形 `:2083`），防实施方按三条老 gemini 行对称补 `format:"google"` |
| 3 | Methodology（证据标级） | 🟡 | `thinkAlwaysOn: true` 标「官方口径」（`:2039` ∥ 行注 `:2024`），但枢轴句「显式 MINIMAL ⇒ 校验错」系枚举外推的推断——批档 §1.2 只记「thinking_level = LOW/MEDIUM(默认)/HIGH（无 MINIMAL）」（`:20`），且本机无该渠道密钥（不可实测） | 枢轴句标「推断（枚举外推 · 未验）」或改写为「受理枚举无关闭档 ⇒ 无 off 枚举值」；决策本体（`thinkAlwaysOn: true`）不动 |
| 4 | Doc-state（影响面凭据） | 🟡 | §18.4 multimodal 行以「清单与语义单源 = §2.7 第 1 项」（`:2049`）为影响面凭据，而同批批档 §2 披露④（`:74`）已判该清单与坐标「§2.7 消费点清单与坐标疑滞」（`attachments.mjs:54` 未在清单；`setup-tooltable.mjs:305` / `image-handler.mjs:110` 坐标已移），§18.4 未携该保留 | 在 §18.4 该行补 as-of / 疑滞指针（或随批收正 §2.7 清单），免实施方把旧坐标当现读 |
| 5 | Clarity（坐标漂移） | 🔵 | 同一 `read_image` 注册门两读：§2.7 / §2.5 记 `thincoder-core/tools/index.mjs:64`（`:212` / `:179`），§18.4 记 `thincoder-core/tools/index.mjs:66`（`:2049`），未标 as-of | 统一坐标或补 as-of 标 |
| 6 | Clarity（引证悬空） | 🔵 | §18.4 ③ 引「§363③ 契约『无有效 off 路径 ⇒ 零发』」（`:2051`）无档名，且本档 `:363` 实为 §6 的 T-3 用例行，非该契约 | 补出处档名 / 节号，或删该引（句意已由 §16.4 承载） |
| 7 | Clarity（计数两读） | 🔵 | 存量 gemini 行计数两读：AC-2 / G-5 记「四行」（`:2071` / `:2083`），§18.4 认账行与 §18.8 及批档 §2 记「三行」（`:2053` / `:2089` / `:44`），且未说明第四行（`gemini-3.1-pro`）无 `thinking: false` | 统一一句（如「存量四行，其中三行 `thinking: false`」），免禁改面被按三行理解 |
| 8 | Acceptance（用例号空间） | 🔵 | 用例号 `G-1..G-7`（`:2079-2085`）与 §13.8 的 `G-1..G-7`（`:1289-1295`）同档同号异事（本档对号空间有先例注 = §16.9 `:1824`） | 补用例号注，或改独立前缀（如 `GM-`） |
| 9 | Acceptance（机检可跑性 · unverified） | 🔵 | AC-4 / G-7（`:2073` / `:2085`）直调 `outputReserve` / `resolveCompactThreshold`，设计未给二者导出面证据（本次未读产品码 ⇒ 导出性 unverified） | 实施前确认导出面；若为模块内函数，改经公开消费面取读数 |
| 10 | Doc hygiene（占位残形） | 🔵 | 批档 §1 状态行为占位残形「**状态行**：🔄 进行中（…）」（`:6`），且 §1 / §2 模板占位行（`:7` / `:34`）在段面已满时仍在盘 | 状态行改实值（合法关键词 + 可选日期），两占位行随段面完成删除（模板占位仅骨架期合法） |
| 11 | Methodology（closest-precedent） | 🔵 | 未见合并的「最近先例」行：先例散于 KD-1（`:2008`，点名存量 gemini 行偏差由）与 §18.5（`:2062`，测试件形态先例） | 补一行三坐标先例（如行增批 §10 / §11 ∥ `gemini-3.1-pro` 尺寸行先例 §14.2 #2 ∥ 本档 §18）+ 一句对齐 / 偏差；KD-1 偏差理由已显式，本项仅形态补全 |
| 12 | UI/行为面（本条后果 · 认账缺位） | 🔵 | 两新行落 `thinkOffPath === false` 后，§16.4 定形拒绝文案（含括注「use /think effort <level>」）对**无枚举族**给出不可达建议；§18.4 / §18.9 未登记该后果 | 在 §18.4 认账行补一句（该括注对本族不可达），或按 §16.4 定形面对文案加「有枚举」前提 |

（结论：#1–#4 为报告并修的轻项，不阻塞；#5–#12 为可选观察。无 🔴 —— 需求三条覆盖齐、字段口径有证据档位、AC/用例可机检且算术自洽（589 824 / 624 230 与 1 048 576 − 65 536 / 8 192 复算一致）、受影响文件标注齐（`model-specs.mjs` 359 / +~7 → ~366，未见档位越线）。）

## §4 用户批准（主 agent）

**批准（父侧代签 · 2026-10-10 · 用户 09:50「自动跑」授权内）**：设计评审轮 1 = **pass**（🔴 0 ∥ 🟡 4 ∥ 🔵 8）；评审发现逐号处置毕——修正轮 11 项已落地并经父侧逐处核验（§18.4 双坐标 `:2052` ∥ 逐键凭据段 `:2055-2065` ∥ 认账 `:2067` ∥ 用例号注 `:2091` ∥ AC-4/G-7 补句 `:2087`/`:2101` ∥ §2.5 as-of `:182` ∥ 变更记录 `:2334`）；#3 = 技术反证（非问题——官方逐档页注逐字）；#10 = 父侧域处置毕（§1 状态行已更实值 ∥ 模板占位行按批档工具规格合法保留）。

**三条件核验**：① 评审 pass 0🔴 ✓ ② 修正轮落地 + 逐条核验 ✓ ③ token 已签发 ✓。批准信号已出（token ∕ designId = 运行时凭据，不载文档）。**实施轮已派**（单舱：两行入表 + 批内件用例 G-1..G-7）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（两行入表 + 批内件 G-1..G-7 · 复跑 7/7 绿）


**实施轮（eng-coder · 2026-10-10）**

**交付摘要**：
- ① `gemini-3.8-flash` ∥ ② `gemini-3.7-flash` 两行入表 + 行注 5 行——落点 `thincoder-core/model-specs.mjs:208-214`（插入锚 = `["gemini-3.1-pro", …]` 现读 `:207` 之后、Tencent 段注之前；§18.2 行文草案逐字照落）；净 +7 行（359 ⇒ 366）。
- ③ 批内件新增 `docs/batches/2026-10-10-gemini-model-specs.test.mjs`（103 行 · 用例 G-1..G-7 逐例落）；复用命令 = 仓根 `node --test docs/batches/2026-10-10-gemini-model-specs.test.mjs`。

**复跑读数（本实施轮实跑 · 仓根 `thincoder/`）**：
- `node --test docs/batches/2026-10-10-gemini-model-specs.test.mjs` ⇒ tests 7 ∥ pass 7 ∥ fail 0。
- `node --check thincoder-core/model-specs.mjs` ⇒ exit 0。
- 仓套件未跑（属父侧收口面）；`git diff thincoder-core/model-specs.mjs` ⇒ 单 hunk +7 行（表区外零动）。

**决策透明表**：

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | AC-4 / G-7 两函数取数 | 直调 `outputReserve`（`thincoder-core/config.mjs:117`）∥ `resolveCompactThreshold`（`:139`） | 实施轮实读 = 均具名导出（任务书补句警戒的正面分支；无需改经公开消费面取读数） |
| 2 | G-6 覆盖范围 | 两行循环（`thinkOffPath === false` + 五键 undefined） | G-6 只点名 3.8；AC-3 写「两行」⇒ 取并集（超集不冲突） |
| 3 | G-2 独立性断言 | 补对象不同一断言（两行 spec 非同一对象） | G-2 期望列「两行同形、各自独立行」 |
| 4 | 批内件形态 | ROOT 相对（`fileURLToPath(new URL("../../", …))`）+ `pathToFileURL`；`config.mjs` 导入循 2026-10-09 purge-core 先例（`:34`） | 任务书指定形态；先例 = `docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs` |
| 5 | 行注与表行字面 | 逐字照落（未改写一字） | §18.2「实施轮照此落笔；行注为逐行标级义务」 |
| 6 | 批内件 103 行 > §18.5 预估 ~60–80 | 不裁剪用例 / 不压注释；读数交收口记录 | 预估为区间非判据；G-1..G-7 覆盖优先（advisor 评审 🔵 项，无功能影响） |

**内部审计与代码评审（轮次与终态）**：
- 偏差审计（explore · 轮 1）：**CLEAN**——四类偏差（部分实现 / 静默简化 / 文档漂移 / 列表外改动）零发现；其检查 E（自行实跑测试 + git diff）因该装配无 shell 工具未执行，由本实施轮实跑读数补足（7/7 绿 ∥ 单 hunk +7 行）。
- 代码评审（advisor · 轮 1）：**pass（🔴 0）**——in-scope 1 条 🔵（批内件行数标注漂移：103 行 vs 设计 `~60–80`；读数面，无结构影响）+ 3 条面外注记（无严重度）：① server 展示快照 `thincoder-server/public/model-specs-snapshot.mjs:75` 未含两新档 ⇒ 旧批内件 `docs/batches/2026-10-06-models-config.test.mjs:179` 的漂移断言重跑即红——设计 §18.8 已声明零触（既定手工同步机制），属后续批协调项；② 本段即批档 §5 补记；③ 设计 §18.4 认账句（`:2067`）「无枚举 ⇒ 括注不可达」的理由与 `thincoder-cli/src/tui/cmd-think.mjs:19` 现读（`?? ["high", "max"]` 兜底档）不符（结论「不生效」成立；措辞面归文档层）。
- fix round：**0 轮**（无 must-fix 项）。终态 = **clean**。

**边界声明（禁改面零动）**：仅触 `thincoder-core/model-specs.mjs`（表区 +7 行）∥ 新增批内件一档；其余零动——预设表（`thincoder-core/config-presets.mjs`）∥ `thincoder-core/provider/**` ∥ 三端（VSC / Desktop / CLI）∥ server 快照 ∥ 存量 gemini 四行 ∥ 查表逻辑 / 告警文案 ∥ 同文件 `assistantToolCallMessage` 函数区（撞面约束：现读 `:352-365` 未触）∥ 设计档（DOC = 设计师笔）。

## §6 验证与收口（父代理）

### 6.1 交付核验（实跑读数 · 父侧 2026-10-10 10:1x）

- 批内件复跑（仓根）：`node --test docs/batches/2026-10-10-gemini-model-specs.test.mjs` ⇒ **tests 7 ∥ pass 7 ∥ fail 0**（G-1..G-7 全绿——父侧实跑）。
- 语法：`node --check thincoder-core/model-specs.mjs` ⇒ exit 0（实施轮读数，父侧同判）。
- 改动面实读：`thincoder-core/model-specs.mjs:208-214`（+7 行——行注 5 行 + 两表行，逐字对齐 §18.2 草案；`git diff` 单 hunk）。
- AC 回指：AC-1..AC-4 由 G-1..G-7 覆盖（两跑同判）；实施轮实读确认 `outputReserve`（`thincoder-core/config.mjs:117`）∥ `resolveCompactThreshold`（`:139`）均具名导出 ⇒ 直调取数成立。

### 6.2 测试纪律线

- ① 本批 unit 文件 = `docs/batches/2026-10-10-gemini-model-specs.test.mjs`（随批档存档——无处置项；复跑命令见 6.1）。
- ② 集成场景：无影响（纯数据面两行；不涉业务流程）。
- ③ 仓套件：未跑（父侧收口面口径——本批以批内件为准）。

### 6.3 结算同步核单

- **角色表**：§1 主 agent ∥ §2 eng-designer ∥ §3 评审（轮次 1）∥ §4 主 agent ∥ §5 eng-coder ∥ §6 主 agent——各段单一作者在位。
- **状态行**：§2 = 设计完成 ∥ §3 = 评审完成（pass）∥ §5 = 实施完成（§1 收口态由 close 落）。
- **计数**：评审 🔴0 / 🟡4 / 🔵8；处置 = 收正 11 ∥ 非问题 1（#3——官方逐档页注逐字实核）∥ 父侧域 1（#10）。用例 G-1..G-7 = 7 条（实施落位）。
- **指针**：台账 #1198 task_book → 本档（在盘）；§2 ∥ §18 ∥ 变更记录三分同源。
- **变更记录**：设计轮 `:2334` ∥ fix 轮 `:2335` ∥ 收口机械笔 `:2336`（父侧直执行 · 可 revert——§18.4 认账行理由收正）。
- **遗留待办**：本批新增未决 = 0；面外注记两条已归口——快照同步 = 台账 #1203（证据已补：`thincoder-server/public/model-specs-snapshot.mjs:75` 段末仍 `gemini-3.1-pro` ∥ 旧批内件 `docs/batches/2026-10-06-models-config.test.mjs:179` 漂移断言重跑即红 ∥ `OPS.md:49` 同步笔三处同改）；§18.4 措辞 = 本回合父侧直执行收正（`:2067-2068`）。
- **暂缓批复核**：无。
- **前批遗留交叉核**：无。
- **结算行**：见收口回报（`/ledger` 面）。

### 6.4 收口注

- 提交：code = `thincoder-core/model-specs.mjs`；docs = 本档 + 批内件 + `docs/core/design/MODEL-SPECS.md`（两笔均 path-limited；提交读数落父侧回报与台账 evidence——本档冻结后零回改）。
- 设计槽：收口后 consume（运行时凭据，不载文档）。
