# ThinCoder 架构总览（ARCHITECTURE）

> 板块 = **架构总览**（横切薄枢纽）；本档 = 合并仓的**模块地图 + 硬约束 + 设计原则 + 接口速览**的唯一权威处。
> 逐板块机制正文各归其档（`docs/core/design/<板块>.md`）——本档**只留速览与指针，不复制**（D2 单一权威源）。
> 需求侧 = `docs/core/requirements/PHILOSOPHY.md`（三观——最高层需求）；项目层需求 = `thincoder-cli/docs/requirements/PROJECT.md`（CLI 侧**未迁**）。
> 双端对位 = `thincoder-vscode/docs/design/ARCHITECTURE.md`（VSC 端接线面**已并入（批 6）**——§3.1 壳层装配地图 + §4.1 差异表；旧档原地一字未改、留参照历史）。
> 建档：2026-09-15（**B 式迁移轮 · 第 2 批**——`thincoder-cli/docs/design/ARCHITECTURE.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`；行数口径 = 含末行的行计数）。

## 1. 定位与硬约束

本档回答一个问题：**这个产品由哪些模块构成、它们之间怎么分工**。它是新读者进入代码面的第一站，也是「某机制住哪一档」的路由入口。

### 1.1 硬约束（实核）

| # | 约束 | 实核落点 |
|---|---|---|
| 1 | **纯 ESM `.mjs`**——无 TypeScript、无转译；仓根引导为 `.cjs`（`bin/thincoder.cjs`） | `package.json` 双端 `"type": "module"` |
| 2 | **无构建步骤**——无 bundler、无打包产物；直接跑源码 | 双端 `scripts` 无 build 项 |
| 3 | **Node 版本**：CLI 产品 `>=24` · 核包 `>=22.13.0` | `thincoder-cli/package.json:19` · `thincoder-core/package.json:8` |
| 4 | **零第三方运行期依赖**——唯一运行期依赖 = 仓内核包 `@thincoder/core`（本地链接，非 registry 第三方） | `thincoder-cli/package.json:22` · `thincoder-cli/node_modules/@thincoder` |
| 5 | **仓内三目录分工**：核包 `thincoder-core/`（共享实现）· CLI 壳 `thincoder-cli/` · VSC 壳 `thincoder-vscode/` | 仓根目录树（§3） |

## 2. 设计原则

1. **零依赖**：第三方 npm 依赖 = 技术债（质量 / 安全 / 版本）；Node 标准库能做的先用标准库。
2. **接口先行**：存储 / 记忆接口为团队记忆预留扩展位（v2 目标；早期草案档 = `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md`，参照历史）。
3. **可运行验证**：每个里程碑跑通——不交付「写了没跑过」的代码。
4. **准比短重要**：长上下文常态化，信息完整优先于字数。
5. **代码是问题不是答案**：诊断修复，非朝圣模仿。
6. **面向全球**：提示词英文、界面 / 文本英文默认，不做中文限定。

## 3. 模块地图（当前态 · as-of 2026-09-15 实核）

