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
 */
import { execFile, execFileSync } from "node:child_process"

const ALIVE_EXEC_TIMEOUT_MS = 10_000
const CMDLINE_EXEC_TIMEOUT_MS = 15_000

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

// 模块级测试注入缝（default null = 生产实现；测试注入 + finally 恢复——见测试文件）
let _testImpl = null

/** 注入测试实现。aliveFn(pids) → Set<pid>|null；cmdlineFn(pids) → Map<pid,cmdline>|null
 *  （两缝均**批量**语义——一次调用拿全量）。返回前值便于测试保存恢复；**未传的槽置 null**（传 `{}` = 两槽同清，等价 reset）。 */
export function _setProcessProbeTestImpl({ aliveFn = undefined, cmdlineFn = undefined } = {}) {
  const prev = _testImpl
  _testImpl = { aliveFn: aliveFn ?? null, cmdlineFn: cmdlineFn ?? null }
  return prev
}

export function _resetProcessProbeTestImpl() {
  _testImpl = null
}

/** pid 清单归一：去重 + 正整数（两探测共用——空清单调用面零 exec）。 */
function uniqPids(pids) {
  return [...new Set(pids.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
}

// ── 输出解析族（同步 / 异步两形态**共用**——单源，防两形态漂移） ─────────────────
/** Windows tasklist CSV（`"name","pid"…`）→ 全量 PID 集合。 */
function parseTasklistPids(out) {
  const alive = new Set()
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^"([^"]*)","(\d+)"/)
    if (m) alive.add(Number(m[2]))
  }
  return alive
}

/** Unix `ps -eo pid=` → 全量 PID 集合。 */
function parsePsPids(out) {
  return new Set(out.split(/\r?\n/).map((l) => Number(l.trim())).filter((n) => Number.isInteger(n)))
}

/** Windows `Get-CimInstance … ConvertTo-Json` → `Map<pid, cmdline>`。 */
function parseCimCmdlines(out) {
  const rows = JSON.parse(out.trim())
  const map = new Map()
  for (const r of Array.isArray(rows) ? rows : [rows]) {
    if (r && Number.isInteger(r.ProcessId) && typeof r.CommandLine === "string") {
      map.set(Number(r.ProcessId), r.CommandLine)
    }
  }
  return map
}

/** Unix `ps -eo pid=,args=` → `Map<pid, cmdline>`。 */
function parsePsArgs(out) {
  const map = new Map()
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(.*)$/)
    if (m) map.set(Number(m[1]), m[2])
  }
  return map
}

/** execFile → Promise<string>（stdout；exec / 超时失败 ⇒ reject——调用面按「探测失败」降级）。 */
function execFileP(cmd, args, timeout) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { encoding: "utf8", timeout, windowsHide: true }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout)
    })
  })
}

/**
 * 批量判活：单次 tasklist（Windows 全量 CSV）/ ps（Unix）拿全量 PID 集合 → 一次 exec
 * 比对（修复 isProcessAlive 每 pid 一次 execSync 的成本——每回合 N 次 = 贵，探索 §4）。
 * 返回存活 pid 的 Set；exec/解析失败 → null（调用方区分"探测失败"与"全死"——只读面按
 * 无活伴降级；域面（peer-domains 死清理）在 null 时不得执行删除——探测失败 ≠ 死）。
 * **纯存在性**：身份判据不在此层（D-MI11——过滤落点在读面 `peerInstances()` 与清理面
 * `filterDeadOwners`；`peer-domains.mjs` 的域残留清理语义保持零变）。
 */
export function batchAlive(pids, { timeoutMs = ALIVE_EXEC_TIMEOUT_MS } = {}) {
  const uniq = uniqPids(pids)
  if (uniq.length === 0) return new Set()
  if (_testImpl?.aliveFn) return _testImpl.aliveFn(uniq)
  try {
    if (process.platform === "win32") {
      const output = execFileSync("tasklist", ["/FO", "CSV", "/NH"], {
        encoding: "utf8", timeout: timeoutMs, stdio: ["ignore", "pipe", "ignore"],
      })
      const alive = parseTasklistPids(output)
      return new Set(uniq.filter((pid) => alive.has(pid)))
    }
    const output = execFileSync("ps", ["-eo", "pid="], {
      encoding: "utf8", timeout: timeoutMs, stdio: ["ignore", "pipe", "ignore"],
    })
    const alive = parsePsPids(output)
    return new Set(uniq.filter((pid) => alive.has(pid)))
  } catch {
    return null // 探测失败（区别于全死）——调用方不得据此执行删除/判死副作用
  }
}

