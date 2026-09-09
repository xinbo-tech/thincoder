# 模型合并 + 会话级隔离（MODEL-MERGE-SESSION）

> 板块：模型选择架构（双端——activeProvider/activeModel 合并为 provider:model 复合——会话级隔离）。权威源：SESSION.md（会话模型语义）+ config（providers/defaultModel）。
> 状态：**设计待评审**——2026-09-09 落档（模型合并深勘察 explore 一手——schema 迁移面/复合解析器/消费面全清单 + 诚实权衡——用户裁定 ①-⑦ 全采纳）。需求：TODO 模型合并（Nancywb 报告反方向——串扰根治——维护者裁定会话级隔离）。

---

## 需求

- **总体目标**：合并模型概念——activeProvider 与 activeModel 不再是分开参数——模型 = 显式复合值 "provider:model"——config 顶层 defaultModel（新建起点）+ 会话槽记会话模型（恢复用——永不被 config 动）——串扰根治（/model 不再写 config 全局）。
- **功能性**：
  - F-1 config schema：providers[].models（候选硬约束——非空）+ config.defaultModel: "provider:model"（顶层）——删 providers[].model / activeProvider / activeModel 三旧层
  - F-2 复合解析器（严格双段 + models[] 成员校验——不复用 resolveChildProvider 宽松三态）
  - F-3 /model 纯会话级（写槽——不碰 config）
  - F-4 恢复 = 会话槽值（不看 config——applySession 重写）
  - F-5 config 默认走专用入口（CLI /config "默认模型" + VSC 面板项）
  - F-6 未设显式引导（A 裁定）
  - F-7 落地裁定：槽 (a) 保留双字段恒非空 / /new 沿用当前 / /model 裸 provider 拒 / VSC per-message 单回合 / 迁移折中 C / wizard 首配即 defaultModel + PRESETS models 种子
  - **范围边界**：渠道非 model 字段（thinking/reasoningEffort/maxTokens——cmd-think 等）保持渠道级；advisor/subagent 覆盖语义独立不受影响；thinking 等字段消费点零改（provider.model = 解析后值喂 API）。

## 设计（勘察骨架——照做勿自行解释）

### 1. config schema（双端 config.mjs/config-io.mjs）
- DEFAULTS：删 activeModel（:40）/activeProvider——加 defaultModel: null——providers 条目 model → models: string[]
- merged provider：从 defaultModel 复合解析构建（provider 对象带 model = 解析出的具体值——API/spec 消费点不变）
- loadConfig 加 defaultModel 校验（同 consultModels 先例——provider ∈ providers[] ∧ model ∈ models[]——无效 D-S1 处置不 throw）
- resolveCompactThreshold/providerSpec 输入不变（provider 带解析后 model）

### 2. 复合解析器（新模块 model-ref.mjs——config.mjs 432 行将超 500——独立 + re-export hub）
- parseModelRef(ref, providers) → {ok, provider, model} | {ok:false, reason}
- resolveRuntimeProvider(providers, defaultModel, legacyFields?)
- 无效处理：runtimeProvider={} + _providerInvalid + 原因——TUI 首帧弹 defaultModel 设置选择器——headless 可读报错（bin 文案改引 defaultModel）——恢复路径 D-S3 保留（会话值优先——两方都无效才弹）

### 3. 迁移（折中 C——一次性写回失败绝不阻断）
- 触发：loadConfig/loadRaw 检测 providers[].model || activeModel || activeProvider → 迁移
- 映射：每渠道 model → models:[model]；defaultModel = (activeModel ?? activeProvider 渠道 model ?? 首渠道首候选) 复合
- 写回：writeConfigAtomic/persistRaw——mtime 冲突/写异常 → 内存迁移态继续下次 load 重试——幂等
- 双端同规则（防各写各的）——slot 旧字段不迁移（读侧容忍）

### 4. 会话槽（裁定 a——保留双字段恒非空）
- saveSession/applySession：activeProvider + activeModel（恒非空具体 model——无渠道默认可回落）——摘要/slotDigest 升级显 "p:m"
- applySession 三支重写：provider 存在 → provider/model 按槽值设 + 重算 compactThreshold；provider 没了 → D-S3 保留；**删 activeModel==null 清 stale override 回渠道默认支**（前提消失）
- token-ttl/VSC saveLines ...existing 往返保字段

### 5. /model 纯会话级（pickers/cmd-model/cmd-submodel）
- pickers selectModel：候选校验（models[] 内——外拒）——写槽（agent 内存态 + saveSession——不动 config）
- 二级列表读 providers[].models[]——fetchModelsForProvider 仅作候选建议辅助（加入候选需显式落 config）
- /model 裸 provider → 拒（显式 p:m——裁定③）
- cmd-submodel：会话复合值语义

### 6. 专用入口（CLI /config "默认模型" + VSC 面板）
- cmd-config：defaultModelMenu（L1 provider → L2 models[] → persistRaw defaultModel）——saveProxy/reloadConfig 通道
- reloadConfig 三支重写（cfg 无 active——runtime provider 由 defaultModel 或槽决定）
- VSC：fullStatus/agentSettings/settings 卡加"默认模型"项（两级——写 raw.defaultModel）

