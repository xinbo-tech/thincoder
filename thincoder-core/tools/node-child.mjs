/**
 * tools/node-child.mjs — node 语义子进程启动单源（TOOLS.md §6.18 · D-TO14 · 台账 #602）。
 *
 * 缺口：核内 spawn `process.execPath` 的隐含前提 = 「execPath 为 node」。桌面宿主主进程 =
 * `electron.exe` ⇒ execPath 属 Electron 族二进制——子进程按 Electron 应用启动、不执行代码
 * （execute 悬挂至超时）。本档 = 那一跳：Electron 宿主补 `ELECTRON_RUN_AS_NODE: "1"`，
 * 同一二进制以 node 语义启动。
 *
 * 判据 = `process.versions.electron`（运行时能力探测——非端名分支）：三端同判据、同式执行；
 * 已处 node 模式的 Electron 宿主（VS Code 扩展宿主——env 携旗标）为同值幂等。
 * 消费 = `execute.runNode` spawn 选项 ∕ `lint` 快路径（经 `exec-run` `opts.env` 透传）。
 */

/**
 * node 语义子进程 env：Electron 宿主 ⇒ `{ ...base, ELECTRON_RUN_AS_NODE: "1" }` 副本
 * （不改父进程 env）；否则原样返回 `base`（同引用——与 spawn 缺省继承逐字等价，零行为变）。
 * 第二参 = 判据注入（机检用——先例 `_setGitTimeoutForTest` 族）。
 */
export function nodeChildEnv(base = process.env, isElectron = !!process.versions.electron) {
  return isElectron ? { ...base, ELECTRON_RUN_AS_NODE: "1" } : base
}
