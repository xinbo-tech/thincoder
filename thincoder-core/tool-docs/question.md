Ask the user a question and wait for their response. Use when the task is ambiguous, you need a design decision, or you're stuck and need human judgment.

Parameters:
- question (required): The question to ask the user
- options: Array of single-choice options for the user to pick from (optional). MUST be plain strings, e.g. ["A", "B", "C"] — never objects.

Notes:
- The agent loop pauses until the user answers
- The answer is injected as the next user message
- Returns the user's answer — the chosen option or free text — as the next message; the loop resumes when it arrives.
{{inject:question-ui-face}}
- Use sparingly — prefer making reasonable decisions when possible
- Ask ONE question per call — never bundle multiple sub-questions into one question string; ask the next one after the answer arrives.
- Keep the question text short — one or two sentences. Background, context, and analysis belong in your normal reply text, NOT in the question.
- Routine confirmations (confirm gates) belong in your plain reply text — the user answers in their next message. Use this tool ONLY when you need the user's decision or input to proceed.
- Ask here when no default can carry the work forward (new scope, a ruling on a criterion) — this blocks; when a reasonable default exists, ask in your ordinary reply text and keep going — a reply arriving while you work steers the work from there.
- After receiving an answer about a design convention, tool preference, or recurring pattern: save it with the memory tool (action: put). This prevents asking the same question in future sessions — the user shouldn't have to repeat their preferences.
