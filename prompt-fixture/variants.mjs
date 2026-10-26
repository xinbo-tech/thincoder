/**
 * variants.mjs — the variant layer: declarations are data, and the machine checks prove the
 * on-disk variant differs from the baseline only as declared.
 *
 * A declaration is a list of `find` / `replace` edits per slot file. Two independent views:
 *   1. byte equality — the on-disk variant must equal the in-memory replay of the declaration;
 *   2. line multiset — the visible added / removed lines must equal the declared ones, so a
 *      stray write, an encoding change or an unaccounted edit is named rather than averaged away.
 */

import { readFileSync, readdirSync } from "node:fs"
import { basename, join } from "node:path"
import { addInto, firstDifference, fmtLines, lineDelta, surplus, textOf } from "./checks.mjs"
import { BASELINE_ID, SLOT_FILES, VARIANTS_DIR } from "./data.mjs"

/** Load every `variants/*.json` declaration (id sorted) — always all of them, never a selection. */
export function loadVariantDecls(dir = VARIANTS_DIR) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch (error) {
    // No declaration directory = no declared variants (legitimate). Any other failure means the
    // rows could not be read and must stay loud: an empty list would silently drop a variant.
    if (error?.code === "ENOENT") return []
    throw new Error(`variant declarations unreadable: ${dir} (${error?.code ?? error?.message})`)
  }
  return entries
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => validateDecl(JSON.parse(readFileSync(join(dir, name), "utf8")), name))
}

export function validateDecl(decl, fileName) {
  const id = basename(fileName, ".json")
  if (decl?.id !== id) throw new Error(`variant declaration ${fileName}: "id" must equal the file name "${id}"`)
  if (id === BASELINE_ID) throw new Error(`variant declaration ${fileName}: "id" must not be "${BASELINE_ID}"`)
  if (!Array.isArray(decl.edits) || decl.edits.length === 0) {
    throw new Error(`variant declaration ${fileName}: "edits" must be a non-empty array`)
  }
  decl.edits.forEach((edit, i) => {
    const where = `variant declaration ${fileName}, edit #${i + 1}`
    if (typeof edit?.file !== "string" || !SLOT_FILES.includes(edit.file)) {
      throw new Error(`${where}: "file" must be one of ${SLOT_FILES.join(" / ")}`)
    }
    if (typeof edit.find !== "string" || edit.find === "") throw new Error(`${where}: "find" must be a non-empty string`)
    if (typeof edit.replace !== "string") throw new Error(`${where}: "replace" must be a string`)
  })
  return { id, note: typeof decl.note === "string" ? decl.note : "", edits: decl.edits }
}

/** Count non-overlapping occurrences of `needle` in `haystack`. */
function countOccurrences(haystack, needle) {
  let count = 0
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at === -1) return count
    count += 1
    from = at + needle.length
  }
}

/**
 * Replay a declaration on the in-memory baseline texts.
 * Every `find` must occur exactly once in the text as it stands when that edit is applied:
 * 0 occurrences = the declaration misses (it would silently change nothing), 2+ = ambiguous
 * (which occurrence was meant would be decided by iteration order — the declaration and the
 * actual change would be two different things).
 *
 * The declared change per file is measured by applying each edit and reading the line delta it
 * produced — not by splitting the `find` / `replace` strings themselves: a replacement may keep
 * some of the find lines, and that would otherwise be reported as a change that never happened.
 */
export function applyVariantDecl(decl, masters) {
  const texts = new Map(SLOT_FILES.map((name) => [name, textOf(masters.get(name))]))
  const declared = new Map(SLOT_FILES.map((name) => [name, { removed: new Map(), added: new Map() }]))
  let changedLines = 0
  decl.edits.forEach((edit, i) => {
    const where = `variant "${decl.id}", edit #${i + 1} (${edit.file})`
    const before = texts.get(edit.file)
    const hits = countOccurrences(before, edit.find)
    if (hits === 0) throw new Error(`${where}: 声明未命中 — "find" does not occur in ${edit.file}`)
    if (hits > 1) throw new Error(`${where}: 声明歧义 — "find" occurs ${hits} times in ${edit.file} (must occur exactly once)`)
    const at = before.indexOf(edit.find)
    const after = before.slice(0, at) + edit.replace + before.slice(at + edit.find.length)
    texts.set(edit.file, after)
    const delta = lineDelta(before, after)
    addInto(declared.get(edit.file).removed, delta.removed)
    addInto(declared.get(edit.file).added, delta.added)
    changedLines += delta.removed.size + delta.added.size
  })
  return { texts, declared, changedLines }
}

/**
 * Line-level view of "the variant differs only as declared": the visible added / removed lines
 * against the baseline must equal the declared ones (multiset, line order ignored).
 * The byte-equality check below is the primary proof; this one makes the claim readable and
 * names the lines a declaration does not explain.
 */
export function verifyVariantLines(decl, masters, texts, declared) {
  for (const name of SLOT_FILES) {
    if (!decl.edits.some((edit) => edit.file === name)) continue
    const actual = lineDelta(textOf(masters.get(name)), texts.get(name))
    const want = declared.get(name)
    const surplusAdded = surplus(actual.added, want.added)
    const surplusRemoved = surplus(actual.removed, want.removed)
    const missingAdded = surplus(want.added, actual.added)
    const missingRemoved = surplus(want.removed, actual.removed)
    if (surplusAdded.length || surplusRemoved.length || missingAdded.length || missingRemoved.length) {
      throw new Error(
        `variant "${decl.id}" (${name}): changed lines do not match the declaration — ` +
        `unexplained added: ${fmtLines(surplusAdded)} · unexplained removed: ${fmtLines(surplusRemoved)} · ` +
        `declared but not visible: +${fmtLines(missingAdded)} / -${fmtLines(missingRemoved)}`,
      )
    }
  }
  return true
}

/**
 * Write-time proof: the on-disk variant equals the in-memory replay byte for byte.
 * A newline / BOM / encoding change at write time would produce a copy whose prompt differs from
 * the declared one — exactly what this check refuses to let through.
 */
export function verifyVariantCopy(dir, decl, texts) {
  for (const name of SLOT_FILES) {
    const onDisk = readFileSync(join(dir, name))
    const expected = Buffer.from(texts.get(name), "utf8")
    if (!onDisk.equals(expected)) {
      const at = firstDifference(textOf(onDisk), textOf(expected))
      throw new Error(`variant "${decl.id}" (${name}): on-disk bytes differ from the declared replay at character ${at}`)
    }
  }
  return true
}
