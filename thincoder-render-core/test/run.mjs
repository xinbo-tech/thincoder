/**
 * run.mjs — 核包统一测试入口（单一 `npm test` 全绿门禁；镜像 `thincoder-core/test/run.mjs` 形——
 * 单层 glob + 双向 fail-closed）。目标 = `test/*.test.mjs`（全量跑，无 skip）。
 *
 * 启动前自检（fail-closed——收集面反向判据，先于 node --test 启动）：②' 无漏收集——`test/`
 * 树递归全部 *.test.mjs 须被上面单层 glob 命中（嵌套档永不执行 ⇒ 反查即失败）。
 * ②'' 软链目录拒绝：junction 的 Dirent 报 isSymbolicLink ∧ !isDirectory（递归与 glob 都穿不过
 * ⇒ 其中 *.test.mjs 永不执行却零告警）——检出即 fail（不跟遍历 · 避环）；软链文件不受影响。
 * ③ 包面自检（C1 常驻机检）：零 dependencies / devDependencies；核内 import 面只含核内相对路径 +
 *   `node:`（**递归全树**——R2 起含 flow/ cards/ subblocks/ 与 test/；非递归旧形会放过嵌套目录）。
 * ④ 全档语法面（C1 机检面之 `node --check`——递归全树；无用例/无消费的构件档也只有这层常驻防线）。
 */
import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const fail = (msg) => {
  console.error(`✖ test manifest check failed: ${msg}`)
  process.exit(1)
}

// ②' 无漏收集（收集面 = test/<name>.test.mjs 单层 glob）
const onDisk = []
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = `${rel}/${e.name}`
    if (e.isDirectory()) walk(p)
    // 软链目录（junction）：不拒绝就在这里静默漏收集——拒绝制把沉默洞变响铃
    else if (e.isSymbolicLink() && statSync(join(root, p), { throwIfNoEntry: false })?.isDirectory()) {
      fail(`symlinked directory under test/ — collection cannot verify through it (the single-level glob never descends into it); unlink it or move your tests up: ${p}`)
    } else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test")
for (const rel of onDisk) {
  if (rel.slice(0, rel.lastIndexOf("/")) !== "test") {
    fail(`uncollected test file (move it up into test/ — this runner collects a single level; an uncollected file is never executed): ${rel}`)
  }
}

// ③ 包面自检（C1 机检面常驻化）：零依赖 + 核内 import 面只含核内相对路径 + `node:`（递归全树）
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
for (const k of ["dependencies", "devDependencies"]) {
  const v = pkg[k]
  if (v && Object.keys(v).length > 0) fail(`package.json declares ${k} — the render core is zero-dependency: ${JSON.stringify(v)}`)
}
const IMPORT_RE = /^\s*(?:import|export)\b[^"'\n]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm
const mjsFiles = []
const walkMjs = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = rel === "" ? e.name : `${rel}/${e.name}`
    if (e.isDirectory()) walkMjs(p)
    else if (e.name.endsWith(".mjs")) mjsFiles.push(p)
  }
}
walkMjs("")
for (const f of mjsFiles) {
  for (const m of readFileSync(join(root, f), "utf8").matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2]
    if (!spec.startsWith(".") && !spec.startsWith("node:")) {
      fail(`non-core import in ${f}: ${JSON.stringify(spec)} (core imports are core-relative paths or node: builtins only)`)
    }
  }
}

// ④ 全档语法面（C1：核档内 .mjs 全档 `node --check` 过——递归全树，与 ③ 同收集面）
for (const f of mjsFiles) {
  const r = spawnSync(process.execPath, ["--check", join(root, f)], { encoding: "utf8" })
  if (r.status !== 0) fail(`node --check failed: ${f}\n${String(r.stderr ?? "").trim()}`)
}

// 空清单守卫（2026-09-28 全清重置：零用例即绿——不走 node --test 免触自动发现）
if (onDisk.length === 0) {
  console.log("ℹ test manifest is empty — zero tests = green (2026-09-28 full reset).")
  process.exit(0)
}

// execPath 可能含空格（C:\Program Files\...）——spawn + shell:true 时必须整体加引号
const r = spawnSync(`"${process.execPath}"`, ["--test", "test/*.test.mjs"], { stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
