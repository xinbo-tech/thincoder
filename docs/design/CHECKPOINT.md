# 检查点与 git 面（CHECKPOINT）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 检查点核心 | `thincoder-cli/src/git/checkpoint.mjs` | `thincoder-vscode/src/tools/checkpoint.mjs` |
| 检查点工具面 | `src/tools/git-checkpoint.mjs` · `src/tools/git-ext.mjs` | 同名（同路径对） |

**共同契约**：同一目录同一格式、快照跨端互通。

> 相关但另住他档：**hooks 四事件**（`src/hooks.mjs` ↔ 核内）→ `docs/design/AGENT-LOOP.md` #169；**team 层记忆 git 同步**（`src/git/gitmem.mjs`）→ `docs/design/MEMORY.md` #168。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 48 | `tools/git-checkpoint.mjs` | 同路径 | 0.9091 · 异 | ② | 融合（共享函数单实现 + 依赖闭包归一） | 分叉 = VSC 本地副本化共享函数 + 模块位置差异；前提（两端同职责）仍成立（②） | — | S0a（首批建核） |
| 49 | `tools/git-ext.mjs` | 同路径 | 0.9071 · 异 | ② | 融合（注释归一 + 依赖闭包） | 分叉 = 注释与依赖组织差异；函数体逐字相同——无失效前提（②） | — | S0a（首批建核） |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#48 `tools/git-checkpoint.mjs`**（同路径 · j 0.9091 · sha `7b56f04cc565` / `5d9a226a1321` · 143 / 150 行）
  - 左端读数（CLI）：`escapeXml` 经 `thincoder-cli/src/tools/git-checkpoint.mjs:7` 由 `thincoder-cli/src/agent/helpers.mjs:89-91` 导入（共享实现）；checkpoint 子系统依赖 `../git/checkpoint.mjs`（`:8-16`）。
  - 右端读数（VSC）：`escapeXml` 本地定义（`thincoder-vscode/src/tools/git-checkpoint.mjs:21-23`；注释自述「镜像 CLI 版本」）；依赖 `./checkpoint.mjs`（`:8-16`）；头注含「CLI 镜像：」行（`:5`）。
  - 建议归一形态：融合——`escapeXml` 下沉核内单一实现（消除本地副本）；依赖 / 路径按核内闭包归一。
  - 影响面：无行为差——两 `escapeXml` 实现逐字相同（同款 5 链替换、同序）；差异属组织面（共享函数本地副本化 + 子系统模块位置）⇒ 不命中三口径（须用户裁 = —）。
- **#49 `tools/git-ext.mjs`**（同路径 · j 0.9071 · sha `682c67b71974` / `0cfaddecef28` · 173 / 174 行）
  - 左端读数（CLI）：注释 + 依赖 `../git/checkpoint.mjs`（动态导入 `thincoder-cli/src/tools/git-ext.mjs:56`）；函数体与右端逐字相同。
  - 右端读数（VSC）：注释（含「CLI 镜像：」注记 `thincoder-vscode/src/tools/git-ext.mjs:5`）+ 依赖 `./checkpoint.mjs`（`:57`）；函数体逐字相同（filterLines / runGitStrict / validateRef / gitConfigArgs / snapshotBefore / executeExtAction）。
  - 建议归一形态：融合——注释归一（删镜像注记）+ 依赖路径按核内闭包。
  - 影响面：无行为 / 契约差（差异 = 注释与依赖组织）⇒ 不命中三口径（须用户裁 = —）。

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 167 | `src/git/checkpoint.mjs` ↔ `src/tools/checkpoint.mjs` | ② | 融合：取一侧（v2 全文件快照 / rewind / 每文件恢复 / 只读 git 仓） | 分叉 ＝ 目录归属；VSC 头注自述「MIRROR of thincoder CLI src/git/checkpoint.mjs——同一目录同一格式、快照跨端互通」⇒ 前提成立 | — | S1（建核补齐） |

**工具实现面单端档映射（原 §2.5（四）表中的本子系统行）**

| 单端档 | 对位 / 处置 |
|---|---|
| VSC `tools/checkpoint.mjs` | ↔ CLI `git/checkpoint.mjs`（行 #167） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（#48 / #49 差异仅注释与依赖组织；#167 为同源自述镜像——均不命中 ①②③）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**；快照格式跨端互通 = 已兼容（登记见 `docs/design/SESSION.md` §4 的上抛清单第 3 行同族）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #48 / #49 / #167 + 四要素明细 + 映射行）；**语义零改**，行号沿用原编号。
