Batch-record lifecycle tool (一段一作者 — six append-only sections, one author each). actions: create (depth-0 only — write a new six-section skeleton record; pass path + topic + source, plus optional ledger / board that fill the record's 台账 header line at creation)

· append (add text to the END of YOUR section — existing lines are never rewritten or deleted)

· status (update YOUR section's `**状态行**：` line — the value must carry exactly ONE legal keyword of your section's STATUS_WORDS entry, decorated only by surrounding symbols / a trailing ISO date / whitespace; prose goes to the separate `note` field, which lands as a parenthetical).

Writing §1 已收口 closes the record and runs the closeout-chain gate: §2 / §3 / §4 / §6 must each carry content, or §1 declares it inapplicable with `> 不适用：§N —— <reason>` (§2 / §3 / §4 only; §5 is exempt; §6 never).

Reopening a frozen record = §1 → 进行中 with `note` = the reason: the tool rewrites the §1 status line and appends a 「重开记录」 line — no other existing line is touched.

· close (depth-0 only — freeze the record: §1 → 「已收口 <date>」, every further write is refused except the reopen conjunction; runs the same closeout-chain gate as status — an incomplete chain is refused, naming the missing sections).

Closing a record — the close action, or status writing §1 已收口 — also writes the ledger: this record's unsettled rows (task_book → this record, status 待讨论 / 待设计 / 在途, trigger ≠ 认账不排期 — a policy call leaves its row untouched, and a row already 条件 is skipped with zero writes) get trigger → 条件,

with the resume sentence 「原批 <record> 已收口，须另起批次接手」 landing in resume_when (a non-empty resume_when keeps its value — the sentence is appended to evidence instead);

each changed / skipped row is named in a `[ledger reanchor]` receipt block (a ledger write failure — busy store / no derivable project root — is named there too and never blocks the freeze).

Identity fixes what you may write (段白名单): main agent (depth 0) — create/close;

append/status domains are mode-dependent: engineering — append §1/§4/§6, status §1; normal — append §1/§2/§4/§5/§6, status §1/§2/§5 (the main agent holds the designer seat and records direct implementation);

eng-designer — §2; eng-coder — §5; a normal-mode coder bound via batchDoc — §5; design review (review binding) — §3.

A write outside your own section is refused.

Skeleton placeholders (dead literals — `#<编号>` / `<板块>` and the older `<BATCH-ID>` / `<讨论来源>`) in the record header's structural lines block append/status until filled:

create with ledger / board fills them at creation; if omitted, the main agent fills the header by file edit right after create (citing these literals in a section's prose is fine — only the header is checked);

`<§N 模板占位：…>` template lines are legal and never blocked.

Target record: sub-agents and design reviews have NO path parameter in practice — the record arrives via the spawn binding / the review instance key (passing path is refused); depth-0 MAY pass path (若传则须可读), omitting it picks the unique in-flight record (0 or ≥2 in flight ⇒ refuse — pass path).

A design review's append is stamped by the tool with a `### 轮次 N（评审子代理）` heading — N is tool-counted; do not write your own heading (it would be dropped).

Credential values are stripped mechanically before writing (never write a token or designId value).

Document-check gate: every append runs it before the write — any section (§1–§6), depth-0 and sub-agent and design review alike — and so does closing a record (or setting §1 to 已收口).

On append it judges three things: the text you are appending now, the markdown files already touched in this run, and the record itself — but only the first two can refuse the write.

A hit in the text you are appending or in a touched file ⇒ REFUSED: nothing lands, the record's bytes stay unchanged (do not close a record after a refused append).

A hit in a section that has already landed is named in the receipt with its section number and author and never blocks the write — another author's landed lines cannot be rewritten here; the close face is where it is enforced.

On close (and on status writing §1 已收口) every hit in the range refuses, each one named as `§N（作者：…）` when it sits inside the record.

An append receipt reads `[doc-check gate] DOC-CHECK GATE: PASS · 范围 N 档` — N = the documents actually judged, the record itself always one of them.

ERROR ⇒ a closeout is refused while an append still lands with an ERROR receipt line;

no PROJECT-MANIFEST.json ⇒ the gate does not run and the receipt says so.

Failures are hard and visible (no silent fallback): if a write is refused or fails, say so in your report — “§× 未写入”.