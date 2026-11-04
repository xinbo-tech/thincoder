/**
 * tester-role.test.mjs — 集成用例 30-1（RTM CLI 端故事 30「读数子代理：派一个 tester 跑验证」）。
 *
 * 判据原文 = `test/RTM.md` 第 30 节；机制 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59
 * （工具面 §6.59.2 ④ · 报告形态 §6.59.10 · 集成行设计 §6.59.9）。
 *
 * **进入口 = 父侧工具面**（`subagent` 走 `executeToolCalls` 的真门与真装配——不直调 `buildSpawnChild`）：
 * 本档要的是「父侧派一个读数子代理跑一条必败断言」这件事的业务可观察结果——
 * 受理、它看得见的工具表里没有写面、报告把命令与跑者的读数原样带回。
 *
 * 交互组件 = 角色白名单（`agent-tools/subagent.mjs`）⟷ 工具面过滤（核 `agent-tools/subagent-spawn.mjs`
 * ⟷ 端 `thincoder-vscode/src/agent/tool-table.mjs`）⟷ 提示词装配（`prompt-overlays.mjs`）⟷ 子代理报告。
 * 模型侧 = 本地脚本化假 Anthropic 端点（零外网、零付费端）：首回合派一条真 `bash` 调用跑夹具里的必败断言，
 * 次回合把本进程实际收到的工具结果拼成回复 ⇒「子代理真跑过」「结果原样回到父侧」都落在回复文本与请求体里，
 * 断言不必窥探内部形态。
 *
 * **核 ∥ 端同一工具面**（§6.59.2 ⑥ / AC-TT2「两端名集不等 = 不通过」）：端侧 `buildToolTable` 在 node 下要
 * `vscode` 宿主模块，本档用 `module.registerHooks` 把 `vscode` 解析到桩模块（先例 =
 * `grep-process-doc-mark.test.mjs`）后真跑它——不靠读源码猜它怎么过滤。两端拿**同一份输入表**（含
 * `verify` ∥ `advisor` 两枚只读结论工具，使两枚减法各走一次真减法），家族段不进比较（两端同一处由核
 * `assembleFamilyTools` 追加）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/tester-role.test.mjs`
 *
 * 本档证明得了什么、证不了什么：报告文本里的命令原文 ∥ 跑者计数 ∥ 用例名 ∥ exit code 都**来自本地真跑者**
 * （夹具把实际收到的工具结果拼成回复），所以它们证明「子代理真跑过、结果原样回到父侧」；
 * 它们**不**证明模型会照 persona 的四块形态写（模型只要回吐工具结果就恒过）。四块形态 = 模型行为面，
 * 靠 AC-TT3 ∥ AC-TT4 的真实派单人工判——不得把本档的绿读成「报告形态已机检」。
 * 两端比较同理只覆盖**无 MCP** 的父侧（`mcpServers: []`）：端侧基础集会无条件并入 `mcpTools`，核侧 tester
 * 分支只认只读集——父侧一旦挂 MCP，两端名集就不同。这一面 explore ∥ plan 也同样存在（端侧只筛
 * `builtinTools`），不是本角色引入的；要不要处置由设计席定，本档不把它读成「两端恒同集」。
 * 端侧这一腿是**直调装配函数**（`vscBuildToolTable({…})`），证的是「端侧那条规则算出的名集 = 核侧」，
 * **不**证该分支在 VS Code 运行期可达——当前 VSC 树里 `buildToolTable` 的唯一调用点是 `hydrateRun`，
 * 而 `hydrateRun` 的唯一调用点传 `depth: 0, role: null`。两边喂的也都是**核内置表**（不是 VS Code 端自有
 * 登记表 `thincoder-vscode/src/tools/index.mjs`）——所以它钉的是**规则等价**，不是「端侧真实的表长这样」。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { createAgent } from "../../thincoder-core/agent.mjs"
import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { assembleFamilyTools } from "../../thincoder-core/agent/family-tools.mjs"
import { readonlyToolNames, SUBAGENT_TOOL_EXCLUSIONS } from "../../thincoder-core/agent/helpers.mjs"
import { advisorTool, verifyTool } from "../../thincoder-core/agent-tools.mjs"
import { subagentTool } from "../../thincoder-core/agent-tools/subagent.mjs"
import { builtinTools } from "../../thincoder-core/tools/index.mjs"
import { fakeAnthropic } from "./fixtures/anthropic-endpoint.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
mkdirSync(SCRATCH, { recursive: true })
// 夹具前提（不是被测行为）：本档让子代理去跑 `node --test`，那是**真跑者**。外层也是 test runner，
// 它给本进程留了 `NODE_TEST_CONTEXT` 标记；子进程一旦继承，`node --test` 会当成「嵌套调用测试文件」
// 直接跳过（读数变成 exit 0 + 零用例——假绿）。清掉标记，跑者才是跑者。
delete process.env.NODE_TEST_CONTEXT

/** 子代理块的人格标记（`persona-tester.md` 首行标题）——用来在请求体里认出 tester 那几发请求。 */
const TESTER_PERSONA_MARK = "Role: readings source"
/** 夹具里的必败用例名（断言要落在跑者吐出的名字上，不是落在我自己写的一句话上）。 */
const FAIL_CASE = "TT-30-1 failing assertion"
/** 夹具模型（两端装配都对它取 spec——非多模态，故两端都不会多出 `read_image`）。 */
const MODEL = "claude-fake-1"

