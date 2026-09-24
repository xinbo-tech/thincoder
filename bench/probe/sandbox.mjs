/**
 * probe/sandbox.mjs — 探针沙箱（设计 §10.9-② · §10.3-5 · §10.7 路径口径）。
 *
 * 根 = **系统临时根下 · 仓外**（被否：仓内 `.thcoder/tmp/`——外层仓可发现 ⇒ git 工具可触真实仓）
 * + **非 git 仓**（物化前自检：沙箱根向上无 `.git`——破则报基建错误）。
 * 落盘判据 = 沙箱树前后快照 diff（磁盘事实——KD-43）；清运策略 = 缺省留档 · `--dry-run` 不留。
 */

import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative } from "node:path"

/** 沙箱根前缀（系统临时根下）。 */
export const SANDBOX_PREFIX = "thincoder-probe-"

/** 物化前自检（§10.9-②）：沙箱根**向上**逐级无 `.git`——命中即抛（基建错误，拒跑）。
 *  口径 = 从沙箱根自身起向上至文件系统根（根自身由本模块新建，命中即异常环境）。 */
export function assertNoGitUpward(root) {
  let dir = root
  for (;;) {
    if (existsSync(join(dir, ".git"))) {
      throw new Error(`探针沙箱自检失败：${dir} 处存在 .git（沙箱根向上不得有 git 仓——§10.9-②；改用仓外系统临时根）`)
    }
    const parent = dirname(dir)
    if (parent === dir) return true
    dir = parent
  }
}

/** 建探针基线沙箱根（一报告一根；各 run 住其下 `run-<n>` 子目录——§10.3-1 cwd = 沙箱根）；返回绝对根路径。 */
export function createSandbox({ prefix = SANDBOX_PREFIX } = {}) {
  const root = mkdtempSync(join(tmpdir(), prefix))
  assertNoGitUpward(root)
  return root
}

/** 单 run 沙箱目录（基线根下——树物化 / 快照 / diff 均对本目录）。 */
export function runSandbox(base, index) {
  return join(base, `run-${index}`)
}

/** 物化沙箱树（`files` = `{path, content}` 数组；path = 沙箱内相对形态）。返回写入档数。 */
export function materialize(root, files) {
  for (const f of files) {
    const abs = join(root, f.path)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, f.content, "utf8")
  }
  return files.length
}

/** 树快照：`Map<沙箱内相对路径（/ 分隔）, 字节数>`（目录不入）。 */
export function snapshot(root) {
  const out = new Map()
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name)
      if (e.isDirectory()) walk(abs)
      else if (e.isFile()) out.set(relative(root, abs).replaceAll("\\", "/"), statSync(abs).size)
    }
  }
  walk(root)
  return out
}

/** 前后快照 diff（落盘判据——KD-43）：新增 / 改动两态（`{path, bytes, change}`，按路径序）。未变不入。 */
export function diffSnapshots(before, after) {
  const out = []
  for (const [path, bytes] of after) {
    if (!before.has(path)) out.push({ path, bytes, change: "added" })
    else if (before.get(path) !== bytes) out.push({ path, bytes, change: "modified" })
  }
  return out.sort((a, b) => a.path.localeCompare(b.path))
}

/** 清运（`--dry-run` 不留；缺省留档——§10.10）。 */
export function removeSandbox(root) {
  rmSync(root, { recursive: true, force: true })
}

/** 入档形态（§10.7）：`<sandbox>/<基名>` 占位——物理根（系统临时根）不入档。 */
export function sandboxDisplay(root) {
  return `<sandbox>/${root.replaceAll("\\", "/").split("/").filter(Boolean).pop() ?? ""}`
}
