# async 设计评审 token 结算根治（CLI 端）

> 板块：设计评审凭证结算（async settlement）。状态：**设计（待评审）**——2026-09-08 用户裁定：不再打补丁，按合理结构根治 + 废旧单值镜像 + 双端一起做（CLI/VSC 各自独立文档，同机制语义高度一致）。
> 背景：VSC 端 async 评审 token 反复丢（`designId not found`）已根治设计；用户裁定**双端做同一件事、逻辑高度一致、一起改**。CLI 现状 explore 一手核实（2026-09-08）——CLI 无 VSC 的死对象/快照/清零 bug，但有一处重启序列化窗口 + 与 VSC 对齐需统一结算语义。

## 1. 现状与差异（explore 一手核实）

**结构性差异**：CLI agent 对象**进程常驻单对象**（`bin/thincoder.mjs:280` 一次创建，跨回合/挂起复用，`agent.mjs:84` 只 mutate 不重建）——settle 回调闭包持的 `parent` = 活对象（`advisor-async.mjs:466`）→ settle 写 `agent._engDesignTokens`（`advisor-async.mjs:124-125`）即时生效。**无 VSC 的死对象 bug、无挂起入场快照、无 onComplete 清零类似物。**

**CLI 真实隐患（唯一）——重启序列化窗口**：
1. 挂起期 review settle（异步 finally）→ token 已写**内存**（`advisor-async.mjs:457-504`）
2. 但磁盘槽停留在 settle 前的上次 saveSession（`agent-turn.mjs:279` 回合尾才存；挂起驱动器不存盘）
3. 此刻进程被杀/崩溃/OOM → 该 token 从未落盘 → 重启恢复（`token-ttl.mjs:107 restoreEngTokens`）槽旧 → token 丢
窗口 = settle 完成 → 下个回合尾 saveSession（正常几秒内；digest 未触发/用户强杀则拉长）

**与 VSC 共享的同构语义**（应保留为对齐标准）：settle 双写 Map+镜像、spawn 门禁读 Map、dispatch 门读镜像、consume/TTL//new 删槽清镜像、restore 过期过滤回填。

**门禁读取分裂（与 VSC 同）**：dispatch 写门（`dispatch.mjs:184`）读单值镜像 `_engDesignToken`，spawn 门（`subagent-spawn.mjs:108`）读 Map——两套真相。

## 2. 需求（用户裁定 2026-09-08）

- **R1**：async 设计评审 settle 的 token/designId 可靠结算——消除重启序列化窗口，进程重启 resume 后 spawn eng-coder 不再丢。
- **R2**：**废旧单值镜像** `_engDesignToken`（用户选 B）——dispatch 写门判断资格改问权威槽"任一活槽存在"。
- **R3**：**双端一起做**——与 VSC 同机制语义高度一致（settle 即落盘权威台账）。
- **R4**：**不落文档约束保持**——token/designId VALUES 只进槽文件。

## 3. 设计（CLI 端落地）

### D1 settle 当场同步落盘（消除重启窗口）

- **现状**：settle 写内存 Map，落盘只在回合尾 saveSession（`agent-turn.mjs:279`）/退出/增量点。
- **改**：settle 是唯一结算点 → **settle 当场持久化 token 字段到槽文件**（不等下个回合尾 saveSession）。在 `advisor-async.mjs` settle finally 后直接写（复用 `engTokenSlotFields` 序列化 + session 安全写/轮转，勿裸写文件）。agent 内存 Map 保持为当前进程缓存（常驻，与槽一致）。此消除"settle→下个 saveSession"间的重启丢 token 窗口。
- 落点：`src/agent-tools/advisor-async.mjs` settle 路径 + `src/token-ttl.mjs`（暴露可复用的落盘函数）。

### D2 spawn 门禁读权威（miss 回读槽）

- **现状**：resolveDesignSlot（`subagent-spawn.mjs:107`）读内存 Map，无槽文件回读。
- **改**：门禁读内存 Map，**miss 时回读槽文件权威台账**（reconcile + 判定）——覆盖"进程重启后槽有但 Map 未及回填/缓存与槽不一致"。TTL 过滤保留。
- 落点：`src/agent-tools/subagent-spawn.mjs`。

### D3 废旧单值镜像（R2）