```text
thincoder/                          ← 合并仓根（git 仓 · 默认分支 main）
├── bin/                            ← 仓根引导
├── docs/                           ← 基准层文档（唯一权威层）
│   ├── core/{requirements,design}/ ← 统一面板块档 + design/prompts/（提示词中文正本 15 档）
│   ├── cli/ · vsc/                 ← 产品面板块档
│   ├── TODO.md · TODO-archive.md   ← 项目级台账（单仓单账）
│   └── batches/                    ← 批次档
├── scripts/                        ← 仓根统一机检族（doc-anchors / check-doc-width / check-ledger 及判据核 · mirror-divergence）
│
├── thincoder-core/                 ← 核包（@thincoder/core——共享机制实现 + 共享提示词与工具描述）
│   ├── agent.mjs                   主循环（createAgent / runAgent）——见 AGENT-LOOP
│   ├── agent/                      主循环分段（dispatch / setup / run-stages / completion / record-results /
│   │                               suspension / spawn-child / helpers / post-turn / relay-prefix / setup-reminders）
│   ├── agent-tools/                元工具实现（task / plan / goal / verify / timer / skill / eng / settings /
│   │                               recent-changes / read-history / batch-segment / consult / escalate /
│   │                               advisor 族 / subagent 族 / async-settle）
│   ├── advisor/                    评审引擎（run / loop / messages / convergence / project-context / repos /
│   │                               compaction / truncate / citations / history）
│   ├── tools/                      内置工具实现（file / patch / bash / search / git / git-checkpoint /
│   │                               git-ext / web / ops / repomap / lsp / linter / execute / exec-run /
│   │                               checklist / checklist-sync / question / tree / write-path / shared /
│   │                               glob-dialect / index）
│   ├── tool-docs/                  工具描述面（模型可见文本——25 档）
│   ├── prompts/                    槽位提示词运行期落地档（15 档——正本 = docs/core/design/prompts/）
│   ├── memory/                     三层记忆 + 代码 / 文档索引 + 嵌入（core / docs / code-sync / code-index /
│   │                               schema / scan / file-walk / delete）
│   ├── provider/                   供应商 transport（anthropic / google / responses / sse / retry / rate /
│   │                               normalize / list-models / core / errors / index）
│   ├── mcp/ · git/ · traces/       MCP 客户端 · git 面（checkpoint / gitmem）· 轨迹存储
│   └── session*.mjs · config*.mjs · context.mjs · token-ttl.mjs · memory.mjs …
│                                   会话（store / slots / gc / guard / migrate / rename / segments / slot-write）·
│                                   配置（config / config-io / config-migrate / config-presets）· 压缩 · 令牌结算
│
├── thincoder-cli/                  ← CLI 产品（npm 包 thincoder）
│   ├── bin/thincoder.mjs           命令分发入口（tui / chat / memory / upgrade / session gc / acp / completion）
│   └── src/                        壳面——tui/（终端界面 + 命令族，60+ 档）· cli/（装配与引导）·
│                                   acp/（协议桥）· crash-reports / heap-watch / upgrade / prompt-injections
│
└── thincoder-vscode/               ← VSC 产品（vsix）
    ├── extension.mjs               扩展入口
    ├── src/                        壳面——extension/ · agent/ · tools/ · advisor/ · provider/ · memory/ · prompts/
    └── webview/                    前端界面（VSC 独有面——对偶 = CLI 终端 TUI，两者不镜像）
```

### 3.1 VSC 壳层装配地图（并入 · 批 6）

> 来源 = `thincoder-vscode/docs/design/ARCHITECTURE.md` §3（指针索引——DOC-REORG-VSC 收官形态）。VSC 端实现面 = `thincoder-vscode/src/**` 全量自持（agent 主循环 / 工具 / 评审 / 记忆——未进核前的独立实现；与 CLI / 核面的差异对位见 §4.1）。

