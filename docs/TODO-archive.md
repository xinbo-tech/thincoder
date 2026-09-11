# TODO 归档 — thincoder-vscode（TODO Archive）

> 归档档（FR18——形态权威 = **本仓 `docs/requirements/ENGINEERING-MODE.md` §1**）：**已核销 / 已废弃条目自 `docs/TODO.md` 移入本档**。
> 活文件只留未决；组计数 = 未决数。本档条目保留原指针与状态（历史可追溯）。

---

## 需求池（归档 6 条）

- [x] **`eng(enter)` 加用户同意门**（2026-09-08 用户裁不处理——设计如此：模型自主翻转 + 持久化是设计意图；工程模式进出权在模型，无机械同意门）→ status=已废弃
- [x] **design token 签发后置 pending 需用户批准门**（2026-09-08 用户裁不处理——approval 保持 prompt 散文层；评审链人控点 = sign-off 流程本身）→ status=已废弃

- [x] **GitHub #6 async 子代理保真**（中止丢弃静默 / 孤儿报告丢失 / 终态误读）→ 需求 本仓 `docs/design/AGENT-LOOP.md` §9（② 对位）· 任务书 本仓 `docs/batches/2026-09-11-VSC-ASYNC-PARITY.md` §2 · 设计 本仓 `docs/design/AGENT-LOOP.md` §12 · （§6 收口——AC-G1–G7 / AC-N1–N4 全绿 · 全量 477/477/0 + 令牌消费）· status=已核销
- [x] **VSC 活动区收口（R1–R6：清退+落流 / digest 可读性 / 待消化提示 / 块标题字段 / Send 按钮 / 状态行字段）**（2026-09-12 用户走查六发现）→ 需求 本仓 `docs/design/AGENT-LOOP.md` §12（② 对位；修订）· 任务书 本仓 `docs/batches/2026-09-12-VSC-ACTIVITY-CLOSURE.md` §2 · （§6 收口 2026-09-12 02:26——VSC 快层 624/609/1（唯一红为他链）· 令牌消费）· status=已核销
- [x] **VSC 子代理审批面对齐 CLI（child permission gate）**（2026-09-12 用户裁定 A——ask 弹卡带归属 / auto 继承静默）→ 需求 本仓 `docs/design/AGENT-LOOP.md` §17（② 对位）· 任务书 本仓 `docs/batches/2026-09-12-VSC-CHILD-PERMISSION.md` §2 · （§6 收口 2026-09-12 02:50——VSC 快层 643/627/2（两红均批外）· 令牌消费）· status=已核销

- [x] **散文锚测试退役（含双端提示词镜像锚；结构机检保留）**（2026-09-12 用户裁定「这种类型的测试都不要做」——判据：该类锚收益无实证、成本 ≈本仓 suite 50%、锚红后动作 = 把字改回去而非修缺陷；保留面 = 引用可解析 / 组计数 / 六态取值 / 行宽 / slow 门）→ 需求 本仓 `docs/requirements/TESTING.md` §5（F15–F22 / N10–N12）· 任务书 本仓 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md` §2 · （§6 收口 2026-09-12 06:37——VSC 快层 **653 → 592（−61 == 整删 61）** · 三环 = lint ✓ / 集成 28/28 ✓ / 全量 2 项批前既存红 · **本仓 `docs/requirements/TESTING.md` 首建** · 令牌消费）· status=已核销

## 技术待办（归档 32 条）

> 以下 13 条为 2026-09-12 **跨仓条目回位**（原 CLI 仓归档档——按「台账各仓自持」迁入本仓；9 条整迁 + 4 条拆分入本仓份）。

- [x] **VSC 端镜像（FR23——第 5 批）**（2026-09-10 用户裁定）→ 任务书 `docs/batches/2026-09-10-VSC-MIRROR.md` §2 · （两面并行 · VSC 353 + CLI 341 全绿 · AC37–AC44/T54–T66 过）· status=已核销

- [x] **VSC 端守卫收尾（F12 启动断言面 + 冻结窗口 E 对位 + 收敛路径信号面）**（2026-09-11 用户裁定「开」）→ 任务书 `docs/batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2 · （三面交付：6 文件 + 改 + 新测档 6 例 + 快层 414/413/0 · 修正轮 3+1 · §6 收口 + 令牌消费）· status=已核销

