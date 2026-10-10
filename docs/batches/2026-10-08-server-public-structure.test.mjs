/**
 * 2026-10-08-server-public-structure.test.mjs — thincoder-server 批内单测件（server public 结构轮·i18n 拆表 ∥ `app.mjs` 拆分；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-08-server-public-structure.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §1/§2.2/§2.3⑤/§5 ∥ §6 AC-14/AC-20 续 + 本批档 §2.3；判据 ↔ 腿对照在括号）：
 *   ① 键集指纹（基线 = 拆表零语义 ⊕ 2026-10-09 代理批 +1 键 ⊕ 配置面批 +29 键——sorted-key 序列化 sha256 两枚 ⊕ 代理页批 +18 ∥ 退役 2（键数 389 ∥ 394））
 *   ② 部件互斥/并集（八部件两两互斥 ∧ 并集 = 门面全键 ∥ 归属 = 剥 `.one` 首段前缀（域界机检）∥ 部件冻结）
 *   ③ 门面 identity（`ZH`/`EN` 导出名 ∥ `i18n.mjs` 取件行零改 ∥ `t()` 缺省 zh ∥ 缺键回退链（键原文）∥
 *      `.one` 复数取形（en 单形 ∥ zh 落基键））
 *   ④ 静态直发（十新档 200 ∥ `text/javascript` ∥ 字节 = 磁盘——真 `static.mjs` 句柄）
 *   ⑤ 拆分接线（`app.mjs` 零重复定义（`h`/`HEALTH_POLL_MS`/直写 `healthListeners`）∥ 导入两档 ∥
 *      `viewCtx()` 注入面 17 名钉表 ∥ `dom.mjs`/`health.mjs` 导出面）⑥ 行数核（十新档 + 两门面 + `app.mjs` ≤300）
 *
 * 桩说明：`dom.mjs` 顶层触 `document`（`flashEl` 取件——WEBUI §1）——先桩后 import；本档零外部网络/零真库（④ 腿 = 真 `static.mjs` 句柄 ∥ 环回自持）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const linesOf = (name) => { const text = readPublic(name); return text.split("\n").length - (text.endsWith("\n") ? 1 : 0) }
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

// 桩（`dom.mjs` 顶层触 `document`——先桩后 import；本档不调渲染函数）
globalThis.document = { getElementById: () => null }

const { ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const { EN } = await load("thincoder-server/public/i18n-en.mjs")
const I18N = await load("thincoder-server/public/i18n.mjs")
const DOM = await load("thincoder-server/public/dom.mjs")
const HEALTH = await load("thincoder-server/public/health.mjs")

/** 部件域界（键首段前缀——`.one` 变体随基键；KD-SV-51）：键集归属 = 机器可判。 */
const PARTS = ["shell", "me", "admin", "system"]
const DOMAINS = {
  shell: ["app", "common", "col", "denied", "nav", "lang", "login", "err"],
  me: ["usage", "me"],
  admin: ["admin"],
  system: ["system", "vector", "health", "overview", "usageReport", "audit", "proxy"],
}
const domainOf = (key) => PARTS.find((part) => DOMAINS[part].includes(key.replace(/\.one$/, "").split(".")[0])) ?? null
/** 键集指纹基线（2026-10-08 拆表零语义基线；2026-10-09 代理批 +1 键（`admin.providers.useProxy`）随正 ∥ 2026-10-09 配置面批 +29 键随正 ∥ 2026-10-09 embed 解耦批 +1 键随正（system +2 ∥ admin −1）⊕ 2026-10-09 alias 批 +4 键随正（两表各 +4——别名面）⊕ 2026-10-09 代理页批（+18 ∥ 退役 2——代理面）⊕ 2026-10-10 server-small-fixes 批（14 键值改——「API Key」统一：nav/管理/审计/接入卡/页题/秘密标签/用量报表键列；键集零变 389 ∥ 394）⊕ 2026-10-10 代理回迁批（−3 键：`nav.page.admin.proxy` ∥ `proxy.title` ∥ `proxy.settingsTitle`——代理面页/卡题/nav 三键退役；键数 386 ∥ 391））。 */
const ANCHOR = {
  zh: "41b6a2783f2022b2e5231a3e4bf311ca7d2a0ab9b9711201e26023b14ab38a5b",
  en: "8fd692cd9844615e7c1efc2d64cba9f48222e1624711de082e7e4f6fca8d316f",
}
const fingerprint = (TABLE) => createHash("sha256").update(JSON.stringify(Object.keys(TABLE).sort().map((key) => [key, TABLE[key]]))).digest("hex")

