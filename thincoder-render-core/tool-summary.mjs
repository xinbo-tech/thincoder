/**
 * tool-summary.js — 一行式工具结果摘要（活卡 `ui.js finishToolCard` 与恢复面
 * `ui.js buildToolHistory` 共用单源）。
 *
 * 显示面消差批（2026-09-20 · 批档 §2.2 X3/X7）：自 `ui.js` 的 `resultSummary` 整段迁出
 * （先例 = `webview/tool-card-restore.mjs`：让 `ui.js` 留在 500 行硬限内），并按**CLI 标尺**
 * 补结构化分派——字面与分派形态逐字承 `thincoder-cli/src/tui/tool-summaries.mjs`
 * （跨端等值由直驱对端纯函数对拍——现载体 = 批件 `docs/batches/2026-09-30-crossline-clearance-core.test.mjs` T-XL16b；禁复制常量当断言源）。
 *
 * 分派（未登记工具 ⇒ 默认分支）：
 *  - `advisor`                    裁决计数 `N critical, N advisory, N style` / `passed` / 拒因首句
 *  - `read`(`read_file`)          `N lines`
 *  - `write`(`write_file`)        `wrote N bytes` / 首行（兜底）
 *  - `grep`(`search`)             `N matches` / `1 match` / `no matches`
 *  - `glob`                       `N files` / `1 file` / `no files`
 *  - `verify`                     `verify: <Changed files …> — N syntax error(s) — ✓ Tests passed. — Task list: …`（CLI `:92-113` 同规）
 *  - `bash`                       `bash: <末行> (exit code N)`（含成功面 `(exit code 0)`——#677 · I16b 归一；末行提取 = CLI `:60-68`）
 *  - 默认（未登记工具）            `name: <首个非空行>`（CLI `:15-17` 同规）
 *
 * 端差与判据（不并核 —— 重复形态登记：核单源化 = 跨批结构面，批档 §2.8 #6）：
 *  - **状态位族**（`(exit code N)` / `(killed: …)` / `(spawn failed)`）显示文本由 `lib.js
 *    toolStatusText` 单源附加（`bash` 分支口径）；失败判据（红 ∕ 保持展开）同源 `isToolFailure`
 *    ∥ `toolFailureStatus`——本叶不另立第二份状态语法。
 *  - **成功面拼接归一（#677 · I16b）**：含成功面 `(exit code 0)`——拼接以 CLI 标尺为准（原「成功面不拼」端差已消）。
 *  - 失败面（有状态位）`(empty)` 占位 / 状态行本体不作内容（F-W16：卡不读作 `(empty)` 而无信号
 *    ——`docs/vsc/design/WEBVIEW.md` §4.3）；无状态位时末行（含 `(empty)`）原样入内容位（与 CLI 同形）。
 */

import { toolStatusText } from "./lib.mjs"

