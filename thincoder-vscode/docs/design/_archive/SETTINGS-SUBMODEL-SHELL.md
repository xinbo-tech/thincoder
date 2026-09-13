# Settings Panel — Subagent Models & Shell (VS Code) > 状态：2026-08-04 设计定稿（待实现确认）。
> 背景：CLI 已有 `/submodel`（按类型子代理模型）与 `/shell`（平台感知 shell 选择），
> 但纯 VS Code 插件用户没有 TUI——需要图形化入口。配置共享 `~/.thincoder/config.json`。 ## 目标 纯 VS Code 插件用户（不用 CLI TUI）能通过**聊天面板 ⚙ 设置面板**完成：
1. **子代理模型配置**：全局默认 + 按类型（explore/plan/coder/eng-coder）独立配置
2. **bash shell 配置**：平台感知选择（System default / 检测到的候选 / 自定义路径） ## 现状（复用点） - 设置面板 `webview/settings.js` 已有 **Agent 区**（maxTurns / subagentTurns / compactThreshold / verifyGuard / advisor）——消息协议 `getAgentSettings` / `saveAgentSettings` → `settings.mjs` → `config-io.saveAgentSettings`（通用 patch）
- `config-io.loadAgentSettings` 已返回 agent.*（缺 subagentModel/subagentModels）
- `saveAgentSettings(patch)` 通用合并（undefined/null/"" 删键）——新字段直接复用
- shell 是 config.json **顶层字段**（不在 agent 下）——需独立消息/持久化通道
- 扩展侧 agent 运行配置已读 `agent.subagentModels` / `config.shell`（49d952d / 2be65fc）——**面板写入即生效**（subagent spawn 与 bash 调用实时读 config） ## 设计 ### 1. 设置面板 Agent 区扩展（webview/settings.js） 在 subagentTurns 之后新增 **Subagent models** 小节： ```
Subagent models ────────────────────────────── Global default [输入框 placeholder: 继承父 provider] [✕清除] explore [输入框] [✕] plan [输入框] [✕] coder [输入框] [✕] eng-coder [输入框] [✕]
``` - 值格式与 CLI `/submodel` 一致：`provider:model` | `provider` | `model`（placeholder 提示）
- 空输入 = 不修改该项；✕ = 清除该项（回落继承链）
- 保存走现有 `saveAgentSettings` 消息，payload 增 `subagentModel` / `subagentModels` 字段 ### 2. Shell 区（新小节，设置面板底部） ```
Shell ──────────────────────────────────────── [下拉: System default (cmd + UTF-8) / pwsh / Git Bash (路径) / WSL bash / …] [自定义路径输入框] [保存]
``` - 下拉选项 = 扩展侧检测结果（复用 CLI 候选逻辑：`where`/`command -v` + Git Bash 常见路径 existsSync，检测一次缓存）
- 选择或输入后保存 → `saveShellSettings` 新消息 → `persistRaw(raw.shell = …)` ### 3. 扩展侧（settings.mjs / config-io.mjs / panel-messages.mjs） | 文件 | 改动 |
|---|---|
| `config-io.mjs` | `loadAgentSettings` 增 `subagentModel`/`subagentModels`；`saveAgentSettings` 空对象删除（subagentModels 全清时整键删） |
| `settings.mjs` | `agentSettings()` 透传新字段；新增 `shellCandidates()`（检测缓存）+ `saveShellSettingsFromPanel(value)`（persistRaw raw.shell；null/空 = 删键） |
| `panel-messages.mjs` | 新 `case "getShellCandidates"` / `case "saveShellSettings"` |
| `webview/settings.js` | 渲染 Subagent models 小节 + Shell 小节；i18n key 补充（locales/en.json + zh.json） | ### 4. i18n `t("settings.submodelSection")` / `t("settings.submodelGlobal")` / `t("settings.shellSection")` / `t("settings.shellDefault")` 等——en/zh 双语。 ## 生效语义 - 面板保存 → config.json 即时更新 → 扩展 subagent spawn / bash 调用**实时读**（agent.config 每次 runAgent 重建时加载，新增子代理/新命令立即生效）
- 与 CLI `/submodel`/`/shell` 双通道一致（改同一字段）；优先级链不变：工具 model 参数 > 类型级 > 全局 > 继承父 ## 决策记录 | 决策 | 理由 |
|---|---|
| 扩展现有设置面板而非新建命令面板 | 设置面板已有 Agent 区与消息协议，增量最小；配置语义（agent.* / shell）与面板定位一致 |
| shell 走独立 `saveShellSettings` 消息 | shell 是 config.json 顶层字段，不混入 agent patch |
| 下拉 + 自定义输入双通道 | 平台候选（检测）快速选择 + 任意路径灵活性（与 CLI /shell picker 对齐） |
| 复用 saveAgentSettings 通用 patch | subagentModel/subagentModels 属 agent.*，现有机制直接承载 |
