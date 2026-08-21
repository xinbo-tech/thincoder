## [0.12.35] — 2026-08-21

### Changed

- **advisor 开关语义重构**：评审能力恒启用——`advisor` 工具任何模式都可调用（删除 `advisor.enabled` gate，不再返回 "not enabled"）；开关语义收敛为 guard——收尾推回仅当 `advisor.guard === true`（默认 OFF，评审自愿调用，打开才强制）。工程模式行为不变（评审恒可用、guard 豁免）
- **`advisor.enabled` 废弃**：字段不再读写，存量配置不迁移——旧 `{ enabled: true }` 用户升级后不再强制评审（pre-release 约定，CHANGELOG 说明即可）；/advisor 菜单删除 "Advisor ON/OFF" toggle，Guard 成为唯一开关

### Prompt system

- **提示词借鉴增量（kimi-code 对照）**：explore.md 新增 Thoroughness levels 三档（quick 单点定向 / medium 默认适度并行 / thorough 全面分析且报告须列出搜索过什么与没找到什么）；main.md Delegate well 补委派 explore 时在 task 描述中指定彻底度（未指定走默认）；system.md 确认理解句补 "including the most important acceptance criteria"；subagent 工具 description 同步补彻底度说明。两端 15 个 prompt 文件保持 byte-identical（新增 CLI 侧比对测试防漂移）
- **开工前计划确认纪律**：system.md 追加无豁免纪律——任何写文件动作（write/edit/apply_patch/insert_after/delete/hashline_edit 及一切写文件的 bash）前必须纯文字复述理解+计划要点并等待用户明确确认（未确认/沉默/用户回复新问题或新要求 → 一律不动手；"这太明显了不用问"不是跳过理由；用户的新问题不是确认；需求变化后重新复述重新确认）；engineering.md 澄清完成后、写需求/设计文档前同样须把理解+计划文字化并等待确认。两端 15 个 prompt 文件保持 byte-identical（两端测试断言关键句）

## [0.12.32] — 2026-08-16

### Fixed

- **会诊触发条款重构**（两轮会诊驱动的修复）：触发规则从飞刀段移入会诊段且自包含——功能请求语义（"会诊一下"触发、"consult the docs"不触发）+ 用户请求覆盖自主判断；consult_start 描述补对称触发句；飞刀段补 fly-in/口语变体
- **飞刀三个真实断链**（会诊发现，此前"代码在但真实跑必翻车"）：
  - 删墙钟看门狗——固定墙钟误杀正常但慢的手术（实测两个 max-effort 顾问读 5 个文件即撞 10min 墙）；完全依赖 turns + FETCH_TIMEOUT + 用户 Stop 直传
  - effort 枚举钳制——池 effort 越界不再让候选"起飞即死"，回退预设并标注
  - AUTO 传导对齐 subagent——headless 嵌入下父 autoApprove 正确放行子 agent 写操作
- **config 加载校验**：consultModels 池 provider 名必须存在于 providers[]，条目形状校验——静默运行时失败改为启动即报错
- **撞墙可继续（kimi-k3 飞刀）**：escalate 子 agent 撞 turn 上限后弹"继续?"（复用 onPermissionRequest，TUI 同款 y/n 面板），resume:true 续跑不重复注入任务、预算重置，上限 2 次；顺带修复 ContinueError e.turns → e.turn（原来打印 "undefined turns"）
- consult 死代码补 precheck（无 key 时明确失败回复而非原始 401）

### Docs

- CLI CONSULTATION.md / ESCALATE.md 文档地图收录、FEATURES.md 功能全览补齐（7→11 个）、README 会诊别名、checklist T2-T6 验收

## [0.12.31] — 2026-08-16

### Fixed

