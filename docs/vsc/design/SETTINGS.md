# 配置面板（SETTINGS）· 扩展面板 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **扩展面板 · webview 配置面板**。本档 = 该板块在基准层的**活档权威**（面板的信息架构 + 面板 ↔ config 读写契约）。
> **配置语义的单源**（本档**不重述**——D2）= `docs/core/design/CONFIG.md`（config.json 形状 / 默认值 / 迁移）· `docs/core/design/PROVIDER.md`（provider / preset / transport / 模型能力）。
> 需求侧：无同板块需求档（VSC 树设置面板无需求对位档——`SETTINGS-TOOL（VSC 侧）` 是 `settings` **工具**面，另一板块）。
## 1. 信息架构（6 卡）

面板打开时**整体重建**——**单一状态源 = config.json**（DOM / 模块变量不持独立状态）。卡片按使用频率排序：

| 卡 | 内容 | 实现入口 |
|---|---|---|
| **Providers** | provider 行（状态点 / 标签 / 掩码 key / 模型·baseURL / proxy 勾选 / Key / ✕）+ Add 弹窗（弹框形态；字段序 = 名称→baseURL→格式→API Key→走 proxy→拉取——渠道不携模型；§2.16）；**默认模型行已撤场**（设置面零模型选择控件——模型选择归会话面，§2.2） | `thincoder-vscode/webview/settings-providers.js` · `thincoder-vscode/webview/settings-provider-dialog.js` |
| **Agent** | maxTurns（默认 200）· subagentTurns（默认 100）· compactThreshold（空 = auto）· verifyGuard · autoThink + Subagent models（global + explore/plan/coder/eng-coder，modelMenu 槽位） | `thincoder-vscode/webview/settings-agent.js` |
| **Consult & Advisor** | 会诊行（modelMenu + effort 档 + ✕）+ **添加弹窗**（`#consult-add-dialog`——provider ∥ model 两字段 + 提交；§2.17 ②）+ Advisor（guard + provider/model + effort） | `thincoder-vscode/webview/settings-agent.js` · `thincoder-vscode/webview/settings-consult-dialog.js` |
| **Tools & Services** | MCP servers（列表 + **添加/编辑弹窗**（stdio/http/ws 表单；env ∥ headers = 行式键值——§2.4；§2.17 ①）+ 连接状态 ●/○ + Reconnect）+ Web Search key + Semantic Index（key + Build） | `thincoder-vscode/webview/settings-tools.js`（卡壳 ∥ 键行族 ∥ 索引）+ `thincoder-vscode/webview/settings-mcp.js`（MCP 列表面——§2.10 拆档产出）+ `thincoder-vscode/webview/settings-mcp-dialog.js`（MCP 弹窗体——§2.17 ①） |
| **Environment** | Proxy（URI / web / Test）+ Shell（平台感知候选） | `thincoder-vscode/webview/settings-env.js` |
| **团队** | 管理面：端标签 + 详情（server ∥ member ∥ label）+ 未登录提示句 = 「未登录——登录后可用」（三端逐字同句——`docs/core/design/TEAM.md` §2.5）；零登/退控件（登/退 = 首启板团队卡 ∥ 状态栏 item + 命令 `thincoder.team`——§2.20 条 6）；**「轮换」控件**（已登录在场——确认一步 + 结果行；机制单源 = `docs/core/design/TEAM.md` §2.7） | `thincoder-vscode/webview/settings-team.js`（已落） |

## 2. 面板 ↔ config 契约

### 2.1 Provider 管理

- 存储 = 共享 `~/.thincoder/config.json` 的 `providers[]` + `activeProvider`（两产品同源）。
- `activeProvider` 由**模型选择隐式更新**，**无手动设置入口**。
- ✕ = 删 provider 条目（非删 key）；[Key] = 改 key。
- 行内 proxy 勾选 = `provider.proxy: true`（**逐渠独立**——勾选且代理 `uri` 在案即走代理；无全局闸——`docs/core/design/PROXY.md` §4）。
- Custom provider 支持三协议（openai / anthropic / google），`format` 字段落盘。

### 2.2 模型选择控件统一

所有「选模型」控件统一复用**主面板同款两级悬停子菜单**（provider 行 → 模型列表）——**否决原生下拉与搜索框**（千问系几十个模型下原生下拉不可用）。
**入口面（当前）**：**会话面**——输入面板模型钮（两级悬停菜单——核件单源）+ provider 态横幅动作钮（开径 = 模型钮同径）；**设置面零模型选择控件**（默认模型行撤场——用户定音「模型选择归会话界面」）；会话选定 ⇒ `defaultModel` 同拍写回（判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 6；本端落点 = `docs/vsc/design/WEBVIEW.md` §4.10）。
**本端两件处置的决策单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-80** ⑤**（banner 钮重指 ∥ 设置面 Providers 卡「默认模型」行撤场 + 载荷 `defaultModel` 支净删）；由 = 撤设置面模型面后原指向成死端，用户定音即「模型选择归会话界面」——跨端读者不必外跳。
会诊与 Advisor 行带**思考强度档**（effort 显式落盘，不留隐式继承；过时由用户自改）；**subagent 不带 effort**（深度由主 agent 派任务时表达）。

### 2.3 Agent 运行参数（写盘链与合并语义）

- 写入链：面板 → `saveAgentSettingsFromPanel`（**单写通道**，`thincoder-vscode/src/extension/settings.mjs:162` 转出；现体 = 核 `thincoder-core/config-io.mjs`）→ config.json `agent.*`。
  **载荷面 = `agent.*` 键域**（旧 `defaultModel` 支退场——设置面零模型选择控件 ⇒ 消费面归零；`defaultModel` 写入面 = 会话选定写回 ∥ 迁移；决策单源 = `docs/desktop/design/SETTINGS.md` §1 **KD-80** ①）。
- **advisor 字段级合并**：payload 缺键**从磁盘回填**（对端写入的 provider / model / thinking / reasoningEffort 在面板保存后存活）；显式 `null` / `''` = 清空删除；wire 层空槽位必须发 `null` 而非 `undefined`（postMessage JSON 会丢弃 `undefined` 键——**缺失与清空必须可区分**）。`timeoutMs` 透传保留手写值。
- 面板打开即拉新：`openSettings` → `getAgentSettings`（webview → extension）→ extension 重读盘推送 `agentSettings`（extension → webview）→ 收到后渲染（250ms 超时回退快照）。对端写盘后打开面板即可见。
- `subagentModels` 优先级：工具 model 参数 > `subagentModels[role]` > `subagentModel` > 父 provider。
- **autoThink 档位开关**（Auto 组对齐桌面 ∕ CLI `/think` 同键）：键 = `agent.autoThink`（默认 false）。**读链**：`loadAgentSettings()`（`thincoder-vscode/src/extension/settings.mjs:42`）→ 快照 `agentSettings()` 携键（`:137`）→
  agent 卡两态渲染；**写链**：`saveAgentSettingsFromPanel`（`thincoder-vscode/src/extension/settings-panel-write.mjs:80`）显式布尔写（false 亦写——同 verifyGuard 式）；
  **控件**：`#ag-autothink` switch（`thincoder-vscode/webview/settings-agent.js:26-27`——verifyGuard 后位）+ 载荷 `autoThink: chk("ag-autothink")`（`:123`）。词面 = `settings.agent.autoThink`（两语 = 桌面同值）。
- **注入开关三键**（docs/core/design/PROMPT-SYSTEM.md §6.24 §6.27）：键 = `agent.injectProjectRules` ∥ `agent.injectDocs` ∥ `agent.injectMemories`（默认 true——判据 `!== false`；全局粒度）。
  **职责切分**（用户裁定）——项目指令（① `AGENTS.md` / `project_rules.md`）∣ 相关文档（② 自动检索）∣ 相关记忆（③）三块各受各键，**三键互不影响**（§6.27）。
  **读链**：`loadAgentSettings()`（`thincoder-vscode/src/extension/settings.mjs:45-46`）→ 快照 `agentSettings()` 携键（`:165-166`）→
  agent 卡两态渲染（`!== false` 判勾）；**写链**：`saveAgentSettingsFromPanel`（`thincoder-vscode/src/extension/settings-panel-write.mjs:84-85`）显式布尔写（false 亦写——同 autoThink 式）；
  **控件**：`#ag-injectprojectrules` ∥ `#ag-injectdocs` ∥ `#ag-injectmemories` switch（`thincoder-vscode/webview/settings-agent.js:29-30`——autoThink 后位）+ 载荷三键（`:128-129`）+ `EDIT_FIELDS` 登记（`:153`）。
  词面 = `settings.injectProjectRules` ∥ `settings.injectDocs` ∥ `settings.injectMemories` + 悬浮说明 `…Help`（两语 = 桌面同值）。
  **agent 装配三处穿透**（timer-wake 先例——缺一 ⇒ config.json 对该键关不掉）：`thincoder-vscode/src/agent/setup.mjs` 默认种 `:132` ∥ raw 读 `:162` ∥ `agentFields` `:182`。生效时点 = **下一条消息**（`hydrateRun` 每轮重读——UI 腿非会话内即热，同 `docs/core/design/PROMPT-SYSTEM.md` §6.24 偏离句）。
- Shell 为 config.json **顶层字段**（不在 `agent` 下），走独立消息通道；平台感知候选（System default / pwsh / Git Bash / WSL）。写面契约（控件接线 / 空值语义）= §2.9。

### 2.4 MCP 存储

共享 `config.json` 的 `mcp.servers[]`（两产品同格式）；重名拒绝、args 空格分隔。

**env ∥ headers 输入 = 行式键值（两端同形，本端为准）**：表单三组（stdio `env` ∥ http `headers` ∥ ws `headers`）各为**行集**——每行 = 键格 + 值格 + ✕，行集下 `[+ 添加行]`；**零项 ⇒ 零行**（零假造——存量回显 ∥ 新增态起手同判：起手三组皆零行，行由 `[+ 添加行]` 落——加行 = 尾附一空行）。
提交判据：键 ∥ 值 trim 后**空键行 ∥ 空值行不提交**（空值 = 旧串式 `k=` 删项语义的自然延续）∥ 重复键**后行胜** ∥ 全空 ⇒ 该字段删除（config 键缺席——沿 `src/config-mcp.mjs:28 ∥ :54-56` 判）。
回显 = 存储对象 `Object.entries` 序；**值 = 字面**（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——即修「值含逗号即坏」）；**行式下引号 = 正文字符，非语法记号**。
粘贴 = **零解析**（不引「按换行分行」等隐式解析）；值格 = 单行 `input`（**值内换行不可录入**——边界明示）。落盘形零改（`env` ∥ `headers` 仍为对象；载荷仍 `{name, config}`）；桌面逐元素同形（`docs/desktop/design/SETTINGS.md` §2.18 ∥ §1 KD-77）。

**面形**：表单 = **弹窗形态**（`#mcp-dialog`——五路关 ∥ 开框重置 ∥ 拒因可见；机制 = §2.17 ①）。本节只承存储 ∥ 字段集 ∥ 提交判据（三面零改）；形面 ∥ 关路 ∥ 入出口归 §2.17。

**装配面第二源**：MCP **装配面**（`thincoder-vscode/src/extension/panel-turn-loop.mjs` ro 载荷——实施落点）另并项目根 `.mcp.json`——单层发现（`join(cwd, ".mcp.json")`）· 零交互信任 · config 同名优先 ∕ 异名追加（机制单源 = `doc:docs/core/design/MCP.md:§6.4`）；**管理面**（本节列表 ∕ 增删改 ∕ 重连 ∕ 探活）仍 config 单源（`.mcp.json` 源不进管理列表——沿 CLI `/mcp` 口径）。

**MCP 警告消费**：装配失败（死 server）不再静默——装配面出参 `warnings` 入 `agent._mcpWarnings`，装配尾转提醒入 `agent._pendingReminders`
（下一条 user 消息注入；首两段逐字同 CLI；末行 = 本端可达出口「设置面 MCP 段 Reconnect」；同指纹不重推；零警告零写）。机制单源 = `doc:docs/core/design/MCP.md:§6.4`；
实现落点 = `thincoder-vscode/src/agent/setup.mjs` ∥ `thincoder-vscode/src/agent/tool-table.mjs` ∥ `thincoder-vscode/src/agent/setup-reminders.mjs`。
可见面 = 会话内系统提醒（零新 UI ∥ 零新词键——沿 KD-70 ④ 同判）。

### 2.5 语义索引（校验可见面）

embedding key + 构建按钮 + 状态；向量维度 / 模型切换的校验与可见面归 `MEMORY（VSC 侧）` §4（索引有效性面）——
状态行在不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」（`settings.indexMismatch`），提示面同源扩展。

**P1 读数扩面**：`pushIndexStatus` 载荷扩两键——`dbBytes`（库文件字节数）∥ `origins`（逐 origin code ∥ doc 行数）。
  取值 = 核只读出口 `memoryStatus()` 回执透传（单源——不另造 SQL；`thincoder-vscode/src/extension/panel-index.mjs:47-61` → 载荷 `{built, files, chunks, dbBytes, origins, hasEmbedder}`）；
  `#index-status` 区增两读（库大小 + 逐 origin 行数；**词键 ∥ 形 = 实施定形**——词键 = `settings.indexDbSize`（整行模板：`Database size: ${size}` ∕ `库大小：${size}`）∥ `settings.indexOriginCounts`（计数片段：`code ${code} · doc ${doc}` ∕ `代码 ${code} · 文档 ${doc}`——两语两面同值）；形 = `#index-db-size` ∥ `#index-origins` 两读——缺位 ⇒ 隐藏（零假造））；
  刷新拍 = 既有推送时点（打开 ∥ 构建后 `pushIndexStatus`——零新通道）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-69**。

### 2.6 配置路径字段 `~` 展开（端差面）

- **机制单源** = `docs/core/design/MEMORY.md` §6.7（家目录展开——单一规范化点 / 只读归一）。本档**不重述机制**，只登记 VSC 端的事实与端差。
- **VSC 端事实**：本端仅 `shell` 字段同病（无 `memory.dbPath` / `projectDir` / `team.dir` 对位）。
  - 归一落点 = **读取点展开**：`thincoder-vscode/src/agent/setup.mjs:130`（`cfgShell = … expandHome(raw.shell) : null`）。
  - 消费端 `thincoder-vscode/src/tools/shell.mjs:229`（`exec`）**零改**；展开器 = 核 `thincoder-core/expand-home.mjs:11`（`expandHome`）。
- **只读归一**：磁盘原文保留（不写回）；面板与 `settings` 工具写面不展开（运行时当次展开缺口 = 已知限制，见 §3）。

### 2.7 外部写感知（config.json 事件驱动刷新）

