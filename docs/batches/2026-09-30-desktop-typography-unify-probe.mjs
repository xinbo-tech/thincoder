/**
 * 2026-09-30-desktop-typography-unify-probe.mjs — 批内件（排版统一批 · D29 · 台账 #736 · **真机 computed 扫描腿**）。
 * 判据 = 批档 `docs/batches/2026-09-30-desktop-typography-unify.md` §2 §九「机检判据 · 真机 computed 扫描腿」①–⑦：
 *   ① 全文本元素 `font-size = 14px`（修饰白名单除外——h1–h6 ∥ code ∥ `.code-block code` ∥ table，期望值 = 基线 × em 因子；轻通道轮五 2026-10-01 · #808 定版 12 ⇒ 14 随算）;
 *   ② `font-weight ≤ 400`（`strong` ∥ h1–h6 ∥ `th` 除外）；③ 族首项 = `ui-monospace`；④ `line-height` = 号 × 1.3（基线 18.2px——轻通道轮四 ∥ 轮五 2026-10-01 随算；**例外 = `select` 本体**——Blink 把其 computed `line-height` 固定 `normal`（内联 ∥ 表则 ∥ `!important` 均不可达；同类 `input` ∥ `button` ∥ `option` 可控已归基线）；豁免证据随读数落盘 = `selectExemption` 段）；
 *   ⑤ `letter-spacing = normal`；⑥ 覆盖面在场性（模型菜单 ∥ 搜索条 ∥ 设置 ∥ 向导——同扫）；⑦ 读数落盘
 *   （`docs/batches/2026-09-30-desktop-typography-unify-readings.json`）。
 * 形状：真 Electron（playwright-core `_electron`）· 两启程（有 config ⇒ 设置面；零 config ⇒ 向导面）· 随批留存 · 不进仓套件。
 * 跑法（仓根 `thincoder/`）：node docs/batches/2026-09-30-desktop-typography-unify-probe.mjs
 */
