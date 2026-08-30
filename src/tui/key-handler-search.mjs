/** Perform search on state.lines, update state.search.matches and clamp index */
export function performSearch(state) {
  if (!state.search) return
  const query = state.search.query.toLowerCase()
  state.search.matches = []
  // Clear old highlights
  state.lines.forEach(l => delete l._searchMatches)

  if (!query) { state.search.index = 0; return }

  state.lines.forEach((line, lineIndex) => {
    const text = (line.text || "").toLowerCase()
    let charIndex = text.indexOf(query)
    if (charIndex !== -1) {
      line._searchMatches = []
    }
    while (charIndex !== -1) {
      state.search.matches.push({ lineIndex, charIndex })
      line._searchMatches.push(charIndex)
      charIndex = text.indexOf(query, charIndex + 1)
    }
  })

  if (state.search.matches.length === 0) {
    state.search.index = 0
  } else {
    state.search.index = Math.min(state.search.index, state.search.matches.length - 1)
  }
}

/** Estimate scroll position to make a line visible (simplified) */
export function scrollToMatch(state, lineIndex) {
  if (lineIndex == null) return
  // Rough estimate: each state.line takes 1-2 rendered lines
  let estimatedLine = 0
  for (let i = 0; i < lineIndex && i < state.lines.length; i++) {
    estimatedLine += Math.max(1, Math.ceil((state.lines[i].text?.length || 0) / 80))
  }
  const rows = (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24)
  const visibleH = Math.max(5, rows - 10) // reserve space for header, input, status, etc.
  // scroll is number of lines hidden above viewport
  // We want estimatedLine to be near the bottom of the viewport
  state.scroll = Math.max(0, state.lines.length - estimatedLine - visibleH + 3)
}

/** Handle search-mode keyboard events.
 *  Returns true if the key was consumed (search mode handled it).
 *  Call before other handlers so search mode has priority. */
export function handleSearchKey(str, key, state, render) {
  // Ctrl+F toggles search mode ON
  if (key.ctrl && key.name === "f" && !state.permission && !state.question) {
    if (!state.search) {
      state.search = { query: "", matches: [], index: 0 }
    }
    render()
    return true
  }

  if (!state.search) return false

  if (key.name === "escape" || (key.ctrl && key.name === "c")) {
    state.search = null
    render()
    return true
  }
  // Navigation requires Ctrl — bare n/p are query characters (regression fix: bare n/p
  // used to hijack typing, making it impossible to type those letters into the query)
  if ((key.ctrl && key.name === "n") || (key.ctrl && key.name === "g")) {
    // Next match
    if (state.search.matches.length > 0) {
      state.search.index = (state.search.index + 1) % state.search.matches.length
      scrollToMatch(state, state.search.matches[state.search.index].lineIndex)
    }
    render()
    return true
  }
  if ((key.ctrl && key.name === "p") || (key.ctrl && key.name === "r")) {
    // Previous match
    if (state.search.matches.length > 0) {
      state.search.index = (state.search.index - 1 + state.search.matches.length) % state.search.matches.length
      scrollToMatch(state, state.search.matches[state.search.index].lineIndex)
    }
    render()
    return true
  }
  if (key.name === "return") {
    // Exit search mode but keep highlighting until next Ctrl+F
    state.search = null
    render()
    return true
  }
  if (key.name === "backspace") {
    if (state.search.query.length > 0) {
      state.search.query = state.search.query.slice(0, -1)
      performSearch(state)
      render()
    }
    return true
  }
  // Regular character input
  if (str && str.length === 1 && !key.ctrl && !key.alt && !key.meta) {
    state.search.query += str
    performSearch(state)
    if (state.search.matches.length > 0) {
      scrollToMatch(state, state.search.matches[state.search.index].lineIndex)
    }
    render()
    return true
  }
  // Swallow every other key (arrows/Tab/Delete/…) — without this they fall through
  // to normal input handling and edit the HIDDEN state.input instead of the search box
  return true
}
