/**
 * run.mjs — 集成层测试入口（仓根单入口；§10.3 执行层分离 + §12 仓根归位）。
 * 目标集合 = 仓根 `test/integration/*.test.mjs`（单层 glob，零第二层）；单元测试档住
 * `docs/batches/`、`node --test <档>` 直达，不进本收集面，也不进任何门（F5）。
 * 命名 .mjs 而非 .test.mjs —— runner 只收集 *.test.mjs，本文件是启动器。
 *
 * 启动前自检（fail-closed——收集面反向判据，先于 node --test 启动）：SC-1 收集面反查——
 * 仓根 `test/` 树递归全部 *.test.mjs 须落在 `test/integration/`（收集面外档永不执行 ⇒ 反查即失败）。
 * SC-2 软链目录拒绝：junction 的 Dirent 报 isSymbolicLink ∧ !isDirectory（递归与 glob 都穿不过
 * ⇒ 其中 *.test.mjs 永不执行却零告警）——检出即 fail（不跟遍历 · 避环）；软链文件不受影响。
 */
import { spawnSync } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const fail = (msg) => {
  console.error(`✖ test manifest check failed: ${msg}`)
  process.exit(1)
}

// SC-1 收集面反查（收集面 = 仓根 test/integration/<name>.test.mjs 单层 glob）
const onDisk = []
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = `${rel}/${e.name}`
    if (e.isDirectory()) walk(p)
    // 软链目录（junction）：不拒绝就在这里静默漏收集——拒绝制把沉默洞变响铃
    else if (e.isSymbolicLink() && statSync(join(root, p), { throwIfNoEntry: false })?.isDirectory()) {
      fail(`symlinked directory under test/ — collection cannot verify through it (the integration glob never descends into it); unlink it or move its files out: ${p}`)
    } else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test")
for (const rel of onDisk) {
  if (rel.slice(0, rel.lastIndexOf("/")) !== "test/integration") {
    fail(`uncollected test file (unit test files live in docs/batches/ and run via node --test <file>): ${rel}`)
  }
}

// SC-5 空集守卫（空集不读作绿——零用例证明不了任何事）
if (onDisk.length === 0) {
  fail("no integration test set — zero cases proves nothing; batch unit tests live in docs/batches/ and run via node --test <file>.")
}

// execPath 可能含空格（C:\Program Files\...）——spawn + shell:true 时必须整体加引号
const r = spawnSync(`"${process.execPath}"`, ["--test", "test/integration/*.test.mjs"], { cwd: root, stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
