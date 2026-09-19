# TUI 命令层与选择面 · CLI 面 · 设计

> 板块 = **TUI（终端界面）**（三档设计之一）——本档承载 **命令层**（slash 命令族 / 各命令菜单）与**选择面**
> （picker / wizard / question 三面契约）以及 agent ↔ 用户之间的**交互桥**（权限 / 提问）。
> 配对需求档 = `docs/cli/requirements/TUI.md`（本板块三档设计共用一份需求档——层归属不对称，理由见该档 §1 注）。
> 同板块其余两档 = `docs/cli/design/TUI.md`（界面核心）· `docs/cli/design/TUI-SESSION-VIEW.md`（会话视图 / 回合 / 内存）。
> 对位档 = `docs/vsc/design/WEBVIEW*.md`（VSC webview——无 picker / wizard 面；端差异登记、各端独立实现）。
> 建档：2026-09-15（**B 式迁移轮 · 第 6 批**——`thincoder-cli/docs/design/TUI.md` 的 §9 / §12 / §13 面重建入本档；
> 旧档原地一字不改、留作参照历史）。
> 本档坐标与行数 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 定位与模块地图

> 本表是**结构性快照**——新增 / 改名 / 删除文件时同批回写。**行数列不并**（as-of 数值随实现漂移）。

### 命令层

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/slash-commands.mjs` | `SLASH_COMMANDS` 表 + `SLASH_ALIASES` + `HANDLERS` 分派（handler 异常统一拦截成 `[error]` 行——不击穿 TUI 主循环）+ `completions` / Tab 循环 |
| `thincoder-cli/src/tui/cmd-*.mjs`（单命令档族） | 每个命令实现独立成档：`cmd-auto` / `cmd-clear` / `cmd-config` / `cmd-copy` / `cmd-eng` / `cmd-exit` / `cmd-extract`+`distill-cmd` / `cmd-fold` / `cmd-goal` / `cmd-help` / `cmd-init` / `cmd-mcp` / `cmd-mcp-form` / `cmd-model` / `cmd-new` / `cmd-plan` / `cmd-reindex` / `cmd-restore` / `cmd-session` / `cmd-shell` / `cmd-skills` / `cmd-submodel` / `cmd-think` / `cmd-undo` / `cmd-upgrade` / `cmd-advisor` |
| `thincoder-cli/src/tui/model-picker.mjs` | 模型两级选择器（provider → model，可 fetch `/models`、失败回退预设）+ `/model` Add / Remove / key 流程 + `pickModelForSlot`（子模型槽位） |
| `thincoder-cli/src/tui/model-catalog.mjs` | 模型清单目录面（供选择器构造条目） |
| `thincoder-cli/src/tui/ledger-surface.mjs` | 台账可见面渲染（配置菜单的台账摘要行） |

### 选择面与交互桥

| 文件 | 职责 |
|---|---|
| `thincoder-cli/src/tui/pickers.mjs` | 通用列表选择器（标题 / 条目 / filter / 位置指示 / 栈式嵌套）+ **`showPicker` 入口契约守卫**（§5.2）+ **删除类二次确认件 `confirmDelete`**（§5.4） |
| `thincoder-cli/src/tui/wizard.mjs` | 首启配置向导：provider 菜单（existing / preset / custom）→ 文本步 → 落盘 → 模型选择；Esc 全步可跳（无半配置落盘） |
| `thincoder-cli/src/tui/interaction.mjs` | 权限确认 / 批量确认 / 自由提问（question 工具桥）+ 权限内容预览 |
| `thincoder-cli/src/tui/config-helpers.mjs` | 配置落盘收口（`persistRaw` / `syncProviderField` / `maskKey`） |

## 2. 交互桥（`interaction.mjs`）

- **`askPermission(name, args)`**：`y` / `n` / `a`（批准并开启 AUTO）。
- **`askBatchPermission(req)`**：批量确认——`a` = approveAll（批范围，**非持久 AUTO 标志**）/ `o` = oneByOne / `n` = deny / Esc = deny。
- **`askQuestion(text, options)`**：选项列表（↑↓ / Enter / Esc）或自由文本——选项尾部 `QUESTION_CUSTOM` 哨兵项转自由文本；
  Esc = 回 options（有 options）或中止（无 options）。装配 `q.answer`（codepoint 数组）+ `q.cursor`。
  **自由文本态的键集 / 光标 / 渲染 = `docs/cli/design/TUI-INPUT-BOX.md` §7**（本档不重述——D2）。
- **权限内容预览**：bash 危险命令 ⚠️ 标注（**只提示不拦截**）、write / edit 落盘内容预览（cap 3000）。
- **接线条件**：callbacks 的权限 / 批权限 / 问答 handler **按 ctx 提供与否条件接线**——手动档 auto-turn 传 null → denied
  （不弹面板、question 报错不挂起——挂起 digest 无人值守语义，见 `docs/core/design/AGENT-LOOP.md` §9）。

## 3. 选择面分工与交互契约（三面一表）

| 项 | picker | wizard provider 步 | question options |
|---|---|---|---|
| **职责（分工）** | 全功能菜单面（配置 / 模型 / 会话等命令入口） | 首启向导面（流程 > 列表） | 提问工具面（选项 + 自由文本逃生口） |
| ↑↓ 语义 | 环绕（既有） | 环绕（既有） | **环绕**（末项 down → 第 0 项；首项 up → 末项） |
| 选中项可见性 | 自动滚动（既有） | 自动滚动 | 窗随选中（既有） |
| Enter / Esc | 选 / pop 当前层 | 选 / 取消整向导 | 确认 / 取消或回选项态 |
| 过滤 / 鼠标 / 层级栈 | 有 | 豁免（短列表 + 键盘驱动首启） | 豁免（短列表 + 协议绑定） |
| 位置指示（`n/m`） | 有 | 豁免（无过滤面——指示归 picker） | 豁免（输入框足迹） |

- **三面保留各自职责**（不合并实现）：合并只买来「单一实现」，却改变提问工具协议面与向导流程——改动面 / 风险与收益不匹配。
- **契约只锁三事**：① 同义键同形（↑↓ 环绕）② 选中项恒在可视窗内 ③ **Esc 恒有效**
  （三条「取消」语义由各自流程上下文决定：picker = 取消当前层 / wizard = 取消整个向导 / question = 取消提问或回选项态）。
- **面特有豁免落档（防后续误判为缺陷）**：过滤 / 鼠标 / 栈为 picker 的行数规模（模型清单 / 会话清单可长）与操作频度（命令入口）所需；
  wizard 候选 ≤ 十余项且为首启一次性流程；question 选项 = 模型给的少量候选项 + 输入框足迹。**不给两面补齐这些能力**（属加戏）。
- **未定项**：无（三面交互决策全落档）。

## 4. picker 附注渲染与宽度预算

**逐字渲染形态（item 行）**：`{prefix}{text}{marker}{note}`——

- `prefix` = `" ▸ "`（选中）/ `"   "`（未选中）；
- `marker` = `"  " + marker`（有 marker 时——`●` = 当前会话渠道）；
- `note` = `"  " + note`（有 note 时）；无 note 零追加（不产生尾随空格）。

例（未选中、无 key 渠道）：`   deepseek     deepseek-chat (ctx 128K) (no key)  https://api.deepseek.com`