- [x] **VSC 写面 `agent.subagentModels` 零约束残留**（第 8 批交付 ⑤-1——coder 提出）：`_SIBLING_SHAPES` 补第 4 条 = 设计变更 → 证据 `src/agent-tools/settings.mjs:35`（`_SIBLING_SHAPES`）· status=已核销（第 12 批交付——T-S2.36/T-S2.37 绿）

- [x] **评审链守卫镜像**（第 11 批 VSC 对位面——designer 裁定 CLI 单端，父侧接受·可翻转）：三处同构（`src/advisor/citations.mjs` · `src/advisor/messages.mjs:62` · `src/advisor/run.mjs:58/166/170`）→ 证据 `src/advisor/run.mjs:58` · status=已核销（第 12 批交付——AC-VG1–AC-VG8 全过 8/8）

- [x] **eng-designer 角色 / 行为纪律批的 VSC 镜像**（已销账——第 5 批 VSC-MIRROR 收口，实测全在位（setup.mjs:156/163 + spawn-gate:16-19 + discipline:28-30））→ 证据 `docs/design/ENGINEERING-MODE.md` §2.22（VSC 镜像设计面）· status=已核销

- [x] **VSC 两处未纳登记**（第 12 批 designer 披露）→ 证据 `docs/design/ADVISOR-CONVERGENCE.md`（§13.10 登记项 + 收口 §14）· 任务书 `docs/batches/2026-09-11-VSC-GUARD-COMPLETION.md` §2 · status=已核销（第 18 批 §6 收口——三面交付 · AC-VG9–12 全过 · 令牌消费）

- [x] **live 块显示不可靠**（用户反馈——根因 ① 出生靠窗口 ② 快照兜底不全 ③ 终态对 never-born no-op）→ 证据 `src/extension/panel-callbacks.mjs:81` · status=已废弃（原状态=待设计——修复方向待用户裁）

- [x] **IMAGE-DOWNGRADE 跟进项 ②③**（② runVisionReader maxTurns 固定 10 ③ Stop 在降级 await 窗口内 no-op）→ 证据 `src/extension/image-handler.mjs:65` · status=已废弃（原状态=设计权在用户）

- [x] **git 工具 commit 镜像缺口**（granular add + 整索引 commit 双层混扫）→ 证据 `src/tools/git.mjs:200` · status=已废弃（原状态=待讨论（设计权在用户））

- [x] **评审注入路径硬编码项目约定——VSC 镜像份**（原 CLI 归档拆分迁入）→ 任务书 `docs/batches/2026-09-11-PORTABILITY-VSC-MIRROR.md` §2（批次二：VP-1–11 + VP-12——`conventions.mjs`/`project-context.mjs` 新档 + 六档提示词 + T-V01–19；VSC 快层 511/502/0）· status=已核销

- [x] **🔵 五项不修登记——VSC 侧三项**（原 CLI 归档拆分迁入；父侧知悉，裁定留痕在 git/批次档）：sync design 轮次不递增 / guard cap 读全局轮 / depth-undefined 缺省 async → 证据 `src/agent-tools/subagent-async.mjs:375`（VSC 预算入口）· （已知不修，留档）

