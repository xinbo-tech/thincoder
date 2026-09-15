# ThinCoder VS Code 架构设计

> 本文件是 VS Code 扩展的架构**薄枢纽**（DOC-REORG-VSC 拆分收官——2026-09-08）：保留
> 设计原则（§1）+ 整体架构图（§2）+ 模块地图（§3，指针索引）+ 与 CLI 差异表（§4，对
> 比辅助）+ 变更记录。各机制详细正文已在独立板块档——SESSION/PROVIDER/AGENT-LOOP/
> TOOLS/ENGINEERING-MODE/ADVISOR-CONVERGENCE/CONTEXT-COMPACTION/WEBVIEW/MEMORY/MCP/
> CHECKPOINT（见 §3 模块地图「详细设计 →」列与 `README.md` 地图）——本文件只指针不
> 复制，防双份漂移。
> 约束：纯 `.mjs`、零 npm 运行时依赖、VS Code API + Node 标准库。`extension.mjs` 即
> 入口，`package.json` 声明 `"type": "module"`。

## 未决 / 待办状态行（承接开放项——不得当历史折叠）

- `eng(enter)` 的用户同意门、design token 的用户批准点、拒绝文案降噪——CLI 同存，
  两端待议（VSC `docs/TODO.md`——产品级台账已退役：台账单仓化，现体 = 仓根 `docs/TODO.md`）。
- advisor 工具集与 CLI 的差异项（CLI advisor 有 lsp，本端侧待补）——VSC
  `docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`）。
- 挂起期进程级 reminder 注入含 ISO 时间戳且位于 time 注入之前——每进程首 run 缓存
  miss 一次（单次量级，可接受）——留待 `SESSION（CLI 仓·设计）` §11 后续评估（`TODO（CLI 仓）`）。
- UI ⏹ 活动块 live 头缺逐轮 turn 段（现有状态事件不携 turn——逐轮跳动需扩展端新
  通道，触碰桥白名单，不擅建）——降级口径已定：池条目终态通知携真实终值，冻结身份
  头显示终值。记录在案，无跟进计划。
- 行面板（子代理行）**保留裁定反转（评审 #4——不得当历史折叠）**：候选评估曾裁
  **保留**（其独有载荷 = queued/waiting 行 + consult 计数/回复 preview）——SESSION-
  ACTIVITY-REVISED（2026-09-09 用户裁定）全撤（行面板 = VSC 独有历史残留——双面根源）：
  queued/consult 载荷迁活动区（区内等待块头/sub: 频道块 + 冻结 preview）——单面板形态
  一体满足用户三连——开放项关闭（实现批：#subagent-panel 零残留 + 状态行计数徽标撤）。
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
│  postMessage（消息协议——见 WEBVIEW.md §7） │  runPanelChat       │
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

> 两个产品共享设计理念、提示词体系，以及**会话数据与配置数据**（同一磁盘位置、互相
> 读写）。代码各自独立、安装独立、无运行时依赖（详见 §4 差异表）。
>
> 图注（W10 已迁核——2026-09-15）：上图 `provider.mjs`（三 transport）现体 = 核
> `thincoder-core/provider/`（core/sse/anthropic/google/responses + rate/list-models）；端侧自持镜像已删。

## 3. 模块地图（指针索引——DOC-REORG 收官 2026-09-08 刷新）

AGENTS.md 模块清单为维护寄存器；本节为分组总览 + 「详细设计 →」指针（实现为唯一
事实源；机制档名与 CLI 同名对应——各端独立正文，见 `README.md` 地图）。

