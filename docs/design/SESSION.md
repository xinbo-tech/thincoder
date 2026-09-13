# 会话与历史（SESSION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 会话数据层 | `thincoder-cli/src/session.mjs` · `session-store.mjs` · `session-segments.mjs` · `session-guard.mjs` · `session-migrate.mjs` · `session-rename.mjs` | `thincoder-vscode/src/extension/session-io.mjs` · `session-slot-write.mjs`（记录存储内联） |
| 槽位 | `src/session-slots.mjs` | `src/extension/session-slots.mjs` |
| 清理 | `src/session-gc.mjs`（+ `session gc` 子命令） | `src/extension/session-gc.mjs` |
| 历史读取工具 | `src/agent-tools/read-history.mjs` | 同名（同路径对） |

**存储契约**：两端读写同一批档同一 `version`（1 / 2）——同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 89 | `agent-tools/read-history.mjs` | 同路径 | 0.3881 · 异 | ③ | 进核 | 以 CLI 为准（相对路径按 cwd 解析 + 宽松版本校验 + 磁盘全量可查） | 分叉 ＝ ① 相对路径解析 ② 版本校验口径（`version` 1/2）③ 本会话可查范围——CLI 流式迭代磁盘 `src/agent-tools/read-history.mjs:295-304` / VSC 只读内存 `:260`）；前提（同职责）仍成立 | **①** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 123 | `src/session.mjs` ↔ `src/extension/session-io.mjs` | ② | 融合：数据层取一侧 + VSC 的 `history-window` 拆面按核内结构归位 | 分叉 ＝ 目录归属（VSC 住 `extension/`）；存储契约两端自述同格式（同一 `~/.thincoder/sessions/<hash>.json.{N,manifest}`——VSC 头注 `:2-8`）⇒ 前提成立 | — | S1（建核补齐） |
| 124 | `src/session-slots.mjs` ↔ `src/extension/session-slots.mjs` | ② | 融合：取一侧（slot / manifest / 认领 / 属主判定） | 分叉 ＝ 目录归属；头注互指「同构镜像」（CLI `src/session-slots.mjs:19` / VSC `:21`）⇒ 前提成立 | — | S1（建核补齐） |
| 125 | `src/session-gc.mjs` ↔ `src/extension/session-gc.mjs` | ② | 融合：取一侧；**冷 cwd 手动执行面**（`session gc` 子命令）仅 CLI ⇒ 端差段 | 分叉 ＝ 目录归属 + VSC 无 shell 通道（VSC 头注 `:3-5` 自述）；保留期 / 阈值两端同值 ⇒ 前提成立 | — | S1（建核补齐） |
| 126 | `src/session-store.mjs` ↔ `src/extension/session-slot-write.mjs` | ② | 融合：核内单一记录存储 + 槽写入面归位 | 分叉 ＝ 切分与目录归属（VSC 记录存储内联于槽写面）；槽写语义两端同 ⇒ 前提成立 | — | S1（建核补齐） |
| 127 | `src/session-segments.mjs` · `session-guard.mjs` · `session-rename.mjs` · `session-migrate.mjs` ↔ 核内（VSC 侧内联于 `session-io` / `session-slots`） | ② | 融合：按核内结构归位（段 / 归属守卫 / 改名 / 旧短哈希迁移四面各保留） | 分叉 ＝ 拆档粒度（VSC 未拆）；能力面逐条对位（VSC `session-io.mjs:92-113` 迁移遍 / `:399` 改名枚举同构）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A14 | `agent-tools/read-history.mjs`（#89） | ① | 相对路径按 cwd 解析；只要求有 `history` 数组；本会话流式迭代磁盘（`:295-304`）；空 path 明确报错 | 相对路径不做 cwd 解析；要求 `version` 1 / 2；本会话只读内存（`:260`） | 以 CLI 为准（相对路径 + 宽松校验 + 磁盘全量） | ① VSC 里传相对路径不再直接 `not found`；② 旧版 / 无 `version` 字段的会话档从「拒」变「可查」 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12 搬入）

**本子系统无对外契约变更行**（§2.12.2 无对应行；§2.12.3 第 3 行「会话 / 历史面」为**已兼容**登记）：

| # | 项 | 为何无法兼容（实测 / 证据） | 上抛形态（四要素） | 裁定状态 |
|---|---|---|---|---|
| 3 | **会话 / 历史面** | **已兼容**（无需上抛）：两端读写同一批档同一 `version`（1 / 2）+ 各自内置旧短哈希迁移（`thincoder-cli/src/session-migrate.mjs:10-48` · `thincoder-vscode/src/extension/session-io.mjs:92-113`）⇒ 归一后历史可直接续读 | 登记为「已兼容」· 兼容形态 = 复用现成迁移函数 | 已兼容（登记） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #89 / #123–#127 · §2.5.1 A14 · §2.12.3 第 3 行）；**语义零改**，行号沿用原编号。
