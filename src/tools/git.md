Run a git command. Use this to see uncommitted changes, staged changes, diff against a ref, recent commits, or manage checkpoints. Only works inside a git repository.
- action='diff': Show unified diff — what changed since last commit. Set staged=true for staged-only diff, ref=<ref> to compare against a specific commit/branch, path=<dir> to scope to a file or directory.
- action='status': Show working tree state — staged, unstaged, untracked files, and conflicts. Returns categorized lists.
- action='log': Show recent commit history. Set count to limit, oneline=true for compact format, path=<file> to see history of one file.
- action='show': Show a commit's details (--stat). Set ref=<ref> to inspect a specific commit (default HEAD).
- action='checkpoint': Manage git-based snapshots. Use checkpointAction to choose: list (overview), create (snapshot now), rewind (restore snapshot by id), cat (read a file from a snapshot).
- action='rm': Untrack a file/directory (git rm --cached — keeps the file on disk). path is required.
- action='commit': Stage all changes and commit. message is required. Confirms with the user (outward action).
- action='push': Push the current branch to the remote. Confirms with the user (outward action).

Parameters:
- action (required): diff / status / log / show / checkpoint / rm / commit / push
- staged: (diff) Show staged changes instead of working tree
- path: (diff/log/checkpoint:cat/checkpoint:rewind/rm) File or directory to scope to
- ref: (show) Commit ref to inspect (default HEAD)
- count: (log) Number of commits (default 10)
- oneline: (log) One-line-per-commit format
- message: (commit) Commit message — required for commit
- filter: Optional — keep only status/diff/log output lines matching this regex (case-insensitive)
- checkpointAction: (checkpoint) list snapshots / create one / restore by id / read file from snapshot
- checkpointId: (checkpoint) Snapshot id — required for rewind and cat; optional for list (shows file tree)