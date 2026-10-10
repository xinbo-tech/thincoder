/**
 * 2026-10-10-server-exec-sandbox-runner-io.test.mjs — server-exec-sandbox 批内单测件（**执行面/runner · 控制面互操作 + 链自检面**；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。**三件一套**：本件（腿 G–I）∥
 * `2026-10-10-server-exec-sandbox-runner.test.mjs`（腿 A–F 本地语义面）∥
 * `2026-10-10-server-exec-sandbox-runner.fixtures.mjs`（共享夹具——假件只替真机不可用面）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-exec-sandbox-runner-io.test.mjs`
 *
 * 射程（判据源 = 批档 §2 ∥ `sandbox/RUNNER.md` §2–§10 ∥ `gateway/API.md` §2.6；腿 ↔ 判据在括号）：
 *   腿 G（RUNNER §2/§3/§6——**真控制面互操作**）：join ⇒ 心跳 ⇒ 长轮询领指令（create/start/exec/checkpoint）⇒ 上报
 *     ∥ 建盒后链重算（新盒网段入表——§4.1）∥ 规则下发 ⇒ 代理热换 + 链重算（零重建 P11）∥ 快照上送（octet-stream 落盘 + 审计）
 *     ∥ 未知 kind ⇒ unsupported ∥ 排空（快照 ⇒ 停盒 ⇒ drained）∥ 核心项 FAIL ⇒ 拒跑（E32）
 *   腿 H（§2）：退避 1s→30s 指数 + 抖动 ∥ 错误形 ∥ 不可达 ⇒ unreachable ∥ 无令牌 ⇒ 401 ∥ 上报缓冲有界
 *   腿 I（链自检）：bin 五命令 ∥ `bin` 第二入口 ∥ 发布门清单三件入链 ∥ deploy 两档在盘 ∥ README 快照路由块（32m 行保留）
 *     ∥ 九档在场 + 逐档 `node --check` ∥ 探针 P1–P14 注册齐
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import {
  call, createFakeRuntime, fakeReadings, gitIn, load, makeHybridExec, startControlPlane, tempDir, waitFor,
} from "./2026-10-10-server-exec-sandbox-runner.fixtures.mjs"

const REGISTRY = await load("thincoder-server/src/sandbox/registry.mjs")
const DAEMON = await load("thincoder-server/src/sandbox/runner/daemon.mjs")
const CLIENT = await load("thincoder-server/src/sandbox/runner/client.mjs")
const PROBE = await load("thincoder-server/src/sandbox/runner/probe.mjs")

// ── 腿 G（真控制面互操作：join ⇒ 领指令 ⇒ 上报 ⇒ 规则 ⇒ 快照 ⇒ 排空）──────────

test("腿 G 互操作：join/心跳/长轮询领指令（create/start/exec/checkpoint）⇒ 上报 ∥ 建盒后链重算 ∥ 规则下发 ⇒ 重算 ∥ 快照上送 ∥ 未知 kind ⇒ unsupported ∥ 排空 ⇒ drained", async () => {
  const checkpointDir = tempDir("runner-ckpt-")
  const workspaceRoot = tempDir("runner-io-ws-")
  const app = await startControlPlane({ checkpointDir })
  const runtime = createFakeRuntime()
  const exec = makeHybridExec()
  const egressStub = { updateRules: (rules) => { egressStub.rules = rules }, resolvePending: () => false, close: async () => {} }
  let daemon = null
  try {
    // ① join（真 join-token ⇒ runner 令牌；走真 joinServer 客户端）
    const issued = await call(app.base, "POST", "/api/admin/sandbox/runners/join-token", { cookie: app.adminCookie })
    const joined = await CLIENT.joinServer({ server: app.base, joinToken: issued.json.token, name: "runner-io", labels: { zone: "t" }, maxBoxes: 4, version: "0.1.0", runtimeAvailable: true })
    assert.ok(joined.runnerId > 0 && String(joined.token).startsWith("tc-runner-"), "join 兑换")
    // 重名 ⇒ 400 人话（零 SQLite 原文——join 面逐句人话口径）
    const issued2 = await call(app.base, "POST", "/api/admin/sandbox/runners/join-token", { cookie: app.adminCookie })
    await assert.rejects(
      () => CLIENT.joinServer({ server: app.base, joinToken: issued2.json.token, name: "runner-io", labels: {}, maxBoxes: 4, version: "0.1.0", runtimeAvailable: true }),
      (e) => e.status === 400 && /已存在/.test(String(e.message)) && !/UNIQUE|sandbox_runners|Sqlite/i.test(String(e.message)),
      "重名 join ⇒ 400 人话（零 SQLite 原文）",
    )
    const client = CLIENT.createRunnerClient({ server: app.base, token: joined.token })
    // ② 守护（假运行时 ∥ 假读数 ∥ 短周期）
    daemon = DAEMON.createDaemon({
      config: { server: app.base, token: joined.token, runnerId: joined.runnerId, workspaceRoot, version: "0.1.0", checkpointMaxBytes: 1024 * 1024 },
      deps: {
        runtime, client, exec, egress: egressStub, readings: fakeReadings(),
        heartbeatIntervalMs: 60, sweeperIntervalMs: 60, checkpointCheckIntervalMs: 60, pendingTimeoutSeconds: 0.3,
      },
    })
    await daemon.start()
    // 心跳落地（runner 在列 + 读数块）
    await waitFor(() => app.db.prepare("SELECT last_heartbeat_at FROM sandbox_runners WHERE id = ?").get(joined.runnerId)?.last_heartbeat_at !== null, { label: "心跳落地" })
    const runtimeBlock = JSON.parse(app.db.prepare("SELECT runtime_json FROM sandbox_runners WHERE id = ?").get(joined.runnerId).runtime_json)
    assert.equal(runtimeBlock.version, "0.1.0")
    assert.equal(runtimeBlock.runtimeAvailable, true)
    // ③ 建工作区（控制面）⇒ create/start 领指令 ⇒ 假运行时落盒
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws-io", ownerMemberId: app.aliceId } })
    assert.equal(created.status, 200, created.text)
    const wsId = created.json.workspace.id
    await waitFor(() => runtime.createSpecs.length >= 1 && [...runtime.containers.values()].some((container) => container.state === "running"), { label: "create+start 落盒" })
    const specsAfterBox = runtime.createSpecs.length
    const boxEnv = runtime.createSpecs.at(-1).env
    assert.ok(String(boxEnv.OPENAI_API_KEY).startsWith("sk-tc-"), "工作区 key 注入盒 env")
    assert.equal(boxEnv.HTTP_PROXY, "http://172.18.0.1:3128", "代理 env（桥地址:proxyPort）")
    // ③b 建盒即入链（无规则变更也须重算——新盒网段缺跳转 ⇒ 该盒出站不经沙箱表）
    await waitFor(() => exec.calls.some((item) => item.cmd === "nft" && item.args[0] === "-f" && String(item.input).includes(`ws${wsId}_fwd`)), { label: "建盒后链重算（新盒网段入表）" })
    await waitFor(() => {
      const rows = app.db.prepare("SELECT status FROM sandbox_tasks WHERE runner_id = ? ORDER BY id").all(joined.runnerId)
      return rows.length >= 2 && rows.slice(0, 2).every((row) => row.status === "done")
    }, { label: "create/start 上报 done" })
    await waitFor(() => {
      const runner = app.db.prepare("SELECT runtime_json FROM sandbox_runners WHERE id = ?").get(joined.runnerId)
      return JSON.parse(runner.runtime_json).boxes?.some((box) => box.workspaceId === wsId && box.state === "running")
    }, { label: "盒状态上报（控制台可见）" })
    // ④ 规则下发 ⇒ 域名面热换 + CIDR 面链重算（不重建盒）
    const nftBefore = exec.calls.filter((item) => item.cmd === "nft").length
    const rule = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, body: { kind: "domain", action: "allow", target: "newly-allowed.test" } })
    assert.equal(rule.status, 200, rule.text)
    await waitFor(() => egressStub.rules?.some((item) => item.target === "newly-allowed.test"), { label: "规则热换" })
    await waitFor(() => exec.calls.filter((item) => item.cmd === "nft").length > nftBefore, { label: "链全量重算" })
    assert.equal(runtime.createSpecs.length, specsAfterBox, "规则变更零重建（P11）")
    // ⑤ exec 指令（直注入队——无 admin 端点）⇒ 假运行时 ⇒ 上报（码/输出透传）
    runtime.execQueue.push({ exitCode: 3, stdout: Buffer.from("hello-out"), stderr: Buffer.from(""), truncated: false, timedOut: false })
    REGISTRY.enqueueTask(app.db, { runnerId: joined.runnerId, kind: "sandbox.exec", workspaceId: wsId, payload: { command: "npm test" } })
    await waitFor(() => {
      const row = app.db.prepare("SELECT * FROM sandbox_tasks WHERE kind = 'sandbox.exec' AND runner_id = ?").get(joined.runnerId)
      return row && row.status === "done" && JSON.parse(row.result_json).stdout === "hello-out"
    }, { label: "exec 上报（结果透传）" })
    const execRow = app.db.prepare("SELECT result_json FROM sandbox_tasks WHERE kind = 'sandbox.exec'").get()
    assert.deepEqual([JSON.parse(execRow.result_json).exitCode, JSON.parse(execRow.result_json).truncated], [3, false])
    // ⑥ 未知 kind ⇒ unsupported（向前兼容）
    REGISTRY.enqueueTask(app.db, { runnerId: joined.runnerId, kind: "ci.build", workspaceId: wsId, payload: {} })
    await waitFor(() => app.db.prepare("SELECT status FROM sandbox_tasks WHERE kind = 'ci.build'").get()?.status === "unsupported", { label: "未知 kind ⇒ unsupported" })
    // ⑦ WIP 快照：卷做成脏 git 仓 ⇒ checkpoint 指令 ⇒ octet-stream 上送 ⇒ 落盘 + 登记 + 审计
    const volume = join(workspaceRoot, String(wsId))
    gitIn(volume, ["init", "-q"])
    writeFileSync(join(volume, "a.txt"), "dirty\n")
    gitIn(volume, ["add", "."])
    gitIn(volume, ["commit", "-q", "-m", "base"])
    writeFileSync(join(volume, "a.txt"), "changed\n")
    writeFileSync(join(volume, "b.txt"), "untracked\n")
    REGISTRY.enqueueTask(app.db, { runnerId: joined.runnerId, kind: "sandbox.checkpoint", workspaceId: wsId, payload: {} })
    await waitFor(() => app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_checkpoints WHERE workspace_id = ?").get(wsId).n === 1, { label: "快照登记" })
    const checkpointRow = app.db.prepare("SELECT * FROM sandbox_checkpoints WHERE workspace_id = ?").get(wsId)
    assert.ok(existsSync(checkpointRow.blob_path) && checkpointRow.blob_path.startsWith(checkpointDir), "快照落盘（服务端流式落盘）")
    assert.ok(checkpointRow.size > 0, "上送字节数登记")
    const auditRow = app.db.prepare("SELECT detail FROM audit_events WHERE type = 'sandbox_event' ORDER BY id DESC LIMIT 1").get()
    assert.equal(JSON.parse(auditRow.detail).kind, "checkpoint", "审计行（octet-stream 型门豁免路径）")
    assert.equal(readFileSync(join(volume, "a.txt"), "utf8"), "changed\n", "打包不动工作区")
    // ⑧ 工作区行读数（控制台）：盒在跑 + dirty + 快照数
    const list = await call(app.base, "GET", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie })
    const row = list.json.workspaces.find((item) => item.id === wsId)
    assert.deepEqual([row.boxState, row.checkpointCount], ["running", 1], "盒读数 + 快照数（控制台面）")
    // ⑨ 排空：收旗 ⇒ 快照 ⇒ 停盒 ⇒ 心跳 drain ⇒ drained
    const drain = await call(app.base, "POST", `/api/admin/sandbox/runners/${joined.runnerId}/drain`, { cookie: app.adminCookie })
    assert.equal(drain.status, 200)
    await waitFor(() => app.db.prepare("SELECT status FROM sandbox_runners WHERE id = ?").get(joined.runnerId).status === "drained", { label: "排空 ⇒ drained" })
    assert.equal(daemon.boxes().get(wsId).state, "stopped", "收旗 ⇒ 停盒（卷留）")
    assert.ok(existsSync(volume), "排空不动卷")
  } finally {
    if (daemon) await daemon.stop()
    await app.close()
    rmSync(checkpointDir, { recursive: true, force: true })
    rmSync(workspaceRoot, { recursive: true, force: true })
  }
})

test("腿 G 拒跑：核心项 FAIL ⇒ 守护拒起（E32——进程退出 + 原因）", async () => {
  const workspaceRoot = tempDir("runner-refuse-")
  try {
    const daemon = DAEMON.createDaemon({
      config: { server: "http://127.0.0.1:1", workspaceRoot },
      deps: {
        runtime: createFakeRuntime(),
        client: { poll: async () => ({ tasks: [] }), heartbeat: async () => {}, report: async () => {}, pending: async () => ({}) },
        readings: fakeReadings({ ok: false, items: [{ no: 2, name: "容器运行时", level: "core", pass: false, detail: "docker/podman 均不可执行" }] }),
      },
    })
    await assert.rejects(() => daemon.start(), /拒跑.*容器运行时/, "核心项 FAIL ⇒ 拒跑")
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true })
  }
})

// ── 腿 H（§2——退避 ∥ 错误形 ∥ 不可达 ∥ 最小权限）─────────────────────────────

test("腿 H 退避 1s→30s 指数 + 抖动 ∥ 错误形 ∥ 不可达 ⇒ unreachable ∥ 无令牌 ⇒ 401 ∥ 上报缓冲有界", async () => {
  const low = CLIENT.nextBackoffMs(0, { random: () => 0 })
  assert.deepEqual(low, 800, "首退 1s × 0.8")
  assert.deepEqual(CLIENT.nextBackoffMs(10000, { random: () => 1 }), 24000, "指数 ×2（10s ⇒ 20s，+20% 抖动）")
  assert.equal(CLIENT.nextBackoffMs(30000, { random: () => 1 }), 30000, "封顶 30s")
  assert.ok(CLIENT.nextBackoffMs(1000, { random: () => 0 }) < CLIENT.nextBackoffMs(1000, { random: () => 1 }), "抖动窗")
  const app = await startControlPlane()
  try {
    const noToken = CLIENT.createRunnerClient({ server: app.base, token: null })
    await assert.rejects(() => noToken.heartbeat({}), (e) => e.name === "RunnerApiError" && e.code === "invalid_api_key" && e.status === 401, "无令牌 ⇒ 401 invalid_api_key")
    const badToken = CLIENT.createRunnerClient({ server: app.base, token: "tc-runner-nope" })
    await assert.rejects(() => badToken.poll({}), (e) => e.code === "invalid_api_key", "未知令牌 ⇒ 401（不区分）")
    const dead = CLIENT.createRunnerClient({ server: "http://127.0.0.1:1", token: "x" })
    await assert.rejects(() => dead.heartbeat({}), (e) => e.code === "unreachable", "不可达 ⇒ 有界报错（退避面）")
    // 离线：上报缓冲有界（丢最旧 + 日志）
    const daemon = DAEMON.createDaemon({
      config: { server: app.base, workspaceRoot: process.cwd(), stateDir: join(process.cwd(), ".thincoder", "tmp", "outbox-state") },
      deps: { runtime: createFakeRuntime(), client: { poll: async () => ({ tasks: [] }), heartbeat: async () => {}, report: async () => { throw new Error("offline") }, pending: async () => ({}) }, readings: fakeReadings() },
    })
    for (let i = 0; i < DAEMON.OUTBOX_LIMIT + 5; i++) daemon.outbox.push({ taskId: i })
    assert.equal(daemon.outbox.size(), DAEMON.OUTBOX_LIMIT, "有界缓冲（超界丢最旧）")
    assert.equal(daemon.outbox.peek()[0].taskId, 5, "丢最旧")
  } finally {
    await app.close()
  }
})

// ── 腿 I（链自检：bin ∥ 档面 ∥ README ∥ 九档语法）─────────────────────────────

test("腿 I 链自检：bin 五命令 ∥ `bin` 第二入口 ∥ 发布门清单 ∥ deploy 两档 ∥ README 快照路由块（32m 行保留）∥ 九档 node --check", () => {
  const root = process.cwd()
  const serverDir = join(root, "thincoder-server")
  const pkg = JSON.parse(readFileSync(join(serverDir, "package.json"), "utf8"))
  assert.equal(pkg.bin["thincoder-runner"], "bin/thincoder-runner.mjs", "bin 第二入口（KD-SV-64）")
  for (const file of ["2026-10-10-server-exec-sandbox-runner.test.mjs", "2026-10-10-server-exec-sandbox-runner-io.test.mjs"]) {
    assert.ok(pkg.scripts.prepublishOnly.includes(file), `发布门清单入链（本批件）：${file}`)
  }
  assert.ok(existsSync(join(serverDir, pkg.bin["thincoder-runner"])), "入口在盘")
  const help = spawnSync(process.execPath, [join(serverDir, "bin", "thincoder-runner.mjs"), "--help"], { encoding: "utf8" })
  assert.equal(help.status, 0, help.stderr)
  for (const cmd of ["join", "run", "doctor", "probe", "image"]) assert.ok(help.stdout.includes(cmd), `用法缺命令：${cmd}`)
  const unknown = spawnSync(process.execPath, [join(serverDir, "bin", "thincoder-runner.mjs"), "nope"], { encoding: "utf8" })
  assert.equal(unknown.status, 1, "未知命令 ⇒ 非零")
  for (const rel of ["deploy/thincoder-runner.service", "deploy/sandbox/Dockerfile"]) assert.ok(existsSync(join(serverDir, rel)), `deploy 档缺：${rel}`)
  const unit = readFileSync(join(serverDir, "deploy/thincoder-runner.service"), "utf8")
  assert.ok(unit.includes("ExecStart=") && unit.includes("thincoder-runner run --config"), "unit 守护行")
  const dockerfile = readFileSync(join(serverDir, "deploy/sandbox/Dockerfile"), "utf8")
  assert.ok(dockerfile.includes("FROM node:") && dockerfile.includes("USER 1000:1000"), "盒镜像（非 root）")
  assert.ok(!dockerfile.includes("openssh-client"), "工具链面收口 = 设计列举（git/curl——不多装）")
  const readme = readFileSync(join(serverDir, "README.md"), "utf8")
  assert.ok(readme.includes("location = /api/runner/checkpoint"), "README §11 快照路由块")
  assert.ok(readme.includes("client_max_body_size 200m"), "路由级 200m")
  assert.ok(readme.includes("client_max_body_size 32m"), "缺省 32m 行保留（其余路由从严）")
  const runnerFiles = ["daemon", "client", "runtime", "boxes", "egress", "netfilter", "quota", "checkpoint", "probe"]
  for (const name of runnerFiles) {
    const path = join(serverDir, "src", "sandbox", "runner", `${name}.mjs`)
    assert.ok(existsSync(path), `九档缺：${name}.mjs`)
    const check = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" })
    assert.equal(check.status, 0, `${name}.mjs 语法：${check.stderr}`)
  }
  // 探针表齐（P1–P14——真机项，读数不在此件）
  assert.deepEqual(PROBE.PROBES.map((probe) => probe.id), Array.from({ length: 14 }, (_, i) => `P${i + 1}`), "十四探针注册齐")
})
