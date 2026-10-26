/**
 * compare.mjs — read two reports side by side.
 *
 * This file is the only place where "not comparable" can actually happen: a single-run report
 * has nothing to compare against, so the rule needs a real entry point. When the fixture version,
 * a scenario version or the master digest differs, the two runs measured different text (or a
 * different fixture) — the section says so and shows no difference at all.
 *
 * Usage: node prompt-fixture/compare.mjs <a.json> <b.json>
 */

import { readFileSync } from "node:fs"
import { basename } from "node:path"
import { pathToFileURL } from "node:url"
import { fisherExact, newcombe } from "./stats.mjs"

/** Strip the readings of one run down to `copyId → verdict → {n, count, rate, ci}`. */
function cellsOf(report, scenarioId) {
  const section = report?.comparison?.byScenario?.[scenarioId]
  if (!section) return null
  const byCopy = {}
  for (const cell of section.cells) {
    byCopy[cell.copyId] ??= {}
    byCopy[cell.copyId][cell.verdict] = { n: cell.n, count: cell.count, rate: cell.rate, ci: cell.ci }
  }
  return byCopy
}

/** Compare two report objects; returns a structured, printable result. */
export function compare(a, b) {
  const globalReasons = []
  if (a?.fixture?.version !== b?.fixture?.version) {
    globalReasons.push(`fixture version ${a?.fixture?.version} vs ${b?.fixture?.version}`)
  }
  if (a?.fixture?.masterDigest !== b?.fixture?.masterDigest) {
    globalReasons.push(`masterDigest ${String(a?.fixture?.masterDigest).slice(0, 12)} vs ${String(b?.fixture?.masterDigest).slice(0, 12)}`)
  }

  const scenarioIds = [...new Set([...Object.keys(a?.scenarios ?? {}), ...Object.keys(b?.scenarios ?? {})])].sort()
  const scenarios = {}
  for (const id of scenarioIds) {
    const reasons = [...globalReasons]
    const versionA = a?.scenarios?.[id]
    const versionB = b?.scenarios?.[id]
    if (versionA === undefined || versionB === undefined) reasons.push(`scenario "${id}" present in only one run`)
    else if (versionA !== versionB) reasons.push(`scenario version ${versionA} vs ${versionB}`)

    const cellsA = cellsOf(a, id) ?? {}
    const cellsB = cellsOf(b, id) ?? {}
    const copyIds = [...new Set([...Object.keys(cellsA), ...Object.keys(cellsB)])]
    const rows = []
    for (const copyId of copyIds) {
      const verdicts = [...new Set([...Object.keys(cellsA[copyId] ?? {}), ...Object.keys(cellsB[copyId] ?? {})])]
      for (const verdict of verdicts) {
        const one = cellsA[copyId]?.[verdict] ?? null
        const two = cellsB[copyId]?.[verdict] ?? null
        const row = { copyId, verdict, a: one, b: two, delta: null }
        if (reasons.length === 0 && one && two) {
          row.delta = {
            value: two.rate !== null && one.rate !== null ? two.rate - one.rate : null,
            ci: newcombe(two.count, two.n, one.count, one.n),
            p: fisherExact(two.count, two.n, one.count, one.n),
          }
        }
        rows.push(row)
      }
    }
    scenarios[id] = { comparable: reasons.length === 0, reasons, rows }
  }
  return { a: a?.fixture ?? null, b: b?.fixture ?? null, reasons: globalReasons, scenarios }
}

const pct = (value) => (value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`)
const cellText = (cell) => (cell ? `${cell.count}/${cell.n} (${pct(cell.rate)}) [${pct(cell.ci?.[0])}, ${pct(cell.ci?.[1])}]` : "—")
const formatP = (p) => (p === null || p === undefined ? "—" : p < 0.0001 ? "<0.0001" : p.toFixed(4))

/** Printable text face of `compare()`. */
export function renderComparison(result, { aLabel = "A", bLabel = "B" } = {}) {
  const lines = [`${aLabel}: fixture v${result.a?.version} · masterDigest ${String(result.a?.masterDigest).slice(0, 12)}`,
    `${bLabel}: fixture v${result.b?.version} · masterDigest ${String(result.b?.masterDigest).slice(0, 12)}`, ""]
  for (const [scenarioId, section] of Object.entries(result.scenarios)) {
    lines.push(`## ${scenarioId}`)
    if (!section.comparable) lines.push(`not comparable — differs: ${section.reasons.join(" · ")}`, "")
    else lines.push("")
    for (const row of section.rows) {
      lines.push(`- ${row.copyId} · ${row.verdict}: ${aLabel} ${cellText(row.a)} · ${bLabel} ${cellText(row.b)}`)
      if (row.delta) {
        lines.push(`  Δ (B − A) ${pct(row.delta.value)} [${pct(row.delta.ci?.[0])}, ${pct(row.delta.ci?.[1])}] · p=${formatP(row.delta.p)}`)
      }
    }
    lines.push("")
  }
  return `${lines.join("\n").trimEnd()}\n`
}

function main(argv) {
  if (argv.length !== 2) {
    console.error("usage: node prompt-fixture/compare.mjs <a.json> <b.json>")
    process.exitCode = 1
    return
  }
  const [pathA, pathB] = argv
  const a = JSON.parse(readFileSync(pathA, "utf8"))
  const b = JSON.parse(readFileSync(pathB, "utf8"))
  process.stdout.write(renderComparison(compare(a, b), { aLabel: basename(pathA), bLabel: basename(pathB) }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
