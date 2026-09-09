# CLI 缩放鼠标序列飞出修复（RESIZE-MOUSE-LEAK-FIX）

> 板块：TUI 生命周期（CLI——mouse/退出序/resize）。权威源：tui-lifecycle.mjs + index.mjs + key-handler.mjs + cmd-exit.mjs。
> 状态：**设计待评审**——2026-09-09 落档（缩放勘察 explore 一手——根因 RC1/RC2/RC3 定位——修复方向齐）。需求：TODO CLI 缩放鼠标序列飞出 bug（用户报告 v0.12.60——批 1）。

---

## 需求

- **总体目标**：修窗口缩放时有概率把鼠标上报序列回显成字面文本飞出（shell 提示符行 `[122;50M...` 伪影）——退出路径根治（RC1/RC2）+ 越界守卫（RC3 放大消减）。
- **功能性**：
  - F-1（停用序重排 + 排空——RC1 主修）cleanup 改为：① 先写 `mouseOff` DECRST → ② 短暂 settle（DECRST 往返——~20ms）→ ③ `setRawMode(false)` → ④ **排空 stdin**（摘 data 监听/pause/限时读丢弃在途鼠标上报）→ ⑤ 恢复屏幕 → 退出——消除"回显开而鼠标未停"暴露窗口 + 在途字节不归 shell
  - F-2（/exit 同路径——RC2）`cmd-exit.mjs` 改走 `ctx.exit`（index.mjs:407 现成——cleanup + 延迟 exit——不再 process.exit(0) 直调零提前量）
  - F-3（鼠标坐标 sane-gate——RC3 放大消减 + 越界防误命中）mouse.mjs 解析后坐标 sane-gate（col > dims.cols / row > dims.rows → 丢弃——与 dims.mjs 同哲学）——resize 后短窗口越界上报不落应用
  - **范围边界**：resize 抑制（resize 期 DECRST/DECSET 重开）不做（复杂度/终端行为依赖——sane-gate 已消减）；x=444444 终端侧伪影不可代码修（记录——终端行为）；X10 格式兼容缺口（:243 正则不剥 X10——低相关——另记）。

## 设计（勘察根因——照做勿自行解释）

### 1. F-1 cleanup 序重排（tui-lifecycle.mjs:51-74 createExitCleanup）
- 现序：saveSession → closeAllMcp → `setRawMode(false)`（:70）→ `writeCleanupSequence`（:71——含 mouseOff）→ setTuiActive(false)
- 改序：saveSession → closeAllMcp → **① `writeCleanupSequence`（先 mouseOff DECRST——回显未开）→ ② `setRawMode(false)` → ③ stdin 排空**（`process.stdin.removeAllListeners("data")` + `process.stdin.pause()`——丢弃在途——不再转发 keyStream）→ ④ setTuiActive(false)
- 注：writeCleanupSequence 内含 clearScreen/mouseOff/bracketedPasteOff/mainBuffer 等——DECRST 先于回显开——暴露窗口消
- 排空 = removeAllListeners + pause（有 100ms 延迟退出路径——Ctrl+C 的 setTimeout 窗口——监听器已摘——残留字节不再被转发/渲染）

### 2. F-2 /exit 走 ctx.exit（cmd-exit.mjs）
- 现：`cmd-exit.mjs:8` process.exit(0) 直调（清理押 'exit' 事件——零提前量）
- 改：走 ctx.exit（index.mjs:407 现成——cleanup 同步执行 + 延迟 exit——与 Ctrl+C 同路径）
- 测试：/exit 触发 cleanup 序列（mock ctx.exit 调用断言）

### 3. F-3 鼠标 sane-gate（mouse.mjs）
- parseMouseClicks（mouse.mjs:79-86）解析后 + index.mjs 滚轮/左键处理——坐标 sane-gate：`col > state.dims.cols || row > state.dims.rows → 丢弃`（不落 keyStream/不触发动作）——resize 后尺寸变化瞬间的越界上报天然被灭
- 测试：越界坐标（col > cols）→ 无动作无落框；正常坐标不回归

## 受影响文件（CLI）

| 文件 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|
| src/tui/tui-lifecycle.mjs | 75 区 | ≤+8 | F-1 cleanup 序重排 + stdin 排空 |
| src/tui/cmd-exit.mjs | 10 区 | ≤+3 | F-2 走 ctx.exit |
| src/tui/mouse.mjs | 229 | ≤+8 | F-3 sane-gate |
| src/tui/index.mjs | 449 | ≤+3 | F-3 接线（若滚轮/左键处理处需传 dims） |
| test/（cleanup 序 + sane-gate 新测试） | 新 | 新 ≤80 | F-1/F-3 |

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
- AC-2 /exit 与 Ctrl+C 同路径（ctx.exit——测试）
- AC-3 sane-gate（越界丢弃——正常不回归——测试）
- AC-4 npm test 快层零回归
- 红线：鼠标解析器主体不动（只加 gate）；resize 重绘逻辑零动；X10 兼容缺口另记不扩

## 变更记录
- 2026-09-09：落档（勘察一手——RC1 退出时在途上报不排空 + setRawMode(false) 先于 DECRST（tui-lifecycle:70-71）——暴露窗口；RC2 /exit 直调 process.exit 零提前量（cmd-exit:8）；RC3 resize 全量重绘压 stdin 消费放大——修复：序重排 + 排空 + /exit 同路径 + sane-gate——x=444444 终端侧伪影不可代码解释（记录——非合法 SGR 按钮值 cb≤92——终端/ConPTY 行为）。
