/**
 * core-hygiene.test.mjs — 核内结构机检（CORE-UNIFICATION T-C15 / T-C14 / N3 · S0a 起 · S1 补齐）。
 * 行为面：核内零产品侧 import · 零裸包名 import（N3 / N7）· 核内相对 import 可解析 ·
 * 核 `.mjs` 档位（≤300 软线 / ≤500 硬限——N8 / T-C14：超软线须带拆分计划）。
 *
 * 规则面（口径随 S1 收正——见批次档 §5）：
 *  - 说明符抽取先**去注释**（行注释 / 块注释 / 字符串外的散文引用）——S0a 版的裸正则把
 *    注释里的 `from "……"` 当 import 报（假阳性：`memory/schema.mjs` 的散文、`advisor.mjs`
 *    的 `../advisor.mjs` 指针注释等）⇒ 机检面精度收正（判据不变，仍报档与行）。
 *  - 档位：>500 = 硬红；>300 = 须在 `SOFT_LINE_REGISTRY` 登记（**未登记的新超线档 = 红**——
 *    防回潮）。已登记档的**拆分计划**属设计面（设计档 §2.5 行数列 = 落点），核内只登记读数。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * 超软线档登记表（`wc -l` 口径）——**逐字随迁**所致（S1 只做提取，**不重写**——
 * F3 / D-C2「零新写」；源档在两产品侧本就 >300）。拆分计划 = 设计档 §2.8.1 表（行数与拆分计划——设计者面）。
 * `memory/core.mjs` = TUI 假死批（2026-09-18）新增登记：本批改动为点状（await ×2 + 归一
 * 调用），拆分立场 = **本批不拆**（批次档 `2026-09-18-tui-freeze.md` §2.4「软线 300 状态与
 * 拆分立场」；结构债总账 = 设计档 `STRUCTURE-DEBT.md` §2 另批落笔）。
 * `agent-tools/escalate-async.mjs` = 上行通道批（2026-09-18）新增登记：W3 上行接线（1 行 + 注）
 * 使本档 300 → **302** 越线；本批为**纯接线**（不改变既有拆分结论）
 * ——拆分计划归父侧另案（设计档 `AGENT-LOOP-SUBAGENT.md` §6.27.6 ▸ 越线登记同源；
 * 该段未列名本档 ⇒ 读数登记于此）。
 * init-block 批（2026-09-18）登记面收正：**拆分已落地**——`session.mjs` 500 → **244** 与
 * `session-slots.mjs` 498 → **298** 双双回落 ≤300 ⇒ **移出登记**（设计档 `CORE-UNIFICATION.md`
 * §2.8.1 表第 2 行「消解条件 = 本批落地（兑现后本档移出 `SOFT_LINE_REGISTRY`）」）；
 * 同批新增登记 `process-probe.mjs`（**315**——探测束 API + 三态判据 + 有界同步例外单源）与
 * `session-lifecycle.mjs`（**305**——会话生命周期七函数外提产物）：两档读数 >300，拆分计划已
 * 登设计档 §2.8.1 表（第 10 / 11 行——fix 轮 3 补登，漂移已消解）。
 * 拆分产物 `session-slots-manifest.mjs`（264）≤300 ⇒ 不登记。
 * 渠道接入批（2026-09-20）新增登记**两条测试档**：`test/model-specs.test.mjs`（**414** 行——A-1..A-12：
 * 五新行逐字段 / 证据等级行注 / 转售面零回归 / 兼容层护栏 / 两族枚举行独立）与
 * `test/provider-merge.test.mjs`（**306** 行——B-1..B-6：D-14 off 补发 + 五 guard 零变面）：
 * 两档实施后越线（设计预估 ~305 / ~272，实读超出）⇒ 处置 = 批次档
 * `docs/batches/2026-09-20-channel-onboarding.md` §1.10-④ 预裁「**登记不拆档**（单档内聚）」；
 * 设计档 `CORE-UNIFICATION.md` §2.8.1 表行（拆分计划落点）= 已落（子表行 12 / 13，收口轮）。
 * 读数口径 = 末行终止后的行数（两档与 `wc -l` 同值：414 / 306；split 口径 415 / 307）。
 * STARTUP-LATENCY 批（2026-09-21）登记面收正：`traces/trace-store.mjs` 清理面外提
 * `traces/trace-cleanup.mjs` 后 303 → **299** ≤300 ⇒ **移出登记**（设计档 `docs/core/design/TRACES.md`
 * §6.4 模块落点——存续条件 = 本批落地）。
 * 批次档生命周期工具批（2026-09-21）登记**三档**：`agent-tools/batch.mjs`（**397**——KD-4 proactive
 * 处置已落：骨架/词表解析单源外提 `batch-skeleton.mjs`（94）+ 生命周期动作外提
 * `batch-lifecycle.mjs`（245），三档各 ≤300；主档实测 397 行——旧 `batch-segment.mjs`
 * 266 → 18 行过渡 shim）与 `test/batch.test.mjs`（**380**——新测试档，C1–C10+BR-18–26 用例表；预裁
 * 「**保留单档**」（既有/新用例 fixtures 共享，拆档 = 复制脚手架——批档 :89/:165-#8）；硬顶 500 内）。
 * 读数口径 = 末行终止后的行数（node 实测——`wc -l` 本机 cmd 乱码已弃用）。
 * 按用点解析批（2026-09-21 · `docs/batches/2026-09-21-manifest-resolution.md`）登记**三条测试档**
 * （本批用例面扩列后越线）：`test/manifest.test.mjs`（**479**——T43–T45 / T48 / T54 / T55：
 * 发现梯两表六格 / 归属形 / 单源结构 / `init:false` 歧义）· `test/setup-reminders.test.mjs`（**368**
 * ——T46 / T47：报明行四态逐字 + 状态选行）· `test/tool-seams-agent.test.mjs`（**305**——T38 补
 * 梯④/⑤ + T39/T40 拒翻夹具改歧义，父侧授权表外收正）。前两档拆分计划已登设计档
 * `docs/core/design/MANIFEST.md` §2.3 >300 注块（行 19 = 发现面用例组拆出 `manifest-discovery.test.mjs`；
 * 行 21 = 值变检测组 / 报明行组拆出邻档；触发条件 = 越 500 硬限，或下一次触碰该档的批）；
 * `test/tool-seams-agent.test.mjs` 设计档无对应行（父侧授权表外收正所致）——拆分方案 = 拒翻用例组
 * 随下次触碰该档的批拆出邻档（**待设计侧收正**，见批档 §5 报告）。
 */
