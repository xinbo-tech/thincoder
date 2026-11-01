# 轨迹存储（TRACES）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 轨迹存储 | 经 `@thincoder/core/traces/trace-store.mjs` 引用 | 经 `@thincoder/core/traces/trace-store.mjs` 引用 |

**共同基线**：目录 / 命名 / 字段两端已一致；默认开关两端皆 `false`。

## 2. 核模块裁决行

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 116 | `traces/trace-store.mjs` | 同路径 | 0.1869 · 异 | ③ | 进核 | 取并集：目录 / 命名 / 字段取同一形态（现状已一致）+ 容量与清理策略取一侧（建议取 VSC 的完整落盘 + 每写 prune） | 分叉 ＝ 容量策略（CLI 单条 64K 截断 + 在途上限 8 丢记录 `src/traces/trace-store.mjs:96-106,240-247` / VSC 不截断不丢 `:22-23,218`）+ 清理时机（CLI 启动一次 / VSC 每写 prune）；默认开关两端皆 false | **①** | S1（建核补齐） |

## 3. 须用户裁条目

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A21 | `traces/trace-store.mjs`（#116） | ① | 单条 >64K 截断（头 16K + 尾 48K）；在途上限 8 条、超了**丢记录**并打 stderr（`:96-106,240-247`）；清理在启动时跑一次 | 不截断、不丢弃，逐条完整落盘（`:22-23,218`）；**每写一次 prune**（每次多一遍目录扫描） | 取并集：目录 / 命名 / 字段取同一形态（现状已一致）+ 容量 / 清理策略取一侧（建议取 VSC 的完整落盘 + 每写 prune） | ① **默认关**（两端皆 `false`）⇒ 多数用户无感；开启后：CLI 的超大轨迹不再缺内容 / VSC 每次落盘多一次扫描；② 两端轨迹可合并分析（现状已可） | **已裁 · 按建议** |

## 4. 对外契约影响

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 10 | `traces` 的容量 / 清理策略（默认关） | 事件 / 数据面 | 取一侧 | 登记（默认关 ⇒ 无升级破坏） | 轨迹面文档同步 + 用例 | 已裁 · 按建议（§2.5.1 A21） |

## 6. 机制面

> **交叉板不复制**：子代理族内存上界（窗口 / 捕获截断 / 释放点）→ 属本层 `AGENT-LOOP.md` §6.15（本板只收轨迹面）。

### 6.1 机制（采集 / 元数据 / 脱敏 / 写盘 / 开关 / 清理）

- **定位**：每个模型调用（主 agent / 子代理 / advisor / compress / distill / consult / auto-think）的**完整轨迹**自动落盘 `~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl`——含发往模型的输入消息、模型输出、reasoning 全文、工具调用 args、usage——供事后逐轮分析「纠结 / 思路反复 / 决策分叉」。
- **采集点唯一**：`chat()` 导出（`thincoder-core/provider/core.mjs`——所有 chat 调用经本函数）出口收集——不在各 transport 分别埋点（续写 / 重试会 `result.reasoning +=`，出口收集才完整）。
- **元数据字段**：ts / session（`_sessionStart`）/ cwdHash / role / depth / turn / provider-model / kind / stage / `isContinuation`（续写 / 重试链标记）/ messages / content / reasoning / toolCalls / usage / finishReason / error。日期分日按**本地日期**。
- **脱敏**：复用 `thincoder-core/log.mjs` 黑名单（apikey / designtoken / password / secret / token / authorization / proxyuri / proxy）+ SECRET_FORM 形态扫描——落盘前遮蔽。
- **写盘**：fire-and-forget 异步（不 await——chat() 返回不被阻塞）；落盘失败静默吞错；seq = 当日目录 max+1（不覆写）。
- **开关与清理**：**默认 OFF**（发布隐私裁定——`traces.enabled` 默认 false；本机调试可显式开）；启动清理 `cleanupTraces` 删 mtime > `traces.retentionHours`（默认 24h）的 .jsonl + 空日期目录；config 经 `/config` 菜单 + `~/.thincoder/config.json`（默认值表 = `thincoder-core/config.mjs`）。
- **轨迹内容额度**：消息内容 / 推理 / 工具参数串超 `TRACE_MESSAGE_MAX_CHARS`（64K）→ 头 16K + 中段标记 + 尾 48K；单记录超 `TRACE_RECORD_MAX_CHARS`（4M）→ `messages` 降 stub（元数据保留、标记可断言）。**字段集不变**。

### 6.2 写入代价形态（单遍序列化 / 在途上界 / 序号缓存）