/**
 * 派单前的父面工具表 = 核内置表 + `verify` + `advisor`。
 * 后两枚都是 `readonly: true` 的**结论**工具：进了只读集就必须被显式减掉（§6.59.2 ④）——
 * 夹具里带上它们，两枚减法才各走一次**真减法**（没减就进表，判据当场变红）。
 */
const parentToolTable = () => [...builtinTools, verifyTool, advisorTool]

/** 端侧装配面在 node 下要 `vscode` 宿主模块——桩掉它（只桩这一个 specifier），再真跑端侧函数。 */
const VSCODE_STUB_PATH = join(SCRATCH, "vscode-stub.mjs")
writeFileSync(VSCODE_STUB_PATH, `export const window = {}
export const workspace = {}
export const commands = {}
export const env = {}
export const languages = { getDiagnostics: () => [] }
export const extensions = {}
export const SymbolKind = {}
export const EventEmitter = class {}
export const Disposable = class {}
export const Position = class {}
export const Uri = { file: (p) => ({ fsPath: p }) }
`)
const VSCODE_STUB_URL = new URL(`file:///${VSCODE_STUB_PATH.replace(/\\/g, "/")}`).href
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})
const { buildToolTable: vscBuildToolTable } = await import("../../thincoder-vscode/src/agent/tool-table.mjs")

/** 夹具项目：一份必败断言用例 + 一本在盘批档（spawn 的 cwd 落在这里，`bash` 的相对路径才有意义）。 */
function makeProject(tag, extra = {}) {
  const root = mkdtempSync(join(SCRATCH, `tt-${tag}-`))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "test"), { recursive: true })
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  writeFileSync(join(root, "docs/batches/probe.md"), "# probe\n\n## §2 批次任务与设计\n\n占位。\n")
  writeFileSync(join(root, "test/failing.test.mjs"),
    `import { test } from "node:test"\nimport assert from "node:assert/strict"\n`
    + `test("${FAIL_CASE}", () => { assert.equal(2 + 2, 5) })\n`)
  writeFileSync(join(root, "test/passing.test.mjs"),
    `import { test } from "node:test"\nimport assert from "node:assert/strict"\n`
    + `test("TT-30-1 passing assertion", () => { assert.equal(2 + 2, 4) })\n`)
  for (const [rel, content] of Object.entries(extra)) writeFileSync(join(root, rel), content)
  return root
}

/** depth-0 父面：真工具表（`parentToolTable()`）+ 假 Anthropic 端点做 provider。 */
function parentOf({ root, port, engineering }) {
  const provider = {
    name: "fake-anthropic",
    baseURL: `http://127.0.0.1:${port}/v1`,
    format: "anthropic",
    apiKey: "test-key",
    model: MODEL,
  }
  const parent = createAgent({
    provider,
    tools: parentToolTable(),
    config: { agent: { engineering }, providersList: [provider], defaultModel: "fake-anthropic:claude-fake-1" },
    cwd: root,
    memory: null,
    role: null,
    autoApprove: true,
  })
  parent._subAgentCounter = 0
  return parent
}

