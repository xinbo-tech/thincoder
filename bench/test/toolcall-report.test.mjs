/**
 * test/toolcall-report.test.mjs — 工具调用探针报告面自检（§11.8 报告对 + §11.11 落档面 / 成本闸 · 零网络）。
 *
 * 覆盖：`--dry-run` 产物断言（md 段清单 + JSON 顶层字段 + 混淆矩阵 + 逐例 × 变体矩阵行数 = 用例数 × 变体数）·
 * 落档面（标签前缀强制 / 同名拒写 / 脱敏）· 成本闸（假成本到顶 ⇒ 余面 `skipped` 入 `runs[]` + 分母排除 +
 * warning + 退出码 0）。手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"

import { CASES } from "../toolcall/cases.mjs"
import { assertToolcallLabel, writeToolcallReport } from "../toolcall/report.mjs"
import { buildVariants, payloadDigest } from "../toolcall/variants.mjs"
import { scanLeaks } from "../lib/sanitize.mjs"
import { main } from "../toolcall.mjs"

const SANDBOX = mkdtempSync(join(tmpdir(), "toolcall-report-results-"))
process.env.BENCH_RESULTS_DIR = SANDBOX // 落档面走既有缝（不触 bench/results/）
after(() => rmSync(SANDBOX, { recursive: true, force: true }))

async function runCli(args) {
  const lines = []
  const [log, err] = [console.log, console.error]
  console.log = (...a) => lines.push(a.map(String).join(" "))
  console.error = (...a) => lines.push(a.map(String).join(" "))
  try { return { code: await main(args), out: lines.join("\n") } } finally { console.log = log; console.error = err }
}

const readJson = (name) => JSON.parse(readFileSync(join(SANDBOX, name), "utf8"))
const readText = (name) => readFileSync(join(SANDBOX, name), "utf8")
/** 产物档名（**从盘面派生**——不写日期、不取时钟：日期段由运行起点决定，测试不做墙钟采样）。 */
const artifact = (label, ext) => readdirSync(SANDBOX).find((f) => f.includes(label) && f.endsWith(ext))
const artifactPath = (label, ext) => join(SANDBOX, artifact(label, ext))
const RUN_FIELDS = ["n", "terminal", "called", "firstTool", "toolNames", "args", "parseOk", "schemaErrors", "hit", "legal", "semOk", "finishReason", "textHead", "metrics"]
const AXIS_FIELDS = ["n", "hit", "legal", "semOk", "perfect", "noCall", "multiCall", "parseFail", "offPayload", "error", "skipped"]

