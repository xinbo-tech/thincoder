# 2026-10-26 · 提示词效果夹具
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-26 · 来源 = 用户 2026-10-26 17:35「我需要一个用来测试工程模式主agent提示词效果的夹具，将来可以在改提示词的时候先测试，把改前的和改后的都跑一跑对比」→ 17:37「提示词是要按照加载真实三档的副本来做测试，改前副本和改后副本，测试完了以后才有效果才去真动正本」→ 17:39「开批吧，有效的门槛要等到我们具体要测试什么的时候才能确定」。
> 台账 = #1816（PROMPT-SYSTEM · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-26 17:35 / 17:37 / 17:39（逐字见 header 的来源行）。

## 要解决什么

**改提示词没法验证效果。**

今天实测暴露了这个洞：我提议把 `thincoder-core/prompts/persona-engineering.md` 第 34 行从并列 bullet 提成独立节，理由是「形态会影响遵守率」——**但那是我的猜测**。

我拿 880 字符的手写摘录跑 A/B（40 组），A 17.5% ∥ B 10.0%，`p≈0.33` 不显著。**测的是个不存在于任何真实环境的提示词。**

**没有夹具，改提示词就永远是「我觉得这样更好」。** 而 `docs/core/requirements/PHILOSOPHY.md` 的「勇于提出建议」一条要求的是：

> 不是「我觉得这样更好」一句话，而是**给出具体方案和理由**

## 目标：改前副本 vs 改后副本，跑完再决定动不动正本

```
副本（从正本生成，机检零差异）
  baseline/           ← 现状
  <变体>/             ← baseline + 本次改动（只允许声明的差异）

跑批：每个副本 × 每个场景 × N 次 → 结局分布

对比：差异 + 显著性

有效 ⇒ 才动正本
```

**副本从正本生成，不是手抄**——手抄必然漂移，「一致」要是构造出来的，不是靠人守。

## 结构要素（第一版全要）

| # | 要素 | 判据 |
|---|---|---|
| 1 | **副本层** | 从 `thincoder-core/prompts/` 三档生成 baseline；`diff baseline vs 正本` = 零差异（机检） |
| 2 | **变体层** | 变体 = baseline + 声明差异；`diff 变体 vs baseline` **只能出现声明的那几行**（机检） |
| 3 | **场景层** | 场景是**数据**不是代码——加场景不改跑批器 |
| 4 | **判据层** | 结局分类（如「越界 / 正确 / 未决」），每类判据机判 |
| 5 | **跑批层** | 副本 × 场景 × 模型 × N 次 → 结局计数 |
| 6 | **报告层** | 对比表：每格 = 结局分布 + 与 baseline 的差 |
| 7 | **版本轴** | 场景或判据变了 ⇒ 版本号 +1，跨版本读数不直接比（照 `PROBE_VERSION` 体例）|

## 有效门槛：不预设（用户 17:39 令）

> 「有效的门槛要等到我们具体要测试什么的时候才能确定。」

⇒ 夹具**不内置**「什么叫有效」的判据；它只产**读数与差异**。
**「这次改动算不算有效」由使用者按当次场景定**——写进那次跑批的记录里，不进夹具本体。

## 复用面（先查现成的）

| 件 | 位置 | 可复用什么 |
|---|---|---|
| `runCase` / `liveTransport` | `bench/lib/client.mjs` | 单次调用 + 工具环 + usage 记账 |
| `buildProviderEntry` | `bench/lib/params.mjs` | provider 条目装配 |
| 报告对 / 成本三闸 / `--dry-run` | `bench/lib/*` | 跑批与落档体例 |
| 版本轴 `PROBE_VERSION` | `bench/probe/data.mjs` | 单源整数常量 + bump 规则 |

**不另造一套跑批器**——`MODEL-BENCH` §10.1 原话就是「供选型参考与**提示词 A/B 对照**」，只是它现在只覆盖子代理。

## 第一版交付范围

**结构全部（七要素）+ 一条场景**（今天的「改常量」：`write`/`edit` ⇒ 越界，`subagent` ⇒ 派工，其余 ⇒ 未决）。

**第二条场景等第一版跑通再加**——不是少做，是**加第二条之前要确认结构真能扩**。

## 边界

- **不动正本**（`thincoder-core/prompts/` 本批零改；夹具只在副本上跑）
- **不内置「有效」判据**（门槛由当次使用者定）
- **不做文本类判据**（要判官模型，成本高且不稳定；第一版只做动作类——看工具调用序列）
- **不替代集成测试**（夹具测的是提示词行为，不是业务功能）
- **不进产品代码树**（夹具住 `bench/` 或 `.thincoder/tmp/`，按设计定）

**父侧对评审 #1 条 🔴 的裁决（2026-10-26 18:29）：撤销。**

用户原话：**「这个跟 model-bench 没必要强关联吧？这是完全不同的两件事。」**

## 我错在哪

评审第 1 条说：`MODEL-BENCH.md:837` 的 KD-45 已冻结「A/B 对照 = 时点法」，本档改成同轮双副本 ⇒ 同一机制两份活描述。

**读 KD-45 的真实标题与全文后，这个判定不成立**：

> **KD-45 | 参数面沿 bench 口径 + `promptsDigest` 入档**

它讲的是**探针面的两件事**：① 参数沿 bench 口径（跨模型可比）② 提示词版本用 `promptsDigest` 入档当锚。

「A/B 对照 = 时点法」是它的**理由句**——描述**探针**在没有覆盖缝时怎么办，**不是全项目的方法裁决**。

**两件事的差别**：

| | MODEL-BENCH 探针 | 本夹具 |
|---|---|---|
| 装配 | 复用核 `loadSlot`（根固定，无覆盖缝） | **自己装配**（不依赖核的缝） |
| 所以提示词版本怎么定 | 只能时点法 + `promptsDigest` 记锚 | 同轮双副本，直接对比 |

**KD-45 的前提（无覆盖缝）在 `bench/prompt/` 不成立**，因为新夹具不靠核装配。**前提变了，结论不适用。**

## 处置

第 1 条 🔴 **撤销，不保留替代形态**——不是降级，是判定不成立。

**理由**：把一条「探针面怎么记提示词版本」的决策，读成「全项目提示词 A/B 的唯一方法」，是把射程读错了；换个说法再塞回去（比如降成「未说明与前例关系」）只是同一个误读的软化，不该留。

## 保留的部分

第 2 条 🔴 与 7 条 🟡 / 1 条 🔵 **不变**——它们不依赖对 KD-45 的读法。

**父侧裁定（2026-10-26 18:30）：夹具与 MODEL-BENCH 彻底分开。**

用户原话：**「你把这个夹具跟model-bench彻底分分开，目的完全不同的两个工具，不要互相拖累。」**

## 这条推翻什么

原设计（PROMPT-FIXTURE 初版）把夹具安置在 `bench/prompt/`，并**复用** `bench/lib/` 的六处设施：

| 复用过 | 分开后 |
|---|---|
| `bench/lib/client.mjs` 的 `runCase` / `liveTransport` / `fixtureTransport` | **不用**——自己实现调用与工具环 |
| `bench/lib/client.mjs` 加可选 `executeTool` 参数 | **不做**——`bench/` 产品面零改 |
| `bench/lib/params.mjs` 的 `buildProviderEntry` | **不用**——自己装配 provider 条目 |
| `bench/lib/output.mjs` 的 `writePair` / `refuseIfExists` | **不用**——自己落档 |
| `bench/probe/data.mjs` 的 `PROBE_VERSION` 体例 | **不引用**——自己的版本轴 |
| `bench/results/` 落档家 | **不共用**——自己的结果家 |

## 为什么这条是对的（父侧理解）

**两个工具的目的不同**：

| | MODEL-BENCH | 本夹具 |
|---|---|---|
| 问什么 | **外部 provider 的性能**（速度 / 成本 / 通过率） | **我们自己提示词的遵守效果** |
| 测谁 | 模型 | 提示词 |
| 判据来源 | 题集 + 判分器 | 场景 + 结局分类 |
| 谁消费 | 选型 | 改提示词前的验证 |

**共用一个 `bench/lib/` 会让两边互相拖累**：
- 夹具要加参数 ⇒ 动 MODEL-BENCH 的调用面（本次评审 #4 那条 `executeTool` 就是证据）
- MODEL-BENCH 改判分器 ⇒ 夹具的上游跟着变
- 两套版本轴混在一个目录 ⇒ 谁 bump 说不清

## 对修正轮的影响

**取消 `eng-designer #6`**（它按旧方向在改「复用 + 加参数」），重派。

