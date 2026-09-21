# 批次档 · 2026-09-21 · 产品文本面三处收正（readme-text-fixes）

> 前情 = 无（三条各自在册：台账 **#194** · **#192-F5** · **#182**）。
> 触发：用户 2026-09-21 13:02「**修**」——对发版送审单 ②（送审面三条文本项修不修）的裁决 = **三条全修** ✓；发布问题未答 ⇒ 发布仍挂起 ✓。
> 授权：**父侧代点火 / 代批准（用户 2026-09-21 12:00「自动跑到完成吧」）** + 范围 = 用户明令「修」✓；自缚照旧：① 代签仅当「评审 pass（0🔴）∧ 落点逐条核验 ∧ token 已签发」② 代签在 §4 写明授权与依据 ③ 新范围 / 口径裁决 ⇒ 停下不代签 ④ 射程 = 本批收口。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：已收口 2026-09-21

**条目（三条 · 均为产品文本面 = 发出去给用户看的声明面）**：

| # | 落点 | 现状（证据） | 收正方向 |
|---|---|---|---|
| ① | `thincoder-core/README.md:65`（#194） | 「`tool-docs/` — **one file per built-in tool**; these texts are what the model reads as tool descriptions.」——`tool-docs/` 24 档 = **共享面**工具（`thincoder-core/test/tool-registry.test.mjs:26-31` SHARED_FACE）；另 **8 个 instance-bound 工具**（同档 `:34` INSTANCE_BOUND）描述内联于模块（例：`repo_outline` 在 `tools/repomap.mjs:299`）⇒ 句面偏窄 | 句面收到与实况一致（共享面口径 ✗ 不扩写机制细节 ✗ 保持 README 语气与行宽） |
| ② | `thincoder-vscode/README.md:176`（#192-F5） | 结构树仍列 `src/prompts/`（该目录已删——提示词已归一入核） | 按现树实读收正（或删该行 ✗ 以实读为准 ✗ 不重排全树） |
| ③ | `thincoder-cli/README.md:171-193`（#182） | Architecture 段仍列**核统一前**自持树（`provider/` / `tools/` / `mcp/` / `agent.mjs` / `memory/` / `session.mjs` / `config.mjs` 等）——实核 `thincoder-cli/src/` 现仅 `acp/` / `cli/` / `tui/` + 8 档 | 段内收正到现树（保持段形与语气 ✗ 不重排全文） |

**边界**：恰三档 ✗ 只改上述点位（含同段连带的列举行）✗ 禁机制 / 结构改动 ✗ 禁全文重写 ✗ 禁动其他档 ✗ 行宽与语气随各档现状 ✓。
**验收（方向 · 判据由设计轮定稿）**：三条各自「旧串零命中 + 新串在场」可 grep ✗ 三档 diff 面 = 各段局部 ✓。
**与发布的关系**：① 随核 `0.9.2`（未发布 ⇒ 顺带 ✓）✗ ②③ 随 CLI `0.12.64` / VSC `0.9.4`（同趟 ✓）——**发布动作 = 用户门 ✗ 仍挂起** ✓（发布问题另答）。

## §2 批次任务（eng-designer）

**状态行**：🔄 设计完成（initial · 2026-09-21 · eng-designer）——设计正文 = 本段下方追加块（本段为唯一设计承载 · `docs/core/design/**` 零改，遵 §1 边界）。

> 本批唯一设计承载 = 本段（产品文本面小批——不另建设计档 · `docs/core/design/**` 零改）。三条 = 逐字 before → after + 落点 + 机判 + 受影响表（恰三档）。台账 #194 · #192-F5 · #182。

**读数锚（as-of 2026-09-21 实读）**

| 档 | 行数 | 最长行 | 本批后 | 改动面 |
|---|---|---|---|---|
| `thincoder-core/README.md` | 89 | 161 | 89 | ① `:65` 单行换字（+7 字符 → 110） |
| `thincoder-vscode/README.md` | 206 | 284 | 204 | ② `:162-178`（17 行）→ 15 行 |
| `thincoder-cli/README.md` | 479 | 1167 | 461 | ③ `:169-205`（37 行）→ 19 行 |

- **`.md` 豁免档位注**：三档均**不在** doc-check 扫描域（`PROJECT-MANIFEST.json:20-33`：`scanDirs=["docs"]` · `lineWidth=300` · 锚域 = `docs`）⇒ 行宽 / 锚机检不适用本批；`.mjs` 档位限（300 建议 / 500 硬限）对 `.md` 不适用；本批**零触 `.mjs`**。
- **风格约束（三档同）**：全英文 ✓ 语气随各档现文 ✓ 新行 ≤ 各块现最长行（② 块 107 → 新 99 · ③ 块 144 → 新 124）✓ 行数口径 = 尾换行计法（与 `wc -l` 等值）。

## ① `thincoder-core/README.md:65`（#194——「one file per built-in tool」偏窄）

**段与落点**：`## Shared prompt content` 段（`:57-70`）第二 bullet；同段 `:59-61` 引言 · `:63-64` `prompts/` bullet · `:67-70` 工具面 2 锚例外句段 = **逐字不动**（连带面零改）。

**before（逐字 · `:65`）**

```
- `tool-docs/` — one file per built-in tool; these texts are what the model reads as tool descriptions.
```

**after（逐字 · 1 行替换 · 仍 89 行）**

```
- `tool-docs/` — one file per static built-in tool; these texts are what the model reads as tool descriptions.
```

**口径（「static」之据）**：`tool-docs/` 24 档 = 静态表 **23 档逐名一档**（`thincoder-core/tools/index.mjs:19-27` 实读——`read_image` 依同档 `:17-18`「deliberately NOT here」在外）+ **能力门控 `read_image.md` 一档**（`thincoder-core/tool-docs/` ls = 24 档 ✓）（父侧直接执行 · 打标 ✓ · 可 revert）；
另 8 个 instance-bound 工具（memory / code_search / doc_search / repo_outline / settings / peer_instances / ledger_query / ledger_count）**描述内联于模块**
（`thincoder-core/tools/repomap.mjs:299-300` `repo_outline` 描述逐字实读）⇒ 原句在「built-in 全集」语义下不实。
「static」= 码内词（`tools/index.mjs:44`「the instance-independent static table」· `test/tool-registry.test.mjs:51`「static tool」）✓ 不引计数 ✓ 不引文档指针 ✓ 不扩机制细节 ✓ 语气随原句 ✓。

