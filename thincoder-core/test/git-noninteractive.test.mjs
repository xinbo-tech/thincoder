/**
 * git-noninteractive.test.mjs — git 工具非交互加固（TOOLS.md §6.14 · 批 GIT-NONINTERACTIVE · 台账 #207）。
 * 本档 = A23–A26（行为面：编辑器族压制 / 凭据 helper + 超时兜底 / 凭据原生路 / 超时三件套）
 *      + A28（结构面：四档 `execFileSync` 白名单恰一处 / 加固键单点 / 三适配器经 `spawnGit`）。
 * A27（**两包**全量回归）· A29（清算表齐全）= 跑项 / 文档面，不在本档。
 *
 * 夹具三形态（设计测试面）：① scratch 仓（`git init` + 本地 identity + 冲突态）② 挂死进程夹具
 * （`.cmd` / 脚本，启动即写 pid 档——判据 = pid 档出没）③ 本地 401 HTTP 服务（node `http`）。
 * ③ 的纪律：工具调用**必须 async**——同步形（批前 `execFileSync`）会阻塞本进程事件循环，服务
 * 永不响应 ⇒ 那是假挂死（批前真读数由设计轮探针的异步形给：候选夹 #6 = helper 起且挂住）。
 * env 注入纪律：`GIT_ENV` 的继承面在**模块求值期**取 `process.env`（设计逐字形——`git-run.mjs` 常量）
 * ⇒ 敌意 `GIT_EDITOR`（A23：桌面 / IDE 注入宿主值）与 `LC_ALL`（A25：英文句钉死）须在**导入工具档
 * 之前**落 env；本档 = 独立进程 ⇒ 复位 = `after()`（同式纪律：A24 的缝注入仍走 `finally`）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import http from "node:http"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const TMP = mkdtempSync(join(tmpdir(), "gitni-"))
const fwd = (p) => p.replace(/\\/g, "/")
const dirs = []      // scratch 仓（after 清快照 + 删档）
const pidFiles = []  // 挂死夹具 pid 档（after 兜底杀）
const pidOf = (f) => (existsSync(f) ? Number(readFileSync(f, "utf8")) : null)
const alive = (pid) => { try { process.kill(pid, 0); return true } catch { return false } }
const treeKill = (pid) => {
  try { if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" }) } catch { /* 已退 */ }
  if (process.platform !== "win32") { try { process.kill(pid, "SIGKILL") } catch { /* 已退 */ } }
}

// ── env 注入（须在导入工具档之前——`GIT_ENV` 继承面 = 模块求值期快照）────────────────────
const HOSTILE = hangFixture("hostile-editor")   // A23 宿主敌意编辑器（永不退出）
process.env.GIT_EDITOR = HOSTILE.cmd
process.env.LC_ALL = "C"
process.env.LANG = "C"                          // A25：git 自带英文句钉死（LC_ALL ⇒ LANG 双钉）
const { gitTool } = await import("../tools/git.mjs")
const { spawnGit, _setGitTimeoutForTest, _resetGitTimeoutForTest } = await import("../tools/git-run.mjs")
const { deleteCheckpointsForCwd } = await import("../git/checkpoint.mjs")

after(async () => {
  for (const f of pidFiles) { const pid = pidOf(f); if (pid) treeKill(pid) }
  for (const d of dirs) { try { await deleteCheckpointsForCwd(d) } catch { /* best-effort */ } }
  delete process.env.GIT_EDITOR; delete process.env.LC_ALL; delete process.env.LANG
  try { rmSync(TMP, { recursive: true, force: true }) } catch { /* Windows 句柄滞后——tmp 自回收 */ }
})

// ── 夹具面 ──────────────────────────────────────────────────────────────────────
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()

/** 挂死进程夹具：启动即写 pid 档、永不退出（等价 GUI 编辑器 / 凭据弹窗等人关窗）。
 *  `mode:"pipe"` = helper 秒退但派生 **detached 孙进程继承 stdout**（= 孙进程持管道形态）。 */
