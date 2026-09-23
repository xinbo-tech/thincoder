# 2026-09-23 · 模型基准测试套件 bench/（统一题集 · 判分 · 速度/成本报告）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-23 · 来源 = 用户 2026-09-23 22:28「应该定义一个基准测试目录，以后做模型性能测试时可以沿用统一标准」+ 22:29 调研委派 + 22:31「可以，开批吧，把价格因素也考虑进去」。
> 台账 = #240（MODEL-BENCH · 归批）。前情 = 无（独立批——素材承当日四轮临时探针实测，未立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-23 立项：22:28「应该定义一个基准测试目录，以后做模型性能测试时可以沿用统一标准」+ 22:31「可以，开批吧，把价格因素也考虑进去」）**

### 1.1 目标与理由

**问题**：模型选型/性能判断目前靠一次性临时探针（当日已跑四轮：mimo 能力 / mimo 速度 / 四家 flash 横向 / 生成速度）——判分器、题面、计时口径、报告格式每次重造；结果不可跨时点比较，无留档。
**目标**：仓级**模型基准测试套件** `bench/`——统一题集 + 判分器 + 速度/成本报告；一次建设、长期沿用，此后一切模型性能测试走同一标准。
**价值定位（当日实测驱动）**：模型对比的完整决策面 = **能力 × 速度 × token 消耗 × 价格**——当日"mimo 是否算差"的讨论证明单看速度会误判（mimo-flash 每任务成本比 deepseek-flash 低一个数量级；deepseek 快但吃 5× token）。

### 1.2 需求要点（V1 范围）

**结构（提案，设计轮定稿）**：`bench/README.md`（用法 + 口径 + 结果解读）· `bench/run.mjs`（入口 `node bench/run.mjs [--models …] [--dims …] [--n N]`）· `bench/cases/`（题集：固定题面 + 判分器，一维度一档）· `bench/lib/`（client / metrics / report）· `bench/prices.json`（价格表：as-of + 出处 + 手动维护）· `bench/results/`（留档 `<date>-<label>.json`）。

**测试维度（当日探针 + 业界调研合并）**：

| 类 | 维度 | 判分 |
|---|---|---|
| 能力 | 推理（算术 / 模幂） | 数字比对 |
| | 代码（写函数 / 修边界 bug） | vm 实跑 + **隐藏用例**（题面只给公开用例） |
| | 严格 JSON | 解析 + 字段断言 |
| | 工具调用（单 / 多步 / **不该调用的场景** / 并行双工具） | 结构断言 |
| | **指令遵循（IFEval 式可验证指令 4–6 条）** | 机器可验证（字数 / 次数 / 格式） |
| | **多轮澄清（τ-bench 简化：信息不全先问）** | 结构化对话断言 |
| | **长上下文（大海捞针 8K–32K）** | 事实命中 |
| | 视觉（象限色块） | 答案比对 |
| | 中文歧义 | 人工判读（不计分，独立 lane） |
| 速度 | TTFT / tok/s / 总耗时 | 冻结口径（见下） |
| 成本 | token 消耗 × `prices.json` | 每任务成本 |

**冻结口径（统一标准的核心）**：
1. 题集冻结——改题 = 版本化（结果 JSON 记 `suiteVersion`）
2. 判分冻结——机器判分为主；人工项只记录不判分（独立 lane，可执行子集先绿——参考 openclaw qa 做法）
3. 计时冻结——TTFT = 首字节；tok/s = `completion_tokens ÷ (total − ttft)`（usage 精确值；**delta 近似禁用**——当日已证失真）
4. 报告冻结——能力矩阵 + 速度表 + 成本表，同一格式跨模型/跨时点可比
5. 价格冻结——`prices.json` 手动维护（as-of + 出处）；成本 = f(token 消耗, 逐档单价)

**成本核算口径（用户点名）**：每任务成本 = `(prompt_tokens − cached) × 输入价 + cached × 缓存价 + completion_tokens × 输出价`；报告含「同任务成本对比」与「成本归一化性能」。

### 1.3 调研结论（2026-09-23 · 两条线）

**业界方法论（按价值排序）**：① harness 行为评测（参考项目 openclaw qa 设施：tool commitment / empty-promise 率 / scope drift / 人工 lane 与可执行子集分离）② 可验证指令遵循（IFEval：「至少 400 字」「关键词 ≥3 次」式机器可判约束）③ 动态交互 agent（τ-bench：LLM 模拟用户 + 数据库终态校验）④ 静态题库（MMLU / AIME / SWE-bench / Terminal-Bench——重且防污染难：SWE-bench 可被 conftest.py 劫持；V1 不整体引入）。
**明确取舍**：缓做 = τ-bench 完整版 / 多图复杂多模态 / 长上下文精细化；不做 = 广谱知识题 / 容器级任务 / LLM-as-judge 主观打分。

### 1.4 验收标准（需求层——设计轮细化到用例）

| # | 判据 |
|---|---|
| AC-1 | `node bench/run.mjs --models <a,b> --dims <capability,speed,cost>` 一条命令跑通 |
| AC-2 | 结果 JSON 落 `bench/results/`：含 suiteVersion / 模型 / 时点 / 每维判定 / token 消耗 / 成本 |
| AC-3 | 报告输出：能力矩阵 + 速度表（TTFT / tok/s / 总耗时）+ 成本表，同格式 |
| AC-4 | 价格走 `prices.json`（as-of + 出处字段齐）；成本 = 逐档单价 × token 消耗 |
| AC-5 | 隐藏用例判分（代码题公开 1 例 / 隐藏 3–5 例）防硬编码 |
| AC-6 | 可执行子集与人工 lane 分离（人工项不阻塞自动判分） |
| AC-7 | 零凭据入库（key 走用户 config）；结果 JSON 不含 apiKey / token |
| AC-8 | 不进 CI / 不进发布门 / 不进三端产物（三端 `files` 白名单零改） |