- **宽度预算**：判定式 = **任意渲染行 `stringWidth ≤ cols − 8`**（含 `↑ more` / `↓ more` 指示行——指示位宽在 8 格余量外另扣、以 pad 补齐）；
  超宽右截断 + `…`。**保序 = prefix → text → marker → note；截断从行尾开始——note（附注段）最先牺牲**。
- **产出面**：渠道警示（`(no key)` / `(不可用)`）住条目 **`text`**、与既有状态标同簇（`(ctx …)` / `← session`）——
  **警示不位于最先牺牲段**；`note` 收窄为 baseURL（补充信息——预算内显示、超宽右截断可接受）。
- **header 行的 note 消费为既有面**（渠道列表的 header note——`(no key)` / `(fetch failed: …)`）——非本档新增面。

## 5. 命令层

### 5.1 命令族与执行纪律

- **登记面**：`thincoder-cli/src/tui/slash-commands.mjs`（`SLASH_COMMANDS` 表）+ 别名表 `SLASH_ALIASES`
  （`/h` → `/help` · `/x` → `/exit` · `/m` → `/model` · `/p` → `/plan` · `/t` → `/think` · `/c` → `/clear` · `/n` → `/new`）。
  当前清点（命令与分组的完整清单）= `docs/cli/requirements/FEATURES.md` §2.9。
