/**
 * scoped-rules.test.mjs — VSC 行为/能力两则批 · B 面（#130）用例：`.cursor/rules` 作用域规则
 * 真生效（常驻集 [4] 层尾块 + 作用域集 JIT 注入 + 三分类 + CLI 零对位）。判据 = 批档
 * `docs/batches/2026-09-20-vsc-rules-retry-batch.md` §2.5 T-B1…T-B4；面定义权威 =
 * `docs/core/design/WORKSPACE.md` §2.3。
 * 手法：T-B1 纯函数直驱 · T-B2 真 `setupAgentRun`（depth 1——零面板/零网络）· T-B3 真
 * `executeToolBatches`（假只读工具——零磁盘副作用）· T-B4 源码扫描（登记面：CLI 不读该目录）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { loadRules } from "../src/extension/rules.mjs"
import { loadScopedRules } from "../src/agent/rules-face.mjs"
import { setupAgentRun } from "../src/agent/setup.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

const here = dirname(fileURLToPath(import.meta.url))
let root

before(() => {
  root = mkdtempSync(join(tmpdir(), "tc-scoped-rules-"))
  const cfg = join(root, "config.json")
  writeFileSync(cfg, "{}\n", "utf8")
  _setConfigPathForTest(cfg)
})
after(() => {
  _setConfigPathForTest(null)
  try { rmSync(root, { recursive: true, force: true }) } catch { /* best effort */ }
})

/** `.cursor/rules` 夹具（五形态 + 目录收敛用的 `.thincoder/rules` 流规则）。 */
const RULES = {
  "always.md": ["---", "alwaysApply: true", "---", "Always use the logger."].join("\n"),
  "bare.md": "Bare rule body — no frontmatter, no globs, no description.\n",
  "both.mdc": ["---", 'globs: "*.py"', "alwaysApply: true", "---", "Always-rules win over globs."].join("\n"),
  "py.mdc": ["---", 'globs: "*.py"', "---", "Python style rule."].join("\n"),
  "desc.md": ["---", 'description: "agent requested"', "---", "Description-only rule."].join("\n"),
}
function mkCursor(tag, files = RULES, { withStream = true } = {}) {
  const cwd = join(root, tag)
  mkdirSync(join(cwd, ".cursor", "rules"), { recursive: true })
  for (const [name, text] of Object.entries(files)) writeFileSync(join(cwd, ".cursor", "rules", name), text, "utf8")
  if (withStream) {
    mkdirSync(join(cwd, ".thincoder", "rules"), { recursive: true })
    writeFileSync(join(cwd, ".thincoder", "rules", "stream.md"), ['---', 'pattern: "X"', "---", "stream face body"].join("\n"), "utf8")
  }
  return cwd
}

// ─── T-B1 读取与分类（正常 + 边界）──────────────────────────────────────────

test("T-B1 三分类（按序判定·互斥）+ 目录收敛：alwaysApply 先判 / globs ⇒ 作用域 / 无二者 ⇒ 常驻 / 仅 description ⇒ 不注入", () => {
  const cwd = mkCursor("classify")
  const { always, scoped } = loadScopedRules(cwd)
  assert.deepEqual(always.map((r) => r.name).sort(), ["always", "bare", "both"],
    `常驻集 = alwaysApply / 无 frontmatter / alwaysApply+globs（先判——实读 ${JSON.stringify(always.map((r) => r.name))})`)
  assert.deepEqual(scoped.map((r) => r.name), ["py"], "作用域集 = 仅有 globs")
  assert.ok(!always.some((r) => r.name === "desc"), "仅 description ⇒ 不进常驻集")
  assert.ok(!scoped.some((r) => r.name === "desc"), "仅 description ⇒ 不进作用域集（Cursor agent-requested 语义不注入）")
  const both = always.find((r) => r.name === "both")
  assert.deepEqual(both.globs, ["*.py"], "alwaysApply + globs ⇒ 常驻集（globs 同在不改分类）")
  assert.ok(!loadRules(cwd).some((r) => r.name === "stream"), "`.thincoder/rules` 不被读取（目录收敛为 `.cursor/rules` 单读）")
})

// ─── T-B2 常驻集尾块（正常 + 边界）──────────────────────────────────────────

/** 真装配取 systemPrompt（depth 1——零网络/零面板；provider 桩仅满足装配面）。 */
async function promptFor(cwd) {
  const { systemPrompt } = await setupAgentRun({
    provider: { name: "p", model: "m" }, cwd, input: "x", opts: {}, depth: 1, role: "explore", getAuto: () => false,
  })
  return systemPrompt
}

