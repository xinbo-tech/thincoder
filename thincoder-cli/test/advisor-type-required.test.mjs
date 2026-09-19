/**
 * advisor-type-required.test.mjs — F30 类型门（顶层 `type` 必填 + 声明一致性；fail-closed）
 * ＋ 调用面零残留结构断言。判据全文 = `docs/core/design/ADVISOR-GUARDS.md` §2.4 / §10 A-AG13 /
 * A-AG15；用例表 T-AF4 / T-AF5 / T-AF9 / T-AF13 / T-AF14 / T-AF15（批档 §2.7 / §2.9）。
 * 零网络（桩 provider——只断言发起受理面，不等评审完成）、零真实 LLM、零长等待。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs"
import { cancelAsyncAdvisor } from "@thincoder/core/agent-tools/advisor-async.mjs"

const REFUSAL = "Advisor: launch refused"
const LEGAL_CODE_LINE = '  • type="code"   — code review:'
const LEGAL_DESIGN_LINE = '  • type="design" — design review:'
const OBJECT_NOTE = 'The object declaration says type="design"; the declaration describes the review target, it does not select the review track.'
const CODE_SCOPE = ["thincoder-core/agent-tools/advisor.mjs"]

const mktmp = () => mkdtempSync(join(tmpdir(), "af-type-"))
/** 桩 agent（同 advisor-chain-guards T-CG18 的形状——零真实 provider）。 */
const mkAgent = (cwd) => ({
  cwd, history: [], config: {}, provider: {}, _touchedFiles: [], _engDesignTokens: new Map(),
  _advisorRuns: new Map(), _asyncAdvisors: new Map(), _asyncSubagents: new Map(),
})
/** 直调工具：`type` 显式取调用方实参（含 undefined——类型门的「缺失」形即此面）。 */
const callTool = (args, agent, id) =>
  advisorTool.execute({ type: args.type, ...args }, { agent, cwd: agent.cwd, depth: 0, callbacks: {}, _toolCallId: id })
/** 受理后清理后台池（断言只看发起受理面）。 */
const cleanup = (agent, out) => {
  try { cancelAsyncAdvisor(agent, JSON.parse(out).id) } catch { /* 非 ack——无池条目 */ }
  for (const id of [...(agent._asyncAdvisors?.keys() ?? [])]) agent._asyncAdvisors.delete(String(id))
}

// ─── T-AF5 / AC-2：无 `type` ⇒ 拒发串（前缀 + 两个合法值行 + 标识行）───────────

test("T-AF5 无 type ⇒ 拒发串（前缀逐字 + Why + 两合法值行 + 标识行）+ 拒发登记 + 零实例 / 零 token", async () => {
  const agent = mkAgent(mktmp())
  const out = await callTool({ documents: ["docs/core/design/ADVISOR-GUARDS.md"] }, agent, "tp-none")
  assert.ok(out.startsWith(REFUSAL), "首行以拒发前缀起（AC-2）")
  assert.ok(out.includes("Why: the call carried no type at the top level"), "Why 行（type-missing 逐字）")
  assert.ok(out.includes(LEGAL_CODE_LINE) && out.includes(LEGAL_DESIGN_LINE), "两个合法值各一行用途")
  assert.ok(out.includes("Nothing was sent: no review instance, no round consumed, no design token minted, no LLM call."), "零尝试声明")
  assert.match(out, /\[type=absent · scope=docs\/core\/design\/ADVISOR-GUARDS\.md · round=— · criterion=type-missing\]/, "标识行四字段（AC-3）")
  assert.equal(agent._advisorRefusals.has("tp-none"), true, "拒发登记命中该 toolCallId")
  assert.equal(agent._asyncAdvisors.size, 0, "零池条目（零实例）")
  assert.equal(agent._advisorRuns.size, 0, "零实例登记")
  assert.equal(agent._engDesignTokens.size, 0, "零 token 写入")
})

// ─── T-AF9 / AC-9：形态枚举闭合（判据名分叉）────────────────────────────────

