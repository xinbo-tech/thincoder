/**
 * tool-seams.test.mjs — C 类余量注入缝机检（工具面）：#56 / #57 / #59 / #61 / #66 / #69
 * （CORE-UNIFICATION §2.13.4；形态纪律承 §2.13.5 写路径缝）。
 *
 * 行为面（双夹具——每缝一组）：
 *   夹具一 = 注入面（`configure*`）覆盖 ⇒ 端形态接管（记录调用 / 以其返回值为准）；
 *   夹具二 = 缺省（不注入 / `reset*`）⇒ 回核内默认 = CLI 语义（零行为变）。
 * 结构面：
 *   ① `configure* / reset* / set*` 缝导出面**逐档等值**（fail-closed——新增未登记即红、消失亦红）；
 *   ② 缝模块**零端名**（注释剥除后的代码面——契约 5 机械面；射程 = 本批模块 ∪ 缝定义档）；
 *   ③ 执行面单点（#61/#63/#96）：缝覆盖档零直调 `child_process`。
 *
 * 口径注：壳侧（产品面）接线 = S2；本档只证「缝在 + 缺省不覆盖 + 端可接管」。
 * 对位档 = tool-seams-agent.test.mjs（agent 面：#88 / #91 / #96）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { treeTool, configureTreeResolve, resetTreeResolve } from "../tools/tree.mjs"
import { executeTool, killProcessTree, configureProcessTreeKill, resetProcessTreeKill } from "../tools/execute.mjs"
import { gitTool, configureGitApproval, resetGitApproval } from "../tools/git.mjs"
import { configureExecRun, resetExecRun } from "../tools/exec-run.mjs"
import { lintTool } from "../tools/linter.mjs"
import { lspTool, configureLspHost, resetLspHost } from "../tools/lsp.mjs"
import { editTool } from "../tools/file.mjs"
import { configureEditReceipt, resetEditReceipt } from "../tools/edit-diff.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "core-tool-seams-"))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

// ─── #56 tree：cwd 归一开关 ─────────────────────────────────────────────────────

test("#56 tree cwd 归一缝：缺省 = resolveInCwd（现行为）；注入 ⇒ 端归一形态接管", async () => {
  await withTempDir(async (dir) => {
    mkdirSync(join(dir, "sub")); writeFileSync(join(dir, "sub", "a.txt"), "x")
    mkdirSync(join(dir, "other")); writeFileSync(join(dir, "other", "b.txt"), "y")
    const ctx = { cwd: dir }
    // 夹具二（缺省）：现行 CLI 语义
    const d1 = await treeTool.execute({ path: "sub" }, ctx)
    assert.match(d1, /^sub\/\n└── a\.txt/)
    // 夹具一（注入）：每调用一次 (ctx, p)；返回值 = 解析根
    const calls = []
    try {
      configureTreeResolve({ resolve: (c, p) => { calls.push([c, p]); return join(dir, "sub") } })
      const d2 = await treeTool.execute({ path: "ignored" }, ctx)
      assert.equal(d2, d1, "显式根 ⇒ 与默认解析产物一致（缝不换树渲染语义）")
      assert.equal(calls.length, 1)
      assert.equal(calls[0][0], ctx)
      assert.equal(calls[0][1], "ignored")
      // 注入真的接管：切到另一根
      configureTreeResolve({ resolve: () => join(dir, "other") })
      assert.match(await treeTool.execute({}, ctx), /^other\/\n└── b\.txt/)
    } finally { resetTreeResolve() }
    // 撤销后回默认
    assert.match(await treeTool.execute({ path: "other" }, ctx), /^other\/\n└── b\.txt/)
  })
})

// ─── #57 execute：树杀实现 ──────────────────────────────────────────────────────

test("#57 树杀缝：超时 ⇒ 注入树杀被调（缺省 = 核内 killProcessTree，现行为）", async () => {
  await withTempDir(async (dir) => {
    const ctx = { cwd: dir }
    const killed = []
    try {
      // 夹具一：注入 recorder（委托核内同一语义）——断言接管 + 结果不变
      configureProcessTreeKill({ killTree: (child) => { killed.push(child.pid); killProcessTree(child) } })
      const r1 = await executeTool.execute({ code: "setInterval(() => {}, 1000)", timeoutMs: 150 }, ctx)
      assert.equal(killed.length, 1, "超时 ⇒ 注入树杀恰一次")
      assert.match(r1, /script timed out after 150ms/)
    } finally { resetProcessTreeKill() }
    // 夹具二（缺省）：同脚本同超时 ⇒ 同样报超时（零行为变）
    assert.match(await executeTool.execute({ code: "setInterval(() => {}, 1000)", timeoutMs: 150 }, ctx), /script timed out after 150ms/)
  })
})

// ─── #59 git：审批门 ───────────────────────────────────────────────────────────

test("#59 git 审批门缝：gate 返回非空串 ⇒ 拒执行（原样返回）；缺省 ⇒ 全动作照常", async () => {
  await withTempDir(async (dir) => {
    const ctx = { cwd: dir }
    const calls = []
    try {
      configureGitApproval({ gate: async (args, c) => { calls.push([args, c]); return args.action === "status" ? "REFUSED-BY-END" : null } })
      const r = await gitTool.execute({ action: "status" }, ctx)
      assert.equal(r, "REFUSED-BY-END", "非空串 = 拒执行，原样作为工具结果")
      assert.equal(calls.length, 1, "每 execute 恰问一次")
      assert.equal(calls[0][0].action, "status")
      assert.equal(calls[0][1], ctx)
      // 放行（null）⇒ 默认径照常
      configureGitApproval({ gate: () => null })
      assert.equal(await gitTool.execute({ action: "status" }, ctx), "(clean — no changes)")
    } finally { resetGitApproval() }
    // 夹具二（缺省）：无审批门 ⇒ 现行为
    assert.equal(await gitTool.execute({ action: "status" }, ctx), "(clean — no changes)")
  })
})

// ─── #61 / #63 / #96 执行器缝（exec-run 单点）────────────────────────────────────

test("#61 执行器缝（linter）：检查器命令全经注入执行器；缺省 ⇒ 现行为", async () => {
  await withTempDir(async (dir) => {
    writeFileSync(join(dir, "ok.mjs"), "export const a = 1\n")
    writeFileSync(join(dir, "x.py"), "print(1)\n")
    const calls = []
    const sig = { aborted: false }
    try {
      // 夹具一：fast path（node --check）经注入
      configureExecRun({ run: async (cmd, args, opts) => { calls.push({ cmd, args, opts }); return "" } })
      const r1 = await lintTool.execute({ path: "ok.mjs" }, { cwd: dir, signal: sig })
      assert.equal(calls.length, 1)
      assert.equal(calls[0].cmd, process.execPath)
      assert.equal(calls[0].args[0], "--check")
      assert.ok(calls[0].args[1].endsWith("ok.mjs"))
      assert.equal(calls[0].opts.timeout, 10000)
      assert.equal(calls[0].opts.signal, sig, "ctx.signal 透传（注入径自决中断）")
      assert.ok(r1.startsWith("Syntax OK: ") && r1.endsWith("ok.mjs"))
      // 夹具一：full path（ruff）经注入
      calls.length = 0
      const r2 = await lintTool.execute({ path: "x.py", full: true }, { cwd: dir, signal: sig })
      assert.equal(r2, "✓ ruff: no issues")
      assert.equal(calls[0].cmd, "ruff")
      assert.deepEqual(calls[0].args.slice(0, 2), ["check", "--output-format"])
    } finally { resetExecRun() }
    // 夹具二（缺省）：真 node --check ⇒ 现行为
    const r3 = await lintTool.execute({ path: "ok.mjs" }, { cwd: dir })
    assert.ok(r3.startsWith("Syntax OK: ") && r3.endsWith("ok.mjs"))
  })
})

// ─── #66 lsp：宿主语言服务径 ────────────────────────────────────────────────────

test("#66 lsp 宿主缝：handle 非 null ⇒ 以其为结果；null / 缺省 ⇒ 回核内径", async () => {
  await withTempDir(async (dir) => {
    const ctx = { cwd: dir }
    const args = { subcommand: "hover", uri: "a.mjs", line: 1, character: 1 }
    const calls = []
    try {
      configureLspHost({ handle: async (a, c) => { calls.push([a, c]); return "HOST-RESULT" } })
      assert.equal(await lspTool.execute(args, ctx), "HOST-RESULT")
      assert.equal(calls.length, 1)
      assert.equal(calls[0][0], args)
      assert.equal(calls[0][1], ctx)
      // null = 未处理 ⇒ 回核内径（无 lsp.servers ⇒ 引导语）
      configureLspHost({ handle: async () => null })
      assert.match(await lspTool.execute(args, ctx), /No LSP server configured/)
    } finally { resetLspHost() }
    // 夹具二（缺省）：核内径 = 现行为
    assert.match(await lspTool.execute(args, ctx), /No LSP server configured/)
  })
})

// ─── #69 edit：回执形态 ────────────────────────────────────────────────────────

test("#69 回执形态缝：注入 ⇒ 单形态与数组形态均以其为准；缺省 ⇒ CLI 回执", async () => {
  await withTempDir(async (dir) => {
    const ctx = { cwd: dir }
    writeFileSync(join(dir, "e.txt"), "k1\nk2\n")
    const seen = []
    try {
      configureEditReceipt({ format: async (f) => { seen.push(f); return `CUSTOM:${f.path}:${f.deleted}` } })
      assert.equal(await editTool.execute({ path: "e.txt", old_string: "k2", new_string: "K2" }, ctx), "CUSTOM:e.txt:false")
      assert.ok(seen[0].abs.endsWith("e.txt"))
      assert.ok(seen[0].default.startsWith("Edited e.txt: replaced 1 occurrence(s)"), "fields.default = 默认回执原文（供端侧改写）")
      assert.equal(await editTool.execute({ edits: [{ path: "e.txt", old_string: "K2", new_string: "K2b" }] }, ctx), "CUSTOM:e.txt:false", "数组形态同经缝")
    } finally { resetEditReceipt() }
    // format 返回 null ⇒ 回默认
    writeFileSync(join(dir, "f.txt"), "a\nb\n")
    try {
      configureEditReceipt({ format: () => null })
      assert.match(await editTool.execute({ path: "f.txt", old_string: "b", new_string: "B" }, ctx), /^Edited f\.txt: replaced 1 occurrence\(s\)/)
    } finally { resetEditReceipt() }
    // 夹具二（缺省）：CLI 回执 = base + 写入点上下文
    const r4 = await editTool.execute({ path: "f.txt", old_string: "B", new_string: "b" }, ctx)
    assert.match(r4, /^Edited f\.txt: replaced 1 occurrence\(s\)/)
    assert.match(r4, /\ncontext \(L\d+-L\d+\):/)
  })
})

// ─── 结构机检（承 write-path.test.mjs 的白名单 / 等值写法）────────────────────────

/** 递归收集目录下 .mjs 相对路径（相对 ROOT，正斜杠）。 */
function walkRel(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkRel(p, out)
    else if (name.endsWith(".mjs")) out.push(relative(ROOT, p).replace(/\\/g, "/"))
  }
  return out
}

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

