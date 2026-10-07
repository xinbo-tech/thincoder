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
| **Providers** | provider 行（状态点 / 标签 / 掩码 key / 模型·baseURL / proxy 勾选 / Key / ✕）+ Add 弹窗（弹框形态；字段序 = 名称→baseURL→格式→API Key→走 proxy→拉取→模型〔手输+datalist〕；§2.16） | `thincoder-vscode/webview/settings-providers.js` · `thincoder-vscode/webview/settings-provider-dialog.js` |
| **Agent** | maxTurns（默认 200）· subagentTurns（默认 100）· compactThreshold（空 = auto）· verifyGuard · autoThink + Subagent models（global + explore/plan/coder/eng-coder，modelMenu 槽位） | `thincoder-vscode/webview/settings-agent.js` |
| **Consult & Advisor** | 会诊行（modelMenu + effort 档 + ✕、+ 添加）+ Advisor（guard + provider/model + effort） | `thincoder-vscode/webview/settings-agent.js` |
| **Tools & Services** | MCP servers（列表 + stdio/http/ws 表单（env ∥ headers = 行式键值——§2.4）+ 连接状态 ●/○ + Reconnect）+ Web Search key + Semantic Index（key + Build） | `thincoder-vscode/webview/settings-tools.js`（卡壳 ∥ 键行族 ∥ 索引）+ `thincoder-vscode/webview/settings-mcp.js`（MCP 面——§2.10 拆档产出） |
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

- 写入链：面板 → `saveAgentSettingsFromPanel`（**单写通道**，`thincoder-vscode/src/extension/settings.mjs:162` 转出——W16 已迁核，原 `config-io` 自持面已删；现体 = 核 `thincoder-core/config-io.mjs`）→ config.json `agent.*`。
- **advisor 字段级合并**（GitHub #3 修复）：payload 缺键**从磁盘回填**（对端写入的 provider / model / thinking / reasoningEffort 在面板保存后存活）；显式 `null` / `''` = 清空删除；wire 层空槽位必须发 `null` 而非 `undefined`（postMessage JSON 会丢弃 `undefined` 键——**缺失与清空必须可区分**）。`timeoutMs` 透传保留手写值。
- 面板打开即拉新：`openSettings` → `getAgentSettings`（webview → extension）→ extension 重读盘推送 `agentSettings`（extension → webview）→ 收到后渲染（250ms 超时回退快照）。对端写盘后打开面板即可见。
- `subagentModels` 优先级：工具 model 参数 > `subagentModels[role]` > `subagentModel` > 父 provider。
- **autoThink 档位开关**（#17——Auto 组对齐桌面 ∕ CLI `/think` 同键）：键 = `agent.autoThink`（默认 false）。**读链**：`loadAgentSettings()`（`thincoder-vscode/src/extension/settings.mjs:42`）→ 快照 `agentSettings()` 携键（`:137`）→
  agent 卡两态渲染；**写链**：`saveAgentSettingsFromPanel`（`thincoder-vscode/src/extension/settings-panel-write.mjs:80`）显式布尔写（false 亦写——同 verifyGuard 式）；
  **控件**：`#ag-autothink` switch（`thincoder-vscode/webview/settings-agent.js:26-27`——verifyGuard 后位）+ 载荷 `autoThink: chk("ag-autothink")`（`:123`）。词面 = `settings.agent.autoThink`（两语 = 桌面同值）。
- Shell 为 config.json **顶层字段**（不在 `agent` 下），走独立消息通道；平台感知候选（System default / pwsh / Git Bash / WSL）。写面契约（控件接线 / 空值语义）= §2.9。

### 2.4 MCP 存储

共享 `config.json` 的 `mcp.servers[]`（两产品同格式）；旧 VS Code settings 已一次性迁移。重名拒绝、args 空格分隔。

**env ∥ headers 输入 = 行式键值（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036——两端同形，本端为准）**：表单三组（stdio `env` ∥ http `headers` ∥ ws `headers`）各为**行集**——每行 = 键格 + 值格 + ✕，行集下 `[+ 添加行]`；**零项 ⇒ 零行**（零假造）。
提交判据：键 ∥ 值 trim 后**空键行 ∥ 空值行不提交**（空值 = 旧串式 `k=` 删项语义的自然延续）∥ 重复键**后行胜** ∥ 全空 ⇒ 该字段删除（config 键缺席——沿 `src/config-mcp.mjs:28 ∥ :54-56` 判）。
回显 = 存储对象 `Object.entries` 序；**值 = 字面**（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——本批即修「值含逗号即坏」）；旧串式的成对引号剥离退场（行式下引号 = 正文字符，非语法记号）。
粘贴 = **零解析**（不引「按换行分行」等隐式解析——取舍 = 批档 §2 KD-4）；值格 = 单行 `input`（**值内换行不可录入**——边界明示）。落盘形零改（`env` ∥ `headers` 仍为对象；载荷仍 `{name, config}`）；桌面逐元素同形（`docs/desktop/design/SETTINGS.md` §2.17 ∥ §1 KD-76）。

**装配面第二源（2026-09-30 · 台账 #701）**：MCP **装配面**（`thincoder-vscode/src/extension/panel-turn-loop.mjs` ro 载荷——实施落点）另并项目根 `.mcp.json`——单层发现（`join(cwd, ".mcp.json")`）· 零交互信任 · config 同名优先 ∕ 异名追加（机制单源 = `doc:MCP.md:§6.4`）；**管理面**（本节列表 ∕ 增删改 ∕ 重连 ∕ 探活）仍 config 单源（`.mcp.json` 源不进管理列表——沿 CLI `/mcp` 口径）。

**MCP 警告消费（2026-10-04 · 台账 #823）**：装配失败（死 server）不再静默——装配面出参 `warnings` 入 `agent._mcpWarnings`，装配尾转提醒入 `agent._pendingReminders`
（下一条 user 消息注入；首两段逐字同 CLI；末行 = 本端可达出口「设置面 MCP 段 Reconnect」；同指纹不重推；零警告零写）。机制单源 = `doc:MCP.md:§6.4`；
实现落点 = `thincoder-vscode/src/agent/setup.mjs` ∥ `thincoder-vscode/src/agent/tool-table.mjs` ∥ `thincoder-vscode/src/agent/setup-reminders.mjs`。
可见面 = 会话内系统提醒（零新 UI ∥ 零新词键——沿 KD-70 ④ 同判；决策全文 = 批档 `docs/batches/2026-10-04-issue-fix-round3.md` §2）。

### 2.5 语义索引（校验可见面）

embedding key + 构建按钮 + 状态；向量维度 / 模型切换的校验与可见面归 `MEMORY（VSC 侧）` §4（索引有效性面）——
状态行在不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」（`settings.indexMismatch`），提示面同源扩展。

**P1 读数扩面（2026-10-02 · 桌面 UX 收尾批 · 台账 #697）**：`pushIndexStatus` 载荷扩两键——`dbBytes`（库文件字节数）∥ `origins`（逐 origin code ∥ doc 行数）。
  取值 = 核只读出口 `memoryStatus()` 回执透传（单源——不另造 SQL；`thincoder-vscode/src/extension/panel-index.mjs:47-61` → 载荷 `{built, files, chunks, dbBytes, origins, hasEmbedder}`）；
  `#index-status` 区增两读（库大小 + 逐 origin 行数；**词键 ∥ 形 = 实施定形**——词键 = `settings.indexDbSize`（整行模板：`Database size: ${size}` ∕ `库大小：${size}`）∥ `settings.indexOriginCounts`（计数片段：`code ${code} · doc ${doc}` ∕ `代码 ${code} · 文档 ${doc}`——两语两面同值）；形 = `#index-db-size` ∥ `#index-origins` 两读——缺位 ⇒ 隐藏（零假造））；
  刷新拍 = 既有推送时点（打开 ∥ 构建后 `pushIndexStatus`——零新通道）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-69**。

### 2.6 配置路径字段 `~` 展开（端差面）

- **机制单源** = `docs/core/design/MEMORY.md` §6.7（家目录展开——单一规范化点 / 只读归一）。本档**不重述机制**，只登记 VSC 端的事实与端差。
- **VSC 端事实**：本端仅 `shell` 字段同病（无 `memory.dbPath` / `projectDir` / `team.dir` 对位）。
  - 归一落点 = **读取点展开**：`thincoder-vscode/src/agent/setup.mjs:130`（`cfgShell = … expandHome(raw.shell) : null`）。
  - 消费端 `thincoder-vscode/src/tools/shell.mjs:229`（`exec`）**零改**；展开器 = 核 `thincoder-core/expand-home.mjs:11`（`expandHome`——W4 已迁核，端自持镜像已删）。
- **只读归一**：磁盘原文保留（不写回）；面板与 `settings` 工具写面不展开（运行时当次展开缺口 = 已知限制，见 §3）。

### 2.7 外部写感知（config.json 事件驱动刷新）

`~/.thincoder/config.json` 为两产品共享单文件；外部写（对端 `/advisor` · `settings set` · 手工编辑）在面板常开时须**可见**。

**契约**：`startConfigWatch({ onChange, debounceMs = 300, configPath }) → { dispose, noteSelfWrite }`
（端壳 = `thincoder-vscode/src/extension/config-watch.mjs`（**36**——平台落子：`createFileSystemWatcher` 订阅 + `dispose` 桥）；**纯逻辑已上提核** = `thincoder-core/config-watch.mjs`（去抖 ∕ stat 元组比对 ∕ 自写抑制——R8 · 桌面功能对位批）：

- 注册 `createFileSystemWatcher(new RelativePattern(Uri.file(dirname(configPath)), basename(configPath)))`，监听 change / create / delete 三类事件；`configPath` 缺省 = `config-io` 的 `_configPath()` 当前值（W16 已迁核——现体 = 核 `thincoder-core/config-io.mjs`）。
- 事件 → 去抖（`debounceMs`）→ **stat 元组（mtimeMs + size）与基线比对**：同 → 零推送；异 → `onChange()`（比对后基线更新为当前元组）；启动时基线 = 启动时 stat。
- **自写抑制（基线回填）**：`noteSelfWrite()` = 重取当前元组置为基线（核 `thincoder-core/config-watch.mjs`——R8 上提后住核；VSC 壳同名转口）；
  时机 = 本进程写盘成功后——`saveRaw`（核 `thincoder-core/config-io.mjs`——写盘唯一通道；W16 已迁核，端自持镜像 `thincoder-vscode/src/config-io.mjs` 已删）在写成功路径上经 `onConfigSelfWrite(fn)`（核同档 `:107`）同步回调，`startConfigWatch` 内部订阅（退订随 `dispose`）。
  ⇒ 扩展自写 = 事件到达时元组已等于基线 ⇒ **零推送**（不抖动面板）；外部写 = 元组异于基线 ⇒ `onChange()`。
- `dispose()` 释放 watcher 与挂起定时器（含自写订阅退订）。
- **降级**：宿主 API 缺失或构造抛错 → 返回 no-op `{ dispose(){}, noteSelfWrite(){} }`（不阻断激活——面板打开拉新的既有路径兜底）。

**装配**：`extension.mjs` 的 activate 内把 `startConfigWatch({ onChange: … })`（定义 = 核 `thincoder-core/config-watch.mjs`——R8 上提；VSC 壳 `thincoder-vscode/src/extension/config-watch.mjs` 同名转口）
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
| `updateProxySettings` | `#px-uri` / `#px-web` / `#px-model` | 按快照覆写屏值；**跳过聚焦中的控件** |
| `updateShellCandidates` | `#sh-select` 选项表与选中项 / `#sh-custom` 值 | 按快照覆写（**回显式 = §2.9「回显全表达式」**）；**跳过聚焦中的控件** |
| `updateWebsearchSettings` | `#row-websearch` 行（状态词 + 按钮组） | 整行重绘（行内零输入控件 ⇒ 零丢失面） |
| `updateIndexStatus` | `#index-status` 文本 + 构建钮态 + `#row-embed` 键行 | 纯函数重绘（同上） |

- 「跳过聚焦中的控件」= 回填与用户输入**互不覆盖**的最小规则：用户正在改的控件不被推送拍平。
- 回填函数须在**极简 DOM 桩**下可跑（既有冒烟档以桩驱动全量消费函数——零新增 DOM 假设）。

**写值纪律（F-W10——防静默清除）**——代理 / Shell 控件 = change-to-save，但**发值判据两条**（缺一不发）：

1. **基线判据**：屏值 ≠ 基线值才发值；**基线 = 该控件最后一次被写入控件的值**（= 其屏值来源：建面渲染写入 / 回填写入 / 用户编辑写入），**不是** SS 快照字段的实时派生。
   - **建面**：渲染值写入 ⇒ 基线 = 渲染值（快照在场 = 快照字段；缺席 = 渲染默认——与渲染器同一表达式）。
   - **回填**：写入即更新基线；**跳过聚焦中的控件（规则见上表）⇒ 零写入 ⇒ 基线冻结于该控件现屏值**——不随 SS 前移。
   - **未被编辑的 change（blur / Enter 未改值）⇒ 屏值 = 基线 ⇒ 零发值**；含「推送被跳过（聚焦中）+ 随后未改值」一格——**旧屏值零回写**（判别用例 = `settings-empty-no-write.test.mjs` W10-6；W9-5 覆盖「随后确改值」侧）。
   - **发值后**：基线 ← 本次屏值（同值 change 连发 ⇒ 恰 1 次 post——幂等门）。
   - 「快照未达」因此不再构成数据丢失路径。
2. **逐字段载荷判据**：payload **只含本次被编辑字段**——绝不携其余控件的渲染值 / 默认值。
   宿主既有部分载荷语义（`uri` 缺席 ⇒ 保留磁盘 uri；`web` / `model` 缺席 ⇒ 保留磁盘值）由此成为安全网：未被触碰的字段**永不被写**（含默认值物化）。

**「空 / null ⇒ 删除」路径册（F-W10 ③——逐条 + 判据）**：

| # | 删除路径 | 触发（显式用户动作） | 判据 |
|---|---|---|---|
| 1 | 代理整块（宿主删 `proxy` 键） | `#px-uri` 清空 + change（屏值 `""` ≠ 基线） | 未编辑 ⇒ 零发值；显式清空 ⇒ payload 恰含 `uri:""` ⇒ 宿主删键 |
| 2 | Shell 键（宿主删 `shell` 键） | `#sh-select` 选 `System default`（值 `""`） | payload 恰含 `value:""` ⇒ 宿主删键（CLI `/shell reset` 同义） |
| 3 | `#sh-custom` 清空 | **无**（空自定义路径 = 未完成输入，不发值） | change 且值为空 ⇒ 零发值 + 控件按快照**就地回显**（回显式 = §2.9「回显全表达式」） |
| 4 | agent 卡 `null` 清空 · poolLimits 逐键 · 元素缺席形态 | —— | 本批登记不修——消解路径 + 到期条件 = `requirements/WEBVIEW.md` 在册（P2-3 / P2-4） |

- **extension 侧删除语义零改**（空 uri ⇒ 删键 · 空 shell 值 ⇒ 删键——`thincoder-vscode/src/extension/settings.mjs:231` 与 `thincoder-vscode/src/extension/settings-panel-write.mjs:180`）——本批只把「触发」收紧到显式用户动作。