- **/config consult model picker**: adding a consult model now uses pickModelForSlot (provider AND model are both OPTION pickers, reusing /model's async-fetched model list) — was free-text for the model name
- **Prompt adaptation**: CLI main.md was missing the consult (会诊) + escalate (飞刀) sections — the CLI main agent did not know "会诊" meant consult_start. Ported both + added the 会诊 alias to consult_start's tool description

### Prompt system

- Attention optimization + cross-end consistency: split over-long sentences, fixed an escalate-timing contradiction (up-front ability judgment), unified Review discipline + advisor rounds — all 15 prompt files byte-identical with the plugin

### Docs

- CONSULTATION.md + ESCALATE.md design docs (CLI implementation differences vs the plugin)

## [0.12.30] — 2026-08-16

### New: 会诊 (consult) + 飞刀 (escalate) — full VS Code plugin parity

- `consult_start` / `consult_check` / `consult_stop`: several configured models run as parallel independent read-only consultants — each with its own TUI activity card, `main_history` access to the failure trail, arrival-order reply queue, stopped/terminated settle states, wall-clock watchdog
- `escalate`: fly in a stronger model for one expert implementation run — coder role, full write path, permission gate, mutations merge into the parent's verify/advisor guards, turn-cap reads as partial work, timeout reads as timeout
- Config: `agent.consultModels` ([{ provider, model, effort? }], up to 5, validated), `agent.consultTurns` (40), `agent.consultTimeoutMs` (600000)
- **/config now manages the consult pool**: list / add / remove models; per-model reasoning-effort is an OPTION picker (none/min/low/medium/high/max); consultTurns + consultTimeoutMs (entered in minutes)

### Discipline

- UI rule added: fixed-choice values must be OPTIONS (picker/menu), never free-text — free-text only for genuinely open-ended input

## [0.12.29] — 2026-08-16

### Fixed

- **Coder sub-agents (subagent role=coder) get verify + advisor** — CLI parity with the plugin's escalate diagnosis: the system prompt names both tools but the tool table only gave them to eng-coder; a coder sub-agent hit unknown-tool and self-verified via bash
- **Cache-audit follow-ups**: OS/cwd reminder injected once per process (was every run); interrupt-resume now re-grounds the time (was stuck on the pre-interrupt time); skills scan sorted deterministically (filesystem-dependent readdir order could byte-change the system prompt with zero content change)

## [0.12.28] — 2026-08-16

### Cache-hit-rate fix (user-reported low hit rate on session start)

- **Machine line (contextHistory) now keeps transient messages on persist** — every CLI invocation is a new process; the previous reals-only reload plus fresh re-injections (git/OS/outline/doc/memory/time) diverged at index ~1 → whole-prefix cache miss on the first request of every session. Resume now rebuilds a byte-identical machine line; new injections append at the tail
- Time reminder moved to the END of the message sequence (after the user input) — aligned with the plugin fix, robust against any future machine-line disk reload

### Fixed

- normalizeToolPairing early-return hole: toolById empty must not skip placeholder filling when assistant tool_calls are declared (dangling tool_calls 400 otherwise)

## [0.12.27] — 2026-08-15

- Time injection moved OUT of the system prompt into a transient per-run user reminder — system prompts fully static again (prefix caches hit across hours, not minutes); local time + IANA timezone at second precision; now covers ALL agent depths (subagents previously had no time grounding at all)

## [0.12.26] — 2026-08-15

### ACP extensions for thincoder-desktop (proposals ①②③④, all implemented)

- **① Session persistence**: every ACP turn end (success/cancel/failure — finally semantics) writes the session archive via saveSession; session/list / load / resume now have a real data source. Save is injectable and failures never break the queue
- **② Checkpoints**: checkpoint/create / checkpoint/list / checkpoint/restore ACP handlers; NON-git cwds now snapshot by full-directory copy (v2 layout, nongit meta) instead of silently returning null
- **③ Memory**: memory/list / memory/remove ACP handlers over the shared ~/.thincoder store
- **④ Custom provider headers**: provider.headers object in config.json merges into every LLM request (chat + /models); Authorization cannot be overridden; non-string values sanitized out

### Fixed

- Time injection vs prefix-cache conflict: system-prompt "Current time" is now MINUTE precision — byte-identical within the same minute so DeepSeek prefix caches still hit (was: seconds precision broke the cache every run)

## [0.12.25] — 2026-08-15

- Local time + timezone injected into every system prompt (main agent, subagents, advisor) — prepareRun appends `Current time: <local> (<IANA zone>)`; sessionStart was ISO/UTC and session-scoped, subagents had nothing
- bash.md Windows guidance corrected: the shell is cmd.exe (NOT Git Bash) — &&/|| work, cmd built-ins, NUL not /dev/null, prefer node -e for complex logic

## [0.12.24] — 2026-08-14

### Added

- **glm-code provider preset** — the Zhipu GLM Coding Plan endpoint (`https://open.bigmodel.cn/api/coding/paas/v4`, glm-5.2, same key as GLM; server-side forced thinking).

### Fixed

- **Model specs synced with official vendor docs (verified 2026-08)** — DeepSeek v4 duals effort enum +low and cacheMode→auto; qwen3.x/max/plus maxOutput→131072 (qwen-plus was 32K).
- **Retired models dropped** — deepseek-chat/reasoner, kimi-k2, moonshot v1 (vendor shutdowns; unknown IDs fall back to the 128K default spec).

### Changed

- Repository URL → github.com/xinbo-tech/thincoder.

# Changelog

## [0.12.34] — 2026-08-18

### Added

- **/rename 命令** — 改会话标题（renameSlot 双写，与 VS Code 共享）

### Fixed

- **/config 候选池 effort picker 显示真实枚举** — 从固定 min/low/medium/high/max 改为动态读 specForModel(model).reasoningEffortEnum；无枚举的模型跳过 effort 步
- **question 工具 options 防御** — LLM 误传对象时取 label 字段，避免渲染 [object Object]


本文件记录 ThinCoder CLI 的发布历史。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.12.23] - 2026-08-13

