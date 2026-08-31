Run a git command. Only works inside a git repository.

**Route to git instead of bash:** `git status`→status, `git log`→log, `git diff`→diff, `git show`→show, `git add`→add, `git rm`→rm, `git commit -m`→commit, `git push <remote> <branch> <tag>`→push, `git tag`→tag, `git branch`→branch, `git checkout`→checkout, `git restore`→restore, `git stash`→stash, `git fetch/pull`→fetch/pull, `git reset`→reset, `git revert`→revert, `git merge`→merge, `git cherry-pick`→cherry-pick, `git ls-remote`→ls-remote, `git clone`→clone, `git init`→init, `git rebase`→rebase, `git remote`→remote, `git clean`→clean, `git switch`→switch, `git apply`→apply, `git worktree`→worktree, `git archive`→archive, `git blame`→blame, `git mv`→mv.

- action='diff': unified diff — what changed since last commit. staged=true for staged-only; ref=<ref> to compare a commit/branch; path=<dir> to scope.
- action='status': working tree state — staged / unstaged / untracked / conflicts, categorized.
- action='log': recent commits. count (default 10), oneline=true compact, path=<file> for one file's history.
- action='show': a commit's details (--stat). ref=<ref> (default HEAD).
- action='add': stage files — path=<file> (granular) or all changes when path omitted.
- action='commit': stage + commit. message required; path=<file> for granular staging.
- action='rm': untrack a file/dir (git rm --cached, kept on disk). path required.
- action='push'/'fetch'/'pull': sync with remote. remote=<origin>, ref=<branch or tag> (space-separated for multiple), tags=true for --tags.
- action='tag': manage tags. tagAction=list (optional filter) / create (name, optional ref) / delete (name; snapshots first).
- action='branch': manage branches. branchAction=list / create (name, optional ref) / switch (name) / delete (name; snapshots first).
- action='checkout': switch to ref=<branch/commit>, or restore a file path=<file> (discards its working-tree changes; snapshots first).
- action='restore': restore a file from index/HEAD. path required; staged=true restores the staged copy; snapshots first.
- action='stash': manage the stash. stashAction=list / push (message) / pop (snapshots first).
- action='reset': reset to ref (default HEAD). mode=soft/mixed/hard; hard snapshots the tree first (drops working-tree changes).
- action='revert': revert a commit (safe). ref=<commit> (default HEAD).
- action='merge': merge ref=<branch/commit>; conflicts reported for you to resolve.
- action='cherry-pick': cherry-pick ref=<commit>.
- action='ls-remote': light remote-ref check — which refs a remote has (read-only, network). remote=<origin>, ref=<branch/tag> optional, config for proxy.
- action='clone': clone a repo. remote required (URL or local path); path optional (target dir).
- action='init': init a repo in the current (work)dir.
- action='rebase': rebase onto ref. rebaseAction=start (ref required) / abort / continue（操作前自动快照，checkpointAction=rewind 恢复）.
- action='remote': manage remotes. remoteAction=list / add / remove / set-url; remoteUrl for add/set-url.
- action='clean': remove untracked files/dirs. dryRun for -n preview（真删除操作前自动快照，checkpointAction=rewind 恢复）.
- action='switch': switch branch. name required; create for -c (new branch).
- action='apply': apply a patch. path required (patch file).
- action='worktree': manage worktrees. worktreeAction=list / add (path, ref) / remove (path).
- action='archive': write a tar of ref (default HEAD). path required (output file).
- action='blame': file blame. path required.
- action='mv': rename/move. path (source) + dest required.
- action='checkpoint': git snapshots. checkpointAction=list/create/rewind/cat/versions; checkpointId required for rewind/cat.
- Destructive ops (checkout -- path / restore / reset --hard / stash pop / branch|tag delete / clean / rebase) auto-snapshot first — restore via checkpointAction=rewind.

Parameters:
- action (required): diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote / clone / init / rebase / remote / clean / switch / apply / worktree / archive / blame / mv
- workdir: run git in this workspace subdirectory (monorepo / multi-repo). Confined to the workspace. Default: cwd
- config: (network actions push/fetch/pull/ls-remote/clone) git -c overrides, e.g. ["http.proxy=http://10.2.2.112:3128"] for blocked remotes
- path: (diff/log/add/commit/checkout/restore/rm/apply/archive/blame/mv/worktree) file or directory to scope / stage / restore
- ref: (show/diff/checkout/reset/revert/merge/cherry-pick/tag:create/branch:create/rebase/worktree:add/archive) commit/branch/ref; (push/pull/fetch) the branch or tag (space-separated for multiple)
- name: (branch/tag/switch) the branch or tag name
- remote: (push/fetch/pull/remote/clone) remote name (e.g. origin) or URL; default: current upstream
- tags: (push) also push all tags (--tags)
- staged: (diff) staged changes; (restore) the staged copy
- count: (log) number of commits (default 10)
- oneline: (log) one-line-per-commit
- message: (commit) commit message — required; (stash:push) stash message
- mode: (reset) soft / mixed / hard — hard snapshots the tree first + needs confirmation
- tagAction: (tag) list / create / delete — branchAction: (branch) list / create / delete / switch — stashAction: (stash) push / pop / list
- filter: (read-only actions) keep only output lines matching this regex (case-insensitive)
- checkpointAction: (checkpoint) list / create / rewind / cat / versions — checkpointId: snapshot id (rewind/cat)
- remoteAction: (remote) list / add / remove / set-url — remoteUrl: (remote add/set-url) URL — rebaseAction: (rebase) start / abort / continue — dryRun: (clean) -n preview — create: (switch) -c — dest: (mv) destination — worktreeAction: (worktree) list / add / remove
