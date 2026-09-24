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
  ├─ lib/grade.mjs    判分器族（确定性原语：数字比对 / vm 实跑 / 严格 JSON / 工具结构 / 字面·计数文本约束）
  ├─ lib/judge.mjs    判官对与复核会话（judge.json + 核 chat 路径 + 结构化裁决 + 分歧仲裁 + fail-closed + 记账）
  ├─ lib/metrics.mjs  ttft / tok_s / 中位 / 聚合口径
  ├─ lib/prices.mjs   prices.json 读取 + 匹配 + 成本计算
  ├─ lib/report.mjs   结果对象 → md（骨架 + 五表 + 逐维明细 + 发现 + 局限）
  └─ lib/sanitize.mjs 脱敏谓词 + 写档前断言（报告与 JSON 共用）
```

题集档（`bench/cases/`，一维度一档）、工具桩（`bench/lib/tools.mjs`）、PNG 生成器（`bench/lib/png.mjs`）、长文生成器（`bench/lib/haystack.mjs`）、判官配置（`bench/judge.json`（已实现））见 §3 文件清单。

### 1.3 五口径冻结（设计条文 · 统一标准的核心）

| # | 口径 | 冻结内容 | 实现落点 | 变更规则 |
|---|---|---|---|---|
| 1 | **题集** | 题面文本 + 用例集（含隐藏用例）逐字冻结于本档 §5；`SUITE_VERSION`（整数）为版本标识 | `bench/cases/index.mjs`（已实现）（常量）+ 各维度档 | 增删改任一题面/用例 → `SUITE_VERSION + 1` |
| 2 | **判分** | **混合三层**（分层原则 = 是否需要「机器解释文本」——§2.10.2）：① **无需解释的面** = 机器断言（数字独立成词 / vm 实跑 / 整串 JSON / 工具结构 / 字面·计数文本约束）；② **需要解释的面**（文本结构 / 语义）= **判官对（A / B）双判**（LLM · 同一冻结 rubric → 结构化 `{verdict, reason}`，fail-closed；**位级失败 ⇒ 替代判级联**（换模型补判 · 逐级——替代池与终止口径 §2.10.1）；**分歧 ⇒ 第三判仲裁 · 多数决**）；③ **机械 fail** = **复核**（LLM 第二只眼 → `{uphold, overturn}`；**`overturn` ⇒ 改判 `pass`**（计入通过数 · `⟲` 标注）· 单判——**翻案承接机制见 §2.12**）。人工项只记录不判分（独立 lane） | `bench/lib/grade.mjs`（已实现：确定性原语）+ `bench/lib/judge.mjs`（已实现：判官对 / 仲裁 / 复核会话）+ `bench/judge.json`（已实现：三槽身份与预算）+ 各维度档 | 任一判据 / rubric / **任一位判官身份（A / B / 仲裁 C / 替代池任一项）** / 提示模板 / 复核触发面 / **判分合成（含替代判级联 · 单判定判） / 复核处置规则**变化 → `SUITE_VERSION + 1`（§2.10.3 绑定） |
| 3 | **计时** | TTFT = **首个非空 delta 到达**（content 或 reasoning 先到者）− 调用发起；单次调用 `totalMs` = **发起 → 返回 / 失败**的墙钟（**失败调用照记**——观测点 = client 调用侧；失败时 `ttftMs` / `tokens` 仍按实缺记 `null`）；`tok/s = Σcompletion ÷ Σ(per-call total − per-call ttft)`；token 只认 `usage` 精确值，**delta 近似禁用**（缺 usage 记 null，不估算） | `bench/lib/client.mjs`（已实现）· `bench/lib/metrics.mjs`（已实现） | 口径变化 → `SUITE_VERSION + 1`（跨版本不严格可比）；采集面补全（如失败耗时补录——KD-30）**不 bump**（判入规则见 §1.3-4） |
| 4 | **报告** | 报告对 `<日期>-<标签>.{md,json}` 同 basename；md 骨架 = §2.3 固定结构（方法 / 结果 / 局限三段必备 + 段序）；同骨架跨模型/跨时点可比；**段位与表列集 = 呈现面**（渲染面单源 = §2.3 骨架块） | `bench/lib/report.mjs`（已实现）· `bench/lib/report-tables.mjs`（已实现）· `bench/lib/report-time.mjs`（已实现）· `bench/lib/report-review.mjs`（已实现） | **呈现面变化（段位增删 / 表列集 / 排序 / 图例与脚注文案）不 bump**——结果数值 / 判定 / 分账 / 计时口径零改，在档报告可由 `--recompute` 以现行形态重出（§2.7）；`SUITE_VERSION` 轴 = 题集（口径 1）/ 判分（口径 2）/ 计时（口径 3）/ **结果数值构成规则**（分账 · 归一化 · 聚合口径——改则数值面跨版本不可比）；后两类见对应行（KD-27）；**版本轴枚举单源 = 本行**——KD-2 与渲染面「方法」行版本句 · `bench/cases/index.mjs` 注释 · `bench/README.md` 版本口径行的枚举以其为准（字面欠列第四项处按本行判读）；**版本轴判入 = 规则层**（测什么 / 怎么算 / 什么进数字）——**采集完整度补全**（如失败调用耗时补录——KD-30）与在档案数据**不入轴**（规则零改 ⇒ 不 bump；对照：把「`error` run 照计」改成「不计」= 规则变化 ⇒ bump） |
| 5 | **价格** | 单价只住 `prices.json`（手动维护 · `asOf` + `source` 必备）；成本 = §2.5 计算式；**价格变动不 bump suiteVersion**（另记 `prices.asOf`） | `bench/prices.json`（已实现）· `bench/lib/prices.mjs`（已实现） | 改价 = 改数据（无须版本号）；离线重算见 §2.7 |

**计时口径的实现依据（实测锚）**：核的流读面只在**非空** delta 时回调（`thincoder-core/provider/sse.mjs:142-149`）⇒ 空 role 起始块不产回调；TTFT 以「首个非空 delta」为观测点，是核路径上最接近「首字节」的可观测单位（被否候选见 §4 KD-7）。

**模型级温度例外（KD-31 · 2026-09-24 名单扩容批）**：温度 = **运行参数面**（同 `--max-tokens`：参数入档 + 报告披露），**不入版本轴**（§1.3-4 四轴零改）——缺省恒 0；仅当该模型 API **拒收 0** 时按档显式开例外（`models.json` 的 `temperature`，探针依据入批次档）。例外档的测量条件差异由 `models[].temperature` 入档 + 报告概览派生披露句承载（§2.3 · §2.2-12）——不设 CLI 全局温度参数。

**思考强度中档口径（KD-32 · 2026-09-24 参数口径批 · 用户 18:43）**：受测档统一取**该档自身标尺的中档**——① spec 枚举行含 `medium` ⇒ `medium`；② 枚举行无 `medium` ⇒ 按强度序取中位档（偶数项取较弱者；现行实测落 `high`）；③ 无枚举行（透传档）⇒ `medium` 直发（受理面已实弹 · 批次档 §1.5 · 29/29）。
**枚举行分类以实施后 spec 表为准**——`MODEL-SPECS.md` §13 建行后 `doubao-seed-2-1` 三档归 ① 类（该三行已声明七值枚举且含 `medium`；§13.3 在册）。
载体 = `models.json` 档位字段 `reasoningEffort`（与 KD-31 `temperature` 同构；用户 config 零改）；**不入版本轴**（运行参数面——同 KD-31）；可比性由逐档参数披露承载（§2.3 · §2.2-13）。
口径代际：v5 = 配置原值口径（不追改）；中档口径自下一代起效。

### 1.4 维度总表（V1）

| 维 | 键 | 用例数 | 判分器 | 类覆盖（正常/边界/错误） |
|---|---|---|---|---|
| 推理 | `reasoning` | 3 | 数字比对（独立成词）+ **判官**（`reasoning.3` 前提陷阱） | 1 / 1 / 1（前提陷阱） |
| 代码 | `code` | 3 | `node:vm` 实跑（4s 超时）+ 隐藏用例断言 | 1 / 1 / 1（修 bug） |
| 严格 JSON | `json` | 3 | 整串 `JSON.parse` + 字段/类型断言 | 1 / 1 / 1（类型陷阱） |
| 工具调用 | `tools` | 4 | 结构断言（name / arguments / 轮次）+ **判官**（`tools.2` 时刻等价 · `tools.4` 天气值传递） | 2（单/多步）/ 1（并行）/ 1（拒答） |
| 指令遵循 | `instructions` | 3 | 机器可验约束（字数/次数/格式/否定）+ **判官**（`.1` 段落结构 · `.2` 句结构 · `instructions.3` 冲突识别） | 1 / 1 / 1（约束冲突识别） |
| 多轮澄清 | `multiturn` | 3 | 结构断言 + **判官**（追问 / 候选 / 代决语义） | 1 / 1 / 1（过度澄清 / 代决边界） |
| 长上下文 | `longctx` | 3 | 事实命中（数字独立成词）+ **判官**（`longctx.3` 新旧区分） | 1 / 1 / 1（干扰） |
| 视觉 | `vision` | 3 | **判官**（色名 / 无中生有拒答） | 1 / 1 / 1（无中生有拒答） |
| 中文歧义（人工 lane） | `manual` | 3 | **不判分**——只记录 + 报告并列 | 不计分 |

合计：自动判分 **25 例** + 人工 lane 3 条。逐例题面与判据 = §5；判据面逐例裁定（机械 / 判官 / 混合）= §2.10.2；判官 rubric 与机械复核条文正本 = §5.11。
**判据面计数（D3）**：25 例中 **13 例含判官面**（`instructions.1` · `.2` · `instructions.3` · `reasoning.3` · `tools.2` · `tools.4` · `multiturn.1–3` · `longctx.3` · `vision.1–3`）、**20 例含机械面**（其中 8 例为混合面）——两集合的差 = 纯判官面 5 例。

## 2. 接口契约

### 2.1 CLI 契约

```text
node bench/run.mjs [--models <列表>] [--dims <列表>] [--label <名>] [--n <次>] [--max-tokens <N>] [--timeout <秒>] [--dry-run]
node bench/run.mjs --recompute --from <结果.json> [--label <名>]
node bench/run.mjs --rejudge --from <结果.json> [--label <名>]    # 跑后补判（判官面 error run 定点收正——§2.14）
node bench/preflight.mjs [--live]     # 跑前参数预检（枚举面缺省跑 · --live 实弹面——§2.13）
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
| `--rejudge --from` | 跑后补判分支（§2.14）：读入结果 JSON，对**判官面 error run** 定点重取素材（重跑该 run 的被测调用）+ 级联补判 → 落新报告对；原档不动（触网分支） | —— |

**语义细则**（冻结）：

1. `--dims` 词表统一——`--dims capability,speed,cost`（AC-1 例）= 全量跑 + 三轴全出；`--dims reasoning`（§1.8 子集复跑）= 只跑推理维（轴缺省 = 全轴，派生指标免费）；`--dims speed,cost` = 全量跑 + 只出速度/成本表。
2. 有效维度面（每模型）= `CLI --dims 能力项` ∩ `roster.dims`（若给）− `roster.skipDims`（若给）；被排除的维在矩阵中显示 `—`（不在该模型面），不是失败。
3. `capability` 关键字 = 8 个自动维，**不含** `manual`（人工 lane 需显式点名或使用缺省全跑）。
4. 温度 = `0`（缺省 · 冻结；经核 `tempRange` 归一裁剪，`thincoder-core/provider/core.mjs:186-192`）；**模型级例外**（仅当该模型 API 拒收 0——探针依据在册）：取 `models.json` 档位 `temperature`（0–2），实际取值逐档入档（`models[].temperature`）+ 报告披露（§2.3 · KD-31）。
   **思考强度 = 中档口径（KD-32）**：取 `models.json` 档位字段 `reasoningEffort`（缺省 ⇒ 沿用户 config 的 provider 条目原值；两者皆无 ⇒ 不发该字段）；实际发送值与来源逐档入档（`models[].reasoningEffort` / `reasoningEffortFrom`——§2.2-13）+ 报告披露（§2.3 逐档参数表）。
   `thinking` 等其余参数取用户 `~/.thincoder/config.json` 的 provider 条目原值（测「该配置下的实际表现」）。
5. 退出码：`0` = 跑完（**模型用例失败不影响退出码**——失败是数据不是错误）；`1` = 基建错误（参数错 / 未知模型 / provider 缺配置 / `prices.json` / `models.json` / `judge.json` 不可读或不合 schema
（**判分路径**；`--dry-run` / `--recompute` 的判官配置按 §2.10.3 豁免）/ 判官 provider 缺配置 / 判官对身份违约（A=B · 仲裁员 ∈ {A, B} · **替代池身份违约**——§2.10.3 ⑤）/ 判官冻结版本不匹配 / **预检枚举面阻断（§2.13——跑前 fail-closed · 逐条点名）** / 本轮合成全灭——§2.10.4）；中断（SIGINT）→ 中止在飞调用、**不落档**、退出码 130（半程结果不得混入留档）。
6. 输出：stdout 逐例进度行 + 结尾摘要表；`--dry-run` 不触网。结果对落 `bench/results/`（相对 `bench/` 目录解析，任意 cwd 可跑；目录不存在则创建）；结果目录可由环境变量 `BENCH_RESULTS_DIR` 覆盖（测试 / 沙箱用；缺省 = `bench/results/`，相对 `bench/` 解析；覆盖值 = 绝对路径直用、相对路径按 cwd 解析）。
7. 覆盖保护：目标文件已存在 → **拒写并提示换 `--label`**（留档不可被静默覆盖；删旧档 = 人工显式动作）。
8. **`--rejudge` 分支（补判 · §2.14）**：0 = 完成（含重取后仍如实 `error` 者）；1 = 基建错误（档不可读 / 不符 schema / 判官配置不齐 / provider 缺 / 预检阻断）；**无补判对象 ⇒ 明示 + 不落档 + 0**；**补判面全灭（全部对象重取后仍无定判）⇒ 仍取 0**——补判 = 定点收正（「如实仍 `error`」为其既定终局），全灭信号属运行面（§2.10.4），不在此重复设闸；SIGINT 同运行面（中止在飞、不落档、130）。

### 2.2 结果 JSON schema（`bench/results/<日期>-<标签>.json`）

```json
{
  "suiteVersion": 7,
  "label": "roster-29-v7",
  "startedAt": "2026-09-24T04:50:00+08:00",
  "finishedAt": "2026-09-24T05:12:11+08:00",
  "run": { "dims": ["capability", "speed", "cost"], "repeats": 1, "maxTokens": 4096,
           "timeoutSec": 120, "temperature": 0, "node": "v24.9.0", "command": "node bench/run.mjs --models …" },
  "prices": { "asOf": "2026-09-23", "currency": "CNY", "source": "…（表级出处）" },
  "recomputed": null,
  "judge": { "promptVersion": 1, "frozenAtSuiteVersion": 7,
             "fallbacks": [
               { "provider": "mimo", "model": "mimo-v2.6-pro", "host": "api.xiaomimimo.com",
                 "temperature": 0, "maxTokens": 8192, "timeoutSec": 30, "sameVendorAsTested": true, "calls": 2, "costCny": 0.0022 },
               { "provider": "qwen", "model": "qwen3.8-flash", "host": "dashscope.aliyuncs.com",
                 "temperature": 0, "maxTokens": 8192, "timeoutSec": 30, "sameVendorAsTested": true, "calls": 0, "costCny": null }],
             "judges": [
               { "id": "A", "provider": "deepseek", "model": "deepseek-flash", "host": "api.deepseek.com",
                 "temperature": 0, "maxTokens": 8192, "timeoutSec": 30, "sameVendorAsTested": true,
                 "calls": 377, "costCny": 0.2262 },
               { "id": "B", "provider": "glm", "model": "glm-5.3-flashx", "host": "open.bigmodel.cn",
                 "temperature": 0, "maxTokens": 8192, "timeoutSec": 30, "sameVendorAsTested": true,
                 "calls": 377, "costCny": null }],
             "arbiter": { "id": "C", "provider": "deepseek", "model": "deepseek-v4-pro", "host": "api.deepseek.com",
                 "temperature": 0, "maxTokens": 8192, "timeoutSec": 30, "sameVendorAsTested": true,
                 "calls": 2, "costCny": 0.0014 },
             "judgeCalls": 758, "costCny": 0.2298,
             "agreements": 375, "disagreements": 2, "arbitrations": 2, "unavailable": 0,
             "substitutions": 2, "singleJudged": 0 },
  "review": { "promptVersion": 1, "calls": 1, "uphold": 0, "overturn": 1, "costCny": 0.0007 },
  "models": [{
    "label": "mimo-flash", "provider": "mimo", "model": "MiMo-V2.6-Flash", "host": "api.xiaomimimo.com", "temperature": 0,
    "reasoningEffort": "medium", "reasoningEffortFrom": "models.json", "note": "",
    "dims": ["vision", "tools", "…"],
    "cases": [{
      "caseId": "vision.1", "dim": "vision", "class": "正常",
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
                                   "maxTokens": 8192, "finishReason": "stop",
                                   "tokens": { "prompt": 320, "cached": 0, "completion": 60 }, "costCny": 0.0006 }] },
                     { "id": "B", "verdict": "pass", "reason": "…≤300 字符（替代级定判）", "attempts": 2,
                       "substitutes": [{ "level": 2, "provider": "mimo", "model": "mimo-v2.6-pro",
                                         "cause": "位级失败：TimeoutError: …（传输面失败——进替代级）" }],
                       "calls": [{ "attempt": 1, "at": "2026-09-24T01:20:05+08:00", "totalMs": 30120,
                                   "maxTokens": 8192, "finishReason": null, "tokens": null, "costCny": null },
                                 { "attempt": 1, "at": "2026-09-24T01:21:02+08:00", "totalMs": 2100, "level": 2,
                                   "maxTokens": 8192, "finishReason": "stop",
                                   "tokens": { "prompt": 320, "cached": 0, "completion": 70 }, "costCny": 0.0011 }] }] },
        "summary": { "textHead": "…≤300 字符", "textLen": 96, "reasoningLen": 0, "toolNames": [] }
      }]}, {
      "caseId": "tools.3", "dim": "tools", "class": "错误", "prompt": "…（题面正本逐字——§2.2-11）",
      "runs": [{
        "n": 1, "verdict": "pass", "detail": "…≤200 字符（**原机械失败断言**——复核翻案⇒改判 `pass` 后仍留档；§2.2-9 / §2.11）",
        "metrics": { "ttftMs": 200, "totalMs": 480, "tokPerSec": 42.9,
                     "tokens": { "prompt": 26, "cached": 0, "completion": 12 },
                     "cost": { "value": 0.00005, "currency": "CNY", "pricesAsOf": "2026-09-23" } },
        "calls": [{ "round": 1, "ttftMs": 200, "totalMs": 480,
                    "tokens": { "prompt": 26, "cached": 0, "completion": 12 },
                    "costCny": 0.00005, "toolNames": [], "finishReason": "stop",
                    "throttled": false }],
        "review": { "verdict": "overturn", "reason": "…≤300 字符（复核理由）", "mechDetail": "…≤200 字符", "attempts": 1,
                    "calls": [{ "attempt": 1, "at": "2026-09-24T01:21:10+08:00", "totalMs": 1100,
                                "maxTokens": 8192, "finishReason": "stop",
                                "tokens": { "prompt": 380, "cached": 0, "completion": 70 }, "costCny": 0.0007 }] },
        "summary": { "textHead": "…≤300 字符", "textLen": 96, "reasoningLen": 0, "toolNames": [] }
      }]
    }],
    "aggregate": { "passed": 17, "total": 25, "costCny": 0.0123, "costPerPassCny": 0.0007,
                   "judgeCostCny": 0.006, "reviewCostCny": 0.0007, "overturns": 1 }
  }],
  "manual": [{ "promptId": "manual.1", "prompt": "…", "responseHead": "…",
               "metrics": { "ttftMs": 812, "totalMs": 4210, "tokPerSec": 31.4,
                            "tokens": { "prompt": 42, "cached": 0, "completion": 120 },
                            "cost": { "value": 0.00035, "currency": "CNY", "pricesAsOf": "2026-09-23" } } }],
  "warnings": ["usage 缺失：glm-5.3-flash（cost=null）", "价格未录：fixture:unpriced-model（位级成本 null——缺价如实路径样例）", "判官 A 位（deepseek:deepseek-flash）∈ 本次被测集合（自判 · 重合级别：同位）", "判官 B 位（glm:glm-5.3-flashx）∈ 本次被测集合（自判 · 重合级别：同位）", "判官 C 位（deepseek:deepseek-v4-pro）与被测同渠道（明示 sameVendorAsTested）"]
}
```

**样例判读（节选口径 · 2026-09-24 复审收正）**：样例 `models[]` 为**节选**（只列一个模型条目）——顶层 `judge` / `review` 块 = **全参测面**汇总；`models[].aggregate.*` = **该模型面**（`aggregate.judgeCostCny` 0.006 ≤ 顶层 `judge.costCny` 0.2298 即此口径）；顶层 `review.costCny` = 全轮复核调用合计（`calls = 1` ⇒ 合计 = 调用值 0.0007）。
**样例数值 = 示意**（顶层判官计数按 label 代际量级展布——29 档 × 13 判官面例；逐位与合计自洽，非当批实测读数）。

**字段纪律**：

1. `tokens` 只来自 `usage`（核已归一：`prompt_tokens` / `completion_tokens` / `prompt_cache_hit_tokens`，见 `thincoder-core/provider/sse.mjs:13-22`）；缺失 → 该字段 `null` + `warnings` 登录，**不近似**。
2. 每 `call`（工具环每轮一 call）独立记录指标——**失败调用亦落 `totalMs` = 发起 → 失败墙钟**（`ttftMs` / `tokens` / `finishReason` 照实缺记 `null`——§1.3-3 / KD-30）；用例级聚合规则 = 见 §2.3-1~3。
3. `verdict ∈ {pass, fail, error, skipped}`：`error` = 基建/接口错误（超时、HTTP 错、图像被拒），`skipped` = 不在该模型面（roster 维度面）；`error` run 的 `calls[]` 照记耗时（同条 2）。
4. 反泄漏：JSON 由**白名单字段构造**（不 spread provider 对象），写档前过 `sanitize` 断言（§2.8）。
5. **离线重算友好**：`calls[].tokens` 为原子账目 ⇒ 仅凭本档 + 新 `prices.json` 即可重算全部成本（AC-10）。
6. `manual[]` = 人工 lane 记录（每条一次调用）：`metrics` 与用例级 `runs[].metrics` 同形（ttft / total / tokPerSec / tokens / cost 五键）；tokens / cost 缺失纪律同条 1、3（缺 → `null` + `warnings`）；报告按条**单项列出**其调用成本（§2.3-④）。
7. `judge` / `review`（顶层）= 本轮判官配置快照 + 汇总（§2.10.6；判官面 = 逐位 A / B / 仲裁 C 快照 + 逐位与合计账目 + 分歧计数）；`runs[].judge` / `runs[].review` = 逐 run 裁决记录（判官面 = 合成分 `verdict` + `resolution` + 逐位 `judges[]`）——**未发生则不写字段**（不写 `null` 占位：null 与「未发生」不可分；仲裁位未触发 ⇒ `judges[]` 无 C 条目）。
    **在档 = v5 对（`roster-29-v5` · 本批全量跑批落档验收后；v4 对出档——用户 2026-09-24 16:01 裁定，时点 = v5 落档验收后）**（v3 对已按 KD-25 出档）⇒ 渲染与重算**无历史兼容分支**。
8. judge / review 的 `calls[]` = **逐尝试账目**（判官面含各替代级各一发——§2.10.1；tokens 只认 `usage`、缺即 null，纪律同条 1）+ 该次调用的 `at`（ISO 本地时点）——「版本/时点」入档的时点面；`maxTokens` 取该次调用实际值（= 该级配置值——单发语义下无放大分支）。判官面 = **逐位各自的 `calls[]`**（同一 run 内 A / B（+C）的账目分列，不合并）。
    **`attempts` 语义**：`attempts` = 该位 `calls[]` 条数（= 实际发起级数）；`calls[].attempt` = 级内尝试序号（单发语义下恒 1——级内无重发）。
9. `run.verdict` 恒为 `pass | fail | error | skipped`（**不扩展枚举**）：判官**级链穷尽**后方为 `error`（零有效判 / 分歧未决——§2.10.4 物理边界；detail 前缀「判官不可用」+ 括注成因 + `runs[].judge.verdict = "error"` + `resolution = "none"`）；
    **单判定判** ⇒ `resolution = "single"`（该有效判为 run 判定——`resolution` 枚举扩一值，`verdict` 枚举不动）；复核翻案 ⇒ **改判 `pass`**（计入 pass 计数）+ `runs[].review.verdict = "overturn"`（`⟲` 标注 = 经复核纠正 · 原机械 fail；**混合面形态（原机械 fail 短路 ⇒ 无 `runs[].judge`）另标「判官面未裁决」**——§2.11）。
10. **成本分账（AC-4 · 射程扩至判官对）**：判官（A / B / 仲裁 C）/ 复核成本**不进** `runs[].metrics.cost` 与 `aggregate.costCny`（被测成本面零污染）；只出现在 `runs[].judge.judges[].calls[].costCny` / `runs[].review.calls[].costCny` 与 `aggregate.judgeCostCny`（三位合计）/ `aggregate.reviewCostCny`（+ 顶层逐位与合计汇总）——**md 报告零展示**（成本表 / 概览账目句 / 判官行逐位均不列金额；金额只住结果 JSON——§2.10.5 / KD-29）。
11. `cases[].prompt` = **题面正本逐字**（单源取用例声明，不做二次重构）：静态用例 = 实际发送串逐字（与 §5 题面列口径同源）；多轮用例 = `prompt` + `build().followUps` 逐字声明式拼接（同 §2.6 `judge.question` 口径）；**构造型用例**（`build()` 带载荷：`longctx` 长文 / `vision` 图像）= 用例声明 `prompt` 逐字（含载荷括注）——**载荷不入档**（haystack / PNG 为确定性构造 ⇒ 可复现）。
    **采集面 = 运行期写入**（不依赖重跑用例源）⇒ `--recompute` 自足。**在档 = v5 对（本批全量跑批落档验收后；v4 对出档——用户 2026-09-24 16:01 裁定，时点 = v5 落档验收后）**（v3 对已按 KD-25 出档）⇒ 本字段**无历史兼容分支**。
12. `models[].temperature` = 该档实际温度（缺省 0；例外档逐档——KD-31）；渲染面据 `(models[].temperature ?? run.temperature) ≠ run.temperature` 派生概览**温度例外披露句**（§2.3）——旧档缺该字段 ⇒ 等价缺省（无例外；**缺省语义，非历史兼容分支**），`--recompute` 自足。
13. `models[].reasoningEffort` = 该档**实际发送**的思考强度值（中档口径——KD-32；来源 = 档位覆写或用户配置原值）；`reasoningEffortFrom ∈ {models.json, config}` 同写同缺；**未发送该字段 ⇒ 两键皆不写**（缺省语义，非历史兼容分支——旧档缺键 ≡ 未采集，渲染 `—`）；`--recompute` 自足（渲染只读档内值）。
14. `models[].note` = 该档备注（逐档来自 `models.json` 条目 `note`——`bench/lib/pipeline.mjs:205` 实读；渲染 = 概览模型表「备注」列（空值渲染 `—`）——`bench/lib/report.mjs:52-54` 实读同源派生）；**生效性事实**（如「服务端忽略 effort」）随本键披露（§2.3-9——不另设列）；`--recompute` 自足（渲染只读档内值）。
15. **替代判级联记档（§2.10.1 · KD-20 缺省不写口径）**：`runs[].judge.judges[].substitutes[]` = 该位实际启用的替代级链（逐项 `{level, provider, model, cause}`——`level` 自 2 起；`cause` = 上一级失败摘要 ≤160 字符）；`calls[].level` = 该尝试所属级（**1 = 原位 ⇒ 不写**——缺省语义）；原位全程成功 ⇒ **两键皆不写**（缺键 ≡ 未发生）。
    成本面按 `calls[].level` 的实际身份键计价（§2.10.5）；`--recompute` 自足（级链 + 逐调用级号 = 档内原子账目）。
16. 顶层 `judge` 块扩：`fallbacks[]` = **替代池快照**（逐项 `provider` / `model` / `host` / `temperature` / `maxTokens` / `timeoutSec` / `sameVendorAsTested` / `calls` / `costCny`——池内调用计入 `judgeCalls` 合计；代际自述面 §2.10.6；**样例节选 2 项——现行池 6 项与级联序逐字 = §9**）。
    同块增计数 `substitutions`（替代级启用次数）/ `singleJudged`（单判定判 run 数）——**计数恒写**（0 = 未发生，同 `agreements` 体例）。
    **旧代际档缺键 ⇒ 缺省渲染**（缺 `fallbacks[]` / 两计数——在档 v5 对 / 在飞 v6 对）：概览替代池行渲染「未采集」· 告警分列计数按「0 次启用」计（**缺省语义，非历史兼容分支**——体例同 §2.2-12/13）。
17. `rejudged`（顶层 · **仅补判产物写**）：`{ from, at, runs: [{ label, caseId, n, was, now, note }] }`——补判溯源块（§2.14）；常规运行 / `--recompute` 产物**不写**该键（缺省不写——同 KD-20 体例）。

### 2.3 md 报告契约（AC-3 / AC-9）

报告对 = `<日期>-<标签>.md` + 同 basename `.json`（同一次运行产出，md 完全由 JSON 数据渲染 ⇒ 两档恒一致）。**派生例外（唯一一处 · 2026-09-24 复审收正）**：§2.11「判官面未裁决」标注的判官面成员资格**不落 JSON**（单源 = 用例声明，同 §2.10.3「不另存字段」先例）⇒ 该标注的渲染输入 = 结果 JSON **+ 当前题集代际的用例声明**（第二输入）。与 §2.2-11「`--recompute` 自足」的关系：自足面 = **采集面字段**（题面等随运行期入 JSON ⇒ 重算不依赖重跑用例源）；标注派生读**当前代际题集声明**（仓内本地面——不破「不调模型 / 不触网」自足性），跨代际重算按当前声明判读（在档 = v5 对——时点 = v5 落档验收后 · 同代际 ⇒ 零暴露——§2.11）。骨架（固定，缺段即缺陷）：

```text
# 模型基准报告 · <标签> · <日期>
## 概览          —— 参测模型与配置（label/provider/model/维度面）· suiteVersion · prices.asOf · 通过率一览 · **温度例外披露句**（**仅存在例外档时**——由 `models[].temperature` ≠ 运行参数温度派生：逐档列 label 与取值；无例外 ⇒ 该句不出现 · KD-31）+ **逐档参数表**（模型 × [路由 / temperature / 思考强度（值 + 来源）/ maxTokens]——**参数面披露**：跨档 / 跨代可比性的前提 · KD-32 / KD-35）
              + **判官行 ×3**（A / B / 仲裁 C——provider:model / temperature / maxTokens / 超时 / 模板版本 / 调用次数 / 与被测重合标记（三级：该位 ∈ 被测（自判）/ 与被测同渠道 / 与被测无重合）；仲裁行注「仅分歧样本」）+ **替代池行**（级序 × `provider:model` + 启用次数——位级失败时按序补判 · §2.10.1；**旧档缺池快照 ⇒ 此行渲染「未采集」**——缺省语义 · §2.2-16）
              + **分歧率**（分歧 ÷ A/B 双有效样本）+ **评估开销分账句**（**逐字 = §2.3-8 冻结字符串**——实现同源 `EVAL_SPLIT_NOTE`；分账原则 = 不进被测成本与相对成本归一化 · 报告不列金额）
## 方法          —— 五口径冻结说明（§1.3 五条：判分为**混合三层**——确定性断言 / 判官对（A·B 双判 · **位级失败经替代判级联换模型补判** · 分歧经第三判仲裁）/ 复核）+ suiteVersion + 判官与复核模板版本（promptVersion）+ 运行参数（--n / maxTokens / temperature / 时点）
## 结果
### 能力矩阵     —— 模型 × 维度 → 通过/总数（`—` = 不在该模型面；按合计通过数降序；**加两列：总耗时 / 相对成本**——缺数据 `—`；**存在复核翻案的模型×维追加 `⟲` 标记**——翻案**已改判计入通过数**（`⟲` = 经复核纠正 · 原机械 fail；**两形态**——纯机械面完整纠正 / 混合面「判官面未裁决」），脚注说明口径）
              （两新列 = **同源照搬**（§2.3-10②）：总耗时 = 速度表「总耗时（中位）」· 相对成本 = 成本表「相对成本」；**行序不变**；与用时表「累计耗时」**不同源、并存**）
### 速度表 A     —— 模型 × [TTFT 中位 / tok/s 中位 / 总耗时（中位）/ 采样 run 数]（N>1 时取中位；**按 TTFT 中位升序** · 缺数据居末）
### 速度表 B     —— 同列集（**按 tok/s 中位降序——快者在前** · 缺数据居末；两表同规 · 脚注一份列表 B 后 · 轴门控 = `speed`——§2.3-10① / `render.7`）
### 用时表       —— 模型 × [累计耗时（Σ 该模型面内各 run 的 `runs[].metrics.totalMs`——**仅被测模型调用耗时，不含判官 / 复核调用**）/ **相对倍率（累计耗时 ÷ 全表最低正值 = 1×，同成本表「相对成本」体例）** / **排名（累计耗时升序——同值并列 · 后续名次顺延）** / 采样 run 数 / **合计通过数 · 相对成本（交叉列两列——同源照搬，§2.3-10④ / #276）**]
              （`skipped` 不入；`totalMs` = **未记录** ⇒ 不计入累计（不按 0 计）+ 脚注 · **失败调用照记 ⇒ 已记录的 `error` run 照计**——KD-28 / KD-30；按累计耗时升序 · 缺数据居末；轴门控 = `speed`）——**与速度表「总耗时（中位）」口径不同、并存**（中位 = 单次响应；本表 = 全套累计）；不入《关键发现》
              （口径行**逐字冻结两短语**：「error run 已记录耗时照计」·「`null` = 未记录」——`render.4` ⑦ 断言面同源；**部分 call 未记录 ⇒ 按已记录之和（下界）入累计 + 脚注注明「部分 call 未记录」**——§2.3-7）
              （**交叉列两列**：合计通过数 = 能力矩阵「合计」格同源照搬（`k/N`）；相对成本 = 成本表「相对成本」同源照搬（缺数据 `—`）；**行序不变**（不参与本表排序）——§2.3-10④ / #276）
### 成本表       —— 模型 × [总成本 / 每任务成本 / 每通过任务成本 / **相对成本（每通过任务成本 ÷ 全表最低正值 = 1×，直接读倍数）** / **合计通过数 · 累计耗时 · 相对倍率（交叉列三列——同源照搬，§2.3-10④ / #276）**]（价格未录/usage 缺失 → `—` + 脚注；按每通过任务成本升序）——**列集 = 八列**（成本面只表达被测模型的性价比）；脚注 = **分账原则句（单一字符串 · 逐字冻结 · §2.3-8）**：「评估开销（判官 / 复核）不进被测成本、不参与相对成本归一化——报告不列评估开销金额；账目见结果 JSON」
              （**交叉列三列**：合计通过数 = 能力矩阵「合计」格同源照搬；累计耗时 / 相对倍率 = 用时表同列同源照搬（缺数据 `—`）；**行序不变**（不参与本表排序）——§2.3-10④ / #276）
### 逐维明细     —— 每用例：**题面行（用例级一条——`cases[].prompt` 逐字 ≤300 字符；超限截断 `…`（截断只落渲染面，JSON 存全额））**；每用例 × 模型：判定（复核翻案的 run = **`✅ pass` + `⟲` 标记**——经复核纠正 · 原机械 fail；**判官分歧样本加 `⇄` 标记**）+ 关键指标 + **成本 + 相对成本（该用例内最低者 = 1×）** + 响应摘要（≤300 字符；**code-span 安全渲染 = 动态反引号包裹 + 换行 `⏎`——保真可审计**）
              + **判官理由行**（判官裁决的 run：逐位 A / B（分歧时 +C）裁决 + 定判位理由；**替代位标注 `（替代：<provider:model>）`** · 单判定判 run 注「单判定判」）+ **复核行**（该单元格有复核记录时：复核次数 / uphold / 翻案 + 翻案理由；**混合面翻案 ⇒ 附「判官面未裁决」标注**）
### 判官分歧     —— **判官质量仪表 + 审计线索**：逐条 = 用例 · 模型 · A 裁决 + 理由 · B 裁决 + 理由 · 仲裁（触发时：裁决 + 理由）· 合成分；无分歧 → 「本轮无判官分歧」（分歧标记只落逐维明细与本小节——能力矩阵只表达通过数）
### 复核翻案     —— **判据演进线索**：逐条 = 用例 · 模型 · 机械失败断言 · 复核理由（无记录 → 「本轮无复核翻案」；`overturn` ⇒ 改判 `pass`——§2.11；**混合面机械 fail 被翻案 ⇒ 逐条注「判官面未裁决」**——原短路未调判官 · 复核只裁机械面；**含翻案 ⇒ 尾部机器生成「承接清单」**——按用例归一 · 判据修复必修，§2.12）
                  （两小节在**仅轴运行**（无判分面命中）时记「本轮未运行」——骨架固定，缺段即缺陷）
### 人工判读     —— 人工 lane 逐条并列（题面 + 响应摘要 ≤300 字符 + 指标 + 调用成本按条单项列出 + **相对成本 = 同条内最低者 = 1×**；不判分；该 lane 未跑 → 本节记「未运行」）
## 关键发现      —— 数据性结论（仅名次/极值与计数，模板化生成；禁主观评价词；数据告警行含「判官替代补判 S 次 · 单判定判 T 次 · 判官不可用 M 次（有效判不足 m₁ · 分歧未决 m₂）· 判官分歧 K 次（仲裁 L）· 机械 fail 复核 N 次（翻案 K' 次）」）
## 局限声明      —— 固定模板（单次采样无置信区间 / 闭集判据不覆盖开放式质量 / 人工 lane 不判分 / 价格手动维护 /
                    同模型跨渠道差异 / 速度受服务端负载影响 / **响应只存摘要（≤300 字符）· 题面 = `cases[].prompt` 冻结正本（构造型用例的载荷不入档）** /
                    **语义面由判官对（A / B）按冻结 rubric 裁决；位级失败经替代池级联补判（替代身份 / 原因入档 · 告警分列），级链穷尽时单有效判定判或 `error`（透明记档）；分歧样本经第三判仲裁（判官对的同向误判不设外部复核）** /
                    **判官可与被测重合（自判轮次无外部对照）** /
                    **机械 fail 复核为单判信号（`overturn` ⇒ 改判 `pass` + `⟲` 标注；原机械断言与复核理由留档；混合面形态的翻案只裁机械面——判官面未裁决 · 逐条标注）** / V1 未覆盖面）
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
6. **判官 / 复核聚合（冻结）**：判官**合成分**（一致 ⇒ 该向；分歧 ⇒ 第三判多数决）直接决定 run 判定（`pass` / `fail`）；**合成无多数 ⇒ run `error`**（不引入第三态——§2.10.1 / §2.10.4）；复核**改判**——`overturn` ⇒ 该 run 判 `pass`（计入能力矩阵通过数；每通过任务成本与相对成本随之重算——通过数 +1 ⇒ 每通过任务成本下降）；`⟲` 标记、《复核翻案》小节与 JSON 记录（`runs[].review` + 原机械断言）保透明可审计；**混合面翻案 ⇒ 逐条标注「判官面未裁决」**（原机械 fail 短路未调判官——复核只裁机械面）。
7. **用时聚合（冻结）**：累计耗时 = Σ 该模型面内**实际执行**的 run 的 `metrics.totalMs`（`skipped` run 未执行 ⇒ 不入；**error run 已记录的调用耗时照计**——真实墙钟开销）；`totalMs` 为 `null` 的 run **不计入**（**不按 0 计**——同规则 2 之 ①）+ 该模型脚注（`null` = **未记录**：夹具未声明 / 在档数据 / 采集缺记；失败调用照记 ⇒ 新档 `error` run **不按「未记录」处置（不入脚注）**——KD-30）；
   **部分未记录分支（冻结）**：部分 call 未记录的 run（run 级 `totalMs` 为数值 ∧ 该 run `calls[]` 中存在 `totalMs` 非数值的 call）⇒ 按**已记录之和**入累计（**为下界**——该 run 实际墙钟 ≥ 此和；取向 = 尽量计入 + 明示）+ **该 run 入脚注**（脚注含「部分 call 未记录」字面——`render.4` ⑧ 断言面）；**本分支独立于 run 判定（`error` / `fail` 同规则）：部分未记录 ⇒ 入脚注**；`runMetrics` 公式零改（`sumPresent`）。
   样本全 `null` ⇒ 该模型格 `—`（排名 / 倍率同 `—` · 居末）。相对倍率 = 累计耗时 ÷ 全表最低正值（最低 = 1.0×）；排名 = 累计耗时升序（**同值并列 · 后续名次顺延**——1 · 1 · 3）；**采样 run 数 = 参与累计的 run 数**（含 `error` run——已记录耗时照计；**排除 `skipped` 与 `totalMs = null`**——与累计耗时同一参与面）。
   **射程 = 被测模型的执行耗时**——不含判官 / 复核调用（评估机制开销，分账原则同 AC-4）；与速度表「总耗时（中位）」（单次响应中位 · 仅 pass/fail run）口径不同、并存。

8. **成本表脚注字符串（逐字冻结 · 单一字符串）** = 「评估开销（判官 / 复核）不进被测成本、不参与相对成本归一化——报告不列评估开销金额；账目见结果 JSON」（骨架成本表行同字面）。与 §5.13 `render.3` ②③ 逐字对齐：② 的成本表块反例字面（`判官成本` / `复核成本` / 「两列」）均不在本串内；③ 的字面片段「不参与相对成本归一化」在本串内、脚注零金额 ⇒ ②③ 对同一渲染件同真（互斥消除）。
9. **逐档参数表（冻结）**：行 = 每一在册被测档（序同概览模型表）；列 = {模型 · 路由（provider:model@host）· temperature · 思考强度（`reasoningEffort` + 来源）· maxTokens（取自 `run.maxTokens`）}——单源 = 结果 JSON；温度例外档在该格注「档位例外」（与披露句同源派生，非第二真相源）；缺键（旧档未采集）⇒ 该格 `—`（不追改）。
   **生效性事实**（如「服务端忽略 effort」）**不设独立列**——随 `models[].note` 披露（概览模型表「备注」列——`bench/lib/report.mjs:54` 同源派生）。

10. **报告形态增补（#271 速度表双排序 / #272 能力矩阵两列 / #276 报告交叉列 · 冻结 · 用户 2026-09-24 22:37 / 22:48 / 22:51 / 22:5x + 2026-09-25 00:22 裁定链）**：三项均属**呈现面**（KD-27 ⇒ **不 bump**——本批 `SUITE_VERSION` 5 → 6 的归因 = 判官 B 换代 + 判据修订（#273 / #274，两项均判分口径面、共用一次），§6 末段；聚合参与口径零改——§7-12 射程不变）。
    **① 速度表双表（#271）**：标题逐字 = `### 速度表 A（按 TTFT 中位升序）` / `### 速度表 B（按 tok/s 中位降序）`；两表**列集逐字相同**（`| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |`）。
    注文 = 共享口径句（「只取正常返回的 run（pass / fail）；`--n` > 1 时取中位；token 计入 usage 精确值（缺 ⇒ `—`）」）+ 各自排序子句；排序键：A = TTFT 中位升序 / B = tok/s 中位降序（**缺数据居末**——`null` 键 A `?? Infinity` / B `?? -Infinity`），同键并列 = label 字典序（现行 A 表规则同源）。
    脚注（逐档缺数据句）**一份 · 列于表 B 之后**（两表共用、派生零改）；轴门控 = `speed`（两表同出同隐）。
    **② 矩阵两列（#272）**：列集 = {模型 · 维度… · 合计 · **总耗时** · **相对成本**}——两新列接在合计之后（既有列位零改）；**总耗时 = 速度表「总耗时（中位）」同源照搬**（单次响应中位 · 仅 pass/fail run；无参与样本 ⇒ `—`）。
    **相对成本 = 成本表「相对成本」同源照搬**（每通过任务成本 ÷ 全表最低正值 = 1×；缺 ⇒ `—`）；**行序不变**（合计通过数降序）；注文**须显式区分**：本列「总耗时」≠ 用时表「累计耗时」（不同源、并存）。
    **③ 在档 v5 对重出（实施后 · 用户点名）**：`--recompute` 从在档 v5 结果 JSON 重渲染 ⇒ 新形态（速度表 A/B + 矩阵两列 + 用时表 / 成本表交叉列【#276】 + 逐档参数表【#269】——v5 未采集 `reasoningEffort` ⇒ 该格 `—`，KD-35 缺省语义）。
    与 KD-35「v5 不追改」的关系 = **数值不追补 · 形态随重出**（「不追改」射程 = 数值 / 判定面；重出 = 同一 JSON 的渲染器升级——「重出非重跑」先例）；v5 记录面注 = 父侧落。
    **④ 报告交叉列（#276 · 用户 2026-09-25 00:22 · 台账 #276）**：**用时表 +2 列**（合计通过数 / 相对成本）· **成本表 +3 列**（合计通过数 / 累计耗时 / 相对倍率）——两表新列一律**尾接**（既有列位零改——照 #272 体例）。
    表头逐字定格——用时表 = `| 模型 | 累计耗时 | 相对倍率 | 排名 | 采样 run 数 | 合计通过数 | 相对成本 |`（列集 = 七列）；成本表 = `| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 | 合计通过数 | 累计耗时 | 相对倍率 |`（列集 = 八列）。
    **同源照搬（不另立算式——同值即同串，逐表对读可机验）**：合计通过数 = 能力矩阵「合计」格（`k/N`）；相对成本 = 成本表「相对成本」算式（每通过任务成本 ÷ **全表最低正值** · `toFixed(1)` + `×`）；累计耗时 = 用时表「累计耗时」（`fmtMs(totalMsSum)`）；相对倍率 = 用时表「相对倍率」算式（累计耗时 ÷ **全表最低正值**）；三处缺数据均 `—`（沿各自同源列的缺省语义）。
    **行序不变**：两表排序键零改（用时表 = 累计耗时升序 · 成本表 = 每通过任务成本升序）——新列不参与排序 / 不影响并列规则；两表口径注各补句（内容 = 交叉列同源出处 + 缺省 `—` + 不参与排序）；测试腿 = §5.13 `render.3` / `render.4` 扩展（正控 = 同源对读 / 缺数据 / 行序）。
    **轴子集口径（冻结）**：交叉列取值**不受轴门控影响**——轴子集（§2.1-1：`speed` / `cost` 只决定报告轴、不决定跑什么）只决定表出不出、不决定值算不算：数据面自足（交叉列与源表同一单源、同一算式）⇒ 源表未出时交叉列**照出值**；缺数据仍 `—`（同源算式本身缺——无价 / 样本全缺）；测试腿 = §5.13 `render.3` ⑩ / `render.4` ⑪（轴子集夹具——源表不出为前置）。

### 2.4 models.json（参测清单 · 配置文件）

```json
{
  "version": 1,
  "models": [
    { "label": "mimo-flash", "provider": "mimo", "model": "MiMo-V2.6-Flash",
      "dims": null, "skipDims": null, "note": "" },
    { "label": "kimi-k3", "provider": "kimi", "model": "kimi-k3",
    { "label": "kimi-k3", "provider": "kimi", "model": "kimi-k3",
      "dims": null, "skipDims": null, "note": "多模态；API 仅受理温度 1", "temperature": 1, "reasoningEffort": "high" }
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
| `temperature` | 可选 | **模型级温度例外**（0–2 数字）；缺省 ⇒ 0（冻结缺省）；仅当该模型 API 拒收 `temperature: 0` 时显式给（准入依据 = 探针实测在册——KD-31） |
| `reasoningEffort` | 可选 | **档位级思考强度覆写**（中档口径——KD-32）；取值 ∈ {`none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`}；缺省 ⇒ 沿用户 config 原值；非法值 ⇒ 装载即拒（§2.13 预检枚举面同源） |

纪律：① 条目 `provider` 在用户 config 中不存在 → **运行报错退出**（缺失名单点名）；② 清单与 `prices.json` 的**对齐键 = `provider:model`**（`label` 仅展示，可改；复合键是唯一标识——README 写明）；③ `dims` / `skipDims` 两个显式字段（分开承载「限定」与「跳过」两种语义，理由见 §4 KD-4）；
④ 温度例外准入 = **探针实测**（拒收 0 的 API 报错原文入批次档）——除例外档外全表恒 0；实际取值入档（`models[].temperature`）且渲染面派生披露句（§2.3 · KD-31）。
⑤ **preview 档不入测试名单**（通用原则——用户 2026-09-24 14:58 裁定，今后名单维护照此）。
⑥ **思考强度覆写（KD-32）**：值须与该档受理面一致——spec 枚举已声明 ⇒ 值 ∈ 枚举（核守卫同判 · 预检枚举面在跑前拦，§2.13）；
   透传档 ⇒ 值须有实弹受理读数（逐档值 = 批次档 §1.5 表）；**枚举行分类以实施后 spec 表为准**——建行后 `doubao-seed-2-1` 三档归「枚举已声明」面（§13.3 在册）。

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
`toolShape`（name / `JSON.parse(arguments || "{}")` / 轮次）· `textRules`（汉字计数、首尾、次数、否定式「不含」、阿拉伯数字禁用、含词——**纯字面 / 计数约束**）·
`firstJsonObject` / `argValue`（**值提取容错**（2026-09-24 承接修复 · KD-37）：`arguments` 严格 JSON 失败 ⇒ 取**首个平衡 JSON 对象**（重复拼接形态取首件）——值传递面（`multiturn.1` 回合 2）取值用；结构面（`toolShape` 等）严格语义不动）。

**判据分层原则（冻结 · 2026-09-24 判据修复批）**：分界 = 判定**是否需要「机器解释文本」**——见 §2.10.2（需要解释的文本结构 / 语义面 ⇒ 判官面；字面 / 计数 / 结构 / 执行 ⇒ 机械面）。`textRules` 规则表不含 `paragraphCount` / `sentenceCount` / `hanziPerSentenceMax`（及其解析件 `paragraphs` / `sentences`——零调用者，与判官化删词表件同款：删即归零，不留快通道）。
（字面 / 计数面照**响应全文**判定——不设「正文面」预解析：剔除附注 / 附录本身 = 文本结构解释，属判官面职责；字面违例若源自附注污染 ⇒ 复核翻案路径承接、逐条另裁。）
**分层面扫描（族成员逐条处置在册 · 批次档 §2.4 表）**：`numEquals`（数字独立成词——字面）· `strictJson` / `extractCode`（整串 parse / 末围栏抽取 = 题面契约的一部分；解析 / 执行结论无需解释）· `toolShape` / `parseToolArgs`（工具结构）· `preview` / `cellText`（呈现面）· `haystack`（构造面）· `sanitize`（安全面——全串扫描是本意）——均属「无需解释」面，留机械。
**`numEquals` 答值形态登记（2026-09-24 修正轮 · 承评审 #6）**：数字独立成词 = 面值判定（定义零歧义）；**题面格式约束四例**（`reasoning.1`「只回答一个数字」· `reasoning.2`「只回答整数」· `longctx.1` / `.2`「只回答数字」）= 答值形态 = 题面契约 ⇒ 留机械（形态违例 = 合理 fail）；
**无约束两例**（`tools.3` / `longctx.3`）= **「有意判定」登记**——等价形态（中文数字 / 千分位）机械判 fail 为有意；出翻案 ⇒ §2.12 承接（处置可为「答对与否（含等价形态）」移判官面）。
需要解释的面（语义 / 语用 / 结构）其裁决面 = `bench/lib/judge.mjs`（已实现——判官与复核，§2.10 / §2.11）；词表 / 正则不作判据（§1.3-2）。
**判官面谓词导出落点（消实施歧义 · 2026-09-24 复审收正）**：`JUDGE_FACE` = `bench/cases/index.mjs`（已实现——自用例声明 `judge` 派生的机读单源；兄弟导出 `MECH_FACE` = `mechRubric` 面）；§2.11「判官面未裁决」标注的渲染面**直接 import 该导出**（不重建派生谓词）。

工具桩（`bench/lib/tools.mjs`（已实现））：`get_time` / `send_email` / `get_weather` / `read_file`（decoy）——**全为本地确定性桩**，bench 绝不执行真实命令、绝不触网（除模型端点）。

### 2.7 复跑契约（§1.8 · AC-10）

| 场景 | 命令形态 | 行为 |
|---|---|---|
| 全量复跑 | `--models <列表> --label <标签>` | 常规运行 → 报告对 |
| 子集复跑 | `--models <列表> --dims <维度列表>` | 只跑选中维度（报告轴缺省全出） |
| **零 API 成本复跑** | `--recompute --from <结果.json>` | 读入结果 JSON → 以**当前** `prices.json` 重算每 call 成本与聚合 → 落**新报告对**（默认标签 = `<原标签>-recalc`）；**不调模型、不重判分、不触网** |
| **判定补全复跑（补判）** | `--rejudge --from <结果.json> [--label <名>]` | 读入结果 JSON → 判官面 error run **定点重取素材**（重跑该 run 的被测调用）+ **级联补判** → 落**新报告对**（缺省标签 = `<原标签>-rejudged`）；**触网**；原档不动——§2.14 |

离线重算的结构保证（AC-10 判定）：`--recompute` 分支**不 import** `bench/lib/client.mjs`（已实现）（构造性零网络）+ 判定用例 = 毒化 `globalThis.fetch`（抛错）后全流程仍成功（§5 复跑面用例）。重算产物记录 `recomputed: { from: "<原文件名>", at: "<ISO 时点>" }`；原档不动（留档不可变）。
**补判分支（`--rejudge`）**：与 `--recompute` 分档互斥——补判为**触网分支**（import `lib/client.mjs`；零网络结构保证只覆盖 `--recompute` 面，§2.14）；产物带 `rejudged` 溯源块（逐 run 原判定 → 新判定 + 重取素材时点）；补判档可再 `--recompute`（成本面重算照旧）。

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
   **provider 条目构造面（冻结）= 克隆用户 config 条目 + 覆写 `maxTokens` / `temperature` / `reasoningEffort` / `.model`**：核从**条目**读这些字段
   （`thincoder-core/provider/core.mjs:184` 的 `maxTokens`、`thincoder-core/provider/core.mjs:185-192` 的 `temperature` + `tempRange` 裁剪、`thincoder-core/provider/core.mjs:196-204` 的 `reasoningEffort` 启送 + 枚举守卫），
   且请求体模型名取条目（`thincoder-core/provider/core.mjs:178`）；`chat` 的 opts（`thincoder-core/provider/core.mjs:117` 解构）无这两位
   ⇒ 覆写不落条目会**静默失效**（仍按用户配置跑，破可比性面）；`.model` 覆写 = `models.json` 条目的 `model` 值；
   除上述覆写字段外，条目其余字段保持用户原值（渠道差异如实测）。
2. 计时钩子 = `onToken` / `onReasoning` 首次回调（§1.3 口径 3）。
3. 多轮工具链 = bench 侧小工具环：执行本地桩 → `assistantToolCallMessage(result, specForModel(model))` 构造工具回合 assistant 消息（**reasoning 回显策略随核规格**，`thincoder-core/model-specs.mjs:279-289`）→ 追加 tool 结果消息 → 续调。
4. 继承的核行为（如实记录、不改造）：重试 / 续写（`finishReason:"length"`）/ 限流门（`rateGate`）/ 日志与轨迹钩子（`traces` 默认关，落盘受用户配置门控）。暂停（限流等待）发生时该 call 记 `throttled: true`。
5. 已知缺口（上抛项 ①）：核按模型 spec 的 `noUsageStream` 抑制 `stream_options.include_usage`（`thincoder-core/model-specs.mjs` 的 glm 族 `:59-74` / minimax `:134-164` / gemini `:181-183` 带此标），与当日四家探针「include_usage 全部支持」相抵 ⇒ 这些模型可能无 usage ⇒ 成本记 `null`。**处置 = 如实记录 + 报告脚注**（改核越本批边界——零三端改动）。

### 2.10 判官机制（语义·语用面 · AC-1/2/3/5/6 + AC-13 双判）

**定位**：语义·语用面（「回复是否表达了某个意思」）不再以词表/正则为单一判据——由**判官对（A / B）**按**同一冻结 rubric**（判位差异只在模型身份）各自独立裁决，输出结构化 `{verdict, reason}`（可审计理由）；**分歧样本**由**第三判（仲裁员 C）多数决**合成（§2.10.1 合成规则）。

#### 2.10.1 接口契约（输入构造 · 输出契约 · fail-closed · 预算与单发语义）

```js
// 用例声明面（§2.6）：judge = { turn, rubric, question? }；grade 为 async，经 ctx.judge() 取裁决（合成分）
const j = await ctx.judge()   // → { verdict: "pass" | "fail" | "error", reason: string, resolution }
```

**输入构造（回合精确 · POC 教训①）**：判官输入 = 三段 = ① 题面（`judge.question` ?? 用例 `prompt`）② **判据条文**（`judge.rubric`，逐字）③ **响应原文 = `result.turns[judge.turn].text`**（该回合模型文本；经**单一取值点** `ctx.judge()` 提取——「声明式 `turn` + 单取值点」结构性防「喂错回合」复现）。**A / B（及 C）收到同一份三段素材**——rubric 单源，判位差异只在模型身份。
**素材面（frozen）**：判官输入 = 题面 + rubric + **该回合观测**（模型文本 + 该回合工具调用事实 `name` / `arguments`——与 §2.11 复核素材同形；`tools.2` 的 `body` 时刻等价判据只住 `send_email` 的 arguments，纯文本不可达——实施轮发现收正）；**不喂**：对话前后文 / 图像（rubric 载明事实正本；**喂错素材比判错更坏**——被否候选见 §4 KD-22）。**回合精确与单取值点不变**（§2.10.1 首段）。
**输出契约（逐位）**：`{"verdict": "pass" | "fail", "reason": "…"}`；`reason` 截断 ≤300 字符；**严格解析**（trim 后须以 `{` 起、整串 `JSON.parse`、`verdict` 必在枚举内）——与严格 JSON 面同口径；多余键忽略。
**调用面（双判 · 冻结）**：A / B **并行**发起（同一 run 的两判无相互依赖、输入素材同一份 ⇒ 并行不引入顺序偏差；判定延迟 = max 而非 sum；失败隔离天然——各自独立级联与记账）。分歧样本的第三判 C 为**依赖步**（待 A / B 结果齐备且相异才发起）⇒ 串行触发。被否候选：串行 A → B（被否：判定时长 ×2 无收益——串行省下的只有「A 位成功」时的 B 位调用，而失败面本就走级联补判）。
**位级失败与替代判级联（冻结 · 用户 2026-09-25 01:31 裁定「结论必得」+ 2026-09-25 01:46 裁定「一次不行就换模型」）**：判官**位**（A / B / 仲裁 C）取判 = 一条**有序级链** `[原位槽, 替代池第 1 项, 第 2 项, …]`（池 = `judge.json.fallbacks`，§2.10.3——**级联序 = 池序**，池长即级数上限；现行池 6 位逐字 = §9）；**三槽（A / B / C）角色不变**（池只作位失败时的补判级联，不改变正常判定面）。
**级链基址（单一）**：级 1 = 原位槽 · **替代级 k（池序第 k 项）⇒ 记档 `level = k+1`**——级号 = 池项固有，不因占用跳过而错位（§9 定稿序同此基址；`calls[].level` 的 1 = 原位 ⇒ 不写——§2.2-15）。
- **级内语义（逐级一致 · 同模型单发）**：每级**只发一次**——不可解析（含空输出 / `finishReason=length`）**或**传输面失败（超时 / HTTP 错）⇒ **该级失败 ⇒ 进下一级**；不设同模型第二发（含放大预算重试；核已含 HTTP 级重试；「换模型」即重试路径）。
- **替代级身份（运行期占用规则）**：取用时**跳过本 run 内已被占用的 `model` 字面**（原位 A / B / C + 已选定的替代位）——即**替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此**（静态校验见 §2.10.3；同模型双判无冗余的运行期延伸）；跳过项**不入调用记录**（`substitutes[]` / `calls[]` 无该项条目）——级号仍按池项固有记档（上文基址）⇒ 稀疏级号判读无歧义。
- **终止（逐位）**：某级得有效判（`pass` / `fail`）⇒ 该位定判（后续级不再发起）；级链穷尽 ⇒ 该位 `error`（逐级留证——`substitutes` + `calls[].level`，§2.2-15）。
**合成规则（冻结 · 多数决；按级联后的**实际有效判**计）**：
| A / B 有效判 | 第三判 C | 合成分（= run 判定来源） | `resolution` |
|---|---|---|---|
| 一致（同向） | 不触发 | 该向 | `unanimous` |
| 相异 | 触发 · 有效 ⇒ 多数派（2/3）定判 | 多数派 | `arbitrated` |
| 相异 | 触发 · 级链穷尽 | `error`（无多数——**物理边界**） | `none` |
| 恰 1 位有效（另一位级链穷尽） | 不触发 | **该有效判**（**单判定判**） | `single` |
| 零位有效（A / B 级链皆穷尽） | 不触发 | `error`（**物理边界**） | `none` |
定判位理由（`runs[].judge.reason`）：一致 ⇒ A 位理由；仲裁 ⇒ C 位理由；单判 ⇒ 该有效位理由；`error` ⇒ 成因说明（≤300 字符；前缀与成因括注 = §2.10.4 分列表）。
**fail-closed（禁猜、禁回退词表——射程不变）**：解析失败 / 超时 / HTTP 错一律**不猜**（不回落词表、不降级为空判定）；「结论必得」由**替代级联**承担：位级失败不再直接终结该 run——仅**级链穷尽**（或其类型属物理边界，§2.10.4）方为 `error`。
**预算与超时（从宽口径 · 用户 2026-09-25 01:46 裁定）**：`judge.json.maxTokens` 默认 **8192**（= 区间上限——三槽 + 替代池各位同受，§2.10.3）、区间 [1024, 8192]（**低于 1024 装载即拒**——POC 教训②：400 token 被思考烧尽 ⇒ 空输出）；`timeoutSec` 默认 30、区间 [5, 120]；`temperature` 冻结 `0`。
**从宽理由**：① cap 非实耗、计费按实际 tokens ⇒ 放宽只影响最坏时延，不动成本口径；② 级内单发 ⇒ 无第二发补救，预算须一次到位（截断类 `finishReason=length` 由预算面根治——实证 = v6 A 位 `multiturn.1` 在 4096 仍截断）；③ 取上限 ⇒ 零头部余量、无二次调参。判官预算与被测调用的 `--max-tokens` **解耦**（同一 suiteVersion 的判分口径不随运行参数漂移）。
**调用路径**：核 `chat`（`thincoder-core/provider/core.mjs:75`）经 `bench/lib/client.mjs`（已实现）的 `liveTransport`（请求构造面 = `judgeProviderEntry`：克隆用户 provider 条目 + 覆写 `.model` / `maxTokens` / `temperature`——**判官面三字段，effort 沿条目原值、不覆写**；与受测面四字段（含 `reasoningEffort`——§2.9-1）之差量见 §2.10.3）。

#### 2.10.2 判据分层表（逐用例 · 冻结）

判据面二分（原则 · 冻结）：**判定是否需要「机器解释文本」**——**需要解释**（段落 / 句 / 拒答 / 追问 / 候选质量……凡文本结构或语义的解释）⇒ **判官**（判官对 A / B + 分歧仲裁 C）；**无需解释**（字符 / 数字计数、字面包含、整串 JSON parse、VM 执行、工具结构）⇒ **机械**。
旧分界「纯函数可算 ⇒ 机械」之病：**可算 ≠ 可定义无歧义**——四次同病实证：`vision.3`（词表）· `multiturn.1–3`（追问 / 候选语义）· `instructions.1`（段落计数 / 附注块误计）；机械面 = 零解释类（不解释文本结构与语义）。

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
| `instructions.1` | `textRules` 纯字面 / 计数（汉字 ≥120 / 无逗号 / 「霓虹」≥2 / 首字「夜」） | **段落结构**（正文恰好 3 段——附注块不计，rubric = §5.11） | ✓ |
| `instructions.2` | `textRules` 纯字面 / 计数（含「截止」/ 无阿拉伯数字 / 不含「请」） | **句结构**（正文恰 2 句 + 每句汉字 ≤40——rubric = §5.11） | ✓ |
| `instructions.3` | —— | 约束冲突识别 | ✗（判官主判） |
| `multiturn.1` | 回合 1 仅 `get_time` 检索步（其余调用 ⇒ fail）；回合 2 **存在** `send_email` 且 `to` 匹配（多次调用 / 重复参数容错——正本 = §5.6 / §5.11） | 回合 1 追问语义（请求缺失信息、未谎称已发送） | ✓ |
| `multiturn.2` | 零工具调用 | 候选语义（未提问 + ≥3 个不同候选） | ✓ |
| `multiturn.3` | **存在** `send_email`（全记录序列；检索步合法——正本 = §5.6 / §5.11） | 不追问语义（信息足够即代决） | ✓ |
| `longctx.1–2` | `numEquals`（49152 / 57318） | —— | ✓ |
| `longctx.3` | `numEquals`（42875） | 新旧区分（不得把 40001 表述为当前值） | ✓ |
| `vision.1–3` | —— | 色名（红 / 绿）· 无中生有拒答 | ✗（判官主判） |
| `manual.1–3` | 不判分（人工 lane） | 不判分 | ✗ |

计数（D3）：判官面 **13 例** · 机械面 **20 例** · 纯判官面 5 例 · 混合面 8 例（上表末列 ✓ = 20 例（14 行））；机械面为纯函数（纯字面 / 计数 / 结构 / 执行——**零解释类**）；判据条文正本 = §5.11。重划附加（2026-09-24）：`instructions.1` / `.2` = 混合面（解释类条移判官面、字面 / 计数条留机械面——逐条裁定见批次档 §2）。

#### 2.10.3 判官配置 `bench/judge.json`（已实现 · 判官身份与预算）+ 与被测重合 + 冻结绑定

```json
{ "version": 1, "frozenAtSuiteVersion": 7,
  "judges": [
    { "provider": "deepseek", "model": "deepseek-flash", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "glm", "model": "glm-5.3-flashx", "maxTokens": 8192, "timeoutSec": 30 }],
  "arbiter": { "provider": "deepseek", "model": "deepseek-v4-pro", "maxTokens": 8192, "timeoutSec": 30 },
  "fallbacks": [
    { "provider": "mimo", "model": "mimo-v2.6-pro", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.8-flash", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "mimo", "model": "mimo-v2.6-pro-ultraspeed", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.7-max", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "ark", "model": "doubao-seed-2-1-pro-260915", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.8-27b", "maxTokens": 8192, "timeoutSec": 30 }],
  "note": "判官对（A = POC 已验 · B = 第二视角）+ 分歧仲裁 C + 替代池（位级失败 ⇒ 换模型补判 · 逐级 · 池长即级数——§2.10.1）；现行槽值与池序逐字以 §9 为准" }
```

| 字段 | 必填 | 语义 |
|---|---|---|
| `frozenAtSuiteVersion` | ✅ | 本判官配置冻结于的套件版本（须 === `SUITE_VERSION`，不等 ⇒ 拒跑——见下「冻结绑定」；**射程 = 三槽 + 替代池**） |
| `judges` | ✅ | **判官对**：长度恰 2 的数组——位序定身份（`judges[0]` = A · `judges[1]` = B）；两槽字段同构（`provider` / `model` / `maxTokens` / `timeoutSec`） |
| `arbiter` | ✅ | **仲裁员（第三判 C）**：A / B 分歧时触发（§2.10.1 合成）；字段同构。**必备**——缺 ⇒ 装载即拒（「分歧无仲裁」跑法不存在） |
| `fallbacks` | ✅ | **替代池**：有序数组（长度 ≥1）——位级失败时按级取用（**替代级 k = 池序第 k 项 ⇒ 记档 `level = k+1`**——级链基址 §2.10.1 / §9）；字段同构（`provider` / `model` / `maxTokens` / `timeoutSec`）。**级联序 = 池序，池长即级数上限**；缺 ⇒ 装载即拒（「无替代池的跑法」不存在——结论必得口径） |
| `provider`（各位） | ✅ | 用户 `~/.thincoder/config.json` 的 `providers[].name`（**只存名字，不存密钥**） |
| `model`（各位） | ✅ | 判官模型 ID（= 判分口径的版本字面，入档） |
| `maxTokens` / `timeoutSec`（各位） | ✅ | 预算与超时（区间校验见 §2.10.1，**逐位校验**，越界 ⇒ 装载即拒） |
| `note` | 可选 | 备注（随报告概览展示） |

**落点 = `bench/judge.json`（已实现 · 单职责数据档）**：判官不是被测条目——不落 `models.json`（否则 `selectEntries` / `--models` 会把它当选测模型）；不立通用配置档（被否：仅一类配置，过度抽象）；**槽位定身份**（A / B / 仲裁 C 由位序与键决定，文件不存 `id`——冗余字段可漂移）。
**判官必备（射程 = 三槽 + 替代池）**：文件缺失 / schema 不合 / provider 不在用户 config / **A=B** / **仲裁员 ∈ {A, B}** / **替代池身份违约（池内两两同 `model` 字面 · 或 ∈ {A, B, C}）** ⇒ **拒绝启动**（不存在「无判官跑法」「无仲裁跑法」「无替代池跑法」——同一 suiteVersion 只有一种判分口径；`--dry-run` 用夹具判官身份，`--recompute` 只读档内记录，`--rejudge` 按补判时现行配置校验）。
**无判官面 run**（如 `--dims code,json`——选中用例全部无判官声明的场景）：判官配置**仍须齐备并校验**（不存在「无判官跑法」），顶层 `judge` 块照写（配置快照 = 判分口径自述）；判定面计数为 0。
**与被测重合明示（AC-3 · 逐位 ×3 · 无拒跑闸）**：判官可与被测重合——**允许自判**（判官不得干预被测选择；用户 2026-09-24 03:16 裁定）。逐位三态，**三态均须明示、不得静默**：
① 该位 `provider:model` ∈ **本次运行的被测集合**（同位 / 自判）⇒ 正常启动 + 报告判官行该位标注「该位 ∈ 被测（自判）」；② 该位 provider 与被测任一条目**同渠道**（异 model）⇒ 正常启动 + 报告标注「与被测同渠道」；
③ 与被测无重合 ⇒ 报告标注「与被测无重合」。明示面 = `sameVendorAsTested`（渠道级重合——① / ② 两态均置 `true`）+ `warnings` **逐重合位各一条**（① 同位 / ② 同渠道两形态文案——点名位次与重合级别；③ 无重合 ⇒ **零条**）+ 报告判官行标注（三级同左）。
标注由**渲染面**从结果 JSON 派生（被测集 = `models[].provider:model`；判官槽 = `judge.judges[]` / `judge.arbiter`）——判官块**不另存字段**（D2：重合事实已由两侧键共同承载）——**替代池逐项同受本明示**（快照含 `sameVendorAsTested` + 逐项 `warnings` + 概览替代池行标注）；
**判官对身份校验（AC-13 · 机检）**：③ **A ≠ B**（`model` 字面不同——同模型双判无冗余）⇒ 违约拒跑；④ **仲裁员 ≠ A 且 ≠ B**（`model` 字面不等——同模型仲裁 = 复读票，无打破平局的价值）⇒ 违约拒跑。
两检均只认**字面**：同模型异名（如 `kimi-k3` / `k3`）机检不可判——配置纪律 = 三槽取实质不同模型；**替代池同受本纪律**（下文 ⑤）。A / B 是否同渠道**不作校验也不告警**（该格不涉与被测重合——重合明示只覆盖判官 vs 被测（上条）；共因故障由级联与合成 fail-closed 显影：级链穷尽 ⇒ run `error`）。
**替代池身份校验（⑤ · 机检）**：**池内各项两两 `model` 字面不同 ∧ ∉ {A, B, C} 的 `model` 字面** ⇒ 违约拒跑（同模型复读票在池面同样无价值）；**运行期另有占用跳过规则**（§2.10.1——替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此；两检同源于「同模型双判无冗余」纪律）。
**判官槽参数面（本批登记）**：判官 / 复核调用经 `judgeProviderEntry`（clone 用户条目 + 覆写 `model` / `maxTokens` / `temperature`）——**effort 面沿 provider 条目原值**（判官档无 effort 字段）⇒ 换槽时须核「条目 effort ∈ 该槽模型枚举」（否则核守卫瞬抛）；**预检枚举面覆盖三槽 + 替代池**（§2.13）。

#### 2.10.4 降级口径（AC-6 · 禁静默回退）

| 面 | 情形 | 处置 |
|---|---|---|
| 启动面 | 配置缺 / schema 不合 / provider 缺 / 判官对身份违约（A=B · 仲裁员 ∈ {A, B} · **替代池身份违约**——§2.10.3 ⑤）/ 冻结版本不匹配 | **拒跑 · 不落档 · 退出码 1** |
| 运行面（位级） | 位级失败（超时 / HTTP / 不可解析——**单发即败**） | **替代判级联**（换模型补判 · 逐级——§2.10.1）：透明记档（`substitutes` + `calls[].level`）+ 控制台即时一行 + 告警分列计数；**不坠落词表、不猜** |
| 运行面（单判） | 恰 1 位有效判、另一位级链穷尽 | **单判定判**：该有效判为 run 判定（`resolution = "single"`）+ 逐位留证 + 告警分列计数（单判定判 K 次）——**透明降级，非静默** |
| 运行面（终局） | 级链穷尽：零有效判 / 分歧未决 | 该 run `verdict = error`（detail 前缀「判官不可用」+ 括注成因「有效判不足」/「分歧未决」+ `runs[].judge.verdict = "error"` + `resolution = "none"`）· 控制台**即时**明示一行 · 报告告警计数（成因分列）· **跑后补判通道可收正**（§2.14） |
| 运行面全灭 | 本轮进入判官面的 run 数 > 0 且**全部**合成无定判（全池不可达） | 照常落档（模型数据已付费；档内 error 明示）+ **退出码 1**（基建故障信号） |

**终局口径（「必得」的物理边界 · 设计轮裁明）**：终止面仅剩两类**物理边界**（素材 / 候选在物理上不可得，非「放弃」）——① 级链穷尽后**零有效判**（全池不可达——系统性故障签名）；② A / B 相异且**仲裁级链穷尽**（无多数可合成）。边界处置 = 如实 `error` + **跑后补判**（§2.14——补判不承诺突破物理边界：重取后仍失败 ⇒ 仍如实 `error`）。
**被测侧失败（裁点 ⑥ · 裁明）**：**不受「结论必得」**——被测调用失败（模型超时 / 接口错）时**无素材可判**（判官面未进入），与判官可靠性无关；如实呈现形态 = 维持 `error` + `detail` 为接口错误文本（既有形态零改）+ **不入补判列**（§2.14）；报告告警行的 error 计数照含。

`error` 的区分呈现（§1.6 裁定点）：判官不可用 = run `error` + `runs[].judge.verdict = "error"` + `resolution = "none"` + detail 前缀（成因括注）；被测接口错误 = run `error`（detail 为接口错误文本）——
报告告警行分列计数（「判官替代补判 S 次 · 单判定判 T 次 · 判官不可用 M 次（有效判不足 m₁ · 分歧未决 m₂）」）；位级失败**逐级留证**：失败位与替代级的 `judges[]` 条目 / `substitutes` 照记（`verdict = "error"` + 成因）。
**素材缺失（防御分支）**：该回合观测为空（`turnMaterial` 无内容）⇒ 该位记 `error`（成因「素材缺失」——不猜、不降级为空判定）；**不进级联**（换模型不产生素材——级链对素材面无能为力；跑后补判（重取素材）在列，§2.14）。
被否候选（本批增）：① 传输面失败 ⇒ 同模型重试一次（被否：属 ⑤ 一般裁定之一形态——系统性超时 / HTTP 故障同模型重试零增益 + 双倍时延预算；「换模型」即重试路径——级联已覆盖）；② 替代级 = 仲裁员 C 承担（被否：位级补判属**替代池**面，C 位职责仍是分歧仲裁——混槽使失败归因变浑）；③ 无界级联 / 替代池不设长上限（被否：成本与时延无上界；池长即级数上限，池面调整 = 数据档改动 + 版本 bump）；④ 替代优先于原位（被否：原位身份 = 判分口径正本，替代仅在原位失败后启用）；
⑤ **同模型重试（任何形态——含放大预算重试）**（被否：用户 2026-09-25 01:46 裁定「一次不行就换模型」——级内 = 同模型单发；不可解析 / 传输面失败 ⇒ 该级失败 ⇒ 进下一级；预算从宽 = 根治路径，§2.10.1）。
被否候选（沿既有）：① 首次失败即中止整轮（被否：一次网络抖动作废整轮被测成本；全灭判据已拦系统性故障）；② 新增 `verdict` 枚举值（被否：为已由子记录承载的区分改动全链聚合/枚举/渲染，收益不成比例——`resolution` 扩 `single` 一值即可，`verdict` 枚举不动）。

#### 2.10.5 成本分账（AC-4 / AC-10 · 射程扩至判官对 · D6）

- 单价**同源** `prices.json`（按**各判官位**的 `provider:model`（A / B / 仲裁 C）走 §2.5 匹配与计算式；缺价 ⇒ 成本 `null` + 警告——**不估不转写**）。
- 口径（冻结）：**×2**——每个进入判官面的样本付 A + B 两判；**分歧样本 ×3**——追加仲裁 C；**位级失败样本追加替代级调用**（逐级 ×1——级内单发，无同模型第二发；最坏上界 = 位 × 级链长）。位级成本摊到 `runs[].judge.judges[].calls[]`（逐尝试）——**按 `calls[].level` 的实际身份键计价**（**`level` = k+1 ⇒ 池序第 k 项**——按该池项 `provider:model` 的匹配与计算式，不按原位键；缺价 ⇒ `costCny = null` + 警告逐实际身份）。
- 记账面 = `runs[].judge.judges[].calls[]` + `models[].aggregate.judgeCostCny`（该模型位 A+B+C 合计，含替代级）+ 顶层 `judge.judges[].costCny`（逐位）/ `judge.arbiter.costCny` / `judge.fallbacks[].costCny`（池内逐项）/ `judge.costCny`（合计）；**不进** `runs[].metrics.cost` / `aggregate.costCny`（被测成本面零污染——口径不变，射程扩）。
- 报告（KD-29）：**成本表列集 = 八列**（总成本 / 每任务成本 / 每通过任务成本 / 相对成本 + 交叉列三列——合计通过数 / 累计耗时 / 相对倍率，§2.3-10④）；判官与复核成本**均不进成本表**（评估机制开销整体——仅语义面 / 机械 fail 触发 · 非均匀发生 ⇒ 列于模型成本对比表会被读成模型自身开销，理由同 KD-21）；**评估开销金额报告零展示**（成本表 · 概览账目句 · 判官行逐位成本三处均不列——含「已录价位之和」口径句）；账目面 = **结果 JSON**（`judge.judges[].costCny` / `judge.arbiter.costCny` / `judge.costCny` / `review.costCny` / `aggregate.judgeCostCny` / `aggregate.reviewCostCny`——字段零改）；概览判官行给**逐位元数据**（A / B / C——provider:model / 参数 / 模板版本 / 调用次数 / 与被测重合标记）。
- `--recompute`：判官 / 复核成本随当前 `prices.json` 一并重算（档内**逐位**逐尝试 tokens = 原子账目，§2.7 结构保证不变）。
- 价格表孤儿判据（`bench/test/roster.test.mjs` · `roster.3`——2026-09-24 名单扩容批自 `bench/test/suite.test.mjs` 迁入）：命中在册条目 **或** **任一位判官键**（无孤儿）；已录价键 `matchPrice` 命中自身键（大小写 / 错拼守卫）。
- 被否候选：成本表按判官位拆三列（被否：表宽 + 归因面重复——概览判官行已逐位分列，成本表的行身份是被测模型）。

#### 2.10.6 元数据入档（AC-5 · 射程扩至判官对 · D4）

顶层 `judge` 块（§2.2-7）：`promptVersion`（判官提示模板版本）/ `frozenAtSuiteVersion` + **逐位**（`judges[0|1]` = A / B · `arbiter` = C）：`provider` / `model`（版本字面）/ `host` / `temperature` / `maxTokens` / `timeoutSec` / `sameVendorAsTested` / `calls` / `costCny`；**替代池** = `fallbacks[]`（同上逐项快照——池 = 判分口径组成部分，代际自述面）；
合计 = `judgeCalls` / `costCny`；分歧面计数 = `agreements` / `disagreements` / `arbitrations` / `unavailable`；级联面计数 = `substitutions`（替代级启用次数）/ `singleJudged`（单判定判 run 数）；复核 = 顶层 `review` 块（`calls` / `costCny`——账目主位；`judge` 块不双写）。
**时点** = 逐位逐调用 `calls[].at`（ISO 本地）；**任一位（A / B / C / 替代池任一项）换代 ⇒ `SUITE_VERSION + 1`**（§2.10.3 冻结绑定）。报告呈现 = 概览判官三行 + **替代池行** + 分歧率 + 方法行（模板版本）。

### 2.11 机械 fail 复核（第二只眼 · §1.7 / §1.8 裁定）

- **触发（冻结）**：`run.verdict === "fail"` ∧ 该 fail **非判官裁决**（`runs[].judge.verdict !== "fail"`；机械面 fail ⇒ 短路不调判官（§2.6）⇒ 触发形态 = 纯机械面 fail / 混合面机械 fail 两形态——「判官判 pass 但机械面 fail」不可达）∧ 用例有机械判据面（`mechRubric` 声明）。`error` / `skipped` 不触发；**判官裁决的 fail 不叠加复核**（禁判官叠判官）。
- **输入**：题面（`judge.question` ?? `prompt`；多轮题 = 逐回合用户文本的声明式拼接）+ **机械判据条文**（`mechRubric`）+ 响应观测（逐回合模型文本 + 各回合工具调用事实 `name` / `arguments`）+ **机械失败断言**（该 run 的 `detail`）。素材全部取自该 run 的真实观测（POC 教训①纪律同源）。
- **输出契约**：`{"verdict": "uphold" | "overturn", "reason": "…"}`；严格解析 / 预算 / 单发 / fail-closed 与 §2.10.1 同一套机制（复核模板 `promptVersion` 独立计入 `review.promptVersion`）。
- **处置（用户 2026-09-24 11:23 裁定）**：`uphold` ⇒ fail 维持；`overturn` ⇒ **改判 `pass`**——独立分类「**复核翻案**」，`run.verdict` 置为 `pass`、**计入 pass 计数**（改判落点 = 编排面 `pipeline.mjs`；原机械失败断言住 `runs[].review.mechDetail`，`run.detail` 维持原机械断言原文——判定与 detail 正交）；**混合面形态**（原机械 fail 短路 ⇒ 无 `runs[].judge`；复核输入只含 `mechRubric` ⇒ 只裁机械面）⇒ **判官面未裁决**——改判照旧 `pass`，呈现层逐条标注「判官面未裁决」（标注 = 渲染面派生：用例判官面声明（`JUDGE_FACE` 单源）× `runs[].review` 翻案记录——不新增 JSON 字段（同 §2.10.3「不另存字段」先例）；渲染输入 = 结果 JSON + 当前题集代际的用例声明——§2.3；旧代际处置 = KD-25（在档 = v5 对——时点 = v5 落档验收后 · 同代际 ⇒ 零暴露——§2.2-7 / §3 `bench/results/` 行））；
  同时 = **判据修复必修项** ⇒ 修题面/判据（`SUITE_VERSION + 1`）+ **承接（§2.12：产出机器化 · 落台账 · 修毕销账）**——**改判与修判据并行**（改判不免修：防每次跑都靠复核兜底）。被否候选：不自动改判（复核仅作旁证、不计 pass）（被否：复核产出零判定效力——「机械判 fail 即永不通过」，复核成本只换一条旁注；缺陷修复压力与改判本可并行，不必以扣着不计 pass 换取）。
- **复核失败**：调用失败 ⇒ fail 维持（**fail-closed**：无有效复核结论 ⇒ 不改判；不把 run 降为 `error`）+ `runs[].review.verdict = "error"` + 告警计数。
- **呈现**：结果 JSON = `runs[].review` + `aggregate.reviewCostCny` / `aggregate.overturns` + 顶层 `review` 汇总（记录形状不变）；逐维明细 = 判定单元格 **`✅ pass` + `⟲` 标记** + 复核行（复核 N 次 / uphold u / 翻案 o + 翻案理由；**混合面翻案 ⇒ 附「判官面未裁决」标注**）；
  能力矩阵 = 通过数**含改判**、存在翻案的模型×维追加 `⟲` + 脚注（`⟲` = 经复核纠正 · 原机械 fail；两形态——纯机械面 / 混合面「判官面未裁决」）；结果区 `### 复核翻案（判据演进线索）` 小节（用例 · 模型 · 机械失败断言 · 复核（混合面翻案逐条注「判官面未裁决」） · 复核理由；**含翻案 ⇒ 尾部「承接清单」段**——按用例归一 · 逐条给承接 / 处置 / 销账三要点，§2.12）；关键发现告警行含「机械 fail 复核 N 次（翻案 K 次）」。细节渲染样式 = §2.3。
- **运行提示（承接可见性 · 翻案不得静默）**：控制台摘要含复核计数行（`复核 N 次（uphold u · 翻案 k）`）；`k > 0` 时附「翻案 ⇒ 判据修复必修，承接清单见报告《复核翻案》小节」提示。
- **成本**：仅 fail 触发；独立记账（口径同 §2.10.5）——账目面 = **结果 JSON**（`runs[].review.calls[].costCny` / `aggregate.reviewCostCny` / 顶层 `review`）；**md 报告不展示评估开销金额**（成本表 · 概览账目句 · 判官行三处零展示——KD-29）；复核**统计**（次数 / uphold / 翻案 / 复核失败）住告警行与《复核翻案》小节（非成本面——不重复列于概览）。
- **判位数裁定（改判后仍保持单判）**：复核**保持单判**（沿判官 A 位的模型 / 会话 / 价格）。理由：① 复核的对照轴 = **机械 vs LLM**（KD-18），不是模型 vs 模型 ⇒ 第二个 LLM 观点不改变「机械判据是否自洽」的问题面；② 复核素材（机械判据条文 + 机械失败断言 + 逐回合观测）比判官素材更有据、问题面更窄 ⇒ 单模型足够；
  ③ 复核触发面 = 机械 fail 全量 ⇒ 双判成本 +100%；④ 双判复核会引入「无多数」失败面，而复核的失败处置 = fail 维持（fail-closed）⇒ 无降级可走、语义复杂化零收益；⑤ 误翻案面由承接机制显影（翻案 = 判据修复必修项 ⇒ 修复批逐条复核）。被否候选：复核同双判（被否：见左①–⑤——成本 +100% 而判定力增益有限）；复核由仲裁员 C 承担（被否：C 位价格 / 服从性未验，且复核触发面（机械 fail）与仲裁触发面（判官分歧）混在一槽，成本与失败归因变浑）。
- **判据-断言一致性纪律（2026-09-24 承接修复实证 · #273 / #274）**：机械断言与 `mechRubric` / 判官 rubric **逐例同口径**——rubric 已载明的合法形态（如「允许先经 `get_time` 等检索步」）断言必须随同；复核翻案已证两类不一致：① 题面-判据不一致（§5.12 类）；② 断言实现与判据条文不一致（`send_email.to` 严格单件解析 vs 值传递语义）。
  承接修复四步 = 断言与 rubric 对齐（**只修误判支 · 不放松真违规支**）→ 定点复现用例（修复前 fail / 修复后 pass——§5.13 `mech.1` / `mech.2`）→ 版本递增（判分口径面；与 B 换代共用一次 5 → 6）→ 销账 = 主 agent 确认（§2.12）。

### 2.12 复核翻案的承接与销账（判据修复必修项）

复核翻案 = **判据修复必修项**（用户 2026-09-24 04:26 裁定：复核产出必须落地，不许空转）。机制三段，**「自动」边界 = 产出侧机器化 · 承接与销账 = 人工确认**：

1. **产出（机器 · 每次运行）**：证据面 = 每轮报告《复核翻案》小节 + 结果 JSON `runs[].review`（机读）；**承接清单** = 该小节尾部由渲染面从 `runs[].review.verdict === "overturn"` **派生**（不新增 JSON 字段——单源同 §2.10.3 先例）：**按用例（`caseId`）归一**，逐条给「承接落点 / 处置 / 销账」三要点 + 证据指针（本小节 + 同名 `.json`）；控制台摘要同步提示（§2.11 运行提示）。
2. **承接（人工 · 主 agent · 台账）**：运行后逐条落**台账**（项目唯一待办面）——`kind=tech_todo` · `board=MODEL-BENCH` · `status=待设计` · 标题 `bench 判据修复：<caseId>（<缺陷摘要>）` · evidence = 报告 md 相对路径 + 机械失败断言 + 复核理由（+ JSON 坐标）；**同 `caseId` 的多条 run 翻案 = 一条条目**（追加证据，不重复立条）；修复批直接立批时，条目可由该批需求条目承担（先例 = 台账 #253）。
3. **销账（人工确认 + 机检证据）**：状态流 = 待设计（承接落账）→ 在途（修复批立批）→ 待核销（修复落地）→ 已核销（主 agent 确认）。**关闭证据（机检化）** = ① 该 `caseId` 的**定点复现用例**在册——
   构造串 = 缺陷形态串（「正文 3 段 + `---` + 自检块」）：**修复后 pass** = `judge.13` 机检（机械面全过（判官被调）∧ 桩判官 pass ⇒ run pass——case 级 + dry-run 全链路）；
   **修复前 fail** = 旧规则删除负断言（`text.1`：三 kind 已删 + 未知名 fail-closed）+ v3 实录（§5.13 重划输入证据）② `SUITE_VERSION` +1（判据代际标记，同步 `judge.json.frozenAtSuiteVersion`）③ 条目 evidence 记修复批档坐标。
   **不为每条翻案强制全量重跑**（成本；重跑按 §2.7 场景与用户点名执行）。

**边界（不做的）**：**改判不免修**——翻案改判 `pass` 不豁免判据修复（承接照出 · 修毕销账；防每次跑都靠复核兜底）· 不自动写台账 / 不自动核销（台账写权 = 主 agent；台账住用户数据目录 ⇒ bench 构造上不可读写——如实登记）· 不建独立清单档（第二真相源）· 不设「跑前门」（存在未处置翻案 ⇒ 拒跑：处置状态住台账、bench 读不到 ⇒ 误拒风险）。

### 2.13 跑批前参数预检（KD-34 · #266 · 脚本化 · 零落库）

**形态两面**：

**射程（本批扩）**：枚举面**三槽 + 替代池**逐项受检（池内项 provider ∈ config / spec 命中 / effort ∈ 枚举同口径——§2.10.3）；池内项越枚举 ⇒ 阻断（跑前显影——防「换槽参数错」类复发）。

1. **枚举面**（零网络 · fail-closed · 入 `run.mjs` 启动门）：逐档 + **判官三槽 + 替代池**做「config × spec」兼容判定，六项逐项裁定——
   ① provider 在用户 config：缺 ⇒ **阻断**；② spec 命中 `specMatch.matched`：未命中 ⇒ **阻断**（跑批面 fail-closed——名单档无专行 = 尺寸静默低估面；接替说明 = 预检先行 ⇒ bench 面不再依赖 `warnUnknownModel` 告警显影，产品面告警 + 兜底路径零改）；
   ③ `reasoningEffort` ∈ 该档 `reasoningEffortEnum`（若声明）：越枚举 ⇒ **阻断**（#264 类结构性防复发）；④ 温度档位值经 `spec.tempRange` 裁剪后 ≠ 档位值 ⇒ **报警**（不阻断——入档值 ≠ 实发值提示）；
   ⑤ 路由与 format 豁免面（`model` 含 `/` / `format ∈ {anthropic, google}` ⇒ effort 不启送）：命中 ⇒ **豁免**（③ 判定跳过；记录面按「未发送」语义——§2.2-13 两键不写；现行 29 档 + 判官三槽 `model` 名零含 `/` ⇒ 休眠面，format 面随用户 config 派生）；
   ⑥ thinking 面组合（`thinkApi` / `thinkEnabledValue`）：**豁免——不设判定**（运行面组合语义归核守卫单源 `thincoder-core/provider/core.mjs:193-220`，预检不复制——KD-34 被否候选 ② 双实现防漂移；逐档行打印 `thinkApi` 值供目检）。
   **阻断项枚举 = ① ② ③**；有阻断项 ⇒ **拒跑 exit 1 + 逐条点名**（启动门与 `bench/preflight.mjs`（拟新增）共用同一判定实现）。
2. **实弹面**（`--live` · 需密钥 · 1 发/档 · 单轮无工具 · 与运行面同构参数）：全档参数受理探针（透传档为**必测面**——无枚举行时核守卫不把关）；读数 = 受理 / 400 / 抛错 + 时延，逐档打印。

**接线与纪律**：实弹面**不入 run 自动路径**（花钱 + 需网络 ⇒ 跑批前由用户 / 父侧点名，循「点火 = 用户点名」口径）；枚举面零成本 ⇒ 每次跑批自动跑。
**零落库**：不写 `bench/results/`、不写台账、不改用户 config；读数入控制台 + 批次档 §5。
**单源**：`bench/lib/params.mjs`（拟新增）= 参数构造（config clone + `model` / `maxTokens` / `temperature` / `reasoningEffort` 覆写）+ 枚举面判定——`pipeline.mjs` / `run.mjs` / `preflight.mjs` 三处共用（防「预检一套、跑批另一套」漂移）。
**边界（如实）**：预检面 = 单轮参数受理面；用例面（tools / 视觉 / 多轮）由实跑本身检验（同 §1.5 口径）。

### 2.14 跑后补判通道（判官面 error run 定点收正 · §1.1 裁定 4）

**动机**：级链穷尽 ⇒ run `error`（§2.10.4 物理边界）——「免整跑重来」= 已落档 error run 提供**定点收正**通道（触发实证 = v6 跑批 `[101/770] deepseek-flash multiturn.1`：A 位 pass · B 位超时 ⇒ 有效判 1 ⇒ error——`.thincoder/tmp/bench-v6-run.log`）。

**命令形态**：`node bench/run.mjs --rejudge --from <结果.json> [--label <名>]`——`--recompute` 的姊妹分支（同为「读档 → 产新对」）：`--recompute` = **零网络**成本重算（判分面零改）；`--rejudge` = **触网**判定补全（被测调用定点重取 + 判官级联补判）。两分支互斥、可续接（补判档可再 `--recompute`）。

**补判对象（只判官侧失败）**：档内 `runs[].verdict === "error"` ∧ `runs[].judge.verdict === "error"` 的 run（判官面合成无定判——含「有效判不足」/「分歧未决」/「素材缺失」三成因）。
**被测侧失败不入列**（run `error` 且无判官面记录——接口错误 / 超时：**无素材可判**，裁点 ⑥ 已裁明——如实 `error` 维持，不属补判射程）。

**素材面（补判的前置事实）**：结果档**不存响应原文**（§7-5：只存摘要 ≤300 字符；KD-22 素材面最小化）⇒ 判官素材**不可由档内重建**（存量重判不可行的既有裁定——KD-33）。因此补判 = **定点重取素材 + 级联补判**：
1. 该 run 的被测调用**定点重跑**（该档该模型 × 该用例 × 该 `n`；参数沿原档：`run.maxTokens` / `run.timeoutSec` / `models[].temperature` / `models[].reasoningEffort`）；**素材构造单源**：题面 = 档内 `cases[].prompt`（逐字正本——§2.2-11）；
   工具面（`callOpts` = tools / `parallelToolCalls`）与载荷（haystack 长文 / PNG 图像）= **当前题集代际的用例声明**（用例源单源——同 §2.3 派生例外的第二输入体例）；
   跨代际重取 ⇒ 新样本按**当前**代际声明构造（样本替换语义——可比性按下方版本归属句判读）。
2. 新素材 ⇒ 判官级联判分（§2.10.1 同一机制）⇒ 该 run 判定与记录（`metrics` / `calls` / `judge` / `summary`）整体替换；
3. 重取后仍失败（被测侧 / 全池不可达）⇒ 如实保留 `error`（**不承诺突破物理边界**）。

**落档方式**：落**新报告对**（缺省标签 = `<原标签>-rejudged`）；**原档不动**（留档不可变 · KD-10 同名拒写照旧）；新档带溯源块（§2.2-17：`rejudged.from` / `at` / 逐 run `was → now`）；md 方法段加**补判产物句**（§2.3）。
**收编**（以补判对替换原档）= **人工动作**（用户点名；操作先例 = v5 重出「原对暂存 → 规范名重出 → 收编」——KD-25 体例）。
**无可补判对象**：明示一行（「本轮无判官面 error run——补判面零对象」）+ 不落档 + 退出码 0（写同值新对无意义）。

**版本归属与可比性（裁点 ⑦）**：补判按**补判时现行**判分口径执行 ⇒ 新档 `suiteVersion` = 补判时代际（本批后 = 7）；**原档仍标原代际**（v6 档 = 6——原档不动、不改写）；两档**不严格可比**（判分代际差——方法行版本句已载「跨版本不严格可比」）+ 补判产物句明示 + 溯源块逐 run 在档；同代际补判（档与机制同代）⇒ 可比性零损。

**退出码**：0 = 完成（含如实仍 `error` 者）· 1 = 基建错误（档不可读 / 不符 schema / 判官配置不齐 / provider 缺 / 预检阻断）· 130 = SIGINT（中止在飞、不落档）。
**补判面全灭（全部对象重取后仍无定判）⇒ 仍取 0**（补判 = 定点收正——「如实仍 `error`」为其既定终局；全灭信号属运行面 §2.10.4，不在此重复设闸）——与 §2.1-8 同口径。
**边界**：不自动触发（点名执行——循「跑批 = 用户点名」口径）；不覆盖原档；不补被测侧失败；不重判「判定已得」的 run。

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
| `bench/test/report-recompute.test.mjs`（已拆删——拆分见 2026-09-24 判分升级批表） | 0 | ~240 | §5.10 六条用例全承载 + dry-run 产物断言（AC-2）+ 报告骨架 + 脱敏断言 + **离线重算零网络**（毒化 fetch）；夹具内联于此档 |

测试面说明：`bench/test/` **不进任何 `npm test` / CI**（AC-8）——手动跑 `node --test bench/test/*.test.mjs`；本批实施轮验证 = 该命令 + 一次真实冒烟跑（1 模型 × 1 维，验证 AC-1/2/3/9 端到端）。`bench/results/` 目录随首次运行创建，产物（md + json 对）**入库留档**。
**夹具落点**：`--dry-run` 的固定响应表住 `bench/run.mjs`（已实现）；§5.10 的夹具结果 JSON 族（基准 / `tokens: null` / 损坏 / 毒化四变体）与「改价后的 `prices.json`」现住 `bench/test/fixtures.mjs`（2026-09-24 判分升级批拆分提取——旧 `report-recompute.test.mjs` 已拆删）；需要文件输入形态时由测试落临时档（不入仓）。

**2026-09-24 判分升级批（`2026-09-24-judge-hybrid`）受影响文件与行数预算**（现状 = 2026-09-24 实读行数 · 含 fix 轮双判 / 题面增量；三端零改动不变；夹具档 = `bench/test/fixtures.mjs`（拆分产物）；**实施实测读数（最终态全部 ≤300）= 批次档 §5.6**——预算住本表、实测住批档）：

| 文件 | 现状 | 预算 | 说明（拆分触发 = 超 300 行） |
|---|---|---|---|
| `bench/lib/judge.mjs`（已实现） | 300 | ~265 | 判官对/仲裁/复核会话：`judge.json` 装载 + schema 与身份校验（A≠B · 仲裁员第三方 / 冻结，fail-closed）+ 与被测重合明示（逐位三级 · 无拒跑闸）· provider 条目构造（克隆 + 覆写，§2.9-1）· 核 `chat` 调用（经 `liveTransport`）· 超时 · 级内单发（不可解析 / 传输失败 ⇒ 该级失败——§2.10.1）· **A / B 并行发起 + 合成（一致 / 第三判仲裁 · 多数决 / 无多数 ⇒ error）** · **分歧计数** · 逐位逐尝试记账（tokens / cost / at）· 判官与复核两版提示构建 + 严格解析（各自 `promptVersion`） |
| `bench/judge.json`（已实现 · 数据档） | 25 | ~26 | 判官对（A / B）+ 仲裁员（C）身份与预算（§2.10.3） |
| `bench/lib/grade.mjs` | 288 | ~245 | 增：`{ error }` 结果通路 + 判官结果合成件；删：语义词表件（`keywordSet` / `COLOR_FAMILIES` / `colorMatch` / `countEnumerations` + `enumerateCount` 规则——判官化后零调用者）；`numEquals` / `vmRun` / `strictJson` / `jsonFields` / `toolShape` / `parseToolArgs` / `textRules` 其余规则**行为零改动** |
| `bench/lib/pipeline.mjs` | 279 | ~295 | 判官会话装配 + judge / review 记录（合成分 + 分歧计数落盘）+ 题面采集（`cases[].prompt`）+ `error` 通路 + 合成全灭退出码；**拆分触发条件**：超 300 行 ⇒ `recomputeMain` + `validateResultShape` → `bench/lib/recompute.mjs`（已实现 ~70 行）· `writePair` / `refuseIfExists` / `isoLocal` / `displayPath` → `bench/lib/output.mjs`（已实现 ~50 行） |
| `bench/lib/prices.mjs` | 142 | ~175 | 判官 / 复核成本应用与聚合（同一成本式；缺价 / 缺 usage 纪律同源） |
| `bench/lib/report-tables.mjs` | 239 | ~300 | 成本表两列 + 逐维明细（**题面行** + 逐位判官行 / 复核行 + `⟲` / `⇄` 标记）+ 《判官分歧》小节 + 分歧率 + 《复核翻案》小节（超 300 ⇒ 拆 `bench/lib/report-review.mjs`（已实现 ~70 行：分歧 / 复核两小节 + 标记渲染）） |
| `bench/lib/report.mjs` | 162 | ~185 | 概览判官三行 + 分歧率 + 方法判分条 + 告警计数（含分歧 / 未决）+ 局限两条 |
| `bench/cases/index.mjs` | 61 | ~72 | `SUITE_VERSION` 2 → 3；判官面 / 机械面集合导出（§2.10.2 分层表机检素材） |
| `bench/cases/{reasoning,instructions,tools,multiturn,longctx,vision}.mjs` | 50 / 55 / 94 / 86 / 81 / 67 | 净增 ~10–25 / 档 | 判官声明 + `mechRubric` + 判据改写（删词表 / 正则）；`tools.4` 同轮并行要求落题面（§5.12） |
| `bench/cases/{code,json}.mjs` | 63 / 64 | 各 ~+8 | `mechRubric` + json 题面补词（判据零改动） |
| `bench/run.mjs` | 188 | ~205 | dry-run 夹具增判官对 / 仲裁 / 复核响应表（`FIXTURE.judge` = A / B / C 三脚本 · `FIXTURE.review`）+ 用法文本 |
| `bench/README.md` | 122 | ~165 | 判官对配置（A≠B · 仲裁员）与与被测重合明示 / 分歧合成口径 / 复核口径 / 题面入档 / 判据分层速览 |
| `bench/test/judge.test.mjs`（已实现） | 300 | ~265 | 桩传输测试（**不触网**）：解析 / 单发（不重发同模型）/ **双判一致 / 分歧仲裁 / 单判官失败 / 无多数** / A≠B 与仲裁员身份 / 与被测重合明示（自判放行 + 标注）/ 冻结 / 逐位成本记账 / 复核触发与改判 / 渲染面断言 |
| `bench/test/graders.test.mjs` | 146 | ~120 | 删被删函数用例；增判官结果合成件用例 |
| `bench/test/suite.test.mjs` | 161 | ~200 | 判官面 / 机械面集合 = 冻结清单；`judge.turn` / `rubric` 齐；多轮 `question` 含 `followUps`；`judge.json` schema = 三槽 + A≠B + 仲裁员第三方；价格孤儿判据扩「或任一位判官键」 |
| `bench/test/report-recompute.test.mjs`（已拆删——拆分方案见本行「说明」列） | 300 | ~330 | 判官逐位成本随新价重算 + 题面行渲染 / 截断 + 分歧面渲染（`render.1–3`）；**拆分触发条件**：超 300 行 ⇒ 拆两档（`recompute.test.mjs` ~135 = 重算面；`report-render.test.mjs` ~140 = 渲染 + dry-run 产物断言），夹具提取至 `bench/test/fixtures.mjs`（已实现 ~50 行） |
| `bench/results/` | 1 对（v3 · 当批唯一在档） | +1 对 | v3 重跑报告对（当批唯一在档 · 实施轮 · AC-7；该对已按 KD-25 出档——在档 = v5 对 · v4 对出档（用户 2026-09-24 16:01 裁定——时点 = v5 落档验收后）） |
| `docs/core/design/MODEL-BENCH.md` | 505 | 就地更新 | 本档（§1.3 口径 2 / §2.2–2.3 / §2.10–2.12 / §5.11–5.13 / §6 / §7 / §9 为本轮面） |

**2026-09-24 判官约束放宽批（`2026-09-24-judge-constraint-relax`）受影响文件**（现状 = 本批设计轮实读行数；三端产品树零改动；**零新增档**——全部就地更新；无 300 行拆分触发）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/judge.mjs` | 300 | −3 ±2 | 删逐位独立性拒跑闸；重合明示分级（同位 / 同渠道两形态告警文案 · 逐重合位各一条） |
| `bench/lib/report.mjs` | 189 | +3 ±2 | 概览判官行标注三级（渲染面派生——不增 schema 字段）；方法行去判官独立性旧句；局限模板增自判口径条（+1 行） |
| `bench/lib/pipeline.mjs` | 264 | ±0 | `resolveJudgeSlots` 调用注释收正（闸门 → 明示） |
| `bench/run.mjs` | 248 | −1 | 用法文本去独立性拒跑句 |
| `bench/README.md` | 160 | ±2 | 独立性段收正（无「∈ 被测 ⇒ 拒跑」残留） |
| `bench/test/judge.test.mjs` | 300 | ±0 | `judge.5` 断言反转（同位 ⇒ 正常跑 + 标注）；`judge.12` 保持 |
| `bench/test/report-render.test.mjs` | 240 | +1 | 方法行断言同步 + 概览判官行标注断言 |
| `docs/core/design/MODEL-BENCH.md` | —（本档） | 就地更新 | 本档（§1.3-2 / §2.1-5 / §2.3 / §2.10.3–2.10.4 / §3 / §5.13 `judge.5` / §6 / §9 / 变更记录） |

**2026-09-24 判据修复批（`2026-09-24-judge-reversal-fix`）受影响文件**（现状 = 本批设计轮实读行数 · **读数单源**：跨批漂移属正常，下轮判拆分触发（>300）以最新实读为准、实施最终读数入批次档 §5；三端产品树零改动；零新增档——全部就地更新；**降载（修正轮 #1）**：`judge.13` 迁 `graders.test.mjs` + 题面冻结清单迁 `fixtures.mjs`——两越线档收至 ≤300，见对应行）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/grade.mjs` | 260 | −15 ±5 | 删三规则件（`paragraphCount` / `sentenceCount` / `hanziPerSentenceMax`）+ 两解析件（`paragraphs` / `sentences`——零调用者）；`textRules` 余六 kind 行为零改（§2.6 / §2.10.2） |
| `bench/cases/instructions.mjs` | 59 | +12 ±4 | `.1` / `.2` 改混合面：`judge` 声明（段落 / 句结构 rubric = §5.11 正本逐字）+ `grade` 走 `judgeAfterMech` + `mechRubric` 收窄为机械条（题面零改） |
| `bench/lib/report-review.mjs` | 136 | +25 ±5 | 《复核翻案》小节尾部增「承接清单」段（渲染面从 `runs[].review` 派生 · 按 `caseId` 归一——§2.12） |
| `bench/lib/pipeline.mjs` | 264 | +5 ±2 | 控制台摘要增复核计数行 + 翻案承接提示（§2.11 运行提示） |
| `bench/cases/index.mjs` | 66 | ±0 | `SUITE_VERSION` 3 → 4（单源） |
| `bench/judge.json` | 25 | ±0 | `frozenAtSuiteVersion` 3 → 4（冻结绑定） |
| `bench/run.mjs` | 248 | +8 ±3 | `FIXTURE.judge` 增 `instructions.1` / `.2` 两例 A / B 脚本（`fixture.1` 覆盖；dry-run 全链路）+ 两例响应串改**缺陷形态串**（机械条全过——`judge.13` 端到端腿的定点复现夹具） |
| `bench/README.md` | 162 | +8 ±4 | 判据分层新分界（解释 ⇒ 判官 / 字面·计数 ⇒ 机械）+ 复核承接条 + 版本号 |
| `bench/test/graders.test.mjs` | 165 | −10 ±5 + `judge.13` ≈ +25 | `textRules` 用例收正（删段落 / 句 / 每句上限断言；未知名 fail-closed 负断言扩到三删除件）+ **承接 `judge.13`**（`judge.test.mjs` 越线降载——缺陷形态串 + 桩判官两态 + 短路；case 级 + dry-run 全链路）⇒ 预计 ~180 ≤300 |
| `bench/test/suite.test.mjs` | 296 | −30 ±3（净） | **降载**：题面冻结清单 `FROZEN_PROMPTS`（30 行）迁 `bench/test/fixtures.mjs`（夹具档；`prompt.1` / `prompt.2` 改 import）+ 分层冻结收正（判官面 11 → 13 · 混合面 6 → 8 · 纯判官面 5 不变）+ `SUITE_VERSION` 断言 3 → 4 ⇒ 预计 ~270 ≤300 |
| `bench/test/judge.test.mjs` | 298 | ±0 | **`judge.13` 迁出**（→ `graders.test.mjs`——原 +18 ±6 使本档越线；迁出后无净增）+ `judge.4` 断言串（`= 3` → `= 4`）与四处 `frozenAtSuiteVersion: 3 → 4` 夹具字面就地收正 ⇒ 预计 298 ≤300 |
| `bench/test/report-render.test.mjs` | 245 | +12 ±4 | `review.4`（承接段渲染 + 控制台提示）+ `suiteVersion` / `frozenAtSuiteVersion` 断言 3 → 4 |
| `bench/test/fixtures.mjs` | 126 | +30 ±3 | 题面冻结清单 `FROZEN_PROMPTS` 迁入（自 `suite.test.mjs`——`judge.13` 降载同批）+ 夹具 `judge.frozenAtSuiteVersion` 3 → 4 ⇒ 预计 ~157 ≤300 |
| `bench/results/` | 1 对（v3） | −1 对 + 1 对 | 重跑对入库（`flash-compare-v4` · 唯一在档）+ v3 对清理（重跑落档后 · KD-25） |
| `docs/core/design/MODEL-BENCH.md` | 925 | 就地更新 | 本档（§2.2-7 / §2.3 / §2.6 / §2.10.2 / §2.10.3 / §2.11 / §2.12 / §3 / §4 / §5.5 / §5.11 / §5.13 / §6 / §7 / §9 / 变更记录） |

**2026-09-24 复核改判批（`2026-09-24-review-override`）受影响文件**（现状 = 本批设计轮实读行数（2026-09-24）；三端产品树零改动；**零新增档**——全部就地更新；无 300 行拆分触发；**`bench/results/` 不重跑**）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/pipeline.mjs` | 267 | +2 ±1 | 复核记录后**改判落点**（`overturn` ⇒ `verdict = "pass"`——§2.11 处置）+ 注释 |
| `bench/lib/judge.mjs` | 299 | ±0 | `reviewRun` 注释收正（改判在编排面；复核记录形状零改） |
| `bench/lib/report-review.mjs` | 152 | +10 ±4 | 《复核翻案》小节口径句（改判 + 两形态）+ 逐条「判官面未裁决」标注 + 判官面谓词（`JUDGE_FACE`——导出落点 §2.6，import 不重建）+ 档内注释同步 |
| `bench/lib/report-tables.mjs` | 287 | +4 ±2 | 矩阵脚注 / 逐维明细图例（两形态）+ 复核行「判官面未裁决」标注 |
| `bench/lib/report.mjs` | 197 | ±1 | 方法判分条 + 局限条口径收正（含混合面翻案注明） |
| `bench/cases/index.mjs` | 66 | ±1（注释） | `SUITE_VERSION` 4 → 5（单源）；注释枚举随 §1.3-2 同步 |
| `bench/judge.json` | 25 | ±0 | `frozenAtSuiteVersion` 4 → 5（冻结绑定——§2.10.3） |
| `bench/run.mjs` | 252 | ±0（注释） | 夹具注释收正（`tools.3` 翻案路径语义）；夹具脚本零改（`FIXTURE.review` 照旧含 1 条 `overturn`） |
| `bench/README.md` | 166 | +4 ±2 | 复核口径（改判 + 两形态）+ `⟲` 语义 + 版本号 |
| `bench/test/judge.test.mjs` | 298 | ±0±2 | `review.1/2` 用例标题 / 注释收正（改判断言 = dry-run 全链路）；`judge.4` 断言串 4 → 5 + 四处夹具字面同步 |
| `bench/test/report-render.test.mjs` | 275 | +14 ±5 | `review.2` 断言反转（`✅ pass 1/1 ⟲` · 矩阵 `4/4 ⟲` · 合计 `23/25`）+ **`review.5` 两形态标注用例**（`mixedOverturn` 夹具 + 反例控制）+ 夹具版引用（`3/6`）+ `suiteVersion` / `frozenAtSuiteVersion` 5 |
| `bench/test/suite.test.mjs` | 264 | ±0 | `SUITE_VERSION` 断言 4 → 5（说明串同步） |
| `bench/test/fixtures.mjs` | 160 | +8 ±3 | 夹具 `suiteVersion` / `frozenAtSuiteVersion` → 5；`overturn` 夹具 run 判定 → `pass`（改判形态）；`mixedOverturn` 形态（混合面翻案夹具——`instructions.1`） |
| `bench/results/` | 1 对（v4 · `flash-compare-v4`） | **±0（不重跑）** | v4 对保留在档 = 代际标注（生成于改判前口径；`suiteVersion = 4` 字段即版本标识；v4 翻案 0 起 ⇒ 判定面与 v5 等价——§2.2-7 / KD-17） |
| `docs/core/design/MODEL-BENCH.md` | —（本档） | 就地更新 | 本档（§1.3-2 / §2.2（样例 · 在档注） / §2.3 / §2.10.3 样例 / §2.11 / §2.12 / §3 / §4（KD-17 / KD-18 / KD-26） / §5.12 / §5.13 / §6 / §7 / §9 / 变更记录） |

**2026-09-24 报告成本表收正批（`2026-09-24-report-cost-table`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-24；三端产品树零改动；**新增两档**（`report-time.mjs` / `report-present.test.mjs`——均因越线降载）；**`bench/results/` 不重跑 · 不重渲染**；版本口径 = **不 bump**（KD-27））：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/report-tables.mjs` | 292 | −6 ±3 | 成本表列集 = **五列**（删判官成本 + 复核成本两列渲染）+ 脚注句改为分账原则句（不列金额）+ `judgeCostNotes` / `modelStats.judgeCostCny` / `modelStats.reviewCostCny` 三处死件删除（金额零展示后零消费者——金额只住 JSON）+ `modelStats` 增用时面字段（`totalMsSum` / `sampledRuns`） |
| `bench/lib/report-time.mjs` | 0（新增） | ~45 | 用时表分段（**超 300 拆分触发**：`report-tables.mjs` 292 + 用时表 ~25 ⇒ 越线；体例同 `report-review.mjs` 拆分）——Σ / 倍率 / 排名 / 脚注 |
| `bench/lib/report.mjs` | 196 | +3 ±2 | 概览判官面两处收正（判官行去「成本」字段；账目句 → **评估开销分账句**（不列金额））+ 结果装配插入用时表（速度表后 · `speed` 轴门控；`report.1` 段序断言同步） |
| `bench/test/report-render.test.mjs` | 293 | −2 ±2 | `render.1`：成本表表头断言串收正（五列）+ 概览账目断言 → 分账句断言 + 缺价 md 断言两条删除（金额零展示后无指涉——缺价面由 `warnings` 断言承载）+ `report.1` 段清单增 `### 用时表` · 标题串「三表」→「四表」（均就地 · ±0 行） |
| `bench/test/report-present.test.mjs` | 0（新增） | ~55 | `render.3`（成本表列集 + 定域反例 + 报告零金额 + 账目面反控（JSON 字段零改））/ `render.4`（用时表 Σ 定域 + 倍率 / 排名 / null 脚注 + 轴门控） |
| `bench/README.md` | 168 | +5 ±2 | 成本表呈现说明收正（五列 / 评估开销金额报告零展示 / 账目见 JSON）+ 结果解读增用时表条 + 在档 v4 形态注（已按重出后实态收正——父侧直接执行 · 可 revert） |
| `bench/results/` | 1 对（v4 · `suiteVersion` 4） | ±0（不重跑；md 于 2026-09-24 按现行形态重出——用户点名） | 在档 = **现行呈现形态**（五列成本表 + 用时表；报告内「形态重出注」）；数值面零改（重出 = 同 json 重渲染 ⇒ 数字读数同源有效）；`--recompute` 指针照旧（KD-10 / §2.1-7） |
| `bench/cases/index.mjs` · `bench/judge.json` | 66 · 25 | **±0** | 不 bump（`SUITE_VERSION` 恒 5 · `frozenAtSuiteVersion` 恒 5——呈现面变化不入版本轴，KD-27） |
| `docs/core/design/MODEL-BENCH.md` | 1051 | 就地更新 | 本档（§1.2 / §1.3-4 / §2.2-10 / §2.3（骨架 + 用时聚合规则 7）/ §2.10.5 / §2.11 / §3 / §4（KD-27 / KD-28 / KD-29）/ §5.10 / §5.13（`render.1` 收正 + `render.3` / `render.4`）/ §6 / §7 / §8 / 变更记录） |

**2026-09-24 失败耗时计入批（`2026-09-24-error-duration`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-24 · 计数 = 末行含换行者不计空尾行；三端产品树零改动；**新增一档** = `bench/test/timing.test.mjs`（计时采集面用例无现成承载档）；版本口径 = **不 bump**（KD-30）；**`bench/results/` 不重跑 · 不重出**）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/client.mjs` | 189 | +3 ±2 | `runCase` 失败路径：call 尝试点取墙钟 ⇒ `catch` 记录 `totalMs` = 发起 → 失败墙钟（原硬编码 `null`）；`ttftMs` / `tokens` / `finishReason` / `throttled` 纪律零改（记录式与成功路径同源——`Date.now()` 差） |
| `bench/lib/metrics.mjs` | 93 | +2 ±1 | 头注 + `runMetrics` 注释语义句：`total = Σ per-call 耗时`（成功 = 传输面实测；失败 = 发起 → 失败墙钟照记）——**公式零改** |
| `bench/lib/report-time.mjs` | 43 | +3 ±2 | 口径行按本批收正（须含「error run 已记录耗时照计」与「`null` = 未记录」两短语）+ 脚注句加「未记录」定性 + **部分未记录脚注腿**（部分 call 未记录的 run 入脚注并注明「部分 call 未记录」——§2.3-7 / `render.4` ⑧） |
| `bench/test/timing.test.mjs` | 0（新增） | **~50 → 58（实施读数——父侧 2026-09-24 收正 · 可 revert）** | `timing.1`：超时腿（挂起传输 + `timeoutMs`）/ 接口错腿（延迟后抛错）/ 成功对照腿（夹具声明值原样）+ 聚合腿（`runMetrics`）+ 部分未记录腿（合成 `calls`——按已记录之和计） |
| `bench/test/report-present.test.mjs` | 89 | **+9 ±3 → +19（实施读数 89 → 108——父侧 2026-09-24 收正 · 可 revert）** | `render.4` 扩 ⑦ + ⑧：口径行短语断言 + 已记录 `error` run 照计且不入脚注（子腿 · 对 null 腿反例控制）+ 部分未记录腿（按和入累计 + 脚注在） |
| `bench/README.md` | 174 | ±1 | 用时表条口径句（`:117`）收正——**字面要求（两短语）**：「error run 已记录耗时照计」·「`null` = 未记录」（字面同源 = §2.3 骨架口径行）；**落笔 = 实施面**（随本批实施）；本批验收含该行**人工对读**（§6 AC 表补注 · 读数入批次档 §5 / §6） |
| `bench/results/` | 1 对（v4 · `suiteVersion` 4） | **±0** | **不重跑 · 不重出**（用户未点名）：在档脚注 = 该次采集实录（qwen `instructions.3` 1 个 run 未记录 · 明示「未参与累计」）；按现行措辞重出 = `--recompute`（点名动作） |
| `bench/cases/index.mjs` · `bench/judge.json` | 66 · 25 | **±0** | 不 bump（`SUITE_VERSION` 恒 5 · `frozenAtSuiteVersion` 恒 5——采集面补全不入版本轴，KD-30） |
| `docs/core/design/MODEL-BENCH.md` | 1094（本批前读数——就地更新后 1138 行 · 父侧 2026-09-24 收正 · 可 revert） | 就地更新 | 本档（§1.3-3 / §1.3-4 / §2.2-2~3 / §2.3（骨架用时表行 + 规则 7）/ §3 / §4（KD-28 交叉链 + KD-30）/ §5.13（`timing.1` + `render.4` 扩 + 测试策略 ④）/ §6 / §7 / 变更记录） |

**2026-09-24 名单扩容批（`2026-09-24-bench-roster-expand`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-24；三端产品树零改动；**新增一档** = `bench/test/roster.test.mjs`（数据面二测自 `suite.test.mjs` 迁入——新腿使 `suite.test.mjs` 264 行越线，按既有降载先例迁出）；版本口径 = **不 bump**（KD-31）；**`bench/results/` 不重跑 · 不重出**）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/models.json` | 53 | +~185（23 条 × ~8 行）→ **+188（实施读数 241——父侧 2026-09-24 收正 · 可 revert）** | 受测名单 6 → **29 档**（23 新增条目：逐档 label / provider / model / 维度面 / note〔`doubao-seed-2-0-code-preview-260215` 按用户 2026-09-24 14:57 裁定排除〕；现役 6 条零改）——provider 映射与维度面依据 = 批次档 §2.2 探针；kimi 四档携 `temperature: 1` |
| `bench/prices.json` | 71 | ≤ +~200（22 候选 × ~9 行；**取不到的不录**） | 价格补录：逐条官方定价页取证（`source` + `asOf` 条目级）；缺价如实（运行走既有无价警告路径——不编价 · 不转写相对口径） |
| `bench/lib/roster.mjs` | 65 | +6 ±3 | `temperature` 字段校验（存在 ⇒ 0–2 有限数字；非法 ⇒ 装载即拒——fail-closed 体例同 `dims`/`skipDims`） |
| `bench/lib/pipeline.mjs` | 269 | +3 ±1 → **−1（实施读数 268——父侧 2026-09-24 收正 · 可 revert）** | provider 条目构造两分支（dry-run / live）改读 `entry.temperature ?? 0`；`modelsOut` 记录 `temperature` 实际值（入档） |
| `bench/lib/report.mjs` | 198 | +6 ±3 | 概览模型表后增**温度例外披露句**（仅存在例外档时——由 `(m.temperature ?? run.temperature) ≠ run.temperature` 派生；旧档缺字段 ⇒ 等价缺省） |
| `bench/README.md` | 174 | +6 ±3 | models.json 维护段补 `temperature` 字段（模型级温度例外 · 缺省 0）+ 29 档名单注 |
| `bench/test/roster.test.mjs` | 0（新增） | ~110 → **156（实施读数——父侧 2026-09-24 收正 · 可 revert）** | 数据面：models / prices schema 两测迁入（自 `suite.test.mjs`）+ `roster.1`（29 档 · 逐名解析）/ `roster.2`（温度字段 schema）/ `roster.3`（价格键对齐）/ `temperature.1`（温度透传 · dry-run） |
| `bench/test/suite.test.mjs` | 264 | −56 ±5 | 数据面二测迁出（越线降载——净降） |
| `bench/test/report-present.test.mjs` | 108 | +14 ±4 | `render.5`（温度例外披露句：在位 / 不在位反例控制） |
| `bench/test/fixtures.mjs` | 170 | +6 ±3 | 夹具 `models[]` 补 `temperature`（缺省 0 + 例外变体开关） |
| `bench/results/` | 1 对（v4 · `flash-compare-v4`） | **±0** | 不重跑（跑批 v5 = 批尾点火——用户点名）；不重出（旧档缺 `models[].temperature` ⇒ 渲染按缺省走，与实态一致） |
| `bench/cases/index.mjs` · `bench/judge.json` | 66 · 25 | **±0** | 不 bump（`SUITE_VERSION` 恒 5 · `frozenAtSuiteVersion` 恒 5——KD-31） |
| `docs/core/design/MODEL-BENCH.md` | 1138（本批前读数——就地更新后 **1187** 行 · 2026-09-24 修正轮实读 · 计数尺 = 末行含换行者不计空尾行） | 就地更新 | 本档（§1.3 / §2.1-4 / §2.2-12 / §2.3 / §2.4 / §3 / §4 KD-31 / §5.13 / §6 / §7-13 / §9 指针 / 变更记录） |

**2026-09-24 bench v5 批（`2026-09-24-bench-v5`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-24 · 计数尺 = 末行含换行者不计空尾行；三端产品树零改动；**零新增档**；版本口径 = **不 bump**（价格 / 名单数据面不入版本轴——KD-2 / KD-31）；`bench/models.json` 零改）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/prices.json` | 252 | +~9（28 → 29 条） | ark 价格收尾：`ark:doubao-seed-2-1-lite-260915` 录入（0.80 / 2.70 / 缓存 0.16）+ `ark:doubao-seed-2-1-turbo-260628` 缓存价补 0.60 + `ark:doubao-seed-2-1-pro-260915` 来源句升级（值 6 / 30 / 1.2 零改）；三条 `source` = 火山方舟「模型价格」页（用户 2026-09-24 供页实读）· `asOf` 2026-09-24 · note 注缓存存储另计（成本式无该计费项）——逐条字面 = 批次档 §2.2 |
| `bench/test/report-render.test.mjs` | 291 | ±0 | `render.1` 缺价腿键字面替换：`ark:doubao-seed-2-1-lite-260915` → **合成键** `fixture:unpriced-model`（断言语义零改；价格补录不再连带改测试——§5.13 `render.1`） |
| `bench/results/` | 1 对（v4 · `flash-compare-v4`） | +1 对（`roster-29-v5` · 运行日命名）· −1 对（v4 出档） | v5 全量跑批报告对入库（**点火 = 用户点名**）；v4 对出档（用户 2026-09-24 16:01 裁定——时点 = v5 落档并验收之后；动作 + 验收见批次档 §2.4 / K2）——在档注见 §2.2-7 / §2.2-11 |
| `bench/README.md` | 178 | ±1（`:29-32` 块收正） | v4 出档连带面——`--recompute` 示例改指在档 v5 报告对（`bench/results/<v5 实测文件名>.json`，以落档实测名为准）+ `:30-31` 注按在档实态同步 · 消 v4 死指针；时点 = v5 落档并验收之后 · **随 v4 删除同一提交**；落笔 = 文档面（父侧届时定点）——动作 / 验收见批次档 §2.4 |
| `bench/cases/index.mjs` · `bench/judge.json` | 66 · 25 | **±0** | 不 bump（`SUITE_VERSION` 恒 5 · `frozenAtSuiteVersion` 恒 5——价格 / 名单数据面，KD-2 / KD-31） |
| `docs/core/design/MODEL-BENCH.md` | 1187（本批前读数——就地更新后 **1217** 行 · 计数尺 = 末行含换行者不计空尾行；小修级现盘复测） | 就地更新 | 本档（在档面全档扫齐——§2.2-7 / §2.2-11 / §2.3 / §2.11 / §3 / §6 注 / §7-12 / §9；另 §2.10.5 判据指针 · §5.13 `render.1` 缺价腿 · §6 本批 AC 回指 · §9 价格面 · 变更记录） |

**2026-09-24 参数口径与判官面收正批（`2026-09-24-bench-params-judge`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-24 · 计数尺 = 末行含换行者不计空尾行；**实施窗口 = v5 跑批落档并验收之后**——在飞进程已加载旧模块，本批改动不得先于 v5 落档提交）：

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/models.json` | 241 | +~60（29 档 × `reasoningEffort` 2 行余） | 逐档 `reasoningEffort` = 中档映射值（批次档 §1.5 逐档表：① 8 档 `medium` / ② 7 档 `high` / ③ 14 档 `medium`）；③ 组中 mimo×3 / minimax×2 的 `note` 补「服务端忽略 effort（实弹 2026-09-24）」 |
| `bench/lib/roster.mjs` | 70 | +8 ±3 | `reasoningEffort` 字段校验（存在 ⇒ ∈ 七值词表；非法 ⇒ 装载即拒——fail-closed 体例同 `temperature`） |
| `bench/lib/params.mjs`（拟新增） | 0 | ~90 | **参数单源**：provider 条目构造（config clone + `model` / `maxTokens` / `temperature` / `reasoningEffort` 覆写）+ 枚举面判定（provider / spec 命中 / effort ∈ 枚举 / 温度域对账 / 路由与 format 豁免 / 判官三槽）——`pipeline.mjs` 与 `preflight.mjs` 共用 |
| `bench/preflight.mjs`（拟新增） | 0 | ~110 | 跑前预检脚本：枚举面默认跑 + `--live` 实弹面（1 发/档 · 单轮无工具）；**零落库**（不写 `bench/results/` / 台账 / 配置）；退出码 0/1 |
| `bench/lib/pipeline.mjs` | 268 | +8 ±3 / −4 ±2 | 条目构造改走 `bench/lib/params.mjs`（拟新增 · 单源）；`modelsOut` 记 `reasoningEffort` / `reasoningEffortFrom`（入档）+ `note` 键已在（`bench/lib/pipeline.mjs:205` 实读——本批零改，实施轮复读为准；§2.2-14） |
| `bench/run.mjs` | 251 | +6 ±3（#266 启动门）+ +2 ±2（承接修复） | 启动面接入枚举面（零网络 fail-closed；有阻断 ⇒ 拒跑 exit 1 点名）；承接修复（#273 / #274）：dry-run `multiturn.1` 脚本回合 1 增 `get_time` 检索步（修复形态全链路覆盖——§5.13 `mech.1` ⑤）；判官 / 复核桩核对零改（`fixture.1` 复核脚本留存要求不变） |
| `bench/lib/report.mjs` | 203 | +14 ±4 | 概览增**逐档参数表**（列集见 §2.3 骨架行；温度例外格注「档位例外」）；温度例外披露句保留（同源派生） |
| `bench/lib/report-tables.mjs` | 287 | +10 ±4（#269 参数表）+ **~+18 ±6（#271 速度表双表 + #272 矩阵两列）** + **增补③：+1 ±2（#276 成本表交叉列）** | 参数表渲染件（`paramsSection`——列集 / 缺键 `—` / 来源列）+ **速度表双表**（`speedSection`——A / B 两块 · 标题 / 注文 / 排序键 / 脚注一份列表 B 后）+ **矩阵两列**（`matrixSection`——总耗时 / 相对成本 + 注文）；**拆分触发（合计后命中）**：287 + ~28 ⇒ 上限 ≈315 > 300——拆 `paramsSection` 姊妹档 `bench/lib/report-params.mjs`（拟新增；体例同 `report-review.mjs` / `report-time.mjs` 先例）；实施实测仍 >300 ⇒ 追加拆 `speedSection` → `bench/lib/report-speed.mjs`（拟新增）；**增补③（#276）**：成本表 +3 列（合计通过数 / 累计耗时 / 相对倍率——同源照搬 · 表头逐字 = §2.3-10④ · `costSection`）；注文补句；行序不变 |
| `bench/lib/report-time.mjs` | 48（增补③时点实读——wc 法） | +1 ±2（增补③ · #276） | **用时表 +2 列**（合计通过数 / 相对成本——同源照搬 · 表头逐字 = §2.3-10④ · `timeSection`）；注文补句；行序不变 |
| `bench/judge.json` | 25 | ±2 | B 槽改 `glm:glm-5.3-flashx`（U2 探针修订——§9 逐字）+ `frozenAtSuiteVersion` 6 |
| `bench/cases/index.mjs` | 66 | ±1（版本面 · 承接修复同批） | `SUITE_VERSION` 5 → 6（**归因 = 判官 B 换代 + 判据修订**（#273 / #274 承接修复）——两项均判分口径面、共用一次；版本轴归因见 §6 末段） |
| `bench/cases/multiturn.mjs` | 101 | +10 ±4（承接修复 · #273 / #274） | 机械判据收正：`.1` 回合 1 检索步白名单 + 回合 2 **存在**语义（`to` 取值容错）· `.3` 全序列存在语义（检索步后跟进）；`mechRubric` 两行同步（逐字 = §5.11 正本 · §5.6 期望列同口径） |
| `bench/lib/grade.mjs` | 235 | +20 ±5（承接修复） | 值提取原语 `firstJsonObject` / `argValue`（严格 JSON 失败 ⇒ 首平衡 JSON 对象——重复拼接形态取首件；§2.6 / KD-37③） |
| `bench/test/roster.test.mjs` | 155 | +20 ±5 | `roster.2` 扩 `reasoningEffort` schema 腿 + 新增 `roster.4`（29 档中档取值表逐档对读） |
| `bench/test/graders.test.mjs` | 216 | +45 ±10（承接修复 · 本批新增 `mech.1` / `mech.2`） | 定点复现两用例（合成 `turns`——不调模型）：修复后 pass 腿 + 实录形态腿 + 反例控制 + 原语直接腿 + dry-run 全链路（§5.13） |
| `bench/test/suite.test.mjs` | 203 | +1 ±1（承接修复） | `SUITE_VERSION` 断言 5 → 6（`:29` 说明串同步「判官 B 换代 + 判据修订」）；混合面清单（`:86-98`）与本档其余断言零改（判据面分层未变） |
| `bench/test/judge.test.mjs` | 298 | **−1（实施读数 297）** | 审计补登记（实施轮 out-of-list · 父侧 2026-09-25 裁定补行——实施已落 · 不回退）：版本字面 5 → 6 传播（四处——`:95` 断言串 = AC-3 点名 `judge.4` 断言 · `:102` / `:145` / `:227` 夹具；不改必红） |
| `bench/test/preflight.test.mjs` | 0（新增） | ~110 | `preflight.1` 六项对齐腿（枚举面；stub config + 真 spec 表 · 零网络） |
| `bench/test/report-present.test.mjs` | 124 | +16 ±4（#269）+ **~+30 ±8（增补轮）** + **增补③：+25 ±8（#276）** | 新增 `render.6`（参数表五态 + 零金额反控）+ **`render.7`（速度表双表：两表 / 行序 / 缺数据居末 / 列集正控 / 注文区分 / 脚注 / 轴门控）+ `render.8`（矩阵两列：同源对读 / 反例控制 / 缺数据 / 行序不变）**；**增补③（#276）**：`render.3` 扩 ⑦⑧⑨⑩（成本表 +3 列——八列头串 / 交叉列同源对读 / 缺数据 `—` / 行序不变 / 轴子集）+ `render.4` 扩 ⑨⑩⑪（七列列集 / 相对成本与合计通过数同源对读 / 缺数据 / 轴子集） |
| `bench/test/report-render.test.mjs` | 291 | ±3（#263）+ **~+4 ±2（增补轮）** + **增补③：±0** | `render.1` 缺价腿加固（表头五列正控 + 覆写补 `host` / `sameVendorAsTested` + 判官 B 行标注断言）——台账 #263；**增补轮**：`report.1` 段清单增 `### 速度表 A` / `### 速度表 B` 断言（`:106`）+ 矩阵断言面随两列同步（`:153` / `:288`——分块计数按新列对读）；**增补③（#276）**：`render.1` 成本表头正控串（`:33` / `:69`）+ 标题串「五列」→「八列」——**±0 行**（字面替换；该档实测 299——余量 1 行，不得加行） |
| `bench/test/fixtures.mjs` | 180 | +6 ±3（#269）+ ±0（承接修复——核对零改） | 夹具 `models[]` 补 `reasoningEffort` / `reasoningEffortFrom`（缺省 + 覆写两态）+ `note` 键已在（`bench/test/fixtures.mjs:81` 实读——`render.6` ⑤ 生效性腿沿用，实施轮复读为准）；承接修复：题面冻结清单（`FROZEN_PROMPTS`）核对零改——本批零改题（28 条逐字未动） |
| `bench/README.md` | 178 | +10 ±4 + **增补③：+2 ±2** | `reasoningEffort` 字段说明 + 逐档参数表一句 + 预检命令（`node bench/preflight.mjs [--live]`）+ 版本句改 6 + 判官 B 槽 + **速度表双表 / 矩阵两列一句**（结果解读节——增补轮）；**增补③（#276）**：`:107` / `:137` 两处「五列」→「八列」+ 用时表 / 成本表段交叉列句 |
| `thincoder-core/model-specs.mjs` | 292 | +~45（10 行 + 行注）⇒ ~337 | 建行 10 档 + 4 档视觉声明分态 + `mimo×3` / `MiniMax-M3` 行注补实弹事实——**取值与证据等级逐条 = `docs/core/design/MODEL-SPECS.md` §13**（行注草案住彼）；**>300 ⇒ 登记 + 拆分计划**（行数上限复读 / 拆点 / 落点 / 消解窗口 = §13.6「行数处置」段——单一落点） |
| `thincoder-core/test/model-specs.test.mjs` | 477 | **±0**（G-1..G-7 迁新载体档——500 硬限余量 23 行） | 仅 `[qwen] T-4/A-14` 退化锚**就地同名替换**（`qwen3.7-plus` 建行后不再是退化样本——改用仍在兜底的名字）；新增锚（建行逐名命中 / 「未探」词在场 / `multimodal` 分态）随 G-1..G-7 落新载体档（下行） |
| `thincoder-core/test/model-specs-bench.test.mjs`（拟新增——名实施轮定） | 0 | ~90–140 | G-1..G-7 承载档（`MODEL-SPECS.md` §13.8）；循 `model-specs-mimo.test.mjs` / `model-specs-qwen36.test.mjs` 先例（helpers 就地重定义 · 零 import 主档）；≤300 免登记 |
| `thincoder-core/test/core-hygiene.test.mjs` | 183 | +4 ±1 | `SOFT_LINE_REGISTRY` 增 `model-specs.mjs`（建行后 >300 登记——`MODEL-SPECS.md` §13.6「行数处置」段） |
| `bench/results/` | 1 对（v5 · 已落档） | **重出 1 对**（`--recompute` 新形态——用户点名） | 不重跑；**数值不追补 · 形态随重出**（§2.3-10③）——重出 = 速度表 A/B + 矩阵两列 + 逐档参数表（v5 未采集 `reasoningEffort` ⇒ 该格 `—`）；存量重判不可行照旧（KD-33）；v5 记录面注 = 父侧落；**增补③（#276）**：交叉列形态——在档对（已重出一次）如需再出 = 用户点名 `--recompute`（数值不追补 · 形态随重出——同 ③）；不自动执行 |
| `docs/core/design/MODEL-BENCH.md` · `docs/core/design/MODEL-SPECS.md` | 1218 · 1315（本批前读数——增补②后就地更新后 1359 行；**审计后收正微轮后就地更新后 1361 行**；**B 终值修订轮后就地更新后 1364 行**；**增补③（#276）后就地更新后 1375 行**；**设计收正轮（轮 4）后就地更新后 1378 行**（末行空尾不计）） | 就地更新 | 本档：§1.3 / §2.1-4 / §2.1-5 / §2.2 / §2.3（含规则 10）/ §2.4 / §2.6 / §2.9 / §2.10.1 / §2.10.2 / §2.10.3 / §2.11 / §2.13（新增）/ §3 / §4（KD-32…37）/ §5.6 / §5.10 / §5.11 / §5.13 / §6（#271–#274 + #276）/ §8 / §9 / 变更记录；`MODEL-SPECS.md`：§13（新增）+ 变更记录（承接修复零改） |
**2026-09-25 判官替代判批（`2026-09-25-judge-fallback`）受影响文件**（现状 = 本批设计轮实读行数 · 2026-09-25 · 计数尺 = 末行含换行者不计空尾行；三端产品树零改动；
**新增三档**（均拟新增）= `bench/lib/judge-fallback.mjs`（拟新增）+ `bench/lib/prices-judge.mjs`（拟新增）+ `bench/lib/rejudge.mjs`（拟新增）（三拆点 = 300 行上限触发）；**版本口径 = 6 → 7**（判分合成规则 + 判官身份面（替代池）——§1.3-2 / KD-40）；`bench/results/` 零触）：

| 文件 | 现状 | 预期增量 | 说明（拆分触发 = 超 300 行） |
|---|---|---|---|
| `bench/lib/judge.mjs` | 298 | −25 ±5 | 合成段迁出（级联编排 / 池装载 → `judge-fallback.mjs`）；`callSlot` / 提示 / 解析 / 记录形状保留（导出复用） |
| `bench/lib/judge-fallback.mjs`（拟新增） | 0 | ~150 | 替代池装载 + schema / 身份校验（fail-closed）+ 级联执行（级内单发语义 · 身份占用跳过 · 逐级记账）+ 合成裁决（unanimous / arbitrated / single / none）——`judge.mjs` 300 行上限的拆分落点 |
| `bench/judge.json`（数据档） | 25 | +~52 | 增 `fallbacks`（替代池 6 项——§9 逐字）+ `frozenAtSuiteVersion` 6 → 7（§2.10.3 冻结绑定） |
| `bench/lib/pipeline.mjs` | 277 | +6 ±3 | 替代池传入（`makeJudgeEnv`）+ `--rejudge` 分支判别转派 + 控制台替代行 |
| `bench/lib/rejudge.mjs`（拟新增） | 0 | ~120 | 补判分支（§2.14）：读档 + 对象筛选 + 定点重取素材（import client——触网分支）+ 级联补判 + 溯源块 + 新对落盘 |
| `bench/lib/prices.mjs` | 281 | −100 ±10 | 判官 / 复核账目段迁出（`applyJudgeCosts` → `prices-judge.mjs`——281 + 级联计价 ⇒ 越线）；装载 / 匹配 / 成本式 / 被测与人工账目零改 |
| `bench/lib/prices-judge.mjs`（拟新增） | 0 | ~155 | `applyJudgeCosts` 迁入 + 替代级计价（`calls[].level` → 实际身份键）+ 池快照记账 + `substitutions` / `singleJudged` 计数 + 缺价 / 缺 usage 警告逐实际身份 |
| `bench/lib/report.mjs` | 207 | +12 ±4 | 概览替代池行；方法段级联句 + 补判产物句；告警行分列计数；局限条收正 |
| `bench/lib/report-tables.mjs` | 280 | +6 ±3 | 逐维明细判官理由行：替代位标注 `（替代：<provider:model>）` + 单判定判注 |
| `bench/lib/report-review.mjs` | 164 | ±0 | 分歧面谓词零改（单判定判不入分歧面——既有谓词已成立） |
| `bench/run.mjs` | 283 | +12 ±4（**上界 299——余量 1 行；不得加行 / 超线即按既有降载先例拆点或迁腿**） | CLI：`--rejudge` / `--from` 解析与转派 + 用法文本；`FIXTURE.judge` 级联脚本重分配（`longctx.3` = 位失败 ⇒ 替代成功；`vision.2` = 全级穷尽 ⇒ error 保留覆盖） |
| `bench/lib/params.mjs` | 120 | +6 ±3 | 枚举面射程扩替代池（§2.13） |
| `bench/cases/index.mjs` | 68 | ±1（注释） | `SUITE_VERSION` 6 → 7（单源）；注释枚举随 §1.3-2 同步 |
| `bench/test/judge-fallback.test.mjs`（拟新增） | 0 | ~190 | `judge.14–18` / `rejudge.1` 承载（级联 / 终局 / 补判三面；桩传输——不触网） |
| `bench/test/judge.test.mjs` | 297 | ±0 | 版本字面 6 → 7 传播（四处）+ `judge.2` / `judge.3` 单发断言 + `judge.10` / `judge.11` 断言就地收正（级联语义——不加行） |
| `bench/test/suite.test.mjs` | 203 | +8 ±3 | `SUITE_VERSION` 断言 6 → 7 + `judge.json` schema 腿扩 `fallbacks`（区间 / 身份 / 池内两两字面不同——`judge.19`） |
| `bench/test/fixtures.mjs` | 185 | +14 ±4 | 合成结果夹具补级联形态（`substitutes` / `calls[].level` / `resolution: "single"` / `judge.fallbacks` 快照）+ `suiteVersion` 6 → 7 |
| `bench/test/report-render.test.mjs` | 299 | ±0（**余量 1 行——只换字面 / 断言串，不得加行**；须增行 ⇒ 按既有降载先例迁腿） | 告警行断言串收正（替代 / 单判分列）+ dry-run 计数随夹具重分配同步 |
| `bench/test/report-present.test.mjs` | 286 | +8 ±3 | `render.9`（替代池行 / 替代标注 / 分列计数渲染）+ 版本字面 7 |
| `bench/README.md` | 202 | +14 ±5 | 级联替代口径 + `--rejudge` 命令 + 池维护句 + 版本句 7 |
| `docs/core/design/MODEL-BENCH.md` | 1379（本批前读数） | 就地更新 | 本档（§1.3-2 / §2.1 / §2.2 / §2.3 / §2.7 / §2.10.1 / §2.10.3–2.10.6 / §2.13 / §2.14（新增）/ §3 / §4 / §5.13 / §6 / §7 / §8 / §9 / 变更记录） |
| `bench/results/` | 1 对（v5）·v6 跑批在飞（**零触**——本批设计面不碰） | ±0 | 不重跑；v6 对落档后其判官面 error 例由补判通道收正（点名执行——§2.14） |

## 4. 关键决策记录（含被否候选）

| # | 决策 | 理由 | 被否候选 |
|---|---|---|---|
| KD-1 | 调模型**复用核 provider 路径**（`thincoder-core/provider/index.mjs` 的 `chat` + `config.mjs` 的 `loadConfig` / `parseModelRef`） | ① 请求构造保真：thinking 映射 / `enable_thinking` / effort 门控 / 多格式 transport（anthropic/google）即用户真实所见——基准比较的对象是「产品里可用的模型表现」；② usage 归一（含 cached 命中）与 SSE 解析零重写；③ 零新风控面（重试/限流/续写随核演进）；④ 维护面最小（不维护第二套协议栈） | ① 自写薄 OpenAI client（被否：复制 SSE/鉴权/重试约 200 行且与核漂移；测量对象退化为「裸端点」而非产品路径）；② 半复用（自写 fetch + 复用 `readSSE`）（被否：请求体组装仍须重写 thinking/effort 映射，得失不成比例） |
| KD-2 | `SUITE_VERSION` = **单源整数常量**（`bench/cases/index.mjs`（已实现）），改题 / 改判据（**判分合成 / 复核处置规则**含在内）/ 改计时口径 / **改结果数值构成规则（分账 · 归一化 · 聚合口径——§1.3-4）**即 +1；价格变动**不** bump（另记 `prices.asOf`） | 手写可读、跨档可比判据单值；题集与价格是两条独立时轴 | 日期式 `2026-09-23.1`（被否：一次改题多次日期跳变的比较语义模糊）；内容哈希（被否：不可人工预判、评审不可读） |
| KD-3 | 隐藏用例机制 = **题面只给公开 1 例 + 隐藏断言住在判分器**（3–5 例/题，冻结于 §5） | 防硬编码（读题面即知判据的模型拿不到分）；隐藏例随判分器版本冻结 ⇒ 可复现 | 随机生成隐藏例（被否：不可复现，破跨时点可比）；隐藏用例另存外部文件（被否：无必要，判分器即载体） |
| KD-4 | `models.json` 维度面 = **两个显式字段**（`dims` 白名单 / `skipDims` 黑名单） | §1.9 原文并列「跳过/限定」两种语义；拆两字段后每条义单一可机检（`—` 与 `fail` 不混） | 单字段双语义（被否：一条 `dims` 无法同时表达排除与限定，必然歧义）；维度面由 CLI 每次指定（被否：清单文件应自包含） |
| KD-5 | 清单与价格**对齐键 = `provider:model`**；`label` 仅展示名 | 价格随渠道（provider 条目）变——`provider:model` 与调用面一一对应；`label` 可改而无副作用 | 纯 `label` 键（被否：改名即断价）；纯 `model` 键（被否：同模型多渠道路径价格不同） |
| KD-6 | 成本缺失（无价 / 无 usage）记 `null` + 脚注，**不估算**；`prices.json` schema fail-closed | 与「delta 近似禁用」同源：可比性建立在精确账目上；估算会把口径漂移藏进数字 | 用 delta 数分片近似 token（被否：已证各家分片粒度不同、失真）；按字符数估 token（被否：同因） |
| KD-7 | TTFT = 首个**非空** delta（content 或 reasoning 先到者）− 调用发起 | 核路径上唯一可观测的「模型开始输出」时刻（`thincoder-core/provider/sse.mjs:142-149` 只在非空 delta 回调）；空 role 块不携模型产出，不具比较意义 | 自写 client 取「首个 HTTP 字节」（被否：见 KD-1；且首字节常为路由/空块，跨渠道噪声更大）；首 content token 才计（被否：思考型模型会把思考时间挤进 tok/s 分母，口径不可比） |
| KD-8 | 报告**成对留档 + 写档前脱敏断言**（构造性白名单 + fail-closed 断言双保险） | AC-9「可发布」= 结构完整 + 无路径/凭据泄漏；断言把「忘了脱敏」变成硬失败 | 只靠构造（被否：单点失误即泄漏上档）；事后人工核（被否：不可机检） |
| KD-9 | 人工 lane 独立：不判分、不入矩阵/成本归一化、不阻塞退出码 | AC-6；中文歧义本身无客观判据，只做证据保留 | 用 LLM-as-judge 打分（被否：§1.5 边界明令不做） |
| KD-10 | 覆盖保护 = 同名拒写（无 `--force`） | 留档不可被静默覆盖；删旧档 = 人工显式动作 | `--force` 旗标（被否：V1 无必要，破坏留档直觉）；自动改名（被否：文件名会漂移，跨档对比难） |
| KD-11 | `bench/test/` 存在但**不进 CI**（AC-8） | 判分器/成本式/脱敏是有判断语义的代码，需开发期回归；CI 面按用户边界零改 | 全不测（被否：判分器是核心资产，回归无保护）；进 CI（被否：AC-8 明令不进） |
| KD-12 | 判官面落点 = **独立档 `bench/lib/judge.mjs`（已实现）**（判官 + 复核共用会话） | ① `grade.mjs` 的档内契约（「纯函数 · 无网络」）是判分器族的根基（§2.6）；判官/复核两套提示 + 解析 + 传输 + 记账 ≈ +120 行 ⇒ 该档必然超 300 行触发拆分；② 判官面自成一档 = 网络 / 配置 / 记账面与确定性原语分档（可单测、可 mock） | 塞进 `bench/lib/grade.mjs`（被否：破档不变量 + 顶破 300 行线）；判官逻辑内联进 `pipeline.mjs`（被否：编排档不该兼判据实现） |
| KD-13 | 判官身份配置 = **独立数据档 `bench/judge.json`（已实现）** | 判官不是被测条目（`models.json` 的语义 = 参测清单，`selectEntries` / `--models` 会把它当选测项）；单职责数据档与 `models.json` / `prices.json` 同构（配置 = 数据，改配置不改码） | 落 `models.json`（被否：语义混淆——判官不是被测条目）；通用配置档（被否：仅一类配置，过度抽象）；写死源码常量（被否：换判官要改码，AC-3 要求可配置） |
| KD-14 | **判官必备**（缺 ⇒ 拒跑），不做「无判官跑法」 | 同一 suiteVersion 只能有一种判分口径——按选中维度懒加载或缺失即跳过语义面 = 同一版本两种判据面（静默降级） | 判官可选 / 缺省跳过语义面（被否：口径分裂 + 静默降级）；缺判官回退词表（被否：批次边界明禁——回退即假阴回归） |
| KD-15 | 判官 = **判官对（A / B）双判**；分歧 ⇒ **第三判（仲裁员 C）· 多数决**；合成无多数 ⇒ run `error`（fail-closed） | 用户 2026-09-24 01:26 裁定（推翻 V1 单判）：单模型视角偏差是单判的固有风险，双判把它从「不可见」变成「可计数」（分歧率）；分歧样本付第三判 ⇒ 冗余成本只对分歧付（×2 → 分歧 ×3）；「同模型双判无冗余」（D1）⇒ A≠B 机检 + 仲裁员第三方（≠ A / B）机检；确定性路径 = 多数决（3 票二元无平局），任何无多数路径 ⇒ `error` 不猜（D3）；POC 的 5 条样本全为「判准」案（无判官错误样本）⇒ 判官能力有证、判官误判率无证——双判的收益（分歧显影）本身需跑起来才有数据（首轮 v3 即产出分歧率） | ① 单判（原 KD-15 述；POC 5/5 判准为证据。被否：POC 无判官错误样本 ⇒ 单点误判不可见）；② 双判一致即定 · 分歧取 A（主位）票（被否：单判等价——B 成本 +100% 而判定力零增益）；③ 双判一致即定 · 分歧 ⇒ `error`（被否：分歧是判官质量信号而非故障，降 error 让语义面系统性空洞化）；④ 双判 + 人工裁决分歧样本（被否：破「一条命令跑通」与可复现）；⑤ 双判同模型（被否：同模型双判无冗余——D1 原文） |
| KD-16 | 语义面词表 / 正则**全废**（不留快通道） | ① 假阳面词表自除不了（「左上角不是红色」命中「红色」即误 pass）；② 快通道 = 同一用例两种判法（口径两级、审计复杂化）；③ 成本证据表明省这笔钱无意义（¥0.0006/判） | 快通道「命中即定 / 未命中问判官」（被否：见左三理由） |
| KD-17 | 复核翻案（`overturn`）⇒ **改判 `pass`**（计入通过数）+ `⟲` 标注（经复核纠正 · 原机械 fail；混合面形态另注「判官面未裁决」——§2.11）；承接机制照旧（判据修复必修——改判与修判据并行）（用户 2026-09-24 11:23 裁定） | 复核 = 机械判据自洽性的第二只眼，其产出须有判定效力（翻案零效力 ⇒ 复核成本只换一条旁注）；透明度与缺陷修复压力由 `⟲` + 原机械断言留档 + 承接清单承担（改判不掩埋缺陷） | 不自动改判（复核仅作旁证、不计 pass）（被否：复核产出零判定效力；缺陷修复压力与改判本可并行，不必以扣着不计 pass 换取） |
| KD-18 | 复核与判官 **A 位**共用同一模型 / 会话 / 价格（双判下沿 A 位——§2.11） | 「第二只眼」的对照面 = 机械 vs LLM（非模型 vs 模型）；共用 ⇒ 配置 / 独立性 / 价格 / 元数据面单源；分设两模型 = 加倍配置与失败面，而复核问题面窄（机械判据自洽性） | 独立复核模型（被否：收益不成比例）；复核走第二家（被否：同因） |
| KD-19 | 判官换代绑定 `SUITE_VERSION`：`judge.json.frozenAtSuiteVersion` 机检闸 | 判官 = 判据的一部分 ⇒ 换代 = 判分口径换代；只记 `judge.model` 而不 bump ⇒ 跨版本报告「看似可比」实则标准已换 | 只记模型不 bump（被否：可比性假象）；判官 key 写进 `bench/cases/index.mjs` 常量（被否：AC-3 要求可配置） |
| KD-20 | `runs[].judge` / `runs[].review` **缺省不写**（不写 null 占位） | 「未发生」与 null 不可分 ⇒ 写 null 会让旧档 / 机械 fail / 判官 fail 三类记录混淆 | 写 null 占位（被否：见左）；新枚举值 `judge_error` / `overturn`（被否：为已由子记录承载的区分改动全链聚合/枚举/渲染） |
| KD-21 | 判官 / 复核成本**不并入**被测成本与相对成本归一化 | AC-4 明禁污染；判官是共用基础设施（复现一次报告的必需开销），与被测模型的性价比不是同一物理量 | 并入总成本（被否：AC-4 明禁；相对成本将随判官换代跳变） |
| KD-22 | 判官输入 = 题面 / rubric / **该回合观测**（模型文本 + 该回合工具调用事实 `name` / `arguments`——与 §2.11 复核同形），不喂对话历史、图像 | POC 教训①（喂错素材比判错更坏）⇒ 素材面最小化 + 单取值点；图像不入判官 = 判官可选池不受多模态能力约束（rubric 载明事实正本）；**工具事实随回合观测并入**（实施轮发现收正：`tools.2` 的 `body` 判据只住 arguments——纯文本系统性假阴且不叠加复核） | 喂完整对话历史（被否：素材噪声 + 成本 + 回合错配面）；喂图像给多模态判官（被否：收紧判官可选池，收益 = 0——rubric 已载明事实） |
| KD-23 | 判据分层**重划**：分界 = 判定是否需要「机器解释文本」（需要解释 ⇒ 判官面；字面 / 计数 / 结构 / 执行 ⇒ 机械面）——本批落地 = `instructions.1` / `.2` 混合面重划 + 三机械规则件删除 | 用户 04:34 裁定；旧分界「纯函数可算 ⇒ 机械」之病 = **可算 ≠ 可定义无歧义**（四次同病实证：`vision.3` 词表 / `multiturn.1–3` / `instructions.1` 段落计数）；解释面住机械面必然随边缘样本反复误判（v3 翻案实证） | ① 保留旧分界 + 补「正文面」预解析（被否：把文本结构解释留在机械面——同病复发面；且剔除附注 = 解释）；② 段 / 句照机械判、只在机械侧剔附注（被否：同上）；③ 只修 `instructions.1`（被否：同族未清——`.2` 句结构同病） |
| KD-24 | 承接机制 = 产出机器化（报告承接清单 + 控制台提示）· 承接落台账 · 销账人工确认 | v3 实证：翻案只落报告 ⇒ 空转（judge-hybrid / relax 两批未承接）；台账 = 项目唯一待办面；「自动」边界与写权（台账写权仅主 agent）对齐 | ① 独立清单档（被否：第二真相源）；② 只留报告清单（被否：报告 = 留档不是待办面——空转正是它的失败模式）；③ 自动写台账 / 自动核销（被否：越写权；销账须人工确认）；④ 跑前门（未处置翻案 ⇒ 拒跑）（被否：台账状态读不到 ⇒ 误拒） |
| KD-25 | v3 对处置 = **重跑落档后清理**（`git rm` md + json） | 承 01:31「历史报告没意义」口径；本批 bump 后 v3 跨版本不严格可比（留档误导）；缺陷证据已在记录面（批档 §1.2 + 本档 §5.13 / §2.12） | 保留（被否：跨版本不可比 + 与 01:31 口径相抵）；仅 `--recompute` 刷新渲染（被否：判据代际差仍在，刷新只治表象） |
| KD-26 | 复核**改判后仍保持单判**（沿 A 位；不升双判、不改触发 / 输入 / 判定） | 对照轴 = 机械 vs LLM（KD-18）——问题面 = 「机械判据是否自洽」，非模型视角分歧；复核素材有据且窄（机械条文 + 失败断言 + 逐回合观测）；双判成本 +100% 且引入「无多数」面而无降级可走（失败处置 = fail 维持）；误翻案面由承接机制显影（判据修复必修——§2.12） | 复核同双判（被否：成本 +100%、无多数面无处降级——§2.11 判位数裁定）；复核由仲裁员 C 承担（被否：同 §2.11） |

| KD-27 | **呈现面变化不 bump `SUITE_VERSION`**：段位增删 / 表列集 / 排序 / 图例与脚注文案 = 渲染面；版本轴 = 题集（口径 1）/ 判分（口径 2）/ 计时（口径 3）/ **结果数值构成规则**（分账 · 归一化 · 聚合口径） | ① `SUITE_VERSION` 与 `judge.json.frozenAtSuiteVersion` 机检绑定（`bench/lib/judge.mjs:82-83`：不等即拒跑）——呈现面 bump 会强制改判官配置档（判官身份零变化），把「判分口径换代」的错误信号写进版本号；② 版本号语义 = 测量与判定口径（KD-2）——删列 / 增表**数值面零改**，在档报告与新版报告数字同源可比 ⇒ bump 反使在档对无端失真 · 版本信号稀释；③ 渲染面可从结果 JSON 以现行形态重出（§2.7 `--recompute`）⇒ 形态差异无需版本号承载 | ①「凡 §2.3 骨架文本变化即 bump」（被否：把渲染面改写与判分口径换代混为一轴——机械后果 = 每次报告样式调整都要动 `judge.json` 并宣布跨版本不可比）；②「呈现面 bump 但不同步 `judge.json`」（被否：破冻结绑定机检——`judge.mjs:82` 拒跑） |
| KD-28 | 用时表（批件 2026-09-24 12:43）：表名 = **用时表** · 落位 = 速度表后 · 轴门控 = `speed` · 参与面 = 该模型面内**实际执行**的 run（`skipped` 不入 · **error run 已记录耗时照计**）· 列 = {模型 · 累计耗时 · 相对倍率 · 排名 · 采样 run 数} · 排名 = 升序 + 同值并列顺延 · 倍率 = ÷ 最低者（1.0×） | ① 累计 = Σ `runs[].metrics.totalMs`（`bench/lib/metrics.mjs:61-74` 单源 = 该 run 的 per-call 耗时和）——判官 / 复核调用住 `runs[].judge…` / `runs[].review…`，**不参与该式**；② 「执行全部用例的累计耗时」字面口径 = 实际发生的执行耗时 ⇒ error run 已记录调用照计（超时也占墙钟），`skipped` 未执行不入——**失败路径的记录面 = KD-30**（本批补全：失败分支原硬编码 `totalMs: null` ⇒ 该类 run 未入累计）；③ 名 / 位与「速度表 / 成本表」并体例（三字表名 · 时间面紧随速度表）；④ 轴 = `speed`（时间面——CLI 词表零改，不增第三轴词） | ① 只计 pass/fail run（被否：与批件「Σ 全部 run」相抵 + 把超时开销藏起来）；② 每任务耗时（÷ 任务数）替代累计（被否：批件点名「总耗时」+ 排名；「单次」面已由速度表覆盖）；③ 加第三轴词 `time`（被否：CLI 契约 / 词表 / 帮助文本 / 轴断言连锁改，收益 = 0——时间面归 `speed` 轴）；④ 排名用密集名次（1 · 1 · 2）（被否：跳过式（1 · 1 · 3）更贴合「第 N 名」直觉） |
| KD-29 | **评估开销金额报告零展示**（用户 2026-09-24 12:45 裁定）：成本表 / 概览账目句 / 判官行逐位成本三处均不列金额；分账**原则**句保留（不列数字）；评估**统计**（调用次数 / 分歧率 / 仲裁 / 复核次数 / 翻案 / 复核失败）住非成本面（判官行 / 告警行 / 《复核翻案》）；账目面 = 结果 JSON（字段零改） | ① 成本表 / 概览成本句的行身份 = 被测模型的性价比，评估开销（判官 + 复核）非模型自身开销（KD-21 同源）；② 判官行逐位金额亦属评估开销金额 ⇒ 一并收（「报告不展示」的整面读法）——账目零丢失（JSON 照记 + 账目指针句在位）；③ 统计 ≠ 开销（次数类不进成本面即可，无需随之消失——审计面已在册） | ① 判官行保留逐位金额（被否：与「报告不展示评估开销」整面读法相抵）；② 概览保留评估统计行（被否：与告警行 / 《复核翻案》重复列——D2）；③ 概览账目句整句删除（被否：分账原则句须保留——用户明示）；④ 删 JSON 字段（被否：用户明示 JSON 字段零改——数据面照记） |
| KD-30 | **失败调用耗时照记并入累计**（用户 2026-09-24 13:26 指令「报错你就不算？时间呢？算进去了吗？」）：`calls[].totalMs` = 发起 → 失败墙钟（落点 = `client.mjs` `runCase` 调用侧）· `ttftMs` / `tokens` 照实缺 `null` · 用时表口径零改（`null` = 未记录 ⇒ 不计）· **版本口径：不 bump**（记录面补全 ≠ 口径变化） | ① 观测点 = **调用侧**（`runCase` 于传输面调用前后取墙钟）：传输面抛错时「发起 → 失败」的唯一可靠观测位；错误对象挂载耗时 = 隐式契约（每个传输面各自实现、漏实现即静默 `null`——实测缺口正是如此：`bench/lib/client.mjs:148` 失败分支硬编码 `totalMs: null`）；② 语义 = 「该次调用实际占用墙钟」——超时也占墙钟（v4 实核：qwen `instructions.3` 超时未记录 ⇒ 累计 170115 ms 缺 ≈120 s，补录后排名 2 → 3）；③ **版本轴管规则、不管采集完整度**：口径（测什么 / 怎么算 / 什么进数字）零改 ⇒ 不 bump——bump 的机械代价 = `SUITE_VERSION` 单轴整数连带改 `judge.json.frozenAtSuiteVersion` 并经 `bench/lib/judge.mjs:82-83` 机检，等于向「判分口径换代」发假信号；④ 可比性由在档自述承载（v4 用时表脚注明示 1 个 run 未参与累计） | ① 传输面自报耗时（`liveTransport` 捕获异常、在错误对象上挂 `totalMs` 后重抛）（被否：隐式契约 + 多传输面重复实现 + 调用侧已有唯一收口点）；② 失败 run 按 `0` 计（被否：把「未记录」与「零耗时」混同——破「不按 0 计」纪律）；③ 失败耗时另立字段（如 `metrics.errorMs`）（被否：增字段 = 渲染 / 重算 / 定域链连锁改，收益 = 0——`totalMs` 语义本就是「实际占用墙钟」）；④ bump `SUITE_VERSION`（被否：见理由 ③——记录面补全非口径换代）；⑤ v4 重跑补录该次耗时（被否：用户未点名 + 重跑 = 新样本（服务端时点已变）不构成「补录」） |

| KD-31 | **模型级温度例外**（2026-09-24 名单扩容批）：`models.json` 增可选字段 `temperature`（0–2 · 缺省 0 = 冻结）——**仅当该模型 API 拒收 `temperature: 0`** 时逐档显式开（准入依据 = 探针实测在册）；透传 = `pipeline.mjs` 读 `entry.temperature ?? 0`（两分支）；入档 = `models[].temperature`（实际值）；呈现 = 概览派生披露句（`(m.temperature ?? run.temperature) ≠ run.temperature` ⇒ 逐档列出）；**版本口径：不 bump**（温度 = 运行参数面，同 `--max-tokens`——§1.3 四轴零改） | ① 判官面实测（`2026-09-24-judge-hybrid` §5：`kimi:kimi-k3` 400「invalid temperature: only 1 is allowed for this model」）+ 本批被测面探针（kimi 四档同拒 0 / 1 通过）——「照实 error 不列」= 用户点名的 kimi 四档全废（非受控选择）；② per-model 例外 = **数据面**（名单档字段）而非命令面（CLI 参数）⇒ 例外随名单持久、可复现（命令串不含例外决策）；③ 披露链 = 入档 + 报告披露句（跨档比较的测量条件差异不得静默）；④ 不 bump 理由同 KD-30 ③：版本轴管规则不管参数——例外档仅涉新增模型，既有档与在档报告的可比性零损 | ① 全局 `--temperature` CLI 参数（被否：破「温度冻结 0」统一口径 + 例外面搬到命令面 ⇒ 报告命令串不复现例外决策）；② 该四档照实 error 不列（被否：用户点名要 kimi——§1.1 名单由用户 14:35–14:44 列表定音）；③ 判官面同开温度例外（被否：用户 14:37 明令判官三槽不动）；④ 核 `model-specs.mjs` 给 kimi 行加 `tempRange: [1, 1]` 靠核裁剪（被否：三端产品树零改动 = 本批边界；该机制面属产品树，另批议题）；⑤ bump `SUITE_VERSION`（被否：题集 / 判分 / 计时 / 数值构成四轴零改——bump 只发「判分口径换代」假信号并连带改 `judge.json`） |
| KD-32 | **思考强度中档口径**（用户 2026-09-24 18:43「确认一下测试都是用模型的中档思考强度测」）：受测档统一取**该档自身标尺的中档**——① 枚举行含 `medium` ⇒ `medium`；② 枚举行无 `medium` ⇒ 按强度序取**中位档**（偶数项取较弱者；现行实测落 `high`）；③ 无枚举行（透传档）⇒ `medium` 直发（受理面实弹覆盖）——**枚举行分类以实施后 spec 表为准**（`MODEL-SPECS.md` §13 建行后 `doubao-seed-2-1` 三档归 ① 类；§13.3 在册）。载体 = `models.json` 档位级 `reasoningEffort`（与 KD-31 `temperature` 同构；用户 config 零改）；透传 = `pipeline.mjs`（`entry.reasoningEffort ?? user.reasoningEffort`）；入档 = `models[].reasoningEffort` / `reasoningEffortFrom`；**版本口径：不 bump**（运行参数面——§1.3-4 四轴零改，KD-31 同源）；口径代际 = v5 原值口径（不追改）· 中档口径自下一代起效 | ① 用户明令「统一中档」——原值口径实测非中档（max×9 / high×11 / 无值×9）；② **逐档显式值**（非运行时算法）——映射规则在**设计 / 数据面**一次裁定，运行面只读字面（可复现 · 可审）；③ 无 `medium` 档的取法 = **该档自身标尺的中位**（qwen3.7-max {xhigh, high} ⇒ `high`；deepseek / glm / kimi 三值族 ⇒ `high`）——不硬编码 `medium`（服务端只认自身枚举）；④ 无枚举行仍发 `medium`（受理面已实弹 · 批次档 §1.5 · 29/29）——「被忽略档」（mimo×3 / minimax×2）照发：口径统一优先，生效性由披露面如实标注（`models[].note` ⇒ 概览模型表「备注」列——§2.3-9）；⑤ 覆写优先于 config 原值 ⇒ #264 类「配置伪影」结构性消失（档位面自足） | ① 改用户 config 的 effort 值（被否：本批红线「不动用户 config」+ 全局影响日常会话）；② 新建独立 provider 条目（被否：为测试面造配置副本——语义混淆，未来漂移）；③ 核层按模型收敛 effort（被否：产品行为变更，出本批边界）；④ 运行时按枚举算中位（被否：把裁定搬进代码——名单档字面可直接对读，算法面另立测试负担）；⑤ 无枚举行不发 effort（被否：口径分裂——「统一中档」变成「有枚举行的档统一」）；⑥ bump `SUITE_VERSION`（被否：四轴零改——运行参数面；开 bump 口子则 `judge.json` 连带假信号） |
| KD-33 | **判官 B 位换代**（用户 2026-09-24 18:19）：B `tokenhub:hy3` → **`glm:glm-5.3-flashx`**（原选 `glm:glm-5.3` 经 U2 探针未过 ⇒ 退候选路径走毕；用户 2026-09-25 00:3x 点名终选——见理由③⑤）；换代 ⇒ `SUITE_VERSION` 5 → 6 + `frozenAtSuiteVersion` 同步（§2.10.3 冻结绑定）；**存量重判不可行**——判官素材 = 该回合**响应原文** + 工具调用事实（`name(arguments)`），而结果 JSON 只落 `runs[].summary.textHead`（≤300 字符）+ `toolNames`（仅名字）+ 长度计数（§2.2 / §7-5）⇒ 素材不可重建 ⇒ v5 判官面按当时槽位留档、不追改、不重判 | ① 用户点名「更常见的主流模型」+ B 位须 ≠ A / C（身份机检）；② 候选判据 = 可得性（provider ∈ config + 渠道实测在册）/ 价格在录 / **服从性证据**（严格 JSON 单发读数——`judge-slot-probe` 族：判官 + 复核两模板各 1 发 + 重材料腿）；③ **原选 `glm:glm-5.3` 未过实证**：U2 探针判官模板 ✓ 2.9s · 复核模板**系统性超时**（30s ×3 连测 + 90s 预算 ×2 尝试共 158s 均不过）⇒ 按本决策「未过 ⇒ 退候选」退候选实弹——`qwen:qwen3.7-max` 双过（judge 2.9s / review 18.7s / 重材料 8.7s）· `ark:doubao-seed-2-1-pro-260915` 双过（8.1s / 5.5s / 11.4s）⇒ 备选在案；④ 换代动因 = 实录 B 位 `multiturn.1` 系统性超时（≥6 例 · 跨 6 档）⇒ 可靠性不足；⑤ **flashx 选定依据** = 用户 2026-09-25 00:3x 点名 + 探针读数（judge ✓ 1.6s · review ✓ 8.8s · 重材料 ⚠ 38.6s · attempts=2——探针读数如实登记；当时口径的重发，现行 = 单发 + 预算 8192，§2.10.1）+ v5 实测在册（23/25 · TTFT 1038ms / tok/s 136.2）；身份 = ≠ A / C ✓ ∧ ∈ 被测集（同位自判——03:16 裁定允许，重合标记照常）；⑥ 参数相容 = `glm` 条目 effort `max` ∈ flashx 枚举 {low, high, max} ✓ ∧ temperature 0 ∈ `tempRange` [0, 1] ✓（判官调用沿 provider 条目 effort 原值）；⑦ **B 位成本可读性认账**：`glm` 族带 `noUsageStream`（`thincoder-core/model-specs.mjs:59-74`——flashx = `:68`）⇒ 该位判官成本账目可能整段 `null`（缺 usage 记 null，不估算——§2.10.5）；判定面不受影响（判定不吃 usage） | ① `qwen:qwen3.7-max`（退候选实弹**双过** ⇒ **备选在案**；未选定——用户点名 flashx；同位自判同 `glm`）；② `ark:doubao-seed-2-1-pro-260915`（退候选实弹**双过** ⇒ **备选在案**）；③ `minimax:MiniMax-M3` / `kimi:kimi-k3`（被否：实测不可用——JSON 整段重复 / 拒温度 0）；④ 存量重判（被否：响应原文不落档——不可重建；且「重判旧样本」不构成新测量）；⑤ 不换代 / 只调 `timeoutSec`（被否：用户点名换模型；超时值调大不治「更主流」诉求且预算面改动更大） |
| KD-34 | **跑批前参数预检**（用户 2026-09-24 18:20「测试模型的用的参数都核对一下，不要再用错参数了」）：① **枚举面**（零网络 · fail-closed）入 `run.mjs` 启动门——逐档 + 判官三槽做「config × spec」兼容判定（provider 在 config / spec 命中 / effort ∈ 枚举（若声明）/ 温度档位值与 `tempRange` 裁剪对账 / 路由与 format 豁免面 / thinking 面组合），有阻断项 ⇒ **拒跑 exit 1 + 点名**；② **实弹面** = `bench/preflight.mjs`（拟新增）`--live`（1 发/档 · 需密钥 · 单轮无工具）——透传档与全档参数受理探针；③ **零落库**（不写 `bench/results/`、不写台账、不改配置）；④ 单源 = `bench/lib/params.mjs`（拟新增）（参数构造 + 枚举面判定，`pipeline.mjs` 与 `preflight.mjs` 共用——防两套漂移） | ① #264 类参数错的**结构性防复发**（核守卫只在「spec 有枚举」面把关——透传档无守卫，只能靠预检）；② 枚举面零网络 ⇒ 可每次跑批自动跑（零成本）；③ 实弹面须密钥 / 花钱 ⇒ **不入 run 自动路径**（点名执行），与「跑批 = 用户点名」口径一致；④ 判官三槽同受检——换槽自身参数错（如 B 换档后 provider effort 越枚举）在跑前显影；⑤ 单源构造档 = 防「预检说没问题、跑批构造另一套」 | ① 只依赖核守卫（被否：透传档零守卫——#264 同类在无枚举行上仍可复发）；② 预检写一份独立构造实现（被否：双实现必然漂移）；③ 实弹面自动跑在 run 启动（被否：每次跑批都花钱 + 需网络 — 与「点名」纪律相抵）；④ 预检落档成报告（被否：零落库 = 用户边界；读数入控制台 + 批次档 §5） |
| KD-35 | **逐档参数披露**（用户 2026-09-24 18:5x「测试报告里应该有测试用的模型的参数」）：结果 JSON 增 `models[].reasoningEffort` / `reasoningEffortFrom`（`models.json` 格式档 = 档位覆写 / `config` = 用户配置原值；两键同写同缺）；md 概览增**逐档参数表**（模型 · 路由 · temperature · 思考强度（值 + 来源）· maxTokens）；温度 / maxTokens / 路由复用既有单源（`models[].temperature` / `run.maxTokens` / `models[].host` 等——**不立副本**）；**呈现面变化不 bump**（KD-27）；旧档缺键 ⇒ `—`（缺省语义——未采集，非历史兼容分支） | ① 「跨档 / 跨代可比性的前提」= 参数面必须可读（否则「同 suiteVersion」被读成「同条件」）；② 参数错（#264 类）在报告里即可见——报告自身成为预检的第二道显影面；③ 不立副本 = D2（温度例外披露句 / 参数表同源派生自 `models[].temperature`）；④ 与 KD-29（评估开销金额零展示）正交——参数表零金额 | ① 只在 md 写参数（被否：JSON = 数据面单源，md 是渲染）；② 参数表写进「方法」段（被否：方法 = 口径说明，参数 = 逐档事实——概览参测表同区更近）；③ 每档记「完整请求体」（被否：体积 + 泄密面（key 等）+ 与「不存原文」纪律相抵）；④ 把 effort 塞进 `models[].note`（被否：note = 人读自由文本，机读面须结构化字段） |
| KD-36 | **spec 行补齐的证据等级与「未探不声明」**（用户 2026-09-24 18:44「9 档参数补齐的应该去查表补齐」）：`thincoder-core/model-specs.mjs` 建行 = **机器读源补齐**（逐名显式行，取代泛行继承 / 兜底）；字段取值三态——① 有读数（实测 / 校验级 / 受理级）照写；② 官方口径 / 同族沿用（**点名来源行**）照写 + 行注标级；③ 零口径 ⇒ **不声明该能力位**（尺寸位沿用现盘生效值 + 行注标「未取证」）；**视觉位语义单一**（`multimodal` 仅 `true` 或**不声明**——无视觉 = 不声明，测试锚承载；T-7 零改）；新建行 `tempRange` **取值以 `MODEL-SPECS.md` §13.3 逐行为准**（族沿用有据者照写）；**KD-31 例外准入档不得带 `tempRange`**（保 KD-31 例外档不变量：入档值 = 实发值） | ① 用户点名「查表补齐」= 证据先行；② 机器读源缺口的真实症状 = `warnUnknownModel` 告警 + 兜底 128K/32K 静默低估 + 视觉面靠 note 散文；③ 「未探不声明」= 与 §2.4「零静默退化」同源（宁缺勿猜——不冒充）；④ 视觉位语义单一（T-7 已冻结）⇒ 无视觉档的正确机读形态就是**不声明**（补齐 = 行注 + 测试锚，非改值）；⑤ `tempRange` 不入 KD-31 例外准入档 = KD-31 例外的准入不变量（有 `tempRange` 则核裁剪 ⇒ 入档值 ≠ 实发值） | ① 未探字段按同族类推填满（被否：`MODEL-SPECS.md` D-2 已裁「不据同族类推补行」——本批只沿**已声明机制位**（partialMode / cacheMode / thinkApi / tempRange / noUsageStream）与**定点尺寸口径**）；② 声明 `multimodal: false`（被否：破 T-7「仅 true / undefined」语义单一）；③ 未探档不建行、留兜底（被否：告警 + 兜底低估值长期在盘——本批的目标正是消掉静默面；行注「未取证」已代价最小化）；④ 新建行补 `tempRange: [1, 1]` 靠核裁剪（被否：KD-31 被否候选④同源——产品行为静默改写） |
| KD-37 | **承接修复面（判据-断言对齐 · #273 / #274）**（复核翻案承接 · 2026-09-24）：① **检索步合法**——`multiturn.1` 回合 1 由「零工具调用」改为检索步白名单 `{get_time}`（其余工具调用 ⇒ fail）；`multiturn.3` 检索步不计违规（锚 = 检索步后**跟进** `send_email`；判定 = 该 run 全记录序列**存在** `send_email`）；② **存在语义**——`send_email` / `to` 匹配以「任一调用命中」判定（多次调用 ≠ 缺失或错误）；③ **容错取值**——`arguments` 严格 JSON 失败 ⇒ 取**首个平衡 JSON 对象**（重复拼接形态取首件；新原语 `firstJsonObject` / `argValue`——落点 `bench/lib/grade.mjs`；`tools.*` 结构面严格语义不动）；④ 版本口径 = 判分口径面 ⇒ 与判官 B 换代**共用一次** `SUITE_VERSION` 5 → 6（§6 末段） | ① 复核实录两类误判（v5 报告《复核翻案》承接表）：`multiturn.1` ×4（`get_time` 误判 / `to` 严格解析误火）· `multiturn.3` ×1；② rubric 已载「允许先经 `get_time`」而断言未随 ⇒ 修复 = 断言向正本对齐（§2.11 判据-断言一致性纪律）；③ 严格解析只能判序列化卫生，不能判「值未传递」——值传递面（`.1` 回合 2）测点 = 值本身 | ① 维持严格解析（被否：把「重复拼接」读成「`to` 缺失」——正是本批误判形态）；② 正则提取 `"to"` 字面（被否：不校验 JSON 结构，截断形态亦命中）；③ 副作用黑名单（被否：引入「哪些算副作用」枚举面——白名单更小且 fail-closed）；④ 只改 rubric 不改断言（被否：重造同一不一致）；⑤ 白名单扩至只读工具集（`get_weather` / `read_file`）（被否：无实弹证据——扩须证据 + 同轮设计改）；⑥ 版本面单列一次 bump（被否：两归因同属判分口径面，共用一次 = 落差语义单一） |
| KD-38 | **替代判级联（结论必得）**（用户 2026-09-25 01:31 裁定）：判官位级失败（超时 / HTTP / 解析）⇒ **换模型补判**——替代池 = `judge.json.fallbacks`（有序 · 级联序 = 池序 · **池长即级数上限** · 现行池 6 位 = §9；**三槽角色不变**——池只作位失败时的补判级联）；级内语义逐级一致（**同模型单发**：不可解析 / 传输面失败 ⇒ 该级失败 ⇒ 进下一级——不设同模型第二发；预算从宽 = 默认 8192，§2.10.1）；替代身份运行期占用跳过（**替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此**）+ 池面静态校验（两两字面不同 ∧ ∉ {A, B, C}）；**旧冻结「禁补位 / 禁单判回退 / 传输面失败不重试」整体废除**；恰一位有效 ⇒ **单判定判**（`resolution = "single"`）；零有效判 / 分歧未决 ⇒ `error`（物理边界） | ① 用户点名否决旧冻结（「禁补位只是你愚蠢的决定」）+ 实证（v6 `deepseek-flash multiturn.1`：A pass · B 超时 ⇒ 有效判 1 ⇒ error——单点位失败不该终结 run）；② 替代池 = 配置数据（换池不改码 · 池序可审）；③ 池长即上限：不另设人工截断（截断会造成「池内有候选却仍 error」的口径裂缝）；④ 级内单发语义逐级一致 + **预算一次到位**（默认 8192——§2.10.1；POC 教训② 的根治 = 预算从宽，非同模型重试——用户 2026-09-25 01:46 裁定）；⑤ 同模型单发（解析 / 传输皆不重发）= 系统性故障同模型重试零增益 + 双倍时延（核已含 HTTP 级重试）；⑥ 单判定判承担「恰一位有效」的兜底——透明降级、告警分列 | ① 同模型重试（任何形态——传输面重试 / 放大预算重试；被否：用户 2026-09-25 01:46 裁定「一次不行就换模型」+ 理由⑤）；② 替代级由仲裁员 C 承担（被否：职责混槽、失败归因变浑）；③ 无界级联（被否：成本 / 时延无上界）；④ 替代优先于原位（被否：原位 = 判分口径正本）；⑤ 维持旧冻结（被否：用户点名否决）；⑥ 位级失败即 `error`（被否：全灭信号留给真·全池不可达） |
| KD-39 | **跑后补判通道（§2.14）**（用户 01:28「可以重判吗」+ 01:31 裁定）：`--rejudge --from <结果.json>`——判官面 error run **定点收正**；**素材面 = 定点重取**（响应原文不落档——§7-5 / KD-33 ⇒ 判官素材不可由档内重建）；落**新对**（缺省标签 `<原标签>-rejudged` · 原档不动 · 收编 = 人工点名）；溯源块 `rejudged` 逐 run `was → now`；与 `--recompute` 分工 = 触网 / 零网络两分档 | ① 用户要「收正 v6 1 例、免整跑重来」；② 素材不可重建是既有事实（KD-33 已裁）⇒ 补判必须重取素材（该 run 被测调用定点重跑 + 级联判分）——不许诺「同素材重判」；③ 原档不动 = 留档不可变（KD-10 精神）+ 收编先例（v5 重出）；④ `--recompute` 零网络结构保证不破（补判独立分档） | ① 覆盖改写原档（被否：留档不可变 + 同名拒写 KD-10）；② 复用 `--recompute` 加旗标（被否：破零网络结构保证——判定面须触网）；③ 只补判不重取素材（被否：物理不可行——档内无素材）；④ 补判覆盖被测侧失败（被否：无素材可判 + 该 error 是实测事实——裁点 ⑥） |
| KD-40 | **判官级联批版本口径 = 6 → 7**（+ `judge.json.frozenAtSuiteVersion` 同步）：级联替代 / 单判定判 / 替代池（判官身份面）三项均为判分口径面（§1.3-2 变更规则明列）⇒ 共用一次 bump；**补判档版本归属**：补判对 = 补判时代际（7）；原档仍标原代际（6——不改写）；两档不严格可比（方法行版本句已载）；同代际补判 ⇒ 可比性零损 | ① 判分合成规则变化 = 版本轴判入（§1.3-2 / §1.3-4 规则层）；② 替代池 = 判官身份面（同「任一位判官身份变化」）；③ 补判按现行口径执行 ⇒ 新对标现行代际才诚实；原档不动 ⇒ 不存在「6 档被改写成 7」的假象；④ 机械代价 = `SUITE_VERSION` 整数 + `judge.json.frozenAtSuiteVersion` 同步（机检绑定） | ① 不 bump（被否：判分口径实变——跨版本「看似可比」假象，KD-19 同源）；② 补判对沿用原档代际 6（被否：判分机制 ≠ 6 的代际——标 6 即失实）；③ 补判对改标 7 且删除原档（被否：留档不可变 + 收编须人工点名） |

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
| `instructions.1` | 正常 | 写一段关于「城市夜景」的短文。硬性要求：① 全文恰好 3 段（以空行分隔）；② 全文汉字数不少于 120；③ 全文不含逗号（中文「，」与英文 "," 均不可）；④ 「霓虹」至少出现 2 次；⑤ 以「夜」字开头。 | 判据 = **混合面**：① 段落结构（**正文**恰好 3 段——附注块不计入）= **判官**（rubric = §5.11 `instructions.1`）；②–⑤ 汉字 ≥120 / 无逗号 / 「霓虹」≥2 / 首字「夜」= 机械（字面 / 计数）——短路序 = 机械面先跑（§2.6） |
| `instructions.2` | 边界 | 写一条会议变更通知。硬性要求：① 全文恰好 2 句（以「。」分隔）；② 每句汉字数不超过 40；③ 必须含「截止」；④ 全文不含任何阿拉伯数字；⑤ 全文不含「请」字。 | 判据 = **混合面**：①② 句结构（**正文**恰 2 句 + 每句汉字 ≤40）= **判官**（rubric = §5.11 `instructions.2`）；③–⑤ 含「截止」/ 无阿拉伯数字 / 不含「请」= 机械（字面 / 计数） |
| `instructions.3` | 错误（约束冲突识别） | 请写一句话。硬性要求：① 必须包含英文大写单词 PASS；② 全文不得包含任何大写字母。 | 正确 = 指出约束不可能同时满足（不得以违反任一约束的产出通过）；判据 = **判官**（rubric = §5.11 `instructions.3`） |

### 5.6 多轮澄清 `multiturn`（τ-bench 简化）

| id | 类 | 输入（题面 / 脚本） | 期望与判据 |
|---|---|---|---|
| `multiturn.1` | 正常 | 回合 1：帮我给团队发一封会议邀请邮件。（信息不全：无收件人 / 主题 / 时间）→ 回合 2（脚本补全）：收件人 team@example.com，主题「周会」，时间明天 15:00。 | 回合 1 = 检索步白名单 `{get_time}`（其余工具调用 ⇒ fail——允许日期解析前置步）（机器）∧ **追问语义 = 判官**（是否请求缺失信息、未谎称已发送——rubric = §5.11）；回合 2 = **存在** `send_email` 调用且 `to` 匹配（多次调用 / 重复参数形态不计缺失或错误——取值容错 = KD-37；机器） |
| `multiturn.2` | 错误（过度澄清） | 回合 1：我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。 | `toolCalls.length === 0`（机器）∧ **候选语义 = 判官**（未提问 / 未要求补充 + ≥3 个互不相同、面向开发者、主题「快」的候选——rubric = §5.11） |
| `multiturn.3` | 边界（代决边界） | 回合 1：给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。 | **存在** `send_email` 调用（判定面 = 该 run 全记录序列；允许先经 `get_time` 检索步——检索步不计违规；**未跟进 ⇒ fail**）（机器）∧ **不追问语义 = 判官**（信息足够即代决——rubric = §5.11） |

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

**承载档（冻结）**：六条用例的测试档 = `bench/test/recompute.test.mjs`（已实现）+ `bench/test/report-render.test.mjs`（已实现）（2026-09-24 判分升级批拆分——原 `report-recompute.test.mjs` 已拆删；逐条见下表「测试档」列）；夹具住 `bench/test/fixtures.mjs`（§3 夹具落点）。

| id | 类 | 输入 | 期望与判据 | 测试档 |
|---|---|---|---|---|
| `recompute.1` | 正常 | 用夹具结果 JSON + 改价后的 prices.json 跑 `--recompute` | 落新报告对（`<原标签>-recalc`）；成本列随新价变化；原档字节不变 | `bench/test/recompute.test.mjs`（已实现） |
| `recompute.2` | 边界 | 夹具 JSON 含 `tokens: null` 的 call（usage 缺失） | 该行成本 `—`；重算成功不崩；warnings 保留 | `bench/test/recompute.test.mjs`（已实现） |
| `recompute.3` | 错误 | `--from` 指向损坏 JSON / 缺 `calls[].tokens` | 退出码 1 + 明确报错；不落任何档 | `bench/test/recompute.test.mjs`（已实现） |
| `report.1` | 正常 | 夹具结果渲染 md | 七段骨架齐（标题/概览/方法/结果/关键发现/局限/附录）；**五表**（能力矩阵 / 速度表 A / 速度表 B / 用时表 / 成本表——B 表 = `render.7` 增补轮起）+ 逐维明细 + **人工判读**小节在位 | `bench/test/report-render.test.mjs`（已实现） |
| `report.2` | 错误 | 夹具内模型响应含 `C:\Users\someone\…` 与 `sk-…` 字面 | `sanitize` 断言拒写（退出码 1）+ 指出命中位置 | `bench/test/report-render.test.mjs`（已实现） |
| `recompute.4`（AC-10） | 正常 | 毒化 `globalThis.fetch`（抛错）后跑 `--recompute` | 全流程成功 ⇒ 零网络调用的机检判据 | `bench/test/recompute.test.mjs`（已实现） |

### 5.11 判据条文正本（判官 rubric + 机械复核条文 · 冻结）

**判官 rubric（语义 / 结构解释面 · 13 例）**——逐条为 `judge.rubric` 的正本（实现档逐字复制；改 ⇒ `SUITE_VERSION + 1`）：

- **`reasoning.3`**：题干前提「9 是质数」为假。PASS = 指出 9 不是质数 / 不能作此分解（任何等价表述），或给出 3×3 的分解（`3×3` / `3 × 3` / `3*3` 等等价形态）。
  FAIL = 沿用错误前提给出质因数分解，或未点明前提不成立。
- **`instructions.1`**：短文**正文**须恰好 3 段（以空行分隔）。PASS = 正文为 3 个以空行分隔的段落——作者附加的说明 / 自检块（如以分隔线「---」与正文隔开）**不计入正文段**。
  FAIL = 正文段落数 ≠ 3（含把附注块并入计数、或正文不足 3 段）。
- **`instructions.2`**：通知**正文**须恰好 2 句（以「。」分隔），且每句汉字数不超过 40。PASS = 正文恰 2 句且两句均 ≤40 汉字（附带的说明 / 自检块不计入）。
  FAIL = 正文句数 ≠ 2，或任一句汉字数 >40。
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
- **`instructions.1`**：汉字 ≥120 / 无逗号（，与 ,）/ 「霓虹」≥2 次 / 以「夜」开头——四条全过（段落结构 = 判官面；本条只列机械面）。
- **`instructions.2`**：含「截止」/ 无阿拉伯数字 / 不含「请」——三条全过（句结构与每句汉字上限 = 判官面；本条只列机械面）。
- **`multiturn.1`**：回合 1 允许 `get_time` 检索步（其余工具调用 ⇒ fail）；回合 2 须**存在** `send_email` 调用且 `to = team@example.com`（多次调用 / 重复参数（`arguments` 重复拼接）不计缺失或错误——取首个 JSON 对象判定）。
- **`multiturn.2`**：零工具调用；给出 ≥3 个不同候选且未提问（主题「快」）。
- **`multiturn.3`**：须**存在** `send_email` 调用（全记录序列；允许先经 `get_time` 检索步——检索步不计违规；未跟进 ⇒ FAIL）；信息足够时不得追问。
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

**防护（本批新增）**：题面逐字冻结从「抽检 3 例」扩为**全量 28 条**（25 自动例 + 3 人工条）；新增**注记隔离断言**（全部题面不得含设计侧注记闭词表）——测试承载见 §5.13 `prompt.1` / `prompt.2`。历史档：v3 对已按 KD-25 出档——注记版题面的历史记录随之出档（本防护对全量在册题面生效）。

复核联动（§1.7-5）：机械 fail 的复核结果（`overturn`）= **判据修复必修项**（改判 `pass` 不豁免本项）——处置 = 修题面/判据（`SUITE_VERSION + 1`）；承接与销账机制（产出机器化 · 落台账 · 人工确认核销）见 §2.12。

### 5.13 判官 / 复核 / 题面面用例（测试承载 · §2.10 / §2.11 / §5 题面列口径）

**分档**：机制面用例 = `bench/test/judge.test.mjs`（已实现）；**文本判据面** = `bench/test/graders.test.mjs`（已实现——`text.*` 字面 / 计数面用例 + `judge.13` 混合面定点复现（`judge.test.mjs` 越线降载——§3 说明列）+ 本批增 `mech.1` / `mech.2`（承接修复定点复现——#273 / #274））；
渲染 / 重算面 = 报告/重算测试拆分后的两档（`bench/test/report-render.test.mjs`（已实现）/ `bench/test/recompute.test.mjs`（已实现）——拆分触发条件见 §3）+ **呈现面** = `bench/test/report-present.test.mjs`（已实现——`render.3` / `render.4`；名单扩容批增 `render.5`，本批增 `render.6` / `render.7`（速度表双表）/ `render.8`（矩阵两列））；
采集面 = `bench/test/timing.test.mjs`（已实现——`timing.1`）；**数据面** = `bench/test/roster.test.mjs`（已实现——`roster.1–3` / `temperature.1`，本批增 `roster.4`）；**参数预检面** = `bench/test/preflight.test.mjs`（拟新增——`preflight.1`）。夹具 = 桩传输（逐调用脚本——A / B 两路，分歧样本含第三路 C；**不触网**）。

| id | 类 | 输入 | 期望与判据 | 测试档 |
|---|---|---|---|---|
| `judge.1` | 正常 | 桩传输返回 `{"verdict":"pass","reason":"…"}` | 该 run 判 pass；`runs[].judge` 记录齐（verdict / reason / turn / attempts / calls 带 at / tokens / cost） | `judge.test.mjs` |
| `judge.2` | 边界（单发语义收正 · 本批） | 该级返回空输出（模拟思考烧尽——`finishReason=length` 形态） | **单发**：不发生同模型第二发（桩调用计数 = 1）；该级记失败 ⇒ 进下一级（级联语义 = `judge.14` / `judge.15`）；预算 = 默认 8192（§2.10.1——一次到位，不放大） | `judge.test.mjs` |
| `judge.3` | 错误 | 该级不可解析（单发）或超时抛错 | 该级失败（单发——不重发同模型；级联接管，§2.10.1）；判分**不得回落词表判**（反例断言保持）；级链穷尽 ⇒ run `verdict = error` + detail 前缀「判官不可用」+ `runs[].judge.verdict = "error"`（形态 = `judge.17` / `judge.18`） | `judge.test.mjs` |
| `judge.4` | 错误 | `judge.json.frozenAtSuiteVersion` ≠ `SUITE_VERSION` | 拒跑（退出码 1）+ 明示提示 | `judge.test.mjs` |
| `judge.5` | 边界 | 任一位判官 key（A / B / 仲裁 C）∈ 本次被测集合（自判）；另一形态 = 同 provider 异 model（key ∉ 被测） | **正常跑**（不拒跑 · 退出码 0）+ 该位 `sameVendorAsTested = true` + 该位 `warnings` 一条（逐位——点名位次与重合级别）；报告判官行该位标注「该位 ∈ 被测（自判）」（同 provider 异 model 形态 ⇒ 标注「与被测同渠道」） | `judge.test.mjs` |
| `judge.6` | 错误 | `judge.json` schema 不合（`maxTokens` < 1024 / `timeoutSec` 越界 / `provider` 缺失 / **`judges` 长度 ≠ 2 · `arbiter` 缺**） | 装载即拒（fail-closed） | `judge.test.mjs` |
| `judge.7` | 边界 | 触发面判定：机械 fail / 判官 fail / error 三类 run | 机械 fail 触发复核；判官 fail **不叠加**复核；error 不触发 | `judge.test.mjs` |
| `judge.8` | 正常 | 桩传输 A / B 均返回同向裁决 | 合成分 = 该向；`resolution = "unanimous"`；仅 A / B 两次调用（**不触发仲裁**）；`agreements +1` | `judge.test.mjs` |
| `judge.9` | 边界 | A / B 相异且仲裁 C 返回（多数决） | 合成分 = 多数派；`resolution = "arbitrated"`；三次调用逐位记账；`disagreements` / `arbitrations` 计数 +1；渲染面 = 分歧率与《判官分歧》小节 | `judge.test.mjs` / `report-render` |
| `judge.10` | 错误 → 正常（级联语义收正 · 本批） | 单判官失败（A 原位不可解析（单发）/ 超时，B 成功） | **替代级 1 补判成功 ⇒ 双判合成**；A 位 `substitutes` 在档；替代级全败形态 = `judge.16` / `judge.17` | `judge-fallback.test.mjs`（自 `judge.test.mjs` 迁正）/ `judge.test.mjs` |
| `judge.11` | 错误 → 正常（级联语义收正 · 本批） | A / B 分歧 + 仲裁 C 原位不可解析（单发） | **C 替代级补判成功 ⇒ `arbitrated`（多数决）**；三方调用留证 | `judge-fallback.test.mjs`（自 `judge.test.mjs` 迁正）/ `judge.test.mjs` |
| `judge.12` | 错误 | 身份违约：A / B 同 `model` 字面；或仲裁员 `model` ∈ {A, B} | 拒跑（退出码 1）+ 明示违约位次（A≠B · 仲裁员第三方） | `judge.test.mjs` |
| `review.1` | 正常 | 机械 fail 的 run + 桩复核返回 `uphold` | 该 run 仍 fail（**不改判**）；`runs[].review.verdict = "uphold"`；能力矩阵通过数不变 | `judge.test.mjs` / `report-render`（dry-run 全链路 `longctx.2`） |
| `review.2` | 边界 | 机械 fail + 桩复核返回 `overturn` | **改判**：`run.verdict` 置为 `pass`（计入 pass 计数）；`aggregate.overturns = 1`；渲染 `✅ pass` + `⟲` 标记 +《复核翻案》小节（用例 · 模型 · 机械失败断言 · 复核理由） | `report-render.test.mjs`（dry-run 全链路 `tools.3`：改判 · 计数 · `⟲`）/ `judge.test.mjs`（复核记录形状） |
| `review.3` | 错误 | 复核调用失败 | fail 维持（**不降为 error、不改判**——fail-closed）+ `runs[].review.verdict = "error"` + 告警计数 | `judge.test.mjs`（+ 夹具注入腿：`review.verdict = "error"` ⇒ run 判定保持 `fail`） |
| `text.1` | 正常（结构断言） | `textRules` 规则表（`bench/lib/grade.mjs`） | `paragraphCount` / `sentenceCount` / `hanziPerSentenceMax` 三 kind 已删（零调用者；未知 kind ⇒ fail-closed 负断言保持）；无 `paragraphs` / `sentences` 解析件 | `graders.test.mjs` |
| `judge.13` | 正常（混合面重划 · 定点复现） | `instructions.1` / `.2` **缺陷形态串**（正文 3 段（`.1`）/ 2 句（`.2`）+ `---` + 自检块——机械条全过）+ 桩判官两态 + 机械违例变体 | ① 缺陷形态串 ∧ 桩 A/B pass ⇒ run pass 且判官被调（机械面未拦下——**修复后 pass** 腿）② 桩 A/B fail ⇒ run fail（判官定判）③ 机械违例 ⇒ fail 且**不调判官**（短路——桩零调用 / 无 `runs[].judge`）；dry-run 全链路（`--dims instructions`）同断；分层冻结 13 / 20 / 8 / 5 = `suite.test.mjs` | `graders.test.mjs` |
| `judge.14` | 正常（级联修复 · 本批新增） | 桩传输：B 位原位超时（`fail:"throw"`）⇒ 替代级 1 返回合法裁决 | 合成分 = 双判（A 原位 + B 替代）一致 ⇒ `unanimous`；B 位 `substitutes` 记 `level` 2（替代级 1）+ 其 call 携 `level: 2`；A / B 实际模型两两不同；告警分列 = 替代 1 次 | `judge-fallback.test.mjs` |
| `judge.15` | 边界（逐级迭代 + 身份跳过 · 本批新增） | 桩传输：A 位两级皆败（原位超时 + 替代级 1 空输出——单发即败）⇒ 替代级 2 成功；B 位原位成功 | A 位 `substitutes` 两级逐项在档（**替代级 1 / 2 ⇒ `level` 2 / 3**——级链基址 §2.10.1；`cause` 逐级）；A 实际模型 ≠ B / C / 池内已用项（跳过规则机检）；合成 `unanimous`；`substitutions` 计数 = 2 | `judge-fallback.test.mjs` |
| `judge.16` | 边界（单判定判 · 本批新增） | 桩传输：A 位级链穷尽（原位 + 全池逐级各一发，尽败）、B 位有效 | `resolution = "single"`；`verdict` = B 位裁决；A 位 `error` 逐级留证；告警「单判定判 1 次」+ `singleJudged = 1` | `judge-fallback.test.mjs` |
| `judge.17` | 错误（物理边界 · 本批新增） | 桩传输：A / B 两位级链皆穷尽 | `verdict = error` + `resolution = "none"` + detail 前缀「判官不可用（有效判不足）」+ 全池调用留证（逐位 `substitutes` 尽列）+ 告警分列（不可用 1 · 替代 n） | `judge-fallback.test.mjs` |
| `judge.18` | 错误（分歧未决 · 本批新增） | 桩传输：A / B 相异、C 位级链穷尽 | `error`（无多数）+ 成因「分歧未决」+ 三方（含替代级）留证；`disagreements` 计数 +1 | `judge-fallback.test.mjs` |
| `judge.19` | 错误（替代池静态身份违约 · 本批新增） | `judge.json` 夹具三态（每态独立装载）：① 池内两项同 `model` 字面；② 池项 `model` ∈ {A, B, C} 字面；③ 全合法（对照腿） | ① ② 装载即拒（fail-closed——拒跑 + 点名违约池项，与 §2.10.3 ⑤ / §2.10.4 启动面同一枚举）；③ 装载过（对照） | `suite.test.mjs`（`judge.json` schema 腿） |
| `rejudge.1` | 正常（补判通道 · 本批新增） | 夹具结果档（含 `judge.verdict = "error"` run + 一条被测侧 error run）+ 桩传输（重取素材 + 级联判分）；另腿 = 零对象档 | ① 判官面 error run ⇒ 判定替换（`was` / `now` 入 `rejudged.runs`）+ 新对落盘；② **被测侧 error run 不入列**（保持原样——反例控制）；③ **原档逐字节零改**；④ 缺省标签 `<原标签>-rejudged`；⑤ 零对象腿 ⇒ 明示 + 不落档 + 退出码 0；⑥ **重取后仍失败**（被测侧 / 全池不可达）⇒ 新对中该 run 仍 `error` ∧ `rejudged.runs[].now` = `"error"`（**不承诺突破物理边界**——§2.14 第 3 点） | `judge-fallback.test.mjs` |
| `review.4` | 正常 | 夹具含 1 条 `overturn`（`tools.3`） | 《复核翻案》小节尾部「承接清单」段在场（**改判后仍照出**——承接不因改判而免）：含 `tools.3` · 承接落点（台账）· 处置（`SUITE_VERSION + 1`）· 销账要点；控制台摘要含复核计数 + 承接提示行；夹具 0 翻案 ⇒ 无承接段（「本轮无复核翻案」保持） | `report-render.test.mjs` |
| `review.5` | 边界（混合面翻案形态） | 夹具 `fixtureResult({ mixedOverturn: true })`：混合面用例（`instructions.1`）机械 fail 被翻案（该 run 无 `runs[].judge`——短路实录；判定 = 改判后 `pass`） | ① 「**判官面未裁决**」标注在位：逐维明细复核行 + 《复核翻案》逐条 + 图例 / 脚注（两形态口径句）；② **反例控制**：纯机械面翻案（`tools.3` 复核行）**不携**该标注（断言限定行内——图例句自含该词）；③ 判定单元格照旧 `✅ pass … ⟲`（改判口径不因混合面而变） | `report-render.test.mjs` |
| `render.1` | 正常 | 含判官对 / 分歧 / 复核记录的夹具结果（**缺价腿 = 合成键 `fixture:unpriced-model`**——不取现盘缺价档：价格补录不连带改测试） | 概览判官三行（A / B / C · **逐位元数据无金额**）+ 分歧率 + 方法判分条 + 成本表（列集 = **八列**——增补③ 扩三交叉列）+ 相对成本基准**不含**评估开销 + 概览**评估开销分账句**（不列金额）+ 逐维明细 `⇄` 标记 + 《判官分歧》小节 + 告警计数（判官不可用（成因分列）/ 分歧 / 仲裁 / 复核 / 翻案）+ **缺价腿四断言**（位级成本 `null` · 位级「价格未录：判官 B（…）」警告在位 · **成本表表头八列正控**（`| 模型 | 总成本 | 每任务成本 | 每通过任务成本 | 相对成本 | 合计通过数 | 累计耗时 | 相对倍率 |`——真实可失败的结构断言，非弱守卫）· md 零评估开销金额；覆写补 `host` / `sameVendorAsTested` + **判官 B 行标注断言**（`fixture:unpriced-model` 在位 ∧ 重合标注 =「与被测无重合」）） | `report-render` |
| `render.2` | 正常 | 含 `cases[].prompt` 的夹具结果（含构造型长题面 / 多轮拼接题面） | 逐维明细题面行 = 题面正本逐字；超 300 字符 ⇒ 截断 `…`（仅渲染面）；JSON 内 `prompt` 存全额 | `report-render` |
| `render.3` | 正常（成本表列集收正 · 定域；增补③ 扩：交叉列三列） | 夹具结果渲染（两档——交叉列对读非平凡） | ① 成本表表头 = **八列**精确串（增补③ 扩——含交叉列三列）；② **定域反例**：成本表块内零 `判官成本` / 零 `复核成本` / 零「两列」字样；③ 脚注 = 分账原则句（**逐字 = §2.3-8 冻结字符串**；含「不参与相对成本归一化」· **块内零金额**）；④ **报告零金额反控**：概览判官行零「成本 ¥」+ 全 md 零「判官成本」金额串；⑤ **统计在位**（非成本面）：判官行「调用 N 次」· 分歧率行 · 告警行复核计数；⑥ **账目面反控**：JSON `judge.judges[].costCny` / `aggregate.judgeCostCny` / `aggregate.reviewCostCny` 照旧（字段零改——金额只住 JSON）；⑦ **交叉列同源对读**（增补③ · #276）：合计通过数格 = `### 能力矩阵`「合计」同档格；累计耗时 / 相对倍率格 = `### 用时表` 同档格（同 md 内逐档对读）；⑧ **缺数据 `—`**（增补③）：无耗时样本档 ⇒ 累计耗时 / 相对倍率 `—`；缺价档 ⇒ 相对成本 `—`；⑨ **行序不变**（增补③）：行序 = 每通过任务成本升序（新列零影响）；⑩ **轴子集腿**（本收正轮）：`run.axes = ["cost"]`（无 `capability` / `speed`——源表（矩阵 / 用时表）不出为前置）⇒ 交叉列三列**照出值**（同源算式——§2.3-10④ 轴子集口径） | `report-present`（新增档） |
| `render.4` | 正常（用时表 · 定域；增补③ 扩：交叉列两列） | 夹具结果渲染（判官 / 复核 `calls[].totalMs` 刻意置大值） | ① 用时表在位（速度表后）+ 列集 = {模型 · 累计耗时 · 相对倍率 · 排名 · 采样 run 数 · 合计通过数 · 相对成本}（增补③ 扩两列——尾接）；② 累计耗时 = Σ `runs[].metrics.totalMs`（**定域反例**：判官 / 复核调用的 `totalMs` 不计入——大值不入合计）；③ 相对倍率最低者 = 1.0×；④ 排名升序 + 同值并列顺延（夹具含并列腿）+ 缺数据 `—` 居末 + 脚注；⑤ **采样 run 数列 = 参与累计的 run 数**（夹具含 `skipped` 腿与 `totalMs = null` 腿 ⇒ 该格 = 参与累计数，非该模型面 run 总数——反例控制）；⑥ 轴门控：`run.axes = ["cost"]`（无 speed）⇒ 用时表不出；⑦ **口径行（本批收正）**：含「error run 已记录耗时照计」与「`null` = 未记录」两短语（字面 = §2.3 骨架口径行逐字冻结子串）；**全部 call 已记录**的 `error` run ⇒ 累计 / 倍率 / 排名 / 采样全含且不入脚注（子腿：单 `error` run 模型——反例控制 = null 腿仍入脚注；部分未记录 ⇒ 按 ⑧ 处置（入脚注））；⑧ **部分未记录腿**：夹具 run 的 `calls[]` = 一 call 有值 + 其余 `totalMs` = `null`（run 级 `metrics.totalMs` = 已记录之和；**判定类型不受限——`error` / `fail` 同规则（含 `error` 腿可选）**）⇒ ① 该 run 按已记录之和入累计（累计格含该和）；② 该 run **入脚注**（含「部分 call 未记录」字面——§2.3-7 同源）；⑨ **交叉列同源对读**（增补③ · #276）：合计通过数格 = 矩阵「合计」同档格；相对成本格 = `### 成本表` 同档格；⑩ **缺数据 `—`**（增补③）：全缺样本档 / 无价档 ⇒ 相对成本 `—`（④ 行序腿不回归）；⑪ **轴子集腿**（本收正轮）：`run.axes = ["speed"]`（无 `cost`——源表（成本表）不出为前置）⇒ 交叉列两列**照出值**（与 ⑥ 轴门控腿对读——§2.3-10④ 轴子集口径） | `report-present`（新增档） |
| `timing.1` | 正常 / 边界（失败调用耗时采集 · 定域） | `runCase`（`bench/lib/client.mjs`）+ 桩传输三腿：① **超时腿** = 挂起传输（响应 `signal` 中止）+ `timeoutMs` 预算 ⇒ `AbortSignal.timeout` 触发拒绝；② **接口错腿** = 延迟后抛错；③ **成功对照腿** = 夹具声明 `ttftMs` / `totalMs` | ① ② `calls[0].totalMs` 为**数字且 ≥ 阈值**（真实墙钟 ≠ `null`——对失败即 `null` 的旧行为反例控制）· `ttftMs` / `tokens` = `null`（照实缺）· `error` 非空（① 名 = `TimeoutError`）；③ 成功路径读数零改（声明值原样透传）；`runMetrics(calls).totalMs` 含 ① ② 的耗时（聚合腿）；④ **部分未记录腿**（合成 `calls`——一 call 有值 + 其余 `totalMs` = `null`，不经传输）：`runMetrics(calls).totalMs` = **已记录之和**（= 该值 · 非 `null`——§2.3-7） | `bench/test/timing.test.mjs`（新增档） |
| `recompute.5` | 正常 | 含判官/复核 calls 的档 + 改价后 `prices.json` | 判官（逐位）/ 复核成本随新价重算；被测成本列不受影响 | `recompute` |
| `fixture.1` | 正常 | dry-run 夹具覆盖自检 | 每个判官面用例在 `FIXTURE.judge` 有 A / B 脚本（夹具含分歧样本的 C 脚本）、每个机械面用例在 `FIXTURE.review` 有脚本；dry-run 全链路零网络 | `suite.test.mjs` |
| `prompt.1` | 正常 | 全量题面逐字冻结（25 自动例 + 3 人工条 = 28 条） | 任一题面与冻结清单不符即红（改题须 `SUITE_VERSION + 1`） | `suite.test.mjs` |
| `prompt.2` | 错误（反例控制） | 注记隔离断言：全部题面不得含设计侧注记闭词表（`指代不明` / `对象不明` / `测点` / `测试点` / `内部注记` / `陷阱题`——扩表 ⇒ `SUITE_VERSION + 1`）；反例串 = 注记版 `manual.2` 题面 | 反例串必须被判红（守卫有效性）；全部在册题面必须全过 | `suite.test.mjs` |
| `roster.1` | 正常（名单全量 · 本批新增） | `bench/models.json`（29 档）+ `selectEntries` | 29 条在册（现役 6 + 新增 23）；**29 个 label 逐名解析全成功**（`--models` 逐名在册）；复合引用解析成功（含大小写异形键 `minimax:MiniMax-M3`） | `roster.test.mjs`（新增档） |
| `roster.2` | 边界 / 错误（温度字段 schema · 本批新增） | 临时 roster 三态：`temperature: 1`（合法）/ `"1"` / `3`（非法） | 合法过；非法 ⇒ 装载即拒（fail-closed——体例同 `dims`） | `roster.test.mjs` |
| `roster.3` | 正常（价格键对齐 · 本批新增） | 在册 29 档 × `prices.json` | 非通配价格条目的 `provider:model` ∈ 在册条目 ∪ 判官键（无孤儿——既有判据）；**已录价档 `matchPrice` 命中自身键**（防大小写 / 错拼——如 `minimax:MiniMax-M2.7-highspeed`） | `roster.test.mjs` |
| `temperature.1` | 正常（温度透传 · dry-run · 本批新增） | dry-run `--models kimi-k3`（例外档）/ `--models deepseek-flash`（缺省档） | 结果 JSON `models[].temperature` = 1 / 0（实际取值入档）；全链路零网络 | `roster.test.mjs` |
| `render.5` | 正常 / 边界（温度例外披露句 · 名单扩容批新增） | 夹具结果：① 含例外档（`models[].temperature = 1`）② 全 0（无例外）③ 旧档缺字段（自 ② 夹具删 `models[].temperature` 键——旧代际实态样本 v4 · 该对出档（用户 2026-09-24 16:01 裁定——时点 = v5 落档验收后）） | ① 概览含「温度例外」披露句（逐档列 label 与取值）；② ③ 该句不在位（反例控制——③ 缺字段 ≡ 全 0 由 `??` 缺省语义保证，§2.2-12） | `report-present.test.mjs` |
| `render.6` | 正常 / 边界（逐档参数表 · 本批新增） | 夹具结果五态：① 档位覆写档（`models[].reasoningEffort = "medium"` + `reasoningEffortFrom = "models.json"`）② 配置原值档（`from = "config"`）③ 旧档缺两键（自 ① 删键）④ 含温度例外档 ⑤ 被忽略档（`models[].note` = 「服务端忽略 effort（实弹 2026-09-24）」） | ① ② 参数表在位（列集 = 模型 · 路由 · temperature · 思考强度（值 + 来源）· maxTokens）+ 逐行对读；③ 该档格 `—`（缺省语义——旧代际未采集）；④ temperature 格注「档位例外」（与披露句同源）；⑤ note 披露腿：概览模型表该行「备注」格含「服务端忽略 effort」字面 ∧ 参数表列集零改（生效性不另设列——§2.3-9）；**反控** = 全 md 零评估开销金额（KD-29 不回归） | `report-present.test.mjs` |
| `render.7` | 正常（速度表双排序 · 增补轮新增） | 夹具结果渲染（含缺数据档：TTFT / tok/s `null`——构造） | ① 两表在位 + 落位 = A 在 B 前 · B 在用时表前（标题逐字 `### 速度表 A（按 TTFT 中位升序）` / `### 速度表 B（按 tok/s 中位降序）`）；② 表 A 行序 = TTFT 中位升序（缺数据居末）；③ 表 B 行序 = tok/s 中位降序（快者在前 · 缺数据居末）；④ **列集逐字相同正控**（两表表头 = `| 模型 | TTFT 中位 | tok/s 中位 | 总耗时（中位） | 采样 run 数 |`）；⑤ 注文区分（A 含「按 TTFT 中位升序」/ B 含「按 tok/s 中位降序」）；⑥ 脚注一份 · 列表 B 后；⑦ 轴门控：无 `speed` 轴 ⇒ 两表同隐 | `report-present.test.mjs`（增补轮新增） |
| `render.8` | 正常（能力矩阵两列 · 增补轮新增） | 夹具结果渲染（含缺数据档：无 pass/fail 样本 / 无价） | ① 矩阵表头 = 既有列 + 合计 + 总耗时 + 相对成本（两列接合计后）；② 总耗时 = 速度表同源格值（与 `### 速度表 A` 同档对读一致）；③ 相对成本 = 成本表同源倍率（最低者 = 1.0×）；④ **反例控制**：≠ 用时表「累计耗时」（累计大值档的两格不等）；⑤ 缺数据 `—`；⑥ 行序不变（合计通过数降序）；⑦ 注文区分（矩阵注文含「与用时表「累计耗时」不同源」区分句） | `report-present.test.mjs`（增补轮新增） |
| `roster.4` | 正常（中档取值表 · 本批新增） | `bench/models.json` 全 29 档 × 映射规则（① 枚举含 `medium` ⇒ `medium`；② 无 `medium` ⇒ 该档枚举行中位档；③ 无枚举行 ⇒ `medium`） | 逐档 `reasoningEffort` = 映射值（名单 = 批次档 §1.5 逐档表）；覆写值 ∉ 该档 spec 枚举 ⇒ 由预检枚举面拦（`preflight.1` ③——双层防护） | `roster.test.mjs` |
| `preflight.1` | 正常 / 错误（枚举面 · fail-closed · 本批新增） | `bench/lib/params.mjs`（拟新增）枚举面判定**六项对齐腿**（stub config + 真 spec 表）：① 全合法 ⇒ 零阻断（对照腿）；② provider 缺（项①）⇒ 阻断；③ spec 未命中（项②）⇒ 阻断（新腿）；④ effort ∉ 枚举（项③）⇒ 阻断 + 同腿变体 = 豁免档（`model` 含 `/`）⇒ 判定跳过 · 零阻断（项⑤——新腿）；⑤ 温度裁剪对账（项④）⇒ 报警（不入阻断集）；⑥ thinking 面（项⑥）= 不设判定（明示无腿） | ① 过；② ③ ④ 逐条点名阻断（`run.mjs` 启动面 ⇒ 拒跑 exit 1；`bench/preflight.mjs`（拟新增）同源打印）；⑤ 报警行在位且 exit 0（对阻断集反例控制）；**零网络**；判官三槽 + 替代池逐项同受检（含槽位 entry effort 面）——**池内项腿**：池项 provider 缺 / spec 未命中 / effort 越枚举 ⇒ 阻断；豁免档（`model` 含 `/` / `format` 面）⇒ 判定跳过 · 零阻断（同 ④ 腿变体） | `bench/test/preflight.test.mjs`（拟新增） |
| `mech.1` | 正常 / 错误（`multiturn.1` 判据修复 · 定点复现 · 本批新增） | 合成 `result.turns`（不调模型）：① 修复形态 = 回合 1 [`get_time` 检索步 + 追问文本]、回合 2 [`send_email`（`to = team@example.com`）]；② 实录形态 = 回合 2 多条 `send_email` 且 `arguments` = 同一 JSON 对象**重复拼接**（minimax 实录形态）；③ 反例 = `to` 为他值 / 回合 1 出 `send_email` / 回合 2 无 `send_email`；④ 原语直接腿 = `firstJsonObject` / `argValue` 三态（严格过 / 拼接取首件 / 不闭合 ⇒ null） | ① 机械面全过 ∧ 桩判官被调（**修复后 pass** 腿）；② 机械面全过（存在语义 + 首平衡对象取值——修复判别形态：修复前严格解析失败 ⇒ `to` 读空 ⇒ fail）；③ 三条各 fail 且**不调判官**（短路——不放松真违规支）；④ 原语三态逐条；⑤ dry-run 全链路（`.1` 夹具 = 检索步形态）run pass ∧ 判官记录在场 ∧ 无复核记录；修复前 fail 凭证 = v5 报告《复核翻案》承接表实录（`bench/results/2026-09-24-roster-29-v5.md`；机械失败断言原文 `回合 1 信息不全却调用了工具：get_time` / `send_email.to=（需 team@example.com）`）+ 旧判据串负断言（循 `text.1` 先例） | `graders.test.mjs` |
| `mech.2` | 正常 / 错误（`multiturn.3` 判据修复 · 定点复现 · 本批新增） | 合成 `result.turns`（不调模型）：① 修复形态 = 回合 1 [`get_time` 检索步] → **跟进** [`send_email`]；② 跨回合跟进形态 = 回合 1 [`get_time`]、回合 2 [`send_email`]（修复判别形态）；③ 反例 = 仅检索步无跟进 / 无任何调用（追问推脱形态） | ① ② 机械面全过（**修复后 pass** 腿——② 修复前 = 只查回合 1 ⇒ fail `回合 1 未调用 send_email（实际：get_time）`）；③ 两条各 fail（不放松真违规支——信息足够仍不得追问 / 仍须发信）；④ dry-run 全链路（`.3` 夹具）run pass ∧ 判官记录在场；修复前 fail 凭证 = v5 报告《复核翻案》承接表实录 + 复核理由行 | `graders.test.mjs` |

测试策略五则（冻结）：① **测试不得依赖真网络**——判官面一律桩传输（`judge.test.mjs` 与 dry-run 夹具同一机制）；② 夹具住 `bench/test/fixtures.mjs`（拆分时提取——§3）；③ **翻案改判（`overturn` ⇒ `pass` · 计入通过数）、两形态「判官面未裁决」标注、承接清单与题面入档 = 必测项**（上表）；
④ **成本表列集（八列）· 用时表列集（七列）· 交叉列同源对读（用时表 / 成本表 / 矩阵三面同值）· 报告零金额（md）与账目面（JSON 零改）· 用时表（Σ 定域 / 倍率 / 排名）· 失败调用耗时采集（`timing.1`）= 必测项**（§5.13 `render.3` / `render.4` / `timing.1`）；
**速度表双表（`render.7`）/ 矩阵两列（`render.8`）= 必测项**（增补轮）；**报告交叉列（`render.3` / `render.4` 扩 = 增补③ · #276）同入必测项**；**判官级联 / 终局 / 补判三面 = 必测项**（级联修复 · 身份跳过 · 静态身份拒跑 · 单判定判 · 两类物理边界 · 补判通道与反例控制 → `judge.14–19` / `rejudge.1`）；
⑤ **名单 / 价格数据面（29 档解析 · 温度 schema 与透传 · 价格键对齐）= 必测项**（§5.13 `roster.1–3` / `temperature.1` / `render.5`）。

**失败耗时采集腿的设计轮预演实测（2026-09-24 · 只读实验 · 无落档）**：`runCase` + 挂起传输（响应 `signal` 中止）+ `timeoutMs = 80` ⇒ 本批前记录（预演当刻）= `calls[0] = { round: 1, ttftMs: null, totalMs: null, tokens: null, toolNames: [], finishReason: null, throttled: false }`（缺口实态——`bench/lib/client.mjs:148`；**落地后该缺口已补**——批档 §5）；
`error` = `TimeoutError: The operation was aborted due to timeout`（与 v4 实录同形——批档 §1.1）· 墙钟 ≈ 96 ms（超时预算 + 中止传播）⇒ `timing.1` ① 阈值建议 ≥ 50 ms（预算取值 80 ms）；该腿在 `node:test` 体内可直接完成（已验）。

**重划输入证据（v3 `instructions.1` 翻案实录形态）**：正文 3 段（汉字 160 · 无逗号 · 「霓虹」×2 · 首字「夜」）+ `---` 分隔线 + 作者自检块 ⇒ 旧机械面读数「段落 4」fail（把附注块计入段落——实录见批次档 §1.2；v3 报告对已按 KD-25 出档），复核翻案指出解析边缘误判。
**重划后该形态 = `judge.13` 定点复现夹具**（缺陷形态串：机械面全过 + 桩判官两态——§5.13）；机械面已无段落判据——段落结构由判官按 §5.11 rubric 裁决（附注块不计入正文段）。

## 6. AC 回指（§1.4 / §1.7 / §1.8 原文 → 设计落点）

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | `node bench/run.mjs --models <a,b> --dims <capability,speed,cost>` 一条命令跑通 | §2.1（CLI 契约 + 语义细则 1）· §3 `bench/run.mjs`（已实现） | 实施轮真实冒烟跑（1 模型 × 1 维）+ `--dry-run` 全链路 |
| AC-2 | 结果 JSON 落 `bench/results/`：含 suiteVersion / 模型 / 时点 / 每维判定 / token 消耗 / 成本 | §2.2（schema 逐字段） | `--dry-run` 产物断言（JSON 字段齐）——测试 `bench/test/report-render.test.mjs`（已实现——拆分后两档之一；原 `report-recompute.test.mjs` 已拆删） |
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
| AC-1 | `aiJudge` 落地：结构化输出 + fail-closed + 输入回合精确 + 预算充足 | §2.10.1（接口契约全项）· §2.6（用例声明面）· §3 `bench/lib/judge.mjs`（已实现） | `judge.1–3`（桩传输）+ `judge.2`（单发——不可解析不重发）+ dry-run 全链路 |
| AC-2 | 语义判据接入（`vision.3` · `multiturn.1–3` · 其他语义面逐条裁定） | §2.10.2（判据分层表 25 例逐条 + 计数 13 / 20 / 8 / 5 = 计数单源）· §5.11（rubric 正本） | `suite.test.mjs`（判官面 / 机械面集合 = 冻结清单）+ 逐面桩测 |
| AC-3 | judge 身份机制（配置项 + 校验：A≠B · 仲裁员 ∉ {A, B}）；判官可与被测重合——**允许自判**（用户 2026-09-24 03:16 裁定；判官不得干预被测选择） | §2.10.3（`judge.json` 三槽 + 身份校验 ③/④ + 与被测重合明示） | `judge.5` / `judge.12` |
| AC-4 | 成本分账（judge 成本单列，不污染被测成本表） | §2.2-10（记账面）· §2.10.5 · §2.3（成本表列集 = 五列 + 相对成本基准不变；评估开销金额 md 零展示） | `render.1`（相对成本不含评估开销）+ `render.3`（列集 / 零金额）+ `recompute.5` |
| AC-5 | judge 元数据入档（模型 / 版本 / 时点——结果 JSON + 报告）——**射程扩（§1.10 D4）**：A / B / C 逐位入档；任一位换代 ⇒ `SUITE_VERSION + 1` | §2.2-7/8（`judge` 块逐位 + 逐位逐调用 `at`）· §2.10.6 · §2.10.3 冻结绑定 · §2.3 概览判官三行 | `judge.1`（逐位记录齐）+ `suite.test.mjs`（三槽 schema）+ dry-run 产物断言 |
| AC-6 | 降级口径（judge 缺 ⇒ 明示 error，不静默回退） | §2.10.4（三级梯度） | `judge.3`（不得回落词表 = 反例断言）+ `judge.4` / `judge.6`（启动面拒跑） |
| AC-7 | v3 重跑落档（当批唯一在档报告——含判官双判裁决 + 机械复核记录） | §6 下表「v3 重跑口径」· §3 `bench/results/` · §9（判官三槽初值 · 与被测重合明示） | 实施轮真实跑 + 报告对入库（当批唯一在档；v3 对已按 KD-25 出档——在档 = v5 对 · v4 对出档（用户 2026-09-24 16:01 裁定——时点 = v5 落档验收后）） |
| AC-8 | 机械 fail 复核触发（判官主判不叠加；`error` / `skipped` 除外） | §2.11 触发条 | `judge.7` |
| AC-9 | 复核处置 = 「复核翻案」独立分类 · **改判 `pass`（计入通过数）+ `⟲` 标注**（2026-09-24 11:23 裁定）· 单列呈现 | §2.11 处置 + 呈现 | `review.2` |
| AC-10 | 复核成本仅 fail 触发、独立记账（不进被测成本与相对成本归一化） | §2.11 成本 + §2.10.5 | `recompute.5` + `render.3`（md 零展示） |
| AC-11 | 复核结果联动判据演进清单（《复核翻案》小节 + `runs[].review`） | §2.12 + §2.3 | `review.2` + §5.12 |
| AC-12 | 复核 fail-closed（复核失败 = fail 维持 + `review.verdict="error"` + 告警） | §2.11「复核失败」 | `review.3` |
| AC-13 | **双判机制**（批次档 §1.10）：判官对 A/B（A≠B）+ 分歧确定性处置（第三判仲裁 · 多数决）+ 失败面 fail-closed（合成无多数 ⇒ `error`）+ 成本 ×2 / 分歧 ×3 独立记账 + 分歧率与分歧样本入报告 | §2.10.1（合成规则）· §2.10.3（三槽 + 身份校验）· §2.10.4（fail-closed）· §2.10.5（成本）· §2.10.6（元数据）· §2.2 / §2.3（分歧计数与报告面） | `judge.8–judge.12`（桩传输）+ `render.1`（分歧率 / 小节）+ `suite.test.mjs`（A≠B · 仲裁员第三方 · 三槽 schema） |
| AC-14 | **逐维明细列题面**（批次档 §1.11）：题面正本逐字入档（结果 JSON `cases[].prompt`）+ 报告逐维明细题面行（呈现与人工判读段对齐；长题面截断口径=渲染面 ≤300 字符） | §2.2-11（`cases[].prompt`：采集面 / 构造型载荷不入档 / `--recompute` 自足）· §2.3（逐维明细题面行 + 截断口径） | `render.2`（题面行 + 截断）+ dry-run 产物断言（`cases[].prompt` 齐） |
| §1.7-1 | 复核触发面 = 机械判据 fail 的 run（判官主判不叠加；error 除外） | §2.11 触发判据 | `judge.7` |
| §1.7-2 | 复核输入 = 题面 + 判据条文 + 响应原文（回合精确） | §2.11 输入构造 · §5.11（`mechRubric` 正本） | `review.1–2`（输入素材断言） |
| §1.7-3 / §1.8 | `overturn` 处置 = 独立分类「复核翻案」（**改判 `pass`**——2026-09-24 11:23 裁定；单列呈现） | §2.11 处置 + 呈现 · §2.12（演进清单） | `review.2`（改判 + `⟲` + 小节渲染） |
| §1.7-4 | 复核成本仅 fail 触发、独立记账 | §2.11 成本 · §2.10.5 | `recompute.5`（JSON 账目照旧）+ `render.3`（md 零展示 · 金额只住 JSON） |
| §1.7-5 | 复核结果喂题面-判据一致性清单 | §5.12（联动）· §2.12 | `review.2`（《复核翻案》小节 = 证据面） |
| §1.10 D1 | 判官对 A/B（A≠B） | §2.10.3（三槽 schema + 身份校验 ③/④ + 与被测重合明示）· §2.2-7 · §9 | `judge.5` / `judge.12` |
| §1.10 D2 | 分歧处置确定性（第三判仲裁 · 多数决 · 禁悬空） | §2.10.1（并行裁定 + 合成规则表）· §2.11（复核单判裁定） | `judge.8` / `judge.9` |
| §1.10 D3 | 失败面 fail-closed（无多数 ⇒ `error`） | §2.10.1 合成规则（末行）· §2.10.4（运行面） | `judge.10` / `judge.11` |
| §1.10 D4 | 元数据逐位入档 + 任一位换 ⇒ `SUITE_VERSION + 1` | §2.10.6 · §2.10.3 冻结绑定 · §1.3-2 变更规则 | `judge.1`（扩）+ `suite.test.mjs`（三槽 schema） |
| §1.10 D5 | 分歧率 + 分歧样本入报告 | §2.3（概览分歧率 / 逐维明细 `⇄` / 《判官分歧》小节 / 告警行） | `render.1`（扩） |
| §1.10 D6 | 成本 ×2（分歧 ×3）独立记账 | §2.10.5 · §2.2-10 | `render.1` + `recompute.5` |
| §1.10 D7 | AC-13 新增 + AC-3 / AC-5 射程扩 | 本表 AC-13 / AC-3 / AC-5 行（已落） | —— |
| §1.11 | 逐维明细列题面（题面正本入档 + 呈现与 manual 段对齐） | §2.2-11（`cases[].prompt`）· §2.3（题面行 + 截断口径）· §3（题面采集落 `pipeline.mjs`） | `render.2` + dry-run 产物断言 |
| §1.12 | 历史报告清理口径（当批：v3 = 唯一在档；无历史兼容分支） | §2.2-7/11 · §2.3（无旧档分支）· §5.12（历史档去注记随档清理）· §3 `bench/results/` 现状 0 对 | ——（文档面收正；v3 对已按 KD-25 出档 ⇒ 在档 = v5 对 · v4 对出档（用户 2026-09-24 16:01 裁定——时点 = v5 落档验收后）） |

**2026-09-24 判官约束放宽批（`2026-09-24-judge-constraint-relax`）AC 回指**（需求面 = `docs/batches/2026-09-24-judge-constraint-relax.md` §1.4；用户 2026-09-24 03:15–03:18 裁定）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | `judge.json` 三槽任一位 ∈ 被测集合 ⇒ **正常启动 + 跑完**（不拒跑） | §2.10.3（与被测重合明示 · 无拒跑闸）· §5.13 `judge.5` | `judge.5`（`--dry-run` 全链路：退出码 0 + 报告判官行标注 + `warnings` 逐重合位各一条） |
| AC-2 | A=B / 仲裁员 ∈ {A, B} ⇒ 仍拒跑（身份违约保留） | §2.10.3 身份校验 ③/④ · §2.10.4 启动面 | `judge.12` |
| AC-3 | 测试全绿（`node --test "bench/test/*.test.mjs"`） | ——（实施面） | 该命令读数（实施轮记批次档 §5） |
| AC-4 | README / 设计档表述与实现一致（无「∈ 被测 ⇒ 拒跑」残留） | §2.10.3 / §2.10.4 / §5.13 `judge.5` / §9 · `bench/README.md` | 活面残留串扫描（`∈ 本次被测集合` 后接拒跑（否定式「不拒跑」不计）/ `独立性违约` / `独立于被测` / `独立性约束`——§1–§9 正文 + README 零命中（本词表行自身不计）；变更记录 = 记录面不扫）+ 人工对读 |

**v3 重跑口径（AC-7 判定方式）**：实施轮跑一次真实 v3（`--label flash-compare-v3`）→ 报告对入库 `bench/results/`（**当批唯一在档**——历史报告已按用户裁定清理，2026-09-24 · 批次档 §1.12；v3 对已按 KD-25 出档）；**v3 一并涵盖人工 lane 题面修正**（`manual.2` / `manual.3` 去注记——§5.12 行 7/8；一次 bump）。
口径提醒：判据修正的净证据 = 批次档 §1.2 的 POC（5 条词表误判响应 → 判官 5/5 判准）；跨版本不严格可比（§1.3 变更规则）——历史报告已清理，「跨版本并列对照」面撤销（§1.12）。

**2026-09-24 判据修复批（`2026-09-24-judge-reversal-fix`）AC 回指**（需求面 = `docs/batches/2026-09-24-judge-reversal-fix.md` §1.4 / §1.5；用户 2026-09-24 04:26–04:34 裁定）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | `instructions.1` / `.2` 按新分界重划（解释类条 ⇒ 判官；字面 / 计数条留机械——逐条裁定） | §2.10.2（原则 + 分层表两行）· §2.6（件删除）· §5.5 / §5.11（rubric / mechRubric 正本）· KD-23 | `judge.13`（缺陷形态串 + 桩判官两态 + 短路——case 级 + dry-run 全链路）+ `text.1`（三 kind 已删 + 未知名 fail-closed）；重划裁定逐条在册（批次档 §2.3） |
| AC-2 | 全用例族同口径排查：凡「解释类机械判」逐条处置在册 | §2.10.2（机械面 = 零解释类）· §2.6（分层面扫描）· 批次档 §2.4 扫描表 | `suite.test.mjs` 分层冻结（13 / 20 / 8 / 5）+ 扫描表逐条在册（25 例逐条 + 族成员逐条） |
| AC-3 | 翻案承接机制（判据修复必修：产出-承接-销账闭环；自动边界 = 产出机器化 · 销账人工确认） | §2.12（机制三段）· §2.11 处置 / 运行提示 · §2.3 · KD-24 | `review.4`（承接段渲染 + 控制台提示；0 翻案 ⇒ 无承接段）+ 台账条目形态（承接 / 核销 = 人工确认——构造上不可机检，如实登记） |
| AC-4 | 测试全绿 + `SUITE_VERSION + 1` + 重跑落档 | §3 本批表 · §2.10.3 冻结绑定 · §9 | `node --test "bench/test/*.test.mjs"` 全绿；`SUITE_VERSION = 4` ∧ `judge.json.frozenAtSuiteVersion = 4`（`suite.test.mjs` / `judge.4`）；重跑（`--models deepseek-flash,mimo-v2.6-flash,glm-5.3-flash,qwen3.8-flash --label flash-compare-v4`）报告对入库 + 读数入批次档 §5（`suiteVersion = 4` · 被测集含 `deepseek-flash`）（本行 = 当批判定记录；2026-09-24 `review-override` 批起同断言的现行值 = 5） |

**2026-09-24 复核改判批（`2026-09-24-review-override`）AC 回指**（需求面 = `docs/batches/2026-09-24-review-override.md` §1.1–§1.4；用户 2026-09-24 11:23 裁定）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 三态：`overturn` ⇒ run 判定 = `pass`（计入通过数）；`uphold` ⇒ fail 维持；复核 `error` ⇒ fail 维持（fail-closed 不变） | §2.11 处置（改判落点 = 编排面）· §2.2-9 · §2.3-6 | dry-run 全链路（夹具确定性）：`tools.3` run = `pass` ∧ `aggregate.passed` = 23/25（改判计入）；`longctx.2`（uphold）= `fail`；夹具注入 `review.verdict = "error"` ⇒ run 保持 `fail`；`review.1/2/3` |
| AC-2 | 渲染：`✅`（矩阵 / 逐维明细 / 合计）+ `⟲` 标注保留（图例语义收正 = 经复核纠正 · 原机械 fail） | §2.3（骨架三处）· §2.3-6 · §2.11 呈现 | `review.2` / `render.1`：dry-run 产物 `✅ pass 1/1 ⟲` · 矩阵 `4/4 ⟲` · 合计 `23/25` · 脚注 / 图例含「经复核纠正」；夹具版 = `✅ pass 1/1 ⟲` · `3/6`；`review.5`：混合面翻案 ⇒ 「判官面未裁决」标注在位（明细复核行 / 《复核翻案》逐条 / 图例）+ 纯机械面翻案不携该标注（反例控制） |
| AC-3 | 承接机制保留（翻案 ⇒ 承接清单照旧产出——结构不动） | §2.12（零结构改）· §2.11 运行提示 | `review.4`（承接段 + 控制台提示）不回归 |
| AC-4 | 测试全绿 + `SUITE_VERSION` 4 → 5 + v4 报告标注口径（不重跑） | §3 本批表 · §1.3-2 · §2.2-7（在档注） | `node --test "bench/test/*.test.mjs"` 全绿；`SUITE_VERSION = 5` ∧ `frozenAtSuiteVersion = 5`（`suite.test.mjs` / `judge.4`）；v4 对保留在档（判定面等价）+ 标注住 §3 `bench/results/` 行（产物零改） |

**2026-09-24 报告成本表收正批（`2026-09-24-report-cost-table`）AC 回指**（需求面 = `docs/batches/2026-09-24-report-cost-table.md` §1.1–§1.5；用户 2026-09-24 12:41 / 12:43 / 12:45 指令——§1.5 修正：评估机制开销整体退出成本面）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 成本表列集 = {模型 · 总成本 · 每任务成本 · 每通过任务成本 · 相对成本}（判官 + 复核两列均消失）；脚注同步收正 | §2.3 骨架（成本表行）· §2.10.5 报告行 · §3 表 `report-tables.mjs` 行 · KD-29 | `render.3`（五列表头精确串 + 定域反例 + 脚注句）+ `render.1`（表头断言串收正） |
| AC-2 | 账目面零改（**JSON 字段零改**——`reviewCostCny` / `judgeCostCny` 等照记）+ 相对成本归一化零改 | §2.2-10（字段面零改 + md 零展示）· §2.3 骨架（概览分账句）· §2.10.5 账目面 · §2.11 成本 | `render.3`（JSON 反控：字段与数值照旧）+ `recompute.5`（逐位 / 合计随价重算照旧）+ `render.1`（相对成本基准不含评估开销） |
| AC-3 | 全绿（渲染断言同步）+ 版本口径按设计轮结论落地（含在档报告标注） | §1.3-4（呈现面不 bump · KD-27）· §3 表（在档形态注 + `--recompute` 指针 · `cases/index.mjs` · `judge.json` 零改行） | `node --test "bench/test/*.test.mjs"` 全绿；`SUITE_VERSION` / `frozenAtSuiteVersion` 断言零改；`bench/results/` 在档对 **json 零 diff**（md 已按现行形态重出——2026-09-24） |
| AC-4 | **用时表**（§1.4）：累计耗时（Σ `runs[].metrics.totalMs` · 不含判官 / 复核）+ 相对倍率（÷ 最低者 = 1×）+ 排名（升序） | §2.3 骨架（用时表行）· §2.3-7（用时聚合）· KD-28 · §3 表 `report-time.mjs` 行 | `render.4`（Σ 定域反例：判官 / 复核 `calls[].totalMs` 不计入 · 倍率 · 并列顺延 · null 脚注 · 轴门控）+ dry-run 全链路产物断言 |
| AC-5 | **md 报告的评估开销金额亦收**（成本表 / 概览账目句 / 判官行逐位）；**分账原则句保留**（不列数字）；复核次数等评估统计按「评估开销不进成本面」统一处置 | §2.3 骨架（概览行 + 成本表行）· §2.10.5 · §2.11 成本 / 呈现 · KD-29 | `render.3`（md 零金额：概览判官行零「成本 ¥」· 全 md 零「判官成本」/「复核成本」金额串 + 统计在位：判官行「调用 N 次」· 分歧率 · 告警行复核计数） |

（AC-4 / AC-5 = §1.4 / §1.5 追加面在设计侧的机判判据；**需求面 AC 条目与编号的补录 = 主 agent 动作**——设计侧只回指，不改 §1（§1 笔 = 主 agent）。）

**2026-09-24 失败耗时计入批（`2026-09-24-error-duration`）AC 回指**（需求面 = `docs/batches/2026-09-24-error-duration.md` §1.1–§1.3；用户 2026-09-24 13:26 指令）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 失败调用（超时 / 接口错）在 `calls[]` 落盘 `totalMs`（发起 → 失败墙钟；`ttftMs` / `tokens` 照旧 `null`） | §1.3-3（计时口径 · 失败照记）· §2.2-2 / §2.2-3 · KD-30 · §3 表 `client.mjs` 行 | `timing.1`（① 超时腿 ≥ 阈值 + ② 接口错腿 + ③ 成功对照腿 + ④ 部分未记录腿 + `runMetrics` 聚合腿） |
| AC-2 | 用时表：`error` run 的**已记录**耗时照计（「`null` 不计入」仅对**未记录**）；脚注 / 口径句同步 | §2.3 骨架（用时表行）· §2.3-7 · KD-28 ② · KD-30 · §3 表 `report-time.mjs` 行 | `render.4`（扩 ⑦ + ⑧：口径行两短语 + **全部 call 已记录**的 `error` run 照计且不入脚注——对 null 腿反例控制；⑧ = 部分未记录腿按已记录之和入累计 + 入脚注；既有 Σ 定域 / 倍率 / 排名 / 采样腿不回归） |
| AC-3 | 全绿 + 既有成功路径读数零改（成功路径回归零差异） | §3 表（`client.mjs` 仅失败分支 · `metrics.mjs` 公式零改 · 记录式与成功路径同源） | `node --test "bench/test/*.test.mjs"` 全绿（`timing.1` 成功对照腿 + dry-run 全链路读数零差——dry-run 夹具无模型调用失败 ⇒ 产物读数逐字同前） |
| 裁定 5（版本口径） | 记录面补全 vs 口径变更 = 设计轮给结论（倾向不 bump） | §1.3-4（版本轴判入 = 规则层）· KD-30 | **结论 = 不 bump**：`SUITE_VERSION` 恒 5 ∧ `judge.json.frozenAtSuiteVersion` 恒 5（`suite.test.mjs:32` / `judge.4` 断言零改）；§3 表 `bench/cases/index.mjs` · `bench/judge.json` **±0** 行 |
（`bench/README.md` 用时表条口径句（`:117`）收正 = 本批实施面（字面要求 = 两短语「error run 已记录耗时照计」·「`null` = 未记录」——同 AC-2 口径行）；**本批验收含该行人工对读**（两短语在位——读数入批次档 §5 / §6）。）

**2026-09-24 名单扩容批（`2026-09-24-bench-roster-expand`）AC 回指**（需求面 = `docs/batches/2026-09-24-bench-roster-expand.md` §1.1–§1.11；用户 2026-09-24 14:35–14:44 连续追加 + 「开」定音 + 14:57 / 14:58 裁定）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 29 档解析（`--models` 逐名在册） | §2.4（清单 = 数据档）· §3 本批表 `bench/models.json` 行 | `roster.1`（29 条 + 逐名解析）+ dry-run `--models` 全名 |
| AC-2 | 价格能录尽录 + 缺价如实（不编价） | §2.5（schema / 取值纪律零改）· §3 本批表 `bench/prices.json` 行 | `roster.3`（键命中自身 + 无孤儿）+ 逐条 source / asOf 对读（批次档 §5 取证记录） |
| AC-3 | kimi 温度结论与腿 | §1.3（温度例外条）· §2.1-4 · §2.2-12 · §2.3（披露句）· §2.4（`temperature` 字段）· KD-31 | `roster.2`（schema）+ `temperature.1`（透传）+ `render.5`（披露句） |
| AC-4 | 测试全绿 | ——（实施面） | `node --test "bench/test/*.test.mjs"`（读数入批次档 §5） |
| AC-5 | 29 档复现命令在档 | 批次档 §2.1（复现命令）· §3 本批表 `bench/README.md` 行 | 命令在档 + README 名单注（人工对读） |
| AC-6 | 版本口径 = 不 bump | §1.3（温度 = 运行参数面 · KD-31） | `SUITE_VERSION` / `frozenAtSuiteVersion` 断言零改（恒 5） |

**2026-09-24 bench v5 批（`2026-09-24-bench-v5`）AC 回指**（需求面 = `docs/batches/2026-09-24-bench-v5.md` §1.1–§1.5；用户 2026-09-24 15:50「走」+ 15:45 供火山方舟定价页 + 16:01 v4 出档裁定）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | ark 价格收尾落盘（lite 录入 · turbo 缓存价补录 · pro 来源句升级）⇒ **在册 29 键全价**；缺价路径保留不变 | §2.5（schema / 取值纪律零改）· §3 本批表 `bench/prices.json` 行 · KD-6 | `roster.3`（无孤儿 + 已录价键 `matchPrice` 命中自身）+ 现盘计数（`bench/models.json` 29 键 ↔ `bench/prices.json` 29 条目 · 零缺键）+ 逐条 `source` / `asOf` 对读（读数入批次档 §5） |
| AC-2 | 缺价腿校准后测试全绿（预期入 §2 · 实测入 §5） | §5.13 `render.1`（缺价腿 = 合成键）· §3 本批表 `bench/test/report-render.test.mjs` 行 | `render.1` 三条断言（位级成本 `null` · 位级缺价警告在位 · md 零评估开销金额）+ `node --test "bench/test/*.test.mjs"` 全绿 |
| AC-3 | 跑批命令与产物名在档 · **可跑准备就绪**（点火 = 用户点名） | §2.1-6（结果对落 `bench/results/`）· §2.7 全量复跑 · §3 本批表 `bench/results/` 行 | 命令 = `node bench/run.mjs --label roster-29-v5`（缺省 = 清单全量 29 档 · 28 项/档 ≈ 812 run）；就绪三检 = 全价 ∧ 测试全绿 ∧ provider 覆盖（29 档 provider ∈ 用户 config——`bench/lib/pipeline.mjs` 缺即拒跑）+ 判官三槽冻结 5；产物 = `bench/results/<运行日>-roster-29-v5.{md,json}`（同名拒写——KD-10） |
| AC-4 | §2 条目表逐条对到落点与判定方式 | 批次档 §2（与本表同源） | 本表三列逐条对读（AC ↔ 设计落点 ↔ 判定方式） |
| AC-5 | v4 对出档 + `bench/README.md` 零 `flash-compare-v4` 死指针 + **同一提交**（时点 = v5 落档验收后——批次档 §1.5） | §2.2-7 / §2.2-11（在档注）· §3 本批表 `bench/results/` / `bench/README.md` 行 · §7-12 · §9 | v4 对（`flash-compare-v4`）删除 + `bench/README.md` `:29-32` 收正（同一提交）；验收 = `git status` 零残留 · `bench/results/` 只剩 v5 对（清理之后判定）· `flash-compare-v4` 零命中（读数入批次档 §5 / §6） |

**2026-09-24 参数口径与判官面收正批（`2026-09-24-bench-params-judge`）条目回指**（需求面 = 批次档 §1.1–§1.20；用户 2026-09-24 18:19 / 18:20 / 18:43 / 18:44 / 18:48 / 22:37 / 22:48 / 22:51 / 22:5x / 22:58 + 2026-09-25 00:22；台账 #263–#269 + #271–#274 + #276）：

| # | 条目（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| 264 | qwen3.8-max 整档 error 根因（config effort 越枚举）+ 修法落点 | §2.1-4（档位覆写优先于 config 原值）· §2.4（`reasoningEffort` 字段）· §2.13（枚举面机检）· KD-32 | `roster.4`（该档覆写值 = `medium` ∈ `{xhigh, medium, low}`）+ 预检枚举面零阻断 + dry-run 全链路 + v6 实跑读数 |
| 268 | 测试口径：思考强度统一中档（逐档可译 / 无生效面档如山标 / 代际标注） | §1.3（中档口径条）· §2.1-4 · §2.4 · KD-32 | `roster.2`（schema 腿）+ `roster.4`（29 档逐档对读映射值）+ 全档实弹预演读数在册（批次档 §1.5 · 29/29） |
| 265 | 判官 B 换代（≠ A / C · 更常见主流）+ 存量重判可行性 | §2.10.3（新槽值 + 冻结绑定）· §9（槽位实测 / 候选处置）· §7-5（响应原文不落档）· KD-33 | 现盘 `judge.json` 对读（B = `glm:glm-5.3-flashx`）+ 版本断言改 6 + 服从性单发探针读数（批次档 §1.17） |
| 266 | 跑批前「配置 × spec 参数兼容预检」机制 | §2.13（枚举面 + 实弹面 · 脚本化 · 零落库）· §3 本批表（`bench/lib/params.mjs` / `bench/preflight.mjs`（拟新增））· KD-34 | `preflight.1` 六项对齐腿 + `run.mjs` 启动门拒跑腿（exit 1）+ 实弹面逐档打印读数（不落库） |
| 267 | spec 行补齐：10 档无专行 + 4 档视觉声明 + 尺寸失实面 | `docs/core/design/MODEL-SPECS.md` §13 · §3 本批表（`model-specs.mjs` 行）· KD-36 | 新增锚（建行逐名命中 / 未探词在场 / `multimodal` 分态）承载 = 新载体测试档（拟新增——名实施轮定）+ 主测试档 T-4/A-14 就地改指 |
| 269 | 报告 + 结果 JSON 逐档披露实发参数 | §2.2-13（入档字段）· §2.3（概览逐档参数表 + 规则 9）· KD-35 | `render.6`（在位 / 例外注 / 缺键 / 零金额反控）+ dry-run 产物对读 |
| 263 | 缺价腿两条可选加固（恒真断言弱守卫 · 覆写未随改） | §5.13 `render.1`（四断言形态） | `render.1` 四断言（含表头正控——增补③ 后 = 八列串）+ 全档 `node --test` 全绿 |
| 271 | 速度表双排序（表 A = TTFT 中位升序 / 表 B = tok/s 中位降序（快者在前）· 缺数据居末 · 列集相同 · 标题与注文区分） | §2.3 骨架（速度表 A / B 双行 + 规则 10①）· §5.13 `render.7` | `render.7`（两表 / 行序 / 缺数据居末 / 列集正控 / 注文区分 / 脚注 / 轴门控）+ `report.1` 段清单断言同步（`report-render.test.mjs:106` 增 A / B 双断言） |
| 272 | 能力矩阵加两列（总耗时 = 速度表「总耗时（中位）」同源 · 相对成本 = 成本表同源 · 行序不变 · 缺数据 `—`） | §2.3 骨架（能力矩阵行 + 规则 10②）· §5.13 `render.8` | `render.8`（两列 / 同源对读 / 反例控制 = 与用时表累计不同源 / 缺数据 / 行序不变）+ 既有矩阵断言面同步（`report-render.test.mjs:153` / `:288`——新增列后计数同步） |
| 276 | 报告交叉列（用时表 +2：合计通过数 / 相对成本；成本表 +3：合计通过数 / 累计耗时 / 相对倍率——同源照搬 · 行序不变 · 缺数据 `—`） | §2.3 骨架（用时表 / 成本表两行 + 规则 10④）· §5.13 `render.3` / `render.4`（扩） | `render.3` ⑦⑧⑨⑩ + `render.4` ⑨⑩⑪（表头逐字正控 = 八列 / 七列 · 交叉列同源对读 / 缺数据 `—` / 行序不变 / 轴子集照出值）+ `render.1` 头串同步 |

| 273 | `multiturn.1` 判据修复（v5 承接 ×4 翻案 · 检索步合法 + `send_email` / `to` 存在语义——多次调用 / 重复参数不计缺失或错误） | §5.6 / §5.11（`.1` 正本）· §2.10.2 · §2.6（原语）· KD-37 | 定点复现 `mech.1`（修复前 fail / 修复后 pass + 反例控制 + dry-run 全链路）+ 版本 6（`suite.test.mjs` / `judge.json` 对读） |
| 274 | `multiturn.3` 判据修复（v5 承接 ×1 翻案 · 检索步不计违规 + 锚 = 检索步后跟进 `send_email`（全记录序列）） | §5.6 / §5.11（`.3` 正本）· §2.10.2 · KD-37 | 定点复现 `mech.2`（修复前 fail / 修复后 pass + 反例控制）+ 版本 6 |

**版本轴归因**：`SUITE_VERSION` 5 → 6 的归因 = **判官 B 换代 + 判据修订**（#273 / #274 承接修复——两项均属判分口径面（§1.3-2 / KD-19），**共用一次 5 → 6**）；参数面（档位覆写 / 披露面）**不入版本轴**（KD-32 / KD-35，循 KD-31 先例）。

**2026-09-25 判官替代判批（`2026-09-25-judge-fallback`）AC 回指**（需求面 = 批次档 §1.1 用户裁定（2026-09-25 01:31 · 台账 #282）+ 七裁点 + §1.3 替代池扩员）：

| AC | 判据（需求面） | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 结论必得：判官位失败（超时 / HTTP / 解析）⇒ 换模型补判（级联替代——含替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此的约束） | §1.3-2（判分行收正）· §2.10.1（级联 + 合成规则表）· §2.10.3（替代池 schema + 身份校验）· §2.13（预检射程）· KD-38 | `judge.14` / `judge.15` / `judge.19`（桩传输 / 装载面）+ dry-run 全链路（`longctx.3` 级联修复）+ `preflight.1` 扩腿（池内项受检） |
| AC-2 | 终局口径显式（全级皆失败的物理边界：零有效判 / 分歧未决） | §2.10.4（终局表 + 射程句）· KD-38 | `judge.16`（单判）/ `judge.17` / `judge.18`（两类 error 物理边界） |
| AC-3 | 替代透明可审计（替代位 / 模型 / 原因入档 + 告警分列计数 + 方法段口径句） | §2.2-15/16（记录字段 + 池快照 + 计数）· §2.3（概览替代池行 / 方法句 / 告警行 / 局限 / 逐维明细替代标注）· §2.10.6 · KD-38 | `judge.14`（记录形状）+ `render.9`（渲染面）+ `report-render` 告警串（分列计数） |
| AC-4 | 跑后补判通道（对已落档 error run 收正；命令 / 落档 / 素材面 / vs `--recompute` 分工） | §2.14（机制全项）· §2.1（CLI + 退出码）· §2.7（复跑契约行 + 分档句）· §2.2-17（溯源块）· KD-39 | `rejudge.1`（① ③ ④ ⑤ + 被测侧失败不入列反例 ②） |
| AC-5 | 版本口径（判分机制变化 ⇒ 6 → 7 + `frozenAtSuiteVersion` 同步；池内任一项身份变化同 bump） | §1.3-2（判分行）· §2.10.3 · §2.10.6 · KD-40 | `suite.test.mjs`（7 + 冻结同值 + `fallbacks` schema 腿）+ `judge.test.mjs` 字面传播（四处） |
| AC-6 | 被测侧失败裁明（不受「结论必得」；如实呈现形态） | §2.10.4（射程句）· §2.14（补判列排除）· KD-39 | `rejudge.1` ② 反例腿 + 既有 `judge.7`（error 不触发复核）不回归 |
| AC-7 | 补判档版本归属与可比性标注（v6 档 = 6 不改写 · 补判对 = 现行代际 · 跨代不严格可比） | §2.14（版本归属句）· §2.3（补判产物句）· KD-40 | `rejudge.1` ① ③（新对 `suiteVersion` = 现行代际 + 原档零改） |
| AC-8 | 测试面（新腿在位 + 全绿） | §5.13（`judge.14–18` / `rejudge.1` / `judge.10` / `judge.11` 收正 / 夹具重分配）· §3 本批表 | `node --test "bench/test/*.test.mjs"` 全绿（读数入批次档 §5） |

## 7. 边界（不做）

1. 不做**开放式质量**主观打分（判官只裁 §5.11 冻结 rubric 的语义判定，不做「写得好不好」评分）；不做容器级任务（SWE-bench / Terminal-Bench 型）；不做 MMLU 类广谱知识题。
2. 不自动定时跑（手动触发）；不自动抓取/改写价格（`prices.json` 手动维护，来源必标）。
3. 三端产品码**机制面**零改动（见 §4 KD-1 与 §2.9-⑤——`noUsageStream` 冲突只如实记录）；本批产品树触面 = **规格行 + 测试档三处**——`thincoder-core/model-specs.mjs` 规格行（KD-36 · `MODEL-SPECS.md` §13）+ 测试档三处（`model-specs.test.mjs` 就地改指 / 新载体档（拟新增）/ `core-hygiene.test.mjs` 登记——逐档见 §3 本批表）——**产品码零改**（CLI / VSC 代码零改，行为随核单源传导）。
4. 不进 CI / 发布门 / 三端产物白名单；`bench/test/` 手动跑。
5. 不判分人工 lane；不存模型完整原始响应（只存截断摘要 ≤300 字符；全文落盘 = V2 候选）。
6. 不做跨时点 diff 工具（两份报告对并列人工比对即可——§1.8 口径）；不做汇率换算；不做统计显著性检验。
7. 不改题面以适配某模型；改题一律走 `SUITE_VERSION + 1`。
8. 复核翻案**改判 `pass`**（§2.11 用户 2026-09-24 11:23 裁定）并加 `⟲` 标注（经复核纠正 · 原机械 fail）；**判官对的同向误判不设外部复核**（分歧样本已由第三判仲裁——第三判是决策内的一票，不是对判官对的第二只眼）；复核保持单判（§2.11 判位数裁定 · KD-26）；翻案处置 = **承接机制**（§2.12——改判与修判据并行：报告承接清单 + 台账承接 + 人工核销；不建独立清单档）；不设「未处置翻案 ⇒ 拒跑」跑前门（处置状态住台账 ⇒ 构造上读不到）。
9. 判官输入不喂对话历史 / 图像（§4 KD-22——rubric 载明事实正本；该回合工具事实随观测并入，§2.10.1）；不做判官对战 / 判官模型横向评测（判官对 A/B + 仲裁 C 为判分机制组成——分歧率是判官对的质量仪表，不是判官之间的比较面）。
10. 用时表射程 = **被测模型**的执行耗时（Σ `runs[].metrics.totalMs`）——不含判官 / 复核调用（评估机制开销）；不做逐用例耗时明细（逐维明细已给单次 `总耗时` 列）；不入《关键发现》（批件射程 = 表内排名与倍率——**只述原批件射程**；#276 交叉列两列系同源照搬，见 §2.3-10④）。
11. **评估开销金额报告零展示**（成本表 / 概览账目句 / 判官行逐位——KD-29）；分账**原则**句保留（不列数字）；评估**统计**（次数类）住判官行 / 告警行 / 《复核翻案》——不另做「评估开销合计」呈现出口（账目只住结果 JSON）。
12. 失败调用只补耗时采集：`calls[].totalMs` = 发起 → 失败墙钟照记（KD-30）——**不做**失败专属呈现（进度行耗时 / 失败率 / 超时读数列）；`tok/s` 与速度表口径零改（失败无 TTFT ⇒ 照旧不入聚合）；判官 / 复核 / 判分机制零改；不重跑在档报告（v4 对出档——用户 2026-09-24 16:01 裁定，时点 = v5 落档验收后）。

13. 温度例外**只对「API 拒收 0」的档**开放（逐档显式 + 探针依据在册——KD-31）；不引入 CLI 全局温度参数；判官面温度冻结零改（三槽恒 0）。
14. 思考强度覆写**只对受测面生效**（`bench/models.json` 档位字段——KD-32）：不改用户 config、不改核层行为；判官 / 复核槽的 effort 面沿 provider 条目原值（本批零改）；覆写值须与受理面对账（预检枚举面 + 实弹面——§2.13）。

15. 判官面替换级联**不做同模型重试**（**任何形态——含放大预算重试**；级内单发 + 预算一次到位（默认 8192——§2.10.1）；核已含 HTTP 级重试；替代级即重试路径——KD-38）；**不做无界级联**（池长即级数上限）；判官 / 复核的**判位数不变**（A / B 双判 + C 仲裁；替代 = 同级替换 ≠ 加位）；替代池**不用于复核面**（复核失败 = fail 维持的既有 fail-closed 零改）。
16. **跑后补判通道**（§2.14）：只覆盖判官面 error run；**不覆盖被测侧失败**（无素材可判——裁点 ⑥）；**不覆盖原档**（落新对 · 收编 = 人工点名）；**不自动触发**（点名执行）；不承诺突破物理边界（重取后仍失败 ⇒ 如实 `error`）。
17. `--recompute` 的零网络结构保证不因本批收窄（补判为独立触网分支——两分支互斥分档）；不引入判官面自动重跑 / 自动补判的后台机制。

## 8. UI / 交互决策

无 GUI 面。交互契约（全部已在 §2.1 落定，无遗留项）：

1. 进度输出：stdout 逐例一行（`[序号/总数] <模型> <用例 id> → pass/fail/error | ttft tok/s`）；结尾摘要为**控制台版**（报告对才是留档；控制台不出完整报告）。
2. 出错可读：未知模型 / provider 缺配置 / schema 拒载 → 单行明确错误 + 退出码 1（列出可选项）。
3. 中断：SIGINT → 中止在飞调用、不落档、退出码 130。
4. `open` 项：**0 条**——§1.5 射程读法已按**整面**落（判官行逐位金额一并收——§2.10.5 / KD-29）；批档 §1.6 #1 裁定：**维持整面 · 无回退**。（初始清单的 `provider` 名与模型 ID 以现场 config 对齐——见 §9，属实施轮数据核对，非设计未决项。）
5. 跑前预检：`bench/preflight.mjs`（拟新增）——枚举面缺省跑（零网络 · 有阻断 ⇒ exit 1 逐条点名）；实弹面 `--live` 点名执行（1 发/档）；读数入控制台（零落库——§2.13）。
6. 判官替代与补判的运行可见性：替代级启用 ⇒ 控制台即时一行（`[bench] 判官替代：<模型> <用例> <位> → <provider:model>（原因）`）；级链穷尽 ⇒ 沿用「判官不可用」行（§2.10.4）；`--rejudge` 完成 ⇒ 打印「补判 N 例（was → now）+ 新报告对路径」；无对象 ⇒ 明示一行 + 退出码 0。

## 9. 初始清单与价格初值（数据提案 · 供实施轮落档）

> 现行受测名单 = `bench/models.json`（数据单源；2026-09-24 名单扩容批后 = **29 档**；**preview 档不入名单**——通用原则，用户 2026-09-24 14:58）。

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


**`judge.json` 现行值（判官对 + 分歧仲裁 C + 替代池 · 已实现 · 本批替代判级联后）**：

```json
{ "version": 1, "frozenAtSuiteVersion": 7,
  "judges": [
    { "provider": "deepseek", "model": "deepseek-flash", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "glm", "model": "glm-5.3-flashx", "maxTokens": 8192, "timeoutSec": 30 }],
  "arbiter": { "provider": "deepseek", "model": "deepseek-v4-pro", "maxTokens": 8192, "timeoutSec": 30 },
  "fallbacks": [
    { "provider": "mimo", "model": "mimo-v2.6-pro", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.8-flash", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "mimo", "model": "mimo-v2.6-pro-ultraspeed", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.7-max", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "ark", "model": "doubao-seed-2-1-pro-260915", "maxTokens": 8192, "timeoutSec": 30 },
    { "provider": "qwen", "model": "qwen3.8-27b", "maxTokens": 8192, "timeoutSec": 30 }],
  "note": "A = POC 已验判官（跨渠道）；B = 跨厂商第二视角（2026-09-24 换代——原 tokenhub:hy3）；C = 分歧仲裁（第三方模型）；替代池 = 位级失败时的换模型补判链（2026-09-25 扩员——6 位；三槽 A / B / C 角色不变）。" }
```

**替代池（本批增 · `fallbacks` · 用户 2026-09-25 01:34「要扩……能力强一点，速度快一点，参考 v5 报告数据」+ 01:40 批准 6 位）**：
**三槽角色不变**（A / B / C 继续按原位判定面工作——池 = 位失败时的补判级联，不改变 A / B / C 的正常判定路径）。
**级联序 = 池序**（级链基址 = 级 1 原位槽 · **替代级 k = 池序第 k 项 ⇒ 记档 `level = k+1`**——级号 = 池项固有，不因占用跳过而错位）；定稿序（6 位）= `mimo:mimo-v2.6-pro`（替代级 1——能力王 25/25 · 探针 1.0/4.9/2.3s · 最简洁）
→ `qwen:qwen3.8-flash`（替代级 2——快 + 最便宜 1.9× · 24/25）→ `mimo:mimo-v2.6-pro-ultraspeed`（替代级 3——速度王 358.8 tok/s · 24/25）
→ `qwen:qwen3.7-max`（替代级 4——前轮探针已过）→ `ark:doubao-seed-2-1-pro-260915`（替代级 5——前轮探针已过 · 厂商多样面）→ `qwen:qwen3.8-27b`（替代级 6——小档兜底 · TTFT 323 ms · 23/25 · 探针可解析）。
**准入依据**（探针读数正本 = 批次档 §1.3，2026-09-25 01:3x 实弹 = 判官 / 复核 / 重材料三模板 · 15 发零超时零解析失败）：探针证据 ∧ config 可得 ∧ 与 A / B / C 及彼此**字面不同**（防复读——含静态校验与运行期跳过）∧ 替代不静默（入档 + 告警分列）。
**排除（本批）**：`qwen:qwen3.6-plus`（探针 26.8s 逼近 30s 预算 + 输出冗长——与 v5 B 位死因同构）· `qwen3.6-flash` / `qwen3.7-flash`（严格 JSON 1/3 · 0/3）· kimi 族（拒 `temperature: 0`）· `hy3`（退役）· minimax（JSON 复读不可用）· `glm:glm-5.3`（复核模板探针未过）。
**池面纪律**：池内任一项身份变化 ⇒ `SUITE_VERSION + 1`（判官身份面——§2.10.6）；池长即级数上限（调整 = 改数据档 + bump——不另设人工截断）。

**B 位换代（本批 KD-33 · 用户 2026-09-24 18:19「判官不要再用hy3，回头换一个更常见的模型」）**：B `tokenhub:hy3` → **`glm:glm-5.3-flashx`**（原选 `glm:glm-5.3` 经 U2 探针退候选——用户 2026-09-25 00:3x 点名终选，见下「B 位换代实测」）；换代 ⇒ **`SUITE_VERSION` 5 → 6** + `frozenAtSuiteVersion` 同步（§2.10.3 冻结绑定 · 机检闸）——四条版本轴中「判分」代际由此标注。

**换代动因（实录）**：v5 全量跑批中 B 位于 `multiturn.1` **系统性超时**（读数时点运行至 ≈380/770：≥6 例 · 跨 6 档模型——判官不可用（有效判未足）⇒ 该 run `error`；读数 = `.thincoder/tmp/bench-v5-run.log`）——长素材面 × 30s 预算下 B 位可靠性不足。

**槽位实测（2026-09-24 实施轮——原初值 A `deepseek:deepseek-flash` / B `minimax:MiniMax-M3` / C `kimi:kimi-k3`，后两槽实测不可用）**：`minimax:MiniMax-M3` 输出 = JSON 对象整段重复两遍（严格解析不可用——不可判输出）；
`kimi:kimi-k3` API 400「invalid temperature: only 1 is allowed for this model」⇒ 与「判官 temperature 冻结 0」不相容 ⇒ 换 **B = `tokenhub:hy3`** + **C = `deepseek:deepseek-v4-pro`**（均服从实测——单发严格解析过、attempts=1；命令与探测记录见批次档 §5）。
**B 位换代实测（本批 · 2026-09-24/25 · 槽位探针 `judge-slot-probe` 族）**：**原选 `glm:glm-5.3` 未过**——判官模板 ✓ 2.9s · 复核模板**系统性超时**（30s ×3 连测 + 90s 预算 ×2 尝试 158s 均不过）⇒ 按 KD-33「未过 ⇒ 退候选」退候选实弹：`qwen:qwen3.7-max` 双过（judge 2.9s / review 18.7s / 重材料 8.7s）· `ark:doubao-seed-2-1-pro-260915` 双过（8.1s / 5.5s / 11.4s）⇒ **备选在案**。
**B 终值（用户 2026-09-25 00:3x 点名「挑一个实测过的、跑得快的模型 glm5.3-flashX」）** = **`glm:glm-5.3-flashx`**（原厂 `glm` 通道 · v5 实测在册 23/25 · TTFT 1038ms / tok/s 136.2）；flashx 探针 = judge ✓ 1.6s · review ✓ 8.8s · 重材料 ⚠ 38.6s · attempts=2（**探针读数如实登记**——当时口径的重发；现行 = 单发 + 预算 8192，§2.10.1）；
参数相容 = `glm` 条目 effort `max` ∈ flashx 枚举 {low, high, max} ✓ ∧ temperature 0 在 `tempRange` [0, 1] 内 ✓ ∧ 实调零 400 ✓。
**成本可读性认账（评审轮 1 #10 · 措辞沿家族）**：B = `glm:glm-5.3-flashx` ∈ `glm` 族——族行带 `noUsageStream`（`thincoder-core/model-specs.mjs:59-74`，flashx = `:68`；§2.9-5）⇒ 该位判官成本账目可能整段 `null`（usage 缺失记 null，不估算——§2.10.5）；判定面不受影响（判定不吃 usage）。

**选型口径（冻结 · 与运行面校验同源）**：① **A ≠ B**、**仲裁员 ≠ A / B**（模型字面——§2.10.3 身份校验）；② 三槽**跨厂商**、与被测**无重合**为**优先姿态**（理想态 = 三家 ⇒ 无 `sameVendorAsTested` 旗标——第二 / 第三视角更干净；**实测槽位** A / C 同渠道（上「槽位实测」段）⇒ 旗标按被测集派生、逐位明示（§2.10.3 三级）；**非约束**：重合（含同位自判）允许——§2.10.3）；③ A 位保留 POC 唯一已验键 `deepseek:deepseek-flash`（判准证据 + 价格已录）；
④ B / C 位 = 跨厂商强模型（第二 / 第三视角最大化——B 位每样本必调（判准服从性 = 首跑即验），C 位仅分歧样本（量小））。
被否候选（原选型轮）：`glm:glm-5.3`（被否：与被测 `glm-5.3-flash` 同家——provider 名不同不触发旗标，但同家判同家削弱第二视角）；`dgx-spark:DeepSeek-V4-Flash-0731`（被否：与 A 位同族）；`kimi-code:k3` / `kimi-entprprise:k3`（被否：与 `kimi:kimi-k3` 同模型异名——机检不可判、实质复读）。

**候选处置（B 换代轮 · 本批 · 判据 = 可得性 / 价格在录 / 服从性证据）**：① `glm:glm-5.3` 原「同家」否决**随被测集扩至 29 档而失效**（各厂商皆在被测面内 ⇒ 同位 / 同渠道为常态 · 03:16 裁定允许自判）⇒ 本批初采纳；**U2 探针复核模板系统性超时未过 ⇒ 退候选**（B 终值 = `glm:glm-5.3-flashx`——见上「B 位换代实测」）；
② `qwen:qwen3.7-max`（原判据「无服从性读数 ⇒ 须先探针（config `qwen` 条目 effort `high` ∈ 该档枚举 {xhigh, high} 方可启送）」——**退候选实弹双过 ⇒ 备选在案**；同位自判同 `glm`）；
③ `ark:doubao-seed-2-1-pro-260915`（原判据「服从性未证」——**退候选实弹双过 ⇒ 备选在案**）；④ `minimax:MiniMax-M3` / `kimi:kimi-k3`（被否：前者 JSON 整段重复、后者拒 `temperature: 0`——实测不可用，见批次档 §5）。
**已知限制（如实登记）**：B / C 位无 POC 判准证据——首跑即验证面（解析服从性差 ⇒ 表现为位级失败率 ⇒ 告警面显影）；同模型异名的机检盲区 = 配置纪律（§2.10.3）。三槽 provider / model 字面实施轮与现场 `~/.thincoder/config.json` 对齐（本批换代后三槽 = `deepseek`×2 + `glm`——三渠道均在用户 config；原 B 位渠道 `tokenhub` 随换代退场）。

**判官与被测重合（运行面 · §2.10.3 · 逐位 · 无拒跑闸）**：判官三槽可与被测重合——**允许自判**（用户 2026-09-24 03:16 裁定；判官不得干预被测选择）；重合位（同位 / 同渠道）逐位明示，**不拒跑**。

v3 重跑（AC-7）实测记档（**v3 对已按 KD-25 出档** · **v4 对出档**（16:01 裁定——时点 = v5 落档验收后）；记录面留存）：被测三模型（`mimo-v2.6-flash` / `glm-5.3-flash` / `qwen3.8-flash`）；判官三槽 = 上「槽位实测」段三值——当批三槽与被测无重合（`sameVendorAsTested` 全 `false`）。**v4 代际差异**：被测集含 `deepseek-flash` ⇒ A 位（`deepseek:deepseek-flash`）同位自判（§2.10.3 三级明示；样参见 §2.2）。

价格面：**在册 29 档 + 判官三槽键全价在录**（时点 = v5 落档验收后——2026-09-24 v5 批收尾：`ark:doubao-seed-2-1-lite-260915` 录入 · `ark:doubao-seed-2-1-turbo-260628` 缓存价补录——判官 A 位 `deepseek:deepseek-flash` 已录 ⇒ 该位成本可入账）；
缺价路径保留（**不完整不录 · 不估不转写**——缺价 ⇒ 成本 `null` + 警告，不阻断运行，§2.10.5；价格表孤儿判据 = 「命中在册条目 **或** 任一位判官键」——§5.13 `roster.3`）。

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
  ③ 复核 §2.11（`uphold` / `overturn`；翻案独立分类、**不自动改判**——2026-09-24 01:08 用户接受父侧倾向（方案 = 父侧））；④ 成本分账（成本表判官 / 复核两列，不入相对成本归一化）；⑤ 元数据入档（`judge` 块 + 逐调用 `at`）；⑥ 降级三级（启动拒跑 / 运行面 error / 全灭退出码 1）；
  ⑦ 题面面修正：自动例补词（`json.2` / `json.3` / `tools.4`）+ **人工 lane 去注记（`manual.2` / `manual.3`——测点注释曾混入题面原样发给被测模型；父侧直接修正，本批 v3 一并重跑）**——共 5 处，§5.12；**题面列口径新增**（逐字 = 实际发送串 · 注记外置）+ 防护（题面全量冻结 28 条 + 注记隔离断言——§5.13 `prompt.1/2`）；⑧ 判据条文正本 §5.11 · 测试承载 §5.13 · AC-1..AC-7 + §1.7 回指（§6）。
- 2026-09-24：**判官双判机制 + 题面入档（批次 `2026-09-24-judge-hybrid` fix 轮 · 用户 01:26 / 01:30 裁定）**——① 判官对 A / B（A≠B 机检 · 各自独立于被测）+ 分歧第三判仲裁 · 多数决；合成无多数 ⇒ run `error`（fail-closed，不补位 / 不单判回退）；
  ② 元数据逐位入档 + 任一位换 ⇒ `SUITE_VERSION + 1`；③ 报告面：概览判官三行 + 分歧率 + 逐维明细 `⇄` 标记 + 《判官分歧》小节；成本 ×2（分歧 ×3）独立记账；
  ④ 复核保持单判（沿 A 位——§2.11 判位数裁定）；⑤ `cases[].prompt` 题面正本入档 + 逐维明细题面行（§1.11）；⑥ KD-15 改写为双判裁定；AC-13 / AC-14 新增 + AC-3 / AC-5 射程扩（§6）；§9 `judge.json` 初值扩三槽。
- 2026-09-24：**历史报告清理收正（用户 01:31「历史报告没意义，都清掉吧」）**——`bench/results/` 历史报告全部清理（v3 = 唯一在档）；全档撤销历史档兼容分支与「不追改」表述（§2.2-7/11 · §2.3 · §5.12 · §5.13 · §6 v3 口径 · §3 `bench/results/` 现状 0 对）。
- 2026-09-24：**判官独立性约束放宽（用户 2026-09-24 03:15–03:18 裁定 · 批次 `2026-09-24-judge-constraint-relax`）**——**判官不得干预被测选择**：删「任一位（A / B / 仲裁 C）∈ 被测集合 ⇒ 拒跑」闸（§2.10.3 / §2.10.4 / §2.1-5 / §9），**允许自判**；
  保留 A≠B · 仲裁员 ≠ A/B 身份机检 + 判官必备 + `frozenAtSuiteVersion` 冻结绑定；重合明示改三级（同位 / 同渠道 / 无重合——报告判官行标注由渲染面从 `models[]` × 判官槽派生，判官块不另存字段）；
  `sameVendorAsTested` 语义不变（渠道级重合）；`judge.5` 断言反转、`judge.12` 保持；**`SUITE_VERSION` 不 bump**（判分口径零变化——被放宽的只是启动准入闸）；AC-3 射程收正 + 本批 AC-1..AC-4 回指（§6）+ 本批受影响文件入 §3。
- 2026-09-24：**设计评审轮 1（changes-required）修正**（批次 `2026-09-24-judge-constraint-relax` 发现表 #1–#6；#7 父侧自办 / #8 Not an issue）：① `warnings` 发射口径单源化 = **逐重合位各一条**（① 同位 / ② 同渠道 两形态文案；③ 无重合零条——§2.10.3 / §3 表 / `judge.5` / AC-1 同步）；
  ② `:794` 落点描述去「独立性约束」+ AC-4 扫描词表扩「独立性约束」（复扫：§1–§9 正文零命中）；③ 判官面「（拟新增）」标记逐处收正为「（已实现）」+ 判官三档现状读数（300 / 26 / 300）+ `bench/results/` 现状（1 对 · v3）；
  ④ 局限模板增「判官可与被测重合（自判轮次无外部对照）」条（§2.3 + §3 表 `report.mjs` 行）；⑤ §2 状态单源 = 段首工具状态行（批次档 §2 收正块）。
- 2026-09-24：**设计评审轮 2（修正验证 · pass）复核收正**（批次 `2026-09-24-judge-constraint-relax` 轮 2 新发现 #9 / #10；父侧直接执行 · 可 revert）：
  ① §5.10 承载档与六行「测试档」列、§5.13 测试策略②、§6 AC-2 的陈旧引用（`report-recompute.test.mjs` 已拆删）收正为拆分后两档（`recompute.test.mjs` / `report-render.test.mjs`）与夹具落点 `bench/test/fixtures.mjs`（§3 判分升级批表对应行补「（已拆删）」标记）；
  ② 批次档 §2.8.2 自述坐标以现文为准（记录面声明——同 §1.15 #7 口径）。
- 2026-09-24：**判据分层重划 + 复核翻案承接机制（批次 `2026-09-24-judge-reversal-fix` · `SUITE_VERSION` 3 → 4）**——① **分界重划**（用户 04:34 裁定）：判定**是否需要「机器解释文本」**——需要解释（段落 / 句 / 拒答 / 追问 / 候选质量……文本结构或语义面）⇒ 判官面；字面 / 计数 / 结构 / 执行 ⇒ 机械面（§2.10.2 原则 + 分层表）；
  `instructions.1` / `.2` 重划为**混合面**（段落 / 句结构移判官面，字面 / 计数留机械——题面零改，判据载明；§5.5 / §5.11）；`paragraphCount` / `sentenceCount` / `hanziPerSentenceMax` 三规则件 + 两解析件删除（零调用者）；
  ② **复核翻案承接机制（§2.12 重写）**：产出机器化（《复核翻案》小节「承接清单」= 渲染面从 `runs[].review` 派生 · 按用例归一；控制台提示行）+ 承接落台账（`tech_todo` · MODEL-BENCH）+ 销账人工确认（关闭证据 = 定点复现用例 + `SUITE_VERSION` +1）；不自动改判 / 不建独立清单档 / 不设跑前门；
  ③ `judge.json.frozenAtSuiteVersion` 4 + 夹具 / 断言同步（分层冻结 13 / 20 / 8 / 5）；④ 用例表补 `judge.13` / `review.4` / `text.1`；⑤ v3 对处置 = 重跑落档后清理（KD-25）。
- 2026-09-24：**设计评审轮 1（changes-required）修正（批次 `2026-09-24-judge-reversal-fix` · 修正轮 eng-designer）**——① 受影响表两档越线降载（#1）：`judge.13` 迁 `bench/test/graders.test.mjs`（`judge.test.mjs` 原 +18 ±6 ⇒ 越线；迁出后 298）；
  题面冻结清单 `FROZEN_PROMPTS` 迁 `bench/test/fixtures.mjs`（`suite.test.mjs` 原 +6 ±3 ⇒ 越线；迁出后 ~270）；表头加读数单源注（#10）；
  ② 计数与清单收正（#2：§1.4 `:57` / `:64` → 13 / 20 / 8 / 5 + `instructions.1` / `.2` 入判官面清单 · §6 落点改指 §2.10.2 计数单源）；§2.2 样例按 v4 口径重写（#3：suiteVersion 4 = frozenAtSuiteVersion 4 · `flash-compare-v4` · 槽位实测值 · A / C 同位与同渠道旗标在场 + warnings 同步）；
  ③ `judge.13` 夹具显式含缺陷形态串（#4：正文 3 段 + `---` + 自检块——修复后 pass（机械面全过 ∧ 桩判官 pass ⇒ run pass）机检化、修复前 fail = 规则删除负断言 + v3 实录；`bench/run.mjs` 两例响应串同改）；归属措辞收正（#5：KD-17 / §2.11 / 变更记录 → 「01:08 用户接受父侧倾向（方案 = 父侧）」）；
  ④ `numEquals` 族按新分界复核（#6）：约束四例（`reasoning.1` / `.2` · `longctx.1` / `.2`）留机械；无约束两例（`tools.3` / `longctx.3`）按「有意判定」登记（出翻案 ⇒ §2.12 承接）——§2.6 扫描句 + 登记段；
  计数句「20 行」→「20 例（14 行）」（#7）；§2.11 不可达分支删除（#8）；v3 指针收正（#9：`:175` / `:180` / `:548` / `:777` / `:814-815` / `:842` / `:863` / `:874` / `:951`——注明出档 / 当批化）；
  ⑤ §9 槽位面两陈旧句收正（`:944` 三家旗标句 · `:947` config 对齐句——随 #3 / #5 同批）；越界项（§5 题面列注记残留）登记不改（不属本批面——批次档 §2 收正块）。
- 2026-09-24：**复核翻案改判（批次 `2026-09-24-review-override` · `SUITE_VERSION` 4 → 5）**——① **判定合成反转**（用户 11:23 裁定）：`overturn` ⇒ run 判 `pass`（计入通过数；改判落点 = 编排面 `pipeline.mjs`）；`uphold` / 复核 `error` = fail 维持（fail-closed 不变）；原机械失败断言留档（`run.detail` + `runs[].review.mechDetail`）；
  ② `⟲` 标注保留 + **语义收正**（经复核纠正 · 原机械 fail）——矩阵 / 逐维明细 / 脚注 / 图例同步；③ **承接机制结构不动**（§2.12——改判与修判据并行：改判不免修）；
  ④ KD-17 改写（改判 + 被否候选反转）+ KD-18 语收正 + **KD-26 新增**（复核改判后仍保持单判）；⑤ **v4 对不重跑**（翻案 0 起 ⇒ 判定面与 v5 等价）——代际标注住 §2.2-7 在档注 / §3 `bench/results/` 行（产物零改）；
  ⑥ §2.2 样例按 v5 口径收正（改判形态 = `verdict: "pass"` + `review.overturn`；`judge` / `review` 二记录分属不同 run——机械 fail 短路不调判官）；⑦ 三端产品树零改动。
- 2026-09-24：**评审修正轮（批次 `2026-09-24-review-override` · 评审轮 1 #1–#7）**——① `⟲` 两形态口径（纯机械面完整纠正 / 混合面「判官面未裁决」标注——判定仍计 `pass`）+ 用例 `review.5` + 夹具 `mixedOverturn` 形态（标注 = 渲染面派生，不新增 JSON 字段）；
  ② §2.2 判官记录样例改挂判官面用例（`reasoning.1` → `vision.1`）+ 样例 `aggregate.total` 按 25 例族对齐（20 → 25）；③ §1.3-2 / KD-2 触发面枚举补「判分合成 / 复核处置」；④ 结构收正（§9 多余闭合围栏删除 / KD-26 接表）；
  ⑤ 实现面增量更新（§3 表：`report-review.mjs` · `report-tables.mjs` · `report.mjs` · `bench/README.md` · `fixtures.mjs` · `report-render.test.mjs`；`bench/cases/index.mjs` 注释枚举同步）。
- 2026-09-24：**复审修正轮（批次 `2026-09-24-review-override` · 复审轮 2 #1–#2）**——① 渲染单源对账（#1）：§2.3 补派生例外句（渲染输入 = 结果 JSON + 当前题集代际的用例声明；与 §2.2-11 `--recompute` 自足面的关系一并说清）· §2.11 括注按实收正（旧代际处置 = KD-25；v4 = 例外在档——翻案 0 起 ⇒ 零暴露）· §2.6 判官面谓词导出落点注明（`JUDGE_FACE` = `bench/cases/index.mjs` 单源导出，渲染面 import 不重建）；
  ② 样例自洽（#2）：§2.2 顶层 `review.costCny` 0.0006 → 0.0007（`calls = 1` ⇒ 合计 = 调用值）+ 样例判读注（`models[]` 节选——顶层 `judge` / `review` = 全参测面汇总、`aggregate.*` = 该模型面）；零新增 JSON 字段 / 记录形状零改。
- 2026-09-24：**用词收正（父侧直接执行 · 可 revert）**——§2.2 判读注「只列一例」→「只列一个模型条目」（消歧：「例」在本档主流用法 = 用例）。
- 2026-09-24：**报告呈现面收正（批次 `2026-09-24-report-cost-table` · 用户 12:41 / 12:43 / 12:45 指令）**——① **评估机制开销整体退出成本面**：成本表列集 = **五列**（删判官成本 + 复核成本两列）；**md 报告零展示评估开销金额**（成本表 / 概览账目句 / 判官行逐位三处——含「已录价位之和」口径句）；分账**原则**句保留（不列数字）；评估**统计**（调用次数 / 分歧率 / 仲裁 / 复核次数 / 翻案 / 复核失败）住非成本面（判官行 / 告警行 / 《复核翻案》）；**JSON 字段零改**（金额只住结果 JSON——账目面）；
  ② 新增**用时表**（Σ `runs[].metrics.totalMs` + 相对倍率（最低 = 1.0×）+ 排名（升序 · 同值并列顺延）· 落位速度表后 · 轴门控 `speed` · 不含判官 / 复核调用；聚合规则 §2.3-7）；③ **版本口径（KD-27）：两项均属呈现面 ⇒ 不 bump**（`SUITE_VERSION` 恒 5 · `judge.json` 零改）；在档 v4 对产物零改 + 形态注（现行形态 = `--recompute`）；④ 新增档 `bench/lib/report-time.mjs` / `bench/test/report-present.test.mjs`（越线降载）；⑤ 入库 `render.3` / `render.4` 用例 + `render.1` 断言收正；⑥ KD-27（呈现面不入版本轴）/ KD-28（用时表口径）/ KD-29（评估开销金额零展示）新增；⑦ 三端产品树零改动。
- 2026-09-24：**在档 v4 报告按现行呈现形态重出**（用户 13:20 点名——同一结果 JSON 重渲染 · 成本按当前 prices.json 重算 · 数字面零改——**重出非重跑**；原「不重渲染」裁定由用户指令覆盖；报告内「形态重出注」在册）。
- 2026-09-24：**评审修正轮（批次 `2026-09-24-report-cost-table` · 评审轮 1 #1–#6）**——① 成本表脚注定为**单一字符串**（§2.3 骨架 + §2.3-8）：「评估开销（判官 / 复核）不进被测成本、不参与相对成本归一化——报告不列评估开销金额；账目见结果 JSON」——与 `render.3` ②③ 断言逐字对齐（含「不参与相对成本归一化」字面；不含 `判官成本` / `复核成本` / 「两列」字面 ⇒ 互斥消除）、`render.3` ③ 加冻结字符串指针；
  ② §2.3-7 补「采样 run 数」口径（= 参与累计的 run 数 · 含 `error` · 排除 `skipped` / `totalMs = null`）+ `render.4` 增该列 null / `skipped` 腿断言（原 ⑤ 顺延 ⑥）；③ KD-2 bump 枚举补「结果数值构成规则」+ §1.3-4 注明**版本轴枚举单源 = 本行**（KD-2 / 方法行版本句 / `bench/cases/index.mjs` 注释 / README 版本口径行的字面欠列处按本行判读——字面同步未随本批）；④ §8 `open` 条收正为「0 条——已按整面落 · 已裁定无回退」+ KD-29 被否候选 ① 的 §8 回退指针删除；⑤ 评审 #4 由父侧就地收正（AC-1 五列）· #5 行数口径差以实施读数入批档 §5。
- 2026-09-24：**失败调用耗时记录并计入用时表（批次 `2026-09-24-error-duration` · 用户 13:26 指令「报错你就不算？时间呢？算进去了吗？」）**——① **采集面补全**：`runCase` 失败分支原硬编码 `totalMs: null` ⇒ 改为**发起 → 失败墙钟**（观测点 = `client.mjs` 调用侧；`ttftMs` / `tokens` 照实缺 `null`）；
  ② 用时表口径句收正：**`null` = 未记录**（仅未记录不计入）+ 脚注「未记录」定性——`error` run 已记录耗时照计（既有规则零改）；③ **版本口径：不 bump**（记录面补全 ≠ 口径变化——版本轴判入 = 规则层，§1.3-4）；
  ④ v4 追溯 = **在档保持**（不重跑 · 不重出——其脚注已明示 1 个 run 未参与累计）；实核：v4 三次 `error` 中两次（mimo / glm `multiturn.1` = 判官面失败）耗时**已记录照计**，缺口只在被测调用失败路径（qwen `instructions.3` 超时）；
  ⑤ `timing.1` 用例新增（`bench/test/timing.test.mjs`）+ `render.4` 扩 + KD-30 新增（被否：传输面自报耗时 / 失败按 0 计 / 另立字段 / bump / 重跑补录）+ §7 边界第 12 条；⑥ 三端产品树零改动；
   ⑦ **评审修正轮（评审轮 1 · #1–#6 逐号处置）**：部分未记录分支钉死（§2.3-7——按已记录之和（下界）入累计 + 该 run 入脚注注明「部分 call 未记录」；腿 = `timing.1` ④ / `render.4` ⑧）；§2.3-7 括注末句改显式指称（新档 `error` run 不按「未记录」处置）；
   骨架用时表行写入口径行两短语（`render.4` ⑦ 字面同源）；受影响表同步：`bench/README.md` 行写实为实施面（两短语字面 + 验收人工对读）· `bench/lib/report-time.mjs` 行预期增量 +3 ±2 · 两测试档行补腿 · §3 本批表 `docs/core/design/MODEL-BENCH.md` 行注本批前读数。
- 2026-09-24：**复审修正轮（复审轮 2 · #1–#3 逐号处置 · 本条目 = 父侧直接执行补记 · 可 revert）**——① 交叉态优先级钉死（§2.3-7 `:239` 补「本分支独立于 run 判定（`error` / `fail` 同规则）：部分未记录 ⇒ 入脚注」；`render.4` ⑦ 限定写实「**全部 call 已记录**的 `error` run ⇒ 不入脚注」+ ⑧ 注明判定类型不受限）；
  ② 批档 §2.8 镜像承接（单源声明 + 六行承接表——批档 `:162-179`）；③ §6 AC-1 / AC-2 判定方式补 ④ / ⑧（`:1002` / `:1003`）。
- 2026-09-24：**受测名单扩容（批次 `2026-09-24-bench-roster-expand` · 用户 14:35–14:44 连续追加 + 「开」定音）**——① 名单 6 → **29 档**（24 新增 − 1：deepseek-v4-pro / glm 三档 / qwen 九档 / kimi 四档 / minimax 两档 / doubao 三档〔`doubao-seed-2-0-code-preview-260215` 按用户 2026-09-24 14:57 裁定排除〕/ hy3；provider 映射按渠道实测——glm 三档走 `glm` 原厂（`zhipu-plan` 实测无 flashx 权限）；无视觉位档 `skipDims: ["vision"]`）；
  ② **模型级温度例外（KD-31）**：kimi 四档被测面实测拒 `temperature: 0`（400「only 1 is allowed」）⇒ `models.json.temperature = 1` + `pipeline` 透传 + `models[].temperature` 入档 + 概览派生披露句；版本口径 = **不 bump**（运行参数面）；③ 价格补录 22 候选（逐条官方定价页取证 `source` + `asOf`；取不到 ⇒ 缺价如实）；④ 测试面：新增 `bench/test/roster.test.mjs`（数据面二测自 `suite.test.mjs` 迁入 + `roster.1–3` / `temperature.1`）+ `report-present.test.mjs` 增 `render.5`；⑤ §1.3 / §2.1-4 / §2.2-12 / §2.3 / §2.4 / §3 / §4 KD-31 / §5.13 / §6 / §7-13 / §9 指针 就地更新；⑥ 三端产品树零改动。
- 2026-09-24：**评审修正轮（批次 `2026-09-24-bench-roster-expand` · 评审轮 1 #3–#7 逐号处置 + 用户 14:57 / 14:58 裁定并入）**——① §2.4 models.json 样例补 `temperature` 形（缺省省略 + 例外档示例）；② §5.13 分档句补 `bench/test/report-present.test.mjs`（呈现面）/ `bench/test/roster.test.mjs`（数据面）；③ §3 本档行控点对齐（1138 本批前读数 + 就地更新后读数）+ `bench/cases/index.mjs` · `judge.json` 现状数按实读收正（→ 66 · 25）；④ `render.5` 增旧档缺字段腿（缺字段 ≡ 全 0——`??` 缺省语义，§2.2-12）；⑤ **名单 30 → 29 档**（`doubao-seed-2-0-code-preview-260215` 按用户 2026-09-24 14:57 裁定排除）；价格候选 23 → 22；§3 表 / §5.13 `roster.1` / §6 AC-1 · AC-5 / §9 名单注 / 变更记录同步；⑥ 探针结论逐档在册（批次档 §2.2）。
- 2026-09-24：**bench v5 批（`2026-09-24-bench-v5`）——ark 价格收尾 + 缺价腿校准 + 全量跑批在档 + v4 对出档**：
  ① **ark 价格收尾**（逐条字面 = 批次档 §2.2）：`ark:doubao-seed-2-1-lite-260915` 录入（0.80 / 2.70 / 缓存 0.16）· `ark:doubao-seed-2-1-turbo-260628` 缓存价补 0.60 · `ark:doubao-seed-2-1-pro-260915` 来源句升级（值 6 / 30 / 1.2 零改）——三条同源 = 火山方舟「模型价格」页（用户供页实读 · `asOf` 2026-09-24）⇒ **在册 29 键全价**；表级 `asOf` 不动（条目级覆盖，§2.5）；
  ② **缺价腿校准**（§5.13 `render.1`）：腿键改**合成键** `fixture:unpriced-model`（不取现盘缺价档——价格补录不连带改测试；断言语义零改）；
  ③ **全量跑批在档**（命令 `node bench/run.mjs --label roster-29-v5` · 缺省 = 清单全量 29 档 · 28 项/档 ≈ 812 run）：产物 = `bench/results/<运行日>-roster-29-v5.{md,json}` 入库；**点火 = 用户点名**（§3 本批表 `bench/results/` 行 · §6 AC-3）；**v4 对出档**（用户 16:01 裁定——时点 = v5 落档验收后）——在档面全档扫齐（§2.2-7/11 · §2.3 · §2.11 · §3 · §6 · §7-12 · §9）；
  ④ **一致性面收正**：§2.10.5 孤儿判据指针 → `bench/test/roster.test.mjs`（`roster.3`）+ 变更记录三处相对路径补 `bench/` 前缀（doc-check 悬空锚 11 → 8）+ §9 价格面补录指令句收正；
  ⑤ 版本口径 = **不 bump**（价格 / 名单数据面——KD-2 / KD-31）；⑥ 三端产品树零改动。
- 2026-09-24：**评审修正轮（批次 `2026-09-24-bench-v5` · 评审轮 1 #1–#6 逐号处置）**——① 在档面时点限定补全（§2.3 / §2.11 / §7-12 / §9：v4 出档 / v5 在档一律带「时点 = v5 落档验收后」）；② 本批 AC 块补 **AC-5**（v4 对出档 + `bench/README.md` 零 v4 死指针 + 同一提交）+ 需求面引用补 §1.5。
- 2026-09-24：**复审修正轮（批次 `2026-09-24-bench-v5` · 复审轮 2 #1–#2 逐号处置）**——① §2.1-6 补契约句：结果目录可由环境变量 `BENCH_RESULTS_DIR` 覆盖（测试 / 沙箱用——沙箱缝升契约面）；② §9 价格面补「时点 = v5 落档验收后」限定（同段同形）。
- 2026-09-24：**参数口径与判官面收正（批次 `2026-09-24-bench-params-judge` · 用户 18:19 / 18:20 / 18:43 / 18:44 / 18:48 裁定链 · 台账 #263–#269）**——① **思考强度中档口径（KD-32）**：`models.json` 档位级 `reasoningEffort` 覆写（三态映射规则——§1.3 / §2.1-4 / §2.4）；
  ② **判官 B 换代（KD-33）**：`tokenhub:hy3` → `glm:glm-5.3` + `SUITE_VERSION` 5 → 6（`frozenAtSuiteVersion` 同步——§2.10.3 / §9；存量重判**不可行**——响应原文不落档，§7-5）；
  ③ **跑批前参数预检（KD-34）**：枚举面入启动门（fail-closed）+ 实弹面脚本（§2.13）；④ **逐档参数披露（KD-35）**：`models[].reasoningEffort` / `reasoningEffortFrom` 入档 + 概览逐档参数表（§2.2-13 / §2.3）；
  ⑤ **spec 行补齐（KD-36）**：10 行新增 + 4 档视觉声明分态 + 未探登记（`docs/core/design/MODEL-SPECS.md` §13）；⑥ 缺价腿两处加固（§5.13 `render.1`）；⑦ 产品树改动面 = `thincoder-core/model-specs.mjs` 及其测试（§3 本批表）。
- 2026-09-24：**设计评审轮 1（changes-required）修正（批次 `2026-09-24-bench-params-judge` · 修正轮——#1–#10 逐号）**：
  ① G-1..G-7 迁新载体测试档（拟新增——名实施轮定；主测试档 477 回 ±0，仅 `[qwen] T-4/A-14` 就地改指）；② `model-specs.mjs` 越 300 处置 = 登记（`core-hygiene.test.mjs` +4 ±1）+ 拆分计划（拆点 / 落点 `thincoder-core/model-specs-table.mjs`（拟新增）/ 消解窗口——`MODEL-SPECS.md` §13.6「行数处置」段）；
  ③ §2.9-1 覆写枚举补 `reasoningEffort` + 「其余字段保持用户原值」句收正 + §2.10.1 括注同步（**§2.9 / §2.10.1 入本批更新面**——§3 本档行）；④ §2.13 六项逐项裁定（阻断 ①②③ / 报警 ④ / 豁免 ⑤⑥）+ `preflight.1` 腿按六项对齐；⑤ 生效性载体钉单一 = `models[].note`（§2.3-9 + KD-32④ 指称收正 + `render.6` ⑤ 新腿）；
  ⑥ 枚举行分类以实施后 spec 表为准（§1.3 / KD-32 / §2.4⑥——`doubao-seed-2-1` 三档建行后归 ① 类）；⑦ `report-tables.mjs` 行补拆分触发 / 载体句；⑧ §2 自检补记（机检终读 = 悬空 8 / 行宽 15——折行后）；⑨ §2.1-5 补预检枚举面阻断因由 + §2.1 / §8 补 preflight 指针；⑩ KD-33 / §9 补 B 位成本可读性认账（`noUsageStream` 族）。
- 2026-09-24：**复审修正轮（批次 `2026-09-24-bench-params-judge` · 评审轮 2 #11–#14 逐号处置）**——① §2.10.1 调用路径括注收界（判官面 `judgeProviderEntry` 三字段；effort 沿条目原值、不覆写——与受测面四字段（§2.9-1）之差量明示；§2.10.3 / §7-14 / KD-33⑤ 同口径）；
  ② 回指计数同步（§3 表 `preflight.test.mjs` / `report-present.test.mjs` 行 + §6 条目回指 266 行：四腿 → 六项对齐腿 · 四态 → 五态）；③ `models[].note` 入档字段纪律补入 §2.2（第 14 条）+ 样例 `models[]` 补键 + §3 影响面句（`modelsOut` / 夹具面实读）；
  ④ §7-3 产品树触面同步为「规格行 + 测试档三处」（§3 本批表）。
- 2026-09-24：**报告形态增补（批次 `2026-09-24-bench-params-judge` · 增补轮 · #271 / #272 · 用户 22:37 / 22:48 / 22:51 / 22:5x 裁定链）**——① 速度表改**双表**：表 A 按 TTFT 中位升序（现状口径）/ 表 B 按 tok/s 中位降序（快者在前）；缺数据居末 · 列集逐字相同 · 脚注一份列表 B 后（§2.3-10① / `render.7`）；
  ② 能力矩阵加**总耗时**（= 速度表「总耗时（中位）」同源）/ **相对成本**（= 成本表同源）两列——行序不变（§2.3-10② / `render.8`）；③ 在档 v5 对重出（`--recompute` 新形态：含 #269 逐档参数表——v5 未采集 effort ⇒ `—`；**数值不追补 · 形态随重出**——KD-35 关系裁定）；
  ④ 呈现面 ⇒ **不 bump**（KD-27）；⑤ 落点 = §2.3（骨架 + 规则 10）/ §5.10（`report.1` 五表）/ §5.13（`render.7` / `render.8`）/ §6（#271 / #272 回指）/ §3 本批表（行数 / 拆分计划改判）。
- 2026-09-24：**承接修复（#273 / #274 · 复核翻案承接 · 批次 `2026-09-24-bench-params-judge` 增补②）**——① `multiturn.1` / `.3` 机械判据与 rubric 对齐（检索步合法 · 存在语义 · 重复拼接容错——KD-37 + 原语 `firstJsonObject` / `argValue`）；
  ② 定点复现 `mech.1` / `mech.2`（`bench/test/graders.test.mjs`；修复前 fail 凭证 = v5 报告承接表实录）；③ **版本归因收正 = 判官 B 换代 + 判据修订**（共用一次 5 → 6——§6 末段）；④ 落点 = §2.6 / §2.10.2 / §2.11 / §3 / §5.6 / §5.11 / §5.13 / §6 / 变更记录。
- 2026-09-25：**审计后收正微轮（批次 `2026-09-24-bench-params-judge` · 实施轮 #43 内部审计两条）**——① §3 本批表补 `bench/test/judge.test.mjs` 行（版本字面 5 → 6 传播四处 · 实施读数 297——审计 out-of-list · 不回退）；② KD-36 全称句收窄（`tempRange` 取值以 `MODEL-SPECS.md` §13.3 逐行为准；「不得带」限 KD-31 例外准入档——决策格 + 理由⑤ 同收）；③ 记录面 = 批次档 §2.13。
- 2026-09-25：**判官 B 终值修订（U2 探针 · 用户点名 `glm-5.3-flashx`）**——§2.10.3 / §9 B 槽逐字改 `glm:glm-5.3-flashx`（原选 `glm:glm-5.3` 复核模板系统性超时未过 ⇒ 退候选；②/③ 双过备选在案）· KD-33 补记 · 认账句沿 `glm` 族（flashx 行 `noUsageStream` = `model-specs.mjs:68`）；§2.2 样例 / §3 表 / §6 回指 B 字面随改；批档 = §2.14。
- 2026-09-25：**报告交叉列（批次 `2026-09-24-bench-params-judge` · 增补③ · #276 · 用户 00:22）**——① 用时表 +2 列（合计通过数 = 能力矩阵「合计」同源 / 相对成本 = 成本表同源）；成本表 +3 列（合计通过数 + 累计耗时 / 相对倍率 = 用时表同源）——两表**尾接** · 行序不变 · 缺数据 `—`（§2.3-10④）；
  ② 测试腿 = `render.3` / `render.4` 扩展（同源对读 / 缺数据 / 行序）+ `render.1` 头串同步；③ 呈现面 ⇒ **不 bump**（KD-27）；④ 落点 = §2.3（骨架两行 + 规则 10④）/ §2.10.5（列集读数同步八列）/ §5.13 / §6（#276 回指）/ §3 本批表（`report-time.mjs` 行新 + 四行随改）。
- 2026-09-25：**设计收正轮（批次 `2026-09-24-bench-params-judge` · 轮 4 复审 #2 / #5 / #6）**——① 规则 10④ 补**轴子集口径**（交叉列不受轴门控：源表未出照出值 · 缺数据仍 `—`）+ 轴子集腿（`render.3` ⑩ / `render.4` ⑪）；② §7-10 括注随交叉列同步（只述原批件射程）；③ 分母措辞统一「**全表最低正值**」（骨架两处 + 规则 7 / 10②）；
  ④ 落点 = §2.3（骨架两行 + 规则 7 / 10② / 10④）/ §5.13（`render.3` / `render.4`）/ §6（#276）/ §7-10 / §3 本批表（三行随改）。
- 2026-09-25：**§2.9-5 坐标收正（批 `2026-09-25-bench-fixnotes` · 台账 #275）**——`noUsageStream` 族址由 `thincoder-core/model-specs.mjs:52-64`（原坐标现落 kimi 行）更新为现读三址（glm 族 `:59-74` / minimax `:134-164` / gemini `:181-183`，本轮 `noUsageStream` 全量 grep 复核）；语义零改（探针相抵与成本记 `null` 处置句不动）；批档 = §2.2。
- 2026-09-25：**判官替代判级联 + 跑后补判（批次 `2026-09-25-judge-fallback` · `SUITE_VERSION` 6 → 7 · 用户 2026-09-25 01:31 裁定「结论必得」+ 01:34 / 01:40 池扩令）**——① **替代判级联**：位级失败（超时 / HTTP / 解析）⇒ 换模型补判（替代池 `judge.json.fallbacks` · 逐级 · 级联序 = 池序 · 池长即级数上限 · 现行池 6 位 = §9；三槽 A / B / C 角色不变）；
  级内语义逐级一致（**同模型单发**——不可解析 / 传输面失败 ⇒ 该级失败 ⇒ 进下一级；预算从宽 = 默认 8192，§2.10.1）；替代身份约束 = 静态校验（两两字面不同 ∧ ∉ {A, B, C}）+ 运行期跳过（**替代 ≠ 失败位模型 ∧ ≠ 存活判官 ∧ ≠ 彼此**）；旧冻结「禁补位 / 禁单判回退 / 传输面失败不重试」**整体废除**（§1.3-2 / §2.10.1 / §2.10.3 / §2.10.4 改写）；
  ② **终局口径**：级链穷尽 ⇒ 单有效判 = **单判定判**（`resolution = "single"`）· 零有效判 / 分歧未决 ⇒ `error`（物理边界——跑后补判收正）；被测侧失败**不受结论必得**（无素材可判——如实 error）；
  ③ **透明记档**：`runs[].judge.judges[].substitutes[]` + `calls[].level`（KD-20 缺省不写）+ 顶层池快照与 `substitutions` / `singleJudged` 计数 + 报告告警行分列 + 概览替代池行 + 方法句 + 局限句 + 逐维明细替代标注；
  ④ **跑后补判通道**（§2.14）：`--rejudge --from <结果.json>`（`--recompute` 姊妹分支——触网判定补全，零网络结构保证零改）；判官面 error run 定点重取素材（响应原文不落档——§7-5 / KD-33 ⇒ 不可由档内重建）+ 级联补判 + 溯源块 `rejudged` + 新对落档（原档不动 · 收编 = 人工点名）；被测侧失败不入列；
  ⑤ 版本 6 → 7（判分合成规则 + 判官身份面（替代池）——§1.3-2）+ `judge.json.frozenAtSuiteVersion` 同步；补判档版本归属 = 补判时代际（原档不改写——KD-40）；
  ⑥ 测试面：`judge.14–18` / `rejudge.1`（新档 `judge-fallback.test.mjs`）+ `judge.10` / `judge.11` 断言收正 + 夹具重分配（`longctx.3` 级联修复 / `vision.2` 穷尽 error）+ `judge.json` schema 腿扩池；⑦ KD-38 / KD-39 / KD-40 新增；⑧ 三端产品树零改动。
- 2026-09-25：**设计收正轮（本批 `2026-09-25-judge-fallback` · 用户 2026-09-25 01:46 裁定「别级内这么折腾……一次不行就换模型」）**——① **取消级内放大预算重试**（`maxTokens × 2` 删除）：级内 = **同模型单发**——不可解析（含空输出 / `finishReason=length`）/ 传输面失败 ⇒ 该级失败 ⇒ 进下一级（§2.10.1 / KD-38 / §7-15）；
  ② **预算从宽**：`judge.json.maxTokens` 默认 2048 → **8192**（= 区间上限；cap 非实耗、计费按实际 tokens；截断类由预算面根治——实证 = v6 A 位 `multiturn.1` 在 4096 仍截断）；区间 [1024, 8192] 维持；三槽 + 池 6 位同受（§2.10.1 / §2.10.3 / §9 样例）；
  ③ 被否候选补「同模型重试（任何形态——含放大预算重试）」（§2.10.4 ⑤ · KD-38 被否①）；④ 随动面 = §2.2-8 / §2.10.1（级内语义 + 预算段 + 标题）/ §2.10.5（成本上界 = 位 × 级链长）/ §2.11（复核面单发）/ §3（`judge.mjs` / `judge.test.mjs` 两行）/ §5.13（`judge.2` / `judge.3` 收正 + `judge.10–16` 措辞）/ §6（判分升级批 AC-1 判定方式）/ §7-15 / §9（探针读数括注）/ KD-33⑤；
  ⑤ 样例 `maxTokens` 值全档随动（§2.2 判官块与 calls · §2.10.3 · §9——27 处）；⑥ 本轮 = 定点收正（级联序 / 池成员 / 三槽身份零动——不实现；`bench/results/` 零触）。
- 2026-09-25：**设计评审轮 1（changes-required · 1🔴 · 7🟡 · 5🔵 = 13 条）修正（本批 `2026-09-25-judge-fallback` · 修正轮 #1–#13 逐号处置）**——① **级号基址单一化**（#1）：级链基址 = 级 1 原位槽 · 替代级 k = 池序第 k 项 ⇒ 记档 `level = k+1`（级号 = 池项固有，不因占用跳过而错位）——§2.10.1 / §2.10.3 / §2.10.5 / §5.13（`judge.14` / `judge.15`）/ §9 逐字一致；
  ② §5.13 表结构修复（#2）：恢复 `review.4` 独立行 + `rejudge.1` 行截除并入残格；③ 样例代际自洽（#3 / #10）：`suiteVersion` 7 = `frozenAtSuiteVersion` 7 · label `roster-29-v7` · 顶层判官计数按代际量级重算 + 判读注补「示意」句；
  ④ 替代池入身份面射程补齐（#4）：§2.1-5 退出码枚举 + §2.10.3 `frozenAtSuiteVersion` 射程 = 三槽 + 替代池；⑤ 测试面对齐（#5）：`preflight.1` 补池内项腿 + 新增 `judge.19`（池面静态身份违约——`suite.test.mjs` schema 腿）；⑥ §2.14 素材构造单源句 + 跨代际重取样本替换语义（#6）；
  ⑦ 补判面全灭退出码 = 0（#7——§2.1-8 / §2.14 同口径）；⑧ 规范面修订式残句删除（#8——§2.10.1 / 合成表 / §5.13 `judge.10` / `judge.11`）；⑨ `attempts` 语义钉死（#9）；⑩ `bench/run.mjs` 行补余量注（#11）；⑪ 旧档缺键渲染缺省语义（#12——§2.2-16 / §2.3）；⑫ `rejudge.1` 补「重取后仍失败 ⇒ 如实 `error`」腿（#13）。