test("AC-5：--dry-run 产物断言——md 段清单 + JSON 顶层字段 + 混淆矩阵 + 逐例 × 变体矩阵行数 = 用例数 × 变体数", async () => {
  const label = `toolcall-artifact-${process.pid}`
  const r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--label", label])
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /报告对已落档：/, "控制台回显落档路径")
  const base = artifactPath(label, ".json")
  const md = readText(artifact(label, ".md"))
  const data = readJson(artifact(label, ".json"))
  assert.equal(base.endsWith(`${label}.json`), true, "产物名 = <日期>-<标签>.json")
  for (const seg of ["## 概览", "## 方法", "## 结果", "## 关键发现", "## 局限声明", "## 附录"]) {
    assert.equal(md.includes(seg), true, `md 缺段「${seg}」`)
  }
  assert.equal(data.kind, "toolcall-probe")
  assert.equal(data.toolProbeVersion, 1)
  assert.equal(data.label, label)
  for (const k of ["kind", "toolProbeVersion", "label", "startedAt", "finishedAt", "run", "models", "warnings"]) {
    assert.equal(k in data, true, `JSON 顶层缺键 ${k}`)
  }
  for (const k of ["models", "cases", "variants", "n", "maxTokens", "timeoutSec", "systemBase", "casesDigest", "payloadDigest"]) {
    assert.equal(k in data.run, true, `JSON run 缺键 ${k}`)
  }
  assert.deepEqual(data.run.cases, CASES.map((c) => c.id), "run.cases = 用例选择序")
  assert.deepEqual(data.run.variants, ["V0", "V1", "V2"])
  assert.equal(data.run.n, 1)
  assert.match(data.run.casesDigest, /^sha256:[0-9a-f]{16}$/)
  assert.match(data.run.payloadDigest, /^sha256:[0-9a-f]{16}$/)
  assert.equal(md.includes(data.run.casesDigest) && md.includes(data.run.payloadDigest), true, "概览含双摘要锚")
  assert.deepEqual(scanLeaks(JSON.stringify(data)), [], "结果 JSON 无脱敏命中（既有谓词单源——盘符路径 / 凭据 / 本机用户名）")
  assert.deepEqual(scanLeaks(md), [], "报告 md 无脱敏命中")
  const m = data.models[0]
  for (const k of ["label", "provider", "model", "host", "temperature", "reasoningEffort", "reasoningEffortFrom", "variants"]) {
    assert.equal(k in m, true, `JSON models[] 缺键 ${k}`)
  }
  assert.equal(m.variants.length, 3)
  for (const v of m.variants) {
    for (const k of ["id", "payload", "cases", "axis", "confusion"]) assert.equal(k in v, true, `JSON variants[] 缺键 ${k}`)
    for (const k of ["tools", "chars", "bytes", "descriptionChars"]) assert.equal(k in v.payload, true, `JSON payload 缺键 ${k}`)
    for (const k of AXIS_FIELDS) assert.equal(k in v.axis, true, `JSON 聚合块缺键 ${k}`)
    assert.equal(v.cases.length, 14, "逐例 × 变体面 = 14 格")
    for (const c of v.cases) {
      assert.equal("caseId" in c && Array.isArray(c.runs) && "axis" in c, true)
      for (const run of c.runs) {
        for (const k of RUN_FIELDS) assert.equal(k in run, true, `JSON runs[] 缺字段 ${k}`)
        for (const k of ["wallMs", "tokens", "cost"]) assert.equal(k in run.metrics, true, `JSON metrics 缺键 ${k}`)
        assert.equal(typeof run.textHead !== "string" || run.textHead.length <= 300, true, "textHead 截断口径 ≤300")
      }
    }
    assert.equal(v.confusion.length > 0, true, "混淆矩阵非空")
    for (const x of v.confusion) {
      assert.equal("expected" in x && "actual" in x && typeof x.count === "number", true, "混淆矩阵三元组形态")
    }
    assert.equal(v.confusion.reduce((s, x) => s + x.count, 0), v.cases.flatMap((c) => c.runs).length, "矩阵格合计 = run 数（有效 run 面）")
  }
  assert.equal(md.includes("### 混淆矩阵"), true, "md 含混淆矩阵小节")
  assert.match(md, /已知偏差指针/, "方法段含偏差指针（§11.8 md 骨架）")
  const rows = md.split("\n").filter((line) => /^\| tool\.\d+ \| V\d \|/.test(line))
  assert.equal(rows.length, CASES.length * 3, "逐例 × 变体矩阵行数 = 用例数 × 变体数（42）")
  assert.equal(data.warnings.some((w) => String(w).includes("dry-run 自检")), true, "dry-run 自检 warning 在档")
  // payloadDigest 锚**独立于 `--variants` 选集**（§11.8 = V0 载荷摘要——V0 未选时亦须反映真实载荷）
  const v0 = buildVariants({ model: "mimo-v2.6-flash" }).find((x) => x.id === "V0")
  const expectDigest = payloadDigest([{ key: "mimo:mimo-v2.6-flash", variant: v0 }])
  assert.equal(data.run.payloadDigest, expectDigest, "选集含 V0 ⇒ 摘要 = V0 载荷摘要")
  const noV0 = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--variants", "V1,V2", "--label", `toolcall-nov0-${process.pid}`])
  assert.equal(noV0.code, 0, noV0.out)
  const alt = readJson(artifact(`toolcall-nov0-${process.pid}`, ".json"))
  assert.equal(alt.run.payloadDigest, expectDigest, "V0 未选 ⇒ 摘要仍 = V0 载荷摘要（非空输入常量哈希）")
  assert.deepEqual(alt.models[0].variants.map((x) => x.id), ["V1", "V2"])
})