// ── ① 键集指纹（拆表 = 纯结构；基线随后续增键批同拍随正）────────────────────────────

test("① 键集指纹：`ZH`/`EN` sorted-key 序列化 sha256 = 基线（拆表 ⊕ 10-09 代理批 ⊕ 配置面批 ⊕ embed 解耦批 ⊕ 10-09 alias 批 ⊕ 代理页批 ⊕ 10-10 small-fixes 批〔值改——14 键〕⊕ 10-10 代理回迁批〔−3 键〕）∥ 键数 386 ∥ 391 ∥ 门面冻结", () => {
  assert.equal(fingerprint(ZH), ANCHOR.zh, "zh 指纹漂移（键集/值须逐字同基线）")
  assert.equal(fingerprint(EN), ANCHOR.en, "en 指纹漂移（键集/值须逐字同基线）")
  assert.equal(Object.keys(ZH).length, 386, "zh 键数 386（拆表 338 + 代理批 1 + 配置面批 29 + embed 解耦批 1 + alias 批 4 + 代理页批 18 − 退役 2 − 回迁批 3）")
  assert.equal(Object.keys(EN).length, 391, "en 键数 391（含 `.one` 变体族；回迁批 −3）")
  assert.ok(Object.isFrozen(ZH) && Object.isFrozen(EN), "门面 `Object.freeze`（聚合门面封闭）")
})

// ── ② 部件互斥/并集（域界 = 键首段前缀——四部件 × 两语言）─────────────────────

test("② 部件互斥/并集：八部件两两互斥 ∧ 并集 = 门面全键 ∧ 归属 = 剥 `.one` 首段前缀", async () => {
  for (const [lang, FACADE] of [["zh", ZH], ["en", EN]]) {
    const seen = new Map()
    for (const part of PARTS) {
      const module = await load(`thincoder-server/public/i18n-${lang}-${part}.mjs`)
      const exportNames = Object.keys(module)
      assert.equal(exportNames.length, 1, `${lang}-${part} 单导出一枚（现 ${exportNames.join(",")}）`)
      assert.ok(Object.isFrozen(module[exportNames[0]]), `${lang}-${part} 部件冻结（Object.freeze）`)
      for (const key of Object.keys(module[exportNames[0]])) {
        assert.equal(seen.has(key), false, `${lang} 键跨部件重复：${key}`)
        seen.set(key, part)
        assert.equal(domainOf(key), part, `${lang} 域界不符：${key} 应属 ${part}`)
      }
    }
    assert.deepEqual([...seen.keys()].sort(), Object.keys(FACADE).sort(), `${lang} 八部件并集 = 门面全键（无缺无余）`)
  }
})

// ── ③ 门面 identity（`i18n.mjs` 消费面零改——取件行 ∥ `t()` 取形）──────────────

test("③ 门面 identity：`i18n.mjs` 取件行零改 ∥ `t()` 缺省 zh ∥ 缺键回退链 ∥ `.one` 复数取形", () => {
  const i18nSrc = readPublic("i18n.mjs")
  assert.ok(i18nSrc.includes('import { ZH } from "./i18n-zh.mjs"'), "`i18n.mjs` 取 `ZH` 自门面（零改）")
  assert.ok(i18nSrc.includes('import { EN } from "./i18n-en.mjs"'), "`i18n.mjs` 取 `EN` 自门面（零改）")
  I18N.setLang("zh")
  assert.equal(I18N.t("app.title"), ZH["app.title"], "缺省语言 = zh（零改动）")
  const warn = console.warn // 缺键回退 = 键原文（回退链第三段；warn 面静默取样）
  console.warn = () => {}
  try { assert.equal(I18N.t("__missing__.probe"), "__missing__.probe", "缺键回退链尾 = 键原文") } finally { console.warn = warn }
  I18N.setLang("en")
  const fillCount = (text, n) => text.replace(/\{count\}/g, String(n)) // 占位替换面（`t()` 行为直测）
  assert.equal(I18N.t("common.rowCount", { count: 1 }), fillCount(EN["common.rowCount.one"], 1), "en 复数取形（count=1 ⇒ `.one` 单形）")
  assert.equal(I18N.t("common.rowCount", { count: 2 }), fillCount(EN["common.rowCount"], 2), "en 复数取形（count=2 ⇒ 基键）")
  assert.notEqual(EN["common.rowCount.one"], undefined, "`.one` 变体随基键同表（门面合体零改）")
  I18N.setLang("zh")
  assert.equal(I18N.t("common.rowCount", { count: 1 }), fillCount(ZH["common.rowCount"], 1), "zh 复数落基键（无复数区分）")
})

