# 工作区约定：技能 · 规则 · 同伴 · 台账（WORKSPACE）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：本板块**同名旧档缺 ⇒ 无新内容并入**（不虚构）——详见 §6 / §8。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 技能发现 | `thincoder-core/skills.mjs` | `thincoder-vscode/src/extension/skills.mjs` |
| 规则发现 | `thincoder-core/rules.mjs` | `thincoder-vscode/src/extension/rules.mjs` |
| 同伴实例 / 域 | `thincoder-core/peer-instances.mjs` · `thincoder-core/peer-domains.mjs` | `thincoder-vscode/src/extension/peer-instances.mjs` · `peer-domains.mjs` |
| 台账规则 / 路径约定 | 已迁核——经 `@thincoder/core/{ledger,conventions,escape}.mjs` 引用（S2 U4） | 已迁核——同引核单源（S2 W4 · 自持镜像已删） |
| 台账展示面 | `thincoder-cli/src/tui/ledger-surface.mjs` | 端壳缝——核机制 `@thincoder/core/ledger-surface.mjs` + 面板推送供值（S2 W4） |

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
| 170 | `thincoder-core/skills.mjs` ↔ `thincoder-vscode/src/extension/skills.mjs` | ② | 融合：取一侧（发现规则两端同构：扁平 + `SKILL.md` / 排序 / 项目层优先）+ fs 面（同步 / 异步）按端注入 | 分叉 ＝ 目录 + loader 形态（VSC 头注自述「同构语义…语义同源、实现自持」`:3-5`）⇒ 前提成立 | — | S1（建核补齐） |
| 171 | `thincoder-core/rules.mjs` ↔ `thincoder-vscode/src/extension/rules.mjs` | ② | 融合：取一侧 | 分叉 ＝ 目录归属（VSC 住 `extension/`）⇒ 前提成立 | — | S1（建核补齐） |
| 172 | `src/peer-instances.mjs` ↔ `thincoder-vscode/src/extension/peer-instances.mjs` | ② | 融合：取一侧 + 端判别面按端注入 | 分叉 ＝ 目录 + 端标记判别（VSC 头注自述「VS Code 镜像」`:2`）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 173 | `src/peer-domains.mjs` ↔ `thincoder-vscode/src/extension/peer-domains.mjs` | ② | 融合：取一侧 | 分叉 ＝ 目录（VSC 头注自述「VS Code 镜像」`:3`）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 174 | `thincoder-cli/src/tui/ledger-surface.mjs` ↔ `thincoder-vscode/src/extension/ledger-surface.mjs` | ② | 融合：取一侧 + 渲染面按端注入 | 分叉 ＝ 目录（CLI 住 `tui/` / VSC 住 `extension/`）；台账规则两端逐字同（`ledger.mjs` 同路径 #71）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（各行差异仅组织面 / 目录归属 / 注释出处，端差以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/ledger-surface.mjs`——#174）。

## 6. 机制面（B 轮 · 2026-09-14 · 第 3 批）

**结论：本板块同名旧档缺 ⇒ 无新内容并入（不虚构）。**

逐档比对前提：本批的旧档参照面 = `thincoder-cli/docs/{design,requirements}/WORKSPACE.md`。**实核（as-of 2026-09-14）**：

| 旧档 | 状态 |
|---|---|
| `thincoder-cli/docs/design/WORKSPACE.md` | **不存在**（CLI / VSC 两树设计 / 需求两侧均无同名档） |
| `thincoder-cli/docs/requirements/WORKSPACE.md` | **不存在**（同上） |

⇒ 本批对 WORKSPACE 板块**无并入面**——不据其他档代拟机制文本（不虚构）。

**越段发现（只记 · 未处置）**：工作区约定面机制文本**散布于旧档**（非同板块同名档）——台账 / 引用自足面住 `thincoder-cli/docs/design/LEDGER-SELF-CONTAINED.md`；同伴实例 / 域面住 `thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md`（+ 同名需求档）；技能 / 规则发现机制在旧档无专档。⇒ **触发 = 父侧另派**（若续并，参照面须按「工作区约定面」逐档点名）。

## 7. 并入的关键决策记录（含否决备选）

**本批无新增**——现有决策面见 §2 各行裁决与 §3–§4（本子系统无独立须裁行）；本板块无未落档的旧档决策（同名旧档缺）。

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

**不适用**——本板块无同名旧档（无 (d) 类叙述可登记）。

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| `thincoder-cli/docs/design/LEDGER-SELF-CONTAINED.md` | 台账 / 引用自足面机制 | 非同板块同名档 ⇒ **越段登记**——触发 = 父侧另派 |
| `thincoder-cli/docs/design/MULTI-INSTANCE-COLLAB.md`（+ 同名需求档） | 同伴实例 / 域面机制 | 同上 |
| 技能 / 规则发现机制 | 旧档无专档（`ARCHITECTURE.md` 模块图行之外无描述） | 同上 |

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #71–#73 / #170–#174）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`ledger-surface.mjs`——#174）。
- 2026-09-14（**B 轮并入 · 第 3 批**）：§6 **机制面 = 同名旧档缺**（`thincoder-cli/docs/{design,requirements}/WORKSPACE.md` 均不存在——两产品树实核）⇒ 无并入内容（不虚构）；§7 无新增决策；§8 登记工作区约定面机制文本散布于旧档（越段发现）；§9 体量（低于软线，无需拆分）；首部加机制面指针一行。
- 2026-09-15（**S2 W4 · VSC 单元**）：§1 两行收正——台账规则 / 路径约定（两产品均已迁核：CLI = S2 U4 · VSC = S2 W4）· 台账展示面（VSC = 端壳缝：核机制 + 面板推送供值）；机制条文零改。
