/**
 * portability-advisor-context.test.mjs — PORTABILITY（CLI 面）面③：顾问上下文注入（T-32）。
 * 原 T-10–T-12（注入 / 降级句 / 声明优先）与 T-20（提示词编辑面）已随 2026-09-12 散文锚退役批
 * （PROSE-ANCHOR-RETIRE）整删——装配器出口的提示词句子断言属散文锚（判据见 `docs/design/TESTING.md`
 * §11.1 C1-a）。2026-09-27（conventions.json 退役批）本档重开：T-32 = 声明载体换源后的注入面
 * （**行为形**断言——返回路径 + 降级句；判据线 = `docs/core/design/PORTABILITY.md` §3.1 / §3.4）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { injectDocumentMap, injectProjectStandards, NO_DOC_MAP_NOTICE, NO_STANDARDS_NOTICE } from "@thincoder/core/advisor/project-context.mjs"
import { clearDeclarationCache } from "@thincoder/core/conventions.mjs"

test("T-32 注入面（声明载体换源）：manifest advisor.docMap / standardsDoc ⇒ 返回声明路径；未声明 ⇒ 探测 / 降级句（零改）", () => {
  const ws = mkdtempSync(join(tmpdir(), "portability-inject-"))
  const put = (rel, text) => { const p = join(ws, ...rel.split("/")); mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, text, "utf8"); return p }
  const declare = (obj) => { writeFileSync(join(ws, "PROJECT-MANIFEST.json"), JSON.stringify(obj)); clearDeclarationCache() }
  const agent = { cwd: ws }
  try {
    // ① 未声明：既有探测保留 + standards 降级句（零改）
    const probed = put("docs/README.md", "# probed map\n")
    let parts = []
    assert.equal(injectDocumentMap(agent, parts, ws), probed, "未声明 docMap ⇒ 既有探测命中")
    parts = []
    assert.equal(injectProjectStandards(agent, parts, ws), null, "未声明 standardsDoc ⇒ 降级")
    assert.ok(parts.includes(NO_STANDARDS_NOTICE), "降级句逐字在场（零改）")
    // ② 声明生效：返回声明路径 + 内容注入（行为形）
    const mapP = put("docs/MAP.md", "# declared map\n")
    const stdP = put("docs/STANDARDS.md", "# declared standards\n")
    declare({ advisor: { docMap: "docs/MAP.md", standardsDoc: "docs/STANDARDS.md" } })
    parts = []
    assert.equal(injectDocumentMap(agent, parts, ws), mapP, "docMap 声明生效（返回声明路径）")
    assert.ok(parts.some((p) => p.includes("# declared map")), "声明地图内容已注入")
    parts = []
    assert.equal(injectProjectStandards(agent, parts, ws), stdP, "standardsDoc 声明生效")
    assert.ok(parts.some((p) => p.includes("# declared standards")), "声明标准内容已注入")
    // ③ 声明指向不存在的文件 ⇒ 降级（不静默、不回落探测）
    declare({ advisor: { docMap: "docs/NOPE.md" } })
    parts = []
    assert.equal(injectDocumentMap(agent, parts, ws), null, "声明不可读 ⇒ 降级")
    assert.ok(parts.includes(NO_DOC_MAP_NOTICE), "文档地图降级句逐字在场")
  } finally {
    clearDeclarationCache()
    rmSync(ws, { recursive: true, force: true })
  }
})
