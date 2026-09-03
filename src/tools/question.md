Ask the user a question and wait for their response. Use when the task is ambiguous, you need a design decision, or you're stuck and need human judgment.

Parameters:
- question (required): The question to ask the user
- options: Array of single-choice options for the user to pick from (optional). MUST be plain strings, e.g. ["A", "B", "C"] — never objects.

Notes:
- The agent loop pauses until the user answers
- The answer is injected as the next user message
- Use sparingly — prefer making reasonable decisions when possible
- After receiving an answer about a design convention, tool preference, or recurring pattern: save it with the memory tool (action: put). This prevents asking the same question in future sessions — the user shouldn't have to repeat their preferences.