- **分两类**：**即时反馈**（`/plan` `/auto` `/fold` 等本地状态切换）与**菜单循环**（`/config` `/think` `/mcp` `/provider` 等 picker 驱动）。
- **执行路径**：非 busy 期（含挂起空闲）经 submit 直执行（`handleSlash`——控制通道不排队）；busy 期命令全部禁发
  （Enter 提交吞——白名单已删；退出靠 Ctrl+C 终端层通道）。**handler 异常统一拦截成 `[error]` 行**——不击穿 TUI 主循环。
- **`completions(input)`**：按命令 / 参数补全；Tab 循环候选。

### 5.2 `showPicker(title, entries)` 入口契约

- **契约**：`entries` **必须是数组**（调用方义务——异步来源由调用方 `await` 后再传）。
  非数组 ⇒ **同步抛 `TypeError`**（含 `entries must be an array`；Promise 输入附 `await` 提示）——不静默、不裸抛下游 `entries.filter is not a function`。
- **守卫落点** = `showPicker` 入口**首行**（在 `closePicker()` **之前**——参数校验先行，非法输入不改变 picker 栈状态）：
  入口是全部 picker 调用的单一收口；事后防御（如 `rebuildLines` 内）的错误信息不指向调用点，诊断价值归零。
- **否决备选**：空集返回（静默不打开）——**静默吞掉编程错误**，菜单「打不开」无诊断，正是该缺陷的体验；否决。
- **不做静态源码断言锁**（如「grep `await <fn>(`」）：行为锁已足（修前红 / 修后绿）；内部实现锁属过度测试。
- **零触达核对**：既有调用点全部传数组字面量 / 数组变量 ⇒ 守卫零触达；`0-item` 保护与 picker 渲染 / 导航语义零改。

### 5.3 关键命令要点

- **`/submodel`**：子 agent 模型设置入口——与 `/model`（主会话模型）对称。5 种子 agent 类型（explore / plan / coder / eng-coder / eng-designer）
  各有独立配置项。无参时 picker 菜单列出全局 + 5 类型共 6 个槽位（各显示当前生效值与继承来源）→ 二级选择（provider → model）。
  参数直设路径保留（`/submodel <type> <value>` / `<value>` / `<type>` / `reset [type]`）。
  持久化到 `config.agent.subagentModel`（全局）与 `config.agent.subagentModels[role]`（类型级），立即生效。
  **优先级链：subagent 工具 `model` 参数 > 类型级 `subagentModels[role]` > 全局 `subagentModel` > 继承父 provider**（单一解析源）。
  **独立命令而非扩展 `/model`**：`/model` 语义是主会话 provider 切换，混入子模型会混淆。
- **`/shell`**：bash 工具 shell 配置入口。配置字段 = `config.shell`（路径 / 命令名；null = 系统默认）。
  **Windows 编码策略**：未配置 shell（cmd）时 bash 工具对每条命令自动前缀 `chcp 65001 >nul && `
  （子进程独立无副作用——cmd 的 GBK 输出不再乱码）；配置了 shell（git-bash / pwsh）时其原生输出即 UTF-8。
  picker 按平台列常用选项 + **可用性检测**（检测不到的自动隐藏——`where` / `command -v`，非零退出即隐藏；静默）；
  Custom path… 走自由文本输入。直参 `/shell <path|name>`（引号剥离）/ `/shell reset`（大小写不敏感）。
  生效 = 立即（bash 工具每次调用实时读配置）；持久化走 `persistRaw`；VSC 扩展共享同一 `config.json` 字段。
- **`/config`**：embedding 三件套落盘（补写 baseURL / model——已有值保留、缺省引用默认配置**不硬编码字面量**；
  存量仅 apiKey 的配置再次保存自动补齐）/ 代理 / 轮次 / 阈值等菜单循环。数值项手输属合理自由文本（非枚举）。
- **`/mcp`**：MCP 服务器管理（add / remove / connect / list / edit / test、token 一等字段、headers / env 键值对合并与 `k=` 删除语义、
  `✓ Save & test` 探活确认环、失败回同一表单）——**字段表单机制权威 = `docs/core/design/MCP.md` §5 / §8**，本档不重述。
- **`/advisor`**：评审模型 / 思考配置 + guard 开关（交互菜单循环）；Thinking 子菜单以**真实条目列表**打开。
- **其余命令**：见 §5.1 登记面与会话层文档；菜单循环类命令的 picker / 问答细节见各 `cmd-*.mjs` 文件头注释。

### 5.4 删除类入口显式确认门

