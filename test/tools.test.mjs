/**
 * 工具测试（tools / skills / distill / plan / goal / verify / delete / git / checkpoint）。
 * 从 test/units.test.mjs 提取。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

import { builtinTools } from "../src/tools/index.mjs"
import { createMemory } from "../src/memory.mjs"
import { loadSkills, formatSkillListing, readSkill } from "../src/skills.mjs"
import { historyToTranscript, saveCandidate } from "../src/distill.mjs"
import { planTool, goalTool, verifyTool } from "../src/agent-tools.mjs"
import { isPrivateHost, isDestructiveCommand } from "../src/tools/shared.mjs"

function freshMemory() {
  return createMemory({ dbPath: ":memory:" })
}

// ---------------------------------------------------------------- tools

test("read_image: 非视觉模型直接拒绝（防 image_url 毒化会话），视觉模型正常返回", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  try {
    // 1x1 透明 PNG
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")
    writeFileSync(join(dir, "a.png"), png)
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    // DeepSeek（无视觉）：读文件前就拒绝，错误信息说明原因与替代方案
    await assert.rejects(
      () => byName.read_image.execute({ path: "a.png" }, { cwd: dir, agent: { provider: { model: "deepseek-v4-pro" } } }),
      /does not support image input/,
    )
    // Kimi K3（有视觉）：正常返回 { text, images }
    const out = await byName.read_image.execute({ path: "a.png" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } })
    const parsed = JSON.parse(out)
    assert.match(parsed.text, /read_image: a\.png/)
    assert.equal(parsed.images[0].type, "image_url")
    // 无 agent 上下文（独立调用）：不拦截
    const out2 = await byName.read_image.execute({ path: "a.png" }, { cwd: dir })
    assert.equal(JSON.parse(out2).images.length, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("read_image: svg 返回文本源码（不进 image_url，任何模型可用），bmp 拒绝并提示转 PNG", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  try {
    writeFileSync(join(dir, "a.svg"), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>')
    writeFileSync(join(dir, "a.bmp"), Buffer.from([66, 77]))
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    // 视觉模型：返回纯文本（JSON.parse 失败 → agent 当普通 tool 结果，不产 image_url 毒化历史）
    const out = await byName.read_image.execute({ path: "a.svg" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } })
    assert.match(out, /svg source/)
    assert.match(out, /<rect/)
    assert.throws(() => JSON.parse(out))
    // 文本模型也可用——svg 不需要视觉能力，在 vision gate 之前分支
    const out2 = await byName.read_image.execute({ path: "a.svg" }, { cwd: dir, agent: { provider: { model: "deepseek-v4-pro" } } })
    assert.match(out2, /<svg/)
    // bmp：没有主流视觉 API 支持，拒绝并提示转换
    await assert.rejects(
      () => byName.read_image.execute({ path: "a.bmp" }, { cwd: dir, agent: { provider: { model: "kimi-k3" } } }),
      /Unsupported image format: \.bmp[\s\S]*Convert it to PNG/,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("tools: write / read / edit / glob / grep", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "sub/a.txt", content: "hello\nworld\n" }, ctx)
    const readOut = await byName.read.execute({ path: "sub/a.txt" }, ctx)
    assert.match(readOut, /1\thello/)

    await byName.edit.execute({ path: "sub/a.txt", old_string: "world", new_string: "mjs" }, ctx)
    const readOut2 = await byName.read.execute({ path: "sub/a.txt" }, ctx)
    assert.match(readOut2, /2\tmjs/)

    // edit 多次匹配必须报错
    await byName.write.execute({ path: "b.txt", content: "x x x" }, ctx)
    await assert.rejects(() => byName.edit.execute({ path: "b.txt", old_string: "x", new_string: "y" }, ctx))

    const globOut = await byName.glob.execute({ pattern: "**/*.txt" }, ctx)
    assert.match(globOut, /sub\/a\.txt/)
    assert.match(globOut, /b\.txt/)

    const grepOut = await byName.grep.execute({ pattern: "mjs" }, ctx)
    assert.match(grepOut, /a\.txt:2:/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


test("globToRegex: **跨目录 / * 段内 / ? 单字符 / 精确匹配", async () => {
  const { globToRegex } = await import("../src/tools/shared.mjs")
  // **/*.txt：匹配任意深度的 .txt 文件（含根目录、多层子目录）
  const re1 = globToRegex("**/*.txt")
  assert.ok(re1.test("a.txt"), "**/*.txt should match root file")
  assert.ok(re1.test("sub/a.txt"), "**/*.txt should match one-level deep")
  assert.ok(re1.test("deep/nested/a.txt"), "**/*.txt should match multi-level deep")
  assert.ok(!re1.test("a.txt.bak"), "**/*.txt should not match wrong extension")

  // ** 单独使用：匹配任意路径（跨目录）
  const re2 = globToRegex("src/**")
  assert.ok(re2.test("src/a.mjs"), "src/** should match file in src/")
  assert.ok(re2.test("src/deep/nested/a.mjs"), "src/** should match deeply nested file")
  assert.ok(!re2.test("test/a.mjs"), "src/** should not match outside src/")

  // * 段内通配（不跨 /）
  const re3 = globToRegex("*.mjs")
  assert.ok(re3.test("a.mjs"), "*.mjs should match root file")
  assert.ok(!re3.test("sub/a.mjs"), "*.mjs should not match subdirectory file")

  // ? 单字符
  const re4 = globToRegex("a?.mjs")
  assert.ok(re4.test("ab.mjs"), "a?.mjs should match ab.mjs")
  assert.ok(!re4.test("abc.mjs"), "a?.mjs should not match abc.mjs")

  // 精确匹配
  const re5 = globToRegex("exact.mjs")
  assert.ok(re5.test("exact.mjs"), "exact match")
  assert.ok(!re5.test("notexact.mjs"), "no false positive")
})

test("tools: apply_patch 多文件原子应用 / 新建文件 / 失败不落盘", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-patch-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "a.txt"), "one\ntwo\nthree\n")
    writeFileSync(join(dir, "b.txt"), "alpha\nbeta\ngamma\n")

    // 一个补丁改两个文件 + 建一个新文件
    const patch = [
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@ -1,3 +1,3 @@",
      " one",
      "-two",
      "+TWO",
      " three",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -1,3 +1,4 @@",
      " alpha",
      "+inserted",
      " beta",
      " gamma",
      "--- /dev/null",
      "+++ b/sub/new.txt",
      "@@ -0,0 +1,2 @@",
      "+hello",
      "+world",
      "",
    ].join("\n")
    const out = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(out, /3 file/)
    assert.strictEqual(readFileSync(join(dir, "a.txt"), "utf8"), "one\nTWO\nthree\n")
    assert.strictEqual(readFileSync(join(dir, "b.txt"), "utf8"), "alpha\ninserted\nbeta\ngamma\n")
    assert.strictEqual(readFileSync(join(dir, "sub", "new.txt"), "utf8"), "hello\nworld\n")

    // touchedPaths 供 agent 层追踪
    assert.deepStrictEqual(byName.apply_patch.touchedPaths({ patch }), ["a.txt", "b.txt", "sub/new.txt"])

    // 原子性：第二个文件 hunk 不上，第一个文件也不能落盘
    const before = readFileSync(join(dir, "a.txt"), "utf8")
    const bad = [
      "--- a/a.txt",
      "+++ b/a.txt",
      "@@ -1,1 +1,1 @@",
      "-one",
      "+ONE",
      "--- a/b.txt",
      "+++ b/b.txt",
      "@@ -1,1 +1,1 @@",
      "-no-such-line",
      "+x",
      "",
    ].join("\n")
    await assert.rejects(() => byName.apply_patch.execute({ patch: bad }, ctx), /does not apply/)
    assert.strictEqual(readFileSync(join(dir, "a.txt"), "utf8"), before)

    // 上下文多处匹配 → 拒绝，要求更多上下文
    writeFileSync(join(dir, "dup.txt"), "x\ny\nx\ny\n")
    const ambiguous = ["--- a/dup.txt", "+++ b/dup.txt", "@@ -1,2 +1,2 @@", " x", "-y", "+z", ""].join("\n")
    await assert.rejects(() => byName.apply_patch.execute({ patch: ambiguous }, ctx), /matches \d+ locations/)

    // 路径越界拒绝
    const escape = ["--- a/../evil.txt", "+++ b/../evil.txt", "@@ -1,1 +1,1 @@", "-a", "+b", ""].join("\n")
    await assert.rejects(() => byName.apply_patch.execute({ patch: escape }, ctx), /Access denied/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("tools: grep before/after 上下文行（匹配行 : 上下文行 -，相邻区间合并）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-ctx-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // 两处匹配相邻（line2 / line4），before=1 after=1 → line3 同时是 line2 的 after 与 line4 的 before，应去重合并
    await byName.write.execute({
      path: "c.txt",
      content: "alpha\nMATCH one\nmid\nMATCH two\nomega\n",
    }, ctx)

    // 无上下文：仍是 path:line: content，不出现 -N- 上下文分隔
    const plain = await byName.grep.execute({ pattern: "MATCH", path: "c.txt" }, ctx)
    assert.match(plain, /c\.txt:2: MATCH one/)
    assert.match(plain, /c\.txt:4: MATCH two/)
    assert.doesNotMatch(plain, /c\.txt-\d+-/)

    // before=1 after=1：匹配行用 ':'，上下文行用 '-'，line3 只出现一次
    const ctxOut = await byName.grep.execute({ pattern: "MATCH", path: "c.txt", before: 1, after: 1 }, ctx)
    const lines = ctxOut.split("\n")
    // 顺序：c-1- alpha / c:2: MATCH one / c-3- mid / c:4: MATCH two / c-5- omega
    assert.equal(lines.length, 5)
    assert.match(lines[0], /c\.txt-1- alpha/)
    assert.match(lines[1], /c\.txt:2: MATCH one/)
    assert.match(lines[2], /c\.txt-3- mid/)        // line3 合并去重，只一行
    assert.match(lines[3], /c\.txt:4: MATCH two/)
    assert.match(lines[4], /c\.txt-5- omega/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- websearch / ls / fetch

test("websearch: 解析结果块（本地 mock Bing）", async () => {
  const { createServer } = await import("node:http")
  const page = `<html><body><ol id="b_results">
    <li class="b_algo" data-id><h2 class=""><a target="_blank" href="https://example.com/1"><strong>Node</strong>.js 官网</a></h2><div class="b_caption"><p>Node.js&#174; 是一个运行时</p></div></li>
    <li class="b_algo" data-id><h2 class=""><a target="_blank" href="https://example.com/2">第二个结果</a></h2><p>摘要&#0183;内容</p></li>
  </ol></body></html>`
  const server = createServer((req, res) => {
    res.setHeader("content-type", "text/html")
    res.end(page)
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    // mock 服务器替换真实 Bing：直接验证解析逻辑（fetch 部分 monkey-patch）
    const port = server.address().port
    const origFetch = globalThis.fetch
    globalThis.fetch = async () => origFetch(`http://127.0.0.1:${port}/`)
    try {
      const ws = builtinTools.find((t) => t.name === "websearch")
      const out = await ws.execute({ query: "test", limit: 5 }, { cwd: process.cwd() })
      assert.match(out, /Node\.js 官网/)
      assert.match(out, /https:\/\/example\.com\/1/)
      assert.match(out, /Node\.js® 是一个运行时/)
      assert.match(out, /摘要·内容/)
    } finally {
      globalThis.fetch = origFetch
    }
  } finally {
    server.close()
  }
})

// ---------------------------------------------------------------- ls / fetch

test("ls: 目录列表（目录在前，含大小时间）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-ls-"))
  try {
    const { writeFile, mkdir } = await import("node:fs/promises")
    await mkdir(join(dir, "src"))
    await writeFile(join(dir, "a.txt"), "hello")
    const ls = builtinTools.find((t) => t.name === "ls")
    const out = await ls.execute({ path: dir }, { cwd: dir })
    const lines = out.split("\n")
    assert.match(lines[0], /^d  src\//) // 目录在前
    assert.match(lines[1], /^-  a\.txt\s+5\s/) // 文件带大小
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("fetch: HTML 转文本（直接测转换函数——本地服务器被 SSRF 防护拦截）", async () => {
  const { htmlToText, stripTags } = await import("../src/tools/shared.mjs")
  const html = `<html><head><style>body{color:red}</style><script>var x=1</script></head>
    <body><h1>标题</h1><p>第一段&nbsp;文字</p><ul><li>条目一</li><li>条目二</li></ul></body></html>`
  const out = htmlToText(html)
  assert.match(out, /标题/)
  assert.match(out, /第一段/)
  assert.match(out, /条目一/)
  assert.ok(!out.includes("var x=1")) // script 已剥除
  assert.ok(!out.includes("color:red")) // style 已剥除
})

test("fetch: 重定向目标做 SSRF 检查（302 跳内网被拦截，相对 URL 正确解析）", async () => {
  const { resolveRedirectTarget } = await import("../src/tools/web.mjs")
  const base = "https://public.example.com/a/b"

  // 相对重定向 → 解析为绝对
  assert.deepEqual(resolveRedirectTarget("/next", base), { target: "https://public.example.com/next" })
  // 绝对公网目标 → 放行
  assert.deepEqual(resolveRedirectTarget("https://cdn.example.com/x", base), { target: "https://cdn.example.com/x" })
  // 内网 / 元数据 / loopback → 拦截
  assert.ok(resolveRedirectTarget("http://127.0.0.1:8000/secret", base).error)
  assert.ok(resolveRedirectTarget("http://169.254.169.254/latest", base).error)
  assert.ok(resolveRedirectTarget("http://192.168.1.1/", base).error)
  // 非 http(s) → 拦截
  assert.ok(resolveRedirectTarget("file:///etc/passwd", base).error)
  // 非法 location → 报错
  assert.ok(resolveRedirectTarget("http://[", base).error)
})

test("websearch: Tavily 结构化搜索优先，无 key 回退 Bing", async () => {
  const { websearchTool } = await import("../src/tools/web.mjs")
  const origFetch = globalThis.fetch
  let hitTavily = false
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes("api.tavily.com")) {
      hitTavily = true
      return new Response(JSON.stringify({
        results: [
          { title: "Tavily Result", url: "https://example.com/a", content: "snippet A", score: 0.9 },
          { title: "Result 2", url: "https://example.com/b", content: "snippet B", score: 0.8 },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } })
    }
    throw new Error("should not reach Bing when Tavily is configured")
  }
  try {
    const ctx = { agent: { config: { proxy: { web: false }, websearch: { provider: "tavily", apiKey: "tvly-test" } } } }
    const out = await websearchTool.execute({ query: "test", limit: 2 }, ctx)
    assert.ok(hitTavily, "Tavily endpoint called")
    assert.match(out, /\[tavily\] Tavily Result/)
    assert.match(out, /snippet A/)
    assert.doesNotMatch(out, /\[bing\]/)
  } finally {
    globalThis.fetch = origFetch
  }

  // 无 key → 不回退到 Tavily（fetchTavily 返回 null），走 Bing（此处 mock 成空结果即可）
  globalThis.fetch = async () => new Response("", { status: 200 })
  try {
    const ctx = { agent: { config: { proxy: { web: false }, websearch: { provider: "tavily", apiKey: "" } } } }
    const out = await websearchTool.execute({ query: "test", limit: 2 }, ctx)
    assert.doesNotMatch(out, /\[tavily\]/, "no key → no tavily prefix")
  } finally {
    globalThis.fetch = origFetch
  }
})

// ---------------------------------------------------------------- bash 流式

test("bash: 流式输出实时透传（onOutput 分块到达）", async () => {
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

// ---------------------------------------------------------------- checkpoint 快照与回滚

test("checkpoint: 全量回滚被禁，单文件恢复可用（v2 全量副本）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind, listCheckpoints } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf, mkdir: mk, rm: del, access } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    // 初始化仓库：一个已跟踪文件
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 快照（含一个未跟踪文件）
    await writeFile(join(dir, "note.md"), "原始笔记\n")
    const cp = await createCheckpoint(dir)
    assert.ok(cp?.id)

    // 全量回滚被禁（跟 git checkout 一样危险——静默丢弃快照后所有工作）
    await assert.rejects(
      () => rewind(dir, cp.id),
      /Full rewind is disabled/,
    )

    // agent 搞破坏：改跟踪文件、删未跟踪文件、新建垃圾文件
    await writeFile(join(dir, "app.js"), "const v = 999 // 改坏了\n")
    await del(join(dir, "note.md"))
    await mk(join(dir, "src"), { recursive: true })
    await writeFile(join(dir, "src", "junk.js"), "agent 新建的文件\n")

    // 单文件恢复（逐个）
    const s1 = await rewind(dir, cp.id, { path: "app.js" })
    assert.equal(s1.restored, true)
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 1\n") // 跟踪文件还原
    const s2 = await rewind(dir, cp.id, { path: "note.md" })
    assert.equal(s2.restored, true)
    assert.equal(await rf(join(dir, "note.md"), "utf8"), "原始笔记\n") // 未跟踪文件还原
    // 快照后新建的文件不动
    assert.equal(await rf(join(dir, "src", "junk.js"), "utf8"), "agent 新建的文件\n")

    const cps2 = await listCheckpoints(dir)
    assert.ok(cps2.length >= 3) // 原始 + 两次恢复前的 pre-restore 快照
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checkpoint: 快照后 commit 再回滚仍然恢复（v2 副本与 HEAD 无关）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp2-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 快照（工作区修改 app.js）
    await writeFile(join(dir, "app.js"), "const v = 2 // snapshot state\n")
    const cp = await createCheckpoint(dir)
    assert.ok(cp?.id)

    // 快照后：commit 该修改 + 再改坏（v1 的 patch 基准在此失效）
    git("add", ".")
    git("commit", "-qm", "snapshot state")
    await writeFile(join(dir, "app.js"), "const v = 999 // 改坏了\n")

    // v2 回滚：副本覆盖，与 HEAD 无关（单文件恢复）
    const summary = await rewind(dir, cp.id, { path: "app.js" })
    const restored = (await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n")
    assert.equal(restored, "const v = 2 // snapshot state\n", "commit 后回滚仍恢复快照状态")
    assert.equal(summary.restored, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checkpoint: 超大文件跳过副本并提示（skipped 列表）", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, rewind } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cp3-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 大文件（>5MB 模拟：直接写 6MB）—— tracked
    await writeFile(join(dir, "big.bin"), Buffer.alloc(6 * 1024 * 1024, 1))
    const cp = await createCheckpoint(dir)
    assert.ok(cp.skipped.includes("big.bin"), "大文件进 skipped 列表: " + cp.skipped.join(","))

    // 改坏大文件后单文件恢复：skipped 文件明确报错（副本不存在，不可恢复）
    await writeFile(join(dir, "big.bin"), Buffer.alloc(6 * 1024 * 1024, 2))
    await assert.rejects(
      () => rewind(dir, cp.id, { path: "big.bin" }),
      /was NOT snapshotted/,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checkpoint: listFileVersions 区分同一文件的多个历史副本", async () => {
  const { execFileSync } = await import("node:child_process")
  const { createCheckpoint, listFileVersions, restoreFile } = await import("../src/git/checkpoint.mjs")
  const { writeFile, readFile: rf } = await import("node:fs/promises")

  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpv-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    await writeFile(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 三个快照，app.js 三个不同版本 + 一个 untracked 文件
    await writeFile(join(dir, "app.js"), "const v = 2\n")
    await writeFile(join(dir, "note.md"), "v1-note\n")
    const cp1 = await createCheckpoint(dir)

    await writeFile(join(dir, "app.js"), "const v = 3\n")
    await writeFile(join(dir, "note.md"), "v2-note\n")
    const cp2 = await createCheckpoint(dir)

    // 同一内容（v3 不变）再快照一次
    const cp3 = await createCheckpoint(dir)

    // tracked 文件：3 个版本，按时间倒序，sha 可区分，相同内容标注
    const versions = await listFileVersions(dir, "app.js")
    assert.equal(versions.length, 3)
    assert.equal(versions[0].snapshotId, cp3.id, "最新在前")
    assert.equal(versions[1].snapshotId, cp2.id)
    assert.equal(versions[2].snapshotId, cp1.id)
    assert.equal(versions[0].sha, versions[1].sha, "cp3 与 cp2 内容相同")
    assert.notEqual(versions[1].sha, versions[2].sha, "cp2 与 cp1 内容不同")
    assert.equal(versions[0].source, "tracked")
    assert.ok(versions[0].size > 0)

    // untracked 文件：3 个版本（cp3 时 note.md 未变但仍被快照），内容相同可识别
    const noteVersions = await listFileVersions(dir, "note.md")
    assert.equal(noteVersions.length, 3)
    assert.ok(noteVersions.every((v) => v.source === "untracked"))
    assert.equal(noteVersions[0].sha, noteVersions[1].sha, "cp3/cp2 内容相同")
    assert.notEqual(noteVersions[1].sha, noteVersions[2].sha, "cp2/cp1 内容不同")

    // 恢复指定版本：把 app.js 改坏后恢复到 cp1 的版本（v=2）
    await writeFile(join(dir, "app.js"), "const v = 999 // broken\n")
    const r = await restoreFile(dir, "app.js", cp1.id)
    assert.equal(r.restored, true)
    assert.equal((await rf(join(dir, "app.js"), "utf8")).replace(/\r\n/g, "\n"), "const v = 2\n", "恢复到 cp1 版本")

    // 未在快照中的文件 → 空列表
    assert.equal((await listFileVersions(dir, "never-existed.js")).length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checkpoint 工具：versions 子命令列出文件历史版本", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpver-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 2\n")
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]

    const out = await byName.git.execute({ action: "checkpoint", checkpointAction: "versions", path: "app.js" }, ctx)
    assert.ok(out.includes(id), `versions 应包含快照 id: ${out}`)
    assert.ok(out.includes("sha:"), "包含内容 hash")
    assert.match(out, /checkpointAction=rewind checkpointId=/, "提示恢复方式")

    // versions 缺 path 报错
    await assert.rejects(
      () => byName.git.execute({ action: "checkpoint", checkpointAction: "versions" }, ctx),
      /path is required for versions/,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checkpoint 工具：list / create / rewind 走工具入口", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cptool-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // create → list 能查到
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]
    const listed = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.ok(listed.includes(id))

    // 改坏 → 单文件 rewind 恢复（path 必填；全量恢复被禁）
    writeFileSync(join(dir, "app.js"), "const v = 999\n")
    await assert.rejects(
      () => byName.git.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id }, ctx),
      /path is required for rewind/,
    )
    await byName.git.execute({ action: "checkpoint", checkpointAction: "rewind", checkpointId: id, path: "app.js" }, ctx)
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n")

    // rewind 缺 id 报错；非 git 仓库报错
    await assert.rejects(() => byName.git.execute({ action: "checkpoint", checkpointAction: "rewind" }, ctx), /checkpointId is required/)
    const plain = mkdtempSync(join(tmpdir(), "thincoder-cptool-plain-"))
    await assert.rejects(() => byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, { cwd: plain }), /Not a git repository/)
    rmSync(plain, { recursive: true, force: true })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("bash 工具：git 破坏性命令先快照后放行（未提交工作不丢且命令正常执行）", async () => {
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
    rmSync(dir, { recursive: true, force: true })
  }
})

test("bash 工具：变体 git checkout HEAD -- . 同样快照后放行", async () => {
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
    rmSync(dir, { recursive: true, force: true })
  }
})

test("bash 工具：非破坏性 git 命令不触发保护；非 git 仓库静默放行", async () => {
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

test("checkpoint 工具：list 的文件名做 XML 转义（防注入模型上下文）", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cpxml-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    // Windows 合法但 XML 敏感的字符 & ' 出现在文件名里（<>"/" Windows 不允许）
    writeFileSync(join(dir, "a&'b'.txt"), "x\n")
    const created = await byName.git.execute({ action: "checkpoint", checkpointAction: "create" }, ctx)
    const id = created.match(/Checkpoint (\S+) created/)[1]

test("bash 工具：后台进程不卡死（子进程持有管道，grace 兜底返回）", async () => {
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


    const overview = await byName.git.execute({ action: "checkpoint", checkpointAction: "list" }, ctx)
    assert.ok(overview.includes("a&amp;&apos;b&apos;.txt"), `overview 应转义文件名: ${overview}`)
    assert.ok(!overview.includes("a&'b'.txt"))

    const tree = await byName.git.execute({ action: "checkpoint", checkpointAction: "list", checkpointId: id }, ctx)
    assert.ok(tree.includes("a&amp;&apos;b&apos;.txt"), `file tree 应转义文件名: ${tree}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("bash 护栏：checkout ./restore/clean -f/链式写法先快照后放行，安全写法不触发", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-guard-"))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" })
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  const ctx = { cwd: dir }
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "app.js"), "const v = 2\n") // 未提交改动 → 快照保护对象

    // 这些命令全部放行（不拦截模型 git 操作），但执行前自动快照
    for (const cmd of [
      "git checkout .",
      "git checkout -- app.js",
      "git reset --hard",
      "git restore app.js",
      "git restore .",
      "git clean -fd",
      "echo ok && git checkout .",   // 链式绕过
      "cd . ; git reset --hard HEAD", // 分号链式
    ]) {
      const r = await byName.bash.execute({ command: cmd }, ctx)
      assert.match(r, /\[auto-protection\]/, `${cmd} 应快照后放行: ${r.slice(0, 80)}`)
    }

    // 命令已执行（app.js 被重置回 v1），但从快照可恢复未提交改动
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 1\n")
    const { listCheckpoints, rewind } = await import("../src/git/checkpoint.mjs")
    const cps = await listCheckpoints(dir)
    assert.ok(cps.length >= 1, "应有自动快照")
    // 倒序（最新→最旧）：最旧 = 第一个命令前的快照（app.js 仍为 v2）——单文件恢复
    await rewind(dir, cps[cps.length - 1].id, { path: "app.js" })
    assert.equal(readFileSync(join(dir, "app.js"), "utf8").replace(/\r\n/g, "\n"), "const v = 2\n", "快照恢复未提交改动")

    // 安全写法不误伤：切分支（无路径）、restore --staged、clean -n dry-run —— 不触发快照
    for (const cmd of ["git checkout -b feature-x", "git restore --staged app.js", "git clean -nd"]) {
      const r = await byName.bash.execute({ command: cmd }, ctx)
      assert.ok(!r.includes("[auto-protection]"), `${cmd} 不应触发快照`)
    }
    git("checkout", "-q", "-") // 回到原分支，清理
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("bash 护栏：重定向检测引号感知——脚本内比较运算符不误伤，真重定向仍拦截", async () => {
  const { hasFileRedirection } = await import("../src/tools/shared.mjs")
  // 放行：引号脚本里的 > < => 比较/箭头函数不是重定向
  for (const ok of [
    `node -e "if (a.length > 0) console.log(a)"`,
    `node -e "const f = (x) => x * 2"`,
    `node -e "while (i < 10) i++"`,
    `echo "a > b"`,
    `node -e 'console.log(JSON.stringify({a:1}))'`,
  ]) {
    assert.equal(hasFileRedirection(ok), false, `不应误判: ${ok}`)
  }
  // 拦截：引号外的真实重定向（含 heredoc、fd 前缀、反引号命令替换）
  for (const blocked of [
    "echo hi > out.txt",
    "echo hi >> out.txt",
    "cat < input.txt",
    "echo ok && node app.js > log.txt",
    "cat << EOF",
    "node app.js 2> err.txt",
    "node app.js 1>> log.txt",
    "echo `cat > /tmp/evil`", // 反引号是命令替换——内容执行，> 必须拦
    "grep x file `echo y > z`",
  ]) {
    assert.equal(hasFileRedirection(blocked), true, `应拦截: ${blocked}`)
  }
})

test("stripTags: out-of-range numeric entities do not throw (RangeError guard)", async () => {
  const { stripTags } = await import("../src/tools/shared.mjs")
  assert.equal(stripTags("x &#999999999999; y"), "x &#999999999999; y", "invalid entity kept as-is")
  assert.equal(stripTags("&#x110000;"), "&#x110000;", "out-of-Unicode hex entity kept as-is")
  assert.equal(stripTags("&#65;&#x42; ok"), "AB ok", "valid numeric entities still decode")

test("htmlToText: malformed numeric entities do not throw (mirrors stripTags guard)", async () => {
  const { htmlToText } = await import("../src/tools/shared.mjs")
  assert.equal(htmlToText("x &#999999999999; y"), "x &#999999999999; y", "out-of-range entity kept as-is")
  assert.equal(htmlToText("&#65;&#x42; ok"), "AB ok", "valid numeric entities still decode")
})

})

test("isDestructiveCommand: 决策——全部放行(文本拦截是安全剧场,防线在审批层+快照)", async () => {
  const { isDestructiveCommand } = await import("../src/tools/shared.mjs")
  // 文件系统删除类也不再拦截:恶意模型可绕过(空白/heredoc/node -e),拦截只误伤正常操作
  assert.equal(isDestructiveCommand("rm --recursive /tmp/x"), false)
  assert.equal(isDestructiveCommand("rm -rf /tmp/x"), false)
  assert.equal(isDestructiveCommand("rmdir /tmp/x"), false)
  assert.equal(isDestructiveCommand("shred /tmp/x"), false)
  assert.equal(isDestructiveCommand("dd if=/dev/zero of=/dev/sda"), false)
  // 普通命令同样放行
  assert.equal(isDestructiveCommand("rm somefile.txt"), false)
  // SQL 关键词放行(上一轮决策)
  assert.equal(isDestructiveCommand("node scripts/db.mjs query \"DELETE FROM t\" --write"), false)
})


// ---------------------------------------------------------------- skills 系统

test("skills: load / list / read", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-skills-"))
  try {
    const skillDir = join(dir, ".thincoder", "skills")
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(join(skillDir, "deploy.md"), "# Deploy\nPush to production.")
    writeFileSync(join(skillDir, "review.md"), "# Review\nCheck the diff.\n## Steps\n- read diff\n- run tests")
    writeFileSync(join(skillDir, "lint.md"), "---\nname: lint\n---\n# Lint\nRun the linter.")
    writeFileSync(join(skillDir, "not-a-skill.txt"), "ignore me")

    const skills = await loadSkills(dir)
    assert.equal(skills.length, 3)
    assert.equal(skills[0].name, "deploy")
    assert.equal(skills[0].description, "Push to production.")
    assert.equal(skills[1].name, "lint")
    assert.equal(skills[1].description, "Run the linter.") // frontmatter 字段行不误当描述
    assert.equal(skills[2].name, "review")

    const listing = formatSkillListing(skills)
    assert.ok(listing.includes("deploy"))
    assert.ok(listing.includes("review"))

    const body = await readSkill(dir, "deploy")
    assert.equal(body, "# Deploy\nPush to production.")
    assert.equal(await readSkill(dir, "nonexistent"), null)
    assert.equal(await readSkill(dir, "../../etc/passwd"), null) // 路径穿越被正则拦截
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("skills: empty dir returns empty", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-skempty-"))
  try {
    assert.deepEqual(await loadSkills(dir), [])
    assert.equal(formatSkillListing([]), "")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- distill

test("distill: saveCandidate tags 归一化（LLM 输出不可信）", async () => {
  const m = freshMemory()
  // 字符串 tags 按逗号/空白切分
  const r1 = await saveCandidate(m, { type: "knowledge", title: "t1", content: "c1", tags: "a, b c" })
  assert.ok(r1.startsWith("personal#"))
  // 非字符串非数组 tags 不崩
  const r2 = await saveCandidate(m, { type: "knowledge", title: "t2", content: "c2", tags: 42 })
  assert.ok(r2.startsWith("personal#"))
})

test("distill: historyToTranscript 容忍缺失 function 的 tool_call", () => {
  const text = historyToTranscript([
    { role: "user", content: "hi" },
    { role: "assistant", content: "", tool_calls: [{ function: { name: "read", arguments: "{}" } }, { id: "broken" }] },
  ])
  assert.ok(text.includes("read("))
  assert.ok(text.includes("?(")) // 缺失 function 的占位不抛 TypeError
})

// ---------------------------------------------------------------- 内建工具

test("plan: enter/exit toggles agent state", async () => {
  const agent = {}
  await planTool.execute({ action: "enter" }, { agent })
  assert.equal(agent.planMode, true)
  await planTool.execute({ action: "exit" }, { agent })
  assert.equal(agent.planMode, false)
})

test("goal: set / cancel", async () => {
  const agent = {}
  const r1 = await goalTool.execute({ action: "set", objective: "完成 MCP", criteria: "全部测试通过" }, { agent })
  assert.ok(r1.includes("完成 MCP"))
  assert.equal(agent.goal.objective, "完成 MCP")
  assert.equal(agent.goal.criteria, "全部测试通过")

  const r2 = await goalTool.execute({ action: "cancel" }, { agent })
  assert.equal(agent.goal, null)
  assert.ok(r2.includes("cancelled"))
})

test("verify: git diff stat in mock repo", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "x.js"), "1\n")
    git("add", ".")
    git("commit", "-qm", "init")
    writeFileSync(join(dir, "x.js"), "2\n")

    const agent = { cwd: dir, tasks: [{ title: "改好了", status: "done" }] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("x.js"))
    assert.ok(result.includes("1/1 done"))
    assert.ok(result.includes("Self-review checklist"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("verify: quick 模式下语法失败不能算通过（_verifyPassed=false）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-syn-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    writeFileSync(join(dir, "x.js"), "1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 改出一个语法错误文件 → quick verify 必须标记失败（完成守卫靠这个推回修复）
    writeFileSync(join(dir, "x.js"), "const = 1\n")
    const agent = { cwd: dir, tasks: [] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("syntax error"))
    assert.strictEqual(agent._verifyPassed, false)

    // 修好后 quick verify 通过
    writeFileSync(join(dir, "x.js"), "const v = 1\n")
    await verifyTool.execute({}, { agent })
    assert.strictEqual(agent._verifyPassed, true)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("verify: doc-only 改动走快路径（不跑语法检查/测试/任务列表/自检清单）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-doc-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "docs", "design"), { recursive: true })
    writeFileSync(join(dir, "README.md"), "# readme\n")
    writeFileSync(join(dir, "docs/design/PLAN.md"), "# plan\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 纯文档改动（.md）→ 快路径
    writeFileSync(join(dir, "README.md"), "# readme v2\n")
    writeFileSync(join(dir, "docs/design/PLAN.md"), "# plan v2\n")
    const agent = { cwd: dir, tasks: [{ title: "未完成", status: "pending" }] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(result.includes("Documentation-only changes"), result)
    assert.strictEqual(agent._verifyPassed, true)
    assert.ok(!result.includes("Syntax check"), "no syntax checks on doc-only")
    assert.ok(!result.includes("Related tests"), "no tests on doc-only")
    assert.ok(!result.includes("Task list"), "no task list on doc-only")
    assert.ok(!result.includes("Self-review checklist"), "no checklist on doc-only")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("verify: mixed 改动（文档+代码）不走快路径，语法检查照常", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-verify-mixed-"))
  const { execSync } = await import("node:child_process")
  const git = (...a) => execSync(`git ${a.join(" ")}`, { cwd: dir, stdio: "ignore" })
  try {
    git("init", "-q")
    git("config", "user.name", "t")
    git("config", "user.email", "t@t.dev")
    mkdirSync(join(dir, "src"), { recursive: true })
    writeFileSync(join(dir, "README.md"), "# readme\n")
    writeFileSync(join(dir, "src/app.js"), "const v = 1\n")
    git("add", ".")
    git("commit", "-qm", "init")

    // 文档 + 代码混合改动 → 全量路径
    writeFileSync(join(dir, "README.md"), "# readme v2\n")
    writeFileSync(join(dir, "src/app.js"), "const v = 2\n")
    const agent = { cwd: dir, tasks: [] }
    const result = await verifyTool.execute({}, { agent })
    assert.ok(!result.includes("Documentation-only changes"), result)
    assert.ok(result.includes("Syntax check"), "syntax checks still run on mixed changes")
    assert.ok(result.includes("Self-review checklist"), "full path still shows the checklist")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- delete / git 工具

test("delete: 未跟踪文件可删，跟踪文件拒绝，force 可删跟踪文件", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-del-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir })
    execFileSync("git", ["config", "user.name", "t"], { cwd: dir })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: dir })
    writeFileSync(join(dir, "tracked.js"), "1\n")
    writeFileSync(join(dir, "untracked.js"), "2\n")
    execFileSync("git", ["add", "tracked.js"], { cwd: dir })
    execFileSync("git", ["commit", "-qm", "init"], { cwd: dir })

    const del = builtinTools.find((t) => t.name === "delete")
    const ctx = { cwd: dir }

    // 未跟踪文件可删
    const r1 = await del.execute({ path: "untracked.js" }, ctx)
    assert.ok(r1.includes("Deleted"))
    assert.ok(!existsSync(join(dir, "untracked.js")))

    // 跟踪文件拒绝
    await assert.rejects(() => del.execute({ path: "tracked.js" }, ctx), /git-tracked/)

    // force 可删跟踪文件
    await del.execute({ path: "tracked.js", force: true }, ctx)
    assert.ok(!existsSync(join(dir, "tracked.js")))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("git_diff / git_status / git_log: 只读 git 工具", async () => {
  const { execFileSync } = await import("node:child_process")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-git-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir })
    execFileSync("git", ["config", "user.name", "t"], { cwd: dir })
    execFileSync("git", ["config", "user.email", "t@t.dev"], { cwd: dir })
    // 关闭 autocrlf，避免 Windows 下 git 自动转换导致 porcelain 输出格式变化
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: dir })
    writeFileSync(join(dir, "a.js"), "1\n")
    execFileSync("git", ["add", "a.js"], { cwd: dir })
    execFileSync("git", ["commit", "-qm", "first"], { cwd: dir })
    writeFileSync(join(dir, "a.js"), "2\n")
    writeFileSync(join(dir, "b.js"), "3\n")

    const ctx = { cwd: dir }
    const git = builtinTools.find((t) => t.name === "git")

    // git diff
    const diff = await git.execute({ action: "diff" }, ctx)
    assert.ok(diff.includes("a.js"))

    // git status
    const status = await git.execute({ action: "status" }, ctx)
    assert.ok(status.includes("a.js"), `missing a.js: ${status}`)
    assert.ok(status.includes("b.js"), `missing b.js: ${status}`)
    assert.ok(
      status.includes("Staged") || status.includes("Unstaged"),
      `missing Staged/Unstaged label: ${status}`,
    )
    assert.ok(status.includes("Untracked"), `missing Untracked: ${status}`)

    // git log
    const log = await git.execute({ action: "log", count: 1 }, ctx)
    assert.ok(log.includes("first"))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("question: 回调返回用户回答", async () => {
  const qTool = builtinTools.find((t) => t.name === "question")
  // 模拟一个直接返回固定回答的 onQuestion
  const ctx = { cwd: process.cwd(), onQuestion: async (text) => "选方案A" }
  const result = await qTool.execute({ question: "选哪个？" }, ctx)
  assert.equal(result, "选方案A")
})

test("question: 无回调时抛错", async () => {
  const qTool = builtinTools.find((t) => t.name === "question")
  const ctx = { cwd: process.cwd() }
  await assert.rejects(() => qTool.execute({ question: "?" }, ctx), /not supported/)
})

// ---------------------------------------------------------------- hashline_edit

test("hashline_edit: 按哈希定位替换单行", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "const x = 1\nconst y = 2\nconst z = 3\n" }, ctx)

    // Read with hashes to get line hashes
    const readOut = await byName.read.execute({ path: "f.mjs", hashes: true }, ctx)
    // Parse hash from output: "1\t[abc123def456] const x = 1"
    const line1Hash = readOut.split("\n")[0].match(/\[([a-f0-9]{12})\]/)[1]

    // Replace line 1 with new content using hash
    const out = await byName.hashline_edit.execute({
      path: "f.mjs",
      old_hashes: [line1Hash],
      new_content: "const x = 42",
    }, ctx)
    assert.match(out, /replaced 1 line/)

    const updated = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.match(updated, /const x = 42/)
    assert.match(updated, /const y = 2/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("hashline_edit: 多行替换", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\nline3\nline4\n" }, ctx)

    const readOut = await byName.read.execute({ path: "f.mjs", hashes: true }, ctx)
    const lines = readOut.split("\n")
    const h2 = lines[1].match(/\[([a-f0-9]{12})\]/)[1]
    const h3 = lines[2].match(/\[([a-f0-9]{12})\]/)[1]

    const out = await byName.hashline_edit.execute({
      path: "f.mjs",
      old_hashes: [h2, h3],
      new_content: "replaced_A\nreplaced_B",
    }, ctx)
    assert.match(out, /replaced 2 line/)

    const updated = await byName.read.execute({ path: "f.mjs" }, ctx)
    assert.match(updated, /line1/)
    assert.match(updated, /replaced_A/)
    assert.match(updated, /replaced_B/)
    assert.match(updated, /line4/)
    assert.doesNotMatch(updated, /line2/)
    assert.doesNotMatch(updated, /line3/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("hashline_edit: hash 未匹配时报错含当前哈希", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello world\n" }, ctx)

    await assert.rejects(
      () => byName.hashline_edit.execute({
        path: "f.mjs",
        old_hashes: ["deadbeef0000"],
        new_content: "nope",
      }, ctx),
      /Hash sequence not found/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("hashline_edit: 多个匹配时报错列出所有位置", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-hashline-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // File with multiple empty lines — all have the same hash
    const lines = [
      "// file with blanks",  // unique hash
      "",                       // empty-line hash (collides across all empties)
      "const a = 1",            // unique hash
      "",                       // collides
      "const b = 2",            // unique hash
      "",                       // collides
    ]
    await byName.write.execute({ path: "f.mjs", content: lines.join("\n") }, ctx)

    // Try to replace a single empty line — it will match 3 positions
    const emptyHash = hashLine("")
    await assert.rejects(
      () => byName.hashline_edit.execute({
        path: "f.mjs",
        old_hashes: [emptyHash],
        new_content: "// replaced",
      }, ctx),
      /matches 3 positions.*ambiguous/s
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- normalizeEOL (Windows line endings)

test("normalizeEOL: \\r\\n file → edit matches with \\n only", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // Write file with Windows line endings directly to disk (bypass write tool which uses \n)
    writeFileSync(join(dir, "f.mjs"), "hello\r\nworld\r\n", "utf8")

    // edit should still match with \n-only old_string (normalizeEOL kicks in)
    const out = await byName.edit.execute({
      path: "f.mjs",
      old_string: "hello\nworld",
      new_string: "replaced",
    }, ctx)
    assert.ok(out.includes("replaced 1 occurrence"), out)

    // Verify final content has \n only (tools always write \n)
    const content = readFileSync(join(dir, "f.mjs"), "utf8")
    assert.strictEqual(content, "replaced\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("normalizeEOL: hashes are consistent regardless of \\r\\n", async () => {
  const { hashLine } = await import("../src/tools/file.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-eol2-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    // Write file with \r\n, reading should give same hashes as \n-only version
    writeFileSync(join(dir, "crlf.mjs"), "const a = 1\r\nconst b = 2\r\n", "utf8")

    const readOut = await byName.read.execute({ path: "crlf.mjs", hashes: true }, ctx)
    const hash1 = readOut.split("\n")[0].match(/\[([a-f0-9]{12})\]/)[1]

    // Compare against hash of \n-only line
    const expectedHash = hashLine("const a = 1")
    assert.strictEqual(hash1, expectedHash)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- insert_after regex validation

test("insert_after: invalid regex gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-re-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello\nworld\n" }, ctx)
    await byName.read.execute({ path: "f.mjs" }, ctx) // clear the dirty flag (read-before-insert guard)

    await assert.rejects(
      () => byName.insert_after.execute({
        path: "f.mjs",
        after_regex: "**bad**",
        content: "// inserted",
      }, ctx),
      /not a valid JavaScript regex/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("insert_after: refuses on a dirty file (modified since last read) — stale line-number guard", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-dirty-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "line1\nline2\n" }, ctx)

    // write marks the file dirty → insert_after must refuse (line numbers stale)
    await assert.rejects(
      () => byName.insert_after.execute({ path: "f.mjs", after_line: 1, content: "x" }, ctx),
      /was modified since your last read/
    )

    // read clears the dirty flag → insert_after works again
    await byName.read.execute({ path: "f.mjs" }, ctx)
    const out = await byName.insert_after.execute({ path: "f.mjs", after_line: 1, content: "inserted" }, ctx)
    assert.ok(out.includes("Inserted after line 1"), "fresh read → insert allowed")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("insert_after: fresh file (never written this session) works without a prior read", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-insert-fresh-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "g.mjs"), "a\nb\n", "utf8") // created outside the tool chain — not dirty
    const out = await byName.insert_after.execute({ path: "g.mjs", after_line: 1, content: "mid" }, ctx)
    assert.ok(out.includes("Inserted after line 1"), "non-dirty file inserts immediately")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- grep regex validation

test("grep: invalid regex gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-re-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await byName.write.execute({ path: "f.mjs", content: "hello\nworld\n" }, ctx)

    await assert.rejects(
      () => byName.grep.execute({ pattern: "**bad**", path: "." }, ctx),
      /not a valid regex/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- grep \r\n normalization

test("grep: \\r\\n file still matches", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-eol-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    writeFileSync(join(dir, "crlf.mjs"), "hello world\r\nconst x = 1\r\n", "utf8")

    const out = await byName.grep.execute({ pattern: "hello", path: "." }, ctx)
    assert.ok(out.includes("crlf.mjs"), out)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- ls missing directory

test("ls: missing directory gives helpful error", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-ls-"))
  const ctx = { cwd: dir }
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  try {
    await assert.rejects(
      () => byName.ls.execute({ path: "nonexistent" }, ctx),
      /not found/
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- checklist ID round-trip regression

import { checklistTool } from "../src/tools/checklist.mjs"

test("checklist: ID 前缀往返不叠加（add→write→parse→write 循环保持单一前缀）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl-"))
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "add", item: "第一项" }, ctx)
    checklistTool.execute({ action: "add", item: "第二项" }, ctx)
    // mark done → parse → write 往返
    checklistTool.execute({ action: "mark", index: 1, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 1, status: "pending" }, ctx)
    checklistTool.execute({ action: "mark", index: 2, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 2, status: "pending" }, ctx)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    // 往返多次后每行 ID 只出现一次，绝不能 "T1: T1:"
    assert.doesNotMatch(content, /T1: T1/)
    assert.doesNotMatch(content, /T2: T2/)
    assert.match(content, /- \[ \] T1: 第一项/)
    assert.match(content, /- \[ \] T2: 第二项/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("checklist: 手写带前缀的存量文件往返一次后前缀不翻倍", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cl2-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  writeFileSync(join(dir, ".thincoder", "checklist.md"), "- [ ] T1: 存量任务\n")
  const ctx = { cwd: dir }
  try {
    checklistTool.execute({ action: "mark", index: 1, status: "in_progress" }, ctx)
    checklistTool.execute({ action: "mark", index: 1, status: "pending" }, ctx)
    const content = readFileSync(join(dir, ".thincoder", "checklist.md"), "utf-8")
    assert.doesNotMatch(content, /T1: T1/)
    assert.match(content, /- \[ \] T1: 存量任务/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------- execute tool regressions

import { codeModeTool } from "../src/tools/codemode.mjs"

test("execute: timeout 生效——无限循环脚本在限定时间内返回错误而不是挂死", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec-"))
  try {
    const out = await codeModeTool.execute({ code: "while (true) {}", timeoutMs: 300 }, { cwd: dir })
    assert.match(out, /Error/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("execute: require()/process 可用（无伪沙箱——bash 本就能触达任意 Node API）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec2-"))
  try {
    const out = await codeModeTool.execute({ code: 'const fs = require("node:fs"); log(typeof fs.readFileSync, typeof process.cwd)' }, { cwd: dir })
    assert.equal(out, "function function")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("execute: 正常沙箱行为不受影响（log/readFile/grep）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec3-"))
  writeFileSync(join(dir, "f.txt"), "hello\nworld\n")
  try {
    const out = await codeModeTool.execute({ code: 'log(grep("wor", "f.txt").join(","))' }, { cwd: dir })
    assert.equal(out, "2: world")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("execute: 顶层 await + import() 项目 ESM + console + filter", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-exec4-"))
  try {
    writeFileSync(join(dir, "mod.mjs"), 'export const name = "mod"\n')
    const imp = await codeModeTool.execute({ code: 'const m = await import("./mod.mjs"); console.log(m.name)' }, { cwd: dir })
    assert.equal(imp, "mod")

    const filt = await codeModeTool.execute({ code: 'console.log("a")\nconsole.log("b")', filter: "a" }, { cwd: dir })
    assert.equal(filt, "a")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("isPrivateHost: blocks loopback, private ranges, metadata, link-local (SSRF guard)", () => {
  const blocked = [
    "localhost", "LOCALHOST", "foo.localhost", "0.0.0.0",
    "127.0.0.1", "127.0.0.2", "127.42.42.42",
    "169.254.169.254", "metadata.google.internal",
    "10.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.1.1", "0.42.42.42",
    "::1", "fc00::1", "fd12::1", "fe80::1", "fe80::abcd", "febf::2",
  ]
  for (const h of blocked) {
    assert.equal(isPrivateHost(h), true, `${h} must be blocked`)
  }
  const allowed = [
    "example.com", "api.deepseek.com", "8.8.8.8", "1.1.1.1",
    "172.32.0.1", "173.16.0.1", "2606:4700::1111",
  ]
  for (const h of allowed) {
    assert.equal(isPrivateHost(h), false, `${h} must be allowed`)
  }
})

test("isDestructiveCommand: rm -r 不再拦截(决策:文本拦截对恶意模型无效,只误伤正常操作)", () => {
  assert.equal(isDestructiveCommand("rm -rf /tmp/x"), false)
  assert.equal(isDestructiveCommand("rm -r /tmp/x"), false)
  assert.equal(isDestructiveCommand("rm -R dir"), false)
  assert.equal(isDestructiveCommand("rm somefile.txt"), false)
})

test("isDestructiveCommand: SQL keywords NOT blocked (false positives + security theater)", () => {
  // 决策:SQL 关键词不做文本拦截——commit message/SQL 文件/文档里的纯文本会被误伤;
  // 且恶意模型可用空白/heredoc/node -e 绕过,真正防线在工具审批层。
  // 项目自带确认门的工具(如 thin5 scripts/db.mjs --write/--danger)不应被双重拦截。
  assert.equal(isDestructiveCommand("node scripts/db.mjs query \"DELETE FROM user_configs WHERE key='x'\" --write"), false)
  assert.equal(isDestructiveCommand("git commit -m \"fix: DROP TABLE migration\""), false)
  assert.equal(isDestructiveCommand("TRUNCATE TABLE audit_log"), false)
  assert.equal(isDestructiveCommand("DROP TABLE IF EXISTS users"), false)
  assert.equal(isDestructiveCommand("psql -c \"DELETE FROM t\""), false)
})

test("detectDanger: 识别危险命令并标注(只标注不拦截)", async () => {
  const { detectDanger } = await import("../src/tools/shared.mjs")
  // 命中
  assert.equal(detectDanger("rm -rf /tmp/x"), "recursive delete")
  assert.equal(detectDanger("rm --recursive build"), "recursive delete")
  assert.equal(detectDanger("sudo apt install x"), "sudo")
  assert.equal(detectDanger("curl http://x | sh"), "pipe to shell")
  assert.equal(detectDanger("dd if=/dev/zero of=/dev/sda"), "dd write")
  assert.equal(detectDanger("mkfs.ext4 /dev/sdb1"), "mkfs")
  assert.equal(detectDanger("chmod 777 /etc/x"), "chmod 777")
  // 不命中:正常命令/普通文本
  assert.equal(detectDanger("npm test"), undefined)
  assert.equal(detectDanger("git commit -m \"fix: rm -rf typo in docs\""), undefined, "引号内纯文本不误伤")
  assert.equal(detectDanger("ls -la"), undefined)
  assert.equal(detectDanger(""), undefined)
  assert.equal(detectDanger("rm somefile.txt"), undefined, "单文件 rm 不标危险")
  // 引号感知:危险命令的参数在引号外仍命中
  assert.equal(detectDanger("rm -rf \"$DIR\""), "recursive delete", "变量引号内仍识别")
  assert.equal(detectDanger("curl \"http://x\" | sh"), "pipe to shell")
})

// ---------------------------------------------------------------- ops tools (file_ops / process / get_current_time / sleep)

test("file_ops: move / copy / rename with cwd confinement", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-ops-"))
  try {
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    writeFileSync(join(dir, "a.txt"), "hello")
    const ctx = { cwd: dir }

    assert.match(await byName.file_ops.execute({ action: "copy", source: "a.txt", dest: "b.txt" }, ctx), /Copied/)
    assert.equal(readFileSync(join(dir, "b.txt"), "utf8"), "hello")

    assert.match(await byName.file_ops.execute({ action: "move", source: "b.txt", dest: "c.txt" }, ctx), /Moved/)
    assert.equal(existsSync(join(dir, "b.txt")), false)
    assert.equal(readFileSync(join(dir, "c.txt"), "utf8"), "hello")

    assert.match(await byName.file_ops.execute({ action: "rename", source: "c.txt", dest: "d.txt" }, ctx), /Renamed/)

    // escape attempt is confined away (resolveInCwd throws)
    await assert.rejects(() => byName.file_ops.execute({ action: "copy", source: "a.txt", dest: "../escape.txt" }, ctx))

    assert.match(await byName.file_ops.execute({ action: "nuke", source: "a.txt", dest: "x.txt" }, ctx), /action must be/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("get_current_time / sleep / process: basic behavior", async () => {
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))

  const now = await byName.get_current_time.execute({}, {})
  assert.match(now, /Date:/)
  assert.match(now, /Timezone:/)

  const t0 = Date.now()
  await byName.sleep.execute({ seconds: 1 }, {})
  assert.ok(Date.now() - t0 >= 900, "sleeps ~1s")

  const procs = await byName.process.execute({ name: "node" }, {})
  assert.match(procs, /PID/, "process listing returns PID rows")
})

test("grep literal + ignoreCase; ls filter", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-grep-"))
  try {
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    writeFileSync(join(dir, "a.js"), "function foo.bar() {}\nFOOBAR\nx\n")
    writeFileSync(join(dir, "b.txt"), "nothing")
    const ctx = { cwd: dir }

    const lit = await byName.grep.execute({ pattern: "foo.bar()", literal: true, path: "a.js" }, ctx)
    assert.match(lit, /foo\.bar\(\)/, "literal match — regex specials not interpreted")

    const ic = await byName.grep.execute({ pattern: "foobar", ignoreCase: true, path: "a.js" }, ctx)
    assert.match(ic, /FOOBAR/, "ignoreCase matches case variant")

    const ls = await byName.ls.execute({ filter: "*.js", path: "." }, ctx)
    assert.match(ls, /a\.js/, "ls filter keeps matching entry")
    assert.doesNotMatch(ls, /b\.txt/, "ls filter excludes non-matching entry")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("apply_patch: multiple hunks in one file stay aligned after line-count drift", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-patch-"))
  try {
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    writeFileSync(join(dir, "f.txt"), "one\ntwo\nthree\nfour\nfive\nsix\nseven\n")
    const ctx = { cwd: dir }
    // hunk 1 inserts a line (shift), so hunk 2's target drifts from its @@ line number
    const patch = `--- a/f.txt
+++ b/f.txt
@@ -1,3 +1,4 @@
 one
+oneAndHalf
 two
 three
@@ -5,3 +5,3 @@
 five
-six
+sixX
 seven
`
    const out = await byName.apply_patch.execute({ patch }, ctx)
    assert.match(out, /Applied patch/)
    assert.equal(readFileSync(join(dir, "f.txt"), "utf8"), "one\noneAndHalf\ntwo\nthree\nfour\nfive\nsixX\nseven\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("tree: depth-limited directory tree", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-tree-"))
  try {
    mkdirSync(join(dir, "src/nested/deep"), { recursive: true })
    writeFileSync(join(dir, "src/a.js"), "x")
    writeFileSync(join(dir, "src/nested/b.js"), "x")
    writeFileSync(join(dir, "root.txt"), "x")
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    const out = await byName.tree.execute({ depth: 2 }, { cwd: dir })
    assert.match(out, /src\//, "lists directory with trailing slash")
    assert.match(out, /root\.txt/, "lists root file")
    assert.doesNotMatch(out, /deep/, "depth limit excludes deeper levels")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

