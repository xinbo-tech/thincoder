/**
 * agent-tools/batch-gate.mjs — 文档机检门（`batch` 工具两机械点的**单源门**）。
 *
 * 权威规格 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「结构兜底」（判据 / 范围 / 适用面 /
 * ERROR 消费分野 / 门自身异常 / 不检面）——本档只实现，**不重述口径**（D2）。需求 = `DOC-CHECK.md` F9 / AC-7。
 *
 * 调用面两处、各一取值（`scope` 语义 = 规范「调用面开关，无第三值」）：
 *   ① `batch.mjs` append 写 §2 / §5（`!depth0 && !review`）⇒ `scope: "writer"`——范围 = 写者触达记账
 *      （与工具面 gate 同源 `docsSource="session"`）；`REFUSED` ⇒ 调用面 throw；`ERROR` / 门自身异常 ⇒ 放行 +
 *      回执明示（子代理无法重启会话，卡死写账 = 无账之笔；② 会拒收口 ⇒ 轮次不会被当成已通过）。
 *   ② `batch-lifecycle.mjs` close ∥ status 值余核「已收口」⇒ `scope: "close"`——范围 = 本批笔域集
 *      （父侧触达账 ∪ 本批提交 diff = `git diff --name-only <批起 sha> HEAD` 内的 `.md`）；
 *      `REFUSED`（K ≥ 1）∥ `ERROR` ⇒ 调用面 throw（fail-closed）。
 *      **单集**：范围内不设第二集——工作树里范围外的档不入判、不入报面（用户 2026-10-25 裁定「只判指定文件」）。
 *
 * 判据零变：本档不新增判据——只决定「判谁」与「何时强制」；判据与裁定串由产品引擎
 * `doc-check/index.mjs` 产出（判据源唯一）。
 *
 * 两条边界（设计与实测同口径）：
 * ① **批档自身不入范围**（载体不是判据对象——判它只会把载体的超段记成本批欠账）；
 * ② **提交 diff 腿的基 sha 只读批档 §1 的记入行**（`批起 sha = <sha>`——取行内首个 40 位十六进制串）；
 *    取不到（无该行 ∥ 形态不合 ∥ git 跑不出该 diff）⇒ 只认触达账 + 回执明示「基 sha 未定」（不静默）。
 */
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { relative, resolve } from "node:path"

import { owningProject, readManifest } from "../manifest.mjs"
import { runDocCheck } from "../doc-check/index.mjs"
import { sectionHeaderRe } from "./batch-skeleton.mjs"
import { batchProjectRoot } from "./batch-paths.mjs"

/** 平台路径键（win32 大小写不敏感——只作集比对，非判据面）。 */
const pathKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 文档档谓词 + 绝对化（触达账 / 提交 diff 同形；非 `.md` 不进范围）。 */
const isDocPath = (p) => typeof p === "string" && p.trim() !== "" && p.toLowerCase().endsWith(".md")
function docPaths(list, base) {
  const out = []
  for (const p of Array.isArray(list) ? list : []) if (isDocPath(p)) out.push(resolve(base, p))
  return out
}

/**
 * `<批起 sha>` 的取法（唯一）= 批档 §1 的记入行 `批起 sha = <sha>`：段界消费 `sectionHeaderRe(1)`
 * （段头形态单源——`## §10` 不误命中 `§1`），取段内该行行内首个 40 位十六进制串。
 * 无该行 ∥ 形态不合 ∥ 读不到 ⇒ `null`——调用面按「基 sha 未定」明示，不静默；段界外提到该行形不算数
 * （记入行只认 §1：取法与写入义务单源 = 规范「② 的范围」）。
 */
function baseShaOf(abs) {
  let src
  try { src = readFileSync(abs, "utf8") } catch { return null }
  const hdr = sectionHeaderRe(1).exec(src)
  if (!hdr) return null
  const nextRe = /^## §\d/gm
  nextRe.lastIndex = hdr.index + hdr[0].length
  const next = nextRe.exec(src)
  const body = src.slice(hdr.index + hdr[0].length, next ? next.index : src.length)
  for (const line of body.split(/\r?\n/)) {
    if (!line.includes("批起 sha")) continue
    const sha = /[0-9a-f]{40}/i.exec(line)?.[0]
    if (sha) return sha
  }
  return null
}

