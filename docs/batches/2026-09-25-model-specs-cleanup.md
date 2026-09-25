# 2026-09-25 · MODEL-SPECS 清理批（8 条归批待办 · 覆盖面 + effort 面 + 口径差 + 死字段）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 04:15「model_spec开批处理吧，开始前务必重新核实一下问题是否还存在」（台账归批待办 8 条 · 实核 8/8 仍在后立批）。
> 台账 = #11（PROVIDER · 归批）+ #14 / #15 / #16 / #17 / #18 / #19 / #21（MODEL-SPECS · 归批）。前情 = docs/batches/2026-09-20-qwen-flash-specs.md §6（已收口 2026-09-20）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25

**用户指令（2026-09-25 04:15 · 逐字）**：「model_spec开批处理吧，**开始前务必重新核实一下问题是否还存在**」。

## 1.1 开批前实核（父侧 · 2026-09-25 04:15-04:20 · 全部现盘取证）

| # | 原判（09-19/20 登记） | 实核结论 | 现盘证据（本轮实读/实跑） |
|---|---|---|---|
| 11 | 覆盖面巡检：前沿新名掉兜底 + 10 借托底 qwen 名 + grok 泛前缀 | **仍在** ✓ | 实跑 `specForModel`：`gemini-3.1-pro` / `claude-fable-5.1` / `step-3.7-flash` / `qwen-flash` / `qwen-vl-max` 全落 DEFAULT `{128_000, 32_000}`（掉兜底）；`grok-4.7` / `grok-4.8` 靠 `grok-4` 泛前缀托底（`500_000 / 64_000`）——同族风险在 |
| 14 | `cacheMode` 死字段（零判据消费 · **17/66 行缺键**仍运作） | **仍在** ✓ | `.cacheMode` 消费面全仓 grep = 仅 `model-specs.mjs` 自身定义行（含 `:215` DEFAULT_SPEC）——代码零消费；测试面断言已随 qwen 批 D-10 删除（`model-specs.test.mjs` 零活体断言） |
| 15 | hy3 族 / seed 两档 VSC 默认 effort 未登记 ⇒ 下拉落 none=off | **仍在** ✓ | `thincoder-vscode/src/specs.mjs:22-41` `EFFORT_DEFAULT_PREFIXES` 十八条无 hy3 / doubao；实跑 `hy3` 与 `doubao-seed-2-0-…` `enum0 = "none"`；兑底链 `settings-state.js:48` = `effortDefault \|\| levels[0]` 仍在 |
| 16 | CLI cmd-config 会诊 effort picker 双 none 行 | **仍在** ✓ | `cmd-config.mjs:180` 原文 `const levels = ["none", ...enumList]` 未动；`qwen3.8-flash` 枚举含 `"none"`（`model-specs.mjs:95`）⇒ 必双行 |
| 17 | `cmd-think.mjs:86-87` 回执守卫零测试射程 | **仍在** ✓ | 全测试面 grep `handleThinkCommand` = 仅 `cmd-think.test.mjs:36` 注释（模拟分叉位，非驱动本体）；`applyThink` 有导出测试但回执公式不在其射程 |
| 18 | advisor/consult effort 菜单 none 无 off 语义（CLI + VSC 同族） | **仍在** ✓ | `cmd-advisor.mjs:116-117` `cfg.reasoningEffort = c.action.slice(7)` 直赋原样；VSC `thincoder-vscode/webview/settings-agent.js:50/:63` 裸枚举 select + `defaultEffortFor` 兜底（hy3 类模型枚举首项 none ⇒ 默认 off） |
| 19 | 预置 maxTokens vs 规格 maxOutput 口径差 | **半收窄** ⚠️ | **deepseek 半边仍在**：`config-presets.mjs:17` `393216` vs `model-specs.mjs:33` `384_000`；**mimo 半边已自愈**：preset `131072` = 规格 `mimo-v2.6-pro` `131_072`（后批改规格行对齐）——原证据坐标 `:94/:95` 已漂移失效 |
| 21 | glm-5.3-flash 行 maxOutput `128_000` → `131_072` | **仍在** ✓ | `model-specs.mjs:60` 仍 `128_000`；实跑读数 `max = 128000`（校验级实测证据在 #20 批 §1.2：`131_072` 受理 / `200000` → 400「限制数值范围[1,131072]」） |

**实核结论：8/8 仍可开批**；#19 按实核收窄为 **deepseek 半边**（mimo 半边销案，证据坐标随行号漂移更新）。实核脚本 = `.thincoder/tmp/_specs-verify.mjs`（用后即删）。

## 1.2 本批范围（8 条 · 台账 #11 / #14 / #15 / #16 / #17 / #18 / #19 / #21）

- **类型分组**（供设计轮分面）：**数据行修正** = #21（+19 的 deepseek 半边口径裁决）· **覆盖/巡检** = #11 · **effort 面族** = #15 / #16 / #18（三面同根：none 语义三义——清档 / 关思考 / 枚举值，全链未归一）· **测试射程** = #17 · **决策型** = #14（删字段 vs 保留禁断言，两候选已有）。
- **范围裁定（实核导出）**：#19 只做 deepseek 半边（mimo 销案入证据）；#11 的「逐名实测补行」部分需活体 API 取证——**取证路径 = 分析归设计轮、裁定归父侧**（三候选：父侧实测 / 实施轮受限实测 / 认账退化）。
- **批次边界（不做什么）**：不动非 MODEL_SPECS 面（#5 超软线 / #13 队列跨投递不在本批）；不改六态与批档机制；不做跨实例面；#14 的字段处置**只能两选一并给判据**（禁「先留着再说」）。

## 1.3 授权口径

用户 04:15 指令 = 立批 + 强制开批前实核（本 §1.1 即实核交付）；**设计评审点火权与 §4 批准权**照会话惯例（LEDGER-EXECUTOR §1.0 排程授权 + BATCH-LIFECYCLE-TOOL §1.0 代授权先例 + 06:42「两组都处理了吧」的范围批准形态）——执行方式到点按用户当轮口径落，用户若停则停下等显式放行。

## 1.4 实核补充：kimi-code 平台 4 模型活测清单（跨实例 memory 送达 · 2026-09-25 04:54 落）

> 源 = 项目层 memory `project:D:/teamcode/.thincoder/memory:20260924-kimi-code-…-x327`（CLI 侧会话 → VSC 侧会话共享 · 2026-09-25 04:5x `GET https://api.kimi.com/coding/v1/models` status 200 实测）。

| 模型 | display | ctx | image/video | dynamic_tools | think_efforts（default） | 我方规格行 |
|---|---|---|---|---|---|---|
| `kimi-for-coding` | K2.8 Preview | 1,048,576 | ✓/✓ | ✓ | [low,high,max] (**max**) | **缺**（全仓零命中）|
| `kimi-for-coding-highspeed` | K2.7 Code Highspeed | **262,144** | ✓/✓ | ✗ | **无块** | **缺** |
| `k3` | — | 1M | — | — | — | ✓ `model-specs.mjs:48` |
| `k3-256k` | — | 262,144 | ✓/✗ | — | [low,high,max] (high) | **缺** |

- **并入本批 #11 覆盖面族**（memory 归属建议 + 不另开批防撞 `model-specs.mjs` 两线写）——CLI 侧册另记 #288 备查。
- **防合并警戒**：`kimi-for-coding-highspeed`（256K）与既有行 `kimi-k2.7-code-highspeed`（128K）**display 同名、上下文不同**——分行处理，勿合并。
- **未决点（用户裁定）**：kimi-code 预置默认模型是否 `k3` → `kimi-for-coding`（渠道同名 + 行更新）——列设计轮上抛，拍板归用户。

## 1.5 用户裁定（2026-09-25 05:04 · 逐字「不转」）

§1.4 未决点**已裁**：kimi-code 预置默认模型 **保持 `k3`，不转 `kimi-for-coding`**——设计轮该项上抛消解（无需分析与建议），设计档/批档不得再将其列未决；仅 `kimi-for-coding` 等三个缺行按 #11 补行即可，预置面零动。

## 1.6 授权（**父侧代点火 + 代批准** · 全链 · 2026-09-25 05:05 · 覆盖并扩写 1.3）

**用户原话**：「自动跑完吧。」⇒ 本批全链——**设计评审点火权 + §4 批准权 + 修正轮/实施轮派发 + 收口核销提交**——均委托父侧自动执行，至本批完结（沿 02:51 hygiene-ab 批同型授权）。

**父侧自缚**：① 代签仅当「评审 pass（0🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 05:05 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 复评再出 🔴 ⇒ 停下回报，不循环自动修；④ 实施验证不过（测试红 / AC 不满足）/ 需新范围 ⇒ 停下上抛；⑤ 收口提交走 path-limited + 工作树核对（CLI 实例在飞面零触碰）；⑥ §1.5 用户裁定（不转）与 §1.1 实核范围（8/8 + #19 收窄）为不可扩边界。

## 1.7 裁定：#11 取证路径 = ①父侧实测（2026-09-25 05:25 · 父侧依 1.6 全链授权代裁）

- **采纳设计轮倾向 ①**，否决 ②③：② 实施轮受限实测 = 把网络探测混进 token-gated 产品码轮次，面不正；③ 认账退化 = 五名继续落 DEFAULT，#11 核心缺陷（掉兜底）零移动，等于没修。
- **依据**：先例一致——#20/#21 批 maxOutput 全为父侧实测取证；kimi 四模型表即跨实例 memory 通道送达（§1.4）；父侧探测 = 只读、不碰仓、token 极小。
- **执行安排**：取证范围 = 掉兜底五名（gemini-3.1-pro / claude-fable-5.1 / step-3.7-flash / qwen-flash / qwen-vl-max）+ grok 泛前缀风险面（grok-4.7/4.8 实测响应确认泛前缀托底是否失实）——**实施派发前**由父侧以子代理隔离执行（读密钥面不进主上下文），读数以 §1.7.1 或 memory 交付；kimi 三缺行无需探针（§1.4 已供）。
- **AC-11 判据形态定**：五名按实测值登记 + 「规格行与实测读数一致」可机器核（非「挂未探登记」）。
- 批档 §1.2 该句措辞矛盾（「设计轮裁定」vs「不得自行拍板」）已就地收正为「分析归设计轮、裁定归父侧」。

