/**
 * ledger-read.mjs — 只读数据接口（read-data-interface 批 · 设计档
 * `docs/cli/design/READ-DATA-INTERFACE.md` §2.1 / §2.3 / §2.4 / §2.7 · 台账 #886 ∥ #887）。
 *
 * 面：① `ledgerExport({ cwd, family, full })` —— CLI `ledger list --json` ∥ ACP `ledger/list`
 * 两出口共用的**统一序列化单源**（N1：零 SQL 复刻、零表名泄漏——行集直用核 `ledgerQuery`）；
 * ② `runLedgerList(args, opts)` —— CLI 命令 runner（严格解析 · fail-closed——§2.7 / §3.1）。
 *
 * 载荷（§3.2 冻结形）：`{ projects: [{ root, name, schemaVersion, rows }] }`；行 = `id` + 12 数据列
 * （列集单源 = `DATA_COLUMNS`——D-10 直引，不另立副本；`evidence` 仅 full 入行）；缺列（旧库）按
 * null 归一；`schemaVersion` = 库 `PRAGMA user_version` 如实回读（旧库未标 = 0）；库不在 / 非台账库
 * ⇒ 项目不出项（空集）。
 * 范围（§2.4）：单范围 = 解析后项目根一项（`resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")`——与库键
 * 同源）；`--family` = `discoverFamily` 发现序逐项（不可读跳过——既有语义）。
 *
 * W8 契约②：本档静态入 `ledger-db.mjs`（node:sqlite）⇒ 消费侧一律**动态 import** 本档。
 * D-11：`ledger.mjs` 零编辑——族发现只 import `discoverFamily`。
 */
import { basename, resolve } from "node:path"

import { ledgerQuery } from "./ledger-cmd.mjs"
import { discoverFamily } from "./ledger.mjs"
import { DATA_COLUMNS } from "./ledger-migrate.mjs"
import { resolveProjectRoot } from "./manifest.mjs"
import { openLedger } from "./ledger-db.mjs"

/** 行出形（§3.2）：`id` + 数据列序（`evidence` 仅 full）；缺列按 null 归一。 */
function exportRow(r, full) {
  const row = { id: Number(r.id) }
  for (const c of DATA_COLUMNS) {
    if (c === "evidence" && !full) continue
    row[c] = r[c] ?? null
  }
  return row
}

/** 单项目读（**两开均只读态**——版本探针开 + 行集开，§2.3）：库不在 / 非台账库 ⇒ null（项目不出项）。
 *  不可读（坏档）⇒ 抛（单范围 = 读错转 exit 1；族范围 = 调用侧捕获跳过）。 */
function readProject(root, full) {
  const probe = openLedger(root, { readOnly: true })
  if (!probe) return null
  let schemaVersion
  try { schemaVersion = Number(probe.prepare("PRAGMA user_version").get().user_version ?? 0) } finally { probe.close() }
  const rows = ledgerQuery({ cwd: root })
  return { root, name: basename(root), schemaVersion, rows: rows.map((r) => exportRow(r, full)) }
}

/** 统一序列化单源（N1——两出口共用；载荷 = §3.2 冻结形）。
 *  单范围 = 当前项目一项；`family=true` = 族内发现序逐项（不可读跳过——余者照常）。 */
export function ledgerExport({ cwd, family = false, full = false } = {}) {
  const anchor = cwd ?? process.cwd()
  if (!family) {
    const root = resolveProjectRoot(anchor) ?? resolve(anchor)
    const item = readProject(root, full)
    return { projects: item ? [item] : [] }
  }
  const projects = []
  for (const p of discoverFamily(anchor).projects) {
    try { const item = readProject(p.root, full); if (item) projects.push(item) } catch { /* 不可读跳过 */ }
  }
  return { projects }
}

/** CLI 命令 usage（冻结形——§3.1；解析错入 stderr）。 */
const LIST_USAGE = "Usage: thincoder ledger list --json [--full] [--family] [--cwd <dir>]"

/** CLI runner（§2.7）：严格解析——未知参 / 缺 `--json` / `--cwd` 缺值 ⇒ usage + exit 1（fail-closed，
 *  与同族 migrate / audit 宽松面刻意不同）；`--cwd` 空格形（同族先例）。成功 = stdout 单段 JSON
 *  （零杂行）+ exit 0（含空集）；解析类 / 读错 ⇒ stderr 一行消息（零栈泄）+ exit 1。 */
export function runLedgerList(args, { cwd = process.cwd(), out = console.log, err = console.error } = {}) {
  const argv = Array.isArray(args) ? args : []
  let json = false, full = false, family = false, dir = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--json") json = true
    else if (a === "--full") full = true
    else if (a === "--family") family = true
    else if (a === "--cwd") {
      const v = argv[i + 1]
      if (v === undefined || v.startsWith("--")) { err(LIST_USAGE); return 1 }
      dir = String(v)
      i++
    } else { err(LIST_USAGE); return 1 }
  }
  if (!json) { err(LIST_USAGE); return 1 }
  try {
    out(JSON.stringify(ledgerExport({ cwd: dir ?? cwd, family, full })))
    return 0
  } catch (e) {
    // 错误面「一行消息、零栈泄」（§3.1）：多行诊断（如歧义锚候选清单）折叠单行——内容零丢。
    err(String(e?.message ?? e).replace(/\s*\r?\n\s*/g, " "))
    return 1
  }
}
