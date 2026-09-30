/**
 * process-probe-exec.mjs — 探测执行面（#590① 自 `process-probe.mjs` 外提——CORE-UNIFICATION
 * 行 10 预案兑现；语义逐字零变）。
 *
 * 归本档：双超时常量（`ALIVE_EXEC_TIMEOUT_MS` / `CMDLINE_EXEC_TIMEOUT_MS`）· 模块级测试注入缝
 * （`_testImpl` + 两 setter——唯一读取点 = 本档四批量函数，同档免回引 / 免环）· `uniqPids` ·
 * 输出解析族 · `execFileP` · 四批量探测函数（`batchAlive` / `batchAliveAsync` / `probeCmdlines` /
 * `probeCmdlinesAsync`）。
 * 留 `process-probe.mjs`：身份判据 · 三态判据 · 束 API · 单 pid 兼容面 · 清理面适配——该档对
 * 四批量名与缝名 **import + re-export**（导入面逐字零改；`isProcessAlive` 经 import 取用本档
 * `parseTasklistPids`，并自持 `execFileSync` import——win32 分支直调，不设转口）。
 *
 * 成本纪律与两形态语义（同步 / 异步共用同一解析族与同一注入缝）= `process-probe.mjs` 头注
 * （单源——本档不重述）。
 */
import { execFile, execFileSync } from "node:child_process"

const ALIVE_EXEC_TIMEOUT_MS = 10_000
const CMDLINE_EXEC_TIMEOUT_MS = 15_000

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
export function uniqPids(pids) {
  return [...new Set(pids.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
}

// ── 输出解析族（同步 / 异步两形态**共用**——单源，防两形态漂移） ─────────────────
/** Windows tasklist CSV（`"name","pid"…`）→ 全量 PID 集合。 */
export function parseTasklistPids(out) {
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
