# MCP 客户端（MCP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 客户端入口 | `thincoder-cli/src/mcp.mjs`（真实现） | `thincoder-vscode/src/mcp.mjs`（12 行转口）+ `src/mcp/index.mjs` |
| 基础件 | `src/mcp/helpers.mjs` | `src/mcp/utils.mjs` |
| 传输 | `src/mcp/transport-stdio.mjs` · `transport-http.mjs` · `transport-ws.mjs` | `src/mcp/stdio.mjs` · `http.mjs` · `ws.mjs` |

**共同契约**：可配项（三种传输）与 `mcp.servers[]` 同源。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 81 | `mcp.mjs` | 同路径 | 0.0130 · 异 | ② | 进核（**同名不同物**：CLI `mcp.mjs` = 真实现；VSC 侧 12 行转口 + 实现搬 `src/mcp/**`） | 融合：取 CLI 实现 + VSC 的分档结构与配置面板 / 监视面按端注入（④ 段） | 分叉 ＝ 拆分位置；可配项（三种传输）与 `mcp.servers[]` 同源、运维面等价；前提（同职责）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 144 | `src/mcp/helpers.mjs` ↔ `src/mcp/utils.mjs` | ② | 融合：取一侧（常量 + RPC id 生成） | 分叉 ＝ 档名（helpers / utils）；常量逐条同值（`INIT_TIMEOUT_MS` / `CALL_TIMEOUT_MS` / `ENDPOINT_WAIT_MS`）⇒ 前提成立 | — | S1（建核补齐） |
| 145 | `src/mcp/transport-stdio.mjs` ↔ `src/mcp/stdio.mjs` | ② | 融合：取一侧 + 核内 `mcp/` 切分归位 | 分叉 ＝ 档名与目录；同源自述 ⇒ 前提成立 | — | S1（建核补齐） |
| 146 | `src/mcp/transport-http.mjs` ↔ `src/mcp/http.mjs` | ② | 融合：同 #145 | 同 #145（VSC `http.mjs:252` 自述「与 CLI 语义同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 147 | `src/mcp/transport-ws.mjs` ↔ `src/mcp/ws.mjs` | ② | 融合：同 #145 | 同 #145 ⇒ 前提成立 | — | S1（建核补齐） |
| 148 | `src/mcp.mjs` ↔ `src/mcp/index.mjs` | ② | 融合：核内单一切分 + 端侧配置面板 / 监视面按端注入 | 分叉 ＝ 组织（VSC 2 行转口 + `mcp/index.mjs`）；可配项（三种传输）与 `mcp.servers[]` 同源；**承 §2.5 #81** | —（承 #81） | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（无命中 ①②③ 的条目——行内端差均以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**；相关端差（配置面板 / 监视面 = 端特有段）见 §1 与上文行「端差处置」列。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #81 / #144–#148）；**语义零改**，行号沿用原编号。
