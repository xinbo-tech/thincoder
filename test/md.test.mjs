/**
 * md.test.mjs — markdown renderer edge cases (webview/md.js)
 * The hand-rolled renderer has no parser to fall back on; these lock its
 * known-behavior contracts. Focus: table pipes, escaping, inline forms.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { md, mdInline, esc } from "../webview/md.js"

describe("md — tables", () => {
  it("renders a basic table with header + body", () => {
    const out = md("| a | b |\n|---|---|\n| 1 | 2 |")
    assert.equal((out.match(/<th>/g) || []).length, 2)
    assert.equal((out.match(/<td>/g) || []).length, 2)
    assert.match(out, /<table>/)
  })

  it("escaped pipe \\| is a literal | inside a cell — never splits it", () => {
    const out = md("| a | b \\| c |\n|---|---|\n| 1 | x \\| y |")
    // 2 header + 2 body cells — a split would create extra cells
    assert.equal((out.match(/<th>/g) || []).length, 2, "header cells")
    assert.equal((out.match(/<td>/g) || []).length, 2, "body cells")
    assert.ok(out.includes("b | c"), "escaped pipe restored, no backslash")
    assert.ok(out.includes("x | y"))
    assert.ok(!out.includes("\\|"), "no raw escape residue")
  })

  it("escaped pipe inside inline code follows GFM (escape in code too)", () => {
    const out = md("| x | `a\\|b` |\n|---|---|\n| 1 | 2 |")
    assert.equal((out.match(/<th>/g) || []).length, 2, "escaped code pipe did not split")
    assert.ok(out.includes("<code>a|b</code>"), "code pipe restored as literal")
  })
})

describe("md — inline", () => {
  it("escapes HTML in plain text", () => {
    assert.equal(esc("<script>&"), "&lt;script&gt;&amp;")
  })

  it("bold + italic + inline code coexist", () => {
    const out = mdInline("**b** and *i* and `c`")
    assert.match(out, /<strong>b<\/strong>/)
    assert.match(out, /<em>i<\/em>/)
    assert.match(out, /<code>c<\/code>/)
  })
})

describe("md — XSS hardening", () => {
  it("escapes a bare <script> tag in plain text", () => {
    const out = md("<script>alert(1)</script>")
    assert.ok(!out.includes("<script>"), "no raw <script> reaches the DOM")
    assert.ok(out.includes("&lt;script&gt;"), "tag rendered as text")
  })

  it("escapes an <img onerror> attribute breakout", () => {
    const out = md('<img src=x onerror="alert(1)">')
    assert.ok(!out.includes("<img"), "no raw <img> tag survives")
    assert.ok(out.includes("&lt;img"), "escaped")
  })

  it("escapes a script tag inside **bold**", () => {
    const out = md("**<img src=x onerror=alert(1)>**")
    assert.ok(out.includes("&lt;img"), "escaped inside strong")
    assert.ok(!out.includes('<strong><img'), "no raw img in strong")
  })

  it("escapes a script tag inside a table cell", () => {
    const out = md("| a |\n|---|\n| <script> |")
    assert.ok(out.includes("&lt;script&gt;"), "cell rendered as text")
    assert.ok(!out.includes("<script>"), "no raw script in cell")
  })

  it("blocks javascript: URL scheme in links", () => {
    const out = md("[x](javascript:alert(1))")
    assert.ok(out.includes('href="#"'), "scriptable scheme neutralized")
    assert.ok(!out.includes("javascript:alert"), "no javascript: in href")
  })

  it("blocks data: URL scheme in images", () => {
    const out = md("![x](data:text/html,<script>alert(1)</script>)")
    assert.ok(!/src="data:/.test(out), "no data: in src")
    assert.ok(!out.includes("<script>"), "no raw script via data URL")
  })

  it("allows http/https/mailto/relative/anchor URLs", () => {
    assert.ok(md("[x](https://e.com)").includes('href="https://e.com"'))
    assert.ok(md("[x](mailto:a@b.com)").includes('href="mailto:a@b.com"'))
    assert.ok(md("[x](/docs/readme)").includes('href="/docs/readme"'))
    assert.ok(md("[x](#section)").includes('href="#section"'))
  })

  it("mdInline also escapes raw HTML", () => {
    const out = mdInline("<script>alert(1)</script>")
    assert.ok(!out.includes("<script>"), "no raw script")
    assert.ok(out.includes("&lt;script&gt;"))
  })
})

describe("md — additional capability (thinworker parity)", () => {
  it("renders h5/h6", () => {
    assert.ok(md("##### five").includes("<h5>five</h5>"))
    assert.ok(md("###### six").includes("<h6>six</h6>"))
  })

  it("renders a blockquote", () => {
    const out = md("> quote line")
    assert.ok(out.includes("<blockquote>"))
    assert.ok(out.includes("quote line"))
  })

  it("renders strikethrough ~~text~~", () => {
    assert.ok(md("~~gone~~").includes("<s>gone</s>"))
    assert.ok(mdInline("~~x~~").includes("<s>x</s>"))
  })

  it("backslash escapes syntax chars (\\* \\| \\[ etc.)", () => {
    // exact shape: backslash consumed, `*` NOT turned into <em>/<strong>
    const o = md("\\*not italic\\*")
    assert.ok(!o.includes("<em>") && !o.includes("<strong>"), "no emphasis from escaped *")
    assert.ok(!o.includes("\\*"), "backslash consumed")
    assert.ok(md("a \\| b").includes("a | b"))
  })

  it("backslash escapes esc-set chars (\\> \\< \\& \\\")", () => {
    // These are escaped by esc() into entities before inline() runs; the backslash
    // must still be consumed and the literal char rendered (advisory #2).
    assert.ok(md("\\>x").includes("&gt;x"))
    assert.ok(md("\\<x").includes("&lt;x"))
    assert.ok(md("\\&x").includes("&amp;x"))
    assert.ok(md('\\"x').includes("&quot;x"))
  })

  it("renders a task list with unchecked + checked boxes", () => {
    const out = md("- [ ] todo\n- [x] done")
    assert.ok(out.includes("<ul>"))
    assert.ok(out.includes("type=\"checkbox\" disabled class=\"task-check\""))
    assert.ok(out.includes("checked"), "checked item carries the checked attr")
    assert.ok(out.includes("todo") && out.includes("done"))
  })

  it("renders nested lists via indentation", () => {
    const out = md("- a\n  - a1\n  - a2\n- b")
    assert.equal((out.match(/<li>a<ul>/g) || []).length, 1, "a has a nested ul")
    assert.equal((out.match(/<li>a1<\/li>/g) || []).length, 1)
    assert.equal((out.match(/<li>a2<\/li>/g) || []).length, 1)
    assert.equal((out.match(/<li>b<\/li>/g) || []).length, 1)
  })

  it("does not wrap headings / hr in a bare <p>", () => {
    // A browser implicitly closes <p> before a block element, leaving an empty
    // <p> with a margin gap — the step-12 cleanup now strips it (advisory #1).
    assert.ok(!/^<p><h[1-6]>/.test(md("##### five")), "h5 not wrapped in <p>")
    assert.ok(!md("###### six").startsWith("<p>"), "h6 not wrapped in <p>")
    assert.ok(!md("---").startsWith("<p>"), "hr not wrapped in <p>")
    assert.ok(md("##### five").includes("<h5>five</h5>"))
  })

  it("list continuation line is a known hand-rolled limitation (not a list item)", () => {
    // `  continuation` is an indented non-marker line following `- item one`. The
    // hand-rolled list block regex only captures marker lines, so the continuation
    // falls outside the <ul> (rendered as <br>-joined text). Lock the CURRENT
    // behavior — replacing it would require a real block parser. No XSS, no crash.
    const out = md("- item one\n  continuation\n- item two")
    assert.equal((out.match(/<ul>/g) || []).length, 2, "two separate uls")
    assert.ok(out.includes("continuation"), "continuation text preserved")
    assert.ok(!out.includes("<li>continuation</li>"), "continuation is NOT a list item")
  })


  it("wraps an ordered list in <ol>", () => {
    const out = md("1. first\n2. second")
    assert.ok(out.includes("<ol>"))
    assert.ok(out.includes("<li>first</li>"))
    assert.ok(out.includes("<li>second</li>"))
  })

  it("still escapes script inside blockquote and list", () => {
    assert.ok(md("> <script>").includes("&lt;script&gt;"), "blockquote content escaped")
    assert.ok(md("- <script>").includes("&lt;script&gt;"), "list item escaped")
  })
})


