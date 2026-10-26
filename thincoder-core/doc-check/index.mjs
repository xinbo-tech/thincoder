/**
 * doc-check/index.mjs — 文档纪律机检 · 引擎入口（两条判据 + 报面行）。
 *
 * 判据两条（起步 · 闭集——口径单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 条目 S）：
 *   ① 锚（档缺 / 节缺）——实现 = `./anchors.mjs`；② 段判据（文字太长，难于阅读 ∥ 行太长）——口径 = §3.18 条目 Q，实现 = `./paragraph.mjs`。
 * 判据参数 = **工具内置常量** `DOC_CHECK_BUILTINS`：不读任何项目的声明面，因而没有「缺参数 ⇒ 拒跑」这一层，
 *   也没有常量校验面——改判据 = 改代码、走评审。
 * 判定范围 = **调用方传入的文件清单**（判定范围 = 解析范围 = 传入的那几档；无目录遍历、无全域兜底）：
 *   不给清单 ⇒ 明确报错要求显式清单——判了本轮没碰过的档，别轮的存量问题会记到本轮头上。
 * 两种问法（§3.20「工具形」——同一条判据）：
 *   `report`（缺省）= 报告态——**零门禁 / 零退出码 / 零阻断**，输出不得被读作拒执行的理由（用户令 > 机检）；
 *   清单里不可判档（不在盘 ∥ 非 .md）⇒ 报错点名、整次零判定；
 *   `gate` = 交付时点的裁定——首行给机器可判 verdict；不可判档给跳过行（可见，不静默丢掉）。
 *   强制面住交付协议 + 批次档 §6 前置，工具本体不阻断任何动作。
 */
import { statSync } from "node:fs"
import { relative, resolve } from "node:path"
import { checkParagraphs, DOC_CLASS } from "./paragraph.mjs"
import { checkAnchors } from "./anchors.mjs"

/** 判据参数（内置常量 · 冻结）：阈值 300 字符（一段 ∥ 一行同值——§3.18 ④）；两项空列表 = 区带类 / 豁免类默认值且恒空
 *  ——豁免谓词（表行 / 围栏 / 列表项 / 引文）住代码，没有「登记后放过」的写入口（空列表 ≠ 可登记豁免）。 */
export const DOC_CHECK_BUILTINS = Object.freeze({
  paragraphMax: 300,
  lineMax: 300,
  paragraphExemptZones: Object.freeze([]),
  exemptions: Object.freeze([]),
})

/** 相对路径显示形（正斜杠——跨平台同形）。 */
const rel = (root, p) => relative(root, p).replace(/\\/g, "/")

/** 平台路径键（Windows 大小写不敏感——只用于清单去重，非判据面）。 */
const pathKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 不可判档的两因（闭集 · 判序 = 存在性 → 类型）：不在盘 ∥ 非 markdown 档（目录归后因）。 */
function undecidableReason(abs) {
  let st
  try { st = statSync(abs) } catch { return "not on disk" }
  if (!st.isFile() || !abs.toLowerCase().endsWith(".md")) return "not a markdown document"
  return null
}

/** 清单 → 可判集（去重保序）+ 不可判档两类（`missing` ∥ `notMarkdown`）+ 非法条目下标（非字符串 / 空白）。 */
function resolveRange(base, docs) {
  const seen = new Set()
  const check = []
  const undecidable = []
  const missing = []
  const notMarkdown = []
  const invalid = []
  docs.forEach((d, i) => {
    if (typeof d !== "string" || d.trim() === "") { invalid.push(i); return }
    const abs = resolve(base, d)
    const key = pathKey(abs)
    const reason = undecidableReason(abs)
    if (reason === null) { if (!seen.has(key)) { seen.add(key); check.push(abs) } return }
    undecidable.push({ abs, reason })
    if (reason === "not on disk") missing.push(abs)
    else notMarkdown.push(abs)
  })
  return { check: check.sort(), undecidable, missing, notMarkdown, invalid }
}

/** 段判据命中行（报面单源——两类命中同形，按 `clazz` 分词）。**不报字符数**：用户 2026-10-26 11:16「不能表述成超长多少个字符，要表述成为文字太长难于阅读」。 */
const paragraphHitLine = (base, h) => `✗ ${h.clazz} ${rel(base, h.file)}:${h.line}`

