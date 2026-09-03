# 项目待办（Project TODO）

> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示）汇总于此，不散落在设计文档中。
> 设计文档只承载设计本身——待办变更不应触发设计文档变更（避免不必要的 doc review）。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。

### 并行化优化批（2026-09-02，来源：用户并行化缺陷评估 + 工具使用数据审计）——**已实现（2026-09-02，两端落地 + 测试全绿 + code review 通过）**

- [x] ~~subagent 异步化（AGENT-LOOP.md §15：async + subagent_check + 槽位队列 + 收尾等待 + 上限 4）~~——两端实现，CLI 1046/1002 + VS Code 871/871
- [x] ~~approval 批确认 + 批量形态引导（§16：onBatchPermissionRequest + edit/apply_patch 描述 + system.md 批量句）~~——两端实现 + code review 修复轮（touchedPaths/原子性/isDirty）
- [x] ~~VS Code deepseek 400 对齐（PROVIDER.md §14.7：escape v5 / UTF-16 截断 5 处 / 续写构造）~~——VS Code 落地
- [x] ~~VS Code 压缩可见性（CONTEXT-COMPACTION.md §7 D-C3：回调 + webview 状态行）~~——VS Code 落地

## 待办（Open）

### 工程模式 · 模式感知 + 自切换（2026-08-01）

- [x] 每轮工程模式状态提醒——已实现（ENG_ON_REMINDER 注入 + exit 时 OFF 提醒）
- [x] engTool——已实现（src/agent-tools/eng.mjs，enter/exit + persistState）
- [x] 关闭时状态声明——已实现（exit 分支注入 OFF reminder）

（2026-08-25 核对销账：三条均已落地）

### TUI · 工具输出统一（2026-08-01，长期改进）【2026-08-29 核对销账（round2 #1）：三条均已落地，规格以 TUI-TOOL-OUTPUT.md 为准（N 行滚动非三行、`│ …` 折叠非截断）】

- [x] ~~所有工具输出统一为**行间区块**格式~~——已落地（见 TUI-TOOL-OUTPUT.md §1.1/§2.1，面板区已废除）
- [x] ~~区块内容包括执行中实时输入/输出预览~~——已落地（TUI-TOOL-OUTPUT.md FR2）
- [x] ~~历史中保留完整结果（截断落盘机制复用）~~——已落地（TUI-TOOL-OUTPUT.md FR4，64K 落盘）

### TUI · 工具输出面板优化（2026-08-01）

- [x] ~~`renderOutput` 面板标题行~~——条目过时：面板区架构已废除（全部内联块渲染，见 TUI-TOOL-OUTPUT.md）；完成行 `❯ name — done(ms) → summary` 已实现（agent-turn.mjs）
- [x] ~~关闭规则统一~~——同上，面板废弃后不适用；内联块随会话历史持久化
- [x] 状态栏实时显示当前工具名——已实现（`render-frame.mjs` `state.currentTool` → 状态栏 toolHint）

### 工程模式 · code review 评审范围显式化（2026-08-01）

- [x] code review 评审范围改为 task 的 Docs involved + 验收标准——2026-08-25 核对关闭（ENGINEERING-MODE.md FR4：eng-coder 返回后父代理自动 advisor(type=code)，范围=Docs involved+验收标准）
- [x] setup.mjs 提示词解耦——已实现（PROMPT-DECOUPLING.md 定稿后落地，工程提示词独立组装）
- [x] 多设计并行 token 映射化（单值 token → designId 槽集合）——**2026-09-01 已实现销账**（ENGINEERING-MODE.md §FR3/FR8 + 变更记录）：08-31 否决的是"文档锚 `{designPath: token}`"（文档改名/回写失效）——落地采用 **08-31 预留的"评审实例表"路线**（评审调用生成随机 designId + 父代理 `_engDesignTokens` Map，文档仅审计不参与校验），非文档锚。触发场景真实发生：memory_delete + §14 并行 spawn，单值覆盖致 §14 首 spawn 失败。实现：advisor 通过结果回显 designId（评审 #1）、token 入 Map 槽 + 保留 `_engDesignToken` 单槽兼容镜像（关键决策 ②）；spawn 增可选 `designId` 参数按槽定位（单设计省略/多设计必带，T16 不误取）；复审失败不入槽不清槽（评审 #2 方案 ②）；engineering.md 注入并行化纪律 + designId 并行调用形态；两端镜像 + T15-T17/T19 测试。