import { createRequire } from "node:module"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const REPO = resolve(process.cwd())
if (!REPO.endsWith("thincoder")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${REPO}）`)
const APP_DIR = join(REPO, "thincoder-desktop")
const OUT = join(REPO, "docs/batches/2026-09-30-desktop-typography-unify-readings.json")
const require = createRequire(join(APP_DIR, "package.json"))
const { _electron } = require("playwright-core")

/** fixture 家（沿 `docs/desktop/design/E2E-TESTING.md` §3.1/§3.2 契约；`config:false` ⇒ 零配置 ⇒ 向导面）。 */
function fixture({ config = true } = {}) {
  const base = mkdtempSync(join(tmpdir(), "typo-probe-"))
  const home = join(base, "home")
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  if (config) writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({ locale: "en" }))
  const proj = join(base, "proj")
  mkdirSync(proj, { recursive: true })
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE // 继承该键 ⇒ electron 退化为纯 node（E2E §3.1 实测坑）
  env.HOME = home
  env.USERPROFILE = home
  env.APPDATA = home
  env.XDG_CONFIG_HOME = home
  return { base, home, proj, env }
}

async function launch(fx) {
  const app = await _electron.launch({ args: [".", `--user-data-dir=${join(fx.home, "ud")}`], cwd: APP_DIR, env: fx.env, colorScheme: "light" })
  const page = await app.firstWindow()
  await page.waitForFunction(() => ["ok", "error"].includes(document.documentElement.dataset.boot), null, { timeout: 30000 })
  return { app, page }
}

/** 扫描器注入（页面面）：候选 = 直接携文本的元素 ∪ 文本控件；判据按批档 §2 白名单表。 */
const INSTALL_SCAN = () => {
  const MOD = [
    // 值面 = 基线 × em 因子（core-markdown.css ∥ core.css）；轻通道轮四 ∥ 轮五 2026-10-01（#759 ∥ #808）基线 14 ⇒ 12 ⇒ 14（定版）⇒ 整表随算。
    [".reasoning-content .code-block code", 12.88],
    [".block-text .code-block code", 12.32],
    [".reasoning-content code", 12.88],
    [".block-text code", 12.6],
    [".block-text h1, .reasoning-content h1", 18.2],
    [".block-text h2, .reasoning-content h2", 16.1],
    [".block-text h3, .reasoning-content h3", 14.7],
    [".block-text h4, .reasoning-content h4", 14],
    [".block-text h5, .reasoning-content h5", 13.3],
    [".block-text h6, .reasoning-content h6", 12.6],
    [".block-text table, .reasoning-content table", 12.6],
  ]
  const WEIGHT_FREE = [
    ".block-text h1, .block-text h2, .block-text h3, .block-text h4, .block-text h5, .block-text h6",
    ".reasoning-content h1, .reasoning-content h2, .reasoning-content h3, .reasoning-content h4, .reasoning-content h5, .reasoning-content h6",
    ".block-text strong, .reasoning-content strong",
    ".block-text th, .reasoning-content th",
  ].join(", ")
  const desc = (el) => {
    const id = el.id ? `#${el.id}` : ""
    const cls = el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""
    const text = (el.textContent || "").trim().slice(0, 24)
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` “${text}”` : ""}`
  }
  window.__typoScan = (face) => {
    const out = { face, candidates: 0, violations: [], families: new Set(), seen: {} }
    const directText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== "")
    const isControl = (el) => /^(input|textarea|select|button)$/i.test(el.tagName)
      && !(el.tagName === "INPUT" && ["checkbox", "radio", "hidden", "file"].includes(el.type))
    // 期望字号 = **最近命中根**（含自身）的修饰值——修饰子树随根继承（如 `td` 随表 0.9em ∥ `tk-*` 随代码体 0.88em）。
    const expectedOf = (el) => {
      for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
        for (const [sel, px] of MOD) if (node.matches(sel)) return { px, from: sel }
      }
      return { px: 14, from: "base" }
    }
    const round2 = (n) => Math.round(n * 100) / 100
    for (const el of document.querySelectorAll("body *")) {
      if (!directText(el) && !isControl(el)) continue
      out.candidates += 1
      const cs = getComputedStyle(el)
      const { px: expected, from } = expectedOf(el)
      const push = (kind, got, exp) => out.violations.push({ kind, el: desc(el), got, expected: exp })
      const fs = Number.parseFloat(cs.fontSize)
      if (Math.abs(fs - expected) > 0.06) push("font-size", cs.fontSize, `${expected}px (${from})`)
      const weight = Number.parseInt(cs.fontWeight, 10)
      if (weight > 400 && !el.matches(WEIGHT_FREE)) push("font-weight", cs.fontWeight, "<=400")
      const family = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "")
      out.families.add(family)
      if (family !== "Cascadia Mono") push("font-family", cs.fontFamily, "Cascadia Mono…（轻通道轮三族首收正）")
      // 行高期望 = 号 × 1.3（`--lh` = 无单位 1.3〔轻通道轮四 2026-10-01 · #759 随盘收正〕，逐元素按自身字号取用值）；base 面 = 18.2px（轻通道轮五 · #808 定版随算）。
      // `select` 例外：Blink 把其 computed `line-height` 固定为 `normal`（实测：内联 ∥ 表则 ∥ `!important` 均不可达；
      // 同类 `input` ∥ `button` ∥ `option` 可控且已归基线）——控件本体行高不由页面 CSS 承载 ⇒ 该元素不入本条判据。
      const lh = Number.parseFloat(cs.lineHeight)
      const lhExempt = el.tagName === "SELECT"
      if (!lhExempt && (!Number.isFinite(lh) || Math.abs(lh - round2(expected * 1.3)) > 0.06)) push("line-height", cs.lineHeight, `${round2(expected * 1.3)}px`)
      if (cs.letterSpacing !== "normal") push("letter-spacing", cs.letterSpacing, "normal")
      out.seen[el.tagName.toLowerCase()] = (out.seen[el.tagName.toLowerCase()] || 0) + 1
    }
    out.families = [...out.families]
    return out
  }
}

/** 流内样本（覆盖 md 修饰五件：粗体 ∥ 标题 ∥ 代码块 ∥ 引用 ∥ 表格 + 行内码 ∥ 列表 ∥ 任务清单 ∥ 分隔线 ∥ 链接）。 */
const MD_SAMPLE = [
  "# 一级标题 H1",
  "## 二级标题 H2",
  "### 三级标题 H3",
  "#### 四级标题 H4",
  "##### 五级标题 H5",
  "###### 六级标题 H6",
  "",
  "正文段落含 **粗体**、*斜体*、~~删除线~~、`行内码`，以及 [链接](https://example.com)。",
  "",
  "> 引用行引用行",
  "",
  "- 列表项一",
  "- 列表项二",
  "",
  "1. 有序一",
  "2. 有序二",
  "",
  "- [ ] 任务一",
  "- [x] 任务二",
  "",
  "| 列 A | 列 B |",
  "|---|---|",
  "| a1 | b1 |",
  "",
  "```js",
  "const probe = 1 // 代码体",
  "```",
  "",
  "---",
  "",
  "收尾段落。",
].join("\n")

