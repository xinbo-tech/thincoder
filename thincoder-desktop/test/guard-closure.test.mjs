/**
 * guard-closure.test.mjs — E-6 用例（SHELL.md §1 进程面三层；批档 §2.5 U5–U7）。
 * 覆盖：渲染面静态闭包（零 `node:` ∧ 零裸包 ∧ 闭包非空 ∧ 逐档已读失败即判红）/ 违规样本判红
 * （内存合成源 · **不写盘**——保证规则本身不是假绿）/ 渲染面零内联脚本 + CSP 无 `unsafe-*`。
 * R1 增：`/rc/` 前缀白名单（RENDER-CORE.md §1.3 双根——核经 `app://` 第二根取；**裸包禁令不变**）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

/** 剥注释（行 / 块；`//` 行注释只在行首空白后剥离——不误伤字符串里的 `//`）。 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

/** 静态边抽取：`import` / `export … from` / 侧效 `import "x"`；动态 `import(` 不入闭包（非静态面）。 */
function staticSpecifiers(source) {
  const re = /(?:^|[\s;])(?:import|export)\s+(?!\()([^;"'`]{0,400}?)\bfrom\s*["']([^"']+)["']|(?:^|[\s;])import\s*["']([^"']+)["']/g
  const specs = []
  let match
  while ((match = re.exec(stripComments(source)))) {
    const spec = match[2] ?? match[3]
    if (spec) specs.push(spec)
  }
  return specs
}

/** 分类（单源规则 · U6 直接喂合成源）：`node:` 内置 / 裸包 / 相对 / `/rc/` 前缀（R1 白名单——同源 URL 取核，非裸包）。 */
function classifySpecifiers(specs) {
  const builtins = new Set()
  const bare = new Set()
  const relative = new Set()
  const rc = new Set()
  for (const spec of specs) {
    if (spec.startsWith("node:")) builtins.add(spec)
    else if (spec.startsWith("/rc/")) rc.add(spec)
    else if (spec.startsWith(".")) relative.add(spec)
    else bare.add(spec)
  }
  return { builtins, bare, relative, rc }
}

// ─── U5 渲染面静态闭包 ─────────────────────────────────────────

test("U5: 渲染面静态闭包零 node: ∧ 零裸包（逐档已读 · 读不到即判红）", () => {
  const entry = fileURLToPath(new URL("../renderer/app.mjs", import.meta.url))
  const seen = new Set()
  const builtins = new Set()
  const bare = new Set()
  const queue = [entry]
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    const source = readFileSync(file, "utf8") // 读不到 ⇒ 直接抛（fail-closed —— 不静默跳过）
    seen.add(file)
    const { builtins: b, bare: p, relative } = classifySpecifiers(staticSpecifiers(source))
    for (const spec of b) builtins.add(spec)
    for (const spec of p) bare.add(spec)
    for (const spec of relative) queue.push(fileURLToPath(new URL(spec, pathToFileURL(file))))
  }
  const has = (suffix) => [...seen].some((file) => file.replaceAll("\\", "/").endsWith(suffix))
  assert.ok(has("renderer/app.mjs"), "入口在闭包内")
  // 正控（U34）：闭包真走了边 —— 基础四档（`app` / `dom` / `store` / `i18n`）+ 本批三新档逐档在位。
  for (const name of ["dom.mjs", "store.mjs", "i18n.mjs", "events.mjs", "events-subscribe.mjs", "mount-pool.mjs"]) {
    assert.ok(has(`renderer/${name}`), `闭包含 renderer/${name}`)
  }
  assert.ok(seen.size >= 3, `闭包非平凡（实 ${seen.size} 档）`)
  assert.deepEqual([...builtins], [], `渲染面零 node: 内置（实 = ${[...builtins].join(", ")}）`)
  assert.deepEqual([...bare], [], `渲染面零裸包 / 零 @thincoder/core（实 = ${[...bare].join(", ")}）`)
})

// ─── U6 判红正证（内存合成源）──────────────────────────────────

test("U6: 违规样本判红 + `/rc/` 前缀白名单放行（内存合成源 · 不写盘）", () => {
  const cases = [
    ['import { x } from "node:fs"', "node:fs"],
    ['export { y } from "node:path"', "node:path"],
    ['import "node:test"', "node:test"],
    ['import { x } from "@thincoder/core/i18n.mjs"', "@thincoder/core/i18n.mjs"],
    ['import { x } from "@thincoder/render-core/md.mjs"', "@thincoder/render-core/md.mjs"],
    ['import { x } from "electron"', "electron"],
  ]
  for (const [source, expected] of cases) {
    const { builtins, bare } = classifySpecifiers(staticSpecifiers(source))
    assert.ok(builtins.has(expected) || bare.has(expected), `样本须判红：${source}`)
  }
  const ok = classifySpecifiers(staticSpecifiers('import { setBoot } from "./dom.mjs"'))
  assert.deepEqual([...ok.builtins], [], "合法样本零内置")
  assert.deepEqual([...ok.bare], [], "合法样本零裸包")
  // R1 双根白名单：`/rc/` 前缀放行（核经 `app://` 第二根取）；裸包名仍判红（禁令不变）。
  const rcOk = classifySpecifiers(staticSpecifiers('import { md } from "/rc/md.mjs"'))
  assert.deepEqual([...rcOk.rc], ["/rc/md.mjs"], "`/rc/` 前缀命中白名单")
  assert.deepEqual([...rcOk.bare], [], "白名单样本零裸包")
  const rcBare = classifySpecifiers(staticSpecifiers('import { md } from "@thincoder/render-core/md.mjs"'))
  assert.deepEqual([...rcBare.rc], [], "裸名不命中前缀白名单")
  assert.deepEqual([...rcBare.bare], ["@thincoder/render-core/md.mjs"], "核经裸包名取 ⇒ 仍判红")
})

// ─── U7 零内联脚本 + CSP ───────────────────────────────────────

test("U7: 渲染面零内联脚本 + CSP 无 unsafe-*", () => {
  const html = readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8")
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  assert.ok(scripts.length > 0, "模块脚本入口在位（零脚本 = 渲染面不跑）")
  for (const [, attrs, body] of scripts) {
    assert.equal(body.trim(), "", `脚本体须空（实 = ${body.trim().slice(0, 40)}）`)
    assert.match(attrs, /\bsrc=/, "脚本须走外链（内联 = CSP 面外）")
  }
  const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)
  assert.ok(csp, "CSP meta 在位")
  assert.ok(!/unsafe-(inline|eval)/.test(csp[1]), `CSP 零 unsafe-*（实 = ${csp[1]}）`)
  assert.match(csp[1], /script-src 'self'/, "脚本源 = 'self'")
})
