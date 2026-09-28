/**
 * run.mjs — 单测试入口（`docs/desktop/design/PROJECT.md` §4.1）：清单 ↔ 盘上**两向自检** + `node --test` 派发。
 * 显式清单而非通配：盘上未登记的 `*.test.mjs` 永不执行 ⇒ 反查即失败（蓝本 = `thincoder-vscode/test/run.mjs`）。
 * 清单 = 单元域 + 集成域（`test/integration/` 真进程用例）同册；软链目录（junction）遍历穿不过 ⇒ 出错即判红（不静默漏收集）。
 * 命名 `.mjs` 而非 `.test.mjs`——runner 只收集 `*.test.mjs`，本档是启动器。
 * **R3b**：`--import test/rc-resolve.mjs`（`/rc/` 渲染取核路径的平 node 解析钩子 —— 渲染档在测试与生产下走
 *  同一份核件；不预载 ⇒ 引入核件的渲染档 import 即 `ERR_MODULE_NOT_FOUND`）。
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import unitFiles from "./files.mjs"

const testDir = dirname(fileURLToPath(import.meta.url))
const root = join(testDir, "..")
const fail = (message) => {
  console.error(`✖ test manifest check failed: ${message}`)
  process.exit(1)
}

// ① 清单每项在盘（拼写错误明确失败，不落进 node --test 的"找不到文件"噪音）
for (const file of unitFiles) {
  if (!existsSync(join(root, file))) fail(`listed file does not exist: ${file}`)
}

// ② 无漏登记（盘上未登记 ⇒ 永不执行却零告警）
const listed = new Set(unitFiles)
const walk = (rel) => {
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const path = `${rel}/${entry.name}`
    if (entry.isDirectory()) walk(path)
    else if (entry.isSymbolicLink() && statSync(join(root, path), { throwIfNoEntry: false })?.isDirectory()) {
      fail(`symlinked directory under test/ — collection cannot verify through it: ${path}`)
    } else if (entry.name.endsWith(".test.mjs") && !listed.has(path)) {
      fail(`unregistered test file (register it in test/files.mjs — an unregistered file is never executed): ${path}`)
    }
  }
}
walk("test")

// 空清单守卫（2026-09-28 全清重置：零用例即绿——不走 node --test 免触自动发现）
if (unitFiles.length === 0) {
  console.log("ℹ test manifest is empty — zero tests = green (2026-09-28 full reset).")
  process.exit(0)
}

const result = spawnSync(process.execPath, ["--import", pathToFileURL(join(testDir, "rc-resolve.mjs")).href, "--test", ...unitFiles], { stdio: "inherit" })
process.exit(result.status ?? 1)
