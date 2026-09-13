/**
 * md-render-escape.test.mjs — 第 34 批（VSC webview 行内代码字面量契约与转义回归 · GitHub #7）机器验收。
 * 设计权威：`thincoder-vscode/docs/design/WEBVIEW.md` §10（契约 §10.3 / 用例表 T-H1~T-H15 §10.6 /
 * AC-H1~AC-H6 §10.7）；需求：CLI 仓 `docs/requirements/AGENT-LOOP.md` §10（F-H1~F-H4 / N-H1~N-H4）；
 * 批次档 `thincoder-cli/docs/batches/2026-09-11-VSC-WEBVIEW-ESCAPE.md` §2。
 *
 * 手法：纯函数直驱 `webview/md.js`（渲染器零 DOM 依赖——无需 happy-dom；D-V4）。
 * T-H14 金样协议：金样于**改动前**捕获（修前工作树 = HEAD 直驱出期望串，以固定字面量钉死于本档）
 * ——禁止改动后从新实现重新生成（防自证循环；§10.6 注）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { md, mdInline } from "../webview/md.js"
import files from "./files.mjs"

// ─── 判据助手 ──────────────────────────────────────────────

/** 提取全部 <code> 段内容（行内代码契约判据用）。 */
function codeSpans(html) {
  return [...html.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) => m[1])
}

/** AC-H1 判据：<code> 内 `<strong>` / `<em>` / `<s>` / `<a` / `<img` 零命中。 */
function assertAllLiteralCode(html, label) {
  const spans = codeSpans(html)
  assert.ok(spans.length > 0, `${label}：语料应产出至少一个 <code> 段`)
  for (const c of spans) {
    assert.ok(!/<(strong|em|s|a|img)\b/i.test(c), `${label}：<code> 内不得出现 Markdown 生成元素——实际 "${c}"`)
  }
  return spans
}

/** AC-H2 判据：raw-text 元素族零真实标签。 */
const RAW_TEXT_ELEMS = /<(script|style|textarea)/i

// ─── 用例（T-H1~T-H15——§10.6 逐条） ─────────────────────────

test("T-H1 正常（issue 复现——F-H2/F-H3）：行内代码内 <script> 后段可见、零真实标签", () => {
  const input = '检测源码里的 `<script type="application/ld+json">` 是否存在 FAQPage。\n后续段落文本'
  const html = md(input)
  assert.equal(html, '<p>检测源码里的 <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> 是否存在 FAQPage。<br>后续段落文本</p>')
  assert.ok(html.includes("后续段落文本"), "后段文本可见（issue 症状不复现）")
  assert.ok(html.includes("&lt;script"), "script 以转义文本呈现")
  assert.ok(!RAW_TEXT_ELEMS.test(html), "全输出 <script> 零命中")
  assert.ok(!html.includes("<script"), "零未转义 <script 序列")
})

test("T-H2 边界（raw-text 元素族——F-H2）：<style>/<textarea>/<img onerror> 均转义文本", () => {
  const input = '`<style>p{}</style>` 与 `<textarea>x</textarea>` 与 `<img src=x onerror=alert(1)>`'
  const html = md(input)
  assert.equal(html, '<p><code>&lt;style&gt;p{}&lt;/style&gt;</code> 与 <code>&lt;textarea&gt;x&lt;/textarea&gt;</code> 与 <code>&lt;img src=x onerror=alert(1)&gt;</code></p>')
  assert.ok(!RAW_TEXT_ELEMS.test(html), "script/style/textarea 零命中")
  assert.ok(!/<img[^>]*onerror/i.test(html), "onerror 不以真属性出现")
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"), "onerror= 仅作转义文本出现")
})

test("T-H3 边界（尖括号与 &——F-H2）：代码内与正文均转义", () => {
  const html = md('`a & b < c` 正文 1 < 2 & 3 > 2')
  assert.equal(html, '<p><code>a &amp; b &lt; c</code> 正文 1 &lt; 2 &amp; 3 &gt; 2</p>')
  assert.ok(!RAW_TEXT_ELEMS.test(html), "零真实标签")
})