/**
 * 本批提交 diff 腿（`git diff --name-only <sha> HEAD`——只取清单，判定归引擎）：路径以**仓根**
 * （`rev-parse --show-toplevel`）为基还原——项目根住大仓子目录时条目不丢（清单相对仓根）。
 * `-c core.quotepath=false`：不关此开关时 git 把含非 ASCII 字节的路径整串加引号转义，
 * 下流 `endsWith(".md")` 判据会判假 ⇒ 非 ASCII 档名的档静默掉出范围（正是本批要关的「范围跑偏」）。
 * 跑不出（非仓 / sha 不可解析）⇒ `ok: false` + 空集（调用面按「基 sha 未定」明示，不静默）。
 */
function committedDocs(root, sha) {
  const run = (cwd, argv) => execFileSync("git", ["-C", cwd, "-c", "core.quotepath=false", ...argv], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 })
  try {
    const top = run(root, ["rev-parse", "--show-toplevel"]).trim() || root
    const files = run(top, ["diff", "--name-only", sha, "HEAD"]).split(/\r?\n/).filter(Boolean)
    return { ok: true, base: top, files }
  } catch {
    return { ok: false, base: root, files: [] }
  }
}

/** 命中 → `{ aligned, entries }`：`file` = 判定用（引擎给绝对路径）；显示行取引擎已产出的 `✗` 行
 *   （报面单源不重写）；行数与命中数不等（引擎报面行序变动）⇒ `aligned: false` + 自造行，由调用面回执明示。 */
function hitEntries(res, root) {
  const lines = res.report.split("\n").filter((l) => l.startsWith("✗ "))
  const hits = [...res.anchorHits, ...res.paragraphHits]
  const aligned = lines.length === hits.length
  const entries = hits.map((h, i) => ({
    file: h.file,
    line: aligned ? lines[i] : `✗ ${relative(root, h.file).replace(/\\/g, "/")}:${h.line}`,
  }))
  return { aligned, entries }
}

/** 报面组装：只换首行 + 插入本条附加行（其余行 = 引擎原样，不重写格式）。 */
function composeReport(res, first, notes) {
  const lines = String(res.report).split("\n")
  lines[0] = first
  if (notes.length) {
    const at = lines.findIndex((l) => l.startsWith("处置："))
    if (at >= 0) lines.splice(at, 0, ...notes)
    else lines.push(...notes)
  }
  return lines.join("\n")
}

/** 空范围返回形（`range` 恒在场——回执要读 `范围 N 档`）。 */
const emptyRange = (basis) => ({ count: 0, k: 0, basis })
const errorState = (first, range = emptyRange("none")) => ({ state: "error", first, report: first, hitLines: [], noteLines: [], range })

/**
 * 跑一次门（**非抛错**：两因之外的门自身异常收为 `error` 态，由调用面按 `scope` 消费）。
 * @param {{abs:string, cwd?:string, agent?:object, scope?:'writer'|'close'}} o
 *   `abs` = 目标批次档绝对路径（根解析用）；`agent._touchedFiles` = 触达记账。
 * @returns {{state:'pass'|'refused'|'error'|'not-applicable', first:string|null, report:string,
 *   hitLines:string[], noteLines:string[], range:{count:number, k:number, basis:string}}}
 *   `first` = 唯一机判串（首行 `DOC-CHECK GATE:`）；`not-applicable` ⇒ `first = null` + 固定回执行。
 */
export function runBatchGate({ abs, cwd, agent = {}, scope = "writer" } = {}) {
  // `scope` 两取值、无第三值（设计「`scope` 语义」）——未知值不静默降级（降级即 ② 变 fail-open）
  if (scope !== "writer" && scope !== "close") {
    return errorState(`DOC-CHECK GATE: ERROR（未知 scope：${JSON.stringify(scope)}——取值只有 "writer" ∥ "close"）`)
  }
  try {
    return evaluate({ abs, cwd, agent, scope })
  } catch (e) {
    const first = `DOC-CHECK GATE: ERROR（门自身异常：${e?.message ?? String(e)}）`
    return errorState(first)
  }
}

