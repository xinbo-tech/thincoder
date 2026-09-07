# ThinCoder VS Code 架构设计

> 本文档是 VS Code 扩展的**架构权威源**：模块划分、数据流、设计决策与端侧机制语义。
> 状态：当前态（2026-09-08 重写——人类可读化 + 历史流水折叠 + 漂移订正；此前为逐批
> 变更档案堆叠，物理乱序且含层层 as-of 注）。
> 约束：纯 `.mjs`、零 npm 运行时依赖、VS Code API + Node 标准库。`extension.mjs` 即
> 入口，`package.json` 声明 `"type": "module"`。

## 未决 / 待办状态行（承接开放项——不得当历史折叠）

- `eng(enter)` 的用户同意门、design token 的用户批准点、拒绝文案降噪——CLI 同存，
  两端待议（VSC `docs/TODO.md`）。
- advisor 工具集与 CLI 的差异项（CLI advisor 有 lsp，本端侧待补）——VSC
  `docs/TODO.md`。
- 挂起期进程级 reminder 注入含 ISO 时间戳且位于 time 注入之前——每进程首 run 缓存
  miss 一次（单次量级，可接受）——留待 CLI `SESSION.md` §11 后续评估（thincoder
  `docs/TODO.md`）。
- UI ⏹ 活动块 live 头缺逐轮 turn 段（现有状态事件不携 turn——逐轮跳动需扩展端新
  通道，触碰桥白名单，不擅建）——降级口径已定：池条目终态通知携真实终值，冻结身份
  头显示终值。记录在案，无跟进计划。
- 行面板 `#subagent-panel` 与活动面板的合并评估候选：**保留**（其独有载荷 = queued/
  waiting 行 + consult 计数/回复 preview）——后续可单独评估，非缺陷。
- 快层 slow-gate（D-T6）在本机负载下对清单外存量用例偶发触红（session-io-parity
  F4 / compaction / dual-history / mcp 等 800-2100ms 浮动）——非本批引入，报父侧
  处置（归册或阈值复议）。
- 测试会话目录未沙箱（restart marker 读真实 sessions）——卫生注记，无行动计划。

## 1. 设计原则

1. **薄封装**：扩展是 agent 核心的 VS Code 适配层。Agent 循环、工具系统、prompt
   体系采用与 ThinCoder 一致的设计理念。负责任，不是办公设备。
2. **职责分离**：扩展主机（extension host）负责 agent 循环和工具执行；Webview 只
   负责 UI 渲染和用户交互。两者通过 `postMessage` 单向通信。
3. **零构建**：无 TypeScript、无打包器。`extension.mjs` 即入口，`package.json`
   声明 `"type": "module"`。
4. **VS Code 原生能力优先**：工具执行通过 VS Code API 增强（如
   `workspace.openTextDocument` 在写入后自动在编辑器中打开文件）。
5. **会话与 CLI 共享**：会话数据存储在 `~/.thincoder/sessions/`（与 CLI 同一磁盘
   位置），两端互读互写，跨产品接续无感。旧 `context.workspaceState` 方案已废弃
   （pre-release，无迁移）。

## 2. 整体架构

```
┌────────────────────────────────────────────────────────────────┐
│ Extension Host                                                  │
│                                                                │
│  extension.mjs — 入口：命令 / 状态栏 / WebviewViewProvider      │
│  （sidebar thincoder.chat）/ diff preview provider / locale      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ChatPanel（src/extension/chat-panel.mjs）                  │ │
│  │  面板生命周期 · 消息路由 panel-messages → panel-chat         │ │
│  │  会话 panel-session/session-io/session-slots/session-gc     │ │
│  │  项目 panel-project · 挂起驱动 suspension · 权限            │ │
│  │  permission-gate · 设置 settings · MCP panel-mcp · 索引     │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│  postMessage（消息协议——见 §12）  │  runPanelChat                │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │ Agent 核心：runAgent（src/agent.mjs，多轮工具循环）          │ │
│  │  agent/：execute-tools（调度/门禁/批审批）· setup ·          │ │
│  │    run-stages（收尾 guard 推回）· run-helpers · reminders    │ │
│  │  agent-tools/：subagent 族 · advisor/advisor-async ·        │ │
│  │    consult · eng · verify · task · plan · goal · skill ·    │ │
│  │    timer · recent_changes · read_history                    │ │
│  │  tools/：read/write/edit 族 · search · git · bash · web ·   │ │
│  │    lsp · execute · question · read_image · checklist …      │ │
│  │  provider.mjs（openai/anthropic/google 三 transport）        │ │
│  │  compact/context（压缩与注入）· memory/embedding · mcp ·     │ │
│  │  repomap（仓库大纲）· config/specs/config-presets            │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │ native fetch → LLM API（SSE）      │
│  ~/.thincoder/：config.json · sessions/（槽位+manifest+端 marker）│
│  · checkpoints/ · logs/ · memory/ · mcp 状态                    │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│ Webview（隔离 iframe——只经 postMessage，无共享状态）             │
│  index.html → chat.js 编排 · streaming/ui/activity/panels/…     │
│  md.js markdown 渲染 · state.js 状态 · base/chat/controls/       │
│  session/settings.css                                           │
└────────────────────────────────────────────────────────────────┘
```

两个产品共享设计理念、提示词体系，以及**会话数据与配置数据**（同一磁盘位置、互相
读写）。代码各自独立、安装独立、无运行时依赖（详见 §14 差异表）。

## 3. 模块地图（现行——2026-09-08 刷新）

AGENTS.md 模块图为维护寄存器；本节为分组总览（实现为唯一事实源）。

| 域 | 模块 | 职责 |
|----|------|------|
| 入口 | `extension.mjs` | activate/命令注册/状态栏/WebviewViewProvider |
| 装配 | `src/extension/chat-panel.mjs` | ChatPanel 类——面板生命周期、会话管理、消息路由（自 extension.mjs 拆出） |
| 装配 | `src/extension/panel-*.mjs` | 消息路由/回合驱动/会话/项目/索引/MCP/toolPanel 载荷分模块 |
| 装配 | `src/extension/suspension.mjs` | 挂起会话驱动（AGENT-LOOP「9. 挂起回合」镜像——digest/排队合并/唤醒） |
| 装配 | `src/extension/permission-gate.mjs` | 权限弹窗门 + 批审批门 |
| 装配 | `src/extension/session-io.mjs` / `session-slots.mjs` / `session-gc.mjs` / `session-slot-write.mjs` | 会话 I/O、槽位/端 marker/resumeSlot、残留 GC、槽位写 |
| 装配 | `src/extension/settings.mjs` / `presets.mjs` / `provider-flows.mjs` | config.json 面板读写、preset、provider 增删流 |
| 装配 | `src/extension/generate-title.mjs` / `image-handler.mjs` / `reasoning-mode.mjs` | 标题生成 / 粘贴图落盘 / 推理档位映射 |
| 核心 | `src/agent.mjs` | runAgent 主循环 + 工具分发 + 注入 + 收尾 |
| 核心 | `src/agent/execute-tools.mjs` / `setup.mjs` / `run-stages.mjs` / `run-helpers.mjs` / `setup-reminders.mjs` | 工具调度/门禁/批审批、装配、收尾 guard 推回、offload/截断助手、提醒注入 |
| 工具 | `src/tools/`（file/search/more-file/linter/checklist/git/git-ext/git-checkpoint/shell/web/lsp/execute/question/read_image/code/context/focus/ops/wait_for/tree/shared/edit-diff/file-edit…） | 内置工具实现（清单见 §7） |
| 元工具 | `src/agent-tools/`（task/recent_changes/plan/goal/skill/verify/timer/advisor/eng/read_history/consult + subagent 族） | 自律/子 agent/评审工具族（§7 元工具行；§8/§9） |
| 子 agent | `src/agent-tools/subagent.mjs` + `-spec/-async/-actions/-scheduler/-escalate/-escalate-async/-spawn-gate.mjs` | 单工具动作面/描述载荷/后台池/调度/飞刀/门禁（2026-09-05 拆分） |
| 子 agent | `src/agent-tools/advisor-async.mjs` | 后台设计评审池（AGENT-LOOP「11.2 async advisor」镜像） |
| LLM | `src/provider.mjs` + `src/provider/rate.mjs` + `src/provider/transports/` | 三 transport、重试、限频门 |
| LLM | `src/config.mjs` / `specs.mjs` / `config-presets.mjs` / `config-io.mjs` / `config-migrate.mjs` | 模型能力 spec、preset 表、config.json 读写/迁移 |
| 上下文 | `src/context.mjs` / `src/compact.mjs` / `src/explore-distill.mjs` | 注入、压缩/摘要/蒸馏 |
| 支撑 | `src/memory.mjs`/`embedding.mjs`/`indexer.mjs`/`repomap.mjs`/`mcp.mjs`+`mcp/`/`escape.mjs`/`i18n.mjs`/`log.mjs`/`proxy.mjs`/`explore-distill.mjs` | 记忆/索引/MCP/转义/日志/代理 |
| Webview | `webview/chat.js`/`streaming.js`/`ui.js`/`activity.js`/`panels.js`/`state.js`/`send.js`/`loading.js`/`mode-buttons.js`/`permission.js`/`question.js`/`md.js`/`settings-*.js`/`model-picker.js`/`history.js`/`diff.js`/`autocomplete.js`/… | 前端渲染/交互（§11） |

