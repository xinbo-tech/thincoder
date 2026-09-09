# Gitee Issue 修复批（ISSUE-FIX-BATCH）

> 板块：评审机制 + provider 校验（CLI 主——VSC 对齐）。权威源：AGENT-LOOP §8（评审机制）+ config 校验（D-S1 软失败先例）。
> 状态：**评审通过——F-1 已交付（ef94736——clean——L2 待链稳定）——F-4 排模型合并后**（设计待评审已过——2026-09-09 round1 pass——2026-09-09 F-1 实现交付）。需求：TODO Gitee issue 修复批（用户裁三一起攒批走全链）。

---

## 需求

- **总体目标**：修三个 Gitee open issue（IKE85W advisor provider 错配 / IKDCVV 评审反复 + 无续跑 / IKCDMR consultModels 硬崩）——各含根因实证——按修复方向落地。
- **功能性**：
  - F-1（IKE85W）CLI `resolveAdvisorProvider` 候选源修复：`agent.providers ?? [agent.provider]` → 扩
    `agent.config.providersList`（child config 已带全量——resolveChildProvider 同款语义）——child 内
    advisor 评审 provider 正确解析
  - F-2（IKDCVV 主循环）随 F-1 拆 403 失败环（child 交付评审不再每次失败）——评审"很久"= 设计预算不改
  - F-3（IKDCVV 真缺口——单发评审无断点续跑）登记为后续大项（本批不做——单列 TODO——中断全损重来是较大设计：跨调用续跑/预算分段）
  - F-4（IKCDMR）consultModels 校验软失败化（throw → 过滤非法条目 + 启动警告/引导——D-S1 范式）+ removeProviderFlow 级联清理（删渠道清 consultModels/subagentModels/advisor.provider 悬挂引用）——VSC 对等路径对齐
  - **范围边界**：Issue 2 续跑/自动重试机械落地 = 后续大项（F-3 登记不实现）；Issue 3 与模型合并共享 config.mjs/pickers 改造面——**实现排模型合并交付后**（同域顺序做防冲突）；"评审很久"600s/100 轮预算不动；token 7 天 TTL 默认不动。

## 设计（勘察骨架——照做勿自行解释）

### 1. Issue 1（F-1——CLI run.mjs 小改）
- `src/advisor/run.mjs:330`：`const provider = findProvider(agent.providers ?? [agent.provider],
  cfg.provider)` → `findProvider(agent.providers?.length ? agent.providers :
  agent.config?.providersList ?? [agent.provider], cfg.provider)`——child config 带完整 providersList
  （subagent-spawn childConfig = 父 config 拷贝）——findProvider 有全量可查——不再退化单元素——
  空数组守卫（评审：`??` 遇 [] 不落链——length 判断防空数组静默不生效）
- 备选已拒（评审记录）：buildSpawnChild 补 `child.providers = parent.providers`——弃因：动 spawn 装配面
  （buildSpawnChild 所有 child 型共享）——run.mjs 候选源最小面即达目的
- VSC 无此 bug（provider.mjs 读磁盘全量）——不须改——只对齐语义验证
- 修复消 Issue 2 主放大器（child 交付评审不再 403 → 不阻塞 → 不重来循环）

### 2. Issue 3（F-4——config.mjs/pickers 小改——**实现排模型合并后**）
- `src/config.mjs:230-250` consultModels 校验：throw → **过滤非法条目 + 一次性启动警告**（保留 discoverability——去 startup brick——无修复入口的硬崩消）+ 首帧引导清条目（仿 D-S1 _providerInvalid）
- `removeProviderFlow`（pickers.mjs:379-394）：删渠道同步清 consultModels/subagentModels/advisor.provider 悬挂引用（级联清理）
- VSC config-io.mjs:356-368 对等（共享 config——两端同规则）
- 与模型合并协调：defaultModel 校验同为 D-S1 软失败——两批同域（config.mjs）——**模型合并先行——本项随其后**（设计同落——实现串行）

### 3. 登记项（F-3——后续大项单列 TODO）
- 评审单发无断点续跑（中断 = 全损重来）——跨调用续跑/预算分段设计
- "停止重试"纪律（engineering.md）未落机械（失败/stale 自动再评审无停止落地）——机械行为设计

## 受影响文件（双端——域协调注）

| 文件 | 端 | 现行数 | 预计净变 | 改动 | 排期 |
|---|---|---|---|---|---|
| src/advisor/run.mjs | CLI | ~500 区（评审后） | ≤+2 | F-1 候选源扩 providersList（评审：逼近 500 档——
  ≤+2 不跨线——结构债随评审批跟踪） | 本批（独立域） |
| src/config.mjs | CLI | 433（模型合并后 ~473） | ≤+15 | F-4 consultModels 软失败化 | **模型合并后**（同域串行） |
| src/tui/pickers.mjs | CLI | 500（模型合并拆后 ≤450） | ≤+10 | F-4 removeProvider 级联清理 | **模型合并后** |
| src/config-io.mjs | VSC | 497（模型合并拆后 ≤460） | ≤+5 | F-4 对等软失败/清理 | **模型合并后** |
| src/extension/presets.mjs + settings.mjs | VSC | 84/309 | ≤+5 | F-4 对等（评审：presets 写 models 种子不加
  consultModels 悬挂条目——settings providerStatus 显 consultModels 软失败过滤态） | **模型合并后** |
| 测试（F-1/F-4） | 双端 | 新 | 新 ≤100 | run.mjs child provider / consultModels 软失败 / 级联清理 | 分批随实现 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 child advisor 评审 | eng-coder child + advisor.provider≠child 实际 | provider 从 providersList 正确解析——无 warn/403——F-1 |
| F-1 父侧评审 | 父侧 depth-0 | 不回归（providers 全量仍在）——F-1 |
| F-4 consultModels 非法 | config 含未知 provider 条目 | 不崩启动——过滤 + 警告——F-4 |
| F-4 删渠道 | removeProvider 删有引用渠道 | 悬挂引用级联清——下次启动无崩——F-4 |
| F-4 VSC 对等 | 共享 config 写 | 两端同规则软失败——F-4 |

## 验收

- AC-1 F-1 修（child 内 advisor 评审 provider 正确——无 403——父侧不回归）
- AC-2 F-2 主循环拆（403 失败环消——交付评审不再每次失败阻塞——评审：验证 = F-1 child 用例 + 既有
  交付评审测试——非独立用例）
- AC-3 F-4 consultModels 软失败（启动不崩——过滤 + 警告 + 引导清）
- AC-4 F-4 级联清理（删渠道清悬挂引用）
- AC-5 双端锁步（config 校验两端同规则）
- AC-6 测试绿（F-1/F-4 测试 + 既有——双端 npm test 快层）
- 红线：评审预算 600s/100 轮不动 + token TTL 不动 + 模型合并域先行不冲突

## 变更记录
- 2026-09-09：落档（勘察一手——IKE85W 根因 run.mjs:330 候选源 child 退化 + IKDCVV 主循环同根 + IKCDMR 软失败化方向——用户裁三一起走全链——Issue 3 实现排模型合并后（域串行）——Issue 2 续跑登记后续大项）。
