# MULTI-INSTANCE-COLLAB — 需求

> 板块：多实例协作感知（多副本 agent 互相感知）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/MULTI-INSTANCE-COLLAB.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 定位与总体目标

用户常在同一工作目录同时开多个 thincoder 副本（CLI + VS Code 扩展 + 多会话面板）。**存储层**已有完善的实例隔离（slotSessions 进程认领、slotOccupancy、end marker、isProcessAlive——见 SESSION.md §10），副本间**不会互相覆盖会话文件**。但 **agent 认知层互不知晓**——每个 agent 不知道自己所在目录还有别的活 thincoder 副本在同时工作，遇到文件竞争需用户口头告知才回避（实况：CLI + VS Code 同开同 repo，靠口述"CLI 在跑，回避"协调）。

**目标**：让副本在 **agent 层互相感知并可协作**——agent 自主知道"有同伴在"，能避让文件域竞争，无需用户口头协调。

### 范围边界

- **不做**：跨实例实时聊天/消息传递、任务分配/编排、自动合并冲突文件——那是多 agent 协作平台的范畴，超出"同一工作目录多副本互不干扰"的本需求。
- L3 是"文件域感知"（写前检查他实例登记域），**不是文件锁**（不阻止写，只告知/建议避让）。

### 功能需求

| # | 用户故事 | 验收语义 |
|---|---|---|
| F1 (L1) | 每个实例启动/回合**自知所在 cwd 有多少活 thincoder 副本**（各自端/进程/占用槽） | 回合注入"活跃实例清单"；agent 无需询问即知有同伴 |
| F2 (L2) | agent **能主动查询**当前 cwd 的活实例及其状态 | 只读查询工具，agent 可随时调用 |
| F3 (L3) | 多个副本**不互相踩文件**——写文件前知道目标是否被他实例占用 | 实例登记"正在写的文件域"；他实例写前检测冲突域并主动回避/报告 |
| F4 (checklist 同步) | 多副本各自维护的 checklist 项**不被互相覆盖**（各自建项、状态变更不丢） | 两端 checklist 并发写不静默丢项（原为裸整文件覆盖） |
| F5 (config 原子写) | 一端改配置（provider/key/agent 设置）后，**另一端不出现意外**（配置被旧快照覆盖） | `~/.thincoder/config.json` 并发写不互相抹除（原为整文件裸写、无 mtime 门控） |

### 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 低侵入 | 复用 SESSION.md §10 现成基建（slotSessions/slotOccupancy/isProcessAlive），不新建平行存储 |
| N2 | 端一致 | CLI / VS Code 行为一致（lockstep） |
| N3 | 只读安全 | L1/L2 纯只读（不认领、不写 manifest/peers/sessions）；L3 的登记/检测不阻塞主流程（缓存命中零扫描、flush 回合末一次） |
| N4 | 隐私 | 实例清单不含敏感信息（无 API key/会话内容，仅进程/端/槽——字段白名单 {pid, end, sessionId, slots}） |