/** 门体（正常路径——异常由上抛给 `runBatchGate` 收口）。 */
function evaluate({ abs, cwd, agent, scope }) {
  const base = resolve(cwd ?? process.cwd())
  const root = owningProject(resolve(abs)) ?? batchProjectRoot(base)
  const close = scope === "close"

  let read
  try { read = readManifest(root) } catch (e) {
    return errorState(`DOC-CHECK GATE: ERROR（manifest 不可读 —— ${e?.message ?? String(e)}）`)
  }
  // 适用面（声明面驱动）：无 manifest ⇒ 不适用 + 回执明示；**不是豁免清单**——判据参数 = 引擎内置常量。
  if (!read.ok && read.reason === "missing") {
    return { state: "not-applicable", first: null, report: "[doc-check gate] 未跑（本项目无声明面）", hitLines: [], noteLines: [], range: emptyRange("none") }
  }
  // 范围（判谁）：writer = 写者触达账；close = 本批笔域集 = 触达账 ∪ 本批提交 diff（**单集**——
  // 范围内不设第二集：工作树里范围外的档不入判、不入报面）。
  // 批档自身不入范围（载体不是判据对象——判它只会把载体的超段记成本批欠账）。
  const selfKey = pathKey(resolve(abs))
  const touched = docPaths(agent?._touchedFiles, base).filter((p) => pathKey(p) !== selfKey)
  const baseSha = close ? baseShaOf(abs) : null
  const diff = baseSha ? committedDocs(root, baseSha) : { ok: false, base: root, files: [] }
  const diffDocs = docPaths(diff.ok ? diff.files : [], diff.base).filter((p) => pathKey(p) !== selfKey)
  const docs = close ? [...new Set([...touched, ...diffDocs])] : touched
  const basis = !close ? "touched" : diff.ok ? "touched+diff" : "touched（基 sha 未定）"
  const res = runDocCheck(root, { mode: "gate", docs, docsSource: close ? "explicit" : "session" })

  const { aligned, entries } = hitEntries(res, root)
  const k = entries.length // 单集：命中数即 K（没有第二集可排除）
  const first = k >= 1
    ? `DOC-CHECK GATE: REFUSED（命中 ${k} 条）`
    : (res.checkFiles.length ? "DOC-CHECK GATE: PASS" : "DOC-CHECK GATE: PASS（0 档）")

  // 附加行（不静默面）：命中行不可对齐（判定面自述）+ 收口面取不到基（只认触达账）。
  const notes = []
  if (!aligned) notes.push("命中行不可对齐（引擎报面 ✗ 行数与命中数不等）——显示行按自造形，判定按命中对象")
  if (close && !diff.ok) notes.push("基 sha 未定——本批笔域集只认触达账")

  return {
    state: k >= 1 ? "refused" : "pass",
    first,
    report: composeReport(res, first, notes),
    hitLines: entries.map((e) => e.line),
    noteLines: notes,
    range: { count: res.checkFiles.length, k, basis },
  }
}

/** 成功回执行（append / close / status 三面同形；`null` 门 ⇒ 零改——非挂门路径回执逐字旧形）。
 *  两件 = verdict + `范围 N 档` 事实行；附注行（「基 sha 未定」∥ 命中行不可对齐）紧随其后**逐字**列出——
 *  不静默吞掉可见性。 */
export function gateReceiptLine(gate) {
  if (!gate) return ""
  if (gate.state === "not-applicable") return "\n[doc-check gate] 未跑（本项目无声明面）"
  const head = `\n[doc-check gate] ${gate.first} · 范围 ${gate.range?.count ?? 0} 档`
  return [head, ...(gate.noteLines ?? []).map((l) => `\n${l}`)].join("")
}

/**
 * 拒绝串（throw 载荷；两机械点同源措辞）：`batch:` 前缀 + verdict 首行 + 逐条 `✗` 行 + 处置句；
 * ① 追加同路既有句「失败 ⇒ 勿 close」（字面同 append 既有拒因，不新造措辞）。
 */
export function gateRefusalMessage(gate, action = "append") {
  const lead = action === "append"
    ? "batch: 文档机检门拒写（doc-check gate · 结构兜底 ①）—— 本次段写入未落盘，档字节不变。"
    : `batch: 文档机检门拒收口（doc-check gate · 结构兜底 ②）—— ${action === "close" ? "close" : "status → 已收口"} 被拒绝，§1 状态行字节不变。`
  const detail = gate.state === "error" ? String(gate.report ?? "").split("\n").slice(1) : gate.hitLines
  const tail = action === "append"
    ? "处置：同轮修正后复跑（改文档 ∥ 修引擎）；不转台账；拿不准 ⇒ 上抛主 agent 裁决（主 agent 拿不准 ⇒ 转呈用户）。Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close)."
    : "处置：同轮修正后复跑（改文档 ∥ 修引擎）；不转台账；拿不准 ⇒ 上抛主 agent 裁决（主 agent 拿不准 ⇒ 转呈用户）。Nothing was written."
  return [lead, gate.first, ...(detail ?? []), ...(gate.noteLines ?? []), tail].join("\n")
}