**逐字承载更新（沿革 · 必记）**：核 README 全文逐字承载原 = `docs/batches/2026-09-21-core-readme.md` §2 A 块（该句在 `:144`）；该批 §6 已**冻结核**（不回改）⇒ **本段 = `:65` 现行逐字承载** ✓ 前批 §6「README 与 A 块逐字」核 = 彼时成立的历史读数（今差异 = 预期沿革 ✗ 非缺陷 ✗ 不追改冻结档）✓ 前批 JC2 检串（9 串）不涉本句（设计轮实跑 = `OK(claims: 9 in / 0 residual)`）⇒ 不改红 ✓。

**机判 JC-1（仓根运行 · 纯 ASCII）**

```
node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-core/README.md','utf8');const bad=t.includes('one file per built-in tool');const good=t.includes('one file per static built-in tool');console.log((good&&!bad)?'OK(core README: static wording in / old wording gone)':'FAIL new='+good+' old='+bad);process.exit(good&&!bad?0:1)"
```

基线（设计轮实跑）= `FAIL new=false old=true` ⇒ 实施后预期 `OK(core README: static wording in / old wording gone)` · exit 0。diff 面另判（JC-4）：仅 `:65` 一行不同 · 89 行不变。

## ② `thincoder-vscode/README.md` 结构树（#192-F5）

**段与落点**：`### Project Structure` 段（`:154-191`）· 代码块 `:156-191`；**改动面 = `├── src/` 子树 `:162-178`（17 行）→ 15 行**；`:157-161` 顶部四行 · `:179-188` `webview/` 子树 · `:189-190` `docs/` 两行 = **逐字不动** ✓。

**§1 行 ② 所述与实况之差（发现 · 必报）**：§1 只记 `:176` `src/prompts/` 一行；实读该子树 = **8 行幽灵 + 8 项漏列**（下表）⇒ 按 §1 收正方向「按现树实读收正 · 以实读为准」判为**同块同因 ⇒ 整块收正**（单删一行 ⇒ 同块仍余 7 处假陈述 ✗ 见 KD-②）。

**逐行核对（as-of 实读 · 幽灵 / 漏列）**

| 块内行 | 行文（片段） | 实况（`thincoder-vscode/src/` 实读） |
|---|---|---|
| `:163` `:165` `:166` `:171` `:174` | `agent-tools/` · `tools/` · `tools.mjs` · `extension/` · `repomap.mjs` | ✓ 在盘 · **描述换写**（与 `:175` 同口径——行在 ∧ 描述随现树更新；after 块 / JC-2 NEW 串已含五者新描述）（父侧直接执行 · 打标 ✓） |
| `:164` | `agent-tools.mjs    # Re-export shim` | ✗ **幽灵** |
| `:167` `:168` | `provider/` · `provider.mjs` | ✗ **幽灵** |
| `:169` `:170` | `mcp/` · `mcp.mjs` | ✗ **幽灵** |
| `:172` `:173` | `config.mjs` · `memory.mjs` | ✗ **幽灵** |
| `:175` | `specs.mjs          # Re-export from config.mjs` | 档在 ✓ / **描述指已删档 ✗**（本行换描述） |
| `:176-178` | `prompts/`（3 行） | ✗ **幽灵**（提示词已归一入核） |
| — | **漏列 8 项** | `agent/`（11 档）· `agent.mjs` · `config-mcp.mjs` · `embed-config.mjs` · `explore-distill.mjs` · `i18n.mjs` · `memory-tool.mjs` · `prompt-injections.mjs` |

**before（逐字 · `:162-178`）**

```
├── src/
│   ├── agent-tools/       # Meta-tools — task, subagent, plan, goal, verify, skill
│   ├── agent-tools.mjs    # Re-export shim
│   ├── tools/             # File/system/git/web/bash tools (20+)
│   ├── tools.mjs          # Re-export shim
│   ├── provider/          # Provider rate gate
│   ├── provider.mjs       # LLM provider with retry + re-exports rate
│   ├── mcp/               # MCP transport (stdio, http)
│   ├── mcp.mjs            # Re-export shim
│   ├── extension/         # Extracted modules — presets, session-io, settings
│   ├── config.mjs         # Model capability specs (self-contained)
│   ├── memory.mjs         # Long-term memory (FTS5)
│   ├── repomap.mjs        # Repository dependency graph
│   ├── specs.mjs          # Re-export from config.mjs
│   └── prompts/           # System prompts — slot-based (PROMPT-SYSTEM): persona-{engineering,normal,
│   │                       eng-coder,explore,coder,plan} + common + discipline-{engineering,normal}
│   │                       + special (consult-base / advisor-{design,round1-3}); assembly = assemblePrompt
```

**after（逐字 · 15 行 · 行 162 起 · 注释列对齐「名 + 2 空格」= 最长名 `prompt-injections.mjs`）**

```
├── src/
│   ├── agent/                 # Shell assembly — setup, tool table, run stages, reminders, gates
│   ├── agent.mjs              # Agent loop — tool batching, image injection, compaction, subagents
│   ├── agent-tools/           # Meta-tool wiring — registry re-export + stop/discard face
│   ├── config-mcp.mjs         # MCP config shell — panel edits persist to config
│   ├── embed-config.mjs       # Embedding / vector config shell
│   ├── explore-distill.mjs    # Explore-summary adapter (core summarizer wrapper)
│   ├── extension/             # Chat panel modules — panel-*, session slots/IO, settings, presets
│   ├── i18n.mjs               # UI translation shell (core dictionary + end keys)
│   ├── memory-tool.mjs        # memory tool shell face (core memory single source)
│   ├── prompt-injections.mjs  # Prompt-anchor values for this end — tool face (bash / question)
│   ├── repomap.mjs            # Repository dependency outline (workspace.fs data source)
│   ├── specs.mjs              # Model capability specs (core table + end-side additions)
│   ├── tools/                 # Host tools — code, context, focus, shell + core tool wiring
│   └── tools.mjs              # Re-export shim → src/tools/index.mjs
```