/** bash 包装行（CLI `:61` 同规）：`[stdout]:` / `[stderr]:` / `(exit code …` / `(killed…`。 */
const BASH_MARKER = /^\[(?:stdout|stderr)\]:$|^\((?:exit code|killed)/

/** 一行式摘要（无摘要 ⇒ `null` / `""` ——消费面按 falsy 处理，与 `resultSummary` 同规）。 */
export function formatToolSummary(name, text) {
  const s = String(text ?? "")
  if (name === "advisor") return _advisorSummary(s)
  if (name === "read" || name === "read_file") return _readSummary(s)
  if (name === "write" || name === "write_file") return _writeSummary(s)
  if (name === "grep" || name === "search") return _grepSummary(s)
  if (name === "glob") return _globSummary(s)
  if (name === "verify") return _verifySummary(s)
  if (name === "bash") return _bashSummary(s)
  return _defaultSummary(name, s)
}

/** 未知工具：首个非空行（CLI `tool-summaries.mjs:15-17` 同规——含 `name:` 前缀）。 */
function _defaultSummary(name, text) {
  const first = text.split("\n").find((l) => l.trim())
  return first ? `${name}: ${first.slice(0, 100)}` : null
}

function _readSummary(text) {
  const countMatch = text.match(/(\d+) lines?/)
  if (countMatch) return `${countMatch[1]} lines`
  return `${text.split("\n").length} lines`
}

function _writeSummary(text) {
  if (text.includes("wrote") || text.includes("created")) {
    const sizeMatch = text.match(/(\d+)(?:\s*(?:bytes?|chars?))/i)
    return sizeMatch ? `wrote ${sizeMatch[1]} bytes` : "wrote file"
  }
  const first = text.split("\n").find((l) => l.trim())
  return first ? first.slice(0, 80) : "wrote"
}

function _grepSummary(text) {
  const count = text.split("\n").filter((l) => l.trim()).length
  if (count === 0) return "no matches"
  if (count === 1) return "1 match"
  return `${count} matches`
}

function _globSummary(text) {
  const count = text.split("\n").filter((l) => l.trim()).length
  if (count === 0) return "no files"
  if (count === 1) return "1 file"
  return `${count} files`
}

/**
 * bash 结果形（`[stdout]:\n<out>\n\n(exit code 0)`）：首行恒为 `[stdout]:` 包装标记 ⇒ 摘要取末条
 * 输出行（CLI `:60-68` 同规）+ `bash: ` 前缀（CLI 字面）。状态位 = `lib.js toolStatusText` 单源
 * （显示面——含成功面 `(exit code 0)`；拼接与 CLI 标尺归一：#677 · I16b）；失败面 `(empty)` 占位
 * 不入内容位（F-W16：卡不读作 `(empty)` 而无信号）；无状态位时末行原样（与 CLI 同形）。
 */
function _bashSummary(text) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const lines = trimmed.split("\n").map((l) => l.trim()).filter((l) => l && !BASH_MARKER.test(l))
  const last = lines.pop() ?? trimmed.split("\n").filter(Boolean).pop() ?? ""
  const brief = last.length > 100 ? last.slice(0, 100) : last
  const status = toolStatusText(text)
  const body = brief && brief !== "(empty)" && brief !== status ? brief : ""
  if (body) return `bash: ${body}${status ? " " + status : ""}`
  if (status) return `bash: ${status}`
  return brief ? `bash: ${brief}` : null
}

/** verify 裁决摘要（CLI `tool-summaries.mjs:92-113` 同规——#677 · I16b 补落）：`Changed files…` 行归一 ∕
 * 语法错误计数 ∕ 测试结论行 ∕ `Task list:` 行按 ` — ` 连接；无段 ⇒ `""`。 */
function _verifySummary(text) {
  const lines = text.split("\n")
  const summary = []
  const changed = lines.find((l) => l.startsWith("Changed files:"))
  if (changed) summary.push(changed.match(/files changed/) ? changed.replace(/^Changed files \(.*?\)/, "Changed files") : changed)
  const syntax = lines.filter((l) => l.startsWith("  ✗")).length
  if (syntax) summary.push(`${syntax} syntax error(s)`)
  const testLine = lines.find((l) => l.startsWith("✓ Tests passed.") || l.startsWith("✗ Tests FAILED"))
  if (testLine) summary.push(testLine.trim())
  const taskLine = lines.find((l) => l.startsWith("Task list:"))
  if (taskLine) summary.push(taskLine)
  return summary.length > 0 ? `verify: ${summary.join(" — ")}` : ""
}

/**
 * advisor 裁决摘要（CLI `:70-90` 同规）：拒因形 `Advisor: <首句>` ⇒ `advisor: <首句>`；
 * 评审表按 🔴/🟡/🔵 列计数 ⇒ `advisor: N critical, N advisory, N style`；零 🔴 且表 / 通过
 * 措辞在场 ⇒ `advisor: passed`；无计数 ⇒ `null`。
 */
function _advisorSummary(text) {
  const errMatch = text.trimStart().match(/^Advisor:\s*(.+)/)
  if (errMatch) return `advisor: ${errMatch[1].split(".")[0]}`
  const critical = (text.match(/\| \d+ \|.*\| 🔴/g) || []).length
  const advisory = (text.match(/\| \d+ \|.*\| 🟡/g) || []).length
  const style = (text.match(/\| \d+ \|.*\| 🔵/g) || []).length
  // 规程：评审表零 🔴 行 = 通过（无表摘要用措辞兜底，如 "No issues found"）
  if (critical === 0 && (/\| \d+ \|/.test(text)
    || /no\s+🔴|all.*(?:resolved|fixed|pass)|pass(?:es|ed)?\b|no\s+(?:critical\s+)?issues?/i.test(text))) {
    return "advisor: passed"
  }
  const parts = []
  if (critical) parts.push(`${critical} critical`)
  if (advisory) parts.push(`${advisory} advisory`)
  if (style) parts.push(`${style} style`)
  if (parts.length === 0) return null
  return `advisor: ${parts.join(", ")}`
}
