// Startup black-screen repro: real startTUI with mocked stdin/stdout + screen emulator.
import { loadConfig } from "./src/config.mjs"
import { createAgent } from "./src/agent.mjs"
import { builtinTools } from "./src/tools/index.mjs"
import { createMemory } from "./src/memory.mjs"

const COLS = 80, ROWS = 24
const screen = Array.from({ length: ROWS }, () => " ".repeat(COLS))
let curR = 0, curC = 0
function feed(s) {
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === "\x1b") {
      const m = s.slice(i).match(/^\x1b\[([0-9;?]*)([A-Za-z~])/)
      if (m) {
        const [, params, cmd] = m
        const [p1, p2] = params.split(";").map((x) => parseInt(x) || 0)
        if (cmd === "H" || cmd === "f") {
          if (params === "") { curR = 0; curC = 0 } else { curR = p1 - 1; curC = params.includes(";") ? p2 - 1 : 0 }
        } else if (cmd === "K") screen[curR] = screen[curR].slice(0, curC).padEnd(COLS, " ")
        else if (cmd === "J") { for (let y = curR; y < ROWS; y++) screen[y] = y === curR ? screen[y].slice(0, curC).padEnd(COLS, " ") : " ".repeat(COLS) }
        else if (cmd === "A") curR = Math.max(0, curR - (p1 || 1))
        else if (cmd === "B") curR = Math.min(ROWS - 1, curR + (p1 || 1))
        else if (cmd === "C") curC = Math.min(COLS - 1, curC + (p1 || 1))
        else if (cmd === "G") curC = (p1 || 1) - 1
        i += m[0].length
        continue
      }
      i += 2
      continue
    }
    if (ch === "\r") { curC = 0; i++; continue }
    if (ch === "\n") { curR = Math.min(ROWS - 1, curR + 1); i++; continue }
    if (curR >= 0 && curR < ROWS && curC >= 0 && curC < COLS) {
      screen[curR] = screen[curR].slice(0, curC) + ch + screen[curR].slice(curC + 1)
    }
    curC++
    i++
  }
}
const realWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = (s) => { feed(String(s)); return true }
process.stdout.columns = COLS
process.stdout.rows = ROWS
Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true })
process.stdin.setRawMode = () => {}

process.on("uncaughtException", (e) => { realWrite(`\nUNCAUGHT: ${e.stack}\n`); process.exit(1) })
process.on("unhandledRejection", (e) => { realWrite(`\nUNHANDLED: ${e?.stack ?? e}\n`); process.exit(1) })

const config = loadConfig()
const agent = createAgent({
  provider: config.provider,
  tools: builtinTools,
  config,
  cwd: process.cwd(),
  memory: createMemory({ dbPath: config.memory.dbPath }),
})
agent.providers = config.providersList

const { startTUI } = await import("./src/tui/index.mjs")
const tui = startTUI(agent, {})
await new Promise((r) => setTimeout(r, 2500))
const txt = screen.map((l) => l.replace(/\s+$/, "")).join("\n")
realWrite(`\n===== startup screen =====\n${txt}\n===== end =====\n`)
process.stdout.write = realWrite
process.exit(0)
void tui
