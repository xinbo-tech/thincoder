# 配置面板（Settings Panel）— 现行设计

> 状态：**现行权威源**（2026-08-25 合并自 6 份历史批次文档，单一权威源纪律）。历史文档归档于 `docs/design/_archive/`（文件名保留，地图不再单独列出）。

> 归档来源（已退役归档——归位 `docs/design/_archive/`）：`docs/design/_archive/SETTINGS-PANEL.md`（批次 A）、`docs/design/_archive/SETTINGS-PANEL-2.md`（批次 B/C/D）、`docs/design/_archive/SETTINGS-PANEL-PROXY-ROW.md`、
> `docs/design/_archive/SETTINGS-REORG.md`（重组）、`docs/design/_archive/SETTINGS-SUBMODEL-SHELL.md`、`docs/design/_archive/MODEL-PICKER-UNIFY.md`（模型选择统一）——全部已实施，细节见各归档文档。

## 1. 信息架构（5 卡，2026-08-15 REORG 定稿）

面板打开时整体重建（**单一状态源 = config.json**；DOM/模块变量无独立状态，回声压制等历史补丁随重组移除）。卡片按使用频率排序：

| 卡 | 内容 | 实现入口 |
|---|---|---|
| **Providers** | provider 行（dot / label / masked key / model·baseURL / proxy 勾选 / Key / −）+ Add 表单（preset 下拉 + 获取模型） | `webview/settings-providers.js` |
| **Agent** | maxTurns（默认 200）、subagentTurns（默认 100）、compactThreshold（空=auto）、verifyGuard + Subagent models（global + explore/plan/coder/eng-coder，modelMenu 槽位） | `webview/settings-agent.js` |
| **Consult & Advisor** | 会诊行（modelMenu + effort 档 + ✕、+ 添加）+ Advisor（guard + provider/model + effort） | `webview/settings-agent.js` |
| **Tools & Services** | MCP servers（列表 + stdio/http/ws 表单 + 连接状态 ●/○ + Reconnect）+ Web Search key + Semantic Index（key + Build） | `webview/settings-tools.js` |
| **Environment** | Proxy（URI / web / model 双开关 / Test）+ Shell（平台感知候选） | `webview/settings-env.js` |

## 2. 关键语义（跨卡片契约）

### 2.1 Provider 管理

- 存储：共享 `~/.thincoder/config.json` 的 `providers[]` + `activeProvider`（CLI 同源）。activeProvider 由模型选择隐式更新，**无手动设置入口**（2026-08-03 决策）。
- ✕ = 删 provider 条目（非删 key）；[Key] = 改 key。
- 行内 proxy 勾选 = `provider.proxy: true`；与全局 `proxy.model` **双开关**（都开才走代理，`injectProxy` 语义）。
- Custom provider 支持三协议（openai / anthropic / google），format 字段落盘。

### 2.2 模型选择统一（2026-08-14 六处风格收敛）

所有"选模型"控件统一复用**主面板同款两级悬停子菜单**（provider 行 → 模型列表；否决原生下拉与搜索框——千问系几十个模型原生下拉不可用）。会诊与 Advisor 行带**思考强度档**（effort 显式落盘，不留隐式继承；过时由用户自改）；subagent **不带** effort（深度由主 agent 派任务时表达）。

### 2.3 Agent 运行参数

- 写入链：面板 → `saveAgentSettingsFromPanel`（单写通道）→ config.json `agent.*`。
  **advisor 字段级合并**（GitHub #3 修复，2026-08-29）：payload 缺键从磁盘回填（CLI 写入的 provider/model/thinking/reasoningEffort 面板保存后存活），显式 `null`/`''` = 清空删除；wire 层空槽位必须发 `null` 而非 `undefined`（postMessage JSON 序列化丢弃 undefined 键——缺失与清空必须可区分）。timeoutMs 透传保留手写值。
- 面板打开即拉新：`openSettings` → `getAgentSettings`（webview→extension）→ extension 重读盘推送 `agentSettings`（extension→webview）→ 收到后渲染（250ms 超时回退用快照）。CLI `/advisor` 写盘后打开面板即可见。
- subagentModels 优先级：工具 model 参数 > `subagentModels[role]` > `subagentModel` > 父 provider。
- Shell 为 config.json **顶层字段**（不在 agent 下），独立消息通道；平台感知候选（System default / pwsh / Git Bash / WSL）。