**新行依据（逐行 · as-of 实读）**：`agent/` `agent.mjs` `agent-tools/` `config-mcp.mjs` `embed-config.mjs` `explore-distill.mjs` `i18n.mjs` `memory-tool.mjs` `prompt-injections.mjs`
`specs.mjs` `tools/` `tools.mjs` 描述 = `thincoder-vscode/AGENTS.md:42-56` 模块图逐行（英文转写 · 不新增语义）；`extension/` = 同档 `:56` + 目录实读（48 档）。
`prompt-injections.mjs` 描述取「tool face (bash / question)」= `thincoder-vscode/src/prompt-injections.mjs:16-21` 实读（2 键）——**避开 `AGENTS.md:15`/`:51`「13 锚」陈旧读**（#192-F7 在册 · 非本批 · 见 F-C）。

**机判 JC-2（仓根运行 · ASCII 片段 + 覆盖式）**

```
node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-vscode/README.md','utf8');const NEW=['agent/                 # Shell assembly','agent.mjs              # Agent loop','agent-tools/           # Meta-tool wiring','config-mcp.mjs         # MCP config shell','embed-config.mjs       # Embedding','explore-distill.mjs    # Explore-summary adapter','extension/             # Chat panel modules','i18n.mjs               # UI translation shell','memory-tool.mjs        # memory tool shell face','prompt-injections.mjs  # Prompt-anchor values for this end','repomap.mjs            # Repository dependency outline','specs.mjs              # Model capability specs','tools/                 # Host tools','tools.mjs              # Re-export shim'];const OLD=['prompts/           # System prompts','agent-tools.mjs    # Re-export shim','provider/          # Provider rate gate','provider.mjs       # LLM provider with retry','mcp/               # MCP transport','mcp.mjs            # Re-export shim','config.mjs         # Model capability specs','memory.mjs         # Long-term memory','specs.mjs          # Re-export from config.mjs'];const miss=NEW.filter(s=>!t.includes(s));const res=OLD.filter(s=>t.includes(s));const cov=fs.readdirSync('thincoder-vscode/src').filter(e=>!new RegExp(e.replace(/[.]/g,'\\.')+'/?\\s+#').test(t));console.log((miss.length||res.length||cov.length)?'FAIL miss='+JSON.stringify(miss)+' residue='+JSON.stringify(res)+' uncovered='+JSON.stringify(cov):'OK(vsc tree: 14 rows in / 0 ghost residue / src covered)');process.exit(miss.length+res.length+cov.length?1:0)"
```

基线（设计轮实跑）= `FAIL miss=14 residue=9 uncovered=11`（residue 逐条 = 上表幽灵行片段；**uncovered 口径注**：简单「名+空+#」式重算 = 8，与实跑 11 差 = 匹配口径未对齐 ⇒ 实施判据取「miss 14 / residue 9 如列 ∧ 实施后 0 uncovered」，uncovered 基线以实跑为准 ✓）（父侧直接执行 · 打标 ✓ · 可 revert）⇒ 实施后预期 `OK(vsc tree: 14 rows in / 0 ghost residue / src covered)` · exit 0。覆盖式（`readdir('thincoder-vscode/src')` 14 项逐名有行）= 本批后防再漂的锁 ✓。

## ③ `thincoder-cli/README.md` Architecture 段（#182）

**段与落点**：`## Architecture`（`:166-206`）· 代码块 `:168-206`；**改动面 = 块内容 `:169-205`（37 行）→ 19 行**；`:168`/`:206` 围栏两行 · 其下 `Key design decisions` 列表（`:208-215`）= **不动**（逐条实读 = 行为面陈述 · 仍成立）✓。

**幽灵面（核统一前自持树 · 实读）**：`provider/` `embedding.mjs` `tools/` `tools.mjs` `mcp/` `mcp.mjs` `agent.mjs` `agent/` `agent-tools/` `context.mjs` `memory/` `memory.mjs`
`session.mjs` `skills.mjs` `markdown.mjs` `git/` `config.mjs` `prompts/` `tui-render.mjs` = **19 项不在盘**（`thincoder-cli/src/` 实读 = 仅 `acp/` `cli/` `tui/` + 8 档）；
**漏列 9 项** = `acp/` `acp.mjs` `cli/` `completions.mjs` `crash-reports.mjs` `heap-watch.mjs` `prompt-injections.mjs` `upgrade.mjs` + `bin/thincoder.cjs`。

**before（逐字 · `:169-205`）**

```
bin/thincoder.mjs   command entry (tui / chat / memory / sync / distill)
src/
  provider/         LLM calls — core.mjs (fetch, SSE streaming, reasoning_content, usage, retries),
                    rate.mjs (TPM/RPM proactive rate gate), index.mjs (entry)
  embedding.mjs     vector embeddings (OpenAI-compatible /v1/embeddings)
  tools/            16 builtin tools + MCP wrapping + readonly scheduling flags
                    index.mjs (registry), file/git/patch/system/web.mjs (groups), shared.mjs (schema utils),
                    repomap.mjs (repo dependency outline: import/export regex parsing, on-demand via tool)
  tools.mjs         re-export shim → src/tools/index.mjs
  mcp/              MCP client — helpers.mjs, transport-stdio/http/ws.mjs (JSON-RPC, zero-dependency)
  mcp.mjs           MCP client entry (connectMcpServer), delegates to src/mcp/
  agent.mjs         main loop + two-phase tool execution + reminder injection + completion guard + fix-verify loop
                    + incremental indexing (auto reindexFile after write/edit/delete)
  agent/            agent loop helpers — dispatch.mjs (two-phase execution), setup.mjs (system prompt assembly), helpers.mjs
  agent-tools/      self-discipline tools (task/plan/goal/verify/subagent/skill/recent_changes)
  context.mjs       rough token estimation + history compaction + task re-injection
  memory/           three-layer memory — schema.mjs (DDL/constants), core.mjs (CRUD + retrieval),
                    code-index.mjs + code-sync.mjs (code_chunks), docs.mjs (doc_chunks)
  memory.mjs        re-export shim → src/memory/*
  session.mjs       session persistence (unlimited archive slots, isolated by project cwd, process-level isolation via sessionId + slotSessions)
  skills.mjs        skill discovery/loading (.thincoder/skills/*.md)
  markdown.mjs      entry format (frontmatter parse/serialize)
  git/              checkpoint.mjs (git patch snapshots / rewind), gitmem.mjs (Team layer git sync)
  distill.mjs       session knowledge extraction (candidates + human confirmation)
  config.mjs        config loading
  tui/              bare-ANSI terminal UI — index.mjs (startTUI), render.mjs (drawing primitives),
                    render-frame.mjs (frame layout), render-conversation.mjs (conversation panel),
                    markdown.mjs (lightweight inline markdown → ANSI), mouse.mjs (SGR clicks),
                    clipboard.mjs (paste/copy), ansi.mjs
  tui.mjs           re-export shim → src/tui/index.mjs
  tui-render.mjs    re-export shim → src/tui/render.mjs
  prompts/          prompt texts — slot-based (PROMPT-SYSTEM): persona-engineering / persona-normal /
                    persona-{eng-coder,explore,coder,plan,eng-designer} + common + discipline-engineering / discipline-normal
                    + special modules (consult-base / advisor-design / advisor-round{1,2,3});
                    assembly = assemblePrompt (prompt-overlays.mjs): persona → common → discipline → [4] AGENTS+skills
test/               node:test offline unit tests (npm test)
scripts/            real-environment verification scripts (compaction, team sync)
```

