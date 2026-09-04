/**
 * bash.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { slow } from "./slow.mjs"
import { builtinTools } from "../src/tools/index.mjs"

async function cleanupCheckpoints(cwd) {
  const { rm } = await import("node:fs/promises")
  await rm(await cpRoot(cwd), { recursive: true, force: true })
}
async function cpRoot(cwd) {
  const { createHash } = await import("node:crypto")
  const { configDir } = await import("../src/config.mjs")
  const norm = cwd.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
  return join(configDir, "checkpoints", createHash("sha1").update(norm).digest("hex").slice(0, 12))
}


// ---------------------------------------------------------------- bash 流式


slow("bash: 流式输出实时透传（onOutput 分块到达）", async () => {
  const bash = builtinTools.find((t) => t.name === "bash")
  const chunks = []
  const result = await bash.execute(
    { command: "echo first && node -e \"setTimeout(()=>console.log('second'),100)\" && wait || true" },
    { cwd: process.cwd(), onOutput: (c) => chunks.push({ t: Date.now(), c }) },
  )
  const text = chunks.map((x) => x.c).join("")
  assert.match(text, /first/)
  assert.match(result, /first/)
  // 流式特征：至少收到过数据块，且与最终返回内容一致
  assert.ok(chunks.length >= 1)
})



slow("bash 工具：git 破坏性命令先快照后放行（未提交工作不丢且命令正常执行）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { bashTool } = await import("../src/tools/system.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-gitguard-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 模型写好一批代码（未提交）
    await writeFile(join(dir, "app.js"), "const v = 2 // 写好的未提交代码\n")
    await writeFile(join(dir, "new-file.js"), "export const fresh = 42\n")

    // 模型搞乱后回滚：git checkout -- . —— 不拦截，快照后放行
    const r = await bashTool.execute({ command: "git checkout -- ." }, { cwd: dir })
    assert.match(r, /\[auto-protection\]/, "返回结果应提示自动快照: " + r.slice(0, 150))
    assert.match(r, /snapshot \S+ created BEFORE execution/)
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 1\n", "回滚已执行（命令未被拦截）")

    // 从自动快照恢复被抹掉的未提交工作
    const id = r.match(/snapshot (\S+) created/)[1]
    const { rewind } = await import("../src/git/checkpoint.mjs")
    await rewind(dir, id, { path: "app.js" })
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 2 // 写好的未提交代码\n", "tracked 未提交修改恢复")
    assert.equal(await rf(join(dir, "new-file.js"), "utf8"), "export const fresh = 42\n", "untracked 新文件恢复")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("bash 工具：变体 git checkout HEAD -- . 同样快照后放行", async () => {
  const { execFileSync } = await import("node:child_process")
  const { bashTool } = await import("../src/tools/system.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-gitguard2-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    await writeFile(join(dir, "app.js"), "const v = 2 // 写好的未提交代码\n")
    await writeFile(join(dir, "new-file.js"), "export const fresh = 42\n")

    const r = await bashTool.execute({ command: "git checkout HEAD -- ." }, { cwd: dir })
    assert.match(r, /\[auto-protection\]/, "变体命令也应触发自动快照: " + r.slice(0, 150))
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 1\n", "tracked 未提交修改被回滚抹掉")
    // checkout 不删 untracked（只有 git clean 删）——新文件还在，但 tracked 修改已丢
    assert.equal(await rf(join(dir, "new-file.js"), "utf8"), "export const fresh = 42\n", "untracked 文件不受 checkout 影响")

    // 从自动快照恢复被抹掉的 tracked 未提交工作
    const id = r.match(/snapshot (\S+) created/)[1]
    const { rewind } = await import("../src/git/checkpoint.mjs")
    await rewind(dir, id, { path: "app.js" })
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 2 // 写好的未提交代码\n", "tracked 未提交修改恢复")
  } finally {
    await cleanupCheckpoints(dir)
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("bash 工具：非破坏性 git 命令不触发保护；非 git 仓库静默放行", async () => {
  const { execFileSync } = await import("node:child_process")
  const { bashTool } = await import("../src/tools/system.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-gitguard3-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 注意：不用 git checkout --help 验证——git 的 --help 会打开系统浏览器（Windows），测试不得触发
    for (const cmd of ["git status", "git log --oneline", "git diff", "git checkout -b tmp-branch", "git branch"]) {
      const r = await bashTool.execute({ command: cmd }, { cwd: dir })
      assert.ok(!r.includes("[auto-protection]"), `${cmd} 不应触发保护: ${r.slice(0, 80)}`)
    }
    // 非 git 仓库：无快照、不拦截（git 自己的 stderr 返回给模型）
    const plain = mkdtempSync(join(tmpdir(), "thincoder-gitguard4-"))
    const r4 = await bashTool.execute({ command: "git restore ." }, { cwd: plain })
    assert.ok(!r4.includes("[auto-protection]"), "非 git 仓库保护静默")
    rmSync(plain, { recursive: true, force: true })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



slow("bash 工具：后台进程不卡死（子进程持有管道，grace 兜底返回）", async () => {
  const { bashTool } = await import("../src/tools/system.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-bg-"))
  try {
    // 后台启动一个 5 秒后自退的 node 进程：shell 立即退出，但子进程持有 stdout 管道，
    // 'close' 事件不会触发——旧实现会卡到 120s 超时，新实现应在 grace 后返回。
    const cmd = process.platform === "win32"
      ? 'start /b node -e "setTimeout(() => process.exit(0), 5000)"'
      : 'node -e "setTimeout(() => process.exit(0), 5000)" &'
    const t0 = Date.now()
    const r = await bashTool.execute({ command: cmd }, { cwd: dir })
    const elapsed = Date.now() - t0
    assert.ok(elapsed < 10000, `应在 grace（~1.5s）后返回而非卡到超时，实际 ${elapsed}ms`)
    assert.match(r, /\[background\]/, "提示后台进程持有管道: " + r.slice(0, 150))
    assert.match(r, /exit code 0/, "shell 退出码 0")
  } finally {
    // 后台子进程的 cwd 是 dir，5 秒自退后才可删除——轮询等待
    for (let i = 0; i < 20; i++) {
      try { rmSync(dir, { recursive: true, force: true }); break } catch { await new Promise((r) => setTimeout(r, 500)) }
    }
  }
})



test("bash 护栏已删：echo hi > f.txt 重定向写文件成功——无拦截消息（T-B1'.0 正路径）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-redirect-"))
  try {
    const bash = builtinTools.find((t) => t.name === "bash")
    const out = await bash.execute({ command: "echo hi > f.txt" }, { cwd: dir })
    assert.match(out, /exit code 0/, "重定向命令应正常执行")
    const content = readFileSync(join(dir, "f.txt"), "utf8").replace(/\r\n/g, "\n").trimEnd()
    assert.equal(content, "hi", "文件应被创建——bash 写文件不拦（权限层裁决）")
    assert.doesNotMatch(out, /not allowed|intercepted|blocked/, "无护栏拦截消息")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("bash 护栏防回潮：src/ 无重定向检测函数残留 + 旧测试段无复活（T-B1'.1/.2）", () => {
  // 拼接构造——测试自身源码不得包含被搜索的连续字符串（防自匹配）
  const needle = ["hasFile", "Redirection"].join("")
  const oldTitle = "bash 护栏：" + "重定向检测引号感知"
  // T-B1'.1: src/ 全量零命中（导出/消费方均无）——fail-when-unchanged 精神
  const hits = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(?:mjs|md)$/.test(e.name) && readFileSync(p, "utf8").includes(needle)) hits.push(p)
    }
  }
  walk(join(dirname(fileURLToPath(import.meta.url)), "..", "src"))
  assert.deepEqual(hits, [], "src/ 无重定向检测函数残留（护栏已删——回潮即失败）")
  // T-B1'.2: 旧测试段已删除确认——引用断链零
  const self = readFileSync(fileURLToPath(import.meta.url), "utf8")
  assert.ok(!self.includes(oldTitle), "tools.test.mjs 无旧测试段标题")
  assert.ok(!self.includes(needle), `tools.test.mjs 无 ${needle} 导入（护栏彻底删除）`)
})



test("bash: cmd.exe 下 POSIX 痕迹提示（不拦截，仅前置警告）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-bash-posix-"))
  try {
    const bash = builtinTools.find((t) => t.name === "bash")
    const out = await bash.execute({ command: "echo $(echo hi)" }, { cwd: dir })
    assert.match(out, /\[hint: POSIX-only construct/, "POSIX $(...) must be flagged")
    assert.doesNotMatch(out, /intercepted|blocked/, "hint must not block execution")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T-W2: bash 与文件工具对外部路径行为一致（同路径均可达）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-scope2-"))
  try {
    const ws = join(dir, "ws")
    mkdirSync(ws)
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    const ctx = { cwd: ws }

    // bash 写外部文件 → read 工具读同路径
    await byName.bash.execute(
      { command: `node -e "require('fs').writeFileSync(require('path').join('..','bash-out.txt'),'from bash')"` },
      ctx,
    )
    const r1 = await byName.read.execute({ path: "../bash-out.txt" }, ctx)
    assert.match(r1, /from bash/)

    // 文件工具写外部文件 → bash 读同路径
    await byName.write.execute({ path: "../file-out.txt", content: "from file tool\n" }, ctx)
    const b2 = await byName.bash.execute(
      { command: `node -e "process.stdout.write(require('fs').readFileSync(require('path').join('..','file-out.txt'),'utf8'))"` },
      ctx,
    )
    assert.match(b2, /from file tool/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