- **路径册 #1 子路径（边界——登记不修）**：磁盘**无** `proxy.uri` 时勾 `#px-web` / `#px-model` ⇒ change 发 `{web:true}` / `{model:true}`（无 `uri` 键），
  而宿主 `!uri` 即 `delete raw.proxy; return`（`thincoder-vscode/src/extension/settings.mjs:231`）⇒ **零落盘**；
  发射路径仍 `flashSaved(...)`（`thincoder-vscode/webview/settings-env.js:115`）⇒ 可见态（「已保存」）与磁盘不一致——`!uri` 早退是显式删键语义的副作用，不是静默清除。消解路径 + 到期条件见 §3 残留登记。

**机检面**：本节的用例资产 = `thincoder-vscode/test/settings-open-snapshots.test.mjs` · `thincoder-vscode/test/settings-empty-no-write.test.mjs` · `thincoder-vscode/test/settings-refill.test.mjs`——三条先红后绿在册（`requirements/WEBVIEW.md` N-W8）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
机检对账 = `thincoder-vscode/test/protocol-coverage-reverse.test.mjs`（发面表 = `WEBVIEW-PROTOCOL.md` §13）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

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

- 候选表（System default + 平台检测项）与拉取面（`getShellCandidates`）本批零改；回填 = `updateShellCandidates`（规则见 §2.8），写后轻量推送到达即回显新值（写盘与回显同一轮闭环）。

- **回显全表达式**（`#sh-select` / `#sh-custom` 的回填与就地回显 = **同一式**，与渲染器同源——`thincoder-vscode/webview/settings-env.js:25-31`）：
  `current` **匹配候选**（按值相等——含 `System default` 候选的 `value:null` 对 `current:null`）⇒ `#sh-select` 回到该候选（选中）+ `#sh-custom` 清空；
  **无匹配** ⇒ `#sh-select` 置 `__custom__` + `#sh-custom` = `current`。
  适用面 = 建面渲染 · 推送回填（§2.8 回填表——跳过聚焦中的控件）· §2.8 路径册 #3 的就地回显。

### 2.10 不可复得类删除二次确认（F-W17——P5 判据判对）

**类判据（本节的单源判据句）**——删除入口按「**删除是否使不可复得的原文随之消失**」二分类：

- **不可复得类**（删除使**凭证原文**随条目一并消失——密钥 / 令牌 / headers 等；界面不显原文或只显掩码，用户无法自行重填复原，只能回服务商重取 / 重发）⇒ **必过一次显式确认** = `window._confirmSecretDelete(btn, action)`；
- **可重填类**（删除仅使**可由用户重填的配置**消失——条目可重加、字段值可再输入）⇒ `window._confirmDelete(btn, action)` 直通（`thincoder-vscode/webview/settings.js:44`）——**本类现为空域**（入口册零实例；直通门零调用点——「本批后态」见下）；
- **入口册全数判入不可复得类（2026-09-19 收正）**：provider 行 − **随用户 08:11 裁定 A 判入本门**——删整条时其 `apiKey` 原文随条目一并消失（写入 = `thincoder-core/config-io.mjs:201-208` · 删条目的整条 filter = `:262-277`）。
  该行**不满足「可重填」前提**：重填 URL / 名**不恢复** key 原文，只能回服务商重取——原「重填 URL/名即可逆」的理由**被 `apiKey` 事实推翻**（用户 2026-09-19 08:11 逐字「**A，也入。**」）。

**本批后态（唯一门）**：入口册 1–6 **全数**走 `_confirmSecretDelete`；门调用点 **6 处**（入口册 6 行 1:1）——`webview/settings-tools.js:46`（入口 1）· `:28`（入口 2）· `webview/settings-providers.js:57`（入口 3）·
`:68`（入口 4）· `webview/settings-tools.js:196`（入口 5）· `webview/input.js:125`（入口 6——**经 hook 链路**：核 footer `onClick` ⇒ `hooks.confirmRemoveProvider` ⇒ 本桥调门）。
`window._confirmDelete`（`thincoder-vscode/webview/settings.js:44`——**保留门**）**零调用点**（结构对账 W17-17 钉住）⇒ 全数删除入口**唯一通道 = 确认门**。
`_confirmDelete` 的**定义仍在**（`:44`——保留门）；注释随本批收正（`:42-43` 失实分句退场 · `:45-48` 不可复得类枚举补 provider 行——**落 ① 已执行**，见 §3 登记条）；`test/smoke-settings.mjs:95` 的 handler 在位断言照绿。
新增删除入口一律按上二分类判：本批后域内不存在直通调用点 ⇒ 误入直通即结构对账点名（fail-closed）。

P5 原文（`thincoder-vscode/docs/design/_archive/SETTINGS-REORG.md:12`）=「**可逆**删除（provider/MCP/key 都能重加）单击即删；**不可逆才弹确认**」——不可复得类**不满足其可逆前提** ⇒ 本节 = 把该判据**判对**（**不并入「撤销机制」**：用户 2026-09-18 21:07 口径——撤销属加机器，不取）。
**MCP 行改判（2026-09-18 22:21 用户逐字「mcp 删除那个还是要确认一下好」）**：入口册 #5（MCP server 行 ✕）判入**不可复得类**——理由 = **删整条时其 token / headers 一并消失、原文不可复得**（同 `thincoder-vscode/src/config-mcp.mjs:52-54` 语义）。归类按**入口整体**（不按 transport 分叉：stdio 条目虽无 token，但行内不显凭证在场与否 ⇒ 分叉须新可见面 + 两分支两判据）。
**provider 行改判（2026-09-19 08:11 用户逐字「A，也入。」）**：入口册 #4（provider 行 −）判入同一类——理由 = 删整条时其 `apiKey` 原文随条目消失（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter；判据句见上）。
**需求侧对位（同源映射——供三链对账）**：需求档 F-W17 判据句（2026-09-19 收正：「**所有删除入口**（密钥 / 令牌 / MCP 行 / provider 行）均须过一次显式确认——「单击即删」类已空域」）≙ 设计档「不可复得类」= 入口册 1–6 **全数**。
入口 6（模型菜单 footer）的**需求档册行 = 待父侧补**（父侧笔；本批 = `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md` §1.3 ③）——本档册行与判据域已先行落地，差集登记 = 批档 §2.8。
需求侧「非密钥类」措辞**随 08:11 裁定退场**（需求档同笔已收正）；两侧的「可重填 / 单击即删」类**同为空域**（本档侧 = 直通门零调用点——见上「本批后态」）。
两门并存（而非单门加 flag）：缺省值必须选一侧，单门 + `secret` 布尔 ⇒ 漏标即直通（fail-open）；两门则**类判据写在调用点**（名字即类），漏标由结构对账用例 fail-closed 点名（用例 = 批档 §2.4 W17-17）。
**本批后态**：可重填类空域 ⇒ 直通门零调用点；结构对账的判据改为「域内删除入口发射 5 名全落确认门实参内 ∧ `_confirmDelete(` 调用点 = 0」——空域被机检**钉住**（未来新增可重填类入口而误用直通即红，不靠约定）。

**入口册（D3——计数与清单同改）**：

| # | 入口 | 载体（as-of 2026-09-19 · provider 行批实读） | 类 | 删除消息 |
|---|---|---|---|---|
| 1 | Web Search key ✕ | `webview/settings-tools.js:273`（`websearchRowHtml()` 的 ✕ 生成位）→ handler `:45-47` | 不可复得类 | `deleteWebsearchKey` |
| 2 | 嵌入 key ✕（Semantic Index） | `webview/settings-tools.js:286`（`embedRowHtml()` 的 ✕ 生成位）→ handler `:27-29` | 不可复得类 | `deleteEmbedKey` |
| 3 | provider key | `webview/settings-providers.js:56-58`（`window._delKey`）——**现无 UI 载体**（承归档决策：UI 不再暴露「只删 key 留条目」的入口、协议保留不删——`thincoder-vscode/docs/design/_archive/SETTINGS-PANEL.md` D2） | 不可复得类 | `deleteProviderKey` |
| 4 | provider 行 −（删整条） | `webview/settings-providers.js:182`（卡 HTML——本批改 `data-name` 承载 + 卡级装配位 `bindAddProviderForm()` 绑 `addEventListener`）+ 编辑行取消重建位 `:48-49`（**零改**） | 不可复得类（**本批改判**） | `removeProvider` |
| 5 | MCP server 行 ✕ | `webview/settings-tools.js:187` 生成 / `:191-195` 绑定 | 不可复得类（**本批改判**） | `deleteMcpServer` |
| 6 | 模型菜单 footer「− Remove provider…」 | `thincoder-render-core/composer/model-menu.mjs:304`（footer 三入口 = 同档 `:302-307`；渲染位 = 同档 `:106-116`） | 不可复得类（**本批新增**） | `removeProvider`（**无 `name`**——目标由宿主 QuickPick 选定） |

- 行 1–3 类名收正为「不可复得类」（原「密钥类」——同判据、类名按可复得性重述）；行 2 / 3 的载体与 handler 逐字未动。
- **行 5 改判（2026-09-18 MCP 批）**：改动 = 绑定位**门名** + **载荷闭包**（生成位 `:187` 逐字零改）；判据 = 批档 §2.4 W17-16 / W17-19。
- **行 4 本批改判入本门（2026-09-19）**：理由 = 删整条时 `apiKey` 原文随条目消失（`thincoder-core/config-io.mjs:201-208` 写 / `:262-277` 整条 filter）⇒ 不可复得（用户 08:11 裁定 A）。
  零回归锚 = `_confirmDelete` 调用点**收敛为 0**（入口册 1–6 行全数过门）；判据 = 批档 §2.4 W17-14 / W17-15 / W17-26…W17-30。
- **行 4 的载体改动（本批 · 两处）**：见下「provider 行载体」段——`_removeProvider` 只改**门名**（动作体 / 消息名 / 载荷逐字不变）。
- **行 6 本批入集（2026-09-19 模型菜单批）**：`removeProvider` 的**第二载体**（行 4 = settings 面板 provider 行 −，已收口）；判据 = 同一「不可复得」判据句——删整条时其 `apiKey` 原文随条目一并消失（写入 = `thincoder-core/config-io.mjs:201-208` · 整条 filter = `:262-277`，与行 4 同源）。
  门位 = **webview 侧调用点**（同档 `:25` 动作闭包过 `_confirmSecretDelete`）——选型理由见下「模型菜单入口」段；判据 = 批档 §2.4 的 W17-31…W17-34。
  **宿主侧链（本席实读 as-of 2026-09-19）**：路由 = `src/extension/panel-messages.mjs:280`（`case "removeProvider"`）；
  处理器 = `src/extension/panel-messages-settings.mjs:82-90`（`msg.name` 有 ⇒ 直落 `persistRemoveProvider`；**无 ⇒ `:88` `removeProviderFlow`**）；
  QuickPick 面 = 核 `thincoder-core/provider-flows.mjs` `removeProviderFlow`（parity-b4 迁移改指——VSC `provider-flows.mjs` 薄壳转口；候选 = 非 active 过滤 · 空集早退 · `showQuickPick`〔`ui.pick`〕· 取消早退 `if (!sel) return` · 删 `removeProviderEntry(sel.label)`）。
  渲染位与门位的先后（**本门前提**）：footer 行的 click 处理器（`thincoder-render-core/composer/model-menu.mjs:114`）=「先 `closeModelMenu()`、后调 `f.onClick()`」⇒ 弹框开在菜单 overlay 移除**之后**（弹框 `.auto-confirm` z-index 1000 / 遮罩 999——与 `mm-overlay` 1000 同层，无菜单在场即无遮挡）。
- **MCP token / headers 无独立删除钮**：其唯一删除路径 = 编辑表单清空 token / headers 后保存（**表单语义，非删除按钮**——`thincoder-vscode/src/config-mcp.mjs:52-54` 的 `if (cfg.token)` / `if (cfg.headers)`：条目重建时字段随之消失）；
  webview 侧 = `webview/settings-tools.js:117-136` 读表单（stdio / http / ws 三分支）→ `:138` 发 `editMcp` / `saveMcpServer`。
  处置 = **已裁**（父侧 2026-09-18 22:13 裁定 ③：表单清空保存**不算「删除按钮」判据域** ⇒ 维持登记——出处 = `docs/vsc/requirements/WEBVIEW.md` 变更记录 22:1x 条）；**本批不动表单语义**。

**确认形态 = 面板内轻量确认弹框**（否决「行内二次点击」——否决理由四条）：

1. **行内「已武装」态无稳定宿主**：键行被推送**整行重绘**——
   `renderKeyRow`（`webview/settings-tools.js:305-315`——消费位 = `updateWebsearchSettings`（`:317-320`）/ `renderIndexStatus`（`:327-347`））·
   `renderProvidersCard`（`webview/settings-providers.js:237-242`）· `renderMcpList`（`webview/settings-tools.js:165-227`）；
   外部写盘还经 §2.7 事件驱动推轻量快照 ⇒ 武装态存于 DOM 时会被重绘抹掉：第二击落空，或退化为「重新武装」
   （若把态另存模块变量 + 重绘重贴 = 新机制）。
2. **取消路径须第三方机制**：武装态要么定时回退（定时器——即 P5 明令删除的「2.5s 两段定时」形态），要么只靠失焦 / 点别处兜底（无显式取消面、「行内状态复原」无判据）。
3. **行布局**：`✕` 是键行单行 flex 内的字形钮（`.key-btn.del-key`，`thincoder-vscode/webview/settings.css`）——换成「确认删除？」破行布局；且「原文不可复得、只能回服务商重取」的理由文案在行内**无容身之处**。
4. **同族一致 + 同词**：不可逆删除在本仓已有同形先例 = 会话删除确认（`webview/session-bar.js:75-107`）与 AUTO 启用确认（`webview/mode-buttons.js:54-92`），均用同一弹框件；P5 原文亦为「不可逆才**弹**确认」。

**弹框契约（本面单源 = `webview/settings-widgets.js`——`showConfirmPopover({ text, yesLabel, noLabel, onConfirm })` + 同档导出的**清除入口**）**：

- **件 = 既有形态**：`.auto-confirm`（`role="alertdialog"`）+ `.auto-backdrop`（`thincoder-render-core/composer/composer.css:407-483`）——**零新增 CSS**；`z-index` 1000 > 设置面板 `20`（`thincoder-vscode/webview/settings.css:7`）⇒ 恒在面板之上。
- **挂位 = `document.body`**（不在键行内）⇒ 键行重绘**不打断**确认在位态。
- **载荷闭包**：确认动作 = **开框时捕获**的 payload 闭包（不是确认时读 DOM）⇒ 弹框在位期间的行重绘**不改删除目标**、不吞确认。
  **判别面明示（评审 id=116 发现 9）**：**W17-23 判「在位不打断 / 不改目标」，不判闭包形态**——`renderMcpList` 走 `list.innerHTML = …` 整表重建（`thincoder-vscode/webview/settings-tools.js:173-190`），旧钮节点脱离 DOM 后 `dataset.name` 仍为原名 ⇒ 「确认时读 DOM」与「开框时捕获」在该场景**载荷同值**；闭包形态由代码面复核守（批档 §2.2 D-M4），不以该例为判据。
