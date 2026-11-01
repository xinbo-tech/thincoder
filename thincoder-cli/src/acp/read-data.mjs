/**
 * read-data.mjs — ACP read-only data interfaces (READ-DATA-INTERFACE.md §2.6 / §3.3 / §3.4):
 * `ledger/list` · `ledger/count` · `batch/list` + change notifications
 * (`ledger/changed` / `batch/changed`, params `{ cwd }` — 信号面，数据经拉取方法取).
 *
 * 核模块一律**动态 import**（W8 契约②——台账链静态入 node:sqlite；且装载期零开销）。
 * 观察器 = 5s 指纹轮询（注入面 `intervalMs`；测试直驱 `watcher.check()`——零定时器依赖）：
 * 观察域 = 服务进程 cwd（每轮 `ctx.getCwd()` 求值——与 `params.cwd` 缺省同取值；非观察项目不通知）；
 * 首查立基线（静默）；此后差分 ⇒ 对应通知；`start()` 挂 unref 定时器（先例 = 核 ledger-surface.mjs）。
 * 凭据门 = `ctx.requireConfigured`（与既有四族同门——D-8；只读性不改通道门）。
 */
import { statSync } from "node:fs"

import { ACP_ERRORS } from "./transport.mjs"

/** 观察周期（D-7——5s；注入面 = `createReadDataHandlers(ctx, { intervalMs })`）。 */
export const WATCH_INTERVAL_MS = 5000

/** 核模块惰性装载（单次——W8 契约②：消费侧动态 import）。 */
let corePromise = null
function core() {
  corePromise ??= Promise.all([
    import("@thincoder/core/ledger-read.mjs"),
    import("@thincoder/core/ledger-cmd.mjs"),
    import("@thincoder/core/ledger-db.mjs"),
    import("@thincoder/core/agent-tools/batch-read.mjs"),
  ]).then(([ledgerRead, ledgerCmd, ledgerDb, batchRead]) => ({ ledgerRead, ledgerCmd, ledgerDb, batchRead }))
  return corePromise
}

const badParams = (message) => ({ error: { ...ACP_ERRORS.INVALID_PARAMS, message } })

/** `params.cwd` → 取值（缺省 = 服务进程 cwd，`ctx.getCwd()`）；非字符串 ⇒ 错误对象。 */
function resolveCwd(params, ctx) {
  const cwd = params?.cwd
  if (cwd === undefined) return { cwd: ctx.getCwd() }
  if (typeof cwd !== "string") return { error: badParams(`cwd must be a string (got ${typeof cwd})`) }
  return { cwd }
}

/** 指纹（台账库单档 / 批次档逐档）——`exists:mtimeMs:size`；缺失 ⇒ `0`。 */
function fileSig(file) {
  try { const st = statSync(file); return `1:${st.mtimeMs}:${st.size}` } catch { return "0" }
}

/**
 * Build the read-data handlers + the change watcher. Shared state arrives via the single
 * `ctx` (§3.5); `intervalMs` is the injection face for the watch period.
 * @returns {{ handlers: Record<string, (params: object) => Promise<object>>,
 *             watcher: { check: () => Promise<string[]>, start: () => void, stop: () => void } }}
 */
export function createReadDataHandlers(ctx, { intervalMs = WATCH_INTERVAL_MS } = {}) {
  const { requireConfigured } = ctx

  const handlers = {
    "ledger/list": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const c = resolveCwd(params, ctx)
      if (c.error) return c.error
      for (const f of ["family", "full"]) {
        if (params?.[f] !== undefined && typeof params[f] !== "boolean") return badParams(`${f} must be a boolean (got ${typeof params[f]})`)
      }
      const { ledgerRead } = await core()
      try {
        return ledgerRead.ledgerExport({ cwd: c.cwd, family: params?.family === true, full: params?.full === true })
      } catch (e) { return badParams(e?.message ?? String(e)) }
    },

    "ledger/count": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const c = resolveCwd(params, ctx)
      if (c.error) return c.error
      const { ledgerCmd } = await core()
      // `ledgerCount` 出参 = 对象形 `{ count, overdue, evidenceTooLong }`（设计档 §7.1）——直传核对象，零包装
      try { return ledgerCmd.ledgerCount({ cwd: c.cwd, boundary: c.cwd }) } catch (e) { return badParams(e?.message ?? String(e)) } // 界 = 调用方指名的 cwd（同 :66；见 docs/core/design/LEDGER.md §3.8「三面三界」）
    },

    "batch/list": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const c = resolveCwd(params, ctx)
      if (c.error) return c.error
      const { batchRead } = await core()
      try { return batchRead.listBatchRecords({ cwd: c.cwd }) } catch (e) { return badParams(e?.message ?? String(e)) }
    },
  }

  // ── 变更观察器（轮询指纹；起停 = runAcpServer 启、进程终灭）─────────────────
  let last = null
  let timer = null
  let inflight = false // 重叠防衛（先例 = 核 ledger-surface.mjs）：上一拍未落定 ⇒ 跳过本拍
  let lastError = null // 上次失败比较键（同因连续 ⇒ 不重复；`check()` resolve 当拍复位）

  async function check() {
    if (inflight) return []
    inflight = true
    try {
      const cwd = ctx.getCwd()
      const { ledgerDb, batchRead } = await core()
      // 观察域根 = 判据单源 `resolveLedgerRoot`（与写入面同源）：根 ⇒ 其键控库指纹；无根 ⇒ 该域无台账库、
      // 指纹恒 "0"（观察域照常上报——键控库在盘 / 变动即报 `ledger/changed`）。
      const root = ledgerDb.resolveLedgerRoot(cwd, cwd)?.root
      const ledgerSig = root ? fileSig(ledgerDb.ledgerDbPath(root, root)) : "0"
      const batchSig = batchRead.listBatchRecords({ cwd }).batches.map((b) => `${b.path}:${fileSig(b.path)}`).join("|")
      if (!last || last.cwd !== cwd) { last = { cwd, ledgerSig, batchSig }; return [] } // 首查 / 观察域切换 ⇒ 立基线（静默）
      const fired = []
      if (ledgerSig !== last.ledgerSig) fired.push("ledger/changed")
      if (batchSig !== last.batchSig) fired.push("batch/changed")
      last = { cwd, ledgerSig, batchSig }
      for (const method of fired) ctx.notifyRef.current(method, { cwd })
      return fired
    } finally { inflight = false }
  }

  /** 拍包装（失败可见——同因不刷屏）：`check()` reject ⇒ 比较键（`code` 优先、无则 `message`、再无则 `String(e)`）；
   *  与上次同键 ⇒ 不重复，异键 ⇒ 记键 + `ctx.log` 一行（`acp.mjs` 注入口 = stderr——协议面零触）；resolve ⇒ 复位。 */
  function runCheck() {
    return check().then(
      () => { lastError = null },
      (e) => {
        const key = String(e?.code ?? e?.message ?? e)
        if (key === lastError) return
        lastError = key
        ctx.log?.("[acp] read-data watcher check failed:", key)
      },
    )
  }

  /** 启动：立即首查（立基线——静默）+ 周期轮询；unref 定时器（不阻塞进程退出）。 */
  function start() {
    if (timer) return
    void runCheck()
    timer = setInterval(() => { void runCheck() }, intervalMs)
    timer.unref?.()
  }

  /** 停表（进程终灭即止的显式面——测试 / 收尾用）。 */
  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  return { handlers, watcher: { check, start, stop } }
}
