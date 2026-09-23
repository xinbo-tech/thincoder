# 模型基准报告 · smoke-deepseek-reasoning · 2026-09-23

> 本报告由 `bench/run.mjs` 自动生成；数据源 = 同 basename 的结果 JSON（`bench/results/`）。

## 概览

- 报告标签：`smoke-deepseek-reasoning` ｜ 日期：2026-09-23 ｜ 题集版本：suiteVersion = 1
- 时点：2026-09-23T23:27:02+08:00 ~ 2026-09-23T23:27:06+08:00
- 价格表：asOf 2026-09-23 · CNY · 元 / 百万 token
- 运行参数：重复 --n 1 · maxTokens 4096 · timeout 120s · temperature 0 · 报告轴 speed + cost

| 模型 | provider | model | 维度面 | 通过率 | 备注 |
| --- | --- | --- | --- | --- | --- |
| deepseek-flash | deepseek | deepseek-flash | 推理 | 3/3（100%） | 峰谷定价（成本表取高峰档） |

## 方法

套件口径冻结（五口径；任一变化 ⇒ suiteVersion +1，跨版本不严格可比）：

1. 题集：题面与用例逐字冻结（含隐藏用例）；版本标识 = suiteVersion。
2. 判分：机器判分为主；判据 = 冻结断言（数字比对 / vm 实跑 + 隐藏断言 / 整串 JSON / 工具结构 / 文本约束 / 词表）。人工 lane 只记录不判分。
3. 计时：TTFT = 首个非空 delta 到达 − 调用发起；tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)；token 只认 usage 精确值，缺记 null（不估算）。
4. 报告：报告对（md + json）同 basename，md 完全由结果 JSON 渲染；同骨架跨模型/跨时点可比。
5. 价格：单价只住 prices.json（asOf + source 可回溯）；成本 = 未缓存输入 × input + 缓存命中 × cachedInput + 输出 × output。

- 复现命令：`node bench/run.mjs --models deepseek-flash --dims reasoning --label smoke-deepseek-reasoning`
- 套件版本：suiteVersion = 1（题集/判据/计时口径任一变化 +1，跨版本不严格可比）
- 工具链：模型调用经核 provider 路径（thinking / reasoningEffort 等参数取用户配置原值）；temperature = 0；多轮工具链跨轮合计计时。

## 结果

### 能力矩阵

单元格 = 通过用例数 / 该模型在该维的用例数（用例判定：N 次全过 = pass）；`—` = 不在该模型面。

| 模型 | 推理 | 合计 |
| --- | --- | --- |
| deepseek-flash | 3/3 | 3/3 |

### 速度表

只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）。

| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |
| --- | --- | --- | --- | --- |
| deepseek-flash | 513 ms | 240 | 1109 ms | 3 |

### 成本表

总成本 = Σ 成功返回的 call 成本；每任务成本 = 总成本 ÷ 任务数（该模型面内的用例数）；每通过任务成本 = 总成本 ÷ 通过任务数（用例判定 N 次全过 = pass）。

| 模型 | 总成本 | 每任务成本 | 每通过任务成本 |
| --- | --- | --- | --- |
| deepseek-flash | ¥0.003784 | ¥0.001261 | ¥0.001261 |

- 计费口径：单价以 prices.json 为准（asOf 2026-09-23；逐条出处以条目级 source 可回溯）。

### 逐维明细

#### 推理（`reasoning`）

**reasoning.1** · 正常

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 |
| --- | --- | --- | --- | --- | --- | --- |
| deepseek-flash | ✅ pass 1/1 | 513 ms | 240 | 963 ms | 49/0/108 | ¥0.000962 |

- 响应摘要 · deepseek-flash：`3`

**reasoning.2** · 边界

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 |
| --- | --- | --- | --- | --- | --- | --- |
| deepseek-flash | ✅ pass 1/1 | 598 ms | 255 | 1296 ms | 49/0/178 | ¥0.001522 |

- 响应摘要 · deepseek-flash：`371281`

**reasoning.3** · 错误

| 模型 | 判定 | TTFT | tok/s | 总耗时 | tokens 入/缓/出 | 成本 |
| --- | --- | --- | --- | --- | --- | --- |
| deepseek-flash | ✅ pass 1/1 | 416 ms | 216.5 | 1109 ms | 50/0/150 | ¥0.0013 |

- 响应摘要 · deepseek-flash：`3×3`

### 人工判读

本节未运行（本轮 `--dims` 未包含 `manual`）。

## 关键发现

- 能力通过率：首位 deepseek-flash（3/3，100%）；末位 deepseek-flash（3/3，100%）。
- 速度：TTFT 中位最小 deepseek-flash（513 ms）；tok/s 中位最大 deepseek-flash（240）。
- 成本：每通过任务成本最低 deepseek-flash（¥0.001261）。
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
node bench/run.mjs --models deepseek-flash --dims reasoning --label smoke-deepseek-reasoning
node bench/run.mjs --recompute --from bench/results/2026-09-23-smoke-deepseek-reasoning.json
```

### 结果指针

- `bench/results/2026-09-23-smoke-deepseek-reasoning.json`（本报告的原始数据；跨时点对比 = 两份报告对并列，suiteVersion 相同 = 严格可比）
