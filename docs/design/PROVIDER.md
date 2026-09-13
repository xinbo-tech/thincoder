# 供应商与模型（PROVIDER）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 调用核心 | `thincoder/src/provider/core.mjs` + `index.mjs` | `thincoder-vscode/src/provider.mjs` |
| 传输 | `src/provider/{anthropic,google,responses}.mjs` | `src/provider/transports/{anthropic,google,responses}.mjs` |
| 基础件 | `src/provider/{sse,retry,normalize,errors,abort-provenance}.mjs` | 内联 / 无独立档 |
| 限流 | `src/provider/rate.mjs` | 同名（同路径对） |
| 模型清单 | `src/provider/list-models.mjs` | 同名（同路径对） |
| 模型规格 | `src/model-specs.mjs` | `src/config.mjs`（模型规格段）+ `specs.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 114 | `provider/rate.mjs` | 同路径 | 0.1646 · 异 | ③ | 进核 | 取并集：等待取 VSC 的可中断实现（`abortableSleep`）+ 默认限流口径取 VSC 的 spec 回退 + token 估算取并集（图片 part / `max_tokens`） | 分叉 ＝ 等待可中断性（CLI 睡到窗口结束 `src/provider/rate.mjs:89-90` / VSC 10s 段可中断 `:26-34,135-137`）+ 默认 tpm/rpm 回退 + token 估算口径；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 115 | `provider/list-models.mjs` | 同路径 | 0.0601 · 异 | ③ | 进核 | 取并集：保留 VSC 的排序与明确报错 + CLI 的 `provider.headers` 随请求发出 | 分叉 ＝ 排序 / 自定义 header 是否随 `/models` 发出 / 失败形态（CLI 静默空清单 `src/provider/list-models.mjs:88-93` / VSC 抛错并显示不可用 `:38,63-74`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 138 | `src/provider/core.mjs` + `index.mjs` ↔ `src/provider.mjs` | ② | 融合：以 CLI 调用核心为准 + VSC 的传输分派面归位 | 分叉 ＝ 组织（VSC 单档 / CLI 拆 core + sse + normalize）；两端同 API 语义（`chat` / `createProvider`——VSC `thincoder-vscode/src/provider.mjs:123` 自述「CLI core.mjs 同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 139 | `src/provider/anthropic.mjs` ↔ `src/provider/transports/anthropic.mjs` | ② | 融合：取一侧 + 核内 `transports/` 目录归位 | 分叉 ＝ 目录（CLI 平铺 / VSC `transports/`）；同源自述 ⇒ 前提成立 | — | S1（建核补齐） |
| 140 | `src/provider/google.mjs` ↔ `src/provider/transports/google.mjs` | ② | 融合：同 #139 | 同 #139（VSC 头注自述「与 CLI 同修」）⇒ 前提成立 | — | S1（建核补齐） |
| 141 | `src/provider/responses.mjs` ↔ `src/provider/transports/responses.mjs` | ② | 融合：同 #139 | 同 #139（VSC `:376` 自述「与 CLI/core 同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 142 | `src/provider/sse.mjs` · `retry.mjs` · `normalize.mjs` · `errors.mjs` · `abort-provenance.mjs` ↔ 核内（VSC 侧内联 / 无独立档） | ② | 融合：按核内结构归位（重试链 / 预发归一 / 错误分类 / abort 溯源） | 分叉 ＝ 拆档粒度（VSC 未拆）；VSC 多处自述「与 CLI 对齐」（`thincoder-vscode/src/provider.mjs:250` 等）⇒ 前提成立 | — | S1（建核补齐） |
| 143 | `src/model-specs.mjs` ↔ `src/config.mjs`（模型规格段）+ `specs.mjs` | ② | 融合：核内单一 `MODEL_SPECS` + 端侧派生面（面板下拉 / 默认档）按端注入 | 分叉 ＝ 档名与拆分（VSC `config.mjs` 实为规格表、`specs.mjs` 仅转发）；VSC 头注自述「与 CLI src/model-specs.mjs 的查找语义对齐，但非逐行等价」（`:103`）⇒ 前提成立；字段差（`reasoningEffortDefault`）按端差登记 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A19 | `provider/rate.mjs`（#114） | ① | 等待期间按 Stop **要拖到窗口结束**（`:89-90`）；只按 provider 配置的 tpm/rpm 限流 | 10s 段可中断睡眠（`:26-34,135-137`）；只配一个维度时**补默认另一维度**；token 估算含图片 part 与 `max_tokens` | 取并集：等待取 VSC 的可中断实现 + 默认限流口径取 VSC + token 估算取并集 | ① 被限流时按 Stop 的响应速度（CLI 侧变快）；② 只配 rpm 的场景会多一层 TPM 闸（限流更早触发） | **已裁（2026-09-13）· 按建议** |
| A20 | `provider/list-models.mjs`（#115） | ①② | 按接口返回序；**带 `provider.headers`**；解析失败静默返回空清单 | 结果 **sort() 排序**；openai / anthropic 分支**不带** `provider.headers`；失败抛错并在配置面板显示「该渠道不提供模型列表」 | 取并集：保留 VSC 的排序与明确报错 + CLI 的 `provider.headers` 随请求发出 | ① 走自建网关 / 需额外鉴权 header 的用户：VSC 现会 401 拉不到 ⇒ 归一后能拉到；② 清单顺序变化（排序 vs 接口序）；③ 拉不到时的提示形态变化 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 8 | `provider/list-models` 失败形态（空清单 → 明确报错） | 输出 | 取并集 | 登记 + CHANGELOG | `PROVIDER.md` 同步 + 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A20） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #114 / #115 / #138–#143 · §2.5.1 A19 / A20 · §2.12.2 第 8 行）；**语义零改**，行号沿用原编号。
