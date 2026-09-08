# 代码正确性小修批（CODE-HARDENING-BATCH）

> 板块：跨板块小修批（批专属设计档——STRUCTURE-DEBT §7 允"设计落批专属设计文档"）。状态：设计待评审——评审通过 eng-coder 实现。
> 来源：TODO「代码正确性/边界小修」组核实（2026-09-08 explore 一手——逐项代码现状证据）。设计薄——每项独立小修，无相互依赖，可单 eng-coder 并批。

## 1. 定位

TODO 小修组的**确定性快赢项**（真未做、一行级、CLI-only 为主、无新语义）——修复 1 真 bug + 6 边界加固 + 注释同步。剔除项（观察/裁定/文档批/已消解）见文末 §5。

## 2. 设计（逐项——改动点 + 验收）

### 2.1 cmd-undo 绝对路径 undo 失效（真 bug——TODO L16）

- **bug**：`src/tui/cmd-undo.mjs:23`（snapshotForUndo）与 `:71`（handleUndoCommand）`join(cwd, ...path.split("/"))`——path.join 对绝对段不重置（`join('/cwd','/abs/p') = '/cwd/abs/p'`）；Windows 反斜杠绝对路径不按 `"/"` 切分。模型写绝对路径 → existsSync 假 → backup=null → /undo 时 ENOENT "Failed to revert"，真实文件不还原。
- **改**：两处各加 isAbsolute 分支——绝对路径直接用，否则 `join(cwd, path)`（不 split("/")——join 收整段相对路径即可）。
- **验收**：绝对路径 undo 恢复成功（单测：绝对路径快照/恢复）+ 相对路径无回归。

### 2.2 deleteByUid 畸形 uid 尾缀静默删（TODO L17）

- **行为**：`src/memory/delete.mjs:159` personal 分支——`personal:5:extra` split 后只查首段 `5` 是数字，尾缀放行 → 静默删 id=5。
- **改**：personal 分支加 `norm.split(":").length > 2 → throw`（畸形 uid 拒绝）。
- **验收**：`memory remove personal:5:extra` 报错不删；`personal:5` 正常删。

### 2.3 MCP readMcpSection servers 非数组（TODO L18）

- **行为**：`src/config.mjs:347` servers 非数组静默返回 `ok:true, servers:[]`。
- **改**：改判 `ok:false` 走畸形回退（reconcile :306-338 已有 config 缺失回退语义可复用）。
- **验收**：servers 非数组 → ok:false；正常数组 → ok:true。

### 2.4 tool-args subagent action-only 兜底（TODO L27）

- **行为**：`src/tui/tool-args.mjs:44-47` 只取 a.task——action-only 调用（status/observe/send/cancel/panel/consume-design）无 task → 标题光秃 "❯ subagent"。
- **改**：加 a.action 兜底（无 task 时显示 action）。
- **验收**：action-only 调用块标题含 action（如 "❯ subagent (status)"）。

### 2.5 VSC subagent.mjs 过时注释（TODO L26a——VSC 侧）

- **行为**：thincoder-vscode `src/agent-tools/subagent.mjs:13-14` 仍写 "ONE tool, four actions — spawn/status/cancel/escalate"，与同文件 :2-3 "seven actions" 矛盾。
- **改**：注释改 seven actions（与 :2-3 一致）。
- **验收**：注释一致。

### ~~2.6 CLI auto-think depth 传值~~（评审 #1 采纳后剔出——2026-09-08 核实）

- **核实结论（评审 #1 采纳）**：agent._depth 全树唯一读点 = auto-think.mjs:95（`depth: agent._depth ?? 0`）——**从无赋值点**（恒 undefined→0）。设它需动 agent 创建/继承链（子代理嵌套层赋值）——牵连状态债 #3（`_` 字段摊平）地盘——**非一行小修**。
- **处置**：剔出本批——归状态债 #3 域（TODO L26b 保留，标注需随状态重构处理；auto-think.mjs:95 注释已如实说明 depth 恒 0 现状——无隐藏漂移）。


### 2.7 files 尾随空格目录声明检测（TODO L22——评审 #2 文件修正）

- **行为**：normalizeFileList 对 "test/ "（尾随空格）仍逃过——目录声明带尾随空格未检测。
- **改**：一行加固 trimEnd 判后缀（"test/ " → 识别为目录声明）。
- **验收**：尾随空格目录声明被正确分类。

### 2.8 setup.mjs 悬空注记（TODO L28）

- **行为**：`src/agent/setup.mjs:313-314` 注记 "adjusted to 12500"——实际 T3b 已重校准 **15500**（CHANGELOG.md:59——TODO 说的 14000 也过期两档）；且引用的 agent.test T3b 测试文件已删。
- **改**：注记同步 15500 或删注（指涉对象已消失——建议删注或改述无测试引用）。
- **验收**：注记不再悬空（无 12500/14000 过期值 + 不指已删测试）。

## 3. 受影响文件

| 文件 | 端 | 改动 | 预计 delta |
|---|---|---|---|
| src/tui/cmd-undo.mjs | CLI | 2.1 两处 isAbsolute | ≤±8 |
| src/memory/delete.mjs | CLI | 2.2 一行校验 | ≤±3 |
| src/config.mjs | CLI | 2.3 改判 ok:false | ≤±3 |
| src/tui/tool-args.mjs | CLI | 2.4 action 兜底 | ≤±3 |
| src/agent-tools/subagent.mjs | VSC | 2.5 注释 | ≤±1 |
| ~~src/agent.mjs~~（2.6 剔出——见 §2.6） | — | — | — |
| src/agent-tools/subagent-scheduler.mjs | CLI | 2.7 normalizeFileList trimEnd（评审 #2 修正） | ≤±1 |
| src/agent/setup.mjs | CLI | 2.8 注记 | ≤±1 |
| 测试（对应文件或新增小测试） | — | 2.1/2.2/2.3/2.4/2.7 各 1 用例（2.6 已剔出） | ~+50 |

## 4. 验收（批级）

- AC1 2.1 绝对路径 undo 恢复成功 + 相对无回归
- AC2 2.2 畸形 uid 拒绝 + 正常 uid 可删
- AC3 2.3 servers 非数组 ok:false
- AC4 2.4 action-only 标题含 action
- AC5 2.5/2.8 注释一致/不悬空
- AC6 2.7 分类正确（2.6 已剔出——归状态债 #3）
- node --check + 相关测试绿 + npm test 快层绿

## 5. 剔除项（不在此批——explore 核实归类）

- **观察/裁定**：L19 read offload C / L20 advisor 截断 / L23-L24 R19（需 SESSION §13 裁定）/ L47-L48 AC-OA4 样本 / L50 advisor 模板（等时机）/ L52 sync ⏹（用户裁决）/ L32 轨迹清理策略（需用户定）
- **文档批**：L30（剩 AGENT-LOOP/VSC CAPABILITY_GAP）/ L35 D-T1.8（需重锚）/ L43 R7 豁免注 / L54 engineering-sub（提示词批）
- **功能池**：L29 ACP 结构化映射 / L31 VSC 轨迹存档（需用户明确）/ L49 统计脚本
- **已核销**：L40/L41/L51（前提已死——已勾销）/ L15 VSC detectRestoredSession（语义完善独立项——单列待排）
