/**
 * run.mjs — 单测试入口（`docs/desktop/design/PROJECT.md` §4.1）：清单 ↔ 盘上**两向自检** + `node --test` 派发。
 * 显式清单而非通配：盘上未登记的 `*.test.mjs` 永不执行 ⇒ 反查即失败（蓝本 = `thincoder-vscode/test/run.mjs`）。
 * 本批无集成域（不建 `test/integration/`）⇒ 只落单元清单；软链目录（junction）遍历穿不过 ⇒ 出错即判红（不静默漏收集）。
 * 命名 `.mjs` 而非 `.test.mjs`——runner 只收集 `*.test.mjs`，本档是启动器。
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
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

const result = spawnSync(process.execPath, ["--test", ...unitFiles], { stdio: "inherit" })
process.exit(result.status ?? 1)
