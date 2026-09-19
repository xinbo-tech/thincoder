/**
 * zero-sync-exec.test.mjs — F-MI7 判据① 端侧半（init-block 批 2026-09-18 · 父侧裁定选项①）：
 * 端侧探测面两档零同步 exec 静态扫描。
 *
 * 判据（docs/core/design/MULTI-INSTANCE-COLLAB.md §3.1 判据条①——`:90` 端侧档面 · `:91` 域内零
 * 同步形态 · `:99` 本地探测副本零残留验收）：端侧 `session-slots.mjs` + `peer-instances.mjs` 零
 * `execSync` / `execFileSync` / `spawnSync`——探测单源 = 核 `process-probe.mjs`（域外豁免档），
 * 端侧只经束 API 消费（`probeOwnersAsync` / `batchAliveAsync` / `probeCmdlinesAsync`）。
 *
 * 形态 = 设计指定先例（`thincoder-core/test/tool-seams.test.mjs:289-299`）与同批评据① 核半
 * （`thincoder-core/test/process-probe.test.mjs` 判据① 条：核三档）同形——两半域不交（N3 门禁：
 * 核测档不得引用端侧路径 ⇒ 端半落本档）。
 *
 * 域完整性对账形态 = VSC 树同形先例 `test/settings-open-snapshots.test.mjs:163-185`（「调用链 = 扫描域」
 * ——`src/**` + `extension.mjs` 实扫引用者集合，deepEqual 对账）。
 *
 * 域边界：零域**只关域内两档**——域外同树档形态不受限（设置面 `settings.mjs` 异步 `execFile`；
 * 工具面 `shared.mjs` / `shell.mjs` 同步 taskkill），本档只取域外档作正证（防模式写空假绿）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"

/** 注释剥离（逐字同先例——判据只关代码面：注释里出现名字不算命中）。 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8")

test("零同步 exec 扫描（F-MI7 判据① · 端侧半）：slot / peer 两档零 child_process 直调", () => {
  // 零域（§3.1 条① 端侧两档）：域空 / 缺档即红（fail-closed——空域会让下述断言恒绿）
  const DOMAIN = ["src/extension/session-slots.mjs", "src/extension/peer-instances.mjs"]
  assert.equal(DOMAIN.length, 2, "端侧零域 = §3.1 条① 端侧两档（域空 ⇒ 恒绿假证）")
  for (const rel of DOMAIN) {
    assert.ok(existsSync(new URL(`../${rel}`, import.meta.url)), `零域档缺失（域须与 §3.1 条① 端侧两档一致）：${rel}`)
  }
  const CALL = /\b(?:exec|execFile|execSync|execFileSync|spawn|spawnSync)\s*\(/
  const SPEC = /["']node:child_process["']/
  // 判据模式 = 调用形态 ∪ 说明符形态（合成后源串与核半 / 先例逐字同式——先例 `tool-seams.test.mjs:293`）
  const DIRECT = new RegExp(`${CALL.source}|${SPEC.source}`)
  const hits = []
  for (const rel of DOMAIN) {
    if (DIRECT.test(stripComments(read(rel)))) hits.push(rel)
  }
  assert.deepEqual(hits, [], `域内档直调 child_process（应经核探测束 API——N-MI3）：${hits.join(", ")}`)

  // 正证：域外同树档确实承载 exec（证明扫描模式有效——防模式写空导致的假绿）。两支各用**独立**
  // 模式分别证一支——只以 DIRECT 作正控会被 CALL / SPEC 任一单独满足 ⇒ 被依赖的另一支仍未被证明
  const settingsSrc = stripComments(read("src/extension/settings.mjs"))
  assert.ok(CALL.test(settingsSrc), "正控：调用形态在位（settings.mjs 异步 `execFile(`——防调用支路写空）")
  assert.ok(SPEC.test(settingsSrc), "正控：说明符形态在位（`node:child_process` 引用——防说明符支路写空）")

  // 域完整性 fail-closed（承先例「调用链 = 扫描域」）：端侧**探测面消费者**清单钉死——新增 / 移除
  // 消费者 ⇒ 本断言红 ⇒ 零域与判据须显式复核（每回合路径零同步 exec 的域不得静默漂移）
  const refs = []
  const walk = (rel) => {
    for (const e of readdirSync(new URL(`../${rel}`, import.meta.url), { withFileTypes: true })) {
      const p = `${rel}/${e.name}`
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith(".mjs")) refs.push(p)
    }
  }
  walk("src")
  refs.push("extension.mjs")
  // 消费者判据 = 剥注释后代码面出现核束说明符（`from` 静态 / 副效应 / 动态 `import()` / 再导出 全形命中）
  const SEAM_REF = "@thincoder/core/process-probe.mjs"
  const consumers = refs.filter((rel) => stripComments(read(rel)).includes(SEAM_REF)).sort()
  assert.deepEqual(
    consumers,
    ["src/extension/peer-instances.mjs", "src/extension/session-io.mjs", "src/extension/session-slots.mjs"],
    "端侧探测面消费者变更 ⇒ 零同步 exec 扫描域须复核（增删即须显式过目）",
  )
})
