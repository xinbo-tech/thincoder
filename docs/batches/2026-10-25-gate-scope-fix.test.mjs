/**
 * 2026-10-25-gate-scope-fix.test.mjs — 批内单测件（批档 = `docs/batches/2026-10-25-gate-scope-fix.md` §2）：
 * 机检门**范围单集化**——`close` / `status(已收口)` 面只判本批笔域集（父侧触达账 ∪ 本批提交 diff），
 * 删「他批在途」整套（工作树扫描 ∥ `foreign` 分域 ∥ 该回执行）。
 * 权威 = `docs/core/design/DOC-DISCIPLINE.md` §3.20「结构兜底」的「② 的范围」；验收 = A-DD31 ③ ⑥。
 *
 * 复跑（cwd = 仓根）：`node --test docs/batches/2026-10-25-gate-scope-fix.test.mjs`
 * 生命周期：随批档留存（不进 `test/` 收集面——收口即删）。
 *
 * 用例集：DD-92 / DD-93 / DD-94 / DD-95 / DD-98 / DD-99 / DD-119 / DD-120（范围与拒不拒收口）
 * ＋ R1–R3（A-DD31 ⑥ 的既有拒因族回归——本档是唯一载体：身份门 / path 门 / text 校验 / 骨架保护 /
 * 死占位 / 状态行不可解析 / §6 非空 / 凭证剥除 / 冻结，串逐字、序不变、门未跑）。
 *
 * 夹具：每例独立临时项目根（`PROJECT-MANIFEST.json` + 六段批档 §2/§3/§4/§6 有内容——close 链门前置）；
 * DD-99 / DD-119 / DD-120 用真 git 仓（`git init` + 两三次提交——提交 diff 腿要有真 sha 才能跑）。
 * 台账库目录移到临时域（`_setLedgerDirForTest`——close 收口后的重锚不落真实用户目录）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const { batchTool } = await import("../../thincoder-core/agent-tools/batch.mjs")
const { _setLedgerDirForTest, _resetLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const BATCH_REL = "docs/batches/fixture.md"
const CLEAN_REL = "docs/notes/clean.md"
const DIRTY_REL = "docs/notes/dirty.md"
const OUT_REL = "docs/notes/out-of-range.md" // 工作树内、范围外（不在触达账 ∧ 不在提交 diff）

const CLEAN = "# 干净档\n\n无指针。\n"
const DIRTY = "# 脏档\n\n见 `docs/notes/missing-page.md`。\n" // 恰一条 锚·档缺

const ledgerDir = mkdtempSync(join(tmpdir(), "gsf-ledgerdir-"))
_setLedgerDirForTest(ledgerDir)

const projects = []

/** 六段批档全文（`sha` ⇒ §1 落 `批起 sha = <sha>` 记入行；无 ⇒ DD-119 的「取不到基」支）。 */
const record = (sha = null) => [
  "# 夹具批 · 范围单集化",
  "",
  "> 编制：夹具 · 2026-10-25 · 来源 = 单测夹具。",
  "> 台账 = #1（夹具）。前情 = 无（独立批）。",
  "",
  "## §1 讨论（主 agent）",
  "**状态行**：🔄 进行中",
  "",
  "夹具讨论。",
  ...(sha ? ["", `**批起 sha = ${sha}**`] : []),
  "",
  "## §2 批次任务与设计（eng-designer）",
  "**状态行**：设计完成",
  "",
  "夹具任务。",
  "",
  "## §3 设计评审（评审子代理）",
  "夹具评审。",
  "",
  "## §4 用户批准（主 agent）",
  "夹具批准。",
  "",
  "## §5 实施记录（eng-coder）",
  "夹具实施。",
  "",
  "## §6 验证与收口（父代理）",
  "夹具收口。",
  "",
].join("\n")

