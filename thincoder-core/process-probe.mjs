/**
 * process-probe.mjs — 进程探测族 + 本产品身份判据（**判据单源**——
 * MULTI-INSTANCE-COLLAB §3.1 F-MI6 / N-MI6 · D-MI9–D-MI12；批 1 CORE-DEFECT-FIXES）。
 *
 * 两个消费面共用本档（零第二套标记正则——V3）：
 * - **读面** `peer-instances.mjs` `peerInstances()`：存在性判活（`batchAlive`）× 命令行身份
 *   复核（`isProductProc`）⇒ 端字段（`classifyEnd`）；
 * - **清理面** `session-slots.mjs` `cleanDeadOwners()`：pid 存在性之外加身份复核
 *   （`filterDeadOwners`——pid 复用 ⇒ 陈旧属主条目可删；判据面 = SESSION.md §6.2）。
 *
 * 成本纪律（D-MI3 / N-MI3）：判活与命令行探测**各一次 exec 拿全量**——本档只提供批量形态，
 * 调用面逐条消费同一批量结果，**不做每 pid 一次 exec**（注入缝 `cmdlineFn(pids)` 即此批量语义）。
 * 每族两形态（TUI 假死批 2026-09-18）：**同步**（`execFileSync`——清理面 `cleanDeadOwners` 在用，
 * 非每回合面，D-MI14）与**异步**（`execFile` + Promise——**读面** `peerInstances` 每回合调用，
 * 不得占住事件循环）；两形态**共用同一解析族与同一注入缝**，语义（返回集 / null 降级）逐条对齐。
 *
 * 束 API（init-block 批 · F-MI7）：清理 / 认领 / 恢复四面**零自有探测**——入口一次
 * `probeOwnersSync` / `probeOwnersAsync` 拿束（≤1 判活 + ≤1 cmdline），判据经 `ownerState`
 * 三态（`"dead" | "alive" | "unknown"`）逐条查表；`isProcessAlive` = 单 pid 兼容面（有界
 * 2 s + 三态）。`filterDeadOwners` = `ownerState` 薄适配（`alive` 三态，缺省 = 未知）。
 * 方向不对称（D-MI10）：探测失败（null）/ 该 pid 缺行 ⇒ **保守保留/不删**——误保留 = 噪音，
 * 误删活实例 = 破坏存储隔离（双进程同槽），两者代价不同级。
 *
 * 执行面拆分（#590① · CORE-UNIFICATION 行 10 兑现）：注入缝 + 解析族 + 四批量探测函数
 * （`batchAlive` / `batchAliveAsync` / `probeCmdlines` / `probeCmdlinesAsync`）+ `uniqPids`
 * 住拆分件 `process-probe-exec.mjs`（迁移账 = 该档头注）；本档 import 自用 + re-export
 * 保导入面逐字零改（VSC `session-io.mjs` 与核七消费档不动）。
 */
import { execFileSync } from "node:child_process"
import {
  batchAlive, batchAliveAsync, probeCmdlines, probeCmdlinesAsync,
  uniqPids, parseTasklistPids,
} from "./process-probe-exec.mjs"

/** 同步束的**紧界**（F-MI7 · SESSION.md §6.2）：同步探测阻塞事件循环 ⇒ 单次 exec ≤ 2 s；
 *  超时 / 失败 ⇒ 未知（三态判据）⇒ 保守保留（D-MI10）。单源常量——调用面不得自行取值。 */
export const SYNC_PROBE_MS = 2000

/** VS Code 扩展宿主判别标记（决策③ A——cmdline 探测）：扩展宿主进程 argv 必带其一
 *  （Windows：Code.exe --type=extensionHost / --extensionDevelopmentPath；Unix 同）。 */
const VSC_END_RE = /--extensionDevelopmentPath|--type=extensionHost|extensionHostProcess/i

/** 本产品 CLI 入口标记族（D-MI9）：命令行含入口路径段即认本产品——启动形态多
 *  （`node bin/thincoder.cjs` / `--inspect` / 卷路径大小写），故用「族」而非全等；
 *  缺该段的自持入口形态（包装器）属已登记已知局限（MULTI-INSTANCE-COLLAB §3.1
 *  「误删方向」——消解路径 = 实测出现时补进本族，单源改点仅此一处）。 */