**after（逐字 · 19 行 · 行 169 起）**

```
bin/thincoder.mjs   command entry (tui / chat / memory / sync / distill / reindex / completion / upgrade / acp / session gc)
bin/thincoder.cjs   CommonJS shim → bin/thincoder.mjs
src/
  acp/                   Agent Client Protocol bridge — bridge, client caps, session/slot handlers, login, transport
  acp.mjs                thincoder acp entry → src/acp/
  cli/                   top-level command implementations — setup-wizard, memory-command, distill-command,
                         make-agent (assembly), permission
  completions.mjs        shell completion scripts (thincoder completion <shell>)
  crash-reports.mjs      crash capture and forensics — fatal records, stderr capture, heap snapshots
  distill.mjs            session knowledge extraction (candidates + human confirmation)
  heap-watch.mjs         heap telemetry / watchdog
  prompt-injections.mjs  prompt-anchor values for this end — tool face (bash / question)
  tui/                   bare-ANSI terminal UI — index.mjs (startTUI), frame/conversation rendering,
                         key handling, mouse/clipboard, the cmd-* command family, subagent panels
  tui.mjs                re-export shim → src/tui/index.mjs
  upgrade.mjs            version check and self-upgrade
test/               node:test offline unit tests (npm test)
scripts/            repo-side scripts — release check, doc-impact, syntax/endpoint probes,
                    real-environment verification (compaction, team sync)
```

**新行依据（as-of 实读）**：`acp/` `acp.mjs` `cli/` `completions.mjs` `crash-reports.mjs` `distill.mjs` `heap-watch.mjs` `prompt-injections.mjs` `tui/` `tui.mjs` `upgrade.mjs`
描述 = `thincoder-cli/AGENTS.md:50-62` 模块图逐行（英文转写）；命令集 = `thincoder-cli/bin/thincoder.mjs` switch 实读（`tui` / `chat` / `memory` / `sync` / `distill` / `reindex` / `completion` / `upgrade` / `acp` / `session gc`——旧行只列 5 个 = 漏列）；
`bin/thincoder.cjs` = 同档 `:50` + 档首 `:1-4` 实读（CJS shim）；`scripts/` 描述 = 7 档 ls 实读（release-check / doc-impact / check-syntax / key-probe / verify-endpoints / verify-compress / verify-team）。

**机判 JC-3（仓根运行 · ASCII 片段 + 覆盖式）**

```
node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-cli/README.md','utf8');const NEW=['acp/                   Agent Client Protocol bridge','acp.mjs                thincoder acp entry','cli/                   top-level command implementations','completions.mjs        shell completion scripts','crash-reports.mjs      crash capture and forensics','distill.mjs            session knowledge extraction','heap-watch.mjs         heap telemetry','prompt-injections.mjs  prompt-anchor values for this end','tui/                   bare-ANSI terminal UI','tui.mjs                re-export shim','upgrade.mjs            version check and self-upgrade','bin/thincoder.cjs','reindex / completion / upgrade / acp / session gc)','doc-impact'];const OLD=['provider/         LLM calls','embedding.mjs     vector embeddings','tools/            16 builtin tools','tools.mjs         re-export shim','mcp/              MCP client','mcp.mjs           MCP client entry','agent.mjs         main loop','agent/            agent loop helpers','agent-tools/      self-discipline tools','context.mjs       rough token estimation','memory/           three-layer memory','memory.mjs        re-export shim','session.mjs       session persistence','skills.mjs        skill discovery','markdown.mjs      entry format','git/              checkpoint.mjs','config.mjs        config loading','tui-render.mjs    re-export shim','prompts/          prompt texts'];const miss=NEW.filter(s=>!t.includes(s));const res=OLD.filter(s=>t.includes(s));const cov=fs.readdirSync('thincoder-cli/src').filter(e=>!new RegExp('(^|\\n)\\s*'+e.replace(/[.]/g,'\\.')+'/?\\s{2,}').test(t));console.log((miss.length||res.length||cov.length)?'FAIL miss='+JSON.stringify(miss)+' residue='+JSON.stringify(res)+' uncovered='+JSON.stringify(cov):'OK(cli tree: 14 rows in / 0 ghost residue / src covered)');process.exit(miss.length+res.length+cov.length?1:0)"
```

基线（设计轮实跑）= `FAIL miss=14 residue=18 uncovered=9`（**uncovered 口径注**：重算 = 8，差 = 口径未对齐 ⇒ 判据取「miss 14 / residue 18 如列 ∧ 实施后 0 uncovered」，基线以实跑为准 ✓）（父侧直接执行 · 打标 ✓ · 可 revert）⇒ 实施后预期 `OK(cli tree: 14 rows in / 0 ghost residue / src covered)` · exit 0。

## ④ 受影响文件表 + 机判（汇总）

**受影响文件表（as-of 2026-09-21 实读 · 行数 = 尾换行计法）**

| 档 | 现状 | 改点 | 预期（实施后） | 判据 |
|---|---|---|---|---|
| `thincoder-core/README.md` | 89 行 / 最长行 161 | ① `:65` 单行换字 | 89 行（±0）· `:65` = 110 字符 | JC-1 · JC-4① |
| `thincoder-vscode/README.md` | 206 行 / 最长行 284 | ② `:162-178`（17 行）→ 15 行 | 204 行（−2）· 块最宽 107 → 99 | JC-2 · JC-4② |
| `thincoder-cli/README.md` | 479 行 / 最长行 1167（预存在 · 非本批） | ③ `:169-205`（37 行）→ 19 行 | 461 行（−18）· 块最宽 144 → 124 | JC-3 · JC-4③ |
| 其余全仓档 | — | 零改 | ±0（含 `src/**` · prompts / tool-docs · 需求 / 设计档 · 台账） | JC-5 |