- **单例**：开框前清既有 `.auto-confirm` / `.auto-backdrop`（**经同档导出的同一清除入口**——全局同名单例，与既有两处同规）⇒ 跨入口连开只剩一个框，框内动作只对应**最后一次**开框的入口。
- **安全默认**：开框后焦点落「取消」（`setTimeout(..., 50)`——同既有两处）。
- **连点护栏**：「删除」钮的 click 处理对 `e.detail > 1`（双击第二击）零动作——防「第二击恰好落在删除钮」的误确认。
- **文案**：正文键 = `settings.secretDeleteConfirm`（双语在册——`locales/en.json:184` / `locales/zh.json:184`）；钮文案复用既有键（跨面复用已有先例——会话删除确认用 `question.cancel`）：确认 = `session.delete`、取消 = `question.cancel`。
  **本批重述为类通用式（父侧 2026-09-18 裁定 · 评审 id=116 发现 5 的 ② 案）**：原措辞按密钥类写就（「该密钥」·「界面只显示 ****」），对 MCP 行两处不成立（列表行无掩码位、删除目标 = 整条 server 条目）⇒ **值级改写 · 键数不变 · 键名不动**——三类入口（密钥 / 嵌入 key / MCP 整条）陈述均成立。改写值（实现轮逐字落盘）：
  - zh（`locales/zh.json:184`）：`确定删除？删除后无法恢复——凭证原文不可复得，只能重新配置或回服务商重取。`
  - en（`locales/en.json:184`）：`Delete? This cannot be undone — the original credential cannot be recovered; you would have to reconfigure it or get a new one from the provider.`
  **净增文案键 = 0 · 键数不变**（两档 259 ±0 行 · 键名与其余键零改）；判据 = AC-FW17B-6（值级改写 · 键数不变——非「`git diff locales` 空」）。

**取消路径（四条 · 均零发值 ∧ 行内状态复原）**：

| # | 取消动作 | 判据 | 入口级覆盖（用例） |
|---|---|---|---|
| 1 | 点「取消」钮 | 零删除消息；弹框 + 遮罩移除；**不触碰键行 DOM**（行内状态复原 = 从未改变——`outerHTML` 逐字同） | MCP 入口 = W17-20（含行内 `outerHTML` 逐字复原）；provider 入口 = W17-27（含行 `outerHTML` 逐字复原）；密钥类 = W17-5；模型菜单入口 = W17-33（含端到端反证：取消 ⇒ 宿主零调用 ∧ `config.json` 逐字节不变） |
| 2 | 点遮罩（`.auto-backdrop`） | 同上 | **件内共享路径**——处理器在弹框件（`webview/settings-widgets.js:80`），入口侧零专属代码 ⇒ 覆盖 = W17-6（密钥类批 · 同一件）；MCP 入口不另设例 |
| 3 | 弹框内 Escape | 同上；**弹框内 keydown 拦截 `stopPropagation`** ⇒ 不连带执行 `webview/chat.js:90-102` 的「关设置面板」分支（面板保持打开） | 同上——件内共享路径（`webview/settings-widgets.js:97-101`）⇒ 覆盖 = W17-7；MCP 入口不另设例 |
| 4 | 关面板（`#settings-close` / 外部 `closeSettings()`） | 同上——`closeSettings()`（`webview/settings.js:163-172`——清除调用位 `:167`）**经同档导出的同一清除入口**清弹框与遮罩（零发值） | MCP 入口 = W17-21；provider 入口 = W17-28；密钥类 = W17-8；模型菜单入口**不适用**（设置面板不参与本路径——见下「逐入口完备性」） |

- **行 4 的弹框 DOM 触点收敛为 1**（**收敛域 = 设置面档** `webview/settings*.js`：开框前单例清理 · 框内三条取消 · 关面板同此入口；域外 `webview/chat.js:103-104` 的既有 Escape 清除面 = 零改面，不在本收敛域）。

**逐入口完备性（明示 · 评审 id=116 发现 10）**：入口**专属**的取消形态 = #1（行内状态复原）与 #4（`closeSettings()` 同清）⇒ 各入口各持专属例（MCP 入口 = W17-20 / W17-21；provider 入口 = W17-27 / W17-28）；
#2 / #3 的处理器在**弹框件内**（遮罩 click `webview/settings-widgets.js:80` · 框内 keydown `:97-101`），入口侧零专属代码 ⇒ 由密钥类批在**同一件**上的 W17-6 / W17-7 等价覆盖（同一件 = 同一判据；两条路径上无入口差量）。**不按「逐入口 × 四条路径全列出例」读。**
**入口 6（模型菜单 footer）的专属形态 = 无 #1 的「行内复原」型态**：菜单在开框**之前**已由 `thincoder-render-core/composer/model-menu.mjs:114` 关闭（`closeModelMenu()`）⇒ 无行内状态可复原；设置面板不参与本路径 ⇒ 路径 #4 不适用。
其专属例 = W17-33（取消 ⇒ 零发值 ∧ 宿主零调用 ∧ 框 / 幕移除 ∧ `.mm-overlay` 零在场——菜单不复活）；#2 / #3 同件等价覆盖（W17-6 / W17-7）。
另：目标选定步（宿主 QuickPick）的取消 = **独立一步**（非本弹框的取消路径）——其零删除判据 = W17-34（恒绿锚）。

**协议零增 / 宿主零改**：确认是 **webview 侧门**（确认动作内才 `postMessage`）⇒ 消息名与载荷零增（`WEBVIEW-PROTOCOL.md` §13 判别式集与 ④ 处置列不变），宿主删除语义（`thincoder-vscode/src/extension/settings.mjs` · `thincoder-vscode/src/extension/settings-panel-write.mjs`）**零改**。

**载体绑定（密钥行两个控件：行内 `onclick` → `addEventListener`）**：两处密钥行的钮改由 `renderKeyRow(id, html, { skipWhileEditing })`（`webview/settings-tools.js:305-315`——渲染 + 绑定的**单点**；第三参 = 守卫开关，两处 `onCancel` 重建时显式置 `false`）装配——
**绑定范围 = 该行的两个控件**：编辑钮（`[Change]`；空态为同位的 `[Add]`——同一 `.key-btn` 位）与删除钮 `✕`（`.del-key`）——两者**一并**落在该单点（行内属性绑定同步摘除）。
重绘三处（`renderKeyRow` 守卫路径 + 两处 `keyRowEdit` 的 `onCancel` 重建位——原为手写 `outerHTML` 重建，现同经该单点——`webview/settings-tools.js:22` / `:40`）收敛到该单点。
理由：① 同族 MCP 行（`renderMcpList` 的 `:191-195`）已用 `addEventListener` ⇒ 绑定形态归一；
② 行内属性绑定在测试夹具（happy-dom）下**不可驱动**（实测：`typeof el.onclick === "object"` ∧ `.click()` 零触发）
⇒「点击 ✕ ⇒ 不出删除」这一判据句的**动作面**无法机判，`[Change]` 侧同理（W17-18——同一夹具障碍、同一绑定动作覆盖）。
**provider 行卡载体本批同改**（`settings-providers.js:182`——同一障碍、同一处置；见下「provider 行载体」段）· **编辑行取消重建位**（`:48-49`）本就不属行内属性形态（零改）。

**MCP 行载体（2026-09-18 MCP 批 · 两处）**——生成位 `webview/settings-tools.js:187`（`.mcp-del-btn` 的钮字面）**逐字零改**；
绑定位 `:191-195`（`renderMcpList` 内「每钮 `addEventListener`」）改**门名**（`window._confirmDelete` → `window._confirmSecretDelete`）
+ **载荷闭包改为开框时捕获**（`const name = btn.dataset.name` 于 click 时取值；闭包只发 `{type:"deleteMcpServer", name}`）——
对齐本节「载荷闭包」条（确认期间的行重绘不改删除目标、不吞确认）。
绑定形态（`addEventListener`）**零改**：MCP 行本不在 `renderKeyRow` 单点装配域内，本批**不并入**（并入 = 越本批目的的结构改动）。

**provider 行载体（2026-09-19 provider 行批改判 · 两处）**：
① **卡 HTML 载体** `webview/settings-providers.js:182`——− 钮的载体由行内 `onclick="window._removeProvider('…', this)"` 改为 `data-name="${escHtml(name)}"`（类名 `key-btn del-key` / 激活行的 `disabled` / `title` / 钮字面 `−` 零改），
   绑定移至**卡级装配位** `bindAddProviderForm()`（两条建面路径的共同单点——`thincoder-vscode/webview/settings.js:181`（整面建）· `webview/settings-providers.js:241`（卡就地重建））：`const name = btn.dataset.name` → `window._removeProvider(name, btn)`（载荷 = **开框时捕获**）。
② **编辑行取消重建位** `webview/settings-providers.js:48-49`（`_editKey` 的 `onCancel` 重建的 − 钮）：**零改**——本已是 `addEventListener`，其目标 `name` 于 click 时取自闭包（载荷天然开框时捕获）。
两处汇入 `_removeProvider`（`:64-66`）——本批只改该件的**门名**（`window._confirmDelete` → `window._confirmSecretDelete`）：动作闭包与消息名逐字不变；其调用点 = 2（两载体；全树无其它引用）。
**载体形态改判理由（同密钥行先例两条）**：① 行内属性绑定在测试夹具（happy-dom）下**不可驱动**（设计轮实测：对 − 钮 `.click()` ⇒ 零事件；`typeof el.onclick === "object"`）⇒「点击 − ⇒ 不即发 / 确认 ⇒ 发」这一判据句的动作面**无法机判**；② 同族形态归一（密钥行 / MCP 行皆 `addEventListener`）。

**模型菜单入口（2026-09-19 模型菜单批 · 入口 6 · 门位 = webview 侧调用点）**：

**载体与改动（单点）**：`thincoder-render-core/composer/model-menu.mjs:304` 的 footer 项 `onClick` = **hook 注入式**——
`onClick: () => hooks.confirmRemoveProvider?.(() => post("removeProvider"))`（消息名与载荷**逐字不变**：`{ type: "removeProvider" }`，**无 `name`**）；
门调用落点 = VSC 桥 `webview/input.js:125`（`composerHooks.confirmRemoveProvider` 绑定——`window._confirmSecretDelete(null, onConfirm)`），OUT 桥 = `webview/input.js:33`（出站表 `removeProvider` 逐字面）。
**门位选型（三案取舍——批档 §1.3 ① 枚举 a / b / c，本档取 c 案）**：

- **取 c 案理由 = 与入口 1–5 同门同件**：`_confirmSecretDelete`（`webview/settings.js:50-57`）是本节类判据句的唯一映射件 ⇒ 入口 6 与 1–5 **同一门 / 同一弹框件 / 同四条取消路径**——「确认件单源」原则**强化**（不新增确认形态）。
- **否决 a 案（宿主 QuickPick 选定后二次确认）**：宿主侧确认只能落在 VS Code 原生件（`showWarningMessage` modal / 二次 QuickPick）⇒ **第二套确认面**，类判据句「不可复得类 ⇒ `_confirmSecretDelete`」的字面映射失效（要么改判据句 = 语义面、要么再登记一次「受裁例外」）；
  且第一跳 `removeProvider` 在确认**前**已发出 ⇒ 批档 §1.3 ②「取消 ⇒ 零删除 ∧ **零消息副作用**」只在宽松读法（无持久副作用）下成立。
- **否决 b 案（宿主把选定 `name` 回给 webview 走既有弹框）**：需新增宿主→webview 消息 + webview 侧新 case ⇒ **协议零改**（批档 §1.5 ③）破 + `WEBVIEW-PROTOCOL.md` §13 判别式集须同步（写域外）；且同 a 案的第一跳问题。
- **否决第三备选（webview 侧自建目标选择面）**：目标候选规则单源在核 `thincoder-core/provider-flows.mjs`（VSC `provider-flows.mjs` 薄壳转口——parity-b4 迁移改指；非 active 过滤 / `model` 描述 / 空集提示）⇒ webview 自建 = 候选语义**双源**（D2 破 + 两侧候选不一致的 fail-open 风险）；本批不替换目标选择面。
- **c 案的机检侧优势**：门在 **post 之前** ⇒ 「取消 ⇒ 零发值」**严格读成立**（宿主零调用、盘面逐字节不变）；且入口 6 落在 webview 档 ⇒ 结构对账**扩域即钉住**（见下「判据域边界」）。

**已裁代价（登记 = §3）**：确认发生在**目标选定之前**（弹框文案 = 类通用式 `settings.secretDeleteConfirm`，不携 `name`）⇒ 确认的「目标绑定」弱于入口 1–5（后者目标 = 载体自身所在行）。
补偿两条：① 目标选定步（宿主 QuickPick——核 `thincoder-core/provider-flows.mjs`；parity-b4 迁移改指）**自身是一次显式选择**（选定才删）⇒ 不可复得动作实需「确认 + 选定」两步；② 选定后取消仍零删除（核 `thincoder-core/provider-flows.mjs` `if (!sel) return` **零改**）。

**`btn` 实参 = `null`**：`_confirmSecretDelete(btn, action)` 的 `btn` 实现内**未使用**（`webview/settings.js:49` 注：弹框居中、不锚定）；footer 项的 `onClick` 由 `thincoder-render-core/composer/model-menu.mjs:114` 调用时**不传参** ⇒ 无元素可给。
改 `model-menu.js` 传 `e.currentTarget` = 共享件回调契约改动（4 处调用方）而收益为零 ⇒ 取 `null`。
**单点依赖（明示）**：门由 `initSettings()`（`webview/settings.js:25`——经 `webview/chat.js:49` 模块顶调用）安装；本入口与门同处一个 webview 文档（chat 面板）⇒ 点击前门必已安装。
**不取防御式回退**（`window._confirmSecretDelete?.()`）——门缺失须响亮失败；静默降级 = 违批档 §1.3 ②。
**设计轮实读（happy-dom 真模块 · 零仓内写入——读数时点 = 落门前）**：footer 点击 ⇒ 直发消息 `[{"type":"removeProvider"}]` ∧ 弹框 / 遮罩 / 菜单 overlay = `0/0/0`（**无框可依**）；该消息喂回真宿主分发（`showQuickPick` 桩返回 `{label:"kimi"}`）⇒ `_pushSettings` 恰 1 次 ∧ 盘面 `providers` = `["deepseek"]` ∧ `kimi` 的 `apiKey` 原文消失（**「选定即删」实锤**）。
门侧：`_confirmSecretDelete(null, …)` 四条取消路径全零发值 · 确认 ⇒ 恰 1 条 `{type:"removeProvider"}` ∧ 框 / 幕移除 · 单例（连开两框仍 1 框）。

