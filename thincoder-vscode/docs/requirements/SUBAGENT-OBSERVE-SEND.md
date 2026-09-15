# SUBAGENT-OBSERVE-SEND（子代理观测 / 注入）— 需求（VSC 仓）

> 板块：子代理运行时观测与控制（父侧 `subagent` 动作 observe 查进度 + send 注入引导）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`SUBAGENT-OBSERVE-SEND（CLI 仓·需求）§1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `SUBAGENT-OBSERVE-SEND（本仓·设计）`；关联 = `AGENT-LOOP（本仓·需求）§9`（池状态 / 终态面）· `DESIGN-TOKEN-SETTLEMENT（本仓·需求）`（凭证纪律）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

给父 agent 对运行中异步子代理的**运行时观测与轻量引导**能力——治「父看不到中间瞎猜 + 无法中途引导」；
不改变子代理隔离模型（中间内容仍不进父上下文——按需拉取摘要；注入 = 普通用户回合）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-O1 | **observe 查进度**：按 id 查异步子代理的 recent-activity 快照——最近 5 条回合摘要（截断抽取：assistant 首行 / 工具名列表——非原始消息体）+ 当前工具 + turn/touched。证据 = `@thincoder/core/agent-tools/subagent-actions.mjs:269-298` · `src/agent-tools/subagent-spec.mjs（W12 已迁核——现体见批次档 §5）:28` | running → 摘要 + 当前工具 + turn/touched；queued → 占位（未启动）；done → 终态 + 报告预览；unknown → 明确错误；advisor id → 明确指引（含 action:'status'，不报 unknown）。用例 = `test/subagent-observe-send.test.mjs` | 不返回原始消息体（摘要 = 截断抽取）；不做逐回合全量拉取（隔离不破坏） |
| F-O2 | **send 注入引导**：向 running 异步子代理入队消息，下回合边界作**普通 user 指令**消费（非即时）；未投递（子先终了）→ 报告附「未投递」注记。证据 = `@thincoder/core/agent-tools/subagent-actions.mjs:349-396` · `src/agent-tools/subagent-spec.mjs（W12 已迁核——现体见批次档 §5）:31` | send → `{id, status:"injected", note}`；子下回合头消费（普通 user 回合）；settle 前未消费 → 报告注记；竞态（cancel / settle）→ 明确错误（不静默入队） | 不即时打断在跑工具；注入 ≠ 偏离豁免（子内部收敛 / 审计纪律不变） |
| F-O3 | **目标边界**：仅异步池中未 settle 子代理可 send（running）；queued / settled / sync / unknown → 明确错误；observe 可查 running / queued / done 任意。证据 = `@thincoder/core/agent-tools/subagent-actions.mjs:103-125`（用例面）（W13 已迁核收口——现体见批次档 §5） | send 对 queued / settled / sync / unknown → 明确错误（逐类用例）；observe 对 done / queued 仍可查；cancel 竞态窗口 → 错误（不静默） | 不给 sync / 已 settle 项注入通道；不改 status / cancel 判定 |
| F-O4 | **分类与门禁**：observe = readonly（planMode 同只读放行）；send = control（只停不启族——免权限审批、不入批审批分组）；depth>0 → 不可用。证据 = `src/agent-tools/subagent-spec.mjs（W12 已迁核——现体见批次档 §5）:51` · `@thincoder/core/agent-tools/subagent-actions.mjs:315` · `src/agent/tool-gates.mjs:59-67` | 动作级分类钩子按 args 判定（observe / send 各归其类）；depth>0 → 明确错误（子代理无异步池）；planMode / 权限面按分类生效。用例 = `test/subagent-observe-send.test.mjs`（分类 / depth gate 组） | 不改工具族其它动作分类；不引入新豁免类 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-O1 | 回合错位 | 父仅在自身回合内可调 observe / send（目标 = 父回合内可见的未 settle 异步子代理）；不引入子主动推送 / 后台定时 | 用例面（父回合外不可达——`SUBAGENT-OBSERVE-SEND（本仓·设计）§4`） |
| N-O2 | 隔离不破坏 | observe 返摘要（非全量）；send 经子回合边界注入、不打断其在跑工具 | `test/subagent-observe-send.test.mjs:41`（截断抽取）/ `:95`（入队语义） |
| N-O3 | 凭证纪律 | 不读写 token / designId（与 `DESIGN-TOKEN-SETTLEMENT（本仓·需求）` 语义一致） | `test/subagent-observe-send.test.mjs:142`（凭证纪律用例） |
| N-O4 | 双端语义一致 | 与对端同机制语义；各端独立实现 | 本档 §4 端差登记 |

## 4. 对位与端差登记（对位 = `SUBAGENT-OBSERVE-SEND（CLI 仓·需求）§1`）

- 语义对位：总体（观测 + 轻量引导、不改隔离模型）· F1 observe · F2 send · 边界（仅未 settle 异步项）· N1–N4 逐条同源。
- 本端口径登记（供跨端对表）：摘要条数 = 5（`SUBAGENT_OBSERVE_RECENT` 单一常量——`subagent-actions.mjs:276`）；行截断 = 160 字符/条（`_OBSERVE_LINE`）；（W13 已迁核收口——现体见批次档 §5；两常量随端侧镜像删旧退役——条数/截断由核 `clampRecent` 与首行抽取承载）
  注入延迟语义 = 下回合边界非即时（`subagent-spec.mjs:31` 工具描述逐字）。
- 端差登记：本档登记面未见实质差异；实现载体各端自持。差异若有 → 逐条补登记（不静默）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
