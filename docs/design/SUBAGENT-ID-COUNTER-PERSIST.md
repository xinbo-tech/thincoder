# 子代理 id 计数器持久化（SUBAGENT-ID-COUNTER-PERSIST）

> 板块：平台机制（子代理 id 分配——双端）。权威源：subagent-scheduler.mjs nextSubagentId（L433-446——
> counter 挂 history expando——压缩/替换/恢复丢）+ token-ttl.mjs persistEngTokens/readEngTokensFromSlot/
> reconcileEngTokensFromSlot（槽持久化先例模式）。状态：**设计待评审/待批准**——2026-09-09 落档。
> 需求：TODO 子代理 id 复用（2026-09-09 用户观察——§27.1 F4 修复洞——载体设计错——运行时状态挂消息容器）。

---

## 需求

- **总体目标**：子代理 id 计数器从 history expando 挪出——随槽文件持久化——任何 history 重建/替换/压缩/
  恢复后 id 仍单调递增——不回到 1 复用已冻结频道标签。
- **功能性**：
  - F-1（载体挪出）`_subIdCounter` 不再挂 `parent.history ?? parent` expando——改为**槽文件字段**（随会话
    saveSession 写入/loadSlot 读回）——nextSubagentId 读：内存缓存（agent._subIdCounter）→ 槽文件值 →
    poolMax 兜底——三源取 max
  - F-2（写回时机）spawn 取号后即更新内存缓存 + 标脏；saveSession 时序列化进槽 JSON（字段 `_subIdCounter`）
    ——或取号时直接同步写槽（简单优先——选**saveSession 带上**——取号高频避免每 spawn 一次磁盘写）
  - F-3（恢复）loadSlot 恢复会话时读 `_subIdCounter` 入内存缓存——旧槽无此字段 → 缓存 0 + poolMax 兜底
    （现状降级——不崩）
  - F-4（双端镜像）CLI（thincoder）与 VSC（thincoder-vscode）同构落地——设计档为单一权威锚——各端照抄
- **非功能**：N1 零协议变化（webview/块 key 生成方式不变——只是 id 不再复用）；N2 旧槽兼容（无字段不崩
  ——降级为现状）；N3 测试面：counter 跨压缩/跨 saveSession+loadSlot 单调断言（双端各一组）

## 设计

1. **CLI（thincoder/src）**：
   - `session.mjs`（槽序列化）：saveSession 对象加 `_subIdCounter: agent._subIdCounter ?? null`；loadSlot
     恢复时 `agent._subIdCounter = data._subIdCounter ?? 0`
   - `agent-tools/subagent-scheduler.mjs` nextSubagentId：`next = Math.max(agent._subIdCounter ?? 0,
     holder._subIdCounter ?? 0, poolMax) + 1`——写回 `agent._subIdCounter = next`（**history expando 行为
     保留兼容**（旧路径消费方若读 holder——保留双写一版）或直接删 history 写（grep 消费方为零则删）
   - saveSession 调用点（tui-lifecycle/agent-turn 增量保存）自然携带——无需改调用方
2. **VSC（thincoder-vscode/src）**：同构镜像——extension/session-io（saveSlot/loadSlot）+ agent-tools/
   subagent-scheduler.mjs 同改
3. **测试**：双端各一组——① 压缩（history 数组替换）后 spawn id 仍递增 ② saveSession→loadSlot 往返
   counter 保持 ③ 旧槽无字段降级不崩

## 受影响文件

| 文件 | 端 | 现行数 | 增量 | 改动 |
|---|---|---|---|---|
| src/session.mjs | CLI | ~400 区 | ≤+6 | saveSession/loadSlot 带 _subIdCounter |
| src/agent-tools/subagent-scheduler.mjs | CLI | ~450 区 | ≤+8 | nextSubagentId 三源取 max + 内存缓存写回 |
| extension/session-io.mjs（槽序列化点） | VSC | 待勘察 | ≤+6 | 同构 |
| src/agent-tools/subagent-scheduler.mjs | VSC | 同 CLI | ≤+8 | 同构 |
| 测试（双端各一） | 双端 | — | +1 组 | 跨压缩/跨槽往返单调断言 |

## 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 压缩后取号 | history 数组被替换（压缩）→ spawn | id 仍递增（槽值兜底）——F-1 |
| 槽往返 | saveSession → loadSlot → spawn | counter 恢复——id 续号——F-3 |
| 旧槽兼容 | 槽无 _subIdCounter 字段 | 缓存 0 + poolMax 兜底——不崩——F-3 |
| 池活续号 | 池内有条目 spawn | poolMax 续号（现行为保持）——F-1 |

## 验收

- AC-1 grep：nextSubagentId 不再以 history expando 为唯一载体（三源取 max）
- AC-2 跨压缩/跨槽往返测试双端绿
- AC-3 旧槽兼容测试绿
- AC-4 双端 npm test 快层零回归
- 红线：webview/块机制零动（与 ACTIVITY-REWRITE 正交）；协议零改；单文件改动最小化

## 变更记录
- 2026-09-09：落档（用户裁定"按规则把这个落地"——id counter 载体设计错——挪槽持久化——仿 token-ttl
  persistEngTokens 模式——双端镜像——与 ACTIVITY-REWRITE 正交可并行）。
