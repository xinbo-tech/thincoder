Load a project skill from .thincoder/skills/.
Skills contain reusable instructions, workflows, or reference material.
Use this when the user references a skill by name, or when a task matches a known skill's description.
Call with action='list' to see available skills; call with action='load' and name=<skill> to activate one.
Returns the skill list ('list'), the load confirmation ('load' — instructions arrive in the next message), or Error: ... with the available skills.
