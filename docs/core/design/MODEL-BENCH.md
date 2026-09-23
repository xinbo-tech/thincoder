# MODEL-BENCH 模型基准测试套件 · 设计

> 层 = 设计层（how）。需求面 = `docs/batches/2026-09-23-model-bench.md` §1（§1.1–§1.9；AC-1..AC-10）——本档不重述需求，只落机制与判据。
> 建档：2026-09-23（批次 `2026-09-23-model-bench` 设计轮）。落点：`docs/core/design/MODEL-BENCH.md`（基准测试面新档）。
> 判分机制升级（2026-09-24 · 批次 `2026-09-24-judge-hybrid` 设计轮 + fix 轮）：需求面 = `docs/batches/2026-09-24-judge-hybrid.md` §1（§1.1–§1.11；AC-1..AC-14 + §1.7 复核面 + §1.10 双判面 + §1.11 题面入档面）
> ——语义面判官化（**判官对 A / B 双判 + 分歧第三判仲裁**）+ 机械 fail 复核 + 逐维明细题面入档；本档就地更新（§1.3 口径 2 / §2.10 / §2.11 / §2.12 / §5.11 / §5.12 / §6 为本轮新增面）。
> 权威源纪律：五口径（题集 / 判分 / 计时 / 报告 / 价格）的**设计单源 = 本档 §1.3**；实现面单源 = 题集档与 `bench/lib/` 各档（本档给契约，不复述实现代码）。

## 1. 目标与方案

### 1.1 问题与定位

模型选型/性能判断目前靠一次性临时探针：判分器、题面、计时口径、报告格式每次重造；结果不可跨时点比较、无留档。
本设计落 `bench/`（**仓级工具**，不进三端产品）：统一题集 + 判分器 + 速度/成本报告，一次建设、长期沿用。

### 1.2 方案（结构与数据流）

一条命令：读参测清单 → 按题集逐维调模型（经核 provider 路径）→ 判分 + 计时 + 记账 → 落**报告对**（md + json）。

```text
node bench/run.mjs [--models …] [--dims …] [--label …] [--n N]
  └─（--recompute --from <结果.json>：零 API 复跑分支）
run.mjs（CLI 解析 + 编排 + 中断/退出码 + dry-run）
  ├─ lib/roster.mjs   models.json → 参测条目（label / provider / model / 维度面）
  ├─ cases/index.mjs  SUITE_VERSION + 维度注册表（8 自动维 + 人工 lane）
  ├─ lib/client.mjs   调模型（复用核 chat）+ 工具环 + per-call 计时
  ├─ lib/grade.mjs    判分器族（确定性原语：数字比对 / vm 实跑 / 严格 JSON / 工具结构 / 语法级文本约束）
  ├─ lib/judge.mjs    判官对与复核会话（judge.json + 核 chat 路径 + 结构化裁决 + 分歧仲裁 + fail-closed + 记账）
  ├─ lib/metrics.mjs  ttft / tok_s / 中位 / 聚合口径
  ├─ lib/prices.mjs   prices.json 读取 + 匹配 + 成本计算
  ├─ lib/report.mjs   结果对象 → md（骨架 + 三表 + 逐维明细 + 发现 + 局限）
  └─ lib/sanitize.mjs 脱敏谓词 + 写档前断言（报告与 JSON 共用）
```

题集档（`bench/cases/`，一维度一档）、工具桩（`bench/lib/tools.mjs`）、PNG 生成器（`bench/lib/png.mjs`）、长文生成器（`bench/lib/haystack.mjs`）、判官配置（`bench/judge.json`（拟新增））见 §3 文件清单。

### 1.3 五口径冻结（设计条文 · 统一标准的核心）

| # | 口径 | 冻结内容 | 实现落点 | 变更规则 |
|---|---|---|---|---|
| 1 | **题集** | 题面文本 + 用例集（含隐藏用例）逐字冻结于本档 §5；`SUITE_VERSION`（整数）为版本标识 | `bench/cases/index.mjs`（已实现）（常量）+ 各维度档 | 增删改任一题面/用例 → `SUITE_VERSION + 1` |
| 2 | **判分** | **混合三层**：① **确定性面** = 机器断言（数字独立成词 / vm 实跑 / 整串 JSON / 工具结构 / 语法级文本约束）；② **语义·语用面** = **判官对（A / B）双判**（LLM · 各自独立于被测 + 同一冻结 rubric → 结构化 `{verdict, reason}`，fail-closed；**分歧 ⇒ 第三判仲裁 · 多数决**——合成规则 §2.10.1）；③ **机械 fail** = **复核**（LLM 第二只眼 → `{uphold, overturn}`，不改判 · 单判）。人工项只记录不判分（独立 lane） | `bench/lib/grade.mjs`（已实现：确定性原语）+ `bench/lib/judge.mjs`（拟新增：判官对 / 仲裁 / 复核会话）+ `bench/judge.json`（拟新增：三槽身份与预算）+ 各维度档 | 任一判据 / rubric / **任一位判官身份（A / B / 仲裁 C）** / 提示模板 / 复核触发面变化 → `SUITE_VERSION + 1`（§2.10.3 绑定） |
| 3 | **计时** | TTFT = **首个非空 delta 到达**（content 或 reasoning 先到者）− 调用发起；`tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)`；token 只认 `usage` 精确值，**delta 近似禁用**（缺 usage 记 null，不估算） | `bench/lib/client.mjs`（已实现）· `bench/lib/metrics.mjs`（已实现） | 口径变化 → `SUITE_VERSION + 1`（跨版本不严格可比） |
| 4 | **报告** | 报告对 `<日期>-<标签>.{md,json}` 同 basename；md 骨架 = §2.3 固定结构（方法 / 结果 / 局限三段必备）；同骨架跨模型/跨时点可比 | `bench/lib/report.mjs`（已实现） | 骨架变化 = 口径变化 → `SUITE_VERSION + 1` |
| 5 | **价格** | 单价只住 `prices.json`（手动维护 · `asOf` + `source` 必备）；成本 = §2.5 计算式；**价格变动不 bump suiteVersion**（另记 `prices.asOf`） | `bench/prices.json`（已实现）· `bench/lib/prices.mjs`（已实现） | 改价 = 改数据（无须版本号）；离线重算见 §2.7 |

**计时口径的实现依据（实测锚）**：核的流读面只在**非空** delta 时回调（`thincoder-core/provider/sse.mjs:142-149`）⇒ 空 role 起始块不产回调；TTFT 以「首个非空 delta」为观测点，是核路径上最接近「首字节」的可观测单位（被否候选见 §4 KD-7）。

### 1.4 维度总表（V1）

| 维 | 键 | 用例数 | 判分器 | 类覆盖（正常/边界/错误） |
|---|---|---|---|---|
| 推理 | `reasoning` | 3 | 数字比对（独立成词）+ **判官**（`reasoning.3` 前提陷阱） | 1 / 1 / 1（前提陷阱） |
| 代码 | `code` | 3 | `node:vm` 实跑（4s 超时）+ 隐藏用例断言 | 1 / 1 / 1（修 bug） |
| 严格 JSON | `json` | 3 | 整串 `JSON.parse` + 字段/类型断言 | 1 / 1 / 1（类型陷阱） |
| 工具调用 | `tools` | 4 | 结构断言（name / arguments / 轮次）+ **判官**（`tools.2` 时刻等价 · `tools.4` 天气值传递） | 2（单/多步）/ 1（并行）/ 1（拒答） |
| 指令遵循 | `instructions` | 3 | 机器可验约束（字数/次数/格式/否定）+ **判官**（`instructions.3` 冲突识别） | 1 / 1 / 1（约束冲突识别） |
| 多轮澄清 | `multiturn` | 3 | 结构断言 + **判官**（追问 / 候选 / 代决语义） | 1 / 1 / 1（过度澄清 / 代决边界） |
| 长上下文 | `longctx` | 3 | 事实命中（数字独立成词）+ **判官**（`longctx.3` 新旧区分） | 1 / 1 / 1（干扰） |
| 视觉 | `vision` | 3 | **判官**（色名 / 无中生有拒答） | 1 / 1 / 1（无中生有拒答） |
| 中文歧义（人工 lane） | `manual` | 3 | **不判分**——只记录 + 报告并列 | 不计分 |

合计：自动判分 **25 例** + 人工 lane 3 条。逐例题面与判据 = §5；判据面逐例裁定（机械 / 判官 / 混合）= §2.10.2；判官 rubric 与机械复核条文正本 = §5.11。
**判据面计数（D3）**：25 例中 **11 例含判官面**（`reasoning.3` · `instructions.3` · `tools.2` · `tools.4` · `multiturn.1–3` · `longctx.3` · `vision.1–3`）、**20 例含机械面**（其中 6 例为混合面）——两集合的差 = 纯判官面 5 例。

## 2. 接口契约

### 2.1 CLI 契约

```text
node bench/run.mjs [--models <列表>] [--dims <列表>] [--label <名>] [--n <次>] [--max-tokens <N>] [--timeout <秒>] [--dry-run]
node bench/run.mjs --recompute --from <结果.json> [--label <名>]
```

| 参数 | 语义 | 缺省 |
|---|---|---|
| `--models` | 参测模型（逗号分隔）：条目 = `models.json` 的 `label`，或 `provider:model` 复合引用；未在册 → **报错退出**（列在册名单） | 清单全量 |
| `--dims` | 选择器（逗号分隔，取值 = `capability` / `speed` / `cost` / 各维度键 / `manual`）：能力维度名（含 `capability` = 全部 8 自动维）决定**跑什么**；`speed` / `cost` 决定**报告轴** | 全跑 + 全轴 |
| `--label` | 报告文件名标签（`<日期>-<标签>.{md,json}`） | `run` |
| `--n N` | 每例重复次数（速度轴建议 3） | 1 |
| `--max-tokens` | 单次调用输出上限（可比性冻结面） | 4096 |
| `--timeout` | 单次调用墙钟上限（秒，经 `signal` 中止） | 120 |
| `--dry-run` | 不调模型：用夹具结果（= `bench/run.mjs`（已实现）内联固定响应表，落点见 §3）跑通「判分→指标→报告→脱敏」链路（验证用） | 关 |
| `--recompute --from` | 离线重算分支（§2.7；AC-10） | —— |

**语义细则**（冻结）：

1. `--dims` 词表统一——`--dims capability,speed,cost`（AC-1 例）= 全量跑 + 三轴全出；`--dims reasoning`（§1.8 子集复跑）= 只跑推理维（轴缺省 = 全轴，派生指标免费）；`--dims speed,cost` = 全量跑 + 只出速度/成本表。
2. 有效维度面（每模型）= `CLI --dims 能力项` ∩ `roster.dims`（若给）− `roster.skipDims`（若给）；被排除的维在矩阵中显示 `—`（不在该模型面），不是失败。
3. `capability` 关键字 = 8 个自动维，**不含** `manual`（人工 lane 需显式点名或使用缺省全跑）。
4. 温度冻结 = `0`（经核的 `tempRange` 归一裁剪，`thincoder-core/provider/core.mjs:186-192`）；`thinking` / `reasoningEffort` 等其余参数取用户 `~/.thincoder/config.json` 的 provider 条目原值（测「该配置下的实际表现」）。
5. 退出码：`0` = 跑完（**模型用例失败不影响退出码**——失败是数据不是错误）；`1` = 基建错误（参数错 / 未知模型 / provider 缺配置 / `prices.json` / `models.json` / `judge.json` 不可读或不合 schema
（**判分路径**；`--dry-run` / `--recompute` 的判官配置按 §2.10.3 豁免）/ 判官 provider 缺配置 / 判官独立性违约（A / B / 仲裁 C 任一位）/ 判官对身份违约（A=B · 仲裁员 ∈ {A, B}）/ 判官冻结版本不匹配 / 本轮合成全灭——§2.10.4）；中断（SIGINT）→ 中止在飞调用、**不落档**、退出码 130（半程结果不得混入留档）。
6. 输出：stdout 逐例进度行 + 结尾摘要表；`--dry-run` 不触网。结果对落 `bench/results/`（相对 `bench/` 目录解析，任意 cwd 可跑；目录不存在则创建）。
7. 覆盖保护：目标文件已存在 → **拒写并提示换 `--label`**（留档不可被静默覆盖；删旧档 = 人工显式动作）。

### 2.2 结果 JSON schema（`bench/results/<日期>-<标签>.json`）

```json
{
  "suiteVersion": 1,
  "label": "flash-compare-v3",
  "startedAt": "2026-09-23T22:40:00+08:00",
  "finishedAt": "2026-09-23T23:02:11+08:00",
  "run": { "dims": ["capability", "speed", "cost"], "repeats": 1, "maxTokens": 4096,
           "timeoutSec": 120, "temperature": 0, "node": "v24.9.0", "command": "node bench/run.mjs --models …" },
  "prices": { "asOf": "2026-09-23", "currency": "CNY", "source": "…（表级出处）" },
  "recomputed": null,
  "judge": { "promptVersion": 1, "frozenAtSuiteVersion": 3,
             "judges": [
               { "id": "A", "provider": "deepseek", "model": "deepseek-flash", "host": "api.deepseek.com",
                 "temperature": 0, "maxTokens": 2048, "timeoutSec": 30, "sameVendorAsTested": false,
                 "calls": 11, "costCny": 0.0066 },
               { "id": "B", "provider": "minimax", "model": "MiniMax-M3", "host": "api.minimaxi.com",
                 "temperature": 0, "maxTokens": 2048, "timeoutSec": 30, "sameVendorAsTested": false,
                 "calls": 11, "costCny": 0.0092 }],
             "arbiter": { "id": "C", "provider": "kimi", "model": "kimi-k3", "host": "api.moonshot.cn",
                 "temperature": 0, "maxTokens": 2048, "timeoutSec": 30, "sameVendorAsTested": false,
                 "calls": 3, "costCny": 0.0021 },
             "judgeCalls": 25, "costCny": 0.0179,
             "agreements": 8, "disagreements": 3, "arbitrations": 2, "unavailable": 0 },
  "review": { "promptVersion": 1, "calls": 1, "uphold": 0, "overturn": 1, "costCny": 0.0006 },
  "models": [{
    "label": "mimo-flash", "provider": "mimo", "model": "MiMo-V2.6-Flash", "host": "api.xiaomimimo.com",
    "dims": ["reasoning", "code", "…"],
    "cases": [{
      "caseId": "reasoning.1", "dim": "reasoning", "class": "正常",
      "prompt": "…（题面正本逐字——§2.2-11；渲染 ≤300 字符；构造型用例 = 题面正本含载荷括注，载荷不入档）",
      "runs": [{
        "n": 1, "verdict": "pass", "detail": "…≤200 字符",
        "metrics": { "ttftMs": 812, "totalMs": 4210, "tokPerSec": 31.4,
                     "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                     "cost": { "value": 0.00035, "currency": "CNY", "pricesAsOf": "2026-09-23" } },
        "calls": [{ "round": 1, "ttftMs": 812, "totalMs": 4210,
                    "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                    "costCny": 0.00035, "toolNames": [], "finishReason": "stop",
                    "throttled": false }],
        "judge": { "verdict": "pass", "resolution": "unanimous", "turn": 0, "reason": "…≤300 字符（定判位理由）",
                   "judges": [
                     { "id": "A", "verdict": "pass", "reason": "…≤300 字符", "attempts": 1,
                       "calls": [{ "attempt": 1, "at": "2026-09-24T01:20:03+08:00", "totalMs": 900,
                                   "maxTokens": 2048, "finishReason": "stop",
                                   "tokens": { "prompt": 320, "cached": 0, "completion": 60 }, "costCny": 0.0006 }] },
                     { "id": "B", "verdict": "pass", "reason": "…≤300 字符", "attempts": 1,
                       "calls": [{ "attempt": 1, "at": "2026-09-24T01:20:05+08:00", "totalMs": 1300,
                                   "maxTokens": 2048, "finishReason": "stop",
                                   "tokens": { "prompt": 320, "cached": 0, "completion": 80 }, "costCny": 0.0009 }] }] },
        "review": { "verdict": "uphold", "reason": "…≤300 字符", "mechDetail": "…≤200 字符", "attempts": 1,
                    "calls": [{ "attempt": 1, "at": "2026-09-24T01:21:10+08:00", "totalMs": 1100,
                                "maxTokens": 2048, "finishReason": "stop",
                                "tokens": { "prompt": 380, "cached": 0, "completion": 70 }, "costCny": 0.0007 }] },
        "summary": { "textHead": "…≤300 字符", "textLen": 96, "reasoningLen": 0, "toolNames": [] }
      }]
    }],
    "aggregate": { "passed": 17, "total": 20, "costCny": 0.0123, "costPerPassCny": 0.0007,
                   "judgeCostCny": 0.006, "reviewCostCny": 0.0007, "overturns": 1 }
  }],
  "manual": [{ "promptId": "manual.1", "prompt": "…", "responseHead": "…",
               "metrics": { "ttftMs": 812, "totalMs": 4210, "tokPerSec": 31.4,
                            "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                            "cost": { "value": 0.00035, "currency": "CNY", "pricesAsOf": "2026-09-23" } } }],
  "warnings": ["usage 缺失：glm-5.3-flash（cost=null）", "价格未录：…"]
}
```