**机检面**：`thincoder-vscode/test/settings-secret-delete-confirm.test.mjs`（W17-1…W17-15 · W17-17 / W17-18 / W17-26…W17-30——正常 / 取消 / 边界（连点 · 跨入口 · 弹框在位重绘 · **多行取目标**）/ 键盘 / i18n 双源 / 结构对账 fail-closed；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
**MCP 组（W17-16 / W17-19…W17-25）已析出** `settings-mcp-delete-confirm.test.mjs`——2026-09-19 拆分实测收正）；
**组拆分登记**（评审 id=116 发现 4）：触发 = 实现轮末实读 **≥ 500 行** ⇒ MCP 组（W17-16 / W17-19…W17-25）析出为 `thincoder-vscode/test/settings-mcp-delete-confirm.test.mjs`（已落 · 实读 **177**——夹具经 `test/helpers/webview-env.mjs` 共享；`thincoder-vscode/test/files.mjs` 同步登记）——组边界 / 阈值 / 到期条件 = §3。 （迁移期引文——档已删）
用例与先红读数单源 = 批档 §2.4（密钥类批 = `docs/batches/2026-09-18-vsc-key-delete-confirm.md` §2.4；MCP 行批 = `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md` §2.4；provider 行批 = `docs/batches/2026-09-19-vsc-provider-delete-confirm.md` §2.4；模型菜单批 = `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md` §2.4）。
**入口 6 组（本批）**：`thincoder-vscode/test/model-menu-delete-confirm.test.mjs`（已落 · 实读 **162**——W17-31…W17-34；登记落 `thincoder-vscode/test/files.mjs`）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
跨面夹具 = happy-dom 真 webview 点击 → 逐条喂回真宿主分发（先例 `test/settings-empty-no-write.test.mjs:86-90`）+ 临时 config（`_setConfigPathForTest`——**绝不触碰真实 `~/.thincoder/`**）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
结构对账 W17-17（域扩至 **9 档**）仍驻主档 `test/settings-secret-delete-confirm.test.mjs`（结构面单源）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**判据域边界（结构对账 W17-17 的扫描域）**：域 = **设置面档**（`thincoder-vscode/webview/settings*.js`——实读 **8 档**）∪ **`thincoder-vscode/webview/input.js`**（入口 6 桥——门调用 ∕ OUT 桥双落位）= **9 档**（扫描式 = 正则 `/^settings.*\.js$/` ∪ 显式名单 `input.js`；域外档一律不入集）。
**计数映射（D3 · 6 行 ↔ 5 名）**：入口册 **6 行** ⇒ 判别名 **5 个**（入口 4 = settings 面板 provider 行 − 与入口 6 = 模型菜单 footer **同名 `removeProvider`**）——`removeProvider` 域内发射 **2 处**（`webview/settings-providers.js:68` · 桥 `webview/input.js:33`——OUT 表逐字面；入口 6 闭包创造位 = 核 `model-menu.mjs:304`——域外面）。
域内删除入口发射 **5 名**（`deleteEmbedKey` · `deleteWebsearchKey` · `deleteProviderKey` · `deleteMcpServer` · `removeProvider`）⇒ **5 名全数过 `_confirmSecretDelete`**（`settings*.js` 五处发射逐处落在门实参内；入口 6 经 hook 桥 `input.js:125` 过门——多载体同名同判）；`_confirmDelete(` 调用点 = **0**（fail-closed：新增直发项 / 未登记入口 ⇒ 红 + 点名）。
域外：`webview/**` 其余删除入口——`deleteSession`（`webview/session-bar.js:131`——非不可复得类、已有自有确认面 `webview/session-bar.js:102-134`、零改）**不属本判据域**。

**范围限制（三层 · 明示 · 评审 id=116 发现 11 + MCP 批代码评审 🔵4）**：本门的识别面 = ① **命名**（扫描名族 = `delete*` ∪ `remove*` 两个删除语族；`clear*` / `reset*` 等族外名不在识别面 ⇒ 该类入口由动作面用例 / 评审兜底）；
② **书写**（只认 `type:` 后的**字面量**串——常量 / 变量 / 拼接书写的发射不被识别）；③ **枚举**（域档 = `readdirSync` 平铺 `settings*.js` ∪ 显式名单 `input.js`，非递归 ⇒ 移入子目录即静默缩域——由档数下限断言兜一道；本批域 **9 档** ⇒ 下限 **≥6**，实现轮按实读定值）。三层之外的新形态入口本门不认（既不静默漏计数，也不越形态）。

### 2.11 Shell 候选拉取异步化（F-W18——推送链有界）

**病根（as-of 2026-09-18）**：`shellCandidates()`（`thincoder-vscode/src/extension/settings.mjs:57-88`）逐个同步探测候选（`:86` `candidates.filter((c) => c.detect())`——探测走同步 `exec`）
+ 进程内 memo（`:53` `_shellCandidatesCache`——现值见本段设计条）⇒ **阻塞宿主事件循环**；面板打开拍 / 请求拍（`panel-messages-settings.mjs:186-187` `handleGetShellCandidates`）落在同一循环上
⇒ 同拍其余快照推送被卡（与 TUI 假死同源：同步 exec 在热路径）。

**设计（F-W18）**：

- 探测改 **async**：`execFile`（非阻塞）+ `Promise.all` 并发候选探测；**在飞去重**（同一时刻的重复请求共享同一 in-flight promise——不叠发探测批）；**进程内 memo 保留**（成功结果缓存，语义与 `:58` 同：进程生命周期内稳定——shell 路径不热变化）。
- **被拒备选**：① 静态「已知路径表」（平台 / 自定义安装漏项——探测语义降级）；② 跨重载持久缓存（陈旧路径 + 首装未探面）。
- **推送序契约零改**：打开拍固定序（`indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings` 末位）在变更后必须原序保持——
  两个推送函数（`_pushSettingsLight` · `_pushIndexStatus`，`thincoder-vscode/src/extension/chat-panel.mjs:331` / `:370`（定义）· `:353`（调用））改 async 后走 await 链；
  逐序断言即验收面（`thincoder-vscode/test/settings-open-snapshots.test.mjs:73-83`）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**F-W18 静默判据的取值方式（三路——「无可观测 ≥ 2 s 静默」如何机判）**：

- **① 静态扫描**：shell 候选探测路径零 `spawnSync` / `execSync`（域 = `settings.mjs` `shellCandidates` 及其调用链）；
- **② 注入式时序断言**（机检形态）：`settings-open-snapshots.test.mjs` 扩——注入带人为延迟的伪探测（同步阻塞面模拟）⇒ 断言打开拍推送链按序到齐且**相邻两拍间隔 < 2 s**；
- **③ 实机读数**（非单测）：扩展宿主日志相邻行时间差扫描——打开拍区间零 ≥ 2 s 静默（读数入批档 §6）。

### 2.12 渠道准入探针：失败分类与有界重试（F-W19）

**载荷（端侧装配）**：VSC 调用点 = `thincoder-vscode/src/extension/provider-probe-window.mjs:71` / `:76`（`recordAdmission` 落账）· `thincoder-vscode/src/extension/settings.mjs:78`（`admissionOf`）→ `:85` / `:89`（渠道项载荷装配）；
字段与分类语义（`failure ∈ {timeout, malformed, hostBusy}` + `ts`）、失败文案零改纪律（`channelUnavailableMessage` 逐字不动）= `PROVIDER.md` §6.16（**不重述**——本档只承载端侧装配 + 采样器 / 重试 / 展示面）。

**`hostBusy` 判据**：采样器窗口内 lag ≥ 1 s（宿主事件循环繁忙——非渠道故障，分类可辨）；**同一采样器兼 loop-idle 重试闸**（宿主忙时不重试——不在忙循环上加压）。

**重试纪律**：配置阶段窗口内**单批延迟重试 ≤ 2 次** + 在飞去重（同批不叠发探针）；到期不再重试（面板重开 = 新窗口）。**运行期零探测零改**（§6.16 M8/M9 同源语义）。

**重试常量（具名落点 = `thincoder-vscode/src/extension/provider-probe-window.mjs:17` / `:20`）**：`PROBE_RETRY_MAX = 2`（「单批延迟重试 ≤ 2 次」的上界常量；**让位上限 = 同值**——宿主忙 ⇒ 让位不探，让位计数与探次同界，不无限让位）·
`PROBE_RETRY_DELAY_MS = 2000`（重试延迟——取值口径 = 2 × 采样器 `WINDOW_MS`：上一拍忙态证据先滚出窗口，重试拍不撞同一忙窗）。

**被拒备选**：获焦重探——无 focus 消息面（`webview/**` 无获焦上报）；引入 = 新 UI 事件依赖（且探针不得由前台动作隐式触发）。重试驱动力收敛于采样器闸。

**采样器落点（本批新建）**：`thincoder-vscode/src/extension/loop-sampler.mjs`——扩展宿主事件循环采样器（核 / CLI 无此面）：
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

载荷：`providerStatus` 渠道项除 `available` / `unavailableReason` 外增 `failure`（端侧装配 = `thincoder-vscode/src/extension/settings.mjs:78` `admissionOf` → `:85` / `:89` 载荷路径）；**字段语义 / 分类判据 = `PROVIDER.md` §6.16**（本档只承载端侧装配与展示面，不重述）。
**双向机检判据**：词 ⇒ 落账（渲 `宿主繁忙` ⇔ 载荷 `failure === "hostBusy"`；渲 `不可用` ⇔ 载荷 `failure ∈ {timeout, malformed}`）· 落账 ⇒ 词（反方向逐条）——两向均断言。
**被拒备选（验收③ 收窄裁定）**：不采纳「可辨 = 落账字段层」的收窄——与 `docs/vsc/requirements/WEBVIEW.md` F-W19 验收③ 的**展示面**字面不符；状态词分档不改版式、零渠道文案改动 ⇒ 成本为零。

**机检面（本批）**：`thincoder-vscode/test/loop-sampler.test.mjs`（新建——窗口起止 / lag 判定 / 注入缝 / 零 exec）·（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
`provider-admission.test.mjs` 扩（重试计数 ≤ 2 + 在飞去重 + 三清除语义 + 双向词档判据）·
`settings-open-snapshots.test.mjs` 扩（§2.11 时序断言）。核侧锚（探测束 / 同步有界例外 / 零 execSync 扫描）= `MULTI-INSTANCE-COLLAB.md` §3.1 判据条（不在本档重复）。

### 2.13 Advisor effort 键接线（2026-09-25 批 · 台账 #331 · #330 面板半）

**开题事实（实读）**：面板写 `agent.advisor.effort`（`thincoder-vscode/src/extension/settings-panel-write.mjs:133-136`），而核侧只读 `advisor.reasoningEffort`（`thincoder-core/advisor/run.mjs:48/:64`）⇒ 该键**写而无人读**（死键）+ 面板自身的读面（快照 `advisor` 对象）也只服务于同一死键的展示。

**裁定 = 接线（非确认死键）**：核侧消费方已在（CLI `/advisor` 菜单写 `cfg.reasoningEffort`，核读同键）⇒ 键位不对，不是能力缺失。

| 面 | 契约 |
|---|---|
| 写入键 | `agent.advisor.reasoningEffort`（单源 = 核读取键；与 CLI 菜单同键） |
| 档位值（枚举档） | 写字面档值（如 `low`/`high`/`max`） |
| 关思考（枚举 `none`） | **off 形按族取形**（规则单源 = `doc:MODEL-SPECS.md:§15.4-2`）：effort 族（`thinkApi === "effort"`）⇒ `advisor.thinking = null`；自定义开值族 ⇒ `null`；其余 ⇒ `{type:"disabled"}`。载荷面：`none` **原样上送**（写面归一，不写字面进盘）+ **删** `reasoningEffort` 键 |
| 「—」（未注册占位） | 删 `reasoningEffort` 键；**不动** `advisor.thinking`（off 形 `null` 的跨保存存活 = 写面种子循环 carve-out——`doc:MODEL-SPECS.md:§15.4-5`） |
| 旧 `effort` 键 | 读面兜底：`reasoningEffort` 缺席时按 `effort` 日值显示（且 `thinking` off 形 ⇒ 预选 `none`；优先级 = `doc:MODEL-SPECS.md:§15.4-4`）；保存时删旧键（不回写的死键不得复活） |
| select 未渲染（枚举空） | 载荷**不发** `reasoningEffort` 字段（缺席 ≠ 清空）——手写键存活 |
| 读面（预选取值） | `advisorEffortCurrent`（`settings-state.js`）：`thinking` off 形 ⇒ `none` > `advisor.reasoningEffort` > legacy `advisor.effort` > 「—」（规则单源 = `doc:MODEL-SPECS.md:§15.4-4`）；**off 哨兵 × 档枚举无 `none` 的族 ⇒ 预选「—」（不落注册默认档——`doc:MODEL-SPECS.md:§16.5`）**； |
| | 快照面（`thincoder-vscode/src/extension/settings.mjs:145`）为 spread 透传（新旧两键与 `thinking` 均随行）——端侧零改 |

**归一规则（两 select 同源）**：`doc:MODEL-SPECS.md:§15.4` 的 `effortSelection`（已存值∈枚举 > 注册默认∈枚举 > 中性档）；面板渲染面 = `effortSelectView`（「—」恒首项）。

**与需求档登记的关系（报告结论）**：`docs/vsc/requirements/WEBVIEW.md` P2-4「元素缺席 ≡ 显式清空」的 **advisor-effort 半由本节消解**（select 未渲染 ⇒ 不发字段）；P2-4 余项（advisor `provider` / `model` 与其他面板字段的缺席语义）= 需求档条目，本批不动。

### 2.14 Advisor guard 写面收口：槽唯一权威 + 两键通用保存通路关闭（2026-09-25 批 · 台账 #362 / #380 · 承 #358）

**开题事实（实读 · as-of 2026-09-25）**：面板 guard 复选框走 `setAdvisorGuard` 消息（`thincoder-vscode/src/extension/panel-messages-settings.mjs` `handleSetAdvisorGuard:161-167`）——
该 handler 原为「slot authority + **config mirror**」双写（原 `:163-166`；本批已删镜像行）；而 engineering 键经 #358 收口后已为槽唯一权威 ⇒ **同一面板内两键行为分叉**。
另：通用保存写面（`thincoder-vscode/src/extension/settings-panel-write.mjs`）原留两条通路——白名单含 `engineering`（原 `:88`；本批已删）· guard 赋值行（原 `:142`：载荷直写 + 缺席物化 `guard:false`；本批已删）。

**写面契约（本批后态）**：

| 键 | 唯一写面 | 通用保存面（`settings-panel-write.mjs`） | 翻转路径 |
|---|---|---|---|
| `agent.advisor.guard` | 会话槽（`setSlotAdvisorGuard`） | **删 guard 赋值行**（原 `:142`；本批已删）——只经种子循环（`:135-139`）**verbatim 存活**（在场原值回写 / 缺席保持缺席 / 零强制转换） | `setAdvisorGuard` 消息 ⇒ 槽写 + `_pushSettingsLight()`，零 config 写 |
| `agent.engineering` | 会话槽（#358 已收口——`setSlotEngineering`） | **白名单删项**（原 `:88`；本批已删）——通用保存不可达 | `setEngineeringEnabled` 消息 ⇒ 槽写 + `_pushSettingsLight()`（本行只作同口径对照，零改） |

**面板复选框接线（webview）**：`thincoder-vscode/webview/settings-agent.js` 的通用保存载荷删 `guard` 字段；
`#adv-guard` 改挂 change 监听直接 post 既有消息 `{ type: "setAdvisorGuard", value: checked }`——**协议零增量**（消息类型 / 形状与工具栏 `webview/mode-buttons.js:37` 同型）。文案 / 本地化零改。
**无「已保存」徽标（观感面）**：翻转走专线不经 `autoSaveAgent`（其徽标闪点 = `thincoder-vscode/webview/settings-agent.js:153-154`）⇒ 翻转不闪「已保存」徽标；与工具栏开关同口径（`webview/mode-buttons.js:37` 亦零徽标）。
**发值面穷尽旁证（实读）**：webview 通用保存发值面 = `settings-agent.js` 唯一载荷构造点 + `webview/settings-providers.js:89`（只 `defaultModel`）⇒ engineering 零发值、guard 仅专线（无第二旁路）。

**读面零改**：guard 取值链每次快照构建按槽优先（`thincoder-vscode/src/extension/settings.mjs:145`——`slotData?.advisor?.guard ?? (config === true)`）；
复选框随建面 / 重开按快照渲染（推送不重建面板——`thincoder-vscode/webview/settings-agent.js:146-147`/`:181-183`（`updateAgentSettings`））。

