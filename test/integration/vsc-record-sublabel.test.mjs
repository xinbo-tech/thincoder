/**
 * vsc-record-sublabel.test.mjs — 集成场景 1-1 / 1-2（RTM 故事 1「归档块重开 ∥ reload 后，子代理行还是子代理行」）
 *
 * 业务入口：VSC 里跑完一个带嵌套子代理的回合 → 重开面板 ∥ reload 窗口 → 展开归档块，读行首。
 *
 * 交互组件（跨组件，不是单件）：webview 归档派生点（`rowsOf` → 快照 `rows`）⟷ 槽 JSON 记录 ⟷
 * 两条恢复径 —— VSC 页级重建（核 `renderSubagentChunk`）∥ CLI 读面合成（`synthSubTask`）。
 *
 * 断言只落用户面那行字：每条子代行以 `explore#1 · ` 起头、父自己的行零子标、正文不重复出现子标；
 * 1-2 判「三个端读同一条记录看到同一件事」——把同一条记录分别喂给两条恢复径，**行全文逐字相等**。
 *
 * 机制单源 = `docs/vsc/design/WEBVIEW.md` §5.7 行形条 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6 行首子标条；
 * 记录形单源 = `docs/core/design/SESSION.md` §6.26。本档不复制判据，只验「跨组件后用户看到什么」。
 *
 * 与批档内单元用例的区别：单元件钉单个派生点的四种形态；本档钉**两条恢复径同判**
 * （含空正文行两端皆不产行——该态活流不可达，故不设单元例，只在此验两端一致）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { Window } from "../../thincoder-vscode/node_modules/happy-dom/lib/index.js"

const window = new Window()
globalThis.window = window
globalThis.document = window.document

const { renderSubBlock, renderSubagentChunk } = await import("../../thincoder-render-core/subblocks/block.mjs")
const { rowsOf, boundRows } = await import("../../thincoder-vscode/webview/record-rows.js")
const { synthSubTask } = await import("../../thincoder-cli/src/tui/lifecycle-records.mjs")

/** 活块（核 `renderSubBlock`——快照 ∥ 回放两径的同一块形）。 */
function liveBlock() {
  return renderSubBlock({
    key: "sub:explore#1", label: "explore#1", role: "explore", id: 1,
    startedAt: Date.now(), status: "running", pool: false,
  })
}

/** 行全文（含行首子标 span 的文本——用户看到的那一行）。 */
function lineTexts(block) {
  const content = block.querySelector(".advisor-content")
  return [...(content ? content.children : [])].map((el) => el.textContent)
}

/** VSC 恢复径：把记录 `rows` 原样回放进一个同形块，返回用户可见行。 */
function restoreOnVsc(record) {
  const block = liveBlock()
  for (const row of record.rows) renderSubagentChunk(block, row)
  return lineTexts(block)
}

/** CLI 恢复径：同一份记录经读面合成，返回用户可见行。 */
function restoreOnCli(record) {
  return synthSubTask(record).blocks.map((b) => b.text)
}

/** 会话里跑完一个嵌套子代理回合 ⇒ 归档块落流（活流面）。 */
function archivedRecord() {
  const block = liveBlock()
  // 父自己的行（无 dataset.sub）
  const parentRow = document.createElement("div")
  parentRow.textContent = "let me look into it"
  block.querySelector(".advisor-content").appendChild(parentRow)
  // 子代行（dataset.sub 由核 `appendAdvisorChunk` 写入）
  renderSubagentChunk(block, { kind: "tool", text: "read — src/x.mjs", sub: "explore#1", face: "tool", tool: "read" })
  renderSubagentChunk(block, { kind: "text", text: "looking into it", sub: "explore#1" })
  return { kind: "subagent", meta: { key: "sub:explore#1", role: "explore" }, rows: boundRows(rowsOf(block)) }
}

// ─── 1-1 归档块重开 ∥ reload 后，子代理行还是子代理行 ─────────────────

test("1-1 重开后子代行仍以 `explore#1 · ` 起头，父自己的行零子标", () => {
  const record = archivedRecord()
  const lines = restoreOnVsc(record)
  assert.deepEqual(lines, [
    "let me look into it",           // 父自己的行：零子标
    "explore#1 · read — src/x.mjs",  // 子代行：行首子标仍在
    "explore#1 · looking into it",
  ])
})

test("1-1 行正文不重复出现子标（否则回放双份）", () => {
  const record = archivedRecord()
  for (const row of record.rows) {
    if (row.sub === undefined) continue
    assert.equal(row.text.includes(`${row.sub} · `), false, `正文里不该再烙一份子标：${row.text}`)
  }
})

test("1-1 重新归档同一块 ⇒ 行形不变（重开不劣化）", () => {
  const record = archivedRecord()
  const replay = liveBlock()
  for (const row of record.rows) renderSubagentChunk(replay, row)
  const again = boundRows(rowsOf(replay))
  assert.deepEqual(again, record.rows)
})

// ─── 1-2 同一会话，VSC 与 CLI 两端恢复同一份记录 ──────────────────────

test("1-2 新形记录：两端行文逐字一致（三端同串同位置）", () => {
  const record = archivedRecord()
  assert.deepEqual(restoreOnCli(record), restoreOnVsc(record))
})

test("1-2 存量记录（子标烙在 text 内）：两端照旧逐字一致、子标恰一份", () => {
  const legacy = {
    kind: "subagent",
    meta: { key: "sub:explore#1", role: "explore" },
    rows: [{ kind: "tool", text: "explore#1 · read — src/x.mjs" }],
  }
  const cli = restoreOnCli(legacy)
  assert.deepEqual(cli, ["explore#1 · read — src/x.mjs"])
  assert.equal(cli[0].split("explore#1").length - 1, 1, "子标恰一份（不叠加）")
  assert.deepEqual(restoreOnVsc(legacy), cli)
})

test("1-2 空正文行：两端皆不产行（同一谓词，无端差）", () => {
  const record = {
    kind: "subagent",
    meta: { key: "sub:explore#1", role: "explore" },
    rows: [
      { kind: "text", text: "", sub: "explore#1" }, // 该态活流不可达；此处只验两端同判
      { kind: "tool", text: "read — src/x.mjs", sub: "explore#1" },
    ],
  }
  assert.deepEqual(restoreOnCli(record), ["explore#1 · read — src/x.mjs"])
  assert.deepEqual(restoreOnVsc(record), ["explore#1 · read — src/x.mjs"])
})