### Issue 批量（2026-08-22，来源：Gitee/GitHub issue 巡检）

- [x] IK9IXD 数学公式渲染——已实现（`src/tui/math.mjs` LaTeX→Unicode，commit 127130a）——2026-08-25 核对销账
- [x] IK9UWM Windows 中文粘贴乱码——已实现（clipboard UTF-8 + BOM 剥离，commit 5c72ec2）——2026-08-25 核对销账
- [x] GitHub thincoder#1 embedding 三件套——已实现（cmd-config.mjs embeddingPatch 补写 baseURL/model，引用 DEFAULTS）——2026-08-25 核对销账
- [x] IK9UZ8 思考型模型标题生成失败——CLI 已实现（commit 3c1815e）；vscode 侧状态见 vscode TODO 同名条目
- [x] GitHub thincoder#2 GLM tool_calls 畸形解析——已实现（openai.mjs droppedToolCalls 防御合并 + agent.mjs 丢弃提醒，0.12.37；vscode 端 128464b normalizeToolPairing）——2026-08-25 核对销账
- [x] TUI.md 章节号重编号——已修（2026-08-25，## 4-## 10 顺延，无重复）
### TUI · 子agent/advisor 模型显示测试（2026-08-26，来源：模型显示审计）【2026-08-30 核对销账：`[model]` 解析剥离已有专项单测锁定，见下条划线注记】

- [x] ~~`[model]` token 解析剥离补自动化测试（agent-turn.mjs 解析 / render-frame.mjs header）~~——2026-08-30 核对销账：已随 §7.2 D4 落地锁定（实现拆分至 subagent-blocks.mjs routeSubToken；header 渲染随窄带退役迁至 render-conversation.mjs）——`test/subagent-blocks.test.mjs` 专项单测（[model] 元数据只记录一次、后续 [model] 开头内容不吞；T2 无 token 降级由 ensureSubTask 默认态 model=undefined 保证）+ `test/agent-turn.test.mjs` 端到端用例多处（T-A/T-E 等）；契约见 TUI.md §10.4D 测试用例表 T1-T3

### 工具 · checklist 文档完备性（2026-08-27，来源：交付评审）【2026-08-31 销账：§6/§7 用例表已补】

- [x] ~~TOOLS.md §6（git 工具扩充）/§7（workdir/scriptFile）测试是散文总结，非用例表（§8/§8.1 已有完整表）——补成 输入/预期 用例表，与 §8 对齐~~——2026-08-31 回补：§6 补 T-g-1..12（add 分文件/push 远端/tag 三态/branch/checkout 快照/stash/reset hard/revert/参数校验/workdir/反向路由/status porcelain），§7 补 T-w-1..2（workdir 子仓库/越界）+ T-e-1..6（scriptFile/nodeArgs --check/越界/缺参/禁 flag/路由描述），格式对齐 §8（输入/预期/对应需求）。

### 测试 · test/ 纳入 lint（2026-08-30 来源 CLI-LINT-TUNING §2.4；2026-08-31 销账）

- [x] ~~CLI `test/` 目录纳入 lint（对齐 vscode 端 lint 含 test 的做法）~~——2026-08-31 落地：eslint.config.mjs 加 test 段（globals 补 Event/require——webview 事件 dispatch 与集成测试清理守卫）、lint script 改 `eslint src test`、存量 62 条清零（38 unused：args 改 `_` 前缀 + 死 import/死解构删除；18 control-regex 加 disable 注明"断言 ANSI 转义"；4 regex-spaces 改 `{2}` 精确量词；2 no-undef 由 globals 声明）。教训沉淀：删 unused 解构时**同名变量可能在不同 test 作用域各有声明**（texts/mkdir/writeFile 各踩一次），逐处验证用途再删，不能按符号名全局替换。

