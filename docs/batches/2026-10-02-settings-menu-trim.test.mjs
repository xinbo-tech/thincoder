/**
 * 2026-10-02-settings-menu-trim.test.mjs — 批内件（设置菜单组项收窄批 · 台账 #820 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-02-settings-menu-trim.md` §2.5（机检三腿：六项集 ∥ 跨面闭集一致性 ∥ 弹窗仍达六组）+ §2.1；
 * 决策单源 = `docs/desktop/design/MENU.md` §1 **KD-67** ①–③ ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68** ④；
 * 通道契约 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行。
 *
 * 面（只测本批改动面 —— 平 node；纯函数腿直测，装配面以桩 `document` 直测决策 ∥ 调度面）：
 *   腿 ① 六项集：条目序 = 设置… ∥ sep ∥ 六组项（序 = `SECTIONS` 去「模型与档位」）∥ sep ∥ 维护▸ 两项
 *          ∥ 关于与快捷键▸ 两项；六项 emit = `("openSettings", undefined, 组名)` 闭集；「模型与档位」零在场（label ∥ emit 双检）；
 *   腿 ② 跨面闭集一致性：`SETTINGS_GROUPS`（主）≡ `SECTIONS` 名序去「模型与档位」（渲染）源扫 ∥ 读取面键序同值
 *          ∥ 设置页七段零动 pin（`SECTIONS` 仍七段含 `model`）；
 *   腿 ③ 弹窗仍达六组：六组逐开 ⇒ 切片写 + 读取链（沿 #817 腿⑤形）∥ 校验七名宽容 pin（`model` 受理——支 A；
 *          表外 ⇒ 拒 + 记错）。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd —— 路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-02-settings-menu-trim.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href

const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const { HOST_DICT, FALLBACK_LOCALE } = i18n
const { SETTINGS_GROUPS, menuTemplate } = await import(at("thincoder-desktop/src/main/app-menu.mjs"))
const { menuLabels, settingsSectionLabels } = await import(at("thincoder-desktop/src/main/menu-words.mjs"))
const { contextMenuLabels } = await import(at("thincoder-desktop/src/main/context-menu.mjs"))
const { SECTIONS, settingsModalTree } = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
const { initialState, createStore } = await import(at("thincoder-desktop/renderer/store.mjs"))
const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))

/** 六组名闭集（预期 —— 序 = `SECTIONS` 名序去「模型与档位」；防被读成「任意六项」）。 */
const EXPECT_GROUPS = ["providers", "agent", "mcp", "env", "tools", "models"]

/** 建模板（真词表 + 真段名读数 + 两缝捕获）。 */
function buildMenu({ locale = "zh", recent = [], theme = null } = {}) {
  const actions = []
  const natives = []
  const template = menuTemplate({
    words: menuLabels(locale), edit: contextMenuLabels(locale), recent, theme,
    sections: settingsSectionLabels(locale),
    onAction: (...args) => actions.push(args),
    onNative: (...args) => natives.push(args),
  })
  return { template, actions, natives }
}

// ─── 腿 ① · 六项集（条目序 ∥ 六项 emit 闭集 ∥ 「模型与档位」零在场）────────────────────────────