/**
 * 异步对偶（TUI 假死批 · MULTI-INSTANCE-COLLAB §3.1）：与 `batchAlive` 同语义（返回集 / null
 * 降级一致），但 `execFile` + Promise 化——**读面**（每回合的 `peerInstances`）不得用同步 exec
 * 占住事件循环。**同一注入缝** `_setProcessProbeTestImpl`（注入值可能是同步函数——经 await
 * 消费）；**清理面继续用同步版**（会话起点 / 认领路径，非每回合面——D-MI14 登记）。
 */
export async function batchAliveAsync(pids) {
  const uniq = uniqPids(pids)
  if (uniq.length === 0) return new Set()
  if (_testImpl?.aliveFn) return _testImpl.aliveFn(uniq)
  try {
    if (process.platform === "win32") {
      const alive = parseTasklistPids(await execFileP("tasklist", ["/FO", "CSV", "/NH"], ALIVE_EXEC_TIMEOUT_MS))
      return new Set(uniq.filter((pid) => alive.has(pid)))
    }
    const alive = parsePsPids(await execFileP("ps", ["-eo", "pid="], ALIVE_EXEC_TIMEOUT_MS))
    return new Set(uniq.filter((pid) => alive.has(pid)))
  } catch {
    return null // 探测失败（区别于全死）——只读面按「无活伴」降级
  }
}

/**
 * 批量 cmdline 探测（决策③ A——一次 exec 拿全部 pid+cmdline）：返回 Map<pid, cmdline>
 * 或 null（exec 失败/解析失败）。Windows = 一次 Get-CimInstance（PowerShell）；Unix =
 * 一次 ps。仅在 manifest mtime 变化后跑一次（~百 ms 级——设计已接受）；清理面同一批量
 * 结果逐条消费（D-MI3 / N-MI3——不做每 pid 一次 exec）。
 */
export function probeCmdlines(pids, { timeoutMs = CMDLINE_EXEC_TIMEOUT_MS } = {}) {
  const uniq = uniqPids(pids)
  if (uniq.length === 0) return new Map()
  if (_testImpl?.cmdlineFn) return _testImpl.cmdlineFn(uniq)
  try {
    let out
    if (process.platform === "win32") {
      // 一次 Get-CimInstance 拿全表 → node 侧过滤目标 pid（避免 shell 引号注入面）
      out = execFileSync("powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
        { encoding: "utf8", timeout: timeoutMs, stdio: ["ignore", "pipe", "ignore"] })
      return parseCimCmdlines(out)
    }
    out = execFileSync("ps", ["-eo", "pid=,args="], {
      encoding: "utf8", timeout: timeoutMs, stdio: ["ignore", "pipe", "ignore"],
    })
    return parsePsArgs(out)
  } catch {
    return null // 探测失败 → 端字段/身份缺省（调用方降级：保守保留）
  }
}

/** 异步对偶（同 `probeCmdlines` 语义——`execFile` + Promise；同一注入缝；读面在用）。 */
export async function probeCmdlinesAsync(pids) {
  const uniq = uniqPids(pids)
  if (uniq.length === 0) return new Map()
  if (_testImpl?.cmdlineFn) return _testImpl.cmdlineFn(uniq)
  try {
    if (process.platform === "win32") {
      const out = await execFileP("powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command",
          "Get-CimInstance Win32_Process | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],
        CMDLINE_EXEC_TIMEOUT_MS)
      return parseCimCmdlines(out)
    }
    const out = await execFileP("ps", ["-eo", "pid=,args="], CMDLINE_EXEC_TIMEOUT_MS)
    return parsePsArgs(out)
  } catch {
    return null // 探测失败 → 端字段/身份缺省（调用方降级：保守保留）
  }
}

/** 本产品身份判据（单源）：命令行命中 CLI 入口族或 VSC 扩展宿主族 ⇒ 本产品进程。
 *  命令未知（undefined / 空串）⇒ `false`——**调用方须自行区分「未知」与「明确不符」**
 *  （未知 = 保守保留，明确不符 = 剔除/可删；两态判据见 `filterDeadOwners` 与读面落点）。 */
export function isProductProc(cmdline) {
  if (typeof cmdline !== "string" || cmdline.length === 0) return false
  return CLI_ENTRY_RE.test(cmdline) || VSC_END_RE.test(cmdline)
}

/** cmdline → 端标签：扩展宿主标记 → vscode；其余（node/thincoder CLI）→ cli。
 *  命令不可得（探测失败 / 缺行）⇒ `undefined`（端字段缺省——既有降级语义）。 */
export function classifyEnd(cmdline) {
  if (typeof cmdline !== "string" || cmdline.length === 0) return undefined
  return VSC_END_RE.test(cmdline) ? "vscode" : "cli"
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