- [x] **digest 注入预算扩面——VSC 各族注入器绕过**（原 CLI 归档拆分迁入）→ 证据 `src/agent-tools/async-settle.mjs:54` · 任务书 `docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §2 · status=已核销（群 B 批 §5 B5 双端 21 档含 consult 族 + §6 收口）

- [x] **INPUT-LOCK-BEHAVIOR 交付注——VSC 侧项 ①**（§7 机制正文补同步；原 CLI 归档拆分迁入）→ 证据 `docs/design/AGENT-LOOP.md:290` · status=已废弃（原状态=待讨论（① 已落））

- [x] **收紧拒绝文案**——2026-09-08 核销（src+prompts grep "解锁" 0 命中——现拒绝文案均单行通用——前提已消失）→ 证据 `src/agent-tools/eng.mjs:1`（工程模式求值/门禁面）· status=已核销
- [x] **模块图补录**（**已达成（AGENTS.md:56-61 + ARCHITECTURE.md:119 全表）**）：`src/extension/panel-chat.mjs` / `webview/streaming.js` / `webview/panels.js` / `webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE——既有漂移 → 证据 `docs/design/ARCHITECTURE.md:92`（§3 模块地图）
- [x] **VSC agent/setup.mjs 500 行整**——2026-09-08 核销（agent-state.mjs 三函数已建——setup.mjs 拆后 422 行，核销时实测）→ 证据 `src/agent/agent-state.mjs:1`（拆分产物）· status=已核销
- [x] **GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴**（bug 修复/关闭状态需核）→ 证据 `src/embedding.mjs:1`（embedding 面——其余两条为外部 Issue）· **已核销（2026-09-11 live 巡检：三条均不在 open 列表——已修复/已关）**
- [x] **Gitee open 巡检（2026-09-11 live——13 条）triage 完成**（用户 13:36「都可以」）——**已开批 7 条**：
      #IKEV9I+#IKEV9H（ACP 修整·第 27 批）· #IKEZ1C+#IKALHO离线面（输入面·第 28 批）· #IKETT1（`~` 展开·第 29 批）·
      #IKD5XY（Stop 钩子·第 30 批·裁定：`Stop`/每回合/仅主会话）· #IKC6IX（方向键·第 31 批·裁定：多行竖移/单行历史）·
      #IKDWH7铺开（headers 全通路·第 32 批）· #IKDCVV②④（护栏+attention·第 33 批）——批档均在 CLI 仓（历史 triage 记录——本仓无对应接收面）；
      **已修可关** = #IKE85W（ISSUE-FIX-BATCH F-1·待发版核销）· #IKCDMR（sanitizeConsultModels）——**已关闭 + 回复**（父侧 2026-09-11 代处理：GITEE_TOKEN 环境令牌可用）；
      **待外部回复** = #IKEI3M（已评：索端点文档）· #IKDWH7（已评：索网关响应体）· #IKALHO（已评：索 mac 环境）· #IKEOO0（已评：索现场数据）· #IKDCVV（已评：索提示原文）；
      **待现场数据** = #IKEOO0（崩溃日志/槽体积/贴图占比 → 后开设计批）· status=已核销（triage 完成）
- [x] **indexer 系列修复补 changelog 条目**——2026-09-08 核销（`CHANGELOG.md:309`「语义索引系列修复」条目——mtime 重建/git 漂移/空 chunk/manifest-only/multi-root/memory 接线等——与修复面吻合）→ 证据 `CHANGELOG.md:309` · status=已核销
- [x] **glob 方言缺口 / indexer 拆分 / 方向决策 A/B / ui.test 拆分 / slow-gate 归册**——2026-09-08 核查已勾销（search.mjs 已实现 brace 展开/!排除/扩展报错（不再静默）；indexer 拆分已完成（index-discover.mjs 独立）；快路径方案已定型实现（commit 预筛 + dirty 集 + mtime 兜底 + memory 目录特判）；测试 >500 债随测试全删消解）→ 证据 `src/index-discover.mjs:12`（拆分产物）· status=已核销
- [x] **eng-coder 标题栏末尾总显示 thinking**——2026-09-08 核销（activity.js:150-154 stateWord CLI currentTool parity + :262-274 chunk 级 think→thinking/tool→行尾 state word + chat.js:138-139/status-bar.js:31 `_currentTool` 实时清/置——固定 thinking 误导已消除）→ 证据 `webview/activity.js:150`（状态词分支）· status=已核销
- [x] **system.md:24 env-state 描述未含 slot**（**已销账（双端 discipline-normal 明写 slot；system.md 双端已不存在）**；原注：SESSION §11.2 实现后漂移——双端逐字同步——与 CLI TODO 同项）→ 证据 `src/agent/setup-reminders.mjs:27`（env-state 注入面）