### 1.7.1 五名实测读数交付（2026-09-25 07:1x · 父侧 · §14.4-1 收口）

**探针实测面（qwen/dashscope · 服务端直报 · 最强证据级）**：

| 名 | context | maxOutput | thinking | 备注 |
|---|---|---|---|---|
| `qwen-flash` | 未取到 | **32_768**（服务端直报 `Range of max_tokens should be [1, 32768]`；262144/131072/65536 全 400） | 默认关（param 缺省 → 无 `reasoning_content`）· 可开（`enable_thinking=true` → `reasoning_content` 在场） | 渠道内精确名 `qwen-flash` ✓ |
| `qwen-vl-max` | 未取到 | **32_768**（同上直报） | **不支持**（`enable_thinking=true` → 400 `thinking_budget … not greater than 0`；缺省无 reasoning） | 渠道内精确名 `qwen-vl-max` ✓ |

**渠道受限面（未配置/未激活——网络转述值 · 非实测 · 行注标级）**：

| 名 | 渠道状况 | context | maxOutput | 其它 | 裁定面 |
|---|---|---|---|---|---|
| `step-3.7-flash` | dashscope 列名 `stepfun/step-3.7-flash`——**未激活**（400 "product is not activated"） | 262_144（多源 256K） | 未取到 | — | 裸名不在渠道清单——行键按实到名归实施定 |
| `claude-fable-5.1` | 本机无渠道 | 1_000_000（多源） | 128_000（多源明记「128,000」） | thinking：always-on adaptive（弱源） | 行值 + 行注标级 |
| `gemini-3.1-pro` | 本机无渠道 | 1_048_576（多源） | 65_536（多源） | thinking：有·计入输出预算（弱源） | 行值 + 行注标级 |
| `grok-4.7` | 本机无渠道 | 500_000（两源）= 与泛前缀行**相符** | 未取到 | — | **记证维持泛前缀**（§14.4-2 相符分支；output 未取到 ⇒ 无失实证据） |
| `grok-4.8` | 本机无渠道 | **无官方口径**（xAI 未发布规范） | 未取到 | — | 无据补专行——维持泛前缀 + 记证 |

**交付口径**：① 实测面 = 服务端直报（最强级）；② 网络转述面 = 供行值 + 行注标级（**先例 = qwen 批 AC-6 已裁「官方口径（网络转述）允许入表 + 行注标级」**）；③「未取到」字段 = **零口径**（§14.3 既裁——兜底语义在该字段继续生效）；④ 本表 = AC-1 的「读数」基准面，行值与之一致即可机器核。**渠道缺口如实登记**：gemini / anthropic / xAI 三渠道本机未配置；stepfun/step-3.7-flash 需百炼控制台开通——如需升级为实测，用户提供渠道后另轮补探。

## 1.8 设计交付验证与 findings 裁定（2026-09-25 06:2x-06:35 · 父侧）

**验证**：批档 §2.1–§2.9（8 AC 三分同源 + D-a~D-h 含拒弃项 + 17 行文件表 + 用例载体分派）与设计档 §14（14.1–14.10 + 变更记录）实读——**通过**，按 §1.6 全链授权直接进评审。

**六项 findings 逐条裁定**：

| # | 内容 | 裁定 |
|---|---|---|
| 1 | #19 六家超限扩面（父裁） | **采纳设计 D-g 形态**（deepseek 修 + 不变式 + 白名单锁六家）——理由：不变式 + 白名单「实际超限集==六家」= 绊网（新漂移即红），六家逐对处置需逐对证据（父侧实测配对基准：**真行三对** grok/mistral/openrouter 可直对齐；**兜底三对** hunyuan/siliconflow/groq 配对基准 = DEFAULT 占位，须先补覆盖）。**已立跟进条目 #326**（trigger=条件）。本批扩面 = 否（证据不全时盲改 = D-g 自身否决的「无实测依据」同类） |
| 2 | §1.1-行14 计数陈旧（8/42 → 17/66） | ✅ **父侧已就地收正**（含 model-specs.test.mjs 零字面核证 + model-ref/image-downgrade 各 1 键归属说明） |
| 3 | §1.1-行18 路径缺前缀 | ✅ **父侧已就地收正**（补 `thincoder-vscode/webview/`） |
| 4 | mimo/minimax 枚举待复核 | ✅ **父侧复核完**（2026-09-25 06:2x 实跑）：`mimo-v2.5-pro` / `mimo-v2.6-pro` = ctx 1M / max 131_072 / think true / **enum null**；`MiniMax-M2.7` / `MiniMax-M3` = 行在 / **enum null**——**两族均无 effort 枚举**（无枚举声明可更正）；另记：`minimax-m2.5` 小写字串落 DEFAULT（该字串系父侧探针自拟、非实服务名 ⇒ 不作覆盖缺口判定） |
| 5 | 实施前置核对 4 条 | → 归实施轮（回填 §5；设计档 :1396-1401 已载） |
| 6 | 五名实测读数待父侧交付 | → 实施派发前父侧交付（§1.7 承诺；kimi 三缺行 §1.4 已供） |

**台账面更正（父侧）**：本批八条在**主库**（键 `D:\teamcode\thincoder`）= **#307 / #310 / #311 / #312 / #313 / #314 / #315 / #317**（待设计 + 本批 task_book）；此前会话在**第二台账库**（小写盘符键）的同批条目已于 06:04 两库合并时并入（+296 偏移）。#19b 跟进 = 主库 **#326**（06:35 补录；第二库残留存根已销案）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正（changes-required · #1/#2/#3/#4/#6/#7/#8）已落、#5 前轮已落、#9 交交付前核验；残留收正轮（DOC 面 · 🔵2/🔵3/🟡1 + 两外档）已落（2026-09-25）；收口前对齐轮（§14.6 注层 + 附注六）已落（2026-09-25））

### 2.1 覆盖条目（八条 · 台账 / 批档 §1.2 / 设计档 §14.7 三分同源）

| # | 条目 | 来源锚 | 本轮范围 |
|---|------|--------|----------|
| AC-1 | #11 覆盖巡检补行 | 批档 §1.2-#11 / §1.7 | 实核五名（gemini-3.1-pro / claude-fable-5.1 / step-3.7-flash / qwen-flash / qwen-vl-max）补规格行；kimi 三缺行（kimi-for-coding / kimi-for-coding-highspeed / k3-256k）分行落行；grok-4.7/4.8 按父侧实测裁定——失实补专行、相符记证维持泛前缀 |
| AC-2 | #14 cacheMode 删除 | 批档 §1.2-#14 / §1.1-行14 | 字段整体删除（字段注 model-specs.mjs:20 + 49 行键 + DEFAULT_SPEC:215 + 注释提及 = 61 处字面 → 0）；T-13 改零字面门；model-ref.test.mjs:85 / image-downgrade.test.mjs:120 去键；DOC 侧收正随码同落实施轮 |
| AC-3 | #15 VSC effort 占位 | 批档 §1.2-#15 / §1.1-行15 | 无注册默认时下拉占位「—」：不预选、落盘不写 effort；hy3/doubao 官方默认档**注册不做**（探针挂 #11 取证族，扩面 = 上报） |
| AC-4 | #16 /config 双 none | 批档 §1.2-#16 / §1.1-行16 | :180 levels 抽纯函数去重（前置唯一 "none"）；:205/:232 消费语义零变；新建 cmd-config-effort.test.mjs |
| AC-5 | #17 回执守卫补测 | 批档 §1.2-#17 / §1.1-行17 | handleThinkCommand 注入驱动补 cmd-think.test.mjs；cmd-think.mjs 码面 ±0 |
| AC-6 | #18 advisor 归一 off | 批档 §1.2-#18 / §1.1-行18 | effort_none → 归一 think_off 分支 + 删 cfg.reasoningEffort + 回执 "Thinking: OFF"；VSC settings-agent.js:50/:63 两 select 同约；新建 cmd-advisor.test.mjs（全仓现无此档 = 新建非改） |
| AC-7 | #19 deepseek 半边 | 批档 §1.2-#19 / §1.1-行19 | config-presets.mjs:17 maxTokens 393216 → 384_000；新增不变式 `preset.maxTokens ≤ spec.maxOutput`（白名单六家只减不增：grok / mistral / hunyuan / siliconflow / openrouter / groq） |
| AC-8 | #21 flash maxOutput | 批档 §1.2-#21 / §1.1-行21 | model-specs.mjs:60 128_000 → 131_072；级联 :67 行注、本档 :733/:812、test F-3:451 改值（F-1:429 / F-2:439 断言不动）；glm-5.3 本体 :59 冻结 |

**明确不在本批**：#5 / #13（批档 §1.2 排除）；k3 预置零动（§1.5 用户逐字「不转」= 不可扩边界）；mimo 半边（销案）；hy3/doubao 默认档注册（挂 #11 取证族）；DOC 侧 cacheMode 收正的**动手时机**归实施轮随码同落（本设计轮只列清单）。

### 2.2 设计定案（决策 + 判据 + 拒弃项）

