import { existsSync } from "node:fs"
import { basename } from "node:path"
import { ansi, C } from "./ansi.mjs"

/** /init command: detect project type, generate AGENTS.md skeleton.
 *  Extracted from slash-commands.mjs.
 *  ctx: { agent, pushLine, pushLabel } */
export async function handleInitCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  const { writeFile, readFile } = await import("node:fs/promises")
  const { join } = await import("node:path")
  const agPath = join(agent.cwd, "AGENTS.md")
  if (existsSync(agPath)) {
    pushLine(`AGENTS.md already exists: ${agPath}`, C.warn)
    return
  }

  // Detect project type and key information
  let name = basename(agent.cwd)
  let lang = "", cmds = ""

  // Node.js
  try {
    const pkg = JSON.parse(await readFile(join(agent.cwd, "package.json"), "utf8"))
    if (pkg.name) name = pkg.name
    lang = "Node.js"
    const ks = Object.keys(pkg.scripts ?? {})
    if (ks.length) cmds = ks.slice(0, 5).map(k => `- \`npm run ${k}\``).join("\n")
  } catch {}

  // Python
  if (!lang) {
    for (const f of ["requirements.txt", "pyproject.toml", "setup.py", "setup.cfg"]) {
      if (existsSync(join(agent.cwd, f))) { lang = "Python"; break }
    }
    if (lang) cmds = "- `pip install -r requirements.txt`\n- `python -m pytest`"
  }

  // Go
  if (!lang) {
    if (existsSync(join(agent.cwd, "go.mod"))) {
      lang = "Go"
      cmds = "- `go build ./...`\n- `go test ./...`"
    }
  }

  // Rust
  if (!lang) {
    if (existsSync(join(agent.cwd, "Cargo.toml"))) {
      lang = "Rust"
      cmds = "- `cargo build`\n- `cargo test`"
    }
  }

  // Java / Kotlin
  if (!lang) {
    if (existsSync(join(agent.cwd, "pom.xml"))) { lang = "Java (Maven)"; cmds = "- `mvn test`" }
    else if (existsSync(join(agent.cwd, "build.gradle")) || existsSync(join(agent.cwd, "build.gradle.kts"))) { lang = "Java/Kotlin (Gradle)"; cmds = "- `./gradlew test`" }
  }

  const lines = [
    `# AGENTS.md — ${name} Project Guide`,
    ``,
    `## Project Overview`,
    ``,
    `Brief description of what this project does.`,
    ``,
    `## Tech Stack`,
    ``,
    lang ? `- Language: ${lang}` : `- Language: (detect and fill in)`,
    `- Framework: (fill in if applicable)`,
    ``,
    `## Common Commands`,
    ``,
    cmds || `- (fill in build/test/run commands)`,
    ``,
    `## Coding Conventions`,
    ``,
    `- (fill in: naming, formatting, testing patterns)`,
    ``,
    `## Architecture Notes`,
    ``,
    `- (fill in: key modules, data flow, design decisions)`,
  ]

  const template = lines.join("\n")
  await writeFile(agPath, template, "utf8")
  pushLabel(`❯ Init`, ansi.bold + C.tool)
  pushLine(`Generated AGENTS.md → ${agPath}${lang ? ` (${lang})` : ""}`, C.tool)
  if (lang) pushLine("Tell me more about the project and I will fill in conventions and structure", C.dim)
}
