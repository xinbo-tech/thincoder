/**
 * portability-vsc-index.test.mjs — 批次二（可移植性 VSC 镜像面）用例表 1:1：
 * T-V14–T-V19（设计档 `thincoder-vscode/docs/design/PORTABILITY.md` §6）+ AC-V06/AC-V07/AC-V08 机判面（§7）。
 * 零网络（fetch 桩覆盖 buildIndex 的 embed 段）/ 零真实 LLM / 零长等待（临时树 + 内存夹具）。
 * 判据权威 = §3.4（索引扩表/声明并集/可见化）/ §4.3（面板提示行逐字）/ §4.4（六档逐字）/ §4.5（扩表清单）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { discoverFiles, isIndexableFile, kindFor } from "../src/index-discover.mjs"
import { buildIndex, needsRebuild } from "../src/indexer.mjs"
import { buildIndex as panelBuildIndex } from "../src/extension/panel-index.mjs"
import { setVSCodeEmbedder, resetEmbedder } from "../src/embed-config.mjs"
import { setProjectFolder, clearProjectOverride } from "../src/extension/panel-messages.mjs"
import { clearConventionsCache, loadConventions } from "../src/conventions.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { slow } from "./slow.mjs"
import * as vscode from "vscode"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
let _savedWs
before(() => {
  _savedWs = vscode.workspace.workspaceFolders
  _setConfigPathForTest(join(mkdtempSync(join(tmpdir(), "pvi-cfg-")), "config.json"))
})
after(() => {
  vscode.workspace.workspaceFolders = _savedWs
  clearProjectOverride()
  resetEmbedder()
  _setConfigPathForTest(null)
  clearConventionsCache()
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "pvi-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
const STUB_EMBEDDER = { baseURL: "http://stub.invalid/v1", apiKey: "k", model: "stub" }
/** fetch 桩：按 input 数量回等长向量（embed 校验 data.length === batch.length）。 */
function withFetch(fn, dim = 4) {
  const real = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body)
    return { ok: true, json: async () => ({ data: body.input.map((_, i) => ({ index: i, embedding: new Array(dim).fill(0.5) })) }) }
  }
  return Promise.resolve().then(fn).finally(() => { globalThis.fetch = real })
}
function stubPanel() {
  const posted = []
  return { posted, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
}
/** 源码读取（EOL 归一——静态锚不因 CRLF/LF 写法漂移）。 */
const readSrc = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n")

// ─── T-V14–T-V16：索引扩表 / 声明并集 / 可见化（VP-9 / AC-V06） ────────────────

test("T-V14 正常（扩展名）：.dart/.lua/.cs/.org 默认可索引（扩表对齐 §4.5）", () => {
  const ws = mkws()
  const conv = loadConventions(ws)
  for (const f of ["a.dart", "a.lua", "a.cs"]) {
    assert.equal(isIndexableFile(f, conv), true, `${f} 默认入索引（扩表前不可见）`)
    assert.equal(kindFor(f, conv), "code", `${f} 判 code`)
  }
  assert.equal(isIndexableFile("a.org", conv), true, "DOC 扩表：.org 默认入索引")
  assert.equal(kindFor("a.org", conv), "doc", ".org 判 doc")
  // 发现面同源（走同一 isIndexableFile）
  write(ws, "src/a.dart", "void main() {}\n")
  write(ws, "notes/b.org", "* heading\n")
  const found = discoverFiles(ws)
  assert.ok(found.includes("src/a.dart"), "discoverFiles 命中 .dart")
  assert.ok(found.includes("notes/b.org"), "discoverFiles 命中 .org")
})

test("T-V15 边界（声明）：index.codeExtensions:[\".xyz\"] → .xyz 入索引；未列入 → unlistedExts 计数（并集/可见面）", () => {
  const ws = mkws()
  write(ws, ".thincoder/conventions.json", JSON.stringify({ index: { codeExtensions: [".xyz", "QQQ"] } }))
  write(ws, "src/a.xyz", "x\n")
  write(ws, "src/b.qqq", "x\n") // 归一 `.QQQ` → `.qqq`——声明大小写不敏感
  write(ws, "src/c.weird", "x\n")
  const res = discoverFiles(ws, undefined, { collectUnlisted: true })
  assert.ok(res.files.includes("src/a.xyz"), "声明扩展入索引（并集——默认表仍生效）")
  assert.ok(res.files.includes("src/b.qqq"), "声明扩展归一（大写/无点形态）")
  assert.ok(res.files.includes("src/readme.md") === false, "负控：不存在文件不误报")
  assert.equal(isIndexableFile("c.weird", loadConventions(ws)), false, "未列入仍不入索引")
  assert.equal(res.unlisted.count, 1, "未列入计数（恰 1 个 .weird）")
  assert.deepEqual(res.unlisted.exts, [{ ext: ".weird", count: 1 }], "样本 = {ext, count}")
  // 默认档正控：不声明时 .xyz 未列入（同一文件同判据）
  const ws2 = mkws()
  write(ws2, "src/a.xyz", "x\n")
  const res2 = discoverFiles(ws2, undefined, { collectUnlisted: true })
  assert.equal(res2.unlisted.count, 1, "无声明 → .xyz 未列入")
})

slow("T-V16 正常（可见化）：buildIndex 返回 unlistedExts；面板消息含提示行（§4.3 逐字）", async () => {
  const cwd = mkws()
  write(cwd, "src/a.mjs", "export const a = 1\n")
  write(cwd, "src/x.qqq", "x\n")
  write(cwd, "src/y.qqq", "y\n")
  write(cwd, "src/z.zzz", "z\n")
  const direct = await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  assert.equal(direct.files, 1, "正控：可索引文件恰 1（其余为未列入）")
  assert.equal(direct.unlistedExts.count, 3, "unlistedExts 计数（.qqq×2 + .zzz×1）")
  assert.deepEqual(direct.unlistedExts.exts.map((e) => e.ext).sort(), [".qqq", ".zzz"], "样本按扩展名聚合")
  // 面板面：真 buildIndex(panel)（vscode 桩 withProgress + showInformationMessage 捕获）
  vscode.workspace.workspaceFolders = [{ uri: { fsPath: cwd } }]
  setProjectFolder(cwd)
  setVSCodeEmbedder(STUB_EMBEDDER)
  const calls = []
  const realInfo = vscode.window.showInformationMessage
  vscode.window.showInformationMessage = async (text) => { calls.push(text); return undefined }
  try {
    await withFetch(() => panelBuildIndex(stubPanel()))
    const built = calls.find((t) => String(t).startsWith("Index built:"))
    assert.ok(built, "完成提示在案")
    assert.ok(
      String(built).includes("Index built: 1 files, 1 chunks. Semantic search is now active. 3 file(s) skipped — extensions not indexed: .qqq, .zzz; declare index.codeExtensions in .thincoder/conventions.json to include them."),
      "提示行逐字（§4.3——含声明指路）",
    )
    // 零未列入 → 原文案不变（零回归）——同一桩窗口内换工作区重跑
    const clean = mkws()
    write(clean, "src/only.mjs", "export const x = 1\n")
    vscode.workspace.workspaceFolders = [{ uri: { fsPath: clean } }]
    setProjectFolder(clean)
    calls.length = 0
    await withFetch(() => panelBuildIndex(stubPanel()))
    assert.equal(calls.find((t) => String(t).startsWith("Index built:")), "Index built: 1 files, 1 chunks. Semantic search is now active.", "无未列入 → 原文案零追加")
  } finally { vscode.window.showInformationMessage = realInfo }
})

// ─── T-V19：非 git 回退零回归（回归锁） ─────────────────────────────────────

slow("T-V19 正常（索引回归）：非 git 回退路径行为零回归（up-to-date → file-added → file-changed）", async () => {
  const cwd = mkws()
  write(cwd, "src/a.mjs", "export const a = 1\n")
  await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  assert.deepEqual(needsRebuild(cwd), { needed: false, reason: "up-to-date" }, "建后即 up-to-date（非 git 全量发现 + mtime 回退保持）")
  write(cwd, "src/b.mjs", "export const b = 2\n")
  assert.equal(needsRebuild(cwd).reason, "file-added", "新文件触发重建")
  await withFetch(() => buildIndex(cwd, STUB_EMBEDDER, {}))
  write(cwd, "src/a.mjs", "export const a = 42\n")
  assert.equal(needsRebuild(cwd).reason, "file-changed", "改动触发重建")
})

// ─── T-V17–T-V18：提示词六档（VP-3–VP-7 / AC-V07 · AC-V08） ─────────────────

const SRC_DE = "src/prompts/discipline-engineering.md"
const CN_DE = "docs/design/prompts/discipline-engineering.md"
const SRC_AD = "src/prompts/advisor-design.md"
const CN_AD = "docs/design/prompts/advisor-design.md"
const SRC_PD = "src/prompts/persona-eng-designer.md"
const CN_PD = "docs/design/prompts/persona-eng-designer.md"
const SIX = [SRC_DE, CN_DE, SRC_AD, CN_AD, SRC_PD, CN_PD]

test("T-V17 正常（提示词）：六档新通用化句在场（§4.4 逐条）；旧本仓句零命中；红线锚零损（AC-V07/AC-V08）", () => {
  const t = Object.fromEntries(SIX.map((f) => [f, readSrc("../" + f)]))
  // §4.4(a)(b)：树形状 → 落点按项目文档约定
  for (const f of [SRC_DE, CN_DE]) {
    assert.ok(t[f].includes("板块设计文档（一板块一档、功能点不独立成文——落点按项目文档约定；本产品自研仓 = docs/design/<TOPIC>.md）按**三节 + 变更记录**组织；"), `${f}: 树形状句改写`)
    assert.ok(t[f].includes("the project's requirement-pool record（池文件按项目约定；本产品自研仓 = docs/TODO.md）"), `${f}: Pool routing 句改写`)
    assert.ok(t[f].includes("技术待办仍走项目技术待办区（本产品自研仓 = docs/TODO.md 技术组）"), `${f}: 池边界句改写`)
    assert.ok(!t[f].includes("— parent-side maintained files (docs/TODO.md, CHANGELOG.md, checklist family)"), `${f}: 旧父侧维护句零残留`)
    assert.ok(!t[f].includes("技术待办仍走 `docs/TODO.md` 技术组"), `${f}: 旧池边界句零残留`)
  }
  assert.ok(t[SRC_DE].includes("the project's own process files (requirement pool / changelog / checklist family — 本产品自研仓"), "EN files 域声明句改写")
  assert.ok(t[CN_DE].includes("——项目自身的流程文件（需求池 / 变更记录 / checklist 族——本产品自研仓"), "CN files 域声明句改写")
  // §4.4(a)：A1 勘察 / A4 实践沉淀落点句（EN 侧）+ §4.4(c)(d)：advisor-design 双源
  assert.ok(t[SRC_DE].includes("（查项目文档地图——本产品自研仓 = docs/design/README.md；已有则更新不新建）"), "EN A1 勘察句")
  assert.ok(t[SRC_DE].includes("（落点按项目文档约定；本产品自研仓 = 对应板块的 docs/design/<TOPIC>.md）"), "EN A4 沉淀句")
  assert.ok(t[SRC_AD].includes("Does it follow the project's document norms and the 4-step workflow?"), "EN 方法论合规句（去 METHODOLOGY）")
  assert.ok(t[SRC_AD].includes("(per the project's document map, when the review context provides one)"), "EN 文档归属句")
  assert.ok(t[SRC_AD].includes("Tier authority: the code-structure criteria stated in this bullet."), "EN 档位权威句")
  assert.ok(t[SRC_AD].includes("(e.g. `path/to/file.md:42`)"), "EN 引用格式例（去本仓路径）")
  assert.ok(t[SRC_AD].includes("Judge against the Project Guide (when present in the review context)"), "EN 要点句")
  assert.ok(t[CN_AD].includes("（按项目文档地图——当评审上下文提供时；本产品自研仓 = docs/design/README.md）"), "CN 文档归属句")
  assert.ok(t[CN_AD].includes("档位权威 = 本条目陈述的代码结构判据。"), "CN 档位权威句")
  assert.ok(t[CN_AD].includes("（如 `path/to/file.md:42`）"), "CN 引用格式例")
  assert.ok(t[CN_AD].includes("按评审上下文中提供的 Project Guide（存在时）与本提示词的评审标准判断"), "CN 要点句")
  assert.ok(!t[SRC_AD].includes("docs/design/AGENT-LOOP.md:180") && !t[CN_AD].includes("docs/design/AGENT-LOOP.md:180"), "旧本仓引用例零残留")
  // §4.4(e)(f)：persona-eng-designer 双源
  assert.ok(t[SRC_PD].includes("Your write domain = the project's requirements/design documents（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。"), "EN 写域句")
  assert.ok(t[CN_PD].includes("写域 = 项目的需求档 / 设计档（落点按项目文档约定；本产品自研仓 = docs/，扣除 docs/design/prompts/——提示词文件（含中文模板）是产品代码，不归你）。"), "CN 写域句")
  assert.ok(!t[SRC_PD].includes("advance `docs/TODO.md` status when merging requirements") && !t[SRC_PD].includes("不触碰本仓 `docs/TODO.md`"), "EN todo 推进本仓引用零残留")
  assert.ok(!t[CN_PD].includes("并入需求时同步推进 `docs/TODO.md`") && !t[CN_PD].includes("不触碰本仓 `docs/TODO.md`"), "CN todo 推进本仓引用零残留")
  assert.ok(t[SRC_PD].includes("不触碰项目台账档") && t[CN_PD].includes("不触碰台账档"), "todo 推进 = 通用形态（与 CLI 已交付同源口径）")
  // 红线锚零损（§3.6——跨仓逐字锚抽查：A1/A2/⑥ 组）
  for (const f of [SRC_DE, CN_DE]) {
    assert.ok(t[f].includes("**六段自写 · 一段一作者**：批次档 §1 主 agent / §2 eng-designer / §3 评审子代理 / §4 主 agent / §5 eng-coder / §6 父代理——"), `${f}: A1 锚在位`)
    assert.ok(t[f].includes("写入手段 = `batch_segment({segment, text})`（**无路径参数**"), `${f}: A2 锚在位`)
    assert.ok(t[f].includes("`Action` 恰好四选一") || t[f].includes("`Action` is one of exactly four values:"), `${f}: Action 四值句锚在位`)
    assert.ok(t[f].includes("修正轮 ⇄ 用户批准 时序"), `${f}: 修正轮 bullet 锚在位`)
  }
  // AC-V07 机判面：编辑面内指令性引用 = 0（「本产品自研仓 =」标注形态除外）；check-doc-width 零指涉（全形态）
  for (const f of SIX) {
    t[f].split("\n").forEach((line, i) => {
      for (const pat of ["docs/design/README.md", "docs/design/<TOPIC>.md"]) {
        if (line.includes(pat)) assert.ok(line.includes("本产品自研仓"), `${f}:${i + 1} 指令性引用 ${pat} 无「本产品自研仓 =」标注形态`)
      }
      assert.ok(!line.includes("check-doc-width"), `${f}:${i + 1} check-doc-width 零指涉被破坏`)
    })
  }
})

test("T-V18 边界（R24 对齐）：EN/CN discipline-engineering R24 行两档同文；退役文件引用形态与 CN 现形态一致（AC-V07）", () => {
  const R24 = "动机与完整机制见纪律层 `src/prompts/discipline-normal.md` 代码结构判据节（原 `docs/design/METHODOLOGY.md`（CLI 侧）已于 2026-09-10 退役入 `_archive/`）。"
  const en = readSrc("../" + SRC_DE)
  const cn = readSrc("../" + CN_DE)
  assert.ok(en.includes(R24), "EN R24 行 = 目标文本逐字")
  assert.ok(cn.includes(R24), "CN R24 行同文（两档逐字一致——§2 D4）")
  assert.ok(!en.includes("动机与完整机制见 `docs/design/METHODOLOGY.md` R24 节"), "旧 R24 句零残留（EN）")
  assert.ok(!/Read METHODOLOGY\.md/.test(en) && !/Read METHODOLOGY\.md/.test(cn), "`Read METHODOLOGY.md` 全形态零命中（AC-V04 提示词面）")
})
