/**
 * 2026-09-29-desktop-residuals-round3.test.mjs — 桌面残余三轮 · **波 A（注释面 · 零行为）+ 波 C（设置面）** 批次本地件
 * ⚠ 断代失效（2026-09-30 · 台账 #731 核处）：本件白盒断言所测内部形态已随后续批次演进（#719 消化面重构 ∥ chat-tree 拆档 ∥ 锚链序变更等）——重跑必红为预期；特性现形态的回归锚以近期批件为准。本件留档参考，勿按红态排障。
 * （潜行形：`docs/batches/` 落位走父侧收位 —— 写门相抵同 #545 先例；运行 = 自 `thincoder/` 根
 *  `node --test .thincoder/tmp/2026-09-29-desktop-residuals-round3.test.mjs`，收位后换 `docs/batches/` 同法）。
 * 腿集 · 波 A（§2.2 #539 ∕ #610 ∕ #618②；纯 fs 扫描，零产品码 import）：
 *   ① #539 引注收正：四扫式零命中（沿 `rail-row` ∕ `views/sessions.mjs:` ∕ `views/info-row.mjs` ∕ `chat-copy`）+ 新锚在盘
 *   ② #610 「待发送面不得以『流内』命名」：「流内待发送」∧「改住流内」零命中 + 五改述处含「输入区上方」
 *   ③ #618② 注值一致：`settings-sections-tools.mjs` 注面载 `****`（对齐指示位实值 `settings.keySet`）
 *   ④ 零行为自证：13 处改行皆注释形（块注释状态机 + 注释起始形）∧ 13 处旧文零残留
 * 腿集 · 波 C（设置面 · 2026-09-29；⑤–⑨ 真档 import —— `/rc/` 钩子随本件自注）：
 *   ⑤ #617-CH 主进程臂：`agentFields` 五键出（slotAuthority 真 ∕ 假）∧ 单源随迁 ∧ 拒码 `slot-authority` 保留
 *   ⑥ #617-CH 渲染臂：slot 权威键行只读（零控件 ∧ 拒写词）∧ 保存判据排除 ∕ 普通布尔键仍可编辑 ∧ 提交集不含
 *   ⑦ #615② 失败草稿链：失败落 `keyDraft`（trim 同点）∕ 成功·取消·开·关四复位 ∕ 渲染按名回填
 *   ⑧ #617-CJ 错误面非模态：error 转顶部横幅（点击穿透 ∕ z 序居设置面下）∧ 基规则全窗零改（loading 反例）
 *   ⑨ 零越面：波 C 渲染档静态闭包（零 `node:` ∕ 零 `require`）
 * 腿集 · 波 B（行为面小件 · 同口径；⑩–⑯ —— 产品码动态取件 ∕ 迷你假 DOM ∕ 沙箱）：
 *   ⑩ #541 归约臂（`onDigest`：cap 并前片保 `n` · cap 事实跨 `end` 存续 · 下一轮 `start` 换代清 · 归一）
 *   ⑪ #541 发射臂（`createTurnFace`：边界轮撞帽 ⇒ `ev:digest` cap 帧恰一；timer 轮 ∕ 用户回合 ⇒ 零 cap 帧）
 *   ⑫ #541 cap 帧尾臂（`syncChrome`：组在场 ∧ 含 `[data-digest-cap]` ∧ 行文 = `digest.capStop` 投影 ∧ 二帧零写）
 *   ⑬ #541 end 帧尾臂（携 cap ⇒ 驻留 ∧ 计数行 = `digest.done`（n=5））+ 对照 ∕ 自愈 ∕ 换代三臂
 *   ⑭ #541 样式臂（`chat.css` 两规则 + 值面 `--fg-muted` ∕ `--warn`）
 *   ⑮ #613 双提交竞态臂（滞后失败回执不得错摘后提交块）+ 单提交反例（失败 ⇒ 退流）
 *   ⑯ #599 relay 保形臂（含 `⟦ev⟧` 字面的内层内容 chunk ⇒ `ev:subchunk`；事件面消费 ∕ `[model]` patch 保持；VSC 同判）
 *   ⑰ #543 待答期携文入队臂（补遗实施轮 · 裁定 A）：撞帽询问悬挂 + `interrupt(key,"msg")` ⇒ 入忙态队
 *      （快照含该条）+ 回合判 `stopped` + 消费 = 下一回合边界取走原文；反例 = 裸停 ⇒ 零入队 ∕ 零消费
 * 后续波（D）臂随增（同件续写）。
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（波 C 渲染档取件 —— 平 node 解析 `/rc/*`）

const here = dirname(fileURLToPath(import.meta.url)) // 显式位 = 仓根下两级（.thincoder/tmp 或 docs/batches 同解）
const dskRoot = join(here, "../..", "thincoder-desktop")
const dskPath = (rel) => join(dskRoot, rel)
const read = (rel) => readFileSync(dskPath(rel), "utf8")

/** renderer/** 全树源串（.mjs ∕ .css 递归 —— 引注式扫面）。 */
function rendererSources() {
  const out = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(mjs|css)$/.test(e.name)) out.push(p)
    }
  }
  walk(join(dskRoot, "renderer"))
  return out
}
const sources = rendererSources().map((p) => ({ p, text: readFileSync(p, "utf8") }))
const hitsOf = (needle) => sources.filter((f) => f.text.includes(needle)).map((f) => f.p)

/** 逐行标注：行首是否处于块注释内（块注释开闭状态机 —— 本批文件无字符串内注释符）。 */
function commentStartFlags(text) {
  const flags = []
  let open = false
  for (const line of text.split("\n")) {
    flags.push(open)
    let i = 0
    while (i < line.length) {
      if (open) {
        const end = line.indexOf("*/", i)
        if (end < 0) break
        open = false
        i = end + 2
      } else {
        const start = line.indexOf("/*", i)
        if (start < 0) break
        open = true
        i = start + 2
      }
    }
  }
  return flags
}

