/**
 * setup-reminders.test.mjs — SESSION.md §6.11（2026-09-08——F1 env-state slot 字段 +
 * F2 resumed 按会话跟踪 + N6 注入句解耦）VSC 端单测（双端镜像：CLI 仓同文件名的同套
 * 用例——模板同构、载体异名：VSC = agent 级 _resumedPending + 模块级 restartDetectionDone
 * 闸保留——评审 #7 对齐）。
 *
 * 覆盖（§6.11 测试段）：
 *  - envStateLine 模板：slot 字段存在/位置（model 后 resumed 前）/null 降级/resumed yes-no；
 *  - hydrateRun 恢复事件（_resumedPending agent 级载体——评审 #7 点名）：restore:true
 *    factory 路径（setupAgentRun 同款）+ fullHistory 载入非空 → 首 run resumed:yes 一次、
 *    次 run（同绑定复用）false；换槽销毁重建（新 factory agent）→ 再 true；
 *    depth>0 / resume / autoTurn → false；
 *  - slot 注入：engPersist.slot 透传进 env 行；无绑定（直连/非面板顶层 run）→ slot: null；
 *  - 注入句解耦（N6/AC4）：process restarted 句 = 模块级闸（进程内首个恢复回合发一次）——
 *    同进程换槽重建只发 resumed:yes、句不再发（闸已关）；全新会话首回合不发句不误报。
 *  - GIT-ASYNC L21（2026-09-09）：composeGitContext 三形态单测（AC-4 字节 parity——
 *    detached/dirty>20 截断/clean——纯函数不需真 git）+ collectGitContext 失败冷却单测
 *    （AC-3 必做锁——非 git 目录 ms 级真失败 → catch 记 ts → 30s 内二次调用跳过——不触发
 *    真 5s 超时；Map 预填 ts 正向锁 skip 路径 + >30s 旧条目访问时惰性清）。
 * 归册（2026-09-12 收尾轮 9）：collectGitContext ×2 走真 git 子进程——slow() 门控
 * （快层 skip、test:full 照跑）。
 */
import { test, beforeEach, afterEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { envStateLine, pushEnvStateReminder, pushInjections, AUTO_REMINDER, _resetRestartDetectionForTests, composeGitContext, collectGitContext, _gitFailureCooldownForTests, _clearGitFailureCooldownForTests } from "../src/agent/setup-reminders.mjs"
import * as setupReminders from "../src/agent/setup-reminders.mjs"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"

let sessionsDir
let cwd

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "setup-rem-"))
  cwd = join(sessionsDir, "project")
  // M1-manifest 钩子前置：hydrateRun 缺档初始化写 cwd 根 PROJECT-MANIFEST.json——
  // manifest 模块不建目录（设计 §1.4），夹具需先建 cwd 目录。
  mkdirSync(cwd, { recursive: true })
  mkdirSync(join(cwd, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
  // git 隔离：预填失败冷却（评审 #2 正向锁 seam）——hydrateRun 的 git 注入零 spawn。
  // 本档用例面 = 恢复事件/注入句，非 git；真 git 行为由下方 slow() 冷却用例锁。
  _gitFailureCooldownForTests(cwd, Date.now())
  _setSessionsDirForTest(sessionsDir)
  // 模块级重启闸每用例复位——进程内首回合语义逐用例独立（生产从不调用——测试专用 seam）
  _resetRestartDetectionForTests()
})
afterEach(async () => {
  _resetSessionsDirForTest()
  _clearGitFailureCooldownForTests(cwd) // 清理 Map 条目（每用例 cwd 独立）
  // rmGitCwdDir 保留作 Windows 句柄滞后兑底（manifest 写 + AV 扫描窗口）；
  // git 已零 spawn（预填冷却）——EPERM 主源已除。
  await rmGitCwdDir(sessionsDir)
})

const envOf = (hist) => {
  for (let i = hist.length - 1; i >= 0; i--) {
    const c = hist[i]?.content
    if (typeof c === "string" && c.startsWith("[System reminder: env: vscode,")) return c
  }
  return null
}

