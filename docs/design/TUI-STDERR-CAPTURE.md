# CLI TUI 崩溃 stderr 默认捕获（TUI-STDERR-CAPTURE）

> 板块：TUI 生命周期崩溃面（CLI——崩溃诊断留痕）。权威源：bin/thincoder.mjs 入口 + src/crash-reports.mjs（R25——JS/V8/C++ 断言已覆盖——本批补第 4 类：外部终止/native abort 的 stderr 诊断）。
> 状态：**设计待评审**——2026-09-09 落档（用户场景实证：resize 崩溃无 [error] 行 + crash-reports 空 + 事件日志零 node 记录 = 进程被外部终止（ConPTY/终端层）——Node 无钩子——native abort 诊断走 stderr(fd 2) 进程内不可改——**外层父进程包装 = 唯一默认捕获路**——用户裁接受包装）。需求：TODO CLI TUI 崩溃 stderr 默认捕获（用户反馈——"固定在程序里默认记录——出问题查"）。

---

## 需求

- **总体目标**：TUI 模式崩溃（含 JS 钩子拦不住的**外部终止/native abort**——第 4 类）的 **stderr 诊断默认落盘**——出问题去查文件即得崩点——无需稳定复现。
- **功能性**：
  - F-1（自包装 stderr tee）TUI 模式启动 = 父进程 spawn 子进程（自身）——子 stderr pipe → 父 **tee 双写**（实时转发终端 + 追加 `~/.thincoder/crash-reports/tui-stderr-<ts>-<pid>.log`）——子死（任何原因）→ 父收 exit → 日志收尾 → 同码退出
  - F-2（日志生命周期）tui-stderr-*.log 落 crash-reports 目录（R25 既有——语义同族）——purge 扩展匹配（>30 天淘汰——搭车现有写时清理）
  - F-3（退出码传播 + 控制台信号）父 exit 码 = 子 exit 码；Windows 控制台 Ctrl+C 父子共享——父 **忽略 SIGINT**（不打断 tee）——子正常处理（raw mode key-handler 二按退出）→ 父收 exit 退
  - **范围边界**：只包装 TUI 模式（case "tui"/undefined——常驻进程崩溃面最大）——chat/acp/memory 等一次性命令**不包装**（stderr 终端可见无盖屏——不需）；VSC 无此面；R25（JS 异常/V8 fatal/C++ 断言写 crash-*.json/report.*.json）**保留不动**（子进程内照常——本批只补 stderr 诊断面）。
  - **非功能性（评审 #3 补）**：tee 开销可忽略（父进程空转——每 stderr chunk 一次同步 append）；兼容——Windows/Node 24
    （Ctrl+C 语义实证锁定）+ POSIX（signal 死 code null 映射）；尽力面——父同死时日志含已 append 内容（不保证最后
    chunk）；日志权限 0600（crash-*.json 先例——评审 #8）——30 天 purge（R25 搭车）。

## 设计（入口结构勘察实证——照做勿自行解释）

### 1. F-1 包装插入（bin/thincoder.mjs）
- 插入点：L30 command 解析后（case "tui"/undefined 判定已知）——**prepareCrashReporting()（L36）之前**（父进程不预建/不设 report——子进程做）
- 判定：`(command === undefined || command === "tui") && !process.env.THINCODER_TUI_WRAPPED` → **父进程分支**（L119 switch 前 return/分流）——否则正常（子进程或非 TUI）
- 父进程逻辑（评审 #4 定稿——**新文件 src/tui/wrapped-spawn.mjs**——`spawnTuiWrapped()` ≤40 行——bin 只留
  判定 + 调用 ≤+8——避免 bin ≤+30 与 ≤40 函数矛盾）：
  1. **mkdir -p crash-reports 目录**（评审 #2——wrapper 先建目录——prepareCrashReporting 只在子内跑——
     新装首启目录不存在会静默不包装——mkdir 后开日志文件 `tui-stderr-${Date.now()}-${process.pid}.log`
     （append——仍失败 → 不包装直接跑——尽力面）
  2. `spawn(process.execPath, [binPath, ...process.argv.slice(2)], { stdio: ["inherit", "inherit", "pipe"], env: { ...process.env, THINCODER_TUI_WRAPPED: "1" }, windowsHide: false })`
  3. 子 stderr data → 双写（`process.stderr.write` + `appendFileSync` 日志）
  4. 子 exit → 日志 flush → `process.exit(childExitCode)`——**exit 码 null 映射（评审 #1）：
     `childExitCode ?? (signal ? 1 : 0)`**——exit 事件兜底（超时 30s 强退）+ **子 spawn error 事件
     （评审 #5：spawn 失败不发 exit 只发 error——error → 日志注失败 → exit 1）**
