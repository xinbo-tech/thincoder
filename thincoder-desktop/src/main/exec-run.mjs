/**
 * exec-run.mjs — 桌面 **exec-run 端面**（R3 · 桌面功能对位批 · #523② —— `configureExecRun` 真缺项的落点）。
 * 缝供值 = **核件单源**（KD-T2「上提 = 纯搬 + 转口零语义改；端侧复刻被否」）：
 *   · `configureExecRun`        ← `runInterruptible`（可中断执行器：spawn + abort/timeout 树杀 —— 核
 *                                 linter / verify 的检查器命令改经此，Stop 可停；不阻塞主进程事件循环；
 *                                 实现已上提 `@thincoder/core/tools/exec-run.mjs`，本端零副本）
 *   · `configureProcessTreeKill`← `killProcessTree`（核 `tools/process-tree.mjs` 单源 —— 转口，零第二实现；
 *                                 消费面 = 核 `execute` 工具超时 ∕ 中止树杀）
 * 接线点 = **模块装配期一次**（`agent-assemble.mjs` 档尾调用 `installExecRunSeams()` —— VSC
 * `thincoder-vscode/src/tools/shared.mjs:104-105` 同形）。**回退面**：需核缺省径（execFileSync CLI 语义）的
 * 进程 ∕ 用例调核 `resetExecRun()` ∕ `resetProcessTreeKill()`（本档只供接线，不另设回退入口）。
 * 零宿主依赖（纯核件转口）⇒ 平 node 直测。
 */
import { configureExecRun, runInterruptible } from "@thincoder/core/tools/exec-run.mjs"
import { configureProcessTreeKill } from "@thincoder/core/tools/execute.mjs"
import { killProcessTree } from "@thincoder/core/tools/process-tree.mjs"

/** 两缝注册（装配期一次调用；注入面为核内单值位 ⇒ 重复调用幂等 —— 后值覆盖同值）。 */
export function installExecRunSeams() {
  configureExecRun({ run: runInterruptible })
  configureProcessTreeKill({ killTree: killProcessTree })
}