const restartCount = (hist) => hist.filter((m) =>
  typeof m.content === "string" && m.content.startsWith("[System reminder: process restarted at ")
).length

/** Windows 实测：git 子进程退出后其 cwd 目录句柄释放滞后 close 事件 ~300ms——rmSync 偶发
 *  EPERM（rmSync maxRetries 不覆盖此窗）——短重试兜底（GIT-ASYNC 冷却测试 + 本档 afterEach 共用）。 */
async function rmGitCwdDir(dir) {
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return
    } catch {
      if (attempt >= 10) throw new Error(`rmGitCwdDir: dir still locked after retries: ${dir}`)
      await new Promise((r) => setTimeout(r, 250))
    }
  }
}

const hist = [{ role: "user", content: "u1" }]
const provider = { model: "deepseek-v4-pro" }

/** hydrateRun 调用参数装配（镜像 agent-lifecycle-singleton.test.mjs 的 optsFor 形态）。
 *  缺省 restore:true——工厂路径（setupAgentRun/首轮/destroy 重建）；复用续跑显式
 *  restore:false（顶层 opts 缺省同义——见 agent.mjs hydrate 分支）。 */
const optsFor = (optsOver = {}, topOver = {}) => ({
  provider,
  cwd,
  input: "hi",
  opts: { fullHistory: hist, engPersist: { cwd, slot: 1 }, ...optsOver },
  depth: 0,
  role: null,
  getAuto: () => false,
  restore: true,
  ...topOver,
})

// ─── envStateLine 模板（§6.11 测试段——slot 字段存在/位置/null 降级/resumed yes-no）───

test("envStateLine: slot 字段存在且位置在 model 后 resumed 前（双端同构模板——END=vscode）", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: false }),
    "[System reminder: env: vscode, mode: normal, model: m1, slot: 3, resumed: no.]",
  )
  assert.equal(
    envStateLine({ mode: "eng", model: "m1", slot: 3, resumed: true }),
    "[System reminder: env: vscode, mode: eng, model: m1, slot: 3, resumed: yes.]",
  )
  const line = envStateLine({ mode: "normal", model: "m1", slot: 3, resumed: true })
  assert.ok(line.indexOf("model: m1") < line.indexOf("slot: 3"), "slot after model")
  assert.ok(line.indexOf("slot: 3") < line.indexOf("resumed: yes"), "slot before resumed")
})

test("envStateLine/push: slot 无绑定 → 显式 slot: null（N3）；model 缺失 → unknown 降级", () => {
  assert.equal(
    envStateLine({ mode: "normal", model: "m1", slot: null, resumed: false }),
    "[System reminder: env: vscode, mode: normal, model: m1, slot: null, resumed: no.]",
  )
  const h = []
  pushEnvStateReminder(h, { engineering: false, provider: {}, slot: null, resumed: false })
  assert.equal(h.length, 1)
  assert.match(h[0].content, /slot: null,/)
  assert.match(h[0].content, /model: unknown/)
  assert.match(h[0].content, /resumed: no\./)
})

// ─── hydrateRun 恢复事件（_resumedPending agent 级载体——评审 #7）───

test("hydrateRun: restore:true 工厂路径 + 历史非空 → 首 run resumed:yes 一次；复用路径不武装 → no", async () => {
  // 首轮（extension host 重启 / destroy 后重建同路径）：factory 新建 + restore:true
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./, "每次会话恢复首回合 resumed:yes（AC2）")
  assert.equal(r1.agent._resumedPending, false, "消费即清——后续回合 no")
  // 同绑定复用（restore=false——面板连续多回合同一对象）：不重新武装 → 恒 no
  const r2 = await hydrateRun(r1.agent, optsFor({}, { restore: false }))
  assert.equal(r2.agent, r1.agent)
  assert.match(envOf(r2.history), /resumed: no\./, "复用路径不武装（评审 #7——同绑定只一次）")
})

