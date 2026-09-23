# bench — 模型基准测试套件

统一题集 + 判分器 + 速度/成本报告：一次建设、长期沿用。此后一切模型性能测试走同一标准
（能力 × 速度 × token 消耗 × 价格）。

判分 = **混合三层**：确定性断言（机器）· **判官对（A / B 双判 · LLM）**——分歧经第三判仲裁 ·
**机械 fail 复核**（第二只眼，不自动改判）。判官配置 = `bench/judge.json`（**必备**）。

设计档 = `docs/core/design/MODEL-BENCH.md`（本目录的实现以它为准；README 只讲怎么用）。

## 快速开始

```bash
# 子集跑（推荐形态：判官独立性闸门的常规姿态——显式给被测集）
node bench/run.mjs --models mimo-v2.6-flash,glm-5.3-flash,qwen3.8-flash

# 只跑某几维
node bench/run.mjs --models mimo-v2.6-flash,glm-5.3-flash --dims reasoning

# 速度轴建议 3 次重复（取中位）
node bench/run.mjs --models glm-5.3-flash --n 3 --label speed-3x

# 自检（不调模型、不读用户 config；跑通判分（含判官对 / 仲裁 / 复核夹具）→指标→报告→脱敏链路）
# 注：自检夹具刻意布置——longctx.2 回近邻干扰值（机械 FAIL + 复核 uphold）、tools.3 回中文数字
#     「十二个月」（机械 FAIL + 复核 **翻案**）、multiturn.2 A / B 刻意分歧（触发第三判仲裁）、
#     longctx.3 A 位两次不可解析（判官不可用 ⇒ run error）——四类路径固定覆盖
node bench/run.mjs --dry-run --label selfcheck

# 价格更新后离线重算（零 API 调用；判官 / 复核成本随当前 prices.json 一并重算）
node bench/run.mjs --recompute --from bench/results/2026-09-24-flash-compare-v3.json
```

| 参数 | 语义 | 缺省 |
|---|---|---|
| `--models` | 参测模型（逗号分隔）：条目 = `models.json` 的 `label`，或 `provider:model` 复合引用；未在册 → 报错退出（列在册名单） | 清单全量 |
| `--dims` | 选择器（逗号分隔）：`capability` / 各维度键 / `manual` / `speed` / `cost`——能力项决定**跑什么**，`speed`/`cost` 决定**出什么轴**。例：`--dims capability,speed,cost` = 8 自动维 + 三轴全出；`--dims reasoning` = 只跑推理维（轴缺省全出）；`--dims speed,cost` = 跑 8 自动维 + **只出**速度/成本表；`manual`（人工 lane）不随 `capability` 或轴选择自动上位——需显式点名，或整个 `--dims` 不给（缺省全跑） | 全跑（8 自动维 + 人工 lane）+ 全轴 |
| `--label` | 报告文件名标签（`<日期>-<标签>.{md,json}`） | `run`（重算 = `<原标签>-recalc`） |
| `--n` | 每例重复次数（速度轴建议 3） | 1 |
| `--max-tokens` | 单次调用输出上限（可比性冻结面） | 4096 |
| `--timeout` | 单次调用墙钟上限（秒） | 120 |
| `--dry-run` | 夹具自检：不调模型、不读用户 config | 关 |
| `--recompute --from` | 离线重算（读已有结果 JSON，按**当前** `prices.json` 重出报告） | —— |

**判官独立性约束对被测集的约束**：当前判官 A 位 = `deepseek:deepseek-flash` ⇒ 该键 ∈ 被测集时**拒跑**（fail-closed）。
`models.json` 仍保留 `deepseek-flash` 条目（候参清单不因判官配置删条）⇒ **缺省「清单全量」跑会被闸门拒跑**（报错点名位次与冲突条目）；
两种处置：① 显式给 `--models`（如上行三模型，排除该条目）；② 换判官三槽（改 `bench/judge.json` 并同步 `frozenAtSuiteVersion` + bump `SUITE_VERSION`）。

**退出码**：`0` = 跑完（模型用例失败不影响退出码——失败是数据不是错误）· `1` = 基建错误
（参数错 / 未知模型 / provider 缺配置 / 数据档不合 schema / **判官配置缺或不合 / 判官独立性违约 /
判官对身份违约 / 冻结版本不匹配 / 本轮判官面全灭** / 同名产物已存在）· `130` = SIGINT（不落档）。

**覆盖保护**：目标文件已存在 → 拒写（留档不可被静默覆盖）；删旧档 = 人工显式动作。

## 五口径冻结（统一标准的核心）

1. **题集**：题面与用例逐字冻结（含隐藏用例）；`SUITE_VERSION`（整数）为版本标识。
   逐维明细先列**题面**（`cases[].prompt` 正本逐字；构造型用例含载荷括注、载荷不入档），便于只看回答即可判读。