- **单遍序列化**：`record = serializeRecord(fields)`——字符串字段经 `redactSecret(fieldKey, s)` 后直接写入输出缓冲（数组 / 对象逐层手写 JSON 结构）；输出与既有 `JSON.stringify` 形态同构（字段名 / 次序保持）。
- **内容额度（双层）**：单消息 64K（头 16K + 标记 + 尾 48K，与工具预览同族）；序列化后总长 > 4M → `messages` 整体降 stub（`"[trace record truncated for size: N chars / M messages]"`），其余字段保留；两处均带可断言标记。
- **在途上界**：模块级 `pending` 计数（写盘 IIFE 进入 +1 / settle −1）；达 `TRACE_PENDING_MAX`（8）→ 本记录丢弃、`_dropped` 计数 +1、首次饱和打一行 stderr `[trace] pending write queue full — N record(s) dropped`（每饱和段一次）。
- **序号缓存**：`seqCache: Map<dayDir, maxSeq>`——首次 `readdirSync` 后进程内递增预留；目录被清理（retention）后取下界重扫一次（防御）。**多进程语义**（登记）：同 cwd 多实例各自进程内缓存——seq 可撞、同 sessionKey 记录并入同名文件（append 不覆写）；**可容忍**（本机 traces = 诊断面、默认 OFF、撞号不损坏数据）；不做跨进程协调 / 落盘校验。
- **开关 / 字段 / 落点 / 保留期 / 清理零改**：本组为写入代价收敛——不改轨迹语义面；额度为**编译期常量**（不新增配置项）。

### 6.3 边界（轨迹面——本机制不做）

- 不改轨迹字段集 / 落盘目录 / 保留期取值面（清理执行面单源 = §6.4——目录级判据 + 每写节流）；不改开关默认（默认 OFF 保持）；
- 不做轨迹重放 / 重试补偿（尽力面——丢弃可观测）/ 压缩 / 加密；
- 不做轨迹内容质量改写（仅截断 / 降级 + 标记）。

### 6.4 清理面性能边界：目录级判据 + 每写节流 + 触发面收窄

> 需求 = `docs/core/requirements/TRACES.md` §2.3（F-SL3）。策略面不动（§6.1「完整落盘 + 每写 prune」裁决不变）——本节只收**清理执行面**（判据粒度 / 节流 / 触发面）。

- **D-TR11 目录级判据（三段梯）**：设 `D` = 日目录（`YYYY-MM-DD`——本地时区，与 `localDateStr` 同口径）、`retention` = `traces.retentionHours`；`dayStart` / `dayEnd` = 当日 00:00:00.000 / 23:59:59.999（本地）：
  ① `dayEnd(D) + retention ≤ now` **且目录内全部条目为 `.jsonl`** ⇒ **整目录删**（递归 `rm`，零逐文件 stat）；
  ② `dayStart(D) + retention > now` ⇒ **整目录跳过**（正常写入下目录内无可过期文件）；
  ③ 其余（含含非 `.jsonl` 条目的目录）⇒ **逐文件 `stat` 判定 + unlink**（现行语义；非 `.jsonl` 一律不碰）。空日目录在任何分支后按现法移除。
- **语义 delta 登记（D-TR11）**：纯 `.jsonl` 日目录整删时不逐文件核 mtime（人为回拨 mtime 的文件随目录清理；正常写入 mtime ∈ 目录日 ⇒ 无差异）；②支跳过时人为前拨（超期）文件暂留（宽容向）——保留期主粒度改为**目录日**（与 §6.1 的 24h 保留期并读）。
- **整删支计数口径（D-TR11）**：整删支的 `removed` 计数 = 该批内 `.jsonl` 条目数（与 ③ 支逐文件计入同口径；非 `.jsonl` 不计数）——既有断言保持（整删支 `removed === 2`：含非 `.jsonl` 的目录落 ③、纯 `.jsonl` 过期目录落 ①，两路合计数不变）。
- **非日期名 / 非法日目录归类（D-TR11）**：目录名不以 `YYYY-MM-DD` 解析（日期解析 NaN），**或为非法日（解析归一后 ≠ 原日**——如 `2026-02-31`）⇒ ①② 两条件恒假 ⇒ **回落 ③ 逐文件支**（现行语义；非 `.jsonl` 一律不碰）。
- **D-TR12 每写 prune 节流**：`maybePruneTraces`（`recordChatTrace` 写盘成功后调用）——模块级窗口 `PRUNE_THROTTLE_MS`（10 分钟）+ 在飞合并；`cleanupTraces` 本体保持无状态（启动面 / 手动面直调）。判据 = 同窗 3 连写 ⇒ 扫描 ≤1 次。
  **测试缝（D-TR12）**：节流为模块级状态（**跨用例残留**）——缝 = 既有先例 `_resetTraceStateForTest`（`thincoder-core/traces/trace-store.mjs:106`）扩展为**一并复位节流窗**（或给节流面注入 now 缝），用例须显式复位。
- **D-TR13 启动清理触发面收窄（白名单）+ 启动窗外延迟拍**：启动清理仅在**会话型命令白名单**执行——`tui`（**含无参默认路径 `command === undefined`**，`thincoder-cli/src/command-table.mjs:93-94` `case "tui": case undefined:`）/ `chat` / `acp`；
白名单外命令一律零启动清理（一次性 / 信息命令 `--version` / `-v` / `--help` / `completion`，及 `memory` / `sync` / `reindex` / `distill` / `upgrade` / `session`）；闸位 = 命令解析之后（同档 `:40`）；启动清理白名单判定 = 同档 `:144`；
判据 = `--version` 总时长 ≤0.5s + **无参启动仍执行启动清理**；策略裁决不变——清理照常执行，只是不在白名单外命令启动时执行。
**启动清理 = 启动窗外延迟拍**：

