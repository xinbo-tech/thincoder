# digest 400 急修（MODEL-400-FIX）

> 板块：provider 装配（双端——渠道克隆 model 重派生）。权威源：AGENT-LOOP（MODEL-MERGE-SESSION 后 schema——渠道无 model 默认字段——models[] 候选）。
> 状态：**设计待评审**——2026-09-09 落档（MODEL-MERGE 回归勘察 explore 一手——根因闭环：JSON.stringify 丢 undefined 键 → 无 model 请求 → serde 400——现场 a-d 双端）。需求：TODO digest 装配 400（用户裁赶紧修复——两端都有）。

---

## 需求

- **总体目标**：修 MODEL-MERGE 引入的回归——渠道克隆丢 model → 无 model 请求 → 400（eng-coder/advisor/explore 全部异步 settle digest 失败）。
- **功能性**：
  - F-1（根因兜底）请求体组装前断言 `provider.model` 为真——undefined/null 报可读错误（带 provider 名 + 解析链线索）——**不发病体**（防一切渠道克隆回归——fail-fast 可诊断）
  - F-2（克隆修复——双端 a/b/c/d 四现场）渠道裸克隆补 model 重派生：
    - a/b（advisor provider 无 cfg.model）→ 兜底主 agent provider 的 model（cfg.provider 命中但无 model → 用主 provider.model——原头注"否则用主 agent provider"语义恢复）
    - c（resolveChildProvider byName 裸渠道名）→ `model: byName.models?.[0]`（候选首个）
    - d（applySession 恢复态）→ `""`/null 槽 model 用 `?? models[0]` 兜（双字段恒非空语义下空槽不可能——但防御补）
  - **范围边界**：digest 注入限量（用户需求——防 1.3MB 复发）留待下批（本批急修根因——限量落点已勘察：injectAsyncResult 批量预算——另立设计）；VSC e 现场（resolveDefaultModel 返 null → model:null 另一类 400）同修（断言兜底覆盖）。

## 设计（勘察现场——照做勿自行解释）

### 1. F-1 请求体断言（双端）
- CLI `src/provider/core.mjs:181` 前：`if (!provider.model) throw new ProviderError(provider, "model is undefined — provider cloned without model re-derivation (MODEL-MERGE schema: channels carry models[] not model)")`——可读错误带 provider 名
- VSC `src/provider/transports/openai.mjs:17` 同款断言
- 测试：mock provider.model=undefined → 断言 throw（不发病体——错误文案含 provider 名 + 修复线索）

### 2. F-2 克隆现场 model 重派生（双端）
- a. CLI `src/advisor/run.mjs:326-341` resolveAdvisorProvider：`cfg.model ? {…provider, model:cfg.model} : {…provider}` → 无 cfg.model 时 `{…provider, model: provider.model ?? parent 主 provider.model}`——语义恢复（advisor 不配 model = 用主 agent provider 模型）
- b. VSC `src/advisor/provider.mjs:11-26` 同款
- c. CLI `src/agent-tools/subagent-async.mjs:150-152` resolveChildProvider byName：`{...withKey(byName)}` → `{...withKey(byName), model: byName.models?.[0] ?? parent.provider.model}`——裸渠道名取候选首
- d. CLI `src/session.mjs:319-331` applySession：`data.activeModel ?? models[0] ?? null` 对 `""` 不回退 → `data.activeModel || models[0]`（`||` 非 `??`——空串也兜）——slotModel falsy 时不缺 model 键
- VSC 镜像同款（panel-chat/session 装配面——resolveTurnModelAndStamp/slotRef 链——查对应）
- 测试：advisor 无 cfg.model → provider.model = 主 provider.model；byName 裸名 → models[0]；槽空 activeModel + models 有候选 → 兜 models[0]

## 受影响文件（双端）

| 文件 | 端 | 改动 |
|---|---|---|
| src/provider/core.mjs | CLI | F-1 断言 |
| src/advisor/run.mjs | CLI | F-2a model 兜底 |
| src/agent-tools/subagent-async.mjs | CLI | F-2c byName models[0] |
| src/session.mjs | CLI | F-2d 空槽兜 |
| src/provider/transports/openai.mjs | VSC | F-1 断言 |
| src/advisor/provider.mjs | VSC | F-2b 兜底 |
| VSC panel-chat/session 装配面（resolveTurnModelAndStamp/slotRef——实现时定位） | VSC | F-2d 镜像 |
| 测试（provider 断言 + 克隆兜底族） | 双端 | 新 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 model undefined | provider.model=undefined 发请求 | 可读 throw（带 provider 名 + 修复线索）——不发病体——F-1 |
| F-1 model null | provider.model=null | 同 throw（另一类 serde 错防住）——F-1 |
| F-2a advisor 无 cfg.model | cfg={provider:deepseek} | provider.model = 主 provider.model——F-2 |
| F-2c 裸渠道名 | model="deepseek" | model = deepseek.models[0]——F-2 |
| F-2d 空槽 | activeModel="" + models=[x] | model = x——F-2 |

## 验收

- AC-1 双端请求体断言（model undefined/null → 可读 throw 不发病体）
- AC-2 双端克隆修复（advisor/byName/空槽 model 恒有值——测试绿）
- AC-3 回归（MODEL-MERGE 双端快层全绿——config-merge/model-ref 等既有测试零回归）
- AC-4 实况（下次异步 settle digest 不再 400——可观测）
- 红线：MODEL-MERGE schema 不动（渠道仍无 model 字段——models[] 候选）；只改克隆/断言面

## 变更记录
- 2026-09-09：落档（勘察一手——JSON.stringify 丢 undefined → 无 model 请求 → serde 400——column≈body 长吻合——MODEL-MERGE 删渠道 model 字段后克隆链丢键——现场 a-d 双端——VSC 实证（panel-chat:484 格式）+ CLI 同险——主会话正常因 per-message echo——digest/advisor 无 echo 走克隆链落空——急修）。
