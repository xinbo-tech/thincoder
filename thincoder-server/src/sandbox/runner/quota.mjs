/**
 * quota.mjs — 磁盘配额两机制（sandbox/RUNNER.md §5；KD-SV-74）：
 * ① **项目配额**（xfs `pquota` ∥ ext4 `prjquota`——`workspaceRoot` 所在卷）：每工作区 project id + 限额（设置项 `diskMb`）；
 * ② **loopback 镜像**（备选）：`truncate` + `mkfs.ext4` + `mount -o loop`——尺寸 = 限额（消耗 loop 设备）；
 * 探测序 ① ⇒ ②；**无一可用 ⇒ `mechanism: null`**（doctor 核心项 FAIL ⇒ 拒跑——无退路）。
 * 超限 = 写入 ENOSPC（应用可见；宿主盘由配额兜底——探针 P7）；destroy 释放 ∥ stop 不动。
 * 本档全为命令生成 + 判定（`exec` 注入——批内件假件替身；真机应用 = 收口轮）。
 */

export const QUOTA_PROJECT_BASE = 10000

/** project id 派生（基数 + 工作区 id——机队内稳定；避开 systemd 动态 id 区间 61184+）。 */
export function projectIdOf(workspaceId) {
  return QUOTA_PROJECT_BASE + Number(workspaceId)
}

/** 卷信息（fstype/options/挂载点——`findmnt` 读面）。 */
export async function volumeInfo(workspaceRoot, { exec }) {
  const res = await exec("findmnt", ["-no", "FSTYPE,OPTIONS,TARGET", "--target", workspaceRoot])
  const line = res.code === 0 ? (res.stdout ?? "").toString("utf8").trim() : ""
  if (line === "") return null
  const [fsType = "", options = "", mountPoint = ""] = line.split(/\s+/)
  return { fsType, options, mountPoint }
}

/**
 * 探测（§5 探测定序）：project ⇒ loopback ⇒ null。
 * ① 判据 = 卷 fstype/options：xfs ∧（`pquota` ∥ `prjquota`）∥ ext4 ∧ `prjquota`；
 * ② 判据 = `losetup` 与 `mkfs.ext4` 可执行（镜像文件可建）。
 */
export async function detectQuota({ exec, workspaceRoot = "." } = {}) {
  const info = await volumeInfo(workspaceRoot, { exec })
  if (info) {
    const projectOk =
      (info.fsType === "xfs" && /(^|,)(pquota|prjquota)(,|$)/.test(info.options)) ||
      (info.fsType === "ext4" && /(^|,)prjquota(,|$)/.test(info.options))
    if (projectOk) {
      return {
        mechanism: "project", fsType: info.fsType, mountPoint: info.mountPoint,
        detail: `项目配额可用（${info.fsType}@${info.mountPoint}——${info.options}）`,
      }
    }
  }
  const losetup = await exec("losetup", ["--version"])
  const mkfs = await exec("mkfs.ext4", ["-V"])
  if (losetup.code === 0 && mkfs.code === 0) {
    return {
      mechanism: "loopback", fsType: null, mountPoint: null,
      detail: `loopback 备选可用（losetup + mkfs.ext4 在场；${info ? `卷 ${info.fsType} 无项目配额` : "卷信息不可读"}）`,
    }
  }
  return {
    mechanism: null, fsType: info?.fsType ?? null, mountPoint: info?.mountPoint ?? null,
    detail: `无可用配额机制（${info ? `卷 ${info.fsType} 无 pquota/prjquota` : "findmnt 不可读"}；losetup ${losetup.code === 0 ? "在" : "缺"} ∥ mkfs.ext4 ${mkfs.code === 0 ? "在" : "缺"}）`,
  }
}

/** 限额（blocks 单位 = 1 KiB 块——`setquota` 口径；限额 = diskMb × 1024）。 */
export function blocksOf(diskMb) {
  return Math.max(1, Math.floor(Number(diskMb) * 1024))
}

/**
 * 应用配额（建盒/重建时——机制按探测结果）。逐命令执行；任一失败 ⇒ `{ ok: false }`（调用方按「拒跑/拒建盒」处置）。
 */
export async function applyQuota({ mechanism, workspaceId, volumePath, diskMb, fsType = "ext4", mountPoint = null, exec }) {
  const blocks = blocksOf(diskMb)
  const projectId = projectIdOf(workspaceId)
  const commands = []
  if (mechanism === "project") {
    // ext4 = `chattr -p` + `+P`（项目层级继承）；xfs = `xfs_io chproj`
    if (fsType === "xfs") commands.push(["xfs_io", ["-c", `chproj ${projectId}`, volumePath]])
    else commands.push(["chattr", ["-p", String(projectId), volumePath]], ["chattr", ["+P", volumePath]])
    commands.push(["setquota", ["-P", String(projectId), "0", String(blocks), "0", "0", mountPoint ?? "/"]])
  } else if (mechanism === "loopback") {
    const imagePath = `${volumePath}.img`
    commands.push(["truncate", ["-s", `${Math.floor(Number(diskMb))}M`, imagePath]])
    commands.push(["mkfs.ext4", ["-F", "-q", imagePath]])
    commands.push(["mount", ["-o", "loop", imagePath, volumePath]])
  } else {
    return { ok: false, reason: "无配额机制（mechanism = null——拒跑口径）", commands: [] }
  }
  for (const [cmd, args] of commands) {
    const res = await exec(cmd, args, { timeoutMs: 120000 })
    if (res.code !== 0) return { ok: false, reason: `${cmd} 失败（code = ${res.code}）`, commands }
  }
  return { ok: true, commands, projectId }
}

/** 释放（destroy 显式销毁面——§5「destroy 释放（配额删除 ∥ loop 卸载删文件）；stop 不动」）。
 *  逐命令执行——单项失败不反噬主链（幂等面：重复释放/未挂载），以 `failed` 读数回报。 */
export async function releaseQuota({ mechanism, workspaceId, volumePath, mountPoint = null, exec }) {
  const projectId = projectIdOf(workspaceId)
  const commands = []
  if (mechanism === "project") {
    commands.push(["setquota", ["-P", String(projectId), "0", "0", "0", "0", mountPoint ?? "/"]])
  } else if (mechanism === "loopback") {
    commands.push(["umount", [volumePath]])
    commands.push(["rm", ["-rf", `${volumePath}.img`]])
  } else {
    return { ok: false, reason: "无配额机制（mechanism = null）", commands: [] }
  }
  const failed = []
  for (const [cmd, args] of commands) {
    const res = await exec(cmd, args, { timeoutMs: 120000 })
    if (res.code !== 0) failed.push(cmd)
  }
  return { ok: true, commands, projectId, failed }
}