测试域：`test/`（`package.json` `"test"` = `node test/run-fast.mjs`，显式清单
`test/files.mjs` 为单一来源；`"test:full"` = `node test/run-full.mjs` 全量层）。

## 4. 会话持久化与恢复（与 CLI 共享）

**存储位置与形态**：`~/.thincoder/sessions/`——槽位文件 `session.json.N` +
`session.json.manifest`（槽位元数据 + active 指针 + sessionId）；每目录
`<sha1(cwdHash)>.manifest` 一套。目录键 = 完整 40 位 `sha1(normalizeCwd(cwd))`，
normalizeCwd **大写 Windows 盘符**（`d:\…` → `D:\…`）——`uri.fsPath` 会小写盘符，
直接 hash 会与 CLI 的 `process.cwd()` 不一致。旧 12 位 hash 文件首访时改名。

**端分离恢复（2026-09-05，SESSION.md §10 镜像）**：每端自己的恢复目标 = 自己的端
marker 文件——本端 `{manifest}.vscode`（`session-slots.mjs` `END = "vscode"`；CLI
写 `.cli`，永不被另一端触碰）。面板打开经 `resumeSlot(cwd)` 决策：有端记录 → 认领
该槽（`claimSlot` 置为 active）；无记录 → `allocateFresh`（一次继承死主
`manifest.active` 或全新分配）；`cleanDeadOwners` 清理死主条目。`manifest.active`
仍是共享指针——保留给旧版本/ACP 语义与列表回退高亮。全新目录首用不再预写空会话
文件（resumeSlot claim 先行——文件在首保存落盘，与 CLI 语义对齐）。

**残留 GC（2026-09-06，SESSION.md §12 同源）**：激活时对当前 cwd hash 前缀做一次
轻量清理——`.corrupted`/`.unreadable`/`.manifest.corrupted`/`.bak-*` 保留 30 天、
孤儿 `.tmp` 保留 7 天（mtime 边界语义）；活跃槽现场一律保留；manifest 主文件/端
marker/数据主文件永不进入候选。冷 cwd（manifest mtime > 90 天）报告/删除原语与
CLI 同构——手动执行面仅 CLI 提供（扩展无 shell 通道），本端只接线自动残留 GC
启动钩子。

**切换纪律（会话切换竞态修复——VS 实现注）**：**运行中禁止切换**——
`switchSession`/`newSession`/`deleteSession` 三处 `_turnActive` 守卫（warning
拒绝，对齐 applyProjectSwitch 模式）；`saveLines`/`_saveLines`/`generateTitle` 加
slotOverride（turn 启动捕获 turnSlot——纵深防御，旧 turn 流不灌新会话视图、内容
不落错槽）。面板打开时 `_slot` 绑定一次，之后所有读写不再重读共享 manifest 的
active 指针（可被并发运行的 CLI 改动）。

**字段往返完整**：槽位文件全量覆盖写。`chat-panel._saveLines` 以 `...existing`
展开式透传不认识的字段，仅覆盖扩展自己拥有的字段——CLI 写入的
`activeModel`/`engineering`/`engDesignToken` 等字段在 VS Code 侧往返不丢。

**废弃方案**（pre-release，无迁移）：`context.workspaceState` 的
`thincoder.sessions.<base64(workspacePath).slice(0,32)>`、legacy `messages/` 目录
+ base64 文件名 + Memento 索引、旧 12 位 hash 文件（首访改名）。

**懒加载历史分页**：长会话不整读——首屏只发末页（`historyWindow(history, null)`，
页 20 条，idx = 全局下标），滚近顶部经 `loadOlder { before }` 取旧页（scroll 补偿
前置）；`before` = webview 最小已渲染 `data-idx`——live 流消息无 idx 不腐蚀窗口。
实现与寄存器见 AGENTS.md「Lazy history loading」。

**会话上下文注入**（SESSION.md §11 富注入演进，CLI 同款）：disk 历史重放保序打头
（缓存前缀主体）+ git/env/process-restarted transient 注入落在重放后、最新 user
前 + time 注入恒为该轮最后一条（位置契约由测试独立锁定——2026-08-16 事故防复发
意图保留）。

## 5. Provider 面与配置（与 CLI 共享）

**config.json**：与 CLI 共享 `~/.thincoder/config.json`——`providers[]`（每项
`{ name, baseURL, model, apiKey, chatPath?, maxTokens?, format?, context? }`）+
`activeProvider`/`activeModel` 指针；`apiKey` 缺省回退环境变量。读写逻辑在
`src/config-io.mjs`（共享 config.json）+ `src/extension/settings.mjs`（面板读写
面）；首次启动检测到旧版 VS Code settings 里的 `thincoder.providers` 一次性迁移进
config.json 后停用 settings 存储（`src/config-migrate.mjs`/`migrate-settings.mjs`）。

**Preset 表**：以 CLI `config.mjs` 的 `PROVIDER_PRESETS` 为唯一权威——**现 20 个**
（deepseek/kimi/kimi-code/glm/glm-code/qwen/qwenplan/mimo/mimoplan/minimax/openai/
claude/gemini/grok/mistral/volcengine/hunyuan/siliconflow/openrouter/groq）；VS
Code 实现 `src/config-presets.mjs` 镜像（presetToEntry 剥离 desc），不再各自硬编码
模型表，避免两端漂移。

**模型选择 UI（对齐 CLI 二级菜单）**：主下拉列 provider 行（provider 名 + 右侧当
前模型 + `›`），hover 弹出该 provider 的模型 flyout 子菜单，点击模型选中——两级
语义对应 CLI `openModelPicker → openModelListForProvider`（Webview 无键盘导航，
改用 hover flyout）。主下拉底部含 add / remove / key 管理入口。

**Provider 增删**（对齐 CLI）：`addProviderFlow`（选 preset[过滤已添加] → 自动填
baseURL/model → 输 key；custom 手动输 name/baseURL/model + 选 format）、
`removeProviderFlow`（列非 active provider 供删）、`setKeyFlow`（设/改 key）。

**协议 transport**：三种 `provider.format`——`openai`（默认，SSE chat
completions）、`anthropic`（Messages API）、`google`（streamGenerateContent）。
三 transport 均已实现并在 `src/provider.mjs` 的 `TRANSPORTS` 表按 format 分派
（含 thinking、tool calls、多模态），可承接 custom 的协议选择及 claude/gemini
preset。重试策略：网络错误最多 3 次退避 [1s,4s,12s]；429 读 `Retry-After` 最多 3
次；5xx 退避最多 3 次（`isNonRetryableError` 识别账单/参数错误直接失败不重试）。
流式：原生 fetch + `response.body.getReader()` 逐行解析 SSE；支持
`reasoning_content`（DeepSeek/Kimi thinking）与 `usage` chunk。畸形 tool_calls
防御（GLM 5.3 事故修复——PROVIDER.md §10 权威）：parseStream 单点防御——跳过
null/非对象、缺 id 收尾合成 `call_N`、缺 name 丢弃、缺 index 追加尾部、非字符串
arguments 走 JSON.stringify；`response.droppedToolCalls > 0` 时 agent 向机读线
push 告警：
`[System reminder: N malformed tool_calls from the provider response were dropped (non-standard provider format).]`
（人读线不写——模型需知道其工具调用未执行）。

**模型能力适配**（`src/config.mjs` MODEL_SPECS 自包含，无外部产品依赖）：
`thinking.type`（Kimi/GLM 思考 API——`thinkEnabledValue` 映射非 enabled 方言：
MiniMax 需 `"adaptive"`）、`reasoning_effort`（DeepSeek 推理强度）、`maxOutput`、
`tempRange` 钳制、`reasoningEcho`（thinking token 回传策略）、
`noUsageStream`、`context`。上下文长度可配置（PROVIDER.md §15）：`providers[].context`
K 单位覆盖 spec（×1024，非法值防御性忽略）；`providerSpec(provider)` 统一取值点
（压缩阈值/上下文百分比跟随覆盖）。Qwen 思考关闭映射（PROVIDER.md §12）：
`resolveEnableThinking(provider, spec)` 白名单（qwen* 且百炼域名）在显式 off
（`thinking === null`）时发 `enable_thinking: false`、effort 档位发 `true`。
deepseek 400 三件套（PROVIDER.md §14）：escape v5（孤立代理 → U+FFFD）、UTF-16
安全截断（`safeSliceUTF16`/`safeSliceUTF16Tail` 定义于 run-helpers，切点不落代理
对）、续写构造 `buildContinuationMessages`（prefix 分支过滤 tool/assistant
(tool_calls)、保留 system + ≤8 文本、末条 `prefix:true` + `reasoning_content`
回传；partial 分支全量历史不变）——续写失败注入 `_warnings` 不静默（AbortError
透传）。

