/**
 * 2026-09-29-desktop-rebuild-fidelity-p8.probe.mjs — 真机 P8（#581 段 14 窗内提示态）· 2026-09-29
 * 终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity-probe.mjs`（批档 §2.9 行 24）；本波暂住 `.thincoder/tmp/`（父侧收口转正）。
 *
 * 场景（设计 = 批档 §2.6「真机 P8」）：后台子代理 running ⇒ 主回合收（窗在场）⇒ 段 14 = 排队句 ⇒
 * 提交 ⇒ 段 14 = 计数句（N=1）∧ 该条零流内块。
 * 真机链 = 真 Electron + 真宿主链（桩模型服务 · 隔离家目录）：
 *   回合 1：桩回 `subagent` 工具调用（async spawn ⇒ 后台子代理）⇒ 回合 2 收尾 ⇒ 池活 ⇒ 挂起窗开（`ev:susp active:true`）。
 *   子代理模型请求 ∕ 窗内用户回合请求 ⇒ **悬挂**（保持 running——探针窗内 < 读侧 idle 超时 120s）。
 *   提交 #1（真输入区 Enter · `P8-Q1`）⇒ 宿主窗内受理（accept 帧）⇒ 窗内用户回合起跑（悬挂在飞）。
 *   提交 #2（`P8-Q2`）⇒ 窗内回合在飞 ⇒ 队留存 ⇒ 段 14 = 计数句（N=1 · DOM 稳定可读）。
 *   注：提交 #1 的 N=1 真机实测存续于 accept→consume 同帧窗（<1 帧 · DOM 未及出画——真机时间线在册）
 *   ⇒ 计数句断言以 #2 锚定（同为真机实时窗内队列态，非人造）；消费时刻入流恰一枚（delivered 帧）。
 * 断言：A 窗 ∧ 队空 ∧ 非忙 ⇒ 段 14 = 排队句（DOM）· B 受理帧含该条 ∧ 受理刻该条零流内块（帧锚定快照）
 *      · C 提交 ⇒ 段 14 = 计数句（N=1 · DOM）· D 该条零流内块（受理后 · 消费前）。
 * 复跑：仓根 `node .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-p8.probe.mjs`（父侧亲跑）；exit 0 = 全过。
 */
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..') // 仓根（.thincoder/tmp ∥ docs/batches 同深 ⇒ 两处均可跑）
const OUT = join(REPO, '.thincoder', 'tmp') // 读数 ∕ 截图落暂存面（防转正至 docs/batches 后写进文档树）
const APP_DIR = join(REPO, 'thincoder-desktop')
mkdirSync(OUT, { recursive: true })
const require = createRequire(join(APP_DIR, 'package.json'))
const { _electron: electron } = require('playwright-core')

const WAIT = { timeout: 30000 }
const Q1 = 'P8-Q1 窗内提交'
const Q2 = 'P8-Q2 再入队'
const TASK = 'P8-SLOW-TASK-9271 保持后台运行'
const hashOf = (cwd) => createHash('sha1').update(String(cwd).replace(/^([a-z]):/, (_, d) => `${d.toUpperCase()}:`)).digest('hex')

// ── 桩模型服务（OpenAI 兼容）：/models 秒回；chat 按内容分流 ──────────────────────────────
const hits = []
const server = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const kind = req.url.includes('/models')
      ? 'models'
      : body.includes('Generate a concise title') ? 'title'
        : body.includes('"content":"' + Q1) ? 'window-turn-Q1'
          : body.includes('"role":"tool"') ? 'parent-turn-2'
            : body.includes(TASK) ? 'subagent'
              : 'parent-turn-1'
    hits.push({ kind, url: req.url })
    console.log(`  [stub] ${req.method} ${req.url} ⇒ ${kind}`)
    if (kind === 'models') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ object: 'list', data: [{ id: 'stub-m' }] }))
      return
    }
    if (kind === 'title') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ choices: [{ message: { content: 'P8 探针会话' } }] }))
      return
    }
    if (kind === 'window-turn-Q1' || kind === 'subagent') { // 悬挂：保持 running（不回包头——连接随后端 idle 超时 120s 兜底）
      return
    }
    const sse = (frames) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.end(frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join('') + 'data: [DONE]\n\n')
    }
    if (kind === 'parent-turn-2') {
      sse([{ choices: [{ index: 0, delta: { content: 'P8 主回合完成' } }] }, { choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }])
      return
    }
    const args = JSON.stringify({ action: 'spawn', task: TASK, role: 'explore', async: true })
    sse([
      { choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: 'call_p8_1', function: { name: 'subagent', arguments: args } }] } }] },
      { choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] },
    ])
  })
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const PORT = server.address().port

