/**
 * run.mjs — 核包统一测试入口（单一 `npm test` 全绿门禁；镜像 `thincoder-core/test/run.mjs` 形——
 * 单层 glob + 双向 fail-closed）。目标 = `test/*.test.mjs`（全量跑，无 skip）。
 *
 * 启动前自检（fail-closed——收集面反向判据，先于 node --test 启动）：②' 无漏收集——`test/`
 * 树递归全部 *.test.mjs 须被上面单层 glob 命中（嵌套档永不执行 ⇒ 反查即失败）。
 * ②'' 软链目录拒绝：junction 的 Dirent 报 isSymbolicLink ∧ !isDirectory（递归与 glob 都穿不过
 * ⇒ 其中 *.test.mjs 永不执行却零告警）——检出即 fail（不跟遍历 · 避环）；软链文件不受影响。
 * ③ 包面自检（C1 常驻机检）：零 dependencies / devDependencies；核内 import 面只含核内相对路径 + `node:`。
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

// ③ 包面自检（C1 机检面常驻化）：零依赖 + 核内 import 面只含核内相对路径 + `node:`
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
for (const k of ["dependencies", "devDependencies"]) {
  const v = pkg[k]
  if (v && Object.keys(v).length > 0) fail(`package.json declares ${k} — the render core is zero-dependency: ${JSON.stringify(v)}`)
}
const IMPORT_RE = /^\s*(?:import|export)\b[^"'\n]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm
for (const f of readdirSync(root).filter((n) => n.endsWith(".mjs"))) {
  for (const m of readFileSync(join(root, f), "utf8").matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2]
    if (!spec.startsWith("./") && !spec.startsWith("node:")) {
      fail(`non-core import in ${f}: ${JSON.stringify(spec)} (core imports are core-relative paths or node: builtins only)`)
    }
  }
}

// execPath 可能含空格（C:\Program Files\...）——spawn + shell:true 时必须整体加引号
const r = spawnSync(`"${process.execPath}"`, ["--test", "test/*.test.mjs"], { stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