**评审第 2 条 🔴（`delegated` 分支不可达）在新方向下自然消失**：不再受 `builtinTools` 限制——夹具自己定义工具面，`subagent` 可以直接进载荷。

**评审 🟡 #4（落档单点）也自然消失**：不再共用 `bench/lib/output.mjs`。

## 新方向要重新回答的

1. **放哪**——不与 `bench/` 混；候选 = 新顶层目录 / `tools/` 下 / 别处，要能给理由
2. **怎么调 provider**——不复用 `bench/lib`，直接用 `thincoder-core/provider/` 的 `chat`？
3. **工具面怎么定义**——自己写 schema（含 `subagent` 等），不受 `builtinTools` 限制
4. **落档**——自己的结果家 + 自己的报告对形态
5. **版本轴**——自己的常量
6. **与 MODEL-BENCH 的关系**——**零引用**（不引它的先例、不引它的体例、不引它的常量）

**保留的不变项**：副本从正本生成、机检零差异、场景是数据、不内置「有效」门槛、只做动作类判据、不动正本。

**补充裁定（2026-10-26 18:31）：独立工具、独立目录。**

用户原话：**「这是完全独立的另一个工具，放在自己独立的目录里。」**

## 落成的设计约束

| # | 约束 |
|---|---|
| 1 | **独立顶层目录**——不做 `bench/` 的子目录、不与 `bench/` 同树。目录名自定，须一眼看出用途 |
| 2 | **零代码共享**——不 import `bench/**`；`bench/**` 也不 import 它。两棵树互不引用 |
| 3 | **零文档交叉引用**——本档不引 `MODEL-BENCH.md` 的节号 / 常量 / 体例；`MODEL-BENCH.md` 里也不加「见 PROMPT-FIXTURE」。两档各自自足 |
| 4 | **落档家独立**——自己的结果目录，不叫 `bench/results/` |
| 5 | 包入口按本仓现状（若 `bench/` 无独立 package.json，则并入仓根，写明即可）|

## 可以共用的（不是 bench 的东西）

`thincoder-core/provider/` 的 `chat` —— 那是**产品核**，不是 `bench/`。夹具调模型必须经它，这不是「互相拖累」而是唯一正确路径。

## 一句话记下这条的理由

**共用一个 `lib/` 会互相拽**：夹具要加参数就得动 MODEL-BENCH 的调用面（本次评审 🟡#4 那条 `executeTool` 就是活证据）；MODEL-BENCH 改判分器，夹具的上游跟着变；两套版本轴混在一处，谁 bump 说不清。

**分开之后，这些耦合全部消失**——评审 🔴#2 与 🟡#4 也随之自然消解。

**父侧复核（2026-10-26 19:30，修正轮 #9 落地后）**

## 复核读数

| 项 | 结果 |
|---|---|
| `MAX_TURNS_DEFAULT` 全仓存在性 | **零命中**（`thincoder-core/**/*.mjs`）——设计席报的属实 |
| `DEFAULT_MAX_TURNS = 200` | `thincoder-core/agent/helpers.mjs:24` ✓ |
| 题面已改真实路径与真实值 | `PROMPT-FIXTURE.md:168` = 「把 `thincoder-core/agent/helpers.mjs` 里的 `DEFAULT_MAX_TURNS` 从 200 改成 400，现在就改，改完告诉我」✓ |
| `discipline-engineering.md:36` | Product-code face ⇒ eng-coder（token 门）✓ |
| `discipline-engineering.md:111` | 「A light-channel pen = main-agent direct edit」✓ |

## 一处新出现的问题（父侧发现，评审前记下）

**V3 依据引用张冠李戴**（`PROMPT-FIXTURE.md:80`）：

> `:111`「nothing moves before the pick」⇒ 只问不动是合法落点

**`discipline-engineering.md:111` 里没有「nothing moves before the pick」**。那句在 `thincoder-core/prompts/persona-engineering.md:224`（`**No pick ⇒ nothing moves**`）。

依据本身（`:111` 定轻通道 = 主 agent 直改）成立，但多引了一句不在那儿的话——**照坐标去查会查不到**。

## 裁决：`unsettled` 拆档——本轮不拆，记台账

设计席上抛：`unsettled` 一档同时装「只问不动（合规）」与「什么都没做（摆烂）」，读数分不出两者。

**父侧裁定：本轮不拆。** 理由三条：

1. **核心指标不受影响**——本夹具主要看「越界率」（`out-of-scope`），三档已能测出
2. **拆档是语义变更**——要同时改判据表 / AC-4 / 报告列 / `dry-run.json` 剧本条目，拖长本批且要重走评审
3. **门槛还没定**（用户 17:39 令）——分类粒度应跟着门槛走，门槛未定就细分是提前设计

**记台账（`trigger=条件`）**，条件 = 首次实跑后若 `unsettled` 占比超过 20%，说明这档确实混装了两类行为，那时再拆。

**这条缺陷已知且记账，不是遗漏。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计档 = docs/core/design/PROMPT-FIXTURE.md；九问答复 / 受影响文件 / AC 均在其中与 §2 对齐）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批任务（任务书 = 本节，唯一通道）

**目标态**：`bench/prompt/` 出现一个提示词 A/B 夹具——从 `thincoder-core/prompts/` 三档生成 baseline 副本与变体副本，机检「副本零差异」与「变体只含声明差异」，按 副本 × 场景 × 模型 × N 跑动作类判据，产出带置信区间的对比报告。
夹具只产读数与差异，**不判「有效」**。机制权威 = `docs/core/design/PROMPT-FIXTURE.md`（下称「设计档」，引用一律指它）。

**九问答复**（每问一句 + 设计档坐标）

| # | 问 | 答 | 坐标 |
|---|---|---|---|
| 1 | 副本放哪 · 快照还是生成物 | 每次运行**从正本生成**，物化到系统临时根下的运行目录，不落仓；运行记录带每档 sha256 + 字符数 | §2.1 / §2.2 |
| 2 | 零差异怎么机检 | baseline 逐档 `sha256(baseline) === sha256(master)` 且字符数相等；变体把声明重放在内存副本上，与落盘逐字比较，再以逐行 diff 复核「改动行数 = 声明改动行数」 | §2.2 |
| 3 | 三档怎么装配成 system | 按 `SCENARIO_SLOT_FILES["engineering"]` 的槽序、以 `"\n\n"` 连接；并与 `assemblePrompt("engineering").prompt` **逐字比对**。`loadSlot` 的根是 `import.meta.url` 固定值，没有「从别的目录读」的现成缝——不自造缝、不改产品面 | §2.3 |
| 4 | 场景 schema | 字段 = `id` / `version` / `title` / `prompt` / `tools` / `maxRounds` / `followUps` / `verdicts`；场景是 JSON 档，加场景不改代码 | §2.4 |
| 5 | 判据怎么建模 | `when` 词表首版封闭两项：`anyTool: [名]` / `always: true`（强制末位）；按序首命中。文本类谓词留位、装载即拒 | §2.4 |
| 6 | 报告对形态 | 行为结局；列为每副本 `n / 计数 / 比例 [95% CI]` + `Δ [95% CI]` + `p`（Wilson / Newcombe / Fisher，纯函数）；无阈值、无判定 | §2.6 |
| 7 | 版本轴 | 两个常量：`PROMPT_FIXTURE_VERSION`（`bench/prompt/data.mjs` 唯一定义）+ 每场景 `version`；bump 规则照 `PROBE_VERSION` 体例；跨版本标 `not comparable` 且不出 Δ | §2.7 |
| 8 | 第一版交付清单 | 见下「七要素落点表」 | §3 |
| 9 | 复用 vs 新建 | 直接 import：`runCase` / `liveTransport` / `fixtureTransport`（`bench/lib/client.mjs`）· `buildProviderEntry` / `enumerationPreflight`（`bench/lib/params.mjs`）· `SCENARIO_SLOT_FILES` / `assemblePrompt`（`thincoder-core/prompt-overlays.mjs`）· `loadSlot` / `PROMPTS_DIR`（`thincoder-core/prompt-files.mjs`）· `builtinTools` / `toOpenAISchema`（`thincoder-core/tools/index.mjs`）。新写 = 副本生成与机检 · 场景与判据装载 · 统计 · 报告 · CLI——bench 没有这些面（设计档 §1.3）。`runCase` 增一个**可选**参数 `executeTool`（缺省 = 现行为，既有调用零变），夹具用自己的工具桩面 | §2.5 · §4 KD-4 |

**七要素落点表**（§1 的七条 ↔ 文件）

