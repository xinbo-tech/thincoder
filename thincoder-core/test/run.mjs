/**
 * run.mjs — 核仓测试入口（§10.3 核仓口径：需求 N20——核仓不设集成测试集）。
 * 本 runner 无目标集合：不跑任何用例，只做收集面反查，然后如实说明「本包无集成测试集」
 * 并以非零退出（空集不读作绿——§10 F5）。单元测试档住 `docs/batches/`，`node --test <档>` 直达。
 * 命名 .mjs 而非 .test.mjs —— 本文件是启动器（核 runner 无目标集合，不收任何档）。
 *
 * 启动前自检（fail-closed，先于任何测试运行）：SC-1 收集面反查——`test/` 树递归任何
 * *.test.mjs 都是错位（零目标集合 ⇒ 没有档会被执行；落档即静默漏跑）。
 * SC-2 软链目录拒绝：junction 的 Dirent 报 isSymbolicLink ∧ !isDirectory——不跟遍历（避环），检出即 fail。
 */
import { readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const fail = (msg) => {
  console.error(`✖ test manifest check failed: ${msg}`)
  process.exit(1)
}

// SC-1 收集面反查（零目标集合：test/ 下任何 *.test.mjs 都在收集面外）
const onDisk = []
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = `${rel}/${e.name}`
    if (e.isDirectory()) walk(p)
    // 软链目录（junction）：不拒绝就在这里静默漏收集——拒绝制把沉默洞变响铃
    else if (e.isSymbolicLink() && statSync(join(root, p), { throwIfNoEntry: false })?.isDirectory()) {
      fail(`symlinked directory under test/ — collection cannot verify through it (this runner collects nothing); unlink it or move its files out: ${p}`)
    } else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test")
for (const rel of onDisk) {
  fail(`uncollected test file (unit test files live in docs/batches/ and run via node --test <file>): ${rel}`)
}

// SC-5 核仓面（常态出口）：无集成测试集 = 什么也没验——exit 1 如实，不跑用例、不打绿灯
console.error("✖ no integration test set — this package has none (requirement N20); node --test <file> runs batch unit tests. This run proves nothing.")
process.exit(1)
