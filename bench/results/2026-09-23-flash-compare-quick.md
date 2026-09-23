# 模型基准报告 · flash-compare-quick · 2026-09-23

> 本报告由 `bench/run.mjs` 自动生成；数据源 = 同 basename 的结果 JSON（`bench/results/`）。

## 概览

- 报告标签：`flash-compare-quick` ｜ 日期：2026-09-23 ｜ 题集版本：suiteVersion = 1
- 时点：2026-09-23T23:48:19+08:00 ~ 2026-09-23T23:49:00+08:00
- 价格表：asOf 2026-09-23 · CNY · 元 / 百万 token
- 运行参数：重复 --n 1 · maxTokens 4096 · timeout 120s · temperature 0 · 报告轴 speed + cost

| 模型 | provider | model | 维度面 | 通过率 | 备注 |
| --- | --- | --- | --- | --- | --- |
| mimo-v2.6-flash | mimo | mimo-v2.6-flash | 推理 | 3/3（100%） | — |
| deepseek-flash | deepseek | deepseek-flash | 推理 | 3/3（100%） | 峰谷定价（成本表取高峰档） |
| glm-5.3-flash | zhipu-plan | glm-5.3-flash | 推理 | 3/3（100%） | 多模态（usage 实测正常） |
| qwen3.8-flash | qwen | qwen3.8-flash | 推理 | 3/3（100%） | 多模态 |

## 方法

套件口径冻结（五口径；任一变化 ⇒ suiteVersion +1，跨版本不严格可比）：

1. 题集：题面与用例逐字冻结（含隐藏用例）；版本标识 = suiteVersion。
2. 判分：机器判分为主；判据 = 冻结断言（数字比对 / vm 实跑 + 隐藏断言 / 整串 JSON / 工具结构 / 文本约束 / 词表）。人工 lane 只记录不判分。
3. 计时：TTFT = 首个非空 delta 到达 − 调用发起；tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)；token 只认 usage 精确值，缺记 null（不估算）。
4. 报告：报告对（md + json）同 basename，md 完全由结果 JSON 渲染；同骨架跨模型/跨时点可比。
5. 价格：单价只住 prices.json（asOf + source 可回溯）；成本 = 未缓存输入 × input + 缓存命中 × cachedInput + 输出 × output。

- 复现命令：`node bench/run.mjs --models mimo-v2.6-flash,deepseek-flash,glm-5.3-flash,qwen3.8-flash --dims reasoning --label flash-compare-quick`
- 套件版本：suiteVersion = 1（题集/判据/计时口径任一变化 +1，跨版本不严格可比）
- 工具链：模型调用经核 provider 路径（thinking / reasoningEffort 等参数取用户配置原值）；temperature = 0；多轮工具链跨轮合计计时。
- 重算产物：由 `refresh-src.json` 于 2026-09-24T01:04:15+08:00 重出（成本按当前 prices.json 重算；原档不动）。

## 结果

### 能力矩阵

单元格 = 通过用例数 / 该模型在该维的用例数（用例判定：N 次全过 = pass）；`—` = 不在该模型面；**按合计通过数降序**。

| 模型 | 推理 | 合计 |
| --- | --- | --- |
| deepseek-flash | 3/3 | 3/3 |
| glm-5.3-flash | 3/3 | 3/3 |
| mimo-v2.6-flash | 3/3 | 3/3 |
| qwen3.8-flash | 3/3 | 3/3 |

### 速度表

只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）；**按 TTFT 中位升序（缺数据者居末）**。

| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |
| --- | --- | --- | --- | --- |
| deepseek-flash | 458 ms | 219.2 | 1357 ms | 3 |
| qwen3.8-flash | 524 ms | 65.9 | 2871 ms | 3 |
| glm-5.3-flash | 849 ms | 51.9 | 4341 ms | 3 |
| mimo-v2.6-flash | 1286 ms | 63.2 | 2046 ms | 3 |

### 成本表

总成本 = Σ 成功返回的 call 成本；每任务成本 = 总成本 ÷ 任务数（该模型面内的用例数）；每通过任务成本 = 总成本 ÷ 通过任务数（用例判定 N 次全过 = pass）；**相对成本 = 每通过任务成本 ÷ 表内最低者（最低 = 1×，直接读倍数）**；**按每通过任务成本升序（最便宜居首 = 1.0×）**。

| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 |
| --- | --- | --- | --- | --- |
| mimo-v2.6-flash | ¥0.000511 | ¥0.00017 | ¥0.00017 | 1.0× |
| qwen3.8-flash | ¥0.001468 | ¥0.000489 | ¥0.000489 | 2.9× |
| glm-5.3-flash | ¥0.002757 | ¥0.000919 | ¥0.000919 | 5.4× |
| deepseek-flash | ¥0.004872 | ¥0.001624 | ¥0.001624 | 9.5× |

- 计费口径：单价以 prices.json 为准（asOf 2026-09-23；逐条出处以条目级 source 可回溯）。

### 逐维明细

