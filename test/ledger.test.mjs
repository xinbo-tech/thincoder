/**
 * ledger.test.mjs — 台账机检用例（T67–T71 · T92–T96 · T-LS1–T-LS5 · T-LS13–T-LS15 · T-LS42——设计档 ENGINEERING-MODE.md §2.24.6 / §2.24.9 契约 · AC45–AC52 / AC75–AC79；L4② 收紧面 = LEDGER-SELF-CONTAINED 批 §10 · AC-LS34–AC-LS35）。
 * 仓库面：本仓活档 + 归档档全绿（违规 0 · 基线必须保持为空——非空即 FAIL，fail-closed）。
 * 反证面：坏指针 / 计数不符 / 形态五例 / 活文件 `- [x]` / 非法触发 / **跨仓证据与跨仓指针（L4——本仓可解析闸）** —— 必报红（防「永远绿的空转脚本」）。
 * 审计面：T94 待处置清单 + 老化（git 回填行龄）走 slow() 门控（fs / git 子进程）。
 * 归册（2026-09-12 收尾轮 9）：仓库面 T67 同归册（全仓扫描 + 真命令 spawn——快层 skip、test:full 照跑）。
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3）：旧口径句负向锚（七档）→ 收归防回潮族
 * （接收档已随 2026-09-12 散文锚退役批退役）；本档归属修订 / 双端字符串锚 / 归档键控三面同批退役（保号于批次档）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync, execFileSync } from "node:child_process"
import { slow } from "./slow.mjs"
import { runCheck, collectPending, main } from "../scripts/check-ledger.mjs"
import { SCAN_DIRS } from "../scripts/check-doc-width.mjs"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CLI = join(REPO, "scripts", "check-ledger.mjs")
let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "ledger-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })
const mk = (rel, content) => { const abs = join(tmp, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); return abs }
const mkTargets = () => [mk("docs/requirements/FOO.md", "# 需求\n\n## 1.13 台账\n"), mk("docs/batches/B.md", "# 批次\n\n## §2 任务\n")]
const runTmp = (opts = {}) => runCheck({ root: tmp, ledgers: ["docs/TODO.md"], baseline: new Set(), ...opts })
const runCli = (args, cwd = REPO) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" })
const code = (args) => main(args, { log: () => {} }) // 进程内退出码语义（真 spawn 由 T67/T68 覆盖）

slow("T67 正常：本仓台账机检全绿（每档一行 OK / 退出码 0；缺仓跳过不报）", () => {
  const repoRun = runCheck({ root: REPO })
  assert.deepStrictEqual(repoRun.fresh.map((v) => v.msg), [], "违规 0（基线必须保持为空）")
  assert.deepStrictEqual(repoRun.baseline, [], "本仓基线为空（非空即 FAIL——入基线 = 例外 = 违规）")
  const r = runCli([])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal((r.stdout.match(/^OK: /gm) ?? []).length, 2, "两档各一行 `OK: <档>`（L4/R1——默认 = 本仓活档 + 归档档；不扫对端）")
  mk("docs/TODO.md", "# t\n\n## 需求池（0 条）\n\n## 技术待办（0 条）\n")
  const skip = runCheck({ root: tmp, ledgers: ["docs/TODO.md", "docs/NOPE.md", "../thincoder-vscode/docs/TODO.md"] }) // 缺档 / 跨仓默认项不存在 → 跳过不报（降级不阻断）
  assert.equal(skip.checked, 1)
  assert.equal(skip.skipped.length, 2, "缺档跳过不报（降级不阻断）")
  assert.deepStrictEqual(skip.fresh, [])
})

test("T68 错误：坏指针必报红（L1 逐行形态 + 退出码 1——反证非空转）", () => {
  mkTargets()
  mk("docs/TODO.md", ["# t", "", "## 技术待办（2 条）", "",
    "- [ ] **坏档** → 证据 `NOSUCH-DOC.md` §1 · status=在途",
    "- [ ] **坏节号** → `docs/requirements/FOO.md` §99 · 证据 `src/a.mjs:1` · status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const l1 = fresh.filter((v) => v.kind === "L1")
  assert.equal(l1.length, 2, JSON.stringify(fresh.map((v) => v.msg)))
  const form = new RegExp("^" + basename(tmp) + "/docs/TODO\\.md:\\d+ \\[L1\\] .+ — 期望 .+ · 实得 (unknown-doc|no-section)")
  assert.ok(l1.every((v) => form.test(v.msg)), "输出形态 `<档>:<行号> [L1] <症状> — 期望 … · 实得 …`")
  assert.ok(l1.some((v) => v.msg.includes("unknown-doc")) && l1.some((v) => v.msg.includes("no-section")))
  assert.equal(code(["--root", tmp]), 1, "退出码 1（main 返回值 = 进程退出码——真 spawn 由 T67 覆盖）")
})

test("T69 错误：组计数不符必报红（D3——声明 5 ≠ 实得 3）", () => {
  mk("docs/TODO.md", "# t\n\n## 需求池（5 条）\n\n- [ ] **甲**（待讨论）\n- [ ] **乙**（待讨论）\n- [ ] **丙**（待讨论）\n")
  const { fresh } = runTmp()
  const l2 = fresh.filter((v) => v.kind === "L2")
  assert.equal(l2.length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.match(l2[0].msg, /\[L2\] 组计数不符（需求池（5 条）） — 期望 声明 5 条 == 组内未决条目数 · 实得 3 条/)
  assert.equal(code(["--root", tmp]), 1, "退出码 1")
})

test("T70 边界：形态违规五例（①②③④各报；⑤无标记组不判 ③；④不再入基线豁免）", () => {
  mkTargets()
  mk("src/a.mjs", "// 证据夹具\n") // L4②：证据路径须本仓可解析（新增闸）
  mk("docs/TODO.md", ["# t", "", "## 需求池（3 条）", "",
    "- [ ] **续行条** → 需求 `docs/requirements/FOO.md` §1.13 · 任务书 `docs/batches/B.md` §2 · status=在途",
    "  细节续行（不该有）",
    "- [ ] **混入的技术项**：只有证据 → 证据 `src/a.mjs:1` · status=在途",
    "- [ ] **机外状态条** → 需求 `docs/requirements/FOO.md` §1.13 · 任务书 `docs/batches/B.md` §2 · status=登记", "",
    "## 技术待办（1 条）", "", "- [ ] **缺证据条**（症状：无 file:line）· status=在途", "",
    "## 其他（1 条）", "", "- [ ] **无标记组条目**（锚形态杂）· status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const kinds = fresh.map((v) => v.kind)
  for (const k of ["L3①", "L3②", "L3③", "L3④"]) assert.ok(kinds.includes(k), k + " 未报：" + JSON.stringify(fresh.map((v) => v.msg)))
  assert.ok(!fresh.some((v) => v.key.includes("无标记组条目")), "⑤无标记组不判 L3③")
  const key = fresh.find((v) => v.kind === "L3④").key
  const dg = runTmp({ baseline: new Set([key]) })
  assert.ok(dg.fresh.some((v) => v.kind === "L3④"), "④机外取值不再豁免（基线不得再设——违规照报）")
  assert.deepStrictEqual(dg.baseline, [key], "非空基线 = FAIL 面（入基线 = 例外 = 违规）")
  assert.equal(code(["--root", tmp]), 1, "非空基线 ⇒ 退出码 1（fail-closed）")
})

test("T71 边界：基线不得再设（非空即 FAIL）+ 扫描域互不侵入", () => {
  mk("docs/TODO.md", "# t\n\n## 需求池（2 条）\n\n- [ ] **甲**（待讨论）\n")
  const first = runTmp()
  assert.equal(first.fresh.length, 1, "计数不符为违规")
  const second = runTmp({ baseline: new Set([first.fresh[0].key]) })
  assert.equal(second.fresh.length, 1, "基线不再分流——违规照报（不再降报告）")
  assert.deepStrictEqual(second.baseline, [first.fresh[0].key], "非空基线 = FAIL 面")
  assert.equal(code(["--root", tmp]), 1, "非空基线 ⇒ 退出码 1（fail-closed）")
  assert.deepStrictEqual(SCAN_DIRS, ["docs/design", "docs/requirements", "docs/batches"], "宽度扫描域未扩（AC51）")
  assert.ok(!SCAN_DIRS.some((d) => d === "docs"), "台账档不在宽度域——两扫描域互不侵入")
  mk("docs/design/X.md", "# x\n\n- [ ] **假技术条**（无证据）· status=在途\n")
  assert.ok(!runTmp().fresh.some((v) => v.msg.includes("docs/design")), "台账检查只扫显式清单（不递归发现）")
})

test("T92 错误：活文件 `- [x]` 必报红（归档口径反证）；移出后绿（AC76/L3⑤）", () => {
  const live = (stale) => ["# t", "", "## 技术待办（1 条）", "", "- [ ] **在途条** → 证据 `src/a.mjs:1` · status=在途", ""]
    .concat(stale ? ["- [x] **已核销条**（未移出活文件）→ 证据 `src/b.mjs:2` · status=已核销", ""] : []).join("\n")
  mk("src/a.mjs", "// 证据夹具\n"); mk("src/b.mjs", "// 证据夹具\n") // L4②：证据路径须本仓可解析（新增闸）
  mk("docs/TODO.md", live(true))
  const { fresh } = runTmp()
  assert.equal(fresh.filter((v) => v.kind === "L3⑤").length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.equal(code(["--root", tmp]), 1)
  mk("docs/TODO.md", live(false))
  assert.deepStrictEqual(runTmp().fresh, [], "移出归档档方向 → 绿（活文件零 `- [x]`）")
})

test("T93 错误：非法触发取值必报红；合法对照条绿；无 `触发=` 场不报红（AC77/L3⑥）", () => {
  mk("src/a.mjs", "// 证据夹具\n") // L4②：证据路径须本仓可解析（新增闸）
  mk("docs/TODO.md", ["# t", "", "## 技术待办（3 条）", "",
    "- [ ] **非法触发条** → 证据 `src/a.mjs:1` · status=在途 · 触发=随便",
    "- [ ] **合法触发条** → 证据 `src/a.mjs:2` · status=在途 · 触发=归批（第 8 批）",
    "- [ ] **无触发条** → 证据 `src/a.mjs:3` · status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const six = fresh.filter((v) => v.kind === "L3⑥")
  assert.equal(six.length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.ok(six[0].key.includes("非法触发条"), "只判非法条（对照条 / 无触发条绿）")
  assert.match(six[0].msg, /— 期望 ∈ \{归批 \/ 条件 \/ 认账不排期\} · 实得 随便/)
  assert.equal(code(["--root", tmp]), 1)
})

test("T96 正常：收拢执行面（归档档键控条目 + 活文件组计数 = 未决数）", () => {
  assert.deepStrictEqual(runCheck({ root: REPO }).fresh.map((v) => v.msg), [], "活文件 `- [x]` = 0 · 组计数 = 未决数（L2 绿）")
})

// ── L4 本仓可解析（LEDGER-SELF-CONTAINED 批——T-LS1–T-LS5 / AC-LS1–AC-LS4）──────────────────
test("T-LS1 正常：本仓指针全解析 → 零 [L4]、退出码 0", () => {
  mkTargets()
  mk("docs/TODO.md", ["# t", "", "## 需求池（1 条）", "",
    "- [ ] **甲** → 需求 `docs/requirements/FOO.md` §1.13 · 任务书 `docs/batches/B.md` §2 · status=待设计", ""].join("\n"))
  const { fresh } = runTmp()
  assert.equal(fresh.filter((v) => v.kind === "L4").length, 0, JSON.stringify(fresh.map((v) => v.msg)))
  assert.equal(code(["--root", tmp]), 0, "退出码 0")
})

test("T-LS2 错误：跨仓证据路径必报 [L4] + 退出码 1（事故形态反证）", () => {
  mk("docs/TODO.md", ["# t", "", "## 技术待办（1 条）", "",
    "- [ ] **乙** → 证据 `../thincoder-vscode/src/x.mjs:10` · status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const l4 = fresh.filter((v) => v.kind === "L4")
  assert.equal(l4.length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.match(l4[0].msg, /\[L4\] 证据路径本仓不可解析/)
  assert.equal(code(["--root", tmp]), 1, "退出码 1（fail-closed）")
})

test("T-LS3 错误：跨仓指针不以对端可解析放行（本仓基根解析失败必报 [L4]）", () => {
  mk("thincoder/docs/requirements/AGENT-LOOP.md", "# A\n\n## 1 x\n") // 本仓同名档在，但无 §9
  mk("thincoder/docs/batches/B.md", "# B\n\n## §2 任务\n")
  mk("thincoder-vscode/docs/requirements/AGENT-LOOP.md", "# A\n\n## 9 x\n") // 对端仓有且存在——不得据此放行
  mk("thincoder/docs/TODO.md", ["# t", "", "## 需求池（1 条）", "",
    "- [ ] **丙** → 需求 `docs/requirements/AGENT-LOOP.md` §9 · 任务书 `docs/batches/B.md` §2 · status=待设计", ""].join("\n"))
  const repo = join(tmp, "thincoder")
  const { fresh } = runCheck({ root: repo, ledgers: ["docs/TODO.md"], baseline: new Set() })
  const l4 = fresh.filter((v) => v.kind === "L4")
  assert.equal(l4.length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.match(l4[0].msg, /本仓无该节/)
  assert.equal(main(["--root", repo], { log: () => {} }), 1, "退出码 1")
})

test("T-LS4 边界：零假阳（散文提及 + 「名称（仓别）§N」规范形态不入判据）", () => {
  mkTargets()
  mk("docs/TODO.md", ["# t", "", "## 需求池（2 条）", "",
    "- [ ] **甲** → 需求 `docs/requirements/FOO.md` §1.13 · 任务书 `docs/batches/B.md` §2 · status=待设计",
    "- [ ] **乙**（与对端同名档对应——多实现面纪律；对端 `WEBVIEW（VSC 仓）§5` 为规范形态）· status=待讨论", ""].join("\n"))
  const { fresh } = runTmp()
  assert.equal(fresh.filter((v) => v.kind === "L4").length, 0, JSON.stringify(fresh.map((v) => v.msg)))
})

test("T-LS5 边界：L4 不再入基线（非空基线 ⇒ FAIL；违规照报不阻断豁免）", () => {
  mk("docs/TODO.md", "# t\n\n## 技术待办（1 条）\n\n- [ ] **丙** → 证据 `src/nope.mjs:3` · status=在途\n")
  const first = runTmp()
  const key = first.fresh.find((v) => v.kind === "L4")?.key
  assert.ok(key, "L4 违规为阻断面（反证非空转）：" + JSON.stringify(first.fresh.map((v) => v.msg)))
  const second = runTmp({ baseline: new Set([key]) })
  assert.ok(second.fresh.some((v) => v.kind === "L4"), "基线不再分流——L4 照报")
  assert.deepStrictEqual(second.baseline, [key], "非空基线 = FAIL 面")
  assert.equal(code(["--root", tmp]), 1, "退出码 1（fail-closed）")
})

test("T-LS13 正常/错误：默认 = 本仓两档（活档 + 归档档）；归档免 L3⑤、闭环条目仍判 L4", () => {
  mk("docs/TODO.md", "# t\n\n## 需求池（0 条）\n\n## 技术待办（0 条）\n")
  mk("src/a.mjs", "// 证据夹具\n")
  mk("docs/TODO-archive.md", "# a\n\n- [x] **已核销条** → 证据 `src/a.mjs:1`\n")
  const two = runCheck({ root: tmp, baseline: new Set() })
  assert.equal(two.checked, 2, "默认扫两档（本仓活档 + 归档档）")
  assert.ok(two.perFile[1].file.endsWith("docs/TODO-archive.md"), two.perFile.map((f) => f.file).join(","))
  assert.deepStrictEqual(two.fresh.map((v) => v.msg), [], "归档 `- [x]` 不判 L3⑤；闭环证据本仓可解析 → 零违规")
  mk("docs/TODO-archive.md", "# a\n\n- [x] **跨仓条** → 证据 `../thincoder-vscode/src/x.mjs:1`\n")
  const bad = runCheck({ root: tmp, baseline: new Set() })
  assert.equal(bad.fresh.filter((v) => v.kind === "L4").length, 1, JSON.stringify(bad.fresh.map((v) => v.msg)))
  assert.equal(code(["--root", tmp]), 1, "退出码 1（fail-closed）")
})

test("T-LS14 反证：非空基线 ⇒ FAIL + 固定句（入基线 = 例外 = 违规）；清空 ⇒ 绿", () => {
  mk("docs/TODO.md", "# t\n\n## 需求池（0 条）\n\n## 技术待办（0 条）\n")
  const bfile = mk("test/fixtures/ledger-baseline.json", JSON.stringify({ entries: ["L3④|x|y"] }))
  const out = []
  assert.equal(main(["--root", tmp], { log: (s) => out.push(s) }), 1, "非空基线 ⇒ 退出码 1（fail-closed）")
  assert.ok(out.join("\n").includes("FAIL(基线)"), "FAIL(基线) 面在位")
  assert.ok(out.join("\n").includes("**本基线必须保持为空**"), "固定句在位")
  writeFileSync(bfile, JSON.stringify({ entries: [] }))
  assert.equal(code(["--root", tmp]), 0, "清空 ⇒ 退出码 0")
})

test("T-LS15 正常/错误：L4② 判据精化（省略/陈旧前缀仓内定位；文档行坐标；多义仍红）", () => {
  mk("src/tui/key-handler.mjs", "// 唯一\n") // 省略目录前缀：basename 唯一 ⇒ 通过
  mk("src/agent-tools/async-settle.mjs", "// 迁移后路径\n") // 陈旧目录前缀：basename 定位 ⇒ 通过
  mk("docs/design/SESSION.md", "# S\n\n## 1 x\n") // 文档行坐标：同名 .md ≥1 ⇒ 通过
  mk("src/dup/a.mjs", "// 1\n"); mk("src/dup2/a.mjs", "// 2\n") // 多义 basename ⇒ 仍红
  mk("docs/TODO.md", ["# t", "", "## 技术待办（4 条）", "",
    "- [ ] **省略前缀** → 证据 `key-handler.mjs:107` · status=在途",
    "- [ ] **陈旧前缀** → 证据 `src/agent/async-settle.mjs:138` · status=在途",
    "- [ ] **文档行坐标** → 证据 `SESSION.md :524` · status=在途",
    "- [ ] **多义 basename** → 证据 `a.mjs:1` · status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const l4 = fresh.filter((v) => v.kind === "L4")
  assert.equal(l4.length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.ok(l4[0].msg.includes("仓内同名 2 份（多义）"), "仅多义者报红：" + l4[0].msg)
  assert.equal(code(["--root", tmp]), 1)
})

test("T-LS42 错误：L4② 收紧（外仓前缀 ⇒ 必报；省略 / 陈旧前缀零回归；全匹配逐处判）", () => {
  mk("src/x.mjs", "// 唯一 basename（假阴面「外仓前缀 + 仓内唯一 basename」的仓内同名面）\n")
  mk("src/agent-tools/async-settle.mjs", "// 陈旧前缀面（首段现存）\n")
  mk("docs/TODO.md", ["# t", "", "## 技术待办（4 条）", "",
    "- [ ] **外仓前缀** → 证据 `pkg/src/x.mjs:10` · status=在途",
    "- [ ] **省略前缀对照** → 证据 `x.mjs:1` · status=在途",
    "- [ ] **陈旧前缀对照** → 证据 `src/agent/async-settle.mjs:138` · status=在途",
    "- [ ] **双证据条** → 证据 `x.mjs:1` · `other/x.mjs:11` · status=在途", ""].join("\n"))
  const { fresh } = runTmp()
  const l4 = fresh.filter((v) => v.kind === "L4")
  assert.equal(l4.length, 2, JSON.stringify(fresh.map((v) => v.msg)))
  assert.ok(l4.every((v) => v.msg.includes("跨仓形态（外仓前缀）")), "①③ 均报「外仓前缀」：" + JSON.stringify(l4.map((v) => v.msg)))
  assert.ok(l4.some((v) => v.key.endsWith("|pkg/src/x.mjs:10")), "① 假阴面必报（旧 basename 回退会漏）")
  assert.ok(l4.some((v) => v.key.endsWith("|other/x.mjs:11")), "③ 全匹配逐处判（次处跨仓——首匹配会漏）")
  assert.ok(!l4.some((v) => v.key.endsWith("|x.mjs:1")), "② 省略前缀对照条零报")
  assert.ok(!l4.some((v) => v.key.includes("async-settle.mjs")), "② 陈旧前缀对照条零报")
  assert.equal(code(["--root", tmp]), 1, "退出码 1（fail-closed）")
})

// T94 慢层（fs / git 子进程）：夹具 git 回填行龄——超龄条 commit 日期钉常量 2000-01-01（零壁钟依赖）。
slow("T94 边界：审计模式——待处置清单 + 老化标记 + 只读（AC78）", () => {
  const abs = mk("docs/TODO.md", "# t\n\n## 技术待办（2 条）\n\n- [ ] **超龄条**（无触发）→ 证据 `src/a.mjs:1`\n")
  const git = (args, env = {}) => execFileSync("git", args, { cwd: tmp, stdio: "ignore", env: { ...process.env, ...env } })
  git(["init", "-q"]); git(["config", "user.email", "t@example.com"]); git(["config", "user.name", "t"])
  git(["add", "-A"])
  git(["commit", "-qm", "old"], { GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z" })
  writeFileSync(abs, readFileSync(abs, "utf8") + "- [ ] **新鲜条**（无触发）→ 证据 `src/b.mjs:2`\n")
  const before = readFileSync(abs)
  const r = runCli(["--audit", "--root", tmp])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const lines = r.stdout.split("\n")
  const aged = lines.find((l) => l.includes("超龄条"))
  const fresh = lines.find((l) => l.includes("新鲜条"))
  assert.ok(r.stdout.includes("待处置清单"), "输出「待处置清单」标题")
  assert.ok(aged && fresh, "无触发条目两条均列（逐条 <档>:<行号>）")
  assert.match(aged, /【老化】/, "超龄者（commit 2000-01-01）标「老化」")
  assert.ok(!fresh.includes("老化"), "未超龄者不标「老化」")
  assert.ok(before.equals(readFileSync(abs)), "运行前后文件字节不变（报告只读）")
  assert.equal(collectPending(abs, { days: 30, ageOf: () => 1 }).filter((x) => x.aged).length, 0, "注入行龄 1 天 → 不老化")
})
