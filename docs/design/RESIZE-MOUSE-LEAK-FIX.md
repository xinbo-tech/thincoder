# CLI 缩放鼠标序列飞出修复（RESIZE-MOUSE-LEAK-FIX）

> 板块：TUI 生命周期（CLI——mouse/退出序/resize）。权威源：tui-lifecycle.mjs + index.mjs + key-handler.mjs + cmd-exit.mjs。
> 状态：**设计待评审**——2026-09-09 落档（缩放勘察 explore 一手——根因 RC1/RC2/RC3 定位——修复方向齐）。需求：TODO CLI 缩放鼠标序列飞出 bug（用户报告 v0.12.60——批 1）。

---

## 需求

- **总体目标**：修窗口缩放时有概率把鼠标上报序列回显成字面文本飞出（shell 提示符行 `[122;50M...` 伪影）——退出路径根治（RC1/RC2）+ 越界守卫（RC3 放大消减）。
- **功能性**：
  - F-1（停用序重排 + 排空——RC1 主修）cleanup 改为：① 先写 `mouseOff` DECRST → ② 短暂 settle（DECRST 往返——~20ms）→ ③ `setRawMode(false)` → ④ **排空 stdin**（摘 data 监听 + pause——评审 #2：不依赖限时读——settle 已保证无新上报）→ ⑤ 恢复屏幕 → 退出——消除"回显开而鼠标未停"暴露窗口 + 在途字节不归 shell
  - F-2（/exit 与 Ctrl+C 同退出形态——RC2——评审 #2：非同一派发路径）`cmd-exit.mjs` 改走 `ctx.exit`（index.mjs:407
    现成——cleanup + 延迟 exit——不再 process.exit(0) 直调零提前量前量）
  - F-3（鼠标坐标 sane-gate——RC3 放大消减 + 越界防误命中）mouse.mjs 解析后坐标 sane-gate（col > dims.cols / row > dims.rows → 丢弃——与 dims.mjs 同哲学）——resize 后短窗口越界上报不落应用
  - **范围边界**：resize 抑制（resize 期 DECRST/DECSET 重开）不做（复杂度/终端行为依赖——sane-gate 已消减）；x=444444 终端侧伪影不可代码修（记录——终端行为）；X10 格式兼容缺口（:243 正则不剥 X10——低相关——另记）。

## 设计（勘察根因——照做勿自行解释）

### 1. F-1 cleanup 序重排（tui-lifecycle.mjs:51-74 createExitCleanup）
- 现序：saveSession → closeAllMcp → `setRawMode(false)`（:70）→ `writeCleanupSequence`（:71——含 mouseOff）→ setTuiActive(false)
- 改序（评审 #1 定稿——**唯一权威序**——F-1 需求与实现统一）：
  saveSession → closeAllMcp → **① 写 `mouseOff`（DECRST——单独写——不整包 writeCleanupSequence）→ ② settle ~20ms**
  （DECRST 往返——raw 仍开——回显仍关——无暴露窗口）→ **③ setRawMode(false)** → **④ stdin 排空**（removeAllListeners
  + pause——raw 已关但 DECRST 已处理——无新上报——在途已读字节摘监听丢弃）→ **⑤ writeCleanupSequence 余部**
  （clearScreen/bracketedPasteOff/mainBuffer/恢复屏幕）→ ⑥ setTuiActive(false)
- 注（评审 #1）：排空 = removeAllListeners + pause（不依赖限时读——settle 已保证无新上报——在途已读字节被摘监听
  丢弃；未读内核缓冲在 settle 后无新来源——pause 不消费仅防 100ms 延迟窗口新到）——**exit 事件路径同步约束**：
  cleanup 注册于 process.on("exit")（index.mjs:265）——settle 20ms 需同步等待（Atomics.wait 或拆注册点——
  实现时选一并注）——/exit 走 ctx.exit（延迟退出——异步安全）——**Ctrl+C = key-handler 直调 cleanup + 自持
  定时器（评审 #2——非 ctx.exit——AC-2 述准）**——exit 事件只兜底异常退出

### 2. F-2 /exit 走 ctx.exit（cmd-exit.mjs）
- 现：`cmd-exit.mjs:8` process.exit(0) 直调（清理押 'exit' 事件——零提前量）
- 改：走 ctx.exit（index.mjs:407 现成——cleanup 同步执行 + 延迟 exit）——**评审 #2：需渲染抑制**——
  handleSlash 返回后 index.mjs:352-354 无条件 render()——cleanup 恢复主屏后会把 TUI 帧重绘到主屏 ~100ms——
  **doRender 前加 tuiActive 守卫**（render-loop——!tuiActive → 跳过帧写——cleanup 已 setTuiActive(false)）
