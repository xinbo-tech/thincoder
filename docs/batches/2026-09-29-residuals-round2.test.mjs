/**
 * 2026-09-29-residuals-round2.test.mjs — 残余处置第二轮 · 波 1（核面）批次本地件
 * （不进仓套件；复跑 = 仓根 `node --test docs/batches/2026-09-29-residuals-round2.test.mjs`；
 *  落位 = #545 立即形：实施者写 `.thincoder/tmp/` → 父侧 copy 终位）。
 *
 * 腿面：
 * - L1（#585）`notifyKey` 产出回归（win32 平台守卫样本——恒等于落定前形）+ 源码切片 + 消费面逐名在；
 * - L2-A（#586 判官重立 · W8 契约②）端壳静态闭包扫描：现树绿 / 破链夹具红 / 动态 import() 反证；
 * - L2-B（#586）`panel-chat.mjs` 入口守卫同址（源文本断言——保留段判据在册 `VSC-DEBT.md` §12.2.1）；
 * - L4（#590①）双档 ≤300 / 导出面 14 名逐名在场 / 缝跨档 / 调用级烟测 / 消费面加载烟测。
 *
 * L2-A 算法同源 = `.thincoder/tmp/p4ii-w8-scan.mjs`（注释先剥离 ∕ 静态 import 与 export-from
 * 入闭包 ∕ 动态 `import()` 不入闭包 ∕ `vscode` 宿主说明符豁免 ∕ 裸包经 createRequire 解析 ∕
 * 不可解析单列诊断）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, statSync } from "node:fs"
import { dirname, join, resolve, resolve as pathResolve } from "node:path"
import { tmpdir } from "node:os"
import { createRequire } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO = pathResolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (p) => readFileSync(join(REPO, p), "utf8")
const mod = (p) => import(pathToFileURL(join(REPO, p)).href)
const lc = (src) => (src.match(/\n/g) ?? []).length // wc -l 口径（末行终止行数）

// ── L1 · #585 notifyKey（断代重锚 2026-10-04——已随流尾台账行组退役批整删） ─────
const LEDGER = "thincoder-core/ledger.mjs"

test("L1a · #585 notifyKey 已退场（原「产出回归」样本随七符号整删——退场锁）", async () => {
  // 断代注（父侧 · 2026-10-04 · 批 `docs/batches/2026-10-04-stream-ledger-lines-retire.md` §2.10 #5）：
  // 七符号实读无消费 ⇒ 删（含 notifyKey ∥ loadNotifyState ∥ saveNotifyState ∥ NOTIFY_FILE）；
  // 原「产出回归 vs 落定前形」恒等断言随之退场——本腿改退场锁；`legacyNotifyKey` 基准助手同删。
  const m = await mod(LEDGER)
  assert.equal("notifyKey" in m, false, "notifyKey 已退场（零导出）")
  assert.equal("loadNotifyState" in m, false, "loadNotifyState 已退场（零导出）")
  assert.equal("saveNotifyState" in m, false, "saveNotifyState 已退场（零导出）")
})

test("L1b · #585 单源切片（ledger.mjs 内联盘符归一零命中——notify 面已退场）", () => {
  const src = read(LEDGER)
  assert.equal(src.includes("^([a-z]):"), false, "内联盘符正则有残留")
  assert.equal(src.includes("normalizeCwd"), false, "normalizeCwd 引用已随 notify 面退场（断代重锚 2026-10-04）")
})

test("L1c · #585 消费面零改（ledger.mjs 导出面逐名在——断代重锚 2026-10-04：七符号出基线）", async () => {
  const m = await mod(LEDGER)
  const base = [
    "AGING_DAYS", "ALLOWED_MIGRATIONS", "EMPTY_FAMILY_LINE", "MAX_SIBLING_SCAN", "PENDING_STATUSES",
    "REFRESH_MS", "THRESHOLD_BOARD", "THRESHOLD_POOL", "_resetLedgerDirForTest", "_setExecutorProbeTtlForTest",
    "_setLedgerDirForTest", "buildScan", "detailScans", "discoverFamily", "ensureExecutorColumn", "entryTitle",
    "executorTail", "findProject", "formatDetailLine", "formatMarker",
    "ledgerAdd", "ledgerAddTool", "ledgerClose", "ledgerCloseTool", "ledgerCount", "ledgerCountTool", "ledgerDbPath",
    "ledgerDirPath", "ledgerKey", "ledgerQuery", "ledgerQueryTool", "ledgerUpdate", "ledgerUpdateTool",
    "normalizeEntry", "openLedger", "resolveExecutorStates",
    "runLedgerAudit", "runLedgerMigrate",
  ]
  const missing = base.filter((n) => !(n in m))
  assert.deepEqual(missing, [], `导出面缺名: ${missing.join(", ")}`)
  const gone = ["NOTIFY_FILE", "formatAgingLine", "formatThresholdLine", "loadNotifyState", "notifyKey", "planChangeLines", "saveNotifyState"]
  assert.deepEqual(gone.filter((n) => n in m), [], "七符号退场锁（深清后零导出——断代重锚 2026-10-04）")
})

// ── L2-A · #586 判官重立（W8 契约② 端壳静态闭包扫描） ────────────────────────────
/** 静态 import / export-from 说明符提取（块注释先剥离；行注释只剥「非冒号前缀」形态）。 */
function staticSpecs(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, "")
  const text = noBlock.split("\n").map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n")
  const specs = []
  for (const m of text.matchAll(/^[ \t]*(?:import|export)\s+(?:(?![;=])[\s\S])*?\bfrom\s*["']([^"']+)["']/gm)) specs.push(m[1])
  for (const m of text.matchAll(/^[ \t]*import\s*["']([^"']+)["']/gm)) specs.push(m[1])
  return specs
}