### TUI · agent-turn.mjs 超 500 行硬限（2026-08-30，来源：TUI 文档质量审计）【同日销账：已拆】

- [x] ~~`src/tui/agent-turn.mjs` 534 行已超 500 行硬限（AGENTS.md 🔴 级约束；§7.2 路由接线与冻结逻辑扩张所致）~~——2026-08-30 拆分落地：工具事件回调 + flushStream 迁出至 `src/tui/tool-events.mjs`（344 行，新模块）、完成冻结三函数归位 `subagent-blocks.mjs`（253 行，数据层本位，并消除 onToolResult 三处重复冻结循环 → freezeDoneSubTasks/freezeAllSubTasks）、标题生成段下沉 `generate-title.mjs` `ensureSessionTitle`；agent-turn 余 174 行（纯回合驱动器）。787/787 全绿，行为零变化（既有测试全锁定）。

### 模型 · GLM-5.3-Flash 交付评审遗留（2026-08-28，来源：交付评审）

- [x] ~~`src/config.mjs` 约 328 行超 300 行阈值——建议把 MODEL_SPECS / PROVIDER_PRESETS 表格抽到独立 spec 模块~~——2026-08-31 落地：MODEL_SPECS + specForModel 抽至 `src/model-specs.mjs`（config.mjs 358→266 行回到建议线内；config **re-export** specForModel——23 个既有 importer 零改动；PROVIDER_PRESETS 仅 23 行留下不抽）；COMPACT_RATIO 归 config（压缩阈值概念本位）。PROVIDER.md §11 T2 用例仍缺（下条）
- [x] ~~PROVIDER.md §11 测试表 T2（read_image 对 glm-5.3-flash 不拒绝）未直接写成自动化用例，仅靠 multimodal=true 断言间接覆盖——择机补 readImageTool.execute 用例~~——2026-08-31 销账：`test/tools.test.mjs` "read_image: glm-5.3-flash 多模态放行（PROVIDER.md §11 T2，2026-08-31 补自动化）"——直接调用 readImageTool.execute 断言不抛拒绝且返回 data:image/png 结果（agent.test.mjs:407 T1 spec 断言同在）
### Provider · core.mjs 拆分（2026-08-28，来源：Qwen enable_thinking 交付评审 #4）【2026-08-31 销账：normalize 抽出】

- [x] ~~`src/provider/core.mjs` 419 行超 300 建议线（接近 500 硬限）——body 组装（含 enable_thinking 注入段）或 stripImages/normalizeToolPairing 抽独立模块~~——2026-08-31 落地：`stripImagesForTextModel` + `normalizeToolPairing`（发送前载荷净化，纯函数、无 chat/重试内部依赖）抽至 `src/provider/normalize.mjs`（82 行）；core.mjs 420→350 行（chat 主流程 + 重试/列表为不可再分的调用核心，345± 为该职责的体量下限，记录为现状）；core **re-export** 两函数——provider/index.mjs 与 tool-pairing.test.mjs 引用零改动。非本轮引入，择机条目按期销账。

### 测试 · 慢测试 fs 优化候选（2026-08-30，来源：测试分层改造）【2026-08-31 销账：真因不在 saveSession】

- [x] ~~`agent.test.mjs` "session: 保存/恢复/新建 往返" 单测 16.4s、checkpoint 回滚 7.6s——疑似临时目录 fs 抖动/全量副本策略~~——2026-08-31 定位并修复：**真因是"原子写不残留 .tmp"断言扫描了 `~/.thincoder/sessions/` 全目录**（readdirSync 实测 18s——用户机上 31123 个文件、含 22MB 大会话，Defender 干扰放大；独立复现 saveSession/loadSession 全序列仅 16ms，用例其余逻辑 <15ms）。修复：改为 existsSync 直探本槽位 `.tmp` 路径（O(1)），断言语义不变。16.4s→**17ms**。checkpoint 7.6s 属 git 子进程真实成本，保留 slow 层。


### 记忆 · memory_delete 边缘容错（2026-09-01，来源：delivery review #8）