/** 合成面（离线不可达的核卡 ∥ 小修族件——按产品类名 ∥ 结构逐件造，验证 CSS 级联落值；扫描后移除）。info 行族（`data-slot="info"` ∥ `.info-*`）随扁平化随动收口（#713 ∥ #776）整体退场——夹具已剔（2026-10-01 轮五收口）。 */
const SYNTH_HTML = `
<div id="typo-synth" style="padding:12px">
  <div class="permission-prompt">
    <div class="permission-prompt-text">审批卡文本</div>
    <div class="permission-prompt-actions"><button class="deny">Deny 拒绝</button><button class="approve">Approve 批准</button><button class="one-by-one">逐项</button></div>
  </div>
  <div class="composer">
    <div id="paste-bar"><span class="paste-chip">📎 image 1<span class="paste-chip-del">✕</span></span></div>
    <div class="dropdown"><div class="dropdown-item">row<span class="check">✓</span><span class="dropdown-sub">sub</span><span class="submenu-arrow">›</span></div><div class="dropdown-manage">manage</div></div>
    <div id="at-dropdown"><div class="dropdown-item"><span class="at-file-name">a.md</span><span class="at-file-path">src/a.md</span></div></div>
  </div>
  <div id="paste-toast" class="paste-toast">toast</div>
  <div class="question-card">
    <div class="question-text"><span class="question-mark">?</span> 提问卡文本</div>
    <div class="question-options"><button class="perm-btn">选项甲</button></div>
    <div class="question-actions"><input class="question-input" value="作答" /></div>
  </div>
  <div class="plan-card">
    <div class="panel-desc">计划说明</div>
    <div class="task-item"><span class="task-mark">☐</span><span class="task-title">任务甲</span><span class="task-status">doing</span></div>
  </div>
  <div class="goal-card"><div class="goal-section"><div class="goal-label">goal-label</div><div class="goal-value">目标值</div><span class="goal-status-badge active">active</span></div></div>
  <details class="reasoning-block" open><summary class="reasoning-summary">推理摘要</summary><div class="reasoning-content"><p>推理正文 <code>x</code></p></div></details>
  <details class="advisor-block sub-block" open>
    <summary class="sub-hdr">子代理头行<span class="sub-hdr"> · turn 1/1</span></summary>
    <div class="advisor-content">子代理内容</div>
    <div class="sub-desc">说明行</div>
    <div class="sub-tail">tail-3 行</div>
    <button class="sub-stop-btn">⏹</button>
    <button class="sub-follow-btn">回到底部</button>
  </details>
  <div class="chat-digest"><div class="digest-turn">turn 行</div><div class="digest-status">status 行</div><div class="digest-cap">撞帽行</div></div>
  <div class="compress-status">压缩行</div>
  <div class="chat-ledger"><div class="ledger-line">台账行</div><div class="ledger-line warn">台账警示行</div></div>
  <div class="chat-stopped">停止痕</div>
  <div class="block-error"><div class="error-text">错误横幅文本</div><details class="error-details"><summary>详情</summary><pre>错误详情 pre</pre></details><button class="error-retry-btn">重试</button></div>
  <div class="diff-preview"><div class="diff-header">diff 头</div><div class="diff-line diff-add">+ add</div><div class="diff-line diff-del">- del</div></div>
  <div class="tool-result">工具结果 <span class="file-link" data-path="a.md">a.md</span></div>
  <div class="tool-changes"><div class="tool-file"><span>f.md</span><span data-add>1</span><span data-del>0</span></div></div>
  <div class="chat-pending"><div class="chat-pending-label">待发送</div><div class="chat-pending-item"><div class="chat-pending-body">排队内容</div></div><div class="chat-pending-more">还有</div></div>
  <div class="chat-summary">摘要块 <button class="chat-backfill">回填</button></div>
  <button class="chat-pill">回到底部</button>
  <div class="chat-welcome"><div class="welcome-heading">欢迎抬头</div><div class="welcome-text">欢迎文案</div><div class="welcome-shortcuts">快捷键</div></div>
  <div class="block-text"><div class="code-block"><span class="code-lang">js</span><pre><code>x = 1</code></pre><button class="code-copy-btn">⧉</button></div></div>
  <div class="session-bar">
    <button class="session-project">proj</button>
    <div class="session-selector"><span class="session-title">会话标题</span><span class="session-arrow"></span></div>
    <button class="session-new"></button>
  </div>
  <div class="session-dropdown" data-open="1">
    <div class="session-ledger-notice">账本注记</div>
    <div class="session-item"><span class="session-item-title">会话条目</span><span class="session-item-meta"><span data-seg="provider">p1</span><span data-seg="msgs">3 msgs</span></span><span class="session-item-badge">运行中</span><button class="session-rename"></button><button class="session-delete"></button></div>
    <div class="session-item"><input class="session-rename-input" value="改名" /><button class="session-cancel">取消</button><button class="session-confirm">确认</button></div>
    <div class="session-empty">会话空态</div>
  </div>
  <div class="status-bar"><span data-seg="state">Ready</span><span data-seg="tasks">✓0/2</span><span class="status-alert">告警</span><span class="status-goal">目标</span></div>
  <div class="pool-head"><span class="pool-title">活动池</span><span class="pool-read">2 项</span><button class="pool-toggle" aria-expanded="false"></button><button class="activity-new-btn">新块 3</button></div>
  <div class="pool-family"><div class="pool-family-label">family</div></div>
  <div class="pool-item" data-status="running"><div class="pool-item-label">池条目</div></div>
  <div class="approval-actions"><button class="approval-action">once</button><button class="approval-action">always</button><button class="approval-action">reject</button></div>
  <div class="settings-head"><h2 class="settings-title">Settings</h2><button class="settings-close"></button></div>
  <div class="settings-section"><h3 class="settings-section-title">Providers</h3>
    <div class="settings-row"><span class="settings-row-name">行名</span><span class="settings-row-value">值</span><span class="settings-key">键</span><button class="settings-row-action">Verify</button></div>
    <div class="settings-form"><div class="settings-field-row"><span class="settings-field-label">标</span><input class="settings-field" value="x" /></div><textarea class="settings-field">textarea</textarea></div>
    <div class="settings-section-state">段态</div><span class="settings-mark">mark</span><span class="settings-readonly-hint">只读提示</span>
  </div>
  <div class="settings-notice">失败面 <span class="settings-notice-scope">scope</span></div>
  <ol class="wizard-steps"><li class="wizard-step" data-current="">步骤</li></ol>
  <div class="wizard-body"><div class="wizard-hint">提示</div><h2 class="wizard-title">Initial setup</h2><div class="wizard-notice">失败面</div></div>
  <div class="wizard-foot"><button class="wizard-dismiss"></button><button class="wizard-next">Next</button><button class="wizard-finish">Finish</button><button class="wizard-submit">Submit</button></div>
  <div class="chat-empty">空态提示</div>
</div>`