test("腿① 六项集：条目序 ∥ 六项 emit 闭集 ∥ 「模型与档位」零在场（label ∥ emit 双检）", () => {
  const { template, actions, natives } = buildMenu()
  assert.equal(template.length, 5, "恰五组")
  assert.deepEqual(template.map((g) => g.label), ["文件", "编辑", "视图", "设置", "帮助"])

  const group = template[3].submenu
  assert.deepEqual(group.map((i) => i.label ?? i.type),
    ["设置…", "separator", "渠道…", "agent 参数…", "MCP…", "运行环境…", "工具与服务…", "会诊与审查…", "separator", "维护", "关于与快捷键"],
    "条目序 = 设置… ∥ sep ∥ 六组项 ∥ sep ∥ 维护▸ ∥ 关于与快捷键▸")

  // 六组项 emit = ("openSettings", undefined, 组名) —— 闭集恰六名（序 = EXPECT_GROUPS）
  const items = group.slice(2, 8)
  assert.equal(items.length, 6, "恰六组项")
  for (const item of items) item.click()
  assert.deepEqual(actions, EXPECT_GROUPS.map((name) => ["openSettings", undefined, name]), "六组项 emit 闭集 + path 恰位")
  group[0].click()
  assert.deepEqual(actions.at(-1), ["openSettings"], "设置…（缺 value ⇒ 页径）")

  // 「模型与档位」零在场（label ∥ emit 双检 —— 两语 label）
  for (const locale of ["zh", "en"]) {
    const built = buildMenu({ locale })
    const labels = built.template[3].submenu.map((i) => i.label ?? i.type)
    const modelWord = HOST_DICT[locale]["settings.section.model"]
    assert.equal(labels.includes(`${modelWord}…`), false, `${locale} 组项 label 零「模型与档位」项`)
  }
  assert.equal(actions.some((entry) => entry[2] === "model"), false, "emit 零第七名（`model`）")

  // 两子组 = 行为零改（gc ∥ index / help / about）∥ 帮助组零动（同二项第二入口）
  const maintenance = group[9]
  assert.deepEqual(maintenance.submenu.map((i) => i.label), ["清理会话数据…", "重建会话索引"])
  maintenance.submenu[0].click()
  maintenance.submenu[1].click()
  const aboutShortcuts = group[10]
  assert.deepEqual(aboutShortcuts.submenu.map((i) => i.label), ["命令与快捷键…", "关于 ThinCoder…"])
  aboutShortcuts.submenu[0].click()
  aboutShortcuts.submenu[1].click()
  assert.deepEqual(natives, [["gc"], ["index"], ["about"]], "宿主自办三缝零改")
  assert.deepEqual(actions.at(-1), ["help"], "命令与快捷键 ⇒ emit(help) 零改")
  assert.deepEqual(template[4].submenu.map((i) => i.label), ["命令与快捷键…", "关于 ThinCoder…"], "帮助组零动")
})

// ─── 腿 ② · 跨面闭集一致性（镜像 ≡ 视图名序去「模型与档位」∥ 读取面键序同值 ∥ 七段零动 pin）──────

test("腿② 跨面闭集一致性：SETTINGS_GROUPS ≡ SECTIONS 去「模型与档位」（源扫）∥ 读取面键序同值", () => {
  // 设置页七段零动 pin（渲染面 `SECTIONS` 不收 —— 「模型与档位」段仍在设置页）
  const names = SECTIONS.map((s) => s.name)
  assert.equal(names.length, 7, "`SECTIONS` = 七段（设置页面七段零动）")
  assert.ok(names.includes("model"), "「模型与档位」段仍在设置页")

  // 跨面闭集：主侧镜像 ≡ 视图单源名序去「模型与档位」（六名，序固定）
  assert.deepEqual([...SETTINGS_GROUPS], names.filter((name) => name !== "model"), "SETTINGS_GROUPS ≡ SECTIONS 名序去「模型与档位」")
  assert.deepEqual([...SETTINGS_GROUPS], EXPECT_GROUPS, "六名闭集（序 = 渠道 → agent → MCP → 运行环境 → 工具与服务 → 会诊与审查）")
  assert.equal(SETTINGS_GROUPS.includes("model"), false, "镜像零 `model`")

  // 读取面键序同值（两语）+ 投影同源 + 零第七键
  for (const locale of ["zh", "en"]) {
    const labels = settingsSectionLabels(locale)
    assert.deepEqual(Object.keys(labels), [...SETTINGS_GROUPS], `${locale} 读取面键序 = 六名闭集`)
    const dict = HOST_DICT[locale] ?? HOST_DICT[FALLBACK_LOCALE]
    for (const name of SETTINGS_GROUPS) {
      assert.equal(labels[name], dict[`settings.section.${name}`], `${locale} ${name} 投影同源（HOST_DICT）`)
      assert.notEqual(labels[name], "", `${locale} ${name} 值非空`)
    }
    assert.equal(Object.hasOwn(labels, "model"), false, `${locale} 读取面零 model 键`)
  }

  // 源扫（跨面闭集 —— 文本面同判据）：主侧两枚举字面 ≡ 六名
  const appMatch = read("thincoder-desktop/src/main/app-menu.mjs").match(/export const SETTINGS_GROUPS = Object\.freeze\(\[([^\]]*)\]\)/)
  assert.ok(appMatch !== null, "源扫锚在场：`SETTINGS_GROUPS` 字面")
  assert.deepEqual(JSON.parse(`[${appMatch[1]}]`), EXPECT_GROUPS, "源扫：`SETTINGS_GROUPS` 字面 ≡ 六名闭集")
  const wordsMatch = read("thincoder-desktop/src/main/menu-words.mjs").match(/const SETTINGS_SECTION_KEYS = Object\.freeze\(\[([^\]]*)\]\)/)
  assert.ok(wordsMatch !== null, "源扫锚在场：`SETTINGS_SECTION_KEYS` 字面")
  assert.deepEqual(JSON.parse(`[${wordsMatch[1]}]`), EXPECT_GROUPS, "源扫：`SETTINGS_SECTION_KEYS` 字面 ≡ 六名闭集")
})