/** 13 处改行（旧文 → 新文 —— 届盘落值；零行为自证基准）。 */
const EDITS = [
  ["renderer/chat-composer.css", "沿 `.rail-row:focus-visible` 先例", "沿 `.session-item:focus-visible` 先例"], // #539 ①
  ["renderer/views/chat.mjs", "接线两态沿 `renderer/views/sessions.mjs:161` 通则", "接线两态沿 `renderer/views/chat-tool.mjs` 通则"], // #539 ②
  ["renderer/views/chat-tool.mjs", "接线两态（通则沿 `renderer/views/sessions.mjs:161`）", "接线两态（两态原语单源 = 本档 `wire` ∕ `withKey`）"], // #539 ③
  ["renderer/views/settings.mjs", "`renderer/views/info-row.mjs`（本档", "`renderer/mount-info.mjs`（本档"], // #539 ④
  ["renderer/views/settings.mjs", "`views/onboarding.mjs` / `views/info-row.mjs` 两挂载共用本表", "`views/onboarding.mjs` / `renderer/mount-info.mjs` 两挂载共用本表"], // #539 ⑤
  ["renderer/settings.css", "`views/onboarding.mjs`（向导）· `views/info-row.mjs`（信息行）", "`views/onboarding.mjs`（向导）· `renderer/mount-info.mjs`（信息行）"], // #539 ⑥b
  ["renderer/settings.css", "变量单源 = `styles.css` `:root`", "变量单源 = `theme.css` `:root`"], // #539 ⑥c
  ["renderer/mount-composer.mjs", "⇒ 流内待发送气泡组 + 帧尾核", "⇒ 输入区上方待发送带 + 帧尾核"], // #610
  ["renderer/store.mjs", "读面 = 流内待发送气泡组（输入区上方）", "读面 = 输入区上方待发送带"], // #610
  ["renderer/store.mjs", "用户排队消息改住流内 —— 右列", "用户排队消息改住输入区上方待发送带（`pending` 镜面）—— 右列"], // #610
  ["renderer/frame-dispatch.mjs", "`pending`：流内待发送气泡组——「对齐第二批」项 2", "`pending`：输入区上方待发送带——「对齐第二批」项 2"], // #610
  ["renderer/views/pool-tree.mjs", "排队消息改住流内 `pending`；", "排队消息改住输入区上方待发送带（`pending` 镜面）；"], // #610
  ["renderer/views/settings-sections-tools.mjs", "配置 ⇒ `••••`〔键值恒不下发〕", "配置 ⇒ `****`〔键值恒不下发〕"], // #618②
]

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

// ─── ① #539 引注收正 ────────────────────────────────────────────────────────
test("① #539 四扫式零命中 + 新锚在盘", () => {
  // 扫式有意放宽（设计判据为引注式「沿 `.rail-row`」∕「chat-copy.mjs」—— 本件用更宽 token = 更强保证；现盘零命中）
  const patterns = ["rail-row", "views/sessions.mjs:", "views/info-row.mjs", "chat-copy"]
  for (const pat of patterns) assert.deepEqual(hitsOf(pat), [], `扫式「${pat}」应零命中`)
  // 新锚①：`.session-item:focus-visible` 三值先例（renderer/session-list.css）
  const sl = read("renderer/session-list.css")
  assert.ok(sl.includes(".session-item:focus-visible"))
  assert.ok(sl.includes("outline: 2px solid var(--accent);"))
  assert.ok(sl.includes("outline-offset: -2px;"))
  assert.ok(sl.includes("background: var(--hover-bg-strong);"))
  // 新锚②③：两态原语单源（renderer/views/chat-tool.mjs `wire` ∕ `withKey`）
  const ct = read("renderer/views/chat-tool.mjs")
  assert.ok(ct.includes("export function wire("))
  assert.ok(ct.includes("export function withKey("))
  assert.ok(read("renderer/views/chat.mjs").includes("接线两态沿 `renderer/views/chat-tool.mjs` 通则"), "chat.mjs 侧引注同锚")
  // 新锚④⑤⑥：信息行挂载档在盘（renderer/mount-info.mjs）
  assert.ok(existsSync(dskPath("renderer/mount-info.mjs")))
  // 新锚⑦：变量单源现位（renderer/theme.css `:root`）
  assert.ok(read("renderer/theme.css").includes(":root {"))
  // 旧档确不在盘（新锚语义成立之前提）
  assert.ok(!existsSync(dskPath("renderer/views/sessions.mjs")))
  assert.ok(!existsSync(dskPath("renderer/views/info-row.mjs")))
  out("① 四扫式命中", patterns.map((p) => `${p}=${hitsOf(p).length}`).join(" · "))
  out("① 新锚", "session-list.css 三值 ✓ ∕ chat-tool.mjs wire ∕ withKey ✓ ∕ mount-info.mjs ✓ ∕ theme.css :root ✓")
})

// ─── ② #610 「待发送面不得以『流内』命名」 ───────────────────────────────────
test("② #610 两式零命中 + 五改述处含「输入区上方」（收窄后规则）", () => {
  for (const pat of ["流内待发送", "改住流内"]) assert.deepEqual(hitsOf(pat), [], `扫式「${pat}」应零命中`)
  const spots = [
    ["renderer/mount-composer.mjs", "输入区上方待发送带 + 帧尾核"],
    ["renderer/store.mjs", "读面 = 输入区上方待发送带"],
    ["renderer/store.mjs", "改住输入区上方待发送带（`pending` 镜面）"],
    ["renderer/frame-dispatch.mjs", "`pending`：输入区上方待发送带——「对齐第二批」项 2"],
    ["renderer/views/pool-tree.mjs", "改住输入区上方待发送带（`pending` 镜面）"],
  ]
  for (const [rel, needle] of spots) assert.ok(read(rel).includes(needle), `${rel} 应含「${needle}」`)
  out("② 零命中", "流内待发送=0 · 改住流内=0")
  out("② 五改述处", spots.map(([rel]) => rel.replace("renderer/", "")).join(" · "))
})

// ─── ③ #618② 注值一致 ──────────────────────────────────────────────────────
test("③ #618② 注面载 `****`（对齐指示位实值）", () => {
  const st = read("renderer/views/settings-sections-tools.mjs")
  assert.ok(st.includes("配置 ⇒ `****`〔键值恒不下发〕"))
  assert.ok(!st.includes("••••"), "注面无 `••••` 残留")
  const i18n = read("renderer/i18n-views.mjs") // 指示位实值单源（消费点 = settings-sections-tools.mjs:119）
  assert.ok(i18n.includes('"settings.keySet": "****"'))
  out("③ 注值", "settings-sections-tools.mjs:7 ⇒ `****` · i18n-views settings.keySet = **** ✅")
})

// ─── ④ 零行为自证（13 处改行皆注释形 ∧ 旧文零残留） ────────────────────────
test("④ 零行为：13 处改行皆注释形 ∧ 旧文零残留", () => {
  for (const [rel, oldText, newText] of EDITS) {
    const text = read(rel)
    const list = text.split("\n")
    const flags = commentStartFlags(text)
    assert.ok(!text.includes(oldText), `${rel} 旧文应零残留：${oldText}`)
    const at = list.findIndex((l) => l.includes(newText))
    assert.ok(at >= 0, `${rel} 应载新文：${newText}`)
    const commentForm = flags[at] === true || /^\s*(\/\*|\*)/.test(list[at])
    assert.ok(commentForm, `${rel}:${at + 1} 应为注释行 —— ${list[at].trim().slice(0, 60)}`)
  }
  out("④ 零行为", `${EDITS.length} 处改行逐行注释形（块注释状态机）· 旧文零残留`)
})

// ═══ 波 C（设置面 · 2026-09-29）：#617-CH ∕ #617-CJ ∕ #615② ═══════════════════════════════