test("hydrateRun: 换槽销毁重建 → resumed 随绑定新生（再 true）；空历史新建不武装", async () => {
  const slotB = [{ role: "user", content: "slot-b-content" }]
  const slotC = [{ role: "user", content: "slot-c-content" }]
  // 槽 A 首轮恢复
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./)
  // 换槽 B → panel._agent = null（ensurePanelAgent）→ 回合 factory 新建（restore:true）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: slotB, engPersist: { cwd, slot: 2 } }))
  assert.notEqual(r2.agent, r1.agent, "换槽销毁重建——新 agent 对象")
  assert.match(envOf(r2.history), /resumed: yes\./, "每次槽恢复进新 agent 天然得一次 resumed:yes")
  // 再换槽 C → 再 true（F2——每次会话恢复的首个回合一次）
  const r3 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: slotC, engPersist: { cwd, slot: 3 } }))
  assert.match(envOf(r3.history), /resumed: yes\./)
  // 全新空历史（新会话首轮）：factory 新建但 fullHistory 空 → 不武装
  const r4 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [], engPersist: { cwd, slot: 4 } }))
  assert.match(envOf(r4.history), /resumed: no\./, "载入历史非空才武装（N5 判据）")
})

test("hydrateRun: depth>0 / resume / autoTurn 回合 → 不武装不注入（resumed 恒 false）", async () => {
  // depth>0（子代理——setupAgentRun 工厂路径但 fullHistory 恒空）：无 env 注入、不武装
  const child = await hydrateRun(buildTopLevelAgent(), { ...optsFor({}, {}), depth: 1, role: "explore", opts: {} })
  assert.equal(envOf(child.history), null, "env-state 仅 depth-0（N4 守卫）")
  assert.equal(child.agent._resumedPending, undefined, "depth>0 不武装")
  // 顶层续跑形态（interrupt-continuation resume / digest autoTurn——复用同 agent）：
  // 恢复已在首轮消费——resume/autoTurn 回合不重新武装 → resumed:no
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.match(envOf(r1.history), /resumed: yes\./)
  const r2 = await hydrateRun(r1.agent, optsFor({ resume: true }, { restore: false }))
  assert.match(envOf(r2.history), /resumed: no\./, "resume（续跑）回合 no——不重复武装")
  const r3 = await hydrateRun(r1.agent, optsFor({ autoTurn: true }, { restore: false }))
  assert.match(envOf(r3.history), /resumed: no\./, "autoTurn（digest）回合 no")
})

// ─── slot 注入（F1——engPersist.slot 透传；无绑定显式 null）───

test("hydrateRun: env 行 slot 透传 engPersist.slot；无绑定（直连）→ slot: null", async () => {
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor({ engPersist: { cwd, slot: 5 } }))
  assert.match(envOf(r1.history), /slot: 5,/)
  // 直连/非面板顶层 run（无 engPersist 绑定）→ slot: null（不读 manifest active——N3）
  const r2 = await hydrateRun(buildTopLevelAgent(), { ...optsFor(), opts: { fullHistory: hist } })
  assert.match(envOf(r2.history), /slot: null,/)
})

// ─── 装配钩子模式门（#30——本批）：normal 零 manifest I/O + 翻转清陈旧 ───

test("hydrateRun: normal 模式（engState 钉 false）零 manifest I/O——不建档 + 清残留附着", async () => {
  const manifestPath = join(cwd, "PROJECT-MANIFEST.json")
  // ① normal（模式显式钉死——不得依赖本机 config.json agent.engineering；三级优先见 agent-state.mjs:88-91）
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor({ engState: { enabled: false } }))
  assert.equal(r1.agent.manifest, null, "普通会话不附着（agent.manifest === null）")
  assert.equal(existsSync(manifestPath), false, "不建档（装配钩子零 manifest I/O）")
  // ② 工程模式（同 fixture：仓内 + 缺档 → 建档 + 附着——门开面不回归）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({ engState: { enabled: true } }))
  assert.ok(r2.agent.manifest, "工程模式：附着（KD-M1-12 四态同今日）")
  const bytes = readFileSync(manifestPath, "utf8")
  // ③ 翻转回普通（复用 agent）：清残留附着 + 零写（档未被改）
  const r3 = await hydrateRun(r2.agent, optsFor({ engState: { enabled: false } }, { restore: false }))
  assert.equal(r3.agent.manifest, null, "翻转清陈旧（清残留附着——KD-M1-12）")
  assert.equal(readFileSync(manifestPath, "utf8"), bytes, "普通回合零写（档未被改）")
})

