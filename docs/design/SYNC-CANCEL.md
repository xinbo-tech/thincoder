# Sync Spawn 可中止（SYNC-CANCEL——L52）

> 板块：Agent 循环 · 子代理取消（TUI ⏹ 语义）。权威源：AGENT-LOOP.md（cancel/子代理生命周期）+ TUI.md（⏹ 门控段 :398-402）。
> 状态：**设计待评审**——2026-09-09 落档（深勘察 explore 一手——信号流全链 + 三分支 + TUI 三层 + 8 风险）。用户 2026-09-08 裁"要 sync 可中止"（L52——TUI TODO）。

---

## 需求

- **总体目标**：TUI 同步 spawn（sync——深度>0 或阻塞调用）运行时可点 ⏹ **定向中止**（只停子代理——父回合继续处理 stopped 报告）——不再只能 Ctrl+C 整回合停。用户裁"要"。
- **功能性**：
  - F1 sync spawn 建自属 AbortController（父 signal 派生链）——child 收自属 signal——与父回合解耦
  - F2 sync catch 三分支：① base abort（整回合停——现状保留）② targeted（自属 ctrl aborted——折叠 stopped 报告返回——父回合继续）③ 其他错误（现状保留）
  - F3 TUI ⏹ 门控放开 sync（registry live 才钉）——mouse 命中 → cancelSyncChild 定向 abort
  - F4 折叠报告：merge child mutations + STOPPED_MARK 文案 + partial 警示——走成功冻结管线（done 补发/精确冻/预览入流）
  - F5 嵌套 sync spawn 逐层自属（递归可中止——内层链外层 ctrl）
  - **范围边界**：只做 CLI TUI depth-0 sync spawn 顶层块（VSC webview 不同构——单独立项）；escalate sync 块无 ⏹ 面——另议；async cancel 语义不变（折叠只在 sync 层——不改 runChildPipeline）；模型侧 executeCancelAction 不扩（sync 无 ack——L52 面 = TUI ⏹ 直连）。

## 设计（深勘察骨架——照做勿自行解释）

### 1. 信号链（F1/F5）
- sync 分支（subagent.mjs:218 起）runChildPipeline 前建 `ctrl = new AbortController()`——`baseSignal = buildChildSignal(parent, ctx)`（async-settle.mjs:66——_sessionSignal ?? ctx.signal）——baseSignal aborted → ctrl.abort()；否则 addEventListener("abort", → ctrl.abort(), {once:true})
- childRunOpts 覆写 `{ ...childRunOpts, signal: ctrl.signal }`（照抄 async 分支 subagent-run.mjs:154 覆写模式——不改 buildChildRunOpts——escalate/consult 不受影响）
- 注册：makeRelay（subagent-spawn.mjs:394）后注册 `parent._syncChildAborts = Map<key=relayPrefix去尾, {ctrl, stopped}>`——try/finally 注销（成功/折叠/整回合停三路径——R7 防跨回合残留）

