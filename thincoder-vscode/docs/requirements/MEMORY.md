# 记忆（MEMORY）— 需求（VSC 仓）

> 板块：记忆系统（个人 / 项目记忆 + 代码 / 文档索引——VS Code 端实现）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`MEMORY（CLI 仓·需求）§1–§3`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见本仓 `docs/design/MEMORY.md`（325 行）；权威源 = `src/memory.mjs`（274 行）· `src/memory-tool.mjs`（387 行）· `src/indexer.mjs`（457 行）。（W8 已迁核——现体 `thincoder-core/memory.mjs`）（W8 已迁核——现体 `thincoder-core/memory/code-sync.mjs`（codeSync/检索））
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

记忆系统让 agent **跨会话**保存、检索、治理知识——本端承载 personal（私有）/ project（项目共享）两层（**无 team 层**——团队记忆由 CLI 管）；
并同时提供**代码 / 文档索引**（code / doc chunk），使 `memory` / `code_search` / `doc_search` 得以在当前代码库内检索。
存储形态 = **markdown 文件即真相**（`cwd/.thincoder/memory/`，无独立 DB）——可人工编辑、可 git 管理。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-M1 | **两层记忆 + legacy 根**：写入指定 layer；物理目录 = `memoryDir(cwd)/<scope>`；legacy 根目录（无 layer）参与全量读取（标 `_scope="root"`）。证据 = `src/memory.mjs:27,30-37,173-180` | personal / project 写入落对应目录；legacy 根条目可被读取 | 无 team 层（`layer:"team"` 五个 action 全拒——`VS Code memory has no team layer`）；不做磁盘迁移 |
| F-M2 | **文件即真相（零 DB）**：markdown + frontmatter（与 CLI byte-compatible 序列化）；文件名 `YYYYMMDD-<slug>-<rand4>.md`；旧 `.json` 只读兼容。证据 = `src/memory.mjs:56-60,73-88,150-163` | 条目文件可人工编辑 / git 管理；无独立 DB 为真相（索引可重建） | 不把 DB / 索引作为知识本体 |
| F-M3 | **单工具五动作**：`memory` 单工具、`action` 路由（search / put / list / delete / clear）；**action 级只读**（search / list 只读——免审批 / 并行；put / delete / clear 保副作用门）。证据 = `src/memory-tool.mjs:119-131` · `src/agent/tool-gates.mjs:61-67` | 五动作分派在位；search / list 无审批；put / delete / clear 走审批门 | 不做多裸工具（旧 memory_put/search/delete 已合并退役） |
| F-M4 | **检索双通道**：向量优先（embedder + 索引在位 → `searchIndex(kind:"memory")` → stale 行 guard `filterAliveFiles` → 格式化）；无命中 / 异常回退关键词（子串打分：title 3 / tag 2 / content 1，CJK 单字 / bigram 回退）。证据 = `src/memory-tool.mjs:151-173` · `src/memory.mjs:184-241` | 无 embedder 时关键词路径照常出结果（score>0）；已删条目不被向量通道重新浮出 | 本端无 FTS5 / sqlite（关键词 = 子串打分）——端差登记 （W8 已退役——核面承接见 `docs/core/design/MEMORY.md` §6.9）（W8 已迁核——现体 `thincoder-core/memory.mjs`）|
| F-M5 | **三 kind 索引 + 重建判定**：kind 判定 memory 优先（`.thincoder/memory/` → `"memory"`）→ code / doc；索引产物 = `manifest.json` + `vectors.bin`（整体重建、提交点 = manifest）；`needsRebuild` = git 快路径 + dirty 四态 + ignored 集 + 删除扫描 + 无 git 兜底；reason 七词表。证据 = `src/index-discover.mjs:157-160` · `src/indexer.mjs:170-259`（两者 W8 已退役——核面承接见 `docs/core/design/MEMORY.md` §6.9） | 三 kind 检索面在位；重建判定可机判（reason ∈ 七词表） | 不扫 node_modules / 点目录（SKIP_DIRS）；不改「哪些文件可索引」规则 |
| F-M6 | **有效性校验（换模型不静默）**：`indexCompat`（manifest 模型比对，失配 → `model-changed`）；`loadIndex` 维度硬闸（头维度不符 → 空）；`searchIndex` 两道闸（不匹配 → 空——不返回全 0 分条目）；可见面两推口（状态 + 重建提示）。证据 = `src/indexer.mjs:141,156-165,354-361` · `src/extension/panel-index.mjs:34-35,116-131` | 换模型后检索不产出无效结果；状态面显示「模型不匹配 + 重建入口」 | **失败**（无 key / 网络）仍静默降级关键词；**不匹配**（配置态）不产出 + 可见——两语义不冲突 （W8 已退役——核面承接见 `docs/core/design/MEMORY.md` §6.9）|
| F-M7 | **回合记忆召回注入**：depth-0 非 resume 非 auto-turn 的回合注入记忆召回块（`pushMemoryRecall`——关键词路径，limit 3；注入失败静默跳过）。证据 = `src/agent/context-injections.mjs:159-171,189-201` | 回合装配含召回块（可断）；注入失败不阻塞回合 | 不改注入触发条件；本轮召回 = 关键词路径 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-M1 | 零依赖 | 存储 / 检索纯 `node:fs` 同步 API——零第三方依赖；向量索引为易失产物可整体重建 | `src/memory.mjs`（imports 面）；记忆面零 `dbPath` / `projectDir` 配置字段（本端实测零命中） （W8 已迁核——现体 `thincoder-core/memory.mjs`）|
| N-M2 | 降级可用 | embedder 缺失 / 索引缺失 / 命中空 → 关键词路径；`cosine` 异长返 0；`check-ignore` 失败跳过删除扫描 | `src/memory-tool.mjs:167,173` · `src/embedding.mjs:48` · `src/indexer.mjs:333` （W8 已迁核——现体 `thincoder-core/embedding.mjs`）（W8 已迁核——现体 `thincoder-core/memory/code-sync.mjs`（codeSync/检索））|
| N-M3 | 跨端一致 | 条目 frontmatter 与 CLI byte-compatible；记忆语义同源、各端独立实现 | 对位档 §2 / 设计档；端差登记 = 本档 §4 |
| N-M4 | 可机判 | 记忆 / 索引行为由用例断言；重 IO（真 git 子进程）用例归册慢层（快层 skip、全量照跑） | `test/memory-tool.test.mjs`（272 行 / 11 例）· `test/index-perception.test.mjs`（238 行）· `test/index-ignored-slow.test.mjs`（123 行——慢层） （W8 已退役——用例核面承接入 `test/memory-index-face.test.mjs`，机制见 `docs/core/design/MEMORY.md` §6.9）|

## 4. 对位与端差登记（对位 = `MEMORY（CLI 仓·需求）§1–§3`）

| 面 | 本端 | 端差（登记） |
|---|---|---|
| 存储 | 文件式 markdown + frontmatter（两层都是文件）；**无 FTS5 / sqlite / memory.db** | 对端 = 单文件 `~/.thincoder/memory.db`（FTS5 + BM25 + 向量 BLOB） |
| 层数 | personal / project 两层；**无 team** | 对端三层（team 由 CLI 管）；本端 `layer:"team"` 明确拒绝并指路 |
| 索引形态 | 独立 `.thincoder/index/`（manifest + vectors.bin）+ 按 kind 单库检索（W8 已退役——索引面已归一核 sqlite，数据面零迁移/零兼容；见 `docs/core/requirements/MEMORY.md` §4.7 端差行） | 对端 = DB 内三表 |
| 配置面 | 记忆锚定 cwd——无记忆路径配置字段；`~` 展开唯一接线 = `shell` 字段（`src/agent/setup.mjs:237`） | 对端四字段展开（`MEMORY（CLI 仓·需求）§5`） |
| 命名面 | 模型可见全 `layer`；内部存储 helper 仍名 scope（映射点 = 工具层） | 同源（内部词保留） |

- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
