/**
 * tool-summaries.mjs — one-line tool-result summaries for the TUI "done" lines.
 * Extracted from agent-turn.mjs (file-size split): pure functions, no state.
 */

/** Extract a one-line summary from tool output for the done line */
export function formatToolSummary(name, result) {
  if (name === "verify") return _verifySummary(result)
  if (name === "bash") return _bashSummary(result)
  if (name === "advisor") return _advisorSummary(result)
  if (name === "read" || name === "read_file") return _readSummary(result)
  if (name === "write" || name === "write_file") return _writeSummary(result)
  if (name === "grep" || name === "search") return _grepSummary(result)
  if (name === "glob") return _globSummary(result)
  // Default: first non-empty line
  const first = result.split("\n").find((l) => l.trim())
  return first ? `${name}: ${first.slice(0, 100)}` : null
}

function _readSummary(result) {
  const lines = result.split("\n")
  // Look for line count in result
  const countMatch = result.match(/(\d+) lines?/)
  if (countMatch) return `${countMatch[1]} lines`
  // Fallback: count actual lines
  return `${lines.length} lines`
}

function _writeSummary(result) {
  // Extract file size or confirmation
  if (result.includes("wrote") || result.includes("created")) {
    const sizeMatch = result.match(/(\d+)(?:\s*(?:bytes?|chars?))/i)
    return sizeMatch ? `wrote ${sizeMatch[1]} bytes` : "wrote file"
  }
  const first = result.split("\n").find((l) => l.trim())
  return first ? first.slice(0, 80) : "wrote"
}

function _grepSummary(result) {
  const lines = result.split("\n").filter((l) => l.trim())
  const count = lines.length
  if (count === 0) return "no matches"
  if (count === 1) return "1 match"
  return `${count} matches`
}

function _globSummary(result) {
  const lines = result.split("\n").filter((l) => l.trim())
  const count = lines.length
  if (count === 0) return "no files"
  if (count === 1) return "1 file"
  return `${count} files`
}

/**
 * bash result format: "[stdout]:\n<out>\n\n[stderr]:\n<err>\n\n(exit code 0)".
 * The first non-empty line is always the "[stdout]:" marker — useless as a summary.
 * Show the LAST output line (usually the meaningful tail) plus the exit status.
 */
function _bashSummary(result) {
  const isMarker = (l) => /^\[(stdout|stderr)\]:$/.test(l) || /^\((exit code|killed)/.test(l)
  const lines = result.split("\n").map((l) => l.trim()).filter((l) => l && !isMarker(l))
  const status = result.match(/\((?:exit code|killed)[^)]*\)/)?.[0]
  const parts = []
  if (lines.length > 0) parts.push(lines[lines.length - 1].slice(0, 100))
  if (status) parts.push(status)
  return parts.length > 0 ? `bash: ${parts.join(" ")}` : null
}

function _advisorSummary(result) {
  const text = String(result ?? "")
  // Error / skip messages — extract the reason after "Advisor:"
  const errMatch = text.trimStart().match(/^Advisor:\s*(.+)/)
  if (errMatch) return `advisor: ${errMatch[1].split(".")[0]}`
  const critical = (text.match(/\| \d+ \|.*\| 🔴/g) || []).length
  const advisory = (text.match(/\| \d+ \|.*\| 🟡/g) || []).length
  const style = (text.match(/\| \d+ \|.*\| 🔵/g) || []).length
  // Protocol: zero 🔴 rows in the review table = pass (phrase fallback for
  // table-free summaries like "No issues found").
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

function _verifySummary(result) {
  const lines = result.split("\n")
  const summary = []
  // Changed files count
  const changed = lines.find((l) => l.startsWith("Changed files:"))
  if (changed) {
    const m = changed.match(/files changed/) ? changed.replace(/^Changed files \(.*?\)/, "Changed files") : changed
    summary.push(m)
  }
  // Syntax check results
  const syntax = lines.filter((l) => l.startsWith("  ✗"))
  if (syntax.length > 0) {
    summary.push(`${syntax.length} syntax error(s)`)
  }
  // Test results
  const testLine = lines.find((l) => l.startsWith("✓ Tests passed.") || l.startsWith("✗ Tests FAILED"))
  if (testLine) summary.push(testLine.trim())
  // Task list
  const taskLine = lines.find((l) => l.startsWith("Task list:"))
  if (taskLine) summary.push(taskLine)
  return summary.length > 0 ? `verify: ${summary.join(" — ")}` : ""
}
