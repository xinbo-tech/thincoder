/**
 * Shared test helper (extracted per AGENT-LOOP.md §18.14 D-T1.6 — freshMemory appears in 3+ test files).
 */
import { createMemory } from "../../src/memory.mjs"

export function freshMemory() {
  return createMemory({ dbPath: ":memory:" })
}
