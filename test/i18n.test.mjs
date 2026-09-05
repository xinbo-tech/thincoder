/**
 * i18n.test.mjs — locale completeness contract.
 * Regression for 2026-08-14: status.currentTool/turns/elapsed and tool.error were
 * referenced in code but missing from BOTH locales — the status bar and tool-error
 * labels rendered raw key names. Also en/zh key sets must stay in lockstep.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const en = JSON.parse(readFileSync(join(root, "locales", "en.json"), "utf8"))
const zh = JSON.parse(readFileSync(join(root, "locales", "zh.json"), "utf8"))

// Keys constructed dynamically (t("reasoning." + level)) — their full set lives
// under the prefix; static scan can't see them.
// "welcome."（2026-09-05）：欢迎条文案两态经运行时键选择（ctx._keyOk ?
// "welcome.textConfigured" : "welcome.text" + data-i18n 属性通道）——静态扫描不可见——
// 欢迎域键少（heading/text/textConfigured/shortcutsHtml——前者仍静态引用受检）。
const DYNAMIC_PREFIXES = ["reasoning.", "welcome."]

function usedKeys() {
  const keys = new Set()
  const scanFile = (abs) => {
    const s = readFileSync(abs, "utf8")
    for (const m of s.matchAll(/\bt\(\s*["'`]([\w.]+)["'`]\s*[,)]/g)) {
      if (DYNAMIC_PREFIXES.some((p) => m[1] === p.replace(/\.$/, "") || m[1] === p)) continue
      keys.add(m[1])
    }
  }
  for (const f of readdirSync(join(root, "webview")).filter((f) => f.endsWith(".js"))) {
    scanFile(join(root, "webview", f))
  }
  // Extension-side t() calls (src/i18n.mjs shares the same locale files)
  const walkSrc = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name)
      if (f.isDirectory()) walkSrc(p)
      else if (f.name.endsWith(".mjs")) scanFile(p)
    }
  }
  walkSrc(join(root, "src"))
  scanFile(join(root, "extension.mjs"))
  return keys
}

describe("locale completeness", () => {
  it("every statically-referenced t() key exists in en.json", () => {
    const missing = [...usedKeys()].filter((k) => !(k in en))
    assert.deepEqual(missing, [], "missing en keys: " + missing.join(", "))
  })

  it("every statically-referenced t() key exists in zh.json", () => {
    const missing = [...usedKeys()].filter((k) => !(k in zh))
    assert.deepEqual(missing, [], "missing zh keys: " + missing.join(", "))
  })

  it("en and zh carry identical key sets", () => {
    const enOnly = Object.keys(en).filter((k) => !(k in zh))
    const zhOnly = Object.keys(zh).filter((k) => !(k in en))
    assert.deepEqual(enOnly, [], "en-only keys: " + enOnly.join(", "))
    assert.deepEqual(zhOnly, [], "zh-only keys: " + zhOnly.join(", "))
  })

  it("no dead keys: every locale entry is referenced (or under a dynamic prefix)", () => {
    const used = usedKeys()
    const dead = Object.keys(en).filter((k) =>
      !used.has(k) && !DYNAMIC_PREFIXES.some((p) => k.startsWith(p)))
    assert.deepEqual(dead, [], "dead locale keys: " + dead.join(", "))
  })
})
