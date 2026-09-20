# 飞刀（ESCALATE）· 需求

> 板块 = **飞刀**——把实现任务交给更强模型**亲自操刀**（`subagent` 工具动作 `action:"escalate"`）。
> 本档 = 该机制的**需求层权威**（F-E1–F-E5 / N-E1–N-E4 判定句）。
> 设计侧 = `docs/core/design/ESCALATE.md`（术语 / 候选池 / 工具契约 / async 机制 / 双端接线）。
> 相邻需求档 = `docs/core/requirements/CONSULTATION.md`（会诊——互补机制）· `docs/core/requirements/AGENT-LOOP.md`（异步化与池面）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/requirements/ESCALATE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。**CLI 侧同名需求档已对账并入**（2026-09-15 批 5——逐节比对：**零实质缺口**，无新增文本；旧档留参照历史）。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——专家到场、亲自手术、术后交回病历、离场；
**缺省后台异步**（发起 ack → 回合收尾 → 完成报告自动到达），改动**并入父级守卫**——飞刀不能绕过父级门。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） | 范围边界（不做） |
|---|---|---|---|
| **F-E1** | **强模型亲自操刀（可写）**：`subagent` 动作 `escalate` 召唤 `role: "coder"` 子代理（写路径复用：权限门 / 追踪）；候选池 = `agent.consultModels`；产物 = 术后报告 | 产出可写子代理（活动流经 `sub:escalate <label> #N` relay 上屏——VSC `agent-tools/subagent-escalate.mjs:154`）；ask 模式经父面板弹卡带归属、AUTO 直通；报告含改动清单 / 理由 / 验证 + touched files | 不做独立 `escalateTool`（已退役）；不做 UI 直连 （迁移期引文） |
| **F-E2** | **缺省 async（后台飞刀）**：发起返回 ack → other 池飞行；settle **三分类**（done = merge-all + 重叠警告；error = partial merge 决策；cancelled 不入 pending）；报告经 pending 单容器 digest 自动注入 | ack 为可解析 JSON（`{id, role:"escalate", status}`——VSC `agent-tools/subagent-escalate.mjs:107` 起 async 缺省；该端档已退役〔W12 删除集〕）；settle 即出池；报告**自动到达**；cancelled → 零 merge；async **不弹**继续面板 | `async:false` 仅机制参数（depth>0 平台规则）；不恢复轮询式 check （迁移期引文） |
| **F-E3** | **同步路径保留**：`async:false` → 同步执行；撞轮数上限经 question 通道「继续?」（`resume:true` 续跑，history / mutations 保留） | `async:false` 显式同步零回归（VSC `agent-tools/subagent-escalate.mjs:163`/`:197`；该端档已退役〔W12 删除集〕）；撞墙继续语义保持；顶层缺省异步（同步不成为缺省） | 不把同步设为缺省；不引入第三执行形态 （迁移期引文） |
| **F-E4** | **约束面**：depth-0 only；工程模式禁用（fail-closed——实现走 eng-coder）；空池不可用（不注册）；effort 越界钳制；无墙钟看门狗（轮数上限 + 单次调用超时 + Stop 直传） | depth>0 → 明确错误（VSC `agent-tools/subagent-escalate.mjs:79`；该端档已退役〔W12 删除集〕）；工程模式 → 明确错误并指向 eng-coder 路径；池空 → 模型不可见（不误调）；max-effort 慢手术不被墙钟误杀 | 全自动升级不做（触发权 = 主 agent 判断 + 用户）；飞刀专用独立模型配置不做 （迁移期引文） |
| **F-E5** | **与会诊分工（互补不重叠）**：consult = 多模型并行**只读**意见；escalate = 一个强模型**亲自执行**（可写，走正常权限门） | 两机制工具面独立（两工具 start / stop vs 单动作）；权限面差异在位（escalate 可写经权限门） | 不合并两机制；不做「并行操刀」（一个手术台一位主刀） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| **N-E1** | 改动并入父级守卫 | 子代理 mutations 合并 + 重置父级 verify / advisor 收敛预算——飞刀不绕过父级门 |
| **N-E2** | 活动流上屏 | relay `sub:escalate <label> #N` → 面板（冻结入流同 subagent / consult）——VSC `agent-tools/subagent-escalate.mjs:154` 起（该端档已退役——W12 删除集） （迁移期引文） |
| **N-E3** | 双端语义一致 | 分工 / 缺省 async / 约束面双端同源；**各端独立实现**（同结果、异载体） |
| **N-E4** | 可机判 | VSC 侧用例 = `thincoder-vscode/test/child-permission.test.mjs`（sync + async 接线 / 取消与 Stop 两路释放 / 角色域）等族；`npm test` 全绿、档名在册 |

## 4. 范围边界（不做）

- 不设硬边界（何时出手交模型判断）；不做机制化挂钩触发（verify 耗尽 / stall 不用于飞刀）。
- 飞刀再飞刀不做（depth 封顶）；多模型并行操刀不做；飞刀专用独立模型配置不做；全自动升级不做。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/ESCALATE.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档「建档（需求树逐档成套轮 B13 建档实施 B 轮…零新需求语义）」注 | 建档批序 | 一次性材料——归批次档 |
| 旧档「实测口径 as-of 2026-09-12」行 | 时点口径注 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档 §4 对位与端差登记节 | 逐条对位句（与会诊分工 / 边界哲学 / 不做清单同源） | 语义同源已由本档正文承载——**端差 = 零**（登记于此，不另立节） |
| 旧档「现行语义 / 用例 / 验收锚 = AGENT-LOOP（本仓·设计）§9」 | 跨档锚指针 | 归 `docs/core/design/AGENT-LOOP.md`（异步化与池面） |
| 旧档「设计见 ESCALATE（本仓·设计）」 | 同层镜像指针 | 已由本档档头承载（N-b 镜像成对） |
| CLI 侧同名需求档未迁面（**已销项**） | CLI 产品需求正文 | **已对账并入（2026-09-15 批 5）——零实质缺口**（无新增文本）；旧档留参照历史 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/requirements/ESCALATE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写；与设计档成对（N-b 镜像同名）；端差 = 零（登记于 §5.2）。
- 2026-09-15（**B 式迁移轮 · CLI 批 5**）：`thincoder-cli/docs/requirements/ESCALATE.md` **对账并入**——逐节比对（一句话 / 分工表 / 边界哲学 / 不做清单）：全部要素已由 §1 / F-E1–F-E5 / §4 承载 ⇒ **零实质缺口**（无新增文本）；§5.2「CLI 侧同名需求档未迁面」**销项**。