### 2. catch 三分支（F2——subagent.mjs:242-253 改造）
抽可测纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`（R3 收紧）：
1. **整回合停**：`baseSignal?.aborted`（⚠ 查 baseSignal 非仅 ctx.signal——挂起 digest 场景 child 链 _sessionSignal——R2）→ 现状逐字保留（emitNestedChildEvent stopped + rethrow）
2. **targeted 折叠**：`err?.name==="AbortError" && ctrl.signal.aborted && !baseSignal?.aborted` → return 折叠报告：
   - `mergeChildMutations(parent, child)`（guard 需见子代理已写文件——镜像 escalate sync runner 先例 subagent-actions.mjs:413-421）
   - 报告形态仿 onDeclined partial（subagent-async.mjs:259-264）：`Subagent (${role}) stopped by user —
     work may be partial; review recent_changes before deciding next steps.` + `_capturedOutput`
     （spawn-child.mjs:194-195）+ eng-coder designId 后缀
   - `STOPPED_MARK` 常量（spawn-child.mjs TURN_CAP_MARK 旁）——tool-events.mjs:178/:205 partial 检测扩展该串（R6——块冻结标 stopped 而非 done）
   - emitNestedChildEvent(stopped) 照发（幂等无害）
3. **其他错误**：现状分支逐字保留（:249-253）

### 3. TUI 三层（F3）
- panel 门控（subagent-panel.mjs:170-178）：`!sub.done && (sub.async === true || state._agent?._syncChildAborts?.has(sub.key)) && (SUBAGENT_ROLES…||advisor)`——headless/测试无 _agent → sync 不钉 ⏹（零回归）——命中区/_stopCol/_stopSub 不动——TUI.md:398-402 锚同步
- mouse 命中区（mouse.mjs:131-139）：零改动（renderer 决定）
- cancelSubagent handler（mouse.mjs:185-208）：池/advisor miss 后查 sync registry——新
  `cancelSyncChild(agent, key)`（subagent-async.mjs——与 cancelAsyncSubagent 同模块）：有 live ctrl →
  abort + stopped=true → {id,status:"cancelled"}；无 → error 文案——:199 拒绝文案改定向（registry
  miss + live 块 → "…finished or stop no longer applies"）
- 数据层 subagent-blocks.mjs 无需新字段（sync = sub.async !== true 默认——句柄不进 state.subTasks——registry 放 agent——与 async entry controller 存池分层一致）

### 4. 模态交互（R1——**用户 2026-09-09 裁 v2 完整**）
- 现状：权限 await（dispatch.mjs:265）+ continue 问询（subagent.mjs:206-210）不观 signal——targeted abort
  后 child 停在模态——runChildPipeline 不返回——父回合仍阻塞至模态回答（权限模态吞键——但 ⏹ 是
  鼠标不经模态可点）
- **v2（完整——用户裁）**：cancelSyncChild 时**顺带 deny** 该 child 的 pending ask——模态立即解除：
  - 工具权限 ask 加 owner key 标识（subagent-spawn.mjs:287 name=`${role}/${tool}` 无 key——补 key）
  - 权限模态（key-modes.mjs 模态）收到 deny → 立即解绕（child 获 AbortError/DenyError）
  - `_permQueue` 未触发的 queued ask——ask 闭包查 stopped 旗标（entry.stopped）→ 不弹模态直接拒绝
  - continue ask 已带 args.agent=key（subagent.mjs:208）——同查 stopped
- 记录：该缺陷 async cancel 同样存在（现状已知——非本批引入——v2 的 deny 机制后续可复用到 async）

### 5. 测试（async-settle.test.mjs 风格——纯单元无 io）
1. cancelSyncChild（live abort + 幂等 + 无 key/stopped error）
2. classifySyncAbort 三分支（含挂起场景——ctx.signal 未 abort 而 base aborted）
3. 折叠报告形态（merge/STOPPED_MARK/_capturedOutput/designId 后缀）
4. controller 链（base abort → ctrl 链式 + finally 三路径注销）
5. 端到端（慢测/人工——中点 ⏹ → stopped 报告 + 块冻结）

## 受影响文件

| 文件 | 端 | 改动 |
|---|---|---|
| src/agent-tools/subagent.mjs:218-254 | CLI | 自属 ctrl + 三分支 catch + registry 注册/注销 |
| src/agent-tools/subagent-async.mjs | CLI | cancelSyncChild 新函数 |
| src/agent-tools/async-settle.mjs:66 | CLI | buildChildSignal 复用（不改） |
| src/spawn-child.mjs:194-195 旁 | CLI | STOPPED_MARK 常量 |
| src/agent-tools/tool-events.mjs:178/:205 | CLI | partial 检测扩展 STOPPED_MARK |
| src/agent-tools/subagent-spawn.mjs:287 | CLI | v2：工具权限 ask 加 owner key（用户裁 v2） |
| src/tui/key-modes.mjs 模态 | CLI | v2：deny 解绕 + queued ask 查 stopped 旗标不弹 |
| src/tui/subagent-panel.mjs:170-178 | CLI | ⏹ 门控放宽 sync |
| src/tui/mouse.mjs:185-208 | CLI | cancelSubagent + sync registry 查 + 文案 |
| test/（async-settle 风格新测试） | CLI | 上述 5 组 |
| docs/design/TUI.md:398-402 | CLI | ⏹ 门控锚同步 |
| docs/design/AGENT-LOOP.md §19.5 | CLI | cancel 边界注 |

## 验收

- AC1 sync spawn 运行中 ⏹ 可点——定向中止（child 停——父回合继续拿 stopped 报告——块冻结标 stopped）
- AC2 Ctrl+C/I 整回合停语义不变（base abort 三分支①透传——清池）
- AC3 折叠报告含 merge（guard 见子代理改动）+ STOPPED_MARK + partial 警示
- AC4 嵌套 sync spawn 递归可中止（逐层自属）
- AC5 测试绿（cancelSyncChild/classifySyncAbort/折叠形态/controller 链——快层）+ 既有不回归
- AC6 headless/测试无 _agent → sync 不钉 ⏹（零回归）

## 变更记录
- 2026-09-09：L52 深勘察落档（信号流全链实证 + 改造骨架 + 8 风险 R1-R8）——v1/v2 模态决策点待用户裁——评审后 eng-coder。