| 域 | VSC 模块 | 职责 | 详细设计 → |
|----|---------|------|-----------|
| 入口 | `thincoder-vscode/extension.mjs` | activate / 命令注册 / 状态栏 / WebviewViewProvider | —（装配入口——命令 id 视作冻结，见 `docs/core/design/CORE-UNIFICATION.md` §2.8 命令面） |
| 装配 | `thincoder-vscode/src/extension/chat-panel.mjs` | ChatPanel 类——面板生命周期 · 消息路由 · 会话管理 | `docs/vsc/design/WEBVIEW.md`（消息流 / 协议）+ `thincoder-vscode/docs/design/SESSION.md`（panel-session 会话面） |
| 装配 | `thincoder-vscode/src/extension/panel-*.mjs` | 消息路由 / 回合驱动 / 会话 / 项目 / 索引 / MCP / toolPanel 载荷分模块 | `docs/vsc/design/WEBVIEW.md` · `thincoder-vscode/docs/design/{SESSION,MCP}.md` |
| 装配 | `thincoder-vscode/src/extension/suspension.mjs` · `permission-gate.mjs` | 挂起回合驱动（digest / 排队合并 / 唤醒）· 权限弹窗门 + 批审批门 | `thincoder-vscode/docs/design/AGENT-LOOP.md`（挂起 digest）· `thincoder-vscode/docs/design/TOOLS.md`（权限审批） |
| 装配 | `thincoder-vscode/src/extension/{settings,presets,provider-flows}.mjs` | config.json 面板读写 · preset · provider 增删流 | `thincoder-vscode/docs/design/PROVIDER.md` · `docs/vsc/design/SETTINGS.md` |
| 核心 | `thincoder-vscode/src/agent.mjs` · `src/agent/**` · `src/agent-tools/**` | runAgent 主循环 + 工具分发 + 注入 + 收尾 · 元工具族（subagent / advisor / eng 等） | `thincoder-vscode/docs/design/AGENT-LOOP.md` · `ADVISOR-CONVERGENCE.md` · `ENGINEERING-MODE.md`（VSC 树档） |
| 工具 | `thincoder-vscode/src/tools/**` | 内置工具实现（file / search / git / web / lsp / execute / …） | `thincoder-vscode/docs/design/TOOLS.md` · `CHECKPOINT.md`（快照子系统） |
| LLM | `thincoder-vscode/src/provider.mjs` · `src/provider/**` | 三 transport · 重试 · 限频门 | `thincoder-vscode/docs/design/PROVIDER.md` |
| 支撑 | `thincoder-vscode/src/{memory,embedding,indexer,mcp,repomap}.mjs` | 记忆 / 向量索引 · MCP 客户端 · 仓库大纲 | `thincoder-vscode/docs/design/MEMORY.md` · `MCP.md` · `CONTEXT-COMPACTION.md` |
| Webview | `thincoder-vscode/webview/**`（chat/streaming/ui/activity/panels/send/md/…） | 前端渲染 / 交互（隔离 iframe——只经 postMessage、无共享状态） | `docs/vsc/design/WEBVIEW*.md`（三档——结构 ∥ 协议 ∥ 输入） |

测试面：`thincoder-vscode/test/`（`package.json` `"test"` = `node test/run-fast.mjs`——显式清单 `test/files.mjs` 单一来源 · `"test:full"` = 全量层——slow-gate 分层）。

## 4. 模块接口速览

| 模块 | 关键导出 | 一句话 | 详细设计 |
|---|---|---|---|
| agent 主循环 | `createAgent` / `runAgent` | 读→想→写→测；主循环分段住 `thincoder-core/agent/` | `docs/core/design/AGENT-LOOP.md` |
| provider | 供应商 transport 族 | LLM 调用层：OpenAI 兼容协议 + 原生 transport + 截断续写 | `docs/core/design/PROVIDER.md` |
| tools | `builtinTools` / `assembleBuiltinTools` | 内置工具静态表 + 实例绑定面（memory / 检索 / repomap / settings / peer） | `docs/core/design/TOOLS.md` |
| context | `estimateTokens` / `compressIfNeeded` | 双结构 history 压缩 | `docs/core/design/CONTEXT-COMPACTION.md` |
| memory | 记忆工具族 + 检索 | 三层记忆（personal / project / team）+ 代码 / 文档索引 | `docs/core/design/MEMORY.md` |
| config | `loadConfig` / `saveConfig` | 配置加载与迁移 + provider 预设 | `docs/core/design/CONFIG.md` |
| session 族 | 槽位模型（认领避让 / cwd 归一化） | 双端统一会话存储 | `docs/core/design/SESSION.md` |
| advisor | 评审入口 + 引擎 | 独立设计 / 代码评审 | `docs/core/design/CONSULTATION.md` |
| mcp | 工具动态展开 | MCP 服务器工具并入 builtinTools | `docs/core/design/MCP.md` |
| traces | 轨迹存储 | 运行轨迹落盘与清理 | `docs/core/design/TRACES.md` |
| git 面 | checkpoint / 快照 | 破坏性命令自动快照与回滚 | `docs/core/design/CHECKPOINT.md` |
| i18n | 文案与本地化 | 双端文案面 | `docs/core/design/I18N.md` |
| logging | 诊断日志 | 用户级日志落盘 | `docs/core/design/LOGGING.md` |
| workspace | 技能 / 规则 / 同伴 / 台账 | 工作区约定面 | `docs/core/design/WORKSPACE.md` |
| tui | `startTUI` | 裸 ANSI 终端界面 | `thincoder-cli/docs/design/TUI.md`（CLI 侧**未迁**） |
| acp | ACP 协议桥 | IDE 缓冲 / 工具调用桥接 | `thincoder-cli/docs/design/ACP-CLIENT.md`（CLI 侧**未迁**） |
| crash-reports | 崩溃捕获与取证 | fatal 报告 / 记录 / stderr 捕获 / 近堆快照 | `thincoder-cli/docs/design/CRASH-REPORTS.md`（CLI 侧**未迁**） |
| bin/thincoder.mjs | CLI 命令表 | 命令分发入口 | ——（`thincoder-cli/bin/thincoder.mjs:1`） |