/** gate 报面（固定句形——§3.20「报面（固定句形 · 交付门 gate）」）：首行 verdict = 唯一机判串。 */
function gateReport({ base, docsSource, checkFiles, skipped, anchors, paragraphs }) {
  const total = anchors.hits.length + paragraphs.length
  const src = docsSource === "session" ? "本会话写过的文档" : "显式 docs"
  // 首行：锚与段分列（用户 11:16：段的问题叫「文字太长，难于阅读」，不是「命中 N 条」也不是字符数）
  const verdict = () => {
    if (total === 0) return checkFiles.length ? "DOC-CHECK GATE: PASS" : "DOC-CHECK GATE: PASS（0 档）"
    const parts = []
    if (anchors.hits.length) parts.push(`锚 ${anchors.hits.length} 条`)
    // 段与行分列——两类命中不得合并（提示词面一行 = 一个块，属「行太长」，不是「一段文字太长」）
    const paraCount = paragraphs.filter((h) => h.clazz === DOC_CLASS.para).length
    const lineCount = paragraphs.filter((h) => h.clazz === DOC_CLASS.line).length
    if (paraCount) parts.push(`${paraCount} 段${DOC_CLASS.para}`)
    if (lineCount) parts.push(`${lineCount} ${DOC_CLASS.line}`)
    return `DOC-CHECK GATE: REFUSED（${parts.join(" · ")}）`
  }
  const out = [
    verdict(),
    "文档纪律机检（交付门 · gate）",
    checkFiles.length
      ? `范围：${src} ${checkFiles.length} 档`
      : `范围：${src} —— **0 档受检**（空清单：本次没有判任何档，不得读作「已检」）`,
    "判据：逐段检查——" + DOC_CLASS.para,
  ]
  if (skipped.missing.length) out.push(`跳过 ${skipped.missing.length} 档（已不在盘，未检）：${skipped.missing.map((p) => rel(base, p)).join(" ∥ ")}`)
  if (skipped.notMarkdown.length) out.push(`跳过 ${skipped.notMarkdown.length} 档（非 markdown 档，未检）：${skipped.notMarkdown.map((p) => rel(base, p)).join(" ∥ ")}`)
  if (checkFiles.length === 0) {
    // 空范围不静默当通过（K6）——照实说明 + 给出补充通道（两侧都不得读成「已检」）。
    // 措辞按「有没有跳过行」分流：无跳过行时不得写「见上方跳过行」。
    const hasSkips = skipped.missing.length > 0 || skipped.notMarkdown.length > 0
    out.push(docsSource === "session"
      ? (hasSkips
        ? "范围为空：本会话触达的档均不可判（见上方跳过行）——若确认改过 ⇒ 显式传 docs"
        : "范围为空：本会话没有写过 .md 档——若确认改过 ⇒ 显式传 docs")
      : (hasSkips
        ? "范围为空：显式 docs 里没有可判档——见上方跳过行"
        : "范围为空：显式 docs 是空清单——列出要判的档后复跑"))
  } else if (total === 0) {
    out.push(`结论：0 段有问题（${checkFiles.length} 档全清）`)
  } else {
    for (const h of anchors.hits) {
      out.push(h.clazz === "档缺"
        ? `✗ 锚·档缺 ${rel(base, h.file)}:${h.line} \`${h.token}\``
        : `✗ 锚·节缺 ${rel(base, h.file)}:${h.line} \`${h.token}\`（目标 ${rel(base, h.target)} 无 §${h.section}）`)
    }
    for (const w of paragraphs) out.push(paragraphHitLine(base, w))
    // 处置句只跟「段」命中走：仅有行太长时不得叫人对段落重写
    if (paragraphs.some((h) => h.clazz === DOC_CLASS.para)) out.push("处置：上面这些段落，重新组织语言重写；同轮修正后复跑；不转台账")
  }
  return out.join("\n")
}

/**
 * 跑一次文档纪律机检。
 * @param {string} root 项目根（解析序 ① 的基准）
 * @param {{docs?:string[], mode?:'report'|'gate', docsSource?:'session'|'explicit'}} [o]
 *   `mode` 缺省 = `report`；`docs` = 被判档清单（相对 `root` 或绝对）——**必填**（两种问法同）：
 *   缺省 ∥ 非数组 ⇒ 报错要求显式清单（零遍历、零全域兜底）；`report` 面**空数组也报错**，`gate` 面空数组 ⇒
 *   `PASS（0 档）` + 空范围说明（「本轮一档没碰」是真实读数）；`report` 面不可判档 ⇒ 报错、整次零判定；
 *   `gate` 面不可判档 ⇒ 跳过行；`docsSource` = 范围来源标签（`session` = 本会话触达记账 ∥ `explicit` = 显式
 *   `docs`）——缺省 = `explicit`；只影响报面措辞。
 * @returns {{report:string, hits:{total:number, anchors:number, paragraph:number}, anchorHits:Array,
 *   paragraphHits:Array, files:string[], checkFiles:string[], paragraphMax:number,
 *   skipped:{missing:string[], notMarkdown:string[]}}}
 *   消费面判「清」须读 `report` 首行（gate）∥ `hits.total`（report），不得只看其中一个。
 */
