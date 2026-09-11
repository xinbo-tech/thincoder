/**
 * ledger.test.mjs — 台账机检用例（T67–T71 · T92–T96 · AC49——设计档 ENGINEERING-MODE.md §2.24.6 / §2.24.9 契约 · AC45–AC52 / AC75–AC79）。
 * 仓库面：两仓活台账全绿（新增 0 / 存量降报告）+ 归档档键控条目 + 双端锚 + 归属修订文本面。
 * 反证面：坏指针 / 计数不符 / 形态五例 / 活文件 `- [x]` / 非法触发 —— 必报红（防「永远绿的空转脚本」）。
 * 审计面：T94 待处置清单 + 老化（git 回填行龄）走 slow() 门控（fs / git 子进程）。
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3）：T95 旧口径句负向锚（七档）
 * → 收归 test/doc-consistency.test.mjs T76（防回潮族）；本档保留正向文本锚（新句/子串）。
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
const pr = (p) => join(REPO, p)
const ws = (p) => resolve(REPO, "..", p)
let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "ledger-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })
const mk = (rel, content) => { const abs = join(tmp, rel); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, content); return abs }
const mkTargets = () => [mk("docs/requirements/FOO.md", "# 需求\n\n## 1.13 台账\n"), mk("docs/batches/B.md", "# 批次\n\n## §2 任务\n")]
const runTmp = (opts = {}) => runCheck({ root: tmp, ledgers: ["docs/TODO.md"], baseline: new Set(), ...opts })
const runCli = (args, cwd = REPO) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" })
const code = (args) => main(args, { log: () => {} }) // 进程内退出码语义（真 spawn 由 T67/T68 覆盖）

test("T67 正常：两仓台账机检全绿（每档一行 OK / 退出码 0；缺仓跳过不报）", () => {
  assert.deepStrictEqual(runCheck({ root: REPO }).fresh.map((v) => v.msg), [], "新增违规 0（存量入基线降报告）")
  const r = runCli([])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal((r.stdout.match(/^OK: /gm) ?? []).length, 2, "每档一行 `OK: <档>`")
  mk("docs/TODO.md", "# t\n\n## 需求池（0 条）\n\n## 技术待办（0 条）\n")
  const skip = runCheck({ root: tmp }) // 对端仓缺失 → 该档跳过不报（降级不阻断）
  assert.equal(skip.checked, 1)
  assert.equal(skip.skipped.length, 1, "缺仓跳过不报（对称 T61 ④ 跨仓先例）")
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

test("T70 边界：形态违规五例（①②③④各报；⑤无标记组不判 ③；④入基线→降报告）", () => {
  mkTargets()
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
  assert.ok(dg.known.some((v) => v.kind === "L3④") && !dg.fresh.some((v) => v.kind === "L3④"), "④机外取值入基线 → 降报告不阻断")
})

test("T71 边界：存量降报告不阻断 + 扫描域互不侵入", () => {
  mk("docs/TODO.md", "# t\n\n## 需求池（2 条）\n\n- [ ] **甲**（待讨论）\n")
  const first = runTmp()
  assert.equal(first.fresh.length, 1, "计数不符为新增违规")
  const second = runTmp({ baseline: new Set([first.fresh[0].key]) })
  assert.deepStrictEqual(second.fresh, [], "存量（基线内）不阻断")
  assert.equal(second.known.length, 1, "存量降报告")
  assert.deepStrictEqual(SCAN_DIRS, ["docs/design", "docs/requirements", "docs/batches"], "宽度扫描域未扩（AC51）")
  assert.ok(!SCAN_DIRS.some((d) => d === "docs"), "台账档不在宽度域——两扫描域互不侵入")
  mk("docs/design/X.md", "# x\n\n- [ ] **假技术条**（无证据）· status=在途\n")
  assert.ok(!runTmp().fresh.some((v) => v.msg.includes("docs/design")), "台账检查只扫显式清单（不递归发现）")
})

test("T92 错误：活文件 `- [x]` 必报红（归档口径反证）；移出后绿（AC76/L3⑤）", () => {
  const live = (stale) => ["# t", "", "## 技术待办（1 条）", "", "- [ ] **在途条** → 证据 `src/a.mjs:1` · status=在途", ""]
    .concat(stale ? ["- [x] **已核销条**（未移出活文件）→ 证据 `src/b.mjs:2` · status=已核销", ""] : []).join("\n")
  mk("docs/TODO.md", live(true))
  const { fresh } = runTmp()
  assert.equal(fresh.filter((v) => v.kind === "L3⑤").length, 1, JSON.stringify(fresh.map((v) => v.msg)))
  assert.equal(code(["--root", tmp]), 1)
  mk("docs/TODO.md", live(false))
  assert.deepStrictEqual(runTmp().fresh, [], "移出归档档方向 → 绿（活文件零 `- [x]`）")
})

test("T93 错误：非法触发取值必报红；合法对照条绿；无 `触发=` 场不报红（AC77/L3⑥）", () => {
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

test("T95 边界：归属修订文本面（需求档 §1.13 + 两仓台账头部 + 4 人格档）", () => {
  const files = [pr("docs/requirements/ENGINEERING-MODE.md"), pr("docs/TODO.md"), ws("thincoder-vscode/docs/TODO.md"),
    pr("src/prompts/persona-eng-designer.md"), pr("docs/design/prompts/persona-eng-designer.md"),
    ws("thincoder-vscode/src/prompts/persona-eng-designer.md"), ws("thincoder-vscode/docs/design/prompts/persona-eng-designer.md")]
  for (const f of files) {
    const t = readFileSync(f, "utf8")
    assert.ok(t.includes("记录 + 状态推进 + 物理落笔"), f + "：新句在位")
    // 旧口径句负向锚 → 收归接收档 T76（防回潮族——七档同扫；扫① 2026-09-11）
  }
  for (const f of files.slice(3)) assert.ok(readFileSync(f, "utf8").includes("todo 状态推进"), f + "：AC25 子串保留")
})

test("AC49 正常：双端锚 L-A / L-B 固定子串在位（4 文件逐字）", () => {
  const files = [pr("src/prompts/discipline-engineering.md"), pr("docs/design/prompts/discipline-engineering.md"),
    ws("thincoder-vscode/src/prompts/discipline-engineering.md"), ws("thincoder-vscode/docs/design/prompts/discipline-engineering.md")]
  for (const f of files) {
    const t = readFileSync(f, "utf8")
    for (const s of ["同一铁律（指针化、不展开任务细节）", "锚的形态不同", "最小证据行（file:line + 症状）", "组标题声明的条数必须等于组内实条目数"]) {
      assert.ok(t.includes(s), f + "：锚子串缺失 " + s)
    }
  }
})

test("T96 正常：收拢执行面（归档档键控条目 + 活文件组计数 = 未决数）", () => {
  const cliArc = readFileSync(pr("docs/TODO-archive.md"), "utf8")
  const vscArc = readFileSync(ws("thincoder-vscode/docs/TODO-archive.md"), "utf8")
  for (const s of ["已全部完成", "两端不一致", "跨批依赖"]) assert.ok(cliArc.includes(s), "CLI 归档档键控条目：" + s)
  for (const s of ["eng(enter)", "Gitee open 巡检"]) assert.ok(vscArc.includes(s), "VSC 归档档键控条目：" + s)
  assert.deepStrictEqual(runCheck({ root: REPO }).fresh.map((v) => v.msg), [], "活文件 `- [x]` = 0 · 组计数 = 未决数（L2 绿）")
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
