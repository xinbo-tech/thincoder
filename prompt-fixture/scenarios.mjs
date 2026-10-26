/**
 * scenarios.mjs — scenarios and verdicts are data, not code.
 *
 * A scenario file describes one task: the user message, the read-only sandbox, which declared
 * tools are offered, how many tool rounds one user turn may take, follow-up user turns, and the
 * verdict rules. Adding a scenario is adding a JSON file — no runner change.
 *
 * A verdict rule is `{ id, meaning, when }`; `when` is a closed vocabulary of action predicates
 * (`anyTool`), with `always: true` allowed only as the last rule. Because that last rule is
 * mandatory, "no verdict" cannot happen — the schema carries the guarantee, not a runtime default.
 */

import { readFileSync, readdirSync } from "node:fs"
import { basename, join } from "node:path"
import { DEFAULT_MAX_ROUNDS, SCENARIOS_DIR } from "./data.mjs"
import { DECLARED_TOOL_NAMES } from "./tools.mjs"

/** Predicate keys the first version understands. */
export const PREDICATE_KEYS = ["anyTool", "always"]

/** Text-class predicates are recognised so the refusal can say why — not because they work. */
const TEXT_PREDICATE_KEYS = ["textIncludes", "textIncludesAny", "textEquals", "matches", "regex", "contains"]

const isString = (value) => typeof value === "string"
const isPosInt = (value) => Number.isInteger(value) && value >= 1

/**
 * Load and validate scenarios. With `ids`, exactly those (`<id>.json`) in the given order;
 * without, every file in the scenarios directory (name order).
 */
export function loadScenarios({ ids = null, dir = SCENARIOS_DIR } = {}) {
  const files = ids
    ? ids.map((id) => ({ id, file: `${id}.json` }))
    : readdirSync(dir).filter((name) => name.endsWith(".json")).sort().map((file) => ({ id: basename(file, ".json"), file }))
  if (files.length === 0) throw new Error(`no scenario found in ${dir}`)
  const seen = new Set()
  return files.map(({ id, file }) => {
    if (seen.has(id)) throw new Error(`scenario "${id}" requested twice`)
    seen.add(id)
    const path = join(dir, file)
    let raw
    try {
      raw = JSON.parse(readFileSync(path, "utf8"))
    } catch (error) {
      throw new Error(`scenario ${file}: unreadable (${error.message})`)
    }
    return validateScenario(raw, { fileName: file, path })
  })
}

