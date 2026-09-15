#!/usr/bin/env node
/**
 * scripts/check-vsix.mjs — vsix 含核断言（T-C7 vsix 域：断言 B + D——CORE-UNIFICATION N4/N5/F7/F8）。
 *
 * 零构建 · 只读：解 vsix 逐条断言，任何一条不过即 exit 1（fail-closed——vsce 自身对
 * 「成功但无核 / 缺提示词档」的静默产物 exit 0，R6/R8①/R12 实证 ⇒ 必须断言化）。
 *   断言 B（含核 + 版本逐字相等）：vsix 内 `extension/node_modules/@thincoder/core/package.json`
 *     存在，且其 `version` 逐字等于仓内 `thincoder-core/package.json` 的 `version`。
 *   断言 D（提示词面完备性）：vsix 内同目录 `prompts/` 15 档 + `tool-docs/` 25 档——
 *     ① 档数硬等设计口径（15 / 25）；② 档名集合逐字等于仓内 `thincoder-core/` 同名目录；③ 各档内容 sha256 等于仓内同档。
 *
 * Usage: node scripts/check-vsix.mjs [<vsix>]   # 缺省 = <root>/<name>-<version>.vsix
 * Exit: 0 = 断言全过 · 1 = 任一断言失败（逐条打印）
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import yauzl from "yauzl"

const ROOT = fileURLToPath(new URL("..", import.meta.url)) // thincoder-vscode/
const CORE = join(resolve(ROOT, ".."), "thincoder-core")
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
const CORE_PKG = JSON.parse(readFileSync(join(CORE, "package.json"), "utf8"))
const arg = process.argv.slice(2).find((a) => !a.startsWith("--"))
const vsix = resolve(arg ?? join(ROOT, `${PKG.name}-${PKG.version}.vsix`))
if (!existsSync(vsix)) { console.error(`✘ vsix 不存在：${vsix}（先 \`npm run package\`）`); process.exit(1) }
const IN_VSIX = "extension/node_modules/@thincoder/core/"
const EXPECT = { prompts: 15, "tool-docs": 25 } // 档数口径（T-C7 / `CORE-UNIFICATION.md` §2.8 :1057——枚举 15 + 25）
const sha = (buf) => createHash("sha256").update(buf).digest("hex")

const failures = []
const ok = (m) => console.log(`✔ ${m}`)
const bad = (m) => { failures.push(m); console.error(`✘ ${m}`) }

/** 解包面（lazyEntries + autoClose 关——枚举后仍可按条目取流）。 */
const openZip = (p) => new Promise((res, rej) => yauzl.open(p, { lazyEntries: true, autoClose: false }, (e, z) => (e ? rej(e) : res(z))))
const listEntries = (z) => new Promise((res, rej) => { const out = []; z.on("entry", (e) => { out.push(e); z.readEntry() }); z.on("error", rej); z.on("end", () => res(out)); z.readEntry() })
const readEntry = (z, e) => new Promise((res, rej) => z.openReadStream(e, (err, s) => { if (err) return rej(err); const c = []; s.on("data", (d) => c.push(d)); s.on("end", () => res(Buffer.concat(c))); s.on("error", rej) }))
/** 档名 → sha256 表（仓内目录 / vsix 内目录各一版）。 */
const repoFace = (dir) => new Map(readdirSync(join(CORE, dir)).filter((f) => f.endsWith(".md")).map((f) => [f, sha(readFileSync(join(CORE, dir, f)))]))
const vsixFace = async (z, entries, dir) => { const pre = `${IN_VSIX}${dir}/`; const m = new Map(); for (const e of entries.filter((x) => x.fileName.startsWith(pre) && x.fileName.endsWith(".md"))) m.set(e.fileName.slice(pre.length), sha(await readEntry(z, e))); return m }

const zip = await openZip(vsix).catch((e) => { console.error(`✘ vsix 无法解包：${vsix}（${e.message}）`); process.exit(1) })
const entries = await listEntries(zip)
ok(`vsix 已解包：${vsix}（${entries.length} 条目）`)

// 断言 B —— 含核 + 版本逐字相等
const coreEntry = entries.find((e) => e.fileName === `${IN_VSIX}package.json`)
if (!coreEntry) bad(`断言 B：vsix 缺 ${IN_VSIX}package.json（无核——.vscodeignore 反排除行漏写？）`)
else {
  const got = JSON.parse((await readEntry(zip, coreEntry)).toString("utf8")).version
  if (got === CORE_PKG.version) ok(`断言 B：vsix 含核且版本逐字相等（@thincoder/core ${got}）`)
  else bad(`断言 B：vsix 内核版本 ${got} ≠ 仓内 thincoder-core/package.json ${CORE_PKG.version}`)
}

// 断言 D —— 提示词面完备性（档名集合逐字 + 同档 sha256）
for (const dir of ["prompts", "tool-docs"]) {
  const repo = repoFace(dir)
  const packed = await vsixFace(zip, entries, dir)
  const missing = [...repo.keys()].filter((k) => !packed.has(k))
  const extra = [...packed.keys()].filter((k) => !repo.has(k))
  const differs = [...repo.keys()].filter((k) => packed.has(k) && packed.get(k) !== repo.get(k))
  const label = `断言 D/${dir}（仓内 ${repo.size} 档 · 口径 ${EXPECT[dir]}）`
  if (repo.size === EXPECT[dir] && !missing.length && !extra.length && !differs.length) ok(`${label}：档数达标 + 档名集合逐字相等 + sha256 逐档相同`)
  else bad(`${label}：仓内侧档数不符 [${repo.size}] · 缺 [${missing.join(",")}] · 多 [${extra.join(",")}] · 内容异 [${differs.join(",")}]`)
}

zip.close()
console.log(failures.length ? `\n✘ check-vsix：${failures.length} 条断言失败` : "\n✔ check-vsix：断言 B + D 全过")
process.exit(failures.length ? 1 : 0)