**字段纪律**：

1. `tokens` 只来自 `usage`（核已归一：`prompt_tokens` / `completion_tokens` / `prompt_cache_hit_tokens`，见 `thincoder-core/provider/sse.mjs:13-22`）；缺失 → 该字段 `null` + `warnings` 登录，**不近似**。
2. 每 `call`（工具环每轮一 call）独立记录指标；用例级聚合规则 = 见 §2.3-1~3。
3. `verdict ∈ {pass, fail, error, skipped}`：`error` = 基建/接口错误（超时、HTTP 错、图像被拒），`skipped` = 不在该模型面（roster 维度面）。
4. 反泄漏：JSON 由**白名单字段构造**（不 spread provider 对象），写档前过 `sanitize` 断言（§2.8）。
5. **离线重算友好**：`calls[].tokens` 为原子账目 ⇒ 仅凭本档 + 新 `prices.json` 即可重算全部成本（AC-10）。
6. `manual[]` = 人工 lane 记录（每条一次调用）：`metrics` 与用例级 `runs[].metrics` 同形（ttft / total / tokPerSec / tokens / cost 五键）；tokens / cost 缺失纪律同条 1、3（缺 → `null` + `warnings`）；报告按条**单项列出**其调用成本（§2.3-④）。
7. `judge` / `review`（顶层）= 本轮判官配置快照 + 汇总（§2.10.6；判官面 = 逐位 A / B / 仲裁 C 快照 + 逐位与合计账目 + 分歧计数）；`runs[].judge` / `runs[].review` = 逐 run 裁决记录（判官面 = 合成分 `verdict` + `resolution` + 逐位 `judges[]`）——**未发生则不写字段**（不写 `null` 占位：null 与「未发生」不可分；仲裁位未触发 ⇒ `judges[]` 无 C 条目）。
   **历史档**：v3 = 唯一在档报告 ⇒ 渲染与重算**无历史兼容分支**。
8. judge / review 的 `calls[]` = **逐尝试账目**（含放大预算重试的一次；tokens 只认 `usage`、缺即 null，纪律同条 1）+ 该次调用的 `at`（ISO 本地时点）——「版本/时点」入档的时点面；`maxTokens` 取该次尝试实际值（重试可能 ≠ 配置值）。判官面 = **逐位各自的 `calls[]`**（同一 run 内 A / B（+C）的账目分列，不合并）。
9. `run.verdict` 恒为 `pass | fail | error | skipped`（**不扩展枚举**）：判官**合成无多数**（有效判 < 2 / 分歧未决）⇒ `error`（detail 前缀「判官不可用」+ 括注成因 + `runs[].judge.verdict = "error"` + `resolution = "none"`）；复核翻案 ⇒ 仍 `fail` + `runs[].review.verdict = "overturn"`（不计入 pass 计数，§2.11）。
10. **成本分账（AC-4 · 射程扩至判官对）**：判官（A / B / 仲裁 C）/ 复核成本**不进** `runs[].metrics.cost` 与 `aggregate.costCny`（被测成本面零污染）；只出现在 `runs[].judge.judges[].calls[].costCny` / `runs[].review.calls[].costCny` 与 `aggregate.judgeCostCny`（三位合计）/ `aggregate.reviewCostCny`（+ 顶层逐位与合计汇总）。
11. `cases[].prompt` = **题面正本逐字**（单源取用例声明，不做二次重构）：静态用例 = 实际发送串逐字（与 §5 题面列口径同源）；多轮用例 = `prompt` + `build().followUps` 逐字声明式拼接（同 §2.6 `judge.question` 口径）；**构造型用例**（`build()` 带载荷：`longctx` 长文 / `vision` 图像）= 用例声明 `prompt` 逐字（含载荷括注）——**载荷不入档**（haystack / PNG 为确定性构造 ⇒ 可复现）。
   **采集面 = 运行期写入**（不依赖重跑用例源）⇒ `--recompute` 自足。**历史档**：v3 = 唯一在档报告 ⇒ 本字段**无历史兼容分支**。

### 2.3 md 报告契约（AC-3 / AC-9）

报告对 = `<日期>-<标签>.md` + 同 basename `.json`（同一次运行产出，md 完全由 JSON 数据渲染 ⇒ 两档恒一致）。骨架（固定，缺段即缺陷）：

```text
# 模型基准报告 · <标签> · <日期>
## 概览          —— 参测模型与配置（label/provider/model/维度面）· suiteVersion · prices.asOf · 通过率一览 · **判官行 ×3**（A / B / 仲裁 C——provider:model / temperature / maxTokens / 超时 / 模板版本 / 调用次数 / 成本 / 独立性标记；仲裁行注「仅分歧样本」）+ **分歧率**（分歧 ÷ A/B 双有效样本）+ 判官成本合计与复核成本
## 方法          —— 五口径冻结说明（§1.3 五条：判分为**混合三层**——确定性断言 / 判官对（A·B 双判 · 分歧经第三判仲裁）/ 复核）+ suiteVersion + 判官与复核模板版本（promptVersion）+ 运行参数（--n / maxTokens / temperature / 时点）
## 结果
### 能力矩阵     —— 模型 × 维度 → 通过/总数（`—` = 不在该模型面；按合计通过数降序；**存在复核翻案的模型×维追加 `⟲` 标记**——翻案不计入通过数，脚注说明口径）
### 速度表       —— 模型 × [TTFT 中位 / tok/s 中位 / 总耗时]（N>1 时取中位；按 TTFT 中位升序）
### 成本表       —— 模型 × [总成本 / 每任务成本 / 每通过任务成本 / **相对成本（每通过任务成本 ÷ 表内最低者 = 1×，直接读倍数）** / **判官成本（= A / B / 仲裁 C 三位合计）** / **复核成本（后两列单列展示，不参与相对成本归一化也不进被测成本）**]（价格未录/usage 缺失 → `—` + 脚注；按每通过任务成本升序）
### 逐维明细     —— 每用例：**题面行（用例级一条——`cases[].prompt` 逐字 ≤300 字符；超限截断 `…`（截断只落渲染面，JSON 存全额））**；每用例 × 模型：判定（复核翻案的 run 加 `⟲` 标记；**判官分歧样本加 `⇄` 标记**）+ 关键指标 + **成本 + 相对成本（该用例内最低者 = 1×）** + 响应摘要（≤300 字符；**code-span 安全渲染 = 动态反引号包裹 + 换行 `⏎`——保真可审计**）
              + **判官理由行**（判官裁决的 run：逐位 A / B（分歧时 +C）裁决 + 定判位理由）+ **复核行**（该单元格有复核记录时：复核次数 / uphold / 翻案 + 翻案理由）
### 判官分歧     —— **判官质量仪表 + 审计线索**：逐条 = 用例 · 模型 · A 裁决 + 理由 · B 裁决 + 理由 · 仲裁（触发时：裁决 + 理由）· 合成分；无分歧 → 「本轮无判官分歧」（分歧标记只落逐维明细与本小节——能力矩阵只表达通过数）
### 复核翻案     —— **判据演进线索**：逐条 = 用例 · 模型 · 机械失败断言 · 复核理由（无记录 → 「本轮无复核翻案」；不自动改判——§2.11）
### 人工判读     —— 人工 lane 逐条并列（题面 + 响应摘要 ≤300 字符 + 指标 + 调用成本按条单项列出 + **相对成本 = 同条内最低者 = 1×**；不判分；该 lane 未跑 → 本节记「未运行」）
## 关键发现      —— 数据性结论（仅名次/极值与计数，模板化生成；禁主观评价词；数据告警行含「判官不可用 M 次（有效判不足 m₁ · 分歧未决 m₂）· 判官分歧 K 次（仲裁 L）· 机械 fail 复核 N 次（翻案 K' 次）」）
## 局限声明      —— 固定模板（单次采样无置信区间 / 闭集判据不覆盖开放式质量 / 人工 lane 不判分 / 价格手动维护 /
                    同模型跨渠道差异 / 速度受服务端负载影响 / **响应只存摘要（≤300 字符）· 题面 = `cases[].prompt` 冻结正本（构造型用例的载荷不入档）** /
                    **语义面由判官对（A / B）按冻结 rubric 裁决，分歧样本经第三判仲裁（判官对的同向误判不设外部复核）** /
                    **机械 fail 复核为单次辅助信号（翻案不改判）** / V1 未覆盖面）
## 附录
### 复跑命令     —— 本报告的复现命令（相对路径形态）
### 结果指针     —— bench/results/<文件名>.json（相对路径）
```

聚合与判定规则（冻结）：

1. 用例判定：N 次全过 = `pass`；否则 `fail`（明细给 `k/N`）——矩阵只计 `pass`（能力矩阵表达「稳定具备」）。
2. 速度聚合：只取**正常返回**的 runs（`verdict ∈ {pass, fail}`；`error` / `skipped` runs 不入聚合）；N 次取**中位数**；`ttft` = 首轮首个非空 delta；`tok/s` = Σcompletion ÷ Σ(per-call total − per-call ttft)（多轮工具链跨轮合计）。
   **null / error 参与规则（冻结）**：① 中位数剔除 `null`（不按 0 计），样本全 `null` → 该指标记 `null`（报告格 `—` + 脚注）；② `ttft` 为 `null` 的 run（无任何非空 delta）不入 ttft 中位；
   ③ `tok/s` 只对 `ttft` 与 `total` 皆非 `null` 的 call 做 Σ（分子同取这些 call 的 completion）——参与 call 为空 → `tok/s` = `null`；④ 某模型 × 维 runs 全为 `error` → 速度与成本各项记 `null`（报告格 `—`）。
3. 成本聚合：Σ **成功返回的 call** 成本（被中止 / 失败的 call 记 `null` 不入账 + 警告）；无成功 call → 该成本记 `null`（不按 0 计，同规则 2 之 ④）。
4. 人工 lane：单独小节并列（骨架 `### 人工判读`）；不计分、不入能力矩阵与成本归一化；其调用成本按条**单项列出** = `manual[].metrics.cost`。
5. 关键发现生成规则：① 能力通过率首位/末位；② 速度（TTFT 中位 / tok/s 中位）极值；③ 每通过任务成本最低；④ 数据告警汇总（usage 缺失 / 价格未录 / error 计数 / 判官不可用（成因分列）/ 判官分歧与仲裁计数 / 复核与翻案计数）。全部由数据 + 固定句式生成。
6. **判官 / 复核聚合（冻结）**：判官**合成分**（一致 ⇒ 该向；分歧 ⇒ 第三判多数决）直接决定 run 判定（`pass` / `fail`）；**合成无多数 ⇒ run `error`**（不引入第三态、不补位、不单判回退——§2.10.1 / §2.10.4）；复核**不改判**——`overturn` 仍计入 fail（能力矩阵通过数与相对成本归一化**不受影响**），只在 `⟲` 标记、《复核翻案》小节与 JSON 记录中单列呈现。

### 2.4 models.json（参测清单 · 配置文件）

```json
{
  "version": 1,
  "models": [
    { "label": "mimo-flash", "provider": "mimo", "model": "MiMo-V2.6-Flash",
      "dims": null, "skipDims": null, "note": "" }
  ]
}
```

| 字段 | 必填 | 语义 |
|---|---|---|
| `label` | ✅ | 报告展示名；`--models` 首选匹配键；文件名安全（英文/数字/连字符） |
| `provider` | ✅ | 用户 `~/.thincoder/config.json` 的 `providers[].name`（**只存名字，不存密钥**） |
| `model` | ✅ | 模型 ID（发给 API 的字面值） |
| `dims` | 可选 | **白名单**：该模型只跑列出的维度 |
| `skipDims` | 可选 | **黑名单**：该模型跳过列出的维度（两者同给 = 先白后黑） |
| `note` | 可选 | 备注（如「文本模型」「价格未核实」），随报告概览展示 |

纪律：① 条目 `provider` 在用户 config 中不存在 → **运行报错退出**（缺失名单点名）；② 清单与 `prices.json` 的**对齐键 = `provider:model`**（`label` 仅展示，可改；复合键是唯一标识——README 写明）；③ `dims` / `skipDims` 两个显式字段（分开承载「限定」与「跳过」两种语义，理由见 §4 KD-4）。

### 2.5 prices.json（价格表 · 手动维护）+ 成本计算式

```json
{
  "asOf": "2026-09-23",
  "currency": "CNY",
  "unit": "元 / 百万 token",
  "source": "各厂商官方定价页（逐条可加条目级 source 覆盖）",
  "entries": [
    { "match": "mimo:MiMo-V2.6-Flash", "cachedInput": 0.02, "input": 1.0, "output": 2.0,
      "asOf": "2026-09-23", "source": "小米 MiMo 官方定价页", "note": "" }
  ]
}
```

| 字段 | 必填 | 语义 |
|---|---|---|
| `match` | ✅ | `provider:model` 精确键，或通配串（`*` 匹配任意段片段，如 `bailian:qwen3.8-*`） |
| `input` / `output` | ✅ | 未缓存输入价 / 输出价（单位 = 表级 `unit`） |
| `cachedInput` | 可选 | 缓存输入价；缺省 → 缓存 token 按 `input` 计价（无缓存折扣即此式） |
| `asOf` / `source` | 条目可选（表级必备） | 条目级覆盖表级；**两者同源纪律**：每条价格须可回溯 |
| `note` | 可选 | 口径备注（如「峰谷定价——本表取峰值档」） |

**成本计算式（冻结）**：

```text
cost = (prompt_tokens − cached_tokens) × input + cached_tokens × (cachedInput ?? input) + completion_tokens × output
       ── 全部单价按 unit「元 / 百万 token」先除 1e6；cached_tokens 取 usage.prompt_cache_hit_tokens（缺失 ⇒ 0，并记 cachedUnknown 警告）
```

**匹配规则**（冻结）：① 精确匹配优先；② 通配按字面段长度降序取首个命中；③ 无命中 → `cost: null` + `warnings` 登录（**运行不因缺价中断**）。**schema 校验 fail-closed**：`input` / `output` 缺失或不为数字 → 装载即拒（半截价格不得录入；相对口径（如「约为旗舰 1/10」）不得转写为数字）。多币种：不做汇率换算，报告按币种分组列（V1 实际只录 CNY）。
**判官 / 复核价格同源**：判官成本按**各判官位**的 `provider:model`（A / B / 仲裁 C）走**同一匹配与计算式**（不另立价格档；缺价 ⇒ 成本 `null` + 警告——§2.10.5）。

### 2.6 题集 / 判分器接口

题集档（每维一档，`bench/cases/<dim>.mjs`（已实现））导出用例数组；用例对象字段（冻结）：

```js
{ id: "reasoning.1", dim: "reasoning", class: "normal" | "boundary" | "error",
  prompt: "…（逐字题面 = 实际发送串 · 冻结正本 = 本档 §5；注记外置口径见 §5 题面列口径）",
  build: null,              // 可选：动态题面构造（长文 / PNG → {messages, assets}）
  callOpts: {},             // 可选：tools / parallelToolCalls / maxTokens 覆盖
  mechRubric: "…",          // 机械判据条文（含机械面的用例必备；复核输入用 · 冻结正本 = §5.11）
  judge: { turn: 0, rubric: "…", question: "…" },  // 判官声明（含判官面的用例必备；冻结正本 = §5.11）
  grade: async (result, ctx) => ({ pass: boolean, detail: string }) | ({ error: string, detail: string }) }
```

**字段语义（冻结）**：`judge.turn` = 该判据所在**回合下标**（0-based，必填——POC 教训①：多轮题喂错回合比判错更坏）；`judge.rubric` = 冻结判据条文；`judge.question` = 该回合用户所见题面
（缺省 = `prompt`；多轮题为逐回合用户文本的声明式拼接——`build().followUps` 各条须逐字包含，自检机检防漂移）。**判官对与分歧仲裁对用例声明面透明**——声明面只有一份 rubric / 一个取值点；A / B / 仲裁 C 由 `judge.json` 槽位定（§2.10.3），用例不感知判位数。
`grade` 为 **async**（判官面用例 await `ctx.judge()`）；返回 `{ error }` ⇒ 该 run 判 `error`（§2.2-9）；`ctx.judge()` = 读本用例 `judge` 声明 + 取 `result.turns[judge.turn].text`（单一取值点）→ `{ verdict: "pass"|"fail"|"error", reason, resolution }`（**合成分**——合成规则 §2.10.1；`reason` = 定判位理由）。
**混合面短路顺序（冻结）**：先跑机械断言；机械面已 FAIL ⇒ **不调判官**（省成本；记录面如实——无 `runs[].judge` 块）；机械面通过 ⇒ 再调判官。