2. **判分**：**混合三层**——① 确定性断言（数字独立成词 / vm 实跑 + 隐藏断言 / 整串 JSON / 工具结构 / 语法级文本约束）；
   ② **语义·语用面 = 判官对（A / B 双判 · 各自独立于被测 · 同一冻结 rubric）**，分歧样本经**第三判（仲裁 C）多数决**
   （合成无多数 ⇒ 该 run `error`——禁猜 / 不补位 / 不单判回退）；③ **机械 fail = 复核**（LLM 第二只眼 · **不自动改判**）。
   人工项只记录不判分（独立 lane，不阻塞自动判分）。**词表 / 正则不再充当语义判据**。
3. **计时**：TTFT = 首个**非空** delta 到达 − 调用发起；`tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)`；
   token 只认 `usage` 精确值——缺即 `null`（**delta 近似禁用**）。
4. **报告**：报告对（md + json）同 basename；md 完全由结果 JSON 渲染 ⇒ 两档恒一致、同骨架跨时点可比。
5. **价格**：单价只住 `prices.json`（`asOf` + `source` 必标）；成本 = 未缓存输入 × `input` + 缓存命中 × `cachedInput` + 输出 × `output`。

任一变化（题面 / 判据 / rubric / **任一位判官身份（A / B / 仲裁 C）** / 提示模板 / 计时口径）⇒ `SUITE_VERSION + 1`
（`bench/cases/index.mjs`；判官侧机检闸 = `judge.json.frozenAtSuiteVersion`），跨版本不严格可比；
**价格变动不 bump 版本号**（另记 `prices.asOf`）。

## 判官与复核（配置 · 口径）

**`bench/judge.json`（必备）**：`judges`（**恰 2 位 = A / B**，位序定身份）+ `arbiter`（**仲裁 C · 必备**）。
每位 = `provider`（用户 config 的渠道名）/ `model` / `maxTokens`（[1024, 8192]）/ `timeoutSec`（[5, 120]，
`temperature` 冻结 0）；`frozenAtSuiteVersion` 须 === `SUITE_VERSION`。**缺文件 / 不合 schema / 不在用户 config ⇒ 拒跑**。

- **独立性（逐位）**：任一位的 `provider:model` ∈ 本次被测集合 ⇒ **拒跑**（判分器不得判自己的输出）；
  同渠道异模型 ⇒ 允许但该位 `sameVendorAsTested = true` + 告警 + 报告判官行明示。**A ≠ B**、**仲裁员 ≠ A / B**（模型字面机检）。
- **调用面**：A / B **并行**独立裁决（同一份三段素材：题面 / 冻结 rubric / 该回合响应——含该回合工具调用事实）；
  相异 ⇒ 触发 C（串行依赖步）· 多数决。解析失败 ⇒ 放大预算重试一次（×2 · 上限 8192）；两位不可解析 / 超时 / 传输错 ⇒ 该位 `error`（禁猜）。
- **复核**：仅机械 fail（非判官裁决）触发一次 LLM 复核（单判 · 沿 A 位）；`uphold` ⇒ fail 维持；
  `overturn` = **复核翻案**——**不自动改判**（仍在 fail、不计 pass），处置 = 修题面 / 判据（`SUITE_VERSION + 1`）。
- **成本**：判官（×2 · 分歧 ×3）与复核成本**单列两列**（成本表 + 概览）——**不进被测成本与相对成本归一化**；
  单价同源 `prices.json`（按各判官位的 `provider:model` 匹配；缺价 ⇒ `null` + 警告，不阻断运行）。

## 复跑工作流（三场景）

| 场景 | 命令形态 | 行为 |
|---|---|---|
| **全量复跑**（模型对比） | `--models <列表> --label <标签>` | 常规运行 → 报告对 |
| **子集复跑**（只看部分维度） | `--models <列表> --dims <维度列表>` | 只跑选中维度；报告轴缺省全出 |
| **零 API 复跑**（价格更新 / 重排报告） | `--recompute --from <结果.json>` | 读入结果 JSON → 以当前价格重算 → 落新报告对；**不调模型、不重判分、不触网** |

**何时复跑**：新模型上架（改 `models.json` 后全量跑）· 模型换代（同 label 重跑，对比两份报告对）·
价格调整（改 `prices.json` 后 `--recompute`）· 定期回归（按需 `--n 3`）。

**跨时点对比须知**：两份报告对并列人工比对即可（V1 不做 diff 工具）。`suiteVersion` 相同 = 严格可比；
版本不同 = 注明口径变更（题面/判据/计时改过）。价格变化另看 `prices.asOf`。

## 结果解读

- **能力矩阵**：模型 × 维度 → 通过用例数 / 该维用例数。用例判定 = `--n` 次**全过**才记 pass（表达「稳定具备」）；
  `—` = 不在该模型面（`models.json` 的 `dims` / `skipDims`）或本轮未选该维。
