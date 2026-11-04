# ThinCoder 架构总览（ARCHITECTURE）

> 板块 = **架构总览**（横切薄枢纽）；本档 = 合并仓的**模块地图 + 硬约束 + 设计原则 + 模块级接口速览**的唯一权威处（D2：本档只留模块级速览）。
> 逐板块机制正文各归其档（`docs/core/design/<板块>.md`）——本档**只留速览与指针，不复制**（D2 单一权威源）。
> 需求侧 = `docs/core/requirements/PHILOSOPHY.md`（三观——最高层需求）；产品级定性 = `docs/core/requirements/PROJECT.md`；VSC 专有面 = `docs/vsc/requirements/PROJECT.md`。
> 桌面端（第四端）专有面 = 需求 `docs/desktop/requirements/PROJECT.md` + 设计**五档**（`docs/desktop/design/PROJECT.md` 总览 · `docs/desktop/design/SHELL.md` 宿主适配层 · `docs/desktop/design/IPC.md` 通道契约 · `docs/desktop/design/UI.md` 界面形态 · `docs/desktop/design/RENDERER.md` 渲染工艺）。
> 三端对位 = 本档 §3.1 壳层装配地图 + §4.1 差异表 + §4.2 三端壳面对位。

## 1. 定位与硬约束

本档回答一个问题：**这个产品由哪些模块构成、它们之间怎么分工**。它是新读者进入代码面的第一站，也是「某机制住哪一档」的路由入口。

### 1.1 硬约束

| # | 约束 | 核验落点 |
|---|---|---|
| 1 | **纯 ESM `.mjs`**——无 TypeScript、无转译；仓根引导为 `.cjs`（`bin/thincoder.cjs`） | `package.json` 双端 `"type": "module"` |
| 2 | **无构建步骤**——无 bundler、无打包产物；直接跑源码 | 双端 `scripts` 无 build 项 |
| 3 | **Node 版本**：CLI 产品 `>=24` · 核包 `>=22.13.0`——**核包底线由最低宿主驱动**：VSC 扩展宿主（`engines.vscode` 面 · Node 22.13）为最低宿主 ⇒ **核内禁用 Node 24 专属 API**（核 = 三壳共用实现，须在最老宿主可跑） | `thincoder-cli/package.json:19` · `thincoder-core/package.json:29` · `thincoder-vscode/package.json:29` |
| 4 | **零第三方运行期依赖**——唯一运行期依赖 = 仓内核包 `@thincoder/core`（本地链接，非 registry 第三方） | `thincoder-cli/package.json:22` · `thincoder-cli/node_modules/@thincoder` |
| 5 | **仓内三目录分工**：核包 `thincoder-core/`（共享实现）· CLI 壳 `thincoder-cli/` · VSC 壳 `thincoder-vscode/` | 仓根目录树（§3） |
| 6 | **第四端（桌面端）适用面**：主进程纯 ESM（`.mjs`）· 预载 = 沙箱 CJS（`.cjs`——官方约束：沙箱预载不支持 ESM import）· 渲染面零 Node（原生 ESM + 手写 DOM，**无构建步骤**）· 零第三方**运行期**依赖（唯一 = 核包；Electron 与打包器 = **构建期 devDep**） | 设计 = `docs/desktop/design/PROJECT.md` §1–§2（KD-1 / KD-3 / KD-4 / KD-6）；宿主下限判据 = 启动自检（该档 §2 KD-7） |

## 2. 设计原则

1. **零依赖**：第三方 npm 依赖 = 技术债（质量 / 安全 / 版本）；Node 标准库能做的先用标准库。
2. **接口先行**：存储 / 记忆接口为团队记忆预留扩展位（v2 目标——草案档 = `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md`）。
3. **可运行验证**：每个里程碑跑通——不交付「写了没跑过」的代码。
4. **准比短重要**：长上下文常态化，信息完整优先于字数。
5. **代码是问题不是答案**：诊断修复，非朝圣模仿。
6. **面向全球**：提示词英文、界面 / 文本英文默认，不做中文限定。

## 3. 模块地图（当前态）

