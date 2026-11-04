/**
 * grep-process-doc-mark.test.mjs — 集成用例 31-1 / 31-2（RTM CLI 端故事 31
 * 「过程档内容在工具输出的命中处就标出不可作依据」）。
 *
 * 业务入口：用户在会话里让助手查一个词 ⇒ 命中行落在批档（过程档）里时，读的人**当场**看见
 * 「这行不能作为设计依据」；落在状态档里时输出与今天逐字节相同。
 *
 * 判据原文 = `test/RTM.md` 第 31 节；机制 + 验收 1–14 单源 = `docs/core/design/TOOLS.md` §6.28
 * （需求侧回指 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19 条 3-补，其验收 ④ 指回该表）。
 *
 * 交互组件 = `grep` ∥ `bash`（核同步）∥ `bash`（核后台摘要）∥ `execute` ∥ VSC 端 `bash` 两出口的输出渲染
 * ⟷ 声明谓词 `isExcludedRelPath` ⟷ 盘上路径解析。四面共用一份文案 ∥ 一个谓词 ∥ 一个 helper（
 * `thincoder-core/tools/process-doc-mark.mjs`），差异只在拼装点——本档每面各留一次**逐字全等**断言，
 * 漏接任一拼装点当场变红。
 *
 * 后台径（`bash` 的 `async: true` 结算摘要）也是输出面：本档真起一条后台任务，断它的结算文本
 * （`entry.report`——`finalizeBgEntry` 与 `injectBgResult` 两个消费点的同一份源）。
 *
 * VSC 端 `bash` 是端点独立实现（`thincoder-vscode/src/tools/shell.mjs`），本档用 `module.registerHooks`
 * 把 `vscode` 解析到桩模块后真跑它的两处输出出口——不靠读源码猜它会标。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/grep-process-doc-mark.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { grepTool } from "../../thincoder-core/tools/search.mjs"
import { bashTool } from "../../thincoder-core/tools/bash.mjs"
import { executeTool } from "../../thincoder-core/tools/execute.mjs"
import { declarationForTarget } from "../../thincoder-core/declaration.mjs"
const { _setBgTaskLogDirForTest, launchBgTask } = await import("../../thincoder-core/agent-tools/bash-async.mjs")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
mkdirSync(SCRATCH, { recursive: true })

/** 逐字文案与末行汇总（硬编码，不 import 常量——常量改了口径，本档当场变红）。 */
const MARK = "[process doc: not a design basis]"
const MARK_LINE = `${MARK} `
const SUMMARY_RE = /^\[process doc: (\d+) of this output's lines come from process docs — not a design basis\]$/

const fixtures = []
const logDirs = []
after(() => {
  _setBgTaskLogDirForTest(null)
  for (const p of [...fixtures, ...logDirs]) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 输出里被标出的行数（末行汇总的 N 必须等于它）。 */
const markedCount = (text) => text.split("\n").filter((l) => l.startsWith(MARK_LINE)).length
/** 末行汇总的 N；没有汇总行 ⇒ null。 */
const summaryOf = (text) => {
  const m = SUMMARY_RE.exec(text.split("\n").at(-1) ?? "")
  return m ? Number(m[1]) : null
}

/**
 * 命令面夹具脚本：行首分别印 相对形 ∥ 状态档 ∥ 驱动绝对形（win32 另加 MSYS 形）∥ 盘上不存在的假路径。
 * 标记串拆成 `"NEEDLE" + "_Q"`——本档脚本本身不进 grep 命中集。
 */
const EMIT_SCRIPT = String.raw`const M = "NEEDLE" + "_Q"
const cwd = process.cwd()
console.log("docs/batches/probe.md:1: " + M + " batch")
console.log("docs/design/state.md:1: " + M + " state")
console.log(cwd.split("\\").join("/") + "/docs/batches/probe.md:1: " + M + " abs")
if (process.platform === "win32") {
  const msys = "/" + cwd[0].toLowerCase() + cwd.slice(2).split("\\").join("/")
  console.log(msys + "/docs/batches/probe.md:1: " + M + " msys")
}
console.log("config/x.yml:12: " + M + " fake")
`

/** 只印状态档（N = 0 面：输出与今天逐字节相同，无空汇总行）。 */
const EMIT_STATE_SCRIPT = String.raw`const M = "NEEDLE" + "_Q"
console.log("docs/design/state.md:1: " + M + " state")
`

/** 只印「长得像路径、盘上不存在」的行（误标比不标更坏的判据面）。 */
const EMIT_FAKE_SCRIPT = String.raw`const M = "NEEDLE" + "_Q"
console.log("docs/batches/nope.md:1: " + M + " fake batch")
console.log("config/x.yml:12: " + M + " fake config")
`

/** 夹具项目：`docRoot.batches` + 一份面① 前缀（`_archive`）+ 批档 / 状态档 / workdir 子项目录。 */
function makeProject(tag) {
  const root = mkdtempSync(join(SCRATCH, `pd-${tag}-`))
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({
    version: 1,
    docRoot: { batches: "docs/batches" },
    index: { excludePaths: ["docs/core/design/_archive"] },
  }, null, 2))
  for (const rel of ["docs/batches", "docs/design", "docs/core/design/_archive", "scripts", "sub/docs/batches"]) {
    mkdirSync(join(root, rel), { recursive: true })
  }
  writeFileSync(join(root, "docs/batches/probe.md"), "NEEDLE_Q batch line\n")
  writeFileSync(join(root, "docs/design/state.md"), "NEEDLE_Q state line\n")
  writeFileSync(join(root, "docs/core/design/_archive/old.md"), "NEEDLE_Q archive line\n")
  writeFileSync(join(root, "sub/docs/batches/probe2.md"), "NEEDLE_Q workdir line\n")
  writeFileSync(join(root, "scripts/emit.mjs"), EMIT_SCRIPT)
  writeFileSync(join(root, "scripts/emit-state.mjs"), EMIT_STATE_SCRIPT)
  writeFileSync(join(root, "scripts/emit-fake.mjs"), EMIT_FAKE_SCRIPT)
  return root
}

/** 工具 ctx（depth-0 会话面：`cwd` 是解析基准，`agent.cwd` 是同一锚）。 */
const ctxOf = (cwd) => ({ cwd, agent: { cwd, config: {} } })

// ─── VSC 端 `bash` 的 `vscode` 桩（端点实现只 import 一次 `vscode`，桩在盘上、钩子只拦这一个 specifier）──
const STUB_PATH = join(SCRATCH, "vscode-stub.mjs")
writeFileSync(STUB_PATH, String.raw`export const state = { terminal: null }
export const window = {
  get activeTerminal() { return state.terminal },
  get terminals() { return state.terminal ? [state.terminal] : [] },
  createTerminal() { return state.terminal },
  onDidChangeTerminalShellIntegration() { return { dispose() {} } },
}
`)
const STUB_URL = new URL(`file:///${STUB_PATH.replace(/\\/g, "/")}`).href
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: STUB_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})
const VSCODE = await import(STUB_URL)
const { bashTool: vscBashTool } = await import("../../thincoder-vscode/src/tools/shell.mjs")