`~/.thincoder/config.json` 为两产品共享单文件；外部写（对端 `/advisor` · `settings set` · 手工编辑）在面板常开时须**可见**。

**契约**：`startConfigWatch({ onChange, debounceMs = 300, configPath }) → { dispose, noteSelfWrite }`
（端壳 = `thincoder-vscode/src/extension/config-watch.mjs`（平台落子：`createFileSystemWatcher` 订阅 + `dispose` 桥）；**纯逻辑已上提核** = `thincoder-core/config-watch.mjs`（去抖 ∕ stat 元组比对 ∕ 自写抑制）：

- 注册 `createFileSystemWatcher(new RelativePattern(Uri.file(dirname(configPath)), basename(configPath)))`，监听 change / create / delete 三类事件；`configPath` 缺省 = `config-io` 的 `_configPath()` 当前值（现体 = 核 `thincoder-core/config-io.mjs`）。
- 事件 → 去抖（`debounceMs`）→ **stat 元组（mtimeMs + size）与基线比对**：同 → 零推送；异 → `onChange()`（比对后基线更新为当前元组）；启动时基线 = 启动时 stat。
- **自写抑制（基线回填）**：`noteSelfWrite()` = 重取当前元组置为基线（核 `thincoder-core/config-watch.mjs`；VSC 壳同名转口）；
  时机 = 本进程写盘成功后——`saveRaw`（核 `thincoder-core/config-io.mjs`——写盘唯一通道）在写成功路径上经 `onConfigSelfWrite(fn)`（核同档 `:107`）同步回调，`startConfigWatch` 内部订阅（退订随 `dispose`）。
  ⇒ 扩展自写 = 事件到达时元组已等于基线 ⇒ **零推送**（不抖动面板）；外部写 = 元组异于基线 ⇒ `onChange()`。
- `dispose()` 释放 watcher 与挂起定时器（含自写订阅退订）。
- **降级**：宿主 API 缺失或构造抛错 → 返回 no-op `{ dispose(){}, noteSelfWrite(){} }`（不阻断激活——面板打开拉新的既有路径兜底）。

**装配**：`extension.mjs` 的 activate 内把 `startConfigWatch({ onChange: … })`（定义 = 核 `thincoder-core/config-watch.mjs`；VSC 壳 `thincoder-vscode/src/extension/config-watch.mjs` 同名转口）
推入 `context.subscriptions`，复用既有轻量推送面 `_pushSettingsLight`（`thincoder-vscode/src/extension/chat-panel.mjs:331`——无网络探测、不重建面板请求路径）；自写通知订阅在模块内部建立（**装配面零增行**）。

### 2.8 设置面快照到达与写值纪律（F-W8 · F-W9 · F-W10）

**打开拍必达（F-W8）**——设置面板打开不依赖任何后台巧合：`openSettings` 发既有 `getAgentSettings` 拉取，宿主在该 case 内按**固定序**回一批快照，**末位 = `agentSettings`**：

```text
webview：openSettings → postMessage { type:"getAgentSettings" }（既有拉取）
host   ：回批 = indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings（末位）
webview：agentSettings 到达 ⇒ 打开等待器触发 buildSettings ⇒ 建面时 SS 三快照（代理 / 检索 / 索引）已在位
```

- **零新增消息类型**：回批全复用既有 type（三条 = `proxySettings` · `websearchSettings` · `indexStatus`）；推送方 = 既有单一 sink `_pushSettingsLight`（四快照）+ `_pushIndexStatus`（`thincoder-vscode/src/extension/chat-panel.mjs:331-342` / `:370`）。
- **末位序 = 契约**：`agentSettings` 是打开等待器的唯一触发拍（`thincoder-vscode/webview/settings.js:142-161`）——它居末位才能保证 build 时快照齐；任一中间推送丢失只退化为「该控件回填迟到一拍」（由本节回填规则兜住，不出现空渲染假值）。
- **推送 / 拉取判据（本设计取推送）**：拉取需新消息 type（禁令）；推送复用既有拉取握手 ⇒ 零新增形态 + 序保证免费 + 复用已声明的单一 sink。

**控件级回填（F-W9）**——快照到达即刷**活控件**，**不重建整卡**（半填输入不丢）：

| 消费函数 | 回填面 | 回填规则 |
|---|---|---|
| `updateProxySettings` | `#px-uri` / `#px-web` | 按快照覆写屏值；**跳过聚焦中的控件** |
| `updateShellCandidates` | `#sh-select` 选项表与选中项 / `#sh-custom` 值 | 按快照覆写（**回显式 = §2.9「回显全表达式」**）；**跳过聚焦中的控件** |
| `updateWebsearchSettings` | `#row-websearch` 行（状态词 + 按钮组） | 整行重绘（行内零输入控件 ⇒ 零丢失面） |
| `updateIndexStatus` | `#index-status` 文本 + 构建钮态 + `#row-embed` 键行 | 纯函数重绘（同上） |

- 「跳过聚焦中的控件」= 回填与用户输入**互不覆盖**的最小规则：用户正在改的控件不被推送拍平。
- 回填函数须在**极简 DOM 桩**下可跑（既有冒烟档以桩驱动全量消费函数——零新增 DOM 假设）。

**写值纪律（F-W10——防静默清除）**——代理 / Shell 控件 = change-to-save，但**发值判据两条**（缺一不发）：

1. **基线判据**：屏值 ≠ 基线值才发值；**基线 = 该控件最后一次被写入控件的值**（= 其屏值来源：建面渲染写入 / 回填写入 / 用户编辑写入），**不是** SS 快照字段的实时派生。
   - **建面**：渲染值写入 ⇒ 基线 = 渲染值（快照在场 = 快照字段；缺席 = 渲染默认——与渲染器同一表达式）。
   - **回填**：写入即更新基线；**跳过聚焦中的控件（规则见上表）⇒ 零写入 ⇒ 基线冻结于该控件现屏值**——不随 SS 前移。
   - **未被编辑的 change（blur / Enter 未改值）⇒ 屏值 = 基线 ⇒ 零发值**；含「推送被跳过（聚焦中）+ 随后未改值」一格——**旧屏值零回写**。
   - **发值后**：基线 ← 本次屏值（同值 change 连发 ⇒ 恰 1 次 post——幂等门）。
   - 「快照未达」因此不再构成数据丢失路径。
2. **逐字段载荷判据**：payload **只含本次被编辑字段**——绝不携其余控件的渲染值 / 默认值。
   宿主既有部分载荷语义（`uri` 缺席 ⇒ 保留磁盘 uri；`web` 缺席 ⇒ 保留磁盘值）由此成为安全网：未被触碰的字段**永不被写**（含默认值物化）。

**「空 / null ⇒ 删除」路径册（F-W10 ③——逐条 + 判据）**：

| # | 删除路径 | 触发（显式用户动作） | 判据 |
|---|---|---|---|
| 1 | 代理整块（宿主删 `proxy` 键） | `#px-uri` 清空 + change（屏值 `""` ≠ 基线） | 未编辑 ⇒ 零发值；显式清空 ⇒ payload 恰含 `uri:""` ⇒ 宿主删键 |
| 2 | Shell 键（宿主删 `shell` 键） | `#sh-select` 选 `System default`（值 `""`） | payload 恰含 `value:""` ⇒ 宿主删键（CLI `/shell reset` 同义） |
| 3 | `#sh-custom` 清空 | **无**（空自定义路径 = 未完成输入，不发值） | change 且值为空 ⇒ 零发值 + 控件按快照**就地回显**（回显式 = §2.9「回显全表达式」） |
| 4 | agent 卡 `null` 清空 · poolLimits 逐键 · 元素缺席形态 | —— | 登记不修——消解路径 + 到期条件 = `docs/vsc/requirements/WEBVIEW.md` 在册（P2-3 / P2-4） |

- **extension 侧删除语义零改**（空 uri ⇒ 删键 · 空 shell 值 ⇒ 删键——`thincoder-vscode/src/extension/settings.mjs:231` 与 `thincoder-vscode/src/extension/settings-panel-write.mjs:180`）——只把「触发」收紧到显式用户动作。

- **路径册 #1 子路径（边界——登记不修）**：磁盘**无** `proxy.uri` 时勾 `#px-web` ⇒ change 发 `{web:true}`（无 `uri` 键），
  而宿主 `!uri` 即 `delete raw.proxy; return`（`thincoder-vscode/src/extension/settings.mjs:231`）⇒ **零落盘**；
  发射路径仍 `flashSaved(...)`（`thincoder-vscode/webview/settings-env.js:115`）⇒ 可见态（「已保存」）与磁盘不一致——`!uri` 早退是显式删键语义的副作用，不是静默清除。消解路径 + 到期条件见 §3 残留登记。

对账面 = 发面表（`WEBVIEW-PROTOCOL.md` §13）。

### 2.9 Shell 写面（F-W11——接线圈）

`#sh-select` / `#sh-custom`（渲染 = `thincoder-vscode/webview/settings-env.js:27-31`）与宿主既有消息通道
（`saveShellSettings` → `saveShellSettingsFromPanel`；`thincoder-vscode/src/extension/panel-messages.mjs:460-464`）接线：

| 控件事件 | 屏值 | 动作 |
|---|---|---|
| `#sh-select` change | 候选值 | 发 `saveShellSettings { value }` ⇒ 写 `config.shell` |
| `#sh-select` change | `System default`（`""`） | 发 `saveShellSettings { value:"" }` ⇒ 删 `config.shell`（系统默认——候选表首项，宿主已供给） |
| `#sh-select` change | `__custom__`（哨兵） | 零发值（切换输入意图，非写意图） |
| `#sh-custom` change | 非空 | 发 `saveShellSettings { value }` |
| `#sh-custom` change | 空 | 零发值（§2.8 路径册 #3）——就地回显 = 下表「回显全表达式」 |

- 候选表（System default + 平台检测项）与拉取面（`getShellCandidates`）零改；回填 = `updateShellCandidates`（规则见 §2.8），写后轻量推送到达即回显新值（写盘与回显同一轮闭环）。

- **回显全表达式**（`#sh-select` / `#sh-custom` 的回填与就地回显 = **同一式**，与渲染器同源——`thincoder-vscode/webview/settings-env.js:25-31`）：
  `current` **匹配候选**（按值相等——含 `System default` 候选的 `value:null` 对 `current:null`）⇒ `#sh-select` 回到该候选（选中）+ `#sh-custom` 清空；
  **无匹配** ⇒ `#sh-select` 置 `__custom__` + `#sh-custom` = `current`。
  适用面 = 建面渲染 · 推送回填（§2.8 回填表——跳过聚焦中的控件）· §2.8 路径册 #3 的就地回显。

### 2.10 不可复得类删除二次确认（F-W17——P5 判据判对）

**类判据（本节的单源判据句）**——删除入口按「**删除是否使不可复得的原文随之消失**」二分类：

- **不可复得类**（删除使**凭证原文**随条目一并消失——密钥 / 令牌 / headers 等；界面不显原文或只显掩码，用户无法自行重填复原，只能回服务商重取 / 重发）⇒ **必过一次显式确认** = `window._confirmSecretDelete(btn, action)`；
- **可重填类**（删除仅使**可由用户重填的配置**消失——条目可重加、字段值可再输入）⇒ `window._confirmDelete(btn, action)` 直通（`thincoder-vscode/webview/settings.js:50`）——**本类现为空域**（入口册零实例；直通门零调用点——「后态」见下）；
- **入口册全数判入不可复得类**：provider 行 − **随用户裁定 A 判入本门**——删整条时其 `apiKey` 原文随条目一并消失（写入 = `thincoder-core/config-io.mjs:201-208` · 删条目的整条 filter = `:262-277`）。
  该行**不满足「可重填」前提**：重填 URL / 名**不恢复** key 原文，只能回服务商重取（用户逐字「**A，也入。**」）。

**后态（唯一门）**：入口册 1–6 **全数**判入不可复得类（有载体 5 行全数走 `_confirmSecretDelete`；入口 3 无 UI 载体——`_delKey` 死码**已清** ⇒ 无门调用点）；门调用点 **5 处**（入口册 5 行 1:1）——`webview/settings-tools.js:47`（入口 1）· `:29`（入口 2）·
`webview/settings-providers.js:51`（入口 4）· `webview/settings-mcp.js:58`（入口 5）· `webview/input.js:128`（入口 6——**经 hook 链路**：核 footer `onClick` ⇒ `hooks.confirmRemoveProvider` ⇒ 本桥调门）。
`window._confirmDelete`（`thincoder-vscode/webview/settings.js:50`——**保留门**）**零调用点**（结构对账 W17-17 钉住）⇒ 全数删除入口**唯一通道 = 确认门**。
`_confirmDelete` 的**定义仍在**（`:44`——保留门）；`test/smoke-settings.mjs:95` 的 handler 在位断言照绿。
新增删除入口一律按上二分类判：后域内不存在直通调用点 ⇒ 误入直通即结构对账点名（fail-closed）。

**不并入「撤销机制」**——撤销属加机器，不取（用户裁定）。
**MCP 行（用户逐字「mcp 删除那个还是要确认一下好」）**：入口册 #5（MCP server 行 ✕）判入**不可复得类**——理由 = **删整条时其 token / headers 一并消失、原文不可复得**（同 `thincoder-vscode/src/config-mcp.mjs:52-54` 语义）。归类按**入口整体**（不按 transport 分叉：stdio 条目虽无 token，但行内不显凭证在场与否 ⇒ 分叉须新可见面 + 两分支两判据）。
**provider 行（用户逐字「A，也入。」）**：入口册 #4（provider 行 −）判入同一类——理由 = 删整条时其 `apiKey` 原文随条目消失（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter；判据句见上）。
**需求侧对位（同源映射——供三链对账）**：需求档 F-W17 判据句（「**所有删除入口**（密钥 / 令牌 / MCP 行 / provider 行）均须过一次显式确认——「单击即删」类已空域」）≙ 设计档「不可复得类」= 入口册 1–6 **全数**。
入口 6（模型菜单 footer）的**需求档册行 = 待父侧补**（父侧笔）。
「可重填 / 单击即删」类 = **空域**（本档侧 = 直通门零调用点——见上「后态」）。
两门并存（而非单门加 flag）：缺省值必须选一侧，单门 + `secret` 布尔 ⇒ 漏标即直通（fail-open）；两门则**类判据写在调用点**（名字即类），漏标由结构对账用例 fail-closed 点名（用例 = W17-17）。
**后态**：可重填类空域 ⇒ 直通门零调用点；结构对账判据 = 「域内删除入口发射 **4 名**全落确认门实参内 ∧ `_confirmDelete(` 调用点 = 0」（入口 3 无载体 ⇒ `deleteProviderKey` 零发射——`_delKey` 死码**已清**）——空域被机检**钉住**（未来新增可重填类入口而误用直通即红，不靠约定）。