```text
thincoder/                          ← 合并仓根（git 仓 · 默认分支 main）
├── bin/                            ← 仓根引导
├── docs/                           ← 基准层文档（唯一权威层）
│   ├── core/{requirements,design}/ ← 统一面板块档
│   ├── cli/ · vsc/                 ← 产品面板块档
│   ├── TODO.md · TODO-archive.md   ← 项目级台账（单仓单账）
│   └── batches/                    ← 批次档
├── scripts/                        ← 仓根统一机检族（单引擎四档：doc-check.mjs 入口 + doc-check-anchors.mjs 锚 / doc-check-targets.mjs 采集 / doc-check-width.mjs 行宽；判据全读 manifest 声明面）
│                                   ← **报告态一档（不入闸）**：tool-schema-size.mjs（schema 体量读数——拟新增）
│
├── thincoder-core/                 ← 核包（@thincoder/core——共享机制实现 + 共享提示词与工具描述）
│   ├── agent.mjs                   主循环（createAgent / runAgent）——见 AGENT-LOOP
│   ├── agent/                      主循环分段（dispatch / setup / run-stages / completion / record-results /
│   │                               suspension / spawn-child / child-marks / helpers / post-turn / relay-prefix / setup-reminders）
│   ├── agent-tools/                元工具实现（task / plan / goal / verify / timer / skill / eng / settings /
│   │                               recent-changes / read-history / batch-segment / consult / escalate /
│   │                               advisor 族 / subagent 族 / async-settle）
│   ├── advisor/                    评审引擎（run / loop / messages / convergence / project-context / repos /
│   │                               compaction / truncate / citations / history）
│   ├── tools/                      内置工具实现（file / patch / bash / search / git / git-checkpoint /
│   │                               git-ext / web / ops / repomap / lsp / linter / execute / exec-run /
│   │                               question / tree / write-path / shared /
│   │                               glob-dialect / index）
│   ├── tool-docs/                  工具描述面（模型可见文本——54 档）
│   ├── prompts/                    槽位提示词唯一副本（16 档）
│   ├── memory/                     三层记忆 + 代码 / 文档索引 + 嵌入（core / docs / code-sync / code-index /
│   │                               schema / scan / file-walk / delete）
│   ├── provider/                   供应商 transport（anthropic / google / responses / sse / retry / rate /
│   │                               normalize / list-models / core / errors / index）
│   ├── mcp/ · git/ · traces/       MCP 客户端 · git 面（checkpoint / gitmem）· 轨迹存储
│   └── session*.mjs · config*.mjs · context.mjs · token-ttl.mjs · memory.mjs …
│                                   会话（store / slots / gc / guard / migrate / rename / segments / slot-write）·
│                                   配置（config / config-io / config-migrate / config-presets）· 压缩 · 令牌结算
│
├── thincoder-render-core/          ← 共享渲染核（@thincoder/render-core——DOM 构件 + 纯函数；扩展端 / 桌面端内嵌带发）
│   ├── flow/ · cards/ · subblocks/ · composer/   会话流 / 卡片族 / 子块 / 输入面板构件族（浏览器原生 ESM）
│   └── md.mjs · highlight.mjs · diff.mjs · search.mjs · i18n.mjs · lib.mjs · tool-summary.mjs · toast.mjs   渲染原语
│
├── thincoder-cli/                  ← CLI 产品（npm 包 thincoder）
│   ├── bin/thincoder.mjs           命令分发入口（tui / chat / memory / upgrade / session gc / acp / completion）
│   └── src/                        壳面——tui/（终端界面 + 命令族，60+ 档）· cli/（装配与引导）·
│                                   acp/（协议桥）· crash-reports / heap-watch / upgrade / prompt-injections
│
├── thincoder-vscode/               ← VSC 产品（vsix）
│   ├── extension.mjs               扩展入口
│   ├── src/                        壳面——extension/ · agent/ · agent-tools/ · tools/
│   └── webview/                    前端界面（VSC 独有面——对偶 = CLI 终端 TUI，两者不镜像）
│
└── thincoder-desktop/              ← 桌面端产品（Electron 宿主随产物分发——第四端）
    ├── src/main/                   主进程壳面——入口 / 窗口 / 协议供给 / IPC / 壳装配第三份 / 端侧会话副本
    ├── src/preload/                沙箱窄桥（contextBridge——渲染面零 Node）
    ├── renderer/                   前端（原生 ESM + 手写 DOM——零框架零构建）
    ├── scripts/                    产物校验（check-dist——照 VSC 侧 check-vsix 先例）
    └── test/                       单入口 + 显式清单（权威 = `docs/core/design/TESTING.md` §10）
```

### 3.1 VSC 壳层装配地图

> VSC 端实现面 = `thincoder-vscode/src/**`（端壳 / 装配面——机制本体经 `@thincoder/core` 引用；逐行现体见本表注与各模块权威档）。

