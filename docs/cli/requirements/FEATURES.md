# ThinCoder 功能全览（FEATURES）· CLI 面 · 需求

> 板块 = **功能清单**（CLI 产品当前提供的能力——功能性需求现状）。
> **配对设计档 = 无**——本条目不设设计档（能力清单不承载机制设计；逐能力的契约与实现坐标见各自板块设计档，本档只作**清点与回指**）。层归属 = **CLI 面**（P2——含 CLI 专有的终端界面 / slash 命令面）。
> 本档基于**现行实现**梳理（`thincoder-core/**` 共享面 + `thincoder-cli/src/**` 壳面）——**代码 / 提示词与本清单不符时：要么改实现，要么走需求变更改本档，不允许两边各说各的**。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/requirements/FEATURES.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标与清点 = **as-of 2026-09-15 实核**（登记面 = `thincoder-core/tools/index.mjs` · `thincoder-core/agent-tools.mjs` · `thincoder-cli/src/tui/slash-commands.mjs`）。

## 1. 总体需求

**为谁解决什么问题**：让使用者（与模型）**一眼知道这个产品现在能做什么**——工具面提供哪些能力、命令面有哪些入口、界面与护栏有哪些保证。清点必须与实现一致：清单是能力面的**需求基线**，实现是它的兑现。

**范围边界（明确不做）**：本档不写机制设计（各板块设计档承载）、不写实现坐标（只登记清点面）、不写产品级定性（项目层需求档承载）。

## 2. 功能性需求（能力清单）

### 2.1 文件工具

| 工具 | 说明 |
|---|---|
| `read` | 读文件，行号 + 分页，可选逐行哈希 |
| `write` | 写文件，原子操作，自动创建父目录 |
| `edit` | 行号形态 / 内容形态二选一 + 三级匹配（宽容档序）——见 `docs/core/design/EDIT.md` |
| `insert_after` | 按行号或正则定位后插入一行——见 `docs/core/design/INSERT-AFTER.md` |
| `hashline_edit` | 基于内容哈希的行编辑，免疫空格与编码差异——见 `docs/core/design/HASHLINE-EDIT.md` |
| `apply_patch` | 统一 diff 多文件原子应用，任一 hunk 失败全回滚——见 `docs/core/design/APPLY-PATCH.md` |
| `delete` | 删除文件；版本控制跟踪的文件需显式 `force` |
| `file_ops` | 移动 / 复制 / 重命名文件或目录 |
| `read_image` | 读图片交给视觉模型（**模型门控**：仅多模态模型装配） |

### 2.2 代码质量

| 工具 | 说明 |
|---|---|
| `lint` | 自动检测语法（`node --check` 快路径 + 语言级联） |
| `lsp` | 语言服务面：定义 / 引用 / 悬停 / 符号 / 诊断 |
| `verify` | 通用验证门禁——模型声明 `verification.status`，工具机械判定放行 / 打回，不替模型跑测试 |
| `execute` | 执行 JavaScript（内联或脚本档；`node --test` / `--check` 亦走此路） |

### 2.3 Shell 与搜索

| 工具 | 说明 |
|---|---|
| `bash` | 执行命令，stdout / stderr 分离，超时 + 信号控制，输出带上限 |
| `glob` | 文件匹配：`**` 递归 + `{a,b}` brace + `!` 排除；自动跳过 `node_modules` / `.git` |
| `grep` | 正则搜索文件内容，支持上下文行与条数上限 |
| `ls` | 列目录：类型 + 大小 + 时间，目录优先，条数上限 |
| `tree` | 目录树（深度参数，跳构建 / 版本库目录） |
| `websearch` | 搜索（后端由 `websearch.apiKey` 触发：有 key → Tavily；无 key → Bing 兜底） |

### 2.4 网络

| 工具 | 说明 |
|---|---|
| `fetch` | HTTP GET，HTML 自动转纯文本，超时受控 |
| `websearch` | 见 §2.3 |

### 2.5 代码库理解

| 工具 | 说明 |
|---|---|
| `repo_outline` | 依赖关系轮廓；支持聚焦查询单个文件 |
| `code_search` | 源码全文 + 向量混合检索（含语言提取）；非 git 项目走 walk 回退（`docs/core/design/PORTABILITY.md` §3.3） |
| `doc_search` | 文档按标题分块后混合检索 |

### 2.6 记忆系统

