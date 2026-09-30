// 2026-09-29-tools-carryover-15.test.mjs — #15 终舱（全波机检 · 批次本地件）
// 不进仓套件；复跑 = 仓根 `node --test <本档>`（暂存位 .thincoder/tmp/ 与终位 docs/batches/ 同两层深，命令形态一致）。
//
// 腿面（派单四腿）：
//   ① 外置覆盖 100%：tool-docs 52 档在场 + 逐档 `description === read(<name>.md)`（全量逐字节）；
//   ② 零内联残留：扫描面 = `agent-tools/**` ∥ `tools/**` ∥ `memory/**` ∥ `ledger-tools.mjs` ∥ `peer-instances.mjs`；
//      正形 = 52 名各恰一处 `DESC("<name>")`；负形 = 「name 邻接的内联 description」零命中；
//      白名单（逐条具名）= `batch_segment`（过渡别名 `batchSegmentTool`——非生产挂载 + BATCH-RECORD §4.14
//      描述逐字冻结；机检命中集须恒等于该具名集）。面外：`thincoder-vscode/**`（端面——AC15-1 域 = core
//      工具面）∥ `agent/**`（装配期装饰件——地板面按面外成立，现盘实核无工具级内联字面）。
//   ③ schema 结构面：`parameters` 键集快照（shape = 键集 ∥ enum ∥ required ∥ 嵌套 ∥ 非描述标量值；
//      描述文本不冻结）+ 全量深 sha——对四舱终态基线（2026-09-29 终盘实读；跨舱核对见下）。
//   ④ AC15-3 帽表：单档 schema >8,000 逐档给由（当前唯一超限 = `subagent`——报告态由在册；消限/新增须同步帽表）。
// 口径 = `JSON.stringify({description, parameters})`.length（与 `scripts/tool-schema-size.mjs` 同式）。
// 基线跨舱核对：T1-final `chars` 8/8（报告面）· T4-after `paramsSha` 11/11（件内对拍——伴生件
// `docs/batches/2026-09-29-tools-carryover-t4-readings.after.json`，缺件 ⇒ 打印跳过）· T3 ∥ T2 ∥ 舱 A 各自批内件锁定。
// 空跑哨兵（禁「全绿」空条款）：① 装配入口条数 = 52 ∥ ② 邻接命中 = 53（52 正形 + 1 白名单）∥ ③ 覆盖计数 = 52。
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { createHash } from "node:crypto"
import { fileURLToPath, pathToFileURL } from "node:url"
import { join, relative } from "node:path"
import test from "node:test"
import assert from "node:assert/strict"

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const CORE = join(REPO, "thincoder-core")
const at = (rel) => pathToFileURL(join(CORE, rel)).href
const sha16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)
const DOC_COUNT = 52
const docNames = readdirSync(join(CORE, "tool-docs")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort()

/** parameters 键集形状（键集 ∥ enum ∥ required ∥ 嵌套 ∥ 非描述标量值——description 文本除外；对象键排序）。 */
const shape = (v) => {
  if (v === null) return "null"
  if (Array.isArray(v)) return `[${v.map((x) => shape(x)).join(",")}]`
  if (typeof v === "object") {
    return `{${Object.keys(v).filter((k) => k !== "description").sort().map((k) => `${k}:${shape(v[k])}`).join(",")}}`
  }
  return JSON.stringify(v)
}

// ── 装配面枚举（三面合流；口径 = 装配单点） ─────────────────────────────
const stub = {} // 句柄仅闭包捕捉——工厂构建期零触达
const { builtinTools } = await import(at("tools/index.mjs"))
const { readImageTool } = await import(at("tools/file.mjs"))
const metaBarrel = await import(at("agent-tools.mjs"))
const { memoryTools, codeSearchTool, docSearchTool } = await import(at("memory.mjs"))
const { repoOutlineTool } = await import(at("tools/repomap.mjs"))
const { settingsTool } = await import(at("agent-tools/settings.mjs"))
const { peerInstancesTool } = await import(at("peer-instances.mjs"))
const { ledgerQueryTool, ledgerCountTool, ledgerAddTool, ledgerUpdateTool, ledgerCloseTool } = await import(at("ledger-tools.mjs"))
const { makeMainHistoryTool } = await import(at("agent-tools/consult.mjs"))

const byName = new Map()
let added = 0 // 入口条数（去重前）——重复挂载判据；byName.size = 去重名数
const add = (t) => { if (t?.name) { byName.set(t.name, t); added++ } }
for (const t of builtinTools) add(t)
add(readImageTool)
for (const v of Object.values(metaBarrel)) {
  const t = typeof v === "function" ? v(null) : v
  if (Array.isArray(t)) for (const x of t) add(x)
  else add(t)
}
for (const t of memoryTools(stub, { cwd: REPO, projectDir: null, author: "t15-test", team: null })) add(t)
add(codeSearchTool(stub)); add(docSearchTool(stub))
add(repoOutlineTool(stub, REPO)); add(settingsTool({})); add(peerInstancesTool)
add(ledgerQueryTool); add(ledgerCountTool); add(ledgerAddTool); add(ledgerUpdateTool); add(ledgerCloseTool)
add(makeMainHistoryTool(null))

// ── 扫描面（② 残留面——递归 .mjs） ─────────────────────────────
const walkMjs = (dir) => {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walkMjs(p))
    else if (e.name.endsWith(".mjs")) out.push(relative(CORE, p).replace(/\\/g, "/"))
  }
  return out
}
const surfaceRel = [...["agent-tools", "tools", "memory"].flatMap((d) => walkMjs(join(CORE, d))), "ledger-tools.mjs", "peer-instances.mjs"].sort()

