/**
 * probe.mjs — 红队探针套件执行器（sandbox/RUNNER.md §10；期望读数表 = sandbox/SANDBOX.md §12——单源，本档只实现）。
 * 跑法 = `thincoder-runner probe --workspace <id> [--probe Pn] [--host <域>] [--target <ip:port>] [--expect <值>]`
 * ——盒内执行 + 本机检查，逐条 PASS/FAIL（环境不可考时 SKIP——如实，不装通过）。
 * 读数真值面：真机运行留档 = 收口轮（P1–P14 皆真机项——本档不产生读数）。
 */
import { readFileSync } from "node:fs"

import { diskFreeMb } from "./runtime.mjs"

/** 盒内 env 白名单（P8——结构判据：密钥形态扫描 + env 白名单比对；canary 真值不下行 runner）。
 *  面 = 注入面（`HOME`/`OPENAI_*`/`HTTP(S)_PROXY`（两形）/`NO_PROXY`/`TC_*`——`RUNNER.md` §3 env 行）∪ 镜像固有面（`PATH`/`HOSTNAME`/`PWD`/`SHLVL`/`_`/`TERM`/`LANG`——基础镜像自带，非注入项）。
 *  `NO_PROXY` = 生命线直连（server 网关不经闸——否则 netfilter 内置允许行无意义）；`http(s)_proxy` 小写形 = 工具链兼容面。 */
export const BOX_ENV_ALLOWED = Object.freeze([
  "HOME", "OPENAI_BASE_URL", "OPENAI_API_KEY", "HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy",
  "NO_PROXY", "no_proxy", "TC_WORKSPACE_ID", "TC_BASE_URL", "TC_GATE_PROXY", "TC_SANDBOX",
  "PATH", "HOSTNAME", "PWD", "SHLVL", "_", "TERM", "LANG",
])

/** 密钥形态（P8 文件面扫描——`sk-` 族 + 长随机串）。 */
export const SECRET_PATTERN = "sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{40,}"

const commandText = (result) => `${(result.stdout ?? Buffer.alloc(0)).toString("utf8")}${(result.stderr ?? Buffer.alloc(0)).toString("utf8")}`

