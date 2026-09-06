/**
 * crash-report.test.mjs — R25（docs/design/ARCHITECTURE.md §R25）bin 入口系测试。
 *
 * 覆盖 T-R25a.1/a.2/b.1/c.1/c.2。子进程类按 slow 门归册（设计评审 #3——防超阈硬红——
 * 测试纪律）：a.1/a.2/b.1 为设计点名归册；c.1/c.2 同为 bin 子进程（chat 启动实测 ~550ms +
 * suite 并行膨胀 >800ms 拦截线风险）——同纪律归册。全部测试隔离 HOME（os.homedir 读
 * USERPROFILE/HOME——session.test 同惯例）——不碰真实 ~/.thincoder。
 *
 * env 门（生产零路径——T-R25a.1/a.2 设计测试缝）：
 *   THINCODER_TEST_CRASH=1          入口抛未捕获异常走完整崩溃序列
 *   THINCODER_TEST_TUI_ACTIVE=1     模拟 TUI 活动态（同一 setter——测试缝同源）
 *   THINCODER_TEST_CLEANUP_OUT=<f>  mock writeCleanupSequence：恢复序列写入文件
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { slow } from "./slow.mjs"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const BIN = join(projectRoot, "bin", "thincoder.mjs")
const DEEPSEEK = { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x" }

/** 隔离 HOME（fakeHome 子进程跑 bin/入口——不碰真实 ~/.thincoder）：
 *  config.json 带无效 activeProvider（ghost）——chat 启动快速退出（provider 错误面） */
function fakeHome() {
  const home = mkdtempSync(join(tmpdir(), "thincoder-crash-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"),
    JSON.stringify({ providers: [{ ...DEEPSEEK }], activeProvider: "ghost" }))
  return home
}

function crashDirOf(home) {
  return join(home, ".thincoder", "crash-reports")
}

/** 跑 bin 子进程（隔离 HOME）——返回 { status, stdout, stderr } */
function runBin(args, home, extraEnv = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    cwd: home,
    env: { ...process.env, USERPROFILE: home, HOME: home, ...extraEnv },
    encoding: "utf8",
    timeout: 60_000,
  })
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" }
}

function listRecords(home) {
  const dir = crashDirOf(home)
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((n) => /^crash-.*\.json$/.test(n) || /^report\..*\.json$/.test(n))
}

// ====================================================================
// T-R25a.1 — uncaught 落盘（F-R25a）
// ====================================================================