/** 夹具项目根（manifest + 批档骨架；`notes` = 要预落的 `.md` 相对路径 → 内容）。 */
function makeProject(tag, notes = {}) {
  const root = mkdtempSync(join(tmpdir(), `gsf-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "docs/notes"), { recursive: true })
  writeFileSync(join(root, BATCH_REL), record())
  for (const [rel, text] of Object.entries(notes)) writeFileSync(join(root, rel), text)
  return root
}

/** git 夹具：提交一次 → 取基 sha → 批档 §1 补记入行 → 再提交（批档自身由 selfKey 过滤，不入判）。 */
function gitWithBaseSha(root) {
  git(root, "init", "-q")
  commit(root, "base")
  const sha = rev(root)
  writeFileSync(join(root, BATCH_REL), record(sha))
  commit(root, "record base sha")
  return sha
}

const git = (cwd, ...argv) => execFileSync("git", [
  "-C", cwd, "-c", "user.email=fixture@example.test", "-c", "user.name=fixture",
  "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...argv,
], { encoding: "utf8" })
const commit = (cwd, message) => { git(cwd, "add", "-A"); git(cwd, "commit", "-q", "-m", message) }
const rev = (cwd) => git(cwd, "rev-parse", "HEAD").trim()

const parentCtx = (root, touched) => ({ depth: 0, agent: { cwd: root, _touchedFiles: touched, config: { agent: { engineering: true } } } })
const subCtx = (root, role, touched) => ({ depth: 1, agent: { cwd: root, _role: role, _touchedFiles: touched, config: { agent: { engineering: true } } } })
/** 评审实例：工具以 `review: true` 绑定，ctx 无 depth（`batchTool` 的评审形）。 */
const reviewCtx = (root, touched) => ({ agent: { cwd: root, _touchedFiles: touched, config: { agent: { engineering: true } } } })

const bound = batchTool(BATCH_REL)
const reviewBound = batchTool(BATCH_REL, { review: true })
const depth0 = batchTool(null)

/** 前置断言：夹具批档 §1 仍在「进行中」（拒收口 = 档字节不变）。 */
const statusLineOf = (root) => readFileSync(join(root, BATCH_REL), "utf8").split("\n").find((l) => l.startsWith("**状态行**："))

after(() => {
  _resetLedgerDirForTest()
  for (const p of projects) rmSync(p, { recursive: true, force: true })
  rmSync(ledgerDir, { recursive: true, force: true })
})

test("DD-93 错误 · 写者触达档含悬空指针 ⇒ append §2 拒写；串含 REFUSED + 命中行；档字节不变", async () => {
  const root = makeProject("dd93", { [DIRTY_REL]: DIRTY })
  const before = readFileSync(join(root, BATCH_REL), "utf8")
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§2", text: "夹具段写入。" }, subCtx(root, "eng-designer", [join(root, DIRTY_REL)])),
    (e) => {
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/, `拒串应携 verdict 首行：${e.message}`)
      assert.match(e.message, /✗ 锚·档缺 docs\/notes\/dirty\.md:\d+/, `拒串应逐条给命中行：${e.message}`)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "拒写 ⇒ 档字节与调用前逐字相同")
})

test("DD-94 错误 · 本批笔域集有命中 ⇒ close ∥ status(已收口) 同拒；§1 状态行仍「进行中」", async () => {
  const root = makeProject("dd94", { [DIRTY_REL]: DIRTY })
  const before = readFileSync(join(root, BATCH_REL), "utf8")
  const ctx = parentCtx(root, [join(root, DIRTY_REL)])

  await assert.rejects(
    () => depth0.execute({ action: "close", path: BATCH_REL }, ctx),
    (e) => {
      assert.match(e.message, /文档机检门拒收口/)
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/)
      assert.doesNotMatch(e.message, /他批在途/, "单集：拒串不再有分域报面")
      return true
    },
  )
  await assert.rejects(
    () => depth0.execute({ action: "status", path: BATCH_REL, value: "已收口" }, ctx),
    (e) => {
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/)
      return true
    },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), before, "两路拒收口 ⇒ §1 状态行字节不变")
  assert.match(statusLineOf(root), /进行中/, "§1 状态行仍「进行中」")
})

test("DD-98 边界 · 评审身份 append §3 不触门（触达账造命中也放行）· 已收口档 append 走冻结拒因", async () => {
  // ① 评审身份：§3 不检——即使触达账里有命中档，门也不跑、回执无 gate 行
  const root = makeProject("dd98a", { [DIRTY_REL]: DIRTY })
  const out = await reviewBound.execute({ action: "append", segment: "§3", text: "**评审发现**：夹具一条。" }, reviewCtx(root, [join(root, DIRTY_REL)]))
  assert.match(out, /appended \d+ characters to §3/, `§3 应照写：${out}`)
  assert.doesNotMatch(out, /\[doc-check gate\]/, `评审身份不触门：回执无 gate 行——${out}`)

  // ② 冻结拒因：先收口（清夹具），再 append ⇒ 冻结串（门未跑）
  const frozen = makeProject("dd98b", { [CLEAN_REL]: CLEAN })
  await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(frozen, [join(frozen, CLEAN_REL)]))
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "夹具段写入。" }, subCtx(frozen, "eng-coder", [join(frozen, DIRTY_REL)])),
    (e) => {
      assert.match(e.message, /已收口档不回改/, `冻结拒因逐字：${e.message}`)
      assert.doesNotMatch(e.message, /DOC-CHECK GATE/, "冻结拒因先于机检门 ⇒ 门未跑")
      return true
    },
  )
})

test("DD-99 边界 · 工作树内范围外档 ⇒ 不入判、收口放行、回执零该档行；笔域集内命中照拒", async () => {
  // ① 范围外脏档（未提交 ⇒ 不在提交 diff；也不在触达账）——收口放行且回执零该档行
  const root = makeProject("dd99a", { [CLEAN_REL]: CLEAN })
  gitWithBaseSha(root)
  writeFileSync(join(root, OUT_REL), DIRTY) // 工作树内、两腿都不含它
  const passed = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_REL)]))
  assert.match(passed, /DOC-CHECK GATE: PASS · 范围 1 档/, `范围 = 触达账 1 档：${passed}`)
  assert.doesNotMatch(passed, /out-of-range/, "范围外的档不入报面（回执零该档行）")

  // ② 同夹具：笔域集内一档命中 ⇒ 拒；拒串只点名笔域集内那档
  const root2 = makeProject("dd99b", { [CLEAN_REL]: CLEAN, [DIRTY_REL]: DIRTY })
  gitWithBaseSha(root2)
  writeFileSync(join(root2, OUT_REL), DIRTY)
  await assert.rejects(
    () => depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root2, [join(root2, DIRTY_REL)])),
    (e) => {
      // 触达账里那档在盘（脏）⇒ 入判并计入 K；范围外那档零行
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/, e.message)
      assert.match(e.message, /docs\/notes\/dirty\.md:\d+/, e.message)
      assert.doesNotMatch(e.message, /out-of-range/, "范围外档不入报面")
      return true
    },
  )
})

test("DD-119 边界 · 无 批起 sha 记入行 ⇒ 只认触达账 + 「基 sha 未定」明示；补记入行后该行消失", async () => {
  // ① 现盘批档常态（无记入行）
  const root = makeProject("dd119a", { [CLEAN_REL]: CLEAN })
  const noSha = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_REL)]))
  assert.match(noSha, /\[doc-check gate\] DOC-CHECK GATE: PASS · 范围 1 档/, noSha)
  assert.match(noSha, /基 sha 未定——本批笔域集只认触达账/, `取不到基 ⇒ 回执明示、不静默：${noSha}`)

  // ② 同一夹具内容 + 记入行 ⇒ 该明示行消失，且提交 diff 腿并入范围（1 触达 + 1 提交 = 2 档）
  const withSha = makeProject("dd119b", { [CLEAN_REL]: CLEAN })
  gitWithBaseSha(withSha)
  writeFileSync(join(withSha, "docs/notes/committed.md"), CLEAN)
  commit(withSha, "add committed doc")
  const sha = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(withSha, [join(withSha, CLEAN_REL)]))
  assert.doesNotMatch(sha, /基 sha 未定/, `记入行在盘 ⇒ 该明示行消失：${sha}`)
  assert.match(sha, /DOC-CHECK GATE: PASS · 范围 2 档/, `范围 = 触达账 ∪ 提交 diff：${sha}`)
})

test("DD-120 边界 · 档只在提交 diff 内（不在触达账）且含悬空指针 ⇒ 入判、计入 K、收口拒", async () => {
  const root = makeProject("dd120", { [CLEAN_REL]: CLEAN })
  gitWithBaseSha(root)
  writeFileSync(join(root, "docs/notes/committed.md"), CLEAN)
  commit(root, "add committed doc")
  writeFileSync(join(root, DIRTY_REL), DIRTY) // 只在 git diff <批起 sha> HEAD 内
  commit(root, "add dirty doc in diff")

  await assert.rejects(
    () => depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, [join(root, CLEAN_REL)])),
    (e) => {
      assert.match(e.message, /DOC-CHECK GATE: REFUSED（命中 1 条）/, e.message)
      assert.match(e.message, /✗ 锚·档缺 docs\/notes\/dirty\.md:\d+/, `命中行点名该档（sha 腿有正例）：${e.message}`)
      return true
    },
  )
  assert.match(statusLineOf(root), /进行中/, "拒收口 ⇒ §1 状态行字节不变")
})

test("DD-92 边界 · 范围 0 档 ⇒ PASS（0 档）+ 范围 0 档 照实行，仍放行", async () => {
  const root = makeProject("dd92")
  const out = await depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(root, []))
  assert.match(out, /DOC-CHECK GATE: PASS（0 档） · 范围 0 档/, `空范围不静默当通过：${out}`)
  assert.match(statusLineOf(root), /已收口/, "范围 0 档不是故障：收口照常落盘")
})

test("DD-95 边界 · status 值非冻结（设计完成）⇒ 不跑门、照写、回执无 gate 行", async () => {
  const root = makeProject("dd95", { [DIRTY_REL]: DIRTY })
  const out = await bound.execute({ action: "status", segment: "§2", value: "设计完成" }, subCtx(root, "eng-designer", [join(root, DIRTY_REL)]))
  assert.match(out, /§2 status line updated to "设计完成"/, `非冻结值照写：${out}`)
  assert.doesNotMatch(out, /\[doc-check gate\]/, `非冻结值不挂门 ⇒ 回执逐字旧形：${out}`)
  assert.match(readFileSync(join(root, BATCH_REL), "utf8"), /\*\*状态行\*\*：设计完成/, "状态行已落盘")
})

test("R1 既有拒因·身份门：create / close 仅 depth-0、无写权身份 append 整拒（串逐字、门未跑）", async () => {
  const root = makeProject("r1")
  const sub = subCtx(root, "eng-coder", [])
  await assert.rejects(
    () => bound.execute({ action: "create", path: "docs/batches/new.md", topic: "夹具", source: "夹具" }, sub),
    (e) => { assert.match(e.message, /^batch: create is main-agent-only — /); return true },
  )
  await assert.rejects(
    () => bound.execute({ action: "close", path: BATCH_REL }, sub),
    (e) => { assert.match(e.message, /^batch: close is main-agent-only — /); return true },
  )
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "夹具段写入。" }, subCtx(root, "explore", [])),
    (e) => { assert.match(e.message, /^batch_segment: no segment is writable by this caller — /); return true },
  )
})

test("R2 既有拒因·path 门 / text 校验 / 骨架保护：串逐字、先于机检门、零落盘", async () => {
  const root = makeProject("r2")
  const sub = subCtx(root, "eng-coder", [])
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", path: BATCH_REL, text: "夹具段写入。" }, sub),
    (e) => { assert.match(e.message, /^batch: path is a depth-0-only parameter \(D-BR21\)/); return true },
  )
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: 123 }, sub),
    (e) => { assert.match(e.message, /^batch_segment: text must be a string/); return true },
  )
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "x".repeat(20001) }, sub),
    (e) => { assert.match(e.message, /^batch_segment: text is 20001 characters — the limit is 20000 per call/); return true },
  )
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "夹具段写入。\n## §2 注入" }, sub),
    (e) => { assert.match(e.message, /^batch_segment: the text contains a section header line matching/); return true },
  )
  assert.equal(readFileSync(join(root, BATCH_REL), "utf8"), record(), "四拒皆不落盘")
})

test("R3 既有拒因·死占位 / 状态行不可解析 / §6 非空 / 凭证剥除：串逐字、门未跑", async () => {
  const ph = makeProject("r3a")
  writeFileSync(join(ph, BATCH_REL), record().replace("> 台账 = #1（夹具）。", "> 台账 = #<编号>（夹具）。"))
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "夹具段写入。" }, subCtx(ph, "eng-coder", [])),
    (e) => { assert.match(e.message, /^batch: 骨架死占位残留 — the batch record's header still carries skeleton placeholders/); return true },
  )

  const noStatus = makeProject("r3b")
  writeFileSync(join(noStatus, BATCH_REL), record().replace("**状态行**：🔄 进行中\n\n", ""))
  await assert.rejects(
    () => bound.execute({ action: "append", segment: "§5", text: "夹具段写入。" }, subCtx(noStatus, "eng-coder", [])),
    (e) => { assert.match(e.message, /^batch_segment: 状态行不可解析或缺失 /); return true },
  )

  const six = makeProject("r3c")
  writeFileSync(join(six, BATCH_REL), record().replace("夹具收口。\n", ""))
  await assert.rejects(
    () => depth0.execute({ action: "close", path: BATCH_REL }, parentCtx(six, [])),
    (e) => { assert.match(e.message, /^batch: §6 收口段为空（non-empty gate）/); return true },
  )

  const cred = makeProject("r3d")
  const out = await bound.execute({ action: "append", segment: "§5", text: "夹具段写入。\ndesignId: SECRET-VALUE-123\n" }, subCtx(cred, "eng-coder", []))
  assert.match(out, /appended \d+ characters to §5/, out)
  assert.doesNotMatch(readFileSync(join(cred, BATCH_REL), "utf8"), /SECRET-VALUE-123/, "凭证值不入档")
})