**LLM 标题生成**：触发 = 会话第一条用户消息后 agent 完成回复；用任意已配置
provider 发简短 prompt（"Generate a concise title"），输出限 100 tokens；openai
格式显式带 `thinking:{type:"disabled"}`（思考型模型禁用思考，否则
reasoning_content 吃光输出预算）；失败静默降级（首条消息截断作标题）。实现
`src/extension/generate-title.mjs`。

**图片输入（spec 驱动，非硬编码模型表）**：`setup.mjs` 仅对 `spec.multimodal`
挂 `read_image`；`provider.mjs` `stripImagesForTextModel` 按 spec.multimodal 剥离
/保留。粘贴/拖拽/附加按钮：webview 传 dataURL → 扩展端落盘
`<cwd>/.thincoder/tmp/paste-*.<ext>`（`image-handler.mjs`，随 offload 的 mtime 清
理回收）→ 用户消息追加 `[Attached images: …]` 指针（非多模态模型直接 throw）→
模型调 `read_image` 带图进载荷（GitHub thincoder#3 方案 B——图不内联进请求）。

## 6. Agent 主循环（src/agent.mjs）

**签名（现行）**：

```js
runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)
// 实现缺省：callbacks = {}, autoApprove = true, opts = {}
```

- `callbacks`：onToken/onReasoning/onToolCall/onToolResult/onToolPanel/onComplete/
  onCompress*/onSubagent/onAgentTurn/onPermissionRequired/onBatchPermissionRequest/
  onQuestion…（顶层接线逐层注入子代理 ctx）。
- `opts`：子 agent 上下文 `{ depth, role, maxTurns }` + 自动回合/挂起
  （autoTurn、susp、skipSession、history/fullHistory、inheritedGuard 等）。
- **autoApprove 语义**：参数为启动快照；**活事实源 = 会话槽位字段 + 每轮 live
  getter**——execute-tools/setup 向工具 ctx 注入 `getAuto`，approve-all / AUTO 工
  具栏按钮在轮次中途翻转后，权限询问与 AUTO 标注下一条即生效（VS agent 是
  per-run 对象、无 CLI 的 `parent.autoApprove` 字段——两端语义等价）。
- **per-run vs 跨 run**：agent 对象 per-run 重建；跨 runAgent 存活状态挂在**共享的
  depth-0 history 数组**上（`_asyncSubagents`/`_asyncTombstones`/
  `_pendingAsyncResults`/`_pendingConsultResults`/`_pendingEscalateResults`/
  `_suspended`/`_engDesignTokens`——JSON 序列化只走数组下标，附加属性不污染会话
  文件）。

**循环控制**（机制语义与 CLI 一致，权威源 = AGENT-LOOP.md §2/§4/§6）：默认最大
轮次 100（顶层 `agent.maxTurns`；子代理 `agent.subagentTurns` 共享 config 默认
100）；并行工具批执行；Stall 检测（连续 5 轮工具重复 ≥3 次 → 警告注入）；收尾
guard 推回组在 run-stages.mjs（pending 任务 ≤1 次/任务 → verify guard OPT-IN
`agent.verifyGuard === true`（缺验推回 + 失败重试 ≤ 上限 + 耗尽诚实声明）→
advisor guard OPT-IN `agent.advisor.guard === true`（默认 OFF，工程模式豁免——见
§9））；零工具回合、回合后注入、中断语义（AbortController + signal.reason；
Ctrl+C abort / Ctrl+I interrupt——提交 partial 输出、注入消息、重建 controller
续跑同回合）。

**工具结果落盘与写时自清理（CLI parity，§5 D-4.1）**：结果超 **64K 字符**
（`MAX_TOOL_RESULT`）落盘 `<cwd>/.thincoder/tmp/tool-<id>.txt`，模型只见双端预览
`[Large output saved. Read the full result with the read tool: …]` +
`buildHeadTailPreview`（head 16K + 省略注 + tail ≤48K——UTF-16 安全双端切片）。落
盘目录写时自清理：每次 offload 写新文件前删除目录内 mtime 超 3 天
（`TMP_RETENTION_MS`）的文件——子目录不动、异常静默；同目录 paste-* 粘贴图片临
时文件一并按此回收。实现 `src/agent/run-helpers.mjs`；清理逻辑两端逐行等价、CLI
为准；落盘目录两端各自为政（CLI `~/.thincoder/tool-results/`、VS Code
`<cwd>/.thincoder/tmp/`）。

**上下文注入（顶层）**：`[System: working directory snapshot]` +
`[System: project dependency outline]`（repomap 依赖图——实现注入格式为
`[System reminder: project dependency outline: …]`，context.mjs）+ user input；
`[System: AUTO mode active]` 在 AUTO 时注入（每次循环迭代动态检查 live
getter——approve-all/AUTO 按钮轮次中途翻转后下一条注入即生效）。

**子 agent 支持**：`depth=0` 顶层 agent 拥有完整工具集 + meta 工具；`depth=1` 子
agent 工具集缩减、prompt 叠加角色 overlay、角色按模式覆盖（§8.1）；explore/plan 只
读、coder/eng-coder 完整工具 + verify/advisor 自审。轮次/并发上限与调度见 §8.2。

## 7. 工具系统（src/tools.mjs → src/tools/）

**设计原则**：每个工具 `{ name, description, parameters, execute(ctx) }` 统一接口
规范（`toOpenAISchema` 转 OpenAI function schema）；`tools.mjs`/`index.mjs` 为
re-export 入口与注册表。

**VS Code 适配增强**：

- `write`/`edit`：编辑经 WorkspaceEdit（undo 集成）+ 应用后**立即保存**
  （applyEditorEdit——不保存则 buffer 脏 + 磁盘旧，isDirty 守卫自锁下次编辑并发
  生外部写者竞态）；随后自动在编辑器中打开文件。
- `bash`：继承终端 shell 环境；`cwd` 缺省第一个 workspace 文件夹；git 工具快照
  守卫（gitGuardSnapshot——先快照后放行破坏性操作）。
- 路径解析：相对路径相对 `ctx.cwd`（workspace 根目录）。

**路径纪律（现行——2026-09-02 工具作用域限制移除后）**：**无目录限制**——
`resolvePath` 不再拒绝 `../` 跳出 workspace、`execute`/`git` 的 workdir/scriptFile
可指向 workspace 外（纯 resolve，bash 一致性）；残留风险由既有护栏承接：权限门禁
（逐工具/逐批询问）+ 破坏性操作快照不变。工具描述措辞 "confined to the
workspace" 已改为 **"no directory restriction"**（权威源 = CLI TOOLS.md「4. 安
全边界」——approval gate is the guard；本仓 AGENTS.md Hard Constraints 同步；工
具描述措辞逐字见 src/tools/execute.mjs）。

**内置工具清单（现行注册表 = src/tools/index.mjs builtinTools）**：

| 分类 | 工具（实现文件） |
|------|------|
| 文件 | `read`/`write`/`edit`/`hashline_edit`（file.mjs）、`insert_after`/`apply_patch`/`ls`/`delete`（more-file.mjs） |
| 编辑保障 | `lint`（linter.mjs——零依赖级联：JS/TS full 走 node --check/tsc 等；描述同步） |
| 列表 | `checklist`（checklist.mjs） |
| 搜索 | `glob`/`grep`（search.mjs）、`code_search`/`doc_search`（code.mjs）、`repo_outline`（repomap.mjs）、`tree`（tree.mjs） |
| Git | `git`（git.mjs + git-ext.mjs/git-checkpoint.mjs——clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv/checkpoint 快照子系统） |
| 系统 | `bash`（shell.mjs）、`process`/`get_current_time`（ops.mjs）、`file_ops`（ops.mjs） |
| 网络 | `websearch`/`fetch`（web.mjs） |
| 交互 | `question`（question.mjs——面板内联卡） |
| 媒体 | `read_image`（read_image.mjs） |
| 代码智能 | `lsp`（lsp.mjs——VS Code 原生语言服务）、`execute`（execute.mjs——纯净 node ESM 子进程，零预置全局；scriptFile + nodeArgs） |
| IDE 集成 | `focus`（focus.mjs——打开文件/定位光标）、`context`（context.mjs——按需 IDE 态快照：cursor/tabs/hover/diagnostics/未提交改动；editor-context.mjs 每轮自动注入当前文件内容，工具覆盖其余态） |
| 记忆/索引 | `memory`（memory-tool.mjs——文件式条目 + frontmatter；配 embedding key 向量检索否则关键词回退） |
| 会话/协作 | `wait_for`、`peer_instances`（extension/peer-instances.mjs——只读） |
| 元工具 | `task`/`recent_changes`/`subagent`/`plan`/`goal`/`skill`/`verify`/`timer`/`advisor`/`eng`/`read_history`/`consult_start`/`consult_stop`（agent-tools/，§9/§10） |

**lsp（VS Code 原生实现）**：CLI 自起 LSP server 进程（JSON-RPC over stdio，需
config.json `lsp.servers`）；VS Code 侧直接用编辑器语言服务
（`vscode.executeDefinitionProvider`/`executeReferenceProvider`/
`executeHoverProvider`/`executeDocumentSymbolProvider` +
`languages.getDiagnostics`）——无需配置、无需进程管理，任何装有语言扩展的语言可
用。子命令与 CLI 一致：definition / references / hover / symbols / diagnostics。

