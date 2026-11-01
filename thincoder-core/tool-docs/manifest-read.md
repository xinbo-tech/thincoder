Read the project manifest (PROJECT-MANIFEST.json) — the project-level state file: version / phase / docRoot (the root of each document layer: requirements / specs / design / modules / batches, plus `standards` = the project's standards document, by file path) / codePaths / index.

Read-only: the only action is `read`. Creating or editing a manifest belongs to the main agent — this subagent variant has no init / write action.

read [target] — report the manifest state with a stable anchor `state=ok|missing|invalid|workspace|no-project`. The ok state prints the manifest JSON plus missingKeys / unknownKeys / errors rows (only when non-empty). Never throws — a missing manifest is reported, not refused.

Use it to locate documentation instead of assuming a path: read `docRoot.<key>` and resolve your target under that root. A missing face (`null`) means that document layer does not exist in this project — report it instead of inventing a path.

target — explicit target directory; defaults to the session anchor, relative paths resolve against it. A workspace target (several projects below it) is reported with the full candidate list — name the project root you mean and pass it as target.