### 1.5 边界（不做）

- 不做 LLM-as-judge 主观打分；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做 MMLU 类广谱知识题
- 不自动定时跑（手动触发）；不自动改 `prices.json`（价格手动维护）
- 不改三端产品码（本轮零三端改动）
- 不追求一次做全——V1 冻结后可加维度（版本化）

### 1.6 授权与流程

用户 22:31「可以，开批吧」= 立批放行（设计 → 评审 → 批准 → 实施常规全链）；「把价格因素也考虑进去」= 范围含成本核算。关键裁定点 / 异常上抛。

**流程注**：`bench/` 新目录（工程工具面但含判断语义——判分器；按"判断语义改动走设计"原则全链走）。设计档落点建议 = `docs/core/design/MODEL-BENCH.md`（新档；设计轮可提议调整）。

### 1.7 追加需求（用户 2026-09-23 22:32）

**原文**：「我希望测试完成以后形成一个**可以发布的完整的 md 格式的报告**。」

**含义（父侧解读）**：bench 跑完除控制台矩阵 + 结果 JSON 外，**产出完整的 Markdown 报告**，质量达到**可对外发布**——结构完整、自包含（不依赖控制台输出即可读懂）、无本地路径与凭据泄漏、含方法与局限声明。

**对设计的增量**：
1. **报告生成器面**：md 骨架 = 标题（测什么 · 何时）/ 概览（参测模型与配置）/ 方法（五口径冻结说明 + `suiteVersion`）/ 结果（能力矩阵 + 速度表 + 成本表 + 逐维明细）/ 关键发现（**数据性结论，非主观评分**）/ 局限声明 / 附录（复现命令 + 原始 JSON 指针）。
2. **脱敏要求**：本地绝对路径 / 用户名 / key / token 一律不出现在报告正文（路径以相对或占位符呈现）。
3. **留档形态**：报告与结果 JSON 同 basename 成对（`bench/results/<date>-<label>.md` + `.json`）。

**AC 追加**：
| # | 判据 |
|---|---|
| AC-9 | 跑完产出 md 报告（`bench/results/<date>-<label>.md`）：含方法 / 结果 / 局限三段；全文无本地绝对路径与凭据字面（自检断言或人工核） |

### 1.8 追加需求（用户 2026-09-23 22:33 追问「以后每次如何复跑？」）

**父侧解读 = 复跑工作流必须是一等公民**（用户关心"以后怎么用"——复跑体验即产品体验）。

**三种复跑场景（设计须覆盖）**：
1. **全量复跑**（模型对比）：`node bench/run.mjs --models <列表> --label <标签>` → 产出报告对（md + json）。
2. **子集复跑**（只关心部分维度）：`node bench/run.mjs --models <列表> --dims <维度列表>`。
3. **零 API 成本复跑**（价格更新 / 报告重排 / 成本口径修订）：**从已有结果 JSON 重出报告**（token 消耗已录，价格为新 `prices.json`；不重跑 API）——`--recompute --from <结果.json>` 形态。

**留档与对比**：`bench/results/<日期>-<标签>.{md,json}`；跨时点对比 = 两份 JSON/报告并列（`suiteVersion` 相同 = 严格可比；版本不同 = 注明口径变更）。**何时复跑**（README 固化）：新模型上架 / 模型换代 / 价格调整（→ 场景 3）/ 定期回归。

**AC 追加**：
| # | 判据 |
|---|---|
| AC-10 | 价格更新后支持**离线重算**（`--recompute --from <结果.json>`）：重出报告（成本列变化）且零 API 调用（可验：断网或计数为 0） |

### 1.9 追加需求（用户 2026-09-23 22:34「最好能有个测试的模型列表文件，以后可以添加删除」）

**含义**：参测模型清单 = **配置文件**（提案 `bench/models.json`）——增删模型 = 编辑文件，不改代码、不用长命令行。

**设计增量**：
1. **清单条目字段（提案）**：`label`（报告展示名）/ `provider`（对应 `~/.thincoder/config.json` 的 `providers[].name`）/ `model`（模型 ID）/ `dims?`（可选：该模型跳过/限定维度）/ `note?`（备注，如 unverified 标注）。
2. **CLI 缺省语义**：`--models` 缺省 = 清单全量；`--models a,b` = 清单内子集（未在册名字报错）。
3. **与 `prices.json` 键对齐**：同一模型标识在两档间一致（建议 `provider:model` 或 `label`——设计定键方案并写进 README）。
4. **初始清单建议**（设计参考）：mimo-v2.6-pro / mimo-v2.6-flash / mimo-v2.6-pro-ultraspeed / deepseek-flash / glm-5.3-flash / qwen3.8-flash（按需含 v2.5 对照档）。

### 1.10 父侧记录（2026-09-23 22:47 · 设计评审后）

**① 设计评审证据补录（处置评审发现 #3——「include_usage 探针读数」悬空）**：当日探针实测（`.thincoder/tmp/gen-speed-probe-20260923.json` · 四家流式带 `stream_options:{include_usage:true}` 全部正常返回 usage，completion_tokens 逐针实测：deepseek-flash 287/1567/2048 · glm-5.3-flash 291/797/1002 · qwen3.8-flash 278/542/1825 · mimo-v2.6-flash 250/317/327；另 `.thincoder/tmp/flash-arena-probe-20260923.json` 10 针同口径佐证）。⇒ 核 `noUsageStream` 族（glm/minimax/gemini 抑制 include_usage）与「直连实测全部支持」相抵属实（`thincoder-core/model-specs.mjs:52-64`；已登记台账 #241）。

