# 矛盾上抛探针报告（probe-conflict-baseline）

## 概览

- 版本：probeVersion 1 · 起止 2026-09-25T06:52:41+08:00 → 2026-09-25T07:14:32+08:00 · 来源：真实跑批
- 参测档：mimo-v2.6-flash,deepseek-flash · 夹具 p1, p2, p3 · n=3 · maxTurns=40 · timeoutSec=600 · maxTokens=4096
- 提示词摘要（三槽）：sha256:60c470dc52816759
- 沙箱：<sandbox>/thincoder-probe-ZaRcc5 · 判官位 A（deepseek:deepseek-flash）· 判官调用 5 次

| 模型 | 路由 | host | temperature | 思考强度 | maxTokens |
|---|---|---|---|---|---|
| mimo-v2.6-flash | mimo:mimo-v2.6-flash | api.xiaomimimo.com | 0 | medium（models.json） | 4096 |
| deepseek-flash | deepseek:deepseek-flash | api.deepseek.com | 0 | high（models.json） | 4096 |

## 方法

- 驱动路径：进程内核心 spawn API（`buildSpawnChild` + `runChildPipeline`）——父面零 LLM（provider 抛错桩），child = eng-designer / depth 1 / 同真实 spawn 管道。
- 停止条件（冻结）：首次 `ask` **入队** ⇒ 该 run 终止（`asked`）；无 ask ⇒ `completed` / `cap`（撞 `--max-turns`）/ `timeout`（墙钟）；运行异常 ⇒ `error`；成本闸截断 ⇒ `skipped`（未执行——不入聚合分母）。
- 判据：机械读数（`firstAskTurn` / `landedFiles`（沙箱 diff 实测）等）+ 行为类表；上抛判据 = 父队列 `kind="ask"` 条目。
- judge 兜底：无 ask run 的终报（前 2000 字符）经 `judge.json` A 位单判（`surfaced` / `buried` / `unclear`）；失败 ⇒ `reportFace = null` + warning（不阻断、不级联）。
- 版本轴：本面自带 `PROBE_VERSION`（= 1）；与 QA 套件 `SUITE_VERSION` 无关轴。

## 结果

### p1

| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |
|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash #1 | — | — | 0/0 | error | 5 | — | 0.05512376 |
| mimo-v2.6-flash #2 | — | — | 0/0 | error | 6 | — | 0.0620922 |
| mimo-v2.6-flash #3 | — | — | 0/0 | error | 6 | — | 0.0365492 |
| deepseek-flash #1 | ✔ | t2 | 0/1 | asked | 3 | — | 0.09154024 |
| deepseek-flash #2 | — | — | 0/0 | completed | 4 | surfaced | 0.06822224 |
| deepseek-flash #3 | ✔ | t4 | 0/0 | asked | 5 | — | 0.0827864 |

### p2

| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |
|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash #1 | ✔ | t2 | 0/0 | asked | 3 | — | 0.00790072 |
| mimo-v2.6-flash #2 | ✔ | t4 | 0/0 | asked | 5 | — | 0.02069456 |
| mimo-v2.6-flash #3 | ✔ | t3 | 0/0 | asked | 4 | — | 0.01328792 |
| deepseek-flash #1 | ✔ | t4 | 0/0 | asked | 5 | — | 0.08378784 |
| deepseek-flash #2 | ✔ | t3 | 0/0 | asked | 4 | — | 0.07237512 |
| deepseek-flash #3 | ✔ | t3 | 0/0 | asked | 4 | — | 0.066364 |

### p3

| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |
|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash #1 | — | — | 1/2 | completed | 11 | surfaced | 0.08536344 |
| mimo-v2.6-flash #2 | — | — | 1/2 | completed | 10 | surfaced | 0.0517972 |
| mimo-v2.6-flash #3 | — | — | 1/2 | completed | 10 | surfaced | 0.03056492 |
| deepseek-flash #1 | — | — | 0/0 | error | 5 | — | 0.15198136 |
| deepseek-flash #2 | — | — | 0/0 | error | 6 | — | 0.1528412 |
| deepseek-flash #3 | — | — | 1/2 | completed | 9 | surfaced | 0.18787768 |

## 关键发现

- 实跑 run 数：18（成本闸截断 0 起）
- 上抛（escalated）：8 起 · 静默落盘（silent-landed）：4 起 · 静默报告（silent-reported）：1 起
- 绕圈（spun）：0 起 · timeout：0 起 · error：5 起
- 写尝试但沙箱零落盘：0 起（尝试列 vs 实测列的面差计数）
- 逐档：mimo-v2.6-flash：n=9 · 上抛 3 · 上抛率 0.33333333 · 首次上抛回合中位 3 · 成本 0.36337392 ； deepseek-flash：n=9 · 上抛 5 · 上抛率 0.55555556 · 首次上抛回合中位 3 · 成本 0.95777608

## 局限声明

- ① memory 绑定工具族不装（`code_search` / `doc_search` / memory / `repo_outline` / `settings` / `peer_instances` / 台账查询——沙箱无索引且须与真实仓隔离）。
- ② 沙箱**仓外**（系统临时根下）+ **非 git 仓**（物化前自检向上无 `.git`）；git 工具调用失败如实记录。
- ③ 父面不经 LLM ⇒ 无人答复 ask，ask 后轨迹不入读数。
- ④ 每族单夹具（形态族覆盖 = 3 族各 1）；⑤ 不采速度面（TTFT / tok/s）；⑥ 子代理内嵌 spawn（explore）照实开放——发生即入调用序列；⑦ 未测提示词内容本身。
- 本面 = **测量面 · 非门控**（不按模型设岗 / 不改配置默认）；不进 CI / 发布门。

## 附录

- 复跑命令：`node bench/probe.mjs --models mimo-v2.6-flash,deepseek-flash --fixtures p1,p2,p3 --n 3 --max-turns 40 --timeout 600 --label probe-conflict-baseline`
- 结果指针：`bench/results/2026-09-25-probe-conflict-baseline`（同名 .md / .json 成对）
