# TODO — thincoder-vscode 项目级技术待办
> 设计遗留 / 评审发现 / 用户指示的后续项。完成即勾销。按板块/来源分组。
> 本文件只承载**当前待办与在途项**；历史已完成/已消解项已移除或勾销（git history 完整可追溯——2026-09-08 清理）。
> 维护：工程模式下由架构师（agent）在对话中即时更新。
---

## 工程模式防盗用
- [x] ~~`eng(enter)` 加用户同意门~~——**2026-09-08 用户裁不处理**（合理——设计如此：模型自主翻转 + 持久化是设计意图——工程模式进出权在模型——无机械同意门）
- [x] ~~design token 签发后置 pending 需用户批准门~~——**2026-09-08 用户裁不处理**（合理——设计如此：approval 保持 prompt 散文层——无机械 pending 门——评审链的人控点在 sign-off 流程本身）
- [x] ~~收紧拒绝文案~~——**2026-09-08 核销**（src+prompts grep "解锁" 0 命中——现拒绝文案均单行通用——前提已消失）

## 文档债 / ARCHITECTURE 漂移（doc-sweep 候选——是否已被 VSC 文档批覆盖需核）
- [ ] **设计评审 advisory 未实现项**：design round2 专用提示词 / ARCHITECTURE 补 NFR 小节 / 原则 2 改述 / PROVIDER_PRESETS 静态镜像说明 / 模块小节补 memory/repomap/specs/extension/prompts / §6§3§4 补懒历史·双通道·Ctrl+I·readSSE / runAgent 签名 input→text / §4 补 thinkEnabledValue·noUsageStream / advisor 工具补 lsp
- [ ] **模块图补录**：`src/extension/panel-chat.mjs` / `webview/streaming.js` / `webview/panels.js` / `webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE——既有漂移
- [x] ~~**VSC agent/setup.mjs 500 行整**~~——**2026-09-08 核销**（agent-state.mjs 102 行三函数已建——setup.mjs 现 422 行——与 CLI TODO L10 同物——id=9 env-state 交付顺带完成）
- [ ] **vscode qwen 请求 thinking 未设置时携带 `thinking:{type:"enabled"}`**（智谱式参数，GLM 修复引入的通用 spec 默认注入）——百炼兼容性属 Qwen enable_thinking 范畴——知悉观察

## Issue 巡检登记
- [ ] GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴（bug 修复/关闭状态需核）

## 语义索引 needsRebuild 盲区
- [ ] **git 快路径 gitignore 盲区（窄化版）**：memory 目录盲区已修，但 gitignored 的**非 memory** 可索引文件增删改仍不触发重建（dirty 集只含 git status 报告项）→ 索引静默过期
- [ ] `listMemoryFiles` 只看 `.thincoder/memory/` 顶层，`discoverFiles` 递归子目录 → 嵌套 memory 文件被索引却反复判 file-removed（死循环）。二选一未定
- [ ] **reason 串失配**：`file-changed`（git 路径）vs `file-changes`（fallback），另 file-added/removed/missing 未统一——真差异残留
- [ ] `loadIndex`/`searchIndex` 不校验 `vector_dim === decode.dim` 与 `embed_model`——切换 embedding 模型（维度不同）静默全 0 得分
- [x] ~~indexer 系列修复补 changelog 条目~~——**2026-09-08 核销**（CHANGELOG.md:309 "语义索引系列修复"条目——mtime 重建/git 漂移/空 chunk/manifest-only/multi-root/memory 接线等——与修复面吻合）

## config.json 外部写盘感知
- [ ] **config.json FileSystemWatcher**：外部（CLI `/advisor` 等）写盘后扩展端实时感知 → `_pushSettingsLight` 推送快照。B1（openSettings 拉新）已落地；watcher 覆盖"面板常开时外部写盘实时刷新"

## 行数债
- [x] ~~glob 方言缺口 / indexer 拆分 / 方向决策 A/B / ui.test 拆分 / slow-gate 归册~~——**2026-09-08 核查已勾销**：search.mjs 已实现 brace 展开/!排除/扩展报错（不再静默）；indexer 拆分已完成（index-discover.mjs 独立）；快路径方案已定型实现（commit 预筛 + dirty 集 + mtime 兜底 + memory 目录特判）；测试 >500 债随测试全删消解

## 会话流 / UI 反馈（VSC digest 可见性）
- [ ] **digest 开始无可见指示（2026-09-08 用户实测——对齐 CLI）**：异步子 agent 完成 → 区块并入会话流后长时间无动静（消化已开始但在等消化模型首 token，VSC 只 logEvent 不画指示）。CLI 一进 digestTurn 即画 [auto-turn: digesting…]（零延迟）。改：VSC 消化分支补即刻 host→webview 指示（digesting N finished reports…）+ 状态行置忙，首 token 前不空白——归属 suspension.mjs digest 分支 + webview
- [x] ~~**eng-coder 标题栏末尾总显示 thinking**~~——**2026-09-08 核销**（代码证据：activity.js:150-154 stateWord CLI currentTool parity + :262-274 chunk 级 think→thinking/tool→行尾 state word + chat.js:138-139/status-bar.js:31 _currentTool 实时清/置——固定 thinking 误导已消除）

## 提示词同步（2026-09-08 env-state 实现后）
- [ ] **system.md:24 env-state 描述未含 slot**（SESSION §11.2 实现后漂移——双端逐字同步——与 CLI TODO 同项）
