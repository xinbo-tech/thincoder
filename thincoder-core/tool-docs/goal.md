Manage a long-running autonomous goal.
action='set': create or replace the goal — must have a verifiable completion criterion (a machine-checkable proof, not vague effort).
action='complete': mark achieved — only after the criterion's check has actually passed.
action='blocked': report an impasse (requires 'reason') — only after 3 genuine attempts.
action='cancel': abandon the goal.
Returns a status line — the goal set/updated/completed/blocked/cancelled confirmation, or Error: ... with the reason.
