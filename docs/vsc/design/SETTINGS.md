# 配置面板（SETTINGS）· 扩展面板 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **扩展面板 · webview 配置面板**。本档 = 该板块在基准层的**活档权威**（面板的信息架构 + 面板 ↔ config 读写契约）。
> **配置语义的单源**（本档**不重述**——D2）= `docs/core/design/CONFIG.md`（config.json 形状 / 默认值 / 迁移）· `docs/core/design/PROVIDER.md`（provider / preset / transport / 模型能力）。
> 需求侧：无同板块需求档（VSC 树设置面板无需求对位档——`SETTINGS-TOOL（VSC 侧）` 是 `settings` **工具**面，另一板块）。
> 来源 = `thincoder-vscode/docs/design/SETTINGS.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）。坐标 = as-of 2026-09-15 实核（含**源档漂移收正 2 处**，见 §7）。

## 1. 信息架构（5 卡）

面板打开时**整体重建**——**单一状态源 = config.json**（DOM / 模块变量不持独立状态；回声压制等历史补丁随 2026-08-15 重组移除）。卡片按使用频率排序：

| 卡 | 内容 | 实现入口 |
|---|---|---|
| **Providers** | provider 行（状态点 / 标签 / 掩码 key / 模型·baseURL / proxy 勾选 / Key / −）+ Add 表单（preset 下拉 + 获取模型） | `thincoder-vscode/webview/settings-providers.js` |
| **Agent** | maxTurns（默认 200）· subagentTurns（默认 100）· compactThreshold（空 = auto）· verifyGuard + Subagent models（global + explore/plan/coder/eng-coder，modelMenu 槽位） | `thincoder-vscode/webview/settings-agent.js` |
| **Consult & Advisor** | 会诊行（modelMenu + effort 档 + ✕、+ 添加）+ Advisor（guard + provider/model + effort） | `thincoder-vscode/webview/settings-agent.js` |
| **Tools & Services** | MCP servers（列表 + stdio/http/ws 表单 + 连接状态 ●/○ + Reconnect）+ Web Search key + Semantic Index（key + Build） | `thincoder-vscode/webview/settings-tools.js` |
| **Environment** | Proxy（URI / web / model 双开关 / Test）+ Shell（平台感知候选） | `thincoder-vscode/webview/settings-env.js` |

## 2. 面板 ↔ config 契约

### 2.1 Provider 管理

- 存储 = 共享 `~/.thincoder/config.json` 的 `providers[]` + `activeProvider`（两产品同源）。
- `activeProvider` 由**模型选择隐式更新**，**无手动设置入口**（2026-08-03 决策）。
- ✕ = 删 provider 条目（非删 key）；[Key] = 改 key。
- 行内 proxy 勾选 = `provider.proxy: true`；与全局 `proxy.model` 构成**双开关**（都开才走代理——`injectProxy` 语义）。
- Custom provider 支持三协议（openai / anthropic / google），`format` 字段落盘。

### 2.2 模型选择控件统一（2026-08-14 六处风格收敛）

所有「选模型」控件统一复用**主面板同款两级悬停子菜单**（provider 行 → 模型列表）——**否决原生下拉与搜索框**（千问系几十个模型下原生下拉不可用）。
会诊与 Advisor 行带**思考强度档**（effort 显式落盘，不留隐式继承；过时由用户自改）；**subagent 不带 effort**（深度由主 agent 派任务时表达）。

### 2.3 Agent 运行参数（写盘链与合并语义）

- 写入链：面板 → `saveAgentSettingsFromPanel`（**单写通道**，`thincoder-vscode/src/extension/settings.mjs:122` 自 `config-io` 转出）→ config.json `agent.*`。
- **advisor 字段级合并**（GitHub #3 修复）：payload 缺键**从磁盘回填**（对端写入的 provider / model / thinking / reasoningEffort 在面板保存后存活）；显式 `null` / `''` = 清空删除；wire 层空槽位必须发 `null` 而非 `undefined`（postMessage JSON 会丢弃 `undefined` 键——**缺失与清空必须可区分**）。`timeoutMs` 透传保留手写值。
- 面板打开即拉新：`openSettings` → `getAgentSettings`（webview → extension）→ extension 重读盘推送 `agentSettings`（extension → webview）→ 收到后渲染（250ms 超时回退快照）。对端写盘后打开面板即可见。
- `subagentModels` 优先级：工具 model 参数 > `subagentModels[role]` > `subagentModel` > 父 provider。
- Shell 为 config.json **顶层字段**（不在 `agent` 下），走独立消息通道；平台感知候选（System default / pwsh / Git Bash / WSL）。

### 2.4 MCP 存储

共享 `config.json` 的 `mcp.servers[]`（两产品同格式）；旧 VS Code settings 已一次性迁移。重名拒绝、args 空格分隔、env `KEY=value`。

### 2.5 语义索引（校验可见面）

embedding key + 构建按钮 + 状态；向量维度 / 模型切换的校验与可见面归 `MEMORY（VSC 侧）` §4（索引有效性面）——
状态行在不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」（`settings.indexMismatch`），提示面同源扩展。

### 2.6 配置路径字段 `~` 展开（端差面）

- **机制单源** = `docs/core/design/MEMORY.md` §6.7（家目录展开——单一规范化点 / 只读归一）。本档**不重述机制**，只登记 VSC 端的事实与端差。
- **VSC 端事实**：本端仅 `shell` 字段同病（无 `memory.dbPath` / `projectDir` / `team.dir` 对位）。
  - 归一落点 = **读取点展开**：`thincoder-vscode/src/agent/setup.mjs:237`（`cfgShell = … expandHome(raw.shell) : null`）。
  - 消费端 `thincoder-vscode/src/tools/shell.mjs:229`（`exec`）**零改**；展开器 = `thincoder-vscode/src/expand-home.mjs:16`（`expandHome`）。
- **只读归一**：磁盘原文保留（不写回）；面板与 `settings` 工具写面不展开（运行时当次展开缺口 = 已知限制，见 §3）。

### 2.7 外部写感知（config.json 事件驱动刷新）

`~/.thincoder/config.json` 为两产品共享单文件；外部写（对端 `/advisor` · `settings set` · 手工编辑）在面板常开时须**可见**。

**契约**：`startConfigWatch({ onChange, debounceMs = 300, configPath }) → { dispose, noteSelfWrite }`
（`thincoder-vscode/src/extension/config-watch.mjs:35`——纯装配模块，不含业务）：

- 注册 `createFileSystemWatcher(new RelativePattern(Uri.file(dirname(configPath)), basename(configPath)))`，监听 change / create / delete 三类事件；`configPath` 缺省 = `config-io` 的 `_configPath()` 当前值。
- 事件 → 去抖（`debounceMs`）→ **stat 元组（mtimeMs + size）与基线比对**：同 → 零推送；异 → `onChange()`（比对后基线更新为当前元组）；启动时基线 = 启动时 stat。
- **自写抑制（基线回填）**：`noteSelfWrite()` = 重取当前元组置为基线（`config-watch.mjs:49`）；时机 = 本进程写盘成功后——`saveRaw`（`thincoder-vscode/src/config-io.mjs:96`——写盘唯一通道）在写成功路径上经 `onConfigSelfWrite(fn)`（`config-io` 导出，`:52`）同步回调，`startConfigWatch` 内部订阅（退订随 `dispose`）。
  ⇒ 扩展自写 = 事件到达时元组已等于基线 ⇒ **零推送**（不抖动面板）；外部写 = 元组异于基线 ⇒ `onChange()`。
- `dispose()` 释放 watcher 与挂起定时器（含自写订阅退订）。
- **降级**：宿主 API 缺失或构造抛错 → 返回 no-op `{ dispose(){}, noteSelfWrite(){} }`（不阻断激活——面板打开拉新的既有路径兜底）。

**装配**：`extension.mjs` 的 activate 内把 `startConfigWatch({ onChange: … })` 推入 `context.subscriptions`，复用既有轻量推送面 `_pushSettingsLight`（`thincoder-vscode/src/extension/chat-panel.mjs:319`——无网络探测、不重建面板请求路径）；自写通知订阅在模块内部建立（**装配面零增行**）。

## 3. 已知待办与已知限制

- **运行时当次展开缺口**（§2.6）：磁盘原文保留 `~` 的配置在面板 / `settings` 工具写面不展开——登记在案（与对端同姿态）。
- 设计 round2 专用提示词、架构档 NFR 补全等开放项 = 仓根台账 `docs/TODO.md`（项目级唯一台账）。
- **进程内缓存不随外部写同步**（§2.7 边界）：embedder `_tried` 缓存 / 会话槽不因外部写盘重载——登记（非本板块范围）。

## 4. 不并项与历史沿革

### 4.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/SETTINGS.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注「归档来源」段 + 6 份 `_archive/` 归档档指针 | 面板 6 份历史批次文档的合并史（2026-08-25 收口） | 时点材料——归档档归 `thincoder-vscode/docs/design/_archive/`（历史快照） |
| 头注状态行（「现行权威源」） | 时点状态行 | 批次语境——现行态已入 §1–§2 |
| 旧档 §4「变更记录」（2026-09-11 两条） | 逐批流水 | 历史叙述——本档自有变更记录 |

### 4.2 不并项登记（一次性批次材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 §2.6「问题陈述」段 | 外部写零感知的现场描述 | 一次性批次材料——机制已入 §2.7 契约 |
| 旧档 §2.6「方案选型」表（4 候选） | 宿主事件 / 轮询 / 焦点刷新 / 手动刷新 的取舍过程 | 一次性批次材料——**结论已在 §2.7 契约**（事件驱动 + 去抖 + 元组抑制）；否决理由归旧档 |
| 旧档 §2.6「受影响文件」「用例表」「验收标准」「边界」 | 施工面清单（新模块 / 测试档 / AC-S1–S2 / T-S1–T-S6） | 一次性批次材料——**测试资产归测试层**（`thincoder-vscode/test/`）；本档只留契约 |
| 旧档 §2.7「问题复核实录」「方案选型」表（3 候选） | `~` 展开的三候选取舍 | 一次性批次材料——机制单源在 `docs/core/design/MEMORY.md` §6.7；本档只留端差事实（§2.6） |
| 旧档 §2.7「用例表」「AC」「计数」「边界」 | 施工面清单（T-MA2-1–5 / AC-MA2-1–2） | 一次性批次材料——测试资产归测试层 |
| 旧档 §2.7 逐字契约第 1–4 条 | 展开器逐条契约 | **已单源化**——`docs/core/design/MEMORY.md` §6.7 承载（D2 不重述） |

## 5. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-S1 | 面板**整体重建**（单一状态源 = config.json），不做增量 diff 渲染 | 已定（§1——2026-08-15 重组定稿） |
| U-S2 | 卡片**按使用频率排序**（Providers → Agent → Consult & Advisor → Tools & Services → Environment），不按功能域分组 | 已定（§1） |
| U-S3 | 选模型控件 = **两级悬停子菜单**（否决原生下拉 / 搜索框） | 已定（§2.2） |
| U-S4 | 会诊 / Advisor 行**显式 effort 档**；subagent 不带 effort | 已定（§2.2） |
| U-S5 | 语义索引状态行在模型不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」 | 已定（§2.5） |
| U-S6 | 外部写感知**静默刷新**（用户编辑中不重建面板——自写抑制，§2.7） | 已定 |
| U-S7 | 面板宽度 / 响应式断点 / 主题变量 | **open**（源档未落档——不静默补） |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **128 行**（新建 · 终稿实核）——**低于 300 行软线，无需拆分**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/design/SETTINGS.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；
  批次材料（问题陈述 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 / 计数）与归档史入 §4 不并项；
  `~` 展开机制改为**指向单源** `docs/core/design/MEMORY.md` §6.7（D2）；
  坐标改写为仓根相对现状路径（**源档漂移 2 处收正**：`setup.mjs` `:232`→`:237`、`shell.mjs` `:233`→`:229`）。
