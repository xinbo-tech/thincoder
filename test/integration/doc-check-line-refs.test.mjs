/**
 * doc-check-line-refs.test.mjs — 集成用例 26-1 / 26-2（RTM CLI 端故事 26「清账要先有一把可复述的尺」；
 * 判据原文 = `test/RTM.md` 第 26 节）。
 *
 * 业务入口 = 真 `doc_check` 工具调用（`thincoder-core/agent-tools/doc-check.mjs` 的 `report` + 显式 `docs`）——
 * 不直调 `runDocCheck`：本档要的是「清账读到的那份清单」这个业务可观察结果。
 * 断言面 = 工具回执文本（报面）：清单块的量法行 / 合计行 / 逐处行 / 空态行，以及末行结论句。
 *
 * 机制 = `docs/core/design/DOC-DISCIPLINE.md` §3.23 条目 W（`report` 面的行号坐标清单 · 只报不拦）。
 * 夹具 = 系统临时域（`mkdtempSync`）⇒ 零落仓 + 并发免疫；两例各自独立起一份（「同一夹具」= 同一夹具形，不依赖执行序）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/doc-check-line-refs.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { docCheckTool } from "../../thincoder-core/agent-tools/doc-check.mjs"

const TMP = []

/** 夹具：`{相对路径: 内容}` ⇒ 临时域根（绝对路径）。 */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "lr-integration-"))
  TMP.push(root)
  for (const [rel, body] of Object.entries(files)) {
    const p = join(root, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, body)
  }
  return root
}

/** 业务入口：真工具调用（`report` + 显式 `docs`）——回执文本即清账读到的那份报面。 */
const runReport = (root, docs) => docCheckTool.execute({ mode: "report", docs }, { agent: { cwd: root } })

/** 清单块 = 从量法行起、到末行结论之前的那几行。 */
function blockLines(report) {
  const lines = report.split("\n")
  const start = lines.findIndex((l) => l.startsWith("量法（行号坐标清单）"))
  assert.notEqual(start, -1, `报面里没有清单块（量法行 = 块首行）：\n${report}`)
  assert.match(lines[lines.length - 1], /^结论：/, `末行仍是结论句：${lines[lines.length - 1]}`)
  return lines.slice(start, lines.length - 1)
}

after(() => { for (const d of TMP) rmSync(d, { recursive: true, force: true }) })

test("26-1 三形各一处：量法行 + 合计 3 处 + 三行逐处（①②③）+ 末行仍是结论", () => {
  const root = fixture({
    "docs/common.md": "# 共用档\n\n正文。\n",
    "docs/notes.md": [
      "# 笔记",
      "",
      "紧贴：docs/common.md:12 处。",
      "承名：见 docs/common.md，第 :34 行。",
      "段落承名：docs/common.md",
      ":56 处。",
      "",
    ].join("\n"),
  })
  const report = runReport(root, ["docs/notes.md"])
  const block = blockLines(report)
  // 首行 = 量法行：抽取式（档名 ∥ 坐标）与扫描域都在这一行
  assert.ok(block[0].includes("档名 = /"), `量法行缺档名抽取式：${block[0]}`)
  assert.ok(block[0].includes("坐标 = /"), `量法行缺坐标抽取式：${block[0]}`)
  assert.ok(block[0].includes("扫描域 = 传入清单 1 档"), `量法行缺扫描域：${block[0]}`)
  // 合计行
  assert.equal(block[1], "正文面 3 处 · 围栏内 0 处 · 合计 3 处")
  // 逐处行：三行，形别 ①②③ 各一
  const perHit = block.slice(2)
  assert.equal(perHit.length, 3, `逐处行应为三行：${JSON.stringify(perHit)}`)
  for (const mark of ["①", "②", "③"]) {
    assert.equal(perHit.filter((l) => l.includes(mark)).length, 1, `形别 ${mark} 应各一处：${JSON.stringify(perHit)}`)
  }
  // 末行仍是结论句（清单不抢结论的位）
  assert.match(report.split("\n").at(-1), /^结论：0 条命中/)
})

test("26-2 无行号坐标：量法行仍出 + 空态行「行号坐标 0 处」+ 块内无空行", () => {
  const root = fixture({ "docs/prose.md": "# 纯正文档\n\n这一行没有行号坐标，也没有档名。\n" })
  const report = runReport(root, ["docs/prose.md"])
  const block = blockLines(report)
  assert.ok(block[0].startsWith("量法（行号坐标清单）"), `块首行必须是量法行：${block[0]}`)
  assert.ok(block[0].includes("扫描域 = 传入清单 1 档"), `量法行缺扫描域：${block[0]}`)
  assert.equal(block[1], "行号坐标 0 处")
  assert.equal(block.length, 2, `无命中时块内只此两条：${JSON.stringify(block)}`)
  assert.ok(block.every((l) => l.trim() !== ""), "块内不留空行——空行读起来像「没跑」")
})