const results = { probe: "2026-09-30-desktop-typography-unify-probe", at: new Date().toISOString(), phases: {} }

// ─────────────────────────────── 启程 1（有 config ⇒ 设置面） ───────────────────────────────
{
  const fx = fixture({ config: true })
  const { app, page } = await launch(fx)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.evaluate(INSTALL_SCAN)

  // 流内 md 样本（真管道：store 归约 → 帧渲染）
  await page.evaluate(async (md) => {
    const { store } = await import("./store.mjs")
    const { reduce } = await import("./events.mjs")
    store.set({ activeSession: "1", blocks: [] })
    await new Promise((r) => requestAnimationFrame(r))
    store.set(reduce(store.get(), { channel: "ev:token", key: "1", text: md }))
    store.set(reduce(store.get(), { channel: "ev:tool-call", key: "1", name: "read", argsSummary: "probe.md", id: "probe-t1" }))
    store.set(reduce(store.get(), { channel: "ev:tool-output", key: "1", id: "probe-t1", text: "line-1\nline-2\n" }))
    store.set(reduce(store.get(), { channel: "ev:tool-result", key: "1", id: "probe-t1", status: "done" }))
    store.set(reduce(store.get(), { channel: "ev:subagent", key: "1", role: "advisor", id: "probe-s1", status: "started", model: "probe-model", turns: "1/1" }))
    for (let i = 0; i < 40; i += 1) await new Promise((r) => requestAnimationFrame(r))
  }, MD_SAMPLE)
  await page.waitForFunction(() => (document.querySelector('[data-slot="flow"]')?.textContent ?? "").includes("收尾段落"), null, { timeout: 15000 })

  const phase1 = { steps: {} }
  phase1.steps.base = await page.evaluate(() => window.__typoScan("base（流 ∥ 工具卡 ∥ 状态行 ∥ 池 ∥ 输入区）"))

  // 模型菜单（核件消费面）
  await page.click("#model-btn")
  await page.waitForSelector(".mm-panel", { timeout: 5000 })
  phase1.steps.modelMenu = await page.evaluate(() => window.__typoScan("模型菜单（.mm-panel 在场）"))
  await page.keyboard.press("Escape")

  // 推理下拉（核件消费面——`.dropdown-item` 面）
  await page.click("#reasoning-btn")
  await page.waitForTimeout(150)
  phase1.steps.reasoningDropdown = await page.evaluate(() => window.__typoScan("推理下拉"))
  await page.keyboard.press("Escape")

  // AUTO 确认 popover（核件消费面——`auto-confirm` 同位族）
  await page.click("#auto-btn")
  await page.waitForSelector(".auto-confirm", { timeout: 5000 })
  phase1.steps.autoConfirm = await page.evaluate(() => window.__typoScan("AUTO 确认 popover"))
  await page.click(".auto-confirm-no")

  // 搜索条（核件消费面——Ctrl+F）
  await page.keyboard.press("Control+f")
  await page.waitForSelector("#search-bar", { timeout: 5000 })
  phase1.steps.search = await page.evaluate(() => window.__typoScan("搜索条（#search-bar 在场）"))
  phase1.steps.search.present = await page.evaluate(() => ({
    bar: document.getElementById("search-bar") !== null,
    input: getComputedStyle(document.getElementById("search-input")).fontSize,
    count: getComputedStyle(document.getElementById("search-count")).fontSize,
    button: getComputedStyle(document.querySelector("#search-bar button")).fontSize,
  }))
  await page.keyboard.press("Escape")

  // 设置面
  await page.click("#settings-btn")
  await page.waitForSelector('[data-settings][data-state="open"]', { timeout: 8000 })
  await page.waitForTimeout(400)
  phase1.steps.settings = await page.evaluate(() => {
    const scan = window.__typoScan("设置面（[data-settings] open）")
    scan.dark = matchMedia("(prefers-color-scheme: dark)").matches
    scan.bg = getComputedStyle(document.body).backgroundColor
    return scan
  })
  // 暗模式同扫（真机判据⑥：亮 ∥ 暗两模式——`prefers-color-scheme` 切换后全文档重扫）。
  await page.emulateMedia({ colorScheme: "dark" })
  await page.waitForTimeout(250)
  phase1.steps.settingsDark = await page.evaluate(() => {
    const scan = window.__typoScan("设置面 · 暗模式（全文档同扫）")
    scan.dark = matchMedia("(prefers-color-scheme: dark)").matches
    scan.bg = getComputedStyle(document.body).backgroundColor
    return scan
  })
  await page.emulateMedia({ colorScheme: "light" })
  await page.waitForTimeout(150)
  // `select` 行高豁免的机器证据（随读数落盘）：对真设置面 select 逐路赋值均不可达 ⇒ 豁免面自证。
  phase1.steps.selectExemption = await page.evaluate(() => {
    const sel = document.querySelector('[data-slot="settings"] select')
    if (!sel) return { sel: false }
    const out = { before: getComputedStyle(sel).lineHeight }
    sel.style.lineHeight = "21px"
    out.inline = getComputedStyle(sel).lineHeight
    sel.style.setProperty("line-height", "21px", "important")
    out.inlineImportant = getComputedStyle(sel).lineHeight
    sel.style.removeProperty("line-height")
    const opt = sel.querySelector("option")
    out.optionLh = opt ? getComputedStyle(opt).lineHeight : null
    out.note = "Blink 把 select 本体 computed line-height 固定为 normal（内联 ∥ 表则 ∥ !important 均不可达）——同 select 的 option ∥ input ∥ button 可控且已归基线"
    return out
  })
  await page.evaluate(() => document.querySelector('[data-action="settings:close"]')?.click())
  await page.waitForTimeout(200)

  // 合成面（核卡 ∥ 小修族件——离线不可达面）
  await page.evaluate((html) => { document.body.insertAdjacentHTML("beforeend", html) }, SYNTH_HTML)
  await page.waitForTimeout(100)
  phase1.steps.synthetic = await page.evaluate(() => window.__typoScan("合成面（审批 ∥ 提问 ∥ 计划 ∥ 目标 ∥ 推理 ∥ 子代 ∥ 消化 ∥ 台账 ∥ 错误 ∥ diff ∥ 欢迎条族）"))
  phase1.steps.syntheticPresence = await page.evaluate(() => ({
    permission: document.querySelectorAll(".permission-prompt").length,
    question: document.querySelectorAll(".question-card").length,
    advisor: document.querySelectorAll(".advisor-block").length,
    code: document.querySelectorAll(".block-text code").length,
    codeBlock: document.querySelectorAll(".block-text .code-block code").length,
    table: document.querySelectorAll(".block-text table").length,
    h1: document.querySelectorAll(".block-text h1").length,
    strong: document.querySelectorAll(".block-text strong").length,
    toolCard: document.querySelectorAll(".block-tool").length,
    poolItems: document.querySelectorAll(".pool-item").length,
    statusSegs: document.querySelectorAll('.status-bar > [data-seg]').length,
  }))
  await page.evaluate(() => document.getElementById("typo-synth")?.remove())

  phase1.errors = errors
  results.phases.settings = phase1
  await app.close()
}