**`.md` 豁免档位注**：三档均 `> 300` 行但 `.md` 不受 `.mjs` 档位（300 / 500）约束；三档亦不在 doc-check 域（同「读数锚」）⇒ 本批无行宽 / 锚机检面，判据 = 上表 5 条。

**JC-4（逐字复核 + diff 面局部 · 脚本文件形）**：实施轮写 `.thincoder/tmp/jc-readme-text-fixes.mjs`（`gitignore` 覆盖 · 不入改动面）后跑 `node .thincoder/tmp/jc-readme-text-fixes.mjs`，断言：

1. ① 核 README 行数 = **89** ∧ `:65` 与本段 after 行逐字等 ∧ 与 `git show HEAD:`（已提交 ⇒ `HEAD^`）逐行比对 = **仅序号 65 一行不同**。
2. ② VSC README 行数 = **204** ∧ `:162-176` 与本段 after 15 行逐行逐字等 ∧ 变更行域 ⊆ `:162-178`（`git diff -U0` hunk 头全落域内）。
3. ③ CLI README 行数 = **461** ∧ `:169-187` 与本段 after 19 行逐行逐字等 ∧ 变更行域 ⊆ `:169-205`。
4. 三档字节面：UTF-8 / LF / 无 BOM / 尾换行保持（除改点外与 HEAD 同）。

> 脚本字面量 = 本段 ①/②/③ 的 after 块**照抄**（逐字承载 = 本段；勿手抄改写）。

**JC-5（改动面 · 防夹带）**：开工前存 `git status --porcelain > .thincoder/tmp/readme-before.txt`（`.thincoder/tmp/` 已 gitignore）；收工后快照差集 ⊆ `{thincoder-core/README.md, thincoder-vscode/README.md, thincoder-cli/README.md, docs/batches/2026-09-21-readme-text-fixes.md}` ✓（多批并行下他批在飞档由快照差集分辨）。

## ⑤ 边界 + 决策记录

**边界（本批不做）**：恰三档（含同段连带行）之外零触 ✗ 机制 / 结构 / 代码零改 ✗ 全文重写 ✗ 新增需求条目 ✗ 需求档 / 设计档 / 台账零改 ✗ prompts / tool-docs 内容 ✗ 版本号 / CHANGELOG / `package.json` ✗ ② 的 `webview/` 子树与 `docs/` 两行（实存 ✓ / 非穷尽列举属块现形）· ③ 的 `Key design decisions` 列表（行为面 · 实读仍成立）✗ UI 面（本批无）⇒ **无 open 项**。

**KD-①（① 口径 =「static」）**：据 = `tool-docs/` 24 档 = **静态表 23 档逐名一档**（`tools/index.mjs:19-27`）+ **能力门控 `read_image.md` 一档** + 8 个 instance-bound 描述内联（`tools/repomap.mjs:299-300`）⇒ 原句「per built-in tool」在全集语义不实。
**被否形**：(a) 保留原句 ✗（不实）；(b) **「per shared-face built-in tool」（§1 建议形）✗**——「shared face」源内两义：`test/tool-registry.test.mjs:8`（「the assembled list is the shared face」）/`:25`（「= `builtinTools` + the instance-bound faces + the gated image tool」）
⇒ shared face = **完整装配面**（含 8 个 instance-bound）⇒ 按该定义仍不实，仅 const 名（`:26`）才 = 24；(c) 加例外句「其余描述内联于模块」✗（违「不扩写机制细节」）；(d) 删句 ✗（信息丢失）。
**备选词** = 「instance-independent built-in tool」（码内原词 · 替换后 124 字符 < 161 可行）——若父侧要码内原词，一词换即可（JC-1 检串同步）。

**KD-②（② 收正面 = `src/` 子树整块 · 只删幽灵 + 补漏列）**：据 = §1 方向「按现树实读收正 · 以实读为准」+ 同块同因（8 幽灵 / 8 漏列）；形式 = 保块形（每项一行 · 名 + 注释列 + 单行注释 · 盒线符保留）✗ 不重排全树。
**被否形**：(a) 仅删 `:176-178` ⇒ 同块仍余 7 处假陈述（`provider/` `mcp/` `config.mjs` `memory.mjs` `agent-tools.mjs`）；(b) 缩为例示子集 ⇒ `src/` 段现形 = 逐项列举（含 shim 行）⇒ 例示化 = 语义变更；(c) 加「非穷尽」注 ⇒ 新增段落语义。

**KD-③（③ 收正面 = 块内容整块 · 含 `bin/` 与 `scripts/` 行）**：据 = §1 行 ③「段内收正到现树（保持段形 ✗ 不重排全文 ✗ 不新增段落语义）」；补 `bin/thincoder.cjs` 行 + 命令集补全（switch 实读）+ `scripts/` 描述更新（7 档实读）。**被否形**：(a) 只删幽灵行 ⇒ `src/` 段仍漏 8 项（同 KD-② 逻辑）；(b) 补 `docs/` 行 ⇒ 原块未列 · 新增列举语义 ✗。

**发现表（必报 · 处置由父侧 / 评审裁）**

| # | 落点 | 事实 | 处置 |
|---|---|---|---|
| F-A | 本批 §1 行 ② | 实况 > 所述（8 幽灵 + 8 漏列，非仅 `:176` 一行） | 设计按同块同因整块收正（KD-②）；若父侧要严格单行 ⇒ 回退「仅删 `:176-178`」（不推荐：同块余 7 处假陈述） |
| F-B | `thincoder-core/test/tool-registry.test.mjs:8`/`:25` vs `:26` | 「shared face」两义（注释 = 完整装配面；const 名 = 24） | ① 取「static」（KD-①）；备选一词替换 |
| F-C | `thincoder-vscode/AGENTS.md:15` · `:51` | 「13 锚 VSC 取值表」陈旧（实读 `src/prompt-injections.mjs:16-21` = 2 键）——#192-F7 在册 | 表外第 4 档 ⇒ 未动 · 报父侧 |
| F-D | `thincoder-vscode/README.md:189-190` | `docs/` 行：`docs/design/` 现仅容 `_archive/`（归档面 = `docs/_archive/{batches,design,requirements}`；`AGENTS.md:7` 述「`docs/_archive/design/`」）⇒ 标签可议 | 判「非客观假」（路径在盘）⇒ 未动 · 报父侧 |
| F-E | `thincoder-cli/README.md:98` | 1167 字符单行（预存在 · 非本批 · 产品 README 不在 doc-check 域） | 未动 · 登记报父侧 |