function hangFixture(tag, mode = "hang") {
  const pidFile = join(TMP, `${tag}.pid`)
  const js = join(TMP, `${tag}.mjs`)
  const rec = `writeFileSync(${JSON.stringify(fwd(pidFile))}, String(PID))\n`
  writeFileSync(js, mode === "pipe"
    ? `import { spawn } from "node:child_process"\nimport { writeFileSync } from "node:fs"\nconst PID = spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], { detached: true, stdio: "inherit", windowsHide: true }).pid\n${rec}`
    : `import { writeFileSync } from "node:fs"\nconst PID = process.pid\n${rec}setTimeout(() => {}, 60000)\n`)
  let cmd
  if (process.platform === "win32") { cmd = join(TMP, `${tag}.cmd`); writeFileSync(cmd, `@node "${fwd(js)}"\r\n`) }
  else { cmd = join(TMP, `${tag}.sh`); writeFileSync(cmd, `#!/bin/sh\nexec node "${fwd(js)}"\n`); chmodSync(cmd, 0o755) }
  pidFiles.push(pidFile)
  return { cmd: fwd(cmd), pidFile }
}

/** scratch 仓（本地 identity——夹具面不动机器全局档）。 */
function scratchRepo(tag) {
  const cwd = join(TMP, tag)
  mkdirSync(cwd, { recursive: true })
  git(cwd, "init", "-q", "-b", "main")
  git(cwd, "config", "user.email", "gitni@test.invalid")
  git(cwd, "config", "user.name", "gitni")
  git(cwd, "config", "commit.gpgsign", "false")
  dirs.push(cwd)
  return cwd
}

/** 冲突已解态（`rebase --continue` 待提交）：base → feat 改 f.txt → main 改 f.txt → rebase feat 冲突 ⇒ 解 + add。 */
function rebaseConflictResolved(cwd) {
  writeFileSync(join(cwd, "f.txt"), "base\n")
  git(cwd, "add", "-A"); git(cwd, "commit", "-qm", "base")
  git(cwd, "checkout", "-q", "-b", "feat"); writeFileSync(join(cwd, "f.txt"), "feat\n"); git(cwd, "commit", "-qam", "feat")
  git(cwd, "checkout", "-q", "main"); writeFileSync(join(cwd, "f.txt"), "main\n"); git(cwd, "commit", "-qam", "main")
  try { git(cwd, "rebase", "feat") } catch { /* 冲突 = 期望态 */ }
  writeFileSync(join(cwd, "f.txt"), "resolved\n"); git(cwd, "add", "f.txt")
}

/** 本地 401 服务（凭据族夹具）：任何请求 ⇒ 401 + WWW-Authenticate。 */
async function startAuthServer() {
  const srv = http.createServer((req, res) => { res.writeHead(401, { "WWW-Authenticate": 'Basic realm="x"' }); res.end("no") })
  await new Promise((r) => srv.listen(0, "127.0.0.1", r))
  return { url: `http://127.0.0.1:${srv.address().port}/r.git`, close: () => srv.close() }
}

/** 401 远端仓（commit 一枚 + 命名 remote `origin` ⇒ push 走名字面，URL 不经 ref 校验）。 */
async function pushFixture(tag, url) {
  const repo = scratchRepo(tag)
  writeFileSync(join(repo, "a.txt"), "a\n"); git(repo, "add", "-A"); git(repo, "commit", "-qm", "c")
  await gitTool.execute({ action: "remote", remoteAction: "add", remote: "origin", remoteUrl: url }, { cwd: repo })
  return repo
}

/** helper 面 `-c` 序列：先**清空**凭据链（清掉机器全局 manager / store——夹具可判的条件）再加挂死 helper。 */
const helperConfig = (helper) => ["credential.helper=", `credential.helper=${helper.cmd}`]

// ── A23 编辑器族压制（先红 = 批前：夹具被启动 + 无期限等待——实测 #1）────────────────────