| 域 | 模块 | 职责 | 详细设计 → |
|----|------|------|-----------|
| 入口 | `extension.mjs` | activate/命令注册/状态栏/WebviewViewProvider | —（装配入口——见 AGENTS.md 寄存器） |
| 装配 | `src/extension/chat-panel.mjs` | ChatPanel 类——面板生命周期、会话管理、消息路由（自 extension.mjs 拆出） | `WEBVIEW.md`（§4 消息流/§7 消息协议） |
| 装配 | `src/extension/panel-*.mjs` | 消息路由/回合驱动/会话/项目/索引/MCP/toolPanel 载荷分模块 | `SESSION.md`（panel-session 会话/懒历史 §9）、`MCP.md`（panel-mcp §2）、`WEBVIEW.md`（panel-messages 路由/协议） |
| 装配 | `src/extension/suspension.mjs` | 挂起会话驱动（digest/排队合并/唤醒） | `AGENT-LOOP.md`（§7 挂起回合 digest） |
| 装配 | `src/extension/permission-gate.mjs` | 权限弹窗门 + 批审批门 | `TOOLS.md`（§8 权限审批） |
| 装配 | `src/extension/session-io.mjs` / `session-slots.mjs` / `session-gc.mjs` / `session-slot-write.mjs` | 会话 I/O、槽位/端 marker/resumeSlot、残留 GC、槽位写 | `SESSION.md` |
| 装配 | `src/extension/settings.mjs` / `presets.mjs` / `provider-flows.mjs` | config.json 面板读写、preset、provider 增删流 | `PROVIDER.md`（§1-§3 配置/preset/增删）、`SETTINGS.md`（面板） |
| 装配 | `src/extension/generate-title.mjs` / `image-handler.mjs` / `reasoning-mode.mjs` | 标题生成 / 粘贴图落盘 / 推理档位映射 | `PROVIDER.md`（§6 spec 适配/§7 标题生成/§8 图片输入）、`SESSION.md`（§7 标题写契约） |
| 核心 | `src/agent.mjs` | runAgent 主循环 + 工具分发 + 注入 + 收尾 | `AGENT-LOOP.md`（§2 主循环） |
| 核心 | `src/agent/execute-tools.mjs` / `setup.mjs` / `run-stages.mjs` / `run-helpers.mjs` / `setup-reminders.mjs` | 工具调度/门禁/批审批、装配、收尾 guard 推回、offload/截断助手、提醒注入 | `AGENT-LOOP.md`（§3 控制/guard）、`TOOLS.md`（§5 装配/§6 调度） |
| 工具 | `src/tools/`（file/search/more-file/linter/checklist/git/git-ext/git-checkpoint/shell/web/lsp/execute/question/read_image/code/context/focus/ops/wait_for/tree/shared/edit-diff/file-edit…） | 内置工具实现 | `TOOLS.md`（§2/§9）、`CHECKPOINT.md`（快照子系统） |
| 元工具 | `src/agent-tools/`（task/recent_changes/plan/goal/skill/verify/timer/advisor/eng/read_history/consult + subagent 族） | 自律/子 agent/评审工具族 | `AGENT-LOOP.md`（子代理族）、`ADVISOR-CONVERGENCE.md`（advisor）、`ENGINEERING-MODE.md`（eng 门禁） |
| 子 agent | `src/agent-tools/subagent.mjs` + `-spec/-async/-actions/-scheduler/-escalate/-escalate-async/-spawn-gate.mjs` | 单工具动作面/描述载荷/后台池/调度/飞刀/门禁（2026-09-05 拆分） | `AGENT-LOOP.md`（§4 动作面/§5 async 池/§6 调度器） |
| 子 agent | `src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）` | 后台设计评审池 | `AGENT-LOOP.md`（§9 async 化）、`ADVISOR-CONVERGENCE.md`（评审协议） |
| LLM | `src/provider.mjs` + `src/provider/rate.mjs` + `src/provider/transports/`（W10 已迁核——现体 `thincoder-core/provider/{core,rate,anthropic,google,sse,responses}.mjs`） | 三 transport、重试、限频门 | `PROVIDER.md`（§4 transport 调用链） |
| LLM | `src/config.mjs` / `specs.mjs` / `config-presets.mjs` / `config-io.mjs` / `config-migrate.mjs` | 模型能力 spec、preset 表、config.json 读写/迁移 | `PROVIDER.md`（§1 配置/§2 preset/§6 spec） |
| 上下文 | `src/agent/setup-reminders.mjs`（回合注入——git/editor 富注入）/ 旧档 `src/compact.mjs`（W6 已迁核——现体 `thincoder-core/context.mjs`）/ `src/explore-distill.mjs` / `src/repomap.mjs`（repo_outline 工具——原 `src/context.mjs` 载体 GIT-ASYNC L21 删除） | 注入、压缩/摘要/蒸馏 | `CONTEXT-COMPACTION.md` |
| 支撑 | `src/memory.mjs`/`embedding.mjs`/`indexer.mjs` | 记忆/向量索引 | `MEMORY.md` （W8 已迁核——现体 `thincoder-core/memory.mjs`）|
| 支撑 | 核 `thincoder-core/mcp.mjs`+`thincoder-core/mcp/`（W7 迁移——原 `src/mcp.mjs`+`mcp/` 已删；端壳增量 = `src/extension/panel-mcp.mjs`） | MCP 客户端 | `MCP.md` |
| 支撑 | `src/repomap.mjs` / `src/i18n.mjs` / `src/extension/*` 端壳面（`escape.mjs`（W4 已迁核——现体 `thincoder-core/escape.mjs`）/ `log.mjs`（W1 已迁核——现体 `thincoder-core/log.mjs`）/ `proxy.mjs`（W10 已迁核——现体 `thincoder-core/proxy.mjs`）） | 仓库大纲/国际化/转义/日志/代理 | —（无机制档——见 AGENTS.md 寄存器） |
| Webview | `webview/chat.js`/`streaming.js`/`ui.js`/`activity.js`/`panels.js`/`state.js`/`send.js`/`loading.js`/`mode-buttons.js`/`permission.js`/`question.js`/`md.js`/`settings-*.js`/`model-picker.js`/`history.js`/`diff.js`/`autocomplete.js`/… | 前端渲染/交互 | `WEBVIEW.md` |