**入口册（D3——计数与清单同改）**：

| # | 入口 | 载体 | 类 | 删除消息 |
|---|---|---|---|---|
| 1 | Web Search key ✕ | `webview/settings-tools.js:103`（`websearchRowHtml()` 的 ✕ 生成位）→ handler `:46-48` | 不可复得类 | `deleteWebsearchKey` |
| 2 | 嵌入 key ✕（Semantic Index） | `webview/settings-tools.js:116`（`embedRowHtml()` 的 ✕ 生成位）→ handler `:28-30` | 不可复得类 | `deleteEmbedKey` |
| 3 | provider key | **无 UI 载体**（`_delKey` 死码已清；UI 不暴露「只删 key 留条目」入口、协议保留不删） | 不可复得类 | `deleteProviderKey` |
| 4 | provider 行 −（删整条） | `webview/settings-providers.js:137`（卡 HTML——`data-name` 承载 + 卡级装配位 `bindAddProviderForm()` 绑 `addEventListener`）+ 编辑行取消重建位 `:22-23`（**零改**） | 不可复得类 | `removeProvider` |
| 5 | MCP server 行 ✕ | `webview/settings-mcp.js:173` 生成 / `:177-184` 绑定 | 不可复得类 | `deleteMcpServer` |
| 6 | 模型菜单 footer「− Remove provider…」 | `thincoder-render-core/composer/model-menu.mjs:304`（footer 三入口 = 同档 `:302-307`；渲染位 = 同档 `:106-116`） | 不可复得类 | `removeProvider`（**无 `name`**——目标由宿主 QuickPick 选定） |

- **行 5**：绑定位 = **门名** + **载荷闭包**（生成位 `settings-mcp.js:173` 零改）；判据 = W17-16 / W17-19。
- **行 4 入本门**：理由 = 删整条时 `apiKey` 原文随条目消失（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter）⇒ 不可复得（用户裁定 A）。
  零回归锚 = `_confirmDelete` 调用点**收敛为 0**（入口册 1–6 行全数过门）；判据 = W17-14 / W17-15 / W17-26…W17-30。
- **行 4 的载体（两处）**：见下「provider 行载体」段——`_removeProvider` 的**门名**（动作体 / 消息名 / 载荷不变）。
- **行 6**：`removeProvider` 的**第二载体**（行 4 = settings 面板 provider 行 −）；判据 = 同一「不可复得」判据句——删整条时其 `apiKey` 原文随条目一并消失（写入 = `thincoder-core/config-io.mjs:201-208` · 整条 filter = `:262-277`，与行 4 同源）。
  门位 = **webview 侧调用点**（同档 `:25` 动作闭包过 `_confirmSecretDelete`）——选型理由见下「模型菜单入口」段；判据 = W17-31…W17-34。
  **宿主侧链**：路由 = `src/extension/panel-messages.mjs:280`（`case "removeProvider"`）；
  处理器 = `src/extension/panel-messages-settings.mjs:82-90`（`msg.name` 有 ⇒ 直落 `persistRemoveProvider`；**无 ⇒ `:88` `removeProviderFlow`**）；
  QuickPick 面 = 核 `thincoder-core/provider-flows.mjs` `removeProviderFlow`（VSC `provider-flows.mjs` 薄壳转口；候选 = 非 active 过滤 · 空集早退 · `showQuickPick`〔`ui.pick`〕· 取消早退 `if (!sel) return` · 删 `removeProviderEntry(sel.label)`）。
  渲染位与门位的先后（**本门前提**）：footer 行的 click 处理器（`thincoder-render-core/composer/model-menu.mjs:114`）=「先 `closeModelMenu()`、后调 `f.onClick()`」⇒ 弹框开在菜单 overlay 移除**之后**（弹框 `.auto-confirm` z-index 1000 / 遮罩 999——与 `mm-overlay` 1000 同层，无菜单在场即无遮挡）。
- **MCP token / headers 无独立删除钮**：其唯一删除路径 = 编辑表单清空 token / headers 后保存（**表单语义，非删除按钮**——`thincoder-vscode/src/config-mcp.mjs:52-54` 的 `if (cfg.token)` / `if (cfg.headers)`：条目重建时字段随之消失）；
  webview 侧 = `webview/settings-mcp.js:114-133` 读表单（stdio / http / ws 三分支）→ `:134` 发 `editMcp` / `saveMcpServer`。
  处置 = **已裁**（裁定 ③：表单清空保存**不算「删除按钮」判据域** ⇒ 维持登记）；**不动表单语义**。

**确认形态 = 面板内轻量确认弹框**：

**弹框契约（本面单源 = `webview/settings-widgets.js`——`showConfirmPopover({ text, yesLabel, noLabel, onConfirm })` + 同档导出的**清除入口**）**：

- **件 = 既有形态**：`.auto-confirm`（`role="alertdialog"`）+ `.auto-backdrop`（`thincoder-render-core/composer/composer.css:407-483`）——**零新增 CSS**；`z-index` 1000 > 设置面板 `20`（`thincoder-vscode/webview/settings.css:7`）⇒ 恒在面板之上。
- **挂位 = `document.body`**（不在键行内）⇒ 键行重绘**不打断**确认在位态。
- **载荷闭包**：确认动作 = **开框时捕获**的 payload 闭包（不是确认时读 DOM）⇒ 弹框在位期间的行重绘**不改删除目标**、不吞确认。
  **判别面明示**：**W17-23 判「在位不打断 / 不改目标」，不判闭包形态**——`renderMcpList` 走 `list.innerHTML = …` 整表重建（`thincoder-vscode/webview/settings-mcp.js:159-176`），旧钮节点脱离 DOM 后 `dataset.name` 仍为原名 ⇒ 「确认时读 DOM」与「开框时捕获」在该场景**载荷同值**；闭包形态由代码面复核守（D-M4），不以该例为判据。
- **单例**：开框前清既有 `.auto-confirm` / `.auto-backdrop`（**经同档导出的同一清除入口**——全局同名单例，与既有两处同规）⇒ 跨入口连开只剩一个框，框内动作只对应**最后一次**开框的入口。
- **安全默认**：开框后焦点落「取消」（`setTimeout(..., 50)`——同既有两处）。
- **连点护栏**：「删除」钮的 click 处理对 `e.detail > 1`（双击第二击）零动作——防「第二击恰好落在删除钮」的误确认。
- **文案**：正文键 = `settings.secretDeleteConfirm`（双语在册——`locales/en.json:201` / `locales/zh.json:201`）；钮文案复用既有键（跨面复用已有先例——会话删除确认用 `question.cancel`）：确认 = `session.delete`、取消 = `question.cancel`。
  **文案为类通用式（父侧裁定）**——三类入口（密钥 / 嵌入 key / MCP 整条）陈述均成立（**值级改写 · 键数不变 · 键名不动**）。值：
  - zh（`locales/zh.json:201`）：`确定删除？删除后无法恢复——凭证原文不可复得，只能重新配置或回服务商重取。`
  - en（`locales/en.json:201`）：`Delete? This cannot be undone — the original credential cannot be recovered; you would have to reconfigure it or get a new one from the provider.`
  **净增文案键 = 0 · 键数不变**（键名与其余键零改）；判据 = AC-FW17B-6（值级改写 · 键数不变——非「`git diff locales` 空」）。

**取消路径（四条 · 均零发值 ∧ 行内状态复原）**：

| # | 取消动作 | 判据 | 入口级覆盖（用例） |
|---|---|---|---|
| 1 | 点「取消」钮 | 零删除消息；弹框 + 遮罩移除；**不触碰键行 DOM**（行内状态复原 = 从未改变——`outerHTML` 逐字同） | MCP 入口 = W17-20（含行内 `outerHTML` 逐字复原）；provider 入口 = W17-27（含行 `outerHTML` 逐字复原）；密钥类 = W17-5；模型菜单入口 = W17-33（含端到端反证：取消 ⇒ 宿主零调用 ∧ `config.json` 逐字节不变） |
| 2 | 点遮罩（`.auto-backdrop`） | 同上 | **件内共享路径**——处理器在弹框件（`webview/settings-widgets.js:80`），入口侧零专属代码 ⇒ 覆盖 = W17-6（密钥类批 · 同一件）；MCP 入口不另设例 |
| 3 | 弹框内 Escape | 同上；**弹框内 keydown 拦截 `stopPropagation`** ⇒ 不连带执行 `webview/chat.js:90-102` 的「关设置面板」分支（面板保持打开） | 同上——件内共享路径（`webview/settings-widgets.js:97-101`）⇒ 覆盖 = W17-7；MCP 入口不另设例 |
| 4 | 关面板（`#settings-close` / 外部 `closeSettings()`） | 同上——`closeSettings()`（`webview/settings.js:169-181`——清除调用位 `:173`）**经同档导出的同一清除入口**清弹框与遮罩（零发值） | MCP 入口 = W17-21；provider 入口 = W17-28；密钥类 = W17-8；模型菜单入口**不适用**（设置面板不参与本路径——见下「逐入口完备性」） |

- **行 4 的弹框 DOM 触点收敛为 1**（**收敛域 = 设置面档** `webview/settings*.js`：开框前单例清理 · 框内三条取消 · 关面板同此入口；域外 `webview/chat.js:103-104` 的既有 Escape 清除面 = 零改面，不在本收敛域）。

**逐入口完备性（明示）**：入口**专属**的取消形态 = #1（行内状态复原）与 #4（`closeSettings()` 同清）⇒ 各入口各持专属例（MCP 入口 = W17-20 / W17-21；provider 入口 = W17-27 / W17-28）；
#2 / #3 的处理器在**弹框件内**（遮罩 click `webview/settings-widgets.js:80` · 框内 keydown `:97-101`），入口侧零专属代码 ⇒ 由密钥类批在**同一件**上的 W17-6 / W17-7 等价覆盖（同一件 = 同一判据；两条路径上无入口差量）。**不按「逐入口 × 四条路径全列出例」读。**
**入口 6（模型菜单 footer）的专属形态 = 无 #1 的「行内复原」型态**：菜单在开框**之前**已由 `thincoder-render-core/composer/model-menu.mjs:114` 关闭（`closeModelMenu()`）⇒ 无行内状态可复原；设置面板不参与本路径 ⇒ 路径 #4 不适用。
其专属例 = W17-33（取消 ⇒ 零发值 ∧ 宿主零调用 ∧ 框 / 幕移除 ∧ `.mm-overlay` 零在场——菜单不复活）；#2 / #3 同件等价覆盖（W17-6 / W17-7）。
另：目标选定步（宿主 QuickPick）的取消 = **独立一步**（非本弹框的取消路径）——其零删除判据 = W17-34（恒绿锚）。

**协议零增 / 宿主零改**：确认是 **webview 侧门**（确认动作内才 `postMessage`）⇒ 消息名与载荷零增（`WEBVIEW-PROTOCOL.md` §13 判别式集与 ④ 处置列不变），宿主删除语义（`thincoder-vscode/src/extension/settings.mjs` · `thincoder-vscode/src/extension/settings-panel-write.mjs`）**零改**。

**载体绑定（密钥行两个控件）**：两处密钥行的钮经 `renderKeyRow(id, html, { skipWhileEditing })`（`webview/settings-tools.js:138-148`——渲染 + 绑定的**单点**；第三参 = 守卫开关，两处 `onCancel` 重建时显式置 `false`）装配——
**绑定范围 = 该行的两个控件**：编辑钮（`[Change]`；空态为同位的 `[Add]`——同一 `.key-btn` 位）与删除钮 `✕`（`.del-key`）——两者**一并**落在该单点。
重绘三处（`renderKeyRow` 守卫路径 + 两处 `keyRowEdit` 的 `onCancel` 重建位——同经该单点——`webview/settings-tools.js:22` / `:40`）收敛到该单点。
理由：① 同族 MCP 行（`renderMcpList` 的 `settings-mcp.js:177-184`）已用 `addEventListener` ⇒ 绑定形态归一；
② 行内属性绑定在测试夹具（happy-dom）下**不可驱动**（实测：`typeof el.onclick === "object"` ∧ `.click()` 零触发）
⇒「点击 ✕ ⇒ 不出删除」这一判据句的**动作面**无法机判，`[Change]` 侧同理（W17-18——同一夹具障碍、同一绑定动作覆盖）。
**provider 行卡载体同改**（`settings-providers.js:137`——同一障碍、同一处置；见下「provider 行载体」段）· **编辑行取消重建位**（`:22-23`）本就不属行内属性形态（零改）。

**MCP 行载体（两处）**——生成位 `webview/settings-mcp.js:173`（`.mcp-del-btn` 的钮字面）**逐字零改**；
绑定位 `:177-184`（`renderMcpList` 内「每钮 `addEventListener`」）= **门名** `window._confirmSecretDelete`
+ **载荷闭包 = 开框时捕获**（`const name = btn.dataset.name` 于 click 时取值；闭包只发 `{type:"deleteMcpServer", name}`）——
对齐本节「载荷闭包」条（确认期间的行重绘不改删除目标、不吞确认）。
绑定形态（`addEventListener`）**零改**：MCP 行本不在 `renderKeyRow` 单点装配域内，**不并入**（并入 = 越本目的的结构改动）。

**provider 行载体（两处）**：
① **卡 HTML 载体** `webview/settings-providers.js:137`——− 钮 = `data-name="${escHtml(name)}"`（类名 `key-btn del-key` / 激活行的 `disabled` / `title` / 钮字面 `−` 零改），
   绑定移至**卡级装配位** `bindAddProviderForm()`（两条建面路径的共同单点——`thincoder-vscode/webview/settings.js:190`（整面建）· `webview/settings-providers.js:177`（卡就地重建））：`const name = btn.dataset.name` → `window._removeProvider(name, btn)`（载荷 = **开框时捕获**）。
② **编辑行取消重建位** `webview/settings-providers.js:22-23`（`_editKey` 的 `onCancel` 重建的 − 钮）：**零改**——本已是 `addEventListener`，其目标 `name` 于 click 时取自闭包（载荷天然开框时捕获）。
两处汇入 `_removeProvider`（`:50-52`）——该件**门名** = `window._confirmSecretDelete`（动作闭包与消息名不变）；其调用点 = 2（两载体；全树无其它引用）。
**载体形态理由**：① 行内属性绑定在测试夹具（happy-dom）下**不可驱动**（设计轮实测：对 − 钮 `.click()` ⇒ 零事件；`typeof el.onclick === "object"`）⇒「点击 − ⇒ 不即发 / 确认 ⇒ 发」这一判据句的动作面**无法机判**；② 同族形态归一（密钥行 / MCP 行皆 `addEventListener`）。

