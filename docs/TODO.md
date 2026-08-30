# 项目待办（Project TODO）

> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示）汇总于此，不散落在设计文档中。
> 设计文档只承载设计本身——待办变更不应触发设计文档变更（避免不必要的 doc review）。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。

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
- [ ] 多设计并行 token 映射化（单值 token → {designPath: token}）

### Issue 批量（2026-08-22，来源：Gitee/GitHub issue 巡检）

- [x] IK9IXD 数学公式渲染——已实现（`src/tui/math.mjs` LaTeX→Unicode，commit 127130a）——2026-08-25 核对销账
- [x] IK9UWM Windows 中文粘贴乱码——已实现（clipboard UTF-8 + BOM 剥离，commit 5c72ec2）——2026-08-25 核对销账
- [x] GitHub thincoder#1 embedding 三件套——已实现（cmd-config.mjs embeddingPatch 补写 baseURL/model，引用 DEFAULTS）——2026-08-25 核对销账
- [x] IK9UZ8 思考型模型标题生成失败——CLI 已实现（commit 3c1815e）；vscode 侧状态见 vscode TODO 同名条目
- [x] GitHub thincoder#2 GLM tool_calls 畸形解析——已实现（openai.mjs droppedToolCalls 防御合并 + agent.mjs 丢弃提醒，0.12.37；vscode 端 128464b normalizeToolPairing）——2026-08-25 核对销账
- [x] TUI.md 章节号重编号——已修（2026-08-25，## 4-## 10 顺延，无重复）
### TUI · 子agent/advisor 模型显示测试（2026-08-26，来源：模型显示审计）【2026-08-30 核对销账：`[model]` 解析剥离已有专项单测锁定，见下条划线注记】

- [x] ~~`[model]` token 解析剥离补自动化测试（agent-turn.mjs 解析 / render-frame.mjs header）~~——2026-08-30 核对销账：已随 §7.2 D4 落地锁定（实现拆分至 subagent-blocks.mjs routeSubToken；header 渲染随窄带退役迁至 render-conversation.mjs）——`test/subagent-blocks.test.mjs` 专项单测（[model] 元数据只记录一次、后续 [model] 开头内容不吞；T2 无 token 降级由 ensureSubTask 默认态 model=undefined 保证）+ `test/agent-turn.test.mjs` 端到端用例多处（T-A/T-E 等）；契约见 TUI.md §10.4D 测试用例表 T1-T3

### 工具 · checklist 文档完备性（2026-08-27，来源：交付评审）

- [ ] TOOLS.md §6（git 工具扩充）/§7（workdir/scriptFile）测试是散文总结，非用例表（§8/§8.1 已有完整表）——补成 输入/预期 用例表，与 §8 对齐（低价值，回补文档，择机）

### 测试 · test/ 纳入 lint（2026-08-30 来源 CLI-LINT-TUNING §2.4；2026-08-31 销账）

- [x] ~~CLI `test/` 目录纳入 lint（对齐 vscode 端 lint 含 test 的做法）~~——2026-08-31 落地：eslint.config.mjs 加 test 段（globals 补 Event/require——webview 事件 dispatch 与集成测试清理守卫）、lint script 改 `eslint src test`、存量 62 条清零（38 unused：args 改 `_` 前缀 + 死 import/死解构删除；18 control-regex 加 disable 注明"断言 ANSI 转义"；4 regex-spaces 改 `{2}` 精确量词；2 no-undef 由 globals 声明）。教训沉淀：删 unused 解构时**同名变量可能在不同 test 作用域各有声明**（texts/mkdir/writeFile 各踩一次），逐处验证用途再删，不能按符号名全局替换。

### TUI · agent-turn.mjs 超 500 行硬限（2026-08-30，来源：TUI 文档质量审计）【同日销账：已拆】

- [x] ~~`src/tui/agent-turn.mjs` 534 行已超 500 行硬限（AGENTS.md 🔴 级约束；§7.2 路由接线与冻结逻辑扩张所致）~~——2026-08-30 拆分落地：工具事件回调 + flushStream 迁出至 `src/tui/tool-events.mjs`（344 行，新模块）、完成冻结三函数归位 `subagent-blocks.mjs`（253 行，数据层本位，并消除 onToolResult 三处重复冻结循环 → freezeDoneSubTasks/freezeAllSubTasks）、标题生成段下沉 `generate-title.mjs` `ensureSessionTitle`；agent-turn 余 174 行（纯回合驱动器）。787/787 全绿，行为零变化（既有测试全锁定）。