test("T-AF9 形态枚举：缺失 / null / 空串 / 纯空白 ⇒ type-missing；非法值 / 非字符串 ⇒ type-invalid；两合法值 ⇒ 照常", async () => {
  const cwd = mktmp()
  const missing = [undefined, null, "", "  "]
  for (const [i, v] of missing.entries()) {
    const agent = mkAgent(cwd)
    const out = await callTool({ type: v, paths: CODE_SCOPE }, agent, `tp-m${i}`)
    assert.ok(out.startsWith(REFUSAL), `缺失形 #${i}（${JSON.stringify(v)}）拒发`)
    assert.ok(out.includes("criterion=type-missing") && out.includes("type=absent"), `缺失形 #${i} 判据名 = type-missing`)
    assert.equal(agent._advisorRefusals.has(`tp-m${i}`), true, `缺失形 #${i} 拒发登记`)
    assert.equal(agent._asyncAdvisors.size, 0, `缺失形 #${i} 零池条目`)
  }
  const invalid = ["Code", "design ", "foo", 1, true, {}, []]
  for (const [i, v] of invalid.entries()) {
    const agent = mkAgent(cwd)
    const out = await callTool({ type: v, paths: CODE_SCOPE }, agent, `tp-i${i}`)
    assert.ok(out.startsWith(REFUSAL), `非法形 #${i}（${JSON.stringify(v)}）拒发`)
    assert.ok(out.includes("criterion=type-invalid") && out.includes("type=invalid"), `非法形 #${i} 判据名 = type-invalid`)
    assert.ok(out.includes("there is no closest-match guessing and no silent fallback"), `非法形 #${i} Why 行逐字`)
    assert.equal(agent._engDesignTokens.size, 0, `非法形 #${i} 零 token`)
  }
  // 对照行：两个合法值照常受理（轨由顶层 type 定——静默降级已撤，正常面零回归）
  for (const [i, v] of ["code", "design"].entries()) {
    const agent = mkAgent(cwd)
    const args = v === "design" ? { type: "design", documents: ["docs/design/x.md"] } : { type: "code", paths: CODE_SCOPE }
    const out = String(await callTool(args, agent, `tp-ok${i}`))
    assert.ok(!out.startsWith(REFUSAL), `显式 type='${v}' 照常受理`)
    const ack = JSON.parse(out)
    assert.equal(ack.kind, "advisor", `显式 type='${v}' 返回 async ack`)
    assert.equal(agent._advisorRuns.get(ack.reviewId)?.reviewType, v, `轨 = ${v}`)
    cleanup(agent, out)
  }
})

// ─── T-AF13 / T-AF15：对象声明面（追加句 / 冲突对）────────────────────────────

test("T-AF13 对象声明追加行：object.type='design' ∧ 顶层缺 / 非法 ⇒ 同拒 + 追加句（零实例）", async () => {
  const cwd = mktmp()
  for (const [i, v] of [undefined, "foo"].entries()) {
    const agent = mkAgent(cwd)
    const out = await callTool({ type: v, object: { type: "design", target: "docs/design/x.md" }, documents: ["docs/design/x.md"] }, agent, `tp-oa${i}`)
    assert.ok(out.startsWith(REFUSAL), `对象声明形 #${i} 拒发`)
    assert.ok(out.includes(OBJECT_NOTE), `对象声明追加行在位（#${i}）`)
    assert.equal(agent._asyncAdvisors.size, 0, `对象声明形 #${i} 零池条目`)
  }
})

test("T-AF15 冲突对：顶层显式合法值 ≠ object.type 的另一合法值 ⇒ 拒（type-object-conflict + 两路指引）", async () => {
  const agent = mkAgent(mktmp())
  const out = await callTool({ type: "code", paths: CODE_SCOPE, object: { type: "design" } }, agent, "tp-conflict")
  assert.ok(out.startsWith(REFUSAL), "冲突对拒发")
  assert.ok(out.includes("criterion=type-object-conflict"), "判据名（§2.4 判定枚举闭合三值之一）")
  assert.ok(out.includes("[type=code · scope="), "标识行 type = 顶层实收值（未定轨）")
  assert.ok(out.includes('align them: set the top-level type to "design", or change the object.type declaration to "code".'), "指引两路逐字")
  assert.equal(out.includes(OBJECT_NOTE), false, "追加句不用于冲突分支（归位 = 未定轨两分支）")
  assert.equal(agent._advisorRefusals.has("tp-conflict"), true, "拒发登记")
  assert.equal(agent._asyncAdvisors.size, 0, "零池条目 / 零 token / 零 LLM")
  // 逆行对照（同一冲突对反向）：判据名不变、标识行 type 随顶层实收值
  const agent2 = mkAgent(mktmp())
  const out2 = await callTool({ type: "design", documents: ["docs/design/x.md"], object: { type: "code" } }, agent2, "tp-conflict2")
  assert.ok(out2.includes("criterion=type-object-conflict") && out2.includes("[type=design · scope="), "反向冲突对同拒")
})