**模型菜单入口（入口 6 · 门位 = webview 侧调用点）**：

**载体（单点）**：`thincoder-render-core/composer/model-menu.mjs:304` 的 footer 项 `onClick` = **hook 注入式**——
`onClick: () => hooks.confirmRemoveProvider?.(() => post("removeProvider"))`（消息名与载荷**逐字不变**：`{ type: "removeProvider" }`，**无 `name`**）；
门调用落点 = VSC 桥 `webview/input.js:128`（`composerHooks.confirmRemoveProvider` 绑定——`window._confirmSecretDelete(null, onConfirm)`），OUT 桥 = `webview/input.js:36`（出站表 `removeProvider` 逐字面）。
**门位选型（三案取舍——枚举 a / b / c，本档取 c 案）**：

- **取 c 案理由 = 与入口 1–5 同门同件**：`_confirmSecretDelete`（`webview/settings.js:56-63`）是本节类判据句的唯一映射件 ⇒ 入口 6 与 1–5 **同一门 / 同一弹框件 / 同四条取消路径**——「确认件单源」原则**强化**（不新增确认形态）。
- **c 案的机检侧优势**：门在 **post 之前** ⇒ 「取消 ⇒ 零发值」**严格读成立**（宿主零调用、盘面逐字节不变）；且入口 6 落在 webview 档 ⇒ 结构对账**扩域即钉住**（见下「判据域边界」）。

**已裁代价（登记 = §3）**：确认发生在**目标选定之前**（弹框文案 = 类通用式 `settings.secretDeleteConfirm`，不携 `name`）⇒ 确认的「目标绑定」弱于入口 1–5（后者目标 = 载体自身所在行）。
补偿两条：① 目标选定步（宿主 QuickPick——核 `thincoder-core/provider-flows.mjs`）**自身是一次显式选择**（选定才删）⇒ 不可复得动作实需「确认 + 选定」两步；② 选定后取消仍零删除（核 `thincoder-core/provider-flows.mjs` `if (!sel) return` **零改**）。

**`btn` 实参 = `null`**：`_confirmSecretDelete(btn, action)` 的 `btn` 实现内**未使用**（`webview/settings.js:55` 注：弹框居中、不锚定）；footer 项的 `onClick` 由 `thincoder-render-core/composer/model-menu.mjs:114` 调用时**不传参** ⇒ 无元素可给。
改 `model-menu.js` 传 `e.currentTarget` = 共享件回调契约改动（4 处调用方）而收益为零 ⇒ 取 `null`。
**单点依赖（明示）**：门由 `initSettings()`（`webview/settings.js:29`——经 `webview/chat.js:49` 模块顶调用）安装；本入口与门同处一个 webview 文档（chat 面板）⇒ 点击前门必已安装。
**不取防御式回退**（`window._confirmSecretDelete?.()`）——门缺失须响亮失败；静默降级 = 违「取消 ⇒ 零删除」旨。
门侧：`_confirmSecretDelete(null, …)` 四条取消路径全零发值 · 确认 ⇒ 恰 1 条 `{type:"removeProvider"}` ∧ 框 / 幕移除 · 单例（连开两框仍 1 框）。

跨面夹具 = happy-dom 真 webview 点击 → 逐条喂回真宿主分发 + 临时 config（`_setConfigPathForTest`——**绝不触碰真实 `~/.thincoder/`**）。

**判据域边界（结构对账 W17-17 的扫描域）**：域 = **设置面档**（`thincoder-vscode/webview/settings*.js`——**10 档**（含新档 `settings-provider-dialog.js` ∥ `settings-mcp.js`）+ **两新档**（`settings-mcp-dialog.js` ∥ `settings-consult-dialog.js`）= **12 档**）
∪ **`thincoder-vscode/webview/input.js`**（入口 6 桥——门调用 ∥ OUT 桥双落位）= **13 档**（扫描式 = 正则 `/^settings.*\.js$/` ∪ 显式名单 `input.js`；域外档一律不入集）。
**计数映射（D3 · 6 行 ↔ 5 名）**：入口册 **6 行** ⇒ 判别名 **5 个**（入口 4 = settings 面板 provider 行 − 与入口 6 = 模型菜单 footer **同名 `removeProvider`**）——`removeProvider` 域内发射 **2 处**（`webview/settings-providers.js:51` · 桥 `webview/input.js:36`——OUT 表逐字面；入口 6 闭包创造位 = 核 `model-menu.mjs:304`——域外面）。
域内删除入口发射 **4 名**（`deleteEmbedKey` · `deleteWebsearchKey` · `deleteMcpServer` · `removeProvider`）⇒ **4 名全数过 `_confirmSecretDelete`**（`settings*.js` 发射逐处落在门实参内；入口 6 经 hook 桥 `input.js:128` 过门——多载体同名同判）；
`deleteProviderKey` = 协议在册、零发射点（`_delKey` 死码已清）；`_confirmDelete(` 调用点 = **0**（fail-closed：新增直发项 / 未登记入口 ⇒ 红 + 点名）。
域外：`webview/**` 其余删除入口——`deleteSession`（`webview/session-bar.js:131`——非不可复得类、已有自有确认面 `webview/session-bar.js:102-134`、零改）**不属本判据域**。

**范围限制（三层 · 明示）**：本门的识别面 = ① **命名**（扫描名族 = `delete*` ∪ `remove*` 两个删除语族；`clear*` / `reset*` 等族外名不在识别面 ⇒ 该类入口由动作面用例 / 评审兜底）；
② **书写**（只认 `type:` 后的**字面量**串——常量 / 变量 / 拼接书写的发射不被识别）；③ **枚举**（域档 = `readdirSync` 平铺 `settings*.js` ∪ 显式名单 `input.js`，非递归 ⇒ 移入子目录即静默缩域——由档数下限断言兜一道；域 **13 档** ⇒ 下限 **≥6**，实现轮按实读定值）。三层之外的新形态入口本门不认（既不静默漏计数，也不越形态）。
**实施后回填面**：本章入口 5 载体 ∥ 门调用点清单（`webview/settings-mcp.js` 拆档后行号）∥ 域档数——按实施后实读回填。

### 2.11 Shell 候选拉取异步化（F-W18——推送链有界）

**病根**：`shellCandidates()`（`thincoder-vscode/src/extension/settings.mjs:57-88`）逐个同步探测候选（`:86` `candidates.filter((c) => c.detect())`——探测走同步 `exec`）
+ 进程内 memo（`:53` `_shellCandidatesCache`——现值见本段设计条）⇒ **阻塞宿主事件循环**；面板打开拍 / 请求拍（`panel-messages-settings.mjs:186-187` `handleGetShellCandidates`）落在同一循环上
⇒ 同拍其余快照推送被卡（与 TUI 假死同源：同步 exec 在热路径）。

**设计（F-W18）**：

- 探测 = **async**：`execFile`（非阻塞）+ `Promise.all` 并发候选探测；**在飞去重**（同一时刻的重复请求共享同一 in-flight promise——不叠发探测批）；**进程内 memo 保留**（成功结果缓存，语义与 `:58` 同：进程生命周期内稳定——shell 路径不热变化）。
- **被拒备选**：① 静态「已知路径表」（平台 / 自定义安装漏项——探测语义降级）；② 跨重载持久缓存（陈旧路径 + 首装未探面）。
- **推送序契约零改**：打开拍固定序（`indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings` 末位）在变更后必须原序保持——
  两个推送函数（`_pushSettingsLight` · `_pushIndexStatus`，`thincoder-vscode/src/extension/chat-panel.mjs:331` / `:370`（定义）· `:353`（调用））走 await 链；

**F-W18 静默判据的取值方式（三路——「无可观测 ≥ 2 s 静默」如何机判）**：

- **① 静态扫描**：shell 候选探测路径零 `spawnSync` / `execSync`（域 = `settings.mjs` `shellCandidates` 及其调用链）；
- **② 注入式时序断言**（机检形态）：注入带人为延迟的伪探测（同步阻塞面模拟）⇒ 断言打开拍推送链按序到齐且**相邻两拍间隔 < 2 s**；
- **③ 实机读数**（非单元测试）：扩展宿主日志相邻行时间差扫描——打开拍区间零 ≥ 2 s 静默。

### 2.12 渠道准入探针：失败分类与有界重试（F-W19）

**载荷（端侧装配）**：VSC 调用点 = `thincoder-vscode/src/extension/provider-probe-window.mjs:71` / `:76`（`recordAdmission` 落账）· `thincoder-vscode/src/extension/settings.mjs:78`（`admissionOf`）→ `:85` / `:89`（渠道项载荷装配）；
字段与分类语义（`failure ∈ {timeout, malformed, hostBusy}` + `ts`）、失败文案零改纪律（`channelUnavailableMessage` 逐字不动）= `docs/core/design/PROVIDER.md` §6.16（**不重述**——本档只承载端侧装配 + 采样器 / 重试 / 展示面）。

**`hostBusy` 判据**：采样器窗口内 lag ≥ 1 s（宿主事件循环繁忙——非渠道故障，分类可辨）；**同一采样器兼 loop-idle 重试闸**（宿主忙时不重试——不在忙循环上加压）。

**重试纪律**：配置阶段窗口内**单批延迟重试 ≤ 2 次** + 在飞去重（同批不叠发探针）；到期不再重试（面板重开 = 新窗口）。**运行期零探测零改**（§6.16 M8/M9 同源语义）。

**重试常量（具名落点 = `thincoder-vscode/src/extension/provider-probe-window.mjs:17` / `:20`）**：`PROBE_RETRY_MAX = 2`（「单批延迟重试 ≤ 2 次」的上界常量；**让位上限 = 同值**——宿主忙 ⇒ 让位不探，让位计数与探次同界，不无限让位）·
`PROBE_RETRY_DELAY_MS = 2000`（重试延迟——取值口径 = 2 × 采样器 `WINDOW_MS`：上一拍忙态证据先滚出窗口，重试拍不撞同一忙窗）。

**被拒备选**：获焦重探——无 focus 消息面（`webview/**` 无获焦上报）；引入 = 新 UI 事件依赖（且探针不得由前台动作隐式触发）。重试驱动力收敛于采样器闸。

**采样器落点**：`thincoder-vscode/src/extension/loop-sampler.mjs`——扩展宿主事件循环采样器（核 / CLI 无此面）：
`SAMPLE_INTERVAL_MS = 100`（采样拍）· `WINDOW_MS = 1000`（判定窗口）· `BUSY_LAG_MS = 1000`（窗口内最大 lag ≥ 1 s ⇒ 忙）；
`hostBusy()` = 纯内存窗口判定（零 exec / 零 I/O——采样器自身不得成为阻塞源）；`startSampler()` / `stopSampler()` 幂等（扩展 activate / deactivate 挂点）；
注入缝 `_setLoopSamplerForTest({ nowFn })`（时钟注入——免真实等待，TTL 面同形态）。
**窗口起止** = 滚动窗口「最近 `WINDOW_MS` 内」：起 = `now − WINDOW_MS`，止 = `now`（窗口外采样不参与判定）。

**重试窗口起止**：起 = 面板打开拍（准入探针批次发起）；止 = ① 批次成功 ② 单批重试 ≤ 2 次用尽 ③ 面板关闭 / 重开（重开 = 新窗口）。
窗口内 `hostBusy()` 真 ⇒ 不重试（不在忙循环上加压——同 `:268` 闸）。

**重探成功的清除语义（三条）**：

- **① 落账清除**：`recordAdmission(name, { ok: true, ts })` 覆盖——记录不再携带 `failure`；
- **② 准入翻转**：载荷 `available: false → true`（同批 `fullStatus` 载荷内生效，`models` 候选恢复可用）；
- **③ 展示回绿**：webview 行内状态词清除、模型候选可选（判据见下）。

**展示面分档（F-W19 验收③「失败原因可区分 · 展示面可分辨」）**：状态词级分档——**零版式变更**、`channelUnavailableMessage` 逐字零改：

- `不可用`（渠道故障）：`failure ∈ {timeout, malformed}` ⇒ 状态词 `不可用`（`webview/settings-providers.js:189` 现状形态不变）+ `.prov-hint` 逐字渲 `unavailableReason`（`:192` 现状不变）；
- `宿主繁忙`（非渠道故障）：`failure === "hostBusy"` ⇒ 状态词 `宿主繁忙`（硬编码同址、与 `:189` 同形）+ **抑制渠道故障 hint**——载体为宿主忙，不得渲渠道故障文案。

载荷：`providerStatus` 渠道项除 `available` / `unavailableReason` 外增 `failure`（端侧装配 = `thincoder-vscode/src/extension/settings.mjs:78` `admissionOf` → `:85` / `:89` 载荷路径）；**字段语义 / 分类判据 = `docs/core/design/PROVIDER.md` §6.16**（本档只承载端侧装配与展示面，不重述）。
**双向机检判据**：词 ⇒ 落账（渲 `宿主繁忙` ⇔ 载荷 `failure === "hostBusy"`；渲 `不可用` ⇔ 载荷 `failure ∈ {timeout, malformed}`）· 落账 ⇒ 词（反方向逐条）——两向均断言。
**被拒备选（验收③ 收窄裁定）**：不采纳「可辨 = 落账字段层」的收窄——与 `docs/vsc/requirements/WEBVIEW.md` F-W19 验收③ 的**展示面**字面不符；状态词分档不改版式、零渠道文案改动 ⇒ 成本为零。

