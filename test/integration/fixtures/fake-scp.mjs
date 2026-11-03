/**
 * fake-scp.mjs — 脚本化假 `scp`（夹具 · 传输面 §6.22 ⑬）。
 *
 * 由用例经 `_setScpBinaryForTest(process.execPath, [<本档>])` 拉起（`<node> <本档> <scp 参数…>`）：
 * **远端** = `FAKE_SCP_REMOTE` 目录（本地盘上扮演设备 flash 的那棵树），零外网、零真机、零付费端点。
 *
 * 两条**判据性**约定（不是随意实现——被测件的设计面要求它们成立）：
 * 1. **本地实参必须是裸档名**：被测件把 `spawn` 的 `cwd` 设为该档所在目录、命令行只传档名，盘符冒号与
 *    反斜杠都不进 scp 的参数位（⑬ ②「本地路径实参形」）。带分隔符 / 盘符 ⇒ 直接失败——替身替不了这条判据。
 * 2. **远端 = `<host>:<path>`**（首个 `:` 切分）——与真 scp 同一条切分规则，`<path>` 按
 *    `FAKE_SCP_REMOTE` 解析。
 *
 * 场景 = `FAKE_SCP_MODE`：
 *
 * | 模式 | 行为 |
 * |---|---|
 * | `key`（缺省） | 不开口令即成功（密钥 / agent 机） |
 * | `needs-secret` | 无 `TC_SSH_SECRET` ⇒ `Permission denied` + 退出 1；有 ⇒ 成功（密码机） |
 * | `classic-only` | 收不到 `-O` ⇒ 子系统失败 + 退出 1（只实现经典 SCP 协议的设备） |
 * | `stall` | 先吐一半**再停住**（不自行退出；等被测件的硬超时杀树） |
 * | `stall-silent` | 同 `stall` 但**一个字节都不写**（`get` 侧硬超时「落点未被碰过 ⇒ 不删」那一支要用） |
 *
 * 每次执行往 `FAKE_SCP_COUNTER` 追加一行——「替身零命中 / scp 零执行」类判据的读数（⑬ ⑤ 各拒句都要求
 * 「`scp` 零执行」）。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join } from "node:path"

const ARG_WITH_VALUE = new Set(["-c", "-D", "-F", "-i", "-J", "-l", "-o", "-P", "-S", "-X"])

const argv = process.argv.slice(2)
const options = []
const operands = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (ARG_WITH_VALUE.has(a)) { options.push([a, argv[i + 1]]); i++; continue }
  if (a.startsWith("-")) { options.push([a, null]); continue }
  operands.push(a)
}

const env = process.env
const mode = env.FAKE_SCP_MODE ?? "key"
const remoteRoot = env.FAKE_SCP_REMOTE ?? ""
const counter = env.FAKE_SCP_COUNTER ?? ""

if (counter) appendFileSync(counter, `run ${process.pid} ${operands.join(" ")}\n`)

const fail = (message) => {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

if (operands.length !== 2) fail("usage: scp [-O] source target")
const isRemote = (token) => /^[^:\\/]+:/.test(token)
const remotePath = (token) => token.slice(token.indexOf(":") + 1)
const toDisk = (path) => join(remoteRoot, path.replace(/^\/+/, ""))

const [source, target] = operands
const sourceRemote = isRemote(source)
const targetRemote = isRemote(target)
if (sourceRemote === targetRemote) fail("scp: fake-scp expects exactly one remote side")

/** 本地实参形判据：裸档名（无分隔符、无盘符冒号、非绝对路径）。 */
const localOperand = sourceRemote ? target : source
if (isAbsolute(localOperand) || /[\\/:]/.test(localOperand)) {
  fail(`scp: unexpected local argument form: ${JSON.stringify(localOperand)} (the tool must pass a bare file name)`)
}

if (mode === "classic-only" && !options.some(([flag]) => flag === "-O")) {
  fail("subsystem request failed on channel 0\nscp: connection closed")
}
if (mode === "needs-secret" && !env.TC_SSH_SECRET) {
  fail("Permission denied (publickey,password).")
}
if (!remoteRoot) fail("scp: fake-scp has no FAKE_SCP_REMOTE configured")

const remoteFile = targetRemote ? toDisk(remotePath(target)) : toDisk(remotePath(source))
const localFile = sourceRemote ? join(process.cwd(), target) : join(process.cwd(), source)

const copy = (from, to) => {
  const bytes = readFileSync(from)
  mkdirSync(dirname(to), { recursive: true })
  writeFileSync(to, bytes) // 整档写入（二进制安全：不经文本流）
  return bytes.length
}

if (mode === "stall" || mode === "stall-silent") {
  if (sourceRemote && mode === "stall") {
    // get：先落半截本地档（被测件的硬超时面要能看见「半截档」），然后停住
    if (!existsSync(remoteFile)) fail(`scp: ${remotePath(source)}: No such file or directory`)
    const bytes = readFileSync(remoteFile)
    writeFileSync(localFile, bytes.slice(0, Math.max(1, Math.floor(bytes.length / 2))))
  }
  process.stdout.write("stalled\n")
  setInterval(() => { /* 不退出：等硬超时杀树 */ }, 1000)
} else if (sourceRemote) {
  if (!existsSync(remoteFile) || !statSync(remoteFile).isFile()) fail(`scp: ${remotePath(source)}: No such file or directory`)
  copy(remoteFile, localFile)
} else {
  if (!existsSync(localFile)) fail(`scp: ${JSON.stringify(source)}: No such file or directory`)
  if (!existsSync(dirname(remoteFile))) fail(`scp: ${remotePath(target)}: No such file or directory`)
  copy(localFile, remoteFile)
}