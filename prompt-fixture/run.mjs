/**
 * run.mjs — CLI and batch loop.
 *
 * Order of business: validate arguments → load scenarios → materialise copies and check them →
 * budget gate → run. The budget gate refuses before the first call and never truncates: a half
 * batch reads like a full one and is worse than no batch at all.
 *
 * Live runs write a report pair into the results home and refuse to overwrite an existing one —
 * one run is one piece of evidence. A dry run touches no network and, unless `--out` is given,
 * writes nothing at all: its JSON goes to stdout so two dry runs can be compared byte for byte.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { loadConfig } from "../thincoder-core/config.mjs"
import { hasKey, parseModelRef } from "../thincoder-core/model-ref.mjs"
import {
  BASELINE_ID, DEFAULT_CALL_TIMEOUT_MS, DEFAULT_LABEL, DEFAULT_MAX_CALLS, DEFAULT_N,
  DRY_RUN_MODEL, PROMPT_FIXTURE_VERSION, RESULTS_DIR, SLOT_FILES, SLOT_SET,
} from "./data.mjs"
import { createScriptTransport, loadScript, scriptCoverage } from "./dryrun.mjs"
import { materialize, removeRunDir } from "./materialize.mjs"
import { buildReport, fixtureBlock, renderMarkdown, serialiseReport } from "./report.mjs"
import { runOnce } from "./runner.mjs"
import { loadScenarios } from "./scenarios.mjs"

const USAGE = `node prompt-fixture/run.mjs [options]

  --copies baseline,demo    copies to run (materialisation always covers every declaration)
  --scenarios a,b           scenario ids (default: every scenario file)
  --models provider:model   required for a live run; ignored by --dry-run (label is "dry-run")
  --n N                     repeats per copy × scenario × model (default 1)
  --label TAG               results file label (default "run")
  --max-calls N             upper bound on model calls (default 200)
  --call-timeout-ms N       per-call timeout (default 180000)
  --results-dir DIR         results home (default prompt-fixture/results)
  --out FILE                explicit JSON path (Markdown lands beside it)
  --keep-temp               keep the run directory and print its path
  --dry-run                 replay dry-run.json, zero network, no file written unless --out`

// ── arguments ────────────────────────────────────────────────────────────────

const splitList = (value) => value.split(",").map((part) => part.trim()).filter(Boolean)

function positiveInt(value, flag) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} expects an integer >= 1, got "${value}"`)
  return parsed
}

export function parseArgs(argv) {
  const options = {
    copies: null, scenarios: null, models: [], n: DEFAULT_N, label: DEFAULT_LABEL,
    maxCalls: DEFAULT_MAX_CALLS, callTimeoutMs: DEFAULT_CALL_TIMEOUT_MS,
    resultsDir: RESULTS_DIR, out: null, keepTemp: false, dryRun: false, help: false,
  }
  const valueAt = (i, flag) => {
    if (i + 1 >= argv.length) throw new Error(`${flag} requires a value`)
    return argv[i + 1]
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case "--dry-run": options.dryRun = true; break
      case "--keep-temp": options.keepTemp = true; break
      case "--help": case "-h": options.help = true; break
      case "--copies": options.copies = splitList(valueAt(i, arg)); i += 1; break
      case "--scenarios": options.scenarios = splitList(valueAt(i, arg)); i += 1; break
      case "--models": options.models.push(...splitList(valueAt(i, arg))); i += 1; break
      case "--n": options.n = positiveInt(valueAt(i, arg), arg); i += 1; break
      case "--max-calls": options.maxCalls = positiveInt(valueAt(i, arg), arg); i += 1; break
      case "--call-timeout-ms": options.callTimeoutMs = positiveInt(valueAt(i, arg), arg); i += 1; break
      case "--label": options.label = valueAt(i, arg); i += 1; break
      case "--results-dir": options.resultsDir = valueAt(i, arg); i += 1; break
      case "--out": options.out = valueAt(i, arg); i += 1; break
      default: throw new Error(`unknown argument "${arg}"`)
    }
  }
  return options
}

// ── providers (live only) ────────────────────────────────────────────────────

/**
 * Strict single-shot resolution: `parseModelRef` + `hasKey`, no fallback. The core's runtime path
 * falls back to another channel when the named one has no key — that would make the reading
 * belong to a model nobody asked for.
 */
export function liveProviders(refs) {
  if (refs.length === 0) throw new Error("a live run needs --models provider:model (missing --models)")
  const config = loadConfig()
  const available = (config.providers ?? []).map((entry) => entry.name).join(", ") || "(none)"
  return refs.map((ref) => {
    const parsed = parseModelRef(ref, config.providers)
    if (!parsed.ok) throw new Error(`--models "${ref}": ${parsed.reason} — configured channels: ${available}`)
    if (!hasKey(parsed.provider)) throw new Error(`--models "${ref}": channel "${parsed.provider.name}" has no API key — configured channels: ${available}`)
    return { ref, provider: { ...parsed.provider, model: parsed.model } }
  })
}

// ── budget ─────────────────────────────────────────────────

/**
 * Upper bound on model calls: copies × models × repeats × Σ per scenario
 * ((1 + follow-ups) × maxRounds). Summing over scenarios first — the scenario count is not a
 * factor of its own, or the bound would be inflated by the number of scenarios.
 */
export function callBudget({ copies, scenarios, models, n }) {
  const perScenario = scenarios.reduce((sum, scenario) => sum + (1 + (scenario.followUps?.length ?? 0)) * scenario.maxRounds, 0)
  return copies * models * n * perScenario
}

// ── run ─────────────────────────────────────────────────────────────────────

