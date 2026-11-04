/**
 * agent/write-face.mjs — 面判定单源（写锁与设计门共用的判据底座）。
 *
 * 权威规格 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.1 / §2.10；面分类的原文正源 =
 * `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5。本档只做一件事：给一个绝对路径判「产品代码面
 * / 文档面」，判据逐步骤对应 §2.10 的两值表。
 *
 * 面**只有两值**：文档面（放行）∥ 产品面（拦）——设计门按它拦；写锁 2026-11-03 起不分面（设计档 §2.3），
 * 面在那里只选拒文变体。四格先命中先定：
 *   1 出辖（祖先链无 manifest）⇒ 放行（`out-of-jurisdiction`）——辖界，不是面
 *   2 manifest `docRoot` 前缀命中 ⇒ 放行（`doc-root`，D1 写权矩阵在写面上的机判投影）
 *   3 文件 = `PROJECT-MANIFEST.json`（项目状态档）⇒ 放行（`manifest-state`）
 *   4 其余一切 ⇒ 产品面（`product`，fail-closed——判不出面就按产品面走全链）
 *
 * 为什么不再复用 `classifyPath`：旧形把「构建产物 / 仓根 `scripts` ∥ `test` ∥ `.thincoder` ∥ `.github`
 * / 锁文件 / `classifyPath` 的 temp·aux·state」当放行桶——每多一个放行桶，就多一条「这一步要不要走流程」
 * 的自判口子（用户 2026-11-02 裁定退役）。两值之后没有第三桶、没有豁免、没有待裁格；`classifyPath` /
 * `isCodePath` **本体零改**，它们仍是索引 / 检索 / verify 那一族的判据（七个生产消费面）。
 *
 * `test` 标记与面值**分离**：路径含 `test` / `tests` 段 ⇒ `test: true`，只决定写锁用测试变体拒文，
 * 不改 `face`。
 */
import { isAbsolute, relative, resolve } from "node:path"

import { declarationForTarget } from "../conventions.mjs"
import { docRootPaths, manifestFilePath, readManifest } from "../manifest.mjs"
// 文档面键集**不另持字面**（单源 = `agent-tools/review-facts.mjs` 的 `REVIEW_ROOT_KEYS`——同一组 docRoot 子键，
// 两份清单漂移就是「评审面放的 / 写面拦的」各说各话）。
import { REVIEW_ROOT_KEYS } from "../agent-tools/review-facts.mjs"

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
  for (const key of REVIEW_ROOT_KEYS) {
    for (const abs of docRootPaths(man.docRoot?.[key], root)) out.push(faceKey(abs))
  }
  return out
}

/** 路径段里有没有 `test` / `tests`（拒文变体句的判据，与面值无关）。 */
function hasTestSegment(relOrAbs) {
  return String(relOrAbs).split(/[\\/]+/).filter(Boolean).some((s) => {
    const low = s.toLowerCase()
    return low === "test" || low === "tests"
  })
}

/**
 * 面判定（判据本体）。返回 `{face, reason, test}`：
 *  - `face` = `"product"`（产品面 ⇒ 设计门拦；写锁里只选拒文变体）∥ `"pass"`（放行面）；
 *  - `reason` = 命中的那一格——**只有四值**：`out-of-jurisdiction` / `doc-root` / `manifest-state` /
 *    `product`（回执与用例的定位面）；
 *  - `test` = 路径含 `test` / `tests` 段（产品测试面 ⇒ 写锁换测试变体那句拒文；不改 `face`）。
 * @param {string} absPath — 目标绝对路径（相对形由调用方先 resolve；本档不猜会话锚）
 * @param {object|null} [manifest] — 所属项目的 manifest（缺省 ⇒ 按项目根读；读不到 ⇒ 文档面空集）
 * @returns {{face: "product"|"pass", reason: "out-of-jurisdiction"|"doc-root"|"manifest-state"|"product", test: boolean}}
 */
export function faceDetail(absPath, manifest = null) {
  const abs = resolve(String(absPath ?? ""))
  const conv = declarationForTarget(abs) // 出辖 ⇒ null（祖先链无 manifest）
  if (!conv) return { face: "pass", reason: "out-of-jurisdiction", test: hasTestSegment(abs) }
  const root = conv.root
  const rel = relative(root, abs)
  const inRoot = rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))
  const test = hasTestSegment(inRoot ? rel : abs)
  if (inRoot) {
    const key = faceKey(abs)
    // 2 文档面（manifest docRoot）
    if (docRootKeys(root, manifest).some((d) => key === d || key.startsWith(`${d}/`))) {
      return { face: "pass", reason: "doc-root", test }
    }
    // 3 项目状态档（主 agent 的声明面——D1 写权矩阵同源）
    if (key === faceKey(manifestFilePath(root))) return { face: "pass", reason: "manifest-state", test }
  }
  // 4 其余一切 = 产品面（fail-closed）
  return { face: "product", reason: "product", test }
}

/**
 * 面判定（§2.1 契约形）：`"product"` = 产品面（设计门按它拦；写锁里只选拒文变体——台账在途行才是判据），
 * `"pass"` = 放行面（文档面 / 出辖）。
 * @param {string} absPath — 目标绝对路径
 * @param {object|null} [manifest] — 所属项目 manifest（缺省 ⇒ 按项目根读）
 * @returns {"product"|"pass"}
 */
export function faceOf(absPath, manifest = null) {
  return faceDetail(absPath, manifest).face
}
