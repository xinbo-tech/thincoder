/**
 * M8 端到端验证：两个"用户"（两个 HOME）通过团队仓库共享记忆。
 * 运行: node scripts/verify-team.mjs
 */
import { execFileSync } from "node:child_process"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createMemory, memoryTools, putMarkdown, syncDir, search } from "../src/memory.mjs"
import { ensureClone, pullTeam, commitAndPush } from "../src/git/gitmem.mjs"

const base = mkdtempSync(join(tmpdir(), "thincoder-m8-"))
const remote = join(base, "remote.git")
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" })

try {
  execFileSync("git", ["init", "--bare", remote])
  execFileSync("git", ["-C", remote, "symbolic-ref", "HEAD", "refs/heads/master"])

  const dirA = join(base, "userA")
  const dirB = join(base, "userB")

  // 用户 A：clone + 写入 + 推送
  await ensureClone({ repo: remote, dir: dirA })
  git(dirA, "config", "user.name", "A")
  git(dirA, "config", "user.email", "a@t.dev")
  const memA = createMemory({ dbPath: ":memory:" })
  const toolsA = memoryTools(memA, { team: { dir: dirA }, author: "A" })
  const memTool = toolsA.find((t) => t.name === "memory")
  console.log("A 写入团队记忆（经 memory 工具 action=put, scope=team）...")
  const r1 = await memTool.execute({ action: "put", type: "decision", title: "数据库选型", content: "团队统一用 PostgreSQL，不引入 MongoDB", scope: "team" })
  console.log(" ", r1.split("\n")[0])

  // 用户 B：clone + 同步 + 检索
  await ensureClone({ repo: remote, dir: dirB })
  git(dirB, "config", "user.name", "B")
  git(dirB, "config", "user.email", "b@t.dev")
  const memB = createMemory({ dbPath: ":memory:" })
  await pullTeam(dirB)
  await syncDir(memB, { layer: "team", dir: dirB })
  const found = await search(memB, "PostgreSQL 数据库")
  if (found.length === 0 || found[0].layer !== "team") {
    console.error("FAIL: B 未检索到 A 的团队记忆", found)
    process.exit(1)
  }
  console.log(`B 检索到: [${found[0].layer}][${found[0].type}] ${found[0].title} (author: ${found[0].author})`)

  console.log("PASS: 团队记忆 A 写入 → git 同步 → B 检索，全链路通畅")
  process.exit(0)
} finally {
  rmSync(base, { recursive: true, force: true })
}