**机检**：窗口起止 / lag 判定 / 注入缝 / 零 exec。核侧锚（探测束 / 同步有界例外 / 零 execSync 扫描）= `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1 判据条（不在本档重复）。

### 2.13 Advisor effort 键接线

**开题事实（实读）**：面板写 `agent.advisor.effort`（`thincoder-vscode/src/extension/settings-panel-write.mjs:133-136`），而核侧只读 `advisor.reasoningEffort`（`thincoder-core/advisor/run.mjs:48/:64`）⇒ 该键**写而无人读**（死键）+ 面板自身的读面（快照 `advisor` 对象）也只服务于同一死键的展示。

**裁定 = 接线（非确认死键）**：核侧消费方已在（CLI `/advisor` 菜单写 `cfg.reasoningEffort`，核读同键）⇒ 键位不对，不是能力缺失。

| 面 | 契约 |
|---|---|
| 写入键 | `agent.advisor.reasoningEffort`（单源 = 核读取键；与 CLI 菜单同键） |
| 档位值（枚举档） | 写字面档值（如 `low`/`high`/`max`） |
| 关思考（枚举 `none`） | **off 形按族取形**（规则单源 = `doc:docs/core/design/MODEL-SPECS.md:§15.4-2`）：effort 族（`thinkApi === "effort"`）⇒ `advisor.thinking = null`；自定义开值族 ⇒ `null`；其余 ⇒ `{type:"disabled"}`。载荷面：`none` **原样上送**（写面归一，不写字面进盘）+ **删** `reasoningEffort` 键 |
| 「—」（未注册占位） | 删 `reasoningEffort` 键；**不动** `advisor.thinking`（off 形 `null` 的跨保存存活 = 写面种子循环 carve-out——`doc:docs/core/design/MODEL-SPECS.md:§15.4-5`） |
| 旧 `effort` 键 | 读面兜底：`reasoningEffort` 缺席时按 `effort` 日值显示（且 `thinking` off 形 ⇒ 预选 `none`；优先级 = `doc:docs/core/design/MODEL-SPECS.md:§15.4-4`）；保存时删旧键（不回写的死键不得复活） |
| select 未渲染（枚举空） | 载荷**不发** `reasoningEffort` 字段（缺席 ≠ 清空）——手写键存活 |
| 读面（预选取值） | `advisorEffortCurrent`（`settings-state.js`）：`thinking` off 形 ⇒ `none` > `advisor.reasoningEffort` > legacy `advisor.effort` > 「—」（规则单源 = `doc:docs/core/design/MODEL-SPECS.md:§15.4-4`）；**off 哨兵 × 档枚举无 `none` 的族 ⇒ 预选「—」（不落注册默认档——`doc:docs/core/design/MODEL-SPECS.md:§16.5`）**； |
| | 快照面（`thincoder-vscode/src/extension/settings.mjs:145`）为 spread 透传（新旧两键与 `thinking` 均随行）——端侧零改 |

**归一规则（两 select 同源）**：`doc:docs/core/design/MODEL-SPECS.md:§15.4` 的 `effortSelection`（已存值∈枚举 > 注册默认∈枚举 > 中性档）；面板渲染面 = `effortSelectView`（「—」恒首项）。

**与需求档登记的关系（报告结论）**：`docs/vsc/requirements/WEBVIEW.md` P2-4「元素缺席 ≡ 显式清空」的 **advisor-effort 半由本节消解**（select 未渲染 ⇒ 不发字段）；P2-4 余项（advisor `provider` / `model` 与其他面板字段的缺席语义）= 需求档条目，不动。

### 2.14 Advisor guard 写面收口：槽唯一权威 + 两键通用保存通路关闭

**开题事实（实读）**：面板 guard 复选框走 `setAdvisorGuard` 消息（`thincoder-vscode/src/extension/panel-messages-settings.mjs` `handleSetAdvisorGuard:161-167`）——
该 handler = 「slot authority」单写（`:163-166`；无 config 镜像）；engineering 键同口径 ⇒ **同一面板内两键同判**。
另：通用保存写面（`thincoder-vscode/src/extension/settings-panel-write.mjs`）两条通路已关闭（白名单 `engineering` 项 ∥ guard 赋值行）。

**写面契约**：

| 键 | 唯一写面 | 通用保存面（`settings-panel-write.mjs`） | 翻转路径 |
|---|---|---|---|
| `agent.advisor.guard` | 会话槽（`setSlotAdvisorGuard`） | 无 guard 赋值行——只经种子循环（`:135-139`）**verbatim 存活**（在场原值回写 / 缺席保持缺席 / 零强制转换） | `setAdvisorGuard` 消息 ⇒ 槽写 + `_pushSettingsLight()`，零 config 写 |
| `agent.engineering` | 会话槽（`setSlotEngineering`） | 白名单无 `engineering` 项——通用保存不可达 | `setEngineeringEnabled` 消息 ⇒ 槽写 + `_pushSettingsLight()`（本行只作同口径对照，零改） |

**面板复选框接线（webview）**：`thincoder-vscode/webview/settings-agent.js` 的通用保存载荷删 `guard` 字段；
`#adv-guard` 改挂 change 监听直接 post 既有消息 `{ type: "setAdvisorGuard", value: checked }`——**协议零增量**（消息类型 / 形状与工具栏 `webview/mode-buttons.js:37` 同型）。文案 / 本地化零改。
**无「已保存」徽标（观感面）**：翻转走专线不经 `autoSaveAgent`（其徽标闪点 = `thincoder-vscode/webview/settings-agent.js:153-154`）⇒ 翻转不闪「已保存」徽标；与工具栏开关同口径（`webview/mode-buttons.js:37` 亦零徽标）。
**发值面穷尽旁证（实读）**：webview 通用保存发值面 = `settings-agent.js` 唯一载荷构造点（渠道卡零发值——默认模型行撤场后 `settings-providers.js` 不再发 `saveAgentSettings`）⇒ engineering 零发值、guard 仅专线（无第二旁路）。

**读面零改**：guard 取值链每次快照构建按槽优先（`thincoder-vscode/src/extension/settings.mjs:145`——`slotData?.advisor?.guard ?? (config === true)`）；
复选框随建面 / 重开按快照渲染（推送不重建面板——`thincoder-vscode/webview/settings-agent.js:146-147`/`:181-183`（`updateAgentSettings`））。

**机检**：用例 T-1–T-8（两键翻转 config 逐字不变 · 伪造旁路直测 · 缺席 / `true` / `false` 三格 · `null` ⇒ 保存后键缺席）
· 第二组用例：载荷无 `guard` 键 · guard 变更 ⇒ post `setAdvisorGuard` 且零 `saveAgentSettings`）。

**边界登记**：磁盘 `advisor.guard: null` 形态被种子循环丢弃（`v: null` 除 `thinking` 外 continue——既有通例，零改）⇒
判据「翻转 / 任意保存前后对应键逐字不变」的用例域 = {键缺席 / `true` / `false`}；`null` 形态见 §3 登记行。

### 2.15 设置面失败面

方向 = 桌面形（KD-EC-7——判据 = 两端失败面同形：段标 + 词化码 ∕ 不静默丢）。

**载荷 v2**（`providerError` = `{ type:"providerError", scope, reason }`——§3.2 行 20）：

- `scope` ∈ 六段闭集 {`providers` · `mcp` · `agent` · `consultAdvisor` · `tools` · `env`} ∪ {`panel`}；`panel` ∕ 闭集外 ⇒ **零段标**（沿桌面判）。段名词键 = 复用现有 `settings.*Section` 键（**零新段名键**）。
- `reason` = 码 ∕ 原样串；webview 解析 `reasonWord`（`thincoder-vscode/webview/settings.js:78-83`）= 桌面同式：**表内出词、表外原样直传、空 ⇒ `null`（零节点）**。

**webview 面**（`thincoder-vscode/webview/settings.js`）：

- 表两件：`SCOPE_WORD`（`:63-70`——六段 ↦ 上述词键）+ `REASON_WORD` v1（`:74-76`——恰可达集：`mtime-conflict` 一枚；表随新码产者一行扩张）。
- banner = **单实例**（`renderSettingsError` `:90-111`）：段标 + 文本两子节点（携 `data-scope`）；**零自散**（无 6s 定时器——替换 ∕ 关面板止）。段标样式 = `thincoder-vscode/webview/settings.css:278-282`。
- **关面板不丢**：模块级**单槽 `_lastFailure`**（`:87`——最后一条胜）：面板关时到达 ⇒ 落槽；`buildSettings()` 尾补渲（`:189`）；`closeSettings()` 清槽（`:169-170`——**关 = 销账**）。

**extension 面**（**19 站点**统一助手——既有 9（含 P2-5 `:198`）＋新增 10）：`postProviderError(panel, scope, err)`（`thincoder-vscode/src/extension/settings.mjs:309-312`——载荷构造单源）：`err === CONFIG_CONFLICT_HINT`（核 `conflictError` 的唯一非空返回；import `:12`）⇒ `reason = "mtime-conflict"`；其余 ⇒ 原样串直传。
站点 = 既有 9：`panel-mcp.mjs:129 ∕ :140 ∕ :151 ∕ :165`（`mcp`）· `panel-messages-settings.mjs:59 ∕ :71 ∕ :84`（`providers`）· 同档 `:143-144`（`agent`）· 同档 `:198`（`env`——P2-5）；另 10 = `:190`（`env`）· `:107 ∕ :110` ∥ `:101 ∕ :104`（`tools`）· `:92` ∥ `:29 ∕ :32`（`providers`）· `:35 ∕ :38`（`mcp`）。

**i18n**：`settings.reason.mtimeConflict`（两语；`thincoder-vscode/locales/en.json:186` / `thincoder-vscode/locales/zh.json:186`——值 = 桌面同值逐字）。

**关系句**：槽（`_lastFailure`）= **消息面瞬态状态，非面板字段状态**——不触 §1 单一状态源原则（§1「DOM ∕ 模块变量不持独立状态」指 config 字段面）。

**验收（九用例 · ①–⑨）**：① 开面板 + `showSettingsError("mcp","mtime-conflict")` ⇒ banner 在场 ∕ 段标在场 ∕ 文本 = 词化句；② 表外 reason ⇒ 文本逐字 = 原样串 ∧ 段标仍在；③ `scope:"panel"` ⇒ 零段标节点。
  ④ 关面板态调用 ⇒ 零节点 ∧ 开面板（buildSettings 后）⇒ 复现（关面板不丢）；⑤ 单实例（二次调用替换）；⑥ `closeSettings()` 后复开 ⇒ 不复现（关 = 销账）。
  ⑦ 源锁：`showSettingsError`（`:113-119`）体内**零 `setTimeout`**（不自散；同档打开等待定时器 `:142-151`——250ms 回退，**不在锁域**）；⑧ 闭集外 scope（如 `"bogus"`）⇒ 零段标；⑨ 空 reason（缺 ∕ `undefined` 同判）⇒ 零节点。
真机用例（父侧）：制造写冲突 ⇒ 段标 + 词句驻留（无 6s 自散）∧ 关面板重开仍见。
**机检**：单元测试档（九用例 + 扩展侧文本锁）∥ 站点接入（单元测试档）；冒烟 = `thincoder-vscode/test/smoke-settings.mjs:88`（调用形 `showSettingsError("panel", "test error")`）。

### 2.16 provider 添加弹窗 · 字段序 · 走 proxy 开关 · 扩面三件

**来源**：用户「客户端的provider的配置界面上增加一个走不走proxy的开关，另外apikey放在最后根本不符合用户使用习惯，字段的布置应该按照填写顺序来，三个端都查一下。」+ 桌面端不许另搞一套 +「点了添加不弹窗…反人类」。**VSC = 源**（桌面逐元素照本面）。

**① 添加表单 → 弹窗（面形与开合）**

- **载体**：新档 `thincoder-vscode/webview/settings-provider-dialog.js`（表单族；表单 HTML 在卡外）。
- **DOM 锚**：遮罩 = `.settings-dialog-backdrop`（新独立类——z 999；规格入 `settings.css` 新段：fixed inset 0 ∥ `--overlay` 底 ∥ 动效复用 `backdrop-in`；不与确认族共用类 `.auto-backdrop` 合流——隔离判由 = ① 关路句）；
卡 = `#prov-add-dialog` + 新类 `.settings-dialog`（`settings.css` 新增小段：fixed 居中 ∥ z 1000 ∥ `--bg` 底 ∥ 1px 边框 ∥ 圆角 8px ∥ 宽 ≤ 420px；`role="dialog"` + `aria-modal="true"` + `aria-label` = `settings.addProviderTitle`）；
卡体 = `.settings-card-body`（字段样式复用）+ 首件 `.settings-subtitle`（`settings.addProviderTitle`）。
- **入口（两处）**：① `#prov-add-btn`（词 = `settings.addProvider`，既有——`settings-providers.js:133`）onclick ⇒ `window._openAddProviderDialog()`；
② 首启板交棒——`webview/onboarding.js:63` 的 custom 径 ⇒ `window._openAddProviderDialog?.({ key })`（`?.` 守卫保留；**分支前移**——custom 分支先于 key 校验 ⇒ 空键亦交棒（板面不再强制键——与弹窗键面「键可选」一致）；
   **携 key 预填**——板面键入值随交棒入框（`#pa-key`；开框重置序之后落 —— 零重输）；时序 = `_openSettings?.()` 后随调，面板 ∥ 框两处 +50ms 焦点定时器同拍序——框后调度 ⇒ 末位焦点 `#pa-type`）。
- **开（单例）**：已在框 ⇒ 零动作；否则建两件挂 `document.body`；开框重置 = 类型回首项 ∥ `#pa-key` 清空 ∥ `#pa-proxy` 未勾 ∥ `#pa-conn-status` 空 ⇒ `paTypeChanged()`；
初始焦点 = `#pa-type`（+50ms）。**探针结果归属（请求 id）**：`_paFetchModels` 发起时自增 `_fetchSeq` 记在飞 `_pendingFetchId`（载荷携 `id`）；`updateTestProviderResult` 落框前比对——缺 ∥ 不符 ⇒ 弃；命中即清（防重放）；开 ∥ 关框双清在飞（在飞探果跨框零污染）。
- **关（五路同效）**：保存（**守卫通过才发 + 关**——本地守卫拒 ⇒ 零发 ∥ 不关框 ∥ 在编值保留；落点 = `settings-provider-dialog.js:158-159` ∥ `:226-256`；残余 = 添加弹窗径宿主后置拒仍走「发后关」旧径——回执形见 §2.18；弹窗径 = 条件行）
∥ 取消钮 ∥ 背板点击 ∥ 框内 Esc（`stopPropagation` —— 不连带触 `webview/chat.js` 的关面板分支——沿确认弹框同判）∥ `closeSettings()` 同清——**落法**：`settings.js:169-181`（增调句 `:174`）增调新档导出 `closeAddProviderDialog()`（与 `closeConfirmPopover()` 同拍）；
**遮罩 = 独立类 `.settings-dialog-backdrop`**（z 999；样式入 `settings.css` 新段——**不入确认族共用类 `.auto-backdrop`**：确认族帚扫站点（`settings-widgets.js:109` ∥ `session-bar.js:103-104` ∥ `chat.js:100-101`）零误扫；框在场 ⇒ 确认族开 ∥ 关两向均不触框组；卡 ∥ 幕归 `closeAddProviderDialog` 独清）。
- **保存徽标（受理径才闪）**：闪点按 `paSave()` 返回值门控——本地守卫拒 ⇒ 零闪；受理径（已发消息）才亮（门控落点 = `settings-provider-dialog.js:158-159`；词 ∥ 样式 = 既有 `flashSaved`（`settings-widgets.js:58`——词 `settings.autoSaved`）复用，零新件）。
- **与卡重绘关系**：框在卡外（挂 body）⇒ `renderProvidersCard()`（`:159-164`）的 P2-6 保表单段**删**（卡重建不再触碰框；在编输入由「框不重绘」天然保真）；`bindAddProviderForm()`（`:143-153`）域收窄为盘根行 `✕`（`pa-*` 绑定随档迁）。

