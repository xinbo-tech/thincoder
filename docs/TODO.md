# TODO — thincoder-vscode 项目级技术待办

> 设计遗留 / 评审发现 / 用户指示的后续项。完成即勾销。按板块/来源分组。
> 本文件只承载**当前待办与在途项**；历史已完成项已移除（git history 完整可追溯——2026-09-08 整理）。
> 维护：工程模式下由架构师（agent）在对话中即时更新。

---

## 工具 glob 方言缺口（brace/扩展/排除静默漏匹配）

- [ ] **globToRegex（VS Code search.mjs，自 CLI shared.mjs 同源移植）不支持常见 glob 方言且静默漏匹配不报错**：
  - `{a,b}` brace 展开：`**/*.{js,txt}` 被字面转义 → 匹配不到任何文件（本应命中 .js/.txt）
  - `!` 排除前缀：无排除语义 → 作为字面量使整个模式失配
  - `?(x)`/`@(a|b)`/`+(x)` 扩展 glob：被转义 → 错配
- [ ] 影响：模型按常见 glob 习惯（brace 多扩展名最典型）发模式时静默拿不到结果，误判"无匹配"，不自知模式没被支持
- [ ] 方向（待设计）：最低成本 = `{a,b}` brace 展开（最常用）；`!` 排除需改调用侧语义。与 CLI 端同源修复（lockstep）。设计启动权在用户

## 工程模式防盗用

- [ ] `eng(enter)` 加用户同意门（当前模型可自主翻转并把 `agent.engineering=true` 持久化进共享 config.json；exit 可保持自主）。CLI 侧同样存在
- [ ] design token 签发后置为 pending，需用户批准才可派生 eng-coder（"wait for user approval" 目前只是 prompt 散文）。CLI 侧同样存在
- [ ] 收紧拒绝文案：subagent/advisor 错误信息不再逐条写出解锁步骤。CLI 侧同样存在

## 文档债 / ARCHITECTURE 漂移（设计评审 advisory 未实现项）

- [ ] design round2 专用提示词（design 重跑不再复用 code-review 收敛提示词）
- [ ] ARCHITECTURE.md 补 NFR 小节（性能/安全/兼容性）与测试层总览
- [ ] 原则 2 "postMessage 单向通信" 改述为"无共享状态、全部经消息协议通信"
- [ ] 明确 PROVIDER_PRESETS 是静态镜像拷贝而非运行时 import CLI
- [ ] 模块小节补 memory.mjs / repomap.mjs / specs.mjs / extension 子模块 / prompts
- [ ] §6/§3/§4 补：懒加载历史分页、编辑器双通道+isDirty stop sign、Ctrl+I interrupt、isNonRetryableError/readSSE 立即失败
- [ ] §2 runAgent 签名参数名对齐实际实现（input → text）
- [ ] §4 模型能力表补 thinkEnabledValue / noUsageStream
- [ ] advisor 子代理工具集补 lsp
- [ ] **模块图补录**：`src/extension/panel-chat.mjs` / `webview/streaming.js` / `webview/panels.js` / `webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE.md §6/§1——既有漂移
- [ ] `src/agent/setup.mjs` 331 行超 300 建议线——toolSchemas 构建或 context 注入段再抽一层；低优先
- [ ] **vscode qwen 请求在 thinking 未设置时携带 `thinking:{type:"enabled"}`**（智谱式参数，GLM 修复引入的通用 spec 默认注入）——发往百炼的兼容性属 Qwen enable_thinking 既有范畴，知悉

## Issue 巡检登记（CLI 侧待办见 thincoder/docs/TODO.md）

- [ ] GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴

## 语义索引 needsRebuild 的 git 快路径盲区

- [ ] **git 快路径 gitignore 盲区**：`discoverFiles` 不感知 `.gitignore`，gitignored 的非 memory 可索引文件增删改不触发重建 → 索引静默过期
- [ ] `listMemoryFiles` 只看 `.thincoder/memory/` 顶层，而 `discoverFiles` 递归子目录 → 嵌套 memory 文件被索引却反复判 `file-removed`（死循环）。二选一：递归，或限定只扫一层
- [ ] `indexer.mjs` 326 行超 300 建议线 → 拆 `chunk`/`rebuild` 到 `index-chunk.mjs` / `index-rebuild.mjs`
- [ ] reason 串失配：`file-changed`（git 路径）vs `file-changes`（fallback），另 `file-added/removed/missing` 未统一
- [ ] `loadIndex`/`searchIndex` 不校验 `manifest.vector_dim === decode.dim` 与 `embed_model`——切换 embedding 模型（维度不同）时静默产出全 0 得分
- [ ] **方向决策（A/B 待定）**：A=放弃 porcelain 快路径，改「commit 预筛 + indexed∪discoverFiles 完整 mtime 对比」，一次性消除两盲区并统一 reason（正确性/简单性优先，推荐）；B=保留快路径只做最小外科补丁
- [ ] 为已提交但未进 changelog 的 indexer 系列修复（c45f1fe → 66ea83f 区间，约 7 commit）补一条 changelog 条目

## config.json 外部写盘感知

- [ ] **config.json FileSystemWatcher**：外部（CLI `/advisor` 等）写盘后扩展端实时感知 → 触发 `_pushSettingsLight`（chat-panel.mjs）推送全套快照。B1 已落地 openSettings 的 getAgentSettings 拉新（收窄触发面——面板重开即见新值）；watcher 覆盖剩余场景——面板常开时外部写盘的实时刷新

## 测试 / 行数债

- [ ] **快层 slow-gate 未归册清理批（18 用例散布 13 文件——exit 1 硬红——R12/§19.8 等早批遗留）**：auto-approve 2×10s / chat-panel 2×10.6s / image-paste 11s / dual-history / vscode-tools / compaction / suspension T-S2b/T-R17o 等——机械 test(→slow( 标注（test:full 照跑不受影响）——单独归册清理批候选
- [ ] **ui.test.mjs 拆分债（962 行超 500）**：T-QUI 系并入后 962 行——既有债（§18.14 域拆分后整合文件）——后续触碰批落拆分规划
- [x] ~~**test/files.mjs 引用 9 个缺失测试文件**~~（2026-09-08 V3b 交付上报——repo 测试清理并行状态）——**2026-09-08 已勾销**：用户裁定测试全删，VSC/CLI 各剩 1 个 test 文件；files.mjs 是清空前的残留清单，须随测试基建重建时同步