- **修复** svg 图片毒化会话——read_image 读 svg 后以 image_url 进历史，Kimi 等视觉 API（全部仅支持位图）此后每轮请求 400 "unsupported image format"，会话永久卡死；现在发送时按格式净化：非 png/jpeg/gif/webp 的 image part 替换为占位文本，净化上移至 format dispatch 之前覆盖 openai/anthropic/google 全部通路，历史本身不改写（切回支持的模型/格式可恢复）
- **改进** read_image 对 svg 返回文本源码（svg 本是文本标记，任何模型可读，绕过 vision gate）；bmp 拒绝并提示转 PNG（无主流视觉 API 支持）

## [0.12.22] - 2026-08-13

- **修复** 缓存命中率对 Kimi 显示——usage 缓存字段归一化：Kimi/OpenAI 风格 `prompt_tokens_details.cached_tokens` 映射为 DeepSeek 风格 `prompt_cache_hit_tokens`，miss 由 prompt_tokens − hit 推导（此前 Kimi 的命中率永不显示）
- **安全** fetch 重定向目标做 SSRF 检查——3xx 可把公网 URL 跳进内网（重定向绕过）；相对 URL 正确解析、仅 http/https、私网/元数据拦截
- **新增** Tavily 结构化搜索（可选）——config 配 `websearch.apiKey` 后 `websearch` 走 Tavily API（稳定 JSON，不再依赖 Bing 页面结构）；无 key 回退 Bing 抓取，零门槛不破坏

## [0.12.21] - 2026-08-13

- **修复** 恢复会话大量重复 "❯ ThinCoder:" 标签——history 按每次 LLM 调用存一条 assistant 消息（一个 turn 多段），恢复时每段都渲染了标签；现在只在 turn 开始渲染一次，跨页懒加载边界状态正确保留
- **改进** 恢复保真度：完整工具结果（不再一行摘要）+ reasoning 思考流以 dim 行恢复（超长自动折叠）——恢复后的会话与退出前基本一致；首帧渲染实测约 50ms

## [0.12.20] - 2026-08-13

- **修复** TUI 恢复旧 display 快照导致"看不到最新消息"——display 字段彻底废弃（saveSession 不再写、loadSession 不再读），恢复永远从 history 重建；配合 VS Code 端 0.1.5 的清空，跨端会话漂移根治
- **新增** TUI 懒加载历史恢复：启动只物化最近 200 条消息（8000+ 条会话不再冻结启动），PgUp 到顶按 50 条/页加载更早历史，scroll 补偿保持视觉位置
- **新增** question 选项列表末尾追加"✍ Custom answer…"——选中切自由输入，用户可补充/修正 AI 的预设选项
- **重构** execute 工具移除假沙箱：require()/process 全可用（bash 本就能触达任意 Node API，拦 require 只会误导模型）；移除动态 import 拦截与 SSRF 私网拒绝；保留 timeout / cwd 约束 / 输出上限等工程保护
- **改进** 工程模式 prompt：新增提问风格指引（默认开放式自由文本，选项仅用于有限枚举）；审查修复 5 处（需求优先步骤、designToken 仅走参数、用户审批呈现 advisor 发现、澄清完成判据、advisor 重试 3 轮上限）

## [0.12.19] - 2026-08-11

- **重构** bash 工具安全模型：移除全部破坏性命令文本拦截（rm -rf / DROP TABLE 等）——文本匹配是安全剧场（恶意模型可绕过、误伤正常操作），真实防线 = 审批层（autoApprove）+ 快照（gitGuardSnapshot / checkpoint），与 env 透传、git"快照后放行永不拦截"统一
- **新增** 危险命令标注（detectDanger，参考 kimi-code）：recursive-delete / sudo / pipe-to-shell / dd / mkfs / 裸设备 / chmod 777 / fork bomb 在 TUI 与 ACP 审批面板红色标注——只提示不拦截，帮人做审批决策；引号感知（commit message 等纯文本不误标，反引号内容保留）
- **文档** TOOLS.md 安全边界同步（零文本拦截 + 危险标注）

