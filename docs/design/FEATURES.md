# ThinCoder 功能全览

> 基于 `src/` 代码实际实现梳理，非文档转述。

---

## 一、文件工具（7 个）

| 工具 | 说明 |
|------|------|
| `read` | 读文件，行号+分页，可选 SHA256 哈希 |
| `write` | 写文件，原子操作，自动创建父目录 |
| `edit` | 精确字符串替换，防重复匹配 |
| `insert_after` | 按行号或正则定位后插入一行 |
| `hashline_edit` | 基于内容哈希的行编辑，免疫空格编码问题 |
| `apply_patch` | 统一 diff 多文件原子应用，任意 hunk 失败全回滚 |
| `delete` | 删除文件，git 跟踪文件需 force |

## 二、代码质量（2 个）

| 工具 | 说明 |
|------|------|
| `linter` | 自动检测项目 linter（node --check 快路径 + eslint/tsc/ruff/cargo/go vet 级联）——已取代旧 syntax_check |
| `verify` | 预完成自检：语法检查+diff+自审清单，支持 `full=true` 全量测试 |

## 三、Shell 与搜索（5 个）

| 工具 | 说明 |
|------|------|
| `bash` | 执行命令，stdout/stderr 分离，超时+信号控制，输出上限 200K |
| `glob` | 文件匹配，支持 `**` 递归，自动跳过 node_modules/.git |
| `grep` | 正则搜索文件内容，支持上下文行，200 条上限 |
| `ls` | 列目录，类型+大小+时间，目录优先，500 条上限 |
| `websearch` | Bing 搜索，返回标题+URL+摘要 |

## 四、网络（2 个）

| 工具 | 说明 |
|------|------|
| `fetch` | HTTP GET，HTML 自动转纯文本，20s 超时 |
| `read_image` | 读取粘贴板图片/视频，视觉模型直接看截图/UI/架构图 |

## 五、代码库理解（3 个，核心）

| 工具 | 说明 |
|------|------|
| `repo_outline` | 依赖关系图，自动注入启动时；支持聚焦查询单个文件 |
| `code_search` | 源码 FTS5 + 向量混合检索 + JSDoc 提取，26 种语言，仅索引 git 仓库 |
| `doc_search` | 文档按 ## 标题分块，混合检索 |

## 六、记忆系统（5 个）