**判据句**：删除类入口，若其副作用**销毁不可复得的原文或整条配置**（渠道 `apiKey` / MCP `token`）⇒ 用户选中目标后、
**落盘与生效之前**必须有一次**显式确认**——确认 ⇒ 原语义执行；**取消 ⇒ 零落盘 ∧ 零内存变更**。
判据源 = 用户 2026-09-19 08:21 逐字「应该补。」；与 VSC 端 `docs/vsc/requirements/WEBVIEW.md` **F-W17** 同判据、
**两端各自实现**（VSC 侧弹框面属另链，本档不涉及）。

**确认件（单源）** = `thincoder-cli/src/tui/pickers.mjs` 的 `confirmDelete`（picker 层通用绑定，与 `showPicker` / `closePicker`
同路装配进命令 ctx）。形态 = **既有二次确认 picker**：`showPicker(<问句>?, [Yes 动作行, "Cancel"], { defaultIndex: 1 })`；
`defaultIndex` 恒指向 **Cancel**（防误触 Enter 即删）；Esc / 选 Cancel ⇒ 返回未确认 ⇒ 调用方零动作。
装配缺键（ctx 无 `confirmDelete`）⇒ 入口**报错**（fail-closed）——**不得**降级为直删（缺门即报错，不静默放行）。

- **禁新造模态**：不引入新键位 / 新面板 / 新渲染面——形态与先例同源（`thincoder-cli/src/tui/cmd-clear.mjs:6-9` ·
  `thincoder-cli/src/tui/cmd-new.mjs:30-33`）；本件把该形态收口为单点（D2 单一权威源）。
  picker 栈式嵌套语义不变（确认面 = 独立一层：Enter 确认 / Esc 取消）。
- **取消语义（两入口同）**：两入口均为**先盘后存**（`persistRaw` 落盘 → 内存镜像 / 工具表收尾）⇒ 取消发生在落盘之前，
  即**零落盘 ⇒ 零内存变更**（无 ghost、无半删）。
- **默认落点（反误触）**：`defaultIndex: 1` = Cancel ⇒ 直接按 Enter 不会删除；确认须显式移到 Yes 行。

**入口册（实核 · 域 = `thincoder-cli/src/tui/**`）**：

| 入口 | 门位（载体） | 状态 |
|---|---|---|
| 渠道删除（`/model` → Remove provider…） | `thincoder-cli/src/tui/model-picker.mjs:374` `removeProviderFlow`（`persistRaw` 之前） | ✅ 本批过门（单一调用点 `:73`） |
| MCP server 删除（`/mcp` 菜单 → Remove） | `thincoder-cli/src/tui/cmd-mcp.mjs:84` `removeServer`（`persistRaw` 之前） | ✅ 本批过门（调用点 `:389`） |
| MCP server 删除（`/mcp remove <name>` 直参） | 同上——`removeServer` 是两条路径的单一收口 | ✅ 本批过门（调用点 `:331`） |
| 会话冷 GC（`thincoder session gc --confirm`） | 非 TUI 面（`thincoder-cli/bin/thincoder.mjs` → 核 `thincoder-core/session-gc.mjs`） | 已覆盖（`--confirm` 显式旗标——端面不同，不入 TUI 域） |

- **独立「删 key」入口 = 不存在**（实核）：`setKeyFlow`（`thincoder-cli/src/tui/model-picker.mjs:398`）是**设** key；
  `/config` 的 embedding key 同为设 key（`thincoder-cli/src/tui/cmd-config.mjs:38-41`——空输入直接返回、不写盘）。
  key 原文消失的路径**只有**上表两条已入册入口（渠道删除 / MCP server 删除）——无第三入口待门。

**判据域边界（不属本门 · 防误并）**：

- **表单清空保存类**（MCP `token` / `headers` / `env` 字段清空后 `✓ Save & test` 保存）不设本门——它是**编辑面**
  （预览 + 探活两步，非「选中即生效」的删除入口），语义归核 `docs/core/design/MCP.md` §5 / §8；
- `/clear` 与 `/new` 的确认件（同形先例）**不是删除类**——不并入本门、本批零改；
- **可复得类**不做门（context 清空 / 子模型槽位 reset 等：值可重填）——判据是**不可复得**，不是「凡是删」。

