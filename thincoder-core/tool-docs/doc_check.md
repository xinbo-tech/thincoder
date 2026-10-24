Run a built-in documentation-discipline check on a project and report its findings.
Read-only. In the default `report` mode it is non-gating: it reports, it never blocks, never sets an exit code, and its output is never a reason to refuse a task or a user instruction.

What it checks — exactly two criteria, both built into the engine:
- Anchors — every documentation pointer (a `*.md` token, optionally carrying directory segments, optionally followed by a section
  indicator `§N` / `§N.M` / `§N.M.K`) must resolve: the file must exist on disk (`档缺` when it does not), and when a section
  indicator is given the target file must carry a heading numbered with it (`节缺` when it does not). Line-number coordinates
  (`<doc>:12`) are not section references and are not judged as such. Files inside fenced code blocks and executable lines
  (command / pattern code spans) are skipped whole.

~~~text
  **Operand names.** Six names count as operands rather than documents: the model writes them, or reads a file by that name. On
  the prompt face (`thincoder-core/prompts/**`) they are stripped from a line before extraction. On other faces four of the six are
  exempt as file-name classes — `AGENTS.md`, `SKILL.md`, `.thincoder/advisor.md`, `project_rules.md` — while `README.md` and
  `MANIFEST.md` are still judged as pointers. The six:

  ```text
  AGENTS.md  SKILL.md  README.md  MANIFEST.md  .thincoder/advisor.md  project_rules.md
  ```
~~~

- Paragraph length — on a document face, adjacent non-blank body lines merge into one paragraph whose total character
  count (CJK counts as 1) is judged against the built-in threshold; blank lines, table rows, headings, list items,
  quote-block lines and fenced code blocks do not count into a paragraph and break it, and lines inside an exempt zone
  are excluded. Breaking a paragraph into more lines changes nothing — only splitting it into more paragraphs or
  writing it shorter passes.
- Line length — a prompt-face file (`thincoder-core/prompts/**`) is judged line by line: the model reads raw text, so
  one line is one block, and any single line over the threshold counts with no structural exemption.

It cannot — in `report` mode — write anything, gate anything, or turn a finding into a refusal.

Arguments — `target` (optional): the project root to check; defaults to the session anchor, relative paths resolve against it.
A workspace target (several projects below it) is reported with the full candidate list — pass the project root you mean.
`mode` (optional) — `report` (default: a non-gating report over the documents you list) or `gate` (the delivery gate below).
`docs` (required) — the documents to judge, as paths relative to the project root or absolute; each is judged whole and nothing
else is read except the targets those documents point at. Omitted in `gate` mode ⇒ the Markdown documents this session wrote.
There is no default range in `report` mode: omitting `docs`, or passing an empty list, is refused rather than widened — nothing
is scanned unless you name it. A path that is not on disk or is not a Markdown document is an error in `report` mode and nothing
is judged; in `gate` mode such paths are listed as skipped instead. A pointer resolves against the project root (full path) or
against the pointing document's own directory — bare names are not resolved across other directories.

Delivery gate — `mode: "gate"`, for the end of a design or development round. Every listed doc is judged **whole**: a
pre-existing dangling pointer or overlong paragraph / line anywhere in it counts, not only this round's edited lines. The first line is the
machine-readable verdict — `DOC-CHECK GATE: PASS` / `DOC-CHECK GATE: REFUSED（命中 K 条）` / `DOC-CHECK GATE: ERROR（reason）` —
and consumers judge by that prefix; the hits are fixed in the same round and are never booked to the ledger. The gate refuses
**one delivery**, not a user instruction: an explicit user go-ahead is followed, with the hits written into the delivery.
`ERROR` is fail-closed (no PASS means not passed): a multi-project workspace ⇒ name the project root, per the stated cause.

Do not wire it as a gate or CI step in `report` mode, and do not treat a finding as a reason to refuse an instruction — a
machine check never outranks a user instruction.

Routing — use it when you write or revise a project's documents and want the discipline checked in one pass. It is not
a reader: use `doc_search` / `read` to read documents and `grep` to search them; this tool only reports discipline findings.

Side effects and permissions — none. The tool is read-only: no writes, no approval prompt, safe to run in parallel with other calls.

Parameters and scope — both criteria run on built-in constants (`DOC_CHECK_BUILTINS`: threshold 300 characters, no exempt zones,
no exemptions), and the judged set is the document list the caller passes — the judged set and the resolution set are the same
documents, so there is no scan-dir / domain / root / exclude surface and no whole-repository scan. Changing a criterion or a
threshold is a code change and goes through review; no project declaration changes these readings.

Consistency — the checks and this description are one core implementation: every end that loads the core tool registry gets the
same semantics.