test("31-1 过程档行在 grep / bash / execute / VSC bash 四面都带「不可作依据」的前缀", async (t) => {
  const root = makeProject("31-1")
  const ctx = ctxOf(root)
  const stateAbs = join(root, "docs/design/state.md")
  // 后台径的 log 目录重定向到临时目录（不碰真实用户数据目录）
  const logDir = mkdtempSync(join(SCRATCH, "pd-bglog-"))
  logDirs.push(logDir)
  _setBgTaskLogDirForTest(logDir)

  await t.test("grep 面：过程档命中带前缀（batches 段 ∥ 面① _archive）、状态档逐字节不变", async () => {
    const out = await grepTool.execute({ pattern: "NEEDLE_Q", path: join(root, "docs") }, ctx)
    const lines = out.split("\n")
    assert.equal(lines.length, 3, `命中集不该被改动：${out}`)
    // 2 · 排除集外档的命中行逐字节相同（全等断言；同时坐实 cwd 归一与本档的 `root` 同形）
    const stateLine = lines.find((l) => l.includes("state.md"))
    assert.equal(stateLine, `${stateAbs}:1: NEEDLE_Q state line`)
    // 1 · 面⑥ 段序列命中（docRoot.batches）
    assert.equal(lines[0], `${MARK_LINE}${join(root, "docs/batches/probe.md")}:1: NEEDLE_Q batch line`)
    // 3 · 面① 前缀命中（_archive 只由 index.excludePaths 命中——专测第三参传 decl.root 这一点）
    assert.equal(lines[1], `${MARK_LINE}${join(root, "docs/core/design/_archive/old.md")}:1: NEEDLE_Q archive line`)
    // 不是门：不改命中集、也不加尾部汇总（grep 面不加此形）
    assert.equal(summaryOf(out), null, "grep 面不加末尾汇总行")
    assert.equal(markedCount(out), 2)
  })

  await t.test("grep 面：上下文两形同标（命中行 `:` 形 ∥ 上下文行 `-` 形）", async () => {
    const out = await grepTool.execute({ pattern: "NEEDLE_Q", path: join(root, "docs"), before: 1, after: 1 }, ctx)
    const lines = out.split("\n")
    const batchHit = lines.find((l) => l.includes("probe.md:1:"))
    assert.ok(batchHit?.startsWith(MARK_LINE), `命中行带前缀：${batchHit}`)
    // 同一档的第 2 行是上下文行（该批档只有一行内容 ⇒ 它是 `-2- ` 空行），同样带前缀
    const batchCtx = lines.filter((l) => l.includes("probe.md-"))
    assert.ok(batchCtx.length > 0, `应有 probe.md 的上下文行：${out}`)
    for (const l of batchCtx) assert.ok(l.startsWith(MARK_LINE), `同档上下文行同标：${l}`)
    // 状态档的命中行与上下文行零变化
    for (const l of lines.filter((x) => x.includes("state.md"))) {
      assert.ok(!l.startsWith(MARK_LINE), `状态档上下文行零变化：${l}`)
    }
  })

  await t.test("grep 面：`(no matches)` 逐字不变、参数面 schema 零新增键", async () => {
    assert.equal(await grepTool.execute({ pattern: "NO_SUCH_NEEDLE_42", path: join(root, "docs") }, ctx), "(no matches)")
    assert.deepEqual(Object.keys(grepTool.parameters.properties).sort(), [
      "after", "before", "glob", "ignoreCase", "literal", "path", "pattern",
    ])
  })

  await t.test("参数面：`bash` ∥ `execute` 的 schema 只多写门两键（`ledger` ∥ `project`，都不进 `required`）", async () => {
    // 写门两键是设计内的参数面（逐笔带号 = #2016；项目声明面 = 本批）——除此之外本档零改动。
    assert.deepEqual(Object.keys(bashTool.parameters.properties).sort(), ["async", "command", "filter", "ledger", "project", "timeout"])
    assert.deepEqual(bashTool.parameters.required, ["command"], "bash：写门两键都不进 required")
    assert.deepEqual(Object.keys(executeTool.parameters.properties).sort(), [
      "code", "filter", "ledger", "nodeArgs", "project", "scriptFile", "timeoutMs", "workdir",
    ])
    assert.deepEqual(executeTool.parameters.required, [], "execute：无静态必填项")
  })

  await t.test("bash 面（核同步）：行首真解析到盘上的过程档行带前缀 + 末尾汇总 N 对账", async () => {
    const out = await bashTool.execute({ command: "node scripts/emit.mjs" }, ctx)
    const lines = out.split("\n")
    assert.equal(lines[0], "[stdout]:")
    // 7 · 相对形 / 驱动绝对形（win32 另加 MSYS 形）各一例：带前缀且**行其余部分逐字节不变**
    assert.ok(lines.includes(`${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch`), out)
    const relRoot = root.split("\\").join("/")
    const absLine = lines.find((l) => l.includes("NEEDLE_Q abs"))
    assert.equal(absLine, `${MARK_LINE}${relRoot}/docs/batches/probe.md:1: NEEDLE_Q abs`)
    if (process.platform === "win32") {
      // 脚本自己按 `"/" + cwd[0].toLowerCase() + cwd.slice(2)` 造 MSYS 形（`D:\a\b` ⇒ `/d/a/b`）
      const msysRoot = "/" + root[0].toLowerCase() + root.slice(2).split("\\").join("/")
      const msysLine = lines.find((l) => l.includes("NEEDLE_Q msys"))
      assert.equal(msysLine, `${MARK_LINE}${msysRoot}/docs/batches/probe.md:1: NEEDLE_Q msys`)
    }
    // 同一份输出里行首是状态档 ⇒ 零变化；假路径 ⇒ 零变化
    assert.ok(lines.includes("docs/design/state.md:1: NEEDLE_Q state"), out)
    assert.ok(lines.includes("config/x.yml:12: NEEDLE_Q fake"), out)
    // 9 · 末尾恰多一行汇总，N = 实标行数
    const expected = 2 + (process.platform === "win32" ? 1 : 0)
    assert.equal(summaryOf(out), expected, out)
    assert.equal(markedCount(out), expected)
    assert.equal(lines.at(-2), "(exit code 0)", "汇总行在状态位之后")
  })

  await t.test("bash 面：`filter` 按原始行命中（前缀不参与过滤），标在过滤后的行上", async () => {
    const out = await bashTool.execute({ command: "node scripts/emit.mjs", filter: "batch|state" }, ctx)
    assert.ok(out.includes(`${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch`), out)
    assert.ok(out.includes("docs/design/state.md:1: NEEDLE_Q state"), out)
    assert.ok(!out.includes("NEEDLE_Q fake"), "filter 之外的行走原口径被滤掉")
    // 直接证据：过滤面看不见前缀（若前缀参与过滤，这条正则就会命中）
    const raw = await bashTool.execute({ command: "node scripts/emit.mjs", filter: "^\\[process doc" }, ctx)
    assert.match(raw, /^\(no output lines matched filter/)
  })

  await t.test("execute 面：成功径脚本读批档与状态档各打一行", async () => {
    const code = String.raw`import { readFileSync } from "node:fs"
const show = (rel) => console.log(rel + ":1: " + readFileSync(rel, "utf8").split("\n")[0])
show("docs/batches/probe.md")
show("docs/design/state.md")
`
    const out = await executeTool.execute({ code }, ctx)
    const lines = out.split("\n")
    assert.equal(lines[0], `${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch line`)
    assert.equal(lines[1], "docs/design/state.md:1: NEEDLE_Q state line")
    assert.equal(summaryOf(out), 1)
  })

  await t.test("execute 面：失败径同标，`(exit code N)` 尾行零变化", async () => {
    const code = String.raw`console.log("docs/batches/probe.md:1: NEEDLE_Q from stdout")
process.exit(3)
`
    const out = await executeTool.execute({ code }, ctx)
    const lines = out.split("\n")
    assert.equal(lines[0], `${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q from stdout`)
    assert.ok(lines.includes("(exit code 3)"), `状态位行零变化：${out}`)
    assert.equal(summaryOf(out), 1, out)
  })

  await t.test("execute 面：`[stderr]:` 段里的过程档路径行同标，段头行本身零变化", async () => {
    const code = String.raw`console.log("plain stdout line")
console.error("docs/batches/probe.md:2: NEEDLE_Q from stderr")
process.exit(1)
`
    const out = await executeTool.execute({ code }, ctx)
    const lines = out.split("\n")
    assert.ok(lines.includes("[stderr]:"), `段头行零变化：${out}`)
    assert.ok(lines.includes("plain stdout line"), `stdout 段零变化：${out}`)
    assert.ok(lines.includes(`${MARK_LINE}docs/batches/probe.md:2: NEEDLE_Q from stderr`), out)
    assert.equal(summaryOf(out), 1, out)
  })

  await t.test("execute 面：`filter` 同样按原始行命中（前缀不参与过滤）", async () => {
    const code = String.raw`import { readFileSync } from "node:fs"
const show = (rel) => console.log(rel + ":1: " + readFileSync(rel, "utf8").split("\n")[0])
show("docs/batches/probe.md")
show("docs/design/state.md")
`
    const kept = await executeTool.execute({ code, filter: "batch" }, ctx)
    assert.equal(kept.split("\n")[0], `${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch line`, kept)
    assert.ok(!kept.includes("NEEDLE_Q state line"), "filter 之外的行走原口径被滤掉")
    // 直接证据：过滤面看不见前缀（若前缀参与过滤，这条正则就会命中）
    const raw = await executeTool.execute({ code, filter: "^\\[process doc" }, ctx)
    assert.match(raw, /^\(no output lines matched filter/)
  })

  await t.test("execute 面：`workdir` 在场 ⇒ 解析基准是子进程 cwd（baseDir），不是 ctx.cwd", async () => {
    // 夹具前提：同一个相对形按 ctx.cwd（= root）解不到——批档只存在于 sub/ 下
    assert.equal(existsSync(join(root, "docs/batches/probe2.md")), false)
    const code = String.raw`import { readFileSync } from "node:fs"
const rel = "docs/batches/probe2.md"
console.log(rel + ":1: " + readFileSync(rel, "utf8").split("\n")[0])
`
    const out = await executeTool.execute({ code, workdir: "sub" }, ctx)
    assert.equal(out.split("\n")[0], `${MARK_LINE}docs/batches/probe2.md:1: NEEDLE_Q workdir line`, out)
  })

  await t.test("bash 后台摘要面：结算文本（entry.report）与摘要注入同一个源，同样带前缀与汇总", async () => {
    const parent = { cwd: root, history: {}, config: { agent: {} } }
    const launched = await launchBgTask(parent, { cwd: root, depth: 0, agent: parent }, { command: "node scripts/emit.mjs" })
    assert.equal(launched.error, undefined, `后台任务应起得来：${launched.error}`)
    await launched.entry.promise
    const report = launched.entry.report
    const expected = 2 + (process.platform === "win32" ? 1 : 0)
    assert.ok(report.includes(`${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch`), report)
    assert.ok(report.includes("docs/design/state.md:1: NEEDLE_Q state"), report)
    assert.equal(summaryOf(report), expected, report)
  })

  await t.test("VSC 端 bash：子进程出口与 visible 出口同标，inject 径零捕获输出", async () => {
    VSCODE.state.terminal = {
      exitStatus: undefined,
      show() {},
      sendText() {},
      shellIntegration: {
        executeCommand: () => ({
          async *read() {
            yield "docs/batches/probe.md:1: NEEDLE_Q batch\n"
            yield "docs/design/state.md:1: NEEDLE_Q state\n"
          },
        }),
      },
    }
    // 子进程出口（terminal 缺省）
    const sub = await vscBashTool.execute({ command: "node scripts/emit.mjs" }, ctx)
    assert.ok(sub.includes(`${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch`), sub)
    assert.ok(sub.includes("docs/design/state.md:1: NEEDLE_Q state"), sub)
    assert.equal(summaryOf(sub), 2 + (process.platform === "win32" ? 1 : 0), sub)
    // visible 出口
    const vis = await vscBashTool.execute({ command: "node scripts/emit.mjs", terminal: "visible" }, ctx)
    assert.equal(vis.split("\n")[0], "[stdout]:")
    assert.ok(vis.includes(`${MARK_LINE}docs/batches/probe.md:1: NEEDLE_Q batch`), vis)
    assert.ok(vis.includes("docs/design/state.md:1: NEEDLE_Q state"), vis)
    assert.equal(summaryOf(vis), 1, vis)
    // inject 出口：零捕获输出 ⇒ 无标可加
    const inj = await vscBashTool.execute({ command: "node scripts/emit.mjs", terminal: "inject" }, ctx)
    assert.ok(!inj.includes(MARK), inj)
    assert.match(inj, /NOT executed/)
  })
})

test("31-2 判不了就不动输出：盘上不存在的假路径零打标，出辖目录不标", async (t) => {
  const root = makeProject("31-2")
  const ctx = ctxOf(root)

  await t.test("命令面负例：行首长得像路径、但盘上不存在 ⇒ 零打标、零汇总行", async () => {
    const bashOut = await bashTool.execute({ command: "node scripts/emit-fake.mjs" }, ctx)
    assert.equal(markedCount(bashOut), 0, bashOut)
    assert.equal(summaryOf(bashOut), null, "N = 0 ⇒ 不加汇总行")
    assert.ok(bashOut.includes("docs/batches/nope.md:1: NEEDLE_Q fake batch"), bashOut)
    // execute 面同理，且全等：输出与今天逐字节相同
    const execOut = await executeTool.execute({ code: `console.log("config/x.yml:12: NEEDLE_Q looks like a path")` }, ctx)
    assert.equal(execOut, "config/x.yml:12: NEEDLE_Q looks like a path")
  })

  await t.test("N = 0 面：只印状态档的输出逐字节不变（无空汇总行）", async () => {
    const out = await bashTool.execute({ command: "node scripts/emit-state.mjs" }, ctx)
    assert.equal(out, "[stdout]:\ndocs/design/state.md:1: NEEDLE_Q state\n\n(exit code 0)")
    assert.equal(markedCount(out), 0)
  })

  await t.test("出辖：祖先链无 manifest ⇒ 无档类可判 ⇒ 不标", async () => {
    // 夹具必须落在仓外：`.thincoder/tmp`（本档其余夹具的家）在仓内，祖先链上有本仓的 manifest，
    // 拿它做出辖面只会得到「在辖」——`os.tmpdir()` 是这台机器上唯一能保证「无 manifest 祖先」的落脚点。
    const oos = mkdtempSync(join(tmpdir(), "pd-oos-"))
    fixtures.push(oos)
    mkdirSync(join(oos, "docs/batches"), { recursive: true })
    writeFileSync(join(oos, "docs/batches/probe.md"), "NEEDLE_Q out of scope\n")
    const scope = join(oos, "docs/batches/probe.md")
    assert.equal(declarationForTarget(scope), null, "夹具前提 = 该路径确在辖外")
    const grepOut = await grepTool.execute({ pattern: "NEEDLE_Q", path: join(oos, "docs") }, { cwd: oos, agent: { cwd: oos } })
    assert.equal(markedCount(grepOut), 0, grepOut)
    assert.ok(grepOut.endsWith(":1: NEEDLE_Q out of scope"), grepOut)
    const bashOut = await bashTool.execute({ command: "node -e \"console.log('docs/batches/probe.md:1: NEEDLE_Q')\"" }, { cwd: oos, agent: { cwd: oos } })
    assert.equal(markedCount(bashOut), 0, bashOut)
  })
})
