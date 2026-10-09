/**
 * 2026-10-06-server-i18n.test.mjs — thincoder-server 批内单测件（控制台多语言；名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-server-i18n.test.mjs`
 *
 * 射程（六腿——webui/WEBUI.md §2.2 ∥ §6 AC-14）：
 *   ① 表对齐：两表键集双向相等（除自称名族 `lang.zh` ∥ `lang.en`——仅 zh 表载体）∥ 占位符逐键一致 ∥
 *      en 表零 CJK ∥ 全键非空
 *   ② 检测矩阵：`pickLang(stored, languages)`（记忆优先 ∥ `zh*`/`en*` 首命中 ∥ 无匹配 ⇒ zh ∥ 非法记忆值忽略）
 *   ③ 零 CJK 口径：前端 JS 代码档（排除 i18n 表族——前缀 `i18n-zh*`/`i18n-en*`（门面 + 八部件） ∥ `index.html`）注释外零 CJK 字面量
 *      （CJK 类 = Han ∥ CJK 标点 ∥ 全角形；「—」U+2014 ∥ 「…」U+2026 等中性标点不在内——`fmtValue` 中性保留在案）
 *   ④ 静态面：各前端档 `t("…")` 字面量 ⊆ 表键 ∥ `nav.mjs` `labelKey` 面（数据持键、无 `label` 字面量）∥
 *      相对 import 目标在册（import 图闭合——零裸说明符）∥ i18n 表族静态直发 200 + `text/javascript`
 *   ⑤ 错误映射：可达码全集八枚（两表全键 ∥ 映射按码 ∥ 参数码句末附服务端原文 ∥ `Retry-After` 秒数注入 ∥
 *      未知码原文兜底——纯函数面）
 *   ⑥ 渲染冒烟：切换器组件 `h` 注入（自称名固定 ∥ 当前态高亮 ∥ `onChange` 回调）+ 缺键回退链（键原文 + `console.warn`）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
// 随正（配额 v2 批）：模块目标从 `import.meta.url` 相对式改为 cwd 相对式——本件已硬要求 cwd = 仓根（上行）∥ 本副本住 tmp 舱（层级与 docs/batches/ 不等）⇒ 相对式在舱内不可达
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const { ZH } = await load("i18n-zh.mjs")
const { EN } = await load("i18n-en.mjs")
const I18N = await load("i18n.mjs")
const NAV = await load("nav.mjs")

/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
/** 自称名族（仅 zh 表载体——切换器固定取 zh 表渲染）。 */
const SELF_NAMES = ["lang.zh", "lang.en"]
/** 控制台可达错误码全集八枚（服务端零改——按 `code` 前端映射）。 */
const ERROR_CODES = ["unauthorized", "invalid_credentials", "forbidden", "not_found", "invalid_request_error", "upstream_error", "internal_error", "too_many_attempts"]
/** i18n 表族（结构轮前缀式——门面 + 八部件；import 图面 ∥ 直发面同取）。 */
const TABLE_FAMILY = readdirSync(PUBLIC_DIR).filter((name) => /^i18n-(zh|en)/.test(name)).sort()
/** 零 CJK / 键引用扫描面 = 前端 JS 代码档（排除 i18n 表族；index.html 非 JS 档——静态缺省豁免在案）。 */
const JS_FILES = readdirSync(PUBLIC_DIR).filter((name) => name.endsWith(".mjs") && !TABLE_FAMILY.includes(name)).sort()

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")
/** 剥注释（字符串态感知——`//`/`/*` 出现在字符串内不误剥；「注释外零 CJK」判据取此——防日后 URL 串削弱判据）。 */
function stripComments(src) {
  let out = ""
  let mode = "code"
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    const next = src[i + 1]
    if (mode === "code") {
      if (ch === "/" && next === "/") { mode = "line"; i += 1; continue }
      if (ch === "/" && next === "*") { mode = "block"; i += 1; continue }
      if (ch === '"') mode = "dq"
      else if (ch === "'") mode = "sq"
      else if (ch === "`") mode = "tq"
      out += ch
    } else if (mode === "line") {
      if (ch === "\n") { mode = "code"; out += ch }
    } else if (mode === "block") {
      if (ch === "*" && next === "/") { mode = "code"; i += 1 }
    } else {
      out += ch // 字符串内原样保留（转义跳格）
      if (ch === "\\") { out += next ?? ""; i += 1 }
      else if ((mode === "dq" && ch === '"') || (mode === "sq" && ch === "'") || (mode === "tq" && ch === "`")) mode = "code"
    }
  }
  return out
}

// ── ① 表对齐 ────────────────────────────────────────────────────────────────