**命名与词表映射（冻结）**：用例对象 `class`（`normal` / `boundary` / `error`）与结果 JSON 的 `class`（§2.2）同名；值映射 `normal → 正常` · `boundary → 边界` · `error → 错误`（结果 JSON、报告与 §5 用例表「类」列一律用中文词，括注变体如「错误（…）」以词根为准；映射实现单处 = 结果对象构造面）。

判分器族（`bench/lib/grade.mjs`（已实现），**确定性原语全部纯函数、无网络**）：
`numEquals`（数字独立成词 `(^|\D)N(\D|$)`）· `vmRun`（`node:vm` + 4000ms 超时 + 追加断言脚本；代码块提取 = 末个围栏内容或整段）· `strictJson`（trim 后整串 `JSON.parse`，含围栏/散文即 FAIL）+ 字段断言 ·
`toolShape`（name / `JSON.parse(arguments || "{}")` / 轮次）· `textRules`（汉字计数、段落数、句数、首尾、次数、否定式「不含」、阿拉伯数字禁用、含词——**语法级约束**）。
语义·语用面判据不再以词表/正则为单一判据（§1.3-2）：其裁决面 = `bench/lib/judge.mjs`（拟新增——判官与复核，§2.10 / §2.11）。

工具桩（`bench/lib/tools.mjs`（已实现））：`get_time` / `send_email` / `get_weather` / `read_file`（decoy）——**全为本地确定性桩**，bench 绝不执行真实命令、绝不触网（除模型端点）。

### 2.7 复跑契约（§1.8 · AC-10）

| 场景 | 命令形态 | 行为 |
|---|---|---|
| 全量复跑 | `--models <列表> --label <标签>` | 常规运行 → 报告对 |
| 子集复跑 | `--models <列表> --dims <维度列表>` | 只跑选中维度（报告轴缺省全出） |
| **零 API 成本复跑** | `--recompute --from <结果.json>` | 读入结果 JSON → 以**当前** `prices.json` 重算每 call 成本与聚合 → 落**新报告对**（默认标签 = `<原标签>-recalc`）；**不调模型、不重判分、不触网** |

离线重算的结构保证（AC-10 判定）：`--recompute` 分支**不 import** `bench/lib/client.mjs`（已实现）（构造性零网络）+ 判定用例 = 毒化 `globalThis.fetch`（抛错）后全流程仍成功（§5 复跑面用例）。重算产物记录 `recomputed: { from: "<原文件名>", at: "<ISO 时点>" }`；原档不动（留档不可变）。

### 2.8 凭据与网络边界（AC-7）

1. 密钥零入库：密钥只住用户 `~/.thincoder/config.json`（核的 `loadConfig` 读）；仓内任何档不含密钥。
2. 结果 JSON / md 由白名单字段构造（不 spread provider）；写档前 `sanitize` 断言（`bench/lib/sanitize.mjs`（已实现））：命中绝对路径（Windows 盘符 / `/Users` `/home`）、密钥字面（`sk-…` / `Bearer ` / `apiKey` 字段名）、用户名 → **拒写并报错**（fail-closed；不带病出档）。
3. `host` 字段只存端点主机名（不存完整 URL 含 query/token）；报告正文的路径一律相对形态或占位符。
4. 网络面：仅模型端点（用户 config 的 baseURL）；其余零外呼（题集/判分/报告全本地）。

### 2.9 与核的关系（实现落点的契约面）

bench **复用核的 provider 路径**（非自写 client，理由见 §4 KD-1）：

```js
import { loadConfig, findProvider, parseModelRef, specForModel, assistantToolCallMessage } from "../../thincoder-core/config.mjs";
import { chat } from "../../thincoder-core/provider/index.mjs";
```

1. 调模型 = `chat(providerEntry, { messages, tools, onToken, onReasoning, signal, parallelToolCalls, … })`。
   **provider 条目构造面（冻结）= 克隆用户 config 条目 + 覆写 `maxTokens` / `temperature` / `.model`**：核从**条目**读这两个字段
   （`thincoder-core/provider/core.mjs:184` 的 `maxTokens`、`thincoder-core/provider/core.mjs:185-192` 的 `temperature` + `tempRange` 裁剪），
   且请求体模型名取条目（`thincoder-core/provider/core.mjs:178`）；`chat` 的 opts（`thincoder-core/provider/core.mjs:117` 解构）无这两位
   ⇒ 覆写不落条目会**静默失效**（仍按用户配置跑，破可比性面）；`.model` 覆写 = `models.json` 条目的 `model` 值；
   条目其余字段保持用户原值（渠道差异如实测）。
2. 计时钩子 = `onToken` / `onReasoning` 首次回调（§1.3 口径 3）。
3. 多轮工具链 = bench 侧小工具环：执行本地桩 → `assistantToolCallMessage(result, specForModel(model))` 构造工具回合 assistant 消息（**reasoning 回显策略随核规格**，`thincoder-core/model-specs.mjs:279-289`）→ 追加 tool 结果消息 → 续调。
4. 继承的核行为（如实记录、不改造）：重试 / 续写（`finishReason:"length"`）/ 限流门（`rateGate`）/ 日志与轨迹钩子（`traces` 默认关，落盘受用户配置门控）。暂停（限流等待）发生时该 call 记 `throttled: true`。
5. 已知缺口（上抛项 ①）：核按模型 spec 的 `noUsageStream` 抑制 `stream_options.include_usage`（`thincoder-core/model-specs.mjs:52-64` 的 glm 族 / minimax / gemini 带此标），与当日四家探针「include_usage 全部支持」相抵 ⇒ 这些模型可能无 usage ⇒ 成本记 `null`。**处置 = 如实记录 + 报告脚注**（改核越本批边界——零三端改动）。

### 2.10 判官机制（语义·语用面 · AC-1/2/3/5/6 + AC-13 双判）

**定位**：语义·语用面（「回复是否表达了某个意思」）不再以词表/正则为单一判据——由**判官对（A / B）**按**同一冻结 rubric**（判位差异只在模型身份）各自独立裁决，输出结构化 `{verdict, reason}`（可审计理由）；**分歧样本**由**第三判（仲裁员 C）多数决**合成（§2.10.1 合成规则）。

#### 2.10.1 接口契约（输入构造 · 输出契约 · fail-closed · 预算与重试）

```js
// 用例声明面（§2.6）：judge = { turn, rubric, question? }；grade 为 async，经 ctx.judge() 取裁决（合成分）
const j = await ctx.judge()   // → { verdict: "pass" | "fail" | "error", reason: string, resolution }
```

**输入构造（回合精确 · POC 教训①）**：判官输入 = 三段 = ① 题面（`judge.question` ?? 用例 `prompt`）② **判据条文**（`judge.rubric`，逐字）③ **响应原文 = `result.turns[judge.turn].text`**（该回合模型文本；经**单一取值点** `ctx.judge()` 提取——「声明式 `turn` + 单取值点」结构性防「喂错回合」复现）。**A / B（及 C）收到同一份三段素材**——rubric 单源，判位差异只在模型身份。
**不喂**：对话前后文 / 工具调用事实 / 图像（rubric 载明事实正本；**喂错素材比判错更坏**——被否候选见 §4 KD-22）。
**输出契约（逐位）**：`{"verdict": "pass" | "fail", "reason": "…"}`；`reason` 截断 ≤300 字符；**严格解析**（trim 后须以 `{` 起、整串 `JSON.parse`、`verdict` 必在枚举内）——与严格 JSON 面同口径；多余键忽略。
**调用面（双判 · 冻结）**：A / B **并行**发起（同一 run 的两判无相互依赖、输入素材同一份 ⇒ 并行不引入顺序偏差；判定延迟 = max 而非 sum；失败隔离天然——各自独立重试与记账）。分歧样本的第三判 C 为**依赖步**（待 A / B 结果齐备且相异才发起）⇒ 串行触发。被否候选：串行 A → B（被否：判定时长 ×2 无收益——短路省下的只有「A 位失败样本」的钱，而失败样本本就走 `error`）。
**合成规则（冻结 · 多数决）**：
| A / B | 第三判 C | 合成分（= run 判定来源） | `resolution` |
|---|---|---|---|
| 一致（同向） | 不触发 | 该向 | `unanimous` |
| 相异 | 触发 · 有效 ⇒ 多数派（2/3）定判 | 多数派 | `arbitrated` |
| 相异 | 触发 · 无效（重试后仍失败） | `error`（无多数） | `none` |
| 任一位无效（重试后仍失败） | 不触发 | `error`（有效判 < 2） | `none` |
3 位二元票 ⇒ 无平局（2–1 或 3–0）；**任何无多数路径 ⇒ `error`——禁猜、禁补位（仲裁员不替失败位）、禁单判回退**（D3；被否候选见 §2.10.4）。定判位理由（`runs[].judge.reason`）：一致 ⇒ A 位理由；仲裁 ⇒ C 位理由；无多数 ⇒ 成因说明（≤300）。
**fail-closed（禁猜、禁回退词表）**：解析失败（含空输出 / `finishReason=length` 截断）⇒ **放大预算重试一次**（`maxTokens × 2`，上限 8192，逐尝试记录实际 `maxTokens`）；两次皆不可解析、或超时 / HTTP 错 ⇒ **该位**判定 = `error`（→ 合成面按「有效判 < 2 / 分歧未决」处置）。传输面失败**不**重试（核已含 HTTP 级重试，§2.9-4）。
**预算与超时**：`judge.json.maxTokens` 默认 2048、区间 [1024, 8192]（**低于 1024 装载即拒**——POC 教训②：400 token 被思考烧尽 ⇒ 空输出）；`timeoutSec` 默认 30、区间 [5, 120]；`temperature` 冻结 `0`。判官预算与被测调用的 `--max-tokens` **解耦**（同一 suiteVersion 的判分口径不随运行参数漂移）。
**调用路径**：核 `chat`（`thincoder-core/provider/core.mjs:75`）经 `bench/lib/client.mjs`（已实现）的 `liveTransport`（请求构造面同源：克隆用户 provider 条目 + 覆写 `.model` / `maxTokens` / `temperature`——§2.9-1 纪律）。

#### 2.10.2 判据分层表（逐用例 · 冻结）

判据面二分（原则）：**判据对象是「精确值 / 结构 / 执行结果」⇒ 机械**（零假阴代价 × 零成本 × 零随机）；**判据对象是「文本表达的意思」⇒ 判官**。

| 用例 | 机械面（确定性断言） | 判官面（语义裁决） | 复核触发 |
|---|---|---|---|
| `reasoning.1` / `.2` | `numEquals`（3 / 371281） | —— | ✓ |
| `reasoning.3` | —— | 前提陷阱（指出 9 非质数 或 给出 3×3） | ✗（判官主判） |
| `code.1–3` | `vmRun` 实跑 + 隐藏断言 | —— | ✓ |
| `json.1–3` | 整串 `JSON.parse` + 字段断言 | —— | ✓ |
| `tools.1` | 首个调用 = `get_time` + 最终 content 非空 | —— | ✓ |
| `tools.2` | `get_time` → `send_email` + `to` / `subject` 值断言 | `body` 时刻等价（与工具返回值同一时刻） | ✓ |
| `tools.3` | 零工具调用 + `numEquals`（12） | —— | ✓ |
| `tools.4` | 回合 1 恰 2 条 `get_weather` + `city` 集合 | 天气值传递（北京晴 / 上海小雨） | ✓ |
| `instructions.1–2` | `textRules` 语法级约束（段/字/符/次数/首字） | —— | ✓ |
| `instructions.3` | —— | 约束冲突识别 | ✗（判官主判） |
| `multiturn.1` | 回合 1 零工具调用；回合 2 `send_email` + `to` | 回合 1 追问语义（请求缺失信息、未谎称已发送） | ✓ |
| `multiturn.2` | 零工具调用 | 候选语义（未提问 + ≥3 个不同候选） | ✓ |
| `multiturn.3` | 回合 1 内 `send_email` | 不追问语义（信息足够即代决） | ✓ |
| `longctx.1–2` | `numEquals`（49152 / 57318） | —— | ✓ |
| `longctx.3` | `numEquals`（42875） | 新旧区分（不得把 40001 表述为当前值） | ✓ |
| `vision.1–3` | —— | 色名（红 / 绿）· 无中生有拒答 | ✗（判官主判） |
| `manual.1–3` | 不判分（人工 lane） | 不判分 | ✗ |

计数（D3）：判官面 **11 例** · 机械面 **20 例** · 纯判官面 5 例（上表末列 ✓ = 20 行）；机械面为纯函数、判据行原文不因判官化改变（确定性零回归红线）。判据条文正本 = §5.11。

#### 2.10.3 判官配置 `bench/judge.json`（拟新增 · 判官身份与预算）+ 独立性 + 冻结绑定

```json
{ "version": 1, "frozenAtSuiteVersion": 3,
  "judges": [
    { "provider": "deepseek", "model": "deepseek-flash", "maxTokens": 2048, "timeoutSec": 30 },
    { "provider": "minimax", "model": "MiniMax-M3", "maxTokens": 2048, "timeoutSec": 30 }],
  "arbiter": { "provider": "kimi", "model": "kimi-k3", "maxTokens": 2048, "timeoutSec": 30 },
  "note": "判官对（A = POC 已验 · B = 第二视角）+ 分歧仲裁 C（temperature 0）" }
```

| 字段 | 必填 | 语义 |
|---|---|---|
| `frozenAtSuiteVersion` | ✅ | 本判官配置冻结于的套件版本（须 === `SUITE_VERSION`，不等 ⇒ 拒跑——见下「冻结绑定」；射程 = 三槽全量） |
| `judges` | ✅ | **判官对**：长度恰 2 的数组——位序定身份（`judges[0]` = A · `judges[1]` = B）；两槽字段同构（`provider` / `model` / `maxTokens` / `timeoutSec`） |
| `arbiter` | ✅ | **仲裁员（第三判 C）**：A / B 分歧时触发（§2.10.1 合成）；字段同构。**必备**——缺 ⇒ 装载即拒（「分歧无仲裁」跑法不存在） |
| `provider`（各位） | ✅ | 用户 `~/.thincoder/config.json` 的 `providers[].name`（**只存名字，不存密钥**） |
| `model`（各位） | ✅ | 判官模型 ID（= 判分口径的版本字面，入档） |
| `maxTokens` / `timeoutSec`（各位） | ✅ | 预算与超时（区间校验见 §2.10.1，**逐位校验**，越界 ⇒ 装载即拒） |
| `note` | 可选 | 备注（随报告概览展示） |

**落点 = `bench/judge.json`（拟新增 · 单职责数据档）**：判官不是被测条目——不落 `models.json`（否则 `selectEntries` / `--models` 会把它当选测模型）；不立通用配置档（被否：仅一类配置，过度抽象）；**槽位定身份**（A / B / 仲裁 C 由位序与键决定，文件不存 `id`——冗余字段可漂移）。
**判官必备（射程 = 三槽）**：文件缺失 / schema 不合 / provider 不在用户 config / **A=B** / **仲裁员 ∈ {A, B}** ⇒ **拒绝启动**（不存在「无判官跑法」「无仲裁跑法」——同一 suiteVersion 只有一种判分口径；`--dry-run` 用夹具判官身份，`--recompute` 只读档内记录）。
**无判官面 run**（如 `--dims code,json`——选中用例全部无判官声明的场景）：判官配置**仍须齐备并校验**（不存在「无判官跑法」），顶层 `judge` 块照写（配置快照 = 判分口径自述）；判定面计数为 0。
**独立性校验（AC-3 · 逐位 ×3）**：① 任一位**（A / B / 仲裁 C）**的 `provider:model` ∈ **本次运行的被测集合** ⇒ **拒绝启动**（退出码 1，点名位次与冲突条目）——判分器（含被测模型的分歧仲裁）不得判自己的输出；② 任一位的 provider 与被测任一条目**同渠道**（异 model）⇒ 允许但**必须明示**：该位 `sameVendorAsTested = true` + `warnings` 一条 + 报告判官行该位标注（「不得静默用被测同家模型」）。
**判官对身份校验（AC-13 · 机检）**：③ **A ≠ B**（`model` 字面不同——同模型双判无冗余）⇒ 违约拒跑；④ **仲裁员 ≠ A 且 ≠ B**（`model` 字面不等——同模型仲裁 = 复读票，无打破平局的价值）⇒ 违约拒跑。两检均只认**字面**：同模型异名（如 `kimi-k3` / `k3`）机检不可判——配置纪律 = 三槽取实质不同模型。A / B 是否同渠道**不作校验也不告警**（不涉独立性——独立性只约束判官 vs 被测；共因故障由合成 fail-closed 显影：有效判 < 2 ⇒ run `error`）。
**冻结绑定（§1.6 裁定 · 射程扩 · D4）**：判官 = 判据的一部分 ⇒ **任一位判官（A / B / 仲裁 C）的模型 / 判官提示模板 / rubric 任一变化 ⇒ `SUITE_VERSION + 1`**（rubric 与模板住源码，随既有规则走）。机制闸：运行开始时断言 `judge.json.frozenAtSuiteVersion === SUITE_VERSION`，不等 ⇒ **拒跑**并提示「判官配置已换代：确认 bump SUITE_VERSION 后同步本字段」——把「判官换代 = 判分口径换代」变成机检面。

