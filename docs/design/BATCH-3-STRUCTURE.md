# 批 3：config-io 预拆 + digest 限量装配（BATCH-3-STRUCTURE）

> 板块：结构债（VSC config-io 拆分）+ 异步 settle 注入面（双端——digest 上下文限量）。权威源：MODEL-MERGE-SESSION（config-io 现状——499 行）+ digest 装配勘察（injectAsyncResult 落点）。
> 状态：**设计待评审**——2026-09-09 落档（勘察已齐——config-io 499 距 500 硬限 1 行 + digest 注入器批量预算落点）。需求：TODO config-io 499 预拆 + digest 装配限量（用户裁批 3）。

---

## 需求

- **总体目标**：两项结构/防复发修——① VSC config-io.mjs 现 499 行（F-4 净增后距 500 硬限 1 行——下个改动必拆）——预拆避免撞线 ② digest 注入批量预算（防 1.3MB 请求体复发——MODEL-400 修了 model undefined 根因——限量防 UX/性能）。
- **功能性**：
  - F-1（config-io 预拆）VSC config-io.mjs 拆——F-4 软失败相关块（sanitizeConsultModels/loadConsultPool/相关校验）迁独立模块 config-consult.mjs（hub re-export——config-io 保持 API 面不变——镜像 CLI config.mjs hub 惯例）——拆后 config-io ≤460 + config-consult 新 ~80
  - F-2（digest 注入批量预算）injectAsyncResult/injectPendingAsync 加累计预算——单 digest 轮注入合计 ≤64K（现单条 ≤64K 落盘——多条 pending 合并轮时累计超限）——超出条目改"报告已落盘 <path>——仅清单行 inline"——四族共用单点改
  - **范围边界**：config-io 只拆不迁逻辑（API 面零改——调用方不动）；digest 预算只改注入器不落盘路径（offloadToolResult 现机制保留）；compaction/截断机制不动。

## 设计（勘察落点——照做勿自行解释）

### 1. F-1 config-io 预拆（VSC）
- src/config-io.mjs（499）——F-4 相关块（sanitizeConsultModels/warnConsultModelsFiltered/loadConsultPool/cascadeRemoveProvider——现 config-io 内）迁 **src/config-consult.mjs（新 ~80）**——config-io 改 re-export hub（import + export——调用方 import 面不变）
- 拆后：config-io ≤460（净减 ~40）+ config-consult 新 ~80——均 <500
- 测试：config-io hub re-export 面测试（import 等价——既有 config-io 测试零改零回归）

### 2. F-2 digest 注入批量预算（CLI subagent-async + VSC 同构）
- injectAsyncResult（CLI subagent-async.mjs:326-356 / VSC :368-380）——单 digest 轮多 pending 注入时**累计预算 64K**：注入每条前查累计——超限条目不 inline 全文——改"报告已落盘 <path>——清单行"（offloadToolResult 已落盘路径现成——只改 inline 决策）
- 预算常量 DIGEST_INJECT_BUDGET = 64K（四族共用——subagent/advisor/escalate/consult）
- 测试：多 pending 合并轮超预算 → 后条清单行不 inline；单条 ≤64K 不回归

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/config-io.mjs | VSC | 499 | 拆后 ≤460 | F-1 迁出 consult 块 + hub |
| src/config-consult.mjs（新） | VSC | 新 | 新 ~80 | F-1 consult 块 |
| src/agent-tools/subagent-async.mjs | CLI | 421 | ≤+10 | F-2 批量预算 |
| src/agent-tools/subagent-async.mjs | VSC | ~420 | ≤+10 | F-2 镜像 |
| test/（config-io hub + digest 预算） | 双端 | 既有 | +20~+40 | F-1/F-2 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 hub 面 | 既有调用方 import config-io | API 面不变——测试零回归——F-1 |
| F-1 规模 | config-io 拆后 | ≤460 + config-consult ~80——均 <500——F-1 |
| F-2 超预算 | 单 digest 轮 3 条 pending（合计 >64K） | 后条清单行（报告已落盘）——不 inline 全文——F-2 |
| F-2 单条 | 单条 ≤64K | inline 预览不回归——F-2 |

## 验收

- AC-1 config-io 拆后 ≤460 + config-consult ~80（均 <500——不再撞硬限）
- AC-2 hub re-export API 面不变（既有 config-io 测试零改零回归）
- AC-3 digest 注入批量预算（超限清单行——测试绿）
- AC-4 单条 ≤64K inline 不回归
- AC-5 双端 npm test 快层零回归
- 红线：config-io 调用方零改（hub 保 API）；offloadToolResult 落盘机制零动；compaction/截断不动

## 变更记录
- 2026-09-09：落档（config-io 499 距硬限 1 行——F-4 交付注建议预拆——consult 块迁 config-consult.mjs hub——镜像 CLI config.mjs 惯例；digest 注入批量预算 64K——MODEL-400 修根因后防 UX 复发——勘察给落点 injectAsyncResult 四族共用单点）。
