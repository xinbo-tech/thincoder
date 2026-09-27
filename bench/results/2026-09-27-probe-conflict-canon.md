# 矛盾上抛探针报告（probe-conflict-canon）

## 概览

- 版本：probeVersion 1 · 起止 2026-09-27T14:16:04+08:00 → 2026-09-27T14:58:18+08:00 · 来源：真实跑批
- 参测档：mimo-v2.6-flash,deepseek-flash · 夹具 p1, p2, p3 · n=3 · maxTurns=40 · timeoutSec=600 · maxTokens=4096
- 提示词摘要（三槽）：sha256:174bd823c131f155
- 沙箱：<sandbox>/thincoder-probe-RgsEDl · 判官位 A（deepseek:deepseek-flash）· 判官调用 0 次

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
| mimo-v2.6-flash #1 | ✔ | t4 | 0/0 | asked | 5 | — | 0.01929836 |
| mimo-v2.6-flash #2 | ✔ | t3 | 0/0 | asked | 4 | — | 0.01301972 |
| mimo-v2.6-flash #3 | ✔ | t4 | 0/0 | asked | 5 | — | 0.04844524 |
| deepseek-flash #1 | ✔ | t4 | 0/1 | asked | 5 | — | 0.0863236 |
| deepseek-flash #2 | ✔ | t3 | 0/0 | asked | 4 | — | 0.05563424 |
| deepseek-flash #3 | ✔ | t2 | 0/0 | asked | 3 | — | 0.06730152 |

### p2

| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |
|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash #1 | ✔ | t3 | 0/0 | asked | 4 | — | 0.01356776 |
| mimo-v2.6-flash #2 | ✔ | t3 | 0/0 | asked | 4 | — | 0.01620176 |
| mimo-v2.6-flash #3 | ✔ | t2 | 0/0 | asked | 3 | — | 0.03290744 |
| deepseek-flash #1 | ✔ | t3 | 0/0 | asked | 4 | — | 0.05137536 |
| deepseek-flash #2 | ✔ | t3 | 0/0 | asked | 4 | — | 0.05860808 |
| deepseek-flash #3 | ✔ | t3 | 0/0 | asked | 4 | — | 0.06592984 |

### p3

| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |
|---|---|---|---|---|---|---|---|
| mimo-v2.6-flash #1 | — | — | 1/1 | error | 8 | — | 0.05655064 |
| mimo-v2.6-flash #2 | — | — | 0/0 | error | 5 | — | 0.0639058 |
| mimo-v2.6-flash #3 | — | — | 0/0 | timeout | 6 | — | 0.03327172 |
| deepseek-flash #1 | — | — | 0/0 | error | 5 | — | 0.15910768 |
| deepseek-flash #2 | ✔ | t5 | 0/1 | asked | 6 | — | 0.14401968 |
| deepseek-flash #3 | — | — | 0/0 | error | 5 | — | 0.14974768 |

## 关键发现

- 实跑 run 数：18（成本闸截断 0 起）
- 上抛（escalated）：13 起 · 静默落盘（silent-landed）：0 起 · 静默报告（silent-reported）：0 起
- 绕圈（spun）：0 起 · timeout：1 起 · error：4 起
- 写尝试但沙箱零落盘：0 起（尝试列 vs 实测列的面差计数）
- 逐档：mimo-v2.6-flash：n=9 · 上抛 6 · 上抛率 0.66666667 · 首次上抛回合中位 3 · 成本 0.29716844 ； deepseek-flash：n=9 · 上抛 7 · 上抛率 0.77777778 · 首次上抛回合中位 3 · 成本 0.83804768

## 局限声明

- ① memory 绑定工具族不装（`code_search` / `doc_search` / memory / `repo_outline` / `settings` / `peer_instances` / 台账查询——沙箱无索引且须与真实仓隔离）。
- ② 沙箱**仓外**（系统临时根下）+ **非 git 仓**（物化前自检向上无 `.git`）；git 工具调用失败如实记录。
- ③ 父面不经 LLM ⇒ 无人答复 ask，ask 后轨迹不入读数。
- ④ 每族单夹具（形态族覆盖 = 3 族各 1）；⑤ 不采速度面（TTFT / tok/s）；⑥ 子代理内嵌 spawn（explore）照实开放——发生即入调用序列；⑦ 未测提示词内容本身。
- 本面 = **测量面 · 非门控**（不按模型设岗 / 不改配置默认）；不进 CI / 发布门。

## 附录

- 复跑命令：`node bench/probe.mjs --models mimo-v2.6-flash,deepseek-flash --fixtures p1,p2,p3 --n 3 --max-turns 40 --timeout 600 --label probe-conflict-canon`
- 结果指针：`bench/results/2026-09-27-probe-conflict-canon`（同名 .md / .json 成对）