const fiveParams = (command, fixture) => ({
  role: "tester",
  goal: `Run the assertion with \`${command}\` and report the readings.`,
  knownFacts: `The fixture case lives in test/${fixture}.test.mjs.`,
  scope: "Read-only work: do not edit any file.",
  acceptance: "The report carries the command, the runner's counts and the failing case name.",
  reportFormat: "Four blocks in the order the role contract states.",
  async: false,
})

/** 跑一次 tester：本地假端点脚本化一条真 `bash` 调用 ⇒ 子代理真跑那条命令 ⇒ 报告原样回到父侧。 */
async function runTester({ root, command, fixture, callsId }) {
  const endpoint = await fakeAnthropic({
    calls: [{ id: callsId, name: "bash", input: { command, description: `run ${command}` } }],
  })
  const parent = parentOf({ root, port: endpoint.port, engineering: true })
  const ctx = { depth: 0, agent: parent, callbacks: {}, signal: null, onPermissionRequest: async () => true }
  const [res] = await executeToolCalls(
    parent,
    new Map([["subagent", subagentTool]]),
    [{ name: "subagent", id: `call_${callsId}`, arguments: JSON.stringify(fiveParams(command, fixture)) }],
    ctx,
    0,
  )
  return { endpoint, res, report: String(res.result ?? "") }
}

/** 工具表无写面（同一条判据，两次跑都看）：模型拿到的工具表既无写工具、也无结论工具（`verify` ∥ `advisor`）。 */
function assertNoWriteFace(endpoint, label) {
  const testerRequests = endpoint.requests.filter((r) => String(r.body?.system ?? "").includes(TESTER_PERSONA_MARK))
  assert.ok(testerRequests.length >= 2, `${label}：子代理至少走过工具回合一 ∥ 收尾回合：实得 ${testerRequests.length} 发`)
  for (const req of testerRequests) {
    const names = (req.body.tools ?? []).map((tool) => tool.name ?? tool?.function?.name)
    for (const forbidden of ["write", "edit", "insert_after", "hashline_edit", "apply_patch", "delete", "file_ops", "git", "verify", "advisor"]) {
      assert.ok(!names.includes(forbidden), `${label}：tester 的工具表不得含 ${forbidden}：${JSON.stringify(names)}`)
    }
    assert.ok(names.includes("bash") && names.includes("execute"), `${label}：执行面两枚须在表（F-TT2）：${JSON.stringify(names)}`)
  }
}

/**
 * AC-TT2 的「核 ∥ 端名集相等」：同一角色、同一份输入表，两端各跑一次真装配，基础集逐名比。
 *   · 核侧 = 真派单里子代理实际收到的工具表（请求体）− 家族段。家族段两端同一处由核
 *     `assembleFamilyTools` 追加 ⇒ 不进这条比较（§6.59.9）。
 *   · 端侧 = VS Code 端 `buildToolTable` 对同一份输入表的真跑结果。
 *   · 公式面（AC-TT2 原文「按公式取快照比集合」）= 只读集 ∪ {execute, bash} − {verify, advisor}，
 *     再经 `SUBAGENT_TOOL_EXCLUSIONS`——核侧实得名集必须与它同集。
 */
