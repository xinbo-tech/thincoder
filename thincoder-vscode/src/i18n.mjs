/**
 * i18n.mjs — zero-dependency locale helper for the extension process.
 * Loads strings from locales/{lang}.json, falls back to en.
 *
 * Usage:
 *   import { t, initLocale } from "./src/i18n.mjs"
 *   await initLocale("zh")        // or "zh-CN" → "zh"
 *   console.log(t("welcome.heading"))           // "ThinCoder"
 *   console.log(t("error.failedProvider", { name: "DeepSeek" }))
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const projDir = join(__dirname, "..")
let _strings = {}

/** Best-effort: load the locale file, fall back to en. */
function _load(lang) {
  for (const candidate of [lang, lang.split("-")[0], "en"]) {
    if (!candidate) continue
    const path = join(projDir, "locales", candidate + ".json")
    try { return JSON.parse(readFileSync(path, "utf8")) } catch { /* fall through */ }
  }
  return {}
}

/**
 * Load locale strings for a given language and return as plain object.
 * Used to send to the webview side.
 */
export function loadLocaleStrings(lang) {
  return _load(lang)
}
/**
 * Initialise the locale for this process. Call once at startup.
 * Accepts BCP-47 tags like "zh-CN", "zh", "en", "en-US".
 */
export function initLocale(lang) {
  _strings = _load(lang)
}

/**
 * Resolve a localised string by key. Supports `${name}` interpolation.
 * Falls back to the key itself if untranslated.
 */
export function t(key, vars = {}) {
  let val = _strings[key]
  if (val === undefined) return key
  for (const [k, v] of Object.entries(vars)) {
    val = val.replace("${" + k + "}", String(v))
  }
  return val
}
