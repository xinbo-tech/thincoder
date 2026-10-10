/**
 * checkpoint.mjs — WIP 检查点（sandbox/RUNNER.md §6；未提交保护三层之第二层）：
 * **打包** = 工作区为 git 仓 ∧ `git status --porcelain` 非空 ⇒ `git stash create`（**不动工作区**）+ 未跟踪清单
 * （`git ls-files --others --exclude-standard` 口径）打包；非 git ⇒ 跳过 + 上报「无保护」；大小上限缺省 200 MiB
 * ⇒ 超 ⇒ 跳过 + 上报（与上送路由级上限同值）。
 * **恢复** = 解包 ⇒ `git unpack-objects`（对象入仓）⇒ `git stash apply <sha>` ⇒ 未跟踪文件还原。
 * 包形（本档自持——服务器只存不透明字节）：magic + manifest(JSON) + pack + 未跟踪项（path/content）,整体 gzip。
 * 触发点（周期 ∥ 拆盒前 ∥ 排空前）= daemon 侧；上送/取回 = client（octet-stream 流式体）。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { gunzipSync, gzipSync } from "node:zlib"

import { runCommand } from "./runtime.mjs"

export const CHECKPOINT_MAGIC = "TC-CKPT-1\n"
export const CHECKPOINT_MAX_BYTES = 200 * 1024 * 1024

/** git 助手：`-c user.*` 缺省身份（合成 stash 提交不依赖本机 git 配置）。 */
async function git(dir, args, { exec = runCommand, input = null, timeoutMs = 120000 } = {}) {
  return exec("git", ["-c", "user.name=thincoder-runner", "-c", "user.email=thincoder-runner@localhost", ...args], { cwd: dir, input, timeoutMs })
}

const outText = (res) => (res.stdout ?? Buffer.alloc(0)).toString("utf8").trim()

/** git 仓判据（`rev-parse --is-inside-work-tree`）。 */
export async function isGitRepo(dir, { exec = runCommand } = {}) {
  const res = await git(dir, ["rev-parse", "--is-inside-work-tree"], { exec })
  return res.code === 0 && outText(res) === "true"
}

/** dirty 判据（`git status --porcelain` 非空——未提交/未跟踪皆计）。 */
export async function gitDirty(dir, { exec = runCommand } = {}) {
  if (!(await isGitRepo(dir, { exec }))) return false
  const res = await git(dir, ["status", "--porcelain"], { exec })
  return res.code === 0 && outText(res) !== ""
}

/** 未跟踪清单（`-z`——路径含空格亦稳）。 */
export async function untrackedFiles(dir, { exec = runCommand } = {}) {
  const res = await git(dir, ["ls-files", "-z", "--others", "--exclude-standard"], { exec })
  if (res.code !== 0) return []
  return (res.stdout ?? Buffer.alloc(0))
    .toString("utf8")
    .split("\0")
    .filter((item) => item !== "")
}

/** u32be 写入/读取（包形基元）。 */
function writeU32(value) {
  const buf = Buffer.alloc(4)
  buf.writeUInt32BE(value >>> 0, 0)
  return buf
}

function readU32(buffer, offset) {
  if (offset + 4 > buffer.length) throw new Error("检查点包截断（长度字段越界）")
  return buffer.readUInt32BE(offset)
}

/** 包序列化（可直测——纯函数）。 */
export function encodePackage(manifest, pack, untracked) {
  const chunks = [Buffer.from(CHECKPOINT_MAGIC, "utf8")]
  const manifestBytes = Buffer.from(JSON.stringify(manifest), "utf8")
  chunks.push(writeU32(manifestBytes.length), manifestBytes)
  chunks.push(writeU32(pack.length), pack)
  chunks.push(writeU32(untracked.length))
  for (const item of untracked) {
    const pathBytes = Buffer.from(item.path, "utf8")
    chunks.push(writeU32(pathBytes.length), pathBytes, writeU32(item.content.length), item.content)
  }
  return gzipSync(Buffer.concat(chunks))
}