**② 字段序（自定义形）**

- 字段序（现任形）：`pa-type → pa-preset-info → [pa-name → pa-url → pa-format] → pa-key → pa-proxy → [拉取行] → 保存 ∥ 取消`；无 `#pa-model` 件（渠道不携模型——「拉取」钮收为渠道校验）。
- 结构 = 两条件块 + 两常显件居中：`#pa-custom-fields`（名 ∥ URL ∥ 格式）+ `#pa-custom-tail`（拉取行）+ `#pa-key` ∥ `#pa-proxy`（两形皆显——预设形 = `pa-type → info → key → proxy → 保存`）。
- 语义依据 = 用户填写序（名称→baseURL→格式→API Key→走 proxy→拉取）：key 前置（拉取需 key）∥ `pa-proxy` 邻拉取（同链路口径）。

**③ 走 proxy 开关（写面）**

- **控件**：`#pa-proxy`（`.switch` 形复用（`settings.css` 既有）；词 = `settings.proxyRow` + `title` = `settings.proxyRowTitle`——与行开关同词键）。
- **写面**：`addProvider` 载荷 + `proxy`（可选布尔，勾选 ⇒ `true`）⇒ 宿主 `handleAddProvider`（`src/extension/panel-messages-settings.mjs:66-92`）透传 `addProviderEntry` ⇒ 核 `addProviderEntry`（`thincoder-core/config-io.mjs:224-263`）受 `proxy`：`proxy === true` ⇒ 条目携 `proxy:true` 同批落盘；
缺 ∥ 非真 ⇒ 零键。条目形状单源 = `docs/core/design/CONFIG.md`。
- **与行开关一致性（点名）**：字段 = `providers[].proxy`（同一键）；行读 = `thincoder-vscode/src/extension/settings.mjs:89`（`proxy: entry.proxy === true`，行渲染 = `settings-providers.js:128`）；行写 = `thincoder-vscode/src/extension/settings.mjs:130-137`（`handleSetProviderProxy`：`true` 写 ∥ `false` 删键）。
  表单初值 = 未勾（新条目无旗）；勾选落盘后行面即显勾选（推送随动）；表单不读行值（新条目无既有态）。
- **生效面**：运行期模型请求（**逐渠独立**——条目 `proxy === true` ∧ 代理 `uri` 在案 ⇒ `proxyUri`；**无全局闸**；语义单源 = `docs/core/design/PROXY.md` §4）；**表单内〔拉取〕路由 = 同判定（③′）**。

**③′〔拉取〕路由随勾选（已裁 · 父侧）**

- 裁定：**耦合**——勾选 ⇒ 拉取按 `probeTargetOf` 同判定（勾 ⇒ 逐渠判定（`proxy: true` ∧ `uri`）⇒ 走代理；未勾 ∥ 载荷缺 `proxy` ⇒ 直连）。理据 = 用户「provider 走不走 proxy 是每个 provider 单独选」的完整落实（不耦合即死结）。
- 落法：`testProviderConnection`（`thincoder-vscode/src/extension/settings.mjs:226-237`——目标构造 = `:232`）改受 `proxy` 形参——目标 = `probeTargetOf({ name: "", baseURL: url, apiKey, format, proxy: proxy === true })` ⇒ `listModels(target)`（**逐渠判定**：条目 `proxy === true` ∧ 代理 `uri` 在案 ⇒ `proxyUri = proxy.uri`；
否则 `undefined` ⇒ 直连——`uri` 缺席亦落 `undefined`；**`uri` 非门槛**，是代理目标本体；无全局闸）；
核 `probeTargetOf`（`thincoder-core/provider-flows.mjs:79-90`）= 判定单源（判据体逐字复用，零第二份；`headers` 字段面随行）；
调用面 `handleTestProvider`（`panel-messages-settings.mjs:142-146`）透传 `proxy`；缺省 ∥ 未勾 ⇒ 直连。
- 协议：`testProvider` 载荷 + `proxy`（可选布尔——`docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 本行）。
- 同族同径（共三条，三端同一判定）：**桌面**拉取 = 同一收敛（载荷 + `proxy`；主面 `thincoder-desktop/src/main/providers.mjs:276-288`——目标 = `probeTargetOf` 同判定（`:281`）；修 = 镜像缺陷）；
**CLI** 探针 = 同一收敛（落盘条目随旗——`thincoder-cli/src/tui/provider-admin.mjs:31` ∥ `tui/cmd-config.mjs:297` ∥ `tui/wizard.mjs:217` ⇒ `probeTargetOf`；**setup-wizard 探针（`cli/setup-wizard.mjs:60`）= 探「合并条目」**——既有渠道携盘上 `proxy` ∨ `headers`（探针 ≡ 写后运行态））。

**④ 扩面三件**

- **「拉取失败不可存」死路 ⇒ 修**：无 `#pa-model` 件（渠道不携模型——「拉取」钮收为渠道校验）；`updateTestProviderResult` 探果只落 `pa-conn-status`（✓ ∥ ✗——不喂控件）；
探不通 ⇒ `pa-conn-status` 明示 ✗。`_paSave` 自定形守卫 = baseURL 空 ⇒ `settings.providerUrlRequired`（序同核 `customFieldsError`——落点 = `settings-provider-dialog.js:226-247`）；`settings.modelRequired` ∥ `settings.fetchModelsFirst` 键不在盘（两表净删）；
**不拉取即可存**（走查要点：名 ∥ URL ∥ 格式 ∥ Key ⇒ 直接保存成功——守卫 = baseURL 非空）。
- **硬编码串入表**：`(no default model)` 字面 ∥ 键均不在盘（渠道面显示 = `baseURL`——`settings-providers.js:127-128` ∥ `settings-provider-dialog.js:49-50`）
· **同线中文硬编码两处**（`:189`「宿主繁忙」∥「不可用」——词 `settings.providerHostBusy` ∥ `settings.providerUnavailable`；现值 = `settings-providers.js:129`；审计补：en 界面现显中文 = 缺陷类）⇒ `locales/en.json` ∥ `zh.json` 两语入表。
- **术语统一「API Key」**（用户定音：实体名 = API Key，zh 保留英文形）：**词值 6 键**——`settings.setKey`（en "Key" ⇒ "API Key" ∥ zh「密钥」⇒「API Key」）· `settings.addKey`（"Add Key" ⇒ "Add API Key" ∥「添加 Key」⇒「添加 API Key」）
· `model.setKey`（"Key…" ⇒ "API Key…" ∥「设置密钥…」⇒「设置 API Key…」）· `error.provider` ∥ `error.failedProvider` ∥ `banner.notConfigured`（zh 内「API 密钥」⇒「API Key」；en 无裸 key 失范——不动）；
`settings.keyOptional` 已合规（保持）；键数不变（值级改写）。

**⑤ 边界**：行 ∥ 列表侧既有开关零改；运行期代理语义（核）零改；删除确认 ∥ 密钥行 ∥ 其余卡面零改；服务端面零触；MCP env 串面另立。

### 2.17 添加入口弹窗统一（MCP 表单 ∥ 会诊添加 ∥ 模型菜单页脚直开）

**来源**：用户（逐字）「MCP添加服务服务器那个界面不好，我希望添加也在弹窗里实现，再见检查一下，还有没有别的地方添加不在弹窗里的，我希望这个行为统一一下。」。

**统一判据（单源 · 两端同判——判据句）**：**表单类添加 ⇒ 弹窗**（单例 ∥ 五路关：保存（守卫通过才发 + 关）∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ `closeSettings()` 同清 ∥ 开框重置 ∥ 初始焦点 = 首控件）∥ **单字段就地编辑 ⇒ 行内**（键行 Change ∥ provider 行编辑等——零动）∥ **首启 ∥ 宿主原生专面 ⇒ 各守其面**（首启板 ∥ 向导 ∥ CLI 交互面——零动）。
本端判入面 = 三改（MCP 添加 ∥ 会诊添加 ∥ 模型菜单页脚「+ Add provider…」⇒ 直开）；判出 = VSC 键行「Change」（单字段就地编辑 ⇒ 保持行内）。

**① MCP 表单 → 弹窗**

- **载体**：新档 `thincoder-vscode/webview/settings-mcp-dialog.js`（表单族——沿 §2.16 ① 先例；`settings-mcp.js` 只留列表 ∥ 探测结果 ∥ 状态）。导出面 = `openMcpDialog` + `closeMcpDialog`。
- **面形（沿 §2.16 ① 全件复用）**：幕 = `.settings-dialog-backdrop`（既有独立类）；卡 = `#mcp-dialog` + `.settings-dialog`（z 999/1000 既有）；体 = `.settings-card-body`；首件 `.settings-subtitle` = 态标题（新增态 `settings.mcp.addTitle` ∥ 编辑态 `settings.mcp.editTitle`——沿 `settings.addProviderTitle` 先例立两键）；
窗体容器保留既有 `#mcp-form`（id ∥ 字段 id ∥ kv 行集助手 ∥ 三型组零改）；体尾增状态行 `#mcp-status`（`.key-status` 样式复用——零新 CSS；拒因可视面）。
- **入口（两处）**：① 卡内 `#mcp-add-btn`（词 `settings.mcpAdd` 既有）⇒ `openMcpDialog(null)`；② 行「Edit」⇒ `openMcpDialog({ ...cfg, name })`（既有语义随迁：name 只读 ∥ 预填）。
- **开（单例 ∥ 开框重置）**：已在框 ⇒ 零动作；否则建两件挂 `document.body`；新增态 = 表单空（type 回首项 ∥ 三组行集零行——「零项 ⇒ 零行」同判（起手零行，行由「添加行」落）∥ `#mcp-status` 清）；编辑态 = 预填 + name 只读；初始焦点 = `#mcp-name`（新增）∥ `#mcp-type`（编辑）（+50ms）。
- **关（五路同效）**：保存（守卫通过才发 + 关）∥「取消」∥ 背板 ∥ 框内 Esc（`stopPropagation`——不连带触 `webview/chat.js` 关面板分支）∥ `closeSettings()` 同清（`webview/settings.js` 关面板径增调 `closeMcpDialog()`——与 `closeAddProviderDialog()` ∥ `closeConfirmPopover()` 同拍）。
- **拒因可见**：name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留 ∥ `#mcp-status` 显 `settings.mcp.nameRequired`（新键）；command ∥ url 判据零改（两端有意分家——已档）。
- **在飞果与框的关系（明写）**：本框**无在飞果入框路径**（探测 ∥ 重连结果皆落列表行面——`updateMcpTools` ∥ `updateMcpTestResult`）⇒ **代际弃果不适用**（与添加弹窗有拉取探果不同，不设 epoch）。
- **跨框互清**：`settings-provider-dialog.js` 关径按 `.settings-dialog*` **类全扫**（`closeAddProviderDialog()` `:200-204`）⇒ 收窄为**各弹窗只清自身两件**（模块持引定点清）；`closeSettings()` = 三清（provider ∥ mcp ∥ consult 同拍）。

**② 会诊添加 → 弹窗**

- **载体**：新档 `thincoder-vscode/webview/settings-consult-dialog.js`（`#consult-add` 出口改开框；行追加 ∥ 保存径 = 既有 `consult-rows-changed` ⇒ 零新协议）。
- **面形**：幕复用；卡 = `#consult-add-dialog`（`.settings-dialog`）；首件 `.settings-subtitle` = `settings.consultAddTitle`（新键）；两字段 = provider ∥ model（显示值——`.key-field` 标签 + 值 span；词 = `settings.consultProvider`（新键 · 值同桌面）+ `settings.model`（既有））；
**模型选择件 = 现有浮层复用**（`openModelMenu`——点选回填两字段；`closeConsultDialog` 同清浮层）；提交 = `settings.consultAdd`（既有键）∥ 取消 = `settings.cancel`（既有）。
- **层序前提（浮层与弹窗同屏——本面）**：模型浮层 = 核件 `thincoder-render-core/composer/model-menu.mjs`（`.mm-overlay` z **1000** ∥ `.mm-panel` **1001** ∥ `.mm-flyout` **1002**——`thincoder-render-core/composer/model-menu.css:11 ∥ :13 ∥ :31`；overlay 挂 `document.body` 尾——`:145`）。
弹窗 = 幕 **999** ∥ 卡 **1000**（`thincoder-vscode/webview/settings.css:292 ∥ :301`；两件挂 `document.body`——`settings-provider-dialog.js:178`，两新框同径）。
**同层（1000）以挂载序破平——后开者在上**：浮层由弹窗内点按开启（晚于弹窗挂载）⇒ 恒在弹窗之上；`mm-panel` ∥ `mm-flyout`（1001 ∥ 1002）直接高于卡；`closeConsultDialog` 同清浮层 ⇒ 关框零残留。
- **上限 5 判据保留**：入口钮在 `.consult-row` 数 ≥ 5 时 `disabled`（对齐桌面「行未满才可用」）；提交守卫同判据（不齐 ∥ 满 ⇒ 零发送）。
- **关（五路同效）**：提交（通过才追加 + 关）∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ `closeSettings()` 同清（`closeConsultDialog()`）。
- **提交径**：追加完整行（provider + model，effort 空）进 `#consult-rows` ⇒ 派 `consult-rows-changed`（既有保存链）⇒ 关框；**无在飞果 ∥ 无代际面**（选型浮层 = 同步选择）。

**③ 模型菜单页脚「+ Add provider…」⇒ 直开（本端零宿主往返）**

- **落法**：`webview/input.js`（OUT 表 `addProvider` 条——现 `:32`）由「出站消息」改**本地面动作**（`window._openAddProviderDialog()`——**裸调用 ∥ 不取防御式回退**：门由 `initSettings`（`webview/settings.js:39`）安装、同文档 ⇒ 点击前必已安装；缺门响亮失败——沿 §2.10 纪律）——与桌面「post 映射 = 本地面」对称（桌面 `composer-wire` 同拍改）；
`removeProvider` ∥ `setKey` 两条仍走既有出站（确认门 ∥ 消息）。
- **宿主面**：`handleAddProvider`（`src/extension/panel-messages-settings.mjs`）**无载荷 else 支**（QuickPick 增流程）不在盘——残留分支 = 畸形载荷 ⇒ `console.error` 零动作（fail-loud）；`provider-flows.mjs` 的 `addProviderFlow` 包装（`:33`）不在盘（唯一调用点即该支；核流程 ∥ CLI 交互面零动——CLI 仍走核 `addProviderFlow`，判据「宿主原生专面各守其面」）。
- **协议面**：`WEBVIEW-PROTOCOL.md` §13 `addProvider` 行发送列 = onboarding ∥ 表单两处；host 消费位分支 = 无载荷支。

