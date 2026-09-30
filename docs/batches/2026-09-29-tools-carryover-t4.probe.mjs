// 2026-09-29-tools-carryover-t4.probe.mjs — 舱 T4（#15 第二波 · 实例绑定族）schema 读数探针（批次本地；终位 = docs/batches/ 待父侧收位）。
// 口径（与 `scripts/tool-schema-size.mjs` 面 3 同式）：逐档 len(JSON.stringify({description, parameters}))。
// 面 = T4 五档（memory ∥ 检索 code_search/doc_search ∥ settings ∥ peer_instances ∥ 台账五具 ∥ repo_outline——共 11 具）。
// 跑法：
//   node .thincoder/tmp/2026-09-29-tools-carryover-t4.probe.mjs snapshot <out.json>
//   node .thincoder/tmp/2026-09-29-tools-carryover-t4.probe.mjs diff <before.json> <after.json>
// diff 判据 = AC15-5：档集合同一 ∧ 逐档 `parameters` 逐字节同一（json sha）⇒ 仅描述文本变。
import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"
import { join } from "node:path"

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const CORE = join(REPO, "thincoder-core")
const at = (rel) => pathToFileURL(join(CORE, rel)).href

const stub = {} // 句柄仅闭包捕捉——defs 构建期零触达
const { memoryTools, codeSearchTool, docSearchTool } = await import(at("memory.mjs"))
const { repoOutlineTool } = await import(at("tools/repomap.mjs"))
const { settingsTool } = await import(at("agent-tools/settings.mjs"))
const { peerInstancesTool } = await import(at("peer-instances.mjs"))
const { ledgerQueryTool, ledgerCountTool, ledgerAddTool, ledgerUpdateTool, ledgerCloseTool } = await import(at("ledger-tools.mjs"))

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)
const entry = (t) => ({
  name: t.name,
  schemaChars: JSON.stringify({ description: t.description ?? "", parameters: t.parameters ?? null }).length,
  descChars: (t.description ?? "").length,
  descSha: sha(t.description ?? ""),
  paramsSha: sha(JSON.stringify(t.parameters ?? null)),
  description: t.description ?? "",
})

const tools = [
  ...memoryTools(stub, { cwd: REPO, projectDir: null, author: "t4-probe", team: null }),
  codeSearchTool(stub),
  docSearchTool(stub),
  repoOutlineTool(stub, REPO),
  settingsTool({}),
  peerInstancesTool,
  ledgerQueryTool, ledgerCountTool, ledgerAddTool, ledgerUpdateTool, ledgerCloseTool,
]

const [mode, a, b] = process.argv.slice(2)
if (mode === "snapshot") {
  const snap = {
    capturedAt: new Date().toISOString(),
    tools: tools.map(entry),
  }
  snap.totals = {
    count: snap.tools.length,
    schemaChars: snap.tools.reduce((s, t) => s + t.schemaChars, 0),
    descChars: snap.tools.reduce((s, t) => s + t.descChars, 0),
  }
  writeFileSync(a, JSON.stringify(snap, null, 2))
  console.log(`snapshot → ${a} · ${snap.totals.count} 档 · schema ${snap.totals.schemaChars} · desc ${snap.totals.descChars}`)
} else if (mode === "diff") {
  const A = JSON.parse(readFileSync(a, "utf8"))
  const B = JSON.parse(readFileSync(b, "utf8"))
  const byName = (s) => new Map(s.tools.map((t) => [t.name, t]))
  const ma = byName(A), mb = byName(B)
  const namesA = [...ma.keys()].sort(), namesB = [...mb.keys()].sort()
  let bad = 0
  if (JSON.stringify(namesA) !== JSON.stringify(namesB)) {
    console.log("✗ 档集合不同")
    bad++
  }
  console.log("name".padEnd(14), "schemaΔ".padStart(8), "descΔ".padStart(7), "params".padEnd(7), "schema前→后")
  for (const n of namesB) {
    const x = ma.get(n), y = mb.get(n)
    if (!x) { console.log(n, "(before 缺档)"); bad++; continue }
    const paramsSame = x.paramsSha === y.paramsSha
    if (!paramsSame) bad++
    console.log(
      n.padEnd(14),
      String(y.schemaChars - x.schemaChars).padStart(8),
      String(y.descChars - x.descChars).padStart(7),
      (paramsSame ? "same" : "DIFF!").padEnd(7),
      `${x.schemaChars}→${y.schemaChars}`,
    )
  }
  const tot = (s, k) => s.tools.reduce((v, t) => v + t[k], 0)
  console.log(`total  schema ${tot(A, "schemaChars")}→${tot(B, "schemaChars")} (Δ ${tot(B, "schemaChars") - tot(A, "schemaChars")}) · desc ${tot(A, "descChars")}→${tot(B, "descChars")} (Δ ${tot(B, "descChars") - tot(A, "descChars")})`)
  console.log(bad === 0 ? "OK(t4-probe): 档集合同一 ∧ parameters 逐档同一——仅描述文本变" : `FAIL(t4-probe): ${bad} 处结构差`)
  process.exit(bad === 0 ? 0 : 1)
} else {
  console.log("usage: snapshot <out.json> | diff <before.json> <after.json>")
  process.exit(2)
}
