import js from "@eslint/js"

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        // Node.js (pure Node runtime — no browser/webview globals here)
        process: "readonly", console: "readonly", Buffer: "readonly",
        TextDecoder: "readonly", TextEncoder: "readonly", URL: "readonly",
        fetch: "readonly", Headers: "readonly", Response: "readonly", Request: "readonly",
        AbortSignal: "readonly", AbortController: "readonly", DOMException: "readonly",
        FormData: "readonly", URLSearchParams: "readonly", WebSocket: "readonly",
        ReadableStream: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
        setImmediate: "readonly", clearImmediate: "readonly", // memory/code-index.mjs, tools/repomap.mjs
        performance: "readonly", // tui/agent-turn.mjs, tui/render-loop.mjs (Node global)
        queueMicrotask: "readonly", structuredClone: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-constant-condition": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-cond-assign": "warn",
      "no-redeclare": "warn",
      "no-fallthrough": "warn",
      "no-useless-escape": "warn",
      "no-control-regex": "warn",
    },
  },
  {
    files: ["test/**/*.mjs"],
    languageOptions: {
      globals: {
        // happy-dom-free webview-event constructors used in dispatchEvent tests
        Event: "readonly",
        // integration-provider.mjs uses require() in a best-effort cleanup guard
        require: "readonly",
      },
    },
  },
  {
    ignores: ["node_modules/**"],
  },
]
