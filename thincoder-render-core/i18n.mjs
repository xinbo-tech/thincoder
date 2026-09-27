/**
 * i18n.js — zero-dependency locale helper for the webview.
 * Locale strings are injected by the extension at startup via
 * `postMessage({ type: "i18n", strings: {...} })`.
 *
 * Usage:
 *   import { t } from "./i18n.js"
 *   t("welcome.heading")           // "ThinCoder"
 *   t("error.failedProvider", { name: "DeepSeek" })
 */

let _strings = {}

/**
 * Called when the extension sends locale data.
 * Messages listener in chat.js should call this.
 */
export function setStrings(strings) {
  _strings = strings || {}
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
