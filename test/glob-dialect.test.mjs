/**
 * glob-dialect.test.mjs — glob 方言扩展（TOOLS.md §17 —— 2026-09-06）。
 * brace 展开 + 排除前缀（调用侧空格拆分） + 未支持语法显式英文报错。
 * 单元层直测 globToRegex/splitGlobPatterns/compileGlobMatchers；工具级集成用例
 * （评审 #7）走 glob/grep 工具端到端传多模式 "js 排除 test"（include !exclude）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { globToRegex, splitGlobPatterns, compileGlobMatchers } from "../src/tools/shared.mjs"
import { builtinTools } from "../src/tools/index.mjs"

const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]))

// ─── 单元：brace 展开（T-G1/G2/G3）───────────────────────────────

test("T-G1: {a} 单扩展——**/*.{js} 匹配 .js", () => {
  const re = globToRegex("**/*.{js}")
  assert.ok(re.test("a.js"), "root .js matches")
  assert.ok(re.test("sub/deep/x.js"), "nested .js matches")
  assert.ok(!re.test("a.ts"), "other extension must not match")
})

test("T-G2: {a,b} 多扩展——**/*.{js,txt} 匹配 .js 与 .txt", () => {
  const re = globToRegex("**/*.{js,txt}")
  assert.ok(re.test("a.js"))
  assert.ok(re.test("a.txt"))
  assert.ok(re.test("sub/x.js"))
  assert.ok(!re.test("a.md"))
})

test("T-G3: 路径段内 brace——src/**/*.{mjs,md} 匹配 src 下 .mjs/.md", () => {
  const re = globToRegex("src/**/*.{mjs,md}")
  assert.ok(re.test("src/a.mjs"))
  assert.ok(re.test("src/deep/b.md"))
  assert.ok(!re.test("test/a.mjs"))
  assert.ok(!re.test("src/a.js"))
})

test("T-G3b: 多 brace 组 + 花括号内空格容差（split 不切 brace 内空白）", () => {
  assert.deepEqual(splitGlobPatterns("**/*.{js, txt} !test/**"), ["**/*.{js, txt}", "!test/**"])
  const re = globToRegex("src/**/*.{js, txt}")
  assert.ok(re.test("src/a.js"), "alternative with trimmed space matches")
  assert.ok(re.test("src/a.txt"))
})

test("T-G3c: 含字面空格的路径模式不因空格拆分（audit F1 + advisor #4——单模式与排除段空格均为字面量）", () => {
  assert.deepEqual(splitGlobPatterns("docs/my file/*.md"), ["docs/my file/*.md"], "bare pattern with a literal space stays ONE part")
  const m = compileGlobMatchers(splitGlobPatterns("docs/my file/*.md"))
  assert.ok(m.test("docs/my file/a.md"), "literal-space path matches")
  assert.ok(!m.test("docs/other/a.md"), "no false positive across the space")
  // 排除段含字面空格也不拆碎（advisor #4）：仅「下一 token 以 ! 开头」的空白是分隔符
  assert.deepEqual(splitGlobPatterns("**/*.js !docs/my file/**"), ["**/*.js", "!docs/my file/**"])
  const ex = compileGlobMatchers(splitGlobPatterns("**/*.js !docs/my file/**"))
  assert.ok(ex.test("a.js"), "root .js included")
  assert.ok(!ex.test("docs/my file/a.js"), "space-bearing exclude path honored")
  assert.ok(ex.test("docs/other/a.js"), "other docs subdir not excluded")
})

// ─── 单元：排除前缀（T-G4/G5——调用侧拆分 + 求交）────────────────

test("T-G4: 排除前缀——**/*.js !test/** 匹配 .js 剔除 test/", () => {
  const parts = splitGlobPatterns("**/*.js !test/**")
  assert.deepEqual(parts, ["**/*.js", "!test/**"])
  const m = compileGlobMatchers(parts)
  assert.ok(m.test("a.js"))
  assert.ok(m.test("src/lib/z.js"))
  assert.ok(!m.test("test/a.js"), "test/ 下的 .js 剔除")
  assert.ok(!m.test("test/sub/y.js"), "test/ 深层 .js 剔除")
})

test("T-G5: brace + 排除组合——**/*.{js,md} !docs/**", () => {
  const m = compileGlobMatchers(splitGlobPatterns("**/*.{js,md} !docs/**"))
  assert.ok(m.test("a.js"))
  assert.ok(m.test("top.md"))
  assert.ok(!m.test("docs/readme.md"), "docs/ 下的 .md 剔除")
  assert.ok(!m.test("docs/deep/x.js"))
})

// ─── 单元：未支持/畸形语法显式报错（T-G6/G7/G8/G10——英文）──────

test("T-G6: 未支持 extglob（?(x)/@(a|b)/+(x)）→ 显式英文错误（非静默漏匹配）", () => {
  for (const bad of ["*.?(js|txt)", "*.@(js|txt)", "*.+(js|txt)", "src/**/!(*.test).js"]) {
    assert.throws(() => globToRegex(bad), /unsupported extglob/, `pattern ${bad} must error explicitly`)
  }
})

test("T-G7: 空 brace {} → 显式错误", () => {
  assert.throws(() => globToRegex("*.{}"), /empty brace group/)
})