### 7. 引导 A + wizard + PRESETS
- 启动空槽（bin data:null）defaultModel 未设 → 引导设默认（/config 入口或 wizard）
- mid-TUI /new 沿用当前（裁定②）
- finishWizard 首配模型即写 defaultModel（裁定⑦）；PRESETS model 字段退役 → models 种子（[原 model]——渠道至少一候选）

### 8. VSC 独有
- model 选择消息 = 写当前会话槽（saveLines 通道带 activeModel）——workspaceState prefs 保留 UI 态——selectProviderModel 从 config 写路径退役
- 恢复缺口补：runPanelChatImpl providerName 解析（现走 config 从不读槽）→ 槽复合 → 无 per-回合 override → 用槽模型建 provider（VSC 行为新增）
- per-message modelOverride = 单回合试运行不落槽（裁定④）

## 受影响文件（双端——大面——详见勘察 §5/§6）

| 文件 | 端 | 改动 |
|---|---|---|
| src/config.mjs | CLI | schema 删三层 + defaultModel + 校验 |
| src/model-ref.mjs（新） | CLI | 复合解析器 |
| src/tui/pickers.mjs / cmd-model.mjs / cmd-submodel.mjs / cmd-config.mjs | CLI | /model 写槽 + 候选校验 + 默认模型入口 |
| src/session.mjs / session-slots.mjs / token-ttl.mjs | CLI | 槽双字段 + applySession 重写 |
| src/agent/make-agent.mjs / reloadConfig | CLI | defaultModel 解析 |
| bin/thincoder.mjs / wizard.mjs / setup-wizard.mjs | CLI | 引导 A + 首配 defaultModel |
| src/config-io.mjs / config-migrate.mjs / presets.mjs / settings.mjs | VSC | schema 镜像 + 迁移 + models |
| src/extension/panel-session.mjs / panel-chat.mjs / panel-messages.mjs | VSC | 槽播种 + selectModel 写槽 |
| src/extension/session-io.mjs / model-menu.js / settings-providers.js / settings-models.js | VSC | 面板 + 候选 UI |
| docs/design/SESSION.md §8/§11 + ENGINEERING-MODE + 双端根 | 双端 | 语义同步 |
| test/（双端——见用例表） | 双端 | 迁移/解析/恢复/写槽测试 |

## 用例表（正常/边界/错误）

| 用例 | 输入 | 预期输出 |
|---|---|---|
| schema 新形态 | 新 config 无旧字段 | providers.models + defaultModel——F-1 |
| 老 config 迁移 | providers[].model+activeProvider+activeModel | 折中 C 映射——幂等——失败不阻断——F-7 |
| 复合解析合法 | "deepseek:deepseek-v4-flash" | ok + provider + model——F-2 |
| 解析无效 | 未知 provider/model 不在 models | ok:false——D-S1——F-2 |
| /model 会话级 | 选 models 内 | 写槽不写 config（mtime 断言）——F-3 |
| /model 裸 provider | /model deepseek | 拒（显式 p:m）——F-7 |
| /model 候选外 | models 外模型 | 拒——F-1 |
| 恢复 | 槽有 provider/model | applySession 用槽值（不看 config）——F-4 |
| 槽 provider 没了 | 槽值 provider 不存在 | D-S3 保留（config 有效则静默用 config）——F-4 |
| config 默认入口 | /config 默认模型选 p:m | 写 defaultModel——F-5 |
| 未设引导 | 空槽 + defaultModel null | 引导设默认——F-6 |
| VSC per-message | override 模型跑一条 | 单回合不落槽——F-7 |
| /new mid-TUI | 开新槽 | 沿用当前不提示——F-7 |

## 验收

- AC-1 schema 新形态（双端 DEFAULTS/config-io——models[] + defaultModel）
- AC-2 迁移折中 C（老 fixture → 复合 + models——幂等 + 失败不阻断测试）
- AC-3 解析器（合法/无效/候选外）
- AC-4 /model 纯会话级（写槽不写 config——mtime 基线断言双端）
- AC-5 恢复 = 槽值（applySession 新三支 + VSC 槽播种——不看 config）
- AC-6 默认入口双端（CLI /config 子菜单 + VSC 面板——写 defaultModel）
- AC-7 引导 A（空槽未设 → 引导）
- AC-8 双端锁步（diff 核——schema/迁移/解析同规则）
- AC-9 测试绿（双端 npm test 快层——既有锚点 integration-provider/setup-reminders/chat-panel/config-pool 同步更新）
- 红线：thinking 等渠道字段保持渠道级零动；advisor/subagent 覆盖独立；API/spec 消费点零改（provider.model = 解析值）；消息协议名零改

## 变更记录
- 2026-09-09：落档（深勘察一手——schema 迁移面/解析器/消费面全清单 + 迁移写回 vs 只读权衡——用户裁定 ①-⑦ 全采纳：槽 (a) 双字段 / /new 沿用 / 裸 provider 拒 / per-message 单回合 / 折中 C / wizard 首配 + PRESETS models 种子）。