成本列为该用例代表 run 的调用成本；**相对成本 = 该用例内最低者 = 1×**。

#### 推理（`reasoning`）

**reasoning.1** · 正常

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 | 相对成本 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mimo-v2.6-flash | ✅ pass 1/1 | 1286 ms | 63.2 | 2046 ms | 28/0/48 | ¥0.000124 | 1.0× |
| deepseek-flash | ✅ pass 1/1 | 712 ms | 206 | 1013 ms | 49/0/62 | ¥0.000594 | 4.8× |
| glm-5.3-flash | ✅ pass 1/1 | 1064 ms | 51.9 | 4341 ms | 31/0/170 | ¥0.000501 | 4.0× |
| qwen3.8-flash | ✅ pass 1/1 | 516 ms | 66.3 | 1979 ms | 81/0/97 | ¥0.000327 | 2.6× |

- 响应摘要 · mimo-v2.6-flash：`3`
- 响应摘要 · deepseek-flash：`3`
- 响应摘要 · glm-5.3-flash：`3`
- 响应摘要 · qwen3.8-flash：`3`

**reasoning.2** · 边界

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 | 相对成本 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mimo-v2.6-flash | ✅ pass 1/1 | 1215 ms | 131.5 | 2348 ms | 28/0/149 | ¥0.000326 | 1.0× |
| deepseek-flash | ✅ pass 1/1 | 458 ms | 250.3 | 1357 ms | 49/0/225 | ¥0.001898 | 5.8× |
| glm-5.3-flash | ✅ pass 1/1 | 762 ms | 54.6 | 3693 ms | 29/0/160 | ¥0.000471 | 1.4× |
| qwen3.8-flash | ✅ pass 1/1 | 772 ms | 65.9 | 4337 ms | 82/0/235 | ¥0.0007 | 2.1× |

- 响应摘要 · mimo-v2.6-flash：`371281`
- 响应摘要 · deepseek-flash：`371281`
- 响应摘要 · glm-5.3-flash：`371281`
- 响应摘要 · qwen3.8-flash：`371281`

**reasoning.3** · 错误

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 | 相对成本 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mimo-v2.6-flash | ✅ pass 1/1 | 1666 ms | 58 | 1959 ms | 27/0/17 | ¥0.000061 | 1.0× |
| deepseek-flash | ✅ pass 1/1 | 452 ms | 219.2 | 1752 ms | 50/0/285 | ¥0.00238 | 39.0× |
| glm-5.3-flash | ✅ pass 1/1 | 849 ms | 48.7 | 13733 ms | 33/0/628 | ¥0.001785 | 29.3× |
| qwen3.8-flash | ✅ pass 1/1 | 524 ms | 59.2 | 2871 ms | 82/0/139 | ¥0.000441 | 7.2× |

- 响应摘要 · mimo-v2.6-flash：`3 × 3 = 9`
- 响应摘要 · deepseek-flash：`9=3×3`
- 响应摘要 · glm-5.3-flash：`9 = 3 × 3`
- 响应摘要 · qwen3.8-flash：`9 = 3 × 3`

### 人工判读

本节未运行（本轮 `--dims` 未包含 `manual`）。

## 关键发现

- 能力通过率：首位 mimo-v2.6-flash（3/3，100%）；末位 qwen3.8-flash（3/3，100%）。
- 速度：TTFT 中位最小 deepseek-flash（458 ms）；tok/s 中位最大 deepseek-flash（219.2）。
- 成本：每通过任务成本最低 mimo-v2.6-flash（¥0.00017）。
- 数据告警：usage 缺失 run 0 个 · 成本缺失 run 0 个 · 价格未录 0 条 · error 0 次 · 限流等待（throttled）0 次。

## 局限声明

- 单次采样、无置信区间（`--n` > 1 时取中位，仍不做统计显著性检验）。
- 闭集判据不覆盖开放式质量（机器判分只表达「是否满足该维度的冻结判据」）。
- 人工 lane 不判分（中文歧义质量需人工阅读；不进能力矩阵与成本归一化）。
- 价格手动维护（以 prices.json 的 asOf / source 为准；厂商调价后需人工更新并 `--recompute` 重出报告）。
- 同模型跨渠道差异（baseURL / 网关不同 ⇒ 结果只对本次运行所用渠道成立）。
- 速度受服务端负载影响（TTFT / tok/s 为观测值，非服务端承诺）。
- V1 未覆盖面：不做广谱知识题 / 容器级任务 / LLM-as-judge 主观打分。

## 附录

### 复跑命令

```bash
node bench/run.mjs --models mimo-v2.6-flash,deepseek-flash,glm-5.3-flash,qwen3.8-flash --dims reasoning --label flash-compare-quick
node bench/run.mjs --recompute --from bench/results/2026-09-23-flash-compare-quick.json
```

### 结果指针

- `bench/results/2026-09-23-flash-compare-quick.json`（本报告的原始数据；跨时点对比 = 两份报告对并列，suiteVersion 相同 = 严格可比）