测试域：`test/`（`package.json` `"test"` = `node test/run-fast.mjs`，显式清单
`test/files.mjs` 为单一来源；`"test:full"` = `node test/run-full.mjs` 全量层）。

## 4. 与 thincoder CLI 的差异（对比辅助）

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

**字段往返**：共享槽位文件全量覆盖写 + `...existing` 透传（SESSION.md §6）——CLI
写入的 `activeModel`/`engineering`/`engDesignToken` 等字段 VS Code 侧往返不丢。

**提示词镜像（byte-identical 已取消——2026-09-04 起）**：本仓 `src/prompts/*.md`
与 CLI **不再承诺字节一致**——锚文本在设计文档（如 AGENT-LOOP.md §12.4 及各锚
集）逐字定稿，两端各自照抄实现；差异靠设计评审 + 交付审计发现（非机械比对）；
同步脚本候选已取消。两端当前文本仍一致（末次维护 2026-09-04）——未来允许漂移/
独立演进。subagent 工具 description 两端各自同步语义（本端 = CLI 权威版逐段对
齐，有意差异仅 panel 段——见 AGENT-LOOP.md §4）。

## 变更记录（历史折叠——详见 git log）

> 注：以下条目中的旧章节引用（§4/§7/§8.x/§10/§11.x/§13 等）指 DOC-REORG 拆分前
> 本文件章节；各外档引用（PROVIDER.md §N/AGENT-LOOP.md §N 等）成文时指 CLI 端同名
> 档——机制正文现已迁至 VSC 同名机制档（见 §3 指针列），条目细节以 git log 与各新
> 档「变更记录」为准。

