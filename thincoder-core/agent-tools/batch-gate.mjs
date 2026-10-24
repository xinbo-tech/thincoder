/**
 * agent-tools/batch-gate.mjs — 文档机检门（`batch` 工具两机械点的**单源门**）。
 *
 * 权威规格 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「结构兜底」（判据 / 范围 / 范围分域 / 适用面 /
 * ERROR 消费分野 / 门自身异常 / 不检面）——本档只实现，**不重述口径**（D2）。需求 = `DOC-CHECK.md` F9 / AC-7。
 *
 * 调用面两处、各一取值（`scope` 语义 = 规范「调用面开关，无第三值」）：
 *   ① `batch.mjs` append 写 §2 / §5（`!depth0 && !review`）⇒ `scope: "writer"`——范围 = 写者触达记账
 *      （与工具面 gate 同源 `docsSource="session"`）；`REFUSED` ⇒ 调用面 throw；`ERROR` / 门自身异常 ⇒ 放行 +
 *      回执明示（子代理无法重启会话，卡死写账 = 无账之笔；② 会拒收口 ⇒ 轮次不会被当成已通过）。
 *   ② `batch-lifecycle.mjs` close ∥ status 值余核「已收口」⇒ `scope: "close"`——范围 = 本批笔域集（触达账；
 *      `git diff --name-only <批起 sha> HEAD` 的基 sha 只有父侧掌握 ⇒ 取不到基时只认触达账 + 回执明示）
 *      ∪ git 面（`git diff --name-only HEAD` ∪ `git ls-files --others --exclude-standard`，域求交归引擎）；
 *      `REFUSED`（K ≥ 1）∥ `ERROR` ⇒ 调用面 throw（fail-closed）；命中 ⊆ 他批在途集 ⇒ 不阻收口 + 固定行逐档列出。
 *
 * 判据零变：本档不新增判据——只决定「判谁」与「何时强制」；判据与裁定串由产品引擎
 * `doc-check/index.mjs` 产出（判据源唯一）。
 *
 * 两条边界（设计与实测同口径）：① **批档自身不入范围**（载体不是判据对象——判它只会把载体的超段记成本批欠账）；
 * ② **本轮提交面不在工具面**——`<批起 sha>` 只有父侧掌握，
 * ② 的写入集只认触达账 + 回执明示「基 sha 未定」，提交面由父侧协议清单兜（不静默）。
 */
import { execFileSync } from "node:child_process"
import { relative, resolve } from "node:path"

import { owningProject, readManifest } from "../manifest.mjs"
import { runDocCheck } from "../doc-check/index.mjs"
import { batchProjectRoot } from "./batch-paths.mjs"

/** 平台路径键（win32 大小写不敏感——只作集比对，非判据面）。 */
const pathKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 文档档谓词 + 绝对化（触达账 / git 面同形；非 `.md` 不进范围）。 */
const isDocPath = (p) => typeof p === "string" && p.trim() !== "" && p.toLowerCase().endsWith(".md")
function docPaths(list, base) {
  const out = []
  for (const p of Array.isArray(list) ? list : []) if (isDocPath(p)) out.push(resolve(base, p))
  return out
}

/**
 * git 面（他批在途集候选——只取清单，域求交归引擎）：`git diff --name-only HEAD` ∪ 未跟踪档。
 * 路径以**仓根**（`rev-parse --show-toplevel`）为基还原——项目根住大仓子目录时条目不丢（清单相对仓根）。
 * 不可得（非仓 / 无 git）⇒ `ok: false` + 空集（调用面回执明示「git 面不可得」，不静默）。
 */
