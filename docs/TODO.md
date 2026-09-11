# TODO — thincoder-vscode 项目级待办
> 两池台账（FR18）：**需求池**（用户需求点）/ **技术待办**（设计遗留 / 评审发现 / 债）——形态权威 = `ENGINEERING-MODE（CLI 仓）§1.13`（本仓镜像面 = `ENGINEERING-MODE（CLI 仓）§1.17/FR23`）。
> 需求池条目 = 一行指针（`<需求句> → 需求 <档> §X · 任务书 batches/… §2 · status=<六态>`）；技术待办 = 指针（可指则指）+ 最小证据行（`file:line` + 症状）。**不展开任务细节**（细节住设计档 / 批次档）。
> 状态机六态：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃——**已核销 / 已废弃 → 移入本仓 `docs/TODO-archive.md`**（活文件只留未决；组计数 = 未决数）；组计数（N 条）与组内实条目数同改（D3）。
> 维护：**记录 + 状态推进 + 物理落笔 = 主 agent**（§1.13——2026-09-11 修订）。本文件只承载**当前未决项**——已核销 / 已废弃移入本仓 `docs/TODO-archive.md`（git history 可追溯）。

---

## 需求池（1 条）

- [ ] **GitHub #6 async 子代理保真**（中止丢弃静默 / 孤儿报告丢失 / 终态误读——issue 四根因经现场复核：①④ 机制面已不成立、②③ 属实）→ 需求 CLI 仓 `docs/requirements/AGENT-LOOP` §9（F-G1~F-G7）· 任务书 CLI 仓 `docs/batches/2026-09-11-VSC-ASYNC-PARITY` §2 · 设计本仓 `docs/design/AGENT-LOOP` §12 · status=在途

## 技术待办（9 条）



### 文档债 / ARCHITECTURE 漂移（doc-sweep 候选——是否已被 VSC 文档批覆盖需核）

- [ ] **发布排期（VSC 0.8.11）——用户 2026-09-11 17:16 裁定：挂起等指示**：webview 转义 #7 / async 保真 #6 / 输入面 / 死键等修复仍在工作树；流程 = 备包（版本号 + CHANGELOG + 构建 vsix）→ **用户测试** → 发布 → 证据 `docs/design/RELEASE.md`（发布流程面）· status=待讨论（挂起）
- [ ] **VSC 文档补 NFR 小节**（原「advisory 未实现项」10 项清单核查后仅剩此项——余已覆盖/落地）：design round2 提示词、ARCHITECTURE 补 NFR 小节、原则 2 改述、PROVIDER_PRESETS 静态镜像说明、模块小节补 memory/repomap/specs/extension/prompts、§6§3§4 补懒历史·双通道·Ctrl+I·readSSE、runAgent 签名 input→text、§4 补 thinkEnabledValue·noUsageStream、advisor 工具补 lsp → 证据 `docs/design/ARCHITECTURE.md:34`（§1）
- [ ] **qwen 请求 thinking 未设置时携带 `thinking:{type:"enabled"}`**（智谱式参数，GLM 修复引入的通用 spec 默认注入）——百炼兼容性属 Qwen `enable_thinking` 范畴——知悉观察 → 证据 `src/provider/transports/openai.mjs:53`（spec 默认注入面）



### 语义索引 needsRebuild 盲区

- [ ] **git 快路径 gitignore 盲区（窄化版）**：memory 目录盲区已修，但 gitignored 的**非 memory** 可索引文件增删改仍不触发重建（dirty 集只含 git status 报告项）→ 索引静默过期 → 证据 `src/indexer.mjs:177`（dirty 集检查点）· status=在途（第 21 批——批 = CLI 仓 `docs/batches/2026-09-11-VSC-INDEX-PERCEPTION.md` §2 · 设计 = `docs/design/MEMORY.md` §4）
- [ ] **`listMemoryFiles` 只看 `.thincoder/memory/` 顶层，`discoverFiles` 递归子目录** → 嵌套 memory 文件被索引却反复判 file-removed（死循环）——二选一未定 → 证据 `src/index-discover.mjs:65`（listMemoryFiles）· status=在途（第 21 批——裁定：listMemoryFiles 递归对齐 · 设计 = `docs/design/MEMORY.md` §4）
- [ ] **reason 串失配**：`file-changed`（git 路径）vs `file-changes`（fallback），另 file-added/removed/missing 未统一——真差异残留 → 证据 `src/indexer.mjs:194`（file-changed 报出点）· status=在途（第 21 批——裁定：统一 `file-changed`）
- [ ] **`loadIndex` / `searchIndex` 不校验 `vector_dim === decode.dim` 与 `embed_model`**——切换 embedding 模型（维度不同）静默全 0 得分 → 证据 `src/indexer.mjs:224`（searchIndex）· status=在途（第 21 批——裁定：不产出 + 可见 · 设计 = `docs/design/MEMORY.md` §4）

### config.json 外部写盘感知

- [ ] **config.json FileSystemWatcher**：外部（CLI `/advisor` 等）写盘后扩展端实时感知 → `_pushSettingsLight` 推送快照（B1 openSettings 拉新已落地；watcher 覆盖"面板常开时外部写盘实时刷新"）→ 证据 `src/extension/chat-panel.mjs:316`（`_pushSettingsLight`）· status=在途（第 21 批——裁定：事件驱动 + 去抖 + stat 元组抑制 · 设计 = `docs/design/SETTINGS.md` §2.6）



### 会话流 / UI 反馈（VSC digest 可见性）

- [ ] **digest 开始无可见指示（2026-09-08 用户实测——对齐 CLI）**：异步子 agent 完成 → 区块并入会话流后长时间无动静（消化已开始但在等消化模型首 token，VSC 只 logEvent 不画指示）。CLI 一进 digestTurn 即画 `[auto-turn: digesting…]`（零延迟）。改：VSC 消化分支补即刻 host→webview 指示（digesting N finished reports…）+ 状态行置忙 → 证据 `src/extension/suspension.mjs:265`（仅 logEvent）· status=在途（第 21 批——裁定：流内指示元素起止两态 · 设计 = `docs/design/WEBVIEW.md` §7.4）