| 定案 | 内容 | 判据 | 拒弃替代及理由 |
|------|------|------|----------------|
| D-a（AC-2/#14） | cacheMode 字段整体删除 | 全仓 `.cacheMode` 消费面 = 0（批档 §1.1-行14 实核）；行 66 / 携键 49 / 缺键 17——键已成维护税而零消费者 | 保留字段 + 测试禁断言：旧 42/34/8 基线白名单永久成本；D-10 当年已预裁「去留转台账」，台账 #14 本批核销即删 |
| D-b（AC-8/#21） | flash maxOutput = 131_072 | #20 批 §1.2 校验级：200000 → 400「限制数值范围 [1,131072]」 | 维持 128_000：低于服务端真上限 3_072 输出位；实测 max=128000 是请求侧表现，非上限证明 |
| D-c（AC-1/#11） | 三 kimi 缺行**分行**落行 + 五名补专行 | §1.4 活测（服务端 200 /models）+ 父侧实测五名读数 | 并入 k3 行：1M 与 256K、effort 块有无均不同，合并即错；grok 无读数先补行：无实测不声明 |
| D-d（AC-3/#15） | 未注册默认 → 占位「—」，不预选、不落盘 | 防与 hy3/doubao `thinking:true` 矛盾（enum0="none" = off，冒充默认 = 误标关思考） | 取 levels[0] 兜底预选：即 settings-state.js:48 现行为，正是缺陷面本身 |
| D-e（AC-4/#16） | levels 抽纯函数，唯一 "none" 前置 | :180 现文 `["none", ...enumList]` 对含 none 枚举（qwen3.8-flash）出双行；:205/:232 只认 `=== "none"` ⇒ 去重零语义变 | 改 :205/:232 适配双行：动消费语义，扩面且无收益 |
| D-f（AC-6/#18） | effort_none 归一 think_off 分支 + 删 reasoningEffort + 回执 OFF | 镜像 cmd-think.mjs:104 归一式 / :127 off 删档 / :82 回执先例；残留 "none" 会被载荷层当强度档送（cmd-think.mjs:102-103 注实证） | 直赋原样改值（"none" 当强度档照发 = 原缺陷不消）；静默不回执（菜单状态不可见） |
| D-g（AC-7/#19） | deepseek 降到 384_000 + 不变式 + 白名单 | 预置 ≤ 规格行（model-specs.mjs:33 实值 384_000）；六家超限为已知存量 | 抬规格行到 393216：无实测依据 = 捏造口径；全量硬断言不带白名单：六家存量即红，扩面须另行裁 |
| D-h（AC-5/#17） | 纯补测，cmd-think.mjs ±0 | 回执公式 :86-88 已正，缺陷 = 零覆盖（全仓仅 :36 注释提及 handleThinkCommand） | 改码重构：语义已对，动码即引入回归面 |

### 2.3 影响文件清单（as-of 2026-09-25 设计轮实测行数；实施读数回填本档 §5）

| 文件 | 现状 | 预期增量 | 要点 |
|---|---|---|---|
| thincoder-core/model-specs.mjs | 326 | +~10 −1 ⇒ ~335 | 改值 :60 + 补行 8 + 删字段 61 字面→0；>300 登记在位（presence 式零改）；本批不拆 |
| thincoder-core/test/model-specs.test.mjs | 477 | ±0 | T-13:250-262 改零字面门、F-3:451 改 131_072；新增锚落新载体档（500 余量 23 保留） |
| thincoder-core/test/model-specs-cleanup.test.mjs（拟新增） | 0 | ~90–130 | C-1..C-6 承载（循 mimo/qwen36/bench 先例，≤300 免登记） |
| thincoder-core/config-presets.mjs | 49 | ±0 | :17 deepseek 393216→384_000 |
| thincoder-core/test/config-presets.test.mjs | 51 | +~25 | 不变式 + 白名单六家双向（C-7/C-8） |
| thincoder-vscode/src/specs.mjs | 88 | +1 ⇒ 89 | EFFORT_DEFAULT_PREFIXES +["k3-256k","high"]（kimi-for-coding 由 ["kimi","max"] 同值覆盖，零加） |
| thincoder-vscode/test/image-downgrade.test.mjs | 273 | +~16 ⇒ ~289 | E-5（占位/优先序/删键）+ CONTRACT:120 去键 |
| thincoder-vscode/webview/settings-agent.js | 174 | +~14 ⇒ 188 | :50/:63 占位「—」+ 注册判定 + none 删键 |
| thincoder-vscode/webview/settings-state.js | 53 | +~5 ⇒ 58 | 新 helper registeredEffortDefaultFor；:48 原兜底链零改 |
| thincoder-cli/src/tui/cmd-config.mjs | 463 | +8 ⇒ 471 | 抽 effortMenuLevels；:205/:232 零语义变 |
| thincoder-cli/test/cmd-config-effort.test.mjs（拟新增） | 0 | ~50 | E-1/E-2 |
| thincoder-cli/src/tui/cmd-advisor.mjs | 255 | +8 ⇒ 263 | :116-117 归一 off + delete reasoningEffort + 回执 OFF |
| thincoder-cli/test/cmd-advisor.test.mjs（拟新增） | 0 | ~65 | E-3；全仓现无此档 = 新建（批档未引用，无悬空指针） |
| thincoder-cli/src/tui/cmd-think.mjs | 151 | ±0 | 码面零改（D-h） |
| thincoder-cli/test/cmd-think.test.mjs | 153 | +25 ⇒ 178 | E-4 注入驱动 handleThinkCommand |
| thincoder-cli/test/model-ref.test.mjs | 432 | ±0 | :85 deepEqual 去 cacheMode 键（必红，同步去键） |
| DOC 侧（实施轮随码同落，本轮不动） | — | 就地改 ~8 处 | PROVIDER.md:149 · CONTEXT-COMPACTION.md:336/:692/:764 · MODEL-SPECS :152/:173（42/34/8 旧计数→实测 66/49/17）· :323（D-10 保留句→台账核销）· :403-409（§7 边界与计数） |

### 2.4 验收标准回指（AC-1..8 —— 与设计档 §14.7、台账三分同源）

| AC | 条目 | 机器判定（详设计档 §14.7） |
|---|---|---|
| AC-1 | #11 | 五名命中专行逐值=交付读数 + kimi 三行字段 + 防合并三值分行（C-1/2/3） |
| AC-2 | #14 | 零字面门（产品码 0 ∧ 测试码 0 ∧ !SPEC_SOURCE.includes(INFO_FIELD)）+ model-ref:85 / image-downgrade:120 去键绿（C-5） |
| AC-3 | #15 | 未注册 →「—」selected ∧ payload 无 effort；已存>注册默认>「—」（E-5） |
| AC-4 | #16 | 含 none 枚举单 none 首位 / 无 none 前置 / 序保持；:205/:232 源零改（E-1/E-2） |
| AC-5 | #17 | 注入驱动 off 后回执 Thinking: OFF（缺守卫 = ON 即红）（E-4） |
| AC-6 | #18 | effort_none → off 形 + 删档 + 回执 OFF；effort_low → 置档；VSC 两 select 同约（E-3） |
| AC-7 | #19 | deepseek 384_000 ∧ 不变式绿 ∧ 白名单双向（实际超限集 == 六家）（C-7/C-8） |
| AC-8 | #21 | F-3:451 = 131_072 ∧ flash 行 131_072 ∧ glm-5.3 = 128_000 冻结（C-6） |

### 2.5 用例表与测试载体

载体：C 组 → model-specs-cleanup.test.mjs（拟新增）；C-7/C-8 → config-presets.test.mjs；C-6 → model-specs.test.mjs F-3 就地改值；E-1/E-2 → cmd-config-effort.test.mjs（拟新增）；E-3 → cmd-advisor.test.mjs（拟新增）；E-4 → cmd-think.test.mjs；E-5 + CONTRACT 去键 → image-downgrade.test.mjs。逐条（正常/边界/错误 · 输入 · 期望）见设计档 §14.8 用例表。

### 2.6 边界（本批不做）

#5/#13 排除（批档 §1.2）· k3 预置零动（§1.5「不转」= 不可扩边界）· mimo 半边销案 · hy3/doubao 默认档不注册（挂 #11 取证族，扩面=上报）· 五名未交付字段零口径 · DOC 收正归实施轮 · model-specs.mjs 本批不拆 · provider/core.mjs 守卫/裁剪零改 · 六家预置超限不本批修（仅白名单+上报）。

### 2.7 UI/交互决策（全落地，无 open）

VSC 两 select：预选 = 已存值 > 注册默认 > 占位「—」，「—」不落盘，选 none = 删键（不写字面）· CLI /config：levels 唯一 none 首位，none=清档语义不变 · CLI advisor 菜单：effort_none 回执 Thinking: OFF + off 形落盘 · CLI /think 可见面零变化 · 建行影响 = 选择面由兜底/告警转专行值（循 §13.10 同则）。

### 2.8 上抛与实施前置核对（详见交付报告）

实施前置核对四条（回填 §5）：① adv.effort→cfg.reasoningEffort 消费链 unverified；② advisor 菜单 levels 构造面是否同出双 none；③ specs.mjs reasoningEffortDefault 实际消费方；④ image-downgrade T-15 断言 vs 现表键嵌套（deepseek-v4-flash ⊂ -vision-exp、k3 ⊂ k3-256k）。
上抛（非本批可裁，逐条 file:line 见交付报告）：#19 六家超限扩面（config-presets.mjs:30/:31/:33/:37/:38/:39）· 批档 §1.1-行14「零活体断言」措辞 vs model-ref.test.mjs:85 实含键 · 批档 §1.1-行18 路径无 webview/ 前缀 · 本档 :152/:173 旧计数 42/34/8 vs 实测 66/49/17（归实施轮）· cmd-advisor.test.mjs 全仓不存在（本设计按新建落）· mimo/minimax 枚举更正（承前次会话记录，指向批档 §1.1 面——细节请主 agent 复核）。

### 2.9 收正补记（同轮 D6 读回核证 · 2026-09-25）

- **§2.2 D-a 判据栏**「旧 42/34/8 基线白名单永久成本」**收正**为「计数基线已两度漂移（MODEL-SPECS :403-405 记 53/40/13→56/45/11，实测 66/49/17）= 永久维护成本」——42/34/8 出自本档 :1470 历史批注，非现基线；设计档 §14.1 D-a 已同步收正。
- **§2.3 / §2.8「本档 :152/:173（42/34/8 旧计数）」收正**为：:152 = DEFAULT_SPEC 行（含 `cacheMode: "none"` 且引旧坐标 `:118`——实际 `:215`）；:173 = 消费面表 cacheMode 行（坐标 `:118/:198` 均旧）；**计数块实际 = :403-405**；:409 =「不删 `cacheMode` 字段」句（随 D-10 核销改写）。归实施轮 DOC 清单不变，设计档 §14.5 已同步收正。
- **计数对账（核证）**：:403-405 投影「56/45/11」+ bench 批 §13 十行（glm-4.5-air / qwen3.7-plus / qwen3.5-27b / MiniMax-M2.7 携键 = +4；kimi×3 / doubao×3 无键 = +6）= **实测 66/49/17** ✓ 对账闭合。