| 工具 | 说明 |
|------|------|
| `memory_put` | 写入长期记忆（rule/knowledge/decision/pattern） |
| `memory_search` | 三层混合检索（personal/project/team），FTS5+向量+RRF |
| `memory_delete` | 按 id + scope 精确删除记忆（personal/project/team——2026-09-01 MEMORY.md §0.1；search/put 输出带完整 uid 供删除消费） |
| `doc_search` | 文档检索 |
| 记忆层 | personal（SQLite ~/.thincoder）、project（.thincoder/memory/*.md）、team（独立 git 仓库） |

## 七、Agent 控制（11 个）

| 工具 | 说明 |
|------|------|
| `task` | 任务分解追踪，状态栏 ✓n/m 进度，自动过滤已完成项 |
| `subagent` | 并发子 agent：explore（只读搜索）/ plan（只读设计）/ coder（完整实现） |
| `plan` | Plan Mode：只读探索+设计，用户批准后实施 |
| `goal` | 长期目标追踪，预算进度，75% 预警 |
| `verify` | 完成验证守卫 |
| `question` | 向用户提问，暂停等待回复 |
| `timer` | 思考时间预算，超时提醒去动手而非空想 |
| `consult_start` / `consult_check` / `consult_stop` | 多模型并行会诊（只读顾问，需配置 `agent.consultModels`） |
| `escalate` | 飞刀：把实现交给更强的模型亲自操刀（有写权限，候选池同 `consultModels`） |

## 八、版本控制（4 个）

| 工具 | 说明 |
|------|------|
| `git` | 综合工具：diff / status / log / checkpoint（list/create/rewind/cat/**versions**）；快照为全量副本（v2），commit 后仍可回滚。**versions**：列出某文件在所有快照中的历史版本（时间/size/hash），`rewind + path` 恢复指定版本。**全量恢复已禁用**（与 `git checkout -- .` 同等危险，静默丢弃快照后全部工作）——只允许单文件恢复。触发点：模型手动 + rewind 前 pre-rewind + **git 破坏命令 guard**（bash 检测到 checkout/restore/reset/clean 前自动快照未提交工作，命令放行不拦截） |
| `hashline_edit` | 按行内容哈希寻址编辑（抗空白/编码漂移） |

## 九、Slash 命令（17 个）

| 命令 | 说明 |
|------|------|
| `/auto` | 切换 AUTO 模式（全自动批准，无需确认） |
| `/plan` | 切换 Plan Mode |
| `/model` | 模型选择+供应商管理（增删改 key） |
| `/think` | 思考模式开关+推理力度（on/off/effort low/high/max） |
| `/config` | 配置管理（compactThreshold、embedding key） |
| `/session` | 会话归档列表/切换（最多 5 槽位） |
| `/new` | 新建会话（旧会话自动归档） |
| `/goal` | 目标设置/取消 |
| `/advisor` | 审查开关+模型选择 |
| `/eng` | 工程模式开关（严格方法论：design-before-code，见 design/ENGINEERING-MODE.md） |
| `/skills` | 列出项目技能 |
| `/mcp` | MCP 服务器管理（add/remove/connect/list） |
| `/reindex` | 重建代码索引 |
| `/restore` | 恢复 checkpoint |
| `/clear` | 清屏 |
| `/exit` | 退出 |
| `/help` | 命令列表 |
| `/upgrade` | 检查更新 |

## 十、模型适配（17 家供应商预设，30+ 模型）

| 供应商 | 模型示例 | 特性 |
|--------|---------|------|
| DeepSeek | v4-pro, v4-flash, chat | 1M 上下文，thinking mode，prefix 续写，reasoningEcho |
| Kimi | k3, k3-pro | 1M 上下文，thinking mode，multimodal，cache mode |
| GLM | glm-5-pro, glm-5-flash | thinking mode，reasoningEffort，tempRange 裁剪 |
| Qwen | qwen-3.8-max-preview | thinking mode，reasoningEffort |
| MiniMax | m3, m1 | 1M 上下文，thinking mode，multimodal |

适配内容：上下文窗口匹配、截断续写协议（prefix/partial）、思考模式 API、reasoning_content 回传策略、输出限制、温度范围裁剪。

## 十一、TUI 特性

| 特性 | 说明 |
|------|------|
| 纯 ANSI | 零依赖框架，alt buffer 切换，退出自动清屏，增量渲染无闪烁 |
| 流式输出 | token 实时滚动，thinking 灰色斜体 |
| 权限审批 | 操作前预览 diff/命令，y/n/a（a=开 AUTO） |
| 输入队列 | processing 时可继续打字，Ctrl+D 删队尾 |
| Ctrl+I 注入 | 中断当前流 + 插话 + 自动继续，子 agent 不受影响 |
| Ctrl+C 中断 | 中断+退出，或仅中断（processing 时） |
| 粘贴 | Ctrl+V 文本粘贴，Alt+V 图片粘贴（视觉模型） |
| Picker 菜单 | 模型选择、配置、Session 切换等统一菜单 |
| 行间区块与面板 | 工具输出 = 行间区块（`❯ title` → `│ ` 滚动 → done 行，面板区已废除）；todo 面板常驻；子 agent 活动 = 会话流内可折叠区块（TUI-TOOL-OUTPUT.md、AGENT-LOOP §7.2） |
| Session 恢复 | 启动时恢复上次会话，显示对话历史 |

## 十二、Session 与会话

| 特性 | 说明 |
|------|------|
| 持久化 | 每轮自动保存，最多 5 个归档槽位 |
| 状态恢复 | history、tasks、planMode、autoApprove、advisor、goal 全恢复 |
| Checkpoint | git 快照，退出前自动存，回滚可逆 |
| 跨 cwd 隔离 | 不同目录各自独立 session |

## 十三、安全与护栏

| 机制 | 说明 |
|------|------|
| 工作目录限定 | read/write/edit 禁止越界，realpath 双重校验 |
| bash 安全 | 零文本拦截（文本匹配是安全剧场）——真实防线 = 审批层 + git 破坏命令自动快照；detectDanger 危险标注只提示不拦截 |
| verify guard | 改文件未 verify → pushback 强行要验证（最多 2 次） |
| prompt 注入防护 | escapeXml + `<untrusted_*>` 标签隔离外部内容 |
| 视觉模型守卫 | 非视觉模型自动剥离 image_url，防 400 |
| TPM 闸门 | 本地滑动窗口限速，超预算自动等待，防 429 |
| 429 退避 | 尊重 Retry-After 头，无头则 15s/30s/60s 退避 |
