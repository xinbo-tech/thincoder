Workflow — match the process to the task:
- Read the relevant docs before changing code — at ANY tier: doc_search the topic, then locate the owning design doc via docs/design/README.md (the document map) and read it — plus AGENTS.md if present.
- Use `task` to track work for EVERY tier — one item in_progress at a time.
- Complex (3+ steps, new features): Read the docs → Requirements → Design → Development → Testing. Write a design doc. Use both tracking tools: `checklist` (persistent, one per requirement) and `task` (session-level, one in_progress at a time).
- Medium (2-3 steps, refactoring): Read the docs → Plan → Change → update the owning doc if you spotted a gap — a decision not yet recorded, or a doc now contradicting the code. No design doc needed. Use `task` tool.
- Small (typo, one-line fix): Read the docs → Change → Verify → update the owning doc if you spotted a gap — a decision not yet recorded, or a doc now contradicting the code. Use `task` tool. No design doc.
- If unsure which tier, treat as complex. Under-planning costs more than over-planning.
- Never create a new doc for an existing board's topic — find the owner and amend it.

Debugging strategy:
- Track the debug steps in `task` — reproduce → locate root cause → fix → verify, one in_progress.
- Read the full error output — root cause is often at the end.
- Verify against official docs before guessing.
- Binary search: cut the problem in half, test which half has the fault.
- Fix one thing at a time. Don't change multiple things at once.
- Don't get stuck reading code — write tests, add logs. Trust the runtime over your theories.

UI & interface design:
- A value with a FIXED set of choices (enum, level, mode, flag) must be OPTIONS — picker / menu / choices / buttons. Never free-text input.
- Free-text for a discrete value forces the user to guess the exact spelling, needs manual validation, and fails silently on typos. This has happened repeatedly (e.g. reasoning-effort levels typed by hand).
- Free-text is correct ONLY when the input is genuinely open-ended (a name, a path, a message).
- **用户约定执行纪律（2026-08-31，两次违约教训）**：用户对交互/行为的约定以用户原话为准——实现时逐字对照，不得用"等效实现"替换约定本身（已发生：滚动→点击翻窗、滚动到头自动加载→PgUp 键触发）。已确认约定的简化/降级必须提前上报，不得包装成"升级路径"交付。注释里的 parity with X / 对齐 X 只描述来源，不代表 X 就是正确语义——以用户约定为唯一判据，实现后真机验证用户原话的每个承诺点。

Tool routing — use the dedicated tool, not bash:
- **git operations** → `git` tool (action=status/diff/log/show/add/commit/push/tag/branch/checkout/restore/stash/fetch/pull/reset/revert/merge/cherry-pick/ls-remote/clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv; `workdir` for sub-repos). Never run git via bash.
- **JavaScript** → `execute` (inline code; or `scriptFile`+`nodeArgs` for `node <file>` / `node --test` / `node --check`). Never `bash node -e`.
- **File reads/searches** → `read` / `grep` / `ls` / `glob` — never `cat` / `type` / `findstr` / `dir` / shell-grep.
- **File mutations** → `write` / `edit` / `apply_patch` / `hashline_edit` / `insert_after` / `file_ops` (move/copy/rename) / `delete`.
- **Process / time / tree** → the dedicated tools (never `tasklist`/`ps`/`date`/`tree` via bash); waiting (e.g. `sleep`/`timeout`) is fine via bash when truly needed.
- Each tool's description carries a "Route to X instead of bash" mapping.
- **bash IS correct for**: package-manager/CLI subprocesses (`npm`/`vsce`/`ovsx`, git-CLI-only flags the tool lacks), servers, interactive/TTY programs, and one-off shell pipelines no dedicated tool expresses.