test("T-B2 常驻集 [4] 层尾块：含块头 + `- <name>: <content>`；无命中 ⇒ systemPrompt 逐字零改", async () => {
  const withRules = await promptFor(mkCursor("prompt-on"))
  assert.ok(withRules.includes("Project rules (.cursor/rules):"), "块头逐字")
  assert.ok(withRules.includes("- always: Always use the logger."), "常驻规则 = `- <name>: <content>`")
  assert.ok(withRules.includes("- bare: Bare rule body"), "无 frontmatter 规则同入")
  assert.ok(!withRules.includes("- py: "), "作用域规则不进常驻尾块")
  assert.ok(!withRules.includes("- desc: "), "仅 description 不进常驻尾块")

  const none = await promptFor(join(root, "prompt-none"))
  assert.ok(!none.includes("Project rules (.cursor/rules):"), "无 `.cursor/rules` ⇒ 零注入")
  const scopedOnly = await promptFor(mkCursor("prompt-scoped", { "py.mdc": RULES["py.mdc"] }, { withStream: false }))
  assert.equal(scopedOnly, none, "仅作用域/仅 description 规则 ⇒ systemPrompt 与无目录逐字同（零改字符串）")
})

// ─── T-B3 作用域集 JIT 注入（正常 + 边界）───────────────────────────────────

/** 真 `executeToolBatches` 直驱（假只读工具——零磁盘写）：返回本条批的 history。 */
async function dispatch(agent, cwd, calls) {
  const history = []
  const fullHistory = []
  const toolByName = new Map(calls.map((c) => [c.name, {
    name: c.name, readonly: true, parameters: { type: "object", properties: {} },
    async execute() { return "tool-output" },
  }]))
  const response = { toolCalls: calls.map((c, i) => ({ id: `tc${i}`, name: c.name, arguments: JSON.stringify(c.args) })) }
  await executeToolBatches(agent, {
    response, history, fullHistory, toolByName, getAuto: () => true,
    callbacks: {}, signal: null, sessionSignal: null, cwd, recentSigs: [], depth: 1,
  })
  return history
}

test("T-B3 作用域集 JIT：命中 ⇒ 派发前注入一次；同会话二次命中 ⇒ 零新注入；不匹配 ⇒ 零注入", async () => {
  const cwd = mkCursor("jit")
  const agent = { cwd, config: {}, _rules: loadScopedRules(cwd) }
  const ruleHits = (h) => h.filter((m) => typeof m.content === "string" && m.content.includes('project rule "py"'))

  const h1 = await dispatch(agent, cwd, [{ name: "read", args: { path: "a.py" } }])
  const inj = ruleHits(h1)
  assert.equal(inj.length, 1, `命中路径 ⇒ 注入恰一次（实读 ${JSON.stringify(h1.map((m) => String(m.content).slice(0, 50)))})`)
  assert.ok(inj[0].content.includes("(globs: *.py)") && inj[0].content.includes("Python style rule."), "载荷 = 名称 + globs + 正文")
  assert.ok(h1.indexOf(inj[0]) < h1.findIndex((m) => m.role === "tool"), "注入先于工具结果（派发前——模型下一轮可见）")

  const h2 = await dispatch(agent, cwd, [{ name: "read", args: { path: "b.py" } }])
  assert.equal(ruleHits(h2).length, 0, "同会话二次命中 ⇒ 零新注入（会话级去重——`agent._rulesInjected`）")

  const fresh = { cwd, config: {}, _rules: loadScopedRules(cwd) }
  const h3 = await dispatch(fresh, cwd, [{ name: "read", args: { path: "a.md" } }])
  assert.equal(ruleHits(h3).length, 0, "不匹配路径 ⇒ 零注入")

  // 绝对路径（Windows 盘符大小写异形——VS Code `uri.fsPath` 小写盘符 vs 模型侧大写盘符）
  const abs = join(cwd, "a.py")
  const flipped = process.platform === "win32" ? abs[0].toLowerCase() + abs.slice(1) : abs
  const h4 = await dispatch({ cwd, config: {}, _rules: loadScopedRules(cwd) }, cwd, [{ name: "read", args: { path: flipped } }])
  assert.equal(ruleHits(h4).length, 1, `绝对路径同样命中（归一候选生效；实读 path=${flipped}）`)
})

// ─── T-B4 CLI 无对位（登记面）──────────────────────────────────────────────

test("T-B4 登记面：thincoder-cli 树对 `.cursor/rules` 零读点（本批不改 CLI）", () => {
  const cliSrc = join(here, "..", "..", "thincoder-cli", "src")
  assert.ok(existsSync(cliSrc), `兄弟树在场（登记面断言的前置——缺位即失败而非 ENOENT）：${cliSrc}`)
  const hits = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith(".mjs") && readFileSync(p, "utf8").includes(".cursor/rules")) hits.push(p)
    }
  }
  walk(cliSrc)
  assert.deepEqual(hits, [], `CLI 端零读点（登记 = 非缺陷）：${hits.join(", ")}`)
})