### 修正轮（设计评审轮 1 · changes-required）——处置记录（eng-designer）

改动面 = 单档 `docs/core/design/MODEL-SPECS.md`（两批就地改写共 39 组）。行号 = as-of 修正轮读回值。

- **#1 VSC 改面不全 → 收**：改面重定义——`settings-state.js` 新增 `effortSelectView` / `effortPayloadValue`、`defaultEffortFor` 并入删除（零调用者；`effortEnumFor` 零改）；`settings-widgets.js:44-53`（换模型重建径）与 `settings-models.js:26-30`（payload 归一；`:18` 读面保原值）入动面入文件表。落点：`:1369`（零改面）/ `:1371`（动面）/ `:1391-1394`（文件表四行：settings-agent 174→~176 · settings-widgets 109→~111 · settings-models 214→~218 · settings-state 53→~65）/ `:1417`（AC-3 补两径）/ `:1439`（E-5 补径②）/ `:1456-1458`（§14.10 两渲染径同源 + 载荷两点）。
- **#2 `kimi-for-coding-highspeed` 端差继承 → 披露 + 裁定「接受继承」**：兜底两层 = 空枚举 ⇒ `effortSelectView` 返 null + 「注册默认须 ∈ 枚举」前置；先例 = `image-downgrade.test.mjs:270`、前缀语义 `specs.mjs:19-21`。落点：`:1339`（§14.2 #12 行注）/ `:1353`（§14.3 端差继承注）/ `:1417`。
- **#3 flash 128_000 差异句 → 收**：`:732-733`（§10.1）/ `:803`（F-1 行：去「≠ 128_000」，差异判据收于排序面）/ `:811-812`（§10.8 条：残留上抛 ⇒ 已随 §14 收正）；§14.2 #1 行注 `:1332`；F-1 测试档 `:426`/`:429` 措辞去向落 `:1385` 行注（取值断言与 `:431` `notEqual` 保留）。
- **#4 活体互斥句清零 → 收**：`:152`（去 `cacheMode`、坐标 :118→:215）· `:173`（坐标 :118/:198→:215/:292、字段随 §14 删除、效力面收口）· `:323`（D-10 结项注 = 台账 #14 核销）· §7 块 `:403-408` 改写 + 原「不删字段」条删除 · `:409`（旧兑底链句 → `:44-49` + 已随 §14 收正）· 兜底链旧引用七处同因收正（§2.8 两处 / §3 行 / §4 D-5 / §7 条 / §11.4 段 / §14.1 D-d 行）。
- **⑤ #5 → 前轮已落，无新改动**。
- **⑥ 行数口径 + 登记状态 → 收**：§14.6 表头补 `wc -l` 双口径注（read 面 = +1；先例 `core-hygiene.test.mjs:44`）〔`:1378`/`:1380`〕；`cmd-config.mjs` 行补「`SOFT_LINE_REGISTRY` 扫描域 = `thincoder-core/`（`core-hygiene.test.mjs:19`）⇒ 无登记机制在场、500 硬限余量 29」〔`:1395`〕。
- **⑦ 零字面门双权威 → 收**：唯一权威 = `model-specs.test.mjs:250-262`（T-13 就地改形 ±0）；C-5 用例行退场 + 表下指针注〔`:1441`〕；cleanup 载体行 AC 面 → 「AC-1/AC-8」、估计 ~80–120〔`:1386`〕；AC-2 行改写〔`:1416`〕。
- **⑧ §14.4-5 结项 → 收**：`cmd-advisor.mjs:235` `?? ["high","max"]` · `:251` 原样展开 · 无 `"none"` 前置 ⇒ 无双 none〔`:1363`/`:1407`〕。
- **⑨ → 不动**（交交付前核验）。
- **附注一**：§2 表行所记 `registeredEffortDefaultFor`（settings-state.js 行）= 本轮被 `effortSelectView` / `effortPayloadValue` 取代（同段既有行不回改，以本段为准）。
- **附注二**：VSC 测试档数 七 → **八**（两 VSC 档入表 + 三支拟新增在列；§14.5 动面行同步）。
- **观察（未动，报父侧）**：本档 `:687-692`（§9.12 项 7）与 `:1570`（变更记录）仍引旧兜底链坐标——前者属已闭批次节之发现登记面（处置「交父侧」尚悬）、后者属记录面（历史变更记录）⇒ 均未动；§14.5「七处」清单只覆盖活体面。
- **自查（D6 读回）**：首轮修正漏两处（`:323` D-10 行、`:731-733`+`:803`+`:811` 三处差异句）且自引行号偏移（误写 `:733`/`:804`/`:812`）——均已于本轮补落/收正并复读；grep 反查 `registeredEffortDefaultFor` / `:403-405` / `七支测试档` 零命中、`settings-state.js:48` 仅余上列观察点。

**附注三（§2.3 行数/口径同步 · 评审轮 1 后）**：§2.3「预期增量」列为设计轮初估，已被 §14.6 修正轮读数取代——settings-agent 174→~176 · settings-widgets 109→~111（新增行）· settings-models 214→~218（新增行）· settings-state 53→~65 · image-downgrade 273→~295（E-5 补径②）· cleanup 载体 ~80–120；实施读数仍以实施轮 `wc -l` 复验为准。§2.3 settings-state 行「:48 原兜底链零改」随 #1 修正失效（兜底链改由 `effortSelectView` / `effortPayloadValue` 承载、`defaultEffortFor` 删除——§14.2 #12 / §14.6）。§2.3 DOC 行所列 MODEL-SPECS 改动（:152/:173/:323/:403-409）已随修正轮落笔（§14.5 第一组），实施轮只剩 PROVIDER.md / CONTEXT-COMPACTION.md 两外档。

### 残留收正轮（DOC 面 · 🔵2 + 🔵3 + 🟡1 + 两外档）——处置记录（eng-designer）

范围 = 批次档 §3 轮次 2 的 🔵2 / 🔵3 / 🟡1 + §14.5 点名的两外档收正；**零代码改动**（码面 = eng-coder 在途）。行号 = as-of 本轮读回值（三档全量：MODEL-SPECS 1632 · PROVIDER 447 · CONTEXT-COMPACTION 794）。

| # | 来源 | 落点 | 动作 |
|---|------|------|------|
| 1 | 🔵2 | `MODEL-SPECS.md:1389` | §14.6 cleanup 载体行 AC 锚唯一化：`AC-1 锚承载（C-1..C-4；AC-2 门归 T-13、AC-8 锚归 F-3（model-specs.test.mjs）——均不在本档，§14.7）` |
| 2 | 🔵3 | `MODEL-SPECS.md:286` | §3 行数上限段权威面限域：本表 = 2026-09-20 修复轮复读时点；**2026-09-25 最新读数面 = §14.6** |
| 3 | 🟡1 | `MODEL-SPECS.md:694-695`（§9.12 项 7 后） | 收口注（原结论不动）：端差表现盘 **18 条**（`specs.mjs:22-41`；本项「`:22-36` / 13 条」= 当时读数）⇒ §14.2 #12 +1 = **19 条**；处置 = 不注册（§14.4-3 hy3/doubao · §14.4-4 五名条件登记）；旧兜底链（`settings-state.js:44-49`）随 `effortSelectView` / `effortPayloadValue` 收正、`defaultEffortFor` 并入删除（§14.5） |
| 4 | §14.5 | `PROVIDER.md:149` | §6.9 字段清单删 `cacheMode`（该档唯一命中） |
| 5 | §14.5 | `CONTEXT-COMPACTION.md:336` · `:692` · `:764` | `cacheMode` 引证收正：删悬空码坐标 `model-specs.mjs:20`（`:336`）；否决③（`:692`）与 2026-09-18 变更记录行（`:764`）补「字段本体随 `doc:MODEL-SPECS.md:§14` 批整体删除——§14.2 #11」 |
| 6 | 各行 | 三档变更记录 | `MODEL-SPECS.md:1475` · `PROVIDER.md:446` · `CONTEXT-COMPACTION.md:792` 各补一行；CC 残余 `cacheMode` 4 处 = 否决/标注/记录面，有意保留 |

**附注四（🔵2 同步 · §2.3 行内表述）**：§2.3「C-1..C-6 承载」按本轮收正为「C-1..C-4 承载」（C-5 已退场（⑦）；C-6 载体 = `model-specs.test.mjs` F-3——与 §2.5 自合；唯一化落 MODEL-SPECS `:1389`）；行不回改，以本段为准（循附注一先例）。

**时序说明（提前执行 · 交 §6 核销按实归位）**：§4 裁定 🟡1 → 收口轮随 §6；§2.3 DOC 行 = 🔵2/🔵3 + 两外档随实施轮同落。本轮派发含三项 + 两外档，已全部提前落笔（🟡1 = 加注式、不触原结论；两外档 = 纯 DOC 面、不涉码）⇒ 实施/收口轮按实际归位核销，不重复处理、不重复计数。

**D6 读回（本轮）**：11 处编辑逐处读回（marker 反查 + 行宽复核）：新增/改写行 10 处 ≤300（251/275/211/197/281 · 263/215 · 215/135/285）；另 `CONTEXT-COMPACTION.md:692` 表行 736（本轮 +47——该行批前 689 已越 300，见下）。

**既存形态备注（报父侧 · 非缺陷面）**：CC >300 字符行共 **14 处、全为 Markdown 表行**（表行物理不可拆行；`:692` 非本轮引入）——逐处清单本轮实读（`:182/:490/:491/:494/:688/:692/:693/:695/:697-:702`）。

**未动清单**：§14 判据本体 / `effortSelectView` + `effortPayloadValue` 契约 / AC-3..AC-8 与 D-a~D-h / §9.12 项 7 原结论（仅加注）/ 三档历史行体（仅 `:764` 最小澄清注）。