// ─── 注入句解耦（N6/AC4——模块级闸保留为 process restarted 句专用）───

test("hydrateRun: 模块闸——进程内首个恢复回合发 process restarted 句一次；换槽重建只发 resumed:yes 无句", async () => {
  // 启动恢复（extension host 重启 + 面板恢复有历史槽）：句 + resumed:yes
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.equal(restartCount(r1.history), 1, "启动恢复发句一次")
  assert.match(envOf(r1.history), /resumed: yes\./)
  // 同进程换槽重建（新 factory agent——真机里即 loadSession 切走再切回）：模块闸已关——
  // 句不再发（N6——切槽不误报进程重启）；resumed:yes 照发（会话级信号与进程级闸独立）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [{ role: "user", content: "switched" }], engPersist: { cwd, slot: 2 } }))
  assert.equal(restartCount(r2.history), 0, "切槽不发 process restarted 句（AC4）")
  assert.match(envOf(r2.history), /resumed: yes\./)
  // 进程内多次切槽：句仍不再发
  const r3 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [{ role: "user", content: "switched-again" }], engPersist: { cwd, slot: 3 } }))
  assert.equal(restartCount(r3.history), 0, "进程内多次切槽句不再发")
  assert.match(envOf(r3.history), /resumed: yes\./)
})

test("hydrateRun: 全新会话（空历史）首回合——无句、闸随即关闭、后续回合恒 no 不误报", async () => {
  // 全新会话首回合：fullHistory 空 → 句不发 + 检测关闸（进程内不再判）
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor({ fullHistory: [] }))
  assert.equal(restartCount(r1.history), 0)
  assert.match(envOf(r1.history), /resumed: no\./)
  // 后续回合（history 已非空）——闸已关 + 无武装 → 恒 no 不误报
  const r2 = await hydrateRun(r1.agent, optsFor({}, { restore: false }))
  assert.equal(restartCount(r2.history), 0)
  assert.match(envOf(r2.history), /resumed: no\./)
})

// ─── GIT-ASYNC L21：composeGitContext 三形态（AC-4 字节 parity 锁——纯函数不需真 git）───

test("composeGitContext: 富形态——branch + commits + uncommitted（逐字节 parity——现拼装保留）", () => {
  assert.equal(
    composeGitContext({ branch: "main", log: "abc123 first commit\ndef456 second", status: " M src/x.mjs\n?? new.mjs" }),
    "Git context: on branch `main`, 2 uncommitted change(s).\n" +
      "Recent commits:\nabc123 first commit\ndef456 second\n" +
      "Uncommitted:\n M src/x.mjs\n?? new.mjs",
  )
})

test("composeGitContext: detached（branch 空 → (detached)）+ dirty>20 截断（头 20 + 省略注差）", () => {
  const lines = Array.from({ length: 25 }, (_, i) => ` M f${String(i).padStart(2, "0")}.mjs`)
  assert.equal(
    composeGitContext({ branch: "", log: "only one", status: lines.join("\n") }),
    "Git context: on branch `(detached)`, 25 uncommitted change(s).\n" +
      "Recent commits:\nonly one\n" +
      "Uncommitted:\n" + lines.slice(0, 20).join("\n") + "\n… (5 more)",
  )
})

test("composeGitContext: clean 形态（空 status/log——等价 git 无输出）+ log-only 变体", () => {
  assert.equal(
    composeGitContext({ branch: "main", log: "", status: "" }),
    "Git context: on branch `main`, working tree clean.",
  )
  assert.equal(
    composeGitContext({ branch: "main", log: "abc one", status: "" }),
    "Git context: on branch `main`, working tree clean.\nRecent commits:\nabc one",
  )
})