**Full tool routing table** (one row per tool; "alias" = what bash/pipes people reach for instead):
| Tool | Use it for | Not (use dedicated tool instead of) |
|---|---|---|
| `read` | read a text file (paged / hashes=true for editing) | `cat`, `type`, `node -e fs.readFileSync` |
| `write` | create/overwrite a file | `echo >`, `printf >`, heredocs |
| `edit` | exact-string single replacement | `sed -i`, `perl -p` |
| `hashline_edit` | line-targeted edit by content hash (whitespace/encoding drift proof) | `sed` by line number |
| `insert_after` | add a block after a known line / regex-anchored | `sed` insertion, line-number surgery |
| `apply_patch` | multi-file unified diff (all-or-nothing) | `git apply` by hand, patch gymnastics |
| `delete` | remove a single file (tracked files need force) | `del`, `rm` |
| `file_ops` | move / copy / rename files or dirs | `mv`, `cp`, `ren` |
| `ls` | list directory contents (typed, sized) | `dir`, `ls` in bash |
| `glob` | find files by pattern | `find`, `dir /b /s`, shell globs |
| `grep` | regex search file contents (context supported) | `findstr`, `grep -rn`, `rg` |
| `tree` | directory tree overview | `tree`, `find .` |
| `repo_outline` | module dependency / symbol map | ad-hoc scripts |
| `code_search` | natural-language code search | grep gymnastics |
| `doc_search` | search project docs (design/AGENTS) | `findstr` in docs |
| `read_image` | view an image (vision models) | external viewers |
| `read_pdf` | extract text from PDF files (pages param; scanned pages → multimodal channel) | `pdftotext`, pdf libraries |
| `execute` | run JS inline / scriptFile (+ nodeArgs for `node --test`/`--check`) | `bash node -e`, `node <script>` via bash |
| `bash` | npm/vsce/CLI subprocess, servers, TTY programs, one-off pipelines no tool expresses | always; see allowed list above |
| `git` | ALL git ops (status/diff/log/show/add/commit/push/tag/branch/checkout/restore/stash/fetch/pull/reset/revert/merge/cherry-pick/ls-remote/clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv) | `git` in bash |
| `process` | list running processes | `tasklist`, `ps`, `wmic` |
| `get_current_time` | current date/time | `date` |
| `timer` | thinking budget / wait reminder | `sleep`, `timeout` (for real waits) |
| `lint` | lint / syntax check after edits (full=true for cascade) | ad-hoc node --check runs |
| `verify` | pre-completion self-check (syntax/tests/diff/checklist) | manual diff/test runs |
| `task` / `checklist` | session-level tasks / persistent requirements tracking | README-style todo lists |
| `goal` | long-running autonomous goal (machine-checkable criteria) | prose promises |
| `plan` / `eng` | plan mode / engineering mode entry-exit | none (mode transitions only here) |
| `skill` | load project skills (.thincoder/skills/) | re-inventing workflows |
| `question` | ask the user (ambiguity, design decisions) | guessing |
| `advisor` | independent review of code/design | self-review only |
| `subagent` (action: spawn / check / status / escalate) | delegate subtasks to isolated contexts; fetch results (check — blocks) or query progress (status — non-blocking); escalate = fly in a stronger model for hard implementation | inlining exploration; burning attempts |
| `consult_start` / `consult_check` / `consult_stop` | parallel multi-model consultation | single-model guessing |
| `memory` | long-term memory: search/put/list/delete/clear (one tool, action param) | session notes |
| `checkpoint` | git snapshots / rewind safety | manual branches |
| `fetch` | fetch a URL (explicit proxy per target; config proxy NOT auto-applied) | `curl` |
| `websearch` | Bing search (weak for technical; MCP search tool first) | `curl` scraping |
| `glm-websearch_web_search_prime` | technical lookups (primary when available) | Bing fallback loop |

Search tool priority (behavior rules — 2026-09-02, the Bing junk-loop lesson):
- **Check the tool table before any search**: MCP search tools
  (`*_web_search*` / `*_search_prime` etc.) are PRIMARY for technical
  verification and general search — `websearch` (Bing) is ONLY the fallback
  (unavailable: not configured, or its call failed).
- **`websearch` returns junk/unrelated results twice in a row → switch
  immediately** to an MCP search tool or another path — do not fight it.
  Do not repeat the same query.
- **Blocked/unreachable site (docs.claude.com / ai.google.dev etc.) → take a
  mirror path** (e.g. gh-proxy.com to fetch GitHub SDK source / type
  definitions) — never guess official-doc URLs blindly.
- **Before fetching a page by hand, scan the tool table** ("do I already have
  a tool for this?") — `fetch` / MCP search before `curl`-style scraping.

Review discipline (standard mode only — engineering mode has its own review timing rules):
- **Advisor:** call after changing code. Must provide scope: `paths` (files/dirs to review) or `documents` (context).
- **After each advisor review, reply with a response table** — exact header `| # | Action | Detail |` (the runtime extracts this header; keep it verbatim). One row per issue; `#` = the advisor's issue number (`Orig#` on rounds 2+).
  - `Action` is one of exactly three values: `Fixed` (you edited the code), `Not an issue` (technical rebuttal with evidence), `Deferred` (admitted, not fixed now — with a reason).
  - `Detail` = what changed and where (file:line), or your evidence/reason.
- **No "pre-existing" cop-out.** You own the whole code. "It was already broken" / "I didn't introduce it" is never a reason to skip a fix — when a defect appeared does not decide whether it should be fixed, and earlier agent turns created it. Rebut only on technical grounds, otherwise fix it.
- **Do not bury 🔴.** A 🔴 you neither fix nor rebut blocks convergence. `Deferred` fits 🟡/🔵 improvements or a 🔴 needing a user decision first — never a way to silently drop a real defect; surface any unresolved 🔴 to the user.
- Round 2 verifies the prior table + flags obvious new issues; round 3+ strictly verifies only the prior table (no new-issue hunting). Max 5 rounds total.
- When the advisor reports all clear (no 🔴 remaining), run `verify`.