const pad = (value) => String(value).padStart(2, "0")
const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function refuseIfExists(paths) {
  for (const path of paths) {
    if (existsSync(path)) throw new Error(`refusing to overwrite an existing report: ${path}`)
  }
}

/**
 * Resolve the requested copies against the materialised ones.
 * An empty list is refused: zero copies would still write a report — a report with zero readings,
 * shaped exactly like a batch that ran. Same gate as an empty model list, same reason.
 */
export function resolveCopies(available, copyIds) {
  if (copyIds.length === 0) throw new Error("--copies resolved to an empty list — name at least one copy (e.g. --copies baseline)")
  return copyIds.map((id) => {
    const hit = available.find((copy) => copy.id === id)
    if (!hit) throw new Error(`unknown copy "${id}" (available: ${available.map((copy) => copy.id).join(", ")})`)
    return hit
  })
}

export async function main(argv) {
  const options = parseArgs(argv)
  if (options.help) {
    console.log(USAGE)
    return
  }
  const scenarios = loadScenarios({ ids: options.scenarios })
  const materialised = materialize()
  const receipt = [`prompt-fixture v${PROMPT_FIXTURE_VERSION} · ${options.dryRun ? "dry-run" : "live"} · slot set ${SLOT_SET}`]

  try {
    receipt.push(`baseline==master: ${materialised.checks.zeroDiff}/${SLOT_FILES.length} byte-equal`)
    receipt.push(`assembly == assemblePrompt("${SLOT_SET}"): byte-equal`)
    for (const variant of materialised.variants) {
      receipt.push(`variant ${variant.id}: ${variant.edits} edit${variant.edits === 1 ? "" : "s"} · changed-lines == declared`)
    }

    const available = [materialised.baseline, ...materialised.variants]
    const copies = resolveCopies(available, options.copies ?? [BASELINE_ID])

    if (!options.dryRun && options.models.length === 0) throw new Error("a live run needs --models provider:model (missing --models)")
    const providers = options.dryRun ? [] : liveProviders(options.models)
    const models = options.dryRun ? [DRY_RUN_MODEL] : providers.map((entry) => entry.ref)
    if (options.dryRun && options.models.length > 0) receipt.push(`note: --models ignored in dry-run (label "${DRY_RUN_MODEL}")`)

    const budget = callBudget({ copies: copies.length, scenarios, models: models.length, n: options.n })
    if (budget > options.maxCalls) {
      throw new Error(`budget gate: upper bound is ${budget} model calls, --max-calls is ${options.maxCalls} — refusing to start (nothing is truncated)`)
    }
    receipt.push(`budget: ${budget} upper bound / ${options.maxCalls} allowed`)

    const script = options.dryRun ? loadScript() : null
    if (script) {
      for (const scenario of scenarios) {
        const covered = scriptCoverage(script, scenario)
        const unknown = covered.reduce((sum, entry) => sum + entry.unknown, 0)
        receipt.push(`script ${scenario.id}: ${covered.length} entries · ${covered.map((entry) => entry.verdict).join(", ")} · unknown tool calls ${unknown}`)
      }
    }

    const runs = []
    // Paths and the overwrite refusal come before the loop: a name collision must fail before the
    // batch is paid for, not after. `flag: "wx"` at write time stays as the race backstop.
    const willWrite = !(options.dryRun && !options.out)
    const jsonPath = willWrite ? options.out ?? join(options.resultsDir, `${todayLocal()}-${options.label}.json`) : null
    const mdPath = willWrite ? jsonPath.replace(/\.json$/i, "") + ".md" : null
    if (willWrite) refuseIfExists(options.dryRun ? [jsonPath] : [jsonPath, mdPath])
    for (const scenario of scenarios) {
      let runIndex = 0
      for (const copy of copies) {
        for (const model of models) {
          const provider = providers.find((entry) => entry.ref === model)?.provider ?? null
          for (let repeat = 1; repeat <= options.n; repeat += 1) {
            runIndex += 1
            const transport = options.dryRun ? createScriptTransport({ script, scenario, runIndex }) : null
            runs.push(await runOnce({ copy, scenario, model, repeat, provider, transport, callTimeoutMs: options.callTimeoutMs }))
          }
        }
      }
    }

    const report = buildReport({
      fixture: fixtureBlock({
        version: PROMPT_FIXTURE_VERSION,
        masterDigest: materialised.masterDigest,
        copies,
        assemblySha: { slots: SLOT_FILES, sha256: materialised.checks.assemblySha },
      }),
      scenarios: Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario.version])),
      verdicts: Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario.verdicts.map((rule) => rule.id)])),
      models,
      n: options.n,
      runs,
    })

    const errors = runs.filter((run) => run.error !== null).length
    receipt.push(`runs: ${runs.length} · model calls: ${runs.reduce((sum, run) => sum + run.calls, 0)} · errored runs: ${errors}`)

    if (!willWrite) {
      process.stdout.write(serialiseReport(report))
      receipt.push("report: stdout")
    } else {
      mkdirSync(dirname(jsonPath), { recursive: true })
      writeFileSync(jsonPath, serialiseReport(report), { flag: "wx" })
      receipt.push(`report: ${jsonPath}`)
      if (!options.dryRun) {
        writeFileSync(mdPath, renderMarkdown(report), { flag: "wx" })
        receipt.push(`report: ${mdPath}`)
      }
    }
  } finally {
    if (options.keepTemp) process.stderr.write(`kept temp: ${materialised.runDir}\n`)
    else removeRunDir(materialised.runDir)
    process.stderr.write(`${receipt.join("\n")}\n`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`prompt-fixture: ${error.message}\n`)
    process.exitCode = 1
  })
}