async function assertSameToolFace(endpoint, label) {
  const testerReq = endpoint.requests.find((r) => String(r.body?.system ?? "").includes(TESTER_PERSONA_MARK))
  assert.ok(testerReq, `${label}：没抓到 tester 的请求，取不到它实际拿到的工具表`)
  const bodyNames = (testerReq.body.tools ?? []).map((tool) => tool.name ?? tool?.function?.name)
  const input = parentToolTable()
  // 家族段（同一处、核追加）——engineering 面 = 子代理继承父侧模式位（tester 不是工程角色 ⇒ 取父 config）
  const family = new Set((await assembleFamilyTools({ depth: 1, role: "tester", engineering: true, consultModels: [], batchDoc: null })).map((t) => t.name))
  for (const name of family) {
    assert.ok(bodyNames.includes(name), `${label}：家族段的 ${name} 本该由核追加，实得表里没有：${JSON.stringify(bodyNames)}`)
  }
  const coreNames = bodyNames.filter((n) => !family.has(n))

  // 公式快照
  const formula = new Set([...readonlyToolNames(input), "execute", "bash"])
  for (const trimmed of ["verify", "advisor"]) formula.delete(trimmed)
  for (const excluded of SUBAGENT_TOOL_EXCLUSIONS) formula.delete(excluded)
  assert.deepEqual(coreNames.slice().sort(), [...formula].sort(), `${label}：核侧工具表须与公式同集`)

  // 端侧（真跑端装配函数，同一份输入表）
  const vsc = await vscBuildToolTable({
    depth: 1, role: "tester", engineering: true,
    provider: { model: MODEL }, mcpServers: [], builtinTools: input,
    opts: {}, batchDoc: null, settingsTool: null,
  })
  const vscNames = vsc.baseSet.map((t) => t.name).sort()
  assert.deepEqual(vscNames, coreNames.slice().sort(), `${label}：核 ∥ 端同一角色的工具面必须逐名相等（端差 = 缺陷）`)
}

test("30-1 派一个 tester 跑一条必败 ∥ 必过断言：受理 · 工具表无写面（核 ∥ 端逐名相等）· 报告带回命令原文与跑者读数", { timeout: 180_000 }, async (t) => {
  const root = makeProject("30-1")
  const runs = []
  t.after(async () => {
    for (const r of runs) await r.endpoint.close()
    rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
    rmSync(VSCODE_STUB_PATH, { force: true }) // 桩模块是夹具（模块已在进程内载完，删掉不扰后续断言）
  })

  // ── 必败断言 ──
  const failing = await runTester({ root, command: "node --test test/failing.test.mjs", fixture: "failing", callsId: "tu_30_1_fail" })
  runs.push(failing)
  const failReport = failing.report

  // ① 受理：派单成立，回来的是一份子代理报告（不是任何门的拒句）
  assert.equal(failing.res.ok, true, `派 tester 必须受理，实得：${failReport.slice(0, 400)}`)
  assert.ok(failReport.trim().length > 0, "报告不得为空")
  for (const refusal of ["Unknown subagent role", "Engineering mode", "Spawn task-book gate"]) {
    assert.ok(!failReport.includes(refusal), `受理面不得出现门的拒句「${refusal}」：${failReport.slice(0, 300)}`)
  }

  // ② 工具表无写面
  assertNoWriteFace(failing.endpoint, "必败跑")
  await assertSameToolFace(failing.endpoint, "必败跑")

  // ③ 必败跑的报告把读数原样带回：命令原文 ∥ 跑者汇总行 ∥ 失败用例名（都来自本地跑者）
  assert.ok(failReport.includes("node --test test/failing.test.mjs"), `报告须带命令原文：${failReport.slice(0, 400)}`)
  assert.match(failReport, /fail 1/, `报告须带跑者给的 fail 计数：${failReport.slice(-800)}`)
  assert.ok(failReport.includes(FAIL_CASE), `报告须带失败用例名：${failReport.slice(-800)}`)
  assert.match(failReport, /\(exit code 1\)/, `报告须带这次跑的 exit code：${failReport.slice(-500)}`)

  // ── 必过断言（§6.59.9：同一交互，只差可观察结果 —— 合并在本行的第二条断言）──
  const passing = await runTester({ root, command: "node --test test/passing.test.mjs", fixture: "passing", callsId: "tu_30_1_pass" })
  runs.push(passing)
  const passReport = passing.report
  assert.equal(passing.res.ok, true, `派 tester 必须受理（必过跑），实得：${passReport.slice(0, 400)}`)
  assertNoWriteFace(passing.endpoint, "必过跑")
  assert.match(passReport, /pass 1/, `报告须带跑者给的 pass 计数：${passReport.slice(-800)}`)
  assert.match(passReport, /\(exit code 0\)/, `报告须带这次的 exit code 0：${passReport.slice(-500)}`)
})