**② 机械修正记录（父侧直接执行 · 可回退）**：
- §2.4 计数收正「新增 27 档」→「**28 档**」（枚举 1+1+2+10+10+4 = 28，与设计档 §3 表 28 行一致——处置评审发现 #4）。
- §2.4 行数预算「±4 行」→「**±3 行——已随批落地**」（与设计档 §3 一致 + 防重复应用——处置评审发现 #5）。

### 1.11 父侧记录（修正轮后 · 2026-09-23 22:53）

**机械修正记录（父侧直接执行 · 可回退）**：设计档 §2.2 字段纪律 2 的指针收正「§2.3-⑤」→「**§2.3-1~3**」（用例级聚合实住规则 1~3；⑤ = 关键发现生成规则——修正轮观察项，pointer form 机械修正）。

**修正轮核验结论（父侧逐号读回）**：8 号（#1/#2/#5/#6/#7/#8/#9/#10）全部落位 ✓——#1 契约三处补齐（`calls[].throttled` :117 · `manual[]` 五键 metrics :123-126 · 骨架「人工判读」节 :153 · 规则 4 收口 :169 · report.1 同步 :435）· #2 夹具内联冻结句 :321 + §5.10 逐条承载档列 :430-437 + AC-2 判定落点 :444 · #5 :286 已落地注记 · #6 :232/:239 字段统一 + 词表映射 · #7 :168 清理 · #8 :273-278 条目构造面 · #9 :165-167 四条 null 规则 · #10 :376/:395/:243 判据收正。两个派生小裁定（manual 未跑记「未运行」· 无成功 call 成本记 null）接受并已落档（:153 / :168）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（eng-designer · 2026-09-23 · 交付见 §2.1–§2.7（设计档 = docs/core/design/MODEL-BENCH.md））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>


### 2.1 本批条目（覆盖 · §1.1–§1.9 全量）

| 需求面 | 设计落点（`docs/core/design/MODEL-BENCH.md`） |
|---|---|
| §1.1 目标（统一题集 + 判分 + 速度/成本报告） | §1 目标与方案（模块结构与数据流） |
| §1.2 五口径冻结 + 成本核算口径 | §1.3（五口径条文表：冻结内容 / 实现落点 / 变更规则）· §2.5（成本计算式） |
| §1.2 测试维度（8 自动维 + 人工 lane） | §1.4 维度总表 · §5 逐例题面与判据（25 例 + 人工 3 条） |
| §1.4 AC-1..AC-8 | §6 回指表（逐条 → 设计落点 + 判定方式） |
| §1.7 可发布 md 报告 + 脱敏（AC-9） | §2.3（七段骨架 + 聚合规则）· §2.8（脱敏构造 + fail-closed 断言） |
| §1.8 复跑工作流三场景 + 离线重算（AC-10） | §2.7（三场景契约 + 零网络结构保证）· §5.10（复跑/报告面用例 6 条） |
| §1.9 参测模型清单配置文件 | §2.4（`models.json` schema + 对齐键 `provider:model`）· §9（初始条目提案） |

### 2.2 设计档落点

- 新档 `docs/core/design/MODEL-BENCH.md`（基准测试面；§1 目标方案 / §2 接口契约 / §3 文件清单 / §4 决策 / §5 用例表 / §6 AC 回指 / §7 边界 / §8 UI 交互）。
- **附带上报（同批一致面修正）**：`docs/README.md` §4 登记本档 + 计数收正（「其余」组 32 → 33；计数核对行 实档 **55** = 本图登记 **54** + 待补登 1）——新档入图属 D3 计数同改面，随批落地并报评审。

### 2.3 机制设计要点（摘要）

1. **实现落点 = 复用核 provider 路径**（KD-1）：`chat`（`thincoder-core/provider/index.mjs`）+ `loadConfig` / `parseModelRef` / `specForModel` / `assistantToolCallMessage`（`thincoder-core/config.mjs`）；请求构造保真（thinking/effort 映射即用户真实所见），usage 归一（含 cached）与 SSE 解析零重写。自写薄 client 与半复用方案被否（理由在 KD-1）。
2. **计时口径**：TTFT = 首个**非空** delta（content 或 reasoning 先到者）− 调用发起（依据 = `thincoder-core/provider/sse.mjs:142-149` 只在非空 delta 回调）；tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)；token 只认 usage，缺即 null（delta 近似禁用）。
3. **隐藏用例机制**（KD-3）：题面只给公开 1 例 + 规则；隐藏断言（3–5 条/题）住判分器（`vmRun` 实跑 + 追加断言脚本，4s 超时），题面零泄漏；改题 = `SUITE_VERSION + 1`。
4. **结果与报告**：JSON（原子账目：per-call tokens/成本）+ md 报告对（同 basename），md 全由 JSON 渲染 ⇒ 两档恒一致；报告七段骨架含方法/结果/局限；脱敏 = 白名单构造 + 写档前断言（绝对路径/凭据字面命中即拒写）。
5. **复跑**：全量 / 子集（`--dims` 统一词表：能力维度名 + `speed` / `cost` 轴）/ 零 API 重算（`--recompute --from`，分支不 import client + fetch 毒化用例为机检判据）。
6. **双数据档**：`models.json`（label/provider/model/dims/skipDims/note）+ `prices.json`（`provider:model` 对齐键 + 四档单价 + asOf/source；schema fail-closed；不估不换算）。

### 2.4 受影响文件与测试面

