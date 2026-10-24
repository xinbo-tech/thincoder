/**
 * doc-check/version.mjs — 引擎版本一致性的**单源**（纯函数 + 常量；两个消费面共用一个判据）。
 *
 * 权威规格 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「引擎版本一致」（判据 / 比较 / 裁定 / 保守方向；
 * 本档只实现，不重述口径）。消费面两处：工具面 `agent-tools/doc-check.mjs` 的 gate 分支（转口导出、
 * 导出面不变）∥ 结构门 `agent-tools/batch-gate.mjs`（batch 两机械点）——两处不得各持一份清单。
 *
 * 问题形态：`thincoder-core/doc-check/**` 是 ESM，进程启动时加载即缓存；引擎档在启动后被改写 ⇒
 * 本会话仍跑旧模块 ⇒ 假阳（旧误报消不掉）/ 假绿（引擎变严时旧版放过）。故 gate 在跑判据前先判版本。
 *
 * `ENGINE_FILES` 六档 = 判据面：三判据档 + 本档（版本函数单源，自身入清单 = fail-closed）+ 工具面 +
 * 描述档。路径按本档 `import.meta.url` 解析到产品核根，**不随 target 变**。
 */
import { statSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** 产品核根（版本清单基线——本档住 `doc-check/`，上跳一级）。 */
const CORE_ROOT = fileURLToPath(new URL("..", import.meta.url))

/**
 * 是否位于 asar 归档内（路径含 `.asar` 段）。
 *
 * 归档在进程生命周期内不可改：Electron 对归档内条目返回的 `mtime` 是**挂载时刻**，
 * 不是「档什么时候被写过」。拿它跟进程启动比，结果恒为「旧于启动之后」⇒ 闸永不放行。
 * 所以归档内的档不参与 mtime 判据——判据防的「加载后被改写」在归档里不可能发生。
 * @param {string} path 绝对路径
 * @returns {boolean}
 */
export function isInsideArchive(path) {
  return /(^|[\\/])[^\\/]+\.asar([\\/]|$)/i.test(String(path))
}

/** 引擎六档 = 版本一致性的判据面（§3.20「引擎版本一致」· 判据）。 */
export const ENGINE_FILES = [
  "doc-check/index.mjs",
  "doc-check/anchors.mjs",
  "doc-check/width.mjs",
  "doc-check/version.mjs",
  "agent-tools/doc-check.mjs",
  "tool-docs/doc_check.md",
]

/**
 * 引擎版本一致性（纯函数——时钟 ∥ stat 可注 ⇒ 可测，不碰产品档 mtime）：
 * 逐档 `mtimeMs` 与**本进程启动时刻**（`nowMs − uptimeSec × 1000`）比较——晚于启动 ⇒ 该档可能晚于模块加载 ⇒ stale。
 * 不可 `stat` 的档同样入 stale（fail-closed，不静默忽略）。`mtime ≤ 启动` 一定不比缓存新；
 * `mtime > 启动` 只是**可能**晚于加载 —— 取 fail-closed 方向（误判代价 = 一次会话重启）。
 * @param {{nowMs?:number, uptimeSec?:number, stat?:Function}} [o] 注入缝（缺省 = 真时钟 / 真 `statSync`）
 * @returns {{startMs:number, stale:{file:string, mtimeMs:number|null}[]}} `file` = 相对 `thincoder-core/` 的正斜杠路径
 */
export function staleEngineFiles({ nowMs = Date.now(), uptimeSec = process.uptime(), stat = statSync } = {}) {
  const startMs = nowMs - uptimeSec * 1000
  const stale = []
  for (const file of ENGINE_FILES) {
    let mtimeMs = null
    try { mtimeMs = stat(resolve(CORE_ROOT, file)).mtimeMs } catch { stale.push({ file, mtimeMs: null }); continue }
    if (typeof mtimeMs !== "number" || !Number.isFinite(mtimeMs)) { stale.push({ file, mtimeMs: null }); continue }
    if (isInsideArchive(resolve(CORE_ROOT, file))) continue // 归档内：mtime 是挂载时刻，不携带「是否更新过」
    if (mtimeMs > startMs) stale.push({ file, mtimeMs })
  }
  return { startMs, stale }
}

/** stale 列表形（`<文件> mtime <ISO 8601>`，`；` 连列）——gate ERROR 行 ∥ report 注记行共用一处格式。 */
function staleParts(stale) {
  const when = (t) => new Date(t).toISOString()
  return stale.map((s) => `${s.file} mtime ${s.mtimeMs === null ? "不可读（stat 失败）" : when(s.mtimeMs)}`)
}

/** 引擎版本 ERROR 报面（固定句形）：多档 stale ⇒ 逐档 `<文件> mtime <时间>` 以 `；` 连列——**不产 PASS**。 */
export function gateEngineError({ startMs, stale }) {
  const when = (t) => new Date(t).toISOString()
  return [
    `DOC-CHECK GATE: ERROR（引擎已更新（${staleParts(stale).join("；")} > 进程启动 ${when(startMs)}），请重启会话后复跑）`,
    "原因：本会话进程加载的引擎模块早于盘上引擎档——旧引擎读数不可信（假阳：旧误报消不掉 ∥ 假绿：引擎变严时旧版放过）",
    "处置：重启会话后复跑 gate（`report` 不裁定、不产 verdict（陈旧时只在首行前加注记））",
  ].join("\n")
}

/** 报告态引擎陈旧注记（纯函数）：stale 空 ⇒ `null`；非空 ⇒ 一行注记（逐字单源 = `DOC-DISCIPLINE.md`
 *  §3.20「gate 裁定 · report 注记」——多档以 `；` 连列，与 `gateEngineError` 同形）。 */
export function reportEngineNote({ startMs, stale } = {}) {
  if (!Array.isArray(stale) || stale.length === 0) return null
  const when = (t) => new Date(t).toISOString()
  return `[doc_check note] 引擎陈旧（${staleParts(stale).join("；")} > 进程启动 ${when(startMs)}）——本次读数由会话启动时加载的旧引擎产出，不可作为交付判据；重启会话后复跑。`
}

/** 报面 + 注记：有注记 ⇒ 注记行 + 原报面；无 ⇒ 原报面逐字返回（三不改：既有行 ∥ verdict ∥ PASS 语义）。 */
export function withEngineNote(report, version) {
  const note = reportEngineNote(version ?? {})
  return note ? `${note}\n${report}` : report
}

/** 报面首行取形（唯一机判串 = 首行 `DOC-CHECK GATE:` 前缀——消费面共用一个取法，不各自 split）。 */
export function firstVerdictLine(report) {
  return String(report ?? "").split("\n")[0] ?? ""
}