/** 探针定义（`run(ctx)` ⇒ `{ state, detail }`；state ∈ pass ∥ fail ∥ skip）。 */
export const PROBES = [
  {
    id: "P1", title: "宿主文件面不可达",
    async run(ctx) {
      const box = await ctx.execBox("sh -lc 'cat /etc/shadow 2>&1; echo \"---\"; cat /etc/passwd | cut -d: -f1'")
      const text = commandText(box)
      const [shadowPart, passwdPart = ""] = text.split("---")
      const shadowDenied = /permission denied|no such file|拒绝|not permitted/i.test(shadowPart ?? "")
      const boxNames = new Set(passwdPart.split(/\s+/).filter((item) => item !== ""))
      const hostNames = hostUserNames()
      const leaked = hostNames.filter((name) => boxNames.has(name))
      if (!shadowDenied) return { state: "fail", detail: `/etc/shadow 可读（应拒）` }
      if (leaked.length > 0) return { state: "fail", detail: `宿主用户名命中盒内 passwd：${leaked.join(" ∥ ")}` }
      return { state: "pass", detail: `shadow 拒 ∥ 宿主用户名零命中（对照 ${hostNames.length} 个）` }
    },
  },
  {
    id: "P2", title: "curl 本机端口拒",
    async run(ctx) {
      if (!ctx.gateway) return { state: "skip", detail: "缺盒网关地址（network inspect 未给）" }
      const res = await ctx.execBox(`sh -lc 'curl -m 3 -sS -o /dev/null http://${ctx.gateway}:22; echo EXIT=$?'`)
      const text = commandText(res)
      if (/EXIT=0/.test(text)) return { state: "fail", detail: `宿主 22 端口可达（${text.trim()}）` }
      return { state: "pass", detail: `宿主 22 端口拒（${text.trim().split("\n").at(-1)}——盒内 127.0.0.1 恒为盒自身）` }
    },
  },
  {
    id: "P3", title: "云元数据拒",
    async run(ctx) {
      const res = await ctx.execBox("sh -lc 'curl -m 3 -sS -o /dev/null http://169.254.169.254/; echo EXIT=$?'")
      return /EXIT=0/.test(commandText(res))
        ? { state: "fail", detail: "169.254.169.254 可达（应恒拒）" }
        : { state: "pass", detail: `169.254.169.254 拒（${commandText(res).trim().split("\n").at(-1)}）` }
    },
  },
  {
    id: "P4", title: "非白名单出站拒（挂起 ⇒ 超时 ⇒ 403）",
    async run(ctx) {
      const host = ctx.args.host ?? "unlisted-probe.example.com"
      const window = Math.max(ctx.pendingTimeoutSeconds ?? 60, 5) + 10
      const res = await ctx.execBox(`sh -lc 'curl -m ${window} -sS -o /dev/null https://${host}; echo EXIT=$?'`, { timeoutMs: (window + 5) * 1000 })
      const text = commandText(res)
      if (/EXIT=0/.test(text)) return { state: "fail", detail: `${host} 放行（应挂起 ⇒ 拒）` }
      return { state: "pass", detail: `${host} 拒（挂起窗后 403——${text.trim().split("\n").at(-1)}）` }
    },
  },
  {
    id: "P5", title: "fork 炸弹被杀",
    async run(ctx) {
      await ctx.execBox("sh -lc ':(){ :|:& };:' || true", { timeoutMs: 15000 }).catch(() => {})
      const boxes = await ctx.runtime.listBoxes()
      const alive = boxes.some((item) => item.workspaceId === ctx.workspaceId && item.state === "running")
      const limit = await ctx.runtime.execBox(ctx.box.containerId, { command: ["sh", "-lc", "cat /sys/fs/cgroup/pids.max 2>/dev/null || echo n/a"], maxBytes: 4096 })
      const pidsMax = commandText(limit).trim().split("\n").at(-1)
      if (!alive) return { state: "fail", detail: "盒未存活（pids-limit 未兜住）" }
      return { state: "pass", detail: `盒存活；pids.max = ${pidsMax}` }
    },
  },
  {
    id: "P6", title: "写 / 拒（read-only 根）",
    async run(ctx) {
      const res = await ctx.execBox("sh -lc 'touch /x; echo EXIT=$?'")
      return /EXIT=0/.test(commandText(res))
        ? { state: "fail", detail: "根文件系统可写（`touch /x` 成功）" }
        : { state: "pass", detail: `根只读（${commandText(res).trim().split("\n").at(-1)}）` }
    },
  },
  {
    id: "P7", title: "填盘拒（配额处 ENOSPC）",
    async run(ctx) {
      const diskMb = Number(ctx.box.limits?.diskMb) > 0 ? Number(ctx.box.limits.diskMb) : 4096
      const freeBefore = await diskFreeMb(ctx.volumePath)
      const res = await ctx.execBox(`sh -lc 'dd if=/dev/zero of=/workspace/.tc-probe-fill bs=1M count=${diskMb * 2} 2>&1; echo EXIT=$?; rm -f /workspace/.tc-probe-fill'`, { timeoutMs: 300000 })
      const text = commandText(res)
      const freeAfter = await diskFreeMb(ctx.volumePath)
      if (/EXIT=0/.test(text)) return { state: "fail", detail: "超配额写入成功（ENOSPC 未触发）" }
      const hostIntact = freeBefore === null || freeAfter === null || freeAfter > freeBefore - diskMb * 2
      if (!hostIntact) return { state: "fail", detail: `宿主盘被写破（余量 ${freeBefore} ⇒ ${freeAfter} MB）` }
      return { state: "pass", detail: `写入被拒（ENOSPC）；宿主余量 ${freeBefore} ⇒ ${freeAfter} MB` }
    },
  },
  {
    id: "P8", title: "盒内零密钥断言（结构判据）",
    async run(ctx) {
      const env = await ctx.execBox("sh -lc 'printenv'")
      const envNames = commandText(env).split("\n").map((line) => line.split("=")[0]).filter((name) => name !== "")
      const extra = envNames.filter((name) => !BOX_ENV_ALLOWED.includes(name))
      if (extra.length > 0) return { state: "fail", detail: `白名单外环境变量：${extra.join(" ∥ ")}` }
      if (!envNames.includes("OPENAI_API_KEY")) return { state: "fail", detail: "工作区 key 不在场（应然——OPENAI_API_KEY）" }
      // 排除面 = 依赖/锁档/仓面（lockfile integrity 与哈希串非密钥形态——免假阳；真密钥形态 = `sk-` 族）
      const scan = await ctx.execBox(`sh -lc 'grep -rInE "${SECRET_PATTERN}" /workspace /tmp /etc --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.npm --exclude=package-lock.json --exclude=*.lock --exclude=*.map 2>/dev/null | head -n 20'`, { timeoutMs: 120000 })
      const hits = commandText(scan).split("\n").filter((line) => line.trim() !== "")
      if (hits.length > 0) return { state: "fail", detail: `文件面密钥形态命中 ${hits.length} 处：${hits[0].slice(0, 120)}` }
      return { state: "pass", detail: `env 白名单外零项（${envNames.length} 项）；文件面零密钥形态命中（canary 真值不下行）` }
    },
  },
  {
    id: "P9", title: "跨工作区读拒",
    async run(ctx) {
      const others = (await ctx.runtime.listBoxes()).filter((item) => item.workspaceId !== null && item.workspaceId !== ctx.workspaceId)
      if (others.length === 0) return { state: "skip", detail: "本机无第二盒（跨工作区面需两台）" }
      const other = others[0]
      // ① 卷路径面（宿主路径在盒内不存在——盒只挂自己的卷）：本盒 `ls` 他盒卷路径 ⇒ ENOENT
      const otherVolume = ctx.volumePathOf ? ctx.volumePathOf(other.workspaceId) : null
      let pathProbe = { state: "skip", detail: "无他盒卷路径读数" }
      if (otherVolume) {
        const listed = await ctx.execBox(`sh -lc 'ls -d ${otherVolume} 2>&1; echo EXIT=$?'`)
        const text = commandText(listed)
        pathProbe = /EXIT=0/.test(text)
          ? { state: "fail", detail: `他盒卷路径可达（${otherVolume}）` }
          : { state: "pass", detail: `他盒卷路径不可达（${otherVolume}——ENOENT）` }
      }
      // ② 网络面（每工作区独立网络）：本盒访问他盒容器地址 ⇒ 不可达
      const otherIp = ctx.ipOf ? await ctx.ipOf(other) : null
      let netProbe = { state: "skip", detail: "第二盒无 IP 读数" }
      if (otherIp) {
        const res = await ctx.execBox(`sh -lc 'curl -m 3 -sS -o /dev/null http://${otherIp}:80; echo EXIT=$?'`)
        netProbe = /EXIT=0/.test(commandText(res))
          ? { state: "fail", detail: `跨工作区可达（${otherIp}）` }
          : { state: "pass", detail: `跨工作区不可达（${otherIp}——每工作区独立网络）` }
      }
      if (pathProbe.state === "fail" || netProbe.state === "fail") return { state: "fail", detail: `${pathProbe.detail} ∥ ${netProbe.detail}` }
      if (pathProbe.state === "skip" && netProbe.state === "skip") return { state: "skip", detail: "卷路径与网络地址两面均无读数" }
      return { state: "pass", detail: `${pathProbe.detail} ∥ ${netProbe.detail}` }
    },
  },
  {
    id: "P10", title: "正常开发链通过（拉仓 ⇒ 装依赖 ⇒ 网关模型调用）",
    async run(ctx) {
      const repo = ctx.args.repo
      if (!repo) return { state: "skip", detail: "缺 --repo <仓地址>（拉仓步需真仓）" }
      const steps = [
        [`git clone --depth 1 ${repo} /workspace/repo`, "拉仓"],
        ["cd /workspace/repo && npm install --no-audit --no-fund", "npm install"],
        ["cd /workspace/repo && npm test", "npm test"],
        ['curl -sS -m 30 -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OPENAI_API_KEY" "$OPENAI_BASE_URL/models"', "网关模型调用"],
      ]
      const detail = []
      for (const [command, name] of steps) {
        const res = await ctx.execBox(`sh -lc '${command}'`, { timeoutMs: 600000 })
        const ok = res.exitCode === 0
        detail.push(`${name}=${ok ? "ok" : `fail(${commandText(res).trim().slice(0, 80)})`}`)
        if (!ok) return { state: "fail", detail: detail.join(" ∥ ") }
      }
      return { state: "pass", detail: `${detail.join(" ∥ ")}（停/起盒文件在场面 = §12 步 5——人工核对）` }
    },
  },
  {
    id: "P11", title: "规则热生效（两相位观察）",
    async run(ctx) {
      const target = ctx.args.target
      if (!target) return { state: "skip", detail: "缺 --target <host:port>（两相位观察——窗内于控制台改规则）" }
      const waitSeconds = Number(ctx.args.wait) > 0 ? Number(ctx.args.wait) : 20
      const probeOnce = async () => {
        const res = await ctx.execBox(`sh -lc 'curl -m 5 -sS -o /dev/null http://${target}/; echo EXIT=$?'`, { timeoutMs: 15000 })
        return /EXIT=0/.test(commandText(res))
      }
      const before = await probeOnce()
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000)) // 窗内：控制台改规则（不重建盒）
      const after = await probeOnce()
      if (before === after) return { state: "fail", detail: `两相位读数相同（${before ? "通" : "断"}——规则未变或未生效）` }
      return { state: "pass", detail: `热生效观察成立：${before ? "通" : "断"} ⇒ ${after ? "通" : "断"}（窗 ${waitSeconds}s）` }
    },
  },
  {
    id: "P12", title: "待批三态（单相位——窗内于控制台裁定）",
    async run(ctx) {
      const host = ctx.args.host ?? "pending-probe.example.com"
      const expect = ctx.args.expect ?? "deny"
      const window = Math.max(ctx.pendingTimeoutSeconds ?? 60, 5) + 10
      const res = await ctx.execBox(`sh -lc 'curl -m ${window} -sS -o /dev/null https://${host}; echo EXIT=$?'`, { timeoutMs: (window + 5) * 1000 })
      const reached = /EXIT=0/.test(commandText(res))
      if (expect === "deny" || expect === "timeout") {
        return reached ? { state: "fail", detail: `期望拒（${expect}）但放行` } : { state: "pass", detail: `拒态观察成立（${expect}——${commandText(res).trim().split("\n").at(-1)}）` }
      }
      return reached
        ? { state: "pass", detail: `放行观察成立（${expect}——当次通过）` }
        : { state: "fail", detail: `期望放行（${expect}）但被拒` }
    },
  },
  {
    id: "P13", title: "吊销即断 ∥ 轮换重建（单相位——窗内于控制台轮换）",
    async run(ctx) {
      const expect = ctx.args.expect ?? "before"
      const res = await ctx.execBox('sh -lc \'curl -sS -m 30 -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OPENAI_API_KEY" "$OPENAI_BASE_URL/models"\'', { timeoutMs: 60000 })
      const code = commandText(res).trim().split("\n").at(-1)
      if (expect === "after") {
        return code === "401"
          ? { state: "pass", detail: `旧 key 已断（401）——重建后新 key 可用面由控制台「用量归新 key 行」核对` }
          : { state: "fail", detail: `期望 401（旧 key 即断），实读 ${code}` }
      }
      return code !== "401" ? { state: "pass", detail: `吊销前可用（${code}）` } : { state: "fail", detail: `吊销前即 401（key 未生效？）` }
    },
  },
  {
    id: "P14", title: "无 runner 不可用（服务端读数面）",
    async run() {
      return { state: "skip", detail: "读数 = 控制台/端点（停本 runner 后核 disabled + 503 `sandbox_unavailable`）——不在盒内面" }
    },
  },
]

