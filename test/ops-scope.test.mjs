/**
 * ops-scope.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tools.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { builtinTools } from "../src/tools/index.mjs"
import { isPrivateHost, isDestructiveCommand } from "../src/tools/shared.mjs"


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



test("fetch: HTML 转文本（直接测转换函数——本地服务器被 SSRF 防护拦截）", async () => {
  const { htmlToText } = await import("../src/tools/shared.mjs")
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



test("fetch §14: 网络失败结果含 proxy 提示行（T-TF4——D-TF3 逐字——localhost 关闭端口连接拒绝）", async () => {
  const { fetchTool } = await import("../src/tools/web.mjs")
  // 目标 = 公网域名（过 SSRF 检查）；代理 = localhost 关闭端口（127.0.0.1:1）→ 连接拒绝快速失败（无超时等待）
  // 语义同时验证：失败即建议显式传 proxy 重试（2026-08-31 裁定——不自动路由）
  const err = await fetchTool.execute({ url: "http://example.invalid/", proxy: "http://127.0.0.1:1" }, { agent: { config: {} } }).then(() => null, (e) => e)
  assert.ok(err, "fetch should fail")
  assert.match(err.message, /fetch failed/)
  assert.ok(
    err.message.includes("network failure — retry with proxy: 'http://host:port' if the target is blocked"),
    "T-TF4: 网络失败错误含 proxy 提示行（D-TF3 逐字）",
  )
})



test("websearch: Tavily 结构化搜索优先，无 key 回退 Bing", async () => {
  const { websearchTool } = await import("../src/tools/web.mjs")
  const origFetch = globalThis.fetch
  let hitTavily = false
  globalThis.fetch = async (url, _opts) => {
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




test("stripTags: out-of-range numeric entities do not throw (RangeError guard)", async () => {
  const { stripTags } = await import("../src/tools/shared.mjs")
  assert.equal(stripTags("x &#999999999999; y"), "x &#999999999999; y", "invalid entity kept as-is")
  assert.equal(stripTags("&#x110000;"), "&#x110000;", "out-of-Unicode hex entity kept as-is")
  assert.equal(stripTags("&#65;&#x42; ok"), "AB ok", "valid numeric entities still decode")
})



test("htmlToText: malformed numeric entities do not throw (mirrors stripTags guard)", async () => {
  const { htmlToText } = await import("../src/tools/shared.mjs")
  assert.equal(htmlToText("x &#999999999999; y"), "x &#999999999999; y", "out-of-range entity kept as-is")
  assert.equal(htmlToText("&#65;&#x42; ok"), "AB ok", "valid numeric entities still decode")
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



test("question: 回调返回用户回答", async () => {
  const qTool = builtinTools.find((t) => t.name === "question")
  // 模拟一个直接返回固定回答的 onQuestion
  const ctx = { cwd: process.cwd(), onQuestion: async (_text) => "选方案A" }
  const result = await qTool.execute({ question: "选哪个？" }, ctx)
  assert.equal(result, "选方案A")
})



test("question: 无回调时抛错", async () => {
  const qTool = builtinTools.find((t) => t.name === "question")
  const ctx = { cwd: process.cwd() }
  await assert.rejects(() => qTool.execute({ question: "?" }, ctx), /not supported/)
})



test("fetch: detectSparseHtml 区分区域封锁/SPA 空壳/正常页", async () => {
  const { detectSparseHtml } = await import("../src/tools/web.mjs")
  const region = '<html>App unavailable in region</html>'
  assert.match(detectSparseHtml(region, "app unavailable in region"), /region-blocked or JS-gated/)
  const spa = '<div id="app"></div><script>...</script>'
  assert.match(detectSparseHtml(spa, ""), /JS-rendered SPA shell/)
  const normal = "<html><body>" + "x".repeat(500) + "</body></html>"
  assert.equal(detectSparseHtml(normal, "x".repeat(500)), "")
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


// ---------------------------------------------------------------- ops tools (file_ops / process / get_current_time)


test("file_ops: move / copy / rename（越界路径正常执行，§10.1）", async () => {
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

    // 越界路径（cwd 之外）正常执行——目录限制移除（TOOLS.md §10.1）
    const ws = join(dir, "ws")
    mkdirSync(ws)
    writeFileSync(join(ws, "in.txt"), "x")
    const esc = await byName.file_ops.execute({ action: "copy", source: "in.txt", dest: "../escaped.txt" }, { cwd: ws })
    assert.match(esc, /Copied/)
    assert.equal(readFileSync(join(dir, "escaped.txt"), "utf8"), "x")

    assert.match(await byName.file_ops.execute({ action: "nuke", source: "a.txt", dest: "x.txt" }, ctx), /action must be/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


// ---------------------------------------------------------------- TOOLS.md §10.1 作用域限制移除（2026-09-02）


test("T-W1: 外部路径（../）read/write/edit 正常解析执行（不再抛 Access denied）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-scope-"))
  try {
    const ws = join(dir, "ws")
    mkdirSync(ws)
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    const ctx = { cwd: ws }

    // write 到 cwd 之外（../ 逃逸路径）→ 正常写入
    const w = await byName.write.execute({ path: "../outside.txt", content: "hello\nworld\n" }, ctx)
    assert.match(w, /Wrote/)
    assert.equal(readFileSync(join(dir, "outside.txt"), "utf8"), "hello\nworld\n")

    // read 同路径 → 正常读取
    const r = await byName.read.execute({ path: "../outside.txt" }, ctx)
    assert.match(r, /hello/)

    // edit 同路径 → 带公共上下文（world）替换
    await byName.edit.execute({ path: "../outside.txt", old_string: "hello\nworld", new_string: "world" }, ctx)
    assert.equal(readFileSync(join(dir, "outside.txt"), "utf8"), "world\n")

    // 补充（评审 round2 #5）：绝对路径语义定死——resolve 原样解析，不重新锚定到 cwd
    const absPath = join(dir, "abs.txt")
    const a = await byName.write.execute({ path: absPath, content: "abs\n" }, ctx)
    assert.match(a, /Wrote/)
    assert.equal(readFileSync(absPath, "utf8"), "abs\n")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("T-W3: 工具描述无 'confined to workspace' 类措辞（F2，md 描述源 + 工具定义 description）", () => {
  const toolsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "tools")
  const bad = ["confined to the workspace", "confined to the working directory", "within the working directory", "escapes the workspace", "directory confinement"]
  // md 描述源（DESC 机制）
  for (const f of readdirSync(toolsDir).filter((x) => x.endsWith(".md"))) {
    const text = readFileSync(join(toolsDir, f), "utf8").toLowerCase()
    for (const phrase of bad) assert.ok(!text.includes(phrase), `${f} 含 "${phrase}"`)
  }
  // 工具定义 description（parameters 内联描述）
  for (const t of builtinTools) {
    const descs = [
      t.description,
      ...Object.values(t.parameters?.properties ?? {}).map((p) => p.description).filter(Boolean),
    ]
    for (const d of descs) {
      for (const phrase of bad) assert.ok(!d.toLowerCase().includes(phrase), `工具 ${t.name} description 含 "${phrase}"`)
    }
  }
})



test("T-W5: workspace 内符号链接指向外部文件 → read 正常解析执行（realpathNearest 移除后语义）", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-sym-"))
  try {
    const ws = join(dir, "ws")
    mkdirSync(ws)
    writeFileSync(join(dir, "target.txt"), "symlinked content\n")
    const { symlinkSync } = await import("node:fs")
    try {
      symlinkSync(join(dir, "target.txt"), join(ws, "link.txt"))
    } catch (e) {
      // Windows 无开发者模式/无权限时创建符号链接被拒——环境限制，跳过（非功能失败）
      if (e.code === "EPERM" || e.code === "EACCES" || e.code === "ENOTSUP" || e.code === "EINVAL") {
        t.skip(`symlink not permitted in this environment: ${e.code}`)
        return
      }
      throw e
    }
    const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
    const out = await byName.read.execute({ path: "link.txt" }, { cwd: ws })
    assert.match(out, /symlinked content/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})



test("get_current_time / process: basic behavior", async () => {
  const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))
  assert.equal(byName.sleep, undefined, "sleep tool removed from builtinTools")

  const now = await byName.get_current_time.execute({}, {})
  assert.match(now, /Date:/)
  assert.match(now, /Timezone:/)

  const procs = await byName.process.execute({ name: "node" }, {})
  assert.match(procs, /PID/, "process listing returns PID rows")
})
