/**
 * run.mjs — 统一测试入口（M10 测试纪律：单一 `npm test` 全绿门禁——2026-09-17）。
 * 目标 = `test/files.mjs`（单元清单）+ `test/integration/files.mjs`（集成清单）——
 * 非 .test.mjs 命名的 smoke 档（smoke-provider.mjs / smoke-settings.mjs）必须保持可跑，故用显式清单。
 * slow ≡ test（test/slow.mjs 纯别名——全量跑，无 skip）。
 * 命名 .mjs 而非 .test.mjs —— runner 只收集 *.test.mjs，本文件是启动器。
 *
 * 启动前自检（fail-closed——两清单契约的机械面，承接自原集成 runner）：
 *   ① 清单每项在盘（拼写错误明确失败，不落进 node --test 的"找不到文件"噪音）；
 *   ② 无漏登记（两域各查一侧：test/ 树递归分派——非 integration/ 判「∈ 单元清单」、
 *      integration/ 判「∈ 集成清单」；盘上未登记的 *.test.mjs 永不执行 ⇒ 反查即失败）；
 *   ③ 零混入：集成档不得出现在单元清单 test/files.mjs。
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import integrationFiles from "./integration/files.mjs"
import unitFiles from "./files.mjs"

const testDir = dirname(fileURLToPath(import.meta.url))
const root = join(testDir, "..")
const fail = (msg) => {
  console.error(`✖ test manifest check failed: ${msg}`)
  process.exit(1)
}

// ① 清单在盘
for (const [layer, files] of [["unit", unitFiles], ["integration", integrationFiles]]) {
  for (const f of files) {
    if (!existsSync(join(root, f))) fail(`listed ${layer} file does not exist: ${f}`)
  }
}
// ② 无漏登记（两域各查一侧——test/ 树递归分派；盘上未登记的 *.test.mjs 永不执行）
const unit = new Set(unitFiles)
const integration = new Set(integrationFiles)
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
  if (rel.startsWith("test/integration/")) {
    if (!integration.has(rel)) fail(`unregistered integration file (register it in test/integration/files.mjs — an unregistered file is never executed): ${rel}`)
  } else if (!unit.has(rel)) {
    fail(`unregistered unit file (register it in test/files.mjs — an unregistered file is never executed): ${rel}`)
  }
}
// ③ 零混入（单元清单与集成清单互不混入）
for (const f of integrationFiles) {
  if (unit.has(f)) fail(`integration file also listed in the unit manifest test/files.mjs — the two manifests must never mix: ${f}`)
}

const r = spawnSync(process.execPath, ["--test", ...unitFiles, ...integrationFiles], { stdio: "inherit" })
process.exit(r.status ?? 1)