const CLI_ENTRY_RE = /thincoder\.cjs|thincoder\.mjs|thincoder-cli/i

/** 桌面端（Electron 主进程）判别标记族（台账 #584 实读定形——`electron .` 启动形态）：真机捕获
 *  命令行 = `"…\thincoder-desktop\node_modules\electron\dist\electron.exe" .`——产品树路径段可判
 *  （打包件 exe 名同族）。补入本族 = §3.1「标记族假阴性」已知局限的实测消解路径（原族外形态）。 */
const DESKTOP_END_RE = /thincoder-desktop/i

/** 本产品身份判据（单源）：命令行命中 CLI 入口族 ∕ VSC 扩展宿主族 ∕ 桌面端族 ⇒ 本产品进程。
 *  命令未知（undefined / 空串）⇒ `false`——**调用方须自行区分「未知」与「明确不符」**
 *  （未知 = 保守保留，明确不符 = 剔除/可删；两态判据见 `filterDeadOwners` 与读面落点）。 */
export function isProductProc(cmdline) {
  if (typeof cmdline !== "string" || cmdline.length === 0) return false
  return CLI_ENTRY_RE.test(cmdline) || VSC_END_RE.test(cmdline) || DESKTOP_END_RE.test(cmdline)
}

/** cmdline → 端标签：扩展宿主标记 → vscode；桌面端族 → desktop；其余（node/thincoder CLI）→ cli。
 *  命令不可得（探测失败 / 缺行）⇒ `undefined`（端字段缺省——既有降级语义）。 */
export function classifyEnd(cmdline) {
  if (typeof cmdline !== "string" || cmdline.length === 0) return undefined
  if (VSC_END_RE.test(cmdline)) return "vscode"
  if (DESKTOP_END_RE.test(cmdline)) return "desktop"
  return "cli"
}

/**
 * 三态判据（**单源** · F-MI7 · SESSION.md §6.2）：`ownerState(pid, { aliveSet, cmds })`。
 * 顺序即语义（判据面唯一——调用面**不得**复刻本判据）：
 *   ① `aliveSet == null` ⇒ `"unknown"`（**探测失败 ≠ 全死**——D-MI10）；
 *   ② pid 不在存活集 ⇒ `"dead"`（明确不存在）；
 *   ③ 存活但命令行缺行（cmdline 探测失败 / 未发）⇒ `"unknown"`（保守保留）；
 *   ④ 命令行明确可得且非本产品 ⇒ `"dead"`（pid 复用——D-MI11）；
 *   ⑤ 命令行命中本产品标记族 ⇒ `"alive"`。
 * 方向不对称：`"unknown"` ⇒ 不认领 / 不判死 / 不删（保守保留）。
 */
export function ownerState(pid, { aliveSet = null, cmds = null } = {}) {
  if (!aliveSet) return "unknown"
  const n = Number(pid)
  if (!n || !aliveSet.has(n)) return "dead"
  const cmdline = cmds?.get?.(n)
  if (typeof cmdline !== "string" || cmdline.length === 0) return "unknown"
  return isProductProc(cmdline) ? "alive" : "dead"
}

/** 探测束（同步 · F-MI7）：一次调用 = 全量待判 pid 的判活 +（必要时的）命令行批量结果。
 *  `pids` 空 ⇒ **零 exec 早退**（`aliveSet` null = 未探测——判据层按未知保守处理）。
 *  ≤1 批量判活 + ≤1 批量 cmdline（D-MI3 / N-MI3——零逐 pid exec；**cmdline 仅对存活 pid**
 *  发——死者判据只需存在性。**不得按本进程 pid 排除**：属主条目 pid == 本进程 pid 而会话 id
 *  不同 = pid 复用场景，身份复核（D-MI11）正是靠 cmdline 区分——排除即退化为「未知 ⇒ 保留」。
 *  同步形态以 `SYNC_PROBE_MS` 紧界（超时 ⇒ `aliveSet` null ⇒ 未知）。
 *  cmdline **仅存在存活属主时**发（全死 ⇒ 省发）——束内自决，调用面零探测零判据。 */
