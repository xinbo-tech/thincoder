/**
 * 2026-09-29-parity-b1-vsc-core.test.mjs — 批次本地单元件（parity-b1 · VSC+CLI 收口核 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs
 * （本刻暂存 `.thincoder/tmp/` 同名件；导入按 `process.cwd()`（仓库根）解析 ⇒ tmp ∕ 终位两处可跑。）
 *
 * 覆盖 = 批档 §2.7 判据 1 对拍族 + §2.6 测试行（核增补 B ∕ C ∕ D ∕ E 四用例同档承载）：
 *   G1 skills 转口（P1：同一绑定 ∕ 行为 ∕ 转口档零本地实现 ∕ 消费面保形）；
 *   G2 peers 三面（P2：三档同一绑定 ∕ AC-IC11 逐字锚（认领行 ∕ 足迹行）∕ 落盘回环 ∕ ④ 面保留 ∕ 端侧零第二份字面）；
 *   G3 挂起状态机（P3：step1–4 序 ∕ 退出清场 ∕ 残输入 ∕ abort 只清已死 + 核增补 C ∕ D 全用例）；
 *   G4 循环关键臂（P4：空响应重试 ∕ 中断（核抛无 `.reason` 判据）∕ guard 推回 ∕ 蒸馏发射+核增补 B ∕ 域文本组合+缺省）；
 *   G5 端装配面（VSC ∕ CLI 取核装配同一性 + 核增补 E1 ∕ E2 dispatch 门禁）；
 *   G6 runTurnLoop host 包装（续跑 ∕ 载体面 ∕ 完成面——子进程真件 + 三桩）；
 *   G7 结构面（端侧零第二份字面扫描 ∕ 核单源转口行 ∕ 消费档 import 面 ⊆ 导出面）。
 *
 * vscode 宿主模块桩：仓内 `thincoder-vscode/node_modules/vscode` 符号链接指向已清的
 * `test/vscode-mock`（2026-09-28 测试树全清后失效）⇒ 本件以 `module.registerHooks` 进程内
 * resolve 钩接管 `vscode` 说明符（data: URL 桩——零仓内落盘；先例 = P3 ∕ P4 临时验证件的 loader 钩）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const HERE = fileURLToPath(import.meta.url)

// ─── 子进程模式：G6 runTurnLoop host 包装（核 `runAgent` ∕ VSC host 装配 ∕ vscode 三桩重定向——与主体隔离进程）──
if (process.env.B1_LOOP_CHILD === "1") await runLoopChild()

const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const canon = (rel) => realpathSync(resolve(ROOT, rel)).toLowerCase()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** 挂起驱动等待中反复唤醒直至条件成立（缺省 wait 窗已过 ⇒ 唤醒丢失时的鲁棒驱动）。 */
const wakeUntil = async (h, cond, ms = 3000) => {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("wakeUntil timeout")
    h.wake()
    await sleep(5)
  }
}

// vscode 桩（进程内钩——主进程 VSC 模块装载面；子进程另有其桩，见 runLoopChild）
const VSCODE_STUB_SRC = `
const mk = () => new Proxy(function vscodeStub() {}, { get: (t, p) => (p === Symbol.toPrimitive || p === "then" ? undefined : mk()), apply: () => undefined, construct: () => mk() });
export const window = mk(); export const workspace = mk(); export const commands = mk(); export const env = mk(); export const languages = mk();
export const Uri = mk(); export const Range = mk(); export const Position = mk(); export const Selection = mk(); export const MarkdownString = mk();
export const ThemeColor = mk(); export const StatusBarAlignment = mk(); export const ProgressLocation = mk(); export const ConfigurationTarget = mk();
export const DiagnosticSeverity = mk(); export const DocumentSymbol = mk(); export const SymbolKind = mk(); export const RelativePattern = mk();
export const WorkspaceEdit = mk(); export const WebviewView = mk(); export const CancellationToken = mk(); export const Disposable = mk();
export const EventEmitter = class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} };
export default { window, workspace, commands, env, languages, Uri };
`
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(VSCODE_STUB_SRC)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── 模块装载（真件；跨包同一性按「各自解析上下文」+ realpath 双证——先例 = B2 批内件注②）──
const coreSkills = await mod("thincoder-core/skills.mjs")
const vscSkills = await mod("thincoder-vscode/src/extension/skills.mjs")
const skillsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/skills.mjs")

const coreClaims = await mod("thincoder-core/peer-claims.mjs")
const coreDomains = await mod("thincoder-core/peer-domains.mjs")
const coreInstances = await mod("thincoder-core/peer-instances.mjs")
const vscClaims = await mod("thincoder-vscode/src/extension/peer-claims.mjs")
const vscDomains = await mod("thincoder-vscode/src/extension/peer-domains.mjs")
const vscInstances = await mod("thincoder-vscode/src/extension/peer-instances.mjs")
const claimsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-claims.mjs")
const domainsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-domains.mjs")
const instancesViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-instances.mjs")
const ss = await mod("thincoder-core/session-slots.mjs")

const coreSusp = await mod("thincoder-core/agent/suspension.mjs")
const coreDispatch = await mod("thincoder-core/agent/dispatch.mjs")
const coreHelpers = await mod("thincoder-core/agent/helpers.mjs")
const coreCompletion = await mod("thincoder-core/agent/completion.mjs")
const coreAgentMod = await mod("thincoder-core/agent.mjs")
const coreSetup = await mod("thincoder-core/agent/setup.mjs")
const vscAgentMod = await mod("thincoder-vscode/src/agent.mjs")
const vscTurnDomains = await mod("thincoder-vscode/src/agent/turn-domains.mjs")
const vscSusp = await mod("thincoder-vscode/src/extension/suspension.mjs")
const cliSusp = await mod("thincoder-cli/src/tui/suspension-drive.mjs")
const cliSuspViaCli = await mod("thincoder-cli/node_modules/@thincoder/core/agent/suspension.mjs")

const readSrc = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const T0 = 1_700_000_000_000 // 认领面时钟缝确定值
/** 源内「本地定义」命中集（export 形 + 局部形两族；空集 = 零本地实现）。 */
function defHits(src, names) {
  const hits = []
  for (const name of names) {
    const exportForm = new RegExp(`export\\s+(?:const|function|async\\s+function|class)\\s+${name}\\b`)
    const localForm = new RegExp(`(?:^|\\n)\\s*(?:const|let|var|function|async\\s+function|class)\\s+${name}\\b`)
    if (exportForm.test(src)) hits.push(`export:${name}`)
    if (localForm.test(src)) hits.push(`local:${name}`)
  }
  return hits
}

// ═══════════════════════════ G1 · skills 转口（P1） ═══════════════════════════

test("G1a 同一绑定：转口三名 === 核 *Sync 面（各自解析上下文 + realpath 同一文件）", () => {
  assert.equal(vscSkills.loadSkills, skillsViaVsc.loadSkillsSync, "loadSkills === 核 loadSkillsSync")
  assert.equal(vscSkills.readSkill, skillsViaVsc.readSkillSync, "readSkill === 核 readSkillSync")
  assert.equal(vscSkills.formatSkillListing, skillsViaVsc.formatSkillListing, "formatSkillListing === 核 formatSkillListing")
  assert.deepEqual(Object.keys(vscSkills).sort(), ["formatSkillListing", "loadSkills", "readSkill"], "导出面 = 三键（无面收窄）")
  assert.equal(canon("thincoder-vscode/node_modules/@thincoder/core/skills.mjs"), canon("thincoder-core/skills.mjs"), "说明符解析 ⇒ 活核树同一文件")
})