**权限审批（webview 逐工具弹窗 + 批确认）**：approve / deny / approve-all +
diff 预览（`diff-preview.mjs` 虚拟文档原生 diff）；同批合并询问
（`collectBatchPermission`——同一 response 中 ≥2 个经前置门禁的非只读工具一次
询问：approve all / one by one / deny；无 handler 回退逐项通道）；planMode 前置
门禁与只读批分组按 `tool.isReadonlyAction(args)`；控制类豁免（cancel——
免审批、planMode 放行）。autoApprove 短路 + live 读取（§6）。权威源 =
AGENT-LOOP.md「4. 工具调度」「4.2 approval 批确认」。

**子代理零 git（AGENT-LOOP.md §7.4 镜像）**：explore/plan 子代理不注入 git
上下文（本端实现从未注入——childInput = task 原样）；描述与实现一致
（"No git context injected"）；审计任务书（auditTaskBook）附零 git 范围权威
声明（`_touchedFiles` 为审计范围——工作区未列改动不作超清单依据）。

**question 使用抑制（AGENT-LOOP.md §16）**：question 工具克制使用；execute 前置
校验：`question` 文本 >100 字符 / `options` >4 条 → 返回错误串、不调 onQuestion
（2026-09-06 用户裁定 100/4）；卡片换行保形（pre-wrap）+ 高度兜底（§11.2）。

## 8. 子 agent 与后台事件系统（subagent 族 / consult / escalate / advisor-async / 挂起）

机制语义的权威源 = CLI AGENT-LOOP.md §7（子代理）/§8（工程交付协议）/§9（挂起回
合）/§10（任务调度器）/§11（回合外事件后台化）/§14（会诊/飞刀）——本文档只记本
端结构与行为差异，不复制正文。

### 8.1 subagent 单工具动作面

**"ONE tool, FIVE actions"**——`action` 缺省 spawn（既有调用零迁移）；枚举 =
spawn / status / cancel / escalate / **consume-design**：

- `action:"spawn"`：起一个隔离上下文的子代理，只回最终报告。`task` 必填
  （self-contained——子代理零会话上下文）；`role`/`model`/`designId`/`designToken`
  /`async`/`files`/`dependsOn` 可选。
- `action:"status"`：非阻塞进度查询（id 单查或全池概览），零消耗——running 条目
  携 `{role, model, elapsedSec, turn, maxTurns}` + touched-files 摘要
  （touchedFiles 前 5 / touchedMore / 占位 "—（尚无改动）"/"—（未启动）"）。
- `action:"cancel"`：定向中止单个后台 async 子代理——`id` 必填（防误全停；
  Ctrl+C 停全部）；running 条目 abort → `{id, status:"cancelled"}`（不合并、不入
  pending、冻结通知）；queued 出队 → `{id, status:"cancelled", was:"queued"}` +
  position 前移；未知/已完成 id error；幂等。
- `action:"escalate"`：飞刀——consult 模型候选池（agent.consultModels）里飞入强
  模型做实现（写权限 + 术后报告），缺省 async；工程模式不可用（实现走
  eng-coder）。触发词条款："用户说 飞刀/escalate → 调 action:'escalate'"。
- `action:"consume-design"`（2026-09-07 链终消费制，工程模式父侧）：链终消费 design 的
  token 槽——designId 必填（多槽会话）；消费后再 spawn 同 designId 机械拒绝；幂
  等（未知/已消费 = no-op）。修正轮复用同槽，链还开着不得消费。
- `action:"check"` **已删除**（2026-09-06 用户裁定：check 是冗余 API——需
  要报告 = 同步 spawn；async = 后台 + 结果自动送达）——**不写回**；status 非阻塞
  查询取代轮询引导（描述含"查进度用 status——check 会阻塞直到完成"防误用语义已
  随删除退役）。

角色按模式互斥（modeRoleField——schema 首道防线 + 运行期硬门禁双保险）：非工程
模式 enum `["explore","plan","coder"]`、工程模式 enum `["explore","plan",
"eng-coder"]`；schema 过滤让模型看不到非法角色，execute 内运行期校验不替代：
（逐字——`subagent.mjs`）：

```
Engineering mode: use role='eng-coder' for implementation tasks.
Engineering mode is not active — use role='coder' for implementation tasks.
```

suffix（工程模式拼到工具级 description 尾，逐字）：
`In engineering mode, use role='eng-coder' for implementation (coder is disabled).`
非工程 suffix = `""`。角色名精确匹配 fail-closed（变体拼写
"Coder"/" coder" 绕过门禁的 coder-leak 修复——Unknown role error）。
"Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes
explore/plan/eng-coder. The schema enum reflects the active mode."
（当前措辞在 `subagent-spec.mjs`/`modeRoleField`——本体在代码，本文档只指针。）

描述面：`subagent-spec.mjs` 的 description = CLI 权威版逐段对齐（本端有意差异仅
面板 action 段剔除——VS Code 无 panel action）；async 收尾锚句（逐字定稿于
AGENT-LOOP.md「7.5 check 删除 + async 锚句」，双端照抄 fail-when-unchanged）——"the
child runs in the background and its report is delivered to you automatically
— before your next turn, or digested in the suspension session — so end the
turn; do not poll or wait for the result."（防模型自发轮询挂起——内容断言锁定
两端各自，本体在 spec——本文档只指针）。

### 8.2 async 与后台池

- **async 缺省（现行——AGENT-LOOP「7.3 async 子代理」）**：depth-0 顶层所有角色
  spawn 缺省 async；escalate 同规则缺省 async（AGENT-LOOP「14」）；depth>0 恒同
  步（拒绝 async spawn——"async spawn only available at the top level"；
  `async:false` 显式阻塞。工具
  `async` 描述：role 级默认措辞 → "Default: depth-0 → true"。
- 并发上限：`ASYNC_SUBAGENT_LIMIT = 4`（历史常量，随角色分池演进——见下）；角色
  分池（AGENT-LOOP §11.1 R14）：`ASYNC_POOL_LIMITS { engCoder: 4, other: 4 }`，
  entryDomain 单一事实源，`agent.poolLimits` 面板可配置（逐键校验 payload-wins）；
  满池排队返回 `{id, role, status:"queued", position, waiting?, reason?}`，settle
  自动补位（refillPool 最早可启动扫描——waiting 越行不阻塞槽位）。
- 终态：settle 即翻 done + 墓碑（`history._asyncTombstones`）；报告自动送达——
  回合尾 collectSettledAsync 直注入或挂起期 digest 注入（§8.4）——arrival order
  多结果按完成序注入；cancel 的 cancelled settle 不入 pending、不直注入、停止冻
  结通知。
- 任务调度器（AGENT-LOOP §10）：`files`（写域声明——文件级路径；目录声明拒
  绝）/`dependsOn`（先序 id；报告已自动送达的 id 视为满足）；重叠串行化、依赖链
  自动启动、环拒（assertNoDepCycle）、sync spawn 冲突拒（"sync spawn
  (async:false) cannot queue behind a scheduling conflict…"）；依赖被取消/失败 →
  条目驻留标记 "dependency cancelled" 由模型决定（AUTO 会话自动启动）；SLA
  waiting 行渲染 + 停滞检测。
- id 分配：`nextSubagentId(parent)` 共享分配器（计数器与池内最大 key 取上界续
  号——async 子代理 id 跨 runAgent 复用的修复，spawn 与 escalate 同用）；
  status/cancel 数值键归一（纯数字字符串归一化，错误消息回显原值）。

### 8.3 eng-coder 交付协议（AGENT-LOOP §8 镜像）

- 交付协议在 eng-coder **内部闭环**（async 为其缺省运行形态——depth-0 全角色
  缺省 async，§8.2）：实现 → explore 偏差审计
  （**BLOCKING ONLY**——受限变体 spawn-only，无 status/escalate/async；审计预算
  ≤6，第 7 次机械拒绝 = stalled 信号；任务书机械追加 = 父 spawn 任务书 verbatim
  + 实际 `_touchedFiles` 并集，非自述清单）→ dirty 自修 → advisor 复评 → 收敛 →
  一次交付。
- **token 门**（authorizeEngCoderDesignToken）：eng-coder spawn 必须持有
  advisor(type='design') 评审 0🔴 签发的 token——格式（`uuid:expiresAt`）+ TTL
  fail-closed；**过期展示即删除死槽**（R16），mismatch/畸形拒绝不删槽；
  `_engDesignTokens.get(designId) === token` 槽位匹配。写门禁：eng-coder 子代理
  spawn 时经 `engDesignReviewed` 预授权（免逐写询问——豁免粒度仅 onPermission
  Request 阶段；design-token/planMode 等前置门先于权限阶段且原样生效）。
- 变更记账：`_touchedFiles` 机械跟踪；`mergeChildMutations`——**取消路径不合并**
  （磁盘半成品不入父 guard 记账，不触发 verify/advisor 推回）；成功路径合并入父
  `_fileMutEvents` 供 guard 推回判定。delivery 报告含轮次/终态/audit 记录
  （修正轮 ≤5；stalled 不静默）。