- **新增 28 档**（`bench/**`：README + run.mjs + 双数据档 + 10 题集档 + 10 lib 档 + 4 测试档）——逐档行数预算见设计档 §3；超 300 行的拆分触发条件已写死。
- 存量改动：`docs/README.md`（地图登记，±3 行——已随批落地）· 本批次档（§2）。
- **三端产品树零改动**（核 / CLI / VSC）；`bench/test/*.test.mjs` 手动跑（`node --test`），不进 CI / 发布门（AC-8）。
- 实施轮验证面 = `node --test bench/test/*.test.mjs` + 一次真实冒烟跑（1 模型 × 1 维）。

### 2.5 验收对照（AC → 判定）

| AC | 判定方式（落地后） |
|---|---|
| AC-1 | 真实冒烟跑 `--models <a,b> --dims capability,speed,cost` 跑通 |
| AC-2 | `--dry-run` 产物断言（JSON 字段齐：suiteVersion 等） |
| AC-3 | 渲染断言（三表 + 同格式）+ 冒烟产物目视 |
| AC-4 | 成本式单测（逐档单价 × tokens）+ 重算用例 |
| AC-5 | 判分器测试含「硬编码公开例」反例（隐藏用例生效） |
| AC-6 | 人工 lane 无判分函数 + 退出码规则 |
| AC-7 | 结果档无 apiKey/token（写档断言 + 测试） |
| AC-8 | 三端 package 定义与 `.github/workflows/test.yml` 零 diff |
| AC-9 | 报告骨架断言 + 脱敏断言（毒化夹具拒写） |
| AC-10 | `--recompute` 毒化 `globalThis.fetch` 后全流程成功 |

### 2.6 关键决策（11 条 · 含被否候选 · 详见设计档 §4）

KD-1 复用核 provider 路径（否：自写 client / 半复用）· KD-2 suiteVersion = 单源整数（否：日期式 / 内容哈希）· KD-3 隐藏用例住判分器（否：随机生成 / 外部档）· KD-4 `dims` + `skipDims` 双字段（否：单字段双语义）· KD-5 对齐键 `provider:model`（否：label / 纯 model）· KD-6 成本缺失记 null 不估算（否：delta/字符近似）· KD-7 TTFT = 首个非空 delta（否：自写取首字节 / 只计首 content token）· KD-8 留档 + 脱敏断言双保险（否：只靠构造 / 事后人工核）· KD-9 人工 lane 不判分不阻塞（否：LLM-as-judge）· KD-10 同名拒写（否：--force / 自动改名）· KD-11 bench/test 不进 CI（否：不测 / 进 CI）。

### 2.7 上抛项（只报不改）

1. **`noUsageStream` 与当日实测相抵**：`thincoder-core/model-specs.mjs:52-64` 把 glm 族（含 `glm-5.3-flash`）/ minimax / gemini 标 `noUsageStream: true` ⇒ 核不发 `stream_options.include_usage`，与 §1「当日四家实测 include_usage 全部支持」相抵 ⇒ 经核路径这些模型可能无 usage ⇒ 成本记 `null`（设计已如实覆盖：warning + 报告脚注）。**改核 = 越本批「零三端改动」边界**；是否另批复核该 spec 字段由主 agent 裁定。
2. **价格数据缺口**：`glm-5.3-flash` 只有相对口径（「约为 5.3 旗舰 1/10」，不得转写为数字）；`deepseek-flash` 只有输出价且为峰谷口径 ⇒ 实施轮须按官方定价页补全（`source` 必标；取峰值档须写 note）；核实不了则 entry 缺席（成本 null + 脚注）。**实施轮涉外网访问，请主 agent 确认授权口径**。
3. **初始清单现场对齐**：`models.json` 的 `provider` / `model` 值以用户 `~/.thincoder/config.json` 的 `providers[].name` 与模型 ID 为准（本档不预写猜测值；实施轮现场核对，只取名字面、不落密钥）。
4. **两处需求张力已按设计收敛（报评审复核）**：① `--dims` 双语义（AC-1 的 `capability,speed,cost` 轴选择 + §1.8 的维度名子集复跑）→ 统一词表（能力维度名管「跑什么」、`speed`/`cost` 管「出什么轴」）；② §1.9 的 `dims?`「跳过/限定」两义 → 拆 `dims`（白名单）+ `skipDims`（黑名单）两显式字段。

### 2.8 设计轮内自校（随 §5 定稿收正 · 计数与类覆盖）