- 测试：/exit 触发 cleanup 序列（mock ctx.exit 断言）+ **退出前无帧写入断言**（tuiActive false 后 render no-op——
  评审 #2 AC-2 补）

### 3. F-3 鼠标 sane-gate（mouse.mjs）
- sane-gate 落点定稿（评审 #3）：① handleMouseClick 入口（mouse.mjs——state.dims 可用——越界点击丢弃）②
  handleWheel 入口（越界滚轮丢弃——不落面板）③ **index.mjs 滚轮 fallback 前**（:218-227——未命中面板的
  会话滚动——越界 wheel 也禁止滚动——评审 #3：mouse.mjs 内 gate 无法覆盖此路径）——`col > dims.cols ||
  row > dims.rows → 丢弃`（>非 >=——末行列合法）
- 测试：越界坐标（col > cols）→ 无动作无落框；正常坐标不回归

## 受影响文件（CLI）

| 文件 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|
| src/tui/tui-lifecycle.mjs | 75 区 | ≤+8 | F-1 cleanup 序重排 + stdin 排空 |
| src/tui/cmd-exit.mjs | 10 区 | ≤+3 | F-2 走 ctx.exit |
| src/tui/mouse.mjs | 241（实测——评审 #4） | ≤+8 | F-3 sane-gate |
| src/tui/render-loop.mjs（评审 #2 补行） | 128（实测） | ≤+3 | F-2 doRender tuiActive 守卫 |
| src/tui/tui-lifecycle.mjs（评审 #2 补——isTuiActive 读导出） | 75 | ≤+9 | F-1 序重排 + F-2 读导出（现仅 setTuiActive——无读访问器） |
| src/tui/index.mjs | 454（实测——评审 #4） | ≤+5 | F-3 滚轮 fallback 拦截（评审 #3 定稿——非"若需"） |
| test/tui-exit-cleanup.test.mjs + test/mouse-sane-gate.test.mjs（评审 #4 具名） | 新 | 新 ≤80 | F-1/F-3 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 退出序 | cleanup 执行 | mouseOff 先于 setRawMode(false)——stdin 摘监听 + pause——F-1 |
| F-1 在途上报 | 退出前队列有鼠标序列 | 排空——不归 shell 回显——F-1 |
| F-2 /exit | /exit 命令 | 走 ctx.exit（cleanup 同步 + 延迟 exit）——F-2 |
| F-3 越界坐标 | col > cols 鼠标上报 | 丢弃——无动作——F-3 |
| F-3 正常坐标 | 合法范围内点击 | 不回归——F-3 |

## 验收

- AC-1 cleanup 序（mouseOff → setRawMode(false) → stdin 排空——测试锁序）
- AC-2 /exit 走 ctx.exit（cleanup + 延迟 exit——评审 #2：非"同路径"——Ctrl+C 是 key-handler 直调 cleanup——
  断言含退出前无帧写入（渲染抑制生效））
- AC-3 sane-gate（越界丢弃——正常不回归——测试）
- AC-4 npm test 快层零回归
- 红线：鼠标解析器主体不动（只加 gate）；resize 重绘逻辑零动；X10 兼容缺口另记不扩

## 变更记录
- 2026-09-09：落档（勘察一手——RC1 退出时在途上报不排空 + setRawMode(false) 先于 DECRST（tui-lifecycle:70-71）——
  暴露窗口；RC2 /exit 直调 process.exit（cmd-exit:8）零提前量；RC3 resize 全量重绘压 stdin 消费放大——修复：
  序重排 + 排空 + /exit 同退出形态 + sane-gate——x=444444 终端侧伪影不可代码解释（记录——非合法 SGR 按钮值
  cb≤92——终端/ConPTY 行为）。
- 2026-09-09 评审 #1 修正：F-1/§1 统一唯一权威序（mouseOff 单独写 → settle 20ms → raw off → 排空 → 恢复屏幕）+ 
  exit 事件同步约束注；评审 #2 渲染抑制（doRender tuiActive 守卫）+ AC-2 改；评审 #3 gate 落点定稿三处；评审 #4 行数实测——待 round 2 重评。