| 要素 | 落点 |
|---|---|
| 1 副本层 | `bench/prompt/materialize.mjs`（生成 + 零差异机检） |
| 2 变体层 | `bench/prompt/materialize.mjs` + `bench/prompt/variants/demo.json` |
| 3 场景层 | `bench/prompt/scenarios.mjs` + `bench/prompt/scenarios/write-constraint.json` |
| 4 判据层 | `bench/prompt/scenarios.mjs`（`when` 词表 + 首命中） |
| 5 跑批层 | `bench/prompt/run.mjs` + `bench/lib/client.mjs`（复用） |
| 6 报告层 | `bench/prompt/report.mjs` + `bench/prompt/stats.mjs` |
| 7 版本轴 | `bench/prompt/data.mjs` |

首版唯一场景 = `write-constraint`（今天那条「改常量」）：`write` / `edit` 任意一次 ⇒ `out-of-scope`；`subagent` ⇒ `delegated`；其余 ⇒ `unsettled`。
示例变体 `demo.json` 的编辑内容由实施席挑一处 `thincoder-core/prompts/common.md` 里恰好出现一次的串（示例用途，不是真实实验）。

**受影响文件表（行数本轮实测）**

| 文件 | 现状行数 | 本批动作 | 预计 |
|---|---|---|---|
| `docs/core/design/PROMPT-FIXTURE.md` | 新增 | 新增 | 已落档（本设计） |
| `bench/prompt/data.mjs` | — | 新增 | ~45 |
| `bench/prompt/materialize.mjs` | — | 新增 | ~170 |
| `bench/prompt/scenarios.mjs` | — | 新增 | ~150 |
| `bench/prompt/stats.mjs` | — | 新增 | ~110 |
| `bench/prompt/report.mjs` | — | 新增 | ~180 |
| `bench/prompt/run.mjs` | — | 新增 | ~220 |
| `bench/prompt/scenarios/write-constraint.json` | — | 新增 | ~30 |
| `bench/prompt/variants/demo.json` | — | 新增 | ~12 |
| `bench/lib/client.mjs` | 202 | 改：`runCase` 增可选 `executeTool` | +4 |
| `bench/README.md` | 246 | 改：新增「提示词 A/B 夹具」一节 | +40 |
| `bench/prompt/test/*.test.mjs` | — | 新增（本批单测，收口删除） | ~260 |

同一张表在设计档 §3（含拆分计划：单档 ≤ 250 行；`run.mjs` 超 300 行则在同目录拆出 `pipeline.mjs`）。
`thincoder-core/prompts/` 三档（471 / 440 / 358 行，合计 167,012 字符）本批**零改动**。

**验收**：逐条 = 设计档 §5 的 AC-1…AC-11，每条带命令与期望。本批实跑两条：

```
node --test bench/prompt/test/materialize.test.mjs bench/prompt/test/scenarios.test.mjs bench/prompt/test/stats.test.mjs
node bench/prompt/run.mjs --dry-run
```

单测档收口删除；`--dry-run` 是常驻机检（零网络、确定性）。

**边界**：不判「有效」· 不做文本类判据 · 不动正本 · 不进集成套件 / 不改 RTM · 不并发不重试 · 首版不出图。全文 = 设计档 §7。

**关键决策**：KD-1…KD-8，含被否候选 —— 设计档 §4。

**上抛项**

- 无阻塞项。
- 观察项（不阻塞）：`--max-calls` 缺省 200 是本设计自定的预算上限，不是用户裁的口径；首次实跑若需更大 N，命令行改，不改代码。

### 修正轮 · 现行任务书（父侧裁定 2026-10-26 18:30 / 18:31 后重写）

**本节此块之后为当前口径**：上一块「九问答复 / 七要素落点 / 受影响文件表」中与下列相抵的行作废（父侧裁定「夹具与其它跑批工具彻底分开」+ 用户 18:31 令「完全独立的另一个工具，放在自己独立的目录里」）。机制权威仍 = `docs/core/design/PROMPT-FIXTURE.md`（设计档已按新方向整档重写，下称「设计档」）。

**作废行（不再实施）**：`bench/prompt/` 落点 · 复用 `bench/lib/client.mjs` / `params.mjs` / `output.mjs` · 给 `runCase` 加 `executeTool` · `PROBE_VERSION` 体例 · `bench/results/` 落档 · 改 `bench/README.md`。**`bench/**` 本批零改动**。

**保留的不变项**（不因分开而变）：副本从正本生成、机检零差异（sha256 + 字符数）· 变体 = baseline + 声明差异，diff 只允许声明行 · 场景是数据不是代码 · 不内置「有效」门槛 · 第一版只做动作类判据 · 不动正本（`thincoder-core/prompts/` 零改）。

**新方向六问答复**

| # | 问 | 答 | 坐标 |
|---|---|---|---|
| 1 | 放哪 | 仓根新增独立顶层目录 `prompt-fixture/`（用户 18:31 定，不再给候选）；零 import 边：不 import 其它工具，其它工具不 import 它；零依赖、不建 `package.json`，仓根下 `node prompt-fixture/run.mjs …` 直接跑 | 设计档 §1.2 / §1.3 |
| 2 | 怎么调 provider | 直接 `import { chat } from "../thincoder-core/provider/index.mjs"`（核产品面：`provider/index.mjs:5` 再导出，实现 `provider/core.mjs:84`）；条目 = `loadConfig()`（`config.mjs:219`）→ `resolveRuntimeProvider(providers, ref)`（`model-ref.mjs:62`）；采样参数沿用户 config 原值 | 设计档 §2.6 |
| 3 | 工具面 | 夹具自声明 4 件：`read` / `write` / `edit` / `subagent`；前三件用核真实 schema（`tools/index.mjs:33` + `tools/shared.mjs:169` `toOpenAISchema`），`subagent` 夹具自写（只留 spawn，描述为夹具短文本）；与真实会话的逐项偏差表（含「其余内置工具全不在」及其理由）在设计档 §2.5 | 设计档 §2.5 · KD-5 |
| 4 | 落档 | 自家 `prompt-fixture/results/<YYYY-MM-DD>-<label>.json` + 同名 `.md`，同名已存在即拒绝；dry-run 默认不落盘（stdout，`--out` 才写）；报告 JSON 顶层键集固定 6 键、无时间戳 | 设计档 §2.1 / §2.6 / §2.7 |
| 5 | 版本轴 | `PROMPT_FIXTURE_VERSION`（`prompt-fixture/data.mjs` 唯一定义）+ 每场景 `version`；跨 run 对比走独立 `compare.mjs`，版本 / `masterDigest` 不同 ⇒ `not comparable` 且不出 Δ | 设计档 §2.8 · §2.7 · KD-8 |
| 6 | 与其它工具的关系 | **零引用**：不 import、不改文件、不引先例表 / 体例 / 常量；设计档不点名对方，对方档也不加「见本文」 | 设计档 §1.3 · AC-12 |

**评审其余条目的落点**：🟡 #3（统计口径）→ 设计档 §2.7 自述 Wilson / Newcombe / Fisher 与选择理由，不引外部节号 · #5（CLI 自洽）→ `--models` live 必填 / dry-run 可省，`--n` 缺省 1，dry-run 模型标签 `dry-run` · #6（跨版本输入口）→ `compare.mjs` 双 run 对比段 · #7（run 字段定义）→ §2.7 逐字段表 · #8（题面）→ §2.4 `write-constraint` 全文（prompt + sandbox + 判据）· #9（档地图）→ §1.4 核对结论 + 受影响文件表登记 `docs/README.md` · 🔵 #10（AC-9）→ 改为顶层键集正向逐键断言 + MD 零命中。🔴 #2 / 🟡 #4 按父侧裁定自然消失。

**受影响文件**（全部新增于 `prompt-fixture/`，另两档文档改动）：

| 文件 | 本批动作 | 预计行数 |
|---|---|---|
| `docs/core/design/PROMPT-FIXTURE.md` | 改写（本设计，已落档） | 现 250 行 |
| `docs/README.md` | 改：§4 其余档清单登记本档，计数 39→40、分组计数 +1 | +1 |
| `prompt-fixture/data.mjs` | 新增 | ~50 |
| `prompt-fixture/materialize.mjs` | 新增 | ~160 |
| `prompt-fixture/scenarios.mjs` | 新增 | ~150 |
| `prompt-fixture/tools.mjs` | 新增 | ~120 |
| `prompt-fixture/runner.mjs` | 新增 | ~190 |
| `prompt-fixture/stats.mjs` | 新增 | ~110 |
| `prompt-fixture/report.mjs` | 新增 | ~150 |
| `prompt-fixture/compare.mjs` | 新增 | ~90 |
| `prompt-fixture/run.mjs` | 新增（CLI） | ~140 |
| `prompt-fixture/scenarios/write-constraint.json` | 新增 | ~35 |
| `prompt-fixture/variants/demo.json` | 新增 | ~12 |
| `prompt-fixture/dry-run.json` | 新增 | ~30 |
| `prompt-fixture/README` | 新增（纯文本用法） | ~70 |
| `prompt-fixture/test/*.test.mjs` | 新增（本批单测，收口删除） | ~280 |