test("① 表对齐：基键集双向相等（除自称名族 + `.one` 族）∥ 占位符逐键一致 ∥ en 零 CJK ∥ 全键非空", () => {
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one")) // `.one` 变体族 = 仅 en 表载体（KD-SV-44）
  const zhShared = zhKeys.filter((key) => !SELF_NAMES.includes(key))
  for (const key of SELF_NAMES) assert.ok(key in ZH, `zh 表缺自称名键：${key}`)
  for (const key of zhShared) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enBase) assert.ok(key in ZH, `en 表多出键：${key}`)
  for (const key of SELF_NAMES) assert.ok(!(key in EN), `自称名族不得入 en 表：${key}`)
  assert.equal(zhShared.length, enBase.length, "共享基键集长度不等")
  for (const key of zhShared) {
    assert.equal(typeof ZH[key], "string", `zh 值非字符串：${key}`)
    assert.equal(typeof EN[key], "string", `en 值非字符串：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key} = ${EN[key]}`)
})

// ── ② 检测矩阵 ──────────────────────────────────────────────────────────────

test("② 检测矩阵：pickLang——记忆优先 ∥ zh*/en* 首命中 ∥ 无匹配 ⇒ zh ∥ 非法记忆值忽略", () => {
  const cases = [
    ["zh", ["en-US", "zh-CN"], "zh", "记忆优先（zh 胜过 en 浏览器）"],
    ["en", ["zh-CN"], "en", "记忆优先（en 胜过 zh 浏览器）"],
    ["en", undefined, "en", "记忆优先（无浏览器输入）"],
    [null, ["fr-FR", "zh-CN"], "zh", "顺序扫描：首命中 zh*"],
    [null, ["fr", "en-GB"], "en", "顺序扫描：首命中 en*"],
    [null, ["en-US", "zh-CN"], "en", "首命中 = 先到者胜（en 在前）"],
    [null, ["zh-TW", "en"], "zh", "首命中 = 先到者胜（zh 在前）"],
    [null, ["zh"], "zh", "裸 zh 命中"],
    [null, ["EN-us"], "en", "大小写不敏感（BCP47）"],
    [null, ["fr", "de"], "zh", "无匹配 ⇒ 缺省 zh"],
    [null, [], "zh", "空列表 ⇒ 缺省 zh"],
    [null, undefined, "zh", "无列表 ⇒ 缺省 zh"],
    ["fr", ["en-US"], "en", "非法记忆值忽略（回检测）"],
    ["", ["zh-CN"], "zh", "空记忆值忽略（回检测）"],
    ["zh-TW", ["en"], "en", "非 zh/en 记忆值忽略（回检测）"],
    ["ZH", ["en"], "en", "大写记忆值非法（合法值 = 精确 zh/en）"],
    [undefined, ["en"], "en", "undefined 记忆值忽略（回检测）"],
  ]
  for (const [stored, languages, expected, why] of cases) {
    assert.equal(I18N.pickLang(stored, languages), expected, `${why}：stored=${JSON.stringify(stored)} languages=${JSON.stringify(languages)}`)
  }
})

// ── ③ 零 CJK 口径 ───────────────────────────────────────────────────────────