## [0.12.18] - 2026-08-10

- **修复** Qwen 路由等代理的模型 ID（如 `kimi/kimi-k3`）跳过 `reasoning_effort` 参数——路由可能误处理该参数导致空回复

## [0.12.17] - 2026-08-10

- **修复** `kimi/kimi-k3`（Qwen 路由前缀 ID）模型规格匹配 — 正确继承 kimi-k3 的 1M 上下文 / 131K 输出 / 多模态

## [0.12.16] - 2026-08-10

- **修复** 非 SSE JSON 响应被误判为错误（HTTP 200 + tool_calls 的合法 JSON 响应现在正确解析，而非报 "Response is not SSE"）
- **改进** API 错误信息可读性：非 SSE 错误响应包含 HTTP 状态码 + 具体错误原因

## [0.12.15] - 2026-08-10

- **改进** API 错误信息可读性：非 SSE 响应预拦截，提取 HTTP 状态码 + 具体错误原因（替代原来模糊的 "Response is not SSE"）

## [0.12.14] - 2026-08-10

- **修复** 小终端 permission 面板挤出输入框（layout 溢出补偿新增 permission 压缩）
- **修复** iTerm2 Ctrl+C 键盘协议序列泄漏（stdin 剥离未处理的 CSI u 序列）
- **修复** eng 模式 advisor token 正则错配（改用完整 token 构建正则，与 prompt 格式一致）
- **修复** 输入框 ↑ 键历史导航草稿丢失（进入/编辑历史模式时扩容草稿保护）
- **重构** key-handler 拆分搜索模块（key-handler-search.mjs）
- **文档** 架构文档计数/模块/状态同步更新

## [0.12.13] - 2026-08-08

评审机制全面重构（用户驱动的三轮决策）：

- **prior 硬解析移除**：收敛轮注入上一轮评审的完整原文（模型直接理解），删除表头匹配与 all-clear 短语两类"字符串解析 LLM 输出"的脆弱机制
- **评审触发范围收缩**：评审只跟代码修改绑定——bash/git 等副作用工具不再触发多余评审轮（评审后读日志/清理临时文件不再要求重复评审）
- **AGENTS.md 文档地图**：需求基线声明（REQUIREMENTS.md + 设计文档 + 对话背景）+ docs/design/ 27 份文档分组清单，评审者按地图定位需求文档
- **项目根发现**：多项目工作区从评审范围定位子项目 AGENTS.md（工作区元地图不遮蔽）；修复混合路径分隔符误判
- **收敛体共享模块**：round 2+ 消息构建单一来源；空回复/纯工具输出不再冒充评审记录

## [0.12.12] - 2026-08-07

- advisor 记录按真实时序落盘（timeline）、markdown 表格 render-before-measure 对齐修复（含 heading 多行/双重粗体）、requirements 兜底、评审结论可用性提示
- 双线消息历史（人读线 + 机读线）、压缩只作用于机读线、机读消息不进人读线
- 临时文件（tmp-*）不触发 advisor guard；config.mjs 加固（spec 预排序、providers 守卫、saveConfig 写副本）
- VS Code 扩展发布准备（marketplace 元数据、.vscodeignore、vscode-mock 依赖修复）

## [0.12.11] - 2026-08-05

- subagent 按类型配置模型（`/submodel` + `subagentModels`）
- 可配置 bash shell（`/shell platform` 切换）
- 其他稳定性与体验改进

## [0.12.10] - 2026-08-05

- 代码质量梳理：清理未使用的导出、advisor 计时器与静态导入修复、复评不再因旧会话数据误报

## [0.12.9] - 2026-08-04

- 提示词体系质量梳理：移除工程模式与 advisor 的冲突、交付评审语义修正

## [0.12.8] - 2026-08-04

- pending-task 推回最多触发一次（消除无界完成循环）

## [0.12.7] - 2026-08-03

- 折叠可读性修复（主输出/思考永不折叠）、窄终端宽表格裁剪

## [0.12.6] - 2026-08-02

- checkpoint v2、git 破坏性命令保护、鼠标支持、长消息折叠、bash 行为约束

## [0.12.5] - 2026-08-01

- 行内代码下划线样式

## [0.12.4] - 2026-08-01

- 压缩统一规范、Kimi For Coding、Ctrl+C 双重确认、空响应重试、markdown 渲染修复

## [0.12.3] 及更早

v0.12.x 早期版本、v0.11.x、v0.8.x、v0.7.x 与 v0.2–v0.6 系列——完整历史见 [git 提交记录](https://gitee.com/shanghai-xinbo/thincoder/commits/main)。