// ── 夹具（隔离家目录 + 真槽文件；沿 statusline-probe 先例）────────────────────────────────
const home = mkdtempSync(join(tmpdir(), 'p8-home-'))
const project = mkdtempSync(join(tmpdir(), 'p8-proj-'))
const state = join(home, '.thincoder')
const slots = join(state, 'sessions')
mkdirSync(slots, { recursive: true })
writeFileSync(join(state, 'config.json'), JSON.stringify({
  locale: 'en',
  defaultModel: 'alpha:stub-m',
  providers: [{ name: 'alpha', baseURL: `http://127.0.0.1:${PORT}/v1`, apiKey: 'k-alpha', model: 'stub-m' }],
}))
const base = join(slots, `${hashOf(project)}.json`)
writeFileSync(base, JSON.stringify({ cwd: project }))
writeFileSync(`${base}.1`, JSON.stringify({
  version: 2, cwd: project, title: 'P8 探针会话', updatedAt: Date.now(),
  history: [
    { role: 'user', content: 'P8 开场', ts: Date.now() - 3000 },
    { role: 'assistant', content: 'P8 开场回执', ts: Date.now() - 2000 },
  ],
  contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: true, advisor: null, effort: null,
  pendingReminders: [], sessionStart: Date.now() - 60000,
  createdBy: 'desktop', activeProvider: 'alpha', activeModel: 'stub-m',
}))
writeFileSync(`${base}.manifest`, JSON.stringify({
  slots: { '1': { ts: Date.now(), messageCount: 2, updatedAt: Date.now(), title: 'P8 探针会话', activeProvider: 'alpha', activeModel: 'stub-m' } },
}))
writeFileSync(`${base}.manifest.desktop`, JSON.stringify({ slot: 1, updatedAt: Date.now() }))

