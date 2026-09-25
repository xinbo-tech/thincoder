/**
 * Shared test helper (extracted — freshMemory appears in 3+ test files).
 */
import { createMemory } from "@thincoder/core/memory.mjs"

export function freshMemory() {
  return createMemory({ dbPath: ":memory:" })
}
