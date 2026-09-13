/**
 * tools/lsp.mjs — LSP (Language Server Protocol) code intelligence tool
 * Zero-dependency JSON-RPC 2.0 over stdio client.
 *
 * Provides: go-to-definition, find-references, hover info, document symbols, diagnostics.
 * Lazy-starts language servers on first call. Configurable via config.json lsp.servers.
 *
 * Config format:
 *   "lsp": {
 *     "servers": {
 *       "typescript": { "command": "typescript-language-server", "args": ["--stdio"] },
 *       "python": { "command": "pyright-langserver", "args": ["--stdio"] }
 *     }
 *   }
 */

import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join, extname } from "node:path"
import { DESC } from "./shared.mjs"

// ---- JSON-RPC transport over stdio ----

/** Send a JSON-RPC request to the server via stdin */
function send(proc, message) {
  const body = JSON.stringify(message)
  const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`
  proc.stdin.write(header + body)
}

/** Read one JSON-RPC message from stdout. Returns parsed JSON, or null on EOF. */
function readMessage(proc) {
  return new Promise((resolve) => {
    let header = ""
    let contentLength = -1

    const onData = (chunk) => {
      if (contentLength < 0) {
        header += chunk.toString()
        const match = header.match(/Content-Length: (\d+)\r\n\r\n/)
        if (match) {
          contentLength = parseInt(match[1])
          const bodyStart = header.indexOf("\r\n\r\n") + 4
          const remaining = header.slice(bodyStart)
          header = ""
          if (remaining.length >= contentLength) {
            proc.stdout.removeListener("data", onData)
            try { resolve(JSON.parse(remaining.slice(0, contentLength))) } catch { resolve(null) }
            return
          }
          // Need more data — leave remaining in a buffer-like state
          proc.stdout.removeListener("data", onData)
          readBody(proc, remaining, contentLength).then(resolve)
        }
      }
    }

    proc.stdout.on("data", onData)
  })
}

function readBody(proc, buf, targetLen) {
  return new Promise((resolve) => {
    const onData = (chunk) => {
      buf += chunk.toString()
      if (buf.length >= targetLen) {
        proc.stdout.removeListener("data", onData)
        try { resolve(JSON.parse(buf.slice(0, targetLen))) } catch { resolve(null) }
      }
    }
    proc.stdout.on("data", onData)
  })
}

/** Send a request and wait for the matching response */
async function request(proc, method, params, id) {
  send(proc, { jsonrpc: "2.0", id, method, params })
  while (true) {
    const msg = await readMessage(proc)
    if (!msg) return null
    if (msg.id === id) return msg
    // Store notifications for later retrieval (diagnostics)
    if (msg.method === "textDocument/publishDiagnostics") {
      proc._diagnostics = proc._diagnostics || {}
      proc._diagnostics[msg.params.uri] = msg.params.diagnostics
    }
  }
}

/** Send a notification (no response expected) */
function notify(proc, method, params) {
  send(proc, { jsonrpc: "2.0", method, params })
}

// ---- Language server process management ----

const servers = new Map() // ext → { proc, rootUri, ready }

/** Convert file path to file:// URI */
function toUri(absPath) {
  return "file:///" + absPath.replace(/\\/g, "/").replace(/^([A-Z]):/, (_, d) => d.toLowerCase() + "%3A")
}

/** Resolve which language server to use for a file extension */
function resolveServerConfig(config, ext) {
  const map = {
    ".js": "typescript", ".mjs": "typescript", ".cjs": "typescript",
    ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript", ".cts": "typescript",
    ".py": "python", ".pyi": "python",
    ".rs": "rust",
    ".go": "go",
  }
  const key = map[ext] || ext.slice(1)
  const servers = config?.lsp?.servers ?? {}
  return servers[key] || null
}

/** Start or reuse a language server for the given file */
async function getServer(cwd, filePath, config) {
  const ext = extname(filePath).toLowerCase()
  const srvConfig = resolveServerConfig(config, ext)
  if (!srvConfig) return null

  const abs = join(cwd, ...filePath.split("/"))
  if (!existsSync(abs)) return null

  const rootUri = toUri(cwd)
  const key = `${ext}:${cwd}`
  let entry = servers.get(key)

  if (entry && entry.ready) return entry

  // Start new server
  const proc = spawn(srvConfig.command, srvConfig.args || [], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })

  proc.stderr.on("data", () => {}) // suppress stderr noise

  entry = { proc, rootUri, ready: false }
  servers.set(key, entry)

  // Initialize handshake
  const initResult = await request(proc, "initialize", {
    processId: null,
    rootUri,
    capabilities: {
      textDocument: {
        definition: { linkSupport: false },
        references: {},
        hover: { contentFormat: ["plaintext"] },
        documentSymbol: { hierarchicalDocumentSymbolSupport: true },
      },
    },
    workspace: {},
  }, 1)

  if (!initResult) {
    proc.kill()
    servers.delete(key)
    return null
  }

  notify(proc, "initialized", {})
  entry.ready = true
  return entry
}

/** Notify the server that a file is open (required before queries) */
async function ensureOpen(proc, uri, ext) {
  const langMap = { ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript", ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript", ".cts": "typescript", ".py": "python", ".rs": "rust", ".go": "go" }
  const languageId = langMap[ext] || ext.slice(1)
  notify(proc, "textDocument/didOpen", {
    textDocument: {
      uri,
      languageId,
      version: 1,
      text: readFileSync(uri.replace(/^file:\/\/\//, "").replace(/%3A/, ":").replace(/\//g, "\\"), "utf8"),
    },
  })
}

// ---- Tool definition ----

export const lspTool = {
  name: "lsp",
  description: DESC("lsp"),
  parameters: {
    type: "object",
    properties: {
      subcommand: {
        type: "string",
        enum: ["definition", "references", "hover", "symbols", "diagnostics"],
        description: "LSP operation to perform",
      },
      uri: {
        type: "string",
        description: "Target file path (relative to project root)",
      },
      line: {
        type: "integer",
        description: "1-based line number (for definition/references/hover)",
      },
      character: {
        type: "integer",
        description: "1-based character offset (for definition/references/hover)",
      },
    },
    required: ["subcommand", "uri"],
  },
  readonly: true,

  async execute(args, ctx) {
    const config = ctx.agent?.config ?? {}
    const cwd = ctx.cwd
    const filePath = args.uri

    try {
      const entry = await getServer(cwd, filePath, config)
      if (!entry) {
        const ext = extname(filePath).toLowerCase()
        return `No LSP server configured for "${ext}" files. Add one to config.json:\n"lsp": { "servers": { "${ext.slice(1)}": { "command": "...", "args": ["--stdio"] } } }`
      }

      const { proc } = entry
      const abs = join(cwd, ...filePath.split("/"))
      const uri = toUri(abs)
      const ext = extname(filePath).toLowerCase()
      await ensureOpen(proc, uri, ext)

      // Wait briefly for diagnostics to arrive
      await new Promise((r) => setTimeout(r, 300))

      switch (args.subcommand) {
        case "definition": {
          if (!args.line || !args.character) return "Error: line and character required for definition"
          const res = await request(proc, "textDocument/definition", {
            textDocument: { uri },
            position: { line: args.line - 1, character: args.character - 1 },
          }, 10)
          if (!res?.result) return "(no definition found)"
          const locs = Array.isArray(res.result) ? res.result : [res.result]
          return locs.map((l) => {
            const path = l.uri.replace(/^file:\/\/\//, "").replace(/%3A/, ":")
            return `${path}:${l.range.start.line + 1}:${l.range.start.character + 1}`
          }).join("\n")
        }

        case "references": {
          if (!args.line || !args.character) return "Error: line and character required for references"
          const res = await request(proc, "textDocument/references", {
            textDocument: { uri },
            position: { line: args.line - 1, character: args.character - 1 },
            context: { includeDeclaration: false },
          }, 10)
          if (!res?.result?.length) return "(no references found)"
          return res.result.slice(0, 50).map((l) => {
            const path = l.uri.replace(/^file:\/\/\//, "").replace(/%3A/, ":")
            return `${path}:${l.range.start.line + 1}:${l.range.start.character + 1}`
          }).join("\n") + (res.result.length > 50 ? `\n... and ${res.result.length - 50} more` : "")
        }

        case "hover": {
          if (!args.line || !args.character) return "Error: line and character required for hover"
          const res = await request(proc, "textDocument/hover", {
            textDocument: { uri },
            position: { line: args.line - 1, character: args.character - 1 },
          }, 10)
          if (!res?.result?.contents) return "(no hover info)"
          const contents = res.result.contents
          if (typeof contents === "string") return contents
          if (Array.isArray(contents)) return contents.map((c) => typeof c === "string" ? c : c.value).join("\n")
          if (contents.value) return contents.value
          return JSON.stringify(contents)
        }

        case "symbols": {
          const res = await request(proc, "textDocument/documentSymbol", {
            textDocument: { uri },
          }, 10)
          if (!res?.result?.length) return "(no symbols found)"
          function render(nodes, depth) {
            const lines = []
            for (const n of nodes) {
              const kind = n.kind != null ? ` [${symbolKind(n.kind)}]` : ""
              lines.push(`${"  ".repeat(depth)}${n.name}${kind} — L${n.range.start.line + 1}`)
              if (n.children?.length) lines.push(...render(n.children, depth + 1))
            }
            return lines
          }
          return render(res.result, 0).join("\n")
        }

        case "diagnostics": {
          const diags = proc._diagnostics?.[uri]
          if (!diags?.length) return "(no diagnostics)"
          return diags.slice(0, 30).map((d) => {
            const sev = { 1: "ERROR", 2: "WARN", 3: "INFO", 4: "HINT" }[d.severity] || "?"
            return `L${d.range.start.line + 1}: ${sev}: ${d.message}${d.code ? ` [${d.code}]` : ""}`
          }).join("\n") + (diags.length > 30 ? `\n... and ${diags.length - 30} more` : "")
        }

        default:
          return `Unknown subcommand: ${args.subcommand}`
      }
    } catch (err) {
      return `lsp error: ${err.message}`
    }
  },
}

function symbolKind(k) {
  const kinds = { 1: "file", 2: "module", 3: "namespace", 4: "package", 5: "class", 6: "method", 7: "property", 8: "field", 9: "constructor", 10: "enum", 11: "interface", 12: "function", 13: "variable", 14: "constant", 15: "string", 16: "number", 17: "boolean", 18: "array", 19: "object", 20: "key", 21: "null", 22: "enumMember", 23: "struct", 24: "event", 25: "operator", 26: "typeParameter" }
  return kinds[k] || `kind-${k}`
}