#### 2.10.4 降级口径（AC-6 · 禁静默回退）

| 面 | 情形 | 处置 |
|---|---|---|
| 启动面 | 配置缺 / schema 不合 / provider 缺 / 独立性违约（A / B / C 任一位）/ 判官对身份违约（A=B · 仲裁员 ∈ {A, B}）/ 冻结版本不匹配 | **拒跑 · 不落档 · 退出码 1** |
| 运行面 | 位级失败（超时 / HTTP / 两次解析失败）致**合成无多数**：有效判 < 2 · 或分歧未决（第三判无效） | 该 run `verdict = error`（detail 前缀「判官不可用」+ 括注成因「有效判不足」/「分歧未决」+ `runs[].judge.verdict = "error"` + `resolution = "none"`）· 控制台**即时**明示一行 · 报告告警计数（成因分列）；**不回落词表、不补位、不单判回退** |
| 运行面全灭 | 本轮进入判官面的 run 数 > 0 且**全部**合成无定判 | 照常落档（模型数据已付费；档内 error 明示）+ **退出码 1**（基建故障信号） |

`error` 的区分呈现（§1.6 裁定点）：判官不可用 = run `error` + `runs[].judge.verdict = "error"` + `resolution = "none"` + detail 前缀（成因括注）；被测接口错误 = run `error`（detail 为接口错误文本）——报告告警行分列计数（「判官不可用 M 次（有效判不足 m₁ · 分歧未决 m₂）」）；位级失败**逐位留证**：失败位的 `judges[]` 条目照记（`verdict = "error"` + 成因）。
被否候选（本轮增）：③ 位级失败 ⇒ **仲裁员补位**（凑足双判后定判；被否：把「判官坏了」的系统性故障掩盖成正常判定 + 成本不可预期——一位全灭则每个样本多付一判；fail-closed 的可见性优先）；④ 分歧 ⇒ 取 A（主位）票（被否：单判等价——B 成本 +100% 而判定力零增益）；⑤ 分歧 ⇒ 直接 `error` 不仲裁（被否：分歧是判官质量的正常信号而非故障——降为 error 会让语义面系统性空洞化，且分歧样本的第三判成本极低）。
被否候选（沿既有）：① 首次失败即中止整轮（被否：一次网络抖动作废整轮被测成本；全灭判据已拦系统性故障）；② 新增 `verdict` 枚举值（被否：为已由子记录承载的区分改动全链聚合/枚举/渲染，收益不成比例）。

#### 2.10.5 成本分账（AC-4 / AC-10 · 射程扩至判官对 · D6）

- 单价**同源** `prices.json`（按**各判官位**的 `provider:model`（A / B / 仲裁 C）走 §2.5 匹配与计算式；缺价 ⇒ 成本 `null` + 警告——**不估不转写**）。
- 口径（冻结）：**×2**——每个进入判官面的样本付 A + B 两判；**分歧样本 ×3**——追加仲裁 C。位级成本摊到 `runs[].judge.judges[].calls[]`（逐尝试）。
- 记账面 = `runs[].judge.judges[].calls[]` + `models[].aggregate.judgeCostCny`（该模型位 A+B+C 合计）+ 顶层 `judge.judges[].costCny`（逐位）/ `judge.arbiter.costCny` / `judge.costCny`（合计）；**不进** `runs[].metrics.cost` / `aggregate.costCny`（被测成本面零污染——口径不变，射程扩）。
- 报告：成本表「判官成本」列 = **三位合计**、「复核成本」列单列（**不参与相对成本归一化**——基准恒为被测每通过任务成本）；概览判官行给**逐位拆分**（A / B / C）。
- `--recompute`：判官 / 复核成本随当前 `prices.json` 一并重算（档内**逐位**逐尝试 tokens = 原子账目，§2.7 结构保证不变）。
- 价格表孤儿判据（`bench/test/suite.test.mjs`）扩为「命中在册条目 **或** **任一位判官键**」。
- 被否候选：成本表按判官位拆三列（被否：表宽 + 归因面重复——概览判官行已逐位分列，成本表的行身份是被测模型）。

#### 2.10.6 元数据入档（AC-5 · 射程扩至判官对 · D4）

顶层 `judge` 块（§2.2-7）：`promptVersion`（判官提示模板版本）/ `frozenAtSuiteVersion` + **逐位**（`judges[0|1]` = A / B · `arbiter` = C）：`provider` / `model`（版本字面）/ `host` / `temperature` / `maxTokens` / `timeoutSec` / `sameVendorAsTested` / `calls` / `costCny`；
合计 = `judgeCalls` / `costCny`；分歧面计数 = `agreements` / `disagreements` / `arbitrations` / `unavailable`；复核 = 顶层 `review` 块（`calls` / `costCny`——账目主位；`judge` 块不双写）。
**时点** = 逐位逐调用 `calls[].at`（ISO 本地）；**任一位换代 ⇒ `SUITE_VERSION + 1`**（§2.10.3 冻结绑定）。报告呈现 = 概览判官三行 + 分歧率 + 方法行（模板版本）。

### 2.11 机械 fail 复核（第二只眼 · §1.7 / §1.8 裁定）

- **触发（冻结）**：`run.verdict === "fail"` ∧ 该 fail **非判官裁决**（`runs[].judge.verdict !== "fail"`——含「未调判官」与「判官判 pass 但机械面 fail」）∧ 用例有机械判据面（`mechRubric` 声明）。`error` / `skipped` 不触发；**判官裁决的 fail 不叠加复核**（禁判官叠判官）。
- **输入**：题面（`judge.question` ?? `prompt`；多轮题 = 逐回合用户文本的声明式拼接）+ **机械判据条文**（`mechRubric`）+ 响应观测（逐回合模型文本 + 各回合工具调用事实 `name` / `arguments`）+ **机械失败断言**（该 run 的 `detail`）。素材全部取自该 run 的真实观测（POC 教训①纪律同源）。
- **输出契约**：`{"verdict": "uphold" | "overturn", "reason": "…"}`；严格解析 / 预算 / 放大预算重试 / fail-closed 与 §2.10.1 同一套机制（复核模板 `promptVersion` 独立计入 `review.promptVersion`）。
- **处置（用户 2026-09-24 01:08 裁定 = 候选一）**：`uphold` ⇒ fail 维持；`overturn` ⇒ **不自动改 pass**——独立分类「**复核翻案**」（机械 fail 有规则依据），`run.verdict` 仍为 `fail`、**不计入 pass 计数**；正确处置 = 修题面/判据（走 `SUITE_VERSION + 1`）+ 进判据演进清单（§2.12）。被否候选（以复核为准改判 pass）：把辅助信号升格为判据（判分口径两级真理），且把题面/判据缺陷掩埋为「已修好」。
- **复核失败**：调用失败 ⇒ fail 维持（复核为辅助信号：不改判、不把 run 降为 `error`）+ `runs[].review.verdict = "error"` + 告警计数。
- **呈现（裁定 01:08 之 ③）**：结果 JSON = `runs[].review` + `aggregate.reviewCostCny` / `aggregate.overturns` + 顶层 `review` 汇总；逐维明细 = 判定单元格 `⟲` 标记 + 复核行（复核 N 次 / uphold u / 翻案 o + 翻案理由）；
  能力矩阵 = 通过数**不变**、存在翻案的模型×维追加 `⟲` + 脚注；结果区新增 `### 复核翻案（判据演进线索）` 小节（用例 · 模型 · 机械失败断言 · 复核理由）；关键发现告警行含「机械 fail 复核 N 次（翻案 K 次）」。细节渲染样式 = §2.3。
- **成本**：仅 fail 触发；独立记账（口径同 §2.10.5，报告列独立）。
- **判位数裁定（本轮 fix · D2 同步面）**：复核**保持单判**（沿判官 A 位的模型 / 会话 / 价格）。理由：① 复核是**辅助信号**——不改判、不计 pass、不阻断退出码 ⇒ 双判的收益面（模型视角冗余）在判定效力上无处兑现；
  ② 复核的对照轴 = **机械 vs LLM**（KD-18），不是模型 vs 模型 ⇒ 第二个 LLM 观点不改变「机械判据是否自洽」的问题面；③ 复核素材（机械失败断言 + 逐回合观测）比判官素材更有据、问题面更窄 ⇒ 单模型足够；
  ④ 双判复核会引入「无多数」失败面，而复核没有 `error` 降级可走（不改判）⇒ 语义复杂化零收益。被否候选：复核同双判（被否：见左①–④——成本 +100% 而判定面零变化）；复核由仲裁员 C 承担（被否：C 位价格 / 服从性未验，且复核触发面（机械 fail）与仲裁触发面（判官分歧）混在一槽，成本与失败归因变浑）。

### 2.12 判据演进清单（`overturn` 的去处）

复核翻案的**证据面** = 每轮报告的《复核翻案》小节 + 结果 JSON 的 `runs[].review`（机读）；跨轮汇总 = 报告并列；「清单」的**处置面** = 后续批次修题面 / 判据（`SUITE_VERSION + 1`）。**不另立清单档**（第二真相源 + 与报告重复）。被否候选：独立清单档（被否：报告已逐轮承载同一证据，独立档必然漂移）。

## 3. 受影响文件清单（含行数预算）

**2026-09-23 建档批（`2026-09-23-model-bench`）**：全部为新增档；存量档仅地图登记一处（`docs/README.md`：登记本档 + 计数收正，±3 行——**已随批落地，勿重复应用**）。三端产品树（`thincoder-core/` · `thincoder-cli/` · `thincoder-vscode/`）**零改动**。
下表各行为该批已实现档（2026-09-23 实施轮创建；实读行数以批次档 §5.1 表为准）：

| 文件 | 现状 | 预算 | 说明（拆分触发 = 超 300 行） |
|---|---|---|---|
| `bench/README.md`（已实现） | 0 | ~140 | 快速开始 + 五口径 + **复跑工作流**（三场景 + 何时复跑 + 跨时点对比须知）+ 结果解读 + 维护（models/prices）+ 边界 |
| `bench/run.mjs`（已实现） | 0 | ~250 | CLI 解析 / 编排 / 进度输出 / 退出码 / dry-run（夹具固定响应表内联于此档）+ recompute 分支（超 300 ⇒ 拆 `lib/pipeline.mjs`） |
| `bench/models.json`（已实现） | 0 | ~40 | 参测清单（数据档） |
| `bench/prices.json`（已实现） | 0 | ~40 | 价格表（数据档） |
| `bench/cases/index.mjs`（已实现） | 0 | ~70 | `SUITE_VERSION` + 维度注册表 + 轴定义 |
| `bench/cases/reasoning.mjs`（已实现） | 0 | ~70 | 3 例 |
| `bench/cases/code.mjs`（已实现） | 0 | ~170 | 3 例 + 隐藏用例断言集（AC-5） |
| `bench/cases/json.mjs`（已实现） | 0 | ~100 | 3 例 |
| `bench/cases/tools.mjs`（已实现） | 0 | ~150 | 4 例（含工具 schema 与桩的装配） |
| `bench/cases/instructions.mjs`（已实现） | 0 | ~120 | 3 例（约束表驱动） |
| `bench/cases/multiturn.mjs`（已实现） | 0 | ~120 | 3 例（脚本化第二轮 / 代决边界） |
| `bench/cases/longctx.mjs`（已实现） | 0 | ~90 | 3 例（长文构造调用 `lib/haystack.mjs`） |
| `bench/cases/vision.mjs`（已实现） | 0 | ~95 | 3 例（PNG 构造 + 颜色词表 + 拒答） |
| `bench/cases/manual.mjs`（已实现） | 0 | ~50 | 3 条（不判分） |
| `bench/lib/client.mjs`（已实现） | 0 | ~140 | `chat` 封装 + 工具环 + per-call 计时 |
| `bench/lib/tools.mjs`（已实现） | 0 | ~90 | 本地工具桩 + 工具 schema |
| `bench/lib/grade.mjs`（已实现） | 0 | ~150 | 判分器族（纯函数） |
| `bench/lib/metrics.mjs`（已实现） | 0 | ~90 | ttft / tok_s / 中位 / 聚合 |
| `bench/lib/prices.mjs`（已实现） | 0 | ~80 | 装载 + schema 校验 + 匹配 + 成本式 |
| `bench/lib/roster.mjs`（已实现） | 0 | ~70 | 装载 + 校验 + 解析（label / 复合键 / 维度面） |
| `bench/lib/report.mjs`（已实现） | 0 | ~260 | md 骨架渲染 + 三表 + 发现 + 局限（超 300 ⇒ 拆 `lib/report-tables.mjs`） |
| `bench/lib/sanitize.mjs`（已实现） | 0 | ~70 | 脱敏谓词 + 写档断言（报告与 JSON 共用） |
| `bench/lib/haystack.mjs`（已实现） | 0 | ~60 | 确定性长文生成（固定语料 + 定种子） |
| `bench/lib/png.mjs`（已实现） | 0 | ~70 | PNG 生成（`node:zlib` deflate + 手写 CRC32）→ data URL |
| `bench/test/graders.test.mjs`（已实现） | 0 | ~150 | 判分器正常 + 反例（含「硬编码公开例」反例） |
| `bench/test/metrics.test.mjs`（已实现） | 0 | ~90 | 计时/中位/成本式（逐档单价 × token） |
| `bench/test/suite.test.mjs`（已实现） | 0 | ~90 | 注册表自检（id 唯一 / 类齐 / 隐藏用例 3–5 / 清单与价格 schema） |
| `bench/test/report-recompute.test.mjs`（已实现） | 0 | ~240 | §5.10 六条用例全承载 + dry-run 产物断言（AC-2）+ 报告骨架 + 脱敏断言 + **离线重算零网络**（毒化 fetch）；夹具内联于此档 |

测试面说明：`bench/test/` **不进任何 `npm test` / CI**（AC-8）——手动跑 `node --test bench/test/*.test.mjs`；本批实施轮验证 = 该命令 + 一次真实冒烟跑（1 模型 × 1 维，验证 AC-1/2/3/9 端到端）。`bench/results/` 目录随首次运行创建，产物（md + json 对）**入库留档**。
**夹具落点（冻结）**：全部夹具为**内联夹具**，不另立夹具档（本表 28 档不变）——`--dry-run` 的固定响应表住 `bench/run.mjs`（已实现）；§5.10 的夹具结果 JSON 族（基准 / `tokens: null` / 损坏 / 毒化四变体）与「改价后的 `prices.json`」住 `bench/test/report-recompute.test.mjs`（已实现）；需要文件输入形态时由测试落临时档（不入仓）。

**2026-09-24 判分升级批（`2026-09-24-judge-hybrid`）受影响文件与行数预算**（现状 = 2026-09-24 实读行数 · 含 fix 轮双判 / 题面增量；三端零改动不变；本批不新增夹具档——夹具仍内联）：

