/**
 * agent-assemble.mjs — 宿主**装配面**出档（状态栏对齐批：自 `agent-host.mjs` 装配段**逐字搬运** —— 原档
 * 触行数拉线拆档，档名 = 在册预案「装配面拆 `thincoder-desktop/src/main/agent-assemble.mjs`」落形）。
 * **装配序 = 核单源**（`thincoder-core/agent/assemble.mjs` —— B5 装配序上提批）：本档 = 端壳 adapter，
 * 留面 = cwd 注入（`projects.currentCwd()`，取值点 `agent-host.mjs`）· `_slot` · 校验调用（`agent.config`）；
 * 装配序本体与团队层取值随上提归核，本档 `assembleFor`（核调用 + 两行后处理）+ 四名**同名转口**。
 * 装配端差（`SHELL.md` §4 显式登记两项 + 取值面一项，保持）：`cwd` = 项目根（注入的
 * `projects.currentCwd()`）——**非** `process.cwd()`；不附着 M1 装配钩子（本端读面未接）；不连外部
 * 工具服务器（本端无此面 —— CLI 侧 MCP 合入走核 `toolsFinalize` 缝）。
 * **R3 执行面缝（#523②）**：档尾**模块装配期一次接线** —— `installExecRunSeams()`（出档 `exec-run.mjs`：
 * `configureExecRun` ← 核上提件 `runInterruptible` ∕ `configureProcessTreeKill` ← 核 `killProcessTree` 转口；
 * VSC `tools/shared.mjs:104-105` 同形）。
 * 零宿主依赖：核函数全部经 `deps` 取值（缺省 = 核单源）⇒ 平 node 直测（零 `electron`）。
 */
import { assembleAgent as coreAssemble, DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider } from "@thincoder/core/agent/assemble.mjs"
// 执行面两缝（R3 · #523② —— 核件转口，零副本；接线在本档尾）。
import { installExecRunSeams } from "./exec-run.mjs"

// 四名转口（核单源**恒等绑定**；调用面 import 路径与名面零改 —— `agent-host.mjs:55`）。
export { DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider }

/** 装配一份会话代理 = 核装配序（`cwd` = 项目根）+ 端壳后处理（`_slot` ∕ 校验调用）。
 *  `deps` 逐项可注入（缺省 = 核缺省）：装配序可机验（U79）。 */
export async function assembleFor({ cwd, slot, deps = {} }) {
  const agent = await coreAssemble({ cwd, deps })
  agent._slot = slot
  validateProvider(agent, agent.config)
  return agent
}

// ─── 装配期缝接线（R3 · #523② —— 模块装配期一次；VSC `tools/shared.mjs:104-105` 同形）────────
installExecRunSeams()