- [ ] `deleteByUid` 对畸形 uid（如 `personal:5:extra`）静默删目标 id（rest[0] 通过且 trailing 段被忽略）——工具生成的 id 均规范（实际不可达），低优先级加固：rest 长度校验或 strict 解析

### MCP · readMcpSection servers 非数组静默当空（2026-09-01，来源：MCP §5 交付审计 #4）

- [ ] `config.mjs readMcpSection`：`mcp.servers` 存在但非数组（如 `"x"`）→ 返回 `ok:true, servers:[]` 被当"disk 为空"——未连接的内存 server 从菜单消失且无 ⚠ 提示（比 JSON 解析失败更隐蔽）。改判 `ok:false` 走畸形回退（方向见本条；MCP.md §5 补记仅留指针——评审 #3 设计文档不承载待办，实现待补）

### MCP · 面板消息路由测试缺口（2026-09-01，来源：MCP §4 交付审计）

- [ ] `src/extension/panel-messages.mjs` 路由层无测试触达（reconnectMcp/editMcp/testMcp 三 case 零覆盖）——VS Code [Reconnect] 死按钮正是「webview 发消息 + 路由缺失」这种无测试接缝处的复发实例；补最小路由断言（消息 → 对应 handler 调用），防同类回归

### TUI · 渲染/回调模块 300+ 行 advisory 存档（2026-08-30，来源：agent-turn 拆分评审）【2026-09-01 更新：render-conversation 573 行超 500 硬限，见下条】

- [ ] `src/tui/render-conversation.mjs` **573 行（超 500 硬限，2026-09-01 §7.2.1 后实测）**——组件化后自 630 降 573（runningSubs 段迁出 subagent-panel.mjs），仍超硬限——剩余主体 frozenSubTask/advisor/tool-block 折叠装配；建议后续拆分（frozen/tool-block 段渲染独立模块）。附：frozen 头 `▶ [✓ …]` 未做宽度截断（§7.2.1 评审 #1 标注存量）——顺手一并处理
- [ ] `src/tui/tool-events.mjs` 344 行超 300 建议线——状态栏分支（onToolCall 的 name→status 映射表）可表驱动压缩；刚随拆分落成，观察增长再动


### 子agent · 活动输出统一（2026-08-29，来源：需求澄清；需求定稿见 AGENT-LOOP.md §7.2）

- [ ] ACP 桥结构化映射（评审 #1 方案 a 已裁定：`⟦ev⟧` 事件剥除随 §7.2 本轮落地（D7）；对 ACP 的结构化映射为 tool_call_update 留本条后续做）
- [x] ~~outputPanels 死代码清理~~——已随 §7.2 D6 落地（2026-08-30，layout/render-frame/render-loop 三处删除；`test/render-loop.test.mjs` 源码回归断言全仓无写入方）
- [~] VS Code 端跟进项已移除（2026-08-30 用户裁定）：跨项目待办不入本项目 TODO——thincoder 与 thincoder-vscode 各自独立流程，将来做时在 vscode 项目内立自己的需求/TODO（含 webview 宿主侧 advisorChunk/subagentChunk 路由合并）

### Subagent · 角色能力矩阵动态化（2026-08-28，来源：kimi/opencode 对照研究）

- [ ] 档位 B：subagent 工具 description 按模式+调用方 allowlist 动态装配"角色×工具"矩阵（对标 kimi buildProfileDescriptions / opencode registry 动态渲染）——工具集变化时描述自动跟随；2026-08-28 已落档位 A（静态充实版 description + 防泄漏断言，两端对齐），B 留待工具集真频繁变化时再动（round3 #7：Done 区残骸已并入本条，不再双处维护）

### 文档完备性补挂（2026-08-30，来源：文档全量扫描发现的漏挂项）