| 域 | VSC 模块 | 职责 | 详细设计 → |
|----|---------|------|-----------|
| 入口 | `thincoder-vscode/extension.mjs` | activate / 命令注册 / 状态栏 / WebviewViewProvider | —（装配入口——命令 id 视作冻结，见 `docs/core/design/CORE-UNIFICATION.md` §2.8 命令面） |
| 装配 | `thincoder-vscode/src/extension/chat-panel.mjs` | ChatPanel 类——面板生命周期 · 消息路由 · 会话管理 | `docs/vsc/design/WEBVIEW.md`（消息流 / 协议）+ `thincoder-vscode/docs/_archive/design/SESSION.md`（panel-session 会话面·归档址） |
| 装配 | `thincoder-vscode/src/extension/panel-*.mjs` | 消息路由 / 回合驱动 / 会话 / 项目 / 索引 / MCP / toolPanel 载荷分模块 | `docs/vsc/design/WEBVIEW.md` · `thincoder-vscode/docs/_archive/design/{SESSION,MCP}.md`（归档址） |
| 装配 | `thincoder-vscode/src/extension/suspension.mjs` · `permission-gate.mjs` | 挂起回合驱动（digest / 排队合并 / 唤醒）· 权限弹窗门 + 批审批门 | `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md`（挂起 digest）· `thincoder-vscode/docs/_archive/design/TOOLS.md`（权限审批·均归档址） |
| 装配 | `thincoder-vscode/src/extension/{settings,presets,provider-flows}.mjs` | config.json 面板读写 · preset · provider 增删流 | `thincoder-vscode/docs/_archive/design/PROVIDER.md`（归档址） · `docs/vsc/design/SETTINGS.md` |
| 核心 | `thincoder-vscode/src/agent.mjs` · `src/agent/**` · `src/agent-tools/**` | runAgent 主循环 + 工具分发 + 注入 + 收尾 · 元工具族（subagent / advisor / eng 等） | `thincoder-vscode/docs/_archive/design/AGENT-LOOP.md` · `thincoder-vscode/docs/_archive/design/ADVISOR-CONVERGENCE.md` · `thincoder-vscode/docs/_archive/design/ENGINEERING-MODE.md`（VSC 树归档档——均归档址） |
| 工具 | `thincoder-vscode/src/tools/**` | 内置工具实现（file / search / git / web / lsp / execute / …） | `thincoder-vscode/docs/_archive/design/TOOLS.md` · `CHECKPOINT.md`（快照子系统——均归档址） |
| LLM | `thincoder-core/provider/**`（VSC 侧经 `@thincoder/core` 引用） | 三 transport · 重试 · 限频门 | `thincoder-vscode/docs/_archive/design/PROVIDER.md` |
| 支撑 | `thincoder-vscode/src/repomap.mjs`（余为核单源——现体经 `@thincoder/core` 引用） | 记忆 / 向量索引 · MCP 客户端 · 仓库大纲 | `thincoder-vscode/docs/_archive/design/MEMORY.md` · `MCP.md` · `CONTEXT-COMPACTION.md`（均归档址） |
| Webview | `thincoder-vscode/webview/**`（chat/streaming/ui/activity/panels/send/md/…） | 前端渲染 / 交互（隔离 iframe——只经 postMessage、无共享状态） | `docs/vsc/design/WEBVIEW*.md`（三档——结构 ∥ 协议 ∥ 输入） |

测试树：`thincoder-vscode/test/`（`package.json` `"test"` = `node thincoder-vscode/test/run.mjs`——**单入口（收口时跑一次）**；显式清单 `thincoder-vscode/test/files.mjs` = 单一来源，清单↔盘上两向自检；权威 = `docs/core/design/TESTING.md` §10）。

## 4. 模块接口速览

> 本表 = **模块级**速览（模块 → 关键导出 → 一句话 → 指针）；符号级细节（签名 ∥ 返回值 ∥ 副作用）按需 `grep` ∥ `code_search` ∥ `lsp` 读源码。

