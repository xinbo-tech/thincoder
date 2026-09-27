/**
 * md.test.mjs — 核纯函数层：Markdown 渲染 + 全量转义闸（`md` / `mdInline` / `esc`）。
 *
 * 来源 = `thincoder-vscode/webview/md.js` 逐字搬迁（R1——逐字性例外仅 `diff.mjs` 引用行一条，
 * 见批档 §5）；设计权威 = `docs/render-core/design/RENDER-CORE.md` §5（导出面）/ §6（R1 面）。
 * 锚 = VSC 侧既有对位用例 `thincoder-vscode/test/md-render-escape.test.mjs`（T-H1…T-H14 逐例复刻；
 * T-H15 跨界配对族由消费端套档保留）
 * ——金样协议同守：期望串为固定字面量（改动前捕获），禁从新实现重生成。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { md, mdInline, esc } from "../md.mjs"

/** 提取全部 <code> 段内容（行内代码契约判据用）。 */
function codeSpans(html) {
  return [...html.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) => m[1])
}

/** raw-text 元素族零真实标签（转义闸判据）。 */
const RAW_TEXT_ELEMS = /<(script|style|textarea)/i

// ─── 转义闸（锚 T-H1…T-H4）────────────────────────────────────

test("转义闸（锚 T-H1）：行内代码内 <script> 字面呈现、后段可见", () => {
  const input = '检测源码里的 `<script type="application/ld+json">` 是否存在 FAQPage。\n后续段落文本'
  const html = md(input)
  assert.equal(html, '<p>检测源码里的 <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> 是否存在 FAQPage。<br>后续段落文本</p>')
  assert.ok(html.includes("后续段落文本"), "后段文本可见")
  assert.ok(!RAW_TEXT_ELEMS.test(html), "全输出 <script> 零命中")
})

test("转义闸（锚 T-H2）：raw-text 元素族 + <img onerror> 均转义文本", () => {
  const input = '`<style>p{}</style>` 与 `<textarea>x</textarea>` 与 `<img src=x onerror=alert(1)>`'
  const html = md(input)
  assert.equal(html, '<p><code>&lt;style&gt;p{}&lt;/style&gt;</code> 与 <code>&lt;textarea&gt;x&lt;/textarea&gt;</code> 与 <code>&lt;img src=x onerror=alert(1)&gt;</code></p>')
  assert.ok(!RAW_TEXT_ELEMS.test(html), "script/style/textarea 零命中")
  assert.ok(!/<img[^>]*onerror/i.test(html), "onerror 不以真属性出现")
})

test("转义闸（锚 T-H3）：尖括号与 & 在代码内与正文均转义", () => {
  const html = md('`a & b < c` 正文 1 < 2 & 3 > 2')
  assert.equal(html, '<p><code>a &amp; b &lt; c</code> 正文 1 &lt; 2 &amp; 3 &gt; 2</p>')
  assert.ok(!RAW_TEXT_ELEMS.test(html), "零真实标签")
})

test("转义闸（锚 T-H4）：代码外裸 HTML 全转义、无 passthrough", () => {
  const html = md('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n<b>x</b>')
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;<br>&lt;img src=x onerror=alert(1)&gt;<br>&lt;b&gt;x&lt;/b&gt;</p>')
  assert.ok(!/<(script|img|b)\b/i.test(html), "裸 HTML 零真实元素")
})

// ─── 行内契约（锚 T-H5…T-H10）────────────────────────────────

test("行内代码字面（锚 T-H5/T-H6）：Markdown 标记与链接/图片标记均字面", () => {
  assert.equal(md('`**x**` 与 `*x*` 与 `~~x~~`'), '<p><code>**x**</code> 与 <code>*x*</code> 与 <code>~~x~~</code></p>')
  const html = md('`[a](http://b)` 与 `![a](http://b)`')
  assert.equal(html, '<p><code>[a](http://b)</code> 与 <code>![a](http://b)</code></p>')
  assert.ok(!html.includes("<img"), "代码内图片标记不生成真 <img>（零远程请求）")
})

test("危险 scheme 双面（锚 T-H7）：代码内字面 / 代码外 safeUrl → #", () => {
  const html = md('`[x](javascript:alert(1))` 与 [x](javascript:alert(1))')
  assert.equal(codeSpans(html)[0], "[x](javascript:alert(1))", "代码内连 # 锚点都不再生成")
  assert.ok(html.includes('<a href="#">x</a>'), "代码外 safeUrl 保持（危险 scheme → #）")
})

test("safeUrl 白名单面：http(s) / mailto / 相对路径放行，未知 scheme → #", () => {
  assert.equal(md("[x](https://a.example/b)"), '<p><a href="https://a.example/b">x</a></p>')
  assert.equal(md("[x](mailto:a@b.example)"), '<p><a href="mailto:a@b.example">x</a></p>')
  assert.equal(md("[x](./a.md)"), '<p><a href="./a.md">x</a></p>')
  assert.equal(md("[x](data:text/plain,hi)"), '<p><a href="#">x</a></p>')
})

test("表格单元格（锚 T-H8）：代码字面 + 转义管道不拆列", () => {
  const html = md('| 列 A | 列 B |\n| --- | --- |\n| `**x**` | `a \\| b` |')
  assert.equal(html, '<table><thead><tr><th>列 A</th><th>列 B</th></tr></thead><tbody><tr><td><code>**x**</code></td><td><code>a | b</code></td></tr></tbody></table>')
  assert.equal(html.match(/<td>/g)?.length, 2, "转义管道不拆列")
})