test("③ 零 CJK 口径：前端 JS 代码档（排除 i18n 表族）注释外零 CJK 字面量", () => {
  assert.deepEqual(JS_FILES, ["app.mjs", "dom.mjs", "health.mjs", "i18n.mjs", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-proxy.mjs", "views-system-config.mjs", "views-system.mjs", "views-usage.mjs"])
  for (const name of JS_FILES) {
    const stripped = stripComments(readFileSync(join(PUBLIC_DIR, name), "utf8"))
    const hit = stripped.match(CJK)
    assert.equal(hit, null, `${name} 注释外含 CJK：${JSON.stringify(hit?.[0])}——文案应入 zh 族（i18n-zh*）`)
  }
  const zhText = TABLE_FAMILY.filter((name) => name.startsWith("i18n-zh")).map((name) => readFileSync(join(PUBLIC_DIR, name), "utf8")).join("\n")
  assert.ok(CJK.test(zhText), "zh 族应为 CJK 载体（唯一）")
})

// ── ④ 静态面（键引用闭合 ∥ import 图 ∥ 直发）────────────────────────────────

test("④ 静态面：t 字面量 ⊆ 表键 ∥ nav labelKey 面 ∥ import 图闭合 ∥ i18n 表族静态直发", async () => {
  // t("…") 字面量（单参 ∥ 多参形——本仓先例 t 实参一律单行字符串）
  const refs = []
  for (const name of JS_FILES) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 100, `t 字面量过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) {
    assert.ok(key in ZH, `${name} 引用悬空键：${key}`)
    assert.ok(key in EN, `${name} 引用仅 zh 键（自称名族应走 langLabel）：${key}`)
  }
  // nav.mjs 数据面：labelKey（键——非字面量）；`label` 痕迹不得残留
  const groups = NAV.NAV_GROUPS
  assert.equal(groups.length, 2)
  const labelKeys = []
  for (const group of groups) {
    assert.equal(typeof group.labelKey, "string", `组缺 labelKey：${group.key}`)
    assert.ok(!("label" in group), `组残留 label 字面量：${group.key}`)
    labelKeys.push(group.labelKey)
    for (const item of group.items) {
      assert.equal(typeof item.labelKey, "string", `项缺 labelKey：${item.path}`)
      assert.ok(!("label" in item), `项残留 label 字面量：${item.path}`)
      labelKeys.push(item.labelKey)
    }
  }
  assert.equal(labelKeys.length, 13, "组 2 + 项 11 = 13 个 labelKey（十一页 + 两组）")
  for (const key of labelKeys) assert.ok(key in EN, `labelKey 悬空（shared 键）：${key}`)
  // 动态键面（不裹 `t("…")` 的裸键字面量——如 nav `labelKey` ∥ views-system 四端清单）⊆ 表键
  for (const name of JS_FILES) {
    const src = stripComments(readFileSync(join(PUBLIC_DIR, name), "utf8"))
    for (const match of src.matchAll(/["']([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)["']/g)) {
      assert.ok(match[1] in ZH, `${name} 裸键字面量悬空：${match[1]}`)
      assert.ok(match[1] in EN, `${name} 裸键字面量仅 zh：${match[1]}`)
    }
  }
  // import 图闭合：相对说明符目标在册 ∥ 零裸说明符（浏览器原生 ESM——零构建）
  for (const name of [...JS_FILES, ...TABLE_FAMILY]) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const line of src.split("\n")) {
      if (!line.startsWith("import ")) continue
      const match = line.match(/["']([^"']+)["']\s*;?\s*$/)
      assert.ok(match, `${name} import 行无法解析：${line}`)
      const spec = match[1]
      if (!spec.startsWith(".")) assert.fail(`${name} 出现裸说明符：${spec}`)
      const target = resolve(PUBLIC_DIR, spec)
      assert.ok(existsSync(target), `${name} import 目标缺档：${spec}`)
      assert.equal(dirname(target), PUBLIC_DIR, `${name} import 越出 public/：${spec}`)
    }
  }
  // i18n 表族静态直发：真句柄（node:http + static.mjs）⇒ 200 ∥ text/javascript
  const site = (await import(pathToFileURL(join(ROOT, "thincoder-server", "src", "webui", "static.mjs")).href)).createStaticSite()
  const server = createServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    for (const name of ["i18n.mjs", ...TABLE_FAMILY]) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.equal(response.status, 200, `静态直发 ${name}`)
      assert.match(response.headers.get("content-type"), /text\/javascript/, `mime ${name}`)
      assert.equal(await response.text(), readFileSync(join(PUBLIC_DIR, name), "utf8"), `字节等于磁盘 ${name}`)
    }
  } finally {
    server.closeAllConnections?.() // 关 keep-alive 留连（fetch 池——防 close 等满超时）
    await new Promise((done) => server.close(done))
  }
})

// ── ⑤ 错误映射 ──────────────────────────────────────────────────────────────

test("⑤ 错误映射：八码全键 ∥ 逐码映射 ∥ 参数码附服务端原文 ∥ Retry-After 注入 ∥ 未知码原文兜底", () => {
  // 八码全键（两表）
  for (const code of ERROR_CODES) {
    assert.ok(`err.${code}` in ZH, `zh 表缺：err.${code}`)
    assert.ok(`err.${code}` in EN, `en 表缺：err.${code}`)
  }
  const expected = (table, key, params = {}) => table[key].replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
  const fill = (key, params) => expected(ZH, key, params)
  try {
    // 逐码（默认 zh）：非参数码 = 表值原样；参数码句末附服务端原文；429 秒数注入
    for (const code of ERROR_CODES) {
      const error = { code, status: 400, message: "服务端原文", retryAfter: 42 }
      const out = I18N.mapError(error)
      const key = `err.${code}`
      if (code === "not_found" || code === "invalid_request_error") {
        assert.equal(out, fill(key, { detail: "服务端原文" }), `${key} 应句末附服务端原文`)
        assert.ok(out.includes("服务端原文"), `${key} 细节丢失`)
      } else if (code === "too_many_attempts") {
        assert.equal(out, fill(key, { seconds: 42 }), `${key} 应注入 Retry-After 秒数`)
        assert.ok(out.includes("42"), `${key} 秒数丢失`)
      } else {
        assert.equal(out, ZH[key], `${key} 应取表值（不落服务端中文原文）`)
        assert.ok(!out.includes("服务端原文"), `${key} 不应附原文（非参数码）`)
      }
      assert.ok(!out.includes("{"), `${key} 占位符未替换：${out}`)
    }
    // 未知码 ⇒ 服务端原文兜底（未来新码/上游透传）；无 message ⇒ 通用键
    assert.equal(I18N.mapError({ code: "brand_new_code", status: 400, message: "自有消息" }), "自有消息")
    assert.equal(I18N.mapError({ status: 500, message: "裸消息" }), "裸消息")
    assert.equal(I18N.mapError({ status: 0 }), fill("app.requestFailed", { reason: "[object Object]" }))
    // 切 en：同一码取 en 表值（429 秒数注入同拍）
    I18N.setLang("en")
    assert.equal(I18N.mapError({ code: "unauthorized", status: 401 }).startsWith("{"), false)
    assert.equal(I18N.mapError({ code: "unauthorized", status: 401 }), EN["err.unauthorized"])
    assert.ok(I18N.mapError({ code: "too_many_attempts", status: 429, retryAfter: 7 }).includes("7"))
  } finally {
    I18N.setLang("zh")
  }
})

// ── ⑥ 渲染冒烟 ─────────────────────────────────────────────────────────────

test("⑥ 渲染冒烟：切换器（h 注入——自称名固定 ∥ 当前态高亮 ∥ onChange 回调）+ 缺键回退链", () => {
  /** 描述符 h 替身（沿批内件先例——节点 = { tag, props, children }）。 */
  const el = (tag, props = {}, ...children) => ({ tag, props, children: children.flat(Infinity) })
  const texts = (node, out = []) => {
    if (typeof node === "string") { out.push(node); return out }
    if (node === null || node === undefined || node === false) return out
    if (node.props?.text) out.push(String(node.props.text))
    for (const child of node.children ?? []) texts(child, out)
    return out
  }
  // 切换器：两枚自称名小钮——自称名固定（zh/en 两模式下都渲染「中文 ∥ English」）
  const picked = []
  const switchNodes = I18N.langSwitch(el, (lang) => picked.push(lang))
  assert.equal(switchNodes.tag, "div")
  assert.equal(switchNodes.props.class, "lang-switch")
  const buttons = switchNodes.children
  assert.equal(buttons.length, 2)
  assert.deepEqual(buttons.map((b) => b.props.text), ["中文", "English"])
  assert.equal(buttons[0].props.class, "tiny active", "当前态（zh）高亮")
  assert.equal(buttons[1].props.class, "tiny")
  buttons[1].props.onclick()
  assert.deepEqual(picked, ["en"], "onChange 注入回调收到目标语言")
  I18N.setLang("en")
  const enNodes = I18N.langSwitch(el, () => {})
  assert.deepEqual(enNodes.children.map((b) => b.props.text), ["中文", "English"], "自称名不翻译（固定 zh 表）")
  assert.equal(enNodes.children[1].props.class, "tiny active", "当前态（en）高亮")
  I18N.setLang("zh")
  // 侧栏渲染冒烟：品牌/组/项（labelKey 解析后的文案）+ meta 槽 + 切换器在位
  let sidebar = []
  const h = el
  NAV.renderSidebar({ h, member: { role: "admin" }, path: "/me/keys", onLogout: () => {}, version: "1.2.3" }, { replaceChildren: (...nodes) => { sidebar = nodes } })
  const sidebarText = texts(el("div", {}, ...sidebar)).join(" ")
  for (const key of ["nav.brand", "nav.group.me", "nav.page.me.keys", "nav.page.me.account", "nav.group.admin", "nav.page.admin.system", "nav.logout"]) {
    assert.ok(sidebarText.includes(ZH[key]), `侧栏缺文案：${key}`)
  }
  assert.ok(sidebarText.includes("v1.2.3"))
  assert.equal(texts(el("div", {}, ...sidebar)).filter((t) => t === "中文" || t === "English").length, 2, "侧栏切换器在位（自称名两枚）")
  // 缺键回退链：键原文 + console.warn（安全网——两表对齐下不可达）
  const warns = []
  const original = console.warn
  console.warn = (...args) => { warns.push(args.join(" ")) }
  try {
    assert.equal(I18N.t("no.such.key"), "no.such.key")
    assert.equal(warns.length, 1)
    assert.ok(warns[0].includes("no.such.key"))
  } finally {
    console.warn = original
  }
})