test("G1b 行为：发现（子目录段先 ∕ 扁平段后 ∕ 无效名跳过）· 读 ∕ 未命中 · 清单三档", () => {
  const fx = mkdtempSync(join(tmpdir(), "b1-skills-"))
  try {
    const skillsDir = join(fx, ".thincoder", "skills")
    mkdirSync(join(skillsDir, "alpha"), { recursive: true })
    mkdirSync(join(skillsDir, "gamma"), { recursive: true })
    mkdirSync(join(skillsDir, "bad dir!"), { recursive: true })
    writeFileSync(join(skillsDir, "alpha", "SKILL.md"), "---\nname: alpha\n---\nalpha subdir description\n# Body\nalpha body\n")
    writeFileSync(join(skillsDir, "alpha.md"), "flat alpha SHOULD BE SKIPPED (subdir wins)\n")
    writeFileSync(join(skillsDir, "beta.md"), "beta flat description\n")
    writeFileSync(join(skillsDir, "gamma", "SKILL.md"), "# OnlyHeading\n")
    writeFileSync(join(skillsDir, "bad name.md"), "invalid name → skipped\n")
    writeFileSync(join(skillsDir, "notes.txt"), "not markdown → skipped\n")

    const list = vscSkills.loadSkills(fx)
    const fxNorm = fx.replaceAll("\\", "/")
    const project = list.filter((s) => s.path.replaceAll("\\", "/").startsWith(fxNorm))
    assert.deepEqual(project.map((s) => s.name), ["alpha", "gamma", "beta"], "项目层发现 = alpha,gamma,beta（子目录段先 ∕ 扁平段后；无效名跳过）")
    const names = list.map((s) => s.name)
    assert.equal(new Set(names).size, names.length, "发现集按名去重")
    const alpha = project.find((s) => s.name === "alpha")
    assert.equal(alpha.description, "alpha subdir description", "描述提取（frontmatter 跳过）")

    assert.equal(vscSkills.readSkill(fx, "alpha"), "---\nname: alpha\n---\nalpha subdir description\n# Body\nalpha body\n", "readSkill 命中（子目录 SKILL.md）")
    assert.equal(vscSkills.readSkill(fx, "beta"), "beta flat description\n", "readSkill 命中（扁平 .md）")
    assert.equal(vscSkills.readSkill(fx, "bi-omega-missing-9f3"), null, "未命中 ⇒ null")
    assert.equal(vscSkills.readSkill(fx, "../evil"), null, "无效名 ⇒ null")
    assert.equal(vscSkills.readSkill(fx, "bad name"), null, "含空格名 ⇒ null")

    assert.equal(vscSkills.formatSkillListing([]), "", "0 项 ⇒ 空串")
    assert.equal(vscSkills.formatSkillListing([{ name: "s1", description: "d1" }]), "DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):\n- **s1**: d1", "1 项")
    const five = vscSkills.formatSkillListing([1, 2, 3, 4, 5].map((n) => ({ name: `s${n}`, description: `d${n}` })))
    assert.ok(five.includes("- **s1**: d1") && five.includes("- **s3**: d3") && !five.includes("s4"), "≤3 项截断")
    assert.ok(five.includes("  ... and 2 more"), "溢出标记（5 − 3 = 2）")
  } finally {
    rmSync(fx, { recursive: true, force: true })
  }
})

test("G1c 转口档零本地实现 + 消费面 import ⊆ 导出面 + 行数读数", () => {
  const src = readSrc("thincoder-vscode/src/extension/skills.mjs")
  assert.ok(src.includes('export { loadSkillsSync as loadSkills, readSkillSync as readSkill, formatSkillListing } from "@thincoder/core/skills.mjs"'), "转口行 = 设计形逐字")
  assert.deepEqual(defHits(src, ["loadSkills", "readSkill", "formatSkillListing"]), [], "零本地定义（两形扫描）")
  // 负控（判别力自证）：副本复活 ⇒ 扫描判红
  assert.deepEqual(
    defHits("export function loadSkills(d) { return [] }\nconst formatSkillListing = () => ''", ["loadSkills", "formatSkillListing"]),
    ["export:loadSkills", "local:formatSkillListing"],
    "负控：副本复活 ⇒ 扫描判红"
  )
  assert.equal(src.split("\n").length, 6, "行数 = 6（§2.0 口径）")
  // 消费档（实扫：setup-tooltable 单点）import 名 ⊆ 导出面
  const consumers = ["thincoder-vscode/src/agent/setup-tooltable.mjs"]
  for (const rel of consumers) {
    const m = readSrc(rel).match(/import\s*\{([^}]*)\}\s*from\s*"[^"]*skills\.mjs"/)
    assert.ok(m, `${rel}：import 句可解析`)
    const importNames = m[1].split(",").map((s) => s.trim()).filter(Boolean)
    for (const n of importNames) assert.ok(Object.keys(vscSkills).includes(n), `${rel} import { ${n} } ⊆ 转口导出面`)
  }
})

// ═══════════════════════════ G2 · peers 三面（P2） ═══════════════════════════

test("G2a 同一绑定：claims ∕ domains ∕ instances 三档核单源转口（含旧名 alias 面）", () => {
  for (const n of ["readPeerRecord", "recordPeerClaims", "flushPeerClaims", "markClaimNoted", "clearClaimNoted", "pathsOverlap", "claimNoteText", "peersDir", "peerFilePath"]) {
    assert.equal(vscClaims[n], claimsViaVsc[n], `claims.${n} === 核件`)
  }
  assert.equal(vscClaims.readRecord, vscClaims.readPeerRecord, "alias readRecord → readPeerRecord（同源再导出）")
  assert.equal(vscClaims.registerClaims, vscClaims.recordPeerClaims, "alias registerClaims")
  assert.equal(vscClaims.flushClaims, vscClaims.flushPeerClaims, "alias flushClaims")
  assert.equal(vscClaims.claimsOverlap, vscClaims.pathsOverlap, "alias claimsOverlap → pathsOverlap")
  for (const n of ["peerCollabNote", "recordPeerWrites", "flushPeerDomains", "peerWriteTargets", "conflicts", "HOT_WINDOW_MS", "PEER_WRITE_TOOLS"]) {
    assert.equal(vscDomains[n], domainsViaVsc[n], `domains.${n} === 核件`)
  }
  assert.equal(vscDomains.markClaimNoted, vscClaims.markClaimNoted, "domains 认领面 re-export = claims 面同一绑定")
  assert.equal(vscDomains.markPeerNoted, vscClaims.markClaimNoted, "旧名 markPeerNoted 保形")
  assert.equal(vscInstances.peerInstances, instancesViaVsc.peerInstances, "instances.peerInstances === 核件")
  assert.equal(vscInstances.peerInstancesTool, instancesViaVsc.peerInstancesTool, "instances.peerInstancesTool === 核件（工具描述逐字锚同源）")
  assert.equal(typeof vscInstances.prewarmPeerInstances, "function", "prewarmPeerInstances 薄转口保形")
  for (const rel of ["thincoder-vscode/src/extension/peer-claims.mjs", "thincoder-vscode/src/extension/peer-domains.mjs", "thincoder-vscode/src/extension/peer-instances.mjs"]) {
    assert.deepEqual(defHits(readSrc(rel), ["recordPeerClaims", "peerCollabNote", "peerCollabNote", "peerInstances"]), [], `${rel}：零本地实现`)
  }
})

