/**
 * onboarding.mjs — 托管接入任务面（sandbox/SANDBOX.md §3「托管接入」∥ §14 KD-SV-83/84/86；runner-admin-console 批——台账 #1236）：
 * 任务生命周期（起/收尾/重启恢复 `interrupted`）∥ 凭据加解密（AES-256-GCM + `data/credentials.key` 0600 + 默认用完即弃）
 * ∥ 步骤日志（S1–S8——读数面）∥ 任务简报文 ∥ agent 环装配桥（`src/agent/run.mjs` ∥ `src/agent/tools.mjs`）。
 *
 * 口径（§3）：S1 受理落 run 行（凭据入密）⇒ S2–S7 = agent 逐案执行（探明 → 决定 → 执行 → 验证——非固定脚本，KD-SV-83）
 * ⇒ S8 收尾（终态行 + 审计 + 凭据按模式处置）。进度 = 读时轮询（无后台常驻——KD-SV-86）；同主机在途任务 ≤ 1。
 * 审计（五 kind——accounts/ACCOUNTS.md §2.1）：`onboarding_start` ∥ `onboarding_exec`（每命令/调用：原文 ∥ 退出码/结果码 ∥ 摘要——秘密掩蔽后）
 * ∥ `onboarding_done` ∥ `onboarding_failed`（停步 + 原因）∥ `onboarding_credential_revoke`。
 */
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { dirname, join } from "node:path"

import { recordAudit } from "../accounts/audit.mjs"
import { findMemberById } from "../accounts/members.mjs"
import { createSshExecutor, hasSshpass, removeKeyFile, sshDir } from "./ssh.mjs"
import { createOnboardingTools } from "../agent/tools.mjs"
import { DEFAULT_MAX_CALLS, DEFAULT_MAX_DURATION_MS, buildModelExit, runAgentTask } from "../agent/run.mjs"

/** 步骤骨架 id（§3 步骤表——期望骨架；agent 按实况定形/跳步——KD-SV-83）。 */
export const STEP_IDS = Object.freeze(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"])

/** 探明脚本（S2——读数十项；agent 可加探，本脚本 = 骨架推荐形）。 */
export const PROBE_SCRIPT = [
  "echo OS=$( (. /etc/os-release 2>/dev/null; echo \"$PRETTY_NAME\") 2>/dev/null || uname -s )",
  "echo KERNEL=$(uname -r) ARCH=$(uname -m)",
  "echo CGROUP=$(stat -fc %T /sys/fs/cgroup 2>/dev/null || echo unknown)",
  "echo MEM_MB=$(free -m 2>/dev/null | awk '/Mem:/{print $2}')",
  "echo DISK_FREE_MB=$(df -Pm / 2>/dev/null | awk 'NR==2{print $4}')",
  "echo SYSTEMD=$(command -v systemctl >/dev/null 2>&1 && echo present || echo absent)",
  "echo SUDO_N=$(sudo -n true 2>/dev/null && echo ok || echo denied)",
  "echo DOCKER=$(command -v docker >/dev/null 2>&1 && docker version --format '{{.Server.Version}}' 2>/dev/null || echo absent)",
  "echo LISTEN_2375=$( (curl -s -m 2 http://127.0.0.1:2375/version || wget -qO- -T 2 http://127.0.0.1:2375/version) 2>/dev/null | head -c 40 || echo absent )",
  "echo PKG=$(command -v apt-get >/dev/null 2>&1 && echo apt || (command -v dnf >/dev/null 2>&1 && echo dnf || (command -v yum >/dev/null 2>&1 && echo yum || (command -v zypper >/dev/null 2>&1 && echo zypper || (command -v apk >/dev/null 2>&1 && echo apk || echo unknown)))))",
  "echo NET=$(getent hosts deb.debian.org >/dev/null 2>&1 && echo ok || echo unknown)",
].join("\n")

/** 数据目录（keyfile ∥ known_hosts ∥ credentials.key 落点——容器重建不丢；§3）。 */
export function dataDir(config = {}) {
  const dbPath = typeof config.db === "string" && config.db.trim() !== "" ? config.db.trim() : "data/gateway.db"
  return dirname(dbPath) === "." ? "data" : dirname(dbPath)
}

/** 凭据加密密钥（KD-SV-84）：`data/credentials.key`——32 字节随机 ∥ 首用生成 ∥ 0600 ∥ 不落库。 */
export function loadOrCreateCredentialKey(keyPath) {
  try {
    const existing = readFileSync(keyPath)
    if (existing.length >= 32) return existing.subarray(0, 32)
  } catch {
    /* 首用——下方生成 */
  }
  const key = randomBytes(32)
  mkdirSync(dirname(keyPath), { recursive: true })
  writeFileSync(keyPath, key, { mode: 0o600 })
  chmodSync(keyPath, 0o600)
  return key
}

/** AES-256-GCM 加密（出 = `iv|tag|ct` —— base64 三段——§2 v13 段存储形）。 */
export function encryptSecret(plaintext, key) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()])
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join("|")
}