- 子进程路径：env 门已设 → 走现逻辑（L36 prepareCrashReporting + switch——正常 TUI）——**子进程内零行为变化**

### 2. F-2 日志生命周期（crash-reports.mjs）
- `isCrashRecordName` 扩展：`/^tui-stderr-.+\.log$/`（purge 30 天覆盖）
- 文件头写一行元信息（启动时间/pid/argv——崩溃诊断上下文——便于事后定位）

### 3. F-3 控制台信号（父进程）
- 父：`process.on("SIGINT", () => {})` + `process.on("SIGTERM", () => {})`（忽略——不打断 tee——子处理退出后父收 exit）
- **Windows 控制台 Ctrl+C 语义实证注**：父子共享控制台——子 raw mode 后 Ctrl+C = 字节进 stdin（key-handler 处理——不产生信号）——父普通模式收 SIGINT（若产生）→ 忽略——子正常退出 → 父收 exit 同码退——**实现时实证锁定**（Windows/Node 24 实测——若 Ctrl+C 事件发全部进程致子默认退（不干净）→ 子也需 SIGINT 处理注——实现时按实测补）
- 测试：父 spawn 子 + stderr 落盘断言（env 门注入——模拟子写 stderr → 日志含内容）；退出码传播；SIGINT 忽略面（mock）

## 受影响文件（CLI）

| 文件 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|
| bin/thincoder.mjs | 399 | ≤+8（评审 #4——函数拆新文件） | F-1 判定 + 调用 |
| src/tui/wrapped-spawn.mjs（评审 #4——新） | 新 | 新 ≤40 | F-1 spawnTuiWrapped + tee + 信号 |
| src/crash-reports.mjs | 124 | ≤+6 | F-2 purge 扩展 + 元信息头 |
| test/（wrapped-spawn 新测试） | 新 | 新 ≤80 | F-1/F-2/F-3 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 包装 | TUI 启动（无 env 门） | 父 spawn 子——stderr 双写终端 + 日志——F-1 |
| F-1 子崩溃 stderr | 子进程写 stderr（含 native 诊断） | 日志含全部 stderr 内容——F-1 |
| F-1 env 门 | THINCODER_TUI_WRAPPED=1 | 不包装——子直接跑——零行为变化——F-1 |
| F-2 日志 | 崩溃后查 crash-reports | tui-stderr-<ts>-<pid>.log 存在 + 30 天 purge——F-2 |
| F-3 退出码 | 子 exit 3 | 父 exit 3——F-3 |
| F-3 信号死（评审 #1） | 子被信号杀（code null） | 父 exit 1（null 映射）——F-3 |
| 错误：spawn 失败（评审 #5） | 子 spawn error | 日志注 + exit 1（不挂死）——F-1 |
| 错误：日志开失败 | crash-reports 不可写 | 不包装直接跑（尽力面——不阻断）——F-1 |

## 验收

- AC-1 TUI 启动默认包装（父 spawn 子——env 门检测——测试锁）
- AC-2 子 stderr 全量落盘（tui-stderr-<ts>-<pid>.log——含崩溃诊断——测试）
- AC-3 退出码传播（子码 = 父码——测试）
- AC-4 SIGINT 忽略（父不打断 tee——子正常退——测试/实证）
- AC-5 npm test 快层零回归（非 TUI 命令零包装——chat/acp 路径零动）
- AC-6 R25 保留（crash-*.json/report.*.json 机制零动——子进程内照常）
- 红线：子进程 TUI 路径零行为变化（env 门后纯现逻辑）；非 TUI 命令零包装；VSC 零动

## 变更记录
- 2026-09-09：落档（用户场景链实证：resize 崩溃 → 无 [error] 行（handleFatal 未触发）+ crash-reports 空
  （R25 三类未触发）+ Windows 事件日志 45 天零 node 崩溃记录 → 崩溃 = 进程被外部终止（ConPTY/终端层杀）
  ——Node 无钩子——native abort stderr 走 fd 2 进程内不可改——外层父进程 stderr pipe tee = 唯一默认捕获
  路——用户裁接受包装——只 TUI 模式（一次性命令 stderr 可见无需）——R25 保留补第 4 类诊断面——Windows
  Ctrl+C 信号语义实证注）。