**越界发现（报父侧，未动）**：① `thincoder-vscode/src/specs.mjs:19-21` 函数头注仍引 `webview/settings-state.js:48`（代码面——本批收正后其语义已变）② `thincoder-vscode/webview/model-picker.js:82` 注释同引（代码面）③ `MODEL-BENCH.md:964` KD-36 被否① 枚举含 `cacheMode`（决策记录面）④ `docs/core/requirements/PROVIDER.md:107` R21 文本含 `cacheMode auto`（需求档 = 主 agent 笔）。

**附注五（修正轮「观察」行同步 · 本轮读回发现）**：本档 `:210` 观察句前段「§9.12 项 7（`:687-692`）未动、处置『交父侧』尚悬」随本轮失效——已落收口注（`:694-695`，原结论不动、处置 = 不注册）；同句后段「`:1570`（变更记录）仍引旧兜底链坐标、未动」**仍有效**（记录面零动）。行不回改，以本段为准（循附注一先例）。

**附注六（收口前对齐轮 · 2026-09-25 · 行不回改，以本附注为准）**：

1. **DOC 面归属收正（附注三 `:213` 末句同步）**：附注三末句「实施轮只剩 PROVIDER.md / CONTEXT-COMPACTION.md 两外档」已失效——两外档已随残留收正轮落笔（该节表内 #4/#5 行，`:224-225`）；本档内项（§14.5 第一组）随修正轮落笔 ⇒ 实施轮 DOC 面零项。
2. **同族失效句清点（同因同解）**：§2.1 AC-2 行（`:114`）「DOC 侧收正随码同落实施轮」· §2.3 表尾行（`:157`）「（实施轮随码同落，本轮不动）」· §2.1 尾注（`:122`）「动手时机归实施轮随码同落」· §2.6（`:178`）「DOC 收正归实施轮」——DOC 面实由设计者落笔（2026-09-25），均以本附注为准。
3. **残留收正轮「零代码改动」（`:217`）限域**：限该轮成立；实施轮 coder 已收 2 处注释面改动——`thincoder-vscode/src/specs.mjs:19-21` 注块（旧 `settings-state.js:48` 引证，末行改指 `:21`）· `thincoder-vscode/webview/model-picker.js:82-84`（旧兜底链引证同因收正）＝ 该轮「越界发现 ①②」已消除。
4. **设计档侧同源落点（收口前对齐轮）**：`MODEL-SPECS.md` `:1376`/`:1379`（§14.5 两处）· `:1463`（§14.9）· `:1407-1416`（§14.6「实施轮实际」注层）· `:1488-1489`（变更记录）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**对象**：MODEL-SPECS 清理批设计（批档 §2.1–§2.9 + 设计档 §14）· 待评审 → 评审轮 1
**计数**：🔴 1 · 🟡 4 · 🔵 4（共 9 条）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Feasibility | 🔴 | AC-3（#15）VSC 改面不全：设计只列 `settings-agent.js:50/:63` + 新 helper（批档 §2.3 / 设计档 §14.6），并声明 `settings-state.js:48` 兜底链零改（设计档 :1368）。但 effort 下拉在**换模型时**由共享构造器重建：`thincoder-vscode/webview/settings-widgets.js:44-53`（`:49 value = current \|\| defaultEffortFor(model)`；`:50 options = 枚举本身，无占位），调用点 = `settings-models.js:135-140`（`setRowModel`→`refreshRowEffort`）/ `:144-159`（`refreshAdvisorEffort`）/ `:94`（advisor 换模型）。⇒ 面板内换一次模型即回退到 `defaultEffortFor`→`levels[0]`（`settings-state.js:45-48`）= hy3/doubao 类模型的 `"none"`=off，正是 #15/D-d 判定的缺陷面；且 `settings-models.js:12-21`（`:18` 直读 `.consult-effort` value）会把「—」/「none」原样带进 consult payload。两文件均未入影响文件表 | 把 `thincoder-vscode/webview/settings-widgets.js`（共享构造器）与 `thincoder-vscode/webview/settings-models.js`（读取/回填链）补入 §14.2/§14.6 改面行；占位「—」规则落到共享构造器一层（初始渲染与换模型后渲染同式），payload 侧同时写明「—」/`none` 的归一/删键点；E-5 增一条「先渲染再换模型」路径用例 |
| 2 | Requirements / coverage | 🟡 | 端差默认档被泛前缀顺带登记：§14.2 #12 只加 `["k3-256k","high"]` 并断言「`kimi-for-coding` 已由 `["kimi","max"]` 覆盖同值 ⇒ 零加」，但同一条 `["kimi","max"]`（`thincoder-vscode/src/specs.mjs:27`）同时覆盖本批新名 `kimi-for-coding-highspeed`——该名活测为**无 effort 块**、行面「枚举/默认均不声明」（设计档 :1348）⇒ 端差表会给一个无枚举/无证据的模型登记默认档 `max` | 在设计档写明该名的默认档归属：接受继承（附取证）⇒ 记进 §14.3/AC-3 并说明与「无块」证据的关系；不接受 ⇒ 加「注册默认 ∈ 枚举」前置判定（或排除项），使 D-d「不得预选未注册默认」在两端同式成立 |
| 3 | Requirements / coverage | 🟡 | AC-8 级联不全 + 断言文字失实：§14.2 #1 只写「:67 行注改写」，§14.5 DOC 清单（设计档 :1372）未含本档自身两句——`:733`（「flash 的 128_000 是其自身口径——AC-3 钉既有族群零回归」）与 `:812`（「不动 `glm-5.3-flash` 行 128_000（残留上抛 = 批档 §2.6…）」）（批档 §2.3-AC-8 行点名，设计档未收）；改值后该两句与数据面直接矛盾。另 `thincoder-core/test/model-specs.test.mjs:426/:429` 的标题/消息「≠ flash 行 128_000」按「F-1 断言不动」保留，其声称的差异随改值消失 | 把 `:733`/`:812` 补入 §14.2/§14.5 的 DOC 清单并按「后续批已修正」改写；同时决定 F-1 标题/消息文字的去留（取值断言可留，声称差异的措辞需改） |
| 4 | Doc state / ownership | 🟡 | `cacheMode` 去留在**同一文档**内以两种互斥形态在场：§14.2 #11 / §14.1 D-a 判「字段整体删除」，而本档 §7 `:409`「**不删** cacheMode 字段…不入本批」+ §4 D-10 `:323` 仍为相反裁定，重写被排到实施轮（设计档 :1372/:1440）。读者今日无法判定哪句是活体口径。未按「机制级描述不一致 ⇒ 🔴」处理：重写路径已登记在本批实施面、矛盾窗口由本批闭合 | 把 §4 D-10 / §7 `:409` / `:152` / `:173` / `:323` 的改写随本设计轮落笔（取代它们的 §14 已在档），或在这些行就地标注「已被 §14 取代（实施轮改写）」以消除活体矛盾 |
| 5 | Clarity / dangling | 🟡 | 五名读数交付位悬空：设计档 §14.4 #1 引「批档 §1.7.1 取证族」，批档自身亦引「§1.7.1」（批档 :64），但批档只到 §1.8（:68-83），无 §1.7.1；实际登记的交付承诺 = §1.8 第 6 行（:81「实施派发前父侧交付」）⇒ AC-1 的收口路径不可解析 | 补 §1.7.1 小节，或把两处引用改指 §1.7 / §1.8-6 |
| 6 | Affected-file annotations | 🔵 | 抽查通过（口径与登记状态留下一处小缺）：现盘实测 `model-specs.mjs` = **66 行 / 携键 49 / 缺键 17**，「字段注 :20 + 49 行键 + DEFAULT_SPEC:215 + 注释提及 = **61 处字面**」逐项吻合；`:60`/`:59`/`:33`、`specs.mjs:22-41`（18 条）·`:27`、`cmd-config.mjs:180`/`:205`/`:232`、`cmd-advisor.mjs:116-117`、`settings-agent.js:50/:63`、`settings-state.js:48`、`cmd-think.mjs:86-88`（`!== null` 守卫在位）、`model-ref.test.mjs:85`、`image-downgrade.test.mjs:120` 均命中；全仓 `.json` 零 `cacheMode` ⇒ 零字面门在既有 `SCAN_EXT:224`/`SKIP_DIRS:225`（已排 `docs`/`.thincoder`）下可绿；`model-specs.mjs` 与 `test/model-specs.test.mjs` 已在 `SOFT_LINE_REGISTRY`（`core-hygiene.test.mjs:96-97`）且拆分计划在 §13.6 ⇒ 本批不拆合规。各档实测总行数一律比注解 +1（326→327 · 463→464 · 255→256 · 151→152 · 88→89 · 174→175 · 273→274 · 49→50 · 477→478）= 档内既有 split/`wc -l` 口径差（`core-hygiene.test.mjs:44`），非漂移 | 表内给 `cmd-config.mjs`（463→471，>300）补一行登记状态注（同 `model-specs.mjs` 的写法），并在表头点明行数口径（split vs `wc -l`），免得实施轮把 ±1 当漂移 |
| 7 | Clarity | 🔵 | 同一机制两处载体：AC-2 的零字面门既落 `model-specs.test.mjs:250-262`（T-13 就地改形）又落新建 `model-specs-cleanup.test.mjs`（C-5）；另 E-5（设置面板占位/落盘）落 `image-downgrade.test.mjs`（该档自述主题 = IMAGE-DOWNGRADE-VISION，:1-7），改后 ~289/300 | 指定唯一权威门（另一处退化为薄别名或删除），并确认 E-5 载体选择（或写明该档承接端差/面板面的既有约定与余量） |
| 8 | Feasibility | 🔵 | §14.4 #5 / §14.6 ②「advisor 菜单 levels 构造面是否同出双 none（未读）」可由现盘读数闭合：`thincoder-cli/src/tui/cmd-advisor.mjs:225-255` 的 `effortLevels = spec.reasoningEffortEnum ?? ["high","max"]`（`:235`）经 `:251` 原样展开，**未**前置 `"none"` ⇒ 无重双行，§14.4-5 的「同病 → 同式去重」分支 = 不适用，AC-6 的 ±8 行面成立 | 把该读数回填 §14.4-5 / §14.6（前置核对② 结项），实施轮不必重开 |
| 9 | Requirements | 🔵 | AC-1 五名读数尚未在设计档内（依赖父侧派发前交付，§14.4-1 / §1.8-6）；派发前若某名无读数或形态异常，§14.2「8 行新增」与 §14.6 的 +~10 需重推 | 读数交付时把值逐字回填 §14.3 并复核行数（含 grok 两分支，其 +2 行为条件行） |