- [x] ~~PROVIDER §12 `thinking_budget`（限思考 token 上限）——决策表注明"记 TODO"但未入本清单，补挂（独立增值项，与本轮 enable_thinking 正交）~~——2026-08-31 用户终裁：**否掉（评估后过度工程）**。理由：①现有兜底链已覆盖真实痛点（maxTokens 调大/reasoningEffort 降档/Partial Mode 续写/DeepSeek prefix 续写——真实案例均非"兜底失效"而是"参数未配"）；②支持面窄（2026-08-31 核实矩阵：仅百炼 extra_body.thinking_budget 与 Claude budget_tokens（≥1024 且 <max_tokens 有坑）原生支持；DeepSeek官方/GLM/Kimi/MiniMax/Doubao 均无 budget；deepseek 预设走官方端点即不支持）；③业界趋势收敛回 effort 档位（Claude 新模型 adaptive+effort、Gemini 3+ thinkingLevel），token 预算接口在退场。**临界条件**：若将来出现"百炼用户 maxTokens 拉满仍空响应（思考吃光预算）且调档位不解决"的真实案例，按 30 行内百炼-only 注入（extra_body.thinking_budget，enable_thinking 同注入点）随手补，不欠账。
- [x] ~~CLI `test/` 目录纳入 lint~~——已销账，见上节（2026-08-31）
- [x] ~~config.schema.json 同步机制~~——**2026-08-31 用户裁定：彻底删除**（非放弃维护）。核实其从未闭环：①线上 URL（saveConfig 注入的 `https://thincoder.dev/schemas/config.json`）从未部署——thincoder.com 仓库无 schemas 目录；②代码从不消费该文件；③DEFAULTS 顶层 25 键仅覆盖 5，providers 层 20 键从未进 schema——维护成本 > 价值。处理：删 `docs/schemas/`、删 saveConfig 的 `$schema` 注入（今后写出的 config.json 不再带该字段，存量字段无害残留）、README 失实宣传行删除。ROADMAP-0.9.0 的历史计划条目按快照规范保留。

### 压缩调优遗留（2026-09-02，来源：压缩目标调优 code review）

- [ ] **文件行数拆模块**（code review #3/#4，advisory 非阻塞）：CLI `src/context.mjs` 499 行 + VS Code `src/compact.mjs` 496 行——均超 300 行 advisory、距 500 硬限 ≤4 行。拆法：探索蒸馏段（CLI L360-499 / VS Code L363-495：EXPLORE_TOOLS/EXPLORE_SUMMARY_PROMPT/distillExplorations/summarizeRunExplorations 系）拆为独立模块（如 `context-explore.mjs`），压缩主路径留在原文件回到 ~360 行。拆前过设计评审（模块归属 CONTEXT-COMPACTION.md §5/ARCHITECTURE.md §5）。

### 开发体验三项（2026-09-02，来源：用户需求批——**已实现（2026-09-02 两端落地）**，设计落点见各条）

- [x] **开发① 删 eslint 全套改 node --check**（TOOLS.md §10.2：devDependencies + eslint.config.mjs 删除，lint script 改 node scripts/check-syntax.mjs；CLI-LINT-REQUIREMENTS/TUNING.md 标记被取代）
- [x] **开发② 工具工作目录作用域限制全部移除**（TOOLS.md §10.1：resolveInCwd 去断言；git workdir/execute scriptFile 越界检查一并移除；工具描述同步）
- [x] **开发③ 模型上下文长度可配置（K 单位）**（PROVIDER.md §15：providers[].context 覆盖 spec；providerSpec 全链路跟随；CLI /model + VS Code settings 配置界面）

### 用户问题批（2026-09-02，来源：用户口头提出 5 条——**已实现（2026-09-02 落地）**，设计落点见各条）