/** 宿主用户名单（P1 对照——uid ≥ 1000 的本地账户）。 */
export function hostUserNames(path = "/etc/passwd") {
  try {
    return readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.split(":"))
      .filter((parts) => Number(parts[2]) >= 1000)
      .map((parts) => parts[0])
  } catch {
    return []
  }
}

/**
 * 逐条执行（缺省全量；`ids` 限定）。`ctx.execBox` = 盒内执行（文本读回）；`ctx.runtime`/`ctx.box`/`ctx.volumePath`
 * ∥ `ctx.gateway` ∥ `ctx.args` ∥ `ctx.pendingTimeoutSeconds` ∥ `ctx.ipOf`（他盒容器 IP）∥ `ctx.volumePathOf`（他盒卷路径）由调用方装配。
 */
export async function runProbes(ctx, ids = null) {
  const wanted = ids && ids.length > 0 ? PROBES.filter((probe) => ids.includes(probe.id)) : PROBES
  const results = []
  for (const probe of wanted) {
    try {
      const result = await probe.run(ctx)
      results.push({ id: probe.id, title: probe.title, ...result })
    } catch (e) {
      results.push({ id: probe.id, title: probe.title, state: "fail", detail: `执行异常：${e.message}` })
    }
  }
  return results
}

/** 行形（收口轮留档）：`P1 PASS 宿主文件面不可达——details`。 */
export function formatProbeLine(result) {
  return `${result.id} ${String(result.state).toUpperCase()} ${result.title}——${result.detail}`
}
