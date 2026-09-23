# MODEL-BENCH 模型基准测试套件 · 设计

> 层 = 设计层（how）。需求面 = `docs/batches/2026-09-23-model-bench.md` §1（§1.1–§1.9；AC-1..AC-10）——本档不重述需求，只落机制与判据。
> 建档：2026-09-23（批次 `2026-09-23-model-bench` 设计轮）。落点：`docs/core/design/MODEL-BENCH.md`（基准测试面新档）。
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
  ├─ lib/grade.mjs    判分器族（数字比对 / vm 实跑 / 严格 JSON / 工具结构 / 文本约束 / 词表 / 颜色）
  ├─ lib/metrics.mjs  ttft / tok_s / 中位 / 聚合口径
  ├─ lib/prices.mjs   prices.json 读取 + 匹配 + 成本计算
  ├─ lib/report.mjs   结果对象 → md（骨架 + 三表 + 逐维明细 + 发现 + 局限）
  └─ lib/sanitize.mjs 脱敏谓词 + 写档前断言（报告与 JSON 共用）
```

题集档（`bench/cases/`，一维度一档）、工具桩（`bench/lib/tools.mjs`）、PNG 生成器（`bench/lib/png.mjs`）、长文生成器（`bench/lib/haystack.mjs`）见 §3 文件清单。

### 1.3 五口径冻结（设计条文 · 统一标准的核心）

| # | 口径 | 冻结内容 | 实现落点 | 变更规则 |
|---|---|---|---|---|
| 1 | **题集** | 题面文本 + 用例集（含隐藏用例）逐字冻结于本档 §5；`SUITE_VERSION`（整数）为版本标识 | `bench/cases/index.mjs`（已实现）（常量）+ 各维度档 | 增删改任一题面/用例 → `SUITE_VERSION + 1` |
| 2 | **判分** | 机器判分为主；判据 = 本档 §5 每例「期望与判据」列的闭集断言；人工项只记录不判分（独立 lane） | `bench/lib/grade.mjs`（已实现）+ 各维度档 | 任一判据/词表/阈值变化 → `SUITE_VERSION + 1` |
| 3 | **计时** | TTFT = **首个非空 delta 到达**（content 或 reasoning 先到者）− 调用发起；`tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)`；token 只认 `usage` 精确值，**delta 近似禁用**（缺 usage 记 null，不估算） | `bench/lib/client.mjs`（已实现）· `bench/lib/metrics.mjs`（已实现） | 口径变化 → `SUITE_VERSION + 1`（跨版本不严格可比） |
| 4 | **报告** | 报告对 `<日期>-<标签>.{md,json}` 同 basename；md 骨架 = §2.3 固定结构（方法 / 结果 / 局限三段必备）；同骨架跨模型/跨时点可比 | `bench/lib/report.mjs`（已实现） | 骨架变化 = 口径变化 → `SUITE_VERSION + 1` |
| 5 | **价格** | 单价只住 `prices.json`（手动维护 · `asOf` + `source` 必备）；成本 = §2.5 计算式；**价格变动不 bump suiteVersion**（另记 `prices.asOf`） | `bench/prices.json`（已实现）· `bench/lib/prices.mjs`（已实现） | 改价 = 改数据（无须版本号）；离线重算见 §2.7 |

**计时口径的实现依据（实测锚）**：核的流读面只在**非空** delta 时回调（`thincoder-core/provider/sse.mjs:142-149`）⇒ 空 role 起始块不产回调；TTFT 以「首个非空 delta」为观测点，是核路径上最接近「首字节」的可观测单位（被否候选见 §4 KD-7）。

### 1.4 维度总表（V1）

| 维 | 键 | 用例数 | 判分器 | 类覆盖（正常/边界/错误） |
|---|---|---|---|---|
| 推理 | `reasoning` | 3 | 数字比对（独立成词）+ 闭词表 | 1 / 1 / 1（前提陷阱） |
| 代码 | `code` | 3 | `node:vm` 实跑（4s 超时）+ 隐藏用例断言 | 1 / 1 / 1（修 bug） |
| 严格 JSON | `json` | 3 | 整串 `JSON.parse` + 字段/类型断言 | 1 / 1 / 1（类型陷阱） |
| 工具调用 | `tools` | 4 | 结构断言（name / arguments / 轮次） | 2（单/多步）/ 1（并行）/ 1（拒答） |
| 指令遵循 | `instructions` | 3 | 机器可验约束（字数/次数/格式/否定） | 1 / 1 / 1（约束冲突识别） |
| 多轮澄清 | `multiturn` | 3 | 结构化对话断言 | 1 / 1 / 1（过度澄清 / 代决边界） |
| 长上下文 | `longctx` | 3 | 事实命中 + 干扰项排除 | 1 / 1 / 1（干扰） |
| 视觉 | `vision` | 3 | 颜色归一化比对（闭词表） | 1 / 1 / 1（无中生有拒答） |
| 中文歧义（人工 lane） | `manual` | 3 | **不判分**——只记录 + 报告并列 | 不计分 |

合计：自动判分 **25 例** + 人工 lane 3 条。逐例题面与判据 = §5。

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
5. 退出码：`0` = 跑完（**模型用例失败不影响退出码**——失败是数据不是错误）；`1` = 基建错误（参数错 / 未知模型 / provider 缺配置 / `prices.json` 或 `models.json` 不可读或不合 schema）；中断（SIGINT）→ 中止在飞调用、**不落档**、退出码 130（半程结果不得混入留档）。
6. 输出：stdout 逐例进度行 + 结尾摘要表；`--dry-run` 不触网。结果对落 `bench/results/`（相对 `bench/` 目录解析，任意 cwd 可跑；目录不存在则创建）。
7. 覆盖保护：目标文件已存在 → **拒写并提示换 `--label`**（留档不可被静默覆盖；删旧档 = 人工显式动作）。

### 2.2 结果 JSON schema（`bench/results/<日期>-<标签>.json`）

```json
{
  "suiteVersion": 1,
  "label": "flash-compare",
  "startedAt": "2026-09-23T22:40:00+08:00",
  "finishedAt": "2026-09-23T23:02:11+08:00",
  "run": { "dims": ["capability", "speed", "cost"], "repeats": 1, "maxTokens": 4096,
           "timeoutSec": 120, "temperature": 0, "node": "v24.9.0", "command": "node bench/run.mjs --models …" },
  "prices": { "asOf": "2026-09-23", "currency": "CNY", "source": "…（表级出处）" },
  "recomputed": null,
  "models": [{
    "label": "mimo-flash", "provider": "mimo", "model": "MiMo-V2.6-Flash", "host": "api.xiaomimimo.com",
    "dims": ["reasoning", "code", "…"],
    "cases": [{
      "caseId": "reasoning.1", "dim": "reasoning", "class": "正常",
      "runs": [{
        "n": 1, "verdict": "pass", "detail": "…≤200 字符",
        "metrics": { "ttftMs": 812, "totalMs": 4210, "tokPerSec": 31.4,
                     "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                     "cost": { "value": 0.00035, "currency": "CNY", "pricesAsOf": "2026-09-23" } },
        "calls": [{ "round": 1, "ttftMs": 812, "totalMs": 4210,
                    "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                    "costCny": 0.00035, "toolNames": [], "finishReason": "stop",
                    "throttled": false }],
        "summary": { "textHead": "…≤300 字符", "textLen": 96, "reasoningLen": 0, "toolNames": [] }
      }]
    }],
    "aggregate": { "passed": 17, "total": 20, "costCny": 0.0123, "costPerPassCny": 0.0007 }
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

### 2.3 md 报告契约（AC-3 / AC-9）

报告对 = `<日期>-<标签>.md` + 同 basename `.json`（同一次运行产出，md 完全由 JSON 数据渲染 ⇒ 两档恒一致）。骨架（固定，缺段即缺陷）：

```text
# 模型基准报告 · <标签> · <日期>
## 概览          —— 参测模型与配置（label/provider/model/维度面）· suiteVersion · prices.asOf · 通过率一览
## 方法          —— 五口径冻结说明（§1.3 五条）+ suiteVersion + 运行参数（--n / maxTokens / temperature / 时点）
## 结果
### 能力矩阵     —— 模型 × 维度 → 通过/总数（`—` = 不在该模型面）
### 速度表       —— 模型 × [TTFT 中位 / tok/s 中位 / 总耗时]（N>1 时取中位）
### 成本表       —— 模型 × [总成本 / 每任务成本 / 每通过任务成本 / **相对成本（每通过任务成本 ÷ 表内最低者 = 1×，直接读倍数）**]（价格未录/usage 缺失 → `—` + 脚注）
### 逐维明细     —— 每用例 × 模型：判定 + 关键指标 + 响应摘要（≤300 字符）
### 人工判读     —— 人工 lane 逐条并列（题面 + 响应摘要 ≤300 字符 + 指标 + 调用成本按条单项列出；不判分；该 lane 未跑 → 本节记「未运行」）
## 关键发现      —— 数据性结论（仅名次/极值与计数，模板化生成；禁主观评价词）
## 局限声明      —— 固定模板（单次采样无置信区间 / 闭集判据不覆盖开放式质量 / 人工 lane 不判分 / 价格手动维护 /
                    同模型跨渠道差异 / 速度受服务端负载影响 / V1 未覆盖面）
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
5. 关键发现生成规则：① 能力通过率首位/末位；② 速度（TTFT 中位 / tok/s 中位）极值；③ 每通过任务成本最低；④ 数据告警汇总（usage 缺失 / 价格未录 / error 计数）。全部由数据 + 固定句式生成。

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

### 2.6 题集 / 判分器接口

题集档（每维一档，`bench/cases/<dim>.mjs`（已实现））导出用例数组；用例对象字段（冻结）：

```js
{ id: "reasoning.1", dim: "reasoning", class: "normal" | "boundary" | "error",
  prompt: "…（逐字题面 · 冻结正本 = 本档 §5）",
  build: null,              // 可选：动态题面构造（长文 / PNG → {messages, assets}）
  callOpts: {},             // 可选：tools / parallelToolCalls / maxTokens 覆盖
  grade: (result, ctx) => ({ pass: boolean, detail: string }) }
```

**命名与词表映射（冻结）**：用例对象 `class`（`normal` / `boundary` / `error`）与结果 JSON 的 `class`（§2.2）同名；值映射 `normal → 正常` · `boundary → 边界` · `error → 错误`（结果 JSON、报告与 §5 用例表「类」列一律用中文词，括注变体如「错误（…）」以词根为准；映射实现单处 = 结果对象构造面）。

判分器族（`bench/lib/grade.mjs`（已实现），全部纯函数、无网络、确定性）：
`numEquals`（数字独立成词 `(^|\D)N(\D|$)`）· `vmRun`（`node:vm` + 4000ms 超时 + 追加断言脚本；代码块提取 = 末个围栏内容或整段）· `strictJson`（trim 后整串 `JSON.parse`，含围栏/散文即 FAIL）+ 字段断言 ·
`toolShape`（name / `JSON.parse(arguments || "{}")` / 轮次）· `textRules`（汉字计数、段落数、句数、首尾、次数、否定式「不含」、列举项计数（行首编号 / 项目符 / 行内编号））· `keywordSet`（闭词表命中）· `colorMatch`（颜色归一化词表）。

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

## 3. 受影响文件清单（含行数预算）

**全部为新增档**；存量档仅地图登记一处（`docs/README.md`：登记本档 + 计数收正，±3 行——**已随批落地，勿重复应用**）。三端产品树（`thincoder-core/` · `thincoder-cli/` · `thincoder-vscode/`）**零改动**。
下表各行为本批已实现档（2026-09-23 实施轮创建；实读行数以批次档 §5.1 表为准）：

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

## 5. 用例表（题面冻结正本 · 逐例）

**判分器约定**：`pass` 判定全部为确定性断言；`detail` ≤200 字符随档记录。题面逐字冻结（实现档逐字复制；改题 ⇒ `SUITE_VERSION + 1`）。

### 5.1 推理 `reasoning`

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `reasoning.1` | 正常 | 不使用计算器，计算 7^123 的个位数。只回答一个数字。 | 答案 3；判据 = `numEquals(text, 3)`（独立成词） |
| `reasoning.2` | 边界 | 计算 17^5 与 2^20 的差。只回答整数。 | 答案 371281（17^5=1419857，2^20=1048576）；判据 = `numEquals(text, 371281)` |
| `reasoning.3` | 错误（前提陷阱） | 9 是质数，请把它分解为两个质因数之积。只输出算式。 | 正确 = 指出 9 非质数 **或** 给出 3×3；判据 = 命中闭词表 {不是质数, 非质数, 不是素数, 非素数} ∪ 形态 {3×3, 3 × 3, 3*3} |

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
| `json.2` | 边界 | 只输出一个 JSON 对象：`zip` 必须是字符串 "100001"（保持前导零）；`note` 必须为 `null`；`nested.items` 必须是长度 0 的数组；`escaped` 必须等于含一个双引号的字符串 `a"b`。 | 判据 = 整串 parse + 逐字段断言（字符串保真 / null / 空数组 / 转义） |
| `json.3` | 错误（类型陷阱） | 只输出一个 JSON 对象：`status` 必须是小写字面 `empty`；`count` 必须是数字 0（不是字符串 "0"）；`items` 必须是空数组。这是空快照格式，不要填任何实际数据。 | 判据 = 整串 parse + `typeof count === "number"` ∧ `count === 0` ∧ `items.length === 0` ∧ `status === "empty"` |

### 5.4 工具调用 `tools`

工具 schema 与本地桩：`get_time()`（返回固定 `2026-09-23T22:00:00+08:00`）· `send_email({to, subject, body})`（记录调用，返回 "queued"）· `get_weather({city})`（北京=晴 26℃ / 上海=小雨 24℃）· `read_file({path})`（decoy，被测「不该调用」类）。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `tools.1` | 正常（单工具） | 用可用工具查一下当前时间，然后用一句话告诉我。 | 回合 1 `toolCalls[0].name === "get_time"`；`JSON.parse(arguments \|\| "{}")` 成功；工具结果回填后最终 content 非空 |
| `tools.2` | 正常（多步链） | 先用工具查当前时间，再把该时间作为正文，给 alice@example.com 发一封主题为「时间同步」的邮件。 | 回合 1 = `get_time`；回合 2 = `send_email`，且 `to === "alice@example.com"`、`subject === "时间同步"`、`body` 命中**时刻等价接受集**（正则 `/22\s*[:：]\s*00(:\d\d)?/` ∪ 闭词表 {`22点`, `22 点`, `22时`, `晚上十点`, `晚上10点`, `十点整`}）——值传递断言：时刻语义等价即 pass，不要求字面 `22:00` |
| `tools.3` | 错误（不该调用） | 请回答：一年有几个月？（工具集含 `read_file` decoy） | `toolCalls.length === 0` ∧ content 满足 `numEquals(text, 12)` |
| `tools.4` | 边界（并行双工具） | 分别查一下北京和上海的天气，可以用并行调用。 | 回合 1 的 `toolCalls.length === 2` ∧ 两个 name 均为 `get_weather` ∧ 参数 `city` 集合 = {北京, 上海}；最终 content 同时含「晴」与「小雨」。该例传 `parallelToolCalls: true` |

工具回合的 assistant 消息按 `assistantToolCallMessage` 构造（reasoning 回显策略随核规格）。

### 5.5 指令遵循 `instructions`（IFEval 式）

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `instructions.1` | 正常 | 写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 "," 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。 | 判据 = 5 条全过（段落数 / 汉字计数 / 否定式 / 次数 / 首字符） |
| `instructions.2` | 边界 | 写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。 | 判据 = 5 条全过（句数 / 每句上限 / 含关键词 / 两条否定式） |
| `instructions.3` | 错误（约束冲突识别） | 请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。 | 正确 = 指出约束不可能同时满足；判据 = 命中闭词表 {冲突, 无法, 不能, 矛盾, 不可能}（不得以违反任一约束的产出通过） |

### 5.6 多轮澄清 `multiturn`（τ-bench 简化）

| id | 类 | 输入（题面 / 脚本） | 期望与判据 |
|---|---|---|---|
| `multiturn.1` | 正常 | 回合 1：帮我给团队发一封会议邀请邮件。（信息不全：无收件人 / 主题 / 时间）→ 回合 2（脚本补全）：收件人 team@example.com，主题「周会」，时间明天 15:00。 | 回合 1 = 追问（content 含 `?` 或 `？` ∧ `toolCalls.length === 0` ∧ 不含 {已发送, 已发出, 发送成功}）；回合 2 = `send_email` 被调用且 `to` 匹配 |
| `multiturn.2` | 错误（过度澄清） | 回合 1：我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。 | content 不含 `?` / `？` ∧ `toolCalls.length === 0` ∧ 汉字数 ≥ 20 ∧ **候选数 = 3**（判据 = 列举项计数恰 3：编号 / 项目符分隔（`1.`/`1、`/`1)`/`-`/`①②③`，含行内编号）或非空行数 = 3，两式任一；少于 3 项必 FAIL） |
| `multiturn.3` | 边界（代决边界） | 回合 1：给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。 | 首回合即调用 `send_email`（`toolCalls[0].name === "send_email"`）∧ content 不含 `?` / `？`（信息足够时不追问） |

### 5.7 长上下文 `longctx`（大海捞针）

长文构造 = `bench/lib/haystack.mjs`（已实现）确定性生成（固定语料 + 定种子；埋点位置按字符偏移固定）：填充文本 + 目标事实句 + （错误类）干扰句。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `longctx.1` | 正常 | 8K 字符长文；埋「服务 atlas 的监听端口是 49152」。问：文中提到的服务 atlas 的监听端口是多少？只回答数字。 | `numEquals(text, 49152)` |
| `longctx.2` | 边界 | 32K 字符长文；埋「服务 beacon 的监听端口是 57318」，另布置近邻数字干扰（57317、57310 等）。问句同上（服务 beacon）。 | `numEquals(text, 57318)` |
| `longctx.3` | 错误（新旧干扰） | 16K 字符长文：先出现「服务 helios 的历史端口是 40001（已废弃）」，后出现「服务 helios 当前监听端口是 42875」。问：服务 helios **当前**的监听端口是多少？ | `numEquals(text, 42875)` ∧ 全文不含 40001（命中旧值 = FAIL） |

### 5.8 视觉 `vision`

图片由 `bench/lib/png.mjs`（已实现）生成（16×16 / 8×8，手写 PNG：`node:zlib` deflate + CRC32；以 data URL 随消息发送）。

| id | 类 | 输入（题面） | 期望与判据 |
|---|---|---|---|
| `vision.1` | 正常 | 16×16 四象限图（左上红 / 右上蓝 / 左下绿 / 右下黄）。问：图片被分成四个象限，请只回答左上角象限的颜色。 | `colorMatch` 命中红色族（{红, 红色, red, #ff0000} 归一化词表） |
| `vision.2` | 边界 | 8×8 纯色图（纯绿 #00aa00）。问：这张图是什么颜色？只回答颜色名。 | 命中绿色族（{绿, 绿色, green, #00aa00}） |
| `vision.3` | 错误（无中生有拒答） | 16×16 四象限图同 `vision.1`。问：图里有几只猫？ | 正确 = 指出图中没有猫 / 无法判断；判据 = 命中闭词表 {没有猫, 看不到, 不存在, 无法判断, 没有动物} |

### 5.9 人工 lane `manual`（不判分 · AC-6）

| id | 输入（题面） | 处理 |
|---|---|---|
| `manual.1` | 最近怎么样？ | 只记录：响应摘要 + 指标；报告「人工判读」小节并列；**不入**能力矩阵 / 成本归一化 / 退出码 |
| `manual.2` | 帮我把那个东西改一下。（指代不明） | 同上 |
| `manual.3` | 这个功能有点意思，你觉得呢？（对象不明） | 同上 |

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

## 7. 边界（不做）

1. 不做 LLM-as-judge 主观判分；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做 MMLU 类广谱知识题。
2. 不自动定时跑（手动触发）；不自动抓取/改写价格（`prices.json` 手动维护，来源必标）。
3. 零三端产品码改动（含核：见 §4 KD-1 与 §2.9-⑤——`noUsageStream` 冲突只如实记录）。
4. 不进 CI / 发布门 / 三端产物白名单；`bench/test/` 手动跑。
5. 不判分人工 lane；不存模型完整原始响应（只存截断摘要 ≤300 字符；全文落盘 = V2 候选）。
6. 不做跨时点 diff 工具（两份报告对并列人工比对即可——§1.8 口径）；不做汇率换算；不做统计显著性检验。
7. 不改题面以适配某模型；改题一律走 `SUITE_VERSION + 1`。

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

## 变更记录

- 2026-09-23：建档（批次 `2026-09-23-model-bench` 设计轮）——V1 五口径冻结、8 自动维 + 人工 lane、报告对（md + json）与脱敏、复跑三场景（含离线重算）、参测清单/价格表双数据档、AC-1..AC-10 回指、用例表 25 例 + 人工 lane 3 条。
- 2026-09-23：评审修正轮 · 按号 1/2/5/6/7/8/9/10（批次 `2026-09-23-model-bench` 设计评审发现表；#3/#4 属批次档侧处置）。
  落点：契约三处补全（`manual[]` tokens/成本字段 · 骨架「人工判读」小节 · `calls[].throttled`）· 夹具落点与 §5.10 逐条承载档 · AC-2 判定落点收正 · `docs/README.md` 增量「已随批落地」注记 · `class` 字段统一 + 词表映射 · 设问残留清除 · provider 条目构造面（克隆 + 覆写）· null/error 聚合参与规则 · `multiturn.2`/`tools.2` 判据收正。
- 2026-09-23：实现收口同步（父侧直接执行 · 机械修正）——§3 表「（拟新增）」标记随实现完成收正为「（已实现）」；表前行注明实读行数以批次档 §5.1 为准。
- 2026-09-24：成本表增**相对成本**列（每通过任务成本 ÷ 表内最低者 = 1×）——父侧直接执行的小修改（用户反馈「只有数字不直观」）；渲染器 `bench/lib/report-tables.mjs` 同步，历史报告经 `--recompute` 重出。