### 2.4 MCP 存储

共享 config.json `mcp.servers[]`（CLI 同格式）；旧 VS Code settings 已一次性迁移。重名拒绝、args 空格分隔、env KEY=value。

### 2.5 语义索引

embedding key + 构建按钮 + 状态；向量维度/模型切换的校验与可见面（第 21 批收口）见 `MEMORY.md` §4——
状态行在不匹配时显示「索引模型 ≠ 当前模型 + 重建入口」（`settings.indexMismatch`），提示面同源扩展。

### 2.6 外部写感知（config.json 事件驱动刷新——第 21 批，2026-09-11）

> 需求层 = `MULTI-INSTANCE-COLLAB（CLI 侧）§2`（F6 / N5–N6）。
> 来源批次 = `2026-09-11-VSC-INDEX-PERCEPTION（CLI 侧）§1` 条目 B5。
> 现状锚（as-of 2026-09-11）：`src/extension/chat-panel.mjs:316`（`_pushSettingsLight` 推送面已在位——缺的是触发）。

**问题**：`~/.thincoder/config.json` 为双端共享单文件；外部（CLI `/advisor`、`settings set`、手工编辑）
写盘后面板常开时**零感知**（现状只在打开面板 / 保存动作时拉快照）。

**方案选型**（判据 = 外部写 → 面板可见；含代价）：

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **宿主文件系统事件（`createFileSystemWatcher`）+ 去抖 + stat 元组抑制** | 可见：✅（事件到达即推）；代价：新模块 ~55 行 + 生命周期（activate 注册 / dispose 释放） | 事件驱动零空转；`RelativePattern(Uri.file(configDir), "config.json")` 覆盖工作区外路径（engines ^1.85.0 支持 Uri 基座） | **选定** |
| 2 | 常驻轮询（stat 比对） | 可见：⚠️（延迟 = 轮询间隔）；代价：稳态唤醒（写盘是低频事件——收益为负） | — | 否决 |
| 3 | 仅窗口焦点回归时刷新 | 覆盖：❌（主场景 = VSC 前台 + 集成终端里 CLI 写盘——窗口不失焦） | — | 否决 |
| 4 | 手动刷新按钮 | 手动 ≠ 感知（现状等价） | — | 否决 |

**契约**：`startConfigWatch({ onChange, debounceMs = 300, configPath }) → { dispose, noteSelfWrite }`（新模块
`src/extension/config-watch.mjs`，纯装配——不含业务；`configPath` 缺省 = config-io `_configPath()` 当前值）：

- 注册 `createFileSystemWatcher(new RelativePattern(Uri.file(dirname(configPath)), basename(configPath)))`，
  监听 change / create / delete 三类事件；
- 事件 → 去抖（`debounceMs`）→ **stat 元组（mtimeMs + size）与基线比对**：同 → 零推送；异 → `onChange()`
  （比对后基线更新为当前元组）；启动时基线 = 启动时 stat；
- **基线回填（自写抑制——评审 #2 采纳 ①）**：`noteSelfWrite()` = 重取当前元组置为基线；时机 = 本进程写盘成功后——
  `saveRaw`（config-io 写盘唯一通道：`persistRaw`/面板写面/工具面/迁移写回全经此）在写成功路径上经
  `onConfigSelfWrite(fn)`（config-io 新增导出——注册返回退订）同步回调；`startConfigWatch` 内部订阅
  （退订随 `dispose`）——扩展自写 ⇒ 事件到达时元组已等于基线 ⇒ 零推送（不抖动面板）；外部写（无回调）
  ⇒ 元组异于基线 ⇒ `onChange()`；
- `dispose()` 释放 watcher 与挂起定时器（含自写订阅退订）；
- **降级**：宿主 API 缺失或构造抛错 → 返回 no-op `{ dispose(){} }`（不阻断激活——面板打开拉新的既有路径兜底）。

**装配（`extension.mjs`）**：activate 内 `context.subscriptions.push(startConfigWatch({ onChange: () => _panel?._pushSettingsLight?.() }))`
——复用既有轻量推送面（无网络探测、不重建面板请求路径）；自写通知订阅在模块内部建立
（`onConfigSelfWrite`——见契约；装配面零增行）。

**关键决策**：