test("T-G8: 未闭合 brace {js → 显式错误", () => {
  assert.throws(() => globToRegex("*.{js"), /unclosed brace group/)
})

test("T-G10: 嵌套 brace {a,{b,c}} → 显式错误（暂不支持）", () => {
  assert.throws(() => globToRegex("{a,{b,c}}"), /nested brace groups/)
})

// ─── 工具级集成（评审 #7——glob/grep 端到端传 "**/*.js !test/**"）──

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "tc-glob-dialect-"))
  const w = (rel, content) => {
    const p = join(dir, rel)
    mkdirSync(join(p, ".."), { recursive: true })
    writeFileSync(p, content)
    return p
  }
  w("a.js", "marker in a\n")
  w("b.txt", "marker in b\n")
  w("top.md", "marker in top\n")
  w("docs/readme.md", "marker in docs\n")
  w("test/x.js", "marker in test x\n")
  w("test/sub/y.js", "marker in test y\n")
  w("src/lib/z.js", "marker in src z\n")
  w("src/lib/w.txt", "marker in src w\n")
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

test("T-Gtool1: glob 工具端到端——brace {js,txt} 多扩展（评审 #7）", async () => {
  const { dir, cleanup } = fixture()
  try {
    const out = await byName.glob.execute({ pattern: "**/*.{js,txt}" }, { cwd: dir })
    for (const hit of ["a.js", "b.txt", "test/x.js", "test/sub/y.js", "src/lib/z.js", "src/lib/w.txt"]) {
      assert.ok(out.includes(hit), `glob brace must match ${hit}\n${out}`)
    }
    assert.ok(!out.includes("top.md") && !out.includes("readme.md"), "brace excludes non-listed extensions")
  } finally {
    cleanup()
  }
})

test("T-Gtool2: glob 工具端到端——'**/*.js !test/**' 排除生效（评审 #7）", async () => {
  const { dir, cleanup } = fixture()
  try {
    const out = await byName.glob.execute({ pattern: "**/*.js !test/**" }, { cwd: dir })
    assert.ok(out.includes("a.js"), "root .js included")
    assert.ok(out.includes("src/lib/z.js"), "src .js included")
    assert.ok(!out.includes("test/x.js"), "test/ .js excluded")
    assert.ok(!out.includes("test/sub/y.js"), "nested test/ .js excluded")
  } finally {
    cleanup()
  }
})

test("T-Gtool3: glob 工具端到端——brace + 排除组合 + 畸形语法显式报错", async () => {
  const { dir, cleanup } = fixture()
  try {
    const combo = await byName.glob.execute({ pattern: "**/*.{js,md} !docs/**" }, { cwd: dir })
    assert.ok(combo.includes("a.js") && combo.includes("top.md"), "includes .js/.md")
    assert.ok(!combo.includes("docs/readme.md"), "docs/ excluded")
    const err = await byName.glob.execute({ pattern: "**/*.?(js|txt)" }, { cwd: dir })
    assert.match(err, /glob error: invalid pattern/, "glob tool surfaces the syntax error")
    assert.match(err, /unsupported extglob/)
  } finally {
    cleanup()
  }
})

test("T-Gtool4: grep 工具端到端——glob 参数 '**/*.js !test/**' 排除生效（评审 #7）", async () => {
  const { dir, cleanup } = fixture()
  try {
    const out = await byName.grep.execute({ pattern: "marker", glob: "**/*.js !test/**" }, { cwd: dir })
    assert.ok(/[\\/]a\.js:1:/.test(out), "a.js searched")
    assert.ok(/[\\/]src[\\/]lib[\\/]z\.js:1:/.test(out), "src/lib/z.js searched")
    assert.ok(!/[\\/]test[\\/]/.test(out), "test/ 下文件被 glob 排除")
  } finally {
    cleanup()
  }
})

test("T-Gtool5: grep 工具端到端——glob brace 扩展 '**/*.{js,txt}'", async () => {
  const { dir, cleanup } = fixture()
  try {
    const out = await byName.grep.execute({ pattern: "marker", glob: "**/*.{js,txt}" }, { cwd: dir })
    assert.ok(/[\\/]b\.txt:1:/.test(out), "b.txt searched via brace extension")
    assert.ok(!out.includes("readme.md") && !out.includes("top.md"), ".md excluded via brace extension")
  } finally {
    cleanup()
  }
})

// ─── 零回归（T-G9）───────────────────────────────────────────────

test("T-G9: 既有 glob 语义零回归——** 递归 / * 段内 / 精确匹配", async () => {
  const re1 = globToRegex("**/*.txt")
  assert.ok(re1.test("a.txt") && re1.test("deep/nested/a.txt") && !re1.test("a.txt.bak"))
  const re3 = globToRegex("*.mjs")
  assert.ok(re3.test("a.mjs") && !re3.test("sub/a.mjs"))
  const re5 = globToRegex("exact.mjs")
  assert.ok(re5.test("exact.mjs") && !re5.test("notexact.mjs"))
  const { dir, cleanup } = fixture()
  try {
    const out = await byName.glob.execute({ pattern: "**/*.txt" }, { cwd: dir })
    assert.ok(out.includes("b.txt") && out.includes("src/lib/w.txt"))
  } finally {
    cleanup()
  }
})