export function runDocCheck(root, { docs, mode = "report", docsSource } = {}) {
  const base = resolve(root)
  const gate = mode === "gate"
  if (docs !== undefined && !Array.isArray(docs)) {
    throw new Error(`doc_check: \`docs\` must be an array of paths (got ${typeof docs}) — a bare string is refused rather than read as a whole-domain request; pass ["<path>"].`)
  }
  if (!Array.isArray(docs)) {
    throw new Error('doc_check: `docs` is required — pass the explicit list of documents to judge. There is no default range: nothing is scanned unless you name it.')
  }
  // 报告态空清单 = 报错（「没跑」不得装成「跑了且清」）；gate 面空清单照实出 `PASS（0 档）` + 空范围说明
  // ——交付面「本轮一档没碰」是一种真实读数，不是省略。
  if (!gate && (docs.length === 0 || docs.every((d) => typeof d !== "string" || d.trim() === ""))) {
    throw new Error('doc_check: docs is empty — an empty list names no document, so nothing can be judged; list the documents you mean.')
  }
  const source = docsSource ?? "explicit"
  const range = resolveRange(base, docs)
  // 清单条目本身非法（非字符串 / 空白）——调用方错误，两种问法同拒：静默丢掉一条就是不静默地收窄范围。
  if (range.invalid.length) {
    throw new Error(`doc_check: \`docs\` entries ${range.invalid.map((i) => `[${i}]`).join(", ")} are not paths — every entry must be a non-empty string; no document was judged.`)
  }
  // 报告态 fail-closed：清单里有一个不可判档 ⇒ 报错点名、整次零判定——清单写错却报 0 命中就是「没跑」装成「跑了且清」。
  if (!gate && range.undecidable.length) {
    const named = range.undecidable.map((u) => `${rel(base, u.abs)}（${u.reason}）`).join(" ∥ ")
    throw new Error(`doc_check: docs names ${range.undecidable.length} document(s) that cannot be judged — no document was checked: ${named}. Fix the list and re-run; nothing is silently skipped and the check never widens beyond the list.`)
  }
  const checkFiles = range.check
  const { paragraphMax, lineMax, paragraphExemptZones } = DOC_CHECK_BUILTINS
  const anchors = checkAnchors(base, { files: checkFiles })
  const paragraphs = checkParagraphs({ paragraphMax, lineMax, exemptZones: paragraphExemptZones, files: checkFiles })

  const hits = { total: anchors.hits.length + paragraphs.length, anchors: anchors.hits.length, paragraph: paragraphs.length }
  const shared = {
    hits, anchorHits: anchors.hits, paragraphHits: paragraphs, files: checkFiles, checkFiles, paragraphMax,
    skipped: { missing: range.missing, notMarkdown: range.notMarkdown },
  }
  if (gate) {
    return { ...shared, report: gateReport({ base, docsSource: source, checkFiles, skipped: shared.skipped, anchors, paragraphs }) }
  }

  const out = [
    "文档纪律机检（报告态 · 非门禁）",
    `射程：${base} · 传入清单 ${checkFiles.length} 档 · 区带豁免：${paragraphExemptZones.length ? paragraphExemptZones.join(" ∥ ") : "无"}`,
    "声明：判据参数 = 工具内置常量；范围 = 传入文件（判定范围 = 解析范围）",
    `范围：传入清单 ${checkFiles.length} 档（整档入判 · 判定范围 = 解析范围）`,
    `命中 ${hits.total} 条（锚 ${anchors.hits.length} · ${DOC_CLASS.para} ${paragraphs.filter((h) => h.clazz === DOC_CLASS.para).length} · ${DOC_CLASS.line} ${paragraphs.filter((h) => h.clazz === DOC_CLASS.line).length}）`,
  ]
  for (const h of anchors.hits) {
    out.push(h.clazz === "档缺"
      ? `✗ 锚·档缺 ${rel(base, h.file)}:${h.line} \`${h.token}\``
      : `✗ 锚·节缺 ${rel(base, h.file)}:${h.line} \`${h.token}\`（目标 ${rel(base, h.target)} 无 §${h.section}）`)
  }
  for (const w of paragraphs) out.push(paragraphHitLine(base, w))
  out.push(hits.total ? `结论：${hits.total} 条命中——报告态，不作拒执行的理由` : `结论：0 条命中（锚 ∥ ${DOC_CLASS.para} ∥ ${DOC_CLASS.line} 均清）`)

  return { ...shared, report: out.join("\n") }
}
