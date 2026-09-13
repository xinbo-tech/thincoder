# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 主循环 | `thincoder-cli/src/agent.mjs` | 同名（同路径对） |
| 装配 / 提醒 / 收尾 | `src/agent/setup.mjs` · `setup-reminders.mjs` · `run-stages.mjs` · `post-turn.mjs` · `dispatch.mjs` · `completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` · `helpers.mjs` · `spawn-child.mjs` | `src/agent/*`（拆档：`execute-tools` · `tool-gates` · `run-helpers` · `context-injections` · `agent-state`） |
| 子代理 / 异步 | `src/agent-tools/{subagent-scheduler,subagent,subagent-actions,subagent-async,subagent-run,async-settle,subagent-spawn,escalate-async}.mjs` | 同名 / 拆分档 |
| 挂起与唤醒 | `src/tui/suspension-drive.mjs` | `src/extension/suspension.mjs` |
| 权限 | `src/cli/permission.mjs` | `src/extension/permission-gate.mjs` · `agent-tools/child-permission.mjs` |
| hooks | `src/hooks.mjs` | —（零 `runHooks`） |
| 工作区约定（技能 / 规则 / 同伴 / 台账） | —（另档） | → `docs/design/WORKSPACE.md` |
| 推理档位 / 模型引用 | `src/auto-think.mjs` · `model-ref.mjs` | `src/extension/reasoning-mode.mjs` · `src/config.mjs`（模型引用解析段） |
| 探索蒸馏 | `src/explore-distill.mjs` | 同名（同路径对） |
| token 台账 | `src/agent-tools/design-token.mjs` · `src/token-ttl.mjs` | `src/agent/agent-state.mjs` · `agent/tool-gates.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 76 | `explore-distill.mjs` | 同路径 | 0.5247 · 异 | ② | 进核 | 融合：取一侧 + 截断取 VSC 的 UTF-16 安全切片 | 分叉 ＝ 截断实现（CLI 裸 slice `src/explore-distill.mjs:80` / VSC `safeSliceUTF16` `:82`）+ 就地改写 vs 返回新值；前提 ＝ 无 | — | S1（建核补齐） |
| 78 | `agent.mjs` | 同路径 | 0.0883 · 异 | ③ | 进核 | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应内联重试并入 | 分叉 ＝ 分层方式 + **一处配置面缺口**（`agent.streamRules` 在 VSC 全仓零消费方——VSC `src/**` 0 命中；CLI `src/agent.mjs:237`）+ 中断时入历史的工具结果不同（CLI 丢弃 + 占位 `:387` / VSC 保留真实结果 VSC `src/agent.mjs:342-350`） | **①②** | S1（建核补齐） |
| 94 | `agent-tools/subagent-scheduler.mjs` | 同路径 | 0.1914 · 异 | ② | 进核 | 融合：取 CLI 队列实现 + VSC 的跨 `runAgent` 存活载体面按核内结构归一 | 分叉 ＝ 队列载体（CLI 独立数组 / VSC 池 Map 插入序）与 AUTO 判定取词；域上限、依赖语义、位置计算同规格 | — | S1（建核补齐） |
| 98 | `agent-tools/async-settle.mjs` | 同路径 | 0.0819 · 异 | ② | 进核 | 融合：取 CLI（中止守卫 + 取消提醒落点 + `TURN_CAP_MARK` 常量）+ VSC 的 interrupt 豁免面按端注入 | 分叉 ＝ 载体 / 守卫口径 / 提醒落点 / 事件名（`advisor:done` vs `child:done`）+ VSC 把 turn cap 文案写成字面量（`src/agent-tools/async-settle.mjs:143`）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 99 | `agent-tools/subagent.mjs` | 同路径 | 0.0447 · 异 | ③ | 进核 | 以 CLI 为准（含 `panel` 动作）+ VSC 无 panel 属**有意端差**（其载荷面在 VSC 不存在 ⇒ ④ 段以注入剔除） | 分叉 ＝ 动作枚举（CLI 八动作 / VSC 七动作、有意无 `panel` `src/agent-tools/subagent-spec.mjs:11-12`）；前提（`panel` 依赖 CLI TUI 展示面）仍成立 ⇒ ④ 段 | **①** | S1（建核补齐） |
| 100 | `agent-tools/subagent-actions.mjs` | 同路径 | 0.0407 · 异 | ② | 进核 | 融合：动作执行器按核内单一切分归位（含 `cancel` 归属） | 分叉 ＝ 纯文件分工（CLI 的 `cancel` 在 `subagent-async.mjs` / VSC 在 `subagent-actions.mjs`）+ VSC 的 advisor 评审取消路由；`status`/`observe`/`send` 语义同规格 | — | S1（建核补齐） |
| 101 | `agent-tools/advisor-async.mjs` | 同路径 | 0.0378 · 异 | ② | 进核 | 融合：取 CLI 拆分（settle 记账 / token 组外提）+ VSC 的会话槽台账写入面归位 | 分叉 ＝ 拆分粒度与落盘路径（CLI 走 token 清理 + slot 权威台账模块 / VSC 直写 slot）；容量拒超 / 取消 / 陈旧判定同规格 | — | S1（建核补齐） |
| 102 | `agent-tools/subagent-async.mjs` | 同路径 | 0.0204 · 异 | ② | 进核 | 融合：异步机械按核内单一切分归位（含 §18 审计门 / `collectSettledAsync` 落点） | 分叉 ＝ 切法不同（CLI 的 `cancel` 执行器在此 / VSC 在 `subagent-actions`；VSC 审计门与 collect 留此档）；前提（同职责）仍成立 | — | S1（建核补齐） |
| 103 | `agent-tools/subagent-run.mjs` | 同路径 | 0.0135 · 异 | ② | 进核 | 融合：**同名不同物**——两端两份能力**分别**归位（CLI = 异步 spawn 执行器；VSC = 子代理 `runAgent` 闭环） | 分叉 ＝ 文件名复用而实体不同（CLI `executeAsyncSpawn` `src/agent-tools/subagent-run.mjs:47-204` / VSC `runChild` `:18-205`）；核内分别落位（CLI 侧对应 VSC `subagent-async.mjs` 的 `spawnAsyncSubagent`） | — | S1（建核补齐） |
| 111 | `agent/run-stages.mjs` | 同路径 | 0.0709 · 异 | ③ | 进核 | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | 分叉 ＝ 文件职责划分 + 两处行为（CLI 跑 Stop 钩子 `src/agent/run-stages.mjs:131-140`、VSC 全仓零 `runHooks`；中止时 CLI 清空子代理池 `:168-169` / VSC 只清已死 `:296-297,312-313`） | **①** | S1（建核补齐） |
| 112 | `agent/setup.mjs` | 同路径 | 0.0532 · 异 | ③ | 进核 | 以 CLI 为准（装配顺序与注入块）+ 端差注入：VSC 编辑器上下文 / 按模型能力的 `read_image` / 每轮惰性 MCP 扩工具 | 分叉 ＝ VSC 拆 `context-injections.mjs` + 三处挂载条件不同（`read_image` 按多模态 `src/agent/setup.mjs:199`；`settings` 只挂 depth0 `:141`；召回限 depth0 且 `!autoTurn`）；前提（两端同装配面）成立 | **①** | S1（建核补齐） |
| 113 | `agent/setup-reminders.mjs` | 同路径 | 0.0453 · 异 | ② | 进核 | 融合：取并集 + VSC 编辑器上下文 / 贴图指引按端注入（④ 段） | 分叉 ＝ VSC 独有两条注入（编辑器上下文 · 贴图指引 `src/agent/setup-reminders.mjs:216-223`）+ 提示语同套；前提（贴图依赖宿主）仍成立 | — | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 149 | `src/agent/dispatch.mjs` ↔ `src/agent/execute-tools.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：两阶段执行 + 前置门禁按核内结构归位 | 分叉 ＝ 拆分（VSC 拆 tools / gates —— `tool-gates.mjs:2-6` 自述「自 execute-tools.mjs verbatim 迁出——零语义」）⇒ 前提成立 | — | S1（建核补齐） |
| 150 | `src/agent/helpers.mjs` ↔ `src/agent/run-helpers.mjs` | ② | 融合：核内单一工具函数面 | 分叉 ＝ 档名（helpers / run-helpers）；VSC `context-injections.mjs:11` 自述「CLI 对位 `agent/helpers.mjs:275-348`」⇒ 前提成立 | — | S1（建核补齐） |
| 151 | `src/agent/post-turn.mjs` ↔ `src/agent/setup-reminders.mjs` + `agent.mjs`（内联） | ② | 融合：回合后记账（计时器 / 提醒 / 停滞检测 / goal 追踪）按核内结构归位 | 分叉 ＝ 落点（VSC 住 setup-reminders / 主循环内联——`thincoder-vscode/src/agent.mjs:351` 自述「ported from CLI post-turn」）⇒ 前提成立 | — | S1（建核补齐） |
| 152 | `src/agent/spawn-child.mjs` ↔ `src/agent-tools/subagent-run.mjs` | ② | 融合：子运行器按核内结构归位（含 `_capturedOutput` 额度面） | 分叉 ＝ 文件名复用而实体不同（VSC 该档 = `runChild` 闭环 `:18-205`）；**承 §2.5 #103** | —（承 #103） | S1（建核补齐） |
| 153 | `src/agent/completion.mjs` · `record-results.mjs` · `relay-prefix.mjs` ↔ 核内（VSC 内联） | ② | 融合：按核内结构归位（完成守卫 / 结果提交与记账 / 前缀续写切片） | 分叉 ＝ 拆档（VSC 内联于主循环）；守卫语义两端同（`completion.mjs` 三守卫 / 配对关闭 / UTF-16 安全切片）⇒ 前提成立 | — | S1（建核补齐） |
| 154 | `src/agent-tools/design-token.mjs` + `src/token-ttl.mjs` ↔ `src/agent/agent-state.mjs` + `src/agent/tool-gates.mjs` | ② | 融合：token TTL / 会话槽台账按核内结构归位 | 分叉 ＝ 落点（CLI 独立档 / VSC 住 agent-state · tool-gates）；两端同 token 格式（`uuid:expiresAt`）与 fail-closed 口径 ⇒ 前提成立 | — | S1（建核补齐） |
| 155 | `src/agent-tools/escalate-async.mjs` ↔ `src/agent-tools/subagent-escalate-async.mjs` + `subagent-escalate.mjs` | ② | 融合：异步飞刀引擎按核内结构归位 | 分叉 ＝ 档名与拆分（VSC 拆 sync / async 两档）；同池（「other」域）/ 同 ack 形态 ⇒ 前提成立 | — | S1（建核补齐） |
| 156 | `src/agent-tools/recent-changes.mjs` ↔ `src/agent-tools/recent_changes.mjs` | ② | 融合：取一侧（工具名 `recent_changes` 两端同） | 分叉 ＝ 档名连字符 / 下划线 + `readonly` 标记；工具语义同（本轮已读）⇒ 前提成立 | — | S1（建核补齐） |
| 157 | `src/agent-tools/subagent-spawn.mjs` ↔ `src/agent-tools/subagent-spawn-gate.mjs` | ② | 融合：spawn 门禁按核内结构归位 | 分叉 ＝ 档名与拆分；VSC `:136` 自述「CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs」⇒ 前提成立 | — | S1（建核补齐） |
| 158 | `src/agent-tools/advisor-settle.mjs` ↔ 核内（VSC 侧住 `advisor-async.mjs`） | ② | 融合：advisor settle 记账 / 变更日志 / 陈旧判定按核内结构归位 | 分叉 ＝ 拆档（VSC 未拆；**同路径对 #101 的另一半**）⇒ 随 #101 处置 | —（承 #101） | S1（建核补齐） |
| 165 | `src/cli/permission.mjs` ↔ `src/extension/permission-gate.mjs` | ② | 融合：权限闸按核内结构归位 + 展示面按端注入 | 分叉 ＝ 目录与展示形态（TUI 卡 / webview 卡）；闸语义（每回合 `autoApprove` 快照 + 中途 live 标志）同 ⇒ 前提成立 | — | S1（建核补齐） |
| 166 | （CLI 无独立档）↔ `src/agent-tools/child-permission.mjs` | ② | 融合：子代理权限通道按核内结构归位（父卡归属 + 定向 signal） | 分叉 ＝ 拆档（VSC 独有拆面）；**承 §2.5 #112（装配）/ §2.12.1 事件语义面** | —（承 #112） | S1（建核补齐） |
| 169 | `src/hooks.mjs` ↔ 核内（VSC 侧零 `runHooks`） | ③ | 以 CLI 为准（Stop 等四事件）——VSC 接线后开始触发（外部副作用随 #111 登记） | 分叉 ＝ VSC 未实现（零命中）；**承 §2.5 #111** | —（承 #111） | S1（建核补齐） |
| 175 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs` | ② | 融合：核内推理档位面 + 端侧选择面（UI 下拉 / 自动分级）按端注入 | 分叉 ＝ 落点（CLI 自动难度分级 / VSC UI→provider 字段映射）；VSC DEFAULTS 已载 `autoThink`（`config-io.mjs:319`）但**全仓无消费方** ⇒ 归一后接线（默认 `false` ⇒ 默认无行为变化） | **②**（丁组 D2） | S1（建核补齐） |
| 176 | `src/model-ref.mjs` ↔ `src/config.mjs`（模型引用解析段）+ `specs.mjs` | ② | 融合：核内单一 `provider:model` 解析 | 分叉 ＝ 落点；解析口径（首冒号切分 / 双段非空 / 显式 `p:m` 一律放行）两端同源 ⇒ 前提成立 | — | S1（建核补齐） |
| 184 | `src/extension/suspension.mjs` ↔ `src/tui/suspension-drive.mjs` | ② | 融合：挂起 / 唤醒机制按核内结构归位（池载体按端注入） | 分叉 ＝ 目录（CLI 住 `tui/`）；VSC 头注自述「与 CLI 的结构差异（同语义移植）——CLI 的池 / pending / _suspended 挂 agent 对象」`:9` ⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A7 | `agent.mjs`（#78） | ①② | 读 `config.agent.streamRules` 传给模型（`src/agent.mjs:237`）；中断时丢弃工具结果并写占位（`:387`） | `streamRules` **全仓零消费方**（VSC `src/**` 0 命中，本端 PARITY 批亦登记为缺口）；中断时保留真实工具结果（`:342-350`） | 以 CLI 为准（主循环本体）+ VSC 的 onToken 三态门 / 帧回调 / 空响应重试并入 | ① CLI 能配的流规则在 VSC 不生效（现状）⇒ 归一后生效；② 中断时模型所见的历史内容不同 | **已裁（2026-09-13）· 按建议** |
| A15 | `agent-tools/subagent.mjs`（#99） | ① | 八动作（含 `panel`） | 七动作——**有意无 `panel`**（`subagent-spec.mjs:11-12`，其载荷面在 VSC 不存在） | 以 CLI 为准（保留 `panel`）+ VSC 端按端差**不注入**该动作 | ① VSC 的 `subagent` 动作集不变（`panel` 仍无）；CLI 不变——本行只登记端差合法性与注入位 | **已裁（2026-09-13）· 按建议** |
| A22 | `agent/setup.mjs`（#112） | ① | 每轮装配全内联；`read_image` **恒在**注册表；子代理继承含 `settings` 的工具集；文档 / 记忆召回只受 `!resume` 约束（未按 depth 门控） | 拆 `context-injections.mjs`；`read_image` 仅当模型多模态（`:199`）；`settings` 只挂 depth0（`:141`）；召回限 depth0 且 `!autoTurn`；每轮惰性把 MCP 扩成原生工具 | 以 CLI 为准（装配顺序与注入块）+ 端差注入（编辑器上下文 · 按模型能力的 `read_image` · MCP 扩工具时机） | ① VSC 非多模态模型仍没有 `read_image`（端能力，保留）；② 子代理的 `settings` 工具与记忆召回门控归属（CLI 子代理上下文更肥 vs VSC 更瘦） | **已裁（2026-09-13）· 按建议** |
| A23 | `agent/run-stages.mjs`（#111） | ① | 收尾跑 **Stop 钩子**（`:131-140`）；中止时**直接清空**异步子代理池与评审池（`:168-169`） | **全仓零 `runHooks`**（无 Stop 钩子）；中止时只清**已死**条目（`:296-297,312-313`） | 以 CLI 为准（Stop 钩子 + 收尾编排）+ VSC 的 guard 推回 / 蒸馏发射面按核内结构归位 | ① 归一后 VSC 侧是否开始触发 Stop 钩子（外部副作用）；② 按中断时后台子代理是「被清」还是「被留」⇒ 结果可见差异 | **已裁（2026-09-13）· 按建议** |

### 3.2 丁组（S0b 语义对位遍新增）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| D2 | `src/auto-think.mjs` ↔ `src/extension/reasoning-mode.mjs`（§2.5 #175） | ② | 自动难度分级 → 推理档位（`config.agent.autoThink` 为开关，CLI 有消费方） | VSC DEFAULTS **已载** `autoThink`（`config-io.mjs:319`）但**全仓零消费方** ⇒ 该键在 VSC 是**死键** | **建议（方向唯一）**：核内实现 + VSC 接线（死键恢复语义）；默认 `false` ⇒ **默认无行为变化**；面板推理档位面按端注入 | ① 在 VSC 显式设过 `autoThink: true` 的用户：该键从「无效」变「生效」（行为变化，但 = 恢复 CLI parity 的既定语义）；② 默认配置下无变化 | **待裁**（建议按建议通过） |

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**（对外事件面的兼容策略模板住 `CORE-UNIFICATION.md` §2.12.1「事件语义」类；行为面变更见上文各行「影响面」列）。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #76 / #78 / #94 / #98–#103 / #111–#113 / #149–#158 / #165 / #166 / #169 / #175 / #176 / #184 · §2.5.1 A7 / A15 / A22 / A23 / D2）；**语义零改**，行号沿用原编号。
- 2026-09-13：同行次——**#170–#173（技能 / 规则 / 同伴）改归 `docs/design/WORKSPACE.md`**（同批拆分轮内的归属校正：与 #174 台账展示面同族，归工作区约定档）。