**限制声明**：评审上下文未提供独立项目标准档与文档地图 ⇒ 方法学合规按 Project Guide（AGENTS.md 指向的 docs 版图）与本轮评审判据衡量；Document ownership 仅对本档与批档的配对关系判定。
**范围外注（无严重度）**：§1.8 的台账号（主库 #307/#310/#311/#312/#313/#314/#315/#317 · 跟进 #326）在本次评审的两份文档内不可核（台账面不在档），unverified。

VERDICT: changes-required

### 轮次 2（评审子代理）

**对象**：MODEL-SPECS 清理批设计 · 轮 2 复评（轮 1 findings #1/#2/#3/#4/#6/#7/#8 修正核验）· 待评审
**计数**：🔴 0 · 🟡 1 · 🔵 3（共 4 条）｜前轮 9 条：8 条 Fixed（逐条现盘核验）/ #9 已按交付前核验收口

**前轮逐条核验（现盘实读）**
- #1（🔴）**Fixed**：`MODEL-SPECS.md:1371`「…`settings-widgets.js:44-53`（`buildEffortSelect` 同源化 = **换模型重建径**）· `settings-models.js:26-30`（`collectConsultRows` 落盘归一 +import；`:18` 读取面保持原值）· `settings-agent.js:50/:63`（初渲染径）+ `:125`（payload 归一）」；`:1391-1394` 四行文件表（settings-agent 174→~176 · settings-widgets 109→~111 · settings-models 214→~218 · settings-state 53→~65）；`:1417` AC-3 两径 + `:1439` E-5 两径 + `:1456-1458` §14.10 两渲染径同源。码面复核：`settings-widgets.js:49` `const value = current || defaultEffortFor(model)`、`settings-models.js:26` `export function collectConsultRows() {`、`settings-agent.js:125` `effort: document.getElementById("adv-effort")?.value || null,`；grep `defaultEffortFor` 全仓 = 定义 + 三处调用面（settings-agent:7/:50/:63 · settings-widgets:7/:49）⇒「并入删除（零调用者）」成立。
- #2（🟡）**Fixed**：`:1339`「**继承披露（评审 #2）**…裁定**接受继承**…零下拉由 `effortSelectView` 空枚举 ⇒ null 承接 + 「注册默认 ∈ 枚举」前置兜底」+ `:1353` 端差继承注。
- #3（🟡）**Fixed**：`:732`「该行后随 §14 批按同源证据修至 131_072，§14.2 #1」· `:803`「flash 行值已随 §14 批同修 131_072（§14.2 #1）⇒ 差异判据收于排序面」· `:812`「已随 §14 批按同源证据收正为 **131_072**（§14.2 #1）」· `:1385`「**F-1:426/:429 去「≠128_000」差异表述**（取值断言与 `:431` `notEqual` 保留…）」。
- #4（🟡）**Fixed**：`:152`（去 `cacheMode`、坐标 `:215`）· `:173`「**字段本体随 §14 批整体删除**（§14.2 #11 · 61 处字面 → 0）——消费面零 ⇒ 删除零行为差；本条效力面收口于 §14」· `:323`「**结项（§14 批）**…本行转历史面」· `:403-408`「**去留已裁（§14.2 #11 · 台账 #14）**：字段整体删除…」· `:409` 兜底链条「**该兜底链本体已随 §14 批收正**」+ 七处旧引用逐处核（`:265`/`:268-269`/`:283`/`:318`/`:409`/`:887-888`/`:1322`）全带 §14 收正注。
- #5（🟡）**Fixed**：批档 `:68`「### 1.7.1 五名实测读数交付位（父侧 · 实施派发前填充）」已建 ⇒ 设计档 `:1359`「批档 §1.7.1 取证族；实施派发前交付；AC-1 = 行值与读数逐字段一致」可解析。
- #6（🔵）**Fixed**：`:1380`「**行数口径注**：本表读数 = `wc -l` 口径…read/编辑器行号面显示 = 该值 +1——评审轮抽查 9 档逐档 +1 全吻合、零漂移」· `:1395`「**>300 无登记机制在场**（`SOFT_LINE_REGISTRY` 扫描域 = `thincoder-core/`…）⇒ 核面 = 500 硬限，**余量 29 行**」。
- #7（🔵）**Fixed**：`:1441`「**零字面门注（AC-2）**：本表不另立用例——唯一权威 = `thincoder-core/test/model-specs.test.mjs:250-262`（T-13 就地改形为单门，±0 行；评审轮 #7）」+ `:1416`/`:1386` 同变。
- #8（🔵）**Fixed**：`:1363` §14.4-5「…无 `"none"` 前置 ⇒ **无双 none** ｜ **结项**（评审轮 #8 现盘读数…）」+ `:1407` 前置核对② 结项。
- #9（🔵）**收口**：`batch:85`「→ 实施派发前父侧交付（§1.7 承诺…）」/ 设计档 `:1359` 同指 ⇒ 交付前核验路径在档。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 4 | MODEL-SPECS.md | 🟡 | Fixed（余一处披露残留） | §9.12 项 7（`:688`「（`thincoder-vscode/src/specs.mjs:22-36`，13 条前缀）只覆盖 deepseek / kimi / glm / qwen 族，五新名全不命中 ⇒ 落兑底链」）仍引旧兑底链与 13 条前缀计数；作者已在修正轮观察项报父侧（批档 `:193`），处置待父侧裁（补 §14 指针注 or 结项）——`report-only`，不阻 pass |
| 2 | (new) | MODEL-SPECS.md | 🔵 | New | `:1386` cleanup 载体行列「AC-1/AC-8 锚承载（C-1..C-4 / C-6…）」，而 C-6 载体 = `model-specs.test.mjs` F-3（`:1385`「F-3:451 改值」· `:1422`「C-6：F-3:451 = 131_072…」· 批档 `:157`）⇒ 同一用例号两处载体，指名不唯一 |
| 3 | (new) | MODEL-SPECS.md | 🔵 | New | `:286` §3 仍自称「（读数…）⇒ 本表 = 档内**当前行数的权威面**」，与 §14.6 `:1378`「as-of 2026-09-25 设计轮/修正轮实测行数」并立且同文件读数已分叉（model-specs.mjs §3 记 253 / §14.6 记 326）⇒ 数字权威面双源（R7c 类型，report-only） |
| 4 | (new) | MODEL-SPECS.md | 🔵 | New（可行性确认） | E-5 径②（换模型重建）断言 DOM 面，档内未写 harness——现盘 `thincoder-vscode/test/helpers/webview-env.mjs:45`「document.body.innerHTML = …」在位 ⇒ 可实施；建议 §14.6 `image-downgrade.test.mjs` 行补 harness 指针（`:1390` 现仅记余量 5 行） |

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：✅ 设计批准（2026-09-25 06:56）。依据 = 用户 05:05「自动跑完吧」代授权（§1.6）+ 复评 VERDICT pass（§3 轮次 2：🔴 0 · 🟡 1 · 🔵 3）。父侧依授权代录本批准语。

**三条件核**：① 评审 pass（0🔴）✓——§3 轮次 2 逐字在档；② 修正轮七号（#1/#2/#3/#4/#6/#7/#8）逐条落地并父侧独立核验 ✓——grep 五组零命中 + §14.5/§14.6 实读 + 码面 `settings-widgets.js:44-53`/`settings-models.js:26-30`/`settings-agent.js:125` fresh read；③ token 已签发 ✓（值不落档——凭据纪律）。

**残留裁定（🟡1/🔵3）**：🟡1（§9.12 :688 旧兑底链/旧计数残留——作者已披露）→ 收口轮随 §6 处理；🔵2（C-6 载体指名唯一化）· 🔵3（§3「权威面」句限域）→ 实施轮 DOC 面一并收；🔵4（E-5 径② harness 指针 = `test/helpers/webview-env.mjs`）→ 写入实施任务书告知。

**边界重申**：§1.5「不转」· §1.1 实核 8/8 + #19 收窄 · D-a~D-h 定案不动 · 六家不扩（#326 跟进）· 实施派发前交付五名读数（§1.7/§1.7.1）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-09-25



### 5.1 交付摘要

**范围**：`MODEL-SPECS.md` §14（AC-1…AC-8）实施面全量落地——代码/测试面 **23 档**（19 改 + 4 新增测试档）。**DOC 面本人零改**：设计档 §14.6 尾行「实施轮随码同落」所指 4 处（`PROVIDER.md` §6.9 字段清单 · `CONTEXT-COMPACTION.md` 三处）已由 eng-designer 的「DOC 面残留收正轮」落笔（两档 2026-09-25 变更记录行自述作者 = eng-designer），见 5.6-⑥。

**三端终跑（本会话实跑 · 全绿 · 汇总行原样读数）**：

| 端 | 命令（cwd = `d:\teamcode`） | 读数 |
|---|---|---|
| core | `cd thincoder\thincoder-core && npm test` | `tests 631 · suites 0 · pass 631 · fail 0 · skipped 0` |
| CLI | `cd thincoder\thincoder-cli && npm test` | `tests 839 · suites 14 · pass 839 · fail 0 · skipped 0` |
| VSC | `cd thincoder\thincoder-vscode && npm test` | `tests 964 · suites 0 · pass 964 · fail 0 · skipped 0` |

**AC 面落点（报告时复读 file:line 为准）**：