**机检面（本批）**：`thincoder-vscode/test/config-io-panel-guard.test.mjs`（用例 T-1–T-8：两键翻转 config 逐字不变 · 伪造旁路直测 · 缺席 / `true` / `false` 三格 · `null` ⇒ 保存后键缺席）+（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
`thincoder-vscode/test/effort-select-views.test.mjs`（载荷无 `guard` 键 · guard 变更 ⇒ post `setAdvisorGuard` 且零 `saveAgentSettings`）——用例表 = 批档 §2。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**边界登记**：磁盘 `advisor.guard: null` 形态被种子循环丢弃（`v: null` 除 `thinking` 外 continue——既有通例，本批零改）⇒
判据「翻转 / 任意保存前后对应键逐字不变」的用例域 = {键缺席 / `true` / `false`}；`null` 形态见 §3 登记行。

### 2.15 设置面失败面（S15 收正）（2026-09-29 批 · 台账 #640）

方向 = 桌面形收正（KD-EC-7——判据 = 两端失败面同形：段标 + 词化码 ∕ 不静默丢）。

**载荷 v2**（`providerError` = `{ type:"providerError", scope, reason }`——既有载荷 `{text}` 的替换；协议登记 = `WEBVIEW-PROTOCOL.md` §3.2 行 20）：

- `scope` ∈ 六段闭集 {`providers` · `mcp` · `agent` · `consultAdvisor` · `tools` · `env`} ∪ {`panel`}；`panel` ∕ 闭集外 ⇒ **零段标**（沿桌面判）。段名词键 = 复用现有 `settings.*Section` 键（**零新段名键**）。
- `reason` = 码 ∕ 原样串；webview 解析 `reasonWord`（`thincoder-vscode/webview/settings.js:78-83`）= 桌面同式：**表内出词、表外原样直传、空 ⇒ `null`（零节点）**。

**webview 面**（`thincoder-vscode/webview/settings.js`——现 190 行）：

- 表两件：`SCOPE_WORD`（`:63-70`——六段 ↦ 上述词键）+ `REASON_WORD` v1（`:74-76`——恰可达集：`mtime-conflict` 一枚；表随新码产者一行扩张）。
- banner = **单实例**（`renderSettingsError` `:90-111`）：段标 + 文本两子节点（携 `data-scope`）；**零自散**（无 6s 定时器——替换 ∕ 关面板止）。段标样式 = `thincoder-vscode/webview/settings.css:278-282`。
- **关面板不丢**：模块级**单槽 `_lastFailure`**（`:87`——最后一条胜）：面板关时到达 ⇒ 落槽；`buildSettings()` 尾补渲（`:189`）；`closeSettings()` 清槽（`:169-170`——**关 = 销账**）。

**extension 面**（**19 站点**统一助手——既有 9（含 P2-5 `:198`）＋本批接入 10）：`postProviderError(panel, scope, err)`（`thincoder-vscode/src/extension/settings.mjs:309-312`——载荷构造单源）：`err === CONFIG_CONFLICT_HINT`（核 `conflictError` 的唯一非空返回；import `:12`）⇒ `reason = "mtime-conflict"`；其余 ⇒ 原样串直传。
站点 = 既有 9：`panel-mcp.mjs:129 ∕ :140 ∕ :151 ∕ :165`（`mcp`）· `panel-messages-settings.mjs:59 ∕ :71 ∕ :84`（`providers`）· 同档 `:143-144`（`agent`）· 同档 `:198`（`env`——P2-5）；本批 #695 新增 10 = `:190`（`env`）· `:107 ∕ :110` ∥ `:101 ∕ :104`（`tools`）· `:92` ∥ `:29 ∕ :32`（`providers`）· `:35 ∕ :38`（`mcp`）。

**i18n**：`settings.reason.mtimeConflict`（两语；`thincoder-vscode/locales/en.json:186` / `thincoder-vscode/locales/zh.json:186`——值 = 桌面同值逐字）。

**关系句**：槽（`_lastFailure`）= **消息面瞬态状态，非面板字段状态**——不触 §1 单一状态源原则（§1「DOM ∕ 模块变量不持独立状态」指 config 字段面）。

**验收面（九腿 · ①–⑨）**：① 开面板 + `showSettingsError("mcp","mtime-conflict")` ⇒ banner 在场 ∕ 段标在场 ∕ 文本 = 词化句；② 表外 reason ⇒ 文本逐字 = 原样串 ∧ 段标仍在；③ `scope:"panel"` ⇒ 零段标节点。
  ④ 关面板态调用 ⇒ 零节点 ∧ 开面板（buildSettings 后）⇒ 复现（关面板不丢）；⑤ 单实例（二次调用替换）；⑥ `closeSettings()` 后复开 ⇒ 不复现（关 = 销账）。
  ⑦ 源锁：`showSettingsError`（`:113-119`）体内**零 `setTimeout`**（不自散；同档打开等待定时器 `:142-151`——250ms 回退，**不在锁域**）；⑧ 闭集外 scope（如 `"bogus"`）⇒ 零段标；⑨ 空 reason（缺 ∕ `undefined` 同判）⇒ 零节点。
真机腿（父侧）：制造写冲突 ⇒ 段标 + 词句驻留（无 6s 自散）∧ 关面板重开仍见。
**机检面**：`docs/batches/2026-09-29-vsc-carryover-settings.test.mjs`（九腿 + 扩展侧文本锁）· 站点 7⇒8 接入（本批）= `docs/batches/2026-09-30-vsc-residuals.test.mjs`（单元测试档）；冒烟 = `thincoder-vscode/test/smoke-settings.mjs:88`（调用形 `showSettingsError("panel", "test error")`）。

### 2.16 provider 添加弹窗 · 字段序 · 走 proxy 开关 · 扩面四件（三端对齐批 · 2026-10-07 · 台账 #1027 / #1028 / #1029 / #1031 / #1032 / #1033 / #1035）

**来源**：用户 2026-10-07 18:07「客户端的provider的配置界面上增加一个走不走proxy的开关，另外apikey放在最后根本不符合用户使用习惯，字段的布置应该按照填写顺序来，三个端都查一下。」+ 18:10（桌面端不许另搞一套）+ 18:13「点了添加不弹窗…反人类」（逐字 = 批档 §1.1）；批档 = `docs/batches/2026-10-07-provider-config-parity.md`。**VSC = 源**（桌面逐元素照本面；三端逐元素对齐表 ∥ 字段序三端表 = 批档 §2）。

**① 添加表单 → 弹窗（面形与开合）**

- **载体**：新档 `thincoder-vscode/webview/settings-provider-dialog.js`（表单族自 `settings-providers.js` 析出——表单 HTML 迁出卡片；`settings-providers.js` 的 P2-6 保表单段退场）。
- **DOM 锚**：遮罩 = `.settings-dialog-backdrop`（新独立类——z 999；规格入 `settings.css` 新段：fixed inset 0 ∥ `--overlay` 底 ∥ 动效复用 `backdrop-in`；不与确认族共用类 `.auto-backdrop` 合流——隔离判由 = ① 关路句）；卡 = `#prov-add-dialog` + 新类 `.settings-dialog`（`settings.css` 新增小段：fixed 居中 ∥ z 1000 ∥ `--bg` 底 ∥ 1px 边框 ∥ 圆角 8px ∥ 宽 ≤ 420px；`role="dialog"` + `aria-modal="true"` + `aria-label` = `settings.addProviderTitle`）；卡体 = `.settings-card-body`（字段样式复用）+ 首件 `.settings-subtitle`（`settings.addProviderTitle`）。
- **入口（两处）**：① `#prov-add-btn`（词 = `settings.addProvider`，既有——`settings-providers.js:195`）onclick ⇒ `window._openAddProviderDialog()`；② 首启板交棒——`webview/onboarding.js:62` 的 custom 径 ⇒ `window._openAddProviderDialog?.()`（`?.` 守卫保留；时序 = `_openSettings?.()` 后随调，面板 ∥ 框两处 +50ms 焦点定时器同拍序——框后调度 ⇒ 末位焦点 `#pa-type`；批档 §2.3）。
- **开（单例）**：已在框 ⇒ 零动作；否则建两件挂 `document.body`；开框重置 = 类型回首项 ∥ `#pa-key` 清空 ∥ `#pa-proxy` 未勾 ∥ `#pa-conn-status` 空 ∥ `#pa-model` 值 + 候选（datalist）清空 ⇒ `paTypeChanged()`；初始焦点 = `#pa-type`（+50ms）。**框实例代际**：开 ∥ 关自增 `_addDialogEpoch`；`_paFetchModels` 发起时记代际、`updateTestProviderResult` 落框前比对——不符 ⇒ 弃（在飞探果跨框零污染）。
- **关（五路同效）**：保存（发消息后）∥ 取消钮 ∥ 背板点击 ∥ 框内 Esc（`stopPropagation` —— 不连带触 `webview/chat.js` 的关面板分支——沿确认弹框同判）∥ `closeSettings()` 同清——**落法**：`settings.js:163-172` 增调新档导出 `closeAddProviderDialog()`（与 `closeConfirmPopover()` 同拍）；**遮罩 = 独立类 `.settings-dialog-backdrop`**（z 999；样式入 `settings.css` 新段——**不入确认族共用类 `.auto-backdrop`**：确认族帚扫站点（`settings-widgets.js:109` ∥ `session-bar.js:103-104` ∥ `chat.js:100-101`）零误扫；框在场 ⇒ 确认族开 ∥ 关两向均不触框组；卡 ∥ 幕归 `closeAddProviderDialog` 独清）。
- **与卡重绘关系**：框在卡外（挂 body）⇒ `renderProvidersCard()`（`:252-259`）的 P2-6 保表单段**删**（卡重建不再触碰框；在编输入由「框不重绘」天然保真）；`bindAddProviderForm()`（`:233-246`）域收窄为 `defaultmodel-btn` + 盘根行 `✕`（`pa-*` 绑定随档迁）。

**② 字段序（现行 → 目标；自定义形）**

- 现行（表单 HTML = `settings-providers.js:200-224`）：`pa-type → pa-preset-info → [pa-name → pa-url → pa-format → 拉取行 → pa-model] → pa-key → 保存 ∥ 取消`（key 垫底）。
- 目标：`pa-type → pa-preset-info → [pa-name → pa-url → pa-format] → pa-key → pa-proxy → [拉取行 → pa-model] → 保存 ∥ 取消`；`#pa-model` = **手输文本框 + 候选 datalist**（`<input id="pa-model" list="pa-model-candidates">`——本批改，原 `<select>`；#1031）。
- 结构 = 两条件块 + 两常显件居中：`#pa-custom-fields`（名 ∥ URL ∥ 格式）+ `#pa-custom-tail`（拉取行 ∥ 模型）+ `#pa-key` ∥ `#pa-proxy`（两形皆显——预设形 = `pa-type → info → key → proxy → 保存`）。
- 语义依据 = 用户填写序（名称→baseURL→格式→API Key→走 proxy→拉取→模型）：key 前置（拉取需 key）∥ `pa-proxy` 邻拉取（同链路口径）；三端表 = 批档 §2。

**③ 走 proxy 开关（写面）**

- **控件**：`#pa-proxy`（`.switch` 形复用（`settings.css` 既有）；词 = `settings.proxyRow` + `title` = `settings.proxyRowTitle`——与行开关同词键）。
- **写面**：`addProvider` 载荷 + `proxy`（可选布尔，勾选 ⇒ `true`）⇒ 宿主 `handleAddProvider`（`src/extension/panel-messages-settings.mjs:66-92`）透传 `addProviderEntry` ⇒ 核 `addProviderEntry`（`thincoder-core/config-io.mjs:223-259`）迁受 `proxy`：`proxy === true` ⇒ 条目携 `proxy:true` 同批落盘；缺 ∥ 非真 ⇒ 零键。条目形状单源 = `docs/core/design/CONFIG.md`。
- **与行开关一致性（点名）**：字段 = `providers[].proxy`（同一键）；行读 = `settings.mjs:88`（`proxy: entry.proxy === true`，行渲染 = `settings-providers.js:190`）；行写 = `handleSetProviderProxy`（`settings.mjs:129-136`：`true` 写 ∥ `false` 删键）。表单初值 = 未勾（新条目无旗）；勾选落盘后行面即显勾选（推送随动）；表单不读行值（新条目无既有态）。
- **生效面**：运行期模型请求（`injectProxy` 双门槛——组成式唯一式 = ③′；语义单源 = `docs/core/design/PROVIDER.md` §6.19 / #1026 面）；**表单内〔拉取〕路由 = 同判定（③′）**；双闸去留（行勾选在全局 `proxy.model` 关时静默无效——A2）= **裁讫 · B——另批**（去全局闸 · 逐渠独立；台账 #1042；本批机制面零动）。

**③′〔拉取〕路由随勾选（已裁 · 父侧 2026-10-07 · 批内处置）**

- 裁定：**耦合**——勾选 ⇒ 拉取按 `probeTargetOf` 同判定（勾 ⇒ 取全局判定（`uri ∧ model === true`）⇒ 走代理；未勾 ∥ 载荷缺 `proxy` ⇒ 直连）。理据 = 用户 17:58「provider 走不走 proxy 是每个 provider 单独选」的完整落实 + 自定形「拉取成功才可存」下不耦合即死结；「#1026 零动」原意 = 不回归它——本项 = 它的自然延伸。
- 落法：`testProviderConnection`（`src/extension/settings.mjs:220-234`）改受 `proxy` 形参——目标 = `probeTargetOf({ name: "", baseURL: url, apiKey, format, proxy: proxy === true })` ⇒ `listModels(target)`（**双门槛组成式（唯一式）**：条目 `proxy === true` ∧ 全局 `proxy.model === true` ⇒ `proxyUri = proxy.uri`；否则 `undefined` ⇒ 直连——`uri` 缺席亦落 `undefined`；**`uri` 非第三门槛**，是代理目标本体；`injectProxy`（`thincoder-core/proxy.mjs:67-72`——判定式 `:70`）同式）；核 `probeTargetOf`（`thincoder-core/provider-flows.mjs:79-90`）= 组成式单源（判据体逐字复用，零第二份）；调用面 `handleTestProvider`（`panel-messages-settings.mjs:142-146`）透传 `proxy`；缺省 ∥ 未勾 ⇒ 直连（#1026 契约逐字不变）。
- 协议：`testProvider` 载荷 + `proxy`（可选布尔——`docs/vsc/design/WEBVIEW-PROTOCOL.md` §13 本行）。
- 同族同径（本批共三条，三端同一判定）：**桌面**拉取 = 同一收敛（现取全局 `proxy.web` 旗——缺陷类 ∥ #1026 镜像，本批修：`thincoder-desktop/src/main/providers.mjs:273-274` 的 web 旗判定 ⇒ `probeTargetOf` 同判定）；**CLI** 探针 = 同一收敛（落盘条目随旗——`tui/provider-admin.mjs:28` ∥ `tui/cmd-config.mjs:296` ∥ `tui/wizard.mjs:216` ⇒ `probeTargetOf`；未落盘条目（`cli/setup-wizard.mjs:60`）= 无旗 ⇒ 直连缺省 ✓ 零改）。

**④ 扩面四件（父侧 2026-10-07 一次并入 #1031 / #1032 / #1033 / #1035——本批同稿）**

