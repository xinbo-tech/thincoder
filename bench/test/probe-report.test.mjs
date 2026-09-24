/**
 * test/probe-report.test.mjs — 探针报告面自检（§10.7 / §10.10 落档面 + 成本闸）。
 *
 * 覆盖：md 段清单与列集 / JSON 顶层与 runs 字段 / 同名拒写 / 标签前缀强制 / 脱敏两腿（绝对路径占位
 * 保数据 + 凭据命中拒写）/ `--max-cost` 到顶腿（skipped 入 runs[] + 聚合分母排除 + warning + 退出码 0）。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"

import { RUN_FIELDS } from "../probe/classify.mjs"
import { assertProbeLabel, normalizeSelfText, writeProbeReport } from "../probe/report.mjs"

const SANDBOX = mkdtempSync(join(tmpdir(), "probe-report-results-"))
process.env.BENCH_RESULTS_DIR = SANDBOX // 落档面走既有缝（不触 bench/results/）
after(() => rmSync(SANDBOX, { recursive: true, force: true }))

async function runProbeCli(args) {
  const lines = []
  const [log, err] = [console.log, console.error]
  console.log = (...a) => lines.push(a.map(String).join(" "))
  console.error = (...a) => lines.push(a.map(String).join(" "))
  try {
    const { main } = await import("../probe.mjs")
    return { code: await main(args), out: lines.join("\n") }
  } finally { console.log = log; console.error = err }
}

const files = () => readdirSync(SANDBOX)
const pairOf = (label) => {
  const md = files().filter((f) => f.endsWith(`-${label}.md`))
  const json = files().filter((f) => f.endsWith(`-${label}.json`))
  assert.equal(md.length, 1, `期待唯一 md 产物 *-${label}.md，实际：${files().join(", ")}`)
  assert.equal(json.length, 1, `期待唯一 json 产物 *-${label}.json`)
  return { md: join(SANDBOX, md[0]), json: join(SANDBOX, json[0]) }
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"))
const readText = (p) => readFileSync(p, "utf8")

test("AC-7：dry-run 报告对——md 段清单六段 + 逐夹具表列集 + JSON 顶层与 runs 字段", async () => {
  const label = `probe-report-${process.pid}`
  const r = await runProbeCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(r.code, 0, r.out)
  const { md, json } = pairOf(label)
  const text = readText(md)
  for (const sec of ["## 概览", "## 方法", "## 结果", "## 关键发现", "## 局限声明", "## 附录"]) {
    assert.ok(text.includes(sec), `md 缺段：${sec}`)
  }
  for (const fid of ["p1", "p2", "p3"]) assert.ok(text.includes(`### ${fid}`), `md 缺夹具表：${fid}`)
  assert.ok(text.includes("| 模型 | 上抛 | 首次上抛回合 | 落盘（目标件/总） | 终止形态 | 回合数 | 报告面 | 成本 |"), "md 结果表列集 = §10.7")
  assert.ok(text.includes("probeVersion"), "概览含版本")
  assert.ok(text.includes("dry-run 自检（读数 = 脚本化夹具，**非真实测量**）"), "自检产物在 md 自识别（非真实测量）")
  assert.ok(text.includes("--dry-run"), "复跑命令携 --dry-run（体例同 QA 面）")
  assert.ok(text.includes("promptsDigest") || text.includes("提示词摘要"), "概览含提示词摘要锚")
  assert.ok(text.includes("非门控"), "局限声明含非门控句")
  const data = readJson(json)
  assert.equal(data.kind, "conflict-probe")
  assert.equal(data.probeVersion, 1)
  assert.equal(data.label, label)
  assert.equal(typeof data.startedAt, "string")
  assert.equal(typeof data.finishedAt, "string")
  for (const k of ["models", "fixtures", "n", "maxTurns", "timeoutSec", "maxTokens", "sandboxDir", "promptsDigest"]) {
    assert.equal(k in data.run, true, `JSON run 缺键 ${k}`)
  }
  assert.equal(data.run.n, 1, "缺省重复次数 = 1")
  assert.equal(data.run.sandboxDir.startsWith("<sandbox>/"), true, "沙箱面 = <sandbox>/<基名> 占位")
  assert.equal(/[A-Za-z]:[\\/]/.test(JSON.stringify(data)), false, "结果 JSON 不得含盘符绝对路径")
  const m = data.models[0]
  for (const k of ["label", "provider", "model", "host", "temperature", "reasoningEffort", "reasoningEffortFrom", "runs", "aggregate"]) {
    assert.equal(k in m, true, `JSON models[] 缺键 ${k}`)
  }
  for (const k of ["asked", "n", "skipped", "firstAskTurnMedian", "spun", "landed", "costCny"]) {
    assert.equal(k in m.aggregate, true, `JSON aggregate 缺键 ${k}`)
  }
  assert.equal(m.aggregate.n, m.runs.filter((x) => x.terminal !== "skipped").length, "聚合分母 = 实跑数")
  for (const run of m.runs) {
    for (const k of RUN_FIELDS) assert.equal(k in run, true, `JSON runs[] 缺字段 ${k}`)
  }
  for (const k of ["slot", "model", "calls", "costCny", "verdicts"]) assert.equal(k in data.judge, true, `JSON judge 缺键 ${k}`)
  assert.equal(Array.isArray(data.warnings), true)
  // 判官三态在档（surfaced / buried / 失败 ⇒ null）
  const faces = m.runs.map((x) => x.reportFace)
  assert.equal(faces.includes("surfaced"), true, "夹具三态其一：surfaced")
  assert.equal(faces.includes("buried"), true, "夹具三态其二：buried")
  assert.equal(faces.includes(null), true, "夹具三态其三：失败 ⇒ reportFace = null")
  assert.ok(data.warnings.some((w) => w.includes("reportFace = null")), "失败腿 warning 入档（不阻断）")
  assert.ok(data.warnings.some((w) => w.includes("dry-run 自检")), "dry-run 身份明示（非真实测量）")
})

test("AC-7：同名拒写（留档不可静默覆盖）+ 标签前缀强制 + --models 必填", async () => {
  const label = `probe-dup-${process.pid}`
  const first = await runProbeCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(first.code, 0, first.out)
  const second = await runProbeCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label])
  assert.equal(second.code, 1, "同名 ⇒ 拒写（退出码 1）")
  assert.match(second.out, /同名产物已存在/, "拒写文案可读")
  const bad = await runProbeCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", "not-a-probe-label"])
  assert.equal(bad.code, 1)
  assert.match(bad.out, /必以 probe- 起/)
  const noModels = await runProbeCli(["--dry-run"])
  assert.equal(noModels.code, 1)
  assert.match(noModels.out, /--models 必填/)
  assert.equal(assertProbeLabel("probe-x"), "probe-x")
  assert.throws(() => assertProbeLabel("run"), /必以 probe- 起/)
})

test("AC-7：脱敏两腿——绝对路径占位（保数据 + warning 计数）/ 凭据命中拒写（fail-closed）", () => {
  // 腿一：沙箱根前缀 ⇒ <sandbox>；其余绝对路径 ⇒ <abs> + warning
  const root = "C:\\Users\\someone\\AppData\\Local\\Temp\\thincoder-probe-abc"
  const n1 = normalizeSelfText(`写入 ${root}/docs/a.md 与 /Users/other/b.md`, root)
  assert.equal(n1.text.includes("<sandbox>/docs/a.md"), true)
  assert.equal(n1.text.includes("与 <abs>"), true, "/Users 形态同样占位")
  assert.equal(n1.absCount, 1, "沙箱根之外的绝对路径计数")
  assert.equal(/[A-Za-z]:[\\/]/.test(n1.text), false, "占位后不含盘符路径")
  // 经落档面：自产文本含仓外绝对路径 ⇒ 占位 + warning（保数据——不因路径拒写）
  const result = {
    kind: "conflict-probe", probeVersion: 1, label: "probe-sanitize", startedAt: "2026-09-25T00:00:00+08:00", finishedAt: "2026-09-25T00:00:01+08:00",
    run: { models: "m", fixtures: ["p1"], n: 1, maxTurns: 40, timeoutSec: 600, maxTokens: 4096, sandboxDir: "<sandbox>/x", promptsDigest: "sha256:0" },
    models: [{ label: "m", provider: "p", model: "m", host: null, temperature: 0, reasoningEffort: null, reasoningEffortFrom: null,
      runs: [{ fixtureId: "p1", firstAskTurn: 1, askMessage: `见 ${root}/docs/b.md`, turnsUsed: 1, continuation: null, terminal: "asked", firstWriteTurn: 3, mutatorCalls: [{ turn: 3, tool: "write", path: `${root}/docs/c.md` }, { turn: 4, tool: "write", path: "D:\\teamcode\\elsewhere\\g.md" }], landedFiles: [], reportHead: "另见 D:\\teamcode\\elsewhere\\f.md（沙箱外）", reportLen: 30, reportFace: null, metrics: { wallMs: 1, calls: 1, tokens: { prompt: 1, cached: 0, completion: 1 }, cost: 0 }, behaviorClass: "escalated" }],
      aggregate: { asked: 1, n: 1, skipped: 0, firstAskTurnMedian: 1, spun: 0, landed: 0, costCny: 0 } }],
    judge: { slot: "A", model: "p:m", calls: 0, costCny: null, verdicts: { surfaced: 0, buried: 0, unclear: 0, failed: 0 } },
    warnings: [],
  }
  const written = writeProbeReport(result, { sandboxRoot: root })
  assert.equal(typeof written, "string")
  const data = readJson(pairOf("probe-sanitize").json)
  assert.equal(data.models[0].runs[0].askMessage.includes("<sandbox>/docs/b.md"), true, "沙箱根占位")
  assert.equal(data.models[0].runs[0].reportHead.includes("另见 <abs>"), true, "沙箱外绝对路径占位")
  assert.equal(data.models[0].runs[0].mutatorCalls[0].path, "<sandbox>/docs/c.md", "写工具入参沙箱内路径 ⇒ <sandbox> 占位")
  assert.equal(data.models[0].runs[0].mutatorCalls[1].path, "<abs>", "写工具入参沙箱外路径 ⇒ <abs> 占位（保数据）")
  assert.ok(data.warnings.some((w) => w.includes("<abs> 占位")), "绝对路径 warning 计数入档")
  // 腿二：凭据类命中 ⇒ 拒写（fail-closed——§2.8 断言面零改）
  const dirty = structuredClone(result)
  dirty.label = "probe-dirty"
  dirty.models[0].runs[0].askMessage = "用的是 sk-abcdefgh12345678 这把钥匙"
  assert.throws(() => writeProbeReport(dirty, { sandboxRoot: root }), /脱敏断言拒绝写入/, "凭据命中拒绝写入")
  assert.equal(files().some((f) => f.includes("probe-dirty")), false, "拒写 ⇒ 无产物落档")
})

test("AC-8：成本闸到顶 ⇒ 余面 skipped 入 runs[] + 聚合分母排除 + warning + 退出码 0", async () => {
  const label = `probe-gate-${process.pid}`
  const r = await runProbeCli(["--dry-run", "--models", "mimo-v2.6-flash", "--label", label, "--max-cost", "0.005"])
  assert.equal(r.code, 0, "成本闸 = 数据不是错误（退出码 0）")
  const data = readJson(pairOf(label).json)
  const runs = data.models[0].runs
  const skipped = runs.filter((x) => x.terminal === "skipped")
  assert.ok(skipped.length > 0, "到顶 ⇒ 余面 skipped 入 runs[]（读数可见）")
  assert.ok(skipped.length < runs.length, "到顶前已完成面照常实跑")
  for (const s of skipped) {
    assert.equal(s.behaviorClass, "skipped")
    assert.equal(s.turnsUsed, null)
    assert.equal(s.landedFiles.length, 0)
  }
  assert.equal(data.models[0].aggregate.skipped, skipped.length, "skipped 计数可见")
  assert.equal(data.models[0].aggregate.n, runs.length - skipped.length, "聚合分母排除 skipped（截断不漂移）")
  assert.ok(data.warnings.some((w) => w.includes("成本闸到顶")), "截断不静默（warning）")
  assert.ok(readText(pairOf(label).md).includes("成本闸截断"), "md 关键发现可见截断计数")
})
