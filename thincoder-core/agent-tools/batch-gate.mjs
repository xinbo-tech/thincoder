/**
 * agent-tools/batch-gate.mjs — 文档机检门（`batch` 工具两机械点的**单源门**）。
 *
 * 权威规格 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「结构兜底」（判据 / 范围 / 适用面 /
 * ERROR 消费分野 / 门自身异常 / 不检面）——本档只实现，**不重述口径**（D2）。需求 = `DOC-CHECK.md` F9 / AC-7。
 *
 * 调用面（`scope` 语义 = 规范「调用面开关，无第三值」）：
 *   ① `batch.mjs` append——**全部 append 同挂**（§1–§6，含 depth-0 与评审写 §3）⇒ `scope: "writer"`；
 *      强制集 = 本次写入文本命中 ∪ 写者触达账命中；`REFUSED` ⇒ 调用面 throw；`ERROR` / 门自身异常 ⇒
 *      放行 + 回执明示（子代理无法重启会话，卡死写账 = 无账之笔；② 会拒收口 ⇒ 轮次不会被当成已通过）。
 *   ② `batch-lifecycle.mjs` close ∥ status 值余核「已收口」⇒ `scope: "close"`——范围 = 本批笔域集
 *      （父侧触达账 ∪ 本批提交 diff = `git diff --name-only <批起 sha> HEAD` 内的 `.md` ∪ 批档自身）；
 *      `REFUSED`（K ≥ 1）∥ `ERROR` ⇒ 调用面 throw（fail-closed）。
 *      **单集**：范围内不设第二集——工作树里范围外的档不入判、不入报面（用户 2026-10-25 裁定「只判指定文件」）。
 *
 * **批档自身恒在判域（两 scope 同）**：批档生于此轮、冻结于此轮（`close` 之后整档冻结）⇒ 其全文字面
 * 即本轮的笔面，档内没有「别轮写的存量」可排；存量 = 别批的档，已由单集规则排除。于是：
 *   · ① 面**已落段命中**的处置按动作分两种（判集 = `docs/core/design/BATCH-RECORD.md` §4.9 门 ④ 判集两句）：
 *     `append` ⇒ 只入回执、不阻本次写——追加不碰既有行，拒一个改不动的人只会让这一段永远写不进
 *     （无账之笔）；本次追加文（片段档）与触达账命中当场拒。
 *     `edit`（携 `pending.recordView` = **改写后的整档**）⇒ **判集两类**：段长类（段落过长 · 行过长）只判
 *     `newText`（片段档）——一条早先就在的超长段不拦本段的无关改动；**锚类判整档、当场拒**——引用完整性
 *     是档级属性，且这一段的作者改得动那一行。盘上旧字节不参判（拿改写前的档判，#2021 那条死引文
 *     永远过不去）；
 *   · ② 面命中即 K，且命中落在批档内时逐条带 `§N（作者：<角色>）`（答「谁该改」；作者取自档头
 *     「一段一作者」映射，取不到 ⇒ 只出 `§N`，不猜）。
 *
 * 判据零变：本档不新增判据——只决定「判谁」与「何时强制」；判据与裁定串由产品引擎
 * `doc-check/index.mjs` 产出（判据源唯一）。
 *
 * 两条边界（设计与实测同口径）：
 * ① **本次写入文本的判法** = 落批档同目录的隐藏片段档（`.gate-<pid>-<rand>.md`）——锚解析序 ② 是
 *    「引用方档所在目录相对」，同目录 ⇒ 判法与批档本体逐字同源；一次 `runDocCheck` 判两档，按命中
 *    所在档切强制集 / 明示集，回执把片段档显示成「本次写入文本」。片段档 `finally` 删；同目录的
 *    `.gate-*` 残留**只明示、不代删**（并发进程的活片段是别人正在判的档）。
 * ② **提交 diff 腿的基 sha 只读批档 §1 的记入行**（`批起 sha = <sha>`——取行内首个 40 位十六进制串）；
 *    取不到（无该行 ∥ 形态不合 ∥ git 跑不出该 diff）⇒ 只认触达账 + 回执明示「基 sha 未定」（不静默）。
 */
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

import { owningProject, readManifest } from "../manifest.mjs"
import { runDocCheck, PARA_DISPOSE, DOC_CLASS } from "../doc-check/index.mjs"
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

/** 锚类命中（引擎大类中的锚面；其余 clazz = 段判据命中）。类名由引擎产出，本档只作切分。
 *  三属同计「锚 N 条」：`档缺` / `节缺` / `引缺`（引文不在所指档内——同属锚判据，不是段类）。 */
