Read, initialize, or point-edit the project manifest (PROJECT-MANIFEST.json) — the project-level state file (version / phase / docRoot / codePaths / index). Attached to the main agent; subagents carry a read-only variant (action `read`) — init / write stay main-agent only.

Actions:
- read [target] — report the manifest state with a stable anchor `state=ok|missing|invalid|workspace|no-project`. The ok state prints the manifest JSON plus missingKeys / unknownKeys / errors rows (only when non-empty). Never throws — a missing manifest is reported, not refused.
- init [target] — create the default manifest where the project root resolves (the target itself when no project is discoverable). Refused when a manifest already exists — init never overwrites.
- write <key> <value> [target] — point-edit one node: read the current manifest, set the node, write it back through the writer gate.
  The resulting manifest must pass validation (a fault is refused with the disk byte-for-byte unchanged); a missing manifest is
  refused — run init first (write never creates one).

target — explicit target directory; defaults to the session anchor, relative paths resolve against it.

A workspace target
(several projects below it) is reported by `read` and refused by `init` / `write` — with the facts, the full candidate list and
a next step: name the project root you mean and pass it as target.

key — dot path into the manifest, one of the writable nodes: version / phase / codePaths, or a sub-key of docRoot / index (e.g. docRoot.design / index.publicRepos). Whole-object writes of those two families are refused, as is any key outside the set (spelling protection).

value — parsed as JSON first (null / true / 5 / ["a","b"]), falling back to a literal string (docs/design). The string "null" is the explicit "no such face" for docRoot.<key>: a legal value, not a deletion.

Refusals throw `manifest <action>: refused — …` and leave the disk unchanged. The written file is picked up by the session's project-state line on the next turn (mtime-gated) — the tool never touches in-memory state.

read is read-only (planMode passes, no approval); init / write are side effects (approval gate). Writes go through writeManifest / initManifest with writer "main" — the fail-closed subagent default is never used.

Key catalog — the 13 writable nodes (3 whole keys + docRoot's 6 sub-keys + index's 4 sub-keys): what each is; when to change it; wrong ⇒ consequence.
- `version` — schema version (a number); change on file migration; wrong ⇒ validation refuses (disk unchanged).
- `phase` — project stage, `initial-dev` / `production`; change when the stage is crossed; wrong ⇒ validation refuses.
- `codePaths` — path segment names (replaces the default `["src"]`); change when the layout moves; wrong ⇒ no segment is classified (the fallback still runs).
- `docRoot.requirements` · `docRoot.specs` · `docRoot.design` · `docRoot.modules` · `docRoot.batches` — each doc-layer root path (a string | a multi-root array | `null` = absent); change when a layer moves root; wrong ⇒ validation refuses, or checks / batch landing / review roots point elsewhere.
- `docRoot.standards` — the project's standards document, by FILE path (a string | a multi-file array | `null` = undeclared); the reviewer judges methodology compliance against it; change when that document moves; wrong ⇒ the review says the declaration is unreadable and names the path (never a guessed default — there is none).
- `index.codeExtensions` · `index.docExtensions` — extra code / doc extensions (unioned, add-only); change when a file type is missing from the index; wrong ⇒ that type stays out of the index (extras harmless; a missing entry = a miss).
- `index.excludePaths` — project-root-relative path prefixes (for the index); change to keep a directory out of the index; wrong ⇒ that directory is still indexed, or another is wrongly excluded.
- `index.publicRepos` — public-repo paths (resolvable from this repo root); change when wiring a public repo into the index or cross-repo refs; wrong ⇒ that repo is unreachable for retrieval (empty origin set / wrong path).

- **`ledger`** — the in-flight ledger row this call serves: `"#N"` or `"N"`. In engineering mode the parent agent must pass it for `write`; for `init`, only when the target sits inside an existing project (a `PROJECT-MANIFEST.json` exists on its ancestor chain) — a bootstrap outside any project needs none; omitted when required = refused. `read` does not need it.

**`project`** — the project this call belongs to (absolute path of the project root). Read only when `target` is absent — `target` wins when present. Pure declaration: it does not change the target directory (`target` does).