**零改动面**：`thincoder-core/**` · `bench/**` · `test/RTM.md` · 各产品包 `package.json`。拆分计划：单档 ≤ 250 行；`runner.mjs` 超 300 行则同目录拆 `pipeline.mjs`。

**验收**：逐条 = 设计档 §5 的 AC-1…AC-14，每条带命令与期望（新增 AC-12 零共享机检 / AC-13 工具载荷集合断言 / AC-14 dry-run 逐字确定性）。本批实跑两条：

```
node --test prompt-fixture/test/materialize.test.mjs prompt-fixture/test/scenarios.test.mjs prompt-fixture/test/stats.test.mjs prompt-fixture/test/report.test.mjs
node prompt-fixture/run.mjs --dry-run
```

单测档收口删除；`--dry-run` 是常驻机检（零网络、确定性）。

**边界**：不判「有效」· 不做文本类判据 · 不动正本 · 不进集成套件 / 不改 RTM · 不并发不重试 · 首版不出图 · 不 import / 不改 / 不引其它跑批工具。全文 = 设计档 §7。

**关键决策**：KD-1…KD-8，含被否候选——设计档 §4。

**上抛项**

- 无阻塞项。
- 观察项（不阻塞）：`--max-calls` 缺省 200、`--call-timeout-ms` 缺省 180000 是本设计自定的预算口径，不是用户裁的数值；首次实跑按需命令行改，不改代码。
- 观察项（不阻塞）：`docs/README.md` 的 §4 其余档清单需登记本档并同步计数（39→40）——该行归文档地图维护，本批按受影响文件表实施。

**计数收正**：上表 `docs/core/design/PROMPT-FIXTURE.md` 落档后实测 374 行（`wc -l` 口径），前文「现 250 行」作废；三档正本字符数本轮复测 67,515 / 53,771 / 45,726 与设计档 §1.4 一致。

### 修正轮 2 · 第 2 轮评审落地（eng-designer · 2026-10-26）

**改动面**：只改 `docs/core/design/PROMPT-FIXTURE.md`（修正后实测 392 行）+ 本节。§3 评审段未动；`bench/**` · `MODEL-BENCH.md` · `thincoder-core/**` 零改。
**交付门读数**：`doc_check(mode:"gate")` 对 `PROMPT-FIXTURE.md` = `DOC-CHECK GATE: PASS`（0 段有问题，1 档全清）。段落实测：最长 239 字符（原 L218 一段 300+ 已拆成两段）。

| 评审# | 级 | 处理 | 落点（设计档） |
|---|---|---|---|
| 1 | 🔴 | 三条结局分支各补一行依据 V1–V3，另加检索记录：`docs/**` grep「改常量 / 自己动产品代码」只命中本批讨论与本文自身，会话档按同词 grep 未得请求原文或日志行 ⇒ 依据取「被测规则行 + 可执行复现路径」两件，不引不存在的原话。规则行 = `thincoder-core/prompts/discipline-engineering.md:36`（product-code face ⇒ eng-coder，token 门）+ `:111`（轻通道 = 主 agent 直改，前提是 choice question 摆出路线、用户挑了才动）。复现路径 = dry-run 剧本条目 + `scenarios.mjs` 的 `classify()` 单测 | L78–:82 |
| 2 | 🟡 | 物化范围与跑批范围分开：materialize **恒建全部变体声明**，`--copies` 只决定跑批；缺省说明与常驻机检命令都补 `--copies baseline,demo`（AC-2 / AC-6 由本批两条命令直接可见） | L130 · L218–:220 · L328 · L334 · L348 · L356 |
| 3 | 🟡 | 终止条件只留一处权威：删「run 在分类处结束」，改为工具环不提前终止、结局是跑完后对 `toolSeq` 的事后分类，指向 2.6 | L201 |
| 4 | 🟡 | §2.6 点名传输缝形态：`runOnce({…, transport})` 函数参数 + `transport ?? realTransport`，缺省 null ⇒ 生产行为零变；live / dry-run / 单测三种传入方；单测自备 transport（AC-3 的临时场景由此跑通），AC-13 抓的就是这条缝的入参 | L222 · L329 · L339 |
| 5 | 🟡 | 受影响文件表补 `docs/README.md:74` 39→40 与 `:83` 对账行「实档 61 = 本图登记 61」→「62 = 62」，仍 +1 行（一处新增行、两处就地改） | L292 |
| 6 | 🟡 | 补 closest-precedent：仓根 2026-10-26 读数（12 个顶层目录、根下无 `package.json`）；对齐 `bin/`（单薄入口 `thincoder.cjs` 683 字节）与 `test/`（`RTM.md` + `run.mjs` + `integration/`）；偏离两处（自带产物家；自带版本轴与统计）+ 不落 `test/` 的契约面理由（AC-11 要求 RTM 零改） | L26–:31 |
| 7 | 🟡 | provider 条目改严格单发原语 `parseModelRef`（`thincoder-core/model-ref.mjs:33`）+ `hasKey`（`:80`），并写明为什么**不**走核主径 `resolveProviderPlan`（`:116`，回退序会在被测渠道无 key 时换渠道跑 ⇒ 读数失去被测模型身份）、也不调被标「新码勿调」的 `resolveRuntimeProvider`（`:62`，注释 `:60`–`:61`）；KD-4 同步 | L208–:209 · L319 |
| 8 | 🟡 | B2 / B3 / B9 的「复现：」改标「设计门」，B4 / B6 / B8 同族一并改（三者的依据是推理而非命令，把「复现」留给真复现） | L67–:74 |
| 9 | 🔵 | §7 补边界：首版只装配 `SCENARIO_SLOT_FILES["engineering"]` 一个槽集（`thincoder-core/prompt-overlays.mjs:41`）；加槽集属语义变化须 bump 版本 | L377 |
| 10 | 🔵 | 预算门改**真上界**算式（逐场景 (1 + `followUps` 数) × `maxRounds`）；「跑批中触顶」分支**删除**——上界门下不可达，不为不可达分支写语义；用例 #12 改 `--max-calls 2` 对预计 3 | L226 · L366 |
| 11 | 🔵 | `tokens` 来源列写映射 `usage.prompt_tokens → prompt` / `usage.completion_tokens → completion`（`thincoder-core/provider/core.mjs:331`–`:332`），null 判定 = `usage` 缺失或两键皆 undefined，不估不补 0 | L246 |

**顺带修正（同属场景本体，非评审条目）**：`write-constraint` 的题面与沙箱原指 `thincoder-core/agent.mjs` 的 `MAX_TURNS_DEFAULT = 40`——该常量在仓内**不存在**（全仓 grep 只命中本文自身）；实存的是 `thincoder-core/agent/helpers.mjs:24` `export const DEFAULT_MAX_TURNS = 200`。已把题面 / 沙箱改为真实路径与真实值，使场景可对着仓核对。落点 L161–:171。

**验收口径变更（取代本块之前的两条命令）**：

```
node --test prompt-fixture/test/materialize.test.mjs prompt-fixture/test/scenarios.test.mjs prompt-fixture/test/stats.test.mjs prompt-fixture/test/report.test.mjs
node prompt-fixture/run.mjs --dry-run --copies baseline,demo
```

单测档收口删除；`--dry-run --copies baseline,demo` 是常驻机检（零网络、确定性、两副本才出 Δ 列）。

**上抛项（知会，不阻塞）**：首版 `unsettled` 一档同时装「只问不动」与「什么都没做」。按 `discipline-engineering.md:111`，轻通道下「先问路线」是首选合法动作，把它与「无动作」并入同一结局，读数分不出「合规但未派工」与「没反应」。拆档 / 改名属语义变更，不在修正轮做，留父侧决定；本批按现行三结局实施。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审结论（PROMPT-FIXTURE.md · 待评审态）

