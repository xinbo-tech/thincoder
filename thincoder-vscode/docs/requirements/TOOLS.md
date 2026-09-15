# 工具系统（TOOLS）— 需求

> 板块：工具系统（注册表 / 调度 / 安全边界 / 描述装载）。需求层文档（`docs/requirements/`）。
> 定位：本仓机制实况登记——注册表 `src/tools/index.mjs`（77 行，`builtinTools`）；描述装载 `src/tools/shared.mjs`（414 行，`DESC`）；设计 = `docs/design/TOOLS.md`（含逐工具契约与批次节）。
> 对位注记：与对端同名需求档 `TOOLS（CLI 仓·需求）`**语义同源**；本端适配增强面独立（VS Code 原生能力——编辑器编辑 / 语言服务 / webview 审批）。
> 状态：**现行**。

## 1. 总体需求

工具是模型作用于外部世界的**唯一入口**。工具系统必须做到：注册面单一可枚举、调度确定、安全边界可解释、
描述文本足以让模型正确路由、**配置申报与消费一一对应**。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| F1 | 注册面单一 | `builtinTools`（`src/tools/index.mjs:50`）为权威列举面——新增 / 删除工具改一处且可被探针枚举（`read_image` 例外：按 multimodal 装配单独挂载） |
| F2 | 统一契约 | 每工具 = `{name, description, parameters, readonly, …, execute}` → `toOpenAISchema`（OpenAI function schema）；execute 返回字符串（dispatch `String(raw)`、AbortError 重抛） |
| F3 | 描述外部装载（25 档） | `DESC(name)` 运行时装载（原 `src/tools/shared.mjs:15`——W2 已迁核：核 `loadToolDoc` + 本端 `toOpenAISchema` 注入）；25 档描述在位（W2 已迁核——现体 = 核包 `tool-docs/`）、`description: DESC(` 接线命中 25 处——描述含参数 / 路由 / 反模式（工具选择面与对端同构） |
| F4 | 工具面按角色 / 深度缩减 | 只读角色（explore / plan / consult，depth>0）仅只读集（`src/agent/setup.mjs:195`）；`question` 全 depth>0 剔除（后台子代理永不弹用户）；eng-coder spawn 机械门禁（token） |
| F5 | 调度确定 | 连续只读工具并行、连续 subagent 并行（上限 `MAX_PARALLEL_SUBAGENTS`）、其余单条；**批间串行**、结果按调用序提交；前置门禁单点判定（批扫描 + 逐项共用） |
| F6 | 权限审批 | 逐工具弹窗（approve / deny / approve-all）+ 批合并询问 + diff 预览（原生 diff）；`autoApprove` = 活事实源（轮中翻转下一条即生效） |
| F7 | 结果落盘 + 写时自清理 | 结果超 64K 字符落盘 `<cwd>/.thincoder/tmp/tool-<id>.txt` + 双端预览（`MAX_TOOL_RESULT = 64*1024`——`src/agent/run-helpers.mjs:77`）；落盘目录写时自清理超龄档（保留 3 天） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| N1 | 安全模型 | 信任模型 + 审批门控 + 快照为**真实防线**；不以文本匹配拦截破坏性操作（「安全剧场」已否决） |
| N2 | 路径边界 | **无目录限制**（相对路径相对 cwd、绝对路径原样）——审批 + 快照为防线；工具描述措辞与实现一致（「no directory restriction」） |
| N3 | 命令 | 零文本拦截（破坏性命令走审批 + 快照）；bash 超时 120s；Stop 整树杀 |
| N4 | 网络 | SSRF 防护（localhost / 内网 / 云元数据 `169.254.169.254`）；响应体上限 + HTML 转文本 |
| N5 | 执行边界 | `execute` = 纯净 node ESM 子进程（无伪沙箱、无预置全局）；超时 SIGKILL（默认 30s、上限 600s） |
| N6 | 打包面 | `.vscodeignore` 不排除 `src/**/*.md`——25 档描述随扩展发布（发布前清单核对 `vsce ls` 面） |
| N7 | 测试面 | `test/tool-descriptions.test.mjs` 全绿（描述装载面断言）；工具面既有用例零回归 |

## 4. 范围边界（不做）

- 不重述逐工具语义（设计档 + 各工具 `.md` 描述为权威——D2 单一权威源）。
- 编辑族细节住 `docs/design/EDIT.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` / `INSERT-AFTER.md` / `EDIT-HELPERS.md`（各档自持，不重述）。
- 配置形状护栏住本仓 `SETTINGS-TOOL.md` 档（settings 工具面不重述）。
- 不做文件系统沙箱 / 命令文本黑名单拦截 / `execute` 伪沙箱（均已否决在案）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 C 轮——异层者建档；内容 = 既有机制实况登记，零新需求语义）。
