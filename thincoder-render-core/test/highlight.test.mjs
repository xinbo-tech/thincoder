/**
 * highlight.test.mjs — 核纯函数层：零依赖分词器（`highlight` / `normalizeLang` / `tokenize`）。
 *
 * 来源 = `thincoder-vscode/webview/highlight.js` 逐字搬迁（R1）；设计权威 =
 * `docs/render-core/design/RENDER-CORE.md` §5（导出面）。消费面 = `md.mjs`（fenced 代码块转义）。
 * 期望串按源档逐行推演（分词优先级 = 空白 → 注释 → 字符串 → 数字 → 词 → CSS 专支）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { highlight, normalizeLang, tokenize } from "../highlight.mjs"

test("normalizeLang：别名映射与缺省/未知回落 js", () => {
  const cases = {
    javascript: "js", mjs: "js", cjs: "js", jsx: "js", js: "js",
    typescript: "ts", tsx: "ts", mts: "ts", ts: "ts",
    json: "json", jsonc: "json",
    css: "css", scss: "css", less: "css",
    html: "html", xml: "html", svg: "html",
    python: "py", py3: "py",
    bash: "sh", shell: "sh", zsh: "sh", console: "sh", dockerfile: "sh", makefile: "sh",
    markdown: "md", md: "md",
    sql: "sql",
    java: "js", c: "js", cpp: "js", go: "js", rust: "js", ruby: "js", php: "js", swift: "js", kotlin: "js",
    diff: "js", patch: "js", plaintext: "js", text: "js", yaml: "js", toml: "js", ini: "js", env: "js",
  }
  for (const [from, to] of Object.entries(cases)) {
    assert.equal(normalizeLang(from), to, `normalizeLang(${from})`)
  }
  assert.equal(normalizeLang("TypeScript"), "ts", "大小写不敏感")
  assert.equal(normalizeLang(""), "js", "空串 ⇒ js")
  assert.equal(normalizeLang(undefined), "js", "缺省 ⇒ js")
  assert.equal(normalizeLang("unknownlang"), "js", "未知 ⇒ js")
})

test("highlight：js 关键词 / 数字 / 空格保持", () => {
  assert.equal(
    highlight("const n = 1", "js"),
    '<span class="tk-keyword">const</span> n = <span class="tk-number">1</span>',
  )
  assert.equal(highlight("0xFF", "js"), '<span class="tk-number">0xFF</span>')
})

test("highlight：ts 类型表（小写成员）命中 tk-type", () => {
  assert.equal(
    highlight("let s: string", "ts"),
    '<span class="tk-keyword">let</span> s: <span class="tk-type">string</span>',
  )
})

test("highlight：js 类型表现状（大小写敏感——大写表不命中）", () => {
  // 源档现状：types 表成员为大写（"String"…）而查表用 lower ⇒ js 侧类型零命中；逐字搬迁保持。
  assert.equal(highlight("String", "js"), "String")
})

test("highlight：字符串 token 转义（& < > \"）", () => {
  assert.equal(
    highlight('let s = "<x>"', "js"),
    '<span class="tk-keyword">let</span> s = <span class="tk-string">&quot;&lt;x&gt;&quot;</span>',
  )
  assert.equal(
    highlight('const a = "q & <b>"', "js"),
    '<span class="tk-keyword">const</span> a = <span class="tk-string">&quot;q &amp; &lt;b&gt;&quot;</span>',
  )
})

test("highlight：注释（行注释 / 块注释 / # 行）", () => {
  assert.equal(highlight("// note\nx", "js"), '<span class="tk-comment">// note</span>\nx')
  assert.equal(highlight("/* a */ x", "js"), '<span class="tk-comment">/* a */</span> x')
  assert.equal(highlight("# shell note", "sh"), '<span class="tk-comment"># shell note</span>')
})

test("highlight：模板字面量与单引号串", () => {
  assert.equal(highlight("`t ${x}`", "js"), '<span class="tk-string">`t ${x}`</span>')
  assert.equal(highlight("'a b'", "js"), '<span class="tk-string">\'a b\'</span>')
})

test("highlight：css 专支（.class / @atrule；词首分支优先——属性不另立类）", () => {
  assert.equal(highlight(".a { color: red }", "css"), '<span class="tk-class">.a</span> { color: red }')
  assert.equal(highlight("@media x", "css"), '<span class="tk-atrule">@media</span> x')
})

test("highlight：裸尖括号全转义（html 语言零关键词 ⇒ 全 plain）", () => {
  assert.equal(highlight("<script>", "html"), "&lt;script&gt;")
  assert.equal(highlight("<x> & \"q\"", "js"), "&lt;x&gt; &amp; <span class=\"tk-string\">&quot;q&quot;</span>")
})

test("highlight：空输入 / 未知语言回落 js", () => {
  assert.equal(highlight("", "js"), "")
  assert.equal(highlight(null, "js"), "")
  assert.equal(highlight("x", "unknownlang"), "x")
  assert.equal(highlight("x", undefined), "x")
  assert.equal(highlight("const", "unknownlang"), '<span class="tk-keyword">const</span>', "未知语言按 js 表分词")
})

test("tokenize：token 序列与源文逐字拼接回原文（不吞不漏）", () => {
  const samples = [
    "const a = \"x\" // c\n",
    "/* b */ <tag> & 'q' 1.5e3 \u0060t\u0060",
    "@media { color: red }",
  ]
  for (const src of samples) {
    const tokens = tokenize(src, "js")
    assert.ok(Array.isArray(tokens) && tokens.length > 0, "非空 token 序列")
    assert.equal(tokens.map((t) => t.value).join(""), src, `拼接复原：${JSON.stringify(src)}`)
    for (const t of tokens) {
      assert.equal(typeof t.type, "string")
      assert.equal(typeof t.value, "string")
    }
  }
})