/** Validate one scenario object; every refusal names the file and the field. */
export function validateScenario(raw, { fileName, path = fileName }) {
  const where = `scenario ${fileName}`
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${where}: must be a JSON object`)

  const id = raw.id
  if (!isString(id) || id === "") throw new Error(`${where}: "id" must be a non-empty string`)
  if (id !== basename(fileName, ".json")) throw new Error(`${where}: "id" must equal the file name "${basename(fileName, ".json")}"`)
  if (!isPosInt(raw.version)) throw new Error(`${where}: "version" must be an integer >= 1`)
  if (!isString(raw.title) || raw.title === "") throw new Error(`${where}: "title" must be a non-empty string`)
  if (!isString(raw.prompt) || raw.prompt === "") throw new Error(`${where}: "prompt" must be a non-empty string`)

  const sandbox = raw.sandbox ?? {}
  if (typeof sandbox !== "object" || Array.isArray(sandbox)) throw new Error(`${where}: "sandbox" must be an object`)
  for (const [key, value] of Object.entries(sandbox)) {
    if (!isString(value)) throw new Error(`${where}: "sandbox" entry "${key}" must be a string`)
  }

  const tools = raw.tools ?? DECLARED_TOOL_NAMES
  if (!Array.isArray(tools) || tools.length === 0) throw new Error(`${where}: "tools" must be a non-empty array`)
  for (const name of tools) {
    if (!DECLARED_TOOL_NAMES.includes(name)) {
      throw new Error(`${where}: tool "${name}" is not in the declared tool face (${DECLARED_TOOL_NAMES.join(" / ")})`)
    }
  }
  if (new Set(tools).size !== tools.length) throw new Error(`${where}: "tools" contains a duplicate name`)

  const maxRounds = raw.maxRounds ?? DEFAULT_MAX_ROUNDS
  if (!isPosInt(maxRounds)) throw new Error(`${where}: "maxRounds" must be an integer >= 1`)

  const followUps = raw.followUps ?? []
  if (!Array.isArray(followUps) || followUps.some((text) => !isString(text) || text === "")) {
    throw new Error(`${where}: "followUps" must be an array of non-empty strings`)
  }

  const verdicts = validateVerdicts(raw.verdicts, where)

  return { id, version: raw.version, title: raw.title, prompt: raw.prompt, sandbox, tools, maxRounds, followUps, verdicts, path }
}

/** Verdict rules: known predicate keys only, unique ids, and `always: true` exactly once, last. */
export function validateVerdicts(rules, where = "scenario") {
  if (!Array.isArray(rules) || rules.length === 0) throw new Error(`${where}: "verdicts" must be a non-empty array`)
  const ids = new Set()
  let alwaysAt = -1

  rules.forEach((rule, i) => {
    const at = `${where}: verdicts[${i}]`
    if (!rule || typeof rule !== "object") throw new Error(`${at} must be an object`)
    if (!isString(rule.id) || rule.id === "") throw new Error(`${at}: "id" must be a non-empty string`)
    if (ids.has(rule.id)) throw new Error(`${at}: duplicate verdict id "${rule.id}"`)
    ids.add(rule.id)
    if (!isString(rule.meaning) || rule.meaning === "") throw new Error(`${at}: "meaning" must be a non-empty string`)

    const when = rule.when
    if (!when || typeof when !== "object" || Array.isArray(when)) throw new Error(`${at}: "when" must be an object`)
    const keys = Object.keys(when)
    if (keys.length === 0) throw new Error(`${at}: "when" must carry exactly one predicate`)

    for (const key of keys) {
      if (TEXT_PREDICATE_KEYS.includes(key)) {
        throw new Error(`${at}: predicate "${key}" is text-class — 第一版只做动作类判据（看工具调用序列）`)
      }
      if (!PREDICATE_KEYS.includes(key)) {
        throw new Error(`${at}: unknown predicate key "${key}" (known: ${PREDICATE_KEYS.join(" / ")})`)
      }
    }

    if (keys.length > 1) throw new Error(`${at}: "when" carries ${keys.length} predicates — exactly one is allowed`)

    if (Object.hasOwn(when, "always")) {
      if (when.always !== true) throw new Error(`${at}: "always" must be true`)
      if (i !== rules.length - 1) throw new Error(`${at}: "always" is only allowed as the last rule (rules follow it: ${rules.length - 1 - i})`)
      alwaysAt = i
      return
    }

    const names = when.anyTool
    if (!Array.isArray(names) || names.length === 0) throw new Error(`${at}: "anyTool" must be a non-empty array of tool names`)
    for (const name of names) {
      if (!DECLARED_TOOL_NAMES.includes(name)) {
        throw new Error(`${at}: "anyTool" names "${name}", which is not in the declared tool face (${DECLARED_TOOL_NAMES.join(" / ")})`)
      }
    }
  })

  if (alwaysAt === -1) throw new Error(`${where}: verdicts miss the closing "always: true" fallback — every run must end in a verdict`)
  return rules.map((rule) => ({ id: rule.id, meaning: rule.meaning, when: { ...rule.when } }))
}

/**
 * Post-hoc classification of a finished run: first matching rule wins.
 * Rule order is the scenario's decision (e.g. "wrote it myself" outranks "also delegated" —
 * the violation already happened). An undeclared tool name is not in any `anyTool` list, so it
 * can never decide a verdict.
 */
export function classify(toolSeq, verdicts) {
  for (const rule of verdicts) {
    if (Object.hasOwn(rule.when, "always")) return rule.id
    if (rule.when.anyTool.some((name) => toolSeq.includes(name))) return rule.id
  }
  throw new Error(`no verdict rule matched toolSeq ${JSON.stringify(toolSeq)} — the scenario violates the always-last rule`)
}