### 模型 · GLM-5.3-Flash 交付评审遗留（2026-08-28，来源：交付评审）

- [ ] `src/config.mjs` 约 328 行超 300 行阈值——建议把 MODEL_SPECS / PROVIDER_PRESETS 表格抽到独立 spec 模块（本次仅加一行，非本次引入）
- [ ] PROVIDER.md §11 测试表 T2（read_image 对 glm-5.3-flash 不拒绝）未直接写成自动化用例，仅靠 multimodal=true 断言间接覆盖——择机补 readImageTool.execute 用例
### Provider · core.mjs 拆分（2026-08-28，来源：Qwen enable_thinking 交付评审 #4）

- [ ] `src/provider/core.mjs` 419 行超 300 建议线（接近 500 硬限）——body 组装（含 enable_thinking 注入段）或 stripImages/normalizeToolPairing 抽独立模块；非本轮引入，择机

### 测试 · 慢测试 fs 优化候选（2026-08-30，来源：测试分层改造）

- [ ] `agent.test.mjs` "session: 保存/恢复/新建 往返" 单测 16.4s、checkpoint 回滚 7.6s——疑似临时目录 fs 抖动/全量副本策略；已入 slow 层不堵快层，但全量（发版必跑）仍受累，可优化 fixture 目录复用或副本策略


### TUI · 渲染/回调模块 300+ 行 advisory 存档（2026-08-30，来源：agent-turn 拆分评审）【同日更新：render-conversation 已随 fold-block 组件化降到 410 行；tool-events 未动】

- [ ] `src/tui/render-conversation.mjs` 410 行超 300 建议线（组件化后自 472 降 62 行）——剩余主体是长消息/连续 dim 折叠装配，已较薄，观察增长再动
- [ ] `src/tui/tool-events.mjs` 344 行超 300 建议线——状态栏分支（onToolCall 的 name→status 映射表）可表驱动压缩；刚随拆分落成，观察增长再动


### 子agent · 活动输出统一（2026-08-29，来源：需求澄清；需求定稿见 AGENT-LOOP.md §7.2）

- [ ] ACP 桥结构化映射（评审 #1 方案 a 已裁定：`⟦ev⟧` 事件剥除随 §7.2 本轮落地（D7）；对 ACP 的结构化映射为 tool_call_update 留本条后续做）
- [x] ~~outputPanels 死代码清理~~——已随 §7.2 D6 落地（2026-08-30，layout/render-frame/render-loop 三处删除；`test/render-loop.test.mjs` 源码回归断言全仓无写入方）
- [~] VS Code 端跟进项已移除（2026-08-30 用户裁定）：跨项目待办不入本项目 TODO——thincoder 与 thincoder-vscode 各自独立流程，将来做时在 vscode 项目内立自己的需求/TODO（含 webview 宿主侧 advisorChunk/subagentChunk 路由合并）

### Subagent · 角色能力矩阵动态化（2026-08-28，来源：kimi/opencode 对照研究）

- [ ] 档位 B：subagent 工具 description 按模式+调用方 allowlist 动态装配"角色×工具"矩阵（对标 kimi buildProfileDescriptions / opencode registry 动态渲染）——工具集变化时描述自动跟随；2026-08-28 已落档位 A（静态充实版 description + 防泄漏断言，两端对齐），B 留待工具集真频繁变化时再动（round3 #7：Done 区残骸已并入本条，不再双处维护）

### 文档完备性补挂（2026-08-30，来源：文档全量扫描发现的漏挂项）

- [ ] PROVIDER §12 `thinking_budget`（限思考 token 上限）——决策表注明"记 TODO"但未入本清单，补挂（独立增值项，与本轮 enable_thinking 正交）
- [x] ~~CLI `test/` 目录纳入 lint~~——已销账，见上节（2026-08-31）
- [ ] config.schema.json 同步机制——2026-08-30 已手工校准一轮（maxTurns 200/advisor guard+timeoutMs/proxy/shell/consultModels/subagentModels 等），但该文件无变更纪律触发点，易再漂移；建议：变更 config 默认值的批次把 schema 同步列入受影响文件清单


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