- [x] **Q1 会话恢复 provider/model 缺失**——**已实现（2026-09-02）**：SESSION.md §8 落地——validateProvider + TUI 首帧重选 + headless 退出码 1；测试 session.test.mjs 14 用例 + tui.test.mjs 5 用例：CLI 退出重进时，会话引用的 provider 或 model 已不存在 → 直接报错退出进不了 TUI；期望给用户一个界面重新选择模型。**设计已定稿：SESSION.md §8**（D-S1 判据改空判据——MODEL_SPECS 未知不判无效，评审 #1/#2 已修正）
- [x] **Q2 压缩进度感知**——**已实现（2026-09-02）**：CONTEXT-COMPACTION.md §7 落地——压缩面板（子 agent 区块机制）+ 三态状态机；测试 agent.test.mjs T1-T4 + subagent-blocks.test.mjs T5：上下文压缩时 LLM 摘要耗时长 → TUI 无"压缩中"反馈像僵死；现状 `onCompress` 是**压缩完成后**才触发（agent.mjs:187/196），TUI 只打一行 `[context] Context too long...` warn（tool-events.mjs:402）。期望：压缩**开始**即提示 + 压缩会话像子agent 面板那样显示（可见进度/完成）。**设计已定稿：CONTEXT-COMPACTION.md §7**（D-C2 压缩面板——复用 subagent-blocks 区块机制，用户要求形态）
- [x] **Q3 压缩失败静默飞出**——**已实现（2026-09-02）**：三根因全落地——① prefix 续写止损（PROVIDER.md §14.2/14.3，buildContinuationMessages，真机矩阵实证）② reasoning_content 回传（续写构造规范化一并覆盖；03:11 偶发后未复现）③ hex escape（PROVIDER.md §14.6，escape v5 + UTF-16 安全截断，真机 400→200）；失败可见性（压缩面板失败态）：压缩出错（尤其 deepseek）→ 程序直接飞出零提示。**三根因**：① **prefix 续写 400（Function call should not be used with prefix）**——deepseek 系列 `prefixMode: true`，截断触发续写发 `/beta` + `prefix:true` + 全量历史（含 tool_calls）→ 网关 400（Kilo/dify issue 同款）。**设计已定稿：PROVIDER.md §14.2/14.3（止损：prefix 续写精简历史——过滤工具消息，保留 ≤8 条文本；根治：buildContinuationMessages + 失败可见性）——已实现（CLI，2026-09-02）**；VS Code 端待实现见 PROVIDER.md §14.7；② **reasoning_content 回传 400**——thinking 模式历史 reasoning 未回传；03:11 复现一次后无法再复现（疑服务端临时状态），续写构造规范化（14.2/14.3）一并覆盖——**已实现（CLI，2026-09-02）**；③ **hex escape 400——已修（2026-09-02）**：真凶 = doc_search 预览 slice 截断切断 emoji 代理对 → 孤立 UTF-16 代理 → deepseek 严格解码 400。落地：escape.mjs v5 sanitizeLoneSurrogates + setup.mjs/helpers.mjs safeSliceUTF16 源头修复（详见 PROVIDER.md §14.6，真机 200 验证）；另：压缩失败静默（agent.mjs:183 catch 无 console.error）→ 补可见性（CONTEXT-COMPACTION.md §7 设计已定稿）——**已实现（CLI，2026-09-02，压缩面板失败态）**；VS Code 端待实现见 §7 D-C3。escape v3 已修 hex escape 类（本问题另一独立根因）。
- [x] **Q4 MCP save&test 确认问句废除**——**已实现（2026-09-02）**：MCP.md §5 变更段落地——probe ✓ 直接保存 / ✗ 回表单零保存通道；测试 T16'/T17'/T18'/T25 + T23b/T23c：刚刚 §5 v2 的 `Save? (Y/n)`（探活成功）/`Save anyway? (y/N)`（失败）问句——用户裁定**不需要问**：保存时直接探活 → 正常即保存；失败报错让用户改。**用户 2026-09-02 终裁：探活失败不提供任何保存通道（save-anyway 整个废除——"探活失败还存干嘛"）**。**设计已定稿：MCP.md §5 变更段**（D-Q1 confirmLoop 重构——probe ✓ 直接保存、✗ 报错回表单；T16/T16c/T17 重写 + T25 新增）
- [x] **Q5 搜索工具优先级引导**——**已实现（2026-09-02）**：PROMPT-DECOUPLING.md 变更段落地——discipline.md + engineering.md 行为规则（两端 byte-identical）；测试 T1/T4 断言：提示词应把 websearch（Bing）定位为**纯备选**——有 MCP 搜索服务（glm-websearch_web_search_prime 等）时必须优先用 MCP，Bing 只在其不可用/失败时兜底。现状：discipline.md:72-73 工具表已标注（"weak for technical; MCP search tool first" / "primary when available"）但只是**表格罗列，非强制规则**。**设计已定稿：PROMPT-DECOUPLING.md 变更段**（D-P1 discipline.md 行为规则：MCP 优先/websearch 备用/连续 2 次垃圾即切/镜像路径优先/动手前扫工具表）