const SOFT_LINE_REGISTRY = new Set([
  "agent/dispatch.mjs", "agent/helpers.mjs", "agent/setup.mjs", "agent.mjs",
  "agent-tools/advisor-async.mjs", "agent-tools/batch.mjs", "agent-tools/consult.mjs", "agent-tools/escalate-async.mjs",
  "agent-tools/read-history.mjs",
  "agent-tools/subagent-actions.mjs", "agent-tools/subagent-async.mjs",
  "agent-tools/subagent-scheduler.mjs", "agent-tools/subagent-spawn.mjs", "agent-tools/subagent.mjs",
  "config.mjs", "context.mjs", "git/checkpoint.mjs", "manifest.mjs", "memory/code-sync.mjs",
  "memory/core.mjs", "memory/docs.mjs",
  "memory/schema.mjs", "process-probe.mjs", "provider/core.mjs", "provider/responses.mjs",
  "session-lifecycle.mjs", "session-store.mjs", "test/batch.test.mjs", "test/manifest.test.mjs", "test/model-specs.test.mjs",
  "test/provider-merge.test.mjs", "test/setup-reminders.test.mjs", "test/tool-seams-agent.test.mjs",
  "tools/edit-diff.mjs", "tools/file.mjs", "tools/git.mjs",
  "tools/lsp.mjs", "tools/repomap.mjs", "tools/shared.mjs",
])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (name.endsWith(".mjs")) out.push(p)
  }
  return out
}