test("G2b AC-IC11 逐字锚：认领行 ∕ 足迹行 ∕ 多目标分隔符（核单源 + 端侧零第二份字面）", () => {
  const root = mkdtempSync(join(tmpdir(), "b1-peers-"))
  const sessionsPath = join(root, "sessions")
  const peersPath = join(root, "peers")
  mkdirSync(sessionsPath, { recursive: true })
  mkdirSync(peersPath, { recursive: true })
  ss._setSessionsDirForTest(sessionsPath)
  vscClaims._setPeersDirForTest(peersPath)
  vscClaims._setPeerClaimsTestImpl({ nowFn: () => T0 })
  vscDomains._setPeerDomainsTestImpl({ aliveFn: (pids) => new Set(pids) })
  try {
    const cwdA = join(root, "projA")
    mkdirSync(cwdA, { recursive: true })
    const t1 = join(cwdA, "src/f1.mjs")
    const t2 = join(cwdA, "src/f2.mjs")
    const sid = "4242-1-aaaa"
    writeFileSync(join(peersPath, `${sid}.json`), JSON.stringify({
      sessionId: sid, pid: 4242, end: "vscode", cwd: cwdA,
      domains: [t1, t2], updatedAt: Date.now(),
      claims: [{ target: t1, claimedAt: T0 - 120_000, expiresAt: T0 + 600_000 }], claimsUpdatedAt: T0,
    }), "utf8")
    const agent = { cwd: cwdA, _peerNoted: new Set() }

    const claimNote = vscDomains.peerCollabNote(agent, { name: "write" }, { path: t1 })
    assert.equal(claimNote.text,
      `[peer-collab] ${t1} — another live instance (vscode pid=4242) holds a live intent claim on it (claimed 2 min ago, lease 10 min left); concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`,
      "认领行逐字（认领命中抑制足迹行）")
    assert.deepEqual(claimNote.keys, [`${t1}\u0000${sid}`], "去重键 = target\\u0000sessionId")

    const freshAgent = { cwd: cwdA, _peerNoted: new Set() }
    const footNote = vscDomains.peerCollabNote(freshAgent, { name: "write" }, { path: t2 })
    assert.equal(footNote.text,
      `[peer-collab] ${t2} — another live instance (vscode pid=4242) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`,
      "足迹行逐字（AC-IC11 字面本体）")
    assert.deepEqual(footNote.keys, [], "足迹行零去重键")

    const multi = vscDomains.peerCollabNote({ cwd: cwdA, _peerNoted: new Set() }, { name: "file_ops" }, { action: "move", source: t1, dest: t2 })
    assert.equal(multi.text, claimNote.text + "\n" + footNote.text, "多目标 = 逐 target 逐行、行间分隔符 = 核形 \\n")

    // 去重：提示附后 markClaimNoted ⇒ 同（目标 × 属主）再问零行
    vscDomains.markClaimNoted(agent, claimNote.keys)
    const second = vscDomains.peerCollabNote(agent, { name: "write" }, { path: t1 })
    assert.equal(second, null, "去重集命中 ⇒ 该目标零行（足迹行同被抑制）")

    // 端侧零第二份字面（结构扫描——核单源）
    const hits = []
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name)
        if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); continue }
        if (e.name.endsWith(".mjs") && readFileSync(p, "utf8").includes("another live instance")) hits.push(p)
      }
    }
    walk(join(ROOT, "thincoder-vscode/src"))
    assert.deepEqual(hits, [], "VSC src 零第二份字面（核单源）")
    assert.ok(readSrc("thincoder-core/peer-domains.mjs").includes("another live instance"), "核件 = 字面唯一来源")
  } finally {
    ss._resetSessionsDirForTest()
    vscClaims._resetPeersDirForTest()
    vscClaims._resetPeerClaimsTestImpl()
    vscDomains._resetPeerDomainsTestImpl()
    rmSync(root, { recursive: true, force: true })
  }
})

test("G2c 落盘回环：认领登记（manifest 门控 + 时钟缝确定值）+ 回合末足迹整写（字段级合并）+ ④ 面保留", () => {
  const root = mkdtempSync(join(tmpdir(), "b1-peers2-"))
  const sessionsPath = join(root, "sessions")
  const peersPath = join(root, "peers")
  mkdirSync(sessionsPath, { recursive: true })
  mkdirSync(peersPath, { recursive: true })
  const prevEnd = ss.sessionEnd()
  ss.setSessionEnd("cli") // 端名缝确定性（端声明面测试见 G5a）
  ss._setSessionsDirForTest(sessionsPath)
  vscClaims._setPeersDirForTest(peersPath)
  vscClaims._setPeerClaimsTestImpl({ nowFn: () => T0 })
  vscDomains._setPeerDomainsTestImpl({ aliveFn: (pids) => new Set(pids) })
  try {
    const cwdA = join(root, "projA")
    mkdirSync(cwdA, { recursive: true })
    const mp = ss.manifestPath(cwdA)
    mkdirSync(dirname(mp), { recursive: true })
    writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions: {} }), "utf8")
    const sid = ss.getSessionId()
    const file = join(peersPath, `${sid}.json`)
    const absA = join(cwdA, "src/a.mjs")
    const agent = { cwd: cwdA }

    // 认领：写成功即登记 + 即刻落盘
    vscClaims.recordPeerClaims(agent, [absA])
    assert.ok(existsSync(file), "认领 ⇒ 即刻落盘")
    const rec = JSON.parse(readFileSync(file, "utf8"))
    assert.equal(rec.claims.length, 1, "claims 一条")
    assert.deepEqual(rec.claims[0], { target: absA, claimedAt: T0, expiresAt: T0 + vscClaims.CLAIM_TTL_MS }, "TTL 三字段（时钟缝确定值）")
    assert.equal(rec.cwd, ss.normalizeCwd(cwdA), "cwd = normalizeCwd（盘符大写归一——核单源）")
    assert.equal(rec.end, "cli", "end 缺省 = 进程端名缺省（零声明 ⇒ cli；端声明缝见 G5）")

    // 足迹：回合末整写（字段级合并——认领字段逐字保留）
    vscDomains.recordPeerWrites(agent, { name: "write" }, { path: join(cwdA, "src/b.mjs") })
    vscDomains.flushPeerDomains(agent)
    const rec2 = JSON.parse(readFileSync(file, "utf8"))
    assert.deepEqual(rec2.domains, [join(cwdA, "src/b.mjs")], "domains = 本回合足迹集")
    assert.deepEqual(rec2.claims.map((c) => c.target), [absA, join(cwdA, "src/b.mjs")], "认领登记：写成功目标亦入集（a 保留 + b 新增，按 target 排序）")
    assert.deepEqual(rec2.claims[0], rec.claims[0], "字段级合并：既有认领条目逐字保留")
    assert.equal(typeof rec2.updatedAt, "number", "updatedAt 落盘")

    // ④ 面（取核修正）：结构非法记录（缺 pid）经读面保留（不再误判死 unlink）
    const badFile = join(peersPath, "5002-2-cccc.json")
    writeFileSync(badFile, JSON.stringify({ sessionId: "5002-2-cccc", end: "cli", cwd: cwdA, domains: [], updatedAt: Date.now(), claims: [] }), "utf8")
    vscDomains.peerDomains(cwdA)
    assert.ok(existsSync(badFile), "结构非法（无 pid）⇒ 按缺失保留（④ 面取核修正）")
  } finally {
    ss.setSessionEnd(prevEnd)
    ss._resetSessionsDirForTest()
    vscClaims._resetPeersDirForTest()
    vscClaims._resetPeerClaimsTestImpl()
    vscDomains._resetPeerDomainsTestImpl()
    rmSync(root, { recursive: true, force: true })
  }
})

// ═════════════════════ G3 · 挂起状态机（P3 + 核增补 C ∕ D） ═════════════════════

/** 载体夹具（history 形——pushReal 需要 history/_fullHistory；池 ∕ pending 单容器全挂本对象）。 */
function carrier() {
  return {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _pendingAsyncResults: [],
    _consultSessions: new Map(),
    history: [],
    _fullHistory: [],
  }
}
/** 池条目夹具：`aborted` 真 ⇒ controller.signal.aborted（D 只清已死的判据 = parentAborted）。 */
function entry(id, role, { aborted = false, done = false } = {}) {
  const controller = new AbortController()
  if (aborted) controller.abort()
  return { id, role, status: done ? "done" : "running", done, cancelled: false, controller, _inPending: false, report: null }
}

test("G3a 状态机 step1–4 序：用户输入优先 → 消化轮（pending） → 池空自然退出 + 退出清场", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const seen = []
  const counts = []
  const h = coreSusp.startSuspension({
    carrier: c,
    runTurn: async (item, opts) => { seen.push([item, opts]); if (opts?.autoTurn) c._pendingAsyncResults.length = 0 },
    hooks: { onCounts: (n) => counts.push(n) },
  })
  await sleep(20) // 进入等待（池 live）
  h.pushInput("U1")
  await wakeUntil(h, () => seen.length >= 1)
  assert.equal(seen[0][0], "U1", "step1：用户输入优先开普通回合")
  assert.equal(seen[0][1], undefined, "用户回合无 opts")
  c._pendingAsyncResults.push({ id: 9, role: "subagent", report: "r" })
  await wakeUntil(h, () => seen.length >= 2)
  assert.equal(seen[1][0], "", "step2：pending ⇒ 消化轮（空输入）")
  assert.deepEqual(seen[1][1], { autoTurn: true, upstreamTurn: false }, "消化轮 opts 形")
  c._asyncSubagents.clear()
  const ticker = setInterval(() => h.wake(), 10)
  const res = await h.done
  clearInterval(ticker)
  assert.equal(res.reason, "idle", "step3：池空 + pending 空 ⇒ 自然退出（idle）")
  assert.deepEqual(res.residualInput, [], "idle 残输入空")
  assert.ok(counts.length >= 2, "onCounts 钩沿途触发")
})

