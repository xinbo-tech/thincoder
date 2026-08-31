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
- [x] ~~多设计并行 token 映射化（单值 token → {designPath: token}）~~——2026-08-31 用户终裁：**不做（过度工程）**。工程模式实际使用中同一会话并行多设计评审且随后各自派 eng-coder 的场景未发生（评审-实现串行）；文档锚方案（Y）已被用户否决（文档落地中回写状态/改名重组，任何文档锚都会失效）；若未来真有并行需求，评审实例表方案（token 内嵌 reviewId + 父代理评审实例表，文档仅审计不参与校验）可再议，勿提前实现。

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
- [x] ~~config.schema.json 同步机制~~——**2026-08-31 用户裁定：彻底删除**（非放弃维护）。核实其从未闭环：①线上 URL（saveConfig 注入的 `https://thincoder.dev/schemas/config.json`）从未部署——thincoder.com 仓库无 schemas 目录；②代码从不消费该文件；③DEFAULTS 顶层 25 键仅覆盖 5，providers 层 20 键从未进 schema——维护成本 > 价值。处理：删 `docs/schemas/`、删 saveConfig 的 `$schema` 注入（今后写出的 config.json 不再带该字段，存量字段无害残留）、README 失实宣传行删除。ROADMAP-0.9.0 的历史计划条目按快照规范保留。


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
