/**
 * core-hygiene.test.mjs — 核内结构机检（CORE-UNIFICATION T-C15 / T-C14 / N3 · S0a）。
 * 行为面：核内零产品侧 import · 零裸包名 import（N3 / N7）· 核内相对 import 可解析 ·
 * 核 `.mjs` 档位（≤300 软线 / ≤500 硬限——N8）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name.endsWith(".mjs")) out.push(p)
  }
  return out
}

const specifiers = (src) => [
  ...[...src.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]),
  ...[...src.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
]

test("core .mjs files import only node: builtins + core-relative paths (N3 / N7 / T-C15)", () => {
  const bad = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith("node:") || spec.startsWith("./") || spec.startsWith("../")) continue
      bad.push(`${relative(ROOT, file)}: ${spec}`)
    }
  }
  assert.deepEqual(bad, [], `non-core import specifiers: ${bad.join(", ")}`)
})

test("every core-relative import resolves inside core/", () => {
  const missing = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (!spec.startsWith(".")) continue
      if (!existsSync(join(dirname(file), spec))) missing.push(`${relative(ROOT, file)} -> ${spec}`)
    }
  }
  assert.deepEqual(missing, [], `dangling relative imports: ${missing.join(", ")}`)
})

test("no core file reaches into a product tree — N3", () => {
  // ANY-depth `..` hop followed by a product name — the realistic form from core/ is a
  // single hop up into a sibling product directory. Assembled from parts so this test's
  // own source never contains the scanned literal.
  const P = "thinc" + "oder" + "(?:-vscode)?"
  const productHop = new RegExp("(?:\\.\\.\\/)+" + P)
  const hits = []
  for (const file of walk(ROOT)) {
    if (productHop.test(readFileSync(file, "utf8"))) hits.push(relative(ROOT, file))
  }
  assert.deepEqual(hits, [])
})

test("core .mjs files stay within the line tiers (T-C14 / N8)", () => {
  const soft = []
  const hard = []
  for (const file of walk(ROOT)) {
    const lines = readFileSync(file, "utf8").split("\n").length - 1 // wc -l semantics
    if (lines > 500) hard.push(`${relative(ROOT, file)}: ${lines}`)
    else if (lines > 300) soft.push(`${relative(ROOT, file)}: ${lines}`)
  }
  assert.deepEqual(hard, [], `>500 (hard cap): ${hard.join(", ")}`)
  assert.deepEqual(soft, [], `>300 (soft line — needs a split plan): ${soft.join(", ")}`)
})