/** Strip block + line comments so prose mentioning `from "…"` is never read as an import. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

const specifiers = (src) => {
  const clean = stripComments(src)
  return [
    ...[...clean.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]),
    ...[...clean.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
  ]
}

test("core .mjs files import only node: builtins + core-relative paths (N3 / N7 / T-C15)", () => {
  const bad = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (spec.startsWith("node:") || spec.startsWith("./") || spec.startsWith("../")) continue
      bad.push(`${relative(ROOT, file)}: ${spec}`)
    }
  }
  assert.deepEqual(bad, [], `non-core import specifiers: ${bad.join(", ")}`)
})

test("every core-relative import resolves inside thincoder-core/", () => {
  const missing = []
  for (const file of walk(ROOT)) {
    for (const spec of specifiers(readFileSync(file, "utf8"))) {
      if (!spec.startsWith(".")) continue
      if (!existsSync(join(dirname(file), spec))) missing.push(`${relative(ROOT, file)} -> ${spec}`)
    }
  }
  assert.deepEqual(missing, [], `dangling relative imports: ${missing.join(", ")}`)
})

test("no core file reaches into a product tree — N3", () => {
  // ANY-depth `..` hop followed by a product name — the realistic form from thincoder-core/ is a
  // single hop up into a sibling product directory. Assembled from parts so this test's
  // own source never contains the scanned literal.
  const P = "thinc" + "oder" + "(?:-vscode)?"
  const productHop = new RegExp("(?:\\.\\.\\/)+" + P)
  const hits = []
  for (const file of walk(ROOT)) {
    if (productHop.test(readFileSync(file, "utf8"))) hits.push(relative(ROOT, file))
  }
  assert.deepEqual(hits, [])
})

test("core .mjs files: ≤500 hard cap, and every >300 file is registered (T-C14 / N8)", () => {
  const hard = []
  const unregistered = []
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file).replace(/\\/g, "/")
    const lines = readFileSync(file, "utf8").split("\n").length - 1 // wc -l semantics
    if (lines > 500) hard.push(`${rel}: ${lines}`)
    else if (lines > 300 && !SOFT_LINE_REGISTRY.has(rel)) unregistered.push(`${rel}: ${lines}`)
  }
  assert.deepEqual(hard, [], `>500 (hard cap): ${hard.join(", ")}`)
  assert.deepEqual(
    unregistered, [],
    `>300 without a registered split plan (design §2.5 行数列): ${unregistered.join(", ")}`,
  )
})

/**
 * D-CC22（#109）构造单点结构面（批档 §2.10 ① A-C6 双面形态，对称 VSC 侧 A-C9）：
 * 回声字段的构造**只存一处**（`model-specs.mjs` 的 `assistantToolCallMessage`）——两个核
 * 推入点（主循环 `agent.mjs` / advisor 镜像 `advisor/loop.mjs`）各档源文本**零
 * `reasoning_content:` 字面** ∧ 构造调用**恰 1 处**（只查字面在场，删掉整段不接线亦可满足
 * ⇒ 两面并列）；`config.mjs` 名表两面（导入 ∧ re-export）须含该名（两推入点均经 config
 * 门面取 spec —— 单一导入面）。
 */
test("single construction point for the reasoning echo field — D-CC22", () => {
  const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
  for (const rel of ["agent.mjs", "advisor/loop.mjs"]) {
    const src = read(rel)
    assert.equal((src.match(/reasoning_content:/g) ?? []).length, 0, `${rel}: 零 reasoning_content: 字面（字段构造只存单点）`)
    assert.equal((src.match(/assistantToolCallMessage\(/g) ?? []).length, 1, `${rel}: 构造调用恰 1 处`)
  }
  const cfg = read("config.mjs")
  assert.match(cfg, /import\s*{[^}]*\bassistantToolCallMessage\b[^}]*}\s*from\s*"\.\/model-specs\.mjs"/, "config.mjs 导入面含该名")
  assert.match(cfg, /export\s*{[^}]*\bassistantToolCallMessage\b[^}]*}/, "config.mjs re-export 面含该名")
})