- **速度表**：只取正常返回的 run（pass/fail），逐 run 取值后取中位；`—` = 数据缺失（不按 0 计）。
- **成本表**：总成本 = Σ 成功返回的 call；每任务成本 = 总成本 ÷ 任务数；每通过任务成本 = 总成本 ÷ 通过任务数；
  **相对成本** = 每通过任务成本 ÷ 表内最低者（直接读倍数）；**判官成本**（= A / B / 仲裁 C 三位合计）与**复核成本**单列两列，
  不参与相对成本归一化也不进被测成本。价格未录 / `usage` 缺失 → `—` + 脚注（**不估算**）。
- **逐维明细**：每用例先列**题面**（≤300 字符，超限截断 `…`），随后每用例 × 模型：判定（`k/N`，
  分歧样本加 `⇄`、复核翻案加 `⟲`）+ 关键指标 + 成本 + 相对成本 + 响应摘要（≤300 字符，不存全文）+ **判官理由行** / **复核行**。
- **判官分歧 / 复核翻案**两小节：分歧逐条列 A / B（触发时 +C）裁决与理由；翻案逐条列机械失败断言与复核理由（判据演进线索）。
- **人工判读**：中文歧义 lane 逐条并列（题面 + 摘要 + 指标 + 单项成本）；不判分、不入矩阵与成本归一化。
- **关键发现**：只由数据 + 固定句式生成（名次/极值/计数），禁主观评价词。

## 维护

**`bench/models.json`（参测清单）**：增删模型 = 编辑此档，不改代码。

```json
{ "label": "mimo-v2.6-flash", "provider": "mimo", "model": "mimo-v2.6-flash",
  "dims": null, "skipDims": null, "note": "" }
```

- `provider` = 用户 `~/.thincoder/config.json` 的 `providers[].name`（**只存名字，密钥只住用户 config**）；
  条目 provider 不在 config → 运行报错退出（缺失名单点名）。
- `dims`（白名单）/ `skipDims`（黑名单）：限定/跳过该模型的维度；两者同给 = 先白后黑。
- 调模型经**核 provider 路径**（`thinking` / `reasoningEffort` 等取用户配置原值；`temperature = 0`、
  `maxTokens` 与 `.model` 由本轮参数覆写）⇒ 请求构造即产品真实所见。

**`bench/judge.json`（判官配置）**：换判官 / 模板 / rubric ⇒ **`SUITE_VERSION + 1`** 并同步 `frozenAtSuiteVersion`（否则拒跑）。
三槽选型纪律：三槽取实质不同模型（同模型异名机检不可判）；判官模型宜取跨厂商强模型（第二 / 第三视角）。

**`bench/prices.json`（价格表 · 手动维护）**：单位 = 元 / 百万 token；对齐键 = `provider:model`。

- `input` / `output` 必填（缺或非数字 → 装载即拒：半截价格不得录入；相对口径不得转写为数字）；
  `cachedInput` 缺省 ⇒ 缓存 token 按 `input` 计。
- 每条须可回溯（`asOf` + `source`；条目级可覆盖表级）；匹配 = 精确优先，通配（`*`）按字面段长度降序。

## 边界（不做）

- 不做开放式质量主观打分（判官只裁冻结 rubric 的语义判定）；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做广谱知识题。
- 复核翻案不自动改判；判官对的同向误判不设外部复核；不另立判据演进清单档（证据面 = 报告小节）。
- 不自动定时跑；不自动抓取价格（手动维护，来源必标）。
- 不存模型完整原始响应（只存 ≤300 字符摘要）；不做跨时点 diff 工具；不做汇率换算。
- 不进 CI / 发布门 / 三端产物白名单；`bench/test/*.test.mjs` 手动跑（`node --test bench/test/*.test.mjs`）。
- `bench/results/` 存报告对留档（**入库**）；`--dry-run` 产物为夹具自检，非真实测量（命令串里可见 `--dry-run`）。

## 目录

```text
bench/
  run.mjs            CLI 入口（解析 / 退出码 / dry-run 内联夹具表（含判官对 / 仲裁 / 复核脚本））
  models.json        参测清单（配置文件）
  prices.json        价格表（手动维护 · asOf + source）
  judge.json         判官配置（判官对 A / B + 分歧仲裁 C · 必备）
  cases/             题集（一维度一档 + 注册表 index.mjs = SUITE_VERSION）
  lib/               判分器族 / 判官与复核 / 计时聚合 / 价格 / 清单 / 落档脱敏 / 长文与 PNG 生成 / 编排 / 重算 / 落档 / 报告
  test/              自检（手动跑，不进 CI）
  results/           报告对留档（<日期>-<标签>.{md,json}）
```