// ─────────────────────────────── 启程 2（零 config ⇒ 向导面） ───────────────────────────────
try {
  const fx = fixture({ config: false })
  const { app, page } = await launch(fx)
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.evaluate(INSTALL_SCAN)
  await page.waitForFunction(() => (document.querySelector('[data-slot="settings"]')?.children.length ?? 0) > 0, null, { timeout: 8000 })
  await page.waitForTimeout(300)
  const phase2 = { steps: {} }
  phase2.steps.wizard = await page.evaluate(() => window.__typoScan("首启向导（零 config ⇒ 向导树占槽）"))
  phase2.steps.wizardPresence = await page.evaluate(() => ({
    wizard: document.querySelectorAll("[data-slot='settings'].wizard").length,
    steps: document.querySelectorAll(".wizard-step").length,
  }))
  phase2.errors = errors
  results.phases.wizard = phase2
  await app.close()
} catch (error) {
  results.phases.wizard = { error: String(error && error.message ? error.message : error) }
  console.error("PHASE-2 ERROR:", error && error.stack ? error.stack : error)
}

// ─────────────────────────────── 汇总 + 落盘 ───────────────────────────────
const summarize = (phase) => {
  const rows = Object.entries(phase.steps).filter(([, v]) => v && v.violations)
  return rows.map(([name, v]) => ({ step: name, candidates: v.candidates, violations: v.violations.length }))
}
results.summary = Object.fromEntries(Object.entries(results.phases).map(([k, v]) => [k, summarize(v)]))
writeFileSync(OUT, JSON.stringify(results, null, 1))

const allViolations = []
for (const [pk, phase] of Object.entries(results.phases)) {
  for (const [name, v] of Object.entries(phase.steps)) {
    for (const viol of v?.violations ?? []) allViolations.push({ phase: pk, step: name, ...viol })
  }
}
console.log(JSON.stringify({
  out: OUT,
  summary: results.summary,
  violationCount: allViolations.length,
  violations: allViolations.slice(0, 120),
}, null, 1))
// 判据面退出码（真机腿 = 可机判绿/红）：零违规 ⇒ 0；有则 ⇒ 1（违规明细已随读数落盘）。
process.exit(allViolations.length === 0 ? 0 : 1)