**机检面**：本门的结构对账 = 域内删除类入口逐名过门（fail-closed：未登记入口 ⇒ 红 + 点名）——用例表见批次档。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/TUI.md`（1529 行）的 §9 / §12 / §13 面——**原地保留作参照历史**（保留 ≠ 维护）。
> 下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档 §12.2 三面现状表（as-of 实测 + `file:line` 键位证据） | 时点现状与行号锚 | 现状已按本档 §3 契约重写；行号随实现漂移 |
| 旧档 §12.3 方案选型对比（全面统一 / 分工保留 / 仅落档三候选） | 一次性选型材料 | 选定结论「分工保留」已入 §3；被否决候选理由提炼为一句 |
| 旧档 §12.6 决策 D-SS1–D-SS7 · §13.4 D-B1-1–D-B1-3 | 批次编号决策表 | 结论已并入 §3 / §4 / §5.2 |
| 旧档 §12.7 / §13.5 受影响文件表 · §12.8 / §13.6 用例表 · §12.9 / §13.7 验收标准 · §12.10 / §13.8 边界 | 批次执行 / 验收 / 边界材料 | 一次性——用例宿主 = `thincoder-cli/test/tui-selection-surfaces.test.mjs` 等；边界语义已入 §3 |
| 旧档 §13.1 问题陈述（根因：漏 `await` → `entries.filter` 抛错；39 处调用点清点） | 批次勘察材料 | 结论已落为 §5.2 契约；勘察行号为时点证据 |
| 旧档 §9 交互层与命令层的部分叙述（`/submodel` `/shell` 的决策理由段落） | 与现行正文重复的决策叙述 | 结论已入 §5.3；逐条理由不再复述 |
| 旧档变更记录中本面相关行 | 逐批流水 | 历史叙述——本档自有变更记录 |

### 6.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 需求层条目 | F9 / F10 / F12 + N7 等 | 需求面——`docs/cli/requirements/TUI.md`（本档只留设计层） |
| picker / wizard 的渲染与键位实现细节 | 渲染函数内部结构 | 实现面——落点 `thincoder-cli/src/tui/pickers.mjs` · `wizard.mjs`（本档只留契约） |
| question 工具协议面 | 提问工具契约 / 哨兵定义 / 工具集 | `docs/core/design/TOOLS.md` + `docs/cli/design/ACP-CLIENT.md` §7.1（headless 剔除） |
| MCP 字段表单机制 | 表单循环 / token / 探活 | `docs/core/design/MCP.md` §5 / §8 |
| 配置落盘机制 | 原子写 / mtime 门控 / 并发冲突 | `docs/core/design/CONFIG.md`（本档只留入口与纪律） |
| VSC 侧对位面 | webview 无 picker / wizard 面 | 登记「无镜像面」；VSC 轮 |

## 变更记录

- 2026-09-19（**CLI 端删除二次确认批（台账 #96）· 设计轮 · eng-designer**）：新增 **§5.4 删除类入口显式确认门**——判据句（不可复得 ⇒ 一次显式确认）·
  确认件单源 `confirmDelete`（形态 = 既有二次确认 picker，先例 `cmd-clear.mjs:6-9` / `cmd-new.mjs:30-33`）· 入口册 4 行（渠道删除 / MCP 删除 ×2 路 / 冷 GC 已覆盖）·
  独立「删 key」入口实核 = 不存在 · 判据域边界三条 · 机检面。§1 模块地图 `pickers.mjs` 行同批登记确认件。其余各节零改。

- 2026-09-17（**zero-block 批 · 微 fix 轮 · eng-designer**）：变更记录 2026-09-15 条①内**悬空节号收正**——原引节号在 canonical 界面核心档无此节，收正为「§8 不并项与历史沿革」（拆分沿革登记现住 §8）；批档 `docs/batches/2026-09-17-subagent-zero-block.md` §2 出批发现 ⑥ 收口。

- 2026-09-15（**B 式迁移轮 · 第 6 批**）：建档——`thincoder-cli/docs/design/TUI.md` 的 §9（交互层与命令层）/ §12（选择面收口）/
  §13（输入面小修 B1）三面内容重建入本档（旧档一字未改、原地作参照历史）。
  ① 落点 = `docs/cli/design/TUI-COMMANDS.md`（P2 板块内的**读者面拆分档**——由 `docs/cli/design/TUI.md` §8 拆分沿革登记）；
  ② 模块地图按**现文件结构**重建（cmd-* 族逐档入表——旧档为「其余单命令小件」汇总行）；行数列不并；
  ③ §12 / §13 的机制结论并入 §3 / §4 / §5.2，批次材料入 §6.1；④ 坐标全量改**现状路径**并实核；⑤ 命令清点不复制（挂 `docs/cli/requirements/FEATURES.md` §2.9 指针——D2）。
