/**
 * agent/write-face.mjs — 面判定单源（写锁与设计门共用的判据底座）。
 *
 * 权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.1 / §2.10；面分类的原文正源 =
 * `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5。本档只做一件事：给一个绝对路径判「产品代码面
 * / 放行面」，判据逐步骤对应 §2.10 的七步表。
 *
 * 为什么复用 `classifyPath` 而不另写一套分类：两套面判据必然漂移，漂移后「写锁拦的」和「索引收的」
 * 会各说各话（§2.10）。所以本档 = `classifyPath`（`../conventions.mjs`）+ 三处修正：
 *   ① 构建产物目录放行（`BUILD_ARTIFACTS`，10 项——里面没有一行是人写的）；
 *   ② 仓根以下 `test` / `tests` 段**拦**（产品测试与它守的代码同轮评审、同份批档）；
 *   ③ `scripts` 段**只在仓根**放行（`thincoder-core/scripts/check-syntax.mjs` 随核发布 = 产品代码）。
 *
 * 七步先命中先定（§2.10 表）：
 *   1 出辖（祖先链无 manifest）⇒ 放行
 *   2 manifest `docRoot` 前缀命中 ⇒ 放行（文档面 = D1 写权矩阵在写面上的机判投影）
 *   3 仓根首段 = `scripts` ∥ `test` ∥ `.thincoder` ∥ `.github`，或首段 = `package-lock.json` ⇒ 放行
 *   4 任一段 ∈ `BUILD_ARTIFACTS`（精确段匹配——面判不折叠、不做前缀）⇒ 放行
 *   5 仓根以下任一段 = `scripts` ∥ `test` ∥ `tests` ⇒ 拦
 *   6 `classifyPath` = `doc` / `temp` / `aux` / `state` ⇒ 放行
 *   7 其余（含 `code` 与兜底）⇒ 拦
 *
 * 两个 `test/` 不同待遇：仓根 `test/**` 是跨仓验证面（改它不开批）；包内 `thincoder-<end>/test/**` 与产品
 * 代码同生共死（拦）。两个 `scripts/` 同理（见修正③）。
 *
 * 不做什么：`conventions.mjs` / `classifyPath` / `isCodePath` **本体零改**——后者有七个生产消费面，
 * 改它会把 verify / 评审陈旧 / 索引范围一起翻面（§2.10 末段）。本档只新增判据，不替换它们。
 */
import { isAbsolute, relative, resolve } from "node:path"

import { classifyPath, declarationForTarget } from "../conventions.mjs"
import { docRootPaths, readManifest } from "../manifest.mjs"
import { BUILD_ARTIFACTS } from "../skip-dirs.mjs"

/** 文档面的 manifest 键集（`docRoot` 子键——`null` 是合法零根，`docRootPaths` 已归一）。 */
const DOC_ROOT_KEYS = ["requirements", "specs", "design", "modules", "batches"]

/** 仓根首段放行集（工程工具面——§2.10 第 3 步）。 */
const ROOT_TOOL_SEGMENTS = new Set(["scripts", "test", ".thincoder", ".github"])
/** 仓根单档放行（工程工具面——锁文件）。 */
const ROOT_TOOL_FILES = new Set(["package-lock.json"])

/** 比较键（绝对化 + 分隔符归一 `/` + win32 大小写归一——同 `write-gate.mjs` 的 `gateKey` 口径）。 */
const faceKey = (p) => {
  const s = resolve(String(p)).replace(/\\/g, "/")
  return process.platform === "win32" ? s.toLowerCase() : s
}

/** 该路径所属项目根的文档面根集（绝对比较键）。manifest 读不到 ⇒ 空集（兜底 = 产品代码面）。 */
function docRootKeys(root, manifest) {
  let man = manifest
  if (!man || typeof man !== "object" || !man.docRoot) {
    try { man = readManifest(root).manifest } catch { man = null }
  }
  if (!man || typeof man !== "object") return []
  const out = []
  for (const key of DOC_ROOT_KEYS) {
    for (const abs of docRootPaths(man.docRoot?.[key], root)) out.push(faceKey(abs))
  }
  return out
}

/**
 * 面判定（判据本体）。返回 `{face, reason, test}`：
 *  - `face` = `"product"`（产品代码面 ⇒ 写锁拦）∥ `"pass"`（放行面）；
 *  - `reason` = 命中的那一步（`out-of-jurisdiction` / `doc-root` / `engineering-tools` / `build-artifact` /
 *    `product-test` / `package-scripts` / `classify:aux` … / `code` / `fallback`）——回执与用例的定位面；
 *  - `test` = 命中修正②（产品测试面 ⇒ 写锁换首句与尾句的那条拒文）。
 * @param {string} absPath — 目标绝对路径（相对形由调用方先 resolve；本档不猜会话锚）
 * @param {object|null} [manifest] — 所属项目的 manifest（缺省 ⇒ 按项目根读；读不到 ⇒ 文档面空集）
 * @returns {{face: "product"|"pass", reason: string, test: boolean}}
 */
export function faceDetail(absPath, manifest = null) {
  const abs = resolve(String(absPath ?? ""))
  const conv = declarationForTarget(abs) // 出辖 ⇒ null（祖先链无 manifest）
  if (!conv) return { face: "pass", reason: "out-of-jurisdiction", test: false }
  const root = conv.root
  const rel = relative(root, abs)
  const inRoot = rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))
  if (inRoot) {
    const segs = rel.split(/[\\/]+/).filter(Boolean)
    const lower = segs.map((s) => s.toLowerCase())
    const key = faceKey(abs)
    // 2 文档面（manifest docRoot）
    if (docRootKeys(root, manifest).some((d) => key === d || key.startsWith(`${d}/`))) {
      return { face: "pass", reason: "doc-root", test: false }
    }
    // 3 仓根首段 / 仓根锁文件 = 工程工具面
    const first = lower[0] ?? ""
    if (ROOT_TOOL_SEGMENTS.has(first) || (segs.length === 1 && ROOT_TOOL_FILES.has(first))) {
      return { face: "pass", reason: "engineering-tools", test: false }
    }
    // 4 构建产物（精确段匹配——`vendor` / `target` / `out` / `obj` / `bin` 不在此集）
    if (lower.some((s) => BUILD_ARTIFACTS.has(s))) return { face: "pass", reason: "build-artifact", test: false }
    // 5 仓根以下 test / tests / scripts 段 = 产品代码面（首段 `test` / `scripts` 已在第 3 步放行）
    if (lower.some((s) => s === "test" || s === "tests")) return { face: "product", reason: "product-test", test: true }
    if (lower.some((s) => s === "scripts")) return { face: "product", reason: "package-scripts", test: false }
  }
  // 6 / 7 classifyPath 余类放行，其余（含 code）拦
  const cls = classifyPath(abs, conv)
  if (cls === "doc" || cls === "temp" || cls === "aux" || cls === "state") {
    return { face: "pass", reason: `classify:${cls}`, test: false }
  }
  return { face: "product", reason: cls === "code" ? "code" : "fallback", test: false }
}

/**
 * 面判定（§2.1 契约形）：`"product"` = 产品代码面（写它要活批档）；`"pass"` = 放行面。
 * @param {string} absPath — 目标绝对路径
 * @param {object|null} [manifest] — 所属项目 manifest（缺省 ⇒ 按项目根读）
 * @returns {"product"|"pass"}
 */
export function faceOf(absPath, manifest = null) {
  return faceDetail(absPath, manifest).face
}