- **#1031 自定形「拉取失败不可存」死路 ⇒ 修**：`#pa-model` 由 `<select>` 改 **手输文本框 + 候选 datalist**（`<input id="pa-model" list="pa-model-candidates">` + `<datalist id="pa-model-candidates">`——桌面既成形对齐）；`updateTestProviderResult` 探通 ⇒ 填 datalist 选项（不自动选中）；探不通 ⇒ `pa-conn-status` 明示 ✗ + 候选清空、**键入值零清**（不吞手输）。`_paSave` 自定形守卫改判 = model 空 ⇒ `settings.modelRequired`（新键；原 `settings.fetchModelsFirst` 无消费者 ⇒ 随实现净删）；**不拉取（候选空）只要 model 非空即可存**（走查要点：名 ∥ URL ∥ 格式 ∥ Key ∥ 模型手输 ⇒ 直接保存成功）。
- **#1032「选择模型…」空表静默 ⇒ 提示**：`_defaultModelMenu` 空表（`SS.getModels()` 无可用行 ⇒ rows 空）⇒ 展示 `#defaultmodel-hint`（`.prov-hint` 形复用——零新 CSS；词 = `settings.pickModelEmpty`（新键））+ return（零菜单）；有候选 ⇒ 清提示 + 开菜单。hint 挂 `#prov-defaultmodel-row`（`:166-172`）`.prov-main` 之后；卡重建自随（新 HTML 默认隐藏）。
- **#1033 硬编码串入表**：`(no default model)`（`:25` ∥ `:189`——词 `settings.noDefaultModel`）· `title` 英文句（`:168`——词 `settings.defaultModelTitle`）· **同线中文硬编码两处**（`:189`「宿主繁忙」∥「不可用」——词 `settings.providerHostBusy` ∥ `settings.providerUnavailable`；审计补：en 界面现显中文 = 缺陷类）⇒ `locales/en.json` ∥ `zh.json` 两语入表。
- **#1035 术语统一「API Key」**（用户 16:43 定音：实体名 = API Key，zh 保留英文形，裸「密钥」退场）：**词值改 6 键**——`settings.setKey`（en "Key" ⇒ "API Key" ∥ zh「密钥」⇒「API Key」）· `settings.addKey`（"Add Key" ⇒ "Add API Key" ∥「添加 Key」⇒「添加 API Key」）· `model.setKey`（"Key…" ⇒ "API Key…" ∥「设置密钥…」⇒「设置 API Key…」）· `error.provider` ∥ `error.failedProvider` ∥ `banner.notConfigured`（zh 内「API 密钥」⇒「API Key」；en 无裸 key 失范——不动）；`settings.keyOptional` 已合规（保持）；键数不变（值级改写）。

**⑤ 边界**：行 ∥ 列表侧既有开关零改；运行期代理语义（核）零改；删除确认 ∥ 密钥行 ∥ 其余卡面零改；服务端面零触；#1036（MCP env 串）批外另立。

## 3. 已知待办与已知限制

- **运行时当次展开缺口**（§2.6）：磁盘原文保留 `~` 的配置在面板 / `settings` 工具写面不展开——登记在案（与对端同姿态）。
- 设计 round2 专用提示词、架构档 NFR 补全等开放项 = 仓根台账 `docs/TODO.md`（项目级唯一台账）。
- **进程内缓存不随外部写同步**（§2.7 边界）：embedder `_tried` 缓存 / 会话槽不因外部写盘重载——登记（非本板块范围）。
- **无 `proxy.uri` 时勾 web / model 零落盘**（观感面 · §2.8 路径册 #1 子路径）：宿主 `!uri` 即 `delete raw.proxy; return`
  （`thincoder-vscode/src/extension/settings.mjs:231`）⇒ 两开关的改写静默失效，而 UI 闪「已保存」（`thincoder-vscode/webview/settings-env.js:115`）；
  消解路径 = 代理面「URI 缺席 ⇒ 其余字段保留」与该删除语义一并复核（或保存回执改由宿主返回、徽标按回执亮）；到期 = 代理面下次被触碰时。
- **快照未达拍的代理控件渲染值**（观感面 · §2.8 登记）：`#px-web` 在快照缺席时按渲染默认显示为勾选——打开拍必达落地后该拍仅在推送丢失时出现，且发值门（§2.8 基线判据）已消除其危害；消解路径 = 若日后引入推送回执 / 超时可见化，则在同一处显式化该拍；到期 = 设置面下次被触碰时。
- **确认弹框形态三处同族重复**（结构面 · §2.10 登记）：同一弹框件现有三处实现——
  `thincoder-vscode/webview/session-bar.js:75-107`（会话删除确认）· `webview/mode-buttons.js:54-92`（AUTO 启用确认）· §2.10 的 settings 面一处；
  本批只在 settings 面立单源（`showConfirmPopover`）。消解路径 = 抽公共件 `thincoder-vscode/webview/confirm-popover.js`（拟新增）并三点迁移（纯搬移、零语义改）；
  到期 = 该两面下次被触碰时 / 父侧裁定本批扩写域。
- **provider 行 − 的凭证归类张力**（归类面 · §2.10 入口册 #4）——**已消解（用户 2026-09-19 08:11 裁定 A）**：该行条目内含 `apiKey`（写入 = `thincoder-core/config-io.mjs:201-208` · 删条目的整条 filter = `:262-277`）⇒ 删行同时移除 key 原文 ⇒ 判入**不可复得类**（入口册 #4 本批改判——载体 = `webview/settings-providers.js:182` 卡 HTML + `:48-49` 编辑行取消重建位）。
  处置沿革：2026-09-18 22:21 例外汇总（已裁 ②——受裁例外条）⇒ 2026-09-19 08:11 **裁定 A 改判入本门**（判据句 = §2.10）；判据与实况的差口**随实况改正而关闭**——本批 = `docs/batches/2026-09-19-vsc-provider-delete-confirm.md`。
- **本门弹框文案的类贴合度**（文案面 · §2.10 弹框契约登记）：正文键 `settings.secretDeleteConfirm` 原按密钥类写就（「该密钥」·「界面只显示 ****」），
  而 MCP server 行（入口册 #5）**不显掩码**、删除目标 = 整条 server 条目 ⇒ 该行文案贴合度存缺口。
  **处置 = 已裁 ②（父侧 2026-09-18 本轮 · 评审 id=116 发现 5）：本键文案改类通用式**——值级改写 · 键数不变 · 键名不动（写域 +`thincoder-vscode/locales/en.json` / `locales/zh.json` 两档）；改写值 = §2.10 文案条；**未采 ①**（新增 MCP 行专用键）。
  **已核销（2026-09-19 文档卫生轮 · 父侧直接执行）**——值级改写已随 MCP 批实现轮落盘（本批与 provider 行批均申报 `locales/**` 零改 ⇒ 现值 = 类通用式，即 §2.10 文案条）；到期条件达成。
- **`settings-tools.js` 越 300 行建议线（拆分复核 · 评审 id=116 发现 4）**（结构面 · §2.10 载体登记）：**触发条款达成 ⇒ 拆档执行（MCP 键值行式输入批 · 2026-10-07 · 台账 #1036）**——原触发 = 阈值 450 行 ∨ **MCP / provider 面下次结构改动**（先到即拆）：本批 = MCP 表单结构性改动（env ∥ headers 改行式键值——§2.4）⇒ 第二条件达成（拆前实读 **433**；kv 面净增 ≈ +80 ⇒ 不拆则 ≈513 **越 500 硬限**）。
  组边界 = ① **MCP 族**（`renderMcpList` / `updateMcpTools` / `updateMcpTestResult` / `parseHeadersLike`（随批净删）/ `openMcpForm` / `kvToInput`（随批净删）/ `bindToolsControls` MCP 段 / `toolsCardHtml` 表单段）② 密钥行族（`renderKeyRow` / `KEY_ROW_ACTIONS` / 三处 handler）③ 卡骨架 + 快照消费（`toolsCardHtml` / `updateWebsearchSettings` / `renderIndexStatus`）——① 拆出 = `thincoder-vscode/webview/settings-mcp.js`（**拟新增 · 缝 = `mcpFormHtml()` ∥ `bindMcpControls()` 两口回插**；对外导出名零改——`settings.js` ∥ `chat.js` 消费面零改）。
  生效窗口 = **先拆后改**（零语义搬移在改动前）；拆后两档实读 = 实施后回填轮落数。到期条件 = 阈值 450 行到达时（新触发——若拆后增量再逼近）。
- **用例档越 300 行建议线（拆分复核 · 评审 id=116 发现 4）**（测试面 · §2.10 机检面）——**已终结**（2026-09-19 按实现实测收正，原「现 439 → 预估 ~516」为预估）：provider 行批实现轮实读触线 ⇒ **拆分已执行** = 主档 `settings-secret-delete-confirm.test.mjs`
 现 **412** · MCP 组析出 `settings-mcp-delete-confirm.test.mjs` **177**（已在 `thincoder-vscode/test/files.mjs` 在册）；**两档均 <500 硬限** ⇒ 不触发再拆；**下次触发条件 = 任一档实读 ≥500**（承批档 §2.2 D-M6「越线即当场拆」）。
  组边界 = **MCP 组**（W17-16 / W17-19…W17-25）析出为 `thincoder-vscode/test/settings-mcp-delete-confirm.test.mjs`（已落 · 实读 **177**——夹具经 `test/helpers/webview-env.mjs` 共享；自持 `before` / `beforeEach` / 驱动助手）· `thincoder-vscode/test/files.mjs` 同步登记（主档条注释随组边界同笔收正）。 （迁移期引文——档已删）
  拆分后预估：主档 ≈ **421**（密钥类 / 结构对账 / provider 行组）· MCP 档 ≈ **160**。到期条件 = provider 行批实现轮末实读（未越线 ⇒ 不拆，读数入批档 §5）。
- **直通门 `_confirmDelete` 零调用点（保留门）+ `settings.js` 注释收正**（结构面 · §2.10「本批后态」）——**已核销（2026-09-29 vsc-carryover 批 · 到期条件达成）**：
  入口册全数过确认门 ⇒ `window._confirmDelete`（`thincoder-vscode/webview/settings.js:44`）**零调用点**（门体零动——**保留门**）。
  裁定（2026-09-19 · 父侧直接执行）取 ① 保留门（零调用点）+ 同步注释为下次触碰首选修法——**本批触碰已按 ① 执行**：同档 `:42-43` 失实分句退场（provider 行已入本门、可重填类空域）+ `:45-48` 不可复得类枚举补 provider 行；
  `test/smoke-settings.mjs:95` 的 handler 在位断言照绿；②（清死码）未取。日期指向 = 变更记录。

- **入口 6 的确认不绑定目标**（交互面 · §2.10「模型菜单入口」段登记）：确认弹框发生在宿主 QuickPick 选定**之前**（文案 = 类通用式 `settings.secretDeleteConfirm`、不携 `name`）⇒ 与入口 1–5（目标 = 载体所在行）的确认力度不同；本批按批档 §1.3 ②「取消 ⇒ 零删除 ∧ 零消息副作用」的**严格读法**选门位（webview 侧调用点），代价入册。
  补偿 = 目标选定步（QuickPick）自身是显式选择（见 §2.10 补偿两条）；消解路径 = ① 若父侧裁定确认须绑定目标，则须先裁定该半句读法（严格 = 零发值 / 宽松 = 无持久副作用）+ 登记第二确认形态（VS Code 原生件）例外；② 或宿主把选定 `name` 回传 webview 走同件（须协议 +1 条消息）；到期条件 = 本门下次被触碰 / 父侧裁定。

- **`thincoder-vscode/src/extension/settings.mjs` 越 300 行建议线（拆分复核 · 评审发现 #3）**（结构面 · §2.13 载体档）：该档现 **359**（内容行数口径 · 本批届盘复读 2026-09-29——350 ⇒ 359：本批净增 +9〔#640 助手 `postProviderError` + #17 读链补环〕；
  上届 410 ⇒ 350 之净减沿革 = B10 S17 族出档、shell 候选面上提核 `thincoder-core/shell-candidates.mjs`）——**仍越 300 建议线**（< 450 触发阈值）⇒ 拆分计划维持（快照面透传语义不变）。
  拆分组边界 = ① 快照族（`agentSettings` / `proxySettings` / `websearchSettings` / `fullStatus`）② 渠道路由族（provider 增删 / 代理旗标 / 连接测试）③ 密钥与 MCP 族（`saveProviderKey` / `deleteProviderKey` / MCP 三件）——① 拆出 = `thincoder-vscode/src/extension/settings-snapshots.mjs`（拟新增）。
  拆分计划 = 触发阈值 **450 行** 或该档下次结构改动（先到即拆）；到期条件 = 触发阈值到达时。

- **`advisor.guard: null` 磁盘形态 vs 判据用例域**（边界面 · §2.14 载体）：种子循环（`settings-panel-write.mjs:135-139`）对 `v === null` 除 `thinking` 外 continue
  ⇒ 面板通用保存不 verbatim 携带该形态（既有通例，非本批引入）。本批判据（翻转 / 任意保存前后 config 逐字不变）的用例域 = {键缺席 / `true` / `false`}；
  **静态预期（本批）= `null` ⇒ 保存后键缺席（非 `null` / 非 `false`）**——机制链（实读）：种子循环先丢该 null ⇒ `patch.advisor` 不含该键（`:174`）⇒ `applyAgentPatch` 顶层整键替换（`:30-37`——`advisor` 顶层键整段覆盖、无深合并）⇒ 盘上该键缺席。
  消解路径 = 若后续统一 null 语义（全族 carve-out 收拢），则同笔纳入；到期条件 = `settings-panel-write.mjs` 种子循环下次被触碰。
- **镜像撤写后的措辞残余族（域外坐标 · 只报不修）**（措辞面 · 本批 + #358 撤写的残留语句）：
  ① `docs/core/design/ENG-TOKEN-BINDING.md:100`（「slot 持久化 = 会话槽 + config.json mirror」——该 mirror 已被 #358 撤销）·
  ② `docs/core/design/ENGINEERING-MODE-V2.md:377`（读面回退句）· ③ 注释 / 产品文本：`thincoder-vscode/AGENTS.md:86` · `thincoder-vscode/src/extension/settings.mjs:181` · `thincoder-vscode/src/extension/panel-session-write.mjs:92` ·
  `webview/mode-buttons.js:3-4`（「These mirror config.json fields」——engineering / advisor 两钮语境已失实）。
  台账 #378 在册集 = `docs/core/design/TOOLS.md:82` / `:123` + 注释三处（③ 前三项）；① 与 ③ 的 `mode-buttons.js` 项为本轮新增实读。
  消解路径 = 各档下次被触碰逐处收正（设计档笔 = eng-designer；注释 / 产品文本 = 产品代码面）；到期条件 = 各档下次被触碰 / 父侧另册归形小批。