- 受限 spawn（engAuditSubagentTool）：eng-coder ctx 内 subagent schema = role 仅
  explore、async 参数移除（同步强制）、描述点名 AUDIT/BLOCKING ONLY；机械层
  gateEngCoderSpawn 在 mode 门之前执行（eng-coder 专属错误先于通用工程模式错
  误）。

### 8.4 挂起回合（AGENT-LOOP §9 镜像——VS 结构差异）

挂起态是交互层状态：用户回合结束而后台池仍 live → 不阻塞回合，进入挂起会话——
输入放开（新消息经 `panel._chat` 排队 + 唤醒）；settle 事件驱动 auto-turn 消化
（digest：手动档 organize-only 禁 spawn/写——动作域模板
`AUTO_TURN_DIGEST_DOMAIN` 注入；AUTO 档全语义推进）；池空 + 无待处理输入 → 补发
冻结自然退出。排队用户指令合并（R15）：单批 ≤8 条（MAX_MERGE_ITEMS）且合并注入
≤2000 字符（MAX_MERGE_CHARS）；≥2 合批编号注入；超长/带图/空 → 直发单条保序；
截批留队不丢。digest 撞 ContinueError → AUTO 自动 resume / 手动静默停止（部分消
化留历史不丢）。

**VS Code 结构差异**（与 CLI 同语义移植）：

- CLI 的池/pending/_suspended 挂 agent 对象（跨 run 存活）；VS Code agent 对象
  per-run 重建——全部挂共享 depth-0 history 数组（§6）。
- 唤醒单槽：`panel._suspWake`（waitForSettleOrWake 注入）——`_chat` 挂起分流、
  settle 回调、abort 分支同槽（历史 `susp.wake` 死字段修复——**VS 实现注**）。
- 释放窗口守卫：回合尾先于任何释放点登记 `panel._suspPending`，generateTitle
  await 窗口内 `_chat` 入队 `_suspQueue`（零并发独立回合）；池已空/中止/面板消失
  → 普通回合兜底（零丢失）。
- 中止统一：每次 controller 创建/重建登记 `panel._turnControllers`；会话中止
  （Stop/Ctrl+C/dispose）统一 abort 全部（旧 controller 的池 children 一并停止
  ——aborted settle 即出池清理，不注入陈旧错误）；中止后 digest 排队消息**无条件
  消费残余**以普通回合按序执行（T-S21——中止路径零丢失）。
- 会话 lines 双键：会话入口 lines 携 `contextHistory: history`（in-session 回合
  按 activeLines 契约读 loadedLines.contextHistory——缺键致 digest 死循环的事故
  修复）。
- 挂起 UI：settle 期间块驻留活动面板（"done · awaiting digestion"——§11.1），
  digest 完成逐条补发 done 回收；状态行（⏳ 后台 N 子代理 + 待消化计数）；
  输入框永不锁（loading.js `on && !susp`）；digest 中 Enter 由 host 排队
  （send.js `isRunning && !S._suspended` 才拦截）。

### 8.5 会诊 / 飞刀 / advisor 完全异步化（AGENT-LOOP §14/§11.2 镜像）

- **consult**：工具面 = consult_start/consult_stop（**consult_check 退役**——结
  果自动 digest 注入后无消费对象）；会话容器 = `history._consultSessions`（跨 run
  存活）；settle 判定 = 会话 pending==0（全 settle 一次注入）→ park 进
  `history._pendingConsultResults` → 下回合 run-start/digest 注入；stop/abort 弃
  （不入 pending）；子代理信号 = sessionSignal ?? turn signal；挂起期撞 turn cap
  自动降级 partial（不弹继续卡——无人在面板前）。
- **escalate**：sync 路径（async:false）verbatim 保留；缺省 async 入 **other 池**
  （与 explore/plan 共享 4 槽——池满公平排队）；settle 三分类：done → merge-all
  + 重叠警告入报告；error → partial merge 决策（父 `_fileMutEvents` 重叠 → 不
  merge + 报告列差异；无重叠 → merge）；cancelled → 不入 pending。settle 即出池
  （status 查为 unknown——报告经 digest 自动到达）。
- **async advisor（R13）**：`advisor-async.mjs`——`_asyncAdvisors` 独立池
  （ADVISOR_POOL_LIMIT=2 超限拒）+ launchAsyncAdvisor（design reviewId=designId
  / 续跑轮现铸 token / rv 实例上下文）；settle 记账（陈旧判定跨 run、token 入槽
  + engPersist slot 直写、round/prior ≤5、cancel 不入 pending 不入槽）→ digest
  注入 + guard 未决不推回 + cancelAdvisorReview。工具 async 参数：depth-0 缺省
  后台（非阻塞默认——顶层评审不卡回合）；depth>0 拒/恒同步（eng-coder 内自审不
  翻转）。UI：panel-messages cancelSubagent 路由 role=advisor + webview
  subBlockTarget 加 advisor（⏹/冻结复用）。

### 8.6 子代理活动显示（R22——本地 webview 机制）

子 agent/consult/escalate/advisor-async 活动块在**底部固定活动面板**
（`#subagent-activity`）渲染（不随 #messages 滚动），终态**冻结折叠入消息流**——
机制细节与冻结身份头格式见 §11.1。角色全同通道（频道名差异仅块键/折叠归属）。

## 9. 工程模式与评审（advisor / eng）

**会话级模式开关（2026-09-08 现行——权威源 = CLI ENGINEERING-MODE.md）**：
`engineering` 与 `advisor.guard` 都是**会话级**——事实源 = 当前会话槽位文件（slot
显式值 > config.json 兜底 > false）；config.json `agent.engineering` /
`agent.advisor.guard` 降为 CLI 兼容镜像（面板 toggle 双写：slot 先写 + config
mirror——setAdvisorGuard/setEngineeringEnabled 消息处理，`_pushSettingsLight` 反
射）。持久化：槽位文件（agentState 每 turn 随 saveLines 落盘）+ `engPersist:
{cwd, slot}` 通道（async advisor settle 直写）。

**advisor 工具语义（评审能力恒启用）**：`enabled` 双义开关废弃（评审无禁用开关
——不配置也正常执行）；开关收敛为 **guard**——`advisor.guard === true`（默认
OFF）时收尾推回强制评审。工程模式豁免（协议内必审，不推回）。工具栏按钮消息
`setAdvisorEnabled` → **`setAdvisorGuard`**（消息协议表与代码同步——本端消息名，
见 AGENTS.md）；按钮/设置面板状态读 `settings.advisor.guard`。

**guard 推回（收尾注入，run-stages.mjs——逐字前缀）**：

```
[System reminder: you changed code in this run and MUST get an advisor review
before finishing (round N). Call the `advisor` tool now. This is required, not
optional — …]
```

触发条件（run-stages.mjs 逐项）：`advisor.guard === true` + 非工程模式（工程自有
强制门——永不推回）+ 本 run 有代码变更（`_mutatedThisRun` 且 `hasCodeMutations`
——`_touchedFiles` 含非文档路径）+ 本 run 未评审 + 无在途 async 评审（未决不推
回——等 settle 判定）+ 推回次数与评审轮 < 上限。verify guard 同族 OPT-IN
（`agent.verifyGuard === true`）。

**评审工具**：`advisor` 类型 = design（文档评审）/code（代码评审默认）；评审子代
敛协议（round 1 全量 → round 2 验证+新明显问题 → round 3+ 严格验证，机械上限 5
轮）、会话内 `_advisorSession` 复用、`.thincoder/advisor.md` 自定义标准、评审对象
declaration（mechanical——type/target/status/reason/exclude 注入评审头）——全部与
CLI 一致（权威源 = AGENT-LOOP.md §12）。design 评审增 Document ownership 维度
（矛盾 🔴 / 碎片化 🟡）+ 引用纪律（file:line 引用格式 + unverified 标注）——评审
prompt 本体在 `src/prompts/advisor-design.md`（指针）。provider 解析：
`resolveAdvisorProvider`（未配 advisor.provider → 继承主 provider，恒启用零障
碍）。

**design token（现行——无 HMAC 防伪层，2026-09-06 用户裁定"安全剧场"）**：token
= 无签名流程凭证 **`uuid:expiresAt`**（2 段格式 fail-closed——畸形/存量 3 段
HMAC token 一次性格式错误失效，需重新评审）；TTL 默认 **7 天上限**
（TOKEN_TTL_DEFAULT_MS——v2 2026-08-25：多批交付一周内不再复评未变设计），
`agent.engTokenTtlMs` 可覆盖（非法值回退默认，永不静默关上限）。签发形态：评审
0🔴 时 reviewer 以 `[DESIGN-TOKEN:…]` + designId 回显（messages.mjs 逐字模板——
reviewer 侧），引擎侧 Approved 后缀（buildApprovedSuffix——sync/async settle 共
用 builder）。eng-coder spawn 校验 + 过期删槽见 §8.3；consumption = §8.1
consume-design。

