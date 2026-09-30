Run a git command. Only works inside a git repository.

**Route to git instead of bash** — every sub-command maps to the same-named action: status / log / diff / show / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote / clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv.

- diff: unified diff since last commit (`staged` — staged only; `ref` — compare a commit/branch; `path` — scope).
- status: working tree state — staged / unstaged / untracked / conflicts.
- log: recent commits (`count`, `oneline`, `path` — one file's history).
- show: one commit with --stat (`ref`, default HEAD).
- add: stage files — `path` (granular) or all changes.
- rm: untrack a file/dir (`git rm --cached` — kept on disk; `path` required).
- commit: `message` required. With `path` → `git commit --only <paths>`: commits those files' working-tree content only, atomic — other staged batches are NOT mixed in; without → add -A + full commit. New (untracked) files: `git add` them first (staging extra is safe — `--only` commits only the listed files).
- push / fetch / pull: sync with remote — `remote`, `ref` (space-separated for multiple); `tags` for --tags.
- tag / branch: manage via `tagAction` / `branchAction` — list / create (name, optional ref) / delete (snapshots first); branch also switch (name).
- checkout: switch to `ref`; with `path`, restore a file from the index (discards its working-tree changes — snapshots first).
- restore: restore a file from index/HEAD (`path` required; `staged` restores the staged copy — snapshots first).
- stash: `stashAction` push (message) / pop / list (pop snapshots first).
- reset: `ref` (default HEAD), `mode` soft / mixed / hard — hard drops working-tree changes (snapshots first).
- revert: revert a commit (safe, `ref` default HEAD); merge: `ref` — conflicts come back for you to resolve; cherry-pick: `ref`.
- rebase: `rebaseAction` start / abort / continue (snapshots first).
- ls-remote: light remote-ref check — read-only, network (`remote`, optional `ref`).
- clone: `remote` required (URL or local path), optional `path` (target dir); init: create a repo in the current workdir.
- remote: manage remotes — `remoteAction` list / add / remove / set-url (`remoteUrl` for add / set-url).
- clean: remove untracked files/dirs — `dryRun` previews (-n; the real clean snapshots first).
- switch: switch branch (`name` required; `create` = -c); apply: apply a patch (`path` required); archive: tar of a `ref` (`path` required, output file); blame: file blame (`path` required); mv: rename/move (`path` + `dest` required); worktree: `worktreeAction` list / add / remove.
- checkpoint: local snapshots — `checkpointAction` list / create / rewind / cat / versions (`checkpointId` for rewind / cat).
- Destructive ops (checkout -- path / restore / reset --hard / stash pop / branch|tag delete / clean / rebase) auto-snapshot first; restore a snapshot via `checkpointAction=rewind`.
- Failures come back as errors — `git <action> failed: <reason>` — nothing is silently swallowed.
- `filter` narrows any read-only action's output (case-insensitive regex); `config` (git -c overrides, e.g. a proxy) applies to the network actions (push / fetch / pull / ls-remote / clone). Other parameter defaults and applicability live in the schema.