test("T-H4 正常（代码外裸 HTML 策略——D-V3）：全转义、无 passthrough", () => {
  const html = md('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n<b>x</b>')
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;<br>&lt;img src=x onerror=alert(1)&gt;<br>&lt;b&gt;x&lt;/b&gt;</p>')
  assert.ok(!/<(script|img|b)\b/i.test(html), "裸 HTML 零真实元素")
})

test("T-H5 正常（F-H1 核心）：`**x**` / `*x*` / `~~x~~` 字面", () => {
  const html = md('`**x**` 与 `*x*` 与 `~~x~~`')
  assert.equal(html, '<p><code>**x**</code> 与 <code>*x*</code> 与 <code>~~x~~</code></p>')
  assertAllLiteralCode(html, "T-H5")
})

test("T-H6 正常（F-H1）：代码内链接 / 图片标记字面", () => {
  const html = md('`[a](http://b)` 与 `![a](http://b)`')
  assert.equal(html, '<p><code>[a](http://b)</code> 与 <code>![a](http://b)</code></p>')
  assertAllLiteralCode(html, "T-H6")
  assert.ok(!html.includes("<img"), "代码内图片标记不生成真 <img>（零远程请求）")
})

test("T-H7 边界（危险 scheme 双面——F-H1/F-H2）：代码内字面 / 代码外 safeUrl 保持", () => {
  const html = md('`[x](javascript:alert(1))` 与 [x](javascript:alert(1))')
  const spans = assertAllLiteralCode(html, "T-H7")
  assert.equal(spans[0], "[x](javascript:alert(1))", "代码内连 # 锚点都不再生成")
  assert.ok(html.includes('<a href="#">x</a>'), "代码外 safeUrl 保持（危险 scheme → #）")
})

test("T-H8 正常（表格单元格路径——F-H4）：单元格内代码字面 + 转义管道不拆列", () => {
  const html = md('| 列 A | 列 B |\n| --- | --- |\n| `**x**` | `a \\| b` |')
  assert.equal(html, '<table><thead><tr><th>列 A</th><th>列 B</th></tr></thead><tbody><tr><td><code>**x**</code></td><td><code>a | b</code></td></tr></tbody></table>')
  assertAllLiteralCode(html, "T-H8")
  assert.equal(html.match(/<td>/g)?.length, 2, "转义管道不拆列（dea4fcf 行为保持）")
})

