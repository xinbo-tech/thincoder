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

### TUI · 工具输出统一（2026-08-01，长期改进）

- [ ] 所有工具输出统一为**行间区块**格式：`❯ toolName argSummary`（title）+ 内容区（最多三行滚动，超长截断），替代当前"面板流式 vs 行间同步"双轨
- [ ] 区块内容包括执行中实时输入/输出预览（非面板工具当前静默问题一并解决）
- [ ] 历史中保留完整结果（截断落盘机制复用），行间区块只是 UI 层预览

### TUI · 工具输出面板优化（2026-08-01）

- [x] ~~`renderOutput` 面板标题行~~——条目过时：面板区架构已废除（全部内联块渲染，见 TUI-TOOL-OUTPUT.md）；完成行 `❯ name — done(ms) → summary` 已实现（agent-turn.mjs）
- [x] ~~关闭规则统一~~——同上，面板废弃后不适用；内联块随会话历史持久化
- [x] 状态栏实时显示当前工具名——已实现（`render-frame.mjs:405` `state.currentTool` → 状态栏提示）

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
### TUI · 子agent/advisor 模型显示测试（2026-08-26，来源：模型显示审计）

- [ ] `[model]` token 解析剥离补自动化测试（agent-turn.mjs 解析 / render-frame.mjs header）——功能已实现（CLI 0.12.41），解析路径零测试锁定；契约见 TUI.md §10.4D 测试用例表 T1-T3

### 工具 · checklist 文档完备性（2026-08-27，来源：交付评审）

- [ ] TOOLS.md §6（git 工具扩充）/§7（workdir/scriptFile）测试是散文总结，非用例表（§8/§8.1 已有完整表）——补成 输入/预期 用例表，与 §8 对齐（低价值，回补文档，择机）

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