/** 闭包扫描：{ files, builtins, sqliteFiles, unresolved }——动态 `import()` 不入闭包。 */
function scanClosure(entries) {
  const seen = new Set()
  const builtins = new Set()
  const sqliteFiles = []
  const unresolved = []
  const stack = [...entries]
  while (stack.length) {
    const file = stack.pop()
    if (seen.has(file)) continue
    if (!existsSync(file) || !statSync(file).isFile()) { unresolved.push(`${file} (missing/dir)`); continue }
    seen.add(file)
    let src
    try { src = readFileSync(file, "utf8") } catch { continue }
    for (const spec of staticSpecs(src)) {
      if (spec.startsWith("node:")) { builtins.add(spec); if (spec === "node:sqlite") sqliteFiles.push(file); continue }
      if (spec === "vscode") continue // 宿主模块
      let resolved = null
      if (spec.startsWith(".")) {
        const base = pathResolve(dirname(file), spec)
        for (const c of [base, `${base}.mjs`, `${base}.js`, pathResolve(base, "index.mjs")]) {
          if (existsSync(c) && statSync(c).isFile()) { resolved = c; break }
        }
      } else {
        try { resolved = createRequire(file).resolve(spec) } catch { /* unresolved */ }
      }
      if (!resolved) { unresolved.push(`${file} → ${spec}`); continue }
      if (!existsSync(resolved) || !statSync(resolved).isFile()) { unresolved.push(`${file} → ${spec} (dir)`); continue }
      stack.push(resolved)
    }
  }
  return { files: [...seen], builtins: [...builtins], sqliteFiles, unresolved }
}

test("L2-A① · W8 契约② 现树绿（自 extension.mjs 闭包零 node:sqlite ∕ unresolved 空）", () => {
  const r = scanClosure([join(REPO, "thincoder-vscode/extension.mjs")])
  assert.ok(r.files.length > 100, `闭包规模异常: ${r.files.length}`)
  assert.deepEqual(r.unresolved, [], "不可解析说明符非空")
  assert.deepEqual(r.sqliteFiles, [], `闭包内 node:sqlite 命中: ${r.sqliteFiles.join(", ")}`)
  // #590① 新增 exec 边在闭包内且清洁（拆分后两档同证）
  const rel = r.files.map((f) => f.replace(/\\/g, "/"))
  assert.ok(rel.some((f) => f.endsWith("thincoder-core/process-probe.mjs")), "process-probe.mjs 不在端壳闭包")
  assert.ok(rel.some((f) => f.endsWith("thincoder-core/process-probe-exec.mjs")), "process-probe-exec.mjs 不在端壳闭包")
  const execOwn = scanClosure([join(REPO, "thincoder-core/process-probe-exec.mjs")])
  assert.deepEqual(execOwn.sqliteFiles, [], "exec 单档闭包内 node:sqlite 命中")
})

