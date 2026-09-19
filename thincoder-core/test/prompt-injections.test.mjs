/**
 * prompt-injections.test.mjs — 锚替换缝的四装配面覆盖 + 结构机检（CORE-UNIFICATION §2.13.8 · U0）。
 *
 * 行为面（假全表——锚名集合**由核档派生**，改名免疫）：面 1/2（槽位 + consult 基底 /
 * `prompt-overlays.mjs` `assemblePrompt`）· 面 3（工具描述 / `tools/shared.mjs` `toOpenAISchema`——
 * 注册表全量工具逐一过面）· 面 4（顾问提示词 / `advisor.mjs` `buildAdvisorSystemPrompt`）——
 * 配置全表 ⇒ 各面代表性输出零 `{{inject:` 字面；面 1 另证「缺键经装配面抛错」（钩子确在路径上）。
 * 面 2 / 4 **现行锚 = 0**（§2.13.8（二）表）⇒ 行为面空验，覆盖面由**结构机检③**补（逐 return）。
 * 结构面（fail-closed）：
 *   ① 缝面导出面逐档等值（U0 四档的 configure/reset 命名族——声明形 + re-export / 别名形；
 *     缝模块另做全导出面逐名等值）；
 *   ② 缝模块零端名（注释剥除后的代码面——契约 5 / 10 机械面；域 = 本批模块 ∪ 缝定义档）；
 *   ③ 逐 `return` 分支结构机检（面 4 = 6 条 · 面 2 = 2 条——每条经 `applyPromptInjections`；
 *     新增分支未挂 ⇒ 红）。
 *
 * 口径注：端侧供值 / 消费 = U2；本档只证「缝在 + 四装配面调用期应用 + 三态语义」。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import {
  PROMPTS_DIR,
  TOOL_DOCS_DIR,
  configurePromptInjections,
  loadSlot,
  loadToolDoc,
  resetPromptInjections,
} from "../prompt-files.mjs"
import { SCENARIO_SLOT_FILES, assemblePrompt } from "../prompt-overlays.mjs"
import { toOpenAISchema } from "../tools/shared.mjs"
import { builtinTools } from "../tools/index.mjs"
import { buildAdvisorSystemPrompt } from "../advisor.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/** 锚文法（与 `core-prompt-face.test.mjs` 的合法形断言同源）。 */
const ANCHOR_RE = /\{\{inject:([a-z0-9-]+)\}\}/g

/** 锚名集合**由核档派生**（`prompts/` + `tool-docs/` 实读——改名免疫）。 */
function coreAnchorNames() {
  const names = new Set()
  const scan = (text) => { for (const m of text.matchAll(ANCHOR_RE)) names.add(m[1]) }
  for (const f of readdirSync(PROMPTS_DIR)) if (f.endsWith(".md")) scan(loadSlot(f))
  for (const f of readdirSync(TOOL_DOCS_DIR)) if (f.endsWith(".md")) scan(loadToolDoc(f.replace(/\.md$/, "")))
  return names
}

const fakeTable = (names) => Object.fromEntries([...names].map((n) => [n, `<${n}>`]))

function withInjections(table, fn) {
  configurePromptInjections(table)
  try { return fn() } finally { resetPromptInjections() }
}

// ─── 行为面（四装配面 × 假全表）─────────────────────────────────────────────────

test("面 1/2（槽位 + consult 基底）：假全表 ⇒ 全场景装配零 `{{inject:` 字面 + 工具面表值在场", () => {
  const names = coreAnchorNames()
  assert.ok(names.size > 0, "核档锚名集合不得为空（否则本用例空转）")
  withInjections(fakeTable(names), () => {
    const outputs = new Map(Object.keys(SCENARIO_SLOT_FILES).map((s) => [s, assemblePrompt(s).prompt]))
    for (const [scenario, prompt] of outputs) {
      assert.ok(!prompt.includes("{{inject:"), `场景 ${scenario} 装配输出残留锚字面`)
    }
    // 非空转：工具面锚（bash / question）⇒ 表值须在工具描述面在场
    assert.ok(names.has("bash-terminal-face") && names.has("question-ui-face"), "核内仅剩工具面 2 锚")
    const toolDescs = builtinTools.map((t) => String(toOpenAISchema(t).function.description))
    assert.ok([...names].some((n) => toolDescs.some((d) => d.includes(`<${n}>`))), "工具面表值在场 ⇒ 钩子未失效")
    assert.ok(outputs.get("consult").length > 0, "面 2（consult 基底）经同函数出径")
  })
})