/** AES-256-GCM 解密（形不合/篡改 ⇒ 抛——调用方转任务失败）。 */
export function decryptSecret(payload, key) {
  const parts = String(payload ?? "").split("|")
  if (parts.length !== 3) throw new Error("凭据密文形非法（iv|tag|ct）")
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[0], "base64"))
  decipher.setAuthTag(Buffer.from(parts[1], "base64"))
  return Buffer.concat([decipher.update(Buffer.from(parts[2], "base64")), decipher.final()]).toString("utf8")
}

function parseSteps(text) {
  try {
    const value = JSON.parse(text ?? "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function auditActorOf(db, run) {
  const member = run.created_by === null || run.created_by === undefined ? null : findMemberById(db, run.created_by)
  return member?.name ?? "onboarding"
}

/** 任务读数（§2.5 托管接入行形）：列表 = 步骤无读数；详情 = 携 `steps[].readings`。零秘密字段。 */
export function runView(row, { detail = false } = {}) {
  const steps = parseSteps(row.steps_json)
  return {
    id: row.id,
    host: row.host,
    sshUser: row.ssh_user,
    name: row.name,
    status: row.status,
    step: row.step,
    steps: detail ? steps : steps.map((entry) => ({ id: entry.id, status: entry.status })),
    credential: { mode: row.credential_mode, state: row.credential_state },
    runnerId: row.runner_id,
    startedAt: row.created_at,
    finishedAt: row.finished_at,
  }
}

/** 追加一步（S1–S8——读数面；`step` 列随动 = 当前/最后一步）。 */
export function appendStep(db, runId, stepId, entry = {}) {
  const row = db.prepare("SELECT steps_json FROM sandbox_onboarding WHERE id = ?").get(Number(runId))
  if (!row) return
  const steps = parseSteps(row.steps_json)
  steps.push({ id: stepId, status: entry.status ?? "done", note: entry.note ?? null, readings: entry.readings ?? null, at: new Date().toISOString() })
  db.prepare("UPDATE sandbox_onboarding SET steps_json = ?, step = ? WHERE id = ?").run(JSON.stringify(steps), stepId, Number(runId))
}

/**
 * 任务面服务（§3）：`deps` = 注入口径（批内件/假件——`chat` 模型替身 ∥ `execImpl` SSH 替身 ∥ `fetchImpl` Docker 替身 ∥
 * `hasSshpass` 前置替身 ∥ `budget` 预算覆盖；缺省 = 生产行为不变）。
 */
export function createOnboardingService({ db, config = {}, deps = {}, now = Date.now, log = null } = {}) {
  if (!db) throw new Error("createOnboardingService：缺少 db")
  const baseDir = dataDir(config)
  const keyPath = join(baseDir, "credentials.key")
  const keyFileOf = (runId) => join(sshDir(baseDir), `onboarding-${runId}.key`)
  const budget = { maxCalls: deps.budget?.maxCalls ?? DEFAULT_MAX_CALLS, maxDurationMs: deps.budget?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS }

  /** 凭据零化（burn ∥ 中断收尾——密列 NULL + 状态 burned）。 */
  function burnCredential(runId) {
    db.prepare("UPDATE sandbox_onboarding SET secret_cipher = NULL, sudo_cipher = NULL, credential_state = 'burned' WHERE id = ?").run(Number(runId))
  }

  function finalize(runId, { status, terminal, runnerId = null, extraNote = null }) {
    const row = db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(Number(runId))
    if (!row) return
    const stoppedAt = terminal?.step ?? row.step ?? "S8" // 停在哪步（终态读数面：S8 = 收尾条目，非「停步」）
    appendStep(db, runId, "S8", {
      status: status === "succeeded" ? "done" : "failed",
      note: extraNote,
      readings: {
        result: status,
        summary: terminal?.summary ?? extraNote ?? null,
        ...(runnerId ? { runnerId } : {}),
        ...(terminal?.readings && typeof terminal.readings === "object" ? terminal.readings : {}),
      },
    })
    // `step` 列 = 停在哪步（appendStep 会把它推到 S8——此处按终态收正；成功兼 report.step = S8）
    db.prepare("UPDATE sandbox_onboarding SET status = ?, step = ?, runner_id = ?, finished_at = ? WHERE id = ?").run(status, stoppedAt, runnerId, new Date(now()).toISOString(), Number(runId))
    if (row.credential_mode === "burn") burnCredential(runId)
    const actor = auditActorOf(db, row)
    if (status === "succeeded") {
      recordAudit(db, { type: "sandbox_event", actor, target: row.host, detail: { kind: "onboarding_done", runId: row.id, runnerId }, ts: now() })
    } else {
      recordAudit(db, {
        type: "sandbox_event",
        actor,
        target: row.host,
        detail: { kind: "onboarding_failed", runId: row.id, step: stoppedAt, reason: terminal?.summary ?? extraNote ?? "未知原因" },
        ts: now(),
      })
    }
  }

  async function executeRun(runId) {
    const row = db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(Number(runId))
    if (!row || row.status !== "running") return
    const key = loadOrCreateCredentialKey(keyPath)
    let auth
    try {
      auth = {
        host: row.host,
        port: row.ssh_port,
        user: row.ssh_user,
        authKind: row.auth_kind,
        secret: row.secret_cipher ? decryptSecret(row.secret_cipher, key) : "",
        sudoSecret: row.sudo_cipher ? decryptSecret(row.sudo_cipher, key) : null,
      }
    } catch (e) {
      finalize(runId, { status: "failed", terminal: { ok: false, summary: `凭据解密失败：${e.message}`, step: "S1", readings: null } })
      return
    }
    // S2 前置：密码形先检本机 sshpass（缺 ⇒ 停 + 报因；宿主零变——§3 宿主前提）
    if (auth.authKind === "password") {
      const present = deps.hasSshpass ? await deps.hasSshpass() : await hasSshpass({ ...(deps.execImpl ? { execImpl: deps.execImpl } : {}) })
      if (!present) {
        appendStep(db, runId, "S2", { status: "failed", readings: { reason: "宿主缺 sshpass——密码认证不可用" } })
        finalize(runId, { status: "failed", terminal: { ok: false, summary: "宿主缺 sshpass——密码认证不可用（检查并报：装 sshpass 或改用密钥）", step: "S2" } })
        return
      }
    }
    const ssh = createSshExecutor({ baseDir, keyName: `onboarding-${row.id}`, ...(deps.execImpl ? { execImpl: deps.execImpl } : {}) })
    let runnerId = null
    let sawCall = false
    let s3Done = false
    const journal = (stepId, entry) => {
      if (entry?.readings?.runnerId) runnerId = Number(entry.readings.runnerId)
      appendStep(db, runId, stepId, entry)
    }
    const audit = ({ tool, call, resultCode, summary, step }) => {
      recordAudit(db, {
        type: "sandbox_event",
        actor: auditActorOf(db, row),
        target: row.host,
        detail: { kind: "onboarding_exec", runId: row.id, tool, call, resultCode, summary, step },
        ts: now(),
      })
    }
    const tools = createOnboardingTools({
      db,
      runId: row.id,
      auth,
      ssh,
      fetchImpl: deps.fetchImpl ?? fetch,
      defaultName: row.name ?? row.host,
      audit,
      journal,
    })
    let chat
    try {
      chat = deps.chat ?? (await buildModelExit({ db, ref: row.model, chatImpl: deps.chatImpl ?? null }))
    } catch (e) {
      finalize(runId, { status: "failed", terminal: { ok: false, summary: `模型出口装配失败：${e.message}`, step: "S2" } })
      removeKeyFile(ssh.keyFilePath())
      return
    }
    const brief = buildBrief({ run: row, budget })
    let result
    try {
      result = await runAgentTask({
        brief,
        userMessage: `请按简报把主机 ${row.host} 接入为 runner 节点（节点名缺省 ${row.name ?? row.host}）。`,
        tools,
        chat,
        maxCalls: budget.maxCalls,
        maxDurationMs: budget.maxDurationMs,
        now,
        onEvent: (event) => {
          if (event.type === "call") sawCall = true
          if (event.type === "text" && sawCall && !s3Done) {
            s3Done = true
            journal("S3", { status: "done", readings: { decision: event.text.slice(0, 1200) } }) // 定策（无动作——决定句入 run 详情）
          }
          if (event.type === "budget") log?.warn("onboarding_budget", { runId: row.id, reason: event.reason })
        },
      })
    } catch (e) {
      result = { status: "failed", reason: `任务执行异常：${e?.message ?? e}` }
    }
    removeKeyFile(ssh.keyFilePath())
    const terminal = tools.terminal() ?? { ok: false, summary: result.reason ?? "任务未给出终态报告", step: null, readings: null }
    const status = result.status === "succeeded" && terminal.ok ? "succeeded" : "failed"
    finalize(runId, { status, terminal: status === "succeeded" ? terminal : { ...terminal, ok: false, summary: terminal.summary || result.reason }, runnerId: status === "succeeded" ? runnerId : null })
  }

  return {
    baseDir,
    keyPath,
    /** S1 受理：字段合法性归路由面；此处 = 在途检查 + 凭据入密 + 落行 + 审计 + 异步起跑（§3）。 */
    startRun(input) {
      const host = String(input.host).trim()
      const inflight = db.prepare("SELECT id FROM sandbox_onboarding WHERE host = ? AND status = 'running'").get(host)
      if (inflight) throw new Error(`该主机已有在途任务（#${inflight.id}）——等它收尾或先看结果`)
      const key = loadOrCreateCredentialKey(keyPath)
      const createdAt = new Date(now()).toISOString()
      const info = db
        .prepare(
          `INSERT INTO sandbox_onboarding (host, ssh_port, ssh_user, auth_kind, secret_cipher, sudo_cipher, credential_mode, credential_state, name, model, status, step, steps_json, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'sealed', ?, ?, 'running', 'S1', ?, ?, ?)`,
        )
        .run(
          host,
          Number(input.sshPort ?? 22),
          String(input.sshUser).trim(),
          input.authKind,
          encryptSecret(String(input.secret), key),
          input.sudoSecret ? encryptSecret(String(input.sudoSecret), key) : null,
          input.credentialMode,
          input.name ? String(input.name).trim() : null,
          String(input.model),
          JSON.stringify([{ id: "S1", status: "done", note: "受理", readings: { host, sshUser: String(input.sshUser).trim(), authKind: input.authKind, credentialMode: input.credentialMode }, at: createdAt }]),
          input.createdBy ?? null,
          createdAt,
        )
      const runId = Number(info.lastInsertRowid)
      const row = db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(runId)
      recordAudit(db, { type: "sandbox_event", actor: input.actor ?? auditActorOf(db, row), target: host, detail: { kind: "onboarding_start", runId, host, sshUser: row.ssh_user }, ts: now() })
      const task = executeRun(runId).catch((e) => {
        log?.warn("onboarding_run_failed", { runId, message: e?.message ?? String(e) })
        try {
          finalize(runId, { status: "failed", terminal: { ok: false, summary: `任务异常收尾：${e?.message ?? e}`, step: null } })
        } catch {
          /* 兜底收尾失败——行留 running，重启恢复面兜 */
        }
      })
      task.catch(() => {})
      return { run: runView(row) }
    },
    listRuns({ limit = 50 } = {}) {
      const rows = db.prepare("SELECT * FROM sandbox_onboarding ORDER BY id DESC LIMIT ?").all(Number(limit))
      return { runs: rows.map((row) => runView(row)) }
    },
    getRun(id) {
      const row = db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(Number(id))
      return row ? runView(row, { detail: true }) : null
    },
    /** 撤销凭据（只及 server 侧存留——目标机账号须到机处置；§2.5 行）。无凭据在留 ⇒ 抛（路由转 400）。 */
    revokeCredential(id, { actor = "onboarding" } = {}) {
      const row = db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(Number(id))
      if (!row) return null
      if (row.secret_cipher === null && row.sudo_cipher === null) throw new Error("无凭据在留（已零化 ∥ 已撤销）")
      db.prepare("UPDATE sandbox_onboarding SET secret_cipher = NULL, sudo_cipher = NULL, credential_state = 'revoked' WHERE id = ?").run(row.id)
      recordAudit(db, { type: "sandbox_event", actor, target: row.host, detail: { kind: "onboarding_credential_revoke", runId: row.id }, ts: now() })
      return runView(db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(row.id), { detail: true })
    },
    /** 重启恢复（KD-SV-86）：在途 `running` ⇒ `interrupted`（如实收尾）+ 审计行 + 凭据按模式（弃 ⇒ 零化）。 */
    resumeInterrupted() {
      const rows = db.prepare("SELECT * FROM sandbox_onboarding WHERE status = 'running' ORDER BY id").all()
      for (const row of rows) {
        appendStep(db, row.id, "S8", { status: "failed", note: "server 重启——任务被中断", readings: { result: "interrupted", reason: "server 重启——在途任务中断（如实收尾）" } })
        // `step` 列 = 中断时所在步（appendStep 推向 S8——此处收正）
        db.prepare("UPDATE sandbox_onboarding SET status = 'interrupted', step = ?, finished_at = ? WHERE id = ?").run(row.step ?? "S1", new Date(now()).toISOString(), row.id)
        if (row.credential_mode === "burn") burnCredential(row.id)
        removeKeyFile(keyFileOf(row.id)) // 中断收尾同清私钥文件（key 认证形——用完即弃不含中断径）
        recordAudit(db, {
          type: "sandbox_event",
          actor: auditActorOf(db, row),
          target: row.host,
          detail: { kind: "onboarding_failed", runId: row.id, step: row.step ?? "S2", reason: "server 重启——在途任务中断" },
          ts: now(),
        })
      }
      return rows.length
    },
  }
}

/** 任务简报（§2——目标 ∥ 主机 ∥ 验收 ∥ 预算 ∥ 审计窗 ∥ 边界；S 骨架照 §3 表）。 */
export function buildBrief({ run, budget }) {
  const sshUser = run.ssh_user
  return [
    "你是 ThinCoder server 的管理面 agent（无人值守）。任务：把一台主机接入为 runner 节点（远程 Docker API 节点——控制面直调其 Docker API）。",
    "",
    `# 目标主机`,
    `host=${run.host}  ssh_port=${run.ssh_port}  ssh_user=${sshUser}  认证方式=${run.auth_kind}`,
    `节点名缺省 = ${run.name ?? run.host}`,
    "",
    "# 期望骨架（按目标机实况定形——技术路线/次序自主；跳步允许：已装并已监听 ⇒ 跳 S4/S5）",
    "S1 受理（已完成）。",
    "S2 登录与探明：跑探明脚本（下方），读并复述十项：OS 发行版 ∥ 内核/架构 ∥ cgroup v2 ∥ 内存/磁盘余量 ∥ systemd ∥ sudo 可用形 ∥ Docker 在场与版本（含 API 版本）∥ dockerd 监听形（:2375 在场与否）∥ 包管理器 ∥ 出网/DNS。调用时标 step=S2。",
    "探明脚本：",
    PROBE_SCRIPT,
    "S3 定策（无动作）：按读数判路径（装运行时 ∥ 仅开监听 ∥ 直登），把决定句写在你的回复文本里。",
    "S4 装容器运行时（缺时才走）：按实况装（发行版包优先；瞬态失败重试 ≤1）。成功判据：docker version 服务端在场 ∥ systemctl is-active docker = active。标 step=S4。",
    "S5 开 API 监听（未监听时才走）：写 systemd drop-in（-H fd:// -H tcp://0.0.0.0:2375）⇒ daemon-reload + restart docker（既有容器短暂中断）。成功判据：systemctl is-active = active ∧ 本机 :2375/version 200。标 step=S5。",
    "S6 接 API + 登记：register(host, endpoint)（endpoint = http://<host>:2375）。标 step=S6。",
    "S7 自检与就绪：verify(host)。标 step=S7。",
    "S8 收尾与报告：report(ok, summary, step, readings)。",
    "",
    "# 必须停下报告（不得自行处置）",
    "① OS/内核前提不满足（非 Linux ∥ 无 cgroup v2 ∥ 磁盘不足 ∥ 无 systemd）② 登录/sudo 权不足 ③ 同一动作有界重试后仍败 ④ 需破坏性/越界动作（升级系统 ∥ 卸载包 ∥ 动他人服务/防火墙 ∥ 重启宿主机 ∥ 动数据盘）⑤ 目标机既有形态冲突（Docker 形态异常 ∥ 监听被占）⑥ 预算超限。",
    "",
    "# 失败处置",
    "仅撤你自己写入的可逆配置（daemon drop-in ⇒ 撤文件 + 复位尝试）；装包不回滚（以机器现状为准报告）；登记失败 = 零宿主回滚。",
    "",
    "# 纪律",
    "- 每步读数可复述、失败停在哪步说清；报错用逐句人话。",
    "- 提权用 `sudo -S`（口令由系统注入 stdin——不要把口令写进命令、不要回显）。",
    `- 预算：工具调用 ≤ ${budget.maxCalls} 次 ∥ 时长 ≤ ${Math.round(budget.maxDurationMs / 60000)} 分钟——超限即停。`,
    "- 结束时必须调用 report（成功 ok=true；失败 ok=false + 停在哪步 + 原因）。",
  ].join("\n")
}
