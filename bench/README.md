# bench — 模型基准测试套件

统一题集 + 判分器 + 速度/成本报告：一次建设、长期沿用。此后一切模型性能测试走同一标准
（能力 × 速度 × token 消耗 × 价格）。

设计档 = `docs/core/design/MODEL-BENCH.md`（本目录的实现以它为准；README 只讲怎么用）。

## 快速开始

```bash
# 全量跑（清单全量 · 8 自动维 + 人工 lane · 三轴全出）
node bench/run.mjs

# 子集：两台模型 × 推理维
node bench/run.mjs --models deepseek-flash,glm-5.3-flash --dims reasoning

# 速度轴建议 3 次重复（取中位）
node bench/run.mjs --models deepseek-flash --n 3 --label speed-3x

# 自检（不调模型、不读用户 config；跑通判分→指标→报告→脱敏链路）
# 注：自检里 longctx.2 夹具刻意回干扰值 ⇒ 产出固定含 1 例 FAIL（覆盖失败渲染路径），其余全绿
node bench/run.mjs --dry-run --label selfcheck

# 价格更新后离线重算（零 API 调用）
node bench/run.mjs --recompute --from bench/results/2026-09-23-smoke.json
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

**退出码**：`0` = 跑完（模型用例失败不影响退出码——失败是数据不是错误）· `1` = 基建错误
（参数错 / 未知模型 / provider 缺配置 / 数据档不合 schema / 同名产物已存在）· `130` = SIGINT（不落档）。

**覆盖保护**：目标文件已存在 → 拒写（留档不可被静默覆盖）；删旧档 = 人工显式动作。

## 五口径冻结（统一标准的核心）

1. **题集**：题面与用例逐字冻结（含隐藏用例）；`SUITE_VERSION`（整数）为版本标识。
2. **判分**：机器判分为主；人工项只记录不判分（独立 lane，不阻塞自动判分）。
3. **计时**：TTFT = 首个**非空** delta 到达 − 调用发起；`tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)`；
   token 只认 `usage` 精确值——缺即 `null`（**delta 近似禁用**）。
4. **报告**：报告对（md + json）同 basename；md 完全由结果 JSON 渲染 ⇒ 两档恒一致、同骨架跨时点可比。
5. **价格**：单价只住 `prices.json`（`asOf` + `source` 必标）；成本 = 未缓存输入 × `input` + 缓存命中 × `cachedInput` + 输出 × `output`。

任一变化（题面 / 判据 / 计时口径）⇒ `SUITE_VERSION + 1`（`bench/cases/index.mjs`），跨版本不严格可比；
**价格变动不 bump 版本号**（另记 `prices.asOf`）。

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
- **成本表**：总成本 = Σ 成功返回的 call；每任务成本 = 总成本 ÷ 任务数；每通过任务成本 = 总成本 ÷ 通过任务数。
  价格未录 / `usage` 缺失 → `—` + 脚注（**不估算**）。
- **逐维明细**：每用例 × 模型：判定（`k/N`）+ 关键指标 + 响应摘要（≤300 字符，不存全文）。
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

**`bench/prices.json`（价格表 · 手动维护）**：单位 = 元 / 百万 token；对齐键 = `provider:model`。

- `input` / `output` 必填（缺或非数字 → 装载即拒：半截价格不得录入；相对口径不得转写为数字）；
  `cachedInput` 缺省 ⇒ 缓存 token 按 `input` 计。
- 每条须可回溯（`asOf` + `source`；条目级可覆盖表级）；匹配 = 精确优先，通配（`*`）按字面段长度降序。

## 边界（不做）

- 不做 LLM-as-judge 主观打分；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做广谱知识题。
- 不自动定时跑；不自动抓取价格（手动维护，来源必标）。
- 不存模型完整原始响应（只存 ≤300 字符摘要）；不做跨时点 diff 工具；不做汇率换算。
- 不进 CI / 发布门 / 三端产物白名单；`bench/test/*.test.mjs` 手动跑（`node --test bench/test/*.test.mjs`）。
- `bench/results/` 存报告对留档（**入库**）；`--dry-run` 产物为夹具自检，非真实测量（命令串里可见 `--dry-run`）。

## 目录

```text
bench/
  run.mjs            CLI 入口（解析 / 退出码 / dry-run 内联夹具表）
  models.json        参测清单（配置文件）
  prices.json        价格表（手动维护 · asOf + source）
  cases/             题集（一维度一档 + 注册表 index.mjs = SUITE_VERSION）
  lib/               判分器族 / 计时聚合 / 价格 / 清单 / 落档脱敏 / 长文与 PNG 生成 / 编排
  test/              自检（手动跑，不进 CI）
  results/           报告对留档（<日期>-<标签>.{md,json}）
```