slow("T-R25a.1 uncaught 落盘：THINCODER_TEST_CRASH=1 子进程 → crash-*.json 在（堆栈/内存/argv/cwd）——exit 非 0——stdout 零 ANSI", () => {
  const home = fakeHome()
  try {
    const r = runBin([], home, { THINCODER_TEST_CRASH: "1" })
    assert.equal(r.status, 1, "exit 非 0（1）")
    const dir = crashDirOf(home)
    const files = readdirSync(dir).filter((n) => /^crash-.*\.json$/.test(n))
    assert.equal(files.length, 1, `恰一份 crash 记录（实际: ${files.join(",") || "(无)"}）`)
    const rec = JSON.parse(readFileSync(join(dir, files[0]), "utf8"))
    assert.equal(rec.type, "uncaughtException", "类型")
    assert.match(rec.message, /R25 test crash/, "错误消息")
    assert.ok(typeof rec.stack === "string" && rec.stack.includes("thincoder.mjs"), "含堆栈")
    assert.ok(rec.memoryUsage && typeof rec.memoryUsage.heapUsed === "number", "含内存")
    assert.ok(Array.isArray(rec.argv) && rec.argv.includes(BIN), "含 argv")
    assert.equal(rec.cwd, home, "含 cwd")
    assert.ok(typeof rec.time === "string" && !Number.isNaN(Date.parse(rec.time)), "含时间")
    assert.ok(typeof rec.uptime === "number" && typeof rec.node === "string", "含 uptime/node+版本")
    assert.ok(!r.stdout.includes("\x1b"), "非 TUI 模式 stdout 管道零 ANSI（误判即污染输出）")
    assert.match(r.stderr, /\[error\] R25 test crash/, "console.error 行保留（非 TUI 模式可见）")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-R25a.2 — TUI 恢复（F-R25a ②）
// ====================================================================

slow("T-R25a.2 TUI 恢复：活动态 mock（env 门注入）→ 恢复序列被调（观察文件收 writeCleanupSequence）——stdout 零 ANSI", () => {
  const home = fakeHome()
  const outFile = join(home, "cleanup-out.txt")
  try {
    const r = runBin([], home, {
      THINCODER_TEST_CRASH: "1",
      THINCODER_TEST_TUI_ACTIVE: "1",
      THINCODER_TEST_CLEANUP_OUT: outFile,
    })
    assert.equal(r.status, 1, "exit 非 0（1）")
    assert.ok(existsSync(outFile), "恢复序列被调（mock writeCleanupSequence 写入观察文件）")
    const out = readFileSync(outFile, "utf8")
    assert.ok(out.includes("\x1b[?1049l"), "含 terminal reset 序列（mainBuffer——退出 alt buffer）")
    assert.ok(out.includes("\x1b[0m"), "含 reset")
    assert.ok(!r.stdout.includes("\x1b"), "恢复序列被重定向——stdout 管道零 ANSI（无画面残留）")
    assert.equal(listRecords(home).length, 1, "crash 记录照写（恢复不阻断后续步）")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-R25b.1 — fatal report（F-R25b）
// ====================================================================

slow("T-R25b.1 fatal report：小堆 OOM 子进程（r25-oom 夹具——真实 prepareCrashReporting）→ report.*.json 在 crash-reports/", () => {
  const home = fakeHome()
  try {
    const fixture = join(projectRoot, "test", "fixtures", "r25-oom.mjs")
    const r = spawnSync(process.execPath, ["--max-old-space-size=64", fixture], {
      cwd: home,
      env: { ...process.env, USERPROFILE: home, HOME: home },
      encoding: "utf8",
      timeout: 60_000,
    })
    assert.notEqual(r.status, 0, "OOM 子进程非 0 退出")
    assert.ok(existsSync(crashDirOf(home)), "crash-reports 目录被入口预建（mkdir 先行）")
    const reports = readdirSync(crashDirOf(home)).filter((n) => /^report\..*\.json$/.test(n))
    assert.ok(reports.length >= 1, `report.*.json 在 crash-reports/（实际: ${reports.join(",") || "(无)"}）`)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-R25c.1 — 启动提示（F-R25c）
// ====================================================================

slow("T-R25c.1 启动提示：crash-reports 有 24h 内记录（mtime 控制）→ chat 启动 stderr 提示行在", () => {
  const home = fakeHome()
  try {
    const dir = crashDirOf(home)
    mkdirSync(dir, { recursive: true })
    const seed = join(dir, "crash-999-1.json") // mtime = now（24h 窗内）
    writeFileSync(seed, JSON.stringify({ type: "uncaughtException", message: "seed" }))
    const r = runBin(["chat", "hello"], home)
    assert.match(r.stderr, /上次运行异常终止（记录：.+crash-999-1\.json）/, "提示行在（含记录路径）")
    assert.equal(r.status, 1, "chat 无效 provider 快速退出路径不变（既有行为零回归）")
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-R25c.2 — 无记录不提示（负例）+ AC-3 正常退出零 crash 记录
// ====================================================================

slow("T-R25c.2 无记录不提示：旧记录（>24h——mtime 控制）/空目录 → 无提示 + 正常退出零新增 crash 记录（AC-3）", () => {
  // 场景一：旧记录（25h 前——窗外；<30d——不被清理淘汰）
  const home1 = fakeHome()
  try {
    const dir = crashDirOf(home1)
    mkdirSync(dir, { recursive: true })
    const seed = join(dir, "crash-2-2.json")
    writeFileSync(seed, "{}")
    const past = new Date(Date.now() - 25 * 3_600_000)
    utimesSync(seed, past, past)
    const r = runBin(["chat", "hello"], home1)
    assert.ok(!r.stderr.includes("上次运行异常终止"), "旧记录（24h 窗外）不提示（负例）")
    assert.deepEqual(listRecords(home1), ["crash-2-2.json"], "正常退出零新增 crash 记录（AC-3——chat 面）")
    assert.equal(r.status, 1, "退出码路径不变")
  } finally {
    rmSync(home1, { recursive: true, force: true })
  }
  // 场景二：空 crash-reports 目录
  const home2 = fakeHome()
  try {
    mkdirSync(crashDirOf(home2), { recursive: true })
    const r = runBin(["chat", "hello"], home2)
    assert.ok(!r.stderr.includes("上次运行异常终止"), "空目录不提示（负例）")
    assert.deepEqual(listRecords(home2), [], "跑后仍零记录（无 crash 误报产生）")
    assert.equal(r.status, 1, "退出码路径不变")
  } finally {
    rmSync(home2, { recursive: true, force: true })
  }
})

// ====================================================================
// F-R25c TUI 提示面渲染（showStartup crashNotice 分支）——快层进程内单测
// （T-R25c.1/c.2 子进程只覆盖 chat stderr 面——TUI 提示面在此补覆盖）
// ====================================================================

test("F-R25c TUI 提示面：showStartup 有 opts.crashNotice → 推一行；无 → 不推（负例）", async () => {
  const { showStartup } = await import("../src/tui/startup.mjs")
  const lines = []
  const makeCtx = (opts) => ({
    agent: {
      provider: { apiKey: "k", name: "p", model: "m" },
      activeProvider: "p",
      tools: [{ name: "t1" }],
      cwd: projectRoot, // listSlots 读 cwd manifest——仓库根无会话槽 → 空列表（不弹 Tip）
    },
    state: { lines: [] },
    opts,
    pushLine: (text, color) => lines.push({ text, color }),
    pushLabel: () => {},
    render: () => {},
    startWizard: () => {},
  })
  try {
    showStartup(makeCtx({ crashNotice: "上次运行异常终止（记录：C:\\fake\\crash-1-1.json）" }))
    assert.ok(lines.some((l) => l.text.startsWith("上次运行异常终止")), "crashNotice 传入 → 提示行推入 conversation")
    const warnLine = lines.find((l) => l.text.startsWith("上次运行异常终止"))
    assert.ok(warnLine.text.includes("crash-1-1.json"), "提示含记录路径")
  } finally {
    lines.length = 0
  }
  showStartup(makeCtx({})) // 无 crashNotice（负例）
  assert.ok(!lines.some((l) => l.text.startsWith("上次运行异常终止")), "无匹配不提示（负例——零回归）")
})