test("落档面：标签前缀强制 / 同名拒写 / 脱敏（writePair 断言——fail-closed）", async () => {
  assert.equal(assertToolcallLabel("toolcall-baseline"), "toolcall-baseline")
  assert.throws(() => assertToolcallLabel("baseline"), /必以 toolcall- 起/)
  assert.throws(() => assertToolcallLabel(""), /必以 toolcall- 起/)
  const r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--label", `toolcall-dup-${process.pid}`])
  assert.equal(r.code, 0, r.out)
  const again = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--label", `toolcall-dup-${process.pid}`])
  assert.equal(again.code, 1, "同名拒写 ⇒ 退出码 1")
  assert.match(again.out, /同名产物已存在/, "同名拒写不静默")
  const bad = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--label", `baseline-${process.pid}`])
  assert.equal(bad.code, 1, "标签前缀非 toolcall- ⇒ 退出码 1")
  assert.match(bad.out, /必以 toolcall- 起/)
  // 脱敏：凭据命中 ⇒ 拒写（JSON / md 同一断言面）
  const dirty = readJson(artifact(`toolcall-dup-${process.pid}`, ".json"))
  dirty.label = `toolcall-dirty-${process.pid}`
  dirty.run.systemBase = "用的是 sk-abcdefgh12345678 这把钥匙"
  assert.throws(() => writeToolcallReport(dirty), /脱敏断言拒绝写入/)
})

test("成本闸：假成本到顶 ⇒ 余面 skipped 入 runs[] + 分母排除 + warning + 退出码 0", async () => {
  const label = `toolcall-gate-${process.pid}`
  const r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--max-cost", "0.02", "--label", label])
  assert.equal(r.code, 0, r.out)
  assert.match(r.out, /成本闸截断/, "控制台逐 run 行可见截断")
  const data = readJson(artifact(label, ".json"))
  const all = data.models.flatMap((m) => m.variants.flatMap((v) => v.cases.flatMap((c) => c.runs)))
  assert.equal(all.length, 14 * 3, "余面仍入 runs[]（读数可见——不静默）")
  const skipped = all.filter((x) => x.terminal === "skipped")
  assert.equal(skipped.length > 0, true, "到顶后余面 skipped")
  for (const x of skipped) {
    assert.equal(x.called, null)
    assert.equal(x.hit, null)
    assert.equal(x.legal, null)
    assert.equal(x.metrics.tokens, null)
    assert.equal(x.metrics.cost, null)
  }
  const v = data.models[0].variants[0]
  const live = v.cases.flatMap((c) => c.runs).filter((x) => x.terminal !== "skipped" && x.terminal !== "error")
  assert.equal(v.axis.n, live.length, "分母排除 skipped")
  assert.equal(v.axis.skipped, v.cases.flatMap((c) => c.runs).filter((x) => x.terminal === "skipped").length, "skipped 单列计数")
  assert.equal(data.warnings.some((w) => String(w).includes("成本闸到顶")), true, "截断 warning 在档")
  // 全跳过极端（闸 = 0）
  const allSkip = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--max-cost", "0", "--label", `toolcall-gate0-${process.pid}`])
  assert.equal(allSkip.code, 0, allSkip.out)
  const zero = readJson(artifact(`toolcall-gate0-${process.pid}`, ".json"))
  for (const m of zero.models) {
    for (const vv of m.variants) assert.equal(vv.axis.n, 0, "全截断 ⇒ 分母 0")
  }
})
