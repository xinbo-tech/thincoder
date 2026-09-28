/**
 * views-settings-agent.test.mjs — 「对齐第三批」agent 面用例（U212 —— 自 `test/views-settings.test.mjs` 拆出）：
 *   P14（`agent` 表外标量键类型加工 + 出值规范化）/ P15（具名十键在场 / 单键 patch / 即改即存）两面。
 * 设计单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」P14 / P15 两行 + `docs/desktop/design/IPC.md` §2 设置族注。
 * 拆档理由 = 档行预算（`docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」）：宿主档 `test/views-settings.test.mjs`
 * 已在册例外面（≤ 500 硬限）⇒ 本族例入档即触硬限，故按在册预案**本批执行**用例面拆出 —— 面不变、判据不变，只换宿主档；
 * 先例 = `test/views-rail-actions.test.mjs`（同因拆出）。
 * 纪律：假 DOM 房屋样式（`mountFace` 内 `selfCheck` 先行）+ 词面哨兵缝（树内文本判键面）⇒ 本档零重复实现同规则（单源）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { t } from "../renderer/i18n.mjs"
import { clickOn, mountFace, sentinel } from "./views-harness.mjs"

// ─── U212 「对齐第三批」agent 面两件（P14 类型加工 + 出值规范化 · P15 具名十键即改即存）──
//   判据面 = 本档（键集闭集十键 + 控型三值 + 出值四径）∥ 导出面锁（`test/views-locks.test.mjs` U52：
//   `settings-sections.mjs` 导出面含 `NAMED_FIELDS` —— 键集单源）。

/** 扩展字段夹（具名十键全配 + 表外标量两键 —— P14 泛化面）。 */
const agentFields = () => [
  { path: "agent.maxTurns", kind: "number", value: 12 },
  { path: "agent.subagentTurns", kind: "number", value: 100 },
  { path: "agent.poolLimits.engCoder", kind: "number", value: 4 },
  { path: "agent.poolLimits.other", kind: "number", value: 4 },
  { path: "agent.poolLimits.advisor", kind: "number", value: 4 },
  { path: "agent.compactThreshold", kind: "number", value: 100000 },
  { path: "agent.verifyGuard", kind: "boolean", value: false },
  { path: "agent.consultTurns", kind: "number", value: 40 },
  { path: "agent.consultTimeoutMs", kind: "number", value: 600000 },
  { path: "agent.advisor.reasoningEffort", kind: "string", value: "high" },
  { path: "agent.unknownNum", kind: "number", value: 7 },
  { path: "agent.unknownBool", kind: "boolean", value: true },
  { path: "agent.key", kind: "string", value: "••", sensitive: true },
]