const at = (rel) => pathToFileURL(dskPath(rel)).href
const deskReq = createRequire(join(dskRoot, "package.json"))
const coreIo = await import(pathToFileURL(deskReq.resolve("@thincoder/core/config-io.mjs")).href)
const i18n = await import(at("renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const settingsValues = await import(at("src/main/settings-values.mjs"))
const settingsMain = await import(at("src/main/settings.mjs"))
const agentView = await import(at("renderer/views/settings-agent.mjs"))
const settingsView = await import(at("renderer/views/settings.mjs"))
const providerExitsMod = await import(at("renderer/mount-settings-segments-providers.mjs"))
const agentExitsMod = await import(at("renderer/mount-settings-segments-agent.mjs"))
const exitsMod = await import(at("renderer/mount-settings-exits.mjs"))

/** 确定性等待（fire-and-forget 链落定 —— 沿 b10-w3 件先例）。 */
const settle = async (cond, tries = 200) => { for (let i = 0; i < tries && !cond(); i += 1) await new Promise((r) => setTimeout(r, 0)) }
/** 深树查找（描述符树 —— 首命中；顶层可为数组）。 */
function findNode(tree, pred) {
  let hit = null
  const walk = (node) => {
    if (hit !== null || node === null || typeof node !== "object") return
    if (Array.isArray(node)) { for (const child of node) walk(child); return }
    if (pred(node)) { hit = node; return }
    for (const child of node.children ?? []) walk(child)
  }
  walk(tree)
  return hit
}

// ─── ⑤ #617-CH 主进程臂 ──────────────────────────────────────────────────────
test("⑤ #617-CH 主进程臂：agentFields 五键出（slotAuthority 真 ∕ 假）∧ 单源随迁 ∧ 拒码保留", async () => {
  const fields = settingsValues.agentFields({ agent: { engineering: true, autoThink: false }, providers: [] })
  const byPath = new Map(fields.map((f) => [f.path, f]))
  assert.equal(byPath.get("agent.engineering").slotAuthority, true, "slot 权威键 ⇒ 真")
  assert.equal(byPath.get("agent.autoThink").slotAuthority, false, "普通键 ⇒ 假")
  assert.deepEqual([...settingsValues.SLOT_AUTHORITY_PATHS], ["agent.advisor.guard", "agent.engineering"])
  const mainSrc = read("src/main/settings.mjs")
  assert.equal(/const SLOT_AUTHORITY_PATHS/.test(mainSrc), false, "主档零自持副本（单源随迁）")
  assert.match(mainSrc, /import \{ SLOT_AUTHORITY_PATHS, agentFields, deepEqual, deleteKeyPath, isConfigured, setKeyPath \} from "\.\/settings-values\.mjs"/)
  const dir = mkdtempSync(join(tmpdir(), "r3c-"))
  try {
    const cfg = join(dir, "config.json")
    writeFileSync(cfg, JSON.stringify({ agent: {} }))
    coreIo._setConfigPathForTest(cfg)
    const receipt = settingsMain.settingsAgent({ patch: { "agent.engineering": true } })
    assert.equal(receipt.ok, false, "写面仍拒")
    assert.equal(receipt.reason, "slot-authority", "拒码保留（防御面）")
  } finally { coreIo._resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) }
  out("⑤ 主进程臂", "slotAuthority 真 ∕ 假 ✓ · 单源随迁 ✓ · 拒码 slot-authority ✓")
})

// ─── ⑥ #617-CH 渲染臂 ────────────────────────────────────────────────────────
test("⑥ #617-CH 渲染臂：slot 键行只读（零控件 ∧ 拒写词）∧ 保存判据排除 ∕ 反例仍可编辑 ∧ 提交集不含", async () => {
  const FIELD = (path, value, slotAuthority) => ({ path, value, sensitive: false, kind: "boolean", slotAuthority })
  const fields = [FIELD("agent.engineering", true, true), FIELD("agent.someOtherFlag", false, false)]
  const tree = agentView.agentBody({ state: "ready", fields }, { onSaveAgent: () => {} })
  const rowOf = (path) => findNode(tree, (n) => n?.props?.["data-field"] === path)
  const slotRow = rowOf("agent.engineering")
  assert.ok(slotRow !== undefined, "slot 键行在场")
  assert.equal(slotRow.props["data-readonly"], "", "只读锚在位")
  assert.equal(JSON.stringify(slotRow).includes('"input"'), false, "零控件（假可供性消）")
  assert.equal(JSON.stringify(slotRow).includes("会话级选项——请从输入面板修改"), true, "拒写词键词值（零新词）")
  const normalRow = rowOf("agent.someOtherFlag")
  assert.ok(JSON.stringify(normalRow).includes('"type":"checkbox"'), "反例：普通布尔键仍可编辑")
  const onlySlot = agentView.agentBody({ state: "ready", fields: [fields[0]] }, { onSaveAgent: () => {} })
  assert.equal(onlySlot[onlySlot.length - 1].props.disabled, true, "段尾保存判据排除 slot 行")
  // 提交集不含：出口面 `data-readonly` 行 skip（既有单点 —— 只读行零写）
  const attr = (row, name) => (row[name] === undefined ? null : row[name])
  const rows = [
    { read: (n) => attr({ "data-field": "agent.engineering", "data-readonly": "" }, n), querySelector: () => ({ type: "checkbox", checked: true }) },
    { read: (n) => attr({ "data-field": "agent.someOtherFlag" }, n), querySelector: () => ({ type: "checkbox", checked: true }) },
  ].map((r) => ({ getAttribute: r.read, querySelector: r.querySelector }))
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => ({ querySelectorAll: () => rows }) }
  try {
    const calls = []
    const exits = agentExitsMod.createAgentExits({
      ask: async (channel, payload) => { calls.push([channel, payload]); return { ok: true, reason: null, fields: [] } },
      store: { get: () => ({ settings: { agent: { fields: [{ path: "agent.someOtherFlag", value: false }] } } }) },
      setSettings: () => {}, report: () => {}, clearReport: () => {}, slot: '[data-slot="settings"]', paintSettings: () => {},
    })
    exits.handlers.onSaveAgent()
    await settle(() => calls.length >= 1)
    assert.equal(calls.length, 1, "有变更 ⇒ 一发")
    assert.deepEqual(calls[0][1].patch, { "agent.someOtherFlag": true }, "提交集不含 slot path")
  } finally { globalThis.document = prevDoc }
  out("⑥ 渲染臂", "只读行零控件 ✓ · 拒写词 ✓ · 保存判据 ✓ · 提交集零该 path ✓")
})

