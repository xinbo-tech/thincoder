#!/usr/bin/env node
/**
 * scripts/check-vsix.mjs — vsix 含核断言（T-C7 vsix 域：断言 B + D + E + F——CORE-UNIFICATION N4/N5/F7/F8；E = 撞帽检查点接线 · 2026-09-26；F = 渲染核 · R1）。
 *
 * 零构建 · 只读：解 vsix 逐条断言，任何一条不过即 exit 1（fail-closed——vsce 自身对
 * 「成功但无核 / 缺提示词档」的静默产物 exit 0，R6/R8①/R12 实证 ⇒ 必须断言化）。
 *   断言 B（含核 + 版本逐字相等）：vsix 内 `extension/node_modules/@thincoder/core/package.json`
 *     存在，且其 `version` 逐字等于仓内 `thincoder-core/package.json` 的 `version`。
 *   断言 F（渲染核含核 + 版本逐字相等 · R1）：vsix 内 `extension/node_modules/@thincoder/render-core/package.json`
 *     存在，且其 `version` 逐字等于仓内 `thincoder-render-core/package.json` 的 `version`。
 *   断言 D（提示词面完备性）：vsix 内同目录 `prompts/` 16 档 + `tool-docs/` 50 档——
 *     ① 档数硬等设计口径（16 / 50）；② 档名集合逐字等于仓内 `thincoder-core/` 同名目录；③ 各档内容 sha256 等于仓内同档。
 *
 *   断言 E（撞帽检查点接线 · 2026-09-26 · F9② / T6）：vsix 内 `extension/node_modules/@thincoder/core/agent-tools/checkpoint.mjs`
 *     存在，且同目录 `subagent-run.mjs` 含 `registerTurnCapCheckpoint` 接线——防「仓内已修、运行面仍旧」（实盘教训）。
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
const RC = join(resolve(ROOT, ".."), "thincoder-render-core")
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
const CORE_PKG = JSON.parse(readFileSync(join(CORE, "package.json"), "utf8"))
const RC_PKG = JSON.parse(readFileSync(join(RC, "package.json"), "utf8"))
const arg = process.argv.slice(2).find((a) => !a.startsWith("--"))
const vsix = resolve(arg ?? join(ROOT, `${PKG.name}-${PKG.version}.vsix`))
if (!existsSync(vsix)) { console.error(`✘ vsix 不存在：${vsix}（先 \`npm run package\`）`); process.exit(1) }
const IN_VSIX = "extension/node_modules/@thincoder/core/"
const IN_VSIX_RC = "extension/node_modules/@thincoder/render-core/"
const EXPECT = { prompts: 16, "tool-docs": 50 } // 档数口径（T-C7 / `CORE-UNIFICATION.md` §2.8——枚举 16 + 50；prompts 由 15 收正为 16 = escalation-canon 批 · 父侧直接执行 · 可 revert；tool-docs 由 24 收正为 52 = #15 描述外置波后实盘计数 2026-09-29，复由 52 收正为 48 = ledger 统一入口批（#923）五退一增后实读 2026-10-05 · 父侧直接执行 · 可 revert；2026-10-08 收正为 50 = manifest-agent-tool 批（#1098）：仓内侧实读 49（10-05 后 +1 未随的既有漂移）∧ 本批工具描述档 +1 ⇒ 50 · 父侧直接执行 · 可 revert）
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

// 断言 F —— 含渲染核 + 版本逐字相等（R1 · render-core 加载管道：webview 以相对路径取核）
const rcEntry = entries.find((e) => e.fileName === `${IN_VSIX_RC}package.json`)
if (!rcEntry) bad(`断言 F：vsix 缺 ${IN_VSIX_RC}package.json（无渲染核——.vscodeignore 反排除行漏写？）`)
else {
  const got = JSON.parse((await readEntry(zip, rcEntry)).toString("utf8")).version
  if (got === RC_PKG.version) ok(`断言 F：vsix 含渲染核且版本逐字相等（@thincoder/render-core ${got}）`)
  else bad(`断言 F：vsix 内渲染核版本 ${got} ≠ 仓内 thincoder-render-core/package.json ${RC_PKG.version}`)
}

// 断言 E —— 打包核含撞帽检查点接线（2026-09-26 · F9② / T6）
//   防「仓内已修、运行面仍旧」：实盘教训 = 安装面冻结旧构建 ⇒ 撞帽静默续段。
const cpEntry = entries.find((e) => e.fileName === `${IN_VSIX}agent-tools/checkpoint.mjs`)
const srEntry = entries.find((e) => e.fileName === `${IN_VSIX}agent-tools/subagent-run.mjs`)
if (!cpEntry) bad(`断言 E：vsix 缺 ${IN_VSIX}agent-tools/checkpoint.mjs（撞帽检查点未打包）`)
else if (!srEntry) bad(`断言 E：vsix 缺 ${IN_VSIX}agent-tools/subagent-run.mjs`)
else {
  const wired = (await readEntry(zip, srEntry)).toString("utf8").includes("registerTurnCapCheckpoint")
  if (wired) ok("断言 E：打包核含撞帽检查点接线（checkpoint.mjs 在场 + subagent-run.mjs 已接线）")
  else bad(`断言 E：${IN_VSIX}agent-tools/subagent-run.mjs 未见 registerTurnCapCheckpoint（接线缺失——旧构建打包？）`)
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
console.log(failures.length ? `\n✘ check-vsix：${failures.length} 条断言失败` : "\n✔ check-vsix：断言 B + D + E + F 全过")
process.exit(failures.length ? 1 : 0)
