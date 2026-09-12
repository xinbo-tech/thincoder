# ESCALATE（飞刀）— 需求（VSC 仓）

> 板块：飞刀（升级到更强模型实现——`subagent` 工具 `action:"escalate"`）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`ESCALATE（CLI 仓·需求）§1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `ESCALATE（本仓·设计）`；现行语义 / 用例 / 验收锚 = `AGENT-LOOP（本仓·设计）§9`。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——专家到场、亲自手术、术后交回病历、离场；
缺省后台异步（发起 ack → 回合收尾 → 完成报告自动到达），改动并入父级守卫——飞刀不能绕过父级门。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-E1 | **强模型亲自操刀（可写）**：`subagent` 动作 `escalate` 召唤 coder role 子代理（写路径复用：权限门 / 追踪）；候选池 = `agent.consultModels`；产物 = 术后报告。证据 = `src/agent-tools/subagent-escalate.mjs:38/73/154/217` | 调用产出可写子代理（活动流经 `sub:escalate <label> #N` relay 上屏）；ask 模式经父面板弹卡带归属、AUTO 直通；术后报告含改动清单 / 理由 / 验证 + touched files。用例 = `test/child-permission.test.mjs` | 不做独立 `escalateTool`（已并入 `subagent` 动作——工具面收敛）；不做 UI 直连 |
| F-E2 | **缺省 async（后台飞刀）**：发起返回 ack → other 池飞行；settle 三分类（done = merge-all + 重叠警告；error = partial merge 决策；cancelled 不入 pending）；报告经 pending 单容器 digest 自动注入。证据 = `src/agent-tools/subagent-escalate-async.mjs:41/151/172/220` | ack 为 JSON 串可解析（`{id, role:"escalate", status}`）；settle 即出池；报告自动到达（无需轮询）；cancelled → 零 merge；async 不弹继续面板 | `async:false` 仅机制参数（depth>0 平台规则）；不恢复轮询式 check（已删除） |
| F-E3 | **同步路径保留**：`async:false` → 同步执行；撞 turn 上限经 question 通道「继续?」（`resume:true` 续跑，history / mutations 保留）。证据 = `src/agent-tools/subagent-escalate.mjs:73/107` · `test/child-permission.test.mjs:248` | `async:false` 显式同步零回归；撞墙继续语义保持；顶层缺省异步（同步不成为缺省） | 不把同步设为缺省；不引入第三执行形态 |
| F-E4 | **约束面**：depth-0 only；工程模式禁用（fail-closed——实现走 eng-coder）；空池不可用（不注册）；effort 越界钳制；无墙钟看门狗（turn 上限 + FETCH_TIMEOUT + Stop 直传）。证据 = `src/agent-tools/subagent-escalate.mjs:79/84-85` · `ESCALATE（本仓·设计）§2.1/§2.5` | depth>0 → 明确错误（不能再飞刀）；eng 模式 → 明确错误并指向 eng-coder 路径；池空 → 模型不可见（不误调）；max-effort 慢手术不被墙钟误杀 | 全自动升级不做（触发权 = 主 agent 判断 + 用户）；飞刀专用独立模型配置不做 |
| F-E5 | **与会诊分工（互补不重叠）**：consult = 多模型并行只读意见；escalate = 一个强模型亲自执行（可写，走正常权限门）。证据 = `ESCALATE（本仓·设计）§1.2` | 两机制工具面独立（两工具 start/stop vs 单动作）；权限面差异在位（escalate 可写经权限门） | 不合并两机制；不做「并行操刀」（一个手术台一位主刀） |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-E1 | 改动并入父级守卫 | `mergeChildMutations` 重置父级 verify / advisor 收敛预算——飞刀不绕过父级门 | `ESCALATE（本仓·设计）§2.4/§2.5`；merge 面用例 |
| N-E2 | 活动流上屏 | relay `sub:escalate <label> #N` → 面板（冻结入流同 subagent / consult） | `test/child-permission.test.mjs`（块头面） |
| N-E3 | 双端语义一致 | 与对端同款语义（分工 / 缺省 async / 约束）；各端独立实现 | 本档 §4 端差登记（已登记差异 = 零） |
| N-E4 | 可机判 | 用例 = `test/child-permission.test.mjs`（sync + async 接线 / 取消与 Stop 两路释放 / 角色域）+ `test/prompts-async-guidance.test.mjs`（缺省异步引导内容） | 快层全绿；档名在册 |

## 4. 对位与端差登记（对位 = `ESCALATE（CLI 仓·需求）§1`）

- 语义对位：一句话 / 与会诊分工 / 边界哲学（不设硬边界——何时出手交模型判断）/ 不做清单逐条同源。
- 端差登记：本档登记面（语义 / 约束 / 产物）未见差异；实现载体各端自持（本端 = `subagent-escalate.mjs` + `subagent-escalate-async.mjs`）。
- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
