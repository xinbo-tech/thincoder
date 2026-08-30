Run a git command. Only works inside a git repository.

**Route to git instead of bash:** `git status`→status, `git log`→log, `git diff`→diff, `git show`→show, `git add`→add, `git rm`→rm, `git commit -m`→commit, `git push <remote> <branch> <tag>`→push, `git tag`→tag, `git branch`→branch, `git checkout`→checkout, `git restore`→restore, `git stash`→stash, `git fetch/pull`→fetch/pull, `git reset`→reset, `git revert`→revert, `git merge`→merge, `git cherry-pick`→cherry-pick, `git ls-remote`→ls-remote.

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
- action='checkpoint': git snapshots. checkpointAction=list/create/rewind/cat/versions; checkpointId required for rewind/cat.

Parameters:
- action (required): diff / status / log / show / checkpoint / add / rm / commit / push / tag / branch / checkout / restore / stash / fetch / pull / reset / revert / merge / cherry-pick / ls-remote
- workdir: run git in this workspace subdirectory (monorepo / multi-repo). Confined to the workspace. Default: cwd
- config: (network actions push/fetch/pull/ls-remote) git -c overrides, e.g. ["http.proxy=http://10.2.2.112:3128"] for blocked remotes
- path: (diff/log/add/commit/checkout/restore/rm) file or directory to scope / stage / restore
- ref: (show/diff/checkout/reset/revert/merge/cherry-pick/tag:create/branch:create) commit/branch/ref; (push/pull/fetch) the branch or tag (space-separated for multiple)
- name: (branch/tag) the branch or tag name
- remote: (push/fetch/pull) remote name (e.g. origin); default: current upstream
- tags: (push) also push all tags (--tags)
- staged: (diff) staged changes; (restore) the staged copy
- count: (log) number of commits (default 10)
- oneline: (log) one-line-per-commit
- message: (commit) commit message — required; (stash:push) stash message
- mode: (reset) soft / mixed / hard — hard snapshots the tree first + needs confirmation
- tagAction: (tag) list / create / delete — branchAction: (branch) list / create / delete / switch — stashAction: (stash) push / pop / list
- filter: (read-only actions) keep only output lines matching this regex (case-insensitive)
- checkpointAction: (checkpoint) list / create / rewind / cat / versions — checkpointId: snapshot id (rewind/cat)
