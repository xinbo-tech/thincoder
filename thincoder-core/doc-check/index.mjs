/**
 * doc-check/index.mjs — 文档纪律机检 · 引擎入口（两条判据 + 报面行）。
 *
 * 判据两条（起步 · 闭集——口径单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.20 条目 S）：
 *   ① 锚（档缺 / 节缺）——实现 = `./anchors.mjs`；② 行宽——口径 = §3.18 条目 Q，实现 = `./width.mjs`。
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
import { checkDocWidths } from "./width.mjs"
import { checkAnchors } from "./anchors.mjs"

/** 判据参数（内置常量 · 冻结）：阈值 300 字符；两项空列表 = 区带类 / 豁免类默认值且恒空
 *  ——豁免谓词（表行 / 围栏 / 可执行行 / 引文）住代码，没有「登记后放过」的写入口（空列表 ≠ 可登记豁免）。 */
export const DOC_CHECK_BUILTINS = Object.freeze({
  lineWidth: 300,
  widthExemptZones: Object.freeze([]),
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

/** gate 报面（固定句形——§3.20「报面（固定句形 · 交付门 gate）」）：首行 verdict = 唯一机判串。 */
function gateReport({ base, docsSource, checkFiles, skipped, anchors, widths, lineWidth }) {
  const total = anchors.hits.length + widths.length
  const src = docsSource === "session" ? "本会话写过的文档" : "显式 docs"
  const out = [
    total ? `DOC-CHECK GATE: REFUSED（命中 ${total} 条）` : (checkFiles.length ? "DOC-CHECK GATE: PASS" : "DOC-CHECK GATE: PASS（0 档）"),
    "文档纪律机检（交付门 · gate）",
    checkFiles.length
      ? `范围：${src} ${checkFiles.length} 档 · 阈值 ${lineWidth} 字符（工具内置常量）`
      : `范围：${src} —— **0 档受检**（空清单：本次没有判任何档，不得读作「已检」）· 阈值 ${lineWidth} 字符（工具内置常量）`,
    "判据：工具内置常量（锚 ∥ 行宽）——判定范围 = 解析范围 = 传入档",
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
    out.push(`结论：0 条命中（${checkFiles.length} 档全清）`)
  } else {
    for (const h of anchors.hits) {
      out.push(h.clazz === "档缺"
        ? `✗ 锚·档缺 ${rel(base, h.file)}:${h.line} \`${h.token}\``
        : `✗ 锚·节缺 ${rel(base, h.file)}:${h.line} \`${h.token}\`（目标 ${rel(base, h.target)} 无 §${h.section}）`)
    }
    for (const w of widths) out.push(`✗ 行宽 ${rel(base, w.file)}:${w.line}（${w.len} 字符）`)
    out.push("处置：同轮修正后复跑（改文档 ∥ 修引擎）；不转台账；拿不准 ⇒ 上抛主 agent 裁决（主 agent 拿不准 ⇒ 转呈用户）")
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
 * @returns {{report:string, hits:{total:number, anchors:number, width:number}, anchorHits:Array,
 *   widthHits:Array, files:string[], checkFiles:string[], lineWidth:number,
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
  const { lineWidth, widthExemptZones } = DOC_CHECK_BUILTINS
  const anchors = checkAnchors(base, { files: checkFiles })
  const widths = checkDocWidths({ lineWidth, exemptZones: widthExemptZones, files: checkFiles })

  const hits = { total: anchors.hits.length + widths.length, anchors: anchors.hits.length, width: widths.length }
  const shared = {
    hits, anchorHits: anchors.hits, widthHits: widths, files: checkFiles, checkFiles, lineWidth,
    skipped: { missing: range.missing, notMarkdown: range.notMarkdown },
  }
  if (gate) {
    return { ...shared, report: gateReport({ base, docsSource: source, checkFiles, skipped: shared.skipped, anchors, widths, lineWidth }) }
  }

  const out = [
    "文档纪律机检（报告态 · 非门禁）",
    `射程：${base} · 传入清单 ${checkFiles.length} 档 · 阈值 ${lineWidth} 字符（工具内置常量）· 区带豁免：${widthExemptZones.length ? widthExemptZones.join(" ∥ ") : "无"}`,
    "声明：判据参数 = 工具内置常量；范围 = 传入文件（判定范围 = 解析范围）",
    `范围：传入清单 ${checkFiles.length} 档（整档入判 · 判定范围 = 解析范围）`,
    `命中 ${hits.total} 条（锚 ${anchors.hits.length} · 行宽 ${widths.length}）`,
  ]
  for (const h of anchors.hits) {
    out.push(h.clazz === "档缺"
      ? `✗ 锚·档缺 ${rel(base, h.file)}:${h.line} \`${h.token}\``
      : `✗ 锚·节缺 ${rel(base, h.file)}:${h.line} \`${h.token}\`（目标 ${rel(base, h.target)} 无 §${h.section}）`)
  }
  for (const w of widths) out.push(`✗ 行宽 ${rel(base, w.file)}:${w.line}（${w.len} 字符）`)
  out.push(hits.total ? `结论：${hits.total} 条命中——报告态，不作拒执行的理由` : "结论：0 条命中（锚 ∥ 行宽 均清）")

  return { ...shared, report: out.join("\n") }
}
