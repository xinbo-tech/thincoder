# VERIFY-REDESIGN — 需求

> 板块：verify 重构（声明式完成前门）。需求层文档（docs/requirements/）。
> 状态：已实现（终验收待核销）。
> 来源：2026-09-10 自 `../design/VERIFY-REDESIGN.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 2. 需求

### 总体

verify 是**语言无关、框架无关、项目无关**的通用编程 agent 收尾门禁。不内置任何语言/测试/模块逻辑，不替模型执行验证，只做**机械门禁判定**——要求**模型声明验证状态**，据此放行/打回。通用工具不 hardcode 项目私有结构。

### 功能性（用户故事）

- As a coding agent, I want verify 接受我的验证状态声明（是否已跑 + 结果如何），so that 它对任何项目通用、不锁语言。
- As a coding agent, I want verify 在我声明"跳过验证"时放行（须给理由），so that 无测试/改动无需测的项目不被误拦。
- As a coding agent, I want verify 打回消息说明"这类改动该怎么做验证"，so that 我（结合项目 AGENTS.md 的自然语言描述）知道该补什么。
- As a coding agent, I want 项目用 AGENTS.md 自然语言描述自己的验证方式（如"测试用 npm test"/"无自动化测试靠走查"），so that 验证决策由模型理解自然语言后自决，而非 verify 解析。

### 非功能

- 零语言假设（评审 #1 收敛）：verify 不含**强制/必需**的语言特定执行；可选语法提示（D-V5）仅在改动为 .js/.mjs 且 node 存在时作软提示，**不进门禁**（不阻断 done；无 node/非 JS 不适用也不报错）。
- 不执行验证——验证命令由模型（读 AGENTS.md 自然语言后）自行执行，verify 只验收状态。
- 机械检查保留——doc-only 快路径、task/checklist 报告仍做（通用收尾）。