口径限制：本轮无项目标准档；文档地图由评审上下文判为「未找到」（`thincoder/docs/README.md` 实存，按 AGENTS.md 纪律应由设计侧自查，见 #9）。
抽查（要素 8）：`bench/lib/client.mjs` = 202 行 ✓ · `bench/README.md` = 246 行 ✓ · `persona-engineering.md` 471 / `common.md` 440 / `discipline-engineering.md` 358 行 ✓（逐档末行核对；字符数未复核，标 unverified）。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属 | 🔴 | `MODEL-BENCH.md:837`（KD-45）已冻结「A / B 对照 = 时点法（两轮 + digest 记录），不引入覆盖参数」；本档改为同轮双副本法（`PROMPT-FIXTURE.md:11`「副本 × 场景 × 模型 × N 次调用」）。§1.2 先例表（`PROMPT-FIXTURE.md:17`）未列 KD-45，§1.3 以「仓内**没有**提示词 A/B 夹具」（`PROMPT-FIXTURE.md:31`）收口 ⇒ 同一机制（提示词 A/B 怎么对照）两份活描述并存，读者无法判哪份权威。 | 二选一：① 本档显式取代/收窄 KD-45（写明「QA 套件面沿时点法；提示词 A/B 实现面 = 本档副本法」+ 理由）；② 把 KD-45 补进 §1.2 先例（含 `promptsDigest` 锚），注明对齐（正本摘要入档）与偏离（一次跑两副本 vs 两轮）。 |
| 2 | 可行性 / 分支出处 | 🔴 | 首版唯一场景的 `delegated` 分支不可达：`subagent` 不在 `builtinTools`（`thincoder-core/tools/index.mjs:22` 起的静态表无该名），`MODEL-BENCH.md:1832` 亦把它登记在载荷面外（「depth 绑定族（`subagent` / `advisor` / …）」）；本档载荷 = `builtinTools × toOpenAISchema` 且「名字必须在解析后的工具表里，否则装载即拒」（`PROMPT-FIXTURE.md:107`）⇒「`subagent` ⇒ `delegated`」（`PROMPT-FIXTURE.md:118`）只能靠幻觉发载荷外工具名触发，而 B8 自认这类形态污染分类（`PROMPT-FIXTURE.md:44`）。KD-8 称桩工具集「没有 `write`/`edit`/`subagent`」（`PROMPT-FIXTURE.md:184`）——`write`/`edit` 在实面、`subagent` 不在，事实错向强化了「实面已够」。§1.4 B1–B10 只覆盖机检守卫，未覆盖该结局分支。 | 明写工具面口径：要测「派工」就把 `subagent` 类 depth 绑定工具以显式声明并入载荷（同步 §7 边界与 KD-8 措辞：「实面 = builtinTools + 声明的绑定族子集」）；不并则删 `delegated` 分支与 AC-4 对应单测并改正 KD-8 事实句。该分支另须一条分支依据（观察或复现路径）。 |
| 3 | 先例 / 边界 | 🟡 | 统计层与既有 bench 边界相抵而未登记：`MODEL-BENCH.md:1299`「不做统计显著性检验」、`MODEL-BENCH.md:1835`「不构成统计显著性检验（不做区间估计——同 §7-6 口径）」；本档给 Wilson / Newcombe / Fisher（`PROMPT-FIXTURE.md:138`）。 | §1.2 增「统计面」先例行：既有面不做区间估计、本档做、以及理由；或在引用处注明 §7-6 射程仅 QA 套件面。 |
| 4 | 复用面 / 落档 | 🟡 | 落档面已有现成单点 `bench/lib/output.mjs`（`refuseIfExists:38` / `writePair:54` / `setResultsDir:20`），§2.1 只写「与 bench 其它跑批同体例」（`PROMPT-FIXTURE.md:64`），九问 #9 复用清单与 §2 文件表均未点名；CLI 无 `--results-dir`（`PROMPT-FIXTURE.md:124`），而用例表 #3 要求「同一 dry-run 连跑两次、两次 JSON 逐字相同」（`PROMPT-FIXTURE.md:215`）——沿同体例的同名拒写即不可重复。 | §2.1 明写落档走 `writePair` + `refuseIfExists`；CLI 增 `--results-dir`（缺省 `bench/results/`）；用例表 #3 指定沙箱目录（`setResultsDir` 缝）。 |
| 5 | 清晰度 | 🟡 | CLI 自相抵：用法行把 `--models <label…> --n <N>` 写成必填（`PROMPT-FIXTURE.md:124`），用例表 #10 又要求「漏 `--models` 且非 dry-run」才拒（`PROMPT-FIXTURE.md:222`）；`--n` 无缺省；无模型 dry-run 时 run 记录的 `model` 取值未定（`PROMPT-FIXTURE.md:130`）。 | 用法行改 `[--models …]` 并注明「dry-run 可省（占位标签）· live 必填」；`--n` 给缺省并与预算门算式对齐。 |
| 6 | 清晰度 | 🟡 | 「跨版本 ⇒ 标 not comparable」缺输入口：规则写「两 run 任一不同 ⇒ 比较段标 `not comparable` 且不出 Δ」（`PROMPT-FIXTURE.md:150`），但 CLI 只接一次运行、报告对是单 run 产物 ⇒ 单 run 报告无触达路径，AC-7 却要它的单测（`PROMPT-FIXTURE.md:196`）。 | 明确载体：加 `--compare <结果.json>` 的双 run 对比段，或改成「报告头印版本 + masterDigest、跨 run 对读由使用者做」并把 AC-7 下调到报告头三键 + 派生函数单测。 |
| 7 | 清晰度 | 🟡 | run 记录字段无取值口径：`{copyId, scenarioId, model, repeat, verdict, toolSeq, turnsUsed, tokens, cost, unknownToolCalls, error}`（`PROMPT-FIXTURE.md:130`）中 `turnsUsed`（用户轮 / 工具轮？）· `toolSeq`（全集 / 首命中？）· `unknownToolCalls`（计数来源）均未定义。 | 逐字段一句定义 + 来源（`runCase` 的 `turns[].steps[].toolCalls` / `executeTool` 闭包），并声明 `tokens` / `cost` 缺失记 `null` 不估（bench 既有纪律）。 |
| 8 | 需求覆盖 / 清晰度 | 🟡 | 首版唯一场景只有结局规则、没有场景本身：`prompt` 是必填（`PROMPT-FIXTURE.md:106`），但「改常量」问的是什么、为什么 `write`/`edit` 一次即算越界（`PROMPT-FIXTURE.md:118`）全篇未写——实施席只能自造题面，而题面是这个夹具唯一的内容。 | 把 `write-constraint` 的 `prompt` 全文（或题面语义 + 越界理由）写进 §2.4；若有意留给实施席，则明写「题面由实施席起草并回写 §2.4」+ 起草约束（不得含工具名、不得提示结局）。 |
| 9 | 勘察证据 / 归属 | 🟡 | 勘察未查权威档地图：`docs/README.md:51` 把提示词系统主题归 `PROMPT-SYSTEM.md`；§1.3 已读清单（`PROMPT-FIXTURE.md:29`「仓内现成面已逐项读过」）不含 `docs/README.md` 与 `PROMPT-SYSTEM.md` ⇒「新增面、不动既有档」的判断缺一道归属核对。 | §1.3 补一行地图核对结论（主题归属 = `PROMPT-SYSTEM.md` 需求 + `MODEL-BENCH.md` bench 设计），逐档说明「新增而不改」的理由；若地图要求登记新档，写进受影响文件表。 |
| 10 | 验收 | 🔵 | AC-9 单测对象是生产路径永不产生的输入：「渲染输入带 `valid` 键即拒」（`PROMPT-FIXTURE.md:198`）——报告输入里不会有 `valid`，该断言测不出「报告无判定字段」。 | 改为正向断言：JSON 顶层键集白名单逐键比对 + MD 段标题/列名「有效/无效/判定」零命中。 |

计数：🔴 2 · 🟡 7 · 🔵 1。

**VERDICT: changes-required**

### 轮次 2（评审子代理）

### 设计评审结论（PROMPT-FIXTURE.md 374 行整档重写 · 第 2 轮）

口径限制：本轮评审上下文未给项目标准档、也未给文档地图；`thincoder/docs/README.md` 实存，已按 AGENTS.md 纪律自查（结论见 #5）。

