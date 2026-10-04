#!/usr/bin/env node
// tool-schema-size.mjs — v1 报告态：工具 schema 上下文占用读数（#15 预算机检）
// 口径（与 §2.2.1 基线同式）：逐档 len(JSON.stringify({description, parameters})) 字符之和。
// 基线 = 103,529（2026-09-29 设计轮实测：builtin 31 档 62,697 + 元工具 15 档 40,832）。
// 报告态 v1：只读 + 报告；不设闸；面外项（宿主 ide/focus ∥ 门控 read_image 等）逐项注明。
// 跑法（仓根）：node scripts/tool-schema-size.mjs [--json]
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CORE = join(ROOT, "thincoder-core")
const at = (rel) => new URL(`../thincoder-core/${rel}`, import.meta.url).href
const BASELINE = 103529
const jsonMode = process.argv.includes("--json")

const entries = []
const failed = []
const push = (tool, face) => {
  if (!tool || !tool.name) return
  const chars = JSON.stringify({ description: tool.description ?? "", parameters: tool.parameters ?? null }).length
  entries.push({ name: tool.name, face, chars })
}
const tryCall = (fn, args, face) => {
  try { const v = fn(...args); return v } catch (e) { failed.push(`${face}: ${e.message}`); return null }
}

// ── 面 1：内建静态表（含门控 read_image——单列注明） ─────────────────────────────
const { builtinTools } = await import(at("tools/index.mjs"))
for (const t of builtinTools) push(t, "builtin")
const { readImageTool } = await import(at("tools/file.mjs"))
push(readImageTool, "builtin(gated)")

// ── 面 2：元工具桶（静态对象 + 工厂（null 实参试调）） ────────────────────────────
const meta = await import(at("agent-tools.mjs"))
for (const [key, v] of Object.entries(meta)) {
  if (typeof v === "function") {
    const t = tryCall(v, [null], `meta:${key}`)
    if (Array.isArray(t)) { for (const x of t) push(x, "meta") } else push(t, "meta")
  } else push(v, "meta")
}

// ── 面 3：实例绑定族（装配单点 `assembleBuiltinTools` 所并六面） ─────────────────
const stub = {} // 句柄仅闭包捕捉——defs 构建期零触达
try {
  const { memoryTools, codeSearchTool, docSearchTool } = await import(at("memory.mjs"))
  for (const t of tryCall(memoryTools, [stub, { cwd: ROOT, projectDir: null, author: "budget", team: null }], "inst:memoryTools") ?? []) push(t, "instance")
  push(tryCall(codeSearchTool, [stub], "inst:codeSearch"), "instance")
  push(tryCall(docSearchTool, [stub], "inst:docSearch"), "instance")
} catch (e) { failed.push(`memory.mjs: ${e.message}`) }
const { repoOutlineTool } = await import(at("tools/repomap.mjs"))
push(tryCall(repoOutlineTool, [stub, { cwd: ROOT }], "inst:repoOutline") ?? repoOutlineTool, "instance")
const { settingsTool } = await import(at("agent-tools/settings.mjs"))
push(typeof settingsTool === "function" ? tryCall(settingsTool, [{}], "inst:settings") : settingsTool, "instance")
const { peerInstancesTool } = await import(at("peer-instances.mjs"))
push(typeof peerInstancesTool === "function" ? tryCall(peerInstancesTool, [{}], "inst:peer") : peerInstancesTool, "instance")
const { ledgerTool } = await import(at("ledger.mjs"))
push(typeof ledgerTool === "function" ? tryCall(ledgerTool, [{}], "inst:ledger") : ledgerTool, "instance")

// ── 描述面：tool-docs 外置档枚举（AC15-1 覆盖率面） ─────────────────────────────
const docsDir = join(CORE, "tool-docs")
const docs = readdirSync(docsDir).filter((f) => f.endsWith(".md"))
const docChars = docs.reduce((s, f) => s + readFileSync(join(docsDir, f), "utf8").length, 0)

// ── 汇总 ────────────────────────────────────────────────────────────────────
const total = entries.reduce((s, e) => s + e.chars, 0)
const byFace = {}
for (const e of entries) byFace[e.face] = (byFace[e.face] ?? 0) + e.chars
const top = [...entries].sort((a, b) => b.chars - a.chars).slice(0, 10)
const over8k = entries.filter((e) => e.chars > 8000)

const report = {
  toolCount: entries.length,
  total,
  baseline: BASELINE,
  ratio: +(total / BASELINE).toFixed(3),
  target: 0.75,
  byFace,
  top10: top,
  over8000: over8k.map((e) => ({ name: e.name, chars: e.chars })),
  toolDocs: { files: docs.length, chars: docChars },
  failed,
}
if (jsonMode) { console.log(JSON.stringify(report, null, 2)) }
else {
  console.log(`tool-schema-size v1（报告态）— 档数 ${report.toolCount} · 总量 ${total.toLocaleString()} 字符`)
  console.log(`基线 ${BASELINE.toLocaleString()} ⇒ 比值 ${report.ratio}（目标 ≤0.75）${report.ratio <= 0.75 ? " ✓ 达标" : " ✗ 未达（削不动 ⇒ 报告态上抛，零静默降级）"}`)
  console.log(`分面：${Object.entries(byFace).map(([k, v]) => `${k} ${v.toLocaleString()}`).join(" · ")}`)
  console.log(`tool-docs：${docs.length} 档 · ${docChars.toLocaleString()} 字符`)
  console.log("top10：")
  for (const t of top) console.log(`  ${t.chars.toString().padStart(7)}  ${t.name}（${t.face}）`)
  if (over8k.length) { console.log("超单档 8,000（须逐档给由）："); for (const e of over8k) console.log(`  ${e.chars}  ${e.name}`) }
  if (failed.length) { console.log("枚举失败项（报告面）："); for (const f of failed) console.log(`  ${f}`) }
}
