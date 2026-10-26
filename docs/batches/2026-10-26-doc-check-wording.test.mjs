/**
 * 单元测试档 —— doc-check 报面措辞（批 2026-10-26-doc-check-wording）。
 * 名随批、随批归档；用毕即删（收口轮删除）。判据改动词必配（设计档 A-DD27 ⑥）。
 *
 * 钉住用户 2026-10-26 逐字口径：
 *   问题描述 = 「文字太长，难于阅读」；处置 = 「重新组织语言重写」。
 * 并钉住两处已修缺陷：报面不报字符数；行太长不得被报成段。
 */
import { runDocCheck } from '../../thincoder-core/doc-check/index.mjs'
import { checkParagraphs, DOC_CLASS } from '../../thincoder-core/doc-check/paragraph.mjs'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let fail = 0
const ok = (name, cond, extra = '') => {
  console.log((cond ? '✓ ' : '✗ ') + name + (extra ? '  ' + extra : ''))
  if (!cond) fail++
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dcw-'))
const log = '这是一句测试文字，用来验证段落判据与报面。'.repeat(15)

// ① 类名逐字 = 用户口径
ok('DOC_CLASS.para 逐字', DOC_CLASS.para === '文字太长，难于阅读', DOC_CLASS.para)
ok('DOC_CLASS.line 逐字', DOC_CLASS.line === '行太长', DOC_CLASS.line)

// ② 折行失效 / 拆段有效（FR45 ② ③）
const f = path.join(tmp, 'a.md')
fs.writeFileSync(f, '# t\n\n' + log + '\n', 'utf8')
const h1 = checkParagraphs({ paragraphMax: 300, lineMax: 300, files: [f] })
fs.writeFileSync(f, '# t\n\n' + log.slice(0, 100) + '\n' + log.slice(100) + '\n', 'utf8')
const h2 = checkParagraphs({ paragraphMax: 300, lineMax: 300, files: [f] })
ok('段中插换行 ⇒ 判定不变', h1.length === 1 && h2.length === 1)
fs.writeFileSync(f, '# t\n\n' + log.slice(0, 100) + '\n\n' + log.slice(100, 200) + '\n\n' + log.slice(200) + '\n', 'utf8')
ok('分三段 ⇒ 0 命中', checkParagraphs({ paragraphMax: 300, lineMax: 300, files: [f] }).length === 0)

// ③ gate 报面：说问题本身、不报字符数、给处置
fs.writeFileSync(f, '# t\n\n' + log + '\n', 'utf8')
let r = runDocCheck(tmp, { mode: 'gate', docs: [f] })
ok('gate 首行含「1 段文字太长，难于阅读」', r.report.includes('1 段文字太长，难于阅读'))
ok('gate 报面无「字符」', !r.report.includes('字符'))
ok('命中行不带字符数括注', !/✗ .*:\d+（/.test(r.report))
ok('处置句含「重新组织语言重写」', r.report.includes('重新组织语言重写'))
ok('处置句不含「拆段」「写短」', !r.report.includes('拆段') && !r.report.includes('写短'))

// ④ 行太长不得被报成段（评审第 1 轮 #1 的靶）
const p = path.join(tmp, 'thincoder-core', 'prompts', 'x.md')
fs.mkdirSync(path.dirname(p), { recursive: true })
fs.writeFileSync(p, 'x'.repeat(320) + '\n', 'utf8')
r = runDocCheck(tmp, { mode: 'gate', docs: [p] })
ok('仅行太长 ⇒ 首行报「1 行太长」', r.report.split('\n')[0].includes('1 行太长'))
ok('仅行太长 ⇒ 首行不含「段文字太长」', !r.report.split('\n')[0].includes('段文字太长'))
ok('仅行太长 ⇒ 无段处置句', !r.report.includes('重新组织语言重写'))

// ⑤ report 态无字符数、按类分列
r = runDocCheck(tmp, { mode: 'report', docs: [f] })
ok('report 射程行无「字符」', !r.report.split('\n')[1].includes('字符'))
ok('report 命中行按类分列', r.report.includes(DOC_CLASS.para))

fs.rmSync(tmp, { recursive: true, force: true })
console.log(fail === 0 ? '\n全部通过' : `\n失败 ${fail} 条`)
process.exit(fail === 0 ? 0 : 1)
