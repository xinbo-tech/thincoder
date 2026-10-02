// 2026-10-01-core-split-line.probe.mjs — core 四档拆十档（#755 ∥ #786）导出面探针（批内件 · 留档）。
// 两模式（仓根跑）：
//   node docs/batches/2026-10-01-core-split-line.probe.mjs snapshot
//     → 写 docs/batches/2026-10-01-core-split-line.probe-baseline.json（**改前**基线，批内件留档）
//   node docs/batches/2026-10-01-core-split-line.probe.mjs check
//     → 同法复读四档 → 与基线逐档逐名逐值对拍；差异清单打印（空 = pass）；有差异 exit 1
// 收集口径（批档 §2 五.1）：逐档 = { names: 导出名集（排序）∥ fns: 每函数导出 String(fn) ∥ vals: 每值导出 JSON }。
// 转口面（context 三组 ∥ conventions 四名 ∥ code-sync 五名 ∥ docs 一名）随命名空间等同检查——缺名即红。
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..")
const BASELINE = join(HERE, "2026-10-01-core-split-line.probe-baseline.json")

/** 四档 = 本批全部射程（只认原档入口——转口可达即计同一）。 */
const MODULES = [
  "thincoder-core/context.mjs",
  "thincoder-core/conventions.mjs",
  "thincoder-core/memory/code-sync.mjs",
  "thincoder-core/memory/docs.mjs",
]

async function collect() {
  const out = {}
  for (const rel of MODULES) {
    const ns = await import(pathToFileURL(join(REPO, rel)).href)
    const names = Object.keys(ns).sort()
    const fns = {}, vals = {}
    for (const n of names) {
      if (typeof ns[n] === "function") fns[n] = String(ns[n])
      else vals[n] = JSON.stringify(ns[n] ?? null)
    }
    out[rel] = { names, fns, vals }
  }
  return out
}

const mode = process.argv[2]
if (mode === "snapshot") {
  const snap = { capturedAt: new Date().toISOString(), modules: await collect() }
  writeFileSync(BASELINE, JSON.stringify(snap, null, 2))
  for (const [rel, m] of Object.entries(snap.modules)) console.log(`snapshot  ${rel.padEnd(36)} names=${m.names.length}  [${m.names.join(", ")}]`)
  console.log(`snapshot → ${BASELINE}`)
} else if (mode === "check") {
  const base = JSON.parse(readFileSync(BASELINE, "utf8")).modules
  const now = await collect()
  let diffs = 0
  for (const rel of MODULES) {
    const a = base[rel], b = now[rel]
    if (!a) { console.log(`✗ ${rel}: 基线缺档`); diffs++; continue }
    if (a.names.join(",") !== b.names.join(",")) {
      console.log(`✗ ${rel}: 导出名集不同\n   基线 = [${a.names.join(", ")}]\n   现在 = [${b.names.join(", ")}]`)
      diffs++
      continue
    }
    const bad = []
    for (const n of b.names) {
      if (a.fns[n] !== undefined || b.fns[n] !== undefined) {
        if (a.fns[n] !== b.fns[n]) bad.push(`fn ${n}: String(fn) 不等`)
      } else if (a.vals[n] !== b.vals[n]) {
        bad.push(`val ${n}: JSON 值不等`)
      }
    }
    if (bad.length) { console.log(`✗ ${rel}:`); for (const l of bad) console.log(`   ${l}`); diffs += bad.length }
    else console.log(`✓ ${rel}  ${b.names.length} 名逐名逐值同一`)
  }
  console.log(diffs === 0 ? "OK(core-split-probe): 四档导出面逐名逐值同一" : `FAIL(core-split-probe): ${diffs} 处差异`)
  process.exit(diffs === 0 ? 0 : 1)
} else {
  console.log("usage: snapshot | check")
  process.exit(2)
}
