/**
 * doc-check/line-refs.mjs — `report` 面的行号坐标清单（只报不拦 · 三形归属窗）。
 *
 * 判据句单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.23 条目 W（本档只实现，不重述口径）：
 * · 行号坐标 = **一个档名之后出现的 `:` 加数字**；归属窗三形闭集 = 紧贴 ∥ 承名 ∥ 段落承名
 *   （三形是**读数分类**，不是判据分级——同一命中按处计，不按形加权）；
 * · 它是**清点，不是判据**：不产 verdict、不计入 `hits`、不阻断任何写入。
 *   调用点只在 `./index.mjs` 的 `if (gate) { return … }` 早返回之后的报面构造段——`gate` 分支够不着本档，
 *   所以「闸看不见清单」是构造上的事实，不是「算出来但声明不参与」。
 * · 档名豁免 = 与锚判同一谓词 `docNameExemption`（单源 = `./anchors.mjs` ∥ §3.24 条目 X）——
 *   本档零自建名集：占位形（`x.md`）∥ 类名（`todo.md`）不算档名，也就不构成任何归属窗。
 *
 * 量法（清单块**首行**自承）：抽取式 = 本档两条正则；扫描域 = 调用方传入的档清单
 *   （与两条判据同一集、同一档数；不另取范围、不做全仓扫描）。
 * 两个面并列：**正文面** = 围栏块整块跳过 ∧ 可执行行跳过；**围栏内** = 不跳围栏时独有的处；**合计** = 两数之和。
 *   为什么围栏面要留：围栏块里躺着成片的存量坐标（改前 / 改后对照块的左半），清账要看见的正是它们；
 *   反方向也要防——围栏同时是举例的家，只报全文面会把举例混进读数，读数就没法跟下一份比。
 */
import { readFileSync } from "node:fs"
import { basename, relative } from "node:path"
import { docNameExemption } from "./anchors.mjs"
import { fenceMark, isFenceClose, isExecutableLine } from "./paragraph.mjs"

/** 档名 token（抽取式 · 逐字 = 判据句）：目录段可选，扩展名闭集。左界排除更长 token 的尾段、右界排除后续字母数字。 */
export const NAME_RE = /(?<![A-Za-z0-9_.\-\\/@])((?:[A-Za-z0-9_.\-]+\/)*[A-Za-z0-9_.\-]+\.(?:md|mjs|cjs|js|json|css|html|svg|yml|yaml|sh|ps1))(?![\w])/

/** 行号坐标（抽取式 · 逐字 = 判据句）：`:` 后接数字（可带 `-` 区间）；左界只排数字 / 冒号前导（挡时刻 `12:30`）。 */
export const COORD_RE = /(?<![0-9:]):(\d+)(?:-(\d+))?(?![\w])/

/** 相对路径显示形（正斜杠——跨平台同形）。 */
const rel = (base, p) => relative(base, p).replace(/\\/g, "/")

/** 原文片段 ≤ 40 字（CJK 按字计——`[...]` 逐码点切，不按 UTF-16 单元）。 */
const snippet = (line) => [...line.trim()].slice(0, 40).join("")

/** 一行内的档名位置（已过豁免谓词——豁免名不算档名，也就不构成任何归属窗）。 */
function nameSpans(line) {
  const out = []
  const re = new RegExp(NAME_RE.source, "g")
  let m
  while ((m = re.exec(line)) !== null) {
    if (docNameExemption(basename(m[1])) !== null) continue
    out.push({ start: m.index, end: m.index + m[0].length })
  }
  return out
}

/**
 * 采集：逐档逐行找行号坐标，定归属窗，分两面。
 * @param {{files?:string[]}} o `files` = 扫描域（调用方传入的档清单——本档不遍历目录、不做全仓扫描）
 * @returns {{body:Array, fenced:Array, total:number}}
 *   `body` = 正文面的处（围栏块外 ∧ 非可执行行）；`fenced` = 围栏内独有的处；每处 = `{file, line, form, fenced, snippet}`
 */
export function collectLineRefs({ files = [] } = {}) {
  const body = []
  const fenced = []
  for (const f of files) {
    let text = ""
    try { text = readFileSync(f, "utf8") } catch { continue }
    let fence = null // 围栏标记（` ∥ ~）；null = 不在块内
    let prevNames = [] // 上一行的档名位置（③ 段落承名取其中最后一个）
    text.split("\n").forEach((l, i) => {
      const mark = fenceMark(l)
      const inFence = fence !== null
      if (mark !== null) {
        if (fence === null) fence = mark
        else if (isFenceClose(mark, fence)) fence = null
        prevNames = [] // 围栏标记行不承载档名（③ 因此不跨过围栏边界）
        return
      }
      if (isExecutableLine(l)) { prevNames = []; return } // 可执行行整行不判（命令保字面——两面同跳）
      const names = nameSpans(l)
      const re = new RegExp(COORD_RE.source, "g")
      let m
      while ((m = re.exec(l)) !== null) {
        const at = m.index
        const before = names.filter((n) => n.end <= at)
        let form
        if (before.length && before[before.length - 1].end === at) form = "①" // 紧贴：档名与 `:` 之间零字符
        else if (before.length) form = "②" // 承名：本行前文有档名（反引号收尾的坐标归此形）
        else if (prevNames.length) form = "③" // 段落承名：本行无前文档名，取上一行最后一个档名
        else continue // 无主——判据句自然排除，不列例外表
        const hit = { file: f, line: i + 1, form, fenced: inFence, snippet: snippet(l) }
        ;(inFence ? fenced : body).push(hit)
      }
      prevNames = names
    })
  }
  return { body, fenced, total: body.length + fenced.length }
}

/**
 * 清单块（四件 · 定名 = §3.23「清单块的形态与位置」）：**量法行**（首行：抽取式 + 扫描域）·
 * **合计行** · **逐处行**（`源档:行` + 原文片段 ≤ 40 字，围栏内那处带 `围栏内` 标）· **空态行**（无命中时：`行号坐标 0 处`）。
 * 块内不留空行——空行读起来像「没跑」。
 * @param {{base:string, files?:string[], refs?:{body:Array, fenced:Array, total:number}}} o
 *   `refs` 缺省 ⇒ 本函数现采一次；调用方要给返回值时传进来，别采两遍
 * @returns {string[]} 块内各行（按序）
 */
export function lineRefsBlock({ base, files = [], refs = collectLineRefs({ files }) }) {
  const out = [
    `量法（行号坐标清单）：档名 = ${NAME_RE} · 坐标 = ${COORD_RE} · 扫描域 = 传入清单 ${files.length} 档（${base}）`,
  ]
  if (refs.total === 0) {
    out.push("行号坐标 0 处")
    return out
  }
  out.push(`正文面 ${refs.body.length} 处 · 围栏内 ${refs.fenced.length} 处 · 合计 ${refs.total} 处`)
  for (const h of refs.body) out.push(`  · ${h.form} ${rel(base, h.file)}:${h.line}  ${h.snippet}`)
  for (const h of refs.fenced) out.push(`  · ${h.form} ${rel(base, h.file)}:${h.line} 围栏内  ${h.snippet}`)
  return out
}