/** ③ 四舱终态基线（2026-09-29 终盘实读）：P = parameters 深 sha · S = 键集形状。 */
const TERMINAL = {
  advisor: { P: "0e25c694c4dbf4f7", S: `{properties:{async:{type:"boolean"},batchDoc:{type:"string"},documents:{items:{type:"string"},type:"array"},object:{properties:{exclude:{type:"string"},reason:{type:"string"},status:{type:"string"},target:{type:"string"},type:{type:"string"}},type:"object"},paths:{items:{type:"string"},type:"array"},type:{enum:["code","design"],type:"string"}},required:["type"],type:"object"}` },
  apply_patch: { P: "06c7c3f8a0e3411d", S: `{properties:{patch:{type:"string"}},required:["patch"],type:"object"}` },
  bash: { P: "367318f8856ad0bb", S: `{properties:{async:{type:"boolean"},command:{type:"string"},filter:{type:"string"},timeout:{type:"number"}},required:["command"],type:"object"}` },
  batch: { P: "f2a59f2e858b7562", S: `{properties:{action:{enum:["create","append","status","close"],type:"string"},date:{type:"string"},note:{type:"string"},path:{type:"string"},prev:{type:"string"},segment:{type:"string"},source:{type:"string"},text:{type:"string"},topic:{type:"string"},value:{type:"string"}},required:["action"],type:"object"}` },
  code_search: { P: "90d5ac225f4fbeba", S: `{properties:{limit:{type:"number"},query:{type:"string"}},required:["query"],type:"object"}` },
  consult_start: { P: "8940e9507244cd63", S: `{properties:{models:{items:{type:"string"},type:"array"},problem:{type:"string"}},required:["problem"],type:"object"}` },
  consult_stop: { P: "2ffa48886ff717a8", S: `{properties:{id:{type:"string"}},required:["id"],type:"object"}` },
  context: { P: "b47e7b8875f1913a", S: `{properties:{action:{enum:["stats","prune","compact"],type:"string"},focus:{type:"string"}},required:["action"],type:"object"}` },
  delete: { P: "6835010619511665", S: `{properties:{force:{type:"boolean"},path:{type:"string"}},required:["path"],type:"object"}` },
  doc_search: { P: "5730ed5a25736a5b", S: `{properties:{limit:{type:"number"},query:{type:"string"}},required:["query"],type:"object"}` },
  edit: { P: "37037c70b8cbddeb", S: `{properties:{edits:{items:{properties:{endLine:{type:"integer"},line:{type:"integer"},new_string:{type:"string"},old_string:{type:"string"},path:{type:"string"},replace_all:{type:"boolean"},startLine:{type:"integer"}},type:"object"},type:"array"},endLine:{type:"integer"},line:{type:"integer"},new_string:{type:"string"},old_string:{type:"string"},path:{type:"string"},replace_all:{type:"boolean"},startLine:{type:"integer"}},required:[],type:"object"}` },
  eng: { P: "5a88c9383b3c371b", S: `{properties:{action:{enum:["enter","exit"],type:"string"}},required:["action"],type:"object"}` },
  execute: { P: "81988dd884461a7a", S: `{properties:{code:{type:"string"},filter:{type:"string"},nodeArgs:{items:{type:"string"},type:"array"},scriptFile:{type:"string"},timeoutMs:{maximum:600000,minimum:1,type:"integer"},workdir:{type:"string"}},required:[],type:"object"}` },
  fetch: { P: "fa9a2e60d5355998", S: `{properties:{proxy:{type:"string"},url:{type:"string"}},required:["url"],type:"object"}` },
  file_ops: { P: "9643fbf04e1c392f", S: `{properties:{action:{enum:["move","copy","rename"],type:"string"},dest:{type:"string"},source:{type:"string"}},required:["action","source","dest"],type:"object"}` },
  get_current_time: { P: "8243f0af367f188a", S: `{properties:{},type:"object"}` },
  git: { P: "9b2a578474c1acfb", S: `{properties:{action:{enum:["diff","status","log","show","checkpoint","add","rm","commit","push","tag","branch","checkout","restore","stash","fetch","pull","reset","revert","merge","cherry-pick","ls-remote","clone","init","rebase","remote","clean","switch","apply","worktree","archive","blame","mv"],type:"string"},branchAction:{enum:["list","create","delete","switch"],type:"string"},checkpointAction:{enum:["list","create","rewind","cat","versions"],type:"string"},checkpointId:{type:"string"},config:{items:{type:"string"},type:"array"},count:{type:"number"},create:{type:"boolean"},dest:{type:"string"},dryRun:{type:"boolean"},filter:{type:"string"},message:{type:"string"},mode:{enum:["soft","mixed","hard"],type:"string"},name:{type:"string"},oneline:{type:"boolean"},path:{type:"string"},rebaseAction:{enum:["start","abort","continue"],type:"string"},ref:{type:"string"},remote:{type:"string"},remoteAction:{enum:["list","add","remove","set-url"],type:"string"},remoteUrl:{type:"string"},staged:{type:"boolean"},stashAction:{enum:["push","pop","list"],type:"string"},tagAction:{enum:["list","create","delete"],type:"string"},tags:{type:"boolean"},workdir:{type:"string"},worktreeAction:{enum:["list","add","remove"],type:"string"}},required:["action"],type:"object"}` },
  glob: { P: "6fcd8e5f8f759339", S: `{properties:{path:{type:"string"},pattern:{type:"string"}},required:["pattern"],type:"object"}` },
  goal: { P: "065bf720b61398b0", S: `{properties:{action:{enum:["set","complete","blocked","cancel"],type:"string"},criteria:{type:"string"},objective:{type:"string"},reason:{type:"string"}},required:["action"],type:"object"}` },
  grep: { P: "f8d2b321ff94f342", S: `{properties:{after:{type:"integer"},before:{type:"integer"},glob:{type:"string"},ignoreCase:{type:"boolean"},literal:{type:"boolean"},path:{type:"string"},pattern:{type:"string"}},required:["pattern"],type:"object"}` },
  hashline_edit: { P: "468fe8945d843726", S: `{properties:{new_content:{type:"string"},old_hashes:{items:{type:"string"},type:"array"},path:{type:"string"}},required:["path","old_hashes","new_content"],type:"object"}` },
  insert_after: { P: "ddbd09985154a28f", S: `{properties:{after_line:{type:"number"},after_regex:{type:"string"},content:{type:"string"},path:{type:"string"}},required:["path","content"],type:"object"}` },
  ledger_add: { P: "256098855a5f2125", S: `{additionalProperties:false,properties:{board:{type:"string"},cwd:{type:"string"},evidence:{type:"string"},kind:{enum:["requirement","tech_todo"],type:"string"},req_doc:{type:"string"},task_book:{type:"string"},title:{type:"string"},trigger:{enum:["归批","条件","认账不排期"],type:"string"}},required:["kind","title"],type:"object"}` },
  ledger_close: { P: "35a73926a7ca22b8", S: `{additionalProperties:false,properties:{cwd:{type:"string"},id:{type:"number"},status:{enum:["已核销","已废弃"],type:"string"}},required:["id","status"],type:"object"}` },
  ledger_count: { P: "fd05bdb7780604e4", S: `{additionalProperties:false,properties:{cwd:{type:"string"}},type:"object"}` },
  ledger_query: { P: "bb22da385b361cad", S: `{additionalProperties:false,properties:{board:{type:"string"},cwd:{type:"string"},kind:{enum:["requirement","tech_todo"],type:"string"},status:{enum:["待讨论","待设计","在途","待核销","已核销","已废弃"],type:"string"}},type:"object"}` },
  ledger_update: { P: "2d4f0b29ce8ef6b9", S: `{additionalProperties:false,properties:{board:{type:"string"},cwd:{type:"string"},evidence:{type:"string"},executor:{type:"string"},id:{type:"number"},req_doc:{type:"string"},status:{enum:["待讨论","待设计","在途","待核销","已核销","已废弃"],type:"string"},task_book:{type:"string"},title:{type:"string"},trigger:{enum:["归批","条件","认账不排期"],type:"string"}},required:["id"],type:"object"}` },
  lint: { P: "05891be87079ceda", S: `{properties:{full:{type:"boolean"},path:{type:"string"}},required:[],type:"object"}` },
  ls: { P: "4c320c5d61dcd77c", S: `{properties:{filter:{type:"string"},path:{type:"string"}},type:"object"}` },
  lsp: { P: "17ecc8b2a2cc37b6", S: `{properties:{character:{type:"integer"},line:{type:"integer"},subcommand:{enum:["definition","references","hover","symbols","diagnostics"],type:"string"},uri:{type:"string"}},required:["subcommand","uri"],type:"object"}` },
  main_history: { P: "c467284ffc2bfbac", S: `{properties:{limit:{type:"number"}},type:"object"}` },
  memory: { P: "29a4de6685b3d51b", S: `{properties:{action:{enum:["search","put","list","delete","clear"],type:"string"},confirm:{type:"boolean"},content:{type:"string"},id:{type:"string"},keyword:{type:"string"},layer:{enum:["personal","project","team"],type:"string"},limit:{type:"number"},query:{type:"string"},tags:{type:"string"},title:{type:"string"},type:{enum:["rule","knowledge","decision","pattern"],type:"string"}},required:["action"],type:"object"}` },
  notify_parent: { P: "c8e6951d630c6cf9", S: `{properties:{kind:{enum:["ask","note"],type:"string"},message:{type:"string"}},required:["kind","message"],type:"object"}` },
  peer_instances: { P: "8243f0af367f188a", S: `{properties:{},type:"object"}` },
  plan: { P: "17298efc43a7c29b", S: `{properties:{action:{enum:["enter","exit"],type:"string"}},required:["action"],type:"object"}` },
  process: { P: "f473ded578f3857d", S: `{properties:{action:{enum:["list","kill"],type:"string"},id:{type:"number"},name:{type:"string"},pid:{type:"number"}},type:"object"}` },
  question: { P: "8c604837fbf41fd0", S: `{properties:{options:{items:{type:"string"},type:"array"},question:{type:"string"}},required:["question"],type:"object"}` },
  read: { P: "f0fe77b289221684", S: `{properties:{allowExternal:{type:"boolean"},filePath:{type:"string"},hashes:{type:"boolean"},limit:{type:"number"},offset:{type:"number"},path:{type:"string"}},required:["path"],type:"object"}` },
  read_history: { P: "360829e6be47ede4", S: `{properties:{direction:{enum:["oldest","newest"],type:"string"},keyword:{type:"string"},limit:{type:"integer"},path:{type:"string"},role:{enum:["user","assistant","tool"],type:"string"},since:{type:"integer"},tool:{type:"string"},until:{type:"integer"}},type:"object"}` },
  read_image: { P: "97c44da765e1cf6c", S: `{properties:{path:{type:"string"}},required:["path"],type:"object"}` },
  recent_changes: { P: "8243f0af367f188a", S: `{properties:{},type:"object"}` },
  repo_outline: { P: "9287c29e35ff5812", S: `{properties:{path:{type:"string"}},required:[],type:"object"}` },
  settings: { P: "0d64b5d1417f894c", S: `{properties:{action:{enum:["list","get","set"],type:"string"},key:{type:"string"},value:{type:"string"}},required:["action"],type:"object"}` },
  skill: { P: "6396676e9e169556", S: `{properties:{action:{enum:["list","load"],type:"string"},name:{type:"string"}},required:["action"],type:"object"}` },
  subagent: { P: "78320b30bce5a15e", S: `{properties:{action:{enum:["spawn","status","escalate","cancel","panel","consume-design","observe","send"],type:"string"},async:{type:"boolean"},batchDoc:{type:"string"},context:{type:"string"},dependsOn:{items:{type:"string"},type:"array"},designId:{type:"string"},designToken:{type:"string"},files:{items:{type:"string"},type:"array"},freeze:{type:"string"},id:{type:"string"},message:{type:"string"},model:{type:"string"},recent:{type:"integer"},role:{enum:["explore","plan","coder","eng-coder","eng-designer"],type:"string"},round:{enum:["initial","fix"],type:"string"},task:{type:"string"},view:{type:"boolean"}},required:[],type:"object"}` },
  task: { P: "d3e479f6ae90e285", S: `{properties:{items:{items:{properties:{status:{enum:["pending","in_progress","done"],type:"string"},title:{type:"string"}},required:["title","status"],type:"object"},type:"array"}},required:["items"],type:"object"}` },
  timer: { P: "6aa1229d7f12869c", S: `{properties:{message:{type:"string"},seconds:{type:"number"}},required:[],type:"object"}` },
  tree: { P: "52a9786fec39b0a9", S: `{properties:{depth:{type:"integer"},path:{type:"string"}},required:[],type:"object"}` },
  verify: { P: "e953bfc5eea6af16", S: `{properties:{verification:{properties:{command:{type:"string"},status:{enum:["passed","failed","skipped"],type:"string"},summary:{type:"string"}},required:["status"],type:"object"},workdir:{type:"string"}},type:"object"}` },
  wait_for: { P: "7550798bda3a58d5", S: `{properties:{condition:{type:"string"},interval_ms:{type:"integer"},timeout_ms:{type:"integer"}},required:["condition"],type:"object"}` },
  websearch: { P: "ed50297889491f7c", S: `{properties:{engine:{enum:["bing"],type:"string"},limit:{type:"number"},page:{type:"number"},proxy:{type:"string"},query:{type:"string"}},required:["query"],type:"object"}` },
  write: { P: "b1c8240551df1596", S: `{properties:{content:{type:"string"},path:{type:"string"}},required:["path","content"],type:"object"}` },
}

