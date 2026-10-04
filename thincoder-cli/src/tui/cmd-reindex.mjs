import { homedir } from "node:os"
import { resolve } from "node:path"
import { C } from "./ansi.mjs"

/** home 根防护（#867 · `MEMORY.md` §6.14 L-④ · 同 startup.mjs）：`cwd` = 用户主目录（resolve 后；win32 大小写不敏感）。 */
const isHomeDir = (dir) => typeof dir === "string" && dir !== "" &&
  (process.platform === "win32" ? resolve(dir).toLowerCase() === resolve(homedir()).toLowerCase() : resolve(dir) === resolve(homedir()))

/** /reindex command: rebuild memory index (files + code_chunks + doc_chunks).
 *  ctx: { agent, distillOpts, pushLine } */
export async function handleReindexCommand(ctx) {
  const { agent, distillOpts, pushLine } = ctx
  if (isHomeDir(agent.cwd)) { // #867：home 根 ⇒ 跳过（零表删 ∥ 三 sync 零调用；含出路提示）
    pushLine("[reindex] Skipped: working directory is the home directory — start in a project dir", C.warn)
    return
  }
  const { syncDir, codeSync, docSync } = await import("@thincoder/core/memory.mjs")
  pushLine("[reindex] Rebuilding index...", C.tool)
  agent.memory.db.prepare("DELETE FROM files").run()
  agent.memory.db.prepare("DELETE FROM code_chunks").run()
  agent.memory.db.prepare("DELETE FROM doc_chunks").run()
  let total = 0
  if (distillOpts.projectDir) {
    const s = await syncDir(agent.memory, { layer: "project", dir: distillOpts.projectDir })
    total += s.added
    pushLine(`  project: +${s.added} ~${s.updated} -${s.removed}`, C.dim)
  }
  if (distillOpts.team?.dir) {
    const s = await syncDir(agent.memory, { layer: "team", dir: distillOpts.team.dir })
    total += s.added
    pushLine(`  team: +${s.added} ~${s.updated} -${s.removed}`, C.dim)
  }
  // Rebuild code index and doc index in parallel (read/write different tables, WAL supports)
  pushLine(`  [code+doc] Rebuilding indexes...`, C.tool)
  const [cr, dr] = await Promise.all([
    codeSync(agent.memory, agent.cwd, {
      onProgress: (p) => {
        if (p.phase === "index" && p.current % 20 === 0) {
          pushLine(`    code: ${p.current}/${p.total}`, C.dim)
        }
      },
    }),
    docSync(agent.memory, agent.cwd, {
      onProgress: (p) => {
        if (p.phase === "index" && p.current % 5 === 0) {
          pushLine(`    doc: ${p.current}/${p.total}`, C.dim)
        }
      },
    }),
  ])
  pushLine(`  code: ${cr.total} files, +${cr.updated} ~${cr.skipped} -${cr.removed}`, C.dim)
  pushLine(`  doc: ${dr.total} files, +${dr.updated} ~${dr.skipped} -${dr.removed}`, C.dim)
  // Unlisted extensions (PORTABILITY PO-9): files the index skipped because no
  // index claims their extension — visible here + declarable in the project.
  const unlisted = cr?.unlistedExts?.count ? cr.unlistedExts : dr?.unlistedExts
  if (unlisted?.count > 0) {
    const sample = unlisted.exts.map((e) => e.ext).join(" ")
    pushLine(`  ${unlisted.count} file(s) with unlisted extension(s) skipped (${sample}) — declare them in PROJECT-MANIFEST.json (index.codeExtensions / index.docExtensions) to index them`, C.warn)
  }
  pushLine(`[reindex] Done, ${total} entries total. Vectors will be lazily generated on next search.`, C.tool)
}