- **用例总数 23 → 25**：新增 `multiturn.3`（边界——信息足够时代决不追问）与 `vision.3`（错误——图中无物件时的无中生有拒答）；`instructions.2` 类归 正常 → **边界**（紧约束窗口）。
- 收正后**八个自动维度的类覆盖齐**（正常 / 边界 / 错误各 ≥1）：§2.1 计数行的现值为「**25 例** + 人工 lane 3 条」（以本节为现值；设计档 §1.4 / §3 / §5 已同步）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · 本轮发现表（对象 = docs/core/design/MODEL-BENCH.md + 批次档 §1/§2；无代码变更，锚点按当前磁盘实测）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 契约一致性 | 🟡 | 三处承诺在冻结契约（§2.2 schema / §2.3 骨架）无落点，而 md 声明「完全由 JSON 渲染」⇒ 渲染不出来：① §2.3-④（MODEL-BENCH.md:161）「人工 lane 其调用成本单项列出」——但 `manual[]`（:122）无 tokens/成本字段；② §5.9（:406）「报告『人工判读』小节并列」——骨架（:140-153）无该节；③ §2.9-4（:266）「该 call 记 `throttled: true`」——`calls[]`（:114-116）无该字段 | 三选一收口：补 `manual[]` 的 tokens/成本字段 + 骨架补「人工判读」小节 + `calls[]` 补 `throttled`；或删去对应承诺句 |
| 2 | 清晰度 / 受影响文件 | 🟡 | 夹具与用例-测试档映射不闭合：`--dry-run` 的「夹具结果」（:79）与 §5.10 的 recompute/report 夹具（含「改价后的 prices.json」——:414-418）在 §3 文件表（:276-303，声明「全部为新增档」）无落点；§5.10 六条用例未逐条指派测试档；AC-2 判定指向 `bench/test/suite.test.mjs`（:426），而该档职责描述（:302）不含产物断言 | §3 补夹具档行（或写明夹具内联于哪个测试档）；§5.10 逐例指派测试档；AC-2 判定落点收正到实际承载档 |
| 3 | 需求/证据引用 | 🟡 | 证据悬空：MODEL-BENCH.md:267 与批次档:178 均以「当日四家探针『include_usage 全部支持』」为「相抵」依据，并称其出自 §1——但 §1 全文无 include_usage 读数（grep 实测：batch 仅 §2.7-1 一处出现该词；§1 只有「四轮临时探针」「四家 flash 横向」的题名） | 在批次档证据面补录该探针读数（或改注来源）；否则把「相抵」降为「与当日探针结论不一致（读数未入档）」。技术事实本身已核实：model-specs.mjs:52-64/115/136-137/154-156 带 `noUsageStream` |
| 4 | 文档计数 | 🔵 | 数字漂移：批次档 §2.4（:152）「新增 **27 档**」vs 同句枚举 1+1+2+10+10+4 = **28**，且设计 §3 表为 28 行 | 计数收正为 28（或改枚举口径） |
| 5 | 文档计数 / 状态 | 🔵 | `docs/README.md` 增量漂移：设计 §3:271「±3 行」vs 批次档 §2.4:153「±4 行」；且该登记已实际落地（README:71「其余 33 档」/ :76 登记行 / :77 计数核对 55=54+1 / :93 变更记录） | 统一行数预算并注明「已随批落地」——避免重复应用（其余组 33→34 双计） |
| 6 | 字段命名 | 🔵 | 用例对象字段 `cls`（:224）与结果 JSON 输出字段 `class`（:108）不同名 | 注明映射或统一命名 |
| 7 | 文档卫生 | 🔵 | §2.3-③（:160）冻结判定规则行内保留设问残留「（含失败/重试的实际调用？——只计成功返回的 call…）」——冻结面宜只留结论，防读者当未决项重开 | 删设问、仅留结论（过程归变更记录/批次档） |
| 8 | 清晰度 | 🔵 | provider 条目构造细节未明写：核从**provider 条目**读 `maxTokens`/`temperature`（core.mjs:184-192）、`body.model = provider.model`（:178），`chat` opts 无这两位（:117 解构）——「bench 覆写」（:263/:87）若不落在条目上会**静默失效**（仍按用户配置跑，破可比性面） | §2.9-1 写明「克隆用户条目 + 覆写 maxTokens/temperature/.model」的构造面 |
| 9 | 验收判据 | 🔵 | 聚合边界未冻结：§2.3-2（:159）「N 次取中位数」未定义 null/error 运行（`verdict:"error"`，:131）参与方式；ttft 缺失时 tok/s 分母（:159/:40）归属未定 | 冻结一条：「null 不参与中位 / 或整体记 null」，并写进 §2.3 |
| 10 | 验收判据 | 🔵 | 判据与题面对齐两例：`multiturn.2`（:379）判据不验题面核心要求「3 个候选」（给 1 个候选也 pass）；`tools.2`（:360）要求 body 含字面「22:00」——自然语言转述（「晚上十点」）会误判 FAIL | 补「候选数 = 3」断言；`tools.2` 放宽为时刻等价形态集合或明示接受集 |

**计数**：🔴 0 · 🟡 3 · 🔵 7（共 10 条）
**VERDICT: pass**

**核验锚（本轮实测，供复核）**：`thincoder-core/provider/sse.mjs:142-149`（仅非空 delta 回调）· `:13-22`（usage 缓存归一）✓；`thincoder-core/provider/core.mjs:185-192`（tempRange 裁剪）· `:178` · `:230`（`parallel_tool_calls` 仅在显式 true 时发）✓；`thincoder-core/model-specs.mjs:279-289`（assistantToolCallMessage）· `:52-64`/`:115`/`:136-137`/`:154-156`（noUsageStream 族）✓；§2.9 五导入（loadConfig / findProvider / parseModelRef / specForModel / assistantToolCallMessage）与 `provider/index.mjs:5` 的 `chat` 导出 ✓；`bench/` 目录不存在 ⇒ §3「现状 0」属实 ✓；`.github/workflows/test.yml` 无 bench 作业、`thincoder-core/package.json` files 白名单不含 bench ⇒ AC-8「零 diff」可成立 ✓；`docs/README.md:71/76/77/93` 与磁盘计数一致（core/design 实档 55）✓；设计档行宽全合规（>300 字符行均为表格行 ⇒ 机检豁免）✓；「（拟新增）」= doc-check §4.2.9 前向引用标记（列报不入闸）✓。
**评审面限制**：上下文未声明项目标准档与文档地图——本次以 `AGENTS.md` + `thincoder/docs/README.md`（实为文档地图，实测）为准。

## §4 用户批准（主 agent）

**2026-09-23 22:53 用户批准**（会话面原话：「批准」——承 22:52 父侧请求，非代签）。