- [x] **git 快路径 gitignore 盲区（窄化版）**（gitignored 的非 memory 可索引文件增删改不触发重建 → 索引静默过期）→ 证据 `src/indexer.mjs`（dirty 集检查点）· status=已核销（第 21 批 VSC-INDEX-PERCEPTION §5 B2 Done + §6 收口——B1–B6 全过 · 令牌消费）
- [x] **`listMemoryFiles` 只看 `.thincoder/memory/` 顶层 vs `discoverFiles` 递归**（嵌套 memory 反复判 file-removed 死循环）→ 证据 `src/index-discover.mjs` · status=已核销（同批 §5 B3 Done——单一 walk 同源）
- [x] **reason 串失配**（`file-changed` vs `file-changes`，另 added/removed/missing 未统一）→ 证据 `src/indexer.mjs` · status=已核销（同批 §5 B4 Done——统一 `file-changed`，旧串零残留）
- [x] **`loadIndex` / `searchIndex` 不校验 `vector_dim === decode.dim` 与 `embed_model`**（切换模型静默全 0 得分）→ 证据 `src/indexer.mjs` · status=已核销（同批 §5 B1 Done——头一致性 + 双闸）
- [x] **config.json FileSystemWatcher**（外部写盘后扩展端实时感知）→ 证据 `src/extension/chat-panel.mjs:316` · status=已核销（同批 §5 B5 Done——新档 `src/extension/config-watch.mjs`）

> 2026-09-12 用户裁定：**技术待办条目全部清空**（活档不再保留）——以下 5 条标已废弃入档。

- [x] **`src/extension/panel-messages.mjs` 499 行（距 500 硬限 1 行）**——下批触碰前先核余量/先拆 → 证据 `src/extension/panel-messages.mjs:1` · status=已废弃（原状态=待讨论）
- [x] **`src/extension/panel-messages.mjs` `handlePanelMessage` 单函数 378 行（L107–484）**——越函数档线（≥300 行）→ 拆分债 → 证据 `src/extension/panel-messages.mjs:107` · status=已废弃（原状态=待讨论）
- [x] **发布排期（VSC 0.8.11）——用户 2026-09-11 17:16 裁定挂起等指示**：webview 转义 #7 / async 保真 #6 / 输入面 / 死键等修复仍在工作树；流程 = 备包（版本号 + CHANGELOG + 构建 vsix）→ 用户测试 → 发布 → 证据 `docs/design/RELEASE.md` · status=已废弃（原状态=待讨论（挂起））
- [x] **VSC 文档补 NFR 小节**（design round2 提示词 · ARCHITECTURE 补 NFR · 原则 2 改述 · PROVIDER_PRESETS 静态镜像说明 · 模块小节补 memory/repomap/specs/extension/prompts · §6§3§4 补懒历史·双通道·Ctrl+I·readSSE · runAgent 签名 input→text · §4 补 thinkEnabledValue·noUsageStream · advisor 工具补 lsp）→ 证据 `docs/design/ARCHITECTURE.md:34`（§1）· status=已废弃（原状态=无 status）
- [x] **qwen 请求 thinking 未设置时携带 `thinking:{type:"enabled"}`**（智谱式参数，GLM 修复引入的通用 spec 默认注入；百炼兼容性属 Qwen `enable_thinking` 范畴——知悉观察）→ 证据 `src/provider/transports/openai.mjs:53` · status=已废弃（原状态=无 status）
