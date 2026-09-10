> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。

# VSC 轨迹存档同构（TRACE-STORE-VSC）

> 板块：轨迹存档（横切——模型调用可追溯分析）。权威源：CLI `docs/design/` trace-store 规格（AGENT-LOOP.md §18.6 D-TR1..TR8——CLI 已实现）+ 本文档（VSC 端同构设计）。
> 状态：**已交付核销**——2026-09-09（VSC d84980d + db7f5f9——trace-store 255 行 + provider 出口 + 测试 396 行——审计/advisor clean——VSC L2 129/129 绿——consume 3da9a9b5——docs 登记 = VSC README 地图轨迹行——并发提交 d84980d 由活动会话落（内容 = 在位实现 + try/catch 强化））。

---

## 需求

- **总体目标**：VSC 端完整请求-响应轨迹存档——与 CLI 同构（D-TR1..TR8 语义对齐）——每次 chat() 调用一个 JSONL 文件到 ~/.thincoder/traces/——供可追溯分析（debug 模型调用/评审信号密度统计/会话审计）。用户 2026-09-08 裁"要"（L31）。
- **功能性**：F1 VSC chat() 出口采集（所有模型调用——主回合/消化轮/compact/distill/advisor/子代理
  ——经 VSC provider.mjs chat() 单点全覆盖——勘察实证 :130 + callers agent.mjs:172/advisor run.mjs:183/
  compact.mjs:262/explore-distill.mjs:106）——F2 续写合并语义（chat() 内 :224-246 回流——record 需
  合并后的最外层出口——对照 CLI "出口汇总——续写/重试后全量"）——F3 JSONL 落盘格式同 CLI
  （D-TR1 字段集 + 脱敏 D-TR2）——F4 清理策略同 CLI（D-TR10 24h 保留——config 可配）——
  F5 fire-and-forget 不阻塞（D-TR3）。
- **F6（评审 #3）**：config.traces.enabled=false → 不落盘不报错（禁用路径）——写失败静默降级
  （fire-and-forget 吞错——不阻塞 chat() 返回）——保留期边界正确（超期清/期内留）。
- **范围边界**：VSC stop-trace.mjs（abort 延迟诊断 tracer）**不扩展为轨迹仓**（目的不同——观察 abort 路径无存档语义——勘察核）。不改 CLI trace-store。

## 设计（勘察建议——CLI trace-store.mjs 镜像参照）

1. **新建 VSC trace-store 镜像**（**定 src/traces/trace-store.mjs——评审 #2 定路径**——对齐 CLI 目录结构——
   行数 ~200 级）——函数面同 CLI：recordChatTrace(provider, opts, result, error)（D-TR1 字段集/脱敏 D-TR2/fire-and-forget D-TR3/目录 seq/清理 D-TR10）+ config.traces（enabled/retentionHours——VSC config 侧键勘察期核——无则补默认 24h）。
2. **清理触发（评审 #4）**：每次 recordChatTrace 写盘时顺带 prune（超 retentionHours 文件删除——
   同 CLI cleanupTraces 逻辑——长驻 host 无启动事件——per-write 触发最简）。
3. **采集点 = VSC provider.mjs chat() 出口**：:130 chat() 最外层返回前调 recordChatTrace——续写合并点
  （:224-246 回流）之后的最外层出口（对照 CLI "出口汇总——续写/重试后全量"）——callers 现 logCtx
  缺 cwd/session/kind/isContinuation 字段——按 CLI D-TR4 增补（多 caller——agent.mjs:172 主回合
  logCtx {stage:"turn",turn,auto,role,depth} 已较全——advisor run.mjs:183/compact.mjs:262/
  explore-distill.mjs:106 需补）。
4. **测试**：VSC test/trace-store.test.mjs——recordChatTrace 字段集/脱敏/fire-and-forget 不阻塞/目录 seq/D-TR10 清理（CLI trace-store 测试参照——NODE_TEST_CONTEXT 写门）——双端 CLI 测试已有可参照。

## 受影响文件（VSC）

| 文件 | 改动 | 行数 |
|---|---|---|
| src/provider.mjs:130 chat() | 出口调 recordChatTrace + logCtx 增补 | ~600 现（+~10——评审 #1 补数——>500 既有债不重论） |
| src/traces/trace-store.mjs（新） | trace-store 镜像 | ~200 新 |
| src/agent.mjs:172 等 callers | logCtx 补 cwd/session/kind | ~380 现（各 +~2——评审 #1 补数） |
| src/config-io.mjs 或 config 键定义处（实现时定位——评审 #1 点名） | config.traces 键（enabled/retentionHours） | 现（+~5） |
| test/trace-store.test.mjs（新） | 采集/脱敏/清理测试 | ~150 新 |
| docs（VSC SESSION.md 或独立） | 机制登记 | doc |

## 验收

- AC1 VSC chat() 出口采集——所有模型调用路径落盘（主回合/消化/advisor/子代理——单点全覆盖实证）
- AC2 续写合并后全量记录（最外层出口——非每续写段）
- AC3 JSONL 格式同 CLI（D-TR1 字段 + 脱敏——逐字段对照）
- AC4 D-TR10 清理生效（24h 保留——config.traces 可配）
- AC5 测试绿（采集/脱敏/fire-and-forget 不阻塞/清理/禁用路径/写失败静默/保留边界——评审 #3
  边沿补——双端 trace-store 测试跑通——测试用例表实现前补全含 per-caller 路径）

## 变更记录
- 2026-09-09：L31 立项落档（勘察一手——VSC chat() 汇聚点实证）。评审 7 项采纳（受影响表补行数/路径定死/F6 禁用路径+边沿/清理触发 per-write/目录碰撞注/数值漂移注/文档归属注——token e1149502）。
