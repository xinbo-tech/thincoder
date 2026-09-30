// 2026-09-29-tools-carryover-t4.test.mjs — 舱 T4（#15 第二波 · 实例绑定族）批次本地单测。
// 口径（承批档 §2.2 · AC15-1/2/4/5）：
//   ① 外置覆盖 100%：11 档 description === tool-docs/<name>.md（独立读档对拍——非 DESC 自证）；
//   ② 内联残留 = 0：六具源档零旧描述字面 ∧ DESC("<name>") 逐档在位；
//   ③ schema 结构 diff = 仅描述文本：parameters 逐档 sha 同冻结基线 ∧ 单档 schema ≤8,000（AC15-3；
//     描述字数不冻结——父侧 U2 终审定稿可调整文本，不设快照计数红面）；
//   ④ node --check：六具源档语法绿。
// 基线 = 2026-09-29 舱 T4 改前读数（探针 snapshot；原档 = .thincoder/tmp/2026-09-29-tools-carryover-t4-readings.json）。
// 复跑：node --test docs/batches/2026-09-29-tools-carryover-t4.test.mjs（终位；现暂存 .thincoder/tmp/ 待父侧收位）。
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"
import { join } from "node:path"
import test from "node:test"
import assert from "node:assert/strict"

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const CORE = join(REPO, "thincoder-core")
const at = (rel) => pathToFileURL(join(CORE, rel)).href
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)

/** 冻结基线（改前读数——仅 schema 结构面：`parameters` sha）。 */
const BASELINE = {
  memory: { paramsSha: "29a4de6685b3d51b" },
  code_search: { paramsSha: "90d5ac225f4fbeba" },
  doc_search: { paramsSha: "5730ed5a25736a5b" },
  repo_outline: { paramsSha: "9287c29e35ff5812" },
  settings: { paramsSha: "0d64b5d1417f894c" },
  peer_instances: { paramsSha: "8243f0af367f188a" },
  ledger_query: { paramsSha: "bb22da385b361cad" },
  ledger_count: { paramsSha: "fd05bdb7780604e4" },
  ledger_add: { paramsSha: "256098855a5f2125" },
  ledger_update: { paramsSha: "2d4f0b29ce8ef6b9" },
  ledger_close: { paramsSha: "35a73926a7ca22b8" },
}

/** 源档 → 该档承载的工具名（内联残留扫描面）。 */
const SOURCES = {
  "memory/docs.mjs": ["memory", "doc_search"],
  "memory/code-sync.mjs": ["code_search"],
  "agent-tools/settings.mjs": ["settings"],
  "peer-instances.mjs": ["peer_instances"],
  "ledger-tools.mjs": ["ledger_query", "ledger_count", "ledger_add", "ledger_update", "ledger_close"],
  "tools/repomap.mjs": ["repo_outline"],
}

/** 旧内联描述字面（改前首句——残留 = 该字面仍在源档出现）。 */
const OLD_LITERALS = {
  memory: "Manage long-term memory in ONE tool",
  doc_search: "Search the project's documentation",
  code_search: "Search the project's source code for relevant code",
  settings: "Adjust ThinCoder runtime configuration",
  peer_instances: "peer_instances — read-only",
  ledger_query: "台账查询（需求池",
  ledger_count: "台账计数单源",
  ledger_add: "台账新增条目",
  ledger_update: "台账更新条目",
  ledger_close: "台账收口",
  repo_outline: "Show the project's file dependency outline",
}

const stub = {} // 句柄仅闭包捕捉——defs 构建期零触达
const { memoryTools, codeSearchTool, docSearchTool } = await import(at("memory.mjs"))
const { repoOutlineTool } = await import(at("tools/repomap.mjs"))
const { settingsTool } = await import(at("agent-tools/settings.mjs"))
const { peerInstancesTool } = await import(at("peer-instances.mjs"))
const { ledgerQueryTool, ledgerCountTool, ledgerAddTool, ledgerUpdateTool, ledgerCloseTool } = await import(at("ledger-tools.mjs"))

const built = [
  ...memoryTools(stub, { cwd: REPO, projectDir: null, author: "t4-test", team: null }),
  codeSearchTool(stub),
  docSearchTool(stub),
  repoOutlineTool(stub, REPO),
  settingsTool({}),
  peerInstancesTool,
  ledgerQueryTool, ledgerCountTool, ledgerAddTool, ledgerUpdateTool, ledgerCloseTool,
]
const NAMES = Object.keys(BASELINE)

test("① 外置覆盖：11 档 description === tool-docs/<name>.md（独立读档对拍）", () => {
  assert.equal(built.length, NAMES.length, `档数 ${built.length} ≠ ${NAMES.length}`)
  for (const name of NAMES) {
    const tool = built.find((t) => t.name === name)
    assert.ok(tool, `缺档：${name}`)
    const file = readFileSync(join(CORE, "tool-docs", `${name}.md`), "utf8")
    assert.equal(tool.description, file, `${name}: description ≠ tool-docs/${name}.md`)
  }
})

test("② 内联残留 = 0：六具源档零旧描述字面 ∧ DESC(\"<name>\") 逐档在位", () => {
  for (const [rel, names] of Object.entries(SOURCES)) {
    const src = readFileSync(join(CORE, rel), "utf8")
    for (const name of names) {
      assert.ok(!src.includes(OLD_LITERALS[name]), `${rel}: 残留旧描述字面（${name}）`)
      assert.ok(src.includes(`DESC("${name}")`), `${rel}: 缺 DESC("${name}")`)
    }
  }
})

test("③ schema 结构 diff = 仅描述文本：parameters 逐档 sha 同基线 ∧ 单档 schema ≤8,000（AC15-3）", () => {
  for (const name of NAMES) {
    const tool = built.find((t) => t.name === name)
    const paramsSha = sha(JSON.stringify(tool.parameters ?? null))
    assert.equal(paramsSha, BASELINE[name].paramsSha, `${name}: parameters 结构变（非描述文本 diff）`)
    const schemaChars = JSON.stringify({ description: tool.description ?? "", parameters: tool.parameters ?? null }).length
    assert.ok(schemaChars <= 8000, `${name}: 单档 ${schemaChars} 字符 > 8,000（AC15-3）`)
  }
})

test("④ node --check：六具源档语法绿", () => {
  for (const rel of Object.keys(SOURCES)) {
    const r = spawnSync(process.execPath, ["--check", join(CORE, rel)], { encoding: "utf8" })
    assert.equal(r.status, 0, `${rel}: node --check 失败\n${r.stderr}`)
  }
})
