# 多实例协作感知（MULTI-INSTANCE-COLLAB）— 需求

> 板块：多实例协作感知（同一 cwd 多副本 agent 互相感知与避让）。需求层文档（`docs/requirements/`）。
> 定位：本仓机制实况登记——感知面 `src/extension/peer-instances.mjs`（191 行）+ 文件域面 `src/extension/peer-domains.mjs`；
> 写入侧避让提示 = `src/agent/execute-tools.mjs`；清单写面 = `src/tools/checklist.mjs`（W14 已迁核——现体 `thincoder-core/tools/checklist.mjs`）；配置写面 = `src/config-io.mjs`。
> 跨端：与 CLI 仓同名需求档语义同源（lockstep）；实现各自独立。

## 1. 定位与总体目标

用户常在同一工作目录同时开多个 ThinCoder 副本（VS Code 多窗口 + CLI + 多会话面板）。**存储层**已有实例隔离
（槽位认领 / end marker / 判活——见 `docs/design/SESSION.md`），副本不会互相覆盖会话文件；但 **agent 认知层互不知晓**——
每个 agent 不知道同目录还有别的活副本在同时工作，文件竞争要靠用户口头协调。

**目标**：副本在 agent 层互相感知并可协作——agent 自主知道「有同伴在」，写前避让文件域竞争，无需用户口头协调。

### 范围边界

- **不做**：跨实例实时聊天 / 消息传递、任务分配 / 编排、自动合并冲突——那是多 agent 协作平台范畴。
- 文件域感知是「告知 / 建议避让」，**不是文件锁**（不阻止写——软提示）。

## 2. 功能性需求

| # | 用户故事 | 验收语义 |
|---|---|---|
| F1 | 作为 agent，我想在回合里知道自己所在 cwd 还有多少活 ThinCoder 副本，以便主动避让 | 回合注入活跃实例提醒（过滤自身）；agent 无需询问即知有同伴 |
| F2 | 作为 agent，我想随时只读查询当前 cwd 的活实例及其状态 | `peer_instances` 工具在位（只读——条目 `{pid, end, sessionId, slots, self}`，字段白名单） |
| F3 | 作为 agent，我想在写文件前知道目标文件是否被他实例的登记域覆盖，以便避让 / 报告 | 写路径命中他活实例的短时热登记域 → 返回 peer 冲突提示（软提示，写不被阻止） |
| F4 | 作为用户，多副本各自维护的 checklist 项不被互相覆盖 | checklist 写盘：磁盘被并发方改过 → 重读磁盘合并（归档项不复活、双向不静默丢项） |
| F5 | 作为用户，一端改配置后另一端不出现旧快照覆盖 | 共享 `config.json` 写带 mtime 门控：检测到并发写 → 放弃本次写并提示重试（`CONFIG_CONFLICT_HINT`） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 低侵入 | 复用会话槽位基建（manifest / sessionId / 判活），不新建平行存储 |
| N2 | 端一致 | CLI / VS Code 行为语义一致（lockstep），实现各自独立 |
| N3 | 只读安全 | 感知面纯只读（不认领、不写 manifest）；惰性缓存 = manifest mtime 变了才重查；批量判活一次取全量 PID 集合（不做每 pid 一次 exec） |
| N4 | 隐私 | 实例清单不含敏感信息——字段白名单 {pid, end, sessionId, slots} |
| N5 | 降级不崩 | 探测失败（子进程不可用 / 目录缺失）→ 空集降级，不影响主流程 |

## 4. 变更记录

- 2026-09-12：建档（LEDGER-SELF-CONTAINED 批——机制在位无档补建；内容 = 既有机制实况登记，零新需求语义）。