test("A23 编辑器族压制：冲突已解态 + 敌意 GIT_EDITOR ⇒ 返回 ∧ 编辑器从未启动", async () => {
  const repo = scratchRepo("a23")
  rebaseConflictResolved(repo)
  const before = git(repo, "rev-parse", "HEAD")
  const t0 = Date.now()
  const out = await gitTool.execute({ action: "rebase", rebaseAction: "continue" }, { cwd: repo })
  const ms = Date.now() - t0
  assert.ok(!String(out).startsWith("Error"), `返回（out: ${String(out).slice(0, 140)}）`)
  assert.equal(git(repo, "log", "-1", "--format=%s"), "main", "HEAD = 被 pick 的提交（提交落成）")
  assert.notEqual(git(repo, "rev-parse", "HEAD"), before, "HEAD 前移（非空跑）")
  assert.equal(git(repo, "status", "--porcelain"), "", "工作树洁净（解后内容已提交）")
  assert.equal(existsSync(join(repo, ".git", "rebase-merge")) || existsSync(join(repo, ".git", "rebase-apply")), false, "在途 rebase 目录消失")
  assert.equal(existsSync(HOSTILE.pidFile), false, "挂死夹具 pid 档不出现 = 编辑器从未启动")
  assert.ok(ms < 15000, `不挂（${ms}ms——粗界、非契约值）`)
})

// ── A24 凭据 helper 族 + 超时兜底（先红 = 批前：挂死——实测 #6）──────────────────────────

test("A24 凭据 helper 族 + 超时兜底（适配器层缺省解析）：到时返回错误 ∧ 夹具不存活", async () => {
  const srv = await startAuthServer()
  try {
    const repo = await pushFixture("a24", srv.url)
    const helper = hangFixture("helper-a24")
    let out
    const t0 = Date.now()
    try {
      _setGitTimeoutForTest(1200) // 测试态缝（适配器层：gitTool → runGitStrict → spawnGit 缺省解析）
      out = await gitTool.execute({ action: "push", remote: "origin", ref: "main", config: helperConfig(helper) }, { cwd: repo })
    } finally { _resetGitTimeoutForTest() }
    const ms = Date.now() - t0
    const pid = pidOf(helper.pidFile)
    assert.ok(pid !== null, "夹具 helper 确被启动（否则该格空转）")
    assert.ok(ms <= 1200 + 3000 + 500, `settle ≤ 注入值 + 3s（实读 ${ms}ms）`)
    assert.match(String(out), /timed out after/, "含超时串")
    assert.match(String(out), /best-effort/, "树杀尽力而为语义（防过度声称回潮）")
    assert.match(String(out), /checkpoint action=checkpoint checkpointAction=list/, "恢复指引（快照锚在位）")
    assert.ok(!alive(pid), "夹具进程不存活（树杀达 helper）")
  } finally { srv.close() }
})

// ── A25 凭据 git 原生路（回归守卫——批前亦快失败，非先红）────────────────────────────────

test("A25 凭据 git 原生路：空 helper + 钉 locale ⇒ 快失败 ∧ terminal prompts disabled", async () => {
  const srv = await startAuthServer()
  try {
    const repo = await pushFixture("a25", srv.url)
    const t0 = Date.now()
    const out = await gitTool.execute({ action: "push", remote: "origin", ref: "main", config: ["credential.helper="] }, { cwd: repo })
    const ms = Date.now() - t0
    assert.match(String(out), /git push failed:/, "明确失败（非挂死）")
    assert.match(String(out), /terminal prompts disabled/, "英文句（LC_ALL=C 钉死——locale 变则本格失守）")
    assert.ok(ms < 5000, `< 5s = 经验界（实读 ${ms}ms——与机器负载相关、非契约值）`)
  } finally { srv.close() }
})

// ── A26 超时三件套（spawnGit 直调 + 参数覆盖；先红 = 批前无超时 / 无树杀能力）─────────────

