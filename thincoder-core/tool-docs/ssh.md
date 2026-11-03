Open and drive a persistent interactive SSH session (remote login shell) on a host, and move single files to or from that host (`put` / `get`).

A session survives across tool calls. Password hosts get a credential window — the value never appears in tool args or results (an explicit opt-in can store it as ciphertext on this machine).

**Route to ssh instead of bash:**
- a one-shot non-interactive command over ssh → `bash` with `ssh host <command>` (cheaper, no session)
- an interactive shell that must survive several calls (network device CLI, interactive prompts) → ssh
- one file to or from a host you already have a session on → `put` / `get` (they reuse the session's host and credential chain; `bash scp` cannot reach that chain, so a password host would ask again or fail)
- a whole directory tree, a resumable transfer or a progress bar → not this tool (single file only)

Parameters:
- action (required): connect | send | read | secret_input | close | list | credentials | forget | put | get
- host: connect / forget — target host (IP or name)
- user: connect — login user (optional: your local ssh config decides, else the user recorded for this host locally)
- port: connect / forget — TCP port (optional, default 22)
- label: connect — short human label for this session (optional); secret_input — label for the value being sent
- promptPattern: connect — regex that marks the shell prompt as ready (optional; the default recognises lines ending in `#` `>` `$` `%`)
- identityFile: connect — private-key path to offer as `-i` (`~` expands); remembered for this host and reused when omitted (optional)
- id: send / read / secret_input / close / put / get — session id from connect (`ssh#N`)
- data: send — text to type into the session (a trailing newline is passed as-is; otherwise Enter is sent as `\r`)
- settle: send — wait for the ready verdict before returning (default true); false returns right after the bytes are written
- timeoutMs: send / read — wait budget override (default 60000; the wait ends as soon as the device is waiting for input — a prompt, `--More--`, a y/n or password prompt); put / get — transfer budget override (default 600000; on expiry the process tree is killed)
- maxChars: read — return-window override (default 8000): head 60% + a note + tail 40%, and the omitted middle stays in the session for the next read
- localPath: put / get — local file path (`~` expands; a file, never a directory)
- remotePath: put / get — path of that file on the session host (e.g. `/flash/img.bin`)
- overwrite: get — replace an existing local file (default false: an existing target is refused, never overwritten silently). put follows scp's own semantics: a same-named remote file is replaced
- protocol: put / get — `scp` (classic SCP protocol, the default, what network devices speak) | `sftp` (the SFTP subsystem, for hosts that only offer that). There is no automatic fallback between them
- ledger: the in-flight ledger row this call serves (`"#N"` or `"N"`) — required for `get` in engineering mode (the same write gate `write` goes through; `put` writes the remote host and needs no number)

Output:
- connect / send / read / secret_input / close / list / put / get results start with the session status line: `[ssh (ssh#3) 10.0.0.5 — ready · idle 3s]`
- connect returns the first screen; send returns the round's output plus the ready verdict (answer prompt such as `--More--` | prompt matched | timeout); read returns what arrived since the last read
- put / get return the status line, then exactly one more line — `put <localPath> → <remotePath> · N bytes · exit 0` (and the mirrored form for get). The file's content never enters the context: the bytes travel over the disk only, never through a result, a log or a message. On failure you get an `Error:` line plus the tail of scp's stderr (≤ 600 characters), with the exit code named

Notes:
- Key-first: keys, your ssh config and ssh-agent are always tried before any saved credential — a connect succeeds without a window
  when a key works, and the credential store is not read at all in that case. To make a password host prompt-free, install a key once:
  `ssh-keygen -t ed25519` (if you have none), then `ssh-copy-id user@host` (or append `id_ed25519.pub` to the host's
  `~/.ssh/authorized_keys`), then reconnect.
- Credential discipline: the password is asked for in a window and reaches ssh only through its child-process environment — never in tool
  args, never echoed in a result, never stored in plaintext. Any captured output containing that value (or a value given to secret_input)
  is scrubbed from the returned text and from the session log.
- Saving a credential is opt-in and belongs to `connect`: that credential window carries a `save` checkbox (off by default). When checked and authentication succeeds,
  the password is stored encrypted with your OS user account (Windows DPAPI) in a per-user file outside the repository; the store holds only ciphertext. A saved credential is reused silently — the next connect skips the window, and only after key authentication fails.

  The residual risk is honest: another process running as the same logged-in user can decrypt it; this protects the file at rest, not a compromised account. Saving is Windows-only for now; on other platforms the checkbox does not appear and the window keeps asking.
- Fail-soft: an unreadable/undecryptable entry, a damaged store or a missing backend falls back to the credential window (the connection is
  not broken; undecryptable entries are kept). If the server rejects a saved credential it is deleted and the window is shown. A failed save
  never affects the connection.
- secret_input is for device prompts (enable password, sudo, key passphrases): it opens the same kind of window, writes the value plus Enter, and returns only the output — the value is never shown.
- Sessions: at most 4 live at once (a connect beyond the cap is refused — close one first). A session idle for 600s with no send/read is closed automatically. `close` ends it (stdin EOF → 1.5s grace → the process tree is killed). Ctrl+I (interrupt) does not kill sessions; a user Stop does.
- Output is a cleaned text stream: terminal escape sequences and CRLF noise are stripped, and the session log holds the same cleaned text as the result. Each return is a window (8000 chars: head + a note + tail); the omitted middle stays in the session, so another read collects it and a large configuration comes back in full.
- Not for full-screen terminal UIs (vim/top/screen): output is read as a text stream — paged output such as `--More--` is shown as-is, not driven for you.
- Transfers are binary safe and single-file: no recursive directory sync, no resume, no progress bar, and the parameters take files only (a directory is not a valid `localPath` / `remotePath`). That status line under the header is the whole receipt — do not expect a byte-by-byte progress.
- `get` never overwrites silently and never creates directories: an existing local file is refused unless you pass `overwrite:true`, and the local parent directory must already exist (create it first — a mistyped `get` would otherwise land somewhere you cannot see).
- `put` on a password host re-runs the same credential decision as connect: keys first, then the saved credential (no window), then the credential window. That transfer window only asks for user / password — it carries no save checkbox (storing a credential belongs to `connect`); a session built by typing a password into the window without saving it has no password kept, so the next transfer asks again.
- If a transfer is killed at `timeoutMs`, a `get` removes the partial local file only when it was actually written by that transfer (an existing file scp never touched is kept — the receipt then says the target was left as it stands); after a `put` the remote host may keep a partial file — this tool does not clean it (resend the whole file with `overwrite:true`, or delete it on the host).
- Ready means the device is waiting for you, not that output stopped: a prompt or an answer prompt (`--More--`, y/n, password) ends the wait, and a slow operation that goes quiet keeps waiting instead of returning half of its output. If a device's prompt does not look like a shell prompt, pass `promptPattern` on connect — otherwise each command waits out the full timeout.
- Host keys follow your local ssh config — the tool never rewrites known_hosts. A changed or untrusted key stops the connect with a readable error before any credential is asked for.
- read / list / credentials are read-only (no approval prompt); connect / send / secret_input / close / forget / put / get pass the approval gate like any side-effecting tool, and secret_input shows a masked placeholder — the value itself is never in the approval text. A transfer's approval text names both ends (`localPath` → `remotePath`) and never the file's content.
- credentials lists saved entries (host / user / saved / last used — never a value); forget deletes the entry for a host (and optional port) and is idempotent — the next connect asks in the window again.
- Not for port forwarding (`ssh -L` / `-R`) — run that through `bash`.

Availability: where the end has no UI to collect a credential (headless / ACP), connecting to a password host fails with a readable error — use keys or an ssh-agent there.
