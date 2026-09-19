# 多根工作区「当前项目」切换（PROJECT-SWITCHER）· 扩展面板 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **扩展面板 · 会话管理（current-project 切换）**。本档 = 该板块在基准层的**活档权威**。
> VSC 专有面（结构性不对称——`DOC-SYSTEM` §5.1 P2）：多根工作区下的「当前项目」（agent cwd）由面板显式指定，对端无对位机制。
> 需求侧：无同板块需求档（本端设置面板/面板交互无需求对位档）。
> 来源 = `thincoder-vscode/docs/design/PROJECT-SWITCHER.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）。坐标 = as-of 2026-09-15 实核。

## 1. 定位与背景

多根工作区（multi-root workspace）下，扩展此前固定以 `workspaceFolders[0]` 作为 agent 工作目录（cwd）——用户无法指定「当前项目」，切换文件也不跟随。
本板块 = 为面板引入**单一 cwd 源 + 显式 override + 可选跟随活动文件**，使会话 / 索引 / `@` 补全 / agent 工具目录全部跟随切换。

**目标（验收语义）**：

1. 用户可显式指定多根工作区中的「当前项目」（agent cwd）。
2. 会话、索引、`@` 文件补全、agent 工具目录**全部跟随**切换。
3. 可选「跟随活动文件」自动切换（设置开关）。

## 2. 机制（单一 cwd 源 + override）

`_cwd()` 是**全部 cwd 的唯一入口**（`thincoder-vscode/src/extension/panel-messages.mjs:29`）：

```js
_cwd() = _cwdOverride ?? workspaceFolders[0] ?? process.cwd()
```

- `setProjectFolder(fsPath)`（`panel-messages.mjs:36`）：**校验 fsPath 必须是 `workspaceFolders` 成员**，否则拒绝。
- 切换后，所有既有 `_cwd()` 调用点（会话 slot、索引、`@` 补全、agent 启动）**自动生效**——无需逐个改调用方。
- **不跨窗口持久化**：重启后回到 `workspaceFolders[0]`。
- `clearProjectOverride()`（`panel-messages.mjs:46`）：清除 override，`_cwd()` 回落 `workspaceFolders[0]`。

## 3. 切换流程（实现面）

扩展端方法实现已自 `chat-panel.mjs` 拆出（500 行硬限），`ChatPanel` 只保留委托方法。模块归属（as-of 2026-09-15）：

| 当前文件 | 内容 |
|---|---|
| `thincoder-vscode/src/extension/panel-messages.mjs` | `_cwd`（`:29`）· `setProjectFolder`（`:36`）· `clearProjectOverride`（`:46`）；消息 `setProject` 路由（`:197`——带 `fsPath` → 直接切换；不带 → 弹 QuickPick） |
| `thincoder-vscode/src/extension/panel-project.mjs` | `projectInfo`（`:14`）· `pushProject`（`:22`）· `applyProjectSwitch`（`:27`）· `onProjectChanged`（`:46`）· `pickProject`（`:61`）——机制实现主体 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | `ChatPanel` 委托方法；构造时注册跟随活动文件（`:75`）与工作区折叠变化（`:95`）监听 |
| `thincoder-vscode/src/extension/panel-chat.mjs` | agent 回合 cwd 用 `_cwd()`（回合开始时取快照——`:234`） |
| `thincoder-vscode/src/extension/panel-session.mjs` | 会话加载 `loadSession`（`:133`）、slot 管理与切换 |
| `thincoder-vscode/webview/index.html` | `#project-btn`（📁 项目按钮，默认隐藏） |
| `thincoder-vscode/webview/chat.js` | `case "project"` 消息路由（`:202`）→ `session-bar.js` |
| `thincoder-vscode/webview/session-bar.js` | `handleProjectMessage`（`:124`）——多根显示并更新名称 / tooltip，单根隐藏；点击 → `postMessage({ type:"setProject" })`（`:121`） |
| `thincoder-vscode/package.json` | 设置 `thincoder.project.followActiveEditor`（boolean，默认 false——`:108`） |

**函数职责**：

- `projectInfo(panel)`：返回 `{ folders, current, multi, followActive }`（snapshot）。
- `pushProject(panel)`：`postMessage({ type: "project", ...projectInfo })`。
- `applyProjectSwitch(panel, fsPath)`：**任务运行中拒绝切换** → 校验 `setProjectFolder` → `onProjectChanged`。
- `onProjectChanged(panel)`：重置 slot → 认领新 cwd 的会话（`resumeSlot`——本端记录 / 一次性继承 / 全新分配）→ `pushProject` → `loadSession`（清视图、载入新项目活动会话、推会话列表 / autoApprove / planMode）→ `pushIndexStatus` → `maybePromptIndex`。
- `pickProject(panel)`：QuickPick 固定选项 = 工作区根列表（当前项 ✓）+「跟随活动文件」开关项（切换后循环重开显示最新状态）。
- `ChatPanel` 构造时注册 `onDidChangeActiveTextEditor`：设置开启**且**活动文件所属根 ≠ 当前 cwd **且**无任务运行 → 自动切换。
- `onDidChangeWorkspaceFolders`：若被 override 的项目已移出工作区 → `clearProjectOverride` + 切换回落（**防 agent 指向死目录**）。

## 4. 边界规则

- **agent 运行中禁止切换**（`_turnActive` / 挂起活跃期时拒绝）——避免 mid-turn 会话写错 slot。
- 单根工作区 / 无工作区：按钮隐藏，行为不变。
- 切换即换一套会话（slot 按 cwd 存——与对端按目录会话一致）；切换时当前会话已由 turn 结束的保存逻辑落盘。
- 跟随活动文件**仅在无任务运行时**生效。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/PROJECT-SWITCHER.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注状态行（「已实现（2026-08-17）」+ 格式债清理注） | 时点状态行 | 批次语境——现行态已入 §1–§4 |
| 旧档「测试」节（`project-switcher.test.mjs` / `welcome.test.mjs` 的删除记录） | 测试资产存废叙述 | 一次性批次材料——**测试资产归测试层**（`thincoder-vscode/test/`）；旧档已自述删除 |
| 旧档「变更记录」（2026-08-17 / 09-05 / 09-07 / 09-08 四条） | 逐批流水 | 历史叙述——本档自有变更记录 |

> **零 (d) 类旧结构**：源档为当前态单稿（2026-09-08 已重写为多行 current-state），无「已作废机制形态」段可登记——本节只收时点材料与测试资产。

## 6. UI / 交互决策落档

| # | 决策 | 状态 |
|---|---|---|
| U-P1 | 项目按钮 = `#project-btn`（📁），**单根 / 无工作区时隐藏** | 已定（§3） |
| U-P2 | 切换入口 = QuickPick（工作区根列表 + 「跟随活动文件」开关项）；**不做**面板内联下拉 | 已定（§3） |
| U-P3 | 运行中拒绝切换 = **硬拒**（不排队、不自动延后） | 已定（§4） |
| U-P4 | 多根时按钮显示当前项目名 + tooltip；单根隐藏（无额外状态提示） | 已定（§3） |
| U-P5 | 「跟随活动文件」开关的**视觉位置**与切换提示文案 | **open**（源档未落档——不静默补） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/design/PROJECT-SWITCHER.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；状态行 / 测试节 / 变更流水入 §5 不并项；坐标改写为仓根相对现状路径（补 `panel-project.mjs` 五函数与 `package.json` 锚行）。