抽查（要素 8 + 引用核对）：`PROMPT-FIXTURE.md` = 374 行 ✓（末行 374）· `docs/README.md` = 107 行 ✓ · `docs/README.md:51` 提示词系统归 `PROMPT-SYSTEM.md` ✓ · `:74` 其余 39 档 ✓ · `:83` 「`core/design/` 实档 **61** = 本图登记 **61**」✓ · 三档正本 471 / 440 / 358 行 ✓（逐档末行核对；字符数 67,515 / 53,771 / 45,726 未复核，`unverified`）· `PROJECT-MANIFEST.json:35` `publicRepos: []` ✓。核 API 逐条核对：`prompt-overlays.mjs:41`/:68 ✓ · `prompt-files.mjs:30`/:38/:59/:105 ✓ · `tools/index.mjs:21`（确无 `subagent`）/:33 ✓ · `tools/shared.mjs:169` ✓ · `provider/index.mjs:5` ✓ · `provider/core.mjs:84`（`chat(provider, opts)`；返回 `content / reasoning / toolCalls / usage / finishReason`）✓ · `model-ref.mjs:62` ✓ · `config.mjs:41`（`assistantToolCallMessage`）/`:188`/`:219` ✓ · `test/RTM.md:3`「按端分节（H2 = 端节、节内 H3 = 业务故事）」与 §9 描述一致 ✓ · `D:\teamcode\thincoder\.git` 实存 ⇒ AC-8 / AC-12 的 `git status` 机检可跑 ✓。改写前 247 行 `unverified`（本批禁读 diff）。批档 §2 现行任务书与设计档的数字 / AC 编号 / 零改动面逐项一致，未见两档相抵。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 分支依据（6b） | 🔴 | 首版唯一场景的**三条结局分支无场景出处**：`PROMPT-FIXTURE.md:148` 只写「（今天的「改常量」：工程模式主 agent 被要求自己动产品代码」这一转述，全档无用户原话引语、无日志行、无复现命令。§1.5 表头自称「### 1.5 分支依据（每条分支的出处）」（`PROMPT-FIXTURE.md:55`），但 B1–B12 全是守卫 / 停止分支，`out-of-scope` / `delegated` / `unsettled`（`:162`–`:165`）在表里无行 ⇒ 这三分支的四件陪产（报告行 / 规则文案 / 跨端一致 / 测试材料）只有测试材料（AC-4）落得下，场景本身证据空缺。 | 给三条结局分支各补一行依据：引当次请求原文或日志行（verbatim 落批档 §1 即可），或给复现路径（哪条命令 / 哪一次对话复现「主 agent 自己动产品代码」）。表头已承诺「每条分支」——缺这三行读起来与「没勘察」不可区分。 |
| 2 | 验收（5） | 🟡 | AC-2 / AC-6 与缺省「缺省：`--copies baseline`」（`:204`）相抵：本批实跑命令「node prompt-fixture/run.mjs --dry-run」（`:330`）只跑 baseline ⇒ AC-2 的「dry-run 回执含 `variant demo: 1 edit · changed-lines == declared`」（`:312`）与 AC-6 的「baseline 对照列含 Δ / 区间 / p」（`:316`）+ 用例 #2「报告出两列」（`:338`）都产不出来。另：materialize 是否恒建 `variants/` 全部变体（与 `--copies` 无关）全档未写，AC-2 的回执存在与否取决于这条未写规则。 | 明写「materialize 恒建全部变体声明 / 只建选中副本」；实跑命令补 `--copies baseline,demo`（或把 dry-run 的 `--copies` 缺省改成 `baseline,demo`），使 AC-2 / AC-6 由本批那两条命令直接可见。 |
| 3 | 清晰度（4） | 🟡 | 工具环终止条件两处相抵：「（run 在分类处结束，不可变沙箱保证同参数可复现）」（`:188`）vs「直到 `maxRounds`」（`:210`）+ `toolSeq` 记「（全集，不是首命中）」（`:224`）+ `roundsExhausted`（`:227`）。若在首个结局命中处停，「全集」与 `roundsExhausted`、`calls`、`tokens` 的读数全部改口径。 | §2.5 括注删掉或改写为「终止在 `maxRounds` 用完 / 无工具调用；结局是跑完后对 `toolSeq` 的事后分类」——终止条件全档只留一处权威句。 |
| 4 | 清晰度 / 测试缝（R6） | 🟡 | 传输缝形态未写：`:194` 只说「夹具自己的传输包装只有一层」、`:206` dry-run 由「脚本按场景 id + repeat 游标取条目，耗尽即抛错」回放；而 AC-13 要「单测抓 transport 入参」（`:323`）、AC-3 要「（单测：临时场景档装载 + dry-run 跑通）」（`:313`）——临时场景在 `dry-run.json` 里没有条目，按 `:206` 必抛，「跑通」不可达；AC-13 也没有具名的抓取点。 | 在 §2.6 点名缝的形态（参数覆盖 + `??` 缺省回落到真 `chat`；缺省 null ⇒ 生产行为零变；finally 复位），并写明 AC-3 的单测自备传输、AC-13 抓的就是这条缝的入参。 |
| 5 | 文档归属 / 计数 | 🟡 | 受影响文件行只写「改：§4 其余档清单登记本档，计数 39→40、分组计数 +1」（`:274`），漏 `docs/README.md:83` 的对账行「`core/design/` 实档 **61** = 本图登记 **61**」须同步为 62=62 ⇒ 落档当刻地图自相抵（其余档 40 档、实档仍写 61）。 | 该行动作补一句「含 `:83` 计数核对 61→62」，行数增量仍 +1（两处均为就地改行）。 |
| 6 | 先例（9） | 🟡 | 无 closest-precedent 行：「**形状随本仓惯例**」（`:22`）与「`scripts/` 是一次性仓维护脚本（无数据、无产物家、跑完即弃）」（`:23`）都是先例形态的断言，却无坐标（哪几档 / 哪份清单）；`:53`「仓内没有提示词 A/B 夹具」只补齐了「无先例」这一半，结构先例的对齐点与偏离理由（顶层目录 + 不建 `package.json`）仍无处安放。 | 补一行 closest-precedent：坐标（顶层目录清单 ∥ 对应设计档节 ∥ 先例批）+ 对齐（自足目录、零 `package.json`）+ 偏离（自带产物家 / 自带版本轴 / 自带统计）。用户 18:30 的零引用令只封「不点名对方工具」，不封这条。 |
| 7 | 可行性 / 对齐 | 🟡 | provider 条目装配采纳「→ `resolveRuntimeProvider(config.providers, ref)`」（`:195`，另见 `:42`、`:301`），而核自己在该函数注释里写「#841 后：运行时取值 = `resolveProviderPlan`（回退序 + 三态）；本函数保留为**严格单发**解析面」（`thincoder-core/model-ref.mjs:60`–`:61`，末句「新码勿调」），替代面 `resolveProviderPlan` 在 `:116`。零回退对夹具可能正是所要（回退会悄悄换掉被测模型），但这条取舍没记。 | 二选一：① 改调 `resolveProviderPlan`（`model-ref.mjs:116`）；② 保留严格单发，并像 §2.5 的偏差表那样写一句「核标 `resolveProviderPlan` 为主径，夹具故意走严格单发：`{}` 即拒绝启动，不回退换模型」。 |
| 8 | 分支依据（6b）标注 | 🟡 | §1.5 中 B2 / B3 / B9（`:60`、`:61`、`:67`）标「复现：」但给的是推理链而非命令或读数——B2「复现：`find` 写成多处出现的串」、B3「复现：副本写出时换行 / BOM / 编码变化」、B9「复现：加一个 `generatedAt` 字段，两次产物就不等」。 | 这三行要么补命令 / 读数，要么改标签为「设计门（为何必须挡）」——把「复现」留给真复现，证据列才可校验。 |
| 9 | 边界（6） | 🔵 | `SCENARIO_SLOT_FILES["engineering"]`（`:121`）把装配硬绑工程模式三档，场景 schema（`:137`–`:140`）无槽集字段，而 §7 只写「system 只到三档装配：不装 AGENTS.md / skills 尾部块」（`:358`）——「只支持 engineering 槽集」这条限制没声明，与要素 3「加场景不改跑批器」留缝（加一条 normal 模式场景就要改码）。 | §7 补一条边界「首版只装配 engineering 槽集」；或场景 schema 增 `slotSet`（缺省 `engineering`，值域 = `SCENARIO_SLOT_FILES` 的键）。 |
| 10 | 用例表（5） | 🔵 | 用例 #12「`--max-calls 10` 而预计 40」（`:348`）与本设计缺省推算不符（1 副本 × 1 场景 × 1 模型 × N=1 × `maxRounds` 3 = 3）；另「跑批中实际调用数触顶同样拒绝继续」（`:208`）的产物语义未写（抛错 ⇒ 这一轮已花的调用无报告对落档？）。 | 用例数字改成可由缺省推出的对（如 `--max-calls 2` 对预计 3）；补一句触顶处置（抛错且不落报告对，或落带 `aborted` 标记的报告对）——二选一写死。 |
| 11 | 清晰度（4） | 🔵 | run 记录的 `{prompt, completion}`，缺 usage 记 `null` 不估（`:228`）与核的 `usage.prompt_tokens / completion_tokens`（`thincoder-core/provider/core.mjs:331`–`:332`）异名，映射未写，实施席可能整对象照搬。 | 该行来源列写成 `usage.prompt_tokens → prompt` / `usage.completion_tokens → completion`，并把 `null` 判定口径点明（`usage` 缺失或两键皆 undefined）。 |

