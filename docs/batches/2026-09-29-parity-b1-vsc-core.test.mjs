/**
 * 2026-09-29-parity-b1-vsc-core.test.mjs — 批次本地单元件（parity-b1 · VSC+CLI 收口核 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs
 * （本刻暂存 `.thincoder/tmp/` 同名件；导入按 `process.cwd()`（仓库根）解析 ⇒ tmp ∕ 终位两处可跑。）
 *
 * 覆盖 = 批档 §2.7 判据 1 对拍族 + §2.6 测试行（核增补 B ∕ C ∕ D ∕ E 四用例同档承载）：
 *   G1 skills 转口（P1：同一绑定 ∕ 行为 ∕ 转口档零本地实现 ∕ 消费面保形）；
 *   G2 peers 三面（P2：三档同一绑定 ∕ AC-IC11 逐字锚（认领行 ∕ 足迹行）∕ 落盘回环 ∕ ④ 面保留 ∕ 端侧零第二份字面）；
 *   G5 端装配面（VSC ∕ CLI 取核装配同一性 + 核增补 E1 ∕ E2 dispatch 门禁）；
 *   （G3 ∕ G4 ∕ G6 ∕ G7 已拆出——`…-vsc-core-susp.test.mjs` ∥ `…-vsc-core-loop.test.mjs` ∥ `…-vsc-core-host.test.mjs`；#788 拆分计划 §2.11 · 先拆后改。）
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


const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const canon = (rel) => realpathSync(resolve(ROOT, rel)).toLowerCase()

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
const vscSkills = await mod("thincoder-vscode/src/extension/skills.mjs")
const skillsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/skills.mjs")

const vscClaims = await mod("thincoder-vscode/src/extension/peer-claims.mjs")
const vscDomains = await mod("thincoder-vscode/src/extension/peer-domains.mjs")
const vscInstances = await mod("thincoder-vscode/src/extension/peer-instances.mjs")
const claimsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-claims.mjs")
const domainsViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-domains.mjs")
const instancesViaVsc = await mod("thincoder-vscode/node_modules/@thincoder/core/peer-instances.mjs")
const ss = await mod("thincoder-vscode/node_modules/@thincoder/core/session-slots.mjs")

const coreSusp = await mod("thincoder-vscode/node_modules/@thincoder/core/agent/suspension.mjs") // #788：与 `loadSuspensionCore()` 装载径同源（vsc junction——小写拼写下直路 = 第二实例）
const coreHelpers = await mod("thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs")
const vscAgentMod = await mod("thincoder-vscode/src/agent.mjs")
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