## ⑥ 与发布列车的关联

| 项 | 落点 | 随发布 |
|---|---|---|
| ① | 核 README | 核 `0.9.2`（含启动修复 + README / LICENSE 首发）——未发布 ⇒ 顺带 ✓ |
| ②③ | VSC / CLI README | VSC `0.9.4` · CLI `0.12.64`（同趟 ✓） |

**发布动作 = 用户门 ✗ 仍挂起**（`#189`：用户 2026-09-21 12:11「发布不着急，等我看一眼再发布」）⇒ 本批交付 = 送审面 ✓ 不代发 ✓。

## 自检（设计轮 · 2026-09-21）

- 三条逐条有「坐标 → 现文（逐字）→ 新文（逐字）→ 机判」✓（① `:65` · ② `:162-178` · ③ `:169-205`）· 可直接落笔 ✓
- 受影响表 3 档齐 + 行数 as-of + `.md` 豁免注 ✓
- 边界 / 决策记录（含被否形）/ 发布关联 ✓
- 三档其余处零触碰判据在场 ✓（JC-4 逐字复核 + hunk 域 + 行数 89 / 204 / 461 + 字节面 · JC-5 快照差集 = 恰三档）
- 三档现文 = 实读（`read` / `ls` / `grep` / `node` 逐处核对）· 除标注者外无 unverified 主张 ✓
- 段内长行披露：§2 超 300 字符者 = **3 行**（JC-1/2/3 命令单行 · 341 / 1597 / 1875——命令保字面不可折）；其余 0 行 ✓ 该形与 `docs/batches/**` 现例一致（`2026-09-21-core-readme.md` 同类 20 行 · 最长 1458）；且 `batches` 段在 doc-check 源域外（`scripts/doc-check-targets.mjs:24` 逐层跳过 `checkConfig.anchors.exclude`——含 `batches`）✓

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

**评审面**：`docs/batches/2026-09-21-readme-text-fixes.md` 全读。核验（本轮实读，路径以仓根 `D:/teamcode/thincoder/` 为基）：三 README 现文逐字 + `thincoder-vscode/src`/`thincoder-cli/src`/`thincoder-cli/scripts`/`tool-docs` 实盘 + `thincoder-core/tools/index.mjs`·`test/tool-registry.test.mjs`·`tools/repomap.mjs` + 双端 AGENTS.md 模块图 + `bin/thincoder.mjs` switch + `PROJECT-MANIFEST.json` + `scripts/doc-check-targets.mjs` + `.gitignore`；行数 89/206/479、最长行 161/284/1167、块域内无 ≥108/≥145 行、before/after 逐字、JC-2/JC-3 全部 NEW/OLD 字面与 after 块间距逐行对齐——均成立。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements | 🟡 | ① 依据行与实盘对不上：§2:57 与 KD-①（§2:259）称「`tool-docs/` 24 档 ↔ 静态表逐名一档（`thincoder-core/tools/index.mjs:17-27` / `:19-27`）」；实读静态表（`thincoder-core/tools/index.mjs:19-27`）= 23 档（`read_image` 依 `:17-18` 注释「deliberately NOT here」被排除），`thincoder-core/tool-docs/` 实为 24 档（含 `read_image.md`）⇒ 24 ↔ 23 差 1（差项 = 能力门控 `read_image`）。句面用词按已裁「static」为准、不重开；本行只报依据行。 | 依据行改到与 24 档实际构成一致（如「静态表 23 档逐名一档 + 能力门控 `read_image.md` 一档」），使该等式可复核。 |
| 2 | Clarity | 🟡 | ② 逐行核对表把 `thincoder-vscode/README.md:163/:165/:166/:171/:174` 五行标「✓ 在盘（不动）」，但 after 块（批档 :116-130）对五行全部换写描述（`:163`「Meta-tools — …」→「Meta-tool wiring — …」；`:165`「…(20+)」→「Host tools — …」；`:166` 补「→ src/tools/index.mjs」；`:171`「Extracted modules — …」→「Chat panel modules — …」；`:174`「Repository dependency graph」→「…outline (workspace.fs data source)」），同表 `:175` 反标「本行换描述」⇒ 表内口径不一；照「不动」直译实施 ⇒ JC-2 的 NEW 串当场失败。 | 该行标注与 after 块对齐（如「在盘 · 描述换写」，与 `:175` 同口径）；after 块与 JC-2 已含这五行的新描述串。 |
| 3 | Acceptance | 🔵 | JC-2/JC-3 的「基线（设计轮实跑）」uncovered 数在现盘不复现：JC-2 标 11，按同一正则逐项重算 = 8（14 项中 6 项已有「名+空+#」行：`:163` `agent-tools/`、`:165` `tools/`、`:166` `tools.mjs`、`:171` `extension/`、`:174` `repomap.mjs`、`:175` `specs.mjs`）；JC-3 标 9，重算 = 8（11 项中 3 项已有行：`:192` `distill.mjs`、`:194` `tui/`、`:198` `tui.mjs`）。实施后期望（0 uncovered）逐项成立（after 块含全部 14/11 项）。 | 更正这两处基线值（或标注为旧读数/口径），免复核按错基线误判检查器。 |
| 4 | Acceptance | 🔵 | JC-3 的 OLD 检串 18 条 < 幽灵 19 项——`thincoder-cli/README.md:177` 的 `tools.mjs` 幽灵行无对应 residue 检串（JC-2 侧 9 条 = 8 幽灵 + `specs.mjs` 旧描述，齐；JC-3 侧 18/19）。 | 把 `tools.mjs` 旧行片段补入 OLD 列，或注明该行由逐字 / 行数 461 / hunk 域检查兜住（JC-4③ 可捕获其残留）。 |

**计数**：🔴 0 · 🟡 2 · 🔵 2。
**VERDICT: pass**

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00 授权 + 13:02「修」明令 ✗ 三条件齐备）**：

