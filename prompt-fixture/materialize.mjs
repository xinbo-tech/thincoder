/**
 * materialize.mjs — the copy layer: the baseline is written byte-for-byte from the master prompts
 * and then checked against them (sha256 + character count per file), and its assembly must equal
 * what the product assembles for the same slot set.
 *
 * Copies never land in the repository: they are materialised into a temporary run directory and
 * removed when the run ends. Variants are built here too, but their checks live in `variants.mjs`.
 *
 * Why generate instead of committing a snapshot: consistency then follows from construction. A
 * committed copy drifts from its master, and drift is the failure this fixture exists to remove.
 */

import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { applyPromptInjections, PROMPTS_DIR } from "../thincoder-core/prompt-files.mjs"
import { assemblePrompt } from "../thincoder-core/prompt-overlays.mjs"
import { chars, firstDifference, sha256, textOf } from "./checks.mjs"
import { BASELINE_ID, SLOT_FILES, SLOT_JOINER, SLOT_SET } from "./data.mjs"
import { applyVariantDecl, loadVariantDecls, verifyVariantCopy, verifyVariantLines } from "./variants.mjs"

// ── master prompts ───────────────────────────────────────────────────────────

/** Read the three master prompts (bytes — no newline normalisation anywhere in this layer). */
export function readMasters() {
  const masters = new Map()
  for (const name of SLOT_FILES) {
    const path = join(PROMPTS_DIR, name)
    let buf
    try {
      buf = readFileSync(path)
    } catch (error) {
      throw new Error(`master prompt unreadable: ${path} (${error.message})`)
    }
    if (buf.length === 0) throw new Error(`master prompt is empty: ${path}`)
    masters.set(name, buf)
  }
  return masters
}

/** One value identifying "this set of masters": slot order, per file `name \0 bytes`. */
export function masterDigest(masters) {
  const hash = createHash("sha256")
  for (const name of SLOT_FILES) {
    hash.update(name)
    hash.update("\0")
    hash.update(masters.get(name))
  }
  return hash.digest("hex")
}

// ── copy layer ───────────────────────────────────────────────────────────────

/** Create the run directory a materialisation lives in (`--keep-temp` only skips the removal). */
export function createRunDir() {
  return mkdtempSync(join(tmpdir(), "prompt-fixture-"))
}

export function removeRunDir(dir) {
  if (dir) rmSync(dir, { recursive: true, force: true })
}

/** Write one copy (a map of file name → Buffer|string) into `<runDir>/<id>/`. */
export function writeCopy(runDir, id, contents) {
  const dir = join(runDir, id)
  mkdirSync(dir, { recursive: true })
  for (const name of SLOT_FILES) {
    const value = contents.get(name)
    if (value === undefined) throw new Error(`copy "${id}" is missing slot file "${name}"`)
    writeFileSync(join(dir, name), Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8"))
  }
  return dir
}

/** Per-file readings of a written copy: name / sha256 / characters. */
export function copyFiles(dir) {
  return SLOT_FILES.map((name) => {
    const buf = readFileSync(join(dir, name))
    return { name, sha256: sha256(buf), chars: chars(textOf(buf)) }
  })
}

/**
 * Zero-difference check: every baseline file must be byte-identical to its master.
 * Throws naming the file and both digests — a drifted copy is never used for a run.
 */
export function verifyZeroDiff(dir, masters) {
  for (const name of SLOT_FILES) {
    const copy = readFileSync(join(dir, name))
    const master = masters.get(name)
    const copyHash = sha256(copy)
    const masterHash = sha256(master)
    if (copyHash !== masterHash) {
      throw new Error(
        `baseline copy differs from master: ${name} (copy sha256=${copyHash} chars=${chars(textOf(copy))} · ` +
        `master sha256=${masterHash} chars=${chars(textOf(master))})`,
      )
    }
    if (chars(textOf(copy)) !== chars(textOf(master))) {
      throw new Error(`baseline copy character count differs from master: ${name}`)
    }
  }
  return SLOT_FILES.length
}

// ── assembly ─────────────────────────────────────────────────────────────────

/** Assemble the copy with the product rule: slot order, blank-line join, then injections. */
export function assembleCopyAt(dir) {
  const parts = SLOT_FILES.map((name) => {
    const text = textOf(readFileSync(join(dir, name)))
    if (!text) throw new Error(`slot file compiled to an empty string: ${name}`)
    return text
  })
  return applyPromptInjections(parts.join(SLOT_JOINER))
}

/**
 * Guard against assembly drift: the copy's assembly must equal what the product assembles for
 * this slot set. Without it, a wrong join or a wrong slot order would silently measure a prompt
 * no session ever loads.
 */
export function verifyAssembly(prompt) {
  const product = assemblePrompt(SLOT_SET).prompt
  const at = firstDifference(prompt, product)
  if (at !== -1) {
    throw new Error(
      `assembled copy differs from assemblePrompt("${SLOT_SET}") at character ${at}: ` +
      `copy=${JSON.stringify(prompt.slice(at, at + 40))} product=${JSON.stringify(product.slice(at, at + 40))}`,
    )
  }
  return sha256(Buffer.from(prompt, "utf8"))
}

// ── full materialisation ─────────────────────────────────────────────────────

/**
 * Materialise the baseline and every declared variant into a fresh run directory.
 * Variants are always all built and checked — `--copies` decides what is *run*, never what is
 * verified, so a variant's readings exist even when only the baseline is executed.
 */
export function materialize() {
  const masters = readMasters()
  const digest = masterDigest(masters)
  const runDir = createRunDir()
  try {
    const baselineDir = writeCopy(runDir, BASELINE_ID, masters)
    const zeroDiff = verifyZeroDiff(baselineDir, masters)
    const baselinePrompt = assembleCopyAt(baselineDir)
    const assemblySha = verifyAssembly(baselinePrompt)

    const variants = loadVariantDecls().map((decl) => {
      const applied = applyVariantDecl(decl, masters)
      const dir = writeCopy(runDir, decl.id, applied.texts)
      verifyVariantCopy(dir, decl, applied.texts)
      verifyVariantLines(decl, masters, applied.texts, applied.declared)
      return {
        id: decl.id,
        note: decl.note,
        dir,
        prompt: assembleCopyAt(dir),
        files: copyFiles(dir),
        edits: decl.edits.length,
        changedLines: applied.changedLines,
      }
    })

    return {
      runDir,
      masterDigest: digest,
      baseline: { id: BASELINE_ID, dir: baselineDir, prompt: baselinePrompt, files: copyFiles(baselineDir), edits: 0, changedLines: 0 },
      variants,
      checks: { zeroDiff, assemblySha },
    }
  } catch (error) {
    removeRunDir(runDir)
    throw error
  }
}
