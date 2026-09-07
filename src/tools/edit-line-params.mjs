/**
 * edit-line-params.mjs — edit 工具「按行号改」子模块（EDIT-TOOL-IMPROVEMENT.md D1，
 * 2026-09-08——file-edit.mjs 跨 500 硬帽拆分边界，评审 #4）。
 *
 * 承载：line/startLine/endLine 参数处理 + 行号定位 + 替换逻辑。纯计算（LF 域）——
 * 文件读取/写回/EOL 复原由 file-edit.mjs 调用方负责（与现有 edit 写回路径一致，
 * 原子性不变：单条形态一次替换一次写回）。
 *
 * 语义契约：
 *   - line: N（1-based）→ 第 N 行被 new_string 替换（new_string 可多空行）。
 *   - startLine/endLine（均 1-based，闭区间）→ 行范围被 new_string 替换。
 *   - line 与 startLine/endLine 互斥；三者与 old_string 互斥（调用方先判）。
 *   - 空 new_string = 删除该行/该行范围（替换即删——与 D3 同语义族）。
 *   - 行号越界 / 非法（非整数、<1、startLine>endLine）→ 明确错误，不写文件。
 */

import { readFile, writeFile } from "node:fs/promises"
import { resolvePath, getOpenDoc, applyEditorEdit, normalizeEOL, detectFileEol, refreshMarkdownPreview } from "./shared.mjs"

/** line/startLine/endLine 与 old_string 互斥（与 EDIT_MUTEX_TEXT 同族文案） */
export const LINE_MUTEX_TEXT = "line/startLine/endLine are mutually exclusive with old_string — use line numbers OR old_string, not both"

/** 是否携带按行号改参数（undefined 判定——与现有 args 形态一致） */
export function hasLineParams(args) {
  return args.line !== undefined || args.startLine !== undefined || args.endLine !== undefined
}

/** 按行 split：尾换行是终结符而非一行（与 edit-diff splitLines 同规则） */
function splitContentLines(text) {
  const lines = text.split("\n")
  if (text.endsWith("\n")) lines.pop()
  return lines
}

function isLineNumber(v) {
  return typeof v === "number" && Number.isInteger(v)
}

/**
 * @param {object} p
 * @param {string} p.text       LF 域文件全文（normalizeEOL 后）
 * @param {number} [p.line]     单行替换（1-based）
 * @param {number} [p.startLine] 行范围起（1-based，与 endLine 成对）
 * @param {number} [p.endLine]  行范围止（1-based，闭区间）
 * @param {string} p.newString  替换文本（可多空行；空串 = 删除目标行）
 * @param {string} p.path       错误消息用的显示路径
 * @returns {{ok: true, newText: string, replacedLines: number, firstLine: number}
 *          | {ok: false, reason: string}}
 *          newText 保持 text 的尾部终结符形态（原文件以 \n 结尾则结果亦然）。
 */
export function computeLineEdit({ text, line, startLine, endLine, newString, path }) {
  if (line !== undefined && (startLine !== undefined || endLine !== undefined)) {
    return { ok: false, reason: "line is mutually exclusive with startLine/endLine — use a single line number or a range, not both" }
  }
  if ((startLine !== undefined) !== (endLine !== undefined)) {
    return { ok: false, reason: "startLine and endLine must be given together (both 1-based, inclusive range)" }
  }
  let first, last
  if (line !== undefined) {
    if (!isLineNumber(line)) return { ok: false, reason: `line must be an integer line number (got ${JSON.stringify(line)})` }
    first = last = line
  } else {
    if (!isLineNumber(startLine) || !isLineNumber(endLine)) {
      return { ok: false, reason: "startLine/endLine must be integer line numbers" }
    }
    if (startLine > endLine) {
      return { ok: false, reason: `startLine (${startLine}) must be <= endLine (${endLine})` }
    }
    first = startLine
    last = endLine
  }
  const trailingNl = text.endsWith("\n") || text === ""
  const lines = splitContentLines(text)
  const total = lines.length
  if (first < 1 || last > total) {
    return { ok: false, reason: `line ${first === last ? first : `${first}-${last}`} out of range in ${path} (file has ${total} line(s)) — re-read the file for current line numbers` }
  }
  const newLines = newString === "" ? [] : splitContentLines(normalizeEOL(newString))
  lines.splice(first - 1, last - first + 1, ...newLines)
  let newText = lines.join("\n")
  if (trailingNl && newText !== "") newText += "\n"
  return { ok: true, newText, replacedLines: last - first + 1, firstLine: first }
}

/**
 * 按行号改的完整执行路径（读取 → computeLineEdit → 写回，原子——单条形态一次
 * 替换一次写回；与 file-edit.mjs 现有写回规则一致：打开文档走 WorkspaceEdit 全量
 * 语义并立即保存，否则写盘 + 复原文件 EOL）。返回工具结果字符串（错误或成功消息）。
 *
 * @param {object} p
 * @param {string} p.path      显示路径（path/filePath 已在调用方归一）
 * @param {number} [p.line] / [p.startLine] / [p.endLine]  行号参数
 * @param {string} p.newString 替换文本
 * @param {string} p.cwd       resolvePath 基准
 */
export async function executeLineEdit({ path, line, startLine, endLine, newString, cwd }) {
  const abs = resolvePath(path, cwd)
  const doc = getOpenDoc(abs)
  const rawText = doc ? doc.getText() : await readFile(abs, "utf8")
  const fileEol = detectFileEol(rawText)
  const text = normalizeEOL(rawText)
  const r = computeLineEdit({ text, line, startLine, endLine, newString, path })
  if (!r.ok) return `Error: ${r.reason}`
  // 写回复原文件 EOL（与 edit 现有写回路径同规则）
  const out = fileEol === "\r\n" ? r.newText.replace(/\n/g, "\r\n") : r.newText
  if (doc) {
    if (doc.isDirty) return `Error: File has unsaved changes in the editor: ${abs}. Save or discard before allowing automated edits.`
    await applyEditorEdit(doc, out)
    return `Replaced ${r.replacedLines} line(s) at L${r.firstLine} in ${path} (via editor)`
  }
  await writeFile(abs, out, "utf8")
  refreshMarkdownPreview(abs)
  return `Replaced ${r.replacedLines} line(s) at L${r.firstLine} in ${path}`
}