闸内（同档 `:144-149`）不直呼 `cleanupTraces`，改经**核侧调度器** `scheduleTraceCleanup({ dir, retentionHours })`（`thincoder-core/traces/trace-cleanup.mjs` 导出）——`setTimeout` 延迟点火（`TRACE_CLEANUP_DELAY_MS` = **3s**，自调度点起；与 D-SE39 的 `GC_PASS_DELAY_MS` 同值同形态——启动窗 ≤2s 之外留 ≈1s 裕度；**不 unref**——保后台排空现状，与 D-SE39 同向）。

`dir` 由调度点捕获（调用面取 `tracesRoot()`）；失败静默保持（`.catch(() => {})` 移入调度器——fire-and-forget 语义不变）；白名单 / 闸位 / 每进程一次语义均保持（启动面恰一处调用——调度器无去重闸）；进程早退（显式 `process.exit`）未及拍 ⇒ 本次不执行（幂等——下次会话型命令照常清理）。
**注（一次性命令排空 · 与 D-SE39 同向）**：不 unref ⇒ 一次性命令（`chat`）的进程自然排空被延迟拍推后 ≤3s（设计内后果——不损正确性，仅进程退出稍候）。

**判据句（启动解耦）**：启动链（`resumeSlot` → 装配 → TTY 门）**不因 traces 清理竞争超 2s**——读数 = 无参启动至拒印时刻（非 TTY 环境代理「TTY 门」）≤2s × **复测 ≥2 次**（同 D-SE39 口径）；结构性保证 = 清理起点 ≥ 调度点 + `TRACE_CLEANUP_DELAY_MS`（3s——落于启动窗之外）。
**测试缝** = `_setTraceCleanupDelayForTest(ms)`（`_setSessionGcDelayForTest` 同款；用例置 0–短值立即点火；默认值 = 3s 可断言）。

**形态取舍**：核侧 `setTimeout` 取支——与 D-SE39 同款单源（机制 / 常量 / 测试缝住核；核用例可注入 0–短值；闸位包裹在 CLI 子进程面**缝不可注入**且常量外落端层）。
- **双端同函数**：目录级判据与节流住核同一实现——CLI（启动扫 + 每写 prune）与 VSC（仅每写 prune；宿主长驻无启动事件）同源生效；不动开关默认与保留期取值面。
- **存量一次性清理**：目录级判据下任一后续清理拍即整删全部过期日目录（幂等、可复跑）；判据 = 清理后 `.jsonl` 总量回落。
- **模块落点**：清理面外提 `thincoder-core/traces/trace-cleanup.mjs`——`trace-store.mjs` 回落 ≤300；`cleanupTraces` 经 `trace-store.mjs` re-export 保既有 import 面（两端测试）；启动面调度器 `scheduleTraceCleanup` 住该档、由 CLI 直引（不动 store 行数——见 D-TR13）。

## 7. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-TR1 | 单遍序列化（脱敏内联） | 免对象图拷贝与二次全量字符串；峰值 ≈ 单份受限字符串；字段集不变 |
| D-TR2 | 额度双层（单消息 64K / 单记录 4M）+ 不降到无内容（stub 保计数） | 实测合法记录 ≤1.9MB 不受影响（4M 留头寸） |
| D-TR3 | 在途上界 = 待写计数上限 8 + 丢弃计数（尽力面）；序号进程内缓存 | 峰值 ≤ 8 × 记录上限；丢弃可观测；消除逐调用目录扫 |
| D-TR4 | 不新增配置项（额度 = 编译期常量） | 轨迹为诊断面——默认 OFF 时零成本 |
| D-TR6 / D-TR10 | 默认 OFF + 启动清理（发布隐私裁定） | 轨迹含完整对话内容——发布隐私优先；本机调试可显式开；启动清理防无限积累 |
| D-TR11 | 清理判据改**目录级三段梯**（整删 / 跳过 / 逐文件） | 存量 15,610 文件下逐文件 stat = 启动风暴本体；目录日 = 天然保留期主粒度 |
| D-TR12 | 每写 prune **节流（10 分钟窗 + 在飞合并）** | 判据 = 同窗 3 连写 ⇒ 扫描 ≤1；fire-and-forget 语义不变（写盘零阻塞） |
| D-TR13 | 启动清理 = **会话型命令白名单**（`tui`（含无参默认路径 `command === undefined`）/ `chat` / `acp`；白名单外零启动清理）**+ 启动窗外延迟拍**（核侧 `scheduleTraceCleanup`——`TRACE_CLEANUP_DELAY_MS` = 3s、不 unref；测试缝可注入） | `--version` 类一次性命令零后台工作 ⇒ 判据 ≤0.5s 可闭合；清理策略不损（会话型命令为常规路径）。3s ⇒ 清理起点 ≥ 调度点 + 3s = 结构落于启动窗外（与 D-SE39 同款同值） |

（容量 / 清理策略决策面仍见 §3.1 A21 与 §4.1 第 10 行——本表补写入形态面。）