test("U212: 「对齐第三批」agent 面（P15 具名十键在场 / 单键 patch / 即改即存 · P14 控型三值 / 出值规范化 / 无效零发送）", async (ctx) => {
  const answer = (channel) => channel === "settings:agent" ? { ok: true, fields: agentFields() } : { ok: true }
  const { fake, host, root, info } = await mountFace(ctx, answer, { open: false })
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  // 开面板走产品径（信息行单入口 ⇒ `openSettings` 四段读数随动 —— 夹具直开面不触发 `settings:agent` 读）
  clickOn(fake, info.querySelector('[data-action="settings:open"]'))
  await drain()
  await drain()
  const namedRows = () => root.querySelectorAll("[data-field-name]")
  const namedInput = (path) => {
    const row = namedRows().find((node) => node.getAttribute("data-field-name") === path)
    assert.notEqual(row, undefined, `具名行在场（${path}）`)
    return row.querySelector("input")
  }

  // ① P15 十键在场（控型三值）+ 词面标签 + 锚 = 全路径
  assert.equal(namedRows().length, 10, "具名控件恰十键（字段全配面）")
  assert.deepEqual(namedRows().map((node) => node.getAttribute("data-field-name")), [
    "agent.maxTurns", "agent.subagentTurns", "agent.poolLimits.engCoder", "agent.poolLimits.other",
    "agent.poolLimits.advisor", "agent.compactThreshold", "agent.verifyGuard", "agent.consultTurns",
    "agent.consultTimeoutMs", "agent.advisor.reasoningEffort",
  ], "键集 = 十键闭集（表单源 = `NAMED_FIELDS`）")
  assert.deepEqual(
    ["number", "number", "number", "number", "number", "number", "checkbox", "number", "number", "text"],
    namedRows().map((node) => node.querySelector("input").getAttribute("type")),
    "控型三值 = number ×8 / checkbox ×1（verifyGuard）/ text ×1（advisorEffort）",
  )
  assert.deepEqual(
    namedRows().slice(0, 3).map((node) => node.querySelector("label").textContent),
    [sentinel("settings.agent.maxTurns"), sentinel("settings.agent.subagentTurns"), sentinel("settings.agent.poolLimits.engCoder")],
    "标签 = 词表键值（零硬编码标签）",
  )
  assert.equal(namedInput("agent.maxTurns").value, "12", "调值 = 字段面（number 控件 display 值）")

  // ② P15 即改即存：`change` ⇒ 单键 patch 直发（数值 ⇒ `Number` 非字符串），零保存键参与
  const quiet = host.call("settings:agent").length
  assert.equal(fake.fire(namedInput("agent.maxTurns"), "change", { target: { value: "42", type: "number" } }), 1, "具名控件真注册（`change` 面）")
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.maxTurns": 42 } }], "单键 patch 直发 + 数值出值（`Number(v)`）")
  assert.equal(host.call("settings:agent").length, quiet + 1, "恰一次出站（零保存键 / 零其它键）")

  // ③ 布尔控件（`checked` 出值）+ `scale` 面（分钟 ↔ 毫秒）
  fake.fire(namedInput("agent.verifyGuard"), "change", { target: { checked: true, type: "checkbox" } })
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.verifyGuard": true } }], "布尔 ⇒ `.checked` 出值")
  assert.equal(namedInput("agent.consultTimeoutMs").value, "10", "分钟面显示值 = ms ÷ 60000（十 分钟：600000ms）")
  fake.fire(namedInput("agent.consultTimeoutMs"), "change", { target: { value: "5", type: "number" } })
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.consultTimeoutMs": 300000 } }], "写值 = 分钟 × 60000（回毫秒轴）")

  // ④ P14 无效数值 ⇒ 零发送 + 控件回退现值（父侧裁定：删键不可达 —— 不写盘 · 零乐观改）
  const logged = []
  const previous = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  ctx.after(() => { console.error = previous })
  const calls = host.call("settings:agent").length
  for (const value of ["", "abc"]) {
    fake.fire(namedInput("agent.maxTurns"), "change", { target: { value, type: "number" } })
    await drain()
  }
  assert.equal(host.call("settings:agent").length, calls, "空 / 非数 ⇒ 零 IPC（不写盘）")
  assert.equal(namedInput("agent.maxTurns").value, "12", "控件回退现值（重绘自 store 现态 —— 零乐观改）")
  assert.equal(logged.filter((line) => line.includes("invalid value")).length, 2, "零静默：两径各一行诊断")
  // 数值 0 **不**入无效族（裁定面 = 空 / 非数；核类型表只校 `typeof` ⇒ 值域语义归消费面）：照发
  fake.fire(namedInput("agent.maxTurns"), "change", { target: { value: "0", type: "number" } })
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.maxTurns": 0 } }], "数值 0 照发出站（零端侧值域白名单）")

  // ⑤ P14 泛化兑底行（表外标量键）：控型仍按 `kind` 三值；具名键不入泛化面（零重复控件）
  const generic = (path) => root.querySelectorAll("[data-field]").find((node) => node.getAttribute("data-field") === path)
  assert.equal(generic("agent.maxTurns"), undefined, "具名键不入泛化面（单一控件）")
  assert.equal(generic("agent.unknownNum").querySelector("input").getAttribute("type"), "number", "表外数值键 ⇒ number 控件（P14 同表）")
  assert.equal(generic("agent.unknownBool").querySelector("input").getAttribute("type"), "checkbox", "表外布尔键 ⇒ checkbox 控件")
  assert.equal(generic("agent.key").getAttribute("data-readonly"), "", "敏感键仍只读（P14 边界：只读面不动）")
  const genericCalls = host.call("settings:agent").length
  const genericInput = generic("agent.unknownNum").querySelector("input")
  fake.fire(genericInput, "change", { target: { value: "9", type: "number" } })
  await drain()
  assert.equal(host.call("settings:agent").length, genericCalls, "泛化行 `change` 零直发（即改即存属具名面）")
  genericInput.value = "9"
  clickOn(fake, root.querySelector('[data-action="settings:saveAgent"]'))
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.unknownNum": 9 } }], "保存键出值 = `Number` 型（非字符串 —— P14 规范化）+ 值未变行零发")

  // ⑤-b 泛化行无效数值（空）+ 仅此变更 ⇒ 零发送 + 回退现值（重绘）+ 一行诊断（与具名径同形 —— 裁定句三）
  //   节点重查（上一步成功写 ⇒ 回执就位 ⇒ 重绘换节点 —— 旧引用已脱挂）
  const genericMarks = logged.length
  const beforeInvalid = host.call("settings:agent").length
  generic("agent.unknownNum").querySelector("input").value = ""
  clickOn(fake, root.querySelector('[data-action="settings:saveAgent"]'))
  await drain()
  assert.equal(host.call("settings:agent").length, beforeInvalid, "泛化行无效数值 ⇒ 零 IPC（不写盘）")
  assert.equal(generic("agent.unknownNum").querySelector("input").value, "7", "控件回退现值（重绘自 store 现态 —— 零乐观改）")
  assert.equal(logged.slice(genericMarks).filter((line) => line.includes("invalid value for agent.unknownNum")).length, 1, "零静默：一行诊断（携路径）")

  // ⑥ 失败回执 ⇒ 回退 + 可见失败面（零乐观写 —— 与档位控件同 `report()` 出口；载值径 `{patch}` 直测）
  const failing = await mountFace(ctx, (channel, payload) => channel === "settings:agent" && payload?.patch !== undefined
    ? { ok: false, reason: "mtime-conflict" }
    : channel === "settings:agent" ? { ok: true, fields: agentFields() } : { ok: true })
  clickOn(failing.fake, failing.info.querySelector('[data-action="settings:open"]'))
  await drain()
  await drain()
  const failRow = (path) => failing.root.querySelectorAll("[data-field-name]").find((node) => node.getAttribute("data-field-name") === path).querySelector("input")
  const reads = failing.host.call("settings:agent").length
  failing.fake.fire(failRow("agent.maxTurns"), "change", { target: { value: "77", type: "number" } })
  await drain()
  assert.deepEqual(failing.host.call("settings:agent").at(-1), ["settings:agent", { patch: { "agent.maxTurns": 77 } }], "失败径载荷照发（判据在核侧写时 —— 端侧不预判）")
  assert.equal(failing.host.call("settings:agent").length, reads + 1, "失败径零重读（零乐观写 —— 盘面未变）")
  assert.equal(failRow("agent.maxTurns").value, "12", "控件回退回执前值（重绘自 store 现态）")
  const notice = failing.root.querySelector("[data-notice]")
  assert.equal(notice.getAttribute("data-scope"), "agent", "失败面落位 = agent 段（段标可读）")
  assert.equal(notice.textContent, `${t("settings.section.agent")}${t("settings.reason.mtimeConflict")}`, "核 reason 直传 + 表内出词（零静默）")
})