**engineering 会话行为**：主代理 system prompt 换 `engineering.md` + 项目
METHODOLOGY.md；**dispatch 门禁**机械拦截 design review 通过前的代码文件写入
（**docs/** 与根级文档豁免——写文档即设计步骤；src/ 及其余非文档文件需 token；
拦截文案见 execute-tools.mjs——"write the design document in docs/ first, then
call advisor with type='design'…Implementation is done by eng-coder
subagents."）；`eng(enter)`/`eng(exit)` 工具开关 + 模式 UI（ENG 按钮）；非工程模
式 subagent schema 不展示 eng-coder（§8.1——schema 层防"非工程盗用 eng-coder"，
运行期硬门禁保持）。

**提示词借鉴增量（kimi-code 对照）与开工前计划确认纪律**：explore 彻底度分级
（quick/medium/thorough）+ system.md 确认理解补"列出最重要的验收标准"；任何写
代码/写文档动作前纯文字复述"理解+计划"并等用户明确确认（无豁免；子 agent 不适
用）。prompt 本体在 `src/prompts/`（字节一致约束已取消——设计锚为准，§14）。

## 10. 上下文管理与压缩（src/context.mjs / src/compact.mjs）

统一规范权威源 = CLI `CONTEXT-COMPACTION.md`（本端只记语义摘要 + 本端对齐形
态）。压缩/蒸馏逻辑 2026-08 拆至 `compact.mjs`
（compactHistory/truncateFallback/shrinkOversized/摘要/蒸馏/tailStartByBudget）；
`context.mjs` 保留 doc 注入等非压缩职责（含仓库大纲 builder——repo_outline）。

- **触发**：仅安全点（history 末尾为 user/tool）且完整 prompt 估算 ≥ 阈值；**实
  测优先**——上次响应的 `usage.prompt_tokens` 为基线，之后消息按增量估算（无基
  线时 system+tools+history 纯估算）。
- **阈值**：显式 `agent.compactThreshold` 优先，否则 auto = 模型 context ×
  **0.6**（为注入与输出/reasoning 留余量）。
- **策略**：无 head（KEEP_HEAD=0——最早消息可能是已完成旧任务，锚点留给当前任
  务）+ LLM 摘要（thinking 关闭、对前端静默；**摘要目标 ≤1K tokens**——D13 硬目
  标 + 砍价优先级：已完成 recap 一行 → FILES CHANGED 注释 → 进行中叙述收紧 →
  NEVER cut 设计锚点/UNRESOLVED）+ tail（窗口自适应 `max(10, ctx/100K×30)` ≤40%
  历史，orphan tool 拉回 owner；再受 **15% token 预算**约束——tailStartByBudget
  超预算 pair-safe 前移 tailStart、保底 10 条；倒序配对保护——VS 历史流可产生
  tool 结果在 assistant 前的倒序形状（2026-08-16 400 事故实证），收紧判据 = REVERSE
  保护同源 callsGapAfter 单一实现，CLI 端无此类别）。
- **降级链**：摘要 LLM 失败 → 连续 3 次后 `truncateFallback` 确定性截断（无 LLM
  调用）；无 middle 可切 → `shrinkOversized` 单消；空响应（reasoning 耗尽/截断）
  → 注入 reminder 重试上限 2 次，仍空才抛错。
- **回注**：task 列表（先清旧注入去重）+ plan mode + AUTO/permission reminder。
- **可见性回调（本端对齐形态——CLI 无 TUI 面板）**：onCompressStart
  （摘要前——{ messages: N }）/onCompress（done 完成信息/fallback 降级）/onCompress
  Fail（Q3 不再静默 + console.error）→ webview `compress` 消息四态 →
  `#compress-status` 状态行（Compressing context…（summarizing N messages）→
  Compressed: N tokens freed (Xs) / failed / fallback truncated to N messages）。
- 蒸馏（SEND-STALL-DISTILL 专题——本端 `explore-distill.mjs` 与 webview 蒸馏控
  制）：见专题文档（docs/design/SEND-STALL-DISTILL-*）。

## 11. Webview 前端

**布局（垂直序）**：session-bar（项目/会话切换）→ `#messages` 滚动区 → 行面板区
（`#subagent-panel`/`#goal-panel`/`#task-panel`）→ `#subagent-activity` 固定活动
面板（R22——空面板隐藏不占高；消息区高度 = 容器 − 面板 − 输入区）→ toolbar（状
态行/输入区/controls 行）。消息区钉底/滚动语义限定 #messages 内；活动面板独立自
滚。CSS 布局规则落 `webview/base.css`（grid 行模板）。

**文件结构（现行）**：`index.html`（shell——CSP 注入 + CSS/JS URI 占位）→
`chat.js`（编排：状态/事件/消息路由/模型选择/历史/设置）、`streaming.js`（流式渲
染 + 子 agent 块路由）、`ui.js`（DOM 构造：欢迎页/气泡/工具卡/advisor 块/loading
态）、`md.js`（markdown 渲染）、`state.js`（单一 UI 状态）、`activity.js`
（R22 块生命周期/冻结/ticker——leaf：只依赖 state/ui/i18n，panels/streaming 双
向无环）、`panels.js`（子代理/目标/任务行面板 + 挂起态）、`send.js`/`loading.js`
（输入门 + 永不锁挂起分支）、`mode-buttons.js`（ENG/GUARD/AUTO/PLAN 按钮）、
`permission.js`/`question.js`（权限弹窗/批确认/question 卡）、`diff.js`、
`settings-*.js`、`model-picker.js`/`model-menu.js`、`history.js`（懒历史滚动）、
`autocomplete.js`、`search.js`、`scroll.js`、`status-bar.js`、`i18n.js`/`i18n-dom.js`、
`session-bar.js`、`onboarding.js` 等；CSS = base/chat/controls/session/settings。

**消息流（基本回合）**：

```
用户输入 → chat.js:send() → postMessage { type:"userMessage", text, model,
reasoning, provider, images? } → extension _chat()
  → setupAgentRun（user 尾追加 "[Attached images: …]" 指针）→ runAgent()
  → onToken → { type:"token", text }
  → onReasoning → { type:"reasoning", text }（Thinking… 折叠块）
  → onToolCall/onToolResult → { type:"toolCall"/"toolResult", name, args/text }
  → onComplete → { type:"complete" }
```

中断/错误/后台态消息见 §12。回合外流（子代理活动/评审流/压缩状态/挂起状态）走
toolPanel/subagent/compress/suspension 消息族。

### 11.1 活动面板与冻结入流（R22 现行机制）

- 活动块（#subagent-activity 内）：live 头 = 状态词 + key（= 频道 label——channel
  去掉 `sub:` 前缀）+ sync/async 标 + model + 1s 本地 ticker elapsed + （终态通知
  前无 turn 段）+ ⏹（仅 running 且仅池条目——started 事件 `pool: true` 标记区
  分同步 spawn）；当前工具/等待审批 + tail 3 行 dim 摘要。
- 终态（非挂起期）：块从面板移除、**冻结折叠入消息流**——身份头格式：
  `[✓/⏹ key · sync/async · model · done Ns · turn]`（turn = 池终态通知携带的真
  实终值快照；stopped = ⏹ + stopped 词 + 无 report preview；error = ⏹ + error
  词 + 错误注记）+ 内容保留可展开 + report preview ≤8 行 dim（120 字符截行——
  CLI tool-events parity；**escalate 无 preview**）。
- **冻结落位（freezeAnchor——VS 实现注）**：settle 时刻记录锚点
  `ctx.messagesEl.lastElementChild`（settle 先于 digest 报告渲染——此刻 DOM 尾必
  在报告前）；freezeBlock 时锚点在 DOM → 锚后**链式**插入（越过连续同锚已冻结块
  + 各自 preview——同批多块保持完成序，全部位于合并 digest 报告前）；锚点被 150
  块裁剪移除 → appendChild 回退（超长会话降级边界——回退处注释防重报）；无
  settle 的直接 done/stopped/error → #messages 尾插。会话退出 freeze
  （freezeSettledBlocks）经同路径自动获得 settle 位。
- **挂起期 settle 例外**：不冻结——块驻留面板 + "done · awaiting digestion" 头
  （digest 完成逐条补发 done → 移除 + 冻结入流；会话退出 freeze 兜底未消化残
  项）。
- 频道名：活动频道 = `sub:${role}#${subId}`（subagent/advisor 族——独立块键，
  resume 续跑 subId 不变块不重复；同步 spawn 也经同一路由）；consult/escalate 频
  道嵌模型段 `sub:consult <model> #N` / `sub:escalate <model> #N`（块键含模型——
  activity.js parseChannel 两形态正则）。

- 嵌套子标：内层子代理文本行首 dim 子标（`chunk.sub`——如 `explore#1`，runChild
  forward 去前缀附加；同 sub 文本合并续行不重复前缀；advisor 频道照旧折叠）。
- 150 块 DOM 裁剪：冻结块计入 #messages 裁剪（与 advisor 块同规则无豁免）；活动
  面板无独立 DOM 上限（并发池天然约束 + digest 回收 + 面板自滚）。
- 实现注：`String.prototype.sub` 陷阱——toolPanelPayload 的 `chunk?.sub` 在
  string chunk 上取到 String 内建方法（truthy）——string 兼容分支显式
  `undefined`；appendAdvisorChunk 合并分支 `textContent +=` 会清掉行内子标
  span——改 `appendChild` text node。

### 11.2 交互组件要点

- 权限弹窗/批确认 UI（approve/deny/approve-all + 原生 diff 预览）；AUTO 按钮翻
  转会话级 autoApprove。
- Question 卡（2026-09-07 对齐修复）：选项按钮包 `.question-options` 容器（成列
  width:100% text-align:left）→ `.question-actions` = 底部操作行（input
  flex:1 + submit + cancel）；卡内字号/字重 scoped 覆盖（14px；.perm-btn
  font-weight 400——.perm-btn 无卡外消费点，scoped 为防未来复用漂移的防御性选
  择）；`.question-text` pre-wrap 保形。
- 粘贴图片：attach 按钮/粘贴 → dataURL 预览条 → 发送时随 userMessage 上送。
- 设置面板：模型/Provider/代理/工具/agent 分页（settings-*.js）——agent 页含
  poolLimits、guard/engineering 反射等。

## 12. 消息协议（webview ↔ extension）

**寄存器**：基础会话消息表以 AGENTS.md「Webview ↔ Extension Message Protocol」
为准（userMessage/abort/interrupt/newSession/switchSession/deleteSession/
getAgentSettings/agentSettings/selectModel/selectReasoning/setAdvisorGuard/
setEngineeringEnabled/token/reasoning/turnBreak/toolCall/toolResult/complete/
loading/aborted/error/providerInfo/autoApprove/models/sessions/historyPage/
loadOlder/question/questionResponse/clearMessages/userMessage(回放)/
assistantMessage）。本节登记**扩展机制消息族**（本架构权威源——寄存器同节下表）：

| 消息 | 方向 | 载荷/语义 |
|------|------|------|
| `toolPanel` | ext → wv | `{ type, name, kind, text, round, model, sub }`——活动流 chunk（advisor/子代理/consult/escalate）；`kind` = start/think/text/tool；`sub` = 嵌套子标（string chunk 分支恒 undefined——§11.1 陷阱注） |
| `subagent` | ext → wv | `{ type:"subagent", ...info }` 展开透传——started（池条目带 `pool: true`）/settled/done/error/cancelled 终态 + turn/maxTurns 终值快照 |
| `cancelSubagent` | wv → ext | `{ id, role }`——⏹ 点击路由 → 池条目定向 abort（role 交叉校验防陈旧按钮误停；未知 no-op；advisor role 复用同路由） |
| `batchPermissionResponse` | wv → ext | approveAll / oneByOne / deny |
| `compress` | ext → wv | start/done/failed/fallback 四态（§10） |
| `suspension` | ext → wv | 挂起态行/冻结通知（settled→done 补发/active:false+freeze） |
| `onAgentTurn` | 内部 | 每轮迭代 turn 计数钩子（顶层无订阅 no-op——池条目同步用） |

**演进纪律（三落点）**：新增展示字段必须同时落三个点——发射端 chunk / 桥
postMessage 载荷（panel-toolpanel.mjs `toolPanelPayload`——显式白名单纯函数）/
webview 渲染端（历史断链事故：只改发射端与渲染端、漏桥 → model 字段从发布首日
被丢弃——2026-08-26 修复锁桥测试）。string/对象双分支在 payload 构造处统一推导
（对象载荷字段透传、string 分支字段 undefined 安全降级）。

## 13. 扩展点状态表

| 扩展点 | 状态 | 备注 |
|--------|------|------|
| Memory 三层体系 | ✅ 基础 | 文件式 markdown 条目 + frontmatter（CLI 条目格式兼容，put/search/list/delete/clear）；配 embedding key 向量语义检索否则关键词回退；无 FTS5、无 sqlite |
| MCP 支持 | ✅ | stdio + HTTP/WS transport，工具**动态展开为原生工具**（`{server}_{tool}` 前缀，CLI parity——统一规范见 CLI `MCP.md`；旧 mcpTool 网关废弃）。配置 `~/.thincoder/config.json` 的 `mcp.servers[]`（面板 Settings 管理） |
| Checkpoint | ✅ | 全量副本快照（~/.thincoder/checkpoints/，CLI 同存储同格式——cwdHash12 + 盘符大写归一）+ list/create/rewind/cat/versions 单文件恢复（详见 CLI `CHECKPOINT.md`）；git 破坏性操作前自动快照 + bash gitGuardSnapshot |
| Image input | ✅ | `read_image` 工具（spec.multimodal 驱动挂载/剥离）；粘贴/拖拽/附加按钮 → dataURL 落盘 → `[Attached images: …]` 指针 → read_image 通路 |
| Skill 系统 | ✅ | 读取 `.thincoder/skills/` 下 .md，列表注入上下文 |
| 权限审批 | ✅ | webview 逐工具弹窗 + 同批合并询问 + diff 预览；autoApprove 会话级槽位字段 live 读取 |
| 挂起会话 | ✅ | §8.4——后台子代理期间的会话级 digest 驱动 |
| 活动面板 | ✅ | §11.1——R22 底部固定面板 + 冻结入流 |
| 懒历史 | ✅ | §4——分页 + scroll 补偿 |
| 富注入 | ✅ | SESSION §11——disk 重放 + git/env/restart 注入 + time 尾契约 |

## 14. 与 thincoder CLI 的差异

| 方面 | CLI | VS Code |
|------|-----|---------|
| 用户界面 | 裸 ANSI TUI | Webview (iframe) |
| 会话存储 | `~/.thincoder/sessions/`（共享） | 同上（共享同一目录；端 marker 各自 `.cli`/`.vscode`） |
| 配置存储 | `~/.thincoder/config.json`（共享） | 同上（同一文件；apiKey 回退环境变量） |
| 工具目录约束 | 工作目录（process.cwd()） | 第一个 workspace 文件夹；两端口径均为 **no directory restriction**（2026-09-02） |
| 文件打开 | TUI 内显示 | VS Code 编辑器标签页（WorkspaceEdit undo + 立即保存） |
| 权限审批 | TUI 内交互式（y/n/a） | webview 弹窗 + 批确认；autoApprove 会话级槽位字段两端语义一致 |
| 记忆系统 | 3-layer FTS5 + vector | 文件式 markdown 条目 + 可选向量（无 FTS5） |
| MCP | ✅ | ✅ stdio + HTTP（同一 config.json） |
| lsp 工具 | 自起 LSP server（config lsp.servers） | VS Code 原生语言服务（零配置零进程） |
| 子代理/后台 | 池挂 agent 对象（跨 run） | 池挂共享 depth-0 history 数组（agent per-run） |
| 面板动作 | 有 panel action 段 | 无（结构差异是设计决定——description 剔除该段） |
| 命令队列 | TUI /cmd 命令队列 | 无——webview 命令走 msg.type 按钮通道（排队合批排除类零项） |
| 活动渲染 | TUI 面板/折叠动画 | 活动面板 + 冻结入流（机制语义趋同，不逐像素镜像） |
| 验证层 | 自有测试组织 | slow-gate 分层 + test/files.mjs 显式清单（TESTING.md §1 同构） |

**字段往返**：共享槽位文件全量覆盖写 + `...existing` 透传（§4）——CLI 写入的
`activeModel`/`engineering`/`engDesignToken` 等字段 VS Code 侧往返不丢。

**提示词镜像（byte-identical 已取消——2026-09-04 起）**：本仓 `src/prompts/*.md`
与 CLI **不再承诺字节一致**——锚文本在设计文档（如 AGENT-LOOP.md §12.4 及各锚
集）逐字定稿，两端各自照抄实现；差异靠设计评审 + 交付审计发现（非机械比对）；
同步脚本候选已取消。两端当前文本仍一致（末次维护 2026-09-04）——未来允许漂移/
独立演进。subagent 工具 description 两端各自同步语义（本端 = CLI 权威版逐段对
齐，有意差异仅 panel 段——§8.1）。

## 15. 单一权威源与指针（收敛——本文件 = VSC 本地架构 + 指针）

机制语义统一指向 CLI 端文档（**同一机制只留指针不复制正文**）；VS Code 独有或本
端实现面的行为在本文档对应章节：

| 机制域 | 权威源（CLI 端） | 本文档对应 |
|--------|------------------|-----------|
| Agent 循环/调度/批审批/收尾 | AGENT-LOOP.md §2/§4/§6 | §6/§7 |
| 子代理/动作面/async/零 git/锚集 | AGENT-LOOP.md §7 | §8.1/§8.2 |
| eng-coder 交付协议 | AGENT-LOOP.md §8 | §8.3 |
| 挂起回合 + digest | AGENT-LOOP.md §9 | §8.4 |
| 子代理任务调度器 | AGENT-LOOP.md §10 | §8.2 |
| 回合外事件后台化（分域池/async advisor/排队合并） | AGENT-LOOP.md §11 | §8.2/§8.5 |
| 评审收敛/铁律/文档纪律/byte-identical 取消 | AGENT-LOOP.md §12 | §9/§14 |
| 会诊/飞刀异步化 | AGENT-LOOP.md §14 | §8.5 |
| question 抑制 | AGENT-LOOP.md §16 | §7 |
| 会话存储/端分离/GC/注入 | SESSION.md | §4 |
| 工程模式/会话级开关/eng token | ENGINEERING-MODE.md | §9 |
| 上下文压缩 | CONTEXT-COMPACTION.md | §10 |
| Provider/transport/能力适配 | PROVIDER.md | §5 |
| 工具系统/安全边界 | TOOLS.md | §7 |
| MCP / Checkpoint | MCP.md / CHECKPOINT.md | §7/§13 |
| 测试分层 | TESTING.md | §3/§16（变更记录） |
| 维护寄存器（消息表/模块图/约定） | 本仓 AGENTS.md | §3/§12 |

## 16. 变更记录（历史折叠——机制正文已并入对应章节；详见 git log）

- 2026-08-22/23：GLM 5.3 畸形 tool_calls 防御——parseStream 单点防御 + 机读线
  告警（PROVIDER.md §10 权威；src/provider/transports/openai.mjs + agent.mjs）。
- 2026-08-22：LLM 标题生成同修（IK9UZ8——thinking 关闭，SESSION.md 变更段权
  威；src/extension/generate-title.mjs）。
- 2026-08-26：子 agent/advisor 模型显示——桥丢字段断链修复 + **三落点纪律**确
  立；toolPanel 白名单纯函数 toolPanelPayload（panel-toolpanel.mjs）。
- 2026-08-28：Qwen 思考关闭映射（resolveEnableThinking 白名单——PROVIDER.md
  §12）。
- 2026-08-28：GLM-5.3-Flash 支持（图片输入 spec 驱动——扩展点表同步）。
- 2026-08-28：**VS 实现注**——会话切换竞态修复（运行中禁止切换三守卫 +
  saveLines slotOverride；§4 切换纪律）。
- 2026-08-28：子代理工具描述 = CLI 角色能力矩阵 + 委派动机逐字对齐
  （AGENT-LOOP.md §7.1；描述本体现于 subagent-spec.mjs）。
- 2026-09-02：deepseek 400 三件套——escape v5 + UTF-16 安全截断 + 续写构造
  （PROVIDER.md §14；§5）。
- 2026-09-02：压缩可见性回调 + webview 压缩状态行（CONTEXT-COMPACTION.md §7 对
  齐形态；§10）。
- 2026-09-02：subagent 异步化原型（async 分支 + 槽位队列 + subagent_check——
  早期批次形态——已 supersede，并入现五动作面与自动送达，见 §8.1）。
- 2026-09-02：approval 批确认（AGENT-LOOP.md §4.2；collectBatchPermission +
  batchPermissionGate + webview 合并行；§7）。
- 2026-09-02：工具作用域限制移除（TOOLS.md §4——no directory restriction；
  exec-prelude 删除；§7 路径纪律）。
- 2026-09-02：lint 基建零依赖化（node --check 级联 + scripts/check-syntax.mjs；
  npm run lint）。
- 2026-09-02：模型上下文长度可配置（PROVIDER.md §15——providers[].context +
  providerSpec；§5）。
- 2026-09-02：压缩目标调优（CONTEXT-COMPACTION.md §8/§9——摘要 ≤1K 硬目标 +
  tail 15% token 预算；§10）。
- 2026-09-02：**VS 实现注**——tailStartByBudget 倒序配对保护增强（VS 历史流倒
  序形状独有——callsGapAfter 单一判据；§10）。
- 2026-09-02：挂起回合会话级后台双通道（AGENT-LOOP.md §9；suspension.mjs 新；
  §8.4）。
- 2026-09-02：**VS 实现注**——挂起唤醒断链修复（susp.wake 死字段 →
  panel._suspWake 单槽唤醒器；§8.4）。
- 2026-09-02：**VS 实现注**——挂起回合偏差修复轮（释放窗口竞态
  _suspPending/_suspQueue + 中止统一 controller _turnControllers + aborted
  settle 出池 + 会话 lines 双键补形；§8.4）。
- 2026-09-02：**VS 实现注**——挂起 round-2 中止路径排队消息零丢失（退出兜底无
  条件消费残余——T-S21；§8.4）。
- 2026-09-02/03：工程交付协议（eng-coder 默认 async + 内部自审计闭环——
  AGENT-LOOP.md §8）+ askContinue AUTO 续跑（ctx.getAuto 载体）+ subagent.mjs
  500 行拆分（§8.3）。
- 2026-09-03：subagent 工具面合并（单工具四动作 spawn/check/status/escalate——
  后经 2026-09-06 删 check（用户裁定冗余 API）、2026-09-07 加 consume-design（链
  终消费制）——现五动作；AGENT-LOOP.md「7.2 单工具动作面」）。
- 2026-09-03：code review 修正轮——async id 跨 run 复用（nextSubagentId 共享分
  配器）/status queued position 实时计算/数值键归一（§8.2）。
- 2026-09-03：**VS 实现注**——eng-coder 内 advisor 流可见性（runChild 增
  onToolPanel 转发——子代理块内可见评审流；escalate 同缺口随 R17 异步化补齐）。
- 2026-09-03：控制面扩展批（原 §19.5 课题）——status 决策字段 + cancel + UI ⏹ + 嵌套子标
  （AGENT-LOOP.md §7.2；**实现修点两条见 §11.1 实现注**；审计修正轮：started
  池条目 pool:true / cancel 幂等 / digest 内 cancel 放行 / forward 引擎级测试）。
- 2026-09-03：修正轮——subagent-escalate.mjs 拆出 / agent.mjs 500 行回落 /
  cancel 不合并语义（取消路径零 merge）/ spawn task execute 级校验 / cancel 路
  由 role 交叉校验。
- 2026-09-03：子代理任务调度器（files/dependsOn——AGENT-LOOP.md §10；§8.2）+
  prompts 调度器条款锚句更新（main/engineering/system）。
- 2026-09-05：§10 端分离恢复——本端 marker 记录最后使用槽位（SESSION.md §10；
  session-slots END="vscode"/resumeSlot/allocateFresh/cleanDeadOwners；§4）。
- 2026-09-05：模块拆分轮——subagent-async.mjs 1017 → 449 行 + 新
  subagent-scheduler.mjs/subagent-actions.mjs（导出面 shim 兜住零消费点改动）。
- 2026-09-06：async 描述两端对齐 + 收尾引导锚句更新（AGENT-LOOP「7.5」逐字定稿
  锚句替换旧 D-A2 形态）——action:'check' 删除（AGENT-LOOP.md §7.5；本端描述 =
  CLI 权威版逐段对齐，落 subagent-spec.mjs）。
- 2026-09-06：design token 防伪层删除（ENGINEERING-MODE.md 2026-09-06 段——无
  HMAC，uuid:expiresAt；§9）。
- 2026-09-06：question 工具使用抑制 + 卡片渲染修复（AGENT-LOOP.md §16——100 字
  符/4 选项 + 卡片 CSS；§7/§11.2）。
- 2026-09-06：测试基建 Phase 1-3（TESTING.md §1——slow-gate 分层 +
  run-fast/run-full + test/files.mjs 单一清单 + L0+ 首次实现粒度 + D-T4 镜像归
  册/D-T5 存量清理 + 红线收窄句）。
- 2026-09-06：**VS 实现注**——time-injection cache-premise 测试适配（SESSION
  §11 富注入后断言模型过时——收敛为三条契约：time 尾位/disk 重放保序打头/git 稳
  定注入不穿插）。
- 2026-09-06：回合外事件后台化统一模型（AGENT-LOOP.md §11——R13 async advisor /
  R14 角色分池 engCoder:4+other:4 / R15 排队用户指令合并 8 条 × 2000 字；§8）。
- 2026-09-06：会诊/飞刀完全异步化（AGENT-LOOP.md §14——consult_check 退役；
  consult/escalate park + digest；§8.5）。
- 2026-09-07：R22 子 agent 显示趋同 CLI——底部活动面板 + 块头升级 + 完成冻结入
  流（webview/activity.js 新；§11.1）；行面板保留与 150 裁口径裁定在案（见文首
  未决/待办状态行）。
- 2026-09-07：**VS 实现注**——R22 冻结块插入位置修复（freezeAnchor settle 锚
  点记录 + 链式落位 + 150 裁回退；§11.1 冻结落位）。
- 2026-09-07：Question 卡片 UI 对齐修复（.question-options 容器成列 + 卡内
  14px/字重 scoped 覆盖；§11.2）。
- 2026-09-08：本文档重写——当前态化（人类可读多行 markdown）+ 历史流水折叠入
  本节 + 漂移订正（preset 16→20 / 路径纪律现行 / token 无 HMAC / 动作面现行五
  动作 / async 缺省语义 / 端分离端态 / runAgent 签名与 setAdvisorGuard）。

> 注：上列条目折叠单位 = 原文档逐批追加的引用/实现段落（含其内部评审轮与测试记录）；
> 测试明细以 git log 与各批实现文件头注释为准，不复刻。