test("A26 超时三件套：≤ timeout+3s settle ∧ timedOut 形 ∧ 树不存活 ∧ 孙持管道仍 settle", async () => {
  const srv = await startAuthServer()
  try {
    const repo = await pushFixture("a26", srv.url)
    const args = (h) => ["-c", "credential.helper=", "-c", `credential.helper=${h.cmd}`, "push", srv.url, "main"]
    // ① ② ③
    const h1 = hangFixture("helper-a26")
    let err = null
    const t0 = Date.now()
    try { await spawnGit(repo, args(h1), { timeout: 800 }) } catch (e) { err = e }
    const ms = Date.now() - t0
    assert.ok(ms <= 800 + 3000 + 500, `settle ≤ timeout + 3s（实读 ${ms}ms）`)
    assert.equal(err?.timedOut, true, "超时可辨性 = 字段（不靠 stderr 文本猜）")
    assert.equal(err?.code, "ETIMEDOUT")
    assert.match(String(err?.message), /timed out after/)
    assert.ok(!alive(pidOf(h1.pidFile)), "夹具进程树不存活")
    // ④ 孙进程持管道格 = 仍 settle（kick 兜底：孙持管道时 `close` 不可期）
    const h2 = hangFixture("helper-a26-pipe", "pipe")
    let err2 = null
    const t1 = Date.now()
    try { await spawnGit(repo, args(h2), { timeout: 800 }) } catch (e) { err2 = e }
    const ms2 = Date.now() - t1
    assert.ok(ms2 <= 800 + 3000 + 500, `孙持管道仍 settle（实读 ${ms2}ms）`)
    assert.equal(err2?.timedOut, true, "同为超时帧")
  } finally { srv.close() }
})

// ── A28 结构单点机判（先红 = 批前 4 处调用点：`shared` 2 · `git` 1 · `git-ext` 1）──────────

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

test("A28 结构：execFileSync 白名单恰一处 ∧ 加固键单点 ∧ 三适配器经 spawnGit", () => {
  const FOUR = ["tools/shared.mjs", "tools/git.mjs", "tools/git-ext.mjs", "tools/git-checkpoint.mjs"]
  const read = (rel) => stripComments(readFileSync(join(ROOT, rel), "utf8"))
  // ① 调用点（`execFileSync(`——非 import 行）：白名单恰一处（`gitDiffOne` 函数体内 = file/edit 族
  //    预览面、表外复核位、零改）∧ 白名单外零命中（含三适配器体内零命中）
  const calls = []
  for (const rel of FOUR) for (const m of read(rel).matchAll(/execFileSync\s*\(/g)) calls.push({ rel, idx: m.index })
  assert.equal(calls.length, 1, `四档命中须恰一处（实读 ${calls.length}：${calls.map((c) => c.rel).join(", ")}）`)
  const shared = read("tools/shared.mjs")
  const bodyStart = shared.indexOf("export function gitDiffOne(")
  const bodyEnd = shared.indexOf("\n}", bodyStart)
  assert.ok(bodyStart >= 0 && bodyEnd > bodyStart, "`gitDiffOne` 函数体在盘")
  assert.equal(calls[0].rel, "tools/shared.mjs", "唯一命中 = `shared.mjs`")
  assert.ok(calls[0].idx > bodyStart && calls[0].idx < bodyEnd, "唯一命中 = `gitDiffOne` 函数体内（白名单位）")
  // ② 加固键字面在 `tools/` 域内仅 `git-run.mjs`（单点）+ 既有 `bash.mjs`（零改先例）。
  //    取键 = **GIT_* 四专属键**（非通用词形——裸 `EDITOR` / `VISUAL` / `PAGER` / `TERM` 在域内散见，
  //    并入需词边界归并；四键已能唯一钉住「第二处加固集」）。
  const KEYS = ["GIT_EDITOR", "GIT_SEQUENCE_EDITOR", "GIT_TERMINAL_PROMPT", "GIT_ASKPASS"]
  const hits = readdirSync(join(ROOT, "tools")).filter((n) => n.endsWith(".mjs"))
    .filter((n) => KEYS.some((k) => read(`tools/${n}`).includes(k)))
  assert.deepEqual(hits.sort(), ["bash.mjs", "git-run.mjs"], "加固键单点（第二处 = 重复实现嫌疑）")
  // ③ 三适配器均经 `spawnGit`（import 命中）
  for (const rel of ["tools/shared.mjs", "tools/git.mjs", "tools/git-ext.mjs"]) {
    assert.match(read(rel), /import\s*{[^}]*\bspawnGit\b[^}]*}\s*from\s*"\.\/git-run\.mjs"/, `${rel} 经 spawnGit 单点`)
  }
})
