# 子代理 id 计数器载体修正（SUBAGENT-ID-COUNTER-AGENT）

> 板块：平台机制（双端同构）。权威源：subagent-scheduler.mjs nextSubagentId（L433-446——counter 挂
> history expando——压缩替换 history 数组时丢）+ agent.mjs per-run reset 清单（L127-139——不含
> _subIdCounter——挂 agent 本体跨 run/跨压缩存活）。状态：**设计待评审/待批准**——2026-09-09。
> 需求：TODO 子代理 id 复用（用户 23:25 纠正：进程内唯一即可——reload 后池清块消失——新进程从 1
> 无冲突——**不需要持久化**——极简修载体）。

---

## 需求

- **总体目标**：id counter 在**进程内**单调（跨压缩/跨轮）——不挂 history expando（压缩替换数组即丢）
  ——挂 agent 本体。**不做槽持久化**（reload 后池清块消失——新进程从 1 无冲突——id 作用域 = 进程内）。
- **功能性**：
  - F-1 nextSubagentId 读/写 `agent._subIdCounter`（本体——跨 run/跨压缩存活——per-run reset 清单不含它）
    + poolMax 兜底——**删 history expando 读写**——**agent 触达 = nextSubagentId(parent) 现有入参
    （零新增操作）**；**优先级：next = max(counter ?? 0, poolMax) + 1——取号后 counter 同步 = next
    （首取号时初始化）**——评审 round2 #2/#3
  - F-2 双端同构（CLI/VSC subagent-scheduler.mjs 各 ~4 行改动）
- **非功能**：零协议变化；旧行为（池活续号）保持；测试：压缩替换 history 后 spawn id 仍递增（双端各一）

## 受影响文件

| 文件 | 端 | 现行数 | 增量 | 改动 |
|---|---|---|---|---|
| src/agent-tools/subagent-scheduler.mjs | 双端各一 | ~450 区 | ±4 | nextSubagentId：读/写 agent._subIdCounter——删 holder(history) expando 行（>300 档：±4 不跨 500——不涉拆分——既有债另记） |
| test/subagent-scheduler.test.mjs | CLI | 待实测 | +1 组 | 压缩替换 history 后 spawn id 递增断言——评审 round2 #1 |
| test/files.mjs | VSC | 待实测 | +1 | 新测试登记（清单外披露——eng-coder 交付补） |
| test/subagent-id-counter.test.mjs | VSC | 新增 | +~40 行 | 同断言（VSC 无 scheduler 测试文件——新建）——评审 round2 #1 |

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 压缩后取号 | history 数组被替换 → spawn | id 仍递增（agent 本体计数器存活）——F-1 |
| 池活续号 | 池内有条目 spawn | poolMax 续号（现行为保持）——非功能行为保持（评审 round2 #5 修映射） |
| 进程重启 | reload 后首 spawn | id 从 1（可接受——池清块消失无冲突）——范围边界 |

## 验收

- AC-1 nextSubagentId 无 history expando 读写（确认 history 上无 `_subIdCounter` 访问残留——非单
  别名 grep——评审 round2 #4）
- AC-2 压缩替换 history 后 spawn id 递增（测试双端各一组）
- AC-3 双端 npm test 快层零回归
- 红线：不做槽持久化；webview/块机制零动；协议零改

## 变更记录
- 2026-09-09：落档（用户纠正：内存变量不需要持久化——id 作用域=进程内——reload 后池清块消失从 1
  无冲突——撤槽持久化方案——极简修载体：history expando → agent 本体——±4 行/端）。
- 2026-09-09：撤前版 SUBAGENT-ID-COUNTER-PERSIST（槽持久化方案——过度设计——本档取代）。
- 2026-09-09：评审 PASS + 6 项 advisory 修正（测试文件入表/agent 触达明写/优先级公式/AC-1 加强/用例映射）——执行版定稿——token f6deb375。
- 2026-09-10：**CLI 端交付校正注（eng-coder 实现前核实——原档以 VSC 形态误写为双端共态）**：CLI 树从未有 history expando 缺陷——计数器一直挂 agent 本体 `_subAgentCounter`（真缺口 = 4 取号点裸 counter+1 无 poolMax 兜底）——CLI 实现 = 机制意图落地（新增 nextSubagentId：max(_subAgentCounter, poolMax)+1 跨池共号）+ 三接线（subagent-spawn/escalate-async/advisor-async）+ 双测试文件（scheduler 内 ID-COUNTER 组 6 例 + subagent-id-counter.test 真链路锁——CLI 测试走 glob 自动发现无需登记 files.mjs）——交付 clean 签收（2026-09-10）——两端各自落地、机制等价（载体名随端：VSC `_subIdCounter`/CLI `_subAgentCounter`）。

