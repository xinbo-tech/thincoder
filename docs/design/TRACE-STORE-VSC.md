# VSC 轨迹存档同构（TRACE-STORE-VSC）

> 板块：轨迹存档（横切——模型调用可追溯分析）。权威源：CLI `docs/design/` trace-store 规格（AGENT-LOOP.md §18.6 D-TR1..TR8——CLI 已实现）+ 本文档（VSC 端同构设计）。
> 状态：**设计待评审**——2026-09-09 落档（勘察 explore 一手——VSC chat() = CLI core.mjs chat() 同构出口实证）。

---

## 需求

- **总体目标**：VSC 端完整请求-响应轨迹存档——与 CLI 同构（D-TR1..TR8 语义对齐）——每次 chat() 调用一个 JSONL 文件到 ~/.thincoder/traces/——供可追溯分析（debug 模型调用/评审信号密度统计/会话审计）。用户 2026-09-08 裁"要"（L31）。
- **功能性**：F1 VSC chat() 出口采集（所有模型调用——主回合/消化轮/compact/distill/advisor/子代理
  ——经 VSC provider.mjs chat() 单点全覆盖——勘察实证 :130 + callers agent.mjs:172/advisor run.mjs:183/
  compact.mjs:262/explore-distill.mjs:106）——F2 续写合并语义（chat() 内 :224-246 回流——record 需
  合并后的最外层出口——对照 CLI "出口汇总——续写/重试后全量"）——F3 JSONL 落盘格式同 CLI
  （D-TR1 字段集 + 脱敏 D-TR2）——F4 清理策略同 CLI（D-TR10 24h 保留——config 可配）——
  F5 fire-and-forget 不阻塞（D-TR3）。
- **范围边界**：VSC stop-trace.mjs（abort 延迟诊断 tracer）**不扩展为轨迹仓**（目的不同——观察 abort 路径无存档语义——勘察核）。不改 CLI trace-store。

## 设计（勘察建议——CLI trace-store.mjs 镜像参照）

1. **新建 VSC trace-store 镜像**（src/traces/trace-store.mjs 或 src/trace-store.mjs——按 VSC 结构定——行数 ~200 级）——函数面同 CLI：recordChatTrace(provider, opts, result, error)（D-TR1 字段集/脱敏 D-TR2/fire-and-forget D-TR3/目录 seq/清理 D-TR10）+ config.traces（enabled/retentionHours——VSC config 侧键勘察期核——无则补默认 24h）。
2. **采集点 = VSC provider.mjs chat() 出口**：:130 chat() 最外层返回前调 recordChatTrace——续写合并点
  （:224-246 回流）之后的最外层出口（对照 CLI "出口汇总——续写/重试后全量"）——callers 现 logCtx
  缺 cwd/session/kind/isContinuation 字段——按 CLI D-TR4 增补（多 caller——agent.mjs:172 主回合
  logCtx {stage:"turn",turn,auto,role,depth} 已较全——advisor run.mjs:183/compact.mjs:262/
  explore-distill.mjs:106 需补）。
3. **测试**：VSC test/trace-store.test.mjs——recordChatTrace 字段集/脱敏/fire-and-forget 不阻塞/目录 seq/D-TR10 清理（CLI trace-store 测试参照——NODE_TEST_CONTEXT 写门）——双端 CLI 测试已有可参照。

## 受影响文件（VSC）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/provider.mjs:130 chat() | 出口调 recordChatTrace + logCtx 增补 | 现（+~10） |
| src/traces/trace-store.mjs（新） | trace-store 镜像 | ~200 新 |
| src/agent.mjs:172 等 callers | logCtx 补 cwd/session/kind | 各 +~2 |
| config 侧 | config.traces 键（enabled/retentionHours） | +~5 |
| test/trace-store.test.mjs（新） | 采集/脱敏/清理测试 | ~150 新 |
| docs（VSC SESSION.md 或独立） | 机制登记 | doc |

## 验收

- AC1 VSC chat() 出口采集——所有模型调用路径落盘（主回合/消化/advisor/子代理——单点全覆盖实证）
- AC2 续写合并后全量记录（最外层出口——非每续写段）
- AC3 JSONL 格式同 CLI（D-TR1 字段 + 脱敏——逐字段对照）
- AC4 D-TR10 清理生效（24h 保留——config.traces 可配）
- AC5 测试绿（采集/脱敏/fire-and-forget 不阻塞/清理——双端 trace-store 测试跑通）