function gitSurface(root) {
  const run = (cwd, argv) => execFileSync("git", ["-C", cwd, ...argv], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 })
  try {
    const top = run(root, ["rev-parse", "--show-toplevel"]).trim()
    const base = top || root
    const changed = run(base, ["diff", "--name-only", "HEAD"]).split(/\r?\n/)
    const untracked = run(base, ["ls-files", "--others", "--exclude-standard"]).split(/\r?\n/)
    return { ok: true, base, files: [...changed, ...untracked].filter(Boolean) }
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

/** 固定行里的定位片（`档:行`——取自命中行；取不到则退回相对路径）。 */
function locationOf(entry, root) {
  return /(\S+?\.md:\d+)/.exec(entry.line)?.[1] ?? relative(root, entry.file).replace(/\\/g, "/")
}

/** 报面组装：只换首行 + 插入本条附加行（其余行 = 引擎原样，不重写格式）；`dropDisposal` ⇒ 剔除引擎的
 *  「处置：同轮修正后复跑…」行（close 面 PASS 且命中全属他批在途时——该行会把读者引去改别人的档）。 */
function composeReport(res, first, notes, dropDisposal) {
  const lines = String(res.report).split("\n").filter((l) => !(dropDisposal && l.startsWith("处置：")))
  lines[0] = first
  if (notes.length) {
    const at = lines.findIndex((l) => l.startsWith("处置："))
    if (at >= 0) lines.splice(at, 0, ...notes)
    else lines.push(...notes)
  }
  return lines.join("\n")
}

/** 空范围返回形（`range` 恒在场——回执要读 `范围 N 档`）。 */
const emptyRange = (basis) => ({ count: 0, k: 0, foreign: 0, basis })
const errorState = (first, range = emptyRange("none")) => ({ state: "error", first, report: first, hitLines: [], noteLines: [], range })

/**
 * 跑一次门（**非抛错**：两因之外的门自身异常收为 `error` 态，由调用面按 `scope` 消费）。
 * @param {{abs:string, cwd?:string, agent?:object, scope?:'writer'|'close'}} o
 *   `abs` = 目标批次档绝对路径（根解析用）；`agent._touchedFiles` = 触达记账。
 * @returns {{state:'pass'|'refused'|'error'|'not-applicable', first:string|null, report:string,
 *   hitLines:string[], noteLines:string[], range:{count:number, k:number, foreign:number, basis:string}}}
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
  // 范围（判谁）：writer = 写者触达账；close = 本批笔域集（触达账）∪ git 面。
  // 批档自身不入范围（载体不是判据对象——判它只会把载体的超段记成本批欠账）。
  const selfKey = pathKey(resolve(abs))
  const touched = docPaths(agent?._touchedFiles, base).filter((p) => pathKey(p) !== selfKey)
  const git = close ? gitSurface(root) : { ok: false, base: root, files: [] }
  const gitDocs = docPaths(git.ok ? git.files : [], git.base).filter((p) => pathKey(p) !== selfKey)
  const docs = close ? [...new Set([...touched, ...gitDocs])] : touched
  const basis = close ? (git.ok ? "touched+git" : "touched（git 面不可得）") : "touched"
  const res = runDocCheck(root, { mode: "gate", docs, docsSource: close ? "explicit" : "session" })

  const { aligned, entries } = hitEntries(res, root)
  const ownKeys = new Set(touched.map(pathKey))
  const own = close ? entries.filter((e) => ownKeys.has(pathKey(e.file))) : entries
  const foreign = close ? entries.filter((e) => !ownKeys.has(pathKey(e.file))) : []
  const k = own.length
  const first = k >= 1
    ? `DOC-CHECK GATE: REFUSED（命中 ${k} 条）`
    : (res.checkFiles.length ? "DOC-CHECK GATE: PASS" : "DOC-CHECK GATE: PASS（0 档）")

  // 附加行（只挂 close 面）：他批在途（逐档列出、不计入 K）+ 两条取基明示（不静默）。
  const notes = []
  if (!aligned) notes.push("命中行不可对齐（引擎报面 ✗ 行数与命中数不等）——显示行按自造形，判定按命中对象")
  if (close) {
    if (foreign.length) notes.push(`他批在途 ${foreign.length} 档（非本批笔域 · 未计入 K · 请其作者在其批修复）：${foreign.map((e) => locationOf(e, root)).join(" ∥ ")}`)
    if (!git.ok) notes.push("git 面不可得——他批在途集只按触达账判（不静默）")
    notes.push("基 sha 未定——本批笔域集只认触达账（git 提交面由父侧协议清单兜）")
  }

  return {
    state: k >= 1 ? "refused" : "pass",
    first,
    report: composeReport(res, first, notes, k === 0 && foreign.length > 0),
    hitLines: entries.map((e) => e.line),
    noteLines: notes,
    range: { count: res.checkFiles.length, k, foreign: foreign.length, basis },
  }
}

/** 成功回执行（append / close / status 三面同形；`null` 门 ⇒ 零改——非挂门路径回执逐字旧形）。
 *  附注行（他批在途逐档列出 ∥ 取基 / git 面明示）紧随其后**逐字**列出——不静默吞掉可见性。 */
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
    : "处置：同轮修正后复跑（改文档 ∥ 修引擎）；不转台账；命中他批笔域 ⇒ 报告父侧转派作者；拿不准 ⇒ 上抛主 agent 裁决（主 agent 拿不准 ⇒ 转呈用户）。Nothing was written."
  return [lead, gate.first, ...(detail ?? []), ...(gate.noteLines ?? []), tail].join("\n")
}
