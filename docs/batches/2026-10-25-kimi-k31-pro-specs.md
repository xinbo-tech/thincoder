# 2026-10-25 · MODEL_SPECS 增 Kimi K3.1 Pro 两行（官方 quickstart 实读）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 16:48「kimi发了新模型，你上网查一下资料，更新一下我们的model_spec」。
> 台账 = #1789（MODEL-SPECS · 归批）。前情 = 无（独立轻通道轮）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**已定决定**：`MODEL_SPECS` 增 `kimi-k3.1-pro` ∥ `kimi-k3.1-pro-highspeed` 两行，参数一律取**官方 quickstart 原文**（不取二手评测）。 · 用户原话：「kimi发了新模型，你上网查一下资料，更新一下我们的model_spec」 · 时间：2026-10-25 16:48

**官方源（一手 · 2026-10-25 实读）**：`https://platform.kimi.com/docs/guide/kimi-k3-1-pro-quickstart`（发布日 2026-10-23）

| 字段 | 官方原文依据 |
|---|---|
| 模型 ID | `kimi-k3.1-pro` ∥ `kimi-k3.1-pro-highspeed`（「K3.1 Pro 提供高速版本 kimi-k3.1-pro-highspeed」） |
| context | 「支持 100 万上下文」；定价页「1,048,576 token 上下文窗口」⇒ `1_048_576` |
| maxOutput | 「max_completion_tokens 默认 131072，最大可设置为 1048576」⇒ 取默认档 `131_072`（与 k3 行同口径） |
| thinkAlwaysOn | 「K3.1 Pro 始终开启思考模式」+ FAQ「目前关不了」⇒ `true` |
| thinkApi / 枚举 | 「推理强度通过请求顶层 reasoning_effort 配置，支持 low / high / max（默认 max）」⇒ `"effort"` + `["low","high","max"]` |
| reasoningEcho | 「多轮对话和工具调用必须原样回传完整 assistant message」⇒ `"required"` |
| partialMode | 「Partial Mode…在消息末尾添加 partial=True 的 assistant message」⇒ `true` |
| multimodal | 视觉输入节（图 / 视频）⇒ `true`；限制：**不接受公网 URL**，须 base64 ∥ `ms://<file-id>`，content 必须是对象数组 |

> 不适用：§2 —— 无机制设计：表行数据增补，判据 = 官方一手参数，机制本体（查表 / 前缀匹配 / 回落）零改。
> 不适用：§3 —— 无设计可评：同上；数据面改动，无新语义。

**范围边界（不做）**：不改查表逻辑 ∥ 不改 `SORTED_SPECS` 排序 ∥ 不改默认回落 ∥ 不加别名映射 ∥ 不动定价面（规格表不携价格）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话「kimi发了新模型，你上网查一下资料，更新一下我们的model_spec」＝下达即授权）

**批准范围**：`thincoder-core/model-specs.mjs` 增两行（`kimi-k3.1-pro` ∥ `kimi-k3.1-pro-highspeed`）+ 注明官方源与字段依据的注释；查表逻辑 / 排序 / 回落零改。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 验证与收口（轻通道轮 2026-10-25）

**改动**：`thincoder-core/model-specs.mjs` 增 2 行（`kimi-k3.1-pro` ∥ `kimi-k3.1-pro-highspeed`），各带 4 行注释注明官方源与逐字段依据；净 +6 行（75 → 77 规格行）。

**实跑读数**（`node --check` 过 + 逐值断言脚本，临时域，未落仓）：

| 判据 | 读数 |
|---|---|
| `kimi-k3.1-pro` 查表 | context=1048576 · maxOutput=131072 · thinkAlwaysOn=true · thinkApi=effort · effort=["low","high","max"] ✓ |
| `kimi-k3.1-pro-highspeed` 查表 | 同上（同规格）✓ |
| 前缀互不吞 | `kimi-k3` 仍命中自己那行（context=1000000）✓；长短序由 `SORTED_SPECS` 长度降序保证（24 > 13 > 7）✓ |
| 渠道前缀归一 | `moonshot/Kimi-K3.1-Pro` ⇒ 命中 K3.1 行（末段匹配 + 大小写不敏感）✓ |
| 未登记回落 | `nope-xyz` ⇒ DEFAULT_SPEC `{128000, 32000}` + 一次性告警 ✓（既有语义未动） |

**观察（不改，超出本笔）**：设计档 `docs/core/design/MODEL-SPECS.md:879` 的「53 规格行」是 **§12.2 表变更清单**里那一批的历史读数，非现态声明；现盘 77 行。该节属历史清单（结构性存量），另轮处置。

**测试行**：① 本笔无单测档（数据行增补，无代码路径变更；验证 = 一次性断言脚本，已删）；② 集成集现量 **19 例 / 窗口 50–100**，本笔无增删。