- **`thincoder-vscode/webview/settings.css` 越 300 行建议线（拆分复核）**（结构面 · §2.15 载体档）：该档现 **385** 行（内容行数口径 · 本批届盘复读 2026-09-29——本批 +6：#640 段标样式一条；**三端对齐批（2026-10-07）触碰 = 新增 `.settings-dialog` ∥ `.settings-dialog-backdrop` 段（Δ ≈+20 ⇒ 预估 ≈405；实施后实读回填）——非结构性（单组件样式段；不改三段组界 ∕ 不增职责）⇒ 消解窗口顺延**）——**复核结论 = 本批不拆**（本批增量 = 段标 span 单条样式，不改结构 ∕ 不增职责）。
  拆分计划 = 触发阈值 **450 行** 或 **设置面样式族下次结构改动**（先到即拆）；
  组边界（三段 · 按现分节注释）= ① 面板骨架 + 通用件（面板框 ∕ 卡框 ∕ 字段 ∕ 按钮 ∕ 开关）② 卡面样式族（providers ∕ MCP ∕ consult ∕ agent 徽标 ∕ model-menu）③ first-run 面板段。
  到期条件 = 触发阈值到达时 ∕ 设置面样式族下次结构改动时。

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
| 旧档 §2.6「受影响文件」「用例表」「验收标准」「边界」 | 施工面清单（新模块 / 测试档 / AC-S1–S2 / T-S1–T-S6） | 一次性批次材料——**测试资产归测试层**（`thincoder-vscode/test/`）；本档只留契约 （机检豁免——用例退场登记） |
| 旧档 §2.7「问题复核实录」「方案选型」表（3 候选） | `~` 展开的三候选取舍 | 一次性批次材料——机制单源在 `docs/core/design/MEMORY.md` §6.7；本档只留端差事实（§2.6） |
| 旧档 §2.7「用例表」「AC」「计数」「边界」 | 施工面清单（T-MA2-1–5 / AC-MA2-1–2） | 一次性批次材料——测试资产归测试层 （机检豁免——用例退场登记） |
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
| U-S8 | 未编辑不发值：基线判据 + 逐字段载荷（代理与 Shell 控件）；「空值 ⇒ 删键」只由显式用户动作触发 | 已定（§2.8） |
| U-S9 | Shell 控件接线：`System default` 项 = 重置（删键）；自定义路径空值 = 不发值 | 已定（§2.9） |
| U-S10 | 回填跳过聚焦中的控件（用户输入优先于推送） | 已定（§2.8） |
| U-S11 | 不可复得类（凭证原文随删除消失）删除 = **面板内确认弹框**（复用 `.auto-confirm` 件）；可重填类 = 直通门 `_confirmDelete`——**本批后为空域**（入口册 **6 行**全数入本门；直通门零调用点） | 已定（§2.10；类名与实例按可复得性判据重述——MCP server 行（2026-09-18）+ provider 行 −（2026-09-19 裁定 A）+ **模型菜单 footer 行（2026-09-19 入口册 #6/6**——口径 = 册序）入本门） |
| U-S12 | Advisor effort 选择三态：档位值 = 写 `advisor.reasoningEffort`；`none` = 关思考（写 `thinking` off 形 + 删 effort 键）；「—」= 不设档（删 effort 键，不动 thinking） | 已定（§2.13 · §15.4 规则单源） |
| U-S13 | Advisor guard 开关 = **槽唯一权威**（翻转 / 通用保存两路均不写 config.json）；engineering 同口径（#358） | 已定（§2.14） |
| U-S14 | 添加渠道 = **弹窗形态**（单例 · 遮罩 + 居中卡 `#prov-add-dialog`；开 = `_openAddProviderDialog()`；关五路：保存 ∥ 取消 ∥ 背板 ∥ 框内 Esc ∥ 关面板；初始焦点 = 首控件）；字段序 = 用户填写序（名称→baseURL→格式→API key→走 proxy→拉取→模型）；表单「走 proxy」= 写 `providers[].proxy`（与行开关同字段 ∥ 同词键） | 已定（§2.16） |
| U-S15 | 添加表单（弹窗）自定形 model = **手输文本框 + 拉取候选 datalist**（探通填候选、不自动选中；探败零清键入）；**不拉取亦可保存**（model 空 ⇒ 词 `settings.modelRequired`）；「选择模型…」无可用候选 ⇒ 行内提示（`#defaultmodel-hint`，词 `settings.pickModelEmpty`） | 已定（§2.16——#1031 ∥ #1032） |
| U-S16 | provider 配置面词面：实体名 = **「API Key」**（zh 保留英文形；裸「密钥」退场——#1035，两端 i18n 词值改写）；卡面残余硬编码串入表（`settings.noDefaultModel` ∥ `settings.defaultModelTitle` ∥ `settings.providerHostBusy` ∥ `settings.providerUnavailable`——#1033） | 已定（§2.16） |
| U-S17 | MCP 表单 env ∥ headers = **行式键值编辑器**（每行键格 + 值格 + ✕；行集下 `[+ 添加行]`；零项零行）；粘贴零解析；值 = 字面（零引号剥离）；提交四判据（空行丢 ∥ 重复后胜 ∥ 全空删字段 ∥ trim） | 已定（§2.4——MCP 键值行式输入批 · #1036；桌面逐元素同形 = `docs/desktop/design/SETTINGS.md` §1 **KD-76**） |

## 变更记录

- 2026-10-07（**provider 配置面三端对齐批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §2 · 台账 #1027 ∥ #1028 ∥ #1029 ∥ #1031 ∥ #1032 ∥ #1033 ∥ #1035）：新增 **§2.16**（添加弹窗 ∥ 字段序 ∥ 走 proxy 开关 ∥ 拉取路由耦合 ∥ 扩面四件）；**§5** +U-S15 ∥ U-S16（U-S14 随稿）。**零新语义**（定形 + 修向；明细 = 批档 §2）。
- 2026-10-07（**三端对齐批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-07-provider-config-parity.md` §3 轮次 1 ∥ 用户 2026-10-07 19:04 裁）：§2.16 收正——① 入口句直陈（交棒径 = `onboarding.js:62` ⇒ `window._openAddProviderDialog?.()`；批档 §2.3）∥ ② **框幕 = 独立类 `.settings-dialog-backdrop`**（确认族帚扫三站点零误扫——隔离判由 = ① 关路句）∥ ③ 双门槛**组成式唯一式**（`uri` 非门槛 = 目标本体；`proxy.mjs:67-72` 同式）∥ ④ #1034 裁讫 · A 落形（行删除符 `✕`——`settings-providers.js:48` ∥ `:185` 字面 + 注释随述）∥ ⑤ §2.12 展示面锚点收正（`:189` ∥ `:192`）∥ ⑥ §2.15 载体行触属性 + 顺延句（delta ≈+20）；§1 面图行 glyph 收正。**产品码零触（fix 轮）**。

- 2026-10-02（**桌面 UX 收尾批 · 设计轮（VSC 侧）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2 · 台账 #697）：§2.5 增「P1 读数扩面」条（`pushIndexStatus` 载荷 +2 键 ∥ `#index-status` 区增两读 ∥ 刷新拍 = 既有推送时点；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-69**）。**零新语义**（读数扩面定形）。

- 2026-10-02（**桌面 UX 收尾批 · 回填/随动轮（VSC 侧）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §5 · 台账 #697）：§2.5 P1 条坐标实读收正（`panel-index.mjs:43-56` ⇒ **`:47-61`**——`pushIndexStatus` 函数体）。**零新语义**（坐标）。明细 = 批档 §2。

- 2026-09-29（**vsc-carryover 批 · 设计档落点（V1 舱随动）· eng-designer**——承 `docs/batches/2026-09-29-vsc-carryover.md` §2（含两轮修正块）+ §5 V1 舱）：
  新增 **§2.15**（设置面失败面 S15 收正——载荷 v2 `{scope, reason}` ∕ 段标+词化码 ∕ 单槽 `_lastFailure` 驻留 ∕ 关=销账 ∕ 关系句；九腿验收面在册）+ **§2.3** 增 autoThink 三链句 + **§1** Agent 行控件枚举补 `autoThink`；
  **§2.10** 收正：门调用点清单 6 处（含 `webview/input.js:125`——入口 6 经 hook 链路）+ `settings.js` 三处坐标按现盘收正（`:44` ∕ `:49` ∕ `:50-57`）；入口 6 段按现盘重述（footer `onClick` = hook 注入；`model-picker.js:25 ∕ :26` 系坐标退场 ⇒ 核 `model-menu.mjs:304` + 桥 `webview/input.js:33`）+ 判据域边界 ∕ 范围限制两处显式名单（`model-picker.js` ⇒ `input.js`）；
  **§3**：+ `settings.css` 越线登记行（现 385——本批不拆 ∕ 阈值 450 或样式族下次结构改动）；`settings.mjs` 登记读数回填（350 ⇒ 359）；`_confirmDelete` 登记条收正 ∕ 核销（到期条件达成——落 ①）。
  **零新语义**（实施随动 + 裁定导出项；`input.js` 坐标 = V2 舱后现盘）。

- 2026-09-25（**config 镜像写收口批 · 坐标 / 措辞收正（fix 轮 2）· eng-designer**——承 `docs/batches/2026-09-25-config-mirror-closeout.md`）：
  §2.14 三处坐标收正——徽标闪点 → `settings-agent.js:153-154`；种子循环 → `settings-panel-write.mjs:135-139`；`patch.advisor` 键缺席点 → `:174`。
  §3 残留族登记删 `WEBVIEW-PROTOCOL.md:111` 项（本轮已收正）+ 余项重编号。**零新语义**。

- 2026-09-25（**config 镜像写收口批 · 坐标收正（fix 轮）· eng-designer**——承 `docs/batches/2026-09-25-config-mirror-closeout.md`）：§2.14 按实读收正——`handleSetAdvisorGuard` → `:161-167`；已删旧位三处标「原 …；本批已删」；种子循环 → `:135-139`；槽写推段 → `:146-147`/`:181-183`；机检档 → `config-io-panel-guard.test.mjs`（用例 T-1–T-8）。**零新语义**。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮（上抛处置）· eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #225）：规范面修订式标记清理（上抛 3 处）——§2.10「受裁例外条作废 / 需求侧措辞已作废」转裁定语（承用户 08:11 裁定 A）；§3 处置沿革条去「例外条作废 →」对照语（留「判据句 = §2.10」）。**语义零改**。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #225）：规范面修订式标记清理——零回归锚句去「原「行 4 = 零回归锚」条作废」对照语（留现行锚）。**语义零改**。


- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/design/SETTINGS.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；
  批次材料（问题陈述 / 方案选型 / 受影响文件 / 用例表 / 验收标准 / 边界 / 计数）与归档史入 §4 不并项；
  `~` 展开机制改为**指向单源** `docs/core/design/MEMORY.md` §6.7（D2）；
  坐标改写为仓根相对现状路径（**源档漂移 2 处收正**：`setup.mjs` `:232`→`:237`、`shell.mjs` `:233`→`:229`）。
- 2026-09-18（**VSC 配置页接线修复批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §2）：新增 **§2.8**（设置面快照到达与写值纪律——打开拍必达 / 控件级回填 / 基线 + 逐字段发值判据 / 空值⇒删除路径册）与 **§2.9**（Shell 写面接线圈）；§2.3 Shell 行补写面指针；§3 +1 条残留登记；§5 +U-S8/U-S9/U-S10。
- 2026-09-18（**VSC 配置页接线修复批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §3 发现 2 / 8 / 9）：
  §2.8 **基线判据重定义**（基线 = 控件最后一次被写入值——跳过聚焦控件 ⇒ 基线冻结，补判别句 + 用例格）；§2.8 回填表 Shell 行改指 §2.9；
  §2.9 补**「回显全表达式」**条（路径册 #3 同指）；§2.8 路径册 #1 补边界子路径；§3 残留 +1（无 `proxy.uri` 时 web / model 改写零落盘）。**零新语义**（判据 / 定性 / 登记面）。
- 2026-09-18（**VSC 配置页接线修复批 · 实现轮** · eng-coder——承 `docs/batches/2026-09-18-vsc-settings-wiring.md` §2；表体随实现同步）：
  §2.8 机检面去「（拟新增）」×3（三档已建成并登记 `thincoder-vscode/test/files.mjs`）+ 补发面机检档指针；§2.8 / §2.9 的机制与判据**零改**（实现逐条落地：打开拍回批固定序 · 四点控件级回填 · 基线判据 + 逐字段载荷 · Shell 写面接线与回显全表达式）。
- 2026-09-18（**VSC 密钥类删除二次确认批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-key-delete-confirm.md` §1 / 需求档 `requirements/WEBVIEW.md` F-W17）：新增 **§2.10**（类判据 + 入口册 5 行 + 弹框契约 + 四条取消路径 + 协议零增 + 密钥行载体绑定）；§3 +1 条残留登记（弹框形态三处同族重复——消解路径 + 到期条件）；§5 +U-S11。
- 2026-09-18（**VSC 密钥类删除二次确认批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-vsc-key-delete-confirm.md` §3 发现 1 / 2 / 4 / 6）：
  §2.10 补**判据域边界**（结构对账扫描域 = 设置面档 `webview/settings*.js`——`deleteSession` 不属本判据域）；§2.10 **载体绑定范围明示**（该行两个控件 = 编辑钮 + `✕`，同一单点）；
  弹框**清除入口收敛为 1**（`closeSettings()` 经同档导出的同一清除入口）；坐标收正（`settings-tools.js:21` → `:20`）。**零新语义**（域边界 / 范围明示 / 清除入口 / 坐标）。
- 2026-09-18（**文档卫生轮 · 父侧直接执行**——承 `docs/batches/2026-09-18-vsc-key-delete-confirm.md` §5.7 上抛 1 的漂移册）：§2.10 坐标按实读收正——
  入口册与 handler（`settings-tools.js` `:263`→`:270` · `:276`→`:283` · `:42-44`→`:45-47` · `:25-27`→`:27-29` · MCP `:180`→`:187` · `:184-188`→`:191-195`）· 两处 `onCancel` 重建位（`:20`/`:37`→`:22`/`:40`）；
  `rerenderKeyRow` → **`renderKeyRow`**（`:305-315`）· 签名三参 `{ skipWhileEditing }` · 取消路径 #4 明示**收敛域 = 设置面档**（域外 `chat.js:103-104` = 既有零改面）；
  另收正 `settings.js:41`→`:43` · `closeSettings()` `:102-107`→`:116-122` · `renderMcpList` `:158-220`→`:165-227` · 表单读段 `:119-128`/`:131` → `:117-136`/`:138`。**零新语义**（仅坐标 / 名称 / 签名 / 收敛域）。
- 2026-09-18（**VSC MCP server 行删除二次确认批 · eng-designer**——承 `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md` §1 / 需求档 `requirements/WEBVIEW.md` F-W17 扩域）：
  §2.10 类判据按**可复得性**重述（密钥类 ⇒ 不可复得类 · 可逆类 ⇒ 可重填类）+ 入口册 #5（MCP server 行 ✕）**归类改判入本门**（改动 = 绑定位门名 + 载荷闭包；生成位 `settings-tools.js:187` 逐字零改）+ #4 provider 行标**受裁例外**；
  补「MCP 行载体」段与需求侧对位（同源映射）；判据域边界同步（域内 4 名全落本门 · `_confirmDelete` 实参内 `delete*` = 空集）；§5 U-S11 类名同步；§3 +2 条登记（provider 行凭证归类张力 · 弹框文案的类贴合度）。
- 2026-09-18（**VSC MCP server 行删除二次确认批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md` §3 发现 1② / 4 / 5 / 8 / 9 / 10 / 11）：
  §2.10 类判据句本体补**受裁例外条**（provider 行 + 裁据两条——判据句与实例册同读一致）；弹框契约补**载荷闭包判别面明示**（W17-23 不判闭包形态——整表重建下两形态同载荷）；
  取消路径表补**入口级覆盖列** + 「逐入口完备性」注（#2 / #3 = 同件等价覆盖）；文案改**类通用式**（值级改写 · 键数不变 · 键名不动——zh / en 值在册）；
  机检面范围收正 **W17-1…W17-25** + 边界括注补「多行取目标」；判据域边界补**命名形态依赖**（fail-closed 域 = `delete*` 命名集）；
  §3 +2 条拆分登记（`settings-tools.js` · 用例档的 300 线复核结论 + 触发阈值 + 组边界）+ 文案面 / 归类面两条登记标记**已裁**（② 案）。**零新语义**（例外 / 覆盖 / 边界 / 拆分复核 / 定案标记均为评审发现 + 父侧裁定的直接导出项；机制条文其余零改）。
- 2026-09-18（**init-block 批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-init-block.md` §3 发现 1 / 3 / 4 / 5 / 9 / 12）：
  §2.12 补**采样器落点**（`loop-sampler.mjs` 新建 · 三常量 · 注入缝 · 窗口起止）· **重试窗口起止** · **重探成功三清除语义** · **展示面分档**（`不可用` / `宿主繁忙` 状态词级 + 双向机检判据 + 收窄裁定被拒理由）；
  §2.12 载荷段改端侧装配 + 核语义指针（`PROVIDER.md` §6.16——D2）；§2.11 补 **F-W18 静默判据取值方式三路** + 推送函数坐标收正（`chat-panel.mjs:319`/`:318-337` → `:321`/`:354`·`:339`）；补端侧机检面点名（`loop-sampler.test.mjs` 新建 / `provider-admission.test.mjs` / `settings-open-snapshots.test.mjs`）。**零新语义**（均为评审发现 + 父侧裁定的直接导出项）。
