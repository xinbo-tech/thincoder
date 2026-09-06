# TODO — thincoder-vscode 项目级技术待办

> 设计遗留 / 评审发现 / 用户指示的后续项。完成即勾销。按板块/来源分组。

## 工具 glob 方言缺口 · brace/扩展/排除静默漏匹配（2026-09-06，来源：file-search 测试发现——与 CLI 同款 globToRegex）

- [ ] **技术待办候选**：globToRegex（VS Code search.mjs，自 CLI shared.mjs 同源移植）不支持常见 glob 方言且**静默漏匹配不报错**：
  - `{a,b}` brace 展开：`**/*.{js,txt}` 被字面转义 → 匹配不到任何文件（本应命中 .js/.txt）
  - `!` 排除前缀：无排除语义 → 作为字面量使整个模式失配
  - `?(x)`/`@(a|b)`/`+(x)` 扩展 glob：被转义 → 错配
- [ ] 影响：模型按常见 glob 习惯（brace 多扩展名最典型）发模式时静默拿不到结果，误判"无匹配"，不自知模式没被支持。
- [ ] 方向（待设计）：最低成本 = `{a,b}` brace 展开（最常用）；`!` 排除需改调用侧语义。与 CLI 端同源修复（lockstep）。设计启动权在用户。

## 工程模式防盗用（2026-08-21 分析，来源：非工程模式盗用 eng-coder 事件）

- [ ] `eng(enter)` 加用户同意门（当前模型可自主翻转并把 `agent.engineering=true` 持久化进共享 config.json；exit 可保持自主）。CLI 侧同样存在。
- [ ] design token 签发后置为 pending，需用户批准才可派生 eng-coder（"wait for user approval" 目前只是 engineering.md 的 prompt 散文）。CLI 侧同样存在。
- [ ] 收紧拒绝文案：subagent/advisor 的错误信息不再逐条写出解锁步骤（"Engineering mode is not active"→"run advisor with type='design'"→"pass this exact token"）。CLI 侧同样存在。

## 文档债（2026-08-21 ARCHITECTURE.md 设计评审 advisory，未实现项）

- [x] 存量碎片合并——2026-08-25 完成：SETTINGS.md 合并 6 文档为现行权威源（历史归档保留）；TURN-CAP-CONTINUE 收口为两端各自实现记录（地图标注同步更新）
- [ ] design round2 专用提示词（§11 评审发现 #4）：design 重跑不再复用 code-review 收敛提示词