**三条件核验**：① 设计评审 **pass**（轮 1 · 🔴 0 · 🟡 3 · 🔵 7——逐条裁定处置见 §1.10/§1.11 与 §3 发现表）；② **修正轮已落地并经父侧核验**（8 号逐号读回实证：锚点 file:line 全落实 · §1.11 记录在档）；③ **token 已签发**（运行态，不入档）。

**批准范围** = 本批全量：设计档 `docs/core/design/MODEL-BENCH.md`（500 行 · 评审修正后稿）+ 批次档 §2 实施任务书 + `bench/**` 28 档新增（夹具内联，不另立档）。

**实施前置（随批授权）**：`prices.json`/`models.json` 按现场 `~/.thincoder/config.json` 与官方定价页对齐补全（涉外网访问已授权；查不到即不录——与 KD-6 一致）；实施轮验证含一次真实冒烟跑（1 模型 × 1 维）。

## §5 实施记录（eng-coder）

### 实施记录（eng-coder · 2026-09-23）

**状态行**：实施完成（30 档（28 设计档 + 2 拆分档）· 4 测试档 42/42 · 真实冒烟 + 零调用重算实证 · 内部审计 1 轮 + 代码评审 2 轮（changes-required → pass））

#### 5.1 交付面（30 档 = 设计档 §3 的 28 档 + 2 档经其拆分触发条件拆出）

两处拆分均为**设计档 §3 原文授权**（`bench/run.mjs` 行「（超 300 ⇒ 拆 `lib/pipeline.mjs`）」；`bench/lib/report.mjs` 行「（超 300 ⇒ 拆 `lib/report-tables.mjs`）」），触发时实测：run.mjs 425 行 → run.mjs 187 + lib/pipeline.mjs 278；report.mjs 334 行 → lib/report.mjs 161 + lib/report-tables.mjs 212。

| 档 | 行数 | 要点 |
|---|---|---|
| `bench/README.md` | 121 | 快速开始 / 五口径 / 复跑三场景 + 何时复跑 + 跨时点须知 / 结果解读 / 双数据档维护 / 边界 |
| `bench/run.mjs` | 187 | CLI 解析（intArg/`--label` 校验/`--recompute` 与 `--from` 配对）· `--dims` 词表统一（能力项定跑什么 / 轴定出什么）· **dry-run 内联夹具表**（固定响应脚本，含工具环各轮）· 入口与退出码 |
| `bench/lib/pipeline.mjs` | 278 | 运行编排（模型面/进度/中断 130）· 重算编排（形状校验 + 同源命名）· `writePair` 唯一落盘面（写前脱敏断言 + 同名拒写）· 结果 JSON 白名单构造 |
| `bench/lib/client.mjs` | 164 | 核 `chat` 封装 + 工具环（`assistantToolCallMessage` + tool 结果回填）+ **per-call** TTFT/耗时采集 + `throttled`（仅真实等待相位）+ 夹具传输 |
| `bench/lib/grade.mjs` | 282 | 判分器族：`numEquals` / `vmRun`（vm + 4s 超时 + 隐藏断言） / `strictJson`+字段断言 / `toolShape` / `textRules`（含列举项计数） / `keywordSet` / `colorMatch` |
| `bench/lib/metrics.mjs` | 82 | 中位（剔 null）/ tok-s（§2.3-2 ③ 口径）/ run 级指标 / 用例判定（N 次全过） |
| `bench/lib/prices.mjs` | 141 | schema fail-closed 装载 · 精确+通配匹配 · 成本式 · `applyPricesToResult`（真实运行与重算**共用**） |
| `bench/lib/roster.mjs` | 65 | 清单 schema 校验 · label/复合键解析 · 有效维度面（∩dims − skipDims） |
| `bench/lib/report.mjs` | 161 | 骨架装配（概览/方法/结果/关键发现/局限/附录）· 轴选择受控出段 · `fileBase` 单一来源 |
| `bench/lib/report-tables.mjs` | 212 | 能力矩阵 / 速度表（含 null 脚注） / 成本表（含缺价脚注） / 逐维明细 / 人工判读 |
| `bench/lib/sanitize.mjs` | 67 | 泄漏谓词（盘符路径 / 用户目录 / apiKey / sk- / Bearer / 本机用户名）+ 写档断言（带行号命中） |
| `bench/lib/haystack.mjs` | 56 | 确定性长文（固定语料 + 定种子 LCG + 按字符偏移埋点） |
| `bench/lib/png.mjs` | 87 | 手写 PNG（zlib deflate + CRC32）+ data URL；四象限/纯色取色器 |
| `bench/lib/tools.mjs` | 88 | 4 个本地确定性桩（get_time / send_email / get_weather / read_file decoy）+ 工具 schema |
| `bench/cases/index.mjs` | 60 | `SUITE_VERSION = 1` 单源 + 8 自动维 + 人工 lane + 轴定义 + 类映射 |
| `bench/cases/{reasoning,code,json,tools,instructions,multiturn,longctx,vision,manual}.mjs` | 49/62/63/93/54/85/80/61/21 | §5 冻结正本逐字题面 + 判据；code 三例各 5 条隐藏断言住判分器（题面零泄漏，AC-5）；multiturn.1 脚本化第二轮 |
| `bench/models.json` / `bench/prices.json` | 53/62 | 6 条初始清单（provider 名与现场 config 对齐）· 6 条价格（四家官方定价页实读，条目级 asOf+source） |
| `bench/test/graders.test.mjs` | 145 | 判分器正常 + 反例（含「硬编码公开例必 FAIL」= AC-5 反例） |
| `bench/test/metrics.test.mjs` | 149 | 中位/null 口径 / cost 式（逐档单价 × token）/ 匹配 / schema fail-closed / 重算与告警 |
| `bench/test/suite.test.mjs` | 160 | 注册表自检（25 例 id 唯一 / 类覆盖 / 隐藏断言 3–5 / 题面抽检）+ 双数据档 schema + 夹具覆盖 |
| `bench/test/report-recompute.test.mjs` | 299 | §5.10 六条用例全承载 + dry-run 产物断言（AC-2）+ 骨架 + 脱敏 + 零网络重算 + 跨日重算/轴选择/skipped 口径回归 |
| `bench/results/2026-09-23-smoke-deepseek-reasoning.{md,json}` | 118/197 | 真实冒烟留档对（deepseek-flash × 推理，3/3 pass，¥0.003784） |

