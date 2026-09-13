/**
 * prompt-files.mjs — the core's SINGLE prompt-face resolution module (CORE-UNIFICATION D-C13).
 *
 * Root = `import.meta.url` (this module's own location) — never cwd / env vars / package-name
 * resolution — so the same code resolves identically in all three delivery states
 * (dev `npm link` / npm install / vsix embed). Callers never do path arithmetic (contract 8).
 *
 * Missing-file semantics are preserved PER CALLER (contract 9 — the B4 readings) and are
 * deliberately NOT unified:
 *   - slot prompts    → silent "" (the assembly layer emits the warning)  [loadSlot]
 *   - advisor prompts → throw (a broken installation must stay visible)   [loadAdvisorPrompt]
 *   - tool docs       → throw (the `DESC()` face has no try)              [loadToolDoc]
 *   - consult base    → loaded through the slot chain (silent); the CONSUME point throws
 *
 * Prompt content lives in `prompts/` (slot prompts) and `tool-docs/` (tool descriptions);
 * both are `files` whitelist entries of the core package (D-C10 — assertion D's object).
 */

import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = dirname(fileURLToPath(import.meta.url))

/** Core package-internal `prompts/` directory (slot prompts + advisor prompts). */
export const PROMPTS_DIR = join(ROOT, "prompts")
/** Core package-internal `tool-docs/` directory (tool descriptions). */
export const TOOL_DOCS_DIR = join(ROOT, "tool-docs")

/**
 * Slot prompt (`prompts/<name>`) — missing file ⇒ "" (silent). The caller (the assembly
 * layer) owns the warning: contract 9 keeps 槽位 ⇒ 静默空串 + 装配期警告.
 */
export function loadSlot(name) {
  try { return readFileSync(join(PROMPTS_DIR, name), "utf8") } catch { return "" }
}

/**
 * Advisor prompt (`prompts/<name>`) — missing file ⇒ throw. Hard-loaded: a missing advisor
 * prompt means a broken installation (silently degrading to a lesser prompt would strip the
 * review criteria / approval-signal rules).
 */
export function loadAdvisorPrompt(name) {
  try {
    return readFileSync(join(PROMPTS_DIR, name), "utf8")
  } catch {
    throw new Error(`${name} missing from the installation (prompts/${name}) — reinstall the package or restore the file`)
  }
}

/**
 * Tool description (`tool-docs/<name>.md`) — missing file ⇒ throw (the `DESC()` face reads
 * the file without a try: a silently empty tool description is not acceptable).
 */
export function loadToolDoc(name) {
  return readFileSync(join(TOOL_DOCS_DIR, `${name}.md`), "utf8")
}

/**
 * Consult base — loaded through the slot chain (silent, exactly like `loadSlot`); the
 * CONSUME point throws when the value is empty (contract 9 / B4). It is NOT a separate
 * throw face here.
 */
export function loadConsultBase() {
  return loadSlot("consult-base.md")
}