// ── 断言账 ───────────────────────────────────────────────────────────────────────────
const checks = []
const check = (name, cond, detail) => { checks.push({ name, pass: cond === true, detail }); console.log(`${cond === true ? '✓' : '✗'} ${name}${detail === undefined ? '' : ` —— ${detail}`}`) }
const readings = { hits, seg14: {}, queueFrames: [], stamps: {} }
let app = null
try {
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: home, XDG_CONFIG_HOME: home }
  delete env.ELECTRON_RUN_AS_NODE
  app = await electron.launch({ args: ['.', `--user-data-dir=${join(home, 'ud')}`], cwd: APP_DIR, env, colorScheme: 'light' })
  const page = await app.firstWindow()
  page.on('pageerror', (e) => console.log(`  [pageerror] ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') console.log(`  [page:error] ${m.text().slice(0, 200)}`) })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction(() => ['ok', 'error'].includes(document.documentElement.dataset.boot), undefined, WAIT)

  // 开项目 + 续槽 1（真链路：project:open → refreshRail → resumeOpened）
  const opened = await page.evaluate(async (p) => {
    const mod = await import(new URL('./mount-sessions.mjs', document.baseURI).href)
    const receipt = await window.thincoder.invoke('project:open', { fsPath: p })
    await mod.refreshRail()
    await mod.resumeOpened()
    return receipt
  }, project)
  readings.stamps.open = opened?.cwd ?? null
  check('前置：项目已开（回执 cwd = 探针目录）', opened?.cwd === project, String(opened?.cwd))

  // 段 14 读数面 + 预期词（取 app 自身词表——零硬编码）
  await page.evaluate(async () => {
    const [statusMod, i18n, storeMod] = await Promise.all([
      import(new URL('./views/statusline.mjs', document.baseURI).href),
      import(new URL('./i18n.mjs', document.baseURI).href),
      import(new URL('./store.mjs', document.baseURI).href),
    ])
    window.__p8 = { storeMod, i18n, statusMod, queueFrames: [], seg14: [] }
    window.__p8.snap = () => {
      const s = storeMod.store.get()
      const key = s?.activeSession
      return {
        key, susp: key == null ? null : (s?.susp?.[key] ?? null),
        badges: key == null ? [] : (s?.tabBadges?.[key] ?? []),
        pending: key == null ? [] : [...(s?.pending?.[key] ?? [])],
        blocks: (s?.blocks ?? []).length,
        blockTexts: (s?.blocks ?? []).map((b) => String(b?.text ?? '')),
      }
    }
    window.__p8.segText = () => document.querySelector('[data-seg="enter"]')?.textContent ?? null
    window.thincoder.on('ev:queue', (payload) => {
      if (payload?.key !== window.__p8.snap().key) return
      window.__p8.queueFrames.push({ t: Date.now(), payload, snap: window.__p8.snap() })
    })
    const el = document.querySelector('[data-slot="status"]')
    if (el) {
      new MutationObserver(() => window.__p8.seg14.push({ t: Date.now(), text: window.__p8.segText() }))
        .observe(el, { childList: true, subtree: true, characterData: true })
    }
    window.__p8.words = {
      queue: i18n.t('status.queue.enter'),
      send: i18n.t('status.enter.send'),
      n: (n) => i18n.t('status.queue.n', { n }),
    }
  })
  readings.words = await page.evaluate(() => ({ queue: window.__p8.words.queue, send: window.__p8.words.send, n1: window.__p8.words.n(1) }))

  // ── 主回合（触发后台子代理 ⇒ 窗）──────────────────────────────────────────────────
  await page.fill('[data-slot="composer"] textarea', 'P8 开始')
  await page.press('[data-slot="composer"] textarea', 'Enter')
  await page.waitForFunction(() => {
    const s = window.__p8.snap()
    return s.susp?.active === true && !s.badges.includes('running')
  }, undefined, { timeout: 60000 })
  const atWindow = await page.evaluate(() => window.__p8.snap())
  readings.stamps.window = Date.now()

  // ── A：窗 ∧ 队空 ∧ 非忙 ⇒ 段 14 = 排队句（DOM）────────────────────────────────────
  await page.waitForFunction((w) => window.__p8?.segText?.() === w, readings.words.queue, { timeout: 5000 }).catch(() => {}) // 帧合并出画（有界；修复前不达 ⇒ 断言照红）
  const segIdle = await page.evaluate(() => window.__p8.segText())
  readings.seg14.idle = segIdle
  check('A 前置：窗在场 ∧ 队空 ∧ 非忙', atWindow.susp?.active === true && atWindow.pending.length === 0 && !atWindow.badges.includes('running'), JSON.stringify({ susp: atWindow.susp, pending: atWindow.pending, badges: atWindow.badges }))
  check('A 段 14 = 排队句（窗 ∧ 静 ⇒ 原出 send 句 = 本批收正点）', segIdle === readings.words.queue, `DOM=${JSON.stringify(segIdle)} 期望=${JSON.stringify(readings.words.queue)}`)
  const baselineBlocks = atWindow.blocks

  // ── 提交 #1（真 Enter）⇒ 受理帧（帧锚定：受理刻该条零流内块）──────────────────────────
  await page.fill('[data-slot="composer"] textarea', Q1)
  await page.press('[data-slot="composer"] textarea', 'Enter')
  await page.waitForFunction((q) => window.__p8.queueFrames.some((f) => f.payload?.items?.some((i) => String(i?.text ?? i).includes(q))), Q1, { timeout: 15000 })
  const accept = await page.evaluate((q) => window.__p8.queueFrames.find((f) => f.payload?.items?.some((i) => String(i?.text ?? i).includes(q))), Q1)
  readings.queueFrames.push({ kind: 'accept#1', payload: accept.payload, snap: accept.snap })
  check('B 受理帧含该条（宿主窗内受理）', accept.snap.pending.some((i) => String(i?.text ?? i).includes('P8-Q1')), JSON.stringify(accept.snap.pending))
  check('B 受理刻该条零流内块（消费前流内零块）', accept.snap.blockTexts.every((t) => !t.includes('P8-Q1')) && accept.snap.blocks === baselineBlocks, `blocks=${accept.snap.blocks}（基线 ${baselineBlocks}）· 文本=${JSON.stringify(accept.snap.blockTexts)}`)

  // 消费（delivered 帧 ⇒ 窗内用户回合起跑；该回合请求悬挂 ⇒ 保持 running）
  await page.waitForFunction((q) => window.__p8.queueFrames.some((f) => f.payload?.delivered && String(f.payload.delivered.text ?? '').includes(q)), Q1, { timeout: 20000 })
  const delivered = await page.evaluate((q) => window.__p8.queueFrames.find((f) => f.payload?.delivered && String(f.payload.delivered.text ?? '').includes(q)), Q1)
  readings.queueFrames.push({ kind: 'delivered#1', payload: delivered.payload, snap: delivered.snap })

  // ── 提交 #2（窗内回合在飞 ⇒ 队留存 ⇒ 段 14 = 计数句 N=1 · DOM 稳定）────────────────
  await page.fill('[data-slot="composer"] textarea', Q2)
  await page.press('[data-slot="composer"] textarea', 'Enter')
  await page.waitForFunction((q) => window.__p8.snap().pending.some((i) => String(i?.text ?? i).includes(q)), Q2, { timeout: 15000 })
  await page.waitForFunction((w) => window.__p8?.segText?.() === w, readings.words.n1, { timeout: 5000 }).catch(() => {}) // 帧合并出画（有界）
  const queueSnap = await page.evaluate(() => window.__p8.snap())
  const segQueue = await page.evaluate(() => window.__p8.segText())
  const flowAttr = await page.evaluate(() => document.querySelector('[data-slot="flow"]')?.getAttribute('data-blocks') ?? null)
  readings.seg14.queue = segQueue
  readings.stamps.queue = Date.now()
  readings.flowBlocks = flowAttr
  check('C 队留存（N=1）', queueSnap.pending.length === 1 && queueSnap.pending.some((i) => String(i?.text ?? i).includes('P8-Q2')), JSON.stringify(queueSnap.pending))
  check('C 段 14 = 计数句（N=1）', segQueue === readings.words.n1, `DOM=${JSON.stringify(segQueue)} 期望=${JSON.stringify(readings.words.n1)}`)
  check('D 该条零流内块（受理后 · 消费前）', queueSnap.blockTexts.every((t) => !t.includes('P8-Q2')), `文本=${JSON.stringify(queueSnap.blockTexts)}`)

  readings.seg14.timeline = await page.evaluate(() => window.__p8.seg14.slice(-40))
  await page.screenshot({ path: join(OUT, 'p8-queue-window.png') })
} catch (error) {
  check('探针执行', false, String(error?.message ?? error))
} finally {
  try { if (app !== null) await app.close() } catch { /* 已死 */ }
  server.close()
}

writeFileSync(join(OUT, 'p8-readings.json'), JSON.stringify(readings, null, 2))
const failed = checks.filter((c) => !c.pass)
console.log(`\nP8 读数：${checks.filter((c) => c.pass).length}/${checks.length} 过 · 全程请求 ${hits.map((h) => h.kind).join(' → ')}`)
console.log(`读数件 = ${join(OUT, 'p8-readings.json')} · 截图 = ${join(OUT, 'p8-queue-window.png')}`)
console.log(failed.length === 0 ? 'P8 PASS' : `P8 FAIL（${failed.map((f) => f.name).join(' · ')}）`)
process.exit(failed.length === 0 ? 0 : 1)
