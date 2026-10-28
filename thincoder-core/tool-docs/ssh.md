Open and drive a persistent interactive SSH session (remote login shell) on a host. The session survives across tool calls; password hosts get a credential window — the value never appears in tool args or results (an explicit opt-in can store it as ciphertext on this machine).

**Route to ssh instead of bash:**
- a one-shot non-interactive command over ssh → `bash` with `ssh host <command>` (cheaper, no session)
- an interactive shell that must survive several calls (network device CLI, interactive prompts) → ssh

Parameters:
- action (required): connect | send | read | secret_input | close | list | credentials | forget
- host: connect / forget — target host (IP or name)
- user: connect — login user (optional: your local ssh config decides, else the user recorded for this host locally)
- port: connect / forget — TCP port (optional, default 22)
- label: connect — short human label for this session (optional); secret_input — label for the value being sent
- promptPattern: connect — regex that marks the shell prompt as ready (optional): send/read then settle the moment the prompt appears instead of waiting out the silence window
- identityFile: connect — private-key path to offer as `-i` (`~` expands); remembered for this host and reused when omitted (optional)
- id: send / read / secret_input / close — session id from connect (`ssh#N`)
- data: send — text to type into the session (a trailing newline is passed as-is; otherwise Enter is sent as `\r`)
- settle: send — wait for the ready verdict before returning (default true); false returns right after the bytes are written
- timeoutMs: send / read — wait budget override (default 10000; the wait then returns partial output with a readable line)
- maxChars: read — return cap override (default 8000; the full output stays in the session log)

Output:
- every result starts with the session status line: `[ssh (ssh#3) 10.0.0.5 — ready · idle 3s]`
- connect returns the first screen; send returns the round's output plus the ready verdict (silence | prompt matched | timeout); read returns what arrived since the last read

Notes:
- Key-first: keys, your ssh config and ssh-agent are always tried before any saved credential — a connect succeeds without a window
  when a key works, and the credential store is not read at all in that case. To make a password host prompt-free, install a key once:
  `ssh-keygen -t ed25519` (if you have none), then `ssh-copy-id user@host` (or append `id_ed25519.pub` to the host's
  `~/.ssh/authorized_keys`), then reconnect.
- Credential discipline: the password is asked for in a window and reaches ssh only through its child-process environment — never in tool
  args, never echoed in a result, never stored in plaintext. Any captured output containing that value (or a value given to secret_input)
  is scrubbed from the returned text and from the session log.
- Saving a credential is opt-in: the credential window carries a `save` checkbox (off by default). When checked and authentication succeeds,
  the password is stored encrypted with your OS user account (Windows DPAPI) in a per-user file outside the repository; the store holds only ciphertext. A saved credential is reused silently — the next connect skips the window, and only after key authentication fails.

  The residual risk is honest: another process running as the same logged-in user can decrypt it; this protects the file at rest, not a compromised account. Saving is Windows-only for now; on other platforms the checkbox does not appear and the window keeps asking.
- Fail-soft: an unreadable/undecryptable entry, a damaged store or a missing backend falls back to the credential window (the connection is
  not broken; undecryptable entries are kept). If the server rejects a saved credential it is deleted and the window is shown. A failed save
  never affects the connection.
- secret_input is for device prompts (enable password, sudo, key passphrases): it opens the same kind of window, writes the value plus Enter, and returns only the output — the value is never shown.
- Sessions: at most 4 live at once (a connect beyond the cap is refused — close one first). A session idle for 600s with no send/read is closed automatically. `close` ends it (stdin EOF → 1.5s grace → the process tree is killed). Ctrl+I (interrupt) does not kill sessions; a user Stop does.
- Output is capped per return (8000 chars, tail kept); the full stream is always in the session log whose path connect returns.
- Not for full-screen terminal UIs (vim/top/screen): output is read as a text stream — paged output such as `--More--` is shown as-is, not driven for you.
- Host keys follow your local ssh config — the tool never rewrites known_hosts. A changed or untrusted key stops the connect with a readable error before any credential is asked for.
- read / list / credentials are read-only (no approval prompt); connect / send / secret_input / close / forget pass the approval gate like any side-effecting tool, and secret_input shows a masked placeholder — the value itself is never in the approval text.
- credentials lists saved entries (host / user / saved / last used — never a value); forget deletes the entry for a host (and optional port) and is idempotent — the next connect asks in the window again.
- Not for file transfer or port forwarding — run `scp` / `sftp` / `ssh -L` through bash.

Availability: where the end has no UI to collect a credential (headless / ACP), connecting to a password host fails with a readable error — use keys or an ssh-agent there.