- 2026-09-19（**init-block 批 · fix 轮 5** · eng-designer——承 `docs/batches/2026-09-18-init-block.md` §6 第 8 / 10 项）：
  §2.11 推送函数坐标收正（`:75` / `:87` / `:261` → `chat-panel.mjs:331` / `:370`（定义）· `:353`（调用））+ memo 指针 `:53`→`:58` + 逐序断言指针 `:72-77`→`:73-83`；
  §2.12 落账消费点收正（`:272` / `:301` → `provider-probe-window.mjs:71` / `:76` + `thincoder-vscode/src/extension/settings.mjs:137` / `:144` / `:148`）+ **重试常量补记**（`PROBE_RETRY_MAX` / `PROBE_RETRY_DELAY_MS` + 让位上限 = 同值）；采样器落点清「（拟新增）」。**零新语义**。
- 2026-09-19（**init-block 批 · fix 轮 6** · eng-designer——承 `docs/batches/2026-09-18-init-block.md` §2 fix 轮 5 上抛 1 / 2 / 3）：
  §2.11 病根条 memo 坐标裁定：保 as-of `:53` + 加「现值见本段设计条」指引（病根段整段同纪年）；
  收正 `thincoder-vscode/src/extension/settings.mjs:122`→`:221`（re-export）· `:246-257`→`:276-287` · `settings-panel-write.mjs:158-165`→`:162-169` · `:249-250`→`:279-280`（`:126` / `:318` 两处同收）；
  `settings-env.js:44-45`→`:115`（proxy 发值路径 `flashSaved` 调用——`:127` / `:318` 两处同收）；§2.3 追段表补 `loop-sampler.mjs`（**82**）。**零新语义**。
- 2026-09-19（**VSC provider 行删除二次确认批 · eng-designer**——承 `docs/batches/2026-09-19-vsc-provider-delete-confirm.md` §1 / 需求档 `requirements/WEBVIEW.md` F-W17（判据句收正）+ 用户 08:11 裁定 A）：
  §2.10 **类判据句** = 受裁例外条**作废**（provider 行判入不可复得类——删整条时 `apiKey` 原文随条目消失）+ 新增「本批后态（唯一门）」（可重填类空域 / 直通门零调用点 / 删除入口唯一通道 = `_confirmSecretDelete`）；
  入口册 **#4 改判**（类列 + 载体列重写）+ 原「行 4 = 零回归锚」条作废（新锚 = `_confirmDelete` 调用点 = 0）+ 新增「provider 行载体（本批改判 · 两处）」段（卡 HTML 载体行内 `onclick` → `data-name` + 卡级装配位 `addEventListener`；`_removeProvider` 只改门名）；
  载体绑定段 provider 句收正；需求侧对位句重述；取消路径表 #1 / #4 补 provider 入口例（W17-27 / W17-28）；判据域边界同步（域内 **5 名**全落本门 + 扫描名族 `delete*` ∪ `remove*` + 「命名 / 书写 / 枚举」三层范围限制——MCP 批代码评审 🔵4 的建议项同笔落地）；
  机检面收正 **W17-1…W17-30** + 组拆分登记指针；§5 U-S11 同步；§3 = provider 归类张力条**核销** + 用例档拆分条改判（439 → 预估 ~516，触发拆分）+ 新增直通门死码 / 注释失实登记。**零新语义**（均为需求档收正 + 用户裁定 + 已登记发现项的直接导出）。
- 2026-09-19（**VSC 模型菜单删除确认批 · eng-designer**——承 `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md` §1 / 需求档 `requirements/WEBVIEW.md` F-W17 **入口册 #6/6**——口径 = 册序，2026-09-19 定案）：
  §2.10 入口册 **+#6 行**（模型菜单 footer「− Remove provider…」——`removeProvider` 第二载体；settings 面板行 − = 行 4 已收口）+ 新增「模型菜单入口」段（载体单点改动 / 三案取舍 = **取 webview 侧调用点**，否决宿主二次确认 · 宿主回传 name · webview 自建选择面 / `btn = null` 依据 / 单点依赖 / 本席实跑先红读数）；
  类判据「入口册 1–5」→「**1–6**」（两处）+ §5 U-S11 计数同步；取消路径表 #1 / #4 覆盖列 + 「逐入口完备性」补入口 6（专属形态 = 无行内复原型态 / 路径 #4 不适用）；
  判据域边界 **8 → 9 档**（+`webview/model-picker.js`）+ **D3 计数映射 6 行 ↔ 5 名**（行 4 / 行 6 同名 `removeProvider`——域内 **2 处**发射）；
  机检面 +`thincoder-vscode/test/model-menu-delete-confirm.test.mjs`（拟新增 · W17-31…W17-34）+ W17-17 改判（域扩）；§3 +1 条（确认不绑定目标——代价 + 补偿 + 消解路径 + 到期条件）。
  **零新语义**（均为批档 §1 条目 + 门位选型 + 本席实跑读数的直接导出；机制条文其余零改）。
- 2026-09-25（**规格·effort 轮 · eng-designer**——承 `docs/batches/2026-09-25-spec-effort.md` §2 · 台账 #331 / #330）：新增 **§2.13 Advisor effort 键接线**（`effort` → `reasoningEffort`、off 形、旧键读回+删、未渲染不发字段）+ **U-S12**（三态语义）；effort 归一规则单源指 `doc:MODEL-SPECS.md:§15.4`（本档不复述规则体）。
  需求档 P2-4 的 advisor-effort 半消解（只报，需求档笔不在本席）。
- 2026-09-25（**off 形族收尾批 · eng-designer**——承 `docs/batches/2026-09-25-off-family-closeout.md` §2 · 台账 #334 / #335 / #346）：§2.13 读面行补 **off 哨兵 × 无 `none` 档 ⇒ 预选「—」（不落注册默认）**（规则单源 = `doc:MODEL-SPECS.md:§16.5`）；off 形族规则体与两菜单形态零改。
- 2026-09-25（**规格·effort 轮 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承 `docs/batches/2026-09-25-spec-effort.md` §3 轮次 1）：§2.13 off 形行**收正为族别形**（规则单源 = `doc:MODEL-SPECS.md:§15.4-2`——原单式只覆盖自定义开值族，effort 族落 `{type:"disabled"}` 时载荷门不开）
  + 「—」行补 off 形跨保存存活注（写面种子循环 carve-out——`§15.4-5`）+ 旧键行补读面优先级指针（`§15.4-4`）+ **新增读面行**；§3 新增 `settings.mjs`（**409** 行）拆分复核登记（结论 = 本批不拆 · 组边界 · 阈值 450）。
  **零新语义**（= 评审发现 #1 / #3 / #5 的直接导出项）。
- 2026-09-25（**config 镜像写收口批 · eng-designer**——承 `docs/batches/2026-09-25-config-mirror-closeout.md` §2 · 台账 #380 / #362 · 用户 2026-09-25 16:37 裁定①）：
  新增 **§2.14**（advisor.guard 停 config 镜像写——槽唯一权威；通用保存面删 guard 赋值行 + 白名单删 `engineering`；面板复选框改接既有 `setAdvisorGuard` 消息）+ **U-S13**；
  §3 +2 条登记（`advisor.guard: null` 用例域边界 · 镜像撤写后的措辞残余族——域外坐标一览 + 消解路径 + 到期条件）。读面零改；协议零增量。
- 2026-09-25（**config 镜像写收口批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承 `docs/batches/2026-09-25-config-mirror-closeout.md` §3 轮次 1）：§2.14 读面零改句收正（删错面 `agent-state.mjs:93-101` 引用 ⇒ 快照构建槽优先 + 复选框随建面 / 重开渲染）+ 机检面 `null` 格改「保存后键缺席」+ 补零「已保存」徽标明示（与工具栏同口径）；
  §3 `advisor.guard: null` 行静态预期定死（保存后键缺席——机制链 + 到期条件收正）。**零新语义**（= 评审发现 #2–#4 的直接导出项；#1 = 协议档表体随实现同步，见批档 §2）。
- 2026-09-29（**批 parity-b4 · 实施收正轮 · eng-coder**——承 `docs/batches/2026-09-29-parity-b4-vsc-small.md` §2.7-W3）：provider-flows 宿主侧链三处坐标重锚（QuickPick 面 ∕ 目标候选单源 ∕ 选定步——VSC 副本已随本批迁移改指核 `thincoder-core/provider-flows.mjs`）。**零新语义**（实施随动）。
- 2026-09-29（**parity-b10-ui 批 · W6 文档随动轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b10-ui.md` §2.7 文档随动表 ∕ §5 W1 舱）：§3 拆分复核行按盘重锚（**410 ⇒ 350**——B10 S17 族出档后净减；仍越 300 ∕ <450 阈值 ⇒ 拆分计划维持）；**遮罩字面单源（S13）**：VSC `settings.mjs` `masked` 值 = 核 `MASKED`（`••••（masked）`，
`thincoder-vscode/src/extension/settings.mjs:18` import ∕ `:80` 消费）——本档无遮罩字面直述面（实读核讫——原 `****` 引文仅存于弹框改写沿革句 = 记录面）。明细 = 批档 §2。
- 2026-09-30（**vsc-residuals 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-vsc-residuals.md` §2 · 台账 #675 ∕ #680）：
  §2.15「extension 面」站点 7⇒8（agent 保存路径接入——`panel-messages-settings.mjs:143` 冲突串接 `postProviderError`；返回串源 = `settings-panel-write.mjs:172`）+ 机检面补本批件指针；
  §2.8 ∕ §2.10 三处 `settings.js` 坐标按现盘收正（`:78-100`⇒`:142-161` · `:116-122` + `:120` ⇒ `:163-172` + `:167` · `:131`⇒`:181`）。**零新语义**（站点接入 = 本批设计导出项；余为纯坐标收正）。
- 2026-09-30（**vsc-residuals 批 · 实施后随动重锚轮 · eng-designer**——承 `docs/batches/2026-09-30-vsc-residuals.md` §2.11 · 台账 #675 ∕ #680）：
  §2.11（F-W18）锚 `panel-messages-settings.mjs:186` ⇒ `:186-187`（同档 JSDoc ∕ 函数行）· §2.15 站点锚 `:143` ⇒ `:143-144`（err 捕获 ∕ 发射两行）· §2.14 `handleSetAdvisorGuard:161-167` 实读在位（零改）。坐标口径 = 实施轮落盘后终态实读（as-of 2026-09-30）。**零新语义**。
- 2026-09-30（**vsc-cleanup 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-vsc-cleanup.md` §2 · 台账 #701）：§2.4 补**装配面第二源**句（项目根 `.mcp.json` 并入装配——单层发现 ∕ 零交互信任 ∕ config 同名优先；管理面仍 config 单源；机制单源 = `doc:MCP.md:§6.4`）。**零新语义**（已裁形态的 VSC 面落档）。
- 2026-10-01（**vsc-cleanup 批 · 设计修复轮 1（评审轮 1 发现 7 ∕ 10）· eng-designer**——承 `docs/batches/2026-09-30-vsc-cleanup.md` §3）：§2.15 计数收正（「8 站点」⇒ 19 = 既有 9 ＋本批接入 10）+ 站点表补齐（`:198` ＋本批 10 站）；`:437` 助手坐标收正（`:300-303`⇒`:309-312`）；§2.8 ∕ §3 删除语义坐标重锚（`:276-287` ∕ `:279-280` ⇒ `:231`）。**零新语义**（评审发现 + 坐标收正）。
- 2026-10-01（**记录清账批 · 文档面收正轮 · eng-designer**——承 `docs/batches/2026-10-01-records-docs-reconcile.md` §2 · 台账 #696）：超宽表行断行收形 1 处（`:389`「读面（预选取值）」——表行续行拆分（空首列续行）——单行 ≤300 ∥ 内容逐字零改 ∥ 条目数不变）。**零新语义**（断行）。明细 = 批档 §2。
- 2026-10-02（**桌面 UX 收尾批 · 收口补充轮（VSC 侧）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §1 ∥ §5 · 台账 #697）：§2.5 P1 条定形值回填（词键 = `settings.indexDbSize` 整行模板 ∥ `settings.indexOriginCounts` 计数片段——两语值在册；形 = `#index-db-size` ∥ `#index-origins` 两读——缺位隐藏）；同笔按语义边界折行（原 442 超宽 ⇒ 四行 ≤300——零语义）。**零新语义**（回填 ∥ 折行）。明细 = 批档 §2。
- 2026-10-04（**issue 修复批·三 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round3.md` §2 · 台账 #823）：§2.4 补 **MCP 警告消费**句（装配尾入 `_pendingReminders`——首两段逐字同 CLI ∥ 末行指设置面 Reconnect ∥ 同指纹不重推 ∥ 零警告零写；机制单源 = `doc:MCP.md:§6.4`）。**零新语义**（端差归零落档）。明细 = 批档 §2。
- 2026-10-07（**MCP 键值行式输入批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-07-mcp-kv-input.md` §1 ∥ §2 · 台账 #1036）：§2.4 补 **env ∥ headers 行式键值**段（行 = 键格 + 值格 + ✕ ∥ 提交四判据 ∥ 值 = 字面 ∥ 粘贴零解析 ∥ 单行值边界）；§1 卡表行 MCP 面实现入口补 `webview/settings-mcp.js`；§2.10 拆分复核条翻「触发条款达成 ⇒ 拆档已执行」（MCP 面出档 `settings-mcp.js`——先拆后改）；§5 增 **U-S17**。
  **实施后回填面** = 本档 §2.10 入口册 #5 坐标（`:206` ∥ `:210`）∥ MCP token/headers 表单读段（`:220-221`）∥ `renderMcpList` 坐标（`:228` ∥ `:240`）∥ 行载体段（`:277-281`）——`settings-tools.js` ⇒ `settings-mcp.js`；`docs/vsc/design/WEBVIEW-PROTOCOL.md` 发射坐标七行（`:492 ∥ :496 ∥ :498 ∥ :502 ∥ :510 ∥ :517 ∥ :532`）同拍。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-07（**MCP 键值行式输入批 · 设计轮续笔核验（重启接续）· eng-designer**——承本批批档 §2 追记⑥ · 台账 #1036）：§2.10 两处时态按实读收正（「拆档已执行」⇒「拆档执行」∥「已建」⇒「拟新增」——设计轮产品码零触 ∥ 新档实未建）；
  变更行「实施后回填面」四组坐标按现读收正（+5——`:206` ∥ `:210` ∥ `:220-221` ∥ `:228` ∥ `:240` ∥ `:277-281`）。**零新语义**（时态 ∥ 坐标）。明细 = 批档 §2 追记⑥。