// ─── ⑦ #615② 失败草稿链 ──────────────────────────────────────────────────────
test("⑦ #615② 失败草稿链：失败落 keyDraft（trim 同点）∕ 成功·取消·开·关四复位 ∕ 渲染按名回填", async () => {
  const mk = (receipt) => {
    const patches = []
    const exits = providerExitsMod.createProviderExits({
      ask: async () => receipt,
      store: { get: () => ({ settings: { providers: { edit: "p1", probe: null, draft: null, keyDraft: null } } }) },
      setSettings: (patch) => patches.push(patch.providers), report: () => {}, clearReport: () => {},
      loadProviders: async () => {}, slot: '[data-slot="settings"]', formOf: () => null, onProvidersChanged: () => {},
    })
    return { exits, patches }
  }
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => ({ value: " sk-typed " }) }
  try {
    const fail = mk({ ok: false, reason: "mtime-conflict" })
    await fail.exits.handlers.onProviderKeySave("p1")
    assert.deepEqual(fail.patches.at(-1).keyDraft, { name: "p1", value: "sk-typed" }, "失败 ⇒ 键入值落种子（与提交同点 trim）")
    const ok = mk({ ok: true })
    await ok.exits.handlers.onProviderKeySave("p1")
    assert.deepEqual(ok.patches.at(-1), { edit: null, probe: null, draft: null, keyDraft: null }, "成功 ⇒ 双清（edit ∕ keyDraft）")
    const cancel = mk({ ok: false })
    cancel.exits.handlers.onProviderKeyCancel()
    assert.deepEqual(cancel.patches.at(-1), { edit: null, probe: null, draft: null, keyDraft: null }, "取消 ⇒ 双清（弃输入）")
  } finally { globalThis.document = prevDoc }
  // 开 ∕ 关面复位（装配面出口 —— openSettings ∕ closeSettings）
  const state = { settings: { open: false, providers: { edit: "p1", keyDraft: { name: "p1", value: "sk" } }, mcp: {} } }
  const patches = []
  const exits = exitsMod.createExits({
    ask: async () => ({ ok: true }), store: { get: () => state },
    setSettings: (patch) => patches.push(patch), report: () => {}, clearReport: () => {}, occupies: () => false,
    reads: { loadProviders: async () => {}, loadAgent: async () => {}, loadMcp: async () => {}, loadEnv: async () => {}, loadTools: async () => {} },
    slot: '[data-slot="settings"]', paintSettings: () => {},
  })
  exits.openSettings()
  assert.equal(patches.at(-1).providers.keyDraft, null, "开面 ⇒ 草稿复位")
  state.settings.open = true
  exits.closeSettings()
  assert.equal(patches.at(-1).providers.keyDraft, null, "关面 ⇒ 草稿复位")
  // 渲染臂：按名回填 ∕ 名不合零种子 ∕ `null` 零种子
  const mkState = (keyDraft) => ({
    locale: "zh",
    settings: {
      open: true, verify: null, wizard: {},
      providers: { state: "ready", presets: [], providers: [{ name: "p1", hasKey: true, maskedKey: "x" }], edit: "p1", probe: null, draft: null, keyDraft },
      agent: { state: "none", fields: [] }, mcp: { state: "none", servers: [], details: {} }, model: { state: "none" },
      env: { state: "none" }, tools: { state: "none", keys: null }, models: { state: "none" },
    },
  })
  const inputProps = (keyDraft) => findNode(settingsView.settingsTree(settingsView.settingsModel(mkState(keyDraft)), {}), (n) => n?.props?.["data-provider-key-input"] !== undefined)?.props
  assert.equal(inputProps({ name: "p1", value: "sk-typed" }).value, "sk-typed", "种子回填（名下）")
  assert.equal(inputProps({ name: "other", value: "sk-typed" }).value, undefined, "名不合 ⇒ 零种子")
  assert.equal(inputProps(null).value, undefined, "null ⇒ 零种子")
  out("⑦ 草稿链", "失败落种子（trim）✓ · 四复位 ✓ · 渲染按名回填 ✓")
})

// ─── ⑧ #617-CJ 错误面非模态 ──────────────────────────────────────────────────
test("⑧ #617-CJ 错误面非模态：error 转顶部横幅（点击穿透 ∕ z 序居设置面下）∧ 基规则全窗零改（loading 反例）", async () => {
  const css = read("renderer/chrome.css")
  assert.match(css, /\.boot-gate \{ position: fixed; inset: 0; z-index: 200;/, "基规则全窗零改（loading 口径 —— 转轮在盘）")
  const rule = css.match(/\.boot-gate\[data-state="error"\] \{([^}]*)\}/)
  assert.ok(rule !== null, "error 覆盖规则在盘")
  const body = rule[1]
  assert.match(body, /inset: 0 0 auto/, "顶部横幅（底边自动 ⇒ 带高）")
  assert.match(body, /pointer-events: none/, "点击穿透（载原因不覆盖交互）")
  const z = Number(body.match(/z-index: (\d+)/)[1])
  const settingsZ = Number(read("renderer/settings.css").match(/\[data-slot="settings"\] \{[\s\S]*?z-index: (\d+);/)[1])
  assert.ok(z < settingsZ, `横幅 z=${z} < 设置面 z=${settingsZ}（设置面可进可出）`)
  assert.match(read("renderer/skin.css"), /\.boot-gate\[data-state="error"\] \.boot-spinner \{ display: none; \}/, "错误面转轮停（值面零改）")
  assert.match(read("renderer/index.html"), /id="boot-gate"[^>]*role="status"/)
  const onboarding = await import(at("renderer/views/onboarding.mjs"))
  assert.equal(onboarding.wizardModel({ settings: { configured: null, wizard: {} } }).active, false, "未知档 ⇒ 向导不进（向导槽空）")
  out("⑧ CJ", `基规则全窗 ✓ · error 转横幅（inset 0 0 auto ∕ pointer-events:none ∕ z=${z}<${settingsZ}）✓`)
})

// ─── ⑨ 零越面：波 C 渲染档静态闭包 ───────────────────────────────────────────
test("⑨ 零越面：波 C 改档静态闭包（零 `node:` ∕ 零 `require`）", () => {
  const files = [
    "renderer/views/settings-agent.mjs", "renderer/views/settings.mjs", "renderer/views/settings-sections.mjs",
    "renderer/store.mjs", "renderer/mount-settings-segments-providers.mjs", "renderer/mount-settings-exits.mjs",
  ]
  for (const rel of files) {
    const src = read(rel)
    assert.equal(/from\s+"node:/.test(src) || /require\(/.test(src), false, `${rel}: 零 node: ∕ 零 require`)
  }
  out("⑨ 零越面", `${files.length} 档静态闭包 ✓`)
})

// ═══ 波 B（行为面小件 · 2026-09-29）：#541 ∕ #613 ∕ #599 ═══════════════════════════════════

const coreRel = (rel) => new URL("../../thincoder-core/" + rel, import.meta.url).href
const vscRel = (rel) => new URL("../../thincoder-vscode/" + rel, import.meta.url).href
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))
/** 任务队列排空（无参 —— 区别于波 C 条件等待 `settle`）。 */
const drain = async () => { for (let i = 0; i < 10; i += 1) await tick(0) }