const ANCHOR_CLASSES = new Set(["档缺", "节缺", "引缺"])

/** 片段档名前缀（与批档同目录的隐藏档——锚解析序 ② 与批档本体同源）。**导出面**：`batch-lifecycle.mjs` 的在飞
 *  扫描要靠它把两类片段档排除在外——`edit` 面的 `recordView` 是**整档副本**（`## §1` 段头 + `进行中` 都在），
 *  不排除就会被当成第二本在飞批（假拒），进程被杀则残留一本永久 open 的幽灵档。 */
export const FRAGMENT_PREFIX = ".gate-"

/** 片段档路径（每次一个随机名：并发两次门不撞名，也不互删）。 */
function fragmentPathOf(abs) {
  return join(dirname(abs), `${FRAGMENT_PREFIX}${process.pid}-${Math.random().toString(36).slice(2, 10)}.md`)
}

/** 同目录 `.gate-*` 残留（进程在写片段后、清理前被杀）：**只扫不删**——并发进程的活片段是别人正在判的档。 */
function strayFragmentsOf(dir, ownAbs) {
  let names
  try { names = readdirSync(dir) } catch { return [] }
  const skip = ownAbs ? pathKey(ownAbs) : null
  return names.filter((n) => n.startsWith(FRAGMENT_PREFIX) && n.endsWith(".md") && pathKey(join(dir, n)) !== skip)
}

/** 读档（读不到 ⇒ 空串：归属标注取不到就只出 `§N`，不猜）。 */
function safeRead(abs) {
  try { return readFileSync(abs, "utf8") } catch { return "" }
}

/** 批档档头骨架行的「一段一作者」映射（`batch` create 落骨架时写入）——取不到 ⇒ 空表。 */
function authorMapOf(src) {
  const map = new Map()
  for (const line of String(src ?? "").split("\n")) {
    if (!line.includes("一段一作者")) continue
    for (const m of line.matchAll(/§\s*(\d+)\s*[^（(]*[（(]([^）)]+)[）)]/g)) {
      const n = Number(m[1])
      if (!map.has(n)) map.set(n, m[2].trim())
    }
  }
  return map
}

/** 行号 → 所属段号（`## §N` 段头分段；首个段头之前 ⇒ null）。 */
function sectionOfLine(src, line) {
  const lines = String(src ?? "").split("\n")
  const end = Math.min(line, lines.length)
  let cur = null
  for (let i = 0; i < end; i++) {
    const m = /^## §(\d+)(?=\s|$)/.exec(lines[i])
    if (m) cur = Number(m[1])
  }
  return cur
}

/** 命中行落在批档内时的归属标注：` §N（作者：<角色>）`；作者取不到 ⇒ 只出 ` §N`（不猜）。 */
function attributionOf(src, line, authors) {
  const seg = sectionOfLine(src, line)
  if (seg === null) return ""
  const who = authors.get(seg)
  return who ? ` §${seg}（作者：${who}）` : ` §${seg}`
}

/** 明示集的单条摘要（`§N 第 M 行（作者：<角色>）`）。 */
function landedSummary(src, entry, authors) {
  const seg = sectionOfLine(src, entry.line)
  const at = seg === null ? `第 ${entry.line} 行` : `§${seg} 第 ${entry.line} 行`
  const who = seg === null ? null : authors.get(seg)
  return who ? `${at}（作者：${who}）` : at
}