- 2026-08-22/23：GLM 5.3 畸形 tool_calls 防御——parseStream 单点防御 + 机读线
  告警（PROVIDER（CLI 仓）§10 权威；src/provider/transports/openai.mjs + agent.mjs——W10 已迁核：现体 = 核 `provider/sse.mjs`）。
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
  （AGENT-LOOP（CLI 仓·设计）§7.1；描述本体现于 subagent-spec.mjs）。
- 2026-09-02：deepseek 400 三件套——escape v5 + UTF-16 安全截断 + 续写构造
  （PROVIDER（CLI 仓）§14；§5）。
- 2026-09-02：压缩可见性回调 + webview 压缩状态行（CONTEXT-COMPACTION.md §7 对
  齐形态；§10）。
- 2026-09-02：subagent 异步化原型（async 分支 + 槽位队列 + subagent_check——
  早期批次形态——已 supersede，并入现五动作面与自动送达，见 §8.1）。
- 2026-09-02：approval 批确认（AGENT-LOOP（CLI 仓·设计）§4.2；collectBatchPermission +
  batchPermissionGate + webview 合并行；§7）。
- 2026-09-02：工具作用域限制移除（TOOLS.md §4——no directory restriction；
  exec-prelude 删除；§7 路径纪律）。
- 2026-09-02：lint 基建零依赖化（node --check 级联 + scripts/check-syntax.mjs；
  npm run lint）。
- 2026-09-02：模型上下文长度可配置（PROVIDER（CLI 仓）§15——providers[].context +
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
  settle 出池 + 会话 lines 双键补形；§8.4。后注：_suspPending/_suspQueue 已废——
  现态 = running 拒收无排队（源 = `src/extension/panel-messages.mjs`））。
- 2026-09-02：**VS 实现注**——挂起 round-2 中止路径排队消息零丢失（退出兜底无
  条件消费残余——T-S21（已退场——设计期编号；现态不在册）；§8.4）。
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
  （AGENT-LOOP（CLI 仓·设计）§7.2；**实现修点两条见 §11.1 实现注**；审计修正轮：started
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
  锚句替换旧 D-A2 形态）——action:'check' 删除（AGENT-LOOP（CLI 仓·设计）§7.5；本端描述 =
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
- 2026-09-08：DOC-REORG-VSC 拆分收官（第 8 批）——删除已迁出机制节 §4-§13（正
  文已在 SESSION/PROVIDER/AGENT-LOOP/TOOLS/ENGINEERING-MODE/ADVISOR-CONVERGENCE/
  CONTEXT-COMPACTION/WEBVIEW/MEMORY/MCP/CHECKPOINT 各档）与 §15 CLI 权威指针表
  （用户裁定：两端独立不互指）；瘦身为薄枢纽——§3 模块地图加「详细设计 →」指针
  列，差异表 §14 移为 §4（对比辅助），历史条目旧引用以文首注为准。
- 2026-09-09：模块拆分轮——webview/activity.js 579 → 287 行 + 新 activity-view.js
  （呈现叶）/activity-freeze.js（冻结叶）（hub re-export 兜住零消费点改动——
  panels/chat/streaming/测试 import 面不变——ACTIVITY-SPLIT；§11.1 活动块面）。
- 2026-09-09：并发池统一可配置镜像（POOL-CONFIG-UNIFIED——双端同构：agent.poolLimits
  = { engCoder, other, advisor } 三键默认 4/4/4——advisor 池并入同可配体系（默认
  ADVISOR_POOL_LIMIT 2 → 4）——面板第三数字框 + 白名单 + 回退——effectivePoolLimits
  键表 3 键（advisor 仅供显示/回退——调度两域判定不消费）——同 scope 并发守卫
  （running 同 scope 拒——settled 续跑不变）——文案去数字化。同步：AGENT-LOOP §5/§9 +
  ENGINEERING-MODE §7）。

> 注：上列条目折叠单位 = 原文档逐批追加的引用/实现段落（含其内部评审轮与测试记录）；
> 测试明细以 git log 与各批实现文件头注释为准，不复刻。
