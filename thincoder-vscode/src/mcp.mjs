/**
 * mcp.mjs — MCP (Model Context Protocol) client
 *
 * Re-exports from src/mcp/index.mjs for backward compatibility.
 * See src/mcp/ for the split transport modules:
 *   - src/mcp/stdio.mjs  — stdioTransport()
 *   - src/mcp/http.mjs   — httpTransport()
 *   - src/mcp/index.mjs  — mcpConnect, mcpListTools, mcpCallTool, etc.
 *   - src/mcp/utils.mjs  — shared utilities and constants
 */

export * from "./mcp/index.mjs"