| 文件 | 现状 | 预算 | 说明（拆分触发 = 超 300 行） |
|---|---|---|---|
| `bench/lib/judge.mjs`（拟新增） | 0 | ~265 | 判官对/仲裁/复核会话：`judge.json` 装载 + schema 与身份校验（A≠B · 仲裁员第三方 · 逐位独立性 / 冻结，fail-closed）· provider 条目构造（克隆 + 覆写，§2.9-1）· 核 `chat` 调用（经 `liveTransport`）· 超时 · 解析失败放大预算重试一次 · **A / B 并行发起 + 合成（一致 / 第三判仲裁 · 多数决 / 无多数 ⇒ error）** · **分歧计数** · 逐位逐尝试记账（tokens / cost / at）· 判官与复核两版提示构建 + 严格解析（各自 `promptVersion`） |
| `bench/judge.json`（拟新增 · 数据档） | 0 | ~26 | 判官对（A / B）+ 仲裁员（C）身份与预算（§2.10.3） |
| `bench/lib/grade.mjs` | 288 | ~245 | 增：`{ error }` 结果通路 + 判官结果合成件；删：语义词表件（`keywordSet` / `COLOR_FAMILIES` / `colorMatch` / `countEnumerations` + `enumerateCount` 规则——判官化后零调用者）；`numEquals` / `vmRun` / `strictJson` / `jsonFields` / `toolShape` / `parseToolArgs` / `textRules` 其余规则**行为零改动** |
| `bench/lib/pipeline.mjs` | 279 | ~295 | 判官会话装配 + judge / review 记录（合成分 + 分歧计数落盘）+ 题面采集（`cases[].prompt`）+ `error` 通路 + 合成全灭退出码；**拆分触发条件**：超 300 行 ⇒ `recomputeMain` + `validateResultShape` → `bench/lib/recompute.mjs`（拟新增 ~70 行）· `writePair` / `refuseIfExists` / `isoLocal` / `displayPath` → `bench/lib/output.mjs`（拟新增 ~50 行） |
| `bench/lib/prices.mjs` | 142 | ~175 | 判官 / 复核成本应用与聚合（同一成本式；缺价 / 缺 usage 纪律同源） |
| `bench/lib/report-tables.mjs` | 239 | ~300 | 成本表两列 + 逐维明细（**题面行** + 逐位判官行 / 复核行 + `⟲` / `⇄` 标记）+ 《判官分歧》小节 + 分歧率 + 《复核翻案》小节（超 300 ⇒ 拆 `bench/lib/report-review.mjs`（拟新增 ~70 行：分歧 / 复核两小节 + 标记渲染）） |
| `bench/lib/report.mjs` | 162 | ~185 | 概览判官三行 + 分歧率 + 方法判分条 + 告警计数（含分歧 / 未决）+ 局限两条 |
| `bench/cases/index.mjs` | 61 | ~72 | `SUITE_VERSION` 2 → 3；判官面 / 机械面集合导出（§2.10.2 分层表机检素材） |
| `bench/cases/{reasoning,instructions,tools,multiturn,longctx,vision}.mjs` | 50 / 55 / 94 / 86 / 81 / 67 | 净增 ~10–25 / 档 | 判官声明 + `mechRubric` + 判据改写（删词表 / 正则）；`tools.4` 同轮并行要求落题面（§5.12） |
| `bench/cases/{code,json}.mjs` | 63 / 64 | 各 ~+8 | `mechRubric` + json 题面补词（判据零改动） |
| `bench/run.mjs` | 188 | ~205 | dry-run 夹具增判官对 / 仲裁 / 复核响应表（`FIXTURE.judge` = A / B / C 三脚本 · `FIXTURE.review`）+ 用法文本 |
| `bench/README.md` | 122 | ~165 | 判官对配置（A≠B · 仲裁员）与逐位独立性 / 分歧合成口径 / 复核口径 / 题面入档 / 判据分层速览 |
| `bench/test/judge.test.mjs`（拟新增） | 0 | ~265 | 桩传输测试（**不触网**）：解析 / 放大预算重试 / **双判一致 / 分歧仲裁 / 单判官失败 / 无多数** / A≠B 与仲裁员身份 / 逐位独立性 / 冻结 / 逐位成本记账 / 复核触发与不改判 / 渲染面断言 |
| `bench/test/graders.test.mjs` | 146 | ~120 | 删被删函数用例；增判官结果合成件用例 |
| `bench/test/suite.test.mjs` | 161 | ~200 | 判官面 / 机械面集合 = 冻结清单；`judge.turn` / `rubric` 齐；多轮 `question` 含 `followUps`；`judge.json` schema = 三槽 + A≠B + 仲裁员第三方；价格孤儿判据扩「或任一位判官键」 |
| `bench/test/report-recompute.test.mjs` | 300 | ~330 | 判官逐位成本随新价重算 + 题面行渲染 / 截断 + 分歧面渲染（`render.1–3`）；**拆分触发条件**：超 300 行 ⇒ 拆两档（`recompute.test.mjs` ~135 = 重算面；`report-render.test.mjs` ~140 = 渲染 + dry-run 产物断言），夹具提取至 `bench/test/fixtures.mjs`（拟新增 ~50 行） |
| `bench/results/` | 0 对 | +1 对 | v3 重跑报告对（**唯一在档** · 实施轮 · AC-7） |
| `docs/core/design/MODEL-BENCH.md` | 505 | 就地更新 | 本档（§1.3 口径 2 / §2.2–2.3 / §2.10–2.12 / §5.11–5.13 / §6 / §7 / §9 为本轮面） |

## 4. 关键决策记录（含被否候选）

| # | 决策 | 理由 | 被否候选 |
|---|---|---|---|
| KD-1 | 调模型**复用核 provider 路径**（`thincoder-core/provider/index.mjs` 的 `chat` + `config.mjs` 的 `loadConfig` / `parseModelRef`） | ① 请求构造保真：thinking 映射 / `enable_thinking` / effort 门控 / 多格式 transport（anthropic/google）即用户真实所见——基准比较的对象是「产品里可用的模型表现」；② usage 归一（含 cached 命中）与 SSE 解析零重写；③ 零新风控面（重试/限流/续写随核演进）；④ 维护面最小（不维护第二套协议栈） | ① 自写薄 OpenAI client（被否：复制 SSE/鉴权/重试约 200 行且与核漂移；测量对象退化为「裸端点」而非产品路径）；② 半复用（自写 fetch + 复用 `readSSE`）（被否：请求体组装仍须重写 thinking/effort 映射，得失不成比例） |
| KD-2 | `SUITE_VERSION` = **单源整数常量**（`bench/cases/index.mjs`（已实现）），改题/改判据/改计时口径即 +1；价格变动**不** bump（另记 `prices.asOf`） | 手写可读、跨档可比判据单值；题集与价格是两条独立时轴 | 日期式 `2026-09-23.1`（被否：一次改题多次日期跳变的比较语义模糊）；内容哈希（被否：不可人工预判、评审不可读） |
| KD-3 | 隐藏用例机制 = **题面只给公开 1 例 + 隐藏断言住在判分器**（3–5 例/题，冻结于 §5） | 防硬编码（读题面即知判据的模型拿不到分）；隐藏例随判分器版本冻结 ⇒ 可复现 | 随机生成隐藏例（被否：不可复现，破跨时点可比）；隐藏用例另存外部文件（被否：无必要，判分器即载体） |
| KD-4 | `models.json` 维度面 = **两个显式字段**（`dims` 白名单 / `skipDims` 黑名单） | §1.9 原文并列「跳过/限定」两种语义；拆两字段后每条义单一可机检（`—` 与 `fail` 不混） | 单字段双语义（被否：一条 `dims` 无法同时表达排除与限定，必然歧义）；维度面由 CLI 每次指定（被否：清单文件应自包含） |
| KD-5 | 清单与价格**对齐键 = `provider:model`**；`label` 仅展示名 | 价格随渠道（provider 条目）变——`provider:model` 与调用面一一对应；`label` 可改而无副作用 | 纯 `label` 键（被否：改名即断价）；纯 `model` 键（被否：同模型多渠道路径价格不同） |
| KD-6 | 成本缺失（无价 / 无 usage）记 `null` + 脚注，**不估算**；`prices.json` schema fail-closed | 与「delta 近似禁用」同源：可比性建立在精确账目上；估算会把口径漂移藏进数字 | 用 delta 数分片近似 token（被否：已证各家分片粒度不同、失真）；按字符数估 token（被否：同因） |
| KD-7 | TTFT = 首个**非空** delta（content 或 reasoning 先到者）− 调用发起 | 核路径上唯一可观测的「模型开始输出」时刻（`thincoder-core/provider/sse.mjs:142-149` 只在非空 delta 回调）；空 role 块不携模型产出，不具比较意义 | 自写 client 取「首个 HTTP 字节」（被否：见 KD-1；且首字节常为路由/空块，跨渠道噪声更大）；首 content token 才计（被否：思考型模型会把思考时间挤进 tok/s 分母，口径不可比） |
| KD-8 | 报告**成对留档 + 写档前脱敏断言**（构造性白名单 + fail-closed 断言双保险） | AC-9「可发布」= 结构完整 + 无路径/凭据泄漏；断言把「忘了脱敏」变成硬失败 | 只靠构造（被否：单点失误即泄漏上档）；事后人工核（被否：不可机检） |
| KD-9 | 人工 lane 独立：不判分、不入矩阵/成本归一化、不阻塞退出码 | AC-6；中文歧义本身无客观判据，只做证据保留 | 用 LLM-as-judge 打分（被否：§1.5 边界明令不做） |
| KD-10 | 覆盖保护 = 同名拒写（无 `--force`） | 留档不可被静默覆盖；删旧档 = 人工显式动作 | `--force` 旗标（被否：V1 无必要，破坏留档直觉）；自动改名（被否：文件名会漂移，跨档对比难） |
| KD-11 | `bench/test/` 存在但**不进 CI**（AC-8） | 判分器/成本式/脱敏是有判断语义的代码，需开发期回归；CI 面按用户边界零改 | 全不测（被否：判分器是核心资产，回归无保护）；进 CI（被否：AC-8 明令不进） |
| KD-12 | 判官面落点 = **独立档 `bench/lib/judge.mjs`（拟新增）**（判官 + 复核共用会话） | ① `grade.mjs` 的档内契约（「纯函数 · 无网络」）是判分器族的根基（§2.6）；判官/复核两套提示 + 解析 + 传输 + 记账 ≈ +120 行 ⇒ 该档必然超 300 行触发拆分；② 判官面自成一档 = 网络 / 配置 / 记账面与确定性原语分档（可单测、可 mock） | 塞进 `bench/lib/grade.mjs`（被否：破档不变量 + 顶破 300 行线）；判官逻辑内联进 `pipeline.mjs`（被否：编排档不该兼判据实现） |
| KD-13 | 判官身份配置 = **独立数据档 `bench/judge.json`（拟新增）** | 判官不是被测条目（`models.json` 的语义 = 参测清单，`selectEntries` / `--models` 会把它当选测项）；单职责数据档与 `models.json` / `prices.json` 同构（配置 = 数据，改配置不改码） | 落 `models.json`（被否：语义混淆 + 独立性校验要排除自身条目）；通用配置档（被否：仅一类配置，过度抽象）；写死源码常量（被否：换判官要改码，AC-3 要求可配置） |
| KD-14 | **判官必备**（缺 ⇒ 拒跑），不做「无判官跑法」 | 同一 suiteVersion 只能有一种判分口径——按选中维度懒加载或缺失即跳过语义面 = 同一版本两种判据面（静默降级） | 判官可选 / 缺省跳过语义面（被否：口径分裂 + 静默降级）；缺判官回退词表（被否：批次边界明禁——回退即假阴回归） |
| KD-15 | 判官 = **判官对（A / B）双判**；分歧 ⇒ **第三判（仲裁员 C）· 多数决**；合成无多数 ⇒ run `error`（fail-closed） | 用户 2026-09-24 01:26 裁定（推翻 V1 单判）：单模型视角偏差是单判的固有风险，双判把它从「不可见」变成「可计数」（分歧率）；分歧样本付第三判 ⇒ 冗余成本只对分歧付（×2 → 分歧 ×3）；「同模型双判无冗余」（D1）⇒ A≠B 机检 + 仲裁员第三方（≠ A / B）机检；确定性路径 = 多数决（3 票二元无平局），任何无多数路径 ⇒ `error` 不猜（D3）；POC 的 5 条样本全为「判准」案（无判官错误样本）⇒ 判官能力有证、判官误判率无证——双判的收益（分歧显影）本身需跑起来才有数据（首轮 v3 即产出分歧率） | ① 单判（原 KD-15 述；POC 5/5 判准为证据。被否：POC 无判官错误样本 ⇒ 单点误判不可见）；② 双判一致即定 · 分歧取 A（主位）票（被否：单判等价——B 成本 +100% 而判定力零增益）；③ 双判一致即定 · 分歧 ⇒ `error`（被否：分歧是判官质量信号而非故障，降 error 让语义面系统性空洞化）；④ 双判 + 人工裁决分歧样本（被否：破「一条命令跑通」与可复现）；⑤ 双判同模型（被否：同模型双判无冗余——D1 原文） |
| KD-16 | 语义面词表 / 正则**全废**（不留快通道） | ① 假阳面词表自除不了（「左上角不是红色」命中「红色」即误 pass）；② 快通道 = 同一用例两种判法（口径两级、审计复杂化）；③ 成本证据表明省这笔钱无意义（¥0.0006/判） | 快通道「命中即定 / 未命中问判官」（被否：见左三理由） |
| KD-17 | 复核 = 独立分类「**复核翻案**」，**不自动改判**（用户 01:08 裁定） | 机械 fail 有规则依据，复核是辅助信号（第二只眼）；翻案的正确处置 = 修题面/判据 + 进判据演进清单；自动改判会把题面/判据缺陷掩埋成「已修好」 | 以复核为准改 pass（被否：辅助信号升格为判据，判分口径两级真理） |
| KD-18 | 复核与判官 **A 位**共用同一模型 / 会话 / 价格（双判下沿 A 位——§2.11） | 「第二只眼」的对照面 = 机械 vs LLM（非模型 vs 模型）；共用 ⇒ 配置 / 独立性 / 价格 / 元数据面单源；分设两模型 = 加倍配置与失败面，而复核仅为辅助信号 | 独立复核模型（被否：收益不成比例）；复核走第二家（被否：同因） |
| KD-19 | 判官换代绑定 `SUITE_VERSION`：`judge.json.frozenAtSuiteVersion` 机检闸 | 判官 = 判据的一部分 ⇒ 换代 = 判分口径换代；只记 `judge.model` 而不 bump ⇒ 跨版本报告「看似可比」实则标准已换 | 只记模型不 bump（被否：可比性假象）；判官 key 写进 `bench/cases/index.mjs` 常量（被否：AC-3 要求可配置） |
| KD-20 | `runs[].judge` / `runs[].review` **缺省不写**（不写 null 占位） | 「未发生」与 null 不可分 ⇒ 写 null 会让旧档 / 机械 fail / 判官 fail 三类记录混淆 | 写 null 占位（被否：见左）；新枚举值 `judge_error` / `overturn`（被否：为已由子记录承载的区分改动全链聚合/枚举/渲染） |
| KD-21 | 判官 / 复核成本**不并入**被测成本与相对成本归一化 | AC-4 明禁污染；判官是共用基础设施（复现一次报告的必需开销），与被测模型的性价比不是同一物理量 | 并入总成本（被否：AC-4 明禁；相对成本将随判官换代跳变） |
| KD-22 | 判官输入**只喂三段**（题面 / rubric / 该回合响应原文），不喂对话历史、工具事实、图像 | POC 教训①（喂错素材比判错更坏）⇒ 素材面最小化 + 单取值点；图像不入判官 = 判官可选池不受多模态能力约束（rubric 载明事实正本） | 喂完整对话历史（被否：素材噪声 + 成本 + 回合错配面）；喂图像给多模态判官（被否：收紧判官可选池，收益 = 0——rubric 已载明事实） |

## 5. 用例表（题面冻结正本 · 逐例）

**判分器约定**：判据面 = 机械断言 ∪ 判官裁决（§2.10.2 分层表）；机械判据为确定性断言，判官按 §5.11 rubric 裁决；`detail` ≤200 字符随档记录（判官理由 ≤300 字符入 `runs[].judge.reason`）。题面逐字冻结（实现档逐字复制；改题 ⇒ `SUITE_VERSION + 1`）。
**题面列口径（冻结 · 本批新增）**：「输入（题面）」列**逐字 = 实际发送串**——一切设计侧注记（测点口径 / 陷阱说明 / 工具集说明等）一律外置到「期望与判据」列、节前说明或专列（人工 lane = 「测点」列），**题面内不得出现**；实现档 `prompt` 字段同受此约束（机检 = §5.13 `prompt.1` / `prompt.2`）。

### 5.1 推理 `reasoning`

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `reasoning.1` | 正常 | 不使用计算器，计算 7^123 的个位数。只回答一个数字。 | 答案 3；判据 = `numEquals(text, 3)`（独立成词） |
| `reasoning.2` | 边界 | 计算 17^5 与 2^20 的差。只回答整数。 | 答案 371281（17^5=1419857，2^20=1048576）；判据 = `numEquals(text, 371281)` |
| `reasoning.3` | 错误（前提陷阱） | 9 是质数，请把它分解为两个质因数之积。只输出算式。 | 正确 = 指出 9 非质数 **或** 给出 3×3；判据 = **判官**（rubric = §5.11 `reasoning.3`；题面「只输出算式」为陷阱设计，两形态均接受） |

