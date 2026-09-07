# 飞刀（Escalate）— 需求与设计 > 状态：**已实施**（2026-08-15，commit 9ac8322；0.1.22 随版发布）。**2026-08-16 简化**：飞刀钩勾选机制删除——所有会诊模型都是飞刀候选（用户拍板：减少心智负担），条件注册改为与会诊同条件（consultModels 非空即注册）。**2026-08-16 三家会诊修复批**：① mergeMutations 对齐 subagent 的 mergeChildMutations（子 agent 改动重置父级 verify/advisor 收敛预算——此前飞刀可绕过父级门直接收尾），抽为公共函数两处复用；② 工程模式禁飞刀（与 subagent 禁 coder 同理，指向 eng-coder）；③ 用户 Stop 的 AbortError 向上传播不再吞掉；④ 补墙钟看门狗（consultTimeoutMs，超时按 timeout 结算而非崩溃）；⑤ model 参数容忍 withPool 描述里的 " (effort)" 后缀；⑥ provider 无 API key 提前报错；⑦ 面板 surgeon 行显示模型名 + 思考/输出流式进面板；⑧ 返回附 Touched files 清单，ContinueError（撞 turn 上限）单独话术与真崩溃区分。**2026-08-16 CLI 对齐批（0.12.32 parity）**：⑨ **删墙钟看门狗**（④ 撤销）——固定墙钟误杀正常但慢的手术（实测两个 max-effort 顾问读文件即撞 10min 墙），改为完全依赖 turn 帽 + FETCH_TIMEOUT + 用户 Stop 直传；⑩ **撞墙可继续**——ContinueError 时经 onQuestion 通道弹"继续?"（主 agent 同款问题卡），用户选 Continue 则以 resume:true + 子 agent 自身 history（agent.mjs 新增子 agent history 传入/回传支持）续跑，预算重置，上限 2 次；⑪ **effort 枚举钳制**——池 effort 越界回退预设并标注（此前该候选每次 chat 必抛错，"起飞即死"）。
> 关联：`CONSULTATION.md`（会诊——飞刀的候选池来源与互补机制）、`MODEL-PICKER-UNIFY.md` §3.3（effort 配置语义） --- ## 0. 术语表（归并后：两个名字） > **2026-08-16 归并**：surgeon 已从代码中移除——工具名与角色名统一为 **escalate**。历史上 surgeon 曾作为子 agent 的角色名（role: "surgeon"）与工具名 escalate 并存，导致模型混淆（找 "surgeon 工具" 落空、把 escalate 当模块写脚本）。用词越少越一致，模型出错越少（用户拍板）。 | 名字 | 是什么 |
|---|---|
| **`escalate`** | **唯一的技术名**——工具名 = 它召唤的子 agent 角色名（role: "escalate"） |
| **飞刀** | escalate 的中文别名（用户面向） | 红线：看到 escalate.mjs 的源码不等于"要写脚本调它"——escalate 是主 agent 工具表里的工具，直接调用。本文档历史章节里的 "surgeon" 均指今天的 escalate 角色（不再逐行改写历史叙述）。 ## 1. 需求 ### 1.1 一句话 主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——像医院请外院专家飞刀：专家到场、亲自手术、术后交回病历、离场。 ### 1.2 与会诊的分工（互补，不重叠） | | 会诊 consult | 飞刀 escalate |
|---|---|---|
| 本质 | 多模型**并行给意见** | 一个强模型**亲自执行** |
| 权限 | 只读 | **可写**（走正常权限门） |
| 类比 | 多科室会诊 | 外院专家飞刀手术 |
| 场景 | 判断不清，要多视角 | 确认干不动，要人代干 |
| 候选 | `consultModels` 全体 | `consultModels` 中**带钩**的模型 |
| 形态 | 三工具（start/check/stop），异步 | 单工具，同步等待 |
| 产物 | 各家分析意见 | 改动清单 + 理由 + 验证结果（术后病历） | ### 1.3 用户故事 - **US-F1（钩选）**：会诊列表每个模型带一个"飞刀"勾；勾上的模型成为飞刀候选。零勾 = 飞刀不可用
- **US-F2（操刀）**：主 agent 调 `escalate(task)` → 飞刀子 agent 用钩选模型读码、改码、跑测试，活动流实时进对话面板（与 subagent 同款可见性）
- **US-F3（病历）**：子 agent 交回结构化报告：改了什么、为什么、怎么验证的；主 agent 复核后向用户汇报
- **US-F4（指定医生）**：`escalate(task, model)` 可指定候选中的某一位；不带 model 用第一个勾选的
- **US-F5（安全线）**：写操作走正常权限门（非 AUTO 时弹审批卡）；depth=1 封顶（飞刀不能再飞刀）；改动走 recent-changes/git 追踪，可回滚 ### 1.4 边界哲学（用户拍板：不设硬边界） 会诊的边界（首次失败不用、简单错误不用）**不照搬**到飞刀：那是给 N 倍成本机制设的闸。飞刀成本 ≈ 主 agent 自跑一轮，硬边界只会让模型该出手时不出手。条款只描述"什么样的任务适合"和"与会诊的区别"，**何时出手完全交给模型判断**。机制化挂钩（verify 耗尽/stall）保留——那是给撞墙时刻的入口提示，不是限制。 --- ## 1.5 不做清单 - ❌ 飞刀再飞刀（深度封顶）
- ❌ 多模型并行操刀（一个手术台只能站一位主刀）
- ❌ 飞刀专用的独立模型配置（候选池就是会诊列表 + 钩）
- ❌ 主 agent 无自主权的全自动升级（触发权在主 agent 判断 + 用户，工具只提供能力） --- ## 2. 设计 ### 2.1 配置（2026-08-16 简化：无钩选） `agent.consultModels` 全部条目都是飞刀候选，**无 `surgeon` 字段**： ```jsonc
"agent": { "consultModels": [ { "provider": "kimi", "model": "kimi-k3", "effort": "max" }, { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" }, { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "high" } ]
}
``` - 候选池 = 全部 `consultModels`（无字段、无勾选）
- 工具注册（agent.mjs）：`consultModels` 非空即注册 `escalateTool`（与会诊同条件——未配置会诊时模型根本看不到工具） ### 2.2 工具契约 ```
escalate - task (required): 交给飞刀模型的任务描述——目标、约束、入口文件、验收标准 - model (optional): 指定候选池中的模型（provider:model 格式）；缺省 = 候选池第一个
→ 同步执行：spawn 可写子 agent（钩选模型 + 该候选配置的 effort）
→ 返回子 agent 的最终报告（术后病历：改动清单 / 理由 / 验证结果）
→ 子 agent 活动流通过 toolPanel 通道实时可见（sub:<label>，与 subagent/consult 同款）
``` 实现挂点：`src/agent-tools/escalate.mjs`（新文件），结构对齐 `subagent.mjs`： - `role: "coder"` 复用现有 coder 子 agent 路径（写权限、权限门、recent-changes 追踪全部现成）
- provider 构建：`buildProvider(m.provider)` + `reasoningEffort: m.effort`（与会诊子任务同款注入）
- `maxTurns: agent.subagentTurns`（写任务的复杂度对齐 coder 子 agent，不套 consultTurns）
- `depth: 1` 由 runAgent 强制；execute 层拒绝 depth>0 的 escalate 调用（护栏写进工具 execute 开头） ### 2.3 触发方式（两通道，2026-08-15 定稿：撤掉机制化挂钩） 1. **主 agent 自主判断（唯一主通道）**——main.md 飞刀条款（边界不设硬性限制，模型自由裁量；2026-08-15 用户拍板）： > **Escalate to a stronger model (飞刀)** — when YOU judge the task calls for a stronger model's hands (a complex multi-file refactor, an intractable bug, intricate algorithm work — or simply work you assess as beyond your comfortable ability), hand the implementation to it via `escalate(task)`. It gets WRITE access and does the work itself; you review its report (read the changed files, run the tests). You are free to escalate early or late — your judgment; the cost is one expert model run, comparable to doing it yourself. Contrast with `consult_start` (parallel READ-ONLY opinions for judgment calls). 设计理由：会诊是 N 模型并行（贵，边界要紧）；飞刀是单模型（成本与主 agent 自跑一轮相当），省着用的理由弱——裁量权交给模型（§1.4）。
2. **用户手动**——"飞刀 glm" / "escalate 给 kimi" → 主 agent 带 `model` 参数调用。 **为什么不挂 verify 耗尽 / stall 检测**（2026-08-15 用户点破，撤回原设计）： - 飞刀是**事前能力评估**——接任务时掂量"这活超出我的舒适区"就该直接交出去；verify 耗尽/stall 都是**事后撞墙信号**，此时升级是收拾残局，不是飞刀
- verify 耗尽的瞬间主 agent 不知道自己缺的是判断（→ 会诊）还是手艺（→ 飞刀）——而两机制的分工恰恰建立在这个区分上；该场景已挂会诊（判断缺口对症），维持不变
- 飞刀模型在三次失败后接手，继承的是被污染的上下文和可能改乱的工作区——上台时手术区是乱的 ### 2.4 面板 **无飞刀勾选框**（2026-08-16 删除——所有会诊模型自动成为飞刀候选，面板零新增控件）。会诊行保持：模型选择 + effort 下拉 + ✕ 删除。 ### 2.5 受影响文件 | 文件 | 动作 |
|---|---|
| `src/agent-tools/escalate.mjs` | 新增：escalateTool |
| `src/agent-tools/index.mjs` | 导出 |
| `src/agent.mjs` | 候选池非空注册；工具表装配 |
| `src/config-io.mjs` | consultModels 校验加 surgeon 字段；loadAgentSettings 透传 |
| `src/extension/settings.mjs` | 快照透传 surgeon |
| `webview/settings.js` | 会诊行加钩选框 + 状态行 |
| `src/prompts/main.md` | 飞刀条款 |
| `locales/en.json` + `zh.json` | surgeon.* 文案 |
| `test/escalate.test.mjs` | 新增测试 | ### 2.6 关键决策记录 - **候选池复用会诊列表**：不新增配置章节；钩是布尔字段，勾选零成本（用户拍板"每个模型有个钩"）
- **同步单工具而非异步三件套**：飞刀是"交给它干完"，主 agent 等待病历天经地义；不需要早停/逐个读
- **复用 coder role**：写权限/权限门/追踪全部现成，零新机制
- **工具名 escalate 而非 surgeon**：英文语境 "escalate to an expert" 模型一见即懂；中文 UI 叫"飞刀"（用户确认）
- **空池不注册**：与会诊同款纪律——模型看不到不存在的功能就不会误调 ## 3. 测试 | 用例 | 断言 |
|---|---|
| 空池不注册 | consultModels 无 surgeon:true → 工具表无 escalate |
| 钩选注册 | ≥1 surgeon:true → escalateTool 在 depth 0 工具表 |
| 操刀契约 | fake runner 收到钩选模型 + 配置 effort + role coder + depth 1 |
| model 指定 | escalate(task, "glm:glm-5.2") → 用 glm；不在候选池 → 报错列出候选 |
| 深度护栏 | depth>0 调 escalate → 拒绝并说明（飞刀不能套飞刀） |
| 配置往返 | 面板勾选 → config.json 落盘 surgeon:true；去钩 → 字段删除 |
| 活动流 | 子 agent 工具调用以 sub: 前缀流到面板 |
