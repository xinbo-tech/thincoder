# 工作区约定：技能 · 规则 · 同伴 · 台账（WORKSPACE）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 技能发现 | `thincoder/src/skills.mjs` | `thincoder-vscode/src/extension/skills.mjs` |
| 规则发现 | `src/rules.mjs` | `src/extension/rules.mjs` |
| 同伴实例 / 域 | `src/peer-instances.mjs` · `src/peer-domains.mjs` | `src/extension/peer-instances.mjs` · `peer-domains.mjs` |
| 台账规则 / 路径约定 | `src/ledger.mjs` · `src/conventions.mjs` · `src/escape.mjs` | 同名（同路径对） |
| 台账展示面 | `src/tui/ledger-surface.mjs` | `src/extension/ledger-surface.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 71 | `ledger.mjs` | 同路径 | 0.8595 · 异 | ② | 进核 | 融合：取一侧、逐字随迁（函数体逐行同构） | 分叉 ＝ `configDir` 取词与注释出处编号（VSC 引 `config-io.mjs`；CLI 引 PORTABILITY FR12）；前提 ＝ 无（纯组织） | — | S1（建核补齐） |
| 72 | `conventions.mjs` | 同路径 | 0.8242 · 异 | ② | 进核 | 融合：取一侧、逐字随迁 | 分叉 ＝ 头注释出处编号（CLI 引 PORTABILITY FR12/PO-10 / VSC 引 VP-10）；`classifyPath` 次序与 `loadConventions` 语义逐字等价 | — | S1（建核补齐） |
| 73 | `escape.mjs` | 同路径 | 0.7840 · 异 | ② | 进核 | 融合：取一侧（替换字符写法归一为 U+FFFD） | 分叉 ＝ 写法与注释（VSC 标 v5 / CLI parity）；算法逐字等价；前提 ＝ 无（纯写法） | — | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 170 | `src/skills.mjs` ↔ `src/extension/skills.mjs` | ② | 融合：取一侧（发现规则两端同构：扁平 + `SKILL.md` / 排序 / 项目层优先）+ fs 面（同步 / 异步）按端注入 | 分叉 ＝ 目录 + loader 形态（VSC 头注自述「同构语义…语义同源、实现自持」`:3-5`）⇒ 前提成立 | — | S1（建核补齐） |
| 171 | `src/rules.mjs` ↔ `src/extension/rules.mjs` | ② | 融合：取一侧 | 分叉 ＝ 目录归属（VSC 住 `extension/`）⇒ 前提成立 | — | S1（建核补齐） |
| 172 | `src/peer-instances.mjs` ↔ `src/extension/peer-instances.mjs` | ② | 融合：取一侧 + 端判别面按端注入 | 分叉 ＝ 目录 + 端标记判别（VSC 头注自述「VS Code 镜像」`:2`）⇒ 前提成立 | — | S1（建核补齐） |
| 173 | `src/peer-domains.mjs` ↔ `src/extension/peer-domains.mjs` | ② | 融合：取一侧 | 分叉 ＝ 目录（VSC 头注自述「VS Code 镜像」`:3`）⇒ 前提成立 | — | S1（建核补齐） |
| 174 | `src/tui/ledger-surface.mjs` ↔ `src/extension/ledger-surface.mjs` | ② | 融合：取一侧 + 渲染面按端注入 | 分叉 ＝ 目录（CLI 住 `tui/` / VSC 住 `extension/`）；台账规则两端逐字同（`ledger.mjs` 同路径 #71）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（各行差异仅组织面 / 目录归属 / 注释出处，端差以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #71–#73 / #170–#174）；**语义零改**，行号沿用原编号。
