/**
 * index-ignored-slow.test.mjs — 索引感知面 B2「ignored 触发面」慢档组（真实 git 子进程/真仓）。
 * 设计权威：`docs/design/MEMORY.md` §4（契约五 ignored 集 · 用例 T-I6/T-I6b/T-I7/T-I10 · AC-I2/I5）。
 *
 * 2026-09-11 TEST-LIFECYCLE 扫① 拆分：原 `index-perception.test.mjs`（328 行 > 300 咨询线）的
 * git 慢档组独立成档——本档 = `slow(...)` 组（快层 skip、`npm run test:full` 跑；实测 git 子
 * 进程在并行快层下超 800ms 拦截线）；快档组（T-I1~T-I5/T-I8/T-I9）留原档。两档各自入册
 * `test/files.mjs`（登记即跑）。
 * 环境隔离：全部 fixture 在 tmp（本档自持清理表）。
 */
import { after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { execSync } from "node:child_process"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { needsRebuild } from "../src/indexer.mjs"
import { encodeVectors } from "../src/index-bin.mjs"
import { kindFor } from "../src/index-discover.mjs"

const _dirs = []
after(() => { for (const d of _dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

function tmpDir(prefix) {
  const d = mkdtempSync(join(tmpdir(), prefix))
  _dirs.push(d)
  return d
}

function mtimeOf(cwd, rel) {
  try { return Math.trunc(statSync(join(cwd, rel)).mtimeMs) } catch { return 0 }
}

/** 最小索引 fixture：manifest + vectors.bin（每文件 1 chunk）；entries = 路径或 {path, mtime}。 */
function writeIndex(cwd, { model = "A", dim = 4, vectorDim = dim, entries = [], commit = null } = {}) {
  const dir = join(cwd, ".thincoder", "index")
  mkdirSync(dir, { recursive: true })
  const fileMap = {}
  entries.forEach((e, i) => {
    const rel = typeof e === "string" ? e : e.path
    const mtime = typeof e === "string" ? mtimeOf(cwd, rel) : e.mtime
    fileMap[rel] = { mtime, kind: kindFor(rel), chunks: [{ idx: i, startLine: 1, endLine: 1 }] }
  })
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ version: 1, vector_dim: vectorDim, embed_model: model, indexed_commit: commit, files: fileMap }, null, 2))
  writeFileSync(join(dir, "vectors.bin"), encodeVectors(dim, entries.map(() => Float32Array.from({ length: dim }, () => 0.5))))
}

/** 当前 mtime 快照（每阶段重建 manifest——消除"前一阶段已改"对下一阶段 reason 的串扰）。 */
function snapshot(cwd, paths) { return paths.map((p) => ({ path: p, mtime: mtimeOf(cwd, p) })) }

/** 真实 git 仓 fixture：git init（无 commit）+ 忽略规则 + 文件 + manifest。 */
function gitRepo(prefix, ignoreLines, filesToWrite) {
  const cwd = tmpDir(prefix)
  execSync("git init -q", { cwd, stdio: "ignore" })
  writeFileSync(join(cwd, ".gitignore"), ignoreLines.join("\n") + "\n")
  for (const [rel, body] of Object.entries(filesToWrite)) {
    mkdirSync(dirname(join(cwd, rel)), { recursive: true })
    writeFileSync(join(cwd, rel), body)
  }
  return cwd
}

slow("T-I6 ignored 文件三态（F7/AC-I2）：改 → file-changed；增 → file-added；删 → file-removed", () => {
  const cwd = gitRepo("tc-ip-t6-", ["notes.md", "fresh.md"], { "tracked.md": "t\n", "notes.md": "v1\n" })
  // 改（manifest 基线显式置旧——不依赖写盘间隔的时钟粒度，防 flake）
  writeFileSync(join(cwd, "notes.md"), "v2 changed\n")
  writeIndex(cwd, { entries: [{ path: "tracked.md", mtime: mtimeOf(cwd, "tracked.md") }, { path: "notes.md", mtime: 0 }] })
  assert.deepEqual(needsRebuild(cwd), { needed: true, reason: "file-changed", file: "notes.md" }, "改 → file-changed")
  // 增（ignored 新文件）
  writeIndex(cwd, { entries: snapshot(cwd, ["tracked.md", "notes.md"]) })
  writeFileSync(join(cwd, "fresh.md"), "new\n")
  assert.deepEqual(needsRebuild(cwd), { needed: true, reason: "file-added", file: "fresh.md" }, "增 → file-added")
  // 删（ignored 文件删除后 git 双无踪迹——存在性扫描路径）
  writeIndex(cwd, { entries: snapshot(cwd, ["tracked.md", "notes.md"]) })
  rmSync(join(cwd, "fresh.md"), { force: true })
  rmSync(join(cwd, "notes.md"), { force: true })
  assert.deepEqual(needsRebuild(cwd), { needed: true, reason: "file-removed", file: "notes.md" }, "删 → file-removed（契约五末条）")
})

slow("T-I6b ignored 目录条目（F7/AC-I2——契约五目录分支）：目录内改 → file-changed；整棵子树删除 → file-removed", () => {
  // 目录模式忽略（`local/`）：git 只报顶层 `!! local/`——文件改/删均无文件级条目
  const cwd = gitRepo("tc-ip-t6b-", ["local/"], { "readme.md": "r\n", "local/a.md": "v1\n" })
  writeFileSync(join(cwd, "local", "a.md"), "v2 changed\n")
  writeIndex(cwd, { entries: [{ path: "readme.md", mtime: mtimeOf(cwd, "readme.md") }, { path: "local/a.md", mtime: 0 }] })
  assert.deepEqual(needsRebuild(cwd), { needed: true, reason: "file-changed", file: "local/a.md" }, "目录条目走查分支 → file-changed")
  // 整棵被忽略子树删除（目录条目随之消失——check-ignore 目录模式 + 存在性检查兼底）
  writeIndex(cwd, { entries: [{ path: "readme.md", mtime: mtimeOf(cwd, "readme.md") }, { path: "local/a.md", mtime: mtimeOf(cwd, "local/a.md") }] })
  rmSync(join(cwd, "local"), { recursive: true, force: true })
  assert.deepEqual(needsRebuild(cwd), { needed: true, reason: "file-removed", file: "local/a.md" }, "整棵子树删除 → file-removed")
})

slow("T-I7 豁免零误报（F7/AC-I2）：ignored 的 node_modules/.hidden/.thincoder-tmp → needed:false", () => {
  const cwd = gitRepo("tc-ip-t7-", ["node_modules/", ".hidden/", ".thincoder/tmp/"], { "tracked.md": "t\n" })
  mkdirSync(join(cwd, "node_modules"), { recursive: true })
  mkdirSync(join(cwd, ".hidden"), { recursive: true })
  mkdirSync(join(cwd, ".thincoder", "tmp"), { recursive: true })
  writeFileSync(join(cwd, "node_modules", "x.md"), "x\n")
  writeFileSync(join(cwd, ".hidden", "x.md"), "x\n")
  writeFileSync(join(cwd, ".thincoder", "tmp", "x.txt"), "x\n")
  writeIndex(cwd, { entries: snapshot(cwd, ["tracked.md"]) })
  assert.deepEqual(needsRebuild(cwd), { needed: false, reason: "up-to-date" }, "走查根过滤（canWalkRoot）不产候选")
})

slow("T-I10 零回归正控（N5/AC-I5·N6）：非 git 兜底与 git 快路径删场景同向 + dirty 既有引号语义不变", () => {
  // ① 非 git 目录（兜底路径）：同内容删除 → file-removed
  const plain = tmpDir("tc-ip-t10a-")
  writeFileSync(join(plain, "readme.md"), "r\n")
  writeFileSync(join(plain, "notes.md"), "n\n")
  writeIndex(plain, { entries: snapshot(plain, ["readme.md", "notes.md"]) })
  rmSync(join(plain, "notes.md"), { force: true })
  assert.deepEqual(needsRebuild(plain), { needed: true, reason: "file-removed", file: "notes.md" }, "兜底路径：发现差集判删")
  // ② 同内容 git 仓（快路径）：同场景 → 同 reason（两路同向）
  const repo = gitRepo("tc-ip-t10b-", ["notes.md"], { "readme.md": "r\n", "notes.md": "n\n" })
  writeIndex(repo, { entries: snapshot(repo, ["readme.md", "notes.md"]) })
  rmSync(join(repo, "notes.md"), { force: true })
  assert.deepEqual(needsRebuild(repo), { needed: true, reason: "file-removed", file: "notes.md" }, "快路径：check-ignore 存在性扫描判删")
  // ③ dirty 集既有语义（引号路径——带空格文件名不丢）：改动 → file-changed（非新增）
  writeFileSync(join(repo, "a b.md"), "v2 changed\n")
  writeIndex(repo, { entries: [{ path: "readme.md", mtime: mtimeOf(repo, "readme.md") }, { path: "a b.md", mtime: 0 }] })
  assert.deepEqual(needsRebuild(repo), { needed: true, reason: "file-changed", file: "a b.md" }, "引号剥离不回归")
})