test("面 1：缺键 ⇒ 工具面抛错（fail-loud——钩子确在工具描述路径上）", () => {
  const names = [...coreAnchorNames()]
  const present = names.filter((n) => builtinTools.some((t) => t.description.includes(`{{inject:${n}}}`)))
  assert.ok(present.length > 0, "工具面必须含真实锚（否则本用例空转）")
  const missing = present[0]
  withInjections(fakeTable(names.filter((n) => n !== missing)), () => {
    assert.throws(() => builtinTools.map(toOpenAISchema), new RegExp(missing), "缺键 ⇒ 抛错且消息含锚名")
    assert.deepEqual(assemblePrompt("consult").warnings, [], "无锚场景不受缺键影响")
  })
})

test("面 3（工具描述）：注册表全量工具经 DESC ⇒ 零字面且表值逐锚在场", () => {
  const names = coreAnchorNames()
  withInjections(fakeTable(names), () => {
    let replaced = 0
    for (const tool of builtinTools) {
      const rawNames = [...tool.description.matchAll(ANCHOR_RE)].map((m) => m[1])
      const desc = toOpenAISchema(tool).function.description
      assert.ok(!desc.includes("{{inject:"), `${tool.name} 描述残留锚字面`)
      for (const n of rawNames) assert.ok(desc.includes(`<${n}>`), `${tool.name}：锚 ${n} 未替换为表值`)
      replaced += rawNames.length
    }
    assert.ok(replaced > 0, "注册表内须含真实锚（bash / question 两档）——否则本用例空转")
  })
})

test("面 4（顾问提示词）：六条 return 分支代表性输出零 `{{inject:` 字面（覆盖面由结构机检③补）", () => {
  withInjections(fakeTable(coreAnchorNames()), () => {
    const cases = [
      [{ _advisorRound: 0 }, null, "design"], // ADVISOR_DESIGN
      [{ _advisorRound: 1, _lastAdvisorOutput: "prior" }, null, "design"], // ROUND2
      [{ _advisorRound: 2, _lastAdvisorOutput: "prior" }, null, "design"], // ROUND3
      [{ _advisorRound: 0 }, null, "code"], // ROUND1
      [{ _advisorRound: 1, _lastAdvisorOutput: "prior" }, null, "code"], // ROUND2
      [{ _advisorRound: 2, _lastAdvisorOutput: "prior" }, null, "code"], // ROUND3
    ]
    for (const [agent, prior, type] of cases) {
      const prompt = buildAdvisorSystemPrompt(agent, prior, type)
      assert.ok(typeof prompt === "string" && prompt.length > 0, `${type} 分支输出非空`)
      assert.ok(!prompt.includes("{{inject:"), `${type} 分支输出残留锚字面`)
    }
  })
})

// ─── 结构机检（承 write-path / tool-seams 的登记表 + 等值写法）────────────────────

/** 递归收集核内 .mjs（排除 `test/`——测试档不在缝面射程）。 */
function coreModules(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== "test") coreModules(p, out) }
    else if (name.endsWith(".mjs")) out.push(relative(ROOT, p).replace(/\\/g, "/"))
  }
  return out
}

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

const readClean = (rel) => stripComments(readFileSync(join(ROOT, rel), "utf8"))

/** 缝定义档派生（fail-closed）：导出 U0 注入缝任一名的档自动进入域——新增缝档不会静默漏检。
 *  形态无关：按**导出面名字**判（声明 / async / const / re-export / `as` 别名均可识别），不按语法形态判。 */
function seamModules() {
  const modules = new Set(["prompt-files.mjs", "prompt-overlays.mjs", "tools/shared.mjs", "advisor.mjs"])
  const SEAM_NAMES = new Set(["configurePromptInjections", "resetPromptInjections"])
  for (const rel of coreModules()) {
    if (exportNamesOf(readClean(rel)).some((n) => SEAM_NAMES.has(n))) modules.add(rel)
  }
  return [...modules].sort()
}

/** 具名导出面（含 re-export / `as` 别名——取对外名）。 */
function exportNamesOf(src) {
  const names = new Set()
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_]+)/g)) names.add(m[1])
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const n = part.trim().split(/\s+as\s+/).pop().trim()
      if (n) names.add(n)
    }
  }
  return [...names]
}