/** 命中集按类分列（`锚 A 条 · P 处<类名>`）——引擎报面行形不动，只在这里做计数。 */
function classifyCounts(entries) {
  const parts = []
  const anchor = entries.filter((e) => ANCHOR_CLASSES.has(e.clazz)).length
  if (anchor) parts.push(`锚 ${anchor} 条`)
  const byClass = new Map()
  for (const e of entries) if (!ANCHOR_CLASSES.has(e.clazz)) byClass.set(e.clazz, (byClass.get(e.clazz) ?? 0) + 1)
  for (const [clazz, n] of byClass) parts.push(`${n} 处${clazz}`)
  return parts.join(" · ")
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

/** 命中 → `{ aligned, entries }`：`file` / `line` / `clazz` = 判定用（引擎给绝对路径）；
 *  显示行取引擎已产出的 `✗` 行（报面单源不重写），过 `translate` 换掉片段档的临时路径；
 *  行数与命中数不等（引擎报面行序变动）⇒ `aligned: false` + 自造行，由调用面回执明示。 */
function hitEntries(res, root, translate) {
  const lines = res.report.split("\n").filter((l) => l.startsWith("✗ "))
  const hits = [...res.anchorHits, ...res.paragraphHits]
  const aligned = lines.length === hits.length
  const entries = hits.map((h, i) => ({
    file: h.file,
    line: h.line,
    clazz: h.clazz,
    text: translate(aligned ? lines[i] : `✗ ${relative(root, h.file).replace(/\\/g, "/")}:${h.line}`),
  }))
  return { aligned, entries }
}

/** 报面组装：首行 verdict + 强制集命中行 + 明示集命中行 + 附注行 + 处置块（只跟段命中走——仅锚 ∥ 仅行命中不得叫人对段落动手；
 *  字面单源 = 引擎导出的 `PARA_DISPOSE`，本档零字面副本）。明示集标题按面取形（`append` = 已落段命中；
 *  `edit` = 档内段长类命中——段长类判集是本次写入文本，两件事在回执里不得叫同一个名字）。 */
function composeReport({ first, forcedLines, disclosedLines, disclosedHeader, notes, disposePara }) {
  const out = [first, ...forcedLines]
  if (disclosedLines.length) {
    out.push(disclosedHeader ?? "—— 批档已落段命中（只明示、不阻本次写；收口面 fail-closed 当场拦）：", ...disclosedLines)
  }
  out.push(...notes)
  if (disposePara) out.push(...PARA_DISPOSE)
  return out.join("\n")
}

/** 空范围返回形（`range` 恒在场——回执要读 `范围 N 档`）。 */
const emptyRange = (basis) => ({ count: 0, k: 0, basis })
const errorState = (first, range = emptyRange("none")) => ({ state: "error", first, report: first, hitLines: [], noteLines: [], disposePara: false, range })

/**
 * 跑一次门（**非抛错**：两因之外的门自身异常收为 `error` 态，由调用面按 `scope` 消费）。
 * @param {{abs:string, cwd?:string, agent?:object, scope?:'writer'|'close', pending?:{section?:number, body?:string, recordView?:string}|null}} o
 *   `abs` = 目标批次档绝对路径（根解析用；**同时恒是判域一员**）；`agent._touchedFiles` = 触达记账；
 *   `pending` = 本次写入的段号与文本（`writer` 面强制集；缺省 ⇒ 无本次文本腿，`close` 面恒缺省）：
 *   `body` = 本次写进来的文本（append = 追加文 ∥ edit = `newText`——片段档判）；
 *   `recordView` = **改写后的整档全文**（仅 `edit` 面传：锚类判这个视图，盘上旧字节不参判）。
 * @returns {{state:'pass'|'refused'|'error'|'not-applicable', first:string|null, report:string,
 *   hitLines:string[], noteLines:string[], disposePara:boolean, range:{count:number, k:number, basis:string}}}
 *   `first` = 唯一机判串（首行 `DOC-CHECK GATE:`）；`not-applicable` ⇒ `first = null` + 固定回执行；
 *   `disposePara` = 判域内存在「文字太长，难于阅读」类命中（拒串据此选「空行 + 五行块」还是照旧一句处置）。
 */
export function runBatchGate({ abs, cwd, agent = {}, scope = "writer", pending = null } = {}) {
  // `scope` 两取值、无第三值（设计「`scope` 语义」）——未知值不静默降级（降级即 ② 变 fail-open）
  if (scope !== "writer" && scope !== "close") {
    return errorState(`DOC-CHECK GATE: ERROR（未知 scope：${JSON.stringify(scope)}——取值只有 "writer" ∥ "close"）`)
  }
  try {
    return evaluate({ abs, cwd, agent, scope, pending })
  } catch (e) {
    const first = `DOC-CHECK GATE: ERROR（门自身异常：${e?.message ?? String(e)}）`
    return errorState(first)
  }
}

/** 门体（正常路径——异常由上抛给 `runBatchGate` 收口）。 */
function evaluate({ abs, cwd, agent, scope, pending }) {
  const base = resolve(cwd)
  const selfAbs = resolve(abs)
  const root = owningProject(selfAbs, base) ?? batchProjectRoot(base)
  const close = scope === "close"

  let read
  try { read = readManifest(root) } catch (e) {
    return errorState(`DOC-CHECK GATE: ERROR（manifest 不可读 —— ${e?.message ?? String(e)}）`)
  }
  // 适用面（声明面驱动）：无 manifest ⇒ 不适用 + 回执明示；**不是豁免清单**——判据参数 = 引擎内置常量。
  if (!read.ok && read.reason === "missing") {
    return { state: "not-applicable", first: null, report: "[doc-check gate] 未跑（本项目无声明面）", hitLines: [], noteLines: [], disposePara: false, range: emptyRange("none") }
  }

  // 范围（判谁）：writer = 写者触达账 ∪ 本次写入文本 ∪ 批档自身；
  //                   close = 本批笔域集 = 触达账 ∪ 本批提交 diff ∪ 批档自身（**单集**——范围外的档不入判、不入报面）。
  const touched = docPaths(agent?._touchedFiles, base)
  const baseSha = close ? baseShaOf(selfAbs) : null
  const diff = baseSha ? committedDocs(root, baseSha) : { ok: false, base: root, files: [] }
  const diffDocs = docPaths(diff.ok ? diff.files : [], diff.base)

  const strays = strayFragmentsOf(dirname(selfAbs), null)
  const pendingBody = !close && pending && typeof pending.body === "string" && pending.body.trim() ? pending.body : null
  const fragAbs = pendingBody ? fragmentPathOf(selfAbs) : null
  // 改写后的整档视图（`edit` 面——锚类判它，不判盘上旧字节：本批要消的正是「死引文那行改不动」那个死锁）。
  const viewBody = !close && pending && typeof pending.recordView === "string" ? pending.recordView : null
  const viewAbs = viewBody === null ? null : fragmentPathOf(selfAbs)
  // 判域内「哪一档是批档本体」：有视图时 = 视图（同目录、同骨架、同引用解析序）；判据与属性标注都读它。
  const selfKey = pathKey(viewAbs ?? selfAbs)

  try {
    // 片段档写在 try 内：写失败也走同一条 finally（不存在就 unlink 失败无害）
    if (fragAbs) writeFileSync(fragAbs, pendingBody.endsWith("\n") ? pendingBody : `${pendingBody}\n`)
    if (viewAbs) writeFileSync(viewAbs, viewBody)
    const docs = close ? [...touched, ...diffDocs, selfAbs] : [...touched, viewAbs ?? selfAbs, ...(fragAbs ? [fragAbs] : [])]
    const res = runDocCheck(root, { mode: "gate", docs, docsSource: close ? "explicit" : "session" })
    const basis = !close
      ? (pendingBody ? "pending+touched" : "touched")
      : diff.ok ? "touched+diff" : "touched（基 sha 未定）"

    // 批档自身（或它的改写后视图）恒在判域（在盘即入）⇒ 判域恒非空，「0 档」这一形不可达。不成立 = 构造异常 ⇒ fail-closed，不产 PASS。
    if (!res.checkFiles.some((p) => pathKey(p) === selfKey)) {
      return errorState("DOC-CHECK GATE: ERROR（判域为空——批档自身应恒在判域）", { count: res.checkFiles.length, k: 0, basis })
    }

    const selfRel = relative(root, selfAbs).replace(/\\/g, "/")
    const fragRel = fragAbs ? relative(root, fragAbs).replace(/\\/g, "/") : null
    const viewRel = viewAbs ? relative(root, viewAbs).replace(/\\/g, "/") : null
    const translate = (text) => {
      let out = fragRel ? text.split(fragRel).join("本次写入文本") : text
      return viewRel ? out.split(viewRel).join(selfRel) : out // 视图档显示成批档自身的相对路径（读者不必知道临时档名）
    }
    const { aligned, entries } = hitEntries(res, root, translate)

    const selfSrc = viewBody ?? safeRead(selfAbs)
    const authors = authorMapOf(selfSrc)
    const labeled = entries.map((e) => {
      const inSelf = pathKey(e.file) === selfKey
      return { ...e, inSelf, text: inSelf ? `${e.text}${attributionOf(selfSrc, e.line, authors)}` : e.text }
    })
    // ① 面（**按动作分两种**——判集单源 = `BATCH-RECORD.md` §4.9 门 ④ 判集两句）：
    //   append（无视图）⇒ 批档已落段命中只明示、不阻写（追加不碰既有行，拒一个改不动的人 = 无账之笔）；其余当场拒。
    //   edit（有视图）⇒ **判集两类**：档内**锚类**命中当场拒（引用完整性是档级属性）；档内**段长类**命中只明示
    //     （段长类只判 `newText`——那条在片段档里判，不在这里）。
    // ② 面：范围内全部命中即 K。
    const blocks = (e) => !e.inSelf || (viewAbs !== null && ANCHOR_CLASSES.has(e.clazz))
    const disclosed = close ? [] : labeled.filter((e) => !blocks(e))
    const forced = close ? labeled : labeled.filter(blocks)
    const k = forced.length
    const forcedLines = forced.map((e) => e.text)
    const disclosedLines = disclosed.map((e) => e.text)

    const inFrag = (e) => !!fragAbs && pathKey(e.file) === pathKey(fragAbs)
    const textHits = forced.filter(inFrag)
    const recordHits = forced.filter((e) => e.inSelf) // 仅 edit 面可达：整档锚类命中
    const touchHits = forced.filter((e) => !inFrag(e) && !e.inSelf)
    let first = "DOC-CHECK GATE: PASS"
    if (k >= 1) {
      if (close) {
        first = `DOC-CHECK GATE: REFUSED（命中 ${k} 条）`
      } else {
        const parts = []
        if (textHits.length) parts.push(`本次写入文本（${classifyCounts(textHits)}）`)
        if (recordHits.length) parts.push(`批档整档（${classifyCounts(recordHits)}）`)
        if (touchHits.length) parts.push(`触达账（${classifyCounts(touchHits)}）`)
        first = `DOC-CHECK GATE: REFUSED（命中 ${k} 条——${parts.join(" · ")}）`
      }
    }

    // 附加行（不静默面）：命中行不可对齐 / 收口面取不到基 / 拒后零字节 / 本次文本已判行数 /
    // 已落段命中（谁该改、为什么不阻本次写）/ 同目录片段档残留（只明示、不代删）。
    const notes = []
    if (!aligned) notes.push("命中行不可对齐（引擎报面 ✗ 行数与命中数不等）——显示行按自造形，判定按命中对象")
    if (close && !diff.ok) notes.push("基 sha 未定——本批笔域集只认触达账")
    if (!close && k >= 1) {
      notes.push("本次写入文本尚未落盘——一个字没写（档字节逐字不变：append 面另有段号不前进、轮次 N 不推进；edit 面另有目标区间以外逐字不变）")
    }
    if (!close && k === 0 && pendingBody) {
      const segLabel = Number.isInteger(pending?.section) ? `§${pending.section}` : "本段"
      const lineCount = pendingBody.split("\n").length
      notes.push(viewAbs !== null
        ? `本次写入文本（${segLabel}）${lineCount} 行已判——段长类只判这一段（档内既有超长段不进你的拒面）；锚类判整档（引用完整性是档级属性）`
        : `本次写入文本（${segLabel}）${lineCount} 行已判——强制集只有这一段（别人的段字面改不动，不进你的拒面）`)
    }
    if (disclosed.length) {
      const list = disclosed.map((e) => landedSummary(selfSrc, e, authors)).join(" · ")
      notes.push(viewAbs !== null
        ? `档内段长类命中 ${disclosed.length} 条：${list}—— 段长类判集 = 本次写入文本，档级旧段不入判、不阻本次写；收口面 fail-closed 会拦`
        : `已落段命中 ${disclosed.length} 条：${list}—— 不属本次笔面，不阻本次写；收口面 fail-closed 会拦`)
    }
    if (strays.length) {
      notes.push(`\`.gate-*\` 残留 ${strays.length} 档（异常退出的片段档）—— 手工删除后再提交`)
    }
    // 声明面坏而门照判：manifest 非法 JSON 时判据参数 = 引擎内置常量、不读声明面 ⇒ 行为本身正确
    // （比短路成「未跑」强——一份坏档不该把整个门关掉）。但那一支过去**不点名**，收口人看不出
    // 声明面已坏；与 `missing` 支「未跑（本项目无声明面）」的明示不对称 ⇒ 两种坏法一种明示一种沉默。
    if (!read.ok && read.reason === "invalid") {
      notes.push("声明面不可解析（`PROJECT-MANIFEST.json` 非法 JSON）—— 判据参数为引擎内置常量，本轮仍已判")
    }

    // 处置块只看**段**类命中——设计口径是「只要存在该类命中就出」，没按「谁写的」切；
    // 仅锚 ∥ 仅行命中不得叫人对段落动手（叫错方向比不给方向贵）——类名单源 = 引擎的 `DOC_CLASS`。
    // edit 面只看**强制集**：档内段长类命中不入本次判集，把它们摆进拒面 = 把写者叫去改一段与本笔无关的文字。
    const disposePara = (viewAbs !== null ? forced : labeled).some((e) => e.clazz === DOC_CLASS.para)
    return {
      state: k >= 1 ? "refused" : "pass",
      first,
      report: composeReport({
        first, forcedLines, disclosedLines, notes, disposePara,
        disclosedHeader: viewAbs !== null ? "—— 档内段长类命中（只明示、不阻本次写；段长类判集 = 本次写入文本）：" : undefined,
      }),
      hitLines: forcedLines,
      noteLines: notes,
      // 处置面分形用（拒串读它：段命中 ⇒ 五行块 ∥ 仅锚·仅行 ⇒ 照旧一句处置）
      disposePara,
      range: { count: res.checkFiles.length, k, basis },
    }
  } finally {
    if (viewAbs) { try { unlinkSync(viewAbs) } catch { /* 清理失败不覆盖判定结果——残留由下一次门明示 */ } }
    if (fragAbs) { try { unlinkSync(fragAbs) } catch { /* 清理失败不覆盖判定结果——残留由下一次门明示 */ } }
  }
}

/** 成功回执行（append / close / status 三面同形；`null` 门 ⇒ 零改——非挂门路径回执逐字旧形）。
 *  两件 = verdict + `范围 N 档` 事实行；附注行（「基 sha 未定」∥ 命中行不可对齐 ∥ 已落段命中 ∥ 片段档残留）紧随其后
 *  **逐字**列出——不静默吞掉可见性。 */
export function gateReceiptLine(gate) {
  if (!gate) return ""
  if (gate.state === "not-applicable") return "\n[doc-check gate] 未跑（本项目无声明面）"
  const head = `\n[doc-check gate] ${gate.first} · 范围 ${gate.range?.count ?? 0} 档`
  return [head, ...(gate.noteLines ?? []).map((l) => `\n${l}`)].join("")
}

/**
 * 拒绝串（throw 载荷；两机械点同源措辞）：`batch:` 前缀 + verdict 首行 + 逐条 `✗` 行 + 附注行 + 处置面。
 * **处置面按命中类分形**（本批裁定）：
 *   · 段命中 ⇒ **空行 + 五行处置块**（字面单源 = 引擎的 `PARA_DISPOSE`）。块末行逐字就是「同轮修正后复跑；不转台账」，
 *     故旧尾句那一截删去——留着就是两句「处置：」+ 一句重复；收尾的裁决指引与「Nothing was written」两句不重复，随原因面照出。
 *   · 仅锚 ∥ 仅行命中 ⇒ **照旧一句**（那五条出路是给「段」的，对错误的面对动手比不给方向更贵）。
 * ① 写盘面两路（`append` 段尾 ∥ `edit` 段内区间）同路既有句「失败 ⇒ 勿 close」（字面同 append 既有拒因，不新造措辞）。
 */
export function gateRefusalMessage(gate, action = "append") {
  const writeFace = action === "append" || action === "edit" // 写盘面两路：段尾追加 ∥ 段内区间改写
  const lead = action === "edit"
    ? "batch: 文档机检门拒写（doc-check gate · 结构兜底 ①）—— 本次段内就地改未落盘，档字节不变。"
    : writeFace
      ? "batch: 文档机检门拒写（doc-check gate · 结构兜底 ①）—— 本次段写入未落盘，档字节不变。"
      : `batch: 文档机检门拒收口（doc-check gate · 结构兜底 ②）—— ${action === "close" ? "close" : "status → 已收口"} 被拒绝，§1 状态行字节不变。`
  const detail = gate.state === "error" ? String(gate.report ?? "").split("\n").slice(1) : gate.hitLines
  const routing = "拿不准 ⇒ 上抛主 agent 裁决（主 agent 拿不准 ⇒ 转呈用户）。"
  // 尾句按动作取形：`edit` 拒后段里本就有内容，劝「勿 close」把两件事说成一件（那句防的是收口冻结一个空段）。
  const noBytes = writeFace
    ? action === "edit"
      ? "Nothing was written — the target range and every other byte of the record are unchanged."
      : "Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close)."
    : "Nothing was written."
  const head = [lead, gate.first, ...(detail ?? []), ...(gate.noteLines ?? [])]
  // 段命中：原因面 + 空行 + 五行块（处置面 = 块，不再另起一句「处置：同轮修正后复跑…」）
  if (gate.disposePara) return [...head, `${routing}${noBytes}`, "", ...PARA_DISPOSE].join("\n")
  return [...head, `处置：同轮修正后复跑（改文档 ∥ 修引擎）；不转台账；${routing}${noBytes}`].join("\n")
}
