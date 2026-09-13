#!/usr/bin/env node
/**
 * scripts/key-probe.mjs — keyboard sequence diagnostic.
 * Run it, press keys (Shift+Enter, Alt+Enter, Enter), see exactly what bytes
 * your terminal sends. Used to debug Shift+Enter multiline support
 * (docs/design/TUI-INPUT-BOX.md §1.5).
 *
 * Usage: node scripts/key-probe.mjs   (Ctrl+C or q to exit)
 */
import { emitKeypressEvents } from "node:readline"

const ESC = "\x1b"
// Enable both enhancement protocols (same as the TUI)
process.stdout.write(`${ESC}[>1u${ESC}[>4;2m`)
process.stdin.setRawMode(true)
emitKeypressEvents(process.stdin)

console.log("Key probe — press keys to see their raw bytes. Ctrl+C or q to exit.")
console.log("Expected for Shift+Enter with a supporting terminal: \\x1b[13;2u (kitty) or \\x1b[27;2;13~ (modifyOtherKeys)")
console.log("If you see a bare \\r, your terminal does not support either protocol.")
console.log("-".repeat(70))

process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") return exit()
  if (str === "q" && !key.ctrl && !key.meta) return exit()
  const raw = JSON.stringify(str)
  const mods = ["shift", "ctrl", "alt", "meta"].filter((m) => key[m]).join("+") || "none"
  console.log(`str=${raw.padEnd(20)} name=${String(key.name).padEnd(12)} mods=${mods}`)
})

function exit() {
  process.stdout.write(`${ESC}[<u${ESC}[>4m`) // pop kitty + reset modifyOtherKeys
  process.stdin.setRawMode(false)
  process.stdout.write("\nbye\n")
  process.exit(0)
}