/** 包反序列化（坏包 ⇒ 抛）。 */
export function decodePackage(bytes) {
  const raw = gunzipSync(bytes)
  const magic = raw.subarray(0, CHECKPOINT_MAGIC.length).toString("utf8")
  if (magic !== CHECKPOINT_MAGIC) throw new Error("检查点包格式不符（magic 不匹配）")
  let offset = CHECKPOINT_MAGIC.length
  const manifestLen = readU32(raw, offset)
  offset += 4
  const manifest = JSON.parse(raw.subarray(offset, offset + manifestLen).toString("utf8"))
  offset += manifestLen
  const packLen = readU32(raw, offset)
  offset += 4
  const pack = raw.subarray(offset, offset + packLen)
  offset += packLen
  const count = readU32(raw, offset)
  offset += 4
  const untracked = []
  for (let i = 0; i < count; i++) {
    const pathLen = readU32(raw, offset)
    offset += 4
    const path = raw.subarray(offset, offset + pathLen).toString("utf8")
    offset += pathLen
    const contentLen = readU32(raw, offset)
    offset += 4
    untracked.push({ path, content: Buffer.from(raw.subarray(offset, offset + contentLen)) })
    offset += contentLen
  }
  return { manifest, pack, untracked }
}

/**
 * 打包（不动工作区——stash create + pack-objects；全程只读面）。
 * 返回：`{ skipped: true, reason: "no_git"|"clean"|"too_large", size? }` ∥ `{ skipped: false, bytes, size, manifest, stash }`。
 */
export async function packCheckpoint(dir, { exec = runCommand, maxBytes = CHECKPOINT_MAX_BYTES, now = Date.now } = {}) {
  if (!(await isGitRepo(dir, { exec }))) return { skipped: true, reason: "no_git" }
  const status = await git(dir, ["status", "--porcelain"], { exec })
  if (status.code !== 0 || outText(status) === "") return { skipped: true, reason: "clean" }
  const stashRes = await git(dir, ["stash", "create"], { exec })
  if (stashRes.code !== 0) return { skipped: true, reason: "stash_failed", detail: (stashRes.stderr ?? Buffer.alloc(0)).toString("utf8").trim() }
  const stash = outText(stashRes)
  const paths = await untrackedFiles(dir, { exec })
  // 纯未跟踪改动 ⇒ `stash create` 恒空（它不含未跟踪）——未跟踪仍须入包（否则 dirty 面零保护）
  if (stash === "" && paths.length === 0) return { skipped: true, reason: "clean" }
  const base = outText(await git(dir, ["rev-parse", "HEAD"], { exec }))
  let pack = Buffer.alloc(0)
  if (stash !== "") {
    const packRes = await git(dir, ["pack-objects", "--stdout", "--revs"], { exec, input: Buffer.from(`${stash}\n^${base}\n`), timeoutMs: 300000 })
    if (packRes.code !== 0) return { skipped: true, reason: "pack_failed", detail: (packRes.stderr ?? Buffer.alloc(0)).toString("utf8").trim() }
    pack = packRes.stdout ?? Buffer.alloc(0)
  }
  const untracked = []
  let total = 0
  for (const path of paths) {
    let content
    try {
      content = readFileSync(resolve(dir, path))
    } catch {
      continue // 读失败（符号链接/竞态）——该文件不入包（上报面 = manifest 计数）
    }
    total += content.length
    if (pack.length + total > maxBytes) return { skipped: true, reason: "too_large", size: pack.length + total }
    untracked.push({ path, content })
  }
  const manifest = { version: 1, createdAt: new Date(now()).toISOString(), base, stash: stash === "" ? null : stash, untracked: untracked.map((item) => item.path) }
  const bytes = encodePackage(manifest, pack, untracked)
  if (bytes.length > maxBytes) return { skipped: true, reason: "too_large", size: bytes.length }
  return { skipped: false, bytes, size: bytes.length, manifest, stash: manifest.stash }
}

/** 恢复（restore 指令 ⇒ 套用到新盒）：unpack-objects ⇒ stash apply ⇒ 未跟踪还原。返回计数读数。 */
export async function restoreCheckpoint(dir, bytes, { exec = runCommand } = {}) {
  const { manifest, pack, untracked } = decodePackage(bytes)
  if (pack.length > 0) {
    const unpack = await git(dir, ["unpack-objects"], { exec, input: pack, timeoutMs: 300000 })
    if (unpack.code !== 0) throw new Error(`对象解包失败：${(unpack.stderr ?? Buffer.alloc(0)).toString("utf8").trim()}`)
  }
  let applied = false
  if (manifest?.stash) {
    const apply = await git(dir, ["stash", "apply", manifest.stash], { exec })
    applied = apply.code === 0
    if (!applied) throw new Error(`stash 套用失败：${(apply.stderr ?? Buffer.alloc(0)).toString("utf8").trim()}`)
  }
  let restoredFiles = 0
  for (const item of untracked) {
    const target = resolve(dir, item.path)
    if (!target.startsWith(resolve(dir))) continue // 越界路径拒（包不可信）
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, item.content)
    restoredFiles += 1
  }
  return { ok: true, applied, restoredFiles, untrackedCount: untracked.length }
}