| AC | 落点（实测锚） | 判据载体 |
|---|---|---|
| AC-1 | 五名专行 `thincoder-core/model-specs.mjs`：`qwen-flash:91` · `qwen-vl-max:92` · `claude-fable-5.1:194` · `gemini-3.1-pro:201` · `step-3.7-flash:235`（逐行带级注）；kimi 三行 `:53-55`；grok 记证零改 | `model-specs-cleanup.test.mjs` C-1…C-4（含防空扫正控） |
| AC-2 | `cacheMode` 字段整体删除（行注 / 表键 / `DEFAULT_SPEC` / 注释提及）；该字面在 `model-specs.mjs` = 0 | `model-specs.test.mjs:250-262`（T-13 就地改形 = 唯一权威门；码+测双面零 + 控制针） |
| AC-3 | `effortSelectView` = `webview/settings-state.js:49` · `effortPayloadValue` = `:58`；两渲染径同源 = `webview/settings-widgets.js:46`（`buildEffortSelect`，换模型重建径）+ `webview/settings-agent.js:63`（初渲染径）；载荷归一两点 = `webview/settings-models.js:28`（`collectConsultRows`）+ `webview/settings-agent.js:126`（advisor payload） | `test/effort-select-views.test.mjs`（新档 · E-5 两径 + 载荷归一）+ `test/image-downgrade.test.mjs` 端差面 |
| AC-4 | `export function effortMenuLevels(enumList)` = `cmd-config.mjs:27`（唯一枚举源）；消费点 `:188` 改走该导出 | `cmd-config-effort.test.mjs`（E-1/E-2） |
| AC-5 | E-4 注入驱动落测试面；`cmd-think.mjs` 码面 ±0 | `cmd-think.test.mjs`（+22 行） |
| AC-6 | `effort_none` → off 形（`cmd-advisor.mjs:122-130`，归一至 `think_off` 同式）；VSC 两 select 经 `effortSelectView` / `effortPayloadValue` | `cmd-advisor.test.mjs`（E-3 四例含边界）+ `test/effort-select-views.test.mjs` |
| AC-7 | `deepseek` 预置 `maxTokens = 384_000`（`config-presets.mjs:17`） | `config-presets.test.mjs` C-7/C-8（预置 ≤ 规格行 + 六家白名单双向）+ `config-merge.test.mjs` 同步 |
| AC-8 | `glm-5.3-flash:67` → 131_072 · `glm-5.3:66` → 128_000 冻结 | `model-specs.test.mjs` F-3（`:451` 改值） |

### 5.2 行数读数（实施轮实测 · `wc -l` 口径 · 2026-09-25）

口径注：读数 = 换行符计数（`wc -l`），与 §14.6 表头口径同源；read / 编辑器行号面 = 该值 +1。23 档全数**行尾带换行**（无 no-trailing-newline 档）⇒ +1 关系逐档成立。

| 档 | §14.6 现状 / 预估 | 实测 | 差 |
|---|---|---|---|
| `thincoder-core/model-specs.mjs` | 326 / ~335 | **348** | +13（超预估——八行级注所致） |
| `thincoder-core/config-presets.mjs` | 49 / ±0 | 49 | 0 |
| `thincoder-core/test/model-specs.test.mjs` | 477 / ±0 | 477 | 0 |
| `thincoder-core/test/model-specs-cleanup.test.mjs`（新） | 0 / ~80–120 | 112 | 区间内 |
| `thincoder-core/test/model-specs-bench.test.mjs` | 未列（表外带改） | 165 | — |
| `thincoder-core/test/model-specs-mimo.test.mjs` | 未列（表外带改） | 147 | — |
| `thincoder-core/test/config-presets.test.mjs` | 51 / +~25 | 77 | 0（预估 76） |
| `thincoder-cli/src/tui/cmd-config.mjs` | 463 / ~471 | 471 | 0 |
| `thincoder-cli/src/tui/cmd-advisor.mjs` | 255 / ~263 | 270 | +7 |
| `thincoder-cli/test/cmd-think.test.mjs` | 153 / ~178 | 200 | +22 |
| `thincoder-cli/test/cmd-config-effort.test.mjs`（新） | 0 / ~50 | 49 | 0 |
| `thincoder-cli/test/cmd-advisor.test.mjs`（新） | 0 / ~65 | 81 | +16 |
| `thincoder-cli/test/model-ref.test.mjs` | 432 / ±0 | 432 | 0 |
| `thincoder-cli/test/config-merge.test.mjs` | 未列（表外带改） | 216 | — |
| `thincoder-vscode/src/specs.mjs` | 88 / +1 ⇒ 89 | 89 | 0 |
| `thincoder-vscode/webview/settings-state.js` | 53 / ~65 | 65 | 0 |
| `thincoder-vscode/webview/settings-widgets.js` | 109 / ~111 | 110 | −1 |
| `thincoder-vscode/webview/settings-agent.js` | 174 / ~176 | 175 | −1 |
| `thincoder-vscode/webview/settings-models.js` | 214 / ~218 | 217 | −1 |
| `thincoder-vscode/webview/model-picker.js` | 未列（注释面收正） | 148 | — |
| `thincoder-vscode/test/image-downgrade.test.mjs` | 273 / ~295 | 291 | −4（E-5 拆出） |
| `thincoder-vscode/test/effort-select-views.test.mjs`（新） | 未列（表外带改） | 106 | — |
| `thincoder-vscode/test/files.mjs` | 未列（入册面） | 138 | — |

**软/硬线核**：本批**越线新增 = 0**——`model-specs.mjs` 348 · `model-specs.test.mjs` 477 · `cmd-config.mjs` 471 · `model-ref.test.mjs` 432 四档在本批前即越 300（advisory），本批不拆 = §14.9 已裁；core 两档在 `SOFT_LINE_REGISTRY`（presence 式，行数涨落零改登记），四档均未越 **500 硬限**。四支新增档（112 / 106 / 81 / 49）全在 300 内。

### 5.3 决策透明表

| # | 决策点 | 选择 | 依据 / 代价 |
|---|---|---|---|
| D1 | E-5 载体档位（余量将尽） | 拆新档 `test/effort-select-views.test.mjs`（106 行）；原载 `image-downgrade.test.mjs` 只收 C-2 端差面（291 行） | §14.6 :1393 行注「余量 5 行——超即拆新档，勿挤写」；实收 C-2+E-5 会得 ≈ 313 > 300。代价 = 设计档表内未追记该新档（→5.6-②） |
| D2 | `"none"` / `"—"` / 空 的三处分归一位置 | 只在**载荷落盘两点**归一（`effortPayloadValue`）；DOM 面「—」保留为占位选项原样 | §14.5「只归值、不动键名」（键名 `consult-effort` / `adv-effort` 零改）；视图面保留「—」以承 §14.4-3 占位语义 |
| D3 | advisor off 形复用度 | `effort_none` 复用 `applyThinkOff`（`think_off` 同式），不另造 off 载荷 | 设计钉「off 形（think_off 同式）」。代价 = 载荷层不认该形为 off（→5.7-1，pre-existing） |
| D4 | 端差表是否新增 `kimi-for-coding` 条 | 只加 `["k3-256k", "high"]` 一条（18 → 19）；`kimi-for-coding` 由既有 `["kimi", …]` 前缀覆盖 | `src/specs.mjs` 前缀匹配语义；AC-1 声称「端差表新增」的落地以 k3-256k 落地为准 |
| D5 | 五名未取字段（context / maxOutput） | 取兜底值 + 行注标级「兜底」；不加新字段形态 | §1.7.1 交付口径（零口径字段走兜底）；代价 = 级注八行、行数 +13 超预估 |
| D6 | 新行级注密度 | 8 行全部带级注（实测 / 继承 / 兜底 / 记证） | 本批既有约定；判据 = C-1…C-4 逐行断言 + 防空扫正控 |
| D7 | 四档越 300 软线的拆分 | 不拆 | §14.9 已裁；core 两档登记在场，CLI 两档登记机制缺位（§14.6 同注） |
| D8 | 表外带改 4 档 | 全数做最小同步并逐条上报（bench / mimo = AC-2 字段删除的必然波及；`config-merge.test.mjs` = AC-7 值同步；`files.mjs` = 新档入册 fail-closed） | 见 5.6-③/④/⑤ 与 5.2；无一处「顺手改」 |

### 5.4 前置核对 4 条（回填 · 批档 §2.8 尾注 / 设计档尾注）

| # | 核对项 | 结论（本次复核） |
|---|---|---|
| ① | VSC `adv.effort` → 核 `reasoningEffort` 消费链 | **断裂（pre-existing，非本批引入）**——VSC 写 `agent.advisor.effort`（`settings-panel-write.mjs:133-135/:144`），核侧只读 `advisor.reasoningEffort`（`advisor/run.mjs:41/:54`）；全仓 `advisor.effort` 读者 = 0 ⇒ 该键零消费。只报不改（→5.7-3） |
| ② | advisor 菜单 levels 是否同出双 `none` | **无重双行**——`cmd-advisor.mjs` levels = `spec.reasoningEffortEnum ?? ["high","max"]` 原样展开、未前置 `"none"` ⇒ §14.4-5「同病同式」分支不适用，AC-6 行面成立（与 §3 现盘读数一致） |
| ③ | `specs.mjs` 的 `reasoningEffortDefault` 实际消费方 | **在产 = `provider-probe-window.mjs:67`**（`effortDefault` 入模型列表载荷）⇒ webview 消费面 = `settings-state.js:49`（经 model 条目）+ `model-picker.js:82`（归一优先端侧默认档）；旧 `defaultEffortFor` 已并入删除、全仓零调用者（零字面扫描面亦零） |
| ④ | `image-downgrade.test.mjs` 结构断言 vs 现表键嵌套 | **原断言与现表事实不符**——「任一键均无同为键前缀的兄弟」在表内不成立（`deepseek-v4-flash` ⊂ `deepseek-v4-flash-vision-exp`；本批 +1 条 `k3-256k` ⊂ `k3` 又添一例）⇒ 该用例按 qwen 域负探针实施，口径漂移由档内自记。只报不改（→5.6-①） |

### 5.5 审计与代码评审轮次 · 终态

