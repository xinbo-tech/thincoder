/**
 * 2026-09-29-residuals-round2-desktop.test.mjs —— 批件 · 波 3（桌面面）· 腿 L5（#578③）
 *
 * 判据单源 = `docs/batches/2026-09-29-residuals-round2.md` §2「#578 · 桌面面（复核 + 残点）」：
 *   残句「设计档收正归设计面轮」四包码面 = 0 命中——扫域 = thincoder-core ∕ thincoder-cli ∕
 *   thincoder-vscode ∕ thincoder-desktop 的 *.mjs ∕ *.js ∕ *.cjs；排 `.thincoder/tmp` 与 `_archive`。
 *   加锚（同腿）：`thincoder-desktop/src/main/file-links.mjs` 括注余句 = 事实句在 ∕ 死指向零。
 *
 * 复跑（从仓根）：node --test docs/batches/2026-09-29-residuals-round2-desktop.test.mjs
 * 立即位 = `.thincoder/tmp/2026-09-29-residuals-round2-desktop.test.mjs`（#545 立即形——父侧 copy 终位）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { basename, dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const RESIDUAL = "设计档收正归设计面轮"
const PACKAGES = ["thincoder-core", "thincoder-cli", "thincoder-vscode", "thincoder-desktop"]
const CODE_EXT = [".mjs", ".js", ".cjs"]
const SKIP_DIRS = new Set(["node_modules", ".git", "_archive"])

/** 仓根 = 自本档上溯至含全部四包目录的一级（兼容立即位 `.thincoder/tmp` ∕ 终位 `docs/batches`）。 */
function repoRoot() {
  let dir = dirname(fileURLToPath(import.meta.url))
  for (;;) {
    if (PACKAGES.every((p) => readdirSync(dir).includes(p))) return dir
    const up = dirname(dir)
    if (up === dir) throw new Error("repo root not found")
    dir = up
  }
}

/** 目录排除（判据扫域）：`_archive` + `.thincoder/tmp`（仅 tmp 段——`.thincoder` 其他子面不在排除之列）；node_modules ∕ .git 同排。 */
function isExcludedDir(name, parentName) {
  if (SKIP_DIRS.has(name)) return true
  return name === "tmp" && parentName === ".thincoder"
}

/** 递归收集码面文件（排 `.thincoder/tmp` 与 `_archive`）。 */
function collectCodeFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (isExcludedDir(entry.name, basename(dir))) continue
      collectCodeFiles(full, out)
    } else if (CODE_EXT.some((ext) => entry.name.endsWith(ext))) out.push(full)
  }
  return out
}

test("L5：四包码面残句「设计档收正归设计面轮」= 0 命中（#578③）", () => {
  const root = repoRoot()
  const hits = []
  let scanned = 0
  for (const pkg of PACKAGES) {
    for (const file of collectCodeFiles(join(root, pkg))) {
      scanned++
      if (readFileSync(file, "utf8").includes(RESIDUAL)) hits.push(relative(root, file).replace(/\\/g, "/"))
    }
  }
  assert.ok(scanned >= 300, `扫域异常（仅 ${scanned} 档）——查排除逻辑（防空扫假绿）`)
  assert.deepEqual(hits, [], `残句仍在（${hits.length} 处）：\n${hits.join("\n")}`)
})

test("L5 锚：#578③ 括注余句（「核件单源」事实句在 ∕ 死指向零）", () => {
  const root = repoRoot()
  const lines = readFileSync(join(root, "thincoder-desktop/src/main/file-links.mjs"), "utf8").split(/\r?\n/)
  const line = lines.find((l) => l.includes("@thincoder/core/file-links.mjs") && l.includes("单源"))
  assert.ok(line, "括注余句（核件单源事实句）不在")
  assert.ok(!line.includes(RESIDUAL), "死指向未删净")
})