test("G3b 核增补 C：缺省 shift + pushInput 原值（对象引用未 String 化）", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const seen = []
  const h = coreSusp.startSuspension({ carrier: c, runTurn: async (item, opts) => { seen.push([item, opts]) } })
  const obj = { rich: true, text: "x" }
  h.pushInput(obj)
  h.pushInput("second")
  h.wake()
  await sleep(20)
  assert.equal(seen[0][0], obj, "首条 = pushInput 原值（引用未变）")
  assert.equal(seen[1][0], "second", "次条 shift")
  c._asyncSubagents.clear()
  h.wake()
  const res = await h.done
  assert.equal(res.reason, "idle")
  assert.deepEqual(res.residualInput, [])
})

test("G3c 核增补 C：ctx.inputQueue 同数组批取（takeInput 缝）+ takeInput ⇒ null 零动作不挂", async () => {
  {
    const c = carrier()
    const q = [{ text: "a" }, { text: "b" }]
    const seen = []
    let sameArray = null
    const h = coreSusp.startSuspension({
      carrier: c,
      inputQueue: q,
      takeInput: async (queue) => { sameArray = queue === q; return queue.splice(0, 2).map((e) => e.text).join(" + ") },
      runTurn: async (item) => { seen.push(item) },
    })
    const res = await h.done
    assert.equal(sameArray, true, "takeInput 收到宿主同数组")
    assert.equal(seen[0], "a + b", "批取产物进 runTurn")
    assert.equal(q.length, 0, "宿主数组就地消费")
    assert.deepEqual(res.residualInput, [], "出窗（residualInput 空）")
  }
  {
    const c = carrier()
    const q = [{ text: "/cmd" }]
    const leftover = q[0]
    let runN = 0
    const h = coreSusp.startSuspension({
      carrier: c, inputQueue: q,
      takeInput: async () => null,
      runTurn: async () => { runN++ },
    })
    const res = await h.done
    assert.equal(runN, 0, "null ⇒ 零回合（防御面不挂循环）")
    assert.equal(res.residualInput[0], leftover, "条目不消费（残输入同引用兑现）")
    assert.equal(q.length, 0, "宿主数组经残输入出窗（同数组语义）")
  }
})

test("G3d timer 第四态：deadline 现算 + deliver 严格布尔（真 ⇒ timer 轮恰一次）", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const calls = []
  let delivered = true
  const h = coreSusp.startSuspension({
    carrier: c,
    runTurn: async (item, opts) => { calls.push([item, opts]) },
    timerFace: {
      deadline: () => Date.now() - 1,
      deliver: () => { const was = delivered; delivered = false; return was },
    },
    timer: (fn) => setTimeout(fn, 1),
    clear: (t) => clearTimeout(t),
  })
  await sleep(30)
  assert.deepEqual(calls[0]?.[1], { autoTurn: true, timerTurn: true }, "timer 轮开轮（autoTurn + timerTurn）")
  c._asyncSubagents.clear()
  h.wake()
  await h.done
  assert.equal(calls.length, 1, "timer 轮恰一次")
})

test("G3e 核增补 D：abort 只清已死（存活留池 · 墓碑 · 整批提醒 · pending 清不注入 · 会诊清）", async () => {
  const c = carrier()
  let sess1 = null
  const dead = entry(1, "explore", { aborted: true })
  const live = entry(2, "eng-coder")
  const deadAdv = entry(3, "advisor", { aborted: true })
  c._asyncSubagents.set("1", dead)
  c._asyncSubagents.set("2", live)
  c._asyncAdvisors.set("3", deadAdv)
  c._pendingAsyncResults.push({ id: 9, role: "subagent", report: "stale" })
  c._consultSessions.set("s1", (sess1 = { stopped: false }))
  let injected = 0
  const ctrl = new AbortController()
  ctrl.abort()
  const h = coreSusp.startSuspension({
    carrier: c, abortSignal: ctrl.signal,
    runTurn: async () => {},
    injectResidual: async () => { injected++ },
  })
  const res = await h.done
  assert.equal(res.reason, "aborted", "reason = aborted")
  assert.ok(!c._asyncSubagents.has("1") && !c._asyncAdvisors.has("3"), "死条目出池（含 advisor 池）")
  assert.equal(c._asyncSubagents.get("2"), live, "存活条目留池（负控：全清会误杀）")
  assert.equal(c._asyncTombstones?.get("1")?.status, "discarded", "墓碑（discarded）")
  assert.equal(c._pendingAsyncResults.length, 0, "pending 容器清（中止不注入陈旧结果）")
  assert.equal(injected, 0, "中止不触发注入器")
  assert.ok(c._fullHistory.some((m) => String(m.content).includes("discarded by the user")), "整批提醒入流（§6.20 一次 pushReal）")
  assert.equal(sess1.stopped === true && c._consultSessions.size === 0, true, "会诊会话清理（stopped 标记 + 池清）")
})

test("G3f 退出清场 idle 支：残余逐条直注入（保序 · 清容器）", async () => {
  const c = carrier()
  const e1 = { id: 1, role: "subagent", report: "r1" }
  const e2 = { id: 2, role: "consult", report: "r2" }
  c._pendingAsyncResults.push(e1, e2)
  const seen = []
  await coreSusp.finishSuspension(c, { aborted: false, injectResidual: async (e) => { seen.push(e) } })
  assert.deepEqual(seen.map((e) => e.id), [1, 2], "残余逐条注入（保持序）")
  assert.equal(c._pendingAsyncResults.length, 0, "容器清空")
})

// ═════════════════════ G4 · 循环关键臂（P4 + 核增补 B ∕ E） ═════════════════════

const mkCoreAgent = (over = {}) => Object.assign(
  coreAgentMod.createAgent({
    provider: { name: "harness", model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1/v1" },
    tools: [], config: { agent: {}, traces: { enabled: false } }, cwd: ROOT, memory: null, history: [],
  }),
  over,
)
const enc = new TextEncoder()
const sseBody = (text) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close() } }),
  text: async () => "", json: async () => ({}),
})
const sseOpen = (chunks) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { for (const ch of chunks) c.enqueue(enc.encode(ch)) } }),
  text: async () => "", json: async () => ({}),
})