| 面 | 轮次 | 结果 |
|---|---|---|
| 交付前歧义审计（explore 子代理 · 只读 · 阻塞式） | **1 轮** | 全部发现 = 🔵（歧义 / 口径面），逐条已在交付报告披露；无 🔴 |
| advisor `type=code` 代码评审（子代理内同步评审） | **1 轮**（= 全量评审，无后续验证轮） | `VERDICT: pass`——0 🔴 · 0 必修 🟡；**report-only 8 条 = 🟡3 + 🔵5**（逐条去向 → 5.6 / 5.7） |
| fix round | **0** | 无必修项 ⇒ 未触发修正轮；评审后动作 = 复跑三端 + §5 落档 + verify |
| 终态 | **clean（收敛）** | 三端全绿 ∧ 评审 pass ∧ 审计全 🔵 已披露 ∧ 无遗留必修面 ⇒ 按协议收敛交付，不进入第二轮评审 |

**fix round 明细**：0 轮。评审的 3 条 🟡 全为 report-only（面 = 批外回归笔 / 设计档范围声明），与 §14 的字样判据无涉 ⇒ 不构成修正触发条件；本人未对其动码（改动会越出 §14 判据面，属父侧决策）。

### 5.6 设计档漂移（report-only · 设计档 = eng-designer 笔，本人零改，逐条交父侧裁定）

| # | 漂移面 | 事实 | 处置 |
|---|---|---|---|
| ① | `image-downgrade.test.mjs` 结构断言口径 | 断言原文（无前缀兄弟）与现表不符；本批 +1 条又添一例（`k3-256k` ⊂ `k3`） | 用例已按 qwen 域负探针实施（`:244-252`）+ 档内自记（`:246-248`）；设计档待收口轮定夺 |
| ② | 新档 `test/effort-select-views.test.mjs` 未入 §14.6 表 | 该档系 §14.6「超即拆新档」授权的产物，表内无对应行（`test/files.mjs` 同） | 只报；建议收口轮补登记行（含入册面） |
| ③ | 表外带改 2 档（core 测试面） | `model-specs-bench.test.mjs`（165）· `model-specs-mimo.test.mjs`（147）携 `cacheMode` 字面/键 ⇒ 随 AC-2 字段删除同步（去键 + 断言撤出，无新增语义） | 只报（同步为必然连锁，不修则 core 测试红） |
| ④ | 表外带改 1 档（CLI 测试面） | `config-merge.test.mjs:37` `deepseek.maxTokens` 断言 `393216 → 384_000`（AC-7 值同步） | 只报（同上） |
| ⑤ | `model-specs.test.mjs:152` 未入 §14.6 改动面 | `[qwen] T-3/A-9` 托底样本改指（qwen-flash 建专行后不再是托底样本 ⇒ 样本换 `qwen` + 标题改写）；§14.6 只记 T-13:250-262 与 F-3:451 两处 | 只报 |
| ⑥ | DOC 面归属句失同步 | §14.6 尾行与同节前文仍写「DOC 收正 = 实施轮随码同落」，而 4 处已由 eng-designer 残留收正轮落笔（2026-09-25 变更记录行自述） | 只报；本人 DOC 面零改 = 避免双笔（见 5.1 首段） |

### 5.7 上抛与批外发现（report-only · 只报不改 · 逐条去向）

1. **advisor off 形与核载荷层不一致**（评审 🟡#1）：`effort_none` 落 `applyThinkOff` 形（`cmd-advisor.mjs:122-130`），而核载荷层 off 门判 `thinking === null`（`provider/core.mjs:213`）；`advisor/run.mjs:39` 把 `null` 归一为 `undefined` ⇒ 该门对 advisor 径永不开。另 `:48-54` 展开克隆继承渠道级 `reasoningEffort`，回执 OFF 与实发是否一致需语义确认。**归父侧**（AC-6 的字样判据已满足；跨面语义 = 批外）。
2. **聊天面板仍 `effortDefault \|\| levels[0]`**（评审 🟡#2）：`model-picker.js:85` / `:123`（hy3 / doubao 类 ⇒ 静默 none）——与 §14.4-3「误标面已消解」的范围声明不符；该档面属 §2.8-3 回归修复笔、非 §14 改面。**归父侧**。
3. **VSC `agent.advisor.effort` 键零消费**（评审 🟡#3 = 前置核对①）：写出点 `settings-panel-write.mjs:133-135/:144`，核内读者 0。**归父侧**。
4. **E-5 径② 覆盖面**（🔵）：新档驱动 `buildEffortSelect` helper 本体，未走 `settings-models.js` 的 refresh 链（`setRowModel` / `refreshAdvisorEffort`）——「两渲染径同源」由 helper 同源保证，端到端同源未直接断言。**归父侧**。
5. **「已存值 ∉ 枚举」无定义**（🔵）：`effortSelectView` 的 selected 规则 = 已存值 > 注册默认 ∈ 枚举 > 「—」；已存值不在枚举时无显式分支（落 selected 值不在 options，由浏览器回落首项）。设计档未定义该边界。**归父侧**。
6. **effort 型无 `none` 族的 advisor off 入口**（🔵）：kimi 系等档枚举无 `"none"` ⇒ `cmd-advisor` 不显示 off 项，用户无显式关思考入口。**归父侧**。
7. **用例号跨档复用**（🔵）：C-2 号在 `model-specs-cleanup.test.mjs` 与 `image-downgrade.test.mjs`（端差面）各用一次；E-3 号同理（CLI 档 + 新 VSC 档）。跨档不撞名，仅编号面可读性。**归父侧**。
8. **E-3 边界用例驱动不可达动作**（🔵）：该例构造的动作在现盘门禁下不可达（= 形式边界用例）。**归父侧**。
9. **四档 >300 advisory**：见 5.2 末注（本批越线新增 = 0）。**归父侧**。
10. **批档 §2 内两处记载互斥 + 一处自述与盘面不符**：§2:213 与 §2:224-226 对同一 VSC 改面的记载互相矛盾（本人**不改批档**）；另 §2 同段记某轮「零代码改动」，而 `vscode/src/specs.mjs:19-21` 与 `webview/model-picker.js:82` 两处注释面已随本批收正 ⇒ 请父侧裁定权威面。**归父侧（§6 收口时定夺）**。

### 5.8 D6 读回与边界声明

- **§5 读回**：本段三次 append 逐次回执成功（4372 / 2738 / 本段）；状态行 = `实施完成`（`batch status §5`）。要素齐备性 = 交付摘要 + 行数表 + 决策透明表 + 前置核对 + 审计/评审判定 + 漂移表 + 上抛表 + 读回（八段）。
- **码面复核**：23 档行数报告时实测（见 5.2）；关键锚点 6 处报告时复读（`cmd-config.mjs:27/:188` · `settings-state.js:49/:58` · `settings-widgets.js:46` · `settings-agent.js:63/:126` · `model-specs.mjs` 八行 · `config-presets.mjs:17`）；23 档 `console.log` / `debugger` / `FIXME` / `XXX` 残留扫描 = **0 命中**。三端 `npm test` 全绿 = 行为面证据。
- **边界声明**：改动面 = §14 判据 + 上列 4 档表外带改（逐条已披露）；**DOC 面（含批档 §1…§4）本人零改**；设计漂移与批外发现**只报不改**（设计档 / 批档 = eng-designer / 父代理笔）；`batch/results/…-roster-29-v6-rejudged.pdf` 为父侧产物、非本批改动面。

## §6 验证与收口（父代理）

**验证（父侧独立复跑 · 2026-09-25 08:3x-08:5x）**：

- 三端全量 zero-red：core **631/631** · cli **839/839** · vsc **964/964**（各包 `npm test` · 0 fail / 0 skipped）——与实施轮自报吻合。
- 落点抽查（父侧实跑 `specForModel` + 源码实读）：五名行值 = §1.7.1 读数（`qwen-flash` / `qwen-vl-max` max **32_768**（实测值）· `claude-fable-5.1` 1_000_000 / 128_000 · `gemini-3.1-pro` 1_048_576 / 65_536 · `step-3.7-flash` 262_144 + maxOutput 零口径（兜底 32_000））· kimi 三行 1_048_576 / 262_144 / 262_144 · `glm-5.3-flash` **131_072** ∧ 本体 128_000 冻结 ✓ · `cacheMode` 字面（`model-specs.mjs`）= **0** ✓ · 预置 deepseek `maxTokens` = **384_000** ✓ · grok 泛前缀记证零改（500_000 / 64_000 维持）✓。
- 工作树核对：本批面 = 23 改 + 4 新 + 批档；平行实例面（`bench/` 等）零触碰 ✓。

**AC 结算**：AC-1..AC-8 全 Done（§5.1 表 + 上列复验）；实施代理内审 clean（顾问代码评审 1 轮 pass · fix 轮 0）；设计评审两轮（轮 1 changes-required → 轮 2 pass）。

**提交**：

- **A = `789dc7cf`**（27 档：19 改 + 4 新（代码/测试）+ 4 设计/需求档；+839 / −156）——path-limited，不含 `bench/` 并行面。
- **B = 本批档单提**（§6 落笔 + close 冻结后）。

**残留登记（不阻收口）**：

1. **KD-36 决策记录面**（`MODEL-BENCH.md:964` 被否① 枚举含 `cacheMode`）= 历史决策记录面，**不追改**留档（如需注记另轮）。
2. **三条 🟡 已入册**：台账 **#329**（advisor off 门不一致）/ **#330**（model-picker 归一链残留）/ **#331**（`agent.advisor.effort` 死键）；🔵 五条在 §5.7（record-only）。
3. **批档 §2 既存 >300 行 5 处**（`:187`/`:199`/`:213`/`:223`/`:238`）= 记录面形态，另轮清理候选。
4. **§5.7-10 记载互斥** = 附注六已收（`:244` `:213` 同步 · `:246` `:217` 澄清）——权威面 = 附注六。
5. **R21 需求行 cacheMode 字面收正**（父侧直笔 · 2026-09-25 · `requirements/PROVIDER.md:107`）= #14 删除决策连带收口。

**台账核销**：主库 `#307 / #310 / #311 / #312 / #313 / #314 / #315 / #317` —— 在途 → 待核销 → 已核销（evidence = 本节 + 提交 A/B）。

**链终结**：designToken consume（同 designId 再 spawn 机械拒绝）。

**状态行**：已收口 2026-09-25（本节落笔后由 close 冻结全档；本档此后零后写）。
