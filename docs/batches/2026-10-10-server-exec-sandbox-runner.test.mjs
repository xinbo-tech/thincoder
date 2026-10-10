/**
 * 2026-10-10-server-exec-sandbox-runner.test.mjs — server-exec-sandbox 批内单测件（**执行面/runner · 本地语义面**；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。**三件一套**：本件（腿 A–F）∥
 * `2026-10-10-server-exec-sandbox-runner-io.test.mjs`（腿 G–I 互操作 + 链自检）∥
 * `2026-10-10-server-exec-sandbox-runner.fixtures.mjs`（共享夹具——假件只替真机不可用面）；服务面另件 = `2026-10-10-server-exec-sandbox.test.mjs`。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`
 *
 * 射程（判据源 = 批档 §2 ∥ `sandbox/RUNNER.md` §2–§12 ∥ `sandbox/SANDBOX.md` §13 执行面用例；腿 ↔ 判据在括号）：
 *   腿 A（RUNNER §3/§5——KD-SV-73/74）：盒参数集逐项（read-only ∥ 唯一卷 ∥ tmpfs ∥ cap-drop ∥ 非 root ∥ 每工作区网络 ∥ env 白名单）
 *     ∥ 生命周期（create 幂等 ∥ start 重建式 ∥ stop 卷留 ∥ destroy 卷删仅显式）∥ 采纳（label 快照）∥ TTL 双计时 ∥ exec（码/截断/超时）
 *     ∥ 载荷零回落（缺键 ⇒ 建盒拒）
 *   腿 B（§4.1/§4.2 求值序）：显式 deny 恒先 ∥ 种子 deny ≺ 显式 allow ∥ 单层左通配 ∥ 恒拒（127/8 ∥ 169.254/16）
 *     ∥ 解析后 IP 二查 ∥ 无命中 ⇒ 待批 ∥ IP 目标按 CIDR 同裁
 *   腿 C（§4.2——真 socket）：准入白名单 ∥ 绝对 URI 转发 ∥ CONNECT 隧道 ∥ PIN（以已校验 IP 建连）∥ deny 403
 *     ∥ 待批挂起（once 放行 ∥ 超时拒）∥ 非代理请求 400
 *   腿 D（§4.1——KD-SV-76）：nft/iptables 链生成（恒拒先 ∥ 规则序 ∥ INPUT 仅 proxyPort）∥ 全量重算幂等（nft 重建 ∥
 *     iptables 建链容忍）∥ 自检 ∥ 探测序
 *   腿 E（§5——KD-SV-74）：探测定序（pquota/prjquota ⇒ loopback ⇒ null）∥ 项目配额/loopback 命令 ∥ 释放 ∥ doctor 核心项门
 *   腿 F（§6——真 git）：dirty 判据 ∥ 打包（不动工作区 ∥ 未跟踪入包 ∥ 纯未跟踪独占面）∥ 恢复（新克隆套用）∥ 跳过面（非 git/干净/超限）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer as createHttpServer, request as httpRequest } from "node:http"
import { connect as netConnect } from "node:net"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  EMPTY, boxPayload, createFakeRuntime, gitIn, load, makeHybridExec, tempDir, waitFor,
} from "./2026-10-10-server-exec-sandbox-runner.fixtures.mjs"

// 执行面（本批新档）
const RUNTIME = await load("thincoder-server/src/sandbox/runner/runtime.mjs")
const BOXES = await load("thincoder-server/src/sandbox/runner/boxes.mjs")
const EGRESS = await load("thincoder-server/src/sandbox/runner/egress.mjs")
const NETFILTER = await load("thincoder-server/src/sandbox/runner/netfilter.mjs")
const QUOTA = await load("thincoder-server/src/sandbox/runner/quota.mjs")
const CHECKPOINT = await load("thincoder-server/src/sandbox/runner/checkpoint.mjs")
const PROBE = await load("thincoder-server/src/sandbox/runner/probe.mjs") // 腿 A env 白名单面（BOX_ENV_ALLOWED）
// ── 腿 A（§3/§5——盒参数集 ∥ 生命周期 ∥ TTL ∥ exec）────────────────────────────

test("腿 A 盒参数集：buildCreateArgs 逐项（read-only ∥ 唯一卷 ∥ tmpfs ∥ cap-drop ∥ 非 root ∥ 网络 ∥ 资源旗）", () => {
  const args = RUNTIME.buildCreateArgs({
    engine: "docker", name: "tc-ws-3", image: "thincoder-sandbox:1",
    containerLabels: { "tc.sandbox": "1", "tc.ws": "3", "tc.runner": "9" },
    volumeSrc: "/srv/workspaces/3", tmpfsMb: 256, user: "1000:1000",
    cpus: 2, memMb: 4096, pids: 512, network: "tc-ws-3",
    env: { HOME: "/workspace/home", OPENAI_API_KEY: "sk-tc-x" },
  })
  const line = args.join(" ")
  for (const needle of [
    "--read-only", "type=bind,src=/srv/workspaces/3,dst=/workspace", "/tmp:rw,size=256m", "--user 1000:1000",
    "--cap-drop=ALL", "no-new-privileges", "--cpus 2", "--memory 4096m", "--memory-swap 4096m", "--pids-limit 512",
    "--network tc-ws-3", "--label tc.sandbox=1", "--label tc.ws=3", "--label tc.runner=9",
    "-e HOME=/workspace/home", "-e OPENAI_API_KEY=sk-tc-x", "--workdir /workspace", "thincoder-sandbox:1",
  ]) assert.ok(line.includes(needle), `缺参数：${needle}`)
  assert.equal(args.filter((a) => a === "--mount").length, 1, "唯一可写挂载 = 工作区卷（bind）")
})

test("腿 A 盒 env：基址归一（0.0.0.0 ⇒ server 地址）∥ 代理/NO_PROXY ∥ TC_* 白名单面", () => {
  assert.equal(BOXES.normalizeOpenAiBase("http://0.0.0.0:8787/v1", "http://10.0.0.5:8787"), "http://10.0.0.5:8787/v1")
  assert.equal(BOXES.normalizeOpenAiBase("http://10.0.0.5:8787/v1", "http://x"), "http://10.0.0.5:8787/v1")
  const env = BOXES.buildBoxEnv({
    payload: { workspaceId: 4, env: { OPENAI_BASE_URL: "http://0.0.0.0:8787/v1", OPENAI_API_KEY: "sk-tc-ws" } },
    proxyUrl: "http://172.18.0.1:3128", serverUrl: "http://10.0.0.5:8787",
  })
  assert.equal(env.HOME, "/workspace/home")
  assert.equal(env.OPENAI_BASE_URL, "http://10.0.0.5:8787/v1")
  assert.equal(env.HTTP_PROXY, "http://172.18.0.1:3128")
  assert.equal(env.HTTPS_PROXY, env.HTTP_PROXY)
  assert.equal(env.http_proxy, env.HTTP_PROXY, "小写形（工具兼容面）")
  assert.equal(env.NO_PROXY, "10.0.0.5:8787,localhost,127.0.0.1", "生命线直连（不经闸）")
  assert.equal(env.TC_WORKSPACE_ID, "4")
  assert.equal(env.TC_SANDBOX, "1")
  for (const key of Object.keys(env)) assert.ok(PROBE.BOX_ENV_ALLOWED.includes(key), `env 白名单外键：${key}`)
})

test("腿 A 生命周期：create 幂等 ∥ start 重建式 ∥ stop 卷留 ∥ destroy（卷删仅显式）∥ 采纳", async () => {
  const runtime = createFakeRuntime()
  const workspaceRoot = tempDir("runner-ws-")
  const exec = makeHybridExec()
  try {
    const boxes = BOXES.createBoxesManager({
      runtime, exec, config: { workspaceRoot, runnerId: 42, server: "http://10.0.0.5:8787", quota: { mechanism: "project", fsType: "ext4", mountPoint: "/" } },
    })
    const payload = boxPayload(7)
    const box = await boxes.create(payload)
    assert.equal(box.state, "stopped", "create 后待 start")
    assert.ok(existsSync(join(workspaceRoot, "7")), "卷目录建在场")
    assert.equal(runtime.createSpecs[0].containerLabels["tc.runner"], "42")
    assert.equal(runtime.createSpecs[0].env.OPENAI_API_KEY, "sk-tc-ws7")
    await boxes.start(payload)
    assert.equal(boxes.get(7).state, "running")
    assert.equal(runtime.createSpecs.length, 1, "create+start 同载荷 ⇒ 直启（零重建churn）")
    const firstContainer = boxes.get(7).containerId
    await boxes.create(payload) // 幂等（在跑 ⇒ 采纳零触）
    assert.equal(boxes.get(7).containerId, firstContainer, "在跑 ⇒ 不重建")
    // stop ⇒ 卷留 + stopReason
    const stopped = await boxes.stop(7, { reason: "manual" })
    assert.deepEqual([stopped.ok, boxes.get(7).state, boxes.get(7).stopReason], [true, "stopped", "manual"])
    assert.ok(existsSync(join(workspaceRoot, "7")), "stop 不动卷")
    // start（停态 ⇒ 重建——新载荷生效）
    await boxes.start({ ...payload, limits: { ...payload.limits, cpus: 3 } })
    assert.notEqual(boxes.get(7).containerId, firstContainer, "停后重启 = 重建（容器旗不可热改）")
    assert.equal(runtime.createSpecs.length, 2, "重建恰一次")
    assert.equal(runtime.createSpecs.at(-1).cpus, 3, "新载荷生效（§2）")
    // destroy（卷保留）
    await boxes.destroy(7, { deleteVolume: false })
    assert.ok(existsSync(join(workspaceRoot, "7")), "destroy 非显式 ⇒ 卷留（三层保护第一层）")
    assert.equal(runtime.networks.has("tc-ws-7"), false, "网络随删")
    // destroy（显式删卷）
    await boxes.create(payload)
    await boxes.destroy(7, { deleteVolume: true })
    assert.equal(existsSync(join(workspaceRoot, "7")), false, "显式销毁 ⇒ 卷删")
    // 采纳：预置容器（label 快照）——墙钟基准 = 容器真实创建时刻（顺延拒）
    const runtime2 = createFakeRuntime()
    const adoptedCreatedMs = Date.now() - 3 * 60 * 60 * 1000
    runtime2.containerCreatedMs = adoptedCreatedMs
    runtime2.containers.set("cX", { id: "cX", name: "tc-ws-9", state: "running", workspaceId: 9, runnerId: 42, labels: { "tc.sandbox": "1", "tc.ws": "9", "tc.runner": "42" } })
    const boxes2 = BOXES.createBoxesManager({ runtime: runtime2, exec, config: { workspaceRoot, runnerId: 42, server: "http://10.0.0.5:8787" } })
    assert.equal(await boxes2.adopt(), 1, "按 label 采纳既有盒（零重建）")
    assert.equal(boxes2.get(9).state, "running")
    assert.equal(boxes2.get(9).createdAt, adoptedCreatedMs, "盒龄基准 = 容器创建时刻（runner 重启不顺延墙钟）")
    assert.equal(runtime2.networks.has("tc-ws-9"), true, "网络缺 ⇒ 补建（幂等）")
    // 零回落（§3:43）：载荷缺键 ⇒ 建盒拒（不静默取缺省）
    for (const broken of [{ ...boxPayload(11), image: undefined }, { ...boxPayload(11), tmpfsMb: null }, { ...boxPayload(11), network: "" }]) {
      await assert.rejects(() => boxes.create(broken), /载荷缺/, `缺键 ⇒ 拒：${JSON.stringify(broken.image ?? broken.tmpfsMb ?? broken.network)}`)
    }
    await assert.rejects(() => boxes.create({ ...boxPayload(11), limits: { ...boxPayload(11).limits, idleTtlMinutes: undefined } }), /limits\.idleTtlMinutes/, "TTL 旗值同守")
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true })
  }
})

test("腿 A TTL 双计时 + exec：空闲 ⇒ idle_ttl（拆前快照钩子）∥ 墙钟 ⇒ wallclock_ttl ∥ exec 码/活动触达", async () => {
  const runtime = createFakeRuntime()
  const workspaceRoot = tempDir("runner-ttl-")
  const stops = []
  let clock = 1_700_000_000_000
  try {
    const boxes = BOXES.createBoxesManager({
      runtime, now: () => clock, config: { workspaceRoot, runnerId: 42, server: "http://10.0.0.5:8787" },
      checkpointBeforeStop: async (workspaceId, reason) => { stops.push({ workspaceId, reason }) },
    })
    const payload = boxPayload(5)
    await boxes.start(payload)
    // exec：假件读数透传 + 活动触达（空闲计窗重置）
    runtime.execQueue.push({ exitCode: 7, stdout: Buffer.from("out"), stderr: Buffer.from("err"), truncated: true, timedOut: false })
    const execResult = await boxes.exec(5, { command: "npm test" })
    assert.deepEqual([execResult.exitCode, execResult.stdout, execResult.stderr, execResult.truncated], [7, "out", "err", true])
    clock += 29 * 60 * 1000
    assert.deepEqual(await boxes.sweep(), [], "29 分钟（< 30 空闲）⇒ 不拆")
    clock += 2 * 60 * 1000
    const swept = await boxes.sweep()
    assert.deepEqual(swept, [{ workspaceId: 5, reason: "idle_ttl" }], "空闲超时 ⇒ 拆盒")
    assert.deepEqual(stops, [{ workspaceId: 5, reason: "idle_ttl" }], "拆前 WIP 快照钩子（§6）")
    assert.equal(boxes.get(5).stopReason, "idle_ttl")
    // 墙钟（重建 ⇒ 新 createdAt）
    await boxes.start(payload)
    clock += 25 * 60 * 60 * 1000
    const swept2 = await boxes.sweep()
    assert.deepEqual(swept2, [{ workspaceId: 5, reason: "wallclock_ttl" }], "墙钟 24h ⇒ 拆盒")
    assert.ok(existsSync(join(workspaceRoot, "5")), "TTL 拆盒不动卷（下次使用重建）")
    // exec 超时/截断标志透传
    runtime.execQueue.push({ exitCode: null, stdout: EMPTY, stderr: EMPTY, truncated: false, timedOut: true })
    await boxes.start(payload)
    const timedOut = await boxes.exec(5, { command: "sleep 99" })
    assert.deepEqual([timedOut.exitCode, timedOut.timedOut], [null, true], "超时 ⇒ exitCode null + timedOut")
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true })
  }
})

// ── 腿 B（§4 求值序——纯函数）─────────────────────────────────────────────────

const RULE = (id, kind, action, target, source = "admin", extra = {}) => ({ id, kind, action, target, port: null, protocol: null, priority: 0, source, ...extra })

test("腿 B 求值序：显式 deny 恒先 ∥ 种子 deny ≺ 显式 allow ∥ 恒拒 ∥ 无命中 ⇒ 待批", () => {
  const rules = [
    RULE(1, "domain", "allow", "github.com", "default"),
    RULE(2, "domain", "deny", "github.com", "admin"), // 同目标 deny+allow ⇒ deny
    RULE(3, "domain", "deny", "seed.deny.test", "default"),
    RULE(4, "domain", "allow", "seed.deny.test", "admin"), // 种子 deny ≺ 显式 allow ⇒ allow
    RULE(5, "domain", "allow", "*.example.com", "default"),
    RULE(6, "cidr", "deny", "10.0.0.0/8", "default"),
    RULE(7, "cidr", "allow", "10.1.0.0/16", "admin"), // 显式 allow 可开种子 deny（U2）
  ]
  assert.deepEqual([EGRESS.evaluateDomainRules(rules, "github.com").action, EGRESS.evaluateDomainRules(rules, "github.com").reason], ["deny", "domain_deny"], "显式 deny 恒先")
  assert.equal(EGRESS.evaluateDomainRules(rules, "seed.deny.test").action, "allow", "种子 deny ≺ 显式 allow")
  assert.equal(EGRESS.evaluateDomainRules(rules, "a.example.com").action, "allow", "单层左通配命中")
  assert.equal(EGRESS.evaluateDomainRules(rules, "a.b.example.com").action, "pending", "双级不命中（恰一级）")
  assert.equal(EGRESS.evaluateDomainRules(rules, "example.com").action, "pending", "裸域不命中通配")
  assert.equal(EGRESS.evaluateDomainRules(rules, "unknown.test").action, "pending", "无命中 ⇒ 待批挂起")
  // 域名路径：解析后 IP 二查（恒拒 ⇒ 拒；deny 命中 ⇒ 拒；无条目 ⇒ 不拦）
  assert.deepEqual([EGRESS.cidrGate(rules, ["169.254.169.254"]).action, EGRESS.cidrGate(rules, ["169.254.169.254"]).reason], ["deny", "hard_deny"], "云元数据恒拒")
  assert.deepEqual([EGRESS.cidrGate(rules, ["127.0.0.1"]).action, EGRESS.cidrGate(rules, ["127.0.0.1"]).reason], ["deny", "hard_deny"], "回环恒拒")
  assert.equal(EGRESS.cidrGate(rules, ["10.2.3.4"]).action, "deny", "种子 deny 命中 ⇒ 拒（白名单域名 + 内网解析不可绕）")
  assert.equal(EGRESS.cidrGate(rules, ["10.1.2.3"]).action, "allow", "显式 allow 开种子 deny")
  assert.equal(EGRESS.cidrGate(rules, ["93.184.216.34"]).action, "allow", "无 CIDR 条目 ⇒ 不拦")
  assert.equal(EGRESS.cidrGate(rules, ["93.184.216.34", "10.2.3.4"]).action, "deny", "任一所解析 IP 命中 deny ⇒ 整体拒")
  // IP 目标径（代理面 IP 直发——同规则同裁）
  assert.equal(EGRESS.evaluateCidrTarget(rules, "10.2.3.4").action, "deny")
  assert.equal(EGRESS.evaluateCidrTarget(rules, "10.1.2.3").action, "allow")
  assert.equal(EGRESS.evaluateCidrTarget(rules, "8.8.8.8").action, "deny", "无条目 ⇒ 默认拒")
})

// ── 腿 C（§4.2——真 socket：准入 ∥ 转发 ∥ 隧道 ∥ PIN ∥ 待批）────────────────────

async function startTargetServer() {
  const server = createHttpServer((req, res) => {
    res.writeHead(200, { "content-type": "text/plain" })
    res.end(`hello:${req.headers.host}${req.url}`)
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  return { server, port: server.address().port, close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) }) }
}

function proxyHttpRequest({ proxyPort, path, headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port: proxyPort, method: "GET", path, headers }, (res) => {
      const chunks = []
      res.on("data", (chunk) => chunks.push(chunk))
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8"), headers: res.headers }))
    })
    req.on("error", reject)
    req.end()
  })
}

function proxyConnect({ proxyPort, target }) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port: proxyPort, method: "CONNECT", path: target })
    req.on("connect", (res, socket) => resolve({ status: res.statusCode, socket }))
    req.on("error", reject)
    req.end()
  })
}

test("腿 C 代理：准入白名单 ∥ 绝对 URI 转发（PIN 建连）∥ 隧道 ∥ deny ∥ 待批（once/超时）∥ 非代理 400", async () => {
  const target = await startTargetServer()
  const dials = []
  const registered = []
  const rules = [
    RULE(1, "domain", "allow", "allowed.test"),
    RULE(2, "domain", "deny", "blocked.test"),
    RULE(3, "domain", "allow", "intranet.test"),
    RULE(4, "cidr", "deny", "10.0.0.0/8", "default"),
  ]
  const proxy = EGRESS.createEgressProxy({
    proxyPort: 0,
    rules,
    resolveWorkspace: (ip) => (ip === "127.0.0.1" ? 7 : null),
    resolveHost: async (host) => {
      if (host === "allowed.test") return [{ address: "93.184.216.34", family: 4 }]
      if (host === "intranet.test") return [{ address: "10.1.2.3", family: 4 }]
      return [{ address: "198.51.100.7", family: 4 }]
    },
    connectTarget: async ({ ip, port }) => { dials.push(ip); return netConnect({ host: "127.0.0.1", port: target.port }) },
    registerPending: async (workspaceId, host) => { registered.push({ workspaceId, host }); return { id: 100 + registered.length, hits: 1, timeoutSeconds: 0.3 } },
    pendingTimeoutSeconds: 0.3,
  })
  await proxy.listen()
  const proxyPort = proxy.server.address().port
  try {
    // ① 绝对 URI 转发（经典代理形）：Host 携原域名 ⇒ 目标照收；PIN = 以已校验 IP 建连
    const ok = await proxyHttpRequest({ proxyPort, path: "http://allowed.test/a?b=1", headers: { host: "allowed.test" } })
    assert.equal(ok.status, 200, ok.body)
    assert.match(ok.body, /hello:allowed\.test\/a\?b=1/)
    assert.deepEqual(dials, ["93.184.216.34"], "PIN：建连目标 = 已校验解析 IP（非域名重解析）")
    // ② CONNECT 隧道（HTTPS 形——不 MITM；字节直通）
    const tunnel = await proxyConnect({ proxyPort, target: "allowed.test:80" })
    assert.equal(tunnel.status, 200)
    const viaTunnel = await new Promise((resolve, reject) => {
      const chunks = []
      tunnel.socket.on("data", (chunk) => chunks.push(chunk))
      tunnel.socket.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
      tunnel.socket.on("error", reject)
      tunnel.socket.write("GET /t HTTP/1.1\r\nHost: allowed.test\r\nConnection: close\r\n\r\n")
    })
    assert.match(viaTunnel, /hello:allowed\.test\/t/, "隧道字节直通（盒自身 TLS/HTTP 面）")
    // ③ 显式 deny ⇒ 403
    const denied = await proxyHttpRequest({ proxyPort, path: "http://blocked.test/", headers: { host: "blocked.test" } })
    assert.deepEqual([denied.status, denied.headers["x-tc-reason"]], [403, "denied-domain_deny"])
    // 域名 allow + 解析 IP 命中种子 deny ⇒ CIDR 二查拒
    const intranet = await proxyHttpRequest({ proxyPort, path: "http://intranet.test/", headers: { host: "intranet.test" } })
    assert.deepEqual([intranet.status, intranet.headers["x-tc-reason"]], [403, "denied-ip_deny"], "解析后 IP 二查（防「白名单域名 + 内网解析」）")
    // ④ 待批：登记在场 ⇒ 挂起 ⇒ 裁定 once ⇒ 放行
    const pendingCall = proxyHttpRequest({ proxyPort, path: "http://unknown.test/x", headers: { host: "unknown.test" } })
    await waitFor(() => registered.length === 1, { label: "待批登记" })
    assert.deepEqual(registered[0], { workspaceId: 7, host: "unknown.test" })
    assert.equal(proxy.resolvePending({ id: 101, decision: "once" }), true, "裁定命中")
    const resolved = await pendingCall
    assert.equal(resolved.status, 200, "once ⇒ 当次放行")
    // ⑤ 待批：无裁定 ⇒ 超时拒（0.3s 窗）
    const timeoutCall = await proxyHttpRequest({ proxyPort, path: "http://slow.test/x", headers: { host: "slow.test" } })
    assert.deepEqual([timeoutCall.status, timeoutCall.headers["x-tc-reason"]], [403, "pending-timeout"], "超时 ⇒ 拒（不静默放行）")
    // ⑥ 非代理请求（path 形）⇒ 400（非开放代理）
    const origin = await proxyHttpRequest({ proxyPort, path: "/plain", headers: { host: "x.test" } })
    assert.equal(origin.status, 400)
    // ⑦ 源白名单：非盒网段 ⇒ 拒
    proxy.updateRules(rules)
    const guest = EGRESS.createEgressProxy({ proxyPort: 0, rules, resolveWorkspace: () => null, connectTarget: async () => { throw new Error("不应建连") } })
    await guest.listen()
    try {
      const res = await proxyHttpRequest({ proxyPort: guest.server.address().port, path: "http://allowed.test/", headers: { host: "allowed.test" } })
      assert.equal(res.status, 403, "非盒网段 ⇒ 拒（不做开放代理）")
    } finally {
      await guest.close()
    }
    assert.ok(proxy.stats.allowed >= 2 && proxy.stats.denied >= 3, "记数在场")
  } finally {
    await proxy.close()
    await target.close()
  }
})

// ── 腿 D（§4.1——链生成 ∥ 全量重算 ∥ 自检 ∥ 探测序）────────────────────────────

test("腿 D 网络层：nft 链生成（恒拒先 ∥ 规则序 ∥ INPUT 仅 proxyPort）∥ iptables 备 ∥ 自检", () => {
  const workspaces = [{
    id: 3, subnet: "172.18.0.0/16", gateway: "172.18.0.1",
    rules: [
      RULE(1, "domain", "allow", "x.test"), // 域名行不入网络层
      RULE(2, "cidr", "allow", "8.8.8.0/24", "default"),
      RULE(3, "cidr", "deny", "9.9.9.0/24", "admin"),
      RULE(4, "cidr", "allow", "10.1.0.0/16", "admin"),
      RULE(5, "cidr", "deny", "10.0.0.0/8", "default"),
    ],
  }]
  const text = NETFILTER.buildNftRuleset({ workspaces, proxyPort: 3128, serverAllow: [{ ip: "10.0.0.5", port: 8787 }] })
  const lines = text.split("\n")
  const at = (needle) => lines.findIndex((line) => line.includes(needle))
  assert.ok(text.includes("table ip tc_sandbox"), "表")
  assert.ok(text.includes("type filter hook forward priority -10; policy accept;"), "FORWARD 钩（先于 docker 规则）")
  assert.ok(text.includes("ip saddr 172.18.0.0/16 jump ws3_fwd"), "每工作区跳转（saddr 定域——不误伤他流）")
  assert.ok(at("127.0.0.0/8 drop") > at("established,related accept") && at("169.254.0.0/16 drop") > 0, "恒拒在场")
  assert.ok(at("127.0.0.0/8 drop") < at("10.0.0.5 tcp dport 8787 accept"), "恒拒先于内置允许")
  assert.ok(at("10.0.0.5 tcp dport 8787 accept") < at("9.9.9.0/24 drop"), "内置生命线先于规则行")
  assert.ok(at("9.9.9.0/24 drop") < at("10.1.0.0/16 accept"), "显式 deny 先于显式 allow")
  assert.ok(at("10.1.0.0/16 accept") < at("10.0.0.0/8 drop"), "显式 allow 先于种子 deny（U2）")
  assert.ok(at("10.0.0.0/8 drop") < at("8.8.8.0/24 accept"), "种子 deny 先于种子 allow")
  assert.ok(at("8.8.8.0/24 accept") < at("\t\tdrop"), "末条 drop（默认拒）")
  assert.ok(!text.includes("x.test"), "域名行不入网络层（代理层管）")
  const inputChain = text.slice(text.indexOf("chain ws3_in"), text.indexOf("chain ws3_in") + 300)
  assert.ok(inputChain.includes("tcp dport 3128 accept") && inputChain.includes("drop"), "INPUT：仅放行 → proxyPort")
  // iptables 备选
  const commands = NETFILTER.buildIptablesCommands({ workspaces, proxyPort: 3128, serverAllow: [{ ip: "10.0.0.5", port: 8787 }] })
  const flat = commands.map(([cmd, args]) => `${cmd} ${args.join(" ")}`)
  assert.ok(flat.some((line) => line.includes(`-A TC_WS3_FWD -d 127.0.0.0/8 -j DROP`)), "iptables 恒拒")
  assert.ok(flat.some((line) => line.includes(`-A TC_WS3_FWD -d 10.0.0.5 -p tcp --dport 8787 -j ACCEPT`)), "iptables 生命线")
  assert.ok(flat.some((line) => line.includes(`-A TC_WS3_FWD -j DROP`)), "iptables 末条 DROP")
  assert.ok(flat.some((line) => line.includes(`-A TC_SANDBOX_IN -s 172.18.0.0/16 -j TC_WS3_IN`)), "INPUT 侧链")
})

test("腿 D 全量重算幂等（nft 建表 ∥ iptables 建链容忍）∥ 自检 ∥ 探测序（nft 优先 ⇒ iptables 备 ⇒ 皆无 ⇒ 拒）", async () => {
  const calls = []
  const nftExec = async (cmd, args, opts = {}) => { calls.push({ cmd, args, input: opts.input }); return { code: 0, stdout: Buffer.from(""), stderr: EMPTY } }
  const applied = await NETFILTER.applyNetfilter({ exec: nftExec, tool: "nft", workspaces: [{ id: 1, subnet: "172.18.0.0/16", gateway: "172.18.0.1", rules: [] }], proxyPort: 3128, serverAllow: [] })
  assert.equal(applied.ok, true)
  assert.deepEqual(calls[0].args, ["delete", "table", "ip", "tc_sandbox"], "先删表（全量重算——不增量改链）")
  assert.equal(calls[1].args[0], "-f")
  assert.ok(calls[1].input.toString("utf8").includes("table ip tc_sandbox"), "整表重建（stdin 规则集）")
  // iptables 备：旧跳转有界删除（非零即止）+ 重建 + 顶插
  const iptCalls = []
  const iptExec = async (cmd, args) => {
    iptCalls.push({ cmd, args })
    if (args[0] === "-D") return { code: iptCalls.filter((item) => item.args[0] === "-D").length > 1 ? 1 : 0, stdout: EMPTY, stderr: EMPTY }
    return { code: 0, stdout: EMPTY, stderr: EMPTY }
  }
  const applied2 = await NETFILTER.applyNetfilter({ exec: iptExec, tool: "iptables", workspaces: [], proxyPort: 3128, serverAllow: [] })
  assert.equal(applied2.ok, true)
  assert.ok(iptCalls.some((item) => item.args.join(" ").includes("-I FORWARD 1 -j TC_SANDBOX_FWD")), "钩子顶插")
  // iptables 幂等面（建链 `-N` 已存在 ⇒ 非零——须容忍；否则第二次重算整体失败 ⇒ 规则增删不下地）
  const created = new Set()
  const idem = []
  const idemExec = async (cmd, args) => {
    idem.push([cmd, ...args].join(" "))
    if (args[0] === "-N") {
      if (created.has(args[1])) return { code: 1, stdout: EMPTY, stderr: Buffer.from("Chain already exists") }
      created.add(args[1])
      return { code: 0, stdout: EMPTY, stderr: EMPTY }
    }
    return { code: 0, stdout: EMPTY, stderr: EMPTY }
  }
  const wsArg = [{ id: 3, subnet: "172.18.0.0/16", gateway: "172.18.0.1", rules: [RULE(2, "cidr", "allow", "8.8.8.0/24", "admin")] }]
  const first = await NETFILTER.applyNetfilter({ exec: idemExec, tool: "iptables", workspaces: wsArg, proxyPort: 3128, serverAllow: [] })
  const second = await NETFILTER.applyNetfilter({ exec: idemExec, tool: "iptables", workspaces: wsArg, proxyPort: 3128, serverAllow: [] })
  assert.deepEqual([first.ok, second.ok], [true, true], "非空工作区连跑两次 ⇒ 两次 ok（链已在 ⇒ -N 容忍）")
  assert.ok(idem.filter((line) => line.includes("-A TC_WS3_FWD")).length >= 2, "第两次仍落规则行（非首道建链即中止）")
  // 自检
  const check = await NETFILTER.selfCheck({
    exec: async () => ({ code: 0, stdout: Buffer.from("table ip tc_sandbox {\n\tchain forward {\n\t}\n\tchain input {\n\t}\n\tchain ws1_fwd {\n\t}\n}"), stderr: EMPTY }),
    tool: "nft",
  })
  assert.deepEqual([check.ok, check.chains], [true, 3], "链计数在场")
  assert.equal((await NETFILTER.selfCheck({ exec: async () => ({ code: 1, stdout: EMPTY, stderr: EMPTY }), tool: "nft" })).ok, false)
  // 探测序
  const nftFirst = await NETFILTER.detectNetfilter({ exec: async (cmd) => ({ code: cmd === "nft" ? 0 : 1, stdout: EMPTY, stderr: EMPTY }) })
  assert.deepEqual([nftFirst.tool, nftFirst.ok], ["nft", true])
  const iptFallback = await NETFILTER.detectNetfilter({ exec: async (cmd) => ({ code: cmd === "iptables" ? 0 : 1, stdout: EMPTY, stderr: EMPTY }) })
  assert.deepEqual([iptFallback.tool, iptFallback.ok], ["iptables", true])
  const none = await NETFILTER.detectNetfilter({ exec: async () => ({ code: 1, stdout: EMPTY, stderr: EMPTY }) })
  assert.deepEqual([none.tool, none.ok], [null, false], "皆无 ⇒ doctor 核心项 FAIL ⇒ 拒跑")
  // 服务器网关解析（内置生命线）
  const entries = await NETFILTER.serverAllowEntries("http://gate.internal:8787", { lookupFn: async () => [{ address: "10.0.0.5", family: 4 }] })
  assert.deepEqual(entries, [{ ip: "10.0.0.5", port: 8787 }])
})

// ── 腿 E（§5——磁盘配额探测定序 ∥ 应用 ∥ 释放 ∥ doctor 门）────────────────────

test("腿 E 配额：探测定序（pquota/prjquota ⇒ loopback ⇒ null）∥ 应用/释放命令 ∥ doctor 核心项门", async () => {
  const execWith = (map) => async (cmd, args) => {
    const key = [cmd, ...args].join(" ")
    for (const [pattern, result] of Object.entries(map)) {
      if (key.includes(pattern)) return { code: 0, stdout: Buffer.from(result), stderr: EMPTY }
    }
    return { code: 1, stdout: EMPTY, stderr: EMPTY }
  }
  const xfs = await QUOTA.detectQuota({ exec: execWith({ "findmnt": "xfs rw,relatime,attr2,pquota /srv", "losetup": "x" }), workspaceRoot: "/srv" })
  assert.equal(xfs.mechanism, "project", "xfs pquota ⇒ 项目配额")
  const ext4 = await QUOTA.detectQuota({ exec: execWith({ "findmnt": "ext4 rw,relatime,prjquota /srv" }), workspaceRoot: "/srv" })
  assert.equal(ext4.mechanism, "project")
  const noQuota = await QUOTA.detectQuota({ exec: execWith({ "findmnt": "ext4 rw,relatime /srv", "losetup": "losetup 2.39", "mkfs.ext4": "mke2fs 1.47" }), workspaceRoot: "/srv" })
  assert.equal(noQuota.mechanism, "loopback", "无项目配额 ⇒ loopback 备选")
  const none = await QUOTA.detectQuota({ exec: execWith({ "findmnt": "ext4 rw,relatime /srv" }), workspaceRoot: "/srv" })
  assert.equal(none.mechanism, null, "无一可用 ⇒ null（拒跑）")
  // 应用（项目配额——ext4：chattr -p + +P + setquota；blocks = diskMb×1024）
  const runs = []
  const applyExec = async (cmd, args) => { runs.push([cmd, ...args].join(" ")); return { code: 0, stdout: EMPTY, stderr: EMPTY } }
  const applied = await QUOTA.applyQuota({ mechanism: "project", workspaceId: 7, volumePath: "/srv/ws7", diskMb: 2048, fsType: "ext4", mountPoint: "/srv", exec: applyExec })
  assert.deepEqual([applied.ok, applied.projectId], [true, 10007])
  assert.deepEqual(runs, ["chattr -p 10007 /srv/ws7", "chattr +P /srv/ws7", "setquota -P 10007 0 2097152 0 0 /srv"], "项目配额命令序（限额 = 2048×1024 KiB 块）")
  const failed = await QUOTA.applyQuota({ mechanism: "project", workspaceId: 7, volumePath: "/srv/ws7", diskMb: 2048, exec: async () => ({ code: 1, stdout: EMPTY, stderr: Buffer.from("denied") }) })
  assert.equal(failed.ok, false, "应用失败 ⇒ 拒建盒（不降级）")
  assert.equal((await QUOTA.applyQuota({ mechanism: null, workspaceId: 1, volumePath: "/x", diskMb: 1, exec: applyExec })).ok, false, "无机制 ⇒ 拒")
  // loopback 备选
  const loopRuns = []
  await QUOTA.applyQuota({ mechanism: "loopback", workspaceId: 2, volumePath: "/srv/ws2", diskMb: 512, exec: async (cmd, args) => { loopRuns.push([cmd, ...args].join(" ")); return { code: 0, stdout: EMPTY, stderr: EMPTY } } })
  assert.deepEqual(loopRuns, ["truncate -s 512M /srv/ws2.img", "mkfs.ext4 -F -q /srv/ws2.img", "mount -o loop /srv/ws2.img /srv/ws2"])
  const released = await QUOTA.releaseQuota({ mechanism: "loopback", workspaceId: 2, volumePath: "/srv/ws2", exec: async () => ({ code: 0, stdout: EMPTY, stderr: EMPTY }) })
  assert.deepEqual(released.commands.map(([cmd]) => cmd), ["umount", "rm"], "destroy 释放（loop 卸载删文件）")
  // doctor 核心项门：无配额机制 ⇒ 整体 FAIL（拒跑——E32）
  const doctor = await RUNTIME.doctorChecks({
    exec: execWith({ "ip": "", "timedatectl": "yes" }), config: { workspaceRoot: "/srv", image: "x" },
    runtime: { engine: "docker", version: "24", ok: true }, netfilter: { tool: "nft", ok: true }, quota: { mechanism: null, detail: "无" },
  })
  const quotaItem = doctor.items.find((item) => item.no === 4)
  assert.deepEqual([doctor.ok, quotaItem.pass, quotaItem.level], [false, false, "core"], "无配额机制 ⇒ 核心项 FAIL ⇒ 拒跑")
})

// ── 腿 F（§6——真 git：打包 ∥ 不动工作区 ∥ 恢复）──────────────────────────────

test("腿 F 检查点：dirty 判据 ∥ 打包（不动工作区 ∥ 未跟踪入包 ∥ 纯未跟踪独占面）∥ 恢复（新克隆套用）∥ 跳过面", async () => {
  const base = tempDir("ckpt-src-")
  const clone = tempDir("ckpt-clone-")
  const plain = mkdtempSync(join(tmpdir(), "ckpt-plain-")) // 非 git 面须在仓外（`rev-parse` 会向上找仓）
  try {
    gitIn(base, ["init", "-q"])
    writeFileSync(join(base, "tracked.txt"), "v1\n")
    gitIn(base, ["add", "."])
    gitIn(base, ["commit", "-q", "-m", "init"])
    assert.equal(await CHECKPOINT.gitDirty(base), false, "干净仓 ⇒ false")
    assert.equal(await CHECKPOINT.gitDirty(plain), false, "非 git ⇒ false（无保护面）")
    assert.deepEqual(await CHECKPOINT.packCheckpoint(plain), { skipped: true, reason: "no_git" })
    assert.deepEqual(await CHECKPOINT.packCheckpoint(base), { skipped: true, reason: "clean" })
    // dirty：改跟踪文件 + 未跟踪文件（含子目录）
    writeFileSync(join(base, "tracked.txt"), "v2-dirty\n")
    mkdirSync(join(base, "sub"), { recursive: true })
    writeFileSync(join(base, "sub/new.txt"), "untracked-content\n")
    assert.equal(await CHECKPOINT.gitDirty(base), true)
    const statusBefore = gitIn(base, ["status", "--porcelain"])
    const headBefore = gitIn(base, ["rev-parse", "HEAD"])
    const packed = await CHECKPOINT.packCheckpoint(base)
    assert.equal(packed.skipped, false, JSON.stringify(packed))
    assert.equal(gitIn(base, ["status", "--porcelain"]), statusBefore, "打包不动工作区（含未跟踪清单不变）")
    assert.equal(gitIn(base, ["rev-parse", "HEAD"]), headBefore, "HEAD 不动（stash create——非 stash push）")
    assert.deepEqual(packed.manifest.untracked, ["sub/new.txt"])
    assert.equal(readFileSync(join(base, "tracked.txt"), "utf8"), "v2-dirty\n")
    // 恢复：新克隆套用
    gitIn(process.cwd(), ["clone", "-q", base, clone])
    const restored = await CHECKPOINT.restoreCheckpoint(clone, packed.bytes)
    assert.deepEqual([restored.ok, restored.restoredFiles], [true, 1])
    const lf = (text) => text.replace(/\r\n/g, "\n") // Windows 检出（autocrlf）⇒ 归一比较
    assert.equal(lf(readFileSync(join(clone, "tracked.txt"), "utf8")), "v2-dirty\n", "stash apply ⇒ 跟踪改动还原")
    assert.equal(readFileSync(join(clone, "sub/new.txt"), "utf8"), "untracked-content\n", "未跟踪文件还原")
    // 包形往返（纯函数）
    const decoded = CHECKPOINT.decodePackage(packed.bytes)
    assert.equal(decoded.manifest.stash, packed.stash)
    assert.ok(decoded.pack.length > 0, "对象包在场")
    // 纯未跟踪改动：`stash create` 恒空（不含未跟踪）⇒ 未跟踪项仍须入包（与 dirty 面同拍）
    const onlyUntracked = tempDir("ckpt-untracked-")
    const onlyClone = tempDir("ckpt-untracked-clone-")
    try {
      gitIn(onlyUntracked, ["init", "-q"])
      writeFileSync(join(onlyUntracked, "seed.txt"), "seed\n")
      gitIn(onlyUntracked, ["add", "."])
      gitIn(onlyUntracked, ["commit", "-q", "-m", "init"])
      writeFileSync(join(onlyUntracked, "fresh.txt"), "fresh-content\n")
      assert.equal(await CHECKPOINT.gitDirty(onlyUntracked), true, "纯未跟踪 ⇒ dirty")
      const packedOnly = await CHECKPOINT.packCheckpoint(onlyUntracked)
      assert.deepEqual([packedOnly.skipped, packedOnly.stash], [false, null], "stash 空（无跟踪改动）——未跟踪仍入包")
      assert.deepEqual(packedOnly.manifest.untracked, ["fresh.txt"])
      gitIn(process.cwd(), ["clone", "-q", onlyUntracked, onlyClone])
      const restoredOnly = await CHECKPOINT.restoreCheckpoint(onlyClone, packedOnly.bytes)
      assert.deepEqual([restoredOnly.ok, readFileSync(join(onlyClone, "fresh.txt"), "utf8")], [true, "fresh-content\n"], "未跟踪独占包可恢复（无 stash 半支）")
    } finally {
      rmSync(onlyUntracked, { recursive: true, force: true })
      rmSync(onlyClone, { recursive: true, force: true })
    }
    assert.throws(() => CHECKPOINT.decodePackage(Buffer.from("junk")), /格式不符|incorrect header|unexpected/, "坏包 ⇒ 抛")
    // 超限跳过（B40——200 MiB 缺省；替身以小阈验证同支）
    const tooLarge = await CHECKPOINT.packCheckpoint(base, { maxBytes: 32 })
    assert.deepEqual([tooLarge.skipped, tooLarge.reason], [true, "too_large"])
  } finally {
    rmSync(base, { recursive: true, force: true })
    rmSync(clone, { recursive: true, force: true })
    rmSync(plain, { recursive: true, force: true })
  }
})