| 工具 / 面 | 说明 |
|---|---|
| `memory` | 三层记忆读写检索（personal / project / team），混合排序 |
| 记忆层 | personal（用户级 SQLite）· project（项目 `.thincoder/memory/`）· team（独立 git 仓） |
| `settings` | 设置面读写（配置项的模型可见入口） |

### 2.7 Agent 控制

| 工具 | 说明 |
|---|---|
| `task` | 任务分解追踪，进度显示，自动过滤已完成项 |
| `plan` | Plan Mode：只读探索 + 设计，用户批准后实施 |
| `goal` | 长期目标追踪，预算进度与预警 |
| `subagent` | 子代理族——动作含 `spawn` / `status` / `observe` / `send` / `escalate` / `cancel` / `panel` / `consume-design`；角色 = explore（只读搜索）/ plan（只读设计）/ coder（实现）/ eng-coder（工程实现，需设计令牌）/ eng-designer（设计写作） |
| `verify` | 见 §2.2 |
| `timer` | 思考时间预算，超时提醒去动手 |
| `advisor` | 独立设计 / 代码评审（只读子代理） |
| `eng` | 工程模式开关 |
| `question` | 向用户提问并暂停等待回复 |
| `checklist` | 项目级任务清单（跨会话跟踪） |
| `skill` | 项目技能列出 / 调用 |
| `read_history` | 读会话历史（检索会话面消息） |
| `recent_changes` | 显示本次运行改过的文件 |
| `batch_segment` | 批次档分段写入（一段一作者——按调用者身份定段） |
| `consult_start` / `consult_stop` | 多模型并行会诊（只读顾问；需配置 `agent.consultModels`） |
| `peer_instances` | 列出同工作区的其它实例（多实例协作面） |

**escalate（飞刀）现状**：不再是独立工具——已并入 `subagent` 的 `action:"escalate"`（把实现交给更强的会诊模型亲自操刀，候选池同 `consultModels`）。

### 2.8 版本控制

| 工具 | 说明 |
|---|---|
| `git` | 综合工具：diff / status / log / checkpoint / add / commit / push / tag / branch / checkout / restore / stash / reset / revert / merge / cherry-pick 等动作族；快照为全量副本 |

### 2.9 Slash 命令（26 个 · 实核）

登记面 = `thincoder-cli/src/tui/slash-commands.mjs:39`。

| 分组 | 命令 |
|---|---|
| Agent | `/plan` · `/auto` · `/eng` · `/advisor` · `/model` · `/submodel` · `/goal` · `/think` |
| Session | `/new` · `/session` · `/rename` · `/clear` · `/copy` · `/fold` · `/undo` |
| Project | `/init` · `/skills` · `/mcp` · `/reindex` · `/extract` |
| System | `/shell` · `/upgrade` · `/config` · `/restore` · `/exit` · `/help` |

**别名**（`thincoder-cli/src/tui/slash-commands.mjs:69`）：`/h` → `/help` · `/x` → `/exit` · `/m` → `/model` · `/p` → `/plan` · `/t` → `/think` · `/c` → `/clear` · `/n` → `/new`。

### 2.10 模型适配

多供应商预设与模型清单（预设住 `thincoder-core/config-presets.mjs`；能力规格表住 `thincoder-core/model-specs.mjs`）。适配内容：上下文窗口匹配、截断续写协议（prefix / partial）、思考模式 API、`reasoning_content` 回传策略、输出限制、温度范围裁剪、视觉能力门控。

### 2.11 终端界面（TUI——CLI 专有面）

| 特性 | 说明 |
|---|---|
| 纯 ANSI | 零依赖框架，alt buffer 切换，退出自动清屏，增量渲染 |
| 流式输出 | token 实时滚动，thinking 分区显示 |
| 权限审批 | 操作前预览 diff / 命令，逐项或整体批准（可一键转全自动） |
| 输入队列 | processing 时可继续打字 |
| 中断与注入 | 中断当前流 + 插话 + 自动继续；中断 + 退出；子代理不受影响 |
| 粘贴 | 文本粘贴 + 图片粘贴（视觉模型） |
| Picker 菜单 | 模型 / 配置 / Session / 子代理模型等统一菜单 |
| 行间区块与面板 | 工具输出 = 行间区块；任务面板常驻；子代理活动 = 会话流内可折叠区块 |
| 会话恢复 | 启动时恢复上次会话并显示对话历史 |