### 5.2 代码 `code`（隐藏用例 · AC-5）

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `code.1` | 正常 | 用 JavaScript 实现函数 `chunkEven(arr, size)`：把数组按 size 切分为多个子数组并返回二维数组；`size` 小于 1 时抛出 `RangeError`。公开例：`chunkEven([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]`。只输出函数代码，不要示例调用与解释。 | 判据 = `vmRun` 实跑 5 条**隐藏**断言：`size=1` → 每元素一组；`size > arr.length` → `[arr]`；`[]` → `[]`；`size=0` → 抛 `RangeError`；`size=-3` → 抛 `RangeError` |
| `code.2` | 错误（修 bug） | 给出带缺陷实现（两处缺陷：循环从下标 1 起 ⇒ 漏首元素；`> 0` 过滤 ⇒ 丢负偶数）：`function sumEven(nums){ let t=0; for (let i=1; i<nums.length; i++){ if (nums[i]%2===0 && nums[i]>0) t+=nums[i] } return t }`——语义 = 求数组中所有偶数之和。题干：下面的函数在边界输入下行为不正确，请修复并只输出修复后的完整函数代码。 | 判据 = `vmRun` 实跑 5 条**隐藏**断言：`[2,3,4]`→6；`[]`→0；`[1,3]`→0；`[0]`→0；`[-2,5]`→−2 |
| `code.3` | 边界 | 用 JavaScript 实现函数 `parsePairs(text)`：`text` 形如 `"a=1;b=2"`，返回 `{a:"1", b:"2"}`；规则①空串 → `{}`；②重复键 → 后者覆盖；③不含 `=` 的段 → 跳过；④值保持字符串。公开例：`parsePairs("a=1;b=2") → {a:"1", b:"2"}`。只输出函数代码。 | 判据 = `vmRun` 实跑 5 条**隐藏**断言：`""`→`{}`；`"x=1;x=2"`→`{x:"2"}`；`"a=1;;b=2"`→`{a:"1",b:"2"}`；`"k="`→`{k:""}`；`"n=007"`→`{n:"007"}`（字符串保真） |

隐藏用例纪律：公开例仅 1 条；隐藏断言只住判分器（题面零泄漏）；断言数 3–5 逐题登记。

### 5.3 严格 JSON `json`

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `json.1` | 正常 | 只输出一个 JSON 对象（不要代码围栏、不要任何解释）：字段 `name`（字符串）= "小明"、`age`（整数）、`tags`（字符串数组，至少 2 个元素）。 | 判据 = 整串 `JSON.parse` 成功（`str.startsWith("{")`）+ 字段类型与值断言 |
| `json.2` | 边界 | 只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`zip` 必须是字符串 "100001"（保持前导零）；`note` 必须为 `null`；`nested.items` 必须是长度 0 的数组；`escaped` 必须等于含一个双引号的字符串 `a"b`。 | 判据 = 整串 parse + 逐字段断言（字符串保真 / null / 空数组 / 转义） |
| `json.3` | 错误（类型陷阱） | 只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`status` 必须是小写字面 `empty`；`count` 必须是数字 0（不是字符串 "0"）；`items` 必须是空数组。这是空快照格式，不要填任何实际数据。 | 判据 = 整串 parse + `typeof count === "number"` ∧ `count === 0` ∧ `items.length === 0` ∧ `status === "empty"` |

### 5.4 工具调用 `tools`

工具 schema 与本地桩：`get_time()`（返回固定 `2026-09-23T22:00:00+08:00`）· `send_email({to, subject, body})`（记录调用，返回 "queued"）· `get_weather({city})`（北京=晴 26℃ / 上海=小雨 24℃）· `read_file({path})`（decoy，被测「不该调用」类）。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `tools.1` | 正常（单工具） | 用可用工具查一下当前时间，然后用一句话告诉我。 | 回合 1 `toolCalls[0].name === "get_time"`；`JSON.parse(arguments \|\| "{}")` 成功；工具结果回填后最终 content 非空 |
| `tools.2` | 正常（多步链） | 先用工具查当前时间，再把该时间作为正文，给 alice@example.com 发一封主题为「时间同步」的邮件。 | 回合 1 = `get_time`（机器）；回合 2 = `send_email` 且 `to` / `subject` 值断言（机器）；**`body` 时刻等价 = 判官**——与工具返回值同一时刻（「晚上十点」等等价表述接受，其他时刻 FAIL；rubric = §5.11） |
| `tools.3` | 错误（不该调用） | 请回答：一年有几个月？（工具集含 `read_file` decoy） | `toolCalls.length === 0` ∧ content 满足 `numEquals(text, 12)`——题面有意不写「不要用工具」（工具使用纪律 = 测试点，§5.12） |
| `tools.4` | 边界（并行双工具） | 请在同一轮里并行调用两个工具，分别查北京和上海的天气。 | 回合 1 的 `toolCalls.length === 2` ∧ 两个 name 均为 `get_weather` ∧ 参数 `city` 集合 = {北京, 上海}（机器）；**天气值传递 = 判官**（同时传达北京晴、上海小雨；rubric = §5.11）。该例传 `parallelToolCalls: true` |

工具回合的 assistant 消息按 `assistantToolCallMessage` 构造（reasoning 回显策略随核规格）。

### 5.5 指令遵循 `instructions`（IFEval 式）

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `instructions.1` | 正常 | 写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 "," 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。 | 判据 = 5 条全过（段落数 / 汉字计数 / 否定式 / 次数 / 首字符） |
| `instructions.2` | 边界 | 写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。 | 判据 = 5 条全过（句数 / 每句上限 / 含关键词 / 两条否定式） |
| `instructions.3` | 错误（约束冲突识别） | 请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。 | 正确 = 指出约束不可能同时满足（不得以违反任一约束的产出通过）；判据 = **判官**（rubric = §5.11 `instructions.3`） |

### 5.6 多轮澄清 `multiturn`（τ-bench 简化）

| id | 类 | 输入（题面 / 脚本） | 期望与判据 |
|---|---|---|---|
| `multiturn.1` | 正常 | 回合 1：帮我给团队发一封会议邀请邮件。（信息不全：无收件人 / 主题 / 时间）→ 回合 2（脚本补全）：收件人 team@example.com，主题「周会」，时间明天 15:00。 | 回合 1 = `toolCalls.length === 0`（机器）∧ **追问语义 = 判官**（是否请求缺失信息、未谎称已发送——rubric = §5.11）；回合 2 = `send_email` 被调用且 `to` 匹配（机器） |
| `multiturn.2` | 错误（过度澄清） | 回合 1：我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。 | `toolCalls.length === 0`（机器）∧ **候选语义 = 判官**（未提问 / 未要求补充 + ≥3 个互不相同、面向开发者、主题「快」的候选——rubric = §5.11） |
| `multiturn.3` | 边界（代决边界） | 回合 1：给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。 | 回合 1 内调用 `send_email`（任一 call；允许先经 `get_time` 等检索步）（机器）∧ **不追问语义 = 判官**（信息足够即代决——rubric = §5.11） |

### 5.7 长上下文 `longctx`（大海捞针）

长文构造 = `bench/lib/haystack.mjs`（已实现）确定性生成（固定语料 + 定种子；埋点位置按字符偏移固定）：填充文本 + 目标事实句 + （错误类）干扰句。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `longctx.1` | 正常 | 8K 字符长文；埋「服务 atlas 的监听端口是 49152」。问：文中提到的服务 atlas 的监听端口是多少？只回答数字。 | `numEquals(text, 49152)` |
| `longctx.2` | 边界 | 32K 字符长文；埋「服务 beacon 的监听端口是 57318」，另布置近邻数字干扰（57317、57310 等）。问句同上（服务 beacon）。 | `numEquals(text, 57318)` |
| `longctx.3` | 错误（新旧干扰） | 16K 字符长文：先出现「服务 helios 的历史端口是 40001（已废弃）」，后出现「服务 helios 当前监听端口是 42875」。问：服务 helios **当前**的监听端口是多少？ | `numEquals(text, 42875)`（机器）∧ **新旧区分 = 判官**（不得把 40001 表述为当前值；明示其为历史/已废弃的提及不算错——rubric = §5.11） |

### 5.8 视觉 `vision`

图片由 `bench/lib/png.mjs`（已实现）生成（64×64 / 32×32，手写 PNG：`node:zlib` deflate + CRC32；以 data URL 随消息发送）。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `vision.1` | 正常 | 64×64 四象限图（左上红 #ff0000 / 右上蓝 / 左下绿 / 右下黄）。问：图片被分成四个象限，请只回答左上角象限的颜色。 | 判据 = **判官**（左上角为红色族；红 / 红色 / 大红 / #ff0000 / red 等等价表述均接受——rubric = §5.11） |
| `vision.2` | 边界 | 32×32 纯色图（纯绿 #00aa00）。问：这张图是什么颜色？只回答颜色名。 | 判据 = **判官**（绿色族；绿 / 绿色 / #00aa00 / green 等等价表述均接受——rubric = §5.11） |
| `vision.3` | 错误（无中生有拒答） | 64×64 四象限图同 `vision.1`。问：图里有几只猫？ | 正确 = 指出图中没有猫 / 无法判断 / 明确拒答；判据 = **判官**（rubric = §5.11 `vision.3`） |

### 5.9 人工 lane `manual`（不判分 · AC-6）

| id | 输入（题面） | 测点 | 处理 |
|---|---|---|---|
| `manual.1` | 最近怎么样？ | 日常寒暄（无任务） | 只记录：响应摘要 + 指标；报告「人工判读」小节并列；**不入**能力矩阵 / 成本归一化 / 退出码 |
| `manual.2` | 帮我把那个东西改一下。 | 指代不明（无先行词） | 同上 |
| `manual.3` | 这个功能有点意思，你觉得呢？ | 对象不明（无上下文） | 同上 |

### 5.10 复跑与报告面用例（§2.7 / §2.3）

**承载档（冻结）**：六条用例的测试档 = `bench/test/report-recompute.test.mjs`（已实现）（逐条见下表「测试档」列）；夹具内联于该档（§3 夹具落点）。

| id | 类 | 输入 | 期望与判据 | 测试档 |
|---|---|---|---|---|
| `recompute.1` | 正常 | 用夹具结果 JSON + 改价后的 prices.json 跑 `--recompute` | 落新报告对（`<原标签>-recalc`）；成本列随新价变化；原档字节不变 | `bench/test/report-recompute.test.mjs`（已实现） |
| `recompute.2` | 边界 | 夹具 JSON 含 `tokens: null` 的 call（usage 缺失） | 该行成本 `—`；重算成功不崩；warnings 保留 | `bench/test/report-recompute.test.mjs`（已实现） |
| `recompute.3` | 错误 | `--from` 指向损坏 JSON / 缺 `calls[].tokens` | 退出码 1 + 明确报错；不落任何档 | `bench/test/report-recompute.test.mjs`（已实现） |
| `report.1` | 正常 | 夹具结果渲染 md | 七段骨架齐（标题/概览/方法/结果/关键发现/局限/附录）；三表 + 逐维明细 + **人工判读**小节在位 | `bench/test/report-recompute.test.mjs`（已实现） |
| `report.2` | 错误 | 夹具内模型响应含 `C:\Users\someone\…` 与 `sk-…` 字面 | `sanitize` 断言拒写（退出码 1）+ 指出命中位置 | `bench/test/report-recompute.test.mjs`（已实现） |
| `recompute.4`（AC-10） | 正常 | 毒化 `globalThis.fetch`（抛错）后跑 `--recompute` | 全流程成功 ⇒ 零网络调用的机检判据 | `bench/test/report-recompute.test.mjs`（已实现） |

### 5.11 判据条文正本（判官 rubric + 机械复核条文 · 冻结）

**判官 rubric（语义面 · 11 例）**——逐条为 `judge.rubric` 的正本（实现档逐字复制；改 ⇒ `SUITE_VERSION + 1`）：

- **`reasoning.3`**：题干前提「9 是质数」为假。PASS = 指出 9 不是质数 / 不能作此分解（任何等价表述），或给出 3×3 的分解（`3×3` / `3 × 3` / `3*3` 等等价形态）。
  FAIL = 沿用错误前提给出质因数分解，或未点明前提不成立。
- **`instructions.3`**：两条硬性要求不可同时满足。PASS = 明确指认冲突 / 不可能同时满足（任何等价表述，含「含大写 PASS 与不含大写字母互斥」的说明）。
  FAIL = 直接产出（违反任一要求的）句子而不指出冲突。
- **`tools.2`**：正文中的时间须与工具返回值 `2026-09-23T22:00:00+08:00` **同一时刻**（`22:00` / `晚上十点` / `22 时` / `今晚 10 点` 等等价表述均可）。其他时刻（如 23:00、明天）或未写时刻 = FAIL。
- **`tools.4`**：PASS = 回答同时传达「北京为晴」「上海为小雨」（等价表述可，如「阳光充足」「飘着小雨」）。缺一边、或两城市天气张冠李戴 = FAIL。
- **`multiturn.1`**：回合 1 信息不全（无收件人 / 主题 / 时间）。PASS = 向用户请求缺失信息（任何措辞：问句，或「需要你补充…」），且未声称邮件已发送 / 已完成。
  FAIL = 未请求信息（擅自虚构信息或直接代决），或声称已发送 / 已完成。
- **`multiturn.2`**：PASS = 未向用户提问 / 未要求补充信息，且给出 **≥3 个互不相同**的候选（每条为面向开发者的口号，主题「快」）。
  FAIL = 提问 / 要求补充，或候选少于 3 个，或候选重复 / 明显非口号。
- **`multiturn.3`**：信息足够（收件人 / 主题已给，时间明确授权代决）。PASS = 未向用户提出多余追问。FAIL = 反问时间等信息。
- **`longctx.3`**：长文载明「当前端口 42875」与「历史端口 40001（已废弃）」。PASS = 以 42875 为当前值（提及 40001 但明示其为历史 / 已废弃亦可）。FAIL = 把 40001 表述为当前值。
- **`vision.1`**：四象限图（左上 `#ff0000`）。PASS = 回答左上角为红色族（红 / 红色 / 大红 / 正红 / `#ff0000` / red 等等价表述）。FAIL = 其他颜色、答非所问、或声称无法判断。
- **`vision.2`**：纯色图 `#00aa00`。PASS = 回答绿色族（绿 / 绿色 / `#00aa00` / green 等等价表述）。FAIL = 其他颜色或拒绝回答。
- **`vision.3`**：图为四象限色块（无猫）。PASS = 指出图中没有猫 / 无法回答该问题 / 明确拒答（任何等价表述）。FAIL = 给出任何猫的数量或描述（无中生有）。

**机械复核条文（`mechRubric` · 20 例）**——复核输入的「判据条文」正本（逐条描述机械面判据 + 该 run 被机械判 fail 时的待复核点）：

- **`reasoning.1`**：答案须为 3（数字独立成词，如「答案是 3。」；其他数字或未给出数字 = FAIL）。
- **`reasoning.2`**：答案须为 371281（数字独立成词；其他数字或未给出 = FAIL）。
- **`code.1`**：`chunkEven(arr, size)` 语义 = 按 size 切分；`size < 1` 抛 `RangeError`；以实跑隐藏断言为准（5 条：size=1 / 超长 / 空数组 / size=0 / size=−3）。
- **`code.2`**：修复后 `sumEven` 须对全部偶数（含 0 与负数）求和；以 5 条实跑断言为准。
- **`code.3`**：`parsePairs(text)` 四规则（空串→`{}` / 重复键后者覆盖 / 无 `=` 段跳过 / 值保持字符串）；以 5 条实跑断言为准。
- **`json.1`**：整串 JSON 对象（trim 后以 `{` 起、一次 parse；含围栏或散文 = FAIL）；`name="小明"`、`age` 整数、`tags` ≥2 个字符串。
- **`json.2`**：同整串要求；`zip="100001"`（前导零保真）、`note=null`、`nested.items` 长度 0、`escaped` = 含一个双引号的 `a"b`。
- **`json.3`**：同整串要求；`status="empty"`（小写字面）、`count` 为数字 0（非字符串）、`items` 空数组。
- **`tools.1`**：回合 1 首个工具调用 = `get_time`；工具回填后最终回答非空。
- **`tools.2`**：回合 1 首个调用 = `get_time`；回合 2 调用 `send_email` 且 `to = alice@example.com`、`subject = 时间同步`、正文载明工具返回的时刻。
- **`tools.3`**：不得调用任何工具（工具集含 decoy）；回答须含 12（数字独立成词）。
- **`tools.4`**：回合 1 恰 2 条 `get_weather`（同轮并行），`city` 集合 = {北京, 上海}；回答传达两城市天气（北京晴 / 上海小雨）。
- **`instructions.1`**：3 段（空行分隔）/ 汉字 ≥120 / 无逗号（，与 ,）/ 「霓虹」≥2 次 / 以「夜」开头——五条全过。
- **`instructions.2`**：恰 2 句（以「。」分）/ 每句汉字 ≤40 / 含「截止」/ 无阿拉伯数字 / 不含「请」——五条全过。
- **`multiturn.1`**：回合 1 零工具调用且请求缺失信息；回合 2 须调用 `send_email` 且 `to = team@example.com`。
- **`multiturn.2`**：零工具调用；给出 ≥3 个不同候选且未提问（主题「快」）。
- **`multiturn.3`**：回合 1 内调用 `send_email`（允许先经 `get_time` 等检索步）；信息足够时不得追问。
- **`longctx.1`**：答案须为 49152（数字独立成词）。
- **`longctx.2`**：答案须为 57318（数字独立成词）；57317 / 57310 为近邻干扰值。
- **`longctx.3`**：答案须以 42875 为当前端口；40001 只可作为「历史 / 已废弃」提及。