export function probeOwnersSync(pids) {
  const uniq = uniqPids(Array.isArray(pids) ? pids : [])
  if (uniq.length === 0) return { aliveSet: null, cmds: null }
  const aliveSet = batchAlive(uniq, { timeoutMs: SYNC_PROBE_MS })
  let cmds = null
  if (aliveSet) {
    const alivePids = uniq.filter((pid) => aliveSet.has(pid))
    if (alivePids.length > 0) cmds = probeCmdlines(alivePids, { timeoutMs: SYNC_PROBE_MS })
  }
  return { aliveSet, cmds }
}

/** 异步对偶（同语义 / 同一注入缝）：恢复 / 异步清理路径用——不阻塞事件循环，
 *  沿用 10 s / 15 s 量级（`batchAliveAsync` / `probeCmdlinesAsync`）。 */
export async function probeOwnersAsync(pids) {
  const uniq = uniqPids(Array.isArray(pids) ? pids : [])
  if (uniq.length === 0) return { aliveSet: null, cmds: null }
  const aliveSet = await batchAliveAsync(uniq)
  let cmds = null
  if (aliveSet) {
    const alivePids = uniq.filter((pid) => aliveSet.has(pid)) // 同同步版：不按本进程 pid 排除
    if (alivePids.length > 0) cmds = await probeCmdlinesAsync(alivePids)
  }
  return { aliveSet, cmds }
}

/** 单 pid 兼容面（F-MI7——原住 `session-slots.mjs`，本批外提判据单源）：**有界同步** ——
 *  单次 exec ≤ `SYNC_PROBE_MS`；**三态**：`true` 活 / `false` 死 / `undefined` **未知**
 *  （超时 / 探测失败 ⇒ 未知，**不作死判据**——D-MI10）。
 *  新代码优先走束 API（批量、一次拿全量）；本面仅为既有单 pid 调用点保面。 */
export function isProcessAlive(pid) {
  if (!pid || isNaN(pid)) return false
  const n = Number(pid)
  try {
    if (process.platform === "win32") {
      const output = execFileSync("tasklist", ["/FO", "CSV", "/FI", `PID eq ${n}`, "/NH"], {
        encoding: "utf8", timeout: SYNC_PROBE_MS, stdio: ["ignore", "pipe", "ignore"],
      })
      return parseTasklistPids(output).has(n)
    }
    process.kill(n, 0)
    return true
  } catch (e) {
    if (e?.code === "ESRCH") return false // 明确不存在
    if (e?.code === "EPERM") return true // 存在但无信号权限
    return undefined // 超时 / 探测失败 ⇒ 未知（不得判死）
  }
}

/**
 * 清理面删除决策（D-MI11——`cleanDeadOwners` 逐条调用）：`ownerState` **薄适配**
 * （三态判据单源——本函数不探测、不复制判据）。
 * - `alive` **三态**（`true` 活 / `false` 死 / `undefined` 未知——**缺省 = 未知**）：
 *   `false` ⇒ `true`（可删，pid 死语义原样）；`true` ⇒ 命令行明确可得且非本产品 ⇒ `true`；
 *   `undefined` / 缺行 ⇒ `false`（**保守保留**——D-MI10）。
 *
 * `cmdline` = 调用面**同一批量**结果的逐条取值（每 pid 一次 exec 已被 D-MI3 / N-MI3 否决）；
 * `pid` 仅作调用面标识（判据只看身份）。 */
export function filterDeadOwners(pid, { alive = undefined, cmdline = undefined } = {}) {
  const n = Number(pid)
  const aliveSet = alive === true ? new Set([n]) : alive === false ? new Set() : null
  const cmds = typeof cmdline === "string" && cmdline.length > 0 ? new Map([[n, cmdline]]) : null
  return ownerState(n, { aliveSet, cmds }) === "dead"
}

// ── 执行面 re-export（拆分件接口——导入面逐字零改：#590①） ──
export { batchAlive, batchAliveAsync, probeCmdlines, probeCmdlinesAsync, _setProcessProbeTestImpl, _resetProcessProbeTestImpl } from "./process-probe-exec.mjs"
