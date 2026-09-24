/**
 * permission-transit.test.mjs — P2 机制层端差批 · 车道 1（批档 docs/batches/2026-09-20-mechanism-parity-batch.md §2.20 CLI 半）：
 * T-PT1–T-PT5——转口恒等（函数对象 ===）/ 假 io.ask 语义（恰调一次 + 返回值为准）/
 * io.ask 未处理 ⇒ 回默认通道（非 TTY ⇒ [deny] + false）/ TUI 缝置位 + resolve 贯通核闸 /
 * TUI 行式预览保留（edit / apply_patch 分支）。
 *
 * 权威面 = 核 `thincoder-core/permission.mjs`（闸语义 + 请示文案单源——#165 落点）；
 * CLI 档 = 转口（`src/cli/permission.mjs`）；TUI 只承载展示面（卡片预览经 io.ask 缝注入）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import * as cliPermission from "../src/cli/permission.mjs"
import * as corePermission from "@thincoder/core/permission.mjs"
import { createInteraction } from "../src/tui/interaction.mjs"

/** 强制非 TTY 窗口（确定性——在真 TTY 下跑测试时，默认通道会尝试交互问答而挂死）。 */
async function withNonTTY(fn) {
  const desc = Object.getOwnPropertyDescriptor(process.stdin, "isTTY")
  Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true, writable: true })
  try {
    return await fn()
  } finally {
    if (desc) Object.defineProperty(process.stdin, "isTTY", desc)
    else delete process.stdin.isTTY
  }
}

/** TUI 交互夹具（假 state / render / pushLine——缝断言面最小化）。 */
function tuiFixture({ autoApprove = false } = {}) {
  const state = {}
  const lines = []
  const interaction = createInteraction({
    agent: { autoApprove },
    state,
    pushLine: (text, color) => lines.push({ text, color }),
    pushLabel: () => {},
    render: () => {},
    summarize: (args) => JSON.stringify(args),
  })
  return { interaction, state, lines }
}

test("T-PT1 转口恒等——CLI 三符号 === 核函数对象", () => {
  assert.equal(cliPermission.summarize, corePermission.summarize)
  assert.equal(cliPermission.formatPermission, corePermission.formatPermission)
  assert.equal(cliPermission.askPermission, corePermission.askPermission)
})

test("T-PT2 假 io.ask——恰调一次、以其返回值为准", async () => {
  const seen = []
  const yes = await cliPermission.askPermission(
    "bash",
    { command: "ls" },
    { ask: (req) => { seen.push(req); return true } },
  )
  assert.equal(yes, true)
  assert.equal(seen.length, 1)
  assert.equal(seen[0].name, "bash")
  assert.deepEqual(seen[0].toolArgs, { command: "ls" })
  assert.equal(typeof seen[0].text, "string") // 展示面载荷 = 核 formatPermission 输出

  const no = await cliPermission.askPermission("bash", { command: "ls" }, { ask: () => false })
  assert.equal(no, false)
  assert.equal(seen.length, 1) // 第二次走假 io.ask——不再入 seen
})

test("T-PT3 io.ask 未处理（undefined）⇒ 回默认通道（非 TTY ⇒ [deny] + false）", async () => {
  const r = await withNonTTY(async () => {
    const errs = []
    const original = console.error
    console.error = (...a) => errs.push(a.join(" "))
    try {
      const answer = await cliPermission.askPermission(
        "write",
        { path: "a.mjs", content: "x" },
        { ask: () => undefined },
      )
      return { answer, errs }
    } finally {
      console.error = original
    }
  })
  assert.equal(r.answer, false)
  assert.ok(r.errs.some((l) => l.includes("[deny] write (non-interactive, side-effect tools require a TTY)")))
})

test("T-PT4 TUI 缝——state.permission 置位、resolve 贯通核闸、auto 档端特有行保留", async () => {
  const { interaction, state } = tuiFixture()
  const p = interaction.askPermission("bash", { command: "ls" })
  assert.equal(state.status, "Waiting: bash")
  assert.equal(state.permission.name, "bash")
  assert.deepEqual(state.permission.args, { command: "ls" })
  assert.equal(typeof state.permission.resolve, "function")
  assert.ok(Array.isArray(state.permissionPreview))
  state.permission.resolve(true)
  assert.equal(await p, true)

  const p2 = interaction.askPermission("write", { path: "a.mjs", content: "x" })
  state.permission.resolve(false)
  assert.equal(await p2, false)

  // auto 档：端特有可见行保留（核闸不参与）
  const auto = tuiFixture({ autoApprove: true })
  assert.equal(await auto.interaction.askPermission("bash", { command: "ls" }), true)
  assert.equal(auto.state.permission, undefined)
  assert.ok(auto.lines.some((l) => l.text.includes("[auto] bash")))
})

test("T-PT5 TUI 行式预览保留——edit / apply_patch 分支仍在", async () => {
  const { interaction, state } = tuiFixture()
  const editLines = interaction.formatPermission("edit", { path: "a.mjs", old_string: "old", new_string: "new" })
  assert.ok(Array.isArray(editLines))
  assert.ok(editLines.includes("- old"))
  assert.ok(editLines.includes("+ new"))

  const patch = "@@ -1 +1 @@\n-old\n+new"
  assert.deepEqual(interaction.formatPermission("apply_patch", { patch }), patch.split("\n"))

  const p = interaction.askPermission("apply_patch", { patch })
  assert.deepEqual(state.permissionPreview, patch.split("\n"))
  state.permission.resolve(true)
  assert.equal(await p, true)
})
