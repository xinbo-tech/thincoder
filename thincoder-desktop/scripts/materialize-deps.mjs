#!/usr/bin/env node
/**
 * materialize-deps.mjs — 两核包物化（junction ⇒ 真目录 · 源树实拷）。
 *
 * 判由（单源 = `docs/desktop/design/PROJECT.md` §2 KD-64 ③ ∥ §5.2）：electron-builder 不 follow
 * symlink ∕ junction（junction 经 `lstat` 入账 ≢ directory ⇒ 不入递归队列；symlink 入 asar =
 * `{ type: "link" }` 节点 ⇒ 装后断链）⇒ 打包物化一律源自源树（`../thincoder-core` ∥
 * `../thincoder-render-core` 直读；排 `test/**` ∥ `.thincoder/**`）。
 *
 * 危险面（实测 2026-10-01）：`rmSync(recursive)` 会**穿透 junction 递归删除目标内容**——
 * 故删链位一律走 `unlinkSync`（只摘链，不进链内）；仅真目录（上轮物化残留）才递归删自身副本。
 *
 * 构建窗纪律（2026-10-02 实证 · 台账 #839）：物化 ∥ deps 还原前先确认桌面未在运行——运行中应用的
 * node_modules 被换 ⇒ 主进程冻结（须强杀重启）；先停应用再构建，或换输出位规避。
 *
 * 用法：`node scripts/materialize-deps.mjs`（`npm run package` 经 `prepackage` 自动前置）。
 * 退出码：0 = 两包落位自检通过 ∥ 1 = 失败（源缺位 ∕ 自检判红）。
 * 纯函数面（`planMaterialize` ∥ `classifyTarget` ∥ `isExcluded`）可直测（批内件 L1）。
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, unlinkSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

/** 物化面 = 两核包（`package.json` 依赖声明 × 仓内兄弟目录）。 */
export const PACKAGES = [
  { name: "@thincoder/core", source: "../thincoder-core" },
  { name: "@thincoder/render-core", source: "../thincoder-render-core" },
]

/** 源树排除面（相对源根第一段——`test/**` ∥ `.thincoder/**`）。 */
export const EXCLUDED_TOP = new Set(["test", ".thincoder"])

/** 物化计划（纯函数——目标位 = `<root>/node_modules/<scope>/<name>`；源 = 兄弟目录直读）。 */
export function planMaterialize(root) {
  return PACKAGES.map((pkg) => ({
    name: pkg.name,
    source: resolve(root, pkg.source),
    target: join(root, "node_modules", ...pkg.name.split("/")),
    sourceExists: existsSync(resolve(root, pkg.source)),
  }))
}

/** 排除谓词（纯函数）：源根相对路径第一段 ∈ `EXCLUDED_TOP` ⇒ 不入拷贝。 */
export function isExcluded(relPath) {
  return EXCLUDED_TOP.has(relPath.split(/[\\/]/)[0])
}

/** 目标位分类（纯函数——fs 观测面以入参显式给出）：missing ∥ link ∥ materialized ∥ foreign。 */
export function classifyTarget(obs) {
  if (!obs.present) return "missing"
  if (obs.isLink) return "link"
  return obs.isDirectory ? "materialized" : "foreign"
}

/** 目标位观测（fs 面——`lstat`；ENOENT ⇒ present:false）。 */
export function observeTarget(target) {
  let st
  try {
    st = lstatSync(target)
  } catch (error) {
    if (error.code === "ENOENT") return { present: false, isLink: false, isDirectory: false }
    throw error
  }
  return { present: true, isLink: st.isSymbolicLink(), isDirectory: st.isDirectory() }
}

/** 落位自检（纯函数 + 一次 `package.json` 读）：真身非 link ∧ `package.json` 在且包名逐字对账。 */
export function verifyMaterialized(entry) {
  const issues = []
  const obs = observeTarget(entry.target)
  const cls = classifyTarget(obs)
  if (cls === "missing") issues.push(`落位缺位（${entry.target}）`)
  else if (cls === "link") issues.push(`仍是链接（未物化——${entry.target}）`)
  else if (cls === "foreign") issues.push(`非同型（非目录——${entry.target}）`)
  if (cls === "materialized") {
    const pkgPath = join(entry.target, "package.json")
    if (!existsSync(pkgPath)) issues.push(`package.json 缺位（${pkgPath}）`)
    else {
      let name = null
      try {
        name = JSON.parse(readFileSync(pkgPath, "utf8")).name
      } catch (error) {
        issues.push(`package.json 读取 ∕ 解析失败（${pkgPath}——${error.code ?? error.message}）`)
      }
      if (name !== null && name !== entry.name) issues.push(`包名对账失败（${pkgPath} = ${name} ≠ ${entry.name}）`)
    }
  }
  return issues
}

/** 删目标位：链 ⇒ `unlinkSync`（只摘链——不递归进链内）；真目录 ⇒ 递归删自身副本；余 ⇒ `unlinkSync`。 */
function removeTarget(target, obs) {
  if (!obs.present) return "created"
  if (obs.isLink) {
    unlinkSync(target)
    return "relinked"
  }
  if (obs.isDirectory) {
    rmSync(target, { recursive: true, force: true })
    return "replaced"
  }
  unlinkSync(target)
  return "replaced"
}

/** 物化主行程：逐包（判链 ⇒ 摘链 ∕ 清残留 ⇒ 源树实拷 ⇒ 落位自检）。返回 { entries, ok }。 */
export function materializeDeps(root, { log = console.log } = {}) {
  const entries = planMaterialize(root).map((entry) => {
    if (!entry.sourceExists) {
      log(`[materialize] ${entry.name}：✖ 源树缺位（${entry.source}）`)
      return { ...entry, action: "skipped", issues: [`源树缺位（${entry.source}）`] }
    }
    let before = "unknown"
    let action = null
    let issues = []
    try {
      const obs = observeTarget(entry.target)
      before = classifyTarget(obs)
      mkdirSync(dirname(entry.target), { recursive: true })
      action = removeTarget(entry.target, obs)
      cpSync(entry.source, entry.target, { recursive: true, filter: (src) => !isExcluded(relative(entry.source, src)) })
      issues = verifyMaterialized(entry)
    } catch (error) {
      issues = [`物化失败（${error.code ?? error.message}）`]
    }
    log(`[materialize] ${entry.name}：${before} ⇒ ${action ?? "failed"}（源 ${entry.source}）${issues.length ? ` · ✖ ${issues.join("；")}` : " · ✔ 落位自检通过"}`)
    return { ...entry, before, action, issues }
  })
  return { entries, ok: entries.every((e) => e.issues.length === 0) }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const { entries, ok } = materializeDeps(root)
  const failed = entries.filter((e) => e.issues.length > 0)
  for (const e of failed) for (const issue of e.issues) console.error(`✖ ${e.name}：${issue}`)
  if (!ok) {
    console.error("[materialize] 物化失败——两核包未就绪（打包中止）；dev 链恢复 = `node ../scripts/dev-link.mjs --force`（在包根执行）")
    return 1
  }
  console.log(`[materialize] 两核包物化完成（${entries.length} 包）；收窗恢复 = \`node ../scripts/dev-link.mjs --force\``)
  return 0
}

const isMain = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
if (isMain) process.exit(main())