- 依据 ① **评审 pass**：轮 1（评审 id=47）= 🔴 0 · 🟡 2 · 🔵 2（非阻断）——4 条逐条裁定见下；
- 依据 ② **落点核验**：设计 §2 三条 before→after 逐字（评审独立核验 + 父侧实读：89/206/479 行 ✗ 块域 ✗ JC 字面与 after 逐行对齐 ✓）；
- 依据 ③ **token 已签发**（✗ 凭证值不落档）；
- **裁定表（四条均父侧直接执行 · 打标 ✓ · 可 revert）**：①🟡 依据行 24↔23 差 → **Fixed**（`:57` + KD-① `:259` 收到「静态表 23 档 + 门控 `read_image.md` 1 档」）②🟡 ② 表行标注不一 → **Fixed**（`:82` 改「在盘 · 描述换写」✗ 与 `:175` 同口径）③🔵 uncovered 基线口径差 → **Fixed**（`:143`/`:229` 加口径注 ✗ 判据取「miss/residue 如列 ∧ 实施后 0 uncovered」，基线以实跑为准）④🔵 JC-3 OLD 缺 `tools.mjs` → **Fixed**（`:226` OLD 列补 `&apos;tools.mjs         re-export shim&apos;`）✓；
- **实施派发**：eng-coder #48（三档逐字 ✗ JC-1–JC-5 ✗ 恰三档 ✗ 随发布列车 ✓）。

## §5 实施记录（eng-coder）

（待批准后。）

**状态行**：✅ 实施完成（initial · 2026-09-21 · eng-coder）——三条产品文本面收正已落盘，JC-1–JC-5 全数通过。

**交付摘要**：after 文本 = §2 逐字承载（机械抽取围栏块 → 替换目标块，非手抄；抽取后逐行复校）。

| 档 | 改动 file:line | before → after | 终态行数 |
|---|---|---|---|
| `thincoder-core/README.md` | `:65` 单行换字 | `one file per built-in tool` → `one file per static built-in tool`（行宽 110 字符） | 89（±0） |
| `thincoder-vscode/README.md` | `:162-178` → `:162-176` | 17 行 → 15 行（8 幽灵删 + 8 漏列补 + 6 行描述换写：`agent-tools/` `tools/` `tools.mjs` `extension/` `repomap.mjs` `specs.mjs`） | 204（−2） |
| `thincoder-cli/README.md` | `:169-205` → `:169-187` | 37 行 → 19 行（19 幽灵删 + 9 漏列补（含 `bin/thincoder.cjs`）+ 命令集补全 + `scripts/` 描述更新） | 461（−18） |

**JC 实跑读数（before 红 / after 绿 · 命令 = §2 判据原文 · 仓根运行）**

| JC | before（开工前实跑） | after（落盘后实跑） |
|---|---|---|
| JC-1 | `FAIL new=false old=true`（exit 1） | `OK(core README: static wording in / old wording gone)`（exit 0） |
| JC-2 | `FAIL miss=14 residue=9 uncovered=8`（exit 1） | `OK(vsc tree: 14 rows in / 0 ghost residue / src covered)`（exit 0） |
| JC-3 | `FAIL miss=14 residue=19 uncovered=8`（exit 1） | `OK(cli tree: 14 rows in / 0 ghost residue / src covered)`（exit 0） |
| JC-4 | —（脚本实施轮机械生成：`.thincoder/tmp/jc-readme-text-fixes.mjs`） | `OK(JC-4: all 4 assertions pass)`（exit 0 · 16 项逐条 ok） |
| JC-5 | `.thincoder/tmp/readme-before.txt` = `?? docs/batches/2026-09-21-readme-text-fixes.md` | `.thincoder/tmp/readme-after.txt` 差集 = 恰三 README（added 3 · removed 0 · allowlist 外 0） |

口径注（覆盖 §3 行 3 / §4 修复③ 的遗留）：JC-2/JC-3 before 实跑 `uncovered=8`（= 口径注重算值；设计轮所记 11/9 为旧口径，判据取「miss/residue 如列 ∧ 实施后 0 uncovered」）；JC-3 OLD 列经 §4 修复④ 补入 `tools.mjs` 检串后，before 实跑 `residue=19`（19 幽灵全数命中），§2 `:229` 基线行仍标 18 —— 以本节实跑读数为准（不自行改设计段 · 一段一作者）。

**JC-4 逐项**：① 核 89 行 ∧ `:65` 逐字 ∧ 对 `git show HEAD:` **仅第 65 行不同** ∧ 字节面；② VSC 204 行 ∧ `:162-176` 逐字 ∧ hunk `@@ -163,16 +163,14 @@` ⊆ `:162-178` ∧ 域外逐行同 HEAD；③ CLI 461 行 ∧ `:169-187` 逐字 ∧ hunk `@@ -169 +169,2 @@` / `@@ -171,33 +172,13 @@` / `@@ -205 +186,2 @@` ⊆ `:169-205` ∧ 域外逐行同 HEAD；④ 三档字节面读数 `utf8=true cr=false bom=false trailingNL=true`。

**回归验证**：`cd thincoder-cli && node --test test/home-expansion.test.mjs` = **15/15 pass**（全仓唯一读被改档的测试 · T-H15 读 CLI README 的 `dbPath` 示例，位于改动域外）。

**决策透明表**

| # | 决策 | 依据 / 代价 |
|---|---|---|
| 1 | ②③ 的 after 块用机械抽取（读 §2 围栏 → 替换目标块），非手抄 | 父侧任务书明令；块内注释列对齐空格手抄易失真。复校：before 块与现文逐字节等 ✓、after 与终态逐字等 ✓ |
| 2 | 抽取器 / 生成器 / 检查器落 `.thincoder/tmp/`（gitignored · 不入改动面） | §2 JC-4 指定路径；JC-4 字面量亦由生成器机械抄入（非手抄） |
| 3 | 只跑 JC 家族 + T-H15，不跑三包全量套件 | 三档在全部机检域外（`PROJECT-MANIFEST.json:20-33` `scanDirs=["docs"]`）；全仓 grep 实证除 T-H15 外无代码 / 测试读这三档 |

**内部审计 / 评审轮次与终态**

