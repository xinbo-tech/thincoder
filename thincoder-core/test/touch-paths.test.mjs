/**
 * touch-paths.test.mjs — 单源谓词 `toolTouchPaths`（#327 · `docs/core/design/TOOLS.md` §6.17 / D-TO12）：
 * 用例 T1–T5（正常 / 边界 / 错误——恒数组 · 恒零抛 · `args` 规范化）+ 消费面一例（peer-domains 原裸抛点）
 * + AC-1 单源结构机检（两条具名谓词——扫描面 = `thincoder-core/**`（除 `test/**`）+ `thincoder-vscode/src/**`）。
 * 判据面 = 谓词本体（无 fs / 无网络）；结构机检读源码（先例 = `thincoder-core/test/write-path.test.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { toolTouchPaths } from "../agent/helpers.mjs"
import { editTool } from "../tools/file.mjs"
import { peerWriteTargets } from "../peer-domains.mjs"

test("T1 正常：有钩子 ⇒ 钩子裁决（edit 单形态 path）", () => {
  assert.deepEqual(toolTouchPaths(editTool, { path: "a.txt", old_string: "x", new_string: "y" }), ["a.txt"])
})

test("T2 边界：无钩子工具 ⇒ 单参兜底（形态零变）", () => {
  assert.deepEqual(toolTouchPaths({ name: "x" }, { path: "a" }), ["a"])
})

test("T3 边界：非字符串项**不过滤**（未知路径的保守判据归门禁自身——T-22 语义）", () => {
  assert.deepEqual(toolTouchPaths({ name: "x", touchedPaths: () => [undefined] }, { path: "a" }), [undefined])
  assert.deepEqual(toolTouchPaths({ name: "x", touchedPaths: () => ["a", 42] }, { path: "a" }), ["a", 42])
  assert.deepEqual(toolTouchPaths({ name: "x", touchedPaths: () => [] }, { path: "a" }), [])
})

test("T4 错误：args = null / 非对象 ⇒ 规范化为 {} 再裁决（零抛——两态）", () => {
  // 态①（有钩子）：钩子收到 {}——不再对 null 裸解引用（#327 前裸抛根因）
  let seen = "unset"
  const hooked = { name: "h", touchedPaths: (a) => { seen = a; return a.path ? [a.path] : [] } }
  assert.deepEqual(toolTouchPaths(hooked, null), [])
  assert.deepEqual(seen, {})
  assert.deepEqual(toolTouchPaths(hooked, "not-an-object"), [])
  assert.deepEqual(toolTouchPaths(hooked, 42), [])
  // 态②（无钩子）：[args.path] 兜底形恒返单元素数组（缺 path ⇒ [undefined]——形态零变）
  assert.deepEqual(toolTouchPaths({ name: "x" }, null), [undefined])
  assert.deepEqual(toolTouchPaths({ name: "x" }, "not-an-object"), [undefined])
})

test("T5 错误：钩子 throw / 返回非数组 ⇒ []（恒数组）", () => {
  assert.deepEqual(toolTouchPaths({ name: "b", touchedPaths: () => { throw new TypeError("boom") } }, { path: "a" }), [])
  for (const bad of ["x", 42, {}, null, undefined, true]) {
    assert.deepEqual(toolTouchPaths({ name: "b", touchedPaths: () => bad }, { path: "a" }), [])
  }
  // 工具对象缺席（undefined / 无钩子属性）同样零抛
  assert.deepEqual(toolTouchPaths(undefined, null), [undefined])
})

test("T5b 消费面：#327 后 peerWriteTargets 畸形入参零裸抛（原裸抛点收口，行为面同判）", () => {
  const W = "C:/w"
  const hooked = { name: "write", touchedPaths: (a) => [a.path] }
  assert.doesNotThrow(() => peerWriteTargets(hooked, null, W))
  assert.deepEqual(peerWriteTargets(hooked, null, W), [], "畸形入参 ⇒ 零目标（不再裸抛）")
  assert.deepEqual(peerWriteTargets({ name: "write" }, { path: "src/a.mjs" }, W), [resolve(W, "src/a.mjs")])
  assert.deepEqual(peerWriteTargets({ name: "file_ops" }, { source: "a", dest: "b" }, W), [resolve(W, "a"), resolve(W, "b")])
  assert.deepEqual(peerWriteTargets({ name: "file_ops" }, null, W), [])
})

// ─────────────────────────────────────────────────────────────────────────────
// AC-1 单源结构机检（扫描面 = thincoder-core/**（除 test/**）+ thincoder-vscode/src/**）
// ① 直调钩子 `\btouchedPaths\s*\(`：命中集 ⊆ {单源体, 钩子定义面}
// ② 内联提取 `\[\s*args\??\.path\s*\]`：命中集 ⊆ {单源体, 钩子定义面, git pathspec 组参}
// 允许集 = 实勘核准的**非消费点**面（钩子定义 / 单源体 / 无关同名形）；消费点零命中即判据本体。
// ─────────────────────────────────────────────────────────────────────────────

/** 递归收集 .mjs/.js（跳过 node_modules / 点目录）。 */
function scriptFiles(dir, out = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue
      scriptFiles(p, out)
    } else if (/\.(mjs|js)$/.test(e.name)) out.push(p)
  }
  return out
}

test("AC-1 结构机检：消费点零直调钩子 / 零内联提取式（十处一律走单源谓词）", () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const core = join(here, "..")
  const vscSrc = join(here, "..", "..", "thincoder-vscode", "src")
  const coreFiles = scriptFiles(core).filter((f) => !relative(core, f).replace(/\\/g, "/").startsWith("test/"))
  const files = [...coreFiles, ...scriptFiles(vscSrc)]
  assert.ok(files.length > 100, `扫描面须非空（防扫描面收窄空扫）：实扫 ${files.length} 档`)

  // 允许集（非消费点面——实勘核准）：钩子定义面 file.mjs / patch.mjs · 单源体 helpers.mjs ·
  // git.mjs（`git diff -- path` 组参形——与钩子无关的同名形）。
  const CALL_ALLOW = new Set(["agent/helpers.mjs", "tools/file.mjs", "tools/patch.mjs"])
  const INLINE_ALLOW = new Set(["agent/helpers.mjs", "tools/file.mjs", "tools/patch.mjs", "tools/git.mjs"])
  const CALL = /\btouchedPaths\s*\(/
  const INLINE = /\[\s*args\??\.path\s*\]/
  const hits = []
  for (const f of files) {
    const rel = relative(core, f).replace(/\\/g, "/")
    readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
      if (CALL.test(line) && !CALL_ALLOW.has(rel)) hits.push(`${rel}:${i + 1} [直调] ${line.trim()}`)
      if (INLINE.test(line) && !INLINE_ALLOW.has(rel)) hits.push(`${rel}:${i + 1} [内联] ${line.trim()}`)
    })
  }
  assert.deepEqual(hits, [], `单源违例（消费点须一律走 toolTouchPaths）:\n${hits.join("\n")}`)
})