/** ④ AC15-3 帽表：>8,000 逐档给由（报告态——零静默）。 */
const CAPS = {
  subagent:
    "契约事实保真下限：八个 action 的语义/参数/路由/副作用/错误形态 + 五角色矩阵 + 异步池/调度两族机制 = 该档契约本体；" +
    "三杠杆已用尽（参数面已整体改写为路由句；描述面两轮压缩 + 审计补回被删行为事实后无法再削——再削即删契约事实，违 §2.2.2「零语义增删」或破坏描述自含性）。" +
    "依 §2.2.3「不硬削」+ AC15-7：报告态上抛父侧裁（逐字文本权 = 主 agent，U2）。",
}

// ── ① 外置覆盖 ─────────────────────────────
test("① 外置覆盖：tool-docs 52 档在场 ∥ 逐档 description === read(<name>.md) 全量逐字节", () => {
  assert.equal(docNames.length, DOC_COUNT, `tool-docs 档数 ${docNames.length} ≠ ${DOC_COUNT}（计数与清单同改——D3）`)
  assert.equal(byName.size, DOC_COUNT, `装配面工具数 ${byName.size} ≠ ${DOC_COUNT}`)
  assert.equal(added, DOC_COUNT, `装配入口条数 ${added} ≠ ${DOC_COUNT}（重复挂载/漏挂——去重名数 ${byName.size}）`)
  assert.deepEqual(docNames.filter((n) => !byName.has(n)), [], "档无工具")
  assert.deepEqual([...byName.keys()].filter((n) => !docNames.includes(n)).sort(), [], "工具无档")
  let matched = 0
  for (const n of docNames) {
    const md = readFileSync(join(CORE, "tool-docs", `${n}.md`), "utf8")
    assert.equal(byName.get(n).description, md, `${n}: description ≠ tool-docs/${n}.md`)
    matched++
  }
  assert.equal(matched, DOC_COUNT, "覆盖计数 ≠ 52（空跑哨兵）")
})

