/**
 * run.mjs — 统一测试入口（M10 测试纪律：单一 `npm test` 全绿门禁——2026-09-17）。
 * 目标 = `test/*.test.mjs`（单层 glob）；slow ≡ test（test/slow.mjs 纯别名——全量跑，无 skip）。
 * 命名 .mjs 而非 .test.mjs —— runner 只收集 *.test.mjs，本文件是启动器。
 *
 * 启动前自检（fail-closed——收集面反向判据，先于 node --test 启动）：②' 无漏收集——`test/`
 * 树递归全部 *.test.mjs 须被上面单层 glob 命中（嵌套档永不执行 ⇒ 反查即失败）。
 */
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
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
    else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test")
for (const rel of onDisk) {
  if (rel.slice(0, rel.lastIndexOf("/")) !== "test") {
    fail(`uncollected test file (move it up into test/ — this runner collects a single level; an uncollected file is never executed): ${rel}`)
  }
}

// execPath 可能含空格（C:\Program Files\...）——spawn + shell:true 时必须整体加引号
const r = spawnSync(`"${process.execPath}"`, ["--test", "test/*.test.mjs"], { stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