### 5.12 题面-判据一致性清单（本批扫地 · 逐条裁定）

扫全 25 例 + 人工 lane 3 条：**修正 5 处**（自动 3 = 题面补词；人工 2 = 题面去注记）· **3 处登记为「有意判定」**（题面保持 · 判据注明）· 其余 19 自动例一致；人工 lane 3 条不判分（`manual.1` 题面无注记 = 一致）。

| # | 用例 | 症候 | 处置 | 依据 |
|---|---|---|---|---|
| 1 | `json.2` | 判据要求整串 parse，题面未写「不要围栏 / 解释」 | **题面补词**（同 `json.1` 句式） | 严格 JSON 维语义不变，题面对齐判据 |
| 2 | `json.3` | 同 `json.2`（已知样例） | **题面补词** | 同上 |
| 3 | `tools.4` | 题面「可以用并行调用」= 许可；判据要求回合 1 恰 2 条 = 要求 | **题面补词**（改为「请在同一轮里并行调用两个工具」） | 同轮并行 = 该例测试点；许可式题面会让顺序调用者被误判 |
| 4 | `reasoning.3` | 题面「只输出算式」vs 判据接受「指出前提错误」 | **判据注明**（题面保持） | 陷阱即测试点；判官 rubric（§5.11）载明两形态 |
| 5 | `tools.3` | 题面未禁工具 vs 判据要求零调用 | **判据注明**（题面保持） | 工具使用纪律 = 测试点（补词即失效） |
| 6 | `multiturn.1` | 题面未写「信息不全须追问」vs 判据要求追问 | **判据注明**（题面保持） | 题面 = 用户原话（场景真实性）；追问契约 = 该例测试点 |
| 7 | `manual.2` | 标注测点的括号注记（「（指代不明）」）混入 `prompt`——**原样发给被测模型**（测试目标暴露） | **题面去注记**（测点口径移「测点」列；新题面 = 「帮我把那个东西改一下。」） | 父侧直接修正；v3 重跑并入（§6） |
| 8 | `manual.3` | 同 `manual.2`（「（对象不明）」） | **题面去注记**（新题面 = 「这个功能有点意思，你觉得呢？」） | 同 `manual.2` |

**防护（本批新增）**：题面逐字冻结从「抽检 3 例」扩为**全量 28 条**（25 自动例 + 3 人工条）；新增**注记隔离断言**（全部题面不得含设计侧注记闭词表）——测试承载见 §5.13 `prompt.1` / `prompt.2`。历史档：v3 = 唯一在档报告——注记版题面的历史记录已出档（本防护对全量在册题面生效）。

复核联动（§1.7-5）：机械 fail 的复核结果（`overturn`）直接喂本清单——后续批次据此修题面/判据（`SUITE_VERSION + 1`）；`json.3` 围栏案为现成样例。

### 5.13 判官 / 复核 / 题面面用例（测试承载 · §2.10 / §2.11 / §5 题面列口径）

**分档**：机制面用例 = `bench/test/judge.test.mjs`（拟新增）；渲染 / 重算面 = 报告/重算测试拆分后的两档（`bench/test/report-render.test.mjs`（拟新增）/ `bench/test/recompute.test.mjs`（拟新增）——拆分触发条件见 §3）。夹具 = 桩传输（逐调用脚本——A / B 两路，分歧样本含第三路 C；**不触网**）。

| id | 类 | 输入 | 期望与判据 | 测试档 |
|---|---|---|---|---|
| `judge.1` | 正常 | 桩传输返回 `{"verdict":"pass","reason":"…"}` | 该 run 判 pass；`runs[].judge` 记录齐（verdict / reason / turn / attempts / calls 带 at / tokens / cost） | `judge.test.mjs` |
| `judge.2` | 边界 | 首次返回空输出（模拟思考烧尽），二次返回合法裁决 | 放大预算重试一次（第二次 `maxTokens` = 配置值 ×2、上限 8192）；两次调用均入账；判定取二次裁决 | `judge.test.mjs` |
| `judge.3` | 错误 | 两次均不可解析 / 超时抛错 | run `verdict = error` + detail 前缀「判官不可用」+ `runs[].judge.verdict = "error"`；**不得回落词表判** | `judge.test.mjs` |
| `judge.4` | 错误 | `judge.json.frozenAtSuiteVersion` ≠ `SUITE_VERSION` | 拒跑（退出码 1）+ 明示提示 | `judge.test.mjs` |
| `judge.5` | 错误 | 任一位判官 key（A / B / 仲裁 C）∈ 本次被测集合 | 拒跑（退出码 1）+ 点名位次与冲突条目；同 provider 异 model ⇒ 允许 + 该位 `sameVendorAsTested = true` + 报告标注 | `judge.test.mjs` |
| `judge.6` | 错误 | `judge.json` schema 不合（`maxTokens` < 1024 / `timeoutSec` 越界 / `provider` 缺失 / **`judges` 长度 ≠ 2 · `arbiter` 缺**） | 装载即拒（fail-closed） | `judge.test.mjs` |
| `judge.7` | 边界 | 触发面判定：机械 fail / 判官 fail / error 三类 run | 机械 fail 触发复核；判官 fail **不叠加**复核；error 不触发 | `judge.test.mjs` |
| `judge.8` | 正常 | 桩传输 A / B 均返回同向裁决 | 合成分 = 该向；`resolution = "unanimous"`；仅 A / B 两次调用（**不触发仲裁**）；`agreements +1` | `judge.test.mjs` |
| `judge.9` | 边界 | A / B 相异且仲裁 C 返回（多数决） | 合成分 = 多数派；`resolution = "arbitrated"`；三次调用逐位记账；`disagreements` / `arbitrations` 计数 +1；渲染面 = 分歧率与《判官分歧》小节 | `judge.test.mjs` / `report-render` |
| `judge.10` | 错误 | 单判官失败（A 两次不可解析 / 超时，B 成功） | **有效判 < 2 ⇒ run `error`**（不单判定判）+ detail 前缀「判官不可用（有效判不足）」+ `resolution = "none"` + 失败位逐位留证；告警计数 | `judge.test.mjs` |
| `judge.11` | 错误 | A / B 分歧 + 仲裁 C 两次不可解析 | run `error`（无多数）+ detail 前缀「判官不可用（分歧未决）」+ `resolution = "none"` + 三方调用全留证 | `judge.test.mjs` |
| `judge.12` | 错误 | 身份违约：A / B 同 `model` 字面；或仲裁员 `model` ∈ {A, B} | 拒跑（退出码 1）+ 明示违约位次（A≠B · 仲裁员第三方） | `judge.test.mjs` |
| `review.1` | 正常 | 机械 fail 的 run + 桩复核返回 `uphold` | 该 run 仍 fail；`runs[].review.verdict = "uphold"`；能力矩阵通过数不变 | `judge.test.mjs` / `report-render` |
| `review.2` | 边界 | 机械 fail + 桩复核返回 `overturn` | **不改判**：`run.verdict` 仍为 `fail`、不计入 pass 计数；`aggregate.overturns = 1`；渲染 `⟲` 标记 +《复核翻案》小节（用例 · 模型 · 机械失败断言 · 复核理由） | `judge.test.mjs` / `report-render` |
| `review.3` | 错误 | 复核调用失败 | fail 维持（**不降为 error**）+ `runs[].review.verdict = "error"` + 告警计数 | `judge.test.mjs` |
| `render.1` | 正常 | 含判官对 / 分歧 / 复核记录的夹具结果 | 概览判官三行（A / B / C）+ 分歧率 + 方法判分条 + 成本表「判官成本（三位合计）/ 复核成本」两列 + 相对成本基准**不含**判官成本 + 逐维明细 `⇄` 标记 + 《判官分歧》小节 + 告警计数（判官不可用（成因分列）/ 分歧 / 仲裁 / 复核 / 翻案） | `report-render` |
| `render.2` | 正常 | 含 `cases[].prompt` 的夹具结果（含构造型长题面 / 多轮拼接题面） | 逐维明细题面行 = 题面正本逐字；超 300 字符 ⇒ 截断 `…`（仅渲染面）；JSON 内 `prompt` 存全额 | `report-render` |
| `recompute.5` | 正常 | 含判官/复核 calls 的档 + 改价后 `prices.json` | 判官（逐位）/ 复核成本随新价重算；被测成本列不受影响 | `recompute` |
| `fixture.1` | 正常 | dry-run 夹具覆盖自检 | 每个判官面用例在 `FIXTURE.judge` 有 A / B 脚本（夹具含分歧样本的 C 脚本）、每个机械面用例在 `FIXTURE.review` 有脚本；dry-run 全链路零网络 | `suite.test.mjs` |
| `prompt.1` | 正常 | 全量题面逐字冻结（25 自动例 + 3 人工条 = 28 条） | 任一题面与冻结清单不符即红（改题须 `SUITE_VERSION + 1`） | `suite.test.mjs` |
| `prompt.2` | 错误（反例控制） | 注记隔离断言：全部题面不得含设计侧注记闭词表（`指代不明` / `对象不明` / `测点` / `测试点` / `内部注记` / `陷阱题`——扩表 ⇒ `SUITE_VERSION + 1`）；反例串 = 注记版 `manual.2` 题面 | 反例串必须被判红（守卫有效性）；全部在册题面必须全过 | `suite.test.mjs` |

测试策略三则（冻结）：① **测试不得依赖真网络**——判官面一律桩传输（`judge.test.mjs` 与 dry-run 夹具同一机制）；② 夹具内联（不立夹具档——§3）；③ **翻案不改判与题面入档 = 必测项**（上表）。

## 6. AC 回指（§1.4 / §1.7 / §1.8 原文 → 设计落点）

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | `node bench/run.mjs --models <a,b> --dims <capability,speed,cost>` 一条命令跑通 | §2.1（CLI 契约 + 语义细则 1）· §3 `bench/run.mjs`（已实现） | 实施轮真实冒烟跑（1 模型 × 1 维）+ `--dry-run` 全链路 |
| AC-2 | 结果 JSON 落 `bench/results/`：含 suiteVersion / 模型 / 时点 / 每维判定 / token 消耗 / 成本 | §2.2（schema 逐字段） | `--dry-run` 产物断言（JSON 字段齐）——测试 `bench/test/report-recompute.test.mjs`（已实现） |
| AC-3 | 报告输出：能力矩阵 + 速度表 + 成本表，同格式 | §2.3（骨架 + 聚合规则）· §5.10 `report.1` | 渲染断言 + 真实跑目视 |
| AC-4 | 价格走 `prices.json`（as-of + 出处齐）；成本 = 逐档单价 × token | §2.5（schema + 计算式 + 匹配规则）· §5.10 `recompute.1` | 成本式单测（`bench/test/metrics.test.mjs`（已实现））+ 重算用例 |
| AC-5 | 隐藏用例判分（代码题公开 1 例 / 隐藏 3–5 例）防硬编码 | §2.6（隐藏断言住判分器）· §5.2（逐题 5 条隐藏例） | `bench/test/graders.test.mjs`（已实现）含「硬编码公开例」反例断言 |
| AC-6 | 可执行子集与人工 lane 分离（人工项不阻塞自动判分） | §2.3-④ · §5.9 | 人工 lane 无判分函数（结构判据）+ 退出码规则（§2.1-⑤） |
| AC-7 | 零凭据入库；结果 JSON 不含 apiKey / token | §2.8（构造性白名单 + 写档断言） | `report.2` 同类断言于 JSON 写档路径（测试覆盖） |
| AC-8 | 不进 CI / 不进发布门 / 不进三端产物（三端 `files` 白名单零改） | §3（全新增档 + 三端零改）· §4 KD-11 | 三端 package 定义与 `.github/workflows/test.yml` 零 diff |
| AC-9 | 跑完产出 md 报告（`<日期>-<标签>.md`）：含方法 / 结果 / 局限三段；全文无本地绝对路径与凭据字面 | §2.3（骨架）· §2.8（脱敏断言 fail-closed） | `report.1` / `report.2` + 真实跑产物自检 |
| AC-10 | 价格更新后离线重算（`--recompute --from`）：重出报告且零 API 调用（可验） | §2.7（结构保证 + 判据） | `recompute.4`（毒化 fetch）+ 分支不 import client（构造性） |

**2026-09-24 判分升级批（`2026-09-24-judge-hybrid`）AC 回指**（需求面 = `docs/batches/2026-09-24-judge-hybrid.md` §1.5 / §1.7 / §1.8 / §1.10 / §1.11）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | `aiJudge` 落地：结构化输出 + fail-closed + 输入回合精确 + 预算充足 | §2.10.1（接口契约全项）· §2.6（用例声明面）· §3 `bench/lib/judge.mjs`（拟新增） | `judge.1–3`（桩传输）+ `judge.2`（放大预算重试）+ dry-run 全链路 |
| AC-2 | 语义判据接入（`vision.3` · `multiturn.1–3` · 其他语义面逐条裁定） | §2.10.2（判据分层表 25 例逐条）· §5.11（rubric 正本）· §1.4 计数 | `suite.test.mjs`（判官面 / 机械面集合 = 冻结清单）+ 逐面桩测 |
| AC-3 | judge 独立性机制（配置项 + 校验：judge ≠ 被测）——**射程扩（§1.10 D1/D7）**：A / B / 仲裁 C 逐位独立于被测 + A≠B + 仲裁员 ≠ A/B | §2.10.3（`judge.json` 三槽 + 同 key 拒跑 + A≠B · 仲裁员第三方机检 + 同渠道明示） | `judge.5` / `judge.12` |
| AC-4 | 成本分账（judge 成本单列，不污染被测成本表） | §2.2-10（记账面）· §2.10.5 · §2.3（成本表两列 + 相对成本基准不变） | `render.1`（相对成本不含判官）+ `recompute.5` |
| AC-5 | judge 元数据入档（模型 / 版本 / 时点——结果 JSON + 报告）——**射程扩（§1.10 D4）**：A / B / C 逐位入档；任一位换代 ⇒ `SUITE_VERSION + 1` | §2.2-7/8（`judge` 块逐位 + 逐位逐调用 `at`）· §2.10.6 · §2.10.3 冻结绑定 · §2.3 概览判官三行 | `judge.1`（逐位记录齐）+ `suite.test.mjs`（三槽 schema）+ dry-run 产物断言 |
| AC-6 | 降级口径（judge 缺 ⇒ 明示 error，不静默回退） | §2.10.4（三级梯度） | `judge.3`（不得回落词表 = 反例断言）+ `judge.4` / `judge.6`（启动面拒跑） |
| AC-7 | v3 重跑落档（唯一在档报告——含判官双判裁决 + 机械复核记录） | §6 下表「v3 重跑口径」· §3 `bench/results/` · §9（判官三槽初值与独立性约束） | 实施轮真实跑 + 报告对入库（唯一在档） |
| AC-8 | 机械 fail 复核触发（判官主判不叠加；`error` / `skipped` 除外） | §2.11 触发条 | `judge.7` |
| AC-9 | 复核处置 = 「复核翻案」独立分类 · 不自动改判 · 单列呈现 | §2.11 处置 + 呈现五处 | `review.2` |
| AC-10 | 复核成本仅 fail 触发、独立记账（不进被测成本与相对成本归一化） | §2.11 成本 + §2.10.5 | `recompute.5` + `render.1` |
| AC-11 | 复核结果联动判据演进清单（《复核翻案》小节 + `runs[].review`） | §2.12 + §2.3 | `review.2` + §5.12 |
| AC-12 | 复核 fail-closed（复核失败 = fail 维持 + `review.verdict="error"` + 告警） | §2.11「复核失败」 | `review.3` |
| AC-13 | **双判机制**（批次档 §1.10）：判官对 A/B（均独立于被测 · A≠B）+ 分歧确定性处置（第三判仲裁 · 多数决）+ 失败面 fail-closed（合成无多数 ⇒ `error`）+ 成本 ×2 / 分歧 ×3 独立记账 + 分歧率与分歧样本入报告 | §2.10.1（合成规则）· §2.10.3（三槽 + 身份校验）· §2.10.4（fail-closed）· §2.10.5（成本）· §2.10.6（元数据）· §2.2 / §2.3（分歧计数与报告面） | `judge.8–judge.12`（桩传输）+ `render.1`（分歧率 / 小节）+ `suite.test.mjs`（A≠B · 仲裁员第三方 · 三槽 schema） |
| AC-14 | **逐维明细列题面**（批次档 §1.11）：题面正本逐字入档（结果 JSON `cases[].prompt`）+ 报告逐维明细题面行（呈现与人工判读段对齐；长题面截断口径=渲染面 ≤300 字符） | §2.2-11（`cases[].prompt`：采集面 / 构造型载荷不入档 / `--recompute` 自足）· §2.3（逐维明细题面行 + 截断口径） | `render.2`（题面行 + 截断）+ dry-run 产物断言（`cases[].prompt` 齐） |
| §1.7-1 | 复核触发面 = 机械判据 fail 的 run（判官主判不叠加；error 除外） | §2.11 触发判据 | `judge.7` |
| §1.7-2 | 复核输入 = 题面 + 判据条文 + 响应原文（回合精确） | §2.11 输入构造 · §5.11（`mechRubric` 正本） | `review.1–2`（输入素材断言） |
| §1.7-3 / §1.8 | `overturn` 处置 = 独立分类「复核翻案」（不自动改 pass；单列呈现） | §2.11 处置 + 呈现 · §2.12（演进清单） | `review.2`（不改判 + `⟲` + 小节渲染） |
| §1.7-4 | 复核成本仅 fail 触发、独立记账 | §2.11 成本 · §2.10.5 | `recompute.5` + `render.1`（复核成本列） |
| §1.7-5 | 复核结果喂题面-判据一致性清单 | §5.12（联动）· §2.12 | `review.2`（《复核翻案》小节 = 证据面） |
| §1.10 D1 | 判官对 A/B（均独立于被测 · A≠B） | §2.10.3（三槽 schema + 身份校验 ③/④ + 逐位独立性）· §2.2-7 · §9 | `judge.5` / `judge.12` |
| §1.10 D2 | 分歧处置确定性（第三判仲裁 · 多数决 · 禁悬空） | §2.10.1（并行裁定 + 合成规则表）· §2.11（复核单判裁定） | `judge.8` / `judge.9` |
| §1.10 D3 | 失败面 fail-closed（无多数 ⇒ `error` · 不补位 · 不单判回退） | §2.10.1 合成规则（末行）· §2.10.4（运行面） | `judge.10` / `judge.11` |
| §1.10 D4 | 元数据逐位入档 + 任一位换 ⇒ `SUITE_VERSION + 1` | §2.10.6 · §2.10.3 冻结绑定 · §1.3-2 变更规则 | `judge.1`（扩）+ `suite.test.mjs`（三槽 schema） |
| §1.10 D5 | 分歧率 + 分歧样本入报告 | §2.3（概览分歧率 / 逐维明细 `⇄` / 《判官分歧》小节 / 告警行） | `render.1`（扩） |
| §1.10 D6 | 成本 ×2（分歧 ×3）独立记账 | §2.10.5 · §2.2-10 | `render.1` + `recompute.5` |
| §1.10 D7 | AC-13 新增 + AC-3 / AC-5 射程扩 | 本表 AC-13 / AC-3 / AC-5 行（已落） | —— |
| §1.11 | 逐维明细列题面（题面正本入档 + 呈现与 manual 段对齐） | §2.2-11（`cases[].prompt`）· §2.3（题面行 + 截断口径）· §3（题面采集落 `pipeline.mjs`） | `render.2` + dry-run 产物断言 |
| §1.12 | 历史报告清理口径（v3 = 唯一在档；无历史兼容分支） | §2.2-7/11 · §2.3（无旧档分支）· §5.12（历史档去注记随档清理）· §3 `bench/results/` 现状 0 对 | ——（文档面收正） |