test("T-AF4 一致形 / 窄读法照常：object.type 与顶层一致或为非合法值 ⇒ 照常受理（object 不选轨）", async () => {
  const cwd = mktmp()
  // 一致形（design 轨——实例登记 reviewType = design）
  const agent = mkAgent(cwd)
  const out = String(await callTool({ type: "design", documents: ["docs/design/x.md"], object: { type: "design", target: "docs/design/x.md" } }, agent, "tp-same"))
  assert.ok(!out.startsWith(REFUSAL), "一致形照常受理")
  const ack = JSON.parse(out)
  assert.equal(agent._advisorRuns.get(ack.reviewId)?.reviewType, "design", "走 design 轨")
  cleanup(agent, out)
  // 窄读法：object.type 为非合法值 ⇒ 不构成矛盾（顶层合法值照常）
  const agent2 = mkAgent(cwd)
  const out2 = String(await callTool({ type: "code", paths: CODE_SCOPE, object: { type: "foo" } }, agent2, "tp-narrow"))
  assert.ok(!out2.startsWith(REFUSAL), "非合法声明值不触发冲突（窄读法）")
  assert.equal(JSON.parse(out2).kind, "advisor", "照常受理（code 轨）")
  cleanup(agent2, out2)
})

// ─── T-AF14 / AC-10：调用面零残留（结构断言）─────────────────────────────────

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const TREES = ["thincoder-core", "thincoder-cli", "thincoder-vscode"]
// 针为拼接构造——本档自身（三树内 *.mjs）不得成为命中源。
const NEEDLES = {
  oldDefault: ["args.type", " || ", '"code"'].join(""),
  defaultTag: ["(", "default)"].join(""),
  oldPath: ["review-", "streak"].join(""),
  callSite: ["advisorTool", ".execute", "("].join(""),
}
function walkMjs(root, out = []) {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (["node_modules", ".git", "_archive", ".thincoder"].includes(e.name)) continue
    const p = join(root, e.name)
    if (e.isDirectory()) walkMjs(p, out)
    else if (e.name.endsWith(".mjs")) out.push(p)
  }
  return out
}

test("T-AF14 调用面零残留：旧缺省载体 / 声明面 default 句 / 旧事实面路径零命中 + 调用点逐处显式 type、零 object 声明", () => {
  const src = readFileSync(join(REPO, "thincoder-core/agent-tools/advisor.mjs"), "utf8")
  assert.equal(src.includes(NEEDLES.oldDefault), false, "旧缺省载体零命中（AC-10 ①）")
  assert.equal(src.includes(NEEDLES.defaultTag), false, "声明面 type default 句零命中（AC-10 ①）")
  assert.deepEqual(advisorTool.parameters.required, ["type"], "schema required=[type]（模型侧第一道提示）")
  const missingType = []
  const objectDecl = []
  const oldPathHits = []
  const allFiles = TREES.flatMap((t) => walkMjs(join(REPO, t)))
  // 调用点面 = 三树全量（含测试档——AC-10 ②③ 的 12 处）
  for (const f of allFiles) {
    const lines = readFileSync(f, "utf8").split("\n")
    lines.forEach((l, i) => {
      const where = `${f.replace(/\\/g, "/").split("/thincoder/")[1]}:${i + 1}`
      if (l.includes(NEEDLES.callSite)) {
        const win = lines.slice(i, i + 3).join("\n")
        if (!/[{,]\s*type\s*[:,}]/.test(win)) missingType.push(where)
        if (/\bobject\s*:/.test(win)) objectDecl.push(where)
      }
      // 旧事实面路径 = 源面扫（`test/` 除外——测试档对旧档名的沿革引用不属残留判据）
      if (!f.split(/[\\/]/).includes("test") && l.includes(NEEDLES.oldPath)) oldPathHits.push(where)
    })
  }
  assert.deepEqual(missingType, [], "工具调用点逐处显式 type（AC-10 ②——含测试档）")
  assert.deepEqual(objectDecl, [], "三树调用点零 object 声明（AC-10 ③——含测试档）")
  assert.deepEqual(oldPathHits, [], "旧事实面路径字面零命中（源面扫描——含注释面）")
})
