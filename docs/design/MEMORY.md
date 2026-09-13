# 记忆系统（MEMORY）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 / §2.12.3 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 记忆库 | `thincoder/src/memory.mjs`（转口）+ `src/memory/**`（8 档） | `thincoder-vscode/src/memory.mjs` · `memory-tool.mjs` |
| 工具面 | `src/memory/docs.mjs` 的 `memoryTools` | `src/memory-tool.mjs` |
| 索引（代码 / 文档） | `src/memory/code-index.mjs` · `code-sync.mjs` | `src/indexer.mjs` · `index-bin.mjs` · `index-discover.mjs` · `tools/code.mjs` |
| 嵌入 | `src/embedding.mjs` | 同（同路径对） |
| team 层同步 | `src/git/gitmem.mjs` | —（无对位） |
| 子命令面 | `src/cli/memory-command.mjs` | —（无对位） |

**本子系统的归一方向（已裁）**：面向 **CLI 语义**归一（用户裁定 A12——前提失效，非选边）；`node:sqlite` 采纳为定案（`CORE-UNIFICATION.md` §2.11 A8）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 75 | `embedding.mjs` | 同路径 | 0.6566 · 异 | ② | 进核 | 融合：取 CLI（每请求 60s 超时 + `toBlob`/`fromBlob`）+ VSC 的本地 RETRYABLE 常量归位 | 分叉 ＝ VSC 缺每请求 60s 超时（`src/embedding.mjs:71`）与 blob 助手（存储介质不同所致）；前提（存储面已随 A12 归一为 CLI sqlite）⇒ 差异消失 | — | S1（建核补齐） |
| 82 | `memory.mjs` | 同路径 | 0.0093 · 异 | ③ | 进核（**同名不同物**：CLI 21 行转口 + `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | 以 CLI 为准（A12——**前提失效，非选边**）；VSC 侧改接线；旧数据迁移另议（§2.5.1 / §2.12.3） | 分叉 ＝ **前提失效**（「VS Code 内置 Node 不支持 sqlite」不成立）；实测 CLI = `node:sqlite` + FTS5（`src/memory/schema.mjs:9,68`）/ VSC 零 sqlite（纯 md，`src/memory.mjs:26-37`） | **①②③** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 133 | `src/memory.mjs` + `src/memory/**`（8 档）↔ `src/memory.mjs` + `memory-tool.mjs` | ③ | 以 CLI 为准（A12——**前提失效，非选边**） | 分叉 ＝ **前提已失效**（「VS Code 内置 Node 不支持 sqlite」不成立；CLI `node:sqlite`+FTS5 `src/memory/schema.mjs:9,68` / VSC 零 sqlite）⇒ 直接归一；**承 §2.5 #82** | —（承 #82） | S1（建核补齐） |
| 134 | `src/memory/docs.mjs`（`memoryTools`）↔ `src/memory-tool.mjs` | ② | 融合：核内单一 memory 工具面（动作集 / schema / 文案取一侧） | 分叉 ＝ 拆档位置（CLI 工具面住 `memory/docs.mjs:241`）；两端动作集同规格（五动作 / layer 词面）⇒ 前提成立；**随 #82 / A1 归一** | —（承 #82） | S1（建核补齐） |
| 135 | `src/cli/memory-command.mjs` ↔ 核内（VSC 无对位） | ④ | 端特有段：CLI `memory` 子命令面（shell 通道） | 结构性不对称 = **仅 CLI 有 shell 子命令通道**（VSC 无终端子命令面——与 #125 冷 cwd 面同源）；**非**「差异」排除（A9） | — | 不迁（端特有） |
| 136 | `src/memory/code-index.mjs` + `code-sync.mjs` ↔ `src/indexer.mjs` | ③ | 以 CLI 为准（**同一 A12 前提失效**；进核） | 分叉 ＝ 索引存储（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI sqlite 库——CLI `src/**` 零 `.thincoder/index` 命中）；前提同 #82 ⇒ 失效；**随 A1 归一** | —（承 #82） | S1（建核补齐） |
| 137 | （CLI 无切分档）↔ `src/index-bin.mjs` · `index-discover.mjs` | ② | 融合：随核内索引面一并归位（向量编解码 / 走查规则） | 分叉 ＝ 拆档（VSC 拆 3 档 / CLI 2 档）；走查规则（`SKIP_DIRS` / 点目录 / `.thincoder` 特例）两端同源（VSC `index-discover.mjs:5-8` 自述「CLI-aligned」）⇒ 前提成立 | — | S1（建核补齐） |
| 168 | `src/git/gitmem.mjs` ↔ 核内（VSC 侧无 team 层同步面） | ③ | 以 CLI 为准（team 层记忆 git 同步）；VSC team 层现行「明确拒绝、指向 CLI」⇒ 随 A1 归一 | 分叉 ＝ team 层处置（VSC 无该层）；**承 #82 / A1** | —（承 #82） | S1（建核补齐） |

### 2.3 工具实现面单端档映射（原 §2.5（四）「工具实现面单端档逐档映射」表中的本子系统行）

| 单端档 | 对位 / 处置 |
|---|---|
| VSC `tools/code.mjs` | ↔ CLI `memory/docs.mjs` 的 `codeSearchTool` / `docSearchTool` ⇒ 随 #82 |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A1 | `memory.mjs`（席位 #82；实为 CLI `src/memory/**` 8 档 ↔ VSC `memory.mjs` + `memory-tool.mjs`） | ①②③ | `node:sqlite` `DatabaseSync` + FTS5（`src/memory/schema.mjs:9,68`）；库 = `~/.thincoder/memory.db`；三层 `personal` / `project` / `team`，**personal = 全机共享的库行**；project 层 = `.thincoder/memory/*.md`（**只扫顶层** `src/memory/core.mjs:205-212`） | 零 sqlite——纯仓内 md（`.thincoder/memory/{personal,project}/*.md`，`:26-37`）+ 遗留 `.json` 读兼容（`:150-162`）；两层（`team` 明确拒绝、指向 CLI）；`personal` 落在**仓库目录内** | **以 CLI 为准**（A12——前提失效，非选边）；`node:sqlite` 采纳为定案（§2.11 A8） | ① 记忆存哪变了（VSC 的 personal 由仓内目录 → 全机库）；② 两端**从此可互读**（现状：VSC 读不到 CLI 的库、CLI 不递归读 VSC 的子目录）；③ 旧数据要搬（见 A2）；④ 检索能力（FTS5 + 中文逐字分段）随之而来；⑤ 两侧测试面 | **已裁（2026-09-13）· 按建议** |
| A2 | 记忆面旧数据迁移（§2.12.3 第 2 行） | ②③ | 有 `memory` 子命令（list / search / put / remove）与 `/reindex`；**无 md / json 导入命令** | 用户既有记忆 = 仓内 `personal` 层 md + 遗留 `.json` + `workspaceState` 的 `thincoder.modelPrefs` | **已裁（2026-09-13）：① 提供一次性导入器**（md / json → `entries`）——**父侧代选**（用户 2026-09-13「全部按建议」未逐字指定本行，已披露 ✓；理由：选 ② 会让 VSC 老用户记忆清空，与「不丢用户数据」相悖）。**落地** = S2 建一次性导入器（`memory import` 子命令面；`modelPrefs` 仍取不到——住 VS Code 状态，不在文件系统） | 用户既有记忆保留（md / json → `entries`）；`modelPrefs` 明确不迁（无文件系统载体） | **已裁（2026-09-13）· ① 一次性导入器（父侧代选）** |
| A3 | VSC 引擎下限（§2.12.3 第 1 行） | ② | `engines.node = >=24` | `engines.vscode = ^1.85.0` | 抬到 **候选 `^1.104.0`**（A13 已裁「可抬」；**原候选 `^1.101.0` 经本轮实核不成立** ✗——见下行与 §2.11 A8）；**须真机实测确认 + 用户过目** | 放弃 VS Code < 新下限的用户（A13 已接受该代价）；装上旧宿主 ⇒ 扩展不可用 | 已裁（「可抬」）· **值换候选 `^1.104.0` + 待真机实测 + 过目** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 11 | **代码索引存储面**（VSC `.thincoder/index/{manifest.json,vectors.bin}` 文件 ↔ CLI `node:sqlite` 库内索引） | 数据面 / 文件格式 | 取 CLI（索引入 sqlite 库；VSC 索引文件面退场） | 旧文件格式**不再写**；读取兼容或迁移说明（随 A2 导入器一并处置）· CHANGELOG | 索引面文档 + 用例 + 两产品 `CHANGELOG.md` | 已裁（2026-09-13）· 按建议（承 §2.5.1 A1 / §2.11 A8） |

### 4.1 无法兼容项上抛（自 §2.12.3 搬入 · 逐字）

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 1 | **VSC 引擎下限抬升**（`engines.vscode` `^1.85.0` → **候选 `^1.104.0`**） | 旧宿主内置 Node < 22.13 ⇒ 无 `node:sqlite`；**且 Electron 35.x（= VS Code 1.101 / 1.102）未获 sqlite 内置修复**（electron/electron #47706 回移分支 = 36 / 37 / 38-x-y）⇒ 原候选 `^1.101.0` 不成立；A13 已裁「抬高、不保留降级路径」⇒ **无兼容路径可给**（给降级路径 = 两套逻辑再现 ✗） | 左端 = VSC 现状（`thincoder-vscode/package.json` 的 `engines.vscode: ^1.85.0`）· 右端 = 新下限 **`^1.104.0`（候选，经真机实测确认后定值）** · 建议 = 采纳（A13）· 影响面 = < 新下限用户不可用；**配套护栏** = `activate()` 自检 + 明确提示（不崩） | 已裁（「可抬」· 2026-09-13）· **候选上修 `^1.101.0` → `^1.104.0` · 值待真机实测 + 过目**（§2.5.1 A3 / §2.11 A8） |
| 2 | **记忆面旧数据迁移**（VSC `personal` 层 md 档 · 遗留 `.json` 记忆档 · `workspaceState` 的 `thincoder.modelPrefs`） | VSC `personal` = 仓内目录（`thincoder-vscode/src/memory.mjs:26-37`）· CLI `personal` = 用户级全局 sqlite 库行（`thincoder/src/config.mjs:92`）；CLI 侧无导入命令（`thincoder/src/cli/memory-command.mjs:21-63`）· 同步只认顶层 `.md`（`thincoder/src/memory/core.mjs:205-212`）⇒ **无自动迁移路径**；`modelPrefs` 住 VS Code 状态（不在文件系统） | 左端 = VSC 现状（仓内 md 持久）· 右端 = CLI 现状（全局库 + 顶层 md）· 建议 = **① 提供一次性导入器**（md / json → `entries`）或 ② 用户手工迁移 / 丢弃 · 影响面 = 用户既有记忆 + 语义（每仓私有 → 全机共享） | **已裁（2026-09-13）· ① 一次性导入器**（**父侧代选**，已披露；落地 = S2 建 `memory import` 面。§2.5.1 A2） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**记忆面（S2 改）** · **记忆面导入器（S2 新建）** · **版本下限面（S2 改——须过目）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #75 / #82 / #133–#137 / #168 / 映射行 · §2.5.1 A1–A3 · §2.12.2 第 11 行 · §2.12.3 第 1–2 行）；**语义零改**，行号沿用原编号。
