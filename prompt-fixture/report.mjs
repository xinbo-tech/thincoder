/**
 * report.mjs — the readings, as a report pair (JSON + Markdown).
 *
 * The JSON carries six top-level keys and nothing else: `fixture / scenarios / models / n /
 * runs / comparison`. There is no "effective", "valid", "verdict-worthy" or "recommended" field —
 * the fixture produces distributions and differences, and the person running the batch decides
 * what a difference means. No timestamp and no absolute path is written, so the same parameters
 * produce byte-identical reports and determinism stays machine-checkable.
 */

import { BASELINE_ID } from "./data.mjs"
import { fisherExact, newcombe, wilson } from "./stats.mjs"

/** The fixture block: version, master digest, copy fingerprints, assembly fingerprint. */
export function fixtureBlock({ version, masterDigest, copies, assemblySha }) {
  return {
    version,
    masterDigest,
    injections: "unconfigured",
    copies: copies.map((copy) => ({ id: copy.id, files: copy.files })),
    assembly: { slots: [...assemblySha.slots], sha256: assemblySha.sha256 },
  }
}

/**
 * Build the report object. `copies` is the ordered list of copy ids that were run; scenario order
 * follows `scenarios`. `verdicts` supplies each scenario's declared verdict ids so a verdict that
 * never occurred still gets a row — "0 of n" and "not measured" must not look alike.
 */
export function buildReport({ fixture, scenarios, models, n, runs, verdicts = {} }) {
  const scenarioIds = Object.keys(scenarios)
  const copyIds = fixture.copies.map((copy) => copy.id)
  return {
    fixture,
    scenarios,
    models,
    n,
    runs,
    comparison: { baseline: BASELINE_ID, byScenario: summarise(runs, scenarioIds, copyIds, verdicts) },
  }
}

/** Per scenario: per-copy error totals and the cells the table renders, both readings explicit. */
function summarise(runs, scenarioIds, copyIds, verdicts) {
  const byScenario = {}
  for (const scenarioId of scenarioIds) {
    const cells = []
    const errors = {}
    const scenarioRuns = runs.filter((run) => run.scenarioId === scenarioId)
    const verdictIds = verdicts[scenarioId] ?? verdictIdsOf(scenarioRuns)

    for (const copyId of copyIds) {
      const copyRuns = scenarioRuns.filter((run) => run.copyId === copyId)
      errors[copyId] = copyRuns.filter((run) => run.error !== null).length
    }

    for (const verdict of [...verdictIds, "errors"]) {
      const isErrors = verdict === "errors"
      // The baseline cell is computed first whatever the copy order: `--copies demo,baseline`
      // must still produce a difference, not a silent dash.
      const baseline = copyIds.includes(BASELINE_ID) ? measurement(scenarioRuns, BASELINE_ID, verdict, isErrors) : null
      for (const copyId of copyIds) {
        const cell = measurement(scenarioRuns, copyId, verdict, isErrors)
        if (copyId !== BASELINE_ID) {
          cell.delta = baseline
            ? {
                value: cell.rate !== null && baseline.rate !== null ? cell.rate - baseline.rate : null,
                ci: newcombe(cell.count, cell.n, baseline.count, baseline.n),
                p: fisherExact(cell.count, cell.n, baseline.count, baseline.n),
              }
            : { value: null, ci: null, p: null }
        }
        cells.push(cell)
      }
    }
    byScenario[scenarioId] = { errors, cells }
  }
  return byScenario
}

/** One reading of one copy × verdict cell: population, count, rate and Wilson interval. */
function measurement(scenarioRuns, copyId, verdict, isErrors) {
  const copyRuns = scenarioRuns.filter((run) => run.copyId === copyId)
  const population = isErrors ? copyRuns.length : copyRuns.filter((run) => run.error === null).length
  const count = isErrors
    ? copyRuns.filter((run) => run.error !== null).length
    : copyRuns.filter((run) => run.error === null && run.verdict === verdict).length
  return {
    copyId,
    verdict,
    n: population,
    count,
    rate: population > 0 ? count / population : null,
    ci: population > 0 ? wilson(count, population) : null,
  }
}

/** Verdict ids in first-seen order; an error-only group contributes none. */
function verdictIdsOf(runs) {
  const ids = []
  for (const run of runs) {
    if (run.error === null && run.verdict !== null && !ids.includes(run.verdict)) ids.push(run.verdict)
  }
  return ids
}

// ── Markdown face ────────────────────────────────────────────────────────────

const pct = (value) => (value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`)
const rate = (cell) => (cell.rate === null ? "—" : `${cell.count}/${cell.n} (${pct(cell.rate)}) ${interval(cell.ci)}`)
const interval = (ci) => (ci ? `[${pct(ci[0])}, ${pct(ci[1])}]` : "—")
const formatP = (p) => (p === null || p === undefined ? "—" : p < 0.0001 ? "<0.0001" : p.toFixed(4))

/** Markdown report: one section per scenario, one row per verdict (`errors` included). */
export function renderMarkdown(report) {
  const lines = []
  const copyIds = report.fixture.copies.map((copy) => copy.id)
  const deltas = copyIds.filter((id) => id !== BASELINE_ID)

  lines.push("# Prompt fixture report", "")
  lines.push(`- fixture version: ${report.fixture.version}`)
  lines.push(`- scenario versions: ${Object.entries(report.scenarios).map(([id, version]) => `${id} v${version}`).join(" · ")}`)
  lines.push(`- masterDigest: ${report.fixture.masterDigest}`)
  lines.push(`- models: ${report.models.join(" · ")} · n = ${report.n}`)
  lines.push("")
  lines.push("A cell reads `count/n (rate) [95% CI]`; a Δ column is the difference against the baseline with its 95% interval and Fisher exact p.")
  lines.push("")

  for (const [scenarioId, section] of Object.entries(report.comparison.byScenario)) {
    const verdicts = [...new Set(section.cells.map((cell) => cell.verdict))]
    const header = ["verdict", ...copyIds]
    for (const copyId of deltas) header.push(`Δ ${copyId}`, `p ${copyId}`)
    lines.push(`## ${scenarioId} (v${report.scenarios[scenarioId]})`, "")
    lines.push(`| ${header.join(" | ")} |`)
    lines.push(`|${header.map(() => "---").join("|")}|`)
    for (const verdict of verdicts) {
      const row = [verdict]
      for (const copyId of copyIds) row.push(rate(section.cells.find((cell) => cell.copyId === copyId && cell.verdict === verdict)))
      for (const copyId of deltas) {
        const cell = section.cells.find((entry) => entry.copyId === copyId && entry.verdict === verdict)
        row.push(cell?.delta?.value === null || cell?.delta?.value === undefined ? "—" : `${pct(cell.delta.value)} ${interval(cell.delta.ci)}`)
        row.push(formatP(cell?.delta?.p))
      }
      lines.push(`| ${row.join(" | ")} |`)
    }
    lines.push("")
  }
  return `${lines.join("\n").trimEnd()}\n`
}

/** Stable serialisation — the same report object always prints the same bytes. */
export function serialiseReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`
}
