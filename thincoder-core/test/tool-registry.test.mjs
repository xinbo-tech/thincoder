/**
 * tool-registry.test.mjs — core tool / agent-tools registry machine checks
 * (CORE-UNIFICATION `TOOLS.md` #70 · #83).
 *
 * #70 (`tools/index.mjs`): the core registry owns the COMPLETE built-in face for
 * both shells — `builtinTools` (static table) plus `assembleBuiltinTools` (the
 * consumer-side assembly moved in from the CLI `cli/make-agent.mjs`). Behaviour
 * face: the assembled list is the shared face, name-unique, host-only tools
 * (`context` / `focus` — #179 ④ IDE capabilities) stay out (the VS Code shell
 * adds them), and `read_image` is registered only when the model accepts images
 * (VS Code's registration gate, `specForModel(model).multimodal`).
 * #83 (`agent-tools.mjs`): the agent-tools registry is the single source for the
 * consult family (VS Code `agent-tools/index.mjs` already lists them; the CLI
 * mounted them separately — that face moves here).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const mod = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

// The shared face (`builtinTools` + the instance-bound faces + the gated image tool).
const SHARED_FACE = [
  "read", "write", "edit", "insert_after", "hashline_edit", "apply_patch",
  "read_image", "bash", "glob", "grep", "websearch", "ls", "fetch", "delete",
  "git", "question", "checklist", "lint", "lsp", "execute", "file_ops",
  "process", "get_current_time", "wait_for", "tree",
]
// Instance-bound faces the consumer assembly adds (factories need the shell's
// memory handle at run time — they cannot be static entries).
const INSTANCE_BOUND = ["memory", "code_search", "doc_search", "repo_outline", "settings", "peer_instances"]
// Host-capability tools — ④ (TOOLS #179): the VS Code shell owns them.
const HOST_ONLY = ["context", "focus"]
const TEXT_ONLY_MODEL = "qwen3.7-max" // spec row carries no `multimodal` (image parts rejected)
const VISION_MODEL = "qwen3.8-max"    // spec row carries `multimodal: true`

test("#70 registry: assembleBuiltinTools yields the complete shared face (no dupes, no host-only)", async () => {
  const { builtinTools, assembleBuiltinTools } = await mod("tools/index.mjs")
  const assembled = await assembleBuiltinTools({ memory: {}, cwd: ROOT, model: VISION_MODEL })
  const names = assembled.map((t) => t.name)

  assert.deepEqual([...names].sort(), [...SHARED_FACE, ...INSTANCE_BOUND].sort())
  assert.deepEqual(names.sort(), [...new Set(names)].sort(), "registry must not register a tool twice")
  for (const host of HOST_ONLY) {
    assert.ok(!names.includes(host), `${host} is host-only (TOOLS #179 ④) — must not enter the core registry`)
  }
  // the static table is the seed the assembly extends — every static tool survives
  for (const t of builtinTools) assert.ok(names.includes(t.name), `static tool ${t.name} missing from the assembly`)
})

test("#70 registry: read_image registration is gated by model capability (VS Code gate)", async () => {
  const { assembleBuiltinTools } = await mod("tools/index.mjs")
  const { specForModel } = await mod("model-specs.mjs")
  // fixture preconditions — a MODEL_SPECS edit fails here with the reason, not in the gate
  assert.equal(specForModel(TEXT_ONLY_MODEL).multimodal, undefined, `${TEXT_ONLY_MODEL} must stay a text-only fixture`)
  assert.equal(specForModel(VISION_MODEL).multimodal, true, `${VISION_MODEL} must stay a vision fixture`)

  const namesFor = async (model) => (await assembleBuiltinTools({ memory: {}, cwd: ROOT, model })).map((t) => t.name)
  const textOnly = await namesFor(TEXT_ONLY_MODEL)
  const vision = await namesFor(VISION_MODEL)
  const unknown = await namesFor("no-such-model")

  assert.ok(!textOnly.includes("read_image"), "a text-only model must not get read_image registered")
  assert.ok(!unknown.includes("read_image"), "an unknown model must not get read_image registered (conservative default spec)")
  assert.ok(vision.includes("read_image"), "a multimodal model must get read_image registered")
  assert.deepEqual(vision.filter((n) => n !== "read_image"), textOnly, "the gate must only drop read_image")
})

test("#83 registry: the unified agent-tools registry exports the consult family", async () => {
  const at = await mod("agent-tools.mjs")
  assert.equal(typeof at.consultStartTool, "object")
  assert.equal(typeof at.consultStopTool, "object")
  assert.equal(at.consultStartTool.name, "consult_start")
})

test("#83 structural: the consult family comes from the unified registry (setup.mjs has no separate mount)", () => {
  const setup = readFileSync(join(ROOT, "agent/setup.mjs"), "utf8")
  // positive: agent/setup.mjs destructures BOTH consult tools straight from ../agent-tools.mjs
  assert.match(
    setup,
    /\{[^}]*consultStartTool\s*,\s*consultStopTool[^}]*\}\s*=\s*await import\("\.\.\/agent-tools\.mjs"\)/,
    "agent/setup.mjs must take the consult family from the unified registry",
  )
  // negative: no second registration source for the consult tools
  assert.ok(
    !/consult(Start|Stop)Tool[^\n]*agent-tools\/consult\.mjs/.test(setup),
    "agent/setup.mjs must not mount consult directly — the unified registry is the single source",
  )
})