/** 迷你假 DOM（⑫⑬ 帧尾臂 —— 支撑 `dom.mjs` `build` 的最小面；选择器 = `[attr]` ∕ `[attr="value"]` 两形）。 */
function installMiniDom() {
  class NodeBase {}
  class El extends NodeBase {
    constructor(tag) {
      super()
      this.tagName = tag
      this.attrs = {}
      this.childNodes = []
      this.parentNode = null
      this._text = ""
    }
    set textContent(value) { this._text = String(value); this.childNodes = [] }
    get textContent() { return this._text + this.childNodes.map((c) => (typeof c === "string" ? c : c.textContent)).join("") }
    setAttribute(name, value) { this.attrs[String(name)] = String(value) }
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, String(name)) ? this.attrs[String(name)] : null }
    append(child) { this.childNodes.push(child); if (child instanceof El) child.parentNode = this }
    insertBefore(next, anchor) {
      const idx = anchor ? this.childNodes.indexOf(anchor) : -1
      if (idx >= 0) { this.childNodes.splice(idx, 0, next); next.parentNode = this } else this.append(next)
    }
    remove() { const p = this.parentNode; if (!p) return; const idx = p.childNodes.indexOf(this); if (idx >= 0) p.childNodes.splice(idx, 1); this.parentNode = null }
    replaceWith(next) { const p = this.parentNode; if (!p) return; const idx = p.childNodes.indexOf(this); if (idx >= 0) { p.childNodes[idx] = next; next.parentNode = p } this.parentNode = null }
    querySelector(selector) { return queryAll(this, selector)[0] ?? null }
    querySelectorAll(selector) { return queryAll(this, selector) }
  }
  const matches = (node, selector) => {
    const m = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(selector)
    if (!m) return false
    if (!Object.prototype.hasOwnProperty.call(node.attrs, m[1])) return false
    return m[2] === undefined || node.attrs[m[1]] === m[2]
  }
  const queryAll = (rootEl, selector) => {
    const found = []
    const walk = (n) => { for (const child of n.childNodes) if (child instanceof El) { if (matches(child, selector)) found.push(child); walk(child) } }
    walk(rootEl)
    return found
  }
  globalThis.Node = NodeBase
  globalThis.document = { createElement: (tag) => new El(tag) }
  return { El }
}

/** 消化族模型（`chromeModel` 最小形 —— `syncChrome` 全腿可跑：诸切片缺席 ⇒ 只摘不插）。 */
const chromeModelOf = (digest) => ({
  state: "flow", blocks: [], hidden: 0, following: true, pendingNew: 0,
  guide: null, approval: [], digest, compress: null, timer: null,
  stopped: false, ledger: null, canRetry: false, configured: false,
})

const digestStart = (n) => ({ status: "start", n, tier: null, from: null, msg: null })

// ─── ⑩ #541 归约臂 ──────────────────────────────────────────────────────────
test("⑩ #541 归约臂：cap 并前片保 n · cap 事实跨 end 存续 · 下一轮 start 换代清 · 归一", async () => {
  const { onDigest } = await import(at("renderer/events-wake.mjs"))
  const KEY = "1"
  let state = onDigest({}, { key: KEY, status: "start", n: 5 })
  assert.deepEqual(state.digest[KEY], { status: "start", n: 5, tier: null, from: null, msg: null }, "start 起跑态")
  state = onDigest(state, { key: KEY, status: "cap", mode: "stop", turns: 3 })
  assert.deepEqual(state.digest[KEY], { status: "cap", n: 5, tier: null, from: null, msg: null, cap: { mode: "stop", turns: 3 } }, "cap 帧：并前片保 n=5 + cap 事实")
  state = onDigest(state, { key: KEY, status: "end", ok: true, ms: 1200 })
  assert.equal(state.digest[KEY].status, "end")
  assert.equal(state.digest[KEY].n, 5, "end 保 n=5（免 n=0）")
  assert.deepEqual(state.digest[KEY].cap, { mode: "stop", turns: 3 }, "cap 事实跨 end 存续")
  state = onDigest(state, { key: KEY, status: "start", n: 1 })
  assert.deepEqual(state.digest[KEY], { status: "start", n: 1, tier: null, from: null, msg: null }, "下一轮 start 换代重写 ⇒ cap 事实清")
  const norm = onDigest(onDigest({}, { key: KEY, status: "start", n: 0 }), { key: KEY, status: "cap", mode: "weird", turns: "x" })
  assert.deepEqual(norm.digest[KEY].cap, { mode: "auto", turns: null }, "mode 表外 ⇒ auto · turns 非数 ⇒ null")
  out("⑩ #541 归约", "start(n=5) ⇒ cap(保 n) ⇒ end(保 n ∧ 保 cap) ⇒ start(清)；归一 auto ∕ null ✓")
})

// ─── ⑪ #541 发射臂 ──────────────────────────────────────────────────────────
test("⑪ #541 发射臂：边界轮撞帽 ⇒ ev:digest cap 帧恰一；timer 轮 ∕ 用户回合 ⇒ 零 cap 帧", async () => {
  const { _resetSessionsDirForTest, _setSessionsDirForTest } = await import(coreRel("session-slots.mjs"))
  const { _resetConfigPathForTest, _setConfigPathForTest } = await import(coreRel("config.mjs"))
  const { ContinueError } = await import(coreRel("agent.mjs"))
  const { createTurnFace } = await import(at("src/main/turn-face.mjs"))
  const root = mkdtempSync(join(tmpdir(), "tc-r3-b-cap-"))
  const KEY = "1"
  try {
    mkdirSync(join(root, "sessions"), { recursive: true })
    const cwd = join(root, "project")
    mkdirSync(cwd, { recursive: true })
    _setSessionsDirForTest(join(root, "sessions"))
    _setConfigPathForTest(join(root, "config.json"))
    /** 代理最小形（结算面消费齐备；`title` 在场 ⇒ 标题自守卫短路 ⇒ 零网络）——沿 #632 批件夹具。 */
    const makeAgent = () => ({
      cwd,
      provider: { name: "fake", apiKey: "test-key", baseURL: "http://127.0.0.1:1/v1", model: "gpt-4o" },
      history: [], _fullHistory: [], title: "夹具标题", tasks: [],
      planMode: false, autoApprove: false, goal: null, _pendingReminders: [], _sessionStart: null,
      _engDesignTokens: new Map(), config: {},
    })
    const events = []
    const face = createTurnFace({
      post: (ch, payload) => events.push({ ch, payload }), bridge: () => ({}), postUsage: () => {}, flights: new Map(),
      run: async () => { throw new ContinueError(7) },
    })
    const caps = () => events.filter((e) => e.ch === "ev:digest" && e.payload?.status === "cap")
    await face.executeTurn(KEY, makeAgent(), "t", { autoTurn: true })
    assert.deepEqual(caps(), [{ ch: "ev:digest", payload: { key: KEY, status: "cap", mode: "stop", turns: 7 } }], "边界轮（autoTurn ∧ ¬timerTurn）⇒ 恰一发 cap 帧（载荷逐字）")
    events.length = 0
    await face.executeTurn(KEY, makeAgent(), "t", { autoTurn: true, timerTurn: true })
    assert.deepEqual(caps(), [], "timer 轮不冒充消化边界 ⇒ 零 cap 帧")
    events.length = 0
    await face.executeTurn(KEY, makeAgent(), "t", {})
    assert.deepEqual(caps(), [], "用户回合径（询问 ∕ 停）⇒ 零 cap 帧")
    out("⑪ #541 发射", "autoTurn ⇒ cap{mode:stop,turns:7} 恰一 · timerTurn ⇒ 0 · 用户回合 ⇒ 0")
  } finally {
    _resetSessionsDirForTest()
    _resetConfigPathForTest()
    rmSync(root, { recursive: true, force: true })
  }
})