| 模块 | 关键导出 | 一句话 | 详细设计 |
|---|---|---|---|
| agent 主循环 | `createAgent` / `runAgent` | 读→想→写→测；主循环分段住 `thincoder-core/agent/` | `docs/core/design/AGENT-LOOP.md` |
| provider | 供应商 transport 族 | LLM 调用层：OpenAI 兼容协议 + 原生 transport + 截断续写 | `docs/core/design/PROVIDER.md` |
| tools | `builtinTools` / `assembleBuiltinTools` | 内置工具静态表 + 实例绑定面（memory / 检索 / repomap / settings / peer） | `docs/core/design/TOOLS.md` |
| context | `estimateTokens` / `compressIfNeeded` | 双结构 history 压缩 | `docs/core/design/CONTEXT-COMPACTION.md` |
| memory | 记忆工具族 + 检索 | 三层记忆（personal / project / team）+ 代码 / 文档索引 | `docs/core/design/MEMORY.md` |
| config | `loadConfig` / `writeConfigAtomic` | 配置加载与迁移 + provider 预设（写面 = `thincoder-core/config-io.mjs`） | `docs/core/design/CONFIG.md` |
| session 族 | 槽位模型（认领避让 / cwd 归一化） | 双端统一会话存储 | `docs/core/design/SESSION.md` |
| advisor | 评审入口 + 引擎 | 独立设计 / 代码评审 | `docs/core/design/CONSULTATION.md` |
| mcp | 工具动态展开 | MCP 服务器工具并入 builtinTools | `docs/core/design/MCP.md` |
| traces | 轨迹存储 | 运行轨迹落盘与清理 | `docs/core/design/TRACES.md` |
| git 面 | checkpoint / 快照 | 破坏性命令自动快照与回滚 | `docs/core/design/CHECKPOINT.md` |
| i18n | 文案与本地化 | 双端文案面 | `docs/core/design/I18N.md` |
| logging | 诊断日志 | 用户级日志落盘 | `docs/core/design/LOGGING.md` |
| workspace | 技能 / 规则 / 同伴 / 台账 | 工作区约定面 | `docs/core/design/WORKSPACE.md` |
| tui | `startTUI` | 裸 ANSI 终端界面 | `docs/cli/design/TUI.md` |
| acp | ACP 协议桥 | IDE 缓冲 / 工具调用桥接 | `docs/cli/design/ACP-CLIENT.md` |
| crash-reports | 崩溃捕获与取证 | fatal 报告 / 记录 / stderr 捕获 / 近堆快照 | `docs/cli/design/CRASH-REPORTS.md` |
| bin/thincoder.mjs | CLI 命令表 | 命令分发入口 | ——（`thincoder-cli/bin/thincoder.mjs:1`） |
| desktop 壳 | 宿主适配 + IPC 通道族 | 桌面端第四壳（Electron 宿主——主进程持核 · 渲染面零 Node；宿主面与通道面分档） | `docs/desktop/design/SHELL.md` · `docs/desktop/design/IPC.md` |
| render-core | DOM 构件族 + 纯函数族 | 扩展端 / 桌面端**共用宿主无关渲染核**（会话流呈现）；**不入发布序列**——`private: true` 永不发布、两端内嵌带发、零 registry 端消费者 | `docs/render-core/design/RENDER-CORE.md` |

**provider 关键决策（reasoning 语义）**：

- `reasoning_content` 必须与正文流**分开回调**（不混入正文）；
- thinking 模式协议约束按规格表 `reasoningEcho`：required / optional / 未声明保守不回传；
- 估算 token 计入 reasoning 字段。

### 4.1 VSC ↔ CLI 差异表（对比辅助）

> 两端同源机制的**面差速览**（各机制逐面差异归各机制档登记——本表只留速览，D2）。

| 方面 | CLI | VS Code |
|------|-----|---------|
| 用户界面 | 裸 ANSI TUI | Webview（隔离 iframe） |
| 会话存储 | `~/.thincoder/sessions/`（共享同一目录；端 marker 各自 `.cli` / `.vscode`） | 同上（互读互写、跨产品接续无感） |
| 配置存储 | `~/.thincoder/config.json`（共享） | 同上（同一文件；apiKey 回退环境变量） |
| 工具目录约束 | 工作目录（process.cwd()） | 第一个 workspace 文件夹；两端口径均 **no directory restriction** |
| 文件打开 | TUI 内显示 | VS Code 编辑器标签页（WorkspaceEdit undo + 立即保存） |
| 权限审批 | TUI 内交互式（y/n/a） | webview 弹窗 + 批确认；autoApprove 会话级槽位字段两端语义一致 |
| 记忆系统 | 3-layer FTS5 + vector | 核单源（现体 = 核 `thincoder-core/memory/**`）；统一方向见 `docs/core/requirements/MEMORY.md` §2.1（A12/A13） |
| MCP | 支持 | 支持（stdio + HTTP——同一 config.json） |
| lsp 工具 | 自起 LSP server（config lsp.servers） | VS Code 原生语言服务（零配置零进程） |
| 子代理 / 后台 | 池挂 agent 对象（跨 run） | 池挂共享 depth-0 history 数组（agent per-run） |
| 命令队列 | TUI `/cmd` 命令队列 | 无——webview 命令走 msg.type 按钮通道 |
| 活动渲染 | TUI 面板 / 折叠动画 | 活动面板 + 冻结入流（机制语义趋同，不逐像素镜像） |
| 验证层 | 自有测试组织 | 单入口 `npm test`（`node thincoder-vscode/test/run.mjs`）+ 显式清单 `thincoder-vscode/test/files.mjs` |

