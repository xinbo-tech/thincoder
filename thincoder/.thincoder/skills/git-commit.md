# git-commit — commit code with the project's conventions

## When to Use
When the user asks to commit, create a PR, or when you've completed a feature and want to wrap up.

## Workflow
1. Run `git status` to see what changed
2. Run `git diff --stat` for a summary
3. Write a concise commit message: `<type>: <摘要>`
   - Types: feat, fix, release, docs, refactor, test, chore
   - English single line, keep it short
4. Commit with `git commit -m "message"`
5. Never push unless user explicitly says "push"

## Rules
- Never commit until changes are tested (`npm test` passing)
- Never commit secrets (.env, keys, tokens)
- Never amend pushed commits
- One logical change per commit