- **现状**：dispatch 写门（`dispatch.mjs:184`）读 `_engDesignToken` 镜像；settle/restore/consume/TTL/new 双写双清镜像（多处同步成本）。
- **改**：`_engDesignToken` 单值镜像**退役**。dispatch 写门判断资格改问权威槽"任一活槽存在"（查内存 Map 或槽文件任一未过期 designId）。镜像字段读时一次性迁移进 Map，settle/restore/consume/TTL/new 不再维护镜像。
- **改**：`_engDesignToken` 单值镜像**退役**。dispatch 写门判断资格改问权威槽"任一活槽存在"（查内存 Map 或槽文件任一未过期 designId）。**存量兼容：旧会话 slot 文件里可能残留镜像字段值——恢复时一次性读取迁移进 Map（唯一迁移读点，此后不再写镜像、不再读）**。settle/restore/consume/TTL/new 不再维护镜像。
  - 迁移读点：`token-ttl.mjs` restoreEngTokens——若 slot 有残留 `engDesignToken` 且 Map 空 → 一次性迁入 Map（标 legacy），随后 saveSession 不再写镜像字段。
- 落点：`src/agent/dispatch.mjs` + `src/agent-tools/advisor-async.mjs` + `src/token-ttl.mjs` + `src/session.mjs`（resetSessionState）。

### D4 同机制语义对齐（与 VSC 一致）

settle 即落盘（D1）、门禁读权威 miss 回读（D2）、镜像退役（D3）——与 VSC 版设计（DESIGN-TOKEN-SETTLEMENT.md VSC 端）同机制语义，各自独立实现。CLI 无 VSC 的快照/清零修复（不存在对应 bug），不引入。

## 4. 受影响文件（CLI，thincoder）

- 修改：`src/agent-tools/advisor-async.mjs`（settle 当场落盘 D1/D3）、`src/agent-tools/subagent-spawn.mjs`（miss 回读 D2/D3）、`src/agent/dispatch.mjs`（写门问槽 D3）、`src/token-ttl.mjs`（落盘函数 + 去镜像）、`src/session.mjs`（resetSessionState 去镜像）
- 文档：本设计 + README 地图登记

## 5. 验收

AC1 = async design 评审 settle 后进程重启（不等回合尾）resume → spawn eng-coder 通过（token 已落盘）；AC2 = settle 落盘后 spawn 门禁从槽读到 token（缓存 miss 回读）；AC3 = `_engDesignToken` 镜像退役（**零写 + 仅一次性迁移读**——唯一读点在 token-ttl restoreEngTokens，其余运行时读写 grep 零命中）；AC4 = dispatch 写门读"任一活槽存在"判定资格；AC5 = 凭证不落文档巡检通过；AC6 = CLI/VSC 同机制语义一致（各自独立文档）。

### 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常：settle→重启→resume→spawn | async 评审 settle（token 已当场落盘）→ 进程 kill（不等回合尾）→ resume → spawn eng-coder | 门禁从槽读到 token，通过（不再 designId not found） | AC1 |
| 正常：缓存 miss 回读 | settle 落盘后、新回合 Map 未回填时 spawn | resolveDesignSlot 内存 miss → 回读槽文件 → 命中通过 | AC2 |
| 边界：过期 token 槽 | slot 有已过期 TTL 的 designId | restore/门禁 TTL 过滤——过期拒，不误当活槽 | AC1/AC2 |
| 边界：残留镜像一次性迁移 | 旧会话 slot 文件有 engDesignToken 残留且 Map 空 | restoreEngTokens 一次性迁入 Map（legacy 标）；saveSession 后不再写镜像 | AC3 |
| 错误：settle 落盘失败 | settle 当场写槽抛错 | settle 失败可重评（不静默丢 token）；不产生"内存有盘上无"态 | AC1 |
| 错误：dispatch 写门无活槽 | 工程模式 + 无任一活槽（全过期/无）→ 改产品代码文件 | 拦（无资格）；有任一活槽 → 放行 | AC4 |

## 变更记录

- 2026-09-08：立项。基于会诊 4 模型收敛（槽文件权威台账 + settle 同步落盘 + 门禁读权威）+ explore CLI 一手核实（常驻对象无死对象/清零 bug；唯一隐患 = 重启序列化窗口）+ 用户裁定（B：连镜像一起废；双端一起做；各一份文档）。