## 已关闭（Done）

- [x] 语义一致化 4 项（hasCodeMutations src/ 判定、dispatch 未知路径保守、isDocOnlyChange src/ 排除、直接单测）
- [x] Verify 文档改动快路径（VERIFY-DOCONLY.md）
- [x] Token 不消费——已确认（二次 spawn 测试锁死，T14）
- [x] 门禁豁免收紧（isProductCode，含 src/prompts/*.md）
- [x] 评审范围显式化——doc review 端已实现（documents 参数）
- [x] 父代理 code review 回归主代理发起（eng-coder 自评裁定不可行，已回滚）
- [x] ENGINEERING-MODE.md 三层结构补全（需求/非功能/测试用例/错误恢复等）
- [x] METHODOLOGY.md 剥离平台实施细则，重写为用户级方法论
- [x] Project TODO 机制（docs/TODO.md）+ 方法论规范

（本节已并入上方 Open 区同名条目，round3 #7 清理——此处不再保留）

### async settle 挂起缺陷（2026-09-02，来源：用户实测——待复现定位）

- [ ] **同回合两个 async 子代理——第二个完成后主 agent 长期 processing（十几分钟）卡住**（用户两次 Ctrl+C 均因此）：第一个正常注入，第二个"已完成（区块输出完毕）但主 agent 收不到"。候选卡点 A-D：digest LLM 挂起（600s fetchTimeout）/ runAgent 开头 await 上轮 \`_pendingDistill\`（distill LLM 挂起）/ digest 触发压缩摘要挂起 / settle 唤醒丢失。**诊断插桩已撤除（2026-09-02——[diag] 干扰正常显示）**——复现时按插桩点清单重加（曾落于 eea8fcc，可 git show eea8fcc 取 diff 恢复）：① context.mjs distillExplorations/summarizeRunExplorations/compressIfNeeded chat 前后（chatStart/chatDone/chatFail）② agent.mjs runAgent 开头 _pendingDistill await 前后 ③ subagent.mjs settle 回调（id/耗时/suspended/waiters 数）④ agent-turn.mjs digestTurn enter/exit + suspensionSession 每轮迭代/进 wait。**复现**：同回合派两个 async → 第二个卡住时（先别 Ctrl+C）复制终端 [diag] 行。**判读**：digestTurn:enter 无 exit → 看 runAgent:awaitPendingDistill / compressIfNeeded:chatStart 有无 chatDone（B/C），皆无则 A（600s 后 chatFail 证实）；asyncSubagent:settle 有但 suspensionSession:wait exit 无 → D。复现后：定位修复 → 全量验证。


### §19 遗留硬化（2026-09-03——来源：§19 交付 advisor 发现——归 §15/§17 后续轮）

- [ ] **并行 check 双消费竞态**（subagent-async.mjs check——同批两个无 id check 并行可能双消费同一条目——§15 遗留特性：旧 subagent_check 同为 readonly 可批并行——修复需牵动 settle 回调挂起记账）
- [ ] **挂起期阻塞 check 双投**（LOW-3——挂起态 check 与 settle 记账交互——同归 §17 硬化）


### §19.5 交付跟进（2026-09-03——来源：id:9 交付报告 + advisor 🟡——父代理裁量）

- [ ] **index.mjs 545 行 / render-conversation.mjs 576 行超 500 硬限**（既有债——基线 524/573——cancelSubagent/mouse ctx 装配可迁 mouse.mjs——拆分轮立项）
- [ ] **sync（阻塞）spawn 区块 ⏹ 语义裁决**：面板无池信号无法区分 sync/async——sync 运行中 ⏹ 可见但不可中止（已实现"可操作指引"提示 Ctrl+C）——彻底方案（⏹ 按池成员门控）需跨 TUI 数据流改造——用户裁决后立项
- [ ] **setup.mjs 受限变体 schema 描述补 cancel 词**（工具层错误信息已含——描述层同步）

