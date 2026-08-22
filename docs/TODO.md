# 项目待办（Project TODO）

> 项目级统一待办清单：所有来源的待办（设计遗留、评审发现、用户指示）汇总于此，不散落在设计文档中。
> 设计文档只承载设计本身——待办变更不应触发设计文档变更（避免不必要的 doc review）。
> 维护：工程模式下由架构师（agent）在对话中即时更新；用户在需要时增删。

## 待办（Open）

### 工程模式 · 模式感知 + 自切换（2026-08-01）

- [ ] 每轮用户消息注入工程模式状态提醒（仿 `planReminderForTurn`），让模型显式感知当前模式
- [ ] `engTool`（仿 `planTool`）：模型可调 `eng(action="on"/"off")` 主动进入/退出工程模式（会话级，不持久化）
- [ ] 工程模式关闭时注入状态声明以消除歧义

### TUI · 工具输出统一（2026-08-01，长期改进）

- [ ] 所有工具输出统一为**行间区块**格式：`❯ toolName argSummary`（title）+ 内容区（最多三行滚动，超长截断），替代当前"面板流式 vs 行间同步"双轨
- [ ] 区块内容包括执行中实时输入/输出预览（非面板工具当前静默问题一并解决）
- [ ] 历史中保留完整结果（截断落盘机制复用），行间区块只是 UI 层预览

### TUI · 工具输出面板优化（2026-08-01）

- [ ] `renderOutput` 面板加标题行（`❯ [toolName] — streaming` / `❯ [toolName] — done`），与 Permission 面板风格统一
- [ ] 所有 `outputPanel` 工具的关闭规则统一（延迟 3s + 摘要落回模型可见消息；或从 history 复读不丢）
- [ ] 非面板工具执行期间无进度反馈（write/read/grep/subagent 等静默等待）——考虑状态栏实时显示当前工具名 + 参数摘要（已有机位 `state.currentTool`）；长工具（subagent）考虑进度脉冲

### 工程模式 · code review 评审范围显式化（2026-08-01）

- [ ] code review 评审范围改为 task 的 Docs involved + 验收标准（不再遍历 git diff），与已实现的 doc review documents 机制对齐
- [ ] setup.mjs 提示词解耦（工程模式不注入 main.md/discipline.md；METHODOLOGY 缺失降级为工程模板+警告）——设计见 PROMPT-DECOUPLING.md
- [ ] 多设计并行 token 映射化（单值 token → {designPath: token}）

### Issue 批量（2026-08-22，来源：Gitee/GitHub issue 巡检）

- [ ] IK9IXD 数学公式渲染（CLI Unicode 近似）——需求层已入 `docs/design/TUI.md` §9.1
- [ ] IK9UWM Windows 中文粘贴乱码——需求层已入 `docs/design/TUI.md` §9.2
- [ ] GitHub thincoder#1 embedding 三件套落盘——需求层已入 `docs/design/TUI.md` §9.3
- [ ] IK9UZ8 思考型模型标题生成失败（两端同修）——需求层已入 `docs/design/SESSION.md` §7
- [ ] GitHub thincoder#2 GLM tool_calls 畸形解析崩溃（扩展端）——需求层已入 `thincoder-vscode/docs/design/ARCHITECTURE.md` 变更段
- [ ] TUI.md 重复章节号（两个 "## 4."，渲染管线/折叠交互）重编号——评审 🔵（2026-08-22 发现，未改）

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
