# 上下文压缩 · 标题 · 文本额度（CONTEXT-COMPACTION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 上下文压缩 | `thincoder-cli/src/context.mjs` | `thincoder-vscode/src/compact.mjs` |
| 会话标题 | `src/generate-title.mjs` | `src/extension/generate-title.mjs` |
| 文本额度 | `src/text-budget.mjs` | `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 162 | `src/context.mjs` ↔ `src/compact.mjs` | ② | 融合：取一侧（压缩触发 / 摘要 / 降级截断 / 尾部预算） | 分叉 ＝ 档名（context / compact）+ 目录；VSC 头注 20+ 处自述「CLI parity（CONTEXT-COMPACTION.md D2/D3/D4/D6）」⇒ 前提成立 | — | S1（建核补齐） |
| 163 | `src/generate-title.mjs` ↔ `src/extension/generate-title.mjs` | ② | 融合：取一侧 + 端差（CLI 仅 OpenAI 兼容 / VSC 三格式分派）按端注入 | 分叉 ＝ 目录 + 格式分派（CLI 头注自述「CLI is OpenAI-compatible ONLY」）；会话标题语义同 ⇒ 前提成立 | — | S1（建核补齐） |
| 164 | `src/text-budget.mjs` ↔ `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） | ② | 融合：核内单一文本额度纯函数（头保 + 中段标记 + 尾保） | 分叉 ＝ 落点（CLI 独立档 / VSC 住 run-helpers）；计长口径（UTF-16 码元）两端同 ⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（三条均为同构融合，差异以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #162–#164）；**语义零改**，行号沿用原编号。