- 内部偏离审计（explore · 只读 · 轮 1）：**divergence: none**（四类偏差均未发现）；披露边界 = 审计席位无执行面，git 族断言未复跑（由本节点 JC-4/JC-5 实跑读数覆盖）。
- 内部代码评审（advisor · type=code · 轮 1）：**VERDICT: pass** · 🔴 0 / must-fix 🟡 0 / 🔵 3——(a) §2 `:229` JC-3 基线 residue 标称 18 vs 现 OLD 19（文档卫生 · 其建议落点 = 本节实跑读数 ✓）(b) 核 `:65`「static」未涵门控档 `read_image.md`（KD-① 已裁 · 信息备案 · 零动作）(c) §5/§6 占位待收口（本节即 §5 落笔）。评审调用尾部 host 引用核验告警 2 条 = 评审推理旁白片段（VSC `:205` 幽灵空行 / 核 `:65` 转义引号），复验非交付缺陷（`:205` 实读为空段 ✓、`:65` 内容逐字在盘 ✓）。
- fix round：**0 轮**（3 条 🔵 均非 must-fix；(a) 的处置即本节口径注）。
- 终态：**clean**。

**边界声明**：改动面 = 恰三 README + 本批档（JC-5 快照差集实证）；`src/**` / prompts / tool-docs / 需求 / 设计档 / 台账 / 版本号 / CHANGELOG / `package.json` 零触；发布动作 = 用户门 · 未触 ✓。

**收工补记（JC-5 终态）**：收工时点 `git status --porcelain` 读数 = ` M thincoder-cli/README.md` / ` M thincoder-core/README.md` / ` M thincoder-vscode/README.md` / `?? docs/batches/2026-09-21-readme-text-fixes.md` / `?? docs/batches/2026-09-21-vsc-no-folder-guard.md` —— 第 5 项 = **他批在飞档**（并行批次 `vsc-no-folder-guard` · 承台账 #199 · 用户 13:31/13:34 出题裁定；本批开工快照 `readme-before.txt` 与收工快照 `readme-after.txt` **均无此项** ⇒ 由其自批在窗口内生成，本批零触）。本批自身 delta = 恰三 README（+ 本档 §5 内容），判据「快照差集 ⊆ 四档」对本批成立 ✓；他批档归其自批处置（§2 JC-5 注「多批并行下他批在飞档由快照差集分辨」之实况）。

## §6 验证与收口（主代理）

**实施轮**：eng-coder #48（initial ✗ 偏离审计 divergence:none ✗ 代码评审 pass ✗ fix round 0）✗ 交付 = §5 ✗ 改动面 = 恰三 README + 本批档 ✓。

**验收（父侧独立复跑 · 计数原文）**：

| # | 判据 | 命令 | 读数（父侧复跑） | 结论 |
|---|---|---|---|---|
| ① | 核 README 换字 | 逐字比对 + JC-1 | `:65` 与 after 逐字 = **true** ✗ `static` 在场 / 旧串零命中 ✓ 89 行 ±0 ✓ | ✓ |
| ② | VSC 结构树 | 逐字比对 + hunk 域 | `:162-176`（15 行）与 after 逐字 = **true** ✗ 204 行（−2）✗ hunk `163..178 ⊆ [162,178]` ✓ | ✓ |
| ③ | CLI Architecture | 同上 | `:169-187`（19 行）与 after 逐字 = **true** ✗ 461 行（−18）✗ 3 hunk 全 ⊆ `[169,205]` ✓ | ✓ |
| ④ | 字节面 | 读盘 | 三档 `tailNL=true` ✗ `BOM=false` ✗ `CR=false` ✓ 最长行 161 / 284 / 1167（末项 = 预存在 ✗ #198）✓ | ✓ |
| ⑤ | 回归 | `node --test test/home-expansion.test.mjs` | **15/15 pass · fail 0**（全仓唯一读被改档的测试 ✗ 域外）✓ | ✓ |
| ⑥ | 变动面 | `git status --porcelain` + JC-5 | 本批 delta = 恰三 README + 本批档 ✓（快照差集 allowlist 外 = 0 ✓）| ✓ |
| JC-1/2/3 | 判据原文 | §2 命令原跑 | before 红（`FAIL`）→ after 绿（`OK`）✗ uncovered 实跑 8（= §4 修复③ 口径注之重算值 ✓）✗ JC-3 residue 19/19（含 §4 修复④ 补入的 `tools.mjs` ✓）| ✓ |
| JC-4 | 脚本形四断言 | `.thincoder/tmp/jc-readme-text-fixes.mjs` | 16 项逐条 ok ✗ 行数 89/204/461 ✗ 三块逐字 = 设计 after（机械抽取 ✗ 非手抄 ✓）✓ | ✓ |

**父侧直接执行（§4 已载 ✗ 打标 ✓ · 可 revert）**：4 处设计面小改（`:57`/`:259` 依据行 ✗ `:82` 表行口径 ✗ `:143`/`:229` uncovered 口径注 ✗ `:226` OLD 列补 `tools.mjs`）——均在评审 pass 后落 ✓ 与评审建议逐条对应 ✓。

**结算同步清单（D7）**：① 六段齐名归其位 ✓；② 状态行 →「**已收口 2026-09-21**」✓；③ 计数 / 枚举一致（三档 89/204/461 ✗ after 块 1/15/19 ✗ JC-1–5 五条）✓；④ 指针解析（§2 ①②③/④/⑤/⑥ ✗ §3 轮 1 ✗ §4 代签 ✗ §5 ✗ §6 本段）✓；⑤ 设计档零改（本批载体 = 本档 §2 ✓ 提示词 / 其他档零触 ✓）；⑥ 待办：**#194 → 已核销**（核 README ✓）✗ **#182 → 已核销**（CLI README ✓）✗ **#192 → 已核销**（F5 = VSC README 结构树 ✓ 已修）✗ 残项（F2/F3/F4/F6/F7 ✗ F-D/F-E）**另册 #200** ✓；⑦ 前批遗留交叉核：无 ✓。

**发布关联**：三档随发布列车（核 `0.9.2` ✗ CLI `0.12.64` ✗ VSC `0.9.4`）✗ **发布动作 = 用户门 ✗ 挂起中** ✓。

**冻结核**：本 §6 落 ⇒ 整档冻结（不再回改 ✗ 例外 = 提交哈希回填 errata 一笔 ✓）。

**提交 errata（本 §6 声明的例外笔）**：本批提交 = `95e07181`（`docs: readme text corrections — core static-tool wording, vsc/cli structure trees to current form` ✗ 4 路径：三 README + 本档 ✗ 已 push origin main ✓）。