test("L2-A② · 破链夹具红（entry→mid→静态 import node:sqlite ⇒ 必检出）", () => {
  const dir = mkdtempSync(join(tmpdir(), "residuals-r2-w8-red-"))
  try {
    writeFileSync(join(dir, "entry.mjs"), 'import { m } from "./mid.mjs"\nexport const x = m\n')
    writeFileSync(join(dir, "mid.mjs"), 'import { DatabaseSync } from "node:sqlite"\nexport const m = DatabaseSync\n')
    const r = scanClosure([join(dir, "entry.mjs")])
    assert.equal(r.sqliteFiles.length, 1, "破链夹具未检出 node:sqlite")
    assert.ok(r.sqliteFiles[0].endsWith("mid.mjs"), `检出落点异常: ${r.sqliteFiles[0]}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("L2-A③ · 动态 import() 反证腿（不入闭包 ⇒ 绿——防判据过宽）", () => {
  const dir = mkdtempSync(join(tmpdir(), "residuals-r2-w8-green-"))
  try {
    writeFileSync(join(dir, "entry.mjs"), 'import { m } from "./mid.mjs"\nexport const x = m\n')
    writeFileSync(join(dir, "mid.mjs"),
      'export async function m() {\n  const { DatabaseSync } = await import("node:sqlite")\n  return DatabaseSync\n}\n')
    const r = scanClosure([join(dir, "entry.mjs")])
    assert.deepEqual(r.sqliteFiles, [], "动态 import() 被误判入闭包")
    assert.equal(r.builtins.includes("node:sqlite"), false, "动态 import() 被误判入 builtins")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── L2-B · #586 panel-chat.mjs 入口守卫同址（源文本断言） ─────────────────────────
test("L2-B · 入口守卫同址（ensurePanelAgent(panel, turnSlot) 调用之后同档出现 ensureMemoryHandle()）", () => {
  const src = read("thincoder-vscode/src/extension/panel-chat.mjs")
  // 锚点取**调用形**：`export function ensurePanelAgent(panel, turnSlot) {`（声明行）亦含该字面——
  // 判据守的 = 调用两行同档同址不得迁出（声明留档 ∕ 调用迁出时须仍红）。
  let at = -1
  for (let i = src.indexOf("ensurePanelAgent(panel, turnSlot)"); i >= 0; i = src.indexOf("ensurePanelAgent(panel, turnSlot)", i + 1)) {
    const e = src.indexOf("\n", i)
    const line = src.slice(src.lastIndexOf("\n", i) + 1, e < 0 ? src.length : e)
    if (!line.includes("function")) { at = i; break }
  }
  assert.ok(at >= 0, "ensurePanelAgent(panel, turnSlot) 调用形未命中")
  const after = src.indexOf("ensureMemoryHandle()", at)
  assert.ok(after > at, "ensureMemoryHandle() 未在 ensurePanelAgent(panel, turnSlot) 调用之后同档出现")
})

// ── L4 · #590① process-probe 拆分 ────────────────────────────────────────────────
const PROBE = "thincoder-core/process-probe.mjs"
const PROBE_EXEC = "thincoder-core/process-probe-exec.mjs"
const MAIN_NAMES = [
  "SYNC_PROBE_MS", "_setProcessProbeTestImpl", "_resetProcessProbeTestImpl",
  "batchAlive", "batchAliveAsync", "probeCmdlines", "probeCmdlinesAsync",
  "isProductProc", "classifyEnd", "ownerState", "probeOwnersSync", "probeOwnersAsync",
  "isProcessAlive", "filterDeadOwners",
]

test("L4a · #590① 双档 ≤300（wc -l 口径）", () => {
  const mainN = lc(read(PROBE))
  const execN = lc(read(PROBE_EXEC))
  assert.ok(mainN > 0 && mainN <= 300, `主档行数越限: ${mainN}`)
  assert.ok(execN > 0 && execN <= 300, `exec 档行数越限: ${execN}`)
})

test("L4bc · #590① 双档可加载 + 导出面 14 名逐名在场 + re-export 同值", async () => {
  const main = await mod(PROBE)
  const exec = await mod(PROBE_EXEC)
  const missing = MAIN_NAMES.filter((n) => !(n in main))
  assert.deepEqual(missing, [], `主档导出面缺名: ${missing.join(", ")}`)
  for (const n of ["batchAlive", "batchAliveAsync", "probeCmdlines", "probeCmdlinesAsync", "_setProcessProbeTestImpl", "_resetProcessProbeTestImpl"]) {
    assert.equal(main[n], exec[n], `re-export 非同值: ${n}`)
  }
})

test("L4d/g · #590① 缝跨档（_setProcessProbeTestImpl ⇒ batchAlive 注入集）+ 束调用级烟测不抛", async () => {
  const main = await mod(PROBE)
  // 两缝同注（g 腿经 cmdline 支取缝；免机器相关真实 exec——判据面不变：束返回不抛 + 取缝）
  main._setProcessProbeTestImpl({ aliveFn: (pids) => new Set(pids), cmdlineFn: () => new Map() })
  try {
    assert.deepEqual([...main.batchAlive([1, 2])].sort((a, b) => a - b), [1, 2], "缝跨档失效（main → exec）")
    const sync = main.probeOwnersSync([1]) // 证 uniqPids 取回链齐（缺名即 ReferenceError）
    assert.ok(sync.aliveSet instanceof Set && sync.aliveSet.has(1), "同步束未取缝 / 抛错")
    const asy = await main.probeOwnersAsync([1])
    assert.ok(asy.aliveSet instanceof Set && asy.aliveSet.has(1), "异步束未取缝 / 抛错")
  } finally {
    main._resetProcessProbeTestImpl()
  }
})

test("L4e · #590① 消费面加载烟测（核七档 + VSC session-io）", async () => {
  const files = [
    "thincoder-core/ledger-executors.mjs", "thincoder-core/peer-instances.mjs", "thincoder-core/session-gc.mjs",
    "thincoder-core/session-lifecycle.mjs", "thincoder-core/session-slot-claims.mjs", "thincoder-core/session-slots.mjs",
    "thincoder-core/session-stale.mjs", "thincoder-vscode/src/extension/session-io.mjs",
  ]
  for (const f of files) {
    const m = await mod(f)
    assert.ok(m && Object.keys(m).length > 0, `加载面异常: ${f}`)
  }
})

test("L4f · #590① isProcessAlive 调用级烟测（win32 真路证 execFileSync 符号链）", async () => {
  const main = await mod(PROBE)
  if (process.platform === "win32") {
    assert.equal(main.isProcessAlive(process.pid), true, "本进程判活应为 true")
  } else {
    assert.doesNotThrow(() => main.isProcessAlive(process.pid))
  }
})