// ─── ⑫ #541 cap 帧尾臂 ──────────────────────────────────────────────────────
test("⑫ #541 cap 帧尾臂：组在场 ∧ 含 [data-digest-cap] ∧ 行文 = digest.capStop 投影 ∧ 计数行在 ∧ 二帧零写", async () => {
  const { El } = installMiniDom()
  const { initDict, t } = await import(at("renderer/i18n.mjs"))
  const { projectDictionary } = await import(coreRel("i18n.mjs"))
  initDict({ locale: "en", dict: projectDictionary("en") })
  const { syncChrome } = await import(at("renderer/views/chat-chrome.mjs"))
  const root = new El("div")
  syncChrome(root, chromeModelOf(digestStart(5)), {})
  assert.ok(root.querySelector("[data-digest]"), "start 帧：组在场（前置）")
  const capSlice = { status: "cap", n: 5, tier: null, from: null, msg: null, cap: { mode: "stop", turns: 3 } }
  syncChrome(root, chromeModelOf(capSlice), {})
  const group = root.querySelector("[data-digest]")
  assert.ok(group, "cap 帧：组在场")
  const capRow = group.querySelector("[data-digest-cap]")
  assert.ok(capRow, "含 [data-digest-cap]")
  assert.equal(capRow.textContent, t("digest.capStop", { turns: 3 }), "行文 = digest.capStop 投影（携 turns）")
  assert.equal(typeof projectDictionary("en")["digest.capStop"], "string", "词键在核字典（零新键前提 —— 非缺键回退）")
  assert.notEqual(capRow.textContent, "digest.capStop", "词面已投影（非键名回退）")
  assert.equal(capRow.getAttribute("class"), "digest-cap digest-cap-stop", "stop 档 class")
  assert.ok(group.querySelector("[data-digest-count]"), "计数行在")
  syncChrome(root, chromeModelOf(capSlice), {})
  assert.equal(root.querySelector("[data-digest]"), group, "同态二帧 ⇒ 零写（节点身份不变）")
  out("⑫ #541 cap 帧尾", "组在场 · cap 行文 = digest.capStop(3) · 计数行在 · 二帧零写 ✓")
})

// ─── ⑬ #541 end 帧尾臂 ∕ 对照 ∕ 自愈 ∕ 换代 ──────────────────────────────────
test("⑬ #541 end 帧尾臂：携 cap ⇒ 组驻留 ∧ 计数行 = digest.done(n=5) ∧ cap 行在；对照臂 ∕ 自愈臂 ∕ 换代臂", async () => {
  const { El } = installMiniDom()
  const { initDict, t } = await import(at("renderer/i18n.mjs"))
  const { projectDictionary } = await import(coreRel("i18n.mjs"))
  initDict({ locale: "en", dict: projectDictionary("en") })
  const { syncChrome } = await import(at("renderer/views/chat-chrome.mjs"))
  const capSlice = { status: "cap", n: 5, tier: null, from: null, msg: null, cap: { mode: "stop", turns: 3 } }
  const endCap = { status: "end", n: 5, tier: null, from: null, msg: null, cap: { mode: "stop", turns: 3 }, ok: true, ms: 1200 }
  const root = new El("div")
  syncChrome(root, chromeModelOf(digestStart(5)), {})
  syncChrome(root, chromeModelOf(capSlice), {})
  syncChrome(root, chromeModelOf(endCap), {})
  const group = root.querySelector("[data-digest]")
  assert.ok(group, "携 cap 的 end ⇒ 组仍在场（驻留）")
  const countRow = group.querySelector("[data-digest-count]")
  assert.ok(countRow, "计数行在位")
  assert.equal(countRow.textContent, t("digest.done", { n: 5, seconds: "1.2" }), "计数行已更新为 digest.done（n=5）")
  assert.ok(group.querySelector("[data-digest-cap]"), "cap 行在")
  const other = new El("div")
  syncChrome(other, chromeModelOf(digestStart(5)), {})
  syncChrome(other, chromeModelOf({ status: "end", n: 5, tier: null, from: null, msg: null, ok: true, ms: 100 }), {})
  assert.equal(other.querySelector("[data-digest]"), null, "对照臂：不携 cap 的 end ⇒ 更新后摘除")
  const fresh = new El("div")
  syncChrome(fresh, chromeModelOf(endCap), {})
  const healed = fresh.querySelector("[data-digest]")
  assert.ok(healed && healed.querySelector("[data-digest-cap]"), "自愈臂：缺席 ∧ 携 cap ⇒ 按终态构树（含 cap 行）")
  assert.equal(healed.querySelector("[data-digest-count]").textContent, t("digest.done", { n: 5, seconds: "1.2" }), "自愈臂：计数行即终态句")
  syncChrome(root, chromeModelOf(digestStart(2)), {})
  const next = root.querySelector("[data-digest]")
  assert.ok(next && next.querySelector("[data-digest-cap]") === null, "换代臂：下一轮 start ⇒ cap 行清")
  out("⑬ #541 end 帧尾", "驻留 ∧ digest.done(n=5) ∧ cap 行在 ✓ · 对照臂摘除 ✓ · 自愈构树 ✓ · 换代清 ✓")
})

// ─── ⑭ #541 样式臂 ──────────────────────────────────────────────────────────
test("⑭ #541 样式臂：chat.css 两规则在盘（值面对位）", () => {
  const css = read("renderer/chat.css")
  assert.match(css, /\.chat-digest \.digest-cap \{[^}]*color: var\(--fg-muted\);[^}]*\}/, "基规则：`.chat-digest .digest-cap`（--fg-muted）")
  assert.match(css, /\.digest-cap\.digest-cap-stop \{[^}]*color: var\(--warn\);[^}]*\}/, "stop 档规则：`.digest-cap.digest-cap-stop`（--warn）")
  const theme = read("renderer/theme.css")
  assert.ok(theme.includes("--fg-muted:") && theme.includes("--warn:"), "角色对位两值在册（theme.css）")
  out("⑭ #541 样式", "两规则在盘（--fg-muted ∕ --warn）✓")
})

