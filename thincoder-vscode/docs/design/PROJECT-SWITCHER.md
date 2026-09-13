# 多根工作区「当前项目」切换（PROJECT-SWITCHER）

> 板块：扩展面板（VS Code 扩展的 ChatPanel 会话管理——current-project 切换专题）。
> 状态：**已实现**（2026-08-17）。当前态随代码重组维护（panel-project.mjs 独立模块）。
> 文档格式债清理批 V2（2026-09-08）——整文件单物理行 demux 为多行 markdown，机制保留。

## 背景

多根工作区（multi-root workspace）下，插件此前固定使用 `workspaceFolders[0]` 作为 agent 工作目录（cwd），用户无法指定"当前项目"，切换文件也不跟随。

## 目标

1. 用户可显式指定多根工作区中的"当前项目"（agent cwd）。
2. 会话、索引、@ 文件补全、agent 工具目录全部跟随切换。
3. 可选"跟随活动文件"自动切换（VS Code 设置开关）。

## 设计

### 单一 cwd 源（关键）

`panel-messages.mjs` 中的 `_cwd()` 是全部 cwd 的唯一入口。新增模块级 override：

```js
_cwd() = override ?? workspaceFolders[0] ?? process.cwd()
```

- `setProjectFolder(fsPath)`：校验 fsPath 必须是 `workspaceFolders` 成员，否则拒绝。
- 切换后所有既有 `_cwd()` 调用点（会话 slot、索引、@ 补全、agent 启动）自动生效。
- 不跨窗口持久化；重启后回到 `workspaceFolders[0]`。
- `clearProjectOverride()`：清除 override，`_cwd()` 回落 `workspaceFolders[0]`。

## 实现要点（当前态代码路径）

扩展端方法实现已从 `chat-panel.mjs` 拆出（500 行硬限），`ChatPanel` 只保留委托方法。模块归属如下：

| 当前文件 | 内容 |
|---|---|
| `src/extension/panel-messages.mjs` | `_cwd` / `setProjectFolder` / `clearProjectOverride`；消息 `setProject` 路由（带 `fsPath` → 直接切换；不带 → 弹 QuickPick） |
| `src/extension/panel-project.mjs` | `projectInfo` / `pushProject` / `applyProjectSwitch` / `onProjectChanged` / `pickProject`（机制实现主体） |
| `src/extension/chat-panel.mjs` | `ChatPanel` 委托方法 `_projectInfo`/`_pushProject`/`_applyProjectSwitch`/`_onProjectChanged`/`_pickProject`；构造时注册跟随活动文件与工作区折叠变化监听 |
| `src/extension/panel-chat.mjs` | agent 回合 cwd 用 `_cwd()`（回合开始时取快照） |
| `src/extension/panel-session.mjs` | 会话加载 `loadSession`、slot 管理与切换 |
| `webview/index.html` | `#project-btn`（📁 项目按钮，默认隐藏） |
| `webview/chat.js` | `case "project"` 消息路由 → `session-bar.js` |
| `webview/session-bar.js` | `handleProjectMessage`：多根显示并更新名称/tooltip，单根隐藏；点击 → `postMessage({ type:"setProject" })` |
| `package.json` | 设置 `thincoder.project.followActiveEditor`（boolean，默认 false） |

各函数职责：

- `projectInfo(panel)`：返回 `{ folders, current, multi, followActive }`（snapshot）。
- `pushProject(panel)`：`postMessage({ type: "project", ...projectInfo })`。
- `applyProjectSwitch(panel, fsPath)`：任务运行中拒绝切换 → 校验 `setProjectFolder` → `onProjectChanged`。
- `onProjectChanged(panel)`：重置 slot → 认领新 cwd 的会话（`resumeSlot`，本端记录/一次性继承/全新分配）→ `pushProject` → `loadSession`（清视图、载入新项目活动会话、推会话列表/autoApprove/planMode）→ `pushIndexStatus` → `maybePromptIndex`。
- `pickProject(panel)`：QuickPick 固定选项 = 工作区根列表（当前项 ✓）+「跟随活动文件」开关项（切换后循环重开显示最新状态）。
- `ChatPanel` 构造时注册 `onDidChangeActiveTextEditor`：设置开启且活动文件所属根 ≠ 当前 cwd 且无任务运行 → 自动切换。
- `onDidChangeWorkspaceFolders`：若被 override 的项目已移出工作区 → `clearProjectOverride` + 切换回落（防 agent 指向死目录）。

## 边界规则

- **agent 运行中禁止切换**（`_turnActive` / 挂起活跃期时拒绝），避免 mid-turn 会话写错 slot。
- 单根工作区 / 无工作区：按钮隐藏，行为不变。
- 切换即换一套会话（slot 按 cwd 存，与 CLI 按目录会话一致）；切换时当前会话已由 turn 结束的保存逻辑落盘。
- 跟随活动文件仅在无任务运行时生效。

## 测试

原 `test/project-switcher.test.mjs`（override 校验 / `_cwd` 随 override / `clearProjectOverride` 恢复 / `_projectInfo` 快照 / `_onProjectChanged` 重绑 slot）与 `test/welcome.test.mjs`（`#project-btn` 存在且默认隐藏）随 2026-09-07 测试清空重构已删除（files.mjs 收敛——删除记录 = `test/files.mjs` 收敛清单）。当前由扩展端套件在相关路径上覆盖；回归以全量套件为准。

## 变更记录

- 2026-08-17：立项实现。
- 2026-09-05：方法实现随代码重组从 `chat-panel.mjs` 拆至 `panel-project.mjs`；slot 认领改 `resumeSlot`。
- 2026-09-07：专项测试（project-switcher/welcome）随测试清空重构删除。
- 2026-09-08：随文档格式债清理批 V2 重写为多行当前态（内容保留）。