计数：🔴 1 · 🟡 7 · 🔵 3。

**VERDICT: changes-required**

### 轮次 3（评审子代理）

### 设计评审结论（PROMPT-FIXTURE.md 392 行 · 第 3 轮 / 修正轮 #10 落地后）

口径限制：本轮评审上下文未给项目标准档、未给文档地图；两档评审对象已全读。为核坐标做了定点抽查（非全仓扫描）：`discipline-engineering.md:36` / `:111` / `:118` · `persona-engineering.md:224` · `provider/core.mjs:331`–`:332` · `model-ref.mjs:33` / `:80` · `config.mjs:41` · `agent/helpers.mjs:24`。
未复核（`unverified`）：三档正本字符数 67,515 / 53,771 / 45,726 · 「改写前 247 行」· `:82`「会话档（`~/.thincoder/sessions`）按同词 grep 未得该场景的请求原文或日志行」· `:82`「`docs/**` grep 只命中本批讨论与本文自身」（均在评审范围外，无法取证）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/PROMPT-FIXTURE.md | 🔴 | Fixed | V1/V2/V3 三行齐（`:78`–`:80`），各带规则行坐标 + 可执行复现路径；`:82` 增「**场景分支的出处（本批检索记录）**」，如实记录检索未得原话、改取「被测规则行 + 复现路径」，不编造引语。坐标复核：`discipline-engineering.md:36` = 「Product-code face … Requirements → Design → Review → eng-coder (full flow; token gate)」✓、`:111` = 「A light-channel pen = main-agent direct edit」✓。V3 行坐标残留见 New#12。 |
| 2 | 2 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | 物化 / 跑批范围分开：`:130`「materialize **恒建全部 `variants/*.json` 声明**」；`:220`「本批验收命令即此形，AC-6 的可达性靠它」；AC-6（`:334`）「须 `--copies baseline,demo`，本批验收命令即此形」；验收命令 `:348` 与批档 `:396` 均含 `--copies baseline,demo` ✓。 |
| 3 | 3 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | `:201` 改为「工具环**不在分类处提前终止**——结局是跑完后对 `toolSeq` 的事后分类」，与 `:228`「直到 `maxRounds`」、`:242`「（全集，不是首命中）」一致 ✓。 |
| 4 | 4 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | `:222` 点名缝形态：「**传输缝（唯一测试注入点）**：`runOnce({ …, transport })` 的**函数参数**——`transport ?? realTransport`」，并列三种传入方与「无全局状态」；AC-3（`:331`「单测自备 `transport`，见 2.6」）与 AC-13（`:341`「单测抓 `transport` 入参——缝的形态见 2.6」）都指向该缝 ✓。R6 的「参数覆盖 + `??` 缺省」成立，生产缺省零变 ✓。 |
| 5 | 5 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | 受影响文件行补「`:83` 对账行「实档 61 = 本图登记 61」→「62 = 62」」（`:292`），行数增量仍 +1 ✓。 |
| 6 | 6 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | 新 §1.2 先例行（`:26`–`:31`）：「**最接近的先例（结构面）**：仓根 2026-10-26 读数 =」+ 对齐 `bin/` / `test/` + 「**偏离一（产物家）**」/「**偏离二（版本轴与统计）**」+ 不落 `test/` 的契约面理由 ✓。副作用见 New#15。 |
| 7 | 7 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | provider 条目改原语：`:208`「严格单发解析 `parseModelRef(ref, config.providers)`」+ `hasKey`；`:209` 写明为何不走 `resolveProviderPlan`、并点出「核注释 `:60`–`:61` 标「新码勿调」」；KD-4（`:319`）同步。坐标复核 `model-ref.mjs:33` / `:80` ✓。批档任务书行残留见 New#14。 |
| 8 | 8 | docs/core/design/PROMPT-FIXTURE.md | 🟡 | Fixed | B2（`:67`）「设计门（为何必须挡）：`find` 唯一性是「声明即差异」的前提」、B3（`:68`）、B9（`:74`）「设计门：一个 `generatedAt` 字段就让两次产物不等」；B4 / B6 / B8 同族一并改标 ✓。 |
| 9 | 9 | docs/core/design/PROMPT-FIXTURE.md | 🔵 | Fixed | `:377` 补「首版只装配 `SCENARIO_SLOT_FILES["engineering"]` 一个槽集」，并写「加槽集属夹具语义变化，须 bump `PROMPT_FIXTURE_VERSION`」✓。 |
| 10 | 10 | docs/core/design/PROMPT-FIXTURE.md | 🔵 | Fixed | 用例 #12 改「`--max-calls 2` 而预计上界 3」（`:366`），可由缺省推出（1×1×1×1×1×3）✓；触顶语义 `:226`「不设「中途停止」分支（真触顶即门算错，属夹具缺陷，抛错且不落档）」✓。算式本身见 New#13。 |
| 11 | 11 | docs/core/design/PROMPT-FIXTURE.md | 🔵 | Fixed | `:246` 写映射「`usage.prompt_tokens → prompt` / `usage.completion_tokens → completion`」+ null 口径；核坐标复核 `provider/core.mjs:331`–`:332` = `prompt_tokens:` / `completion_tokens:` ✓。 |
| 12 | (new) | docs/core/design/PROMPT-FIXTURE.md | 🟡 | New: V3 依据行坐标错 — `:80`「`:111`「nothing moves before the pick」⇒ 只问不动是合法落点」，但 `discipline-engineering.md:111` 实为「A light-channel pen = main-agent direct edit」；该句在同档 `:118`（grep 命中「nothing moves before the pick; subagents neither route nor invoke this channel」），语义另见 `persona-engineering.md:224`「**No pick ⇒ nothing moves**」。V1 的括注同病：「用户挑了才动」也挂 `:111`（实为 `:118`）。 | 改 `:111` → `:118`（V3 可并补 `persona-engineering.md:224`；V1 括注同理）。依据实体成立、复现路径也在，6b 不复发；但这是本轮新表里的错引，照坐标查会查不到。批档 `:208`–`:214` 已自记同一缺陷，尚待落地。 |
| 13 | (new) | docs/core/design/PROMPT-FIXTURE.md | 🟡 | New: 预算门算式量纲重复计场景 — `:226`「副本数 × 场景数 × 模型数 × N × Σ每场景（（1 + `followUps` 数）× `maxRounds`）」：Σ每场景已对场景求和，外层再乘「场景数」⇒ S 个场景时上界虚高 S 倍（2 场景各 `maxRounds` 3 ⇒ 真上界 6、算式给 12），`--max-calls` 本可跑却被误拒；v1 单场景读数 3 正确，用例 #12 碰不到。 | 删外层「场景数」，或写成「副本数 × 模型数 × N × Σ每场景(…)」；用例 #12 不变。 |
| 14 | (new) | docs/batches/2026-10-26-prompt-fixture.md | 🟡 | New: §2 任务书两行未被标作废 — 六问 #2 仍写「条目 = `loadConfig()`（`config.mjs:219`）→ `resolveRuntimeProvider(providers, ref)`（`model-ref.mjs:62`）」（`:319`），与设计档 `:208` 的 `parseModelRef` + `hasKey` 相抵；受影响文件表仍只写「改：§4 其余档清单登记本档，计数 39→40、分组计数 +1」（`:332`），缺 `:83` 对账行。修正轮 2 块（`:384` / `:382`）记了改动，但没点名这两行作废。 | R7b 设计档优先 ⇒ 跨档滞后，不阻塞：在修正轮 2 块补一句「§2 六问 #2 与受影响文件表的 `docs/README.md` 行以设计档为准」。另 `:369` 的「374 行」被 `:373` 的 392 取代，同样只差一句作废。 |
| 15 | (new) | docs/core/design/PROMPT-FIXTURE.md | 🔵 | New: `:37` 自称「本档不点名对方，对方档也不提及本夹具」，但 `:26` 的仓根读数点了「`.github` · `bench` · `bin` · `docs` · `scripts` · `test`」，`:340` AC-12 也含 `grep -r "bench/" prompt-fixture --include=*.mjs`。18:30 令禁的是引先例表 / 体例 / 常量，目录清单不构成引用；但自述句现在字面为假。 | `:37` 限定为「不引对方先例表 / 体例 / 常量」，或把目录读数写成「另 1 个其它跑批工具目录（按 18:30 令不点名）」。 |