// ─── ⑮ #613 双提交竞态臂 + 单提交反例 ────────────────────────────────────────
test("⑮ #613 双提交竞态臂：滞后失败回执不得错摘后提交块；单提交反例：失败 ⇒ 退流", async () => {
  const { createComposerWire } = await import(at("renderer/composer-wire.mjs"))
  const KEY = "1"
  const makeWire = () => {
    let state = { activeSession: KEY, blocks: [], attachDegraded: {}, tabBadges: {}, susp: {} }
    const calls = []
    const wire = createComposerWire({
      store: { get: () => state, set: (patch) => { state = { ...state, ...patch }; return state } },
      activeKey: () => state.activeSession,
      call: (ch, payload) => new Promise((resolve) => calls.push({ ch, payload, resolve })),
      push: () => {}, panelOf: () => ({ setLoading: () => {} }), repaint: () => {}, onLoadingReset: () => {},
      toImages: (l) => l, degradedCode: () => null, effortOf: () => "auto",
      withUserBlock: (s, k, block) => (s?.activeSession !== k ? s : { ...s, blocks: [...(s.blocks ?? []), block] }),
      setAttachDegraded: (s) => s, applyFlags: (s) => s, openSettings: () => {},
    })
    return { wire, calls, state: () => state, set: (patch) => { state = { ...state, ...patch } } }
  }
  // 竞态主臂（回声先行真实序：每提交前置 noteEcho）
  const a = makeWire()
  const blockA = { kind: "user", text: "A" }
  const blockB = { kind: "user", text: "B" }
  a.set({ blocks: [blockA] })
  a.wire.noteEcho(KEY, blockA) // A 回声先行（未认领）
  a.wire.post("userMessage", { text: "A" }) // A 上行（悬挂 —— calls[0]）
  await drain()
  a.set({ blocks: [blockA, blockB] })
  a.wire.noteEcho(KEY, blockB) // B 回声先行（覆盖为未认领 —— 回声先于上行）
  a.wire.post("userMessage", { text: "B" }) // B 上行（悬挂 —— calls[1]）
  await drain()
  assert.equal(a.calls.length, 2, "双提交各自悬挂在位")
  a.calls[0].resolve({ ok: false, reason: "late-a-failure" }) // A 的迟到失败回执
  await drain()
  assert.ok(a.state().blocks.includes(blockB), "B 块仍在序（守卫零动作 —— 现盘代码 ⇒ 错摘红）")
  a.calls[1].resolve({ ok: false, reason: "b-failure" }) // B 自身失败回执
  await drain()
  assert.ok(!a.state().blocks.includes(blockB), "B 自身失败 ⇒ 退流（单提交口径）")
  // 单提交反例（现行为保持）
  const b = makeWire()
  const blockC = { kind: "user", text: "C" }
  b.set({ blocks: [blockC] })
  b.wire.noteEcho(KEY, blockC)
  b.wire.post("userMessage", { text: "C" })
  await drain()
  b.calls[0].resolve({ ok: false, reason: "c-failure" })
  await drain()
  assert.deepEqual(b.state().blocks, [], "单提交失败 ⇒ 块退流（现行为保持）")
  out("⑮ #613", "双提交：A 失败 ⇒ B 块仍序 ✓；B 失败 ⇒ 退流 ✓；单提交失败 ⇒ 退流 ✓")
})

// ─── ⑯ #599 relay 保形臂 ────────────────────────────────────────────────────
test("⑯ #599 relay 保形臂：含 ⟦ev⟧ 字面的内层内容 chunk ⇒ ev:subchunk；事件面消费 ∕ patch 保持；VSC 同判", async () => {
  const { createBridge } = await import(at("src/main/agent-bridge.mjs"))
  const events = []
  const bridge = createBridge({ post: (ch, payload) => events.push({ ch, payload }) })
  const b1 = bridge("1")
  const TOKEN = "eng-coder#2/text with ⟦ev⟧ inside"
  b1.onToken(TOKEN)
  assert.deepEqual(events, [{ ch: "ev:subchunk", payload: { key: "1", role: "eng-coder", id: 2, kind: "text", text: "text with ⟦ev⟧ inside", face: "text" } }], "内容 chunk 含事件字面 ⇒ ev:subchunk（现盘 ⇒ 零输出红）")
  events.length = 0
  b1.onToken("eng-coder#2/⟦ev⟧async")
  assert.deepEqual(events, [], "⟦ev⟧async ⇒ 本面消费零载荷（现行为保持）")
  events.length = 0
  b1.onToken("eng-coder#2/[model]m-1")
  assert.deepEqual(events.map((e) => [e.ch, e.payload?.status]), [["ev:subagent", "started"]], "[model] ⇒ ev:subagent started（现行为保持）")
  events.length = 0
  b1.onToken("eng-coder#2/plain text")
  assert.deepEqual(events.map((e) => e.ch), ["ev:subchunk"], "普通前缀内容 ⇒ ev:subchunk（控制臂）")
  const { relaySubagentEventToken } = await import(vscRel("src/extension/panel-subagent-relay.mjs"))
  assert.equal(relaySubagentEventToken({}, TOKEN), false, "VSC 端同向量同判：非事件面（转内容面）")
  out("⑯ #599", "内容 chunk ⇒ ev:subchunk ✓ · ⟦ev⟧async 消费 ✓ · [model] patch ✓ · VSC 同判 false ✓")
})

// ═══ 补遗实施轮（#543 · 裁定 A）：待答期携文入队 ═══════════════════════════════════════════