**判据 / 机检**：单元测试档（8/8——用例集：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留）∥ 跨框互清（各弹窗只清自身两件）∥ 页脚零出站（`addProvider` = 本地面动作——零 `postMessage`）∥ 词面五新键两语）；
真机 = 人工走查（MCP 新增 ∥ 编辑两态：五路关 ∥ 开框重置 ∥ 拒径不关框 ∥ 提交成功后列表随动；会诊：入口满 5 禁用 ∥ 提交成功关框；页脚直开）。

**受影响文件（内容行数口径）**：

| # | 文件 | 行数 | 面 |
|---|---|---|---|
| 1 | `thincoder-vscode/webview/settings-mcp-dialog.js`（新档） | **219** | MCP 弹窗体（表单族析出） |
| 2 | `thincoder-vscode/webview/settings-consult-dialog.js`（新档） | **151** | 会诊弹窗体 |
| 3 | `thincoder-vscode/webview/settings-mcp.js` | **126** | MCP 列表面（表单族再析出） |
| 4 | `thincoder-vscode/webview/settings-tools.js` | **212**（卡内 `mcpFormHtml()` 引用与 import 净删——清单外随动） | Tools 卡壳 ∥ 键行族 ∥ 索引面 |
| 5 | `thincoder-vscode/webview/settings-provider-dialog.js` | **284** | 添加弹窗体（跨框互清收窄为自身两件） |
| 6 | `thincoder-vscode/webview/settings.js` | **199** | 面板壳（关面板增调两新清） |
| 7 | `thincoder-vscode/webview/settings-models.js` | **214** | 会诊入口改开框 ∥ 行追加口出让 |
| 8 | `thincoder-vscode/webview/input.js` | **128** | OUT 表 1 条改体（`addProvider` ⇒ 本地面动作） |
| 9 | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | **238** | 宿主消息面（无载荷支净删） |
| 10 | `thincoder-vscode/src/extension/provider-flows.mjs` | **39** | 宿主流程壳（`addProviderFlow` 包装净删） |
| 11 | `thincoder-vscode/locales/en.json ∥ zh.json` | **298**（+5 键 × 两语） | 词面 |
| 12 | `thincoder-vscode/webview/settings.css` | **412** | 样式（零新 CSS——类全复用） |

**跨 300 面**：`settings.css` **412**（>300 在册 ⇒ 拆分窗口顺延；单源 = §3 样式档行）；其余各档皆 <300（`settings-provider-dialog.js` **284** ∥ `settings-mcp.js` **126** ∥ 两新档 **219** ∥ **151**）。零触面 = 核 ∥ CLI ∥ 桌面。

**④ 边界**：MCP 字段集 ∥ 型组 ∥ kv 行式机制 ∥ 探测/重连语义零改；会诊行渲染 ∥ effort 档 ∥ advisor 面零改；键行就地编辑保持行内；首启板 ∥ 向导 ∥ CLI 交互面零动；桌面另面（`docs/desktop/design/SETTINGS.md` §2.18 ∥ §1 KD-77）。

### 2.18 密钥行保存回执链

> 协议面登记 = `doc:WEBVIEW-PROTOCOL.md:§3.2`（行 25）+ 该档 §12 对表行。

**问题（实读）**：密钥行保存（`webview/settings-providers.js:15-37` `_editKey` → 消息 `saveProviderKey`）徽标 `flashSaved` **发消息即闪**（`:22`）；
宿主后置拒（`setProviderKey` 冲突等——`thincoder-vscode/src/extension/settings.mjs:290-297`）无成功回执可辨——宿主又无条件 `panel._pushStatus()`（`thincoder-vscode/src/extension/panel-settings-push.mjs:25-29`），
准入读数变化时 providers 卡重绘 ⇒ **在编编辑行被清**（「发消息后关」）⇒ 用户见关闭 + 徽标已闪 = 以为成功。

**判据（拒 ⇒ 零闪 ∥ 行不关 ∥ 拒因可见；受理 ⇒ 闪 + 行关）**：

- **受理回执**（新消息 `providerKeySaved { name }`——host → webview）：宿主 `handleSaveProviderKey` 保存**成功**后发（`thincoder-vscode/src/extension/panel-messages-settings.mjs:43`——行号随三态门）；webview 收 ⇒ 同名字行在编 ⇒ 恢复静态行（现读 SS——与取消径同形）+ `flashSaved`（词 ∥ 样式复用，零新件）。
- **拒径**：零回执 ⇒ **零闪**；宿主失败照旧发 `providerError`（`scope:"providers"`——失败面单槽 banner，§2.15；机制零改）⇒ **拒因可见**；**行不关** = providers 卡重绘守卫——在编密钥编辑（`#prov-list` 内 password 输入在位）⇒ `updateProviderStatus` 本拍只更新 SS、不重绘（用户输入优先于推送——沿 U-S10 工具键行 `skipWhileEditing` 同判；在编值保留、可即改即重存）。
- **行关不依赖状态推送**（同值重存 ⇒ 状态无差、无重绘）：由回执径就地恢复——受理径恒达。
- **无写径**：空 ∥ 全空白钥 ⇒ 写面守卫早退（零写盘 ∥ 零错误）⇒ 宿主**零回执**（回执 ⟺ 真写）+ `console.warn` 一条（零静默；亦不判失败——发送面守卫使该径 UI 不可达）。
  写面三态 = `{ status: "ok" | "no-write" | "conflict", hint? }`（单源 = `thincoder-vscode/src/extension/presets.mjs` `storeProviderKey`——透传链 = `settings.mjs` `saveProviderKey`）。

**边界**：添加弹窗径（`addProvider` 宿主后置拒）不在本节——残余 = §2.16 ①（条件行）；本回执形为其复用模板。桌面对位（`provider:setKey` 回执 + 失败草稿——`renderer/mount-settings-segments-providers.mjs:57-79`；主面回读核验「零假成功」——`thincoder-desktop/src/main/providers.mjs:198-209`）。

**机检**：① 宿主：成功 ⇒ sink 恰 `providerStatus` + `providerKeySaved{name}`；
冲突注入（假 config-io 短接）⇒ 恰 `providerError{scope:"providers",reason:"mtime-conflict"}` ∧ 零回执；
② webview：保存动作 ⇒ 零闪；回执 ⇒ 行恢复 + 徽标显；在编行在位 + 状态推送 ⇒ 卡不重绘（password 输入与在编值俱在）；③ 拒径复合 ⇒ banner 在场 + 行在 + 零闪。
**三态门 + 真写用例** = 单元测试档 ③甲（假 panel 三态：`ok` ⇒ 恰一条回执 ∥ `no-write` ⇒ 零回执 + warn 一条 ∥ `conflict` ⇒ `providerError{providers,mtime-conflict}` ∧ 零回执）+ ③乙（真写——临时 config 缝：空钥 ⇒ `no-write` 零写盘 ∥ 真钥 ⇒ `ok` 落盘 ∥ 冲突注入 ⇒ `conflict`）。

### 2.19 会诊行 ✕ 容器级委托

**病征**：追加的会诊行其 ✕ 在「关面板 → 重开」前无监听（建面期仅逐行绑定现存行——`webview/settings-consult-dialog.js:142` 建行 ∥ `webview/settings-models.js:210-211` 绑定；
面板推送不重建）。**现形 = 容器级委托**：`bindConsultRows` 内 `#consult-rows` 一件 `click` 委托（`e.target.closest(".consult-del")` ⇒ 行移除 + 派 `consult-rows-changed`）；无逐行绑定循环。**零语义外溢**：现存行行为逐字同；
行追加口 ∥ 保存链 ∥ 上限 5 判据 ∥ effort 档 ∥ advisor 面零改。**判据** = 单元测试档（真 webview：追加行 ✕ 即点即删 + 事件在案 ∥ 现存行回归）。
**受影响文件** = 全量小表（跨两端——含本端两行：源档 `thincoder-vscode/webview/settings-models.js` ∥ 单元测试档）——落点 = `docs/desktop/design/SETTINGS.md` §2.19。

### 2.20 团队卡（登录与接入）

- **机制单源** = `docs/core/design/TEAM.md` §2（本档只收**面板 ↔ config 契约**端差面：承载 = 新卡 ∥ 消息面）。
- **读面**：`teamStatus` 推送（宿主 → webview）= `{ loggedIn, server, member, label }`（形 = `thincoder-vscode/src/extension/team.mjs`（已落）投影；渲染面只读——单一状态源 = config.json 重建制不变）。
- **写面**：webview → 宿主 `teamLogin { server, username, password }` ∥ `teamLogout`；宿主处理体调核 `thincoder-core/team.mjs`（已落——`writeConfigAtomic` 单写者；**端侧零自写盘**）；成 ⇒ 推 `teamStatus` + `providerStatus`（派生条目入列表——Providers 卡随动）。
- **回执形与一次性提示**：`teamLogin` 回执携 `notice?`（仅同名手工条目冲突时在场——值 `"manual-name-conflict"`）∥ `teamLogout` 回执携 `revokeDelivered?`（缺席 = true = 服务端吊销已送达）；
  在场 ⇒ 卡内就地提示——同名冲突（登录当刻）：「已存在同名 provider「team」——未自动添加；请改名或删除后重登」∥ 吊销未达（退出当刻）：「服务端吊销未达」——两句逐字同句（`docs/core/design/TEAM.md` §2.5）· 文本归本端 i18n；
  两提示 = 一次性事件（登录/退出当刻就地显示）——**`teamStatus` 零提示字段**（形不变：`{ loggedIn, server, member, label }`）。
- **密码面**：请求内存即弃（零落盘 ∥ 零回显广播）；重建/切卡清空密码格。
- **失败出词**：网络不可达——请检查地址与端口 ∥ 用户名或密码错误 ∥ 登录尝试过于频繁 ∥ 本机配置写入失败——四句逐字同（i18n 键 zh/en 双表 +14 键）。
- **推送点**：`teamStatus` 推送点 = `thincoder-vscode/src/extension/settings.mjs`（`pushTeamStatus(panel)`——panel 级，镜像 `pushStatus`）；
  `thincoder-vscode/src/extension/panel-settings-push.mjs` 两条推送链调用（快照族拍：light 档中置 `agentSettings` 前 ∥ full 档中置 `shellCandidates` 后）；
  上行恰 `teamLogin` ∥ `teamLogout` 两条（读面纯推送——无第三上行）；模型候选面唯一来源 = `fullStatus` 的 `models` 载荷——登录成拍补齐（成支 `panel._pushStatus()` ⇒ `panel._pushSettings()`，同拍发 `models`；机制单源 = `docs/core/design/TEAM.md` §2.8）；重绘两门 = 变更门（JSON 比对，镜像 `updateProviderStatus`）∥ 聚焦跳绘门（U-S10 同判）——面板未开 ⇒ 零动作。
6. **卡 = 管理面**——登录表单与退出钮不在卡内（登/退 = 首启板团队卡 ∥ 状态栏团队 item + 命令 `thincoder.team`——`docs/vsc/design/WEBVIEW.md` §4.11 ∥ §4.12）；
  卡面保留 = 端标签 + 详情（server ∥ member ∥ label）+ 未登录句；「轮换」在卡内（已登录在场——确认一步 + 结果行；机制单源 = `docs/core/design/TEAM.md` §2.7）；读面 `{ loggedIn, server, member, label }` 形零改（`verify` 态住宿主 item——零出站）；写面消息面（`teamLogin` ∥ `teamLogout`）零改（命令流复用同一核链）。

### 2.21 模型上下文声明编辑（`providerContextSaved` 回执）

> 协议面登记 = `WEBVIEW-PROTOCOL.md` §3.2（行 35）+ 该档 §12 对表行 ∥ §13 发面行。

**机制单源** = `docs/core/design/PROVIDER.md` §6.15「写面：`modelContext` 编辑（三端同形 · 同批齐）」——本节只收 VSC 端的入口、协议对与状态面；交互五步 ∥ 值校验 ∥ 清除确认语义不复述。

- **入口**：providers 卡渠道行动作簇 `Context…` 钮（`thincoder-vscode/webview/settings-providers.js:120`）——行内入口 ⇒ 弹窗「选渠道」一步 = 点该行。
- **上行** `saveProviderModelContext { name, model, k }`（webview → host）：`k` = K 单位正整数；空 ∥ `null` ⇒ 清除径（有已声明值时先过确认层）。
  分发 = `thincoder-vscode/src/extension/panel-messages.mjs:318` → `panel-messages-settings.mjs:130-151` → `provider-context.mjs` `saveProviderModelContext`（`thincoder-vscode/src/extension/settings.mjs:141` re-export）。
- **回执** `providerContextSaved { name, model, k }`（host → webview）：宿主保存**成功**后才发——拒径（值非法 ∥ 渠道不存在 ∥ 键歧义）零回执、零落盘，拒因经既有 `providerError`（`scope:"providers"`）可见。
  webview 收 ⇒ 行内保存行显示 4s 自散（`thincoder-vscode/webview/settings-providers.js:76-90`，消费壳 = `webview/chat-messages.js:170`）；清除径（`k === null`）零提示，卡面行随 `providerStatus` 重推复读 `未声明` / `Not declared`。
- **状态面**：卡面行读载荷 `modelContext` 的已声明值（逐条 `模型: NK` ∥ 单条 `NK` ∥ 无声明 `未声明`）；合法性判据与读链同一个谓词（`positiveInt`）——值非法 ⇒ 与「无键」同面显示 `未声明`；编辑弹窗输入框回填**盘面原值**。规则单源 = `docs/core/design/PROVIDER.md` §6.15「读面回显」。
  `providerStatus()` 另携 `context`（`providerSpec(entry).context`，token）——卡面不读它。

**机检**：① 宿主：成功 ⇒ sink 恰 `providerStatus` + `providerContextSaved{name,model,k}`；值非法 ∥ 渠道不存在 ∥ 歧义键 ⇒ 零落盘 + 零回执 + 报错串在场；
② webview：回执 ⇒ 保存行显示且 4s 自散；清除径 ⇒ 零提示 + 行面转 `未声明`；③ 卡面：手改 JSON 写非法值（`"128"` ∥ `0`）⇒ 行面 `未声明`、弹窗输入框回填原值、盘上零改写（用例 W-18）。

**边界**：三端交互五步 ∥ 值校验 ∥ 键处理 ∥ 清除确认 = `docs/core/design/PROVIDER.md` §6.15 单源；本节零新增语义。