// ── ② 零内联残留 ─────────────────────────────
test("② 零内联残留：52 名 DESC 各恰一处 ∥ name 邻接内联 description 零命中（白名单 = batch_segment 具名）", () => {
  assert.ok(surfaceRel.length >= 40, `扫描面过小：${surfaceRel.length} 档`)
  const sources = surfaceRel.map((rel) => ({ rel, src: readFileSync(join(CORE, rel), "utf8") }))
  const all = sources.map((s) => s.src).join("\n")
  let singleSrc = 0
  for (const n of docNames) {
    const cnt = all.split(`DESC("${n}")`).length - 1
    assert.equal(cnt, 1, `${n}: DESC("${n}") 出现 ${cnt} 次（应恰 1——外置单点）`)
    singleSrc++
  }
  assert.equal(singleSrc, DOC_COUNT, "单源计数 ≠ 52（空跑哨兵）")

  const WHITELIST = {
    batch_segment: "过渡别名 batchSegmentTool——非生产挂载（agent-tools.mjs 不入登记册）+ BATCH-RECORD §4.14 描述逐字冻结",
  }
  const residue = []
  const whitelisted = []
  const descShaped = []
  const orphans = []
  for (const { rel, src } of sources) {
    const lines = src.split("\n")
    lines.forEach((line, i) => {
      const m = line.match(/(?:^|[^\w$])name\s*:\s*["'`]([^"'`]+)["'`]/)
      if (!m) return
      const nm = m[1]
      if (!docNames.includes(nm) && !(nm in WHITELIST)) return
      // 邻接取最近一处 description：同行（name 之后）→ 向后 ≤6 行 → 向前 ≤3 行
      let hit = null
      for (let j = i; j <= Math.min(i + 6, lines.length - 1) && !hit; j++) {
        const dm = lines[j].match(/description\s*:\s*(.*)$/)
        if (dm) hit = { at: `${rel}:${j + 1}`, val: dm[1].trim() }
      }
      for (let j = i - 1; j >= Math.max(0, i - 3) && !hit; j--) {
        const dm = lines[j].match(/description\s*:\s*(.*)$/)
        if (dm) hit = { at: `${rel}:${j + 1}`, val: dm[1].trim() }
      }
      if (!hit) { orphans.push({ rel, nm, at: `${rel}:${i + 1}` }); return }
      const defForm = /^DESC\(/.test(hit.val) || /^applyPromptInjections\(/.test(hit.val)
      if (nm in WHITELIST) whitelisted.push({ rel, nm, at: hit.at })
      else if (!defForm) residue.push({ rel, nm, at: hit.at, val: hit.val.slice(0, 60) })
      else descShaped.push({ rel, nm, at: hit.at })
    })
  }
  assert.deepEqual(orphans, [], `邻接面缺 description 的具名工具：${JSON.stringify(orphans)}`)
  assert.deepEqual(residue, [], `内联残留（白名单外）：${JSON.stringify(residue)}`)
  assert.equal(descShaped.length, DOC_COUNT, `DESC 正形邻接 ${descShaped.length} ≠ ${DOC_COUNT}`)
  assert.equal(descShaped.length + whitelisted.length, DOC_COUNT + 1, "邻接命中总数 ≠ 53（档/白名单变动须同步）")
  assert.deepEqual(whitelisted.map((h) => h.nm).sort(), ["batch_segment"], `白名单命中集 ≠ 具名集：${JSON.stringify(whitelisted)}`)
  const alias = sources.find((s) => s.rel === "agent-tools/batch.mjs")?.src ?? ""
  assert.ok(alias.includes("Append your own section of the batch record"), "别名描述体失位（§4.14 冻结面漂移）")
  console.log(`② 扫描面 ${surfaceRel.length} 档 · 邻接命中 ${descShaped.length + whitelisted.length}（单源各恰一处 ${singleSrc} ∥ 正形邻接 ${descShaped.length} + 白名单 ${whitelisted.length}）· 残留 0`)
})

// ── ③ schema 结构面 ─────────────────────────────
test("③ schema 结构面：parameters 键集快照 + 深 sha 对四舱终态基线（52 档全覆盖）", () => {
  assert.deepEqual(Object.keys(TERMINAL).sort(), docNames, "基线档集合 ≠ 现盘档集合（快照须同步）")
  let checked = 0
  for (const n of docNames) {
    const t = byName.get(n)
    assert.equal(sha16(JSON.stringify(t.parameters ?? null)), TERMINAL[n].P, `${n}: parameters 深 sha 漂移（非描述文本的结构/文本变更）`)
    assert.equal(shape(t.parameters ?? null), TERMINAL[n].S, `${n}: 键集形状漂移（键集 ∥ enum ∥ required ∥ 嵌套）`)
    checked++
  }
  assert.equal(checked, DOC_COUNT, "结构面计数 ≠ 52（空跑哨兵）")
  // 跨舱伴生核（T4-after 读数对拍——可缺省：件不在位 ⇒ 打印跳过；基线条目仍为全量冻结断言）
  const t4Path = join(REPO, "docs/batches/2026-09-29-tools-carryover-t4-readings.after.json")
  if (!existsSync(t4Path)) { console.log("③ 跨舱伴生核（T4-after）：伴生件不在位——跳过"); return }
  const t4 = JSON.parse(readFileSync(t4Path, "utf8"))
  const recs = (t4.tools ?? []).filter((e) => e?.name && e?.paramsSha)
  let matched = 0
  for (const e of recs) {
    const t = byName.get(e.name)
    assert.ok(t, `T4 伴生件含未装配条目：${e.name}`)
    assert.equal(sha16(JSON.stringify(t.parameters ?? null)), e.paramsSha, `${e.name}: 与 T4-after 伴生读数 paramsSha 不一致`)
    matched++
  }
  assert.ok(matched >= 11, `T4 伴生件有效条目 ${matched} < 11（件损坏/截断？）`)
  console.log(`③ 跨舱伴生核（T4-after）：paramsSha 对拍 ${matched} 条一致`)
})

// ── ④ AC15-3 帽表 ─────────────────────────────
test("④ AC15-3 帽表：>8,000 逐档给由（报告态——新增超限须给由、消限须撤行）", () => {
  const over = []
  const charsOf = new Map()
  for (const n of docNames) {
    const t = byName.get(n)
    const chars = JSON.stringify({ description: t.description ?? "", parameters: t.parameters ?? null }).length
    charsOf.set(n, chars)
    if (chars > 8000) over.push(n)
  }
  assert.deepEqual(over.sort(), Object.keys(CAPS).sort(), `超限集 {${over.join(",")}} ≠ 帽表 {${Object.keys(CAPS).join(",")}}`)
  for (const [n, reason] of Object.entries(CAPS)) {
    assert.ok(typeof reason === "string" && reason.length >= 40, `${n}: 给由缺失/过短（零静默）`)
  }
  console.log("④ AC15-3：超 8,000 档 ——")
  for (const n of over) console.log(`   ${n}: ${charsOf.get(n)} 字符 · 由：${CAPS[n]}`)
  if (!over.length) console.log("   （无）")
})
