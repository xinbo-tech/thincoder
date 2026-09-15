/**
 * i18n.mjs — zero-dependency locale helper for the extension process.
 * Dictionary = core projection (core-domain strings; single authoritative container
 * `@thincoder/core/i18n.mjs` — `projectDictionary`) + local locales/{lang}.json
 * (end-specific webview-face keys). Falls back to en.
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
// W15（#185 / 丁组 D1「容器归一、投影端差」· 核 i18n docstring「S2 接线」）：核内文案常量容器
// = 字典底座（`projectDictionary`——核域键：压缩/消化/限流/异步池/会诊/任务/goal/思考状态）；
// 端特有键（webview 面板专属文案）由本地 locales/*.json 叠加。核域键在本地档仍有 **32 键同值副本**
// （实核逐字同值；本地键恒胜 ⇒ 现为「双源冻结」——摘除候选登记，非本笔面向）。
import { projectDictionary } from "@thincoder/core/i18n.mjs"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const projDir = join(__dirname, "..")
let _strings = {}

/** 本地端特有键（webview 面）——按候选链取首档命中（zh-CN → zh → en），全缺返回 null。 */
function _loadLocal(lang) {
  for (const candidate of [lang, lang.split("-")[0], "en"]) {
    if (!candidate) continue
    const path = join(projDir, "locales", candidate + ".json")
    try { return { file: candidate, strings: JSON.parse(readFileSync(path, "utf8")) } } catch { /* fall through */ }
  }
  return null
}

/** Best-effort: 核域投影（底座）+ 本地端特有键（叠加）；本地档全缺 → 核域底座照常可用。 */
function _load(lang) {
  const local = _loadLocal(lang)
  // 投影语言 = 本地档实际命中档（缺档回退语义与旧 _load 同链）；本地全缺 → 直接投影 lang
  const base = projectDictionary(local?.file ?? lang)
  return local ? { ...base, ...local.strings } : base
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