test("T-H9 边界（行内上下文矩阵——F-H4）：标题/引用/列表/任务项/嵌套/有序同契约", () => {
  const html = md('# 标题 `**x**`\n\n> 引用 `[a](http://b)`\n\n- 项 `*x*`\n- [ ] 任务 `![a](http://b)`\n  - 嵌套 `~~x~~`\n\n1. 有序 `**x**`')
  // 判据 = §10.6 T-H9「各上下文同契约」——按上下文片段断言（整串等值会耦合复选框属性序 /
  // 段落粘合形态等转义面之外的实现细节——评审建议解耦，代码评审轮次 1 #1）
  assertAllLiteralCode(html, "T-H9")
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

test("T-H10 边界（转义反引号 / 代码内反斜杠——F-H1 登记项）：现状保持", () => {
  const html = md('转义反引号 \\`code\\` 与 `\\*`')
  assert.equal(html, '<p>转义反引号 `code` 与 <code>*</code></p>')
  assert.ok(!html.includes("<code>code</code>"), "转义反引号不成 <code>（字面反引号）")
  assert.ok(html.includes("<code>*</code>"), "代码内反斜杠折叠现状保持（`\\*` → <code>*</code>）")
})

test("T-H11 正常（fenced 代码块——F-H2）：highlight 路径零改", () => {
  const html = md('```html\n<script>alert(1)</script>\n```')
  assert.ok(html.includes('<pre class="code-block">'), "fenced 结构保持")
  assert.ok(html.includes('&lt;script&gt;alert('), "fence 内容转义文本")
  assert.ok(!RAW_TEXT_ELEMS.test(html), "全输出 <script> 零命中")
})

test("T-H12 正常（mdInline 同步面——F-H4）：与 md() 同契约、零额外改动", () => {
  // T-H1 输入
  const t1 = mdInline('检测源码里的 `<script type="application/ld+json">` 是否存在 FAQPage。\n后续段落文本')
  assert.ok(t1.includes("&lt;script"), "mdInline：script 转义")
  assert.ok(!RAW_TEXT_ELEMS.test(t1), "mdInline：零真实标签")
  // T-H5 / T-H6 输入（单段语料——md = <p> 包裹 mdInline 结果）
  const t5 = '`**x**` 与 `*x*` 与 `~~x~~`'
  const t6 = '`[a](http://b)` 与 `![a](http://b)`'
  assert.equal(mdInline(t5), '<code>**x**</code> 与 <code>*x*</code> 与 <code>~~x~~</code>')
  assert.equal(mdInline(t6), '<code>[a](http://b)</code> 与 <code>![a](http://b)</code>')
  assert.equal(md(t5), "<p>" + mdInline(t5) + "</p>", "md 单段 = <p> + mdInline（同契约）")
  assertAllLiteralCode(mdInline(t5), "T-H12/mdInline")
})

test("T-H13 边界（未闭合反引号 / 多行段——F-H2 登记项）：现状保持", () => {
  const unclosed = md("未闭合 `<script>x")
  assert.equal(unclosed, "<p>未闭合 `&lt;script&gt;x</p>")
  assert.ok(!unclosed.includes("<code>"), "未闭合 = 全文转义文本（零 <code>）")
  assert.ok(!RAW_TEXT_ELEMS.test(unclosed), "零真实标签")
  const multiline = md("前 `line1\nline2` 后")
  assert.equal(multiline, "<p>前 <code>line1<br>line2</code> 后</p>", "多行段 <br> 形态保持（登记）")
})

test("T-H14 正常（非代码面金样——N-H1）：与修前逐字节一致", () => {
  // 金样语料（不含跨界配对族——该族见 T-H15）
  const input = '# 标题\n\n**粗体** 与 *斜体* 与 ~~删除线~~ 与 [链接](http://example.com/a?b=1&c=2)。\n\n- 列表项 1\n- 列表项 2\n\n| 列 A | 列 B |\n| --- | --- |\n| 值 1 | `code` |\n\n> 引用行\n\n```js\nconst a = "<x>"\n```\n\n转义管道 a \\| b 与转义反引号 \\`x\\`。'
  // 金样 = 改动前捕获（修前工作树 = HEAD 直驱；禁止修后重生成）
  const golden = '<h1>标题</h1><p><strong>粗体</strong> 与 <em>斜体</em> 与 <s>删除线</s> 与 <a href="http://example.com/a?b=1&amp;c=2">链接</a>。</p><ul><li>列表项 1</li><li>列表项 2</li></ul><br><table><thead><tr><th>列 A</th><th>列 B</th></tr></thead><tbody><tr><td>值 1</td><td><code>code</code></td></tr></tbody></table><br><blockquote>引用行</blockquote><br><pre class="code-block"><span class="code-lang">js</span><code><span class="tk-keyword">const</span> a = <span class="tk-string">&quot;&lt;x&gt;&quot;</span></code></pre><p>转义管道 a | b 与转义反引号 `x`。</p>'
  assert.equal(md(input), golden, "非代码面逐字节一致（§10.1 SAME 项）")
})

test("T-H15 边界（跨界配对族——N-H1 差异边界登记）：两处均字面、逐字节白名单", () => {
  const a = md('`a **b` c** d')
  const b = md('**a `b** c` d')
  assert.equal(a, "<p><code>a **b</code> c** d</p>", "跨界正向：修前 <strong> 跨 <code> 边界错配——修后两处均字面")
  assert.equal(b, "<p>**a <code>b** c</code> d</p>", "反向跨界：同型字面")
  assert.equal(mdInline('`a **b` c** d'), "<code>a **b</code> c** d", "mdInline 同值")
  assert.equal(mdInline('**a `b** c` d'), "**a <code>b** c</code> d", "mdInline 同值（反向）")
  assertAllLiteralCode(a, "T-H15a")
  assertAllLiteralCode(b, "T-H15b")
})

test("AC-H5（N-H2）接线：本档已登记 test/files.mjs（显式清单——不登记不跑）", () => {
  assert.ok(files.includes("test/md-render-escape.test.mjs"), "本档已登记 test/files.mjs")
})