界面实现坐标（壳面）：`thincoder-cli/src/tui/index.mjs` · `thincoder-cli/bin/thincoder.mjs`。

### 2.12 Session 与会话

| 特性 | 说明 |
|---|---|
| 持久化 | 每轮自动保存；归档槽位上限 |
| 状态恢复 | history / tasks / planMode / autoApprove / advisor / goal 全恢复 |
| 检查点 | 版本控制快照，退出前自动存，回滚可逆 |
| 跨 cwd 隔离 | 不同目录各自独立 session |

## 3. 非功能性需求（安全与护栏）

| # | 机制 | 标准 |
|---|---|---|
| N1 | 路径边界 | 无边界解析（相对 cwd / 绝对原样 / 符号链接跟随）——**信任模型 + 审批门控为防线** |
| N2 | bash 安全 | **零文本拦截**（文本匹配是安全剧场）——真实防线 = 审批层 + 破坏性命令自动快照；危险标注只提示不拦截 |
| N3 | verify 守卫 | 改代码未经 verify 声明 → 回推强制声明验证（opt-in，普通模式） |
| N4 | 外部内容隔离 | 外部内容经转义 + 不受信标签包裹，与指令面隔离 |
| N5 | 视觉模型守卫 | 非视觉模型自动剥离图片部件（防 400） |
| N6 | 供应商限速 | 本地滑动窗口限速 + 尊重重试头退避（防 429） |
| N7 | 输出上限 | 工具输出超限落盘 + 预览（保头保尾） |
| N8 | 崩溃可取证 | 异常终止落崩溃记录 + 近堆快照 + 堆预警（CLI 侧面见 `docs/cli/design/CRASH-REPORTS.md`） |

## 4. 不并项与历史沿革

### 4.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/requirements/FEATURES.md`（CLI 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档档头 | 「本档是什么（2026-09-10）」时点界定 + 格式债清理批注 | 批次语境——本档自有档头界定 |
| 旧档 §十 | 「支持 17 家供应商预设、30+ 模型」的具体计数 | 计数随时点漂移——现行清点面以预设 / 规格表实现为准（§2.10） |
| 旧档 `verify` 行的设计档指针 | `VERIFY-REDESIGN.md`（迁移前址） | 现行落点见 §2.2 / 迁移台账 `docs/core/design/DOC-MIGRATION.md` |
| 旧档各行的迁移前路径 | `src/` 形坐标 | 迁移前仓形态——§2 已按现状清点面重写 |

**清点面收正（本批 · 实核）**：旧档清单基于 2026-09-07 时点，与现行登记面相比**缺列现行能力**——
`checklist` · `lsp` · `execute` · `file_ops` · `process` · `get_current_time` · `wait_for` · `tree` ·
`settings` · `peer_instances` · `read_history` · `batch_segment`；且 `escalate` 已并入 `subagent` 动作（不再独立成工具）。
本批按**现行登记面**清点（§2），逐项坐标 = `thincoder-core/tools/index.mjs` · `thincoder-core/agent-tools.mjs`。

### 4.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 各能力的机制设计 | 工具契约 / 注册 / 调度细节 | 各板块设计档（`docs/core/design/TOOLS.md` 等）——本档只清点（D2） |
| 工具描述文本 | 模型可见描述 | **产品代码**——落点 `thincoder-core/tool-docs/**` |
| VSC 侧同名档 | `thincoder-vscode/docs/requirements/FEATURES.md` | VSC 轮（`docs/vsc/`）——本档只收 CLI 面 |

## 5. 体量与拆分规划（R24a）

**实测行数**：本档 **193 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**迁移批 · 第 6 批收口同步 · eng-designer**）：§3 N8 的崩溃取证指针按**同批迁移结果**改指（`thincoder-cli/docs/design/CRASH-REPORTS.md`「未迁」→ `docs/cli/design/CRASH-REPORTS.md`——该档已由第 6 批迁入基准层）。纯指针收正、零语义。
- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/requirements/FEATURES.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/requirements/`（P2：含 CLI 专有的终端界面 / slash 命令面）；② 清点面按**现行登记面**实核收正（补列现行能力、`escalate` 并入 `subagent` 动作、slash 命令表按实核重排、工具/命令坐标改现状路径）；
  ③ 新增 §3 非功能性需求（安全与护栏——旧档「安全与护栏」节升为 NFR 面）、§4 不并项与历史沿革、§5 体量。
