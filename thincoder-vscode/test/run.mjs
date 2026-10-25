/**
 * run.mjs — 统一测试入口（M10 测试纪律：单一 `npm test` 全绿门禁——2026-09-17）。
 * 目标 = `test/files.mjs`（单元清单）；集成测试集已归仓根 `test/integration/`
 * （仓根单入口 `node test/run.mjs`——§12），本包不再持集成清单面。
 * 非 .test.mjs 命名的 smoke 档（smoke-provider.mjs / smoke-settings.mjs）必须保持可跑，故用显式清单。
 * slow ≡ test（test/slow.mjs 纯别名——照跑，无 skip）。
 * 命名 .mjs 而非 .test.mjs —— runner 只收集 *.test.mjs，本文件是启动器。
 *
 * 启动前自检（fail-closed——清单契约的机械面）：
 *   ① 清单每项在盘（拼写错误明确失败，不落进 node --test 的"找不到文件"噪音）；
 *   ② 无漏登记（test/ 树递归——盘上未登记的 *.test.mjs 永不执行 ⇒ 反查即失败）；
 *   ③ 软链目录拒绝：junction 的 Dirent 报 isSymbolicLink ∧ !isDirectory（上面的 walk 穿不过
 *      ⇒ 其中 *.test.mjs 永不执行却零告警）——检出即 fail（不跟遍历 · 避环）；软链文件不受影响。
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import unitFiles from "./files.mjs"

const testDir = dirname(fileURLToPath(import.meta.url))
const root = join(testDir, "..")
const fail = (msg) => {
  console.error(`✖ test manifest check failed: ${msg}`)
  process.exit(1)
}

// ① 清单在盘
for (const f of unitFiles) {
  if (!existsSync(join(root, f))) fail(`listed unit file does not exist: ${f}`)
}
// ② 无漏登记（test/ 树递归；盘上未登记的 *.test.mjs 永不执行）
const unit = new Set(unitFiles)
const onDisk = []
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = `${rel}/${e.name}`
    if (e.isDirectory()) walk(p)
    // 软链目录（junction）：不拒绝就在这里静默漏收集——拒绝制把沉默洞变响铃
    else if (e.isSymbolicLink() && statSync(join(root, p), { throwIfNoEntry: false })?.isDirectory()) {
      fail(`symlinked directory under test/ — collection cannot verify through it (the manifest check walks this same tree and never descends into it); unlink it or move its tests up: ${p}`)
    } else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test")
for (const rel of onDisk) {
  if (!unit.has(rel)) {
    fail(`unregistered unit file (register it in test/files.mjs — an unregistered file is never executed): ${rel}`)
  }
}

// 空清单守卫（2026-09-28 全清重置：零用例即绿——不走 node --test 免触自动发现）
if (unitFiles.length === 0) {
  console.log("ℹ test manifest is empty — zero tests = green (2026-09-28 full reset).")
  process.exit(0)
}
const r = spawnSync(process.execPath, ["--test", ...unitFiles], { stdio: "inherit" })
process.exit(r.status ?? 1)
