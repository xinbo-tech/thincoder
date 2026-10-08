Read, initialize, or point-edit the project manifest (PROJECT-MANIFEST.json) — the project-level state file (phase / docRoot / checkConfig / codePaths / index / advisor). Attached to the main agent only; subagents can neither see nor write it.

Actions:
- read [target] — report the manifest state with a stable anchor `state=ok|missing|invalid|ambiguous|no-project`. The ok state prints the manifest JSON plus missingKeys / unknownKeys / errors rows (only when non-empty). Never throws — a missing manifest is reported, not refused.
- init [target] — create the default manifest where the project root resolves (the target itself when no project is discoverable). Refused when a manifest already exists — init never overwrites.
- write <key> <value> [target] — point-edit one node: read the current manifest, set the node, write it back through the writer gate. The resulting manifest must pass validation (a fault is refused with the disk byte-for-byte unchanged); a missing manifest is refused — run init first (write never creates one).

target — explicit target directory; defaults to the session anchor, relative paths resolve against it. An ambiguous target (2+ candidate projects) is refused with the full candidate list — the mechanism never picks one.

key — dot path into the manifest, one of the writable nodes: version / phase / promptsLanding / codePaths, or a sub-key of docRoot / checkConfig / index / advisor (e.g. docRoot.design / index.publicRepos / advisor.docMap). Whole-object writes of those four families are refused, as is any key outside the set (spelling protection).

value — parsed as JSON first (null / true / 5 / ["a","b"]), falling back to a literal string (docs/design). The string "null" is the explicit "no such face" for docRoot.<key>: a legal value, not a deletion.

Refusals throw `manifest <action>: refused — …` and leave the disk unchanged. The written file is picked up by the session's project-state line on the next turn (mtime-gated) — the tool never touches in-memory state.

read is read-only (planMode passes, no approval); init / write are side effects (approval gate). Writes go through writeManifest / initManifest with writer "main" — the fail-closed subagent default is never used.
