# TODO 归档 — thincoder-vscode（TODO Archive）

> 归档档（FR18——形态权威 = `ENGINEERING-MODE（CLI 仓）§1.13` 修订 2026-09-11；本仓对位 = `§1.17/FR23`）：**已核销 / 已废弃条目自 `docs/TODO.md` 移入本档**。
> 活文件只留未决；组计数 = 未决数。本档条目保留原指针与状态（历史可追溯）。

---

## 需求池（归档 2 条）

- [x] **`eng(enter)` 加用户同意门**（2026-09-08 用户裁不处理——设计如此：模型自主翻转 + 持久化是设计意图；工程模式进出权在模型，无机械同意门）→ status=已废弃
- [x] **design token 签发后置 pending 需用户批准门**（2026-09-08 用户裁不处理——approval 保持 prompt 散文层；评审链人控点 = sign-off 流程本身）→ status=已废弃

## 技术待办（归档 9 条）

- [x] **收紧拒绝文案**——2026-09-08 核销（src+prompts grep "解锁" 0 命中——现拒绝文案均单行通用——前提已消失）→ 证据 `src/agent-tools/eng.mjs:1`（工程模式求值/门禁面）· status=已核销
- [x] **模块图补录**（**已达成（AGENTS.md:56-61 + ARCHITECTURE.md:119 全表）**）：`src/extension/panel-chat.mjs` / `webview/streaming.js` / `webview/panels.js` / `webview/state.js` 未入 AGENTS.md 模块图与 ARCHITECTURE——既有漂移 → 证据 `docs/design/ARCHITECTURE.md:92`（§3 模块地图）
- [x] **VSC agent/setup.mjs 500 行整**——2026-09-08 核销（agent-state.mjs 三函数已建——setup.mjs 拆后 422 行，核销时实测）→ 证据 `src/agent/agent-state.mjs:1`（拆分产物）· status=已核销
- [x] **GitHub #1 embedding 三件套、IK9IXD 公式渲染、IK9UWM 中文粘贴**（bug 修复/关闭状态需核）→ 证据 `src/embedding.mjs:1`（embedding 面——其余两条为外部 Issue）· **已核销（2026-09-11 live 巡检：三条均不在 open 列表——已修复/已关）**
- [x] **Gitee open 巡检（2026-09-11 live——13 条）triage 完成**（用户 13:36「都可以」）——**已开批 7 条**：
      #IKEV9I+#IKEV9H（ACP 修整·第 27 批）· #IKEZ1C+#IKALHO离线面（输入面·第 28 批）· #IKETT1（`~` 展开·第 29 批）·
      #IKD5XY（Stop 钩子·第 30 批·裁定：`Stop`/每回合/仅主会话）· #IKC6IX（方向键·第 31 批·裁定：多行竖移/单行历史）·
      #IKDWH7铺开（headers 全通路·第 32 批）· #IKDCVV②④（护栏+attention·第 33 批）——批档均在 `thincoder/docs/batches/2026-09-11-*`；
      **已修可关** = #IKE85W（ISSUE-FIX-BATCH F-1·待发版核销）· #IKCDMR（sanitizeConsultModels）——**已关闭 + 回复**（父侧 2026-09-11 代处理：GITEE_TOKEN 环境令牌可用）；
      **待外部回复** = #IKEI3M（已评：索端点文档）· #IKDWH7（已评：索网关响应体）· #IKALHO（已评：索 mac 环境）· #IKEOO0（已评：索现场数据）· #IKDCVV（已评：索提示原文）；
      **待现场数据** = #IKEOO0（崩溃日志/槽体积/贴图占比 → 后开设计批）· status=已核销（triage 完成）
- [x] **indexer 系列修复补 changelog 条目**——2026-09-08 核销（`CHANGELOG.md:309`「语义索引系列修复」条目——mtime 重建/git 漂移/空 chunk/manifest-only/multi-root/memory 接线等——与修复面吻合）→ 证据 `CHANGELOG.md:309` · status=已核销
- [x] **glob 方言缺口 / indexer 拆分 / 方向决策 A/B / ui.test 拆分 / slow-gate 归册**——2026-09-08 核查已勾销（search.mjs 已实现 brace 展开/!排除/扩展报错（不再静默）；indexer 拆分已完成（index-discover.mjs 独立）；快路径方案已定型实现（commit 预筛 + dirty 集 + mtime 兜底 + memory 目录特判）；测试 >500 债随测试全删消解）→ 证据 `src/index-discover.mjs:12`（拆分产物）· status=已核销
- [x] **eng-coder 标题栏末尾总显示 thinking**——2026-09-08 核销（activity.js:150-154 stateWord CLI currentTool parity + :262-274 chunk 级 think→thinking/tool→行尾 state word + chat.js:138-139/status-bar.js:31 `_currentTool` 实时清/置——固定 thinking 误导已消除）→ 证据 `webview/activity.js:150`（状态词分支）· status=已核销
- [x] **system.md:24 env-state 描述未含 slot**（**已销账（双端 discipline-normal 明写 slot；system.md 双端已不存在）**；原注：SESSION §11.2 实现后漂移——双端逐字同步——与 CLI TODO 同项）→ 证据 `src/agent/setup-reminders.mjs:27`（env-state 注入面）