test("结构机检①：configure/reset/set 缝导出面逐档等值（fail-closed——新增未登记 / 消失均红）", () => {
  // 登记表 = 核内全部「模块级注入缝」导出（本批 9 缝 + 先例 2 缝 + 既有条件源缝
  // `setWaitForConditionSource`——命名例外一并收编，免因命名不同而漏检）。新增缝必须来此登记，
  // 删除缝亦红（两侧等值 = 缝库存的机械真值）。
  const REGISTERED = [
    "configureBatchSegment", "resetBatchSegment",
    "configureEditReceipt", "resetEditReceipt",
    "configureEngMirror", "resetEngMirror",
    "configureExecRun", "resetExecRun",
    "configureGitApproval", "resetGitApproval",
    "configureLspHost", "resetLspHost",
    "configureProcessTreeKill", "resetProcessTreeKill",
    "configureSkillLoader", "resetSkillLoader",
    "configureTreeResolve", "resetTreeResolve",
    "configureVerifyDiagnostics", "resetVerifyDiagnostics",
    "configureWritePath", "resetWritePath",
    "setWaitForConditionSource",
  ]
  const RE = /export\s+(?:async\s+)?function\s+((?:configure|reset|set)[A-Z][A-Za-z0-9_]*)\s*\(/g
  const found = new Set()
  for (const root of ["tools", "agent-tools"]) {
    for (const rel of walkRel(join(ROOT, root))) {
      const src = stripComments(readFileSync(join(ROOT, rel), "utf8"))
      for (const m of src.matchAll(RE)) found.add(m[1])
    }
  }
  assert.deepEqual([...found].sort(), [...REGISTERED].sort(), "缝导出面须与登记表逐档等值（fail-closed）")
})

test("结构机检②：缝模块零端名（注释剥除后的代码面——契约 5 机械面）", () => {
  // 射程 = 本批缝落点模块 ∪ 全部「定义缝导出的档」（与①同源派生——新增缝档自动进入扫描，
  // 不会静默漏检）。注释面允许历史叙事（如既有注释引 VS Code 对齐记录），代码面（含字符串）
  // 不得出现端名 / 产品树名；域内非缝档的既有文案（如 subagent-panel.mjs 的降级句）不在本批射程。
  const BATCH_MODULES = [
    "tools/exec-run.mjs", "tools/tree.mjs", "tools/execute.mjs", "tools/git.mjs", "tools/linter.mjs",
    "tools/lsp.mjs", "tools/edit-diff.mjs", "tools/edit-batch.mjs", "tools/write-path.mjs",
    "skills.mjs", "agent-tools/skill.mjs", "agent-tools/eng.mjs", "agent-tools/verify.mjs",
  ]
  const modules = new Set(BATCH_MODULES)
  const SEAM_RE = /export\s+(?:async\s+)?function\s+(?:configure|reset|set)[A-Z][A-Za-z0-9_]*\s*\(/
  for (const root of ["tools", "agent-tools"]) {
    for (const rel of walkRel(join(ROOT, root))) {
      if (SEAM_RE.test(stripComments(readFileSync(join(ROOT, rel), "utf8")))) modules.add(rel)
    }
  }
  const END_NAME = /(?:vscode|vs\s*code|thincoder-cli|thincoder-vscode)/i
  const hits = []
  for (const rel of modules) {
    if (END_NAME.test(stripComments(readFileSync(join(ROOT, rel), "utf8")))) hits.push(rel)
  }
  assert.deepEqual(hits, [], `缝模块代码面出现端名：${hits.join(", ")}`)
})

test("结构机检③：执行面单点（#61/#63/#96）——缝覆盖档零直调 child_process（单点 = tools/exec-run.mjs）", () => {
  // 执行面缝的机械面（承写路径缝白名单写法）：linter / agent-tools/verify 的命令执行只许经
  // 核内单点 runCommand（tools/exec-run.mjs——默认 execFileSync / 端注入）；直调即红。
  const SEAM_COVERED = ["tools/linter.mjs", "agent-tools/verify.mjs"]
  const DIRECT = /\b(?:exec|execFile|execSync|execFileSync|spawn|spawnSync)\s*\(|["']node:child_process["']/
  const hits = []
  for (const rel of SEAM_COVERED) {
    if (DIRECT.test(stripComments(readFileSync(join(ROOT, rel), "utf8")))) hits.push(rel)
  }
  assert.deepEqual(hits, [], `缝覆盖档直调 child_process（应经 tools/exec-run.mjs 单点）：${hits.join(", ")}`)
})
