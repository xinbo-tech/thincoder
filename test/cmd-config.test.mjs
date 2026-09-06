/**
 * cmd-config.mjs tests — embeddingPatch three-piece backfill (TUI.md §9.3D, GitHub thincoder#1)
 * + §24 D-24a/R14 /config 并发池入口（T-24a5——子进程隔离 HOME——saveProxy 落盘 + 热应用）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { embeddingPatch } from "../src/tui/cmd-config.mjs"
import { DEFAULTS } from "../src/config.mjs"

test("T1: empty config — apiKey saved, baseURL/model filled from DEFAULTS", () => {
  const r = embeddingPatch({}, "K", DEFAULTS.embedding)
  assert.equal(r.apiKey, "K")
  assert.equal(r.baseURL, DEFAULTS.embedding.baseURL)
  assert.equal(r.model, DEFAULTS.embedding.model)
})

test("T2: existing custom baseURL/model (Ollama) preserved, apiKey updated", () => {
  const raw = { embedding: { apiKey: "old", baseURL: "http://localhost:11434", model: "nomic-embed" } }
  const r = embeddingPatch(raw, "new", DEFAULTS.embedding)
  assert.equal(r.apiKey, "new")
  assert.equal(r.baseURL, "http://localhost:11434")
  assert.equal(r.model, "nomic-embed")
})

test("T3: raw.embedding undefined — still fills all three", () => {
  const r = embeddingPatch({}, "K", DEFAULTS.embedding)
  assert.deepEqual(r, { apiKey: "K", baseURL: DEFAULTS.embedding.baseURL, model: DEFAULTS.embedding.model })
})

test("T4: apiKey-only legacy config backfilled", () => {
  const r = embeddingPatch({ embedding: { apiKey: "legacy" } }, "K", DEFAULTS.embedding)
  assert.equal(r.apiKey, "K")
  assert.equal(r.baseURL, DEFAULTS.embedding.baseURL)
  assert.equal(r.model, DEFAULTS.embedding.model)
})

test("§24 T-24a5: /config 并发池入口——poolLimits 两域可见可改 + 落盘 + 热应用（下个 spawn 生效）", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x" }],
    activeProvider: "deepseek",
    agent: { poolLimits: { engCoder: 2, other: 3 } },
  }))

  const script = `
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const { handleConfigCommand } = await import("./src/tui/cmd-config.mjs")
const { loadConfig, configPath } = await import("./src/config.mjs")
const cfg = loadConfig()
const agent = { config: cfg, provider: cfg.provider, providers: cfg.providersList, activeProvider: cfg.activeProvider }
// 菜单路径：主菜单 → 并发池 → 改 engCoder（问 5）→ 改 other（问 7）→ Esc 子菜单 → Esc 主菜单
const actions = ["pool", "engCoder", "other", null, null]
const answers = ["5", "7"]
const lines = []
const ctx = {
  agent,
  pushLine: (t) => lines.push(t),
  pushLabel: (t) => lines.push(t),
  showPicker: async (title, entries) => {
    const a = actions.shift()
    return a == null ? null : entries.find((e) => e.action === a) ?? null
  },
  askQuestion: async () => answers.shift() ?? "",
  persistRaw: async (fn) => fn({}),
  maskKey: () => "***",
}
await handleConfigCommand(ctx, [])
const raw = JSON.parse(readFileSync(configPath, "utf8"))
assert.deepEqual(raw.agent.poolLimits, { engCoder: 5, other: 7 }, "落盘（mutate 保留两键）")
assert.equal(agent.config.agent.poolLimits.engCoder, 5, "reloadConfig 热应用 engCoder")
assert.equal(agent.config.agent.poolLimits.other, 7, "reloadConfig 热应用 other")
assert.ok(lines.some((l) => l.includes("agent.poolLimits = { engCoder: 5, other: 7 }")), "改动确认行可见")
assert.ok(lines.some((l) => l.includes("下个 spawn 生效")), "生效语义提示可见")
console.log("pool menu flow OK")
`
  const projectRoot = fileURLToPath(new URL("..", import.meta.url))
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
  assert.match(out, /pool menu flow OK/)
})

test("§24 T-24a5b: /config 并发池入口——非法输入不改动（≥1 正整数校验——错误提示行）", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x" }],
    activeProvider: "deepseek",
    agent: { poolLimits: { engCoder: 2, other: 3 } },
  }))

  const script = `
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const { handleConfigCommand } = await import("./src/tui/cmd-config.mjs")
const { loadConfig, configPath } = await import("./src/config.mjs")
const cfg = loadConfig()
const agent = { config: cfg, provider: cfg.provider, providers: cfg.providersList, activeProvider: cfg.activeProvider }
const actions = ["pool", "engCoder", null, null] // 输入 "0"（非法）→ 不落盘 → Esc ×2
const lines = []
const ctx = {
  agent,
  pushLine: (t) => lines.push(t),
  pushLabel: (t) => lines.push(t),
  showPicker: async (title, entries) => {
    const a = actions.shift()
    return a == null ? null : entries.find((e) => e.action === a) ?? null
  },
  askQuestion: async () => "0",
  persistRaw: async (fn) => fn({}),
  maskKey: () => "***",
}
await handleConfigCommand(ctx, [])
const raw = JSON.parse(readFileSync(configPath, "utf8"))
assert.deepEqual(raw.agent.poolLimits, { engCoder: 2, other: 3 }, "非法值不落盘（磁盘原样）")
assert.ok(lines.some((l) => l.includes("positive integer")), "校验错误提示行")
console.log("pool menu invalid OK")
`
  const projectRoot = fileURLToPath(new URL("..", import.meta.url))
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
  assert.match(out, /pool menu invalid OK/)
})