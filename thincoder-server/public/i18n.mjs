/**
 * i18n.mjs — 控制台多语言运行时（webui/WEBUI.md §2.2——KD-SV-26）：语言态 ∥ 检测/记忆 ∥ `t()` ∥ 切换器组件
 * （`h` + `onChange` 注入——侧栏 meta 槽 ∥ 登录卡两处复用）∥ 错误码映射 ∥ `document` 接线。
 *
 * 模块顶层零浏览器全局访问——`document`/`localStorage`/`navigator` 仅在 init/绑定函数内触碰；检测输入经参数注入
 * （`pickLang(stored, languages)`）——批内件 node 直测。缺键回退链 = 当前表 → zh 表 → 键原文（+ `console.warn`——安全网）。
 */
import { ZH } from "./i18n-zh.mjs"
import { EN } from "./i18n-en.mjs"

const TABLES = { zh: ZH, en: EN }
const STORE_KEY = "tc_lang"
/** documentElement.lang 取值（zh ⇒ zh-CN ∥ en ⇒ en）。 */
const LANG_TAGS = { zh: "zh-CN", en: "en" }
/** 控制台可达错误码 + 预留（服务端消息零改——按 `code` 前端映射；WEBUI §2.2——`rate_limited` 仅 /v1 面产生）。 */
const ERROR_CODES = new Set(["unauthorized", "invalid_credentials", "forbidden", "not_found", "invalid_request_error", "upstream_error", "internal_error", "too_many_attempts", "rate_limited"])

let current = "zh"

/** 检测（纯函数——node 直测）：记忆值优先（合法值 zh/en——非法忽略）；否则 `navigator.languages` 顺序扫描
 *  （`zh*` ⇒ zh ∥ `en*` ⇒ en——首命中）；无命中 ⇒ 缺省 zh（现状保持零惊群）。 */
export function pickLang(stored, languages) {
  if (stored === "zh" || stored === "en") return stored
  for (const tag of languages ?? []) {
    const value = String(tag).toLowerCase()
    if (value.startsWith("zh")) return "zh"
    if (value.startsWith("en")) return "en"
  }
  return "zh"
}

/** 语言标签（`fmtTs` 本地化 ∥ `documentElement.lang` 共用）。 */
export function langTag() {
  return LANG_TAGS[current]
}

/** 取值（缺键回退链——当前表 → zh 表 → 键原文 + `console.warn`；参数 = `{name}` 占位替换）。 */
export function t(key, params) {
  return lookup(TABLES[current], key, params)
}

function lookup(table, key, params) {
  let text = table[key]
  if (text === undefined) text = TABLES.zh[key]
  if (text === undefined) {
    console.warn(`[i18n] missing key: ${key}`)
    return String(key)
  }
  if (params === undefined) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
}

/** 自称名（固定取 zh 表渲染——`lang.zh` ∥ `lang.en` 仅 zh 表载体，不自译；WEBUI §2.2）。 */
export function langLabel(lang) {
  return lookup(TABLES.zh, `lang.${lang}`)
}

/** 切换器组件（`h` + `onChange` 注入）：两枚自称名小钮——当前态高亮；点击 ⇒ `onChange(lang)`。 */
export function langSwitch(h, onChange) {
  return h("div", { class: "lang-switch" },
    ...["zh", "en"].map((lang) => h("button", {
      type: "button",
      class: lang === current ? "tiny active" : "tiny",
      text: langLabel(lang),
      onclick: () => onChange?.(lang),
    })))
}

/** 错误本地化（纯函数——node 直测）：可达码 ⇒ `err.<code>`（参数码句末附服务端原文 ∥ 429 秒数注入）；
 *  未知码 ⇒ 服务端原文兜底（新码/上游透传零遗漏）。 */
export function mapError(error) {
  const code = error?.code ?? null
  if (code !== null && ERROR_CODES.has(code)) {
    return t(`err.${code}`, { detail: error.message ?? "", seconds: error.retryAfter ?? "" })
  }
  return error?.message ?? t("app.requestFailed", { reason: String(error) })
}

// ── 浏览器接线（init/绑定面——模块顶层零浏览器全局）──────────────────────────

/** localStorage 访问（隐私模式等不可用 ⇒ null——检测回退 ∥ 记忆静默）。 */
function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** 初始化（装配接线）：记忆（`tc_lang`）→ `navigator.languages` → 缺省 zh；返回当前语言。 */
export function initLang(stored = storage()?.getItem(STORE_KEY) ?? null, languages = globalThis.navigator?.languages) {
  current = pickLang(stored, languages)
  return current
}

/** 写记忆 + 置模块态（切换绑定面用——记忆不可用 ⇒ 静默只改本次会话）。 */
export function setLang(lang) {
  if (lang !== "zh" && lang !== "en") return current
  current = lang
  try {
    storage()?.setItem(STORE_KEY, lang)
  } catch {
    /* 记忆不可用——静默 */
  }
  return current
}

/** `document` 接线：`documentElement.lang` 随动 + 标签页 title（运行期覆盖 index.html 静态缺省）。 */
export function applyDocument(doc = globalThis.document) {
  if (!doc) return
  doc.documentElement.lang = LANG_TAGS[current]
  doc.title = t("app.title")
}
