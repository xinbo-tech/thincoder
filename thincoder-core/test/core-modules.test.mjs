/**
 * core-modules.test.mjs — 核内**模块可加载性**机检（CORE-UNIFICATION T-C4 / T-C15 / N3）。
 *
 * 行为面判据（不是散文锚）：核内每一个 `.mjs` 模块都能被**独立导入**——导入即执行模块顶层
 * （含工具描述 / 提示词的**加载面**：`tools/*.mjs` 顶层经 `DESC()` 取档），故本档同时守住
 * 「工具描述与槽位档已随核在位」这条 T-C8 的**可运行**形态。
 *
 * 内核不依赖任何产品树：本档在 `thincoder-core/` 内 `node --test` 独立跑绿即为证。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== "test") walk(p, out) }
    else if (name.endsWith(".mjs")) out.push(p)
  }
  return out
}

slow("every core module imports cleanly (no product tree, no missing prompt/tool-doc file)", async () => {
  const files = walk(ROOT).sort()
  assert.ok(files.length > 100, `expected the extracted core surface, found ${files.length} modules`)
  const failures = []
  for (const file of files) {
    try {
      await import(pathToFileURL(file).href)
    } catch (e) {
      failures.push(`${relative(ROOT, file)} :: ${String(e?.message ?? e).split("\n")[0]}`)
    }
  }
  assert.deepEqual(failures, [], `core modules that failed to load:\n${failures.join("\n")}`)
})
