/**
 * upgrade.mjs — version check and upgrade utilities
 * Used by both CLI (bin/thincoder.mjs upgrade command) and TUI (startup check).
 */

/** Compare two semver-like version strings. Returns -1/0/1. */
export function compareVersions(a, b) {
  const pa = String(a).split("."), pb = String(b).split(".")
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const xa = pa[i] ?? "0", xb = pb[i] ?? "0"
    const na = Number(xa), nb = Number(xb)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na < nb ? -1 : 1
    } else if (xa !== xb) {
      return xa < xb ? -1 : 1
    }
  }
  return 0
}

/**
 * Check npm registry for the latest version.
 * Returns { local, latest, newer: boolean } or null on network error / timeout.
 */
export async function checkForUpdate(localVersion) {
  try {
    const res = await fetch("https://registry.npmjs.org/thincoder/latest", {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const latest = data.version
    return {
      local: localVersion,
      latest,
      newer: compareVersions(localVersion, latest) < 0,
    }
  } catch {
    return null
  }
}