#### 5.2 验证读数（实跑）

- `node --test bench/test/*.test.mjs` → **42 tests / 42 pass / 0 fail**（4 档；不进 CI，AC-8）。
- `node bench/run.mjs --dry-run --label selfcheck`（真 results 目录）与 `--dims speed,cost` 轴-only 变体 → 全链路跑通（168 步 / 25 步）；自检固定含 1 例刻意 FAIL（longctx.2 夹具回干扰值，覆盖失败渲染路径，已在 README 注明）。
- 真实冒烟 `--models deepseek-flash --dims reasoning --label smoke-deepseek-reasoning` → 3/3 pass（ttft 416–598 ms，tok/s 216–255），报告对落 `bench/results/`；报告全文无本地路径/凭据（脱敏断言 + 独立 grep）。
- `--recompute --from <冒烟 JSON>` **毒化 `globalThis.fetch` 后**跑 → exit 0、fetch 调用 0 次、成本重算一致（AC-10 机检判据）；重算副本为验证用料，落档后已显式删除（归档面只留真实冒烟对，另有 dry-run 自检产物同删除）。
- 三端零 diff：`git status` 仅 `bench/**` 新增 + docs 面（设计档/批次档/README 地图）为本批既有差异；`thincoder-core` / `thincoder-cli` / `thincoder-vscode` / `.github/` 零改动（AC-8）。
- 全档 ≤300 行（最大 299）；零第三方依赖（import 全为 `node:` 或仓内相对）。

#### 5.3 决策透明表（实施轮偏离 / 设计外补充 / 裁定点）

| # | 决策 | 类型 | 依据与影响 |
|---|---|---|---|
| D-1 | 拆 `lib/pipeline.mjs` / `lib/report-tables.mjs`（30 档） | 设计已授权 | 设计档 §3 两条拆分触发条件原文；触发时行数超 300 属实 |
| D-2 | 新增测试缝 env `BENCH_RESULTS_DIR`（沙箱结果目录）/ `BENCH_PRICES`（改价重算夹具价表） | 设计外补充 | 设计 §3 要求「改价后的 prices.json」与 dry-run 产物断言住测试档 ⇒ 需可注入；默认路径与行为零变化，已注释说明；价格表读取改为**每次调用读 env** |
| D-3 | 结果 JSON 增列 `run.axes` · `models[].note` · `manual[].label` · `prices.unit` | 设计外补充 | §2.2 例为单模型样例；多模型人工 lane 需 `label` 归属、轴选择需机读载体（md 完全由 JSON 渲染）。均为白名单构造，无泄漏面 |
| D-4 | 用例「回合」语义 = 一次模型调用；`build()` 可返 `followUps` 承载 §5.6 脚本化第二轮 | 实现面细化 | 设计 §2.6 冻结字段表未定义多轮承载；判据（tools.* 回合 1/2、multiturn.1 回合 2）按 §5 逐字实现 |
| D-5 | 「轴-only 不跑人工 lane」（`runManual = 无 --dims ∨ 显式 manual`） | 验收项 §4-① 收敛（原上抛项 4-①） | 设计 §2.1-1「全量跑」与 §2.1-3「人工 lane 需显式点名或缺省全跑」张力 ⇒ 取两者相容读法；README 已写明 |
| D-6 | 重算产物**沿用原档运行日**命名（`<原运行日>-<原标签>-recalc`） | 首轮评审 must-fix 裁定 | 使「文件名 = 标题日期 = 附录指针」三同源；同日二次重算需显式 `--label`（KD-10 拒绝覆盖，行为已测） |
| D-7 | 盘符谓词前导排除**仅限字母数字**（修首轮 must-fix 的残留收窄面） | 二轮评审非阻塞项随手修 | 保持 URL 正控（`https://` / `file://` / `ftp://`）不误报，同时恢复「路径:C:\…」「/C:/…」命中 |
| D-8 | dry-run 夹具 longctx.2 刻意回干扰值（固定 1 例 FAIL） | 实现面选择 | 覆盖失败渲染路径；已在 run.mjs 注释与 README 注明，避免使用者误判套件异常 |
| D-9 | 进度分母按各条目**有效维度面**；报告成本脚注/数据告警均剔除 skipped run | 二轮评审修补 | skipped = 不在该模型面，不计入「数据缺失」（§2.1-2） |
| D-10 | `--timeout` 语义实现为**每次调用**独立预算（`AbortSignal.timeout` 逐 call 合成） | 二轮评审修补 | 对齐 §2.1「单次调用墙钟上限」；中断（SIGINT）仍走整体 controller，人工 lane 亦有 abort 检查（不落档、130） |

#### 5.4 审计与代码评审轮次 · 终态