test("G4a 空响应重试：首轮空 content ⇒ 注入重试提醒 ⇒ 次轮即答（2 fetch · _emptyRetries=1）", async () => {
  const realFetch = globalThis.fetch
  let n = 0
  globalThis.fetch = async () => {
    n += 1
    if (n === 1) return sseBody(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`)
    return sseBody(`data: ${JSON.stringify({ choices: [{ delta: { content: "OK-AFTER-RETRY" } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 1 } })}\n\ndata: [DONE]\n\n`)
  }
  try {
    const agent = mkCoreAgent()
    const content = await coreAgentMod.runAgent(agent, "hi", {}, {})
    assert.equal(content, "OK-AFTER-RETRY", "次轮内容返回")
    assert.equal(n, 2, "恰两次模型调用（空响应重试一次）")
    assert.equal(agent._emptyRetries, 1, "空响应计数 +1")
    assert.ok(agent.history.some((m) => String(m.content).includes("your last response was empty")), "重试提醒入历史")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4b 中断：AbortError 抛出自核 —— 无 `.reason`（回落 signal.reason 判据）+ 中断消息入历史", async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => sseOpen([`data: ${JSON.stringify({ choices: [{ delta: { content: "partial" } }] })}\n\n`])
  try {
    const agent = mkCoreAgent()
    const ctl = new AbortController()
    setTimeout(() => ctl.abort(Object.assign(new Error("x"), { interrupt: true, message: "INT-MSG" })), 60)
    let thrown = null
    try { await coreAgentMod.runAgent(agent, "hi", {}, { signal: ctl.signal }) } catch (e) { thrown = e }
    assert.ok(thrown, "中断 ⇒ 抛出")
    assert.equal(thrown.name, "AbortError", "name = AbortError")
    assert.equal(thrown.reason, undefined, "核抛出物不设 .reason（消费面回落 signal.reason 的判据）")
    assert.deepEqual(thrown.abortInfo, { trigger: "user", layer: "agent", detail: "interrupted-response" }, "abortInfo 标注（interrupted-response 站点）")
    assert.equal(thrown.message, "User interrupted", "message 逐字")
    assert.equal(ctl.signal.reason.message, "INT-MSG", "signal.reason = 中断载荷（回落源）")
    assert.ok(agent.history.some((m) => m.content === "[User interrupt: INT-MSG]"), "中断消息入历史")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4c guard 推回：空响应二上限后抛（MAX_EMPTY_RETRIES=2）· 有内容 ⇒ done + pushReal", () => {
  const mkA = () => ({ history: [], config: { agent: {} }, tasks: [], provider: { model: "m" } })
  {
    const agent = mkA()
    const r1 = coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r1.action, "continue", "第 1 次空 ⇒ continue")
    assert.equal(agent._emptyRetries, 1)
    const r2 = coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r2.action, "continue", "第 2 次空 ⇒ continue")
    assert.throws(() => coreCompletion.handleCompletion(agent, { content: "", toolCalls: [] }, 0, 0, 0, false, 0, {}), /empty response/, "第 3 次空 ⇒ 抛（有界）")
  }
  {
    const agent = mkA()
    const turns = []
    const r = coreCompletion.handleCompletion(agent, { content: "DONE-TEXT", toolCalls: [] }, 0, 0, 0, false, 0, { onTurnEnd: (a, t) => turns.push(t) })
    assert.equal(r.action, "done")
    assert.equal(r.content, "DONE-TEXT")
    assert.equal(agent.history.at(-1).content, "DONE-TEXT", "内容入历史（pushReal 面）")
    assert.deepEqual(turns, [], "干净完成不触 onTurnEnd")
  }
  {
    const agent = Object.assign(mkA(), { _mutatedThisRun: true, tasks: [] })
    agent.config.agent.verifyGuard = true
    const r = coreCompletion.handleCompletion(agent, { content: "C1", toolCalls: [] }, 0, 0, 0, false, 0, {})
    assert.equal(r.action, "continue", "verify guard 推回（改动未验证）")
    assert.ok(agent.history.at(-1).content.includes("you modified files in this run"), "推回提醒逐字锚")
  }
  // guard 快照 ∕ 回填单点（核 helpers —— D-S6 载体）
  const a2 = { _mutatedThisRun: true, _touchedFiles: ["x"], _advisorRound: 2 }
  const snap = coreHelpers.snapshotGuard(a2)
  assert.deepEqual(Object.keys(snap).sort(), [...coreHelpers.INHERITED_GUARD_KEYS].sort(), "快照 7 键")
  a2._mutatedThisRun = false; a2._advisorRound = 0
  coreHelpers.restoreGuard(a2, snap)
  assert.equal(a2._mutatedThisRun, true, "回填恢复（存在键）")
  assert.equal(a2._advisorRound, 2, "回填恢复（数值键）")
})

test("G4d 核增补 B：蒸馏专用 signal（显式 = distillSignal ∕ 缺省 = 运行 signal——零默认变更）", async () => {
  const realFetch = globalThis.fetch
  const toolCallSSE = (id, path) =>
    `data: ${JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id, type: "function", function: { name: "ls", arguments: JSON.stringify({ path }) } }] } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "tool_calls" }] })}\n\ndata: [DONE]\n\n`
  const contentSSE = (content) =>
    `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } })}\n\ndata: [DONE]\n\n`
  const stubRun = async ({ distillSignal }) => {
    const calls = []
    let n = 0
    globalThis.fetch = async (url, init) => {
      n += 1
      calls.push({ n, signal: init?.signal })
      if (n <= 3) return sseBody(toolCallSSE(`call_${n}`, ["thincoder-core", "thincoder-vscode", "thincoder-cli"][n - 1]))
      return sseBody(contentSSE("SUMMARY-HARNESS"))
    }
    const runCtl = new AbortController()
    const agent = mkCoreAgent()
    const content = await coreAgentMod.runAgent(agent, "explore the repo", {}, { signal: runCtl.signal, ...(distillSignal !== undefined ? { distillSignal } : {}) })
    const pending = agent._pendingDistill
    if (pending) await pending
    return { calls, content, agent, runSignal: runCtl.signal }
  }
  try {
    const distillCtl = new AbortController()
    const withSignal = await stubRun({ distillSignal: distillCtl.signal })
    assert.equal(withSignal.calls.length, 5, "3 工具轮 + 1 收尾 + 1 蒸馏轮")
    assert.equal(withSignal.calls[4].signal, distillCtl.signal, "蒸馏轮 fetch signal === distillSignal（运行 signal 分离）")
    assert.equal(withSignal.content, "SUMMARY-HARNESS")
    assert.ok(withSignal.agent.history.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")), "蒸馏摘要入历史（发射面）")

    const noSignal = await stubRun({})
    assert.equal(noSignal.calls.length, 5)
    assert.equal(noSignal.calls[4].signal, noSignal.runSignal, "缺省 ⇒ 回落运行 signal（零默认变更）")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4e 域文本组合：核缺省基座 ∕ opts.turnDomainText 逐字进历史 + VSC 组合点（overlay 收尾括号内）", async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 400, text: async () => "harness", headers: new Headers() })
  try {
    const a1 = mkCoreAgent()
    try { await coreAgentMod.runAgent(a1, "x", {}, { autoTurn: true, turnDomainText: "CUSTOM-DOMAIN-MARKER" }) } catch { /* provider 桩失败——只看推送面 */ }
    assert.ok(a1.history.some((m) => m.content === "CUSTOM-DOMAIN-MARKER"), "turnDomainText 逐字进历史（autoTurn 轮）")
    const a2 = mkCoreAgent()
    try { await coreAgentMod.runAgent(a2, "x", {}, { autoTurn: true }) } catch { /* 同上 */ }
    assert.ok(a2.history.some((m) => m.content === coreHelpers.AUTO_TURN_DIGEST_DOMAIN), "缺省 = 核基座逐字（AUTO_TURN_DIGEST_DOMAIN）")
    // VSC 组合点：overlay 落基座正文之后、闭合 `]` 之前（fail-closed 恒在场）
    const composed = vscTurnDomains.composeTurnDomain(false, false, false)
    assert.ok(composed.endsWith(`${vscTurnDomains.VSC_TURN_OVERLAY}]`), "overlay 收尾括号内拼接")
    assert.notEqual(composed, coreHelpers.AUTO_TURN_DIGEST_DOMAIN, "组合 ≠ 裸基座")
    assert.ok(composed.includes(coreHelpers.AUTO_TURN_DIGEST_DOMAIN.slice(0, -1)), "基座正文逐字在组合串内（端侧零自持副本）")
    assert.equal(vscTurnDomains.composeTurnDomain(true, true, true), vscTurnDomains.composeTurnDomain(true, false, false), "唤醒轮基座与模式无关（判据序）")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("G4f 核增补 E1 ∕ E2：动作谓词采纳（钩子优先）· D5 冻结面 `file_ops` 外门 + 批次档腿判据集不变", async () => {
  const CWD = ROOT
  const makeAgent = (over = {}) => ({
    cwd: CWD, planMode: false, autoApprove: false, _role: null, _engDesignReviewed: false,
    _engTaskAuthorized: false, _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
    config: { agent: { engineering: false } },
    ...over,
  })
  const tool = (name, over = {}) => ({ name, readonly: false, parallel: false, execute: async () => `ok:${name}`, ...over })
  const call = (name, args) => ({ id: `id-${name}`, name, arguments: JSON.stringify(args ?? {}) })
  const run = (agent, name, t, args, opts = {}) =>
    coreDispatch.executeToolCalls(agent, new Map([[name, t]]), [call(name, args)], opts.callbacks ?? {}, opts.depth ?? 0, opts.signal)
  const denied = (r) => (r?.[0]?.denied ? r[0].reason : null)

  const gitTool = tool("git", { isReadonlyAction: (a) => a?.action === "status" || a?.action === "log" })
  assert.ok((await run(makeAgent({ planMode: true }), "git", gitTool, { action: "status" }))[0].ok === true, "E1① planMode：钩子判只读 ⇒ 放行")
  assert.equal(denied(await run(makeAgent({ planMode: true }), "git", gitTool, { action: "commit" })), "plan mode", "E1② 钩子判非只读 ⇒ 拒")
  assert.ok((await run(makeAgent(), "git", gitTool, { action: "log" }, { callbacks: {} }))[0].ok === true, "E1③ 钩子判只读 ⇒ 免审批直行")
  assert.ok((await run(makeAgent({ planMode: true }), "subagent", tool("subagent"), { action: "status" }))[0].ok === true, "E1④ 无钩子 ⇒ 核名面谓词回落（status 只读）")
  assert.equal(denied(await run(makeAgent({ planMode: true }), "subagent", tool("subagent", { isReadonlyAction: () => false }), { action: "status" })), "plan mode", "E1⑤ 钩子在场即权威（false ⇒ 不回落）")
  assert.equal(denied(await run(makeAgent(), "bash", tool("bash"), { command: "echo hi" }, { callbacks: {} })), "no permission handler", "E1⑥ 核内工具零钩子回归（无 handler ⇒ 仍拒）")

  const FROZEN = resolve(CWD, "docs/batches/2026-09-29-other.md")
  const reviewAgent = () => makeAgent({ _asyncAdvisors: new Map([["7", { id: "7", reviewType: "design", status: "running", run: { batchDoc: FROZEN } }]]) })
  assert.equal(denied(await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2① file_ops move dest 命中 ⇒ D5 拒")
  assert.equal(denied(await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "copy", dest: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2② file_ops copy dest 命中 ⇒ D5 拒")
  assert.ok((await run(reviewAgent(), "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "elsewhere/b.txt" }, { callbacks: { onPermissionRequest: async () => true } }))[0].ok === true, "E2③ 未命中 ⇒ 放行（非全拒）")
  assert.equal(denied(await run(reviewAgent(), "write", tool("write"), { path: "docs/batches/2026-09-29-other.md" })), "d5 freeze window", "E2④ FILE_MUTATORS 冻结面回归")
  const own = makeAgent({ _batchDoc: resolve(CWD, "docs/batches/2026-09-29-mine.md") })
  assert.equal(denied(await run(own, "write", tool("write"), { path: "docs/batches/2026-09-29-other.md" }, { depth: 1 })), "cross-batch record write", "E2⑤ 批次档写门回归（判据集不变）")
  assert.notEqual(denied(await run(own, "file_ops", tool("file_ops"), { action: "move", source: "a.txt", dest: "docs/batches/2026-09-29-other.md" }, { depth: 1 })), "cross-batch record write", "E2⑥ file_ops 不入批次档写门（判据集 = FILE_MUTATORS）")
})

// ═════════════════════ G5 · 端装配面（取核装配同一性） ═════════════════════

test("G5a VSC ∕ CLI 挂起驱动 = 核单源装配（动态装载同一绑定 ∕ 语义零变 ∕ 消费面 ⊆）", async () => {
  assert.deepEqual(Object.keys(vscSusp).sort(), ["backgroundStatus", "loadSuspensionCore", "poolLive", "reassertLiveChildren", "suspensionSession"], "VSC 导出面（五名 ∕ W8 修单装载面）")
  const vscSrc = readSrc("thincoder-vscode/src/extension/suspension.mjs")
  assert.ok(vscSrc.includes('import("@thincoder/core/agent/suspension.mjs")'), "VSC 核驱动 = 动态装载（W8 契约②——静态链不入）")
  assert.ok(!/^\s*import[^;]*from\s*"@thincoder\/core\/agent\/suspension\.mjs"/m.test(vscSrc), "VSC 零静态引核驱动")
  assert.deepEqual(defHits(vscSrc, ["startSuspension"]), [], "VSC 档零本地状态机定义")
  const coreMod = await vscSusp.loadSuspensionCore()
  assert.equal(coreMod.startSuspension, coreSusp.startSuspension, "装载产物 startSuspension = 核件同一绑定")
  const fakeCarrier = { _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _pendingAsyncResults: [], _consultSessions: new Map() }
  assert.equal(vscSusp.poolLive(fakeCarrier), coreSusp.poolLive(fakeCarrier), "poolLive 出口语义 = 核（包装形零变）")
  assert.deepEqual(vscSusp.backgroundStatus(fakeCarrier), coreSusp.backgroundCounts(fakeCarrier), "backgroundStatus 语义 = 核")
  // 消费面（VSC 三档）import 名 ⊆ 导出面
  for (const rel of ["thincoder-vscode/src/extension/panel-turn-stages.mjs", "thincoder-vscode/src/extension/panel-callbacks.mjs", "thincoder-vscode/src/extension/panel-messages.mjs"]) {
    const m = readSrc(rel).match(/import\s*\{([^}]*)\}\s*from\s*"\.\/suspension\.mjs"/)
    assert.ok(m, `${rel} import 句可解析`)
    for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) assert.ok(n in vscSusp, `${rel} import { ${n} } ⊆ 导出面`)
  }

  assert.equal(cliSusp.poolLive, cliSuspViaCli.poolLive, "CLI poolLive === 核件（静态转口）")
  for (const n of ["poolCounts", "pendingFamilyCount", "pendingFamiliesNonEmpty", "allPendingEntries", "poolLive", "suspensionSession"]) {
    assert.ok(n in cliSusp, `CLI 导出面含 ${n}`)
  }
  const cliSrc = readSrc("thincoder-cli/src/tui/suspension-drive.mjs")
  assert.ok(cliSrc.includes('import { poolLive, startSuspension } from "@thincoder/core/agent/suspension.mjs"'), "CLI 转口行 = 设计形")
  assert.deepEqual(defHits(cliSrc, ["startSuspension", "poolLive"]), [], "CLI 档零本地状态机 ∕ 驱动定义")
  // CLI 消费面（agent-turn.mjs）import 名 ⊆ 导出面
  const m = readSrc("thincoder-cli/src/tui/agent-turn.mjs").match(/import\s*\{([^}]*)\}\s*from\s*"\.\/suspension-drive\.mjs"/)
  assert.ok(m, "agent-turn import 句可解析")
  for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) assert.ok(n in cliSusp, `agent-turn import { ${n} } ⊆ suspension-drive 导出面`)

  // 端名缝（核 §2.5-F 同笔）：常量初值 = cli；声明缝可切端名（CLI 零声明零变）
  assert.equal(ss.END, "cli", "END 常量 = 初值 cli")
  const prevEnd = ss.sessionEnd()
  ss.setSessionEnd("vscode")
  assert.equal(ss.sessionEnd(), "vscode", "声明缝会话内生效（VSC 端名取用）")
  ss.setSessionEnd(prevEnd)
  assert.ok(readSrc("thincoder-core/agent/setup-reminders.mjs").includes("${sessionEnd()}"), "核 env 行取端名缝（单源）")
})

test("G5b 续跑载体闭证：`ContinueError` 端转口 === 核单类（VSC agent.mjs 转口面）", () => {
  assert.equal(vscAgentMod.ContinueError, coreHelpers.ContinueError, "ContinueError 单类（端转口 = 核 helpers）")
  const err = new coreHelpers.ContinueError(7)
  assert.equal(err.name, "ContinueError")
  assert.equal(err.turn, 7)
  assert.ok(err instanceof Error)
})

// ═════════════════════ G7 · 结构面（跨组收口） ═════════════════════

test("G7 结构机检：批内受影响档行数读数（§2.0 口径）+ 删档缺席 + 悬空 import 零", () => {
  const readings = {
    "thincoder-vscode/src/agent.mjs": 10,
    "thincoder-vscode/src/agent/setup.mjs": 299,
    "thincoder-vscode/src/agent/run-helpers.mjs": 89,
    "thincoder-vscode/src/agent/setup-reminders.mjs": 42,
    "thincoder-vscode/src/agent/tool-table.mjs": 182,
    "thincoder-vscode/src/agent/setup-tooltable.mjs": 103,
    "thincoder-vscode/src/agent/turn-domains.mjs": 38,
    "thincoder-vscode/src/agent/agent-state.mjs": 159,
    "thincoder-vscode/src/agent/rules-face.mjs": 120,
    "thincoder-vscode/src/extension/skills.mjs": 6,
    "thincoder-vscode/src/extension/peer-claims.mjs": 35,
    "thincoder-vscode/src/extension/peer-domains.mjs": 33,
    "thincoder-vscode/src/extension/peer-instances.mjs": 21,
    "thincoder-vscode/src/extension/suspension.mjs": 291,
    "thincoder-vscode/src/extension/panel-turn-loop.mjs": 312,
    "thincoder-vscode/src/extension/panel-turn-stages.mjs": 251,
    "thincoder-vscode/src/extension/panel-chat.mjs": 261,
    "thincoder-vscode/src/extension/image-handler.mjs": 52,
    "thincoder-cli/src/tui/suspension-drive.mjs": 211,
    "thincoder-core/agent/suspension.mjs": 297,
  }
  for (const [rel, expect] of Object.entries(readings)) {
    assert.equal(readSrc(rel).split("\n").length, expect, `${rel} 行数读数 = ${expect}`)
  }
  for (const gone of [
    "thincoder-vscode/src/agent/context-injections.mjs",
    "thincoder-vscode/src/agent/execute-tools.mjs",
    "thincoder-vscode/src/agent/response-stages.mjs",
    "thincoder-vscode/src/agent/run-stages.mjs",
    "thincoder-vscode/src/agent/tool-gates.mjs",
  ]) {
    assert.ok(!existsSync(resolve(ROOT, gone)), `退役档缺席：${gone}`)
  }
})

// ═══════════════ G6 · runTurnLoop host 包装（子进程真件 + 三桩） ═══════════════

test("G6 runTurnLoop：首段装配 ∕ 载体面（14 字段 + history 原位回收）∕ 完成面 ∕ Ctrl+I 与 ContinueError 续跑", () => {
  let out = ""
  try {
    out = execFileSync(process.execPath, [HERE], { env: { ...process.env, B1_LOOP_CHILD: "1" }, encoding: "utf8", timeout: 120000 })
  } catch (e) {
    assert.fail(`G6 子进程退出非零：\n${e.stdout ?? ""}\n${e.stderr ?? ""}`)
  }
  assert.match(out, /RESULT: PASS (\d+) · FAIL 0/, "子进程全绿")
  assert.ok(Number(out.match(/RESULT: PASS (\d+)/)[1]) >= 20, "断言计数 ≥ 20")
})

// ─────────────────────────── 子进程：runTurnLoop host 包装（真件 + 三桩） ───────────────────────────

async function runLoopChild() {
  const encStub = (src) => "data:text/javascript," + encodeURIComponent(src)
  // vscode 桩（P4-II 同形：面板调用链所需键）
  const VSCODE = encStub(`
