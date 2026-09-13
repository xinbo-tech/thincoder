/**
 * diff.js — zero-dependency line-based diff generator
 * Returns [{type:"same"|"add"|"del", text}]
 */

import { escHtml } from "./ui.js"


/**
 * Compute line-level diff between two strings.
 * Uses simplified prefix/suffix matching — fast and sufficient for code changes.
 */
export function lineDiff(oldStr, newStr) {
  const oldLines = oldStr ? oldStr.split("\n") : []
  const newLines = newStr ? newStr.split("\n") : []

  // Find common prefix
  let prefix = 0
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) {
    prefix++
  }

  // Find common suffix (from the end, starting after prefix)
  let suffix = 0
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix++
  }

  const result = []

  // Prefix — unchanged lines
  for (let i = 0; i < prefix; i++) {
    result.push({ type: "same", text: oldLines[i] })
  }

  // Middle — changed lines
  const oldMid = oldLines.slice(prefix, oldLines.length - suffix)
  const newMid = newLines.slice(prefix, newLines.length - suffix)

  // Simple greedy match for reordered lines (within the middle section)
  // Collect all old lines we need to track
  const oldSet = new Map()
  for (const l of oldMid) oldSet.set(l, (oldSet.get(l) || 0) + 1)

  // Mark deletions and additions
  const used = new Map()
  for (const l of oldMid) {
    const avail = (newMid.filter(nl => nl === l).length) - (used.get(l) || 0)
    if (avail > 0) {
      used.set(l, (used.get(l) || 0) + 1)
      result.push({ type: "same", text: l })
    } else {
      result.push({ type: "del", text: l })
    }
  }

  // Additions — lines only in new
  const oldRemaining = new Map()
  for (const l of oldMid) {
    if (!result.some(r => r.type === "same" && r.text === l)) {
      oldRemaining.set(l, (oldRemaining.get(l) || 0) + 1)
    }
  }
  for (const l of newMid) {
    const rem = oldRemaining.get(l) || 0
    if (rem > 0) {
      oldRemaining.set(l, rem - 1)
      // Already matched as "same"
    } else {
      result.push({ type: "add", text: l })
    }
  }

  // Suffix — unchanged lines
  for (let i = oldLines.length - suffix; i < oldLines.length; i++) {
    result.push({ type: "same", text: oldLines[i] })
  }

  return result
}

/**
 * Render diff lines to HTML.
 * Returns HTML string with <div class="diff-*"> elements.
 */
export function renderDiff(diffLines) {
  if (!diffLines || diffLines.length === 0) return "<div class='diff-line diff-same'>…</div>"

  return diffLines.map(l => {
    const cls = l.type === "add" ? "diff-add" : l.type === "del" ? "diff-del" : "diff-same"
    const prefix = l.type === "add" ? "+" : l.type === "del" ? "-" : " "
    const text = escHtml(l.text)
    return `<div class="diff-line ${cls}"><span class="diff-prefix">${prefix}</span>${text || " "}</div>`
  }).join("")
}