- **内部 explore 审计（1 轮）**：对设计档逐条核差 → 6 项发现（roster 排除维矩阵显示 `0/0` · §3 夹具落点缺「改价」变体 · 判据闭集 4 处放宽 · tools 判据 2 处收紧 · `throttled` 过标 · 报告 2 处微差）→ **全部修复**（含 2 条新回归测试）。
- **advisor 代码评审轮 1**：`VERDICT: changes-required`（🔴 0 / 🟡 6（其中 2 条 must-fix）/ 🔵 5）。两条 must-fix：① 重算产物「文件名日期 vs 报告标题/结果指针」不同源（跨日重算指向不存在的档）；② 脱敏盘符谓词过宽（`https://` 被误判为 Windows 路径 ⇒ 整轮产物拒写）。
- **修复轮**：11 条发现逐条处置（must-fix ① → 命名三同源 + 跨日回归；must-fix ② → 谓词收紧 + URL 正控；另修 timeout per-call · 人工 lane abort 检查 · 人工 lane usage 告警 · 数据告警剔除 skipped · `--dims manual` 空矩阵注记 · 轴-only 不跑人工 lane · 段序对齐 + suiteVersion 入「方法」· 进度分母 · 夹具注释）。
- **advisor 代码评审轮 2**：`VERDICT: pass`（11 条声明逐条实读核验通过；0 新增 🔴；剩 5 条非阻塞 = 收窄残留 / 成本表脚注同类残留 / 退化分支标题日期 / 注释滞后 / F1·F4·F7·F10 无回归断言）。其中「收窄残留」「脚注同类残留」「退化分支」「注释滞后」4 条**已随手修**并补 2 条断言；第 5 条（F1/F4/F7/F10 无回归覆盖）保留为已知覆盖缺口（设计未强制）。
- **终态**：`clean`（审计与评审全部收敛；测试 42/42 绿；留档对与终版代码逐字一致——复渲染比对 identical）。

#### 5.5 残差与上抛项（只报不改）

1. **设计档 §3 的「（拟新增）」标记**：设计档行 287 载「实现完成后『拟新增』标记改实读形」，本批禁改 docs 面 ⇒ 该标记保持原样，待父侧/eng-designer 收口时一并更新（30 档实读本段 §5.1 已列行数）。
2. **无 usage 模型的成本 null 路径未实跑**：`noUsageStream` 族（zhipu-plan / minimax 等）经核路径可能不回 usage ⇒ 成本 null + 脚注；本批实跑只覆盖 deepseek（有 usage），该分支由单测覆盖（`metrics.test.mjs` applyPricesToResult 的 tokens:null 与缺价用例）。
3. **`prices.json` 六条价格**：四家官方定价页当日实读（MiMo 三档 / DeepSeek 峰谷取高峰档 / 智谱 GLM-5.3-Flash / 百炼 qwen3.8-flash）；价格随厂商调整，更新后走 `--recompute`（AC-10 已实证）。
4. **F1/F4/F7/F10 无回归断言**（评审轮 2 注记）：`--timeout` per-call、人工 lane abort、`--dims manual` 空矩阵注记、进度分母——代码级修复但无断言；如需覆盖需新增测试面（设计未强制）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-23 23:5x）**

**验证读数（父侧实跑复核，不采信自报）**：
- 测试：`node --test "bench/test/*.test.mjs"` → **42/42 pass · 0 fail**（422ms）。核验轮首次假红 = 父侧命令形态误用（`node --test <目录>` 被当模块入口）——已澄清，非产品缺陷；另日志：`.thincoder/tmp/mb-parenttest2.log`。
- dry-run 全链路 ✓（168 步 · 含刻意 FAIL 渲染；轴-only 变体 25 步）· **真实冒烟 ×2**：deepseek-flash × reasoning 3/3（¥0.0038）· glm-5.3-flash × reasoning 3/3（¥0.0022）——报告对 ×2 组入库 `bench/results/`。
- `--recompute` 零网络（毒化 fetch · exit 0 · 调用 0 次）✓ · 三端零 diff ✓ · 脱敏正反控 ✓ · 全档 ≤300 行（最大 299）✓。
- **意外收获**：glm 经核路径 usage 正常（tokens 31/0/92 等）⇒ `noUsageStream` 抑制**无实害**（网关不依赖该参数）——#241 证据升级（相抵 → 过度保守无实害）。

**收口机械修正（父侧直接执行 · 可回退）**：① 设计档 §3「（拟新增）」标记 60 处随实现完成收正为「（已实现）」+ 表前行注（实读行数以 §5.1 为准）+ 变更记录一条；② `bench/models.json` glm note 更正（「可能无 usage」→「usage 实测正常」——预判被实测证伪）+ 报告重生成（换用中性 label）；③ `PROJECT-MANIFEST.json` 修复——`docs/RELEASE.md` 补入 `docRoot.requirements`（评审面缺口；服务于 site-sync 批点火）。

**交付提交**：`213211dd`（feat: add model-bench suite with smoke reports and design doc · 37 档 · +4934/−3）· `45483f05`（fix: manifest docRoot）——**双远端已推核**（origin / github main 均 = `45483f05`）。

**上抛项处置（实施报告 5 条）**：① 设计档标记收正 → 已做（见上）；② noUsageStream 分支 → 已实测（有 usage · #241 升级）；③ 覆盖缺口 4 项（`--timeout` per-call / manual abort / `--dims manual` 空矩阵注记 / 进度分母——代码级修复无断言）→ 接受（评审轮 2 判非阻塞；后续按需补）；④ 价格时效 → README 维护说明在位；⑤ 验证用临时物（`.thincoder/tmp/recompute-smoke.mjs`）→ 已清理。

**台账**：#240 核销（两步迁移）· #241 更新（证据升级）· #243–#246 在册（归批 ×3 / 认账不排期 ×1）。