| # | 决策 | 否决备选与理由 |
|---|---|---|
| D-S1 | 事件驱动（选型 #1） | 轮询（稳态唤醒无收益）· 焦点触发（主场景覆盖不到）· 手动（现状等价） |
| D-S2 | 去抖 + stat 元组抑制 + **自写后基线回填**（契约——评审 #2 采纳 ①） | 裸推送：扩展自写与外部写不可区分——面板会在用户编辑中被快照重建（`_pushSettingsLight` 注释明载该风险） |
| D-S3 | 新模块 + `extension.mjs` 装配（不塞入 `chat-panel.mjs`/`panel-messages.mjs`） | 后两者 420/468 行贴线；watcher 生命周期属扩展宿主级（非面板级） |

**受影响文件（实施域）**：`src/extension/config-watch.mjs`（新 → ~65——含基线/自写订阅面）· `src/config-io.mjs`
（455 → ~465——`onConfigSelfWrite` 订阅面 + `saveRaw` 写成功回调）· `extension.mjs`（83 → ~92）·
`test/config-watch.test.mjs`（新 → ~110）· `test/vscode-mock/index.mjs`（141 → ~162——补 `createFileSystemWatcher` + `RelativePattern` 两枚 mock）· `test/files.mjs`（55 → 58——本批三新档合计 +3；本面 +1）。

> **档位注记**：新档 `config-watch.mjs` ~55 行（远低于警示线）；`extension.mjs` 83 → ~92——两档均在限内，无需拆分。

**用例表**：

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| T-S1 注册形状 | 桩 mock 捕获注册参数 | watcher 以（config 目录基座 + `config.json`）注册；三类监听全注册 | F6 / AC-S1 |
| T-S2 事件→推送 | 触发 change 事件（tmp 文件已改） | 去抖后 `onChange` 恰一次（多次事件合并一次） | F6 / AC-S1 |
| T-S3 自写抑制（真实序列——评审 #2 修订） | 经 `saveRaw` 自写沙箱 config（元组已变）→ change 事件到达 | 去抖后 `onChange` 零调用（基线已随自写刷新）；另断言冲突放弃路径零回调（无写即无自写） | N5 / AC-S2 |
| T-S3b 稳态零推送 | 基线建立后重复投递「元组未变」事件 | 第二次起零调用（元组未变故零推送——N5 原判据保持） | N5 / AC-S2 |
| T-S4 create / delete | 三类事件分别触发 | 同样走「去抖 → 元组判 → onChange」 | F6 / AC-S1 |
| T-S5 dispose | 触发 dispose 后再发事件 | 零推送、定时器已清 | N5 / AC-S2 |
| T-S6 降级 | mock 无 `createFileSystemWatcher`（或抛错） | 构造返回 `{dispose}`，零抛错 | N6 / AC-S2 |

**验收标准**：

- **AC-S1**（F6）：`node --test test/config-watch.test.mjs` T-S1/T-S2/T-S4 全绿（修前红：现状零 watcher——`createFileSystemWatcher` 全仓 grep 零命中）。
- **AC-S2**（N5/N6）：T-S3/T-S3b/T-S5/T-S6 全绿；既有设置面用例（`smoke-settings` / `settings-panel` / `config-io-panel`）零回归。

**边界（本批不做）**：不做进程内缓存同步（embedder `_tried` 缓存 / 会话槽不随外部写盘重载——登记）；
不改任何写盘语义（F5 mtime 门控原样）；不做 config 内容级 diff / 自动合并。

### 2.7 config 路径字段 `~` 展开（`shell`——群 A 批）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A2
> （指针 = CLI 批 `2026-09-11-HOME-EXPANSION.md`（CLI 仓）§十「VSC 镜像面——仅 `shell` 字段同病」）。
> 语义源：CLI 设计 `MEMORY.md` §9.3（单一规范化点 / 只读归一）；双端纪律：语义同源、本端独立实现。

**问题（现场复核——as-of 2026-09-11）**：`config.json` 的 `shell` 字段前缀 `~` 不展开——
`src/agent/setup.mjs:232`（`cfgShell = typeof raw.shell === "string" && raw.shell ? raw.shell : null`）→
`src/tools/shell.mjs:233`（`exec(..., { shell })`）**裸透传**：写成 `~/bin/bash` 的配置在 exec 时不可解析（跨端配置常带 `~`）。

