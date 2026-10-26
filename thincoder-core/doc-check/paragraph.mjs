/**
 * doc-check/paragraph.mjs — 文档纪律机检的产品档位（段判据谓词族 + 段判据——实现单源）。
 *
 * 口径单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.18 条目 Q（单位是段 / 面谓词 / 阈值 / 不分域）；
 * 产品内建裁定 = 同档 §3.20 条目 S——谓词单源随迁：本仓 `scripts/doc-check-paragraph.mjs` 改述为
 * **再出口缝**（薄档 · 零逻辑 · 逐名再出口），盘上不留第二份谓词实现。
 * 两面切块：文档面量段（相邻非空正文行合并成一段，量段长）· 提示词面（`isPromptFace`）量行
 * （逐行裸判，无结构豁免）。度量 = `[...line].length`（CJK 计 1——不引显示宽度 / 字体）；
 * 阈值 = 调用方的内置常量（`DOC_CHECK_BUILTINS.paragraphMax` / `lineMax`）——不读声明面，也不扫目录：
 * **判定集 = 调用方传入的文件清单**。
 * 不计入段的行类（同时把段断开）= 空行 ∥ 表格行 ∥ 标题 ∥ 列表项 ∥ 引用行 ∥ 围栏（标记行与块内整行）
 * ∥ 区带内：只认结构谓词，无行级白名单（按行号 / 注释声明的豁免不入判）；可执行行在段判据里**不豁免**
 * （段 = 读者所见，码段渲染后仍在段内——§3.18 关键决策 ①）。
 * 边界：本档零门禁 / 零退出码 / 零阻断——报告态由 `agent-tools/doc-check.mjs` 呈现。
 */
import { readFileSync } from "node:fs"

/** 段判据类名单源（报面与统计同取此名——改报面忘改过滤的字面漂移，2026-10-26 实发过一次）。 */
export const DOC_CLASS = Object.freeze({ para: "文字太长，难于阅读", line: "行太长" })

/** 表格行谓词（markdown 表格行结构性不可折行——不计入段，与锚检查同源）。 */
export const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(String(l))

/** 围栏标记（行首可选空白 + 三反引号 ∥ 三波浪号 ⇒ 标记字符；非围栏行 ⇒ null）——**单源**：
 *  `isFenceLine` 与两处块扫描（本节段判据 ∥ `./anchors.mjs` 锚抽取）同取此式，使「同形围栏行止」只此一解
 *  （同一模块内同符两义 = 单源可漂的结构口子）。 */