export const languages = { getDiagnostics: () => [] };
export const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };
export const env = { language: "zh-CN" };
export const workspace = { workspaceFolders: null };
export const window = { showErrorMessage: () => {}, showInformationMessage: () => {}, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, text: "", tooltip: "" }), onDidChangeActiveTextEditor: () => ({ dispose() {} }) };
export const commands = { executeCommand: async () => [], registerCommand: () => ({ dispose() {} }) };
export const Uri = { file: (p) => ({ fsPath: p, toString: () => "file://" + p }) };
export const Position = class Position { constructor(l, c) { this.line = l; this.character = c } };
export const SymbolKind = { Function: 1 };
export const StatusBarAlignment = { Left: 1, Right: 2 };
export const ViewColumn = { One: 1 };
export const ThemeColor = class ThemeColor { constructor(id) { this.id = id } };
export const EventEmitter = class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} };
export const Disposable = { from: () => ({ dispose() {} }) };
export default { languages, DiagnosticSeverity, env, workspace, window, commands, Uri };
`)
  // 核 runAgent 桩（脚本化按次行为；calls 供断言）
  const HELPERS_URL = pathToFileURL(resolve(ROOT, "thincoder-core/agent/helpers.mjs")).href
  const CORE_AGENT = encStub(`
export const calls = [];
let script = [];
export function __setScript(s = []) { script = [...s]; calls.length = 0 }
export function __calls() { return calls }
export async function runAgent(agent, input, callbacks = {}, opts = {}) {
  calls.push({ agent, input, opts: { ...opts } });
  const step = script.shift() ?? { kind: "clean", content: "ok" };
  if (step.kind === "clean") {
    if (step.mutate) step.mutate(agent, callbacks);
    if (step.distill) agent._pendingDistill = Promise.resolve("distilled");
    if (step.inheritedGuard) agent._inheritedGuard = step.inheritedGuard;
    return step.content ?? "ok";
  }
  if (step.kind === "interrupt") { const e = new Error("User interrupted"); e.name = "AbortError"; throw e; }
  if (step.kind === "continue") { const { ContinueError } = await import(${JSON.stringify(HELPERS_URL)}); throw new ContinueError(step.turn ?? 3); }
  throw new Error(step.message ?? "provider boom");
}
`)
  // VSC host 装配桩（hydrateRun ∕ setupAgentRun —— 对齐 §2.3 件 1 逐段对位：载体 + adapter 三键写回）
  const SETUP = encStub(`
