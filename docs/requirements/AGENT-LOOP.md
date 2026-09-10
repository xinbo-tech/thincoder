# AGENT-LOOP — 需求

> 板块：Agent 循环（主循环/子代理生命周期/异步化）。
> 状态：现行（随实现演进）。
> 来源：2026-09-10 自 `../design/AGENT-LOOP.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. question 工具抑制



**总体需求**：抑制 question 工具过度使用与不当形态（过度提问/大段文字/一条多问），修复 VS Code 卡片渲染可读性。**确认门（routine confirmation）用普通文本回复履行**——用户直接答"可以"——question 只留给真正需要用户选择/输入的场景。

- **工具描述三锚（question.md/VS Code question.mjs 对齐）**：每调用一问；单问简短（背景/分析放正文回复不放 question）；routine confirmations 走普通回复（仅真决策用工具）。
- **提示词**：discipline-engineering.md Questioning Style 语义 + common.md 确认门段 + discipline-normal.md 工具表反模式列（旧 system/engineering/discipline 表述——施工③随迁）。
- **机械限制**：question 长度 ≤100 字符、options ≤4 条——超限返回错误串不弹卡不调 onQuestion。
- **VS Code 渲染**：`.question-text` 加 white-space:pre-wrap + max-height 兜底滚动。

## 2. 子代理异步化（用户裁定）

- 用户 2026-09-08 裁定（两次痛骂——同步 spawn 反复犯）——**顶层（depth-0）spawn 禁 async:false——一律异步**。depth>0 平台强制 sync 不受影响（子代理内部——平台硬规则）。快车道（用户明确指令）。
- §7.7 只覆盖 spawn——用户裁 a：**escalate（飞刀）/advisor 顶层也纳入一律异步**——