**provider 关键决策（reasoning 语义）**：

- `reasoning_content` 必须与正文流**分开回调**（不混入正文）；
- thinking 模式协议约束按规格表 `reasoningEcho`：required / optional / 未声明保守不回传；
- 估算 token 计入 reasoning 字段。

### 4.1 VSC ↔ CLI 差异表（对比辅助 · 并入 批 6）

> 来源 = `thincoder-vscode/docs/design/ARCHITECTURE.md` §4。两端同源机制的**面差速览**（各机制逐面差异归各机制档登记——本表只留速览，D2）。

| 方面 | CLI | VS Code |
|------|-----|---------|
| 用户界面 | 裸 ANSI TUI | Webview（隔离 iframe） |
| 会话存储 | `~/.thincoder/sessions/`（共享同一目录；端 marker 各自 `.cli` / `.vscode`） | 同上（互读互写、跨产品接续无感） |
| 配置存储 | `~/.thincoder/config.json`（共享） | 同上（同一文件；apiKey 回退环境变量） |
| 工具目录约束 | 工作目录（process.cwd()） | 第一个 workspace 文件夹；两端口径均 **no directory restriction** |
| 文件打开 | TUI 内显示 | VS Code 编辑器标签页（WorkspaceEdit undo + 立即保存） |
| 权限审批 | TUI 内交互式（y/n/a） | webview 弹窗 + 批确认；autoApprove 会话级槽位字段两端语义一致 |
| 记忆系统 | 3-layer FTS5 + vector | 文件式 markdown + 可选向量（无 FTS5）——统一方向见 `docs/core/requirements/MEMORY.md` §2.1（A12/A13） |
| MCP | 支持 | 支持（stdio + HTTP——同一 config.json） |
| lsp 工具 | 自起 LSP server（config lsp.servers） | VS Code 原生语言服务（零配置零进程） |
| 子代理 / 后台 | 池挂 agent 对象（跨 run） | 池挂共享 depth-0 history 数组（agent per-run） |
| 命令队列 | TUI `/cmd` 命令队列 | 无——webview 命令走 msg.type 按钮通道 |
| 活动渲染 | TUI 面板 / 折叠动画 | 活动面板 + 冻结入流（机制语义趋同，不逐像素镜像） |
| 验证层 | 自有测试组织 | slow-gate 分层 + `test/files.mjs` 显式清单 |

**字段往返**：共享槽位文件全量覆盖写 + `...existing` 透传——CLI 写入的 `activeModel` / `engineering` / `engDesignToken` 等字段 VSC 侧往返不丢（会话面契约——`thincoder-vscode/docs/design/SESSION.md` §6）。

**VSC 专属设计取向**（承 VSC 源档 §1——与 core §2 重叠者不重述）：① **薄封装**——扩展是 agent 核心的 VS Code 适配层（负责任，不是办公设备）；② **职责分离**——extension host 负责 agent 循环与工具执行，Webview 只负责 UI 渲染与用户交互（`postMessage` 单向通信）；③ **VS Code 原生能力优先**——工具执行经 VS Code API 增强（如 `workspace.openTextDocument` 写入后自动在编辑器中打开文件）。