## 3. 已知待办与已知限制

- **添加弹窗径宿主后置拒仍走「发后关」**（回执面 · §2.16 ① 残余）：弹窗保存（`webview/settings-provider-dialog.js:231-258` `paSave`）= 发消息即关 + 受理径闪；
  宿主后置拒（核错误串——`addProviderEntry` 面）时框已关（在编输入丢；拒因经 `providerError` banner 可见）。密钥行回执链（§2.18）已定形「受理回执 + 拒 ⇒ 不关 + 拒因可见」——弹窗径复用同一回执形（`addProvider` 对位回执 + `paSave` 关径门控）。消解路径 = 弹窗面下次被触碰时并入；到期 = 该面下次触碰。
- **运行时当次展开缺口**（§2.6）：磁盘原文保留 `~` 的配置在面板 / `settings` 工具写面不展开——登记在案（与对端同姿态）。
- 设计 round2 专用提示词、架构档 NFR 补全等开放项 = 仓根台账 `docs/TODO.md`（项目级唯一台账）。
- **进程内缓存不随外部写同步**（§2.7 边界）：embedder `_tried` 缓存 / 会话槽不因外部写盘重载——登记（非本板块范围）。
- **无 `proxy.uri` 时勾 web / model 零落盘**（观感面 · §2.8 路径册 #1 子路径）：宿主 `!uri` 即 `delete raw.proxy; return`
  （`thincoder-vscode/src/extension/settings.mjs:231`）⇒ 两开关的改写静默失效，而 UI 闪「已保存」（`thincoder-vscode/webview/settings-env.js:115`）；
  消解路径 = 代理面「URI 缺席 ⇒ 其余字段保留」与该删除语义一并复核（或保存回执改由宿主返回、徽标按回执亮）；到期 = 代理面下次被触碰时。
- **快照未达拍的代理控件渲染值**（观感面 · §2.8 登记）：`#px-web` 在快照缺席时按渲染默认显示为勾选——打开拍必达落地后该拍仅在推送丢失时出现，且发值门（§2.8 基线判据）已消除其危害；消解路径 = 若日后引入推送回执 / 超时可见化，则在同一处显式化该拍；到期 = 设置面下次被触碰时。
- **确认弹框形态三处同族重复**（结构面 · §2.10 登记）：同一弹框件现有三处实现——
  `thincoder-vscode/webview/session-bar.js:75-107`（会话删除确认）· `webview/mode-buttons.js:54-92`（AUTO 启用确认）· §2.10 的 settings 面一处；
  只在 settings 面立单源（`showConfirmPopover`）。消解路径 = 抽公共件 `thincoder-vscode/webview/confirm-popover.js` 并三点迁移（纯搬移、零语义改）；
  到期 = 该两面下次被触碰时 / 父侧裁定扩写域。
- **provider 行 − 的凭证归类**（归类面 · §2.10 入口册 #4）：该行条目内含 `apiKey`（写入 = `thincoder-core/config-io.mjs:201-208` · 删条目的整条 filter = `:262-277`）⇒ 删行同时移除 key 原文 ⇒ 判入**不可复得类**（用户裁定 A——载体 = `webview/settings-providers.js:137` 卡 HTML + `:22-23` 编辑行取消重建位）。
- **本门弹框文案**（文案面 · §2.10 弹框契约登记）：正文键 `settings.secretDeleteConfirm` = 类通用式（值级改写 · 键数不变 · 键名不动；改写值 = §2.10 文案条）——密钥类与 MCP server 行（入口册 #5，不显掩码、删除目标 = 整条 server 条目）两族均成立。
- **`settings-tools.js` 越 300 行建议线（拆分复核）**（结构面 · §2.10 载体登记）：**已拆**——本档 **212** ∥ 新档 `settings-mcp.js` **126**。
  组边界 = ① **MCP 族**（`renderMcpList` / `updateMcpTools` / `updateMcpTestResult` / `openMcpForm` / `bindToolsControls` MCP 段 / `toolsCardHtml` 表单段）
② 密钥行族（`renderKeyRow` / `KEY_ROW_ACTIONS` / 三处 handler）③ 卡骨架 + 快照消费（`toolsCardHtml` / `updateWebsearchSettings` / `renderIndexStatus`）
——① 拆出 = `thincoder-vscode/webview/settings-mcp.js`；缝 = `mcpFormHtml()` ∥ `bindMcpControls()` 两口回插；对外导出名零改——`settings.js` ∥ `chat.js` 消费面零改。
  到期条件 = 阈值 750 行到达时。
- **直通门 `_confirmDelete` 零调用点（保留门）**（结构面 · §2.10「后态」）：入口册全数过确认门 ⇒ `window._confirmDelete`（`thincoder-vscode/webview/settings.js:50`）**零调用点**（门体零动——**保留门**）；
  `test/smoke-settings.mjs:95` 的 handler 在位断言照绿。

- **入口 6 的确认不绑定目标**（交互面 · §2.10「模型菜单入口」段登记）：确认弹框发生在宿主 QuickPick 选定**之前**（文案 = 类通用式 `settings.secretDeleteConfirm`、不携 `name`）⇒ 与入口 1–5（目标 = 载体所在行）的确认力度不同；按「取消 ⇒ 零删除 ∧ 零消息副作用」的**严格读法**选门位（webview 侧调用点），代价入册。
  补偿 = 目标选定步（QuickPick）自身是显式选择（见 §2.10 补偿两条）；消解路径 = ① 若父侧裁定确认须绑定目标，则须先裁定该半句读法（严格 = 零发值 / 宽松 = 无持久副作用）+ 登记第二确认形态（VS Code 原生件）例外；② 或宿主把选定 `name` 回传 webview 走同件（须协议 +1 条消息）；到期条件 = 本门下次被触碰 / 父侧裁定。

- **`thincoder-vscode/src/extension/settings.mjs` 越 300 行建议线（拆分复核）**（结构面 · §2.13 载体档）：该档现 **426**（内容行数口径）——**仍越 300 建议线**（< 750 触发阈值）⇒ 拆分计划维持（快照面透传语义不变）。
  拆分组边界 = ① 快照族（`agentSettings` / `proxySettings` / `websearchSettings` / `fullStatus`）② 渠道路由族（provider 增删 / 代理旗标 / 连接测试）③ 密钥与 MCP 族（`saveProviderKey` / `deleteProviderKey` / MCP 三件）——① 拆出 = `thincoder-vscode/src/extension/settings-snapshots.mjs`。
  拆分计划 = 触发阈值 **750 行** 或该档下次结构改动（先到即拆）；到期条件 = 触发阈值到达时。

- **`advisor.guard: null` 磁盘形态 vs 判据用例域**（边界面 · §2.14 载体）：种子循环（`settings-panel-write.mjs:135-139`）对 `v === null` 除 `thinking` 外 continue
  ⇒ 面板通用保存不 verbatim 携带该形态（既有通例，非引入）。判据（翻转 / 任意保存前后 config 逐字不变）的用例域 = {键缺席 / `true` / `false`}；
  **静态预期 = `null` ⇒ 保存后键缺席（非 `null` / 非 `false`）**——机制链（实读）：种子循环先丢该 null ⇒ `patch.advisor` 不含该键（`:174`）⇒ `applyAgentPatch` 顶层整键替换（`:30-37`——`advisor` 顶层键整段覆盖、无深合并）⇒ 盘上该键缺席。
  消解路径 = 若后续统一 null 语义（全族 carve-out 收拢），则同笔纳入；到期条件 = `settings-panel-write.mjs` 种子循环下次被触碰。
- **镜像撤写的措辞残余族（域外坐标 · 只报不修）**（措辞面）：
  ① `docs/core/design/ENG-TOKEN-BINDING.md:100`（「slot 持久化 = 会话槽 + config.json mirror」——该 mirror 已撤销）·
  ② `docs/core/design/ENGINEERING-MODE-V2.md:377`（读面回退句）· ③ 注释 / 产品文本：`thincoder-vscode/AGENTS.md:86` · `thincoder-vscode/src/extension/settings.mjs:181` · `thincoder-vscode/src/extension/panel-session-write.mjs:92` ·
  `webview/mode-buttons.js:3-4`（「These mirror config.json fields」——engineering / advisor 两钮语境已失实）。
  在册集 = `docs/core/design/TOOLS.md:82` / `:123` + 注释三处（③ 前三项）＋ `mode-buttons.js` 项。
  消解路径 = 各档下次被触碰逐处收正（设计档笔 = eng-designer；注释 / 产品文本 = 产品代码面）；到期条件 = 各档下次被触碰 / 父侧另册归形小批。
- **`thincoder-vscode/webview/settings.css` 越 300 行建议线（拆分复核）**（结构面 · §2.15 载体档）：该档现 **485** 行（内容行数口径）——**复核结论 = 不拆**（增量 = 段标 span 单条样式 + 弹窗两段，非结构性）。
  拆分计划 = 触发阈值 **750 行** 或 **设置面样式族下次结构改动**（先到即拆）；
  组边界（三段 · 按现分节注释）= ① 面板骨架 + 通用件（面板框 ∕ 卡框 ∕ 字段 ∕ 按钮 ∕ 开关）② 卡面样式族（providers ∕ MCP ∕ consult ∕ agent 徽标 ∕ model-menu）③ first-run 面板段。
  到期条件 = 触发阈值到达时 ∕ 设置面样式族下次结构改动时。

## 5. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-S1 | 面板**整体重建**（单一状态源 = config.json），不做增量 diff 渲染 | 已定（§1） |
| U-S2 | 卡片**按使用频率排序**（Providers → Agent → Consult & Advisor → Tools & Services → Environment），不按功能域分组 | 已定（§1） |
| U-S3 | 选模型控件 = **两级悬停子菜单**（否决原生下拉 / 搜索框） | 已定（§2.2） |
| U-S4 | 会诊 / Advisor 行**显式 effort 档**；subagent 不带 effort | 已定（§2.2） |
| U-S5 | 语义索引状态行在模型不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」 | 已定（§2.5） |
| U-S6 | 外部写感知**静默刷新**（用户编辑中不重建面板——自写抑制，§2.7） | 已定 |
| U-S7 | 面板宽度 / 响应式断点 / 主题变量 | **open**（未落档——不静默补） |
| U-S8 | 未编辑不发值：基线判据 + 逐字段载荷（代理与 Shell 控件）；「空值 ⇒ 删键」只由显式用户动作触发 | 已定（§2.8） |
| U-S9 | Shell 控件接线：`System default` 项 = 重置（删键）；自定义路径空值 = 不发值 | 已定（§2.9） |
| U-S10 | 回填跳过聚焦中的控件（用户输入优先于推送） | 已定（§2.8） |
| U-S11 | 不可复得类（凭证原文随删除消失）删除 = **面板内确认弹框**（复用 `.auto-confirm` 件）；可重填类 = 直通门 `_confirmDelete`——**后为空域**（入口册 **6 行**全数入本门；直通门零调用点） | 已定（§2.10；本门实例 = MCP server 行 + provider 行 − + 模型菜单 footer 行） |
| U-S12 | Advisor effort 选择三态：档位值 = 写 `advisor.reasoningEffort`；`none` = 关思考（写 `thinking` off 形 + 删 effort 键）；「—」= 不设档（删 effort 键，不动 thinking） | 已定（§2.13 · §15.4 规则单源） |
| U-S13 | Advisor guard 开关 = **槽唯一权威**（翻转 / 通用保存两路均不写 config.json）；engineering 同口径 | 已定（§2.14） |
| U-S14 | 添加渠道 = **弹窗形态**（单例 · 遮罩 + 居中卡 `#prov-add-dialog`；开 = `_openAddProviderDialog()`；关五路：保存（**本地守卫通过才关**——拒 ⇒ 零发 ∥ 不关框 ∥ 在编值保留，§2.16 ①）∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ 关面板；初始焦点 = 首控件）；字段序 = 用户填写序（名称→baseURL→格式→API key→走 proxy→拉取）；表单「走 proxy」= 写 `providers[].proxy`（与行开关同字段 ∥ 同词键） | 已定（§2.16） |
| U-S15 | 添加表单（弹窗）自定形**不设 model 控件**（渠道不携模型；守卫 = baseURL 非空）；「拉取」钮 = 渠道校验（探果只落状态行） | 已定（§2.16） |
| U-S16 | provider 配置面词面：实体名 = **「API Key」**（zh 保留英文形；两端 i18n 词值 = API Key）；卡面残余硬编码串入表（`settings.providerHostBusy` ∥ `settings.providerUnavailable`；`settings.noDefaultModel` 不在盘） | 已定（§2.16） |
| U-S17 | MCP 表单 env ∥ headers = **行式键值编辑器**（每行键格 + 值格 + ✕；行集下 `[+ 添加行]`；零项零行）；粘贴零解析；值 = 字面（零引号剥离）；提交四判据（空行丢 ∥ 重复后胜 ∥ 全空删字段 ∥ trim） | 已定（§2.4；桌面逐元素同形 = `docs/desktop/design/SETTINGS.md` §1 **KD-76**） |
| U-S18 | **添加入口统一判据**：表单类添加 ⇒ **弹窗**（单例 ∥ 五路关：保存（守卫通过才发 + 关）∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ `closeSettings()` 同清 ∥ 开框重置 ∥ 初始焦点 = 首控件）；单字段就地编辑 ⇒ **行内**；首启 ∥ 宿主原生专面 ⇒ 各守其面。本端落形 = MCP 弹窗 ∥ 会诊弹窗 ∥ 页脚「+ Add provider…」直开（零宿主往返）；MCP name 空 ⇒ 拒因可见（`settings.mcp.nameRequired`） | 已定（§2.17；桌面同判 = `docs/desktop/design/SETTINGS.md` §1 **KD-77**） |
| U-S19 | 密钥行保存回执：受理（宿主保存成功径）⇒ 行就地恢复 + 闪；拒 ⇒ **零闪** + 行不关（卡重绘在编守卫）+ 拒因可见（`providerError` banner）——回执单消息 `providerKeySaved { name }`；**无写（空钥守卫）⇒ 零回执 + warn 一条**（回执 ⟺ 真写） | 已定（§2.18） |
| U-S20 | **团队卡**：登录表单 = 服务器地址 ∥ 用户名 ∥ 密码三字段；未登录提示句 = 「未登录——登录后可用」（三端逐字同句）；退出 = 登/退面钮（**卡内无登/退钮**：首启板团队卡 ∥ 状态栏 item 流——`docs/vsc/design/WEBVIEW.md` §4.11 ∥ §4.12；卡 = 管理面 label ∥ 详情）；同名手工 `team` 条目 ⇒ 登录成 + 就地提示（不覆盖不弹窗） | 已定（§2.20） |