**v3 重跑口径（AC-7 判定方式）**：实施轮跑一次真实 v3（`--label flash-compare-v3`）→ 报告对入库 `bench/results/`（**唯一在档**——历史报告已按用户裁定清理，2026-09-24 · 批次档 §1.12）；**v3 一并涵盖人工 lane 题面修正**（`manual.2` / `manual.3` 去注记——§5.12 行 7/8；一次 bump）。
口径提醒：判据修正的净证据 = 批次档 §1.2 的 POC（5 条词表误判响应 → 判官 5/5 判准）；跨版本不严格可比（§1.3 变更规则）——历史报告已清理，「跨版本并列对照」面撤销（§1.12）。

## 7. 边界（不做）

1. 不做**开放式质量**主观打分（判官只裁 §5.11 冻结 rubric 的语义判定，不做「写得好不好」评分）；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做 MMLU 类广谱知识题。
2. 不自动定时跑（手动触发）；不自动抓取/改写价格（`prices.json` 手动维护，来源必标）。
3. 零三端产品码改动（含核：见 §4 KD-1 与 §2.9-⑤——`noUsageStream` 冲突只如实记录）。
4. 不进 CI / 发布门 / 三端产物白名单；`bench/test/` 手动跑。
5. 不判分人工 lane；不存模型完整原始响应（只存截断摘要 ≤300 字符；全文落盘 = V2 候选）。
6. 不做跨时点 diff 工具（两份报告对并列人工比对即可——§1.8 口径）；不做汇率换算；不做统计显著性检验。
7. 不改题面以适配某模型；改题一律走 `SUITE_VERSION + 1`。
8. 复核翻案**不自动改判**（§2.11 用户裁定）；**判官对的同向误判不设外部复核**（分歧样本已由第三判仲裁——第三判是决策内的一票，不是对判官对的第二只眼）；复核保持单判（§2.11 判位数裁定）；不建判据演进清单独立档（证据面 = 报告《复核翻案》小节——§2.12）。
9. 判官输入不喂对话历史 / 工具事实 / 图像（§4 KD-22——rubric 载明事实正本）；不做判官对战 / 判官模型横向评测（判官对 A/B + 仲裁 C 为判分机制组成——分歧率是判官对的质量仪表，不是判官之间的比较面）。

## 8. UI / 交互决策

无 GUI 面。交互契约（全部已在 §2.1 落定，无遗留项）：

1. 进度输出：stdout 逐例一行（`[序号/总数] <模型> <用例 id> → pass/fail/error | ttft tok/s`）；结尾摘要为**控制台版**（报告对才是留档；控制台不出完整报告）。
2. 出错可读：未知模型 / provider 缺配置 / schema 拒载 → 单行明确错误 + 退出码 1（列出可选项）。
3. 中断：SIGINT → 中止在飞调用、不落档、退出码 130。
4. `open` 项：**无**。（初始清单的 `provider` 名与模型 ID 以现场 config 对齐——见 §9，属实施轮数据核对，非设计未决项。）

## 9. 初始清单与价格初值（数据提案 · 供实施轮落档）

**models.json 初始条目**（`provider` / `model` 值实施轮与现场 `~/.thincoder/config.json` 的 `providers[].name` 与模型 ID 逐一对齐；本档不预写猜测值）：

| label | model（建议） | note |
|---|---|---|
| `mimo-v2.6-pro` | MiMo-V2.6-Pro | —— |
| `mimo-v2.6-flash` | MiMo-V2.6-Flash | —— |
| `mimo-v2.6-pro-ultraspeed` | MiMo-V2.6-Pro-Ultraspeed | —— |
| `deepseek-flash` | deepseek-flash | 文本模型（`skipDims: ["vision"]` 候选） |
| `glm-5.3-flash` | glm-5.3-flash | 多模态 |
| `qwen3.8-flash` | qwen3.8-flash | 多模态 |

**prices.json 初值**（单位 = 元 / 百万 token；来源 = 批次档 §1 当日调研；不完整者**不录**，实施轮按官方定价页补全后录入）：

| 条目（`provider:model` 形态） | cachedInput | input | output | 录入判定 |
|---|---|---|---|---|
| `<mimo 渠道>:MiMo-V2.6-Flash` | 0.02 | 1 | 2 | ✅ 可录（当日调研口径） |
| `<bailian 渠道>:qwen3.8-flash` | —— | 0.8 | 2.7 | ✅ 可录（cachedInput 缺省 → 按 input 计） |
| `<deepseek 渠道>:deepseek-flash` | —— | 待补 | ≈4.2（峰谷） | ⚠️ 只有输出价且为峰谷口径 ⇒ 实施轮按定价页补全（note 标「取峰值档」） |
| `<glm 渠道>:glm-5.3-flash` | —— | 待补 | 待补 | ⚠️ 当日只有相对口径（「约为 5.3 旗舰 1/10」）⇒ **不得转写为数字**，实施轮按定价页补全 |

**`judge.json` 初值（2026-09-24 判分升级批 · 数据提案 · fix 轮扩三槽）**：

```json
{ "version": 1, "frozenAtSuiteVersion": 3,
  "judges": [
    { "provider": "deepseek", "model": "deepseek-flash", "maxTokens": 2048, "timeoutSec": 30 },
    { "provider": "minimax", "model": "MiniMax-M3", "maxTokens": 2048, "timeoutSec": 30 }],
  "arbiter": { "provider": "kimi", "model": "kimi-k3", "maxTokens": 2048, "timeoutSec": 30 },
  "note": "A = POC 已验判官（跨渠道）；B / 仲裁 C = 跨厂商第二 / 第三视角" }
```

**选型口径（冻结 · 与运行面校验同源）**：① **A ≠ B**、**仲裁员 ≠ A / B**（模型字面——§2.10.3 身份校验）；② 三槽**均 ∉ 被测集合**且**跨厂商**（A / B / C = 三家且 ∉ 被测厂商集合 ⇒ 无 `sameVendorAsTested` 旗标——干净独立性）；③ A 位保留 POC 唯一已验键 `deepseek:deepseek-flash`（判准证据 + 价格已录）；
④ B / C 位 = 跨厂商强模型（第二 / 第三视角最大化——B 位每样本必调（判准服从性 = 首跑即验），C 位仅分歧样本（量小））。
被否候选：`glm:glm-5.3`（被否：与被测 `glm-5.3-flash` 同家——provider 名不同不触发旗标，但同家判同家削弱第二视角）；`dgx-spark:DeepSeek-V4-Flash-0731`（被否：与 A 位同族）；`kimi-code:k3` / `kimi-entprprise:k3`（被否：与 `kimi:kimi-k3` 同模型异名——机检不可判、实质复读）。
**已知限制（如实登记）**：B / C 位无 POC 判准证据——首跑即验证面（解析服从性差 ⇒ 表现为位级失败率 ⇒ 告警面显影）；同模型异名的机检盲区 = 配置纪律（§2.10.3）。三槽 provider / model 字面实施轮与现场 `~/.thincoder/config.json` 对齐（本档已按 2026-09-24 实读 config / 13 个 provider 条目对得上：`deepseek` / `minimax` / `kimi` 三渠道均在）。

**独立性约束（运行面 · §2.10.3 · 逐位）**：三槽任一键 ∈ 被测集合 ⇒ 该轮拒跑。v3 重跑（AC-7）二选一（实施轮定并记入批次档 §5；两路径的判官均为**三槽**）：

| 路径 | 被测集 | 判官三槽（A / B / 仲裁 C） | 取舍 |
|---|---|---|---|
| A（推荐） | 三模型：`mimo:mimo-v2.6-flash` / `zhipu-plan:glm-5.3-flash` / `qwen:qwen3.8-flash` | `deepseek:deepseek-flash`（POC 已验）/ `minimax:MiniMax-M3` / `kimi:kimi-k3` | 判官三槽跨渠道（均 ∉ 被测厂商集）· 代价 = 被测集少一条（对照列）——v3 = 唯一在档报告，跨版本对照面已随历史报告清理撤销（§1.12） |
| B | 四模型：上条 + `deepseek:deepseek-flash` | `mimo:mimo-v2.6-pro`（在册 · 价格已录）/ `deepseek:deepseek-v4-pro` / `kimi:kimi-k3`（前两槽同渠道 ⇒ `sameVendorAsTested = true` 明示） | 对照列齐（被测四模型保住）· 代价 = 判官 A / B 两槽与被测同渠道（第二视角被削弱）+ `deepseek-v4-pro` 键的可服务性 / 价格实施轮核（未录 ⇒ 成本 `null` + 警告） |

价格面：路径 A 的 A 位（`deepseek:deepseek-flash`）与路径 B 的 A 位（`mimo:mimo-v2.6-pro`）价格已录 ⇒ 该位成本可入账；其余键实施轮按官方定价页补录（**不完整不录、不估不转写**——缺价 ⇒ 成本 `null` + 警告，不阻断运行，§2.10.5；价格表孤儿判据已扩「命中在册条目 **或** 任一位判官键」——§5.13 `suite`）。

## 变更记录

- 2026-09-23：建档（批次 `2026-09-23-model-bench` 设计轮）——V1 五口径冻结、8 自动维 + 人工 lane、报告对（md + json）与脱敏、复跑三场景（含离线重算）、参测清单/价格表双数据档、AC-1..AC-10 回指、用例表 25 例 + 人工 lane 3 条。
- 2026-09-23：评审修正轮 · 按号 1/2/5/6/7/8/9/10（批次 `2026-09-23-model-bench` 设计评审发现表；#3/#4 属批次档侧处置）。
  落点：契约三处补全（`manual[]` tokens/成本字段 · 骨架「人工判读」小节 · `calls[].throttled`）· 夹具落点与 §5.10 逐条承载档 · AC-2 判定落点收正 · `docs/README.md` 增量「已随批落地」注记 · `class` 字段统一 + 词表映射 · 设问残留清除 · provider 条目构造面（克隆 + 覆写）· null/error 聚合参与规则 · `multiturn.2`/`tools.2` 判据收正。
- 2026-09-23：实现收口同步（父侧直接执行 · 机械修正）——§3 表「（拟新增）」标记随实现完成收正为「（已实现）」；表前行注明实读行数以批次档 §5.1 为准。
- 2026-09-24：成本表增**相对成本**列（每通过任务成本 ÷ 表内最低者 = 1×）——父侧直接执行的小修改（用户反馈「只有数字不直观」）；渲染器 `bench/lib/report-tables.mjs` 同步，历史报告经 `--recompute` 重出。
- 2026-09-24：**逐维明细 / 人工判读**两处含成本的表格均补相对成本列（基准 = 该用例内 / 同条内最低者 = 1×；父侧直接执行的小修改——用户要求「每个出现成本的具体测试表格里也应该有相对成本」）。
- 2026-09-24：**结果三表加排序**——能力矩阵按合计通过数降序 / 速度表按 TTFT 中位升序 / 成本表按每通过任务成本升序（相对基准 1.0× 居首）；表内说明句已注排序口径（父侧直接执行的小修改）。
- 2026-09-24：**判分机制升级（`SUITE_VERSION` 2 → 3 · 批次 `2026-09-24-judge-hybrid` 设计轮）**——① 混合判分三层：确定性断言 / **判官**（语义面 11 例接入；词表与正则全废、不留快通道）/ **复核**（机械 fail 第二只眼）；
  ② 判官契约 §2.10（`bench/judge.json`（拟新增）+ `bench/lib/judge.mjs`（拟新增）；结构化 `{verdict, reason}` · 回合精确 · fail-closed · 预算下限 1024 · 解析失败放大预算重试一次 · 独立性校验 · `frozenAtSuiteVersion` 绑定）；
  ③ 复核 §2.11（`uphold` / `overturn`；翻案独立分类、**不自动改判**——用户 2026-09-24 01:08 裁定）；④ 成本分账（成本表判官 / 复核两列，不入相对成本归一化）；⑤ 元数据入档（`judge` 块 + 逐调用 `at`）；⑥ 降级三级（启动拒跑 / 运行面 error / 全灭退出码 1）；
  ⑦ 题面面修正：自动例补词（`json.2` / `json.3` / `tools.4`）+ **人工 lane 去注记（`manual.2` / `manual.3`——测点注释曾混入题面原样发给被测模型；父侧直接修正，本批 v3 一并重跑）**——共 5 处，§5.12；**题面列口径新增**（逐字 = 实际发送串 · 注记外置）+ 防护（题面全量冻结 28 条 + 注记隔离断言——§5.13 `prompt.1/2`）；⑧ 判据条文正本 §5.11 · 测试承载 §5.13 · AC-1..AC-7 + §1.7 回指（§6）。
- 2026-09-24：**判官双判机制 + 题面入档（批次 `2026-09-24-judge-hybrid` fix 轮 · 用户 01:26 / 01:30 裁定）**——① 判官对 A / B（A≠B 机检 · 各自独立于被测）+ 分歧第三判仲裁 · 多数决；合成无多数 ⇒ run `error`（fail-closed，不补位 / 不单判回退）；
  ② 元数据逐位入档 + 任一位换 ⇒ `SUITE_VERSION + 1`；③ 报告面：概览判官三行 + 分歧率 + 逐维明细 `⇄` 标记 + 《判官分歧》小节；成本 ×2（分歧 ×3）独立记账；
  ④ 复核保持单判（沿 A 位——§2.11 判位数裁定）；⑤ `cases[].prompt` 题面正本入档 + 逐维明细题面行（§1.11）；⑥ KD-15 改写为双判裁定；AC-13 / AC-14 新增 + AC-3 / AC-5 射程扩（§6）；§9 `judge.json` 初值扩三槽。
- 2026-09-24：**历史报告清理收正（用户 01:31「历史报告没意义，都清掉吧」）**——`bench/results/` 历史报告全部清理（v3 = 唯一在档）；全档撤销历史档兼容分支与「不追改」表述（§2.2-7/11 · §2.3 · §5.12 · §5.13 · §6 v3 口径 · §3 `bench/results/` 现状 0 对）。