test("行内上下文矩阵（锚 T-H9）：标题/引用/列表/任务项/嵌套/有序同契约", () => {
  const html = md('# 标题 `**x**`\n\n> 引用 `[a](http://b)`\n\n- 项 `*x*`\n- [ ] 任务 `![a](http://b)`\n  - 嵌套 `~~x~~`\n\n1. 有序 `**x**`')
  for (const frag of [
    "<h1>标题 <code>**x**</code></h1>",
    "<blockquote>引用 <code>[a](http://b)</code></blockquote>",
    "项 <code>*x*</code>",
    "任务 <code>![a](http://b)</code>",
    "嵌套 <code>~~x~~</code>",
    "有序 <code>**x**</code>",
  ]) {
    assert.ok(html.includes(frag), `上下文同契约：${frag}`)
  }
  for (const el of ["<h1>", "<blockquote>", "<ul>", "<ol>", 'type="checkbox"']) {
    assert.ok(html.includes(el), `上下文结构保持：${el}`)
  }
})

test("反斜杠转义（锚 T-H10）：转义反引号成字面 / 代码内反斜杠折叠", () => {
  const html = md('转义反引号 \\`code\\` 与 `\\*`')
  assert.equal(html, '<p>转义反引号 `code` 与 <code>*</code></p>')
  assert.ok(!html.includes("<code>code</code>"), "转义反引号不成 <code>（字面反引号）")
})

// ─── 块级契约 ────────────────────────────────────────────────

test("fenced 代码块：highlight 路径 + 转义文本（锚 T-H11）", () => {
  const html = md('```html\n<script>alert(1)</script>\n```')
  assert.ok(html.includes('<pre class="code-block">'), "fenced 结构保持")
  assert.ok(html.includes('&lt;script&gt;alert('), "fence 内容转义文本")
  assert.ok(!RAW_TEXT_ELEMS.test(html), "全输出 <script> 零命中")
  // 单 fence 独立成段 ⇒ 保 <p> 包裹（pre 不在 step-12 strip 表内）；代码内数字仍走 tokenizer（html 零关键词）——现状逐字保持
  assert.equal(html, '<p><pre class="code-block"><span class="code-lang">html</span><code>&lt;script&gt;alert(<span class="tk-number">1</span>)&lt;/script&gt;</code></pre></p>')
})

test("块级结构：标题 / 引用 / 有序 / 任务项 / 水平线", () => {
  assert.equal(md("# h1"), "<h1>h1</h1>")
  assert.equal(md("> quote"), "<blockquote>quote</blockquote>")
  assert.equal(md("1. one"), "<ol><li>one</li></ol>")
  assert.equal(md("- [x] done"), '<ul><li><input type="checkbox" disabled checked class="task-check">done</li></ul>')
  assert.equal(md("---"), "<hr>")
  assert.equal(md("a\n\nb"), "<p>a</p><p>b</p>")
})

// ─── mdInline / 边界 / esc ──────────────────────────────────

test("mdInline（锚 T-H12）：与 md() 同契约（单段 = <p> + mdInline）", () => {
  const t5 = '`**x**` 与 `*x*` 与 `~~x~~`'
  const t6 = '`[a](http://b)` 与 `![a](http://b)`'
  assert.equal(mdInline(t5), '<code>**x**</code> 与 <code>*x*</code> 与 <code>~~x~~</code>')
  assert.equal(mdInline(t6), '<code>[a](http://b)</code> 与 <code>![a](http://b)</code>')
  assert.equal(md(t5), "<p>" + mdInline(t5) + "</p>", "md 单段 = <p> + mdInline")
})

test("登记边界（锚 T-H13）：未闭合反引号 / 多行段现状保持", () => {
  const unclosed = md("未闭合 `<script>x")
  assert.equal(unclosed, "<p>未闭合 `&lt;script&gt;x</p>")
  assert.ok(!unclosed.includes("<code>"), "未闭合 = 全文转义文本（零 <code>）")
  assert.equal(md("前 `line1\nline2` 后"), "<p>前 <code>line1<br>line2</code> 后</p>", "多行段 <br> 形态保持（登记）")
})

test("空输入面：md('') / md(null) ⇒ ''（falsy 守卫）", () => {
  assert.equal(md(""), "")
  assert.equal(md(null), "")
  assert.equal(md(undefined), "")
})

test("esc：四字符替换（& < > \"），非字符串入参 String 化", () => {
  assert.equal(esc('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;")
  assert.equal(esc(42), "42")
  assert.equal(esc(""), "")
})

test("金样（锚 T-H14）：非代码面逐字节一致", () => {
  const input = '# 标题\n\n**粗体** 与 *斜体* 与 ~~删除线~~ 与 [链接](http://example.com/a?b=1&c=2)。\n\n- 列表项 1\n- 列表项 2\n\n| 列 A | 列 B |\n| --- | --- |\n| 值 1 | `code` |\n\n> 引用行\n\n```js\nconst a = "<x>"\n```\n\n转义管道 a \\| b 与转义反引号 \\`x\\`。'
  const golden = '<h1>标题</h1><p><strong>粗体</strong> 与 <em>斜体</em> 与 <s>删除线</s> 与 <a href="http://example.com/a?b=1&amp;c=2">链接</a>。</p><ul><li>列表项 1</li><li>列表项 2</li></ul><br><table><thead><tr><th>列 A</th><th>列 B</th></tr></thead><tbody><tr><td>值 1</td><td><code>code</code></td></tr></tbody></table><br><blockquote>引用行</blockquote><br><pre class="code-block"><span class="code-lang">js</span><code><span class="tk-keyword">const</span> a = <span class="tk-string">&quot;&lt;x&gt;&quot;</span></code></pre><p>转义管道 a | b 与转义反引号 `x`。</p>'
  assert.equal(md(input), golden, "非代码面逐字节一致（金样 = 改动前捕获）")
})