// ── ④ 静态直发（十新档——200 ∥ `text/javascript` ∥ 字节 = 磁盘）──────────────

test("④ 静态直发：十新档 200 ∥ `text/javascript` ∥ 字节 = 磁盘（真 `static.mjs` 句柄）", async () => {
  const site = (await load("thincoder-server/src/webui/static.mjs")).createStaticSite()
  const server = createServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    const newFiles = ["dom.mjs", "health.mjs", ...PARTS.flatMap((part) => [`i18n-zh-${part}.mjs`, `i18n-en-${part}.mjs`])]
    for (const name of newFiles) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.deepEqual([response.status, (await response.text()) === readPublic(name)], [200, true], `${name} 直发（200 ∥ 字节 = 磁盘）`)
      assert.equal(response.headers.get("content-type"), "text/javascript; charset=utf-8", name)
    }
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})

// ── ⑤ 拆分接线（`app.mjs` 三拆：入口收窄 ∥ 注入面零改 ∥ 两档导出面）───────────

test("⑤ 拆分接线：`app.mjs` 三拆收窄（零重复定义 ∥ 导入两档）∥ `viewCtx()` 注入面 17 名 ∥ 两新档导出面", () => {
  const appSrc = readPublic("app.mjs")
  for (const module of ["./dom.mjs", "./health.mjs"]) assert.ok(appSrc.includes(`from "${module}"`), `app.mjs 未导入：${module}`)
  assert.equal(/^(export )?function h\(/m.test(appSrc), false, "app.mjs 零 `h` 定义（渲染助手已外拆）")
  assert.equal(appSrc.includes("HEALTH_POLL_MS = "), false, "app.mjs 零 `HEALTH_POLL_MS` 定义（轮询已外拆）")
  assert.equal(appSrc.includes("healthListeners = []"), false, "app.mjs 零直写 `healthListeners`（订阅清零口收口）")
  assert.ok(appSrc.includes("clearHealthListeners()"), "app.mjs 经 `clearHealthListeners` 清零（route/logout 两处）")
  // 逐序钉表（有意：顺序变更亦视为注入面变更——逐字取证口径）
  const ctx = appSrc.match(/function viewCtx\(\) \{\s*return \{([^}]*)\}/)?.[1] ?? ""
  const names = ctx.split(",").map((entry) => entry.trim().split(":")[0].trim()).filter(Boolean)
  assert.deepEqual(names, ["h", "table", "api", "state", "fail", "flash", "refresh", "navigate", "fmtTs", "fmtValue", "fmtModelQuotas", "showSecret", "usageTable", "dataShell", "onChange", "onHealth", "health"], "`viewCtx()` 注入面 17 名（视图面零改——单点装配）")
  for (const name of ["h", "table", "showSecret", "usageTable", "dataShell", "flash", "fmtTs", "fmtValue", "fmtModelQuotas"]) assert.equal(typeof DOM[name], "function", `dom.mjs 导出：${name}`)
  assert.equal(HEALTH.HEALTH_POLL_MS, 30000, "health.mjs 轮询周期 30s")
  for (const name of ["onHealth", "healthSnapshot", "renderHealthLight", "startHealthPolling", "stopHealthPolling", "clearHealthListeners"]) assert.equal(typeof HEALTH[name], "function", `health.mjs 导出：${name}`)
})

// ── ⑥ 行数核（十新档 + 两门面 + `app.mjs`——拆后回软线内）────────────────────

test("⑥ 行数核：十新档 + 两门面 + `app.mjs` ≤300（硬限 ≤500 全绿）", () => {
  const targets = ["app.mjs", "dom.mjs", "health.mjs", "i18n-zh.mjs", "i18n-en.mjs", ...PARTS.flatMap((part) => [`i18n-zh-${part}.mjs`, `i18n-en-${part}.mjs`])]
  for (const name of targets) {
    const lines = linesOf(name)
    assert.ok(lines <= 500, `${name} 越 500 硬限：${lines}`)
    assert.ok(lines <= 300, `${name} 越 300 软线（拆后应回线内）：${lines}`)
  }
})