/** 缝名族 = `(configure|reset|set) + 大写开头`（与 tool-seams① 同族）。 */
const SEAM_NAME_RE = /^(?:configure|reset|set)[A-Z][A-Za-z0-9_]*$/

/** 缝导出提取：声明形 + `export { … }`（含 re-export / `as` 别名）——别名形不得绕过登记表。 */
const seamExportsOf = (src) => exportNamesOf(src).filter((n) => SEAM_NAME_RE.test(n)).sort()

test("结构机检①：缝面导出面逐档等值（fail-closed——新增未登记 / 消失均红）", () => {
  // 逐档 = 按档登记、逐名相等。域 = 本 U0 四档（U0 缝落核根 `prompt-files.mjs`——
  // 不在 tool-seams① 的 `tools/` + `agent-tools/` 两个既有域内）∪ 缝定义档（派生）。
  // 提取面 = 声明形 + `export { … }`（含 re-export / `as` 别名）——别名形而不再绕过登记表。
  const REGISTERED = { "prompt-files.mjs": ["configurePromptInjections", "resetPromptInjections"] }
  const modules = seamModules()
  const actual = {}
  for (const rel of modules) actual[rel] = seamExportsOf(readClean(rel))
  const expected = {}
  for (const rel of modules) expected[rel] = [...(REGISTERED[rel] ?? [])].sort()
  assert.deepEqual(actual, expected, "缝面导出面须与登记表逐档逐名等值（新增未登记 / 消失均红）")
  // 缝模块**全导出面**逐名等值——`applyPromptInjections` 不在 configure/reset 命名族内，显式登记。
  assert.deepEqual(
    exportNamesOf(readClean("prompt-files.mjs")).sort(),
    [
      "PROMPTS_DIR", "TOOL_DOCS_DIR", "applyPromptInjections", "configurePromptInjections",
      "loadAdvisorPrompt", "loadConsultBase", "loadSlot", "loadToolDoc", "resetPromptInjections",
    ].sort(),
    "prompt-files.mjs（单一解析面 + 注入缝）导出面须逐名等值",
  )
})

test("结构机检②：缝模块零端名（注释剥除后的代码面——契约 5 / 10 机械面）", () => {
  // 注释面允许历史叙事（如既有注释引来源 / 对齐记录）；代码面（含字符串）不得出现端名 / 产品名。
  // 比 tool-seams② 的既有口径多收裸词 `VSC` / `CLI`（设计（四）「无产品标识」——四个 U0 档
  // 的代码面零命中已实核；其余核内档的中立用法如 `session-slots.mjs` 的 `END = "cli"` 不在本域射程）。
  const END_NAME = /(?:vscode|vs\s*code|thincoder-cli|thincoder-vscode|\bVSC\b|\bCLI\b)/i
  const hits = seamModules().filter((rel) => END_NAME.test(readClean(rel)))
  assert.deepEqual(hits, [], `缝模块代码面出现端名：${hits.join(", ")}`)
})

test("结构机检③：逐 return 分支经原语（面 4 = 6 条 · 面 2 = 2 条——新增分支未挂即红）", () => {
  // 取函数体（花括号配平）+ 注释剥除；每条含 `return` 的行 = 一条 return 语句
  //（形态约定：这两个函数的 return 逐条单行——多行 return 会被判未挂，fail-closed 方向正确）。
  const bodyOf = (rel, signature) => {
    const src = readFileSync(join(ROOT, rel), "utf8")
    const at = src.indexOf(signature)
    assert.ok(at >= 0, `无法定位函数签名：${signature}`)
    const open = src.indexOf("{", at)
    let depth = 0
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") depth++
      else if (src[i] === "}") { depth--; if (depth === 0) return stripComments(src.slice(open + 1, i)) }
    }
    assert.fail(`函数体未闭合：${signature}`)
  }
  const check = (rel, signature, floor) => {
    const returns = bodyOf(rel, signature).split("\n").filter((l) => /\breturn\b/.test(l))
    assert.ok(returns.length >= floor, `${rel}「${signature}」return 分支数应 ≥ ${floor}（实读 ${returns.length}）`)
    const unwrapped = returns.filter((l) => !l.includes("applyPromptInjections("))
    assert.deepEqual(unwrapped.map((l) => l.trim()), [], `${rel}「${signature}」有未挂原语的 return（新增分支必须经 applyPromptInjections）`)
  }
  check("advisor.mjs", "export function buildAdvisorSystemPrompt(", 6)
  check("prompt-overlays.mjs", "export function assemblePrompt(", 2)
})