export const hydrateCalls = [];
export const setupCalls = [];
let failNext = false;
export function __setFail(v) { failNext = v }
export function __calls() { return { hydrateCalls, setupCalls } }
export function __reset() { hydrateCalls.length = 0; setupCalls.length = 0; failNext = false }
function assemble(agent, ctx) {
  const { input, opts } = ctx;
  agent.history = opts.history;
  agent.cwd = ctx.cwd;
  agent._role = ctx.role ?? null;
  agent.config = { agent: { engineering: false }, traces: { enabled: false } };
  agent._tasks = agent._tasks ?? [];
  agent._goal = agent._goal ?? null;
  agent._planMode = false;
  opts.promptTail = "TAIL-BLOCK";
  opts.turnDomainText = "DOMAIN-TEXT";
  opts.toolDecorate = { marker: "decorate" };
  return { agent, history: opts.history, fullHistory: opts.fullHistory, input };
}
export async function hydrateRun(agent, ctx) {
  hydrateCalls.push({ agent, ctx: { ...ctx, opts: { ...ctx.opts } } });
  if (failNext) throw new Error("hydrate failed (fixture)");
  return assemble(agent, ctx);
}
export async function setupAgentRun(ctx) {
  setupCalls.push({ ctx: { ...ctx, opts: { ...ctx.opts } } });
  if (failNext) throw new Error("hydrate failed (fixture)");
  return assemble({ _tasks: [], _goal: null, _pendingTimers: [] }, ctx);
}
`)
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "vscode") return { url: VSCODE, shortCircuit: true }
      if (specifier === "@thincoder/core/agent.mjs") return { url: CORE_AGENT, shortCircuit: true }
      const r = next(specifier, context)
      if (typeof r?.url === "string" && r.url.endsWith("thincoder-vscode/src/agent/setup.mjs")) return { url: SETUP, shortCircuit: true }
      return r
    },
  })

  const { runTurnLoop } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/src/extension/panel-turn-loop.mjs")).href)
  const { buildPanelCallbacks } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/src/extension/panel-callbacks.mjs")).href)
  const coreStub = await import(CORE_AGENT)
  const { __setScript, __calls } = coreStub
  const setupStub = await import(SETUP)
  const { __calls: __setupCalls, __reset: __setupReset, __setFail } = setupStub

  let pass = 0, fail = 0
  const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log(`  PASS  ${name}`) } else { fail++; console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`) } }
  const eq = (name, a, b) => ok(name, Object.is(a, b), `got=${JSON.stringify(a)} want=${JSON.stringify(b)}`)

  const makePanel = ({ agent = null } = {}) => {
    const posted = [], saved = []
    const panel = {
      _agent: agent, _autoApprove: false, _abortRequested: false, _turnControllers: [],
      _guardCarry: null, _distillState: { pending: null }, _distillController: new AbortController(),
      _questionQueue: [], _questionSeq: 0, _slot: 7, _engShown: false,
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
      _saveLines: (...args) => saved.push(args),
      _pushSessions: () => { panel._pushed = (panel._pushed ?? 0) + 1 },
      _refreshStatus: () => {}, _setStatus: () => {}, _setPlanMode: async () => {},
      _pushSettingsLight: () => { panel._settingsLight = (panel._settingsLight ?? 0) + 1 },
      _publishTurnState: () => {}, _notifier: { turnDone: () => { panel._turnDone = (panel._turnDone ?? 0) + 1 } },
    }
    panel._abortController = new AbortController()
    return { panel, posted, saved }
  }
  const deps = (panel, over = {}) => {
    const history = over.history ?? []
    const fullHistory = over.fullHistory ?? []
    const p = { baseURL: "https://api.example.test/v1", model: "m-1" }
    const d = {
      text: "hello", cwd: ROOT, p, images: null, history, fullHistory,
      autoTurn: false, upstreamTurn: false, susp: null, timerTurn: false,
      turnSlot: 7, tLog: {}, askInPanel: async () => "Stop", slotStamp: { activeProvider: "x", activeModel: "m-1" },
      ...over,
    }
    d.callbacks = buildPanelCallbacks(panel, {
      cwd: d.cwd, p, fullHistory, history, providerName: "x", turnSlot: 7, distillSlot: 7,
      autoTurn: d.autoTurn, askInPanel: d.askInPanel, slotStamp: d.slotStamp,
    })
    return d
  }

  // ── C1：首段装配 ∕ 载体面（14 字段 + history 原位回收）∕ 完成面 ──
  {
    __setupReset()
    __setScript([{
      kind: "clean", content: "ASSISTANT-TEXT", distill: true,
      mutate: (agent, cb) => {
        agent.tasks = [{ status: "done", title: "t1" }]
        agent.planMode = true
        cb.onTurnEnd?.(agent, 0)
        agent.history = [{ role: "user", content: "v2" }] // 压缩 ∕ 蒸馏替换点形（`agent.history = <新数组>`）
      },
    }])
    const { panel, posted, saved } = makePanel({ agent: { _tasks: [], _goal: null } })
    panel._guardCarry = { mutated: true }
    const d = deps(panel)
    await runTurnLoop(panel, d)
    const calls = __calls()
    const { hydrateCalls, setupCalls } = __setupCalls()
    const core = calls[0]
    eq("hydrateRun 恰好 1 次（复用路径 ∕ 装配不重入）", hydrateCalls.length, 1)
    eq("setupAgentRun 未调用", setupCalls.length, 0)
    eq("核 runAgent 恰好 1 次", calls.length, 1)
    eq("coreOpts.resume（首段）", core.opts.resume, false)
    eq("coreOpts.suspDriven", core.opts.suspDriven, true)
    ok("coreOpts.signal = 回合 controller signal", core.opts.signal === panel._abortController.signal)
    eq("A2 promptTail（装配写回）", core.opts.promptTail, "TAIL-BLOCK")
    eq("A3 turnDomainText（装配写回）", core.opts.turnDomainText, "DOMAIN-TEXT")
    ok("裁定① toolDecorate（装配写回）", core.opts.toolDecorate?.marker === "decorate")
    eq("B distillSignal = 面板 controller signal", core.opts.distillSignal, panel._distillController.signal)
    ok("consumeQueuedInput = 函数（用户回合）", typeof core.opts.consumeQueuedInput === "function")
    // 载体面：14 字段别名 + 容器建齐 + history 访问器原位回收（压缩后共享数组回收）
    const a = core.agent
    ok("agent.history === history（访问器锚）", a.history === d.history)
    ok("载体字段别名（_asyncSubagents ⇄ history）", a._asyncSubagents === d.history._asyncSubagents && a._asyncSubagents instanceof Map)
    ok("六容器建齐", Array.isArray(d.history._pendingAsyncResults) && Array.isArray(d.history._asyncWaiters) && Array.isArray(d.history._mutLog) && d.history._advisorRuns instanceof Map)
    a._asyncSubagents.set("x", 1)
    eq("载体写两向同步（history 读）", d.history._asyncSubagents.get("x"), 1)
    const before = d.history
    a.history = [{ role: "user", content: "v2" }]
    ok("history setter 原位回收（同一数组——跨替换稳定）", a.history === before && before.length === 1 && before[0].content === "v2")
    ok("agent._inheritedGuard = 面板 carry 快照（一次性取走）", a._inheritedGuard?.mutated === true && panel._guardCarry === null)
    // 完成面（真 onComplete）
    ok("onComplete 触发（webview complete 帧）", posted.some((m) => m.type === "complete"))
    ok("onComplete 槽回写（saveLines 携 agentState）", saved.length >= 1 && saved[0][2].tasks?.[0]?.title === "t1")
    eq("onComplete pushSessions", panel._pushed, 1)
    eq("onComplete 非 digest ⇒ turnDone 通知", panel._turnDone, 1)
    // 推送腿（onTurnEnd）
    ok("task 腿回填（_tasks）", a._tasks === a.tasks)
    ok("plan 腿回填 + 帧上屏", a._planMode === true && posted.some((m) => m.type === "planMode" && m.active === true))
    ok("蒸馏载具回填（panel._distillState.pending）", panel._distillState.pending === a._pendingDistill)
    ok("panel._agent write-back", panel._agent === a)
  }

  // ── C2：Ctrl+I 中断续跑（核抛出物无 .reason ⇒ 回落 controller signal.reason） ──
  {
    __setupReset()
    const { panel } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel)
    __setScript([{ kind: "interrupt" }, { kind: "clean", content: "AFTER-INTERRUPT" }])
    panel._abortController.abort({ interrupt: true, message: "please stop that" })
    await runTurnLoop(panel, d)
    const calls = __calls()
    eq("中断后重入（2 次核调用）", calls.length, 2)
    eq("续段 resume=true", calls[1].opts.resume, true)
    ok("controller 已重建（新 signal）", calls[1].opts.signal !== calls[0].opts.signal)
    eq("装配不重入（hydrateRun 仍 1 次）", __setupCalls().hydrateCalls.length, 1)
    eq("续跑成功（tLog 不落 stopped）", d.tLog.result, undefined)
  }

  // ── C3：ContinueError 用户档 —— Continue ⇒ 续跑；Stop ⇒ 收束 ──
  {
    __setupReset()
    let asked = 0
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel, { askInPanel: async () => { asked++; return "Continue" } })
    __setScript([{ kind: "continue", turn: 9 }, { kind: "clean", content: "SEG-2" }])
    await runTurnLoop(panel, d)
    eq("询问 1 次", asked, 1)
    eq("Continue ⇒ 续跑（2 次调用）", __calls().length, 2)
    ok("未发 aborted 帧", !posted.some((m) => m.type === "aborted"))
  }
  {
    __setupReset()
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel, { askInPanel: async () => "Stop" })
    __setScript([{ kind: "continue", turn: 9 }])
    await runTurnLoop(panel, d)
    eq("Stop ⇒ 单次调用", __calls().length, 1)
    ok("aborted 帧", posted.some((m) => m.type === "aborted"))
    eq("tLog.result = stopped", d.tLog.result, "stopped")
  }

  // ── C4：Stop（无 reason）⇒ 不续跑 ──
  {
    __setupReset()
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel)
    __setScript([{ kind: "interrupt" }])
    panel._abortController.abort()
    await runTurnLoop(panel, d)
    eq("Stop（无 reason）⇒ 不续跑（1 次调用）", __calls().length, 1)
    ok("aborted 帧", posted.some((m) => m.type === "aborted"))
  }

  console.log(`\nRESULT: PASS ${pass} · FAIL ${fail}`)
  process.exit(fail ? 1 : 0)
}