- [ ] ARCHITECTURE.md 补 NFR 小节（性能/安全/兼容性）与测试层总览（advisor #2）
- [ ] 原则 2 "postMessage 单向通信" 改述为"无共享状态、全部经消息协议通信"（advisor #3）
- [ ] 明确 PROVIDER_PRESETS 是静态镜像拷贝而非运行时 import CLI（advisor #4）
- [ ] 模块小节补 memory.mjs / repomap.mjs / specs.mjs / extension 子模块 / prompts（advisor #5）
- [ ] §6/§3/§4 补：懒加载历史分页、编辑器双通道+isDirty stop sign、Ctrl+I interrupt、isNonRetryableError/readSSE 立即失败（advisor #6）
- [ ] §2 runAgent 签名参数名对齐实际实现（input → text，advisor #8）
- [ ] §4 模型能力表补 thinkEnabledValue / noUsageStream（advisor #10）
- [ ] advisor 子代理工具集补 lsp（原文档 T19 遗留）
- [x] ~~跨端文档漂移（2026-08-21 评审 advisory）：checkpoint 机制两端语义差异待明确（CLI v2 全量副本快照 vs VS Code git stash）、preset 计数 16/17、TUI 模块数 ~24/45、12 位旧 hash 改名侧未标注~~——**2026-09-01 销账**：checkpoint 差异已随 CHECKPOINT.md F5 落地统一（VS Code 镜像全量副本 `src/tools/checkpoint.mjs`，同存储同格式，stash 从工具与 guard 路径移除；guard 对齐 CLI 宽匹配 + rewind 指引）；preset 计数已同步（两端 6 个一致）；TUI 模块地图已重写（2026-08-30）；12 位旧 hash 改名已在 AGENTS.md 标注（2026-08-25）
- [ ] 模块图补录（2026-08-26 模型显示交付评审 🔵4）：`src/extension/panel-chat.mjs` / `webview/streaming.js` / `webview/panels.js` / `webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE.md §6/§1——既有漂移，非本次引入
- [ ] `src/agent/setup.mjs` 331 行超 300 建议线（2026-08-28 Qwen 交付评审 #6）——toolSchemas 构建或 context 注入段再抽一层；非本轮引入，低优先
- [ ] vscode qwen 请求在 thinking 未设置时携带 `thinking:{type:"enabled"}`（智谱式参数，GLM 修复引入的通用 spec 默认注入，非 qwen 专属）——发往百炼的兼容性属 Qwen enable_thinking T7 冒烟/既有范畴，知悉（2026-08-28 Qwen 交付偏离 4）

## Issue 批量（2026-08-22，来源：Gitee/GitHub issue 巡检）

- [x] GitHub thincoder#2 GLM 畸形 tool_calls——已实现（openai.mjs droppedToolCalls 防御 + normalizeToolPairing，128464b）——2026-08-25 核对销账
- [x] IK9UZ8 标题生成同修——已实现（commit c175506：三格式禁思考 + max_tokens 100，CLI 3c1815e 对齐）——2026-08-25 销账
- [ ] 巡检登记：GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴——CLI 侧待办见 `thincoder/docs/TODO.md`
## 语义索引 needsRebuild 的 git 快路径盲区（2026-08-23 六轮 advisor 收敛后暂缓，来源：indexer.mjs 评审）

- [ ] git 快路径 gitignore 盲区：`discoverFiles` 不感知 `.gitignore`，gitignored 的非 memory 可索引文件（`generated/*.ts`、`*.gen.js` 等）增删改不触发重建 → 索引静默过期
- [ ] `listMemoryFiles` 只看 `.thincoder/memory/` 顶层，而 `discoverFiles` 递归子目录 → 嵌套 memory 文件被索引却反复判 `file-removed`（死循环）。二选一：递归，或限定只扫一层
- [ ] `indexer.mjs` 326 行超 300 建议线 → 拆 `chunk`/`rebuild` 到 `index-chunk.mjs` / `index-rebuild.mjs`
- [ ] reason 串失配：`file-changed`（git 路径）vs `file-changes`（fallback），另 `file-added/removed/missing` 未统一
- [ ] `loadIndex`/`searchIndex` 不校验 `manifest.vector_dim === decode.dim` 与 `embed_model`，切换 embedding 模型（维度不同）时静默产出全 0 得分
- [ ] 方向决策（A/B 待定）：A=放弃 porcelain 快路径，改为「commit 预筛 + indexed∪discoverFiles 完整 mtime 对比」，一次性消除上面两个盲区并统一 reason（正确性/简单性优先，推荐）；B=保留快路径只做最小外科补丁
- [ ] 版本 0.1.43 待办：为已提交但未进 changelog 的 indexer 系列修复（c45f1fe → 66ea83f 区间，约 7 个 commit）补一条 changelog 条目
## 工具描述内容断言（2026-08-28，来源：GLM-5.3-Flash 设计评审 #3）

- [x] read_image 工具描述的多模态模型清单（CLI `src/tools/read_image.md:8` / vscode `src/tools/read_image.mjs` 描述串）补内容断言测试——清单漏加新模型时测试应失败（现靠手工同步，已出现过 GLM-5.3-Flash 文案滞后）；**2026-08-28 完成**：vscode `test/tools.test.mjs:696-711` 数组驱动断言（含 4 模型关键字）；顺带修复两处描述缺陷（Qwen3.7→Qwen3.8 精确化、补 GLM-5.3-Flash，与 CLI 对齐）

## config.json 外部写盘感知（2026-08-29，来源：GitHub #3 数据丢失修复 B2，用户指示记档）

- [ ] config.json FileSystemWatcher：外部（CLI `/advisor` 等）写盘后扩展端实时感知 → 触发 `_pushSettingsLight`（chat-panel.mjs）推送全套快照。B1 已落地 openSettings 的 getAgentSettings 拉新（panel-messages.mjs:233 死代码 handler 激活），收窄了触发面（面板重开即见新值）；watcher 覆盖剩余场景——面板常开时外部写盘的实时刷新。

## 粘贴图片 pipeline 收尾（2026-08-29，来源：GitHub thincoder#3 方案 B 交付评审）——已全部完成

- [x] 非光栅图片静默丢失无反馈——**2026-08-29 完成**：autocomplete 收图改为光栅白名单（paste/file 两入口），非光栅 `image/*` 当场 toast 提示（`paste.unsupportedFormat` locale 键 en/zh）；不再产生"chip 显示但发送即消失"的静默路径
- [x] `src/agent/setup.mjs` 超 300 建议线——**2026-08-29 完成**：运行期 user reminder 组装（AUTO/permission、时间注入、编辑器注入、图片指针）抽到 `src/agent/setup-reminders.mjs`，setup.mjs 337→264 行

- [ ] **快层 slow-gate 未归册清理批（2026-09-07 R22 交付上报——18 用例散布 13 文件——exit 1 硬红——R12/§19.8 等早批遗留）**：auto-approve 2×10s/chat-panel 2×10.6s/image-paste 11s/dual-history/vscode-tools/compaction/suspension T-S2b/T-R17o 等——机械 test(→slow( 标注（test:full 照跑不受影响）——R22 自有用例全为假定时器 ms 级（零 R22 引入）——单独归册清理批候选