// ─── 腿 ③ · 弹窗仍达六组（六组逐开 ⇒ 切片写 + 读取链 ∥ 七名宽容 pin）──────────────────────────

test("腿③ 弹窗仍达六组：六组逐开 ⇒ 切片写 + 读取链 ∥ 校验七名宽容 pin（`model` 受理；表外 ⇒ 拒 + 记错）", async () => {
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => null, addEventListener: () => {} } // 桩 document（本腿只测决策 ∥ 调度面）
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    const store = createStore(initialState())
    const calls = []
    const receipts = {
      "provider:list": { ok: true, active: null, presets: [], providers: [] },
      "settings:agent": { ok: true, fields: [], models: null },
      "mcp:list": { ok: true, servers: [] },
      "settings:env": { ok: true, proxy: {}, shell: {} },
      "settings:tools": { ok: true },
      "index:status": { ok: true, status: null },
    }
    const host = { invoke: async (channel) => { calls.push(channel); return receipts[channel] ?? { ok: false, reason: "stub" } } }
    const face = attachSettings(host, { store })
    face.detach() // 防重绘（平 node 零 DOM 建面）
    const settle = () => new Promise((done) => setTimeout(done, 0))

    // 菜单可达六组：逐开 ⇒ 切片写 + 读取链（单源 = MODAL_READS 表）+ 树面仍达
    const READ_CHANNEL = {
      providers: ["provider:list"], agent: ["settings:agent"], mcp: ["mcp:list"],
      env: ["settings:env"], tools: ["settings:tools", "index:status"], models: ["settings:agent"],
    }
    for (const name of EXPECT_GROUPS) {
      calls.length = 0
      assert.equal(face.openSettingsModal(name), true, `开：${name}`)
      assert.equal(store.get().settings.modal, name, `切片写：${name}`)
      await settle()
      assert.deepEqual(calls, READ_CHANNEL[name], `读取链：${name}`)
      assert.ok(settingsModalTree(store.get(), name, {}) !== null, `弹窗树仍达：${name}`)
    }

    // 校验七名宽容 pin（支 A）：`model` 受理（菜单不发第七名——零改 `SCOPES`）
    calls.length = 0
    assert.equal(face.openSettingsModal("model"), true, "`model` 受理（七名宽容）")
    assert.equal(store.get().settings.modal, "model", "切片写：model")
    await settle()
    assert.deepEqual(calls, ["provider:list"], "读取链：model = 渠道面（含模型候选随动）")
    assert.ok(settingsModalTree(store.get(), "model", {}) !== null, "`model` 弹窗树在（设置页对齐面）")

    // 关 ⇒ 切片清
    face.closeSettingsModal()
    assert.equal(store.get().settings.modal, null, "关 ⇒ 切片清")

    // 表外 ⇒ 拒 + 记错 + 零动（防御档零改）
    const before = errors.length
    assert.equal(face.openSettingsModal("bogus"), false)
    assert.equal(store.get().settings.modal, null, "拒 ⇒ 切片零动")
    assert.equal(errors.length, before + 1, "拒 ⇒ 记错一行")
    assert.match(String(errors.at(-1)[0]), /unknown group/)
  } finally {
    console.error = original
    globalThis.document = prevDoc
  }
})