## 5. 跨模块机制（未被板块文档分走的）

- **自律工具注入范围表**——task / plan / goal / verify / subagent 各自主注入范围与 depth 限制（goal / verify 仅顶层；subagent / skill 防递归）。
- **子 agent 权限模型**——explore / plan 强制只读；coder 手动模式权限排队透传父审批 + 父侧串行化防审批覆盖。
- **子 agent 报告质量兜底**——报告过短打回扩写一次。

以上机制的详版住 `docs/core/design/AGENT-LOOP.md`（本档只留速览级，D2）。

## 6. 未决设计批

- （暂无）

## 7. 不并项与历史沿革

### 7.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/ARCHITECTURE.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §3 模块地图 | **迁移前**形态的模块树（`src/**` 全在 CLI 仓内：`src/agent.mjs` / `src/tools/` / `src/agent-tools/` / `src/memory/` / `src/provider/` / `src/mcp/` / `src/context.mjs` / `src/tui.mjs` / `src/acp.mjs` …） | 迁移前的仓形态已被「核 + 两壳」取代（`docs/core/design/CORE-UNIFICATION.md` §2.5 事实基线）⇒ **照现状重写**（§3），不搬旧树 |
| 旧档 §4 接口速览的「详细设计」列 | 旧节号 / 旧档址（`PROVIDER.md` / `TOOLS.md` … 根层形态） | 现行地图路径以本档 §4 为准；旧档址随板块档位移失效 |
| 旧档 §6 未决设计批的历届条目 | 各时点的未决项 | 时点状态——未决面已随对应批次收口 |
| 旧档档头状态行 + 变更记录 | 逐批流水（格式债清理批 / R25 立项等） | 批次语境——本档自有变更记录 |

### 7.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 各板块机制的正文细节 | 主循环 / 工具 / 会话 / 记忆 / 供应商等逐机制描述 | 各自权威档（`docs/core/design/<板块>.md`）——本档只留速览（D2） |
| VSC 端架构薄枢纽 | `thincoder-vscode/docs/design/ARCHITECTURE.md` | **已并入（批 6）**——§3.1 壳层装配地图 + §4.1 差异表；旧档原地一字未改、留参照历史 |
| VSC 源档 §1 设计原则（与 core §2 重叠者） · §2 整体架构图 · 文首未决 / 待办状态行 · 变更记录 | 重叠面 / 时点面 / 流水 | **不并**——VSC 专属取向已并入 §4.1；待办状态行与变更流水 = 时点材料（(d) 类） |

## 8. 体量与拆分规划（R24a）

**实测行数**：本档 **196 行**（并入批 6 后 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 2 批**）：建档——`thincoder-cli/docs/design/ARCHITECTURE.md` 内容重建入基准层（旧档一字未改、原地作参照历史）。
  ① §3 模块地图**照现状重写**（迁移前 `src/**` 单仓树 → 「核 `thincoder-core/` + 两壳 `thincoder-cli/` `thincoder-vscode/`」三目录形态；旧树登记 §7.1 不并）；
  ② §1 硬约束按现状实核收正（Node 版本双档 · 唯一运行期依赖 = 仓内核包）；
  ③ §4 接口速览的详细设计列改指现状档址（含三档 CLI 侧未迁档的显式标注）；§7 新增不并项与历史沿革。
- 2026-09-15（**B 式迁移轮 · VSC 第 6 批 · 并入 · eng-designer**）：新增 §3.1 VSC 壳层装配地图 + §4.1 VSC↔CLI 差异表——自 `thincoder-vscode/docs/design/ARCHITECTURE.md` §3 / §4 并入（坐标改写为仓根现状路径并实核；未迁 VSC 机制档以仓根路径指回）；VSC 专属设计取向并入 §4.1；VSC 源档重叠 / 时点面逐项登 §7.2 不并（§7.2 VSC 行同步收口）。