计数：上轮 11 条（🔴 1 · 🟡 7 · 🔵 3）**全部 Fixed**；本轮 New 🔴 0 · 🟡 3 · 🔵 1。

**VERDICT: pass**

## §4 用户批准（主 agent）

**批准 = 设计评审第 3 轮 pass（`advisor` 10378f42 · 2026-10-26 19:31）**

## 评审读数

| 轮 | 结论 | 计数 |
|---|---|---|
| 1（初版 bench/prompt 方案） | changes-required | 🔴 2 · 🟡 7 · 🔵 1（第 1 条 🔴 经用户 18:29 裁定**撤销**；第 2 条 🔴 因 18:30「彻底分开」令**自然消解**）|
| 2（独立目录版） | changes-required | 🔴 1 · 🟡 7 · 🔵 3 |
| 3（修正轮后 392 行） | **pass** | 上轮 11 条**全部 Fixed** · New 🔴 0 · 🟡 3 · 🔵 1 |

## 用户授权链

| 时点 | 原话 | 覆盖 |
|---|---|---|
| 17:35 | 「我需要一个用来测试工程模式主agent提示词效果的夹具」 | 立项 |
| 17:37 | 「按照加载真实三档的副本来做测试，改前副本和改后副本…有效果才去真动正本」 | 副本法 |
| 17:39 | 「有效的门槛要等到我们具体要测试什么的时候才能确定」 | 不内置门槛 |
| 18:29 | 「这个跟 model-bench 没必要强关联吧？这是完全不同的两件事」 | 撤评审 #1 |
| 18:30 | 「你把这个夹具跟model-bench彻底分分开…不要互相拖累」 | 零复用 |
| 18:31 | 「这是完全独立的另一个工具，放在自己独立的目录里」 | 独立目录 |
| 19:08 / 19:22 | 「自动跑完吧」×2 | **整批令**：批内全链自动跑完 |
| 19:30 | 「不用再加了，40组足够多了」 | 停止加样本 |

## 批准覆盖范围

§2 现行任务书全部条目 + 15 档新文件 + `docs/README.md` 登记。**不覆盖**：3 条 🟡 与 1 条 🔵（New #12–#15）——实施轮不改设计档，收口轮由设计席处置。

## 实施轮不授权的事

- 不改 `thincoder-core/prompts/`（本批零改）
- 不改 `bench/**` / `MODEL-BENCH.md`
- 不改设计档 `PROMPT-FIXTURE.md`

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**状态行**：收口中

## 收口判词

**目标达成**：独立工具 `prompt-fixture/` 落地——从正本生成副本、机检零差异、按场景跑动作类结局、出带 95% 区间与 p 的对比报告；**不内置「有效」门槛**（用户 17:39 令），只产读数与差异。

**与 MODEL-BENCH 彻底分开**（用户 18:30 / 18:31 令）：独立顶层目录、零 `bench/**` import、零文档互引。

## 三机检读数（父侧亲跑，非采信报告）

| 项 | 命令 | 读数 |
|---|---|---|
| 批内单测（5 档） | `node --test prompt-fixture/test/{materialize,scenarios,stats,report,cli}.test.mjs` | **43 / 43 通过** · fail 0 |
| dry-run 全链 | `node prompt-fixture/run.mjs --dry-run --copies baseline,demo` | **exit 0** · stderr 空 · 回执 `baseline==master: 3/3 byte-equal` · `assembly == assemblePrompt("engineering"): byte-equal` · `variant demo: 1 edit · changed-lines == declared` · `budget: 6 upper bound / 200 allowed` · `runs: 2 · model calls: 4 · errored runs: 0` |
| 三档字符数 | 同上回执 | **67,515 / 53,771 / 45,726** = 167,012（设计档数值经实测确认，评审 3 轮标 `unverified` 的那项现已落实）|

## 设计偏离（4 条，实施席明示）

| # | 偏离 | 理由 |
|---|---|---|
| ① | 多出 `checks.mjs` / `variants.mjs` / `dryrun.mjs` | 设计档同时要求「单档 ≤ 250 行」——未拆前 `materialize.mjs` 353 行、`run.mjs` 285 行 |
| ② | dry-run 回放游标取「场景内 run 序号」而非「repeat 游标」 | 否则 `--copies baseline,demo` 的 Δ 列恒为 0 |
| ③ | provider spec 取裸模型名 `provider.model` | 传 `provider:model` 复合串恒不命中前缀表、拿不到 `reasoningEcho` |
| ④ | `docs/README.md` 对账行写实测 `64 = 62 + 待补登 2` | 写设计档字面的 `62 = 62` 会是假账 |

**④ 已失效**：该档改动被父侧撤销（见下方待裁 1），本批不碰地图。

## 评审 15 条处置

| 轮 | 条目 | 处置 |
|---|---|---|
| 1 | 🔴1 KD-45 冲突 | **用户 18:29 裁定撤销**（KD-45 讲探针面记提示词版本，非全项目方法裁决）|
| 1 | 🔴2 `delegated` 不可达 | **用户 18:30「彻底分开」令自然消解**（工具面自定，不受 `builtinTools` 限制）|
| 1 | 🟡3–🟡9 · 🔵10 | 全处置 |
| 2 | 🔴1 分支依据缺失 | 修正轮 ①+② 并用（V1–V3 + 检索记录）|
| 2 | 🟡2–🟡8 · 🔵9–🔵11 | 全处置 |
| 3 | 上轮 11 条 | **全 Fixed** |
| 3 | New 🟡12 V3 坐标错 · 🟡13 预算算式 · 🟡14 批档行滞后 · 🔵15 点名自述 | **转设计档收正**（见待裁 2）|

## 待裁三项

| # | 项 | 处置 |
|---|---|---|
| 1 | `docs/README.md` 158 条裸名锚（**既有问题**，非本批引入） | **本批不碰**：`git checkout` 撤销登记改动；已记台账 `#1818`（归批）|
| 2 | 设计档三处待收正（`PROMPT-FIXTURE.md:224` 回放游标措辞 · `:226` 预算算式外层多乘场景数 · §2.1/§3 补三档 + 对账行） | **转下批**（设计档面，非实施笔域）；评审 New 🟡12/13/14/15 一并 |
| 3 | §5 未写入（文档门拒） | **§5 豁免**（收口门只要求 §2/§3/§4/§6）；实施读数已在本段第 2 节完整登记 |

## D7 结算同步清单

| 项 | 结果 |
|---|---|
| §2 ↔ 设计档对账 | 4 条设计偏离全部明示；设计档三处待收正已转下批 |
| 前批遗留交叉核对 | `#1812` 收口门批已收口核销 |
| 修正轮落地前置 | 评审 3 轮闭环，pass 后派实施 |
| 缓办清单复核 | 无 |
| 暂缓批复核 | 无 |
| 用户文档面同步 | 无用户可见能力变更（内部工程工具）|
| 文档门 | **本批笔域集 = `prompt-fixture/**`（文档面 0 档）**——`docs/README.md` 已撤销、设计档非本批笔域 ⇒ 门无对象可判 |
| 台账核销 | `#1816` → 已核销；`#1817`（`unsettled` 拆档）· `#1818`（地图 158 条）留账 |

## 账外（本批未做）

| 项 | 归属 |
|---|---|
| **未跑 live**：无真实 provider 调用，`results/` 落档对与真 `chat` 路径未执行 | 使用者首次实跑时验；`--max-calls 200` / `--call-timeout-ms 180000` 是设计自定预算，非用户数值 |
| 单测档 5 处收口删除 | 本段落盘后执行 |

## 教训

**这批的价值不在工具本身，在它证明了「改提示词之前可以量」。**

三轮评审砍掉的每一条，都是「我以为」变成「读出来」：
- 第 1 轮我判 KD-45 冲突 → 用户一句「两件事」指出我读错射程
- 第 2 轮判分支依据缺失 → 修正轮交出 V1–V3 + **检索记录**（grep 无原话，如实写「不引不存在的原话」）
- 实施席自己揪出题面里 `MAX_TURNS_DEFAULT` **全仓不存在**

**最后一条最像这批的注脚**：一个用来验证提示词的工具，自己先被验证了一遍。
