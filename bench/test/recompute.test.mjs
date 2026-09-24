/**
 * test/recompute.test.mjs — 离线重算面用例（§5.10 `recompute.1–4` + §5.13 `recompute.5`）。
 * 夹具与 CLI 驱动在 `test/fixtures.mjs`（两档共用；夹具内联、不另立夹具档——§3）。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import { existsSync, readFileSync } from "node:fs"
import { basename, join } from "node:path"
import { FIXTURES, SANDBOX, assert, files, findFile, fixtureResult, readJson, runCli, test, writeFixture } from "./fixtures.mjs"

test("recompute.1：夹具 JSON + 当前价格重算 → 新报告对（<原标签>-recalc）；原档字节不变", async () => {
  const from = writeFixture("fx-base.json", fixtureResult({ label: "fx-base" }))
  const before = readFileSync(from, "utf8")
  const beforeFiles = files()
  const { code, out } = await runCli(["--recompute", "--from", from])
  assert.equal(code, 0, out)
  const pair = files().filter((f) => f.includes("fx-base-recalc"))
  assert.equal(pair.length, 2, `应落 md + json 两份：${files().join(",")}`)
  const json = readJson(findFile("fx-base-recalc.json"))
  assert.equal(json.label, "fx-base-recalc")
  assert.equal(json.recomputed.from, "fx-base.json", "重算产物记录来源（相对形态；不得含本地路径）")
  assert.equal(json.recomputed.from.includes(SANDBOX), false)
  assert.match(json.recomputed.at, /^\d{4}-\d{2}-\d{2}T/)
  // deepseek:deepseek-flash 高峰档 = 输入 2 / 输出 8（元/百万 token）⇒ 1000×2 + 100×8 = 2800 ⇒ ¥0.0028
  const caseOf = (id) => json.models[0].cases.find((c) => c.caseId === id)
  assert.equal(caseOf("reasoning.1").runs[0].calls[0].costCny, 0.0028)
  assert.equal(caseOf("reasoning.1").runs[0].metrics.cost.value, 0.0028)
  assert.equal(json.models[0].aggregate.costCny, 0.0168, "6 条 run 合计（被测成本面）")
  assert.equal(json.manual[0].metrics.cost.value, 0.00012, "人工 lane 成本按条单项列出")
  assert.equal(readFileSync(from, "utf8"), before, "原档不动（留档不可变）")
  assert.ok(beforeFiles.every((f) => files().includes(f)), "新产物不覆盖任何旧档")
  // 跨日重算：产物文件名 / 报告标题日期 / 附录指针必须同源（指针须指向实际产物）
  const old = fixtureResult({ label: "fx-oldday" })
  old.startedAt = "2026-09-20T10:00:00+08:00"
  old.finishedAt = "2026-09-20T10:05:00+08:00"
  const oldFrom = writeFixture("fx-oldday.json", old)
  const oldRun = await runCli(["--recompute", "--from", oldFrom])
  assert.equal(oldRun.code, 0, oldRun.out)
  const oldJson = findFile("fx-oldday-recalc.json")
  assert.ok(basename(oldJson).startsWith("2026-09-20-"), `重算产物沿用原档运行日（实得：${basename(oldJson)}）`)
  const oldMd = readFileSync(findFile("fx-oldday-recalc.md"), "utf8")
  assert.match(oldMd.split("\n")[0], /· 2026-09-20$/, "标题日期 = 原档运行日")
  const pointer = oldMd.match(/^- `bench\/results\/(\S+\.json)`/m)?.[1]
  assert.ok(pointer && existsSync(join(SANDBOX, pointer)), `附录指针须指向实际产物（指针：${pointer}）`)
})

test("recompute.2：夹具含 tokens:null 的 call → 该 run 成本 —、重算成功、warnings 保留", async () => {
  const warn = "usage 缺失：deepseek-flash（tokens/cost=null）"
  const from = writeFixture("fx-null.json", fixtureResult({ label: "fx-null", nullTokens: true, warnings: [warn] }))
  const { code, out } = await runCli(["--recompute", "--from", from])
  assert.equal(code, 0, out)
  const json = readJson(findFile("fx-null-recalc.json"))
  const r2 = json.models[0].cases.find((c) => c.caseId === "reasoning.2").runs[0]
  assert.equal(r2.metrics.cost, null, "无 usage ⇒ 成本 null（不按 0 计）")
  assert.equal(r2.calls[0].costCny, null)
  assert.equal(json.models[0].cases[0].runs[0].metrics.cost.value, 0.0028, "同档其余 run 照常记账")
  assert.ok(json.warnings.includes(warn), "原 warnings 保留")
  const md = readFileSync(findFile("fx-null-recalc.md"), "utf8")
  assert.ok(md.includes("—"), "缺失项以 `—` 呈现（不编码为 0）")
})

test("recompute.3：损坏 JSON / 缺 calls[].tokens → 退出码 1 + 明确报错 + 不落任何档", async () => {
  const broken = writeFixture("fx-broken.json", "{ not json ")
  const missingTokens = fixtureResult({ label: "fx-missing" })
  delete missingTokens.models[0].cases[0].runs[0].calls[0].tokens
  const p2 = writeFixture("fx-missing.json", missingTokens)
  const before = files()
  const r1 = await runCli(["--recompute", "--from", broken])
  assert.equal(r1.code, 1)
  assert.match(r1.out, /解析失败/)
  assert.deepEqual(files(), before, "损坏输入不得落档")
  const r2 = await runCli(["--recompute", "--from", p2])
  assert.equal(r2.code, 1)
  assert.match(r2.out, /缺 tokens 字段/)
  assert.deepEqual(files(), before, "形状不合 ⇒ 不得落档")
})

test("recompute.1b（§3 夹具落点）：改价后的 prices.json 夹具 ⇒ 成本列随新价变化（零调模型）", async () => {
  const from = writeFixture("fx-price.json", fixtureResult({ label: "fx-price" }))
  const r1 = await runCli(["--recompute", "--from", from])
  assert.equal(r1.code, 0, r1.out)
  const baseText = readFileSync(findFile("fx-price-recalc.json"), "utf8")
  const base = JSON.parse(baseText)
  assert.equal(base.models[0].cases[0].runs[0].calls[0].costCny, 0.0028, "仓内当前价表：输入 2 / 输出 8")
  // 改价后的 prices.json（峰值 2 倍：输入 4 / 输出 16 / 缓存 0.08）
  const changed = writeFixture("prices.changed.json", {
    asOf: "2026-09-24", currency: "CNY", unit: "元 / 百万 token", source: "fixture（改价）",
    entries: [{ match: "deepseek:deepseek-flash", cachedInput: 0.08, input: 4, output: 16 }],
  })
  process.env.BENCH_PRICES = changed
  let r2
  try { r2 = await runCli(["--recompute", "--from", from, "--label", "fx-price-newprices"]) } finally { delete process.env.BENCH_PRICES }
  assert.equal(r2.code, 0, r2.out)
  const updated = readJson(findFile("fx-price-newprices.json"))
  assert.equal(updated.models[0].cases[0].runs[0].calls[0].costCny, 0.0056, "成本列随新价变化（2×）")
  assert.equal(updated.models[0].aggregate.costCny, 0.0336)
  assert.equal(updated.prices.asOf, "2026-09-24", "重算产物记录新价表 asOf")
  assert.equal(updated.manual[0].metrics.cost.value, 0.00024, "人工 lane 单项成本同步新价")
  assert.equal(readFileSync(findFile("fx-price-recalc.json"), "utf8"), baseText, "改价重算不动原产物（留档不可变）")
})

test("recompute.4（AC-10）：毒化 globalThis.fetch 后重算全流程成功 ⇒ 零网络调用的机检判据", async () => {
  const from = writeFixture("fx-net.json", fixtureResult({ label: "fx-net" }))
  let code
  let out
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  try { ({ code, out } = await runCli(["--recompute", "--from", from])) } finally { globalThis.fetch = orig }
  assert.equal(code, 0, out)
  assert.equal(calls, 0, "零 API 调用（fetch 一次都不得发生）")
  assert.ok(files().some((f) => f.endsWith("fx-net-recalc.json")))
})

test("recompute.5（§5.13）：判官（逐位）/ 复核成本随新价重算；不进被测成本面", async () => {
  const from = writeFixture("fx-judge.json", fixtureResult({ label: "fx-judge" }))
  const r1 = await runCli(["--recompute", "--from", from])
  assert.equal(r1.code, 0, r1.out)
  const base = readJson(findFile("fx-judge-recalc.json"))
  // 判官 A（deepseek-flash）= 3 次尝试（judgedPass / disputed / unavailable——级内单发）逐位记账
  assert.equal(base.judge.judges[0].calls, 3)
  assert.equal(base.judge.judges[0].costCny, 0.00256)
  assert.equal(base.judge.judges[1].costCny, 0.012555, "B 位（deepseek-v4-pro：输入 9 / 输出 27）逐位记账")
  assert.equal(base.judge.arbiter.costCny, 0.00132, "仲裁 C 位独立记账（mimo:mimo-v2.6-pro：输入 3 / 输出 6）")
  assert.equal(base.judge.costCny, 0.016435, "判官成本合计 = A + B + C")
  assert.equal(base.judge.agreements, 1)
  assert.equal(base.judge.disagreements, 1)
  assert.equal(base.judge.arbitrations, 1)
  assert.equal(base.judge.unavailable, 1)
  assert.equal(base.review.calls, 2, "两处机械 fail 各一次复核")
  assert.equal(base.review.uphold, 1)
  assert.equal(base.review.overturn, 1)
  assert.equal(base.review.costCny, 0.00216, "复核沿 A 位价（300×2 + 60×8）/1e6 ×2")
  assert.equal(base.models[0].aggregate.judgeCostCny, 0.016435)
  assert.equal(base.models[0].aggregate.reviewCostCny, 0.00216)
  assert.equal(base.models[0].aggregate.overturns, 1)
  assert.equal(base.models[0].aggregate.costCny, 0.0168, "被测成本面不含判官 / 复核成本（AC-4）")
  assert.equal(base.review.calls, 2)
  // 改价（判官 A 位键 = 被测键，一并变）：逐位 / 复核成本随新价重算
  const changed = writeFixture("prices.judge.json", {
    asOf: "2026-09-24", currency: "CNY", unit: "元 / 百万 token", source: "fixture（判官改价）",
    entries: [
      { match: "deepseek:deepseek-flash", input: 4, output: 16 },
      { match: "deepseek:deepseek-v4-pro", input: 1, output: 2 },
      { match: "mimo:mimo-v2.6-pro", input: 2, output: 4 },
    ],
  })
  process.env.BENCH_PRICES = changed
  let r2
  try { r2 = await runCli(["--recompute", "--from", from, "--label", "fx-judge-newprices"]) } finally { delete process.env.BENCH_PRICES }
  assert.equal(r2.code, 0, r2.out)
  const updated = readJson(findFile("fx-judge-newprices.json"))
  assert.equal(updated.judge.judges[0].costCny, 0.00512, "逐位判官成本 ×2")
  assert.equal(updated.review.costCny, 0.00432, "复核成本 ×2")
  const bCalls = updated.models[0].cases.flatMap((c) => c.runs).flatMap((r) => r.judge?.judges ?? []).filter((j) => j.id === "B")
  assert.equal(bCalls.length, 3, "B 位账目在档（逐位不合并）")
  assert.equal(bCalls[0].calls[0].costCny, 0.00042, "新录价后 B 位成本可算（320×1 + 50×2）/1e6")
  assert.equal(updated.judge.judges[1].costCny, 0.00125, "B 位三次调用合计（0.00041 + 0.00042 ×2）")
  assert.equal(updated.judge.arbiter.costCny, 0.00088, "C 位随新价重算（330×2 + 55×4）/1e6")
  assert.equal(updated.judge.costCny, 0.00725, "合计 = A + B + C")
  assert.equal(updated.models[0].aggregate.costCny, 0.0336, "被测成本列独立于判官列")
  const src = readFileSync(from, "utf8")
  assert.equal(readJson(from).judge.judges[0].calls, 0, "原档的判官账目是裸值（聚合只在产物内产生）")
  assert.equal(src.includes("\"costCny\": 0.00512"), false, "重算不动原档（判官成本只落新产物）")
  assert.equal(FIXTURES.length > 0, true)
})