// ─── GIT-ASYNC L21：失败冷却（AC-3 必做锁——确定性 seam = 非 git 目录 ms 级快失败 +
//      Map 预填正向锁——评审 #3：真 git 5s 超时永不触发）───

slow("collectGitContext: 非 git 目录真失败 → all-or-nothing '' + 记冷却 ts + 30s 内二次调用跳过", async () => {
  const dir = mkdtempSync(join(tmpdir(), "gitctx-fail-"))
  try {
    assert.equal(await collectGitContext(dir), "", "非 git 仓——git ms 级失败 → ''（AC-2 同路径）")
    const ts = _gitFailureCooldownForTests(dir)
    assert.ok(typeof ts === "number" && Date.now() - ts < 2000, "catch 已记冷却 ts（Map 读回）")
    assert.equal(await collectGitContext(dir), "", "冷却期内（<30s）二次调用直接跳过 → ''")
  } finally {
    _clearGitFailureCooldownForTests(dir) // 清理 Map 条目
    await rmGitCwdDir(dir) // Windows: git 子进程 cwd 句柄释放滞后 → EPERM 短重试
  }
})

slow("collectGitContext: Map 预填——健康 git 仓也跳过；>30s 旧条目访问时惰性清后恢复收集（评审 #2）", async () => {
  // 探针 = 本仓根（test 文件上级——健康 git 仓：无冷却时 collect 必非空——compose 首行恒非空）
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
  try {
    _gitFailureCooldownForTests(repoRoot, Date.now())
    assert.equal(await collectGitContext(repoRoot), "", "预填 ts=now → 冷却期内跳过（健康仓也跳过——正向锁 skip 路径）")
    _gitFailureCooldownForTests(repoRoot, Date.now() - (30_000 + 1000))
    const out = await collectGitContext(repoRoot)
    assert.notEqual(out, "", ">30s 旧条目 → 访问时惰性清 → 恢复收集（健康仓输出非空）")
    assert.equal(_gitFailureCooldownForTests(repoRoot), undefined, "惰性清后条目已删")
  } finally {
    _clearGitFailureCooldownForTests(repoRoot)
  }
})

// ─── VSC-CONTEXT-PARITY D-CI5/D-CI6（「AUTO 位置 / 无 permission / 去重」）───

test("hydrateRun: permission 句退役（D-CI6）+ AUTO 不由 hydrate 推送（唯一 = 循环头）", async () => {
  // permission 句 = 删除（裁定 1：权威源 CLI——CLI 无此句；注释「parity」失真随删）
  const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
  assert.ok(!r1.history.some((m) => typeof m.content === "string" && m.content.includes("Permission mode")), "permission 句零注入")
  assert.ok(!("pushModeReminders" in setupReminders), "pushModeReminders 退役（无导出）")
  // AUTO 推送唯一 = agent.mjs 循环头检查（语义 = getAuto() && !history.some(AUTO_REMINDER)）——
  // hydrate 不再承担（推送位 = hydrate 全部注入之后——cli setup.mjs:351 尾位同构）
  const r2 = await hydrateRun(buildTopLevelAgent(), optsFor({}, { getAuto: () => true }))
  assert.ok(!r2.history.some((m) => m.content === AUTO_REMINDER), "hydrate 不推 AUTO（唯一 = 循环头）")
})

test("pushInjections: 同文去重（D-CI5——幂等注入；异文照投、transient 保持）", () => {
  const h = []
  pushInjections(h, { content: "[Current file: a]" })
  pushInjections(h, { content: "[Current file: a]" })
  assert.equal(h.length, 1, "同文二次投递零新增")
  pushInjections(h, { content: "[Current file: b]" })
  assert.equal(h.length, 2, "异文照投")
  assert.equal(h[0].transient, true, "transient 保持")
})