**方案选型**（判据 = 单一归一点 / 消费端零改 / 可回归）：

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **读取点归一**：`setup.mjs:232` 读入时 `expandHome(raw.shell)`（单一规范化点；消费端收到的一定是绝对路径） | 与 CLI 同构（loadConfig 单一规范化点）；消费端（`shell.mjs`）零改；纯函数可注入 home | **选定** |
| 2 | 消费点展开（`shell.mjs:233` exec 前展开） | 每消费点各自展开（未来新增点必漏）；与 CLI 选型背离 | 否决 |
| 3 | 写盘侧归一后回写（`~` 换绝对路径持久化） | 毁配置可移植性（换机 / 换用户名即失效）——CLI 同款否决 | 否决 |

**契约（逐条）**：

1. 新模块 `src/expand-home.mjs`（本端独立实现，语义同 CLI）：`export function expandHome(p, home = homedir())`——
   `~` / `~/…` / `~\…` 前缀展开为主目录绝对路径；`~user` 等非分隔符形态原样；非字符串原样；余段分隔符归一（`\` → `/`）；
2. `src/agent/setup.mjs:232`：`cfgShell = s ? expandHome(s) : null`（`s` = 原判据值）——**唯一归一落点**；
3. **只读归一**：磁盘原文保留（不做写回）；面板 / settings 工具写面不展开（与 CLI 同 posture——运行时当次展开缺口 = 登记）；
4. `src/tools/shell.mjs` 零改（收到的已绝对）；`agent-state.mjs` 透传面零改。

**用例表（T-MA2-1–5——正常 / 边界 / 错误；纯函数 + setup 读取两点）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA2-1 | 正常 | `expandHome("~/bin/bash", "/h/u")` | `join("/h/u", "bin/bash")`（正斜杠前缀） | AC-MA2-1 |
| T-MA2-2 | 边界 | `"~"` / `"~/"` / `"~\\"`（裸 / 尾分隔） | `home` / `home` / `home` | AC-MA2-1 |
| T-MA2-3 | 边界 | `"~user/x"` / `"a/~/b"` / `"x~"` | 原样（不猜用户 / 仅前缀） | AC-MA2-1 |
| T-MA2-4 | 错误 | `null` / `undefined` / 数字 / 对象 | 原样透传（类型护栏——`shell: null` 零值形态不变） | AC-MA2-1 |
| T-MA2-5 | 正常（接线） | 桩配置 `shell: "~/x"` → setup 读取段 | `cfgShell === join(homedir(), "x")`；`shell: null` → `null`（零值不变） | AC-MA2-2 |

**AC（机判）**：

- AC-MA2-1：T-MA2-1–T-MA2-4 绿（形态矩阵逐字）；`grep -rn 'startsWith("~")' src` == 1 命中（`src/expand-home.mjs`——单一展开器）；
- AC-MA2-2：T-MA2-5 绿（接线）+ `src/tools/shell.mjs` 本批零改（`git diff` 判据）+ VSC 快层全绿 + 宽度零新增。

**边界**：不扩其他字段（VSC 无 `memory.dbPath` / `projectDir` / `team.dir` 对位——如实：本端仅 `shell` 同病）；不改 settings 工具形状护栏（`shell` 敏感键判定不动）；**零 UI 面**。

**计数（D3）**：用例 5（T-MA2-1–5）· AC 2（AC-MA2-1–2）· 实施域 3 档（新 `expand-home.mjs` + `setup.mjs` + 新测档）· 文档域 1 档（本节）。

## 3. 已知待办（不属本文档范围）

- design round2 专用提示词、ARCHITECTURE NFR 补全等见 `docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`）。

## 4. 变更记录

- 2026-09-11（群 A 批——VSC-MIRROR-SWEEP）：新增 §2.7（`shell` 字段 `~` 展开——单点归一 + 只读归一；新模块 `expand-home.mjs`）。

- 2026-09-11：第 21 批（VSC 设置面）——新增 §2.6 外部写感知（config.json 事件驱动刷新——B5）；
  §2.5 校验缺口指针由 `docs/TODO.md` 改指 `MEMORY.md` §4（本批收口）。
- 2026-09-11：第 21 批修正轮（设计评审轮次 1——#2 采纳 ① 基线回填）：§2.6 契约补 `noteSelfWrite`/`onConfigSelfWrite`
  接口与时机 + D-S2 注记 + T-S3 改真实自写序列（+T-S3b）+ 受影响文件 +`src/config-io.mjs`。