// ─── ⑰ #543 待答期携文入队臂 ──────────────────────────────────────────────
test("⑰ #543 待答期携文入队臂：撞帽询问悬挂 + interrupt(key,\"msg\") ⇒ 入队（快照含该条）+ 回合判 stopped + 消费 = 下一回合边界（原文逐字）；反例 = 裸停 ⇒ 零入队 ∕ 零消费", async () => {
  const { _resetSessionsDirForTest, _setSessionsDirForTest } = await import(coreRel("session-slots.mjs"))
  const { _resetConfigPathForTest, _setConfigPathForTest } = await import(coreRel("config.mjs"))
  const { ContinueError } = await import(coreRel("agent.mjs"))
  const { createTurnDriver } = await import(at("src/main/turn-driver.mjs"))
  const root = mkdtempSync(join(tmpdir(), "tc-r3-f543-"))
  const KEY = "1"
  try {
    mkdirSync(join(root, "sessions"), { recursive: true })
    const cwd = join(root, "project")
    mkdirSync(cwd, { recursive: true })
    _setSessionsDirForTest(join(root, "sessions"))
    _setConfigPathForTest(join(root, "config.json"))
    /** 代理最小形（同 ⑪ 夹具 + `_slot`）—— 标题在场 ⇒ 标题自守卫短路；落盘自吞错；零网络。 */
    const makeAgent = () => ({
      cwd, _slot: 1,
      provider: { name: "fake", apiKey: "test-key", baseURL: "http://127.0.0.1:1/v1", model: "gpt-4o" },
      history: [], _fullHistory: [], title: "夹具标题", tasks: [],
      planMode: false, autoApprove: false, goal: null, _pendingReminders: [], _sessionStart: null,
      _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [],
      _engDesignTokens: new Map(), config: {},
    })
    /** 驱动夹具：run#1 撞帽（用户回合径 ⇒ 询问悬挂）；询问按取消结算 = 真 `denyGates` 形（`suspensions.mjs` ⇒ 取消串）；
     *  run#2（消费回合）悬挂 —— 观察点由本用例手动放行。 */
    const mk = () => {
      const events = [], runs = [], gates = { hang: null, g2: null }
      const driver = createTurnDriver({
        post: (ch, payload) => events.push({ ch, payload }),
        run: async (agent, text, _b, opts) => {
          runs.push({ text, resume: opts?.resume === true })
          if (runs.length === 1) throw new ContinueError(7)
          return new Promise((res) => { gates.g2 = res })
        },
        bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => cwd },
        ensure: async () => makeAgent(),
        forgetKey: () => {}, dropScope: () => {},
        askQuestion: (key, question, options) => new Promise((resolve) => { gates.hang = resolve }),
        denyGates: () => { if (gates.hang !== null) gates.hang("(user cancelled)") },
      })
      return { driver, events, runs, gates }
    }
    const until = async (cond, tries = 800) => { for (let i = 0; i < tries && !cond(); i += 1) await tick(1) }
    const isStopped = (e) => e.ch === "ev:activity" && e.payload?.key === KEY && e.payload?.event === "stopped"
    // ── 主臂：待答期携文 ⇒ 入队（快照含该条）+ 回合判 stopped + 消费径（下一回合边界取走，原文逐字）
    const a = mk()
    assert.deepEqual(await a.driver.send(KEY, "甲", null), { ok: true }, "起跑受理")
    await until(() => a.gates.hang !== null)
    assert.equal(a.gates.hang !== null, true, "前置：撞帽询问已悬挂（待答期）")
    // 入队瞬间观测（微任务级轮询 —— 与 `ev:queue` 快照帧互证）
    const seenSnapshots = []
    const poll = (async () => { for (let i = 0; i < 400; i += 1) { seenSnapshots.push(a.driver.queueSnapshot(KEY)); await Promise.resolve() } })()
    assert.deepEqual(a.driver.interrupt(KEY, "msg"), { ok: true }, "待答期携文中断受理")
    await poll
    assert.equal(seenSnapshots.some((s) => s.includes("msg")), true, "队快照含该条（入队瞬间可观测）")
    await until(() => a.events.some(isStopped))
    assert.equal(a.events.some(isStopped), true, "回合判 stopped（ev:activity 帧可判）")
    await until(() => a.runs.length === 2)
    assert.deepEqual(a.runs, [{ text: "甲", resume: false }, { text: "msg", resume: false }], "零丢失：消费 = 下一回合边界取走原文（新回合，非续跑）")
    const queueFrames = a.events.filter((e) => e.ch === "ev:queue" && e.payload?.key === KEY)
    assert.equal(queueFrames.length, 2, "恰两帧：入队快照帧 + 消费回执帧")
    assert.deepEqual(queueFrames[0].payload.items, ["msg"], "入队帧快照含该条（A9 串数组形）")
    assert.equal("delivered" in queueFrames[0].payload, false, "入队帧非消费回执形")
    const delivered = queueFrames.find((e) => e.payload?.delivered?.text === "msg")
    assert.ok(delivered !== undefined, "消费回执帧携文逐字")
    assert.deepEqual(delivered.payload.items, [], "消费帧：带项同帧退场")
    assert.equal(typeof delivered.payload.delivered.ts, "number", "回执 ts = 入队现刻（真值）")
    const idx = (pred) => a.events.findIndex(pred)
    const iq = idx((e) => e.ch === "ev:queue" && e.payload?.key === KEY)
    const ist = idx((e) => isStopped(e))
    const idl = idx((e) => e.ch === "ev:queue" && e.payload?.delivered?.text === "msg")
    assert.equal(iq < ist && ist < idl, true, "帧序：入队 ⇒ stopped（回合判）⇒ 消费回执")
    a.gates.g2("done")
    await drain()
    assert.deepEqual(a.driver.queueSnapshot(KEY), [], "消费毕：队空（带项退场）")
    a.driver.dispose(KEY)
    // ── 反例臂：裸停（无消息）⇒ 零入队 ∕ 零消费（裸停语义保持）
    const b = mk()
    assert.deepEqual(await b.driver.send(KEY, "乙", null), { ok: true }, "起跑受理（反例）")
    await until(() => b.gates.hang !== null)
    assert.deepEqual(b.driver.interrupt(KEY), { ok: true }, "裸停受理（无消息）")
    await until(() => b.events.some(isStopped))
    await drain()
    assert.equal(b.events.filter((e) => e.ch === "ev:queue").length, 0, "零入队（ev:queue 零帧）")
    assert.deepEqual(b.driver.queueSnapshot(KEY), [], "零入队（快照归空）")
    assert.deepEqual(b.runs, [{ text: "乙", resume: false }], "零消费（裸停语义保持）")
    b.driver.dispose(KEY)
    // ── 缺省臂：缝缺省（直驱 createTurnFace 不传 onCapCancelled）⇒ 零动作 ∕ 零异常（stopped 照常）——评后随评加臂
    const { createTurnFace } = await import(at("src/main/turn-face.mjs"))
    const flights3 = new Map()
    const events3 = []
    let hang3 = null
    const face = createTurnFace({
      post: (ch, payload) => events3.push({ ch, payload }),
      bridge: () => ({}), postUsage: () => {}, flights: flights3,
      run: async () => { throw new ContinueError(7) },
      askContinue: () => new Promise((resolve) => { hang3 = resolve }),
      // onCapCancelled 缺省（不传）——设计「缺省 ⇒ 零动作」面
    })
    const p3 = face.executeTurn(KEY, makeAgent(), "丙", {})
    await until(() => hang3 !== null)
    assert.equal(hang3 !== null, true, "缺省臂前置：询问悬挂")
    flights3.get(KEY).abort({ interrupt: true, message: "x" }) // 携文中断面（等价 `interrupt` 的 abort 载）
    hang3("(user cancelled)")
    await p3
    assert.deepEqual(events3.filter((e) => e.ch === "ev:activity").map((e) => e.payload?.event), ["stopped"], "缺省缝 ⇒ stopped 照常（零异常 ∕ 零入队面）")
    assert.deepEqual(events3.filter((e) => e.ch === "ev:error"), [], "缺省缝 ⇒ 零错误帧")
    out("⑰ #543", "携文 ⇒ 入队（快照含 msg）+ stopped + 消费取走 ✓；裸停 ⇒ 零入队 ∕ 零消费 ✓；缝缺省 ⇒ 零动作 ✓")
  } finally {
    _resetSessionsDirForTest()
    _resetConfigPathForTest()
    rmSync(root, { recursive: true, force: true })
  }
})