**字段往返**：共享槽位文件全量覆盖写 + `...existing` 透传——CLI 写入的 `activeModel` / `engineering` / `engDesignToken` 等字段 VSC 侧往返不丢（会话面契约——`thincoder-vscode/docs/_archive/design/SESSION.md` §6）。

**VSC 专属设计取向**（与 core §2 重叠者不重述）：① **薄封装**——扩展是 agent 核心的 VS Code 适配层（负责任，不是办公设备）；② **职责分离**——extension host 负责 agent 循环与工具执行，Webview 只负责 UI 渲染与用户交互（`postMessage` 单向通信）；③ **VS Code 原生能力优先**——工具执行经 VS Code API 增强（如 `workspace.openTextDocument` 写入后自动在编辑器中打开文件）。

### 4.2 三端壳面对位

> 速览级——机制细节归各端设计档（D2）：桌面端 = `docs/desktop/design/PROJECT.md`（入口；**五档导航**见其档头——`docs/desktop/design/SHELL.md` / `docs/desktop/design/IPC.md` / `docs/desktop/design/UI.md` / `docs/desktop/design/RENDERER.md`）；VSC 端 = 本档 §3.1 / §4.1 与 `docs/vsc/design/*`。

| 方面 | CLI | VS Code | 桌面端 |
|------|-----|---------|--------|
| 用户界面 | 裸 ANSI TUI | Webview（隔离 iframe） | 原生窗口 + DOM（会话标签页） |
| 宿主 | 终端（无宿主） | VS Code 扩展宿主 | Electron（随产物分发） |
| 前端形态 | TUI 自绘 | Webview 前端（iframe 内） | 渲染面原生 ESM + 手写 DOM（零框架零构建） |
| 渲染面 Node 能力 | 不适用（同进程） | 无（postMessage 桥） | 无（沙箱预载 + contextBridge 桥） |
| 会话存储 | 共享目录 + 端 marker `.cli` | 共享目录 + 端 marker `.vscode` | 共享目录 + 端 marker `.desktop` |
| 配置存储 | 共享 `config.json` | 同一文件 | 同一文件 |
| 权限审批 | TUI 交互（y/n/a） | 弹窗 + 批确认 | 流内卡片 + 活动池计数 + 标签位（同一待决项三种视图） |
| 活动渲染 | TUI 面板 | 活动面板 + 冻结入流 | 会话内右栏活动池（随会话入标签页，可折叠） |
| 壳装配 | `assembleAgent` | `buildTopLevelAgent` | 装配序核单源（`thincoder-core/agent/assemble.mjs`）+ 端壳 adapter（余端差在册） |
| 测试树 | 单入口 `npm test` | `node thincoder-vscode/test/run.mjs` + 显式清单 | 同形（单入口 + 显式清单） |
| 发行 | npm 包 | vsix（Marketplace / Open VSX） | 三平台安装包（win / mac / linux） |

## 5. 跨模块机制（未被板块文档分走的）

- **自律工具注入范围表**——task / plan / goal / verify / subagent 各自主注入范围与 depth 限制（goal / verify 仅顶层；subagent / skill 防递归）。
- **子 agent 权限模型**——explore / plan 强制只读；coder 手动模式权限排队透传父审批 + 父侧串行化防审批覆盖。
- **子 agent 报告质量兜底**——报告过短打回扩写一次。

以上机制的详版住 `docs/core/design/AGENT-LOOP.md`（本档只留速览级，D2）。

## 6. 未决设计批

- **桌面端 · 会话行「来源端」标注**：需核侧新增字段（槽创建端）方可实现——当前设计标 open（`docs/desktop/design/UI.md` §2 项 3）；待裁定：开核侧小批，或撤该标注。
- **壳装配第三份是否抽共享层**（三端装配同形）：**部分落定**——序 + 团队层取值已上提核件（`thincoder-core/agent/assemble.mjs`）；余端差在册（`docs/desktop/design/SHELL.md` §4）。