export function fenceMark(l) {
  const m = /^\s*(`{3,}|~{3,})/.exec(String(l))
  return m ? m[1][0] : null
}

/** 围栏行谓词（单源 = `fenceMark`）——围栏行自身与块内整行均不计入段。 */
export const isFenceLine = (l) => fenceMark(l) !== null

/** 引文块行谓词（行首可选空白 + `>`）——连续 `>` 行整块不计入段（引证须逐字连续、不可折，同表行理据）。 */
export const isQuoteLine = (l) => /^\s*>/.test(String(l))

/** 列表项谓词（无序 `-` ∥ `*` ∥ `+` · 有序 `数字 + . ∥ ） ∥ 、` + 空白）——列表项不计入段且断段。 */
export const isListItem = (l) => /^\s*(?:[-*+]|\d+[.)、])\s/.test(String(l))

/** 提示词面谓词（`thincoder-core/prompts/**`——形态对齐 `./anchors.mjs` 的 `OPERAND_FACE`，单源住本档）：
 *  模型读原始文本，一行就是一个块（FR46 同源理由）⇒ 该面逐行裸判，无结构豁免。 */
export const isPromptFace = (abs) => /(?:^|\/)thincoder-core\/prompts\//i.test(String(abs).replace(/\\/g, "/"))

/** 区带头谓词（§3.15 谓词面）：标题文本去首部编号（`^\d+(?:\.\d+)*[.、]?\s*`）后——等于区带名 ∨ 以
 *  「区带名 + （∕(」起（容括注后缀，如 `变更记录（续）`）；闭集外一律不纳（fail-closed）。 */
export function isZoneHead(headingText, zones = []) {
  const text = String(headingText).replace(/^\d+(?:\.\d+)*[.、]?\s*/, "")
  return zones.some((z) => typeof z === "string" && z !== "" && (text === z || text.startsWith(z + "（") || text.startsWith(z + "(")))
}

/** 行内可执行坐标（命令 / 搜索模式串码段）——锚判据整行跳过用（证据与命令保字面）；段判据不豁免（段 = 读者所见）。 */
export function isExecutableLine(line) {
  const l = String(line)
  if (/`[^`\n]*&&[^`\n]*`/.test(l)) return true // 命令链（cd … && …）
  if (/`[^`\n]*\b(?:cd|node|npm|npx|grep|rg|git)\s[^`\n]*`/.test(l)) return true // 码段内命令词
  if (/`[^`\n]*(?:\[\^|\\\.|\(\?<|\(\?:|\{\d)/.test(l)) return true // 码段内搜索模式串片段
  return false
}

/** 行内位置是否在反引号码段内（引述面不判）。 */
export function inCodeSpan(line, idx) {
  return (String(line).slice(0, idx).match(/`/g) ?? []).length % 2 === 1
}

/** 段判据（阈值 = 调用方内置常量 `paragraphMax` ∥ `lineMax`；口径逐字 = §3.18 条目 Q）：
 *  · 文档面：相邻非空正文行合并成一段，段长 = 组成行 `[...line].length` 之和 > `paragraphMax` ⇔ 命中
 *    （`clazz: "文字太长，难于阅读"`，定位 = 段首行号）。正文行 = 非空 ∧ 非表格行 ∧ 非标题 ∧ 非列表项 ∧ 非引用行
 *    ∧ 非围栏（标记行与块内整行）∧ 非区带内；其余行类不计入、且把段断开。
 *  · 提示词面（`isPromptFace`）：逐行裸判——`[...line].length` > `lineMax` ⇔ 命中（`clazz: "行太长"`，
 *    无结构豁免）。
 *  单遍扫描携标题栈（`^(#{1,6})\s` 行入栈——同级 ∥ 更高级出栈）：行所属标题链任一为区带头 ⇒ 区带内
 *  （不计入段且断段）。围栏未闭合 ⇒ 至档尾整块免（fail-open 方向——§3.18 残余登记 ①）；
 *  `exemptZones` 缺省 ∥ 空集 ⇒ 零豁免。`files`（必填）= **判定集**（调用方传入的档清单——本档不遍历
 *  任何目录；空集 ⇒ 零命中）。 */
export function checkParagraphs({ paragraphMax, lineMax, exemptZones = [], files = [] } = {}) {
  const zones = (Array.isArray(exemptZones) ? exemptZones : []).filter((z) => typeof z === "string" && z !== "")
  const hits = []
  for (const f of files) {
    let text = ""
    try { text = readFileSync(f, "utf8") } catch { continue }
    if (isPromptFace(f)) {
      text.split("\n").forEach((l, i) => {
        const len = [...l].length
        if (len > lineMax) hits.push({ file: f, line: i + 1, len, clazz: DOC_CLASS.line })
      })
      continue
    }
    const stack = [] // 标题栈 —— { level, exempt }；exempt = 自身 ∥ 祖先命中区带
    let fence = null // 围栏标记（` ∥ ~）；null = 不在块内
    let para = null // 在写的段 —— { start, len }；非正文行 ⇒ 断开
    const lines = text.split("\n")
    const flush = () => {
      if (para !== null && para.len > paragraphMax) hits.push({ file: f, line: para.start, len: para.len, clazz: DOC_CLASS.para })
      para = null
    }
    lines.forEach((l, i) => {
      const mark = fenceMark(l)
      if (mark !== null) {
        if (fence === null) fence = mark
        else if (mark === fence) fence = null
        flush()
        return // 围栏标记行自身断段
      }
      if (fence !== null) { flush(); return } // 块内整行断段（未闭合 ⇒ 至档尾免）
      const hm = /^(#{1,6})\s+(.*)$/.exec(l)
      if (hm) {
        while (stack.length && stack[stack.length - 1].level >= hm[1].length) stack.pop()
        const self = isZoneHead(hm[2].trim(), zones)
        stack.push({ level: hm[1].length, exempt: self || (stack[stack.length - 1]?.exempt ?? false) })
        flush()
        return // 标题断段
      }
      const inZone = stack[stack.length - 1]?.exempt === true
      if (inZone || l.trim() === "" || isTableRow(l) || isListItem(l) || isQuoteLine(l)) { flush(); return }
      if (para === null) para = { start: i + 1, len: 0 }
      para.len += [...l].length
    })
    flush()
  }
  return hits
}
